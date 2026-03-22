import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'server/database.sqlite');

console.log(`Initializing DB at: ${dbPath}`);
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
    console.log('Connected.');
});

db.serialize(() => {
    console.log('Creating tables...');

    db.run(`CREATE TABLE IF NOT EXISTS products(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        category TEXT,
        image TEXT,
        stock INTEGER DEFAULT 0,
        description TEXT,
        featured INTEGER DEFAULT 0,
        specs TEXT
    )`, (err) => {
        if (err) console.error('Error creating products:', err.message);
        else console.log('Products table created.');
    });

    db.run(`CREATE TABLE IF NOT EXISTS tickets(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientName TEXT,
        clientPhone TEXT,
        deviceType TEXT,
        brand TEXT,
        model TEXT,
        serial TEXT,
        issueDescription TEXT,
        status TEXT DEFAULT 'RECEIVED',
        diagnosis TEXT,
        estimatedCost INTEGER,
        technicianNotes TEXT,
        photosIntake TEXT,
        quoteItems TEXT,
        approvedByClient INTEGER DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT
    )`, (err) => {
        if (err) console.error('Error creating tickets:', err.message);
        else console.log('Tickets table created.');
    });

    db.run(`CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'admin',
        createdAt TEXT
    )`, (err) => {
        if (err) console.error('Error creating users:', err.message);
        else console.log('Users table created.');
    });

    // Seeding
    db.get("SELECT count(*) as count FROM products", [], (err, row) => {
        if (err) {
            console.error("Error checking products count:", err);
            return;
        }
        if (row && row.count === 0) {
            console.log("Seeding initial products...");
            const stmt = db.prepare("INSERT INTO products (name, price, category, image, stock, featured, specs) VALUES (?, ?, ?, ?, ?, ?, ?)");

            const seedData = [
                ["MacBook Pro M3", 16999000, "Laptops", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1000", 15, 1, JSON.stringify({ processor: "M3 Pro", ram: "18GB" })],
                ["Asus ROG Strix", 5800000, "Laptops", "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=1000", 8, 1, JSON.stringify({ processor: "i7-13650HX", ram: "16GB" })],
                ["Silla Gamer Pro", 850000, "Furniture", "https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&q=80&w=1000", 50, 0, "{}"]
            ];

            seedData.forEach(p => stmt.run(p));
            stmt.finalize(() => {
                console.log("Seeding complete.");
            });
        } else {
            console.log(`Products table already has ${row.count} rows.`);
        }
    });

});
