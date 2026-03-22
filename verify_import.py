#!/usr/bin/env python3
"""
Verificar productos importados en SQLite
"""
import sqlite3
import json

DB_PATH = 'server/database.sqlite'

def verify():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Total productos
    cursor.execute("SELECT COUNT(*) FROM products")
    total = cursor.fetchone()[0]
    print(f"Total productos en base de datos: {total}")
    
    # Mostrar algunos productos
    cursor.execute("SELECT id, name, price, category, slug FROM products LIMIT 10")
    products = cursor.fetchall()
    print("\nPrimeros 10 productos:")
    for p in products:
        print(f"  ID: {p[0]}, Name: {p[1][:50]}, Price: {p[2]}, Category: {p[3][:20]}, Slug: {p[4][:20]}")
    
    # Estadísticas por categoría
    cursor.execute("SELECT category, COUNT(*) as cnt FROM products GROUP BY category ORDER BY cnt DESC LIMIT 10")
    categories = cursor.fetchall()
    print("\nTop 10 categorías:")
    for cat in categories:
        print(f"  {cat[0]}: {cat[1]} productos")
    
    # Productos con precio 0
    cursor.execute("SELECT COUNT(*) FROM products WHERE price = 0")
    zero_price = cursor.fetchone()[0]
    print(f"\nProductos con precio 0: {zero_price}")
    
    # Verificar specs (marca y categoría original)
    cursor.execute("SELECT specs FROM products WHERE specs != '' LIMIT 5")
    specs = cursor.fetchall()
    print("\nEjemplos de specs:")
    for spec in specs:
        try:
            spec_data = json.loads(spec[0])
            print(f"  {spec_data}")
        except:
            print(f"  Specs inválidos: {spec[0][:50]}")
    
    conn.close()

if __name__ == "__main__":
    verify()