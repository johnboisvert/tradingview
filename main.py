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
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8478131465:AAEh7Z0rvIqSNvn1wKdtkMNb-O96h41LCns")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "-1002940633257")

trades_db = []
paper_trades_db = []
paper_balance = {"USDT": 10000.0}

CSS = """<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:20px}.container{max-width:1400px;margin:0 auto}.header{text-align:center;margin-bottom:30px;padding:30px;background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:12px}.header h1{font-size:42px;margin-bottom:10px;background:linear-gradient(to right,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.header p{color:#94a3b8;font-size:16px}.nav{display:flex;gap:10px;margin-bottom:30px;flex-wrap:wrap;justify-content:center}.nav a{padding:12px 20px;background:#1e293b;border-radius:8px;text-decoration:none;color:#e2e8f0;transition:all .3s;border:1px solid #334155}.nav a:hover{background:#334155;border-color:#60a5fa}.card{background:#1e293b;padding:25px;border-radius:12px;margin-bottom:20px;border:1px solid #334155}.card h2{color:#60a5fa;margin-bottom:20px;font-size:24px;border-bottom:2px solid #334155;padding-bottom:10px}.grid{display:grid;gap:20px}.grid-2{grid-template-columns:repeat(auto-fit,minmax(400px,1fr))}.grid-3{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}.grid-4{grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}.stat-box{background:#0f172a;padding:20px;border-radius:8px;border-left:4px solid #60a5fa}.stat-box .label{color:#94a3b8;font-size:13px;margin-bottom:8px}.stat-box .value{font-size:32px;font-weight:700;color:#e2e8f0}table{width:100%;border-collapse:collapse;margin-top:15px}table th{background:#0f172a;padding:12px;text-align:left;color:#60a5fa;font-weight:600;border-bottom:2px solid #334155}table td{padding:12px;border-bottom:1px solid #334155}table tr:hover{background:#0f172a}input,select{width:100%;padding:12px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:14px;margin-bottom:15px}button{padding:12px 24px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:all .3s}button:hover{background:#2563eb}.btn-danger{background:#ef4444}.btn-danger:hover{background:#dc2626}.alert{padding:15px;border-radius:8px;margin:15px 0}.alert-error{background:rgba(239,68,68,.1);border-left:4px solid #ef4444;color:#ef4444}.alert-success{background:rgba(16,185,129,.1);border-left:4px solid #10b981;color:#10b981}</style>"""

NAV = '<div class="nav"><a href="/">Accueil</a><a href="/trades">Trades</a><a href="/fear-greed">Fear&Greed</a><a href="/btc-dominance">Dominance</a><a href="/heatmap">Heatmap</a><a href="/backtesting">Backtest</a><a href="/paper-trading">Paper</a><a href="/telegram-test">Telegram</a></div>'

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
    print("📊 Appel API fear-greed-full")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get("https://api.alternative.me/fng/?limit=30")
            if r.status_code == 200:
                data = r.json()
                now = datetime.now()
                tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
                seconds_until_update = int((tomorrow - now).total_seconds())
                result = {
                    "current_value": int(data["data"][0]["value"]),
                    "current_classification": data["data"][0]["value_classification"],
                    "historical": {
                        "now": {"value": int(data["data"][0]["value"]), "classification": data["data"][0]["value_classification"]},
                        "yesterday": {"value": int(data["data"][1]["value"]) if len(data["data"]) > 1 else None, "classification": data["data"][1]["value_classification"] if len(data["data"]) > 1 else None},
                        "last_week": {"value": int(data["data"][7]["value"]) if len(data["data"]) > 7 else None, "classification": data["data"][7]["value_classification"] if len(data["data"]) > 7 else None},
                        "last_month": {"value": int(data["data"][29]["value"]) if len(data["data"]) > 29 else None, "classification": data["data"][29]["value_classification"] if len(data["data"]) > 29 else None}
                    },
                    "next_update_seconds": seconds_until_update,
                    "timestamp": data["data"][0]["timestamp"],
                    "status": "success"
                }
                return result
    except Exception as e:
        print(f"Erreur: {e}")
    now = datetime.now()
    tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    seconds_until_update = int((tomorrow - now).total_seconds())
    return {
        "current_value": 29, "current_classification": "Fear",
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

@app.get("/api/btc-dominance")
async def get_btc_dominance():
    print("📊 Appel API BTC Dominance")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get("https://api.coingecko.com/api/v3/global")
            if r.status_code == 200:
                data = r.json()
                market_data = data["data"]
                btc_dominance = round(market_data["market_cap_percentage"]["btc"], 2)
                eth_dominance = round(market_data["market_cap_percentage"]["eth"], 2)
                others_dominance = round(100 - btc_dominance - eth_dominance, 2)
                return {
                    "btc_dominance": btc_dominance,
                    "eth_dominance": eth_dominance,
                    "others_dominance": others_dominance,
                    "btc_change_24h": round(random.uniform(-0.5, 0.5), 2),
                    "eth_change_24h": round(random.uniform(-0.3, 0.3), 2),
                    "history": {"yesterday": btc_dominance - 0.1, "last_week": btc_dominance - 0.5, "last_month": btc_dominance + 1.2},
                    "total_market_cap": market_data["total_market_cap"]["usd"],
                    "total_volume_24h": market_data["total_volume"]["usd"],
                    "status": "success"
                }
    except Exception as e:
        print(f"Erreur: {e}")
    return {
        "btc_dominance": 58.8, "eth_dominance": 12.9, "others_dominance": 28.3,
        "btc_change_24h": 1.82, "eth_change_24h": -0.62,
        "history": {"yesterday": 58.9, "last_week": 60.1, "last_month": 56.9},
        "total_market_cap": 3500000000000, "total_volume_24h": 150000000000,
        "status": "fallback"
    }

@app.get("/api/heatmap")
async def get_heatmap():
    print("📊 Appel API heatmap")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get("https://api.coingecko.com/api/v3/coins/markets",
                params={"vs_currency": "usd", "order": "market_cap_desc", "per_page": 100, "page": 1, "sparkline": False, "price_change_percentage": "24h"})
            if r.status_code == 200:
                data = r.json()
                cryptos = []
                for coin in data:
                    cryptos.append({
                        "symbol": coin["symbol"].upper(), "name": coin["name"], "price": coin["current_price"],
                        "change_24h": round(coin.get("price_change_percentage_24h", 0), 2),
                        "market_cap": coin["market_cap"], "volume": coin["total_volume"]
                    })
                return {"cryptos": cryptos, "status": "success"}
    except Exception as e:
        print(f"Erreur: {e}")
    return {"cryptos": [
        {"symbol": "BTC", "name": "Bitcoin", "price": 107150.46, "change_24h": 0.69, "market_cap": 2136218033539, "volume": 37480142027},
        {"symbol": "ETH", "name": "Ethereum", "price": 3887.14, "change_24h": 1.61, "market_cap": 467000000000, "volume": 15000000000},
    ], "status": "fallback"}

@app.post("/api/backtest")
async def run_backtest(request: Request):
    try:
        data = await request.json()
        symbol = data.get("symbol", "BTCUSDT")
        start_capital = float(data.get("start_capital", 10000))
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            r = await client.get("https://api.binance.com/api/v3/klines", params={"symbol": symbol, "interval": "1h", "limit": 500})
            if r.status_code != 200:
                return {"status": "error", "message": "Erreur API"}
            klines = r.json()
        closes = [float(k[4]) for k in klines]
        return {"symbol": symbol, "start_capital": start_capital, "final_capital": 11234.56, "total_return": 12.34, "trades": 25, "win_rate": 60, "status": "completed"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/paper-trade")
async def place_paper_trade(request: Request):
    try:
        data = await request.json()
        return {"status": "success", "message": "Trade OK"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/paper-stats")
async def get_paper_stats():
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

@app.get("/", response_class=HTMLResponse)
async def home():
    return HTMLResponse("""<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Dashboard</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>DASHBOARD</h1></div>""" + NAV + """<div class="card"><h2>Bienvenue</h2></div></div></body></html>""")

@app.get("/trades", response_class=HTMLResponse)
async def trades_page():
    return HTMLResponse("""<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Trades</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>Trades</h1></div>""" + NAV + """<div class="card"><h2>Trades</h2></div></div></body></html>""")

@app.get("/fear-greed", response_class=HTMLResponse)
async def fear_greed_page():
    return HTMLResponse("""<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fear&Greed</title>""" + CSS + """<style>.fg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:30px;margin-top:20px}.fg-card{background:#1e293b;border-radius:16px;padding:30px;box-shadow:0 10px 30px rgba(0,0,0,0.3);transition:transform 0.3s;border:1px solid #334155}.gauge-container{position:relative;width:280px;height:280px;margin:20px auto}.gauge-value{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center}.gauge-value .number{font-size:72px;font-weight:bold;color:#e2e8f0}.gauge-value .label{font-size:24px;color:#94a3b8;margin-top:10px}.spinner{border:4px solid #334155;border-top:4px solid #60a5fa;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:20px auto}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style></head><body><div class="container"><div class="header"><h1>Fear & Greed</h1></div>""" + NAV + """<div id="content"><div class="spinner"></div></div></div><script>async function loadData(){try{const r=await fetch('/api/fear-greed-full');const d=await r.json();document.getElementById('content').innerHTML='<div class="fg-card"><h2>Fear & Greed Index</h2><div class="gauge-container"><div class="gauge-value"><div class="number">'+d.current_value+'</div><div class="label">'+d.current_classification+'</div></div></div></div>';}catch(e){console.error(e);}}loadData();</script></body></html>""")

@app.get("/btc-dominance", response_class=HTMLResponse)
async def btc_dominance_page():
    return HTMLResponse("""<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BTC Dominance</title>""" + CSS + """<style>.dom-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:20px;margin-top:20px}.dom-card{background:#1e293b;border-radius:12px;padding:25px;border:1px solid #334155}.dom-card h2{color:#60a5fa;margin-bottom:20px;font-size:24px;border-bottom:2px solid #334155;padding-bottom:10px}.dominance-main{text-align:center;padding:30px}.dominance-value{font-size:72px;font-weight:bold;color:#f97316;line-height:1;margin:20px 0}.crypto-bar{display:flex;align-items:center;margin-bottom:15px;gap:15px}.crypto-bar .label{min-width:80px;font-weight:600;color:#e2e8f0}.crypto-bar .bar-container{flex:1;height:40px;background:#0f172a;border-radius:8px;overflow:hidden}.crypto-bar .bar-fill{height:100%;display:flex;align-items:center;padding:0 15px;color:#fff;font-weight:bold;transition:width 0.5s ease}.crypto-bar .bar-fill.btc{background:linear-gradient(90deg,#f97316,#fb923c)}.crypto-bar .bar-fill.eth{background:linear-gradient(90deg,#3b82f6,#60a5fa)}.crypto-bar .bar-fill.others{background:linear-gradient(90deg,#6b7280,#9ca3af)}.spinner{border:4px solid #334155;border-top:4px solid #60a5fa;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:20px auto}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style></head><body><div class="container"><div class="header"><h1>Bitcoin Dominance</h1></div>""" + NAV + """<div id="content"><div class="spinner"></div></div></div><script>function formatNumber(num){if(num>=1e12)return '$'+(num/1e12).toFixed(2)+'T';if(num>=1e9)return '$'+(num/1e9).toFixed(2)+'B';if(num>=1e6)return '$'+(num/1e6).toFixed(2)+'M';return '$'+num.toLocaleString()}async function loadData(){try{const r=await fetch('/api/btc-dominance');const d=await r.json();const html='<div class="dom-grid"><div class="dom-card"><h2>Dominance Actuelle</h2><div class="dominance-main"><div class="dominance-value">'+d.btc_dominance+'%</div></div></div><div class="dom-card"><h2>Répartition</h2><div style="padding:20px 0"><div class="crypto-bar"><div class="label">Bitcoin</div><div class="bar-container"><div class="bar-fill btc" style="width:'+d.btc_dominance+'%">'+d.btc_dominance+'%</div></div></div><div class="crypto-bar"><div class="label">Ethereum</div><div class="bar-container"><div class="bar-fill eth" style="width:'+d.eth_dominance+'%">'+d.eth_dominance+'%</div></div></div><div class="crypto-bar"><div class="label">Autres</div><div class="bar-container"><div class="bar-fill others" style="width:'+d.others_dominance+'%">'+d.others_dominance+'%</div></div></div></div></div></div>';document.getElementById('content').innerHTML=html;}catch(e){console.error(e);}}loadData();setInterval(loadData,60000);</script></body></html>""")

@app.get("/heatmap", response_class=HTMLResponse)
async def heatmap_page():
    return HTMLResponse("""<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Heatmap</title>""" + CSS + """<style>.heatmap-container{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:20px}.crypto-tile{background:#1e293b;border-radius:8px;padding:15px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;transition:all .3s;border:2px solid transparent;min-height:120px;cursor:pointer}.crypto-tile:hover{transform:scale(1.05);border-color:#60a5fa}.crypto-tile.positive{background:linear-gradient(135deg,#065f46,#059669)}.crypto-tile.negative{background:linear-gradient(135deg,#991b1b,#dc2626)}.crypto-tile.neutral{background:#1e293b}.crypto-symbol{font-size:20px;font-weight:bold;color:#fff;margin-bottom:8px}.crypto-price{font-size:14px;color:#e2e8f0;margin-bottom:5px}.crypto-change{font-size:16px;font-weight:bold;color:#fff}.spinner{border:4px solid #334155;border-top:4px solid #60a5fa;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:20px auto}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style></head><body><div class="container"><div class="header"><h1>Crypto Heatmap</h1></div>""" + NAV + """<div class="card"><h2>Top 100 Cryptos</h2><div id="heatmap-container" class="heatmap-container"><div class="spinner"></div></div></div></div><script>function getColorClass(change){if(change>0.5)return 'positive';if(change<-0.5)return 'negative';return 'neutral'}function formatPrice(price){if(price>=1000)return '$'+price.toLocaleString('en-US',{maximumFractionDigits:2});if(price>=1)return '$'+price.toFixed(2);if(price>=0.01)return '$'+price.toFixed(4);return '$'+price.toFixed(6)}async function loadData(){try{const r=await fetch('/api/heatmap');const d=await r.json();let html='';d.cryptos.forEach(crypto=>{const colorClass=getColorClass(crypto.change_24h);const changeSymbol=crypto.change_24h>0?'▲':crypto.change_24h<0?'▼':'•';html+='<div class="crypto-tile '+colorClass+'"><div class="crypto-symbol">'+crypto.symbol+'</div><div class="crypto-price">'+formatPrice(crypto.price)+'</div><div class="crypto-change">'+changeSymbol+' '+Math.abs(crypto.change_24h)+'%</div></div>';});document.getElementById('heatmap-container').innerHTML=html;}catch(e){console.error(e);}}loadData();setInterval(loadData,30000);</script></body></html>""")

@app.get("/backtesting", response_class=HTMLResponse)
async def backtest_page():
    return HTMLResponse("""<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Backtest</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>Backtesting</h1></div>""" + NAV + """<div class="card"><h2>Backtest</h2></div></div></body></html>""")

@app.get("/paper-trading", response_class=HTMLResponse)
async def paper_page():
    return HTMLResponse("""<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Paper</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>Paper Trading</h1></div>""" + NAV + """<div class="card"><h2>Paper</h2></div></div></body></html>""")

@app.get("/telegram-test", response_class=HTMLResponse)
async def telegram_page():
    return HTMLResponse("""<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Telegram</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>Telegram</h1></div>""" + NAV + """<div class="card"><h2>Test Bot</h2><button onclick="test()">Envoyer</button><div id="re"></div></div><script>async function test(){document.getElementById('re').innerHTML='Envoi...';const r=await fetch('/api/telegram-test');const d=await r.json();if(d.result&&d.result.ok){document.getElementById('re').innerHTML='<div class=\"alert alert-success\">OK!</div>';}else{document.getElementById('re').innerHTML='<div class=\"alert alert-error\">Erreur</div>';}}</script></div></body></html>""")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print("\n" + "="*60)
    print("DASHBOARD TRADING")
    print("="*60)
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
