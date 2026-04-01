import { db } from './db.js';

// Get all suppliers with pagination, filtering, and search
export const getSuppliers = (req, res) => {
    const { 
        status, 
        category,
        search,
        page = 1, 
        limit = 20, 
        sortBy = 'name', 
        sortOrder = 'ASC' 
    } = req.query;
    
    // Pagination validation
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    
    // Validate sort parameters
    const validSortColumns = ['name', 'category', 'createdAt', 'status'];
    const validSortOrders = ['ASC', 'DESC'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'name';
    const safeSortOrder = validSortOrders.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
    
    let sql = `
        SELECT s.*,
               COUNT(DISTINCT p.id) as productCount,
               COUNT(DISTINCT exp.id) as expenseCount,
               SUM(exp.amount) as totalExpenses
        FROM suppliers s
        LEFT JOIN products p ON s.email = p.supplierEmail
        LEFT JOIN expenses exp ON s.name = exp.vendor
        WHERE 1=1
    `;
    
    let countSql = `
        SELECT COUNT(*) as total
        FROM suppliers
        WHERE 1=1
    `;
    
    const params = [];
    const countParams = [];
    
    // Filter by status
    if (status) {
        sql += ' AND s.status = ?';
        countSql += ' AND status = ?';
        params.push(status);
        countParams.push(status);
    }
    
    // Filter by category
    if (category) {
        sql += ' AND s.category = ?';
        countSql += ' AND category = ?';
        params.push(category);
        countParams.push(category);
    }
    
    // Search filter
    if (search) {
        sql += ` AND (s.name LIKE ? OR s.contact LIKE ? OR s.email LIKE ? OR s.phone LIKE ? OR s.category LIKE ?)`;
        countSql += ` AND (name LIKE ? OR contact LIKE ? OR email LIKE ? OR phone LIKE ? OR category LIKE ?)`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
        countParams.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }
    
    // Add GROUP BY for the joins
    sql += ' GROUP BY s.id';
    
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
                suppliers: rows,
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

// Get supplier statistics for dashboard
export const getSupplierStats = (req, res) => {
    // Total suppliers and status distribution
    const totalSql = `
        SELECT 
            COUNT(*) as totalSuppliers,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeSuppliers,
            SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactiveSuppliers
        FROM suppliers
    `;
    
    // Suppliers by category distribution
    const categorySql = `
        SELECT category, COUNT(*) as count
        FROM suppliers
        WHERE category IS NOT NULL AND category != ''
        GROUP BY category
        ORDER BY count DESC
    `;
    
    // Top suppliers by product count
    const topByProductsSql = `
        SELECT s.id, s.name, s.category, s.status,
               COUNT(p.id) as productCount
        FROM suppliers s
        LEFT JOIN products p ON s.email = p.supplierEmail
        WHERE s.status = 'active'
        GROUP BY s.id
        ORDER BY productCount DESC
        LIMIT 10
    `;
    
    // Top suppliers by expense amount
    const topByExpensesSql = `
        SELECT s.id, s.name, s.category, s.status,
               SUM(e.amount) as totalExpenses,
               COUNT(e.id) as expenseCount
        FROM suppliers s
        LEFT JOIN expenses e ON s.name = e.vendor
        WHERE s.status = 'active'
        GROUP BY s.id
        HAVING totalExpenses > 0
        ORDER BY totalExpenses DESC
        LIMIT 10
    `;
    
    // Suppliers created by month trend
    const monthlyTrendSql = `
        SELECT 
            strftime('%Y-%m', createdAt) as month,
            COUNT(*) as suppliersCreated
        FROM suppliers
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
            db.all(categorySql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(topByProductsSql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }),
        new Promise((resolve, reject) => {
            db.all(topByExpensesSql, [], (err, rows) => {
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
    ]).then(([summary, categoryDistribution, topByProducts, topByExpenses, monthlyTrend]) => {
        res.json({
            summary: summary || {
                totalSuppliers: 0,
                activeSuppliers: 0,
                inactiveSuppliers: 0
            },
            categoryDistribution,
            topByProducts,
            topByExpenses,
            monthlyTrend
        });
    }).catch(err => {
        res.status(500).json({ error: err.message });
    });
};

// Get single supplier
export const getSupplier = (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT s.*,
               COUNT(DISTINCT p.id) as productCount,
               COUNT(DISTINCT exp.id) as expenseCount,
               SUM(exp.amount) as totalExpenses
        FROM suppliers s
        LEFT JOIN products p ON s.email = p.supplierEmail
        LEFT JOIN expenses exp ON s.name = exp.vendor
        WHERE s.id = ?
        GROUP BY s.id
    `;
    
    db.get(sql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json(row);
    });
};

// Create supplier with enhanced validation
export const createSupplier = (req, res) => {
    const { name, contact, email, phone, category, notes, website, taxId, paymentTerms, address } = req.body;
    
    // Enhanced validation
    if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'El nombre es obligatorio (mínimo 2 caracteres)' });
    }
    
    if (email && !isValidEmail(email)) {
        return res.status(400).json({ error: 'Email inválido' });
    }
    
    if (phone && !isValidPhone(phone)) {
        return res.status(400).json({ error: 'Teléfono inválido (formato colombiano: +573XXXXXXXXX)' });
    }
    
    if (website && !isValidUrl(website)) {
        return res.status(400).json({ error: 'URL del sitio web inválida' });
    }

    const sql = `INSERT INTO suppliers (name, contact, email, phone, category, notes, website, taxId, paymentTerms, address, status, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`;
    const params = [
        name.trim(), 
        contact || '', 
        email || '', 
        phone || '', 
        category || '', 
        notes || '',
        website || null,
        taxId || null,
        paymentTerms || null,
        address || null
    ];

    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Ya existe un proveedor con ese email' });
            }
            return res.status(500).json({ error: err.message });
        }
        
        // Log activity
        logActivity(req.user.id, 'CREATE', 'suppliers', `Proveedor creado: ${name.trim()}`);
        
        res.status(201).json({ 
            id: this.lastID, 
            name: name.trim(), 
            contact, 
            email, 
            phone, 
            category, 
            notes,
            website,
            taxId,
            paymentTerms,
            address,
            status: 'active'
        });
    });
};

// Update supplier with enhanced validation
export const updateSupplier = (req, res) => {
    const { id } = req.params;
    const { name, contact, email, phone, category, notes, status, website, taxId, paymentTerms, address } = req.body;
    
    // Check if supplier exists
    db.get('SELECT * FROM suppliers WHERE id = ?', [id], (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!existing) return res.status(404).json({ error: 'Proveedor no encontrado' });
        
        // Validation
        if (name && name.trim().length < 2) {
            return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
        }
        
        if (email && !isValidEmail(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }
        
        if (phone && !isValidPhone(phone)) {
            return res.status(400).json({ error: 'Teléfono inválido' });
        }
        
        if (website && !isValidUrl(website)) {
            return res.status(400).json({ error: 'URL del sitio web inválida' });
        }
        
        if (status && !['active', 'inactive'].includes(status)) {
            return res.status(400).json({ error: 'El estado debe ser "active" o "inactive"' });
        }
        
        // Build dynamic update
        let updates = [];
        let params = [];
        
        if (name !== undefined) { updates.push('name = ?'); params.push(name.trim()); }
        if (contact !== undefined) { updates.push('contact = ?'); params.push(contact); }
        if (email !== undefined) { updates.push('email = ?'); params.push(email); }
        if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
        if (category !== undefined) { updates.push('category = ?'); params.push(category); }
        if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
        if (status !== undefined) { updates.push('status = ?'); params.push(status); }
        if (website !== undefined) { updates.push('website = ?'); params.push(website); }
        if (taxId !== undefined) { updates.push('taxId = ?'); params.push(taxId); }
        if (paymentTerms !== undefined) { updates.push('paymentTerms = ?'); params.push(paymentTerms); }
        if (address !== undefined) { updates.push('address = ?'); params.push(address); }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }
        
        updates.push('updatedAt = datetime("now")');
        params.push(id);
        
        const sql = `UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?`;
        
        db.run(sql, params, function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Ya existe un proveedor con ese email' });
                }
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
            
            // Log activity
            logActivity(req.user.id, 'UPDATE', 'suppliers', `Proveedor actualizado: ${name || existing.name}`);
            
            res.json({ success: true, id: parseInt(id), ...req.body });
        });
    });
};

// Export suppliers to CSV
export const exportSuppliers = (req, res) => {
    const { status, category } = req.query;
    
    let sql = 'SELECT * FROM suppliers WHERE 1=1';
    const params = [];
    
    if (status) {
        sql += ' AND status = ?';
        params.push(status);
    }
    
    if (category) {
        sql += ' AND category = ?';
        params.push(category);
    }
    
    sql += ' ORDER BY name ASC';
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Convert to CSV
        const headers = ['ID', 'Nombre', 'Contacto', 'Email', 'Teléfono', 'Categoría', 'Sitio Web', 'NIT', 'Condiciones Pago', 'Dirección', 'Notas', 'Estado', 'Creado'];
        const csvRows = rows.map(row => [
            row.id,
            row.name,
            row.contact || '',
            row.email || '',
            row.phone || '',
            row.category || '',
            row.website || '',
            row.taxId || '',
            row.paymentTerms || '',
            row.address || '',
            row.notes || '',
            row.status === 'active' ? 'Activo' : 'Inactivo',
            row.createdAt
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
        
        const csv = [headers.join(','), ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=proveedores_export.csv');
        res.send('\ufeff' + csv); // BOM for Excel UTF-8
    });
};

// Delete supplier
export const deleteSupplier = (req, res) => {
    const { id } = req.params;
    
    // Get supplier info before deletion for logging
    db.get('SELECT name FROM suppliers WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Proveedor no encontrado' });
        
        // Check if supplier has products
        db.get('SELECT COUNT(*) as count FROM products WHERE supplierEmail = (SELECT email FROM suppliers WHERE id = ?)', [id], (err, productCount) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (productCount.count > 0) {
                return res.status(400).json({ 
                    error: 'No se puede eliminar el proveedor porque tiene productos asociados',
                    productCount: productCount.count
                });
            }
            
            db.run('DELETE FROM suppliers WHERE id = ?', [id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                if (this.changes === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
                
                // Log activity
                logActivity(req.user.id, 'DELETE', 'suppliers', `Proveedor eliminado: ${row.name}`);
                
                res.json({ success: true });
            });
        });
    });
};

// Helper validation functions
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPhone = (phone) => {
    if (!phone) return true;
    const phoneRegex = /^(\+57|57)?[3][0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
};

const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Helper function to log activity
const logActivity = (userId, action, module, details) => {
    const timestamp = new Date().toISOString();
    const sql = `INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [userId, action, module, details, timestamp], (err) => {
        if (err) console.error('[ACTIVITY LOG] Error:', err.message);
    });
};