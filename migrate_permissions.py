"""
Script de migration de base de données
Ajoute les colonnes nécessaires pour le système de permissions
"""

from sqlalchemy import create_engine, text, inspect
from datetime import datetime
import os

# Utilise la même DB que ton main.py
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trading_dashboard.db")

# Si PostgreSQL sur Railway, corriger l'URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

def run_migration():
    """Exécute la migration pour ajouter les colonnes de permissions"""
    
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    # Vérifier si la table users existe
    if 'users' not in inspector.get_table_names():
        print("❌ Table 'users' introuvable. Crée d'abord ta table users.")
        return False
    
    # Liste des colonnes existantes
    existing_columns = [col['name'] for col in inspector.get_columns('users')]
    
    print("🔍 Colonnes existantes:", existing_columns)
    
    # Colonnes à ajouter
    new_columns = {
        'subscription_plan': "VARCHAR(50) DEFAULT 'free'",
        'subscription_start': "TIMESTAMP NULL",
        'subscription_end': "TIMESTAMP NULL",
        'stripe_customer_id': "VARCHAR(255) NULL",
        'stripe_subscription_id': "VARCHAR(255) NULL",
        'coinbase_customer_id': "VARCHAR(255) NULL",
        'payment_method': "VARCHAR(50) NULL",  # 'stripe' ou 'coinbase'
        'last_payment_date': "TIMESTAMP NULL",
        'total_spent': "DECIMAL(10,2) DEFAULT 0.00"
    }
    
    with engine.connect() as conn:
        # Ajouter chaque colonne si elle n'existe pas
        for col_name, col_definition in new_columns.items():
            if col_name not in existing_columns:
                try:
                    # SQLite
                    if 'sqlite' in DATABASE_URL:
                        sql = f"ALTER TABLE users ADD COLUMN {col_name} {col_definition}"
                    # PostgreSQL
                    else:
                        sql = f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_definition}"
                    
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"✅ Colonne '{col_name}' ajoutée avec succès")
                except Exception as e:
                    print(f"⚠️  Erreur ajout colonne '{col_name}': {e}")
            else:
                print(f"ℹ️  Colonne '{col_name}' existe déjà")
    
    print("\n✨ Migration terminée!")
    print("\n📊 Colonnes finales dans la table 'users':")
    
    # Afficher la structure finale
    final_columns = inspector.get_columns('users')
    for col in final_columns:
        print(f"   - {col['name']}: {col['type']}")
    
    return True

def verify_migration():
    """Vérifie que toutes les colonnes sont bien présentes"""
    
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    required_columns = [
        'subscription_plan',
        'subscription_start',
        'subscription_end',
        'stripe_customer_id',
        'stripe_subscription_id'
    ]
    
    existing_columns = [col['name'] for col in inspector.get_columns('users')]
    
    missing = [col for col in required_columns if col not in existing_columns]
    
    if missing:
        print(f"\n❌ Colonnes manquantes: {missing}")
        return False
    else:
        print("\n✅ Toutes les colonnes de permissions sont présentes!")
        return True

def create_test_users():
    """Crée des utilisateurs de test pour chaque plan"""
    
    engine = create_engine(DATABASE_URL)
    
    from datetime import timedelta
    now = datetime.now()
    
    test_users = [
        {
            'email': 'free@test.com',
            'password_hash': 'hashed_password_here',
            'subscription_plan': 'free',
            'subscription_start': None,
            'subscription_end': None
        },
        {
            'email': 'premium@test.com',
            'password_hash': 'hashed_password_here',
            'subscription_plan': '1_month',
            'subscription_start': now,
            'subscription_end': now + timedelta(days=30)
        },
        {
            'email': 'advanced@test.com',
            'password_hash': 'hashed_password_here',
            'subscription_plan': '3_months',
            'subscription_start': now,
            'subscription_end': now + timedelta(days=90)
        },
        {
            'email': 'pro@test.com',
            'password_hash': 'hashed_password_here',
            'subscription_plan': '6_months',
            'subscription_start': now,
            'subscription_end': now + timedelta(days=180)
        },
        {
            'email': 'elite@test.com',
            'password_hash': 'hashed_password_here',
            'subscription_plan': '1_year',
            'subscription_start': now,
            'subscription_end': now + timedelta(days=365)
        }
    ]
    
    with engine.connect() as conn:
        for user in test_users:
            try:
                # Vérifier si l'email existe déjà
                check = conn.execute(
                    text("SELECT id FROM users WHERE email = :email"),
                    {"email": user['email']}
                ).fetchone()
                
                if not check:
                    # Insérer le nouvel utilisateur
                    conn.execute(
                        text("""
                            INSERT INTO users (
                                email, password_hash, subscription_plan, 
                                subscription_start, subscription_end
                            ) VALUES (
                                :email, :password_hash, :subscription_plan,
                                :subscription_start, :subscription_end
                            )
                        """),
                        user
                    )
                    conn.commit()
                    print(f"✅ Utilisateur test créé: {user['email']} ({user['subscription_plan']})")
                else:
                    print(f"ℹ️  Utilisateur {user['email']} existe déjà")
            
            except Exception as e:
                print(f"❌ Erreur création utilisateur {user['email']}: {e}")
    
    print("\n🎉 Utilisateurs de test créés!")
    print("\n📝 Comptes de test disponibles:")
    for user in test_users:
        print(f"   Email: {user['email']}")
        print(f"   Plan: {user['subscription_plan']}")
        print(f"   Mot de passe: (utilise ton système de hash)")
        print()

def rollback_migration():
    """Annule la migration (supprime les colonnes ajoutées)"""
    
    print("⚠️  ATTENTION: Cette action va supprimer les colonnes de permissions!")
    response = input("Es-tu sûr de vouloir continuer? (oui/non): ")
    
    if response.lower() != 'oui':
        print("❌ Migration rollback annulé")
        return
    
    engine = create_engine(DATABASE_URL)
    
    columns_to_remove = [
        'subscription_plan',
        'subscription_start',
        'subscription_end',
        'stripe_customer_id',
        'stripe_subscription_id',
        'coinbase_customer_id',
        'payment_method',
        'last_payment_date',
        'total_spent'
    ]
    
    with engine.connect() as conn:
        for col_name in columns_to_remove:
            try:
                # Note: SQLite ne supporte pas DROP COLUMN avant 3.35.0
                if 'sqlite' in DATABASE_URL:
                    print(f"⚠️  SQLite: Impossible de supprimer '{col_name}' automatiquement")
                else:
                    sql = f"ALTER TABLE users DROP COLUMN IF EXISTS {col_name}"
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"✅ Colonne '{col_name}' supprimée")
            except Exception as e:
                print(f"❌ Erreur suppression '{col_name}': {e}")
    
    print("\n✨ Rollback terminé")

# ============================================================================
# MENU PRINCIPAL
# ============================================================================

if __name__ == "__main__":
    print("""
╔═══════════════════════════════════════════════════════════════╗
║          MIGRATION DATABASE - SYSTÈME DE PERMISSIONS          ║
╚═══════════════════════════════════════════════════════════════╝
    """)
    
    print("Options disponibles:")
    print("1. Exécuter la migration (ajouter colonnes)")
    print("2. Vérifier la migration")
    print("3. Créer des utilisateurs de test")
    print("4. Rollback (supprimer colonnes)")
    print("5. Tout exécuter (migration + test users)")
    print("0. Quitter")
    print()
    
    choice = input("Choix: ")
    
    if choice == "1":
        run_migration()
    elif choice == "2":
        verify_migration()
    elif choice == "3":
        create_test_users()
    elif choice == "4":
        rollback_migration()
    elif choice == "5":
        if run_migration():
            if verify_migration():
                create_test_users()
    elif choice == "0":
        print("👋 Au revoir!")
    else:
        print("❌ Choix invalide")
