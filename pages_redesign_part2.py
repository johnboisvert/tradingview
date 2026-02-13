"""
Pages Redesign Part 2 - CryptoIA
- /spot-trading
- /contact
- /convertisseur
- /calculatrice
"""

# ============================================================================
# PAGE SPOT TRADING
# ============================================================================
def get_spot_trading_page_html(SIDEBAR, CSS):
    return SIDEBAR + """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💹 Spot Trading - CryptoIA</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script>
    """ + CSS + """
    <style>
        :root {
            --primary: #10b981;
            --primary-dark: #059669;
            --secondary: #6366f1;
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
        }
        
        .main-container {
            margin-left: 280px;
            padding: 25px;
            min-height: 100vh;
        }
        
        @media (max-width: 1024px) {
            .main-container { margin-left: 0; padding: 15px; }
        }
        
        .hero {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .hero h1 {
            font-size: 2.75rem;
            font-weight: 800;
            background: linear-gradient(135deg, #10b981, #6366f1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }
        
        .hero p { color: var(--muted); font-size: 1.1rem; }
        
        .stats-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 25px;
            text-align: center;
            transition: all 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            border-color: var(--primary);
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.15);
        }
        
        .stat-icon { font-size: 2rem; margin-bottom: 10px; }
        .stat-value { font-size: 1.75rem; font-weight: 800; color: var(--text); margin-bottom: 5px; }
        .stat-value.up { color: var(--primary); }
        .stat-value.down { color: var(--danger); }
        .stat-label { font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
        
        .main-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 25px;
            margin-bottom: 30px;
        }
        
        @media (max-width: 1200px) {
            .main-grid { grid-template-columns: 1fr; }
        }
        
        .chart-section {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 25px;
        }
        
        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .chart-title {
            font-size: 1.25rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .chart-controls { display: flex; gap: 8px; }
        
        .chart-btn {
            padding: 8px 16px;
            background: var(--dark);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--muted);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .chart-btn:hover, .chart-btn.active {
            background: var(--primary);
            border-color: var(--primary);
            color: white;
        }
        
        .chart-container { height: 400px; position: relative; }
        
        .orderbook {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 25px;
        }
        
        .orderbook-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .orderbook-title { font-size: 1.1rem; font-weight: 700; }
        
        .spread-badge {
            background: rgba(99, 102, 241, 0.15);
            color: var(--secondary);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .orderbook-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            padding: 8px 0;
            font-size: 13px;
            position: relative;
        }
        
        .orderbook-row.header {
            color: var(--muted);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 1px;
            border-bottom: 1px solid var(--border);
            padding-bottom: 12px;
            margin-bottom: 10px;
        }
        
        .orderbook-row.ask { color: var(--danger); }
        .orderbook-row.bid { color: var(--primary); }
        .orderbook-row .price { font-weight: 600; }
        .orderbook-row .amount { text-align: center; }
        .orderbook-row .total { text-align: right; color: var(--muted); }
        
        .mid-price {
            text-align: center;
            padding: 15px;
            background: rgba(99, 102, 241, 0.1);
            border-radius: 10px;
            margin: 15px 0;
        }
        
        .mid-price-value { font-size: 1.5rem; font-weight: 800; color: var(--secondary); }
        .mid-price-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
        
        .coins-section {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 30px;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 1.25rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .filter-tabs { display: flex; gap: 8px; }
        
        .filter-tab {
            padding: 8px 16px;
            background: var(--dark);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--muted);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .filter-tab:hover, .filter-tab.active {
            background: var(--primary);
            border-color: var(--primary);
            color: white;
        }
        
        .coins-table { width: 100%; border-collapse: collapse; }
        
        .coins-table th {
            text-align: left;
            padding: 12px;
            color: var(--muted);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid var(--border);
        }
        
        .coins-table td {
            padding: 16px 12px;
            border-bottom: 1px solid rgba(51, 65, 85, 0.5);
        }
        
        .coins-table tr { transition: all 0.3s; }
        .coins-table tr:hover { background: rgba(16, 185, 129, 0.05); }
        
        .coin-info { display: flex; align-items: center; gap: 12px; }
        
        .coin-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--dark);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
        }
        
        .coin-name { font-weight: 700; }
        .coin-symbol { color: var(--muted); font-size: 13px; }
        .price-cell { font-weight: 700; font-size: 1rem; }
        
        .change-cell {
            font-weight: 600;
            padding: 6px 12px;
            border-radius: 8px;
            display: inline-block;
        }
        
        .change-cell.positive { background: rgba(16, 185, 129, 0.15); color: var(--primary); }
        .change-cell.negative { background: rgba(239, 68, 68, 0.15); color: var(--danger); }
        
        .volume-cell { color: var(--muted); }
        
        .tips-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
            border-color: var(--primary);
        }
        
        .tip-icon {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-bottom: 15px;
        }
        
        .tip-icon.green { background: rgba(16, 185, 129, 0.15); }
        .tip-icon.blue { background: rgba(99, 102, 241, 0.15); }
        .tip-icon.yellow { background: rgba(245, 158, 11, 0.15); }
        .tip-icon.red { background: rgba(239, 68, 68, 0.15); }
        
        .tip-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 10px; }
        .tip-text { color: var(--muted); font-size: 14px; }
        
        .loading-spinner { display: flex; justify-content: center; align-items: center; padding: 40px; }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="main-container">
        <div class="hero">
            <h1>💹 Spot Trading</h1>
            <p>Achetez et vendez des cryptomonnaies au prix du marché avec des données en temps réel</p>
        </div>
        
        <div class="stats-bar">
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-value" id="totalMarketCap">--</div>
                <div class="stat-label">Market Cap Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-value" id="totalVolume">--</div>
                <div class="stat-label">Volume 24h</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">₿</div>
                <div class="stat-value" id="btcDominance">--</div>
                <div class="stat-label">Dominance BTC</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🔥</div>
                <div class="stat-value" id="activeCoins">--</div>
                <div class="stat-label">Cryptos Actives</div>
            </div>
        </div>
        
        <div class="main-grid">
            <div class="chart-section">
                <div class="chart-header">
                    <div class="chart-title">
                        <span>📈</span>
                        <span>BTC/USD</span>
                        <span id="currentPrice" style="color: var(--primary); font-size: 1.5rem; margin-left: 10px;">--</span>
                    </div>
                    <div class="chart-controls">
                        <button class="chart-btn" onclick="changeTimeframe('1h')">1H</button>
                        <button class="chart-btn active" onclick="changeTimeframe('24h')">24H</button>
                        <button class="chart-btn" onclick="changeTimeframe('7d')">7J</button>
                        <button class="chart-btn" onclick="changeTimeframe('30d')">30J</button>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="priceChart"></canvas>
                </div>
            </div>
            
            <div class="orderbook">
                <div class="orderbook-header">
                    <div class="orderbook-title">📖 Carnet d'Ordres</div>
                    <div class="spread-badge" id="spreadBadge">Spread: --</div>
                </div>
                
                <div class="orderbook-row header">
                    <span>Prix (USD)</span>
                    <span style="text-align: center;">Quantité</span>
                    <span style="text-align: right;">Total</span>
                </div>
                
                <div id="askOrders"></div>
                
                <div class="mid-price">
                    <div class="mid-price-value" id="midPrice">--</div>
                    <div class="mid-price-label">Prix Actuel</div>
                </div>
                
                <div id="bidOrders"></div>
            </div>
        </div>
        
        <div class="coins-section">
            <div class="section-header">
                <div class="section-title">
                    <span>🏆</span>
                    <span>Top Cryptomonnaies</span>
                </div>
                <div class="filter-tabs">
                    <button class="filter-tab active" onclick="filterCoins('all')">Toutes</button>
                    <button class="filter-tab" onclick="filterCoins('gainers')">🚀 Hausse</button>
                    <button class="filter-tab" onclick="filterCoins('losers')">📉 Baisse</button>
                </div>
            </div>
            
            <table class="coins-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Crypto</th>
                        <th>Prix</th>
                        <th>24h %</th>
                        <th>7j %</th>
                        <th>Volume 24h</th>
                        <th>Market Cap</th>
                    </tr>
                </thead>
                <tbody id="coinsTableBody">
                    <tr>
                        <td colspan="7">
                            <div class="loading-spinner"><div class="spinner"></div></div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="tips-section">
            <div class="tip-card">
                <div class="tip-icon green">✅</div>
                <div class="tip-title">Avantages du Spot</div>
                <div class="tip-text">Pas de risque de liquidation, vous possédez réellement vos actifs. Idéal pour les débutants.</div>
            </div>
            <div class="tip-card">
                <div class="tip-icon blue">📊</div>
                <div class="tip-title">Analyse Technique</div>
                <div class="tip-text">Utilisez les supports/résistances et moyennes mobiles pour identifier les meilleurs points d'entrée.</div>
            </div>
            <div class="tip-card">
                <div class="tip-icon yellow">⚡</div>
                <div class="tip-title">Stratégie DCA</div>
                <div class="tip-text">Investissez régulièrement un montant fixe pour lisser votre prix d'achat moyen.</div>
            </div>
            <div class="tip-card">
                <div class="tip-icon red">🛡️</div>
                <div class="tip-title">Gestion du Risque</div>
                <div class="tip-text">Diversifiez et n'investissez que ce que vous pouvez vous permettre de perdre.</div>
            </div>
        </div>
    </div>
    
    <script>
        const coinIcons = {
            'bitcoin': '₿', 'ethereum': 'Ξ', 'tether': '₮', 'binancecoin': '🔸',
            'solana': '◎', 'ripple': '✕', 'cardano': '₳', 'dogecoin': 'Ð'
        };
        
        function formatNumber(num, decimals = 2) {
            if (num >= 1e12) return (num / 1e12).toFixed(decimals) + 'T';
            if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
            if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
            if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
            return num.toFixed(decimals);
        }
        
        function formatPrice(price) {
            if (price >= 1000) return '$' + price.toLocaleString('en-US', {maximumFractionDigits: 0});
            if (price >= 1) return '$' + price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            return '$' + price.toLocaleString('en-US', {minimumFractionDigits: 4, maximumFractionDigits: 6});
        }
        
        async function fetchGlobalData() {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/global');
                const data = await response.json();
                document.getElementById('totalMarketCap').textContent = '$' + formatNumber(data.data.total_market_cap.usd);
                document.getElementById('totalVolume').textContent = '$' + formatNumber(data.data.total_volume.usd);
                document.getElementById('btcDominance').textContent = data.data.market_cap_percentage.btc.toFixed(1) + '%';
                document.getElementById('activeCoins').textContent = data.data.active_cryptocurrencies.toLocaleString();
            } catch (e) { console.log('Global data error:', e); }
        }
        
        let allCoins = [];
        
        async function fetchTopCoins() {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h,7d');
                allCoins = await response.json();
                renderCoins(allCoins);
            } catch (e) { console.log('Coins error:', e); }
        }
        
        function renderCoins(coins) {
            const tbody = document.getElementById('coinsTableBody');
            tbody.innerHTML = coins.map(coin => `
                <tr>
                    <td style="color: var(--muted);">${coin.market_cap_rank}</td>
                    <td>
                        <div class="coin-info">
                            <div class="coin-icon">${coinIcons[coin.id] || coin.symbol.charAt(0).toUpperCase()}</div>
                            <div>
                                <div class="coin-name">${coin.name}</div>
                                <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                            </div>
                        </div>
                    </td>
                    <td class="price-cell">${formatPrice(coin.current_price)}</td>
                    <td>
                        <span class="change-cell ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                            ${coin.price_change_percentage_24h >= 0 ? '+' : ''}${(coin.price_change_percentage_24h || 0).toFixed(2)}%
                        </span>
                    </td>
                    <td>
                        <span class="change-cell ${(coin.price_change_percentage_7d_in_currency || 0) >= 0 ? 'positive' : 'negative'}">
                            ${(coin.price_change_percentage_7d_in_currency || 0) >= 0 ? '+' : ''}${(coin.price_change_percentage_7d_in_currency || 0).toFixed(2)}%
                        </span>
                    </td>
                    <td class="volume-cell">$${formatNumber(coin.total_volume)}</td>
                    <td class="volume-cell">$${formatNumber(coin.market_cap)}</td>
                </tr>
            `).join('');
        }
        
        function filterCoins(type) {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            
            let filtered = [...allCoins];
            if (type === 'gainers') {
                filtered = filtered.filter(c => c.price_change_percentage_24h > 0).sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
            } else if (type === 'losers') {
                filtered = filtered.filter(c => c.price_change_percentage_24h < 0).sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
            }
            renderCoins(filtered);
        }
        
        let priceChart;
        
        async function fetchBTCChart(days = 1) {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=' + days);
                const data = await response.json();
                const prices = data.prices.map(p => ({ x: new Date(p[0]), y: p[1] }));
                const currentPrice = prices[prices.length - 1].y;
                document.getElementById('currentPrice').textContent = formatPrice(currentPrice);
                document.getElementById('midPrice').textContent = formatPrice(currentPrice);
                updateChart(prices);
                generateOrderBook(currentPrice);
            } catch (e) { console.log('Chart error:', e); }
        }
        
        function updateChart(prices) {
            const ctx = document.getElementById('priceChart').getContext('2d');
            
            if (priceChart) {
                priceChart.data.datasets[0].data = prices;
                priceChart.update();
                return;
            }
            
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
            
            priceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'BTC/USD',
                        data: prices,
                        borderColor: '#10b981',
                        backgroundColor: gradient,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { type: 'time', grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8' } },
                        y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', callback: v => formatPrice(v) } }
                    }
                }
            });
        }
        
        function changeTimeframe(tf) {
            document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
            const days = { '1h': 0.04, '24h': 1, '7d': 7, '30d': 30 }[tf] || 1;
            fetchBTCChart(days);
        }
        
        function generateOrderBook(currentPrice) {
            let asks = '', bids = '';
            
            for (let i = 5; i >= 1; i--) {
                const price = currentPrice * (1 + i * 0.001);
                const amount = (Math.random() * 2 + 0.1).toFixed(4);
                asks += '<div class="orderbook-row ask"><span class="price">' + formatPrice(price) + '</span><span class="amount">' + amount + '</span><span class="total">$' + formatNumber(price * amount) + '</span></div>';
            }
            
            for (let i = 1; i <= 5; i++) {
                const price = currentPrice * (1 - i * 0.001);
                const amount = (Math.random() * 2 + 0.1).toFixed(4);
                bids += '<div class="orderbook-row bid"><span class="price">' + formatPrice(price) + '</span><span class="amount">' + amount + '</span><span class="total">$' + formatNumber(price * amount) + '</span></div>';
            }
            
            document.getElementById('askOrders').innerHTML = asks;
            document.getElementById('bidOrders').innerHTML = bids;
            document.getElementById('spreadBadge').textContent = 'Spread: $' + (currentPrice * 0.001).toFixed(2);
        }
        
        fetchGlobalData();
        fetchTopCoins();
        fetchBTCChart(1);
        setInterval(fetchGlobalData, 60000);
        setInterval(fetchTopCoins, 60000);
    </script>
</body>
</html>
"""


# ============================================================================
# PAGE CONTACT
# ============================================================================
def get_contact_page_html(SIDEBAR, CSS, pre_name="", pre_email="", message="", sent=False):
    import html as html_module
    pre_name_safe = html_module.escape(pre_name) if pre_name else ""
    pre_email_safe = html_module.escape(pre_email) if pre_email else ""
    
    success_html = ""
    if sent:
        success_html = """
        <div class="success-banner">
            <div class="success-icon">✅</div>
            <div class="success-content">
                <h3>Message envoyé avec succès!</h3>
                <p>Merci de nous avoir contacté. Nous vous répondrons sous 24h.</p>
            </div>
        </div>
        """
    
    message_html = ""
    if message and not sent:
        message_html = '<div class="info-banner"><div class="info-icon">ℹ️</div><div class="info-content">' + message + '</div></div>'
    
    return SIDEBAR + """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📬 Contact - CryptoIA</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    """ + CSS + """
    <style>
        :root {
            --primary: #6366f1;
            --primary-light: #818cf8;
            --secondary: #ec4899;
            --success: #10b981;
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
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 24px;
            padding: 50px;
            margin-bottom: 40px;
            text-align: center;
        }
        
        .hero h1 {
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(135deg, #6366f1, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 15px;
        }
        
        .hero p { color: var(--muted); font-size: 1.15rem; }
        
        .success-banner {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .success-icon { font-size: 2.5rem; }
        .success-content h3 { color: var(--success); margin-bottom: 5px; }
        .success-content p { color: var(--muted); }
        
        .info-banner {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .info-icon { font-size: 1.5rem; }
        .info-content { color: var(--text); }
        
        .contact-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
        }
        
        @media (max-width: 1024px) {
            .contact-grid { grid-template-columns: 1fr; }
        }
        
        .form-section {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 35px;
        }
        
        .form-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        @media (max-width: 600px) {
            .form-row { grid-template-columns: 1fr; }
        }
        
        .form-group { margin-bottom: 20px; }
        
        .form-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: var(--muted);
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .form-input {
            width: 100%;
            padding: 16px 20px;
            background: var(--dark);
            border: 2px solid var(--border);
            border-radius: 12px;
            color: var(--text);
            font-size: 16px;
            font-family: inherit;
            transition: all 0.3s;
        }
        
        .form-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        
        .form-input::placeholder { color: var(--muted); }
        
        textarea.form-input { min-height: 180px; resize: vertical; }
        
        .submit-btn {
            width: 100%;
            padding: 18px 30px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .submit-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 30px rgba(99, 102, 241, 0.3);
        }
        
        .info-section { display: flex; flex-direction: column; gap: 20px; }
        
        .info-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 25px;
            transition: all 0.3s;
        }
        
        .info-card:hover {
            transform: translateY(-5px);
            border-color: var(--primary);
        }
        
        .info-card-icon {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-bottom: 15px;
        }
        
        .info-card-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
        .info-card-text { color: var(--muted); font-size: 14px; }
        
        .info-card-link {
            color: var(--primary-light);
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s;
        }
        
        .info-card-link:hover { color: var(--secondary); }
        
        .faq-section {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 35px;
            margin-top: 30px;
        }
        
        .faq-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .faq-item {
            border-bottom: 1px solid var(--border);
            padding: 20px 0;
        }
        
        .faq-item:last-child { border-bottom: none; }
        
        .faq-question {
            font-weight: 600;
            color: var(--text);
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .faq-question::before { content: '❓'; }
        
        .faq-answer { color: var(--muted); font-size: 14px; padding-left: 30px; }
    </style>
</head>
<body>
    <div class="main-container">
        <div class="hero">
            <h1>📬 Contactez-nous</h1>
            <p>Une question, un bug ou une suggestion? Notre équipe est là pour vous aider!</p>
        </div>
        
        """ + success_html + message_html + """
        
        <div class="contact-grid">
            <div class="form-section">
                <div class="form-title">
                    <span>✉️</span>
                    <span>Envoyez-nous un message</span>
                </div>
                
                <form method="post" action="/contact">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Votre nom</label>
                            <input type="text" name="name" class="form-input" placeholder="Jean Dupont" value=\"""" + pre_name_safe + """\" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Votre email</label>
                            <input type="email" name="email" class="form-input" placeholder="jean@exemple.com" value=\"""" + pre_email_safe + """\" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Sujet</label>
                        <input type="text" name="subject" class="form-input" placeholder="Ex: Question sur les stratégies">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Votre message</label>
                        <textarea name="message" class="form-input" placeholder="Décrivez votre question ou problème..." required></textarea>
                    </div>
                    
                    <button type="submit" class="submit-btn">
                        <span>🚀</span>
                        <span>Envoyer le message</span>
                    </button>
                </form>
            </div>
            
            <div class="info-section">
                <div class="info-card">
                    <div class="info-card-icon">⏱️</div>
                    <div class="info-card-title">Temps de réponse</div>
                    <div class="info-card-text">Nous répondons généralement sous 24 heures.</div>
                </div>
                
                <div class="info-card">
                    <div class="info-card-icon">📧</div>
                    <div class="info-card-title">Email direct</div>
                    <div class="info-card-text">
                        <a href="mailto:support@cryptoia.ca" class="info-card-link">support@cryptoia.ca</a>
                    </div>
                </div>
                
                <div class="info-card">
                    <div class="info-card-icon">💬</div>
                    <div class="info-card-title">Chat en direct</div>
                    <div class="info-card-text">Disponible du lundi au vendredi, 9h-18h (EST)</div>
                </div>
                
                <div class="info-card">
                    <div class="info-card-icon">📚</div>
                    <div class="info-card-title">Documentation</div>
                    <div class="info-card-text">
                        Consultez notre <a href="/academy" class="info-card-link">Academy</a> pour des guides.
                    </div>
                </div>
            </div>
        </div>
        
        <div class="faq-section">
            <div class="faq-title">
                <span>❓</span>
                <span>Questions fréquentes</span>
            </div>
            
            <div class="faq-item">
                <div class="faq-question">Comment réinitialiser mon mot de passe?</div>
                <div class="faq-answer">Cliquez sur "Mot de passe oublié" sur la page de connexion.</div>
            </div>
            
            <div class="faq-item">
                <div class="faq-question">Comment fonctionne l'abonnement?</div>
                <div class="faq-answer">Nous proposons plusieurs plans (Gratuit, Pro, Premium). Visitez /pricing-complete.</div>
            </div>
            
            <div class="faq-item">
                <div class="faq-question">Les données sont-elles en temps réel?</div>
                <div class="faq-answer">Oui, nos données proviennent de CoinGecko et Binance avec un délai minimal.</div>
            </div>
        </div>
    </div>
</body>
</html>
"""