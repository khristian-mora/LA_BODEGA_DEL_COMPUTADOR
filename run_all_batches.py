"""
Script para ejecutar todos los lotes de scraping con progreso
Guarda el progreso y permite reanudar
"""
import sys
import subprocess
import time
import json
import os

# Configuración
LOTE_SIZE = 50
TOTAL_PRODUCTOS = 2165
PAUSA_ENTRE_LOTES = 5
PROGRESS_FILE = 'scrape_progress.json'

def get_progress():
    """Obtiene el progreso actual"""
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {'last_completed_batch': 0, 'timestamp': ''}

def save_progress(batch_num):
    """Guarda el progreso actual"""
    progress = {
        'last_completed_batch': batch_num,
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'total_batches': (TOTAL_PRODUCTOS + LOTE_SIZE - 1) // LOTE_SIZE
    }
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def run_batch(batch_num):
    """Ejecuta un lote específico"""
    start = (batch_num - 1) * LOTE_SIZE
    limit = min(LOTE_SIZE, TOTAL_PRODUCTOS - start)
    
    total_batches = (TOTAL_PRODUCTOS + LOTE_SIZE - 1) // LOTE_SIZE
    
    print(f"\n{'='*60}")
    print(f"LOTE {batch_num}/{total_batches}: productos {start+1} a {start+limit}")
    print(f"{'='*60}")
    
    cmd = [
        sys.executable,
        'scrape_products_v3_improved.py',
        f'--limit={limit}',
        f'--offset={start}',
        f'--batch={batch_num}'
    ]
    
    try:
        start_time = time.time()
        result = subprocess.run(cmd, check=True)
        elapsed = time.time() - start_time
        print(f"\n[OK] Lote {batch_num} completado en {elapsed:.1f} segundos")
        
        # Guardar progreso
        save_progress(batch_num)
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Error en lote {batch_num}: {e}")
        return False
    except KeyboardInterrupt:
        print(f"\n[INFO] Lote {batch_num} cancelado por el usuario")
        return False

def main():
    total_batches = (TOTAL_PRODUCTOS + LOTE_SIZE - 1) // LOTE_SIZE
    
    print(f"\n{'='*60}")
    print("SCRAPING AUTOMATICO POR LOTES - La Bodega del Computador")
    print(f"{'='*60}")
    print(f"Total productos: {TOTAL_PRODUCTOS}")
    print(f"Lotes de {LOTE_SIZE}: {total_batches}")
    print(f"Tiempo estimado: {total_batches * 120 / 60:.1f} - {total_batches * 240 / 60:.1f} minutos")
    
    # Verificar progreso anterior
    progress = get_progress()
    start_batch = progress.get('last_completed_batch', 0) + 1
    
    if start_batch > 1:
        print(f"\n[INFO] Reanudando desde lote {start_batch} (último completado: {start_batch-1})")
        print(f"  Último guardado: {progress.get('timestamp', 'desconocido')}")
    else:
        print(f"\n[INFO] Iniciando desde lote 1")
    
    # Determinar lotes a ejecutar
    if len(sys.argv) > 1:
        if sys.argv[1] == '--all':
            batches_to_run = list(range(start_batch, total_batches + 1))
        elif sys.argv[1] == '--resume':
            batches_to_run = list(range(start_batch, total_batches + 1))
        elif sys.argv[1] == '--from':
            if len(sys.argv) > 2:
                from_batch = int(sys.argv[2])
                batches_to_run = list(range(from_batch, total_batches + 1))
            else:
                print("Uso: python run_all_batches.py --from <lote_inicio>")
                return
        else:
            # Números de lote específicos
            batches_to_run = [int(x) for x in sys.argv[1:]]
    else:
        # Por defecto ejecutar todos desde el progreso
        batches_to_run = list(range(start_batch, total_batches + 1))
        print(f"\nModo automatico: ejecutando lotes {start_batch} a {total_batches}")
        print(f"Para especificar: python run_all_batches.py 1 2 3")
        print(f"Para reanudar: python run_all_batches.py --resume")
        print(f"Para desde lote X: python run_all_batches.py --from X")
    
    if not batches_to_run:
        print("\n[INFO] No hay lotes para ejecutar (todos completados)")
        return
    
    print(f"\n[INFO] Lotes a ejecutar: {len(batches_to_run)}")
    print(f"  Desde lote {batches_to_run[0]} hasta lote {batches_to_run[-1]}")
    
    # Confirmar antes de comenzar
    if '--yes' not in sys.argv:
        print(f"\n[INFO] Presiona Ctrl+C para cancelar en cualquier momento")
        time.sleep(3)
    
    # Ejecutar lotes
    successful = 0
    failed = 0
    skipped = 0
    
    for i, batch_num in enumerate(batches_to_run):
        if batch_num > total_batches:
            print(f"\n[ADVERTENCIA] Lote {batch_num} excede el total ({total_batches}), saltando...")
            skipped += 1
            continue
        
        print(f"\n[PROGRESO] {i+1}/{len(batches_to_run)} lotes restantes")
        
        success = run_batch(batch_num)
        
        if success:
            successful += 1
        else:
            failed += 1
            # Si falla, preguntar si continuar
            if '--continue' not in sys.argv:
                print(f"\n[INFO] Lote {batch_num} falló. El script se detendra.")
                print(f"  Para continuar de todos modos: python run_all_batches.py --continue")
                break
        
        # Pausa entre lotes (excepto el último)
        if i < len(batches_to_run) - 1:
            print(f"\n[INFO] Pausa de {PAUSA_ENTRE_LOTES} segundos...")
            time.sleep(PAUSA_ENTRE_LOTES)
    
    # Resumen final
    print(f"\n{'='*60}")
    print("RESUMEN FINAL")
    print(f"{'='*60}")
    print(f"Total lotes: {len(batches_to_run)}")
    print(f"Exitosos: {successful}")
    print(f"Fallidos: {failed}")
    print(f"Saltados: {skipped}")
    print(f"Productos procesados: ~{successful * LOTE_SIZE}")
    
    if successful > 0:
        last_batch = batches_to_run[successful-1]
        print(f"\nProgreso guardado: lote {last_batch} completado")
    
    if failed > 0:
        print(f"\n[ADVERTENCIA] {failed} lotes fallaron")
        print(f"  Revisa los logs anteriores")
        print(f"  Para reanudar: python run_all_batches.py --resume")
    
    print(f"\nArchivos generados:")
    print(f"  - productos_enriquecidos_v3_batchXX.json (para cada lote)")
    print(f"  - LISTADO_ENRIQUECIDO_V3_batchXX.xlsx (para cada lote)")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[INFO] Proceso cancelado por el usuario")
        print("[INFO] Los resultados parciales están guardados en los archivos de salida")
        print("[INFO] Para reanudar: python run_all_batches.py --resume")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)