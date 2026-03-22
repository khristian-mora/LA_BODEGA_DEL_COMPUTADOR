import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const timestamp = new Date().toISOString();

console.log('--- STARTING REAL DATA SIMULATION ---');

db.serialize(() => {
    // 1. Clear existing data to be sure
    db.run("DELETE FROM order_items");
    db.run("DELETE FROM orders");
    db.run("DELETE FROM tickets");
    db.run("DELETE FROM products");
    db.run("DELETE FROM customers");

    // 2. Insert Products
    const products = [
        ['Laptop Lenovo ThinkPad L14', 4500000, 'Laptops', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=500', 5, 1, '{"processor": "Ryzen 5", "ram": "16GB"}'],
        ['Disco SSD 1TB Kingston', 350000, 'Componentes', 'https://images.unsplash.com/photo-1597872200370-493dea23930b?q=80&w=500', 20, 0, '{"type": "NVMe", "speed": "3500MB/s"}'],
        ['Memoria RAM 16GB DDR4', 280000, 'Componentes', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=500', 15, 0, '{"clock": "3200MHz"}']
    ];
    const pStmt = db.prepare('INSERT INTO products (name, price, category, image, stock, featured, specs) VALUES (?, ?, ?, ?, ?, ?, ?)');
    products.forEach(p => pStmt.run(p));
    pStmt.finalize();

    // 3. Insert Customer
    db.run("INSERT INTO customers (name, email, phone, address, customerType, createdAt) VALUES ('Carlos Pérez', 'carlos@test.com', '3101234567', 'Calle 100 #15-20', 'Regular', '" + timestamp + "')");

    // 4. Create a Technical Service Ticket
    db.run("INSERT INTO tickets (clientName, clientPhone, deviceType, brand, model, issueDescription, status, estimatedCost, createdAt, updatedAt) VALUES ('Carlos Pérez', '3101234567', 'Portátil', 'Lenovo', 'ThinkPad L14', 'Limpieza y cambio de pasta térmica', 'DELIVERED', 120000, '" + timestamp + "', '" + timestamp + "')");

    // 5. Create a Product Order
    db.get("SELECT id FROM products WHERE name LIKE '%Lenovo%' LIMIT 1", (err, product) => {
        if (product) {
            db.run("INSERT INTO orders (orderNumber, customerName, customerEmail, customerPhone, address, total, status, paymentMethod, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                ['ORD-2001', 'Carlos Pérez', 'carlos@test.com', '3101234567', 'Calle 100 #15-20', 4500000, 'Pagado', 'Tarjeta Crédito', timestamp],
                function (err) {
                    if (!err) {
                        const orderId = this.lastID;
                        db.run("INSERT INTO order_items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)", [orderId, product.id, 1, 4500000]);
                        db.run("UPDATE products SET stock = stock - 1 WHERE id = ?", [product.id]);

                        console.log('--- VERIFICATION REPORT ---');

                        db.get("SELECT name, stock FROM products WHERE name LIKE '%Lenovo%'", (err, row) => {
                            console.log('Product Stock (Lenovo):', row ? row.stock : 'Not found', '(Expected: 4)');
                        });

                        db.get("SELECT count(*) as count FROM orders", (err, row) => {
                            console.log('Total Orders:', row ? row.count : 0, '(Expected: 1)');
                        });

                        db.get("SELECT SUM(estimatedCost) as total FROM tickets WHERE status = 'DELIVERED'", (err, row) => {
                            console.log('Tech Service Revenue:', row ? row.total : 0, '(Expected: 120000)');
                        });

                        db.get("SELECT SUM(total) as total FROM orders WHERE status != 'Cancelado'", (err, row) => {
                            console.log('Product Sales Revenue:', row ? row.total : 0, '(Expected: 4500000)');
                        });
                    } else {
                        console.error('Order Error:', err.message);
                    }
                }
            );
        } else {
            console.error('Product not found for order');
        }
    });
});

setTimeout(() => db.close(), 2000);
