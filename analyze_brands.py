import pandas as pd

df = pd.read_excel('LISTADO.xlsx', sheet_name='ARTICULOS', header=None)
df.columns = ['NOMBRE', 'PRECIO']
df = df.dropna(how='all')
df = df[df['NOMBRE'].notna()]

# Extract potential brand/model patterns
import re

# Common brands in tech products
brands = ['ADAPTADOR', 'BLUEENDLESS', 'JEWAY', 'DELL', 'HP', 'ACER', 'BOSE', 'EPSON', 'GEFORCE', 'QLED', 'JANUS', 'POWEST', 'GAMER', 'SILLA', 'BASE', 'MICROFONO', 'LAMINAS', 'TULAS', 'BOLSAS', 'VITRINA', 'BOLSA', 'AZ', 'RESMA', 'PARTES', 'ACCESORIOS', 'CABLES', 'TINTAS', 'IMPRESORAS', 'UPS', 'TV', 'PARLANTE', 'IMPRESORA', 'SILLA', 'MICROFONO']

# Check if brands appear in names
brand_counts = {}
for brand in brands:
    count = df['NOMBRE'].str.contains(brand, case=False, na=False).sum()
    if count > 0:
        brand_counts[brand] = count

print('Potential brand mentions:')
for brand, count in sorted(brand_counts.items(), key=lambda x: x[1], reverse=True)[:20]:
    print(f'{brand}: {count}')

# Check sample names for structure
print('\nSample names analysis:')
sample = df['NOMBRE'].head(50).tolist()
for name in sample:
    print(name)

# Try to extract brand and model from names
print('\nTrying to extract brand/model:')
# Example: "ADAPTADOR PARA HP MINI 19.V-1.58A  H04MP"
# Could be brand: HP, model: MINI 19.V-1.58A H04MP
pattern = r'(?:PARA|DE|Y|Y\s+)?([A-Z][A-Z0-9\s]+?)(?:\s+\d+\.?\d*[VVA]?|\s+[A-Z0-9]{3,})'
for name in sample[:20]:
    match = re.search(pattern, name)
    if match:
        print(f'{name} -> potential brand: {match.group(1)}')