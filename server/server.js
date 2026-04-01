import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { db, dbPath } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import multer from 'multer';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as otplib from 'otplib';
const { authenticator } = otplib;
import QRCode from 'qrcode';
import crypto from 'crypto';
import * as userRoutes from './userRoutes.js';
import * as customerRoutes from './customerRoutes.js';
import * as appointmentRoutes from './appointmentRoutes.js';
import * as notificationRoutes from './notificationRoutes.js';
import * as reportRoutes from './reportRoutes.js';
import * as warrantyRoutes from './warrantyRoutes.js';
import * as customerReportRoutes from './customerReportRoutes.js';
import * as orderRoutes from './orderRoutes.js';
import * as intakeReceiptRoutes from './intakeReceiptRoutes.js';
import * as catalogRoutes from './catalogRoutes.js';
import * as automationRoutes from './automationRoutes.js';
import * as settingsRoutes from './settingsRoutes.js';
import * as supplierRoutes from './supplierRoutes.js';
import * as couponRoutes from './couponRoutes.js';
import * as employeeRoutes from './employeeRoutes.js';
import * as returnRoutes from './returnRoutes.js';
import * as expenseRoutes from './expenseRoutes.js';
import * as exportRoutes from './exportRoutes.js';
import * as auditRoutes from './auditRoutes.js';
import webhookRoutes from './webhooks.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JWT_SECRET es obligatorio — el servidor no arranca sin él
if (!process.env.JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET no está configurado en .env. El servidor no puede arrancar de forma segura.');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.set('trust proxy', 1); // Trust first proxy (e.g. Hostinger, Cloudflare)
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: { error: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos.' }
});

// Apply rate limiter to all routes
app.use('/api/', limiter);

// More strict limiter for login/auth
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 login attempts per hour
    message: { error: 'Demasiados intentos de inicio de sesión. Por favor intente en una hora.' }
});

// Middleware
// En producción: FRONTEND_URL en .env (ej: http://72.60.125.156 o https://midominio.com)
// En desarrollo: localhost:5173
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL].filter(Boolean)
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sin origin (curl, Postman, servidores internos)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS bloqueado para origen: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
// Serve static files from 'uploads' for local fallback

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Role-Based Access Control (RBAC) Middleware
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No autenticado' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Acceso denegado. Se requiere el rol: ${roles.join(' o ')}` });
        }
        next();
    };
};

// Admin-Only Middleware (Shorthand)
const requireAdmin = requireRole(['admin']);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- IMAGE UPLOAD CONFIGURATION ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

console.log('[UPLOAD] Using Local Disk Storage (Hostinger)');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo por imagen
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo se aceptan: JPG, PNG, WebP, GIF'), false);
        }
    }
});

// Upload Route
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
});

// --- EMAIL NOTIFICATION SYSTEM ---
let emailTransporter = null;

// Initialize email transporter if SMTP is configured
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    console.log('[EMAIL] Email notifications enabled');
} else {
    console.log('[EMAIL] Email notifications disabled (no SMTP config)');
}

// Send email notification to client
const sendTicketNotification = async (ticket, status) => {
    if (!emailTransporter) {
        console.log('[EMAIL] Skipping notification - no transporter configured');
        return;
    }

    const statusMessages = {
        DIAGNOSED: {
            subject: `Diagnóstico Listo - Ticket #${ticket.id}`,
            title: '🔍 Diagnóstico Completado',
            message: `Hemos completado el diagnóstico de su ${ticket.deviceType} ${ticket.brand}.`,
            details: `<strong>Diagnóstico:</strong> ${ticket.diagnosis || 'Ver detalles en tienda'}<br>
                     <strong>Costo Estimado:</strong> $${ticket.estimatedCost ? ticket.estimatedCost.toLocaleString() : 'Por confirmar'}`,
            action: 'Por favor, comuníquese con nosotros para aprobar la reparación.'
        },
        REPAIRING: {
            subject: `En Reparación - Ticket #${ticket.id}`,
            title: '🔧 Reparación en Proceso',
            message: `Su ${ticket.deviceType} ${ticket.brand} está siendo reparado por nuestros técnicos.`,
            details: 'Estamos trabajando en su equipo con el mayor cuidado y profesionalismo.',
            action: 'Le notificaremos cuando esté listo para recoger.'
        },
        READY: {
            subject: `¡Equipo Listo! - Ticket #${ticket.id}`,
            title: '✅ Reparación Completada',
            message: `¡Buenas noticias! Su ${ticket.deviceType} ${ticket.brand} está listo para recoger.`,
            details: 'La reparación ha sido completada exitosamente.',
            action: 'Puede pasar a recoger su equipo en nuestro horario de atención.'
        },
        DELIVERED: {
            subject: `Gracias por su Confianza - Ticket #${ticket.id}`,
            title: '🎉 Entrega Completada',
            message: `Gracias por confiar en La Bodega del Computador.`,
            details: 'Esperamos que su equipo funcione perfectamente.',
            action: 'Si tiene algún problema, no dude en contactarnos.'
        }
    };

    const content = statusMessages[status];
    if (!content) return;

    const htmlEmail = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${content.title}</h1>
            </div>
            <div class="content">
                <p><strong>Estimado/a ${ticket.clientName},</strong></p>
                <p>${content.message}</p>
                
                <div class="ticket-info">
                    <h3>Detalles del Ticket #${ticket.id}</h3>
                    <p><strong>Equipo:</strong> ${ticket.deviceType} ${ticket.brand} ${ticket.model}</p>
                    <p><strong>Serial:</strong> ${ticket.serial}</p>
                    <p>${content.details}</p>
                </div>
                
                <p>${content.action}</p>
                
                <p style="margin-top: 30px;">
                    <strong>La Bodega del Computador</strong><br>
                    Teléfono: ${process.env.BUSINESS_PHONE || 'Contacto'}<br>
                    Email: ${process.env.SMTP_FROM || process.env.SMTP_USER}
                </p>
            </div>
            <div class="footer">
                <p>Este es un correo automático, por favor no responder directamente.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        // Extract email from clientPhone if it contains @, otherwise skip
        const clientEmail = ticket.clientPhone && ticket.clientPhone.includes('@')
            ? ticket.clientPhone
            : null;

        if (!clientEmail) {
            console.log(`[EMAIL] No valid email for ticket #${ticket.id} (phone: ${ticket.clientPhone})`);
            return;
        }

        await emailTransporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: clientEmail,
            subject: content.subject,
            html: htmlEmail
        });

        console.log(`[EMAIL] Notification sent to ${clientEmail} for ticket #${ticket.id} (${status})`);
    } catch (error) {
        console.error('[EMAIL] Error sending notification:', error.message);
    }
};


// --- AUTH ROUTES ---

// Forgot Password - Request Reset
app.post('/api/auth/forgot-password', authLimiter, (req, res) => {
    const { email } = req.body;
    db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
        if (err || !user) return res.json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

        db.run('UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?', [token, expiry, user.id], async (err) => {
            if (err) return res.status(500).json({ error: 'Error del servidor' });

            // Send Email
            if (emailTransporter) {
                const resetUrl = `${process.env.FRONTEND_URL || 'http://72.60.125.156'}/reset-password?token=${token}`;
                await emailTransporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: email,
                    subject: 'Recuperación de Contraseña - La Bodega del Computador',
                    html: `
                        <h2>Recuperación de Contraseña</h2>
                        <p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
                        <a href="${resetUrl}" style="padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
                        <p>Este enlace expirará en 1 hora.</p>
                        <p>Si no solicitaste esto, ignora este correo.</p>
                    `
                });
            }
            res.json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });
        });
    });
});

// Reset Password - Apply Change
app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
    const { token, newPassword } = req.body;
    db.get('SELECT id FROM users WHERE resetToken = ? AND resetTokenExpiry > ?', [token, new Date().toISOString()], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Token inválido o expirado.' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.run('UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?', [hashedPassword, user.id], (err) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar contraseña' });
            res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
        });
    });
});

// Setup 2FA - Generate QR
app.post('/api/auth/setup-2fa', authenticateToken, async (req, res) => {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(req.user.email, 'La Bodega Del Computador', secret);

    QRCode.toDataURL(otpauth, (err, imageUrl) => {
        if (err) return res.status(500).json({ error: 'Error generando QR' });

        // Save temporary secret (verify before enabling)
        db.run('UPDATE users SET twoFactorSecret = ? WHERE id = ?', [secret, req.user.id], (_dbErr) => {
            res.json({ qrCode: imageUrl, secret: secret });
        });
    });
});

// Verify and Enable 2FA
app.post('/api/auth/verify-2fa', authenticateToken, (req, res) => {
    const { token } = req.body;
    db.get('SELECT twoFactorSecret FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (!user || !user.twoFactorSecret) return res.status(400).json({ error: '2FA no configurado' });

        const isValid = authenticator.check(token, user.twoFactorSecret);
        if (isValid) {
            db.run('UPDATE users SET twoFactorEnabled = 1 WHERE id = ?', [req.user.id], (_updateErr) => {
                res.json({ success: true });
            });
        } else {
            res.status(400).json({ error: 'Código inválido' });
        }
    });
});

// Login endpoint (Updated for 2FA)
app.post('/api/login', authLimiter, (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        // If 2FA is enabled, don't issue token yet
        if (user.twoFactorEnabled) {
            return res.json({
                requires2FA: true,
                tempId: user.id,
                email: user.email
            });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
});

// Login - Final 2FA Verification
app.post('/api/auth/login-2fa', authLimiter, (req, res) => {
    const { userId, token } = req.body;
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Sesión expirada' });

        const isValid = authenticator.check(token, user.twoFactorSecret);
        if (isValid) {
            const jwtToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ token: jwtToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
        } else {
            res.status(400).json({ error: 'Código 2FA incorrecto' });
        }
    });
});

// Register (Public)
app.post('/api/auth/register', authLimiter, userRoutes.publicRegister);

// Seed Admin (Check on start)
const seedAdmin = async () => {
    // Create default admin user if none exists
    db.get('SELECT * FROM users WHERE email = ?', ['admin@labodega.com'], async (err, row) => {
        if (!row) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            db.run('INSERT INTO users (name, email, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                ['Administrador', 'admin@labodega.com', hashedPassword, 'admin', 'active', new Date().toISOString()]);
            console.log('[SETUP] Default admin user created: admin@labodega.com / admin123');
        }
    });
};

// Cleanup Routine (Data Retention Policy)
const cleanupOldEvidence = () => {
    console.log('[MAINTENANCE] Running Data Retention Policy check...');
    const limitDate = new Date();
    limitDate.setMonth(limitDate.getMonth() - 8);
    const limitStr = limitDate.toISOString();

    db.run(
        "UPDATE tickets SET photosIntake = '[]' WHERE createdAt < ? AND photosIntake != '[]'",
        [limitStr],
        function (err) {
            if (err) console.error('[MAINTENANCE] Error cleaning up photos:', err);
            else if (this.changes > 0) console.log(`[MAINTENANCE] Cleaned up photos from ${this.changes} old tickets.`);
            else console.log('[MAINTENANCE] No old tickets needed cleanup.');
        }
    );
};

// Routes
// Get All Products
app.get('/api/products', (req, res) => {
    // Add column if not exists (quick migration hack for dev)
    db.run("ALTER TABLE products ADD COLUMN builderCategory TEXT", (_err) => {
        // Ignore error if column exists
    });

    db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) {
            console.error('[API] Error in GET /api/products:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        // Parse boolean/json fields if necessary
        const products = rows.map(p => ({
            ...p,
            featured: p.featured === 1,
            specs: JSON.parse(p.specs || '{}'),
            builderCategory: p.builderCategory || null
        }));
        res.json(products);
    });
});

// Create/Update/Delete Product
app.post('/api/products', authenticateToken, requireRole(['admin', 'vendedor']), (req, res) => {
    const { name, price, category, image, stock, minStock, supplierEmail, description, featured, specs, builderCategory } = req.body;
    const specsJson = typeof specs === 'object' ? JSON.stringify(specs) : (specs || '{}');
    const sql = `INSERT INTO products (name, price, category, image, stock, minStock, supplierEmail, description, featured, specs, builderCategory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [name, price, category, image, stock, minStock || 2, supplierEmail || null, description || null, featured ? 1 : 0, specsJson, builderCategory || null];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            id: this.lastID,
            ...req.body
        });
    });
});

// Update Product
app.put('/api/products/:id', authenticateToken, requireRole(['admin', 'vendedor']), (req, res) => {
    const { name, price, category, image, stock, minStock, supplierEmail, description, featured, specs, builderCategory } = req.body;

    // Dynamic Update
    let updates = [];
    let params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (price) { updates.push('price = ?'); params.push(price); }
    if (category) { updates.push('category = ?'); params.push(category); }
    if (image) { updates.push('image = ?'); params.push(image); }
    if (stock !== undefined) { updates.push('stock = ?'); params.push(stock); }
    if (minStock !== undefined) { updates.push('minStock = ?'); params.push(minStock); }
    if (supplierEmail !== undefined) { updates.push('supplierEmail = ?'); params.push(supplierEmail); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description || null); }
    if (featured !== undefined) { updates.push('featured = ?'); params.push(featured ? 1 : 0); }
    // Update specs (serialize object to JSON string)
    if (specs !== undefined) {
        const specsJson = typeof specs === 'object' ? JSON.stringify(specs) : (specs || '{}');
        updates.push('specs = ?');
        params.push(specsJson);
    }
    // Update builderCategory (allow setting to null/empty)
    updates.push('builderCategory = ?'); params.push(builderCategory || null);

    params.push(req.params.id);

    const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

// --- TICKETS API ---

// Get All Tickets
app.get('/api/tickets', authenticateToken, requireRole(['admin', 'técnico', 'vendedor']), (req, res) => {
    const query = `
        SELECT t.*, u.name as assignedToName 
        FROM tickets t 
        LEFT JOIN users u ON t.assignedTo = u.id 
        ORDER BY t.id DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Parse photos and quotes
        const tickets = rows.map(t => ({
            ...t,
            photosIntake: t.photosIntake ? JSON.parse(t.photosIntake) : [],
            quoteItems: t.quoteItems ? JSON.parse(t.quoteItems) : [],
            approvedByClient: t.approvedByClient === 1
        }));
        res.json(tickets);
    });
});

// Create Ticket (Intake)
app.post('/api/tickets', authenticateToken, requireRole(['admin', 'técnico', 'vendedor']), (req, res) => {
    const { clientName, clientPhone, deviceType, brand, model, serial, issueDescription, assignedTo } = req.body;
    const sql = `INSERT INTO tickets (clientName, clientPhone, deviceType, brand, model, serial, issueDescription, status, assignedTo, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, 'RECEIVED', ?, ?)`;
    const params = [clientName, clientPhone, deviceType, brand, model, serial, issueDescription, assignedTo || null, new Date().toISOString()];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, ...req.body, status: 'RECEIVED' });
    });
});

// Update Ticket (Diagnosis, Status, Approval) - Admin/Tech Service Only
app.put('/api/tickets/:id', authenticateToken, requireRole(['admin', 'técnico', 'vendedor']), (req, res) => {
    const { status, diagnosis, estimatedCost, technicianNotes, approvedByClient, assignedTo } = req.body;

    // First fetch old ticket to evaluate status shifts
    db.get('SELECT status, quoteItems FROM tickets WHERE id = ?', [req.params.id], async (err, oldTicket) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!oldTicket) return res.status(404).json({ error: 'Ticket not found' });

        // Evaluate Inventory Deduction
        // If transitioning into REPAIRING (or READY directly) and wasn't before, we deduct components.
        const shouldDeduct = status && 
                             !['REPAIRING', 'READY', 'DELIVERED'].includes(oldTicket.status) && 
                             ['REPAIRING', 'READY', 'DELIVERED'].includes(status);

        let parsedQuoteItems = [];
        try {
            // Prefer incoming quoteItems, fallback to ones already saved
            parsedQuoteItems = req.body.quoteItems || (oldTicket.quoteItems ? JSON.parse(oldTicket.quoteItems) : []);
        } catch(e) {}

        if (shouldDeduct && parsedQuoteItems.length > 0) {
            // Pre-check stock (MySQL y SQLite validación lógica)
            for (let item of parsedQuoteItems) {
                const prod = await new Promise((resolve) => {
                    db.get('SELECT stock FROM products WHERE id = ?', [item.id], (_, row) => resolve(row));
                });
                if (!prod || prod.stock < item.quantity) {
                    return res.status(400).json({ error: `Inventario insuficiente para el repuesto: ${item.name}` });
                }
            }

            // Deduct stock
            for (let item of parsedQuoteItems) {
                await new Promise((resolve) => {
                    db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id], resolve);
                });
            }
        }

        // Proceed to update the ticket
        let updates = [];
        let params = [];

        if (status) { updates.push('status = ?'); params.push(status); }
        if (diagnosis) { updates.push('diagnosis = ?'); params.push(diagnosis); }
        if (estimatedCost !== undefined) { updates.push('estimatedCost = ?'); params.push(estimatedCost); }
        if (technicianNotes !== undefined) { updates.push('technicianNotes = ?'); params.push(technicianNotes); }
        if (req.body.quoteItems) { updates.push('quoteItems = ?'); params.push(JSON.stringify(req.body.quoteItems)); }
        if (req.body.photosIntake) { updates.push('photosIntake = ?'); params.push(JSON.stringify(req.body.photosIntake)); }
        if (approvedByClient !== undefined) { updates.push('approvedByClient = ?'); params.push(approvedByClient ? 1 : 0); }
        if (assignedTo !== undefined) { updates.push('assignedTo = ?'); params.push(assignedTo || null); }

        updates.push('updatedAt = ?'); params.push(new Date().toISOString());
        params.push(req.params.id);

        const sql = `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`;

        db.run(sql, params, function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }

            // Send email notification if status changed
            if (status && ['DIAGNOSED', 'REPAIRING', 'READY', 'DELIVERED'].includes(status) && status !== oldTicket.status) {
                db.get('SELECT * FROM tickets WHERE id = ?', [req.params.id], (err, ticket) => {
                    if (!err && ticket) {
                        sendTicketNotification(ticket, status).catch(console.error);
                    }
                });
            }

            res.json({ success: true });
        });
    }); // Closes db.get
}); // Closes app.put

// Delete Product (Admin only)
app.delete('/api/products/:id', authenticateToken, requireAdmin, (req, res) => {
    db.run('DELETE FROM products WHERE id = ?', req.params.id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

// --- USER MANAGEMENT ROUTES ---
// Get only technicians (for ticket assignment, accessible by anyone handling tickets)
app.get('/api/technicians', authenticateToken, requireRole(['admin', 'técnico', 'vendedor']), (req, res) => {
    db.all('SELECT id, name, email FROM users WHERE role = ?', ['técnico'], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/users', authenticateToken, requireAdmin, userRoutes.getUsers);
app.get('/api/users/:id', authenticateToken, requireAdmin, userRoutes.getUser);
app.post('/api/users', authenticateToken, requireAdmin, userRoutes.createUser);
app.put('/api/users/:id', authenticateToken, requireAdmin, userRoutes.updateUser);
app.delete('/api/users/:id', authenticateToken, requireAdmin, userRoutes.deleteUser);
app.get('/api/users/activity/log', authenticateToken, requireAdmin, userRoutes.getUserActivity);

// Create Activity Log (Audit)
app.post('/api/audit/log', authenticateToken, (req, res) => {
    const { action, module, details } = req.body;
    const userId = req.user.id;
    const timestamp = new Date().toISOString();

    const sql = `INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)`;
    const params = [userId, action, module, details, timestamp];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// --- CUSTOMER MANAGEMENT ROUTES ---
app.get('/api/customers', authenticateToken, requireRole(['admin', 'vendedor', 'técnico']), customerRoutes.getCustomers);
app.get('/api/customers/search', authenticateToken, requireRole(['admin', 'vendedor', 'técnico']), customerRoutes.searchCustomers);
app.get('/api/customers/:id', authenticateToken, requireRole(['admin', 'vendedor', 'técnico']), customerRoutes.getCustomer);
app.post('/api/customers', authenticateToken, requireRole(['admin', 'vendedor', 'técnico']), customerRoutes.createCustomer);
app.put('/api/customers/:id', authenticateToken, requireRole(['admin', 'vendedor']), customerRoutes.updateCustomer);
app.delete('/api/customers/:id', authenticateToken, requireAdmin, customerRoutes.deleteCustomer);

// --- APPOINTMENT MANAGEMENT ROUTES ---
app.get('/api/appointments', authenticateToken, requireRole(['admin', 'vendedor', 'técnico', 'gerente']), appointmentRoutes.getAppointments);
app.get('/api/appointments/range', authenticateToken, requireRole(['admin', 'vendedor', 'técnico', 'gerente']), appointmentRoutes.getAppointmentsByDateRange);
app.get('/api/appointments/:id', authenticateToken, requireRole(['admin', 'vendedor', 'técnico', 'gerente']), appointmentRoutes.getAppointment);
app.post('/api/appointments', authenticateToken, requireRole(['admin', 'vendedor', 'técnico', 'gerente']), appointmentRoutes.createAppointment);
app.put('/api/appointments/:id', authenticateToken, requireRole(['admin', 'vendedor', 'técnico', 'gerente']), appointmentRoutes.updateAppointment);
app.delete('/api/appointments/:id', authenticateToken, requireAdmin, appointmentRoutes.deleteAppointment);

// --- NOTIFICATION ROUTES ---
app.get('/api/notifications', authenticateToken, requireRole(['admin', 'vendedor', 'técnico']), notificationRoutes.getNotifications);
app.get('/api/notifications/unread-count', authenticateToken, requireRole(['admin', 'vendedor', 'técnico']), notificationRoutes.getUnreadCount);
app.put('/api/notifications/:id/read', authenticateToken, requireRole(['admin', 'vendedor', 'técnico']), notificationRoutes.markAsRead);
app.put('/api/notifications/mark-all-read', authenticateToken, requireRole(['admin', 'vendedor', 'técnico']), notificationRoutes.markAllAsRead);
app.delete('/api/notifications/:id', authenticateToken, requireRole(['admin', 'vendedor', 'técnico']), notificationRoutes.deleteNotification);

// --- REPORT ROUTES ---
app.get('/api/reports/sales', authenticateToken, requireRole(['admin', 'gerente']), reportRoutes.getSalesReport);
app.get('/api/reports/inventory', authenticateToken, requireRole(['admin', 'gerente']), reportRoutes.getInventoryReport);
app.get('/api/reports/service', authenticateToken, requireRole(['admin', 'gerente', 'técnico']), reportRoutes.getServiceReport);
app.get('/api/reports/customers', authenticateToken, requireRole(['admin', 'gerente', 'vendedor']), reportRoutes.getCustomerAnalytics);
app.get('/api/reports/top-products', authenticateToken, requireRole(['admin', 'gerente', 'vendedor']), reportRoutes.getTopProducts);
app.get('/api/reports/appointments', authenticateToken, requireRole(['admin', 'vendedor', 'técnico']), reportRoutes.getAppointmentStats);
app.get('/api/reports/dashboard', authenticateToken, requireRole(['admin', 'gerente']), reportRoutes.getDashboardStats);

// --- WARRANTY ROUTES ---
app.get('/api/warranties', authenticateToken, requireRole(['admin', 'técnico', 'vendedor']), warrantyRoutes.getWarranties);
app.get('/api/warranties/:id', authenticateToken, requireRole(['admin', 'técnico', 'vendedor']), warrantyRoutes.getWarranty);
app.post('/api/warranties', authenticateToken, requireRole(['admin', 'técnico']), warrantyRoutes.createWarranty);
app.put('/api/warranties/:id', authenticateToken, requireRole(['admin', 'técnico']), warrantyRoutes.updateWarranty);
app.delete('/api/warranties/:id', authenticateToken, requireAdmin, warrantyRoutes.deleteWarranty);
app.post('/api/warranties/claims', authenticateToken, requireRole(['admin', 'técnico']), warrantyRoutes.createClaim);
app.put('/api/warranties/claims/:id/resolve', authenticateToken, requireRole(['admin', 'técnico']), warrantyRoutes.resolveClaim);

// --- EVIDENCE ROUTES (DB STORAGE) ---
app.post('/api/upload-evidence/:ticketId', authenticateToken, upload.single('image'), (req, res) => {
    const { ticketId } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    try {
        // Convert file to Base64 (using already-imported `fs` — ESM safe)
        const bitmap = fs.readFileSync(req.file.path);
        const base64Image = bitmap.toString('base64');
        const photoData = `data:${req.file.mimetype};base64,${base64Image}`;

        const sql = `INSERT INTO ticket_evidence (ticket_id, photo_data, created_at) VALUES (?, ?, ?)`;
        const params = [ticketId, photoData, new Date().toISOString()];

        db.run(sql, params, function (err) {
            // Delete temp file
            fs.unlinkSync(req.file.path);

            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, url: `/api/evidence/${this.lastID}` });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/evidence/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT photo_data FROM ticket_evidence WHERE id = ?', [id], (err, row) => {
        if (err || !row) return res.status(404).send('Image not found');

        const matches = row.photo_data.match(/^data:([A-Za-z+/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(500).send('Invalid image data');
        }

        const type = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');

        res.setHeader('Content-Type', type);
        res.send(buffer);
    });
});

// --- CUSTOMER REPORT ROUTES ---
app.get('/api/customer-reports/:ticketId', authenticateToken, customerReportRoutes.previewCustomerReport);
app.post('/api/customer-reports/send/:ticketId', authenticateToken, customerReportRoutes.sendCustomerReport);

// --- INTAKE RECEIPT ROUTES ---
app.get('/api/intake-receipts/:ticketId', authenticateToken, intakeReceiptRoutes.previewIntakeReceipt);
app.post('/api/intake-receipts/send/:ticketId', authenticateToken, intakeReceiptRoutes.sendIntakeReceipt);

// --- ORDER ROUTES ---
app.get('/api/orders', authenticateToken, orderRoutes.getOrders);
app.get('/api/orders/track/:orderNumber', orderRoutes.trackOrder);
app.get('/api/orders/:id', authenticateToken, orderRoutes.getOrder);
app.post('/api/orders', orderRoutes.createOrder); // Public for checkout (or authenticate if user logged in)
app.put('/api/orders/:id/status', authenticateToken, requireAdmin, orderRoutes.updateOrderStatus);
app.put('/api/orders/:id/cancel', authenticateToken, orderRoutes.cancelOrder);

// --- CATALOG ROUTES (For WhatsApp/n8n) ---
app.get('/api/catalog/whatsapp', catalogRoutes.getWhatsAppCatalog);

// --- AUTOMATION ROUTES ---
app.post('/api/automation/draft-cart', automationRoutes.saveCartDraft);
app.get('/api/automation/maintenance-due', authenticateToken, automationRoutes.getMaintenanceDue);
app.get('/api/automation/review-ready', authenticateToken, automationRoutes.getReviewReady);
app.get('/api/automation/inventory-alerts', authenticateToken, automationRoutes.checkInventoryAlerts);

// --- CMS SETTINGS ROUTES ---
app.get('/api/settings', settingsRoutes.getSettings);
app.put('/api/settings', authenticateToken, requireAdmin, settingsRoutes.updateSettings);

import { db, dbPath, logActivity } from './db.js';

// ... (existing code)

// --- ADMIN TOOLS ---
app.get('/api/admin/backup-db', authenticateToken, requireAdmin, (req, res) => {
    if (dbPath) {
        logActivity({
            userId: req.user.id,
            action: 'DOWNLOAD_BACKUP',
            module: 'ADMIN',
            details: 'Descarga de base de datos SQLite solicitada',
            req: req
        });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_lbdc_${timestamp}.sqlite`;
        res.download(dbPath, filename);
    } else {
        logActivity({
            userId: req.user.id,
            action: 'DOWNLOAD_BACKUP_FAILED',
            module: 'ADMIN',
            details: 'Intento de descarga de backup fallido (No SQLite)',
            req: req
        });
        res.status(400).json({ 
            error: 'La base de datos actual no es SQLite o no soporta descarga directa.',
            details: 'Si estás usando MySQL, por favor exporta los datos directamente desde el panel de control del hosting.'
        });
    }
});


// --- SUPPLIER ROUTES ---
app.get('/api/suppliers', authenticateToken, supplierRoutes.getSuppliers);
app.get('/api/suppliers/:id', authenticateToken, supplierRoutes.getSupplier);
app.post('/api/suppliers', authenticateToken, requireAdmin, supplierRoutes.createSupplier);
app.put('/api/suppliers/:id', authenticateToken, requireAdmin, supplierRoutes.updateSupplier);
app.delete('/api/suppliers/:id', authenticateToken, requireAdmin, supplierRoutes.deleteSupplier);

// --- COUPON ROUTES ---
app.get('/api/coupons', authenticateToken, couponRoutes.getCoupons);
app.get('/api/coupons/:id', authenticateToken, couponRoutes.getCoupon);
app.post('/api/coupons', authenticateToken, requireAdmin, couponRoutes.createCoupon);
app.put('/api/coupons/:id/toggle', authenticateToken, requireAdmin, couponRoutes.toggleCouponStatus);
app.delete('/api/coupons/:id', authenticateToken, requireAdmin, couponRoutes.deleteCoupon);

// --- EMPLOYEE ROUTES ---
app.get('/api/employees', authenticateToken, employeeRoutes.getEmployees);
app.get('/api/employees/payroll', authenticateToken, employeeRoutes.calculatePayroll);
app.get('/api/employees/:id', authenticateToken, employeeRoutes.getEmployee);
app.post('/api/employees', authenticateToken, requireAdmin, employeeRoutes.createEmployee);
app.put('/api/employees/:id', authenticateToken, requireAdmin, employeeRoutes.updateEmployee);
app.delete('/api/employees/:id', authenticateToken, requireAdmin, employeeRoutes.deleteEmployee);

// --- RETURN (RMA) ROUTES ---
app.get('/api/returns', authenticateToken, requireRole(['admin', 'vendedor', 'gerente']), returnRoutes.getReturns);
app.get('/api/returns/:id', authenticateToken, requireRole(['admin', 'vendedor', 'gerente']), returnRoutes.getReturn);
app.post('/api/returns', authenticateToken, requireRole(['admin', 'vendedor', 'gerente']), returnRoutes.createReturn);
app.put('/api/returns/:id/status', authenticateToken, requireRole(['admin', 'vendedor', 'gerente']), returnRoutes.updateReturnStatus);
app.delete('/api/returns/:id', authenticateToken, requireAdmin, returnRoutes.deleteReturn);

// --- EXPENSE ROUTES ---
app.get('/api/expenses', authenticateToken, requireRole(['admin', 'gerente', 'finanzas']), expenseRoutes.getExpenses);
app.get('/api/expenses/summary', authenticateToken, requireRole(['admin', 'gerente', 'finanzas']), expenseRoutes.getExpenseSummary);
app.get('/api/expenses/:id', authenticateToken, requireRole(['admin', 'gerente', 'finanzas']), expenseRoutes.getExpense);
app.post('/api/expenses', authenticateToken, requireRole(['admin', 'gerente', 'finanzas']), expenseRoutes.createExpense);
app.put('/api/expenses/:id', authenticateToken, requireRole(['admin', 'gerente', 'finanzas']), expenseRoutes.updateExpense);
app.delete('/api/expenses/:id', authenticateToken, requireAdmin, expenseRoutes.deleteExpense);

// --- EXPORT ROUTES ---
app.get('/api/export/customers', authenticateToken, requireRole(['admin', 'vendedor']), exportRoutes.exportCustomersToExcel);
app.get('/api/export/products', authenticateToken, requireRole(['admin', 'vendedor']), exportRoutes.exportProductsToExcel);
app.get('/api/export/orders', authenticateToken, requireRole(['admin', 'vendedor']), exportRoutes.exportOrdersToExcel);
app.get('/api/export/tickets', authenticateToken, requireRole(['admin', 'técnico', 'vendedor']), exportRoutes.exportTicketsToExcel);
app.get('/api/export/expenses', authenticateToken, requireRole(['admin']), exportRoutes.exportExpensesToExcel);
app.get('/api/export/pdf/report', authenticateToken, requireRole(['admin']), exportRoutes.generatePDFReport);

// --- AUDIT ROUTES ---
app.get('/api/audit/logs', authenticateToken, requireAdmin, auditRoutes.getAuditLogs);
app.get('/api/audit/stats', authenticateToken, requireAdmin, auditRoutes.getAuditStats);
app.get('/api/audit/activity/recent', authenticateToken, requireAdmin, auditRoutes.getRecentActivity);
app.get('/api/audit/activity/user/:userId', authenticateToken, requireAdmin, auditRoutes.getUserActivity);
app.get('/api/audit/export', authenticateToken, requireAdmin, auditRoutes.exportAuditLogs);

// --- n8n WEBHOOK ROUTES ---
app.use('/webhooks', webhookRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);

    // Run cleanup on start
    cleanupOldEvidence();

    // Seed Admin
    seedAdmin();

    // Schedule cleanup every 24 hours
    setInterval(cleanupOldEvidence, 24 * 60 * 60 * 1000);
});
