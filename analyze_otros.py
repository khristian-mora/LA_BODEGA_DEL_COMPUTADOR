#!/usr/bin/env python3
"""
Analizar productos en categoría OTROS para mejorar categorización
"""
import sqlite3
import json
from collections import Counter

DB_PATH = 'server/database.sqlite'

def analyze_otros():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Obtener productos en categoría OTROS
    cursor.execute("""
        SELECT id, name, specs 
        FROM products 
        WHERE category = 'OTROS'
        LIMIT 100
    """)
    otros = cursor.fetchall()
    
    print(f"Analizando {len(otros)} productos en categoría OTROS...")
    
    # Analizar palabras en los nombres
    word_counts = Counter()
    for id, name, specs in otros:
        words = name.lower().split()
        for word in words:
            if len(word) > 3:  # Ignorar palabras muy cortas
                word_counts[word] += 1
    
    print("\nPalabras más comunes en nombres de productos OTROS:")
    for word, cnt in word_counts.most_common(30):
        print(f"  {word}: {cnt}")
    
    # Analizar categorías originales de specs
    orig_cats = Counter()
    for id, name, specs in otros:
        if specs:
            try:
                spec_dict = json.loads(specs)
                cat = spec_dict.get('categoria_original', '')
                if cat:
                    orig_cats[cat] += 1
            except:
                pass
    
    if orig_cats:
        print("\nCategorías originales de specs (productos OTROS):")
        for cat, cnt in orig_cats.most_common(20):
            print(f"  {cat}: {cnt}")
    
    # Mostrar algunos ejemplos de productos OTROS con sus nombres
    print("\nEjemplos de productos en OTROS:")
    cursor.execute("""
        SELECT name 
        FROM products 
        WHERE category = 'OTROS'
        LIMIT 20
    """)
    examples = cursor.fetchall()
    for name in examples:
        print(f"  - {name[0][:80]}")
    
    conn.close()

if __name__ == "__main__":
    analyze_otros()