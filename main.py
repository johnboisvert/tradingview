# main.py - AI Trader Pro v3.0 ULTIMATE - Version ULTRA COMPLÈTE
# Python 3.8+

import os
import sqlite3
import logging
import asyncio
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
logger.info("🚀 AI Trader Pro v3.0 ULTIMATE Edition")

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

def now_ms(): 
    return int(datetime.now(timezone.utc).timestamp() * 1000)

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
        
        tp1_hit = bool(hit_map.get("TP1_HIT"))
        sl_hit = bool(hit_map.get("SL_HIT"))
        
        rows.append({
            "trade_id": e["trade_id"], "symbol": e["symbol"], "tf": e.get("tf"),
            "tf_label": e.get("tf_label") or tf_to_label(e.get("tf")),
            "side": e["side"], "entry": e["entry"], "tp1": e["tp1"], "sl": e["sl"],
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
                elif value <= 45: sentiment, emoji, color, rec = "Fear", "😰", "#f97316", "Bon moment pour accumuler"
                elif value <= 55: sentiment, emoji, color, rec = "Neutral", "😐", "#64748b", "Marché équilibré"
                elif value <= 75: sentiment, emoji, color, rec = "Greed", "😊", "#10b981", "Soyez vigilant"
                else: sentiment, emoji, color, rec = "Extreme Greed", "🤑", "#22c55e", "Prenez des profits"
                
                return {"value": value, "sentiment": sentiment, "emoji": emoji, "color": color, "recommendation": rec}
    except: pass
    return {"value": 50, "sentiment": "Unknown", "emoji": "❓", "color": "#64748b", "recommendation": "Données non disponibles"}

def detect_bullrun_phase(rows: List[dict]) -> Dict[str, Any]:
    if len(rows) < 20:
        return {
            "phase": 0, "phase_name": "Accumulation", "emoji": "🐻", "color": "#64748b",
            "description": "Pas assez de données", "confidence": 0,
            "details": {"btc": {"winrate": 0, "avg_return": 0, "trades": 0},
                       "eth": {"winrate": 0, "avg_return": 0, "trades": 0},
                       "large_cap": {"winrate": 0, "avg_return": 0, "trades": 0},
                       "small_alts": {"winrate": 0, "avg_return": 0, "trades": 0}}
        }
    
    def calc_perf(trades):
        if not trades: return 0, 0
        wins = sum(1 for t in trades if t["row_state"] == "tp")
        wr = (wins / len(trades)) * 100
        returns = []
        for r in trades:
            if r.get("entry"):
                try:
                    entry = float(r["entry"])
                    exit_p = float(r["sl"]) if r.get("sl_hit") else float(r["tp1"]) if r.get("tp1") else None
                    if exit_p:
                        pl = ((exit_p - entry) / entry) * 100
                        if r.get("side") == "SHORT": pl = -pl
                        returns.append(pl)
                except: pass
        return wr, (sum(returns) / len(returns) if returns else 0)
    
    btc = [r for r in rows if "BTC" in r.get("symbol", "").upper() and r["row_state"] in ("tp", "sl")]
    eth = [r for r in rows if "ETH" in r.get("symbol", "").upper() and "BTC" not in r.get("symbol", "").upper() and r["row_state"] in ("tp", "sl")]
    lc_syms = ["SOL", "BNB", "ADA", "AVAX", "DOT", "MATIC", "LINK"]
    lc = [r for r in rows if any(s in r.get("symbol", "").upper() for s in lc_syms) and r["row_state"] in ("tp", "sl")]
    alt = [r for r in rows if r["row_state"] in ("tp", "sl") and "BTC" not in r.get("symbol", "").upper() and "ETH" not in r.get("symbol", "").upper() and not any(s in r.get("symbol", "").upper() for s in lc_syms)]
    
    btc_wr, btc_avg = calc_perf(btc)
    eth_wr, eth_avg = calc_perf(eth)
    lc_wr, lc_avg = calc_perf(lc)
    alt_wr, alt_avg = calc_perf(alt)
    
    btc_sc = (btc_wr * 0.6 + (btc_avg + 10) * 4) if btc else 0
    eth_sc = (eth_wr * 0.6 + (eth_avg + 10) * 4) if eth else 0
    lc_sc = (lc_wr * 0.6 + (lc_avg + 10) * 4) if lc else 0
    alt_sc = (alt_wr * 0.6 + (alt_avg + 10) * 4) if alt else 0
    
    if btc_sc > eth_sc and btc_sc > alt_sc and btc_wr > 55:
        return {"phase": 1, "phase_name": "Bitcoin Season", "emoji": "₿", "color": "#f7931a", "description": "BTC domine", "confidence": min(100, int(btc_sc - max(eth_sc, alt_sc))), "details": {"btc": {"winrate": round(btc_wr, 1), "avg_return": round(btc_avg, 2), "trades": len(btc)}, "eth": {"winrate": round(eth_wr, 1), "avg_return": round(eth_avg, 2), "trades": len(eth)}, "large_cap": {"winrate": round(lc_wr, 1), "avg_return": round(lc_avg, 2), "trades": len(lc)}, "small_alts": {"winrate": round(alt_wr, 1), "avg_return": round(alt_avg, 2), "trades": len(alt)}}}
    elif (eth_sc > btc_sc or lc_sc > btc_sc) and eth_wr > 50:
        return {"phase": 2, "phase_name": "ETH & Large-Cap", "emoji": "💎", "color": "#627eea", "description": "ETH surperforme", "confidence": min(100, int(max(eth_sc, lc_sc) - btc_sc)), "details": {"btc": {"winrate": round(btc_wr, 1), "avg_return": round(btc_avg, 2), "trades": len(btc)}, "eth": {"winrate": round(eth_wr, 1), "avg_return": round(eth_avg, 2), "trades": len(eth)}, "large_cap": {"winrate": round(lc_wr, 1), "avg_return": round(lc_avg, 2), "trades": len(lc)}, "small_alts": {"winrate": round(alt_wr, 1), "avg_return": round(alt_avg, 2), "trades": len(alt)}}}
    elif alt_sc > btc_sc and alt_sc > eth_sc and alt_wr > 55:
        return {"phase": 3, "phase_name": "Altcoin Season", "emoji": "🚀", "color": "#10b981", "description": "Alts explosent", "confidence": min(100, int(alt_sc - max(btc_sc, eth_sc))), "details": {"btc": {"winrate": round(btc_wr, 1), "avg_return": round(btc_avg, 2), "trades": len(btc)}, "eth": {"winrate": round(eth_wr, 1), "avg_return": round(eth_avg, 2), "trades": len(eth)}, "large_cap": {"winrate": round(lc_wr, 1), "avg_return": round(lc_avg, 2), "trades": len(lc)}, "small_alts": {"winrate": round(alt_wr, 1), "avg_return": round(alt_avg, 2), "trades": len(alt)}}}
    
    return {"phase": 0, "phase_name": "Accumulation", "emoji": "🐻", "color": "#64748b", "description": "Phase neutre", "confidence": 30, "details": {"btc": {"winrate": round(btc_wr, 1), "avg_return": round(btc_avg, 2), "trades": len(btc)}, "eth": {"winrate": round(eth_wr, 1), "avg_return": round(eth_avg, 2), "trades": len(eth)}, "large_cap": {"winrate": round(lc_wr, 1), "avg_return": round(lc_avg, 2), "trades": len(lc)}, "small_alts": {"winrate": round(alt_wr, 1), "avg_return": round(alt_avg, 2), "trades": len(alt)}}}

def calculate_advanced_metrics(rows: List[dict]) -> Dict[str, Any]:
    closed = [r for r in rows if r["row_state"] in ("tp", "sl")]
    if len(closed) < 2: return {"sharpe_ratio": 0, "sortino_ratio": 0, "calmar_ratio": 0, "expectancy": 0, "max_drawdown": 0}
    
    returns = []
    for r in closed:
        if r.get("entry"):
            try:
                entry = float(r["entry"])
                exit_p = float(r["sl"]) if r.get("sl_hit") else float(r["tp1"]) if r.get("tp1") else None
                if exit_p:
                    pl = ((exit_p - entry) / entry) * 100
                    if r.get("side") == "SHORT": pl = -pl
                    returns.append(pl)
            except: pass
    
    if not returns: return {"sharpe_ratio": 0, "sortino_ratio": 0, "calmar_ratio": 0, "expectancy": 0, "max_drawdown": 0}
    
    avg = sum(returns) / len(returns)
    std = math.sqrt(sum((r - avg) ** 2 for r in returns) / len(returns)) if len(returns) > 1 else 0.01
    sharpe = (avg / std) * math.sqrt(252) if std > 0 else 0
    
    down = [r for r in returns if r < 0]
    down_std = math.sqrt(sum(r ** 2 for r in down) / len(down)) if down else 0.01
    sortino = (avg / down_std) * math.sqrt(252) if down_std > 0 else 0
    
    cumul, run, max_dd, peak = [], 0, 0, 0
    for r in returns:
        run += r
        cumul.append(run)
        if run > peak: peak = run
        dd = peak - run
        if dd > max_dd: max_dd = dd
    
    calmar = (sum(returns) / max_dd) if max_dd > 0 else 0
    
    wins = [r for r in returns if r > 0]
    losses = [r for r in returns if r < 0]
    avg_w = sum(wins) / len(wins) if wins else 0
    avg_l = abs(sum(losses) / len(losses)) if losses else 0
    wr = len(wins) / len(returns) if returns else 0
    expect = (wr * avg_w) - ((1 - wr) * avg_l)
    
    return {"sharpe_ratio": round(sharpe, 2), "sortino_ratio": round(sortino, 2), "calmar_ratio": round(calmar, 2), "expectancy": round(expect, 2), "max_drawdown": round(max_dd, 2)}

def calculate_equity_curve(rows: List[dict]) -> List[Dict[str, Any]]:
    closed = sorted([r for r in rows if r["row_state"] in ("tp", "sl")], key=lambda x: x.get("t_entry", 0))
    equity, current, peak = [{"date": 0, "equity": settings.INITIAL_CAPITAL, "drawdown": 0}], settings.INITIAL_CAPITAL, settings.INITIAL_CAPITAL
    
    for r in closed:
        if r.get("entry"):
            try:
                entry = float(r["entry"])
                exit_p = float(r["sl"]) if r.get("sl_hit") else float(r["tp1"]) if r.get("tp1") else None
                if exit_p:
                    pl = ((exit_p - entry) / entry) * 100
                    if r.get("side") == "SHORT": pl = -pl
                    pl_amt = current * 0.02 * (pl / 2)
                    current = max(0, current + pl_amt)
                    if current > peak: peak = current
                    dd = ((peak - current) / peak) * 100 if peak > 0 else 0
                    equity.append({"date": r.get("t_entry", 0), "equity": round(current, 2), "drawdown": round(dd, 2)})
            except: pass
    return equity

def calculate_performance_heatmap(rows: List[dict]) -> Dict[str, Any]:
    hm = defaultdict(lambda: {"wins": 0, "losses": 0, "total": 0})
    for r in rows:
        if r["row_state"] in ("tp", "sl") and r.get("t_entry"):
            dt = datetime.fromtimestamp(r["t_entry"] / 1000, tz=timezone.utc)
            key = f"{dt.strftime('%A')}_{(dt.hour // 4) * 4:02d}h"
            hm[key]["total"] += 1
            if r["row_state"] == "tp": hm[key]["wins"] += 1
            else: hm[key]["losses"] += 1
    
    return {k: {**d, "winrate": round((d["wins"] / d["total"]) * 100, 1)} for k, d in hm.items() if d["total"] > 0}

def detect_trading_patterns(rows: List[dict]) -> List[str]:
    if len(rows) < 10: return ["Accumulez plus de trades"]
    patterns = []
    
    def wr(trades):
        c = [t for t in trades if t["row_state"] in ("tp", "sl")]
        return (sum(1 for t in c if t["row_state"] == "tp") / len(c) * 100) if c else 0
    
    morn = [r for r in rows if r.get("t_entry") and 6 <= datetime.fromtimestamp(r["t_entry"] / 1000).hour < 12]
    aft = [r for r in rows if r.get("t_entry") and 12 <= datetime.fromtimestamp(r["t_entry"] / 1000).hour < 18]
    
    m_wr, a_wr = wr(morn), wr(aft)
    if m_wr > 60 and m_wr > a_wr: patterns.append(f"✅ Meilleur le matin ({m_wr:.0f}%)")
    elif a_wr > 60: patterns.append(f"✅ Meilleur l'après-midi ({a_wr:.0f}%)")
    
    longs = [r for r in rows if r.get("side") == "LONG" and r["row_state"] in ("tp", "sl")]
    shorts = [r for r in rows if r.get("side") == "SHORT" and r["row_state"] in ("tp", "sl")]
    
    if len(longs) >= 5:
        l_wr = wr(longs)
        if l_wr >= 65: patterns.append(f"📈 Excellent sur LONGs ({l_wr:.0f}%)")
    
    if len(shorts) >= 5:
        s_wr = wr(shorts)
        if s_wr >= 65: patterns.append(f"📉 Excellent sur SHORTs ({s_wr:.0f}%)")
    
    return patterns if patterns else ["📊 Continuez à trader"]

def calculate_kelly_position(winrate: float, avg_win: float, avg_loss: float) -> Dict[str, Any]:
    if avg_loss == 0 or winrate == 0: return {"kelly_pct": 0, "conservative_pct": 0, "recommendation": "Données insuffisantes"}
    
    p, q, b = winrate / 100.0, 1 - (winrate / 100.0), avg_win / avg_loss
    kelly = max(0, min((p * b - q) / b, 0.25))
    cons = kelly * 0.5
    
    if cons <= 0: rec = "❌ Ne pas trader"
    elif cons < 0.02: rec = "⚠️ Edge faible"
    elif cons < 0.05: rec = "✅ Normal - 2-5%"
    else: rec = "🚀 Fort edge"
    
    return {"kelly_pct": round(kelly * 100, 2), "conservative_pct": round(cons * 100, 2), "recommendation": rec}

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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", (
        payload.type, payload.symbol, str(payload.tf) if payload.tf else None,
        payload.tf_label or tf_to_label(payload.tf), int(payload.time or now_ms()),
        payload.side, payload.entry, payload.sl, payload.tp1, payload.tp2, payload.tp3,
        payload.confidence, payload.leverage, payload.note, payload.price, trade_id))
    return trade_id

async def send_telegram(text: str):
    if not settings.TELEGRAM_ENABLED: return
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage",
                json={"chat_id": settings.TELEGRAM_CHAT_ID, "text": text, "parse_mode": "HTML"})
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
    return {"status": "healthy", "version": "3.0.0", "features": ["Fear & Greed", "Bull Run", "Altseason", "AI", "Analytics"]}

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
    metrics = calculate_advanced_metrics(rows)
    closed = [r for r in rows if r["row_state"] in ("tp", "sl")]
    wins = [r for r in closed if r["row_state"] == "tp"]
    wr = (len(wins) / len(closed) * 100) if closed else 0
    returns = []
    for r in closed:
        if r.get("entry"):
            try:
                entry, exit_p = float(r["entry"]), (float(r["sl"]) if r.get("sl_hit") else float(r["tp1"]) if r.get("tp1") else None)
                if exit_p:
                    pl = ((exit_p - entry) / entry) * 100
                    if r.get("side") == "SHORT": pl = -pl
                    returns.append(pl)
            except: pass
    avg_w = sum(r for r in returns if r > 0) / max(1, len([r for r in returns if r > 0]))
    avg_l = abs(sum(r for r in returns if r < 0) / max(1, len([r for r in returns if r < 0])))
    return {"ok": True, "metrics": metrics, "kelly": calculate_kelly_position(wr, avg_w, avg_l)}

@app.get("/api/patterns")
async def get_patterns():
    return {"ok": True, "patterns": detect_trading_patterns(build_trade_rows(200))}

@app.post("/api/journal")
async def add_journal(note: JournalNote):
    db_execute("INSERT INTO trade_notes (trade_id, note, emotion, tags) VALUES (?, ?, ?, ?)",
        (note.trade_id, note.note, note.emotion, note.tags))
    return {"ok": True}

@app.get("/api/journal")
async def get_journals(limit: int = 50):
    return {"ok": True, "notes": db_query("SELECT * FROM trade_notes ORDER BY created_at DESC LIMIT ?", (limit,))}

@app.post("/tv-webhook")
@rate_limit("100/minute")
async def webhook(request: Request):
    try: data = await request.json()
    except: raise HTTPException(400, "Invalid JSON")
    
    if data.get("secret") != settings.WEBHOOK_SECRET: raise HTTPException(403)
    
    try: payload = WebhookPayload(**data)
    except Exception as e: raise HTTPException(422, str(e))
    
    if payload.type == "ENTRY" and settings.CIRCUIT_BREAKER_ENABLED:
        breaker = check_circuit_breaker()
        if breaker["active"]:
            await send_telegram(f"⛔ Trade bloqué: {breaker['reason']}")
            return {"ok": False, "reason": "circuit_breaker"}
        
        recent = build_trade_rows(10)
        consecutive = 0
        for t in reversed([r for r in recent if r["row_state"] in ("tp", "sl")]):
            if t["row_state"] == "sl": consecutive += 1
            else: break
        
        if consecutive >= settings.MAX_CONSECUTIVE_LOSSES:
            trigger_circuit_breaker(f"{consecutive} pertes")
            await send_telegram(f"🚨 CIRCUIT BREAKER: {consecutive} pertes")
            return {"ok": False, "reason": "consecutive_losses"}
    
    return {"ok": True, "trade_id": save_event(payload)}

@app.get("/trades", response_class=HTMLResponse)
async def trades_page():
    rows = build_trade_rows(50)
    table = ""
    for r in rows[:20]:
        badge = f'<span class="badge badge-green">TP</span>' if r["row_state"]=="tp" else (f'<span class="badge badge-red">SL</span>' if r["row_state"]=="sl" else f'<span class="badge badge-yellow">En cours</span>')
        table += f"""<tr style="border-bottom:1px solid rgba(99,102,241,0.1)">
            <td style="padding:12px">{r['symbol']}</td><td style="padding:12px">{r['tf_label']}</td>
            <td style="padding:12px">{r['side']}</td><td style="padding:12px">{r['entry'] or 'N/A'}</td>
            <td style="padding:12px">{badge}</td></tr>"""
    
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Dashboard</title>{CSS}</head>
    <body><div class="container">
    <div class="header"><h1>📊 Dashboard</h1></div>{NAV}
    
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(350px,1fr))">
        <div class="card"><h2>😱 Fear & Greed</h2>
            <div id="fg" style="text-align:center;padding:40px">⏳ Chargement...</div>
        </div>
        <div class="card"><h2>🚀 Bull Run Phase</h2>
            <div id="br" style="text-align:center;padding:40px">⏳ Chargement...</div>
        </div>
    </div>
    
    <div class="card" id="phases" style="display:none"><h2>📈 Phases</h2>
        <div id="p1" class="phase-indicator" style="color:#f7931a">
            <div class="phase-number">₿</div>
            <div style="flex:1"><div style="font-weight:700">Phase 1: Bitcoin</div>
            <div style="font-size:12px;color:#64748b" id="p1s">--</div></div></div>
        <div id="p2" class="phase-indicator" style="color:#627eea">
            <div class="phase-number">💎</div>
            <div style="flex:1"><div style="font-weight:700">Phase 2: ETH & Large-Cap</div>
            <div style="font-size:12px;color:#64748b" id="p2s">--</div></div></div>
        <div id="p3" class="phase-indicator" style="color:#10b981">
            <div class="phase-number">🚀</div>
            <div style="flex:1"><div style="font-weight:700">Phase 3: Altcoin</div>
            <div style="font-size:12px;color:#64748b" id="p3s">--</div></div></div>
    </div>
    
    <div class="grid">
        <div class="metric"><div class="metric-label">Total</div><div class="metric-value">{len(rows)}</div></div>
        <div class="metric"><div class="metric-label">Actifs</div><div class="metric-value">{sum(1 for r in rows if r['row_state']=='normal')}</div></div>
        <div class="metric"><div class="metric-label">Win Rate</div><div class="metric-value">{int((sum(1 for r in rows if r['row_state']=='tp')/max(1,sum(1 for r in rows if r['row_state'] in ('tp','sl'))))*100)}%</div></div>
    </div>
    
    <div class="card"><h2>Derniers Trades</h2>
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
    fetch('/api/fear-greed').then(r=>r.json()).then(d=>{{if(d.ok){{const f=d.fear_greed;
    document.getElementById('fg').innerHTML=`<div class="gauge"><div class="gauge-inner">
    <div class="gauge-value" style="color:${{f.color}}">${{f.value}}</div>
    <div class="gauge-label">/ 100</div></div></div>
    <div style="text-align:center;margin-top:24px;font-size:24px;font-weight:900;color:${{f.color}}">${{f.emoji}} ${{f.sentiment}}</div>
    <p style="color:#64748b;font-size:14px;text-align:center">${{f.recommendation}}</p>`;}}}});
    
    fetch('/api/bullrun-phase').then(r=>r.json()).then(d=>{{if(d.ok){{const b=d.bullrun_phase;
    document.getElementById('br').innerHTML=`<div style="font-size:64px;margin-bottom:8px">${{b.emoji}}</div>
    <div style="font-size:24px;font-weight:900;color:${{b.color}}">${{b.phase_name}}</div>
    <p style="color:#64748b;font-size:14px">${{b.description}}</p>
    <span class="badge" style="background:rgba(99,102,241,0.15);color:#6366f1">Conf: ${{b.confidence}}%</span>`;
    document.getElementById('phases').style.display='block';
    ['p1','p2','p3'].forEach((id,i)=>{{const el=document.getElementById(id);
    if(i+1===b.phase)el.classList.add('active');else el.classList.remove('active');}});
    const d=b.details;
    document.getElementById('p1s').textContent=`WR: ${{d.btc.winrate}}% | ${{d.btc.trades}} trades`;
    document.getElementById('p2s').textContent=`ETH: ${{d.eth.winrate}}% | LC: ${{d.large_cap.winrate}}%`;
    document.getElementById('p3s').textContent=`WR: ${{d.small_alts.winrate}}% | ${{d.small_alts.trades}} trades`;}}}});
    </script>
    </div></body></html>""")

@app.get("/ai-insights", response_class=HTMLResponse)
async def ai_page():
    rows = build_trade_rows(200)
    patterns = detect_trading_patterns(rows)
    p_html = "".join(f'<li>{p}</li>' for p in patterns)
    
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>AI Insights</title>{CSS}</head>
    <body><div class="container">
    <div class="header"><h1>🤖 AI Insights</h1></div>{NAV}
    <div class="card"><h2>Patterns Détectés</h2><ul class="list">{p_html}</ul></div>
    </div></body></html>""")

@app.get("/equity-curve", response_class=HTMLResponse)
async def equity_page():
    rows = build_trade_rows(1000)
    curve = calculate_equity_curve(rows)
    curr = curve[-1]["equity"] if curve else settings.INITIAL_CAPITAL
    ret = ((curr - settings.INITIAL_CAPITAL) / settings.INITIAL_CAPITAL) * 100
    
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Equity</title>{CSS}
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script></head>
    <body><div class="container">
    <div class="header"><h1>📈 Equity Curve</h1></div>{NAV}
    <div class="grid">
        <div class="metric"><div class="metric-label">Initial</div><div class="metric-value">${settings.INITIAL_CAPITAL:.0f}</div></div>
        <div class="metric"><div class="metric-label">Actuel</div><div class="metric-value">${curr:.0f}</div></div>
        <div class="metric"><div class="metric-label">Return</div><div class="metric-value" style="color:{'#10b981' if ret>=0 else '#ef4444'}">{ret:+.1f}%</div></div>
    </div>
    <div class="card" style="min-height:400px"><canvas id="c"></canvas></div>
    <script>
    new Chart(document.getElementById('c'),{{type:'line',data:{{
    datasets:[{{label:'Equity',data:{json.dumps([{"x":i,"y":p["equity"]} for i,p in enumerate(curve)])},
    borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,0.1)',tension:0.4,fill:true}}]}},
    options:{{responsive:true,maintainAspectRatio:false,scales:{{x:{{type:'linear'}}}}}}}});
    </script></div></body></html>""")

@app.get("/heatmap", response_class=HTMLResponse)
async def heatmap_page():
    rows = build_trade_rows(1000)
    hm = calculate_performance_heatmap(rows)
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
    
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Heatmap</title>{CSS}</head>
    <body><div class="container">
    <div class="header"><h1>🔥 Heatmap</h1></div>{NAV}
    <div class="card"><h2>Performance par jour/heure</h2>{table}</div>
    </div></body></html>""")

@app.get("/advanced-metrics", response_class=HTMLResponse)
async def metrics_page():
    rows = build_trade_rows(1000)
    m = calculate_advanced_metrics(rows)
    closed = [r for r in rows if r["row_state"] in ("tp", "sl")]
    wr = (sum(1 for r in closed if r["row_state"]=="tp") / len(closed) * 100) if closed else 0
    returns = []
    for r in closed:
        if r.get("entry"):
            try:
                entry, exit_p = float(r["entry"]), (float(r["sl"]) if r.get("sl_hit") else float(r["tp1"]) if r.get("tp1") else None)
                if exit_p:
                    pl = ((exit_p - entry) / entry) * 100
                    if r.get("side") == "SHORT": pl = -pl
                    returns.append(pl)
            except: pass
    avg_w = sum(r for r in returns if r > 0) / max(1, len([r for r in returns if r > 0]))
    avg_l = abs(sum(r for r in returns if r < 0) / max(1, len([r for r in returns if r < 0])))
    kelly = calculate_kelly_position(wr, avg_w, avg_l)
    
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Metrics</title>{CSS}</head>
    <body><div class="container">
    <div class="header"><h1>📊 Métriques Avancées</h1></div>{NAV}
    <div class="grid">
        <div class="metric"><div class="metric-label">Sharpe</div><div class="metric-value">{m['sharpe_ratio']}</div></div>
        <div class="metric"><div class="metric-label">Sortino</div><div class="metric-value">{m['sortino_ratio']}</div></div>
        <div class="metric"><div class="metric-label">Calmar</div><div class="metric-value">{m['calmar_ratio']}</div></div>
        <div class="metric"><div class="metric-label">Expectancy</div><div class="metric-value">{m['expectancy']:.2f}%</div></div>
    </div>
    <div class="card"><h2>Kelly Criterion</h2>
    <div class="grid">
        <div class="metric"><div class="metric-label">Kelly %</div><div class="metric-value">{kelly['kelly_pct']:.1f}%</div></div>
        <div class="metric"><div class="metric-label">Conservateur</div><div class="metric-value">{kelly['conservative_pct']:.1f}%</div></div>
    </div>
    <p style="padding:16px;background:rgba(99,102,241,0.1);border-radius:12px;margin-top:20px">{kelly['recommendation']}</p>
    </div></div></body></html>""")

@app.get("/patterns", response_class=HTMLResponse)
async def patterns_page():
    patterns = detect_trading_patterns(build_trade_rows(200))
    p_html = "".join(f'<li>{p}</li>' for p in patterns)
    
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Patterns</title>{CSS}</head>
    <body><div class="container">
    <div class="header"><h1>🔍 Patterns</h1></div>{NAV}
    <div class="card"><h2>Patterns Détectés</h2><ul class="list">{p_html}</ul></div>
    </div></body></html>""")

@app.get("/journal", response_class=HTMLResponse)
async def journal_page():
    rows = build_trade_rows(50)
    table = ""
    for r in rows[:20]:
        notes = db_query("SELECT note, emotion FROM trade_notes WHERE trade_id=? ORDER BY created_at DESC LIMIT 1", (r["trade_id"],))
        note = notes[0]["note"][:50] if notes and notes[0].get("note") else "Pas de note"
        emo = notes[0]["emotion"] if notes and notes[0].get("emotion") else "-"
        badge = f'<span class="badge badge-green">TP</span>' if r["row_state"]=="tp" else f'<span class="badge badge-red">SL</span>' if r["row_state"]=="sl" else f'<span class="badge badge-yellow">En cours</span>'
        table += f"""<tr style="border-bottom:1px solid rgba(99,102,241,0.1)">
            <td style="padding:12px">{r['symbol']}</td><td style="padding:12px">{badge}</td>
            <td style="padding:12px">{emo}</td><td style="padding:12px">{note}</td></tr>"""
    
    return HTMLResponse(f"""<!DOCTYPE html><html><head><title>Journal</title>{CSS}</head>
    <body><div class="container">
    <div class="header"><h1>📝 Journal</h1></div>{NAV}
    <div class="card"><h2>Trades</h2>
    <table style="width:100%;border-collapse:collapse">
        <thead><tr style="border-bottom:2px solid rgba(99,102,241,0.2)">
            <th style="padding:12px;text-align:left;color:#64748b">Symbol</th>
            <th style="padding:12px;text-align:left;color:#64748b">Résultat</th>
            <th style="padding:12px;text-align:left;color:#64748b">Émotion</th>
            <th style="padding:12px;text-align:left;color:#64748b">Note</th>
        </tr></thead><tbody>{table}</tbody>
    </table></div></div></body></html>""")

@app.get("/altseason", response_class=HTMLResponse)
async def altseason_page():
    return HTMLResponse("""<!DOCTYPE html><html><head><title>Altseason</title></head>
    <body style="font-family:system-ui;padding:40px;background:#0a0f1a;color:#e6edf3">
    <h1 style="color:#6366f1">🚀 Altseason</h1>
    <p><a href="/trades" style="color:#8b5cf6">← Dashboard</a></p>
    </body></html>""")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    logger.info("🚀 Starting...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
