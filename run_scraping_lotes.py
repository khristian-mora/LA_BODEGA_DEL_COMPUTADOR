"""
Script para ejecutar scraping en lotes modificando el script original
Importa y ejecuta el módulo directamente
"""
import sys
import os
import time
import json
import openpyxl

# Agregar el directorio actual al path para importar el módulo
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Importar el módulo de scraping
import scrape_products_v3_improved as scraper

# ============ CONFIGURACIÓN ============
INPUT_FILE = 'LISTADO_CLEAN.xlsx'
LOTE_SIZE = 200
PAUSA_ENTRE_LOTES = 5

def get_total_products():
    """Obtiene el total de productos en el Excel"""
    wb = openpyxl.load_workbook(INPUT_FILE, read_only=True, data_only=True)
    ws = wb.active
    total = 0
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            continue
        nombre = row[0]
        if nombre and nombre != 'NOMBRE':
            total += 1
    wb.close()
    return total

def process_batch(batch_num, start, limit):
    """Procesa un lote de productos"""
    print(f"\n{'='*60}")
    print(f"PROCESANDO LOTE {batch_num}")
    print(f"Productos {start+1} a {start+limit}")
    print(f"{'='*60}")
    
    # Temporarily modify the scraper's configuration
    original_output_file = scraper.OUTPUT_FILE
    original_output_excel = scraper.OUTPUT_EXCEL
    
    # Modificar archivos de salida para este lote
    scraper.OUTPUT_FILE = f"productos_enriquecidos_v3_batch{batch_num:02d}.json"
    scraper.OUTPUT_EXCEL = f"LISTADO_ENRIQUECIDO_V3_batch{batch_num:02d}.xlsx"
    
    # Temporarily replace sys.argv
    original_argv = sys.argv.copy()
    sys.argv = [
        'scrape_products_v3_improved.py',
        f'--limit={limit}',
        f'--offset={start}',
        f'--batch={batch_num}'
    ]
    
    try:
        # Ejecutar el scraper
        scraper.main()
        print(f"\n✓ Lote {batch_num} completado exitosamente")
        return True
    except Exception as e:
        print(f"\n✗ Error en lote {batch_num}: {str(e)}")
        return False
    finally:
        # Restaurar configuración
        sys.argv = original_argv
        scraper.OUTPUT_FILE = original_output_file
        scraper.OUTPUT_EXCEL = original_output_excel

def main():
    print(f"\n{'='*60}")
    print("SCRAPING POR LOTES - La Bodega del Computador")
    print(f"{'='*60}")
    
    # Obtener total de productos
    print(f"\n[INFO] Contando productos en {INPUT_FILE}...")
    total_products = get_total_products()
    print(f"  Total productos: {total_products}")
    
    # Calcular lotes
    total_batches = (total_products + LOTE_SIZE - 1) // LOTE_SIZE
    print(f"  Lotes de {LOTE_SIZE}: {total_batches} lotes")
    
    # Verificar si es modo prueba o completo
    if len(sys.argv) > 1 and sys.argv[1] == '--full':
        print(f"  Modo completo: procesando todos los lotes")
    else:
        total_batches = 1
        print(f"  Modo prueba: procesando solo 1 lote")
        print(f"  Para procesar todos: python run_scraping_lotes.py --full")
    
    # Procesar lotes
    successful_batches = 0
    failed_batches = 0
    
    for batch_num in range(1, total_batches + 1):
        start = (batch_num - 1) * LOTE_SIZE
        limit = min(LOTE_SIZE, total_products - start)
        
        success = process_batch(batch_num, start, limit)
        
        if success:
            successful_batches += 1
        else:
            failed_batches += 1
        
        # Pausa entre lotes
        if batch_num < total_batches:
            print(f"\n[INFO] Pausa de {PAUSA_ENTRE_LOTES} segundos antes del siguiente lote...")
            time.sleep(PAUSA_ENTRE_LOTES)
    
    # Resumen final
    print(f"\n{'='*60}")
    print("RESUMEN FINAL")
    print(f"{'='*60}")
    print(f"  Total lotes: {total_batches}")
    print(f"  Completados: {successful_batches}")
    print(f"  Fallidos: {failed_batches}")
    print(f"  Productos procesados: {successful_batches * LOTE_SIZE if successful_batches < total_batches else total_products}")
    
    if failed_batches > 0:
        print(f"\n[ADVERTENCIA] {failed_batches} lotes fallaron. Revisa los logs anteriores.")
    
    print(f"\n[INFO] Archivos generados:")
    for i in range(1, successful_batches + 1):
        print(f"  - productos_enriquecidos_v3_batch{i:02d}.json")
        print(f"  - LISTADO_ENRIQUECIDO_V3_batch{i:02d}.xlsx")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[INFO] Proceso cancelado por el usuario")
        print("[INFO] Los resultados parciales están guardados en los archivos de salida")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)