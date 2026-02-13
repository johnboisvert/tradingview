#!/usr/bin/env python3
"""
Script pour corriger le margin-left des pages AI.
Le problème: certaines pages utilisent globals().get("SIDEBAR_HTML") qui peut être vide.
Solution: Utiliser SIDEBAR_FULL directement qui est défini.
"""

import re

def fix_ai_pages():
    with open("main.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    original = content
    
    # Liste des corrections à faire
    corrections = [
        # AI Whale Watcher - ligne 61301
        (
            r'return _simple_page\("AI Whale Watcher", body_html, request=request, show_title=False, sidebar_html=\(globals\(\)\.get\("SIDEBAR_HTML"\) or globals\(\)\.get\("SIDEBAR_FULL"\) or ""\), active_page="/ai-whale-watcher"\)',
            'return _simple_page("AI Whale Watcher", body_html, request=request, show_title=False, sidebar_html=SIDEBAR_FULL, active_page="/ai-whale-watcher")'
        ),
        # AI Opportunity Scanner - ligne 5087
        (
            r'return _simple_page\("AI Opportunity Scanner", body_html, sidebar_html=\(globals\(\)\.get\("SIDEBAR_FULL"\) or globals\(\)\.get\("SIDEBAR"\) or ""\), request=request, show_title=False\)',
            'return _simple_page("AI Opportunity Scanner", body_html, sidebar_html=SIDEBAR_FULL, request=request, show_title=False)'
        ),
        # AI Market Regime - ligne 39759 - ajouter request
        (
            r'return _simple_page\("AI Market Regime", body, sidebar_html=SIDEBAR_FULL\)(?!\s*,\s*request)',
            'return _simple_page("AI Market Regime", body, sidebar_html=SIDEBAR_FULL, request=request)'
        ),
    ]
    
    for pattern, replacement in corrections:
        content = re.sub(pattern, replacement, content)
    
    # Vérifier si des changements ont été faits
    if content != original:
        with open("main.py", "w", encoding="utf-8") as f:
            f.write(content)
        print("✅ Corrections appliquées aux pages AI")
    else:
        print("ℹ️ Aucune correction nécessaire ou patterns non trouvés")
    
    # Vérifier les résultats
    print("\n=== Vérification des retours _simple_page pour pages AI ===")
    for line in content.split('\n'):
        if 'return _simple_page' in line and ('AI Whale' in line or 'AI Opportunity' in line or 'AI Market Regime' in line):
            print(f"  {line.strip()[:150]}...")

if __name__ == "__main__":
    fix_ai_pages()