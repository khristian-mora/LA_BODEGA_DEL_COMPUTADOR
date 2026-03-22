import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- RUNNING DB MIGRATION ---');

db.serialize(() => {
    // 1. Add minStock to products if not exists
    db.run("ALTER TABLE products ADD COLUMN minStock INTEGER DEFAULT 2", (err) => {
        if (err && err.message.includes('duplicate column name')) {
            console.log('Column minStock already exists.');
        } else if (err) {
            console.error('Error adding minStock:', err.message);
        } else {
            console.log('Added column minStock.');
        }
    });

    // 2. Add supplierEmail to products if not exists
    db.run("ALTER TABLE products ADD COLUMN supplierEmail TEXT", (err) => {
        if (err && err.message.includes('duplicate column name')) {
            console.log('Column supplierEmail already exists.');
        } else if (err) {
            console.error('Error adding supplierEmail:', err.message);
        } else {
            console.log('Added column supplierEmail.');
        }
    });

    // 3. Ensure cart_drafts exists
    db.run(`CREATE TABLE IF NOT EXISTS cart_drafts(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        phone TEXT,
        name TEXT,
        cartData TEXT,
        updatedAt TEXT
    )`, (err) => {
        if (err) console.error('Error creating cart_drafts:', err.message);
        else console.log('Table cart_drafts verified/created.');
    });
});

setTimeout(() => db.close(), 2000);
