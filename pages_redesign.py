"""
Pages Redesign - CryptoIA
Pages améliorées avec design révolutionnaire et données réelles
- /strategie
"""

# ============================================================================
# PAGE STRATÉGIE - Design Ultra Moderne avec Stratégies Complètes
# ============================================================================
def get_strategie_page_html(SIDEBAR, CSS):
    return SIDEBAR + """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Stratégies de Trading Pro - CryptoIA</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script>
    """ + CSS + """
    <style>
        :root {
            --primary: #6366f1;
            --primary-light: #818cf8;
            --secondary: #ec4899;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --dark: #0f172a;
            --darker: #020617;
            --card: #1e293b;
            --border: #334155;
            --text: #e2e8f0;
            --muted: #94a3b8;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--darker);
            color: var(--text);
            line-height: 1.6;
            overflow-x: hidden;
        }
        
        .bg-animation {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: 
                radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 70%);
            animation: bgPulse 15s ease-in-out infinite;
        }
        
        @keyframes bgPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .main-container {
            margin-left: 280px;
            padding: 30px;
            min-height: 100vh;
        }
        
        @media (max-width: 1024px) {
            .main-container { margin-left: 0; padding: 20px; }
        }
        
        .hero {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.15) 50%, rgba(16, 185, 129, 0.1) 100%);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 24px;
            padding: 50px;
            margin-bottom: 40px;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(20px);
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(from 0deg, transparent, rgba(99, 102, 241, 0.1), transparent 30%);
            animation: rotate 20s linear infinite;
        }
        
        @keyframes rotate {
            100% { transform: rotate(360deg); }
        }
        
        .hero-content {
            position: relative;
            z-index: 1;
            text-align: center;
        }
        
        .hero h1 {
            font-size: 3.5rem;
            font-weight: 900;
            background: linear-gradient(135deg, #6366f1, #ec4899, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 15px;
            letter-spacing: -1px;
        }
        
        .hero p {
            font-size: 1.25rem;
            color: var(--muted);
            max-width: 700px;
            margin: 0 auto;
        }
        
        /* Navigation des stratégies */
        .strategy-nav {
            display: flex;
            gap: 15px;
            margin-bottom: 40px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .nav-btn {
            padding: 15px 30px;
            background: var(--card);
            border: 2px solid var(--border);
            border-radius: 50px;
            color: var(--text);
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .nav-btn:hover {
            border-color: var(--primary);
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(99, 102, 241, 0.2);
        }
        
        .nav-btn.active {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-color: transparent;
            color: white;
        }
        
        /* Sections de stratégies */
        .strategy-section {
            display: none;
            animation: fadeIn 0.5s ease;
        }
        
        .strategy-section.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Carte de stratégie principale */
        .strategy-main-card {
            background: linear-gradient(145deg, var(--card) 0%, rgba(15, 23, 42, 0.9) 100%);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 40px;
            margin-bottom: 30px;
            position: relative;
            overflow: hidden;
        }
        
        .strategy-main-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
        }
        
        .strategy-main-card.scalping::before { background: linear-gradient(90deg, #f59e0b, #ef4444); }
        .strategy-main-card.swing::before { background: linear-gradient(90deg, #6366f1, #8b5cf6); }
        .strategy-main-card.daytrading::before { background: linear-gradient(90deg, #10b981, #3b82f6); }
        .strategy-main-card.hodl::before { background: linear-gradient(90deg, #ec4899, #8b5cf6); }
        
        .strategy-header {
            display: flex;
            align-items: flex-start;
            gap: 25px;
            margin-bottom: 30px;
        }
        
        .strategy-icon {
            width: 80px;
            height: 80px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            flex-shrink: 0;
        }
        
        .strategy-icon.scalping { background: linear-gradient(135deg, #f59e0b, #ef4444); }
        .strategy-icon.swing { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
        .strategy-icon.daytrading { background: linear-gradient(135deg, #10b981, #3b82f6); }
        .strategy-icon.hodl { background: linear-gradient(135deg, #ec4899, #8b5cf6); }
        
        .strategy-title-section h2 {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 10px;
        }
        
        .strategy-title-section p {
            color: var(--muted);
            font-size: 1.1rem;
            max-width: 600px;
        }
        
        .strategy-badges {
            display: flex;
            gap: 12px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        
        .badge {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        }
        
        .badge.risk-low { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge.risk-medium { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge.risk-high { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .badge.timeframe { background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); }
        .badge.winrate { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        
        /* Grille d'informations */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
        }
        
        .info-card {
            background: var(--dark);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 25px;
            transition: all 0.3s;
        }
        
        .info-card:hover {
            transform: translateY(-5px);
            border-color: var(--primary);
        }
        
        .info-card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 15px;
        }
        
        .info-card-icon {
            width: 45px;
            height: 45px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
        }
        
        .info-card-icon.green { background: rgba(16, 185, 129, 0.15); }
        .info-card-icon.blue { background: rgba(99, 102, 241, 0.15); }
        .info-card-icon.orange { background: rgba(245, 158, 11, 0.15); }
        .info-card-icon.pink { background: rgba(236, 72, 153, 0.15); }
        .info-card-icon.red { background: rgba(239, 68, 68, 0.15); }
        
        .info-card h4 {
            font-size: 1rem;
            font-weight: 700;
        }
        
        .info-card p {
            color: var(--muted);
            font-size: 14px;
            line-height: 1.7;
        }
        
        .info-card ul {
            list-style: none;
            margin-top: 10px;
        }
        
        .info-card li {
            padding: 8px 0;
            border-bottom: 1px solid rgba(51, 65, 85, 0.5);
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
        }
        
        .info-card li:last-child { border-bottom: none; }
        
        .info-card li::before {
            content: '✓';
            color: var(--success);
            font-weight: bold;
        }
        
        /* Section indicateurs */
        .indicators-section {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 35px;
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 1.5rem;
            font-weight: 800;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .indicators-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .indicator-card {
            background: linear-gradient(135deg, var(--dark) 0%, rgba(30, 41, 59, 0.5) 100%);
            border: 2px solid var(--border);
            border-radius: 16px;
            padding: 25px;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        
        .indicator-card:hover {
            border-color: var(--primary);
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(99, 102, 241, 0.15);
        }
        
        .indicator-card::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
        }
        
        .indicator-name {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .indicator-tag {
            font-size: 10px;
            padding: 4px 10px;
            background: var(--primary);
            color: white;
            border-radius: 20px;
            font-weight: 600;
        }
        
        .indicator-desc {
            color: var(--muted);
            font-size: 14px;
            margin-bottom: 15px;
            line-height: 1.6;
        }
        
        .indicator-settings {
            background: rgba(15, 23, 42, 0.5);
            border-radius: 10px;
            padding: 15px;
        }
        
        .indicator-settings h5 {
            font-size: 12px;
            color: var(--primary-light);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        
        .setting-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
        }
        
        .setting-label { color: var(--muted); }
        .setting-value { color: var(--text); font-weight: 600; }
        
        /* Section règles */
        .rules-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 30px;
        }
        
        @media (max-width: 900px) {
            .rules-section { grid-template-columns: 1fr; }
        }
        
        .rules-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 30px;
        }
        
        .rules-card.entry { border-left: 4px solid var(--success); }
        .rules-card.exit { border-left: 4px solid var(--danger); }
        
        .rules-card h3 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .rule-item {
            display: flex;
            gap: 15px;
            padding: 15px 0;
            border-bottom: 1px solid var(--border);
        }
        
        .rule-item:last-child { border-bottom: none; }
        
        .rule-number {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            flex-shrink: 0;
        }
        
        .rule-content h4 {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .rule-content p {
            color: var(--muted);
            font-size: 13px;
        }
        
        /* Exemple de trade */
        .example-section {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%);
            border: 2px solid var(--primary);
            border-radius: 20px;
            padding: 35px;
            margin-bottom: 30px;
        }
        
        .example-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .example-header h3 {
            font-size: 1.25rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .example-badge {
            padding: 10px 20px;
            background: var(--success);
            color: white;
            border-radius: 25px;
            font-weight: 700;
            font-size: 14px;
        }
        
        .example-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .example-item {
            background: rgba(15, 23, 42, 0.5);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        
        .example-label {
            font-size: 12px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        
        .example-value {
            font-size: 1.5rem;
            font-weight: 800;
        }
        
        .example-value.green { color: var(--success); }
        .example-value.red { color: var(--danger); }
        .example-value.blue { color: var(--primary-light); }
        
        /* Calculateur de position */
        .calculator-section {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 35px;
            margin-bottom: 30px;
        }
        
        .calc-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .calc-input-group label {
            display: block;
            font-size: 13px;
            color: var(--muted);
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .calc-input {
            width: 100%;
            padding: 14px 18px;
            background: var(--dark);
            border: 2px solid var(--border);
            border-radius: 12px;
            color: var(--text);
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s;
        }
        
        .calc-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        
        .calc-results {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            padding: 25px;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%);
            border-radius: 16px;
            border: 1px solid var(--primary);
        }
        
        .calc-result-item {
            text-align: center;
            padding: 15px;
        }
        
        .calc-result-value {
            font-size: 1.75rem;
            font-weight: 800;
            color: var(--primary-light);
            margin-bottom: 5px;
        }
        
        .calc-result-value.profit { color: var(--success); }
        
        .calc-result-label {
            font-size: 12px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        /* Tips section */
        .tips-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }
        
        .tip-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 25px;
            transition: all 0.3s;
        }
        
        .tip-card:hover {
            transform: translateY(-5px);
            border-color: var(--warning);
        }
        
        .tip-card h4 {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            font-size: 1rem;
        }
        
        .tip-card p {
            color: var(--muted);
            font-size: 14px;
            line-height: 1.7;
        }
        
        /* Market ticker */
        .market-ticker {
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 30px;
            overflow: hidden;
        }
        
        .ticker-title {
            font-size: 12px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .ticker-title::before {
            content: '';
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
        }
        
        .ticker-scroll {
            display: flex;
            gap: 30px;
            animation: scroll 40s linear infinite;
        }
        
        @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        
        .ticker-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 20px;
            background: rgba(30, 41, 59, 0.5);
            border-radius: 12px;
            white-space: nowrap;
            min-width: fit-content;
        }
        
        .ticker-symbol { font-weight: 700; color: var(--text); }
        .ticker-price { font-weight: 600; color: var(--primary-light); }
        
        .ticker-change {
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 13px;
        }
        
        .ticker-change.positive { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .ticker-change.negative { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .hero { padding: 30px 20px; }
            .strategy-header { flex-direction: column; text-align: center; }
            .strategy-icon { margin: 0 auto; }
        }
    </style>
</head>
<body>
    <div class="bg-animation"></div>
    
    <div class="main-container">
        <div class="hero">
            <div class="hero-content">
                <h1>🎯 Stratégies de Trading Pro</h1>
                <p>Maîtrisez les techniques des traders professionnels avec nos stratégies éprouvées, indicateurs précis et règles de gestion du risque</p>
            </div>
        </div>
        
        <div class="market-ticker">
            <div class="ticker-title">Marchés en Direct</div>
            <div class="ticker-scroll" id="tickerScroll">
                <div class="ticker-item">
                    <span class="ticker-symbol">BTC</span>
                    <span class="ticker-price" id="btc-price">--</span>
                    <span class="ticker-change positive" id="btc-change">--</span>
                </div>
                <div class="ticker-item">
                    <span class="ticker-symbol">ETH</span>
                    <span class="ticker-price" id="eth-price">--</span>
                    <span class="ticker-change positive" id="eth-change">--</span>
                </div>
                <div class="ticker-item">
                    <span class="ticker-symbol">SOL</span>
                    <span class="ticker-price" id="sol-price">--</span>
                    <span class="ticker-change positive" id="sol-change">--</span>
                </div>
                <div class="ticker-item">
                    <span class="ticker-symbol">BNB</span>
                    <span class="ticker-price" id="bnb-price">--</span>
                    <span class="ticker-change positive" id="bnb-change">--</span>
                </div>
                <div class="ticker-item">
                    <span class="ticker-symbol">XRP</span>
                    <span class="ticker-price" id="xrp-price">--</span>
                    <span class="ticker-change positive" id="xrp-change">--</span>
                </div>
                <div class="ticker-item">
                    <span class="ticker-symbol">ADA</span>
                    <span class="ticker-price" id="ada-price">--</span>
                    <span class="ticker-change positive" id="ada-change">--</span>
                </div>
            </div>
        </div>
        
        <!-- Navigation des stratégies -->
        <div class="strategy-nav">
            <button class="nav-btn active" onclick="showStrategy('scalping')">
                <span>⚡</span> Scalping
            </button>
            <button class="nav-btn" onclick="showStrategy('swing')">
                <span>🌊</span> Swing Trading
            </button>
            <button class="nav-btn" onclick="showStrategy('daytrading')">
                <span>📊</span> Day Trading
            </button>
            <button class="nav-btn" onclick="showStrategy('hodl')">
                <span>💎</span> HODL / DCA
            </button>
        </div>
        
        <!-- ========== SCALPING ========== -->
        <div class="strategy-section active" id="scalping">
            <div class="strategy-main-card scalping">
                <div class="strategy-header">
                    <div class="strategy-icon scalping">⚡</div>
                    <div class="strategy-title-section">
                        <h2>Scalping - Trades Ultra-Rapides</h2>
                        <p>Le scalping consiste à réaliser de nombreux petits profits sur des mouvements de prix minimes. Idéal pour les traders actifs qui peuvent surveiller les marchés en permanence.</p>
                        <div class="strategy-badges">
                            <span class="badge risk-high">🔥 Risque Élevé</span>
                            <span class="badge timeframe">⏱️ 1min - 15min</span>
                            <span class="badge winrate">📈 55-65% Win Rate</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="info-grid">
                <div class="info-card">
                    <div class="info-card-header">
                        <div class="info-card-icon orange">⏰</div>
                        <h4>Temps Requis</h4>
                    </div>
                    <p>Le scalping demande une attention constante. Prévoyez 2-4 heures de trading actif par session.</p>
                    <ul>
                        <li>Sessions de 2-4 heures</li>
                        <li>10-50 trades par jour</li>
                        <li>Concentration maximale</li>
                    </ul>
                </div>
                
                <div class="info-card">
                    <div class="info-card-header">
                        <div class="info-card-icon green">💰</div>
                        <h4>Capital Recommandé</h4>
                    </div>
                    <p>Un capital suffisant est nécessaire pour couvrir les frais et générer des profits significatifs.</p>
                    <ul>
                        <li>Minimum: $5,000</li>
                        <li>Idéal: $10,000+</li>
                        <li>Frais: 0.1% max par trade</li>
                    </ul>
                </div>
                
                <div class="info-card">
                    <div class="info-card-header">
                        <div class="info-card-icon blue">🎯</div>
                        <h4>Objectifs de Profit</h4>
                    </div>
                    <p>Visez des gains modestes mais réguliers. La constance est la clé du succès.</p>
                    <ul>
                        <li>Profit par trade: 0.2-0.5%</li>
                        <li>Stop Loss: 0.1-0.3%</li>
                        <li>Ratio R:R minimum: 1:1.5</li>
                    </ul>
                </div>
            </div>
            
            <div class="indicators-section">
                <h3 class="section-title">📊 Indicateurs Recommandés pour le Scalping</h3>
                <div class="indicators-grid">
                    <div class="indicator-card">
                        <div class="indicator-name">
                            RSI (Relative Strength Index)
                            <span class="indicator-tag">ESSENTIEL</span>
                        </div>
                        <p class="indicator-desc">Identifie les conditions de surachat/survente pour des entrées précises sur les retournements rapides.</p>
                        <div class="indicator-settings">
                            <h5>Paramètres Optimaux</h5>
                            <div class="setting-row">
                                <span class="setting-label">Période</span>
                                <span class="setting-value">7 ou 9</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Surachat</span>
                                <span class="setting-value">> 70</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Survente</span>
                                <span class="setting-value">< 30</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="indicator-card">
                        <div class="indicator-name">
                            EMA (Exponential Moving Average)
                            <span class="indicator-tag">TENDANCE</span>
                        </div>
                        <p class="indicator-desc">Utilisez les croisements d'EMA rapides pour identifier la direction du momentum à court terme.</p>
                        <div class="indicator-settings">
                            <h5>Paramètres Optimaux</h5>
                            <div class="setting-row">
                                <span class="setting-label">EMA Rapide</span>
                                <span class="setting-value">8 périodes</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">EMA Lente</span>
                                <span class="setting-value">21 périodes</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Signal</span>
                                <span class="setting-value">Croisement</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="indicator-card">
                        <div class="indicator-name">
                            VWAP (Volume Weighted Avg Price)
                            <span class="indicator-tag">VOLUME</span>
                        </div>
                        <p class="indicator-desc">Le VWAP agit comme support/résistance dynamique basé sur le volume réel des transactions.</p>
                        <div class="indicator-settings">
                            <h5>Paramètres Optimaux</h5>
                            <div class="setting-row">
                                <span class="setting-label">Période</span>
                                <span class="setting-value">Session</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Long si</span>
                                <span class="setting-value">Prix > VWAP</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Short si</span>
                                <span class="setting-value">Prix < VWAP</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="indicator-card">
                        <div class="indicator-name">
                            Bollinger Bands
                            <span class="indicator-tag">VOLATILITÉ</span>
                        </div>
                        <p class="indicator-desc">Identifiez les squeezes de volatilité et les retours à la moyenne pour des entrées précises.</p>
                        <div class="indicator-settings">
                            <h5>Paramètres Optimaux</h5>
                            <div class="setting-row">
                                <span class="setting-label">Période</span>
                                <span class="setting-value">20</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Déviation</span>
                                <span class="setting-value">2.0</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Signal</span>
                                <span class="setting-value">Touch bandes</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="rules-section">
                <div class="rules-card entry">
                    <h3>🟢 Règles d'Entrée</h3>
                    <div class="rule-item">
                        <div class="rule-number">1</div>
                        <div class="rule-content">
                            <h4>Confirmation de tendance</h4>
                            <p>Prix au-dessus de l'EMA 21 pour les longs, en-dessous pour les shorts</p>
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">2</div>
                        <div class="rule-content">
                            <h4>Signal RSI</h4>
                            <p>RSI sortant de zone de survente (>30) pour long, ou surachat (<70) pour short</p>
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">3</div>
                        <div class="rule-content">
                            <h4>Volume confirmé</h4>
                            <p>Volume supérieur à la moyenne des 20 dernières bougies</p>
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">4</div>
                        <div class="rule-content">
                            <h4>Spread acceptable</h4>
                            <p>Spread < 0.05% pour éviter les frais excessifs</p>
                        </div>
                    </div>
                </div>
                
                <div class="rules-card exit">
                    <h3>🔴 Règles de Sortie</h3>
                    <div class="rule-item">
                        <div class="rule-number">1</div>
                        <div class="rule-content">
                            <h4>Take Profit atteint</h4>
                            <p>Sortie automatique à 0.3-0.5% de profit</p>
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">2</div>
                        <div class="rule-content">
                            <h4>Stop Loss touché</h4>
                            <p>Sortie immédiate à -0.2% maximum</p>
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">3</div>
                        <div class="rule-content">
                            <h4>Temps maximum</h4>
                            <p>Sortie si le trade dure plus de 15 minutes sans profit</p>
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">4</div>
                        <div class="rule-content">
                            <h4>Inversion de signal</h4>
                            <p>Sortie si RSI inverse ou croisement EMA contraire</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="example-section">
                <div class="example-header">
                    <h3>📝 Exemple de Trade Scalping Réussi</h3>
                    <span class="example-badge">+0.45% Profit</span>
                </div>
                <div class="example-grid">
                    <div class="example-item">
                        <div class="example-label">Paire</div>
                        <div class="example-value blue">BTC/USDT</div>
                    </div>
                    <div class="example-item">
                        <div class="example-label">Entrée</div>
                        <div class="example-value">$67,250</div>
                    </div>
                    <div class="example-item">
                        <div class="example-label">Stop Loss</div>
                        <div class="example-value red">$67,115</div>
                    </div>
                    <div class="example-item">
                        <div class="example-label">Take Profit</div>
                        <div class="example-value green">$67,550</div>
                    </div>
                    <div class="example-item">
                        <div class="example-label">Durée</div>
                        <div class="example-value">8 min</div>
                    </div>
                    <div class="example-item">
                        <div class="example-label">Ratio R:R</div>
                        <div class="example-value green">1:2.2</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ========== SWING TRADING ========== -->
        <div class="strategy-section" id="swing">
            <div class="strategy-main-card swing">
                <div class="strategy-header">
                    <div class="strategy-icon swing">🌊</div>
                    <div class="strategy-title-section">
                        <h2>Swing Trading - Capturer les Vagues</h2>
                        <p>Le swing trading vise à capturer les mouvements de prix sur plusieurs jours à semaines. Idéal pour ceux qui ne peuvent pas surveiller les marchés constamment.</p>
                        <div class="strategy-badges">
                            <span class="badge risk-medium">⚠️ Risque Modéré</span>
                            <span class="badge timeframe">⏱️ 4H - 1 Semaine</span>
                            <span class="badge winrate">📈 50-60% Win Rate</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="info-grid">
                <div class="info-card">
                    <div class="info-card-header">
                        <div class="info-card-icon blue">⏰</div>
                        <h4>Temps Requis</h4>
                    </div>
                    <p>Analyse quotidienne de 30-60 minutes. Pas besoin de surveiller constamment.</p>
                    <ul>
                        <li>Analyse: 30-60 min/jour</li>
                        <li>2-10 trades par mois</li>
                        <li>Durée: 2-14 jours</li>
                    </ul>
                </div>
                
                <div class="info-card">
                    <div class="info-card-header">
                        <div class="info-card-icon green">💰</div>
                        <h4>Capital Recommandé</h4>
                    </div>
                    <p>Capital modéré suffisant car les frais sont moins impactants sur des trades plus longs.</p>
                    <ul>
                        <li>Minimum: $2,000</li>
                        <li>Idéal: $5,000+</li>
                        <li>Risque: 1-2% par trade</li>
                    </ul>
                </div>
                
                <div class="info-card">
                    <div class="info-card-header">
                        <div class="info-card-icon pink">🎯</div>
                        <h4>Objectifs de Profit</h4>
                    </div>
                    <p>Visez des mouvements plus importants avec un excellent ratio risque/récompense.</p>
                    <ul>
                        <li>Profit par trade: 5-15%</li>
                        <li>Stop Loss: 2-5%</li>
                        <li>Ratio R:R minimum: 1:2</li>
                    </ul>
                </div>
            </div>
            
            <div class="indicators-section">
                <h3 class="section-title">📊 Indicateurs Recommandés pour le Swing</h3>
                <div class="indicators-grid">
                    <div class="indicator-card">
                        <div class="indicator-name">
                            MACD
                            <span class="indicator-tag">MOMENTUM</span>
                        </div>
                        <p class="indicator-desc">Le MACD identifie les changements de momentum et les retournements de tendance sur le moyen terme.</p>
                        <div class="indicator-settings">
                            <h5>Paramètres Optimaux</h5>
                            <div class="setting-row">
                                <span class="setting-label">Rapide</span>
                                <span class="setting-value">12</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Lent</span>
                                <span class="setting-value">26</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Signal</span>
                                <span class="setting-value">9</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="indicator-card">
                        <div class="indicator-name">
                            Fibonacci Retracement
                            <span class="indicator-tag">SUPPORT/RÉSISTANCE</span>
                        </div>
                        <p class="indicator-desc">Identifiez les niveaux clés de support et résistance pour des entrées optimales.</p>
                        <div class="indicator-settings">
                            <h5>Niveaux Clés</h5>
                            <div class="setting-row">
                                <span class="setting-label">Golden Zone</span>
                                <span class="setting-value">0.618 - 0.65</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Support</span>
                                <span class="setting-value">0.5, 0.382</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Extension</span>
                                <span class="setting-value">1.618, 2.618</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="indicator-card">
                        <div class="indicator-name">
                            SMA 50 & 200
                            <span class="indicator-tag">TENDANCE</span>
                        </div>
                        <p class="indicator-desc">Les moyennes mobiles longues définissent la tendance principale et les zones d'achat/vente.</p>
                        <div class="indicator-settings">
                            <h5>Signaux</h5>
                            <div class="setting-row">
                                <span class="setting-label">Golden Cross</span>
                                <span class="setting-value">SMA50 > SMA200</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Death Cross</span>
                                <span class="setting-value">SMA50 < SMA200</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Support</span>
                                <span class="setting-value">Rebond sur SMA</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="indicator-card">
                        <div class="indicator-name">
                            Stochastic RSI
                            <span class="indicator-tag">TIMING</span>
                        </div>
                        <p class="indicator-desc">Combine RSI et Stochastic pour un timing d'entrée précis sur les swings.</p>
                        <div class="indicator-settings">
                            <h5>Paramètres Optimaux</h5>
                            <div class="setting-row">
                                <span class="setting-label">RSI Length</span>
                                <span class="setting-value">14</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Stoch Length</span>
                                <span class="setting-value">14</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Signal</span>
                                <span class="setting-value">Croisement K/D</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="rules-section">
                <div class="rules-card entry">
                    <h3>🟢 Règles d'Entrée Swing</h3>
                    <div class="rule-item">
                        <div class="rule-number">1</div>
                        <div class="rule-content">
                            <h4>Tendance confirmée</h4>
                            <p>Prix au-dessus de SMA 200 pour les longs, en-dessous pour les shorts</p>
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">2</div>
                        <div class="rule-content">
                            <h4>Pullback sur support</h4>
                            <p>Attendre un retracement vers Fibonacci 0.5-0.618 ou SMA 50</p>
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">3</div>
                        <div class="rule-content">
                            <h4>Confirmation MACD</h4>
                            <p>Croisement haussier du MACD ou divergence positive</p>
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">4</div>
                        <div class="rule-content">
                            <h4>Structure de prix</h4>
                            <p>Higher highs et higher lows confirmés sur le graphique</p>
                        </div>
                    </div>
                </div>
                
                <div class="rules-card exit">
                    <h3>🔴 Règles de Sortie Swing</h3>
                    <div class="rule-item">
                        <div class="rule-number">1</div>
                        <div class="rule-content">
                            <h4>Objectif Fibonacci atteint</h4>
                            <p>Prendre profit partiel à extension 1.618, total à 2.618</p>
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">2</div>
                        <div class="rule-content">
                            <h4>Stop Loss dynamique</h4>
                            <p>Trailing stop sous le dernier swing low (2-3%)</p>
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">3</div>
                        <div class="rule-content">
                            <h4>Divergence baissière</h4>
                            <p>Sortie si divergence MACD ou RSI apparaît</p>
                        </div>
                    </div>
                    <div class="rule-item">
                        <div class="rule-number">4</div>
                        <div class="rule-content">
                            <h4>Cassure de structure</h4>
                            <p>Sortie si lower low confirmé (tendance inversée)</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="example-section">
                <div class="example-header">
                    <h3>📝 Exemple de Trade Swing Réussi</h3>
                    <span class="example-badge">+12.5% Profit</span>
                </div>
                <div class="example-grid">
                    <div class="example-item">
                        <div class="example-label">Paire</div>
                        <div class="example-value blue">ETH/USDT</div>
                    </div>
                    <div class="example-item">
                        <div class="example-label">Entrée</div>
                        <div class="example-value">$3,200</div>
                    </div>
                    <div class="example-item">
                        <div class="example-label">Stop Loss</div>
                        <div class="example-value red">$3,040</div>
                    </div>
                    <div class="example-item">
                        <div class="example-label">Take Profit</div>
                        <div class="example-value green">$3,600</div>
                    </div>
                    <div class="example-item">
                        <div class="example-label">Durée</div>
                        <div class="example-value">8 jours</div>
                    </div>
                    <div class="example-item">
                        <div class="example-label">Ratio R:R</div>
                        <div class="example-value green">1:2.5</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ========== DAY TRADING ========== -->
        <div class="strategy-section" id="daytrading">
            <div class="strategy-main-card daytrading">
                <div class="strategy-header">
                    <div class="strategy-icon daytrading">📊</div>
                    <div class="strategy-title-section">
                        <h2>Day Trading - Profits Quotidiens</h2>
                        <p>Le day trading consiste à ouvrir et fermer toutes les positions dans la même journée. Aucune position overnight pour éviter les gaps.</p>
                        <div class="strategy-badges">
                            <span class="badge risk-medium">⚠️ Risque Modéré</span>
                            <span class="badge timeframe">⏱️ 15min - 4H</span>
                            <span class="badge winrate">📈 50-55% Win Rate</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="info-grid">
                <div class="info-card">
                    <div class="info-card-header">
                        <div class="info-card-icon green">⏰</div>
                        <h4>Temps Requis</h4>
                    </div>
                    <p>Sessions de trading actif pendant les heures de forte volatilité.</p>
                    <ul>
                        <li>4-8 heures par jour</li>
                        <li>3-10 trades par jour</li>
                        <li>Clôture avant minuit</li>
                    </ul>
                </div>
                
                <div class="info-card">
                    <div class="info-card-header">
                        <div class="info-card-icon blue">💰</div>
                        <h4>Capital Recommandé</h4>
                    </div>
                    <p>Capital suffisant pour diversifier et absorber les pertes quotidiennes.</p>
                    <ul>
                        <li>Minimum: $3,000</li>
                        <li>Idéal: $10,000+</li>
                        <li>Risque: 1% par trade max</li>
                    </ul>
                </div>
                
                <div class="info-card">
                    <div class="info-card-header">
                        <div class="info-card-icon orange">🎯</div>
                        <h4>Objectifs de Profit</h4>
                    </div>
                    <p>Objectifs journaliers réalistes avec une gestion stricte du risque.</p>
                    <ul>
                        <li>Profit par trade: 1-3%</li>
                        <li>Stop Loss: 0.5-1%</li>
                        <li>Objectif jour: 1-2%</li>
                    </ul>
                </div>
            </div>
            
            <div class="indicators-section">
                <h3 class="section-title">📊 Indicateurs Recommandés pour le Day Trading</h3>
                <div class="indicators-grid">
                    <div class="indicator-card">
                        <div class="indicator-name">
                            Volume Profile
                            <span class="indicator-tag">VOLUME</span>
                        </div>
                        <p class="indicator-desc">Identifie les zones de prix avec le plus de volume échangé (POC, VAH, VAL).</p>
                        <div class="indicator-settings">
                            <h5>Zones Clés</h5>
                            <div class="setting-row">
                                <span class="setting-label">POC</span>
                                <span class="setting-value">Point of Control</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">VAH</span>
                                <span class="setting-value">Value Area High</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">VAL</span>
                                <span class="setting-value">Value Area Low</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="indicator-card">
                        <div class="indicator-name">
                            ATR (Average True Range)
                            <span class="indicator-tag">VOLATILITÉ</span>
                        </div>
                        <p class="indicator-desc">Mesure la volatilité pour dimensionner les stops et take profits de manière dynamique.</p>
                        <div class="indicator-settings">
                            <h5>Paramètres Optimaux</h5>
                            <div class="setting-row">
                                <span class="setting-label">Période</span>
                                <span class="setting-value">14</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Stop Loss</span>
                                <span class="setting-value">1.5x ATR</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Take Profit</span>
                                <span class="setting-value">2-3x ATR</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="indicator-card">
                        <div class="indicator-name">
                            Pivot Points
                            <span class="indicator-tag">NIVEAUX</span>
                        </div>
                        <p class="indicator-desc">Niveaux de support/résistance calculés sur la session précédente.</p>
                        <div class="indicator-settings">
                            <h5>Niveaux</h5>
                            <div class="setting-row">
                                <span class="setting-label">Pivot</span>
                                <span class="setting-value">Point central</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">R1, R2, R3</span>
                                <span class="setting-value">Résistances</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">S1, S2, S3</span>
                                <span class="setting-value">Supports</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="indicator-card">
                        <div class="indicator-name">
                            Order Flow / Footprint
                            <span class="indicator-tag">AVANCÉ</span>
                        </div>
                        <p class="indicator-desc">Analyse les ordres d'achat/vente en temps réel pour anticiper les mouvements.</p>
                        <div class="indicator-settings">
                            <h5>Signaux</h5>
                            <div class="setting-row">
                                <span class="setting-label">Delta</span>
                                <span class="setting-value">Buy - Sell volume</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Imbalance</span>
                                <span class="setting-value">> 300%</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Absorption</span>
                                <span class="setting-value">Gros ordres</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ========== HODL / DCA ========== -->
        <div class="strategy-section" id="hodl">
            <div class="strategy-main-card hodl">
                <div class="strategy-header">
                    <div class="strategy-icon hodl">💎</div>
                    <div class="strategy-title-section">
                        <h2>HODL & DCA - Investissement Long Terme</h2>
                        <p>Stratégie d'accumulation progressive pour construire un portefeuille solide sur le long terme. Idéal pour les débutants et investisseurs passifs.</p>
                        <div class="strategy-badges">
                            <span class="badge risk-low">✅ Risque Faible</span>
                            <span class="badge timeframe">⏱️ Mois - Années</span>
                            <span class="badge winrate">📈 Historique: +200%/an</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="info-grid">
                <div class="info-card">
                    <div class="info-card-header">
                        <div class="info-card-icon pink">⏰</div>
                        <h4>Temps Requis</h4>
                    </div>
                    <p>Stratégie passive nécessitant très peu de temps. Parfait pour les débutants.</p>
                    <ul>
                        <li>1-2 heures par mois</li>
                        <li>Achat automatique possible</li>
                        <li>Pas de stress quotidien</li>
                    </ul>
                </div>
                
                <div class="info-card">
                    <div class="info-card-header">
                        <div class="info-card-icon green">💰</div>
                        <h4>Capital Recommandé</h4>
                    </div>
                    <p>Commencez avec n'importe quel montant. La régularité est plus importante que le montant.</p>
                    <ul>
                        <li>Minimum: $50/mois</li>
                        <li>Idéal: $200-500/mois</li>
                        <li>Investir ce qu'on peut perdre</li>
                    </ul>
                </div>
                
                <div class="info-card">
                    <div class="info-card-header">
                        <div class="info-card-icon blue">🎯</div>
                        <h4>Objectifs</h4>
                    </div>
                    <p>Construire un patrimoine sur 3-10 ans avec les cycles crypto.</p>
                    <ul>
                        <li>Horizon: 4+ ans (1 cycle)</li>
                        <li>Objectif: x5 à x20</li>
                        <li>Patience = Clé du succès</li>
                    </ul>
                </div>
            </div>
            
            <div class="indicators-section">
                <h3 class="section-title">📊 Métriques à Surveiller pour le HODL</h3>
                <div class="indicators-grid">
                    <div class="indicator-card">
                        <div class="indicator-name">
                            Bitcoin Halving Cycle
                            <span class="indicator-tag">CYCLE</span>
                        </div>
                        <p class="indicator-desc">Le halving Bitcoin tous les 4 ans influence historiquement les bull runs.</p>
                        <div class="indicator-settings">
                            <h5>Dates Clés</h5>
                            <div class="setting-row">
                                <span class="setting-label">Dernier Halving</span>
                                <span class="setting-value">Avril 2024</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Prochain</span>
                                <span class="setting-value">~2028</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Bull Run</span>
                                <span class="setting-value">12-18 mois après</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="indicator-card">
                        <div class="indicator-name">
                            Fear & Greed Index
                            <span class="indicator-tag">SENTIMENT</span>
                        </div>
                        <p class="indicator-desc">Achetez quand les autres ont peur, vendez quand ils sont euphoriques.</p>
                        <div class="indicator-settings">
                            <h5>Zones d'Action</h5>
                            <div class="setting-row">
                                <span class="setting-label">Extreme Fear</span>
                                <span class="setting-value">0-25 = ACHETER</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Neutral</span>
                                <span class="setting-value">40-60 = DCA</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Extreme Greed</span>
                                <span class="setting-value">75-100 = PRUDENCE</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="indicator-card">
                        <div class="indicator-name">
                            MVRV Z-Score
                            <span class="indicator-tag">ON-CHAIN</span>
                        </div>
                        <p class="indicator-desc">Compare la valeur de marché à la valeur réalisée pour identifier les tops/bottoms.</p>
                        <div class="indicator-settings">
                            <h5>Interprétation</h5>
                            <div class="setting-row">
                                <span class="setting-label">Zone Rouge</span>
                                <span class="setting-value">> 7 = TOP</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Zone Verte</span>
                                <span class="setting-value">< 0 = BOTTOM</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Accumulation</span>
                                <span class="setting-value">0-2 = ACHETER</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="indicator-card">
                        <div class="indicator-name">
                            Stock-to-Flow Model
                            <span class="indicator-tag">PRÉDICTION</span>
                        </div>
                        <p class="indicator-desc">Modèle de rareté basé sur le ratio stock/production annuelle.</p>
                        <div class="indicator-settings">
                            <h5>Projections</h5>
                            <div class="setting-row">
                                <span class="setting-label">Post-Halving 2024</span>
                                <span class="setting-value">$100k-150k</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Cycle Peak</span>
                                <span class="setting-value">2025</span>
                            </div>
                            <div class="setting-row">
                                <span class="setting-label">Fiabilité</span>
                                <span class="setting-value">~85% historique</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="tips-grid">
                <div class="tip-card">
                    <h4>💡 Règle des 4 Ans</h4>
                    <p>Historiquement, Bitcoin n'a jamais été en perte sur une période de 4 ans. La patience paie toujours.</p>
                </div>
                <div class="tip-card">
                    <h4>📅 DCA Automatique</h4>
                    <p>Configurez des achats automatiques hebdomadaires ou mensuels pour éliminer l'émotion de vos décisions.</p>
                </div>
                <div class="tip-card">
                    <h4>🔒 Cold Storage</h4>
                    <p>Pour le HODL long terme, utilisez un hardware wallet (Ledger, Trezor) pour sécuriser vos cryptos.</p>
                </div>
                <div class="tip-card">
                    <h4>📊 Allocation Recommandée</h4>
                    <p>60% BTC, 25% ETH, 15% Altcoins de qualité. Rééquilibrez annuellement.</p>
                </div>
            </div>
        </div>
        
        <!-- Calculateur de Position -->
        <div class="calculator-section">
            <h3 class="section-title">🧮 Calculateur de Position</h3>
            <div class="calc-grid">
                <div class="calc-input-group">
                    <label>💰 Capital Total ($)</label>
                    <input type="number" class="calc-input" id="calcCapital" value="10000" min="100">
                </div>
                <div class="calc-input-group">
                    <label>⚠️ Risque par Trade (%)</label>
                    <input type="number" class="calc-input" id="calcRisk" value="2" min="0.5" max="10" step="0.5">
                </div>
                <div class="calc-input-group">
                    <label>🎯 Prix d'Entrée ($)</label>
                    <input type="number" class="calc-input" id="calcEntry" value="65000" min="0" step="0.01">
                </div>
                <div class="calc-input-group">
                    <label>🛑 Stop Loss ($)</label>
                    <input type="number" class="calc-input" id="calcStop" value="63000" min="0" step="0.01">
                </div>
                <div class="calc-input-group">
                    <label>✅ Take Profit ($)</label>
                    <input type="number" class="calc-input" id="calcTP" value="70000" min="0" step="0.01">
                </div>
                <div class="calc-input-group">
                    <label>⚡ Levier (x)</label>
                    <select class="calc-input" id="calcLeverage">
                        <option value="1">1x (Spot)</option>
                        <option value="2">2x</option>
                        <option value="3">3x</option>
                        <option value="5">5x</option>
                        <option value="10">10x</option>
                    </select>
                </div>
            </div>
            <div class="calc-results">
                <div class="calc-result-item">
                    <div class="calc-result-value" id="resultPosition">$0</div>
                    <div class="calc-result-label">Taille Position</div>
                </div>
                <div class="calc-result-item">
                    <div class="calc-result-value" id="resultRiskAmt">$0</div>
                    <div class="calc-result-label">Risque en $</div>
                </div>
                <div class="calc-result-item">
                    <div class="calc-result-value profit" id="resultProfit">$0</div>
                    <div class="calc-result-label">Profit Potentiel</div>
                </div>
                <div class="calc-result-item">
                    <div class="calc-result-value" id="resultRR">1:0</div>
                    <div class="calc-result-label">Ratio R:R</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Navigation des stratégies
        function showStrategy(strategyId) {
            document.querySelectorAll('.strategy-section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            
            document.getElementById(strategyId).classList.add('active');
            event.target.closest('.nav-btn').classList.add('active');
        }
        
        // Fetch prix en temps réel
        async function fetchPrices() {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple,cardano&vs_currencies=usd&include_24hr_change=true');
                const data = await response.json();
                
                const coins = {
                    'btc': data.bitcoin,
                    'eth': data.ethereum,
                    'sol': data.solana,
                    'bnb': data.binancecoin,
                    'xrp': data.ripple,
                    'ada': data.cardano
                };
                
                for (const [symbol, info] of Object.entries(coins)) {
                    const priceEl = document.getElementById(symbol + '-price');
                    const changeEl = document.getElementById(symbol + '-change');
                    
                    if (priceEl && info) {
                        priceEl.textContent = '$' + info.usd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                    }
                    if (changeEl && info) {
                        const change = info.usd_24h_change;
                        changeEl.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
                        changeEl.className = 'ticker-change ' + (change >= 0 ? 'positive' : 'negative');
                    }
                }
            } catch (e) {
                console.log('Price fetch error:', e);
            }
        }
        
        fetchPrices();
        setInterval(fetchPrices, 30000);
        
        // Calculateur de position
        function calculatePosition() {
            const capital = parseFloat(document.getElementById('calcCapital').value) || 0;
            const riskPercent = parseFloat(document.getElementById('calcRisk').value) || 0;
            const entry = parseFloat(document.getElementById('calcEntry').value) || 0;
            const stop = parseFloat(document.getElementById('calcStop').value) || 0;
            const tp = parseFloat(document.getElementById('calcTP').value) || 0;
            const leverage = parseFloat(document.getElementById('calcLeverage').value) || 1;
            
            if (entry <= 0 || stop <= 0) return;
            
            const riskAmount = capital * (riskPercent / 100);
            const stopDistance = Math.abs(entry - stop);
            const positionSize = (riskAmount / stopDistance) * entry * leverage;
            const profitDistance = Math.abs(tp - entry);
            const potentialProfit = (profitDistance / entry) * positionSize;
            const rrRatio = profitDistance / stopDistance;
            
            document.getElementById('resultPosition').textContent = '$' + positionSize.toLocaleString('en-US', {maximumFractionDigits: 0});
            document.getElementById('resultRiskAmt').textContent = '$' + riskAmount.toLocaleString('en-US', {maximumFractionDigits: 0});
            document.getElementById('resultProfit').textContent = '+$' + potentialProfit.toLocaleString('en-US', {maximumFractionDigits: 0});
            document.getElementById('resultRR').textContent = '1:' + rrRatio.toFixed(2);
        }
        
        ['calcCapital', 'calcRisk', 'calcEntry', 'calcStop', 'calcTP', 'calcLeverage'].forEach(id => {
            document.getElementById(id).addEventListener('input', calculatePosition);
        });
        
        calculatePosition();
    </script>
</body>
</html>
"""