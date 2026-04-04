import { db } from './db.js';

// Get all returns with pagination, filtering, and search
export const getReturns = (req, res) => {
    const { 
        status, 
        customerId, 
        orderId,
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
    const validSortColumns = ['createdAt', 'status', 'refundAmount', 'product'];
    const validSortOrders = ['ASC', 'DESC'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = validSortOrders.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    let sql = `
        SELECT r.*,
               c.name as customerNameFull,
               c.email as customerEmail,
               c.phone as customerPhone,
               o.orderNumber,
               o.total as orderTotal
        FROM returns r
        LEFT JOIN customers c ON r.customerId = c.id
        LEFT JOIN orders o ON r.orderId = o.id
        WHERE 1=1
    `;
    
    let countSql = `
        SELECT COUNT(*) as total
        FROM returns r
        WHERE 1=1
    `;
    
    const params = [];
    const countParams = [];
    
    // Filter by status
    if (status) {
        sql += ' AND r.status = ?';
        countSql += ' AND r.status = ?';
        params.push(status);
        countParams.push(status);
    }
    
    // Filter by customer
    if (customerId) {
        sql += ' AND r.customerId = ?';
        countSql += ' AND r.customerId = ?';
        params.push(customerId);
        countParams.push(customerId);
    }
    
    // Filter by order
    if (orderId) {
        sql += ' AND r.orderId = ?';
        countSql += ' AND r.orderId = ?';
        params.push(orderId);
        countParams.push(orderId);
    }
    
    // Date range filter
    if (startDate) {
        sql += ' AND r.createdAt >= ?';
        countSql += ' AND r.createdAt >= ?';
        params.push(startDate);
        countParams.push(startDate);
    }
    if (endDate) {
        sql += ' AND r.createdAt <= ?';
        countSql += ' AND r.createdAt <= ?';
        params.push(endDate);
        countParams.push(endDate);
    }
    
    // Search filter
    if (search) {
        sql += ` AND (r.rmaCode LIKE ? OR r.product LIKE ? OR r.reason LIKE ? OR r.customerName LIKE ?)`;
        countSql += ` AND (r.rmaCode LIKE ? OR r.product LIKE ? OR r.reason LIKE ? OR r.customerName LIKE ?)`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam);
        countParams.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    // Get total count
    db.get(countSql, countParams, (err, countResult) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const totalItems = countResult?.total || 0;
        const totalPages = Math.ceil(totalItems / limitNum);
        
        sql += ` ORDER BY r.${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);

        db.all(sql, params, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
                returns: rows,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalItems,
                    itemsPerPage: limitNum,
                    hasNextPage: pageNum < totalPages,
                    hasPreviousPage: pageNum > 1
                }
            });
        });
    });
};

// Get return statistics for dashboard
export const getReturnStats = (req, res) => {
    const statsSql = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
            SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received,
            SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as refunded,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
            SUM(refundAmount) as totalRefunds
        FROM returns
    `;
    
    const monthlySql = `
        SELECT 
            strftime('%Y-%m', createdAt) as month,
            COUNT(*) as count,
            SUM(refundAmount) as refunds
        FROM returns
        WHERE createdAt >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', createdAt)
        ORDER BY month DESC
    `;
    
    const reasonSql = `
        SELECT 
            reason,
            COUNT(*) as count
        FROM returns
        GROUP BY reason
        ORDER BY count DESC
        LIMIT 10
    `;
    
    Promise.all([
        new Promise((resolve, reject) => {
            db.get(statsSql, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(monthlySql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(reasonSql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        })
    ]).then(([returnStats, monthlyTrend, topReasons]) => {
        res.json({
            returnStats,
            monthlyTrend,
            topReasons
        });
    }).catch(err => {
        res.status(500).json({ error: err.message });
    });
};

// Get single return with enhanced details
export const getReturn = (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT r.*,
               c.name as customerNameFull,
               c.email as customerEmail,
               c.phone as customerPhone,
               c.address as customerAddress,
               o.orderNumber,
               o.total as orderTotal,
               o.paymentMethod as orderPaymentMethod
        FROM returns r
        LEFT JOIN customers c ON r.customerId = c.id
        LEFT JOIN orders o ON r.orderId = o.id
        WHERE r.id = ?
    `;
    
    db.get(sql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Devolución no encontrada' });
        res.json(row);
    });
};

// Create return (RMA) with enhanced validation and workflow
export const createReturn = (req, res) => {
    const { 
        orderId, 
        customerId, 
        customerName, 
        product, 
        reason, 
        reasonCategory, // defective, wrong_item, damaged, not_as_described, changed_mind, other
        quantity = 1,
        refundAmount, 
        notes,
        condition // new, used, damaged
    } = req.body;
    
    // Validation
    if (!product || !reason) {
        return res.status(400).json({ error: 'Producto y razón son obligatorios' });
    }
    
    // Validate reason category
    const validCategories = ['defective', 'wrong_item', 'damaged', 'not_as_described', 'changed_mind', 'other'];
    if (reasonCategory && !validCategories.includes(reasonCategory)) {
        return res.status(400).json({ error: `Categoría inválida. Opciones: ${validCategories.join(', ')}` });
    }
    
    // Validate condition
    const validConditions = ['new', 'used', 'damaged'];
    if (condition && !validConditions.includes(condition)) {
        return res.status(400).json({ error: `Condición inválida. Opciones: ${validConditions.join(', ')}` });
    }
    
    // Validate quantity
    const quantityNum = Math.max(1, parseInt(quantity) || 1);

    // Generate RMA code with date prefix
    db.get('SELECT COUNT(*) as count FROM returns', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const rmaCode = `RMA-${datePrefix}-${String(row.count + 1).padStart(4, '0')}`;
        
        // Determine initial status based on refund amount
        let status = 'pending';
        if (refundAmount && refundAmount > 500000) { // Auto-approval threshold: 500k COP
            status = 'pending_review';
        }
        
        const sql = `INSERT INTO returns (
            rmaCode, orderId, customerId, customerName, product, reason, 
            reasonCategory, quantity, condition, status, refundAmount, notes, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`;
        
        const params = [
            rmaCode, 
            orderId || null, 
            customerId || null, 
            customerName || '', 
            product, 
            reason,
            reasonCategory || 'other',
            quantityNum,
            condition || 'used',
            status,
            refundAmount || 0,
            notes || ''
        ];

        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Log activity
            logActivity(req.user?.id, 'CREATE', 'returns', `Return created: ${rmaCode} - ${product}`);
            
            res.status(201).json({ 
                id: this.lastID, 
                rmaCode,
                orderId,
                customerId,
                customerName,
                product,
                reason,
                reasonCategory: reasonCategory || 'other',
                quantity: quantityNum,
                condition: condition || 'used',
                status,
                refundAmount: refundAmount || 0,
                notes,
                createdAt: new Date().toISOString(),
                message: 'Devolución creada exitosamente'
            });
        });
    });
};

// Update return with workflow validation
export const updateReturn = (req, res) => {
    const { id } = req.params;
    const { 
        status, 
        resolution, 
        resolutionCategory, // repaired, replaced, refunded, store_credit, denied
        refundAmount,
        returnTracking,
        notes
    } = req.body;
    
    // Check if return exists
    db.get('SELECT * FROM returns WHERE id = ?', [id], (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!existing) return res.status(404).json({ error: 'Devolución no encontrada' });
        
        // Validate status transition
        const validStatuses = ['pending', 'pending_review', 'approved', 'shipped', 'received', 'refunded', 'rejected'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Estado inválido. Opciones: ${validStatuses.join(', ')}` });
        }
        
        // Validate workflow transitions
        const workflow = {
            'pending': ['approved', 'rejected', 'pending_review'],
            'pending_review': ['approved', 'rejected'],
            'approved': ['shipped', 'received', 'refunded'],
            'shipped': ['received'],
            'received': ['refunded'],
            'refunded': [],
            'rejected': []
        };
        
        if (status && !workflow[existing.status]?.includes(status)) {
            return res.status(400).json({ 
                error: `Transición de estado no permitida. De '${existing.status}' a '${status}'` 
            });
        }
        
        // Validate resolution category
        const validResolutions = ['repaired', 'replaced', 'refunded', 'store_credit', 'denied'];
        if (resolutionCategory && !validResolutions.includes(resolutionCategory)) {
            return res.status(400).json({ error: `Categoría de resolución inválida. Opciones: ${validResolutions.join(', ')}` });
        }

        let updates = [];
        let params = [];
        
        if (status) { 
            updates.push('status = ?'); 
            params.push(status); 
        }
        if (resolution) { 
            updates.push('resolution = ?'); 
            params.push(resolution); 
        }
        if (resolutionCategory) { 
            updates.push('resolutionCategory = ?'); 
            params.push(resolutionCategory); 
        }
        if (refundAmount !== undefined) { 
            updates.push('refundAmount = ?'); 
            params.push(refundAmount); 
        }
        if (returnTracking) { 
            updates.push('returnTracking = ?'); 
            params.push(returnTracking); 
        }
        if (notes !== undefined) { 
            updates.push('notes = ?'); 
            params.push(notes); 
        }
        
        // Set resolvedAt if status is resolved or refunded
        if (status === 'received' || status === 'refunded' || status === 'rejected') {
            updates.push('resolvedAt = datetime(\'now\')');
        }
        
        updates.push('updatedAt = datetime(\'now\')');
        params.push(id);

        const sql = `UPDATE returns SET ${updates.join(', ')} WHERE id = ?`;

        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Devolución no encontrada' });
            
            logActivity(req.user?.id, 'UPDATE', 'returns', `Return ${existing.rmaCode} updated to ${status || existing.status}`);
            
            res.json({ 
                success: true, 
                id: parseInt(id),
                rmaCode: existing.rmaCode,
                status: status || existing.status,
                message: 'Devolución actualizada correctamente'
            });
        });
    });
};

// Update return status (legacy endpoint compatibility)
export const updateReturnStatus = (req, res) => {
    const { id } = req.params;
    const { status, resolution, refundAmount } = req.body;

    let sql = 'UPDATE returns SET status = ?';
    const params = [status];

    if (resolution) {
        sql += ', resolution = ?';
        params.push(resolution);
    }
    if (refundAmount !== undefined) {
        sql += ', refundAmount = ?';
        params.push(refundAmount);
    }
    if (status === 'resolved' || status === 'refunded') {
        sql += ', resolvedAt = datetime(\'now\')';
    }

    sql += ' WHERE id = ?';
    params.push(id);

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Devolución no encontrada' });
        res.json({ success: true, id: parseInt(id), status, resolution, refundAmount });
    });
};

// Delete return (with check for refund status)
export const deleteReturn = (req, res) => {
    const { id } = req.params;
    
    // Check if return exists and its status
    db.get('SELECT * FROM returns WHERE id = ?', [id], (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!existing) return res.status(404).json({ error: 'Devolución no encontrada' });
        
        // Prevent deleting if refund has been processed
        if (existing.status === 'refunded' && existing.refundAmount > 0) {
            return res.status(400).json({ 
                error: 'No se puede eliminar una devolución con reembolso procesado',
                refundAmount: existing.refundAmount
            });
        }
        
        db.run('DELETE FROM returns WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Devolución no encontrada' });
            
            logActivity(req.user?.id, 'DELETE', 'returns', `Return ${existing.rmaCode} deleted`);
            res.json({ success: true, message: 'Devolución eliminada correctamente' });
        });
    });
};

// Process refund
export const processRefund = (req, res) => {
    const { id } = req.params;
    const { refundAmount, refundMethod, refundNotes } = req.body;
    
    if (!refundAmount || isNaN(refundAmount) || parseFloat(refundAmount) <= 0) {
        return res.status(400).json({ error: 'Monto de reembolso debe ser un número positivo' });
    }
    
    // Validate refund method
    const validMethods = ['original', 'cash', 'store_credit', 'bank_transfer'];
    if (refundMethod && !validMethods.includes(refundMethod)) {
        return res.status(400).json({ error: `Método de reembolso inválido. Opciones: ${validMethods.join(', ')}` });
    }
    
    db.get('SELECT * FROM returns WHERE id = ?', [id], (err, returnItem) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!returnItem) return res.status(404).json({ error: 'Devolución no encontrada' });
        if (returnItem.status !== 'received') {
            return res.status(400).json({ error: 'La devolución debe estar recibida para procesar reembolso' });
        }
        if (returnItem.status === 'refunded') {
            return res.status(400).json({ error: 'Esta devolución ya fue reembolsada' });
        }
        
        const sql = `UPDATE returns SET 
                     status = 'refunded',
                     refundAmount = ?,
                     refundMethod = ?,
                     refundNotes = ?,
                     refundedAt = datetime('now'),
                     updatedAt = datetime('now')
                     WHERE id = ?`;
        
        const params = [parseFloat(refundAmount), refundMethod || 'original', refundNotes || '', id];
        
        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            logActivity(req.user?.id, 'REFUND', 'returns', `Refund processed for ${returnItem.rmaCode}: $${refundAmount}`);
            
            res.json({ 
                success: true, 
                rmaCode: returnItem.rmaCode,
                refundAmount: parseFloat(refundAmount),
                refundMethod: refundMethod || 'original',
                refundedAt: new Date().toISOString(),
                message: 'Reembolso procesado exitosamente'
            });
        });
    });
};

// Export returns to CSV
export const exportReturns = (req, res) => {
    const { status, startDate, endDate } = req.query;
    
    let sql = `
        SELECT r.*,
               c.name as customerNameFull,
               c.email as customerEmail,
               o.orderNumber
        FROM returns r
        LEFT JOIN customers c ON r.customerId = c.id
        LEFT JOIN orders o ON r.orderId = o.id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
        sql += ' AND r.status = ?';
        params.push(status);
    }
    if (startDate) {
        sql += ' AND r.createdAt >= ?';
        params.push(startDate);
    }
    if (endDate) {
        sql += ' AND r.createdAt <= ?';
        params.push(endDate);
    }
    
    sql += ' ORDER BY r.createdAt DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const { format = 'csv' } = req.query;
        if (format === 'json') {
            return res.json(rows);
        }

        // Convert to CSV
        const headers = ['RMA Code', 'Cliente', 'Email', 'Orden', 'Producto', 'Cantidad', 'Razón', 'Categoría', 'Estado', 'Monto Reembolso', 'Fecha Creación', 'Fecha Resolución'];
        const csvRows = rows.map(row => [
            row.rmaCode,
            `"${(row.customerNameFull || row.customerName || '').replace(/"/g, '""')}"`,
            `"${(row.customerEmail || '').replace(/"/g, '""')}"`,
            row.orderNumber || '',
            `"${(row.product || '').replace(/"/g, '""')}"`,
            row.quantity || 1,
            `"${(row.reason || '').replace(/"/g, '""')}"`,
            row.reasonCategory || '',
            row.status,
            row.refundAmount || 0,
            row.createdAt,
            row.resolvedAt || ''
        ]);
        
        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.join(','))
        ].join('\n');
        
        const filename = `returns_${new Date().toISOString().split('T')[0]}.csv`;
        
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