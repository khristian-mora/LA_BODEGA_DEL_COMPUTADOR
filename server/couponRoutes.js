import { db } from './db.js';

// Get all coupons
export const getCoupons = (req, res) => {
    db.all('SELECT * FROM coupons ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// Get single coupon
export const getCoupon = (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM coupons WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Cupón no encontrado' });
        res.json(row);
    });
};

// Create coupon
export const createCoupon = (req, res) => {
    const { code, discount, type, expiresAt } = req.body;
    if (!code || !discount) return res.status(400).json({ error: 'Código y descuento son obligatorios' });

    const sql = `INSERT INTO coupons (code, discount, type, uses, status, expiresAt, createdAt)
                 VALUES (?, ?, ?, 0, 'active', ?, datetime('now'))`;
    const params = [code.toUpperCase(), discount, type || 'percent', expiresAt || null];

    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Ya existe un cupón con ese código' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ 
            id: this.lastID, 
            code: code.toUpperCase(), 
            discount, 
            type: type || 'percent',
            uses: 0,
            status: 'active',
            expiresAt
        });
    });
};

// Toggle coupon status
export const toggleCouponStatus = (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT status FROM coupons WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Cupón no encontrado' });
        
        const newStatus = row.status === 'active' ? 'expired' : 'active';
        db.run('UPDATE coupons SET status = ? WHERE id = ?', [newStatus, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, status: newStatus });
        });
    });
};

// Delete coupon
export const deleteCoupon = (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM coupons WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Cupón no encontrado' });
        res.json({ success: true });
    });
};
