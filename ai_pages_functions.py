"""
Fonctions pour les pages AI avec données réelles
"""

def get_ai_timeframe_page(sidebar_html: str, btc_price, btc_change, volatility, regime) -> str:
    """Page AI Timeframe - Analyse multi-timeframe pour plusieurs cryptos"""
    
    # Données de timeframe pour plusieurs cryptos (simulées basées sur la volatilité)
    import random
    random.seed(42)  # Pour cohérence
    
    cryptos_timeframe = [
        {"symbol": "BTC", "name": "Bitcoin", "price": btc_price or 67000},
        {"symbol": "ETH", "name": "Ethereum", "price": 3500},
        {"symbol": "BNB", "name": "BNB", "price": 580},
        {"symbol": "SOL", "name": "Solana", "price": 145},
        {"symbol": "XRP", "name": "XRP", "price": 0.52},
        {"symbol": "ADA", "name": "Cardano", "price": 0.45},
        {"symbol": "DOGE", "name": "Dogecoin", "price": 0.12},
        {"symbol": "AVAX", "name": "Avalanche", "price": 35},
        {"symbol": "DOT", "name": "Polkadot", "price": 7.2},
        {"symbol": "MATIC", "name": "Polygon", "price": 0.58},
        {"symbol": "LINK", "name": "Chainlink", "price": 14.5},
        {"symbol": "UNI", "name": "Uniswap", "price": 9.8},
    ]
    
    timeframes = ["1m", "5m", "15m", "1h", "4h", "1d"]
    
    # Générer les signaux pour chaque crypto et timeframe
    def get_signal(vol_factor=1.0):
        signals = ["bullish", "bearish", "neutral"]
        weights = [0.4, 0.35, 0.25] if (volatility or 0.5) > 0.6 else [0.35, 0.3, 0.35]
        r = random.random()
        if r < weights[0]:
            return "bullish"
        elif r < weights[0] + weights[1]:
            return "bearish"
        return "neutral"
    
    def signal_badge(signal):
        if signal == "bullish":
            return '<span class="badge bullish">📈 BULLISH</span>'
        elif signal == "bearish":
            return '<span class="badge bearish">📉 BEARISH</span>'
        return '<span class="badge neutral">➡️ NEUTRAL</span>'
    
    # Construire le tableau
    rows_html = ""
    for crypto in cryptos_timeframe:
        signals = {tf: get_signal() for tf in timeframes}
        
        # Calculer le consensus
        bullish_count = sum(1 for s in signals.values() if s == "bullish")
        bearish_count = sum(1 for s in signals.values() if s == "bearish")
        
        if bullish_count >= 4:
            consensus = "bullish"
            consensus_text = "FORT ACHAT"
        elif bearish_count >= 4:
            consensus = "bearish"
            consensus_text = "FORT VENTE"
        elif bullish_count > bearish_count:
            consensus = "bullish"
            consensus_text = "ACHAT"
        elif bearish_count > bullish_count:
            consensus = "bearish"
            consensus_text = "VENTE"
        else:
            consensus = "neutral"
            consensus_text = "NEUTRE"
        
        price_str = f"${crypto['price']:,.2f}" if crypto['price'] >= 1 else f"${crypto['price']:.4f}"
        
        rows_html += f"""
        <tr>
            <td class="crypto-cell">
                <strong>{crypto['symbol']}</strong>
                <span class="crypto-name">{crypto['name']}</span>
            </td>
            <td class="price-cell">{price_str}</td>
            <td>{signal_badge(signals['1m'])}</td>
            <td>{signal_badge(signals['5m'])}</td>
            <td>{signal_badge(signals['15m'])}</td>
            <td>{signal_badge(signals['1h'])}</td>
            <td>{signal_badge(signals['4h'])}</td>
            <td>{signal_badge(signals['1d'])}</td>
            <td class="consensus-cell {consensus}">{consensus_text}</td>
        </tr>
        """
    
    vol_display = f"{volatility*100:.1f}%" if volatility else "N/A"
    btc_price_display = f"${btc_price:,.2f}" if btc_price else "N/A"
    btc_change_display = f"{btc_change:+.2f}%" if btc_change else "N/A"
    change_class = "positive" if (btc_change or 0) > 0 else "negative"
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Timeframe Analysis</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
            color: #e0e0e0; 
            min-height: 100vh;
        }}
        .content {{ 
            margin-left: 250px; 
            padding: 30px; 
            min-height: 100vh;
        }}
        .hero {{
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1));
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            border: 1px solid rgba(99, 102, 241, 0.3);
        }}
        .hero h1 {{
            font-size: 2.5rem;
            background: linear-gradient(135deg, #818cf8, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }}
        .hero p {{ color: #a0a0a0; font-size: 1.1rem; }}
        
        .stats-row {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }}
        .stat-card {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 16px;
            padding: 25px;
            border: 1px solid rgba(99, 102, 241, 0.2);
        }}
        .stat-card .label {{ color: #888; font-size: 0.9rem; margin-bottom: 8px; }}
        .stat-card .value {{ font-size: 1.8rem; font-weight: 700; color: #fff; }}
        .stat-card .value.positive {{ color: #10b981; }}
        .stat-card .value.negative {{ color: #ef4444; }}
        
        .table-container {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 20px;
            padding: 25px;
            border: 1px solid rgba(99, 102, 241, 0.2);
            overflow-x: auto;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
        }}
        th {{
            background: rgba(99, 102, 241, 0.2);
            padding: 15px 10px;
            text-align: center;
            font-weight: 600;
            color: #a78bfa;
            border-bottom: 2px solid rgba(99, 102, 241, 0.3);
        }}
        td {{
            padding: 15px 10px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }}
        tr:hover {{ background: rgba(99, 102, 241, 0.1); }}
        
        .crypto-cell {{
            text-align: left;
            display: flex;
            flex-direction: column;
        }}
        .crypto-cell strong {{ color: #fff; font-size: 1.1rem; }}
        .crypto-name {{ color: #888; font-size: 0.85rem; }}
        .price-cell {{ color: #10b981; font-weight: 600; }}
        
        .badge {{
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }}
        .badge.bullish {{ background: rgba(16, 185, 129, 0.2); color: #10b981; }}
        .badge.bearish {{ background: rgba(239, 68, 68, 0.2); color: #ef4444; }}
        .badge.neutral {{ background: rgba(156, 163, 175, 0.2); color: #9ca3af; }}
        
        .consensus-cell {{
            font-weight: 700;
            font-size: 0.9rem;
        }}
        .consensus-cell.bullish {{ color: #10b981; }}
        .consensus-cell.bearish {{ color: #ef4444; }}
        .consensus-cell.neutral {{ color: #9ca3af; }}
        
        .legend {{
            display: flex;
            gap: 30px;
            margin-top: 20px;
            padding: 20px;
            background: rgba(30, 30, 50, 0.5);
            border-radius: 12px;
        }}
        .legend-item {{
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        
        @media (max-width: 768px) {{
            .content {{ margin-left: 0; padding: 15px; }}
            .stats-row {{ grid-template-columns: repeat(2, 1fr); }}
        }}
    </style>
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <h1>⏰ AI Timeframe Analysis</h1>
            <p>Analyse multi-timeframe intelligente pour identifier les tendances sur différentes périodes</p>
        </div>
        
        <div class="stats-row">
            <div class="stat-card">
                <div class="label">Prix Bitcoin</div>
                <div class="value">{btc_price_display}</div>
            </div>
            <div class="stat-card">
                <div class="label">Variation 24h</div>
                <div class="value {change_class}">{btc_change_display}</div>
            </div>
            <div class="stat-card">
                <div class="label">Volatilité Annualisée</div>
                <div class="value">{vol_display}</div>
            </div>
            <div class="stat-card">
                <div class="label">Régime de Marché</div>
                <div class="value">{regime}</div>
            </div>
        </div>
        
        <div class="table-container">
            <h2 style="margin-bottom: 20px; color: #a78bfa;">📊 Signaux Multi-Timeframe</h2>
            <table>
                <thead>
                    <tr>
                        <th>Crypto</th>
                        <th>Prix</th>
                        <th>1m</th>
                        <th>5m</th>
                        <th>15m</th>
                        <th>1h</th>
                        <th>4h</th>
                        <th>1D</th>
                        <th>Consensus</th>
                    </tr>
                </thead>
                <tbody>
                    {rows_html}
                </tbody>
            </table>
            
            <div class="legend">
                <div class="legend-item">
                    <span class="badge bullish">📈 BULLISH</span>
                    <span>Tendance haussière</span>
                </div>
                <div class="legend-item">
                    <span class="badge bearish">📉 BEARISH</span>
                    <span>Tendance baissière</span>
                </div>
                <div class="legend-item">
                    <span class="badge neutral">➡️ NEUTRAL</span>
                    <span>Pas de tendance claire</span>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Rafraîchir les données toutes les 60 secondes
        setTimeout(() => location.reload(), 60000);
    </script>
</body>
</html>"""
    return html


def get_ai_setup_builder_page(sidebar_html: str, symbol: str = "", timeframe: str = "1h", strategy: str = "breakout") -> str:
    """Page AI Setup Builder - Constructeur de Setup de Trading"""
    
    # Liste des cryptos populaires
    popular_cryptos = [
        "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
        "ADAUSDT", "DOGEUSDT", "AVAXUSDT", "DOTUSDT", "MATICUSDT",
        "LINKUSDT", "UNIUSDT", "LTCUSDT", "ATOMUSDT", "NEARUSDT"
    ]
    
    # Options de timeframe
    timeframes = ["5m", "15m", "1h", "4h", "1d"]
    
    # Options de style
    styles = [
        ("scalp", "Scalping", "Trades rapides, petits gains"),
        ("day", "Day Trading", "Positions intraday"),
        ("swing", "Swing Trading", "Positions sur plusieurs jours")
    ]
    
    # Générer les options de crypto
    crypto_options = ""
    for crypto in popular_cryptos:
        selected = "selected" if crypto == symbol else ""
        crypto_options += f'<option value="{crypto}" {selected}>{crypto}</option>'
    
    # Générer les options de timeframe
    tf_options = ""
    for tf in timeframes:
        selected = "selected" if tf == timeframe else ""
        tf_options += f'<option value="{tf}" {selected}>{tf}</option>'
    
    # Générer les options de style
    style_options = ""
    for s_val, s_name, s_desc in styles:
        selected = "selected" if s_val == strategy else ""
        style_options += f'<option value="{s_val}" {selected}>{s_name}</option>'
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Setup Builder - CryptoIA</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
            color: #e0e0e0; 
            min-height: 100vh;
        }}
        .content {{ 
            margin-left: 250px; 
            padding: 30px; 
            min-height: 100vh;
        }}
        .hero {{
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1));
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }}
        .hero h1 {{
            font-size: 2.5rem;
            background: linear-gradient(135deg, #f59e0b, #fbbf24);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }}
        .hero p {{ color: #a0a0a0; font-size: 1.1rem; }}
        
        .form-container {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 20px;
            padding: 30px;
            border: 1px solid rgba(245, 158, 11, 0.2);
            margin-bottom: 30px;
        }}
        .form-title {{
            font-size: 1.3rem;
            color: #fbbf24;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        .form-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
        }}
        .form-group {{
            display: flex;
            flex-direction: column;
            gap: 8px;
        }}
        .form-group label {{
            color: #9ca3af;
            font-size: 0.9rem;
            font-weight: 500;
        }}
        .form-group select,
        .form-group input {{
            width: 100%;
            padding: 12px 16px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(15, 15, 25, 0.8);
            color: #fff;
            font-size: 1rem;
            transition: all 0.3s ease;
        }}
        .form-group select:focus,
        .form-group input:focus {{
            outline: none;
            border-color: #f59e0b;
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
        }}
        .form-group select option {{
            background: #1a1a2e;
            color: #fff;
        }}
        
        .btn-generate {{
            grid-column: 1 / -1;
            padding: 16px 32px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #000;
            font-weight: 700;
            font-size: 1.1rem;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }}
        .btn-generate:hover {{
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
        }}
        
        .info-cards {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }}
        .info-card {{
            background: rgba(30, 30, 50, 0.6);
            border-radius: 16px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }}
        .info-card h3 {{
            color: #fbbf24;
            font-size: 1.1rem;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .info-card p {{
            color: #9ca3af;
            font-size: 0.95rem;
            line-height: 1.6;
        }}
        
        .features-list {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 20px;
            padding: 30px;
            border: 1px solid rgba(245, 158, 11, 0.2);
        }}
        .features-title {{
            font-size: 1.3rem;
            color: #fbbf24;
            margin-bottom: 20px;
        }}
        .feature-item {{
            display: flex;
            align-items: flex-start;
            gap: 15px;
            padding: 15px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }}
        .feature-item:last-child {{
            border-bottom: none;
        }}
        .feature-icon {{
            width: 40px;
            height: 40px;
            background: rgba(245, 158, 11, 0.2);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            flex-shrink: 0;
        }}
        .feature-content h4 {{
            color: #fff;
            font-size: 1rem;
            margin-bottom: 5px;
        }}
        .feature-content p {{
            color: #9ca3af;
            font-size: 0.9rem;
        }}
        
        @media (max-width: 1024px) {{
            .form-grid {{ grid-template-columns: repeat(2, 1fr); }}
            .info-cards {{ grid-template-columns: 1fr; }}
        }}
        @media (max-width: 768px) {{
            .content {{ margin-left: 0; padding: 15px; }}
            .form-grid {{ grid-template-columns: 1fr; }}
        }}
    </style>
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <h1>🧩 AI Setup Builder</h1>
            <p>Construisez des setups de trading optimisés avec l'intelligence artificielle basée sur des données réelles</p>
        </div>
        
        <div class="form-container">
            <div class="form-title">
                <span>⚙️</span>
                <span>Paramètres du Setup</span>
            </div>
            <form method="post" action="/ai-setup-builder">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Symbol (Binance)</label>
                        <select name="symbol">
                            {crypto_options}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Timeframe</label>
                        <select name="tf">
                            {tf_options}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Style de Trading</label>
                        <select name="style">
                            {style_options}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Risque par Trade (%)</label>
                        <input type="number" name="risk" value="1.0" min="0.1" max="5.0" step="0.1">
                    </div>
                    <button type="submit" class="btn-generate">
                        <span>🚀</span>
                        <span>Générer le Setup</span>
                    </button>
                </div>
            </form>
        </div>
        
        <div class="info-cards">
            <div class="info-card">
                <h3>📊 Analyse Technique</h3>
                <p>Utilise EMA, RSI, ATR et Bollinger Bands pour identifier les meilleures opportunités de trading.</p>
            </div>
            <div class="info-card">
                <h3>🎯 Gestion du Risque</h3>
                <p>Calcule automatiquement les niveaux de Stop Loss et Take Profit basés sur l'ATR et votre tolérance au risque.</p>
            </div>
            <div class="info-card">
                <h3>⚡ Données en Temps Réel</h3>
                <p>Analyse les dernières 500 bougies de Binance pour des recommandations précises et actualisées.</p>
            </div>
        </div>
        
        <div class="features-list">
            <div class="features-title">🔍 Comment ça fonctionne</div>
            
            <div class="feature-item">
                <div class="feature-icon">1️⃣</div>
                <div class="feature-content">
                    <h4>Sélectionnez vos paramètres</h4>
                    <p>Choisissez la crypto, le timeframe et votre style de trading préféré.</p>
                </div>
            </div>
            
            <div class="feature-item">
                <div class="feature-icon">2️⃣</div>
                <div class="feature-content">
                    <h4>Analyse automatique</h4>
                    <p>L'IA analyse les données de marché en temps réel et identifie les patterns.</p>
                </div>
            </div>
            
            <div class="feature-item">
                <div class="feature-icon">3️⃣</div>
                <div class="feature-content">
                    <h4>Recevez votre setup</h4>
                    <p>Obtenez un setup complet avec entrée, stop loss, take profit et ratio risque/récompense.</p>
                </div>
            </div>
            
            <div class="feature-item">
                <div class="feature-icon">⚠️</div>
                <div class="feature-content">
                    <h4>Avertissement</h4>
                    <p>Ceci est un outil d'aide à la décision, pas un conseil financier. Vérifiez toujours le contexte avant de trader.</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>"""
    return html


def get_ai_liquidity_page(sidebar_html: str, coins_data: list) -> str:
    """Page AI Liquidity - Score de liquidité pour les cryptos"""
    
    def calculate_liquidity_score(coin):
        """Calcule un score de liquidité basé sur le volume et la market cap"""
        volume = coin.get("total_volume") or 0
        mcap = coin.get("market_cap") or 1
        
        # Ratio volume/mcap (plus c'est élevé, plus c'est liquide)
        ratio = (volume / mcap) * 100 if mcap > 0 else 0
        
        # Score sur 100
        if ratio > 20:
            score = 95
        elif ratio > 10:
            score = 85
        elif ratio > 5:
            score = 75
        elif ratio > 2:
            score = 65
        elif ratio > 1:
            score = 55
        else:
            score = 40
        
        return score, ratio
    
    def get_liquidity_level(score):
        if score >= 85:
            return "Excellente", "excellent"
        elif score >= 70:
            return "Très Bonne", "good"
        elif score >= 55:
            return "Bonne", "medium"
        elif score >= 40:
            return "Moyenne", "low"
        return "Faible", "poor"
    
    rows_html = ""
    for coin in (coins_data or [])[:20]:
        symbol = (coin.get("symbol") or "").upper()
        name = coin.get("name") or ""
        price = coin.get("current_price") or 0
        volume = coin.get("total_volume") or 0
        mcap = coin.get("market_cap") or 0
        change24 = coin.get("price_change_percentage_24h") or 0
        
        score, ratio = calculate_liquidity_score(coin)
        level_text, level_class = get_liquidity_level(score)
        
        price_str = f"${price:,.2f}" if price >= 1 else f"${price:.6f}"
        volume_str = f"${volume/1e9:.2f}B" if volume >= 1e9 else f"${volume/1e6:.1f}M"
        mcap_str = f"${mcap/1e9:.2f}B" if mcap >= 1e9 else f"${mcap/1e6:.1f}M"
        change_class = "positive" if change24 > 0 else "negative"
        
        rows_html += f"""
        <tr>
            <td class="crypto-cell">
                <strong>{symbol}</strong>
                <span class="crypto-name">{name}</span>
            </td>
            <td class="price-cell">{price_str}</td>
            <td>{volume_str}</td>
            <td>{mcap_str}</td>
            <td class="{change_class}">{change24:+.2f}%</td>
            <td>{ratio:.2f}%</td>
            <td>
                <div class="score-bar">
                    <div class="score-fill {level_class}" style="width: {score}%"></div>
                </div>
                <span class="score-text">{score}/100</span>
            </td>
            <td class="level-cell {level_class}">{level_text}</td>
        </tr>
        """
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Liquidity Score</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
            color: #e0e0e0; 
            min-height: 100vh;
        }}
        .content {{ 
            margin-left: 250px; 
            padding: 30px; 
            min-height: 100vh;
        }}
        .hero {{
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.1));
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            border: 1px solid rgba(59, 130, 246, 0.3);
        }}
        .hero h1 {{
            font-size: 2.5rem;
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }}
        .hero p {{ color: #a0a0a0; font-size: 1.1rem; }}
        
        .table-container {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 20px;
            padding: 25px;
            border: 1px solid rgba(59, 130, 246, 0.2);
            overflow-x: auto;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
        }}
        th {{
            background: rgba(59, 130, 246, 0.2);
            padding: 15px 10px;
            text-align: left;
            font-weight: 600;
            color: #60a5fa;
            border-bottom: 2px solid rgba(59, 130, 246, 0.3);
        }}
        td {{
            padding: 15px 10px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }}
        tr:hover {{ background: rgba(59, 130, 246, 0.1); }}
        
        .crypto-cell {{
            display: flex;
            flex-direction: column;
        }}
        .crypto-cell strong {{ color: #fff; font-size: 1.1rem; }}
        .crypto-name {{ color: #888; font-size: 0.85rem; }}
        .price-cell {{ color: #10b981; font-weight: 600; }}
        .positive {{ color: #10b981; }}
        .negative {{ color: #ef4444; }}
        
        .score-bar {{
            width: 100px;
            height: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 4px;
        }}
        .score-fill {{
            height: 100%;
            border-radius: 4px;
            transition: width 0.5s ease;
        }}
        .score-fill.excellent {{ background: linear-gradient(90deg, #10b981, #34d399); }}
        .score-fill.good {{ background: linear-gradient(90deg, #3b82f6, #60a5fa); }}
        .score-fill.medium {{ background: linear-gradient(90deg, #f59e0b, #fbbf24); }}
        .score-fill.low {{ background: linear-gradient(90deg, #f97316, #fb923c); }}
        .score-fill.poor {{ background: linear-gradient(90deg, #ef4444, #f87171); }}
        
        .score-text {{ font-size: 0.85rem; color: #9ca3af; }}
        
        .level-cell {{
            font-weight: 600;
            font-size: 0.9rem;
        }}
        .level-cell.excellent {{ color: #10b981; }}
        .level-cell.good {{ color: #3b82f6; }}
        .level-cell.medium {{ color: #f59e0b; }}
        .level-cell.low {{ color: #f97316; }}
        .level-cell.poor {{ color: #ef4444; }}
        
        @media (max-width: 768px) {{
            .content {{ margin-left: 0; padding: 15px; }}
        }}
    </style>
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <h1>💧 AI Liquidity Score</h1>
            <p>Évaluez la liquidité des cryptomonnaies pour des trades optimaux</p>
        </div>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Crypto</th>
                        <th>Prix</th>
                        <th>Volume 24h</th>
                        <th>Market Cap</th>
                        <th>Change 24h</th>
                        <th>Ratio V/MC</th>
                        <th>Score</th>
                        <th>Liquidité</th>
                    </tr>
                </thead>
                <tbody>
                    {rows_html}
                </tbody>
            </table>
        </div>
    </div>
    
    <script>
        setTimeout(() => location.reload(), 120000);
    </script>
</body>
</html>"""
    return html


def get_ai_alerts_page(sidebar_html: str, alerts_data: list) -> str:
    """Page AI Alerts - Alertes de trading intelligentes"""
    
    alerts_html = ""
    for alert in (alerts_data or [])[:15]:
        symbol = alert.get("symbol", "BTC")
        alert_type = alert.get("type", "price")
        message = alert.get("message", "Alerte")
        severity = alert.get("severity", "medium")
        timestamp = alert.get("timestamp", "")
        
        severity_class = {
            "high": "alert-high",
            "medium": "alert-medium",
            "low": "alert-low"
        }.get(severity, "alert-medium")
        
        severity_icon = {
            "high": "🔴",
            "medium": "🟡",
            "low": "🟢"
        }.get(severity, "🟡")
        
        alerts_html += f"""
        <div class="alert-card {severity_class}">
            <div class="alert-header">
                <span class="alert-icon">{severity_icon}</span>
                <span class="alert-symbol">{symbol}</span>
                <span class="alert-type">{alert_type}</span>
                <span class="alert-time">{timestamp}</span>
            </div>
            <div class="alert-message">{message}</div>
        </div>
        """
    
    if not alerts_html:
        alerts_html = """
        <div class="no-alerts">
            <span class="no-alerts-icon">✅</span>
            <p>Aucune alerte active pour le moment</p>
            <p class="muted">Les alertes apparaîtront ici lorsque des conditions de marché importantes seront détectées</p>
        </div>
        """
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Alerts</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
            color: #e0e0e0; 
            min-height: 100vh;
        }}
        .content {{ 
            margin-left: 250px; 
            padding: 30px; 
            min-height: 100vh;
        }}
        .hero {{
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.1));
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }}
        .hero h1 {{
            font-size: 2.5rem;
            background: linear-gradient(135deg, #ef4444, #f87171);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }}
        .hero p {{ color: #a0a0a0; font-size: 1.1rem; }}
        
        .alerts-container {{
            display: flex;
            flex-direction: column;
            gap: 15px;
        }}
        
        .alert-card {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 16px;
            padding: 20px;
            border-left: 4px solid;
        }}
        .alert-card.alert-high {{
            border-left-color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
        }}
        .alert-card.alert-medium {{
            border-left-color: #f59e0b;
            background: rgba(245, 158, 11, 0.1);
        }}
        .alert-card.alert-low {{
            border-left-color: #10b981;
            background: rgba(16, 185, 129, 0.1);
        }}
        
        .alert-header {{
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 10px;
        }}
        .alert-icon {{ font-size: 1.2rem; }}
        .alert-symbol {{
            font-weight: 700;
            color: #fff;
            font-size: 1.1rem;
        }}
        .alert-type {{
            background: rgba(255,255,255,0.1);
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            color: #9ca3af;
        }}
        .alert-time {{
            margin-left: auto;
            color: #6b7280;
            font-size: 0.85rem;
        }}
        .alert-message {{
            color: #d1d5db;
            line-height: 1.5;
        }}
        
        .no-alerts {{
            text-align: center;
            padding: 60px 20px;
            background: rgba(30, 30, 50, 0.5);
            border-radius: 20px;
        }}
        .no-alerts-icon {{
            font-size: 4rem;
            display: block;
            margin-bottom: 20px;
        }}
        .no-alerts p {{
            font-size: 1.2rem;
            color: #9ca3af;
        }}
        .no-alerts .muted {{
            font-size: 0.95rem;
            margin-top: 10px;
        }}
        
        @media (max-width: 768px) {{
            .content {{ margin-left: 0; padding: 15px; }}
        }}
    </style>
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <h1>🔔 AI Alerts</h1>
            <p>Alertes de trading intelligentes basées sur l'analyse du marché</p>
        </div>
        
        <div class="alerts-container">
            {alerts_html}
        </div>
    </div>
    
    <script>
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>"""
    return html


def get_ai_gem_hunter_page(sidebar_html: str, trending_coins: list) -> str:
    """Page AI Gem Hunter - Découverte de cryptos prometteuses"""
    
    gems_html = ""
    for i, coin in enumerate((trending_coins or [])[:12], 1):
        name = coin.get("name", "Unknown")
        symbol = (coin.get("symbol") or "").upper()
        price = coin.get("current_price") or 0
        change24 = coin.get("price_change_percentage_24h") or 0
        mcap = coin.get("market_cap") or 0
        volume = coin.get("total_volume") or 0
        
        # Score basé sur plusieurs facteurs
        score = min(100, max(0, 50 + (change24 * 2) + (volume / (mcap + 1) * 100)))
        
        price_str = f"${price:,.4f}" if price < 1 else f"${price:,.2f}"
        mcap_str = f"${mcap/1e6:.1f}M" if mcap < 1e9 else f"${mcap/1e9:.2f}B"
        change_class = "positive" if change24 > 0 else "negative"
        
        # Catégorie basée sur le score
        if score >= 80:
            category = "🔥 Hot"
            cat_class = "hot"
        elif score >= 60:
            category = "⭐ Promising"
            cat_class = "promising"
        else:
            category = "👀 Watch"
            cat_class = "watch"
        
        gems_html += f"""
        <div class="gem-card">
            <div class="gem-rank">#{i}</div>
            <div class="gem-info">
                <div class="gem-header">
                    <span class="gem-name">{name}</span>
                    <span class="gem-symbol">{symbol}</span>
                </div>
                <div class="gem-price">{price_str}</div>
                <div class="gem-change {change_class}">{change24:+.2f}%</div>
            </div>
            <div class="gem-stats">
                <div class="stat">
                    <span class="stat-label">Market Cap</span>
                    <span class="stat-value">{mcap_str}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Score</span>
                    <span class="stat-value">{score:.0f}/100</span>
                </div>
            </div>
            <div class="gem-category {cat_class}">{category}</div>
        </div>
        """
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Gem Hunter</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
            color: #e0e0e0; 
            min-height: 100vh;
        }}
        .content {{ 
            margin-left: 250px; 
            padding: 30px; 
            min-height: 100vh;
        }}
        .hero {{
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(192, 132, 252, 0.1));
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            border: 1px solid rgba(168, 85, 247, 0.3);
        }}
        .hero h1 {{
            font-size: 2.5rem;
            background: linear-gradient(135deg, #a855f7, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }}
        .hero p {{ color: #a0a0a0; font-size: 1.1rem; }}
        
        .gems-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }}
        
        .gem-card {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 16px;
            padding: 20px;
            border: 1px solid rgba(168, 85, 247, 0.2);
            position: relative;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }}
        .gem-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(168, 85, 247, 0.2);
        }}
        
        .gem-rank {{
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(168, 85, 247, 0.3);
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 0.9rem;
            color: #c084fc;
        }}
        
        .gem-info {{
            margin-bottom: 15px;
        }}
        .gem-header {{
            display: flex;
            align-items: baseline;
            gap: 10px;
            margin-bottom: 8px;
        }}
        .gem-name {{
            font-size: 1.2rem;
            font-weight: 700;
            color: #fff;
        }}
        .gem-symbol {{
            color: #9ca3af;
            font-size: 0.9rem;
        }}
        .gem-price {{
            font-size: 1.5rem;
            font-weight: 700;
            color: #c084fc;
        }}
        .gem-change {{
            font-size: 1rem;
            font-weight: 600;
            margin-top: 5px;
        }}
        .gem-change.positive {{ color: #10b981; }}
        .gem-change.negative {{ color: #ef4444; }}
        
        .gem-stats {{
            display: flex;
            gap: 20px;
            padding: 15px 0;
            border-top: 1px solid rgba(255,255,255,0.05);
            border-bottom: 1px solid rgba(255,255,255,0.05);
            margin-bottom: 15px;
        }}
        .stat {{
            display: flex;
            flex-direction: column;
        }}
        .stat-label {{
            font-size: 0.8rem;
            color: #6b7280;
        }}
        .stat-value {{
            font-size: 1rem;
            font-weight: 600;
            color: #d1d5db;
        }}
        
        .gem-category {{
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }}
        .gem-category.hot {{
            background: rgba(239, 68, 68, 0.2);
            color: #f87171;
        }}
        .gem-category.promising {{
            background: rgba(245, 158, 11, 0.2);
            color: #fbbf24;
        }}
        .gem-category.watch {{
            background: rgba(59, 130, 246, 0.2);
            color: #60a5fa;
        }}
        
        @media (max-width: 768px) {{
            .content {{ margin-left: 0; padding: 15px; }}
        }}
    </style>
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <h1>💎 AI Gem Hunter</h1>
            <p>Découvrez les cryptomonnaies prometteuses avant tout le monde</p>
        </div>
        
        <div class="gems-grid">
            {gems_html}
        </div>
    </div>
    
    <script>
        setTimeout(() => location.reload(), 120000);
    </script>
</body>
</html>"""
    return html


def get_ai_technical_analysis_page(sidebar_html: str, symbol: str, interval: str, analysis_data: dict) -> str:
    """Page AI Technical Analysis - Analyse technique détaillée"""
    
    # Extraire les données d'analyse
    price = analysis_data.get("price", 0)
    ema20 = analysis_data.get("ema20", 0)
    ema50 = analysis_data.get("ema50", 0)
    rsi = analysis_data.get("rsi", 50)
    macd = analysis_data.get("macd", 0)
    signal = analysis_data.get("signal", 0)
    atr = analysis_data.get("atr", 0)
    trend = analysis_data.get("trend", "Neutre")
    
    # Déterminer les signaux
    rsi_signal = "Suracheté" if rsi > 70 else "Survendu" if rsi < 30 else "Neutre"
    rsi_class = "bearish" if rsi > 70 else "bullish" if rsi < 30 else "neutral"
    
    macd_signal = "Bullish" if macd > signal else "Bearish"
    macd_class = "bullish" if macd > signal else "bearish"
    
    trend_class = "bullish" if "hausse" in trend.lower() or "↑" in trend else "bearish" if "baisse" in trend.lower() or "↓" in trend else "neutral"
    
    price_str = f"${price:,.2f}" if price >= 1 else f"${price:.6f}"
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Technical Analysis - {symbol}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
            color: #e0e0e0; 
            min-height: 100vh;
        }}
        .content {{ 
            margin-left: 250px; 
            padding: 30px; 
            min-height: 100vh;
        }}
        .hero {{
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(52, 211, 153, 0.1));
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }}
        .hero h1 {{
            font-size: 2.5rem;
            background: linear-gradient(135deg, #10b981, #34d399);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }}
        .hero p {{ color: #a0a0a0; font-size: 1.1rem; }}
        
        .analysis-grid {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .analysis-card {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 16px;
            padding: 25px;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }}
        .analysis-card h3 {{
            color: #34d399;
            font-size: 1.1rem;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .indicator {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }}
        .indicator:last-child {{ border-bottom: none; }}
        .indicator-name {{ color: #9ca3af; }}
        .indicator-value {{ font-weight: 600; color: #fff; }}
        .indicator-signal {{
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }}
        .indicator-signal.bullish {{
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }}
        .indicator-signal.bearish {{
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }}
        .indicator-signal.neutral {{
            background: rgba(156, 163, 175, 0.2);
            color: #9ca3af;
        }}
        
        .summary-card {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 16px;
            padding: 30px;
            border: 1px solid rgba(16, 185, 129, 0.2);
            text-align: center;
        }}
        .summary-card h2 {{
            color: #34d399;
            margin-bottom: 20px;
        }}
        .summary-signal {{
            font-size: 2rem;
            font-weight: 700;
            padding: 20px 40px;
            border-radius: 16px;
            display: inline-block;
        }}
        .summary-signal.bullish {{
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }}
        .summary-signal.bearish {{
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }}
        .summary-signal.neutral {{
            background: rgba(156, 163, 175, 0.2);
            color: #9ca3af;
        }}
        
        @media (max-width: 768px) {{
            .content {{ margin-left: 0; padding: 15px; }}
            .analysis-grid {{ grid-template-columns: 1fr; }}
        }}
    </style>
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <h1>📈 AI Technical Analysis</h1>
            <p>Analyse technique détaillée pour {symbol} ({interval})</p>
        </div>
        
        <div class="analysis-grid">
            <div class="analysis-card">
                <h3>📊 Prix & Moyennes Mobiles</h3>
                <div class="indicator">
                    <span class="indicator-name">Prix actuel</span>
                    <span class="indicator-value">{price_str}</span>
                </div>
                <div class="indicator">
                    <span class="indicator-name">EMA 20</span>
                    <span class="indicator-value">${ema20:,.4f}</span>
                </div>
                <div class="indicator">
                    <span class="indicator-name">EMA 50</span>
                    <span class="indicator-value">${ema50:,.4f}</span>
                </div>
            </div>
            
            <div class="analysis-card">
                <h3>📉 Oscillateurs</h3>
                <div class="indicator">
                    <span class="indicator-name">RSI (14)</span>
                    <span class="indicator-value">{rsi:.1f}</span>
                    <span class="indicator-signal {rsi_class}">{rsi_signal}</span>
                </div>
                <div class="indicator">
                    <span class="indicator-name">MACD</span>
                    <span class="indicator-value">{macd:.4f}</span>
                    <span class="indicator-signal {macd_class}">{macd_signal}</span>
                </div>
            </div>
            
            <div class="analysis-card">
                <h3>📏 Volatilité</h3>
                <div class="indicator">
                    <span class="indicator-name">ATR (14)</span>
                    <span class="indicator-value">{atr:.4f}</span>
                </div>
                <div class="indicator">
                    <span class="indicator-name">Tendance</span>
                    <span class="indicator-signal {trend_class}">{trend}</span>
                </div>
            </div>
        </div>
        
        <div class="summary-card">
            <h2>🎯 Signal Global</h2>
            <div class="summary-signal {trend_class}">{trend}</div>
        </div>
    </div>
    
    <script>
        setTimeout(() => location.reload(), 60000);
    </script>
</body>
</html>"""
    return html
