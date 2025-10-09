# main.py - AI Trader Pro v3.0 - VERSION FINALE COMPLÈTE
# Python 3.8+ - TOUTES LES FONCTIONNALITÉS

import os
import sqlite3
import logging
import time
import json
import math
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from contextlib import contextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import httpx

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    RATE_LIMIT_ENABLED = True
except ImportError:
    RATE_LIMIT_ENABLED = False

class Settings:
    DB_DIR = os.getenv("DB_DIR", "/tmp/ai_trader")
    DB_PATH = os.path.join(DB_DIR, "data.db")
    WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET")
    if not WEBHOOK_SECRET:
        raise ValueError("❌ WEBHOOK_SECRET obligatoire")
    
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
    TELEGRAM_ENABLED = bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)
    
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    MAX_CONSECUTIVE_LOSSES = int(os.getenv("MAX_CONSECUTIVE_LOSSES", "3"))
    CIRCUIT_BREAKER_ENABLED = os.getenv("CIRCUIT_BREAKER_ENABLED", "1") == "1"
    INITIAL_CAPITAL = float(os.getenv("INITIAL_CAPITAL", "10000.0"))

settings = Settings()
os.makedirs(settings.DB_DIR, exist_ok=True)

logger = logging.getLogger("aitrader")
logger.setLevel(settings.LOG_LEVEL)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)
logger.info("🚀 AI Trader Pro v3.0 ULTIMATE - TOUTES FONCTIONNALITÉS")

class WebhookPayload(BaseModel):
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
    confidence: Optional[int] = None
    leverage: Optional[str] = None
    note: Optional[str] = None
    price: Optional[float] = None
    trade_id: Optional[str] = None
    secret: Optional[str] = None

    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        if v not in ['ENTRY', 'TP1_HIT', 'TP2_HIT', 'TP3_HIT', 'SL_HIT', 'CLOSE']:
            raise ValueError(f'Type invalide: {v}')
        return v

class JournalNote(BaseModel):
    trade_id: str
    note: Optional[str] = ""
    emotion: Optional[str] = ""
    tags: Optional[str] = ""

def dict_factory(cursor, row):
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

@contextmanager
def get_db():
    conn = sqlite3.connect(settings.DB_PATH, timeout=30.0)
    conn.row_factory = dict_factory
    try:
        yield conn
    finally:
        conn.close()

def db_execute(sql: str, params: tuple = ()):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
        return cur

def db_query(sql: str, params: tuple = ()) -> List[dict]:
    try:
        with get_db() as conn:
            return list(conn.cursor().execute(sql, params).fetchall())
    except:
        return []

def init_database():
    db_execute("""CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, symbol TEXT NOT NULL,
        tf TEXT, tf_label TEXT, time INTEGER NOT NULL, side TEXT, entry REAL, sl REAL,
        tp1 REAL, tp2 REAL, tp3 REAL, confidence INTEGER, leverage TEXT, note TEXT,
        price REAL, trade_id TEXT, created_at INTEGER DEFAULT (strftime('%s', 'now')))""")
    
    db_execute("""CREATE TABLE IF NOT EXISTS trade_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, trade_id TEXT NOT NULL, note TEXT,
        emotion TEXT, tags TEXT, created_at INTEGER DEFAULT (strftime('%s', 'now')))""")
    
    db_execute("""CREATE TABLE IF NOT EXISTS circuit_breaker (
        id INTEGER PRIMARY KEY AUTOINCREMENT, triggered_at INTEGER NOT NULL,
        reason TEXT, cooldown_until INTEGER, active INTEGER DEFAULT 1)""")

init_database()

def now_ms(): return int(datetime.now(timezone.utc).timestamp() * 1000)

def tf_to_label(tf):
    if not tf: return ""
    try:
        n = int(str(tf))
        if n < 60: return f"{n}m"
        if n == 60: return "1h"
        if n % 60 == 0: return f"{n//60}h"
    except: pass
    return str(tf)

def _latest_entry_for_trade(trade_id):
    r = db_query("SELECT * FROM events WHERE trade_id=? AND type='ENTRY' ORDER BY time DESC LIMIT 1", (trade_id,))
    return r[0] if r else None

def build_trade_rows(limit=300):
    base = db_query("SELECT trade_id, MAX(time) AS t_entry FROM events WHERE type='ENTRY' GROUP BY trade_id ORDER BY t_entry DESC LIMIT ?", (limit,))
    rows = []
    for item in base:
        e = _latest_entry_for_trade(item["trade_id"])
        if not e: continue
        hits = db_query("SELECT type FROM events WHERE trade_id=? AND type IN ('TP1_HIT','TP2_HIT','TP3_HIT','SL_HIT') GROUP BY type", (e["trade_id"],))
        hit_map = {h["type"]: True for h in hits}
        tp1_hit, sl_hit = bool(hit_map.get("TP1_HIT")), bool(hit_map.get("SL_HIT"))
        rows.append({
            "trade_id": e["trade_id"], "symbol": e["symbol"], "tf": e.get("tf"),
            "tf_label": e.get("tf_label") or tf_to_label(e.get("tf")),
            "side": e.get("side"), "entry": e.get("entry"), "tp1": e.get("tp1"), "sl": e.get("sl"),
            "tp1_hit": tp1_hit, "sl_hit": sl_hit,
            "row_state": "sl" if sl_hit else ("tp" if tp1_hit else "normal"),
            "t_entry": item["t_entry"], "confidence": e.get("confidence", 50)
        })
    return rows

async def fetch_fear_greed_index() -> Dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get("https://api.alternative.me/fng/?limit=1")
            data = response.json()
            if data and "data" in data and len(data["data"]) > 0:
                fng = data["data"][0]
                value = int(fng["value"])
                if value <= 25: sentiment, emoji, color, rec = "Extreme Fear", "😱", "#ef4444", "Opportunité d'achat"
                elif value <= 45: sentiment, emoji, color, rec = "Fear", "😰", "#f97316", "Bon moment"
                elif value <= 55: sentiment, emoji, color, rec = "Neutral", "😐", "#64748b", "Équilibré"
                elif value <= 75: sentiment, emoji, color, rec = "Greed", "😊", "#10b981", "Vigilant"
                else: sentiment, emoji, color, rec = "Extreme Greed", "🤑", "#22c55e", "Prenez profits"
                return {"value": value, "sentiment": sentiment, "emoji": emoji, "color": color, "recommendation": rec}
    except Exception as e:
        logger.error(f"FG error: {e}")
    return {"value": 50, "sentiment": "Unknown", "emoji": "❓", "color": "#64748b", "recommendation": "N/A"}

def detect_bullrun_phase(rows: List[dict]) -> Dict[str, Any]:
    default = {"phase": 0, "phase_name": "Accumulation", "emoji": "🐻", "color": "#64748b", "description": "Pas assez", "confidence": 0, "details": {"btc": {"winrate": 0, "avg_return": 0, "trades": 0}, "eth": {"winrate": 0, "avg_return": 0, "trades": 0}, "large_cap": {"winrate": 0, "avg_return": 0, "trades": 0}, "small_alts": {"winrate": 0, "avg_return": 0, "trades": 0}}}
    if len(rows) < 10: return default
    try:
        def cp(t):
            if not t: return 0, 0
            w = sum(1 for x in t if x.get("row_state") == "tp")
            wr = (w / len(t)) * 100 if t else 0
            ret = []
            for r in t:
                if r.get("entry") and r.get("side"):
                    try:
                        en = float(r["entry"])
                        ex = float(r["sl"]) if r.get("sl_hit") and r.get("sl") else (float(r["tp1"]) if r.get("tp1") else None)
                        if ex:
                            pl = ((ex - en) / en) * 100
                            if r.get("side") == "SHORT": pl = -pl
                            ret.append(pl)
                    except: pass
            return wr, (sum(ret) / len(ret) if ret else 0)
        btc = [r for r in rows if r.get("symbol") and "BTC" in r["symbol"].upper() and r.get("row_state") in ("tp", "sl")]
        eth = [r for r in rows if r.get("symbol") and "ETH" in r["symbol"].upper() and "BTC" not in r["symbol"].upper() and r.get("row_state") in ("tp", "sl")]
        lcs = ["SOL", "BNB", "ADA", "AVAX", "DOT", "MATIC", "LINK"]
        lc = [r for r in rows if r.get("symbol") and any(s in r["symbol"].upper() for s in lcs) and r.get("row_state") in ("tp", "sl")]
        alt = [r for r in rows if r.get("symbol") and r.get("row_state") in ("tp", "sl") and "BTC" not in r["symbol"].upper() and "ETH" not in r["symbol"].upper() and not any(s in r["symbol"].upper() for s in lcs)]
        bwr, bav = cp(btc)
        ewr, eav = cp(eth)
        lwr, lav = cp(lc)
        awr, aav = cp(alt)
        bsc = (bwr * 0.6 + (bav + 10) * 4) if btc else 0
        esc = (ewr * 0.6 + (eav + 10) * 4) if eth else 0
        lsc = (lwr * 0.6 + (lav + 10) * 4) if lc else 0
        asc = (awr * 0.6 + (aav + 10) * 4) if alt else 0
        det = {"btc": {"winrate": round(bwr, 1), "avg_return": round(bav, 2), "trades": len(btc)}, "eth": {"winrate": round(ewr, 1), "avg_return": round(eav, 2), "trades": len(eth)}, "large_cap": {"winrate": round(lwr, 1), "avg_return": round(lav, 2), "trades": len(lc)}, "small_alts": {"winrate": round(awr, 1), "avg_return": round(aav, 2), "trades": len(alt)}}
        if bsc > esc and bsc > asc and bwr > 55:
            return {"phase": 1, "phase_name": "Bitcoin Season", "emoji": "₿", "color": "#f7931a", "description": "BTC domine", "confidence": min(100, int(bsc - max(esc, asc))), "details": det}
        elif (esc > bsc or lsc > bsc) and ewr > 50:
            return {"phase": 2, "phase_name": "ETH & Large-Cap", "emoji": "💎", "color": "#627eea", "description": "ETH surperforme", "confidence": min(100, int(max(esc, lsc) - bsc)), "details": det}
        elif asc > bsc and asc > esc and awr > 55:
            return {"phase": 3, "phase_name": "Altcoin Season", "emoji": "🚀", "color": "#10b981", "description": "Alts explosent", "confidence": min(100, int(asc - max(bsc, esc))), "details": det}
        return {"phase": 0, "phase_name": "Accumulation", "emoji": "🐻", "color": "#64748b", "description": "Neutre", "confidence": 30, "details": det}
    except Exception as e:
        logger.error(f"BR error: {e}")
        return default

def calculate_advanced_metrics(rows: List[dict]) -> Dict[str, Any]:
    closed = [r for r in rows if r.get("row_state") in ("tp", "sl")]
    if len(closed) < 2: return {"sharpe_ratio": 0, "sortino_ratio": 0, "calmar_ratio": 0, "expectancy": 0, "max_drawdown": 0}
    returns = []
    for r in closed:
        if r.get("entry") and r.get("side"):
            try:
                en, ex = float(r["entry"]), (float(r["sl"]) if r.get("sl_hit") and r.get("sl") else (float(r["tp1"]) if r.get("tp1") else None))
                if ex:
                    pl = ((ex - en) / en) * 100
                    if r.get("side") == "SHORT": pl = -pl
                    returns.append(pl)
            except: pass
    if not returns: return {"sharpe_ratio": 0, "sortino_ratio": 0, "calmar_ratio": 0, "expectancy": 0, "max_drawdown": 0}
    avg = sum(returns) / len(returns)
    std = math.sqrt(sum((r - avg) ** 2 for r in returns) / len(returns)) if len(returns) > 1 else 0.01
    sharpe = (avg / std) * math.sqrt(252) if std > 0 else 0
    down = [r for r in returns if r < 0]
    dstd = math.sqrt(sum(r ** 2 for r in down) / len(down)) if down else 0.01
    sortino = (avg / dstd) * math.sqrt(252) if dstd > 0 else 0
    cumul, run, mdd, peak = [], 0, 0, 0
    for r in returns:
        run += r
        cumul.append(run)
        if run > peak: peak = run
        dd = peak - run
        if dd > mdd: mdd = dd
    calmar = (sum(returns) / mdd) if mdd > 0 else 0
    wins = [r for r in returns if r > 0]
    losses = [r for r in returns if r < 0]
    aw = sum(wins) / len(wins) if wins else 0
    al = abs(sum(losses) / len(losses)) if losses else 0
    wr = len(wins) / len(returns) if returns else 0
    exp = (wr * aw) - ((1 - wr) * al)
    return {"sharpe_ratio": round(sharpe, 2), "sortino_ratio": round(sortino, 2), "calmar_ratio": round(calmar, 2), "expectancy": round(exp, 2), "max_drawdown": round(mdd, 2)}

def calculate_equity_curve(rows: List[dict]) -> List[Dict[str, Any]]:
    closed = sorted([r for r in rows if r.get("row_state") in ("tp", "sl")], key=lambda x: x.get("t_entry", 0))
    eq, cur, pk = [{"date": 0, "equity": settings.INITIAL_CAPITAL, "drawdown": 0}], settings.INITIAL_CAPITAL, settings.INITIAL_CAPITAL
    for r in closed:
        if r.get("entry") and r.get("side"):
            try:
                en, ex = float(r["entry"]), (float(r["sl"]) if r.get("sl_hit") and r.get("sl") else (float(r["tp1"]) if r.get("tp1") else None))
                if ex:
                    pl = ((ex - en) / en) * 100
                    if r.get("side") == "SHORT": pl = -pl
                    pla = cur * 0.02 * (pl / 2)
                    cur = max(0, cur + pla)
                    if cur > pk: pk = cur
                    dd = ((pk - cur) / pk) * 100 if pk > 0 else 0
                    eq.append({"date": r.get("t_entry", 0), "equity": round(cur, 2), "drawdown": round(dd, 2)})
            except: pass
    return eq

def calculate_performance_heatmap(rows: List[dict]) -> Dict[str, Any]:
    hm = defaultdict(lambda: {"wins": 0, "losses": 0, "total": 0})
    for r in rows:
        if r.get("row_state") in ("tp", "sl") and r.get("t_entry"):
            dt = datetime.fromtimestamp(r["t_entry"] / 1000, tz=timezone.utc)
            key = f"{dt.strftime('%A')}_{(dt.hour // 4) * 4:02d}h"
            hm[key]["total"] += 1
            if r.get("row_state") == "tp": hm[key]["wins"] += 1
            else: hm[key]["losses"] += 1
    return {k: {**d, "winrate": round((d["wins"] / d["total"]) * 100, 1)} for k, d in hm.items() if d["total"] > 0}

def detect_trading_patterns(rows: List[dict]) -> List[str]:
    if len(rows) < 10: return ["Accumulez plus de trades"]
    patterns = []
    def wr(t):
        c = [x for x in t if x.get("row_state") in ("tp", "sl")]
        return (sum(1 for x in c if x.get("row_state") == "tp") / len(c) * 100) if c else 0
    morn = [r for r in rows if r.get("t_entry") and 6 <= datetime.fromtimestamp(r["t_entry"] / 1000).hour < 12]
    aft = [r for r in rows if r.get("t_entry") and 12 <= datetime.fromtimestamp(r["t_entry"] / 1000).hour < 18]
    mw, aw = wr(morn), wr(aft)
    if mw > 60 and mw > aw: patterns.append(f"✅ Matin ({mw:.0f}%)")
    elif aw > 60: patterns.append(f"✅ Après-midi ({aw:.0f}%)")
    longs = [r for r in rows if r.get("side") == "LONG" and r.get("row_state") in ("tp", "sl")]
    shorts = [r for r in rows if r.get("side") == "SHORT" and r.get("row_state") in ("tp", "sl")]
    if len(longs) >= 5:
        lw = wr(longs)
        if lw >= 65: patterns.append(f"📈 LONGs ({lw:.0f}%)")
    if len(shorts) >= 5:
        sw = wr(shorts)
        if sw >= 65: patterns.append(f"📉 SHORTs ({sw:.0f}%)")
    return patterns if patterns else ["📊 Continuez"]

def calculate_kelly_position(winrate: float, avg_win: float, avg_loss: float) -> Dict[str, Any]:
    if avg_loss == 0 or winrate == 0: return {"kelly_pct": 0, "conservative_pct": 0, "recommendation": "N/A"}
    p, q, b = winrate / 100.0, 1 - (winrate / 100.0), avg_win / avg_loss
    kelly = max(0, min((p * b - q) / b, 0.25))
    cons = kelly * 0.5
    if cons <= 0: rec = "❌ Ne pas trader"
    elif cons < 0.02: rec = "⚠️ Edge faible"
    elif cons < 0.05: rec = "✅ 2-5%"
    else: rec = "🚀 Fort edge"
    return {"kelly_pct": round(kelly * 100, 2), "conservative_pct": round(cons * 100, 2), "recommendation": rec}

def calculate_altseason_metrics(rows: List[dict]) -> Dict[str, Any]:
    btc = [r for r in rows if r.get("symbol") and "BTC" in r["symbol"].upper() and r.get("row_state") in ("tp", "sl")]
    alt = [r for r in rows if r.get("symbol") and "BTC" not in r["symbol"].upper() and r.get("row_state") in ("tp", "sl")]
    if len(btc) < 3 or len(alt) < 5:
        return {"is_altseason": False, "confidence": 0, "btc_wr": 0, "alt_wr": 0, "message": "Pas assez"}
    bw = sum(1 for t in btc if t.get("row_state") == "tp")
    aw = sum(1 for t in alt if t.get("row_state") == "tp")
    bwr = (bw / len(btc)) * 100
    awr = (aw / len(alt)) * 100
    is_alt = awr > bwr and awr > 55
    conf = min(100, int(abs(awr - bwr)))
    return {"is_altseason": is_alt, "confidence": conf, "btc_wr": round(bwr, 1), "alt_wr": round(awr, 1), "message": "🚀 ALTSEASON" if is_alt else "₿ BTC" if bwr > awr else "🔄 Neutre"}

def run_backtest(rows: List[dict], filters: Dict[str, Any]) -> Dict[str, Any]:
    filt = rows
    if filters.get("side"):
        filt = [r for r in filt if r.get("side") == filters["side"]]
    if filters.get("symbol"):
        sym = filters["symbol"].upper().strip()
        filt = [r for r in filt if r.get("symbol") and sym in r["symbol"].upper()]
    if filters.get("tf"):
        tf = filters["tf"].lower().strip()
        filt = [r for r in filt if r.get("tf_label", "").lower() == tf]
    closed = [r for r in filt if r.get("row_state") in ("tp", "sl")]
    if not closed:
        return {"trades": 0, "winrate": 0, "total_return": 0, "avg_win": 0, "avg_loss": 0}
    wins = sum(1 for r in closed if r.get("row_state") == "tp")
    wr = (wins / len(closed)) * 100
    ret = []
    for r in closed:
        if r.get("entry") and r.get("side"):
            try:
                en, ex = float(r["entry"]), (float(r["sl"]) if r.get("sl_hit") and r.get("sl") else (float(r["tp1"]) if r.get("tp1") else None))
                if ex:
                    pl = ((ex - en) / en) * 100
                    if r["side"] == "SHORT": pl = -pl
                    ret.append(pl)
            except: pass
    if not ret:
        return {"trades": len(closed), "winrate": round(wr, 1), "wins": wins, "losses": len(closed)-wins, "total_return": 0, "avg_win": 0, "avg_loss": 0}
    wret = [r for r in ret if r > 0]
    lret = [r for r in ret if r < 0]
    return {"trades": len(closed), "winrate": round(wr, 1), "wins": wins, "losses": len(closed) - wins, "total_return": round(sum(ret), 2), "avg_win": round(sum(wret) / len(wret), 2) if wret else 0, "avg_loss": round(abs(sum(lret) / len(lret)), 2) if lret else 0, "best_trade": round(max(ret), 2) if ret else 0, "worst_trade": round(min(ret), 2) if ret else 0, "filters": filters}

def check_circuit_breaker() -> Dict[str, Any]:
    active = db_query("SELECT * FROM circuit_breaker WHERE active=1 AND cooldown_until > ? ORDER BY triggered_at DESC LIMIT 1", (int(time.time()),))
    if active:
        b = active[0]
        return {"active": True, "reason": b["reason"], "hours_remaining": round((b["cooldown_until"] - int(time.time())) / 3600, 1)}
    return {"active": False}

def trigger_circuit_breaker(reason: str):
    cooldown = int(time.time()) + (24 * 3600)
    db_execute("INSERT INTO circuit_breaker (triggered_at, reason, cooldown_until, active) VALUES (?, ?, ?, 1)", (int(time.time()), reason, cooldown))

def save_event(payload: WebhookPayload) -> str:
    trade_id = payload.trade_id or f"{payload.symbol}_{payload.tf}_{payload.time or now_ms()}"
    db_execute("""INSERT INTO events(type, symbol, tf, tf_label, time, side, entry, sl, tp1, tp2, tp3, confidence, leverage, note, price, trade_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", (payload.type, payload.symbol, str(payload.tf) if payload.tf else None, payload.tf_label or tf_to_label(payload.tf), int(payload.time or now_ms()), payload.side, payload.entry, payload.sl, payload.tp1, payload.tp2, payload.tp3, payload.confidence, payload.leverage, payload.note, payload.price, trade_id))
    return trade_id

async def send_telegram(text: str):
    if not settings.TELEGRAM_ENABLED: return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage", json={"chat_id": settings.TELEGRAM_CHAT_ID, "text": text, "parse_mode": "HTML"})
    except: pass

app = FastAPI(title="AI Trader Pro v3.0", version="3.0")

if RATE_LIMIT_ENABLED:
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    def rate_limit(s): return lambda f: limiter.limit(s)(f)
else:
    def rate_limit(s): return lambda f: f

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

CSS = """<style>
body{margin:0;font-family:system-ui;background:#050a12;color:#e2e8f0}
.container{max-width:1200px;margin:0 auto;padding:40px 20px}
.header{margin-bottom:40px}
.header h1{font-size:36px;font-weight:900;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}
.nav{display:flex;gap:16px;margin-bottom:32px;flex-wrap:wrap}
.nav a{padding:12px 24px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:12px;color:#6366f1;text-decoration:none;font-weight:600;transition:all 0.3s}
.card{background:rgba(20,30,48,0.6);border:1px solid rgba(99,102,241,0.12);border-radius:20px;padding:32px;margin-bottom:24px}
.card h2{font-size:24px;font-weight:800;margin-bottom:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-bottom:24px}
.metric{background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1));border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:20px}
.metric-label{font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;margin-bottom:8px}
.metric-value{font-size:32px;font-weight:900;color:#6366f1}
.badge{display:inline-block;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700}
.badge-green{background:rgba(16,185,129,0.15);color:#10b981}
.badge-red{background:rgba(239,68,68,0.15);color:#ef4444}
.badge-yellow{background:rgba(251,191,36,0.15);color:#fbbf24}
.gauge{width:200px;height:200px;border-radius:50%;background:conic-gradient(from 180deg,#ef4444,#f97316 25%,#fbbf24 45%,#10b981 55%,#22c55e);position:relative;display:flex;align-items:center;justify-content:center;margin:0 auto}
.gauge-inner{width:160px;height:160px;border-radius:50%;background:#0a0f1a;display:flex;flex-direction:column;align-items:center;justify-content:center}
.gauge-value{font-size:48px;font-weight:900}
.gauge-label{font-size:12px;color:#64748b;margin-top:4px}
.phase-indicator{display:flex;align-items:center;gap:16px;padding:20px;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1));border-radius:16px;margin-bottom:12px;position:relative}
.phase-indicator::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px}
.phase-indicator.active::before{background:currentColor}
.phase-number{width:48px;height:48px;border-radius:50%;background:rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900}
.phase-indicator.active .phase-number{background:currentColor;color:#0a0f1a}
.list{list-style:none;padding:0}
.list li{padding:12px;border-bottom:1px solid rgba(99,102,241,0.1)}
</style>"""

NAV = """<div class="nav">
<a href="/trades">📊 Dashboard</a>
<a href="/ai-insights">🤖 AI</a>
<a href="/equity-curve">📈 Equity</a>
<a href="/heatmap">🔥 Heatmap</a>
<a href="/advanced-metrics">📊 Metrics</a>
<a href="/patterns">🔍 Patterns</a>
<a href="/journal">📝 Journal</a>
<a href="/backtest">⏮️ Backtest</a>
<a href="/strategie">⚙️ Stratégie</a>
<a href="/altseason">🚀 Altseason</a>
</div>"""

@app.get("/")
async def root():
    return HTMLResponse("""<!DOCTYPE html><html><head><title>AI Trader</title></head>
    <body style="font-family:system-ui;padding:40px;background:#0a0f1a;color:#e6edf3">
    <h1 style="color:#6366f1">🚀 AI Trader Pro v3.0</h1>
    <p><a href="/trades" style="color:#8b5cf6">📊 Dashboard</a></p></body></html>""")

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "3.0.0"}

@app.get("/api/fear-greed")
async def get_fear_greed():
    return {"ok": True, "fear_greed": await fetch_fear_greed_index()}

@app.get("/api/bullrun-phase")
async def get_bullrun_phase():
    return {"ok": True, "bullrun_phase": detect_bullrun_phase(build_trade_rows(100))}

@app.get("/api/trades")
async def get_trades(limit: int = 50):
    return {"ok": True, "trades": build_trade_rows(limit)}

@app.get("/api/equity-curve")
async def get_equity():
    return {"ok": True, "equity_curve": calculate_equity_curve(build_trade_rows(1000))}

@app.get("/api/heatmap")
async def get_heatmap():
    return {"ok": True, "heatmap": calculate_performance_heatmap(build_trade_rows(1000))}

@app.get("/api/advanced-metrics")
async def get_metrics():
    rows = build_trade_rows(1000)
    m = calculate_advanced_metrics(rows)
    closed = [r for r in rows if r.get("row_state") in ("tp", "sl")]
    wr = (sum(1 for r in closed if r.get("row_state")=="tp") / len(closed) * 100) if closed else 0
    ret = []
    for r in closed:
        if r.get("entry") and r.get("side"):
            try:
                en, ex = float(r["entry"]), (float(r["sl"]) if r.get("sl_hit") and r.get("sl") else (float(r["tp1"]) if r.get("tp1") else None))
                if ex:
                    pl = ((ex - en) / en) * 100
                    if r["side"] == "SHORT": pl = -pl
                    ret.append(pl)
            except: pass
    aw = sum(r for r in ret if r > 0) / max(1, len([r for r in ret if r > 0]))
    al = abs(sum(r for r in ret if r < 0) / max(1, len([r for r in ret if r < 0])))
    return {"ok": True, "metrics": m, "kelly": calculate_kelly_position(wr, aw, al)}

@app.get("/api/patterns")
async def get_patterns():
    return {"ok": True, "patterns": detect_trading_patterns(build_trade_rows(200))}

@app.get("/api/altseason")
async def get_altseason():
    return {"ok": True, "altseason": calculate_altseason_metrics(build_trade_rows(100))}

@app.post("/api/backtest")
async def post_backtest(filters: Dict[str, Any]):
    return {"ok": True, "backtest": run_backtest(build_trade_rows(1000), filters)}

@app.post("/api/journal")
async def add_journal(note: JournalNote):
    db_execute("INSERT INTO trade_notes (trade_id, note, emotion, tags) VALUES (?, ?, ?, ?)", (note.trade_id, note.note, note.emotion, note.tags))
    return {"ok": True}

@app.get("/api/journal")
async def get_journals(limit: int = 50):
    return {"ok": True, "notes": db_query("SELECT * FROM trade_notes ORDER BY created_at DESC LIMIT ?", (limit,))}

@app.post("/tv-webhook")
@rate_limit("100/minute")
async def webhook(request: Request):
    try: data = await request.json()
    except: raise HTTPException(400)
    if data.get("secret") != settings.WEBHOOK_SECRET: raise HTTPException(403)
    try: payload = WebhookPayload(**data)
    except Exception as e: raise HTTPException(422, str(e))
    if payload.type == "ENTRY" and settings.CIRCUIT_BREAKER_ENABLED:
        breaker = check_circuit_breaker()
        if breaker["active"]:
            await send_telegram(f"⛔ Bloqué: {breaker['reason']}")
            return {"ok": False, "reason": "circuit_breaker"}
        recent = build_trade_rows(10)
        cons = 0
        for t in reversed([r for r in recent if r.get("row_state") in ("tp", "sl")]):
            if t.get("row_state") == "sl": cons += 1
            else: break
        if cons >= settings.MAX_CONSECUTIVE_LOSSES:
            trigger_circuit_breaker(f"{cons} pertes")
            await send_telegram(f"🚨 BREAKER: {cons} pertes")
            return {"ok": False, "reason": "consecutive_losses"}
    return {"ok": True, "trade_id": save_event(payload)}

@app.get("/trades", response_class=HTMLResponse)
async def trades_page():
    rows = build_trade_rows(50)
    
    # Calculs pour les différentes sections
    patterns = detect_trading_patterns(rows)
    metrics = calculate_advanced_metrics(rows)
    closed = [r for r in rows if r.get("row_state") in ("tp", "sl")]
    wr = (sum(1 for r in closed if r.get("row_state")=="tp") / len(closed) * 100) if closed else 0
    
    # Table des trades
    table = ""
    for r in rows[:20]:
        badge = f'<span class="badge badge-green">TP</span>' if r.get("row_state")=="tp" else (f'<span class="badge badge-red">SL</span>' if r.get("row_state")=="sl" else f'<span class="badge badge-yellow">En cours</span>')
        table += f"""<tr style="border-bottom:1px solid rgba(99,102,241,0.1)"><td style="padding:12px">{r.get('symbol','N/A')}</td><td style="padding:12px">{r.get('tf_label','N/A')}</td><td style="padding:12px">{r.get('side','N/A')}</td><td style="padding:12px">{r.get('entry') or 'N/A'}</td><td style="padding:12px">{badge}</td></tr>"""
    
    # Patterns HTML
    patterns_html = "".join(f'<li style="padding:8px;font-size:14px">{p}</li>' for p in patterns[:5])
    
    # Equity curve data
    curve = calculate_equity_curve(rows)
    curr_equity = curve[-1]["equity"] if curve else settings.INITIAL_CAPITAL
    total_return = ((curr_equity - settings.INITIAL_CAPITAL) / settings.INITIAL_CAPITAL) * 100
    
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Dashboard</title>{CSS}</head><body><div class="container"><div class="header"><h1>📊 Dashboard Principal</h1><p>Vue complète de vos trades</p></div>{NAV}
    
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
        <div class="card"><h2>😱 Fear & Greed Index</h2><div id="fg" style="text-align:center;padding:40px">⏳</div></div>
        <div class="card"><h2>🚀 Bull Run Phase</h2><div id="br" style="text-align:center;padding:40px">⏳</div></div>
        <div class="card"><h2>🤖 AI Patterns</h2><ul class="list" style="margin:0">{patterns_html if patterns_html else '<li style="padding:8px;color:#64748b">Pas de patterns</li>'}</ul><a href="/patterns" style="display:block;margin-top:12px;color:#6366f1;text-decoration:none;font-size:14px">→ Voir tous les patterns</a></div>
    </div>
    
    <div class="card" id="phases" style="display:none"><h2>📈 Phases du Bull Run</h2>
        <div id="p1" class="phase-indicator" style="color:#f7931a"><div class="phase-number">₿</div><div style="flex:1"><div style="font-weight:700">Phase 1: Bitcoin Season</div><div style="font-size:12px;color:#64748b" id="p1s">--</div></div></div>
        <div id="p2" class="phase-indicator" style="color:#627eea"><div class="phase-number">💎</div><div style="flex:1"><div style="font-weight:700">Phase 2: ETH & Large-Cap</div><div style="font-size:12px;color:#64748b" id="p2s">--</div></div></div>
        <div id="p3" class="phase-indicator" style="color:#10b981"><div class="phase-number">🚀</div><div style="flex:1"><div style="font-weight:700">Phase 3: Altcoin Season</div><div style="font-size:12px;color:#64748b" id="p3s">--</div></div></div>
    </div>
    
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">
        <div class="metric"><div class="metric-label">Total Trades</div><div class="metric-value">{len(rows)}</div></div>
        <div class="metric"><div class="metric-label">Trades Actifs</div><div class="metric-value">{sum(1 for r in rows if r.get('row_state')=='normal')}</div></div>
        <div class="metric"><div class="metric-label">Win Rate</div><div class="metric-value">{int(wr)}%</div></div>
        <div class="metric"><div class="metric-label">Sharpe Ratio</div><div class="metric-value">{metrics['sharpe_ratio']}</div><p style="font-size:11px;color:#64748b;margin-top:4px"><a href="/advanced-metrics" style="color:#6366f1;text-decoration:none">→ Metrics</a></p></div>
        <div class="metric"><div class="metric-label">Capital Actuel</div><div class="metric-value" style="font-size:24px">${curr_equity:.0f}</div><p style="font-size:11px;color:#64748b;margin-top:4px"><a href="/equity-curve" style="color:#6366f1;text-decoration:none">→ Equity</a></p></div>
        <div class="metric"><div class="metric-label">Return Total</div><div class="metric-value" style="color:{'#10b981' if total_return>=0 else '#ef4444'};font-size:24px">{total_return:+.1f}%</div></div>
    </div>
    
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
        <div class="card">
            <h2>📈 Performance</h2>
            <div style="display:flex;justify-content:space-between;padding:12px;border-bottom:1px solid rgba(99,102,241,0.1)">
                <span>Expectancy</span><span style="font-weight:700;color:#6366f1">{metrics['expectancy']:.2f}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:12px;border-bottom:1px solid rgba(99,102,241,0.1)">
                <span>Sortino Ratio</span><span style="font-weight:700;color:#6366f1">{metrics['sortino_ratio']}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:12px">
                <span>Max Drawdown</span><span style="font-weight:700;color:#ef4444">-{metrics['max_drawdown']:.1f}%</span>
            </div>
            <a href="/advanced-metrics" style="display:block;margin-top:12px;color:#6366f1;text-decoration:none;font-size:14px">→ Voir toutes les métriques</a>
        </div>
        
        <div class="card">
            <h2>🔥 Best Time to Trade</h2>
            <div id="heatmap-preview">⏳ Chargement...</div>
            <a href="/heatmap" style="display:block;margin-top:12px;color:#6366f1;text-decoration:none;font-size:14px">→ Voir la heatmap complète</a>
        </div>
        
        <div class="card">
            <h2>📝 Quick Actions</h2>
            <div style="display:flex;flex-direction:column;gap:12px">
                <a href="/backtest" style="padding:12px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:8px;color:#6366f1;text-decoration:none;font-weight:600;text-align:center">⏮️ Lancer un Backtest</a>
                <a href="/journal" style="padding:12px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:8px;color:#6366f1;text-decoration:none;font-weight:600;text-align:center">📝 Ouvrir le Journal</a>
                <a href="/strategie" style="padding:12px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:8px;color:#6366f1;text-decoration:none;font-weight:600;text-align:center">⚙️ Voir la Stratégie</a>
            </div>
        </div>
    </div>
    
    <div class="card"><h2>📊 Derniers Trades</h2>
    <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:2px solid rgba(99,102,241,0.2)">
            <th style="padding:12px;text-align:left;color:#64748b">Symbol</th>
            <th style="padding:12px;text-align:left;color:#64748b">TF</th>
            <th style="padding:12px;text-align:left;color:#64748b">Side</th>
            <th style="padding:12px;text-align:left;color:#64748b">Entry</th>
            <th style="padding:12px;text-align:left;color:#64748b">Status</th>
        </tr></thead><tbody>{table}</tbody>
    </table></div>
    
    <script>
    // Fear & Greed
    fetch('/api/fear-greed').then(r=>r.json()).then(d=>{{if(d.ok){{const f=d.fear_greed;
    document.getElementById('fg').innerHTML=`<div class="gauge"><div class="gauge-inner">
    <div class="gauge-value" style="color:${{f.color}}">${{f.value}}</div>
    <div class="gauge-label">/ 100</div></div></div>
    <div style="text-align:center;margin-top:24px;font-size:20px;font-weight:900;color:${{f.color}}">${{f.emoji}} ${{f.sentiment}}</div>
    <p style="color:#64748b;font-size:12px;text-align:center;margin-top:8px">${{f.recommendation}}</p>`;}}}}).catch(e=>{{document.getElementById('fg').innerHTML='<p style="color:#ef4444">Erreur</p>';}});
    
    // Bull Run Phase
    fetch('/api/bullrun-phase').then(r=>r.json()).then(d=>{{if(d.ok){{const b=d.bullrun_phase;
    document.getElementById('br').innerHTML=`<div style="font-size:56px;margin-bottom:8px">${{b.emoji}}</div>
    <div style="font-size:20px;font-weight:900;color:${{b.color}}">${{b.phase_name}}</div>
    <p style="color:#64748b;font-size:12px;margin-top:8px">${{b.description}}</p>
    <span class="badge" style="background:rgba(99,102,241,0.15);color:#6366f1;margin-top:8px">Conf: ${{b.confidence}}%</span>`;
    document.getElementById('phases').style.display='block';
    ['p1','p2','p3'].forEach((id,i)=>{{const el=document.getElementById(id);
    if(i+1===b.phase)el.classList.add('active');else el.classList.remove('active');}});
    const det=b.details;
    document.getElementById('p1s').textContent=`WR: ${{det.btc.winrate}}% | ${{det.btc.trades}} trades`;
    document.getElementById('p2s').textContent=`ETH: ${{det.eth.winrate}}% | LC: ${{det.large_cap.winrate}}%`;
    document.getElementById('p3s').textContent=`WR: ${{det.small_alts.winrate}}% | ${{det.small_alts.trades}} trades`;}}}}).catch(e=>{{document.getElementById('br').innerHTML='<p style="color:#ef4444">Erreur</p>';}});
    
    // Heatmap preview
    fetch('/api/heatmap').then(r=>r.json()).then(d=>{{if(d.ok){{
    const hm=d.heatmap;
    const best=Object.entries(hm).sort((a,b)=>b[1].winrate-a[1].winrate).slice(0,3);
    let html='<div style="font-size:14px">';
    best.forEach(([k,v])=>{{
    const [day,hour]=k.split('_');
    html+=`<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid rgba(99,102,241,0.1)">
    <span>${{day.slice(0,3)}} ${{hour}}</span>
    <span style="font-weight:700;color:#10b981">${{v.winrate}}%</span></div>`;
    }});
    html+='</div>';
    document.getElementById('heatmap-preview').innerHTML=html;}}}}).catch(e=>{{document.getElementById('heatmap-preview').innerHTML='<p style="color:#64748b;font-size:14px">Pas assez de données</p>';}});
    </script>
    </div></body></html>""")

@app.get("/ai-insights", response_class=HTMLResponse)
async def ai_page():
    patterns = detect_trading_patterns(build_trade_rows(200))
    p_html = "".join(f'<li>{p}</li>' for p in patterns)
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>AI</title>{CSS}</head><body><div class="container"><div class="header"><h1>🤖 AI Insights</h1></div>{NAV}<div class="card"><h2>Patterns</h2><ul class="list">{p_html}</ul></div></div></body></html>""")

@app.get("/equity-curve", response_class=HTMLResponse)
async def equity_page():
    rows = build_trade_rows(1000)
    curve = calculate_equity_curve(rows)
    curr = curve[-1]["equity"] if curve else settings.INITIAL_CAPITAL
    ret = ((curr - settings.INITIAL_CAPITAL) / settings.INITIAL_CAPITAL) * 100
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Equity</title>{CSS}<script src="https://cdn.jsdelivr.net/npm/chart.js"></script></head><body><div class="container"><div class="header"><h1>📈 Equity</h1></div>{NAV}<div class="grid"><div class="metric"><div class="metric-label">Initial</div><div class="metric-value">${settings.INITIAL_CAPITAL:.0f}</div></div><div class="metric"><div class="metric-label">Actuel</div><div class="metric-value">${curr:.0f}</div></div><div class="metric"><div class="metric-label">Return</div><div class="metric-value" style="color:{'#10b981' if ret>=0 else '#ef4444'}">{ret:+.1f}%</div></div></div><div class="card" style="min-height:400px"><canvas id="c"></canvas></div><script>new Chart(document.getElementById('c'),{{type:'line',data:{{datasets:[{{label:'Equity',data:{json.dumps([{"x":i,"y":p["equity"]} for i,p in enumerate(curve)])},borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,0.1)',tension:0.4,fill:true}}]}},options:{{responsive:true,maintainAspectRatio:false,scales:{{x:{{type:'linear'}}}}}}}});</script></div></body></html>""")

@app.get("/heatmap", response_class=HTMLResponse)
async def heatmap_page():
    hm = calculate_performance_heatmap(build_trade_rows(1000))
    days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    hours = ["00h","04h","08h","12h","16h","20h"]
    table = "<table style='width:100%;border-collapse:collapse'><thead><tr><th style='padding:8px;border:1px solid rgba(99,102,241,0.2)'></th>"
    for d in days: table += f"<th style='padding:8px;border:1px solid rgba(99,102,241,0.2);font-size:12px'>{d[:3]}</th>"
    table += "</tr></thead><tbody>"
    for h in hours:
        table += f"<tr><td style='padding:8px;border:1px solid rgba(99,102,241,0.2);font-weight:600'>{h}</td>"
        for d in days:
            data = hm.get(f"{d}_{h}", {"total": 0, "winrate": 0})
            if data["total"] == 0: col, txt = "#1e293b", "-"
            elif data["winrate"] >= 65: col, txt = "rgba(16,185,129,0.3)", f"{data['winrate']:.0f}%"
            elif data["winrate"] >= 50: col, txt = "rgba(251,191,36,0.3)", f"{data['winrate']:.0f}%"
            else: col, txt = "rgba(239,68,68,0.3)", f"{data['winrate']:.0f}%"
            table += f"<td style='padding:12px;border:1px solid rgba(99,102,241,0.2);background:{col};text-align:center;font-weight:700'>{txt}</td>"
        table += "</tr>"
    table += "</tbody></table>"
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Heatmap</title>{CSS}</head><body><div class="container"><div class="header"><h1>🔥 Heatmap</h1></div>{NAV}<div class="card"><h2>Performance</h2>{table}</div></div></body></html>""")

@app.get("/advanced-metrics", response_class=HTMLResponse)
async def metrics_page():
    rows = build_trade_rows(1000)
    m = calculate_advanced_metrics(rows)
    closed = [r for r in rows if r.get("row_state") in ("tp", "sl")]
    wr = (sum(1 for r in closed if r.get("row_state")=="tp") / len(closed) * 100) if closed else 0
    ret = []
    for r in closed:
        if r.get("entry") and r.get("side"):
            try:
                en, ex = float(r["entry"]), (float(r["sl"]) if r.get("sl_hit") and r.get("sl") else (float(r["tp1"]) if r.get("tp1") else None))
                if ex:
                    pl = ((ex - en) / en) * 100
                    if r["side"] == "SHORT": pl = -pl
                    ret.append(pl)
            except: pass
    aw = sum(r for r in ret if r > 0) / max(1, len([r for r in ret if r > 0]))
    al = abs(sum(r for r in ret if r < 0) / max(1, len([r for r in ret if r < 0])))
    kelly = calculate_kelly_position(wr, aw, al)
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Metrics</title>{CSS}</head><body><div class="container"><div class="header"><h1>📊 Metrics</h1></div>{NAV}<div class="grid"><div class="metric"><div class="metric-label">Sharpe</div><div class="metric-value">{m['sharpe_ratio']}</div></div><div class="metric"><div class="metric-label">Sortino</div><div class="metric-value">{m['sortino_ratio']}</div></div><div class="metric"><div class="metric-label">Calmar</div><div class="metric-value">{m['calmar_ratio']}</div></div><div class="metric"><div class="metric-label">Expectancy</div><div class="metric-value">{m['expectancy']:.2f}%</div></div></div><div class="card"><h2>Kelly</h2><div class="grid"><div class="metric"><div class="metric-label">Kelly %</div><div class="metric-value">{kelly['kelly_pct']:.1f}%</div></div><div class="metric"><div class="metric-label">Conservateur</div><div class="metric-value">{kelly['conservative_pct']:.1f}%</div></div></div><p style="padding:16px;background:rgba(99,102,241,0.1);border-radius:12px;margin-top:20px">{kelly['recommendation']}</p></div></div></body></html>""")

@app.get("/patterns", response_class=HTMLResponse)
async def patterns_page():
    patterns = detect_trading_patterns(build_trade_rows(200))
    p_html = "".join(f'<li>{p}</li>' for p in patterns)
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Patterns</title>{CSS}</head><body><div class="container"><div class="header"><h1>🔍 Patterns</h1></div>{NAV}<div class="card"><h2>Détectés</h2><ul class="list">{p_html}</ul></div></div></body></html>""")

@app.get("/journal", response_class=HTMLResponse)
async def journal_page():
    rows = build_trade_rows(50)
    table = ""
    for r in rows[:20]:
        notes = db_query("SELECT note, emotion FROM trade_notes WHERE trade_id=? ORDER BY created_at DESC LIMIT 1", (r["trade_id"],))
        note = notes[0]["note"][:50] if notes and notes[0].get("note") else "Pas de note"
        emo = notes[0]["emotion"] if notes and notes[0].get("emotion") else "-"
        badge = f'<span class="badge badge-green">TP</span>' if r.get("row_state")=="tp" else f'<span class="badge badge-red">SL</span>' if r.get("row_state")=="sl" else f'<span class="badge badge-yellow">En cours</span>'
        table += f"""<tr style="border-bottom:1px solid rgba(99,102,241,0.1)"><td style="padding:12px">{r.get('symbol','N/A')}</td><td style="padding:12px">{badge}</td><td style="padding:12px">{emo}</td><td style="padding:12px">{note}</td></tr>"""
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Journal</title>{CSS}</head><body><div class="container"><div class="header"><h1>📝 Journal</h1></div>{NAV}<div class="card"><h2>Trades</h2><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:2px solid rgba(99,102,241,0.2)"><th style="padding:12px;text-align:left;color:#64748b">Symbol</th><th style="padding:12px;text-align:left;color:#64748b">Résultat</th><th style="padding:12px;text-align:left;color:#64748b">Émotion</th><th style="padding:12px;text-align:left;color:#64748b">Note</th></tr></thead><tbody>{table}</tbody></table></div></div></body></html>""")

@app.get("/altseason", response_class=HTMLResponse)
async def altseason_page():
    rows = build_trade_rows(100)
    alt = calculate_altseason_metrics(rows)
    coin_stats = {}
    for r in rows:
        if r.get("row_state") in ("tp", "sl") and r.get("symbol"):
            sym = r["symbol"]
            if sym not in coin_stats: coin_stats[sym] = {"wins": 0, "total": 0}
            coin_stats[sym]["total"] += 1
            if r.get("row_state") == "tp": coin_stats[sym]["wins"] += 1
    top = sorted([(s, (d["wins"]/d["total"]*100) if d["total"]>0 else 0, d["total"]) for s,d in coin_stats.items() if d["total"]>=3], key=lambda x: x[1], reverse=True)[:10]
    top_html = ""
    for sym, wr, tot in top:
        is_btc = "BTC" in sym.upper()
        col = "#f7931a" if is_btc else "#6366f1"
        icon = "₿" if is_btc else "🪙"
        top_html += f"""<div style="display:flex;justify-content:space-between;padding:12px;border-bottom:1px solid rgba(99,102,241,0.1)"><span style="color:{col}">{icon} {sym}</span><span style="font-weight:700">{wr:.1f}% ({tot})</span></div>"""
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Altseason</title>{CSS}</head><body><div class="container"><div class="header"><h1>🚀 Altseason</h1></div>{NAV}<div class="card"><h2>📊 Statut</h2><div style="text-align:center;padding:40px;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1));border-radius:20px;margin-bottom:24px"><div style="font-size:48px;margin-bottom:16px">{'🚀' if alt['is_altseason'] else '₿'}</div><div style="font-size:32px;font-weight:900;margin-bottom:8px">{alt['message']}</div><div style="color:#64748b">Conf: {alt['confidence']}%</div></div><div class="grid"><div class="metric"><div class="metric-label">₿ BTC</div><div class="metric-value">{alt['btc_wr']}%</div></div><div class="metric"><div class="metric-label">🪙 Alts</div><div class="metric-value">{alt['alt_wr']}%</div></div></div></div><div class="card"><h2>🏆 Top</h2>{top_html if top_html else '<p style="color:#64748b">Pas assez</p>'}</div></div></body></html>""")

@app.get("/backtest", response_class=HTMLResponse)
async def backtest_page():
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Backtest</title>{CSS}</head><body><div class="container"><div class="header"><h1>⏮️ Backtest</h1></div>{NAV}<div class="card"><h2>Config</h2><form id="form"><label>Side</label><select name="side" style="width:100%;padding:12px;background:rgba(20,30,48,0.8);border:1px solid rgba(99,102,241,0.3);border-radius:8px;color:#e2e8f0;margin-bottom:16px"><option value="">Tous</option><option value="LONG">LONG</option><option value="SHORT">SHORT</option></select><label>Symbole</label><input type="text" name="symbol" placeholder="XRP, BTC..." style="width:100%;padding:12px;background:rgba(20,30,48,0.8);border:1px solid rgba(99,102,241,0.3);border-radius:8px;color:#e2e8f0;margin-bottom:16px"><label>TF</label><input type="text" name="tf" placeholder="15m, 1h..." style="width:100%;padding:12px;background:rgba(20,30,48,0.8);border:1px solid rgba(99,102,241,0.3);border-radius:8px;color:#e2e8f0;margin-bottom:16px"><button type="submit" style="width:100%;padding:12px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;border-radius:8px;color:white;font-weight:700;cursor:pointer">🚀 Lancer</button></form></div><div id="res" class="card" style="display:none"><h2>Résultats</h2><div id="content"></div></div><script>document.getElementById('form').addEventListener('submit', async (e) => {{e.preventDefault();const data = {{}};new FormData(e.target).forEach((v, k) => {{ if(v) data[k] = v; }});document.getElementById('res').style.display = 'block';document.getElementById('content').innerHTML = '<p style="color:#64748b">⏳</p>';const r = await fetch('/api/backtest', {{method: 'POST',headers: {{'Content-Type': 'application/json'}},body: JSON.stringify(data)}});const d = await r.json();if (d.ok && d.backtest.trades > 0) {{const b = d.backtest;document.getElementById('content').innerHTML = `<div class="grid"><div class="metric"><div class="metric-label">Trades</div><div class="metric-value">${{b.trades}}</div></div><div class="metric"><div class="metric-label">Wins / Losses</div><div class="metric-value">${{b.wins}} / ${{b.losses}}</div></div><div class="metric"><div class="metric-label">WR</div><div class="metric-value">${{b.winrate}}%</div></div><div class="metric"><div class="metric-label">Return</div><div class="metric-value" style="color:${{b.total_return>=0?'#10b981':'#ef4444'}}">${{b.total_return>=0?'+':''}}${{b.total_return}}%</div></div><div class="metric"><div class="metric-label">Avg Win</div><div class="metric-value" style="color:#10b981">+${{b.avg_win}}%</div></div><div class="metric"><div class="metric-label">Avg Loss</div><div class="metric-value" style="color:#ef4444">-${{b.avg_loss}}%</div></div></div><p style="margin-top:20px;padding:16px;background:rgba(99,102,241,0.1);border-radius:12px">💡 Filtres: ${{JSON.stringify(b.filters)}}</p>`;}} else {{document.getElementById('content').innerHTML = '<p style="color:#ef4444">❌ Aucun trade</p>';}}}});</script></div></body></html>""")

@app.get("/strategie", response_class=HTMLResponse)
async def strategie_page():
    breaker = check_circuit_breaker()
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Stratégie</title>{CSS}</head><body><div class="container"><div class="header"><h1>⚙️ Stratégie</h1></div>{NAV}<div class="card"><h2>🛡️ Circuit Breaker</h2>{'<div style="padding:20px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;margin-top:16px"><h3 style="color:#ef4444;margin:0 0 8px 0">🚨 ACTIF</h3><p style="margin:0">'+breaker['reason']+'</p><p style="margin:8px 0 0 0;color:#64748b">Restant: '+str(breaker['hours_remaining'])+'h</p></div>' if breaker['active'] else '<p style="padding:16px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:12px;color:#10b981">✅ Autorisé</p>'}<div style="margin-top:24px"><h3>Paramètres</h3><ul style="list-style:none;padding:0"><li style="padding:12px;border-bottom:1px solid rgba(99,102,241,0.1)"><strong>Pertes max:</strong> {settings.MAX_CONSECUTIVE_LOSSES}</li><li style="padding:12px;border-bottom:1px solid rgba(99,102,241,0.1)"><strong>Breaker:</strong> {'✅ On' if settings.CIRCUIT_BREAKER_ENABLED else '❌ Off'}</li><li style="padding:12px"><strong>Capital:</strong> ${settings.INITIAL_CAPITAL}</li></ul></div></div><div class="card"><h2>📋 Règles</h2><ul style="list-style:none;padding:0"><li style="padding:12px;border-bottom:1px solid rgba(99,102,241,0.1)">✅ Position: 2% max</li><li style="padding:12px;border-bottom:1px solid rgba(99,102,241,0.1)">✅ Stop après {settings.MAX_CONSECUTIVE_LOSSES} pertes</li><li style="padding:12px;border-bottom:1px solid rgba(99,102,241,0.1)">✅ Cooldown 24h</li><li style="padding:12px">✅ Telegram: {'✅' if settings.TELEGRAM_ENABLED else '❌'}</li></ul></div></div></body></html>""")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    logger.info("🚀 Starting...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
