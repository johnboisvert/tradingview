# -*- coding: utf-8 -*-
"""
🚀 SYSTÈME D'ABONNEMENT STRIPE + COINBASE COMMERCE + GESTION DES PRIX ADMIN
Module standalone qui s'intègre à main.py sans rien casser
"""

from fastapi import APIRouter, Request, HTTPException, Depends, Form
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import os
import json

# PostgreSQL ou SQLite (comme dans main.py)
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    POSTGRESQL_AVAILABLE = True
except ImportError:
    POSTGRESQL_AVAILABLE = False

import sqlite3

# ============================================================================
# 🔧 CONFIGURATION STRIPE
# ============================================================================

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "sk_test_...")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_...")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_...")
STRIPE_ENABLED = STRIPE_SECRET_KEY.startswith("sk_")

if STRIPE_ENABLED:
    try:
        import stripe
        stripe.api_key = STRIPE_SECRET_KEY
        print("✅ Stripe initialisé")
    except ImportError:
        STRIPE_ENABLED = False
        print("⚠️  stripe non installé - mode simulation")

# ============================================================================
# 🔧 CONFIGURATION COINBASE COMMERCE
# ============================================================================

COINBASE_API_KEY = os.getenv("COINBASE_COMMERCE_KEY")
COINBASE_WEBHOOK_SECRET = os.getenv("COINBASE_WEBHOOK_SECRET")
COINBASE_ENABLED = bool(COINBASE_API_KEY)

if COINBASE_ENABLED:
    print("✅ Coinbase Commerce activé")
else:
    print("⚠️  Coinbase Commerce non configuré")

# ============================================================================
# 💾 CONFIGURATION BASE DE DONNÉES
# ============================================================================

def get_subscription_db_config():
    """Utilise la même config que main.py"""
    database_url = os.getenv("DATABASE_URL")
    if database_url and POSTGRESQL_AVAILABLE:
        return {"type": "postgres", "url": database_url}
    return {"type": "sqlite", "path": "/tmp/subscriptions.db" if os.path.exists("/tmp") else "./subscriptions.db"}

SUB_DB_CONFIG = get_subscription_db_config()

def get_subscription_db_connection():
    """Connexion base de données subscriptions"""
    if SUB_DB_CONFIG["type"] == "postgres":
        return psycopg2.connect(SUB_DB_CONFIG["url"])
    return sqlite3.connect(SUB_DB_CONFIG["path"], timeout=30.0)

# ============================================================================
# 📦 INITIALISATION DES TABLES
# ============================================================================

def init_subscription_tables():
    """Crée les tables pour le système d'abonnement (Stripe + Coinbase)"""
    try:
        conn = get_subscription_db_connection()
        c = conn.cursor()
        
        if SUB_DB_CONFIG["type"] == "postgres":
            # Table pricing_plans
            c.execute("""CREATE TABLE IF NOT EXISTS pricing_plans (
                id SERIAL PRIMARY KEY,
                plan_name TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                price_monthly REAL NOT NULL,
                price_yearly REAL,
                currency TEXT DEFAULT 'CAD',
                features TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                stripe_price_id_monthly TEXT,
                stripe_price_id_yearly TEXT,
                max_alerts INT DEFAULT 0,
                api_calls_per_day INT DEFAULT 0,
                has_sms_alerts BOOLEAN DEFAULT FALSE,
                has_telegram_group BOOLEAN DEFAULT FALSE,
                has_pdf_reports BOOLEAN DEFAULT FALSE,
                has_backtesting BOOLEAN DEFAULT FALSE,
                has_api_access BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )""")
            
            # Table subscriptions
            c.execute("""CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                plan_id INTEGER REFERENCES pricing_plans(id),
                stripe_subscription_id TEXT,
                stripe_customer_id TEXT,
                status TEXT DEFAULT 'active',
                billing_period TEXT DEFAULT 'monthly',
                current_period_start TIMESTAMP,
                current_period_end TIMESTAMP,
                cancel_at_period_end BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )""")
            
            # Table user_alerts
            c.execute("""CREATE TABLE IF NOT EXISTS user_alerts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                alert_type TEXT NOT NULL,
                condition_type TEXT NOT NULL,
                threshold REAL,
                is_active BOOLEAN DEFAULT TRUE,
                email_enabled BOOLEAN DEFAULT TRUE,
                telegram_enabled BOOLEAN DEFAULT FALSE,
                sms_enabled BOOLEAN DEFAULT FALSE,
                last_triggered TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )""")
            
            # Table promo_codes
            c.execute("""CREATE TABLE IF NOT EXISTS promo_codes (
                id SERIAL PRIMARY KEY,
                code TEXT UNIQUE NOT NULL,
                discount_percent REAL,
                discount_amount REAL,
                valid_from TIMESTAMP DEFAULT NOW(),
                valid_until TIMESTAMP,
                max_uses INT DEFAULT 1,
                current_uses INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            )""")
            
            # ═══════════════════════════════════════════════════════════════════════════════
            # TABLE: PAIEMENTS COINBASE COMMERCE
            # ═══════════════════════════════════════════════════════════════════════════════
            c.execute("""CREATE TABLE IF NOT EXISTS subscription_coinbase_payments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                plan_id INTEGER REFERENCES pricing_plans(id),
                charge_id TEXT UNIQUE NOT NULL,
                amount_usd REAL NOT NULL,
                crypto_amount TEXT,
                crypto_currency TEXT,
                status TEXT DEFAULT 'pending',
                event_type TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                confirmed_at TIMESTAMP,
                metadata TEXT
            )""")
            
        else:  # SQLite
            c.execute("""CREATE TABLE IF NOT EXISTS pricing_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                plan_name TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                price_monthly REAL NOT NULL,
                price_yearly REAL,
                currency TEXT DEFAULT 'CAD',
                features TEXT,
                is_active INTEGER DEFAULT 1,
                stripe_price_id_monthly TEXT,
                stripe_price_id_yearly TEXT,
                max_alerts INTEGER DEFAULT 0,
                api_calls_per_day INTEGER DEFAULT 0,
                has_sms_alerts INTEGER DEFAULT 0,
                has_telegram_group INTEGER DEFAULT 0,
                has_pdf_reports INTEGER DEFAULT 0,
                has_backtesting INTEGER DEFAULT 0,
                has_api_access INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""")
            
            c.execute("""CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                plan_id INTEGER,
                stripe_subscription_id TEXT,
                stripe_customer_id TEXT,
                status TEXT DEFAULT 'active',
                billing_period TEXT DEFAULT 'monthly',
                current_period_start TIMESTAMP,
                current_period_end TIMESTAMP,
                cancel_at_period_end INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(plan_id) REFERENCES pricing_plans(id)
            )""")
            
            c.execute("""CREATE TABLE IF NOT EXISTS user_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                alert_type TEXT NOT NULL,
                condition_type TEXT NOT NULL,
                threshold REAL,
                is_active INTEGER DEFAULT 1,
                email_enabled INTEGER DEFAULT 1,
                telegram_enabled INTEGER DEFAULT 0,
                sms_enabled INTEGER DEFAULT 0,
                last_triggered TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""")
            
            c.execute("""CREATE TABLE IF NOT EXISTS promo_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                discount_percent REAL,
                discount_amount REAL,
                valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                valid_until TIMESTAMP,
                max_uses INTEGER DEFAULT 1,
                current_uses INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""")
            
            # ═══════════════════════════════════════════════════════════════════════════════
            # TABLE: PAIEMENTS COINBASE COMMERCE (SQLite)
            # ═══════════════════════════════════════════════════════════════════════════════
            c.execute("""CREATE TABLE IF NOT EXISTS subscription_coinbase_payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                plan_id INTEGER REFERENCES pricing_plans(id),
                charge_id TEXT UNIQUE NOT NULL,
                amount_usd REAL NOT NULL,
                crypto_amount TEXT,
                crypto_currency TEXT,
                status TEXT DEFAULT 'pending',
                event_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                confirmed_at TIMESTAMP,
                metadata TEXT
            )""")
        
        # Insérer les plans par défaut si la table est vide
        if SUB_DB_CONFIG["type"] == "postgres":
            c.execute("SELECT COUNT(*) FROM pricing_plans")
        else:
            c.execute("SELECT COUNT(*) FROM pricing_plans")
        
        count = c.fetchone()[0]
        if count == 0:
            # Plans par défaut
            default_plans = [
                {
                    'plan_name': 'free',
                    'display_name': '🆓 Gratuit',
                    'price_monthly': 0,
                    'price_yearly': 0,
                    'features': json.dumps([
                        'Page bullrun phase (limitée)',
                        '1 alerte par semaine',
                        'Données avec 1h de délai',
                        'Avec publicités'
                    ]),
                    'max_alerts': 1,
                    'api_calls_per_day': 10
                },
                {
                    'plan_name': 'premium',
                    'display_name': '💎 Premium',
                    'price_monthly': 19.99,
                    'price_yearly': 199.00,
                    'features': json.dumps([
                        'Temps réel complet',
                        '10 alertes personnalisées',
                        'Historique 6 mois',
                        'Rapports PDF hebdomadaires',
                        '0 pub',
                        'Support prioritaire'
                    ]),
                    'max_alerts': 10,
                    'api_calls_per_day': 100,
                    'has_pdf_reports': True
                },
                {
                    'plan_name': 'vip',
                    'display_name': '👑 VIP',
                    'price_monthly': 49.99,
                    'price_yearly': 449.00,
                    'features': json.dumps([
                        'Tout du Premium +',
                        'Alertes illimitées + SMS',
                        'Backtesting avancé',
                        'Groupe Telegram exclusif',
                        'Accès API',
                        'Signaux trading exclusifs',
                        'Call mensuel'
                    ]),
                    'max_alerts': 999,
                    'api_calls_per_day': 1000,
                    'has_sms_alerts': True,
                    'has_telegram_group': True,
                    'has_pdf_reports': True,
                    'has_backtesting': True,
                    'has_api_access': True
                }
            ]
            
            for plan in default_plans:
                if SUB_DB_CONFIG["type"] == "postgres":
                    c.execute("""INSERT INTO pricing_plans 
                        (plan_name, display_name, price_monthly, price_yearly, features, 
                        max_alerts, api_calls_per_day, has_sms_alerts, has_telegram_group,
                        has_pdf_reports, has_backtesting, has_api_access)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                        (plan['plan_name'], plan['display_name'], plan['price_monthly'],
                        plan.get('price_yearly'), plan['features'], plan['max_alerts'],
                        plan['api_calls_per_day'], plan.get('has_sms_alerts', False),
                        plan.get('has_telegram_group', False), plan.get('has_pdf_reports', False),
                        plan.get('has_backtesting', False), plan.get('has_api_access', False)))
                else:
                    c.execute("""INSERT INTO pricing_plans 
                        (plan_name, display_name, price_monthly, price_yearly, features,
                        max_alerts, api_calls_per_day, has_sms_alerts, has_telegram_group,
                        has_pdf_reports, has_backtesting, has_api_access)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (plan['plan_name'], plan['display_name'], plan['price_monthly'],
                        plan.get('price_yearly'), plan['features'], plan['max_alerts'],
                        plan['api_calls_per_day'], 1 if plan.get('has_sms_alerts') else 0,
                        1 if plan.get('has_telegram_group') else 0, 1 if plan.get('has_pdf_reports') else 0,
                        1 if plan.get('has_backtesting') else 0, 1 if plan.get('has_api_access') else 0))
        
        conn.commit()
        conn.close()
        print(f"✅ Tables subscription OK ({SUB_DB_CONFIG['type']})")
        return True
    except Exception as e:
        print(f"❌ Init subscription tables: {e}")
        import traceback
        traceback.print_exc()
        return False

# ═══════════════════════════════════════════════════════════════════════════════
# 🔌 FONCTIONS COINBASE COMMERCE
# ═══════════════════════════════════════════════════════════════════════════════

def save_coinbase_charge(conn, user_id: int, plan_id: int, charge_id: str, amount_usd: float, crypto_currency: str = None):
    """Sauvegarde une charge Coinbase en base de données"""
    cursor = conn.cursor()
    
    if SUB_DB_CONFIG["type"] == "postgres":
        cursor.execute("""
            INSERT INTO subscription_coinbase_payments 
            (user_id, plan_id, charge_id, amount_usd, crypto_currency, status)
            VALUES (%s, %s, %s, %s, %s, 'pending')
        """, (user_id, plan_id, charge_id, amount_usd, crypto_currency))
    else:
        cursor.execute("""
            INSERT INTO subscription_coinbase_payments 
            (user_id, plan_id, charge_id, amount_usd, crypto_currency, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        """, (user_id, plan_id, charge_id, amount_usd, crypto_currency))
    
    conn.commit()
    print(f"✅ Charge {charge_id} sauvegardée pour user {user_id}")


def update_coinbase_charge_status(conn, charge_id: str, status: str, event_type: str = None):
    """Met à jour le statut d'une charge"""
    cursor = conn.cursor()
    
    if SUB_DB_CONFIG["type"] == "postgres":
        if status == "confirmed":
            cursor.execute("""
                UPDATE subscription_coinbase_payments
                SET status = %s, event_type = %s, confirmed_at = CURRENT_TIMESTAMP
                WHERE charge_id = %s
            """, (status, event_type, charge_id))
        else:
            cursor.execute("""
                UPDATE subscription_coinbase_payments
                SET status = %s, event_type = %s
                WHERE charge_id = %s
            """, (status, event_type, charge_id))
    else:
        if status == "confirmed":
            cursor.execute("""
                UPDATE subscription_coinbase_payments
                SET status = ?, event_type = ?, confirmed_at = CURRENT_TIMESTAMP
                WHERE charge_id = ?
            """, (status, event_type, charge_id))
        else:
            cursor.execute("""
                UPDATE subscription_coinbase_payments
                SET status = ?, event_type = ?
                WHERE charge_id = ?
            """, (status, event_type, charge_id))
    
    conn.commit()
    print(f"✅ Charge {charge_id} statut → {status}")


def get_coinbase_charge(conn, charge_id: str):
    """Récupère les infos d'une charge Coinbase"""
    cursor = conn.cursor()
    
    if SUB_DB_CONFIG["type"] == "postgres":
        cursor.execute(
            "SELECT * FROM subscription_coinbase_payments WHERE charge_id = %s",
            (charge_id,)
        )
    else:
        cursor.execute(
            "SELECT * FROM subscription_coinbase_payments WHERE charge_id = ?",
            (charge_id,)
        )
    
    return cursor.fetchone()


def activate_subscription_after_crypto_payment(conn, user_id: int, plan_id: int):
    """Active l'abonnement après confirmation du paiement Coinbase"""
    cursor = conn.cursor()
    
    if SUB_DB_CONFIG["type"] == "postgres":
        # Annuler l'ancien abonnement
        cursor.execute(
            "UPDATE subscriptions SET status = %s, cancel_at_period_end = TRUE WHERE user_id = %s AND status = %s",
            ('cancelled', user_id, 'active')
        )
        
        # Créer le nouvel abonnement (30 jours)
        cursor.execute("""
            INSERT INTO subscriptions 
            (user_id, plan_id, status, billing_period, current_period_start, current_period_end)
            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days')
        """, (user_id, plan_id, 'active', 'monthly'))
    else:
        # SQLite
        cursor.execute(
            "UPDATE subscriptions SET status = ?, cancel_at_period_end = TRUE WHERE user_id = ? AND status = ?",
            ('cancelled', user_id, 'active')
        )
        
        cursor.execute("""
            INSERT INTO subscriptions 
            (user_id, plan_id, status, billing_period, current_period_start, current_period_end)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, datetime('now', '+30 days'))
        """, (user_id, plan_id, 'active', 'monthly'))
    
    conn.commit()
    print(f"✅ Abonnement activé pour user {user_id} avec plan {plan_id}")
    return True


def get_coinbase_stats(conn):
    """Récupère les stats des paiements Coinbase"""
    cursor = conn.cursor()
    
    if SUB_DB_CONFIG["type"] == "postgres":
        # Total reçu en crypto
        cursor.execute("""
            SELECT COALESCE(SUM(amount_usd), 0) as total
            FROM subscription_coinbase_payments
            WHERE status = 'confirmed'
        """)
        total = cursor.fetchone()[0]
        
        # Paiements en attente
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM subscription_coinbase_payments
            WHERE status = 'pending'
        """)
        pending = cursor.fetchone()[0]
        
        # Paiements confirmés
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM subscription_coinbase_payments
            WHERE status = 'confirmed'
        """)
        confirmed = cursor.fetchone()[0]
        
        # Paiements échoués
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM subscription_coinbase_payments
            WHERE status = 'failed'
        """)
        failed = cursor.fetchone()[0]
    else:
        # SQLite
        cursor.execute("""
            SELECT COALESCE(SUM(amount_usd), 0) as total
            FROM subscription_coinbase_payments
            WHERE status = 'confirmed'
        """)
        total = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM subscription_coinbase_payments
            WHERE status = 'pending'
        """)
        pending = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM subscription_coinbase_payments
            WHERE status = 'confirmed'
        """)
        confirmed = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM subscription_coinbase_payments
            WHERE status = 'failed'
        """)
        failed = cursor.fetchone()[0]
    
    return {
        "total_usd": total,
        "pending_count": pending,
        "confirmed_count": confirmed,
        "failed_count": failed
    }

# ============================================================================
# 🔐 FONCTIONS UTILITAIRES
# ============================================================================

def get_user_subscription(user_id: int):
    """Récupère l'abonnement actif d'un utilisateur"""
    try:
        conn = get_subscription_db_connection()
        if SUB_DB_CONFIG["type"] == "postgres":
            c = conn.cursor(cursor_factory=RealDictCursor)
        else:
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
        
        c.execute("""
            SELECT s.*, p.* 
            FROM subscriptions s
            JOIN pricing_plans p ON s.plan_id = p.id
            WHERE s.user_id = %s AND s.status = 'active'
            ORDER BY s.created_at DESC LIMIT 1
        """ if SUB_DB_CONFIG["type"] == "postgres" else """
            SELECT s.*, p.* 
            FROM subscriptions s
            JOIN pricing_plans p ON s.plan_id = p.id
            WHERE s.user_id = ? AND s.status = 'active'
            ORDER BY s.created_at DESC LIMIT 1
        """, (user_id,))
        
        row = c.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    except Exception as e:
        print(f"❌ Get user subscription: {e}")
        return None

def get_all_pricing_plans():
    """Récupère tous les plans de pricing actifs"""
    try:
        conn = get_subscription_db_connection()
        if SUB_DB_CONFIG["type"] == "postgres":
            c = conn.cursor(cursor_factory=RealDictCursor)
        else:
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
        
        c.execute("SELECT * FROM pricing_plans WHERE is_active = %s ORDER BY price_monthly ASC" 
                 if SUB_DB_CONFIG["type"] == "postgres" 
                 else "SELECT * FROM pricing_plans WHERE is_active = 1 ORDER BY price_monthly ASC")
        
        rows = c.fetchall()
        conn.close()
        
        plans = []
        for row in rows:
            plan = dict(row)
            # Convertir features JSON string en liste
            if 'features' in plan and plan['features']:
                try:
                    plan['features'] = json.loads(plan['features'])
                except:
                    plan['features'] = []
            plans.append(plan)
        
        return plans
    except Exception as e:
        print(f"❌ Get pricing plans: {e}")
        return []

def update_pricing_plan(plan_id: int, updates: dict):
    """Met à jour un plan de pricing"""
    try:
        conn = get_subscription_db_connection()
        c = conn.cursor()
        
        set_clauses = []
        values = []
        
        for key, value in updates.items():
            if key == 'features' and isinstance(value, list):
                value = json.dumps(value)
            set_clauses.append(f"{key} = {'%s' if SUB_DB_CONFIG['type'] == 'postgres' else '?'}")
            values.append(value)
        
        values.append(plan_id)
        
        query = f"""UPDATE pricing_plans 
                   SET {', '.join(set_clauses)}, updated_at = CURRENT_TIMESTAMP 
                   WHERE id = {'%s' if SUB_DB_CONFIG['type'] == 'postgres' else '?'}"""
        
        c.execute(query, values)
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Update pricing plan: {e}")
        return False

# ============================================================================
# 🌐 ROUTEUR FASTAPI
# ============================================================================

subscription_router = APIRouter()

# ============================================================================
# 📄 PAGE: CHOIX DES ABONNEMENTS
# ============================================================================

@subscription_router.get("/pricing", response_class=HTMLResponse)
async def pricing_page():
    """Page de choix des abonnements"""
    plans = get_all_pricing_plans()
    
    plans_html = ""
    for plan in plans:
        features_html = "".join([f"<li>✅ {f}</li>" for f in plan.get('features', [])])
        
        # Bouton selon le plan
        if plan['price_monthly'] == 0:
            button_html = '<button class="plan-btn free-btn" onclick="selectFreePlan()">Commencer Gratuit</button>'
        else:
            # Boutons pour Stripe ET Coinbase
            button_html = f'''
            <div class="payment-buttons">
                <button class="plan-btn stripe-btn" onclick="checkoutStripe('{plan['id']}', 'monthly')">
                    💳 Payer avec Carte
                </button>
                <button class="plan-btn crypto-btn" onclick="checkoutCrypto('{plan['id']}', '{plan['plan_name'].lower()}')">
                    ₿ Payer en Crypto
                </button>
            </div>
            '''
        
        plans_html += f"""
        <div class="pricing-card">
            <h2>{plan['display_name']}</h2>
            <div class="price">
                <span class="amount">${plan['price_monthly']:.2f}</span>
                <span class="period">/mois</span>
            </div>
            {f'<div class="yearly-price">ou ${plan.get("price_yearly", 0):.2f}/an</div>' if plan.get('price_yearly') else ''}
            <ul class="features">
                {features_html}
            </ul>
            {button_html}
        </div>
        """
    
    return HTMLResponse(f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💎 Choisissez votre plan</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        
        h1 {{
            text-align: center;
            color: white;
            font-size: 48px;
            margin-bottom: 20px;
        }}
        
        .subtitle {{
            text-align: center;
            color: rgba(255,255,255,0.9);
            font-size: 20px;
            margin-bottom: 60px;
        }}
        
        .pricing-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }}
        
        .pricing-card {{
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.3s;
        }}
        
        .pricing-card:hover {{
            transform: translateY(-10px);
        }}
        
        .pricing-card h2 {{
            font-size: 32px;
            margin-bottom: 20px;
            color: #333;
        }}
        
        .price {{
            margin: 30px 0;
        }}
        
        .price .amount {{
            font-size: 56px;
            font-weight: bold;
            color: #667eea;
        }}
        
        .price .period {{
            font-size: 18px;
            color: #666;
        }}
        
        .yearly-price {{
            color: #10b981;
            font-size: 16px;
            margin-top: 10px;
            font-weight: 600;
        }}
        
        .features {{
            list-style: none;
            text-align: left;
            margin: 30px 0;
        }}
        
        .features li {{
            padding: 12px 0;
            border-bottom: 1px solid #eee;
            color: #555;
            font-size: 16px;
        }}
        
        .payment-buttons {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 20px;
        }}
        
        .plan-btn {{
            padding: 14px;
            font-size: 16px;
            font-weight: bold;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }}
        
        .free-btn {{
            width: 100%;
            background: #10b981;
            color: white;
            margin-top: 20px;
        }}
        
        .free-btn:hover {{
            background: #059669;
            transform: scale(1.05);
        }}
        
        .stripe-btn {{
            background: #5469d4;
            color: white;
        }}
        
        .stripe-btn:hover {{
            background: #4657b8;
            opacity: 0.9;
        }}
        
        .crypto-btn {{
            background: #f7931a;
            color: white;
        }}
        
        .crypto-btn:hover {{
            background: #e68a15;
            opacity: 0.9;
        }}
        
        .back-link {{
            text-align: center;
            margin-top: 40px;
        }}
        
        .back-link a {{
            color: white;
            text-decoration: none;
            font-size: 18px;
            padding: 12px 30px;
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
            transition: all 0.3s;
        }}
        
        .back-link a:hover {{
            background: rgba(255,255,255,0.3);
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>💎 Choisissez votre plan</h1>
        <p class="subtitle">Accédez aux fonctionnalités qui correspondent à vos besoins</p>
        
        <div class="pricing-grid">
            {plans_html}
        </div>
        
        <div class="back-link">
            <a href="/">← Retour à l'accueil</a>
        </div>
    </div>
    
    <script>
        function selectFreePlan() {{
            alert('Plan gratuit sélectionné! Vous avez accès aux fonctionnalités de base.');
            window.location.href = '/';
        }}
        
        function checkoutStripe(planId, period) {{
            // Redirection vers la page de checkout Stripe
            window.location.href = `/checkout?plan_id=${{planId}}&period=${{period}}`;
        }}
        
        async function checkoutCrypto(planId, planName) {{
            // Redirection vers Coinbase Commerce
            const userId = await getCurrentUserId(); // À implémenter selon votre système
            const userEmail = await getCurrentUserEmail();
            
            if (!userId || !userEmail) {{
                alert("Veuillez vous connecter d'abord");
                window.location.href = "/login";
                return;
            }}
            
            try {{
                const response = await fetch("/api/crypto/create-charge", {{
                    method: "POST",
                    headers: {{ "Content-Type": "application/json" }},
                    body: JSON.stringify({{
                        plan: planName,
                        user_id: userId,
                        user_email: userEmail
                    }})
                }});
                
                const data = await response.json();
                
                if (data.success) {{
                    window.location.href = data.hosted_url;
                }} else {{
                    alert("Erreur: " + data.error);
                }}
            }} catch (error) {{
                alert("Erreur de connexion: " + error);
            }}
        }}
        
        // À implémenter selon votre système d'authentification
        async function getCurrentUserId() {{
            // Récupérez l'ID utilisateur depuis votre système
            return null; // À modifier
        }}
        
        async function getCurrentUserEmail() {{
            // Récupérez l'email utilisateur depuis votre système
            return null; // À modifier
        }}
    </script>
</body>
</html>""")

# Initialiser les tables au démarrage du module
init_subscription_tables()

print("✅ Module subscription_system chargé (avec Coinbase Commerce)")
