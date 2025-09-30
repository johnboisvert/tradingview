# main.py
import os
import sqlite3
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse

import httpx

# =========================
# Logging
# =========================
logger = logging.getLogger("aitrader")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

# =========================
# Config / Env
# =========================
DB_DIR = os.getenv("DB_DIR", "/tmp/ai_trader")
DB_PATH = os.path.join(DB_DIR, "data.db")
os.makedirs(DB_DIR, exist_ok=True)
logger.info(f"DB dir OK: {DB_DIR} (using {DB_PATH})")

# Secrets
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "nqgjiebqgiehgq8e76qhefjqer78gfq0eyrg")

# Telegram
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
TELEGRAM_ENABLED = bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)
TELEGRAM_COOLDOWN_SEC = int(os.getenv("TELEGRAM_COOLDOWN_SEC", "15"))

# Vector icons
VECTOR_UP_ICON = "🟩"
VECTOR_DN_ICON = "🟥"

# =========================
# SQLite
# =========================
def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

DB = sqlite3.connect(DB_PATH, check_same_thread=False)
DB.row_factory = dict_factory
logger.info(f"DB initialized at {DB_PATH}")

def db_execute(sql: str, params: tuple = ()):
    cur = DB.cursor()
    cur.execute(sql, params)
    DB.commit()
    return cur

def db_query(sql: str, params: tuple = ()) -> List[dict]:
    cur = DB.cursor()
    cur = cur.execute(sql, params)
    return list(cur.fetchall())

# Schéma (souple)
db_execute("""
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    symbol TEXT,
    tf TEXT,
    tf_label TEXT,
    time INTEGER,
    side TEXT,
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
    confidence INTEGER,
    horizon TEXT,
    leverage TEXT,
    note TEXT,
    price REAL,
    direction TEXT,
    trade_id TEXT
)
""")
db_execute("CREATE INDEX IF NOT EXISTS idx_events_trade_id ON events(trade_id)")
db_execute("CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)")
db_execute("CREATE INDEX IF NOT EXISTS idx_events_time ON events(time)")
db_execute("CREATE INDEX IF NOT EXISTS idx_events_symbol_tf ON events(symbol, tf)")

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
    cols = {r["name"] for r in db_query("PRAGMA table_info(events)")}
    if "tf_label" not in cols:
        db_execute("ALTER TABLE events ADD COLUMN tf_label TEXT")
    db_execute("CREATE INDEX IF NOT EXISTS idx_events_trade_id ON events(trade_id)")
    db_execute("CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)")
    db_execute("CREATE INDEX IF NOT EXISTS idx_events_time ON events(time)")
    db_execute("CREATE INDEX IF NOT EXISTS idx_events_symbol_tf ON events(symbol, tf)")

def now_ms() -> int:
    return int(datetime.now(timezone.utc).timestamp() * 1000)

def ms_ago(minutes: int) -> int:
    return int((datetime.now(timezone.utc) - timedelta(minutes=minutes)).timestamp() * 1000)

try:
    ensure_trades_schema()
except Exception as e:
    logger.warning(f"ensure_trades_schema warning: {e}")
# =========================
# Telegram
# =========================
_last_tg_sent: Dict[str, float] = {}

async def tg_send_text(text: str, disable_web_page_preview: bool = True, key: Optional[str] = None):
    if not TELEGRAM_ENABLED:
        return {"ok": False, "reason": "telegram disabled"}

    k = key or "default"
    now = datetime.now().timestamp()
    last = _last_tg_sent.get(k, 0)
    if now - last < TELEGRAM_COOLDOWN_SEC:
        logger.warning("Telegram send skipped due to cooldown")
        return {"ok": False, "reason": "cooldown"}
    _last_tg_sent[k] = now

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "disable_web_page_preview": disable_web_page_preview,
        "parse_mode": "HTML",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
            logger.info(f"Telegram sent: {text[:80]}...")
            return {"ok": True}
    except Exception as e:
        logger.warning(f"Telegram send error: {e}")
        return {"ok": False, "reason": str(e)}

def _fmt_tf_label(tf: Any, tf_label: Optional[str]) -> str:
    return (tf_label or tf_to_label(tf) or "").strip()

def _fmt_side(side: Optional[str]) -> Dict[str, str]:
    s = (side or "").upper()
    if s == "LONG":
        return {"emoji": "📈", "label": "Long"}
    if s == "SHORT":
        return {"emoji": "📉", "label": "Short"}
    return {"emoji": "📌", "label": (side or "Side")}

def format_vector_message(symbol: str, tf_label: str, direction: str, price: Any, note: Optional[str] = None) -> str:
    icon = VECTOR_UP_ICON if (direction or "").upper() == "UP" else VECTOR_DN_ICON
    n = f" — {note}" if note else ""
    return f"{icon} Vector Candle {direction.upper()} | <b>{symbol}</b> <i>{tf_label}</i> @ <code>{price}</code>{n}"

def format_entry_announcement(payload: dict) -> str:
    symbol   = payload.get("symbol", "")
    tf_lbl   = _fmt_tf_label(payload.get("tf"), payload.get("tf_label"))
    side_i   = _fmt_side(payload.get("side"))
    entry    = payload.get("entry")
    tp1      = payload.get("tp1")
    tp2      = payload.get("tp2")
    tp3      = payload.get("tp3")
    sl       = payload.get("sl")
    leverage = payload.get("leverage") or payload.get("lev_reco") or ""
    conf     = payload.get("confidence")
    note     = (payload.get("note") or "").strip()

    lines = []
    if tp1 is not None: lines.append(f"🎯 TP1: {tp1}")
    if tp2 is not None: lines.append(f"🎯 TP2: {tp2}")
    if tp3 is not None: lines.append(f"🎯 TP3: {tp3}")
    if sl  is not None: lines.append(f"❌ SL: {sl}")

    conf_line = ""
    if conf is not None:
        expl = note if note else f"Le setup {side_i['label'].upper()} a un risque acceptable si le contexte le confirme."
        conf_line = f"🧠 Confiance LLM: {conf}% — {expl}"

    tip_line = "🤖 Astuce: après TP1, placez SL au BE." if tp1 is not None else ""

    msg = [
        f"📩 {symbol} {tf_lbl}",
        f"{side_i['emoji']} {side_i['label']} Entry: {entry}" if entry is not None else f"{side_i['emoji']} {side_i['label']}",
        f"💡Leverage: {leverage}" if leverage else "",
        *lines,
        conf_line,
        tip_line,
    ]
    return "\n".join([m for m in msg if m])

def format_event_announcement(etype: str, payload: dict) -> str:
    symbol = payload.get("symbol", "")
    tf_lbl = _fmt_tf_label(payload.get("tf"), payload.get("tf_label"))
    side_i = _fmt_side(payload.get("side"))
    price  = payload.get("price")
    base   = f"{symbol} {tf_lbl}"

    if etype in ("TP1_HIT", "TP2_HIT", "TP3_HIT"):
        tick = {"TP1_HIT": "TP1", "TP2_HIT": "TP2", "TP3_HIT": "TP3"}[etype]
        return f"✅ {tick} atteint — {base}\n{side_i['emoji']} {side_i['label']}" + (f" @ {price}" if price else "")
    if etype == "SL_HIT":
        return f"🛑 SL touché — {base}\n{side_i['emoji']} {side_i['label']}" + (f" @ {price}" if price else "")
    if etype == "CLOSE":
        note = payload.get("note") or ""
        return f"📪 Trade clôturé — {base}\n{side_i['emoji']} {side_i['label']}" + (f"\n📝 {note}" if note else "")
    return f"ℹ️ {etype} — {base}"

# =========================
# FastAPI
# =========================
app = FastAPI(title="AI Trader", version="1.0")

@app.get("/", response_class=HTMLResponse)
async def root():
    return HTMLResponse("""
    <html><head><meta charset="utf-8"><title>AI Trader</title></head>
    <body style="font-family:system-ui; padding:24px; background:#0b0f14; color:#e6edf3;">
      <h1>AI Trader</h1>
      <p>Endpoints:</p>
      <ul>
        <li><a href="/trades">/trades</a> — Dashboard</li>
        <li><code>POST /tv-webhook</code> — Webhook TradingView</li>
      </ul>
    </body></html>
    """)
# =========================
# Save Event
# =========================
def save_event(payload: dict):
    etype   = payload.get("type")
    symbol  = payload.get("symbol")
    tf      = payload.get("tf")
    tflabel = payload.get("tf_label") or tf_to_label(tf)
    t       = payload.get("time") or now_ms()
    side    = payload.get("side")
    entry   = payload.get("entry")
    sl      = payload.get("sl")
    tp1     = payload.get("tp1")
    tp2     = payload.get("tp2")
    tp3     = payload.get("tp3")
    r1      = payload.get("r1")
    s1      = payload.get("s1")
    lev_reco= payload.get("lev_reco")
    qty_reco= payload.get("qty_reco")
    notional= payload.get("notional")
    confidence = payload.get("confidence")
    horizon = payload.get("horizon")
    leverage= payload.get("leverage")
    note    = payload.get("note")
    price   = payload.get("price")
    direction = payload.get("direction")
    trade_id  = payload.get("trade_id")

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

# =========================
# Webhook
# =========================
@app.post("/tv-webhook")
async def tv_webhook(req: Request):
    try:
        payload = await req.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON")

    secret = payload.get("secret")
    if WEBHOOK_SECRET and secret != WEBHOOK_SECRET:
        raise HTTPException(403, "Forbidden")

    etype = payload.get("type")
    symbol = payload.get("symbol")
    tf = payload.get("tf")

    if not etype or not symbol:
        raise HTTPException(422, "Missing type or symbol")

    trade_id = save_event(payload)

    try:
        if TELEGRAM_ENABLED:
            key = f"{etype}:{symbol}"
            if etype == "VECTOR_CANDLE":
                txt = format_vector_message(
                    symbol=symbol,
                    tf_label=payload.get("tf_label") or tf_to_label(tf),
                    direction=(payload.get("direction") or ""),
                    price=payload.get("price"),
                    note=payload.get("note"),
                )
                await tg_send_text(txt, key=key)
            elif etype == "ENTRY":
                txt = format_entry_announcement(payload)
                await tg_send_text(txt, key=payload.get("trade_id") or key)
            elif etype in {"TP1_HIT", "TP2_HIT", "TP3_HIT", "SL_HIT", "CLOSE"}:
                txt = format_event_announcement(etype, payload)
                await tg_send_text(txt, key=payload.get("trade_id") or key)
    except Exception as e:
        logger.warning(f"Telegram send skipped due to cooldown or error: {e}")

    return JSONResponse({"ok": True, "trade_id": trade_id})

# =========================
# Altseason (4 signaux, Vectors exclus)
# =========================
def _pct(x, y):
    try:
        x = float(x or 0); y = float(y or 0)
        return 0.0 if y == 0 else 100.0 * x / y
    except Exception:
        return 0.0

def compute_altseason_snapshot() -> dict:
    t24 = ms_ago(24*60)

    # A) ratio LONG
    row = db_query("""
        SELECT
          SUM(CASE WHEN side='LONG' THEN 1 ELSE 0 END) AS long_n,
          SUM(CASE WHEN side='SHORT' THEN 1 ELSE 0 END) AS short_n
        FROM events
        WHERE type='ENTRY' AND time>=?
    """, (t24,))
    long_n = (row[0]["long_n"] if row else 0) or 0
    short_n = (row[0]["short_n"] if row else 0) or 0
    A = _pct(long_n, long_n + short_n)

    # B) TP vs SL (favorise LONG si side présent)
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

    # C) Breadth (nb de symboles distincts avec TP hit)
    row = db_query("""
      SELECT COUNT(DISTINCT symbol) AS sym_gain FROM events
      WHERE type IN ('TP1_HIT','TP2_HIT','TP3_HIT') AND time>=?
    """, (t24,))
    sym_gain = (row[0]["sym_gain"] if row else 0) or 0
    C = float(min(100.0, sym_gain * 2.0))  # 50 sym -> 100

    # D) Momentum: % d'ENTRY dans les 90 dernières minutes / total 24h
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
        "signals": {
            "long_ratio": round(A, 1),
            "tp_vs_sl": round(B, 1),
            "breadth_symbols": int(sym_gain),
            "recent_entries_ratio": round(D, 1),
        }
    }
# =========================
# Helpers /trades : statut, outcome, annulation
# =========================
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
    """Retourne 'TP', 'SL' ou None selon le 1er event post-entry."""
    rows = db_query("""
      SELECT type, time FROM events
      WHERE trade_id=? AND type IN ('TP1_HIT','TP2_HIT','TP3_HIT','SL_HIT')
      ORDER BY time ASC LIMIT 1
    """, (trade_id,))
    if not rows: return None
    t = rows[0]["type"]
    return "TP" if t.startswith("TP") else ("SL" if t == "SL_HIT" else None)

def _cancelled_by_opposite(entry_row: dict) -> bool:
    """Annulé (orange) si une ENTRY opposée plus récente sur même symbole+tf, avant TP/SL."""
    symbol = entry_row.get("symbol"); tf = entry_row.get("tf")
    side = (entry_row.get("side") or "").upper(); t = int(entry_row.get("time") or 0)
    if not symbol or tf is None or side not in ("LONG", "SHORT"): return False
    opposite = "SHORT" if side == "LONG" else "LONG"
    r = db_query("""
      SELECT 1 FROM events
      WHERE type='ENTRY' AND symbol=? AND tf=? AND time>? AND UPPER(COALESCE(side,''))=?
      LIMIT 1
    """, (symbol, str(tf), t, opposite))
    return bool(r)

# =========================
# Build rows + KPIs
# =========================
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
        # priorité couleur : SL (rouge) > TP (vert) > cancel/close (orange) > normal
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
    t24 = ms_ago(24*60)

    # Totaux sur 24h
    total_trades = db_query("SELECT COUNT(DISTINCT trade_id) AS n FROM events WHERE type='ENTRY' AND time>=?", (t24,))[0]["n"] or 0
    tp_hits = db_query("SELECT COUNT(*) AS n FROM events WHERE type IN ('TP1_HIT','TP2_HIT','TP3_HIT') AND time>=?", (t24,))[0]["n"] or 0

    # Winrate: 1er outcome TP vs SL (sur 24h)
    trade_ids = [r["trade_id"] for r in db_query("SELECT DISTINCT trade_id FROM events WHERE type='ENTRY' AND time>=?", (t24,))]
    wins = 0; losses = 0
    for tid in trade_ids:
        o = _first_outcome(tid)
        if o == "TP": wins += 1
        elif o == "SL": losses += 1
    winrate = (wins / max(1, (wins + losses))) * 100.0

    # Actifs: lignes “normal”
    active = sum(1 for r in rows if r["row_state"] == "normal")

    return {
        "total_trades": int(total_trades),
        "active_trades": int(active),
        "tp_hits": int(tp_hits),
        "winrate": round(winrate, 1),
    }

# =========================
# /trades — UI style maquette
# =========================
@app.get("/trades", response_class=HTMLResponse)
async def trades_page():
    try:
        ensure_trades_schema()
    except Exception:
        pass

    alt = compute_altseason_snapshot()
    rows = build_trade_rows(limit=300)
    kpi = compute_kpis(rows)

    css = """
    <style>
      :root{
        --bg:#0b0f14; --panel:#0f1622; --card:#121b2a; --border:#1f2a3a; --txt:#e6edf3; --muted:#a7b3c6;
        --green:#22c55e; --green-ink:#0f5132;
        --red:#ef4444; --red-ink:#5f1b1b;
        --amber:#f59e0b; --amber-ink:#633d0a;
        --chip:#0f172a; --chip-b:#253143;
      }
      *{box-sizing:border-box}
      body{margin:0;background:var(--bg);color:var(--txt);font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif}
      .wrap{max-width:1200px;margin:24px auto;padding:0 16px}

      .grid{display:grid;gap:16px}
      .g-2{grid-template-columns:1fr 1fr}
      .g-4{grid-template-columns:repeat(4,1fr)}
      @media(max-width:1000px){.g-4{grid-template-columns:repeat(2,1fr)}}

      .panel{background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:16px 18px}
      .muted{color:var(--muted)}
      .kpi{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:14px 16px}
      .kpi .t{font-size:12px;color:var(--muted);display:flex;align-items:center;gap:8px}
      .kpi .v{margin-top:6px;font-size:22px;font-weight:700}

      .score{display:flex;align-items:center;justify-content:center;width:120px;height:120px;border-radius:999px;background:#f6c453;color:#000;font-size:28px;font-weight:800;margin:0 auto;border:6px solid #7a4c00}
      .score small{display:block;font-size:11px;font-weight:600}

      /* KPIs bar */
      .metabox .title{font-size:18px;margin:0 0 6px 0}
      .mini .kpi .v{font-size:20px}
      .icon{font-size:16px}

      /* Table */
      table{width:100%;border-collapse:separate;border-spacing:0;background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden}
      thead th{font-size:12px;color:var(--muted);text-align:left;padding:10px;border-bottom:1px solid var(--border)}
      tbody td{padding:10px;border-bottom:1px solid #162032;font-size:14px;vertical-align:middle}
      tbody tr:hover{background:#0e1520}
      .accent{width:4px}
      .row-tp .accent{background:var(--green)}
      .row-sl .accent{background:var(--red)}
      .row-cancel .accent{background:var(--amber)}
      .row-normal .accent{background:transparent}

      .pill{padding:4px 10px;border-radius:999px;border:1px solid var(--chip-b);background:var(--chip);color:#cbd5e1;font-size:12px;display:inline-flex;gap:6px;align-items:center}
      .pill.ok{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.45);color:#86efac}
      .pill.sl{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.5);color:#fca5a5}
      .pill.side-long{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.45);color:#86efac}
      .pill.side-short{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.5);color:#fca5a5}
      .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}

      .actions a{opacity:.9;text-decoration:none;margin-right:8px}
    </style>
    """

    # Header Altseason + 4 cartes
    alt_html = f"""
      <div class="panel">
        <div class="grid g-2" style="align-items:center">
          <div>
            <h2 style="margin:0 0 4px 0">Indicateurs Altseason</h2>
            <div class="muted">Fenêtre: {alt['window_minutes']} min — 4 signaux clés</div>
          </div>
          <div class="score">{alt['score']}<small>/ 100</small></div>
        </div>
        <div class="grid g-4" style="margin-top:14px">
          <div class="kpi"><div class="t"><span class="icon">📈</span> LONG Ratio</div><div class="v">{alt['signals']['long_ratio']}%</div></div>
          <div class="kpi"><div class="t"><span class="icon">🎯</span> TP vs SL</div><div class="v">{alt['signals']['tp_vs_sl']}%</div></div>
          <div class="kpi"><div class="t"><span class="icon">🪄</span> Breadth</div><div class="v">{alt['signals']['breadth_symbols']} sym</div></div>
          <div class="kpi"><div class="t"><span class="icon">⚡</span> Momentum</div><div class="v">{alt['signals']['recent_entries_ratio']}%</div></div>
        </div>
      </div>
    """

    # Mini KPI bar
    mini_html = f"""
      <div class="grid g-4 mini" style="margin-top:16px">
        <div class="kpi">
          <div class="t"><span class="icon">📊</span> Total Trades</div>
          <div class="v">{kpi['total_trades']}</div>
        </div>
        <div class="kpi">
          <div class="t"><span class="icon">⚡</span> Trades Actifs</div>
          <div class="v">{kpi['active_trades']}</div>
        </div>
        <div class="kpi">
          <div class="t"><span class="icon">✅</span> TP Atteints</div>
          <div class="v">{kpi['tp_hits']}</div>
        </div>
        <div class="kpi">
          <div class="t"><span class="icon">🎯</span> Win Rate</div>
          <div class="v">{kpi['winrate']}%</div>
        </div>
      </div>
    """

    def tp_cell(val, hit):
        if val is None:
            return '<span class="pill muted">—</span>'
        klass = "pill ok" if hit else "pill"
        icon = "✅" if hit else "🎯"
        return f'<span class="{klass}">{icon}&nbsp;{val}</span>'

    def sl_cell(val, sl_hit):
        if val is None:
            return '<span class="pill muted">—</span>'
        klass = "pill sl" if sl_hit else "pill"
        icon = "⛔" if sl_hit else "❌"
        return f'<span class="{klass}">{icon}&nbsp;{val}</span>'

    def side_cell(side):
        s = (side or "").upper()
        if s == "LONG":
            return '<span class="pill side-long">✅ LONG</span>'
        if s == "SHORT":
            return '<span class="pill side-short">🚫 SHORT</span>'
        return '<span class="pill">—</span>'

    def row_class(state: str) -> str:
        return {
            "tp": "row-tp",
            "sl": "row-sl",
            "cancel": "row-cancel",
            "normal": "row-normal",
        }.get(state or "normal", "row-normal")

    # Tableau
    body_rows = []
    for r in rows:
        body_rows.append(f"""
          <tr class="{row_class(r.get('row_state'))}">
            <td class="accent"></td>
            <td>{r['symbol']}</td>
            <td><span class="pill">{r['tf_label']}</span></td>
            <td>{side_cell(r.get('side'))}</td>
            <td class="mono">{'' if r.get('entry') is None else r.get('entry')}</td>
            <td>{tp_cell(r.get('tp1'), r.get('tp1_hit'))}</td>
            <td>{tp_cell(r.get('tp2'), r.get('tp2_hit'))}</td>
            <td>{tp_cell(r.get('tp3'), r.get('tp3_hit'))}</td>
            <td>{sl_cell(r.get('sl'), r.get('sl_hit'))}</td>
            <td class="actions"><a href="#" title="Edit">🖊️</a><a href="#" title="Delete">🗑️</a></td>
          </tr>
        """)

    html = f"""<!doctype html>
    <html lang="fr"><head><meta charset="utf-8"><title>Trades</title>{css}</head>
    <body>
      <div class="wrap">
        {alt_html}
        {mini_html}
        <div class="panel" style="margin-top:16px">
          <h3 style="margin:0 0 10px 0">Historique des Trades</h3>
          <table>
            <thead>
              <tr>
                <th class="accent"></th>
                <th>Symbole</th>
                <th>TF</th>
                <th>Side</th>
                <th>Entry</th>
                <th>TP1</th>
                <th>TP2</th>
                <th>TP3</th>
                <th>SL</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {''.join(body_rows) if body_rows else '<tr><td class="accent"></td><td colspan="9" class="muted">No trades yet. Send a webhook to /tv-webhook.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </body></html>"""
    return HTMLResponse(content=html)
# =========================
# Lancement local (optionnel)
# =========================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=False)
