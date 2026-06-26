#!/usr/bin/env bash
# Test rapide du webhook Discord CryptoIA.
# Usage : ./test-discord-webhook.sh "https://discord.com/api/webhooks/.../..."
#
# Envoie 2 messages au channel #🏆-hall-of-fame :
#   1. Test embed "Influenceur" (doré)
#   2. Test embed "Légende" (fuchsia, avec mention récompense)

WEBHOOK_URL="${1:-$DISCORD_WEBHOOK_URL}"

if [ -z "$WEBHOOK_URL" ]; then
  echo "❌ Usage: $0 <DISCORD_WEBHOOK_URL>"
  echo "   ou export DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/..."
  exit 1
fi

echo "🏆 Test #1 — Embed Influenceur (doré)..."
curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "embeds": [{
      "title": "🏆 Nouveau badge Influenceur débloqué !",
      "description": "**te***@c*** a partagé son profil **5 fois** et débloque le badge Influenceur.",
      "color": 16170325,
      "timestamp": "'"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"'",
      "footer": { "text": "CryptoIA · Quiz Viral · Notifications · TEST" }
    }]
  }'
echo " ✅"
sleep 2

echo "👑 Test #2 — Embed Légende (fuchsia, avec récompense)..."
curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "embeds": [{
      "title": "👑 Nouveau badge LÉGENDE débloqué !",
      "description": "**jo***@g*** vient datteindre **50 partages à vie** et entre dans le cercle des Légendes CryptoIA.\n🎁 Récompense envoyée par email : un code promo **50% à vie** unique.",
      "color": 14238703,
      "timestamp": "'"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"'",
      "footer": { "text": "CryptoIA · Quiz Viral · Notifications · TEST" }
    }]
  }'
echo " ✅"
echo ""
echo "✅ Si tu vois les 2 messages dans ton channel Discord #🏆-hall-of-fame, c'est branché !"
