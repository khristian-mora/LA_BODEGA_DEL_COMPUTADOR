#!/usr/bin/env python3
"""
Probar conexión a MySQL con credenciales por defecto
"""
import mysql.connector
from mysql.connector import Error

def test_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='password',
            database='la_bodega'
        )
        
        if connection.is_connected():
            print('✅ Conexión exitosa a MySQL')
            db_info = connection.get_server_info()
            print(f'Versión del servidor MySQL: {db_info}')
            
            cursor = connection.cursor()
            cursor.execute("SELECT DATABASE();")
            record = cursor.fetchone()
            print(f'Base de datos actual: {record[0]}')
            
            # Listar tablas
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
            print('\nTablas en la base de datos:')
            for table in tables:
                print(f'  {table[0]}')
                
            # Ver estructura de tabla products si existe
            try:
                cursor.execute("DESCRIBE products;")
                columns = cursor.fetchall()
                print('\nEstructura de tabla products:')
                for col in columns:
                    print(f'  {col[0]} | {col[1]} | {col[2]} | {col[3]} | {col[4]} | {col[5]}')
            except Error as e:
                print(f'\nTabla products no existe: {e}')
                
            cursor.close()
            connection.close()
            print('\n✅ Conexión cerrada')
            
    except Error as e:
        print(f'❌ Error conectando a MySQL: {e}')
        print('\nPosibles soluciones:')
        print('1. Asegúrate de que MySQL está corriendo')
        print('2. Verifica que la base de datos "la_bodega" existe')
        print('3. Credenciales: host=localhost, user=root, password=password')
        print('4. Si usas XAMPP, el usuario es "root" sin contraseña')
        
        # Intentar sin base de datos
        try:
            connection = mysql.connector.connect(
                host='localhost',
                user='root',
                password='password'
            )
            if connection.is_connected():
                print('\n⚠️  Conexión sin base de datos exitosa. Creando base de datos...')
                cursor = connection.cursor()
                cursor.execute("CREATE DATABASE IF NOT EXISTS la_bodega;")
                print('✅ Base de datos "la_bodega" creada')
                cursor.close()
                connection.close()
        except Error as e2:
            print(f'❌ Error sin base de datos: {e2}')

if __name__ == "__main__":
    test_connection()