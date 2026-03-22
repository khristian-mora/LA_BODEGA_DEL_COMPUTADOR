# Product Import & Categorization - Migration Guide

## Overview
This document summarizes the product data import and categorization improvements, and provides instructions for migrating from SQLite to MySQL.

## Current Status

### SQLite Database (`server/database.sqlite`)
- **Total Products**: 1971
- **Categories**: 52 unique categories with hierarchical structure
- **Brands**: 31+ brands identified
- **Categorization**: 93.5% of products properly categorized (only 6.5% in "OTROS")

### Category Improvements Made
- Reduced "OTROS" products from 738 (37.4%) to 129 (6.5%) — **82.5% reduction**
- Created 26 new subcategories for better organization
- Established proper parent-child category hierarchy

## New Categories Added

### Parent Categories with Subcategories
| Parent | Subcategories |
|--------|--------------|
| CABLES | USB, HDMI, RED, VGA, SATA, DISPLAY, EXTENSIONES |
| ADAPTADORES | CARGADORES, MULTIPUERTO, CONVERTIDORES, OTG |
| PERIFERICOS | GAMER, LECTORES, COMBOS |
| AUDIO | PARLANTES, AURICULARES |
| DISCOS DUROS | ENCLOSURES, EXTERNOS |
| CONSUMIBLES | TINTAS, PAPEL |
| MUEBLES | BASES, VENTILADORES, ACCESORIOS |
| REDES | SWITCH, ROUTER, BLUETOOTH |
| ENERGIA | ESTABILIZADORES, BANCOS DE CARGA |
| ACCESORIOS | FUNDAS, LIMPIEZA, THERMAL, VARIOS |

### Standalone Categories
MOUSE, TECLADOS, IMPRESORAS, MONITORES, SMART HOME, GABINETES, FUENTES DE PODER, UPS, PLACAS BASE, LAPTOPS, ESCANERS, SEGURIDAD, PROCESADORES, TABLETS, MEMORIAS RAM, BATERIAS, OTROS

## MySQL Migration Steps

### Prerequisites
1. MySQL service must be running on localhost:3306
2. Database credentials: root/password (as per .env)

### Step 1: Run Prisma Migrations
```bash
cd la-bodega
npx prisma migrate dev --name add-categories
```

### Step 2: Seed Categories
```bash
npm run seed:categories
```

This will populate the categories table with the hierarchical structure defined in `prisma/seed-categories.ts`.

### Step 3: Verify Categories
```bash
npm run verify:categories
```

### Step 4: Migrate Products from SQLite
```bash
npm run migrate:sqlite
```

This script:
- Reads all products from SQLite
- Maps categories using the new hierarchical structure
- Creates brands as needed
- Migrates products to MySQL with proper foreign keys

## Files Created

### Database Scripts
- `import_json_to_sqlite.py` - Import JSON to SQLite
- `recategorize.py` - Keyword-based recategorization
- `analyze_products.py` - Product data analysis
- `verify_import.py` - Import verification

### Prisma Scripts (MySQL)
- `prisma/seed-categories.ts` - Category seeding
- `prisma/verify-categories.ts` - Category verification
- `prisma/migrate-from-sqlite.ts` - SQLite to MySQL migration

### Documentation
- `reporte_categorizacion.md` - Detailed categorization report
- `MIGRATION_GUIDE.md` - This file

## Remaining Tasks

1. **Manual Review**: 129 products still in "OTROS" - review and categorize manually
2. **Image Updates**: 33.3% products missing images
3. **Description Updates**: 78.3% products missing descriptions
4. **Inventory Sync**: All products have stock=0 (need to update from physical inventory)
5. **Brand Data**: 78.3% products have generic brand - consider adding specific brands

## Notes
- The SQLite database serves as a backup and staging area
- All product slugs are unique and URL-friendly
- Specs JSON preserves original category and brand information
- The system supports hierarchical categories (parent-child relationships)
