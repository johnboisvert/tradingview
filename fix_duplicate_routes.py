#!/usr/bin/env python3
"""
Script pour supprimer les routes dupliquées de maintenance
et garder les routes fonctionnelles pour AI Gem Hunter et AI Technical Analysis
"""

import re

def fix_routes():
    with open('/workspace/tradingview-main/main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_len = len(content)
    
    # Supprimer la route de maintenance AI Gem Hunter (la deuxième)
    pattern_gem = r'''@app\.get\("/ai-gem-hunter"\)\nasync def _page_ai_gem_hunter\(\):.*?return _simple_page\("AI Gem Hunter", body, sidebar=SIDEBAR_FULL\)\n'''
    content = re.sub(pattern_gem, '', content, flags=re.DOTALL)
    
    # Supprimer la route de maintenance AI Technical Analysis (la deuxième)
    pattern_tech = r'''@app\.get\("/ai-technical-analysis"\)\nasync def _page_ai_technical_analysis\(\):.*?return _simple_page\("AI Technical Analysis", body, sidebar=SIDEBAR_FULL\)\n'''
    content = re.sub(pattern_tech, '', content, flags=re.DOTALL)
    
    # Vérifier si les suppressions ont fonctionné
    if len(content) < original_len:
        print(f"✅ Supprimé {original_len - len(content)} caractères de routes de maintenance")
    else:
        print("⚠️ Aucune route de maintenance trouvée avec le pattern exact")
        # Essayer une approche différente - chercher et supprimer manuellement
        lines = content.split('\n')
        new_lines = []
        skip_until_next_route = False
        skip_count = 0
        
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Détecter le début d'une route de maintenance
            if '@app.get("/ai-gem-hunter")' in line and i + 1 < len(lines) and '_page_ai_gem_hunter' in lines[i+1]:
                # Sauter cette route jusqu'à la prochaine
                skip_count = 0
                while i < len(lines):
                    if 'return _simple_page("AI Gem Hunter"' in lines[i]:
                        i += 1
                        break
                    i += 1
                    skip_count += 1
                print(f"✅ Supprimé route maintenance AI Gem Hunter ({skip_count} lignes)")
                continue
            
            if '@app.get("/ai-technical-analysis")' in line and i + 1 < len(lines) and '_page_ai_technical_analysis' in lines[i+1]:
                skip_count = 0
                while i < len(lines):
                    if 'return _simple_page("AI Technical Analysis"' in lines[i]:
                        i += 1
                        break
                    i += 1
                    skip_count += 1
                print(f"✅ Supprimé route maintenance AI Technical Analysis ({skip_count} lignes)")
                continue
            
            new_lines.append(line)
            i += 1
        
        content = '\n'.join(new_lines)
    
    with open('/workspace/tradingview-main/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Routes de maintenance supprimées")
    
    # Vérifier les routes restantes
    remaining = content.count('@app.get("/ai-gem-hunter"')
    print(f"📊 Routes /ai-gem-hunter restantes: {remaining}")
    
    remaining_tech = content.count('@app.get("/ai-technical-analysis"')
    print(f"📊 Routes /ai-technical-analysis restantes: {remaining_tech}")


if __name__ == "__main__":
    fix_routes()
