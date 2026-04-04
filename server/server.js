import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { db, dbPath, logActivity } from './db.js';
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

// Modular Route Imports
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
import * as productRoutes from './productRoutes.js';
import webhookRoutes from './webhooks.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.JWT_SECRET) {
    console.error('[FATAL] JWT_SECRET no esta configurado en .env. El servidor no puede arrancar.');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
const PORT = process.env.PORT || 3000;

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
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

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
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Acceso denegado' });
    next();
};
const requireAdmin = requireRole(['admin']);

// Storage
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const uploadDisk = multer({ 
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
    }),
    limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadBuffer = multer({ 
    storage: multer.memoryStorage(), 
    limits: { fileSize: 10 * 1024 * 1024 } 
});

// --- EMAIL NOTIFICATION SYSTEM ---
let emailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
}
const sendTicketNotification = async (ticket, status) => {
    if (!emailTransporter) return;
    // ... logic for sending mail ...
};

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
    const query = `SELECT t.*, u.name as assignedToName FROM tickets t LEFT JOIN users u ON t.assignedTo = u.id ORDER BY t.id DESC`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(t => ({
            ...t,
            photosIntake: t.photosIntake ? JSON.parse(t.photosIntake) : [],
            quoteItems: t.quoteItems ? JSON.parse(t.quoteItems) : [],
            approvedByClient: t.approvedByClient === 1
        })));
    });
});
app.get('/api/tickets/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const query = `SELECT t.*, u.name as assignedToName FROM tickets t LEFT JOIN users u ON t.assignedTo = u.id WHERE t.id = ?`;
    db.get(query, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Ticket no encontrado' });
        res.json({
            ...row,
            photosIntake: row.photosIntake ? JSON.parse(row.photosIntake) : [],
            quoteItems: row.quoteItems ? JSON.parse(row.quoteItems) : [],
            approvedByClient: row.approvedByClient === 1
        });
    });
});
app.post('/api/tickets', authenticateToken, (req, res) => {
    const { clientName, clientPhone, clientEmail, deviceType, brand, model, issueDescription } = req.body;
    const now = new Date().toISOString();
    db.run(sql, [clientName, clientPhone, clientEmail, deviceType, brand, model, issueDescription, now], function(err) {
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
    const { status, diagnosis, estimatedCost, deviceType, brand, model, serial } = req.body;
    const ticketId = req.params.id;
    const now = new Date().toISOString();
    
    db.run('UPDATE tickets SET status = ?, diagnosis = ?, estimatedCost = ?, updatedAt = ? WHERE id = ?', 
        [status, diagnosis, estimatedCost, now, ticketId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Crear garantía automáticamente cuando el ticket se marca como "DELIVERED" o "Entregado"
        if (status === 'DELIVERED' || status === 'Entregado') {
            // Obtener información del cliente y ticket
            db.get('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, ticket) => {
                if (!err && ticket) {
                    const warrantyMonths = 3; // 3 meses de garantía por servicio técnico
                    const endDate = new Date();
                    endDate.setMonth(endDate.getMonth() + warrantyMonths);
                    
                    // Buscar o crear cliente para la garantía
                    let customerId = ticket.customerId;
                    
                    // Si no tiene customerId, intentar encontrar por nombre/teléfono
                    if (!customerId && ticket.clientPhone) {
                        db.get('SELECT id FROM customers WHERE phone = ?', [ticket.clientPhone], (err, existingCustomer) => {
                            if (existingCustomer) {
                                customerId = existingCustomer.id;
                            }
                            createWarranty();
                        });
                    } else {
                        createWarranty();
                    }
                    
                    function createWarranty() {
                        db.run(
                            `INSERT INTO warranties (ticketId, productId, customerId, startDate, endDate, terms, status, createdAt) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [ticketId, null, customerId, now, endDate.toISOString(), 
                             `Garantía por servicio técnico - ${warrantyMonths} meses. Dispositivo: ${deviceType || ticket.deviceType} ${brand || ''} ${model || ''}`.trim(), 
                             'Active', now],
                            (err) => {
                                if (err) console.error('[Warranty] Error creating warranty from ticket:', err);
                            }
                        );
                    }
                }
            });
        }
        
        // Trigger notification if status changed...
        res.json({ success: true });
    });
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
                } catch {}
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
app.get('/api/user/profile', authenticateToken, userRoutes.getMyProfile);
app.put('/api/user/profile', authenticateToken, userRoutes.updateMyProfile);
app.get('/api/user/cart', authenticateToken, userRoutes.getCart);
app.post('/api/user/cart/sync', authenticateToken, userRoutes.syncCart);

// Customers
app.get('/api/customers', authenticateToken, requireRole(['admin', 'vendedor', 'technician', 'técnico']), customerRoutes.getCustomers);
app.get('/api/customers/export', authenticateToken, requireAdmin, customerRoutes.exportCustomers);
app.get('/api/customers/stats', authenticateToken, requireAdmin, customerRoutes.getCustomerStats);
app.get('/api/customers/search', authenticateToken, customerRoutes.searchCustomers);
app.get('/api/customers/:id', authenticateToken, customerRoutes.getCustomer);
app.post('/api/customers', authenticateToken, requireRole(['admin', 'vendedor']), customerRoutes.createCustomer);
app.put('/api/customers/:id', authenticateToken, requireRole(['admin', 'vendedor']), customerRoutes.updateCustomer);
app.delete('/api/customers/:id', authenticateToken, requireAdmin, customerRoutes.deleteCustomer);
app.get('/api/customers/birthdays', authenticateToken, requireRole(['admin', 'vendedor']), customerRoutes.getBirthdayCustomers);
app.post('/api/customers/import', authenticateToken, requireAdmin, uploadBuffer.single('file'), customerRoutes.importCustomers);

// Appointments
app.get('/api/appointments', authenticateToken, appointmentRoutes.getAppointments);
app.get('/api/appointments/export', authenticateToken, requireAdmin, appointmentRoutes.exportAppointments);
app.post('/api/appointments', authenticateToken, appointmentRoutes.createAppointment);
app.post('/api/appointments/reminders/daily', authenticateToken, requireRole(['admin']), appointmentRoutes.sendDailyReminders);
app.put('/api/appointments/:id/status', authenticateToken, appointmentRoutes.updateAppointmentStatus);

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
app.get('/api/intake-receipts/:id/pdf', authenticateToken, intakeReceiptRoutes.generatePDF);
app.get('/api/intake-receipts/:id/preview', authenticateToken, intakeReceiptRoutes.previewIntakeReceipt);
app.post('/api/intake-receipts/:ticketId/send-email', authenticateToken, intakeReceiptRoutes.sendIntakeReceipt);

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
app.post('/api/returns', authenticateToken, returnRoutes.createReturn);

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
app.post('/api/notifications/read', authenticateToken, notificationRoutes.markAsRead);
app.post('/api/notifications/mark-all-read', authenticateToken, notificationRoutes.markAllAsRead);

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

app.post('/api/suppliers/import', authenticateToken, requireAdmin, uploadBuffer.single('file'), supplierRoutes.importSuppliers);

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    seedAdmin();
    cleanupOldEvidence();
    setInterval(cleanupOldEvidence, 24 * 60 * 60 * 1000);
});
