#!/usr/bin/env python3
"""
Importar productos del JSON a SQLite (server/database.sqlite)
"""
import sqlite3
import json
import re
import hashlib
import os
from datetime import datetime

# Rutas
JSON_FILE = 'productos_enriquecidos_v3_FINAL.json'
SQLITE_DB = 'server/database.sqlite'

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

def parse_price(price_str):
    """Convert price string to integer, default 0"""
    if not price_str:
        return 0
    # Eliminar caracteres no numéricos excepto punto y coma
    price_str = str(price_str).strip()
    if not price_str:
        return 0
    # Reemplazar coma por punto para decimales
    price_str = price_str.replace(',', '.')
    # Eliminar símbolos de moneda y espacios
    price_str = re.sub(r'[^\d.]', '', price_str)
    if not price_str:
        return 0
    try:
        # Convertir a float y luego a int (redondear)
        return int(round(float(price_str)))
    except:
        return 0

def generate_unique_slug(cursor, name, base_slug):
    """Generate a unique slug for the product"""
    slug = base_slug
    counter = 1
    while True:
        cursor.execute("SELECT id FROM products WHERE slug = ?", (slug,))
        if not cursor.fetchone():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1

def import_products():
    """Import products from JSON to SQLite"""
    print(f"Importando productos de {JSON_FILE} a {SQLITE_DB}")
    
    # Cargar JSON
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            products = json.load(f)
        print(f"JSON cargado: {len(products)} productos encontrados")
    except Exception as e:
        print(f"Error cargando JSON: {e}")
        return
    
    # Conectar a SQLite
    try:
        conn = sqlite3.connect(SQLITE_DB)
        cursor = conn.cursor()
        print(f"Conectado a SQLite: {SQLITE_DB}")
    except Exception as e:
        print(f"Error conectando a SQLite: {e}")
        return
    
    # Agregar columna slug si no existe
    cursor.execute("PRAGMA table_info(products)")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]
    if 'slug' not in column_names:
        try:
            cursor.execute("ALTER TABLE products ADD COLUMN slug TEXT")
            conn.commit()
            print("Columna 'slug' agregada a la tabla products")
        except Exception as e:
            print(f"Error agregando columna slug: {e}")
            conn.close()
            return
    
    # Verificar estructura de tabla products
    cursor.execute("PRAGMA table_info(products)")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]
    print(f"Estructura de tabla products: {column_names}")
    
    # Contar productos existentes
    cursor.execute("SELECT COUNT(*) FROM products")
    existing_count = cursor.fetchone()[0]
    print(f"Productos existentes en la base de datos: {existing_count}")
    
    # Preguntar si limpiar tabla
    if existing_count > 0:
        print("\nYa hay productos en la base de datos.")
        print("Opciones:")
        print("1. Agregar nuevos productos (ignorar duplicados por nombre)")
        print("2. Reemplazar todos los productos (eliminar existentes)")
        print("3. Cancelar")
        
        # Automáticamente reemplazar productos existentes
        choice = '2'
        if choice == '2':
            cursor.execute("DELETE FROM products")
            conn.commit()
            print("Productos existentes eliminados")
        elif choice == '3':
            print("Importación cancelada")
            conn.close()
            return
        elif choice != '1':
            print("Opción no válida. Cancelando.")
            conn.close()
            return
    
    # Importar productos
    imported = 0
    skipped = 0
    errors = 0
    
    for i, product in enumerate(products):
        try:
            nombre = product.get('nombre', '').strip()
            if not nombre:
                skipped += 1
                continue
            
            # Verificar si el producto ya existe
            cursor.execute("SELECT id FROM products WHERE name = ?", (nombre,))
            if cursor.fetchone():
                skipped += 1
                continue
            
            # Extraer datos
            precio = parse_price(product.get('precio', 0))
            marca = product.get('marca', '')
            categoria = product.get('categoria', '')
            descripcion = product.get('descripcion', '')
            imagenes = product.get('imagenes', [])
            
            # Tomar primera imagen
            image_url = ''
            if imagenes and isinstance(imagenes, list) and len(imagenes) > 0:
                image_url = imagenes[0].get('url', '')
            
            # Generar slug
            base_slug = slugify(nombre)
            if not base_slug:
                base_slug = f"producto-{i+1}"
            slug = generate_unique_slug(cursor, nombre, base_slug)
            
            # Preparar specs con marca y categoría
            import json as json_module
            specs_data = {}
            if marca:
                specs_data['marca'] = marca
            if categoria:
                specs_data['categoria_original'] = categoria
            specs_json = json_module.dumps(specs_data) if specs_data else ''
            
            # Insertar producto
            cursor.execute("""
                INSERT INTO products (
                    name, slug, price, category, image, stock, minStock, 
                    supplierEmail, description, featured, specs
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                nombre,
                slug,
                precio,
                categoria,
                image_url,
                0,  # stock por defecto
                2,  # minStock por defecto
                '',  # supplierEmail
                descripcion,
                0,  # featured por defecto
                specs_json
            ))
            
            imported += 1
            
            # Mostrar progreso cada 100 productos
            if imported % 100 == 0:
                print(f"  Procesados: {imported} productos importados...")
                
        except Exception as e:
            errors += 1
            print(f"  Error en producto {i+1} ({product.get('nombre', 'sin nombre')}): {e}")
            continue
    
    # Commit y cerrar
    conn.commit()
    conn.close()
    
    # Resumen
    print(f"\n{'='*60}")
    print(f"RESUMEN DE IMPORTACION")
    print(f"{'='*60}")
    print(f"Productos importados: {imported}")
    print(f"Productos omitidos: {skipped}")
    print(f"Errores: {errors}")
    print(f"Total en JSON: {len(products)}")
    
    if imported > 0:
        print(f"\nImportacion completada exitosamente!")
        print(f"Los productos están ahora en la base de datos SQLite.")
        print(f"Cada producto tiene:")
        print(f"   - Nombre y slug único")
        print(f"   - Precio original")
        print(f"   - Categoría del JSON")
        print(f"   - Imagen principal (primera del array)")
        print(f"   - Marca y categoría original en specs (JSON)")

if __name__ == "__main__":
    import_products()