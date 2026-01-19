#!/usr/bin/env python3
"""
Script de Test Coinbase Commerce
Utilisez ce script pour vérifier que votre configuration Coinbase fonctionne
"""

import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

print("=" * 60)
print("🧪 TEST COINBASE COMMERCE")
print("=" * 60)

# 1. Vérifier les variables d'environnement
print("\n1️⃣ Vérification des variables d'environnement...")
COINBASE_KEY = os.getenv("COINBASE_COMMERCE_KEY", "")
COINBASE_SECRET = os.getenv("COINBASE_WEBHOOK_SECRET", "")

if COINBASE_KEY:
    print(f"✅ COINBASE_COMMERCE_KEY: Configuré ({len(COINBASE_KEY)} caractères)")
else:
    print("❌ COINBASE_COMMERCE_KEY: MANQUANT!")
    print("   → Ajoutez cette variable dans Railway")
    exit(1)

if COINBASE_SECRET:
    print(f"✅ COINBASE_WEBHOOK_SECRET: Configuré ({len(COINBASE_SECRET)} caractères)")
else:
    print("⚠️  COINBASE_WEBHOOK_SECRET: Non configuré (optionnel)")

# 2. Vérifier l'installation du package
print("\n2️⃣ Vérification du package coinbase-commerce...")
try:
    from coinbase_commerce.client import Client
    print("✅ Package coinbase-commerce installé")
except ImportError:
    print("❌ Package coinbase-commerce NON installé!")
    print("   → Exécutez: pip install coinbase-commerce")
    exit(1)

# 3. Tester la connexion
print("\n3️⃣ Test de connexion à l'API Coinbase...")
try:
    client = Client(api_key=COINBASE_KEY)
    print("✅ Client Coinbase initialisé")
except Exception as e:
    print(f"❌ Erreur d'initialisation: {e}")
    exit(1)

# 4. Créer une charge de test
print("\n4️⃣ Création d'une charge de test...")
try:
    charge = client.charge.create(
        name='TEST - Trading Dashboard Pro',
        description='Charge de test - NE PAS PAYER',
        pricing_type='fixed_price',
        local_price={
            'amount': '1.00',
            'currency': 'USD'
        },
        metadata={
            'test': 'true',
            'plan': 'test'
        }
    )
    
    print(f"✅ Charge créée avec succès!")
    print(f"   ID: {charge.id}")
    print(f"   URL: {charge.hosted_url}")
    print(f"   Montant: {charge.pricing.local.amount} {charge.pricing.local.currency}")
    
    # Vérifier que hosted_url existe
    if hasattr(charge, 'hosted_url') and charge.hosted_url:
        print(f"\n✅ TOUT FONCTIONNE!")
        print(f"   Votre Coinbase Commerce est correctement configuré")
        print(f"   URL de test: {charge.hosted_url}")
        print(f"\n⚠️  IMPORTANT: C'est une charge de TEST. Ne la payez pas!")
    else:
        print(f"\n⚠️  Charge créée mais pas de hosted_url")
        print(f"   Vérifiez votre compte Coinbase Commerce")
        
except Exception as e:
    print(f"❌ Erreur lors de la création: {e}")
    print(f"\nDétails:")
    import traceback
    traceback.print_exc()
    exit(1)

# 5. Résumé
print("\n" + "=" * 60)
print("📊 RÉSUMÉ")
print("=" * 60)
print("✅ Configuration Coinbase: OK")
print("✅ Package installé: OK")
print("✅ Connexion API: OK")
print("✅ Création de charge: OK")
print("\n🎉 Votre Coinbase Commerce est prêt à l'emploi!")
print("\nVous pouvez maintenant déployer sur Railway.")
print("=" * 60)
