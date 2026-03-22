// Appointment Management Endpoints
import { db } from './db.js';

// Get all appointments
export const getAppointments = (req, res) => {
    const sql = `
        SELECT a.*, 
               c.name as customerName, c.phone as customerPhone,
               u.name as technicianName
        FROM appointments a
        LEFT JOIN customers c ON a.customerId = c.id
        LEFT JOIN users u ON a.technicianId = u.id
        ORDER BY a.scheduledDate DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

// Get single appointment
export const getAppointment = (req, res) => {
    const sql = `
        SELECT a.*, 
               c.name as customerName, c.email as customerEmail, c.phone as customerPhone,
               u.name as technicianName
        FROM appointments a
        LEFT JOIN customers c ON a.customerId = c.id
        LEFT JOIN users u ON a.technicianId = u.id
        WHERE a.id = ?
    `;

    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Cita no encontrada' });
            return;
        }
        res.json(row);
    });
};

// Create appointment
export const createAppointment = (req, res) => {
    const { customerId, technicianId, serviceType, scheduledDate, notes } = req.body;

    if (!customerId || !scheduledDate || !serviceType) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const sql = 'INSERT INTO appointments (customerId, technicianId, serviceType, scheduledDate, status, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const now = new Date().toISOString();

    db.run(sql, [customerId, technicianId, serviceType, scheduledDate, 'Pending', notes, now], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, customerId, scheduledDate, status: 'Pending' });
    });
};

// Update appointment
export const updateAppointment = (req, res) => {
    const { customerId, technicianId, serviceType, scheduledDate, status, notes } = req.body;

    let updates = [];
    let params = [];

    if (customerId) { updates.push('customerId = ?'); params.push(customerId); }
    if (technicianId !== undefined) { updates.push('technicianId = ?'); params.push(technicianId); }
    if (serviceType) { updates.push('serviceType = ?'); params.push(serviceType); }
    if (scheduledDate) { updates.push('scheduledDate = ?'); params.push(scheduledDate); }
    if (status) { updates.push('status = ?'); params.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

    params.push(req.params.id);

    const sql = `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`;

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
};

// Delete appointment
export const deleteAppointment = (req, res) => {
    db.run('DELETE FROM appointments WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
};

// Get appointments by date range
export const getAppointmentsByDateRange = (req, res) => {
    const { startDate, endDate } = req.query;

    const sql = `
        SELECT a.*, 
               c.name as customerName, c.phone as customerPhone,
               u.name as technicianName
        FROM appointments a
        LEFT JOIN customers c ON a.customerId = c.id
        LEFT JOIN users u ON a.technicianId = u.id
        WHERE a.scheduledDate >= ? AND a.scheduledDate <= ?
        ORDER BY a.scheduledDate ASC
    `;

    db.all(sql, [startDate, endDate], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};
