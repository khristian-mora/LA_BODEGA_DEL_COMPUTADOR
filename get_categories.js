import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'server/database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
    console.log('Connected to database.');
});

db.all('SELECT DISTINCT category FROM products ORDER BY category', [], (err, rows) => {
    if (err) {
        console.error('Error querying categories:', err.message);
    } else {
        console.log('Distinct categories in database:');
        rows.forEach(row => console.log(`- "${row.category}"`));
    }
    
    // Also get a sample product to see structure
    db.all('SELECT id, name, category FROM products LIMIT 5', [], (err2, rows2) => {
        if (err2) {
            console.error('Error querying sample products:', err2.message);
        } else {
            console.log('\nSample products:');
            rows2.forEach(p => console.log(`ID: ${p.id}, Name: ${p.name}, Category: "${p.category}"`));
        }
        db.close();
    });
});