// Reports and Analytics Endpoints - IMPROVED
import { db } from './db.js';
import { validators } from './validationUtils.js';

// Get sales report with date validation
export const getSalesReport = (req, res) => {
    const { startDate, endDate } = req.query;
    
    // Validate dates
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Se requieren startDate y endDate' });
    }
    
    const dateValidation = validators.isValidDate(startDate, 'startDate');
    if (!dateValidation.valid) {
        return res.status(400).json({ error: dateValidation.message });
    }
    
    const endDateValidation = validators.isValidDate(endDate, 'endDate');
    if (!endDateValidation.valid) {
        return res.status(400).json({ error: endDateValidation.message });
    }

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
            return res.status(500).json({ error: err.message });
        }
        
        // Calculate summary
        const summary = rows.reduce((acc, row) => ({
            totalTickets: acc.totalTickets + row.totalTickets,
            totalRevenue: acc.totalRevenue + row.totalRevenue,
            avgTicketValue: acc.totalTickets > 0 ? acc.totalRevenue / acc.totalTickets : 0
        }), { totalTickets: 0, totalRevenue: 0, avgTicketValue: 0 });
        
        res.json({
            data: rows,
            summary,
            dateRange: { startDate, endDate }
        });
    });
};

// Export sales report to CSV
export const exportSalesReport = (req, res) => {
    const { startDate, endDate } = req.query;
    
    // Validate dates
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Se requieren startDate y endDate' });
    }
    
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
            return res.status(500).json({ error: err.message });
        }
        
        // Generate CSV
        let csv = 'Fecha,Tickets,Ingresos,Promedio por Ticket\n';
        rows.forEach(row => {
            csv += `${row.date},${row.totalTickets},${row.totalRevenue.toFixed(2)},${row.avgTicketValue.toFixed(2)}\n`;
        });
        
        // Add summary
        const summary = rows.reduce((acc, row) => ({
            totalTickets: acc.totalTickets + row.totalTickets,
            totalRevenue: acc.totalRevenue + row.totalRevenue
        }), { totalTickets: 0, totalRevenue: 0 });
        
        csv += `\nTotal,${summary.totalTickets},${summary.totalRevenue.toFixed(2)},${summary.totalTickets > 0 ? (summary.totalRevenue / summary.totalTickets).toFixed(2) : 0}\n`;
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="reporte_ventas_${startDate}_${endDate}.csv"`);
        res.send('\ufeff' + csv); // BOM for Excel compatibility
    });
};

// Get inventory report with low stock alerts
export const getInventoryReport = (req, res) => {
    const { lowStockThreshold = 10 } = req.query;
    
    const sql = `
        SELECT 
            category,
            COUNT(*) as totalProducts,
            SUM(stock) as totalStock,
            SUM(CASE WHEN stock < ? THEN 1 ELSE 0 END) as lowStockCount,
            SUM(price * stock) as totalValue,
            AVG(price) as avgPrice
        FROM products
        GROUP BY category
        ORDER BY totalValue DESC
    `;

    db.all(sql, [lowStockThreshold], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Get low stock products details
        const lowStockSql = `
            SELECT id, name, category, stock, price, (price * stock) as value
            FROM products
            WHERE stock < ?
            ORDER BY stock ASC
            LIMIT 20
        `;
        
        db.all(lowStockSql, [lowStockThreshold], (err, lowStockRows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            res.json({
                byCategory: rows,
                lowStockProducts: lowStockRows,
                totalProducts: rows.reduce((sum, row) => sum + row.totalProducts, 0),
                totalValue: rows.reduce((sum, row) => sum + row.totalValue, 0),
                lowStockAlert: lowStockRows.length > 0
            });
        });
    });
};

// Export inventory report
export const exportInventoryReport = (req, res) => {
    const { lowStockThreshold = 10 } = req.query;
    
    const sql = `
        SELECT 
            name,
            category,
            stock,
            price,
            (price * stock) as totalValue,
            CASE WHEN stock < ? THEN 'BAJO' ELSE 'OK' END as status
        FROM products
        ORDER BY category, name
    `;

    db.all(sql, [lowStockThreshold], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Generate CSV
        let csv = 'Producto,Categoria,Stock,Precio,Valor Total,Estado\n';
        rows.forEach(row => {
            csv += `"${row.name}",${row.category},${row.stock},${row.price.toFixed(2)},${row.totalValue.toFixed(2)},${row.status}\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="reporte_inventario_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send('\ufeff' + csv);
    });
};

// Get orders report
export const getOrdersReport = (req, res) => {
    const { startDate, endDate, status } = req.query;
    
    let sql = `
        SELECT 
            DATE(createdAt) as date,
            status,
            COUNT(*) as orderCount,
            SUM(total) as totalRevenue,
            AVG(total) as avgOrderValue,
            COUNT(DISTINCT customerEmail) as uniqueCustomers
        FROM orders
        WHERE 1=1
    `;
    const params = [];
    
    if (startDate) {
        sql += ' AND createdAt >= ?';
        params.push(startDate);
    }
    
    if (endDate) {
        sql += ' AND createdAt <= ?';
        params.push(endDate);
    }
    
    if (status) {
        sql += ' AND status = ?';
        params.push(status);
    }
    
    sql += ' GROUP BY DATE(createdAt), status ORDER BY date DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Calculate totals
        const summary = rows.reduce((acc, row) => ({
            totalOrders: acc.totalOrders + row.orderCount,
            totalRevenue: acc.totalRevenue + row.totalRevenue,
            uniqueCustomers: Math.max(acc.uniqueCustomers, row.uniqueCustomers)
        }), { totalOrders: 0, totalRevenue: 0, uniqueCustomers: 0 });
        
        res.json({
            data: rows,
            summary,
            dateRange: { startDate: startDate || 'all', endDate: endDate || 'all' }
        });
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
            AVG(t.estimatedCost) as avgServiceValue,
            SUM(t.estimatedCost) as totalRevenue,
            MIN(c.createdAt) as firstCustomer,
            MAX(c.createdAt) as lastCustomer
        FROM customers c
        LEFT JOIN tickets t ON c.phone = t.clientPhone OR c.name = t.clientName
        GROUP BY c.customerType
        ORDER BY totalRevenue DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Calculate totals
        const totals = rows.reduce((acc, row) => ({
            totalCustomers: acc.totalCustomers + row.customerCount,
            totalServices: acc.totalServices + row.totalServices,
            totalRevenue: acc.totalRevenue + row.totalRevenue
        }), { totalCustomers: 0, totalServices: 0, totalRevenue: 0 });
        
        res.json({
            data: rows,
            totals,
            avgRevenuePerCustomer: totals.totalCustomers > 0 ? totals.totalRevenue / totals.totalCustomers : 0
        });
    });
};

// Get top products by inventory value or sales
export const getTopProducts = (req, res) => {
    const { limit = 10, sortBy = 'inventoryValue', startDate, endDate } = req.query;
    
    let sql;
    let params = [];
    
    if (startDate && endDate) {
        // Top products by sales in date range
        sql = `
            SELECT 
                p.id, p.name, p.category, p.price, p.stock,
                COUNT(oi.id) as timesSold,
                SUM(oi.quantity) as totalQuantitySold,
                SUM(oi.quantity * oi.price) as totalRevenue,
                AVG(oi.price) as avgSalePrice
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.productId
            LEFT JOIN orders o ON oi.orderId = o.id
            WHERE o.createdAt >= ? AND o.createdAt <= ?
            GROUP BY p.id
            ORDER BY totalRevenue DESC
            LIMIT ?
        `;
        params = [startDate, endDate, parseInt(limit)];
    } else {
        // Top products by inventory value
        sql = `
            SELECT 
                id, name, category, price, stock,
                (price * stock) as inventoryValue,
                CASE 
                    WHEN stock < 10 THEN 'CRITICAL'
                    WHEN stock < 50 THEN 'LOW'
                    WHEN stock < 100 THEN 'MEDIUM'
                    ELSE 'HIGH'
                END as stockLevel
            FROM products
            ORDER BY ${sortBy === 'stock' ? 'stock DESC' : 'inventoryValue DESC'}
            LIMIT ?
        `;
        params = [parseInt(limit)];
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Calculate totals
        const totals = rows.reduce((acc, row) => ({
            totalValue: acc.totalValue + (row.inventoryValue || row.totalRevenue || 0),
            totalStock: acc.totalStock + (row.stock || row.totalQuantitySold || 0)
        }), { totalValue: 0, totalStock: 0 });
        
        res.json({
            products: rows,
            totals,
            criteria: startDate && endDate ? `Ventas del ${startDate} al ${endDate}` : 'Valor de inventario'
        });
    });
};

// Get appointment statistics with validation
export const getAppointmentStats = (req, res) => {
    let { startDate, endDate, period = 'month' } = req.query;
    
    // Auto-calculate dates if missing
    if (!startDate || !endDate) {
        const end = new Date();
        const start = new Date();
        
        switch (period) {
            case 'week':
                start.setDate(end.getDate() - 7);
                break;
            case 'month':
                start.setMonth(end.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(end.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(end.getFullYear() - 1);
                break;
            default:
                start.setMonth(end.getMonth() - 1); // Default to month
        }
        
        startDate = start.toISOString().split('T')[0];
        endDate = end.toISOString().split('T')[0];
    }
    
    // Validate dates if they were provided or calculated
    const dateValidation = validators.isValidDate(startDate, 'startDate');
    if (!dateValidation.valid) {
        return res.status(400).json({ error: dateValidation.message });
    }
    
    const endDateValidation = validators.isValidDate(endDate, 'endDate');
    if (!endDateValidation.valid) {
        return res.status(400).json({ error: endDateValidation.message });
    }

    const sql = `
        SELECT 
            status,
            serviceType,
            COUNT(*) as count,
            AVG(CASE 
                WHEN status = 'Completado' THEN 1 
                ELSE 0 
            END) * 100 as completionRate
        FROM appointments
        WHERE scheduledDate >= ? AND scheduledDate <= ?
        GROUP BY status, serviceType
        ORDER BY count DESC
    `;

    db.all(sql, [startDate, endDate], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Calculate totals by status
        const byStatus = {};
        rows.forEach(row => {
            if (!byStatus[row.status]) {
                byStatus[row.status] = { count: 0, serviceTypes: {} };
            }
            byStatus[row.status].count += row.count;
            byStatus[row.status].serviceTypes[row.serviceType] = row.count;
        });
        
        // Calculate total appointments
        const totalAppointments = rows.reduce((sum, row) => sum + row.count, 0);
        
        res.json({
            data: rows,
            byStatus,
            totalAppointments,
            dateRange: { startDate, endDate }
        });
    });
};

// Get financial summary
export const getFinancialSummary = (req, res) => {
    const { startDate, endDate } = req.query;
    
    // Validate dates
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Se requieren startDate y endDate' });
    }
    
    // Get revenue from tickets (services)
    const ticketSql = `
        SELECT 
            SUM(estimatedCost) as serviceRevenue,
            COUNT(*) as totalTickets,
            AVG(estimatedCost) as avgTicketValue
        FROM tickets
        WHERE status = 'DELIVERED' AND createdAt >= ? AND createdAt <= ?
    `;
    
    db.get(ticketSql, [startDate, endDate], (err, ticketRow) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Get revenue from orders (products)
        const orderSql = `
            SELECT 
                SUM(total) as productRevenue,
                COUNT(*) as totalOrders,
                AVG(total) as avgOrderValue
            FROM orders
            WHERE status != 'Cancelado' AND createdAt >= ? AND createdAt <= ?
        `;
        
        db.get(orderSql, [startDate, endDate], (err, orderRow) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            // Get expenses
            const expenseSql = `
                SELECT 
                    SUM(amount) as totalExpenses,
                    COUNT(*) as expenseCount
                FROM expenses
                WHERE date >= ? AND date <= ? AND status = 'aprobado'
            `;
            
            db.get(expenseSql, [startDate, endDate], (err, expenseRow) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                const serviceRevenue = ticketRow.serviceRevenue || 0;
                const productRevenue = orderRow.productRevenue || 0;
                const totalRevenue = serviceRevenue + productRevenue;
                const totalExpenses = expenseRow.totalExpenses || 0;
                const netProfit = totalRevenue - totalExpenses;
                const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
                
                res.json({
                    revenue: {
                        services: serviceRevenue,
                        products: productRevenue,
                        total: totalRevenue
                    },
                    orders: {
                        total: orderRow.totalOrders || 0,
                        average: orderRow.avgOrderValue || 0
                    },
                    tickets: {
                        total: ticketRow.totalTickets || 0,
                        average: ticketRow.avgTicketValue || 0
                    },
                    expenses: {
                        total: totalExpenses,
                        count: expenseRow.expenseCount || 0
                    },
                    profit: {
                        net: netProfit,
                        margin: profitMargin.toFixed(2)
                    },
                    dateRange: { startDate, endDate }
                });
            });
        });
    });
};

// Get comprehensive dashboard stats
export const getDashboardStats = (req, res) => {
    const stats = {};
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Get revenue from tickets (last 30 days)
    db.get(`
        SELECT SUM(estimatedCost) as total 
        FROM tickets 
        WHERE status = 'DELIVERED' AND createdAt >= ?
    `, [thirtyDaysAgo], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.serviceRevenue = row.total || 0;

        // Get revenue from orders (last 30 days)
        db.get(`
            SELECT SUM(total) as total 
            FROM orders 
            WHERE status != 'Cancelado' AND createdAt >= ?
        `, [thirtyDaysAgo], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.productRevenue = row.total || 0;
            stats.totalRevenue = stats.serviceRevenue + stats.productRevenue;

            // Get ticket counts by status
            db.all('SELECT status, COUNT(*) as count FROM tickets GROUP BY status', [], (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.ticketsByStatus = rows;
                stats.totalTickets = rows.reduce((sum, row) => sum + row.count, 0);

                // Get today's stats
                db.get(`
                    SELECT 
                        COUNT(*) as todayTickets,
                        SUM(estimatedCost) as todayRevenue
                    FROM tickets 
                    WHERE DATE(createdAt) = ?
                `, [today], (err, row) => {
                    if (err) return res.status(500).json({ error: err.message });
                    stats.today = {
                        tickets: row.todayTickets || 0,
                        revenue: row.todayRevenue || 0
                    };

                    // Get user count
                    db.get('SELECT COUNT(*) as count FROM users WHERE status = ?', ['active'], (err, row) => {
                        if (err) return res.status(500).json({ error: err.message });
                        stats.activeUsers = row.count;

                        // Get customer count
                        db.get('SELECT COUNT(*) as count FROM customers', [], (err, row) => {
                            if (err) return res.status(500).json({ error: err.message });
                            stats.totalCustomers = row.count;

                            // Get product stats
                            db.get(`
                                SELECT 
                                    COUNT(*) as totalProducts, 
                                    SUM(CASE WHEN stock < 10 THEN 1 ELSE 0 END) as lowStockProducts,
                                    SUM(price * stock) as inventoryValue
                                FROM products
                            `, [], (err, row) => {
                                if (err) return res.status(500).json({ error: err.message });
                                stats.products = {
                                    total: row.totalProducts,
                                    lowStock: row.lowStockProducts,
                                    inventoryValue: row.inventoryValue || 0
                                };

                                // Get recent activity (last 10)
                                db.all(`
                                    SELECT action, module, details, timestamp
                                    FROM user_activity_log
                                    ORDER BY timestamp DESC
                                    LIMIT 10
                                `, [], (err, rows) => {
                                    if (err) return res.status(500).json({ error: err.message });
                                    stats.recentActivity = rows;

                                    res.json(stats);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};
