#!/usr/bin/env sh
set -eu

echo "PORT_ENV=${PORT:-<empty>}"
exec python -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}" --log-level info
