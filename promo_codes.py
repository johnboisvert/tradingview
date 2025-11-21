"""Promo Codes System - Trading Dashboard Pro"""
from datetime import datetime, timedelta
from typing import Optional, Tuple, List, Dict

class PromoCodeManager:
    """Gestionnaire de codes promotionnels"""
    
    @staticmethod
    def create_table(conn):
        """Crée la table promo_codes"""
        try:
            c = conn.cursor()
            is_postgres = hasattr(conn, 'server_version')
            
            if is_postgres:
                c.execute("""CREATE TABLE IF NOT EXISTS promo_codes (
                    id SERIAL PRIMARY KEY, code VARCHAR(50) UNIQUE NOT NULL,
                    discount_type VARCHAR(10) NOT NULL, discount_value REAL NOT NULL,
                    description TEXT, max_uses INTEGER, used_count INTEGER DEFAULT 0,
                    expires_at TIMESTAMP, min_amount REAL, applicable_plans TEXT,
                    is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    total_discount_given REAL DEFAULT 0)""")
            else:
                c.execute("""CREATE TABLE IF NOT EXISTS promo_codes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL,
                    discount_type TEXT NOT NULL, discount_value REAL NOT NULL,
                    description TEXT, max_uses INTEGER, used_count INTEGER DEFAULT 0,
                    expires_at TEXT, min_amount REAL, applicable_plans TEXT,
                    is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    total_discount_given REAL DEFAULT 0)""")
            conn.commit()
            return True
        except Exception as e:
            print(f"Erreur table: {e}")
            return False
    
    @staticmethod
    def create_promo_code(conn, code, discount_type, discount_value, description="",
                         max_uses=None, expires_at=None, min_amount=None, applicable_plans=None):
        """Crée un code promo"""
        try:
            c = conn.cursor()
            code = code.upper()
            p = '%s' if hasattr(conn, 'server_version') else '?'
            c.execute(f"SELECT code FROM promo_codes WHERE code = {p}", (code,))
            if c.fetchone():
                return False, f"Code {code} existe"
            if hasattr(conn, 'server_version'):
                c.execute("""INSERT INTO promo_codes (code, discount_type, discount_value,
                    description, max_uses, expires_at, min_amount, applicable_plans)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (code, discount_type, discount_value, description, max_uses,
                     expires_at, min_amount, applicable_plans))
            else:
                c.execute("""INSERT INTO promo_codes (code, discount_type, discount_value,
                    description, max_uses, expires_at, min_amount, applicable_plans)
                    VALUES (?,?,?,?,?,?,?,?)""",
                    (code, discount_type, discount_value, description, max_uses,
                     expires_at, min_amount, applicable_plans))
            conn.commit()
            return True, f"Code {code} créé"
        except Exception as e:
            return False, str(e)
    
    @staticmethod
    def get_all_promo_codes(conn):
        """Récupère tous les codes"""
        try:
            c = conn.cursor()
            c.execute("SELECT * FROM promo_codes ORDER BY created_at DESC")
            cols = [d[0] for d in c.description]
            return [dict(zip(cols, row)) for row in c.fetchall()]
        except:
            return []
    
    @staticmethod
    def validate_promo_code(conn, code, plan, amount):
        """Valide un code"""
        try:
            c = conn.cursor()
            code = code.upper()
            p = '%s' if hasattr(conn, 'server_version') else '?'
            a = 'TRUE' if hasattr(conn, 'server_version') else '1'
            c.execute(f"SELECT * FROM promo_codes WHERE code={p} AND is_active={a}", (code,))
            r = c.fetchone()
            if not r:
                return False, "Code invalide", 0
            cols = [d[0] for d in c.description]
            promo = dict(zip(cols, r))
            if promo.get('expires_at'):
                try:
                    if datetime.now() > datetime.fromisoformat(str(promo['expires_at'])):
                        return False, "Code expiré", 0
                except:
                    pass
            if promo.get('max_uses') and promo.get('used_count', 0) >= promo['max_uses']:
                return False, "Code épuisé", 0
            if promo.get('min_amount') and amount < promo['min_amount']:
                return False, f"Montant min: ${promo['min_amount']}", 0
            if promo.get('applicable_plans'):
                if plan not in [x.strip() for x in str(promo['applicable_plans']).split(',')]:
                    return False, "Code non valide pour ce plan", 0
            discount = amount * (promo['discount_value']/100.0) if promo['discount_type']=='percent' else min(promo['discount_value'], amount)
            return True, "Code valide", round(discount, 2)
        except Exception as e:
            return False, str(e), 0
    
    @staticmethod
    def use_promo_code(conn, code, user_email):
        """Incrémente le compteur"""
        try:
            c = conn.cursor()
            code = code.upper()
            p = '%s' if hasattr(conn, 'server_version') else '?'
            c.execute(f"UPDATE promo_codes SET used_count=used_count+1 WHERE code={p}", (code,))
            conn.commit()
            return True
        except:
            return False
