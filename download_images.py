#!/usr/bin/env python3
"""
Descargar imagenes externas de productos y actualizar la base de datos SQLite.
Guarda las imagenes en server/uploads/ y actualiza la columna 'image' con la ruta local.
"""
import sqlite3
import requests
import os
import sys
import time
import re
from urllib.parse import urlparse
import threading

# ============ CONFIGURACION ============
DB_PATH = 'server/database.sqlite'
UPLOADS_DIR = os.path.join('server', 'uploads')
MAX_WORKERS = 3
TIMEOUT = 20
RETRY_COUNT = 2

# Headers para evitar bloqueos
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
}

# Cache de conexiones por thread
_local = threading.local()

def get_db_connection():
    """Obtiene una conexion SQLite para el thread actual"""
    if not hasattr(_local, 'conn'):
        _local.conn = sqlite3.connect(DB_PATH, timeout=10)
    return _local.conn

def sanitize_filename(name, max_length=80):
    """Limpia el nombre del producto para usarlo como nombre de archivo"""
    replacements = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n',
        'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ñ': 'N',
    }
    for old, new in replacements.items():
        name = name.replace(old, new)
    
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[\s]+', '_', name.strip())
    return name[:max_length]

def get_extension_from_url(url):
    """Obtiene extension del URL"""
    url_lower = url.lower().split('?')[0].split('#')[0]
    for ext in ['.png', '.webp', '.gif', '.svg', '.jpeg', '.jpg', '.bmp']:
        if url_lower.endswith(ext):
            return ext
    return '.jpg'

def download_image(url, filepath):
    """Descarga una imagen con reintentos"""
    for attempt in range(RETRY_COUNT + 1):
        try:
            response = requests.get(
                url, 
                headers=HEADERS, 
                timeout=TIMEOUT,
                stream=True,
                allow_redirects=True
            )
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                
                # Determinar extension correcta
                ext = get_extension_from_url(url)
                if 'png' in content_type:
                    ext = '.png'
                elif 'webp' in content_type:
                    ext = '.webp'
                elif 'gif' in content_type:
                    ext = '.gif'
                
                filepath = filepath.rsplit('.', 1)[0] + ext
                
                # Descargar
                with open(filepath, 'wb') as f:
                    for chunk in response.iter_content(8192):
                        f.write(chunk)
                
                # Verificar tamano minimo
                file_size = os.path.getsize(filepath)
                if file_size < 100:
                    os.remove(filepath)
                    if attempt < RETRY_COUNT:
                        time.sleep(0.3)
                        continue
                    return False, "Archivo muy pequeno"
                
                return True, filepath
            
            elif response.status_code in [403, 404, 429]:
                if attempt < RETRY_COUNT:
                    time.sleep(0.5)
                    continue
                return False, f"HTTP {response.status_code}"
            else:
                if attempt < RETRY_COUNT:
                    time.sleep(0.3)
                    continue
                return False, f"HTTP {response.status_code}"
                
        except requests.exceptions.Timeout:
            if attempt < RETRY_COUNT:
                time.sleep(1)
                continue
            return False, "Timeout"
        except requests.exceptions.ConnectionError:
            if attempt < RETRY_COUNT:
                time.sleep(1)
                continue
            return False, "Connection Error"
        except Exception as e:
            if attempt < RETRY_COUNT:
                time.sleep(0.3)
                continue
            return False, str(e)[:50]
    
    return False, "Max retries"

def process_product_thread(args):
    """Procesa un producto en un thread"""
    product_id, name, image_url = args
    
    if not image_url or not image_url.startswith('http'):
        return product_id, 'skip', 'No URL'
    
    # Obtener conexion del thread
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verificar si ya tiene imagen local
    cursor.execute("SELECT image FROM products WHERE id = ?", (product_id,))
    row = cursor.fetchone()
    if not row:
        return product_id, 'skip', 'Not found'
    
    current_image = row[0]
    if current_image and current_image.startswith('/uploads/'):
        return product_id, 'skip', 'Already local'
    
    # Generar nombre de archivo
    safe_name = sanitize_filename(name, 50)
    ext = get_extension_from_url(image_url)
    
    if safe_name:
        filename = f"product_{product_id}_{safe_name}{ext}"
    else:
        filename = f"product_{product_id}_img{ext}"
    
    # Limpiar nombre de archivo
    filename = re.sub(r'[^\w._-]', '_', filename)
    filepath = os.path.join(UPLOADS_DIR, filename)
    
    # Descargar
    success, result = download_image(image_url, filepath)
    
    if success:
        local_path = f'/uploads/{os.path.basename(result)}'
        cursor.execute("UPDATE products SET image = ? WHERE id = ?", (local_path, product_id))
        conn.commit()
        return product_id, 'success', local_path
    else:
        return product_id, 'error', result

def main():
    print("=" * 70)
    print("DESCARGADOR DE IMAGENES - La Bodega del Computador")
    print("=" * 70)
    
    # Crear directorio
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    print(f"\nDirectorio de uploads: {UPLOADS_DIR}")
    
    # Conectar a la base de datos
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Estadisticas iniciales
    cursor.execute("SELECT COUNT(*) FROM products")
    total_products = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM products WHERE image LIKE 'http%'")
    external_images = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM products WHERE image LIKE '/uploads/%'")
    local_images = cursor.fetchone()[0]
    
    print(f"\nEstadisticas iniciales:")
    print(f"   Total de productos: {total_products}")
    print(f"   Con imagenes externas: {external_images}")
    print(f"   Ya con imagenes locales: {local_images}")
    print(f"   Sin imagen: {total_products - external_images - local_images}")
    
    if external_images == 0:
        print("\nNo hay imagenes externas para descargar.")
        conn.close()
        return
    
    # Obtener productos con URLs externas
    cursor.execute("""
        SELECT id, name, image 
        FROM products 
        WHERE image LIKE 'http%' 
        ORDER BY id
    """)
    products = cursor.fetchall()
    conn.close()
    
    print(f"\nIniciando descarga de {len(products)} imagenes...")
    print(f"   Workers paralelos: {MAX_WORKERS}")
    print()
    
    # Procesar productos
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    start_time = time.time()
    stats = {'success': 0, 'error': 0, 'skip': 0}
    errors = []
    downloaded_files = []
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(process_product_thread, p) for p in products]
        
        completed = 0
        for future in as_completed(futures):
            completed += 1
            
            try:
                product_id, status, detail = future.result()
                stats[status] += 1
                
                if status == 'success':
                    downloaded_files.append(detail)
                elif status == 'error':
                    errors.append((product_id, detail))
                    
            except Exception as e:
                stats['error'] += 1
                errors.append(('unknown', str(e)[:50]))
            
            # Progreso
            if completed % 50 == 0 or completed == len(products):
                elapsed = time.time() - start_time
                rate = completed / elapsed if elapsed > 0 else 0
                print(f"   [{completed}/{len(products)}] OK: {stats['success']} | Error: {stats['error']} | Skip: {stats['skip']} ({rate:.1f}/s)")
    
    # Limpiar conexiones de threads
    # Las conexiones se cierran automaticamente cuando los threads terminan
    
    # Resumen final
    elapsed = time.time() - start_time
    
    print(f"\n{'=' * 70}")
    print("PROCESO COMPLETADO")
    print(f"{'=' * 70}")
    print(f"\nResultados:")
    print(f"   Descargadas exitosamente: {stats['success']}")
    print(f"   Errores: {stats['error']}")
    print(f"   Omitidas: {stats['skip']}")
    print(f"   Tiempo total: {elapsed:.1f}s")
    
    # Errores
    if errors:
        print(f"\nPrimeros 10 errores:")
        for pid, err in errors[:10]:
            print(f"   #{pid}: {err}")
        if len(errors) > 10:
            print(f"   ... y {len(errors) - 10} mas")
    
    # Estadisticas finales
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM products WHERE image LIKE '/uploads/%'")
    local_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM products WHERE image LIKE 'http%'")
    external_count = cursor.fetchone()[0]
    
    print(f"\nEstado final:")
    print(f"   Con imagenes locales: {local_count}")
    print(f"   Con URLs externas: {external_count}")
    
    total = local_count + external_count
    if total > 0:
        pct = (local_count / total) * 100
        print(f"\n   Progreso: {pct:.1f}% imagenes locales")
    
    conn.close()
    
    # Archivos creados
    upload_count = len(os.listdir(UPLOADS_DIR))
    print(f"\nArchivos en {UPLOADS_DIR}: {upload_count}")
    print(f"URLs: http://localhost:3000/uploads/[filename]")

if __name__ == '__main__':
    main()
