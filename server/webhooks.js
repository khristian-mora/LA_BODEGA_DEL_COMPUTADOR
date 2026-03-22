// n8n Webhook Integration Endpoints
import express from 'express';
import { db } from './db.js';

const router = express.Router();

// Middleware para validar webhook secret
const validateWebhookSecret = (req, res, next) => {
    const secret = req.headers['x-webhook-secret'];
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET || 'change-me-in-production';

    if (secret !== expectedSecret) {
        return res.status(401).json({ error: 'Unauthorized - Invalid webhook secret' });
    }
    next();
};

// Helper function to trigger n8n webhook
const triggerN8nWebhook = async (event, data) => {
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
        console.log('[WEBHOOK] n8n URL not configured, skipping:', event);
        return;
    }

    // Check if fetch is available (Node.js 18+) or skip
    if (typeof fetch === 'undefined') {
        console.log('[WEBHOOK] fetch not available, install node-fetch or upgrade to Node.js 18+');
        console.log('[WEBHOOK] Event would have been triggered:', event);
        return;
    }

    try {
        const payload = {
            event,
            timestamp: new Date().toISOString(),
            data
        };

        const response = await fetch(n8nUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET || 'change-me-in-production'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('[WEBHOOK] Failed to trigger n8n:', event, response.status);
        } else {
            console.log('[WEBHOOK] Successfully triggered:', event);
        }
    } catch (error) {
        console.error('[WEBHOOK] Error triggering n8n:', error.message);
    }
};

// ==========================================
// TICKET WEBHOOKS
// ==========================================

// Ticket Created
router.post('/n8n/ticket-created', validateWebhookSecret, (req, res) => {
    const { ticketId } = req.body;

    db.get(`
        SELECT t.*, 
               c.name as clientName, c.phone as clientPhone, c.email as clientEmail
        FROM tickets t
        LEFT JOIN customers c ON t.customerId = c.id
        WHERE t.id = ?
    `, [ticketId], (err, ticket) => {
        if (err || !ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        triggerN8nWebhook('ticket.created', {
            ticketId: ticket.id,
            clientName: ticket.clientName || ticket.clientName,
            clientPhone: ticket.clientPhone || ticket.clientPhone,
            clientEmail: ticket.clientEmail || ticket.clientEmail,
            deviceType: ticket.deviceType,
            brand: ticket.brand,
            model: ticket.model,
            issue: ticket.issueDescription,
            estimatedCost: ticket.estimatedCost,
            status: ticket.status
        });

        res.json({ success: true, message: 'Webhook triggered' });
    });
});

// Ticket Ready for Pickup
router.post('/n8n/ticket-ready', validateWebhookSecret, (req, res) => {
    const { ticketId } = req.body;

    db.get(`
        SELECT t.*, 
               c.name as clientName, c.phone as clientPhone, c.email as clientEmail
        FROM tickets t
        LEFT JOIN customers c ON t.customerId = c.id
        WHERE t.id = ?
    `, [ticketId], (err, ticket) => {
        if (err || !ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        triggerN8nWebhook('ticket.ready', {
            ticketId: ticket.id,
            clientName: ticket.clientName || ticket.clientName,
            clientPhone: ticket.clientPhone || ticket.clientPhone,
            clientEmail: ticket.clientEmail || ticket.clientEmail,
            deviceType: `${ticket.deviceType} ${ticket.brand} ${ticket.model}`,
            finalCost: ticket.estimatedCost,
            repairSummary: ticket.diagnosis || 'Reparación completada'
        });

        res.json({ success: true, message: 'Webhook triggered' });
    });
});

// Ticket Delivered
router.post('/n8n/ticket-delivered', validateWebhookSecret, (req, res) => {
    const { ticketId } = req.body;

    db.get(`
        SELECT t.*, 
               c.name as clientName, c.phone as clientPhone, c.email as clientEmail
        FROM tickets t
        LEFT JOIN customers c ON t.customerId = c.id
        WHERE t.id = ?
    `, [ticketId], (err, ticket) => {
        if (err || !ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        triggerN8nWebhook('ticket.delivered', {
            ticketId: ticket.id,
            clientName: ticket.clientName || ticket.clientName,
            clientPhone: ticket.clientPhone || ticket.clientPhone,
            clientEmail: ticket.clientEmail || ticket.clientEmail,
            deviceType: `${ticket.deviceType} ${ticket.brand} ${ticket.model}`,
            finalCost: ticket.estimatedCost
        });

        res.json({ success: true, message: 'Webhook triggered' });
    });
});

// ==========================================
// APPOINTMENT WEBHOOKS
// ==========================================

// Appointment Created
router.post('/n8n/appointment-created', validateWebhookSecret, (req, res) => {
    const { appointmentId } = req.body;

    db.get(`
        SELECT a.*, 
               c.name as customerName, c.phone as customerPhone, c.email as customerEmail,
               u.name as technicianName
        FROM appointments a
        LEFT JOIN customers c ON a.customerId = c.id
        LEFT JOIN users u ON a.technicianId = u.id
        WHERE a.id = ?
    `, [appointmentId], (err, appointment) => {
        if (err || !appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        triggerN8nWebhook('appointment.created', {
            appointmentId: appointment.id,
            customerName: appointment.customerName,
            customerPhone: appointment.customerPhone,
            customerEmail: appointment.customerEmail,
            serviceType: appointment.serviceType,
            scheduledDate: appointment.scheduledDate,
            technicianName: appointment.technicianName || 'Por asignar',
            notes: appointment.notes
        });

        res.json({ success: true, message: 'Webhook triggered' });
    });
});

// Appointment Reminder (to be called by scheduled job)
router.post('/n8n/appointment-reminder', validateWebhookSecret, (req, res) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    db.all(`
        SELECT a.*, 
               c.name as customerName, c.phone as customerPhone, c.email as customerEmail,
               u.name as technicianName
        FROM appointments a
        LEFT JOIN customers c ON a.customerId = c.id
        LEFT JOIN users u ON a.technicianId = u.id
        WHERE DATE(a.scheduledDate) = ? AND a.status != 'Cancelled'
    `, [tomorrowStr], (err, appointments) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        appointments.forEach(appointment => {
            triggerN8nWebhook('appointment.reminder', {
                appointmentId: appointment.id,
                customerName: appointment.customerName,
                customerPhone: appointment.customerPhone,
                customerEmail: appointment.customerEmail,
                serviceType: appointment.serviceType,
                scheduledDate: appointment.scheduledDate,
                technicianName: appointment.technicianName || 'Por asignar'
            });
        });

        res.json({
            success: true,
            message: `Sent ${appointments.length} appointment reminders`
        });
    });
});

// ==========================================
// CUSTOMER WEBHOOKS
// ==========================================

// Customer Created
router.post('/n8n/customer-created', validateWebhookSecret, (req, res) => {
    const { customerId } = req.body;

    db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, customer) => {
        if (err || !customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        triggerN8nWebhook('customer.created', {
            customerId: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            customerType: customer.customerType
        });

        res.json({ success: true, message: 'Webhook triggered' });
    });
});

// ==========================================
// ORDER WEBHOOKS (Product Sales)
// ==========================================

// Order Created
router.post('/n8n/order-created', validateWebhookSecret, (req, res) => {
    const { orderId } = req.body;

    db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
        if (err || !order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get items for the order
        db.all('SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.productId = p.id WHERE oi.orderId = ?', [orderId], (err, items) => {
            triggerN8nWebhook('order.created', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                customerPhone: order.customerPhone,
                total: order.total,
                status: order.status,
                items: items || []
            });

            res.json({ success: true, message: 'Webhook triggered' });
        });
    });
});

// Order Status Updated
router.post('/n8n/order-status-updated', validateWebhookSecret, (req, res) => {
    const { orderId } = req.body;

    db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
        if (err || !order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        triggerN8nWebhook('order.status_updated', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            status: order.status
        });

        res.json({ success: true, message: 'Webhook triggered' });
    });
});

// ==========================================
// WARRANTY WEBHOOKS
// ==========================================

// Warranty Expiring Soon (to be called by scheduled job)
router.post('/n8n/warranty-expiring', validateWebhookSecret, (req, res) => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    db.all(`
        SELECT w.*, 
               c.name as customerName, c.phone as customerPhone, c.email as customerEmail,
               t.deviceType, t.brand, t.model
        FROM warranties w
        LEFT JOIN customers c ON w.customerId = c.id
        LEFT JOIN tickets t ON w.ticketId = t.id
        WHERE DATE(w.endDate) <= ? AND w.status = 'Active'
    `, [thirtyDaysFromNow.toISOString()], (err, warranties) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        warranties.forEach(warranty => {
            triggerN8nWebhook('warranty.expiring', {
                warrantyId: warranty.id,
                customerName: warranty.customerName,
                customerPhone: warranty.customerPhone,
                customerEmail: warranty.customerEmail,
                deviceType: `${warranty.deviceType} ${warranty.brand} ${warranty.model}`,
                endDate: warranty.endDate,
                daysRemaining: Math.ceil((new Date(warranty.endDate) - new Date()) / (1000 * 60 * 60 * 24))
            });
        });

        res.json({
            success: true,
            message: `Sent ${warranties.length} warranty expiration alerts`
        });
    });
});

// ==========================================
// SYSTEM WEBHOOKS
// ==========================================

// Backup Trigger
router.post('/n8n/backup-trigger', validateWebhookSecret, (req, res) => {
    triggerN8nWebhook('system.backup', {
        timestamp: new Date().toISOString(),
        databasePath: './server/database.sqlite'
    });

    res.json({ success: true, message: 'Backup webhook triggered' });
});

// Inventory Alert
router.post('/n8n/inventory-alert', validateWebhookSecret, (req, res) => {
    db.all(`
        SELECT * FROM products 
        WHERE stock < 10
        ORDER BY stock ASC
    `, [], (err, products) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (products.length > 0) {
            triggerN8nWebhook('inventory.low_stock', {
                products: products.map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    stock: p.stock,
                    price: p.price
                })),
                totalProducts: products.length
            });
        }

        res.json({
            success: true,
            message: `Found ${products.length} low stock products`
        });
    });
});

// Export helper function for use in other routes
export { triggerN8nWebhook };

export default router;
