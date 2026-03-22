import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'server/database.sqlite');

console.log(`Checking DB at: ${dbPath}`);
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
    console.log('Connected.');
});

db.all('SELECT * FROM products LIMIT 1', [], (err, rows) => {
    if (err) {
        console.error('Error querying products:', err.message);
    } else {
        console.log('Products query success. Rows:', rows);
    }

    db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, tables) => {
        if (err) console.error("Error listing tables:", err);
        else console.log("Tables:", tables);
    });
});
