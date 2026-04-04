import { db, logActivity } from './db.js';
import * as XLSX from 'xlsx';

// Get all products
export const getProducts = (req, res) => {
    db.all('SELECT * FROM products ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(p => ({ 
            ...p, 
            featured: p.featured === 1, 
            specs: JSON.parse(p.specs || '{}') 
        })));
    });
};

// Add product
export const addProduct = (req, res) => {
    const { name, price, category, image, stock, minStock, supplierEmail, description, featured, specs, builderCategory, warrantyMonths } = req.body;
    
    const sql = `INSERT INTO products (name, price, category, image, stock, minStock, supplierEmail, description, featured, specs, builderCategory, warrantyMonths)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
        name, 
        price, 
        category, 
        image, 
        stock || 0, 
        minStock || 2, 
        supplierEmail, 
        description, 
        featured ? 1 : 0, 
        JSON.stringify(specs || {}),
        builderCategory || null,
        warrantyMonths || 12
    ];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Log activity
        logActivity({
            userId: req.user.id,
            action: 'CREATE',
            module: 'Inventory',
            entityType: 'product',
            entityId: this.lastID,
            newValue: req.body,
            req
        });
        
        res.status(201).json({ id: this.lastID, ...req.body });
    });
};

// Update product
export const updateProduct = (req, res) => {
    const { id } = req.params;
    const { name, price, category, image, stock, minStock, supplierEmail, description, featured, specs, builderCategory, warrantyMonths } = req.body;
    
    // Get old value for audit
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, oldVal) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!oldVal) return res.status(404).json({ error: 'Producto no encontrado' });

        const sql = `UPDATE products SET 
                        name = COALESCE(?, name),
                        price = COALESCE(?, price),
                        category = COALESCE(?, category),
                        image = COALESCE(?, image),
                        stock = COALESCE(?, stock),
                        minStock = COALESCE(?, minStock),
                        supplierEmail = COALESCE(?, supplierEmail),
                        description = COALESCE(?, description),
                        featured = COALESCE(?, featured),
                        specs = COALESCE(?, specs),
                        builderCategory = COALESCE(?, builderCategory),
                        warrantyMonths = COALESCE(?, warrantyMonths)
                    WHERE id = ?`;
        
        const params = [
            name, price, category, image, stock, minStock, supplierEmail, description, 
            featured !== undefined ? (featured ? 1 : 0) : null, 
            specs ? JSON.stringify(specs) : null,
            builderCategory,
            warrantyMonths,
            id
        ];

        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            logActivity({
                userId: req.user.id,
                action: 'UPDATE',
                module: 'Inventory',
                entityType: 'product',
                entityId: id,
                oldValue: oldVal,
                newValue: req.body,
                req
            });

            res.json({ success: true });
        });
    });
};

// Delete product
export const deleteProduct = (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, oldVal) => {
        if (err || !oldVal) return res.status(404).json({ error: 'Producto no encontrado' });

        db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            logActivity({
                userId: req.user.id,
                action: 'DELETE',
                module: 'Inventory',
                entityType: 'product',
                entityId: id,
                oldValue: oldVal,
                req
            });

            res.json({ success: true });
        });
    });
};

// Bulk import products from Excel (Standard Mapping)
export const importProducts = (req, res) => {
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
            'Producto': 'name',
            'Product': 'name',
            'Precio': 'price',
            'Price': 'price',
            'Costo': 'price',
            'Categoría': 'category',
            'Category': 'category',
            'Stock': 'stock',
            'Existencia': 'stock',
            'Cantidad': 'stock',
            'Minimo': 'minStock',
            'Mínimo': 'minStock',
            'Proveedor': 'supplierEmail',
            'Supplier': 'supplierEmail',
            'Descripción': 'description',
            'Description': 'description',
            'Specs': 'specs',
            'Especificaciones': 'specs',
            'SKU': 'sku',
            'Código': 'sku'
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

            const { name, price, category, stock, minStock, supplierEmail, description, specs, sku } = mappedRow;

            if (!name) {
                errors++;
                return;
            }

            // Parse specs if it's a string
            let parsedSpecs = {};
            if (typeof specs === 'string') {
                specs.split(',').forEach(part => {
                    const [k, v] = part.split(':');
                    if (k && v) parsedSpecs[k.trim()] = v.trim();
                });
            } else if (typeof specs === 'object') {
                parsedSpecs = specs;
            }

            return new Promise((resolve) => {
                // Upsert logic: Try by SKU first, then by Name
                const findSql = sku 
                    ? 'SELECT id FROM products WHERE sku = ?' 
                    : 'SELECT id FROM products WHERE name = ?';
                const findParam = sku || name;

                db.get(findSql, [findParam], (err, existing) => {
                    if (existing) {
                        const updateSql = `UPDATE products SET 
                                            price = COALESCE(?, price),
                                            category = COALESCE(?, category),
                                            stock = COALESCE(?, stock),
                                            minStock = COALESCE(?, minStock),
                                            supplierEmail = COALESCE(?, supplierEmail),
                                            description = COALESCE(?, description),
                                            specs = COALESCE(?, specs),
                                            updatedAt = datetime('now')
                                          WHERE id = ?`;
                        db.run(updateSql, [price, category, stock, minStock, supplierEmail, description, JSON.stringify(parsedSpecs), existing.id], (err) => {
                            if (!err) updated++;
                            resolve();
                        });
                    } else {
                        const insertSql = `INSERT INTO products (name, price, category, stock, minStock, supplierEmail, description, specs, sku, featured, createdAt)
                                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`;
                        db.run(insertSql, [name, price || 0, category || 'General', stock || 0, minStock || 2, supplierEmail, description, JSON.stringify(parsedSpecs), sku || null], (err) => {
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
            logActivity({ userId: req.user.id, action: 'IMPORT', module: 'Inventory', entityType: 'product', newValue: { created, updated, errors }, req });
            res.json({ success: true, created, updated, errors });
        };

        executeImports();
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar: ' + error.message });
    }
};

// Export products to CSV
export const exportProducts = (req, res) => {
    const sql = 'SELECT * FROM products ORDER BY category ASC, name ASC';
    
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const { format = 'csv' } = req.query;
        if (format === 'json') {
            return res.json(rows);
        }

        const headers = ['ID', 'Nombre', 'Precio', 'Categoría', 'Stock', 'Stock Mínimo', 'SKU', 'Proveedor', 'Descripción', 'Destacado', 'Creado'];
        const csvRows = rows.map(row => [
            row.id,
            row.name,
            row.price,
            row.category || '',
            row.stock || 0,
            row.minStock || 0,
            row.sku || '',
            row.supplierEmail || '',
            row.description || '',
            row.featured === 1 ? 'Sí' : 'No',
            row.createdAt || ''
        ].map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(','));
        
        const csvContent = headers.join(',') + '\n' + csvRows.join('\n');
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=inventario_export.csv');
        res.send('\ufeff' + csvContent);
    });
};
