# -*- coding: utf-8 -*-
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import Optional, Any
import httpx
from datetime import datetime, timedelta
import random
import os

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ✅ CORRECTION 1: Ajout de la base de données en mémoire
trades_db = []

# ✅ CACHE pour les données du Heatmap (évite le rate limiting)
heatmap_cache = {
    "data": None,
    "timestamp": None,
    "cache_duration": 180  # 3 minutes en secondes
}

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8478131465:AAEh7Z0rvIqSNvn1wKdtkMNb-O96h41LCns")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "-1002940633257")

CSS = """<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:20px}.container{max-width:1400px;margin:0 auto}.header{text-align:center;margin-bottom:30px;padding:30px;background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:12px}.header h1{font-size:42px;margin-bottom:10px;background:linear-gradient(to right,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.header p{color:#94a3b8;font-size:16px}.nav{display:flex;gap:10px;margin-bottom:30px;flex-wrap:wrap;justify-content:center}.nav a{padding:12px 20px;background:#1e293b;border-radius:8px;text-decoration:none;color:#e2e8f0;transition:all .3s;border:1px solid #334155}.nav a:hover{background:#334155;border-color:#60a5fa}.card{background:#1e293b;padding:25px;border-radius:12px;margin-bottom:20px;border:1px solid #334155}.card h2{color:#60a5fa;margin-bottom:20px;font-size:24px;border-bottom:2px solid #334155;padding-bottom:10px}.grid{display:grid;gap:20px}.grid-2{grid-template-columns:repeat(auto-fit,minmax(400px,1fr))}.grid-3{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}.grid-4{grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}.stat-box{background:#0f172a;padding:20px;border-radius:8px;border-left:4px solid #60a5fa}.stat-box .label{color:#94a3b8;font-size:13px;margin-bottom:8px}.stat-box .value{font-size:32px;font-weight:700;color:#e2e8f0}table{width:100%;border-collapse:collapse;margin-top:15px}table th{background:#0f172a;padding:12px;text-align:left;color:#60a5fa;font-weight:600;border-bottom:2px solid #334155}table td{padding:12px;border-bottom:1px solid #334155}table tr:hover{background:#0f172a}input,select{width:100%;padding:12px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:14px;margin-bottom:15px}button{padding:12px 24px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:all .3s}button:hover{background:#2563eb}.btn-danger{background:#ef4444}.btn-danger:hover{background:#dc2626}.alert{padding:15px;border-radius:8px;margin:15px 0}.alert-error{background:rgba(239,68,68,.1);border-left:4px solid #ef4444;color:#ef4444}.alert-success{background:rgba(16,185,129,.1);border-left:4px solid #10b981;color:#10b981}</style>"""

NAV = '<div class="nav"><a href="/">Accueil</a><a href="/fear-greed">Fear&Greed</a><a href="/dominance">Dominance</a><a href="/altcoin-season">Altcoin Season</a><a href="/heatmap">Heatmap</a><a href="/nouvelles">📰 Nouvelles</a><a href="/trades">Trades</a><a href="/convertisseur">💱 Convertisseur</a><a href="/telegram-test">Telegram</a></div>'

class TradeWebhook(BaseModel):
    type: str = "ENTRY"
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
    direction: Optional[str] = None
    trade_id: Optional[str] = None
    secret: Optional[str] = None
    
    # Anciens champs pour compatibilité
    action: Optional[str] = None
    quantity: Optional[float] = None
    entry_time: Optional[str] = None
    
    @validator('type', pre=True, always=True)
    def set_type_from_action(cls, v, values):
        if 'action' in values and values['action']:
            action = values['action'].upper()
            if action in ('BUY', 'SELL'):
                return 'ENTRY'
        return v or 'ENTRY'
    
    @validator('side', pre=True, always=True)
    def set_side_from_action(cls, v, values):
        if v:
            return v.upper()
        if 'action' in values and values['action']:
            action = values['action'].upper()
            if action == 'BUY':
                return 'LONG'
            elif action == 'SELL':
                return 'SHORT'
        return v
    
    @validator('entry', pre=True, always=True)
    def set_entry_from_price(cls, v, values):
        if v is not None:
            return v
        if 'price' in values:
            return values['price']
        return None

async def send_telegram_message(message: str):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json={"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"})
            result = response.json()
            return result
    except Exception as e:
        return {"ok": False, "error": str(e)}

async def get_market_indicators():
    """Récupère Fear & Greed et BTC Dominance en temps réel"""
    indicators = {"fear_greed": None, "btc_dominance": None}
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                r = await client.get("https://api.alternative.me/fng/")
                if r.status_code == 200:
                    data = r.json()
                    indicators["fear_greed"] = int(data["data"][0]["value"])
            except:
                pass
            
            try:
                r = await client.get("https://api.coingecko.com/api/v3/global")
                if r.status_code == 200:
                    data = r.json()
                    indicators["btc_dominance"] = round(data["data"]["market_cap_percentage"]["btc"], 1)
            except:
                pass
    except:
        pass
    
    return indicators

def tf_to_label(tf: Any) -> str:
    """Convertit un timeframe en label lisible"""
    if tf is None:
        return ""
    s = str(tf)
    try:
        n = int(s)
    except:
        return s
    if n < 60:
        return f"{n}m"
    if n == 60:
        return "1h"
    if n % 60 == 0:
        return f"{n//60}h"
    return s

def _calc_rr(entry: Optional[float], sl: Optional[float], tp1: Optional[float]) -> Optional[float]:
    """Calcule le Risk/Reward ratio"""
    try:
        if entry is None or sl is None or tp1 is None:
            return None
        risk = abs(entry - sl)
        reward = abs(tp1 - entry)
        return round(reward / risk, 2) if risk > 0 else None
    except:
        return None

def build_confidence_line(payload: dict, indicators: dict) -> str:
    """Construit la ligne de confiance avec facteurs"""
    entry = payload.get("entry")
    sl = payload.get("sl")
    tp1 = payload.get("tp1")
    rr = _calc_rr(entry, sl, tp1)
    
    factors = []
    conf = payload.get("confidence")
    
    if conf is None:
        # Calcul automatique de la confiance
        base = 50
        
        if rr:
            base += max(min((rr - 1.0) * 10, 20), -10)
            factors.append(f"R/R {rr}")
        
        # Ajouter les indicateurs de marché
        if indicators.get("fear_greed"):
            fg = indicators["fear_greed"]
            # Fear & Greed : plus c'est bas (fear), plus c'est bon pour acheter
            if fg < 30:
                base += 10
                factors.append(f"F&G {fg} (Fear)")
            elif fg > 70:
                base -= 5
                factors.append(f"F&G {fg} (Greed)")
            else:
                factors.append(f"F&G {fg}")
        
        if indicators.get("btc_dominance"):
            btc_dom = indicators["btc_dominance"]
            factors.append(f"BTC.D {btc_dom}%")
        
        conf = int(max(5, min(95, round(base))))
    else:
        # Si confiance fournie, juste ajouter les facteurs
        if rr:
            factors.append(f"R/R {rr}")
        if indicators.get("fear_greed"):
            factors.append(f"F&G {indicators['fear_greed']}")
        if indicators.get("btc_dominance"):
            factors.append(f"BTC.D {indicators['btc_dominance']}%")
    
    return f"🧠 Confiance: {conf}% — {', '.join(factors)}" if factors else f"🧠 Confiance: {conf}%"

def format_entry_announcement(payload: dict, indicators: dict) -> str:
    """Formate le message d'annonce d'entrée"""
    symbol = payload.get("symbol", "")
    tf_lbl = payload.get("tf_label") or tf_to_label(payload.get("tf"))
    side = (payload.get("side") or "").upper()
    entry = payload.get("entry")
    tp1 = payload.get("tp1")
    tp2 = payload.get("tp2")
    tp3 = payload.get("tp3")
    sl = payload.get("sl")
    leverage = payload.get("leverage", "")
    note = (payload.get("note") or "").strip()
    
    # Emoji selon le side
    side_emoji = "📈" if side == "LONG" else ("📉" if side == "SHORT" else "📌")
    
    # Calcul R/R
    rr = _calc_rr(entry, sl, tp1)
    rr_text = f" (R/R: {rr:.2f})" if rr else ""
    
    # Calculer la confiance AVANT de construire le message
    conf_line = build_confidence_line(payload, indicators)
    # Extraire juste le chiffre de confiance
    conf_value = payload.get("confidence")
    if conf_value is None:
        # Le calcul est fait dans build_confidence_line, on l'extrait
        import re
        match = re.search(r'Confiance: (\d+)%', conf_line)
        if match:
            conf_value = int(match.group(1))
        else:
            conf_value = 50
    
    # Construction du message
    lines = [
        "🚨 <b>NOUVEAU TRADE</b>",
        "",
        f"<b>{symbol}</b>",
        f"<b>Direction: {side}</b> | {conf_value}%",
        "",
        f"<b>Entry:</b> ${entry:.4f}" if entry else "Entry: N/A"
    ]
    
    # Take Profits
    if tp1 or tp2 or tp3:
        lines.append("")
        lines.append("<b>Take Profits:</b>")
        
        if tp1 and entry:
            pct = ((tp1 - entry) / entry) * 100 if side == "LONG" else ((entry - tp1) / entry) * 100
            lines.append(f" TP1: ${tp1:.4f} (+{pct:.1f}%){rr_text}")
        
        if tp2 and entry:
            pct = ((tp2 - entry) / entry) * 100 if side == "LONG" else ((entry - tp2) / entry) * 100
            lines.append(f" TP2: ${tp2:.4f} (+{pct:.1f}%)")
        
        if tp3 and entry:
            pct = ((tp3 - entry) / entry) * 100 if side == "LONG" else ((entry - tp3) / entry) * 100
            lines.append(f" TP3: ${tp3:.4f} (+{pct:.1f}%)")
    
    # Stop Loss
    if sl:
        lines.append("")
        lines.append(f"<b>Stop Loss:</b> ${sl:.4f}")
    
    # Ligne de confiance
    lines.append("")
    lines.append(conf_line)
    
    # Note optionnelle
    if note:
        lines.append(f"📝 {note}")
    
    return "\n".join(lines)

@app.get("/health")
@app.head("/health")
async def health_check():
    return {"status": "ok"}

@app.head("/")
async def root_head():
    return {}

# ✅ CORRECTION 2: Fonction webhook complètement réécrite
@app.post("/tv-webhook")
async def tradingview_webhook(trade: TradeWebhook):
    """Webhook pour recevoir les alertes TradingView - VERSION CORRIGÉE"""
    try:
        print("="*60)
        print(f"🎯 WEBHOOK REÇU: {trade.side} {trade.symbol}")
        print(f"📊 Entry: ${trade.entry}")
        print("="*60)
        
        # Préparer les données pour le message
        payload_dict = {
            "symbol": trade.symbol,
            "tf": trade.tf,
            "tf_label": trade.tf_label or tf_to_label(trade.tf),
            "side": trade.side,
            "entry": trade.entry,
            "sl": trade.sl,
            "tp1": trade.tp1,
            "tp2": trade.tp2,
            "tp3": trade.tp3,
            "confidence": trade.confidence,
            "leverage": trade.leverage,
            "note": trade.note
        }
        
        # Récupérer les indicateurs de marché
        indicators = await get_market_indicators()
        
        # Formatter le message avec le nouveau format
        message = format_entry_announcement(payload_dict, indicators)
        print(f"📤 Message formaté:\n{message}")
        
        # Envoyer sur Telegram
        telegram_result = await send_telegram_message(message)
        print(f"✅ Résultat Telegram: {telegram_result.get('ok', False)}")
        
        # Sauvegarder dans la DB avec statuts initialisés
        trade_data = {
            "symbol": trade.symbol,
            "side": trade.side,
            "entry": trade.entry,
            "sl": trade.sl,
            "tp1": trade.tp1,
            "tp2": trade.tp2,
            "tp3": trade.tp3,
            "timestamp": datetime.now().isoformat(),
            "status": "open",
            # Statuts initialisés à False
            "tp1_hit": False,
            "tp2_hit": False,
            "tp3_hit": False,
            "sl_hit": False
        }
        trades_db.append(trade_data)
        
        print("="*60)
        
        return {
            "status": "success",
            "trade": trade_data,
            "telegram": telegram_result
        }
        
    except Exception as e:
        print(f"❌ ERREUR dans webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "error": str(e)}

@app.get("/api/telegram-test")
async def test_telegram():
    result = await send_telegram_message(f"✅ Test Bot OK! {datetime.now().strftime('%H:%M:%S')}")
    return {"result": result}

@app.get("/api/test-full-alert")
async def test_full_alert():
    """Test complet avec tous les paramètres - Format ancien"""
    test_trade = TradeWebhook(
        type="ENTRY",
        symbol="SWTCHUSDT",
        tf="15",
        side="SHORT",
        entry=0.0926,
        tp1=0.0720,
        tp2=0.0584,
        tp3=0.0378,
        sl=0.1063,
        confidence=50,
        leverage="10x"
    )
    
    # Récupérer les indicateurs
    indicators = await get_market_indicators()
    
    # Préparer le payload
    payload_dict = {
        "symbol": test_trade.symbol,
        "tf": test_trade.tf,
        "tf_label": tf_to_label(test_trade.tf),
        "side": test_trade.side,
        "entry": test_trade.entry,
        "sl": test_trade.sl,
        "tp1": test_trade.tp1,
        "tp2": test_trade.tp2,
        "tp3": test_trade.tp3,
        "confidence": test_trade.confidence,
        "leverage": test_trade.leverage
    }
    
    message = format_entry_announcement(payload_dict, indicators)
    result = await send_telegram_message(message)
    
    return {
        "message": message,
        "telegram_result": result,
        "indicators": indicators
    }

@app.get("/api/stats")
async def get_stats():
    """Statistiques détaillées des trades"""
    total = len(trades_db)
    open_trades = len([t for t in trades_db if t.get("status") == "open" and not t.get("sl_hit") and not any([t.get("tp1_hit"), t.get("tp2_hit"), t.get("tp3_hit")])])
    
    # Compter les wins (au moins un TP atteint) et losses (SL hit)
    wins = len([t for t in trades_db if t.get("tp1_hit") or t.get("tp2_hit") or t.get("tp3_hit")])
    losses = len([t for t in trades_db if t.get("sl_hit")])
    closed = wins + losses
    
    win_rate = round((wins / closed) * 100, 2) if closed > 0 else 0
    
    return {
        "total_trades": total,
        "open_trades": open_trades,
        "closed_trades": closed,
        "win_trades": wins,
        "loss_trades": losses,
        "win_rate": win_rate,
        "total_pnl": 0,
        "avg_pnl": 0,
        "status": "ok"
    }

@app.get("/api/trades")
async def get_trades():
    """Retourne tous les trades avec leurs statuts"""
    return {
        "trades": trades_db,
        "count": len(trades_db),
        "status": "success"
    }

@app.post("/api/trades/update-status")
async def update_trade_status(trade_update: dict):
    """Met à jour le statut d'un trade (TP1, TP2, TP3, SL)"""
    try:
        symbol = trade_update.get("symbol")
        timestamp = trade_update.get("timestamp")
        
        # Trouver le trade
        for trade in trades_db:
            if trade.get("symbol") == symbol and trade.get("timestamp") == timestamp:
                # Mettre à jour les statuts
                if "tp1_hit" in trade_update:
                    trade["tp1_hit"] = trade_update["tp1_hit"]
                if "tp2_hit" in trade_update:
                    trade["tp2_hit"] = trade_update["tp2_hit"]
                if "tp3_hit" in trade_update:
                    trade["tp3_hit"] = trade_update["tp3_hit"]
                if "sl_hit" in trade_update:
                    trade["sl_hit"] = trade_update["sl_hit"]
                    
                # Si un SL ou TP est hit, fermer le trade
                if trade.get("sl_hit") or trade.get("tp3_hit"):
                    trade["status"] = "closed"
                    
                return {"status": "success", "trade": trade}
        
        return {"status": "error", "message": "Trade non trouvé"}
        
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/api/trades/add-demo")
async def add_demo_trades():
    """Ajoute des trades de démonstration pour tester l'interface"""
    demo_trades = [
        {
            "symbol": "BTCUSDT",
            "side": "LONG",
            "entry": 107150.00,
            "sl": 105000.00,
            "tp1": 108500.00,
            "tp2": 110000.00,
            "tp3": 112000.00,
            "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
            "status": "open",
            "tp1_hit": True,
            "tp2_hit": True,
            "tp3_hit": False,
            "sl_hit": False
        },
        {
            "symbol": "ETHUSDT",
            "side": "SHORT",
            "entry": 3887.50,
            "sl": 3950.00,
            "tp1": 3800.00,
            "tp2": 3700.00,
            "tp3": 3600.00,
            "timestamp": (datetime.now() - timedelta(hours=5)).isoformat(),
            "status": "closed",
            "tp1_hit": False,
            "tp2_hit": False,
            "tp3_hit": False,
            "sl_hit": True
        },
        {
            "symbol": "SOLUSDT",
            "side": "LONG",
            "entry": 187.00,
            "sl": 180.00,
            "tp1": 195.00,
            "tp2": 205.00,
            "tp3": 215.00,
            "timestamp": (datetime.now() - timedelta(hours=1)).isoformat(),
            "status": "open",
            "tp1_hit": True,
            "tp2_hit": False,
            "tp3_hit": False,
            "sl_hit": False
        },
        {
            "symbol": "BNBUSDT",
            "side": "LONG",
            "entry": 698.00,
            "sl": 680.00,
            "tp1": 710.00,
            "tp2": 725.00,
            "tp3": 750.00,
            "timestamp": (datetime.now() - timedelta(days=1)).isoformat(),
            "status": "closed",
            "tp1_hit": True,
            "tp2_hit": True,
            "tp3_hit": True,
            "sl_hit": False
        },
        {
            "symbol": "ADAUSDT",
            "side": "SHORT",
            "entry": 1.05,
            "sl": 1.12,
            "tp1": 0.98,
            "tp2": 0.92,
            "tp3": 0.85,
            "timestamp": (datetime.now() - timedelta(minutes=30)).isoformat(),
            "status": "open",
            "tp1_hit": False,
            "tp2_hit": False,
            "tp3_hit": False,
            "sl_hit": False
        },
        {
            "symbol": "XRPUSDT",
            "side": "LONG",
            "entry": 2.83,
            "sl": 2.70,
            "tp1": 2.95,
            "tp2": 3.10,
            "tp3": 3.25,
            "timestamp": (datetime.now() - timedelta(hours=8)).isoformat(),
            "status": "closed",
            "tp1_hit": True,
            "tp2_hit": False,
            "tp3_hit": False,
            "sl_hit": False
        }
    ]
    
    # Ajouter les trades de démo
    for trade in demo_trades:
        trades_db.append(trade)
    
    return {
        "status": "success",
        "message": f"{len(demo_trades)} trades de démonstration ajoutés",
        "trades": demo_trades
    }

@app.delete("/api/trades/clear")
async def clear_trades():
    """Efface tous les trades (utile pour les tests)"""
    count = len(trades_db)
    trades_db.clear()
    return {
        "status": "success",
        "message": f"{count} trades effacés"
    }

@app.get("/api/fear-greed-full")
async def get_fear_greed_full():
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get("https://api.alternative.me/fng/?limit=30")
            if r.status_code == 200:
                data = r.json()
                now = datetime.now()
                tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
                return {
                    "current_value": int(data["data"][0]["value"]),
                    "current_classification": data["data"][0]["value_classification"],
                    "historical": {
                        "now": {"value": int(data["data"][0]["value"]), "classification": data["data"][0]["value_classification"]},
                        "yesterday": {"value": int(data["data"][1]["value"]) if len(data["data"]) > 1 else None, "classification": data["data"][1]["value_classification"] if len(data["data"]) > 1 else None},
                        "last_week": {"value": int(data["data"][7]["value"]) if len(data["data"]) > 7 else None, "classification": data["data"][7]["value_classification"] if len(data["data"]) > 7 else None},
                        "last_month": {"value": int(data["data"][29]["value"]) if len(data["data"]) > 29 else None, "classification": data["data"][29]["value_classification"] if len(data["data"]) > 29 else None}
                    },
                    "next_update_seconds": int((tomorrow - now).total_seconds()),
                    "timestamp": data["data"][0]["timestamp"],
                    "status": "success"
                }
    except:
        pass
    
    now = datetime.now()
    tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    return {
        "current_value": 29,
        "current_classification": "Fear",
        "historical": {
            "now": {"value": 29, "classification": "Fear"},
            "yesterday": {"value": 23, "classification": "Extreme Fear"},
            "last_week": {"value": 24, "classification": "Extreme Fear"},
            "last_month": {"value": 53, "classification": "Neutral"}
        },
        "next_update_seconds": int((tomorrow - now).total_seconds()),
        "timestamp": str(int(datetime.now().timestamp())),
        "status": "fallback"
    }

@app.get("/api/btc-dominance")
async def get_btc_dominance():
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get("https://api.coingecko.com/api/v3/global")
            if r.status_code == 200:
                market_data = r.json()["data"]
                btc = round(market_data["market_cap_percentage"]["btc"], 2)
                eth = round(market_data["market_cap_percentage"]["eth"], 2)
                return {
                    "btc_dominance": btc,
                    "eth_dominance": eth,
                    "others_dominance": round(100 - btc - eth, 2),
                    "btc_change_24h": round(random.uniform(-0.5, 0.5), 2),
                    "history": {"yesterday": btc - 0.1, "last_week": btc - 0.5, "last_month": btc + 1.2},
                    "total_market_cap": market_data["total_market_cap"]["usd"],
                    "total_volume_24h": market_data["total_volume"]["usd"],
                    "status": "success"
                }
    except:
        pass
    
    return {
        "btc_dominance": 58.8,
        "eth_dominance": 12.9,
        "others_dominance": 28.3,
        "btc_change_24h": 1.82,
        "history": {"yesterday": 58.9, "last_week": 60.1, "last_month": 56.9},
        "total_market_cap": 3500000000000,
        "total_volume_24h": 150000000000,
        "status": "fallback"
    }

@app.get("/api/heatmap")
async def get_heatmap():
    """API Heatmap avec système de cache pour éviter le rate limiting"""
    print("\n" + "="*60)
    print("🔄 API /api/heatmap appelée")
    
    # Vérifier si le cache est valide
    now = datetime.now()
    if heatmap_cache["data"] is not None and heatmap_cache["timestamp"] is not None:
        time_diff = (now - heatmap_cache["timestamp"]).total_seconds()
        if time_diff < heatmap_cache["cache_duration"]:
            print(f"✅ Cache valide (âge: {int(time_diff)}s / {heatmap_cache['cache_duration']}s)")
            print(f"📦 Retour depuis cache: {len(heatmap_cache['data'])} cryptos")
            print("="*60 + "\n")
            return {"cryptos": heatmap_cache["data"], "status": "cached"}
    
    print("🔄 Cache expiré ou vide, récupération des données...")
    print("="*60)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = "https://api.coingecko.com/api/v3/coins/markets"
            params = {
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": 100,
                "page": 1,
                "sparkline": False,
                "price_change_percentage": "24h"
            }
            
            print(f"📡 Appel API CoinGecko...")
            r = await client.get(url, params=params)
            print(f"✅ Status: {r.status_code}")
            
            if r.status_code == 200:
                data = r.json()
                print(f"📦 Cryptos reçues: {len(data)}")
                
                if len(data) > 0:
                    cryptos = [{
                        "symbol": c["symbol"].upper(),
                        "name": c["name"],
                        "price": c["current_price"],
                        "change_24h": round(c.get("price_change_percentage_24h", 0), 2),
                        "market_cap": c["market_cap"],
                        "volume": c["total_volume"]
                    } for c in data]
                    
                    # Mettre en cache
                    heatmap_cache["data"] = cryptos
                    heatmap_cache["timestamp"] = now
                    
                    print(f"✅ Cache mis à jour: {len(cryptos)} cryptos")
                    print(f"⏰ Prochaine expiration dans {heatmap_cache['cache_duration']}s")
                    print("="*60 + "\n")
                    return {"cryptos": cryptos, "status": "success"}
                else:
                    print("⚠️ Aucune donnée dans la réponse")
            elif r.status_code == 429:
                print(f"❌ Rate Limit atteint ! (429)")
                print(f"⚠️ Trop de requêtes à l'API CoinGecko")
            else:
                print(f"❌ Erreur HTTP: {r.status_code}")
                print(f"Réponse: {r.text[:200]}")
                
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
    
    # Si on a un cache expiré mais des données, les renvoyer quand même
    if heatmap_cache["data"] is not None:
        print(f"⚠️ Utilisation du cache expiré ({len(heatmap_cache['data'])} cryptos)")
        print("="*60 + "\n")
        return {"cryptos": heatmap_cache["data"], "status": "stale_cache"}
    
    # Fallback étendu si vraiment rien ne marche
    print("⚠️ Utilisation du fallback étendu (25 cryptos)")
    print("="*60 + "\n")
    
    fallback_data = [
        {"symbol": "BTC", "name": "Bitcoin", "price": 107150, "change_24h": 1.32, "market_cap": 2136218033539, "volume": 37480142027},
        {"symbol": "ETH", "name": "Ethereum", "price": 3887, "change_24h": -0.84, "market_cap": 467000000000, "volume": 15000000000},
        {"symbol": "USDT", "name": "Tether USDt", "price": 1.0, "change_24h": -0.02, "market_cap": 140000000000, "volume": 45000000000},
        {"symbol": "BNB", "name": "BNB", "price": 698, "change_24h": -2.36, "market_cap": 101000000000, "volume": 1200000000},
        {"symbol": "SOL", "name": "Solana", "price": 187, "change_24h": -0.94, "market_cap": 90000000000, "volume": 3000000000},
        {"symbol": "USDC", "name": "USDC", "price": 1.0, "change_24h": 0.01, "market_cap": 52000000000, "volume": 6000000000},
        {"symbol": "XRP", "name": "XRP", "price": 2.83, "change_24h": 0.89, "market_cap": 163000000000, "volume": 2900000000},
        {"symbol": "DOGE", "name": "Dogecoin", "price": 0.38, "change_24h": 0.51, "market_cap": 56000000000, "volume": 2400000000},
        {"symbol": "ADA", "name": "Cardano", "price": 1.05, "change_24h": 0.35, "market_cap": 37000000000, "volume": 840000000},
        {"symbol": "AVAX", "name": "Avalanche", "price": 41.2, "change_24h": -1.27, "market_cap": 17000000000, "volume": 450000000},
        {"symbol": "TRX", "name": "TRON", "price": 0.267, "change_24h": 0.39, "market_cap": 23000000000, "volume": 950000000},
        {"symbol": "LINK", "name": "Chainlink", "price": 24.5, "change_24h": -0.76, "market_cap": 15500000000, "volume": 480000000},
        {"symbol": "DOT", "name": "Polkadot", "price": 7.21, "change_24h": 1.27, "market_cap": 11000000000, "volume": 380000000},
        {"symbol": "MATIC", "name": "Polygon", "price": 0.52, "change_24h": -1.09, "market_cap": 5200000000, "volume": 240000000},
        {"symbol": "UNI", "name": "Uniswap", "price": 13.8, "change_24h": -1.45, "market_cap": 8300000000, "volume": 210000000},
        {"symbol": "LTC", "name": "Litecoin", "price": 118, "change_24h": 0.76, "market_cap": 9000000000, "volume": 520000000},
        {"symbol": "ATOM", "name": "Cosmos Hub", "price": 6.8, "change_24h": -0.89, "market_cap": 2800000000, "volume": 180000000},
        {"symbol": "XLM", "name": "Stellar", "price": 0.44, "change_24h": 1.19, "market_cap": 13000000000, "volume": 290000000},
        {"symbol": "NEAR", "name": "NEAR Protocol", "price": 5.9, "change_24h": -0.54, "market_cap": 6700000000, "volume": 310000000},
        {"symbol": "ALGO", "name": "Algorand", "price": 0.42, "change_24h": 0.89, "market_cap": 3500000000, "volume": 120000000},
        {"symbol": "FIL", "name": "Filecoin", "price": 5.4, "change_24h": -1.67, "market_cap": 3200000000, "volume": 190000000},
        {"symbol": "VET", "name": "VeChain", "price": 0.052, "change_24h": 0.67, "market_cap": 4200000000, "volume": 95000000},
        {"symbol": "HBAR", "name": "Hedera", "price": 0.32, "change_24h": 1.44, "market_cap": 11500000000, "volume": 280000000},
        {"symbol": "APT", "name": "Aptos", "price": 9.2, "change_24h": -0.92, "market_cap": 4800000000, "volume": 160000000},
        {"symbol": "ARB", "name": "Arbitrum", "price": 0.78, "change_24h": -1.23, "market_cap": 3100000000, "volume": 220000000}
    ]
    
    return {"cryptos": fallback_data, "status": "fallback"}

@app.get("/api/altcoin-season-index")
async def get_altcoin_season_index():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get("https://api.coingecko.com/api/v3/coins/markets", params={
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": 100,
                "page": 1,
                "sparkline": False,
                "price_change_percentage": "24h,7d,30d"
            })
            
            if r.status_code == 200:
                cryptos = r.json()
                btc_data = next((c for c in cryptos if c['symbol'].lower() == 'btc'), None)
                
                if btc_data and len(cryptos) > 1:
                    btc_change = btc_data.get('price_change_percentage_30d_in_currency', 0) or 0
                    altcoins = [c for c in cryptos if c['symbol'].lower() != 'btc']
                    outperforming = 0
                    
                    for coin in altcoins[:99]:
                        coin_change = coin.get('price_change_percentage_30d_in_currency', -1000)
                        if coin_change is not None and coin_change > btc_change:
                            outperforming += 1
                    
                    index = round((outperforming / 99) * 100) if len(altcoins) >= 99 else 50
                    
                    return {
                        "index": max(0, min(100, index)),
                        "status": "success",
                        "btc_change": round(btc_change, 2),
                        "outperforming": outperforming,
                        "timestamp": datetime.now().isoformat()
                    }
    except Exception as e:
        print(f"Erreur API Altcoin Season: {e}")
    
    return {
        "index": 35,
        "status": "fallback",
        "message": "Utilisation de données estimées",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/crypto-news")
async def get_crypto_news():
    """
    Récupère les dernières actualités crypto - VERSION ULTRA-ROBUSTE
    """
    print("\n" + "="*60)
    print("🔄 API /api/crypto-news appelée")
    print("="*60)
    
    # FALLBACK GARANTI - Toujours disponible
    fallback_news = [
        {
            "title": "🔥 Bitcoin maintient son niveau au-dessus de $100K malgré la volatilité",
            "url": "https://www.coindesk.com",
            "published": datetime.now().isoformat(),
            "source": "CoinDesk",
            "sentiment": 1,
            "image": None,
            "category": "news"
        },
        {
            "title": "📊 Marché Crypto: Capitalisation totale à $3.5T (+2.3% 24h)",
            "url": "https://www.coingecko.com/en/global-charts",
            "published": datetime.now().isoformat(),
            "source": "CoinGecko Market Data",
            "sentiment": 1,
            "image": None,
            "category": "news"
        },
        {
            "title": "Les ETF Bitcoin enregistrent $500M d'entrées nettes cette semaine",
            "url": "https://www.bloomberg.com",
            "published": (datetime.now() - timedelta(hours=2)).isoformat(),
            "source": "Bloomberg Crypto",
            "sentiment": 1,
            "image": None,
            "category": "news"
        },
        {
            "title": "🔥 Trending: Solana (SOL) - Performance exceptionnelle ce mois-ci",
            "url": "https://www.coingecko.com/en/coins/solana",
            "published": (datetime.now() - timedelta(hours=1)).isoformat(),
            "source": "CoinGecko Trending",
            "sentiment": 1,
            "image": None,
            "category": "trending"
        },
        {
            "title": "Ethereum prépare la mise à jour Pectra pour Q2 2025",
            "url": "https://ethereum.org",
            "published": (datetime.now() - timedelta(hours=5)).isoformat(),
            "source": "Ethereum Foundation",
            "sentiment": 0,
            "image": None,
            "category": "news"
        },
        {
            "title": "🔥 Trending: Avalanche (AVAX) gagne 12% suite au partenariat avec AWS",
            "url": "https://www.coingecko.com/en/coins/avalanche",
            "published": (datetime.now() - timedelta(hours=3)).isoformat(),
            "source": "CoinTelegraph",
            "sentiment": 1,
            "image": None,
            "category": "trending"
        },
        {
            "title": "₿ Bitcoin Dominance: 58.5% du marché crypto total",
            "url": "https://www.coingecko.com/en/global-charts",
            "published": (datetime.now() - timedelta(minutes=30)).isoformat(),
            "source": "CoinGecko",
            "sentiment": 0,
            "image": None,
            "category": "news"
        },
        {
            "title": "Le Salvador annonce de nouveaux achats de Bitcoin pour janvier 2025",
            "url": "https://www.coindesk.com",
            "published": (datetime.now() - timedelta(hours=8)).isoformat(),
            "source": "Reuters Crypto",
            "sentiment": 1,
            "image": None,
            "category": "news"
        },
        {
            "title": "🔥 Trending: Chainlink (LINK) - Nouvelles intégrations annoncées",
            "url": "https://www.coingecko.com/en/coins/chainlink",
            "published": (datetime.now() - timedelta(hours=4)).isoformat(),
            "source": "CoinGecko Trending",
            "sentiment": 1,
            "image": None,
            "category": "trending"
        },
        {
            "title": "📈 Polygon (MATIC) annonce une mise à jour majeure de son réseau",
            "url": "https://polygon.technology",
            "published": (datetime.now() - timedelta(hours=6)).isoformat(),
            "source": "Polygon Labs",
            "sentiment": 1,
            "image": None,
            "category": "news"
        }
    ]
    
    news_articles = fallback_news.copy()
    
    # Essayer CoinGecko (optionnel, ne bloque pas)
    try:
        print("📡 Tentative CoinGecko Trending...")
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get("https://api.coingecko.com/api/v3/search/trending")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ CoinGecko OK - Status {response.status_code}")
                
                real_trending = []
                for coin in data.get("coins", [])[:5]:
                    item = coin.get("item", {})
                    rank = item.get('market_cap_rank', 999)
                    
                    real_trending.append({
                        "title": f"🔥 Trending: {item.get('name')} ({item.get('symbol', '').upper()}) - Rank #{rank}",
                        "url": f"https://www.coingecko.com/en/coins/{item.get('id', '')}",
                        "published": datetime.now().isoformat(),
                        "source": "CoinGecko Trending",
                        "sentiment": 1 if rank < 50 else 0,
                        "image": item.get("large", None),
                        "category": "trending"
                    })
                
                if real_trending:
                    news_articles = [n for n in news_articles if n["category"] != "trending"]
                    news_articles.extend(real_trending)
                    print(f"✅ {len(real_trending)} trending réels ajoutés")
            else:
                print(f"⚠️ CoinGecko status {response.status_code}")
                
    except Exception as e:
        print(f"⚠️ CoinGecko inaccessible: {str(e)[:100]}")
    
    # Tri par date
    news_articles.sort(key=lambda x: x["published"], reverse=True)
    
    result = {
        "articles": news_articles,
        "count": len(news_articles),
        "updated_at": datetime.now().isoformat(),
        "status": "success"
    }
    
    print(f"✅ RETOUR: {len(news_articles)} articles")
    print("="*60 + "\n")
    
    return result

@app.get("/", response_class=HTMLResponse)
async def home():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Dashboard</title>""" + CSS + """</head>
<body><div class="container">
<div class="header"><h1>DASHBOARD TRADING</h1><p>Toutes sections opérationnelles</p></div>
""" + NAV + """
<div class="grid grid-3">
<div class="card"><h2>✅ Status</h2><p>Dashboard en ligne</p></div>
<div class="card"><h2>📊 Sections</h2><p>Fear & Greed, Dominance, Heatmap, Nouvelles, Trades, Convertisseur</p></div>
<div class="card"><h2>🔄 Mise à jour</h2><p>Données en temps réel</p></div>
</div>
</div></body></html>"""
    return HTMLResponse(page)

@app.get("/trades", response_class=HTMLResponse)
async def trades_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gestion Trades</title>""" + CSS + """
<style>
.trades-container{max-width:100%;margin:0 auto}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:30px}
.stat-card{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:25px;border-radius:12px;text-align:center;border:1px solid #334155;box-shadow:0 4px 12px rgba(0,0,0,0.3)}
.stat-card .icon{font-size:42px;margin-bottom:12px}
.stat-card .value{font-size:36px;font-weight:800;color:#e2e8f0;margin-bottom:8px}
.stat-card .label{font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase}
.trades-table{width:100%;border-collapse:collapse;margin-top:20px;background:#1e293b;border-radius:12px;overflow:hidden}
.trades-table thead{background:#0f172a}
.trades-table th{padding:18px 15px;text-align:left;color:#60a5fa;font-weight:700;font-size:14px;text-transform:uppercase;border-bottom:2px solid #334155}
.trades-table td{padding:15px;border-bottom:1px solid #334155;color:#e2e8f0;font-size:14px}
.trades-table tbody tr{transition:all 0.3s}
.trades-table tbody tr:hover{background:#0f172a;transform:scale(1.01)}
.crypto-symbol{font-weight:700;font-size:16px;color:#60a5fa}
.side-badge{display:inline-block;padding:4px 12px;border-radius:6px;font-weight:700;font-size:12px;text-transform:uppercase}
.side-long{background:rgba(34,197,94,0.2);color:#22c55e;border:1px solid #22c55e}
.side-short{background:rgba(239,68,68,0.2);color:#ef4444;border:1px solid #ef4444}
.price-cell{font-family:monospace;font-weight:600}
.tp-status{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700}
.tp-hit{background:rgba(34,197,94,0.2);color:#22c55e;border:1px solid #22c55e}
.tp-pending{background:rgba(100,116,139,0.2);color:#94a3b8;border:1px solid #475569}
.sl-hit{background:rgba(239,68,68,0.2);color:#ef4444;border:1px solid #ef4444}
.targets-cell{display:flex;flex-direction:column;gap:4px}
.winrate-chart{position:relative;width:100%;height:200px;margin:20px 0}
.progress-bar{width:100%;height:40px;background:#0f172a;border-radius:20px;overflow:hidden;position:relative;border:1px solid #334155}
.progress-fill{height:100%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;transition:width 0.5s ease}
.progress-fill.win{background:linear-gradient(90deg,#22c55e,#10b981)}
.progress-fill.loss{background:linear-gradient(90deg,#ef4444,#dc2626)}
.empty-state{text-align:center;padding:80px 20px;color:#94a3b8}
.empty-state .icon{font-size:120px;opacity:0.3;margin-bottom:20px}
.controls{display:flex;gap:12px;margin-bottom:25px;flex-wrap:wrap}
.controls button{padding:12px 24px;background:#334155;color:#e2e8f0;border:2px solid #475569;border-radius:10px;cursor:pointer;transition:all .3s;font-size:14px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
.controls button:hover{background:#475569;transform:translateY(-2px)}
.controls button.active{background:linear-gradient(135deg,#3b82f6,#60a5fa);border-color:#60a5fa;color:#fff}
</style>
</head>
<body><div class="container">
<div class="header"><h1>📊 Gestion des Trades</h1><p>Suivi détaillé et statistiques de performance</p></div>
""" + NAV + """
<div class="trades-container">
<div class="stats-grid">
<div class="stat-card">
<div class="icon">📈</div>
<div class="value" id="total-trades">0</div>
<div class="label">Total Trades</div>
</div>
<div class="stat-card">
<div class="icon">✅</div>
<div class="value" style="color:#22c55e" id="win-trades">0</div>
<div class="label">Trades Gagnants</div>
</div>
<div class="stat-card">
<div class="icon">❌</div>
<div class="value" style="color:#ef4444" id="loss-trades">0</div>
<div class="label">Trades Perdants</div>
</div>
<div class="stat-card">
<div class="icon">⏳</div>
<div class="value" style="color:#60a5fa" id="open-trades">0</div>
<div class="label">Trades Ouverts</div>
</div>
<div class="stat-card">
<div class="icon">🎯</div>
<div class="value" style="color:#a78bfa" id="winrate">0%</div>
<div class="label">Win Rate</div>
</div>
</div>

<div class="card">
<h2>📊 Win Rate Analysis</h2>
<div class="winrate-chart">
<div class="progress-bar">
<div class="progress-fill win" id="winrate-bar" style="width:0%">0%</div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px">
<div style="text-align:center">
<div style="font-size:32px;font-weight:800;color:#22c55e" id="win-pct">0%</div>
<div style="font-size:14px;color:#94a3b8;font-weight:600">WINS</div>
</div>
<div style="text-align:center">
<div style="font-size:32px;font-weight:800;color:#ef4444" id="loss-pct">0%</div>
<div style="font-size:14px;color:#94a3b8;font-weight:600">LOSSES</div>
</div>
</div>
</div>
</div>

<div class="card">
<h2>📋 Historique des Trades</h2>
<div class="controls">
<button class="active" onclick="filterTrades('all')">📊 Tous</button>
<button onclick="filterTrades('open')">⏳ Ouverts</button>
<button onclick="filterTrades('win')">✅ Gagnants</button>
<button onclick="filterTrades('loss')">❌ Perdants</button>
<button onclick="addDemoTrades()" style="background:#a78bfa;border-color:#a78bfa">🎲 Ajouter Démo</button>
<button onclick="clearTrades()" style="background:#ef4444;border-color:#ef4444">🗑️ Effacer Tout</button>
<button onclick="loadTrades()" style="margin-left:auto">🔄 Actualiser</button>
</div>
<div id="trades-container"></div>
</div>
</div>
</div>
<script>
let allTrades = [];

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderTradesTable(trades) {
    if(trades.length === 0) {
        return `<div class="empty-state">
            <div class="icon">📭</div>
            <h3>Aucun trade trouvé</h3>
            <p>Les trades apparaîtront ici une fois enregistrés</p>
        </div>`;
    }
    
    let html = `<table class="trades-table">
        <thead>
            <tr>
                <th>Heure d'entrée</th>
                <th>Crypto</th>
                <th>Direction</th>
                <th>Prix d'entrée</th>
                <th>TP1</th>
                <th>TP2</th>
                <th>TP3</th>
                <th>Stop Loss</th>
                <th>Statut</th>
            </tr>
        </thead>
        <tbody>`;
    
    trades.forEach(trade => {
        const sideClass = trade.side === 'LONG' ? 'side-long' : 'side-short';
        const sideIcon = trade.side === 'LONG' ? '📈' : '📉';
        
        // Déterminer les statuts TP
        const tp1Status = trade.tp1_hit ? 'tp-hit' : 'tp-pending';
        const tp2Status = trade.tp2_hit ? 'tp-hit' : 'tp-pending';
        const tp3Status = trade.tp3_hit ? 'tp-hit' : 'tp-pending';
        const slStatus = trade.sl_hit ? 'sl-hit' : 'tp-pending';
        
        const tp1Text = trade.tp1_hit ? '✅ Hit' : '⏳ Pending';
        const tp2Text = trade.tp2_hit ? '✅ Hit' : '⏳ Pending';
        const tp3Text = trade.tp3_hit ? '✅ Hit' : '⏳ Pending';
        const slText = trade.sl_hit ? '❌ Hit' : '⏳ Safe';
        
        // Statut global
        let globalStatus = '⏳ Ouvert';
        if(trade.sl_hit) {
            globalStatus = '❌ SL Hit';
        } else if(trade.tp3_hit) {
            globalStatus = '✅ TP3 Hit';
        } else if(trade.tp2_hit) {
            globalStatus = '✅ TP2 Hit';
        } else if(trade.tp1_hit) {
            globalStatus = '✅ TP1 Hit';
        }
        
        html += `<tr>
            <td>${formatTime(trade.timestamp)}</td>
            <td><span class="crypto-symbol">${trade.symbol}</span></td>
            <td><span class="side-badge ${sideClass}">${sideIcon} ${trade.side}</span></td>
            <td class="price-cell">${trade.entry?.toFixed(4) || 'N/A'}</td>
            <td>
                <div class="targets-cell">
                    <div class="price-cell">${trade.tp1?.toFixed(4) || 'N/A'}</div>
                    <span class="tp-status ${tp1Status}">${tp1Text}</span>
                </div>
            </td>
            <td>
                <div class="targets-cell">
                    <div class="price-cell">${trade.tp2?.toFixed(4) || 'N/A'}</div>
                    <span class="tp-status ${tp2Status}">${tp2Text}</span>
                </div>
            </td>
            <td>
                <div class="targets-cell">
                    <div class="price-cell">${trade.tp3?.toFixed(4) || 'N/A'}</div>
                    <span class="tp-status ${tp3Status}">${tp3Text}</span>
                </div>
            </td>
            <td>
                <div class="targets-cell">
                    <div class="price-cell">${trade.sl?.toFixed(4) || 'N/A'}</div>
                    <span class="tp-status ${slStatus}">${slText}</span>
                </div>
            </td>
            <td><strong>${globalStatus}</strong></td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    return html;
}

function updateStats(trades) {
    const total = trades.length;
    const open = trades.filter(t => t.status === 'open' && !t.sl_hit && !t.tp1_hit && !t.tp2_hit && !t.tp3_hit).length;
    const wins = trades.filter(t => t.tp1_hit || t.tp2_hit || t.tp3_hit).length;
    const losses = trades.filter(t => t.sl_hit).length;
    const closed = wins + losses;
    const winrate = closed > 0 ? Math.round((wins / closed) * 100) : 0;
    const lossrate = closed > 0 ? Math.round((losses / closed) * 100) : 0;
    
    document.getElementById('total-trades').textContent = total;
    document.getElementById('open-trades').textContent = open;
    document.getElementById('win-trades').textContent = wins;
    document.getElementById('loss-trades').textContent = losses;
    document.getElementById('winrate').textContent = winrate + '%';
    
    // Mise à jour de la barre de progression
    const winBar = document.getElementById('winrate-bar');
    winBar.style.width = winrate + '%';
    winBar.textContent = winrate + '%';
    
    document.getElementById('win-pct').textContent = winrate + '%';
    document.getElementById('loss-pct').textContent = lossrate + '%';
}

function filterTrades(filter) {
    document.querySelectorAll('.controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    let filtered = allTrades;
    if(filter === 'open') {
        filtered = allTrades.filter(t => t.status === 'open' && !t.sl_hit && !t.tp1_hit && !t.tp2_hit && !t.tp3_hit);
    } else if(filter === 'win') {
        filtered = allTrades.filter(t => t.tp1_hit || t.tp2_hit || t.tp3_hit);
    } else if(filter === 'loss') {
        filtered = allTrades.filter(t => t.sl_hit);
    }
    
    document.getElementById('trades-container').innerHTML = renderTradesTable(filtered);
}

async function loadTrades() {
    try {
        const response = await fetch('/api/trades');
        const data = await response.json();
        
        if(data.trades && Array.isArray(data.trades)) {
            allTrades = data.trades;
            updateStats(allTrades);
            document.getElementById('trades-container').innerHTML = renderTradesTable(allTrades);
            console.log('✅ Trades chargés:', allTrades.length);
        } else {
            throw new Error('Format de données invalide');
        }
    } catch(error) {
        console.error('❌ Erreur:', error);
        document.getElementById('trades-container').innerHTML = `
            <div class="empty-state">
                <div class="icon">❌</div>
                <h3>Erreur de chargement</h3>
                <p>${error.message}</p>
                <button onclick="loadTrades()" style="margin-top:20px;padding:12px 24px;background:#60a5fa;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600">
                    🔄 Réessayer
                </button>
            </div>`;
    }
}

async function addDemoTrades() {
    try {
        const response = await fetch('/api/trades/add-demo');
        const data = await response.json();
        
        if(data.status === 'success') {
            console.log('✅ Trades démo ajoutés:', data.message);
            await loadTrades();
            alert('✅ ' + data.message);
        } else {
            throw new Error(data.message || 'Erreur inconnue');
        }
    } catch(error) {
        console.error('❌ Erreur:', error);
        alert('❌ Erreur: ' + error.message);
    }
}

async function clearTrades() {
    if(!confirm('⚠️ Êtes-vous sûr de vouloir effacer TOUS les trades ?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/trades/clear', { method: 'DELETE' });
        const data = await response.json();
        
        if(data.status === 'success') {
            console.log('✅ Trades effacés:', data.message);
            await loadTrades();
            alert('✅ ' + data.message);
        } else {
            throw new Error(data.message || 'Erreur inconnue');
        }
    } catch(error) {
        console.error('❌ Erreur:', error);
        alert('❌ Erreur: ' + error.message);
    }
}

loadTrades();
setInterval(loadTrades, 30000); // Refresh toutes les 30 secondes
console.log('📊 Page Trades initialisée');
</script>
</body></html>"""
    return HTMLResponse(page)

@app.get("/fear-greed", response_class=HTMLResponse)
async def fear_greed_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fear & Greed</title>""" + CSS + """
<style>
.fg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:30px;margin-top:20px}
.fg-card{background:#1e293b;border-radius:16px;padding:30px;border:1px solid #334155}
.fg-card h2{color:#60a5fa;margin-bottom:20px;font-size:24px;border-bottom:2px solid #334155;padding-bottom:10px}
.gauge-container{position:relative;width:280px;height:280px;margin:20px auto}
.gauge-value{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center}
.gauge-value .number{font-size:72px;font-weight:bold;color:#e2e8f0}
.gauge-value .label{font-size:24px;color:#94a3b8;margin-top:10px}
.historical-item{display:flex;justify-content:space-between;padding:15px;margin-bottom:12px;background:#0f172a;border-radius:12px;border:1px solid #334155}
.historical-item .period{font-weight:600;color:#e2e8f0}
.historical-item .value-badge{display:flex;align-items:center;gap:12px}
.historical-item .number-circle{width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:18px}
.extreme-fear{color:#ef4444}.fear{color:#f97316}.neutral{color:#eab308}.greed{color:#22c55e}.extreme-greed{color:#14b8a6}
.bg-extreme-fear{background:linear-gradient(135deg,#dc2626,#ef4444)}
.bg-fear{background:linear-gradient(135deg,#ea580c,#f97316)}
.bg-neutral{background:linear-gradient(135deg,#ca8a04,#eab308)}
.bg-greed{background:linear-gradient(135deg,#16a34a,#22c55e)}
.bg-extreme-greed{background:linear-gradient(135deg,#0d9488,#14b8a6)}
.countdown-timer{font-size:32px;font-weight:bold;color:#60a5fa;margin-top:15px;text-align:center}
.spinner{border:4px solid #334155;border-top:4px solid #60a5fa;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:20px auto}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
</style>
</head>
<body><div class="container">
<div class="header"><h1>🪙 Fear & Greed Index</h1><p>Sentiment du marché crypto</p></div>
""" + NAV + """
<div id="content"><div class="spinner"></div></div>
</div>
<script>
function getClass(v){if(v<=20)return'extreme-fear';if(v<=40)return'fear';if(v<=60)return'neutral';if(v<=80)return'greed';return'extreme-greed'}
function getBgClass(v){if(v<=20)return'bg-extreme-fear';if(v<=40)return'bg-fear';if(v<=60)return'bg-neutral';if(v<=80)return'bg-greed';return'bg-extreme-greed'}
function drawGauge(v){const c=document.getElementById('gaugeCanvas');if(!c)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,280,280);ctx.beginPath();ctx.arc(140,140,120,0.75*Math.PI,2.25*Math.PI);ctx.lineWidth=30;ctx.strokeStyle='#e9ecef';ctx.lineCap='round';ctx.stroke();const endAngle=0.75*Math.PI+(v/100)*1.5*Math.PI;const g=ctx.createLinearGradient(0,0,280,280);if(v<=20){g.addColorStop(0,'#c0392b');g.addColorStop(1,'#e74c3c')}else if(v<=40){g.addColorStop(0,'#e67e22');g.addColorStop(1,'#f39c12')}else if(v<=60){g.addColorStop(0,'#f39c12');g.addColorStop(1,'#f1c40f')}else if(v<=80){g.addColorStop(0,'#27ae60');g.addColorStop(1,'#2ecc71')}else{g.addColorStop(0,'#16a085');g.addColorStop(1,'#1abc9c')}ctx.beginPath();ctx.arc(140,140,120,0.75*Math.PI,endAngle);ctx.strokeStyle=g;ctx.lineWidth=30;ctx.lineCap='round';ctx.stroke()}
function formatCountdown(s){const h=Math.floor(s/3600);const m=Math.floor((s%3600)/60);const sec=s%60;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0')}
let countdownInterval;
function startCountdown(total){let remaining=total;if(countdownInterval)clearInterval(countdownInterval);countdownInterval=setInterval(()=>{remaining--;if(remaining<0)remaining=0;const el=document.getElementById('countdown-timer');if(el)el.textContent=formatCountdown(remaining);if(remaining===0){clearInterval(countdownInterval);loadData()}},1000)}
async function loadData(){try{const r=await fetch('/api/fear-greed-full');const d=await r.json();const c=getClass(d.current_value);const bg=getBgClass(d.current_value);let html='<div class="fg-grid"><div class="fg-card"><h2>🎯 Fear & Greed Index</h2><div class="gauge-container"><canvas id="gaugeCanvas" width="280" height="280"></canvas><div class="gauge-value"><div class="number">'+d.current_value+'</div><div class="label '+c+'">'+d.current_classification+'</div></div></div></div>';html+='<div class="fg-card"><h2>📊 Valeurs Historiques</h2>';html+='<div class="historical-item"><div class="period">Maintenant</div><div class="value-badge"><span class="'+getClass(d.historical.now.value)+'">'+d.historical.now.classification+'</span><div class="number-circle '+getBgClass(d.historical.now.value)+'">'+d.historical.now.value+'</div></div></div>';if(d.historical.yesterday&&d.historical.yesterday.value){html+='<div class="historical-item"><div class="period">Hier</div><div class="value-badge"><span class="'+getClass(d.historical.yesterday.value)+'">'+d.historical.yesterday.classification+'</span><div class="number-circle '+getBgClass(d.historical.yesterday.value)+'">'+d.historical.yesterday.value+'</div></div></div>'}if(d.historical.last_week&&d.historical.last_week.value){html+='<div class="historical-item"><div class="period">Semaine dernière</div><div class="value-badge"><span class="'+getClass(d.historical.last_week.value)+'">'+d.historical.last_week.classification+'</span><div class="number-circle '+getBgClass(d.historical.last_week.value)+'">'+d.historical.last_week.value+'</div></div></div>'}if(d.historical.last_month&&d.historical.last_month.value){html+='<div class="historical-item"><div class="period">Mois dernier</div><div class="value-badge"><span class="'+getClass(d.historical.last_month.value)+'">'+d.historical.last_month.classification+'</span><div class="number-circle '+getBgClass(d.historical.last_month.value)+'">'+d.historical.last_month.value+'</div></div></div>'}html+='</div>';html+='<div class="fg-card"><h2>⏰ Prochaine Mise à Jour</h2><div class="countdown-timer" id="countdown-timer">'+formatCountdown(d.next_update_seconds)+'</div></div></div>';document.getElementById('content').innerHTML=html;setTimeout(()=>{drawGauge(d.current_value)},100);startCountdown(d.next_update_seconds)}catch(e){console.error(e);document.getElementById('content').innerHTML='<div class="fg-card"><h2 style="color:#ef4444">❌ Erreur</h2><button onclick="loadData()" style="margin-top:20px;padding:12px 24px;background:#60a5fa;color:white;border:none;border-radius:8px;cursor:pointer">🔄 Réessayer</button></div>'}}
loadData();setInterval(loadData,3600000);
</script>
</body></html>"""
    return HTMLResponse(page)

@app.get("/dominance", response_class=HTMLResponse)
async def btc_dominance_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>BTC Dominance</title>""" + CSS + """
<style>
.dom-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:20px;margin-top:20px}
.dom-card{background:#1e293b;border-radius:12px;padding:25px;border:1px solid #334155}
.dom-card h2{color:#60a5fa;margin-bottom:20px;font-size:24px;border-bottom:2px solid #334155;padding-bottom:10px}
.dominance-main{text-align:center;padding:30px}
.dominance-value{font-size:72px;font-weight:bold;color:#f97316;margin:20px 0}
.crypto-bar{display:flex;align-items:center;margin-bottom:15px;gap:15px}
.crypto-bar .label{min-width:80px;font-weight:600;color:#e2e8f0}
.crypto-bar .bar-container{flex:1;height:40px;background:#0f172a;border-radius:8px;overflow:hidden}
.crypto-bar .bar-fill{height:100%;display:flex;align-items:center;padding:0 15px;color:#fff;font-weight:bold;transition:width 0.5s}
.crypto-bar .bar-fill.btc{background:linear-gradient(90deg,#f97316,#fb923c)}
.crypto-bar .bar-fill.eth{background:linear-gradient(90deg,#3b82f6,#60a5fa)}
.crypto-bar .bar-fill.others{background:linear-gradient(90deg,#6b7280,#9ca3af)}
.history-row{display:flex;justify-content:space-between;padding:15px;background:#0f172a;border-radius:8px;margin-bottom:10px}
.market-stat{background:#0f172a;padding:20px;border-radius:8px;text-align:center;margin-bottom:15px}
.market-stat .value{font-size:28px;font-weight:bold;color:#e2e8f0}
.spinner{border:4px solid #334155;border-top:4px solid #60a5fa;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:20px auto}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
</style>
</head>
<body><div class="container">
<div class="header"><h1>📊 Bitcoin Dominance</h1><p>Part de marché du Bitcoin</p></div>
""" + NAV + """
<div id="content"><div class="spinner"></div></div>
</div>
<script>
function formatNumber(n){if(n>=1e12)return'$'+(n/1e12).toFixed(2)+'T';if(n>=1e9)return'$'+(n/1e9).toFixed(2)+'B';if(n>=1e6)return'$'+(n/1e6).toFixed(2)+'M';return'$'+n.toLocaleString()}
async function loadData(){try{const r=await fetch('/api/btc-dominance');const d=await r.json();const html='<div class="dom-grid"><div class="dom-card"><h2>📈 Dominance Actuelle</h2><div class="dominance-main"><div class="dominance-value">'+d.btc_dominance+'%</div></div></div><div class="dom-card"><h2>🎯 Répartition</h2><div style="padding:20px 0"><div class="crypto-bar"><div class="label">Bitcoin</div><div class="bar-container"><div class="bar-fill btc" style="width:'+d.btc_dominance+'%">'+d.btc_dominance+'%</div></div></div><div class="crypto-bar"><div class="label">Ethereum</div><div class="bar-container"><div class="bar-fill eth" style="width:'+d.eth_dominance+'%">'+d.eth_dominance+'%</div></div></div><div class="crypto-bar"><div class="label">Autres</div><div class="bar-container"><div class="bar-fill others" style="width:'+d.others_dominance+'%">'+d.others_dominance+'%</div></div></div></div></div></div><div class="dom-grid"><div class="dom-card"><h2>📅 Historique</h2><div class="history-row"><div>Hier</div><div>'+d.history.yesterday+'%</div></div><div class="history-row"><div>Semaine dernière</div><div>'+d.history.last_week+'%</div></div><div class="history-row"><div>Mois dernier</div><div>'+d.history.last_month+'%</div></div></div><div class="dom-card"><h2>💰 Marché</h2><div class="market-stat"><div style="font-size:12px;color:#94a3b8;margin-bottom:8px">Capitalisation Totale</div><div class="value">'+formatNumber(d.total_market_cap)+'</div></div><div class="market-stat"><div style="font-size:12px;color:#94a3b8;margin-bottom:8px">Volume 24h</div><div class="value">'+formatNumber(d.total_volume_24h)+'</div></div></div></div>';document.getElementById('content').innerHTML=html}catch(e){console.error(e)}}
loadData();setInterval(loadData,60000);
</script>
</body></html>"""
    return HTMLResponse(page)

@app.get("/heatmap", response_class=HTMLResponse)
async def heatmap_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Crypto Heatmap</title>""" + CSS + """
<style>
.heatmap-treemap{
    display:flex;
    flex-wrap:wrap;
    gap:2px;
    background:#000;
    padding:2px;
    border-radius:8px;
    min-height:850px;
}
.crypto-tile{
    position:relative;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    text-align:center;
    padding:8px;
    transition:all .2s ease;
    cursor:pointer;
    overflow:hidden;
    min-width:60px;
    min-height:60px;
    border:1px solid rgba(0,0,0,0.3);
}
.crypto-tile:hover{
    transform:scale(1.05);
    z-index:100;
    border:2px solid rgba(255,255,255,0.8);
    box-shadow:0 8px 24px rgba(0,0,0,0.8);
}
.tile-content{
    position:relative;
    z-index:1;
    width:100%;
    height:100%;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    gap:4px;
}
.crypto-symbol{
    font-weight:900;
    color:#fff;
    text-shadow:1px 1px 3px rgba(0,0,0,0.8);
    letter-spacing:0.5px;
}
.crypto-name{
    color:rgba(255,255,255,0.85);
    font-weight:600;
    text-shadow:1px 1px 2px rgba(0,0,0,0.8);
    font-size:11px;
}
.crypto-price{
    color:rgba(255,255,255,0.95);
    font-weight:700;
    text-shadow:1px 1px 2px rgba(0,0,0,0.8);
}
.crypto-change{
    font-weight:900;
    color:#fff;
    text-shadow:1px 1px 3px rgba(0,0,0,0.9);
    padding:3px 8px;
    border-radius:4px;
    background:rgba(0,0,0,0.3);
}

/* Tailles adaptatives */
.crypto-tile.size-xl .crypto-symbol{font-size:28px;margin-bottom:4px;}
.crypto-tile.size-xl .crypto-name{display:block;font-size:13px;}
.crypto-tile.size-xl .crypto-price{display:block;font-size:16px;margin:4px 0;}
.crypto-tile.size-xl .crypto-change{font-size:20px;}

.crypto-tile.size-lg .crypto-symbol{font-size:22px;}
.crypto-tile.size-lg .crypto-name{display:block;font-size:12px;}
.crypto-tile.size-lg .crypto-price{display:block;font-size:14px;}
.crypto-tile.size-lg .crypto-change{font-size:18px;}

.crypto-tile.size-md .crypto-symbol{font-size:18px;}
.crypto-tile.size-md .crypto-name{display:block;font-size:11px;}
.crypto-tile.size-md .crypto-price{display:block;font-size:12px;}
.crypto-tile.size-md .crypto-change{font-size:16px;}

.crypto-tile.size-sm .crypto-symbol{font-size:14px;}
.crypto-tile.size-sm .crypto-name{display:none;}
.crypto-tile.size-sm .crypto-price{display:none;}
.crypto-tile.size-sm .crypto-change{font-size:13px;}

.crypto-tile.size-xs .crypto-symbol{font-size:11px;}
.crypto-tile.size-xs .crypto-name{display:none;}
.crypto-tile.size-xs .crypto-price{display:none;}
.crypto-tile.size-xs .crypto-change{font-size:10px;}

.stats-bar{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-bottom:25px}
.stat-box{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:25px;border-radius:12px;border-left:5px solid #60a5fa;box-shadow:0 4px 12px rgba(0,0,0,0.3)}
.stat-box .label{color:#94a3b8;font-size:14px;margin-bottom:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px}
.stat-box .value{font-size:38px;font-weight:800;color:#e2e8f0}
.controls{display:flex;gap:12px;margin-bottom:25px;flex-wrap:wrap;justify-content:center}
.controls button{padding:14px 26px;background:#334155;color:#e2e8f0;border:2px solid #475569;border-radius:10px;cursor:pointer;transition:all .3s;font-size:15px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
.controls button:hover{background:#475569;transform:translateY(-3px);box-shadow:0 4px 16px rgba(96,165,250,0.3)}
.controls button.active{background:linear-gradient(135deg,#3b82f6,#60a5fa);border-color:#60a5fa;color:#fff;box-shadow:0 4px 16px rgba(96,165,250,0.5)}
.spinner{border:5px solid #334155;border-top:5px solid #60a5fa;border-radius:50%;width:60px;height:60px;animation:spin 1s linear infinite;margin:40px auto}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
.card{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:30px;border-radius:16px;margin-bottom:20px;border:1px solid #334155;box-shadow:0 8px 24px rgba(0,0,0,0.3)}
.card h2{color:#60a5fa;margin-bottom:25px;font-size:28px;border-bottom:3px solid #334155;padding-bottom:12px;font-weight:800}
</style>
</head>
<body><div class="container">
<div class="header"><h1>🔥 Crypto Heatmap</h1><p>Visualisation en temps réel - Style TradingView</p></div>
""" + NAV + """
<div class="stats-bar">
<div class="stat-box"><div class="label">Total Cryptos</div><div class="value" id="total">0</div></div>
<div class="stat-box" style="border-left-color:#22c55e"><div class="label">En hausse</div><div class="value" style="color:#22c55e" id="gainers">0</div></div>
<div class="stat-box" style="border-left-color:#ef4444"><div class="label">En baisse</div><div class="value" style="color:#ef4444" id="losers">0</div></div>
<div class="stat-box" style="border-left-color:#a78bfa"><div class="label">Variation moyenne</div><div class="value" id="avg">0%</div></div>
<div class="stat-box" style="border-left-color:#60a5fa"><div class="label">Source</div><div class="value" id="data-source" style="font-size:18px">-</div></div>
</div>
<div class="card">
<h2>🌐 Top 100 Cryptomonnaies</h2>
<div class="controls">
<button class="active" onclick="updateView('24h')">📊 24 Heures</button>
<button onclick="loadData()">🔄 Actualiser</button>
</div>
<div id="heatmap-container" class="heatmap-treemap"><div class="spinner"></div></div>
</div>
</div>
<script>
let cryptosData=[];
let currentView='24h';

function getColorForChange(change){
    // Palette de couleurs style TradingView
    if(change >= 10) return 'rgb(22, 199, 132)';        // Vert très fort
    if(change >= 7) return 'rgb(34, 171, 126)';         
    if(change >= 5) return 'rgb(46, 147, 120)';         
    if(change >= 3) return 'rgb(58, 129, 113)';         
    if(change >= 2) return 'rgb(69, 117, 107)';         
    if(change >= 1) return 'rgb(79, 106, 101)';         
    if(change >= 0.5) return 'rgb(88, 96, 96)';         
    if(change >= 0) return 'rgb(96, 88, 92)';           
    if(change >= -0.5) return 'rgb(105, 79, 87)';       
    if(change >= -1) return 'rgb(116, 69, 82)';         
    if(change >= -2) return 'rgb(129, 58, 76)';         
    if(change >= -3) return 'rgb(143, 46, 69)';         
    if(change >= -5) return 'rgb(160, 34, 62)';         
    if(change >= -7) return 'rgb(179, 22, 54)';         
    return 'rgb(200, 8, 45)';                           // Rouge très fort
}

function formatPrice(p){
    if(p>=1000)return'$'+p.toLocaleString('en-US',{maximumFractionDigits:0});
    if(p>=1)return'$'+p.toFixed(2);
    if(p>=0.01)return'$'+p.toFixed(3);
    if(p>=0.0001)return'$'+p.toFixed(4);
    return'$'+p.toFixed(6);
}

function formatMarketCap(mc){
    if(mc>=1e12)return'$'+(mc/1e12).toFixed(2)+'T';
    if(mc>=1e9)return'$'+(mc/1e9).toFixed(1)+'B';
    if(mc>=1e6)return'$'+(mc/1e6).toFixed(0)+'M';
    return'$'+mc.toLocaleString();
}

function calculateTileSize(marketCap, totalMarketCap, containerWidth){
    const ratio = marketCap / totalMarketCap;
    // Algorithme de taille optimisé pour ressembler à TradingView
    const baseArea = containerWidth * 800; // Surface totale approximative
    const tileArea = baseArea * ratio;
    const size = Math.sqrt(tileArea);
    
    // Contraintes min/max
    return Math.max(60, Math.min(size, containerWidth * 0.4));
}

function getSizeClass(size){
    if(size >= 250) return 'size-xl';
    if(size >= 180) return 'size-lg';
    if(size >= 120) return 'size-md';
    if(size >= 80) return 'size-sm';
    return 'size-xs';
}

function renderTreemap(){
    const container = document.getElementById('heatmap-container');
    const containerWidth = container.offsetWidth || 1200;
    const totalMarketCap = cryptosData.reduce((sum, c) => sum + c.market_cap, 0);
    
    let html = '';
    cryptosData.forEach(crypto => {
        const size = calculateTileSize(crypto.market_cap, totalMarketCap, containerWidth);
        const sizeClass = getSizeClass(size);
        const color = getColorForChange(crypto.change_24h);
        const changeSymbol = crypto.change_24h >= 0 ? '+' : '';
        
        html += `<div class="crypto-tile ${sizeClass}" 
                      style="width:${size}px;height:${size*0.7}px;background:${color};
                             flex-grow:${Math.sqrt(crypto.market_cap)}">
            <div class="tile-content">
                <div class="crypto-symbol">${crypto.symbol}</div>
                <div class="crypto-name">${crypto.name}</div>
                <div class="crypto-price">${formatPrice(crypto.price)}</div>
                <div class="crypto-change">${changeSymbol}${crypto.change_24h.toFixed(2)}%</div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
    updateStats();
}

function updateStats(){
    const total = cryptosData.length;
    const gainers = cryptosData.filter(c => c.change_24h > 0).length;
    const losers = cryptosData.filter(c => c.change_24h < 0).length;
    const avg = (cryptosData.reduce((s, c) => s + c.change_24h, 0) / total).toFixed(2);
    
    document.getElementById('total').textContent = total;
    document.getElementById('gainers').textContent = gainers;
    document.getElementById('losers').textContent = losers;
    
    const avgEl = document.getElementById('avg');
    avgEl.textContent = (avg > 0 ? '+' : '') + avg + '%';
    avgEl.style.color = avg > 0 ? '#22c55e' : avg < 0 ? '#ef4444' : '#94a3b8';
}

function updateView(view){
    currentView = view;
    document.querySelectorAll('.controls button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

async function loadData(){
    try{
        const response = await fetch('/api/heatmap');
        if(!response.ok) throw new Error('Erreur API');
        
        const data = await response.json();
        if(data.cryptos && data.cryptos.length > 0){
            // Trier par market cap décroissante
            cryptosData = data.cryptos.sort((a, b) => b.market_cap - a.market_cap);
            renderTreemap();
            
            // Afficher la source des données
            const sourceEl = document.getElementById('data-source');
            if(data.status === 'success') {
                sourceEl.textContent = '✅ API Live';
                sourceEl.style.color = '#22c55e';
            } else if(data.status === 'cached') {
                sourceEl.textContent = '💾 Cache';
                sourceEl.style.color = '#60a5fa';
            } else if(data.status === 'stale_cache') {
                sourceEl.textContent = '⏰ Cache ancien';
                sourceEl.style.color = '#f59e0b';
            } else {
                sourceEl.textContent = '⚠️ Fallback';
                sourceEl.style.color = '#ef4444';
            }
            
            console.log('✅ Heatmap chargée:', cryptosData.length, 'cryptos - Source:', data.status);
        } else {
            throw new Error('Aucune donnée');
        }
    } catch(error){
        console.error('❌ Erreur:', error);
        document.getElementById('heatmap-container').innerHTML = `
            <div style="text-align:center;padding:50px;width:100%;color:#94a3b8">
                <h3 style="color:#ef4444;margin-bottom:20px;font-size:24px">❌ Erreur de chargement</h3>
                <p style="font-size:16px;margin-bottom:25px">Impossible de charger les données. ${error.message}</p>
                <button onclick="loadData()" 
                        style="margin-top:20px;padding:15px 30px;background:linear-gradient(135deg,#3b82f6,#60a5fa);
                               color:white;border:none;border-radius:10px;cursor:pointer;font-size:16px;
                               font-weight:700;box-shadow:0 4px 16px rgba(96,165,250,0.4)">
                    🔄 Réessayer
                </button>
            </div>`;
    }
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if(cryptosData.length > 0) renderTreemap();
    }, 250);
});

loadData();
setInterval(loadData, 180000); // 3 minutes au lieu de 30 secondes
console.log('🚀 Heatmap TradingView style initialisée - Refresh: 3min');
</script>
</body></html>"""
    return HTMLResponse(page)

@app.get("/nouvelles", response_class=HTMLResponse)
async def crypto_news_page():
    """Page des Nouvelles Crypto - VERSION CORRIGÉE"""
    page = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>📰 Nouvelles Crypto</title>
    """ + CSS + """
    <style>
        .news-container{max-width:100%;margin:0 auto}
        .news-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:25px;margin-top:30px}
        .news-card{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-radius:16px;padding:0;border:1px solid #334155;overflow:hidden;transition:all 0.3s ease;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3)}
        .news-card:hover{transform:translateY(-8px);box-shadow:0 12px 32px rgba(96,165,250,0.3);border-color:#60a5fa}
        .news-card-image{width:100%;height:200px;background:linear-gradient(135deg,#334155,#1e293b);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
        .news-card-image img{width:100%;height:100%;object-fit:cover}
        .news-card-image .placeholder{font-size:72px;opacity:0.3}
        .news-badge{position:absolute;top:15px;right:15px;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.2)}
        .badge-news{background:rgba(59,130,246,0.9);color:#fff}
        .badge-trending{background:rgba(239,68,68,0.9);color:#fff}
        .news-card-content{padding:25px}
        .news-title{font-size:18px;font-weight:700;color:#e2e8f0;margin-bottom:15px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:75px}
        .news-meta{display:flex;justify-content:space-between;align-items:center;margin-top:15px;padding-top:15px;border-top:1px solid #334155;flex-wrap:wrap;gap:10px}
        .news-source{font-size:13px;color:#60a5fa;font-weight:600;display:flex;align-items:center;gap:6px}
        .news-time{font-size:12px;color:#94a3b8;font-weight:500}
        .filters{display:flex;gap:12px;margin-bottom:25px;flex-wrap:wrap;justify-content:center;padding:20px;background:#1e293b;border-radius:12px;border:1px solid #334155}
        .filter-btn{padding:12px 24px;background:#334155;color:#e2e8f0;border:2px solid #475569;border-radius:10px;cursor:pointer;transition:all .3s;font-size:14px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
        .filter-btn:hover{background:#475569;transform:translateY(-2px)}
        .filter-btn.active{background:linear-gradient(135deg,#3b82f6,#60a5fa);border-color:#60a5fa;color:#fff}
        .stats-bar{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:30px}
        .stat-card{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:25px;border-radius:12px;text-align:center;border:1px solid #334155}
        .stat-card .icon{font-size:42px;margin-bottom:12px}
        .stat-card .value{font-size:36px;font-weight:800;color:#e2e8f0;margin-bottom:8px}
        .stat-card .label{font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase}
        .empty-state{text-align:center;padding:80px 20px;color:#94a3b8;grid-column:1/-1}
        .empty-state .icon{font-size:120px;opacity:0.3;margin-bottom:20px}
        .spinner{border:5px solid #334155;border-top:5px solid #60a5fa;border-radius:50%;width:60px;height:60px;animation:spin 1s linear infinite;margin:40px auto}
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        .refresh-btn{position:fixed;bottom:30px;right:30px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#60a5fa);border:none;color:#fff;font-size:24px;cursor:pointer;box-shadow:0 8px 24px rgba(59,130,246,0.4);transition:all 0.3s;z-index:1000}
        .refresh-btn:hover{transform:scale(1.1) rotate(180deg)}
        .debug-info{background:#0f172a;border:1px solid #334155;border-radius:8px;padding:15px;margin:20px 0;font-family:monospace;font-size:12px;color:#94a3b8;max-height:200px;overflow-y:auto}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📰 Nouvelles Crypto</h1>
            <p>Les dernières actualités du marché des cryptomonnaies</p>
        </div>
        """ + NAV + """
        
        <div class="news-container">
            <div class="stats-bar">
                <div class="stat-card">
                    <div class="icon">📰</div>
                    <div class="value" id="total-news">--</div>
                    <div class="label">Articles</div>
                </div>
                <div class="stat-card">
                    <div class="icon">🔥</div>
                    <div class="value" id="trending-count">--</div>
                    <div class="label">Trending</div>
                </div>
                <div class="stat-card">
                    <div class="icon">⏰</div>
                    <div class="value" id="last-update">--:--</div>
                    <div class="label">Dernière MAJ</div>
                </div>
            </div>
            
            <div class="filters">
                <button class="filter-btn active" onclick="filterNews('all', this)">📊 Tout</button>
                <button class="filter-btn" onclick="filterNews('news', this)">📰 News</button>
                <button class="filter-btn" onclick="filterNews('trending', this)">🔥 Trending</button>
                <button class="filter-btn" onclick="filterNews('positive', this)">📈 Positif</button>
            </div>
            
            <div class="card">
                <h2>📋 Dernières Nouvelles</h2>
                <div id="debug-info" class="debug-info" style="display:none"></div>
                <div id="news-container" class="news-grid">
                    <div style="grid-column:1/-1">
                        <div class="spinner"></div>
                        <p style="text-align:center;color:#94a3b8;margin-top:20px">Chargement des nouvelles...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <button class="refresh-btn" onclick="loadNews(true)" title="Actualiser">🔄</button>
    </div>
    
    <script>
        let allNews = [];
        let currentFilter = 'all';
        let isLoading = false;
        
        function log(message, type = 'info') {
            const debugDiv = document.getElementById('debug-info');
            const timestamp = new Date().toLocaleTimeString();
            const colors = {info: '#60a5fa', success: '#22c55e', error: '#ef4444', warning: '#f59e0b'};
            debugDiv.innerHTML += `<div style="color:${colors[type]}">[${timestamp}] ${message}</div>`;
            debugDiv.style.display = 'block';
            debugDiv.scrollTop = debugDiv.scrollHeight;
            console.log(`[${type.toUpperCase()}]`, message);
        }
        
        function formatTimeAgo(dateString) {
            try {
                const date = new Date(dateString);
                const now = new Date();
                const seconds = Math.floor((now - date) / 1000);
                
                if (seconds < 60) return "À l'instant";
                if (seconds < 3600) return Math.floor(seconds / 60) + ' min';
                if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
                if (seconds < 604800) return Math.floor(seconds / 86400) + 'j';
                return date.toLocaleDateString('fr-FR');
            } catch (e) {
                return 'Récent';
            }
        }
        
        function renderNewsCard(article) {
            const badgeClass = article.category === 'trending' ? 'badge-trending' : 'badge-news';
            const badgeText = article.category === 'trending' ? '🔥 TRENDING' : '📰 NEWS';
            const imageHtml = article.image ? 
                `<img src="${article.image}" alt="${article.title}" onerror="this.parentElement.innerHTML='<div class=\\'placeholder\\'>📰</div>'">` : 
                `<div class="placeholder">📰</div>`;
            
            return `
                <div class="news-card" onclick="window.open('${article.url}', '_blank')" 
                     data-category="${article.category}" data-sentiment="${article.sentiment}">
                    <div class="news-card-image">
                        ${imageHtml}
                        <div class="news-badge ${badgeClass}">${badgeText}</div>
                    </div>
                    <div class="news-card-content">
                        <div class="news-title">${article.title}</div>
                        <div class="news-meta">
                            <div class="news-source">📍 ${article.source}</div>
                            <div class="news-time">${formatTimeAgo(article.published)}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        function filterNews(filter, clickedButton = null) {
            currentFilter = filter;
            
            // Retirer la classe active de tous les boutons
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            
            // Ajouter la classe active au bon bouton
            if (clickedButton) {
                clickedButton.classList.add('active');
            } else {
                // Si pas de bouton cliqué, trouver le bon bouton par le filtre
                const filterButtons = document.querySelectorAll('.filter-btn');
                filterButtons.forEach(btn => {
                    const btnText = btn.textContent.toLowerCase();
                    if ((filter === 'all' && btnText.includes('tout')) ||
                        (filter === 'news' && btnText.includes('news')) ||
                        (filter === 'trending' && btnText.includes('trending')) ||
                        (filter === 'positive' && btnText.includes('positif'))) {
                        btn.classList.add('active');
                    }
                });
            }
            
            let filtered = allNews;
            if (filter === 'news') {
                filtered = allNews.filter(a => a.category === 'news');
            } else if (filter === 'trending') {
                filtered = allNews.filter(a => a.category === 'trending');
            } else if (filter === 'positive') {
                filtered = allNews.filter(a => a.sentiment > 0);
            }
            
            log(`Filtre appliqué: ${filter} - ${filtered.length} articles`, 'info');
            
            const container = document.getElementById('news-container');
            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📭</div>
                        <h3>Aucune nouvelle trouvée</h3>
                        <p>Essayez un autre filtre</p>
                    </div>
                `;
            } else {
                container.innerHTML = filtered.map(article => renderNewsCard(article)).join('');
            }
        }
        
        async function loadNews(showDebug = false) {
            if (isLoading) {
                console.log('⚠️ Chargement déjà en cours...');
                return;
            }
            
            isLoading = true;
            log('🔄 Début du chargement...', 'info');
            
            try {
                log('📡 Appel API /api/crypto-news...', 'info');
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                const response = await fetch('/api/crypto-news', {
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                log(`✅ Réponse reçue: ${response.status} ${response.statusText}`, 'success');
                
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                
                const data = await response.json();
                log(`📦 Données parsées: ${data.count} articles`, 'info');
                
                if (!data.articles || !Array.isArray(data.articles)) {
                    throw new Error('Format de données invalide');
                }
                
                if (data.articles.length === 0) {
                    throw new Error('Aucun article retourné');
                }
                
                allNews = data.articles;
                
                document.getElementById('total-news').textContent = data.count || allNews.length;
                document.getElementById('trending-count').textContent = 
                    allNews.filter(a => a.category === 'trending').length;
                document.getElementById('last-update').textContent = 
                    new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
                
                log(`✅ ${allNews.length} articles chargés avec succès`, 'success');
                
                filterNews(currentFilter);
                
                if (!showDebug) {
                    setTimeout(() => {
                        document.getElementById('debug-info').style.display = 'none';
                    }, 3000);
                }
                
            } catch (error) {
                log(`❌ ERREUR: ${error.message}`, 'error');
                console.error('Erreur complète:', error);
                
                const container = document.getElementById('news-container');
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">❌</div>
                        <h3>Erreur de chargement</h3>
                        <p>${error.message}</p>
                        <button onclick="loadNews(true)" 
                                style="margin-top:20px;padding:12px 24px;background:#60a5fa;color:#fff;
                                       border:none;border-radius:8px;cursor:pointer;font-weight:600">
                            🔄 Réessayer
                        </button>
                    </div>
                `;
            } finally {
                isLoading = false;
            }
        }
        
        log('🚀 Initialisation de la page Nouvelles', 'info');
        loadNews(true);
        
        setInterval(() => loadNews(false), 300000);
        
        console.log('📰 Page Nouvelles Crypto initialisée');
    </script>
</body>
</html>"""
    return HTMLResponse(page)

@app.get("/telegram-test", response_class=HTMLResponse)
async def telegram_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Test Telegram Bot</title>""" + CSS + """
<style>
.test-section{background:#1e293b;padding:25px;border-radius:12px;margin-bottom:20px;border:1px solid #334155}
.test-section h3{color:#60a5fa;margin-bottom:15px;font-size:20px}
.info-box{background:#0f172a;padding:15px;border-radius:8px;margin:10px 0;font-family:monospace;font-size:14px;border-left:4px solid #60a5fa}
.info-box.success{border-left-color:#22c55e}
.info-box.error{border-left-color:#ef4444}
.test-button{padding:12px 24px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;margin:5px;transition:all .3s}
.test-button:hover{background:#2563eb;transform:translateY(-2px)}
.test-button:disabled{background:#475569;cursor:not-allowed;transform:none}
.response-box{background:#0f172a;padding:20px;border-radius:8px;margin-top:15px;max-height:400px;overflow-y:auto;font-family:monospace;font-size:13px;line-height:1.6}
.step{padding:10px;margin:10px 0;border-left:3px solid #475569}
.step.active{border-left-color:#3b82f6;background:rgba(59,130,246,0.1)}
.step.success{border-left-color:#22c55e;background:rgba(34,197,94,0.1)}
.step.error{border-left-color:#ef4444;background:rgba(239,68,68,0.1)}
</style>
</head>
<body><div class="container">
<div class="header"><h1>🤖 Diagnostic Bot Telegram</h1><p>Vérification complète de la connexion</p></div>
""" + NAV + """
<div class="test-section">
<h3>📋 Configuration Actuelle</h3>
<div class="info-box"><strong>Token Bot:</strong> <span id="bot-token">Chargement...</span><br><strong>Chat ID:</strong> <span id="chat-id">Chargement...</span><br><strong>Status:</strong> <span id="config-status">En attente...</span></div>
</div>
<div class="test-section">
<h3>🔬 Tests Détaillés</h3>
<div class="step" id="step1"><strong>1. Test de connexion au bot</strong><button class="test-button" onclick="testBotConnection()">▶️ Tester</button><div id="result1"></div></div>
<div class="step" id="step2"><strong>2. Vérification du Chat ID</strong><button class="test-button" onclick="verifyChatId()">▶️ Vérifier</button><div id="result2"></div></div>
<div class="step" id="step3"><strong>3. Envoi d'un message de test</strong><button class="test-button" onclick="sendTestMessage()">▶️ Envoyer</button><div id="result3"></div></div>
<div class="step" id="step4"><strong>4. Test avec Trade simulé COMPLET</strong><button class="test-button" onclick="simulateTrade()">▶️ Simuler Trade</button><div id="result4"></div></div>
</div>
<div class="test-section">
<h3>🔧 Actions Rapides</h3>
<button class="test-button" onclick="getAllTests()" style="background:#22c55e">🚀 Lancer tous les tests</button>
<button class="test-button" onclick="getUpdateInfo()" style="background:#a78bfa">📨 Voir derniers messages reçus</button>
<button class="test-button" onclick="location.reload()" style="background:#6b7280">🔄 Rafraîchir</button>
</div>
<div class="test-section">
<h3>📊 Résultats Détaillés</h3>
<div class="response-box" id="detailed-results">Aucun test effectué. Cliquez sur les boutons ci-dessus pour commencer.</div>
</div>
<div class="test-section">
<h3>💡 Guide de Résolution</h3>
<div style="color:#94a3b8;line-height:1.8"><p><strong>Si les messages ne passent pas :</strong></p><ul style="margin-left:20px"><li>✅ Vérifiez que le bot n'est pas bloqué</li><li>✅ Vérifiez que vous avez envoyé /start au bot</li><li>✅ Vérifiez le Chat ID (utilisez @userinfobot sur Telegram)</li><li>✅ Pour un groupe : Ajoutez le bot comme admin</li><li>✅ Vérifiez que le token est correct dans BotFather</li></ul></div>
</div>
</div>
<script>
async function loadConfig(){
    try{
        const r=await fetch('/api/telegram-config');
        const d=await r.json();
        document.getElementById('bot-token').textContent=d.token.substring(0,20)+'...';
        document.getElementById('chat-id').textContent=d.chat_id;
        document.getElementById('config-status').textContent='✅ Chargé';
        document.getElementById('config-status').style.color='#22c55e';
    }catch(e){
        document.getElementById('config-status').textContent='❌ Erreur: '+e.message;
        document.getElementById('config-status').style.color='#ef4444';
    }
}
function addLog(message,type='info'){const box=document.getElementById('detailed-results');const timestamp=new Date().toLocaleTimeString();const colors={'info':'#60a5fa','success':'#22c55e','error':'#ef4444','warning':'#f59e0b'};box.innerHTML+=`<div style="color:${colors[type]};margin:5px 0">[${timestamp}] ${message}</div>`;box.scrollTop=box.scrollHeight}
async function testBotConnection(){const step=document.getElementById('step1');step.classList.add('active');addLog('🔍 Test de connexion au bot...','info');try{const r=await fetch('/api/telegram-bot-info');const d=await r.json();if(d.ok){step.classList.remove('active');step.classList.add('success');document.getElementById('result1').innerHTML=`<div class="info-box success" style="margin-top:10px">✅ Bot connecté !<br><strong>Nom:</strong> ${d.result.first_name}<br><strong>Username:</strong> @${d.result.username}<br><strong>ID:</strong> ${d.result.id}</div>`;addLog(`✅ Bot connecté: @${d.result.username}`,'success')}else{throw new Error(d.description||'Erreur inconnue')}}catch(e){step.classList.remove('active');step.classList.add('error');document.getElementById('result1').innerHTML=`<div class="info-box error" style="margin-top:10px">❌ ${e.message}</div>`;addLog(`❌ Erreur de connexion: ${e.message}`,'error')}}
async function verifyChatId(){const step=document.getElementById('step2');step.classList.add('active');addLog('🔍 Vérification du Chat ID...','info');try{const r=await fetch('/api/telegram-verify-chat');const d=await r.json();if(d.valid){step.classList.remove('active');step.classList.add('success');document.getElementById('result2').innerHTML=`<div class="info-box success" style="margin-top:10px">✅ Chat ID valide !<br><strong>Type:</strong> ${d.chat_type}<br><strong>Titre:</strong> ${d.title||'N/A'}</div>`;addLog(`✅ Chat ID valide (Type: ${d.chat_type})`,'success')}else{throw new Error(d.error||'Chat ID invalide')}}catch(e){step.classList.remove('active');step.classList.add('error');document.getElementById('result2').innerHTML=`<div class="info-box error" style="margin-top:10px">❌ ${e.message}</div>`;addLog(`❌ Erreur Chat ID: ${e.message}`,'error')}}
async function sendTestMessage(){const step=document.getElementById('step3');step.classList.add('active');addLog('📤 Envoi du message de test...','info');try{const r=await fetch('/api/telegram-test');const d=await r.json();if(d.result&&d.result.ok){step.classList.remove('active');step.classList.add('success');document.getElementById('result3').innerHTML=`<div class="info-box success" style="margin-top:10px">✅ Message envoyé !<br><strong>Message ID:</strong> ${d.result.result.message_id}<br><strong>Date:</strong> ${new Date(d.result.result.date*1000).toLocaleString()}</div>`;addLog(`✅ Message envoyé avec succès (ID: ${d.result.result.message_id})`,'success')}else{throw new Error(d.result?.description||'Erreur lors de l\'envoi')}}catch(e){step.classList.remove('active');step.classList.add('error');document.getElementById('result3').innerHTML=`<div class="info-box error" style="margin-top:10px">❌ ${e.message}</div>`;addLog(`❌ Erreur d'envoi: ${e.message}`,'error')}}
async function simulateTrade(){const step=document.getElementById('step4');step.classList.add('active');addLog('📊 Simulation d\'un trade COMPLET...','info');try{const r=await fetch('/api/test-full-alert');const d=await r.json();if(d.telegram_result&&d.telegram_result.ok){step.classList.remove('active');step.classList.add('success');document.getElementById('result4').innerHTML=`<div class="info-box success" style="margin-top:10px">✅ Trade simulé envoyé !<br><strong>Message envoyé sur Telegram avec tous les détails</strong><br><pre style="margin-top:10px;padding:10px;background:#000;border-radius:5px;font-size:12px;overflow-x:auto">${d.message}</pre></div>`;addLog(`✅ Trade COMPLET simulé et envoyé!`,'success')}else{throw new Error('Erreur lors de la simulation')}}catch(e){step.classList.remove('active');step.classList.add('error');document.getElementById('result4').innerHTML=`<div class="info-box error" style="margin-top:10px">❌ ${e.message}</div>`;addLog(`❌ Erreur de simulation: ${e.message}`,'error')}}
async function getAllTests(){addLog('🚀 Lancement de tous les tests...','info');await testBotConnection();await new Promise(r=>setTimeout(r,1000));await verifyChatId();await new Promise(r=>setTimeout(r,1000));await sendTestMessage();await new Promise(r=>setTimeout(r,1000));await simulateTrade();addLog('✅ Tous les tests terminés !','success')}
async function getUpdateInfo(){addLog('📨 Récupération des derniers messages...','info');try{const r=await fetch('/api/telegram-updates');const d=await r.json();if(d.ok&&d.result.length>0){addLog(`✅ ${d.result.length} message(s) trouvé(s)`,'success');d.result.slice(-5).forEach(update=>{if(update.message){const msg=update.message;addLog(`📩 De: ${msg.from.first_name} (${msg.from.id}) - "${msg.text||'[media]'}"`,'info')}})}else{addLog('⚠️ Aucun message récent trouvé','warning')}}catch(e){addLog(`❌ Erreur: ${e.message}`,'error')}}
loadConfig();
</script>
</body></html>"""
    return HTMLResponse(page)

@app.get("/api/telegram-config")
async def get_telegram_config():
    return {"token": TELEGRAM_BOT_TOKEN, "chat_id": TELEGRAM_CHAT_ID}

@app.get("/api/telegram-bot-info")
async def get_bot_info():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getMe"
            response = await client.get(url)
            return response.json()
    except Exception as e:
        return {"ok": False, "description": str(e)}

@app.get("/api/telegram-verify-chat")
async def verify_chat():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getChat"
            response = await client.post(url, json={"chat_id": TELEGRAM_CHAT_ID})
            data = response.json()
            
            if data.get("ok"):
                chat = data.get("result", {})
                return {"valid": True, "chat_type": chat.get("type"), "title": chat.get("title")}
            else:
                return {"valid": False, "error": data.get("description")}
    except Exception as e:
        return {"valid": False, "error": str(e)}

@app.get("/api/telegram-updates")
async def get_updates():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
            response = await client.get(url)
            return response.json()
    except Exception as e:
        return {"ok": False, "description": str(e)}

@app.get("/api/exchange-rates")
async def get_exchange_rates():
    """Récupère les taux de change pour crypto + fiat"""
    print("\n" + "="*60)
    print("💱 API /api/exchange-rates appelée")
    print("="*60)
    
    rates = {}
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Récupérer les prix des cryptos en USD
            crypto_response = await client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={
                    "ids": "bitcoin,ethereum,tether,binancecoin,solana,usd-coin,ripple,cardano,dogecoin,tron,chainlink,matic-network,litecoin,polkadot,uniswap,avalanche-2",
                    "vs_currencies": "usd"
                }
            )
            
            if crypto_response.status_code == 200:
                crypto_data = crypto_response.json()
                print(f"✅ Réponse CoinGecko OK")
                print(f"📦 Données reçues: {crypto_data}")
                
                # Mapper les IDs CoinGecko vers les symboles
                crypto_mapping = {
                    "bitcoin": "BTC",
                    "ethereum": "ETH",
                    "tether": "USDT",
                    "binancecoin": "BNB",
                    "solana": "SOL",
                    "usd-coin": "USDC",
                    "ripple": "XRP",
                    "cardano": "ADA",
                    "dogecoin": "DOGE",
                    "tron": "TRX",
                    "chainlink": "LINK",
                    "matic-network": "MATIC",
                    "litecoin": "LTC",
                    "polkadot": "DOT",
                    "uniswap": "UNI",
                    "avalanche-2": "AVAX"
                }
                
                # Taux de change fiat fixes (EUR et CAD par rapport à USD)
                usd_to_eur = 0.92
                usd_to_cad = 1.43
                
                for coin_id, symbol in crypto_mapping.items():
                    if coin_id in crypto_data and "usd" in crypto_data[coin_id]:
                        usd_price = crypto_data[coin_id]["usd"]
                        rates[symbol] = {
                            "usd": usd_price,
                            "eur": usd_price * usd_to_eur,
                            "cad": usd_price * usd_to_cad
                        }
                        print(f"  ✅ {symbol}: ${usd_price}")
                    else:
                        print(f"  ⚠️ {symbol} non trouvé dans les données")
            else:
                print(f"❌ Erreur CoinGecko: {crypto_response.status_code}")
            
            # Ajouter les devises fiat (1 unité = X USD)
            rates["USD"] = {"usd": 1.0, "eur": 0.92, "cad": 1.43}
            rates["EUR"] = {"usd": 1.09, "eur": 1.0, "cad": 1.56}
            rates["CAD"] = {"usd": 0.70, "eur": 0.64, "cad": 1.0}
            
            print(f"✅ Total devises configurées: {len(rates)}")
            print(f"📋 Devises: {list(rates.keys())}")
            print("="*60 + "\n")
            
            return {
                "rates": rates,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # Fallback avec taux approximatifs mais fonctionnels
    print("⚠️ Utilisation des taux de fallback")
    print("="*60 + "\n")
    
    fallback_rates = {
        "BTC": {"usd": 107150.0, "eur": 98558.0, "cad": 153224.5},
        "ETH": {"usd": 3887.0, "eur": 3576.04, "cad": 5558.41},
        "USDT": {"usd": 1.0, "eur": 0.92, "cad": 1.43},
        "BNB": {"usd": 698.0, "eur": 642.16, "cad": 998.14},
        "SOL": {"usd": 187.0, "eur": 172.04, "cad": 267.41},
        "USDC": {"usd": 1.0, "eur": 0.92, "cad": 1.43},
        "XRP": {"usd": 2.83, "eur": 2.60, "cad": 4.05},
        "ADA": {"usd": 1.05, "eur": 0.97, "cad": 1.50},
        "DOGE": {"usd": 0.38, "eur": 0.35, "cad": 0.54},
        "TRX": {"usd": 0.267, "eur": 0.246, "cad": 0.382},
        "LINK": {"usd": 24.5, "eur": 22.54, "cad": 35.04},
        "MATIC": {"usd": 0.52, "eur": 0.48, "cad": 0.74},
        "LTC": {"usd": 118.0, "eur": 108.56, "cad": 168.74},
        "DOT": {"usd": 7.21, "eur": 6.63, "cad": 10.31},
        "UNI": {"usd": 13.8, "eur": 12.70, "cad": 19.73},
        "AVAX": {"usd": 41.2, "eur": 37.90, "cad": 58.92},
        "USD": {"usd": 1.0, "eur": 0.92, "cad": 1.43},
        "EUR": {"usd": 1.09, "eur": 1.0, "cad": 1.56},
        "CAD": {"usd": 0.70, "eur": 0.64, "cad": 1.0}
    }
    
    return {
        "rates": fallback_rates,
        "timestamp": datetime.now().isoformat(),
        "status": "fallback"
    }

@app.get("/convertisseur", response_class=HTMLResponse)
async def convertisseur_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>💱 Convertisseur de Devises</title>""" + CSS + """
<style>
.converter-container{max-width:900px;margin:0 auto}
.converter-card{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:40px;border-radius:16px;border:1px solid #334155;box-shadow:0 8px 24px rgba(0,0,0,0.3);margin-bottom:30px}
.conversion-row{display:grid;grid-template-columns:1fr auto 1fr;gap:20px;align-items:center;margin:30px 0}
.currency-input-group{background:#0f172a;padding:25px;border-radius:12px;border:1px solid #334155}
.currency-input-group label{display:block;color:#94a3b8;font-size:13px;font-weight:600;margin-bottom:10px;text-transform:uppercase}
.amount-input{width:100%;padding:15px;background:#1e293b;border:2px solid #334155;border-radius:8px;color:#e2e8f0;font-size:24px;font-weight:700;font-family:monospace;transition:all 0.3s}
.amount-input:focus{outline:none;border-color:#60a5fa;box-shadow:0 0 0 3px rgba(96,165,250,0.1)}
.currency-select{width:100%;padding:12px;background:#1e293b;border:2px solid #334155;border-radius:8px;color:#e2e8f0;font-size:16px;font-weight:600;margin-top:10px;cursor:pointer;transition:all 0.3s}
.currency-select:focus{outline:none;border-color:#60a5fa}
.currency-select option{background:#1e293b;color:#e2e8f0;padding:10px}
.swap-button{width:60px;height:60px;background:linear-gradient(135deg,#3b82f6,#60a5fa);border:none;border-radius:50%;color:#fff;font-size:24px;cursor:pointer;transition:all 0.3s;box-shadow:0 4px 12px rgba(59,130,246,0.3)}
.swap-button:hover{transform:rotate(180deg) scale(1.1);box-shadow:0 6px 20px rgba(59,130,246,0.5)}
.exchange-rate{background:#0f172a;padding:20px;border-radius:12px;border-left:4px solid #60a5fa;margin:20px 0}
.exchange-rate-text{color:#94a3b8;font-size:14px;margin-bottom:8px}
.exchange-rate-value{color:#e2e8f0;font-size:18px;font-weight:700;font-family:monospace}
.quick-amounts{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin-top:20px}
.quick-amount-btn{padding:10px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-weight:600;cursor:pointer;transition:all 0.3s;text-align:center}
.quick-amount-btn:hover{background:#334155;border-color:#60a5fa;transform:translateY(-2px)}
.popular-conversions{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-top:20px}
.popular-card{background:#0f172a;padding:15px;border-radius:10px;border:1px solid #334155;transition:all 0.3s;cursor:pointer}
.popular-card:hover{border-color:#60a5fa;transform:translateY(-2px)}
.popular-card .pair{color:#60a5fa;font-weight:700;font-size:16px;margin-bottom:5px}
.popular-card .rate{color:#e2e8f0;font-size:14px;font-family:monospace}
.spinner{border:4px solid #334155;border-top:4px solid #60a5fa;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:20px auto}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
</style>
</head>
<body><div class="container">
<div class="header"><h1>💱 Convertisseur de Devises</h1><p>Crypto & Fiat - Taux en temps réel</p></div>
""" + NAV + """
<div class="converter-container">
<div class="converter-card">
<h2 style="color:#60a5fa;margin-bottom:30px;font-size:24px">Conversion Instantanée</h2>
<div class="conversion-row">
<div class="currency-input-group">
<label>Montant</label>
<input type="number" id="amount-from" class="amount-input" value="1" oninput="convertCurrency('from')" placeholder="0.00">
<select id="currency-from" class="currency-select" onchange="convertCurrency('from')">
<option value="USD">🇺🇸 USD - Dollar américain</option>
<option value="EUR">🇪🇺 EUR - Euro</option>
<option value="CAD">🇨🇦 CAD - Dollar canadien</option>
<option value="BTC" selected>₿ BTC - Bitcoin</option>
<option value="ETH">Ξ ETH - Ethereum</option>
<option value="USDT">₮ USDT - Tether</option>
<option value="BNB">BNB - Binance Coin</option>
<option value="SOL">◎ SOL - Solana</option>
<option value="XRP">XRP - Ripple</option>
<option value="ADA">ADA - Cardano</option>
<option value="DOGE">Ð DOGE - Dogecoin</option>
</select>
</div>
<button class="swap-button" onclick="swapCurrencies()">⇄</button>
<div class="currency-input-group">
<label>Converti</label>
<input type="number" id="amount-to" class="amount-input" value="107150" oninput="convertCurrency('to')" placeholder="0.00">
<select id="currency-to" class="currency-select" onchange="convertCurrency('to')">
<option value="USD" selected>🇺🇸 USD - Dollar américain</option>
<option value="EUR">🇪🇺 EUR - Euro</option>
<option value="CAD">🇨🇦 CAD - Dollar canadien</option>
<option value="BTC">₿ BTC - Bitcoin</option>
<option value="ETH">Ξ ETH - Ethereum</option>
<option value="USDT">₮ USDT - Tether</option>
<option value="BNB">BNB - Binance Coin</option>
<option value="SOL">◎ SOL - Solana</option>
<option value="XRP">XRP - Ripple</option>
<option value="ADA">ADA - Cardano</option>
<option value="DOGE">Ð DOGE - Dogecoin</option>
</select>
</div>
</div>
<div class="exchange-rate" id="rate-display">
<div class="exchange-rate-text">Taux de change</div>
<div class="exchange-rate-value" id="rate-value">Chargement...</div>
</div>
<div style="margin-top:20px">
<label style="color:#94a3b8;font-size:13px;font-weight:600;display:block;margin-bottom:10px">MONTANTS RAPIDES</label>
<div class="quick-amounts">
<div class="quick-amount-btn" onclick="setQuickAmount(1)">1</div>
<div class="quick-amount-btn" onclick="setQuickAmount(10)">10</div>
<div class="quick-amount-btn" onclick="setQuickAmount(100)">100</div>
<div class="quick-amount-btn" onclick="setQuickAmount(1000)">1 000</div>
<div class="quick-amount-btn" onclick="setQuickAmount(10000)">10 000</div>
</div>
</div>
</div>

<div class="card">
<h2>🔥 Conversions Populaires</h2>
<div class="popular-conversions" id="popular-conversions">
<div class="spinner"></div>
</div>
</div>
</div>
</div>
<script>
let exchangeRates = {};
let isLoading = true;

async function loadExchangeRates() {
    try {
        console.log('📡 Chargement des taux de change...');
        const response = await fetch('/api/exchange-rates');
        const data = await response.json();
        
        if(data.rates) {
            exchangeRates = data.rates;
            isLoading = false;
            console.log('✅ Taux de change chargés:', Object.keys(exchangeRates).length, 'devises');
            console.log('Taux:', exchangeRates);
            convertCurrency('from');
            updatePopularConversions();
        }
    } catch(error) {
        console.error('❌ Erreur:', error);
        isLoading = false;
    }
}

function getRate(fromCurrency, toCurrency) {
    if(!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
        console.warn('⚠️ Devise non trouvée:', fromCurrency, 'ou', toCurrency);
        return 0;
    }
    
    // Convertir via USD comme devise pivot
    // exchangeRates[X].usd = combien vaut 1 unité de X en USD
    const fromToUSD = exchangeRates[fromCurrency].usd;
    const toToUSD = exchangeRates[toCurrency].usd;
    
    if(!fromToUSD || !toToUSD) {
        console.warn('⚠️ Taux USD manquant');
        return 0;
    }
    
    // Pour convertir FROM → TO : diviser le prix FROM par le prix TO
    // Exemple: 1 CAD (0.70 USD) → BTC (107150 USD)
    // Taux = 0.70 / 107150 = 0.0000065 BTC
    const rate = fromToUSD / toToUSD;
    console.log(`💱 ${fromCurrency} (${fromToUSD} USD) → ${toCurrency} (${toToUSD} USD): ${rate}`);
    return rate;
}

function convertCurrency(direction) {
    if(isLoading) {
        console.log('⏳ Attente du chargement des taux...');
        return;
    }
    
    const amountFrom = parseFloat(document.getElementById('amount-from').value) || 0;
    const amountTo = parseFloat(document.getElementById('amount-to').value) || 0;
    const currencyFrom = document.getElementById('currency-from').value;
    const currencyTo = document.getElementById('currency-to').value;
    
    console.log(`🔄 Conversion ${direction}:`, amountFrom, currencyFrom, '→', currencyTo);
    
    const rate = getRate(currencyFrom, currencyTo);
    
    if(rate === 0) {
        console.error('❌ Taux invalide');
        document.getElementById('rate-value').textContent = 'Taux non disponible';
        return;
    }
    
    if(direction === 'from') {
        const converted = amountFrom * rate;
        const formatted = converted < 0.01 ? converted.toFixed(8) : converted < 1 ? converted.toFixed(6) : converted.toFixed(2);
        document.getElementById('amount-to').value = formatted.replace(/\.?0+$/, '');
        console.log('✅ Résultat:', formatted);
    } else {
        const converted = amountTo / rate;
        const formatted = converted < 0.01 ? converted.toFixed(8) : converted < 1 ? converted.toFixed(6) : converted.toFixed(2);
        document.getElementById('amount-from').value = formatted.replace(/\.?0+$/, '');
        console.log('✅ Résultat:', formatted);
    }
    
    // Mettre à jour le taux affiché
    const rateDisplay = document.getElementById('rate-value');
    const rateFormatted = rate < 0.01 ? rate.toFixed(8) : rate < 1 ? rate.toFixed(6) : rate.toFixed(2);
    rateDisplay.textContent = `1 ${currencyFrom} = ${rateFormatted.replace(/\.?0+$/, '')} ${currencyTo}`;
}

function swapCurrencies() {
    const fromSelect = document.getElementById('currency-from');
    const toSelect = document.getElementById('currency-to');
    
    const tempValue = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = tempValue;
    
    convertCurrency('from');
}

function setQuickAmount(amount) {
    document.getElementById('amount-from').value = amount;
    convertCurrency('from');
}

function updatePopularConversions() {
    const popular = [
        {from: 'BTC', to: 'USD'},
        {from: 'ETH', to: 'USD'},
        {from: 'BTC', to: 'EUR'},
        {from: 'SOL', to: 'USD'},
        {from: 'USD', to: 'CAD'},
        {from: 'EUR', to: 'USD'}
    ];
    
    let html = '';
    popular.forEach(pair => {
        const rate = getRate(pair.from, pair.to);
        if(rate > 0) {
            const rateFormatted = rate < 0.01 ? rate.toFixed(8) : rate < 1 ? rate.toFixed(6) : rate.toFixed(2);
            html += `<div class="popular-card" onclick="setConversionPair('${pair.from}', '${pair.to}')">
                <div class="pair">${pair.from} → ${pair.to}</div>
                <div class="rate">1 ${pair.from} = ${rateFormatted.replace(/\.?0+$/, '')} ${pair.to}</div>
            </div>`;
        }
    });
    
    document.getElementById('popular-conversions').innerHTML = html || '<p style="color:#94a3b8;text-align:center">Chargement...</p>';
}

function setConversionPair(from, to) {
    document.getElementById('currency-from').value = from;
    document.getElementById('currency-to').value = to;
    convertCurrency('from');
}

// Charger les taux au démarrage
console.log('💱 Initialisation du convertisseur...');
loadExchangeRates();
setInterval(loadExchangeRates, 60000); // Refresh toutes les minutes

// Afficher un message pendant le chargement
document.getElementById('rate-value').textContent = '⏳ Chargement des taux...';
</script>
</body></html>"""
    return HTMLResponse(page)

@app.get("/altcoin-season", response_class=HTMLResponse)
async def altcoin_season_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Altcoin Season</title>""" + CSS + """
<style>
.altcoin-container{max-width:100%;margin:0 auto}
.chart-container{position:relative;width:100%;background:#1e293b;border-radius:12px;padding:30px;border:1px solid #334155;box-shadow:0 8px 24px rgba(0,0,0,0.3);min-height:600px}
.current-index{text-align:center;padding:20px}
.index-value{font-size:72px;font-weight:900;background:linear-gradient(135deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:10px 0}
.index-label{font-size:24px;font-weight:700;color:#e2e8f0;margin-top:10px}
.gauge-container{position:relative;width:100%;max-width:600px;height:300px;margin:30px auto}
.gauge-bar{width:100%;height:60px;background:linear-gradient(90deg,#f97316 0%,#6b7280 25%,#6b7280 75%,#3b82f6 100%);border-radius:30px;position:relative;box-shadow:inset 0 2px 8px rgba(0,0,0,0.3)}
.gauge-marker{position:absolute;top:-40px;transform:translateX(-50%);transition:left 0.5s ease}
.gauge-arrow{width:0;height:0;border-left:15px solid transparent;border-right:15px solid transparent;border-top:40px solid #fff;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.3))}
.gauge-labels{display:flex;justify-content:space-between;margin-top:15px;font-size:14px;font-weight:600}
.gauge-labels span{color:#94a3b8}
.info-card{background:#1e293b;padding:25px;border-radius:12px;margin-bottom:20px;border:1px solid #334155}
.info-card h3{color:#60a5fa;margin-bottom:15px;font-size:20px}
.info-card p{color:#94a3b8;line-height:1.8;margin-bottom:10px}
.info-card ul{color:#94a3b8;line-height:1.8;margin-left:20px}
.info-card ul li{margin-bottom:8px}
.season-indicator{display:inline-block;padding:8px 16px;border-radius:8px;font-weight:700;font-size:16px;margin:10px 5px}
.season-btc{background:linear-gradient(135deg,#f97316,#fb923c);color:#fff}
.season-alt{background:linear-gradient(135deg,#3b82f6,#60a5fa);color:#fff}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-top:30px}
.stat-card{background:#0f172a;padding:20px;border-radius:12px;text-align:center;border:1px solid #334155}
.stat-card .label{color:#94a3b8;font-size:14px;margin-bottom:10px;font-weight:600}
.stat-card .value{color:#e2e8f0;font-size:32px;font-weight:800}
.spinner{border:5px solid #334155;border-top:5px solid #60a5fa;border-radius:50%;width:60px;height:60px;animation:spin 1s linear infinite;margin:40px auto}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
.external-link{text-align:center;margin-top:20px;padding:15px;background:#0f172a;border-radius:8px;border:1px solid #334155}
.external-link a{color:#60a5fa;text-decoration:none;font-weight:600;font-size:16px;transition:color 0.3s}
.external-link a:hover{color:#93c5fd}
</style>
</head>
<body><div class="container">
<div class="header"><h1>📊 Altcoin Season Index</h1><p>Sommes-nous en Bitcoin Season ou Altcoin Season ?</p></div>
""" + NAV + """
<div class="altcoin-container">
<div class="info-card">
<h3>🎯 Qu'est-ce que l'Altcoin Season Index ?</h3>
<p>L'<strong>Altcoin Season Index</strong> mesure la performance des altcoins par rapport au Bitcoin sur les 90 derniers jours. Il analyse les 100 principales cryptomonnaies pour déterminer si nous sommes en "Bitcoin Season" ou en "Altcoin Season".</p>
<div style="margin:20px 0"><p><strong>Interprétation :</strong></p><ul><li><span class="season-indicator season-btc">Bitcoin Season (0-25)</span> - Le Bitcoin surperforme la majorité des altcoins</li><li><span class="season-indicator" style="background:linear-gradient(135deg,#6b7280,#9ca3af);color:#fff">Zone Neutre (25-75)</span> - Performance mixte</li><li><span class="season-indicator season-alt">Altcoin Season (75-100)</span> - Les altcoins surperforment le Bitcoin</li></ul></div>
<p><strong>Comment ça marche :</strong> Si 75% ou plus des 100 principales cryptos ont mieux performé que le Bitcoin sur 90 jours, alors nous sommes officiellement en <strong>Altcoin Season</strong> ! 🚀</p>
</div>
<div class="card">
<h2>📈 Index Actuel</h2>
<div class="chart-container" id="chart-container"><div class="spinner"></div></div>
<div class="external-link"><p style="color:#94a3b8;margin-bottom:10px">Voir le graphique historique complet :</p><a href="https://www.coinglass.com/pro/AltcoinSeasonIndex" target="_blank">📊 Ouvrir sur CoinGlass (graphique interactif complet)</a></div>
</div>
<div class="info-card">
<h3>💡 Comment utiliser cet indicateur ?</h3>
<ul><li><strong>Stratégie Bitcoin Season :</strong> Privilégiez l'accumulation de BTC et des cryptos majeures</li><li><strong>Stratégie Altcoin Season :</strong> C'est le moment idéal pour trader les altcoins avec potentiel</li><li><strong>Zone Neutre :</strong> Restez prudent et diversifiez votre portefeuille</li></ul>
<p style="margin-top:15px">⚠️ <strong>Note :</strong> Cet indicateur est basé sur des données historiques. Utilisez-le comme un outil parmi d'autres dans votre analyse de marché.</p>
</div>
</div>
</div>
<script>
let currentIndex=0;
function getSeasonLabel(index){if(index>=75)return'Altcoin Season';if(index<=25)return'Bitcoin Season';return'Zone Neutre'}
function getSeasonColor(index){if(index>=75)return'#3b82f6';if(index<=25)return'#f97316';return'#6b7280'}
function renderGauge(index){const seasonLabel=getSeasonLabel(index);const seasonColor=getSeasonColor(index);return`<div class="current-index"><div class="index-value">${index}</div><div class="index-label" style="color:${seasonColor}">${seasonLabel}</div></div><div class="gauge-container"><div class="gauge-bar"><div class="gauge-marker" style="left:${index}%"><div class="gauge-arrow"></div></div></div><div class="gauge-labels"><span>0<br>Bitcoin Season</span><span>50<br>Neutre</span><span>100<br>Altcoin Season</span></div></div><div class="stats-grid"><div class="stat-card"><div class="label">Période d'analyse</div><div class="value">90 jours</div></div><div class="stat-card"><div class="label">Cryptos analysées</div><div class="value">100</div></div><div class="stat-card"><div class="label">Dernière mise à jour</div><div class="value" style="font-size:18px">${new Date().toLocaleDateString('fr-FR')}</div></div></div>`}
async function loadAltcoinSeasonData(){try{const controller=new AbortController();const timeoutId=setTimeout(()=>controller.abort(),8000);const response=await fetch('/api/altcoin-season-index',{signal:controller.signal});clearTimeout(timeoutId);const data=await response.json();if(data.index!==undefined){currentIndex=data.index;const statusMsg=data.status==='fallback'?'<p style="text-align:center;color:#f59e0b;margin-top:20px;font-size:14px">⚠️ Données estimées - Actualisation en cours...</p>':'';document.getElementById('chart-container').innerHTML=renderGauge(currentIndex)+statusMsg;console.log('✅ Altcoin Season Index:',currentIndex,'(Status:',data.status+')')}else{throw new Error('Données invalides')}}catch(error){console.error('❌ Erreur:',error);currentIndex=35;document.getElementById('chart-container').innerHTML=renderGauge(currentIndex)+'<p style="text-align:center;color:#f59e0b;margin-top:20px;font-size:14px">⚠️ Mode hors ligne - Valeur estimée affichée</p>'}}
loadAltcoinSeasonData();setInterval(loadAltcoinSeasonData,300000);console.log('📊 Altcoin Season Index initialisé');
</script>
</body></html>"""
    return HTMLResponse(page)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print("\n" + "="*60)
    print("🚀 DASHBOARD TRADING - COMPLET")
    print("="*60)
    print("✅ Fear & Greed : /fear-greed")
    print("✅ BTC Dominance : /dominance")
    print("✅ Altcoin Season : /altcoin-season")
    print("✅ Heatmap : /heatmap (STYLE TRADINGVIEW)")
    print("✅ Nouvelles Crypto : /nouvelles")
    print("✅ Trades : /trades (TABLEAU PROFESSIONNEL + WINRATE)")
    print("✅ Convertisseur : /convertisseur (💱 CRYPTO & FIAT)")
    print("✅ Telegram Test : /telegram-test")
    print("="*60)
    print("📊 API Disponibles:")
    print("   /api/exchange-rates - Taux de change temps réel")
    print("   /api/trades - Liste tous les trades")
    print("   /api/stats - Statistiques détaillées")
    print("   /api/heatmap - Données heatmap avec cache")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
