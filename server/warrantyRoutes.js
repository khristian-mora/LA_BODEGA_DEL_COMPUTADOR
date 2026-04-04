// Warranty Management Endpoints with Enhanced Features
import { db } from './db.js';

// Get all warranties with pagination, filtering, and expiration alerts
export const getWarranties = (req, res) => {
    const { 
        status, 
        customerId, 
        expiringWithin, // days
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
    const validSortColumns = ['createdAt', 'startDate', 'endDate', 'status'];
    const validSortOrders = ['ASC', 'DESC'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = validSortOrders.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    let sql = `
        SELECT w.*, 
               c.name as customerName,
               c.email as customerEmail,
               c.phone as customerPhone,
               t.deviceType, t.brand, t.model,
               CASE 
                   WHEN w.endDate < date('now') THEN 'expired'
                   WHEN w.endDate <= date('now', '+30 days') THEN 'expiring_soon'
                   ELSE 'active'
               END as expirationStatus,
               julianday(w.endDate) - julianday('now') as daysRemaining
        FROM warranties w
        LEFT JOIN customers c ON w.customerId = c.id
        LEFT JOIN tickets t ON w.ticketId = t.id
        WHERE 1=1
    `;
    
    let countSql = `
        SELECT COUNT(*) as total
        FROM warranties w
        WHERE 1=1
    `;
    
    const params = [];
    const countParams = [];

    // Filter by status
    if (status) {
        sql += ' AND w.status = ?';
        countSql += ' AND w.status = ?';
        params.push(status);
        countParams.push(status);
    }
    
    // Filter by customer
    if (customerId) {
        sql += ' AND w.customerId = ?';
        countSql += ' AND w.customerId = ?';
        params.push(customerId);
        countParams.push(customerId);
    }
    
    // Filter by expiring within X days
    if (expiringWithin) {
        const days = parseInt(expiringWithin) || 30;
        sql += ` AND w.endDate <= date('now', '+${days} days') AND w.endDate >= date('now')`;
        countSql += ` AND w.endDate <= date('now', '+${days} days') AND w.endDate >= date('now')`;
    }
    
    // Search filter
    if (search) {
        sql += ` AND (c.name LIKE ? OR c.email LIKE ? OR t.deviceType LIKE ? OR t.brand LIKE ? OR t.model LIKE ?)`;
        countSql += ` AND (c.name LIKE ? OR c.email LIKE ? OR t.deviceType LIKE ? OR t.brand LIKE ? OR t.model LIKE ?)`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
        countParams.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    // Get total count
    db.get(countSql, countParams, (err, countResult) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const totalItems = countResult?.total || 0;
        const totalPages = Math.ceil(totalItems / limitNum);
        
        // Add sorting and pagination
        sql += ` ORDER BY w.${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);

        db.all(sql, params, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Count expiring soon
            db.get(`SELECT COUNT(*) as count FROM warranties 
                    WHERE endDate <= date('now', '+30 days') 
                    AND endDate >= date('now') 
                    AND status = 'Active'`, [], (err, expiringResult) => {
                if (err) return res.status(500).json({ error: err.message });
                
                res.json({
                    warranties: rows,
                    pagination: {
                        currentPage: pageNum,
                        totalPages,
                        totalItems,
                        itemsPerPage: limitNum,
                        hasNextPage: pageNum < totalPages,
                        hasPreviousPage: pageNum > 1
                    },
                    alerts: {
                        expiringSoon: expiringResult?.count || 0
                    }
                });
            });
        });
    });
};

// Get warranty statistics for dashboard
export const getWarrantyStats = (req, res) => {
    const statsSql = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'Expired' THEN 1 ELSE 0 END) as expired,
            SUM(CASE WHEN status = 'Claimed' THEN 1 ELSE 0 END) as claimed,
            SUM(CASE WHEN endDate <= date('now', '+30 days') AND endDate >= date('now') AND status = 'Active' THEN 1 ELSE 0 END) as expiringSoon
        FROM warranties
    `;
    
    const claimsSql = `
        SELECT 
            COUNT(*) as totalClaims,
            SUM(CASE WHEN resolution IS NOT NULL THEN 1 ELSE 0 END) as resolvedClaims
        FROM warranty_claims
    `;
    
    const monthlySql = `
        SELECT 
            strftime('%Y-%m', createdAt) as month,
            COUNT(*) as count
        FROM warranties
        WHERE createdAt >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', createdAt)
        ORDER BY month DESC
    `;
    
    Promise.all([
        new Promise((resolve, reject) => {
            db.get(statsSql, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        }),
        new Promise((resolve, reject) => {
            db.get(claimsSql, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(monthlySql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        })
    ]).then(([warrantyStats, claimsStats, monthlyTrend]) => {
        res.json({
            warrantyStats,
            claimsStats,
            monthlyTrend
        });
    }).catch(err => {
        res.status(500).json({ error: err.message });
    });
};

// Get expiring warranties (for alerts)
export const getExpiringWarranties = (req, res) => {
    const { days = 30 } = req.query;
    const daysInt = Math.max(1, parseInt(days) || 30);
    
    const sql = `
        SELECT w.*, 
               c.name as customerName,
               c.email as customerEmail,
               c.phone as customerPhone,
               t.deviceType, t.brand, t.model,
               julianday(w.endDate) - julianday('now') as daysRemaining
        FROM warranties w
        LEFT JOIN customers c ON w.customerId = c.id
        LEFT JOIN tickets t ON w.ticketId = t.id
        WHERE w.endDate <= date('now', '+${daysInt} days') 
          AND w.endDate >= date('now')
          AND w.status = 'Active'
        ORDER BY w.endDate ASC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Group by urgency
        const urgent = rows.filter(r => r.daysRemaining <= 7);
        const soon = rows.filter(r => r.daysRemaining > 7 && r.daysRemaining <= 30);
        
        res.json({
            expiring: rows,
            urgent,
            soon,
            total: rows.length
        });
    });
};

// Get single warranty with claims and history
export const getWarranty = (req, res) => {
    const sql = `
        SELECT w.*, 
               c.name as customerName, c.email as customerEmail, c.phone as customerPhone, c.address as customerAddress,
               t.deviceType, t.brand, t.model, t.serial, t.issueDescription,
               CASE 
                   WHEN w.endDate < date('now') THEN 'expired'
                   WHEN w.endDate <= date('now', '+30 days') THEN 'expiring_soon'
                   ELSE 'active'
               END as expirationStatus,
               julianday(w.endDate) - julianday('now') as daysRemaining
        FROM warranties w
        LEFT JOIN customers c ON w.customerId = c.id
        LEFT JOIN tickets t ON w.ticketId = t.id
        WHERE w.id = ?
    `;

    db.get(sql, [req.params.id], (err, warranty) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!warranty) return res.status(404).json({ error: 'Garantía no encontrada' });

        // Get claims for this warranty with better details
        const claimsSql = `
            SELECT wc.*,
                   t.deviceType, t.brand, t.model,
                   c.name as customerName
            FROM warranty_claims wc
            LEFT JOIN warranties w ON wc.warrantyId = w.id
            LEFT JOIN tickets t ON wc.ticketId = t.id
            LEFT JOIN customers c ON w.customerId = c.id
            WHERE wc.warrantyId = ?
            ORDER BY wc.claimDate DESC
        `;
        
        db.all(claimsSql, [req.params.id], (err, claims) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Get claim statistics
            db.get(`
                SELECT 
                    COUNT(*) as totalClaims,
                    SUM(CASE WHEN resolution IS NOT NULL THEN 1 ELSE 0 END) as resolvedClaims,
                    SUM(CASE WHEN resolution IS NULL THEN 1 ELSE 0 END) as pendingClaims
                FROM warranty_claims 
                WHERE warrantyId = ?
            `, [req.params.id], (err, claimStats) => {
                if (err) return res.status(500).json({ error: err.message });
                
                warranty.claims = claims;
                warranty.claimStats = claimStats || { totalClaims: 0, resolvedClaims: 0, pendingClaims: 0 };
                res.json(warranty);
            });
        });
    });
};

// Create warranty with enhanced validation and automatic period calculation
export const createWarranty = (req, res) => {
    const { 
        ticketId, 
        customerId, 
        productId, 
        startDate, 
        endDate, 
        warrantyPeriod, // in months
        terms, 
        supplierId,
        warrantyType, // 'standard', 'extended', 'replacement'
        notes 
    } = req.body;

    // Validation
    if (!customerId) {
        return res.status(400).json({ error: 'Cliente es requerido' });
    }
    
    if (!startDate) {
        return res.status(400).json({ error: 'Fecha de inicio es requerida' });
    }
    
    // Calculate end date if warrantyPeriod is provided
    let finalEndDate = endDate;
    if (!finalEndDate && warrantyPeriod) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
            return res.status(400).json({ error: 'Fecha de inicio inválida' });
        }
        start.setMonth(start.getMonth() + parseInt(warrantyPeriod));
        finalEndDate = start.toISOString().split('T')[0];
    }
    
    if (!finalEndDate) {
        return res.status(400).json({ error: 'Fecha de fin o período de garantía es requerido' });
    }
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(finalEndDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Fechas inválidas' });
    }
    if (end <= start) {
        return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
    }

    const sql = `INSERT INTO warranties (
        ticketId, orderId, productId, customerId, startDate, endDate, 
        terms, status, warrantyType, supplierId, notes, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const now = new Date().toISOString();

    db.run(sql, [
        ticketId || null, 
        null, // orderId - not used in this system
        productId || null, 
        customerId, 
        startDate, 
        finalEndDate, 
        terms || '', 
        'Active',
        warrantyType || 'standard',
        supplierId || null,
        notes || '',
        now
    ], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        
        // Log activity
        logActivity(req.user?.id, 'CREATE', 'warranties', `Warranty created for customer ${customerId}`);
        
        res.status(201).json({ 
            id: this.lastID, 
            customerId, 
            startDate,
            endDate: finalEndDate,
            status: 'Active',
            warrantyType: warrantyType || 'standard',
            message: 'Garantía creada exitosamente'
        });
    });
};

// Update warranty with status validation
export const updateWarranty = (req, res) => {
    const { id } = req.params;
    const { 
        ticketId, productId, customerId, startDate, endDate, 
        terms, status, warrantyType, supplierId, notes 
    } = req.body;

    // Check if warranty exists
    db.get('SELECT * FROM warranties WHERE id = ?', [id], (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!existing) return res.status(404).json({ error: 'Garantía no encontrada' });
        
        // Validate status transition
        const validStatuses = ['Active', 'Expired', 'Claimed', 'Cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Estado inválido. Opciones: ${validStatuses.join(', ')}` });
        }
        
        // Prevent updating expired warranty to active
        if (status === 'Active' && existing.status === 'Expired') {
            return res.status(400).json({ error: 'No se puede reactivar una garantía expirada' });
        }

        let updates = [];
        let params = [];

        if (ticketId !== undefined) { updates.push('ticketId = ?'); params.push(ticketId); }
        if (productId !== undefined) { updates.push('productId = ?'); params.push(productId); }
        if (customerId) { updates.push('customerId = ?'); params.push(customerId); }
        if (startDate) { updates.push('startDate = ?'); params.push(startDate); }
        if (endDate) { updates.push('endDate = ?'); params.push(endDate); }
        if (terms !== undefined) { updates.push('terms = ?'); params.push(terms); }
        if (status) { updates.push('status = ?'); params.push(status); }
        if (warrantyType) { updates.push('warrantyType = ?'); params.push(warrantyType); }
        if (supplierId !== undefined) { updates.push('supplierId = ?'); params.push(supplierId); }
        if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
        
        updates.push('updatedAt = ?');
        params.push(new Date().toISOString());

        params.push(id);

        const sql = `UPDATE warranties SET ${updates.join(', ')} WHERE id = ?`;

        db.run(sql, params, function (err) {
            if (err) return res.status(400).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Garantía no encontrada' });
            
            logActivity(req.user?.id, 'UPDATE', 'warranties', `Warranty ${id} updated`);
            res.json({ success: true, message: 'Garantía actualizada exitosamente' });
        });
    });
};

// Delete warranty (with check for active claims)
export const deleteWarranty = (req, res) => {
    const { id } = req.params;
    
    // Check for active claims
    db.get('SELECT COUNT(*) as count FROM warranty_claims WHERE warrantyId = ? AND resolution IS NULL', [id], (err, claimResult) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (claimResult && claimResult.count > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar una garantía con reclamos activos',
                activeClaims: claimResult.count
            });
        }
        
        // Delete warranty claims first
        db.run('DELETE FROM warranty_claims WHERE warrantyId = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Delete warranty
            db.run('DELETE FROM warranties WHERE id = ?', [id], function (err) {
                if (err) return res.status(400).json({ error: err.message });
                if (this.changes === 0) return res.status(404).json({ error: 'Garantía no encontrada' });
                
                logActivity(req.user?.id, 'DELETE', 'warranties', `Warranty ${id} deleted`);
                res.json({ success: true, message: 'Garantía eliminada exitosamente' });
            });
        });
    });
};

// Create warranty claim with enhanced tracking
export const createClaim = (req, res) => {
    const { warrantyId, ticketId, description, priority = 'medium' } = req.body;

    if (!warrantyId || !description) {
        return res.status(400).json({ error: 'ID de garantía y descripción son requeridos' });
    }
    
    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: `Prioridad inválida. Opciones: ${validPriorities.join(', ')}` });
    }

    // Check if warranty exists and is active
    db.get('SELECT * FROM warranties WHERE id = ?', [warrantyId], (err, warranty) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!warranty) return res.status(404).json({ error: 'Garantía no encontrada' });
        if (warranty.status !== 'Active') {
            return res.status(400).json({ error: 'La garantía no está activa' });
        }
        
        // Check if warranty is expired
        const today = new Date();
        const endDate = new Date(warranty.endDate);
        if (today > endDate) {
            return res.status(400).json({ error: 'La garantía ha expirado' });
        }

        const sql = 'INSERT INTO warranty_claims (warrantyId, ticketId, claimDate, description, priority, status) VALUES (?, ?, ?, ?, ?, ?)';
        const now = new Date().toISOString();

        db.run(sql, [warrantyId, ticketId || null, now, description, priority, 'pending'], function (err) {
            if (err) return res.status(400).json({ error: err.message });
            
            // Update warranty status to 'Claimed' if it has active claims
            db.run("UPDATE warranties SET status = 'Claimed' WHERE id = ? AND status = 'Active'", [warrantyId], (err) => {
                if (err) console.error('Error updating warranty status:', err.message);
            });
            
            logActivity(req.user?.id, 'CREATE', 'warranties', `Claim created for warranty ${warrantyId}`);
            
            res.status(201).json({ 
                id: this.lastID, 
                warrantyId, 
                claimDate: now,
                priority,
                status: 'pending',
                message: 'Reclamo creado exitosamente'
            });
        });
    });
};

// Update warranty claim
export const updateClaim = (req, res) => {
    const { id } = req.params;
    const { description, priority, status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'in_review', 'approved', 'rejected', 'resolved'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Estado inválido. Opciones: ${validStatuses.join(', ')}` });
    }
    
    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (priority && !validPriorities.includes(priority)) {
        return res.status(400).json({ error: `Prioridad inválida. Opciones: ${validPriorities.join(', ')}` });
    }
    
    let updates = [];
    let params = [];
    
    if (description) { updates.push('description = ?'); params.push(description); }
    if (priority) { updates.push('priority = ?'); params.push(priority); }
    if (status) { updates.push('status = ?'); params.push(status); }
    
    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(id);
    
    const sql = `UPDATE warranty_claims SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(sql, params, function (err) {
        if (err) return res.status(400).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Reclamo no encontrado' });
        
        logActivity(req.user?.id, 'UPDATE', 'warranties', `Claim ${id} updated`);
        res.json({ success: true, message: 'Reclamo actualizado exitosamente' });
    });
};

// Resolve warranty claim with enhanced tracking
export const resolveClaim = (req, res) => {
    const { id } = req.params;
    const { resolution, resolutionType, cost, replacedParts, notes } = req.body;
    
    if (!resolution) {
        return res.status(400).json({ error: 'Resolución es requerida' });
    }
    
    // Validate resolution type
    const validResolutionTypes = ['repaired', 'replaced', 'refunded', 'denied', 'other'];
    if (resolutionType && !validResolutionTypes.includes(resolutionType)) {
        return res.status(400).json({ error: `Tipo de resolución inválido. Opciones: ${validResolutionTypes.join(', ')}` });
    }
    
    db.get('SELECT * FROM warranty_claims WHERE id = ?', [id], (err, claim) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!claim) return res.status(404).json({ error: 'Reclamo no encontrado' });
        if (claim.resolution) return res.status(400).json({ error: 'El reclamo ya está resuelto' });
        
        const now = new Date().toISOString();
        
        const sql = `UPDATE warranty_claims SET 
                     resolution = ?, 
                     resolutionType = ?,
                     cost = ?,
                     replacedParts = ?,
                     resolutionNotes = ?,
                     resolvedDate = ?,
                     status = 'resolved'
                     WHERE id = ?`;
        
        const params = [
            resolution, 
            resolutionType || 'repaired',
            cost || null,
            replacedParts || null,
            notes || '',
            now,
            id
        ];
        
        db.run(sql, params, function (err) {
            if (err) return res.status(400).json({ error: err.message });
            
            // Check if warranty has more pending claims
            db.get(`SELECT COUNT(*) as count FROM warranty_claims 
                    WHERE warrantyId = ? AND resolution IS NULL`, [claim.warrantyId], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                
                // If no more pending claims, update warranty status back to Active
                if (result && result.count === 0) {
                    db.run(`UPDATE warranties SET status = 'Active' WHERE id = ?`, [claim.warrantyId], (err) => {
                        if (err) console.error('Error updating warranty status:', err.message);
                    });
                }
                
                logActivity(req.user?.id, 'RESOLVE', 'warranties', `Claim ${id} resolved: ${resolution}`);
                
                res.json({ 
                    success: true, 
                    resolvedDate: now,
                    message: 'Reclamo resuelto exitosamente'
                });
            });
        });
    });
};

// Get warranty claims by status
export const getClaimsByStatus = (req, res) => {
    const { status, priority, page = 1, limit = 20 } = req.query;
    
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    
    let sql = `
        SELECT wc.*,
               w.startDate, w.endDate, w.status as warrantyStatus,
               c.name as customerName, c.email as customerEmail,
               t.deviceType, t.brand, t.model,
               CASE 
                   WHEN wc.resolution IS NULL THEN 'pending'
                   ELSE 'resolved'
               END as claimStatus
        FROM warranty_claims wc
        LEFT JOIN warranties w ON wc.warrantyId = w.id
        LEFT JOIN customers c ON w.customerId = c.id
        LEFT JOIN tickets t ON wc.ticketId = t.id
        WHERE 1=1
    `;
    
    let countSql = `
        SELECT COUNT(*) as total
        FROM warranty_claims wc
        WHERE 1=1
    `;
    
    const params = [];
    const countParams = [];
    
    if (status) {
        if (status === 'pending') {
            sql += ' AND wc.resolution IS NULL';
            countSql += ' AND wc.resolution IS NULL';
        } else if (status === 'resolved') {
            sql += ' AND wc.resolution IS NOT NULL';
            countSql += ' AND wc.resolution IS NOT NULL';
        }
    }
    
    if (priority) {
        sql += ' AND wc.priority = ?';
        countSql += ' AND wc.priority = ?';
        params.push(priority);
        countParams.push(priority);
    }
    
    // Get total count
    db.get(countSql, countParams, (err, countResult) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const totalItems = countResult?.total || 0;
        const totalPages = Math.ceil(totalItems / limitNum);
        
        sql += ' ORDER BY wc.claimDate DESC LIMIT ? OFFSET ?';
        params.push(limitNum, offset);
        
        db.all(sql, params, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
                claims: rows,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalItems,
                    itemsPerPage: limitNum
                }
            });
        });
    });
};

// Export warranties to CSV
export const exportWarranties = (req, res) => {
    const { status, expiringWithin } = req.query;
    
    let sql = `
        SELECT w.*,
               c.name as customerName,
               c.email as customerEmail,
               c.phone as customerPhone,
               t.deviceType, t.brand, t.model, t.serial
        FROM warranties w
        LEFT JOIN customers c ON w.customerId = c.id
        LEFT JOIN tickets t ON w.ticketId = t.id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
        sql += ' AND w.status = ?';
        params.push(status);
    }
    
    if (expiringWithin) {
        const days = parseInt(expiringWithin) || 30;
        sql += ` AND w.endDate <= date('now', '+${days} days') AND w.endDate >= date('now')`;
    }
    
    sql += ' ORDER BY w.createdAt DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const { format = 'csv' } = req.query;
        if (format === 'json') {
            return res.json(rows);
        }

        // Convert to CSV
        const headers = ['ID', 'Cliente', 'Email', 'Teléfono', 'Dispositivo', 'Marca', 'Modelo', 'Serial', 'Fecha Inicio', 'Fecha Fin', 'Estado', 'Tipo', 'Términos'];
        const csvRows = rows.map(row => [
            row.id,
            `"${(row.customerName || '').replace(/"/g, '""')}"`,
            `"${(row.customerEmail || '').replace(/"/g, '""')}"`,
            `"${(row.customerPhone || '').replace(/"/g, '""')}"`,
            `"${(row.deviceType || '').replace(/"/g, '""')}"`,
            `"${(row.brand || '').replace(/"/g, '""')}"`,
            `"${(row.model || '').replace(/"/g, '""')}"`,
            `"${(row.serial || '').replace(/"/g, '""')}"`,
            row.startDate,
            row.endDate,
            row.status,
            row.warrantyType || 'standard',
            `"${(row.terms || '').replace(/"/g, '""')}"`
        ]);
        
        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.join(','))
        ].join('\n');
        
        const filename = `warranties_${new Date().toISOString().split('T')[0]}.csv`;
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send('\ufeff' + csvContent); // BOM for Excel UTF-8 compatibility
    });
};

// Helper function to log activity
const logActivity = (userId, action, module, details) => {
    if (!userId) return;
    
    const sql = `INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)`;
    const params = [userId, action, module, details, new Date().toISOString()];
    
    db.run(sql, params, (err) => {
        if (err) console.error('[ACTIVITY] Error logging activity:', err.message);
    });
};