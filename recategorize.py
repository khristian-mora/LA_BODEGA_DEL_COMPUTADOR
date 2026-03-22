#!/usr/bin/env python3
"""
Recategorizar productos basado en palabras clave en el nombre
"""
import sqlite3
import re
from collections import defaultdict

DB_PATH = 'server/database.sqlite'

# Mapeo de palabras clave a categorías
KEYWORD_MAPPING = {
    # Cables
    'cable': 'CABLES',
    'cables': 'CABLES',
    'usb': 'CABLES/USB',
    'hdmi': 'CABLES/HDMI',
    'vga': 'CABLES/VGA',
    'rj45': 'CABLES/RED',
    'utp': 'CABLES/RED',
    'cat.': 'CABLES/RED',
    'display port': 'CABLES/DISPLAY',
    'dp': 'CABLES/DISPLAY',
    'sata': 'CABLES/SATA',
    'micro usb': 'CABLES/USB',
    'tipo c': 'CABLES/USB',
    'lightning': 'CABLES/USB',
    
    # Adaptadores/Cargadores
    'adaptador': 'ADAPTADORES/CARGADORES',
    'cargador': 'ADAPTADORES/CARGADORES',
    'convertidor': 'ADAPTADORES/CARGADORES',
    'otg': 'ADAPTADORES/OTG',
    
    # Audio
    'audifono': 'AUDIO',
    'audífono': 'AUDIO',
    'audifonos': 'AUDIO',
    'parlante': 'AUDIO/PARLANTES',
    'cabina': 'AUDIO/PARLANTES',
    'microfono': 'AUDIO',
    'micrófono': 'AUDIO',
    'speaker': 'AUDIO/PARLANTES',
    'audio': 'AUDIO',
    
    # Smart Home
    'alexa': 'SMART HOME',
    'echo': 'SMART HOME',
    'smart': 'SMART HOME',
    'wifi': 'SMART HOME',
    'inteligente': 'SMART HOME',
    'bombilla': 'SMART HOME',
    
    # Periféricos
    'mouse': 'MOUSE',
    'teclado': 'TECLADOS',
    'apuntador': 'PERIFERICOS',
    'laser': 'PERIFERICOS',
    'webcam': 'PERIFERICOS',
    'camara': 'PERIFERICOS',
    'control': 'PERIFERICOS',
    'joystick': 'PERIFERICOS',
    'gamer': 'PERIFERICOS/GAMER',
    
    # Almacenamiento
    'disco': 'DISCOS DUROS',
    'hdd': 'DISCOS DUROS',
    'ssd': 'DISCOS DUROS',
    'caddy': 'DISCOS DUROS',
    'memoria': 'MEMORIAS RAM',
    'ram': 'MEMORIAS RAM',
    'usb flash': 'MEMORIAS USB',
    'pendrive': 'MEMORIAS USB',
    
    # Redes
    'router': 'REDES/ROUTER',
    'switch': 'REDES/SWITCH',
    'modem': 'REDES/ROUTER',
    'access point': 'REDES/ROUTER',
    'repetidor': 'REDES/ROUTER',
    'bluetooh': 'REDES/BLUETOOTH',
    'bluetooth': 'REDES/BLUETOOTH',
    
    # Energía
    'ups': 'UPS',
    'fuente': 'FUENTES DE PODER',
    'bateria': 'BATERIAS',
    'batería': 'BATERIAS',
    'power bank': 'ENERGIA/BANCOS DE CARGA',
    'banco de carga': 'ENERGIA/BANCOS DE CARGA',
    
    # Computación
    'board': 'PLACAS BASE',
    'motherboard': 'PLACAS BASE',
    'procesador': 'PROCESADORES',
    'cpu': 'PROCESADORES',
    'chasis': 'GABINETES',
    'caja': 'GABINETES',
    'gabinete': 'GABINETES',
    
    # Impresión
    'impresora': 'IMPRESORAS',
    'cartucho': 'CONSUMIBLES/TINTAS',
    'tinta': 'CONSUMIBLES/TINTAS',
    'toner': 'CONSUMIBLES/TINTAS',
    'resma': 'CONSUMIBLES/PAPEL',
    
    # Muebles
    'base': 'MUEBLES/BASES',
    'reclinable': 'MUEBLES/BASES',
    'ventilador': 'MUEBLES/VENTILADORES',
    'mesa': 'MUEBLES',
    'silla': 'MUEBLES',
    
    # Varios
    'amarre': 'ACCESORIOS/VARIOS',
    'cinta': 'ACCESORIOS/VARIOS',
    'aire comprimido': 'ACCESORIOS/LIMPIEZA',
    'limpieza': 'ACCESORIOS/LIMPIEZA',
    'lapto': 'LAPTOPS',
    'laptop': 'LAPTOPS',
    'tablet': 'TABLETS',
    'monitor': 'MONITORES',
    'pantalla': 'MONITORES',
    
    # Nuevas categorías
    'diadema': 'AUDIO/AURICULARES',
    'funda': 'ACCESORIOS/FUNDAS',
    'case': 'ACCESORIOS/FUNDAS',
    'bolsa': 'ACCESORIOS/FUNDAS',
    'morral': 'ACCESORIOS/FUNDAS',
    'combo': 'PERIFERICOS/COMBOS',
    'lector': 'PERIFERICOS/LECTORES',
    'lector de': 'PERIFERICOS/LECTORES',
    'enclosure': 'DISCOS DUROS/ENCLOSURES',
    'estabilizador': 'ENERGIA/ESTABILIZADORES',
    'swicht': 'REDES/SWITCH',
    'switch': 'REDES/SWITCH',
    'descansapies': 'MUEBLES/ACCESORIOS',
    'cool': 'MUEBLES/VENTILADORES',
    'cooler': 'MUEBLES/VENTILADORES',
    'disipadora': 'MUEBLES/VENTILADORES',
    'termica': 'ACCESORIOS/THERMAL',
    'pasta termica': 'ACCESORIOS/THERMAL',
    'multipuerto': 'ADAPTADORES/MULTIPUERTO',
    'hub': 'ADAPTADORES/MULTIPUERTO',
    'cargador': 'ADAPTADORES/CARGADORES',
    'cierre': 'ACCESORIOS/VARIOS',
    'voltaje': 'ADAPTADORES/CONVERTIDORES',
    'externo': 'DISCOS DUROS/EXTERNOS',
    'extensor': 'CABLES/EXTENSIONES',
    'gaming': 'PERIFERICOS/GAMER',
    'rgb': 'PERIFERICOS/GAMER',
}

def recategorize(dry_run=True):
    """Recategorizar productos. Si dry_run=True, solo muestra cambios sin aplicar."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Obtener productos en categoría OTROS
    cursor.execute("""
        SELECT id, name, category 
        FROM products 
        WHERE category = 'OTROS'
    """)
    otros = cursor.fetchall()
    
    print(f"Analizando {len(otros)} productos en categoría OTROS...")
    
    changes = []
    
    for id, name, current_cat in otros:
        name_lower = name.lower()
        new_cat = None
        
        # Buscar palabras clave en el nombre
        for keyword, category in KEYWORD_MAPPING.items():
            if keyword in name_lower:
                new_cat = category
                break  # Primera coincidencia
        
        if new_cat and new_cat != current_cat:
            changes.append((id, name, current_cat, new_cat))
    
    print(f"\nSe encontraron {len(changes)} productos para recategorizar:")
    
    # Mostrar resumen por nueva categoría
    cat_counts = defaultdict(int)
    for id, name, old_cat, new_cat in changes:
        cat_counts[new_cat] += 1
    
    print("\nResumen por nueva categoría:")
    for cat, count in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {cat}: {count} productos")
    
    # Mostrar algunos ejemplos
    print("\nEjemplos de cambios propuestos:")
    for id, name, old_cat, new_cat in changes[:20]:
        print(f"  {name[:60]} -> {new_cat}")
    
    if not dry_run and changes:
        # Aplicar cambios
        print(f"\nAplicando {len(changes)} cambios...")
        for id, name, old_cat, new_cat in changes:
            cursor.execute("UPDATE products SET category = ? WHERE id = ?", (new_cat, id))
        conn.commit()
        print("Cambios aplicados correctamente.")
    elif dry_run:
        print("\nEste es un dry run. No se aplicaron cambios.")
        print("Para aplicar cambios, ejecuta con dry_run=False.")
    
    conn.close()
    return len(changes)

if __name__ == "__main__":
    # Aplicar cambios directamente
    changes = recategorize(dry_run=False)
    print(f"\nProceso completado. Se aplicaron {changes} cambios de categoría.")