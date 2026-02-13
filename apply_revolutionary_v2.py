"""
Script pour appliquer les pages révolutionnaires V2 à main.py
"""

import re

def apply_revolutionary_pages():
    print("🚀 Application des pages révolutionnaires V2...")
    
    # Lire main.py
    with open("main.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Import du module
    import_statement = "from revolutionary_ai_pages_v2 import *"
    
    # Vérifier si l'import existe déjà
    if "from revolutionary_ai_pages_v2 import" not in content:
        # Ajouter l'import après les autres imports
        import_pattern = r"(from revolutionary_ai_pages import \*)"
        if re.search(import_pattern, content):
            content = re.sub(import_pattern, r"\1\n" + import_statement, content)
        else:
            # Ajouter après les imports existants
            content = content.replace("from fastapi import", f"{import_statement}\nfrom fastapi import", 1)
        print("✅ Import ajouté")
    
    # Nouvelles routes à ajouter/remplacer
    new_routes = '''

# ============================================================
# 🎨 ROUTES AI RÉVOLUTIONNAIRES V2
# ============================================================

@app.get("/ai-exit", response_class=HTMLResponse)
async def ai_exit_revolutionary(request: Request):
    """AI Exit - Calculateur TP/SL Professionnel"""
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


@app.get("/ai-timeframe-v2", response_class=HTMLResponse)
async def ai_timeframe_revolutionary(request: Request):
    """AI Timeframe - Recommandation Intelligente V2"""
    try:
        if not is_logged_in(request):
            return RedirectResponse(url="/login?redirect=%2Fai-timeframe", status_code=303)
        
        SID = globals().get("SIDEBAR_HTML") or globals().get("SIDEBAR_FULL") or globals().get("SIDEBAR") or ""
        
        # Récupérer données BTC
        import math
        btc_price = None
        btc_change = None
        volatility = None
        regime = "Normal"
        
        try:
            # Prix BTC 30j pour volatilité
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
            
            # Données marché BTC
            mk = _coingecko_markets_top50()
            btc_row = next((r for r in (mk if isinstance(mk, list) else []) if r.get("id") == "bitcoin" or r.get("symbol") == "btc"), None)
            if btc_row:
                btc_price = btc_row.get("current_price")
                btc_change = btc_row.get("price_change_percentage_24h")
            
            # Déterminer régime
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


@app.get("/ai-liquidity-v2", response_class=HTMLResponse)
async def ai_liquidity_revolutionary(request: Request):
    """AI Liquidity - Score de Liquidité V2"""
    try:
        if not is_logged_in(request):
            return RedirectResponse(url="/login?redirect=%2Fai-liquidity", status_code=303)
        
        SID = globals().get("SIDEBAR_HTML") or globals().get("SIDEBAR_FULL") or globals().get("SIDEBAR") or ""
        
        # Récupérer données CoinGecko
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


@app.get("/ai-alerts-v2", response_class=HTMLResponse)
async def ai_alerts_revolutionary(request: Request):
    """AI Alerts - Alertes de Marché V2"""
    try:
        if not is_logged_in(request):
            return RedirectResponse(url="/login?redirect=%2Fai-alerts", status_code=303)
        
        SID = globals().get("SIDEBAR_HTML") or globals().get("SIDEBAR_FULL") or globals().get("SIDEBAR") or ""
        
        # Récupérer données pour alertes
        alerts_data = []
        try:
            coins = _coingecko_markets_top50()
            if isinstance(coins, list):
                for c in coins[:30]:
                    ch24 = c.get("price_change_percentage_24h") or 0
                    ch1 = c.get("price_change_percentage_1h_in_currency") or 0
                    ch7 = c.get("price_change_percentage_7d_in_currency") or 0
                    
                    # Déterminer type d'alerte
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
                
                # Trier par mouvement absolu
                alerts_data.sort(key=lambda x: abs(x.get("ch24") or 0), reverse=True)
        except Exception as e:
            print(f"Erreur données alerts: {e}")
        
        html = get_ai_alerts_page(SID, alerts_data)
        return HTMLResponse(html)
    except Exception as e:
        return HTMLResponse(f"<h1>Erreur</h1><p>{e}</p>")


@app.get("/ai-setup-builder-v2", response_class=HTMLResponse)
async def ai_setup_builder_revolutionary(request: Request):
    """AI Setup Builder - Constructeur de Setup V2"""
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


@app.get("/ai-gem-hunter-v2", response_class=HTMLResponse)
async def ai_gem_hunter_revolutionary(request: Request):
    """AI Gem Hunter - Découverte de Pépites V2"""
    try:
        if not is_logged_in(request):
            return RedirectResponse(url="/login?redirect=%2Fai-gem-hunter", status_code=303)
        
        SID = globals().get("SIDEBAR_HTML") or globals().get("SIDEBAR_FULL") or globals().get("SIDEBAR") or ""
        
        # Récupérer trending coins
        trending_coins = []
        try:
            url = "https://api.coingecko.com/api/v3/search/trending"
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(url, headers={"accept": "application/json"})
                r.raise_for_status()
                js = r.json() or {}
                trending_coins = js.get("coins", [])[:15]
        except Exception as e:
            print(f"Erreur trending: {e}")
            # Fallback sync
            try:
                import requests
                r = requests.get(url, timeout=10)
                r.raise_for_status()
                js = r.json() or {}
                trending_coins = js.get("coins", [])[:15]
            except:
                pass
        
        html = get_ai_gem_hunter_page(SID, trending_coins)
        return HTMLResponse(html)
    except Exception as e:
        return HTMLResponse(f"<h1>Erreur</h1><p>{e}</p>")


@app.get("/ai-technical-analysis-v2", response_class=HTMLResponse)
async def ai_technical_analysis_revolutionary(request: Request):
    """AI Technical Analysis - Analyse Technique V2"""
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
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    r = await client.get(url, params=params)
                    r.raise_for_status()
                    kl = r.json() or []
                
                if kl:
                    df = pd.DataFrame(kl, columns=["open_time","open","high","low","close","volume","close_time","qav","num_trades","taker_base","taker_quote","ignore"])
                    for col in ["open","high","low","close","volume"]:
                        df[col] = pd.to_numeric(df[col], errors="coerce")
                    
                    # EMA
                    df["ema20"] = df["close"].ewm(span=20, adjust=False).mean()
                    df["ema50"] = df["close"].ewm(span=50, adjust=False).mean()
                    
                    # RSI
                    delta = df["close"].diff()
                    gain = (delta.where(delta > 0, 0)).rolling(14).mean()
                    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
                    rs = gain / loss.replace(0, np.nan)
                    df["rsi14"] = 100 - (100 / (1 + rs))
                    
                    # MACD
                    ema12 = df["close"].ewm(span=12, adjust=False).mean()
                    ema26 = df["close"].ewm(span=26, adjust=False).mean()
                    df["macd"] = ema12 - ema26
                    df["signal"] = df["macd"].ewm(span=9, adjust=False).mean()
                    
                    # Bollinger Bands
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
    
    # Ajouter les routes si elles n'existent pas
    if "@app.get(\"/ai-exit-v2\"" not in content and "@app.get(\"/ai-exit\", response_class=HTMLResponse)\nasync def ai_exit_revolutionary" not in content:
        # Trouver un bon endroit pour insérer les routes (avant la fin du fichier)
        # Chercher la dernière route existante
        last_route_match = list(re.finditer(r'@app\.(get|post)\([^)]+\)[^\n]*\nasync def [^(]+\([^)]*\):', content))
        
        if last_route_match:
            last_pos = last_route_match[-1].end()
            # Trouver la fin de cette fonction
            remaining = content[last_pos:]
            next_decorator = remaining.find('\n@app.')
            if next_decorator == -1:
                next_decorator = remaining.find('\nif __name__')
            if next_decorator == -1:
                next_decorator = len(remaining) - 100
            
            insert_pos = last_pos + next_decorator
            content = content[:insert_pos] + new_routes + content[insert_pos:]
            print("✅ Routes V2 ajoutées")
        else:
            # Ajouter à la fin avant if __name__
            if "if __name__" in content:
                content = content.replace("if __name__", new_routes + "\nif __name__")
            else:
                content += new_routes
            print("✅ Routes V2 ajoutées à la fin")
    else:
        print("ℹ️ Routes V2 déjà présentes")
    
    # Ajouter les routes aux PUBLIC_PATHS
    public_paths_additions = [
        '"/ai-exit"', '"/ai-timeframe"', '"/ai-timeframe-v2"', 
        '"/ai-liquidity"', '"/ai-liquidity-v2"',
        '"/ai-alerts"', '"/ai-alerts-v2"',
        '"/ai-setup-builder"', '"/ai-setup-builder-v2"',
        '"/ai-gem-hunter"', '"/ai-gem-hunter-v2"',
        '"/ai-technical-analysis"', '"/ai-technical-analysis-v2"'
    ]
    
    for path in public_paths_additions:
        if path not in content:
            # Ajouter au PUBLIC_PATHS
            content = re.sub(
                r'(PUBLIC_PATHS\s*=\s*\{[^}]*)',
                r'\1, ' + path,
                content
            )
    
    print("✅ PUBLIC_PATHS mis à jour")
    
    # Sauvegarder
    with open("main.py", "w", encoding="utf-8") as f:
        f.write(content)
    
    print("✅ main.py mis à jour avec succès!")
    print("\n📝 Routes ajoutées:")
    print("   - /ai-exit (calculateur TP/SL)")
    print("   - /ai-timeframe-v2 (recommandation timeframe)")
    print("   - /ai-liquidity-v2 (score liquidité)")
    print("   - /ai-alerts-v2 (alertes marché)")
    print("   - /ai-setup-builder-v2 (constructeur setup)")
    print("   - /ai-gem-hunter-v2 (découverte pépites)")
    print("   - /ai-technical-analysis-v2 (analyse technique)")

if __name__ == "__main__":
    apply_revolutionary_pages()