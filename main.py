# main.py
import os
import re
import json
import time
import sqlite3
import logging
import threading
from typing import Optional, Dict, Any, List, Tuple
from string import Template
from collections import defaultdict

from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, Response

# -------------------------
# Logging
# -------------------------
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
log = logging.getLogger("aitrader")

# -------------------------
# Config / ENV
# -------------------------
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
LLM_ENABLED = os.getenv("LLM_ENABLED", "0") in ("1", "true", "True")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
FORCE_LLM = os.getenv("FORCE_LLM", "0") in ("1", "true", "True")
CONFIDENCE_MIN = float(os.getenv("CONFIDENCE_MIN", "0.0") or 0.0)

PORT = int(os.getenv("PORT", "8000"))

RISK_ACCOUNT_BAL = float(os.getenv("RISK_ACCOUNT_BAL", "0") or 0)
RISK_PCT = float(os.getenv("RISK_PCT", "1.0") or 1.0)

# DB path default = data/data.db; fallback auto to /tmp si read-only
DB_PATH = os.getenv("DB_PATH", "data/data.db")
DEBUG_MODE = os.getenv("DEBUG", "0") in ("1", "true", "True")

# -------------------------
# ALTSEASON thresholds
# -------------------------
ALT_BTC_DOM_THR = float(os.getenv("ALT_BTC_DOM_THR", "55.0"))
ALT_ETH_BTC_THR = float(os.getenv("ALT_ETH_BTC_THR", "0.045"))
ALT_ASI_THR = float(os.getenv("ALT_ASI_THR", "75.0"))
ALT_TOTAL2_THR_T = float(os.getenv("ALT_TOTAL2_THR_T", "1.78"))  # trillions
ALT_CACHE_TTL = int(os.getenv("ALT_CACHE_TTL", "120"))  # seconds
ALT_GREENS_REQUIRED = int(os.getenv("ALT_GREENS_REQUIRED", "3"))

TELEGRAM_PIN_ALTSEASON = os.getenv("TELEGRAM_PIN_ALTSEASON", "1") in ("1", "true", "True")
ALTSEASON_AUTONOTIFY = os.getenv("ALTSEASON_AUTONOTIFY", "1") in ("1", "true", "True")
ALTSEASON_POLL_SECONDS = int(os.getenv("ALTSEASON_POLL_SECONDS", "300"))
ALTSEASON_NOTIFY_MIN_GAP_MIN = int(os.getenv("ALTSEASON_NOTIFY_MIN_GAP_MIN", "60"))
ALTSEASON_STATE_FILE = os.getenv("ALTSEASON_STATE_FILE", "/tmp/altseason_state.json")

# --- Altseason file cache helpers (snapshot disque) ---
def _alt_cache_file_path() -> str:
    return os.getenv("ALT_CACHE_FILE", "/tmp/altseason_last.json")

def _load_last_snapshot() -> Optional[Dict[str, Any]]:
    try:
        p = _alt_cache_file_path()
        if not os.path.exists(p):
            return None
        with open(p, "r", encoding="utf-8") as f:
            snap = json.load(f)
        return snap if isinstance(snap, dict) else None
    except Exception:
        return None

def _save_last_snapshot(snap: Dict[str, Any]) -> None:
    try:
        p = _alt_cache_file_path()
        d = os.path.dirname(p) or "/tmp"
        os.makedirs(d, exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            json.dump(snap, f)
    except Exception:
        pass

TELEGRAM_COOLDOWN_SECONDS = float(os.getenv("TELEGRAM_COOLDOWN_SECONDS", "1.5") or 1.5)
_last_tg = 0.0
# -------------------------
# OpenAI client (optional)
# -------------------------
_openai_client = None
_llm_reason_down = None
if LLM_ENABLED and OPENAI_API_KEY:
    try:
        from openai import OpenAI  # type: ignore
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        _llm_reason_down = f"OpenAI client init failed: {e}"
else:
    _llm_reason_down = "LLM disabled or OPENAI_API_KEY missing"

# -------------------------
# LLM confidence scorer (facultatif)
# -------------------------
def llm_confidence_for_entry(payload: Dict[str, Any]) -> Optional[Tuple[float, str]]:
    """Retourne (confidence_pct, rationale) ou None si LLM inactif/indispo."""
    if not (LLM_ENABLED and _openai_client):
        return None
    try:
        sym = str(payload.get("symbol") or "?")
        side = str(payload.get("side") or "?").upper()
        tf   = tf_label_of(payload)
        entry = _to_float(payload.get("entry"))
        sl    = _to_float(payload.get("sl"))
        tp1   = _to_float(payload.get("tp1"))
        tp2   = _to_float(payload.get("tp2"))
        tp3   = _to_float(payload.get("tp3"))

        sys_prompt = (
            "Tu es un assistant de trading. Donne une estimation de confiance entre 0 et 100 pour la probabilité "
            "que le trade atteigne au moins TP1 avant SL, basée uniquement sur les niveaux fournis (aucune donnée externe). "
            "Réponds STRICTEMENT en JSON: {\"confidence_pct\": <0-100>, \"rationale\": \"<raison courte>\"}."
        )
        user_prompt = (
            f"Trade: {sym} | TF={tf} | Side={side}\n"
            f"Entry={entry} | SL={sl} | TP1={tp1} | TP2={tp2} | TP3={tp3}\n"
            "Contraintes: pas d'accès marché. Utilise des heuristiques simples (distance SL/TP1, R:R, etc.)."
        )

        resp = _openai_client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=120,
            temperature=0.2,
        )
        content = (resp.choices[0].message.content or "").strip()

        import re as _re, json as _json
        m = _re.search(r"\{.*\}", content, _re.DOTALL)
        obj = _json.loads(m.group(0)) if m else _json.loads(content)

        conf = float(obj.get("confidence_pct"))
        rat  = str(obj.get("rationale") or "").strip()
        conf = max(0.0, min(100.0, conf))
        if len(rat) > 140:
            rat = rat[:137] + "..."
        return conf, rat
    except Exception as e:
        log.warning("LLM confidence failed: %s", e)
        return None

# -------------------------
# SQLite (persistent)
# -------------------------
def resolve_db_path() -> None:
    """Try to create directory for DB_PATH; if permission denied, fallback to /tmp/ai_trader/data.db."""
    global DB_PATH
    d = os.path.dirname(DB_PATH) or "."
    try:
        os.makedirs(d, exist_ok=True)
        probe = os.path.join(d, ".write_test")
        with open(probe, "w", encoding="utf-8") as f:
            f.write("ok")
        os.remove(probe)
        log.info("DB dir OK: %s (using %s)", d, DB_PATH)
    except Exception as e:
        fallback_dir = "/tmp/ai_trader"
        os.makedirs(fallback_dir, exist_ok=True)
        DB_PATH = os.path.join(fallback_dir, "data.db")
        log.warning("DB dir '%s' not writable (%s). Falling back to %s", d, e, DB_PATH)
        resolve_db_path()

def db_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
    except Exception:
        pass
    return conn

def db_init() -> None:
    with db_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                received_at INTEGER NOT NULL,
                type TEXT,
                symbol TEXT,
                tf TEXT,
                side TEXT,
                entry REAL,
                sl REAL,
                tp1 REAL,
                tp2 REAL,
                tp3 REAL,
                trade_id TEXT,
                raw_json TEXT
            )
            """
        )
        cur.execute("CREATE INDEX IF NOT EXISTS idx_events_trade ON events(trade_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_events_time ON events(received_at)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_events_symbol ON events(symbol)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_events_tf ON events(tf)")
        conn.commit()
    log.info("DB initialized at %s", DB_PATH)

resolve_db_path()
db_init()

def _to_float(v):
    try:
        return float(v) if v is not None else None
    except Exception:
        return None

def save_event(payload: Dict[str, Any]) -> None:
    row = {
        "received_at": int(time.time()),
        "type": payload.get("type"),
        "symbol": payload.get("symbol"),
        "tf": str(payload.get("tf")) if payload.get("tf") is not None else None,
        "side": payload.get("side"),
        "entry": _to_float(payload.get("entry")),
        "sl": _to_float(payload.get("sl")),
        "tp1": _to_float(payload.get("tp1")),
        "tp2": _to_float(payload.get("tp2")),
        "tp3": _to_float(payload.get("tp3")),
        "trade_id": payload.get("trade_id"),
        "raw_json": json.dumps(payload, ensure_ascii=False),
    }
    with db_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO events (received_at, type, symbol, tf, side, entry, sl, tp1, tp2, tp3, trade_id, raw_json)
            VALUES (:received_at, :type, :symbol, :tf, :side, :entry, :sl, :tp1, :tp2, :tp3, :trade_id, :raw_json)
            """,
            row,
        )
        conn.commit()
    log.info("Saved event: type=%s symbol=%s tf=%s trade_id=%s", row["type"], row["symbol"], row["tf"], row["trade_id"])

# -------------------------
# Helpers
# -------------------------
def escape_html(s: str) -> str:
    return (
        s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        .replace('"', "&quot;").replace("'", "&#39;")
    )

def fmt_num(v) -> str:
    try:
        if v is None:
            return ""
        s = f"{float(v):,.6f}".rstrip("0").rstrip(".")
        return s
    except Exception:
        return str(v or "")

def tf_label_of(payload: Dict[str, Any]) -> str:
    label = str(payload.get("tf_label") or payload.get("tf") or "?")
    try:
        if label.isdigit():
            n = int(label)
            if n < 60:
                return f"{n}m"
            if n % 60 == 0 and n < 1440:
                return f"{n//60}h"
            if n == 1440:
                return "1D"
    except Exception:
        pass
    return label

def pct(a: Optional[float], b: Optional[float]) -> Optional[float]:
    try:
        if a is None or b is None or b == 0:
            return None
        return (a - b) / b * 100.0
    except Exception:
        return None

def parse_leverage_x(leverage: Optional[str]) -> Optional[float]:
    if not leverage:
        return None
    try:
        s = leverage.lower().replace("x", " ").split()
        for token in s:
            if token.replace(".", "", 1).isdigit():
                return float(token)
    except Exception:
        return None
    return None
# -------------------------
# Telegram helpers
# -------------------------
import httpx

def telegram_send(msg: str, pin: bool = False) -> Tuple[bool, Optional[str]]:
    """Envoie un message Telegram. Retourne (ok, err)."""
    if not (TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID):
        return False, "telegram not configured"
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": msg,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }
        r = httpx.post(url, json=payload, timeout=10)
        if r.status_code != 200:
            return False, f"HTTP {r.status_code}"
        if pin:
            try:
                data = r.json()
                msg_id = data.get("result", {}).get("message_id")
                if msg_id:
                    pin_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/pinChatMessage"
                    httpx.post(pin_url, json={"chat_id": TELEGRAM_CHAT_ID, "message_id": msg_id}, timeout=10)
            except Exception:
                pass
        return True, None
    except Exception as e:
        return False, str(e)

def fmt_event_for_tg(payload: Dict[str, Any]) -> str:
    """Formate un event JSON pour Telegram (HTML)."""
    t = str(payload.get("type") or "?").upper()
    sym = escape_html(str(payload.get("symbol") or "?"))
    tf  = escape_html(tf_label_of(payload))
    s   = escape_html(str(payload.get("side") or ""))

    lines = []
    if t == "ENTRY":
        lines.append(f"🔔 <b>ENTRY</b> — <code>{sym} {tf}</code>")
        lines.append(f"📈 <b>{s.title()} Entry:</b> {fmt_num(payload.get('entry'))}")
        if payload.get("leverage"):
            lines.append(f"💡Leverage: {escape_html(str(payload.get('leverage')))}")
        for i in range(1, 4):
            tpv = payload.get(f"tp{i}")
            if tpv is not None:
                lines.append(f"🎯 TP{i}: {fmt_num(tpv)}")
        slv = payload.get("sl")
        if slv is not None:
            lines.append(f"✘ SL: {fmt_num(slv)}")
    elif t in ("TP1_HIT", "TP2_HIT", "TP3_HIT", "SL_HIT"):
        lines.append(f"📍 <b>{t}</b> — <code>{sym} {tf}</code>")
        lines.append(f"Side={s} Entry={fmt_num(payload.get('entry'))} Hit={fmt_num(payload.get('tp'))}")
    elif t == "CLOSE":
        reason = escape_html(str(payload.get("reason") or ""))
        lines.append(f"🛑 <b>CLOSE</b> — <code>{sym} {tf}</code>")
        lines.append(f"Side={s} Reason={reason}")
    elif t.startswith("AOE_"):
        z = "Premium" if t == "AOE_PREMIUM" else "Discount"
        lines.append(f"🔔 <b>AOE_{z}</b> — <code>{sym} {tf}</code>")
    else:
        lines.append(f"📌 <b>{t}</b> — <code>{sym} {tf}</code>")

    return "\n".join(lines)

# -------------------------
# HTML templates
# -------------------------
EVENTS_HTML_TPL = Template(r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AI Trader Pro — Trades</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
body { background:#0d1117; color:#c9d1d9; }
h1,h2,h3 { color:#58a6ff; }
.table thead th { background:#161b22; color:#58a6ff; }
.table-hover tbody tr:hover { background:#21262d; }
.card { background:#161b22; border:1px solid #30363d; }
footer { margin-top:2rem; font-size:0.85em; color:#8b949e; }
</style>
</head>
<body>
<div class="container py-4">
  <h1 class="mb-4">📊 AI Trader Pro — Trades</h1>
  $content
  <footer>AI Trader Pro &copy; 2025 — Dashboard auto-généré</footer>
</div>
</body>
</html>""")

def render_events_html(events: List[sqlite3.Row]) -> str:
    """Render events to HTML table."""
    if not events:
        return EVENTS_HTML_TPL.substitute(content="<p>Aucun trade enregistré.</p>")
    rows = []
    for e in events:
        rows.append(
            f"<tr>"
            f"<td>{escape_html(e['type'])}</td>"
            f"<td>{escape_html(e['symbol'] or '')}</td>"
            f"<td>{escape_html(e['tf'] or '')}</td>"
            f"<td>{escape_html(e['side'] or '')}</td>"
            f"<td>{fmt_num(e['entry'])}</td>"
            f"<td>{fmt_num(e['sl'])}</td>"
            f"<td>{fmt_num(e['tp1'])}</td>"
            f"<td>{fmt_num(e['tp2'])}</td>"
            f"<td>{fmt_num(e['tp3'])}</td>"
            f"<td>{escape_html(e['trade_id'] or '')}</td>"
            f"<td>{time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(e['received_at']))}</td>"
            f"</tr>"
        )
    table_html = (
        "<div class='card p-3'>"
        "<table class='table table-dark table-hover table-sm'>"
        "<thead><tr>"
        "<th>Type</th><th>Symbol</th><th>TF</th><th>Side</th><th>Entry</th><th>SL</th>"
        "<th>TP1</th><th>TP2</th><th>TP3</th><th>Trade ID</th><th>Time</th>"
        "</tr></thead><tbody>"
        + "".join(rows) +
        "</tbody></table></div>"
    )
    return EVENTS_HTML_TPL.substitute(content=table_html)
# -------------------------
# Altseason: helpers & endpoints
# -------------------------

# Cache mémoire simple pour /altseason/check
_alt_cache: Dict[str, Any] = {"ts": 0.0, "snap": None}

def _safe_get_json(url: str, timeout: float = 12.0) -> Dict[str, Any]:
    """GET JSON avec httpx + erreurs lisibles."""
    headers = {
        "User-Agent": "ai-trader-pro/1.0",
        "Accept": "application/json, text/plain, */*",
    }
    r = httpx.get(url, headers=headers, timeout=timeout)
    if r.status_code != 200:
        raise RuntimeError(f"{url} -> HTTP {r.status_code}: {r.text[:200]}")
    try:
        return r.json()
    except Exception:
        raise RuntimeError(f"{url} -> Non-JSON response: {r.text[:200]}")

def _altseason_fetch() -> Dict[str, Any]:
    """Récupère (best-effort) BTC dominance, TOTAL2, ETH/BTC, Altseason Index."""
    out: Dict[str, Any] = {
        "asof": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "errors": []
    }

    # ---- Global MCAP & BTC dominance (chaines de fallback)
    mcap_usd: Optional[float] = None
    btc_dom: Optional[float]  = None
    try:
        alt = _safe_get_json("https://api.alternative.me/v2/global/")
        d0 = (alt.get("data") or [{}])[0]
        qusd = (d0.get("quotes") or {}).get("USD") or {}
        mcap_usd = float(qusd.get("total_market_cap"))
        btc_dom  = float(d0.get("bitcoin_percentage_of_market_cap"))
    except Exception as e:
        out["errors"].append(f"alternative.me: {e!r}")

    if mcap_usd is None or btc_dom is None:
        try:
            cg = _safe_get_json("https://api.coingecko.com/api/v3/global")
            data = cg.get("data") or {}
            mcap_usd = float((data.get("total_market_cap") or {}).get("usd"))
            btc_dom  = float((data.get("market_cap_percentage") or {}).get("btc"))
        except Exception as e:
            out["errors"].append(f"coingecko: {e!r}")

    if mcap_usd is None or btc_dom is None:
        try:
            cp = _safe_get_json("https://api.coinpaprika.com/v1/global")
            mcap_usd = float(cp.get("market_cap_usd"))
            btc_dom  = float(cp.get("bitcoin_dominance_percentage"))
        except Exception as e:
            out["errors"].append(f"coinpaprika: {e!r}")

    # TOTAL2 = total mcap * (1 - BTC%)
    total2 = None
    if mcap_usd is not None and btc_dom is not None:
        total2 = mcap_usd * (1.0 - btc_dom/100.0)

    # ---- ETH/BTC (binance -> coingecko)
    eth_btc: Optional[float] = None
    try:
        j = _safe_get_json("https://api.binance.com/api/v3/ticker/price?symbol=ETHBTC")
        eth_btc = float(j.get("price"))
    except Exception as e:
        out["errors"].append(f"binance: {e!r}")
        try:
            sp = _safe_get_json("https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=btc")
            eth_btc = float((sp.get("ethereum") or {}).get("btc"))
        except Exception as e2:
            out["errors"].append(f"coingecko simple: {e2!r}")

    # ---- Altseason Index (scrape léger en best-effort, sans dépendance bs4)
    alt_idx: Optional[int] = None
    try:
        r = httpx.get(
            "https://www.blockchaincenter.net/altcoin-season-index/",
            headers={"User-Agent": "ai-trader-pro/1.0"},
            timeout=12.0,
        )
        if r.status_code == 200 and r.text:
            # Cherche un nombre entier 0..100 proche du libellé "Altcoin Season Index"
            m = re.search(r"Altcoin\s+Season\s+Index[^0-9]*([0-9]{1,3})", r.text, re.IGNORECASE)
            if m:
                v = int(m.group(1))
                if 0 <= v <= 100:
                    alt_idx = v
    except Exception as e:
        out["errors"].append(f"altseason_index_scrape: {e!r}")

    out["total_mcap_usd"] = (None if mcap_usd is None else float(mcap_usd))
    out["btc_dominance"]  = (None if btc_dom  is None else float(btc_dom))
    out["total2_usd"]     = (None if total2   is None else float(total2))
    out["eth_btc"]        = (None if eth_btc  is None else float(eth_btc))
    out["altseason_index"]= (None if alt_idx  is None else int(alt_idx))
    return out

def _ok_cmp(val: Optional[float], thr: float, direction: str) -> bool:
    if val is None:
        return False
    return (val < thr) if direction == "below" else (val > thr)

def _altseason_summary(snap: Dict[str, Any]) -> Dict[str, Any]:
    btc = snap.get("btc_dominance")
    eth = snap.get("eth_btc")
    t2  = snap.get("total2_usd")
    asi = snap.get("altseason_index")

    btc_ok = _ok_cmp(btc, ALT_BTC_DOM_THR, "below")
    eth_ok = _ok_cmp(eth, ALT_ETH_BTC_THR, "above")
    t2_ok  = _ok_cmp(t2, ALT_TOTAL2_THR_T * 1e12, "above")
    asi_ok = (asi is not None) and _ok_cmp(float(asi), ALT_ASI_THR, "above")

    greens = int(btc_ok) + int(eth_ok) + int(t2_ok) + int(asi_ok)
    on = greens >= ALT_GREENS_REQUIRED

    return {
        "asof": snap.get("asof"),
        "stale": bool(snap.get("stale", False)),
        "errors": snap.get("errors", []),
        "btc_dominance": (None if btc is None else float(btc)),
        "eth_btc": (None if eth is None else float(eth)),
        "total2_usd": (None if t2 is None else float(t2)),
        "altseason_index": (None if asi is None else int(asi)),
        "thresholds": {
            "btc": ALT_BTC_DOM_THR,
            "eth_btc": ALT_ETH_BTC_THR,
            "asi": ALT_ASI_THR,
            "total2_trillions": ALT_TOTAL2_THR_T,
            "greens_required": ALT_GREENS_REQUIRED
        },
        "triggers": {
            "btc_dominance_ok": btc_ok,
            "eth_btc_ok": eth_ok,
            "total2_ok": t2_ok,
            "altseason_index_ok": asi_ok
        },
        "greens": greens,
        "ALTSEASON_ON": on
    }

def _altseason_snapshot(force: bool = False) -> Dict[str, Any]:
    """Cache mémoire simple (ALT_CACHE_TTL secondes)."""
    now = time.time()
    if (not force) and _alt_cache["snap"] and (now - _alt_cache["ts"] < ALT_CACHE_TTL):
        s = dict(_alt_cache["snap"])
        s.setdefault("stale", False)
        return s
    try:
        snap = _altseason_fetch()
        snap["stale"] = False
        _alt_cache["snap"] = snap
        _alt_cache["ts"] = now
        return snap
    except Exception as e:
        # Fallback: si on a un cache précédent, on le marque "stale"
        if _alt_cache["snap"]:
            s = dict(_alt_cache["snap"])
            s["stale"] = True
            s.setdefault("errors", []).append(f"live_fetch_exception: {e!r}")
            return s
        # Sinon, snapshot minimal
        return {
            "asof": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "btc_dominance": None,
            "eth_btc": None,
            "total2_usd": None,
            "altseason_index": None,
            "errors": [f"live_fetch_exception: {e!r}"],
            "stale": True,
        }

# ----- Streaks journaliers (3/4, 4/4) stockés sur disque -----
def _load_state() -> Dict[str, Any]:
    try:
        if os.path.exists(ALTSEASON_STATE_FILE):
            with open(ALTSEASON_STATE_FILE, "r", encoding="utf-8") as f:
                d = json.load(f)
                if isinstance(d, dict):
                    return d
    except Exception:
        pass
    return {
        "last_on": False, "last_sent_ts": 0, "last_tick_ts": 0,
        "consec_3of4_days": 0, "consec_4of4_days": 0,
        "last_streak_date": None
    }

def _save_state(state: Dict[str, Any]) -> None:
    try:
        d = os.path.dirname(ALTSEASON_STATE_FILE) or "/tmp"
        os.makedirs(d, exist_ok=True)
        with open(ALTSEASON_STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f)
    except Exception:
        pass

def _today_utc_str() -> str:
    import datetime as dt
    return dt.datetime.utcnow().strftime("%Y-%m-%d")

def _update_daily_streaks(state: Dict[str, Any], summary: Dict[str, Any]) -> None:
    """Met à jour les compteurs de jours consécutifs au changement de date UTC."""
    import datetime as dt
    today = _today_utc_str()
    last = state.get("last_streak_date")
    if last == today:
        return
    greens = int(summary.get("greens") or 0)
    is3 = greens >= 3
    is4 = greens >= 4

    if last is None:
        state["consec_3of4_days"] = 1 if is3 else 0
        state["consec_4of4_days"] = 1 if is4 else 0
    else:
        try:
            d_last = dt.datetime.strptime(last, "%Y-%m-%d")
            d_today = dt.datetime.strptime(today, "%Y-%m-%d")
            consecutive = (d_today - d_last).days == 1
        except Exception:
            consecutive = False

        if consecutive:
            state["consec_3of4_days"] = (state.get("consec_3of4_days", 0) + 1) if is3 else 0
            state["consec_4of4_days"] = (state.get("consec_4of4_days", 0) + 1) if is4 else 0
        else:
            state["consec_3of4_days"] = 1 if is3 else 0
            state["consec_4of4_days"] = 1 if is4 else 0

    state["last_streak_date"] = today

# -------------------------
# Endpoints Altseason
# -------------------------

@app.get("/altseason/check")
def altseason_check_public():
    """Lecture publique (avec cache) + résumé prêt à afficher."""
    snap = _altseason_snapshot(force=False)
    return _altseason_summary(snap)

@app.get("/altseason/streaks")
def altseason_streaks():
    """Expose l'état 3/4 et 4/4 + compteurs de jours consécutifs (UTC)."""
    st = _load_state()
    s = _altseason_summary(_altseason_snapshot(force=False))
    _update_daily_streaks(st, s)
    _save_state(st)
    return {
        "asof": s.get("asof"),
        "greens": s.get("greens"),
        "ALT3_ON": bool(int(s.get("greens") or 0) >= 3),
        "ALT4_ON": bool(int(s.get("greens") or 0) >= 4),
        "consec_3of4_days": int(st.get("consec_3of4_days") or 0),
        "consec_4of4_days": int(st.get("consec_4of4_days") or 0),
    }

@app.api_route("/altseason/notify", methods=["GET", "POST"])
async def altseason_notify(
    request: Request,
    secret: Optional[str] = Query(None),
    force: Optional[bool] = Query(False),
    message: Optional[str] = Query(None),
    pin: Optional[bool] = Query(False)
):
    """Notification Telegram (protégée) de l'état Altseason."""
    body = {}
    if request.method == "POST":
        try:
            body = await request.json()
        except Exception:
            body = {}
    body_secret = body.get("secret") if isinstance(body, dict) else None
    if WEBHOOK_SECRET and (secret != WEBHOOK_SECRET and body_secret != WEBHOOK_SECRET):
        raise HTTPException(status_code=401, detail="Invalid secret")

    if request.method == "POST":
        force = bool(body.get("force", force))
        message = body.get("message", message)
        pin = bool(body.get("pin", pin))
    pin = bool(pin or TELEGRAM_PIN_ALTSEASON)

    s = _altseason_summary(_altseason_snapshot(force=bool(force)))
    sent = False
    err  = None
    if s["ALTSEASON_ON"] or force:
        if message:
            msg = message
        else:
            if s["ALTSEASON_ON"]:
                msg = f"[ALERTE ALTSEASON] {s['asof']} — Greens={s['greens']} — ALTSEASON DÉBUTÉ !"
            else:
                msg = f"[ALERTE ALTSEASON] {s['asof']} — Greens={s['greens']} — EN VEILLE (conditions insuffisantes)"
        sent, err = telegram_send(msg, pin=pin)

    return {"summary": s, "telegram_sent": sent, "error": err}
# -------------------------
# Webhook TradingView (PROTÉGÉ)
# -------------------------
@app.post("/tv-webhook")
async def tv_webhook(request: Request, secret: Optional[str] = Query(None)):
    try:
        payload = await request.json()
        if not isinstance(payload, dict):
            raise ValueError("JSON must be an object")
    except Exception as e:
        log.error("Invalid JSON: %s", e)
        raise HTTPException(status_code=400, detail="Invalid JSON")

    body_secret = payload.get("secret")
    if WEBHOOK_SECRET and (secret != WEBHOOK_SECRET and body_secret != WEBHOOK_SECRET):
        raise HTTPException(status_code=401, detail="Invalid secret")

    log.info("Webhook payload: %s", json.dumps(payload)[:300])
    save_event(payload)

    # Envoi Telegram pour les signaux de trade (non épinglés)
    try:
        msg = telegram_rich_message(payload)
        if msg:
            ok, err = telegram_send(msg, pin=False)
            log.info("TV webhook -> telegram sent=%s err=%s", ok, err)
    except Exception as e:
        log.warning("TV webhook telegram send error: %s", e)

    return {"ok": True}

# -------------------------
# Trades JSON (PROTÉGÉ)
# -------------------------
@app.get("/trades.json")
def trades_json(
    secret: Optional[str] = Query(None),
    symbol: Optional[str] = Query(None),
    tf: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    limit: int = Query(100)
):
    if WEBHOOK_SECRET and secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid secret")
    start_ep = parse_date_to_epoch(start)
    end_ep = parse_date_end_to_epoch(end)
    trades, summary = build_trades_filtered(symbol, tf, start_ep, end_ep, max_rows=max(1000, limit * 10))
    return JSONResponse({"summary": summary, "trades": trades[-limit:] if limit else trades})

# -------------------------
# Trades CSV (PROTÉGÉ)
# -------------------------
@app.get("/trades.csv")
def trades_csv(
    secret: Optional[str] = Query(None),
    symbol: Optional[str] = Query(None),
    tf: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    limit: int = Query(1000)
):
    if WEBHOOK_SECRET and secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid secret")
    start_ep = parse_date_to_epoch(start)
    end_ep = parse_date_end_to_epoch(end)
    trades, _ = build_trades_filtered(symbol, tf, start_ep, end_ep, max_rows=max(5000, limit * 10))
    data = trades[-limit:] if limit else trades
    headers = ["trade_id","symbol","tf","side","entry","sl","tp1","tp2","tp3","entry_time","outcome","outcome_time","duration_sec"]
    lines = [",".join(headers)]
    for tr in data:
        row = [str(tr.get(h, "")) for h in headers]
        row = [("\"%s\"" % x) if ("," in x) else x for x in row]
        lines.append(",".join(row))
    return Response(content="\n".join(lines), media_type="text/csv")

# -------------------------
# Events (PROTÉGÉ)
# -------------------------
@app.get("/events", response_class=HTMLResponse)
def events(secret: Optional[str] = Query(None), limit: int = Query(200)):
    if WEBHOOK_SECRET and secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid secret")
    with db_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM events ORDER BY received_at DESC LIMIT ?", (limit,))
        rows = cur.fetchall()

    def fmt_time(ts: int) -> str:
        try:
            import datetime as dt
            return dt.datetime.utcfromtimestamp(int(ts)).strftime("%Y-%m-%d %H:%M:%S UTC")
        except Exception:
            return str(ts)

    rows_html = ""
    for r in rows:
        rows_html += (
            "<tr>"
            f"<td>{escape_html(fmt_time(r['received_at']))}</td>"
            f"<td>{escape_html(r['type'] or '')}</td>"
            f"<td>{escape_html(r['symbol'] or '')}</td>"
            f"<td>{escape_html(r['tf'] or '')}</td>"
            f"<td>{escape_html(r['side'] or '')}</td>"
            f"<td>{escape_html(r['trade_id'] or '')}</td>"
            f"<td><pre style='white-space:pre-wrap;margin:0'>{escape_html(r['raw_json'] or '')}</pre></td>"
            "</tr>"
        )

    html = EVENTS_HTML_TPL.safe_substitute(
        secret=escape_html(secret or ""),
        rows_html=rows_html or '<tr><td colspan="7" class="muted">No events.</td></tr>'
    )
    return HTMLResponse(html)

@app.get("/events.json")
def events_json(secret: Optional[str] = Query(None), limit: int = Query(200)):
    if WEBHOOK_SECRET and secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid secret")
    with db_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM events ORDER BY received_at DESC LIMIT ?", (limit,))
        rows = [dict(r) for r in cur.fetchall()]
    return JSONResponse({"events": rows})

# -------------------------
# Alias admin
# -------------------------
@app.get("/trades/secret={secret}")
def trades_alias(secret: str):
    return RedirectResponse(url=f"/trades-admin?secret={secret}", status_code=307)

# -------------------------
# Reset (PROTÉGÉ)
# -------------------------
@app.get("/reset")
def reset_all(
    secret: Optional[str] = Query(None),
    confirm: Optional[str] = Query(None),
    redirect: Optional[str] = Query(None)
):
    if WEBHOOK_SECRET and secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid secret")
    if confirm not in ("yes","true","1","YES","True"):
        return {"ok": False, "error": "Confirmation required: add &confirm=yes"}

    with db_conn() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM events")
        conn.commit()

    if redirect:
        return RedirectResponse(url=redirect, status_code=303)
    return {"ok": True, "deleted": "all"}

# -------------------------
# Trades PUBLIC (avec Altseason mini-card)
# -------------------------
@app.get("/trades", response_class=HTMLResponse)
def trades_public(
    symbol: Optional[str] = Query(None),
    tf: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    limit: int = Query(100)
):
    start_ep = parse_date_to_epoch(start)
    end_ep = parse_date_end_to_epoch(end)
    trades, summary = build_trades_filtered(symbol, tf, start_ep, end_ep, max_rows=max(5000, limit * 10))

    # Lignes du tableau
    rows_html = ""
    data = trades[-limit:] if limit else trades
    for tr in data:
        outcome = tr["outcome"] or "NONE"
        badge_class = "badge-win" if outcome in ("TP1_HIT","TP2_HIT","TP3_HIT") else ("badge-loss" if outcome == "SL_HIT" else "")
        outcome_html = f'<span class="chip {badge_class}">{escape_html(outcome)}</span>'
        rows_html += (
            "<tr>"
            f"<td>{escape_html(str(tr['trade_id']))}</td>"
            f"<td>{escape_html(str(tr.get('symbol') or ''))}</td>"
            f"<td>{escape_html(str(tr.get('tf') or ''))}</td>"
            f"<td>{escape_html(str(tr.get('side') or ''))}</td>"
            f"<td>{fmt_num(tr.get('entry'))}</td>"
            f"<td>{fmt_num(tr.get('sl'))}</td>"
            f"<td>{fmt_num(tr.get('tp1'))}</td>"
            f"<td>{fmt_num(tr.get('tp2'))}</td>"
            f"<td>{fmt_num(tr.get('tp3'))}</td>"
            f"<td>{outcome_html}</td>"
            f"<td>{tr.get('duration_sec') if tr.get('duration_sec') is not None else ''}</td>"
            "</tr>"
        )

    html = TRADES_PUBLIC_HTML_TPL.safe_substitute(
        symbol=escape_html(symbol or ""),
        tf=escape_html(tf or ""),
        start=escape_html(start or ""),
        end=escape_html(end or ""),
        limit=str(limit),
        total_trades=str(summary["total_trades"]),
        winrate_pct=str(summary["winrate_pct"]),
        wins=str(summary["wins"]),
        losses=str(summary["losses"]),
        tp1_hits=str(summary["tp1_hits"]),
        tp2_hits=str(summary["tp2_hits"]),
        tp3_hits=str(summary["tp3_hits"]),
        avg_time_to_outcome_sec=str(summary["avg_time_to_outcome_sec"]),
        best_win_streak=str(summary["best_win_streak"]),
        worst_loss_streak=str(summary["worst_loss_streak"]),
        rows_html=rows_html or '<tr><td colspan="11" class="muted">No trades yet. Send a webhook to /tv-webhook.</td></tr>'
    )
    return HTMLResponse(html)

# -------------------------
# Trades ADMIN (protégé)
# -------------------------
@app.get("/trades-admin", response_class=HTMLResponse)
def trades_admin(
    secret: Optional[str] = Query(None),
    symbol: Optional[str] = Query(None),
    tf: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    limit: int = Query(100)
):
    if WEBHOOK_SECRET and secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid secret")

    start_ep = parse_date_to_epoch(start)
    end_ep = parse_date_end_to_epoch(end)
    trades, summary = build_trades_filtered(symbol, tf, start_ep, end_ep, max_rows=max(5000, limit * 10))

    rows_html = ""
    data = trades[-limit:] if limit else trades
    for tr in data:
        outcome = tr["outcome"] or "NONE"
        badge_class = "badge-win" if outcome in ("TP1_HIT","TP2_HIT","TP3_HIT") else ("badge-loss" if outcome == "SL_HIT" else "")
        outcome_html = f'<span class="chip {badge_class}">{escape_html(outcome)}</span>'
        rows_html += (
            "<tr>"
            f"<td>{escape_html(str(tr['trade_id']))}</td>"
            f"<td>{escape_html(str(tr.get('symbol') or ''))}</td>"
            f"<td>{escape_html(str(tr.get('tf') or ''))}</td>"
            f"<td>{escape_html(str(tr.get('side') or ''))}</td>"
            f"<td>{fmt_num(tr.get('entry'))}</td>"
            f"<td>{fmt_num(tr.get('sl'))}</td>"
            f"<td>{fmt_num(tr.get('tp1'))}</td>"
            f"<td>{fmt_num(tr.get('tp2'))}</td>"
            f"<td>{fmt_num(tr.get('tp3'))}</td>"
            f"<td>{outcome_html}</td>"
            f"<td>{tr.get('duration_sec') if tr.get('duration_sec') is not None else ''}</td>"
            "</tr>"
        )

    html = TRADES_ADMIN_HTML_TPL.safe_substitute(
        secret=escape_html(secret or ""),
        symbol=escape_html(symbol or ""),
        tf=escape_html(tf or ""),
        start=escape_html(start or ""),
        end=escape_html(end or ""),
        limit=str(limit),
        total_trades=str(summary["total_trades"]),
        winrate_pct=str(summary["winrate_pct"]),
        wins=str(summary["wins"]),
        losses=str(summary["losses"]),
        tp1_hits=str(summary["tp1_hits"]),
        tp2_hits=str(summary["tp2_hits"]),
        tp3_hits=str(summary["tp3_hits"]),
        avg_time_to_outcome_sec=str(summary["avg_time_to_outcome_sec"]),
        best_win_streak=str(summary["best_win_streak"]),
        worst_loss_streak=str(summary["worst_loss_streak"]),
        rows_html=rows_html or '<tr><td colspan="11" class="muted">No trades yet. Send a webhook to /tv-webhook.</td></tr>'
    )
    return HTMLResponse(html)
# -------------------------
# Altseason Daemon (auto-notify)
# -------------------------
_daemon_stop = threading.Event()
_daemon_thread: Optional[threading.Thread] = None

@app.on_event("startup")
def _start_daemon():
    global _daemon_thread
    if ALTSEASON_AUTONOTIFY and _daemon_thread is None:
        _daemon_stop.clear()
        _daemon_thread = threading.Thread(target=_daemon_loop, daemon=True)
        _daemon_thread.start()
        log.info(
            "Altseason daemon scheduled (autonotify=%s, poll=%ss, min_gap=%smin, greens_required=%s)",
            ALTSEASON_AUTONOTIFY, ALTSEASON_POLL_SECONDS, ALTSEASON_NOTIFY_MIN_GAP_MIN, ALT_GREENS_REQUIRED
        )

@app.on_event("shutdown")
def _stop_daemon():
    if _daemon_thread is not None:
        _daemon_stop.set()

def _daemon_loop():
    state = _load_state()
    log.info(
        "Altseason daemon started (autonotify=%s, poll=%ss, min_gap=%smin, greens_required=%s)",
        ALTSEASON_AUTONOTIFY, ALTSEASON_POLL_SECONDS, ALTSEASON_NOTIFY_MIN_GAP_MIN, ALT_GREENS_REQUIRED
    )
    while not _daemon_stop.wait(ALTSEASON_POLL_SECONDS):
        try:
            state["last_tick_ts"] = int(time.time())
            s = _altseason_summary(_altseason_snapshot(force=False))
            now = time.time()
            need_send = False

            # MAJ des streaks (1 fois par jour max)
            _update_daily_streaks(state, s)

            if s["ALTSEASON_ON"] and not state.get("last_on", False):  # OFF -> ON
                need_send = True
            elif s["ALTSEASON_ON"]:
                min_gap = ALTSEASON_NOTIFY_MIN_GAP_MIN * 60
                if now - state.get("last_sent_ts", 0) >= min_gap:
                    need_send = True

            if need_send:
                msg = f"[ALERTE ALTSEASON] {s['asof']} — Greens={s['greens']} — ALTSEASON DÉBUTÉ !"
                ok, err = telegram_send(msg, pin=TELEGRAM_PIN_ALTSEASON)
                log.info("Altseason auto-notify: sent=%s err=%s", ok, err)
                if ok:
                    state["last_sent_ts"] = int(now)
            state["last_on"] = bool(s["ALTSEASON_ON"])
            _save_state(state)
        except Exception as e:
            log.warning("Altseason daemon tick error: %s", e)

# ============ Run local ============
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
