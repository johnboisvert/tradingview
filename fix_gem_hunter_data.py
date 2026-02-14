#!/usr/bin/env python3
"""
Corriger le format des données pour AI Gem Hunter et AI Technical Analysis
L'API CoinGecko trending renvoie: {"coins": [{"item": {...}}, ...]}
Il faut extraire les données de "item" et enrichir avec les prix
"""

import re

def get_fixed_gem_hunter_route():
    """Route corrigée pour AI Gem Hunter avec bon format de données"""
    return '''
@app.get("/ai-gem-hunter", response_class=HTMLResponse)
async def ai_gem_hunter_page(request: Request):
    """AI Gem Hunter - Découverte de Pépites"""
    try:
        SID = globals().get("SIDEBAR_HTML") or globals().get("SIDEBAR_FULL") or globals().get("SIDEBAR") or ""
        
        trending_coins = []
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                # 1. Récupérer les trending coins
                async with session.get("https://api.coingecko.com/api/v3/search/trending", timeout=10) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        raw_coins = data.get("coins", [])[:12]
                        
                        # Extraire les IDs pour récupérer les prix
                        coin_ids = []
                        for c in raw_coins:
                            item = c.get("item", {})
                            if item.get("id"):
                                coin_ids.append(item["id"])
                        
                        # 2. Récupérer les prix et market data
                        prices_data = {}
                        if coin_ids:
                            ids_str = ",".join(coin_ids[:10])
                            price_url = f"https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids={ids_str}&order=market_cap_desc"
                            async with session.get(price_url, timeout=10) as price_resp:
                                if price_resp.status == 200:
                                    prices_list = await price_resp.json()
                                    for p in prices_list:
                                        prices_data[p.get("id")] = p
                        
                        # 3. Combiner les données
                        for c in raw_coins:
                            item = c.get("item", {})
                            coin_id = item.get("id", "")
                            price_info = prices_data.get(coin_id, {})
                            
                            # Extraire le prix depuis data.price si disponible
                            item_data = item.get("data", {})
                            price_str = item_data.get("price", "0")
                            try:
                                # Nettoyer le prix (enlever $ et virgules)
                                price = float(str(price_str).replace("$", "").replace(",", "").strip()) if price_str else 0
                            except:
                                price = 0
                            
                            trending_coins.append({
                                "name": item.get("name", "Unknown"),
                                "symbol": item.get("symbol", "").upper(),
                                "current_price": price_info.get("current_price") or price,
                                "price_change_percentage_24h": price_info.get("price_change_percentage_24h") or item_data.get("price_change_percentage_24h", {}).get("usd", 0),
                                "market_cap": price_info.get("market_cap") or 0,
                                "total_volume": price_info.get("total_volume") or 0,
                                "market_cap_rank": item.get("market_cap_rank") or price_info.get("market_cap_rank") or 999,
                                "thumb": item.get("thumb", ""),
                                "score": item.get("score", 0)
                            })
        except Exception as e:
            print(f"Erreur gem hunter: {e}")
            # Fallback avec données statiques
            trending_coins = [
                {"name": "Bitcoin", "symbol": "BTC", "current_price": 97000, "price_change_percentage_24h": 2.5, "market_cap": 1900000000000, "total_volume": 50000000000},
                {"name": "Ethereum", "symbol": "ETH", "current_price": 2700, "price_change_percentage_24h": 1.8, "market_cap": 320000000000, "total_volume": 20000000000},
                {"name": "Solana", "symbol": "SOL", "current_price": 195, "price_change_percentage_24h": 3.2, "market_cap": 95000000000, "total_volume": 5000000000},
            ]
        
        html = get_ai_gem_hunter_page(SID, trending_coins)
        return HTMLResponse(html)
    except Exception as e:
        return HTMLResponse(f"<h1>Erreur</h1><p>{e}</p>")
'''


def get_fixed_technical_analysis_route():
    """Route corrigée pour AI Technical Analysis"""
    return '''
@app.get("/ai-technical-analysis", response_class=HTMLResponse)
async def ai_technical_analysis_page(request: Request):
    """AI Technical Analysis - Analyse Technique Avancée"""
    try:
        SID = globals().get("SIDEBAR_HTML") or globals().get("SIDEBAR_FULL") or globals().get("SIDEBAR") or ""
        
        # Paramètres par défaut
        symbol = "BTCUSDT"
        interval = "1h"
        
        analysis_data = {
            "symbol": symbol,
            "interval": interval,
            "price": 0,
            "change_24h": 0,
            "rsi": 50,
            "macd": "neutral",
            "trend": "neutral",
            "support": 0,
            "resistance": 0,
            "recommendation": "HOLD"
        }
        
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                # Récupérer les données de prix via CoinGecko
                url = "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7"
                async with session.get(url, timeout=15) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        prices = [p[1] for p in data.get("prices", [])]
                        
                        if len(prices) >= 20:
                            last_price = prices[-1]
                            price_24h_ago = prices[-24] if len(prices) >= 24 else prices[0]
                            change_24h = ((last_price - price_24h_ago) / price_24h_ago * 100) if price_24h_ago else 0
                            
                            # Calculs techniques
                            sma20 = sum(prices[-20:]) / 20
                            sma50 = sum(prices[-50:]) / 50 if len(prices) >= 50 else sma20
                            
                            # RSI simplifié
                            gains, losses = [], []
                            for i in range(1, min(15, len(prices))):
                                change = prices[i] - prices[i-1]
                                gains.append(max(0, change))
                                losses.append(max(0, -change))
                            avg_gain = sum(gains) / len(gains) if gains else 0
                            avg_loss = sum(losses) / len(losses) if losses else 1
                            rs = avg_gain / avg_loss if avg_loss > 0 else 100
                            rsi = 100 - (100 / (1 + rs))
                            
                            # Support/Résistance
                            recent_low = min(prices[-48:]) if len(prices) >= 48 else min(prices)
                            recent_high = max(prices[-48:]) if len(prices) >= 48 else max(prices)
                            
                            # Tendance et recommandation
                            if sma20 > sma50 * 1.01:
                                trend = "bullish"
                                if rsi < 70:
                                    recommendation = "BUY"
                                else:
                                    recommendation = "HOLD"
                            elif sma20 < sma50 * 0.99:
                                trend = "bearish"
                                if rsi > 30:
                                    recommendation = "SELL"
                                else:
                                    recommendation = "HOLD"
                            else:
                                trend = "neutral"
                                recommendation = "HOLD"
                            
                            # MACD simplifié
                            ema12 = sum(prices[-12:]) / 12 if len(prices) >= 12 else last_price
                            ema26 = sum(prices[-26:]) / 26 if len(prices) >= 26 else last_price
                            macd_line = ema12 - ema26
                            macd = "bullish" if macd_line > 0 else "bearish" if macd_line < 0 else "neutral"
                            
                            analysis_data = {
                                "symbol": "BTC/USDT",
                                "interval": interval,
                                "price": last_price,
                                "change_24h": change_24h,
                                "rsi": rsi,
                                "macd": macd,
                                "trend": trend,
                                "support": recent_low,
                                "resistance": recent_high,
                                "recommendation": recommendation,
                                "sma20": sma20,
                                "sma50": sma50
                            }
        except Exception as e:
            print(f"Erreur technical analysis: {e}")
        
        html = get_ai_technical_analysis_page(SID, symbol, interval, analysis_data)
        return HTMLResponse(html)
    except Exception as e:
        return HTMLResponse(f"<h1>Erreur</h1><p>{e}</p>")
'''


def apply_fixes():
    """Applique les corrections aux routes"""
    with open('/workspace/tradingview-main/main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Remplacer la route AI Gem Hunter
    gem_route = get_fixed_gem_hunter_route()
    pattern_gem = r'@app\.get\("/ai-gem-hunter", response_class=HTMLResponse\)\nasync def ai_gem_hunter_page\(request: Request\):.*?(?=\n@app\.)'
    
    if re.search(pattern_gem, content, flags=re.DOTALL):
        content = re.sub(pattern_gem, gem_route.strip() + '\n\n', content, flags=re.DOTALL)
        print("✅ Route AI Gem Hunter corrigée")
    else:
        print("⚠️ Route AI Gem Hunter non trouvée")
    
    # 2. Remplacer la route AI Technical Analysis
    tech_route = get_fixed_technical_analysis_route()
    pattern_tech = r'@app\.get\("/ai-technical-analysis", response_class=HTMLResponse\)\nasync def ai_technical_analysis_page\(request: Request\):.*?(?=\n@app\.)'
    
    if re.search(pattern_tech, content, flags=re.DOTALL):
        content = re.sub(pattern_tech, tech_route.strip() + '\n\n', content, flags=re.DOTALL)
        print("✅ Route AI Technical Analysis corrigée")
    else:
        print("⚠️ Route AI Technical Analysis non trouvée")
    
    with open('/workspace/tradingview-main/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n🎉 Routes corrigées!")


if __name__ == "__main__":
    apply_fixes()
