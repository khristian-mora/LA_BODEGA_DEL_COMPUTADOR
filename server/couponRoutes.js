import { db } from './db.js';

// Get all coupons with pagination, filtering, and search
export const getCoupons = (req, res) => {
    const { 
        status, 
        type,
        startDate, 
        endDate,
        search,
        page = 1, 
        limit = 20, 
        sortBy = 'createdAt', 
        sortOrder = 'DESC' 
    } = req.query;
    
    // Pagination validation
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    
    // Validate sort parameters
    const validSortColumns = ['createdAt', 'code', 'discount', 'uses', 'status', 'expiresAt'];
    const validSortOrders = ['ASC', 'DESC'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = validSortOrders.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    let sql = `
        SELECT * FROM coupons
        WHERE 1=1
    `;
    
    let countSql = `
        SELECT COUNT(*) as total
        FROM coupons
        WHERE 1=1
    `;
    
    const params = [];
    const countParams = [];
    
    // Filter by status
    if (status) {
        sql += ' AND status = ?';
        countSql += ' AND status = ?';
        params.push(status);
        countParams.push(status);
    }
    
    // Filter by type
    if (type) {
        sql += ' AND type = ?';
        countSql += ' AND type = ?';
        params.push(type);
        countParams.push(type);
    }
    
    // Date range filter (based on expiration)
    if (startDate) {
        sql += ' AND (expiresAt >= ? OR expiresAt IS NULL)';
        countSql += ' AND (expiresAt >= ? OR expiresAt IS NULL)';
        params.push(startDate);
        countParams.push(startDate);
    }
    if (endDate) {
        sql += ' AND (expiresAt <= ? OR expiresAt IS NULL)';
        countSql += ' AND (expiresAt <= ? OR expiresAt IS NULL)';
        params.push(endDate);
        countParams.push(endDate);
    }
    
    // Search filter
    if (search) {
        sql += ` AND (code LIKE ? OR type LIKE ?)`;
        countSql += ` AND (code LIKE ? OR type LIKE ?)`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam);
        countParams.push(searchParam, searchParam);
    }
    
    // Get total count
    db.get(countSql, countParams, (err, countResult) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const total = countResult.total;
        const totalPages = Math.ceil(total / limitNum);
        
        // Add sorting and pagination
        sql += ` ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        
        db.all(sql, params, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
                coupons: rows,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1
                }
            });
        });
    });
};

// Get coupon statistics for dashboard
export const getCouponStats = (req, res) => {
    const { period = 'month' } = req.query;
    
    let periodCondition = '';
    if (period === 'week') {
        periodCondition = "AND createdAt >= date('now', '-7 days')";
    } else if (period === 'month') {
        periodCondition = "AND createdAt >= date('now', '-30 days')";
    } else if (period === 'quarter') {
        periodCondition = "AND createdAt >= date('now', '-90 days')";
    }
    
    // Total coupons and usage
    const totalSql = `
        SELECT 
            COUNT(*) as totalCoupons,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeCoupons,
            SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expiredCoupons,
            SUM(uses) as totalUses,
            SUM(CASE WHEN type = 'percent' THEN discount ELSE 0 END) as totalPercentDiscount,
            SUM(CASE WHEN type = 'fixed' THEN discount ELSE 0 END) as totalFixedDiscount
        FROM coupons
        WHERE 1=1 ${periodCondition}
    `;
    
    // Top performing coupons
    const topCouponsSql = `
        SELECT code, discount, type, uses, status, expiresAt
        FROM coupons
        WHERE uses > 0 ${periodCondition}
        ORDER BY uses DESC
        LIMIT 10
    `;
    
    // Coupons by type distribution
    const typeDistributionSql = `
        SELECT type, COUNT(*) as count, SUM(uses) as totalUses
        FROM coupons
        WHERE 1=1 ${periodCondition}
        GROUP BY type
    `;
    
    // Expiring soon (within 7 days)
    const expiringSoonSql = `
        SELECT code, discount, type, expiresAt, 
               JULIANDAY(expiresAt) - JULIANDAY('now') as daysUntilExpiry
        FROM coupons
        WHERE status = 'active' 
          AND expiresAt IS NOT NULL 
          AND expiresAt BETWEEN datetime('now') AND datetime('now', '+7 days')
        ORDER BY expiresAt ASC
    `;
    
    // Coupons created by month trend
    const monthlyTrendSql = `
        SELECT 
            strftime('%Y-%m', createdAt) as month,
            COUNT(*) as couponsCreated,
            SUM(uses) as totalUses
        FROM coupons
        WHERE createdAt >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', createdAt)
        ORDER BY month DESC
        LIMIT 6
    `;
    
    Promise.all([
        new Promise((resolve, reject) => {
            db.get(totalSql, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(topCouponsSql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(typeDistributionSql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(expiringSoonSql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(monthlyTrendSql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        })
    ]).then(([summary, topCoupons, typeDistribution, expiringSoon, monthlyTrend]) => {
        res.json({
            summary: summary || {
                totalCoupons: 0,
                activeCoupons: 0,
                expiredCoupons: 0,
                totalUses: 0,
                totalPercentDiscount: 0,
                totalFixedDiscount: 0
            },
            topCoupons,
            typeDistribution,
            expiringSoon,
            monthlyTrend
        });
    }).catch(err => {
        res.status(500).json({ error: err.message });
    });
};

// Get single coupon
export const getCoupon = (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM coupons WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Cupón no encontrado' });
        res.json(row);
    });
};

// Create coupon with enhanced validation
export const createCoupon = (req, res) => {
    const { code, discount, type, expiresAt, minPurchase, maxUses, description } = req.body;
    
    // Enhanced validation
    if (!code || code.trim().length < 3) {
        return res.status(400).json({ error: 'El código debe tener al menos 3 caracteres' });
    }
    
    if (!discount || discount <= 0) {
        return res.status(400).json({ error: 'El descuento debe ser mayor a 0' });
    }
    
    if (type === 'percent' && discount > 100) {
        return res.status(400).json({ error: 'El descuento porcentual no puede ser mayor a 100%' });
    }
    
    if (type && !['percent', 'fixed'].includes(type)) {
        return res.status(400).json({ error: 'El tipo debe ser "percent" o "fixed"' });
    }
    
    if (expiresAt && new Date(expiresAt) < new Date()) {
        return res.status(400).json({ error: 'La fecha de expiración no puede ser en el pasado' });
    }
    
    if (maxUses && maxUses <= 0) {
        return res.status(400).json({ error: 'El máximo de usos debe ser mayor a 0' });
    }

    const sql = `INSERT INTO coupons (code, discount, type, uses, status, expiresAt, minPurchase, maxUses, description, createdAt)
                 VALUES (?, ?, ?, 0, 'active', ?, ?, ?, ?, datetime('now'))`;
    const params = [
        code.toUpperCase().trim(), 
        discount, 
        type || 'percent', 
        expiresAt || null,
        minPurchase || 0,
        maxUses || null,
        description || null
    ];

    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Ya existe un cupón con ese código' });
            }
            return res.status(500).json({ error: err.message });
        }
        
        // Log activity
        logActivity(req.user.id, 'CREATE', 'coupons', `Cupón creado: ${code.toUpperCase()}`);
        
        res.status(201).json({ 
            id: this.lastID, 
            code: code.toUpperCase().trim(), 
            discount, 
            type: type || 'percent',
            uses: 0,
            status: 'active',
            expiresAt: expiresAt || null,
            minPurchase: minPurchase || 0,
            maxUses: maxUses || null,
            description: description || null
        });
    });
};

// Update coupon
export const updateCoupon = (req, res) => {
    const { id } = req.params;
    const { discount, type, expiresAt, minPurchase, maxUses, description, status } = req.body;
    
    // Check if coupon exists
    db.get('SELECT * FROM coupons WHERE id = ?', [id], (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!existing) return res.status(404).json({ error: 'Cupón no encontrado' });
        
        // Build dynamic update
        let updates = [];
        let params = [];
        
        if (discount !== undefined) {
            if (discount <= 0) return res.status(400).json({ error: 'El descuento debe ser mayor a 0' });
            if (type === 'percent' && discount > 100) {
                return res.status(400).json({ error: 'El descuento porcentual no puede ser mayor a 100%' });
            }
            updates.push('discount = ?');
            params.push(discount);
        }
        
        if (type !== undefined) {
            if (!['percent', 'fixed'].includes(type)) {
                return res.status(400).json({ error: 'El tipo debe ser "percent" o "fixed"' });
            }
            updates.push('type = ?');
            params.push(type);
        }
        
        if (expiresAt !== undefined) {
            if (expiresAt && new Date(expiresAt) < new Date()) {
                return res.status(400).json({ error: 'La fecha de expiración no puede ser en el pasado' });
            }
            updates.push('expiresAt = ?');
            params.push(expiresAt || null);
        }
        
        if (minPurchase !== undefined) {
            updates.push('minPurchase = ?');
            params.push(minPurchase);
        }
        
        if (maxUses !== undefined) {
            if (maxUses && maxUses <= 0) {
                return res.status(400).json({ error: 'El máximo de usos debe ser mayor a 0' });
            }
            updates.push('maxUses = ?');
            params.push(maxUses);
        }
        
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        
        if (status !== undefined) {
            if (!['active', 'expired', 'paused'].includes(status)) {
                return res.status(400).json({ error: 'El estado debe ser "active", "expired" o "paused"' });
            }
            updates.push('status = ?');
            params.push(status);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }
        
        updates.push('updatedAt = datetime("now")');
        params.push(id);
        
        const sql = `UPDATE coupons SET ${updates.join(', ')} WHERE id = ?`;
        
        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Cupón no encontrado' });
            
            // Log activity
            logActivity(req.user.id, 'UPDATE', 'coupons', `Cupón actualizado: ${existing.code}`);
            
            res.json({ success: true, id: parseInt(id), ...req.body });
        });
    });
};

// Toggle coupon status
export const toggleCouponStatus = (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT status, code FROM coupons WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Cupón no encontrado' });
        
        const newStatus = row.status === 'active' ? 'expired' : 'active';
        db.run('UPDATE coupons SET status = ?, updatedAt = datetime("now") WHERE id = ?', [newStatus, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Log activity
            logActivity(req.user.id, 'TOGGLE_STATUS', 'coupons', `Cupón ${row.code} cambiado a ${newStatus}`);
            
            res.json({ success: true, status: newStatus });
        });
    });
};

// Export coupons to CSV
export const exportCoupons = (req, res) => {
    const { status, type } = req.query;
    
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
        
        // Convert to CSV
        const headers = ['ID', 'Código', 'Descuento', 'Tipo', 'Usos', 'Estado', 'Fecha Expiración', 'Compra Mín', 'Máx Usos', 'Descripción', 'Creado'];
        const csvRows = rows.map(row => [
            row.id,
            row.code,
            row.discount,
            row.type === 'percent' ? 'Porcentaje' : 'Fijo',
            row.uses,
            row.status === 'active' ? 'Activo' : row.status === 'expired' ? 'Expirado' : 'Pausado',
            row.expiresAt || 'Sin expiración',
            row.minPurchase || 0,
            row.maxUses || 'Ilimitado',
            row.description || '',
            row.createdAt
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
        
        const csv = [headers.join(','), ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=cupones_export.csv');
        res.send('\ufeff' + csv); // BOM for Excel UTF-8
    });
};

// Delete coupon
export const deleteCoupon = (req, res) => {
    const { id } = req.params;
    
    // Get coupon info before deletion for logging
    db.get('SELECT code FROM coupons WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Cupón no encontrado' });
        
        db.run('DELETE FROM coupons WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Cupón no encontrado' });
            
            // Log activity
            logActivity(req.user.id, 'DELETE', 'coupons', `Cupón eliminado: ${row.code}`);
            
            res.json({ success: true });
        });
    });
};

// Helper function to log activity
const logActivity = (userId, action, module, details) => {
    const timestamp = new Date().toISOString();
    const sql = `INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [userId, action, module, details, timestamp], (err) => {
        if (err) console.error('[ACTIVITY LOG] Error:', err.message);
    });
};