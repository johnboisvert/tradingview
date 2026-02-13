#!/usr/bin/env python3
"""
Correction de l'espacement excessif sur les pages AI
"""
import re

def fix_whitespace():
    with open('main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Trouver et modifier la fonction _simple_page à la ligne ~60641
    # Réduire le padding de .main de "22px 22px 60px" à "12px 16px 30px"
    # Et réduire le max-width de page-wrap
    
    old_main_css = "padding: 22px 22px 60px;"
    new_main_css = "padding: 10px 16px 30px;"
    
    old_page_wrap = "max-width: 1400px;"
    new_page_wrap = "max-width: 1600px;"
    
    # Compter les occurrences
    count1 = content.count(old_main_css)
    count2 = content.count(old_page_wrap)
    
    print(f"Occurrences de '{old_main_css}': {count1}")
    print(f"Occurrences de '{old_page_wrap}': {count2}")
    
    # Remplacer
    content = content.replace(old_main_css, new_main_css)
    content = content.replace(old_page_wrap, new_page_wrap)
    
    # Aussi corriger le margin du page-wrap pour les pages avec sidebar
    # Le problème est que page_wrap_margin = "0 auto" centre le contenu
    # On veut "0" pour que le contenu soit aligné à gauche
    
    # Chercher la partie spécifique dans _simple_page
    old_pattern = 'page_wrap_margin = "0 auto"'
    new_pattern = 'page_wrap_margin = "0"'
    
    if old_pattern in content:
        content = content.replace(old_pattern, new_pattern)
        print(f"Remplacé: {old_pattern} -> {new_pattern}")
    
    with open('main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Corrections appliquées")

if __name__ == "__main__":
    fix_whitespace()
