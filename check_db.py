import sqlite3
import sys

db_path = r'C:\Users\Usuario\Desktop\desarollo\LBDC\server\database.sqlite'
try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print('Tablas en la base de datos:')
    for table in tables:
        print(f'  {table[0]}')
    
    # Check categories table
    print('\n=== Categorias ===')
    try:
        cursor.execute('SELECT * FROM categories')
        rows = cursor.fetchall()
        if rows:
            # Get column names
            cursor.execute('PRAGMA table_info(categories)')
            cols = cursor.fetchall()
            col_names = [col[1] for col in cols]
            print('Columnas:', col_names)
            print(f'Total categorías: {len(rows)}')
            for row in rows[:10]:
                print(row)
        else:
            print('No hay categorías')
    except Exception as e:
        print(f'Error: {e}')
    
    # Check products table structure
    print('\n=== Estructura de products ===')
    try:
        cursor.execute('PRAGMA table_info(products)')
        cols = cursor.fetchall()
        for col in cols:
            print(f'  {col[1]} ({col[2]})')
    except Exception as e:
        print(f'Error: {e}')
    
    # Count products
    print('\n=== Conteo de productos ===')
    try:
        cursor.execute('SELECT COUNT(*) FROM products')
        count = cursor.fetchone()[0]
        print(f'Total productos: {count}')
    except Exception as e:
        print(f'Error: {e}')
    
    conn.close()
except Exception as e:
    print(f'Error de conexión: {e}')