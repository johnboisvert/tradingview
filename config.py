# -*- coding: utf-8 -*-
"""
🔧 CONFIGURATION CENTRALISÉE - CryptoIA Trading Platform
Toutes les variables d'environnement et constantes en un seul endroit
"""

import os
from datetime import timedelta
from typing import Optional

# ============================================================================
# 🌐 ENVIRONNEMENT
# ============================================================================

ENV = os.getenv("ENV", "development")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
BASE_URL = os.getenv("BASE_URL", "https://tradingview-production-5763.up.railway.app")

# ============================================================================
# 🔐 SÉCURITÉ
# ============================================================================

SECRET_KEY = os.getenv("SECRET_KEY", os.urandom(32).hex())
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")
SESSION_EXPIRE_HOURS = int(os.getenv("SESSION_EXPIRE_HOURS", "24"))
BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))

# Rate Limiting
RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "100/minute")
RATE_LIMIT_AUTH = os.getenv("RATE_LIMIT_AUTH", "10/minute")
RATE_LIMIT_API = os.getenv("RATE_LIMIT_API", "60/minute")

# ============================================================================
# 💾 BASE DE DONNÉES
# ============================================================================

DATABASE_URL = os.getenv("DATABASE_URL", "")
SQLITE_PATH = os.getenv("SQLITE_PATH", "/tmp/cryptoia.db" if os.path.exists("/tmp") else "./cryptoia.db")

def get_db_config():
    """Retourne la configuration de la base de données"""
    if DATABASE_URL and DATABASE_URL.startswith("postgres"):
        return {"type": "postgres", "url": DATABASE_URL}
    return {"type": "sqlite", "path": SQLITE_PATH}

DB_CONFIG = get_db_config()

# ============================================================================
# 💳 PAIEMENTS - STRIPE
# ============================================================================

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_ENABLED = bool(STRIPE_SECRET_KEY and STRIPE_SECRET_KEY.startswith("sk_"))

# ============================================================================
# 💳 PAIEMENTS - COINBASE COMMERCE
# ============================================================================

COINBASE_COMMERCE_KEY = os.getenv("COINBASE_COMMERCE_KEY", "")
COINBASE_WEBHOOK_SECRET = os.getenv("COINBASE_WEBHOOK_SECRET", "")
COINBASE_ENABLED = bool(COINBASE_COMMERCE_KEY)

# ============================================================================
# 📱 TELEGRAM
# ============================================================================

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
TELEGRAM_ENABLED = bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)

# ============================================================================
# 🤖 OPENAI
# ============================================================================

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_ENABLED = bool(OPENAI_API_KEY)

# ============================================================================
# 📧 EMAIL - SENDGRID
# ============================================================================

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@cryptoia.ca")
SENDGRID_ENABLED = bool(SENDGRID_API_KEY)

# ============================================================================
# 📊 APIs CRYPTO - DONNÉES RÉELLES
# ============================================================================

# CoinGecko (gratuit, 50 req/min)
COINGECKO_API_URL = "https://api.coingecko.com/api/v3"
COINGECKO_PRO_API_KEY = os.getenv("COINGECKO_PRO_API_KEY", "")  # Optionnel pour plus de requêtes

# Binance (gratuit, données temps réel)
BINANCE_API_URL = "https://api.binance.com/api/v3"
BINANCE_API_KEY = os.getenv("BINANCE_API_KEY", "")
BINANCE_SECRET_KEY = os.getenv("BINANCE_SECRET_KEY", "")

# Alternative.me (Fear & Greed Index - gratuit)
FEAR_GREED_API_URL = "https://api.alternative.me/fng/"

# CryptoCompare (gratuit avec limites)
CRYPTOCOMPARE_API_URL = "https://min-api.cryptocompare.com/data"
CRYPTOCOMPARE_API_KEY = os.getenv("CRYPTOCOMPARE_API_KEY", "")

# Mempool.space (données Bitcoin on-chain - gratuit)
MEMPOOL_API_URL = os.getenv("MEMPOOL_API_BASE", "https://mempool.space/api")

# Blockchain.info (transactions whale - gratuit)
BLOCKCHAIN_INFO_URL = "https://blockchain.info"

# ============================================================================
# 💰 PLANS D'ABONNEMENT
# ============================================================================

SUBSCRIPTION_PLANS = {
    "free": {
        "name": "Gratuit",
        "price_monthly": 0,
        "price_yearly": 0,
        "features": [
            "Accès limité au dashboard",
            "Fear & Greed Index",
            "1 alerte par semaine",
            "Avec publicités"
        ],
        "max_alerts": 1,
        "api_calls_per_day": 10
    },
    "monthly": {
        "name": "Premium 1 Mois",
        "price_monthly": 29.99,
        "stripe_price_id": os.getenv("STRIPE_PRICE_MONTHLY", ""),
        "features": [
            "Accès complet au dashboard",
            "Trades illimités",
            "Tous les indicateurs IA",
            "Webhooks TradingView",
            "Support prioritaire"
        ],
        "max_alerts": 50,
        "api_calls_per_day": 500
    },
    "3months": {
        "name": "Premium 3 Mois",
        "price_total": 74.97,
        "price_monthly": 24.99,
        "discount": "17%",
        "stripe_price_id": os.getenv("STRIPE_PRICE_3MONTHS", ""),
        "features": [
            "Tout du Premium +",
            "Support 24/7",
            "17% de réduction"
        ],
        "max_alerts": 100,
        "api_calls_per_day": 1000
    },
    "6months": {
        "name": "Premium 6 Mois",
        "price_total": 134.94,
        "price_monthly": 22.49,
        "discount": "25%",
        "stripe_price_id": os.getenv("STRIPE_PRICE_6MONTHS", ""),
        "features": [
            "Tout du Premium +",
            "Support 24/7",
            "25% de réduction"
        ],
        "max_alerts": 200,
        "api_calls_per_day": 2000
    },
    "yearly": {
        "name": "Premium 1 An",
        "price_total": 239.88,
        "price_monthly": 19.99,
        "discount": "33%",
        "stripe_price_id": os.getenv("STRIPE_PRICE_YEARLY", ""),
        "features": [
            "Tout du Premium +",
            "Support 24/7 dédié",
            "33% de réduction",
            "Accès API",
            "Backtesting avancé"
        ],
        "max_alerts": 999,
        "api_calls_per_day": 10000
    }
}

# ============================================================================
# 🎨 CONFIGURATION UI
# ============================================================================

SITE_NAME = "CryptoIA"
SITE_DESCRIPTION = "Plateforme de Trading Crypto Intelligente"
SITE_LOGO = "/static/cryptoia_logo.png"
THEME_PRIMARY_COLOR = "#3b82f6"
THEME_SECONDARY_COLOR = "#8b5cf6"
THEME_DARK_BG = "#0f172a"

# ============================================================================
# ⏰ CACHE & PERFORMANCE
# ============================================================================

CACHE_TTL_PRICES = int(os.getenv("CACHE_TTL_PRICES", "60"))  # 1 minute
CACHE_TTL_MARKET_DATA = int(os.getenv("CACHE_TTL_MARKET_DATA", "300"))  # 5 minutes
CACHE_TTL_FEAR_GREED = int(os.getenv("CACHE_TTL_FEAR_GREED", "3600"))  # 1 heure
CACHE_TTL_WHALE_DATA = int(os.getenv("CACHE_TTL_WHALE_DATA", "120"))  # 2 minutes

# ============================================================================
# 📝 LOGGING
# ============================================================================

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# ============================================================================
# 🔍 VALIDATION & HELPERS
# ============================================================================

def validate_config():
    """Valide la configuration au démarrage"""
    warnings = []
    errors = []
    
    # Vérifications critiques
    if not SECRET_KEY or len(SECRET_KEY) < 32:
        warnings.append("⚠️ SECRET_KEY devrait avoir au moins 32 caractères")
    
    # Vérifications de services
    if not STRIPE_ENABLED:
        warnings.append("⚠️ Stripe non configuré - paiements désactivés")
    
    if not TELEGRAM_ENABLED:
        warnings.append("⚠️ Telegram non configuré - alertes désactivées")
    
    if not OPENAI_ENABLED:
        warnings.append("⚠️ OpenAI non configuré - fonctions IA limitées")
    
    if not SENDGRID_ENABLED:
        warnings.append("⚠️ SendGrid non configuré - emails désactivés")
    
    # Afficher les warnings
    for w in warnings:
        print(w)
    
    # Afficher les erreurs et arrêter si critique
    for e in errors:
        print(f"❌ {e}")
    
    if errors:
        raise ValueError("Configuration invalide - voir les erreurs ci-dessus")
    
    print("✅ Configuration validée")
    return True

def get_api_headers(service: str = "default") -> dict:
    """Retourne les headers appropriés pour chaque API"""
    base_headers = {
        "User-Agent": f"CryptoIA/2.0 (+{BASE_URL})",
        "Accept": "application/json"
    }
    
    if service == "coingecko" and COINGECKO_PRO_API_KEY:
        base_headers["x-cg-pro-api-key"] = COINGECKO_PRO_API_KEY
    elif service == "cryptocompare" and CRYPTOCOMPARE_API_KEY:
        base_headers["authorization"] = f"Apikey {CRYPTOCOMPARE_API_KEY}"
    
    return base_headers

# ============================================================================
# 🚀 INITIALISATION
# ============================================================================

print(f"""
╔══════════════════════════════════════════════════════════════╗
║           🚀 CryptoIA Trading Platform v2.0                  ║
╠══════════════════════════════════════════════════════════════╣
║  Environment: {ENV:<45} ║
║  Database: {DB_CONFIG['type']:<48} ║
║  Stripe: {'✅ Enabled' if STRIPE_ENABLED else '❌ Disabled':<48} ║
║  Coinbase: {'✅ Enabled' if COINBASE_ENABLED else '❌ Disabled':<46} ║
║  Telegram: {'✅ Enabled' if TELEGRAM_ENABLED else '❌ Disabled':<46} ║
║  OpenAI: {'✅ Enabled' if OPENAI_ENABLED else '❌ Disabled':<48} ║
║  SendGrid: {'✅ Enabled' if SENDGRID_ENABLED else '❌ Disabled':<46} ║
╚══════════════════════════════════════════════════════════════╝
""")