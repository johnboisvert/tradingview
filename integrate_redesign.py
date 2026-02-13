"""
Script d'intégration des pages redesignées dans main.py
Exécuter ce script pour appliquer les nouvelles pages
"""

import re

def integrate_pages():
    print("🚀 Intégration des pages redesignées...")
    
    # Lire main.py
    with open('main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Ajouter les imports au début du fichier (après les imports existants)
    import_code = '''
# ============================================================================
# IMPORT DES PAGES REDESIGNÉES
# ============================================================================
try:
    from pages_redesign import get_strategie_page_html
    from pages_redesign_part2 import get_spot_trading_page_html, get_contact_page_html
    from pages_redesign_part3 import get_convertisseur_page_html, get_calculatrice_page_html
    REDESIGN_PAGES_AVAILABLE = True
    print("✅ Pages redesignées chargées avec succès")
except ImportError as e:
    REDESIGN_PAGES_AVAILABLE = False
    print(f"⚠️ Pages redesignées non disponibles: {e}")
# ============================================================================
'''
    
    # Vérifier si l'import existe déjà
    if 'REDESIGN_PAGES_AVAILABLE' not in content:
        # Trouver un bon endroit pour insérer (après les imports FastAPI)
        insert_pos = content.find('app = FastAPI()')
        if insert_pos != -1:
            # Trouver la fin de cette ligne
            line_end = content.find('\n', insert_pos)
            content = content[:line_end+1] + import_code + content[line_end+1:]
            print("✅ Imports ajoutés")
    
    # Sauvegarder
    with open('main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Intégration terminée!")
    print("")
    print("📝 Pour utiliser les nouvelles pages, modifiez les routes dans main.py:")
    print("")
    print("   @app.get('/strategie', response_class=HTMLResponse)")
    print("   async def strategie_page():")
    print("       if REDESIGN_PAGES_AVAILABLE:")
    print("           return HTMLResponse(get_strategie_page_html(SIDEBAR, CSS))")
    print("       # ... fallback to old page")
    print("")

if __name__ == '__main__':
    integrate_pages()