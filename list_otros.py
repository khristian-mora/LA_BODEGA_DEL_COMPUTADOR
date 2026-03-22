#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('server/database.sqlite')
cursor = conn.cursor()

cursor.execute("SELECT id, name FROM products WHERE category = 'OTROS' ORDER BY name")
rows = cursor.fetchall()
print(f'Total productos OTROS: {len(rows)}')
print('\nLista:')
for i, (id, name) in enumerate(rows):
    print(f'{i+1:3}. [{id:4}] {name[:80]}')
conn.close()