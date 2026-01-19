#!/usr/bin/env sh
set -e

PORT_TO_USE="${PORT:-8000}"
echo "🚀 Starting (boot wrapper) on PORT=${PORT_TO_USE}"

# Use boot wrapper so /health is always fast and deploy doesn't fail on slow import
exec uvicorn boot:app --host 0.0.0.0 --port "$PORT_TO_USE" --proxy-headers --forwarded-allow-ips='*'
