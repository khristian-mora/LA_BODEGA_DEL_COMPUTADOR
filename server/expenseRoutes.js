import { db } from './db.js';


// Get all expenses with pagination and filtering
export const getExpenses = (req, res) => {
    const { startDate, endDate, category, status, paymentMethod, vendor, search, page = 1, limit = 20, sortBy = 'date', sortOrder = 'DESC' } = req.query;
    
    // Pagination validation
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    
    // Validate sort parameters
    const validSortColumns = ['date', 'amount', 'category', 'createdAt', 'status'];
    const validSortOrders = ['ASC', 'DESC'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'date';
    const safeSortOrder = validSortOrders.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM expenses WHERE 1=1';
    const params = [];
    const countParams = [];

    if (startDate) {
        sql += ' AND date >= ?';
        countSql += ' AND date >= ?';
        params.push(startDate);
        countParams.push(startDate);
    }
    if (endDate) {
        sql += ' AND date <= ?';
        countSql += ' AND date <= ?';
        params.push(endDate);
        countParams.push(endDate);
    }
    if (category) {
        sql += ' AND category = ?';
        countSql += ' AND category = ?';
        params.push(category);
        countParams.push(category);
    }
    if (status) {
        sql += ' AND status = ?';
        countSql += ' AND status = ?';
        params.push(status);
        countParams.push(status);
    }
    if (paymentMethod) {
        sql += ' AND paymentMethod = ?';
        countSql += ' AND paymentMethod = ?';
        params.push(paymentMethod);
        countParams.push(paymentMethod);
    }
    if (vendor) {
        sql += ' AND vendor LIKE ?';
        countSql += ' AND vendor LIKE ?';
        const vendorParam = `%${vendor}%`;
        params.push(vendorParam);
        countParams.push(vendorParam);
    }
    if (search) {
        sql += ' AND (description LIKE ? OR vendor LIKE ? OR notes LIKE ?)';
        countSql += ' AND (description LIKE ? OR vendor LIKE ? OR notes LIKE ?)';
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
        countParams.push(searchParam, searchParam, searchParam);
    }

    // Get total count first
    db.get(countSql, countParams, (err, countResult) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const totalItems = countResult?.total || 0;
        const totalPages = Math.ceil(totalItems / limitNum);
        
        // Add pagination to main query
        sql += ` ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);

        db.all(sql, params, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
                expenses: rows,
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

// Get expense summary with enhanced analytics
export const getExpenseSummary = (req, res) => {
    const { startDate, endDate, groupBy = 'category' } = req.query;
    
    // Validate groupBy parameter
    const validGroupBy = ['category', 'vendor', 'paymentMethod', 'MONTH', 'YEAR'];
    const safeGroupBy = validGroupBy.includes(groupBy) ? groupBy : 'category';
    
    let sql = `SELECT 
        ${safeGroupBy === 'MONTH' ? "strftime('%Y-%m', date) as period" : 
          safeGroupBy === 'YEAR' ? "strftime('%Y', date) as period" : 
          `${safeGroupBy} as category`},
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average,
        MIN(amount) as minAmount,
        MAX(amount) as maxAmount
        FROM expenses WHERE 1=1`;
    const params = [];

    if (startDate) {
        sql += ' AND date >= ?';
        params.push(startDate);
    }
    if (endDate) {
        sql += ' AND date <= ?';
        params.push(endDate);
    }

    sql += ` GROUP BY ${safeGroupBy === 'MONTH' ? "strftime('%Y-%m', date)" : 
                      safeGroupBy === 'YEAR' ? "strftime('%Y', date)" : 
                      safeGroupBy} ORDER BY total DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const totalExpenses = rows.reduce((sum, r) => sum + (r.total || 0), 0);
        const totalCount = rows.reduce((sum, r) => sum + (r.count || 0), 0);
        const avgPerEntry = totalCount > 0 ? totalExpenses / totalCount : 0;
        
        // Get pending expenses count
        db.get(`SELECT COUNT(*) as count FROM expenses WHERE status = 'pending'`, [], (err, pendingResult) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
                byCategory: rows,
                summary: {
                    totalExpenses,
                    totalCount,
                    averagePerEntry: Math.round(avgPerEntry),
                    pendingApprovals: pendingResult?.count || 0
                }
            });
        });
    });
};

// Get expense statistics for dashboard
export const getExpenseStats = (req, res) => {
    const { startDate, endDate } = req.query;
    
    let dateCondition = '';
    const params = [];
    
    if (startDate) {
        dateCondition += ' AND date >= ?';
        params.push(startDate);
    }
    if (endDate) {
        dateCondition += ' AND date <= ?';
        params.push(endDate);
    }
    
    // Get monthly comparison
    const monthlySql = `
        SELECT 
            strftime('%Y-%m', date) as month,
            SUM(amount) as total
        FROM expenses 
        WHERE 1=1 ${dateCondition}
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month DESC
        LIMIT 6
    `;
    
    // Get top vendors
    const vendorSql = `
        SELECT 
            vendor,
            COUNT(*) as count,
            SUM(amount) as total
        FROM expenses 
        WHERE 1=1 ${dateCondition} AND vendor IS NOT NULL AND vendor != ''
        GROUP BY vendor
        ORDER BY total DESC
        LIMIT 5
    `;
    
    // Get recent expenses
    const recentSql = `
        SELECT * FROM expenses 
        WHERE 1=1 ${dateCondition}
        ORDER BY createdAt DESC 
        LIMIT 5
    `;
    
    Promise.all([
        new Promise((resolve, reject) => {
            db.all(monthlySql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(vendorSql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(recentSql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        })
    ]).then(([monthlyTrend, topVendors, recentExpenses]) => {
        res.json({
            monthlyTrend,
            topVendors,
            recentExpenses
        });
    }).catch(err => {
        res.status(500).json({ error: err.message });
    });
};

// Get single expense
export const getExpense = (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM expenses WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Gasto no encontrado' });
        res.json(row);
    });
};

// Create expense with validation and approval workflow
export const createExpense = async (req, res) => {
    const { description, amount, category, vendor, date, paymentMethod, notes, receiptUrl, budgetCategory, requiresApproval } = req.body;
    
    // Manual validation (since middleware isn't applied in routes file)
    if (!description) return res.status(400).json({ error: 'Descripción es requerida' });
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Monto debe ser un número positivo' });
    
    // Validate dates
    const expenseDate = date || new Date().toISOString().split('T')[0];
    const parsedDate = new Date(expenseDate);
    if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Fecha inválida' });
    }
    
    // Check if expense exceeds budget
    let status = 'approved'; // Default status
    if (requiresApproval || amount > 1000000) { // Auto-approval threshold: 1M COP
        status = 'pending';
    }
    
    // Check budget if category specified
    if (budgetCategory || category) {
        const checkCategory = budgetCategory || category;
        const budgetSql = `
            SELECT budget, COALESCE(SUM(amount), 0) as spent
            FROM expense_budgets 
            WHERE category = ? AND month = strftime('%Y-%m', 'now')
        `;
        
        // This is optional - if expense_budgets table doesn't exist, skip budget check
        db.get(budgetSql, [checkCategory], (err, budgetRow) => {
            if (!err && budgetRow && budgetRow.budget) {
                const newTotal = budgetRow.spent + amount;
                if (newTotal > budgetRow.budget * 1.1) { // 10% over budget
                    status = 'over_budget';
                }
            }
            // Continue with expense creation
            createExpenseRecord();
        });
    } else {
        createExpenseRecord();
    }
    
    function createExpenseRecord() {
        const sql = `INSERT INTO expenses (
            description, amount, category, vendor, date, paymentMethod, 
            notes, receiptUrl, status, approvedBy, approvedAt, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`;
        
        const params = [
            description, 
            parseFloat(amount), 
            category || 'General', 
            vendor || '', 
            expenseDate,
            paymentMethod || 'Efectivo',
            notes || '',
            receiptUrl || null,
            status,
            status === 'approved' ? req.user?.id : null, // Auto-approve if no approval needed
            status === 'approved' ? new Date().toISOString() : null
        ];

        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            const expenseId = this.lastID;
            
            // Log activity
            logActivity(req.user?.id, 'CREATE', 'expenses', `Expense created: ${description} - $${amount}`);
            
            res.status(201).json({ 
                id: expenseId, 
                description,
                amount: parseFloat(amount),
                category: category || 'General',
                vendor,
                date: expenseDate,
                paymentMethod: paymentMethod || 'Efectivo',
                notes,
                receiptUrl,
                status,
                message: status === 'pending' ? 'Gasto creado - Requiere aprobación' : 'Gasto creado y aprobado'
            });
        });
    }
};

// Update expense with validation
export const updateExpense = (req, res) => {
    const { id } = req.params;
    const { description, amount, category, vendor, date, paymentMethod, notes, receiptUrl, status } = req.body;

    // Check if expense exists
    db.get('SELECT * FROM expenses WHERE id = ?', [id], (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!existing) return res.status(404).json({ error: 'Gasto no encontrado' });
        
        // Validate required fields
        if (!description || description.trim() === '') {
            return res.status(400).json({ error: 'Descripción es requerida' });
        }
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Monto debe ser un número positivo' });
        }
        
        // Validate status transition
        const validStatuses = ['pending', 'approved', 'rejected', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Estado inválido. Opciones: ${validStatuses.join(', ')}` });
        }
        
        // If changing to approved, record approval
        let approvedBy = existing.approvedBy;
        let approvedAt = existing.approvedAt;
        if (status === 'approved' && existing.status !== 'approved') {
            approvedBy = req.user?.id;
            approvedAt = new Date().toISOString();
        }

        const sql = `UPDATE expenses SET 
                     description = ?, amount = ?, category = ?, vendor = ?,
                     date = ?, paymentMethod = ?, notes = ?, receiptUrl = ?,
                     status = ?, approvedBy = ?, approvedAt = ?
                     WHERE id = ?`;
        
        const params = [
            description.trim(), 
            parseFloat(amount), 
            category || existing.category, 
            vendor || existing.vendor, 
            date || existing.date, 
            paymentMethod || existing.paymentMethod, 
            notes || existing.notes,
            receiptUrl || existing.receiptUrl,
            status || existing.status,
            approvedBy,
            approvedAt,
            id
        ];

        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Gasto no encontrado' });
            
            // Log activity
            logActivity(req.user?.id, 'UPDATE', 'expenses', `Expense updated: ${description} - $${amount}`);
            
            res.json({ 
                id: parseInt(id), 
                ...req.body,
                message: 'Gasto actualizado correctamente'
            });
        });
    });
};

// Delete expense with soft delete option
export const deleteExpense = (req, res) => {
    const { id } = req.params;
    const { permanent = false } = req.query;
    
    // Check if expense exists
    db.get('SELECT * FROM expenses WHERE id = ?', [id], (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!existing) return res.status(404).json({ error: 'Gasto no encontrado' });
        
        if (permanent === 'true') {
            // Permanent delete (admin only)
            db.run('DELETE FROM expenses WHERE id = ?', [id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                
                logActivity(req.user?.id, 'DELETE', 'expenses', `Expense permanently deleted: ${existing.description}`);
                res.json({ success: true, message: 'Gasto eliminado permanentemente' });
            });
        } else {
            // Soft delete - change status to cancelled
            db.run("UPDATE expenses SET status = 'cancelled' WHERE id = ?", [id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                if (this.changes === 0) return res.status(404).json({ error: 'Gasto no encontrado' });
                
                logActivity(req.user?.id, 'CANCEL', 'expenses', `Expense cancelled: ${existing.description}`);
                res.json({ success: true, message: 'Gasto cancelado correctamente' });
            });
        }
    });
};

// Approve expense
export const approveExpense = (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    
    db.get('SELECT * FROM expenses WHERE id = ?', [id], (err, expense) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!expense) return res.status(404).json({ error: 'Gasto no encontrado' });
        if (expense.status === 'approved') return res.status(400).json({ error: 'El gasto ya está aprobado' });
        if (expense.status === 'rejected') return res.status(400).json({ error: 'No se puede aprobar un gasto rechazado' });
        
        const sql = `UPDATE expenses SET 
                     status = 'approved', 
                     approvedBy = ?, 
                     approvedAt = ?,
                     approvalNotes = ?
                     WHERE id = ?`;
        
        const params = [req.user?.id, new Date().toISOString(), notes || '', id];
        
        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            logActivity(req.user?.id, 'APPROVE', 'expenses', `Expense approved: ${expense.description}`);
            res.json({ success: true, message: 'Gasto aprobado correctamente' });
        });
    });
};

// Reject expense
export const rejectExpense = (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
        return res.status(400).json({ error: 'La razón del rechazo es requerida' });
    }
    
    db.get('SELECT * FROM expenses WHERE id = ?', [id], (err, expense) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!expense) return res.status(404).json({ error: 'Gasto no encontrado' });
        if (expense.status !== 'pending') return res.status(400).json({ error: 'Solo se pueden rechazar gastos pendientes' });
        
        const sql = `UPDATE expenses SET 
                     status = 'rejected', 
                     rejectedBy = ?, 
                     rejectedAt = ?,
                     rejectionReason = ?
                     WHERE id = ?`;
        
        const params = [req.user?.id, new Date().toISOString(), reason.trim(), id];
        
        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            logActivity(req.user?.id, 'REJECT', 'expenses', `Expense rejected: ${expense.description}. Reason: ${reason}`);
            res.json({ success: true, message: 'Gasto rechazado correctamente' });
        });
    });
};

// Get expenses by category for budget analysis
export const getExpensesByCategory = (req, res) => {
    const { month, year } = req.query;
    
    let dateCondition = '';
    const params = [];
    
    if (month && year) {
        dateCondition = "AND strftime('%Y-%m', date) = ?";
        params.push(`${year}-${month.padStart(2, '0')}`);
    } else if (year) {
        dateCondition = "AND strftime('%Y', date) = ?";
        params.push(year);
    } else {
        // Default to current month
        dateCondition = "AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')";
    }
    
    const sql = `
        SELECT 
            category,
            COUNT(*) as count,
            SUM(amount) as total,
            AVG(amount) as average
        FROM expenses 
        WHERE status != 'cancelled' ${dateCondition}
        GROUP BY category 
        ORDER BY total DESC
    `;
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const grandTotal = rows.reduce((sum, r) => sum + (r.total || 0), 0);
        
        res.json({
            categories: rows.map(row => ({
                ...row,
                percentage: grandTotal > 0 ? Math.round((row.total / grandTotal) * 100) : 0
            })),
            grandTotal
        });
    });
};

// Export expenses to CSV
export const exportExpenses = (req, res) => {
    const { startDate, endDate, category, status } = req.query;
    
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];

    if (startDate) {
        sql += ' AND date >= ?';
        params.push(startDate);
    }
    if (endDate) {
        sql += ' AND date <= ?';
        params.push(endDate);
    }
    if (category) {
        sql += ' AND category = ?';
        params.push(category);
    }
    if (status) {
        sql += ' AND status = ?';
        params.push(status);
    }

    sql += ' ORDER BY date DESC';

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const { format = 'csv' } = req.query;
        if (format === 'json') {
            return res.json(rows);
        }

        // Convert to CSV
        const headers = ['ID', 'Descripción', 'Monto', 'Categoría', 'Proveedor', 'Fecha', 'Método de Pago', 'Estado', 'Notas'];
        const csvRows = rows.map(row => [
            row.id,
            `"${(row.description || '').replace(/"/g, '""')}"`,
            row.amount,
            `"${(row.category || '').replace(/"/g, '""')}"`,
            `"${(row.vendor || '').replace(/"/g, '""')}"`,
            row.date,
            `"${(row.paymentMethod || '').replace(/"/g, '""')}"`,
            row.status || 'approved',
            `"${(row.notes || '').replace(/"/g, '""')}"`
        ]);
        
        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.join(','))
        ].join('\n');
        
        const filename = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
        
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