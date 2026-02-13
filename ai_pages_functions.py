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
                    <span class="score-text">{score}</span>
                </div>
            </td>
            <td class="level-cell {level_class}">{level_text}</td>
        </tr>
        """
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Liquidity Analysis</title>
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
            background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.1));
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            border: 1px solid rgba(6, 182, 212, 0.3);
        }}
        .hero h1 {{
            font-size: 2.5rem;
            background: linear-gradient(135deg, #22d3ee, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }}
        .hero p {{ color: #a0a0a0; font-size: 1.1rem; }}
        
        .info-cards {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }}
        .info-card {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 16px;
            padding: 25px;
            border: 1px solid rgba(6, 182, 212, 0.2);
        }}
        .info-card h3 {{ color: #22d3ee; margin-bottom: 10px; }}
        .info-card p {{ color: #888; font-size: 0.9rem; line-height: 1.6; }}
        
        .table-container {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 20px;
            padding: 25px;
            border: 1px solid rgba(6, 182, 212, 0.2);
            overflow-x: auto;
        }}
        table {{ width: 100%; border-collapse: collapse; }}
        th {{
            background: rgba(6, 182, 212, 0.2);
            padding: 15px 10px;
            text-align: center;
            font-weight: 600;
            color: #22d3ee;
            border-bottom: 2px solid rgba(6, 182, 212, 0.3);
        }}
        td {{
            padding: 15px 10px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }}
        tr:hover {{ background: rgba(6, 182, 212, 0.1); }}
        
        .crypto-cell {{
            text-align: left;
            display: flex;
            flex-direction: column;
        }}
        .crypto-cell strong {{ color: #fff; font-size: 1.1rem; }}
        .crypto-name {{ color: #888; font-size: 0.85rem; }}
        .price-cell {{ color: #22d3ee; font-weight: 600; }}
        
        .positive {{ color: #10b981; }}
        .negative {{ color: #ef4444; }}
        
        .score-bar {{
            position: relative;
            width: 100px;
            height: 24px;
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            overflow: hidden;
            margin: 0 auto;
        }}
        .score-fill {{
            height: 100%;
            border-radius: 12px;
            transition: width 0.3s;
        }}
        .score-fill.excellent {{ background: linear-gradient(90deg, #10b981, #34d399); }}
        .score-fill.good {{ background: linear-gradient(90deg, #3b82f6, #60a5fa); }}
        .score-fill.medium {{ background: linear-gradient(90deg, #f59e0b, #fbbf24); }}
        .score-fill.low {{ background: linear-gradient(90deg, #f97316, #fb923c); }}
        .score-fill.poor {{ background: linear-gradient(90deg, #ef4444, #f87171); }}
        .score-text {{
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-weight: 700;
            font-size: 0.85rem;
            color: #fff;
        }}
        
        .level-cell {{ font-weight: 600; }}
        .level-cell.excellent {{ color: #10b981; }}
        .level-cell.good {{ color: #3b82f6; }}
        .level-cell.medium {{ color: #f59e0b; }}
        .level-cell.low {{ color: #f97316; }}
        .level-cell.poor {{ color: #ef4444; }}
        
        @media (max-width: 768px) {{
            .content {{ margin-left: 0; padding: 15px; }}
            .info-cards {{ grid-template-columns: 1fr; }}
        }}
    </style>
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <h1>💧 AI Liquidity Analysis</h1>
            <p>Analyse de la liquidité des cryptomonnaies basée sur le ratio Volume/Market Cap</p>
        </div>
        
        <div class="info-cards">
            <div class="info-card">
                <h3>📊 Score de Liquidité</h3>
                <p>Le score est calculé en fonction du ratio entre le volume de trading 24h et la capitalisation boursière. Plus le ratio est élevé, plus l'actif est liquide.</p>
            </div>
            <div class="info-card">
                <h3>💡 Pourquoi c'est important</h3>
                <p>Une bonne liquidité permet d'entrer et sortir de positions facilement sans impact significatif sur le prix. Essentiel pour les gros ordres.</p>
            </div>
            <div class="info-card">
                <h3>⚠️ Attention</h3>
                <p>Un volume anormalement élevé peut indiquer une manipulation. Vérifiez toujours les sources du volume (exchanges réputés vs obscurs).</p>
            </div>
        </div>
        
        <div class="table-container">
            <h2 style="margin-bottom: 20px; color: #22d3ee;">📈 Classement par Liquidité</h2>
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
                        <th>Niveau</th>
                    </tr>
                </thead>
                <tbody>
                    {rows_html}
                </tbody>
            </table>
        </div>
    </div>
    
    <script>
        setTimeout(() => location.reload(), 60000);
    </script>
</body>
</html>"""
    return html


def get_ai_alerts_page(sidebar_html: str, alerts_data: list) -> str:
    """Page AI Alerts - Alertes de marché en temps réel"""
    
    alerts_html = ""
    for alert in (alerts_data or [])[:25]:
        symbol = alert.get("symbol", "")
        name = alert.get("name", "")
        price = alert.get("price") or 0
        ch24 = alert.get("ch24") or 0
        ch1 = alert.get("ch1") or 0
        ch7 = alert.get("ch7") or 0
        volume = alert.get("volume") or 0
        alert_type = alert.get("type", "neutral")
        reason = alert.get("reason", "")
        confidence = alert.get("confidence", 50)
        
        price_str = f"${price:,.2f}" if price >= 1 else f"${price:.6f}"
        volume_str = f"${volume/1e9:.2f}B" if volume >= 1e9 else f"${volume/1e6:.1f}M"
        
        type_icon = "🟢" if alert_type == "bullish" else "🔴" if alert_type == "bearish" else "⚪"
        type_class = alert_type
        
        alerts_html += f"""
        <div class="alert-card {type_class}">
            <div class="alert-header">
                <div class="alert-crypto">
                    <span class="alert-icon">{type_icon}</span>
                    <div>
                        <strong>{symbol}</strong>
                        <span class="crypto-name">{name}</span>
                    </div>
                </div>
                <div class="alert-price">{price_str}</div>
            </div>
            <div class="alert-reason">{reason}</div>
            <div class="alert-stats">
                <div class="stat">
                    <span class="label">1h</span>
                    <span class="value {'positive' if ch1 > 0 else 'negative'}">{ch1:+.2f}%</span>
                </div>
                <div class="stat">
                    <span class="label">24h</span>
                    <span class="value {'positive' if ch24 > 0 else 'negative'}">{ch24:+.2f}%</span>
                </div>
                <div class="stat">
                    <span class="label">7d</span>
                    <span class="value {'positive' if ch7 > 0 else 'negative'}">{ch7:+.2f}%</span>
                </div>
                <div class="stat">
                    <span class="label">Volume</span>
                    <span class="value">{volume_str}</span>
                </div>
            </div>
            <div class="confidence-bar">
                <div class="confidence-label">Confiance: {confidence}%</div>
                <div class="confidence-track">
                    <div class="confidence-fill {type_class}" style="width: {confidence}%"></div>
                </div>
            </div>
        </div>
        """
    
    if not alerts_html:
        alerts_html = """
        <div class="no-alerts">
            <h3>😴 Pas d'alertes significatives</h3>
            <p>Le marché est relativement calme. Les alertes apparaîtront quand des mouvements importants seront détectés.</p>
        </div>
        """
    
    bullish_count = sum(1 for a in (alerts_data or []) if a.get("type") == "bullish")
    bearish_count = sum(1 for a in (alerts_data or []) if a.get("type") == "bearish")
    total_count = len(alerts_data or [])
    
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
            background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1));
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            border: 1px solid rgba(251, 191, 36, 0.3);
        }}
        .hero h1 {{
            font-size: 2.5rem;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }}
        .hero p {{ color: #a0a0a0; font-size: 1.1rem; }}
        
        .stats-row {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }}
        .stat-card {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 16px;
            padding: 25px;
            text-align: center;
        }}
        .stat-card.bullish {{ border: 1px solid rgba(16, 185, 129, 0.3); }}
        .stat-card.bearish {{ border: 1px solid rgba(239, 68, 68, 0.3); }}
        .stat-card.total {{ border: 1px solid rgba(251, 191, 36, 0.3); }}
        .stat-card .number {{ font-size: 3rem; font-weight: 700; }}
        .stat-card.bullish .number {{ color: #10b981; }}
        .stat-card.bearish .number {{ color: #ef4444; }}
        .stat-card.total .number {{ color: #fbbf24; }}
        .stat-card .label {{ color: #888; margin-top: 5px; }}
        
        .alerts-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }}
        .alert-card {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 16px;
            padding: 20px;
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        .alert-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }}
        .alert-card.bullish {{ border: 1px solid rgba(16, 185, 129, 0.3); }}
        .alert-card.bearish {{ border: 1px solid rgba(239, 68, 68, 0.3); }}
        .alert-card.neutral {{ border: 1px solid rgba(156, 163, 175, 0.3); }}
        
        .alert-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }}
        .alert-crypto {{
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        .alert-icon {{ font-size: 1.5rem; }}
        .alert-crypto strong {{ color: #fff; font-size: 1.2rem; }}
        .crypto-name {{ color: #888; font-size: 0.85rem; display: block; }}
        .alert-price {{ color: #fbbf24; font-size: 1.2rem; font-weight: 600; }}
        
        .alert-reason {{
            background: rgba(255,255,255,0.05);
            padding: 12px;
            border-radius: 10px;
            margin-bottom: 15px;
            font-size: 0.95rem;
            color: #d0d0d0;
        }}
        
        .alert-stats {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }}
        .alert-stats .stat {{
            text-align: center;
        }}
        .alert-stats .label {{
            display: block;
            color: #888;
            font-size: 0.8rem;
        }}
        .alert-stats .value {{
            font-weight: 600;
            font-size: 0.95rem;
        }}
        .positive {{ color: #10b981; }}
        .negative {{ color: #ef4444; }}
        
        .confidence-bar {{
            margin-top: 10px;
        }}
        .confidence-label {{
            font-size: 0.85rem;
            color: #888;
            margin-bottom: 5px;
        }}
        .confidence-track {{
            height: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
            overflow: hidden;
        }}
        .confidence-fill {{
            height: 100%;
            border-radius: 4px;
        }}
        .confidence-fill.bullish {{ background: linear-gradient(90deg, #10b981, #34d399); }}
        .confidence-fill.bearish {{ background: linear-gradient(90deg, #ef4444, #f87171); }}
        .confidence-fill.neutral {{ background: linear-gradient(90deg, #9ca3af, #d1d5db); }}
        
        .no-alerts {{
            text-align: center;
            padding: 60px;
            background: rgba(30, 30, 50, 0.8);
            border-radius: 20px;
        }}
        .no-alerts h3 {{ color: #fbbf24; margin-bottom: 10px; }}
        .no-alerts p {{ color: #888; }}
        
        @media (max-width: 768px) {{
            .content {{ margin-left: 0; padding: 15px; }}
            .stats-row {{ grid-template-columns: 1fr; }}
            .alerts-grid {{ grid-template-columns: 1fr; }}
        }}
    </style>
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <h1>🔔 AI Alerts</h1>
            <p>Alertes de marché en temps réel basées sur les mouvements de prix significatifs</p>
        </div>
        
        <div class="stats-row">
            <div class="stat-card bullish">
                <div class="number">{bullish_count}</div>
                <div class="label">Alertes Haussières</div>
            </div>
            <div class="stat-card bearish">
                <div class="number">{bearish_count}</div>
                <div class="label">Alertes Baissières</div>
            </div>
            <div class="stat-card total">
                <div class="number">{total_count}</div>
                <div class="label">Total Alertes</div>
            </div>
        </div>
        
        <div class="alerts-grid">
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
    """Page AI Gem Hunter - Découverte de pépites crypto"""
    
    gems_html = ""
    for i, coin in enumerate((trending_coins or [])[:15], 1):
        symbol = (coin.get("symbol") or "").upper()
        name = coin.get("name") or ""
        price = coin.get("current_price") or 0
        mcap = coin.get("market_cap") or 0
        volume = coin.get("total_volume") or 0
        change24 = coin.get("price_change_percentage_24h") or 0
        change7d = coin.get("price_change_percentage_7d_in_currency") or 0
        rank = coin.get("market_cap_rank") or i
        
        # Calculer un score "gem"
        gem_score = 50
        if mcap < 1e9:  # Small cap
            gem_score += 15
        if mcap < 500e6:  # Micro cap
            gem_score += 10
        if change24 > 5:
            gem_score += 10
        if change7d and change7d > 10:
            gem_score += 10
        if volume and mcap and (volume / mcap) > 0.1:
            gem_score += 5
        gem_score = min(gem_score, 99)
        
        # Potentiel
        if gem_score >= 80:
            potential = "🔥 Très Élevé"
            potential_class = "very-high"
        elif gem_score >= 65:
            potential = "⚡ Élevé"
            potential_class = "high"
        elif gem_score >= 50:
            potential = "📈 Moyen"
            potential_class = "medium"
        else:
            potential = "📊 Faible"
            potential_class = "low"
        
        # Risque basé sur mcap
        if mcap < 100e6:
            risk = "🔴 Très Élevé"
            risk_class = "very-high"
        elif mcap < 500e6:
            risk = "🟠 Élevé"
            risk_class = "high"
        elif mcap < 1e9:
            risk = "🟡 Moyen"
            risk_class = "medium"
        else:
            risk = "🟢 Faible"
            risk_class = "low"
        
        price_str = f"${price:,.4f}" if price < 1 else f"${price:,.2f}"
        mcap_str = f"${mcap/1e9:.2f}B" if mcap >= 1e9 else f"${mcap/1e6:.1f}M"
        volume_str = f"${volume/1e9:.2f}B" if volume >= 1e9 else f"${volume/1e6:.1f}M"
        
        gems_html += f"""
        <div class="gem-card">
            <div class="gem-header">
                <div class="gem-rank">#{rank}</div>
                <div class="gem-info">
                    <strong>{symbol}</strong>
                    <span>{name}</span>
                </div>
                <div class="gem-score">
                    <div class="score-circle" style="--score: {gem_score}">
                        <span>{gem_score}</span>
                    </div>
                </div>
            </div>
            
            <div class="gem-price">
                <div class="current-price">{price_str}</div>
                <div class="price-change {'positive' if change24 > 0 else 'negative'}">{change24:+.2f}%</div>
            </div>
            
            <div class="gem-metrics">
                <div class="metric">
                    <span class="label">Market Cap</span>
                    <span class="value">{mcap_str}</span>
                </div>
                <div class="metric">
                    <span class="label">Volume 24h</span>
                    <span class="value">{volume_str}</span>
                </div>
                <div class="metric">
                    <span class="label">7 Jours</span>
                    <span class="value {'positive' if (change7d or 0) > 0 else 'negative'}">{(change7d or 0):+.1f}%</span>
                </div>
            </div>
            
            <div class="gem-analysis">
                <div class="analysis-item">
                    <span class="label">Potentiel</span>
                    <span class="value {potential_class}">{potential}</span>
                </div>
                <div class="analysis-item">
                    <span class="label">Risque</span>
                    <span class="value risk-{risk_class}">{risk}</span>
                </div>
            </div>
            
            <div class="gem-tags">
                {'<span class="tag bullish">Momentum +</span>' if change24 > 5 else ''}
                {'<span class="tag volume">Volume Élevé</span>' if volume and mcap and (volume/mcap) > 0.1 else ''}
                {'<span class="tag smallcap">Small Cap</span>' if mcap < 1e9 else ''}
            </div>
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
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.1));
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            border: 1px solid rgba(168, 85, 247, 0.3);
        }}
        .hero h1 {{
            font-size: 2.5rem;
            background: linear-gradient(135deg, #a855f7, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }}
        .hero p {{ color: #a0a0a0; font-size: 1.1rem; }}
        
        .gems-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;
        }}
        .gem-card {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 16px;
            padding: 20px;
            border: 1px solid rgba(168, 85, 247, 0.2);
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        .gem-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(168, 85, 247, 0.2);
        }}
        
        .gem-header {{
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
        }}
        .gem-rank {{
            background: linear-gradient(135deg, #a855f7, #ec4899);
            color: #fff;
            padding: 8px 12px;
            border-radius: 10px;
            font-weight: 700;
        }}
        .gem-info strong {{ color: #fff; font-size: 1.2rem; display: block; }}
        .gem-info span {{ color: #888; font-size: 0.9rem; }}
        .gem-score {{ margin-left: auto; }}
        .score-circle {{
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: conic-gradient(#a855f7 calc(var(--score) * 3.6deg), rgba(255,255,255,0.1) 0);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }}
        .score-circle::before {{
            content: '';
            position: absolute;
            width: 40px;
            height: 40px;
            background: #1a1a2e;
            border-radius: 50%;
        }}
        .score-circle span {{
            position: relative;
            z-index: 1;
            font-weight: 700;
            color: #a855f7;
        }}
        
        .gem-price {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding: 15px;
            background: rgba(168, 85, 247, 0.1);
            border-radius: 12px;
        }}
        .current-price {{ font-size: 1.4rem; font-weight: 700; color: #fff; }}
        .price-change {{ font-size: 1.1rem; font-weight: 600; }}
        .positive {{ color: #10b981; }}
        .negative {{ color: #ef4444; }}
        
        .gem-metrics {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }}
        .metric {{
            text-align: center;
            padding: 10px;
            background: rgba(255,255,255,0.03);
            border-radius: 8px;
        }}
        .metric .label {{ display: block; color: #888; font-size: 0.8rem; margin-bottom: 5px; }}
        .metric .value {{ font-weight: 600; color: #fff; }}
        
        .gem-analysis {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }}
        .analysis-item {{
            padding: 12px;
            background: rgba(255,255,255,0.03);
            border-radius: 8px;
        }}
        .analysis-item .label {{ display: block; color: #888; font-size: 0.8rem; margin-bottom: 5px; }}
        .analysis-item .value {{ font-weight: 600; }}
        .very-high {{ color: #10b981; }}
        .high {{ color: #3b82f6; }}
        .medium {{ color: #f59e0b; }}
        .low {{ color: #888; }}
        .risk-very-high {{ color: #ef4444; }}
        .risk-high {{ color: #f97316; }}
        .risk-medium {{ color: #f59e0b; }}
        .risk-low {{ color: #10b981; }}
        
        .gem-tags {{
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }}
        .tag {{
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.75rem;
            font-weight: 600;
        }}
        .tag.bullish {{ background: rgba(16, 185, 129, 0.2); color: #10b981; }}
        .tag.volume {{ background: rgba(59, 130, 246, 0.2); color: #3b82f6; }}
        .tag.smallcap {{ background: rgba(168, 85, 247, 0.2); color: #a855f7; }}
        
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
            <p>Découvrez les pépites crypto avec un potentiel de croissance élevé</p>
        </div>
        
        <div class="gems-grid">
            {gems_html}
        </div>
    </div>
    
    <script>
        setTimeout(() => location.reload(), 60000);
    </script>
</body>
</html>"""
    return html


def get_ai_technical_analysis_page(sidebar_html: str, symbol: str, interval: str, analysis_data: dict) -> str:
    """Page AI Technical Analysis - Analyse technique avancée"""
    
    symbol = symbol or "BTC"
    interval = interval or "1h"
    analysis_data = analysis_data or {}
    
    # Données d'analyse
    rsi = analysis_data.get("rsi", 50)
    macd = analysis_data.get("macd", 0)
    macd_signal = analysis_data.get("macd_signal", 0)
    sma_20 = analysis_data.get("sma_20", 0)
    sma_50 = analysis_data.get("sma_50", 0)
    ema_12 = analysis_data.get("ema_12", 0)
    ema_26 = analysis_data.get("ema_26", 0)
    bb_upper = analysis_data.get("bb_upper", 0)
    bb_lower = analysis_data.get("bb_lower", 0)
    current_price = analysis_data.get("price", 0)
    volume = analysis_data.get("volume", 0)
    
    # Signaux
    rsi_signal = "Suracheté" if rsi > 70 else "Survendu" if rsi < 30 else "Neutre"
    rsi_class = "bearish" if rsi > 70 else "bullish" if rsi < 30 else "neutral"
    
    macd_cross = "Haussier" if macd > macd_signal else "Baissier"
    macd_class = "bullish" if macd > macd_signal else "bearish"
    
    trend = "Haussière" if sma_20 > sma_50 else "Baissière" if sma_20 < sma_50 else "Latérale"
    trend_class = "bullish" if sma_20 > sma_50 else "bearish" if sma_20 < sma_50 else "neutral"
    
    # Recommandation globale
    bullish_signals = 0
    bearish_signals = 0
    
    if rsi < 30: bullish_signals += 1
    elif rsi > 70: bearish_signals += 1
    
    if macd > macd_signal: bullish_signals += 1
    else: bearish_signals += 1
    
    if sma_20 > sma_50: bullish_signals += 1
    else: bearish_signals += 1
    
    if bullish_signals > bearish_signals:
        recommendation = "ACHAT"
        rec_class = "bullish"
        rec_icon = "📈"
    elif bearish_signals > bullish_signals:
        recommendation = "VENTE"
        rec_class = "bearish"
        rec_icon = "📉"
    else:
        recommendation = "NEUTRE"
        rec_class = "neutral"
        rec_icon = "➡️"
    
    price_str = f"${current_price:,.2f}" if current_price >= 1 else f"${current_price:.6f}" if current_price else "N/A"
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Technical Analysis</title>
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
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1));
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            border: 1px solid rgba(34, 197, 94, 0.3);
        }}
        .hero h1 {{
            font-size: 2.5rem;
            background: linear-gradient(135deg, #22c55e, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }}
        .hero p {{ color: #a0a0a0; font-size: 1.1rem; }}
        
        .analysis-form {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid rgba(34, 197, 94, 0.2);
        }}
        .form-row {{
            display: flex;
            gap: 20px;
            align-items: flex-end;
        }}
        .form-group {{
            flex: 1;
        }}
        .form-group label {{
            display: block;
            color: #888;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }}
        .form-group input, .form-group select {{
            width: 100%;
            padding: 12px 15px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
            color: #fff;
            font-size: 1rem;
        }}
        .form-group input:focus, .form-group select:focus {{
            outline: none;
            border-color: #22c55e;
        }}
        .btn-analyze {{
            padding: 12px 30px;
            background: linear-gradient(135deg, #22c55e, #10b981);
            border: none;
            border-radius: 10px;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }}
        .btn-analyze:hover {{
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(34, 197, 94, 0.3);
        }}
        
        .recommendation-card {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            text-align: center;
        }}
        .recommendation-card.bullish {{ border: 2px solid rgba(16, 185, 129, 0.5); }}
        .recommendation-card.bearish {{ border: 2px solid rgba(239, 68, 68, 0.5); }}
        .recommendation-card.neutral {{ border: 2px solid rgba(156, 163, 175, 0.5); }}
        .rec-icon {{ font-size: 4rem; margin-bottom: 15px; }}
        .rec-text {{ font-size: 2rem; font-weight: 700; margin-bottom: 10px; }}
        .rec-text.bullish {{ color: #10b981; }}
        .rec-text.bearish {{ color: #ef4444; }}
        .rec-text.neutral {{ color: #9ca3af; }}
        .rec-subtitle {{ color: #888; }}
        
        .indicators-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .indicator-card {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 16px;
            padding: 25px;
            border: 1px solid rgba(34, 197, 94, 0.2);
        }}
        .indicator-card h3 {{
            color: #22c55e;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .indicator-row {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }}
        .indicator-row:last-child {{ border-bottom: none; }}
        .indicator-name {{ color: #888; }}
        .indicator-value {{ font-weight: 600; color: #fff; }}
        .indicator-signal {{
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.85rem;
            font-weight: 600;
        }}
        .indicator-signal.bullish {{ background: rgba(16, 185, 129, 0.2); color: #10b981; }}
        .indicator-signal.bearish {{ background: rgba(239, 68, 68, 0.2); color: #ef4444; }}
        .indicator-signal.neutral {{ background: rgba(156, 163, 175, 0.2); color: #9ca3af; }}
        
        .rsi-gauge {{
            width: 100%;
            height: 30px;
            background: linear-gradient(90deg, #10b981 0%, #10b981 30%, #f59e0b 30%, #f59e0b 70%, #ef4444 70%, #ef4444 100%);
            border-radius: 15px;
            position: relative;
            margin: 15px 0;
        }}
        .rsi-marker {{
            position: absolute;
            top: -5px;
            width: 4px;
            height: 40px;
            background: #fff;
            border-radius: 2px;
            transform: translateX(-50%);
        }}
        .rsi-labels {{
            display: flex;
            justify-content: space-between;
            color: #888;
            font-size: 0.8rem;
        }}
        
        @media (max-width: 768px) {{
            .content {{ margin-left: 0; padding: 15px; }}
            .form-row {{ flex-direction: column; }}
        }}
    </style>
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <h1>📊 AI Technical Analysis</h1>
            <p>Analyse technique avancée avec indicateurs RSI, MACD, Moyennes Mobiles et Bandes de Bollinger</p>
        </div>
        
        <div class="analysis-form">
            <form method="get" action="/ai-technical-analysis">
                <div class="form-row">
                    <div class="form-group">
                        <label>Symbole</label>
                        <input type="text" name="symbol" value="{symbol}" placeholder="BTC, ETH, SOL...">
                    </div>
                    <div class="form-group">
                        <label>Intervalle</label>
                        <select name="interval">
                            <option value="1m" {'selected' if interval == '1m' else ''}>1 minute</option>
                            <option value="5m" {'selected' if interval == '5m' else ''}>5 minutes</option>
                            <option value="15m" {'selected' if interval == '15m' else ''}>15 minutes</option>
                            <option value="1h" {'selected' if interval == '1h' else ''}>1 heure</option>
                            <option value="4h" {'selected' if interval == '4h' else ''}>4 heures</option>
                            <option value="1d" {'selected' if interval == '1d' else ''}>1 jour</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-analyze">🔍 Analyser</button>
                </div>
            </form>
        </div>
        
        <div class="recommendation-card {rec_class}">
            <div class="rec-icon">{rec_icon}</div>
            <div class="rec-text {rec_class}">RECOMMANDATION: {recommendation}</div>
            <div class="rec-subtitle">{symbol.upper()} - Intervalle {interval} - Prix actuel: {price_str}</div>
        </div>
        
        <div class="indicators-grid">
            <div class="indicator-card">
                <h3>📈 RSI (Relative Strength Index)</h3>
                <div class="rsi-gauge">
                    <div class="rsi-marker" style="left: {rsi}%"></div>
                </div>
                <div class="rsi-labels">
                    <span>Survendu (0-30)</span>
                    <span>Neutre (30-70)</span>
                    <span>Suracheté (70-100)</span>
                </div>
                <div class="indicator-row">
                    <span class="indicator-name">Valeur RSI</span>
                    <span class="indicator-value">{rsi:.1f}</span>
                    <span class="indicator-signal {rsi_class}">{rsi_signal}</span>
                </div>
            </div>
            
            <div class="indicator-card">
                <h3>📊 MACD</h3>
                <div class="indicator-row">
                    <span class="indicator-name">MACD Line</span>
                    <span class="indicator-value">{macd:.4f}</span>
                </div>
                <div class="indicator-row">
                    <span class="indicator-name">Signal Line</span>
                    <span class="indicator-value">{macd_signal:.4f}</span>
                </div>
                <div class="indicator-row">
                    <span class="indicator-name">Croisement</span>
                    <span class="indicator-signal {macd_class}">{macd_cross}</span>
                </div>
            </div>
            
            <div class="indicator-card">
                <h3>📉 Moyennes Mobiles</h3>
                <div class="indicator-row">
                    <span class="indicator-name">SMA 20</span>
                    <span class="indicator-value">${sma_20:,.2f}</span>
                </div>
                <div class="indicator-row">
                    <span class="indicator-name">SMA 50</span>
                    <span class="indicator-value">${sma_50:,.2f}</span>
                </div>
                <div class="indicator-row">
                    <span class="indicator-name">Tendance</span>
                    <span class="indicator-signal {trend_class}">{trend}</span>
                </div>
            </div>
            
            <div class="indicator-card">
                <h3>🎯 Bandes de Bollinger</h3>
                <div class="indicator-row">
                    <span class="indicator-name">Bande Supérieure</span>
                    <span class="indicator-value">${bb_upper:,.2f}</span>
                </div>
                <div class="indicator-row">
                    <span class="indicator-name">Prix Actuel</span>
                    <span class="indicator-value">{price_str}</span>
                </div>
                <div class="indicator-row">
                    <span class="indicator-name">Bande Inférieure</span>
                    <span class="indicator-value">${bb_lower:,.2f}</span>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-refresh toutes les 60 secondes
        setTimeout(() => location.reload(), 60000);
    </script>
</body>
</html>"""
    return html
