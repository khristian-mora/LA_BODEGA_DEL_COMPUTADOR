// Warranty Management Endpoints
import { db } from './db.js';

// Get all warranties
export const getWarranties = (req, res) => {
    const sql = `
        SELECT w.*, 
               c.name as customerName,
               t.deviceType, t.brand, t.model
        FROM warranties w
        LEFT JOIN customers c ON w.customerId = c.id
        LEFT JOIN tickets t ON w.ticketId = t.id
        ORDER BY w.createdAt DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

// Get single warranty with claims
export const getWarranty = (req, res) => {
    const sql = `
        SELECT w.*, 
               c.name as customerName, c.email as customerEmail, c.phone as customerPhone,
               t.deviceType, t.brand, t.model
        FROM warranties w
        LEFT JOIN customers c ON w.customerId = c.id
        LEFT JOIN tickets t ON w.ticketId = t.id
        WHERE w.id = ?
    `;

    db.get(sql, [req.params.id], (err, warranty) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!warranty) {
            res.status(404).json({ error: 'Garantía no encontrada' });
            return;
        }

        // Get claims for this warranty
        db.all('SELECT * FROM warranty_claims WHERE warrantyId = ? ORDER BY claimDate DESC', [req.params.id], (err, claims) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            warranty.claims = claims;
            res.json(warranty);
        });
    });
};

// Create warranty
export const createWarranty = (req, res) => {
    const { ticketId, customerId, productId, startDate, endDate, terms } = req.body;

    if (!customerId || !startDate || !endDate) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const sql = 'INSERT INTO warranties (ticketId, orderId, productId, customerId, startDate, endDate, terms, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const now = new Date().toISOString();

    db.run(sql, [ticketId, null, productId, customerId, startDate, endDate, terms, 'Active', now], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, customerId, status: 'Active' });
    });
};

// Update warranty
export const updateWarranty = (req, res) => {
    const { ticketId, productId, customerId, startDate, endDate, terms, status } = req.body;

    let updates = [];
    let params = [];

    if (ticketId !== undefined) { updates.push('ticketId = ?'); params.push(ticketId); }
    if (productId !== undefined) { updates.push('productId = ?'); params.push(productId); }
    if (customerId) { updates.push('customerId = ?'); params.push(customerId); }
    if (startDate) { updates.push('startDate = ?'); params.push(startDate); }
    if (endDate) { updates.push('endDate = ?'); params.push(endDate); }
    if (terms !== undefined) { updates.push('terms = ?'); params.push(terms); }
    if (status) { updates.push('status = ?'); params.push(status); }

    params.push(req.params.id);

    const sql = `UPDATE warranties SET ${updates.join(', ')} WHERE id = ?`;

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
};

// Delete warranty
export const deleteWarranty = (req, res) => {
    db.run('DELETE FROM warranties WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
};

// Create warranty claim
export const createClaim = (req, res) => {
    const { warrantyId, description } = req.body;

    if (!warrantyId || !description) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const sql = 'INSERT INTO warranty_claims (warrantyId, claimDate, description) VALUES (?, ?, ?)';
    const now = new Date().toISOString();

    db.run(sql, [warrantyId, now, description], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, warrantyId });
    });
};

// Resolve warranty claim
export const resolveClaim = (req, res) => {
    const { resolution } = req.body;
    const now = new Date().toISOString();

    db.run('UPDATE warranty_claims SET resolution = ?, resolvedDate = ? WHERE id = ?', [resolution, now, req.params.id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
};
