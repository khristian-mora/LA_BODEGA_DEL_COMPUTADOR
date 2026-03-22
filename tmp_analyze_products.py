import openpyxl
from collections import Counter
import re

wb = openpyxl.load_workbook('LISTADO_CLEAN.xlsx', read_only=True, data_only=True)
ws = wb.active

products = []
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0:
        continue  # skip header
    nombre, precio, precio_num = row
    if nombre and nombre != 'NOMBRE':
        products.append({
            'nombre': str(nombre).strip(),
            'precio': precio,
            'precio_num': precio_num
        })

wb.close()

print(f"Total productos: {len(products)}")

# Extraer marcas comunes
common_brands = [
    'HP', 'DELL', 'ACER', 'SAMSUNG', 'LG', 'ASUS', 'LENOVO', 'CANON', 'EPSON',
    'BROTHER', 'LOGITECH', 'MICROSOFT', 'TOSHIBA', 'HITACHI', 'SEAGATE', 'WESTERN',
    'WD', 'KINGSTON', 'SANDISK', 'adata', 'HYPERX', 'RAZER', 'CORSAIR', 'COOLER',
    'GENIUS', 'TENDA', 'TP-LINK', 'D-LINK', 'CISCO', 'UBIQUITI', 'MERCUSYS',
    'NOGANET', 'NEXXT', 'JEWAY', 'PANTRON', 'PATRIOT', 'TRANSCEND', 'CRUCIAL',
    'INTEL', 'AMD', 'NVIDIA', 'MSI', 'GIGABYTE', 'EVGA', 'XFX', 'ZOTAC',
    'PHILIPS', 'VIEWSONIC', 'AOC', 'BENQ', 'DELL', 'EIZO', 'NEC', 'IIYAMA',
    'APC', 'MSI', 'THERMALTAKE', 'NZXT', 'FRACTAL', 'BE QUIET', 'NOCTUA',
    'SYNOLOGY', 'QNAP', 'NETGEAR', 'ARRIS', 'MOTOROLA', 'HUAWEI', 'XIAOMI',
    'APPLE', 'SONY', 'PANASONIC', 'JBL', 'BOSE', 'LOGITECH', 'RAZER', 'STEELSERIES',
    'KINGSTON', 'SANDISK', 'WD', 'SEAGATE', 'TOSHIBA', 'HGST', 'SAMSUNG',
    'HPE', 'IBM', 'CISCO', 'ARUBA', 'JUNIPER', 'FORTINET', 'PALO ALTO',
    'VEYO', 'GENERICA', 'GENERICO', 'OTROS', 'VARIOS', 'N/A', 'S/M'
]

brand_counter = Counter()
category_counter = Counter()

for p in products:
    nombre_upper = p['nombre'].upper()
    
    # Find brand
    found_brand = 'GENERICO'
    for brand in common_brands:
        if brand.upper() in nombre_upper:
            found_brand = brand.upper()
            break
    brand_counter[found_brand] += 1
    
    # Find category based on keywords
    category = 'OTROS'
    if any(kw in nombre_upper for kw in ['ADAPTADOR', 'CARGADOR', 'CHARGER']):
        category = 'ADAPTADORES/CARGADORES'
    elif any(kw in nombre_upper for kw in ['MONITOR', 'LCD', 'LED']):
        category = 'MONITORES'
    elif any(kw in nombre_upper for kw in ['TECLADO', 'KEYBOARD']):
        category = 'TECLADOS'
    elif any(kw in nombre_upper for kw in ['MOUSE']):
        category = 'MOUSE'
    elif any(kw in nombre_upper for kw in ['DISCO', 'HDD', 'SSD', 'DURO']):
        category = 'DISCOS DUROS'
    elif any(kw in nombre_upper for kw in ['MEMORIA', 'RAM', 'DDR']):
        category = 'MEMORIAS RAM'
    elif any(kw in nombre_upper for kw in ['IMPRESORA', 'PRINTER', 'FAX']):
        category = 'IMPRESORAS'
    elif any(kw in nombre_upper for kw in ['CARTUCHO', 'TONER', 'TINTA']):
        category = 'CONSUMIBLES'
    elif any(kw in nombre_upper for kw in ['CABLE', 'USB', 'HDMI', 'VGA', 'DVI', 'DISPLAYPORT']):
        category = 'CABLES/CONECTORES'
    elif any(kw in nombre_upper for kw in ['ROUTER', 'SWITCH', 'ACCESS POINT', 'WIFI', 'RED']):
        category = 'REDES'
    elif any(kw in nombre_upper for kw in ['WEBCAM', 'CAMARA']):
        category = 'CAMARAS'
    elif any(kw in nombre_upper for kw in ['AURICULAR', 'HEADSET', 'MICROFONO']):
        category = 'AUDIO'
    elif any(kw in nombre_upper for kw in ['FUENTE', 'PSU', 'POWERSUPPLY']):
        category = 'FUENTES DE PODER'
    elif any(kw in nombre_upper for kw in ['TOWER', 'CASE', 'GABINETE']):
        category = 'GABINETES'
    elif any(kw in nombre_upper for kw in ['PROCESADOR', 'CPU']):
        category = 'PROCESADORES'
    elif any(kw in nombre_upper for kw in ['PLACA', 'MOTHERBOARD', 'BASE']):
        category = 'PLACAS BASE'
    elif any(kw in nombre_upper for kw in ['TARJETA DE VIDEO', 'GRAFICA', 'GPU', 'GEFORCE', 'RADEON']):
        category = 'TARJETAS DE VIDEO'
    elif any(kw in nombre_upper for kw in ['LAPTOP', 'NOTEBOOK', 'PORTATIL']):
        category = 'LAPTOPS'
    elif any(kw in nombre_upper for kw in ['TABLET']):
        category = 'TABLETS'
    elif any(kw in nombre_upper for kw in ['SILLA']):
        category = 'MUEBLES'
    elif any(kw in nombre_upper for kw in ['UPS', 'NOBREAK']):
        category = 'UPS/NOBREAK'
    elif any(kw in nombre_upper for kw in ['PENDRIVE', 'FLASH', 'USB']):
        category = 'MEMORIAS USB'
    elif any(kw in nombre_upper for kw in ['LECTOR', 'ESCANER', 'SCANNER']):
        category = 'LECTORES/ESCANERS'
    elif any(kw in nombre_upper for kw in ['PROYECTOR']):
        category = 'PROYECTORES'
    elif any(kw in nombre_upper for kw in ['PARLANTE', 'SPEAKER']):
        category = 'PARLANTES'
    elif any(kw in nombre_upper for kw in ['GRABADORA', 'DVR', 'NVR']):
        category = 'SEGURIDAD/VIGILANCIA'
    
    category_counter[category] += 1

print("\n=== TOP 20 MARCAS ===")
for brand, count in brand_counter.most_common(20):
    print(f"  {brand}: {count}")

print("\n=== CATEGORÍAS ===")
for cat, count in category_counter.most_common():
    print(f"  {cat}: {count}")

# Save analysis
with open('listado_analysis.txt', 'w', encoding='utf-8') as f:
    f.write(f"Total productos: {len(products)}\n\n")
    f.write("=== MARCAS ===\n")
    for brand, count in brand_counter.most_common():
        f.write(f"{brand}: {count}\n")
    f.write("\n=== CATEGORÍAS ===\n")
    for cat, count in category_counter.most_common():
        f.write(f"{cat}: {count}\n")

print("\nGuardado en listado_analysis.txt")
