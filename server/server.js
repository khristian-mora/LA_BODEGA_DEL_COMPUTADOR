import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { db } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

// Modular Route Imports
import * as userRoutes from './userRoutes.js';
import * as customerRoutes from './customerRoutes.js';
import * as appointmentRoutes from './appointmentRoutes.js';
import * as notificationRoutes from './notificationRoutes.js';
import * as reportRoutes from './reportRoutes.js';
import * as intakeReceiptRoutes from './intakeReceiptRoutes.js';
import * as customerReportRoutes from './customerReportRoutes.js';
import * as orderRoutes from './orderRoutes.js';
import * as auditRoutes from './auditRoutes.js';
import * as warrantyAutomation from './warrantyAutomation.js';
import * as warrantyRoutes from './warrantyRoutes.js';
import * as automationRoutes from './automationRoutes.js';
import * as settingsRoutes from './settingsRoutes.js';
import * as supplierRoutes from './supplierRoutes.js';
import * as couponRoutes from './couponRoutes.js';
import * as employeeRoutes from './employeeRoutes.js';
import * as returnRoutes from './returnRoutes.js';
import * as expenseRoutes from './expenseRoutes.js';
import * as exportRoutes from './exportRoutes.js';
import * as productRoutes from './productRoutes.js';
import * as deliveryReceiptRoutes from './deliveryReceiptRoutes.js';
import webhookRoutes from './webhooks.js';
import { sendEmail } from './mail.js';
import { safeParse, safeStringify } from './utils.js';

// dotenv.config(); // Loaded via import 'dotenv/config' at top

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET no esta configurado en .env. El servidor no puede arrancar.');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Global Request Logger (TOP)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Middleware
app.set('trust proxy', 1);
app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:*", "http:*"],
            connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    }
}));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 2000 });
app.use('/api/', limiter);

const authLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 100 });

const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL].filter(Boolean)
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS bloqueado para origen: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

// Auth Helpers
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const requireRole = (roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    db.get('SELECT role, status FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Usuario no encontrado' });
        if (user.status !== 'active') return res.status(403).json({ error: 'Usuario inactivo' });
        if (!roles.includes(user.role)) return res.status(403).json({ error: 'Acceso denegado: rol insuficiente' });
        req.user.role = user.role;
        next();
    });
};
const requireAdmin = requireRole(['admin']);

// Storage
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const uploadDisk = multer({ 
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
    }),
    limits: { fileSize: 20 * 1024 * 1024 }
});

const uploadBuffer = multer({ 
    storage: multer.memoryStorage(), 
    limits: { fileSize: 20 * 1024 * 1024 } 
});

// --- AUTH ROUTES ---
app.post('/api/login', authLimiter, (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Credenciales invalidas' });
        if (user.twoFactorEnabled) return res.json({ requires2FA: true, tempId: user.id, email: user.email });
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
});
app.post('/api/auth/register', authLimiter, userRoutes.publicRegister);
app.post('/api/auth/forgot-password', authLimiter, userRoutes.forgotPassword);
app.post('/api/auth/reset-password', authLimiter, userRoutes.resetPassword);
app.post('/api/auth/google-login', authLimiter, userRoutes.googleLogin);

// Product routes registered below in modular section
app.post('/api/upload', authenticateToken, uploadDisk.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    res.json({ url: `/uploads/${req.file.filename}` });
});

// --- TICKETS & CUSTOMERS ---

app.get('/api/tickets', authenticateToken, (req, res) => {
    try {
        const query = `SELECT t.*, u.name as assignedToName FROM tickets t LEFT JOIN users u ON t.assignedTo = u.id ORDER BY t.id DESC`;
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('[GET TICKETS] SQL Error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json(rows.map(t => ({
                ...t,
                photosIntake: safeParse(t.photosIntake),
                quoteItems: safeParse(t.quoteItems),
                findings: safeParse(t.findings),
                recommendations: safeParse(t.recommendations),
                damagePhotos: safeParse(t.damagePhotos),
                laborItems: safeParse(t.laborItems),
                approvedByClient: t.approvedByClient === 1
            })));
        });
    } catch (error) {
        console.error('[GET TICKETS] Exception:', error);
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/tickets/:ticketId', authenticateToken, (req, res) => {
    const { ticketId } = req.params;
    const query = `SELECT t.*, u.name as assignedToName FROM tickets t LEFT JOIN users u ON t.assignedTo = u.id WHERE t.id = ?`;
    db.get(query, [ticketId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Ticket no encontrado' });
        res.json({
            ...row,
            photosIntake: safeParse(row.photosIntake),
            quoteItems: safeParse(row.quoteItems),
            findings: safeParse(row.findings),
            recommendations: safeParse(row.recommendations),
            damagePhotos: safeParse(row.damagePhotos),
            laborItems: safeParse(row.laborItems),
            approvedByClient: row.approvedByClient === 1
        });
    });
});
app.post('/api/tickets', authenticateToken, (req, res) => {
    const { clientName, clientPhone, clientEmail, clientAddress, clientIdNumber, deviceType, brand, model, serial, issueDescription, deviceConditions, assignedTo } = req.body;
    const now = new Date().toISOString();
    const sql = `INSERT INTO tickets (clientName, clientPhone, clientEmail, clientAddress, clientIdNumber, deviceType, brand, model, serial, issueDescription, deviceConditions, assignedTo, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [clientName, clientPhone, clientEmail, clientAddress || '', clientIdNumber || '', deviceType, brand, model, serial || '', issueDescription, deviceConditions || '', assignedTo || '', now], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        const ticketId = this.lastID;
        
        // Auto-create user and send email
        userRoutes.autoCreateUserForTicket({
            clientName,
            clientEmail,
            ticketId,
            deviceType,
            brand,
            model
        });

        res.json({ id: ticketId, status: 'RECEIVED' });
    });
});
app.put('/api/tickets/:id', authenticateToken, (req, res) => {
    try {
    const { 
        status, diagnosis, estimatedCost, deviceType, brand, model, 
        findings, recommendations, laborItems, laborCost, quoteItems, 
        technicianNotes, repairNotes, assignedTo, estimatedDeliveryDate, deliveredDate,
        signatureIntakeTech, signatureIntakeClient, signatureDeliveryTech, signatureDeliveryClient
    } = req.body;
    const ticketId = req.params.id;
    const now = new Date().toISOString();
    
    console.log('[TICKET PUT] Receieved data:', {
        ticketId,
        status,
        diagnosis: diagnosis?.substring?.(0, 50),
        findings: typeof findings,
        recommendations: typeof recommendations,
        laborItems: typeof laborItems,
        quoteItems: typeof quoteItems
    });

    // Validar flujo de estados del ciclo de vida
    const validTransitions = {
        'RECEIVED': ['DIAGNOSED', 'QUOTED'],
        'DIAGNOSED': ['QUOTED', 'REPAIRING'],
        'QUOTED': ['AUTHORIZED', 'REJECTED', 'READY', 'DELIVERED'],
        'AUTHORIZED': ['REPAIRING', 'READY', 'DELIVERED'],
        'REJECTED': ['READY', 'DELIVERED'],
        'REPAIRING': ['READY', 'DELIVERED'],
        'READY': ['DELIVERED'],
        'DELIVERED': []
    };

    // Obtener datos actuales para realizar una actualización parcial segura
    db.get('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, currentTicket) => {
        if (err) {
            console.error('[TICKET PUT] Error fetching current ticket:', err.message);
            return res.status(500).json({ error: err.message });
        }

        if (!currentTicket) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        const currentStatus = currentTicket.status;
        const newStatus = status || currentStatus;

        // Validar transición si el estado cambió
        if (status && status !== currentStatus) {
            const allowed = validTransitions[currentStatus] || [];
            if (!allowed.includes(status)) {
                return res.status(400).json({ 
                    error: `Transición inválida de ${currentStatus} a ${status}.`
                });
            }
        }
        
        // Mezclar datos (usar valor actual si el nuevo es undefined)
        const updateData = {
            status: newStatus,
            diagnosis: diagnosis !== undefined ? diagnosis : currentTicket.diagnosis,
            estimatedCost: estimatedCost !== undefined ? estimatedCost : currentTicket.estimatedCost,
            deviceType: deviceType !== undefined ? deviceType : currentTicket.deviceType,
            brand: brand !== undefined ? brand : currentTicket.brand,
            model: model !== undefined ? model : currentTicket.model,
            findings: findings !== undefined ? safeStringify(findings) : currentTicket.findings,
            recommendations: recommendations !== undefined ? safeStringify(recommendations) : currentTicket.recommendations,
            laborItems: laborItems !== undefined ? safeStringify(laborItems) : currentTicket.laborItems,
            laborCost: laborCost !== undefined ? laborCost : currentTicket.laborCost,
            quoteItems: quoteItems !== undefined ? safeStringify(quoteItems) : currentTicket.quoteItems,
            technicianNotes: technicianNotes !== undefined ? technicianNotes : currentTicket.technicianNotes,
            repairNotes: repairNotes !== undefined ? repairNotes : currentTicket.repairNotes,
            assignedTo: assignedTo !== undefined ? assignedTo : currentTicket.assignedTo,
            estimatedDeliveryDate: estimatedDeliveryDate !== undefined ? estimatedDeliveryDate : currentTicket.estimatedDeliveryDate,
            deliveredDate: (status === 'DELIVERED' || status === 'Entregado') && !currentTicket.deliveredDate ? new Date().toISOString() : (deliveredDate !== undefined ? deliveredDate : currentTicket.deliveredDate),
            signatureIntakeTech: signatureIntakeTech !== undefined ? signatureIntakeTech : currentTicket.signatureIntakeTech,
            signatureIntakeClient: signatureIntakeClient !== undefined ? signatureIntakeClient : currentTicket.signatureIntakeClient,
            signatureDeliveryTech: signatureDeliveryTech !== undefined ? signatureDeliveryTech : currentTicket.signatureDeliveryTech,
            signatureDeliveryClient: signatureDeliveryClient !== undefined ? signatureDeliveryClient : currentTicket.signatureDeliveryClient
        };
        
        db.run(`UPDATE tickets SET 
            status = ?, diagnosis = ?, estimatedCost = ?, deviceType = ?, brand = ?, model = ?, 
            findings = ?, recommendations = ?, laborItems = ?, laborCost = ?, quoteItems = ?,
            technicianNotes = ?, repairNotes = ?, assignedTo = ?, estimatedDeliveryDate = ?, deliveredDate = ?, 
            signatureIntakeTech = ?, signatureIntakeClient = ?, signatureDeliveryTech = ?, signatureDeliveryClient = ?,
            updatedAt = ? 
            WHERE id = ?`, 
            [
                updateData.status, updateData.diagnosis, updateData.estimatedCost, 
                updateData.deviceType, updateData.brand, updateData.model, 
                updateData.findings, updateData.recommendations, updateData.laborItems, 
                updateData.laborCost, updateData.quoteItems, updateData.technicianNotes, 
                updateData.repairNotes, updateData.assignedTo, updateData.estimatedDeliveryDate, updateData.deliveredDate,
                updateData.signatureIntakeTech, updateData.signatureIntakeClient, updateData.signatureDeliveryTech, updateData.signatureDeliveryClient,
                now, ticketId
            ], function(err) {
            if (err) {
                console.error('[TICKET PUT] SQL Error:', err.message);
                return res.status(500).json({ error: err.message });
            }

            console.log('[TICKET PUT] Update successful, status:', status);

            // AUTO-WARRANTY ACTIVATION
            // Solo si el estado cambia a 'DELIVERED' y NO proviene de un equipo RECHAZADO
            if (status === 'DELIVERED' && currentTicket.status !== 'REJECTED') {
                console.log('[WARRANTY-AUTO] Triggering automatic warranty for ticket:', ticketId);
                warrantyAutomation.createAutomatedRepairWarranty(ticketId)
                    .catch(err => console.error('[WARRANTY-AUTO] Failed to create automatic warranty:', err.message));
            }

            // Notificar cuando el ticket cambia a QUOTED (cotización lista para revisión)
            if (status === 'QUOTED') {
                db.get('SELECT * FROM tickets WHERE id = ?', [ticketId], async (err, ticket) => {
                    if (!err && ticket && ticket.clientEmail) {
                        const estimatedCost = ticket.estimatedCost || 0;
                        const laborCost = ticket.laborCost || 0;
                        const totalCost = estimatedCost + laborCost;
                        
                        await sendEmail({
                            to: ticket.clientEmail,
                            subject: `Ticket #${ticketId.toString().padStart(5, '0')} - Presupuesto Listo para Tu Revisión | LBDC`,
                            html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; text-align: center;">
                                    <h1 style="color: white; margin: 0; font-size: 24px;">Presupuesto Listo</h1>
                                    <p style="color: #c7d2fe; margin: 10px 0 0 0;">La Bodega del Computador</p>
                                </div>
                                <div style="padding: 30px; background: #f8fafc;">
                                    <p style="color: #334155; font-size: 16px;">Hola <strong>${ticket.clientName}</strong>,</p>
                                    <p style="color: #64748b;">Hemos completado el diagnóstico de tu equipo y el presupuesto está listo para tu revisión.</p>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                        <h3 style="color: #1e293b; margin: 0 0 15px 0;">Detalles del Servicio</h3>
                                        <p style="margin: 5px 0;"><strong>Ticket:</strong> #${ticketId.toString().padStart(5, '0')}</p>
                                        <p style="margin: 5px 0;"><strong>Dispositivo:</strong> ${ticket.deviceType} ${ticket.brand} ${ticket.model || ''}</p>
                                        <p style="margin: 5px 0;"><strong>Serial:</strong> ${ticket.serial || 'N/A'}</p>
                                        <p style="margin: 5px 0;"><strong>Diagnóstico:</strong> ${ticket.diagnosis || 'N/A'}</p>
                                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;">
                                        <p style="margin: 5px 0; font-size: 18px;"><strong>Presupuesto Total:</strong> $${totalCost.toLocaleString('es-CO')}</p>
                                    </div>
                                    
                                    <div style="text-align: center; margin-top: 30px;">
                                        <a href="#" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver Informe Técnico y Autorizar</a>
                                    </div>
                                </div>
                                <div style="background: #1e293b; padding: 20px; text-align: center;">
                                    <p style="color: #94a3b8; margin: 0; font-size: 12px;">© 2024 La Bodega del Computador. Todos los derechos reservados.</p>
                                </div>
                            </div>
                        `,
                            type: 'soporte'
                        });
                    }
                });
            }

            // Notificar cuando el ticket es autorizado para reparación
            if (status === 'AUTHORIZED') {
                db.get('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, ticket) => {
                    if (!err && ticket) {
                        console.log('[TICKET PUT] Broadcasting AUTHORIZED notification');
                        notificationRoutes.broadcastNotification('technician', 'ticket', 'Ticket Autorizado', `El ticket #${ticketId} ha sido autorizado por el cliente y está listo para reparación. Cliente: ${ticket.clientName}`, `/admin/tech-service?ticket=${ticketId}`);
                        notificationRoutes.broadcastNotification('admin', 'ticket', 'Ticket Autorizado', `El ticket #${ticketId} ha sido autorizado por el cliente y está listo para reparación. Cliente: ${ticket.clientName}`, `/admin/tech-service?ticket=${ticketId}`);
                    }
                });
            }

            // Crear garantía automáticamente cuando el ticket se marca como "DELIVERED" o "Entregado"
            if (status === 'DELIVERED' || status === 'Entregado') {
                db.get('SELECT * FROM tickets WHERE id = ?', [ticketId], async (err, ticket) => {
                    if (!err && ticket) {
                        const quoteItems = safeParse(ticket.quoteItems) || [];
                        const laborItems = safeParse(ticket.laborItems) || [];
                        const hasLabor = laborItems.length > 0;
                        const hasParts = quoteItems.length > 0;

                        let warrantyInfo = '';
                        if (hasLabor && hasParts) {
                            warrantyInfo = '30 días por mano de obra y 90 días por partes/accesorios';
                        } else if (hasLabor) {
                            warrantyInfo = '30 días por mano de obra';
                        } else if (hasParts) {
                            warrantyInfo = '90 días por partes/accesorios';
                        }

                        const laborDays = updateData.warrantyLaborDays || (hasLabor ? 30 : 0);
                        const partsDays = updateData.warrantyPartsDays || (hasParts ? 90 : 0);

                        warrantyAutomation.createCustomWarranty(ticketId, laborDays, partsDays)
                            .catch(err => console.error('[WARRANTy-AUTO] Failed to create warranties:', err.message));

                        if (ticket.clientEmail) {
                            const estimatedCost = ticket.estimatedCost || 0;
                            const laborCost = ticket.laborCost || 0;
                            const totalCost = estimatedCost + laborCost;
                            
                            await sendEmail({
                                to: ticket.clientEmail,
                                subject: `Ticket #${ticketId.toString().padStart(5, '0')} - Servicio Completado | LBDC`,
                                html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                                        <h1 style="color: white; margin: 0; font-size: 24px;">✓ Servicio Completado</h1>
                                        <p style="color: #a7f3d0; margin: 10px 0 0 0;">La Bodega del Computador</p>
                                    </div>
                                    <div style="padding: 30px; background: #f8fafc;">
                                        <p style="color: #334155; font-size: 16px;">Hola <strong>${ticket.clientName}</strong>,</p>
                                        <p style="color: #64748b;">Tu equipo ha sido reparado y está listo para entrega.</p>
                                        
                                        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                            <h3 style="color: #1e293b; margin: 0 0 15px 0;">Detalles del Servicio</h3>
                                            <p style="margin: 5px 0;"><strong>Ticket:</strong> #${ticketId.toString().padStart(5, '0')}</p>
                                            <p style="margin: 5px 0;"><strong>Dispositivo:</strong> ${ticket.deviceType} ${ticket.brand} ${ticket.model || ''}</p>
                                            <p style="margin: 5px 0;"><strong>Serial:</strong> ${ticket.serial || 'N/A'}</p>
                                            <p style="margin: 5px 0;"><strong>Diagnóstico:</strong> ${ticket.diagnosis || 'N/A'}</p>
                                            <p style="margin: 5px 0;"><strong>Reparación:</strong> ${ticket.repairNotes || 'N/A'}</p>
                                            <p style="margin: 5px 0; font-size: 18px;"><strong>Total Pagado:</strong> $${totalCost.toLocaleString('es-CO')}</p>
                                        </div>
                                        
                                        ${warrantyInfo ? `<p style="color: #64748b; font-size: 14px;">Tu equipo cuenta con garantía: <strong>${warrantyInfo}</strong>.</p>` : ''}
                                        
                                        <div style="text-align: center; margin-top: 30px;">
                                            <p style="color: #334155; font-weight: bold;">Visítanos para retirar tu equipo</p>
                                        </div>
                                    </div>
                                    <div style="background: #1e293b; padding: 20px; text-align: center;">
                                        <p style="color: #94a3b8; margin: 0; font-size: 12px;">© 2024 La Bodega del Computador. Todos los derechos reservados.</p>
                                    </div>
                                </div>
                            `,
                                type: 'soporte'
                            });
                        }
                    }
                });
            }
            
            // Trigger notification if status changed...
            res.json({ success: true });
        });
    });
    } catch (err) {
        console.error('[TICKET PUT Exception]:', err);
        res.status(500).json({ error: err.message });
    }
});
app.delete('/api/tickets/:id', authenticateToken, requireAdmin, (req, res) => {
    db.run('DELETE FROM ticket_evidence WHERE ticket_id = ?', [req.params.id], () => {
        db.run('DELETE FROM tickets WHERE id = ?', [req.params.id], () => res.json({ success: true }));
    });
});

// --- EVIDENCE PHOTOS API ---
app.post('/api/upload-evidence/:ticketId', authenticateToken, uploadBuffer.array('photos', 5), async (req, res) => {
    const { ticketId } = req.params;
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No images' });
    try {
        for (const file of req.files) {
            const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO ticket_evidence (ticket_id, photo_data, created_at) VALUES (?, ?, ?)',
                    [parseInt(ticketId), dataUrl, new Date().toISOString()], (err) => {
                        if (err) {
                            console.error('[UPLOAD] Database insert error:', err.message);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
            });
        }
        res.json({ success: true });
    } catch (error) { 
        console.error('[UPLOAD] Evidence upload failed:', error);
        res.status(500).json({ error: error.message }); 
    }
});
app.get('/api/evidence/:id', (req, res) => {
    db.get('SELECT photo_data FROM ticket_evidence WHERE id = ?', [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).send('Not Found');
        const parts = row.photo_data.split(',');
        res.set('Content-Type', parts[0].replace('data:', '').replace(';base64', ''));
        res.send(Buffer.from(parts[1], 'base64'));
    });
});

// --- DAMAGE PHOTOS API ---
app.post('/api/upload-damage-photos/:ticketId', authenticateToken, uploadBuffer.array('photos', 10), async (req, res) => {
    const { ticketId } = req.params;
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No images' });
    try {
        const uploadedPhotos = [];
        for (const file of req.files) {
            const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            uploadedPhotos.push(dataUrl);
        }
        
        db.get('SELECT damagePhotos FROM tickets WHERE id = ?', [ticketId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            
            let existingPhotos = [];
            if (row && row.damagePhotos) {
                try {
                    existingPhotos = JSON.parse(row.damagePhotos);
                } catch (_) { /* ignore parse errors */ }
            }
            
            const allPhotos = [...existingPhotos, ...uploadedPhotos];
            
            db.run('UPDATE tickets SET damagePhotos = ? WHERE id = ?', [JSON.stringify(allPhotos), ticketId], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });
                res.json({ success: true, count: uploadedPhotos.length });
            });
        });
    } catch (error) { 
        console.error('[UPLOAD] Damage photos upload failed:', error);
        res.status(500).json({ error: error.message }); 
    }
});

// --- MODULAR ROUTES ---
app.use('/webhooks', webhookRoutes);

// Users
app.get('/api/users', authenticateToken, requireAdmin, userRoutes.getUsers);
app.get('/api/users/:id', authenticateToken, requireAdmin, userRoutes.getUser);
app.post('/api/users', authenticateToken, requireAdmin, userRoutes.createUser);
app.put('/api/users/:id', authenticateToken, requireAdmin, userRoutes.updateUser);
app.delete('/api/users/:id', authenticateToken, requireAdmin, userRoutes.deleteUser);
app.delete('/api/users/:id/permanent', authenticateToken, requireAdmin, userRoutes.hardDeleteUser);
app.get('/api/users/technicians', authenticateToken, userRoutes.getTechnicians);
app.get('/api/technicians', authenticateToken, userRoutes.getTechnicians); // Alias
app.get('/api/users/activity', authenticateToken, requireAdmin, userRoutes.getUserActivity);
app.get('/api/user/tickets', authenticateToken, userRoutes.getMyTickets);
app.put('/api/user/tickets/:id/authorize', authenticateToken, userRoutes.authorizeTicket);
app.get('/api/user/profile', authenticateToken, userRoutes.getMyProfile);
app.put('/api/user/profile', authenticateToken, userRoutes.updateMyProfile);
app.get('/api/user/cart', authenticateToken, userRoutes.getCart);
app.post('/api/user/cart/sync', authenticateToken, userRoutes.syncCart);

// Customers
app.get('/api/customers', authenticateToken, requireRole(['admin', 'vendedor', 'technician', 'técnico']), customerRoutes.getCustomers);
app.get('/api/customers/export', authenticateToken, requireRole(['admin', 'vendedor']), customerRoutes.exportCustomers);
app.get('/api/customers/stats', authenticateToken, requireAdmin, customerRoutes.getCustomerStats);
app.get('/api/customers/search', authenticateToken, customerRoutes.searchCustomers);
app.get('/api/customers/birthdays', authenticateToken, requireRole(['admin', 'vendedor']), customerRoutes.getBirthdayCustomers);
app.get('/api/customers/:id', authenticateToken, customerRoutes.getCustomer);
app.post('/api/customers', authenticateToken, requireRole(['admin', 'vendedor']), customerRoutes.createCustomer);
app.put('/api/customers/:id', authenticateToken, requireRole(['admin', 'vendedor']), customerRoutes.updateCustomer);
app.delete('/api/customers/:id', authenticateToken, requireAdmin, customerRoutes.deleteCustomer);
app.post('/api/customers/import', authenticateToken, requireAdmin, uploadBuffer.single('file'), customerRoutes.importCustomers);

// Appointments
app.get('/api/appointments', authenticateToken, appointmentRoutes.getAppointments);
app.get('/api/appointments/export', authenticateToken, requireAdmin, appointmentRoutes.exportAppointments);
app.post('/api/appointments', authenticateToken, appointmentRoutes.createAppointment);
app.post('/api/appointments/reminders/daily', authenticateToken, requireRole(['admin']), appointmentRoutes.sendDailyReminders);
app.get('/api/appointments/:id', authenticateToken, appointmentRoutes.getAppointment);
app.put('/api/appointments/:id', authenticateToken, appointmentRoutes.updateAppointment);
app.put('/api/appointments/:id/status', authenticateToken, appointmentRoutes.updateAppointmentStatus);
app.delete('/api/appointments/:id', authenticateToken, appointmentRoutes.deleteAppointment);

// Warranties
app.get('/api/warranties', authenticateToken, warrantyRoutes.getWarranties);
app.post('/api/warranties', authenticateToken, requireAdmin, warrantyRoutes.createWarranty);
app.put('/api/warranties/:id', authenticateToken, requireAdmin, warrantyRoutes.updateWarranty);
app.delete('/api/warranties/:id', authenticateToken, requireAdmin, warrantyRoutes.deleteWarranty);
app.post('/api/warranties/:id/claim', authenticateToken, warrantyRoutes.createClaim);
app.get('/api/warranties/export', authenticateToken, requireAdmin, warrantyRoutes.exportWarranties);

// Technical Receipts (Intake)
app.get('/api/intake-receipts', authenticateToken, intakeReceiptRoutes.getReceipts);
app.post('/api/intake-receipts', authenticateToken, intakeReceiptRoutes.createReceipt);
app.get('/api/intake-receipts/:ticketId/pdf', authenticateToken, intakeReceiptRoutes.generatePDF);
app.get('/api/intake-receipts/:ticketId/preview', authenticateToken, intakeReceiptRoutes.previewIntakeReceipt);
app.post('/api/intake-receipts/:ticketId/send-email', authenticateToken, intakeReceiptRoutes.sendIntakeReceipt);

// Delivery Receipt Routes
app.get('/api/delivery-receipts/:ticketId/preview', authenticateToken, deliveryReceiptRoutes.previewDeliveryReceipt);
app.post('/api/delivery-receipts/:ticketId/send-email', authenticateToken, deliveryReceiptRoutes.sendDeliveryReceipt);

// Test Email Endpoint
app.post('/api/test-email', authenticateToken, async (req, res) => {
    const { sendEmail } = await import('./mail.js');
    const emailType = req.body.type || 'admin';
    const result = await sendEmail({
        to: req.body.to || 'khristianfdomora25@gmail.com',
        subject: `Prueba de Email - ${emailType.toUpperCase()}`,
        html: `
            <h1>¡Prueba exitosa!</h1>
            <p>Este es un correo de prueba del sistema LBDC.</p>
            <p><strong>Alias:</strong> ${emailType}</p>
            <hr>
            <p><strong>La Bodega del Computador</strong></p>
        `,
        type: emailType
    });
    res.json(result);
});

// Ticket Warranty API
app.get('/api/tickets/:ticketId/warranty-preview', authenticateToken, (req, res) => {
    const { ticketId } = req.params;
    warrantyAutomation.getWarrantyPreview(parseInt(ticketId))
        .then(preview => res.json(preview))
        .catch(err => res.status(500).json({ error: err.message }));
});

app.post('/api/tickets/:ticketId/create-warranties', authenticateToken, (req, res) => {
    const { ticketId } = req.params;
    const { laborDays, partsDays } = req.body;
    
    warrantyAutomation.createCustomWarranty(parseInt(ticketId), laborDays || 0, partsDays || 0)
        .then(warranties => res.json({ success: true, warranties }))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Customer Technical Report (HTML with photos)
app.get('/api/customer-reports/:ticketId/preview', authenticateToken, customerReportRoutes.previewCustomerReport);
app.post('/api/customer-reports/:ticketId/send', authenticateToken, customerReportRoutes.sendCustomerReport);

// Audit & Activity Logs
app.get('/api/audit/logs', authenticateToken, requireAdmin, auditRoutes.getAuditLogs);
app.get('/api/audit/log', authenticateToken, requireAdmin, auditRoutes.getAuditLogs); // Alias
app.post('/api/audit/log', authenticateToken, auditRoutes.logAction);
app.get('/api/audit/stats', authenticateToken, requireAdmin, auditRoutes.getAuditStats);
app.get('/api/audit/recent', authenticateToken, requireAdmin, auditRoutes.getRecentActivity);
app.get('/api/audit/export', authenticateToken, requireAdmin, auditRoutes.exportAuditLogs);

// Orders & Sales
app.get('/api/orders', authenticateToken, orderRoutes.getOrders);
app.get('/api/orders/export', authenticateToken, requireAdmin, orderRoutes.exportOrders);
app.get('/api/orders/track/:orderNumber', orderRoutes.trackOrder);
app.get('/api/orders/:id', authenticateToken, orderRoutes.getOrder);
app.post('/api/orders', authenticateToken, orderRoutes.createOrder);
app.put('/api/orders/:id/status', authenticateToken, requireAdmin, orderRoutes.updateOrderStatus);
app.post('/api/orders/:id/cancel', authenticateToken, requireAdmin, orderRoutes.cancelOrder);
app.get('/api/orders/:id/items', authenticateToken, (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT oi.*, p.name, p.image, p.category 
        FROM order_items oi 
        JOIN products p ON oi.productId = p.id 
        WHERE oi.orderId = ?
    `;
    db.all(query, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Settings
app.get('/api/settings', settingsRoutes.getSettings);
app.post('/api/settings', authenticateToken, requireAdmin, settingsRoutes.updateSettings);

// Suppliers
app.get('/api/suppliers', authenticateToken, supplierRoutes.getSuppliers);
app.get('/api/suppliers/stats', authenticateToken, requireAdmin, supplierRoutes.getSupplierStats);
app.get('/api/suppliers/export', authenticateToken, requireAdmin, supplierRoutes.exportSuppliers);
app.get('/api/suppliers/:id', authenticateToken, supplierRoutes.getSupplier);
app.post('/api/suppliers', authenticateToken, requireAdmin, supplierRoutes.createSupplier);
app.put('/api/suppliers/:id', authenticateToken, requireAdmin, supplierRoutes.updateSupplier);
app.delete('/api/suppliers/:id', authenticateToken, requireAdmin, supplierRoutes.deleteSupplier);
app.post('/api/suppliers/import', authenticateToken, requireAdmin, uploadBuffer.single('file'), supplierRoutes.importSuppliers);

// Coupons & Marketing
app.get('/api/coupons', authenticateToken, couponRoutes.getCoupons);
app.get('/api/coupons/stats', authenticateToken, requireAdmin, couponRoutes.getCouponStats);
app.get('/api/coupons/export', authenticateToken, requireAdmin, couponRoutes.exportCoupons);
app.post('/api/coupons', authenticateToken, requireAdmin, couponRoutes.createCoupon);
app.put('/api/coupons/:id', authenticateToken, requireAdmin, couponRoutes.updateCoupon);
app.delete('/api/coupons/:id', authenticateToken, requireAdmin, couponRoutes.deleteCoupon);

// Human Resources / Employees
app.get('/api/employees', authenticateToken, employeeRoutes.getEmployees);
app.get('/api/employees/export', authenticateToken, requireAdmin, employeeRoutes.exportEmployees);
app.get('/api/employees/payroll', authenticateToken, requireAdmin, employeeRoutes.calculatePayroll);
app.get('/api/employees/attendance/:employeeId', authenticateToken, employeeRoutes.getAttendance);
app.post('/api/employees/attendance', authenticateToken, employeeRoutes.recordAttendance);
app.post('/api/employees', authenticateToken, requireAdmin, employeeRoutes.createEmployee);
app.put('/api/employees/:id', authenticateToken, requireAdmin, employeeRoutes.updateEmployee);
app.delete('/api/employees/:id', authenticateToken, requireAdmin, employeeRoutes.deleteEmployee);

// Returns & Claims
app.get('/api/returns', authenticateToken, returnRoutes.getReturns);
app.get('/api/returns/stats', authenticateToken, returnRoutes.getReturnStats);
app.get('/api/returns/export', authenticateToken, requireAdmin, returnRoutes.exportReturns);
app.get('/api/returns/:id', authenticateToken, returnRoutes.getReturn);
app.post('/api/returns', authenticateToken, returnRoutes.createReturn);
app.put('/api/returns/:id', authenticateToken, returnRoutes.updateReturn);
app.put('/api/returns/:id/status', authenticateToken, returnRoutes.updateReturnStatus);
app.delete('/api/returns/:id', authenticateToken, requireAdmin, returnRoutes.deleteReturn);
app.post('/api/returns/:id/refund', authenticateToken, returnRoutes.processRefund);

// Finance & Expenses
app.get('/api/expenses', authenticateToken, expenseRoutes.getExpenses);
app.get('/api/expenses/summary', authenticateToken, expenseRoutes.getExpenseSummary);
app.get('/api/expenses/stats', authenticateToken, expenseRoutes.getExpenseStats);
app.get('/api/expenses/export', authenticateToken, expenseRoutes.exportExpenses);
app.get('/api/expenses/:id', authenticateToken, expenseRoutes.getExpense);
app.post('/api/expenses', authenticateToken, expenseRoutes.createExpense);
app.put('/api/expenses/:id', authenticateToken, expenseRoutes.updateExpense);
app.delete('/api/expenses/:id', authenticateToken, expenseRoutes.deleteExpense);
app.put('/api/expenses/:id/status', authenticateToken, requireAdmin, (req, res) => {
    if (req.body.status === 'approved') return expenseRoutes.approveExpense(req, res);
    if (req.body.status === 'rejected') return expenseRoutes.rejectExpense(req, res);
    res.status(400).json({ error: 'Status must be approved or rejected' });
});

// Customer Reports & Analytics
app.get('/api/reports/customers', authenticateToken, requireAdmin, reportRoutes.getCustomerAnalytics);
app.get('/api/reports/dashboard', authenticateToken, requireAdmin, reportRoutes.getDashboardStats);

// Exports & Automations
app.get('/api/exports/all', authenticateToken, requireAdmin, exportRoutes.exportAll);
app.get('/api/automations', authenticateToken, requireAdmin, automationRoutes.getAutomations);
app.post('/api/automations/test', authenticateToken, requireAdmin, automationRoutes.testAutomation);

// Notifications
app.get('/api/notifications', authenticateToken, notificationRoutes.getNotifications);
app.get('/api/notifications/unread-count', authenticateToken, notificationRoutes.getUnreadCount);
app.put('/api/notifications/:id/read', authenticateToken, notificationRoutes.markAsRead);
app.put('/api/notifications/mark-all-read', authenticateToken, notificationRoutes.markAllAsRead);
app.delete('/api/notifications/:id', authenticateToken, notificationRoutes.deleteNotification);

// Reports Detail Routes
app.get('/api/reports/sales', authenticateToken, requireAdmin, reportRoutes.getSalesReport);
app.get('/api/reports/inventory', authenticateToken, requireAdmin, reportRoutes.getInventoryReport);
app.get('/api/reports/service', authenticateToken, requireAdmin, reportRoutes.getServiceReport);
app.get('/api/reports/top-products', authenticateToken, requireAdmin, reportRoutes.getTopProducts);
app.get('/api/reports/appointments', authenticateToken, requireAdmin, reportRoutes.getAppointmentStats);

// Compatibility aliases for audit
// Handled above in Audit section

// --- PRODUCT & INVENTORY ---
app.get('/api/products', productRoutes.getProducts);
app.get('/api/products/export', authenticateToken, requireAdmin, productRoutes.exportProducts);
app.post('/api/products', authenticateToken, requireAdmin, productRoutes.addProduct);
app.put('/api/products/:id', authenticateToken, requireAdmin, productRoutes.updateProduct);
app.delete('/api/products/:id', authenticateToken, requireAdmin, productRoutes.deleteProduct);
app.post('/api/products/import', authenticateToken, requireAdmin, uploadBuffer.single('file'), productRoutes.importProducts);

// Compatibility aliases for inventoryService.js if needed
app.put('/api/products/products/:id', authenticateToken, requireAdmin, productRoutes.updateProduct);
app.delete('/api/products/products/:id', authenticateToken, requireAdmin, productRoutes.deleteProduct);

// --- MAINTENANCE ---
const seedAdmin = async () => {
    db.get('SELECT * FROM users WHERE email = ?', ['admin@labodega.com'], async (err, row) => {
        if (!row) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            db.run('INSERT INTO users (name, email, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                ['Administrador', 'admin@labodega.com', hashedPassword, 'admin', 'active', new Date().toISOString()]);
        }
    });
};
const cleanupOldEvidence = () => {
    const limitDate = new Date();
    limitDate.setMonth(limitDate.getMonth() - 6);
    db.run("DELETE FROM ticket_evidence WHERE created_at < ?", [limitDate.toISOString()]);
};

// Custom Findings & Recommendations
app.get('/api/custom-findings', authenticateToken, (req, res) => {
    const { type } = req.query;
    let query = 'SELECT * FROM custom_findings ORDER BY createdAt DESC';
    const params = [];
    if (type) {
        query = 'SELECT * FROM custom_findings WHERE type = ? ORDER BY createdAt DESC';
        params.push(type);
    }
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/custom-findings', authenticateToken, requireAdmin, (req, res) => {
    const { type, value } = req.body;
    if (!type || !value) return res.status(400).json({ error: 'Faltan datos' });
    
    db.run('INSERT INTO custom_findings (type, value) VALUES (?, ?)', [type, value], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, type, value });
    });
});

app.delete('/api/custom-findings/:id', authenticateToken, requireAdmin, (req, res) => {
    db.run('DELETE FROM custom_findings WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Global Error Handler (BOTTOM)
app.use((err, req, res, _next) => {
    console.error('[FATAL SERVER ERROR]', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body
    });
    res.status(500).json({ 
        error: 'Error interno del servidor', 
        message: err.message 
    });
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL ERROR] Uncaught Exception:', err);
  // Keep server alive in development for minor errors (like SMTP issues)
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep server alive in development
});

try {
    // Explicitly listen on 0.0.0.0 for IPv4 compatibility on Windows
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
        seedAdmin().catch(err => console.error('[INIT] seedAdmin failed:', err));
        cleanupOldEvidence();
        setInterval(cleanupOldEvidence, 24 * 60 * 60 * 1000);
    });
} catch (err) {
    console.error('[FATAL] app.listen failed:', err);
    process.exit(1);
}
