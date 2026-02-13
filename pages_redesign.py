"""
Pages Redesign - CryptoIA
Pages améliorées avec design révolutionnaire et données réelles
- /strategie
- /spot-trading
- /contact
- /convertisseur
- /calculatrice
"""

# ============================================================================
# PAGE STRATÉGIE - Design Ultra Moderne avec Animations
# ============================================================================
def get_strategie_page_html(SIDEBAR, CSS):
    return SIDEBAR + """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Stratégies de Trading - CryptoIA</title>
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
            max-width: 600px;
            margin: 0 auto;
        }
        
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
            animation: scroll 30s linear infinite;
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
        
        .strategies-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .strategy-card {
            background: linear-gradient(145deg, var(--card) 0%, rgba(15, 23, 42, 0.8) 100%);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 30px;
            position: relative;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .strategy-card:hover {
            transform: translateY(-8px);
            border-color: var(--primary);
            box-shadow: 0 25px 50px rgba(99, 102, 241, 0.2);
        }
        
        .strategy-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .strategy-card:hover::before { opacity: 1; }
        
        .strategy-icon {
            width: 60px;
            height: 60px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            margin-bottom: 20px;
        }
        
        .strategy-icon.trend { background: linear-gradient(135deg, #10b981, #059669); }
        .strategy-icon.scalp { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .strategy-icon.swing { background: linear-gradient(135deg, #6366f1, #4f46e5); }
        .strategy-icon.dca { background: linear-gradient(135deg, #ec4899, #db2777); }
        
        .strategy-card h3 {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 10px;
        }
        
        .strategy-card p {
            color: var(--muted);
            font-size: 0.95rem;
            margin-bottom: 20px;
        }
        
        .strategy-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            padding-top: 20px;
            border-top: 1px solid var(--border);
        }
        
        .stat { text-align: center; }
        .stat-value { font-size: 1.25rem; font-weight: 700; color: var(--primary-light); }
        .stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
        
        .risk-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        
        .risk-badge.low { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .risk-badge.medium { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
        .risk-badge.high { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        
        .strategy-builder {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 35px;
            margin-bottom: 40px;
        }
        
        .builder-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .builder-header h2 {
            font-size: 1.75rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .builder-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
        }
        
        .builder-input {
            background: var(--dark);
            border: 2px solid var(--border);
            border-radius: 14px;
            padding: 20px;
            transition: all 0.3s;
        }
        
        .builder-input:focus-within {
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        
        .builder-input label {
            display: block;
            font-size: 13px;
            color: var(--muted);
            margin-bottom: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .builder-input input,
        .builder-input select {
            width: 100%;
            background: transparent;
            border: none;
            color: var(--text);
            font-size: 1.25rem;
            font-weight: 600;
            padding: 5px 0;
        }
        
        .builder-input input:focus,
        .builder-input select:focus { outline: none; }
        
        .builder-input select option { background: var(--dark); color: var(--text); }
        
        .results-panel {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%);
            border: 1px solid var(--primary);
            border-radius: 16px;
            padding: 25px;
            margin-top: 30px;
        }
        
        .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .result-item {
            text-align: center;
            padding: 20px;
            background: rgba(15, 23, 42, 0.5);
            border-radius: 12px;
        }
        
        .result-value {
            font-size: 2rem;
            font-weight: 800;
            color: var(--primary-light);
            margin-bottom: 5px;
        }
        
        .result-value.profit { color: #10b981; }
        .result-value.loss { color: #ef4444; }
        
        .result-label {
            font-size: 12px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .hero { padding: 30px 20px; }
            .strategies-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="bg-animation"></div>
    
    <div class="main-container">
        <div class="hero">
            <div class="hero-content">
                <h1>🎯 Stratégies de Trading</h1>
                <p>Maîtrisez les techniques des traders professionnels avec nos stratégies éprouvées</p>
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
        
        <div class="strategies-grid">
            <div class="strategy-card">
                <div class="strategy-icon trend">📈</div>
                <span class="risk-badge low">● Risque Faible</span>
                <h3>Trend Following</h3>
                <p>Suivez la tendance principale du marché. Achetez quand le prix est au-dessus des moyennes mobiles.</p>
                <div class="strategy-stats">
                    <div class="stat">
                        <div class="stat-value">65%</div>
                        <div class="stat-label">Win Rate</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">1:2.5</div>
                        <div class="stat-label">Risk/Reward</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">4H-1D</div>
                        <div class="stat-label">Timeframe</div>
                    </div>
                </div>
            </div>
            
            <div class="strategy-card">
                <div class="strategy-icon scalp">⚡</div>
                <span class="risk-badge high">● Risque Élevé</span>
                <h3>Scalping</h3>
                <p>Profitez des petits mouvements de prix avec des trades rapides et une gestion stricte du risque.</p>
                <div class="strategy-stats">
                    <div class="stat">
                        <div class="stat-value">55%</div>
                        <div class="stat-label">Win Rate</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">1:1.5</div>
                        <div class="stat-label">Risk/Reward</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">1M-15M</div>
                        <div class="stat-label">Timeframe</div>
                    </div>
                </div>
            </div>
            
            <div class="strategy-card">
                <div class="strategy-icon swing">🌊</div>
                <span class="risk-badge medium">● Risque Moyen</span>
                <h3>Swing Trading</h3>
                <p>Capturez les mouvements de prix sur plusieurs jours. Idéal pour ceux qui ne peuvent pas surveiller constamment.</p>
                <div class="strategy-stats">
                    <div class="stat">
                        <div class="stat-value">60%</div>
                        <div class="stat-label">Win Rate</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">1:3</div>
                        <div class="stat-label">Risk/Reward</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">1D-1W</div>
                        <div class="stat-label">Timeframe</div>
                    </div>
                </div>
            </div>
            
            <div class="strategy-card">
                <div class="strategy-icon dca">💎</div>
                <span class="risk-badge low">● Risque Faible</span>
                <h3>DCA (Dollar Cost Averaging)</h3>
                <p>Investissez régulièrement un montant fixe pour réduire l'impact de la volatilité sur le long terme.</p>
                <div class="strategy-stats">
                    <div class="stat">
                        <div class="stat-value">N/A</div>
                        <div class="stat-label">Win Rate</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">Long</div>
                        <div class="stat-label">Horizon</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">1W-1M</div>
                        <div class="stat-label">Fréquence</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="strategy-builder">
            <div class="builder-header">
                <h2>🔧 Calculateur de Position</h2>
            </div>
            
            <div class="builder-grid">
                <div class="builder-input">
                    <label>Capital Total ($)</label>
                    <input type="number" id="capital" value="10000" min="100" step="100">
                </div>
                <div class="builder-input">
                    <label>Risque par Trade (%)</label>
                    <input type="number" id="riskPercent" value="2" min="0.5" max="10" step="0.5">
                </div>
                <div class="builder-input">
                    <label>Prix d'Entrée ($)</label>
                    <input type="number" id="entryPrice" value="50000" min="0" step="0.01">
                </div>
                <div class="builder-input">
                    <label>Stop Loss ($)</label>
                    <input type="number" id="stopLoss" value="48000" min="0" step="0.01">
                </div>
                <div class="builder-input">
                    <label>Take Profit ($)</label>
                    <input type="number" id="takeProfit" value="55000" min="0" step="0.01">
                </div>
                <div class="builder-input">
                    <label>Levier (x)</label>
                    <select id="leverage">
                        <option value="1">1x (Spot)</option>
                        <option value="2">2x</option>
                        <option value="3">3x</option>
                        <option value="5">5x</option>
                        <option value="10">10x</option>
                    </select>
                </div>
            </div>
            
            <div class="results-panel">
                <div class="results-grid">
                    <div class="result-item">
                        <div class="result-value" id="positionSize">--</div>
                        <div class="result-label">Taille Position</div>
                    </div>
                    <div class="result-item">
                        <div class="result-value" id="riskAmount">--</div>
                        <div class="result-label">Risque ($)</div>
                    </div>
                    <div class="result-item">
                        <div class="result-value profit" id="potentialProfit">--</div>
                        <div class="result-label">Profit Potentiel</div>
                    </div>
                    <div class="result-item">
                        <div class="result-value" id="rrRatio">--</div>
                        <div class="result-label">Ratio R:R</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
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
        
        function calculatePosition() {
            const capital = parseFloat(document.getElementById('capital').value) || 0;
            const riskPercent = parseFloat(document.getElementById('riskPercent').value) || 0;
            const entryPrice = parseFloat(document.getElementById('entryPrice').value) || 0;
            const stopLoss = parseFloat(document.getElementById('stopLoss').value) || 0;
            const takeProfit = parseFloat(document.getElementById('takeProfit').value) || 0;
            const leverage = parseFloat(document.getElementById('leverage').value) || 1;
            
            if (entryPrice <= 0 || stopLoss <= 0) return;
            
            const riskAmount = capital * (riskPercent / 100);
            const stopDistance = Math.abs(entryPrice - stopLoss);
            const positionSize = (riskAmount / stopDistance) * entryPrice;
            const effectivePosition = positionSize * leverage;
            const profitDistance = Math.abs(takeProfit - entryPrice);
            const potentialProfit = (profitDistance / entryPrice) * effectivePosition;
            const rrRatio = profitDistance / stopDistance;
            
            document.getElementById('positionSize').textContent = '$' + effectivePosition.toLocaleString('en-US', {maximumFractionDigits: 0});
            document.getElementById('riskAmount').textContent = '$' + riskAmount.toLocaleString('en-US', {maximumFractionDigits: 0});
            document.getElementById('potentialProfit').textContent = '+$' + potentialProfit.toLocaleString('en-US', {maximumFractionDigits: 0});
            document.getElementById('rrRatio').textContent = '1:' + rrRatio.toFixed(2);
        }
        
        ['capital', 'riskPercent', 'entryPrice', 'stopLoss', 'takeProfit', 'leverage'].forEach(id => {
            document.getElementById(id).addEventListener('input', calculatePosition);
        });
        
        calculatePosition();
    </script>
</body>
</html>
"""