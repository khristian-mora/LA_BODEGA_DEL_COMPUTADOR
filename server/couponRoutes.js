import { db, logActivity } from './db.js';

// Get all coupons with pagination, filtering, and search
export const getCoupons = (req, res) => {
    const { page = 1, limit = 10, search = '', type = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM coupons WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM coupons WHERE 1=1';
    const params = [];
    const countParams = [];

    if (search) {
        const searchPattern = `%${search}%`;
        sql += ' AND (code LIKE ? OR description LIKE ?)';
        countSql += ' AND (code LIKE ? OR description LIKE ?)';
        params.push(searchPattern, searchPattern);
        countParams.push(searchPattern, searchPattern);
    }

    if (type) {
        sql += ' AND type = ?';
        countSql += ' AND type = ?';
        params.push(type);
        countParams.push(type);
    }

    if (status) {
        const now = new Date().toISOString();
        if (status === 'active') {
            sql += ' AND status = "active" AND (expiresAt IS NULL OR expiresAt > ?)';
            countSql += ' AND status = "active" AND (expiresAt IS NULL OR expiresAt > ?)';
            params.push(now);
            countParams.push(now);
        } else if (status === 'expired') {
            sql += ' AND (status = "inactive" OR (expiresAt IS NOT NULL AND expiresAt <= ?))';
            countSql += ' AND (status = "inactive" OR (expiresAt IS NOT NULL AND expiresAt <= ?))';
            params.push(now);
            countParams.push(now);
        }
    }

    sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.get(countSql, countParams, (err, countResult) => {
        if (err) return res.status(500).json({ error: err.message });

        const total = countResult?.total || 0;

        db.all(sql, params, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                items: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        });
    });
};

// Create a new coupon
export const createCoupon = (req, res) => {
    const { code, type, discount, minPurchase, expiresAt, description, maxUses } = req.body;

    if (!code || !type || discount === undefined) {
        return res.status(400).json({ error: 'Código, tipo y descuento son requeridos' });
    }

    const sql = `
        INSERT INTO coupons (code, type, discount, minPurchase, expiresAt, description, maxUses, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `;

    const now = new Date().toISOString();

    db.run(sql, [code.toUpperCase(), type, discount, minPurchase, expiresAt, description, maxUses, now], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Este código de cupón ya existe' });
            }
            return res.status(500).json({ error: err.message });
        }

        logActivity({
            userId: req.user.id,
            action: 'CREATE',
            module: 'coupons',
            entityType: 'coupon',
            entityId: this.lastID,
            newValue: { code, type, discount },
            req
        });

        res.status(201).json({ id: this.lastID, message: 'Cupón creado correctamente' });
    });
};

// Update a coupon
export const updateCoupon = (req, res) => {
    const { id } = req.params;
    const { type, discount, minPurchase, expiresAt, description, maxUses, status } = req.body;

    db.get('SELECT * FROM coupons WHERE id = ?', [id], (err, oldCoupon) => {
        if (err || !oldCoupon) return res.status(404).json({ error: 'Cupón no encontrado' });

        const sql = `
            UPDATE coupons 
            SET type = ?, discount = ?, minPurchase = ?, expiresAt = ?, description = ?, maxUses = ?, status = ?
            WHERE id = ?
        `;

        db.run(sql, [type, discount, minPurchase, expiresAt, description, maxUses, status, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });

            logActivity({
                userId: req.user.id,
                action: 'UPDATE',
                module: 'coupons',
                entityType: 'coupon',
                entityId: id,
                oldValue: oldCoupon,
                newValue: { type, discount, status },
                req
            });

            res.json({ message: 'Cupón actualizado correctamente' });
        });
    });
};

// Delete a coupon
export const deleteCoupon = (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM coupons WHERE id = ?', [id], (err, oldCoupon) => {
        if (err || !oldCoupon) return res.status(404).json({ error: 'Cupón no encontrado' });

        db.run('DELETE FROM coupons WHERE id = ?', [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            logActivity({
                userId: req.user.id,
                action: 'DELETE',
                module: 'coupons',
                entityType: 'coupon',
                entityId: id,
                oldValue: oldCoupon,
                req
            });

            res.json({ message: 'Cupón eliminado correctamente' });
        });
    });
};

// Get coupon by code (for checkout)
export const getCouponByCode = (req, res) => {
    const { code } = req.params;
    const now = new Date().toISOString();

    const sql = `
        SELECT * FROM coupons 
        WHERE code = ? AND status = 'active' 
        AND (expiresAt IS NULL OR expiresAt > ?)
    `;

    db.get(sql, [code.toUpperCase(), now], (err, coupon) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!coupon) return res.status(404).json({ error: 'Cupón no válido o expirado' });

        // Check usage limit
        if (coupon.maxUses && coupon.uses >= coupon.maxUses) {
            return res.status(400).json({ error: 'Este cupón ha alcanzado su límite de uso' });
        }

        res.json(coupon);
    });
};

// Get Stats
export const getCouponStats = (req, res) => {
    const now = new Date().toISOString();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    db.get('SELECT COUNT(*) as total FROM coupons', [], (err, result) => {
        const total = result?.total || 0;

        db.get('SELECT COUNT(*) as active FROM coupons WHERE status = "active" AND (expiresAt IS NULL OR expiresAt > ?)', [now], (err, result) => {
            const active = result?.active || 0;

            db.get('SELECT SUM(uses) as totalUsed FROM coupons', [], (err, result) => {
                const totalUsed = result?.totalUsed || 0;

                db.all('SELECT type, COUNT(*) as count FROM coupons GROUP BY type', [], (err, byType) => {
                    // Get expiring soon (next 7 days)
                    db.all('SELECT code, discount, type, expiresAt FROM coupons WHERE status = "active" AND expiresAt IS NOT NULL AND expiresAt BETWEEN ? AND ? ORDER BY expiresAt ASC', 
                        [now, sevenDaysLater.toISOString()], (err, expiringRows) => {
                        
                        const expiringSoon = expiringRows ? expiringRows.map(row => ({
                            code: row.code,
                            discount: row.discount,
                            type: row.type,
                            daysUntilExpiry: Math.ceil((new Date(row.expiresAt) - new Date(now)) / (1000 * 60 * 60 * 24))
                        })) : [];

                        // Get top used coupons
                        db.all('SELECT code, discount, type, uses FROM coupons WHERE uses > 0 ORDER BY uses DESC LIMIT 5', [], (err, topRows) => {
                            const topCoupons = topRows || [];

                            res.json({
                                summary: {
                                    totalCoupons: total,
                                    activeCoupons: active,
                                    totalUses: totalUsed
                                },
                                expiringSoon,
                                topCoupons,
                                byType: byType || []
                            });
                        });
                    });
                });
            });
        });
    });
};

// Export Coupons
export const exportCoupons = (req, res) => {
    const { status, type, format = 'json' } = req.query;
    
    let sql = 'SELECT * FROM coupons WHERE 1=1';
    const params = [];

    if (status) {
        sql += ' AND status = ?';
        params.push(status);
    }
    if (type) {
        sql += ' AND type = ?';
        params.push(type);
    }

    sql += ' ORDER BY createdAt DESC';

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (format === 'json') {
            return res.json(rows);
        }

        // Convert to CSV
        const headers = ['ID', 'Código', 'Tipo', 'Descuento', 'Compra Mínima', 'Expira', 'Descripción', 'Usos Máximos', 'Usos Actuales', 'Estado'];
        const csvRows = rows.map(row => [
            row.id,
            row.code,
            row.type,
            row.discount,
            row.minPurchase || 0,
            row.expiresAt || 'Nunca',
            `"${(row.description || '').replace(/"/g, '""')}"`,
            row.maxUses || '∞',
            row.uses || 0,
            row.status
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
        
        const csv = [headers.join(','), ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=cupones_export.csv');
        res.send('\ufeff' + csv);
    });
};