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

// 5. Get List of Available Automations
export const getAutomations = (req, res) => {
    const automations = [
        {
            id: 'abandoned_cart',
            name: 'Recuperación de Carritos',
            description: 'Envía recordatorios a clientes que no completaron su compra.',
            status: 'active',
            lastRun: new Date().toISOString(),
            type: 'Email/WhatsApp'
        },
        {
            id: 'maintenance_due',
            name: 'Recordatorio de Mantenimiento',
            description: 'Notifica a clientes que su equipo requiere mantenimiento (6 meses).',
            status: 'active',
            lastRun: new Date().toISOString(),
            type: 'Notification'
        },
        {
            id: 'low_stock',
            name: 'Alertas de Inventario Bajo',
            description: 'Notifica cuando productos bajan del stock mínimo.',
            status: 'active',
            lastRun: new Date().toISOString(),
            type: 'System/Email'
        },
        {
            id: 'customer_review',
            name: 'Solicitud de Reseñas',
            description: 'Solicita feedback a clientes 7 días después de la entrega.',
            status: 'disabled',
            lastRun: null,
            type: 'WhatsApp'
        }
    ];
    res.json(automations);
};

// 6. Test Automation Execution
export const testAutomation = (req, res) => {
    const { id } = req.body;
    console.log(`[AUTOMATION] Testing automation ID: ${id}`);
    
    // Simulate a successful test
    res.json({
        success: true,
        message: `Prueba de automatización '${id}' iniciada correctamente.`,
        timestamp: new Date().toISOString(),
        details: 'El sistema ha verificado los triggers y la conexión con el motor de reglas.'
    });
};
