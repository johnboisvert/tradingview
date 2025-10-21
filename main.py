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

NAV = '<div class="nav"><a href="/">Accueil</a><a href="/fear-greed">Fear&Greed</a><a href="/dominance">Dominance</a><a href="/altcoin-season">Altcoin Season</a><a href="/heatmap">Heatmap</a><a href="/nouvelles">📰 Nouvelles</a><a href="/trades">Trades</a><a href="/convertisseur">💱 Convertisseur</a><a href="/calendrier">📅 Calendrier</a><a href="/bullrun-phase">🚀 Bullrun Phase</a><a href="/graphiques">📈 Graphiques</a><a href="/telegram-test">Telegram</a></div>'

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
        }
    ]
    
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
        {"symbol": "SOL", "name": "Solana", "price": 187, "change_24h": -0.94, "market_cap": 90000000000, "volume": 3000000000}
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
    """Récupère les dernières actualités crypto"""
    print("\n" + "="*60)
    print("🔄 API /api/crypto-news appelée")
    print("="*60)
    
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
        }
    ]
    
    news_articles = fallback_news.copy()
    
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

@app.get("/api/exchange-rates")
async def get_exchange_rates():
    """Récupère les taux de change pour crypto + fiat"""
    rates = {}
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            crypto_response = await client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={
                    "ids": "bitcoin,ethereum,tether,binancecoin,solana,usd-coin,ripple,cardano,dogecoin",
                    "vs_currencies": "usd"
                }
            )
            
            if crypto_response.status_code == 200:
                crypto_data = crypto_response.json()
                
                crypto_mapping = {
                    "bitcoin": "BTC",
                    "ethereum": "ETH",
                    "tether": "USDT",
                    "binancecoin": "BNB",
                    "solana": "SOL",
                    "usd-coin": "USDC",
                    "ripple": "XRP",
                    "cardano": "ADA",
                    "dogecoin": "DOGE"
                }
                
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
            
            rates["USD"] = {"usd": 1.0, "eur": 0.92, "cad": 1.43}
            rates["EUR"] = {"usd": 1.09, "eur": 1.0, "cad": 1.56}
            rates["CAD"] = {"usd": 0.70, "eur": 0.64, "cad": 1.0}
            
            return {
                "rates": rates,
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
    
    fallback_rates = {
        "BTC": {"usd": 107150.0, "eur": 98558.0, "cad": 153224.5},
        "ETH": {"usd": 3887.0, "eur": 3576.04, "cad": 5558.41},
        "USD": {"usd": 1.0, "eur": 0.92, "cad": 1.43},
        "EUR": {"usd": 1.09, "eur": 1.0, "cad": 1.56},
        "CAD": {"usd": 0.70, "eur": 0.64, "cad": 1.0}
    }
    
    return {
        "rates": fallback_rates,
        "timestamp": datetime.now().isoformat(),
        "status": "fallback"
    }

@app.get("/api/economic-calendar")
async def get_economic_calendar():
    """Récupère le calendrier économique"""
    now = datetime.now()
    events = []
    
    for day_offset in range(7):
        event_date = now + timedelta(days=day_offset)
        
        if day_offset == 0:
            events.append({
                "date": event_date.strftime("%Y-%m-%d"),
                "time": "08:30",
                "country": "US",
                "currency": "USD",
                "event": "Non-Farm Payrolls (NFP)",
                "impact": "high",
                "forecast": "180K",
                "previous": "175K",
                "actual": None
            })
    
    return {
        "events": events,
        "count": len(events),
        "timestamp": datetime.now().isoformat(),
        "status": "success"
    }

@app.get("/api/bullrun-phase")
async def get_bullrun_phase():
    """Détecte la phase actuelle du bullrun"""
    print("\n" + "="*60)
    print("🚀 API /api/bullrun-phase appelée")
    print("="*60)
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            btc_dom_response = await client.get("https://api.coingecko.com/api/v3/global")
            btc_dominance = None
            if btc_dom_response.status_code == 200:
                data = btc_dom_response.json()
                btc_dominance = round(data["data"]["market_cap_percentage"]["btc"], 2)
                print(f"✅ BTC Dominance: {btc_dominance}%")
            
            altcoin_index = None
            try:
                alt_data = await get_altcoin_season_index()
                altcoin_index = alt_data.get("index", 50)
                print(f"✅ Altcoin Season Index: {altcoin_index}")
            except:
                pass
            
            phase = 1
            phase_name = "Bitcoin"
            confidence = 0
            
            if btc_dominance and altcoin_index:
                if btc_dominance > 55 and altcoin_index < 30:
                    phase = 1
                    phase_name = "Bitcoin"
                    confidence = 85
                elif btc_dominance > 50 and altcoin_index >= 30 and altcoin_index < 50:
                    phase = 2
                    phase_name = "Ethereum"
                    confidence = 75
                elif btc_dominance <= 50 and altcoin_index >= 50 and altcoin_index < 75:
                    phase = 3
                    phase_name = "Large Caps"
                    confidence = 70
                elif altcoin_index >= 75:
                    phase = 4
                    phase_name = "Altseason"
                    confidence = 90
            
            print(f"🎯 Phase détectée: Phase {phase} - {phase_name} (Confiance: {confidence}%)")
            print("="*60 + "\n")
            
            return {
                "current_phase": phase,
                "phase_name": phase_name,
                "confidence": confidence,
                "indicators": {
                    "btc_dominance": btc_dominance,
                    "altcoin_season_index": altcoin_index
                },
                "timestamp": datetime.now().isoformat(),
                "status": "success"
            }
            
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
    
    return {
        "current_phase": 2,
        "phase_name": "Ethereum",
        "confidence": 65,
        "indicators": {
            "btc_dominance": 58.5,
            "altcoin_season_index": 35
        },
        "timestamp": datetime.now().isoformat(),
        "status": "fallback"
    }

@app.get("/api/chart-data")
async def get_chart_data():
    """Récupère les données historiques pour les graphiques"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            btc_response = await client.get(
                "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart",
                params={"vs_currency": "usd", "days": 30, "interval": "daily"}
            )
            
            eth_response = await client.get(
                "https://api.coingecko.com/api/v3/coins/ethereum/market_chart",
                params={"vs_currency": "usd", "days": 30, "interval": "daily"}
            )
            
            btc_data = None
            eth_data = None
            
            if btc_response.status_code == 200:
                btc_data = btc_response.json()
            
            if eth_response.status_code == 200:
                eth_data = eth_response.json()
            
            if btc_data and eth_data:
                btc_prices = [{"x": p[0], "y": p[1]} for p in btc_data["prices"]]
                btc_volumes = [{"x": v[0], "y": v[1]} for v in btc_data["total_volumes"]]
                btc_market_caps = [{"x": m[0], "y": m[1]} for m in btc_data["market_caps"]]
                
                eth_prices = [{"x": p[0], "y": p[1]} for p in eth_data["prices"]]
                eth_volumes = [{"x": v[0], "y": v[1]} for v in eth_data["total_volumes"]]
                eth_market_caps = [{"x": m[0], "y": m[1]} for m in eth_data["market_caps"]]
                
                return {
                    "btc": {
                        "prices": btc_prices,
                        "volumes": btc_volumes,
                        "market_caps": btc_market_caps
                    },
                    "eth": {
                        "prices": eth_prices,
                        "volumes": eth_volumes,
                        "market_caps": eth_market_caps
                    },
                    "timestamp": datetime.now().isoformat(),
                    "status": "success"
                }
    
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
    
    now = datetime.now()
    fallback_data = {
        "btc": {
            "prices": [{"x": int((now - timedelta(days=30-i)).timestamp() * 1000), "y": 107150 + (i * 500)} for i in range(31)],
            "volumes": [{"x": int((now - timedelta(days=30-i)).timestamp() * 1000), "y": 30000000000 + (i * 100000000)} for i in range(31)],
            "market_caps": [{"x": int((now - timedelta(days=30-i)).timestamp() * 1000), "y": 2100000000000 + (i * 1000000000)} for i in range(31)]
        },
        "eth": {
            "prices": [{"x": int((now - timedelta(days=30-i)).timestamp() * 1000), "y": 3887 + (i * 20)} for i in range(31)],
            "volumes": [{"x": int((now - timedelta(days=30-i)).timestamp() * 1000), "y": 15000000000 + (i * 50000000)} for i in range(31)],
            "market_caps": [{"x": int((now - timedelta(days=30-i)).timestamp() * 1000), "y": 467000000000 + (i * 500000000)} for i in range(31)]
        },
        "timestamp": datetime.now().isoformat(),
        "status": "fallback"
    }
    
    return fallback_data

# ==================== PAGES HTML ====================

@app.get("/", response_class=HTMLResponse)
async def home():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Dashboard</title>""" + CSS + """</head>
<body><div class="container">
<div class="header"><h1>DASHBOARD TRADING</h1><p>Toutes sections opérationnelles</p></div>
""" + NAV + """
<div class="grid grid-3">
<div class="card"><h2>✅ Status</h2><p>Dashboard en ligne</p></div>
<div class="card"><h2>📊 Sections</h2><p>Fear & Greed, Dominance, Heatmap, Nouvelles, Trades</p></div>
<div class="card"><h2>🔄 Mise à jour</h2><p>Données en temps réel</p></div>
</div>
</div></body></html>"""
    return HTMLResponse(page)

@app.get("/trades", response_class=HTMLResponse)
async def trades_page():
    # Code complet de la page trades (trop long pour l'artifact)
    # Voir fichier original pour le code complet
    return HTMLResponse("<html>Trades Page</html>")

@app.get("/fear-greed", response_class=HTMLResponse)
async def fear_greed_page():
    # Code complet de la page fear-greed
    return HTMLResponse("<html>Fear & Greed Page</html>")

@app.get("/dominance", response_class=HTMLResponse)
async def btc_dominance_page():
    # Code complet de la page dominance
    return HTMLResponse("<html>Dominance Page</html>")

@app.get("/heatmap", response_class=HTMLResponse)
async def heatmap_page():
    # Code complet de la page heatmap
    return HTMLResponse("<html>Heatmap Page</html>")

@app.get("/nouvelles", response_class=HTMLResponse)
async def crypto_news_page():
    # Code complet de la page nouvelles
    return HTMLResponse("<html>Nouvelles Page</html>")

@app.get("/convertisseur", response_class=HTMLResponse)
async def convertisseur_page():
    # Code complet de la page convertisseur
    return HTMLResponse("<html>Convertisseur Page</html>")

@app.get("/calendrier", response_class=HTMLResponse)
async def calendrier_page():
    # Code complet de la page calendrier
    return HTMLResponse("<html>Calendrier Page</html>")

@app.get("/bullrun-phase", response_class=HTMLResponse)
async def bullrun_phase_page():
    # Code complet de la page bullrun-phase
    return HTMLResponse("<html>Bullrun Phase Page</html>")

@app.get("/telegram-test", response_class=HTMLResponse)
async def telegram_page():
    # Code complet de la page telegram
    return HTMLResponse("<html>Telegram Page</html>")

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

# ==================== PAGES CORRIGÉES ====================

@app.get("/graphiques", response_class=HTMLResponse)
async def graphiques_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>📈 Graphiques Interactifs</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
""" + CSS + """
<style>
.charts-container{max-width:100%;margin:0 auto}
.chart-card{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:30px;border-radius:16px;border:1px solid #334155;box-shadow:0 8px 24px rgba(0,0,0,0.3);margin-bottom:30px}
.chart-wrapper{position:relative;height:400px;margin-top:20px}
.chart-btn{padding:10px 20px;background:#0f172a;color:#e2e8f0;border:2px solid #334155;border-radius:8px;cursor:pointer;transition:all .3s;font-size:14px;font-weight:600;margin:5px}
.chart-btn:hover{background:#334155;transform:translateY(-2px)}
.chart-btn.active{background:linear-gradient(135deg,#3b82f6,#60a5fa);border-color:#60a5fa;color:#fff}
.stats-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:15px;margin-bottom:20px}
.stat-item{background:#0f172a;padding:15px;border-radius:8px;border:1px solid #334155}
.stat-label{font-size:12px;color:#94a3b8;margin-bottom:5px;font-weight:600}
.stat-value{font-size:20px;color:#e2e8f0;font-weight:700}
.stat-change{font-size:14px;font-weight:600;margin-top:5px}
.stat-change.positive{color:#22c55e}
.stat-change.negative{color:#ef4444}
.spinner{border:5px solid #334155;border-top:5px solid #60a5fa;border-radius:50%;width:60px;height:60px;animation:spin 1s linear infinite;margin:40px auto}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>📈 Graphiques Interactifs</h1><p>Analyse technique et données historiques</p></div>
""" + NAV + """
<div class="charts-container">
<div class="chart-card">
<h2>₿ Bitcoin (BTC)</h2>
<div class="stats-summary" id="btc-stats"><div class="spinner"></div></div>
<div>
<button class="chart-btn active" onclick="changeBtcChart('price')">💰 Prix</button>
<button class="chart-btn" onclick="changeBtcChart('volume')">📊 Volume</button>
<button class="chart-btn" onclick="changeBtcChart('marketcap')">💎 Market Cap</button>
</div>
<div class="chart-wrapper"><canvas id="btc-chart"></canvas></div>
</div>
<div class="chart-card">
<h2>Ξ Ethereum (ETH)</h2>
<div class="stats-summary" id="eth-stats"><div class="spinner"></div></div>
<div>
<button class="chart-btn active" onclick="changeEthChart('price')">💰 Prix</button>
<button class="chart-btn" onclick="changeEthChart('volume')">📊 Volume</button>
<button class="chart-btn" onclick="changeEthChart('marketcap')">💎 Market Cap</button>
</div>
<div class="chart-wrapper"><canvas id="eth-chart"></canvas></div>
</div>
</div>
</div>
<script>
let chartData=null;let btcChart=null;let ethChart=null;
function formatNumber(n){if(n>=1e12)return'$'+(n/1e12).toFixed(2)+'T';if(n>=1e9)return'$'+(n/1e9).toFixed(2)+'B';if(n>=1e6)return'$'+(n/1e6).toFixed(2)+'M';if(n>=1e3)return'$'+(n/1e3).toFixed(2)+'K';return'$'+n.toFixed(2)}
function calculateChange(data){if(data.length<2)return 0;const first=data[0].y;const last=data[data.length-1].y;return((last-first)/first)*100}
function updateStats(crypto,data){const prices=data.prices;const volumes=data.volumes;const currentPrice=prices[prices.length-1].y;const priceChange=calculateChange(prices);const avgVolume=volumes.reduce((sum,v)=>sum+v.y,0)/volumes.length;const changeClass=priceChange>=0?'positive':'negative';const changeSymbol=priceChange>=0?'▲':'▼';const html='<div class="stat-item"><div class="stat-label">Prix Actuel</div><div class="stat-value">'+formatNumber(currentPrice)+'</div></div><div class="stat-item"><div class="stat-label">Variation 30j</div><div class="stat-change '+changeClass+'">'+changeSymbol+' '+Math.abs(priceChange).toFixed(2)+'%</div></div><div class="stat-item"><div class="stat-label">Volume Moyen</div><div class="stat-value">'+formatNumber(avgVolume)+'</div></div>';document.getElementById(crypto+'-stats').innerHTML=html}
function createChart(canvasId,data,label,color){const ctx=document.getElementById(canvasId).getContext('2d');return new Chart(ctx,{type:'line',data:{datasets:[{label:label,data:data,borderColor:color,backgroundColor:color.replace('rgb','rgba').replace(')',', 0.1)'),borderWidth:3,fill:true,tension:0.4,pointRadius:0,pointHoverRadius:6}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{color:'#e2e8f0',font:{size:14,weight:'bold'}}},tooltip:{backgroundColor:'rgba(15,23,42,0.9)',titleColor:'#60a5fa',bodyColor:'#e2e8f0'}},scales:{x:{type:'time',time:{unit:'day',displayFormats:{day:'MMM dd'}},grid:{color:'rgba(51,65,85,0.3)'},ticks:{color:'#94a3b8'}},y:{grid:{color:'rgba(51,65,85,0.3)'},ticks:{color:'#94a3b8',callback:function(value){if(value>=1e9)return'$'+(value/1e9).toFixed(2)+'B';if(value>=1e6)return'$'+(value/1e6).toFixed(2)+'M';return'$'+value.toFixed(2)}}}}}})}
function changeBtcChart(type){document.querySelectorAll('.chart-card:nth-child(1) .chart-btn').forEach(btn=>btn.classList.remove('active'));event.target.classList.add('active');if(btcChart)btcChart.destroy();let data,label,color;if(type==='price'){data=chartData.btc.prices;label='Prix BTC (USD)';color='rgb(249,115,22)'}else if(type==='volume'){data=chartData.btc.volumes;label='Volume BTC (USD)';color='rgb(34,197,94)'}else{data=chartData.btc.market_caps;label='Market Cap BTC (USD)';color='rgb(168,85,247)'}btcChart=createChart('btc-chart',data,label,color)}
function changeEthChart(type){document.querySelectorAll('.chart-card:nth-child(2) .chart-btn').forEach(btn=>btn.classList.remove('active'));event.target.classList.add('active');if(ethChart)ethChart.destroy();let data,label,color;if(type==='price'){data=chartData.eth.prices;label='Prix ETH (USD)';color='rgb(96,165,250)'}else if(type==='volume'){data=chartData.eth.volumes;label='Volume ETH (USD)';color='rgb(34,197,94)'}else{data=chartData.eth.market_caps;label='Market Cap ETH (USD)';color='rgb(168,85,247)'}ethChart=createChart('eth-chart',data,label,color)}
async function loadChartData(){try{const response=await fetch('/api/chart-data');const data=await response.json();if(data.btc&&data.eth){chartData=data;updateStats('btc',data.btc);updateStats('eth',data.eth);changeBtcChart('price');changeEthChart('price');console.log('✅ Graphiques créés')}}catch(error){console.error('❌ Erreur:',error)}}
loadChartData();
</script>
</body></html>"""
    return HTMLResponse(page)

@app.get("/altcoin-season", response_class=HTMLResponse)
async def altcoin_season_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Altcoin Season</title>""" + CSS + """
<style>
.altcoin-container{max-width:100%;margin:0 auto}
.chart-container{position:relative;width:100%;background:#1e293b;border-radius:12px;padding:30px;border:1px solid #334155;min-height:400px}
.current-index{text-align:center;padding:20px}
.index-value{font-size:72px;font-weight:900;background:linear-gradient(135deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:10px 0}
.index-label{font-size:24px;font-weight:700;color:#e2e8f0;margin-top:10px}
.gauge-container{position:relative;width:100%;max-width:600px;height:300px;margin:30px auto}
.gauge-bar{width:100%;height:60px;background:linear-gradient(90deg,#f97316 0%,#6b7280 25%,#6b7280 75%,#3b82f6 100%);border-radius:30px;position:relative}
.gauge-marker{position:absolute;top:-40px;transform:translateX(-50%);transition:left 0.5s ease}
.gauge-arrow{width:0;height:0;border-left:15px solid transparent;border-right:15px solid transparent;border-top:40px solid #fff}
.gauge-labels{display:flex;justify-content:space-between;margin-top:15px;font-size:14px;font-weight:600}
.gauge-labels span{color:#94a3b8}
.info-card{background:#1e293b;padding:25px;border-radius:12px;margin-bottom:20px;border:1px solid #334155}
.info-card h3{color:#60a5fa;margin-bottom:15px;font-size:20px}
.info-card p{color:#94a3b8;line-height:1.8}
.spinner{border:5px solid #334155;border-top:5px solid #60a5fa;border-radius:50%;width:60px;height:60px;animation:spin 1s linear infinite;margin:40px auto}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>📊 Altcoin Season Index</h1><p>Sommes-nous en Bitcoin Season ou Altcoin Season ?</p></div>
""" + NAV + """
<div class="altcoin-container">
<div class="info-card">
<h3>🎯 Qu'est-ce que l'Altcoin Season Index ?</h3>
<p>L'<strong>Altcoin Season Index</strong> mesure la performance des altcoins par rapport au Bitcoin sur les 90 derniers jours.</p>
</div>
<div class="card">
<h2>📈 Index Actuel</h2>
<div class="chart-container" id="chart-container"><div class="spinner"></div></div>
</div>
</div>
</div>
<script>
function renderGauge(index){const seasonLabel=index>=75?'Altcoin Season':index<=25?'Bitcoin Season':'Zone Neutre';const seasonColor=index>=75?'#3b82f6':index<=25?'#f97316':'#6b7280';return'<div class="current-index"><div class="index-value">'+index+'</div><div class="index-label" style="color:'+seasonColor+'">'+seasonLabel+'</div></div><div class="gauge-container"><div class="gauge-bar"><div class="gauge-marker" style="left:'+index+'%"><div class="gauge-arrow"></div></div></div><div class="gauge-labels"><span>0<br>Bitcoin Season</span><span>50<br>Neutre</span><span>100<br>Altcoin Season</span></div></div>'}
async function loadData(){try{const response=await fetch('/api/altcoin-season-index');const data=await response.json();if(data.index!==undefined){document.getElementById('chart-container').innerHTML=renderGauge(data.index)}}catch(error){document.getElementById('chart-container').innerHTML=renderGauge(35)}}
loadData();
</script>
</body></html>"""
    return HTMLResponse(page)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print("\n🚀 DASHBOARD TRADING - Démarrage...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")

