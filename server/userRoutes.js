// User Management Endpoints
import { db } from './db.js';
import bcrypt from 'bcryptjs';

// Log user activity
export const logActivity = (userId, action, module, details = '') => {
    db.run(
        'INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)',
        [userId, action, module, details, new Date().toISOString()]
    );
};

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

        // Force role to 'client' and status to 'active'
        db.run(sql, [name, email, hashedPassword, 'client', 'active', now], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    res.status(400).json({ error: 'El email ya está registrado' });
                } else {
                    res.status(400).json({ error: err.message });
                }
                return;
            }

            // Auto-login logic could go here, but for now just return success
            res.json({ success: true, message: 'Registro exitoso' });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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

            logActivity(req.user.id, 'CREATE_USER', 'users', `Created user: ${name}`);
            res.json({ id: this.lastID, name, email, role });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update user
export const updateUser = async (req, res) => {
    const { name, email, role, status, password } = req.body;

    let updates = [];
    let params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (email) { updates.push('email = ?'); params.push(email); }
    if (role) { updates.push('role = ?'); params.push(role); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    // Update password if provided
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

        logActivity(req.user.id, 'UPDATE_USER', 'users', `Updated user ID: ${req.params.id}`);
        res.json({ success: true });
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

        logActivity(req.user.id, 'DELETE_USER', 'users', `Deactivated user ID: ${req.params.id}`);
        res.json({ success: true });
    });
};

// Get user activity log
export const getUserActivity = (req, res) => {
    const limit = req.query.limit || 50;
    db.all(
        `SELECT ual.*, u.name as username 
         FROM user_activity_log ual 
         LEFT JOIN users u ON ual.userId = u.id 
         ORDER BY ual.timestamp DESC 
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
