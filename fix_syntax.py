#!/usr/bin/env python3
"""
Corriger l'erreur de syntaxe dans main.py
"""

with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Corriger le bloc try/except mal formaté
old_block = '''try:
    from pages_redesign import get_strategie_page_html
    from pages_redesign_part2 import get_spot_trading_page_html, get_contact_page_html
    from pages_redesign_part3 import get_convertisseur_page_html, get_calculatrice_page_html
    REDESIGN_PAGES_AVAILABLE = True
USE_NEW_DESIGN = True  # Utiliser les nouvelles versions par défaut
    print("✅ Pages redesignées v2.0 chargées avec succès")
except ImportError as e:
    REDESIGN_PAGES_AVAILABLE = False
    print(f"⚠️ Pages redesignées non disponibles: {e}")'''

new_block = '''try:
    from pages_redesign import get_strategie_page_html
    from pages_redesign_part2 import get_spot_trading_page_html, get_contact_page_html
    from pages_redesign_part3 import get_convertisseur_page_html, get_calculatrice_page_html
    REDESIGN_PAGES_AVAILABLE = True
    USE_NEW_DESIGN = True  # Utiliser les nouvelles versions par défaut
    print("✅ Pages redesignées v2.0 chargées avec succès")
except ImportError as e:
    REDESIGN_PAGES_AVAILABLE = False
    USE_NEW_DESIGN = False
    print(f"⚠️ Pages redesignées non disponibles: {e}")'''

if old_block in content:
    content = content.replace(old_block, new_block)
    print("✅ Bloc try/except corrigé")
else:
    print("⚠️ Bloc non trouvé, tentative de correction alternative...")
    # Correction alternative
    content = content.replace(
        'REDESIGN_PAGES_AVAILABLE = True\nUSE_NEW_DESIGN = True',
        'REDESIGN_PAGES_AVAILABLE = True\n    USE_NEW_DESIGN = True'
    )

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fichier sauvegardé")