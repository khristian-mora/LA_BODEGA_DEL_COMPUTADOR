import { db, logActivity } from './db.js';
import { triggerN8nWebhook } from './webhooks.js';
import { broadcastNotification } from './notificationRoutes.js';


// Get all orders (Admin sees all, Client sees own) with pagination and filters
export const getOrders = (req, res) => {
    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
        SELECT o.*, 
               (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
                   'id', oi.id,
                   'productId', oi.productId,
                   'quantity', oi.quantity,
                   'price', oi.price,
                   'name', p.name,
                   'image', p.image
               ))
                FROM order_items oi
                JOIN products p ON oi.productId = p.id
                WHERE oi.orderId = o.id) as items
        FROM orders o
        WHERE 1=1
    `;
    const params = [];

    // Filter for non-admin users
    if (req.user.role !== 'admin') {
        sql += ' AND o.customerEmail = ?';
        params.push(req.user.email);
    }
    
    // Additional filters
    if (status) {
        sql += ' AND o.status = ?';
        params.push(status);
    }
    
    if (startDate) {
        sql += ' AND o.createdAt >= ?';
        params.push(startDate);
    }
    
    if (endDate) {
        sql += ' AND o.createdAt <= ?';
        params.push(endDate);
    }

    sql += ' ORDER BY o.createdAt DESC';
    
    // Pagination
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Count total for pagination
        const countSql = `SELECT COUNT(*) as total FROM orders WHERE 1=1 ${req.user.role !== 'admin' ? 'AND customerEmail = ?' : ''}`;
        const countParams = req.user.role !== 'admin' ? [req.user.email] : [];
        
        db.get(countSql, countParams, (countErr, countRow) => {
            if (countErr) {
                return res.status(500).json({ error: countErr.message });
            }
            
            const orders = rows.map(o => ({
                ...o,
                items: JSON.parse(o.items || '[]')
            }));
            
            res.json({
                orders,
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

// Tax rate (IVA Colombia 19%)
const TAX_RATE = 0.19;

// Helper function to calculate tax
const calculateTax = (subtotal) => {
    return {
        subtotal: subtotal,
        tax: subtotal * TAX_RATE,
        total: subtotal * (1 + TAX_RATE)
    };
};

// Create new order with validation and stock check
export const createOrder = async (req, res) => {
    // SECURITY FIX: Do NOT destructure 'discount' from req.body. We use 'couponCode' instead.
    const { customerName, customerEmail, customerPhone, address, paymentMethod, items, couponCode, notes } = req.body;
    
    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'El pedido debe tener al menos un producto' });
    }
    
    let subtotal = 0;
    const processedItems = [];
    
    try {
        for (const item of items) {
            if (!item.id || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({ error: `Producto inválido.` });
            }
            
            // Get current stock AND FORCE PRICE from DB
            const product = await new Promise((resolve, reject) => {
                db.get('SELECT id, name, price, stock FROM products WHERE id = ?', [item.id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (!product) {
                return res.status(400).json({ error: `Producto no encontrado: ${item.id}` });
            }
            
            if (product.stock < item.quantity) {
                return res.status(400).json({ 
                    error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` 
                });
            }
            
            // Calculate item total using DB price
            const itemPrice = product.price;
            subtotal += itemPrice * item.quantity;
            
            processedItems.push({
                id: product.id,
                name: product.name,
                price: itemPrice,
                quantity: item.quantity
            });
        }
        
        // Server-Side Discount Calculation
        let calculatedDiscount = 0;
        if (couponCode) {
            const coupon = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM coupons WHERE code = ? AND status = "ACTIVO"', [couponCode], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (!coupon) {
                return res.status(400).json({ error: 'Cupón inválido o inactivo' });
            }
            
            const now = new Date().toISOString();
            if (coupon.validUntil && coupon.validUntil < now) {
                return res.status(400).json({ error: 'El cupón ha expirado' });
            }
            
            if (coupon.discountType === 'PERCENTAGE') {
                calculatedDiscount = subtotal * (coupon.discountValue / 100);
            } else {
                calculatedDiscount = coupon.discountValue;
            }
            
            // Increment usage
            db.run('UPDATE coupons SET usageCount = usageCount + 1 WHERE id = ?', [coupon.id]);
        }
        
        // Ensure we don't discount more than the subtotal
        const finalDiscount = Math.min(calculatedDiscount, subtotal);
        const discountedSubtotal = subtotal - finalDiscount;
        const { tax, total } = calculateTax(discountedSubtotal);
        
        const createdAt = new Date().toISOString();
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            const orderSql = `INSERT INTO orders (customerName, customerEmail, customerPhone, address, total, subtotal, tax, discount, paymentMethod, notes, createdAt, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente')`;
            
            db.run(orderSql, [
                customerName, customerEmail, customerPhone, address, 
                total, subtotal, tax, finalDiscount, paymentMethod, notes || null, createdAt
            ], function (err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(400).json({ error: err.message });
                }
                
                const orderId = this.lastID;
                // Formato con guión si se desea, pero debe cuadrar con bd
                const orderNumber = `ORD-${1000 + orderId}`;
                
                db.run('UPDATE orders SET orderNumber = ? WHERE id = ?', [orderNumber, orderId]);
                
                const itemSql = `INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)`;
                let itemsProcessedCount = 0;
                let hasError = false;
                
                processedItems.forEach(item => {
                    db.run(itemSql, [orderId, item.id, item.quantity, item.price], (err) => {
                        if (err && !hasError) {
                            hasError = true;
                            db.run('ROLLBACK');
                            return res.status(400).json({ error: err.message });
                        }
                        
                        // Update Stock
                        db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id], (err) => {
                            if (!err) {
                                // Check for low stock alert
                                db.get('SELECT name, stock, minStock FROM products WHERE id = ?', [item.id], (err, prod) => {
                                    if (prod && prod.stock <= prod.minStock) {
                                        broadcastNotification(
                                            'admin', 
                                            'LOW_STOCK', 
                                            '⚠️ Alerta de Inventario Bajo', 
                                            `El producto "${prod.name}" ha llegado a su límite mínimo (${prod.stock} unidades).`,
                                            '/admin/inventory'
                                        );
                                    }
                                });
                            }
                        });
                        
                        itemsProcessedCount++;
                        if (itemsProcessedCount === processedItems.length && !hasError) {
                            db.run('COMMIT');
                            
                            // Crear garantías automáticamente para cada producto
                            const now = new Date().toISOString();
                            const warrantyPromises = processedItems.map(async (item) => {
                                const product = await new Promise((resolve, reject) => {
                                    db.get('SELECT warrantyMonths FROM products WHERE id = ?', [item.id], (err, row) => {
                                        if (err) reject(err);
                                        else resolve(row);
                                    });
                                });
                                const warrantyMonths = product?.warrantyMonths || 12;
                                const endDate = new Date();
                                endDate.setMonth(endDate.getMonth() + warrantyMonths);
                                
                                return new Promise((resolve, reject) => {
                                    db.run(
                                        `INSERT INTO warranties (orderId, productId, startDate, endDate, terms, status, createdAt) 
                                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                        [orderId, item.id, now, endDate.toISOString(), `Garantía automática por compra - ${warrantyMonths} meses`, 'Active', now],
                                        (err) => {
                                            if (err) console.error('[Warranty] Error creating warranty:', err);
                                            resolve();
                                        }
                                    );
                                });
                            });
                            
                            Promise.all(warrantyPromises).catch(err => console.error('[Warranty] Error creating warranties:', err));
                            
                            // Trigger Webhook
                            triggerN8nWebhook('order.created', {
                                orderId,
                                orderNumber,
                                customerName,
                                customerPhone,
                                subtotal,
                                tax,
                                discount: finalDiscount,
                                total,
                                items: processedItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price }))
                            }).catch(console.error);
                            
                            // Log activity if admin/user creating
                            db.run(
                                'INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)',
                                [req.user?.id || 0, 'CREATE', 'ORDERS', `Pedido creado: ${orderNumber}`, createdAt]
                            );
                            
                            res.status(201).json({ 
                                id: orderId, 
                                orderNumber, 
                                status: 'Pendiente',
                                subtotal,
                                tax,
                                discount: finalDiscount,
                                total,
                                createdAt
                            });
                        }
                    });
                });
            });
        });
    } catch (e) {
        console.error("Order Creation Error", e);
        res.status(500).json({ error: 'Error procesando el pedido' });
    }
};

// Update Order Status with validation
export const updateOrderStatus = (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    const updatedAt = new Date().toISOString();
    
    // Validate status
    const validStatuses = ['Pendiente', 'En Proceso', 'Completado', 'Entregado', 'Cancelado', 'Rechazado'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${validStatuses.join(', ')}` });
    }
    
    // Check if order exists and get current status
    db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        
        // Optional: Validate status transitions
        const allowedTransitions = {
            'Pendiente': ['En Proceso', 'Cancelado'],
            'En Proceso': ['Completado', 'Cancelado'],
            'Completado': ['Entregado', 'Cancelado'],
            'Entregado': [],
            'Cancelado': [],
            'Rechazado': []
        };
        
        const currentStatus = order.status;
        if (!allowedTransitions[currentStatus]?.includes(status) && currentStatus !== status) {
            // Just warn, don't block
            console.warn(`Transición de estado no estándar: ${currentStatus} -> ${status}`);
        }
        
        // Update status
        db.run('UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?', [status, updatedAt, id], function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            
            // Update customer totalSpent when order is delivered
            if (status === 'Entregado' && order.total) {
                const customerName = order.customerName;
                db.get('SELECT id, totalSpent, customerType FROM customers WHERE name = ?', [customerName], (err, customer) => {
                    if (!err && customer) {
                        const newTotal = (customer.totalSpent || 0) + parseFloat(order.total);
                        const newType = (newTotal >= 5000000 && customer.customerType !== 'VIP') ? 'VIP' : customer.customerType;
                        
                        db.run('UPDATE customers SET totalSpent = ?, lastPurchaseDate = ?, customerType = ? WHERE id = ?', 
                            [newTotal, updatedAt, newType, customer.id], (err) => {
                                if (!err) {
                                    console.log(`Updated customer ${customerName} totalSpent to ${newTotal}${newType !== customer.customerType ? `, upgraded to ${newType}` : ''}`);
                                }
                            });
                    }
                });
            }
            
            // Trigger Webhook
            triggerN8nWebhook('order.status_updated', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                oldStatus: currentStatus,
                newStatus: status
            }).catch(console.error);
            
            // Log activity
            db.run(
                'INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)',
                [req.user?.id || 0, 'UPDATE_STATUS', 'ORDERS', `Pedido ${order.orderNumber}: ${currentStatus} -> ${status}`, updatedAt]
            );
            
            res.json({ 
                success: true, 
                id: parseInt(id),
                oldStatus: currentStatus,
                newStatus: status
            });
        });
    });
};

// Get Single Order
export const getOrder = (req, res) => {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'ID de pedido inválido' });
    }
    
    const sql = `
        SELECT o.*, 
               (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
                   'id', oi.id,
                   'productId', oi.productId,
                   'quantity', oi.quantity,
                   'price', oi.price,
                   'name', p.name,
                   'image', p.image
               ))
                FROM order_items oi
                JOIN products p ON oi.productId = p.id
                WHERE oi.orderId = o.id) as items
        FROM orders o
        WHERE o.id = ?
    `;

    db.get(sql, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        
        const order = {
            ...row,
            items: JSON.parse(row.items || '[]')
        };
        res.json(order);
    });
};

// Track Order (Public or simple validation)
export const trackOrder = (req, res) => {
    const { orderNumber } = req.params;
    const { phone } = req.query; // Optional phone validation
    
    if (!orderNumber) {
        return res.status(400).json({ error: 'Número de pedido requerido' });
    }

    const sql = phone
        ? 'SELECT * FROM orders WHERE orderNumber = ? AND customerPhone = ?'
        : 'SELECT * FROM orders WHERE orderNumber = ?';

    const params = phone ? [orderNumber, phone] : [orderNumber];

    db.get(sql, params, (err, order) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json({
            orderNumber: order.orderNumber,
            status: order.status,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            subtotal: order.subtotal,
            tax: order.tax,
            discount: order.discount,
            total: order.total,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        });
    });
};

// Cancel Order (with stock restoration)
export const cancelOrder = (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const updatedAt = new Date().toISOString();
    
    // Validate ID
    if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'ID de pedido inválido' });
    }
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Get order with items
        const sql = `
            SELECT o.*, 
                   (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
                       'productId', oi.productId,
                       'quantity', oi.quantity
                   ))
                    FROM order_items oi
                    WHERE oi.orderId = o.id) as items
            FROM orders o
            WHERE o.id = ?
        `;
        
        db.get(sql, [id], (err, order) => {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }
            if (!order) {
                db.run('ROLLBACK');
                return res.status(404).json({ error: 'Pedido no encontrado' });
            }
            
            if (order.status === 'Cancelado') {
                db.run('ROLLBACK');
                return res.status(400).json({ error: 'El pedido ya está cancelado' });
            }
            
            if (order.status === 'Entregado') {
                db.run('ROLLBACK');
                return res.status(400).json({ error: 'No se puede cancelar un pedido entregado' });
            }
            
            // Restore stock for each item
            const items = JSON.parse(order.items || '[]');
            let itemsProcessed = 0;
            
            if (items.length === 0) {
                // No items to restore, just update status
                updateOrderStatus();
            } else {
                items.forEach(item => {
                    db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.productId], (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: `Error restaurando stock: ${err.message}` });
                        }
                        
                        itemsProcessed++;
                        if (itemsProcessed === items.length) {
                            updateOrderStatus();
                        }
                    });
                });
            }
            
            function updateOrderStatus() {
                db.run('UPDATE orders SET status = ?, cancelReason = ?, updatedAt = ? WHERE id = ?', 
                    ['Cancelado', reason || 'Cancelado por usuario', updatedAt, id], function (err) {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: err.message });
                        }
                        
                        db.run('COMMIT');
                        
                        // Trigger Webhook
                        triggerN8nWebhook('order.cancelled', {
                            orderId: order.id,
                            orderNumber: order.orderNumber,
                            customerName: order.customerName,
                            reason: reason || 'Cancelado por usuario'
                        }).catch(console.error);
                        
                        // Log activity
                        db.run(
                            'INSERT INTO user_activity_log (userId, action, module, details, timestamp) VALUES (?, ?, ?, ?, ?)',
                            [req.user?.id || 0, 'CANCEL', 'ORDERS', `Pedido cancelado: ${order.orderNumber}. Razón: ${reason || 'N/A'}`, updatedAt]
                        );
                        
                        res.json({ 
                            success: true, 
                            message: 'Pedido cancelado correctamente',
                            id: parseInt(id),
                            stockRestored: items.length
                        });
                    }
                );
            }
        });
    });
};

// Export Orders (Complete Database)
export const exportOrders = (req, res) => {
    const { status, startDate, endDate, format = 'json' } = req.query;
    
    let sql = `
        SELECT o.*, 
               (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
                   'id', oi.id,
                   'productId', oi.productId,
                   'quantity', oi.quantity,
                   'price', oi.price,
                   'name', p.name
               ))
                FROM order_items oi
                JOIN products p ON oi.productId = p.id
                WHERE oi.orderId = o.id) as items
        FROM orders o
        WHERE 1=1
    `;
    const params = [];

    if (status) {
        sql += ' AND o.status = ?';
        params.push(status);
    }
    if (startDate) {
        sql += ' AND o.createdAt >= ?';
        params.push(startDate);
    }
    if (endDate) {
        sql += ' AND o.createdAt <= ?';
        params.push(endDate);
    }

    sql += ' ORDER BY o.createdAt DESC';

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (format === 'json') {
            return res.json(rows.map(row => ({
                ...row,
                items: JSON.parse(row.items || '[]')
            })));
        }

        // Convert to CSV
        const headers = ['Orden #', 'Cliente', 'Email', 'Teléfono', 'Total', 'Subtotal', 'Impuestos', 'Descuento', 'Método Pago', 'Estado', 'Fecha'];
        const csvRows = rows.map(row => [
            row.orderNumber,
            `"${(row.customerName || '').replace(/"/g, '""')}"`,
            row.customerEmail,
            row.customerPhone,
            row.total,
            row.subtotal,
            row.tax,
            row.discount,
            row.paymentMethod,
            row.status,
            row.createdAt
        ].join(','));
        
        const csvContent = [headers.join(','), ...csvRows].join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=pedidos_export.csv');
        res.send('\ufeff' + csvContent);
    });
};
