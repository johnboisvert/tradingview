#!/usr/bin/env python3
"""
Script pour ajouter temporairement les pages AI aux routes publiques
afin de pouvoir tester et corriger les problèmes de CSS.
"""

import re

def fix_ai_pages_access():
    with open('main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Trouver et modifier les PUBLIC_PATHS dans le PermissionMiddleware
    old_public_paths = '''PUBLIC_PATHS = {
            "/", "/health", "/favicon.ico",
            "/login", "/logout", "/register",
            "/admin-login",
            "/contact", "/pricing", "/pricing-complete",
            "/telechargements", "/crypto-pepites",
            "/academy",
            "/crypto-academy",
            "/trading-academy",
            "/tv-webhook",
        }'''
    
    new_public_paths = '''PUBLIC_PATHS = {
            "/", "/health", "/favicon.ico",
            "/login", "/logout", "/register",
            "/admin-login",
            "/contact", "/pricing", "/pricing-complete",
            "/telechargements", "/crypto-pepites",
            "/academy",
            "/crypto-academy",
            "/trading-academy",
            "/tv-webhook",
            # Pages AI temporairement publiques pour tests CSS
            "/ai-whale-watcher",
            "/ai-opportunity-scanner", 
            "/ai-market-regime",
            "/ai-assistant",
            "/ai-news",
            "/ai-signals",
            "/ai-token-scanner",
            "/ai-alerts",
            "/ai-setup-builder",
        }'''
    
    if old_public_paths in content:
        content = content.replace(old_public_paths, new_public_paths)
        print("✅ PUBLIC_PATHS mis à jour avec les pages AI")
    else:
        print("⚠️ PUBLIC_PATHS non trouvé dans le format attendu, recherche alternative...")
        # Recherche alternative avec regex
        pattern = r'(PUBLIC_PATHS\s*=\s*\{[^}]+"/tv-webhook",\s*\})'
        match = re.search(pattern, content)
        if match:
            old_block = match.group(1)
            new_block = old_block.replace(
                '"/tv-webhook",',
                '''"/tv-webhook",
            # Pages AI temporairement publiques pour tests CSS
            "/ai-whale-watcher",
            "/ai-opportunity-scanner", 
            "/ai-market-regime",
            "/ai-assistant",
            "/ai-news",
            "/ai-signals",
            "/ai-token-scanner",
            "/ai-alerts",
            "/ai-setup-builder",'''
            )
            content = content.replace(old_block, new_block)
            print("✅ PUBLIC_PATHS mis à jour via regex")
        else:
            print("❌ Impossible de trouver PUBLIC_PATHS")
            return False
    
    with open('main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Fichier main.py mis à jour")
    return True

if __name__ == "__main__":
    fix_ai_pages_access()