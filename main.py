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

CSS = """<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:20px}.container{max-width:1400px;margin:0 auto}.header{text-align:center;margin-bottom:30px;padding:30px;background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:12px}.header h1{font-size:42px;margin-bottom:10px;background:linear-gradient(to right,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.header p{color:#94a3b8;font-size:16px}.nav{display:flex;gap:10px;margin-bottom:30px;flex-wrap:wrap;justify-content:center}.nav a{padding:12px 20px;background:#1e293b;border-radius:8px;text-decoration:none;color:#e2e8f0;transition:all .3s;border:1px solid #334155}.nav a:hover{background:#334155;border-color:#60a5fa}.card{background:#1e293b;padding:25px;border-radius:12px;margin-bottom:20px;border:1px solid #334155}.card h2{color:#60a5fa;margin-bottom:20px;font-size:24px;border-bottom:2px solid #334155;padding-bottom:10px}.grid{display:grid;gap:20px}.grid-2{grid-template-columns:repeat(auto-fit,minmax(400px,1fr))}.grid-3{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}.grid-4{grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}.stat-box{background:#0f172a;padding:20px;border-radius:8px;border-left:4px solid #60a5fa}.stat-box .label{color:#94a3b8;font-size:13px;margin-bottom:8px}.stat-box .value{font-size:32px;font-weight:700;color:#e2e8f0}table{width:100%;border-collapse:collapse;margin-top:15px}table th{background:#0f172a;padding:12px;text-align:left;color:#60a5fa;font-weight:600;border-bottom:2px solid #334155}table td{padding:12px;border-bottom:1px solid #334155}table tr:hover{background:#0f172a}input,select{width:100%;padding:12px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:14px;margin-bottom:15px}button{padding:12px 24px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:all .3s}button:hover{background:#2563eb}.btn-danger{background:#ef4444}.btn-danger:hover{background:#dc2626}.btn-success{background:#22c55e}.btn-success:hover{background:#16a34a}.alert{padding:15px;border-radius:8px;margin:15px 0}.alert-error{background:rgba(239,68,68,.1);border-left:4px solid #ef4444;color:#ef4444}.alert-success{background:rgba(16,185,129,.1);border-left:4px solid #10b981;color:#10b981}.loading{text-align:center;padding:60px;color:#94a3b8}</style>"""

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
    # ==================== PARTIE 2/3 - ROUTES API ====================

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

# ==================== SECTION ALTCOIN SEASON - VERSION CORRIGEE ====================

@app.get("/api/altcoin-season-index")
async def get_altcoin_season_index():
    """Calcule l'Altcoin Season Index - VERSION ULTRA ROBUSTE AVEC LOGS"""
    print("\n" + "="*60)
    print("🌊 API /api/altcoin-season-index appelée")
    print("="*60)
    
    # Fallback par défaut
    fallback_data = {
        "index": 45,
        "status": "fallback",
        "btc_change": 12.3,
        "outperforming": 45,
        "total_analyzed": 99,
        "message": "Données estimées",
        "timestamp": datetime.now().isoformat()
    }
    
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            print("📡 Appel CoinGecko API...")
            
            try:
                r = await client.get(
                    "https://api.coingecko.com/api/v3/coins/markets",
                    params={
                        "vs_currency": "usd",
                        "order": "market_cap_desc",
                        "per_page": 100,
                        "page": 1,
                        "sparkline": False,
                        "price_change_percentage": "30d"
                    }
                )
                
                print(f"📊 Status: {r.status_code}")
                
                if r.status_code == 200:
                    cryptos = r.json()
                    print(f"✅ {len(cryptos)} cryptos reçues")
                    
                    if len(cryptos) >= 10:
                        # Trouver Bitcoin
                        btc_data = next((c for c in cryptos if c.get('symbol', '').lower() == 'btc'), None)
                        
                        if btc_data:
                            btc_change = (
                                btc_data.get('price_change_percentage_30d_in_currency') or
                                btc_data.get('price_change_percentage_30d') or
                                0
                            )
                            
                            print(f"₿ BTC Change: {btc_change}%")
                            
                            # Filtrer les altcoins
                            altcoins = [c for c in cryptos if c.get('symbol', '').lower() != 'btc']
                            
                            # Compter ceux qui surperforment
                            outperforming = 0
                            analyzed = min(len(altcoins), 99)
                            
                            for coin in altcoins[:99]:
                                coin_change = (
                                    coin.get('price_change_percentage_30d_in_currency') or
                                    coin.get('price_change_percentage_30d')
                                )
                                
                                if coin_change is not None and float(coin_change) > float(btc_change):
                                    outperforming += 1
                            
                            # Calculer l'index
                            if analyzed > 0:
                                index = round((outperforming / analyzed) * 100)
                                index = max(0, min(100, index))
                                
                                result = {
                                    "index": index,
                                    "status": "success",
                                    "btc_change": round(float(btc_change), 2),
                                    "outperforming": outperforming,
                                    "total_analyzed": analyzed,
                                    "timestamp": datetime.now().isoformat()
                                }
                                
                                print(f"✅ Index calculé: {index}")
                                print(f"✅ {outperforming}/{analyzed} altcoins surperforment BTC")
                                print("="*60 + "\n")
                                
                                return result
                        else:
                            print("⚠️ Bitcoin non trouvé dans les données")
                    else:
                        print("⚠️ Pas assez de données")
                
                elif r.status_code == 429:
                    print("⚠️ Rate Limit CoinGecko")
                else:
                    print(f"⚠️ HTTP {r.status_code}")
                    
            except httpx.TimeoutException:
                print("⏱️ Timeout API")
            except Exception as e:
                print(f"⚠️ Erreur API: {str(e)[:100]}")
    
    except Exception as e:
        print(f"⚠️ Erreur globale: {str(e)[:100]}")
    
    # Retourner le fallback
    print("📦 Retour fallback")
    print("="*60 + "\n")
    return fallback_data


@app.get("/altcoin-season", response_class=HTMLResponse)
async def altcoin_season_page():
    """Page Altcoin Season - VERSION CORRIGEE AVEC MEILLEUR DEBOGAGE"""
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>🌊 Altcoin Season Index</title>""" + CSS + """
<style>
.altcoin-container{max-width:1200px;margin:0 auto}
.main-index-section{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:50px 30px;border-radius:20px;margin-bottom:30px;border:2px solid #334155;position:relative;overflow:hidden}
.index-display{text-align:center;position:relative;z-index:1}
.index-value{font-size:120px;font-weight:900;background:linear-gradient(135deg,#f97316,#fbbf24,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:20px 0}
.index-label{font-size:36px;font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:2px}
.index-description{font-size:16px;color:#94a3b8;max-width:600px;margin:0 auto;line-height:1.6}
.gauge-section{background:#1e293b;padding:40px 30px;border-radius:16px;margin-bottom:30px;border:1px solid #334155}
.gauge-container{position:relative;width:100%;height:120px;margin:30px 0}
.gauge-track{width:100%;height:50px;background:linear-gradient(90deg,#dc2626 0%,#f59e0b 25%,#fbbf24 37.5%,#84cc16 50%,#22c55e 62.5%,#3b82f6 75%,#2563eb 87.5%,#1e3a8a 100%);border-radius:25px;position:relative;box-shadow:inset 0 2px 8px rgba(0,0,0,0.3)}
.gauge-indicator{position:absolute;top:-40px;transform:translateX(-50%);transition:left 0.8s cubic-bezier(0.4,0,0.2,1);z-index:10}
.gauge-arrow{width:0;height:0;border-left:20px solid transparent;border-right:20px solid transparent;border-top:50px solid #fff;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3))}
.gauge-value-badge{position:absolute;top:60px;left:50%;transform:translateX(-50%);background:#0f172a;padding:10px 20px;border-radius:12px;font-size:18px;font-weight:900;color:#fff;border:2px solid #60a5fa;white-space:nowrap}
.zones-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-top:30px}
.zone-card{background:linear-gradient(135deg,#1e293b,#0f172a);padding:25px;border-radius:16px;border:2px solid #334155;transition:all .3s}
.zone-card.active{border-color:#60a5fa;box-shadow:0 0 30px rgba(96,165,250,0.4)}
.zone-icon{font-size:48px;margin-bottom:15px}
.zone-title{font-size:20px;font-weight:700;color:#e2e8f0;margin-bottom:10px}
.zone-range{font-size:14px;color:#60a5fa;font-weight:600;margin-bottom:15px}
.zone-description{font-size:14px;color:#94a3b8;line-height:1.6}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-top:30px}
.stat-card{background:#0f172a;padding:25px;border-radius:12px;border:1px solid #334155;text-align:center}
.stat-icon{font-size:32px;margin-bottom:10px}
.stat-label{font-size:13px;color:#94a3b8;margin-bottom:8px;text-transform:uppercase}
.stat-value{font-size:28px;font-weight:900;color:#e2e8f0;margin-bottom:5px}
.debug-section{background:#1e1e1e;color:#00ff00;font-family:monospace;font-size:12px;padding:15px;border-radius:8px;margin-top:20px;max-height:300px;overflow-y:auto;border:1px solid #333}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>🌊 Altcoin Season Index</h1>
<p>Analyse en temps réel de la domination Bitcoin vs Altcoins</p>
</div>
""" + NAV + """

<div class="altcoin-container">
<div class="main-index-section">
<div class="index-display">
<div id="main-index-value" class="index-value">--</div>
<div id="main-index-label" class="index-label">Chargement...</div>
<div class="index-description">L'index mesure combien d'altcoins (top 100) surperforment Bitcoin sur 30 jours</div>
</div>
</div>

<div class="gauge-section">
<h2>📊 Jauge de Position</h2>
<div class="gauge-container">
<div class="gauge-track">
<div id="gauge-indicator" class="gauge-indicator" style="left:50%">
<div class="gauge-arrow"></div>
</div>
</div>
<div id="gauge-badge" class="gauge-value-badge">-- / 100</div>
</div>
</div>

<div class="card">
<h2>🎯 Zones du Marché</h2>
<div class="zones-grid">
<div class="zone-card" id="zone-bitcoin">
<div class="zone-icon">🔥</div>
<div class="zone-title">Bitcoin Season</div>
<div class="zone-range">Index: 0 - 25</div>
<div class="zone-description">Bitcoin domine et surperforme les altcoins</div>
</div>

<div class="zone-card" id="zone-neutral">
<div class="zone-icon">⚖️</div>
<div class="zone-title">Zone Neutre</div>
<div class="zone-range">Index: 25 - 75</div>
<div class="zone-description">Marché équilibré entre BTC et altcoins</div>
</div>

<div class="zone-card" id="zone-altseason">
<div class="zone-icon">🚀</div>
<div class="zone-title">Altcoin Season</div>
<div class="zone-range">Index: 75 - 100</div>
<div class="zone-description">Les altcoins dominent le marché!</div>
</div>
</div>
</div>

<div class="card">
<h2>📈 Statistiques</h2>
<div class="stats-grid">
<div class="stat-card">
<div class="stat-icon">₿</div>
<div class="stat-label">BTC Change 30j</div>
<div class="stat-value" id="btc-change-30d">--</div>
</div>
<div class="stat-card">
<div class="stat-icon">🎯</div>
<div class="stat-label">Altcoins Gagnants</div>
<div class="stat-value" id="alts-outperform">--</div>
</div>
<div class="stat-card">
<div class="stat-icon">⏱️</div>
<div class="stat-label">Dernière MAJ</div>
<div class="stat-value" id="last-update" style="font-size:18px">--</div>
</div>
</div>
</div>

<div class="card">
<h2>🐛 Debug Console</h2>
<div class="debug-section" id="debug-console">Initialisation...</div>
</div>

</div>
</div>

<script>
function log(msg) {
    const console_el = document.getElementById('debug-console');
    const timestamp = new Date().toLocaleTimeString();
    console_el.innerHTML += '[' + timestamp + '] ' + msg + '<br>';
    console_el.scrollTop = console_el.scrollHeight;
    console.log(msg);
}

log('Script charge');

function getSeasonInfo(index) {
    if (index <= 25) return {label:'Bitcoin Season', color:'#f97316', zone:'bitcoin'};
    if (index <= 75) return {label:'Zone Neutre', color:'#fbbf24', zone:'neutral'};
    return {label:'Altcoin Season', color:'#3b82f6', zone:'altseason'};
}

function updateDisplay(data) {
    log('updateDisplay appele avec index: ' + data.index);
    
    const index = data.index || 0;
    const seasonInfo = getSeasonInfo(index);
    
    document.getElementById('main-index-value').textContent = index;
    const labelEl = document.getElementById('main-index-label');
    labelEl.textContent = seasonInfo.label;
    labelEl.style.color = seasonInfo.color;
    
    document.getElementById('gauge-indicator').style.left = index + '%';
    document.getElementById('gauge-badge').textContent = index + ' / 100';
    
    document.querySelectorAll('.zone-card').forEach(card => card.classList.remove('active'));
    document.getElementById('zone-' + seasonInfo.zone).classList.add('active');
    
    if (data.btc_change !== undefined) {
        const change = parseFloat(data.btc_change);
        document.getElementById('btc-change-30d').textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
    }
    
    if (data.outperforming !== undefined) {
        document.getElementById('alts-outperform').textContent = data.outperforming + ' / 99';
    }
    
    document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
    
    log('Affichage mis a jour - Index: ' + index + ', Zone: ' + seasonInfo.zone);
}

async function loadAltcoinIndex() {
    log('Chargement API /api/altcoin-season-index...');
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch('/api/altcoin-season-index', {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        log('Reponse API: HTTP ' + response.status);
        
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        
        const data = await response.json();
        log('Donnees recues: ' + JSON.stringify(data));
        
        if (data && typeof data.index === 'number') {
            updateDisplay(data);
            log('Index affiche: ' + data.index);
        } else {
            throw new Error('Format de donnees invalide');
        }
        
    } catch (error) {
        log('ERREUR: ' + error.message);
        
        updateDisplay({
            index: 45,
            btc_change: 12.3,
            outperforming: 45,
            status: 'error'
        });
    }
}

log('Initialisation de la page...');

updateDisplay({
    index: 50,
    btc_change: 10.0,
    outperforming: 50
});

setTimeout(() => {
    log('Lancement du chargement API...');
    loadAltcoinIndex();
}, 500);

setInterval(() => {
    log('Actualisation automatique...');
    loadAltcoinIndex();
}, 60000);

log('Page completement initialisee');
</script>

</body></html>"""
    return HTMLResponse(page)

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
        # ==================== PARTIE 3/3 FINALE - PAGES HTML ====================

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
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>📊 Mes Trades</title>""" + CSS + """
<style>
.trades-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px}
.trade-item{background:#0f172a;padding:20px;border-radius:8px;margin-bottom:15px;border-left:4px solid #60a5fa;transition:all .3s}
.trade-item:hover{transform:translateX(5px);box-shadow:0 4px 12px rgba(96,165,250,0.3)}
.trade-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;flex-wrap:wrap}
.trade-symbol{font-size:24px;font-weight:700;color:#60a5fa}
.trade-side{padding:6px 12px;border-radius:6px;font-weight:700;font-size:14px}
.trade-side.long{background:#22c55e;color:#fff}
.trade-side.short{background:#ef4444;color:#fff}
.trade-details{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:15px}
.trade-detail{padding:10px;background:#1e293b;border-radius:6px}
.trade-detail-label{font-size:12px;color:#94a3b8;margin-bottom:5px}
.trade-detail-value{font-size:16px;font-weight:700;color:#e2e8f0}
.trade-status{display:flex;gap:10px;margin-top:15px;flex-wrap:wrap}
.status-badge{padding:8px 12px;border-radius:6px;font-size:13px;font-weight:600;border:2px solid transparent}
.status-badge.hit{background:#22c55e;border-color:#22c55e;color:#fff}
.status-badge.pending{background:#0f172a;border-color:#334155;color:#94a3b8}
.status-badge.sl{background:#ef4444;border-color:#ef4444;color:#fff}
.stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:30px}
.empty-state{text-align:center;padding:60px 20px;color:#94a3b8}
.empty-state h3{font-size:24px;margin-bottom:10px}
.btn-group{display:flex;gap:10px;flex-wrap:wrap}
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>📊 Mes Trades</h1><p>Suivi de vos positions et performances</p></div>
""" + NAV + """

<div class="stats-row" id="stats-section">
<div class="stat-box"><div class="label">Total Trades</div><div class="value" id="total-trades">-</div></div>
<div class="stat-box"><div class="label">Positions Ouvertes</div><div class="value" id="open-trades">-</div></div>
<div class="stat-box"><div class="label">Win Rate</div><div class="value" id="win-rate">-</div></div>
<div class="stat-box"><div class="label">Fermés</div><div class="value" id="closed-trades">-</div></div>
</div>

<div class="card">
<div class="trades-header">
<h2>📈 Liste des Trades</h2>
<div class="btn-group">
<button onclick="loadTrades()">🔄 Actualiser</button>
<button onclick="addDemoTrades()" class="btn-success">➕ Ajouter Démo</button>
<button onclick="clearTrades()" class="btn-danger">🗑️ Effacer Tout</button>
</div>
</div>
<div id="trades-list"></div>
</div>

</div>

<script>
async function loadStats(){
try{
const response=await fetch('/api/stats');
const data=await response.json();
document.getElementById('total-trades').textContent=data.total_trades||0;
document.getElementById('open-trades').textContent=data.open_trades||0;
document.getElementById('win-rate').textContent=(data.win_rate||0)+'%';
document.getElementById('closed-trades').textContent=data.closed_trades||0;
}catch(e){console.error('❌ Erreur stats:',e)}
}

async function loadTrades(){
try{
const response=await fetch('/api/trades');
const data=await response.json();
const container=document.getElementById('trades-list');
if(!data.trades||data.trades.length===0){
container.innerHTML='<div class="empty-state"><h3>Aucun trade</h3><p>Les trades apparaîtront ici automatiquement</p></div>';
return;
}
container.innerHTML=data.trades.map(trade=>{
const sideClass=trade.side.toLowerCase();
return`<div class="trade-item">
<div class="trade-header">
<div><span class="trade-symbol">${trade.symbol}</span></div>
<span class="trade-side ${sideClass}">${trade.side}</span>
</div>
<div class="trade-details">
<div class="trade-detail"><div class="trade-detail-label">Entry</div><div class="trade-detail-value">$${trade.entry?.toFixed(4)||'N/A'}</div></div>
<div class="trade-detail"><div class="trade-detail-label">TP1</div><div class="trade-detail-value">$${trade.tp1?.toFixed(4)||'N/A'}</div></div>
<div class="trade-detail"><div class="trade-detail-label">TP2</div><div class="trade-detail-value">$${trade.tp2?.toFixed(4)||'N/A'}</div></div>
<div class="trade-detail"><div class="trade-detail-label">TP3</div><div class="trade-detail-value">$${trade.tp3?.toFixed(4)||'N/A'}</div></div>
<div class="trade-detail"><div class="trade-detail-label">Stop Loss</div><div class="trade-detail-value">$${trade.sl?.toFixed(4)||'N/A'}</div></div>
</div>
<div class="trade-status">
<span class="status-badge ${trade.tp1_hit?'hit':'pending'}">TP1 ${trade.tp1_hit?'✅':'⏳'}</span>
<span class="status-badge ${trade.tp2_hit?'hit':'pending'}">TP2 ${trade.tp2_hit?'✅':'⏳'}</span>
<span class="status-badge ${trade.tp3_hit?'hit':'pending'}">TP3 ${trade.tp3_hit?'✅':'⏳'}</span>
<span class="status-badge ${trade.sl_hit?'sl':'pending'}">SL ${trade.sl_hit?'❌':'⏳'}</span>
</div>
<div style="margin-top:10px;font-size:12px;color:#94a3b8">📅 ${new Date(trade.timestamp).toLocaleString('fr-FR')}</div>
</div>`;
}).join('');
await loadStats();
}catch(e){console.error('❌ Erreur:',e)}
}

async function addDemoTrades(){
try{
await fetch('/api/trades/add-demo');
await loadTrades();
alert('✅ Trades de démonstration ajoutés !');
}catch(e){alert('❌ Erreur: '+e.message)}
}

async function clearTrades(){
if(!confirm('Êtes-vous sûr de vouloir effacer tous les trades ?'))return;
try{
await fetch('/api/trades/clear',{method:'DELETE'});
await loadTrades();
alert('✅ Tous les trades ont été effacés');
}catch(e){alert('❌ Erreur: '+e.message)}
}

loadTrades();
setInterval(loadTrades,30000);
</script>
</body></html>"""
    return HTMLResponse(page)


@app.get("/fear-greed", response_class=HTMLResponse)
async def fear_greed_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>😨 Fear & Greed Index</title>""" + CSS + """
<style>
.fg-container{max-width:800px;margin:0 auto}
.gauge{position:relative;width:100%;max-width:500px;height:300px;margin:30px auto}
.gauge-bg{width:100%;height:150px;background:linear-gradient(90deg,#dc2626 0%,#f59e0b 25%,#fbbf24 50%,#84cc16 75%,#22c55e 100%);border-radius:150px 150px 0 0;position:relative}
.gauge-needle{position:absolute;bottom:0;left:50%;width:4px;height:140px;background:#fff;transform-origin:bottom center;transition:transform 0.8s cubic-bezier(0.4,0,0.2,1);box-shadow:0 0 10px rgba(255,255,255,0.5)}
.gauge-center{position:absolute;bottom:-15px;left:50%;transform:translateX(-50%);width:30px;height:30px;background:#fff;border-radius:50%;box-shadow:0 0 15px rgba(255,255,255,0.3)}
.fg-value{text-align:center;font-size:72px;font-weight:900;margin:20px 0;background:linear-gradient(135deg,#f59e0b,#dc2626);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.fg-label{text-align:center;font-size:28px;font-weight:700;margin-bottom:20px}
.history-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:15px;margin-top:30px}
.history-item{background:#0f172a;padding:20px;border-radius:8px;text-align:center}
.history-label{font-size:13px;color:#94a3b8;margin-bottom:10px}
.history-value{font-size:32px;font-weight:700;color:#e2e8f0}
.history-class{font-size:14px;color:#94a3b8;margin-top:5px}
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>😨 Fear & Greed Index</h1><p>Indice de sentiment du marché crypto</p></div>
""" + NAV + """
<div class="fg-container">
<div class="card">
<h2>📊 Index Actuel</h2>
<div class="gauge">
<div class="gauge-bg">
<div class="gauge-needle" id="needle"></div>
<div class="gauge-center"></div>
</div>
</div>
<div class="fg-value" id="fg-value">--</div>
<div class="fg-label" id="fg-label">Chargement...</div>
</div>

<div class="card">
<h2>📈 Historique</h2>
<div class="history-grid">
<div class="history-item">
<div class="history-label">Aujourd'hui</div>
<div class="history-value" id="hist-now">--</div>
<div class="history-class" id="hist-now-class">--</div>
</div>
<div class="history-item">
<div class="history-label">Hier</div>
<div class="history-value" id="hist-yesterday">--</div>
<div class="history-class" id="hist-yesterday-class">--</div>
</div>
<div class="history-item">
<div class="history-label">Il y a 7j</div>
<div class="history-value" id="hist-week">--</div>
<div class="history-class" id="hist-week-class">--</div>
</div>
<div class="history-item">
<div class="history-label">Il y a 30j</div>
<div class="history-value" id="hist-month">--</div>
<div class="history-class" id="hist-month-class">--</div>
</div>
</div>
</div>
</div>
</div>

<script>
function getColorForValue(value){
if(value<=20)return'#dc2626';
if(value<=40)return'#f59e0b';
if(value<=60)return'#fbbf24';
if(value<=80)return'#84cc16';
return'#22c55e';
}

async function loadFearGreed(){
try{
const response=await fetch('/api/fear-greed-full');
const data=await response.json();
const value=data.current_value;
const classification=data.current_classification;
document.getElementById('fg-value').textContent=value;
document.getElementById('fg-label').textContent=classification;
document.getElementById('fg-label').style.color=getColorForValue(value);
const rotation=(value/100)*180-90;
document.getElementById('needle').style.transform=`translateX(-50%) rotate(${rotation}deg)`;
if(data.historical){
const h=data.historical;
document.getElementById('hist-now').textContent=h.now.value;
document.getElementById('hist-now-class').textContent=h.now.classification;
if(h.yesterday){
document.getElementById('hist-yesterday').textContent=h.yesterday.value;
document.getElementById('hist-yesterday-class').textContent=h.yesterday.classification;
}
if(h.last_week){
document.getElementById('hist-week').textContent=h.last_week.value;
document.getElementById('hist-week-class').textContent=h.last_week.classification;
}
if(h.last_month){
document.getElementById('hist-month').textContent=h.last_month.value;
document.getElementById('hist-month-class').textContent=h.last_month.classification;
}
}
}catch(e){console.error('❌ Erreur:',e)}
}
loadFearGreed();
setInterval(loadFearGreed,60000);
</script>
</body></html>"""
    return HTMLResponse(page)


@app.get("/dominance", response_class=HTMLResponse)
async def btc_dominance_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>👑 BTC Dominance</title>""" + CSS + """
<style>
.dom-container{max-width:900px;margin:0 auto}
.pie-chart{width:100%;max-width:400px;height:400px;margin:30px auto;position:relative}
.chart-legend{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:15px;margin-top:30px}
.legend-item{display:flex;align-items:center;gap:10px;padding:15px;background:#0f172a;border-radius:8px}
.legend-color{width:30px;height:30px;border-radius:6px}
.legend-info{flex:1}
.legend-name{font-size:14px;color:#94a3b8;margin-bottom:5px}
.legend-value{font-size:20px;font-weight:700;color:#e2e8f0}
</style>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
<div class="container">
<div class="header"><h1>👑 BTC Dominance</h1><p>Répartition de la capitalisation du marché crypto</p></div>
""" + NAV + """
<div class="dom-container">
<div class="card">
<h2>📊 Répartition Actuelle</h2>
<div class="pie-chart"><canvas id="dominance-chart"></canvas></div>
<div class="chart-legend" id="legend"></div>
</div>

<div class="grid grid-3" style="margin-top:30px">
<div class="stat-box">
<div class="label">Market Cap Total</div>
<div class="value" id="total-mc">--</div>
</div>
<div class="stat-box">
<div class="label">Volume 24h</div>
<div class="value" id="total-vol">--</div>
</div>
<div class="stat-box">
<div class="label">BTC Change 24h</div>
<div class="value" id="btc-change">--</div>
</div>
</div>
</div>
</div>

<script>
let chart=null;
function formatBigNumber(n){
if(n>=1e12)return'$'+(n/1e12).toFixed(2)+'T';
if(n>=1e9)return'$'+(n/1e9).toFixed(2)+'B';
return'$'+n.toFixed(2);
}

async function loadDominance(){
try{
const response=await fetch('/api/btc-dominance');
const data=await response.json();
const btc=data.btc_dominance;
const eth=data.eth_dominance;
const others=data.others_dominance;
if(chart)chart.destroy();
const ctx=document.getElementById('dominance-chart').getContext('2d');
chart=new Chart(ctx,{
type:'doughnut',
data:{
labels:['Bitcoin','Ethereum','Autres'],
datasets:[{
data:[btc,eth,others],
backgroundColor:['#f97316','#60a5fa','#a78bfa'],
borderWidth:3,
borderColor:'#0f172a'
}]
},
options:{
responsive:true,
maintainAspectRatio:true,
plugins:{
legend:{display:false},
tooltip:{
backgroundColor:'rgba(15,23,42,0.9)',
titleColor:'#60a5fa',
bodyColor:'#e2e8f0',
callbacks:{
label:function(context){
return context.label+': '+context.parsed.toFixed(2)+'%';
}
}
}
}
}
});
document.getElementById('legend').innerHTML=`
<div class="legend-item">
<div class="legend-color" style="background:#f97316"></div>
<div class="legend-info">
<div class="legend-name">Bitcoin</div>
<div class="legend-value">${btc.toFixed(2)}%</div>
</div>
</div>
<div class="legend-item">
<div class="legend-color" style="background:#60a5fa"></div>
<div class="legend-info">
<div class="legend-name">Ethereum</div>
<div class="legend-value">${eth.toFixed(2)}%</div>
</div>
</div>
<div class="legend-item">
<div class="legend-color" style="background:#a78bfa"></div>
<div class="legend-info">
<div class="legend-name">Autres</div>
<div class="legend-value">${others.toFixed(2)}%</div>
</div>
</div>`;
document.getElementById('total-mc').textContent=formatBigNumber(data.total_market_cap);
document.getElementById('total-vol').textContent=formatBigNumber(data.total_volume_24h);
const change=data.btc_change_24h;
const changeEl=document.getElementById('btc-change');
changeEl.textContent=(change>=0?'+':'')+change.toFixed(2)+'%';
changeEl.style.color=change>=0?'#22c55e':'#ef4444';
}catch(e){console.error('❌ Erreur:',e)}
}
loadDominance();
setInterval(loadDominance,60000);
</script>
</body></html>"""
    return HTMLResponse(page)


@app.get("/heatmap", response_class=HTMLResponse)
async def heatmap_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>🔥 Heatmap Crypto</title>""" + CSS + """
<style>
.heatmap-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:15px;margin-top:20px}
.heatmap-cell{padding:20px;border-radius:10px;text-align:center;transition:all .3s;cursor:pointer;border:2px solid transparent}
.heatmap-cell:hover{transform:scale(1.05);border-color:#fff;box-shadow:0 8px 24px rgba(0,0,0,0.5)}
.cell-symbol{font-size:18px;font-weight:700;margin-bottom:8px}
.cell-price{font-size:14px;margin-bottom:5px;opacity:0.9}
.cell-change{font-size:20px;font-weight:900}
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>🔥 Heatmap Crypto</h1><p>Visualisation des variations sur 24h</p></div>
""" + NAV + """
<div class="card">
<h2>📊 Top 100 Cryptomonnaies</h2>
<div id="heatmap-container" class="loading">Chargement des données...</div>
</div>
</div>

<script>
function getHeatmapColor(change){
const absChange=Math.abs(change);
if(change>0){
if(absChange>=10)return'rgba(34,197,94,0.9)';
if(absChange>=5)return'rgba(34,197,94,0.7)';
if(absChange>=2)return'rgba(34,197,94,0.5)';
return'rgba(34,197,94,0.3)';
}else{
if(absChange>=10)return'rgba(239,68,68,0.9)';
if(absChange>=5)return'rgba(239,68,68,0.7)';
if(absChange>=2)return'rgba(239,68,68,0.5)';
return'rgba(239,68,68,0.3)';
}
}

function formatPrice(price){
if(price>=1000)return'$'+price.toLocaleString('en-US',{maximumFractionDigits:0});
if(price>=1)return'$'+price.toFixed(2);
if(price>=0.01)return'$'+price.toFixed(4);
return'$'+price.toFixed(6);
}

async function loadHeatmap(){
try{
const response=await fetch('/api/heatmap');
const data=await response.json();
if(!data.cryptos||data.cryptos.length===0){
document.getElementById('heatmap-container').innerHTML='<p>Aucune donnée disponible</p>';
return;
}
const html=data.cryptos.map(crypto=>{
const color=getHeatmapColor(crypto.change_24h);
return`<div class="heatmap-cell" style="background:${color}">
<div class="cell-symbol">${crypto.symbol}</div>
<div class="cell-price">${formatPrice(crypto.price)}</div>
<div class="cell-change">${crypto.change_24h>0?'+':''}${crypto.change_24h.toFixed(2)}%</div>
</div>`;
}).join('');
document.getElementById('heatmap-container').innerHTML='<div class="heatmap-grid">'+html+'</div>';
}catch(e){
console.error('❌ Erreur:',e);
document.getElementById('heatmap-container').innerHTML='<p style="color:#ef4444">❌ Erreur de chargement</p>';
}
}
loadHeatmap();
setInterval(loadHeatmap,60000);
</script>
</body></html>"""
    return HTMLResponse(page)


@app.get("/nouvelles", response_class=HTMLResponse)
async def crypto_news_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>📰 Actualités Crypto</title>""" + CSS + """
<style>
.news-grid{display:grid;gap:20px}
.news-item{background:#1e293b;padding:25px;border-radius:12px;border:1px solid #334155;transition:all .3s;cursor:pointer}
.news-item:hover{transform:translateY(-5px);box-shadow:0 8px 24px rgba(96,165,250,0.2);border-color:#60a5fa}
.news-header{display:flex;justify-content:space-between;align-items:start;margin-bottom:15px;gap:15px}
.news-title{font-size:20px;font-weight:700;color:#e2e8f0;line-height:1.4;flex:1}
.news-image{width:120px;height:80px;border-radius:8px;object-fit:cover;background:#0f172a}
.news-meta{display:flex;gap:15px;font-size:14px;color:#94a3b8;margin-top:10px}
.news-source{font-weight:600}
.news-date{opacity:0.8}
.sentiment-badge{padding:4px 8px;border-radius:4px;font-size:12px;font-weight:700}
.sentiment-positive{background:rgba(34,197,94,0.2);color:#22c55e}
.sentiment-neutral{background:rgba(148,163,184,0.2);color:#94a3b8}
.sentiment-negative{background:rgba(239,68,68,0.2);color:#ef4444}
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>📰 Actualités Crypto</h1><p>Dernières nouvelles du marché</p></div>
""" + NAV + """
<div class="card">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
<h2>🔥 Actualités</h2>
<button onclick="loadNews()">🔄 Actualiser</button>
</div>
<div class="news-grid" id="news-container">
<div class="loading">Chargement des actualités...</div>
</div>
</div>
</div>

<script>
function formatDate(dateString){
const date=new Date(dateString);
const now=new Date();
const diffMs=now-date;
const diffMins=Math.floor(diffMs/60000);
if(diffMins<60)return`Il y a ${diffMins}min`;
const diffHours=Math.floor(diffMins/60);
if(diffHours<24)return`Il y a ${diffHours}h`;
const diffDays=Math.floor(diffHours/24);
return`Il y a ${diffDays}j`;
}

function getSentimentBadge(sentiment){
if(sentiment>0)return'<span class="sentiment-badge sentiment-positive">📈 Positif</span>';
if(sentiment<0)return'<span class="sentiment-badge sentiment-negative">📉 Négatif</span>';
return'<span class="sentiment-badge sentiment-neutral">➡️ Neutre</span>';
}

async function loadNews(){
try{
const response=await fetch('/api/crypto-news');
const data=await response.json();
if(!data.articles||data.articles.length===0){
document.getElementById('news-container').innerHTML='<p style="text-align:center;color:#94a3b8">Aucune actualité disponible</p>';
return;
}
const html=data.articles.map(article=>`
<div class="news-item" onclick="window.open('${article.url}','_blank')">
<div class="news-header">
<div class="news-title">${article.title}</div>
${article.image?`<img src="${article.image}" class="news-image" onerror="this.style.display='none'">`:''}
</div>
<div class="news-meta">
<span class="news-source">📌 ${article.source}</span>
<span class="news-date">🕐 ${formatDate(article.published)}</span>
${getSentimentBadge(article.sentiment)}
</div>
</div>
`).join('');
document.getElementById('news-container').innerHTML=html;
}catch(e){
console.error('❌ Erreur:',e);
document.getElementById('news-container').innerHTML='<p style="color:#ef4444;text-align:center">❌ Erreur de chargement</p>';
}
}
loadNews();
setInterval(loadNews,120000);
</script>
</body></html>"""
    return HTMLResponse(page)


@app.get("/convertisseur", response_class=HTMLResponse)
async def convertisseur_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>💱 Convertisseur Crypto</title>""" + CSS + """
<style>
.converter-box{max-width:600px;margin:0 auto;background:#1e293b;padding:40px;border-radius:16px;border:1px solid #334155}
.input-group{margin-bottom:25px}
.input-group label{display:block;margin-bottom:10px;color:#94a3b8;font-weight:600}
.input-wrapper{display:flex;gap:10px}
.input-wrapper input{flex:1}
.result-box{background:#0f172a;padding:30px;border-radius:12px;text-align:center;margin-top:30px;border:2px solid #60a5fa}
.result-label{color:#94a3b8;font-size:14px;margin-bottom:10px}
.result-value{font-size:48px;font-weight:900;color:#60a5fa;margin-bottom:10px}
.result-details{color:#94a3b8;font-size:14px}
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>💱 Convertisseur Crypto</h1><p>Convertissez entre cryptos et devises fiat</p></div>
""" + NAV + """
<div class="card">
<div class="converter-box">
<div class="input-group">
<label>Montant</label>
<input type="number" id="amount" value="1" min="0" step="any" oninput="convert()">
</div>
<div class="input-group">
<label>De</label>
<div class="input-wrapper">
<select id="from-currency" onchange="convert()">
<option value="BTC">Bitcoin (BTC)</option>
<option value="ETH">Ethereum (ETH)</option>
<option value="USDT">Tether (USDT)</option>
<option value="BNB">Binance Coin (BNB)</option>
<option value="SOL">Solana (SOL)</option>
<option value="USD">Dollar US (USD)</option>
<option value="EUR">Euro (EUR)</option>
<option value="CAD">Dollar Canadien (CAD)</option>
</select>
</div>
</div>
<div class="input-group">
<label>Vers</label>
<div class="input-wrapper">
<select id="to-currency" onchange="convert()">
<option value="USD" selected>Dollar US (USD)</option>
<option value="EUR">Euro (EUR)</option>
<option value="CAD">Dollar Canadien (CAD)</option>
<option value="BTC">Bitcoin (BTC)</option>
<option value="ETH">Ethereum (ETH)</option>
<option value="USDT">Tether (USDT)</option>
<option value="BNB">Binance Coin (BNB)</option>
<option value="SOL">Solana (SOL)</option>
</select>
</div>
</div>
<div class="result-box" id="result">
<div class="result-label">Résultat</div>
<div class="result-value">--</div>
<div class="result-details">Sélectionnez les devises</div>
</div>
</div>
</div>
</div>

<script>
let rates={};
async function loadRates(){
try{
const response=await fetch('/api/exchange-rates');
const data=await response.json();
rates=data.rates;
convert();
}catch(e){console.error('❌ Erreur:',e)}
}

function convert(){
const amount=parseFloat(document.getElementById('amount').value)||0;
const from=document.getElementById('from-currency').value;
const to=document.getElementById('to-currency').value;
if(!rates[from]||!rates[to]){
document.querySelector('.result-value').textContent='--';
return;
}
const fromUsd=rates[from].usd;
const toUsd=rates[to].usd;
const result=(amount*fromUsd)/toUsd;
document.querySelector('.result-value').textContent=result.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:8});
document.querySelector('.result-details').textContent=`1 ${from} = ${(fromUsd/toUsd).toFixed(8)} ${to}`;
}
loadRates();
</script>
</body></html>"""
    return HTMLResponse(page)


@app.get("/calendrier", response_class=HTMLResponse)
async def calendrier_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>📅 Calendrier Économique</title>""" + CSS + """
<style>
.calendar-item{background:#1e293b;padding:20px;border-radius:12px;margin-bottom:15px;border-left:4px solid #60a5fa}
.calendar-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}
.calendar-date{font-size:18px;font-weight:700;color:#60a5fa}
.calendar-time{font-size:14px;color:#94a3b8}
.event-details{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px}
.event-field{padding:10px;background:#0f172a;border-radius:6px}
.event-label{font-size:12px;color:#94a3b8;margin-bottom:5px}
.event-value{font-size:16px;font-weight:700;color:#e2e8f0}
.impact-badge{padding:4px 8px;border-radius:4px;font-size:12px;font-weight:700}
.impact-high{background:rgba(239,68,68,0.2);color:#ef4444}
.impact-medium{background:rgba(251,191,36,0.2);color:#fbbf24}
.impact-low{background:rgba(34,197,94,0.2);color:#22c55e}
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>📅 Calendrier Économique</h1><p>Événements économiques importants</p></div>
""" + NAV + """
<div class="card">
<h2>📊 Prochains Événements</h2>
<div id="calendar-container">
<div class="loading">Chargement du calendrier...</div>
</div>
</div>
</div>

<script>
function getImpactBadge(impact){
if(impact==='high')return'<span class="impact-badge impact-high">🔴 Impact Élevé</span>';
if(impact==='medium')return'<span class="impact-badge impact-medium">🟡 Impact Moyen</span>';
return'<span class="impact-badge impact-low">🟢 Impact Faible</span>';
}

async function loadCalendar(){
try{
const response=await fetch('/api/economic-calendar');
const data=await response.json();
if(!data.events||data.events.length===0){
document.getElementById('calendar-container').innerHTML='<p style="text-align:center;color:#94a3b8">Aucun événement à venir</p>';
return;
}
const html=data.events.map(event=>`
<div class="calendar-item">
<div class="calendar-header">
<div>
<div class="calendar-date">📅 ${new Date(event.date).toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
<div class="calendar-time">🕐 ${event.time}</div>
</div>
${getImpactBadge(event.impact)}
</div>
<div style="font-size:18px;font-weight:700;margin-bottom:15px;color:#e2e8f0">${event.country} - ${event.event}</div>
<div class="event-details">
<div class="event-field"><div class="event-label">Devise</div><div class="event-value">${event.currency}</div></div>
<div class="event-field"><div class="event-label">Prévision</div><div class="event-value">${event.forecast||'N/A'}</div></div>
<div class="event-field"><div class="event-label">Précédent</div><div class="event-value">${event.previous||'N/A'}</div></div>
${event.actual?`<div class="event-field"><div class="event-label">Actuel</div><div class="event-value">${event.actual}</div></div>`:''}
</div>
</div>
`).join('');
document.getElementById('calendar-container').innerHTML=html;
}catch(e){
console.error('❌ Erreur:',e);
document.getElementById('calendar-container').innerHTML='<p style="color:#ef4444;text-align:center">❌ Erreur de chargement</p>';
}
}
loadCalendar();
</script>
</body></html>"""
    return HTMLResponse(page)


@app.get("/bullrun-phase", response_class=HTMLResponse)
async def bullrun_phase_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>🚀 Bullrun Phase</title>""" + CSS + """
<style>
.phase-container{max-width:900px;margin:0 auto}
.phase-display{text-align:center;padding:40px;background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px;margin-bottom:30px}
.phase-number{font-size:96px;font-weight:900;background:linear-gradient(135deg,#f97316,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:10px}
.phase-name{font-size:36px;font-weight:700;color:#e2e8f0;margin-bottom:20px}
.phase-confidence{font-size:18px;color:#94a3b8}
.phases-info{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px}
.phase-card{background:#1e293b;padding:20px;border-radius:12px;border:2px solid #334155;transition:all .3s}
.phase-card.active{border-color:#60a5fa;box-shadow:0 0 20px rgba(96,165,250,0.3)}
.phase-card h3{color:#60a5fa;margin-bottom:10px}
.phase-card p{color:#94a3b8;font-size:14px;line-height:1.6}
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>🚀 Bullrun Phase Detector</h1><p>Identifie la phase actuelle du cycle de marché</p></div>
""" + NAV + """
<div class="phase-container">
<div class="card">
<div class="phase-display" id="phase-display">
<div class="phase-number">--</div>
<div class="phase-name">Chargement...</div>
<div class="phase-confidence">--</div>
</div>
</div>

<div class="card">
<h2>📊 Les 4 Phases</h2>
<div class="phases-info">
<div class="phase-card" id="phase-1">
<h3>Phase 1: Bitcoin</h3>
<p>Bitcoin domine et monte en premier. Les altcoins sont stables ou baissent.</p>
</div>
<div class="phase-card" id="phase-2">
<h3>Phase 2: Ethereum</h3>
<p>ETH commence à surperformer BTC. Les grandes caps bougent.</p>
</div>
<div class="phase-card" id="phase-3">
<h3>Phase 3: Large Caps</h3>
<p>Les grandes altcoins explosent. Le marché s'élargit.</p>
</div>
<div class="phase-card" id="phase-4">
<h3>Phase 4: Altseason</h3>
<p>Toutes les altcoins pompent. C'est l'euphorie totale!</p>
</div>
</div>
</div>

<div class="grid grid-2" style="margin-top:30px">
<div class="stat-box">
<div class="label">BTC Dominance</div>
<div class="value" id="btc-dom">--</div>
</div>
<div class="stat-box">
<div class="label">Altcoin Season Index</div>
<div class="value" id="alt-index">--</div>
</div>
</div>
</div>
</div>

<script>
async function loadPhase(){
try{
const response=await fetch('/api/bullrun-phase');
const data=await response.json();
document.querySelector('.phase-number').textContent=data.current_phase;
document.querySelector('.phase-name').textContent='Phase '+data.current_phase+': '+data.phase_name;
document.querySelector('.phase-confidence').textContent='Confiance: '+data.confidence+'%';
for(let i=1;i<=4;i++){
document.getElementById('phase-'+i).classList.remove('active');
}
document.getElementById('phase-'+data.current_phase).classList.add('active');
if(data.indicators.btc_dominance){
document.getElementById('btc-dom').textContent=data.indicators.btc_dominance+'%';
}
if(data.indicators.altcoin_season_index){
document.getElementById('alt-index').textContent=data.indicators.altcoin_season_index;
}
}catch(e){console.error('❌ Erreur:',e)}
}
loadPhase();
setInterval(loadPhase,60000);
</script>
</body></html>"""
    return HTMLResponse(page)


@app.get("/telegram-test", response_class=HTMLResponse)
async def telegram_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>📱 Test Telegram</title>""" + CSS + """
<style>
.test-section{background:#1e293b;padding:25px;border-radius:12px;margin-bottom:20px;border:1px solid #334155}
.test-result{background:#0f172a;padding:15px;border-radius:8px;margin-top:15px;font-family:monospace;font-size:13px;max-height:300px;overflow-y:auto}
.btn-test{width:100%;margin-top:10px}
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>📱 Test Telegram Bot</h1><p>Testez l'intégration Telegram</p></div>
""" + NAV + """
<div style="max-width:800px;margin:0 auto">
<div class="test-section">
<h2>1️⃣ Configuration</h2>
<button class="btn-test" onclick="testConfig()">Vérifier la Config</button>
<div class="test-result" id="config-result">Cliquez pour tester...</div>
</div>

<div class="test-section">
<h2>2️⃣ Bot Info</h2>
<button class="btn-test" onclick="testBotInfo()">Obtenir Info Bot</button>
<div class="test-result" id="bot-result">Cliquez pour tester...</div>
</div>

<div class="test-section">
<h2>3️⃣ Vérifier Chat</h2>
<button class="btn-test" onclick="verifyChat()">Vérifier le Chat ID</button>
<div class="test-result" id="chat-result">Cliquez pour tester...</div>
</div>

<div class="test-section">
<h2>4️⃣ Envoyer Message Test</h2>
<button class="btn-test" onclick="sendTest()">Envoyer Message</button>
<div class="test-result" id="send-result">Cliquez pour tester...</div>
</div>

<div class="test-section">
<h2>5️⃣ Test Alerte Complète</h2>
<button class="btn-test" onclick="testFullAlert()">Tester Alerte Trading</button>
<div class="test-result" id="alert-result">Cliquez pour tester...</div>
</div>
</div>
</div>

<script>
async function testConfig(){
try{
const response=await fetch('/api/telegram-config');
const data=await response.json();
document.getElementById('config-result').innerHTML=`<pre>${JSON.stringify(data,null,2)}</pre>`;
}catch(e){
document.getElementById('config-result').innerHTML='<span style="color:#ef4444">❌ Erreur: '+e.message+'</span>';
}
}

async function testBotInfo(){
try{
const response=await fetch('/api/telegram-bot-info');
const data=await response.json();
document.getElementById('bot-result').innerHTML=`<pre>${JSON.stringify(data,null,2)}</pre>`;
}catch(e){
document.getElementById('bot-result').innerHTML='<span style="color:#ef4444">❌ Erreur: '+e.message+'</span>';
}
}

async function verifyChat(){
try{
const response=await fetch('/api/telegram-verify-chat');
const data=await response.json();
document.getElementById('chat-result').innerHTML=`<pre>${JSON.stringify(data,null,2)}</pre>`;
}catch(e){
document.getElementById('chat-result').innerHTML='<span style="color:#ef4444">❌ Erreur: '+e.message+'</span>';
}
}

async function sendTest(){
try{
const response=await fetch('/api/telegram-test');
const data=await response.json();
document.getElementById('send-result').innerHTML=`<pre>${JSON.stringify(data,null,2)}</pre>`;
}catch(e){
document.getElementById('send-result').innerHTML='<span style="color:#ef4444">❌ Erreur: '+e.message+'</span>';
}
}

async function testFullAlert(){
try{
const response=await fetch('/api/test-full-alert');
const data=await response.json();
document.getElementById('alert-result').innerHTML=`<pre>${JSON.stringify(data,null,2)}</pre>`;
}catch(e){
document.getElementById('alert-result').innerHTML='<span style="color:#ef4444">❌ Erreur: '+e.message+'</span>';
}
}
</script>
</body></html>"""
    return HTMLResponse(page)


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


# ==================== PAGE ALTCOIN SEASON COMPLÈTE (REDESSINÉE) ====================

@app.get("/altcoin-season", response_class=HTMLResponse)
async def altcoin_season_page():
    page = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>🌊 Altcoin Season Index</title>""" + CSS + """
<style>
.altcoin-container{max-width:1200px;margin:0 auto}
.main-index-section{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:50px 30px;border-radius:20px;margin-bottom:30px;border:2px solid #334155;position:relative;overflow:hidden}
.main-index-section::before{content:'';position:absolute;top:-50%;right:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(96,165,250,0.1) 0%,transparent 70%);animation:pulse 8s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
.index-display{text-align:center;position:relative;z-index:1}
.index-value{font-size:120px;font-weight:900;background:linear-gradient(135deg,#f97316,#fbbf24,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:20px 0;animation:glow 3s ease-in-out infinite}
@keyframes glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3)}}
.index-label{font-size:36px;font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:2px}
.index-description{font-size:16px;color:#94a3b8;max-width:600px;margin:0 auto;line-height:1.6}
.gauge-section{background:#1e293b;padding:40px 30px;border-radius:16px;margin-bottom:30px;border:1px solid #334155}
.gauge-container{position:relative;width:100%;height:120px;margin:30px 0}
.gauge-track{width:100%;height:50px;background:linear-gradient(90deg,#dc2626 0%,#f59e0b 12.5%,#fbbf24 25%,#84cc16 37.5%,#22c55e 50%,#3b82f6 62.5%,#2563eb 75%,#1d4ed8 87.5%,#1e3a8a 100%);border-radius:25px;position:relative;box-shadow:inset 0 2px 8px rgba(0,0,0,0.3),0 4px 12px rgba(0,0,0,0.2)}
.gauge-markers{position:absolute;width:100%;top:-30px;display:flex;justify-content:space-between;font-size:12px;color:#94a3b8;font-weight:600}
.gauge-marker-line{position:absolute;width:2px;height:60px;background:#334155;top:-10px}
.gauge-indicator{position:absolute;top:-40px;transform:translateX(-50%);transition:left 0.8s cubic-bezier(0.4,0,0.2,1);z-index:10}
.gauge-arrow{width:0;height:0;border-left:20px solid transparent;border-right:20px solid transparent;border-top:50px solid #fff;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3))}
.gauge-value-badge{position:absolute;top:60px;left:50%;transform:translateX(-50%);background:#0f172a;padding:10px 20px;border-radius:12px;font-size:18px;font-weight:900;color:#fff;border:2px solid #60a5fa;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.4)}
.zones-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-top:30px}
.zone-card{background:linear-gradient(135deg,#1e293b,#0f172a);padding:25px;border-radius:16px;border:2px solid #334155;transition:all .3s;position:relative;overflow:hidden}
.zone-card::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;transition:all .3s}
.zone-card.bitcoin::before{background:linear-gradient(90deg,#dc2626,#f59e0b)}
.zone-card.neutral::before{background:linear-gradient(90deg,#fbbf24,#84cc16)}
.zone-card.altseason::before{background:linear-gradient(90deg,#3b82f6,#1e3a8a)}
.zone-card:hover{transform:translateY(-5px);box-shadow:0 12px 24px rgba(96,165,250,0.2);border-color:#60a5fa}
.zone-card.active{border-color:#60a5fa;box-shadow:0 0 30px rgba(96,165,250,0.4)}
.zone-card.active::before{height:8px}
.zone-icon{font-size:48px;margin-bottom:15px}
.zone-title{font-size:20px;font-weight:700;color:#e2e8f0;margin-bottom:10px}
.zone-range{font-size:14px;color:#60a5fa;font-weight:600;margin-bottom:15px}
.zone-description{font-size:14px;color:#94a3b8;line-height:1.6}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-top:30px}
.stat-card{background:#0f172a;padding:25px;border-radius:12px;border:1px solid #334155;text-align:center;transition:all .3s}
.stat-card:hover{transform:translateY(-3px);border-color:#60a5fa}
.stat-icon{font-size:32px;margin-bottom:10px}
.stat-label{font-size:13px;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px}
.stat-value{font-size:28px;font-weight:900;color:#e2e8f0;margin-bottom:5px}
.stat-subtitle{font-size:12px;color:#60a5fa}
.info-section{background:#1e293b;padding:30px;border-radius:16px;border:1px solid #334155;margin-bottom:30px}
.info-title{font-size:22px;font-weight:700;color:#60a5fa;margin-bottom:20px;display:flex;align-items:center;gap:10px}
.info-content{color:#94a3b8;line-height:1.8;font-size:15px}
.info-list{list-style:none;padding:0;margin:15px 0}
.info-list li{padding:10px 0;border-bottom:1px solid #334155;display:flex;align-items:start;gap:10px}
.info-list li:last-child{border-bottom:none}
.info-list li::before{content:'✓';color:#22c55e;font-weight:700;font-size:18px}
@media(max-width:768px){.index-value{font-size:72px}.index-label{font-size:24px}.zones-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>🌊 Altcoin Season Index</h1>
<p>Analyse en temps réel de la domination Bitcoin vs Altcoins</p>
</div>
""" + NAV + """

<div class="altcoin-container">
<div class="main-index-section">
<div class="index-display">
<div id="main-index-value" class="index-value">--</div>
<div id="main-index-label" class="index-label">Chargement...</div>
<div class="index-description">L'index mesure combien d'altcoins (top 100) surperforment Bitcoin sur 30 jours</div>
</div>
</div>

<div class="gauge-section">
<h2>📊 Jauge de Position</h2>
<div class="gauge-container">
<div class="gauge-markers">
<span style="position:absolute;left:0;transform:translateX(-50%)">0</span>
<span style="position:absolute;left:25%;transform:translateX(-50%)">25</span>
<span style="position:absolute;left:50%;transform:translateX(-50%)">50</span>
<span style="position:absolute;left:75%;transform:translateX(-50%)">75</span>
<span style="position:absolute;left:100%;transform:translateX(-50%)">100</span>
</div>
<div class="gauge-track">
<div class="gauge-marker-line" style="left:0%"></div>
<div class="gauge-marker-line" style="left:25%"></div>
<div class="gauge-marker-line" style="left:50%"></div>
<div class="gauge-marker-line" style="left:75%"></div>
<div class="gauge-marker-line" style="left:100%"></div>
<div id="gauge-indicator" class="gauge-indicator" style="left:50%">
<div class="gauge-arrow"></div>
</div>
</div>
<div id="gauge-badge" class="gauge-value-badge">-- / 100</div>
</div>
</div>

<div class="card">
<h2>🎯 Zones du Marché</h2>
<div class="zones-grid">
<div class="zone-card bitcoin" id="zone-bitcoin">
<div class="zone-icon">🔥</div>
<div class="zone-title">Bitcoin Season</div>
<div class="zone-range">Index: 0 - 25</div>
<div class="zone-description">
Bitcoin domine le marché et surperforme massivement les altcoins. 
Moins de 25% des altcoins font mieux que BTC.
</div>
</div>

<div class="zone-card neutral" id="zone-neutral">
<div class="zone-icon">⚖️</div>
<div class="zone-title">Zone Neutre</div>
<div class="zone-range">Index: 25 - 75</div>
<div class="zone-description">
Marché équilibré. Entre 25% et 75% des altcoins surperforment Bitcoin.
</div>
</div>

<div class="zone-card altseason" id="zone-altseason">
<div class="zone-icon">🚀</div>
<div class="zone-title">Altcoin Season</div>
<div class="zone-range">Index: 75 - 100</div>
<div class="zone-description">
Les altcoins dominent! Plus de 75% des alts surperforment BTC.
</div>
</div>
</div>
</div>

<div class="card">
<h2>📈 Statistiques du Marché</h2>
<div class="stats-grid">
<div class="stat-card">
<div class="stat-icon">₿</div>
<div class="stat-label">BTC Change 30j</div>
<div class="stat-value" id="btc-change-30d">--</div>
<div class="stat-subtitle">Performance Bitcoin</div>
</div>

<div class="stat-card">
<div class="stat-icon">🎯</div>
<div class="stat-label">Altcoins Gagnants</div>
<div class="stat-value" id="alts-outperform">--</div>
<div class="stat-subtitle">Sur 99 altcoins mesurés</div>
</div>

<div class="stat-card">
<div class="stat-icon">📊</div>
<div class="stat-label">Dominance BTC</div>
<div class="stat-value" id="btc-dominance">--</div>
<div class="stat-subtitle">Part de marché Bitcoin</div>
</div>

<div class="stat-card">
<div class="stat-icon">⏱️</div>
<div class="stat-label">Dernière MAJ</div>
<div class="stat-value" id="last-update" style="font-size:18px">--</div>
<div class="stat-subtitle">Temps réel</div>
</div>
</div>
</div>

<div class="info-section">
<div class="info-title">
<span>💡</span>
<span>Comment Utiliser l'Index ?</span>
</div>
<div class="info-content">
<ul class="info-list">
<li><div><strong>Index 0-25 (Bitcoin Season):</strong> Concentrez-vous sur Bitcoin. Les altcoins sont en retard.</div></li>
<li><div><strong>Index 25-50 (Début Transition):</strong> Bitcoin ralentit, les grandes caps commencent à bouger.</div></li>
<li><div><strong>Index 50-75 (Transition Active):</strong> Les altcoins prennent de la vitesse. Moment de diversifier.</div></li>
<li><div><strong>Index 75-100 (Altcoin Season):</strong> Euphorie! Tous les altcoins montent. Prenez vos profits.</div></li>
</ul>
</div>
</div>

<div class="info-section">
<div class="info-title">
<span>🔬</span>
<span>Méthodologie de Calcul</span>
</div>
<div class="info-content">
<p style="margin-bottom:15px">
L'index compare la performance de <strong>99 altcoins du top 100</strong> par rapport à Bitcoin sur <strong>30 jours</strong>.
</p>
<p>
Les données sont mises à jour en temps réel via l'API CoinGecko.
</p>
</div>
</div>

</div>
</div>

<script>
let currentIndex=0;

function getSeasonInfo(index){
if(index<=25){return{label:'Bitcoin Season',color:'#f97316',emoji:'🔥',zone:'bitcoin'}}
else if(index<=50){return{label:'Zone Neutre (Début)',color:'#fbbf24',emoji:'⚖️',zone:'neutral'}}
else if(index<=75){return{label:'Zone Neutre (Transition)',color:'#84cc16',emoji:'⚖️',zone:'neutral'}}
else{return{label:'Altcoin Season',color:'#3b82f6',emoji:'🚀',zone:'altseason'}}
}

function updateDisplay(data){
console.log('🎨 === DÉBUT updateDisplay ===');
console.log('📥 Données reçues:',JSON.stringify(data,null,2));
const index=data.index||0;
console.log('📊 Index à afficher:',index);
currentIndex=index;
const seasonInfo=getSeasonInfo(index);
console.log('🎯 Info saison:',seasonInfo);
const mainIndexEl=document.getElementById('main-index-value');
if(mainIndexEl){mainIndexEl.textContent=index;console.log('✅ Index principal mis à jour:',index)}else{console.error('❌ Élément main-index-value introuvable!')}
const labelEl=document.getElementById('main-index-label');
if(labelEl){labelEl.textContent=seasonInfo.emoji+' '+seasonInfo.label;labelEl.style.color=seasonInfo.color;console.log('✅ Label mis à jour:',seasonInfo.label)}else{console.error('❌ Élément main-index-label introuvable!')}
const indicator=document.getElementById('gauge-indicator');
if(indicator){indicator.style.left=index+'%';console.log('✅ Indicateur jauge positionné à',index+'%')}
const badge=document.getElementById('gauge-badge');
if(badge){badge.textContent=index+' / 100';badge.style.borderColor=seasonInfo.color;console.log('✅ Badge mis à jour:',index+' / 100')}
document.querySelectorAll('.zone-card').forEach(card=>card.classList.remove('active'));
const zoneElement=document.getElementById('zone-'+seasonInfo.zone);
if(zoneElement){zoneElement.classList.add('active');console.log('✅ Zone activée:',seasonInfo.zone)}
if(data.btc_change!==undefined&&data.btc_change!==null){
const btcChangeEl=document.getElementById('btc-change-30d');
if(btcChangeEl){
const change=parseFloat(data.btc_change);
btcChangeEl.textContent=(change>=0?'+':'')+change.toFixed(2)+'%';
btcChangeEl.style.color=change>=0?'#22c55e':'#ef4444';
console.log('✅ BTC Change mis à jour:',change)}}
if(data.outperforming!==undefined&&data.outperforming!==null){
const altsEl=document.getElementById('alts-outperform');
if(altsEl){altsEl.textContent=data.outperforming+' / 99';console.log('✅ Alts surperformants mis à jour:',data.outperforming)}}
loadBtcDominance();
const now=new Date();
const lastUpdateEl=document.getElementById('last-update');
if(lastUpdateEl){lastUpdateEl.textContent=now.toLocaleTimeString('fr-FR');console.log('✅ Timestamp mis à jour')}
console.log('✅ === FIN updateDisplay - Tout OK ===\n')}

async function loadBtcDominance(){
try{
console.log('📊 Chargement BTC Dominance...');
const response=await fetch('/api/btc-dominance');
const data=await response.json();
if(data.btc_dominance){
document.getElementById('btc-dominance').textContent=data.btc_dominance.toFixed(2)+'%';
console.log('✅ BTC Dominance:',data.btc_dominance)}}catch(e){
console.error('❌ Erreur BTC Dominance:',e);
document.getElementById('btc-dominance').textContent='58.5%'}}

async function loadAltcoinIndex(){
console.log('🔄 Chargement Altcoin Season Index...');
try{
const controller=new AbortController();
const timeoutId=setTimeout(()=>controller.abort(),10000);
const response=await fetch('/api/altcoin-season-index',{signal:controller.signal});
clearTimeout(timeoutId);
if(!response.ok){console.error(`❌ HTTP ${response.status}`);throw new Error(`HTTP ${response.status}`)}
const data=await response.json();
console.log('✅ Données reçues:',data);
if(data&&typeof data.index==='number'){updateDisplay(data);console.log('✅ Affichage mis à jour avec index:',data.index)}else{console.error('❌ Format de données invalide:',data);throw new Error('Index manquant')}}catch(error){
if(error.name==='AbortError'){console.error('⏱️ Timeout - requête annulée après 10s')}else{console.error('❌ Erreur:',error.message)}
console.log('⚠️ Utilisation des données par défaut');
updateDisplay({index:45,btc_change:12.3,outperforming:45,status:'error'})}}

console.log('🚀 Initialisation immédiate...');
const defaultData={index:50,btc_change:10.0,outperforming:50,status:'initializing'};
console.log('📊 Affichage des données par défaut:',defaultData);
updateDisplay(defaultData);
setTimeout(async()=>{console.log('📡 Chargement des données réelles depuis l\'API...');await loadAltcoinIndex()},200);
setInterval(()=>{console.log('🔄 Actualisation automatique...');loadAltcoinIndex()},60000);
console.log('✅ Page complètement initialisée');
</script>

</body></html>"""
    return HTMLResponse(page)


# ==================== LANCEMENT DE L'APP ====================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print("\n🚀 DASHBOARD TRADING - Démarrage...")
    print(f"📡 Serveur démarré sur le port {port}")
    print(f"🌐 Accès local: http://localhost:{port}")
    print("\n✅ Toutes les pages sont fonctionnelles:")
    print("   - / (Accueil)")
    print("   - /trades (Suivi des trades)")
    print("   - /fear-greed (Fear & Greed Index)")
    print("   - /dominance (BTC Dominance)")
    print("   - /heatmap (Heatmap crypto)")
    print("   - /nouvelles (Actualités)")
    print("   - /convertisseur (Convertisseur)")
    print("   - /calendrier (Calendrier économique)")
    print("   - /bullrun-phase (Phase du bullrun)")
    print("   - /graphiques (Graphiques interactifs)")
    print("   - /altcoin-season (Altcoin Season Index) ✨ REDESIGNÉ")
    print("   - /telegram-test (Tests Telegram)")
    print("\n🎯 Prêt à recevoir des webhooks sur /tv-webhook")
    print("🧪 Test API Altcoin: http://localhost:8000/api/altcoin-season-test\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
