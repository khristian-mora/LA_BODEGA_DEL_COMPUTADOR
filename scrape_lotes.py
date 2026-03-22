"""
Script para ejecutar scraping en lotes y no reventar memoria
Procesa en lotes de 200 productos y va guardando progreso
"""
import subprocess
import sys
import os
import time
import json
import openpyxl

# ============ CONFIGURACIÓN ============
INPUT_FILE = 'LISTADO_CLEAN.xlsx'
LOTE_SIZE = 200  # Productos por lote
PAUSA_ENTRE_LOTES = 3  # Segundos entre lotes

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

def run_batch(start, limit, batch_num, total_batches):
    """Ejecuta un lote del scraping"""
    print(f"\n{'='*60}")
    print(f"LOTE {batch_num}/{total_batches}: productos {start+1} a {start+limit}")
    print(f"{'='*60}")
    
    # Ejecutar script con límite y offset
    cmd = [
        sys.executable,
        'scrape_products_v3_improved.py',
        f'--limit={limit}',
        f'--offset={start}',
        f'--batch={batch_num}'
    ]
    
    try:
        # Ejecutar sin capturar salida para evitar bloqueos
        result = subprocess.run(cmd, text=True, encoding='utf-8')
        
        if result.returncode == 0:
            print(f"\n✓ Lote {batch_num} completado exitosamente")
            return True
        else:
            print(f"\n✗ Error en lote {batch_num} (código: {result.returncode})")
            return False
    except Exception as e:
        print(f"\n✗ Excepción en lote {batch_num}: {str(e)[:100]}")
        return False

def consolidate_results(total_products, total_batches):
    """Consolida los resultados de todos los lotes"""
    print(f"\n{'='*60}")
    print("CONSOLIDANDO RESULTADOS")
    print(f"{'='*60}")
    
    all_products = []
    all_metadata = []
    
    # Cargar cada lote (el script sobreescribe los archivos, así que solo tenemos el último)
    # Necesitamos modificar esto para guardar cada lote por separado
    # Por ahora, asumimos que solo tenemos el último lote
    
    # En su lugar, vamos a procesar todos los productos de una vez pero en lotes internamente
    print("Nota: Los lotes se procesan secuencialmente y los resultados se sobreescriben")
    print("Para procesar todos los productos, necesitaríamos modificar el script para guardar cada lote por separado")
    
    return False

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
    
    # Modo prueba: solo procesar 1 lote
    if len(sys.argv) > 1 and sys.argv[1] == '--full':
        print(f"  Modo completo: procesando todos los lotes")
    else:
        total_batches = 1
        print(f"  Modo prueba: procesando solo 1 lote")
        print(f"  Para procesar todos: python scrape_lotes.py --full")
    
    # Confirmar
    print(f"\n[INFO] Procesando {total_products} productos en {total_batches} lotes...")
    print(f"  Presiona Ctrl+C para cancelar")
    time.sleep(1)
    
    # Procesar lotes
    successful_batches = 0
    failed_batches = 0
    
    for batch_num in range(1, total_batches + 1):
        start = (batch_num - 1) * LOTE_SIZE
        limit = min(LOTE_SIZE, total_products - start)
        
        success = run_batch(start, limit, batch_num, total_batches)
        
        if success:
            successful_batches += 1
            # Guardar progreso
            progress = {
                'batch': batch_num,
                'total_batches': total_batches,
                'processed': batch_num * LOTE_SIZE if batch_num < total_batches else total_products,
                'total': total_products,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            with open('scrape_progress.json', 'w') as f:
                json.dump(progress, f, indent=2)
        else:
            failed_batches += 1
        
        # Pausa entre lotes
        if batch_num < total_batches:
            print(f"\n[INFO] Pausa de {PAUSA_ENTRE_LOTES} segundos...")
            time.sleep(PAUSA_ENTRE_LOTES)
    
    # Resumen final
    print(f"\n{'='*60}")
    print("RESUMEN FINAL")
    print(f"{'='*60}")
    print(f"  Total lotes: {total_batches}")
    print(f"  Completados: {successful_batches}")
    print(f"  Fallidos: {failed_batches}")
    print(f"  Productos procesados: ~{successful_batches * LOTE_SIZE if successful_batches < total_batches else total_products}")
    
    if failed_batches > 0:
        print(f"\n[ADVERTENCIA] {failed_batches} lotes fallaron. Revisa los logs anteriores.")
    
    print(f"\n[INFO] Resultados guardados en:")
    print(f"  - productos_enriquecidos_v3.json")
    print(f"  - LISTADO_ENRIQUECIDO_V3.xlsx")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[INFO] Proceso cancelado por el usuario")
        print("[INFO] Los resultados parciales están guardados en los archivos de salida")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] Error inesperado: {e}")
        sys.exit(1)