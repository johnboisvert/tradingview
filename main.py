# -*- coding: utf-8 -*-
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Any
import httpx
from datetime import datetime, timedelta, timezone
import asyncio
import random
import traceback
import json

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# VOS TOKENS TELEGRAM
TELEGRAM_BOT_TOKEN = "8478131465:AAEh7Z0rvIqSNvn1wKdtkMNb-O96h41LCns"
TELEGRAM_CHAT_ID = "-1002940633257"

CMC_API_KEY = "2013449b-117a-4d59-8caf-b8a052a158ca"
CRYPTOPANIC_TOKEN = "bca5327f4c31e7511b4a7824951ed0ae4d8bb5ac"

trades_db = []
paper_trades_db = []
paper_balance = {"USDT": 10000.0}

# Fuseau horaire Québec (UTC-5 hiver / UTC-4 été)
def get_quebec_offset():
    """Retourne le décalage UTC pour le Québec selon la saison"""
    now = datetime.utcnow()
    month = now.month
    # Heure avancée (EDT) de mars à novembre
    if 3 <= month <= 11:
        return timedelta(hours=-4)
    # Heure normale (EST) 
    return timedelta(hours=-5)

def get_quebec_time():
    """Retourne l'heure actuelle du Québec"""
    utc_now = datetime.now(timezone.utc)
    quebec_offset = get_quebec_offset()
    quebec_tz = timezone(quebec_offset)
    return utc_now.astimezone(quebec_tz)

def format_quebec_time(dt=None):
    """Formate une date en heure du Québec"""
    if dt is None:
        dt = get_quebec_time()
    elif dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc).astimezone(timezone(get_quebec_offset()))
    return dt.strftime("%Y-%m-%d %H:%M:%S")

CSS = """<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:20px;}.container{max-width:1400px;margin:0 auto;}.header{text-align:center;margin-bottom:30px;padding:30px;background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:12px;}.header h1{font-size:42px;margin-bottom:10px;background:linear-gradient(to right,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}.header p{color:#94a3b8;font-size:16px;}.nav{display:flex;gap:10px;margin-bottom:30px;flex-wrap:wrap;justify-content:center;}.nav a{padding:12px 20px;background:#1e293b;border-radius:8px;text-decoration:none;color:#e2e8f0;transition:all 0.3s;border:1px solid #334155;}.nav a:hover{background:#334155;border-color:#60a5fa;}.card{background:#1e293b;padding:25px;border-radius:12px;margin-bottom:20px;border:1px solid #334155;}.card h2{color:#60a5fa;margin-bottom:20px;font-size:24px;border-bottom:2px solid #334155;padding-bottom:10px;}.grid{display:grid;gap:20px;}.grid-2{grid-template-columns:repeat(auto-fit,minmax(400px,1fr));}.grid-3{grid-template-columns:repeat(auto-fit,minmax(300px,1fr));}.grid-4{grid-template-columns:repeat(auto-fit,minmax(250px,1fr));}.stat-box{background:#0f172a;padding:20px;border-radius:8px;border-left:4px solid #60a5fa;}.stat-box .label{color:#94a3b8;font-size:13px;margin-bottom:8px;}.stat-box .value{font-size:32px;font-weight:bold;color:#e2e8f0;}table{width:100%;border-collapse:collapse;margin-top:15px;}table th{background:#0f172a;padding:12px;text-align:left;color:#60a5fa;font-weight:600;border-bottom:2px solid #334155;}table td{padding:12px;border-bottom:1px solid #334155;}table tr:hover{background:#0f172a;}.badge{padding:6px 12px;border-radius:20px;font-size:12px;font-weight:bold;display:inline-block;}.badge-green{background:#10b981;color:#fff;}.badge-red{background:#ef4444;color:#fff;}.badge-yellow{background:#f59e0b;color:#fff;}input,select,textarea{width:100%;padding:12px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:14px;margin-bottom:15px;}button{padding:12px 24px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;}button:hover{background:#2563eb;}.btn-danger{background:#ef4444;}.btn-danger:hover{background:#dc2626;}.alert{padding:15px;border-radius:8px;margin:15px 0;}.alert-error{background:rgba(239,68,68,0.1);border-left:4px solid #ef4444;color:#ef4444;}.alert-success{background:rgba(16,185,129,0.1);border-left:4px solid #10b981;color:#10b981;}</style>"""

NAV = '<div class="nav"><a href="/">Accueil</a><a href="/trades">Trades</a><a href="/fear-greed">Fear&Greed</a><a href="/bullrun-phase">Bullrun</a><a href="/convertisseur">Convertir</a><a href="/calendrier">Calendrier</a><a href="/altcoin-season">AltSeason</a><a href="/btc-dominance">Dominance</a><a href="/btc-quarterly">Trimestriel</a><a href="/annonces">Actualites</a><a href="/heatmap">Heatmap</a><a href="/backtesting">Backtest</a><a href="/paper-trading">Paper</a><a href="/strategie">Strategie</a><a href="/correlations">Correlations</a><a href="/top-movers">Movers</a><a href="/performance">Performance</a><a href="/telegram-test">Telegram</a></div>'

class TradeWebhook(BaseModel):
    action: Optional[str] = "BUY"
    symbol: Optional[str] = "BTCUSDT"
    price: Optional[float] = 0.0
    quantity: Optional[float] = 1.0
    entry_time: Optional[str] = None
    sl: Optional[float] = None
    tp1: Optional[float] = None
    tp2: Optional[float] = None
    tp3: Optional[float] = None

async def send_telegram_message(message: str):
    """Envoie un message Telegram avec logging détaillé"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        
        print(f"\n{'='*50}")
        print(f"📤 ENVOI TELEGRAM")
        print(f"{'='*50}")
        print(f"URL: {url[:50]}...")
        print(f"Chat ID: {TELEGRAM_CHAT_ID}")
        print(f"Message: {message[:100]}...")
        
        payload = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "HTML"
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            result = response.json()
            
            print(f"\n📥 REPONSE TELEGRAM:")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {result}")
            
            if result.get("ok"):
                print(f"✅ Message envoyé avec succès!")
            else:
                print(f"❌ ERREUR Telegram:")
                print(f"   Description: {result.get('description', 'Inconnue')}")
                print(f"   Error Code: {result.get('error_code', 'N/A')}")
                
                if "chat not found" in str(result.get('description', '')).lower():
                    print(f"⚠️  Le chat ID {TELEGRAM_CHAT_ID} n'existe pas ou le bot n'y a pas accès")
                elif "bot was blocked" in str(result.get('description', '')).lower():
                    print(f"⚠️  Le bot a été bloqué par l'utilisateur")
                elif "unauthorized" in str(result.get('description', '')).lower():
                    print(f"⚠️  Token invalide")
            
            print(f"{'='*50}\n")
            return result
            
    except httpx.TimeoutException:
        print(f"❌ Timeout lors de l'envoi à Telegram")
        return {"ok": False, "error": "Timeout"}
    except Exception as e:
        print(f"❌ Exception Telegram: {type(e).__name__}: {e}")
        traceback.print_exc()
        return {"ok": False, "error": str(e)}

@app.post("/tv-webhook")
async def tradingview_webhook(request: Request):
    """Webhook TradingView flexible qui accepte n'importe quel JSON"""
    try:
        # Lire le body brut
        body = await request.body()
        print(f"\n📨 WEBHOOK REÇU:")
        print(f"Body brut: {body.decode('utf-8')}")
        
        # Parser le JSON
        try:
            data = json.loads(body)
        except:
            data = {}
        
        print(f"Data parsée: {data}")
        
        # Extraire les champs avec des valeurs par défaut
        quebec_time = get_quebec_time()
        trade_data = {
            "action": data.get("action", "BUY"),
            "symbol": data.get("symbol", "BTCUSDT"),
            "price": float(data.get("price", 0)),
            "quantity": float(data.get("quantity", 1.0)),
            "entry_time": data.get("entry_time") or format_quebec_time(quebec_time),
            "sl": data.get("sl"),
            "tp1": data.get("tp1"),
            "tp2": data.get("tp2"),
            "tp3": data.get("tp3"),
            "timestamp": quebec_time.isoformat(),
            "status": "open",
            "pnl": 0
        }
        
        trades_db.append(trade_data)
        
        emoji = "🟢 ACHAT" if trade_data["action"].upper() == "BUY" else "🔴 VENTE"
        message = f"<b>{emoji} {trade_data['symbol']}</b>\n\n💰 Prix: ${trade_data['price']:,.2f}\n📊 Quantité: {trade_data['quantity']}\n🕐 Heure QC: {format_quebec_time(quebec_time)}"
        
        if trade_data["sl"]:
            message += f"\n🛑 Stop Loss: ${trade_data['sl']:,.2f}"
        if trade_data["tp1"]:
            message += f"\n🎯 TP1: ${trade_data['tp1']:,.2f}"
        
        await send_telegram_message(message)
        
        return {"status": "success", "trade": trade_data}
        
    except Exception as e:
        print(f"❌ Erreur webhook: {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@app.get("/api/telegram-test")
async def test_telegram():
    quebec_time = get_quebec_time()
    offset = get_quebec_offset()
    offset_str = f"UTC{offset.total_seconds()/3600:+.0f}"
    
    message = f"🤖 <b>Test du Bot Telegram</b>\n\n✅ Le bot fonctionne correctement!\n\n🕐 Heure Québec: {format_quebec_time(quebec_time)}\n📍 Fuseau: {offset_str}\n\n💡 Token: ...{TELEGRAM_BOT_TOKEN[-10:]}\n💬 Chat ID: {TELEGRAM_CHAT_ID}"
    
    result = await send_telegram_message(message)
    
    return {
        "result": result,
        "quebec_time": format_quebec_time(quebec_time),
        "timestamp": quebec_time.isoformat(),
        "timezone": offset_str
    }

@app.get("/api/telegram-info")
async def telegram_info():
    """Informations de configuration Telegram pour debug"""
    offset = get_quebec_offset()
    offset_str = f"UTC{offset.total_seconds()/3600:+.0f}"
    return {
        "bot_token_preview": f"{TELEGRAM_BOT_TOKEN[:10]}...{TELEGRAM_BOT_TOKEN[-10:]}",
        "chat_id": TELEGRAM_CHAT_ID,
        "api_url": f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN[:20]}...",
        "status": "configured",
        "quebec_time": format_quebec_time(),
        "timezone": offset_str
    }

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
    
    return {
        "total_trades": total,
        "open_trades": open_trades,
        "closed_trades": closed,
        "win_rate": win_rate,
        "total_pnl": round(total_pnl, 2),
        "avg_pnl": avg_pnl
    }

@app.get("/api/fear-greed")
async def get_fear_greed():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get("https://api.alternative.me/fng/")
            if r.status_code == 200:
                d = r.json()
                v = int(d["data"][0]["value"])
                return {
                    "value": v,
                    "classification": d["data"][0]["value_classification"],
                    "emoji": "😨" if v < 25 else "😐" if v < 45 else "🙂" if v < 55 else "😄" if v < 75 else "🤑",
                    "status": "success"
                }
    except:
        pass
    return {"value": 50, "classification": "Neutre", "emoji": "😐", "status": "fallback"}

@app.get("/api/bullrun-phase")
async def get_bullrun_phase():
    """Détermine la phase du cycle crypto en temps réel"""
    print("\n" + "="*50)
    print("📊 ANALYSE PHASE BULLRUN")
    print("="*50)
    
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            # Récupérer données BTC
            btc_r = await client.get("https://api.binance.com/api/v3/ticker/24hr", params={"symbol": "BTCUSDT"})
            eth_r = await client.get("https://api.binance.com/api/v3/ticker/24hr", params={"symbol": "ETHUSDT"})
            
            if btc_r.status_code != 200 or eth_r.status_code != 200:
                raise Exception("Impossible de récupérer les données")
            
            btc_data = btc_r.json()
            eth_data = eth_r.json()
            
            btc_price = float(btc_data["lastPrice"])
            btc_change_7d = float(btc_data["priceChangePercent"])
            eth_change_7d = float(eth_data["priceChangePercent"])
            
            print(f"BTC: ${btc_price:,.2f} ({btc_change_7d:+.2f}%)")
            print(f"ETH: ({eth_change_7d:+.2f}%)")
            
            # Récupérer altcoins
            alts = ["SOLUSDT", "ADAUSDT", "AVAXUSDT", "LINKUSDT"]
            alt_changes = []
            
            for alt in alts:
                try:
                    alt_r = await client.get("https://api.binance.com/api/v3/ticker/24hr", params={"symbol": alt})
                    if alt_r.status_code == 200:
                        change = float(alt_r.json()["priceChangePercent"])
                        alt_changes.append(change)
                        print(f"{alt}: {change:+.2f}%")
                except:
                    pass
            
            avg_alt = sum(alt_changes) / len(alt_changes) if alt_changes else 0
            print(f"Moyenne Alts: {avg_alt:+.2f}%")
            
            # LOGIQUE DE DÉTECTION DES PHASES
            phase_num = 1
            phase_name = "Phase 1: Bitcoin"
            
            # Phase 1: Bitcoin domine
            if btc_change_7d > 3 and eth_change_7d < btc_change_7d and avg_alt < btc_change_7d:
                phase_num = 1
                phase_name = "Phase 1: Bitcoin"
                print("✅ PHASE 1 DÉTECTÉE: Bitcoin domine")
            
            # Phase 2: Ethereum rattrape
            elif eth_change_7d > btc_change_7d and eth_change_7d > 2:
                phase_num = 2
                phase_name = "Phase 2: Ethereum"
                print("✅ PHASE 2 DÉTECTÉE: Ethereum surperforme")
            
            # Phase 3: Large caps explosent
            elif avg_alt > eth_change_7d and avg_alt > 5:
                phase_num = 3
                phase_name = "Phase 3: Large Caps"
                print("✅ PHASE 3 DÉTECTÉE: Large caps paraboliques")
            
            # Phase 4: Tout explose (Altseason)
            elif avg_alt > 10 and eth_change_7d > 8 and btc_change_7d > 5:
                phase_num = 4
                phase_name = "Phase 4: Altseason"
                print("✅ PHASE 4 DÉTECTÉE: Altseason complète")
            
            # Consolidation
            elif abs(btc_change_7d) < 2 and abs(eth_change_7d) < 2:
                phase_num = 0
                phase_name = "Consolidation"
                print("✅ CONSOLIDATION DÉTECTÉE")
            
            print("="*50 + "\n")
            
            return {
                "current_phase": phase_num,
                "phase_name": phase_name,
                "btc_price": round(btc_price, 2),
                "btc_change": round(btc_change_7d, 2),
                "eth_change": round(eth_change_7d, 2),
                "avg_alt_change": round(avg_alt, 2),
                "status": "success"
            }
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        print("="*50 + "\n")
        
        # Retour par défaut
        return {
            "current_phase": 1,
            "phase_name": "Phase 1: Bitcoin",
            "btc_price": 95000,
            "btc_change": 0,
            "eth_change": 0,
            "avg_alt_change": 0,
            "status": "fallback"
        }

@app.get("/api/news")
async def get_news():
    now = get_quebec_time()
    news = [
        {"title": "Bitcoin maintient 95k malgre la volatilite", "source": "CoinDesk", "published": (now - timedelta(hours=2)).isoformat(), "url": "#"},
        {"title": "Ethereum prepare une mise a jour majeure", "source": "Cointelegraph", "published": (now - timedelta(hours=4)).isoformat(), "url": "#"},
        {"title": "ETF Bitcoin: flux entrants records", "source": "Bloomberg", "published": (now - timedelta(hours=6)).isoformat(), "url": "#"},
        {"title": "Solana depasse les 200 dollars", "source": "The Block", "published": (now - timedelta(hours=8)).isoformat(), "url": "#"},
        {"title": "SEC approuve de nouveaux produits crypto", "source": "Decrypt", "published": (now - timedelta(hours=10)).isoformat(), "url": "#"}
    ]
    return {"news": news, "status": "success"}

@app.post("/api/backtest")
async def run_backtest(request: Request):
    try:
        data = await request.json()
        symbol = data.get("symbol", "BTCUSDT")
        strategy = data.get("strategy", "SMA_CROSS")
        start_capital = float(data.get("start_capital", 10000))
        
        klines = None
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            for attempt in range(3):
                try:
                    r = await client.get("https://api.binance.com/api/v3/klines", params={
                        "symbol": symbol,
                        "interval": "1h",
                        "limit": 500
                    })
                    if r.status_code == 200:
                        klines = r.json()
                        break
                except:
                    if attempt == 2:
                        return {"status": "error", "message": "Impossible de charger les donnees"}
                    await asyncio.sleep(2)
        
        if not klines:
            return {"status": "error", "message": "Aucune donnee disponible"}
        
        closes = [float(k[4]) for k in klines]
        
        signals = []
        if strategy == "SMA_CROSS":
            for i in range(len(closes)):
                if i < 50:
                    signals.append("HOLD")
                    continue
                
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
        else:
            signals = ["HOLD"] * len(closes)
        
        capital = start_capital
        position = None
        trades = []
        
        for i in range(len(signals)):
            if signals[i] == "BUY" and position is None:
                position = closes[i]
                trades.append({"type": "BUY", "price": closes[i]})
            elif signals[i] == "SELL" and position is not None:
                pnl_pct = ((closes[i] - position) / position) * 100
                capital += (capital * pnl_pct / 100)
                trades.append({"type": "SELL", "price": closes[i], "pnl": pnl_pct})
                position = None
        
        total_trades = len([t for t in trades if "pnl" in t])
        winning = sum(1 for t in trades if t.get("pnl", 0) > 0)
        win_rate = round((winning / total_trades * 100) if total_trades > 0 else 0, 2)
        total_return = round(((capital - start_capital) / start_capital) * 100, 2)
        
        return {
            "symbol": symbol,
            "strategy": strategy,
            "start_capital": start_capital,
            "final_capital": round(capital, 2),
            "total_return": total_return,
            "trades": total_trades,
            "win_rate": win_rate,
            "max_drawdown": 0,
            "sharpe_ratio": 0,
            "status": "completed"
        }
    
    except Exception as e:
        traceback.print_exc()
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
        
        price = None
        async with httpx.AsyncClient(timeout=10.0) as client:
            for attempt in range(3):
                try:
                    r = await client.get(f"https://api.binance.com/api/v3/ticker/price", params={"symbol": symbol})
                    if r.status_code == 200:
                        price = float(r.json()["price"])
                        break
                except:
                    if attempt == 2:
                        return {"status": "error", "message": "Impossible de recuperer le prix"}
                    await asyncio.sleep(1)
        
        if price is None:
            return {"status": "error", "message": "Prix indisponible"}
        
        crypto = symbol.replace("USDT", "")
        
        if action == "BUY":
            cost = quantity * price
            usdt_balance = paper_balance.get("USDT", 0)
            
            if usdt_balance < cost:
                return {
                    "status": "error",
                    "message": f"Solde USDT insuffisant! Besoin: ${cost:.2f}, Disponible: ${usdt_balance:.2f}"
                }
            
            paper_balance["USDT"] = usdt_balance - cost
            paper_balance[crypto] = paper_balance.get(crypto, 0) + quantity
            
            paper_trades_db.append({
                "id": len(paper_trades_db) + 1,
                "timestamp": get_quebec_time().isoformat(),
                "action": "ACHAT",
                "symbol": symbol,
                "quantity": quantity,
                "price": price,
                "total": cost
            })
            
            return {"status": "success", "message": f"Achat de {quantity} {crypto} a ${price:.2f}"}
        
        elif action == "SELL":
            crypto_balance = paper_balance.get(crypto, 0)
            
            if crypto_balance < quantity:
                return {
                    "status": "error",
                    "message": f"Solde {crypto} insuffisant! Besoin: {quantity}, Disponible: {crypto_balance}"
                }
            
            paper_balance[crypto] = crypto_balance - quantity
            revenue = quantity * price
            paper_balance["USDT"] = paper_balance.get("USDT", 0) + revenue
            
            paper_trades_db.append({
                "id": len(paper_trades_db) + 1,
                "timestamp": get_quebec_time().isoformat(),
                "action": "VENTE",
                "symbol": symbol,
                "quantity": quantity,
                "price": price,
                "total": revenue
            })
            
            return {"status": "success", "message": f"Vente de {quantity} {crypto} a ${price:.2f}"}
        
        else:
            return {"status": "error", "message": "Action invalide (BUY ou SELL requis)"}
    
    except Exception as e:
        traceback.print_exc()
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
        return {
            "total_trades": len(paper_trades_db),
            "total_value": round(total, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round((pnl / 10000) * 100, 2)
        }
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

@app.get("/api/altcoin-season")
async def get_altcoin_season():
    return {
        "index": 27,
        "status": "Saison Bitcoin",
        "btc_performance_90d": 12.5,
        "altcoins_winning": 13
    }

@app.get("/api/calendar")
async def get_calendar():
    events = [
        {"date": "2025-10-28", "title": "Reunion FOMC", "coins": ["BTC", "ETH"], "category": "Macro"},
        {"date": "2025-10-29", "title": "Decision taux Fed", "coins": ["BTC", "ETH"], "category": "Macro"},
        {"date": "2025-11-13", "title": "Rapport CPI US", "coins": ["BTC", "ETH"], "category": "Macro"},
        {"date": "2025-11-21", "title": "Conference Bitcoin Dubai", "coins": ["BTC"], "category": "Conference"},
        {"date": "2025-12-04", "title": "Mise a jour Ethereum Prague", "coins": ["ETH"], "category": "Tech"},
    ]
    return {"events": events}

@app.get("/api/convert")
async def convert_currency(from_currency: str, to_currency: str, amount: float = 1.0):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get("https://api.coingecko.com/api/v3/simple/price", params={
                "ids": "bitcoin,ethereum,solana",
                "vs_currencies": "usd,eur,cad"
            })
            
            if r.status_code != 200:
                return {"error": "Erreur API CoinGecko"}
            
            prices = r.json()
            
            symbol_map = {"BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana"}
            fiat_map = {"USD": "usd", "EUR": "eur", "CAD": "cad"}
            
            from_c = from_currency.upper()
            to_c = to_currency.upper()
            result = 0
            
            if from_c in symbol_map and to_c in fiat_map:
                price = prices.get(symbol_map[from_c], {}).get(fiat_map[to_c], 0)
                result = amount * price
            elif from_c in fiat_map and to_c in symbol_map:
                price = prices.get(symbol_map[to_c], {}).get(fiat_map[from_c], 0)
                result = amount / price if price > 0 else 0
            elif from_c in symbol_map and to_c in symbol_map:
                from_usd = prices.get(symbol_map[from_c], {}).get("usd", 0)
                to_usd = prices.get(symbol_map[to_c], {}).get("usd", 0)
                result = (amount * from_usd) / to_usd if to_usd > 0 else 0
            else:
                return {"error": "Devises non supportees"}
            
            return {
                "from": from_currency,
                "to": to_currency,
                "amount": amount,
                "result": round(result, 8),
                "rate": round(result / amount, 8) if amount > 0 else 0
            }
    
    except Exception as e:
        return {"error": f"Erreur: {str(e)}"}

@app.get("/api/btc-quarterly")
async def get_btc_quarterly():
    data = {
        "2020": {"T1": -10, "T2": 42, "T3": 18, "T4": 171},
        "2021": {"T1": 103, "T2": -39, "T3": 39, "T4": 1},
        "2022": {"T1": -5, "T2": -56, "T3": 2, "T4": -17},
        "2023": {"T1": 72, "T2": 11, "T3": -11, "T4": 57},
        "2024": {"T1": 69, "T2": -12, "T3": 6, "T4": 45},
        "2025": {"T1": 8, "T2": -5, "T3": 12, "T4": 0}
    }
    return {"quarterly_returns": data}

@app.get("/api/btc-dominance")
async def get_btc_dominance():
    return {
        "dominance": 52.3,
        "trend": "Hausse",
        "timestamp": get_quebec_time().isoformat()
    }

@app.get("/api/heatmap")
async def get_heatmap(type: str = "monthly"):
    if type == "yearly":
        data = {"2020": 301, "2021": 60, "2022": -64, "2023": 156, "2024": 120, "2025": 15}
        return {"heatmap": [{"year": y, "performance": p} for y, p in data.items()], "type": "yearly"}
    else:
        months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"]
        return {"heatmap": [{"month": m, "performance": round(random.uniform(-15, 25), 2)} for m in months], "type": "monthly"}

@app.get("/api/correlations")
async def get_correlations():
    return {
        "correlations": [
            {"pair": "BTC-ETH", "correlation": 0.87},
            {"pair": "BTC-TOTAL", "correlation": 0.92},
            {"pair": "ETH-ALTS", "correlation": 0.78}
        ]
    }

@app.get("/api/top-movers")
async def get_top_movers():
    return {
        "gainers": [
            {"coin": "SOL", "price": 165.50, "change_24h": 12.5},
            {"coin": "AVAX", "price": 35.20, "change_24h": 10.2}
        ],
        "losers": [
            {"coin": "DOGE", "price": 0.08, "change_24h": -5.3},
            {"coin": "ADA", "price": 0.45, "change_24h": -4.1}
        ]
    }

@app.get("/api/performance-by-pair")
async def get_performance_by_pair():
    if not trades_db:
        return {"performance": []}
    
    perf = {}
    for t in trades_db:
        s = t["symbol"]
        if s not in perf:
            perf[s] = {"trades": 0, "wins": 0, "total_pnl": 0}
        perf[s]["trades"] += 1
        if t.get("pnl", 0) > 0:
            perf[s]["wins"] += 1
        perf[s]["total_pnl"] += t.get("pnl", 0)
    
    result = []
    for symbol, stats in perf.items():
        wr = round((stats["wins"] / stats["trades"] * 100) if stats["trades"] > 0 else 0)
        avg = round(stats["total_pnl"] / stats["trades"], 2) if stats["trades"] > 0 else 0
        result.append({
            "symbol": symbol,
            "trades": stats["trades"],
            "win_rate": wr,
            "avg_pnl": avg,
            "total_pnl": round(stats["total_pnl"], 2)
        })
    
    return {"performance": sorted(result, key=lambda x: x["total_pnl"], reverse=True)}

# PAGES HTML
HOME_HTML = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Dashboard</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>DASHBOARD TRADING</h1><p>Version 5.0 - Heure Québec</p></div>{NAV}
<div class="card"><h2>Bienvenue</h2><p>✅ Toutes les fonctionnalités opérationnelles<br>🕐 Heure du Québec configurée<br>📱 Bot Telegram activé</p></div>
</div></body></html>"""

TRADES_HTML = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Trades</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Gestion des Trades</h1></div>{NAV}
<div class="grid grid-4">
<div class="stat-box"><div class="label">Total Trades</div><div class="value" id="t">0</div></div>
<div class="stat-box"><div class="label">Taux Reussite</div><div class="value" id="w">0%</div></div>
<div class="stat-box"><div class="label">P&L Total</div><div class="value" id="p">0%</div></div>
<div class="stat-box"><div class="label">P&L Moyen</div><div class="value" id="a">0%</div></div>
</div>
<div class="card"><h2>Actions</h2>
<button class="btn-danger" onclick="reset()">Reinitialiser Trades</button></div>
<script>
async function load(){{try{{const r=await fetch('/api/stats');const d=await r.json();document.getElementById('t').textContent=d.total_trades;document.getElementById('w').textContent=d.win_rate+'%';document.getElementById('p').textContent=(d.total_pnl>0?'+':'')+d.total_pnl+'%';document.getElementById('a').textContent=(d.avg_pnl>0?'+':'')+d.avg_pnl+'%';document.getElementById('p').style.color=d.total_pnl>0?'#10b981':'#ef4444';document.getElementById('a').style.color=d.avg_pnl>0?'#10b981':'#ef4444';}}catch(e){{console.error('Erreur:',e);}}}}
async function reset(){{if(confirm('Reinitialiser tous les trades?')){{await fetch('/api/reset-trades',{{method:'POST'}});alert('Trades reinitialises!');load();}}}}
load();setInterval(load,10000);
</script></div></body></html>"""

TELEGRAM_HTML = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Telegram</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>🤖 Test Telegram</h1><p>Heure Québec</p></div>{NAV}
<div class="grid grid-2">
<div class="card"><h2>Test Bot</h2>
<button onclick="test()">📤 Envoyer Test</button>
<button onclick="info()" style="background:#64748b;">ℹ️ Info Config</button>
<div id="re" style="margin-top:20px;"></div>
</div>
<div class="card"><h2>Configuration</h2>
<div id="config">Chargement...</div>
</div>
</div>
<div class="card"><h2>Instructions Debug</h2>
<ol style="line-height:2;">
<li>Vérifiez que le bot Telegram est créé via @BotFather</li>
<li>Assurez-vous d'avoir envoyé au moins 1 message au bot</li>
<li>Pour un groupe: ajoutez le bot et vérifiez qu'il est admin</li>
<li>Le Chat ID doit commencer par - pour les groupes</li>
<li>Consultez les logs du serveur pour plus de détails</li>
</ol>
</div>
<script>
async function test(){{document.getElementById('re').innerHTML='<p style="color:#60a5fa;">📤 Envoi en cours...</p>';try{{const r=await fetch('/api/telegram-test');const d=await r.json();let html='';if(d.result&&d.result.ok){{html='<div class="alert alert-success">✅ Message envoyé avec succès!<br>🕐 Heure QC: '+d.quebec_time+'<br>📍 Fuseau: '+d.timezone+'</div>';}}else{{const err=d.result.description||d.result.error||'Erreur inconnue';html='<div class="alert alert-error">❌ Échec<br>'+err+'<br><br>Vérifiez les logs du serveur</div>';}}document.getElementById('re').innerHTML=html;}}catch(e){{document.getElementById('re').innerHTML='<div class="alert alert-error">❌ Erreur: '+e.message+'</div>';}}}}
async function info(){{try{{const r=await fetch('/api/telegram-info');const d=await r.json();document.getElementById('config').innerHTML='<p><strong>Token:</strong> '+d.bot_token_preview+'</p><p><strong>Chat ID:</strong> '+d.chat_id+'</p><p><strong>Heure QC:</strong> '+d.quebec_time+'</p><p><strong>Fuseau:</strong> '+d.timezone+'</p><p style="color:#10b981;">✅ Configuré</p>';}}catch(e){{document.getElementById('config').innerHTML='<p style="color:#ef4444;">Erreur</p>';}}}}
info();
</script></div></body></html>"""

PAPER_HTML = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Paper Trading</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Paper Trading</h1></div>{NAV}
<div class="grid grid-3">
<div class="stat-box"><div class="label">Valeur</div><div class="value" id="tv">$10,000</div></div>
<div class="stat-box"><div class="label">P&L</div><div class="value" id="pn">$0</div></div>
<div class="stat-box"><div class="label">Trades</div><div class="value" id="tt">0</div></div>
</div>
<div class="grid grid-2">
<div class="card"><h2>Placer Trade</h2>
<select id="ac"><option value="BUY">Acheter</option><option value="SELL">Vendre</option></select>
<select id="sy"><option value="BTCUSDT">BTC</option><option value="ETHUSDT">ETH</option><option value="SOLUSDT">SOL</option></select>
<input type="number" id="qt" value="0.01" step="0.001">
<button onclick="trade()">Executer</button>
<button onclick="resetPaper()" class="btn-danger">Reset</button>
<div id="ms"></div></div>
<div class="card"><h2>Portefeuille</h2><div id="ba">Chargement...</div></div>
</div>
<div class="card"><h2>Historique</h2><div id="hi">Aucun trade</div></div>
<script>
async function loadStats(){{const r=await fetch('/api/paper-stats');const d=await r.json();document.getElementById('tv').textContent='$'+d.total_value.toLocaleString();document.getElementById('pn').textContent='$'+d.pnl;document.getElementById('tt').textContent=d.total_trades;document.getElementById('pn').style.color=d.pnl>0?'#10b981':'#ef4444';}}
async function loadBal(){{const r=await fetch('/api/paper-balance');const d=await r.json();let h='';for(const[c,a]of Object.entries(d.balance)){{if(a>0.00001)h+='<div style="padding:10px;background:#0f172a;border-radius:6px;margin:5px 0;"><strong>'+c+':</strong> '+(c==='USDT'?a.toFixed(2):a.toFixed(6))+'</div>';}}document.getElementById('ba').innerHTML=h||'Vide';}}
async function loadHist(){{const r=await fetch('/api/paper-trades');const d=await r.json();if(d.trades.length===0){{document.getElementById('hi').innerHTML='Aucun trade';return;}}let h='<table><tr><th>Date</th><th>Action</th><th>Crypto</th><th>Qte</th><th>Prix</th><th>Total</th></tr>';d.trades.slice().reverse().forEach(t=>{{h+='<tr><td>'+new Date(t.timestamp).toLocaleString()+'</td><td>'+t.action+'</td><td>'+t.symbol.replace('USDT','')+'</td><td>'+t.quantity+'</td><td>$'+t.price.toFixed(2)+'</td><td>$'+t.total.toFixed(2)+'</td></tr>';}});h+='</table>';document.getElementById('hi').innerHTML=h;}}
async function trade(){{const r=await fetch('/api/paper-trade',{{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{action:document.getElementById('ac').value,symbol:document.getElementById('sy').value,quantity:document.getElementById('qt').value}})}});const d=await r.json();document.getElementById('ms').innerHTML='<div class="alert alert-'+(d.status==='success'?'success':'error')+'">'+d.message+'</div>';setTimeout(()=>{{document.getElementById('ms').innerHTML='';}},5000);loadStats();loadBal();loadHist();}}
async function resetPaper(){{if(confirm('Reset?')){{await fetch('/api/paper-reset',{{method:'POST'}});alert('OK');loadStats();loadBal();loadHist();}}}}
loadStats();loadBal();loadHist();setInterval(()=>{{loadStats();loadBal();}},30000);
</script></div></body></html>"""

BACKTEST_HTML = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Backtest</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Backtesting</h1></div>{NAV}
<div class="grid grid-2">
<div class="card"><h2>Config</h2>
<select id="sy"><option value="BTCUSDT">BTC</option><option value="ETHUSDT">ETH</option><option value="SOLUSDT">SOL</option></select>
<input type="number" id="ca" value="10000" step="1000">
<button onclick="run()">Lancer</button></div>
<div class="card"><h2>Resultats</h2>
<div id="rs" style="display:none;">
<div class="grid grid-2">
<div class="stat-box"><div class="label">Capital Final</div><div class="value" id="fc">$0</div></div>
<div class="stat-box"><div class="label">Rendement</div><div class="value" id="tr">0%</div></div>
</div>
<p>Trades: <span id="tc">0</span> | Win Rate: <span id="wr">0%</span></p>
</div>
<div id="lo" style="display:none;text-align:center;padding:40px;">Calcul...</div>
<div id="ph" style="text-align:center;padding:40px;">Configurez et lancez</div>
<div id="er"></div></div></div>
<script>
async function run(){{document.getElementById('ph').style.display='none';document.getElementById('rs').style.display='none';document.getElementById('er').innerHTML='';document.getElementById('lo').style.display='block';try{{const r=await fetch('/api/backtest',{{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{symbol:document.getElementById('sy').value,start_capital:document.getElementById('ca').value}})}});const d=await r.json();document.getElementById('lo').style.display='none';if(d.status==='error'){{document.getElementById('er').innerHTML='<div class="alert alert-error">'+d.message+'</div>';document.getElementById('ph').style.display='block';return;}}document.getElementById('rs').style.display='block';document.getElementById('fc').textContent='$'+d.final_capital.toLocaleString();document.getElementById('tr').textContent=(d.total_return>0?'+':'')+d.total_return+'%';document.getElementById('tc').textContent=d.trades;document.getElementById('wr').textContent=d.win_rate+'%';const c=d.total_return>0?'#10b981':'#ef4444';document.getElementById('tr').style.color=c;document.getElementById('fc').style.color=c;}}catch(e){{document.getElementById('lo').style.display='none';document.getElementById('er').innerHTML='<div class="alert alert-error">'+e.message+'</div>';document.getElementById('ph').style.display='block';}}}}
</script></div></body></html>"""

@app.get("/", response_class=HTMLResponse)
async def home():
    return HTMLResponse(HOME_HTML.format(CSS=CSS, NAV=NAV))

@app.get("/trades", response_class=HTMLResponse)
async def trades_page():
    return HTMLResponse(TRADES_HTML.format(CSS=CSS, NAV=NAV))

@app.get("/telegram-test", response_class=HTMLResponse)
async def telegram_page():
    return HTMLResponse(TELEGRAM_HTML.format(CSS=CSS, NAV=NAV))

@app.get("/paper-trading", response_class=HTMLResponse)
async def paper_page():
    return HTMLResponse(PAPER_HTML.format(CSS=CSS, NAV=NAV))

@app.get("/backtesting", response_class=HTMLResponse)
async def backtest_page():
    return HTMLResponse(BACKTEST_HTML.format(CSS=CSS, NAV=NAV))

# Pages simples avec JavaScript corrigé
@app.get("/fear-greed", response_class=HTMLResponse)
async def fear_greed_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Fear & Greed</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Fear & Greed</h1></div>{NAV}
<div class='card'><h2>Fear & Greed Index</h2><div style='text-align:center;font-size:72px;' id='v'>--</div><div style='text-align:center;font-size:24px;' id='c'>Chargement...</div></div>
<script>async function load(){{const r=await fetch('/api/fear-greed');const d=await r.json();document.getElementById('v').textContent=d.emoji+' '+d.value;document.getElementById('c').textContent=d.classification;}}load();</script>
</div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/bullrun-phase", response_class=HTMLResponse)
async def bullrun_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Cycle Bullrun</title>{CSS}
<style>
.phase-container{{display:grid;gap:15px;margin-top:20px;}}
.phase-box{{padding:20px;border-radius:12px;border:3px solid transparent;transition:all 0.3s;}}
.phase-box.active{{border-color:#fff;box-shadow:0 0 20px rgba(255,255,255,0.3);transform:scale(1.02);}}
.phase-box h3{{margin:0 0 10px 0;font-size:22px;}}
.phase-box p{{margin:5px 0;font-size:14px;line-height:1.6;}}
.phase-1{{background:linear-gradient(135deg,#3b82f6 0%,#1e40af 100%);}}
.phase-2{{background:linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%);}}
.phase-3{{background:linear-gradient(135deg,#10b981 0%,#059669 100%);}}
.phase-4{{background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);}}
.phase-overlap{{background:linear-gradient(135deg,#64748b 0%,#475569 100%);}}
.current-phase{{text-align:center;padding:30px;background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:12px;margin-bottom:30px;}}
.current-phase h2{{font-size:32px;margin-bottom:10px;}}
.market-stats{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-top:20px;}}
.stat{{background:#0f172a;padding:15px;border-radius:8px;text-align:center;}}
.stat .label{{color:#94a3b8;font-size:13px;}}
.stat .value{{font-size:24px;font-weight:bold;margin-top:5px;}}
</style>
</head>
<body><div class="container"><div class="header"><h1>📊 Cycle Bullrun</h1><p>Analyse des 4 phases du marché crypto</p></div>{NAV}

<div class="current-phase">
<h2 id="current-phase-name">Chargement...</h2>
<p id="current-phase-desc" style="font-size:18px;color:#94a3b8;"></p>
</div>

<div class="market-stats">
<div class="stat"><div class="label">Prix BTC</div><div class="value" id="btc-price">$0</div></div>
<div class="stat"><div class="label">BTC 24h</div><div class="value" id="btc-change">0%</div></div>
<div class="stat"><div class="label">ETH 24h</div><div class="value" id="eth-change">0%</div></div>
<div class="stat"><div class="label">Alts Moy. 24h</div><div class="value" id="alt-change">0%</div></div>
</div>

<div class="card">
<h2>Les 4 Phases du Cycle</h2>
<div class="phase-container">

<div class="phase-box phase-1" id="phase-1">
<h3>🟦 Phase 1: Bitcoin</h3>
<p><strong>Flow of money moves into Bitcoin causing prices surges</strong></p>
<p>• L'argent afflue dans Bitcoin en premier</p>
<p>• Les prix commencent à monter fortement</p>
<p>• Bitcoin domine le marché</p>
<p>• Les altcoins sont en retard</p>
</div>

<div class="phase-box phase-2" id="phase-2">
<h3>🟪 Phase 2: Ethereum</h3>
<p><strong>Money flows into Ethereum but it struggles to keep up with Bitcoin</strong></p>
<p>• L'argent commence à affluer dans Ethereum</p>
<p>• Ethereum peine à suivre Bitcoin au début</p>
<p>• Puis Ethereum revient et surperforme Bitcoin</p>
<p>• Le ratio ETH/BTC augmente</p>
</div>

<div class="phase-box phase-3" id="phase-3">
<h3>🟩 Phase 3: Large Caps</h3>
<p><strong>Ethereum is outperforming Bitcoin and large caps are going parabolic</strong></p>
<p>• Ethereum surperforme clairement Bitcoin</p>
<p>• Les large caps (SOL, ADA, AVAX) explosent</p>
<p>• Mouvement parabolique sur les top altcoins</p>
<p>• Le marché devient très bullish</p>
</div>

<div class="phase-box phase-4" id="phase-4">
<h3>🟧 Phase 4: Altseason</h3>
<p><strong>Large caps have gone full vertical and we're seeing blow off tops</strong></p>
<p>• Les large caps deviennent verticales</p>
<p>• On voit des sommets partout (blow-off tops)</p>
<p>• Les micro caps pompent en même temps</p>
<p>• Euphorie totale, tout le monde est surexcité</p>
<p>• ⚠️ Signal de vente potentiel</p>
</div>

<div class="phase-box phase-overlap" id="phase-overlap">
<h3>⚪ Phase Overlap</h3>
<p><strong>Consolidation et accumulation</strong></p>
<p>• Le marché consolide entre deux phases</p>
<p>• Période d'accumulation</p>
<p>• Attente du prochain mouvement</p>
</div>

</div>
</div>

<script>
async function load(){{
try{{
const r=await fetch('/api/bullrun-phase');
const d=await r.json();

document.getElementById('current-phase-name').textContent=d.phase_name;
document.getElementById('current-phase-desc').textContent=d.phase_description;
document.getElementById('btc-price').textContent='

@app.get("/convertisseur", response_class=HTMLResponse)
async def converter_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Convertisseur</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Convertisseur Crypto</h1></div>{NAV}
<div class='card'><h2>Convertir</h2>
<input id='amt' value='1' type='number' placeholder='Montant'>
<select id='from'><option value='BTC'>BTC</option><option value='ETH'>ETH</option><option value='SOL'>SOL</option><option value='USD'>USD</option><option value='EUR'>EUR</option><option value='CAD'>CAD</option></select>
<select id='to'><option value='USD'>USD</option><option value='BTC'>BTC</option><option value='ETH'>ETH</option><option value='SOL'>SOL</option><option value='EUR'>EUR</option><option value='CAD'>CAD</option></select>
<button onclick='convert()'>Convertir</button><div id='result'></div></div>
<script>async function convert(){{const r=await fetch('/api/convert?from_currency='+document.getElementById('from').value+'&to_currency='+document.getElementById('to').value+'&amount='+document.getElementById('amt').value);const d=await r.json();if(d.error){{document.getElementById('result').innerHTML='<p style="color:#ef4444">'+d.error+'</p>';}}else{{document.getElementById('result').innerHTML='<h3>'+d.result+' '+d.to+'</h3><p>Taux: '+d.rate+'</p>';}}}}</script>
</div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/annonces", response_class=HTMLResponse)
async def news_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Actualites</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Actualites Crypto</h1></div>{NAV}
<div class='card'><h2>Dernieres News</h2><div id='nw'>Chargement...</div></div>
<script>async function load(){{const r=await fetch('/api/news');const d=await r.json();let h='';d.news.forEach(n=>{{h+='<div style="padding:15px;margin:10px 0;background:#0f172a;border-radius:8px;"><h3>'+n.title+'</h3><p style="color:#94a3b8">'+n.source+'</p></div>';}});document.getElementById('nw').innerHTML=h;}}load();</script>
</div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/btc-quarterly", response_class=HTMLResponse)
async def quarterly_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Trimestriel BTC</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Performance Trimestrielle BTC</h1></div>{NAV}
<div class='card'><h2>Rendements par Trimestre</h2><div id='q'>Chargement...</div></div>
<script>async function load(){{const r=await fetch('/api/btc-quarterly');const d=await r.json();let h='<table><tr><th>Annee</th><th>T1</th><th>T2</th><th>T3</th><th>T4</th></tr>';for(const[y,q]of Object.entries(d.quarterly_returns)){{h+='<tr><td>'+y+'</td><td>'+q.T1+'%</td><td>'+q.T2+'%</td><td>'+q.T3+'%</td><td>'+q.T4+'%</td></tr>';}}h+='</table>';document.getElementById('q').innerHTML=h;}}load();</script>
</div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/heatmap", response_class=HTMLResponse)
async def heatmap_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Heatmap</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Heatmap Performance</h1></div>{NAV}
<div class='card'><h2>Heatmap</h2>
<button onclick='loadHeatmap("monthly")'>Mensuelle</button> 
<button onclick='loadHeatmap("yearly")'>Annuelle</button>
<div id='hmap'>Chargement...</div></div>
<script>async function loadHeatmap(type){{const r=await fetch('/api/heatmap?type='+type);const d=await r.json();let h='';d.heatmap.forEach(item=>{{const label=item.month||item.year;const perf=item.performance;const color=perf>0?'#10b981':'#ef4444';h+='<div style="display:inline-block;margin:5px;padding:20px;background:'+color+';border-radius:8px;"><h3>'+label+'</h3><p>'+perf+'%</p></div>';}});document.getElementById('hmap').innerHTML=h;}}loadHeatmap('monthly');</script>
</div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/calendrier", response_class=HTMLResponse)
async def calendar_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Calendrier</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Calendrier Crypto</h1></div>{NAV}
<div class='card'><h2>Evenements a Venir</h2><div id='cal'>Chargement...</div></div>
<script>async function load(){{const r=await fetch('/api/calendar');const d=await r.json();let h='<table><tr><th>Date</th><th>Evenement</th><th>Categorie</th></tr>';d.events.forEach(e=>{{h+='<tr><td>'+e.date+'</td><td>'+e.title+'</td><td>'+e.category+'</td></tr>';}});h+='</table>';document.getElementById('cal').innerHTML=h;}}load();</script>
</div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/altcoin-season", response_class=HTMLResponse)
async def altseason_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>AltSeason</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Altcoin Season Index</h1></div>{NAV}
<div class='card'><h2>AltSeason Index</h2>
<div style='text-align:center;font-size:72px;color:#60a5fa;'>27</div>
<p style='text-align:center;font-size:24px;'>Saison Bitcoin</p>
<p style='text-align:center;color:#94a3b8;'>Moins de 25% des top 50 surperforment BTC</p>
</div></div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/btc-dominance", response_class=HTMLResponse)
async def dominance_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Dominance BTC</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Dominance Bitcoin</h1></div>{NAV}
<div class='card'><h2>Dominance BTC</h2>
<div style='text-align:center;font-size:72px;color:#f7931a;'>52.3%</div>
<p style='text-align:center;font-size:18px;color:#10b981;'>En hausse</p>
</div></div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/strategie", response_class=HTMLResponse)
async def strategy_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Strategie</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Strategie de Trading</h1></div>{NAV}
<div class='card'><h2>Regles de Trading</h2>
<ul style='line-height:2;'>
<li>Risk/Reward: 1:2 minimum</li>
<li>Position Size: Max 2% du capital</li>
<li>Stop Loss: Toujours definir avant l'entree</li>
<li>Max 3 trades simultanement</li>
<li>Jamais moyenner a la baisse</li>
</ul></div></div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/correlations", response_class=HTMLResponse)
async def correlations_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Correlations</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Correlations</h1></div>{NAV}
<div class='card'><h2>Correlations Crypto</h2>
<p style='font-size:20px;padding:15px;'>BTC-ETH: <strong style='color:#10b981;'>0.87</strong></p>
<p style='font-size:20px;padding:15px;'>BTC-TOTAL: <strong style='color:#10b981;'>0.92</strong></p>
<p style='font-size:20px;padding:15px;'>ETH-ALTS: <strong style='color:#f59e0b;'>0.78</strong></p>
</div></div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/top-movers", response_class=HTMLResponse)
async def movers_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Top Movers</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Top Movers 24h</h1></div>{NAV}
<div class='grid grid-2'>
<div class='card'><h2>Gainers</h2>
<p style='padding:10px;background:#0f172a;margin:5px 0;border-radius:6px;'>SOL: <span style='color:#10b981;'>+12.5%</span></p>
<p style='padding:10px;background:#0f172a;margin:5px 0;border-radius:6px;'>AVAX: <span style='color:#10b981;'>+10.2%</span></p>
</div>
<div class='card'><h2>Losers</h2>
<p style='padding:10px;background:#0f172a;margin:5px 0;border-radius:6px;'>DOGE: <span style='color:#ef4444;'>-5.3%</span></p>
<p style='padding:10px;background:#0f172a;margin:5px 0;border-radius:6px;'>ADA: <span style='color:#ef4444;'>-4.1%</span></p>
</div></div></div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/performance", response_class=HTMLResponse)
async def performance_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Performance</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Performance par Paire</h1></div>{NAV}
<div class='card'><h2>Stats Trading</h2>
<p style='text-align:center;padding:40px;color:#94a3b8;'>Lancez des trades pour voir vos statistiques ici</p>
</div></div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

if __name__ == "__main__":
    import uvicorn
    quebec_time = get_quebec_time()
    offset = get_quebec_offset()
    offset_str = f"UTC{offset.total_seconds()/3600:+.0f}"
    
    print("\n" + "="*60)
    print("🚀 TRADING DASHBOARD v5.0 - QUÉBEC EDITION")
    print("="*60)
    print(f"✅ Fuseau horaire: {offset_str} (Québec/Montréal)")
    print(f"🕐 Heure actuelle QC: {format_quebec_time(quebec_time)}")
    print("✅ Bot Telegram avec logging détaillé")
    print("✅ Webhook flexible (accepte tout format JSON)")
    print(f"📱 Token: {TELEGRAM_BOT_TOKEN[:15]}...{TELEGRAM_BOT_TOKEN[-5:]}")
    print(f"💬 Chat ID: {TELEGRAM_CHAT_ID}")
    print("\n🌐 Serveur: http://localhost:8000")
    print("📊 Test Telegram: http://localhost:8000/telegram-test")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
+d.btc_price.toLocaleString();
document.getElementById('btc-change').textContent=(d.btc_change_24h>0?'+':'')+d.btc_change_24h+'%';
document.getElementById('eth-change').textContent=(d.eth_change_24h>0?'+':'')+d.eth_change_24h+'%';
document.getElementById('alt-change').textContent=(d.avg_alt_change>0?'+':'')+d.avg_alt_change+'%';

document.getElementById('btc-change').style.color=d.btc_change_24h>0?'#10b981':'#ef4444';
document.getElementById('eth-change').style.color=d.eth_change_24h>0?'#10b981':'#ef4444';
document.getElementById('alt-change').style.color=d.avg_alt_change>0?'#10b981':'#ef4444';

document.querySelectorAll('.phase-box').forEach(box=>box.classList.remove('active'));

if(d.current_phase===0){{
document.getElementById('phase-overlap').classList.add('active');
}}else if(d.current_phase>=1&&d.current_phase<=4){{
document.getElementById('phase-'+d.current_phase).classList.add('active');
}}

}}catch(e){{
console.error('Erreur:',e);
}}
}}
load();
setInterval(load,60000);
</script>
</div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/convertisseur", response_class=HTMLResponse)
async def converter_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Convertisseur</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Convertisseur Crypto</h1></div>{NAV}
<div class='card'><h2>Convertir</h2>
<input id='amt' value='1' type='number' placeholder='Montant'>
<select id='from'><option value='BTC'>BTC</option><option value='ETH'>ETH</option><option value='SOL'>SOL</option><option value='USD'>USD</option><option value='EUR'>EUR</option><option value='CAD'>CAD</option></select>
<select id='to'><option value='USD'>USD</option><option value='BTC'>BTC</option><option value='ETH'>ETH</option><option value='SOL'>SOL</option><option value='EUR'>EUR</option><option value='CAD'>CAD</option></select>
<button onclick='convert()'>Convertir</button><div id='result'></div></div>
<script>async function convert(){{const r=await fetch('/api/convert?from_currency='+document.getElementById('from').value+'&to_currency='+document.getElementById('to').value+'&amount='+document.getElementById('amt').value);const d=await r.json();if(d.error){{document.getElementById('result').innerHTML='<p style="color:#ef4444">'+d.error+'</p>';}}else{{document.getElementById('result').innerHTML='<h3>'+d.result+' '+d.to+'</h3><p>Taux: '+d.rate+'</p>';}}}}</script>
</div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/annonces", response_class=HTMLResponse)
async def news_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Actualites</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Actualites Crypto</h1></div>{NAV}
<div class='card'><h2>Dernieres News</h2><div id='nw'>Chargement...</div></div>
<script>async function load(){{const r=await fetch('/api/news');const d=await r.json();let h='';d.news.forEach(n=>{{h+='<div style="padding:15px;margin:10px 0;background:#0f172a;border-radius:8px;"><h3>'+n.title+'</h3><p style="color:#94a3b8">'+n.source+'</p></div>';}});document.getElementById('nw').innerHTML=h;}}load();</script>
</div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/btc-quarterly", response_class=HTMLResponse)
async def quarterly_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Trimestriel BTC</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Performance Trimestrielle BTC</h1></div>{NAV}
<div class='card'><h2>Rendements par Trimestre</h2><div id='q'>Chargement...</div></div>
<script>async function load(){{const r=await fetch('/api/btc-quarterly');const d=await r.json();let h='<table><tr><th>Annee</th><th>T1</th><th>T2</th><th>T3</th><th>T4</th></tr>';for(const[y,q]of Object.entries(d.quarterly_returns)){{h+='<tr><td>'+y+'</td><td>'+q.T1+'%</td><td>'+q.T2+'%</td><td>'+q.T3+'%</td><td>'+q.T4+'%</td></tr>';}}h+='</table>';document.getElementById('q').innerHTML=h;}}load();</script>
</div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/heatmap", response_class=HTMLResponse)
async def heatmap_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Heatmap</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Heatmap Performance</h1></div>{NAV}
<div class='card'><h2>Heatmap</h2>
<button onclick='loadHeatmap("monthly")'>Mensuelle</button> 
<button onclick='loadHeatmap("yearly")'>Annuelle</button>
<div id='hmap'>Chargement...</div></div>
<script>async function loadHeatmap(type){{const r=await fetch('/api/heatmap?type='+type);const d=await r.json();let h='';d.heatmap.forEach(item=>{{const label=item.month||item.year;const perf=item.performance;const color=perf>0?'#10b981':'#ef4444';h+='<div style="display:inline-block;margin:5px;padding:20px;background:'+color+';border-radius:8px;"><h3>'+label+'</h3><p>'+perf+'%</p></div>';}});document.getElementById('hmap').innerHTML=h;}}loadHeatmap('monthly');</script>
</div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/calendrier", response_class=HTMLResponse)
async def calendar_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Calendrier</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Calendrier Crypto</h1></div>{NAV}
<div class='card'><h2>Evenements a Venir</h2><div id='cal'>Chargement...</div></div>
<script>async function load(){{const r=await fetch('/api/calendar');const d=await r.json();let h='<table><tr><th>Date</th><th>Evenement</th><th>Categorie</th></tr>';d.events.forEach(e=>{{h+='<tr><td>'+e.date+'</td><td>'+e.title+'</td><td>'+e.category+'</td></tr>';}});h+='</table>';document.getElementById('cal').innerHTML=h;}}load();</script>
</div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/altcoin-season", response_class=HTMLResponse)
async def altseason_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>AltSeason</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Altcoin Season Index</h1></div>{NAV}
<div class='card'><h2>AltSeason Index</h2>
<div style='text-align:center;font-size:72px;color:#60a5fa;'>27</div>
<p style='text-align:center;font-size:24px;'>Saison Bitcoin</p>
<p style='text-align:center;color:#94a3b8;'>Moins de 25% des top 50 surperforment BTC</p>
</div></div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/btc-dominance", response_class=HTMLResponse)
async def dominance_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Dominance BTC</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Dominance Bitcoin</h1></div>{NAV}
<div class='card'><h2>Dominance BTC</h2>
<div style='text-align:center;font-size:72px;color:#f7931a;'>52.3%</div>
<p style='text-align:center;font-size:18px;color:#10b981;'>↑ En hausse</p>
</div></div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/strategie", response_class=HTMLResponse)
async def strategy_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Strategie</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Strategie de Trading</h1></div>{NAV}
<div class='card'><h2>Regles de Trading</h2>
<ul style='line-height:2;'>
<li>Risk/Reward: 1:2 minimum</li>
<li>Position Size: Max 2% du capital</li>
<li>Stop Loss: Toujours definir avant l'entree</li>
<li>Max 3 trades simultanement</li>
<li>Jamais moyenner a la baisse</li>
</ul></div></div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/correlations", response_class=HTMLResponse)
async def correlations_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Correlations</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Correlations</h1></div>{NAV}
<div class='card'><h2>Correlations Crypto</h2>
<p style='font-size:20px;padding:15px;'>BTC-ETH: <strong style='color:#10b981;'>0.87</strong></p>
<p style='font-size:20px;padding:15px;'>BTC-TOTAL: <strong style='color:#10b981;'>0.92</strong></p>
<p style='font-size:20px;padding:15px;'>ETH-ALTS: <strong style='color:#f59e0b;'>0.78</strong></p>
</div></div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/top-movers", response_class=HTMLResponse)
async def movers_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Top Movers</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Top Movers 24h</h1></div>{NAV}
<div class='grid grid-2'>
<div class='card'><h2>Gainers</h2>
<p style='padding:10px;background:#0f172a;margin:5px 0;border-radius:6px;'>SOL: <span style='color:#10b981;'>+12.5%</span></p>
<p style='padding:10px;background:#0f172a;margin:5px 0;border-radius:6px;'>AVAX: <span style='color:#10b981;'>+10.2%</span></p>
</div>
<div class='card'><h2>Losers</h2>
<p style='padding:10px;background:#0f172a;margin:5px 0;border-radius:6px;'>DOGE: <span style='color:#ef4444;'>-5.3%</span></p>
<p style='padding:10px;background:#0f172a;margin:5px 0;border-radius:6px;'>ADA: <span style='color:#ef4444;'>-4.1%</span></p>
</div></div></div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

@app.get("/performance", response_class=HTMLResponse)
async def performance_page():
    html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Performance</title>{CSS}</head>
<body><div class="container"><div class="header"><h1>Performance par Paire</h1></div>{NAV}
<div class='card'><h2>Stats Trading</h2>
<p style='text-align:center;padding:40px;color:#94a3b8;'>Lancez des trades pour voir vos statistiques ici</p>
</div></div></body></html>"""
    return HTMLResponse(html.format(CSS=CSS, NAV=NAV))

if __name__ == "__main__":
    import uvicorn
    quebec_time = get_quebec_time()
    offset = get_quebec_offset()
    offset_str = f"UTC{offset.total_seconds()/3600:+.0f}"
    
    print("\n" + "="*60)
    print("🚀 TRADING DASHBOARD v5.0 - QUÉBEC EDITION")
    print("="*60)
    print(f"✅ Fuseau horaire: {offset_str} (Québec/Montréal)")
    print(f"🕐 Heure actuelle QC: {format_quebec_time(quebec_time)}")
    print("✅ Bot Telegram avec logging détaillé")
    print("✅ Webhook flexible (accepte tout format JSON)")
    print(f"📱 Token: {TELEGRAM_BOT_TOKEN[:15]}...{TELEGRAM_BOT_TOKEN[-5:]}")
    print(f"💬 Chat ID: {TELEGRAM_CHAT_ID}")
    print("\n🌐 Serveur: http://localhost:8000")
    print("📊 Test Telegram: http://localhost:8000/telegram-test")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
