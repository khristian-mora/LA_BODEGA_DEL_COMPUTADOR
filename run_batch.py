"""
Script simple para ejecutar un lote del scraping
Uso: python run_batch.py <batch_number>
"""
import sys
import subprocess

if len(sys.argv) < 2:
    print("Uso: python run_batch.py <batch_number>")
    print("Ejemplo: python run_batch.py 1")
    sys.exit(1)

batch_num = int(sys.argv[1])
LOTE_SIZE = 200
start = (batch_num - 1) * LOTE_SIZE

print(f"Ejecutando lote {batch_num}...")
print(f"Offset: {start}, Límite: {LOTE_SIZE}")

# Ejecutar script directamente
cmd = [
    sys.executable,
    'scrape_products_v3_improved.py',
    f'--limit={LOTE_SIZE}',
    f'--offset={start}',
    f'--batch={batch_num}'
]

try:
    subprocess.run(cmd, check=True)
    print(f"\n✓ Lote {batch_num} completado")
except subprocess.CalledProcessError as e:
    print(f"\n✗ Error en lote {batch_num}: {e}")
except KeyboardInterrupt:
    print(f"\n✗ Lote {batch_num} cancelado")