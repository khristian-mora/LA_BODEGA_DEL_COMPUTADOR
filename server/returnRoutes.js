import { db } from './db.js';

// Get all returns
export const getReturns = (req, res) => {
    db.all('SELECT * FROM returns ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// Get single return
export const getReturn = (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM returns WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Devolution no encontrada' });
        res.json(row);
    });
};

// Create return (RMA)
export const createReturn = (req, res) => {
    const { orderId, customerId, customerName, product, reason, refundAmount } = req.body;
    if (!product || !reason) return res.status(400).json({ error: 'Producto y razón son obligatorios' });

    // Generate RMA code
    db.get('SELECT COUNT(*) as count FROM returns', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const rmaCode = `RMA-${String(row.count + 1).padStart(3, '0')}`;
        const sql = `INSERT INTO returns (rmaCode, orderId, customerId, customerName, product, reason, status, refundAmount, createdAt)
                     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))`;
        const params = [rmaCode, orderId || null, customerId || null, customerName || '', product, reason, refundAmount || 0];

        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ 
                id: this.lastID, 
                rmaCode,
                orderId,
                customerId,
                customerName,
                product,
                reason,
                status: 'pending',
                refundAmount: refundAmount || 0,
                createdAt: new Date().toISOString()
            });
        });
    });
};

// Update return status
export const updateReturnStatus = (req, res) => {
    const { id } = req.params;
    const { status, resolution, refundAmount } = req.body;

    let sql = 'UPDATE returns SET status = ?';
    const params = [status];

    if (resolution) {
        sql += ', resolution = ?';
        params.push(resolution);
    }
    if (refundAmount !== undefined) {
        sql += ', refundAmount = ?';
        params.push(refundAmount);
    }
    if (status === 'resolved' || status === 'refunded') {
        sql += ', resolvedAt = datetime(\'now\')';
    }

    sql += ' WHERE id = ?';
    params.push(id);

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Devolution no encontrada' });
        res.json({ success: true, id: parseInt(id), status, resolution, refundAmount });
    });
};

// Delete return
export const deleteReturn = (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM returns WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Devolution no encontrada' });
        res.json({ success: true });
    });
};
