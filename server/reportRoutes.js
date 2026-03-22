// Reports and Analytics Endpoints
import { db } from './db.js';

// Get sales report
export const getSalesReport = (req, res) => {
    const { startDate, endDate } = req.query;

    const sql = `
        SELECT 
            DATE(createdAt) as date,
            COUNT(*) as totalTickets,
            SUM(estimatedCost) as totalRevenue,
            AVG(estimatedCost) as avgTicketValue
        FROM tickets
        WHERE createdAt >= ? AND createdAt <= ?
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
    `;

    db.all(sql, [startDate, endDate], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

// Get inventory report
export const getInventoryReport = (req, res) => {
    const sql = `
        SELECT 
            category,
            COUNT(*) as totalProducts,
            SUM(stock) as totalStock,
            SUM(CASE WHEN stock < 10 THEN 1 ELSE 0 END) as lowStockCount,
            SUM(price * stock) as totalValue
        FROM products
        GROUP BY category
        ORDER BY totalValue DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

// Get technical service report
export const getServiceReport = (req, res) => {
    const { startDate, endDate } = req.query;

    const sql = `
        SELECT 
            status,
            COUNT(*) as count,
            AVG(estimatedCost) as avgCost,
            SUM(estimatedCost) as totalRevenue
        FROM tickets
        WHERE createdAt >= ? AND createdAt <= ?
        GROUP BY status
    `;

    db.all(sql, [startDate, endDate], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

// Get customer analytics
export const getCustomerAnalytics = (req, res) => {
    const sql = `
        SELECT 
            c.customerType,
            COUNT(DISTINCT c.id) as customerCount,
            COUNT(t.id) as totalServices,
            AVG(t.estimatedCost) as avgServiceValue
        FROM customers c
        LEFT JOIN tickets t ON c.phone = t.clientPhone OR c.name = t.clientName
        GROUP BY c.customerType
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

// Get top products
export const getTopProducts = (req, res) => {
    const limit = req.query.limit || 10;

    const sql = `
        SELECT 
            id, name, category, price, stock,
            (price * stock) as inventoryValue
        FROM products
        ORDER BY inventoryValue DESC
        LIMIT ?
    `;

    db.all(sql, [limit], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

// Get appointment statistics
export const getAppointmentStats = (req, res) => {
    const { startDate, endDate } = req.query;

    const sql = `
        SELECT 
            status,
            serviceType,
            COUNT(*) as count
        FROM appointments
        WHERE scheduledDate >= ? AND scheduledDate <= ?
        GROUP BY status, serviceType
    `;

    db.all(sql, [startDate, endDate], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

// Get general dashboard stats
export const getDashboardStats = (req, res) => {
    const stats = {};

    // Get total revenue from tickets
    db.get('SELECT SUM(estimatedCost) as total FROM tickets WHERE status = "DELIVERED"', [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        stats.totalRevenue = row.total || 0;

        // Get ticket counts
        db.all('SELECT status, COUNT(*) as count FROM tickets GROUP BY status', [], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            stats.ticketsByStatus = rows;

            // Get user count
            db.get('SELECT COUNT(*) as count FROM users WHERE status = ?', ['active'], (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                stats.activeUsers = row.count;

                // Get customer count
                db.get('SELECT COUNT(*) as count FROM customers', [], (err, row) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    stats.totalCustomers = row.count;

                    // Get product stats
                    db.get('SELECT COUNT(*) as total, SUM(CASE WHEN stock < 10 THEN 1 ELSE 0 END) as lowStock FROM products', [], (err, row) => {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        stats.totalProducts = row.total;
                        stats.lowStockProducts = row.lowStock;

                        res.json(stats);
                    });
                });
            });
        });
    });
};
