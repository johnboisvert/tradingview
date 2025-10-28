# ============================================================================
# TRADING BOT - VERSION OPTIMISÉE POUR FAIBLE LATENCE
# ============================================================================
# Modifications principales:
# - TG_MIN_DELAY_SEC réduit à 1 seconde (au lieu de 15)
# - Système de priorité: alertes trading en premier
# - Backoff exponentiel amélioré
# - Filtre optionnel pour types d'alertes
# ============================================================================

import os
import time
import asyncio
import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import json
from collections import defaultdict

# ============================================================================
# HELPER FUNCTIONS POUR VARIABLES D'ENVIRONNEMENT
# ============================================================================

def safe_int(value: str, default: int = 0) -> int:
    """
    Convertit une valeur en entier de manière sécurisée.
    Gère les cas où la valeur est un texte (comme 'high', 'medium', 'low')
    """
    if not value:
        return default
    
    # Si c'est déjà un nombre, le convertir
    try:
        return int(value)
    except ValueError:
        pass
    
    # Gérer les cas textuels pour LLM_REASONING
    value_lower = value.lower().strip()
    if value_lower in ['high', 'maximum', 'max']:
        return 2
    elif value_lower in ['medium', 'normal', 'standard']:
        return 1
    elif value_lower in ['low', 'minimum', 'min', 'off']:
        return 0
    
    # Si rien ne correspond, retourner la valeur par défaut
    return default

# ============================================================================
# VARIABLES D'ENVIRONNEMENT - MODIFIÉES POUR FAIBLE LATENCE
# ============================================================================

# Telegram Configuration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
TELEGRAM_ENABLED = int(os.getenv("TELEGRAM_ENABLED", "1"))

# 🚀 NOUVELLE CONFIG - DÉLAI RÉDUIT À 1 SECONDE
TG_MIN_DELAY_SEC = float(os.getenv("TG_MIN_DELAY_SEC", "1.0"))  # ⚡ Réduit de 15s à 1s
TG_PER_MIN_LIMIT = int(os.getenv("TG_PER_MIN_LIMIT", "25"))  # Limite: 25 msg/min (safe)
TG_PARSE = os.getenv("TG_PARSE", "HTML")
TG_SILENT = int(os.getenv("TG_SILENT", "0"))
TG_COMPACT = int(os.getenv("TG_COMPACT", "0"))
TG_SHOW_LLM = int(os.getenv("TG_SHOW_LLM", "0"))
TG_BUTTONS = int(os.getenv("TG_BUTTONS", "0"))
TG_BUTTON_TEXT = os.getenv("TG_BUTTON_TEXT", "📊 Dashboard")
TG_DASHBOARD_URL = os.getenv("TG_DASHBOARD_URL", "")

# 🆕 NOUVELLES VARIABLES - FILTRAGE ET PRIORITÉ
TG_FILTER_LIQUIDATIONS = int(os.getenv("TG_FILTER_LIQUIDATIONS", "0"))  # 1 = ignorer liquidations
TG_PRIORITY_MODE = int(os.getenv("TG_PRIORITY_MODE", "1"))  # 1 = trading alerts first
TG_MAX_RETRY = int(os.getenv("TG_MAX_RETRY", "3"))  # Nombre max de retry sur 429

# Altseason Configuration
ALT_GREENS_REQUIRED = int(os.getenv("ALT_GREENS_REQUIRED", "65"))
ALTSEASON_AUTONOTIFY = int(os.getenv("ALTSEASON_AUTONOTIFY", "0"))
ALTSEASON_NOTIFY_MIN_GAP_MIN = int(os.getenv("ALTSEASON_NOTIFY_MIN_GAP_MIN", "60"))
ALTSEASON_POLL_SECONDS = int(os.getenv("ALTSEASON_POLL_SECONDS", "300"))

# Trading Configuration
CONFIDENCE_MIN = float(os.getenv("CONFIDENCE_MIN", "0"))
COOLDOWN_SEC = int(os.getenv("COOLDOWN_SEC", "10"))
MIN_CONFLUENCE = int(os.getenv("MIN_CONFLUENCE", "0"))
RR_MIN = float(os.getenv("RR_MIN", "0"))
NEAR_SR_ATR = float(os.getenv("NEAR_SR_ATR", "0.5"))

# LLM Configuration
LLM_ENABLED = int(os.getenv("LLM_ENABLED", "0"))
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4")
LLM_REASONING = safe_int(os.getenv("LLM_REASONING", "1"), default=1)  # Accepte 'high', 'medium', 'low' ou 0/1/2
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Vector Configuration
VECTOR_TG_ENABLED = int(os.getenv("VECTOR_TG_ENABLED", "0"))
VECTOR_MIN_GAP_SEC = int(os.getenv("VECTOR_MIN_GAP_SEC", "120"))
VECTOR_GLOBAL_GAP_SEC = int(os.getenv("VECTOR_GLOBAL_GAP_SEC", "60"))

# Database & Security
DB_PATH = os.getenv("DB_PATH", "./data/trades.db")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")

# Server Configuration
PORT = int(os.getenv("PORT", "8000"))

# ============================================================================
# SYSTÈME DE STOCKAGE EN MÉMOIRE
# ============================================================================

trades_memory = []
last_telegram_message_time = 0
message_queue = []  # 🆕 Queue avec priorités

# Compteurs pour rate limiting
telegram_send_times = []  # Liste des timestamps d'envoi

# ============================================================================
# 🆕 SYSTÈME DE PRIORITÉ DES MESSAGES
# ============================================================================

def get_message_priority(trade_data: dict) -> int:
    """
    Retourne la priorité du message (0 = plus haute priorité)
    0: Alertes de trading (LONG/SHORT)
    1: Stop Loss / Take Profit
    2: Liquidations Binance
    3: Autres notifications
    """
    text = str(trade_data.get("text", "")).lower()
    
    # Priority 0: Trading signals
    if any(keyword in text for keyword in ["🟢 long", "🔴 short", "entry", "signal"]):
        return 0
    
    # Priority 1: SL/TP
    if any(keyword in text for keyword in ["stop loss", "take profit", "tp1", "tp2", "sl"]):
        return 1
    
    # Priority 2: Liquidations
    if "liquidation" in text or "liquidated" in text:
        return 2
    
    # Priority 3: Autres
    return 3

def should_filter_message(trade_data: dict) -> bool:
    """
    Retourne True si le message doit être filtré (ignoré)
    """
    if not TG_FILTER_LIQUIDATIONS:
        return False
    
    text = str(trade_data.get("text", "")).lower()
    
    # Filtrer les liquidations Binance
    if "liquidation" in text or "liquidated" in text:
        return True
    
    return False

# ============================================================================
# 🚀 FONCTION OPTIMISÉE D'ENVOI TELEGRAM
# ============================================================================

async def send_telegram_optimized(trade_data: dict, priority: Optional[int] = None):
    """
    Version optimisée avec:
    - Délai réduit (1s au lieu de 15s)
    - Backoff exponentiel intelligent
    - Gestion de priorité
    - Rate limiting intelligent (25 msg/min max)
    """
    global last_telegram_message_time, telegram_send_times
    
    # Vérification si Telegram est activé
    if not TELEGRAM_ENABLED:
        print("ℹ️  Telegram désactivé (TELEGRAM_ENABLED=0)")
        return
    
    # Vérification des credentials
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("❌ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant")
        return
    
    # Filtrage optionnel
    if should_filter_message(trade_data):
        print("🔇 Message filtré (liquidation)")
        return
    
    # Déterminer la priorité
    if priority is None:
        priority = get_message_priority(trade_data)
    
    priority_labels = {0: "🔥 HAUTE", 1: "⚡ MOYENNE", 2: "📊 BASSE", 3: "ℹ️  INFO"}
    print(f"📤 Envoi Telegram - Priorité: {priority_labels.get(priority, '❓')}")
    
    # ============================================================================
    # 🆕 RATE LIMITING INTELLIGENT (25 msg/min max)
    # ============================================================================
    current_time = time.time()
    
    # Nettoyer les timestamps > 60 secondes
    telegram_send_times = [t for t in telegram_send_times if current_time - t < 60]
    
    # Vérifier si on a atteint la limite
    if len(telegram_send_times) >= TG_PER_MIN_LIMIT:
        oldest_msg = min(telegram_send_times)
        wait_time = 60 - (current_time - oldest_msg) + 1
        print(f"⏸️  Rate limit atteint ({TG_PER_MIN_LIMIT} msg/min) - Attente {wait_time:.1f}s")
        await asyncio.sleep(wait_time)
        telegram_send_times = []  # Reset après attente
    
    # ============================================================================
    # DÉLAI ENTRE MESSAGES (1s au lieu de 15s)
    # ============================================================================
    time_since_last = current_time - last_telegram_message_time
    
    if time_since_last < TG_MIN_DELAY_SEC:
        wait_time = TG_MIN_DELAY_SEC - time_since_last
        print(f"⏳ Attente {wait_time:.2f}s (délai min: {TG_MIN_DELAY_SEC}s)")
        await asyncio.sleep(wait_time)
    
    # ============================================================================
    # PRÉPARATION DU MESSAGE
    # ============================================================================
    message_text = trade_data.get("text", "")
    
    # Boutons optionnels
    reply_markup = None
    if TG_BUTTONS and TG_DASHBOARD_URL:
        reply_markup = {
            "inline_keyboard": [[
                {"text": TG_BUTTON_TEXT, "url": TG_DASHBOARD_URL}
            ]]
        }
    
    # Payload
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message_text,
        "parse_mode": TG_PARSE,
        "disable_notification": bool(TG_SILENT)
    }
    
    if reply_markup:
        payload["reply_markup"] = reply_markup
    
    # ============================================================================
    # 🚀 ENVOI AVEC BACKOFF EXPONENTIEL INTELLIGENT
    # ============================================================================
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    
    retry_count = 0
    base_delay = 1  # Délai de base: 1 seconde
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        while retry_count < TG_MAX_RETRY:
            try:
                response = await client.post(url, json=payload)
                
                # ✅ SUCCÈS
                if response.status_code == 200:
                    last_telegram_message_time = time.time()
                    telegram_send_times.append(last_telegram_message_time)
                    print(f"✅ Message Telegram envoyé (tentative {retry_count + 1}/{TG_MAX_RETRY})")
                    return
                
                # ⚠️ RATE LIMIT (429)
                elif response.status_code == 429:
                    error_data = response.json()
                    retry_after = error_data.get("parameters", {}).get("retry_after", base_delay)
                    
                    # Backoff exponentiel: 1s, 2s, 4s, 8s...
                    if retry_after < base_delay:
                        retry_after = base_delay * (2 ** retry_count)
                    
                    retry_count += 1
                    
                    if retry_count < TG_MAX_RETRY:
                        print(f"⚠️  Rate limit (429) - Retry {retry_count}/{TG_MAX_RETRY} dans {retry_after}s")
                        await asyncio.sleep(retry_after)
                    else:
                        print(f"❌ Rate limit (429) - Max retries atteint après {TG_MAX_RETRY} tentatives")
                        break
                
                # ❌ AUTRE ERREUR
                else:
                    error_text = response.text
                    print(f"❌ Erreur Telegram {response.status_code}: {error_text}")
                    break
                    
            except Exception as e:
                retry_count += 1
                if retry_count < TG_MAX_RETRY:
                    wait = base_delay * (2 ** (retry_count - 1))
                    print(f"⚠️  Erreur réseau - Retry {retry_count}/{TG_MAX_RETRY} dans {wait}s: {e}")
                    await asyncio.sleep(wait)
                else:
                    print(f"❌ Erreur réseau - Max retries: {e}")
                    break

# ============================================================================
# 🆕 WORKER POUR TRAITER LA QUEUE AVEC PRIORITÉS
# ============================================================================

async def telegram_queue_worker():
    """
    Worker qui traite la queue de messages avec système de priorité
    """
    global message_queue
    
    print("🔄 Démarrage du worker Telegram...")
    
    while True:
        if message_queue:
            # Trier par priorité (0 = plus haute)
            message_queue.sort(key=lambda x: x.get("priority", 99))
            
            # Prendre le message le plus prioritaire
            msg = message_queue.pop(0)
            
            await send_telegram_optimized(msg["data"], msg.get("priority"))
        
        # Pause courte pour éviter busy-waiting
        await asyncio.sleep(0.1)

# ============================================================================
# CALCUL DE CONFIDENCE AMÉLIORÉ (VOTRE VERSION)
# ============================================================================

def calculate_confidence_v2(trade_data: dict) -> tuple:
    """Version améliorée du système de confiance (35-95%)"""
    
    # Base: 50%
    confidence = 50.0
    reasons = []
    
    # 1. RISK/REWARD (FACTEUR PRINCIPAL) ±25%
    rr = trade_data.get("rr", 0)
    if rr >= 4.0:
        confidence += 25
        reasons.append(f"R:R exceptionnel ({rr:.1f})")
    elif rr >= 3.0:
        confidence += 18
        reasons.append(f"R:R excellent ({rr:.1f})")
    elif rr >= 2.5:
        confidence += 12
        reasons.append(f"R:R bon ({rr:.1f})")
    elif rr >= 2.0:
        confidence += 5
        reasons.append(f"R:R correct ({rr:.1f})")
    elif rr >= 1.5:
        confidence -= 5
        reasons.append(f"R:R faible ({rr:.1f})")
    else:
        confidence -= 15
        reasons.append(f"R:R insuffisant ({rr:.1f})")
    
    # 2. DISTANCE DU STOP LOSS ±15%
    sl_dist = trade_data.get("sl_distance_pct", 0)
    if sl_dist < 1.5:
        confidence += 15
        reasons.append(f"SL très proche ({sl_dist:.1f}%)")
    elif sl_dist < 2.5:
        confidence += 8
        reasons.append(f"SL proche ({sl_dist:.1f}%)")
    elif sl_dist < 4.0:
        confidence += 3
        reasons.append(f"SL acceptable ({sl_dist:.1f}%)")
    elif sl_dist < 6.0:
        confidence -= 5
        reasons.append(f"SL éloigné ({sl_dist:.1f}%)")
    else:
        confidence -= 12
        reasons.append(f"SL trop éloigné ({sl_dist:.1f}%)")
    
    # 3. LEVERAGE ±10%
    leverage = trade_data.get("leverage", 1)
    if leverage <= 3:
        confidence += 10
        reasons.append(f"Leverage prudent ({leverage}x)")
    elif leverage <= 5:
        confidence += 5
        reasons.append(f"Leverage modéré ({leverage}x)")
    elif leverage <= 10:
        confidence -= 3
        reasons.append(f"Leverage élevé ({leverage}x)")
    else:
        confidence -= 8
        reasons.append(f"Leverage risqué ({leverage}x)")
    
    # 4. TIMEFRAME ±8%
    tf = trade_data.get("timeframe", "").upper()
    if tf in ["1D", "4H", "8H"]:
        confidence += 8
        reasons.append(f"TF favorable ({tf})")
    elif tf in ["1H", "2H"]:
        confidence += 4
        reasons.append(f"TF correct ({tf})")
    elif tf in ["15M", "30M"]:
        confidence -= 2
        reasons.append(f"TF court ({tf})")
    else:
        confidence -= 5
        reasons.append(f"TF très court ({tf})")
    
    # 5. NOMBRE DE TARGETS ±7%
    targets = []
    for i in range(1, 6):
        if trade_data.get(f"tp{i}"):
            targets.append(i)
    
    if len(targets) >= 3:
        confidence += 7
        reasons.append(f"{len(targets)} TPs (diversification)")
    elif len(targets) == 2:
        confidence += 3
        reasons.append(f"{len(targets)} TPs")
    elif len(targets) == 1:
        confidence -= 3
        reasons.append(f"1 seul TP (risqué)")
    else:
        confidence -= 7
        reasons.append("Aucun TP défini")
    
    # Limiter entre 35% et 95%
    confidence = max(35.0, min(95.0, confidence))
    
    # Garder les 5 raisons les plus importantes
    reasons = reasons[:5]
    
    return round(confidence, 1), reasons

# ============================================================================
# FORMATAGE DU MESSAGE TELEGRAM
# ============================================================================

def format_telegram_message(trade_data: dict) -> str:
    """Formate le message pour Telegram avec la nouvelle confiance"""
    
    side = trade_data.get("side", "LONG").upper()
    symbol = trade_data.get("symbol", "UNKNOWN")
    leverage = trade_data.get("leverage", 1)
    
    entry = trade_data.get("entry", 0)
    sl = trade_data.get("sl", 0)
    
    # Calcul de la confiance
    confidence, reasons = calculate_confidence_v2(trade_data)
    
    # Emojis
    side_emoji = "🟢" if side == "LONG" else "🔴"
    conf_emoji = "🔥" if confidence >= 80 else "⚡" if confidence >= 65 else "📊"
    
    # Message principal
    lines = [
        f"{side_emoji} <b>{side}</b> {symbol} {leverage}x",
        f"",
        f"💰 Entry: <code>{entry:.8f}</code>",
        f"🛑 Stop Loss: <code>{sl:.8f}</code>",
    ]
    
    # Take Profits
    tp_lines = []
    for i in range(1, 6):
        tp = trade_data.get(f"tp{i}")
        if tp:
            tp_lines.append(f"🎯 TP{i}: <code>{tp:.8f}</code>")
    
    lines.extend(tp_lines)
    
    # Confidence
    lines.append(f"")
    lines.append(f"{conf_emoji} <b>Confiance: {confidence}%</b>")
    
    # Raisons (max 5)
    if reasons:
        lines.append(f"")
        for reason in reasons:
            lines.append(f"  • {reason}")
    
    # Infos complémentaires
    tf = trade_data.get("timeframe", "")
    if tf:
        lines.append(f"")
        lines.append(f"⏱ Timeframe: {tf}")
    
    # Timestamp
    timestamp = datetime.now().strftime("%H:%M:%S")
    lines.append(f"")
    lines.append(f"🕐 {timestamp}")
    
    return "\n".join(lines)

# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(title="Trading Bot API - Optimized", version="2.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# WEBHOOK ENDPOINT (RECEPTION DES ALERTES TRADINGVIEW)
# ============================================================================

@app.post("/webhook")
async def webhook(request: Request):
    """
    Reçoit les alertes de TradingView et les met en queue avec priorité
    """
    try:
        data = await request.json()
        
        # Validation basique
        if not data.get("symbol"):
            raise HTTPException(status_code=400, detail="Symbol manquant")
        
        # Enrichissement
        data["received_at"] = datetime.now().isoformat()
        
        # Stocker en mémoire
        trades_memory.append(data)
        
        # 🆕 Ajouter à la queue avec priorité
        priority = get_message_priority(data)
        
        message_queue.append({
            "data": {"text": format_telegram_message(data)},
            "priority": priority
        })
        
        print(f"✅ Alerte reçue: {data.get('symbol')} - Priorité {priority} - Queue: {len(message_queue)}")
        
        return JSONResponse({"status": "success", "queue_size": len(message_queue)})
        
    except Exception as e:
        print(f"❌ Erreur webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    return {
        "status": "running",
        "version": "2.0 - Optimized",
        "telegram_enabled": bool(TELEGRAM_ENABLED),
        "min_delay": TG_MIN_DELAY_SEC,
        "max_per_minute": TG_PER_MIN_LIMIT,
        "priority_mode": bool(TG_PRIORITY_MODE),
        "filter_liquidations": bool(TG_FILTER_LIQUIDATIONS),
        "queue_size": len(message_queue)
    }

@app.get("/api/trades")
async def get_trades():
    """Retourne tous les trades en mémoire"""
    return {"trades": trades_memory, "count": len(trades_memory)}

@app.get("/api/stats")
async def get_stats():
    """Statistiques"""
    return {
        "total_trades": len(trades_memory),
        "queue_size": len(message_queue),
        "telegram_enabled": bool(TELEGRAM_ENABLED),
        "config": {
            "min_delay_sec": TG_MIN_DELAY_SEC,
            "max_per_minute": TG_PER_MIN_LIMIT,
            "max_retry": TG_MAX_RETRY,
            "priority_mode": bool(TG_PRIORITY_MODE),
            "filter_liquidations": bool(TG_FILTER_LIQUIDATIONS)
        }
    }

@app.get("/api/queue")
async def get_queue():
    """Voir la queue de messages"""
    return {
        "queue": message_queue,
        "size": len(message_queue)
    }

# ============================================================================
# STARTUP EVENT
# ============================================================================

@app.on_event("startup")
async def startup_event():
    print("=" * 80)
    print("🚀 TRADING BOT - VERSION OPTIMISÉE")
    print("=" * 80)
    print(f"Telegram activé: {bool(TELEGRAM_ENABLED)}")
    print(f"Délai minimum: {TG_MIN_DELAY_SEC}s (⚡ optimisé)")
    print(f"Limite par minute: {TG_PER_MIN_LIMIT} messages")
    print(f"Max retry sur 429: {TG_MAX_RETRY}")
    print(f"Mode priorité: {bool(TG_PRIORITY_MODE)}")
    print(f"Filtrer liquidations: {bool(TG_FILTER_LIQUIDATIONS)}")
    print("=" * 80)
    
    # Démarrer le worker
    asyncio.create_task(telegram_queue_worker())

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
