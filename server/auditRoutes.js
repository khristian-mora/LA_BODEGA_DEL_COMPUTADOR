// Audit Routes - Activity Logs & Audit Trail
import { db } from './db.js';

// Get Audit Logs with Pagination and Filters
export const getAuditLogs = (req, res) => {
    const { page = 1, limit = 50, module, action, userId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
        SELECT 
            al.id,
            al.action,
            al.module,
            al.entityType,
            al.entityId,
            al.oldValue,
            al.newValue,
            al.ipAddress,
            al.timestamp,
            u.name as userName,
            u.email as userEmail
        FROM audit_logs al
        LEFT JOIN users u ON al.userId = u.id
        WHERE 1=1
    `;
    const params = [];

    if (module) {
        sql += ' AND al.module = ?';
        params.push(module);
    }
    if (action) {
        sql += ' AND al.action = ?';
        params.push(action);
    }
    if (userId) {
        sql += ' AND al.userId = ?';
        params.push(userId);
    }
    if (startDate) {
        sql += ' AND al.timestamp >= ?';
        params.push(startDate);
    }
    if (endDate) {
        sql += ' AND al.timestamp <= ?';
        params.push(endDate);
    }

    // Count total
    const countSql = sql.replace(/SELECT .*? FROM/, 'SELECT COUNT(*) as total FROM');

    db.get(countSql, params, (err, countResult) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const total = countResult?.total || 0;

        sql += ' ORDER BY al.timestamp DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        db.all(sql, params, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                items: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            });
        });
    });
};

// Get Audit Statistics
export const getAuditStats = (req, res) => {
    const stats = {};

    // Total actions
    db.get('SELECT COUNT(*) as total FROM audit_logs', [], (err, result) => {
        if (!err) stats.totalActions = result?.total || 0;

        // Actions by module
        db.all('SELECT module, COUNT(*) as count FROM audit_logs GROUP BY module ORDER BY count DESC LIMIT 10', [], (err, rows) => {
            if (!err) stats.actionsByModule = rows || [];

            // Actions by type
            db.all('SELECT action, COUNT(*) as count FROM audit_logs GROUP BY action ORDER BY count DESC LIMIT 10', [], (err, rows) => {
                if (!err) stats.actionsByType = rows || [];

                // Most active users
                db.all(`
                    SELECT u.name, al.userId, COUNT(*) as count
                    FROM audit_logs al
                    LEFT JOIN users u ON al.userId = u.id
                    GROUP BY al.userId
                    ORDER BY count DESC
                    LIMIT 10
                `, [], (err, rows) => {
                    if (!err) stats.mostActiveUsers = rows || [];

                    // Actions today
                    db.get(`
                        SELECT COUNT(*) as today 
                        FROM audit_logs 
                        WHERE DATE(timestamp) = DATE('now')
                    `, [], (err, result) => {
                        if (!err) stats.actionsToday = result?.today || 0;

                        // Actions this week
                        db.get(`
                            SELECT COUNT(*) as thisWeek 
                            FROM audit_logs 
                            WHERE timestamp >= datetime('now', '-7 days')
                        `, [], (err, result) => {
                            if (!err) stats.actionsThisWeek = result?.thisWeek || 0;

                            res.json(stats);
                        });
                    });
                });
            });
        });
    });
};

// Get Recent Activity (for dashboard)
export const getRecentActivity = (req, res) => {
    const { limit = 20 } = req.query;

    const sql = `
        SELECT 
            al.id,
            al.action,
            al.module,
            al.entityType,
            al.entityId,
            al.timestamp,
            u.name as userName
        FROM audit_logs al
        LEFT JOIN users u ON al.userId = u.id
        ORDER BY al.timestamp DESC
        LIMIT ?
    `;

    db.all(sql, [parseInt(limit)], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows || []);
    });
};

// Get Activity by User
export const getUserActivity = (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
        SELECT 
            al.id,
            al.action,
            al.module,
            al.entityType,
            al.entityId,
            al.oldValue,
            al.newValue,
            al.timestamp
        FROM audit_logs al
        WHERE al.userId = ?
        ORDER BY al.timestamp DESC
        LIMIT ? OFFSET ?
    `;

    db.all(sql, [userId, parseInt(limit), parseInt(offset)], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        db.get('SELECT COUNT(*) as total FROM audit_logs WHERE userId = ?', [userId], (err, countResult) => {
            res.json({
                items: rows || [],
                total: countResult?.total || 0
            });
        });
    });
};

// Export Audit Logs to CSV/JSON
export const exportAuditLogs = (req, res) => {
    const { module, action, startDate, endDate, format = 'json' } = req.query;

    let sql = `
        SELECT 
            al.id,
            u.name as userName,
            u.email as userEmail,
            al.action,
            al.module,
            al.entityType,
            al.entityId,
            al.oldValue,
            al.newValue,
            al.ipAddress,
            al.timestamp
        FROM audit_logs al
        LEFT JOIN users u ON al.userId = u.id
        WHERE 1=1
    `;
    const params = [];

    if (module) { sql += ' AND al.module = ?'; params.push(module); }
    if (action) { sql += ' AND al.action = ?'; params.push(action); }
    if (startDate) { sql += ' AND al.timestamp >= ?'; params.push(startDate); }
    if (endDate) { sql += ' AND al.timestamp <= ?'; params.push(endDate); }

    sql += ' ORDER BY al.timestamp DESC';

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (format === 'csv') {
            // Generate CSV
            const headers = ['ID', 'Usuario', 'Email', 'Acción', 'Módulo', 'Tipo Entidad', 'ID Entidad', 'IP', 'Fecha'];
            const csvRows = rows.map(r => [
                r.id,
                r.userName || 'Sistema',
                r.userEmail || '',
                r.action,
                r.module || '',
                r.entityType || '',
                r.entityId || '',
                r.ipAddress || '',
                r.timestamp
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

            const csv = [headers.join(','), ...csvRows].join('\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
            res.send('\ufeff' + csv); // BOM for Excel UTF-8
        } else {
            // Return JSON
            res.json({
                exportedAt: new Date().toISOString(),
                totalRecords: rows.length,
                logs: rows
            });
        }
    });
};
