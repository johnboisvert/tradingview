# promo_codes.py - Système de gestion des codes promotionnels
from datetime import datetime, timedelta
from typing import Optional, Tuple, List, Dict

class PromoCodeManager:
    """Gestionnaire de codes promotionnels pour Trading Dashboard Pro"""
    
    @staticmethod
    def create_table(conn):
        """Crée la table promo_codes dans la base de données"""
        try:
            c = conn.cursor()
            
            # Détecter si PostgreSQL ou SQLite
            is_postgres = hasattr(conn, 'server_version')
            
            if is_postgres:
                c.execute("""
                    CREATE TABLE IF NOT EXISTS promo_codes (
                        id SERIAL PRIMARY KEY,
                        code VARCHAR(50) UNIQUE NOT NULL,
                        discount_type VARCHAR(10) NOT NULL,
                        discount_value REAL NOT NULL,
                        description TEXT,
                        max_uses INTEGER,
                        used_count INTEGER DEFAULT 0,
                        expires_at TIMESTAMP,
                        min_amount REAL,
                        applicable_plans TEXT,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        total_discount_given REAL DEFAULT 0
                    )
                """)
            else:
                c.execute("""
                    CREATE TABLE IF NOT EXISTS promo_codes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        code TEXT UNIQUE NOT NULL,
                        discount_type TEXT NOT NULL,
                        discount_value REAL NOT NULL,
                        description TEXT,
                        max_uses INTEGER,
                        used_count INTEGER DEFAULT 0,
                        expires_at TEXT,
                        min_amount REAL,
                        applicable_plans TEXT,
                        is_active INTEGER DEFAULT 1,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        total_discount_given REAL DEFAULT 0
                    )
                """)
            
            conn.commit()
            print("✅ Table promo_codes créée/vérifiée")
            return True
            
        except Exception as e:
            print(f"❌ Erreur création table: {e}")
            return False
    
    @staticmethod
    def create_promo_code(
        conn,
        code: str,
        discount_type: str,
        discount_value: float,
        description: str = "",
        max_uses: Optional[int] = None,
        expires_at: Optional[str] = None,
        min_amount: Optional[float] = None,
        applicable_plans: Optional[str] = None
    ) -> Tuple[bool, str]:
        """Crée un nouveau code promo"""
        try:
            c = conn.cursor()
            code_upper = code.upper()
            
            # Vérifier si existe déjà
            c.execute("SELECT code FROM promo_codes WHERE code = %s" if hasattr(conn, 'server_version') else "SELECT code FROM promo_codes WHERE code = ?", (code_upper,))
            if c.fetchone():
                return False, f"Code {code_upper} existe déjà"
            
            # Insérer
            if hasattr(conn, 'server_version'):  # PostgreSQL
                c.execute("""
                    INSERT INTO promo_codes 
                    (code, discount_type, discount_value, description, max_uses, expires_at, min_amount, applicable_plans)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (code_upper, discount_type, discount_value, description, max_uses, expires_at, min_amount, applicable_plans))
            else:  # SQLite
                c.execute("""
                    INSERT INTO promo_codes 
                    (code, discount_type, discount_value, description, max_uses, expires_at, min_amount, applicable_plans)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (code_upper, discount_type, discount_value, description, max_uses, expires_at, min_amount, applicable_plans))
            
            conn.commit()
            print(f"✅ Code {code_upper} créé")
            return True, f"Code {code_upper} créé"
            
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return False, str(e)
    
    @staticmethod
    def get_all_promo_codes(conn) -> List[Dict]:
        """Récupère tous les codes"""
        try:
            c = conn.cursor()
            c.execute("SELECT * FROM promo_codes ORDER BY created_at DESC")
            
            columns = [desc[0] for desc in c.description]
            codes = []
            
            for row in c.fetchall():
                codes.append(dict(zip(columns, row)))
            
            return codes
            
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return []
    
    @staticmethod
    def validate_promo_code(conn, code: str, plan: str, amount: float) -> Tuple[bool, str, float]:
        """Valide un code et retourne le discount"""
        try:
            c = conn.cursor()
            code_upper = code.upper()
            
            # Récupérer le code
            if hasattr(conn, 'server_version'):  # PostgreSQL
                c.execute("SELECT * FROM promo_codes WHERE code = %s AND is_active = TRUE", (code_upper,))
            else:  # SQLite
                c.execute("SELECT * FROM promo_codes WHERE code = ? AND is_active = 1", (code_upper,))
            
            result = c.fetchone()
            if not result:
                return False, "Code invalide", 0
            
            columns = [desc[0] for desc in c.description]
            promo = dict(zip(columns, result))
            
            # Vérifier expiration
            if promo.get('expires_at'):
                try:
                    expires = datetime.fromisoformat(str(promo['expires_at']))
                    if datetime.now() > expires:
                        return False, "Code expiré", 0
                except:
                    pass
            
            # Vérifier max uses
            if promo.get('max_uses') and promo.get('used_count', 0) >= promo['max_uses']:
                return False, "Code épuisé", 0
            
            # Vérifier montant min
            if promo.get('min_amount') and amount < promo['min_amount']:
                return False, f"Montant min: ${promo['min_amount']}", 0
            
            # Vérifier plans
            if promo.get('applicable_plans'):
                plans = [p.strip() for p in str(promo['applicable_plans']).split(',')]
                if plan not in plans:
                    return False, "Code non valide pour ce plan", 0
            
            # Calculer discount
            if promo['discount_type'] == 'percent':
                discount = amount * (promo['discount_value'] / 100.0)
            else:
                discount = min(promo['discount_value'], amount)
            
            return True, "Code valide", round(discount, 2)
            
        except Exception as e:
            print(f"❌ Erreur validation: {e}")
            return False, str(e), 0
    
    @staticmethod
    def use_promo_code(conn, code: str, user_email: str):
        """Incrémente le compteur"""
        try:
            c = conn.cursor()
            code_upper = code.upper()
            
            if hasattr(conn, 'server_version'):  # PostgreSQL
                c.execute("UPDATE promo_codes SET used_count = used_count + 1 WHERE code = %s", (code_upper,))
            else:  # SQLite
                c.execute("UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ?", (code_upper,))
            
            conn.commit()
            print(f"✅ Code {code_upper} utilisé par {user_email}")
            return True
            
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return False
