"""
Script pour remplacer les routes AI existantes par les versions révolutionnaires V2
"""

import re

def replace_routes():
    print("🚀 Remplacement des routes AI par les versions révolutionnaires V2...")
    
    with open("main.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Backup
    with open("main.py.backup_before_v2", "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ Backup créé: main.py.backup_before_v2")
    
    # S'assurer que l'import est présent
    if "from revolutionary_ai_pages_v2 import" not in content:
        # Trouver un bon endroit pour l'import
        if "from fastapi import" in content:
            content = content.replace(
                "from fastapi import",
                "from revolutionary_ai_pages_v2 import *\nfrom fastapi import"
            )
        print("✅ Import ajouté")
    
    # Définir les nouvelles implémentations de routes
    new_ai_exit = '''
@app.get("/ai-exit", response_class=HTMLResponse)
async def ai_exit_page(request: Request):
    """AI Exit - Calculateur TP/SL Professionnel Révolutionnaire"""
    try:
        if not is_logged_in(request):
            return RedirectResponse(url="/login?redirect=%2Fai-exit", status_code=303)
        
        SID = globals().get("SIDEBAR_HTML") or globals().get("SIDEBAR_FULL") or globals().get("SIDEBAR") or ""
        q = dict(request.query_params)
        entry = q.get("entry", "")
        stop = q.get("stop", "")
        rr = q.get("rr", "2")
        direction = q.get("direction", "long")
        
        html = get_ai_exit_page(SID, entry, stop, rr, direction)
        return HTMLResponse(html)
    except Exception as e:
        return HTMLResponse(f"<h1>Erreur</h1><p>{e}</p>")
'''

    new_ai_timeframe = '''
@app.get("/ai-timeframe", response_class=HTMLResponse)
async def ai_timeframe(request: Request):
    """AI Timeframe - Recommandation Intelligente Révolutionnaire"""
    try:
        if not is_logged_in(request):
            return RedirectResponse(url="/login?redirect=%2Fai-timeframe", status_code=303)
        
        SID = globals().get("SIDEBAR_HTML") or globals().get("SIDEBAR_FULL") or globals().get("SIDEBAR") or ""
        
        import math
        btc_price = None
        btc_change = None
        volatility = None
        regime = "Normal"
        
        try:
            url = "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily"
            chart = await _fetch_json(url, ttl_seconds=180, use_coingecko_key=True)
            prices = chart.get("prices") if isinstance(chart, dict) else None
            
            returns = []
            if prices and isinstance(prices, list) and len(prices) > 5:
                for i in range(1, len(prices)):
                    p0 = float(prices[i-1][1])
                    p1 = float(prices[i][1])
                    if p0 > 0:
                        returns.append(math.log(p1/p0))
            
            if returns and len(returns) > 1:
                mean_return = sum(returns) / len(returns)
                variance = sum((x - mean_return)**2 for x in returns) / len(returns)
                volatility = (variance ** 0.5) * math.sqrt(365)
            
            mk = _coingecko_markets_top50()
            btc_row = next((r for r in (mk if isinstance(mk, list) else []) if r.get("id") == "bitcoin" or r.get("symbol") == "btc"), None)
            if btc_row:
                btc_price = btc_row.get("current_price")
                btc_change = btc_row.get("price_change_percentage_24h")
            
            if volatility is not None:
                if volatility >= 0.95:
                    regime = "Volatilité très élevée"
                elif volatility >= 0.70:
                    regime = "Volatilité élevée"
                elif volatility <= 0.45:
                    regime = "Volatilité faible"
        except Exception as e:
            print(f"Erreur données timeframe: {e}")
        
        html = get_ai_timeframe_page(SID, btc_price, btc_change, volatility, regime)
        return HTMLResponse(html)
    except Exception as e:
        return HTMLResponse(f"<h1>Erreur</h1><p>{e}</p>")
'''

    new_ai_liquidity = '''
@app.get("/ai-liquidity", response_class=HTMLResponse)
async def ai_liquidity(request: Request):
    """AI Liquidity - Score de Liquidité Révolutionnaire"""
    try:
        if not is_logged_in(request):
            return RedirectResponse(url="/login?redirect=%2Fai-liquidity", status_code=303)
        
        SID = globals().get("SIDEBAR_HTML") or globals().get("SIDEBAR_FULL") or globals().get("SIDEBAR") or ""
        
        coins_data = []
        try:
            coins_data = _coingecko_markets_top50()
            if not isinstance(coins_data, list):
                coins_data = []
        except Exception as e:
            print(f"Erreur données liquidity: {e}")
        
        html = get_ai_liquidity_page(SID, coins_data)
        return HTMLResponse(html)
    except Exception as e:
        return HTMLResponse(f"<h1>Erreur</h1><p>{e}</p>")
'''

    new_ai_alerts = '''
@app.get("/ai-alerts", response_class=HTMLResponse)
async def ai_alerts_inbox(request: Request):
    """AI Alerts - Alertes de Marché Révolutionnaire"""
    try:
        if not is_logged_in(request):
            return RedirectResponse(url="/login?redirect=%2Fai-alerts", status_code=303)
        
        SID = globals().get("SIDEBAR_HTML") or globals().get("SIDEBAR_FULL") or globals().get("SIDEBAR") or ""
        
        alerts_data = []
        try:
            coins = _coingecko_markets_top50()
            if isinstance(coins, list):
                for c in coins[:30]:
                    ch24 = c.get("price_change_percentage_24h") or 0
                    ch1 = c.get("price_change_percentage_1h_in_currency") or 0
                    ch7 = c.get("price_change_percentage_7d_in_currency") or 0
                    
                    alert_type = "neutral"
                    reason = "Mouvement normal"
                    confidence = 50
                    
                    if ch24 > 10:
                        alert_type = "bullish"
                        reason = f"Forte hausse de {ch24:.1f}% en 24h"
                        confidence = min(95, 50 + int(ch24))
                    elif ch24 > 5:
                        alert_type = "bullish"
                        reason = f"Hausse significative de {ch24:.1f}% en 24h"
                        confidence = min(85, 50 + int(ch24))
                    elif ch24 < -10:
                        alert_type = "bearish"
                        reason = f"Forte baisse de {ch24:.1f}% en 24h"
                        confidence = min(95, 50 + int(abs(ch24)))
                    elif ch24 < -5:
                        alert_type = "bearish"
                        reason = f"Baisse significative de {ch24:.1f}% en 24h"
                        confidence = min(85, 50 + int(abs(ch24)))
                    
                    if abs(ch24) > 3 or abs(ch1 or 0) > 2:
                        alerts_data.append({
                            "symbol": c.get("symbol", "").upper(),
                            "name": c.get("name", ""),
                            "price": c.get("current_price"),
                            "ch1": ch1,
                            "ch24": ch24,
                            "ch7": ch7,
                            "volume": c.get("total_volume"),
                            "type": alert_type,
                            "reason": reason,
                            "confidence": confidence
                        })
                
                alerts_data.sort(key=lambda x: abs(x.get("ch24") or 0), reverse=True)
        except Exception as e:
            print(f"Erreur données alerts: {e}")
        
        html = get_ai_alerts_page(SID, alerts_data)
        return HTMLResponse(html)
    except Exception as e:
        return HTMLResponse(f"<h1>Erreur</h1><p>{e}</p>")
'''

    new_ai_setup_builder = '''
@app.get("/ai-setup-builder", response_class=HTMLResponse)
async def ai_setup_builder(request: Request):
    """AI Setup Builder - Constructeur de Setup Révolutionnaire"""
    try:
        if not is_logged_in(request):
            return RedirectResponse(url="/login?redirect=%2Fai-setup-builder", status_code=303)
        
        SID = globals().get("SIDEBAR_HTML") or globals().get("SIDEBAR_FULL") or globals().get("SIDEBAR") or ""
        q = dict(request.query_params)
        symbol = q.get("symbol", "")
        timeframe = q.get("timeframe", "1h")
        strategy = q.get("strategy", "breakout")
        
        html = get_ai_setup_builder_page(SID, symbol, timeframe, strategy)
        return HTMLResponse(html)
    except Exception as e:
        return HTMLResponse(f"<h1>Erreur</h1><p>{e}</p>")
'''

    new_ai_gem_hunter = '''
@app.get("/ai-gem-hunter", response_class=HTMLResponse)
async def ai_gem_hunter_page(request: Request):
    """AI Gem Hunter - Découverte de Pépites Révolutionnaire"""
    try:
        if not is_logged_in(request):
            return RedirectResponse(url="/login?redirect=%2Fai-gem-hunter", status_code=303)
        
        SID = globals().get("SIDEBAR_HTML") or globals().get("SIDEBAR_FULL") or globals().get("SIDEBAR") or ""
        
        trending_coins = []
        try:
            url = "https://api.coingecko.com/api/v3/search/trending"
            import httpx
            with httpx.Client(timeout=10.0) as client:
                r = client.get(url, headers={"accept": "application/json"})
                r.raise_for_status()
                js = r.json() or {}
                trending_coins = js.get("coins", [])[:15]
        except Exception as e:
            print(f"Erreur trending: {e}")
            try:
                import requests
                r = requests.get("https://api.coingecko.com/api/v3/search/trending", timeout=10)
                r.raise_for_status()
                js = r.json() or {}
                trending_coins = js.get("coins", [])[:15]
            except:
                pass
        
        html = get_ai_gem_hunter_page(SID, trending_coins)
        return HTMLResponse(html)
    except Exception as e:
        return HTMLResponse(f"<h1>Erreur</h1><p>{e}</p>")
'''

    new_ai_technical = '''
@app.get("/ai-technical-analysis", response_class=HTMLResponse)
async def ai_technical_analysis_page(request: Request):
    """AI Technical Analysis - Analyse Technique Révolutionnaire"""
    try:
        if not is_logged_in(request):
            return RedirectResponse(url="/login?redirect=%2Fai-technical-analysis", status_code=303)
        
        SID = globals().get("SIDEBAR_HTML") or globals().get("SIDEBAR_FULL") or globals().get("SIDEBAR") or ""
        q = dict(request.query_params)
        symbol = (q.get("symbol") or "BTCUSDT").upper()
        interval = q.get("interval") or "1h"
        
        analysis_data = None
        
        if symbol:
            try:
                import httpx
                import pandas as pd
                import numpy as np
                
                url = "https://api.binance.com/api/v3/klines"
                params = {"symbol": symbol, "interval": interval, "limit": 200}
                
                with httpx.Client(timeout=10.0) as client:
                    r = client.get(url, params=params)
                    r.raise_for_status()
                    kl = r.json() or []
                
                if kl:
                    df = pd.DataFrame(kl, columns=["open_time","open","high","low","close","volume","close_time","qav","num_trades","taker_base","taker_quote","ignore"])
                    for col in ["open","high","low","close","volume"]:
                        df[col] = pd.to_numeric(df[col], errors="coerce")
                    
                    df["ema20"] = df["close"].ewm(span=20, adjust=False).mean()
                    df["ema50"] = df["close"].ewm(span=50, adjust=False).mean()
                    
                    delta = df["close"].diff()
                    gain = (delta.where(delta > 0, 0)).rolling(14).mean()
                    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
                    rs = gain / loss.replace(0, np.nan)
                    df["rsi14"] = 100 - (100 / (1 + rs))
                    
                    ema12 = df["close"].ewm(span=12, adjust=False).mean()
                    ema26 = df["close"].ewm(span=26, adjust=False).mean()
                    df["macd"] = ema12 - ema26
                    df["signal"] = df["macd"].ewm(span=9, adjust=False).mean()
                    
                    df["bb_mid"] = df["close"].rolling(20).mean()
                    df["bb_std"] = df["close"].rolling(20).std()
                    df["bb_upper"] = df["bb_mid"] + 2 * df["bb_std"]
                    df["bb_lower"] = df["bb_mid"] - 2 * df["bb_std"]
                    
                    last = df.dropna().iloc[-1]
                    trend = "Bullish" if last["ema20"] > last["ema50"] else "Bearish"
                    
                    analysis_data = {
                        "close": float(last["close"]),
                        "ema20": float(last["ema20"]),
                        "ema50": float(last["ema50"]),
                        "rsi": float(last["rsi14"]),
                        "trend": trend,
                        "macd": float(last["macd"]),
                        "signal": float(last["signal"]),
                        "bb_upper": float(last["bb_upper"]),
                        "bb_lower": float(last["bb_lower"])
                    }
            except Exception as e:
                print(f"Erreur analyse technique: {e}")
        
        html = get_ai_technical_analysis_page(SID, symbol, interval, analysis_data)
        return HTMLResponse(html)
    except Exception as e:
        return HTMLResponse(f"<h1>Erreur</h1><p>{e}</p>")
'''

    # Patterns pour trouver et remplacer les anciennes routes
    replacements = [
        # AI Exit
        (r'@app\.get\("/ai-exit"[^)]*\)[^\n]*\nasync def ai_exit_page\([^)]*\):.*?(?=\n@app\.|\nclass |\ndef [a-z_]+\(|\n# ===|\nif __name__|$)', new_ai_exit),
        # AI Timeframe  
        (r'@app\.get\("/ai-timeframe"[^)]*\)[^\n]*\nasync def ai_timeframe\([^)]*\):.*?(?=\n@app\.|\nclass |\ndef [a-z_]+\(|\n# ===|\nif __name__|$)', new_ai_timeframe),
        # AI Liquidity
        (r'@app\.get\("/ai-liquidity"[^)]*\)[^\n]*\nasync def ai_liquidity\([^)]*\):.*?(?=\n@app\.|\nclass |\ndef [a-z_]+\(|\n# ===|\nif __name__|$)', new_ai_liquidity),
        # AI Alerts
        (r'@app\.get\("/ai-alerts"[^)]*\)[^\n]*\nasync def ai_alerts_inbox\([^)]*\):.*?(?=\n@app\.|\nclass |\ndef [a-z_]+\(|\n# ===|\nif __name__|$)', new_ai_alerts),
        # AI Setup Builder
        (r'@app\.get\("/ai-setup-builder"[^)]*\)[^\n]*\nasync def ai_setup_builder\([^)]*\):.*?(?=\n@app\.|\nclass |\ndef [a-z_]+\(|\n# ===|\nif __name__|$)', new_ai_setup_builder),
        # AI Gem Hunter
        (r'@app\.get\("/ai-gem-hunter"[^)]*\)[^\n]*\nasync def ai_gem_hunter_page\([^)]*\):.*?(?=\n@app\.|\nclass |\ndef [a-z_]+\(|\n# ===|\nif __name__|$)', new_ai_gem_hunter),
        # AI Technical Analysis
        (r'@app\.get\("/ai-technical-analysis"[^)]*\)[^\n]*\nasync def ai_technical_analysis_page\([^)]*\):.*?(?=\n@app\.|\nclass |\ndef [a-z_]+\(|\n# ===|\nif __name__|$)', new_ai_technical),
    ]
    
    routes_replaced = 0
    for pattern, replacement in replacements:
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
            routes_replaced += 1
    
    print(f"✅ {routes_replaced} routes remplacées")
    
    # Ajouter les routes manquantes si elles n'existent pas
    routes_to_add = []
    
    if '@app.get("/ai-exit"' not in content:
        routes_to_add.append(new_ai_exit)
    if '@app.get("/ai-timeframe"' not in content:
        routes_to_add.append(new_ai_timeframe)
    if '@app.get("/ai-liquidity"' not in content:
        routes_to_add.append(new_ai_liquidity)
    if '@app.get("/ai-alerts"' not in content:
        routes_to_add.append(new_ai_alerts)
    if '@app.get("/ai-setup-builder"' not in content:
        routes_to_add.append(new_ai_setup_builder)
    if '@app.get("/ai-gem-hunter"' not in content:
        routes_to_add.append(new_ai_gem_hunter)
    if '@app.get("/ai-technical-analysis"' not in content:
        routes_to_add.append(new_ai_technical)
    
    if routes_to_add:
        # Ajouter avant if __name__
        all_routes = "\n\n# === ROUTES AI RÉVOLUTIONNAIRES V2 ===\n" + "\n".join(routes_to_add)
        if "if __name__" in content:
            content = content.replace("if __name__", all_routes + "\n\nif __name__")
        else:
            content += all_routes
        print(f"✅ {len(routes_to_add)} routes ajoutées")
    
    # Ajouter aux PUBLIC_PATHS
    paths_to_add = [
        "/ai-exit", "/ai-timeframe", "/ai-liquidity", "/ai-alerts",
        "/ai-setup-builder", "/ai-gem-hunter", "/ai-technical-analysis"
    ]
    
    for path in paths_to_add:
        if f'"{path}"' not in content:
            content = re.sub(
                r'(PUBLIC_PATHS\s*=\s*\{[^}]*)',
                r'\1, "' + path + '"',
                content,
                count=1
            )
    
    print("✅ PUBLIC_PATHS mis à jour")
    
    # Sauvegarder
    with open("main.py", "w", encoding="utf-8") as f:
        f.write(content)
    
    print("\n✅ main.py mis à jour avec succès!")
    print("\n📝 Pages révolutionnaires V2 appliquées:")
    print("   - /ai-exit")
    print("   - /ai-timeframe")
    print("   - /ai-liquidity")
    print("   - /ai-alerts")
    print("   - /ai-setup-builder")
    print("   - /ai-gem-hunter")
    print("   - /ai-technical-analysis")

if __name__ == "__main__":
    replace_routes()