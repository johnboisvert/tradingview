# 🚀 CryptoIA Trading Platform v2.0

Plateforme de trading crypto professionnelle avec données en temps réel, analyse technique IA, et intégration TradingView.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Déploiement](#-déploiement)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)

## ✨ Fonctionnalités

### 📊 Données en temps réel
- Prix crypto via CoinGecko & Binance
- Fear & Greed Index (Alternative.me)
- Whale Transactions (Blockchain.info)
- Market Overview (dominance, volume, market cap)

### 🤖 Analyse IA
- Analyse technique avancée (RSI, MACD, Bollinger, etc.)
- Détection de patterns (Head & Shoulders, Double Top/Bottom, etc.)
- AI Swarm Agents (multi-agents pour analyses personnalisées)
- Altseason Copilot (détection des phases de marché)

### 💳 Paiements
- Stripe (cartes bancaires)
- Coinbase Commerce (crypto)
- Système d'abonnement avec permissions

### 📱 Intégrations
- TradingView Webhooks
- Alertes Telegram
- Emails SendGrid
- OpenAI GPT-4

## 🛠 Installation

### Prérequis
- Python 3.11+
- PostgreSQL (recommandé) ou SQLite
- Redis (optionnel, pour le cache)

### Installation locale

```bash
# Cloner le repo
git clone https://github.com/your-repo/tradingview.git
cd tradingview

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
.\venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos clés API

# Lancer l'application
uvicorn main:app --reload --port 8080
```

## ⚙️ Configuration

### Variables d'environnement requises

```env
# 🔐 Sécurité
SECRET_KEY=your-secret-key-min-32-chars
WEBHOOK_SECRET=your-tradingview-webhook-secret

# 💾 Base de données
DATABASE_URL=postgresql://user:pass@host:5432/dbname
# ou laisser vide pour SQLite

# 💳 Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 💳 Coinbase Commerce
COINBASE_COMMERCE_KEY=your-coinbase-key
COINBASE_WEBHOOK_SECRET=your-webhook-secret

# 📱 Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# 🤖 OpenAI
OPENAI_API_KEY=sk-...

# 📧 SendGrid
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# 📊 APIs Crypto (optionnel)
COINGECKO_PRO_API_KEY=your-pro-key
BINANCE_API_KEY=your-binance-key
```

## 🚀 Déploiement

### Railway (Recommandé)

1. Connectez votre repo GitHub à Railway
2. Ajoutez les variables d'environnement dans Settings
3. Railway détecte automatiquement le Dockerfile
4. Déployez !

### Docker

```bash
# Build
docker build -t cryptoia .

# Run
docker run -p 8080:8080 \
  -e SECRET_KEY=your-secret \
  -e DATABASE_URL=your-db-url \
  cryptoia
```

### Render / Fly.io

Le projet inclut les fichiers de configuration nécessaires :
- `Dockerfile` pour le build
- `fly.toml` pour Fly.io

## 📚 API Documentation

### Endpoints principaux

#### Market Data
```
GET /api/v2/prices?symbols=bitcoin,ethereum
GET /api/v2/market-overview
GET /api/v2/top-coins?limit=20
GET /api/v2/trending
GET /api/v2/fear-greed?limit=7
GET /api/v2/whale-transactions?min_btc=100&limit=20
GET /api/v2/history/{coin_id}?days=30
GET /api/v2/search?q=bitcoin
```

#### Authentification
```
POST /api/v2/auth/login
POST /api/v2/auth/register
POST /api/v2/auth/logout
GET  /api/v2/auth/me
```

#### TradingView Webhook
```
POST /tv-webhook
```

Payload exemple :
```json
{
  "tag": "live",
  "symbol": "BTCUSD",
  "tf": "15m",
  "direction": "LONG",
  "close": 97000,
  "levels": {"SL": 95000, "TP1": 99000},
  "secret": "YOUR_WEBHOOK_SECRET"
}
```

#### Health Checks
```
GET /health
GET /api/v2/meta/status
GET /api/v2/meta/health
```

## 🏗 Architecture

```
tradingview/
├── main.py                 # Application FastAPI principale
├── config.py               # Configuration centralisée
├── crypto_data_service.py  # Service de données crypto
├── auth_service.py         # Service d'authentification
├── api_routes.py           # Routes API v2
├── technical_analyzer.py   # Analyse technique
├── features_altseason.py   # Altseason Copilot
├── features_ai_swarm.py    # AI Swarm Agents
├── payment_routes.py       # Routes paiement
├── subscription_system.py  # Système d'abonnement
├── permissions_system.py   # Gestion des permissions
├── email_service.py        # Service email
├── requirements.txt        # Dépendances Python
├── Dockerfile              # Configuration Docker
├── docker-entrypoint.sh    # Script de démarrage
└── static/                 # Fichiers statiques
    └── cryptoia_logo.png
```

## 🔧 Développement

### Lancer les tests
```bash
pytest tests/ -v
```

### Linter
```bash
flake8 . --max-line-length=120
```

### Format
```bash
black . --line-length=120
```

## 📞 Support

- **Documentation**: https://help.cryptoia.ca
- **Email**: support@cryptoia.ca
- **Telegram**: @CryptoIASupport

## 📄 Licence

MIT License - voir [LICENSE](LICENSE)

---

Made with ❤️ by CryptoIA Team