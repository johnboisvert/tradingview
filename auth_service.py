# -*- coding: utf-8 -*-
"""
🔐 SERVICE D'AUTHENTIFICATION SÉCURISÉ
Gestion des utilisateurs, sessions et permissions
"""

import os
import secrets
import hashlib
import sqlite3
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dataclasses import dataclass

# Import bcrypt avec fallback
try:
    import bcrypt
    BCRYPT_AVAILABLE = True
except ImportError:
    BCRYPT_AVAILABLE = False
    print("⚠️ bcrypt non disponible - utilisation de hashlib (moins sécurisé)")

# Import PostgreSQL avec fallback
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False

# Import configuration
try:
    from config import (
        DB_CONFIG, SECRET_KEY, SESSION_EXPIRE_HOURS, BCRYPT_ROUNDS
    )
except ImportError:
    DB_CONFIG = {"type": "sqlite", "path": "/tmp/cryptoia.db"}
    SECRET_KEY = os.urandom(32).hex()
    SESSION_EXPIRE_HOURS = 24
    BCRYPT_ROUNDS = 12


@dataclass
class User:
    """Modèle utilisateur"""
    id: int
    email: str
    username: str
    subscription_plan: str = "free"
    subscription_end: Optional[datetime] = None
    is_admin: bool = False
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None


class AuthService:
    """
    Service d'authentification sécurisé
    Supporte PostgreSQL et SQLite
    """
    
    def __init__(self):
        self.db_config = DB_CONFIG
        self._init_tables()
    
    def _get_connection(self):
        """Obtient une connexion à la base de données"""
        if self.db_config["type"] == "postgres" and POSTGRES_AVAILABLE:
            return psycopg2.connect(self.db_config["url"])
        return sqlite3.connect(self.db_config.get("path", "/tmp/cryptoia.db"), timeout=30.0)
    
    def _init_tables(self):
        """Initialise les tables utilisateurs et sessions"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            is_postgres = self.db_config["type"] == "postgres"
            
            # Table users
            if is_postgres:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        username VARCHAR(100) NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        subscription_plan VARCHAR(50) DEFAULT 'free',
                        subscription_end TIMESTAMP,
                        is_admin BOOLEAN DEFAULT FALSE,
                        is_active BOOLEAN DEFAULT TRUE,
                        email_verified BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW(),
                        last_login TIMESTAMP
                    )
                """)
                
                # Table sessions
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS sessions (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        token VARCHAR(255) UNIQUE NOT NULL,
                        ip_address VARCHAR(45),
                        user_agent TEXT,
                        expires_at TIMESTAMP NOT NULL,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                """)
                
                # Table login_attempts (rate limiting)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS login_attempts (
                        id SERIAL PRIMARY KEY,
                        email VARCHAR(255) NOT NULL,
                        ip_address VARCHAR(45),
                        success BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                """)
                
            else:  # SQLite
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email TEXT UNIQUE NOT NULL,
                        username TEXT NOT NULL,
                        password_hash TEXT NOT NULL,
                        subscription_plan TEXT DEFAULT 'free',
                        subscription_end TIMESTAMP,
                        is_admin INTEGER DEFAULT 0,
                        is_active INTEGER DEFAULT 1,
                        email_verified INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_login TIMESTAMP
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        token TEXT UNIQUE NOT NULL,
                        ip_address TEXT,
                        user_agent TEXT,
                        expires_at TIMESTAMP NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS login_attempts (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email TEXT NOT NULL,
                        ip_address TEXT,
                        success INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
            
            conn.commit()
            conn.close()
            print("✅ Tables d'authentification initialisées")
            
        except Exception as e:
            print(f"❌ Erreur init tables auth: {e}")
    
    # ========================================================================
    # 🔒 HASHING DE MOT DE PASSE
    # ========================================================================
    
    def _hash_password(self, password: str) -> str:
        """Hash un mot de passe avec bcrypt ou fallback hashlib"""
        if BCRYPT_AVAILABLE:
            salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
            return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        else:
            # Fallback avec hashlib + salt
            salt = secrets.token_hex(16)
            hash_obj = hashlib.pbkdf2_hmac(
                'sha256',
                password.encode('utf-8'),
                salt.encode('utf-8'),
                100000
            )
            return f"{salt}${hash_obj.hex()}"
    
    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Vérifie un mot de passe contre son hash"""
        if BCRYPT_AVAILABLE:
            try:
                return bcrypt.checkpw(
                    password.encode('utf-8'),
                    password_hash.encode('utf-8')
                )
            except Exception:
                return False
        else:
            # Fallback hashlib
            try:
                salt, stored_hash = password_hash.split('$')
                hash_obj = hashlib.pbkdf2_hmac(
                    'sha256',
                    password.encode('utf-8'),
                    salt.encode('utf-8'),
                    100000
                )
                return hash_obj.hex() == stored_hash
            except Exception:
                return False
    
    # ========================================================================
    # 👤 GESTION DES UTILISATEURS
    # ========================================================================
    
    def create_user(self, email: str, username: str, password: str) -> Optional[User]:
        """Crée un nouvel utilisateur"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Vérifier si l'email existe déjà
            is_postgres = self.db_config["type"] == "postgres"
            placeholder = "%s" if is_postgres else "?"
            
            cursor.execute(
                f"SELECT id FROM users WHERE email = {placeholder}",
                (email.lower(),)
            )
            
            if cursor.fetchone():
                conn.close()
                return None  # Email déjà utilisé
            
            # Hash du mot de passe
            password_hash = self._hash_password(password)
            
            # Insérer l'utilisateur
            if is_postgres:
                cursor.execute("""
                    INSERT INTO users (email, username, password_hash)
                    VALUES (%s, %s, %s)
                    RETURNING id, created_at
                """, (email.lower(), username, password_hash))
                result = cursor.fetchone()
                user_id = result[0]
                created_at = result[1]
            else:
                cursor.execute("""
                    INSERT INTO users (email, username, password_hash)
                    VALUES (?, ?, ?)
                """, (email.lower(), username, password_hash))
                user_id = cursor.lastrowid
                created_at = datetime.now()
            
            conn.commit()
            conn.close()
            
            print(f"✅ Utilisateur créé: {email}")
            
            return User(
                id=user_id,
                email=email.lower(),
                username=username,
                created_at=created_at
            )
            
        except Exception as e:
            print(f"❌ Erreur création utilisateur: {e}")
            return None
    
    def authenticate(self, email: str, password: str, ip_address: str = None) -> Optional[Dict]:
        """
        Authentifie un utilisateur
        Retourne les infos utilisateur + token de session si succès
        """
        try:
            conn = self._get_connection()
            
            is_postgres = self.db_config["type"] == "postgres"
            placeholder = "%s" if is_postgres else "?"
            
            if is_postgres:
                cursor = conn.cursor(cursor_factory=RealDictCursor)
            else:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
            
            # Vérifier le rate limiting (max 5 tentatives par 15 min)
            if not self._check_rate_limit(cursor, email, ip_address, is_postgres, placeholder):
                conn.close()
                return {"error": "too_many_attempts", "message": "Trop de tentatives. Réessayez dans 15 minutes."}
            
            # Récupérer l'utilisateur
            cursor.execute(f"""
                SELECT id, email, username, password_hash, subscription_plan, 
                       subscription_end, is_admin, is_active
                FROM users 
                WHERE email = {placeholder}
            """, (email.lower(),))
            
            user_row = cursor.fetchone()
            
            if not user_row:
                self._log_attempt(cursor, email, ip_address, False, is_postgres, placeholder)
                conn.commit()
                conn.close()
                return {"error": "invalid_credentials", "message": "Email ou mot de passe incorrect"}
            
            user = dict(user_row)
            
            # Vérifier si le compte est actif
            if not user.get("is_active", True):
                conn.close()
                return {"error": "account_disabled", "message": "Ce compte a été désactivé"}
            
            # Vérifier le mot de passe
            if not self._verify_password(password, user["password_hash"]):
                self._log_attempt(cursor, email, ip_address, False, is_postgres, placeholder)
                conn.commit()
                conn.close()
                return {"error": "invalid_credentials", "message": "Email ou mot de passe incorrect"}
            
            # Succès - créer une session
            self._log_attempt(cursor, email, ip_address, True, is_postgres, placeholder)
            
            # Mettre à jour last_login
            cursor.execute(f"""
                UPDATE users SET last_login = {'NOW()' if is_postgres else 'CURRENT_TIMESTAMP'}
                WHERE id = {placeholder}
            """, (user["id"],))
            
            # Créer le token de session
            session_token = secrets.token_urlsafe(32)
            expires_at = datetime.now() + timedelta(hours=SESSION_EXPIRE_HOURS)
            
            if is_postgres:
                cursor.execute("""
                    INSERT INTO sessions (user_id, token, ip_address, expires_at)
                    VALUES (%s, %s, %s, %s)
                """, (user["id"], session_token, ip_address, expires_at))
            else:
                cursor.execute("""
                    INSERT INTO sessions (user_id, token, ip_address, expires_at)
                    VALUES (?, ?, ?, ?)
                """, (user["id"], session_token, ip_address, expires_at.isoformat()))
            
            conn.commit()
            conn.close()
            
            # Retourner les infos utilisateur (sans le hash)
            del user["password_hash"]
            user["session_token"] = session_token
            user["expires_at"] = expires_at.isoformat()
            
            print(f"✅ Connexion réussie: {email}")
            return user
            
        except Exception as e:
            print(f"❌ Erreur authentification: {e}")
            return {"error": "server_error", "message": "Erreur serveur"}
    
    def _check_rate_limit(self, cursor, email: str, ip_address: str, is_postgres: bool, placeholder: str) -> bool:
        """Vérifie le rate limiting des tentatives de connexion"""
        try:
            # Compter les tentatives échouées dans les 15 dernières minutes
            if is_postgres:
                cursor.execute("""
                    SELECT COUNT(*) as count FROM login_attempts
                    WHERE (email = %s OR ip_address = %s)
                    AND success = FALSE
                    AND created_at > NOW() - INTERVAL '15 minutes'
                """, (email.lower(), ip_address))
            else:
                cursor.execute("""
                    SELECT COUNT(*) as count FROM login_attempts
                    WHERE (email = ? OR ip_address = ?)
                    AND success = 0
                    AND created_at > datetime('now', '-15 minutes')
                """, (email.lower(), ip_address))
            
            result = cursor.fetchone()
            count = result[0] if isinstance(result, tuple) else result.get("count", 0)
            
            return count < 5  # Max 5 tentatives
            
        except Exception:
            return True  # En cas d'erreur, autoriser
    
    def _log_attempt(self, cursor, email: str, ip_address: str, success: bool, is_postgres: bool, placeholder: str):
        """Log une tentative de connexion"""
        try:
            if is_postgres:
                cursor.execute("""
                    INSERT INTO login_attempts (email, ip_address, success)
                    VALUES (%s, %s, %s)
                """, (email.lower(), ip_address, success))
            else:
                cursor.execute("""
                    INSERT INTO login_attempts (email, ip_address, success)
                    VALUES (?, ?, ?)
                """, (email.lower(), ip_address, 1 if success else 0))
        except Exception:
            pass
    
    def validate_session(self, token: str) -> Optional[Dict]:
        """Valide un token de session et retourne l'utilisateur"""
        try:
            conn = self._get_connection()
            
            is_postgres = self.db_config["type"] == "postgres"
            placeholder = "%s" if is_postgres else "?"
            
            if is_postgres:
                cursor = conn.cursor(cursor_factory=RealDictCursor)
            else:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
            
            # Récupérer la session et l'utilisateur
            if is_postgres:
                cursor.execute("""
                    SELECT u.id, u.email, u.username, u.subscription_plan, 
                           u.subscription_end, u.is_admin, s.expires_at
                    FROM sessions s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.token = %s AND s.expires_at > NOW()
                """, (token,))
            else:
                cursor.execute("""
                    SELECT u.id, u.email, u.username, u.subscription_plan,
                           u.subscription_end, u.is_admin, s.expires_at
                    FROM sessions s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.token = ? AND s.expires_at > datetime('now')
                """, (token,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                return dict(result)
            return None
            
        except Exception as e:
            print(f"❌ Erreur validation session: {e}")
            return None
    
    def logout(self, token: str) -> bool:
        """Déconnecte un utilisateur (supprime la session)"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            is_postgres = self.db_config["type"] == "postgres"
            placeholder = "%s" if is_postgres else "?"
            
            cursor.execute(
                f"DELETE FROM sessions WHERE token = {placeholder}",
                (token,)
            )
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"❌ Erreur logout: {e}")
            return False
    
    def update_subscription(self, user_id: int, plan: str, duration_days: int) -> bool:
        """Met à jour l'abonnement d'un utilisateur"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            is_postgres = self.db_config["type"] == "postgres"
            
            if is_postgres:
                cursor.execute("""
                    UPDATE users 
                    SET subscription_plan = %s,
                        subscription_end = NOW() + INTERVAL '%s days',
                        updated_at = NOW()
                    WHERE id = %s
                """, (plan, duration_days, user_id))
            else:
                end_date = (datetime.now() + timedelta(days=duration_days)).isoformat()
                cursor.execute("""
                    UPDATE users 
                    SET subscription_plan = ?,
                        subscription_end = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (plan, end_date, user_id))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Abonnement mis à jour: user {user_id} -> {plan} ({duration_days} jours)")
            return True
            
        except Exception as e:
            print(f"❌ Erreur mise à jour abonnement: {e}")
            return False
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Récupère un utilisateur par email"""
        try:
            conn = self._get_connection()
            
            is_postgres = self.db_config["type"] == "postgres"
            
            if is_postgres:
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                cursor.execute("""
                    SELECT id, email, username, subscription_plan, subscription_end, 
                           is_admin, created_at, last_login
                    FROM users WHERE email = %s
                """, (email.lower(),))
            else:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, email, username, subscription_plan, subscription_end,
                           is_admin, created_at, last_login
                    FROM users WHERE email = ?
                """, (email.lower(),))
            
            result = cursor.fetchone()
            conn.close()
            
            return dict(result) if result else None
            
        except Exception as e:
            print(f"❌ Erreur get user: {e}")
            return None
    
    def cleanup_expired_sessions(self):
        """Nettoie les sessions expirées"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            is_postgres = self.db_config["type"] == "postgres"
            
            if is_postgres:
                cursor.execute("DELETE FROM sessions WHERE expires_at < NOW()")
            else:
                cursor.execute("DELETE FROM sessions WHERE expires_at < datetime('now')")
            
            deleted = cursor.rowcount
            conn.commit()
            conn.close()
            
            if deleted > 0:
                print(f"🧹 {deleted} sessions expirées supprimées")
                
        except Exception as e:
            print(f"❌ Erreur cleanup sessions: {e}")


# Instance globale
auth_service = AuthService()

print("✅ Service d'authentification initialisé")