#!/usr/bin/env python3
"""
Make the Prisma database compatible with the server code.
Add missing columns that the server expects but Prisma doesn't have.
"""

import sqlite3
import shutil
from datetime import datetime

PRISMA_DB = "la-bodega/prisma/dev.db"
SERVER_DB = "server/database.sqlite"

def make_compatible():
    # First, backup current server DB
    shutil.copy2(SERVER_DB, f"{SERVER_DB}.bak")
    
    # Copy Prisma DB to server location
    shutil.copy2(PRISMA_DB, SERVER_DB)
    
    conn = sqlite3.connect(SERVER_DB)
    cur = conn.cursor()
    
    # Add server-specific columns to products table
    columns_to_add = [
        ("image", "TEXT"),  # Single image URL (server uses this)
        ("featured", "INTEGER DEFAULT 0"),  # Featured product flag
        ("minStock", "INTEGER DEFAULT 2"),  # Alias for stock_minimo
        ("supplierEmail", "TEXT"),  # Supplier email
        ("builderCategory", "TEXT"),  # Builder category
        ("specs", "TEXT"),  # Specs as text (alias for specs_json)
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            cur.execute(f"ALTER TABLE products ADD COLUMN {col_name} {col_type}")
            print(f"Added column: {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e):
                print(f"Column {col_name} already exists")
            else:
                print(f"Error adding {col_name}: {e}")
    
    # Copy data from new columns to old columns
    # minStock = stock_minimo
    cur.execute("UPDATE products SET minStock = stock_minimo WHERE minStock IS NULL")
    
    # specs = specs_json (as text)
    cur.execute("UPDATE products SET specs = specs_json WHERE specs IS NULL AND specs_json IS NOT NULL")
    
    # Set default image for products without images
    cur.execute("UPDATE products SET image = '' WHERE image IS NULL")
    
    # Set featured = 0 for all
    cur.execute("UPDATE products SET featured = 0 WHERE featured IS NULL")
    
    conn.commit()
    
    # Verify
    cur.execute("PRAGMA table_info(products)")
    cols = [c[1] for c in cur.fetchall()]
    print(f"\nProducts table now has {len(cols)} columns:")
    for c in cols:
        print(f"  - {c}")
    
    cur.execute("SELECT COUNT(*) FROM products")
    count = cur.fetchone()[0]
    print(f"\nTotal products: {count}")
    
    # Create tickets table if not exists (server expects it)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS tickets(
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
        )
    """)
    
    # Create users table if not exists
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users(
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
        )
    """)
    
    # Create orders table if not exists
    cur.execute("""
        CREATE TABLE IF NOT EXISTS orders(
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
        )
    """)
    
    # Create order_items table if not exists
    cur.execute("""
        CREATE TABLE IF NOT EXISTS order_items(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            orderId INTEGER,
            productId INTEGER,
            quantity INTEGER,
            price INTEGER,
            FOREIGN KEY (orderId) REFERENCES orders(id),
            FOREIGN KEY (productId) REFERENCES products(id)
        )
    """)
    
    # Create settings table if not exists
    cur.execute("""
        CREATE TABLE IF NOT EXISTS settings(
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    
    conn.commit()
    conn.close()
    
    # Now sync back to Prisma DB
    shutil.copy2(SERVER_DB, PRISMA_DB)
    
    print("\nDatabase is now compatible with both server and Prisma!")
    print(f"Both databases are at: {SERVER_DB} and {PRISMA_DB}")

if __name__ == "__main__":
    make_compatible()
