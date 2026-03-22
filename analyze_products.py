#!/usr/bin/env python3
"""
Análisis de productos importados en SQLite
"""
import sqlite3
import json
import statistics
from collections import Counter
import re

DB_PATH = 'server/database.sqlite'

def analyze():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("=" * 70)
    print("ANÁLISIS DE PRODUCTOS EN BASE DE DATOS")
    print("=" * 70)
    
    # 1. Estadísticas básicas
    cursor.execute("SELECT COUNT(*) FROM products")
    total = cursor.fetchone()[0]
    print(f"\n1. ESTADÍSTICAS BÁSICAS")
    print(f"   Total de productos: {total}")
    
    cursor.execute("SELECT COUNT(DISTINCT category) FROM products")
    categories = cursor.fetchone()[0]
    print(f"   Categorías únicas: {categories}")
    
    cursor.execute("SELECT COUNT(*) FROM products WHERE specs != ''")
    with_specs = cursor.fetchone()[0]
    print(f"   Productos con specs (marca/categoría original): {with_specs}")
    
    cursor.execute("SELECT COUNT(*) FROM products WHERE image != ''")
    with_image = cursor.fetchone()[0]
    print(f"   Productos con imagen: {with_image} ({with_image/total*100:.1f}%)")
    
    cursor.execute("SELECT COUNT(*) FROM products WHERE featured = 1")
    featured = cursor.fetchone()[0]
    print(f"   Productos destacados: {featured}")
    
    cursor.execute("SELECT COUNT(*) FROM products WHERE description != ''")
    with_description = cursor.fetchone()[0]
    print(f"   Productos con descripción: {with_description} ({with_description/total*100:.1f}%)")
    
    # 2. Análisis de precios
    cursor.execute("SELECT price FROM products WHERE price > 0")
    prices = [row[0] for row in cursor.fetchall()]
    if prices:
        print(f"\n2. ANÁLISIS DE PRECIOS (solo productos con precio > 0)")
        print(f"   Productos con precio > 0: {len(prices)}")
        print(f"   Precio mínimo: ${min(prices):,}")
        print(f"   Precio máximo: ${max(prices):,}")
        print(f"   Precio promedio: ${statistics.mean(prices):,.0f}")
        print(f"   Precio mediana: ${statistics.median(prices):,.0f}")
        print(f"   Desviación estándar: ${statistics.stdev(prices):,.0f}" if len(prices) > 1 else "   Desviación estándar: N/A")
        
        # Rangos de precios
        ranges = [(0, 10000), (10000, 50000), (50000, 100000), (100000, 500000), (500000, 1000000), (1000000, float('inf'))]
        range_labels = ['<$10k', '$10k-$50k', '$50k-$100k', '$100k-$500k', '$500k-$1M', '>$1M']
        print(f"\n   Distribución por rangos de precio:")
        for i, (low, high) in enumerate(ranges):
            count = len([p for p in prices if low <= p < high])
            print(f"     {range_labels[i]}: {count} productos ({count/len(prices)*100:.1f}%)")
    
    # 3. Distribución por categorías
    cursor.execute("""
        SELECT category, COUNT(*) as cnt 
        FROM products 
        GROUP BY category 
        ORDER BY cnt DESC
    """)
    categories_list = cursor.fetchall()
    print(f"\n3. DISTRIBUCIÓN POR CATEGORÍAS (top 20)")
    for cat, cnt in categories_list[:20]:
        print(f"   {cat}: {cnt} productos")
    
    # 4. Análisis de marcas (extraídas de specs)
    cursor.execute("SELECT specs FROM products WHERE specs != ''")
    specs_data = cursor.fetchall()
    brands = []
    for spec_row in specs_data:
        try:
            spec = json.loads(spec_row[0])
            if 'marca' in spec and spec['marca']:
                brands.append(spec['marca'])
        except:
            pass
    
    if brands:
        brand_counts = Counter(brands)
        print(f"\n4. DISTRIBUCIÓN POR MARCAS (top 20)")
        for brand, cnt in brand_counts.most_common(20):
            print(f"   {brand}: {cnt} productos")
        print(f"\n   Total marcas únicas: {len(brand_counts)}")
    
    # 5. Productos con stock bajo (minStock > stock)
    cursor.execute("SELECT COUNT(*) FROM products WHERE stock < minStock")
    low_stock = cursor.fetchone()[0]
    print(f"\n5. GESTIÓN DE INVENTARIO")
    print(f"   Productos con stock bajo (stock < minStock): {low_stock}")
    
    cursor.execute("SELECT COUNT(*) FROM products WHERE stock = 0")
    no_stock = cursor.fetchone()[0]
    print(f"   Productos sin stock: {no_stock}")
    
    cursor.execute("SELECT COUNT(*) FROM products WHERE stock > 0")
    in_stock = cursor.fetchone()[0]
    print(f"   Productos en stock: {in_stock}")
    
    # 6. Longitud de descripciones
    cursor.execute("SELECT description FROM products WHERE description != ''")
    descriptions = cursor.fetchall()
    if descriptions:
        desc_lengths = [len(desc[0]) for desc in descriptions]
        print(f"\n6. ANÁLISIS DE DESCRIPCIONES")
        print(f"   Productos con descripción: {len(descriptions)}")
        print(f"   Longitud promedio: {statistics.mean(desc_lengths):.0f} caracteres")
        print(f"   Longitud mínima: {min(desc_lengths)} caracteres")
        print(f"   Longitud máxima: {max(desc_lengths)} caracteres")
    
    # 7. Productos sin imagen
    cursor.execute("SELECT name FROM products WHERE image = '' LIMIT 10")
    no_image = cursor.fetchall()
    if no_image:
        print(f"\n7. PRODUCTOS SIN IMAGEN (muestra de 10)")
        for name in no_image:
            print(f"   - {name[0][:60]}")
    
    # 8. Categorías originales (de specs)
    original_categories = []
    for spec_row in specs_data:
        try:
            spec = json.loads(spec_row[0])
            if 'categoria_original' in spec and spec['categoria_original']:
                original_categories.append(spec['categoria_original'])
        except:
            pass
    
    if original_categories:
        orig_cat_counts = Counter(original_categories)
        print(f"\n8. CATEGORÍAS ORIGINALES DEL JSON (top 10)")
        for cat, cnt in orig_cat_counts.most_common(10):
            print(f"   {cat}: {cnt} productos")
    
    # 9. Productos con supplierEmail
    cursor.execute("SELECT COUNT(*) FROM products WHERE supplierEmail != ''")
    with_supplier = cursor.fetchone()[0]
    print(f"\n9. PROVEEDORES")
    print(f"   Productos con email de proveedor: {with_supplier}")
    
    conn.close()
    
    print(f"\n{'='*70}")
    print("FIN DEL ANÁLISIS")
    print(f"{'='*70}")

if __name__ == "__main__":
    analyze()