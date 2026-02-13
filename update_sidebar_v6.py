#!/usr/bin/env python3
"""
Script pour ajouter les liens v6 dans le sidebar
"""

def update_sidebar():
    print("🚀 Mise à jour du sidebar avec liens v6...")
    
    with open('main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Ajouter une section V6 dans le sidebar
    v6_menu_section = '''
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
    
    # Vérifier si déjà ajouté
    if '/strategie-v6' in content and 'Stratégies v6' in content:
        print("ℹ️ Liens v6 déjà présents dans le sidebar")
        return
    
    # Trouver où ajouter dans le sidebar (après Spot Trading)
    spot_trading_pattern = r'(<a href="/spot-trading" class="menu-item">.*?</a>)'
    
    # Simple ajout après le menu-item spot-trading existant
    if '<a href="/spot-trading" class="menu-item">' in content:
        content = content.replace(
            '</a>\n            <a href="/watchlist"',
            '</a>' + v6_menu_section + '            <a href="/watchlist"'
        )
        print("✅ Liens v6 ajoutés au sidebar")
    else:
        print("⚠️ Pattern non trouvé, ajout manuel nécessaire")
    
    with open('main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Sidebar mis à jour!")

if __name__ == '__main__':
    update_sidebar()