import { db } from './db.js';
import { validators } from './validationUtils.js';
import * as XLSX from 'xlsx';

// Get all customers with stats
export const getCustomers = (req, res) => {
    const { type, status, sortBy = 'createdAt', order = 'DESC', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
        SELECT c.*, 
               COUNT(DISTINCT t.id) as totalTickets,
               SUM(t.estimatedCost) as totalSpent,
               MAX(t.createdAt) as lastVisit
        FROM customers c
        LEFT JOIN tickets t ON c.phone = t.clientPhone OR c.name = t.clientName
        WHERE 1=1
    `;
    const params = [];
    
    // Filtros
    if (type) {
        sql += ' AND c.customerType = ?';
        params.push(type);
    }
    
    if (status) {
        sql += ' AND c.status = ?';
        params.push(status);
    }
    
    sql += ' GROUP BY c.id';
    
    // Ordenamiento
    const validSortFields = ['createdAt', 'name', 'totalSpent', 'lastVisit'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    if (sortField === 'totalSpent') {
        sql += ` ORDER BY totalSpent ${sortOrder}`;
    } else if (sortField === 'lastVisit') {
        sql += ` ORDER BY lastVisit ${sortOrder} NULLS LAST`;
    } else {
        sql += ` ORDER BY c.${sortField} ${sortOrder}`;
    }
    
    // Paginación
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Contar total para paginación
        db.get('SELECT COUNT(*) as total FROM customers', [], (countErr, countRow) => {
            if (countErr) {
                res.status(500).json({ error: countErr.message });
                return;
            }
            
            res.json({
                customers: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countRow.total,
                    totalPages: Math.ceil(countRow.total / limit)
                }
            });
        });
    });
};

// Get single customer with comprehensive history
export const getCustomer = (req, res) => {
    const customerId = req.params.id;
    
    // Validar ID
    if (!customerId || isNaN(customerId)) {
        return res.status(400).json({ error: 'ID de cliente inválido' });
    }
    
    const sql = `
        SELECT c.*,
               COUNT(DISTINCT t.id) as totalTickets,
               SUM(t.estimatedCost) as totalSpent,
               AVG(t.estimatedCost) as avgTicketValue,
               MIN(t.createdAt) as firstVisit,
               MAX(t.createdAt) as lastVisit
        FROM customers c
        LEFT JOIN tickets t ON c.phone = t.clientPhone OR c.name = t.clientName
        WHERE c.id = ?
        GROUP BY c.id
    `;
    
    db.get(sql, [customerId], (err, customer) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!customer) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }

        // Obtener tickets del cliente con más detalles
        const ticketSql = `
            SELECT id, deviceType, brand, model, issueDescription, status, 
                   estimatedCost, createdAt, updatedAt
            FROM tickets 
            WHERE clientPhone = ? OR clientName = ?
            ORDER BY createdAt DESC
            LIMIT 50
        `;
        
        db.all(ticketSql, [customer.phone, customer.name], (err, tickets) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Obtener productos comprados (si hay tabla de orders)
            const orderSql = `
                SELECT o.id, o.orderNumber, o.total, o.status, o.createdAt,
                       (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
                           'productId', oi.productId,
                           'name', p.name,
                           'quantity', oi.quantity,
                           'price', oi.price
                       ))
                       FROM order_items oi
                       JOIN products p ON oi.productId = p.id
                       WHERE oi.orderId = o.id) as items
                FROM orders o
                WHERE o.customerEmail = ? OR o.customerPhone = ?
                ORDER BY o.createdAt DESC
                LIMIT 20
            `;
            
            db.all(orderSql, [customer.email, customer.phone], (err, orders) => {
                if (err) {
                    // Si no hay tabla de orders, devolver sin órdenes
                    return res.json({
                        ...customer,
                        tickets: tickets || [],
                        orders: [],
                        stats: {
                            totalTickets: customer.totalTickets,
                            totalSpent: customer.totalSpent,
                            avgTicketValue: customer.avgTicketValue,
                            firstVisit: customer.firstVisit,
                            lastVisit: customer.lastVisit
                        }
                    });
                }
                
                // Parsear items de órdenes
                const parsedOrders = (orders || []).map(o => ({
                    ...o,
                    items: JSON.parse(o.items || '[]')
                }));
                
                res.json({
                    ...customer,
                    tickets: tickets || [],
                    orders: parsedOrders,
                    stats: {
                        totalTickets: customer.totalTickets,
                        totalSpent: customer.totalSpent,
                        avgTicketValue: customer.avgTicketValue,
                        firstVisit: customer.firstVisit,
                        lastVisit: customer.lastVisit
                    }
                });
            });
        });
    });
};

// Create customer with validation and audit
export const createCustomer = async (req, res) => {
    const { name, email, phone, address, idNumber, clientType, customerType, notes, birthday } = req.body;

    // Validación básica manual
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (name.length < 2) {
        return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
    }

    if (email && !validators.isValidEmail(email)) {
        return res.status(400).json({ error: 'Email inválido' });
    }

    if (phone && !validators.isValidPhone(phone)) {
        return res.status(400).json({ error: 'Teléfono inválido (formato: +573XXXXXXXXX)' });
    }

    // Validar email único
    if (email) {
        const emailCheck = await validators.isEmailUnique(email);
        if (!emailCheck.valid) {
            return res.status(400).json({ error: emailCheck.message });
        }
    }

    // Validar teléfono único
    if (phone) {
        const phoneCheck = await validators.isPhoneUnique(phone);
        if (!phoneCheck.valid) {
            return res.status(400).json({ error: phoneCheck.message });
        }
    }

    // Validar tipo de cliente (persona o empresa)
    const validClientTypes = ['Persona', 'Empresa'];
    if (clientType && !validClientTypes.includes(clientType)) {
        return res.status(400).json({ error: `Tipo de cliente debe ser: ${validClientTypes.join(', ')}` });
    }

    // Validar tipo de categoría
    const validTypes = ['Regular', 'VIP', 'Mayorista', 'Nuevo'];
    if (customerType && !validTypes.includes(customerType)) {
        return res.status(400).json({ error: `Categoría debe ser: ${validTypes.join(', ')}` });
    }

    const sql = 'INSERT INTO customers (name, email, phone, address, idNumber, clientType, customerType, notes, status, birthday, totalSpent, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const now = new Date().toISOString();

    db.run(sql, [
        name.trim(), 
        email ? email.trim().toLowerCase() : null, 
        phone ? phone.trim() : null, 
        address ? address.trim() : null, 
        idNumber ? idNumber.trim() : null, 
        clientType || 'Persona',
        customerType || 'Regular', 
        notes ? notes.trim() : null,
        'active',
        birthday || null,
        0,
        now, 
        now
    ], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint')) {
                return res.status(400).json({ error: 'El email o teléfono ya existe' });
            }
            return res.status(400).json({ error: err.message });
        }
        
        // Registrar en auditoría
        db.run(
            'INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)',
            [req.user?.id || 0, 'CREATE', 'CUSTOMERS', `Cliente creado: ${name}`, now]
        );
        
        res.status(201).json({ 
            id: this.lastID, 
            name: name.trim(), 
            email: email ? email.trim().toLowerCase() : null, 
            phone: phone ? phone.trim() : null,
            clientType: clientType || 'Persona',
            customerType: customerType || 'Regular',
            status: 'active',
            birthday: birthday || null,
            createdAt: now
        });
    });
};

// Update customer with validation and audit
export const updateCustomer = async (req, res) => {
    const customerId = req.params.id;
    const { name, email, phone, address, idNumber, clientType, customerType, notes, status, birthday, totalSpent, lastPurchaseDate } = req.body;

    // Validar ID
    if (!customerId || isNaN(customerId)) {
        return res.status(400).json({ error: 'ID de cliente inválido' });
    }

    // Verificar que existe
    const exists = await validators.existsInTable('customers', customerId, 'Cliente');
    if (!exists.valid) {
        return res.status(404).json({ error: exists.message });
    }

    // Validaciones
    if (name !== undefined) {
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'El nombre no puede estar vacío' });
        }
        if (name.length < 2) {
            return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
        }
    }

    if (email !== undefined && email) {
        if (!validators.isValidEmail(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }
        // Validar email único (excluyendo este cliente)
        const emailCheck = await validators.isEmailUnique(email, customerId);
        if (!emailCheck.valid) {
            return res.status(400).json({ error: emailCheck.message });
        }
    }

    if (phone !== undefined && phone) {
        if (!validators.isValidPhone(phone)) {
            return res.status(400).json({ error: 'Teléfono inválido' });
        }
        // Validar teléfono único (excluyendo este cliente)
        const phoneCheck = await validators.isPhoneUnique(phone, customerId);
        if (!phoneCheck.valid) {
            return res.status(400).json({ error: phoneCheck.message });
        }
    }

    if (clientType !== undefined) {
        const validClientTypes = ['Persona', 'Empresa'];
        if (!validClientTypes.includes(clientType)) {
            return res.status(400).json({ error: `Tipo de cliente debe ser: ${validClientTypes.join(', ')}` });
        }
    }

    if (customerType !== undefined) {
        const validTypes = ['Regular', 'VIP', 'Mayorista', 'Nuevo'];
        if (!validTypes.includes(customerType)) {
            return res.status(400).json({ error: `Categoría debe ser: ${validTypes.join(', ')}` });
        }
    }

    if (status !== undefined) {
        const validStatuses = ['active', 'inactive', 'blocked'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Estado debe ser: ${validStatuses.join(', ')}` });
        }
    }

    // Construir query dinámico
    let updates = [];
    let params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name.trim()); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email ? email.trim().toLowerCase() : null); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone ? phone.trim() : null); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address ? address.trim() : null); }
    if (idNumber !== undefined) { updates.push('idNumber = ?'); params.push(idNumber ? idNumber.trim() : null); }
    if (clientType !== undefined) { updates.push('clientType = ?'); params.push(clientType); }
    if (customerType !== undefined) { updates.push('customerType = ?'); params.push(customerType); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes ? notes.trim() : null); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (birthday !== undefined) { updates.push('birthday = ?'); params.push(birthday || null); }
    if (totalSpent !== undefined) { updates.push('totalSpent = ?'); params.push(totalSpent); }
    if (lastPurchaseDate !== undefined) { updates.push('lastPurchaseDate = ?'); params.push(lastPurchaseDate || null); }

    updates.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(customerId);

    if (updates.length === 1) { // Solo updatedAt
        return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    const sql = `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`;

    db.run(sql, params, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint')) {
                return res.status(400).json({ error: 'El email o teléfono ya existe' });
            }
            return res.status(400).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        // Registrar en auditoría
        const now = new Date().toISOString();
        db.run(
            'INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)',
            [req.user?.id || 0, 'UPDATE', 'CUSTOMERS', `Cliente actualizado ID: ${customerId}`, now]
        );

        res.json({ 
            success: true, 
            id: parseInt(customerId),
            changes: this.changes
        });
    });
};

// Delete customer (soft delete - set status to inactive)
export const deleteCustomer = (req, res) => {
    const customerId = req.params.id;
    
    // Validar ID
    if (!customerId || isNaN(customerId)) {
        return res.status(400).json({ error: 'ID de cliente inválido' });
    }
    
    // Soft delete: cambiar estado a inactive en lugar de eliminar
    db.run('UPDATE customers SET status = ?, updatedAt = ? WHERE id = ?', 
        ['inactive', new Date().toISOString(), customerId], 
        function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }

            // Registrar en auditoría
            const now = new Date().toISOString();
            db.run(
                'INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)',
                [req.user?.id || 0, 'DELETE', 'CUSTOMERS', `Cliente desactivado ID: ${customerId}`, now]
            );

            res.json({ 
                success: true, 
                message: 'Cliente desactivado correctamente',
                id: parseInt(customerId)
            });
        }
    );
};

// Advanced search customers with filters
export const searchCustomers = (req, res) => {
    const { q, type, status, minSpent, maxSpent, sortBy = 'relevance', limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
        return res.status(400).json({ error: 'La búsqueda debe tener al menos 2 caracteres' });
    }
    
    const searchTerm = `%${q.trim()}%`;
    
    let sql = `
        SELECT c.*,
               COUNT(DISTINCT t.id) as totalTickets,
               SUM(t.estimatedCost) as totalSpent,
               MAX(t.createdAt) as lastVisit,
               CASE 
                   WHEN c.name LIKE ? THEN 3
                   WHEN c.email LIKE ? THEN 2
                   WHEN c.phone LIKE ? THEN 2
                   WHEN c.idNumber LIKE ? THEN 1
                   ELSE 0
               END as relevanceScore
        FROM customers c
        LEFT JOIN tickets t ON c.phone = t.clientPhone OR c.name = t.clientName
        WHERE (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.idNumber LIKE ? OR c.address LIKE ?)
    `;
    
    const params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
    
    // Filtros adicionales
    if (type) {
        sql += ' AND c.customerType = ?';
        params.push(type);
    }
    
    if (status) {
        sql += ' AND c.status = ?';
        params.push(status);
    }
    
    sql += ' GROUP BY c.id';
    
    // Filtro por monto gastado
    if (minSpent) {
        sql += ' HAVING totalSpent >= ?';
        params.push(parseFloat(minSpent));
    }
    
    if (maxSpent) {
        sql += sql.includes('HAVING') ? ' AND totalSpent <= ?' : ' HAVING totalSpent <= ?';
        params.push(parseFloat(maxSpent));
    }
    
    // Ordenamiento
    switch (sortBy) {
        case 'name':
            sql += ' ORDER BY c.name ASC';
            break;
        case 'lastVisit':
            sql += ' ORDER BY lastVisit DESC NULLS LAST';
            break;
        case 'totalSpent':
            sql += ' ORDER BY totalSpent DESC';
            break;
        case 'relevance':
        default:
            sql += ' ORDER BY relevanceScore DESC, c.name ASC';
            break;
    }
    
    sql += ' LIMIT ?';
    params.push(parseInt(limit));
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Formatear respuesta
        const customers = rows.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            address: c.address,
            idNumber: c.idNumber,
            customerType: c.customerType,
            notes: c.notes,
            status: c.status,
            totalTickets: c.totalTickets,
            totalSpent: c.totalSpent,
            lastVisit: c.lastVisit,
            relevanceScore: c.relevanceScore
        }));
        
        res.json({
            query: q.trim(),
            count: customers.length,
            customers
        });
    });
};

// Get customer statistics (for admin dashboard)
export const getCustomerStats = (req, res) => {
    const sql = `
        SELECT 
            customerType,
            COUNT(*) as count,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeCount,
            AVG(CASE WHEN t.estimatedCost IS NOT NULL THEN t.estimatedCost END) as avgSpent
        FROM customers c
        LEFT JOIN tickets t ON c.phone = t.clientPhone OR c.name = t.clientName
        GROUP BY customerType
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Estadísticas generales
        db.get(`
            SELECT 
                COUNT(*) as totalCustomers,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeCustomers,
                SUM(CASE WHEN createdAt >= date('now', '-30 days') THEN 1 ELSE 0 END) as newLastMonth
            FROM customers
        `, [], (err, general) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            res.json({
                byType: rows,
                general: general
            });
        });
    });
};

// Import customers from Excel
export const importCustomers = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ error: 'El archivo Excel está vacío' });
        }

        let createdCount = 0;
        let updatedCount = 0;
        let errorCount = 0;
        const errors = [];

        // Map column names to DB fields
        const columnMap = {
            'Nombre': 'name',
            'Nombre Completo': 'name',
            'Name': 'name',
            'Email': 'email',
            'Correo': 'email',
            'Teléfono': 'phone',
            'Telefono': 'phone',
            'Celular': 'phone',
            'Phone': 'phone',
            'Dirección': 'address',
            'Direccion': 'address',
            'Address': 'address',
            'Cédula': 'idNumber',
            'Cedula': 'idNumber',
            'NIT': 'idNumber',
            'ID': 'idNumber',
            'Tipo': 'customerType',
            'Tipo de Cliente': 'customerType',
            'Notas': 'notes',
            'Observaciones': 'notes'
        };

        const now = new Date().toISOString();

        for (const [index, row] of data.entries()) {
            try {
                // Normalize row keys
                const customer = {};
                Object.keys(row).forEach(key => {
                    const normalizedKey = columnMap[key] || key.toLowerCase();
                    if (['name', 'email', 'phone', 'address', 'idNumber', 'customerType', 'notes'].includes(normalizedKey)) {
                        customer[normalizedKey] = row[key]?.toString().trim() || null;
                    }
                });

                if (!customer.name) {
                    errorCount++;
                    errors.push(`Fila ${index + 2}: El nombre es obligatorio.`);
                    continue;
                }

                // Search for existing customer
                const existing = await new Promise((resolve) => {
                    let sqlParts = [];
                    let params = [];
                    
                    // User requested identifying by cedula/nit primarily
                    if (customer.idNumber) { 
                        sqlParts.push('idNumber = ?'); 
                        params.push(customer.idNumber); 
                    }
                    
                    // Fallback to email or phone if idNumber not provided or not found?
                    // Actually, let's stick to idNumber as main, but allow email/phone as secondaries
                    if (customer.email) { 
                        sqlParts.push('email = ?'); 
                        params.push(customer.email.toLowerCase()); 
                    }
                    if (customer.phone) { 
                        sqlParts.push('phone = ?'); 
                        params.push(customer.phone); 
                    }
                    
                    if (params.length === 0) return resolve(null);
                    
                    const sql = `SELECT id FROM customers WHERE ${sqlParts.join(' OR ')} LIMIT 1`;
                    db.get(sql, params, (err, row) => resolve(row));
                });

                if (existing) {
                    // Update
                    const updates = [];
                    const params = [];
                    Object.keys(customer).forEach(key => {
                        if (customer[key] !== null) {
                            updates.push(`${key} = ?`);
                            params.push(key === 'email' ? customer[key].toLowerCase() : customer[key]);
                        }
                    });
                    params.push(now, existing.id);

                    await new Promise((resolve, reject) => {
                        db.run(`UPDATE customers SET ${updates.join(', ')}, updatedAt = ? WHERE id = ?`, params, function(err) {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    updatedCount++;
                } else {
                    // Create
                    const fields = ['name', 'email', 'phone', 'address', 'idNumber', 'customerType', 'notes', 'status', 'createdAt', 'updatedAt'];
                    const values = [
                        customer.name,
                        customer.email ? customer.email.toLowerCase() : null,
                        customer.phone,
                        customer.address,
                        customer.idNumber,
                        customer.customerType || 'Regular',
                        customer.notes,
                        'active',
                        now,
                        now
                    ];
                    const placeholders = fields.map(() => '?').join(', ');

                    await new Promise((resolve, reject) => {
                        db.run(`INSERT INTO customers (${fields.join(', ')}) VALUES (${placeholders})`, values, function(err) {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                    createdCount++;
                }
            } catch (err) {
                errorCount++;
                errors.push(`Fila ${index + 2}: ${err.message}`);
            }
        }

        // Log the activity
        db.run(
            'INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)',
            [req.user?.id || 0, 'IMPORT', 'CUSTOMERS', `Importación Excel: ${createdCount} creados, ${updatedCount} actualizados`, now]
        );

        res.json({
            success: true,
            created: createdCount,
            updated: updatedCount,
            errors: errorCount,
            details: errors
        });

    } catch (error) {
        res.status(500).json({ error: 'Error al procesar el archivo Excel: ' + error.message });
    }
};

// Get customers with birthdays in current month
export const getBirthdayCustomers = (req, res) => {
    const now = new Date();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    
    const sql = `
        SELECT id, name, email, phone, birthday, customerType, totalSpent 
        FROM customers 
        WHERE birthday IS NOT NULL 
        AND birthday != ''
        AND CAST(strftime('%m', birthday) AS INTEGER) = ?
        ORDER BY CAST(strftime('%d', birthday) AS INTEGER)
    `;
    
    db.all(sql, [currentMonth], (err, rows) => {
        if (err) {
            console.error('[Customers] Birthday Query Error:', err.message);
            return res.status(500).json({ error: 'Error al consultar cumpleaños: ' + err.message });
        }
        
        // Defensive mapping to ensure data consistency
        const customersWithBirthdayInfo = (rows || []).map(c => {
            let bDay = 1;
            try {
                if (c.birthday && c.birthday.includes('-')) {
                    bDay = new Date(c.birthday).getUTCDate();
                }
            } catch (e) {
                console.warn(`[Customers] Invalid birthday format for ID ${c.id}: ${c.birthday}`);
            }

            return {
                ...c,
                birthdayDay: bDay,
                daysUntilBirthday: 0 // Could be calculated if needed
            };
        });
        
        res.json({
            success: true,
            month: now.toLocaleString('es-CO', { month: 'long' }),
            count: customersWithBirthdayInfo.length,
            customers: customersWithBirthdayInfo
        });
    });
};

// Export Customers
export const exportCustomers = (req, res) => {
    const { format = 'json' } = req.query;
    
    const sql = `
        SELECT c.*, 
               COUNT(DISTINCT t.id) as totalTickets,
               SUM(t.estimatedCost) as totalSpent,
               MAX(t.createdAt) as lastVisit
        FROM customers c
        LEFT JOIN tickets t ON c.phone = t.clientPhone OR c.name = t.clientName
        GROUP BY c.id
        ORDER BY c.name ASC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (format === 'json') {
            return res.json(rows);
        }

        const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Dirección', 'Ciudad', 'Cumpleaños', 'Tipo', 'Estado', 'Total_Servicios', 'Total_Gastado', 'Última_Visita', 'Notas'];
        const csvRows = rows.map(row => [
            row.id,
            row.name,
            row.email || '',
            row.phone || '',
            row.address || '',
            row.city || '',
            row.birthday || '',
            row.customerType || 'Retail',
            row.status || 'active',
            row.totalTickets || 0,
            row.totalSpent || 0,
            row.lastVisit || '',
            `"${(row.notes || '').replace(/"/g, '""')}"`
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
        
        const csvContent = headers.join(',') + '\n' + csvRows.join('\n');
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=clientes_export.csv');
        res.send('\ufeff' + csvContent);
    });
};
