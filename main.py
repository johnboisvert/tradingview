# main.py - Version Professionnelle Corrigée
import os
import sqlite3
import logging
import logging.handlers
import asyncio
import time
from collections import deque
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from contextlib import contextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field, validator

import httpx

# =========================
# Configuration
# =========================
class Settings:
    """Configuration centralisée"""
    DB_DIR = os.getenv("DB_DIR", "/tmp/ai_trader")
    DB_PATH = os.path.join(DB_DIR, "data.db")
    WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "nqgjiebqgiehgq8e76qhefjqer78gfq0eyrg")
    
    # Telegram
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
    TELEGRAM_ENABLED = bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)
    
    TG_MIN_DELAY_SEC = float(os.getenv("TG_MIN_DELAY_SEC", "10.0"))
    TG_PER_MIN_LIMIT = int(os.getenv("TG_PER_MIN_LIMIT", "10"))
    
    ALTSEASON_AUTONOTIFY = int(os.getenv("ALTSEASON_AUTONOTIFY", "1"))
    ALT_GREENS_REQUIRED = int(os.getenv("ALT_GREENS_REQUIRED", "3"))
    ALTSEASON_NOTIFY_MIN_GAP_MIN = int(os.getenv("ALTSEASON_NOTIFY_MIN_GAP_MIN", "60"))
    
    TELEGRAM_PIN_ALTSEASON = int(os.getenv("TELEGRAM_PIN_ALTSEASON", "1"))
    TG_BUTTONS = int(os.getenv("TG_BUTTONS", "1"))
    TG_BUTTON_TEXT = os.getenv("TG_BUTTON_TEXT", "📊 Ouvrir le Dashboard")
    TG_DASHBOARD_URL = os.getenv("TG_DASHBOARD_URL", "https://tradingview-gd03.onrender.com/trades")
    
    VECTOR_UP_ICON = "🟩"
    VECTOR_DN_ICON = "🟥"
    VECTOR_GLOBAL_GAP_SEC = int(os.getenv("VECTOR_GLOBAL_GAP_SEC", "10"))
    
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

settings = Settings()

# =========================
# Logging Professionnel
# =========================
os.makedirs(settings.DB_DIR, exist_ok=True)

logger = logging.getLogger("aitrader")
logger.setLevel(settings.LOG_LEVEL)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(settings.LOG_LEVEL)
console_formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

# File handler avec rotation
try:
    file_handler = logging.handlers.RotatingFileHandler(
        os.path.join(settings.DB_DIR, 'ai_trader.log'),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(console_formatter)
    logger.addHandler(file_handler)
except Exception as e:
    logger.warning(f"Could not create file handler: {e}")

logger.info(f"DB dir OK: {settings.DB_DIR} (using {settings.DB_PATH})")

# =========================
# Models Pydantic
# =========================
class WebhookPayload(BaseModel):
    """Validation des données webhook"""
    type: str
    symbol: str
    tf: Optional[str] = None
    tf_label: Optional[str] = None
    time: Optional[int] = None
    side: Optional[str] = None
    entry: Optional[float] = None
    sl: Optional[float] = None
    tp1: Optional[float] = None
    tp2: Optional[float] = None
    tp3: Optional[float] = None
    r1: Optional[float] = None
    s1: Optional[float] = None
    lev_reco: Optional[float] = None
    qty_reco: Optional[float] = None
    notional: Optional[float] = None
    confidence: Optional[int] = None
    horizon: Optional[str] = None
    leverage: Optional[str] = None
    note: Optional[str] = None
    price: Optional[float] = None
    direction: Optional[str] = None
    trade_id: Optional[str] = None
    secret: Optional[str] = None
    
    @validator('type')
    def validate_type(cls, v):
        valid_types = ['ENTRY', 'TP1_HIT', 'TP2_HIT', 'TP3_HIT', 'SL_HIT', 'CLOSE', 'VECTOR_CANDLE']
        if v not in valid_types:
            raise ValueError(f'Invalid type: {v}. Must be one of {valid_types}')
        return v
    
    @validator('side')
    def validate_side(cls, v):
        if v is not None and v.upper() not in ['LONG', 'SHORT']:
            raise ValueError(f'Invalid side: {v}. Must be LONG or SHORT')
        return v.upper() if v else None

# =========================
# SQLite avec Pool
# =========================
def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

@contextmanager
def get_db():
    """Context manager pour connexions DB thread-safe"""
    conn = sqlite3.connect(settings.DB_PATH, timeout=30.0)
    conn.row_factory = dict_factory
    try:
        yield conn
    finally:
        conn.close()

def db_execute(sql: str, params: tuple = ()):
    """Exécute une requête SQL avec gestion d'erreur"""
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute(sql, params)
            conn.commit()
            return cur
    except sqlite3.Error as e:
        logger.error(f"Database error: {e} - SQL: {sql[:100]}")
        raise

def db_query(sql: str, params: tuple = ()) -> List[dict]:
    """Exécute une requête SELECT avec gestion d'erreur"""
    try:
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute(sql, params)
            return list(cur.fetchall())
    except sqlite3.Error as e:
        logger.error(f"Database query error: {e} - SQL: {sql[:100]}")
        return []

# =========================
# Initialisation DB
# =========================
def init_database():
    """Initialise la base de données avec contraintes"""
    try:
        db_execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL CHECK(type IN ('ENTRY', 'TP1_HIT', 'TP2_HIT', 'TP3_HIT', 'SL_HIT', 'CLOSE', 'VECTOR_CANDLE')),
            symbol TEXT NOT NULL,
            tf TEXT,
            tf_label TEXT,
            time INTEGER NOT NULL,
            side TEXT CHECK(side IS NULL OR side IN ('LONG', 'SHORT')),
            entry REAL,
            sl REAL,
            tp1 REAL,
            tp2 REAL,
            tp3 REAL,
            r1 REAL,
            s1 REAL,
            lev_reco REAL,
            qty_reco REAL,
            notional REAL,
            confidence INTEGER CHECK(confidence IS NULL OR (confidence >= 0 AND confidence <= 100)),
            horizon TEXT,
            leverage TEXT,
            note TEXT,
            price REAL,
            direction TEXT,
            trade_id TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
        """)
        
        # Index optimisés
        db_execute("CREATE INDEX IF NOT EXISTS idx_events_trade_id ON events(trade_id)")
        db_execute("CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)")
        db_execute("CREATE INDEX IF NOT EXISTS idx_events_time ON events(time DESC)")
        db_execute("CREATE INDEX IF NOT EXISTS idx_events_symbol_tf ON events(symbol, tf)")
        db_execute("CREATE INDEX IF NOT EXISTS idx_events_composite ON events(symbol, tf, type, time DESC)")
        
        logger.info(f"Database initialized at {settings.DB_PATH}")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        raise

init_database()

# =========================
# Utils
# =========================
def tf_to_label(tf: Any) -> str:
    if tf is None:
        return ""
    s = str(tf)
    try:
        n = int(s)
    except Exception:
        return s
    if n < 60:
        return f"{n}m"
    if n == 60:
        return "1h"
    if n % 60 == 0:
        return f"{n//60}h"
    return s

def ensure_trades_schema():
    """Assure compatibilité schéma"""
    try:
        cols = {r["name"] for r in db_query("PRAGMA table_info(events)")}
        if "tf_label" not in cols:
            db_execute("ALTER TABLE events ADD COLUMN tf_label TEXT")
        if "created_at" not in cols:
            db_execute("ALTER TABLE events ADD COLUMN created_at INTEGER DEFAULT (strftime('%s', 'now'))")
    except Exception as e:
        logger.warning(f"ensure_trades_schema warning: {e}")

def now_ms() -> int:
    return int(datetime.now(timezone.utc).timestamp() * 1000)

def ms_ago(minutes: int) -> int:
    return int((datetime.now(timezone.utc) - timedelta(minutes=minutes)).timestamp() * 1000)

def human_duration_verbose(ms: int) -> str:
    if ms <= 0:
        return "0 s"
    s = ms // 1000
    h = s // 3600
    m = (s % 3600) // 60
    sec = s % 60
    if h > 0:
        return f"{h} h {m} min"
    if m > 0:
        return f"{m} min {sec} s"
    return f"{sec} s"

try:
    ensure_trades_schema()
except Exception as e:
    logger.warning(f"Schema update warning: {e}")

# =========================
# Telegram
# =========================
_last_tg_sent: Dict[str, float] = {}
_last_altseason_notify_ts: float = 0.0
_last_global_send_ts: float = 0.0
_send_times_window = deque()
_last_vector_flush_ts: float = 0.0

def _create_dashboard_button() -> Optional[dict]:
    if not settings.TG_BUTTONS or not settings.TG_DASHBOARD_URL:
        return None
    return {
        "inline_keyboard": [[
            {"text": settings.TG_BUTTON_TEXT, "url": settings.TG_DASHBOARD_URL}
        ]]
    }

async def _respect_rate_limits():
    global _last_global_send_ts, _send_times_window
    now = time.time()
    while _send_times_window and now - _send_times_window[0] > 60:
        _send_times_window.popleft()
    if len(_send_times_window) >= settings.TG_PER_MIN_LIMIT:
        sleep_for = 60 - (now - _send_times_window[0]) + 0.2
        if sleep_for > 0:
            await asyncio.sleep(sleep_for)
    delta = now - _last_global_send_ts
    if delta < settings.TG_MIN_DELAY_SEC:
        await asyncio.sleep(settings.TG_MIN_DELAY_SEC - delta)

def _record_sent():
    global _last_global_send_ts, _send_times_window
    ts = time.time()
    _last_global_send_ts = ts
    _send_times_window.append(ts)

async def tg_send_text(text: str, disable_web_page_preview: bool = True, key: Optional[str] = None,
                       reply_markup: Optional[dict] = None, pin: bool = False) -> Dict[str, Any]:
    if not settings.TELEGRAM_ENABLED:
        return {"ok": False, "reason": "telegram disabled"}
    k = key or "default"
    now_ts = time.time()
    last = _last_tg_sent.get(k, 0.0)
    if now_ts - last < settings.TG_MIN_DELAY_SEC:
        logger.warning("Telegram send skipped due to per-key cooldown")
        return {"ok": False, "reason": "cooldown"}
    _last_tg_sent[k] = now_ts
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": settings.TELEGRAM_CHAT_ID,
        "text": text,
        "disable_web_page_preview": disable_web_page_preview,
        "parse_mode": "HTML",
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    await _respect_rate_limits()
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(url, json=payload)
            if r.status_code == 429:
                try:
                    j = r.json()
                    ra = float(j.get("parameters", {}).get("retry_after", 30))
                except Exception:
                    ra = 30.0
                logger.warning(f"Telegram 429: retry_after={ra:.1f}s")
                await asyncio.sleep(ra + 0.5)
                await _respect_rate_limits()
                r = await client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()
            logger.info(f"Telegram sent: {text[:80]}...")
            _record_sent()
            if pin and settings.TELEGRAM_PIN_ALTSEASON and data.get("ok"):
                try:
                    message_id = data["result"]["message_id"]
                    pin_url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/pinChatMessage"
                    await client.post(pin_url, json={
                        "chat_id": settings.TELEGRAM_CHAT_ID,
                        "message_id": message_id,
                        "disable_notification": True
                    })
                except Exception as e:
                    logger.warning(f"Pin message failed: {e}")
            return {"ok": True, "result": data}
    except Exception as e:
        logger.error(f"Telegram send error: {e}")
        return {"ok": False, "reason": str(e)}

def _fmt_tf_label(tf: Any, tf_label: Optional[str]) -> str:
    return (tf_label or tf_to_label(tf) or "").strip()

def _fmt_side(side: Optional[str]) -> Dict[str, str]:
    s = (side or "").upper()
    if s == "LONG":
        return {"emoji": "📈", "label": "LONG"}
    if s == "SHORT":
        return {"emoji": "📉", "label": "SHORT"}
    return {"emoji": "📌", "label": (side or "Position").upper()}

def _calc_rr(entry: Optional[float], sl: Optional[float], tp1: Optional[float]) -> Optional[float]:
    try:
        if entry is None or sl is None or tp1 is None:
            return None
        risk = abs(entry - sl)
        reward = abs(tp1 - entry)
        return round(reward / risk, 2) if risk > 0 else None
    except Exception:
        return None

def format_vector_message(symbol: str, tf_label: str, direction: str, price: Any, note: Optional[str] = None) -> str:
    icon = settings.VECTOR_UP_ICON if (direction or "").upper() == "UP" else settings.VECTOR_DN_ICON
    n = f" — {note}" if note else ""
    return f"{icon} Vector Candle {direction.upper()} | <b>{symbol}</b> <i>{tf_label}</i> @ <code>{price}</code>{n}"

def compute_altseason_snapshot() -> dict:
    """Calcule le score altseason avec la liste des symboles"""
    t24 = ms_ago(24*60)
    row = db_query("""
        SELECT
          SUM(CASE WHEN side='LONG' THEN 1 ELSE 0 END) AS long_n,
          SUM(CASE WHEN side='SHORT' THEN 1 ELSE 0 END) AS short_n
        FROM events
        WHERE type='ENTRY' AND time>=?
    """, (t24,))
    long_n = (row[0]["long_n"] if row else 0) or 0
    short_n = (row[0]["short_n"] if row else 0) or 0
    def _pct(x, y):
        try:
            x = float(x or 0); y = float(y or 0)
            return 0.0 if y == 0 else 100.0 * x / y
        except Exception:
            return 0.0
    A = _pct(long_n, long_n + short_n)
    row = db_query("""
      WITH tp AS (
        SELECT COUNT(*) AS n FROM events
        WHERE type IN ('TP1_HIT','TP2_HIT','TP3_HIT') AND time>=? AND (side IS NULL OR side='LONG')
      ),
      sl AS (
        SELECT COUNT(*) AS n FROM events
        WHERE type='SL_HIT' AND time>=? AND (side IS NULL OR side='LONG')
      )
      SELECT tp.n AS tp_n, sl.n AS sl_n FROM tp, sl
    """, (t24, t24))
    tp_n = (row[0]["tp_n"] if row else 0) or 0
    sl_n = (row[0]["sl_n"] if row else 0) or 0
    B = _pct(tp_n, tp_n + sl_n)
    
    # Récupérer la liste des symboles avec TP
    symbols_with_tp = db_query("""
      SELECT DISTINCT symbol FROM events
      WHERE type IN ('TP1_HIT','TP2_HIT','TP3_HIT') AND time>=?
      ORDER BY symbol
    """, (t24,))
    symbol_list = [r["symbol"] for r in symbols_with_tp]
    sym_gain = len(symbol_list)
    
    C = float(min(100.0, sym_gain * 2.0))
    t90 = ms_ago(90)
    row = db_query("""
      WITH w AS (
        SELECT SUM(CASE WHEN time>=? THEN 1 ELSE 0 END) AS recent_n,
               COUNT(*) AS total_n
        FROM events
        WHERE type='ENTRY' AND time>=?
      )
      SELECT recent_n, total_n FROM w
    """, (t90, t24))
    recent_n = (row[0]["recent_n"] if row else 0) or 0
    total_n  = (row[0]["total_n"] if row else 0) or 0
    D = _pct(recent_n, total_n)
    score = round((A + B + C + D)/4.0)
    label = "Altseason (forte)" if score >= 75 else ("Altseason (modérée)" if score >= 50 else "Marché neutre/faible")
    return {
        "score": int(score),
        "label": label,
        "window_minutes": 24*60,
        "disclaimer": "Score indicatif basé sur données historiques. Ne constitue pas un conseil d'investissement.",
        "signals": {
            "long_ratio": round(A, 1),
            "tp_vs_sl": round(B, 1),
            "breadth_symbols": int(sym_gain),
            "recent_entries_ratio": round(D, 1),
        },
        "symbols_with_tp": symbol_list  # NOUVEAU: liste des symboles
    }

def build_confidence_line(payload: dict) -> str:
    """Calcule la confiance dynamique par trade"""
    entry = payload.get("entry")
    sl = payload.get("sl")
    tp1 = payload.get("tp1")
    rr = _calc_rr(entry, sl, tp1)
    alt = compute_altseason_snapshot()
    lev = (payload.get("leverage") or payload.get("lev_reco") or "").strip()
    
    factors = []
    conf = payload.get("confidence")
    
    if conf is None:
        base = 50
        
        # R/R contribution
        if rr is not None:
            base += max(min((rr - 1.0) * 10, 20), -10)
            factors.append(f"R/R {rr}")
        
        # Momentum contribution
        momentum_val = alt["signals"]["recent_entries_ratio"]
        base += max(min((momentum_val - 50) * 0.3, 15), -15)
        factors.append(f"Momentum {momentum_val}%")
        
        # Breadth contribution
        breadth_val = alt["signals"]["breadth_symbols"]
        base += max(min((breadth_val - 10) * 0.7, 15), -10)
        factors.append(f"Breadth {breadth_val} sym")
        
        # Bias LONG contribution
        long_ratio = alt["signals"]["long_ratio"]
        factors.append(f"Bias LONG {long_ratio}%")
        
        # Leverage factor
        if lev:
            try:
                lev_f = float(str(lev).lower().replace("x","").replace("cross","").strip())
                if lev_f >= 15:
                    lev_txt = "lev élevé"
                    base -= 5  # Pénalité pour lev élevé
                elif lev_f >= 7:
                    lev_txt = "lev moyen"
                else:
                    lev_txt = "lev faible"
                    base += 5  # Bonus pour lev faible
            except Exception:
                lev_txt = lev
            factors.append(lev_txt)
        
        conf = int(max(5, min(95, round(base))))
        payload["confidence"] = conf
    else:
        # Si conf existe déjà, on garde les facteurs pour info
        if rr is not None:
            factors.append(f"R/R {rr}")
        factors.append(f"Momentum {alt['signals']['recent_entries_ratio']}%")
        factors.append(f"Breadth {alt['signals']['breadth_symbols']} sym")
        factors.append(f"Bias LONG {alt['signals']['long_ratio']}%")
    
    return f"🧠 Confiance: {conf}% — basé sur " + ", ".join(factors)

def format_entry_announcement(payload: dict) -> str:
    """Formate le message d'entrée avec prix visible"""
    symbol   = payload.get("symbol", "")
    tf_lbl   = _fmt_tf_label(payload.get("tf"), payload.get("tf_label"))
    side_i   = _fmt_side(payload.get("side"))
    entry    = payload.get("entry")
    tp1      = payload.get("tp1")
    tp2      = payload.get("tp2")
    tp3      = payload.get("tp3")
    sl       = payload.get("sl")
    leverage = payload.get("leverage") or payload.get("lev_reco") or ""
    note     = (payload.get("note") or "").strip()
    
    rr = _calc_rr(entry, sl, tp1)
    rr_text = f" (R/R: {rr:.2f})" if rr is not None else ""
    
    lines = []
    if tp1 is not None: lines.append(f"🎯 TP1: {tp1}{rr_text}")
    if tp2 is not None: lines.append(f"🎯 TP2: {tp2}")
    if tp3 is not None: lines.append(f"🎯 TP3: {tp3}")
    if sl  is not None: lines.append(f"❌ SL: {sl}")
    
    conf_line = build_confidence_line(payload)
    tip_line = "💡 Astuce: après TP1, placez SL au BE." if tp1 is not None else ""
    
    t_entry = payload.get("time") or now_ms()
    elapsed = max(0, (now_ms() - int(t_entry)))
    elapsed_line = f"⏱ Temps écoulé : {human_duration_verbose(elapsed)}"
    
    # Message avec prix d'entrée bien visible
    entry_text = f"<b>Entry: {entry}</b>" if entry is not None else "Entry: N/A"
    
    msg = [
        f"🚨 <b>NOUVELLE POSITION</b>",
        f"📊 {symbol} {tf_lbl}",
        f"{side_i['emoji']} {side_i['label']} | {entry_text}",
        f"⚡ Leverage: {leverage}" if leverage else "",
        "",
        *lines,
        "",
        conf_line,
        tip_line,
        elapsed_line,
    ]
    if note:
        msg.append(f"📝 {note}")
    
    return "\n".join([m for m in msg if m])

def format_event_announcement(etype: str, payload: dict, duration_ms: Optional[int]) -> str:
    """Formate les annonces avec temps écoulé TOUJOURS affiché"""
    symbol = payload.get("symbol", "")
    tf_lbl = _fmt_tf_label(payload.get("tf"), payload.get("tf_label"))
    side_i = _fmt_side(payload.get("side"))
    base   = f"{symbol} {tf_lbl}"
    
    # Temps écoulé TOUJOURS présent
    if duration_ms is not None and duration_ms > 0:
        d_txt = f"⏱ Temps écoulé : {human_duration_verbose(duration_ms)}"
    else:
        d_txt = "⏱ Temps écoulé : N/A"
    
    if etype in ("TP1_HIT", "TP2_HIT", "TP3_HIT"):
        tick = {"TP1_HIT": "TP1", "TP2_HIT": "TP2", "TP3_HIT": "TP3"}[etype]
        price = payload.get("price") or payload.get("tp1") or payload.get("tp2") or payload.get("tp3") or ""
        price_txt = f" @ {price}" if price else ""
        return f"✅ <b>{tick} ATTEINT</b>{price_txt}\n📊 {base}\n{side_i['emoji']} {side_i['label']}\n{d_txt}"
    
    if etype == "SL_HIT":
        price = payload.get("price") or payload.get("sl") or ""
        price_txt = f" @ {price}" if price else ""
        return f"🛑 <b>SL TOUCHÉ</b>{price_txt}\n📊 {base}\n{side_i['emoji']} {side_i['label']}\n{d_txt}"
    
    if etype == "CLOSE":
        note = payload.get("note") or ""
        x = f"📪 <b>TRADE CLÔTURÉ</b>\n📊 {base}\n{side_i['emoji']} {side_i['label']}"
        if note:
            x += f"\n📝 {note}"
        x += f"\n{d_txt}"
        return x
    
    return f"ℹ️ {etype} — {base}\n{d_txt}"

# =========================
# FastAPI
# =========================
app = FastAPI(title="AI Trader Pro", version="2.1")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

@app.get("/", response_class=HTMLResponse)
async def root():
    return HTMLResponse("""
    <html><head><meta charset="utf-8"><title>AI Trader Pro</title></head>
    <body style="font-family:system-ui; padding:24px; background:#0b0f14; color:#e6edf3;">
      <h1>AI Trader Pro v2.1</h1>
      <p>Endpoints:</p>
      <ul>
        <li><a href="/trades">/trades</a> — Dashboard</li>
        <li><a href="/positions">/positions</a> — Positions actives</li>
        <li><a href="/history">/history</a> — Historique</li>
        <li><a href="/health">/health</a> — Health Check</li>
        <li><code>POST /tv-webhook</code> — Webhook TradingView</li>
      </ul>
    </body></html>
    """)

@app.get("/health")
async def health_check():
    """Health check endpoint pour monitoring"""
    try:
        db_query("SELECT 1")
        db_status = "ok"
        db_records = db_query("SELECT COUNT(*) as cnt FROM events")[0]["cnt"]
    except Exception as e:
        db_status = f"error: {str(e)}"
        db_records = 0
    
    return {
        "status": "healthy" if db_status == "ok" else "degraded",
        "database": db_status,
        "total_events": db_records,
        "telegram_enabled": settings.TELEGRAM_ENABLED,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.1"
    }

def save_event(payload: WebhookPayload) -> str:
    """Sauvegarde un événement avec validation"""
    try:
        etype   = payload.type
        symbol  = payload.symbol
        tf      = payload.tf
        tflabel = payload.tf_label or tf_to_label(tf)
        t       = payload.time or now_ms()
        side    = payload.side
        entry   = payload.entry
        sl      = payload.sl
        tp1     = payload.tp1
        tp2     = payload.tp2
        tp3     = payload.tp3
        r1      = payload.r1
        s1      = payload.s1
        lev_reco= payload.lev_reco
        qty_reco= payload.qty_reco
        notional= payload.notional
        confidence = payload.confidence
        horizon = payload.horizon
        leverage= payload.leverage
        note    = payload.note
        price   = payload.price
        direction = payload.direction
        trade_id  = payload.trade_id
        
        if trade_id is None and etype and symbol and tf:
            trade_id = f"{symbol}_{tf}_{t}"
        
        db_execute("""
            INSERT INTO events(type, symbol, tf, tf_label, time, side, entry, sl, tp1, tp2, tp3, r1, s1,
                               lev_reco, qty_reco, notional, confidence, horizon, leverage,
                               note, price, direction, trade_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (etype, symbol, str(tf) if tf is not None else None, tflabel, int(t),
              side, entry, sl, tp1, tp2, tp3, r1, s1,
              lev_reco, qty_reco, notional, confidence, horizon, leverage,
              note, price, direction, trade_id))
        
        logger.info(f"Saved event: type={etype} symbol={symbol} tf={tf} trade_id={trade_id}")
        return trade_id
    except Exception as e:
        logger.error(f"Error saving event: {e}")
        raise

def get_entry_time_for_trade(trade_id: Optional[str]) -> Optional[int]:
    if not trade_id:
        return None
    r = db_query("""
        SELECT MIN(time) AS t FROM events
        WHERE trade_id=? AND type='ENTRY'
    """, (trade_id,))
    if r and r[0]["t"] is not None:
        return int(r[0]["t"])
    return None

@app.post("/tv-webhook")
async def tv_webhook(req: Request):
    """Webhook TradingView avec validation"""
    try:
        payload_dict = await req.json()
    except Exception as e:
        logger.error(f"Invalid JSON: {e}")
        raise HTTPException(400, f"Invalid JSON: {str(e)}")
    
    # Vérification du secret
    secret = payload_dict.get("secret")
    if settings.WEBHOOK_SECRET and secret != settings.WEBHOOK_SECRET:
        logger.warning(f"Forbidden: invalid secret from {req.client.host}")
        raise HTTPException(403, "Forbidden")
    
    # Validation Pydantic
    try:
        payload = WebhookPayload(**payload_dict)
    except Exception as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(422, f"Validation error: {str(e)}")
    
    trade_id = save_event(payload)
    
    # Notification Telegram
    try:
        if settings.TELEGRAM_ENABLED:
            key = payload.trade_id or f"{payload.type}:{payload.symbol}"
            if payload.type == "VECTOR_CANDLE":
                global _last_vector_flush_ts
                now_sec = time.time()
                if now_sec - _last_vector_flush_ts < settings.VECTOR_GLOBAL_GAP_SEC:
                    logger.info("Skip VECTOR_CANDLE by global throttle")
                else:
                    _last_vector_flush_ts = now_sec
                    txt = format_vector_message(
                        symbol=payload.symbol,
                        tf_label=payload.tf_label or tf_to_label(payload.tf),
                        direction=(payload.direction or ""),
                        price=payload.price,
                        note=payload.note,
                    )
                    await tg_send_text(txt, key=key)
            elif payload.type == "ENTRY":
                txt = format_entry_announcement(payload.dict())
                await tg_send_text(txt, key=key)
            elif payload.type in {"TP1_HIT", "TP2_HIT", "TP3_HIT", "SL_HIT", "CLOSE"}:
                hit_time = payload.time or now_ms()
                entry_t  = get_entry_time_for_trade(payload.trade_id)
                duration = (hit_time - entry_t) if entry_t is not None else None
                txt = format_event_announcement(payload.type, payload.dict(), duration)
                await tg_send_text(txt, key=key)
        await maybe_altseason_autonotify()
    except Exception as e:
        logger.warning(f"Telegram notification skipped: {e}")
    
    return JSONResponse({"ok": True, "trade_id": trade_id})

async def maybe_altseason_autonotify():
    global _last_altseason_notify_ts
    if not settings.ALTSEASON_AUTONOTIFY or not settings.TELEGRAM_ENABLED:
        return
    alt = compute_altseason_snapshot()
    greens = alt["signals"]["breadth_symbols"]
    nowt = time.time()
    if greens < settings.ALT_GREENS_REQUIRED or alt["score"] < 50:
        return
    if (nowt - _last_altseason_notify_ts) < (settings.ALTSEASON_NOTIFY_MIN_GAP_MIN * 60):
        return
    emoji = "🟢" if alt["score"] >= 75 else "🟡"
    
    # Liste des symboles
    symbols_list = ", ".join(alt["symbols_with_tp"][:15])  # Max 15 symboles
    if len(alt["symbols_with_tp"]) > 15:
        symbols_list += f" +{len(alt['symbols_with_tp'])-15} autres"
    
    msg = f"""🚨 <b>Alerte Altseason Automatique</b> {emoji}

📊 <b>Score: {alt['score']}/100</b>
📈 Status: <b>{alt['label']}</b>

🔥 <b>Signaux détectés</b>:
- Ratio LONG: {alt['signals']['long_ratio']}%
- TP vs SL: {alt['signals']['tp_vs_sl']}%
- Breadth: {alt['signals']['breadth_symbols']} symboles
- Momentum: {alt['signals']['recent_entries_ratio']}%

⚡ <b>{greens} symboles</b> avec TP atteints:
{symbols_list}

<i>{alt['disclaimer']}</i>"""
    reply_markup = _create_dashboard_button()
    res = await tg_send_text(msg, key="altseason", reply_markup=reply_markup, pin=True)
    if res.get("ok"):
        _last_altseason_notify_ts = nowt

def _latest_entry_for_trade(trade_id: str) -> Optional[dict]:
    r = db_query("""
      SELECT * FROM events
      WHERE trade_id=? AND type='ENTRY'
      ORDER BY time DESC LIMIT 1
    """, (trade_id,))
    return r[0] if r else None

def _has_hit_map(trade_id: str) -> Dict[str, bool]:
    hits = db_query("""
      SELECT type, MIN(time) AS t FROM events
      WHERE trade_id=? AND type IN ('TP1_HIT','TP2_HIT','TP3_HIT','SL_HIT','CLOSE')
      GROUP BY type
    """, (trade_id,))
    return {h["type"]: True for h in hits}

def _first_outcome(trade_id: str) -> Optional[str]:
    """Trouve le premier outcome TP ou SL - CORRIGÉ"""
    rows = db_query("""
      SELECT type, time FROM events
      WHERE trade_id=? AND type IN ('TP1_HIT','TP2_HIT','TP3_HIT','SL_HIT')
      ORDER BY time ASC LIMIT 1
    """, (trade_id,))
    if not rows:
        return None
    t = rows[0]["type"]
    # TP1_HIT, TP2_HIT, TP3_HIT = TP
    if t in ('TP1_HIT', 'TP2_HIT', 'TP3_HIT'):
        return "TP"
    elif t == "SL_HIT":
        return "SL"
    return None

def _cancelled_by_opposite(entry_row: dict) -> bool:
    symbol = entry_row.get("symbol")
    tf = entry_row.get("tf")
    side = (entry_row.get("side") or "").upper()
    t = int(entry_row.get("time") or 0)
    if not symbol or tf is None or side not in ("LONG", "SHORT"):
        return False
    opposite = "SHORT" if side == "LONG" else "LONG"
    r = db_query("""
      SELECT 1 FROM events
      WHERE type='ENTRY' AND symbol=? AND tf=? AND time>? AND UPPER(COALESCE(side,''))=?
      LIMIT 1
    """, (symbol, str(tf), t, opposite))
    return bool(r)

def build_trade_rows(limit=300):
    base = db_query("""
      SELECT e.trade_id, MAX(e.time) AS t_entry
      FROM events e
      WHERE e.type='ENTRY'
      GROUP BY e.trade_id
      ORDER BY t_entry DESC
      LIMIT ?
    """, (limit,))
    rows: List[dict] = []
    for item in base:
        e = _latest_entry_for_trade(item["trade_id"])
        if not e: continue
        tf_label = (e.get("tf_label") or tf_to_label(e.get("tf")))
        hm = _has_hit_map(e["trade_id"])
        tp1_hit = bool(hm.get("TP1_HIT")); tp2_hit = bool(hm.get("TP2_HIT")); tp3_hit = bool(hm.get("TP3_HIT"))
        sl_hit  = bool(hm.get("SL_HIT"));  closed  = bool(hm.get("CLOSE"))
        cancelled = _cancelled_by_opposite(e) and not (tp1_hit or tp2_hit or tp3_hit or sl_hit)
        if sl_hit:
            state = "sl"
        elif tp1_hit or tp2_hit or tp3_hit:
            state = "tp"
        elif cancelled or closed:
            state = "cancel"
        else:
            state = "normal"
        rows.append({
            "trade_id": e["trade_id"],
            "symbol": e["symbol"],
            "tf_label": tf_label,
            "side": e["side"],
            "entry": e["entry"],
            "tp1": e["tp1"], "tp2": e["tp2"], "tp3": e["tp3"],
            "sl": e["sl"],
            "tp1_hit": tp1_hit, "tp2_hit": tp2_hit, "tp3_hit": tp3_hit,
            "sl_hit": sl_hit,
            "row_state": state,
            "t_entry": item["t_entry"],
        })
    return rows

def compute_kpis(rows: List[dict]) -> Dict[str, Any]:
    """Calcul KPI avec métriques réalistes - CORRIGÉ"""
    t24 = ms_ago(24*60)
    total_trades = db_query(
        "SELECT COUNT(DISTINCT trade_id) AS n FROM events WHERE type='ENTRY' AND time>=?", (t24,)
    )[0]["n"] or 0
    
    # TP hits totaux
    tp_hits = db_query(
        "SELECT COUNT(*) AS n FROM events WHERE type IN ('TP1_HIT','TP2_HIT','TP3_HIT') AND time>=?", (t24,)
    )[0]["n"] or 0
    
    # Liste des trades avec détails TP
    tp_details = db_query("""
        SELECT DISTINCT symbol, type, time 
        FROM events 
        WHERE type IN ('TP1_HIT','TP2_HIT','TP3_HIT') AND time>=?
        ORDER BY time DESC
    """, (t24,))
    
    trade_ids = [r["trade_id"] for r in db_query(
        "SELECT DISTINCT trade_id FROM events WHERE type='ENTRY' AND time>=?", (t24,)
    )]
    
    wins = 0
    losses = 0
    for tid in trade_ids:
        o = _first_outcome(tid)
        if o == "TP":
            wins += 1
        elif o == "SL":
            losses += 1
    
    winrate = (wins / max(1, (wins + losses))) * 100.0 if (wins + losses) > 0 else 0.0
    active = sum(1 for r in rows if r["row_state"] == "normal")
    cancelled = sum(1 for r in rows if r["row_state"] == "cancel")
    
    return {
        "total_trades": int(total_trades),
        "active_trades": int(active),
        "tp_hits": int(tp_hits),
        "tp_details": tp_details,  # NOUVEAU
        "winrate": round(winrate, 1),
        "wins": wins,
        "losses": losses,
        "cancelled": cancelled,
        "total_closed": wins + losses,
    }

def generate_sidebar_html(active_page: str, kpi: dict) -> str:
    """Génère le HTML de la sidebar avec navigation"""
    return f'''
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">⚡</div>
        <div class="logo-text">
          <h2>AI Trader</h2>
          <p>Professional</p>
        </div>
      </div>
      <nav>
        <div class="nav-item {'active' if active_page == 'dashboard' else ''}" onclick="window.location.href='/trades'">
          <span>📊</span><span>Dashboard</span>
        </div>
        <div class="nav-item {'active' if active_page == 'positions' else ''}" onclick="window.location.href='/positions'">
          <span>📈</span><span>Positions</span><span class="nav-badge">{kpi.get('active_trades', 0)}</span>
        </div>
        <div class="nav-item {'active' if active_page == 'history' else ''}" onclick="window.location.href='/history'">
          <span>📜</span><span>Historique</span>
        </div>
        <div class="nav-item" onclick="alert('Section en développement')">
          <span>📉</span><span>Analytics</span>
        </div>
      </nav>
      <div class="ml-status">
        <div class="ml-status-header"><h4><span class="status-dot"></span> Performance</h4></div>
        <div class="ml-metric"><span class="label">Win Rate</span><span class="value">{kpi.get('winrate', 0)}%</span></div>
        <div class="ml-metric"><span class="label">Wins/Losses</span><span class="value">{kpi.get('wins', 0)}/{kpi.get('losses', 0)}</span></div>
        <div class="ml-metric"><span class="label">TP Atteints</span><span class="value">{kpi.get('tp_hits', 0)}</span></div>
      </div>
      <div class="user-profile">
        <div class="avatar">TP</div>
        <div class="user-info">
          <div class="name">Trader Pro</div>
          <div class="status"><span class="status-dot"></span> En ligne</div>
        </div>
        <div style="margin-left:auto">⚙️</div>
      </div>
    </aside>
    '''

def get_base_css() -> str:
    """Retourne le CSS commun"""
    return """
    :root{--bg:#050a12;--sidebar:#0a0f1a;--panel:rgba(15,23,38,0.8);--card:rgba(20,30,48,0.6);--border:rgba(99,102,241,0.12);--txt:#e2e8f0;--muted:#64748b;--accent:#6366f1;--accent2:#8b5cf6;--success:#10b981;--danger:#ef4444;--warning:#f59e0b;--info:#06b6d4;--purple:#a855f7;--glow:rgba(99,102,241,0.25)}
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#050a12;color:var(--txt);font-family:'Inter',system-ui,sans-serif;overflow-x:hidden}
    body::before{content:'';position:fixed;inset:0;background:radial-gradient(circle at 15% 25%, rgba(99,102,241,0.08) 0%, transparent 45%),radial-gradient(circle at 85% 75%, rgba(139,92,246,0.06) 0%, transparent 45%);pointer-events:none}
    .app{display:flex;min-height:100vh;position:relative;z-index:1}
    .sidebar{width:300px;background:linear-gradient(180deg, rgba(10,15,26,0.98) 0%, rgba(10,15,26,0.95) 100%);backdrop-filter:blur(40px);border-right:1px solid var(--border);padding:28px 20px;display:flex;flex-direction:column;position:fixed;height:100vh;z-index:100;box-shadow:4px 0 40px rgba(0,0,0,0.5)}
    .logo{display:flex;align-items:center;gap:14px;margin-bottom:36px;padding-bottom:24px;border-bottom:1px solid var(--border)}
    .logo-icon{width:48px;height:48px;background:linear-gradient(135deg, var(--accent), var(--purple));border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 8px 32px var(--glow);position:relative}
    .logo-icon::before{content:'';position:absolute;inset:-3px;background:inherit;border-radius:16px;filter:blur(16px);opacity:0.6;z-index:-1}
    .logo-text h2{font-size:22px;font-weight:900;background:linear-gradient(135deg, var(--accent), var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-0.5px}
    .logo-text p{font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:1px}
    .nav-item{display:flex;align-items:center;gap:14px;padding:13px 18px;border-radius:14px;color:var(--muted);cursor:pointer;transition:all 0.3s;margin-bottom:6px;font-size:14px;font-weight:600;position:relative}
    .nav-item::before{content:'';position:absolute;left:0;top:0;width:3px;height:100%;background:var(--accent);transform:scaleY(0);transition:transform 0.3s}
    .nav-item:hover, .nav-item.active{background:rgba(99,102,241,0.12);color:var(--accent);transform:translateX(6px)}
    .nav-item.active::before{transform:scaleY(1)}
    .nav-badge{margin-left:auto;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:800;background:rgba(239,68,68,0.15);color:var(--danger)}
    .ml-status{background:linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1));border:1px solid rgba(99,102,241,0.2);border-radius:14px;padding:16px;margin:20px 0}
    .ml-status-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .ml-status-header h4{font-size:13px;font-weight:700;display:flex;align-items:center;gap:8px}
    .status-dot{width:8px;height:8px;border-radius:50%;background:var(--success);box-shadow:0 0 12px var(--success);animation:pulse 2s infinite}
    .ml-metric{display:flex;justify-content:space-between;font-size:12px;margin:8px 0}
    .ml-metric .label{color:var(--muted)}
    .ml-metric .value{font-weight:700;color:var(--success)}
    .user-profile{margin-top:auto;padding-top:24px;border-top:1px solid var(--border);display:flex;align-items:center;gap:14px;padding:20px 16px;border-radius:14px;background:rgba(30,35,48,0.4);cursor:pointer;transition:all 0.3s}
    .user-profile:hover{background:rgba(30,35,48,0.6);transform:translateY(-2px)}
    .avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg, var(--accent), var(--purple));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;box-shadow:0 4px 16px var(--glow)}
    .user-info{flex:1}
    .user-info .name{font-size:14px;font-weight:700;margin-bottom:2px}
    .user-info .status{font-size:11px;color:var(--success);display:flex;align-items:center;gap:6px}
    .main{flex:1;margin-left:300px;padding:32px 40px;max-width:100%}
    .panel{background:var(--card);backdrop-filter:blur(30px);border:1px solid var(--border);border-radius:20px;padding:32px}
    .badge{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:10px;font-size:12px;font-weight:800;backdrop-filter:blur(10px)}
    .badge-long{background:rgba(16,185,129,0.15);color:var(--success);border:1px solid rgba(16,185,129,0.35)}
    .badge-short{background:rgba(239,68,68,0.15);color:var(--danger);border:1px solid rgba(239,68,68,0.35)}
    .badge-tp{background:rgba(16,185,129,0.15);color:var(--success);border:1px solid rgba(16,185,129,0.35)}
    .badge-pending{background:rgba(100,116,139,0.15);color:var(--muted);border:1px solid rgba(100,116,139,0.35)}
    .badge-sl{background:rgba(239,68,68,0.15);color:var(--danger);border:1px solid rgba(239,68,68,0.35)}
    .badge-tf{background:rgba(6,182,212,0.15);color:var(--info);border:1px solid rgba(6,182,212,0.35)}
    table{width:100%;border-collapse:collapse}
    thead th{padding:18px 28px;text-align:left;font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;background:rgba(15,23,38,0.3);border-bottom:1px solid var(--border)}
    tbody tr{border-bottom:1px solid rgba(99,102,241,0.05);transition:all 0.3s;cursor:pointer}
    tbody tr:hover{background:rgba(99,102,241,0.08)}
    tbody td{padding:22px 28px;font-size:14px}
    .trade-row{position:relative}
    .trade-row::before{content:'';position:absolute;left:0;top:0;width:4px;height:100%}
    .trade-row.win::before{background:var(--success);box-shadow:0 0 16px var(--success)}
    .trade-row.loss::before{background:var(--danger);box-shadow:0 0 16px var(--danger)}
    .trade-row.active::before{background:var(--info);box-shadow:0 0 16px var(--info)}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
    @media(max-width:1200px){.main{margin-left:0;padding:24px}.sidebar{transform:translateX(-100%)}}
    """

# Import des routes (positions, history, trades - suite dans le prochain message à cause de la limite de caractères)
@app.get("/positions", response_class=HTMLResponse)
async def positions_page():
    try:
        ensure_trades_schema()
    except Exception:
        pass
    
    rows = build_trade_rows(limit=300)
    kpi = compute_kpis(rows)
    active_rows = [r for r in rows if r['row_state'] == 'normal']
    
    html = f'''<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Positions Actives - AI Trader</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>{get_base_css()}</style>
</head>
<body>
  <div class="app">
    {generate_sidebar_html('positions', kpi)}
    <main class="main">
      <h1 style="font-size:36px;font-weight:900;margin-bottom:32px">📈 Positions Actives</h1>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:32px">
        <div class="panel">
          <div style="font-size:13px;color:var(--muted);margin-bottom:8px">TOTAL ACTIF</div>
          <div style="font-size:36px;font-weight:900">{len(active_rows)}</div>
        </div>
        <div class="panel">
          <div style="font-size:13px;color:var(--muted);margin-bottom:8px">LONG</div>
          <div style="font-size:36px;font-weight:900;color:var(--success)">{sum(1 for r in active_rows if r.get('side','').upper()=='LONG')}</div>
        </div>
        <div class="panel">
          <div style="font-size:13px;color:var(--muted);margin-bottom:8px">SHORT</div>
          <div style="font-size:36px;font-weight:900;color:var(--danger)">{sum(1 for r in active_rows if r.get('side','').upper()=='SHORT')}</div>
        </div>
      </div>
      <div class="panel">
        <table>
          <thead>
            <tr>
              <th>Symbole</th><th>TF</th><th>Side</th><th>Entry</th>
              <th>TP1</th><th>TP2</th><th>TP3</th><th>SL</th><th>Temps</th>
            </tr>
          </thead>
          <tbody>
    '''
    
    for r in active_rows:
        symbol = r.get('symbol', '')
        tf_label = r.get('tf_label', '')
        side = (r.get('side') or '').upper()
        side_badge = '<span class="badge badge-long">📈 LONG</span>' if side == 'LONG' else '<span class="badge badge-short">📉 SHORT</span>'
        entry = r.get('entry')
        elapsed = human_duration_verbose(now_ms() - r.get('t_entry', now_ms()))
        
        def tp_badge(val):
            return f'<span class="badge badge-pending">🎯 {val}</span>' if val else '<span class="badge badge-pending">—</span>'
        
        sl_badge = f'<span class="badge badge-pending">❌ {r.get("sl")}</span>' if r.get('sl') else '<span class="badge badge-pending">—</span>'
        
        html += f'''
            <tr class="trade-row active">
              <td><strong>{symbol}</strong></td>
              <td><span class="badge badge-tf">{tf_label}</span></td>
              <td>{side_badge}</td>
              <td style="font-family:monospace;font-weight:700">{entry if entry else '—'}</td>
              <td>{tp_badge(r.get('tp1'))}</td>
              <td>{tp_badge(r.get('tp2'))}</td>
              <td>{tp_badge(r.get('tp3'))}</td>
              <td>{sl_badge}</td>
              <td style="color:var(--muted)">{elapsed}</td>
            </tr>
        '''
    
    if not active_rows:
        html += '<tr><td colspan="9" style="text-align:center;padding:60px;color:var(--muted)">Aucune position active</td></tr>'
    
    html += '''
          </tbody>
        </table>
      </div>
    </main>
  </div>
</body>
</html>'''
    
    return HTMLResponse(content=html)

@app.get("/history", response_class=HTMLResponse)
async def history_page():
    try:
        ensure_trades_schema()
    except Exception:
        pass
    
    rows = build_trade_rows(limit=300)
    kpi = compute_kpis(rows)
    closed_rows = [r for r in rows if r['row_state'] in ('tp', 'sl')]
    wins = sum(1 for r in closed_rows if r['row_state'] == 'tp')
    losses = sum(1 for r in closed_rows if r['row_state'] == 'sl')
    
    html = f'''<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Historique - AI Trader</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>{get_base_css()}</style>
</head>
<body>
  <div class="app">
    {generate_sidebar_html('history', kpi)}
    <main class="main">
      <h1 style="font-size:36px;font-weight:900;margin-bottom:32px">📜 Historique Complet</h1>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:32px">
        <div class="panel">
          <div style="font-size:13px;color:var(--muted);margin-bottom:8px">TOTAL</div>
          <div style="font-size:36px;font-weight:900">{len(closed_rows)}</div>
        </div>
        <div class="panel">
          <div style="font-size:13px;color:var(--muted);margin-bottom:8px">GAGNANTS</div>
          <div style="font-size:36px;font-weight:900;color:var(--success)">{wins}</div>
        </div>
        <div class="panel">
          <div style="font-size:13px;color:var(--muted);margin-bottom:8px">PERDANTS</div>
          <div style="font-size:36px;font-weight:900;color:var(--danger)">{losses}</div>
        </div>
        <div class="panel">
          <div style="font-size:13px;color:var(--muted);margin-bottom:8px">WIN RATE</div>
          <div style="font-size:36px;font-weight:900;color:var(--success)">{kpi['winrate']}%</div>
        </div>
      </div>
      <div class="panel">
        <table>
          <thead>
            <tr>
              <th>Symbole</th><th>TF</th><th>Side</th><th>Entry</th>
              <th>Exit</th><th>Résultat</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
    '''
    
    for r in closed_rows:
        symbol = r.get('symbol', '')
        tf_label = r.get('tf_label', '')
        side = (r.get('side') or '').upper()
        side_badge = '<span class="badge badge-long">LONG</span>' if side == 'LONG' else '<span class="badge badge-short">SHORT</span>'
        entry = r.get('entry')
        row_class = 'win' if r['row_state'] == 'tp' else 'loss'
        result_badge = '<span class="badge badge-tp">✅ WIN</span>' if r['row_state'] == 'tp' else '<span class="badge badge-sl">❌ LOSS</span>'
        exit_price = r.get('tp1') if r.get('tp1_hit') else (r.get('sl') if r.get('sl_hit') else '—')
        date_str = datetime.fromtimestamp(r.get('t_entry', 0) / 1000).strftime('%d/%m %H:%M')
        
        html += f'''
            <tr class="trade-row {row_class}">
              <td><strong>{symbol}</strong></td>
              <td><span class="badge badge-tf">{tf_label}</span></td>
              <td>{side_badge}</td>
              <td style="font-family:monospace">{entry if entry else '—'}</td>
              <td style="font-family:monospace">{exit_price}</td>
              <td>{result_badge}</td>
              <td style="color:var(--muted)">{date_str}</td>
            </tr>
        '''
    
    if not closed_rows:
        html += '<tr><td colspan="7" style="text-align:center;padding:60px;color:var(--muted)">Aucun historique</td></tr>'
    
    html += '''
          </tbody>
        </table>
      </div>
    </main>
  </div>
</body>
</html>'''
    
    return HTMLResponse(content=html)

@app.get("/trades", response_class=HTMLResponse)
async def trades_page():
    try:
        ensure_trades_schema()
    except Exception:
        pass

    alt = compute_altseason_snapshot()
    rows = build_trade_rows(limit=300)
    kpi = compute_kpis(rows)

    active_longs = sum(1 for r in rows if r['row_state'] == 'normal' and r.get('side','').upper() == 'LONG')
    active_shorts = sum(1 for r in rows if r['row_state'] == 'normal' and r.get('side','').upper() == 'SHORT')
    sentiment = "BULLISH" if active_longs > active_shorts else "BEARISH" if active_shorts > active_longs else "NEUTRE"
    
    # Liste des symboles avec TP
    symbols_text = ", ".join(alt["symbols_with_tp"][:10])
    if len(alt["symbols_with_tp"]) > 10:
        symbols_text += f" +{len(alt['symbols_with_tp'])-10} autres"
    
    if alt['score'] >= 75:
        insight_text = f"Forte altseason détectée. Symboles: {symbols_text}"
    elif alt['score'] >= 50:
        insight_text = f"Altseason modérée. Gestion risque stricte. Symboles: {symbols_text}"
    elif kpi['winrate'] > 70:
        insight_text = f"Excellente performance {kpi['winrate']}% winrate sur {kpi['total_closed']} trades."
    else:
        insight_text = "Marché en consolidation. Patience recommandée."

    # Détails des TP atteints
    tp_list = ""
    for tp in kpi.get('tp_details', [])[:10]:
        tp_type = tp['type'].replace('_HIT', '')
        tp_list += f"{tp['symbol']} ({tp_type}), "
    if tp_list:
        tp_list = tp_list.rstrip(", ")
    else:
        tp_list = "Aucun TP atteint"

    html = f'''<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Trader Pro Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>{get_base_css()}
    .quick-stats{{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:32px}}
    .stat-card{{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:28px;transition:all 0.3s}}
    .stat-card:hover{{transform:translateY(-8px);box-shadow:0 20px 60px rgba(0,0,0,0.5)}}
    .stat-value{{font-size:42px;font-weight:900;margin:12px 0}}
    .market-intel{{background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08));border:1px solid rgba(99,102,241,0.25);border-radius:24px;padding:36px;margin-bottom:32px}}
    .ai-score{{width:180px;height:180px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--purple));display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:56px;font-weight:900;color:#000;box-shadow:0 20px 60px var(--glow)}}
  </style>
</head>
<body>
  <div class="app">
    {generate_sidebar_html('dashboard', kpi)}
    <main class="main">
      <h1 style="font-size:36px;font-weight:900;margin-bottom:32px">Performance Intelligence</h1>
      
      <div class="quick-stats">
        <div class="stat-card">
          <div style="font-size:13px;color:var(--muted);margin-bottom:8px">TRADES 24H</div>
          <div class="stat-value">{kpi['total_trades']}</div>
          <div style="font-size:13px;color:var(--muted)">{kpi['wins']}W · {kpi['losses']}L</div>
        </div>
        <div class="stat-card">
          <div style="font-size:13px;color:var(--muted);margin-bottom:8px">POSITIONS</div>
          <div class="stat-value">{kpi['active_trades']}</div>
          <div style="font-size:13px;color:var(--muted)">{active_longs}L · {active_shorts}S</div>
        </div>
        <div class="stat-card">
          <div style="font-size:13px;color:var(--muted);margin-bottom:8px">WIN RATE</div>
          <div class="stat-value">{kpi['winrate']}%</div>
          <div style="font-size:13px;color:var(--success)">↗ {kpi['total_closed']} fermés</div>
        </div>
        <div class="stat-card">
          <div style="font-size:13px;color:var(--muted);margin-bottom:8px">TP ATTEINTS</div>
          <div class="stat-value">{kpi['tp_hits']}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:8px" title="{tp_list}">{tp_list[:50]}...</div>
        </div>
      </div>
      
      <div class="market-intel">
        <div style="display:grid;grid-template-columns:auto 1fr;gap:48px;align-items:center">
          <div class="ai-score">
            <div>{alt['score']}</div>
            <div style="font-size:14px;font-weight:800;color:rgba(0,0,0,0.7)">/100</div>
          </div>
          <div>
            <h2 style="font-size:32px;font-weight:900;margin-bottom:10px">{alt['label']}</h2>
            <p style="color:var(--muted);margin-bottom:28px">Sentiment: {sentiment} · {insight_text}</p>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">
              <div class="panel" style="padding:20px">
                <div style="font-size:12px;color:var(--muted);margin-bottom:8px">LONG RATIO</div>
                <div style="font-size:28px;font-weight:900">{alt['signals']['long_ratio']}%</div>
              </div>
              <div class="panel" style="padding:20px">
                <div style="font-size:12px;color:var(--muted);margin-bottom:8px">TP SUCCESS</div>
                <div style="font-size:28px;font-weight:900">{alt['signals']['tp_vs_sl']}%</div>
              </div>
              <div class="panel" style="padding:20px">
                <div style="font-size:12px;color:var(--muted);margin-bottom:8px">BREADTH</div>
                <div style="font-size:28px;font-weight:900">{alt['signals']['breadth_symbols']}</div>
              </div>
              <div class="panel" style="padding:20px">
                <div style="font-size:12px;color:var(--muted);margin-bottom:8px">MOMENTUM</div>
                <div style="font-size:28px;font-weight:900">{alt['signals']['recent_entries_ratio']}%</div>
              </div>
            </div>
            <p style="font-size:11px;color:var(--muted);margin-top:20px;font-style:italic">{alt['disclaimer']}</p>
          </div>
        </div>
      </div>
      
      <div class="panel">
        <h3 style="font-size:20px;font-weight:800;margin-bottom:20px">Trades Récents</h3>
        <table>
          <thead>
            <tr>
              <th>Symbole</th><th>TF</th><th>Side</th><th>Entry</th>
              <th>TP1</th><th>TP2</th><th>TP3</th><th>SL</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
    '''
    
    for r in rows[:20]:
        row_class = {'tp': 'win', 'sl': 'loss', 'cancel': 'active', 'normal': 'active'}.get(r.get('row_state', 'normal'), 'active')
        symbol = r.get('symbol', '')
        tf_label = r.get('tf_label', '')
        side = (r.get('side') or '').upper()
        side_badge = '<span class="badge badge-long">LONG</span>' if side == 'LONG' else '<span class="badge badge-short">SHORT</span>' if side == 'SHORT' else '<span class="badge badge-pending">—</span>'
        entry = r.get('entry')
        
        def tp_badge(val, hit):
            if val is None: return '<span class="badge badge-pending">—</span>'
            return f'<span class="badge badge-tp">✅ {val}</span>' if hit else f'<span class="badge badge-pending">🎯 {val}</span>'
        
        sl_badge = f'<span class="badge badge-sl">⛔ {r.get("sl")}</span>' if r.get('sl') and r.get('sl_hit') else f'<span class="badge badge-pending">❌ {r.get("sl")}</span>' if r.get('sl') else '<span class="badge badge-pending">—</span>'
        status = '<span class="badge badge-tp">TP Hit</span>' if row_class == 'win' else '<span class="badge badge-sl">SL Hit</span>' if row_class == 'loss' else '<span class="badge badge-pending">Active</span>'
        
        html += f'''
            <tr class="trade-row {row_class}">
              <td><strong>{symbol}</strong></td>
              <td><span class="badge badge-tf">{tf_label}</span></td>
              <td>{side_badge}</td>
              <td style="font-family:monospace;font-weight:700">{entry if entry else '—'}</td>
              <td>{tp_badge(r.get('tp1'), r.get('tp1_hit', False))}</td>
              <td>{tp_badge(r.get('tp2'), r.get('tp2_hit', False))}</td>
              <td>{tp_badge(r.get('tp3'), r.get('tp3_hit', False))}</td>
              <td>{sl_badge}</td>
              <td>{status}</td>
            </tr>
        '''
    
    if not rows:
        html += '<tr><td colspan="9" style="text-align:center;padding:60px;color:var(--muted)">Aucun trade</td></tr>'
    
    html += '''
          </tbody>
        </table>
      </div>
    </main>
  </div>
</body>
</html>'''
    
    return HTMLResponse(content=html)

# =========================
# Lancement
# =========================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=False)
