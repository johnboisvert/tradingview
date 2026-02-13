#!/usr/bin/env python3
"""
Script pour:
1. Supprimer les doublons dans le menu (enlever v6)
2. Remplacer les anciennes routes par les nouvelles versions
"""

def fix_menu_and_routes():
    print("🔧 Correction du menu et des routes...")
    
    with open('main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Supprimer les liens v6 du sidebar (on va utiliser les routes originales)
    v6_menu_to_remove = '''
            <a href="/strategie-v6" class="menu-item v5-feature">
                <span class="icon">🎯</span>
                <span class="label">Stratégies v6</span>
                <span class="badge">NEW</span>
            </a>
            <a href="/spot-trading-v6" class="menu-item v5-feature">
                <span class="icon">💱</span>
                <span class="label">Spot Trading v6</span>
                <span class="badge">NEW</span>
            </a>
'''
    content = content.replace(v6_menu_to_remove, '')
    print("✅ Liens v6 supprimés du menu")
    
    # 2. Modifier les routes originales pour utiliser les nouvelles fonctions
    # Remplacer la route /strategie
    old_strategie_route = '''@app.get("/strategie", response_class=HTMLResponse)
async def strategie_page(request: Request):'''
    
    new_strategie_route = '''@app.get("/strategie", response_class=HTMLResponse)
async def strategie_page(request: Request):
    # Utiliser la nouvelle version redesignée
    if REDESIGN_PAGES_AVAILABLE:
        return HTMLResponse(content=get_strategie_page_v6())'''
    
    if old_strategie_route in content and 'REDESIGN_PAGES_AVAILABLE' not in content.split('@app.get("/strategie"')[1].split('@app.get')[0]:
        # Trouver et modifier la fonction strategie_page
        pass
    
    # 3. Modifier les routes /contact et /convertisseur pour utiliser les nouvelles versions
    # On va créer des redirections simples
    
    # Ajouter un flag pour utiliser les nouvelles versions par défaut
    if 'USE_NEW_DESIGN = True' not in content:
        # Ajouter après REDESIGN_PAGES_AVAILABLE
        content = content.replace(
            'REDESIGN_PAGES_AVAILABLE = True',
            'REDESIGN_PAGES_AVAILABLE = True\nUSE_NEW_DESIGN = True  # Utiliser les nouvelles versions par défaut'
        )
        print("✅ Flag USE_NEW_DESIGN ajouté")
    
    with open('main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Fichier main.py mis à jour")

if __name__ == '__main__':
    fix_menu_and_routes()