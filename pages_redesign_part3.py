"""
Pages Redesign Part 3 - CryptoIA
- /convertisseur (Fonctionnel avec API temps réel)
- /calculatrice (Fonctionnelle avec tous les calculs)
"""

# ============================================================================
# PAGE CONVERTISSEUR - Design Révolutionnaire et Fonctionnel
# ============================================================================
def get_convertisseur_page_html(SIDEBAR, CSS):
    return SIDEBAR + """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💱 Convertisseur Crypto - CryptoIA</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    """ + CSS + """
    <style>
        :root {
            --primary: #3b82f6;
            --primary-light: #60a5fa;
            --secondary: #8b5cf6;
            --success: #10b981;
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
            min-height: 100vh;
        }
        
        .bg-gradient {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: 
                radial-gradient(ellipse at 30% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 70%);
        }
        
        .main-container {
            margin-left: 280px;
            padding: 40px;
            min-height: 100vh;
        }
        
        @media (max-width: 1024px) {
            .main-container { margin-left: 0; padding: 20px; }
        }
        
        .hero {
            text-align: center;
            margin-bottom: 50px;
        }
        
        .hero h1 {
            font-size: 3.5rem;
            font-weight: 900;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 15px;
        }
        
        .hero p {
            font-size: 1.2rem;
            color: var(--muted);
            max-width: 600px;
            margin: 0 auto;
        }
        
        .converter-container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .converter-box {
            background: linear-gradient(145deg, var(--card) 0%, rgba(15, 23, 42, 0.9) 100%);
            border: 1px solid var(--border);
            border-radius: 30px;
            padding: 50px;
            margin-bottom: 40px;
            position: relative;
            overflow: hidden;
        }
        
        .converter-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, var(--primary), var(--secondary), #ec4899);
        }
        
        .converter-box::after {
            content: '';
            position: absolute;
            top: -100px;
            right: -100px;
            width: 250px;
            height: 250px;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
            pointer-events: none;
        }
        
        .amount-section {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .amount-label {
            font-size: 14px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .amount-input-wrapper {
            position: relative;
            display: inline-block;
            width: 100%;
            max-width: 400px;
        }
        
        .amount-input {
            font-size: 4rem;
            font-weight: 900;
            background: transparent;
            border: none;
            border-bottom: 4px solid var(--border);
            color: var(--text);
            text-align: center;
            width: 100%;
            padding: 15px 0;
            transition: all 0.3s;
        }
        
        .amount-input:focus {
            outline: none;
            border-bottom-color: var(--primary);
        }
        
        .amount-input::placeholder {
            color: var(--muted);
        }
        
        .currency-section {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 30px;
            align-items: center;
            margin-bottom: 40px;
        }
        
        @media (max-width: 700px) {
            .currency-section {
                grid-template-columns: 1fr;
                gap: 20px;
            }
        }
        
        .currency-box {
            background: var(--dark);
            border: 2px solid var(--border);
            border-radius: 20px;
            padding: 25px;
            transition: all 0.3s;
        }
        
        .currency-box:hover, .currency-box:focus-within {
            border-color: var(--primary);
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.15);
        }
        
        .currency-label {
            font-size: 12px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .currency-select {
            width: 100%;
            padding: 18px 20px;
            background: rgba(15, 23, 42, 0.5);
            border: 2px solid var(--border);
            border-radius: 14px;
            color: var(--text);
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 15px center;
            padding-right: 50px;
        }
        
        .currency-select:focus {
            outline: none;
            border-color: var(--primary);
        }
        
        .currency-select option {
            background: var(--dark);
            color: var(--text);
            padding: 15px;
        }
        
        .swap-button {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            color: white;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4);
            position: relative;
            z-index: 10;
        }
        
        .swap-button:hover {
            transform: rotate(180deg) scale(1.1);
            box-shadow: 0 15px 50px rgba(139, 92, 246, 0.5);
        }
        
        @media (max-width: 700px) {
            .swap-button {
                margin: 0 auto;
            }
        }
        
        .result-section {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
            border: 2px solid var(--primary);
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            overflow: hidden;
        }
        
        .result-section::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.05), transparent 30%);
            animation: rotate 20s linear infinite;
        }
        
        @keyframes rotate {
            100% { transform: rotate(360deg); }
        }
        
        .result-content {
            position: relative;
            z-index: 1;
        }
        
        .result-label {
            font-size: 13px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 15px;
        }
        
        .result-amount {
            font-size: 3.5rem;
            font-weight: 900;
            background: linear-gradient(135deg, var(--primary-light), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
            word-break: break-all;
            line-height: 1.2;
        }
        
        .result-currency {
            font-size: 1.5rem;
            color: var(--muted);
            font-weight: 700;
        }
        
        .rate-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .rate-card {
            background: var(--dark);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 25px;
            text-align: center;
            transition: all 0.3s;
        }
        
        .rate-card:hover {
            border-color: var(--primary);
            transform: translateY(-5px);
        }
        
        .rate-value {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 8px;
        }
        
        .rate-label {
            font-size: 12px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .popular-section {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 35px;
        }
        
        .popular-title {
            font-size: 1.25rem;
            font-weight: 800;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .popular-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 15px;
        }
        
        .popular-btn {
            background: var(--dark);
            border: 2px solid var(--border);
            border-radius: 16px;
            padding: 20px 15px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
            color: var(--text);
        }
        
        .popular-btn:hover {
            border-color: var(--primary);
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }
        
        .popular-icon {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .popular-code {
            font-weight: 800;
            font-size: 15px;
            margin-bottom: 5px;
        }
        
        .popular-price {
            font-size: 13px;
            color: var(--muted);
        }
        
        .popular-change {
            font-size: 12px;
            font-weight: 600;
            margin-top: 5px;
            padding: 3px 8px;
            border-radius: 6px;
            display: inline-block;
        }
        
        .popular-change.positive {
            background: rgba(16, 185, 129, 0.15);
            color: var(--success);
        }
        
        .popular-change.negative {
            background: rgba(239, 68, 68, 0.15);
            color: var(--danger);
        }
        
        .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 15px 20px;
            color: var(--danger);
            text-align: center;
            margin-bottom: 20px;
            display: none;
        }
        
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(2, 6, 23, 0.8);
            display: none;
            align-items: center;
            justify-content: center;
            border-radius: 24px;
            z-index: 100;
        }
        
        .loading-overlay.active {
            display: flex;
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid var(--border);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @media (max-width: 600px) {
            .hero h1 { font-size: 2.5rem; }
            .amount-input { font-size: 2.5rem; }
            .result-amount { font-size: 2rem; }
            .converter-box { padding: 30px 20px; }
            .rate-info { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="bg-gradient"></div>
    
    <div class="main-container">
        <div class="hero">
            <h1>💱 Convertisseur Universel</h1>
            <p>Convertissez instantanément entre cryptomonnaies et devises avec les taux en temps réel de CoinGecko</p>
        </div>
        
        <div class="converter-container">
            <div class="converter-box">
                <div class="loading-overlay" id="loadingOverlay">
                    <div class="spinner"></div>
                </div>
                
                <div class="amount-section">
                    <div class="amount-label">Montant à convertir</div>
                    <div class="amount-input-wrapper">
                        <input type="number" id="amount" class="amount-input" value="1" min="0" step="any" placeholder="0">
                    </div>
                </div>
                
                <div class="currency-section">
                    <div class="currency-box">
                        <div class="currency-label">De</div>
                        <select id="fromCurrency" class="currency-select">
                            <optgroup label="🪙 Cryptomonnaies">
                                <option value="bitcoin" selected>₿ Bitcoin (BTC)</option>
                                <option value="ethereum">Ξ Ethereum (ETH)</option>
                                <option value="tether">₮ Tether (USDT)</option>
                                <option value="binancecoin">🔸 BNB</option>
                                <option value="solana">◎ Solana (SOL)</option>
                                <option value="ripple">✕ XRP</option>
                                <option value="cardano">₳ Cardano (ADA)</option>
                                <option value="dogecoin">Ð Dogecoin (DOGE)</option>
                                <option value="polkadot">● Polkadot (DOT)</option>
                                <option value="avalanche-2">🔺 Avalanche (AVAX)</option>
                            </optgroup>
                            <optgroup label="💵 Devises Fiat">
                                <option value="usd">🇺🇸 Dollar US (USD)</option>
                                <option value="eur">🇪🇺 Euro (EUR)</option>
                                <option value="cad">🇨🇦 Dollar CA (CAD)</option>
                                <option value="gbp">🇬🇧 Livre (GBP)</option>
                                <option value="jpy">🇯🇵 Yen (JPY)</option>
                                <option value="chf">🇨🇭 Franc Suisse (CHF)</option>
                            </optgroup>
                        </select>
                    </div>
                    
                    <button class="swap-button" onclick="swapCurrencies()" title="Inverser">⇄</button>
                    
                    <div class="currency-box">
                        <div class="currency-label">Vers</div>
                        <select id="toCurrency" class="currency-select">
                            <optgroup label="💵 Devises Fiat">
                                <option value="usd" selected>🇺🇸 Dollar US (USD)</option>
                                <option value="eur">🇪🇺 Euro (EUR)</option>
                                <option value="cad">🇨🇦 Dollar CA (CAD)</option>
                                <option value="gbp">🇬🇧 Livre (GBP)</option>
                                <option value="jpy">🇯🇵 Yen (JPY)</option>
                                <option value="chf">🇨🇭 Franc Suisse (CHF)</option>
                            </optgroup>
                            <optgroup label="🪙 Cryptomonnaies">
                                <option value="bitcoin">₿ Bitcoin (BTC)</option>
                                <option value="ethereum">Ξ Ethereum (ETH)</option>
                                <option value="tether">₮ Tether (USDT)</option>
                                <option value="binancecoin">🔸 BNB</option>
                                <option value="solana">◎ Solana (SOL)</option>
                                <option value="ripple">✕ XRP</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
                
                <div id="errorMessage" class="error-message"></div>
                
                <div class="result-section">
                    <div class="result-content">
                        <div class="result-label">Résultat</div>
                        <div class="result-amount" id="resultAmount">--</div>
                        <div class="result-currency" id="resultCurrency">USD</div>
                    </div>
                </div>
                
                <div class="rate-info">
                    <div class="rate-card">
                        <div class="rate-value" id="rateValue">--</div>
                        <div class="rate-label">Taux de change</div>
                    </div>
                    <div class="rate-card">
                        <div class="rate-value" id="lastUpdate">--</div>
                        <div class="rate-label">Dernière mise à jour</div>
                    </div>
                </div>
            </div>
            
            <div class="popular-section">
                <div class="popular-title">
                    <span>⭐</span>
                    <span>Cryptos populaires</span>
                </div>
                <div class="popular-grid" id="popularGrid">
                    <!-- Populated by JS -->
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let priceCache = {};
        let lastFetch = 0;
        const CACHE_DURATION = 30000;
        
        const currencySymbols = {
            'usd': '$', 'eur': '€', 'cad': 'CA$', 'gbp': '£', 'jpy': '¥', 'chf': 'CHF',
            'bitcoin': '₿', 'ethereum': 'Ξ', 'tether': '₮', 'binancecoin': 'BNB',
            'solana': 'SOL', 'ripple': 'XRP', 'cardano': 'ADA', 'dogecoin': 'DOGE',
            'polkadot': 'DOT', 'avalanche-2': 'AVAX'
        };
        
        const currencyNames = {
            'usd': 'USD', 'eur': 'EUR', 'cad': 'CAD', 'gbp': 'GBP', 'jpy': 'JPY', 'chf': 'CHF',
            'bitcoin': 'BTC', 'ethereum': 'ETH', 'tether': 'USDT', 'binancecoin': 'BNB',
            'solana': 'SOL', 'ripple': 'XRP', 'cardano': 'ADA', 'dogecoin': 'DOGE',
            'polkadot': 'DOT', 'avalanche-2': 'AVAX'
        };
        
        const fiatCurrencies = ['usd', 'eur', 'cad', 'gbp', 'jpy', 'chf'];
        
        function showLoading(show) {
            document.getElementById('loadingOverlay').classList.toggle('active', show);
        }
        
        async function fetchPrices() {
            const now = Date.now();
            if (now - lastFetch < CACHE_DURATION && Object.keys(priceCache).length > 0) {
                return priceCache;
            }
            
            showLoading(true);
            
            try {
                const cryptos = 'bitcoin,ethereum,tether,binancecoin,solana,ripple,cardano,dogecoin,polkadot,avalanche-2';
                const fiats = 'usd,eur,cad,gbp,jpy,chf';
                
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + cryptos + '&vs_currencies=' + fiats + '&include_24hr_change=true');
                
                if (!response.ok) {
                    throw new Error('API Error');
                }
                
                const data = await response.json();
                
                priceCache = data;
                lastFetch = now;
                
                const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                document.getElementById('lastUpdate').textContent = time;
                document.getElementById('errorMessage').style.display = 'none';
                
                showLoading(false);
                return data;
            } catch (error) {
                console.error('Price fetch error:', error);
                document.getElementById('errorMessage').textContent = '⚠️ Erreur de connexion. Utilisation des dernières données disponibles.';
                document.getElementById('errorMessage').style.display = 'block';
                showLoading(false);
                return priceCache;
            }
        }
        
        async function convert() {
            const amount = parseFloat(document.getElementById('amount').value) || 0;
            const fromCurrency = document.getElementById('fromCurrency').value;
            const toCurrency = document.getElementById('toCurrency').value;
            
            if (amount <= 0) {
                document.getElementById('resultAmount').textContent = '0';
                document.getElementById('resultCurrency').textContent = currencyNames[toCurrency] || toCurrency.toUpperCase();
                document.getElementById('rateValue').textContent = '--';
                return;
            }
            
            const prices = await fetchPrices();
            
            if (!prices || Object.keys(prices).length === 0) {
                document.getElementById('resultAmount').textContent = 'Erreur';
                return;
            }
            
            let result = 0;
            let rate = 0;
            
            const isFromFiat = fiatCurrencies.includes(fromCurrency);
            const isToFiat = fiatCurrencies.includes(toCurrency);
            
            try {
                if (isFromFiat && isToFiat) {
                    // Fiat to Fiat (use BTC as bridge)
                    const btcInFrom = prices['bitcoin'][fromCurrency];
                    const btcInTo = prices['bitcoin'][toCurrency];
                    rate = btcInTo / btcInFrom;
                    result = amount * rate;
                } else if (isFromFiat && !isToFiat) {
                    // Fiat to Crypto
                    const cryptoInFiat = prices[toCurrency][fromCurrency];
                    rate = 1 / cryptoInFiat;
                    result = amount * rate;
                } else if (!isFromFiat && isToFiat) {
                    // Crypto to Fiat
                    rate = prices[fromCurrency][toCurrency];
                    result = amount * rate;
                } else {
                    // Crypto to Crypto (use USD as bridge)
                    const fromInUsd = prices[fromCurrency]['usd'];
                    const toInUsd = prices[toCurrency]['usd'];
                    rate = fromInUsd / toInUsd;
                    result = amount * rate;
                }
            } catch (e) {
                console.error('Conversion error:', e);
                document.getElementById('resultAmount').textContent = 'Erreur';
                return;
            }
            
            // Format result
            let formattedResult;
            if (result >= 1000000) {
                formattedResult = result.toLocaleString('en-US', {maximumFractionDigits: 0});
            } else if (result >= 1) {
                formattedResult = result.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            } else if (result >= 0.0001) {
                formattedResult = result.toLocaleString('en-US', {minimumFractionDigits: 4, maximumFractionDigits: 6});
            } else if (result > 0) {
                formattedResult = result.toExponential(4);
            } else {
                formattedResult = '0';
            }
            
            const toSymbol = currencySymbols[toCurrency] || toCurrency.toUpperCase();
            const fromSymbol = currencySymbols[fromCurrency] || fromCurrency.toUpperCase();
            const toName = currencyNames[toCurrency] || toCurrency.toUpperCase();
            
            document.getElementById('resultAmount').textContent = formattedResult;
            document.getElementById('resultCurrency').textContent = toName;
            
            // Format rate
            let rateStr;
            if (rate >= 1) {
                rateStr = '1 ' + fromSymbol + ' = ' + rate.toLocaleString('en-US', {maximumFractionDigits: 2}) + ' ' + toSymbol;
            } else {
                rateStr = '1 ' + fromSymbol + ' = ' + rate.toFixed(8) + ' ' + toSymbol;
            }
            document.getElementById('rateValue').textContent = rateStr;
        }
        
        function swapCurrencies() {
            const fromSelect = document.getElementById('fromCurrency');
            const toSelect = document.getElementById('toCurrency');
            const temp = fromSelect.value;
            fromSelect.value = toSelect.value;
            toSelect.value = temp;
            convert();
        }
        
        async function populatePopular() {
            const prices = await fetchPrices();
            const popularGrid = document.getElementById('popularGrid');
            
            const popular = [
                { id: 'bitcoin', icon: '₿', name: 'BTC' },
                { id: 'ethereum', icon: 'Ξ', name: 'ETH' },
                { id: 'solana', icon: '◎', name: 'SOL' },
                { id: 'binancecoin', icon: '🔸', name: 'BNB' },
                { id: 'ripple', icon: '✕', name: 'XRP' },
                { id: 'cardano', icon: '₳', name: 'ADA' },
                { id: 'dogecoin', icon: 'Ð', name: 'DOGE' },
                { id: 'polkadot', icon: '●', name: 'DOT' }
            ];
            
            popularGrid.innerHTML = popular.map(function(coin) {
                const coinData = prices[coin.id];
                if (!coinData) return '';
                
                const price = coinData.usd || 0;
                const change = coinData.usd_24h_change || 0;
                const priceStr = price >= 1 ? '$' + price.toLocaleString('en-US', {maximumFractionDigits: 2}) : '$' + price.toFixed(4);
                const changeClass = change >= 0 ? 'positive' : 'negative';
                const changeStr = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
                
                return '<button class="popular-btn" onclick="selectCrypto(\'' + coin.id + '\')">' +
                    '<div class="popular-icon">' + coin.icon + '</div>' +
                    '<div class="popular-code">' + coin.name + '</div>' +
                    '<div class="popular-price">' + priceStr + '</div>' +
                    '<div class="popular-change ' + changeClass + '">' + changeStr + '</div>' +
                '</button>';
            }).join('');
        }
        
        function selectCrypto(cryptoId) {
            document.getElementById('fromCurrency').value = cryptoId;
            convert();
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // Event listeners
        document.getElementById('amount').addEventListener('input', convert);
        document.getElementById('fromCurrency').addEventListener('change', convert);
        document.getElementById('toCurrency').addEventListener('change', convert);
        
        // Initialize
        fetchPrices().then(function() {
            convert();
            populatePopular();
        });
        
        // Auto-refresh every 30 seconds
        setInterval(function() {
            fetchPrices().then(function() {
                convert();
                populatePopular();
            });
        }, 30000);
    </script>
</body>
</html>
"""


# ============================================================================
# PAGE CALCULATRICE - Complète et Fonctionnelle
# ============================================================================
def get_calculatrice_page_html(SIDEBAR, CSS):
    return SIDEBAR + """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧮 Calculatrice de Trading Pro - CryptoIA</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
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
        }
        
        .bg-pattern {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: 
                radial-gradient(ellipse at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 70%, rgba(236, 72, 153, 0.1) 0%, transparent 50%);
        }
        
        .main-container {
            margin-left: 280px;
            padding: 40px;
            min-height: 100vh;
        }
        
        @media (max-width: 1024px) {
            .main-container { margin-left: 0; padding: 20px; }
        }
        
        .hero {
            text-align: center;
            margin-bottom: 50px;
        }
        
        .hero h1 {
            font-size: 3.5rem;
            font-weight: 900;
            background: linear-gradient(135deg, #6366f1, #ec4899, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 15px;
        }
        
        .hero p {
            font-size: 1.2rem;
            color: var(--muted);
            max-width: 700px;
            margin: 0 auto;
        }
        
        /* Calculator Tabs */
        .calc-tabs {
            display: flex;
            gap: 15px;
            margin-bottom: 40px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .calc-tab {
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
        
        .calc-tab:hover {
            border-color: var(--primary);
            transform: translateY(-3px);
        }
        
        .calc-tab.active {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-color: transparent;
            color: white;
        }
        
        .calc-section {
            display: none;
            animation: fadeIn 0.5s ease;
        }
        
        .calc-section.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .calc-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .calc-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        @media (max-width: 1000px) {
            .calc-grid { grid-template-columns: 1fr; }
        }
        
        .calc-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 35px;
            position: relative;
            overflow: hidden;
        }
        
        .calc-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
        }
        
        .calc-card h3 {
            font-size: 1.5rem;
            font-weight: 800;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        /* Direction Toggle */
        .direction-toggle {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .direction-btn {
            padding: 20px;
            border: 3px solid var(--border);
            background: var(--dark);
            color: var(--muted);
            border-radius: 16px;
            cursor: pointer;
            font-weight: 800;
            font-size: 18px;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        
        .direction-btn:hover {
            border-color: var(--primary);
            transform: translateY(-3px);
        }
        
        .direction-btn.active.long {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-color: #10b981;
            color: white;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        }
        
        .direction-btn.active.short {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border-color: #ef4444;
            color: white;
            box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
        }
        
        /* Input Groups */
        .input-group {
            margin-bottom: 25px;
        }
        
        .input-label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .input-label span {
            font-weight: 700;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .input-hint {
            font-size: 13px;
            color: var(--muted);
            font-weight: 500;
        }
        
        .calc-input {
            width: 100%;
            padding: 18px 22px;
            background: var(--dark);
            border: 2px solid var(--border);
            border-radius: 14px;
            color: var(--text);
            font-size: 18px;
            font-weight: 700;
            transition: all 0.3s;
        }
        
        .calc-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 5px rgba(99, 102, 241, 0.15);
        }
        
        .calc-input::placeholder {
            color: var(--muted);
            font-weight: 500;
        }
        
        select.calc-input {
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 18px center;
            padding-right: 50px;
        }
        
        select.calc-input option {
            background: var(--dark);
            color: var(--text);
        }
        
        /* TP Grid */
        .tp-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .tp-input-wrapper {
            position: relative;
        }
        
        .tp-label {
            position: absolute;
            top: -10px;
            left: 15px;
            background: var(--card);
            padding: 0 10px;
            font-size: 12px;
            font-weight: 700;
            color: var(--primary-light);
            z-index: 1;
        }
        
        /* Results Section */
        .results-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 35px;
        }
        
        .results-card h3 {
            font-size: 1.5rem;
            font-weight: 800;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .result-highlight {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%);
            border: 2px solid var(--primary);
            border-radius: 20px;
            padding: 35px;
            text-align: center;
            margin-bottom: 25px;
        }
        
        .result-highlight-label {
            font-size: 13px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 12px;
        }
        
        .result-highlight-value {
            font-size: 3.5rem;
            font-weight: 900;
            background: linear-gradient(135deg, var(--primary-light), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .results-grid {
            display: grid;
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .result-box {
            background: var(--dark);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 20px;
            transition: all 0.3s;
        }
        
        .result-box:hover {
            border-color: var(--primary);
            transform: translateX(5px);
        }
        
        .result-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .result-label {
            color: var(--muted);
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .result-value {
            font-size: 1.25rem;
            font-weight: 800;
            color: var(--text);
        }
        
        .result-value.positive { color: var(--success); }
        .result-value.negative { color: var(--danger); }
        
        /* RR Badge */
        .rr-section {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%);
            border: 2px solid var(--primary);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            margin-bottom: 25px;
        }
        
        .rr-label {
            font-size: 13px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 12px;
        }
        
        .rr-value {
            font-size: 2.5rem;
            font-weight: 900;
            color: var(--primary-light);
            margin-bottom: 15px;
        }
        
        .rr-badge {
            display: inline-block;
            padding: 12px 25px;
            border-radius: 30px;
            font-weight: 800;
            font-size: 14px;
        }
        
        .rr-badge.excellent {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
        }
        
        .rr-badge.good {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
        }
        
        .rr-badge.fair {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
        }
        
        .rr-badge.poor {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
        }
        
        /* Warning Box */
        .warning-box {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 16px;
            padding: 25px;
            display: flex;
            gap: 20px;
            align-items: flex-start;
        }
        
        .warning-icon {
            font-size: 2rem;
            flex-shrink: 0;
        }
        
        .warning-content h4 {
            color: var(--warning);
            margin-bottom: 8px;
            font-size: 1rem;
        }
        
        .warning-content p {
            color: var(--muted);
            font-size: 14px;
            line-height: 1.7;
        }
        
        /* Profit Calculator Specific */
        .profit-inputs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        @media (max-width: 600px) {
            .profit-inputs { grid-template-columns: 1fr; }
            .tp-grid { grid-template-columns: 1fr; }
        }
        
        .profit-result {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);
            border: 2px solid var(--success);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
        }
        
        .profit-result.loss {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
            border-color: var(--danger);
        }
        
        .profit-amount {
            font-size: 3rem;
            font-weight: 900;
            color: var(--success);
            margin-bottom: 5px;
        }
        
        .profit-amount.loss {
            color: var(--danger);
        }
        
        .profit-percent {
            font-size: 1.25rem;
            color: var(--muted);
        }
        
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .result-highlight-value { font-size: 2.5rem; }
            .rr-value { font-size: 2rem; }
        }
    </style>
</head>
<body>
    <div class="bg-pattern"></div>
    
    <div class="main-container">
        <div class="hero">
            <h1>🧮 Calculatrice de Trading Pro</h1>
            <p>Calculez vos positions, risques, profits et pertes comme un trader professionnel</p>
        </div>
        
        <div class="calc-tabs">
            <button class="calc-tab active" onclick="showCalc('position')">
                <span>📊</span> Taille de Position
            </button>
            <button class="calc-tab" onclick="showCalc('profit')">
                <span>💰</span> Profit / Perte
            </button>
            <button class="calc-tab" onclick="showCalc('liquidation')">
                <span>⚠️</span> Prix de Liquidation
            </button>
            <button class="calc-tab" onclick="showCalc('dca')">
                <span>📅</span> DCA Calculator
            </button>
        </div>
        
        <div class="calc-container">
            <!-- ========== POSITION CALCULATOR ========== -->
            <div class="calc-section active" id="position">
                <div class="calc-grid">
                    <div class="calc-card">
                        <h3>📊 Paramètres du Trade</h3>
                        
                        <div class="direction-toggle">
                            <button class="direction-btn active long" onclick="setDirection('long', this)">
                                <span>📈</span> LONG
                            </button>
                            <button class="direction-btn" onclick="setDirection('short', this)">
                                <span>📉</span> SHORT
                            </button>
                        </div>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>💰 Capital Total</span>
                                <span class="input-hint">USD</span>
                            </div>
                            <input type="number" class="calc-input" id="capital" value="10000" min="0" step="100" oninput="calculatePosition()">
                        </div>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>⚠️ Risque par Trade</span>
                                <span class="input-hint">%</span>
                            </div>
                            <input type="number" class="calc-input" id="riskPercent" value="2" min="0.1" max="100" step="0.1" oninput="calculatePosition()">
                        </div>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>🎯 Prix d'Entrée</span>
                                <span class="input-hint">USD</span>
                            </div>
                            <input type="number" class="calc-input" id="entryPrice" value="65000" min="0" step="0.01" oninput="calculatePosition()">
                        </div>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>🛑 Stop Loss</span>
                                <span class="input-hint">USD</span>
                            </div>
                            <input type="number" class="calc-input" id="stopLoss" value="63000" min="0" step="0.01" oninput="calculatePosition()">
                        </div>
                        
                        <div class="tp-grid">
                            <div class="tp-input-wrapper">
                                <span class="tp-label">TP1</span>
                                <input type="number" class="calc-input" id="tp1" value="68000" min="0" step="0.01" oninput="calculatePosition()">
                            </div>
                            <div class="tp-input-wrapper">
                                <span class="tp-label">TP2</span>
                                <input type="number" class="calc-input" id="tp2" value="72000" min="0" step="0.01" oninput="calculatePosition()">
                            </div>
                            <div class="tp-input-wrapper">
                                <span class="tp-label">TP3</span>
                                <input type="number" class="calc-input" id="tp3" value="80000" min="0" step="0.01" oninput="calculatePosition()">
                            </div>
                        </div>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>⚡ Levier</span>
                                <span class="input-hint">x</span>
                            </div>
                            <select class="calc-input" id="leverage" onchange="calculatePosition()">
                                <option value="1">1x (Spot)</option>
                                <option value="2">2x</option>
                                <option value="3">3x</option>
                                <option value="5">5x</option>
                                <option value="10">10x</option>
                                <option value="20">20x</option>
                                <option value="50">50x</option>
                                <option value="100">100x</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="results-card">
                        <h3>📈 Résultats</h3>
                        
                        <div class="result-highlight">
                            <div class="result-highlight-label">Taille de Position</div>
                            <div class="result-highlight-value" id="positionSize">$0</div>
                        </div>
                        
                        <div class="results-grid">
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">💵 Risque en $</span>
                                    <span class="result-value" id="riskAmount">$0</span>
                                </div>
                            </div>
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">📊 Distance SL</span>
                                    <span class="result-value negative" id="slDistance">0%</span>
                                </div>
                            </div>
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">🎯 Quantité</span>
                                    <span class="result-value" id="quantity">0</span>
                                </div>
                            </div>
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">💰 Profit TP1</span>
                                    <span class="result-value positive" id="profitTp1">+$0</span>
                                </div>
                            </div>
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">💰 Profit TP2</span>
                                    <span class="result-value positive" id="profitTp2">+$0</span>
                                </div>
                            </div>
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">💰 Profit TP3</span>
                                    <span class="result-value positive" id="profitTp3">+$0</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="rr-section">
                            <div class="rr-label">Ratio Risk/Reward (TP1)</div>
                            <div class="rr-value" id="rrRatio">1:0</div>
                            <div id="rrBadge"></div>
                        </div>
                        
                        <div class="warning-box">
                            <div class="warning-icon">⚠️</div>
                            <div class="warning-content">
                                <h4>Rappel Important</h4>
                                <p>Ne risquez jamais plus de 1-2% de votre capital par trade. Le trading comporte des risques de perte en capital.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- ========== PROFIT CALCULATOR ========== -->
            <div class="calc-section" id="profit">
                <div class="calc-grid">
                    <div class="calc-card">
                        <h3>💰 Calculateur de Profit</h3>
                        
                        <div class="direction-toggle">
                            <button class="direction-btn active long" onclick="setDirection2('long', this)">
                                <span>📈</span> LONG
                            </button>
                            <button class="direction-btn" onclick="setDirection2('short', this)">
                                <span>📉</span> SHORT
                            </button>
                        </div>
                        
                        <div class="profit-inputs">
                            <div class="input-group">
                                <div class="input-label">
                                    <span>💵 Montant Investi</span>
                                    <span class="input-hint">USD</span>
                                </div>
                                <input type="number" class="calc-input" id="investAmount" value="1000" min="0" step="10" oninput="calculateProfit()">
                            </div>
                            
                            <div class="input-group">
                                <div class="input-label">
                                    <span>⚡ Levier</span>
                                    <span class="input-hint">x</span>
                                </div>
                                <select class="calc-input" id="profitLeverage" onchange="calculateProfit()">
                                    <option value="1">1x (Spot)</option>
                                    <option value="2">2x</option>
                                    <option value="5">5x</option>
                                    <option value="10">10x</option>
                                    <option value="20">20x</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>🎯 Prix d'Entrée</span>
                                <span class="input-hint">USD</span>
                            </div>
                            <input type="number" class="calc-input" id="profitEntry" value="65000" min="0" step="0.01" oninput="calculateProfit()">
                        </div>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>🏁 Prix de Sortie</span>
                                <span class="input-hint">USD</span>
                            </div>
                            <input type="number" class="calc-input" id="profitExit" value="70000" min="0" step="0.01" oninput="calculateProfit()">
                        </div>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>💸 Frais de Trading</span>
                                <span class="input-hint">%</span>
                            </div>
                            <input type="number" class="calc-input" id="tradingFees" value="0.1" min="0" max="5" step="0.01" oninput="calculateProfit()">
                        </div>
                    </div>
                    
                    <div class="results-card">
                        <h3>📊 Résultat</h3>
                        
                        <div class="profit-result" id="profitResultBox">
                            <div class="profit-amount" id="profitAmount">+$0</div>
                            <div class="profit-percent" id="profitPercent">+0% ROI</div>
                        </div>
                        
                        <div class="results-grid" style="margin-top: 25px;">
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">📊 Position Effective</span>
                                    <span class="result-value" id="effectivePosition">$0</span>
                                </div>
                            </div>
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">📈 Mouvement Prix</span>
                                    <span class="result-value" id="priceMovement">0%</span>
                                </div>
                            </div>
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">💸 Frais Totaux</span>
                                    <span class="result-value negative" id="totalFees">$0</span>
                                </div>
                            </div>
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">💵 Profit Net</span>
                                    <span class="result-value positive" id="netProfit">$0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- ========== LIQUIDATION CALCULATOR ========== -->
            <div class="calc-section" id="liquidation">
                <div class="calc-grid">
                    <div class="calc-card">
                        <h3>⚠️ Calculateur de Liquidation</h3>
                        
                        <div class="direction-toggle">
                            <button class="direction-btn active long" onclick="setDirection3('long', this)">
                                <span>📈</span> LONG
                            </button>
                            <button class="direction-btn" onclick="setDirection3('short', this)">
                                <span>📉</span> SHORT
                            </button>
                        </div>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>🎯 Prix d'Entrée</span>
                                <span class="input-hint">USD</span>
                            </div>
                            <input type="number" class="calc-input" id="liqEntry" value="65000" min="0" step="0.01" oninput="calculateLiquidation()">
                        </div>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>⚡ Levier</span>
                                <span class="input-hint">x</span>
                            </div>
                            <select class="calc-input" id="liqLeverage" onchange="calculateLiquidation()">
                                <option value="2">2x</option>
                                <option value="3">3x</option>
                                <option value="5">5x</option>
                                <option value="10" selected>10x</option>
                                <option value="20">20x</option>
                                <option value="50">50x</option>
                                <option value="100">100x</option>
                                <option value="125">125x</option>
                            </select>
                        </div>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>🏦 Marge de Maintenance</span>
                                <span class="input-hint">%</span>
                            </div>
                            <input type="number" class="calc-input" id="maintenanceMargin" value="0.5" min="0" max="10" step="0.1" oninput="calculateLiquidation()">
                        </div>
                    </div>
                    
                    <div class="results-card">
                        <h3>💀 Prix de Liquidation</h3>
                        
                        <div class="result-highlight" style="border-color: var(--danger); background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);">
                            <div class="result-highlight-label">Liquidation à</div>
                            <div class="result-highlight-value" id="liqPrice" style="background: linear-gradient(135deg, #ef4444, #dc2626); -webkit-background-clip: text;">$0</div>
                        </div>
                        
                        <div class="results-grid">
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">📉 Distance Liquidation</span>
                                    <span class="result-value negative" id="liqDistance">0%</span>
                                </div>
                            </div>
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">💰 Perte Maximum</span>
                                    <span class="result-value negative" id="maxLoss">100%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="warning-box" style="margin-top: 25px;">
                            <div class="warning-icon">💀</div>
                            <div class="warning-content">
                                <h4>Attention - Risque de Liquidation</h4>
                                <p>Avec un levier élevé, votre position peut être liquidée rapidement. Utilisez toujours un stop loss et ne risquez jamais plus que ce que vous pouvez perdre.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- ========== DCA CALCULATOR ========== -->
            <div class="calc-section" id="dca">
                <div class="calc-grid">
                    <div class="calc-card">
                        <h3>📅 DCA Calculator</h3>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>💵 Investissement Régulier</span>
                                <span class="input-hint">USD</span>
                            </div>
                            <input type="number" class="calc-input" id="dcaAmount" value="100" min="0" step="10" oninput="calculateDCA()">
                        </div>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>📅 Fréquence</span>
                            </div>
                            <select class="calc-input" id="dcaFrequency" onchange="calculateDCA()">
                                <option value="7">Hebdomadaire</option>
                                <option value="14">Bi-hebdomadaire</option>
                                <option value="30" selected>Mensuel</option>
                            </select>
                        </div>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>⏳ Durée</span>
                                <span class="input-hint">mois</span>
                            </div>
                            <input type="number" class="calc-input" id="dcaDuration" value="12" min="1" max="120" step="1" oninput="calculateDCA()">
                        </div>
                        
                        <div class="input-group">
                            <div class="input-label">
                                <span>📈 Rendement Annuel Estimé</span>
                                <span class="input-hint">%</span>
                            </div>
                            <input type="number" class="calc-input" id="dcaReturn" value="50" min="-100" max="500" step="5" oninput="calculateDCA()">
                        </div>
                    </div>
                    
                    <div class="results-card">
                        <h3>📊 Projection DCA</h3>
                        
                        <div class="result-highlight">
                            <div class="result-highlight-label">Valeur Finale Estimée</div>
                            <div class="result-highlight-value" id="dcaFinalValue">$0</div>
                        </div>
                        
                        <div class="results-grid">
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">💵 Total Investi</span>
                                    <span class="result-value" id="dcaTotalInvested">$0</span>
                                </div>
                            </div>
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">📊 Nombre d'Achats</span>
                                    <span class="result-value" id="dcaPurchases">0</span>
                                </div>
                            </div>
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">💰 Profit Estimé</span>
                                    <span class="result-value positive" id="dcaProfit">$0</span>
                                </div>
                            </div>
                            <div class="result-box">
                                <div class="result-row">
                                    <span class="result-label">📈 ROI</span>
                                    <span class="result-value positive" id="dcaROI">0%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="warning-box" style="margin-top: 25px; border-color: rgba(16, 185, 129, 0.3); background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);">
                            <div class="warning-icon">💡</div>
                            <div class="warning-content">
                                <h4>Avantage du DCA</h4>
                                <p>Le Dollar Cost Averaging réduit l'impact de la volatilité en lissant votre prix d'achat moyen. C'est une stratégie idéale pour les investisseurs long terme.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let direction = 'long';
        let direction2 = 'long';
        let direction3 = 'long';
        
        function showCalc(calcId) {
            document.querySelectorAll('.calc-section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
            
            document.getElementById(calcId).classList.add('active');
            event.target.closest('.calc-tab').classList.add('active');
        }
        
        function setDirection(dir, btn) {
            direction = dir;
            const parent = btn.parentElement;
            parent.querySelectorAll('.direction-btn').forEach(b => {
                b.classList.remove('active', 'long', 'short');
            });
            btn.classList.add('active', dir);
            calculatePosition();
        }
        
        function setDirection2(dir, btn) {
            direction2 = dir;
            const parent = btn.parentElement;
            parent.querySelectorAll('.direction-btn').forEach(b => {
                b.classList.remove('active', 'long', 'short');
            });
            btn.classList.add('active', dir);
            calculateProfit();
        }
        
        function setDirection3(dir, btn) {
            direction3 = dir;
            const parent = btn.parentElement;
            parent.querySelectorAll('.direction-btn').forEach(b => {
                b.classList.remove('active', 'long', 'short');
            });
            btn.classList.add('active', dir);
            calculateLiquidation();
        }
        
        function calculatePosition() {
            const capital = parseFloat(document.getElementById('capital').value) || 0;
            const riskPercent = parseFloat(document.getElementById('riskPercent').value) || 0;
            const entryPrice = parseFloat(document.getElementById('entryPrice').value) || 0;
            const stopLoss = parseFloat(document.getElementById('stopLoss').value) || 0;
            const tp1 = parseFloat(document.getElementById('tp1').value) || 0;
            const tp2 = parseFloat(document.getElementById('tp2').value) || 0;
            const tp3 = parseFloat(document.getElementById('tp3').value) || 0;
            const leverage = parseFloat(document.getElementById('leverage').value) || 1;
            
            if (entryPrice <= 0 || stopLoss <= 0) return;
            
            const riskAmount = capital * (riskPercent / 100);
            const stopDistance = Math.abs(entryPrice - stopLoss);
            const stopPercent = (stopDistance / entryPrice) * 100;
            
            const positionSize = (riskAmount / stopDistance) * entryPrice;
            const effectivePosition = positionSize * leverage;
            const quantity = effectivePosition / entryPrice;
            
            let profitTp1 = 0, profitTp2 = 0, profitTp3 = 0;
            
            if (direction === 'long') {
                profitTp1 = ((tp1 - entryPrice) / entryPrice) * effectivePosition;
                profitTp2 = ((tp2 - entryPrice) / entryPrice) * effectivePosition;
                profitTp3 = ((tp3 - entryPrice) / entryPrice) * effectivePosition;
            } else {
                profitTp1 = ((entryPrice - tp1) / entryPrice) * effectivePosition;
                profitTp2 = ((entryPrice - tp2) / entryPrice) * effectivePosition;
                profitTp3 = ((entryPrice - tp3) / entryPrice) * effectivePosition;
            }
            
            const tp1Distance = Math.abs(tp1 - entryPrice);
            const rrRatio = tp1Distance / stopDistance;
            
            document.getElementById('positionSize').textContent = '$' + effectivePosition.toLocaleString('en-US', {maximumFractionDigits: 0});
            document.getElementById('riskAmount').textContent = '$' + riskAmount.toLocaleString('en-US', {maximumFractionDigits: 0});
            document.getElementById('slDistance').textContent = '-' + stopPercent.toFixed(2) + '%';
            document.getElementById('quantity').textContent = quantity.toFixed(6);
            
            document.getElementById('profitTp1').textContent = '+$' + Math.max(0, profitTp1).toLocaleString('en-US', {maximumFractionDigits: 0});
            document.getElementById('profitTp2').textContent = '+$' + Math.max(0, profitTp2).toLocaleString('en-US', {maximumFractionDigits: 0});
            document.getElementById('profitTp3').textContent = '+$' + Math.max(0, profitTp3).toLocaleString('en-US', {maximumFractionDigits: 0});
            
            document.getElementById('rrRatio').textContent = '1:' + rrRatio.toFixed(2);
            
            let badgeClass = 'poor';
            let badgeText = '❌ Mauvais';
            
            if (rrRatio >= 3) {
                badgeClass = 'excellent';
                badgeText = '🏆 Excellent';
            } else if (rrRatio >= 2) {
                badgeClass = 'good';
                badgeText = '✅ Bon';
            } else if (rrRatio >= 1.5) {
                badgeClass = 'fair';
                badgeText = '⚠️ Acceptable';
            }
            
            document.getElementById('rrBadge').innerHTML = '<span class="rr-badge ' + badgeClass + '">' + badgeText + '</span>';
        }
        
        function calculateProfit() {
            const amount = parseFloat(document.getElementById('investAmount').value) || 0;
            const leverage = parseFloat(document.getElementById('profitLeverage').value) || 1;
            const entry = parseFloat(document.getElementById('profitEntry').value) || 0;
            const exit = parseFloat(document.getElementById('profitExit').value) || 0;
            const fees = parseFloat(document.getElementById('tradingFees').value) || 0;
            
            if (entry <= 0 || exit <= 0) return;
            
            const effectivePosition = amount * leverage;
            let priceChange;
            
            if (direction2 === 'long') {
                priceChange = (exit - entry) / entry;
            } else {
                priceChange = (entry - exit) / entry;
            }
            
            const grossProfit = effectivePosition * priceChange;
            const totalFees = effectivePosition * (fees / 100) * 2; // Entry + Exit
            const netProfit = grossProfit - totalFees;
            const roi = (netProfit / amount) * 100;
            
            const isProfit = netProfit >= 0;
            
            document.getElementById('effectivePosition').textContent = '$' + effectivePosition.toLocaleString('en-US', {maximumFractionDigits: 0});
            document.getElementById('priceMovement').textContent = (priceChange >= 0 ? '+' : '') + (priceChange * 100).toFixed(2) + '%';
            document.getElementById('totalFees').textContent = '-$' + totalFees.toLocaleString('en-US', {maximumFractionDigits: 2});
            document.getElementById('netProfit').textContent = (isProfit ? '+' : '') + '$' + netProfit.toLocaleString('en-US', {maximumFractionDigits: 2});
            document.getElementById('netProfit').className = 'result-value ' + (isProfit ? 'positive' : 'negative');
            
            document.getElementById('profitAmount').textContent = (isProfit ? '+' : '') + '$' + netProfit.toLocaleString('en-US', {maximumFractionDigits: 2});
            document.getElementById('profitAmount').className = 'profit-amount' + (isProfit ? '' : ' loss');
            document.getElementById('profitPercent').textContent = (isProfit ? '+' : '') + roi.toFixed(2) + '% ROI';
            document.getElementById('profitResultBox').className = 'profit-result' + (isProfit ? '' : ' loss');
        }
        
        function calculateLiquidation() {
            const entry = parseFloat(document.getElementById('liqEntry').value) || 0;
            const leverage = parseFloat(document.getElementById('liqLeverage').value) || 1;
            const maintenanceMargin = parseFloat(document.getElementById('maintenanceMargin').value) || 0;
            
            if (entry <= 0) return;
            
            // Simplified liquidation calculation
            const liqPercent = (100 / leverage) - maintenanceMargin;
            let liqPrice;
            
            if (direction3 === 'long') {
                liqPrice = entry * (1 - liqPercent / 100);
            } else {
                liqPrice = entry * (1 + liqPercent / 100);
            }
            
            document.getElementById('liqPrice').textContent = '$' + liqPrice.toLocaleString('en-US', {maximumFractionDigits: 2});
            document.getElementById('liqDistance').textContent = '-' + liqPercent.toFixed(2) + '%';
            document.getElementById('maxLoss').textContent = '-100%';
        }
        
        function calculateDCA() {
            const amount = parseFloat(document.getElementById('dcaAmount').value) || 0;
            const frequency = parseFloat(document.getElementById('dcaFrequency').value) || 30;
            const duration = parseFloat(document.getElementById('dcaDuration').value) || 12;
            const annualReturn = parseFloat(document.getElementById('dcaReturn').value) || 0;
            
            const daysInPeriod = duration * 30;
            const numPurchases = Math.floor(daysInPeriod / frequency);
            const totalInvested = amount * numPurchases;
            
            // Simplified DCA calculation with compound growth
            const monthlyReturn = annualReturn / 12 / 100;
            let finalValue = 0;
            
            for (let i = 0; i < numPurchases; i++) {
                const monthsRemaining = duration - (i * frequency / 30);
                finalValue += amount * Math.pow(1 + monthlyReturn, monthsRemaining);
            }
            
            const profit = finalValue - totalInvested;
            const roi = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
            
            document.getElementById('dcaTotalInvested').textContent = '$' + totalInvested.toLocaleString('en-US', {maximumFractionDigits: 0});
            document.getElementById('dcaPurchases').textContent = numPurchases;
            document.getElementById('dcaFinalValue').textContent = '$' + finalValue.toLocaleString('en-US', {maximumFractionDigits: 0});
            document.getElementById('dcaProfit').textContent = (profit >= 0 ? '+' : '') + '$' + profit.toLocaleString('en-US', {maximumFractionDigits: 0});
            document.getElementById('dcaProfit').className = 'result-value ' + (profit >= 0 ? 'positive' : 'negative');
            document.getElementById('dcaROI').textContent = (roi >= 0 ? '+' : '') + roi.toFixed(1) + '%';
            document.getElementById('dcaROI').className = 'result-value ' + (roi >= 0 ? 'positive' : 'negative');
        }
        
        // Initialize all calculators
        calculatePosition();
        calculateProfit();
        calculateLiquidation();
        calculateDCA();
    </script>
</body>
</html>
"""