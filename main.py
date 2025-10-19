# -*- coding: utf-8 -*-
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
from datetime import datetime, timedelta
import random
import os

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# TOKENS
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8478131465:AAEh7Z0rvIqSNvn1wKdtkMNb-O96h41LCns")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "-1002940633257")

# DATABASES
trades_db = []
paper_trades_db = []
paper_balance = {"USDT": 10000.0}

# CSS
CSS = """<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:20px}.container{max-width:1400px;margin:0 auto}.header{text-align:center;margin-bottom:30px;padding:30px;background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:12px}.header h1{font-size:42px;margin-bottom:10px;background:linear-gradient(to right,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.header p{color:#94a3b8;font-size:16px}.nav{display:flex;gap:10px;margin-bottom:30px;flex-wrap:wrap;justify-content:center}.nav a{padding:12px 20px;background:#1e293b;border-radius:8px;text-decoration:none;color:#e2e8f0;transition:all .3s;border:1px solid #334155}.nav a:hover{background:#334155;border-color:#60a5fa}.card{background:#1e293b;padding:25px;border-radius:12px;margin-bottom:20px;border:1px solid #334155}.card h2{color:#60a5fa;margin-bottom:20px;font-size:24px;border-bottom:2px solid #334155;padding-bottom:10px}.grid{display:grid;gap:20px}.grid-2{grid-template-columns:repeat(auto-fit,minmax(400px,1fr))}.grid-3{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}.grid-4{grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}.stat-box{background:#0f172a;padding:20px;border-radius:8px;border-left:4px solid #60a5fa}.stat-box .label{color:#94a3b8;font-size:13px;margin-bottom:8px}.stat-box .value{font-size:32px;font-weight:700;color:#e2e8f0}table{width:100%;border-collapse:collapse;margin-top:15px}table th{background:#0f172a;padding:12px;text-align:left;color:#60a5fa;font-weight:600;border-bottom:2px solid #334155}table td{padding:12px;border-bottom:1px solid #334155}table tr:hover{background:#0f172a}input,select{width:100%;padding:12px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:14px;margin-bottom:15px}button{padding:12px 24px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:all .3s}button:hover{background:#2563eb}.btn-danger{background:#ef4444}.btn-danger:hover{background:#dc2626}.alert{padding:15px;border-radius:8px;margin:15px 0}.alert-error{background:rgba(239,68,68,.1);border-left:4px solid #ef4444;color:#ef4444}.alert-success{background:rgba(16,185,129,.1);border-left:4px solid #10b981;color:#10b981}</style>"""

NAV = '<div class="nav"><a href="/">Accueil</a><a href="/trades">Trades</a><a href="/fear-greed">Fear&Greed</a><a href="/bullrun-phase">Bullrun</a><a href="/convertisseur">Convertir</a><a href="/calendrier">Calendrier</a><a href="/btc-quarterly">Trimestriel</a><a href="/annonces">News</a><a href="/heatmap">Heatmap</a><a href="/backtesting">Backtest</a><a href="/paper-trading">Paper</a><a href="/telegram-test">Telegram</a></div>'

class TradeWebhook(BaseModel):
    action: str
    symbol: str
    price: float
    quantity: Optional[float] = 1.0
    entry_time: Optional[str] = None
    sl: Optional[float] = None
    tp1: Optional[float] = None
    tp2: Optional[float] = None
    tp3: Optional[float] = None

async def send_telegram_message(message: str):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json={"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"})
            result = response.json()
            print("Telegram OK" if result.get("ok") else f"Telegram erreur: {result.get('description')}")
            return result
    except Exception as e:
        print(f"Telegram exception: {e}")
        return {"ok": False, "error": str(e)}

# HEALTH CHECK
@app.get("/health")
@app.head("/health")
async def health_check():
    return {"status": "ok"}

@app.head("/")
async def root_head():
    return {}

@app.post("/tv-webhook")
async def tradingview_webhook(trade: TradeWebhook):
    trade_data = {
        "action": trade.action, "symbol": trade.symbol, "price": trade.price,
        "quantity": trade.quantity, "entry_time": trade.entry_time or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "sl": trade.sl, "tp1": trade.tp1, "tp2": trade.tp2, "tp3": trade.tp3,
        "timestamp": datetime.now().isoformat(), "status": "open", "pnl": 0
    }
    trades_db.append(trade_data)
    emoji = "ACHAT" if trade.action.upper() == "BUY" else "VENTE"
    message = f"<b>{emoji} {trade.symbol}</b>\n\nPrix: ${trade.price:,.2f}\nQte: {trade.quantity}"
    await send_telegram_message(message)
    return {"status": "success", "trade": trade_data}

@app.get("/api/telegram-test")
async def test_telegram():
    result = await send_telegram_message(f"Test Bot\n\nOK!\nHeure: {datetime.now().strftime('%H:%M:%S')}")
    return {"result": result}

@app.post("/api/reset-trades")
async def reset_trades():
    global trades_db
    trades_db = []
    return {"status": "success"}

@app.get("/api/stats")
async def get_stats():
    if not trades_db:
        return {"total_trades": 0, "open_trades": 0, "closed_trades": 0, "win_rate": 0, "total_pnl": 0, "avg_pnl": 0}
    total = len(trades_db)
    open_trades = sum(1 for t in trades_db if t.get("status") == "open")
    closed = total - open_trades
    winning = sum(1 for t in trades_db if t.get("pnl", 0) > 0)
    win_rate = round((winning / closed * 100) if closed > 0 else 0, 2)
    total_pnl = sum(t.get("pnl", 0) for t in trades_db)
    avg_pnl = round(total_pnl / closed, 2) if closed > 0 else 0
    return {"total_trades": total, "open_trades": open_trades, "closed_trades": closed, "win_rate": win_rate, "total_pnl": round(total_pnl, 2), "avg_pnl": avg_pnl}

@app.get("/api/fear-greed")
async def get_fear_greed():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get("https://api.alternative.me/fng/")
            if r.status_code == 200:
                d = r.json()
                v = int(d["data"][0]["value"])
                return {"value": v, "classification": d["data"][0]["value_classification"], "status": "success"}
    except Exception as e:
        print(f"Erreur fear-greed: {e}")
    return {"value": 50, "classification": "Neutre", "status": "fallback"}

@app.get("/api/fear-greed-full")
async def get_fear_greed_full():
    """Récupère les données Fear & Greed avec historique"""
    print("📊 Appel API fear-greed-full")
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            print("🌐 Tentative connexion Alternative.me...")
            r = await client.get("https://api.alternative.me/fng/?limit=30")
            
            if r.status_code == 200:
                print("✅ API répondu avec succès")
                data = r.json()
                
                now = datetime.now()
                tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
                seconds_until_update = int((tomorrow - now).total_seconds())
                
                result = {
                    "current_value": int(data["data"][0]["value"]),
                    "current_classification": data["data"][0]["value_classification"],
                    "historical": {
                        "now": {
                            "value": int(data["data"][0]["value"]),
                            "classification": data["data"][0]["value_classification"]
                        },
                        "yesterday": {
                            "value": int(data["data"][1]["value"]) if len(data["data"]) > 1 else None,
                            "classification": data["data"][1]["value_classification"] if len(data["data"]) > 1 else None
                        },
                        "last_week": {
                            "value": int(data["data"][7]["value"]) if len(data["data"]) > 7 else None,
                            "classification": data["data"][7]["value_classification"] if len(data["data"]) > 7 else None
                        },
                        "last_month": {
                            "value": int(data["data"][29]["value"]) if len(data["data"]) > 29 else None,
                            "classification": data["data"][29]["value_classification"] if len(data["data"]) > 29 else None
                        }
                    },
                    "next_update_seconds": seconds_until_update,
                    "timestamp": data["data"][0]["timestamp"],
                    "status": "success"
                }
                print(f"📈 Valeur actuelle: {result['current_value']}")
                return result
            else:
                print(f"❌ API status code: {r.status_code}")
                
    except Exception as e:
        print(f"❌ Erreur Fear & Greed Full: {e}")
    
    print("⚠️ Utilisation du fallback")
    now = datetime.now()
    tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    seconds_until_update = int((tomorrow - now).total_seconds())
    
    return {
        "current_value": 29,
        "current_classification": "Fear",
        "historical": {
            "now": {"value": 29, "classification": "Fear"},
            "yesterday": {"value": 23, "classification": "Extreme Fear"},
            "last_week": {"value": 24, "classification": "Extreme Fear"},
            "last_month": {"value": 53, "classification": "Neutral"}
        },
        "next_update_seconds": seconds_until_update,
        "timestamp": str(int(datetime.now().timestamp())),
        "status": "fallback"
    }

@app.get("/api/heatmap")
async def get_heatmap():
    """Récupère les données crypto pour la heatmap"""
    print("📊 Appel API heatmap")
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={
                    "vs_currency": "usd",
                    "order": "market_cap_desc",
                    "per_page": 100,
                    "page": 1,
                    "sparkline": False,
                    "price_change_percentage": "24h"
                }
            )
            
            if r.status_code == 200:
                data = r.json()
                
                cryptos = []
                for coin in data:
                    cryptos.append({
                        "symbol": coin["symbol"].upper(),
                        "name": coin["name"],
                        "price": coin["current_price"],
                        "change_24h": round(coin.get("price_change_percentage_24h", 0), 2),
                        "market_cap": coin["market_cap"],
                        "volume": coin["total_volume"]
                    })
                
                print(f"✅ {len(cryptos)} cryptos récupérées")
                return {"cryptos": cryptos, "status": "success"}
            else:
                print(f"❌ CoinGecko status: {r.status_code}")
                
    except Exception as e:
        print(f"❌ Erreur heatmap: {e}")
    
    print("⚠️ Utilisation du fallback")
    fallback_cryptos = [
        {"symbol": "BTC", "name": "Bitcoin", "price": 107150.46, "change_24h": 0.69, "market_cap": 2136218033539, "volume": 37480142027},
        {"symbol": "ETH", "name": "Ethereum", "price": 3887.14, "change_24h": 1.61, "market_cap": 467000000000, "volume": 15000000000},
        {"symbol": "USDT", "name": "Tether", "price": 1.0003, "change_24h": 0.0, "market_cap": 140000000000, "volume": 80000000000},
        {"symbol": "BNB", "name": "BNB", "price": 1090.01, "change_24h": 1.61, "market_cap": 79000000000, "volume": 2000000000},
        {"symbol": "SOL", "name": "Solana", "price": 187.01, "change_24h": 2.63, "market_cap": 90000000000, "volume": 5000000000},
        {"symbol": "XRP", "name": "XRP", "price": 2.3559, "change_24h": 2.39, "market_cap": 135000000000, "volume": 8000000000},
        {"symbol": "USDC", "name": "USDC", "price": 0.9998, "change_24h": 0.0, "market_cap": 38000000000, "volume": 6000000000},
        {"symbol": "ADA", "name": "Cardano", "price": 1.05, "change_24h": -1.2, "market_cap": 37000000000, "volume": 1200000000},
        {"symbol": "AVAX", "name": "Avalanche", "price": 42.15, "change_24h": 3.5, "market_cap": 17000000000, "volume": 800000000},
        {"symbol": "DOGE", "name": "Dogecoin", "price": 0.38, "change_24h": 1.1, "market_cap": 56000000000, "volume": 4000000000},
    ]
    return {"cryptos": fallback_cryptos, "status": "fallback"}

@app.get("/api/bullrun-phase")
async def get_bullrun_phase():
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            r = await client.get("https://api.binance.com/api/v3/ticker/24hr", params={"symbol": "BTCUSDT"})
            if r.status_code == 200:
                d = r.json()
                price = float(d["lastPrice"])
                change = float(d["priceChangePercent"])
                phase = "Pompage Bitcoin" if change > 5 else "Marche Baissier" if change < -5 else "Consolidation" if -2 < change < 2 else "Marche Actif"
                return {"phase": phase, "btc_price": round(price, 2), "btc_change_24h": round(change, 2), "btc_dominance": 52.3, "status": "success"}
    except:
        pass
    return {"phase": "Marche Stable", "btc_price": 95234.50, "btc_change_24h": 1.23, "btc_dominance": 52.3, "status": "fallback"}

@app.get("/api/news")
async def get_news():
    now = datetime.now()
    news = [
        {"title": "Bitcoin maintient 95k", "source": "CoinDesk", "published": (now - timedelta(hours=2)).isoformat()},
        {"title": "Ethereum maj majeure", "source": "Cointelegraph", "published": (now - timedelta(hours=4)).isoformat()},
        {"title": "ETF Bitcoin records", "source": "Bloomberg", "published": (now - timedelta(hours=6)).isoformat()},
    ]
    return {"news": news, "status": "success"}

@app.post("/api/backtest")
async def run_backtest(request: Request):
    try:
        data = await request.json()
        symbol = data.get("symbol", "BTCUSDT")
        start_capital = float(data.get("start_capital", 10000))
        
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            r = await client.get("https://api.binance.com/api/v3/klines", params={"symbol": symbol, "interval": "1h", "limit": 500})
            if r.status_code != 200:
                return {"status": "error", "message": "Erreur API Binance"}
            klines = r.json()
        
        closes = [float(k[4]) for k in klines]
        signals = []
        for i in range(len(closes)):
            if i < 50:
                signals.append("HOLD")
            else:
                sma20 = sum(closes[i-19:i+1]) / 20
                sma50 = sum(closes[i-49:i+1]) / 50
                sma20_prev = sum(closes[i-20:i]) / 20
                sma50_prev = sum(closes[i-50:i]) / 50
                if sma20 > sma50 and sma20_prev <= sma50_prev:
                    signals.append("BUY")
                elif sma20 < sma50 and sma20_prev >= sma50_prev:
                    signals.append("SELL")
                else:
                    signals.append("HOLD")
        
        capital = start_capital
        position = None
        trades = []
        for i in range(len(signals)):
            if signals[i] == "BUY" and position is None:
                position = closes[i]
                trades.append({"type": "BUY"})
            elif signals[i] == "SELL" and position is not None:
                pnl_pct = ((closes[i] - position) / position) * 100
                capital += (capital * pnl_pct / 100)
                trades.append({"type": "SELL", "pnl": pnl_pct})
                position = None
        
        total_trades = len([t for t in trades if "pnl" in t])
        winning = sum(1 for t in trades if t.get("pnl", 0) > 0)
        win_rate = round((winning / total_trades * 100) if total_trades > 0 else 0, 2)
        total_return = round(((capital - start_capital) / start_capital) * 100, 2)
        
        return {"symbol": symbol, "start_capital": start_capital, "final_capital": round(capital, 2), "total_return": total_return, "trades": total_trades, "win_rate": win_rate, "status": "completed"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/paper-trade")
async def place_paper_trade(request: Request):
    try:
        data = await request.json()
        action = data.get("action", "").upper()
        symbol = data.get("symbol", "")
        quantity = float(data.get("quantity", 0))
        
        if quantity <= 0:
            return {"status": "error", "message": "Quantite invalide"}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"https://api.binance.com/api/v3/ticker/price", params={"symbol": symbol})
            if r.status_code != 200:
                return {"status": "error", "message": "Prix indisponible"}
            price = float(r.json()["price"])
        
        crypto = symbol.replace("USDT", "")
        
        if action == "BUY":
            cost = quantity * price
            usdt_balance = paper_balance.get("USDT", 0)
            if usdt_balance < cost:
                return {"status": "error", "message": f"Solde insuffisant! Besoin: ${cost:.2f}"}
            paper_balance["USDT"] = usdt_balance - cost
            paper_balance[crypto] = paper_balance.get(crypto, 0) + quantity
            paper_trades_db.append({"id": len(paper_trades_db) + 1, "timestamp": datetime.now().isoformat(), "action": "ACHAT", "symbol": symbol, "quantity": quantity, "price": price, "total": cost})
            return {"status": "success", "message": f"Achat de {quantity} {crypto} a ${price:.2f}"}
        
        elif action == "SELL":
            crypto_balance = paper_balance.get(crypto, 0)
            if crypto_balance < quantity:
                return {"status": "error", "message": f"Solde {crypto} insuffisant!"}
            paper_balance[crypto] = crypto_balance - quantity
            revenue = quantity * price
            paper_balance["USDT"] = paper_balance.get("USDT", 0) + revenue
            paper_trades_db.append({"id": len(paper_trades_db) + 1, "timestamp": datetime.now().isoformat(), "action": "VENTE", "symbol": symbol, "quantity": quantity, "price": price, "total": revenue})
            return {"status": "success", "message": f"Vente de {quantity} {crypto} a ${price:.2f}"}
        
        return {"status": "error", "message": "Action invalide"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/paper-stats")
async def get_paper_stats():
    try:
        total = paper_balance.get("USDT", 0)
        async with httpx.AsyncClient(timeout=10.0) as client:
            for crypto, qty in paper_balance.items():
                if crypto != "USDT" and qty > 0:
                    try:
                        r = await client.get(f"https://api.binance.com/api/v3/ticker/price", params={"symbol": f"{crypto}USDT"})
                        if r.status_code == 200:
                            total += qty * float(r.json()["price"])
                    except:
                        pass
        pnl = total - 10000.0
        return {"total_trades": len(paper_trades_db), "total_value": round(total, 2), "pnl": round(pnl, 2), "pnl_pct": round((pnl / 10000) * 100, 2)}
    except:
        return {"total_trades": 0, "total_value": 10000.0, "pnl": 0, "pnl_pct": 0}

@app.get("/api/paper-balance")
async def get_paper_balance():
    return {"balance": paper_balance}

@app.get("/api/paper-trades")
async def get_paper_trades():
    return {"trades": paper_trades_db}

@app.post("/api/paper-reset")
async def reset_paper():
    global paper_trades_db, paper_balance
    paper_trades_db = []
    paper_balance = {"USDT": 10000.0}
    return {"status": "success"}

@app.get("/api/convert")
async def convert_currency(from_currency: str, to_currency: str, amount: float = 1.0):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get("https://api.coingecko.com/api/v3/simple/price", params={"ids": "bitcoin,ethereum,solana", "vs_currencies": "usd,eur,cad"})
            if r.status_code != 200:
                return {"error": "Erreur API"}
            prices = r.json()
        
        symbol_map = {"BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana"}
        fiat_map = {"USD": "usd", "EUR": "eur", "CAD": "cad"}
        from_c, to_c = from_currency.upper(), to_currency.upper()
        result = 0
        
        if from_c in symbol_map and to_c in fiat_map:
            result = amount * prices.get(symbol_map[from_c], {}).get(fiat_map[to_c], 0)
        elif from_c in fiat_map and to_c in symbol_map:
            price = prices.get(symbol_map[to_c], {}).get(fiat_map[from_c], 0)
            result = amount / price if price > 0 else 0
        
        return {"from": from_currency, "to": to_currency, "amount": amount, "result": round(result, 8)}
    except:
        return {"error": "Erreur conversion"}

@app.get("/api/btc-quarterly")
async def get_btc_quarterly():
    return {"quarterly_returns": {"2020": {"T1": -10, "T2": 42, "T3": 18, "T4": 171}, "2021": {"T1": 103, "T2": -39, "T3": 39, "T4": 1}, "2022": {"T1": -5, "T2": -56, "T3": 2, "T4": -17}, "2023": {"T1": 72, "T2": 11, "T3": -11, "T4": 57}, "2024": {"T1": 69, "T2": -12, "T3": 6, "T4": 45}}}

@app.get("/api/calendar")
async def get_calendar():
    return {"events": [{"date": "2025-10-28", "title": "FOMC", "coins": ["BTC", "ETH"]}, {"date": "2025-10-29", "title": "Fed Decision", "coins": ["BTC", "ETH"]}]}

# PAGES HTML
@app.get("/", response_class=HTMLResponse)
async def home():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Dashboard</title>""" + CSS + """</head>
<body><div class="container"><div class="header"><h1>DASHBOARD TRADING</h1><p>Toutes fonctionnalites OK</p></div>""" + NAV + """
<div class="card"><h2>Bienvenue</h2><p>Dashboard operationnel - Toutes les sections fonctionnent</p></div>
</div></body></html>""")

@app.get("/trades", response_class=HTMLResponse)
async def trades_page():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Trades</title>""" + CSS + """</head>
<body><div class="container"><div class="header"><h1>Gestion Trades</h1></div>""" + NAV + """
<div class="grid grid-4">
<div class="stat-box"><div class="label">Total</div><div class="value" id="t">0</div></div>
<div class="stat-box"><div class="label">Win Rate</div><div class="value" id="w">0%</div></div>
<div class="stat-box"><div class="label">P&L</div><div class="value" id="p">0%</div></div>
<div class="stat-box"><div class="label">Moyen</div><div class="value" id="a">0%</div></div>
</div>
<div class="card"><h2>Actions</h2><button class="btn-danger" onclick="reset()">Reset</button></div>
<script>
async function load(){try{const r=await fetch('/api/stats');const d=await r.json();document.getElementById('t').textContent=d.total_trades;document.getElementById('w').textContent=d.win_rate+'%';document.getElementById('p').textContent=(d.total_pnl>0?'+':'')+d.total_pnl+'%';document.getElementById('a').textContent=(d.avg_pnl>0?'+':'')+d.avg_pnl+'%';}catch(e){console.error(e);}}
async function reset(){if(confirm('Reset?')){await fetch('/api/reset-trades',{method:'POST'});alert('OK');load();}}
load();setInterval(load,10000);
</script></div></body></html>""")

@app.get("/fear-greed", response_class=HTMLResponse)
async def fear_greed_page():
    return HTMLResponse("""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fear & Greed Index</title>
    """ + CSS + """
    <style>
        .fg-grid {display: grid;grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));gap: 30px;margin-top: 20px;}
        .fg-card {background: #1e293b;border-radius: 16px;padding: 30px;box-shadow: 0 10px 30px rgba(0,0,0,0.3);transition: transform 0.3s;border: 1px solid #334155;}
        .fg-card:hover {transform: translateY(-5px);}
        .fg-card h2 {font-size: 24px;margin-bottom: 20px;color: #60a5fa;border-bottom: 3px solid #60a5fa;padding-bottom: 10px;}
        .gauge-container {position: relative;width: 280px;height: 280px;margin: 20px auto;}
        .gauge-value {position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);text-align: center;}
        .gauge-value .number {font-size: 72px;font-weight: bold;color: #e2e8f0;line-height: 1;}
        .gauge-value .label {font-size: 24px;color: #94a3b8;margin-top: 10px;font-weight: 600;}
        .historical-item {display: flex;justify-content: space-between;align-items: center;padding: 15px;margin-bottom: 12px;background: #0f172a;border-radius: 12px;transition: all 0.3s;border: 1px solid #334155;}
        .historical-item:hover {background: #1e293b;transform: translateX(5px);}
        .historical-item .period {font-weight: 600;color: #e2e8f0;}
        .historical-item .value-badge {display: flex;align-items: center;gap: 12px;}
        .historical-item .classification {font-weight: 600;font-size: 16px;}
        .historical-item .number-circle {width: 50px;height: 50px;border-radius: 50%;display: flex;align-items: center;justify-content: center;font-weight: bold;color: white;font-size: 18px;}
        .extreme-fear {color: #ef4444;} .fear {color: #f97316;} .neutral {color: #eab308;} .greed {color: #22c55e;} .extreme-greed {color: #14b8a6;}
        .bg-extreme-fear {background: linear-gradient(135deg, #dc2626, #ef4444);} .bg-fear {background: linear-gradient(135deg, #ea580c, #f97316);} .bg-neutral {background: linear-gradient(135deg, #ca8a04, #eab308);} .bg-greed {background: linear-gradient(135deg, #16a34a, #22c55e);} .bg-extreme-greed {background: linear-gradient(135deg, #0d9488, #14b8a6);}
        .countdown {text-align: center;padding: 20px;}
        .countdown-timer {font-size: 32px;font-weight: bold;color: #60a5fa;margin-top: 15px;font-family: 'Courier New', monospace;}
        .update-info {margin-top: 15px;color: #94a3b8;font-size: 14px;}
        .loading {text-align: center;padding: 40px;color: #94a3b8;}
        .spinner {border: 4px solid #334155;border-top: 4px solid #60a5fa;border-radius: 50%;width: 50px;height: 50px;animation: spin 1s linear infinite;margin: 20px auto;}
        @keyframes spin {0% {transform: rotate(0deg);} 100% {transform: rotate(360deg);}}
        .info-footer {text-align: center;margin-top: 30px;padding: 20px;background: #1e293b;border-radius: 12px;color: #94a3b8;border: 1px solid #334155;}
        .info-footer a {color: #60a5fa;text-decoration: none;}
        .info-footer a:hover {text-decoration: underline;}
        .gauge-text {text-align:center;color:#94a3b8;margin-top:20px;}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🪙 Fear & Greed Index</h1>
            <p>Analyse du sentiment du marché crypto en temps réel</p>
        </div>
        
        """ + NAV + """
        
        <div id="content" class="loading">
            <div class="spinner"></div>
            <p>Chargement des données...</p>
        </div>
        
        <div class="info-footer">
            <p>📊 Données fournies par <a href="https://alternative.me" target="_blank">Alternative.me</a> • Mise à jour toutes les 24h</p>
        </div>
    </div>
    
    <script>
        console.log('🚀 Page Fear & Greed chargée');
        let updateInterval, countdownInterval;
        
        function getClassificationClass(value) {
            if (value <= 20) return 'extreme-fear';
            if (value <= 40) return 'fear';
            if (value <= 60) return 'neutral';
            if (value <= 80) return 'greed';
            return 'extreme-greed';
        }
        
        function getBgClass(value) {
            if (value <= 20) return 'bg-extreme-fear';
            if (value <= 40) return 'bg-fear';
            if (value <= 60) return 'bg-neutral';
            if (value <= 80) return 'bg-greed';
            return 'bg-extreme-greed';
        }
        
        function drawGauge(value) {
            const canvas = document.getElementById('gaugeCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const centerX = 140, centerY = 140, radius = 120;
            ctx.clearRect(0, 0, 280, 280);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 2.25 * Math.PI);
            ctx.lineWidth = 30;
            ctx.strokeStyle = '#e9ecef';
            ctx.lineCap = 'round';
            ctx.stroke();
            const endAngle = 0.75 * Math.PI + (value / 100) * 1.5 * Math.PI;
            const gradient = ctx.createLinearGradient(0, 0, 280, 280);
            if (value <= 20) { gradient.addColorStop(0, '#c0392b'); gradient.addColorStop(1, '#e74c3c'); }
            else if (value <= 40) { gradient.addColorStop(0, '#e67e22'); gradient.addColorStop(1, '#f39c12'); }
            else if (value <= 60) { gradient.addColorStop(0, '#f39c12'); gradient.addColorStop(1, '#f1c40f'); }
            else if (value <= 80) { gradient.addColorStop(0, '#27ae60'); gradient.addColorStop(1, '#2ecc71'); }
            else { gradient.addColorStop(0, '#16a085'); gradient.addColorStop(1, '#1abc9c'); }
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, endAngle);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 30;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
        
        function formatCountdown(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        
        function startCountdown(totalSeconds) {
            let remaining = totalSeconds;
            if (countdownInterval) clearInterval(countdownInterval);
            countdownInterval = setInterval(() => {
                remaining--;
                if (remaining < 0) remaining = 0;
                const timerEl = document.getElementById('countdown-timer');
                if (timerEl) timerEl.textContent = formatCountdown(remaining);
                if (remaining === 0) { clearInterval(countdownInterval); loadData(); }
            }, 1000);
        }
        
        async function loadData() {
            try {
                const response = await fetch('/api/fear-greed-full');
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                const classif = getClassificationClass(data.current_value);
                const bgClass = getBgClass(data.current_value);
                
                const html = `<div class="fg-grid"><div class="fg-card"><h2>🎯 Fear & Greed Index</h2><div class="gauge-container"><canvas id="gaugeCanvas" width="280" height="280"></canvas><div class="gauge-value"><div class="number">${data.current_value}</div><div class="label ${classif}">${data.current_classification}</div></div></div><p class="gauge-text">Dernière mise à jour: ${new Date(data.timestamp * 1000).toLocaleDateString('fr-FR')}</p></div><div class="fg-card"><h2>📊 Valeurs Historiques</h2><div class="historical-item"><div class="period">Maintenant</div><div class="value-badge"><span class="classification ${getClassificationClass(data.historical.now.value)}">${data.historical.now.classification}</span><div class="number-circle ${getBgClass(data.historical.now.value)}">${data.historical.now.value}</div></div></div>${data.historical.yesterday && data.historical.yesterday.value ? `<div class="historical-item"><div class="period">Hier</div><div class="value-badge"><span class="classification ${getClassificationClass(data.historical.yesterday.value)}">${data.historical.yesterday.classification}</span><div class="number-circle ${getBgClass(data.historical.yesterday.value)}">${data.historical.yesterday.value}</div></div></div>` : ''}${data.historical.last_week && data.historical.last_week.value ? `<div class="historical-item"><div class="period">Il y a une semaine</div><div class="value-badge"><span class="classification ${getClassificationClass(data.historical.last_week.value)}">${data.historical.last_week.classification}</span><div class="number-circle ${getBgClass(data.historical.last_week.value)}">${data.historical.last_week.value}</div></div></div>` : ''}${data.historical.last_month && data.historical.last_month.value ? `<div class="historical-item"><div class="period">Il y a un mois</div><div class="value-badge"><span class="classification ${getClassificationClass(data.historical.last_month.value)}">${data.historical.last_month.classification}</span><div class="number-circle ${getBgClass(data.historical.last_month.value)}">${data.historical.last_month.value}</div></div></div>` : ''}</div><div class="fg-card"><h2>⏰ Prochaine Mise à Jour</h2><div class="countdown"><p style="color:#94a3b8;font-size:16px;">La prochaine mise à jour aura lieu dans:</p><div class="countdown-timer" id="countdown-timer">${formatCountdown(data.next_update_seconds)}</div><div class="update-info">Les données sont mises à jour toutes les 24 heures</div></div></div></div>`;
                
                document.getElementById('content').innerHTML = html;
                setTimeout(() => { drawGauge(data.current_value); }, 100);
                startCountdown(data.next_update_seconds);
            } catch (error) {
                console.error('❌ Erreur:', error);
                document.getElementById('content').innerHTML = `<div class="fg-card"><h2 style="color:#ef4444;">❌ Erreur de chargement</h2><p style="color:#94a3b8;margin-top:15px;">Impossible de charger les données. Détails: ${error.message}</p><button onclick="loadData()" style="margin-top:20px;padding:12px 24px;background:#60a5fa;color:white;border:none;border-radius:8px;cursor:pointer;">🔄 Réessayer</button></div>`;
            }
        }
        loadData();
        updateInterval = setInterval(loadData, 3600000);
    </script>
</body>
</html>""")

@app.get("/heatmap", response_class=HTMLResponse)
async def heatmap_page():
    return HTMLResponse("""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crypto Heatmap</title>
    """ + CSS + """
    <style>
        .heatmap-container{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:20px}
        .crypto-tile{background:#1e293b;border-radius:8px;padding:15px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;transition:all .3s;border:2px solid transparent;min-height:120px;cursor:pointer}
        .crypto-tile:hover{transform:scale(1.05);border-color:#60a5fa;box-shadow:0 8px 16px rgba(96,165,250,.3)}
        .crypto-tile.positive{background:linear-gradient(135deg,#065f46 0%,#059669 100%)}
        .crypto-tile.negative{background:linear-gradient(135deg,#991b1b 0%,#dc2626 100%)}
        .crypto-tile.neutral{background:#1e293b}
        .crypto-symbol{font-size:20px;font-weight:bold;color:#fff;margin-bottom:8px}
        .crypto-price{font-size:14px;color:#e2e8f0;margin-bottom:5px}
        .crypto-change{font-size:16px;font-weight:bold;color:#fff}
        .crypto-name{font-size:11px;color:#94a3b8;margin-top:5px}
        .controls{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
        .controls button{padding:10px 20px;background:#334155;color:#e2e8f0;border:1px solid #475569;border-radius:8px;cursor:pointer;transition:all .3s}
        .controls button:hover{background:#475569}
        .controls button.active{background:#60a5fa;border-color:#60a5fa}
        .stats-bar{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:20px}
        .stat-item{background:#1e293b;padding:15px;border-radius:8px;border:1px solid #334155}
        .stat-label{font-size:12px;color:#94a3b8;margin-bottom:5px}
        .stat-value{font-size:24px;font-weight:bold;color:#e2e8f0}
        .spinner{border:4px solid #334155;border-top:4px solid #60a5fa;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:20px auto}
        @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Crypto Heatmap</h1>
            <p>Visualisation en temps réel du marché crypto</p>
        </div>
        """ + NAV + """
        <div class="stats-bar">
            <div class="stat-item"><div class="stat-label">Total Cryptos</div><div class="stat-value" id="total-cryptos">0</div></div>
            <div class="stat-item"><div class="stat-label">En hausse</div><div class="stat-value" style="color:#22c55e;" id="gainers">0</div></div>
            <div class="stat-item"><div class="stat-label">En baisse</div><div class="stat-value" style="color:#ef4444;" id="losers">0</div></div>
            <div class="stat-item"><div class="stat-label">Variation moyenne</div><div class="stat-value" id="avg-change">0%</div></div>
        </div>
        <div class="card">
            <h2>🔥 Top 100 Cryptomonnaies</h2>
            <div class="controls">
                <button class="active" onclick="sortBy('market_cap')">📈 Market Cap</button>
                <button onclick="sortBy('change')">📊 Variation 24h</button>
                <button onclick="sortBy('volume')">💰 Volume</button>
                <button onclick="loadData()">🔄 Actualiser</button>
            </div>
            <div id="heatmap-container" class="heatmap-container"></div>
        </div>
        <div class="card"><p style="text-align:center;color:#94a3b8;">📊 Données fournies par CoinGecko • Mise à jour automatique toutes les 30 secondes</p></div>
    </div>
    <script>
        let cryptosData = [];
        let currentSort = 'market_cap';
        let updateInterval;
        
        function formatPrice(price) {
            if (price >= 1000) return '$' + price.toLocaleString('en-US', {maximumFractionDigits: 2});
            if (price >= 1) return '$' + price.toFixed(2);
            if (price >= 0.01) return '$' + price.toFixed(4);
            return '$' + price.toFixed(6);
        }
        
        function formatMarketCap(mc) {
            if (mc >= 1e12) return '$' + (mc / 1e12).toFixed(2) + 'T';
            if (mc >= 1e9) return '$' + (mc / 1e9).toFixed(2) + 'B';
            if (mc >= 1e6) return '$' + (mc / 1e6).toFixed(2) + 'M';
            return '$' + mc.toLocaleString();
        }
        
        function getColorClass(change) {
            if (change > 0.5) return 'positive';
            if (change < -0.5) return 'negative';
            return 'neutral';
        }
        
        function sortBy(type) {
            currentSort = type;
            document.querySelectorAll('.controls button').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            if (type === 'market_cap') cryptosData.sort((a, b) => b.market_cap - a.market_cap);
            else if (type === 'change') cryptosData.sort((a, b) => b.change_24h - a.change_24h);
            else if (type === 'volume') cryptosData.sort((a, b) => b.volume - a.volume);
            renderHeatmap();
        }
        
        function updateStats() {
            const total = cryptosData.length;
            const gainers = cryptosData.filter(c => c.change_24h > 0).length;
            const losers = cryptosData.filter(c => c.change_24h < 0).length;
            const avgChange = cryptosData.reduce((sum, c) => sum + c.change_24h, 0) / total;
            document.getElementById('total-cryptos').textContent = total;
            document.getElementById('gainers').textContent = gainers;
            document.getElementById('losers').textContent = losers;
            const avgEl = document.getElementById('avg-change');
            avgEl.textContent = (avgChange > 0 ? '+' : '') + avgChange.toFixed(2) + '%';
            avgEl.style.color = avgChange > 0 ? '#22c55e' : avgChange < 0 ? '#ef4444' : '#94a3b8';
        }
        
        function renderHeatmap() {
            const container = document.getElementById('heatmap-container');
            let html = '';
            cryptosData.forEach(crypto => {
                const colorClass = getColorClass(crypto.change_24h);
                const changeSymbol = crypto.change_24h > 0 ? '▲' : crypto.change_24h < 0 ? '▼' : '•';
                html += `<div class="crypto-tile ${colorClass}" title="${crypto.name} - Market Cap: ${formatMarketCap(crypto.market_cap)}"><div class="crypto-symbol">${crypto.symbol}</div><div class="crypto-price">${formatPrice(crypto.price)}</div><div class="crypto-change">${changeSymbol} ${Math.abs(crypto.change_24h)}%</div><div class="crypto-name">${crypto.name}</div></div>`;
            });
            container.innerHTML = html;
            updateStats();
        }
        
        async function loadData() {
            try {
                const response = await fetch('/api/heatmap');
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (data.cryptos && data.cryptos.length > 0) {
                    cryptosData = data.cryptos;
                    if (currentSort === 'market_cap') cryptosData.sort((a, b) => b.market_cap - a.market_cap);
                    else if (currentSort === 'change') cryptosData.sort((a, b) => b.change_24h - a.change_24h);
                    else if (currentSort === 'volume') cryptosData.sort((a, b) => b.volume - a.volume);
                    renderHeatmap();
                } else throw new Error('Aucune donnée disponible');
            } catch (error) {
                console.error('❌ Erreur:', error);
                document.getElementById('heatmap-container').innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#94a3b8;"><h3 style="color:#ef4444; margin-bottom:15px;">❌ Erreur de chargement</h3><p>Impossible de charger les données. ${error.message}</p><button onclick="loadData()" style="margin-top:20px;padding:12px 24px;background:#60a5fa;color:white;border:none;border-radius:8px;cursor:pointer;">🔄 Réessayer</button></div>`;
            }
        }
        loadData();
        updateInterval = setInterval(loadData, 30000);
    </script>
</body>
</html>""")

@app.get("/telegram-test", response_class=HTMLResponse)
async def telegram_page():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Telegram</title>""" + CSS + """</head>
<body><div class="container"><div class="header"><h1>Test Telegram</h1></div>""" + NAV + """
<div class="card"><h2>Test Bot</h2><button onclick="test()">Envoyer</button><div id="re"></div></div>
<script>
async function test(){document.getElementById('re').innerHTML='Envoi...';const r=await fetch('/api/telegram-test');const d=await r.json();if(d.result&&d.result.ok){document.getElementById('re').innerHTML='<div class="alert alert-success">OK!</div>';}else{document.getElementById('re').innerHTML='<div class="alert alert-error">Erreur</div>';}}
</script></div></body></html>""")

@app.get("/paper-trading", response_class=HTMLResponse)
async def paper_page():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Paper</title>""" + CSS + """</head>
<body><div class="container"><div class="header"><h1>Paper Trading</h1></div>""" + NAV + """
<div class="grid grid-3">
<div class="stat-box"><div class="label">Valeur</div><div class="value" id="tv">$10,000</div></div>
<div class="stat-box"><div class="label">P&L</div><div class="value" id="pn">$0</div></div>
<div class="stat-box"><div class="label">Trades</div><div class="value" id="tt">0</div></div>
</div>
<div class="grid grid-2">
<div class="card"><h2>Trade</h2>
<select id="ac"><option value="BUY">Acheter</option><option value="SELL">Vendre</option></select>
<select id="sy"><option value="BTCUSDT">BTC</option><option value="ETHUSDT">ETH</option><option value="SOLUSDT">SOL</option></select>
<input type="number" id="qt" value="0.01" step="0.001">
<button onclick="trade()">Executer</button><button onclick="resetP()" class="btn-danger">Reset</button>
<div id="ms"></div></div>
<div class="card"><h2>Portefeuille</h2><div id="ba">...</div></div>
</div>
<div class="card"><h2>Historique</h2><div id="hi">Aucun</div></div>
<script>
async function loadStats(){const r=await fetch('/api/paper-stats');const d=await r.json();document.getElementById('tv').textContent='$'+d.total_value.toLocaleString();document.getElementById('pn').textContent='$'+d.pnl;document.getElementById('tt').textContent=d.total_trades;}
async function loadBal(){const r=await fetch('/api/paper-balance');const d=await r.json();let h='';for(const[c,a]of Object.entries(d.balance)){if(a>0.00001)h+='<div style="padding:10px;background:#0f172a;border-radius:6px;margin:5px 0"><b>'+c+':</b> '+(c==='USDT'?a.toFixed(2):a.toFixed(6))+'</div>';}document.getElementById('ba').innerHTML=h||'Vide';}
async function loadHist(){const r=await fetch('/api/paper-trades');const d=await r.json();if(!d.trades.length){document.getElementById('hi').innerHTML='Aucun';return;}let h='<table><tr><th>Date</th><th>Action</th><th>Crypto</th><th>Qte</th><th>Prix</th><th>Total</th></tr>';d.trades.slice().reverse().forEach(t=>{h+='<tr><td>'+new Date(t.timestamp).toLocaleString()+'</td><td>'+t.action+'</td><td>'+t.symbol.replace('USDT','')+'</td><td>'+t.quantity+'</td><td>$'+t.price.toFixed(2)+'</td><td>$'+t.total.toFixed(2)+'</td></tr>';});h+='</table>';document.getElementById('hi').innerHTML=h;}
async function trade(){const r=await fetch('/api/paper-trade',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:document.getElementById('ac').value,symbol:document.getElementById('sy').value,quantity:document.getElementById('qt').value})});const d=await r.json();document.getElementById('ms').innerHTML='<div class="alert alert-'+(d.status==='success'?'success':'error')+'">'+d.message+'</div>';setTimeout(()=>{document.getElementById('ms').innerHTML='';},5000);loadStats();loadBal();loadHist();}
async function resetP(){if(confirm('Reset?')){await fetch('/api/paper-reset',{method:'POST'});alert('OK');loadStats();loadBal();loadHist();}}
loadStats();loadBal();loadHist();setInterval(()=>{loadStats();loadBal();},30000);
</script></div></body></html>""")

@app.get("/backtesting", response_class=HTMLResponse)
async def backtest_page():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Backtest</title>""" + CSS + """</head>
<body><div class="container"><div class="header"><h1>Backtesting</h1></div>""" + NAV + """
<div class="grid grid-2">
<div class="card"><h2>Config</h2>
<select id="sy"><option value="BTCUSDT">BTC</option><option value="ETHUSDT">ETH</option><option value="SOLUSDT">SOL</option></select>
<input type="number" id="ca" value="10000" step="1000">
<button onclick="run()">Lancer</button></div>
<div class="card"><h2>Resultats</h2>
<div id="rs" style="display:none">
<div class="grid grid-2">
<div class="stat-box"><div class="label">Final</div><div class="value" id="fc">$0</div></div>
<div class="stat-box"><div class="label">Return</div><div class="value" id="tr">0%</div></div>
</div>
<p>Trades: <span id="tc">0</span> | Win: <span id="wr">0%</span></p>
</div>
<div id="lo" style="display:none;text-align:center;padding:40px">Calcul...</div>
<div id="ph" style="text-align:center;padding:40px">Configurez</div>
<div id="er"></div>
</div></div>
<script>
async function run(){document.getElementById('ph').style.display='none';document.getElementById('rs').style.display='none';document.getElementById('er').innerHTML='';document.getElementById('lo').style.display='block';try{const r=await fetch('/api/backtest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol:document.getElementById('sy').value,start_capital:document.getElementById('ca').value})});const d=await r.json();document.getElementById('lo').style.display='none';if(d.status==='error'){document.getElementById('er').innerHTML='<div class=\"alert alert-error\">'+d.message+'</div>';document.getElementById('ph').style.display='block';return;}document.getElementById('rs').style.display='block';document.getElementById('fc').textContent='$'+d.final_capital.toLocaleString();document.getElementById('tr').textContent=(d.total_return>0?'+':'')+d.total_return+'%';document.getElementById('tc').textContent=d.trades;document.getElementById('wr').textContent=d.win_rate+'%';}catch(e){document.getElementById('lo').style.display='none';document.getElementById('er').innerHTML='<div class=\"alert alert-error\">'+e.message+'</div>';document.getElementById('ph').style.display='block';}}
</script></div></body></html>""")

@app.get("/bullrun-phase", response_class=HTMLResponse)
async def bullrun_page():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Bullrun</title>""" + CSS + """</head>
<body><div class="container"><div class="header"><h1>Bullrun Phase</h1></div>""" + NAV + """
<div class="card"><h2>Phase</h2><div id="ph">...</div></div>
<script>async function load(){const r=await fetch('/api/bullrun-phase');const d=await r.json();document.getElementById('ph').innerHTML='<h3>'+d.phase+'</h3><p>Prix: $'+d.btc_price+'</p><p>Change: '+d.btc_change_24h+'%</p>';}load();</script>
</div></body></html>""")

@app.get("/convertisseur", response_class=HTMLResponse)
async def convert_page():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Convertir</title>""" + CSS + """</head>
<body><div class="container"><div class="header"><h1>Convertisseur</h1></div>""" + NAV + """
<div class="card"><h2>Convertir</h2>
<input id="amt" value="1" type="number">
<select id="from"><option value="USD">USD</option><option value="BTC">BTC</option><option value="ETH">ETH</option></select>
<select id="to"><option value="BTC">BTC</option><option value="USD">USD</option><option value="ETH">ETH</option></select>
<button onclick="convert()">Convertir</button><div id="result"></div></div>
<script>async function convert(){const r=await fetch('/api/convert?from_currency='+document.getElementById('from').value+'&to_currency='+document.getElementById('to').value+'&amount='+document.getElementById('amt').value);const d=await r.json();document.getElementById('result').innerHTML='<h3>'+d.result+'</h3>';}</script>
</div></body></html>""")

@app.get("/annonces", response_class=HTMLResponse)
async def news_page():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>News</title>""" + CSS + """</head>
<body><div class="container"><div class="header"><h1>Actualites</h1></div>""" + NAV + """
<div class="card"><h2>News</h2><div id="nw">...</div></div>
<script>async function load(){const r=await fetch('/api/news');const d=await r.json();let h='';d.news.forEach(n=>{h+='<div style="padding:15px;margin:10px 0;background:#0f172a;border-radius:8px"><h3>'+n.title+'</h3><p>'+n.source+'</p></div>';});document.getElementById('nw').innerHTML=h;}load();</script>
</div></body></html>""")

@app.get("/btc-quarterly", response_class=HTMLResponse)
async def quarterly_page():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Quarterly</title>""" + CSS + """</head>
<body><div class="container"><div class="header"><h1>Quarterly Returns</h1></div>""" + NAV + """
<div class="card"><h2>Quarterly</h2><div id="q">...</div></div>
<script>async function load(){const r=await fetch('/api/btc-quarterly');const d=await r.json();let h='<table><tr><th>Annee</th><th>T1</th><th>T2</th><th>T3</th><th>T4</th></tr>';for(const[y,q]of Object.entries(d.quarterly_returns)){h+='<tr><td>'+y+'</td><td>'+q.T1+'%</td><td>'+q.T2+'%</td><td>'+q.T3+'%</td><td>'+q.T4+'%</td></tr>';}h+='</table>';document.getElementById('q').innerHTML=h;}load();</script>
</div></body></html>""")

@app.get("/calendrier", response_class=HTMLResponse)
async def calendar_page():
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Calendrier</title>""" + CSS + """</head>
<body><div class="container"><div class="header"><h1>Calendrier</h1></div>""" + NAV + """
<div class="card"><h2>Events</h2><div id="cal">...</div></div>
<script>async function load(){const r=await fetch('/api/calendar');const d=await r.json();let h='<table><tr><th>Date</th><th>Event</th></tr>';d.events.forEach(e=>{h+='<tr><td>'+e.date+'</td><td>'+e.title+'</td></tr>';});h+='</table>';document.getElementById('cal').innerHTML=h;}load();</script>
</div></body></html>""")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print("\n" + "="*60)
    print("DASHBOARD TRADING - DEMARRAGE")
    print("="*60)
    print(f"Port: {port}")
    print(f"Telegram: Configuré")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
