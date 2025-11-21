"""
Promo Codes System - Trading Dashboard Pro
Gestion complète des codes promotionnels
"""

import os
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict


class PromoCodeManager:
    """Gestionnaire de codes promotionnels"""
    
    @staticmethod
    def generate_code(length: int = 8, prefix: str = "") -> str:
        """Génère un code promo aléatoire"""
        chars = string.ascii_uppercase + string.digits
        code = ''.join(secrets.choice(chars) for _ in range(length))
        return f"{prefix}{code}" if prefix else code
    
    @staticmethod
    def create_promo_code(
        conn,
        code: str,
        discount_type: str,  # 'percent' ou 'fixed'
        discount_value: float,
        max_uses: Optional[int] = None,
        expires_at: Optional[datetime] = None,
        min_amount: Optional[float] = None,
        plans: Optional[str] = None,  # CSV: "1_month,3_months" ou None pour tous
        description: str = ""
    ) -> Tuple[bool, str]:
        """Crée un code promo dans la base de données"""
        
        try:
            c = conn.cursor()
            
            # Vérifier si le code existe déjà
            c.execute("SELECT code FROM promo_codes WHERE code = ?", (code.upper(),))
            if c.fetchone():
                return False, "Code déjà existant"
            
            # Valider discount_type
            if discount_type not in ['percent', 'fixed']:
                return False, "Type de réduction invalide (percent ou fixed)"
            
            # Valider discount_value
            if discount_type == 'percent' and (discount_value <= 0 or discount_value > 100):
                return False, "Pourcentage doit être entre 0 et 100"
            if discount_type == 'fixed' and discount_value <= 0:
                return False, "Montant fixe doit être positif"
            
            # Insérer le code promo
            c.execute("""
                INSERT INTO promo_codes (
                    code, discount_type, discount_value, max_uses, 
                    current_uses, expires_at, min_amount, applicable_plans,
                    description, created_at, is_active
                )
                VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 1)
            """, (
                code.upper(),
                discount_type,
                discount_value,
                max_uses,
                expires_at.isoformat() if expires_at else None,
                min_amount,
                plans,
                description,
                datetime.now().isoformat()
            ))
            
            conn.commit()
            
            print(f"✅ Code promo créé: {code.upper()} (-{discount_value}{'%' if discount_type == 'percent' else '$'})")
            return True, "Code créé avec succès"
            
        except Exception as e:
            print(f"❌ Erreur création code promo: {e}")
            return False, str(e)
    
    @staticmethod
    def validate_promo_code(
        conn,
        code: str,
        plan: str,
        amount: float
    ) -> Tuple[bool, str, Optional[float]]:
        """
        Valide un code promo et retourne le montant de la réduction
        
        Returns:
            (is_valid, message, discount_amount)
        """
        
        try:
            c = conn.cursor()
            
            # Récupérer le code
            c.execute("""
                SELECT code, discount_type, discount_value, max_uses, current_uses,
                       expires_at, min_amount, applicable_plans, is_active
                FROM promo_codes 
                WHERE code = ?
            """, (code.upper(),))
            
            row = c.fetchone()
            
            if not row:
                return False, "❌ Code promo invalide", None
            
            (db_code, discount_type, discount_value, max_uses, current_uses,
             expires_at, min_amount, applicable_plans, is_active) = row
            
            # Vérifier si actif
            if not is_active:
                return False, "❌ Code promo désactivé", None
            
            # Vérifier expiration
            if expires_at:
                expiry = datetime.fromisoformat(expires_at)
                if datetime.now() > expiry:
                    return False, "❌ Code promo expiré", None
            
            # Vérifier nombre d'utilisations
            if max_uses and current_uses >= max_uses:
                return False, "❌ Code promo épuisé", None
            
            # Vérifier montant minimum
            if min_amount and amount < min_amount:
                return False, f"❌ Montant minimum ${min_amount:.2f} requis", None
            
            # Vérifier plans applicables
            if applicable_plans:
                allowed_plans = [p.strip() for p in applicable_plans.split(',')]
                if plan not in allowed_plans:
                    return False, f"❌ Code non valide pour ce plan", None
            
            # Calculer la réduction
            if discount_type == 'percent':
                discount_amount = amount * (discount_value / 100)
            else:  # fixed
                discount_amount = min(discount_value, amount)  # Ne peut pas être > amount
            
            return True, f"✅ Réduction: ${discount_amount:.2f}", discount_amount
            
        except Exception as e:
            print(f"❌ Erreur validation code promo: {e}")
            return False, "Erreur de validation", None
    
    @staticmethod
    def use_promo_code(conn, code: str, username: str) -> bool:
        """Incrémente le compteur d'utilisation d'un code promo"""
        try:
            c = conn.cursor()
            
            # Incrémenter current_uses
            c.execute("""
                UPDATE promo_codes 
                SET current_uses = current_uses + 1,
                    last_used_at = ?,
                    last_used_by = ?
                WHERE code = ?
            """, (datetime.now().isoformat(), username, code.upper()))
            
            conn.commit()
            
            print(f"✅ Code promo utilisé: {code.upper()} par {username}")
            return True
            
        except Exception as e:
            print(f"❌ Erreur utilisation code promo: {e}")
            return False
    
    @staticmethod
    def deactivate_promo_code(conn, code: str) -> bool:
        """Désactive un code promo"""
        try:
            c = conn.cursor()
            c.execute("UPDATE promo_codes SET is_active = 0 WHERE code = ?", (code.upper(),))
            conn.commit()
            print(f"✅ Code promo désactivé: {code.upper()}")
            return True
        except Exception as e:
            print(f"❌ Erreur désactivation: {e}")
            return False
    
    @staticmethod
    def get_all_promo_codes(conn):
        """Récupère tous les codes promo"""
        try:
            c = conn.cursor()
            c.execute("""
                SELECT code, discount_type, discount_value, max_uses, current_uses,
                       expires_at, min_amount, applicable_plans, description,
                       is_active, created_at, last_used_at
                FROM promo_codes
                ORDER BY created_at DESC
            """)
            return c.fetchall()
        except Exception as e:
            print(f"❌ Erreur récupération codes: {e}")
            return []
    
    @staticmethod
    def get_promo_stats(conn) -> Dict:
        """Statistiques des codes promo"""
        try:
            c = conn.cursor()
            
            # Total codes
            c.execute("SELECT COUNT(*) FROM promo_codes")
            total_codes = c.fetchone()[0]
            
            # Codes actifs
            c.execute("SELECT COUNT(*) FROM promo_codes WHERE is_active = 1")
            active_codes = c.fetchone()[0]
            
            # Total utilisations
            c.execute("SELECT SUM(current_uses) FROM promo_codes")
            total_uses = c.fetchone()[0] or 0
            
            # Code le plus utilisé
            c.execute("""
                SELECT code, current_uses 
                FROM promo_codes 
                ORDER BY current_uses DESC 
                LIMIT 1
            """)
            most_used = c.fetchone()
            
            return {
                'total_codes': total_codes,
                'active_codes': active_codes,
                'total_uses': total_uses,
                'most_used_code': most_used[0] if most_used else None,
                'most_used_count': most_used[1] if most_used else 0
            }
            
        except Exception as e:
            print(f"❌ Erreur stats: {e}")
            return {}


def create_promo_codes_table(conn):
    """Crée la table promo_codes si elle n'existe pas"""
    try:
        c = conn.cursor()
        
        c.execute("""
            CREATE TABLE IF NOT EXISTS promo_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                discount_type TEXT NOT NULL,
                discount_value REAL NOT NULL,
                max_uses INTEGER,
                current_uses INTEGER DEFAULT 0,
                expires_at TEXT,
                min_amount REAL,
                applicable_plans TEXT,
                description TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                last_used_at TEXT,
                last_used_by TEXT
            )
        """)
        
        conn.commit()
        print("✅ Table promo_codes créée/vérifiée")
        return True
        
    except Exception as e:
        print(f"❌ Erreur création table: {e}")
        return False


# Pour tester
if __name__ == "__main__":
    import sqlite3
    
    print("=" * 60)
    print("🧪 TEST PROMO CODES SYSTEM")
    print("=" * 60)
    
    # Créer DB test
    conn = sqlite3.connect(':memory:')
    create_promo_codes_table(conn)
    
    # Test 1: Créer des codes
    print("\n1️⃣ Création de codes promo:")
    
    # Code 1: 20% de réduction
    PromoCodeManager.create_promo_code(
        conn,
        code="WELCOME20",
        discount_type="percent",
        discount_value=20,
        description="20% de réduction pour nouveaux clients"
    )
    
    # Code 2: $10 de réduction, max 50 utilisations
    PromoCodeManager.create_promo_code(
        conn,
        code="SAVE10",
        discount_type="fixed",
        discount_value=10.00,
        max_uses=50,
        description="$10 de réduction, 50 utilisations max"
    )
    
    # Code 3: 50% mais expire dans 7 jours, montant min $50
    PromoCodeManager.create_promo_code(
        conn,
        code="FLASH50",
        discount_type="percent",
        discount_value=50,
        expires_at=datetime.now() + timedelta(days=7),
        min_amount=50.00,
        description="Flash sale 50%"
    )
    
    # Code 4: Uniquement pour plans 6 mois et 1 an
    PromoCodeManager.create_promo_code(
        conn,
        code="LONGTERM25",
        discount_type="percent",
        discount_value=25,
        plans="6_months,1_year",
        description="25% pour abonnements longs"
    )
    
    # Test 2: Valider des codes
    print("\n2️⃣ Validation de codes promo:")
    
    # Test WELCOME20 sur plan 1 mois ($29.99)
    valid, msg, discount = PromoCodeManager.validate_promo_code(conn, "WELCOME20", "1_month", 29.99)
    print(f"   WELCOME20 sur $29.99: {msg} (discount: ${discount:.2f})")
    
    # Test SAVE10 sur plan 1 mois ($29.99)
    valid, msg, discount = PromoCodeManager.validate_promo_code(conn, "SAVE10", "1_month", 29.99)
    print(f"   SAVE10 sur $29.99: {msg} (discount: ${discount:.2f})")
    
    # Test FLASH50 sur plan 3 mois ($74.97) - devrait marcher
    valid, msg, discount = PromoCodeManager.validate_promo_code(conn, "FLASH50", "3_months", 74.97)
    discount_str = f"${discount:.2f}" if discount else "$0.00"
    print(f"   FLASH50 sur $74.97: {msg} (discount: {discount_str})")
    
    # Test FLASH50 sur plan 1 mois ($29.99) - montant trop bas
    valid, msg, discount = PromoCodeManager.validate_promo_code(conn, "FLASH50", "1_month", 29.99)
    print(f"   FLASH50 sur $29.99: {msg}")
    
    # Test LONGTERM25 sur plan 1 mois - pas applicable
    valid, msg, discount = PromoCodeManager.validate_promo_code(conn, "LONGTERM25", "1_month", 29.99)
    print(f"   LONGTERM25 sur 1_month: {msg}")
    
    # Test LONGTERM25 sur plan 1 an - devrait marcher
    valid, msg, discount = PromoCodeManager.validate_promo_code(conn, "LONGTERM25", "1_year", 239.88)
    discount_str = f"${discount:.2f}" if discount else "$0.00"
    print(f"   LONGTERM25 sur $239.88: {msg} (discount: {discount_str})")
    
    # Test 3: Utiliser un code
    print("\n3️⃣ Utilisation de codes:")
    PromoCodeManager.use_promo_code(conn, "WELCOME20", "testuser1")
    PromoCodeManager.use_promo_code(conn, "SAVE10", "testuser2")
    
    # Test 4: Statistiques
    print("\n4️⃣ Statistiques:")
    stats = PromoCodeManager.get_promo_stats(conn)
    print(f"   Total codes: {stats['total_codes']}")
    print(f"   Codes actifs: {stats['active_codes']}")
    print(f"   Total utilisations: {stats['total_uses']}")
    print(f"   Code le plus utilisé: {stats['most_used_code']} ({stats['most_used_count']} fois)")
    
    # Test 5: Liste tous les codes
    print("\n5️⃣ Liste des codes:")
    codes = PromoCodeManager.get_all_promo_codes(conn)
    for code_data in codes:
        code, dtype, value, max_u, curr_u = code_data[:5]
        symbol = '%' if dtype == 'percent' else '$'
        print(f"   {code}: -{value}{symbol} ({curr_u}/{max_u if max_u else '∞'} utilisations)")
    
    conn.close()
    
    print("\n✅ Tests terminés!")
