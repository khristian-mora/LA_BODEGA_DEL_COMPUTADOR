#!/usr/bin/env python3
"""
Migrar productos de SQLite a MySQL (cuando esté disponible)
Usa las credenciales por defecto del proyecto: root/password/localhost/la_bodega
"""
import sqlite3
import mysql.connector
import json
import sys

# Configuración MySQL
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'password',
    'database': 'la_bodega',
    'port': 3306
}

SQLITE_DB = 'server/database.sqlite'

def migrate():
    """Migrar productos de SQLite a MySQL"""
    print("Migrando productos de SQLite a MySQL...")
    
    # Conectar a SQLite
    try:
        sqlite_conn = sqlite3.connect(SQLITE_DB)
        sqlite_cursor = sqlite_conn.cursor()
        print("Conectado a SQLite")
    except Exception as e:
        print(f"Error conectando a SQLite: {e}")
        return
    
    # Conectar a MySQL
    try:
        mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)
        mysql_cursor = mysql_conn.cursor()
        print("Conectado a MySQL")
    except Exception as e:
        print(f"Error conectando a MySQL: {e}")
        print("Asegúrate de que MySQL esté corriendo en localhost:3306")
        print("Credenciales: root/password, base de datos: la_bodega")
        sqlite_conn.close()
        return
    
    # Obtener productos de SQLite
    sqlite_cursor.execute("SELECT * FROM products")
    products = sqlite_cursor.fetchall()
    print(f"Productos encontrados en SQLite: {len(products)}")
    
    # Obtener nombres de columnas de SQLite
    sqlite_cursor.execute("PRAGMA table_info(products)")
    columns_info = sqlite_cursor.fetchall()
    column_names = [col[1] for col in columns_info]
    
    # Preparar inserción en MySQL
    # Asumimos que la tabla products en MySQL tiene las mismas columnas
    # (id autoincrement, name, slug, price, category, image, stock, minStock, supplierEmail, description, featured, specs)
    
    inserted = 0
    skipped = 0
    errors = 0
    
    for product in products:
        try:
            # Crear diccionario con datos del producto
            product_dict = {}
            for idx, col in enumerate(column_names):
                product_dict[col] = product[idx]
            
            # Verificar si el producto ya existe en MySQL por nombre
            mysql_cursor.execute("SELECT id FROM products WHERE name = %s", (product_dict['name'],))
            if mysql_cursor.fetchone():
                skipped += 1
                continue
            
            # Insertar en MySQL
            mysql_cursor.execute("""
                INSERT INTO products (name, slug, price, category, image, stock, minStock, supplierEmail, description, featured, specs)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                product_dict['name'],
                product_dict['slug'],
                product_dict['price'],
                product_dict['category'],
                product_dict['image'],
                product_dict['stock'],
                product_dict['minStock'],
                product_dict['supplierEmail'],
                product_dict['description'],
                product_dict['featured'],
                product_dict['specs']
            ))
            
            inserted += 1
            
            if inserted % 100 == 0:
                print(f"  Migrados: {inserted} productos...")
                
        except Exception as e:
            errors += 1
            print(f"  Error migrando producto {product_dict.get('name', 'desconocido')}: {e}")
            continue
    
    # Commit y cerrar
    mysql_conn.commit()
    sqlite_conn.close()
    mysql_conn.close()
    
    # Resumen
    print(f"\n{'='*60}")
    print(f"RESUMEN DE MIGRACION")
    print(f"{'='*60}")
    print(f"Productos migrados: {inserted}")
    print(f"Productos omitidos (duplicados): {skipped}")
    print(f"Errores: {errors}")
    print(f"Total en SQLite: {len(products)}")
    
    if inserted > 0:
        print(f"\nMigracion completada exitosamente!")
        print(f"Los productos están ahora en la base de datos MySQL (la_bodega).")

if __name__ == "__main__":
    # Preguntar confirmación
    print("Este script migrará productos de SQLite a MySQL.")
    print(f"MySQL config: {MYSQL_CONFIG}")
    response = input("\n¿Deseas continuar? (s/n): ").strip().lower()
    if response == 's':
        migrate()
    else:
        print("Migración cancelada.")