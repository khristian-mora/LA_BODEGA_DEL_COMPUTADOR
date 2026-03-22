// Customer Management Endpoints
import { db } from './db.js';

// Get all customers
export const getCustomers = (req, res) => {
    db.all('SELECT * FROM customers ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

// Get single customer with history
export const getCustomer = (req, res) => {
    db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, customer) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!customer) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }

        // Get customer's tickets
        db.all('SELECT * FROM tickets WHERE clientPhone = ? OR clientName = ? ORDER BY createdAt DESC',
            [customer.phone, customer.name],
            (err, tickets) => {
                res.json({
                    ...customer,
                    tickets: tickets || []
                });
            }
        );
    });
};

// Create customer
export const createCustomer = (req, res) => {
    const { name, email, phone, address, idNumber, customerType, notes } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const sql = 'INSERT INTO customers (name, email, phone, address, idNumber, customerType, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const now = new Date().toISOString();

    db.run(sql, [name, email, phone, address, idNumber, customerType || 'Regular', notes, now, now], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, name, email, phone });
    });
};

// Update customer
export const updateCustomer = (req, res) => {
    const { name, email, phone, address, idNumber, customerType, notes } = req.body;

    let updates = [];
    let params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (idNumber !== undefined) { updates.push('idNumber = ?'); params.push(idNumber); }
    if (customerType) { updates.push('customerType = ?'); params.push(customerType); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(req.params.id);

    const sql = `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`;

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
};

// Delete customer
export const deleteCustomer = (req, res) => {
    db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
};

// Search customers
export const searchCustomers = (req, res) => {
    const query = req.query.q || '';
    const sql = `SELECT * FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR idNumber LIKE ? ORDER BY name ASC LIMIT 20`;
    const searchTerm = `%${query}%`;

    db.all(sql, [searchTerm, searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};
