#!/usr/bin/env python3
"""
Script pour remplacer les anciennes routes par les nouvelles versions redesignées
"""

def replace_routes():
    print("🔧 Remplacement des routes par les nouvelles versions...")
    
    with open('main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Modifier la route /strategie pour utiliser la nouvelle version
    # Chercher la fonction et ajouter un return au début si REDESIGN disponible
    
    old_strategie = '''@app.get("/strategie", response_class=HTMLResponse)
async def strategie_page(request: Request):
    """Page des stratégies de trading"""'''
    
    new_strategie = '''@app.get("/strategie", response_class=HTMLResponse)
async def strategie_page(request: Request):
    """Page des stratégies de trading - Version redesignée"""
    if REDESIGN_PAGES_AVAILABLE:
        return HTMLResponse(content=get_strategie_page_v6())'''
    
    if old_strategie in content:
        content = content.replace(old_strategie, new_strategie)
        print("✅ Route /strategie mise à jour")
    else:
        print("⚠️ Route /strategie non trouvée dans le format attendu")
    
    # 2. Modifier la route /spot-trading
    old_spot = '''@app.get("/spot-trading", response_class=HTMLResponse)
async def spot_trading_page(request: Request):
    """Page Spot Trading"""'''
    
    new_spot = '''@app.get("/spot-trading", response_class=HTMLResponse)
async def spot_trading_page(request: Request):
    """Page Spot Trading - Version redesignée"""
    if REDESIGN_PAGES_AVAILABLE:
        return HTMLResponse(content=get_spot_trading_page_v6())'''
    
    if old_spot in content:
        content = content.replace(old_spot, new_spot)
        print("✅ Route /spot-trading mise à jour")
    else:
        print("⚠️ Route /spot-trading non trouvée dans le format attendu")
    
    # 3. Modifier la route /contact
    old_contact = '''@app.get("/contact", response_class=HTMLResponse)
async def contact_page(request: Request):
    """Page de contact"""'''
    
    new_contact = '''@app.get("/contact", response_class=HTMLResponse)
async def contact_page(request: Request):
    """Page de contact - Version redesignée"""
    if REDESIGN_PAGES_AVAILABLE:
        return HTMLResponse(content=get_contact_page_v6())'''
    
    if old_contact in content:
        content = content.replace(old_contact, new_contact)
        print("✅ Route /contact mise à jour")
    else:
        print("⚠️ Route /contact non trouvée dans le format attendu")
    
    # 4. Modifier la route /convertisseur
    old_convert = '''@app.get("/convertisseur", response_class=HTMLResponse)
async def convertisseur_page(request: Request):
    """Page convertisseur crypto"""'''
    
    new_convert = '''@app.get("/convertisseur", response_class=HTMLResponse)
async def convertisseur_page(request: Request):
    """Page convertisseur crypto - Version redesignée"""
    if REDESIGN_PAGES_AVAILABLE:
        return HTMLResponse(content=get_convertisseur_page_v6())'''
    
    if old_convert in content:
        content = content.replace(old_convert, new_convert)
        print("✅ Route /convertisseur mise à jour")
    else:
        print("⚠️ Route /convertisseur non trouvée dans le format attendu")
    
    # 5. Modifier la route /calculatrice
    old_calc = '''@app.get("/calculatrice", response_class=HTMLResponse)
async def calculatrice_page(request: Request):
    """Page calculatrice trading"""'''
    
    new_calc = '''@app.get("/calculatrice", response_class=HTMLResponse)
async def calculatrice_page(request: Request):
    """Page calculatrice trading - Version redesignée"""
    if REDESIGN_PAGES_AVAILABLE:
        return HTMLResponse(content=get_calculatrice_page_v6())'''
    
    if old_calc in content:
        content = content.replace(old_calc, new_calc)
        print("✅ Route /calculatrice mise à jour")
    else:
        print("⚠️ Route /calculatrice non trouvée dans le format attendu")
    
    with open('main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n✅ Toutes les routes ont été mises à jour!")

if __name__ == '__main__':
    replace_routes()