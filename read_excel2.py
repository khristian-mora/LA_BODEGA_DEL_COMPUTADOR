import pandas as pd

file_path = r'C:\Users\Usuario\Desktop\desarollo\LBDC\LISTADO.xlsx'
# Read with header=0 to use first row as column names
df = pd.read_excel(file_path, sheet_name='ARTICULOS', header=0)
print('DataFrame shape:', df.shape)
print('Columns:', list(df.columns))
print('\nFirst 10 rows:')
print(df.head(10))
print('\nLast 10 rows:')
print(df.tail(10))
print('\nData types:')
print(df.dtypes)
print('\nMissing values:')
print(df.isnull().sum())
# Check unique values in first column
print('\nUnique values in first column (sample):')
print(df.iloc[:, 0].unique()[:20])
# Check if second column is numeric
print('\nUnique values in second column (sample):')
print(df.iloc[:, 1].unique()[:20])