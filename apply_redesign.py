#!/usr/bin/env python3
"""
Script pour appliquer les pages redesignées à main.py
Exécuter: python apply_redesign.py
"""

import re

def apply_redesign():
    print("🚀 Application des pages redesignées...")
    
    # Lire main.py
    with open('main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Backup
    with open('main.py.backup', 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Backup créé: main.py.backup")
    
    # 1. Ajouter les imports au début du fichier
    import_block = '''
# ============================================================================
# IMPORT DES PAGES REDESIGNÉES - CryptoIA v6.0
# ============================================================================
try:
    from pages_redesign import get_strategie_page_html
    from pages_redesign_part2 import get_spot_trading_page_html, get_contact_page_html
    from pages_redesign_part3 import get_convertisseur_page_html, get_calculatrice_page_html
    REDESIGN_PAGES_AVAILABLE = True
    print("✅ Pages redesignées v6.0 chargées avec succès")
except ImportError as e:
    REDESIGN_PAGES_AVAILABLE = False
    print(f"⚠️ Pages redesignées non disponibles: {e}")
# ============================================================================

'''
    
    # Vérifier si l'import existe déjà
    if 'REDESIGN_PAGES_AVAILABLE' not in content:
        # Trouver la position après les imports initiaux
        # Chercher après "from typing import Optional"
        match = re.search(r'(from typing import Optional.*?\n)', content)
        if match:
            insert_pos = match.end()
            content = content[:insert_pos] + import_block + content[insert_pos:]
            print("✅ Imports ajoutés")
        else:
            # Alternative: après les premiers imports
            content = import_block + content
            print("✅ Imports ajoutés au début")
    else:
        print("ℹ️ Imports déjà présents")
    
    # 2. Créer les nouvelles routes qui utilisent les pages redesignées
    # On va ajouter une section à la fin du fichier avant le if __name__
    
    new_routes = '''

# ============================================================================
# ROUTES REDESIGNÉES - CryptoIA v6.0
# Ces routes utilisent les nouvelles pages avec design révolutionnaire
# ============================================================================

# Route /strategie redesignée
@app.get("/strategie-v6", response_class=HTMLResponse)
async def strategie_page_v6():
    """Page Stratégies de Trading - Version 6.0 Redesignée"""
    if REDESIGN_PAGES_AVAILABLE:
        try:
            return HTMLResponse(get_strategie_page_html(SIDEBAR, ""))
        except Exception as e:
            print(f"Erreur page stratégie v6: {e}")
    return RedirectResponse("/strategie")

# Route /spot-trading redesignée
@app.get("/spot-trading-v6", response_class=HTMLResponse)
async def spot_trading_page_v6():
    """Page Spot Trading - Version 6.0 Redesignée"""
    if REDESIGN_PAGES_AVAILABLE:
        try:
            return HTMLResponse(get_spot_trading_page_html(SIDEBAR, ""))
        except Exception as e:
            print(f"Erreur page spot-trading v6: {e}")
    return RedirectResponse("/spot-trading")

# Route /convertisseur redesignée
@app.get("/convertisseur-v6", response_class=HTMLResponse)
async def convertisseur_page_v6():
    """Page Convertisseur Crypto - Version 6.0 Redesignée"""
    if REDESIGN_PAGES_AVAILABLE:
        try:
            return HTMLResponse(get_convertisseur_page_html(SIDEBAR, ""))
        except Exception as e:
            print(f"Erreur page convertisseur v6: {e}")
    return RedirectResponse("/convertisseur")

# Route /calculatrice redesignée
@app.get("/calculatrice-v6", response_class=HTMLResponse)
async def calculatrice_page_v6():
    """Page Calculatrice Trading - Version 6.0 Redesignée"""
    if REDESIGN_PAGES_AVAILABLE:
        try:
            return HTMLResponse(get_calculatrice_page_html(SIDEBAR, ""))
        except Exception as e:
            print(f"Erreur page calculatrice v6: {e}")
    return RedirectResponse("/calculatrice")

# Route /contact redesignée
@app.get("/contact-v6", response_class=HTMLResponse)
async def contact_page_v6(request: Request):
    """Page Contact - Version 6.0 Redesignée"""
    if REDESIGN_PAGES_AVAILABLE:
        try:
            return HTMLResponse(get_contact_page_html(SIDEBAR, ""))
        except Exception as e:
            print(f"Erreur page contact v6: {e}")
    return RedirectResponse("/contact")

@app.post("/contact-v6", response_class=HTMLResponse)
async def contact_submit_v6(request: Request):
    """Soumission formulaire contact v6"""
    if REDESIGN_PAGES_AVAILABLE:
        try:
            form = await request.form()
            name = form.get("name", "")
            email = form.get("email", "")
            # Traitement du formulaire...
            return HTMLResponse(get_contact_page_html(SIDEBAR, "", pre_name=name, pre_email=email, sent=True))
        except Exception as e:
            print(f"Erreur soumission contact v6: {e}")
    return RedirectResponse("/contact")

# ============================================================================
# FIN DES ROUTES REDESIGNÉES
# ============================================================================

'''
    
    # Vérifier si les routes v6 existent déjà
    if '/strategie-v6' not in content:
        # Trouver la fin du fichier (avant if __name__ ou à la fin)
        if 'if __name__' in content:
            main_pos = content.rfind('if __name__')
            content = content[:main_pos] + new_routes + '\n' + content[main_pos:]
        else:
            content = content + new_routes
        print("✅ Routes v6 ajoutées")
    else:
        print("ℹ️ Routes v6 déjà présentes")
    
    # Sauvegarder
    with open('main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("")
    print("=" * 60)
    print("✅ INTÉGRATION TERMINÉE!")
    print("=" * 60)
    print("")
    print("📌 Nouvelles routes disponibles:")
    print("   • /strategie-v6      - Stratégies de Trading (redesignée)")
    print("   • /spot-trading-v6   - Spot Trading & Investissement (redesignée)")
    print("   • /convertisseur-v6  - Convertisseur Crypto (redesignée)")
    print("   • /calculatrice-v6   - Calculatrice Trading Pro (redesignée)")
    print("   • /contact-v6        - Page Contact (redesignée)")
    print("")
    print("🔄 Pour remplacer les anciennes routes, modifiez les redirections dans le code.")
    print("")

if __name__ == '__main__':
    apply_redesign()