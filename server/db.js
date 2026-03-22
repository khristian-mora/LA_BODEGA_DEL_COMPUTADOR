import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

import mysql from 'mysql2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Interface Wrapper
let db;

if (process.env.DB_HOST) {
    console.log('[DB] Using MySQL connection');
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    // MySQL Wrapper to mimic SQLite API
    db = {
        pool,
        run: function (sql, params, callback) {
            // Fix Syntax: AUTOINCREMENT -> AUTO_INCREMENT
            sql = sql.replace(/AUTOINCREMENT/g, 'AUTO_INCREMENT');
            // Fix Syntax: INTEGER PRIMARY KEY -> INT PRIMARY KEY
            if (sql.includes('CREATE TABLE')) {
                sql = sql.replace(/INTEGER PRIMARY KEY/g, 'INT PRIMARY KEY');
            }

            this.pool.query(sql, params, function (err, results) {
                if (err) {
                    if (callback) callback(err);
                    return;
                }
                // Mocking the 'this' context for SQLite callbacks
                if (callback) {
                    callback.call({ lastID: results.insertId, changes: results.affectedRows }, null);
                }
            });
        },
        all: function (sql, params, callback) {
            this.pool.query(sql, params, function (err, rows) {
                callback(err, rows);
            });
        },
        get: function (sql, params, callback) {
            this.pool.query(sql, params, function (err, rows) {
                if (err) callback(err);
                else callback(null, rows && rows.length > 0 ? rows[0] : undefined);
            });
        },
        serialize: function (callback) {
            callback(); // MySQL doesn't need serialize
        },
        prepare: function (sql) {
            return {
                run: (params) => this.run(sql, params),
                finalize: () => { }
            }
        }
    };

    // Init DB immediately for MySQL
    setTimeout(initDb, 1000);

} else {
    // SQLite Fallback (Original Code)
    const dbPath = path.resolve(__dirname, 'database.sqlite');
    console.log(`[DB] Using SQLite database at: ${dbPath}`);
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database', err.message);
        } else {
            console.log('Connected to the SQLite database.');
            initDb();
        }
    });
}

export { db };

function initDb() {
    db.serialize(() => {


        db.run(`CREATE TABLE IF NOT EXISTS products(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        category TEXT,
        image TEXT,
        stock INTEGER DEFAULT 0,
        minStock INTEGER DEFAULT 2,
        supplierEmail TEXT,
        description TEXT,
        featured INTEGER DEFAULT 0,
        specs TEXT
    )`, (err) => { if (err) console.error('[DB] Error creating products table:', err.message); });

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
        findings TEXT,
        recommendations TEXT,
        createdAt TEXT,
        updatedAt TEXT
    )`);

        db.run(`CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        status TEXT DEFAULT 'active',
        resetToken TEXT,
        resetTokenExpiry TEXT,
        twoFactorSecret TEXT,
        twoFactorEnabled INTEGER DEFAULT 0,
        createdAt TEXT
    )`);

        // User Activity Log
        db.run(`CREATE TABLE IF NOT EXISTS user_activity_log(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        action TEXT,
        module TEXT,
        details TEXT,
        timestamp TEXT,
        FOREIGN KEY (userId) REFERENCES users(id)
    )`);

        // Customers (CRM)
        db.run(`CREATE TABLE IF NOT EXISTS customers(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        idNumber TEXT,
        customerType TEXT DEFAULT 'Regular',
        notes TEXT,
        createdAt TEXT,
        updatedAt TEXT
    )`);

        // Appointments
        db.run(`CREATE TABLE IF NOT EXISTS appointments(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerId INTEGER,
        technicianId INTEGER,
        serviceType TEXT,
        scheduledDate TEXT,
        status TEXT DEFAULT 'Pending',
        notes TEXT,
        createdAt TEXT,
        FOREIGN KEY (customerId) REFERENCES customers(id),
        FOREIGN KEY (technicianId) REFERENCES users(id)
    )`);

        // Warranties
        db.run(`CREATE TABLE IF NOT EXISTS warranties(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticketId INTEGER,
        orderId INTEGER,
        productId INTEGER,
        customerId INTEGER,
        startDate TEXT,
        endDate TEXT,
        terms TEXT,
        status TEXT DEFAULT 'Active',
        createdAt TEXT,
        FOREIGN KEY (ticketId) REFERENCES tickets(id),
        FOREIGN KEY (customerId) REFERENCES customers(id)
    )`);

        // Warranty Claims
        db.run(`CREATE TABLE IF NOT EXISTS warranty_claims(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        warrantyId INTEGER,
        claimDate TEXT,
        description TEXT,
        resolution TEXT,
        resolvedDate TEXT,
        FOREIGN KEY (warrantyId) REFERENCES warranties(id)
    )`);

        // Notifications
        db.run(`CREATE TABLE IF NOT EXISTS notifications(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        type TEXT,
        title TEXT,
        message TEXT,
        link TEXT,
        isRead INTEGER DEFAULT 0,
        createdAt TEXT,
        FOREIGN KEY (userId) REFERENCES users(id)
    )`);

        // Orders (Product Sales)
        db.run(`CREATE TABLE IF NOT EXISTS orders(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderNumber TEXT UNIQUE,
        customerName TEXT,
        customerEmail TEXT,
        customerPhone TEXT,
        address TEXT,
        total INTEGER,
        status TEXT DEFAULT 'Pagado',
        paymentMethod TEXT,
        createdAt TEXT,
        updatedAt TEXT
    )`);

        // Order Items
        db.run(`CREATE TABLE IF NOT EXISTS order_items(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId INTEGER,
        productId INTEGER,
        quantity INTEGER,
        price INTEGER,
        FOREIGN KEY (orderId) REFERENCES orders(id),
        FOREIGN KEY (productId) REFERENCES products(id)
    )`);

        // Cart Drafts (For Abandoned Cart Recovery)
        db.run(`CREATE TABLE IF NOT EXISTS cart_drafts(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        phone TEXT,
        name TEXT,
        cartData TEXT,
        updatedAt TEXT
    )`);

        // CMS Settings
        db.run(`CREATE TABLE IF NOT EXISTS settings(
        key TEXT PRIMARY KEY,
        value TEXT
    )`, (err) => {
            if (!err) {
                // Seed default settings if they don't exist
                const defaults = [
                    ['heroTitle', 'ELIGE TU MÁQUINA'],
                    ['heroSubtitle', 'Potencia, diseño y rendimiento. Descubre la nueva generación de computadoras diseñadas para creadores y gamers.'],
                    ['heroImage', '/src/assets/hero_laptop.png'],
                    ['bannerTitle', 'Mejora tu Flujo de Trabajo'],
                    ['bannerSubtitle', 'Obtén hasta un 20% de descuento en workstations empresariales esta semana.'],
                    ['whatsappNumber', '+573210000000'],
                    ['businessEmail', 'ventas@labodega.com']
                ];
                defaults.forEach(([key, val]) => {
                    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, val]);
                });
            }
        });

        // Suppliers
        db.run(`CREATE TABLE IF NOT EXISTS suppliers(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT,
        email TEXT,
        phone TEXT,
        category TEXT,
        notes TEXT,
        status TEXT DEFAULT 'active',
        createdAt TEXT,
        updatedAt TEXT
    )`);

        // Coupons (Marketing)
        db.run(`CREATE TABLE IF NOT EXISTS coupons(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        discount INTEGER NOT NULL,
        type TEXT DEFAULT 'percent',
        uses INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        expiresAt TEXT,
        createdAt TEXT
    )`);

        // Employees (HR)
        db.run(`CREATE TABLE IF NOT EXISTS employees(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeCode TEXT UNIQUE,
        name TEXT NOT NULL,
        role TEXT,
        salary INTEGER,
        hireDate TEXT,
        status TEXT DEFAULT 'Active',
        phone TEXT,
        email TEXT,
        address TEXT,
        emergencyContact TEXT,
        notes TEXT,
        createdAt TEXT,
        updatedAt TEXT
    )`);

        // Returns (RMA)
        db.run(`CREATE TABLE IF NOT EXISTS returns(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rmaCode TEXT UNIQUE,
        orderId INTEGER,
        customerId INTEGER,
        customerName TEXT,
        product TEXT,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        resolution TEXT,
        refundAmount INTEGER,
        createdAt TEXT,
        resolvedAt TEXT,
        FOREIGN KEY (orderId) REFERENCES orders(id),
        FOREIGN KEY (customerId) REFERENCES customers(id)
    )`);

        // Expenses
        db.run(`CREATE TABLE IF NOT EXISTS expenses(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount INTEGER NOT NULL,
        category TEXT,
        vendor TEXT,
        date TEXT,
        paymentMethod TEXT,
        notes TEXT,
        receiptUrl TEXT,
        createdAt TEXT
    )`);

    });
};
