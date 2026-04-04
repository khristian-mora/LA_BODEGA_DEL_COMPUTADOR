import { db, logActivity } from './db.js';
import * as XLSX from 'xlsx';

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
        console.warn('[SUPPLIER] Phone validation failed:', phone);
        return res.status(400).json({ 
            error: 'Teléfono inválido', 
            details: 'Se esperan de 7 a 10 dígitos (el prefijo +57 es opcional). Ejemplo: 6012345678 o 3112345678' 
        });
    }
    
    let processedWebsite = website;
    if (website && !website.startsWith('http')) {
        processedWebsite = `https://${website}`;
    }
    
    if (processedWebsite && !isValidUrl(processedWebsite)) {
        console.warn('[SUPPLIER] URL validation failed:', processedWebsite);
        return res.status(400).json({ 
            error: 'URL inválida', 
            details: 'La dirección web no tiene un formato válido (ej: www.ejemplo.com)' 
        });
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
        processedWebsite || null,
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
        
        // Log activity safely
        const userId = req.user?.id || 0;
        logActivity({
            userId,
            action: 'CREATE',
            module: 'suppliers',
            entityType: 'supplier',
            entityId: this.lastID,
            newValue: { name: name.trim(), email, phone },
            req
        });
        
        res.status(201).json({ 
            id: this.lastID, 
            name: name.trim(), 
            contact, 
            email, 
            phone, 
            category, 
            notes,
            paymentTerms,
            address,
            website: processedWebsite,
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
        
        let processedWebsite = website;
        if (website && !website.startsWith('http')) {
            processedWebsite = `https://${website}`;
        }
        
        if (processedWebsite && !isValidUrl(processedWebsite)) {
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
        if (processedWebsite !== undefined) { updates.push('website = ?'); params.push(processedWebsite); }
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
            
            // Log activity safely
            const userId = req.user?.id || 0;
            logActivity({
                userId,
                action: 'UPDATE',
                module: 'suppliers',
                entityType: 'supplier',
                entityId: id,
                newValue: { name, email, phone, status },
                req
            });
            
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
        
        const { format = 'csv' } = req.query;
        if (format === 'json') {
            return res.json(rows);
        }

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

// Bulk import suppliers from Excel (Standard Mapping)
export const importSuppliers = (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

    try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) return res.status(400).json({ error: 'El archivo está vacío' });

        const columnMap = {
            'Nombre': 'name',
            'Name': 'name',
            'Proveedor': 'name',
            'Supplier': 'name',
            'Email': 'email',
            'Correo': 'email',
            'Mail': 'email',
            'Teléfono': 'phone',
            'Telefono': 'phone',
            'Celular': 'phone',
            'Phone': 'phone',
            'Contacto': 'contact',
            'Contact': 'contact',
            'Categoría': 'category',
            'Category': 'category',
            'NIT': 'taxId',
            'Tax ID': 'taxId',
            'Identificación': 'taxId',
            'Dirección': 'address',
            'Address': 'address',
            'Notas': 'notes',
            'Observaciones': 'notes',
            'Web': 'website',
            'Sitio Web': 'website'
        };

        let created = 0;
        let updated = 0;
        let errors = 0;

        const processRow = async (row) => {
            const mappedRow = {};
            Object.keys(row).forEach(key => {
                const targetKey = columnMap[key] || Object.keys(columnMap).find(k => key.toLowerCase().includes(k.toLowerCase()) && columnMap[k]);
                if (targetKey && columnMap[targetKey]) {
                    mappedRow[columnMap[targetKey]] = row[key];
                }
            });

            const { name, email, phone, contact, category, notes, taxId, website, address } = mappedRow;

            if (!name) {
                errors++;
                return;
            }

            return new Promise((resolve) => {
                // Upsert logic: Check by email or name
                const findSql = email 
                    ? 'SELECT id FROM suppliers WHERE email = ?' 
                    : 'SELECT id FROM suppliers WHERE name = ?';
                const findParam = email || name;

                db.get(findSql, [findParam], (err, existing) => {
                    if (existing) {
                        const updateSql = `UPDATE suppliers SET 
                                            contact = COALESCE(?, contact), 
                                            phone = COALESCE(?, phone), 
                                            category = COALESCE(?, category), 
                                            notes = COALESCE(?, notes),
                                            taxId = COALESCE(?, taxId),
                                            website = COALESCE(?, website),
                                            address = COALESCE(?, address),
                                            updatedAt = datetime('now')
                                          WHERE id = ?`;
                        db.run(updateSql, [contact, phone, category, notes, taxId, website, address, existing.id], (err) => {
                            if (!err) updated++;
                            resolve();
                        });
                    } else {
                        const insertSql = `INSERT INTO suppliers (name, contact, email, phone, category, notes, taxId, website, address, status, createdAt)
                                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`;
                        db.run(insertSql, [name, contact, email, phone, category, notes, taxId, website, address], (err) => {
                            if (!err) created++;
                            resolve();
                        });
                    }
                });
            });
        };

        const executeImports = async () => {
            for (const row of data) {
                await processRow(row);
            }
            logActivity(req.user.id, 'IMPORT', 'suppliers', `Importación: ${created} creados, ${updated} actualizados`);
            res.json({ success: true, created, updated, errors });
        };

        executeImports();
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar: ' + error.message });
    }
};

// Helper validation functions
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPhone = (phone) => {
    if (!phone) return true;
    const cleanPhone = phone.replace(/\s|-|\(|\)/g, '');
    // Allow Colombian landlines or mobiles (7 to 10 digits) with optional +57 prefix
    const phoneRegex = /^(?:\+57|57)?\d{7,10}$/;
    return phoneRegex.test(cleanPhone);
};

const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// logActivity is now imported from db.js