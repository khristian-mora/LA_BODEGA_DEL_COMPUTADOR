import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const timestamp = new Date().toISOString();
// 6 months ago
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 7);
const oldDate = sixMonthsAgo.toISOString();

console.log('--- STARTING AUTOMATION VERIFICATION ---');

db.serialize(() => {
    // 1. Prepare Test Data
    db.run("DELETE FROM cart_drafts");

    // Set a product to low stock
    db.run("UPDATE products SET stock = 1, minStock = 5, supplierEmail = 'pedidos@intel.com' WHERE name LIKE '%Memoria%'");

    // Add an old ticket for maintenance reminder test
    db.run(`INSERT INTO tickets (clientName, clientPhone, status, updatedAt, deviceType, brand, model) 
            VALUES ('Ana Maria', '3209876543', 'DELIVERED', '${oldDate}', 'Laptop', 'HP', 'Pavilion')`);

    // 2. Verify Database Logic
    console.log('--- VERIFICATION REPORT ---');

    // Test: Maintenance Due
    db.all("SELECT clientName FROM tickets WHERE status = 'DELIVERED' AND updatedAt <= ?", [new Date(Date.now() - 175 * 24 * 60 * 60 * 1000).toISOString()], (err, rows) => {
        console.log('Maintenance Reminders Pending:', rows.length, '(Expected: 1)');
        if (rows[0]) console.log('Client to Contact:', rows[0].clientName);
    });

    // Test: Low Stock Alerts
    db.all("SELECT name, supplierEmail FROM products WHERE stock <= minStock", (err, rows) => {
        console.log('Low Stock Alerts:', rows.length, '(Expected: >0)');
        if (rows[0]) console.log('Product to Reorder:', rows[0].name, 'Contact:', rows[0].supplierEmail);
    });

    // Test: Draft Cart insertion
    db.run("INSERT INTO cart_drafts (email, phone, name, cartData, updatedAt) VALUES ('test@abandon.com', '555123', 'John Doe', '[]', '" + timestamp + "')", function (err) {
        db.get("SELECT count(*) as count FROM cart_drafts", (err, row) => {
            console.log('Abandoned Cart Drafts recorded:', row.count, '(Expected: 1)');
        });
    });
});

setTimeout(() => db.close(), 2000);
