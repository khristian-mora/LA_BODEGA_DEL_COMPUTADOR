import pandas as pd

file_path = r'C:\Users\Usuario\Desktop\desarollo\LBDC\LISTADO.xlsx'
df = pd.read_excel(file_path, sheet_name='ARTICULOS', header=None)
print('Original shape:', df.shape)

# The first row contains headers: "NOMBRE" and "P.V.P"
# Let's set proper column names
df.columns = ['NOMBRE', 'PRECIO']

# Remove rows where both columns are NaN
df_clean = df.dropna(how='all')

# Remove rows where NOMBRE is NaN (keep rows with price even if name is NaN? probably not)
df_clean = df_clean[df_clean['NOMBRE'].notna()]

# Reset index
df_clean = df_clean.reset_index(drop=True)

print('Cleaned shape:', df_clean.shape)
print('\nFirst 20 rows:')
print(df_clean.head(20))
print('\nLast 20 rows:')
print(df_clean.tail(20))

# Check data types
print('\nData types:')
print(df_clean.dtypes)

# Convert PRECIO to numeric where possible
df_clean['PRECIO_NUM'] = pd.to_numeric(df_clean['PRECIO'], errors='coerce')
print('\nRows with numeric prices:', df_clean['PRECIO_NUM'].notna().sum())
print('Rows with non-numeric prices:', df_clean['PRECIO_NUM'].isna().sum())

# Show some statistics
print('\nPrice statistics (numeric):')
print(df_clean['PRECIO_NUM'].describe())

# Show items with highest prices
print('\nTop 10 most expensive items:')
top_expensive = df_clean[df_clean['PRECIO_NUM'].notna()].sort_values('PRECIO_NUM', ascending=False).head(10)
print(top_expensive[['NOMBRE', 'PRECIO_NUM']])

# Show items with lowest prices
print('\nTop 10 cheapest items:')
top_cheap = df_clean[df_clean['PRECIO_NUM'].notna()].sort_values('PRECIO_NUM', ascending=True).head(10)
print(top_cheap[['NOMBRE', 'PRECIO_NUM']])

# Check for duplicates
print('\nDuplicate item names:', df_clean['NOMBRE'].duplicated().sum())
print('Total unique items:', df_clean['NOMBRE'].nunique())

# Save cleaned data to new Excel
df_clean.to_excel('LISTADO_CLEAN.xlsx', index=False)
print('\nCleaned data saved to LISTADO_CLEAN.xlsx')