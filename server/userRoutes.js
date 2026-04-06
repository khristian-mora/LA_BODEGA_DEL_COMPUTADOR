import { db, logActivity } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from './mail.js';
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Get all users
export const getUsers = (req, res) => {
    db.all('SELECT id, name, email, role, status, createdAt FROM users ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

// Get single user
export const getUser = (req, res) => {
    db.get('SELECT id, name, email, role, status, createdAt FROM users WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        res.json(row);
    });
};

// Public Register (Client Role only)
export const publicRegister = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (name, email, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)';
        const now = new Date().toISOString();

        // 1. Insert into users table
        db.run(sql, [name, email, hashedPassword, 'client', 'active', now], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    res.status(400).json({ error: 'El email ya está registrado' });
                } else {
                    res.status(400).json({ error: err.message });
                }
                return;
            }

            const userId = this.lastID;
            const token = jwt.sign({ id: userId, email, role: 'client' }, JWT_SECRET, { expiresIn: '24h' });

            // 2. SYNC: Insert into customers table automatically
            const customerSql = 'INSERT OR IGNORE INTO customers (name, email, customerType, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)';
            db.run(customerSql, [name, email, 'Nuevo', 'active', now, now]);

            logActivity({
                userId: userId,
                action: 'CLIENT_REGISTER',
                module: 'AUTH',
                details: `Nuevo cliente registrado: ${name}`,
                req: req
            });
            
            res.json({ 
                success: true, 
                token, 
                user: { id: userId, name, email, role: 'client' } 
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) return res.json({ success: true, message: 'Si el correo existe, se enviará un enlace.' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

        db.run('UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?', 
            [resetToken, resetTokenExpiry, user.id], async (updateErr) => {
            if (updateErr) return res.status(500).json({ error: 'Error del servidor' });

            const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
            
            const html = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0f172a; margin-bottom: 10px;">Recuperación de Contraseña</h1>
                        <p style="color: #64748b;">Hola ${user.name}, recibimos una solicitud para restablecer tu contraseña.</p>
                    </div>
                    <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; text-align: center;">
                        <p style="margin-bottom: 25px; color: #334155;">Haz clic en el siguiente botón para crear una nueva contraseña segura:</p>
                        <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Restablecer mi Contraseña</a>
                        <p style="margin-top: 25px; color: #94a3b8; font-size: 13px;">Si no solicitaste esto, ignora este mensaje. El enlace caducará en 1 hora.</p>
                    </div>
                    <div style="margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px;">
                        &copy; 2025 La Bodega del Computador. Todos los derechos reservados.
                    </div>
                </div>
            `;

            try {
                await sendEmail({
                    to: email,
                    subject: 'Recupera tu acceso a La Bodega del Computador',
                    html
                });
                res.json({ success: true, message: 'Enlace enviado.' });
            } catch (mailErr) {
                res.status(500).json({ error: 'Error al enviar correo.' });
            }
        });
    });
};

// Reset Password
export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Faltan datos' });

    const now = new Date().toISOString();
    db.get('SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > ?', [token, now], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Token inválido o expirado' });

        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            db.run('UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?', 
                [hashedPassword, user.id], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: 'Error al actualizar contraseña' });

                logActivity({
                    userId: user.id,
                    action: 'PASSWORD_RESET',
                    module: 'AUTH',
                    details: `Contraseña restablecida para: ${user.email}`,
                    req: req
                });
                res.json({ success: true, message: 'Contraseña actualizada.' });
            });
        } catch (hashErr) {
            res.status(500).json({ error: 'Error de encriptación' });
        }
    });
};

// Google Login
export const googleLogin = async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Token de Google requerido' });

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: _googleId, email, name, picture } = payload;

        // Check if user exists
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) return res.status(500).json({ error: 'Error de base de datos' });

            if (user) {
                // User exists, login
                const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
                
                logActivity({
                    userId: user.id,
                    action: 'GOOGLE_LOGIN',
                    module: 'AUTH',
                    details: `Login con Google: ${email}`,
                    req: req
                });

                return res.json({ 
                    success: true, 
                    token, 
                    user: { id: user.id, name: user.name, email: user.email, role: user.role } 
                });
            } else {
                // New user from Google
                const now = new Date().toISOString();
                // We generate a random password for consistency, although they'll use Google
                const randomPassword = crypto.randomBytes(16).toString('hex');
                const hashedPassword = await bcrypt.hash(randomPassword, 10);

                db.run(
                    'INSERT INTO users (name, email, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                    [name, email, hashedPassword, 'client', 'active', now],
                    function (insertErr) {
                        if (insertErr) return res.status(500).json({ error: 'Error al crear usuario' });

                        const userId = this.lastID;
                        const token = jwt.sign({ id: userId, email, role: 'client' }, JWT_SECRET, { expiresIn: '24h' });

                        // 2. SYNC: Insert into customers table automatically
                        const customerSql = 'INSERT OR IGNORE INTO customers (name, email, customerType, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)';
                        db.run(customerSql, [name, email, 'Nuevo', 'active', now, now]);

                        logActivity({
                            userId: userId,
                            action: 'GOOGLE_REGISTER',
                            module: 'AUTH',
                            details: `Registro con Google: ${email}`,
                            req: req
                        });

                        res.json({ 
                            success: true, 
                            token, 
                            user: { id: userId, name, email, role: 'client', picture } 
                        });
                    }
                );
            }
        });
    } catch (error) {
        console.error('Google verification error:', error);
        res.status(401).json({ error: 'Token de Google inválido' });
    }
};

// Create user (Admin only)
export const createUser = async (req, res) => {
    const { name, email, password, role, status } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (name, email, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)';
        const now = new Date().toISOString();

        db.run(sql, [name, email, hashedPassword, role || 'admin', status || 'active', now], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    res.status(400).json({ error: 'El email ya existe' });
                } else {
                    res.status(400).json({ error: err.message });
                }
                return;
            }

            logActivity({
                userId: req.user.id,
                action: 'CREATE_USER',
                module: 'USERS',
                entityType: 'users',
                entityId: this.lastID,
                newValue: { name, email, role },
                req: req
            });
            res.json({ id: this.lastID, name, email, role });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update user
export const updateUser = async (req, res) => {
    const { name, email, role, status, password } = req.body;

    // Get old value for audit trail
    db.get('SELECT * FROM users WHERE id = ?', [req.params.id], async (err, oldUser) => {
        if (err || !oldUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        let updates = [];
        let params = [];

        if (name) { updates.push('name = ?'); params.push(name); }
        if (email) { updates.push('email = ?'); params.push(email); }
        if (role) { updates.push('role = ?'); params.push(role); }
        if (status !== undefined) { updates.push('status = ?'); params.push(status); }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            params.push(hashedPassword);
        }

        params.push(req.params.id);

        const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

        db.run(sql, params, function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }

            logActivity({
                userId: req.user.id,
                action: 'UPDATE_USER',
                module: 'USERS',
                entityType: 'users',
                entityId: req.params.id,
                oldValue: { name: oldUser.name, role: oldUser.role, status: oldUser.status },
                newValue: { name, role, status },
                req: req
            });
            res.json({ success: true });
        });
    });
};

// Delete user
export const deleteUser = (req, res) => {
    // Soft delete - just deactivate
    db.run('UPDATE users SET status = ? WHERE id = ?', ['inactive', req.params.id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        logActivity({
            userId: req.user.id,
            action: 'DEACTIVATE_USER',
            module: 'USERS',
            entityType: 'users',
            entityId: req.params.id,
            req: req
        });
        res.json({ success: true });
    });
};

// Hard delete user - permanently remove
export const hardDeleteUser = (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        logActivity({
            userId: req.user.id,
            action: 'DELETE_USER',
            module: 'USERS',
            entityType: 'users',
            entityId: req.params.id,
            req: req
        });
        res.json({ success: true, message: 'Usuario eliminado permanentemente' });
    });
};

// Get technicians (users with role admin, technician, or técnico)
export const getTechnicians = (req, res) => {
    db.all("SELECT id, name, email, role FROM users WHERE role IN ('admin', 'technician', 'técnico') AND status = 'active'", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

// Get user activity log
export const getUserActivity = (req, res) => {
    const limit = req.query.limit || 50;
    // Note: We'll keep query against user_activity_log for now but audit_logs is the new one.
    // Eventually migrate front-end to call a unified audit log.
    db.all(
        `SELECT al.*, u.name as username 
         FROM audit_logs al 
         LEFT JOIN users u ON al.userId = u.id 
         ORDER BY al.timestamp DESC 
         LIMIT ?`,
        [limit],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        }
    );
};

// Get personal tickets (for authenticated client)
export const getMyTickets = (req, res) => {
    const email = req.user.email;
    const query = `
        SELECT t.*, u.name as assignedToName 
        FROM tickets t 
        LEFT JOIN users u ON t.assignedTo = u.id 
        WHERE t.clientEmail = ? 
        ORDER BY t.id DESC
    `;
    
    db.all(query, [email], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(t => ({
            ...t,
            photosIntake: t.photosIntake ? JSON.parse(t.photosIntake) : [],
            quoteItems: t.quoteItems ? JSON.parse(t.quoteItems) : [],
            approvedByClient: t.approvedByClient === 1
        })));
    });
};

// Autorizar ticket (cliente autoriza la reparación)
export const authorizeTicket = (req, res) => {
    const { id } = req.params;
    const now = new Date().toISOString();
    
    db.run(`UPDATE tickets SET status = 'AUTHORIZED', approvedByClient = 1, updatedAt = ? WHERE id = ?`, 
        [now, id], async function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const { broadcastNotification } = require('./notificationRoutes.js');
            const { sendEmail } = require('./mail.js');
            
            db.get('SELECT * FROM tickets WHERE id = ?', [id], async (err, ticket) => {
                if (!err && ticket) {
                    // Notificar a técnicos y admins
                    db.all("SELECT id FROM users WHERE role = 'technician'", [], (err, techs) => {
                        if (!err && techs) {
                            techs.forEach(t => {
                                broadcastNotification(t.id, 'ticket', 'Ticket Autorizado', `El ticket #${id} ha sido autorizado por el cliente y está listo para reparación. Cliente: ${ticket.clientName}`, `/admin/tech-service?ticket=${id}`);
                            });
                        }
                    });
                    db.all("SELECT id FROM users WHERE role = 'admin'", [], (err, admins) => {
                        if (!err && admins) {
                            admins.forEach(a => {
                                broadcastNotification(a.id, 'ticket', 'Ticket Autorizado', `El ticket #${id} ha sido autorizado por el cliente y está listo para reparación. Cliente: ${ticket.clientName}`, `/admin/tech-service?ticket=${id}`);
                            });
                        }
                    });
                    
                    // Enviar email de confirmación al cliente
                    if (ticket.clientEmail) {
                        const estimatedCost = ticket.estimatedCost || 0;
                        const laborCost = ticket.laborCost || 0;
                        const totalCost = estimatedCost + laborCost;
                        
                        await sendEmail({
                            to: ticket.clientEmail,
                            subject: `Ticket #${id.toString().padStart(5, '0')} - Autorización Confirmada | LBDC`,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center;">
                                        <h1 style="color: white; margin: 0; font-size: 24px;">✓ Autorización Confirmada</h1>
                                        <p style="color: #94a3b8; margin: 10px 0 0 0;">La Bodega del Computador</p>
                                    </div>
                                    <div style="padding: 30px; background: #f8fafc;">
                                        <p style="color: #334155; font-size: 16px;">Hola <strong>${ticket.clientName}</strong>,</p>
                                        <p style="color: #64748b;">Hemos recibido tu autorización para proceder con la reparación de tu equipo.</p>
                                        
                                        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                            <h3 style="color: #1e293b; margin: 0 0 15px 0;">Detalles del Servicio</h3>
                                            <p style="margin: 5px 0;"><strong>Ticket:</strong> #${id.toString().padStart(5, '0')}</p>
                                            <p style="margin: 5px 0;"><strong>Dispositivo:</strong> ${ticket.deviceType} ${ticket.brand} ${ticket.model || ''}</p>
                                            <p style="margin: 5px 0;"><strong>Serial:</strong> ${ticket.serial || 'N/A'}</p>
                                            <p style="margin: 5px 0;"><strong>Presupuesto:</strong> $${totalCost.toLocaleString('es-CO')}</p>
                                        </div>
                                        
                                        <p style="color: #64748b; font-size: 14px;">Nuestro equipo técnico procederá con la reparación. Te notificaremos cuando el equipo esté listo para entrega.</p>
                                        
                                        <div style="text-align: center; margin-top: 30px;">
                                            <a href="#" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver Estado del Ticket</a>
                                        </div>
                                    </div>
                                    <div style="background: #1e293b; padding: 20px; text-align: center;">
                                        <p style="color: #94a3b8; margin: 0; font-size: 12px;">© 2024 La Bodega del Computador. Todos los derechos reservados.</p>
                                    </div>
                                </div>
                            `
                        });
                    }
                }
            });
            
            res.json({ success: true, message: 'Ticket autorizado exitosamente' });
        });
};
// Auto-create user when a ticket is created (if not exists)
export const autoCreateUserForTicket = async (ticketData) => {
    const { clientName, clientEmail, ticketId, deviceType, brand, model } = ticketData;

    if (!clientEmail) return;

    db.get('SELECT id FROM users WHERE email = ?', [clientEmail], async (err, user) => {
        if (err || user) return; // Already exists or error

        try {
            const tempPassword = `LBDC-${Math.floor(1000 + Math.random() * 9000)}`;
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            const now = new Date().toISOString();

            // 1. Create User
            db.run(
                'INSERT INTO users (name, email, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                [clientName, clientEmail, hashedPassword, 'client', 'active', now],
                function(err) {
                    if (err) return;

                    const userId = this.lastID;

                    // 2. Sync with Customers
                    db.run(
                        'INSERT OR IGNORE INTO customers (name, email, customerType, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
                        [clientName, clientEmail, 'Nuevo', 'active', now, now]
                    );

                    // 3. Send Email
                    const html = `
                        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="background-color: #0f172a; color: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                    <h1 style="margin: 0; font-size: 24px;">¡Equipo Recibido con Éxito!</h1>
                                    <p style="margin: 5px 0 0 0; opacity: 0.8;">Ticket #${ticketId}</p>
                                </div>
                                <p style="color: #64748b; font-size: 16px;">Hola <strong>${clientName}</strong>, hemos registrado tu solicitud de servicio técnico para tu <strong>${deviceType} ${brand} ${model}</strong>.</p>
                            </div>

                            <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; border: 1px dashed #cbd5e1; margin-bottom: 30px;">
                                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; margin-bottom: 15px; text-align: center;">Tus Credenciales de Acceso</h2>
                                <p style="color: #475569; font-size: 14px; margin-bottom: 20px; text-align: center;">Usa estos datos para seguir el estado de tu mantenimiento en tiempo real:</p>
                                
                                <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
                                    <p style="margin: 5px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">User / Email</p>
                                    <p style="margin: 0 0 15px 0; color: #0f172a; font-weight: bold; font-size: 16px;">${clientEmail}</p>
                                    
                                    <p style="margin: 5px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold;">Contraseña Temporal</p>
                                    <p style="margin: 0; color: #0f172a; font-weight: bold; font-size: 16px; letter-spacing: 1px;">${tempPassword}</p>
                                </div>
                            </div>

                            <div style="text-align: center;">
                                <a href="${FRONTEND_URL}/login" style="display: inline-block; padding: 14px 30px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Ver Estado de mi Pedido</a>
                                <p style="margin-top: 25px; color: #94a3b8; font-size: 12px;">Por seguridad, te recomendamos cambiar tu contraseña una vez ingreses a tu perfil.</p>
                            </div>

                            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 12px;">
                                <p style="margin: 0;"><strong>La Bodega del Computador</strong></p>
                                <p style="margin: 5px 0;">Tecnología y Soporte Profesional</p>
                                <p style="margin: 15px 0 0 0;">&copy; 2025 Todos los derechos reservados.</p>
                            </div>
                        </div>
                    `;

                    sendEmail({
                        to: clientEmail,
                        subject: `Confirmación de Ticket #${ticketId} - La Bodega del Computador`,
                        html
                    }).catch(console.error);

                    logActivity({
                        userId: userId,
                        action: 'AUTO_REGISTER_TICKET',
                        module: 'AUTH',
                        details: `Usuario creado automáticamente por ticket #${ticketId}`,
                        req: {}
                    });
                }
            );
        } catch (error) {
            console.error('Error auto-creating user:', error);
        }
    });
};

// --- CART PERSISTENCE ---

export const getCart = (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT uc.productId, uc.quantity, p.name, p.price, p.image, p.category 
        FROM user_carts uc 
        JOIN products p ON uc.productId = p.id 
        WHERE uc.userId = ?
    `;
    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

export const syncCart = (req, res) => {
    const userId = req.user.id;
    const { cart } = req.body; // Array of { productId, quantity }

    if (!Array.isArray(cart)) return res.status(400).json({ error: 'Cart must be an array' });

    db.serialize(() => {
        db.run('DELETE FROM user_carts WHERE userId = ?', [userId]);
        
        if (cart.length === 0) {
            return res.json({ success: true, message: 'Cart cleared' });
        }

        const now = new Date().toISOString();
        const stmt = db.prepare('INSERT INTO user_carts (userId, productId, quantity, updatedAt) VALUES (?, ?, ?, ?)');
        
        cart.forEach(item => {
            stmt.run([userId, item.productId || item.id, item.quantity, now]);
        });

        stmt.finalize();
        res.json({ success: true, message: 'Cart synchronized' });
    });
};

// --- PROFILE MANAGEMENT ---

export const getMyProfile = (req, res) => {
    const userId = req.user.id;

    // Fetch user basic info and customer CRM data
    const query = `
        SELECT u.id, u.name, u.email, u.role, 
               c.phone, c.address, c.city, c.department, c.idNumber, c.birthday
        FROM users u
        LEFT JOIN customers c ON u.email = c.email
        WHERE u.id = ?
    `;

    db.get(query, [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Perfil no encontrado' });
        res.json(row);
    });
};

export const updateMyProfile = async (req, res) => {
    const userId = req.user.id;
    const email = req.user.email;
    const { name, phone, address, city, department, idNumber } = req.body;

    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });

    db.serialize(() => {
        // 1. Update USERS table
        db.run('UPDATE users SET name = ? WHERE id = ?', [name, userId], (err) => {
            if (err) return res.status(500).json({ error: 'Error actualizando usuario' });

            // 2. Update CUSTOMERS table
            const now = new Date().toISOString();
            const customerSql = `
                UPDATE customers 
                SET name = ?, phone = ?, address = ?, city = ?, department = ?, idNumber = ?, updatedAt = ?
                WHERE email = ?
            `;
            
            db.run(customerSql, [name, phone, address, city, department, idNumber, now, email], function(custErr) {
                if (custErr) return res.status(500).json({ error: 'Error actualizando CRM' });

                // If customer didn't exist for some reason (rare), we could create it here, 
                // but sync on register usually handles it.
                
                logActivity({
                    userId: userId,
                    action: 'UPDATE_PROFILE',
                    module: 'USER_PANEL',
                    details: `Perfil actualizado por el usuario: ${email}`,
                    req: req
                });

                res.json({ 
                    success: true, 
                    message: 'Perfil actualizado correctamente',
                    user: { id: userId, name, email, role: req.user.role }
                });
            });
        });
    });
};
