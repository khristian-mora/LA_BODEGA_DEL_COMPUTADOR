"""
Script para ejecutar scraping en lotes de 50 productos
Más rápido que lotes de 200 y menos propenso a bloqueos
"""
import sys
import subprocess
import time

# Configuración
LOTE_SIZE = 50
TOTAL_PRODUCTOS = 2165
PAUSA_ENTRE_LOTES = 3

def run_batch(batch_num):
    """Ejecuta un lote específico"""
    start = (batch_num - 1) * LOTE_SIZE
    limit = min(LOTE_SIZE, TOTAL_PRODUCTOS - start)
    
    print(f"\n{'='*60}")
    print(f"LOTE {batch_num}: productos {start+1} a {start+limit}")
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
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n✗ Error en lote {batch_num}: {e}")
        return False
    except KeyboardInterrupt:
        print(f"\n✗ Lote {batch_num} cancelado")
        return False

def main():
    total_batches = (TOTAL_PRODUCTOS + LOTE_SIZE - 1) // LOTE_SIZE
    
    print(f"\n{'='*60}")
    print("SCRAPING POR LOTES DE 50 - La Bodega del Computador")
    print(f"{'='*60}")
    print(f"Total productos: {TOTAL_PRODUCTOS}")
    print(f"Lotes de {LOTE_SIZE}: {total_batches}")
    print(f"Tiempo estimado: {total_batches * 30} - {total_batches * 60} segundos")
    
    # Determinar qué lotes ejecutar
    if len(sys.argv) > 1:
        if sys.argv[1] == '--all':
            batches_to_run = list(range(1, total_batches + 1))
        elif sys.argv[1] == '--range':
            if len(sys.argv) > 3:
                start_batch = int(sys.argv[2])
                end_batch = int(sys.argv[3])
                batches_to_run = list(range(start_batch, end_batch + 1))
            else:
                print("Uso: python run_batch_50.py --range <inicio> <fin>")
                return
        else:
            # Números de lote específicos
            batches_to_run = [int(x) for x in sys.argv[1:]]
    else:
        # Por defecto ejecutar solo el lote 1
        batches_to_run = [1]
        print(f"\nModo prueba: solo lote 1")
        print(f"Para ejecutar todos: python run_batch_50.py --all")
        print(f"Para rango: python run_batch_50.py --range 1 10")
        print(f"Para específicos: python run_batch_50.py 1 3 5")
    
    # Ejecutar lotes
    successful = 0
    failed = 0
    
    for batch_num in batches_to_run:
        if batch_num > total_batches:
            print(f"\n[ADVERTENCIA] Lote {batch_num} excede el total ({total_batches}), saltando...")
            continue
        
        success = run_batch(batch_num)
        
        if success:
            successful += 1
        else:
            failed += 1
        
        # Pausa entre lotes (excepto el último)
        if batch_num != batches_to_run[-1]:
            time.sleep(PAUSA_ENTRE_LOTES)
    
    # Resumen
    print(f"\n{'='*60}")
    print("RESUMEN")
    print(f"{'='*60}")
    print(f"Lotes ejecutados: {len(batches_to_run)}")
    print(f"Exitosos: {successful}")
    print(f"Fallidos: {failed}")
    print(f"Productos procesados: ~{successful * LOTE_SIZE}")
    
    print(f"\nArchivos generados:")
    for batch_num in batches_to_run:
        if batch_num <= successful + failed:  # Asumimos que los exitosos se guardaron
            print(f"  - productos_enriquecidos_v3_batch{batch_num:02d}.json")
            print(f"  - LISTADO_ENRIQUECIDO_V3_batch{batch_num:02d}.xlsx")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[INFO] Proceso cancelado")
        sys.exit(0)