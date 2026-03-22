#!/usr/bin/env python3
"""
Analizar productos restantes en categoría OTROS
"""
import sqlite3
from collections import Counter

DB_PATH = 'server/database.sqlite'

def analyze_remaining():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM products WHERE category = 'OTROS'")
    count = cursor.fetchone()[0]
    print(f"Productos restantes en OTROS: {count}")
    
    cursor.execute("SELECT name FROM products WHERE category = 'OTROS'")
    names = cursor.fetchall()
    
    # Analizar palabras
    word_counts = Counter()
    for name_row in names:
        name = name_row[0].lower()
        words = name.split()
        for word in words:
            if len(word) > 3:
                word_counts[word] += 1
    
    print("\nPalabras más comunes en OTROS restantes:")
    for word, cnt in word_counts.most_common(30):
        print(f"  {word}: {cnt}")
    
    # Mostrar algunos ejemplos
    print("\nEjemplos de productos OTROS:")
    cursor.execute("SELECT name FROM products WHERE category = 'OTROS' LIMIT 15")
    examples = cursor.fetchall()
    for name in examples:
        print(f"  - {name[0][:80]}")
    
    conn.close()

if __name__ == "__main__":
    analyze_remaining()