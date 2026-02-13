#!/bin/bash
# Script de démarrage pour Railway
# Gère correctement la variable d'environnement PORT

# Utiliser le port fourni par Railway, ou 8080 par défaut
APP_PORT="${PORT:-8080}"

echo "🚀 Démarrage de CryptoIA sur le port $APP_PORT"

# Lancer uvicorn avec le port correct
exec python -m uvicorn main:app --host 0.0.0.0 --port "$APP_PORT"