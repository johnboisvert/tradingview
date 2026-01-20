#!/usr/bin/env sh
set -eu

# Si Railway/une autre plateforme fournit PORT, on le prend, sinon 8080
PORT_VALUE="${PORT:-8080}"

# DB_DIR (ton volume est /app/data)
export DB_DIR="${DB_DIR:-/app/data}"

# Assure que les dossiers existent
mkdir -p "$DB_DIR" /tmp/ai_trader || true

echo "PORT=$PORT_VALUE"
echo "DB_DIR=$DB_DIR"
echo "Starting Uvicorn..."

# Si on passe une commande custom au container, on l’exécute
if [ "$#" -gt 0 ]; then
  exec "$@"
fi

# IMPORTANT: exec pour que le process soit PID 1 correctement (Railway)
exec python -m uvicorn main:app --host 0.0.0.0 --port "$PORT_VALUE"
