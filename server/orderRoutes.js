// Order Management Routes
import { db } from './db.js';
import { triggerN8nWebhook } from './webhooks.js';

// Get all orders (Admin sees all, Client sees own)
export const getOrders = (req, res) => {
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

    sql += ' ORDER BY o.createdAt DESC';

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const orders = rows.map(o => ({
            ...o,
            items: JSON.parse(o.items || '[]')
        }));
        res.json(orders);
    });
};

// Create new order
export const createOrder = (req, res) => {
    const { customerName, customerEmail, customerPhone, address, total, paymentMethod, items } = req.body;
    const createdAt = new Date().toISOString();

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const orderSql = `INSERT INTO orders (customerName, customerEmail, customerPhone, address, total, paymentMethod, createdAt, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendiente')`;

        db.run(orderSql, [customerName, customerEmail, customerPhone, address, total, paymentMethod, createdAt], function (err) {
            if (err) {
                db.run('ROLLBACK');
                res.status(400).json({ error: err.message });
                return;
            }

            const orderId = this.lastID;
            const orderNumber = `ORD-${1000 + orderId}`;

            // Update order with orderNumber
            db.run('UPDATE orders SET orderNumber = ? WHERE id = ?', [orderNumber, orderId]);

            // Insert Items
            const itemSql = `INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)`;
            let itemsProcessed = 0;
            let hasError = false;

            items.forEach(item => {
                db.run(itemSql, [orderId, item.id, item.quantity, item.price], (err) => {
                    if (err && !hasError) {
                        hasError = true;
                        db.run('ROLLBACK');
                        res.status(400).json({ error: err.message });
                        return;
                    }

                    // Update Stock
                    db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);

                    itemsProcessed++;
                    if (itemsProcessed === items.length && !hasError) {
                        db.run('COMMIT');

                        // Trigger Webhook
                        triggerN8nWebhook('order.created', {
                            orderId,
                            orderNumber,
                            customerName,
                            customerPhone,
                            total,
                            items: items.map(i => ({ name: i.name, quantity: i.quantity }))
                        }).catch(console.error);

                        res.json({ id: orderId, orderNumber, status: 'Pendiente' });
                    }
                });
            });
        });
    });
};

// Update Order Status
export const updateOrderStatus = (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    const updatedAt = new Date().toISOString();

    db.run('UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?', [status, updatedAt, id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        // Trigger Webhook if status changed
        db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
            if (!err && order) {
                triggerN8nWebhook('order.status_updated', {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    customerName: order.customerName,
                    customerPhone: order.customerPhone,
                    status: order.status
                }).catch(console.error);
            }
        });

        res.json({ success: true });
    });
};

// Get Single Order
export const getOrder = (req, res) => {
    const { id } = req.params;
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
        if (err || !row) {
            res.status(404).json({ error: 'Order not found' });
            return;
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

    const sql = phone
        ? 'SELECT * FROM orders WHERE orderNumber = ? AND customerPhone = ?'
        : 'SELECT * FROM orders WHERE orderNumber = ?';

    const params = phone ? [orderNumber, phone] : [orderNumber];

    db.get(sql, params, (err, order) => {
        if (err || !order) {
            res.status(404).json({ error: 'Pedido no encontrado' });
            return;
        }

        res.json({
            orderNumber: order.orderNumber,
            status: order.status,
            customerName: order.customerName,
            total: order.total,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        });
    });
};
