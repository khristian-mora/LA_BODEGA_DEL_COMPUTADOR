import { db } from './db.js';

// Get all expenses
export const getExpenses = (req, res) => {
    const { startDate, endDate, category } = req.query;
    
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (startDate) {
        sql += ' AND date >= ?';
        params.push(startDate);
    }
    if (endDate) {
        sql += ' AND date <= ?';
        params.push(endDate);
    }
    if (category) {
        sql += ' AND category = ?';
        params.push(category);
    }

    sql += ' ORDER BY date DESC';

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// Get expense summary
export const getExpenseSummary = (req, res) => {
    const { startDate, endDate } = req.query;
    
    let sql = `SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total
        FROM expenses WHERE 1=1`;
    const params = [];

    if (startDate) {
        sql += ' AND date >= ?';
        params.push(startDate);
    }
    if (endDate) {
        sql += ' AND date <= ?';
        params.push(endDate);
    }

    sql += ' GROUP BY category ORDER BY total DESC';

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const totalExpenses = rows.reduce((sum, r) => sum + (r.total || 0), 0);
        
        res.json({
            byCategory: rows,
            totalExpenses,
            count: rows.reduce((sum, r) => sum + (r.count || 0), 0)
        });
    });
};

// Get single expense
export const getExpense = (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM expenses WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Gasto no encontrado' });
        res.json(row);
    });
};

// Create expense
export const createExpense = (req, res) => {
    const { description, amount, category, vendor, date, paymentMethod, notes } = req.body;
    if (!description || !amount) return res.status(400).json({ error: 'Descripción y monto son obligatorios' });

    const sql = `INSERT INTO expenses (description, amount, category, vendor, date, paymentMethod, notes, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`;
    const params = [
        description, 
        amount, 
        category || 'General', 
        vendor || '', 
        date || new Date().toISOString().split('T')[0],
        paymentMethod || 'Efectivo',
        notes || ''
    ];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ 
            id: this.lastID, 
            description,
            amount,
            category: category || 'General',
            vendor,
            date: date || new Date().toISOString().split('T')[0],
            paymentMethod: paymentMethod || 'Efectivo',
            notes
        });
    });
};

// Update expense
export const updateExpense = (req, res) => {
    const { id } = req.params;
    const { description, amount, category, vendor, date, paymentMethod, notes } = req.body;

    const sql = `UPDATE expenses SET 
                 description = ?, amount = ?, category = ?, vendor = ?,
                 date = ?, paymentMethod = ?, notes = ?
                 WHERE id = ?`;
    const params = [description, amount, category, vendor, date, paymentMethod, notes, id];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Gasto no encontrado' });
        res.json({ id: parseInt(id), ...req.body });
    });
};

// Delete expense
export const deleteExpense = (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM expenses WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Gasto no encontrado' });
        res.json({ success: true });
    });
};
