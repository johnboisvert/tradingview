# AI Trade Pro — LLM Bridge

## Déploiement
1. Renseigner les **Environment Variables** (Render → Settings → Environment):
   - `OPENAI_API_KEY`, `WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, etc.
2. Déployer. Les endpoints utiles:
   - `GET /health`
   - `GET /env-sanity?secret=<WEBHOOK_SECRET>`
   - `GET /openai-health?secret=<WEBHOOK_SECRET>`
   - `GET /tg-health?secret=<WEBHOOK_SECRET>`
   - `POST /tv-webhook`

## Test Telegram
- `GET /tg-health?secret=<WEBHOOK_SECRET>`
- Pour tester un autre chat_id: `/tg-health?secret=<WEBHOOK_SECRET>&chat_id=-100XXXX&text=Hello`

## TradingView → Webhook
- URL Webhook : `https://<ton-domaine>/tv-webhook`
- Message (JSON) minimal:
```json
{
  "tag": "live",
  "symbol": "BTCUSD",
  "tf": "15m",
  "time": 1735948800000,
  "close": 64000,
  "direction": "LONG",
  "features": {
    "trend": 1,
    "rejcount": 2,
    "volatility_atr": 250,
    "sr": {"R1": 64500, "S1": 62500},
    "vectorStreak": {"5": 1, "15": 1, "60": 1, "240": 0, "D": 1},
    "mtfSignal":   {"5": 1, "15": 1, "60": 1, "240": 0, "D": 1}
  },
  "levels": {"SL": 63500, "TP1": 64600, "TP2": 65200, "TP3": 66000},
  "secret": "<WEBHOOK_SECRET>"
}
