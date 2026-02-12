#!/usr/bin/env bash
set -euo pipefail

# Railway donne PORT automatiquement (souvent 8080)
PORT="${PORT:-8080}"

# DB_DIR: si tu l'as mis dans Railway -> Variables, on le respecte
DB_DIR="${DB_DIR:-/app/data}"

echo "PORT=$PORT"
echo "DB_DIR=$DB_DIR"

mkdir -p "$DB_DIR" /tmp/ai_trader /tmp/ebooks || true
chmod -R 777 "$DB_DIR" /tmp/ai_trader /tmp/ebooks || true

# Important: exec pour que Uvicorn soit PID1 (meilleure stabilité Railway)
exec python -m uvicorn main:app \
  --host 0.0.0.0 \
  --port "$PORT" \
  --proxy-headers \
  --forwarded-allow-ips="*"
