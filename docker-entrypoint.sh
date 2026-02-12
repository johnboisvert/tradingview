#!/bin/bash
set -e

echo "🚀 Démarrage de CryptoIA Trading Platform..."

# Variables d'environnement par défaut
PORT=${PORT:-8080}
HOST=${HOST:-0.0.0.0}
WORKERS=${WORKERS:-1}
LOG_LEVEL=${LOG_LEVEL:-info}

# Afficher la configuration
echo "📋 Configuration:"
echo "   - Port: $PORT"
echo "   - Host: $HOST"
echo "   - Workers: $WORKERS"
echo "   - Log Level: $LOG_LEVEL"

# Vérifier les variables critiques
if [ -z "$SECRET_KEY" ]; then
    echo "⚠️  SECRET_KEY non défini - génération automatique"
    export SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
fi

# Initialiser la base de données si nécessaire
echo "🗄️  Initialisation de la base de données..."
python3 -c "
try:
    from auth_service import auth_service
    print('✅ Tables auth initialisées')
except Exception as e:
    print(f'⚠️  Erreur init auth: {e}')

try:
    from subscription_system import init_subscription_tables
    init_subscription_tables()
    print('✅ Tables subscription initialisées')
except Exception as e:
    print(f'⚠️  Erreur init subscription: {e}')
" 2>/dev/null || echo "⚠️  Initialisation partielle"

# Démarrer l'application
echo "🌐 Démarrage du serveur..."
exec uvicorn main:app \
    --host "$HOST" \
    --port "$PORT" \
    --workers "$WORKERS" \
    --log-level "$LOG_LEVEL" \
    --access-log \
    --proxy-headers \
    --forwarded-allow-ips "*"