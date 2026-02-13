"""
Pages Redesign Part 3 - CryptoIA
- /convertisseur
- /calculatrice
"""

# ============================================================================
# PAGE CONVERTISSEUR
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
        }
        
        .main-container {
            margin-left: 280px;
            padding: 30px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        @media (max-width: 1024px) {
            .main-container { margin-left: 0; padding: 20px; }
        }
        
        .hero {
            width: 100%;
            max-width: 900px;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 24px;
            padding: 50px;
            margin-bottom: 40px;
            text-align: center;
        }
        
        .hero h1 {
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 15px;
        }
        
        .hero p { color: var(--muted); font-size: 1.15rem; }
        
        .converter-box {
            width: 100%;
            max-width: 700px;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 40px;
            margin-bottom: 30px;
            position: relative;
        }
        
        .converter-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            border-radius: 24px 24px 0 0;
        }
        
        .amount-section { text-align: center; margin-bottom: 35px; }
        
        .amount-label {
            font-size: 14px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 15px;
        }
        
        .amount-input {
            font-size: 4rem;
            font-weight: 800;
            background: transparent;
            border: none;
            color: var(--text);
            text-align: center;
            width: 100%;
            padding: 10px;
            border-bottom: 3px solid var(--border);
            transition: all 0.3s;
        }
        
        .amount-input:focus {
            outline: none;
            border-bottom-color: var(--primary);
        }
        
        .currency-row {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 20px;
            align-items: center;
            margin-bottom: 35px;
        }
        
        .currency-label {
            font-size: 12px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
            display: block;
        }
        
        .currency-select {
            width: 100%;
            padding: 18px 20px;
            background: var(--dark);
            border: 2px solid var(--border);
            border-radius: 14px;
            color: var(--text);
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .currency-select:hover, .currency-select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        
        .currency-select option { background: var(--dark); color: var(--text); }
        
        .swap-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            transition: all 0.3s;
            box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
            margin-top: 25px;
        }
        
        .swap-button:hover { transform: rotate(180deg) scale(1.1); }
        
        .result-box {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
            border: 2px solid var(--primary);
            border-radius: 20px;
            padding: 35px;
            text-align: center;
            margin-bottom: 25px;
        }
        
        .result-amount {
            font-size: 3.5rem;
            font-weight: 900;
            color: var(--primary-light);
            margin-bottom: 10px;
            word-break: break-all;
        }
        
        .result-currency { font-size: 1.25rem; color: var(--muted); font-weight: 600; }
        
        .rate-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        
        .rate-card {
            background: var(--dark);
            border-radius: 14px;
            padding: 20px;
            text-align: center;
        }
        
        .rate-value { font-size: 1.1rem; font-weight: 700; color: var(--text); margin-bottom: 5px; }
        .rate-label { font-size: 12px; color: var(--muted); }
        
        .popular-section {
            width: 100%;
            max-width: 900px;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 30px;
        }
        
        .popular-title {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .popular-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 15px;
        }
        
        .popular-btn {
            background: var(--dark);
            border: 2px solid var(--border);
            border-radius: 14px;
            padding: 20px 15px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
            color: var(--text);
        }
        
        .popular-btn:hover {
            border-color: var(--primary);
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        .popular-icon { font-size: 2rem; margin-bottom: 8px; }
        .popular-code { font-weight: 700; font-size: 14px; }
        .popular-price { font-size: 12px; color: var(--muted); margin-top: 5px; }
        
        .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 15px;
            color: var(--danger);
            text-align: center;
            margin-bottom: 20px;
            display: none;
        }
        
        @media (max-width: 600px) {
            .hero h1 { font-size: 2rem; }
            .amount-input { font-size: 2.5rem; }
            .result-amount { font-size: 2rem; }
            .currency-row { grid-template-columns: 1fr; }
            .swap-button { margin: 20px auto; }
        }
    </style>
</head>
<body>
    <div class="main-container">
        <div class="hero">
            <h1>💱 Convertisseur Universel</h1>
            <p>Convertissez instantanément entre cryptomonnaies et devises avec les taux en temps réel</p>
        </div>
        
        <div class="converter-box">
            <div class="amount-section">
                <div class="amount-label">Montant à convertir</div>
                <input type="number" id="amount" class="amount-input" value="1" min="0" step="any" placeholder="0">
            </div>
            
            <div class="currency-row">
                <div>
                    <label class="currency-label">De</label>
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
                        </optgroup>
                        <optgroup label="💵 Devises Fiat">
                            <option value="usd">🇺🇸 Dollar US (USD)</option>
                            <option value="eur">🇪🇺 Euro (EUR)</option>
                            <option value="cad">🇨🇦 Dollar CA (CAD)</option>
                            <option value="gbp">🇬🇧 Livre (GBP)</option>
                        </optgroup>
                    </select>
                </div>
                
                <button class="swap-button" onclick="swapCurrencies()">⇄</button>
                
                <div>
                    <label class="currency-label">Vers</label>
                    <select id="toCurrency" class="currency-select">
                        <optgroup label="💵 Devises Fiat">
                            <option value="usd" selected>🇺🇸 Dollar US (USD)</option>
                            <option value="eur">🇪🇺 Euro (EUR)</option>
                            <option value="cad">🇨🇦 Dollar CA (CAD)</option>
                            <option value="gbp">🇬🇧 Livre (GBP)</option>
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
            
            <div class="result-box">
                <div class="result-amount" id="resultAmount">--</div>
                <div class="result-currency" id="resultCurrency">USD</div>
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
                <span>Conversions populaires</span>
            </div>
            <div class="popular-grid" id="popularGrid"></div>
        </div>
    </div>
    
    <script>
        let priceCache = {};
        let lastFetch = 0;
        const CACHE_DURATION = 30000;
        
        const currencySymbols = {
            'usd': '$', 'eur': '€', 'cad': 'CA$', 'gbp': '£',
            'bitcoin': '₿', 'ethereum': 'Ξ', 'tether': '₮', 'binancecoin': 'BNB',
            'solana': 'SOL', 'ripple': 'XRP', 'cardano': 'ADA', 'dogecoin': 'DOGE'
        };
        
        const fiatCurrencies = ['usd', 'eur', 'cad', 'gbp'];
        
        async function fetchPrices() {
            const now = Date.now();
            if (now - lastFetch < CACHE_DURATION && Object.keys(priceCache).length > 0) {
                return priceCache;
            }
            
            try {
                const cryptos = 'bitcoin,ethereum,tether,binancecoin,solana,ripple,cardano,dogecoin';
                const fiats = 'usd,eur,cad,gbp';
                
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + cryptos + '&vs_currencies=' + fiats);
                const data = await response.json();
                
                priceCache = data;
                lastFetch = now;
                document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('fr-FR');
                
                return data;
            } catch (error) {
                console.error('Price fetch error:', error);
                document.getElementById('errorMessage').textContent = 'Erreur lors de la récupération des prix.';
                document.getElementById('errorMessage').style.display = 'block';
                return priceCache;
            }
        }
        
        async function convert() {
            const amount = parseFloat(document.getElementById('amount').value) || 0;
            const fromCurrency = document.getElementById('fromCurrency').value;
            const toCurrency = document.getElementById('toCurrency').value;
            
            if (amount <= 0) {
                document.getElementById('resultAmount').textContent = '0';
                return;
            }
            
            document.getElementById('errorMessage').style.display = 'none';
            
            const prices = await fetchPrices();
            
            let result = 0;
            let rate = 0;
            
            const isFromFiat = fiatCurrencies.includes(fromCurrency);
            const isToFiat = fiatCurrencies.includes(toCurrency);
            
            if (isFromFiat && isToFiat) {
                const btcInFrom = prices['bitcoin'][fromCurrency];
                const btcInTo = prices['bitcoin'][toCurrency];
                rate = btcInTo / btcInFrom;
                result = amount * rate;
            } else if (isFromFiat && !isToFiat) {
                const cryptoInFiat = prices[toCurrency][fromCurrency];
                rate = 1 / cryptoInFiat;
                result = amount * rate;
            } else if (!isFromFiat && isToFiat) {
                rate = prices[fromCurrency][toCurrency];
                result = amount * rate;
            } else {
                const fromInUsd = prices[fromCurrency]['usd'];
                const toInUsd = prices[toCurrency]['usd'];
                rate = fromInUsd / toInUsd;
                result = amount * rate;
            }
            
            let formattedResult;
            if (result >= 1000000) {
                formattedResult = result.toLocaleString('en-US', {maximumFractionDigits: 0});
            } else if (result >= 1) {
                formattedResult = result.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            } else if (result >= 0.0001) {
                formattedResult = result.toLocaleString('en-US', {minimumFractionDigits: 4, maximumFractionDigits: 6});
            } else {
                formattedResult = result.toExponential(4);
            }
            
            const symbol = currencySymbols[toCurrency] || toCurrency.toUpperCase();
            document.getElementById('resultAmount').textContent = formattedResult;
            document.getElementById('resultCurrency').textContent = symbol;
            
            let rateStr;
            if (rate >= 1) {
                rateStr = '1 ' + (currencySymbols[fromCurrency] || fromCurrency.toUpperCase()) + ' = ' + rate.toFixed(2) + ' ' + symbol;
            } else {
                rateStr = '1 ' + (currencySymbols[fromCurrency] || fromCurrency.toUpperCase()) + ' = ' + rate.toFixed(8) + ' ' + symbol;
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
                { id: 'dogecoin', icon: 'Ð', name: 'DOGE' }
            ];
            
            popularGrid.innerHTML = popular.map(function(coin) {
                const price = prices[coin.id] ? prices[coin.id].usd : 0;
                const priceStr = price >= 1 ? '$' + price.toLocaleString('en-US', {maximumFractionDigits: 2}) : '$' + price.toFixed(4);
                
                return '<button class="popular-btn" onclick="selectCrypto(\'' + coin.id + '\')">' +
                    '<div class="popular-icon">' + coin.icon + '</div>' +
                    '<div class="popular-code">' + coin.name + '</div>' +
                    '<div class="popular-price">' + priceStr + '</div>' +
                '</button>';
            }).join('');
        }
        
        function selectCrypto(cryptoId) {
            document.getElementById('fromCurrency').value = cryptoId;
            convert();
        }
        
        document.getElementById('amount').addEventListener('input', convert);
        document.getElementById('fromCurrency').addEventListener('change', convert);
        document.getElementById('toCurrency').addEventListener('change', convert);
        
        fetchPrices().then(function() {
            convert();
            populatePopular();
        });
        
        setInterval(function() {
            fetchPrices().then(convert);
        }, 30000);
    </script>
</body>
</html>
"""


# ============================================================================
# PAGE CALCULATRICE
# ============================================================================
def get_calculatrice_page_html(SIDEBAR, CSS):
    return SIDEBAR + """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧮 Calculatrice de Trades - CryptoIA</title>
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
        
        .calc-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        @media (max-width: 500px) {
            .calc-grid { grid-template-columns: 1fr; }
        }
        
        .calc-section {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 30px;
        }
        
        .calc-section h3 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid var(--border);
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--primary-light);
        }
        
        .input-group { margin-bottom: 20px; }
        
        .input-label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: var(--muted);
            font-size: 14px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .input-hint { font-size: 12px; color: var(--muted); font-weight: 400; }
        
        .calc-input {
            width: 100%;
            padding: 16px 20px;
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
        
        .direction-toggle {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .direction-btn {
            padding: 18px;
            border: 2px solid var(--border);
            background: var(--dark);
            color: var(--muted);
            border-radius: 12px;
            cursor: pointer;
            font-weight: 700;
            font-size: 16px;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .direction-btn:hover {
            border-color: var(--primary);
            transform: translateY(-2px);
        }
        
        .direction-btn.active.long {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-color: #10b981;
            color: white;
        }
        
        .direction-btn.active.short {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border-color: #ef4444;
            color: white;
        }
        
        .result-box {
            background: linear-gradient(135deg, var(--dark) 0%, var(--card) 100%);
            padding: 25px;
            border-radius: 16px;
            margin-bottom: 20px;
            border: 2px solid var(--border);
            transition: all 0.3s;
        }
        
        .result-box:hover {
            border-color: var(--primary);
            transform: translateY(-3px);
        }
        
        .result-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(51, 65, 85, 0.5);
        }
        
        .result-row:last-child { border-bottom: none; }
        
        .result-label {
            color: var(--muted);
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .result-value {
            color: var(--text);
            font-size: 18px;
            font-weight: 700;
        }
        
        .result-value.positive { color: var(--success); }
        .result-value.negative { color: var(--danger); }
        
        .result-highlight {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%);
            padding: 30px;
            border-radius: 16px;
            text-align: center;
            border: 2px solid var(--primary);
            margin: 25px 0;
        }
        
        .result-highlight-label {
            color: var(--muted);
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        
        .result-highlight-value {
            font-size: 3rem;
            font-weight: 900;
            color: var(--primary-light);
            text-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
        }
        
        .rr-badge {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: 700;
            font-size: 14px;
            margin-top: 15px;
        }
        
        .rr-excellent { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
        .rr-good { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; }
        .rr-fair { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }
        .rr-poor { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; }
        
        .warning-box {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 16px;
            padding: 25px;
            margin-top: 30px;
            display: flex;
            gap: 15px;
            align-items: flex-start;
        }
        
        .warning-icon { font-size: 2rem; }
        .warning-content h4 { color: var(--warning); margin-bottom: 8px; }
        .warning-content p { color: var(--muted); font-size: 14px; }
        
        .tp-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .tp-input { position: relative; }
        
        .tp-label {
            position: absolute;
            top: -8px;
            left: 12px;
            background: var(--card);
            padding: 0 8px;
            color: var(--primary-light);
            font-size: 11px;
            font-weight: 700;
            z-index: 1;
        }
    </style>
</head>
<body>
    <div class="main-container">
        <div class="hero">
            <h1>🧮 Calculatrice de Trades</h1>
            <p>Calculez vos positions, risques et profits potentiels comme un professionnel</p>
        </div>
        
        <div class="calc-grid">
            <div class="calc-section">
                <h3>📊 Calculateur de Position</h3>
                
                <div class="direction-toggle">
                    <button class="direction-btn active long" onclick="setDirection('long')">
                        <span>📈</span> LONG
                    </button>
                    <button class="direction-btn" onclick="setDirection('short')">
                        <span>📉</span> SHORT
                    </button>
                </div>
                
                <div class="input-group">
                    <div class="input-label">
                        <span>💰 Capital Total</span>
                        <span class="input-hint">USD</span>
                    </div>
                    <input type="number" class="calc-input" id="capital" value="10000" min="0" step="100">
                </div>
                
                <div class="input-group">
                    <div class="input-label">
                        <span>⚠️ Risque par Trade</span>
                        <span class="input-hint">%</span>
                    </div>
                    <input type="number" class="calc-input" id="riskPercent" value="2" min="0.1" max="100" step="0.1">
                </div>
                
                <div class="input-group">
                    <div class="input-label">
                        <span>🎯 Prix d'Entrée</span>
                        <span class="input-hint">USD</span>
                    </div>
                    <input type="number" class="calc-input" id="entryPrice" value="50000" min="0" step="0.01">
                </div>
                
                <div class="input-group">
                    <div class="input-label">
                        <span>🛑 Stop Loss</span>
                        <span class="input-hint">USD</span>
                    </div>
                    <input type="number" class="calc-input" id="stopLoss" value="48000" min="0" step="0.01">
                </div>
                
                <div class="tp-grid">
                    <div class="tp-input">
                        <span class="tp-label">TP1</span>
                        <input type="number" class="calc-input" id="tp1" value="52000" min="0" step="0.01">
                    </div>
                    <div class="tp-input">
                        <span class="tp-label">TP2</span>
                        <input type="number" class="calc-input" id="tp2" value="55000" min="0" step="0.01">
                    </div>
                    <div class="tp-input">
                        <span class="tp-label">TP3</span>
                        <input type="number" class="calc-input" id="tp3" value="60000" min="0" step="0.01">
                    </div>
                </div>
                
                <div class="input-group">
                    <div class="input-label">
                        <span>⚡ Levier</span>
                        <span class="input-hint">x</span>
                    </div>
                    <select class="calc-input" id="leverage">
                        <option value="1">1x (Spot)</option>
                        <option value="2">2x</option>
                        <option value="3">3x</option>
                        <option value="5">5x</option>
                        <option value="10">10x</option>
                        <option value="20">20x</option>
                        <option value="50">50x</option>
                    </select>
                </div>
            </div>
            
            <div class="calc-section">
                <h3>📈 Résultats</h3>
                
                <div class="result-highlight">
                    <div class="result-highlight-label">Taille de Position</div>
                    <div class="result-highlight-value" id="positionSize">$0</div>
                </div>
                
                <div class="result-box">
                    <div class="result-row">
                        <span class="result-label">💵 Risque en $</span>
                        <span class="result-value" id="riskAmount">$0</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">📊 Distance SL</span>
                        <span class="result-value negative" id="slDistance">0%</span>
                    </div>
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
                    <div class="result-row">
                        <span class="result-label">💰 Profit TP2</span>
                        <span class="result-value positive" id="profitTp2">+$0</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">💰 Profit TP3</span>
                        <span class="result-value positive" id="profitTp3">+$0</span>
                    </div>
                </div>
                
                <div class="result-highlight">
                    <div class="result-highlight-label">Ratio Risk/Reward (TP1)</div>
                    <div class="result-highlight-value" id="rrRatio">1:0</div>
                    <div id="rrBadge"></div>
                </div>
                
                <div class="warning-box">
                    <div class="warning-icon">⚠️</div>
                    <div class="warning-content">
                        <h4>Rappel Important</h4>
                        <p>Ne risquez jamais plus de 1-2% de votre capital par trade. Le trading comporte des risques de perte.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let direction = 'long';
        
        function setDirection(dir) {
            direction = dir;
            document.querySelectorAll('.direction-btn').forEach(function(btn) {
                btn.classList.remove('active', 'long', 'short');
            });
            
            if (dir === 'long') {
                document.querySelector('.direction-btn:first-child').classList.add('active', 'long');
            } else {
                document.querySelector('.direction-btn:last-child').classList.add('active', 'short');
            }
            
            calculate();
        }
        
        function calculate() {
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
            
            let badgeClass = 'rr-poor';
            let badgeText = '❌ Mauvais';
            
            if (rrRatio >= 3) {
                badgeClass = 'rr-excellent';
                badgeText = '🏆 Excellent';
            } else if (rrRatio >= 2) {
                badgeClass = 'rr-good';
                badgeText = '✅ Bon';
            } else if (rrRatio >= 1.5) {
                badgeClass = 'rr-fair';
                badgeText = '⚠️ Acceptable';
            }
            
            document.getElementById('rrBadge').innerHTML = '<span class="rr-badge ' + badgeClass + '">' + badgeText + '</span>';
        }
        
        ['capital', 'riskPercent', 'entryPrice', 'stopLoss', 'tp1', 'tp2', 'tp3', 'leverage'].forEach(function(id) {
            document.getElementById(id).addEventListener('input', calculate);
        });
        
        calculate();
    </script>
</body>
</html>
"""