#!/usr/bin/env python3
"""
Script pour corriger le double décalage (padding-left du body + margin-left du content)
Le body a déjà padding-left:280px, donc .content ne doit PAS avoir margin-left:280px
"""

import re

def fix_double_margin():
    with open('main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes_made = []
    
    # Pattern 1: Corriger .content { margin-left:280px; width:calc(100% - 280px); }
    # Le body a déjà padding-left:280px, donc on met margin-left:0
    pattern1 = r'(\.content\s*\{\{?\s*)margin-left\s*:\s*280px\s*;(\s*width\s*:\s*calc\s*\(\s*100%\s*-\s*280px\s*\)\s*;)'
    replacement1 = r'\1margin-left:0; width:100%;'
    
    new_content, count1 = re.subn(pattern1, replacement1, content)
    if count1 > 0:
        changes_made.append(f"Corrigé {count1} occurrences de .content margin-left:280px")
        content = new_content
    
    # Pattern 2: Corriger les cas où .content a margin-left: 280px sans width
    pattern2 = r'(\.content\s*\{[^}]*?)margin-left\s*:\s*280px\s*;'
    
    def replace_margin(match):
        return match.group(1) + 'margin-left:0;'
    
    new_content = re.sub(pattern2, replace_margin, content)
    if new_content != content:
        changes_made.append("Corrigé d'autres occurrences de .content margin-left:280px")
        content = new_content
    
    # Pattern 3: S'assurer que les pages AI n'ont pas de padding-left supplémentaire
    # Ajouter une règle CSS globale pour les conteneurs principaux
    
    # Vérifier si la règle existe déjà
    if '.content{margin-left:0' not in content and '.content { margin-left:0' not in content:
        # Trouver la ligne avec body{padding-left:280px et ajouter après
        pattern3 = r'(body\s*\{\s*margin\s*:\s*0\s*!important\s*;\s*padding-left\s*:\s*280px\s*!important\s*;[^}]*\})'
        
        def add_content_fix(match):
            return match.group(1) + '\n.content,.main-content,.ww-root,.page-content{margin-left:0!important;padding-left:0!important}'
        
        new_content = re.sub(pattern3, add_content_fix, content, count=1)
        if new_content != content:
            changes_made.append("Ajouté règle CSS pour éviter double décalage")
            content = new_content
    
    if content != original_content:
        with open('main.py', 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Corrections appliquées:")
        for change in changes_made:
            print(f"   - {change}")
    else:
        print("ℹ️ Aucune modification nécessaire")
    
    return len(changes_made) > 0

if __name__ == "__main__":
    fix_double_margin()