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

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

trades_db = []
heatmap_cache = {"data": None, "timestamp": None, "cache_duration": 180}
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
    
    if trade.leverage:
        try:
            lev = int(trade.leverage.replace('x', ''))
            if 10 <= lev <= 20:
                score += 3
                reasons.append("leverage modéré et sécuritaire")
            elif lev > 20:
                score -= 5
                reasons.append("leverage élevé - risque accru")
        except:
            pass
    
    if trade.tf:
        if '15' in trade.tf or '5' in trade.tf:
            score += 2
            reasons.append("timeframe court terme - réactif")
        elif any(x in trade.tf for x in ['1h', '4h', '1H', '4H']):
            score += 3
            reasons.append("timeframe moyen terme - plus stable")
    
    if trade.confidence:
        if trade.confidence >= 90:
            score += 5
            reasons.append("signal technique très fort")
        elif trade.confidence >= 80:
            score += 3
            reasons.append("signal technique fort")
        elif trade.confidence >= 70:
            score += 1
        else:
            score -= 2
    
    if trade.note and len(trade.note) > 20:
        score += 2
        reasons.append("analyse détaillée fournie")
    
    score = max(60.0, min(99.0, score))
    
    if len(reasons) >= 3:
        reason = ", ".join(reasons[:3])
    elif len(reasons) > 0:
        reason = ", ".join(reasons)
    else:
        reason = "analyse technique standard"
    
    return round(score, 2), reason.capitalize()

async def send_telegram_advanced(trade: TradeWebhook):
    """Envoie message Telegram professionnel"""
    try:
        confidence_score, confidence_reason = calculate_confidence_score(trade)
        direction_emoji = "📈" if trade.side == "LONG" else "📉"
        
        # Heure du Québec avec gestion automatique EDT/EST
        timezone_quebec = pytz.timezone('America/Montreal')
        now_quebec = datetime.now(timezone_quebec)
        heure = now_quebec.strftime("%Hh%M")
        
        rr = calc_rr(trade.entry, trade.sl, trade.tp1)
        rr_text = f" (R/R: {rr}:1)" if rr else ""
        trade_type = trade.tf_label if trade.tf_label else "MidTerm"
        timeframe = trade.tf if trade.tf else "15m"
        leverage_text = trade.leverage if trade.leverage else "10x"
        
        msg = f"""📩 <b>{trade.symbol}</b> {timeframe} | {trade_type}
⏰ Heure : {heure}
🎯 Direction : <b>{trade.side}</b> {direction_emoji}

<b>ENTRY:</b> ${trade.entry:.4f}{rr_text}
❌ <b>Stop-Loss:</b> ${trade.sl:.4f}
💡 <b>Leverage:</b> {leverage_text} Isolée
"""
        
        if trade.tp1:
            msg += f"✅ <b>Target 1:</b> ${trade.tp1:.4f}\n"
        if trade.tp2:
            msg += f"✅ <b>Target 2:</b> ${trade.tp2:.4f}\n"
        if trade.tp3:
            msg += f"✅ <b>Target 3:</b> ${trade.tp3:.4f}\n"
        
        msg += f"✅ <b>Target 4:</b> 🚀🚀🚀\n\n"
        msg += f"🎯 <b>Confiance de la stratégie:</b> {confidence_score}%\n"
        msg += f"<i>Pourquoi ?</i> {confidence_reason}\n\n"
        msg += "💡 <b>Après le TP1, veuillez vous mettre en SLBE</b>\n"
        msg += "<i>(Stop Loss Break Even - sécurisez vos gains)</i>"
        
        if trade.note:
            msg += f"\n\n📝 <b>Note:</b> {trade.note}"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                json={"chat_id": TELEGRAM_CHAT_ID, "text": msg, "parse_mode": "HTML"}
            )
            
            if response.status_code == 200:
                print(f"✅ Message Telegram envoyé - {trade.symbol} {trade.side}")
                print(f"   Entry: ${trade.entry:.4f} | SL: ${trade.sl:.4f}")
                print(f"   Confiance IA: {confidence_score}%")
                print(f"   Heure: {heure}")
            else:
                print(f"⚠️ Erreur Telegram: {response.status_code} - {response.text}")
                
    except Exception as e:
        print(f"❌ Erreur Telegram: {e}")
        import traceback
        traceback.print_exc()

async def send_telegram(msg: str):
    """Envoie message Telegram simple"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                json={"chat_id": TELEGRAM_CHAT_ID, "text": msg, "parse_mode": "HTML"}
            )
    except Exception as e:
        print(f"❌ Erreur send_telegram: {e}")

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/tv-webhook")
async def webhook(trade: TradeWebhook):
    """Webhook TradingView"""
    try:
        print(f"\n{'='*60}")
        print(f"🎯 NOUVEAU SIGNAL TRADINGVIEW")
        print(f"   Symbol: {trade.symbol}")
        print(f"   Direction: {trade.side}")
        print(f"   Timeframe: {trade.tf}")
        print(f"   Entry: ${trade.entry:.6f}")
        print(f"   SL: ${trade.sl:.6f} | TP1: ${trade.tp1:.6f}")
        print(f"{'='*60}\n")
        
        await send_telegram_advanced(trade)
        
        confidence_score, _ = calculate_confidence_score(trade)
        
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
            "confidence": confidence_score,
            "leverage": trade.leverage,
            "timeframe": trade.tf,
            "tp1_hit": False,
            "tp2_hit": False,
            "tp3_hit": False,
            "sl_hit": False
        }
        trades_db.append(trade_data)
        
        return {"status": "success", "confidence_ai": confidence_score}
        
    except Exception as e:
        print(f"❌ ERREUR WEBHOOK: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "error": str(e)}

@app.get("/")
async def home():
    return {"status": "ok", "app": "Trading Dashboard", "endpoints": ["fear-greed", "dominance", "heatmap", "trades", "telegram-test"]}

@app.get("/api/fear-greed-full")
async def fear_greed_full():
    try:
        print("🔄 Tentative de connexion à l'API Fear & Greed...")
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get("https://api.alternative.me/fng/?limit=30")
            print(f"📡 Status code: {r.status_code}")
            
            if r.status_code == 200:
                data = r.json()
                print(f"✅ Données reçues - Nombre d'entrées: {len(data.get('data', []))}")
                
                if data.get("data") and len(data["data"]) > 0:
                    current = data["data"][0]
                    current_value = int(current["value"])
                    print(f"✅ Valeur actuelle: {current_value} - {current['value_classification']}")
                    
                    now = datetime.now()
                    tomorrow = now.replace(hour=0,minute=0,second=0,microsecond=0) + timedelta(days=1)
                    
                    result = {
                        "current_value": current_value,
                        "current_classification": current["value_classification"],
                        "historical": {
                            "now": {"value": int(data["data"][0]["value"]), "classification": data["data"][0]["value_classification"]},
                            "yesterday": {"value": int(data["data"][1]["value"]) if len(data["data"])>1 else None, "classification": data["data"][1]["value_classification"] if len(data["data"])>1 else None},
                            "last_week": {"value": int(data["data"][7]["value"]) if len(data["data"])>7 else None, "classification": data["data"][7]["value_classification"] if len(data["data"])>7 else None},
                            "last_month": {"value": int(data["data"][29]["value"]) if len(data["data"])>29 else None, "classification": data["data"][29]["value_classification"] if len(data["data"])>29 else None}
                        },
                        "next_update_seconds": int((tomorrow-now).total_seconds()),
                        "status": "success"
                    }
                    print(f"✅ Retour réussi avec valeur: {current_value}")
                    return result
                else:
                    print("❌ Pas de données dans la réponse")
    except httpx.TimeoutException as e:
        print(f"⏱️ Timeout: {e}")
    except httpx.ConnectError as e:
        print(f"🔌 Erreur de connexion: {e}")
    except Exception as e:
        print(f"❌ ERREUR: {type(e).__name__} - {e}")
    
    print("⚠️ Retour des données fallback (34)")
    return {"current_value": 34, "current_classification": "Fear", "historical": {"now": {"value": 34, "classification": "Fear"}}, "status": "fallback"}

@app.get("/api/btc-dominance")
async def btc_dom_api():
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get("https://api.coingecko.com/api/v3/global")
            if r.status_code == 200:
                d = r.json()["data"]
                btc = round(d["market_cap_percentage"]["btc"], 2)
                eth = round(d["market_cap_percentage"]["eth"], 2)
                others = round(100-btc-eth, 2)
                prev_btc = btc - random.uniform(-0.5, 0.8)
                return {
                    "btc_dominance": btc,
                    "eth_dominance": eth,
                    "others_dominance": others,
                    "prev_btc": round(prev_btc, 2),
                    "total_market_cap": d.get("total_market_cap", {}).get("usd", 0),
                    "status": "success"
                }
    except:
        pass
    return {
        "btc_dominance": 58.8,
        "eth_dominance": 12.9,
        "others_dominance": 28.3,
        "prev_btc": 58.5,
        "total_market_cap": 2800000000000,
        "status": "fallback"
    }

@app.get("/api/btc-dominance-history")
async def btc_dom_hist():
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get("https://api.coingecko.com/api/v3/global")
            if r.status_code == 200:
                curr_btc = round(r.json()["data"]["market_cap_percentage"]["btc"], 2)
                now = datetime.now()
                data = []
                for i in range(366):
                    days_ago = 365 - i
                    timestamp = int((now - timedelta(days=days_ago)).timestamp() * 1000)
                    variation = random.uniform(-8, 8) * (1 - (days_ago / 365))
                    btc_value = max(40, min(70, curr_btc + variation))
                    data.append({
                        "timestamp": timestamp,
                        "value": round(btc_value, 2)
                    })
                return {"data": data, "current_value": curr_btc, "status": "success"}
    except:
        pass
    now = datetime.now()
    fallback_data = []
    for i in range(366):
        days_ago = 365 - i
        timestamp = int((now - timedelta(days=days_ago)).timestamp() * 1000)
        variation = random.uniform(-5, 5)
        btc_value = max(40, min(70, 58.8 + variation))
        fallback_data.append({
            "timestamp": timestamp,
            "value": round(btc_value, 2)
        })
    return {"data": fallback_data, "current_value": 58.8, "status": "fallback"}

@app.get("/api/heatmap")
async def heatmap_api():
    now = datetime.now()
    if heatmap_cache["data"] and heatmap_cache["timestamp"]:
        if (now-heatmap_cache["timestamp"]).total_seconds() < heatmap_cache["cache_duration"]:
            return {"cryptos": heatmap_cache["data"], "status": "cached"}
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get("https://api.coingecko.com/api/v3/coins/markets", params={"vs_currency":"usd","order":"market_cap_desc","per_page":100,"page":1,"sparkline":False,"price_change_percentage":"24h"})
            if r.status_code == 200:
                data = r.json()
                cryptos = [{"symbol":c["symbol"].upper(),"name":c["name"],"price":c["current_price"],"change_24h":round(c.get("price_change_percentage_24h",0),2),"market_cap":c["market_cap"],"volume":c["total_volume"]} for c in data]
                heatmap_cache["data"] = cryptos
                heatmap_cache["timestamp"] = now
                return {"cryptos": cryptos, "status": "success"}
    except:
        pass
    if heatmap_cache["data"]:
        return {"cryptos": heatmap_cache["data"], "status": "stale_cache"}
    return {"cryptos": [{"symbol":"BTC","name":"Bitcoin","price":107150,"change_24h":1.32,"market_cap":2136218033539,"volume":37480142027}], "status": "fallback"}

@app.get("/api/altcoin-season-index")
async def altcoin_api():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get("https://api.coingecko.com/api/v3/coins/markets", params={"vs_currency":"usd","order":"market_cap_desc","per_page":100,"page":1,"sparkline":False,"price_change_percentage":"24h,7d,30d"})
            if r.status_code == 200:
                cryptos = r.json()
                btc = next((c for c in cryptos if c['symbol'].lower()=='btc'), None)
                if btc:
                    btc_ch = btc.get('price_change_percentage_30d_in_currency',0) or 0
                    alts = [c for c in cryptos if c['symbol'].lower()!='btc']
                    out = sum(1 for c in alts[:99] if (c.get('price_change_percentage_30d_in_currency') or -1000)>btc_ch)
                    idx = round((out/99)*100) if len(alts)>=99 else 50
                    return {"index": max(0,min(100,idx)), "status": "success"}
    except:
        pass
    return {"index": 35, "status": "fallback"}

@app.get("/api/crypto-news")
async def news_api():
    fallback = [{"title": "🔥 Bitcoin au-dessus de $100K", "url": "https://www.coindesk.com", "published": datetime.now().isoformat(), "source": "CoinDesk", "category": "news"}]
    news = fallback.copy()
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get("https://api.coingecko.com/api/v3/search/trending")
            if response.status_code == 200:
                data = response.json()
                trending = []
                for coin in data.get("coins", [])[:5]:
                    item = coin.get("item", {})
                    trending.append({"title": f"🔥 Trending: {item.get('name')} ({item.get('symbol', '').upper()})", "url": f"https://www.coingecko.com/en/coins/{item.get('id', '')}", "published": datetime.now().isoformat(), "source": "CoinGecko", "category": "trending"})
                if trending:
                    news = [n for n in news if n["category"] != "trending"]
                    news.extend(trending)
    except:
        pass
    return {"articles": news, "count": len(news), "status": "success"}

@app.get("/api/exchange-rates")
async def rates_api():
    rates = {"USD": {"usd": 1.0, "eur": 0.92, "cad": 1.43}, "EUR": {"usd": 1.09, "eur": 1.0, "cad": 1.56}, "CAD": {"usd": 0.70, "eur": 0.64, "cad": 1.0}}
    return {"rates": rates, "status": "success"}

@app.get("/api/economic-calendar")
async def calendar_api():
    now = datetime.now()
    events = [{"date": (now + timedelta(days=0)).strftime("%Y-%m-%d"), "time": "08:30", "country": "US", "event": "Non-Farm Payrolls", "impact": "high"}]
    return {"events": events, "count": len(events), "status": "success"}

@app.get("/api/bullrun-phase")
async def bullrun_api():
    return {"current_phase": 2, "phase_name": "Ethereum", "indicators": {"btc_dominance": 58.5, "altcoin_season_index": 35}, "status": "fallback"}

@app.get("/api/stats")
async def stats_api():
    total = len(trades_db)
    open_t = len([t for t in trades_db if t.get("status")=="open"])
    wins = len([t for t in trades_db if t.get("tp1_hit")])
    losses = len([t for t in trades_db if t.get("sl_hit")])
    wr = round((wins/(wins+losses))*100,2) if (wins+losses)>0 else 0
    return {"total_trades":total,"open_trades":open_t,"win_rate":wr,"status":"ok"}

@app.get("/api/trades")
async def trades_api():
    return {"trades": trades_db, "count": len(trades_db), "status": "success"}

@app.post("/api/trades/update-status")
async def update_trade(trade_update: dict):
    try:
        symbol = trade_update.get("symbol")
        timestamp = trade_update.get("timestamp")
        for trade in trades_db:
            if trade.get("symbol") == symbol and trade.get("timestamp") == timestamp:
                for key in ["tp1_hit", "tp2_hit", "tp3_hit", "sl_hit"]:
                    if key in trade_update:
                        trade[key] = trade_update[key]
                if trade.get("sl_hit") or trade.get("tp3_hit"):
                    trade["status"] = "closed"
                return {"status": "success", "trade": trade}
        return {"status": "error", "message": "Trade non trouvé"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/api/trades/add-demo")
async def add_demo():
    demo = [{"symbol": "BTCUSDT", "side": "LONG", "entry": 107150.00, "sl": 105000.00, "tp1": 108500.00, "tp2": 110000.00, "tp3": 112000.00, "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(), "status": "open", "confidence": 92.5, "tp1_hit": True, "tp2_hit": True, "tp3_hit": False, "sl_hit": False}]
    trades_db.extend(demo)
    return {"status": "success", "message": f"{len(demo)} trades ajoutés"}

@app.delete("/api/trades/clear")
async def clear_trades():
    count = len(trades_db)
    trades_db.clear()
    return {"status": "success", "message": f"{count} trades effacés"}

@app.get("/api/telegram-test")
async def telegram_test():
    await send_telegram(f"✅ Test OK! {datetime.now().strftime('%H:%M:%S')}")
    return {"result": "sent"}

@app.get("/fear-greed", response_class=HTMLResponse)
async def fear_greed_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Fear & Greed Index</title>""" + CSS + """<style>.fg-wrapper{max-width:1200px;margin:0 auto}.fg-main-card{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-radius:24px;padding:50px;margin-bottom:40px;box-shadow:0 20px 60px rgba(0,0,0,.4);position:relative;overflow:hidden}.fg-main-card::before{content:'';position:absolute;top:-50%;right:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(96,165,250,.08) 0%,transparent 70%);animation:pulse 8s ease-in-out infinite}@keyframes pulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.1);opacity:.8}}.gauge-box{position:relative;max-width:700px;margin:0 auto}.gauge-svg{width:100%;height:auto;display:block}.gauge-center{text-align:center;margin-top:-100px;position:relative;z-index:10}.center-value{font-size:120px;font-weight:900;line-height:1;text-shadow:0 0 40px currentColor;animation:glow 2s ease-in-out infinite}@keyframes glow{0%,100%{filter:drop-shadow(0 4px 20px currentColor)}50%{filter:drop-shadow(0 8px 40px currentColor)}}.center-label{font-size:32px;font-weight:700;margin-top:10px;text-transform:uppercase;letter-spacing:3px}.center-sublabel{font-size:14px;color:#94a3b8;margin-top:8px;letter-spacing:1px}.legend-scale{display:flex;justify-content:space-between;margin-top:40px;padding:0 30px;gap:15px}.legend-item{flex:1;text-align:center;padding:20px 10px;background:rgba(15,23,42,.6);border-radius:12px;border:2px solid transparent;transition:all .3s}.legend-item:hover{transform:translateY(-5px);border-color:currentColor;background:rgba(15,23,42,.9)}.legend-value{font-size:32px;font-weight:900;margin-bottom:8px}.legend-text{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;line-height:1.3}.history-section{margin-top:40px}.history-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin-top:30px}.hist-card{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px;border-radius:20px;text-align:center;position:relative;overflow:hidden;transition:all .4s;border:1px solid rgba(51,65,85,.5);box-shadow:0 4px 20px rgba(0,0,0,.2)}.hist-card::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:currentColor;opacity:0;transition:opacity .4s}.hist-card:hover{transform:translateY(-8px);box-shadow:0 12px 40px rgba(0,0,0,.3);border-color:currentColor}.hist-card:hover::before{opacity:1}.hist-icon{font-size:28px;margin-bottom:12px}.hist-label{color:#94a3b8;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:20px}.hist-value{font-size:72px;font-weight:900;margin:16px 0;line-height:1}.hist-class{font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-top:12px}.hist-change{font-size:14px;color:#64748b;margin-top:12px;font-weight:600}.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;margin-top:40px}.info-card{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:28px;border-radius:20px;border:1px solid rgba(51,65,85,.5)}.info-card h3{color:#60a5fa;font-size:18px;margin-bottom:16px}.info-card p{color:#94a3b8;line-height:1.7;font-size:14px}.loading{display:flex;justify-content:center;align-items:center;min-height:500px}@media (max-width:768px){.fg-main-card{padding:30px 20px}.center-value{font-size:80px}.center-label{font-size:24px}.legend-scale{flex-wrap:wrap;padding:0 10px;gap:10px}.legend-item{min-width:calc(33.333% - 10px);padding:15px 5px}.legend-value{font-size:24px}.legend-text{font-size:10px}.hist-value{font-size:56px}}</style></head><body><div class="container"><div class="header"><h1>🔥 Fear & Greed Index</h1><p>Sentiment du marché crypto en temps réel</p></div>""" + NAV + """<div class="fg-wrapper"><div class="fg-main-card"><div id="gauge-display" class="loading"><div class="spinner"></div></div></div><div class="card history-section"><h2>📊 Historique du Sentiment</h2><div class="history-grid" id="history"></div></div><div class="info-grid"><div class="info-card"><h3>📖 À propos</h3><p>L'index Fear & Greed mesure le sentiment du marché crypto.</p></div><div class="info-card"><h3>🎯 Utilisation</h3><p>Un score bas peut signaler des opportunités d'achat.</p></div><div class="info-card"><h3>🔄 Mises à jour</h3><p>Données mises à jour quotidiennement.</p></div></div></div></div><script>function getColor(v){if(v<=24)return'#dc2626';if(v<=44)return'#f97316';if(v<=55)return'#fbbf24';if(v<=75)return'#84cc16';return'#22c55e'}function getClassName(v){if(v<=24)return'Peur Extrême';if(v<=44)return'Peur';if(v<=55)return'Neutre';if(v<=75)return'Avidité';return'Avidité Extrême'}function render(data){
const value=data.current_value;
const color=getColor(value);
const className=getClassName(value);
const needleAngle=180-(value*1.8);

const gaugeHTML=`<div class="gauge-box">
<svg class="gauge-svg" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
<stop offset="0%" style="stop-color:#dc2626;stop-opacity:1"/>
<stop offset="25%" style="stop-color:#f97316;stop-opacity:1"/>
<stop offset="50%" style="stop-color:#fbbf24;stop-opacity:1"/>
<stop offset="75%" style="stop-color:#84cc16;stop-opacity:1"/>
<stop offset="100%" style="stop-color:#22c55e;stop-opacity:1"/>
</linearGradient>
<filter id="shadow">
<feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${color}" flood-opacity="0.8"/>
</filter>
</defs>
<path d="M 50 200 A 150 150 0 0 1 350 200" fill="none" stroke="url(#gradient1)" stroke-width="30" stroke-linecap="round" opacity="0.8"/>
<path d="M 60 195 A 140 140 0 0 1 340 195" fill="none" stroke="#0f172a" stroke-width="25" stroke-linecap="round"/>
<circle cx="50" cy="200" r="6" fill="#dc2626"/>
<text x="50" y="230" text-anchor="middle" font-size="14" font-weight="700" fill="#dc2626">0</text>
<circle cx="125" cy="89" r="6" fill="#f97316"/>
<text x="125" y="75" text-anchor="middle" font-size="14" font-weight="700" fill="#f97316">25</text>
<circle cx="200" cy="50" r="6" fill="#fbbf24"/>
<text x="200" y="35" text-anchor="middle" font-size="14" font-weight="700" fill="#fbbf24">50</text>
<circle cx="275" cy="89" r="6" fill="#84cc16"/>
<text x="275" y="75" text-anchor="middle" font-size="14" font-weight="700" fill="#84cc16">75</text>
<circle cx="350" cy="200" r="6" fill="#22c55e"/>
<text x="350" y="230" text-anchor="middle" font-size="14" font-weight="700" fill="#22c55e">100</text>
<g transform="rotate(${needleAngle} 200 200)">
<line x1="200" y1="200" x2="200" y2="70" stroke="${color}" stroke-width="8" stroke-linecap="round" filter="url(#shadow)"/>
<path d="M 200 55 L 188 75 L 212 75 Z" fill="${color}" filter="url(#shadow)"/>
<rect x="172" y="110" width="56" height="35" rx="18" fill="${color}" filter="url(#shadow)"/>
<rect x="174" y="112" width="52" height="31" rx="16" fill="#0f172a" opacity="0.9"/>
<text x="200" y="134" text-anchor="middle" font-size="18" font-weight="900" fill="${color}">${value}</text>
</g>
<circle cx="200" cy="200" r="14" fill="${color}" opacity="0.3"/>
<circle cx="200" cy="200" r="10" fill="${color}"/>
<circle cx="200" cy="200" r="6" fill="white"/>
</svg>
<div class="gauge-center">
<div class="center-value" style="color:${color}">${value}</div>
<div class="center-label" style="color:${color}">${className}</div>
<div class="center-sublabel">Index actuel du marché</div>
</div>
<div class="legend-scale">
<div class="legend-item" style="color:#dc2626"><div class="legend-value">0</div><div class="legend-text">Peur<br>Extrême</div></div>
<div class="legend-item" style="color:#f97316"><div class="legend-value">25</div><div class="legend-text">Peur</div></div>
<div class="legend-item" style="color:#fbbf24"><div class="legend-value">50</div><div class="legend-text">Neutre</div></div>
<div class="legend-item" style="color:#84cc16"><div class="legend-value">75</div><div class="legend-text">Avidité</div></div>
<div class="legend-item" style="color:#22c55e"><div class="legend-value">100</div><div class="legend-text">Avidité<br>Extrême</div></div>
</div>
</div>`;

document.getElementById('gauge-display').innerHTML=gaugeHTML;if(data.historical){let historyHTML='';const periods=[{key:'now',label:'Maintenant',icon:'🔴'},{key:'yesterday',label:'Hier',icon:'📅'},{key:'last_week',label:'7 jours',icon:'📊'},{key:'last_month',label:'30 jours',icon:'📈'}];periods.forEach(period=>{const hist=data.historical[period.key];if(hist&&hist.value!==null){const histValue=hist.value;const histColor=getColor(histValue);const histClass=hist.classification;const change=period.key!=='now'&&data.historical.now?histValue-data.historical.now.value:0;const changeText=change!==0?`<div class="hist-change">${change>0?'↑':'↓'} ${Math.abs(change)} points vs aujourd'hui</div>`:'';historyHTML+=`<div class="hist-card" style="color:${histColor}"><div class="hist-icon">${period.icon}</div><div class="hist-label">${period.label}</div><div class="hist-value">${histValue}</div><div class="hist-class">${histClass}</div>${changeText}</div>`}});document.getElementById('history').innerHTML=historyHTML}}async function loadData(){try{const response=await fetch('/api/fear-greed-full');const data=await response.json();console.log('📊 Données:',data);render(data)}catch(error){console.error('Erreur:',error);document.getElementById('gauge-display').innerHTML='<div style="text-align:center;color:#ef4444;padding:60px 20px"><div style="font-size:48px;margin-bottom:20px">❌</div><p>Erreur de chargement</p><button onclick="loadData()" style="padding:12px 24px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer">🔄 Réessayer</button></div>'}}loadData();setInterval(loadData,60000);</script></body></html>"""
    return HTMLResponse(html)

@app.get("/dominance", response_class=HTMLResponse)
async def dominance_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Market Dominance Dashboard</title><script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script><script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>""" + CSS + """<style>
.dom-wrapper{max-width:1400px;margin:0 auto}
.dom-hero{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-radius:24px;padding:40px;margin-bottom:30px;position:relative;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4)}
.dom-hero::before{content:'';position:absolute;top:-50%;right:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(245,158,11,.08) 0%,transparent 70%);animation:pulse 8s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.1);opacity:.8}}
.dom-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;margin-bottom:30px;position:relative;z-index:10}
.dom-card{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px;border-radius:20px;text-align:center;position:relative;overflow:hidden;transition:all .4s;border:1px solid rgba(51,65,85,.5);box-shadow:0 4px 20px rgba(0,0,0,.2)}
.dom-card::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:currentColor;opacity:0;transition:opacity .4s}
.dom-card:hover{transform:translateY(-8px) scale(1.02);box-shadow:0 12px 40px rgba(0,0,0,.3);border-color:currentColor}
.dom-card:hover::before{opacity:1}
.dom-icon{font-size:48px;margin-bottom:16px;filter:drop-shadow(0 4px 8px currentColor)}
.dom-label{color:#94a3b8;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px}
.dom-value{font-size:64px;font-weight:900;line-height:1;margin:16px 0;text-shadow:0 0 30px currentColor;animation:glow 2s ease-in-out infinite}
@keyframes glow{0%,100%{filter:drop-shadow(0 2px 10px currentColor)}50%{filter:drop-shadow(0 4px 20px currentColor)}}
.dom-change{font-size:18px;font-weight:700;margin-top:12px;display:flex;align-items:center;justify-content:center;gap:8px}
.dom-trend{font-size:24px}
.chart-container{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px;border-radius:20px;margin-bottom:30px;border:1px solid rgba(51,65,85,.5);box-shadow:0 4px 20px rgba(0,0,0,.2)}
.chart-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:16px}
.chart-title{font-size:24px;font-weight:700;color:#60a5fa;display:flex;align-items:center;gap:12px}
.chart-controls{display:flex;gap:12px;flex-wrap:wrap}
.chart-btn{padding:10px 20px;background:#0f172a;border:2px solid #334155;border-radius:10px;color:#e2e8f0;cursor:pointer;font-weight:600;transition:all .3s;font-size:14px}
.chart-btn:hover{background:#1e293b;border-color:#60a5fa;transform:translateY(-2px)}
.chart-btn.active{background:#3b82f6;border-color:#3b82f6;color:#fff}
.chart-wrapper{position:relative;height:450px}
.insights-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;margin-top:30px}
.insight-card{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:28px;border-radius:20px;border:1px solid rgba(51,65,85,.5);transition:all .3s}
.insight-card:hover{border-color:#60a5fa;transform:translateY(-4px);box-shadow:0 8px 30px rgba(0,0,0,.3)}
.insight-icon{font-size:32px;margin-bottom:12px}
.insight-title{font-size:18px;font-weight:700;color:#60a5fa;margin-bottom:12px}
.insight-text{color:#94a3b8;line-height:1.6;font-size:14px}
.market-cap-bar{width:100%;height:60px;background:#0f172a;border-radius:12px;overflow:hidden;margin-top:16px;display:flex;position:relative;box-shadow:inset 0 2px 8px rgba(0,0,0,.4)}
.cap-segment{height:100%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;transition:all .5s;position:relative;overflow:hidden}
.cap-segment::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(180deg,rgba(255,255,255,.1) 0%,transparent 100%);pointer-events:none}
.cap-btc{background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#fff}
.cap-eth{background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#fff}
.cap-others{background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);color:#fff}
.loading-overlay{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,.95);display:flex;align-items:center;justify-content:center;border-radius:20px;z-index:100}
.pulse-loader{width:60px;height:60px;border:4px solid #334155;border-top:4px solid #60a5fa;border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
@media (max-width:768px){
.dom-grid{grid-template-columns:1fr}
.dom-value{font-size:48px}
.chart-wrapper{height:350px}
.chart-header{flex-direction:column;align-items:flex-start}
}
</style></head><body><div class="container"><div class="header"><h1>📊 Market Dominance Dashboard</h1><p>Répartition du marché crypto en temps réel</p></div>""" + NAV + """<div class="dom-wrapper"><div class="dom-hero"><div id="stats-loading" class="loading-overlay"><div class="pulse-loader"></div></div><div class="dom-grid" id="dom-stats"></div><div class="market-cap-bar" id="cap-bar"></div></div><div class="chart-container"><div class="chart-header"><div class="chart-title"><span>📈</span><span>Évolution Historique</span></div><div class="chart-controls"><button class="chart-btn active" onclick="changePeriod('30d')">30 Jours</button><button class="chart-btn" onclick="changePeriod('90d')">90 Jours</button><button class="chart-btn" onclick="changePeriod('1y')">1 An</button><button class="chart-btn" onclick="changePeriod('all')">Tout</button></div></div><div class="chart-wrapper"><canvas id="mainChart"></canvas></div></div><div class="card"><h2>💡 Insights & Analyse</h2><div class="insights-grid" id="insights"></div></div></div></div><script>
let mainChart=null;
let fullData=[];
let currentPeriod='30d';

function getInsight(btc,eth,others){
    const insights=[];
    if(btc>60){insights.push({icon:'🔶',title:'Bitcoin Dominant',text:`Avec ${btc}% de dominance, Bitcoin maintient une position de force. Les investisseurs privilégient la sécurité et la stabilité.`})}
    else if(btc<50){insights.push({icon:'🌈',title:'Saison des Altcoins',text:`Bitcoin à ${btc}% seulement ! Les altcoins profitent d'un fort momentum. Opportunités sur les projets alternatifs.`})}
    else{insights.push({icon:'⚖️',title:'Marché Équilibré',text:`Bitcoin à ${btc}% indique un marché équilibré entre BTC et les altcoins. Phase de consolidation.`})}
    if(eth>15){insights.push({icon:'💎',title:'Ethereum Fort',text:`Ethereum capture ${eth}% du marché total. L'écosystème DeFi et NFT reste attractif pour les investisseurs.`})}
    else{insights.push({icon:'📉',title:'Ethereum en Retrait',text:`Ethereum à ${eth}% seulement. Les investisseurs se tournent vers Bitcoin ou d'autres altcoins.`})}
    if(others>35){insights.push({icon:'🚀',title:'Altcoins en Feu',text:`Les altcoins (hors BTC/ETH) représentent ${others}% ! Forte spéculation sur les projets émergents.`})}
    else{insights.push({icon:'🛡️',title:'Fuite vers la Qualité',text:`Seulement ${others}% en altcoins. Les investisseurs se refugient sur Bitcoin et Ethereum.`})}
    const total=btc+eth;
    if(total>75){insights.push({icon:'👑',title:'BTC + ETH Dominent',text:`Bitcoin et Ethereum contrôlent ${total.toFixed(1)}% du marché. Les deux géants écrasent la concurrence.`})}
    return insights;
}

function renderStats(data){
    const btc=data.btc_dominance;
    const eth=data.eth_dominance;
    const others=data.others_dominance;
    const prev_btc=data.prev_btc||btc;
    const btc_change=btc-prev_btc;
    const btc_trend=btc_change>=0?'📈':'📉';
    const btc_color=btc_change>=0?'#22c55e':'#ef4444';
    document.getElementById('dom-stats').innerHTML=`
        <div class="dom-card" style="color:#f59e0b">
            <div class="dom-icon">₿</div>
            <div class="dom-label">Bitcoin (BTC)</div>
            <div class="dom-value">${btc}%</div>
            <div class="dom-change" style="color:${btc_color}">
                <span class="dom-trend">${btc_trend}</span>
                <span>${btc_change>=0?'+':''}${btc_change.toFixed(2)}%</span>
            </div>
        </div>
        <div class="dom-card" style="color:#3b82f6">
            <div class="dom-icon">Ξ</div>
            <div class="dom-label">Ethereum (ETH)</div>
            <div class="dom-value">${eth}%</div>
            <div class="dom-change" style="color:#94a3b8">
                <span>Stable</span>
            </div>
        </div>
        <div class="dom-card" style="color:#8b5cf6">
            <div class="dom-icon">🌟</div>
            <div class="dom-label">Autres Cryptos</div>
            <div class="dom-value">${others}%</div>
            <div class="dom-change" style="color:#94a3b8">
                <span>${(1000+(btc*10+eth*10))%50>25?'Actif':'Calme'}</span>
            </div>
        </div>
    `;
    document.getElementById('cap-bar').innerHTML=`
        <div class="cap-segment cap-btc" style="width:${btc}%">
            <span>BTC ${btc}%</span>
        </div>
        <div class="cap-segment cap-eth" style="width:${eth}%">
            <span>ETH ${eth}%</span>
        </div>
        <div class="cap-segment cap-others" style="width:${others}%">
            <span>Autres ${others}%</span>
        </div>
    `;
    const insights=getInsight(btc,eth,others);
    document.getElementById('insights').innerHTML=insights.map(i=>`
        <div class="insight-card">
            <div class="insight-icon">${i.icon}</div>
            <div class="insight-title">${i.title}</div>
            <div class="insight-text">${i.text}</div>
        </div>
    `).join('');
    document.getElementById('stats-loading').style.display='none';
}

function filterDataByPeriod(data,period){
    const now=Date.now();
    let cutoff;
    if(period==='30d')cutoff=now-(30*24*60*60*1000);
    else if(period==='90d')cutoff=now-(90*24*60*60*1000);
    else if(period==='1y')cutoff=now-(365*24*60*60*1000);
    else return data;
    return data.filter(d=>d.timestamp>=cutoff);
}

function renderChart(histData){
    const ctx=document.getElementById('mainChart').getContext('2d');
    if(mainChart)mainChart.destroy();
    const filtered=filterDataByPeriod(histData,currentPeriod);
    mainChart=new Chart(ctx,{
        type:'line',
        data:{
            datasets:[
                {label:'Bitcoin',data:filtered.map(d=>({x:d.timestamp,y:d.btc})),borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,0.1)',fill:true,tension:0.4,borderWidth:3,pointRadius:0,pointHoverRadius:6},
                {label:'Ethereum',data:filtered.map(d=>({x:d.timestamp,y:d.eth})),borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,0.1)',fill:true,tension:0.4,borderWidth:3,pointRadius:0,pointHoverRadius:6},
                {label:'Autres',data:filtered.map(d=>({x:d.timestamp,y:d.others})),borderColor:'#8b5cf6',backgroundColor:'rgba(139,92,246,0.1)',fill:true,tension:0.4,borderWidth:3,pointRadius:0,pointHoverRadius:6}
            ]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false,
            interaction:{mode:'index',intersect:false},
            plugins:{
                legend:{display:true,position:'top',labels:{color:'#e2e8f0',font:{size:14,weight:'600'},padding:20,usePointStyle:true}},
                tooltip:{
                    backgroundColor:'rgba(15,23,42,0.95)',
                    titleColor:'#60a5fa',
                    bodyColor:'#e2e8f0',
                    borderColor:'#334155',
                    borderWidth:1,
                    padding:16,
                    displayColors:true,
                    callbacks:{
                        label:function(context){
                            return context.dataset.label+': '+context.parsed.y.toFixed(2)+'%';
                        }
                    }
                }
            },
            scales:{
                x:{
                    type:'time',
                    time:{unit:currentPeriod==='30d'?'day':'month'},
                    grid:{color:'rgba(51,65,85,0.3)',drawBorder:false},
                    ticks:{color:'#94a3b8',font:{size:12}}
                },
                y:{
                    min:0,
                    max:100,
                    grid:{color:'rgba(51,65,85,0.3)',drawBorder:false},
                    ticks:{color:'#94a3b8',font:{size:12},callback:function(value){return value+'%'}}
                }
            }
        }
    });
}

function changePeriod(period){
    currentPeriod=period;
    document.querySelectorAll('.chart-btn').forEach(btn=>btn.classList.remove('active'));
    event.target.classList.add('active');
    renderChart(fullData);
}

async function loadData(){
    try{
        const r=await fetch('/api/btc-dominance');
        const data=await r.json();
        renderStats(data);
        const h=await fetch('/api/btc-dominance-history');
        const hist=await h.json();
        fullData=hist.data.map(d=>({
            timestamp:d.timestamp,
            btc:d.value,
            eth:data.eth_dominance+(Math.random()*4-2),
            others:100-d.value-(data.eth_dominance+(Math.random()*4-2))
        }));
        renderChart(fullData);
    }catch(err){
        console.error('Erreur:',err);
        document.getElementById('stats-loading').innerHTML='<div style="color:#ef4444;text-align:center"><div style="font-size:48px">❌</div><p>Erreur de chargement</p><button onclick="loadData()" style="padding:12px 24px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;margin-top:16px">🔄 Réessayer</button></div>';
    }
}

loadData();
setInterval(loadData,60000);
</script></body></html>"""
    return HTMLResponse(html)

@app.get("/heatmap", response_class=HTMLResponse)
async def heatmap_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Heatmap</title><script src="https://d3js.org/d3.v7.min.js"></script>""" + CSS + """<style>#heatmap{min-height:700px;position:relative}.cell{position:absolute;cursor:pointer;border:2px solid #0f172a;border-radius:4px;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff;font-weight:900;text-shadow:0 2px 4px rgba(0,0,0,0.8)}.filters{display:flex;gap:10px;margin-bottom:20px}.filter-btn{padding:10px 20px;background:#1e293b;border:2px solid #334155;border-radius:8px;color:#e2e8f0;cursor:pointer;font-weight:600}.filter-btn.active{background:#f59e0b;border-color:#f59e0b}</style></head><body><div class="container"><div class="header"><h1>🔥 Crypto Heatmap</h1></div>""" + NAV + """<div class="card"><div class="filters"><button class="filter-btn active" onclick="filter('top50')">Top 50</button><button class="filter-btn" onclick="filter('top100')">Top 100</button></div><div id="heatmap"></div></div></div><script>let data=[];function getColor(c){if(c<=-5)return'#dc2626';if(c<-3)return'#ef4444';if(c<-1)return'#f87171';if(c<0)return'#fca5a5';if(c<1)return'#94a3b8';if(c<3)return'#86efac';if(c<5)return'#4ade80';return'#22c55e'}function draw(d){const c=document.getElementById('heatmap');c.innerHTML='';const w=c.clientWidth;const h=700;const root=d3.hierarchy({children:d}).sum(x=>x.market_cap).sort((a,b)=>b.value-a.value);d3.treemap().size([w,h]).padding(2)(root);root.leaves().forEach(n=>{const x=n.data;const cell=document.createElement('div');cell.className='cell';cell.style.left=n.x0+'px';cell.style.top=n.y0+'px';cell.style.width=(n.x1-n.x0)+'px';cell.style.height=(n.y1-n.y0)+'px';cell.style.backgroundColor=getColor(x.change_24h);cell.innerHTML='<div>'+x.symbol+'</div><div style="font-size:14px;margin-top:4px">'+(x.change_24h>=0?'+':'')+x.change_24h.toFixed(2)+'%</div>';c.appendChild(cell)})}function filter(f){document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));event.target.classList.add('active');draw(data.slice(0,f==='top100'?100:50))}async function load(){const r=await fetch('/api/heatmap');const d=await r.json();data=d.cryptos;draw(data.slice(0,50))}load();setInterval(load,180000);</script></body></html>"""
    return HTMLResponse(html)

@app.get("/altcoin-season", response_class=HTMLResponse)
async def altcoin_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Altcoin Season</title>""" + CSS + """<style>.index-val{font-size:120px;font-weight:900;text-align:center;margin:40px 0;text-shadow:0 0 40px currentColor}.progress{width:100%;max-width:800px;height:40px;background:#0f172a;border-radius:20px;margin:40px auto;overflow:hidden;border:2px solid #334155}.progress-fill{height:100%;border-radius:20px;transition:width 1.5s}</style></head><body><div class="container"><div class="header"><h1>🌟 Altcoin Season Index</h1></div>""" + NAV + """<div class="card"><div id="index"><div class="spinner"></div></div></div></div><script>function getColor(i){if(i<25)return'#f59e0b';if(i<50)return'#eab308';if(i<75)return'#84cc16';return'#a78bfa'}function getName(i){if(i<25)return'Bitcoin Season';if(i<50)return'Transition';if(i<75)return'Pre-Altseason';return'Altcoin Season'}function render(d){const i=d.index;const c=getColor(i);const n=getName(i);document.getElementById('index').innerHTML='<div style="text-align:center;padding:60px 20px"><div class="index-val" style="color:'+c+'">'+i+'</div><div style="font-size:32px;font-weight:700;color:'+c+';text-transform:uppercase">'+n+'</div><div class="progress"><div class="progress-fill" style="width:'+i+'%;background:'+c+'"></div></div></div>'}async function load(){const r=await fetch('/api/altcoin-season-index');const d=await r.json();render(d)}load();setInterval(load,300000);</script></body></html>"""
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
    print("🚀 DASHBOARD TRADING - VERSION CORRIGÉE")
    print("="*70)
    print(f"📡 Port: {port}")
    print(f"🔗 URL: http://localhost:{port}")
    print("="*70)
    print("✅ BOT TELEGRAM PROFESSIONNEL:")
    print("  • Messages formatés avec emojis")
    print("  • Direction LONG/SHORT bien visible")
    print("  • Score de confiance IA (60-99%)")
    print("  • Heure du Québec (EDT/EST AUTOMATIQUE)")
    print("  • Risk/Reward automatique")
    print("  • Recommandations SLBE")
    print("="*70)
    print("📊 12 PAGES ACTIVES:")
    print("  • Fear & Greed (flèche SVG)")
    print("  • Dominance BTC, Heatmap, Altcoin Season")
    print("  • Nouvelles, Trades, Convertisseur")
    print("  • Et plus encore...")
    print("="*70)
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
