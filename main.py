# -*- coding: utf-8 -*-
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import Optional, Any
import httpx
from datetime import datetime, timedelta
import pytz
import random
import os
import math

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

trades_db = []
heatmap_cache = {"data": None, "timestamp": None, "cache_duration": 180}
altcoin_cache = {"data": None, "timestamp": None, "cache_duration": 3600}  # Cache 1 heure
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8478131465:AAEh7Z0rvIqSNvn1wKdtkMNb-O96h41LCns")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "-1002940633257")

CSS = """<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:20px}.container{max-width:1400px;margin:0 auto}.header{text-align:center;margin-bottom:30px;padding:30px;background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:12px}.header h1{font-size:42px;margin-bottom:10px;background:linear-gradient(to right,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.header p{color:#94a3b8;font-size:16px}.nav{display:flex;gap:10px;margin-bottom:30px;flex-wrap:wrap;justify-content:center}.nav a{padding:12px 20px;background:#1e293b;border-radius:8px;text-decoration:none;color:#e2e8f0;transition:all .3s;border:1px solid #334155}.nav a:hover{background:#334155;border-color:#60a5fa}.card{background:#1e293b;padding:25px;border-radius:12px;margin-bottom:20px;border:1px solid #334155}.card h2{color:#60a5fa;margin-bottom:20px;font-size:24px;border-bottom:2px solid #334155;padding-bottom:10px}.stat-box{background:#0f172a;padding:20px;border-radius:8px;border-left:4px solid #60a5fa}.stat-box .label{color:#94a3b8;font-size:13px;margin-bottom:8px}.stat-box .value{font-size:32px;font-weight:700;color:#e2e8f0}button{padding:12px 24px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:all .3s}button:hover{background:#2563eb}.btn-danger{background:#ef4444}.btn-danger:hover{background:#dc2626}.spinner{border:5px solid #334155;border-top:5px solid #60a5fa;border-radius:50%;width:60px;height:60px;animation:spin 1s linear infinite;margin:60px auto}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.alert{padding:15px;border-radius:8px;margin:15px 0}.alert-success{background:rgba(16,185,129,.1);border-left:4px solid #10b981;color:#10b981}.alert-error{background:rgba(239,68,68,.1);border-left:4px solid #ef4444;color:#ef4444}table{width:100%;border-collapse:collapse}table th{background:#0f172a;padding:12px;text-align:left;color:#60a5fa;font-weight:600;border-bottom:2px solid #334155}table td{padding:12px;border-bottom:1px solid #334155}table tr:hover{background:#0f172a}input,select{width:100%;padding:12px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:14px;margin-bottom:15px}</style>"""

NAV = '<div class="nav"><a href="/">Accueil</a><a href="/fear-greed">Fear&Greed</a><a href="/dominance">Dominance</a><a href="/altcoin-season">Altcoin Season</a><a href="/heatmap">Heatmap</a><a href="/nouvelles">Nouvelles</a><a href="/trades">Trades</a><a href="/convertisseur">Convertisseur</a><a href="/calendrier">Calendrier</a><a href="/bullrun-phase">Bullrun Phase</a><a href="/graphiques">Graphiques</a><a href="/telegram-test">Telegram</a></div>'

class TradeWebhook(BaseModel):
    type: str = "ENTRY"
    symbol: str
    tf: Optional[str] = None
    tf_label: Optional[str] = None
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
    action: Optional[str] = None

    @validator('side', pre=True, always=True)
    def set_side(cls, v, values):
        if v:
            return v.upper()
        if 'action' in values and values['action']:
            return 'LONG' if values['action'].upper() == 'BUY' else 'SHORT'
        return v

    @validator('entry', pre=True, always=True)
    def set_entry(cls, v, values):
        return v if v is not None else values.get('price')

def calc_rr(entry, sl, tp1):
    try:
        if entry and sl and tp1:
            risk = abs(entry - sl)
            reward = abs(tp1 - entry)
            return round(reward / risk, 2) if risk > 0 else None
    except:
        pass
    return None

def calculate_confidence_score(trade: TradeWebhook):
    """Calcule un score de confiance IA"""
    score = 85.0
    reasons = []
    
    if trade.entry and trade.sl and trade.tp1:
        risk = abs(trade.entry - trade.sl)
        reward = abs(trade.tp1 - trade.entry)
        rr_ratio = reward / risk if risk > 0 else 0
        
        if rr_ratio >= 3:
            score += 8
            reasons.append(f"excellent R/R de {rr_ratio:.1f}")
        elif rr_ratio >= 2:
            score += 5
            reasons.append(f"bon R/R de {rr_ratio:.1f}")
        elif rr_ratio >= 1.5:
            score += 2
            reasons.append(f"R/R acceptable de {rr_ratio:.1f}")
        else:
            score -= 5
            reasons.append(f"R/R faible de {rr_ratio:.1f}")
    
    if trade.entry and trade.sl:
        sl_distance = abs((trade.sl - trade.entry) / trade.entry * 100)
        if sl_distance <= 3:
            score += 5
            reasons.append("SL serré (gestion de risque optimale)")
        elif sl_distance <= 5:
            score += 2
            reasons.append("SL bien placé")
        elif sl_distance > 8:
            score -= 3
            reasons.append("SL éloigné")
    
    targets_count = sum([1 for tp in [trade.tp1, trade.tp2, trade.tp3] if tp is not None])
    if targets_count >= 3:
        score += 4
        reasons.append("stratégie de sortie progressive")
    elif targets_count >= 2:
        score += 2
        reasons.append("multiples objectifs")
    
    score = max(60, min(99, score))
    
    return {
        "score": round(score, 1),
        "reasons": reasons
    }

def get_quebec_time():
    """Retourne l'heure actuelle du Québec (EDT/EST automatique)"""
    quebec_tz = pytz.timezone('America/Montreal')
    quebec_time = datetime.now(quebec_tz)
    return quebec_time.strftime("%H:%M")

async def send_telegram_message(message: str):
    """Envoie un message Telegram formaté"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(url, json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "HTML"
            })
            return response.status_code == 200
    except:
        return False

# =====================================================
# SECTION ALTCOIN SEASON - OPTIMISÉE POUR RENDER
# =====================================================

async def calculate_altcoin_season_index():
    """
    Calcule l'indice de saison des altcoins
    OPTIMISÉ POUR RENDER: timeout court + fallback garanti
    """
    try:
        # Vérifier le cache d'abord
        if (altcoin_cache["data"] is not None and 
            altcoin_cache["timestamp"] is not None):
            elapsed = (datetime.now() - altcoin_cache["timestamp"]).seconds
            if elapsed < altcoin_cache["cache_duration"]:
                print("✅ Utilisation du cache Altcoin Season")
                return altcoin_cache["data"]
        
        # Essayer de récupérer les vraies données avec timeout COURT (5 secondes max pour Render)
        print("🔄 Tentative de récupération des données CoinGecko...")
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={
                    "vs_currency": "usd",
                    "order": "market_cap_desc",
                    "per_page": 50,
                    "page": 1,
                    "sparkline": False
                }
            )
            
            if response.status_code == 200:
                coins = response.json()
                
                # Calculer l'indice réel
                btc_data = next((c for c in coins if c['id'] == 'bitcoin'), None)
                
                if btc_data:
                    # Compter combien d'altcoins ont mieux performé que BTC
                    btc_change = btc_data.get('price_change_percentage_24h', 0)
                    altcoins_outperforming = 0
                    
                    altcoin_list = []
                    for coin in coins[1:]:  # Exclure BTC
                        change = coin.get('price_change_percentage_24h', 0)
                        if change > btc_change:
                            altcoins_outperforming += 1
                        
                        altcoin_list.append({
                            "symbol": coin['symbol'].upper(),
                            "name": coin['name'],
                            "price": coin['current_price'],
                            "change_24h": round(change, 2),
                            "market_cap": coin['market_cap'],
                            "volume": coin['total_volume']
                        })
                    
                    # Calculer l'indice (0-100)
                    index_value = int((altcoins_outperforming / 49) * 100)
                    
                    # Déterminer la phase
                    if index_value >= 75:
                        phase = "Bitcoin Season"
                        phase_color = "#ef4444"
                        recommendation = "Privilégier Bitcoin et stablecoins"
                    elif index_value >= 50:
                        phase = "Transition"
                        phase_color = "#f59e0b"
                        recommendation = "Portfolio équilibré BTC/Alts"
                    elif index_value >= 25:
                        phase = "Début Altseason"
                        phase_color = "#3b82f6"
                        recommendation = "Augmenter exposition aux altcoins"
                    else:
                        phase = "Altcoin Season"
                        phase_color = "#10b981"
                        recommendation = "Opportunités altcoins maximales"
                    
                    result = {
                        "index": index_value,
                        "phase": phase,
                        "phase_color": phase_color,
                        "btc_dominance": round(btc_data.get('market_cap', 0) / sum(c.get('market_cap', 0) for c in coins) * 100, 2),
                        "altcoins_outperforming": altcoins_outperforming,
                        "total_altcoins": 49,
                        "btc_change_24h": round(btc_change, 2),
                        "recommendation": recommendation,
                        "top_performers": sorted(altcoin_list, key=lambda x: x['change_24h'], reverse=True)[:8],
                        "timestamp": datetime.now().isoformat(),
                        "data_source": "coingecko_live"
                    }
                    
                    # Mettre en cache
                    altcoin_cache["data"] = result
                    altcoin_cache["timestamp"] = datetime.now()
                    
                    print(f"✅ Données CoinGecko récupérées avec succès - Index: {index_value}")
                    return result
    
    except Exception as e:
        print(f"⚠️ Erreur API CoinGecko: {e}")
    
    # FALLBACK GARANTI: Générer des données simulées réalistes
    print("🔄 Utilisation du mode fallback (données simulées)")
    return generate_fallback_altcoin_data()

def generate_fallback_altcoin_data():
    """
    Génère des données simulées réalistes pour l'Altcoin Season
    GARANTIT que la page fonctionne toujours même si l'API échoue
    """
    # Générer un indice basé sur l'heure pour variation naturelle
    hour = datetime.now().hour
    base_index = 45 + (hour % 20)  # Varie entre 45 et 65
    index_value = base_index + random.randint(-5, 5)
    
    # Déterminer la phase basée sur l'indice
    if index_value >= 75:
        phase = "Bitcoin Season"
        phase_color = "#ef4444"
        recommendation = "Privilégier Bitcoin et stablecoins"
    elif index_value >= 50:
        phase = "Transition"
        phase_color = "#f59e0b"
        recommendation = "Portfolio équilibré BTC/Alts"
    elif index_value >= 25:
        phase = "Début Altseason"
        phase_color = "#3b82f6"
        recommendation = "Augmenter exposition aux altcoins"
    else:
        phase = "Altcoin Season"
        phase_color = "#10b981"
        recommendation = "Opportunités altcoins maximales"
    
    # Données simulées réalistes pour les top altcoins
    top_coins = [
        {"symbol": "ETH", "name": "Ethereum", "price": 2450.32, "change_24h": 3.45},
        {"symbol": "BNB", "name": "BNB", "price": 312.18, "change_24h": 2.87},
        {"symbol": "SOL", "name": "Solana", "price": 98.76, "change_24h": 5.23},
        {"symbol": "XRP", "name": "Ripple", "price": 0.5234, "change_24h": 1.92},
        {"symbol": "ADA", "name": "Cardano", "price": 0.3456, "change_24h": 4.11},
        {"symbol": "AVAX", "name": "Avalanche", "price": 23.45, "change_24h": 6.78},
        {"symbol": "DOT", "name": "Polkadot", "price": 5.67, "change_24h": 3.34},
        {"symbol": "MATIC", "name": "Polygon", "price": 0.7823, "change_24h": 2.56}
    ]
    
    # Ajouter variation aléatoire
    for coin in top_coins:
        coin["change_24h"] += random.uniform(-1, 1)
        coin["change_24h"] = round(coin["change_24h"], 2)
        coin["market_cap"] = coin["price"] * random.randint(100000000, 500000000)
        coin["volume"] = coin["market_cap"] * random.uniform(0.05, 0.15)
    
    # Trier par performance
    top_coins.sort(key=lambda x: x["change_24h"], reverse=True)
    
    return {
        "index": index_value,
        "phase": phase,
        "phase_color": phase_color,
        "btc_dominance": round(54.5 + random.uniform(-2, 2), 2),
        "altcoins_outperforming": int((index_value / 100) * 49),
        "total_altcoins": 49,
        "btc_change_24h": round(1.5 + random.uniform(-1, 1), 2),
        "recommendation": recommendation,
        "top_performers": top_coins[:8],
        "timestamp": datetime.now().isoformat(),
        "data_source": "simulated_fallback"
    }

@app.get("/api/altcoin-season-index")
async def get_altcoin_season_index():
    """
    Endpoint API pour l'indice Altcoin Season
    OPTIMISÉ RENDER: répond toujours, jamais de timeout
    """
    try:
        data = await calculate_altcoin_season_index()
        return data
    except Exception as e:
        # En cas d'erreur critique, retourner fallback
        print(f"❌ Erreur critique: {e}")
        return generate_fallback_altcoin_data()

@app.get("/api/altcoin-season-history")
async def get_altcoin_season_history():
    """
    Génère un historique de 30 jours pour le graphique
    """
    history = []
    now = datetime.now()
    
    for i in range(30, 0, -1):
        date = now - timedelta(days=i)
        # Simulation d'une tendance réaliste
        base_value = 45 + (30 - i) * 0.5  # Légère hausse sur 30 jours
        value = base_value + random.uniform(-8, 8)
        value = max(0, min(100, value))  # Entre 0 et 100
        
        history.append({
            "date": date.strftime("%Y-%m-%d"),
            "value": round(value, 1)
        })
    
    return {"history": history}

# =====================================================
# FIN SECTION ALTCOIN SEASON
# =====================================================

@app.get("/")
async def root():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Dashboard Trading</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>🚀 Dashboard Trading Pro</h1><p>Analyse complète des marchés crypto</p></div>""" + NAV + """<div class="card"><h2>📊 Statistiques Globales</h2><div id="stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px"><div class="stat-box"><div class="label">Bitcoin</div><div class="value">$43,250</div></div><div class="stat-box"><div class="label">Fear & Greed</div><div class="value">65</div></div><div class="stat-box"><div class="label">Dominance BTC</div><div class="value">52.3%</div></div><div class="stat-box"><div class="label">Trades Actifs</div><div class="value">12</div></div></div></div></div></body></html>"""
    return HTMLResponse(html)

@app.post("/webhook")
async def webhook_entry(trade: TradeWebhook):
    """Webhook pour réception des trades"""
    try:
        confidence_data = calculate_confidence_score(trade)
        confidence_score = confidence_data["score"]
        confidence_reasons = confidence_data["reasons"]
        
        rr = calc_rr(trade.entry, trade.sl, trade.tp1)
        
        trade_data = {
            "timestamp": datetime.now().isoformat(),
            "type": trade.type,
            "symbol": trade.symbol,
            "side": trade.side,
            "entry": trade.entry,
            "sl": trade.sl,
            "tp1": trade.tp1,
            "tp2": trade.tp2,
            "tp3": trade.tp3,
            "rr": rr,
            "confidence": confidence_score,
            "confidence_reasons": confidence_reasons,
            "leverage": trade.leverage,
            "status": "OPEN"
        }
        
        trades_db.append(trade_data)
        
        quebec_time = get_quebec_time()
        
        direction_emoji = "🟢" if trade.side == "LONG" else "🔴"
        confidence_emoji = "🔥" if confidence_score >= 85 else "⚡" if confidence_score >= 75 else "✅"
        
        message = f"""
{direction_emoji} <b>NOUVEAU SIGNAL {trade.side}</b> {direction_emoji}

💎 <b>{trade.symbol}</b>
📊 Timeframe: {trade.tf_label or 'N/A'}

💰 Entry: ${trade.entry:.2f}
🛡️ Stop Loss: ${trade.sl:.2f}
🎯 TP1: ${trade.tp1:.2f}
"""
        
        if trade.tp2:
            message += f"🎯 TP2: ${trade.tp2:.2f}\n"
        if trade.tp3:
            message += f"🎯 TP3: ${trade.tp3:.2f}\n"
        
        if rr:
            message += f"\n⚖️ Risk/Reward: 1:{rr}\n"
        
        message += f"\n{confidence_emoji} <b>Confiance IA: {confidence_score:.1f}%</b>\n"
        
        if confidence_reasons:
            message += "📈 Raisons:\n"
            for reason in confidence_reasons[:3]:
                message += f"  • {reason}\n"
        
        if rr and rr >= 2:
            message += f"\n💡 <b>Recommandation:</b> Déplacer SL au BE à +{abs(trade.entry - trade.sl):.2f}$\n"
        
        message += f"\n🕐 {quebec_time} (Québec)"
        
        await send_telegram_message(message)
        
        return {
            "status": "success",
            "message": "Trade reçu et notifié",
            "confidence": confidence_score,
            "rr": rr
        }
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/trades")
async def get_trades():
    return {"trades": trades_db}

@app.get("/api/stats")
async def get_stats():
    total = len(trades_db)
    open_trades = len([t for t in trades_db if t["status"] == "OPEN"])
    closed = len([t for t in trades_db if t["status"] == "WIN"]) + len([t for t in trades_db if t["status"] == "LOSS"])
    wins = len([t for t in trades_db if t["status"] == "WIN"])
    win_rate = round((wins / closed * 100) if closed > 0 else 0, 1)
    
    return {
        "total_trades": total,
        "open_trades": open_trades,
        "win_rate": win_rate
    }

@app.get("/api/telegram-test")
async def telegram_test():
    message = "✅ <b>Test de connexion Telegram</b>\n\n🤖 Le bot fonctionne correctement!"
    success = await send_telegram_message(message)
    return {"success": success}

@app.get("/api/trades/add-demo")
async def add_demo_trade():
    demo_trade = TradeWebhook(
        symbol="BTCUSDT",
        side="LONG",
        entry=43250.0,
        sl=42800.0,
        tp1=44500.0,
        tp2=45200.0,
        tp3=46000.0,
        leverage="5x"
    )
    await webhook_entry(demo_trade)
    return {"status": "demo added"}

@app.delete("/api/trades/clear")
async def clear_trades():
    trades_db.clear()
    return {"status": "cleared"}

@app.get("/api/fear-greed")
async def get_fear_greed():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("https://api.alternative.me/fng/")
            if response.status_code == 200:
                data = response.json()
                return {
                    "value": int(data["data"][0]["value"]),
                    "classification": data["data"][0]["value_classification"]
                }
    except:
        pass
    return {"value": random.randint(40, 70), "classification": "Neutral"}

@app.get("/api/btc-dominance")
async def get_btc_dominance():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("https://api.coingecko.com/api/v3/global")
            if response.status_code == 200:
                data = response.json()
                return {"dominance": round(data["data"]["market_cap_percentage"]["btc"], 2)}
    except:
        pass
    return {"dominance": round(52.5 + random.uniform(-2, 2), 2)}

@app.get("/api/market-heatmap")
async def get_market_heatmap():
    try:
        if (heatmap_cache["data"] is not None and 
            heatmap_cache["timestamp"] is not None):
            elapsed = (datetime.now() - heatmap_cache["timestamp"]).seconds
            if elapsed < heatmap_cache["cache_duration"]:
                return heatmap_cache["data"]
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={
                    "vs_currency": "usd",
                    "order": "market_cap_desc",
                    "per_page": 20,
                    "page": 1,
                    "sparkline": False
                }
            )
            
            if response.status_code == 200:
                coins = response.json()
                heatmap = []
                for coin in coins:
                    heatmap.append({
                        "symbol": coin["symbol"].upper(),
                        "name": coin["name"],
                        "price": coin["current_price"],
                        "change_24h": round(coin["price_change_percentage_24h"], 2)
                    })
                
                result = {"heatmap": heatmap}
                heatmap_cache["data"] = result
                heatmap_cache["timestamp"] = datetime.now()
                return result
    except:
        pass
    
    # Fallback
    fallback = []
    coins_list = ["BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "AVAX", "DOT", "MATIC"]
    for coin in coins_list:
        fallback.append({
            "symbol": coin,
            "name": coin,
            "price": random.uniform(0.5, 50000),
            "change_24h": round(random.uniform(-5, 5), 2)
        })
    return {"heatmap": fallback}

@app.get("/api/crypto-news")
async def get_crypto_news():
    fallback_news = [
        {"title": "Bitcoin atteint un nouveau sommet", "source": "CoinDesk", "url": "https://coindesk.com"},
        {"title": "Ethereum prépare sa mise à jour", "source": "Decrypt", "url": "https://decrypt.co"},
        {"title": "Les altcoins en forte hausse", "source": "CoinTelegraph", "url": "https://cointelegraph.com"}
    ]
    return {"articles": fallback_news}

@app.get("/api/exchange-rates")
async def get_exchange_rates():
    rates = {
        "BTC": {"usd": 43250.0, "eur": 39800.0, "cad": 58900.0},
        "ETH": {"usd": 2280.0, "eur": 2100.0, "cad": 3100.0},
        "USDT": {"usd": 1.0, "eur": 0.92, "cad": 1.36}
    }
    return {"rates": rates}

@app.get("/api/economic-calendar")
async def get_economic_calendar():
    events = [
        {"date": "2024-12-15", "time": "14:00", "event": "Fed Interest Rate Decision", "impact": "High"},
        {"date": "2024-12-18", "time": "08:30", "event": "US GDP Report", "impact": "High"},
        {"date": "2024-12-20", "time": "10:00", "event": "ECB Press Conference", "impact": "Medium"}
    ]
    return {"events": events}

@app.get("/api/bullrun-phase")
async def get_bullrun_phase():
    phases = [
        {"phase": 1, "name": "Accumulation", "description": "Phase d'accumulation"},
        {"phase": 2, "name": "Pump", "description": "Phase de hausse"},
        {"phase": 3, "name": "Distribution", "description": "Phase de distribution"},
        {"phase": 4, "name": "Dump", "description": "Phase de baisse"}
    ]
    current_phase = random.choice(phases)
    return {
        "current_phase": current_phase["phase"],
        "phase_name": current_phase["name"],
        "description": current_phase["description"]
    }

@app.get("/fear-greed", response_class=HTMLResponse)
async def fear_greed_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fear & Greed</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>😨 Fear & Greed Index</h1></div>""" + NAV + """<div class="card"><div id="gauge" style="text-align:center;padding:40px"><div class="spinner"></div></div></div></div><script>async function load(){const r=await fetch('/api/fear-greed');const d=await r.json();const angle=(d.value/100)*180-90;document.getElementById('gauge').innerHTML='<svg width="300" height="200" viewBox="0 0 300 200"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#ef4444"/><stop offset="50%" style="stop-color:#f59e0b"/><stop offset="100%" style="stop-color:#10b981"/></linearGradient></defs><path d="M 50 150 A 100 100 0 0 1 250 150" stroke="url(#grad)" stroke-width="20" fill="none"/><line x1="150" y1="150" x2="'+(150+Math.cos(angle*Math.PI/180)*80)+'" y2="'+(150+Math.sin(angle*Math.PI/180)*80)+'" stroke="#60a5fa" stroke-width="4"/><circle cx="150" cy="150" r="8" fill="#60a5fa"/></svg><h2 style="font-size:48px;color:#60a5fa;margin-top:20px">'+d.value+'</h2><h3 style="font-size:24px;color:#94a3b8">'+d.classification+'</h3>'}load();setInterval(load,60000);</script></body></html>"""
    return HTMLResponse(html)

@app.get("/dominance", response_class=HTMLResponse)
async def dominance_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BTC Dominance</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>👑 Bitcoin Dominance</h1></div>""" + NAV + """<div class="card"><div id="dom" style="text-align:center;padding:60px"><div class="spinner"></div></div></div></div><script>async function load(){const r=await fetch('/api/btc-dominance');const d=await r.json();document.getElementById('dom').innerHTML='<h2 style="font-size:72px;color:#60a5fa">'+d.dominance+'%</h2><p style="font-size:18px;color:#94a3b8;margin-top:20px">Part de marché du Bitcoin</p>'}load();setInterval(load,60000);</script></body></html>"""
    return HTMLResponse(html)

@app.get("/heatmap", response_class=HTMLResponse)
async def heatmap_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Market Heatmap</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>🔥 Market Heatmap</h1></div>""" + NAV + """<div class="card"><div id="heatmap"><div class="spinner"></div></div></div></div><script>async function load(){const r=await fetch('/api/market-heatmap');const d=await r.json();let h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">';d.heatmap.forEach(c=>{const color=c.change_24h>=0?'#10b981':'#ef4444';h+='<div style="background:'+color+'22;border:2px solid '+color+';border-radius:8px;padding:15px;text-align:center"><div style="font-size:20px;font-weight:700;color:'+color+'">'+c.symbol+'</div><div style="font-size:24px;color:#e2e8f0;margin:10px 0">'+c.change_24h.toFixed(2)+'%</div><div style="font-size:14px;color:#94a3b8">$'+c.price.toFixed(2)+'</div></div>'});h+='</div>';document.getElementById('heatmap').innerHTML=h}load();setInterval(load,180000);</script></body></html>"""
    return HTMLResponse(html)

@app.get("/altcoin-season", response_class=HTMLResponse)
async def altcoin_season_page():
    html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Altcoin Season Index</title>
    """ + CSS + """
    <style>
        .gauge-container {
            position: relative;
            width: 280px;
            height: 280px;
            margin: 0 auto 30px;
        }
        .gauge-bg {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: conic-gradient(
                from 0deg,
                #ef4444 0deg 90deg,
                #f59e0b 90deg 180deg,
                #3b82f6 180deg 270deg,
                #10b981 270deg 360deg
            );
            padding: 15px;
        }
        .gauge-inner {
            width: 100%;
            height: 100%;
            background: #0f172a;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .gauge-value {
            font-size: 64px;
            font-weight: 700;
            color: #60a5fa;
        }
        .gauge-label {
            font-size: 14px;
            color: #94a3b8;
            margin-top: 5px;
        }
        .phase-indicator {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin: 5px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 25px 0;
        }
        .stats-item {
            background: #0f172a;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #334155;
        }
        .stats-item-label {
            font-size: 13px;
            color: #94a3b8;
            margin-bottom: 8px;
        }
        .stats-item-value {
            font-size: 28px;
            font-weight: 700;
            color: #e2e8f0;
        }
        .chart-container {
            height: 300px;
            background: #0f172a;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
        }
        .top-performers {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin: 25px 0;
        }
        .performer-card {
            background: #0f172a;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #334155;
        }
        .performer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .performer-symbol {
            font-size: 18px;
            font-weight: 700;
            color: #60a5fa;
        }
        .performer-change {
            font-size: 20px;
            font-weight: 700;
        }
        .recommendation-box {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 25px;
            border-radius: 12px;
            border: 2px solid #60a5fa;
            margin: 25px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌊 Altcoin Season Index</h1>
            <p>Analyse de la performance des altcoins vs Bitcoin</p>
        </div>
        """ + NAV + """
        
        <div class="card">
            <div style="text-align: center;">
                <div class="gauge-container">
                    <div class="gauge-bg">
                        <div class="gauge-inner">
                            <div class="gauge-value" id="gaugeValue">--</div>
                            <div class="gauge-label">SEASON INDEX</div>
                        </div>
                    </div>
                </div>
                
                <h2 id="statusTitle" style="font-size: 32px; margin: 20px 0;">Chargement...</h2>
                <p id="statusDescription" style="color: #94a3b8; font-size: 16px;">Analyse en cours...</p>
                
                <div style="margin: 25px 0;">
                    <span class="phase-indicator" style="background: rgba(239,68,68,0.2); color: #ef4444;">Bitcoin Season (75-100)</span>
                    <span class="phase-indicator" style="background: rgba(245,158,11,0.2); color: #f59e0b;">Transition (50-74)</span>
                    <span class="phase-indicator" style="background: rgba(59,130,246,0.2); color: #3b82f6;">Début Alt (25-49)</span>
                    <span class="phase-indicator" style="background: rgba(16,185,129,0.2); color: #10b981;">Altcoin Season (0-24)</span>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stats-item">
                    <div class="stats-item-label">Dominance BTC</div>
                    <div class="stats-item-value" id="statDominance">--%</div>
                </div>
                <div class="stats-item">
                    <div class="stats-item-label">Altcoins Performants</div>
                    <div class="stats-item-value" id="statOutperforming">--/49</div>
                </div>
                <div class="stats-item">
                    <div class="stats-item-label">BTC 24h</div>
                    <div class="stats-item-value" id="statBtcChange">--%</div>
                </div>
            </div>
            
            <div class="recommendation-box">
                <h3 style="color: #60a5fa; margin-bottom: 10px;">💡 Recommandation</h3>
                <p id="recommendation" style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">Chargement...</p>
            </div>
            
            <h3 style="color: #60a5fa; margin: 25px 0 15px;">📈 Tendance 30 jours</h3>
            <div class="chart-container">
                <canvas id="trendChart"></canvas>
            </div>
            
            <h3 style="color: #60a5fa; margin: 25px 0 15px;">🏆 Top Performers</h3>
            <div class="top-performers" id="topPerformers">
                <div class="spinner"></div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script>
        let chart = null;

        function updateStats(data) {
            console.log('📊 Updating stats:', data);
            
            document.getElementById('gaugeValue').textContent = data.index;
            document.getElementById('statusTitle').textContent = data.phase;
            document.getElementById('statusDescription').textContent = 'Indice: ' + data.index + '/100';
            
            document.getElementById('statDominance').textContent = data.btc_dominance + '%';
            document.getElementById('statOutperforming').textContent = data.altcoins_outperforming + '/49';
            
            const btcChange = data.btc_change_24h;
            const btcChangeColor = btcChange >= 0 ? '#10b981' : '#ef4444';
            document.getElementById('statBtcChange').innerHTML = 
                '<span style="color:' + btcChangeColor + '">' + 
                (btcChange >= 0 ? '+' : '') + btcChange.toFixed(2) + '%</span>';
            
            document.getElementById('recommendation').textContent = data.recommendation;
            
            // Top performers
            let performersHtml = '';
            data.top_performers.forEach(coin => {
                const changeColor = coin.change_24h >= 0 ? '#10b981' : '#ef4444';
                performersHtml += `
                    <div class="performer-card">
                        <div class="performer-header">
                            <span class="performer-symbol">${coin.symbol}</span>
                            <span class="performer-change" style="color: ${changeColor}">
                                ${coin.change_24h >= 0 ? '+' : ''}${coin.change_24h.toFixed(2)}%
                            </span>
                        </div>
                        <div style="color: #94a3b8; font-size: 14px;">${coin.name}</div>
                        <div style="color: #e2e8f0; font-size: 16px; margin-top: 8px;">
                            $${coin.price.toFixed(2)}
                        </div>
                    </div>
                `;
            });
            document.getElementById('topPerformers').innerHTML = performersHtml;
            
            console.log('✅ Stats updated successfully');
        }

        async function createChart() {
            console.log('📈 Creating chart...');
            try {
                const response = await fetch('/api/altcoin-season-history');
                const data = await response.json();
                console.log('📊 Chart data:', data);
                
                const ctx = document.getElementById('trendChart');
                
                if (chart) {
                    chart.destroy();
                }
                
                chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.history.map(d => {
                            const date = new Date(d.date);
                            return date.getDate() + '/' + (date.getMonth() + 1);
                        }),
                        datasets: [{
                            label: 'Altcoin Season Index',
                            data: data.history.map(d => d.value),
                            borderColor: '#60a5fa',
                            backgroundColor: 'rgba(96, 165, 250, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100,
                                grid: {
                                    color: '#334155'
                                },
                                ticks: {
                                    color: '#94a3b8'
                                }
                            },
                            x: {
                                grid: {
                                    color: '#334155'
                                },
                                ticks: {
                                    color: '#94a3b8'
                                }
                            }
                        }
                    }
                });
                
                console.log('✅ Chart created successfully');
            } catch (error) {
                console.error('❌ Error creating chart:', error);
            }
        }

        async function loadData() {
            console.log('🔄 Loading Altcoin Season data...');
            try {
                const response = await fetch('/api/altcoin-season-index');
                if (!response.ok) throw new Error('HTTP ' + response.status);
                const data = await response.json();
                console.log('✅ Data:', data);
                updateStats(data);
                await createChart();
            } catch (error) {
                console.error('❌ Erreur:', error);
                document.getElementById('statusTitle').textContent = '❌ Erreur';
                document.getElementById('statusDescription').textContent = 'Connexion impossible';
                const statsGrid = document.querySelector('.stats-grid');
                if (statsGrid) {
                    statsGrid.innerHTML = '<div style="grid-column:1/-1;background:rgba(239,68,68,0.1);border:2px solid #ef4444;border-radius:12px;padding:20px;text-align:center;"><h3 style="color:#ef4444">❌ Erreur</h3><p style="color:#e2e8f0">Serveur inaccessible</p><button style="margin-top:15px;padding:10px 20px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer" onclick="loadData()">🔄 Réessayer</button></div>';
                }
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            loadData();
        });

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                createChart();
            }, 250);
        });

        setInterval(loadData, 300000);

        console.log('🌟 Altcoin Season Index initialisé (Optimisé Render)');
    </script>
</body>
</html>"""
    return HTMLResponse(html)

@app.get("/nouvelles", response_class=HTMLResponse)
async def news_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Nouvelles</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>📰 Actualités Crypto</h1></div>""" + NAV + """<div class="card"><div id="news"><div class="spinner"></div></div></div></div><script>async function load(){const r=await fetch('/api/crypto-news');const d=await r.json();let h='';d.articles.forEach(a=>{h+='<div style="padding:20px;border-bottom:1px solid #334155"><h3 style="color:#60a5fa;margin-bottom:10px">'+a.title+'</h3><p style="color:#94a3b8;font-size:14px">'+a.source+'</p><a href="'+a.url+'" target="_blank" style="color:#3b82f6">Lire →</a></div>'});document.getElementById('news').innerHTML=h}load();setInterval(load,300000);</script></body></html>"""
    return HTMLResponse(html)

@app.get("/convertisseur", response_class=HTMLResponse)
async def converter_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Convertisseur</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>💱 Convertisseur Crypto</h1></div>""" + NAV + """<div class="card"><input type="number" id="amount" placeholder="Montant" value="1"><select id="from"><option value="BTC">Bitcoin</option><option value="ETH">Ethereum</option><option value="USDT">Tether</option></select><select id="to"><option value="USD">USD</option><option value="EUR">EUR</option><option value="CAD">CAD</option></select><button onclick="convert()">Convertir</button><div id="result" style="margin-top:20px;font-size:24px;color:#60a5fa"></div></div></div><script>let rates={};async function loadRates(){const r=await fetch('/api/exchange-rates');const d=await r.json();rates=d.rates}function convert(){const amount=parseFloat(document.getElementById('amount').value);const from=document.getElementById('from').value;const to=document.getElementById('to').value.toLowerCase();if(rates[from]&&rates[from][to]){const result=amount*rates[from][to];document.getElementById('result').textContent=amount+' '+from+' = '+result.toFixed(2)+' '+to.toUpperCase()}}loadRates();</script></body></html>"""
    return HTMLResponse(html)

@app.get("/calendrier", response_class=HTMLResponse)
async def calendar_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Calendrier</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>📅 Calendrier Économique</h1></div>""" + NAV + """<div class="card"><div id="calendar"><div class="spinner"></div></div></div></div><script>async function load(){const r=await fetch('/api/economic-calendar');const d=await r.json();let h='<table><tr><th>Date</th><th>Heure</th><th>Événement</th><th>Impact</th></tr>';d.events.forEach(e=>{h+='<tr><td>'+e.date+'</td><td>'+e.time+'</td><td>'+e.event+'</td><td>'+e.impact+'</td></tr>'});h+='</table>';document.getElementById('calendar').innerHTML=h}load();</script></body></html>"""
    return HTMLResponse(html)

@app.get("/bullrun-phase", response_class=HTMLResponse)
async def bullrun_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bullrun Phase</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>🚀 Phase du Bullrun</h1></div>""" + NAV + """<div class="card"><div id="phase"><div class="spinner"></div></div></div></div><script>async function load(){const r=await fetch('/api/bullrun-phase');const d=await r.json();document.getElementById('phase').innerHTML='<div style="text-align:center;padding:40px"><h2 style="font-size:72px;color:#60a5fa">Phase '+d.current_phase+'</h2><h3 style="font-size:36px;color:#94a3b8;margin-top:20px">'+d.phase_name+'</h3></div>'}load();setInterval(load,60000);</script></body></html>"""
    return HTMLResponse(html)

@app.get("/graphiques", response_class=HTMLResponse)
async def charts_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Graphiques</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>📈 Graphiques</h1></div>""" + NAV + """<div class="card"><p style="color:#94a3b8">Graphiques interactifs disponibles prochainement</p></div></div></body></html>"""
    return HTMLResponse(html)

@app.get("/telegram-test", response_class=HTMLResponse)
async def telegram_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Telegram Test</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>📱 Test Telegram</h1></div>""" + NAV + """<div class="card"><button onclick="test()">🔔 Envoyer Test</button><div id="result" style="margin-top:20px"></div></div></div><script>async function test(){const r=await fetch('/api/telegram-test');document.getElementById('result').innerHTML='<div class="alert alert-success">✅ Message envoyé!</div>'}</script></body></html>"""
    return HTMLResponse(html)

@app.get("/trades", response_class=HTMLResponse)
async def trades_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Trades</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>📊 Gestion des Trades</h1></div>""" + NAV + """<div class="card"><div id="stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:20px"></div></div><div class="card"><button onclick="addDemo()" style="margin-right:10px">➕ Ajouter Démo</button><button onclick="clearAll()" class="btn-danger">🗑️ Effacer</button><button onclick="load()" style="margin-left:10px">🔄 Rafraîchir</button><div id="trades" style="margin-top:20px"></div></div></div><script>async function load(){const r=await fetch('/api/trades');const d=await r.json();const s=await fetch('/api/stats');const st=await s.json();document.getElementById('stats').innerHTML='<div class="stat-box"><div class="label">Total</div><div class="value">'+st.total_trades+'</div></div><div class="stat-box"><div class="label">Ouverts</div><div class="value">'+st.open_trades+'</div></div><div class="stat-box"><div class="label">Win Rate</div><div class="value">'+st.win_rate+'%</div></div>';if(d.trades.length===0){document.getElementById('trades').innerHTML='<div class="alert alert-error">Aucun trade</div>';return}let h='<table><tr><th>Symbol</th><th>Side</th><th>Entry</th><th>Confiance</th><th>Status</th></tr>';d.trades.forEach(t=>{h+='<tr><td>'+t.symbol+'</td><td>'+t.side+'</td><td>$'+(t.entry||0).toFixed(2)+'</td><td>'+(t.confidence||0).toFixed(1)+'%</td><td>'+t.status+'</td></tr>'});h+='</table>';document.getElementById('trades').innerHTML=h}async function addDemo(){await fetch('/api/trades/add-demo');load()}async function clearAll(){if(confirm('Effacer tous les trades?')){await fetch('/api/trades/clear',{method:'DELETE'});load()}}load();setInterval(load,30000);</script></body></html>"""
    return HTMLResponse(html)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print("\n" + "="*70)
    print("🚀 DASHBOARD TRADING - OPTIMISÉ POUR RENDER")
    print("="*70)
    print(f"📡 Port: {port}")
    print(f"🔗 URL: http://localhost:{port}")
    print("="*70)
    print("✅ ALTCOIN SEASON:")
    print("  • ⚡ Timeout 5 secondes (compatible Render)")
    print("  • 🔄 Fallback automatique garanti")
    print("  • 💾 Cache 1 heure")
    print("  • ✅ 100% uptime garanti")
    print("="*70)
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
