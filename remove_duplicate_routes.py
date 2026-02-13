#!/usr/bin/env python3
"""
Script pour supprimer les routes dupliquées dans main.py
Garde les premières versions (avant ligne 30000) qui utilisent les nouvelles fonctions redesign
"""

def remove_duplicates():
    print("🔧 Suppression des routes dupliquées...")
    
    with open('main.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Nombre de lignes avant: {len(lines)}")
    
    # Routes à vérifier pour duplication
    routes_to_check = [
        ('@app.get("/strategie"', 38231),
        ('@app.get("/spot-trading"', 41408),
        ('@app.get("/convertisseur"', 44006),
        ('@app.get("/calculatrice"', 52613),
    ]
    
    # Trouver les blocs de fonctions dupliquées à supprimer
    # On va identifier le début et la fin de chaque fonction dupliquée
    
    blocks_to_remove = []
    
    for route_pattern, start_line in routes_to_check:
        # Trouver le début de la fonction (ligne avec @app.get)
        func_start = start_line - 1  # Index 0-based
        
        # Chercher la fin de la fonction (prochaine ligne avec @app ou fin de fichier)
        func_end = func_start + 1
        while func_end < len(lines):
            line = lines[func_end].strip()
            # Nouvelle route ou fin de fichier
            if line.startswith('@app.') or line.startswith('if __name__'):
                break
            func_end += 1
        
        # Inclure les commentaires avant la fonction
        comment_start = func_start
        while comment_start > 0 and (lines[comment_start - 1].strip().startswith('#') or lines[comment_start - 1].strip() == ''):
            comment_start -= 1
        
        blocks_to_remove.append((comment_start, func_end, route_pattern))
        print(f"  Route {route_pattern}: lignes {comment_start + 1} à {func_end}")
    
    # Trier les blocs par position décroissante pour supprimer de la fin vers le début
    blocks_to_remove.sort(key=lambda x: x[0], reverse=True)
    
    # Supprimer les blocs
    for start, end, route in blocks_to_remove:
        print(f"  Suppression du bloc {route} (lignes {start + 1} à {end})")
        del lines[start:end]
    
    print(f"Nombre de lignes après: {len(lines)}")
    
    # Sauvegarder
    with open('main.py', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print("✅ Routes dupliquées supprimées!")

if __name__ == '__main__':
    # Créer une sauvegarde d'abord
    import shutil
    shutil.copy('main.py', 'main.py.backup_before_dedup')
    print("📦 Sauvegarde créée: main.py.backup_before_dedup")
    
    remove_duplicates()