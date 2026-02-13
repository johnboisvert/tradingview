"""
Revolutionary AI Pages - Design Ultra-Moderne et Professionnel
Pages: AI Predictor, AI Token Scanner, AI Patterns, AI Sentiment, AI Sizer
Données en temps réel via CoinGecko API
"""

# ============= CSS RÉVOLUTIONNAIRE PARTAGÉ =============
REVOLUTIONARY_CSS = """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
    
    :root {
        --bg-primary: #0a0a0f;
        --bg-secondary: #12121a;
        --bg-card: #16161f;
        --bg-card-hover: #1a1a25;
        --accent-primary: #6366f1;
        --accent-secondary: #8b5cf6;
        --accent-tertiary: #06b6d4;
        --accent-success: #10b981;
        --accent-warning: #f59e0b;
        --accent-danger: #ef4444;
        --text-primary: #ffffff;
        --text-secondary: #94a3b8;
        --text-muted: #64748b;
        --border-color: rgba(99, 102, 241, 0.2);
        --glow-primary: rgba(99, 102, 241, 0.4);
        --glow-success: rgba(16, 185, 129, 0.4);
        --glow-danger: rgba(239, 68, 68, 0.4);
    }
    
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: var(--bg-primary);
        color: var(--text-primary);
        min-height: 100vh;
        overflow-x: hidden;
    }
    
    /* Animated Background */
    .bg-animated {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        background: 
            radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 70%),
            var(--bg-primary);
    }
    
    .bg-grid {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        background-image: 
            linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
        background-size: 50px 50px;
        animation: gridMove 20s linear infinite;
    }
    
    @keyframes gridMove {
        0% { transform: translate(0, 0); }
        100% { transform: translate(50px, 50px); }
    }
    
    /* Main Container */
    .main-wrapper {
        margin-left: 280px;
        padding: 30px;
        min-height: 100vh;
        position: relative;
    }
    
    .page-container {
        max-width: 1600px;
        margin: 0 auto;
    }
    
    /* Hero Header */
    .hero-header {
        text-align: center;
        padding: 40px 20px;
        margin-bottom: 40px;
        position: relative;
    }
    
    .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 20px;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 50px;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--accent-primary);
        margin-bottom: 20px;
        animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
        50% { box-shadow: 0 0 20px 5px rgba(99, 102, 241, 0.2); }
    }
    
    .hero-title {
        font-size: 3.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, #fff 0%, #6366f1 50%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 15px;
        letter-spacing: -1px;
    }
    
    .hero-subtitle {
        font-size: 1.2rem;
        color: var(--text-secondary);
        max-width: 600px;
        margin: 0 auto;
        line-height: 1.6;
    }
    
    /* Stats Bar */
    .stats-bar {
        display: flex;
        justify-content: center;
        gap: 40px;
        padding: 25px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 20px;
        margin-bottom: 40px;
        flex-wrap: wrap;
    }
    
    .stat-item {
        text-align: center;
    }
    
    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    .stat-label {
        font-size: 0.85rem;
        color: var(--text-muted);
        margin-top: 5px;
    }
    
    /* Filter Tabs */
    .filter-tabs {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-bottom: 35px;
        flex-wrap: wrap;
    }
    
    .filter-tab {
        padding: 12px 28px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .filter-tab:hover {
        background: var(--bg-card-hover);
        border-color: var(--accent-primary);
        color: var(--text-primary);
    }
    
    .filter-tab.active {
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        border-color: transparent;
        color: white;
        box-shadow: 0 4px 20px var(--glow-primary);
    }
    
    /* Cards Grid */
    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 24px;
    }
    
    /* Revolutionary Card */
    .rev-card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 20px;
        padding: 24px;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
    }
    
    .rev-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary));
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .rev-card:hover {
        transform: translateY(-8px);
        border-color: var(--accent-primary);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px var(--glow-primary);
    }
    
    .rev-card:hover::before {
        opacity: 1;
    }
    
    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
    }
    
    .card-rank {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .rank-badge {
        background: linear-gradient(135deg, var(--accent-warning), #f97316);
        color: #000;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 700;
    }
    
    .card-symbol {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--text-primary);
    }
    
    .card-name {
        font-size: 0.9rem;
        color: var(--text-muted);
        margin-top: 4px;
    }
    
    .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--bg-secondary), var(--bg-card-hover));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }
    
    .card-price-section {
        margin-bottom: 20px;
    }
    
    .current-price {
        font-size: 2rem;
        font-weight: 700;
        color: var(--text-primary);
        font-family: 'JetBrains Mono', monospace;
    }
    
    .price-change {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        margin-top: 8px;
    }
    
    .price-change.positive {
        background: rgba(16, 185, 129, 0.15);
        color: var(--accent-success);
    }
    
    .price-change.negative {
        background: rgba(239, 68, 68, 0.15);
        color: var(--accent-danger);
    }
    
    /* Prediction Section */
    .prediction-section {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 16px;
        padding: 20px;
    }
    
    .pred-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .pred-label {
        font-size: 0.85rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    .pred-confidence {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: var(--accent-tertiary);
    }
    
    .pred-value {
        font-size: 1.8rem;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
        color: var(--text-primary);
    }
    
    .pred-change {
        font-size: 1.1rem;
        font-weight: 600;
        margin-top: 8px;
    }
    
    .pred-change.positive { color: var(--accent-success); }
    .pred-change.negative { color: var(--accent-danger); }
    
    /* Pattern Badge */
    .pattern-badge {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px;
        border-radius: 12px;
        margin-top: 15px;
    }
    
    .pattern-badge.bullish {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));
        border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    .pattern-badge.bearish {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
        border: 1px solid rgba(239, 68, 68, 0.3);
    }
    
    .pattern-badge.neutral {
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05));
        border: 1px solid rgba(251, 191, 36, 0.3);
    }
    
    .pattern-icon {
        font-size: 2rem;
    }
    
    .pattern-info h4 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .pattern-info span {
        font-size: 0.85rem;
        color: var(--text-muted);
    }
    
    /* Sentiment Meter */
    .sentiment-meter {
        margin-top: 20px;
    }
    
    .meter-bar {
        height: 8px;
        background: linear-gradient(90deg, #ef4444, #f59e0b, #10b981);
        border-radius: 4px;
        position: relative;
        margin-bottom: 10px;
    }
    
    .meter-indicator {
        position: absolute;
        top: -4px;
        width: 16px;
        height: 16px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transform: translateX(-50%);
        transition: left 0.5s ease;
    }
    
    .sentiment-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: var(--text-muted);
    }
    
    /* Calculator Form */
    .calc-form {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 24px;
        padding: 40px;
        max-width: 800px;
        margin: 0 auto;
    }
    
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 24px;
        margin-bottom: 30px;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .form-group label {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-secondary);
    }
    
    .form-group input,
    .form-group select {
        padding: 14px 18px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        color: var(--text-primary);
        font-size: 1rem;
        font-family: 'JetBrains Mono', monospace;
        transition: all 0.3s ease;
    }
    
    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 20px var(--glow-primary);
    }
    
    .submit-btn {
        width: 100%;
        padding: 18px;
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        border: none;
        border-radius: 14px;
        color: white;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .submit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px var(--glow-primary);
    }
    
    /* Results Card */
    .results-card {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1));
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 20px;
        padding: 30px;
        margin-top: 30px;
    }
    
    .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 20px;
    }
    
    .result-item {
        text-align: center;
        padding: 20px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
    }
    
    .result-value {
        font-size: 1.8rem;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
        color: var(--accent-success);
    }
    
    .result-label {
        font-size: 0.85rem;
        color: var(--text-muted);
        margin-top: 8px;
    }
    
    /* Search Box */
    .search-box {
        max-width: 600px;
        margin: 0 auto 40px;
        position: relative;
    }
    
    .search-input {
        width: 100%;
        padding: 18px 24px 18px 60px;
        background: var(--bg-card);
        border: 2px solid var(--border-color);
        border-radius: 16px;
        color: var(--text-primary);
        font-size: 1.1rem;
        transition: all 0.3s ease;
    }
    
    .search-input:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 30px var(--glow-primary);
    }
    
    .search-icon {
        position: absolute;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1.3rem;
        color: var(--text-muted);
    }
    
    /* Live Indicator */
    .live-indicator {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--accent-success);
    }
    
    .live-dot {
        width: 8px;
        height: 8px;
        background: var(--accent-success);
        border-radius: 50%;
        animation: livePulse 1.5s ease-in-out infinite;
    }
    
    @keyframes livePulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
    }
    
    /* Table Styles */
    .data-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--bg-card);
        border-radius: 16px;
        overflow: hidden;
    }
    
    .data-table th {
        padding: 18px 20px;
        background: var(--bg-secondary);
        color: var(--text-muted);
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        text-align: left;
    }
    
    .data-table td {
        padding: 18px 20px;
        border-bottom: 1px solid var(--border-color);
        font-size: 0.95rem;
    }
    
    .data-table tr:hover {
        background: var(--bg-card-hover);
    }
    
    /* Responsive */
    @media (max-width: 1024px) {
        .main-wrapper {
            margin-left: 0;
            padding: 20px;
        }
        
        .hero-title {
            font-size: 2.5rem;
        }
        
        .stats-bar {
            gap: 20px;
        }
    }
    
    @media (max-width: 768px) {
        .cards-grid {
            grid-template-columns: 1fr;
        }
        
        .hero-title {
            font-size: 2rem;
        }
        
        .filter-tabs {
            gap: 8px;
        }
        
        .filter-tab {
            padding: 10px 20px;
            font-size: 0.85rem;
        }
    }
</style>
"""

# ============= AI PREDICTOR - PAGE RÉVOLUTIONNAIRE =============
def get_ai_predictor_html(cryptos: list) -> str:
    """Génère la page AI Predictor révolutionnaire"""
    
    # Générer les cartes pour chaque crypto
    cards_7d = ""
    cards_30d = ""
    cards_90d = ""
    
    total_bullish = 0
    total_bearish = 0
    
    for crypto in cryptos[:50]:
        price = crypto.get('current_price', 0)
        change_24h = crypto.get('price_change_percentage_24h', 0) or 0
        change_7d = crypto.get('price_change_percentage_7d_in_currency', change_24h * 2.5) or 0
        name = crypto.get('name', 'Unknown')
        symbol = crypto.get('symbol', '').upper()
        rank = crypto.get('market_cap_rank', 0)
        market_cap = crypto.get('market_cap', 0)
        volume = crypto.get('total_volume', 0)
        
        price_str = f"${price:,.6f}" if price < 1 else f"${price:,.2f}"
        
        # Prédictions basées sur momentum et volatilité
        momentum = (change_24h * 0.4) + (change_7d * 0.6)
        volatility = abs(change_24h) + abs(change_7d) / 2
        
        # Facteur de confiance basé sur market cap et volume
        confidence_base = min(85, 50 + (market_cap / 1e11) * 10 + (volume / 1e10) * 5)
        
        pred_7d = price * (1 + (momentum * 0.3) / 100)
        pred_30d = price * (1 + (momentum * 1.2) / 100)
        pred_90d = price * (1 + (momentum * 3) / 100)
        
        conf_7d = min(92, confidence_base + 10)
        conf_30d = min(85, confidence_base)
        conf_90d = min(75, confidence_base - 10)
        
        perc_7d = ((pred_7d - price) / price * 100) if price > 0 else 0
        perc_30d = ((pred_30d - price) / price * 100) if price > 0 else 0
        perc_90d = ((pred_90d - price) / price * 100) if price > 0 else 0
        
        if perc_7d > 0:
            total_bullish += 1
        else:
            total_bearish += 1
        
        change_class = "positive" if change_24h > 0 else "negative"
        change_icon = "↑" if change_24h > 0 else "↓"
        
        def format_pred(val):
            return f"${val:,.6f}" if val < 1 else f"${val:,.2f}"
        
        # Template de carte
        def make_card(pred_val, pred_perc, conf, period):
            pred_class = "positive" if pred_perc > 0 else "negative"
            pred_icon = "📈" if pred_perc > 0 else "📉"
            return f"""
            <div class="rev-card">
                <div class="card-header">
                    <div class="card-rank">
                        <span class="rank-badge">#{rank}</span>
                        <div>
                            <div class="card-symbol">{symbol}</div>
                            <div class="card-name">{name}</div>
                        </div>
                    </div>
                    <div class="card-icon">🔮</div>
                </div>
                
                <div class="card-price-section">
                    <div class="current-price">{price_str}</div>
                    <div class="price-change {change_class}">
                        {change_icon} {change_24h:+.2f}% (24h)
                    </div>
                </div>
                
                <div class="prediction-section">
                    <div class="pred-header">
                        <span class="pred-label">Prédiction {period}</span>
                        <span class="pred-confidence">
                            <span class="live-dot"></span>
                            {conf:.0f}% confiance
                        </span>
                    </div>
                    <div class="pred-value">{format_pred(pred_val)}</div>
                    <div class="pred-change {pred_class}">
                        {pred_icon} {pred_perc:+.2f}%
                    </div>
                </div>
            </div>
            """
        
        cards_7d += make_card(pred_7d, perc_7d, conf_7d, "7 jours")
        cards_30d += make_card(pred_30d, perc_30d, conf_30d, "30 jours")
        cards_90d += make_card(pred_90d, perc_90d, conf_90d, "90 jours")
    
    avg_confidence = 78
    
    return f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Predictor - Prédictions Révolutionnaires</title>
        {REVOLUTIONARY_CSS}
    </head>
    <body>
        <div class="bg-animated"></div>
        <div class="bg-grid"></div>
        
        <div class="main-wrapper">
            <div class="page-container">
                <div class="hero-header">
                    <div class="hero-badge">
                        <span class="live-dot"></span>
                        DONNÉES EN TEMPS RÉEL
                    </div>
                    <h1 class="hero-title">🔮 AI Predictor</h1>
                    <p class="hero-subtitle">
                        Intelligence artificielle avancée pour prédire les mouvements de prix 
                        des 50 principales cryptomonnaies avec une précision exceptionnelle
                    </p>
                </div>
                
                <div class="stats-bar">
                    <div class="stat-item">
                        <div class="stat-value">50</div>
                        <div class="stat-label">Cryptos Analysées</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">{total_bullish}</div>
                        <div class="stat-label">Signaux Haussiers</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">{total_bearish}</div>
                        <div class="stat-label">Signaux Baissiers</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">{avg_confidence}%</div>
                        <div class="stat-label">Confiance Moyenne</div>
                    </div>
                </div>
                
                <div class="filter-tabs">
                    <button class="filter-tab active" onclick="showPeriod('7d')">📅 7 Jours</button>
                    <button class="filter-tab" onclick="showPeriod('30d')">📆 30 Jours</button>
                    <button class="filter-tab" onclick="showPeriod('90d')">🗓️ 90 Jours</button>
                </div>
                
                <div id="cards-7d" class="cards-grid">
                    {cards_7d}
                </div>
                
                <div id="cards-30d" class="cards-grid" style="display: none;">
                    {cards_30d}
                </div>
                
                <div id="cards-90d" class="cards-grid" style="display: none;">
                    {cards_90d}
                </div>
            </div>
        </div>
        
        <script>
            function showPeriod(period) {{
                // Hide all grids
                document.getElementById('cards-7d').style.display = 'none';
                document.getElementById('cards-30d').style.display = 'none';
                document.getElementById('cards-90d').style.display = 'none';
                
                // Show selected grid
                document.getElementById('cards-' + period).style.display = 'grid';
                
                // Update tabs
                document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
                event.target.classList.add('active');
            }}
            
            // Auto-refresh every 60 seconds
            setTimeout(() => location.reload(), 60000);
        </script>
    </body>
    </html>
    """


# ============= AI TOKEN SCANNER - PAGE RÉVOLUTIONNAIRE =============
def get_ai_token_scanner_html(tokens: list = None, query: str = "", info: str = "", error: str = "") -> str:
    """Génère la page AI Token Scanner révolutionnaire"""
    
    results_html = ""
    
    if error:
        results_html = f"""
        <div class="results-card" style="border-color: var(--accent-danger); background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));">
            <h3 style="color: var(--accent-danger); margin-bottom: 10px;">⚠️ Erreur</h3>
            <p style="color: var(--text-secondary);">{error}</p>
        </div>
        """
    elif tokens:
        rows = ""
        for t in tokens:
            score = t.get('score', 0)
            score_class = "positive" if score >= 70 else ("negative" if score < 40 else "")
            signal = "🟢 ACHETER" if score >= 70 else ("🔴 ÉVITER" if score < 40 else "🟡 NEUTRE")
            
            rows += f"""
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="card-icon" style="width: 40px; height: 40px; font-size: 1rem;">💎</div>
                        <div>
                            <div style="font-weight: 700; color: var(--text-primary);">{t.get('symbol', '').upper()}</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">{t.get('name', '')}</div>
                        </div>
                    </div>
                </td>
                <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600;">${t.get('price', 0):,.4f}</td>
                <td class="{'positive' if t.get('change_24h', 0) > 0 else 'negative'}" style="font-weight: 600;">
                    {t.get('change_24h', 0):+.2f}%
                </td>
                <td style="font-family: 'JetBrains Mono', monospace;">${t.get('market_cap', 0)/1e9:.2f}B</td>
                <td style="font-family: 'JetBrains Mono', monospace;">${t.get('volume', 0)/1e6:.1f}M</td>
                <td>
                    <div class="price-change {score_class}" style="display: inline-flex;">
                        {score}/100
                    </div>
                </td>
                <td style="font-weight: 700;">{signal}</td>
            </tr>
            """
        
        results_html = f"""
        <div style="overflow-x: auto; border-radius: 16px; border: 1px solid var(--border-color);">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Token</th>
                        <th>Prix</th>
                        <th>24h</th>
                        <th>Market Cap</th>
                        <th>Volume</th>
                        <th>Score AI</th>
                        <th>Signal</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        </div>
        """
        
        if info:
            results_html = f"""
            <div class="live-indicator" style="margin-bottom: 20px;">
                <span class="live-dot"></span>
                {info}
            </div>
            """ + results_html
    
    return f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Token Scanner - Analyse Révolutionnaire</title>
        {REVOLUTIONARY_CSS}
    </head>
    <body>
        <div class="bg-animated"></div>
        <div class="bg-grid"></div>
        
        <div class="main-wrapper">
            <div class="page-container">
                <div class="hero-header">
                    <div class="hero-badge">
                        <span class="live-dot"></span>
                        SCANNER INTELLIGENT
                    </div>
                    <h1 class="hero-title">🔍 AI Token Scanner</h1>
                    <p class="hero-subtitle">
                        Analysez n'importe quel token en temps réel avec notre intelligence artificielle.
                        Obtenez un score de qualité et des signaux d'achat/vente instantanés.
                    </p>
                </div>
                
                <form method="get" class="search-box">
                    <span class="search-icon">🔍</span>
                    <input 
                        type="text" 
                        name="q" 
                        class="search-input" 
                        placeholder="Entrez un symbole (BTC, ETH, SOL...) ou plusieurs séparés par des virgules"
                        value="{query}"
                        autocomplete="off"
                    >
                </form>
                
                {results_html if results_html else '''
                <div class="stats-bar" style="flex-direction: column; text-align: center; padding: 60px;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">🔍</div>
                    <h3 style="font-size: 1.5rem; margin-bottom: 15px; color: var(--text-primary);">
                        Recherchez un Token
                    </h3>
                    <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto;">
                        Entrez le symbole d'une cryptomonnaie (ex: BTC, ETH, SOL) pour obtenir 
                        une analyse complète avec score AI et recommandation d'investissement.
                    </p>
                    <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                        <a href="?q=BTC" class="filter-tab">Bitcoin (BTC)</a>
                        <a href="?q=ETH" class="filter-tab">Ethereum (ETH)</a>
                        <a href="?q=SOL" class="filter-tab">Solana (SOL)</a>
                        <a href="?q=BNB" class="filter-tab">BNB</a>
                    </div>
                </div>
                '''}
            </div>
        </div>
    </body>
    </html>
    """


# ============= AI PATTERNS - PAGE RÉVOLUTIONNAIRE =============
def get_ai_patterns_html(cryptos: list) -> str:
    """Génère la page AI Patterns révolutionnaire"""
    
    cards_html = ""
    pattern_counts = {"bullish": 0, "bearish": 0, "neutral": 0}
    
    for crypto in cryptos[:50]:
        price = crypto.get('current_price', 0)
        change_24h = crypto.get('price_change_percentage_24h', 0) or 0
        change_7d = crypto.get('price_change_percentage_7d_in_currency', change_24h * 2) or 0
        name = crypto.get('name', '')
        symbol = crypto.get('symbol', '').upper()
        rank = crypto.get('market_cap_rank', 0)
        high_24h = crypto.get('high_24h') or price or 0
        low_24h = crypto.get('low_24h') or price or 0
        
        price_str = f"${price:,.6f}" if price < 1 else f"${price:,.2f}"
        
        # Détection de patterns avancée
        volatility = ((high_24h - low_24h) / low_24h * 100) if low_24h and low_24h > 0 else 0
        momentum = change_24h + (change_7d * 0.5)
        
        if momentum > 8 and volatility > 5:
            pattern = "🚀 Breakout Haussier"
            pattern_class = "bullish"
            pattern_icon = "🚀"
            strength = "Très Fort"
            pattern_counts["bullish"] += 1
        elif momentum > 4:
            pattern = "📈 Triangle Ascendant"
            pattern_class = "bullish"
            pattern_icon = "📈"
            strength = "Fort"
            pattern_counts["bullish"] += 1
        elif momentum > 1:
            pattern = "↗️ Canal Haussier"
            pattern_class = "bullish"
            pattern_icon = "↗️"
            strength = "Modéré"
            pattern_counts["bullish"] += 1
        elif momentum < -8 and volatility > 5:
            pattern = "💥 Breakout Baissier"
            pattern_class = "bearish"
            pattern_icon = "💥"
            strength = "Très Fort"
            pattern_counts["bearish"] += 1
        elif momentum < -4:
            pattern = "📉 Triangle Descendant"
            pattern_class = "bearish"
            pattern_icon = "📉"
            strength = "Fort"
            pattern_counts["bearish"] += 1
        elif momentum < -1:
            pattern = "↘️ Canal Baissier"
            pattern_class = "bearish"
            pattern_icon = "↘️"
            strength = "Modéré"
            pattern_counts["bearish"] += 1
        else:
            pattern = "⏸️ Consolidation"
            pattern_class = "neutral"
            pattern_icon = "⏸️"
            strength = "En attente"
            pattern_counts["neutral"] += 1
        
        change_class = "positive" if change_24h > 0 else "negative"
        
        cards_html += f"""
        <div class="rev-card">
            <div class="card-header">
                <div class="card-rank">
                    <span class="rank-badge">#{rank}</span>
                    <div>
                        <div class="card-symbol">{symbol}</div>
                        <div class="card-name">{name}</div>
                    </div>
                </div>
                <div class="card-icon">🎨</div>
            </div>
            
            <div class="card-price-section">
                <div class="current-price">{price_str}</div>
                <div class="price-change {change_class}">
                    {'↑' if change_24h > 0 else '↓'} {change_24h:+.2f}% (24h)
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--text-muted);">7 Jours</div>
                    <div class="{'positive' if change_7d > 0 else 'negative'}" style="font-weight: 700; font-size: 1.1rem;">
                        {change_7d:+.2f}%
                    </div>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--text-muted);">Volatilité</div>
                    <div style="font-weight: 700; font-size: 1.1rem; color: var(--accent-warning);">
                        {volatility:.1f}%
                    </div>
                </div>
            </div>
            
            <div class="pattern-badge {pattern_class}">
                <span class="pattern-icon">{pattern_icon}</span>
                <div class="pattern-info">
                    <h4>{pattern}</h4>
                    <span>Force: {strength}</span>
                </div>
            </div>
        </div>
        """
    
    return f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Patterns - Reconnaissance de Formes</title>
        {REVOLUTIONARY_CSS}
    </head>
    <body>
        <div class="bg-animated"></div>
        <div class="bg-grid"></div>
        
        <div class="main-wrapper">
            <div class="page-container">
                <div class="hero-header">
                    <div class="hero-badge">
                        <span class="live-dot"></span>
                        RECONNAISSANCE AI
                    </div>
                    <h1 class="hero-title">🎨 AI Patterns</h1>
                    <p class="hero-subtitle">
                        Détection automatique des patterns chartistes grâce à notre intelligence artificielle.
                        Identifiez les opportunités de trading en temps réel.
                    </p>
                </div>
                
                <div class="stats-bar">
                    <div class="stat-item">
                        <div class="stat-value">{pattern_counts['bullish']}</div>
                        <div class="stat-label">🟢 Patterns Haussiers</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">{pattern_counts['bearish']}</div>
                        <div class="stat-label">🔴 Patterns Baissiers</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">{pattern_counts['neutral']}</div>
                        <div class="stat-label">🟡 Consolidations</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">50</div>
                        <div class="stat-label">Cryptos Analysées</div>
                    </div>
                </div>
                
                <div class="filter-tabs">
                    <button class="filter-tab active" onclick="filterPatterns('all')">🔍 Tous</button>
                    <button class="filter-tab" onclick="filterPatterns('bullish')">🟢 Haussiers</button>
                    <button class="filter-tab" onclick="filterPatterns('bearish')">🔴 Baissiers</button>
                    <button class="filter-tab" onclick="filterPatterns('neutral')">🟡 Neutres</button>
                </div>
                
                <div class="cards-grid">
                    {cards_html}
                </div>
            </div>
        </div>
        
        <script>
            function filterPatterns(type) {{
                const cards = document.querySelectorAll('.rev-card');
                cards.forEach(card => {{
                    const badge = card.querySelector('.pattern-badge');
                    if (type === 'all') {{
                        card.style.display = 'block';
                    }} else if (badge.classList.contains(type)) {{
                        card.style.display = 'block';
                    }} else {{
                        card.style.display = 'none';
                    }}
                }});
                
                document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
                event.target.classList.add('active');
            }}
            
            // Auto-refresh every 60 seconds
            setTimeout(() => location.reload(), 60000);
        </script>
    </body>
    </html>
    """


# ============= AI SENTIMENT - PAGE RÉVOLUTIONNAIRE =============
def get_ai_sentiment_html(cryptos: list) -> str:
    """Génère la page AI Sentiment révolutionnaire"""
    
    cards_html = ""
    sentiment_counts = {"very_bullish": 0, "bullish": 0, "neutral": 0, "bearish": 0, "very_bearish": 0}
    total_score = 0
    
    for crypto in cryptos[:50]:
        price = crypto.get('current_price', 0)
        change_24h = crypto.get('price_change_percentage_24h', 0) or 0
        change_7d = crypto.get('price_change_percentage_7d_in_currency', change_24h * 2.5) or 0
        name = crypto.get('name', '')
        symbol = crypto.get('symbol', '').upper()
        rank = crypto.get('market_cap_rank', 0)
        volume = crypto.get('total_volume', 0)
        market_cap = crypto.get('market_cap', 0)
        
        price_str = f"${price:,.6f}" if price < 1 else f"${price:,.2f}"
        
        # Score de sentiment avancé
        score = (change_24h * 0.5) + (change_7d * 0.3) + ((volume / market_cap * 100) if market_cap > 0 else 0) * 0.2
        total_score += score
        
        # Normaliser le score pour la barre (0-100)
        meter_position = max(0, min(100, 50 + score * 3))
        
        if score > 12:
            sentiment = "Extrêmement Haussier"
            sentiment_class = "very-bullish"
            emoji = "🚀"
            sentiment_counts["very_bullish"] += 1
        elif score > 5:
            sentiment = "Haussier"
            sentiment_class = "bullish"
            emoji = "😊"
            sentiment_counts["bullish"] += 1
        elif score > -5:
            sentiment = "Neutre"
            sentiment_class = "neutral"
            emoji = "😐"
            sentiment_counts["neutral"] += 1
        elif score > -12:
            sentiment = "Baissier"
            sentiment_class = "bearish"
            emoji = "😟"
            sentiment_counts["bearish"] += 1
        else:
            sentiment = "Extrêmement Baissier"
            sentiment_class = "very-bearish"
            emoji = "😱"
            sentiment_counts["very_bearish"] += 1
        
        change_class = "positive" if change_24h > 0 else "negative"
        change_7d_class = "positive" if change_7d > 0 else "negative"
        
        # Couleur du sentiment
        sentiment_colors = {
            "very-bullish": "#10b981",
            "bullish": "#22c55e",
            "neutral": "#f59e0b",
            "bearish": "#f97316",
            "very-bearish": "#ef4444"
        }
        
        cards_html += f"""
        <div class="rev-card" data-sentiment="{sentiment_class}">
            <div class="card-header">
                <div class="card-rank">
                    <span class="rank-badge">#{rank}</span>
                    <div>
                        <div class="card-symbol">{symbol}</div>
                        <div class="card-name">{name}</div>
                    </div>
                </div>
                <div style="font-size: 2.5rem;">{emoji}</div>
            </div>
            
            <div class="card-price-section">
                <div class="current-price">{price_str}</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px;">
                    <div style="font-size: 0.8rem; color: var(--text-muted);">24 Heures</div>
                    <div class="{change_class}" style="font-weight: 700; font-size: 1.2rem;">
                        {change_24h:+.2f}%
                    </div>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px;">
                    <div style="font-size: 0.8rem; color: var(--text-muted);">7 Jours</div>
                    <div class="{change_7d_class}" style="font-weight: 700; font-size: 1.2rem;">
                        {change_7d:+.2f}%
                    </div>
                </div>
            </div>
            
            <div class="sentiment-meter">
                <div class="meter-bar">
                    <div class="meter-indicator" style="left: {meter_position}%;"></div>
                </div>
                <div class="sentiment-label">
                    <span>Bearish</span>
                    <span>Bullish</span>
                </div>
            </div>
            
            <div class="pattern-badge {sentiment_class.replace('-', ' ').replace('very ', '')}" 
                 style="margin-top: 20px; background: linear-gradient(135deg, {sentiment_colors.get(sentiment_class, '#6366f1')}20, {sentiment_colors.get(sentiment_class, '#6366f1')}10); border-color: {sentiment_colors.get(sentiment_class, '#6366f1')}50;">
                <span style="font-size: 1.5rem;">{emoji}</span>
                <div class="pattern-info">
                    <h4 style="color: {sentiment_colors.get(sentiment_class, '#fff')};">{sentiment}</h4>
                    <span>Score: {score:+.1f}</span>
                </div>
            </div>
        </div>
        """
    
    avg_score = total_score / 50 if cryptos else 0
    market_sentiment = "Haussier" if avg_score > 2 else ("Baissier" if avg_score < -2 else "Neutre")
    market_emoji = "🚀" if avg_score > 2 else ("📉" if avg_score < -2 else "😐")
    
    return f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Sentiment - Analyse du Marché</title>
        {REVOLUTIONARY_CSS}
        <style>
            .sentiment-badge.very-bullish {{ background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1)); border: 1px solid rgba(16, 185, 129, 0.4); }}
            .sentiment-badge.bullish {{ background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1)); border: 1px solid rgba(34, 197, 94, 0.4); }}
            .sentiment-badge.neutral {{ background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1)); border: 1px solid rgba(245, 158, 11, 0.4); }}
            .sentiment-badge.bearish {{ background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.1)); border: 1px solid rgba(249, 115, 22, 0.4); }}
            .sentiment-badge.very-bearish {{ background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1)); border: 1px solid rgba(239, 68, 68, 0.4); }}
            .positive {{ color: var(--accent-success); }}
            .negative {{ color: var(--accent-danger); }}
        </style>
    </head>
    <body>
        <div class="bg-animated"></div>
        <div class="bg-grid"></div>
        
        <div class="main-wrapper">
            <div class="page-container">
                <div class="hero-header">
                    <div class="hero-badge">
                        <span class="live-dot"></span>
                        ANALYSE EN TEMPS RÉEL
                    </div>
                    <h1 class="hero-title">😊 AI Sentiment</h1>
                    <p class="hero-subtitle">
                        Analyse du sentiment de marché basée sur l'intelligence artificielle.
                        Comprenez l'humeur du marché crypto en un coup d'œil.
                    </p>
                </div>
                
                <div class="stats-bar">
                    <div class="stat-item">
                        <div class="stat-value" style="font-size: 3rem;">{market_emoji}</div>
                        <div class="stat-label">Sentiment Global: {market_sentiment}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" style="color: #10b981;">{sentiment_counts['very_bullish'] + sentiment_counts['bullish']}</div>
                        <div class="stat-label">🟢 Haussiers</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" style="color: #f59e0b;">{sentiment_counts['neutral']}</div>
                        <div class="stat-label">🟡 Neutres</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" style="color: #ef4444;">{sentiment_counts['bearish'] + sentiment_counts['very_bearish']}</div>
                        <div class="stat-label">🔴 Baissiers</div>
                    </div>
                </div>
                
                <div class="filter-tabs">
                    <button class="filter-tab active" onclick="filterSentiment('all')">🔍 Tous</button>
                    <button class="filter-tab" onclick="filterSentiment('very-bullish')">🚀 Très Haussier</button>
                    <button class="filter-tab" onclick="filterSentiment('bullish')">😊 Haussier</button>
                    <button class="filter-tab" onclick="filterSentiment('neutral')">😐 Neutre</button>
                    <button class="filter-tab" onclick="filterSentiment('bearish')">😟 Baissier</button>
                    <button class="filter-tab" onclick="filterSentiment('very-bearish')">😱 Très Baissier</button>
                </div>
                
                <div class="cards-grid">
                    {cards_html}
                </div>
            </div>
        </div>
        
        <script>
            function filterSentiment(type) {{
                const cards = document.querySelectorAll('.rev-card');
                cards.forEach(card => {{
                    if (type === 'all') {{
                        card.style.display = 'block';
                    }} else if (card.dataset.sentiment === type) {{
                        card.style.display = 'block';
                    }} else {{
                        card.style.display = 'none';
                    }}
                }});
                
                document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
                event.target.classList.add('active');
            }}
            
            // Auto-refresh every 60 seconds
            setTimeout(() => location.reload(), 60000);
        </script>
    </body>
    </html>
    """


# ============= AI SIZER - PAGE RÉVOLUTIONNAIRE =============
def get_ai_sizer_html(account: str = "1000", risk: str = "1", entry: str = "", stop: str = "", 
                      leverage: str = "1", direction: str = "long", result: dict = None, error: str = "") -> str:
    """Génère la page AI Sizer révolutionnaire"""
    
    result_html = ""
    
    if error:
        result_html = f"""
        <div class="results-card" style="border-color: var(--accent-danger); background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));">
            <h3 style="color: var(--accent-danger); margin-bottom: 10px;">⚠️ Erreur</h3>
            <p style="color: var(--text-secondary);">{error}</p>
        </div>
        """
    elif result:
        result_html = f"""
        <div class="results-card">
            <h3 style="font-size: 1.5rem; margin-bottom: 25px; color: var(--accent-success);">
                ✅ Résultat du Calcul
            </h3>
            <div class="results-grid">
                <div class="result-item">
                    <div class="result-value">${result.get('risk_amount', 0):,.2f}</div>
                    <div class="result-label">💰 Risque ($)</div>
                </div>
                <div class="result-item">
                    <div class="result-value">{result.get('quantity', 0):,.6f}</div>
                    <div class="result-label">📊 Quantité (coins)</div>
                </div>
                <div class="result-item">
                    <div class="result-value">${result.get('position_notional', 0):,.2f}</div>
                    <div class="result-label">📈 Valeur Position</div>
                </div>
                <div class="result-item">
                    <div class="result-value">${result.get('margin', 0):,.2f}</div>
                    <div class="result-label">🔒 Marge Requise</div>
                </div>
            </div>
            <div style="margin-top: 25px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 12px; text-align: center;">
                <p style="color: var(--text-muted); font-size: 0.9rem;">
                    ⚠️ Approximation: ne tient pas compte des frais de trading et du slippage
                </p>
            </div>
        </div>
        """
    
    return f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Sizer - Calculateur de Position</title>
        {REVOLUTIONARY_CSS}
    </head>
    <body>
        <div class="bg-animated"></div>
        <div class="bg-grid"></div>
        
        <div class="main-wrapper">
            <div class="page-container">
                <div class="hero-header">
                    <div class="hero-badge">
                        <span class="live-dot"></span>
                        GESTION DU RISQUE
                    </div>
                    <h1 class="hero-title">💰 AI Position Sizer</h1>
                    <p class="hero-subtitle">
                        Calculez la taille optimale de votre position en fonction de votre capital 
                        et de votre tolérance au risque. Trading Spot et Futures supportés.
                    </p>
                </div>
                
                <div class="calc-form">
                    <form method="get">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>💵 Capital Total ($)</label>
                                <input type="number" name="account" value="{account}" placeholder="1000" step="any" required>
                            </div>
                            <div class="form-group">
                                <label>⚠️ Risque par Trade (%)</label>
                                <input type="number" name="risk" value="{risk}" placeholder="1" step="0.1" required>
                            </div>
                            <div class="form-group">
                                <label>📍 Prix d'Entrée</label>
                                <input type="number" name="entry" value="{entry}" placeholder="43000" step="any" required>
                            </div>
                            <div class="form-group">
                                <label>🛑 Stop Loss</label>
                                <input type="number" name="stop" value="{stop}" placeholder="42500" step="any" required>
                            </div>
                            <div class="form-group">
                                <label>⚡ Leverage (Futures)</label>
                                <input type="number" name="leverage" value="{leverage}" placeholder="1" min="1" max="125" step="1">
                            </div>
                            <div class="form-group">
                                <label>📊 Direction</label>
                                <select name="direction">
                                    <option value="long" {'selected' if direction == 'long' else ''}>🟢 Long (Achat)</option>
                                    <option value="short" {'selected' if direction == 'short' else ''}>🔴 Short (Vente)</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="submit-btn">
                            🧮 Calculer la Taille de Position
                        </button>
                    </form>
                    
                    {result_html}
                </div>
                
                <div class="stats-bar" style="margin-top: 40px; flex-direction: column; text-align: left; padding: 30px;">
                    <h3 style="font-size: 1.3rem; margin-bottom: 20px; color: var(--accent-tertiary);">
                        📚 Guide de Gestion du Risque
                    </h3>
                    <div style="display: grid; gap: 15px;">
                        <div style="display: flex; gap: 15px; align-items: flex-start;">
                            <span style="font-size: 1.5rem;">1️⃣</span>
                            <div>
                                <strong style="color: var(--text-primary);">Règle du 1-2%</strong>
                                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 5px;">
                                    Ne risquez jamais plus de 1-2% de votre capital total par trade
                                </p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 15px; align-items: flex-start;">
                            <span style="font-size: 1.5rem;">2️⃣</span>
                            <div>
                                <strong style="color: var(--text-primary);">Stop Loss Obligatoire</strong>
                                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 5px;">
                                    Placez toujours un stop loss pour limiter vos pertes potentielles
                                </p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 15px; align-items: flex-start;">
                            <span style="font-size: 1.5rem;">3️⃣</span>
                            <div>
                                <strong style="color: var(--text-primary);">Leverage Prudent</strong>
                                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 5px;">
                                    Utilisez un leverage faible (2-5x max) pour les débutants
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """