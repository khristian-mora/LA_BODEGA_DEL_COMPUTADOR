import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- VERIFICATION REPORT ---');

db.serialize(() => {
    db.get("SELECT name, stock FROM products WHERE name LIKE '%Lenovo%'", (err, row) => {
        if (err) console.error(err);
        console.log('Product Stock (Lenovo):', row ? row.stock : 'Not found', '(Expected: 4)');
    });

    db.get("SELECT count(*) as count FROM orders", (err, row) => {
        if (err) console.error(err);
        console.log('Total Orders:', row ? row.count : 0, '(Expected: 1)');
    });

    db.get("SELECT SUM(estimatedCost) as total FROM tickets WHERE status = 'DELIVERED'", (err, row) => {
        if (err) console.error(err);
        console.log('Tech Service Revenue:', row ? row.total : 0, '(Expected: 120000)');
    });

    db.get("SELECT SUM(total) as total FROM orders WHERE status != 'Cancelado'", (err, row) => {
        if (err) console.error(err);
        console.log('Product Sales Revenue:', row ? row.total : 0, '(Expected: 4500000)');
    });
});

setTimeout(() => db.close(), 1000);
