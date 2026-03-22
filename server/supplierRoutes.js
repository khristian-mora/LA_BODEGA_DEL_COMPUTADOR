import { db } from './db.js';

// Get all suppliers
export const getSuppliers = (req, res) => {
    db.all('SELECT * FROM suppliers ORDER BY name ASC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// Get single supplier
export const getSupplier = (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM suppliers WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json(row);
    });
};

// Create supplier
export const createSupplier = (req, res) => {
    const { name, contact, email, phone, category, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const sql = `INSERT INTO suppliers (name, contact, email, phone, category, notes, status, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'))`;
    const params = [name, contact || '', email || '', phone || '', category || '', notes || ''];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, name, contact, email, phone, category, notes, status: 'active' });
    });
};

// Update supplier
export const updateSupplier = (req, res) => {
    const { id } = req.params;
    const { name, contact, email, phone, category, notes, status } = req.body;

    const sql = `UPDATE suppliers SET 
                 name = ?, contact = ?, email = ?, phone = ?, 
                 category = ?, notes = ?, status = ?, updatedAt = datetime('now')
                 WHERE id = ?`;
    const params = [name, contact, email, phone, category, notes, status || 'active', id];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json({ id: parseInt(id), ...req.body });
    });
};

// Delete supplier
export const deleteSupplier = (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM suppliers WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json({ success: true });
    });
};
