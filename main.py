#!/usr/bin/env python3
"""
SCRIPT DE VÉRIFICATION - À exécuter dans ton projet
"""

print("🔍 VÉRIFICATION DU FICHIER main.py")
print("="*60)
print()

try:
    with open('main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("✅ Fichier main.py trouvé!")
    print(f"   Taille: {len(content)/1024/1024:.2f} MB")
    print()
    
    # Vérifier la fonction get_top_50_cryptos
    if 'async def get_top_50_cryptos():' in content:
        print("✅ Fonction get_top_50_cryptos() TROUVÉE!")
        print("   → Le fichier contient le nouveau code!")
    else:
        print("❌ Fonction get_top_50_cryptos() NON TROUVÉE!")
        print("   → Tu as le MAUVAIS fichier!")
        print()
        print("SOLUTION:")
        print("1. Télécharge: main_VERIFIED_TOP50_WORKING.py")
        print("2. Renomme en: main.py")
        print("3. Remplace ton fichier actuel")
        print("4. git add main.py")
        print("5. git commit -m 'update'")
        print("6. git push origin main")
        exit(1)
    
    # Vérifier AI Signals
    ai_signals_pos = content.find('@app.get("/ai-signals"')
    if ai_signals_pos > 0:
        ai_news_pos = content.find('@app.get("/ai-news"', ai_signals_pos)
        ai_signals_code = content[ai_signals_pos:ai_news_pos]
        
        if 'for crypto in cryptos[:50]:' in ai_signals_code or 'for c in cryptos[:50]:' in ai_signals_code:
            print("✅ AI Signals boucle sur 50 cryptos!")
        else:
            print("❌ AI Signals ne boucle PAS sur 50 cryptos!")
            print("   → Le fichier est incorrect!")
    
    # Vérifier AI Gem Hunter
    gem_pos = content.find('@app.get("/ai-gem-hunter"')
    if gem_pos > 0:
        gem_code = content[gem_pos:gem_pos+5000]
        
        if 'for c in cryptos:' in gem_code and 'gem_score' in gem_code:
            print("✅ AI Gem Hunter calcule les scores!")
        else:
            print("❌ AI Gem Hunter ne calcule PAS les scores!")
    
    print()
    print("="*60)
    print()
    print("SI TOUT EST ✅:")
    print("1. git add main.py")
    print("2. git commit -m 'feat: top 50 cryptos'")
    print("3. git push origin main")
    print("4. Attends 15-20 minutes")
    print("5. Teste en mode privé")
    print()
    
except FileNotFoundError:
    print("❌ Fichier main.py NON TROUVÉ!")
    print()
    print("Tu n'es pas dans le bon dossier!")
    print("Va dans ton dossier de projet d'abord.")
