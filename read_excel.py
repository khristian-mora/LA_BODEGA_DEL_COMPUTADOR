import pandas as pd
import sys

file_path = r'C:\Users\Usuario\Desktop\desarollo\LBDC\LISTADO.xlsx'
print(f'Reading {file_path}...')
try:
    # Try reading with pandas
    xl = pd.ExcelFile(file_path)
    print('Sheets:', xl.sheet_names)
    for sheet in xl.sheet_names:
        df = pd.read_excel(xl, sheet_name=sheet)
        print(f'\n=== Sheet: {sheet} ===')
        print(f'Shape: {df.shape}')
        print('Columns:', list(df.columns))
        print('First 5 rows:')
        print(df.head())
        print('\nInfo:')
        df.info()
        print('\nDescribe:')
        print(df.describe())
        print('\n')
except Exception as e:
    print('Error:', e)
    import traceback
    traceback.print_exc()