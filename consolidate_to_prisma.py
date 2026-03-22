#!/usr/bin/env python3
"""
Consolidate all databases into Prisma (la-bodega/prisma/dev.db)
- Migrate products from server/database.sqlite
- Import all products from LISTADO.xlsx
- Create categories and brands automatically
- Set stockMinimo and stockMaximo for each product
"""

import sqlite3
import openpyxl
import re
import hashlib
import os
import shutil
from datetime import datetime

# Paths
PRISMA_DB = "la-bodega/prisma/dev.db"
MAIN_DB = "server/database.sqlite"
EXCEL_FILE = "LISTADO.xlsx"
BACKUP_DIR = "backups"

def cuid():
    """Generate a CUID-like ID for Prisma"""
    timestamp = int(datetime.now().timestamp() * 1000)
    random_part = hashlib.md5(os.urandom(16)).hexdigest()[:24]
    return f"c{timestamp}{random_part}"[:25]

def slugify(text):
    """Convert text to slug"""
    if not text:
        return ""
    text = text.lower().strip()
    text = re.sub(r'[áàäâ]', 'a', text)
    text = re.sub(r'[éèëê]', 'e', text)
    text = re.sub(r'[íìïî]', 'i', text)
    text = re.sub(r'[óòöô]', 'o', text)
    text = re.sub(r'[úùüû]', 'u', text)
    text = re.sub(r'[ñ]', 'n', text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')

# ============================================================
# CATEGORY MAPPING - keywords to categories
# ============================================================
CATEGORY_KEYWORDS = {
    # Computadores
    "COMPUTADOR": "Computadores",
    "PC ": "Computadores",
    "DESKTOP": "Computadores",
    "ESCRITORIO": "Computadores",
    "TOWER": "Computadores",
    "ALL IN ONE": "Computadores",
    "MINI PC": "Computadores",
    
    # Laptops
    "LAPTOP": "Laptops",
    "NOTEBOOK": "Laptops",
    "PORTATIL": "Laptops",
    "PORTÁTIL": "Laptops",
    
    # Monitores
    "MONITOR": "Monitores",
    "PANTALLA": "Monitores",
    "LED ": "Monitores",
    "LCD ": "Monitores",
    
    # Impresoras
    "IMPRESORA": "Impresoras",
    "IMPRESOR": "Impresoras",
    "PRINTER": "Impresoras",
    "TONER": "Impresoras",
    "CARTUCHO": "Impresoras",
    "TINTA": "Impresoras",
    "FUSER": "Impresoras",
    
    # Componentes
    "RAM ": "Componentes",
    "MEMORIA": "Componentes",
    "DISCO": "Componentes",
    "SSD": "Componentes",
    "HDD": "Componentes",
    "PROCESADOR": "Componentes",
    "CPU ": "Componentes",
    "PLACA": "Componentes",
    "TARJETA DE VIDEO": "Componentes",
    "GPU": "Componentes",
    "FOENTE": "Componentes",
    "FUENTE": "Componentes",
    "GABINETE": "Componentes",
    "CASE ": "Componentes",
    
    # Perifericos
    "TECLADO": "Perifericos",
    "MOUSE": "Perifericos",
    "AUDIFONO": "Perifericos",
    "AURICULAR": "Perifericos",
    "HEADSET": "Perifericos",
    "WEBCAM": "Perifericos",
    "MICROFONO": "Perifericos",
    "MICRÓFONO": "Perifericos",
    "PARLANTE": "Perifericos",
    "BOCINA": "Perifericos",
    "ALTAVOZ": "Perifericos",
    "SPEAKER": "Perifericos",
    
    # Redes
    "ROUTER": "Redes",
    "SWITCH": "Redes",
    "ACCESS POINT": "Redes",
    "WIFI": "Redes",
    "ETHERNET": "Redes",
    "CABLE DE RED": "Redes",
    "CABLE UTP": "Redes",
    "PATCH": "Redes",
    "MODEN": "Redes",
    "MODEM": "Redes",
    
    # Almacenamiento
    "PENDRIVE": "Almacenamiento",
    "USB ": "Almacenamiento",
    "MEMORIA USB": "Almacenamiento",
    "DISCO EXTERNO": "Almacenamiento",
    "DISCO DURO": "Almacenamiento",
    "MEMORIA SD": "Almacenamiento",
    "MICRO SD": "Almacenamiento",
    "CF CARD": "Almacenamiento",
    "FLASH": "Almacenamiento",
    "NAS ": "Almacenamiento",
    
    # Adaptadores/Cables
    "ADAPTADOR": "Adaptadores y Cables",
    "CARGADOR": "Adaptadores y Cables",
    "CABLE": "Adaptadores y Cables",
    "CONVERTIDOR": "Adaptadores y Cables",
    "CONVERSOR": "Adaptadores y Cables",
    "HUB ": "Adaptadores y Cables",
    "DOCK": "Adaptadores y Cables",
    "EXPANSION": "Adaptadores y Cables",
    "EXTENSION": "Adaptadores y Cables",
    "REGULADOR": "Adaptadores y Cables",
    "PROTECTOR": "Adaptadores y Cables",
    "UPS": "Adaptadores y Cables",
    
    # Gaming
    "GAMER": "Gaming",
    "GAMING": "Gaming",
    "JOYSTICK": "Gaming",
    "MANDO": "Gaming",
    "CONTROL ": "Gaming",
    "GAMEPAD": "Gaming",
    "CONSOLA": "Gaming",
    
    # Software
    "WINDOWS": "Software",
    "OFFICE": "Software",
    "ANTIVIRUS": "Software",
    "LICENCIA": "Software",
    "SOFTWARE": "Software",
    
    # Moviles
    "CELULAR": "Moviles",
    "CELULARES": "Moviles",
    "SMARTPHONE": "Moviles",
    "TABLET": "Moviles",
    "IPAD": "Moviles",
    "FUNDAS": "Moviles",
    "ACCESORIOS CELULAR": "Moviles",
    
    # Furniture
    "SILLA": "Mobiliario",
    "ESCRITORIO": "Mobiliario",
    "MESA": "Mobiliario",
    "ESTANTE": "Mobiliario",
    "ARCHIVADOR": "Mobiliario",
}

# Brand extraction from product name
KNOWN_BRANDS = [
    "HP", "DELL", "LENOVO", "ASUS", "ACER", "MSI", "SAMSUNG", "LG",
    "SONY", "BROTHER", "EPSON", "CANON", "XEROX", "KYOCERA",
    "KINGSTON", "SANDISK", "WD", "WESTERN DIGITAL", "SEAGATE",
    "LOGITECH", "RAZER", "HYPERX", "CORSAIR", "NOBLECHAIRS",
    "INTEL", "AMD", "NVIDIA", "NVIDIA", "RTX", "GTX",
    "TP-LINK", "CISCO", "UBIQUITI", "HUAWEI", "XIAOMI",
    "APPLE", "MICROSOFT", "GOOGLE", "HONOR", "REALME",
    "TOSHIBA", "PANASONIC", "PHILIPS", "VIEWSONIC", "AOC",
    "BLUESKY", "GENIUS", "THERMALTAKE", "COOLER MASTER",
    "GIGABYTE", "ASROCK", "EVGA", "ZOTAC",
    "APC", "FORZA", "POWERLAND", "ULTRA",
    "PNY", "TEAMGROUP", "CRUCIAL", "ADATA", "TRANSCEND",
    "ESET", "NORTON", "KASPERSKY", "MCAFEE",
]

def extract_brand(product_name):
    """Extract brand from product name"""
    name_upper = product_name.upper()
    
    # Try to find known brand in the name
    for brand in KNOWN_BRANDS:
        # Check if brand appears as a word (with word boundaries)
        pattern = r'\b' + re.escape(brand) + r'\b'
        if re.search(pattern, name_upper):
            # Normalize common variations
            brand_map = {
                "RTX": "NVIDIA",
                "GTX": "NVIDIA",
                "WD": "Western Digital",
                "TP-LINK": "TP-Link",
            }
            return brand_map.get(brand, brand.title())
    
    # Try to extract brand from first word(s) if it looks like a brand
    words = product_name.split()
    if len(words) >= 2:
        first_word = words[0].upper()
        # If first word is all caps and not a common non-brand word
        non_brand_first = ["PARA", "DE", "CON", "USB", "HDMI", "VGA", "TYPE", "LED", "LCD", "3D"]
        if first_word.isupper() and len(first_word) >= 2 and first_word not in non_brand_first:
            # Check if it's followed by a model-like word
            if len(words) >= 2:
                return words[0].title()
    
    return None

def categorize_product(name):
    """Categorize a product based on its name"""
    name_upper = name.upper()
    
    for keyword, category in CATEGORY_KEYWORDS.items():
        if keyword in name_upper:
            return category
    
    # Default category
    return "Otros"

def get_or_create_category(conn, name):
    """Get or create a category and return its ID"""
    cur = conn.cursor()
    slug = slugify(name)
    
    cur.execute("SELECT id FROM categories WHERE slug = ?", (slug,))
    row = cur.fetchone()
    if row:
        return row[0]
    
    cat_id = cuid()
    cur.execute(
        "INSERT INTO categories (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (cat_id, name, slug, datetime.now().isoformat(), datetime.now().isoformat())
    )
    conn.commit()
    print(f"  Created category: {name}")
    return cat_id

def get_or_create_brand(conn, name):
    """Get or create a brand and return its ID"""
    if not name:
        return None
    
    cur = conn.cursor()
    slug = slugify(name)
    
    cur.execute("SELECT id FROM brands WHERE slug = ?", (slug,))
    row = cur.fetchone()
    if row:
        return row[0]
    
    brand_id = cuid()
    cur.execute(
        "INSERT INTO brands (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (brand_id, name, slug, datetime.now().isoformat(), datetime.now().isoformat())
    )
    conn.commit()
    print(f"  Created brand: {name}")
    return brand_id

def product_exists(conn, name):
    """Check if product with same name already exists"""
    cur = conn.cursor()
    cur.execute("SELECT id FROM products WHERE name = ?", (name,))
    return cur.fetchone() is not None

def unique_slug(conn, base_slug):
    """Generate a unique slug by appending a number if needed"""
    cur = conn.cursor()
    slug = base_slug
    counter = 1
    while True:
        cur.execute("SELECT id FROM products WHERE slug = ?", (slug,))
        if not cur.fetchone():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1

def insert_product(conn, name, price, category_name, brand_name=None, stock=0, 
                   stock_min=0, stock_max=10, image=None, description=None):
    """Insert a product into Prisma DB"""
    if product_exists(conn, name):
        return None  # Skip duplicates
    
    category_id = get_or_create_category(conn, category_name)
    brand_id = get_or_create_brand(conn, brand_name) if brand_name else None
    
    product_id = cuid()
    slug = unique_slug(conn, slugify(name))
    now = datetime.now().isoformat()
    
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO products (
            id, name, slug, description, category_id, brand_id, supplier_id,
            price, sale_price, sale_ends_at, stock, stock_minimo, stock_maximo,
            sku, images, specs_json, status, is_new, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    """, (
        product_id, name, slug, description,
        category_id, brand_id, None,  # supplier_id = null
        float(price), None, None,  # price, sale_price, sale_ends_at
        stock, stock_min, stock_max,
        None,  # sku
        f'["{image}"]' if image else None,  # images as JSON
        None,  # specs_json
        "ACTIVO", True,  # status = ACTIVO, is_new = 1
    ))
    conn.commit()
    return product_id

def backup_database():
    """Create backup of Prisma database"""
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(BACKUP_DIR, f"dev_backup_{timestamp}.db")
    shutil.copy2(PRISMA_DB, backup_path)
    print(f"Backup created: {backup_path}")
    return backup_path

def migrate_main_db_products(conn):
    """Migrate products from server/database.sqlite to Prisma DB"""
    print("\n=== MIGRATING FROM MAIN DATABASE ===")
    
    main_conn = sqlite3.connect(MAIN_DB)
    main_cur = main_conn.cursor()
    main_cur.execute("SELECT id, name, price, category, image, stock, description, minStock FROM products")
    rows = main_cur.fetchall()
    main_conn.close()
    
    migrated = 0
    skipped = 0
    
    for row in rows:
        old_id, name, price, category, image, stock, description, min_stock = row
        
        # Map old categories to new ones
        category_map = {
            "Laptops": "Laptops",
            "Components": "Componentes",
            "Gaming": "Gaming",
            "Furniture": "Mobiliario",
            "Printers": "Impresoras",
        }
        new_category = category_map.get(category, categorize_product(name))
        
        # Extract brand from name
        brand = extract_brand(name) if name else None
        
        # Determine stock max based on category
        stock_max = 20 if "Laptop" in new_category or "Computador" in new_category else 10
        
        result = insert_product(
            conn, name, price, new_category, brand,
            stock=stock or 0,
            stock_min=min_stock or 0,
            stock_max=stock_max,
            image=image,
            description=description
        )
        
        if result:
            migrated += 1
            print(f"  Migrated: {name} -> {new_category} (brand: {brand})")
        else:
            skipped += 1
            print(f"  Skipped (duplicate): {name}")
    
    print(f"\nMigrated: {migrated}, Skipped: {skipped}")
    return migrated

def import_excel_products(conn):
    """Import all products from LISTADO.xlsx"""
    print("\n=== IMPORTING FROM LISTADO.xlsx ===")
    
    wb = openpyxl.load_workbook(EXCEL_FILE)
    ws = wb.active
    
    imported = 0
    skipped = 0
    errors = 0
    
    for row_num, row in enumerate(ws.iter_rows(min_row=3, values_only=True), start=3):
        name, price = row
        
        # Skip empty rows
        if not name or not str(name).strip():
            continue
        
        name = str(name).strip()
        
        # Skip if no price
        if price is None:
            # print(f"  No price, skipping: {name}")
            skipped += 1
            continue
        
        try:
            price = float(price)
        except (ValueError, TypeError):
            errors += 1
            continue
        
        # Categorize
        category = categorize_product(name)
        
        # Extract brand
        brand = extract_brand(name)
        
        # Determine stock limits based on category
        if any(x in category for x in ["Laptop", "Computador", "Gaming"]):
            stock_max = 15
        elif any(x in category for x in ["Monitores", "Impresoras"]):
            stock_max = 10
        elif any(x in category for x in ["Componentes", "Perifericos"]):
            stock_max = 25
        else:
            stock_max = 10
        
        result = insert_product(
            conn, name, price, category, brand,
            stock=0,
            stock_min=0,
            stock_max=stock_max
        )
        
        if result:
            imported += 1
            if imported % 100 == 0:
                print(f"  Progress: {imported} products imported...")
        else:
            skipped += 1
    
    print(f"\nImported: {imported}, Skipped (duplicates): {skipped}, Errors: {errors}")
    return imported

def print_summary(conn):
    """Print final summary"""
    cur = conn.cursor()
    
    print("\n" + "="*60)
    print("CONSOLIDATION SUMMARY")
    print("="*60)
    
    # Count products
    cur.execute("SELECT COUNT(*) FROM products")
    total = cur.fetchone()[0]
    print(f"\nTotal products: {total}")
    
    # Count by category
    print("\nProducts by category:")
    cur.execute("""
        SELECT c.name, COUNT(p.id) as cnt 
        FROM categories c 
        LEFT JOIN products p ON p.category_id = c.id 
        GROUP BY c.name 
        ORDER BY cnt DESC
    """)
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]}")
    
    # Count brands
    cur.execute("SELECT COUNT(*) FROM brands")
    brand_count = cur.fetchone()[0]
    print(f"\nTotal brands: {brand_count}")
    
    # Count categories
    cur.execute("SELECT COUNT(*) FROM categories")
    cat_count = cur.fetchone()[0]
    print(f"Total categories: {cat_count}")
    
    # Products with stock min/max
    cur.execute("SELECT COUNT(*) FROM products WHERE stock_minimo > 0 OR stock_maximo > 10")
    with_limits = cur.fetchone()[0]
    print(f"\nProducts with custom stock limits: {with_limits}")
    
    print("\n" + "="*60)

def main():
    print("="*60)
    print("CONSOLIDATING DATABASES TO PRISMA")
    print("="*60)
    
    # Step 1: Backup
    print("\nStep 1: Creating backup...")
    backup_database()
    
    # Step 2: Connect to Prisma DB
    conn = sqlite3.connect(PRISMA_DB)
    
    # Step 3: Migrate from main DB
    print("\nStep 2: Migrating products from main database...")
    migrated = migrate_main_db_products(conn)
    
    # Step 4: Import from Excel
    print("\nStep 3: Importing products from LISTADO.xlsx...")
    imported = import_excel_products(conn)
    
    # Step 5: Print summary
    print_summary(conn)
    
    conn.close()
    
    print("\nDONE! All databases consolidated into Prisma.")
    print(f"Database file: {PRISMA_DB}")

if __name__ == "__main__":
    main()
