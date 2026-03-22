const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/database.sqlite');

db.serialize(() => {
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
});
db.close();
