// Automation & Marketing Routes for n8n
import { db } from './db.js';

// 1. Save Cart Draft (Abandoned Cart Recovery)
export const saveCartDraft = (req, res) => {
    const { email, phone, name, cartData } = req.body;
    const updatedAt = new Date().toISOString();

    // Check if draft exists by email or phone
    const checkSql = 'SELECT id FROM cart_drafts WHERE (email = ? AND email != "") OR (phone = ? AND phone != "")';
    db.get(checkSql, [email, phone], (err, row) => {
        if (row) {
            const updateSql = 'UPDATE cart_drafts SET email = ?, phone = ?, name = ?, cartData = ?, updatedAt = ? WHERE id = ?';
            db.run(updateSql, [email, phone, name, JSON.stringify(cartData), updatedAt, row.id], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: row.id, action: 'updated' });
            });
        } else {
            const insertSql = 'INSERT INTO cart_drafts (email, phone, name, cartData, updatedAt) VALUES (?, ?, ?, ?, ?)';
            db.run(insertSql, [email, phone, name, JSON.stringify(cartData), updatedAt], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: this.lastID, action: 'created' });
            });
        }
    });
};

// 2. Get Maintenance Due (Customers who had service 6 months ago)
export const getMaintenanceDue = (req, res) => {
    // Current date minus 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const dateLimit = sixMonthsAgo.toISOString();

    const sql = `
        SELECT clientName, clientPhone, deviceType, brand, model, MAX(updatedAt) as lastServiceDate
        FROM tickets
        WHERE status = 'DELIVERED' AND updatedAt <= ?
        GROUP BY clientPhone
        ORDER BY lastServiceDate ASC
    `;

    db.all(sql, [dateLimit], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            count: rows.length,
            customers: rows
        });
    });
};

// 3. Get Review Ready (Delivered services in the last 7 days not yet reviewed/contacted)
// (Simplified: showing recently delivered tickets for n8n to process)
export const getReviewReady = (req, res) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateLimit = sevenDaysAgo.toISOString();

    const sql = `
        SELECT id, clientName, clientPhone, deviceType, brand, model, updatedAt
        FROM tickets
        WHERE status = 'DELIVERED' AND updatedAt >= ?
        ORDER BY updatedAt DESC
    `;

    db.all(sql, [dateLimit], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            count: rows.length,
            services: rows
        });
    });
};

// 4. Low Stock Webhook Trigger helper (Internal check)
export const checkInventoryAlerts = (req, res) => {
    const sql = 'SELECT * FROM products WHERE stock <= minStock';
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            alerts: rows.map(p => ({
                id: p.id,
                name: p.name,
                stock: p.stock,
                minStock: p.minStock,
                supplier: p.supplierEmail
            }))
        });
    });
};
