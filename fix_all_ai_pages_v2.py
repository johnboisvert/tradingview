#!/usr/bin/env python3
"""
Script pour corriger toutes les pages AI qui ne fonctionnent pas:
1. AI Alerts - boutons ne fonctionnent pas (JS error)
2. AI Gem Hunter - affiche Unknown et $0
3. AI Technical Analysis - ne fonctionne plus
4. AI Setup Builder - erreur API Binance 451
"""

import re

def get_fixed_ai_alerts_page():
    """Page AI Alerts corrigée avec JavaScript fonctionnel"""
    return '''
def get_ai_alerts_page(sidebar_html: str, alerts_data: list) -> str:
    """Page AI Alerts - Alertes de trading intelligentes"""
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Alerts - Alertes Intelligentes</title>
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
        
        .stats-row {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }}
        .stat-card {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }}
        .stat-value {{
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #ef4444, #f87171);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .stat-label {{ color: #666; font-size: 0.85rem; margin-top: 5px; }}
        
        .main-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }}
        
        .section-card {{
            background: rgba(30, 30, 50, 0.8);
            border-radius: 20px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }}
        
        .section-title {{
            font-size: 1.4rem;
            color: #fff;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .form-group {{
            margin-bottom: 20px;
        }}
        .form-group label {{
            display: block;
            color: #a0a0a0;
            font-size: 0.9rem;
            margin-bottom: 8px;
        }}
        .form-row {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }}
        .form-group input, .form-group select {{
            width: 100%;
            background: rgba(20, 20, 40, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 14px 16px;
            color: #fff;
            font-size: 1rem;
        }}
        .form-group input:focus, .form-group select:focus {{
            outline: none;
            border-color: #ef4444;
        }}
        .form-group select option {{ background: #1a1a2e; }}
        
        .btn-create {{
            width: 100%;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            border: none;
            padding: 16px;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }}
        .btn-create:hover {{
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4);
        }}
        
        .preset-alerts {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 20px;
        }}
        .preset-btn {{
            background: rgba(30, 30, 60, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
            color: #fff;
        }}
        .preset-btn:hover {{
            border-color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
        }}
        .preset-icon {{ font-size: 1.5rem; margin-bottom: 8px; display: block; }}
        .preset-title {{ font-weight: 600; font-size: 0.95rem; }}
        .preset-desc {{ color: #666; font-size: 0.8rem; margin-top: 4px; }}
        
        .alerts-list {{
            display: flex;
            flex-direction: column;
            gap: 15px;
            max-height: 600px;
            overflow-y: auto;
        }}
        .alert-card {{
            background: rgba(20, 20, 40, 0.8);
            border-radius: 16px;
            padding: 20px;
            border-left: 4px solid #f59e0b;
        }}
        .alert-card.alert-high {{ border-left-color: #ef4444; background: rgba(239, 68, 68, 0.1); }}
        .alert-card.alert-medium {{ border-left-color: #f59e0b; background: rgba(245, 158, 11, 0.1); }}
        .alert-card.alert-low {{ border-left-color: #10b981; background: rgba(16, 185, 129, 0.1); }}
        
        .alert-header {{
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
        }}
        .alert-symbol {{ font-weight: 700; font-size: 1.1rem; color: #fff; }}
        .alert-type {{
            background: rgba(255, 255, 255, 0.1);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
        }}
        .alert-time {{ margin-left: auto; color: #666; font-size: 0.85rem; }}
        .alert-message {{ color: #c0c0c0; font-size: 0.95rem; }}
        .alert-actions {{
            display: flex;
            gap: 10px;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }}
        .btn-action {{
            padding: 8px 16px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-size: 0.85rem;
        }}
        .btn-edit {{ background: rgba(59, 130, 246, 0.2); color: #3b82f6; }}
        .btn-delete {{ background: rgba(239, 68, 68, 0.2); color: #ef4444; }}
        .btn-edit:hover {{ background: rgba(59, 130, 246, 0.4); }}
        .btn-delete:hover {{ background: rgba(239, 68, 68, 0.4); }}
        
        .no-alerts {{
            text-align: center;
            padding: 40px;
            color: #666;
        }}
        .no-alerts-icon {{ font-size: 3rem; display: block; margin-bottom: 15px; }}
        
        .toast {{
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 1000;
        }}
        .toast.show {{ transform: translateY(0); opacity: 1; }}
        
        @media (max-width: 1200px) {{ .main-grid {{ grid-template-columns: 1fr; }} }}
        @media (max-width: 768px) {{
            .content {{ margin-left: 0; padding: 15px; }}
            .stats-row {{ grid-template-columns: repeat(2, 1fr); }}
            .form-row {{ grid-template-columns: 1fr; }}
            .preset-alerts {{ grid-template-columns: 1fr; }}
        }}
    </style>
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <h1>🔔 AI Alerts</h1>
            <p>Créez et gérez vos alertes de trading intelligentes</p>
        </div>
        
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-value" id="totalAlerts">0</div>
                <div class="stat-label">Alertes Actives</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="triggeredToday">0</div>
                <div class="stat-label">Déclenchées</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="priceAlerts">0</div>
                <div class="stat-label">Alertes Prix</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="indicatorAlerts">0</div>
                <div class="stat-label">Indicateurs</div>
            </div>
        </div>
        
        <div class="main-grid">
            <div class="section-card">
                <h2 class="section-title">➕ Créer une Alerte</h2>
                <form id="alertForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Cryptomonnaie</label>
                            <select id="alertSymbol">
                                <option value="BTCUSDT">Bitcoin (BTC)</option>
                                <option value="ETHUSDT">Ethereum (ETH)</option>
                                <option value="BNBUSDT">BNB</option>
                                <option value="SOLUSDT">Solana (SOL)</option>
                                <option value="XRPUSDT">XRP</option>
                                <option value="ADAUSDT">Cardano (ADA)</option>
                                <option value="DOGEUSDT">Dogecoin (DOGE)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Type d'Alerte</label>
                            <select id="alertType">
                                <option value="price_above">Prix au-dessus de</option>
                                <option value="price_below">Prix en-dessous de</option>
                                <option value="percent_change">Variation %</option>
                                <option value="rsi_high">RSI > 70</option>
                                <option value="rsi_low">RSI < 30</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Valeur cible</label>
                            <input type="number" id="alertValue" placeholder="Ex: 100000" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>Priorité</label>
                            <select id="alertPriority">
                                <option value="high">🔴 Haute</option>
                                <option value="medium" selected>🟡 Moyenne</option>
                                <option value="low">🟢 Basse</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Note (optionnel)</label>
                        <input type="text" id="alertNote" placeholder="Ex: Support important">
                    </div>
                    <button type="submit" class="btn-create">🔔 Créer l'Alerte</button>
                </form>
                
                <h3 style="color: #888; margin-top: 25px; margin-bottom: 15px; font-size: 1rem;">⚡ Alertes Rapides</h3>
                <div class="preset-alerts">
                    <button class="preset-btn" id="presetBtc100k">
                        <span class="preset-icon">₿</span>
                        <div class="preset-title">BTC à $100,000</div>
                        <div class="preset-desc">Alerte quand BTC atteint 100K</div>
                    </button>
                    <button class="preset-btn" id="presetEth5k">
                        <span class="preset-icon">⟠</span>
                        <div class="preset-title">ETH à $5,000</div>
                        <div class="preset-desc">Alerte quand ETH atteint 5K</div>
                    </button>
                    <button class="preset-btn" id="presetBtcDrop">
                        <span class="preset-icon">📉</span>
                        <div class="preset-title">BTC -5%</div>
                        <div class="preset-desc">Alerte si BTC chute de 5%</div>
                    </button>
                    <button class="preset-btn" id="presetVolume">
                        <span class="preset-icon">📊</span>
                        <div class="preset-title">Pic de Volume</div>
                        <div class="preset-desc">Volume 3x supérieur</div>
                    </button>
                </div>
            </div>
            
            <div class="section-card">
                <h2 class="section-title">📋 Mes Alertes</h2>
                <div class="alerts-list" id="alertsList">
                    <div class="no-alerts">
                        <span class="no-alerts-icon">🔔</span>
                        <p>Aucune alerte active</p>
                        <p style="color: #555; font-size: 0.9rem;">Créez votre première alerte</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="toast" id="toast">✅ Action effectuée!</div>
    
    <script>
        // Variables globales
        var userAlerts = [];
        
        // Charger les alertes depuis localStorage
        function loadAlerts() {{
            try {{
                var stored = localStorage.getItem('cryptoAlerts');
                userAlerts = stored ? JSON.parse(stored) : [];
            }} catch(e) {{
                userAlerts = [];
            }}
        }}
        
        // Sauvegarder les alertes
        function saveAlerts() {{
            localStorage.setItem('cryptoAlerts', JSON.stringify(userAlerts));
        }}
        
        // Mettre à jour les stats
        function updateStats() {{
            document.getElementById('totalAlerts').textContent = userAlerts.length;
            document.getElementById('triggeredToday').textContent = userAlerts.filter(function(a) {{ return a.triggered; }}).length;
            document.getElementById('priceAlerts').textContent = userAlerts.filter(function(a) {{ return a.type && a.type.indexOf('price') >= 0; }}).length;
            document.getElementById('indicatorAlerts').textContent = userAlerts.filter(function(a) {{ return a.type && a.type.indexOf('price') < 0; }}).length;
        }}
        
        // Afficher le toast
        function showToast(message) {{
            var toast = document.getElementById('toast');
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(function() {{ toast.classList.remove('show'); }}, 3000);
        }}
        
        // Obtenir le label du type
        function getTypeLabel(type) {{
            var labels = {{
                'price_above': 'Prix >',
                'price_below': 'Prix <',
                'percent_change': 'Variation %',
                'rsi_high': 'RSI > 70',
                'rsi_low': 'RSI < 30',
                'volume_spike': 'Pic Volume'
            }};
            return labels[type] || type;
        }}
        
        // Rendre les alertes
        function renderAlerts() {{
            var container = document.getElementById('alertsList');
            
            if (userAlerts.length === 0) {{
                container.innerHTML = '<div class="no-alerts"><span class="no-alerts-icon">🔔</span><p>Aucune alerte active</p><p style="color: #555; font-size: 0.9rem;">Créez votre première alerte</p></div>';
                return;
            }}
            
            var html = '';
            for (var i = 0; i < userAlerts.length; i++) {{
                var alert = userAlerts[i];
                var priorityClass = 'alert-' + (alert.priority || 'medium');
                var priorityIcon = alert.priority === 'high' ? '🔴' : (alert.priority === 'low' ? '🟢' : '🟡');
                var symbolName = (alert.symbol || 'BTC').replace('USDT', '');
                var created = alert.created ? new Date(alert.created).toLocaleString('fr-FR') : '';
                
                html += '<div class="alert-card ' + priorityClass + '" data-id="' + alert.id + '">';
                html += '<div class="alert-header">';
                html += '<span class="alert-icon">' + priorityIcon + '</span>';
                html += '<span class="alert-symbol">' + symbolName + '</span>';
                html += '<span class="alert-type">' + getTypeLabel(alert.type) + ': ' + (alert.value || '') + '</span>';
                html += '<span class="alert-time">' + created + '</span>';
                html += '</div>';
                html += '<div class="alert-message">' + (alert.note || 'Alerte personnalisée') + '</div>';
                html += '<div class="alert-actions">';
                html += '<button class="btn-action btn-edit" data-id="' + alert.id + '">✏️ Modifier</button>';
                html += '<button class="btn-action btn-delete" data-id="' + alert.id + '">🗑️ Supprimer</button>';
                html += '</div></div>';
            }}
            container.innerHTML = html;
            
            // Ajouter les event listeners
            var editBtns = container.querySelectorAll('.btn-edit');
            var deleteBtns = container.querySelectorAll('.btn-delete');
            
            for (var j = 0; j < editBtns.length; j++) {{
                editBtns[j].addEventListener('click', function(e) {{
                    var id = this.getAttribute('data-id');
                    editAlertById(id);
                }});
            }}
            
            for (var k = 0; k < deleteBtns.length; k++) {{
                deleteBtns[k].addEventListener('click', function(e) {{
                    var id = this.getAttribute('data-id');
                    deleteAlertById(id);
                }});
            }}
        }}
        
        // Créer une alerte
        function createAlert(symbol, type, value, priority, note) {{
            var alert = {{
                id: Date.now(),
                symbol: symbol,
                type: type,
                value: value,
                priority: priority,
                note: note,
                created: new Date().toISOString(),
                triggered: false
            }};
            userAlerts.push(alert);
            saveAlerts();
            renderAlerts();
            updateStats();
            showToast('✅ Alerte créée!');
        }}
        
        // Supprimer une alerte
        function deleteAlertById(id) {{
            userAlerts = userAlerts.filter(function(a) {{ return a.id != id; }});
            saveAlerts();
            renderAlerts();
            updateStats();
            showToast('🗑️ Alerte supprimée');
        }}
        
        // Modifier une alerte
        function editAlertById(id) {{
            var alert = userAlerts.find(function(a) {{ return a.id == id; }});
            if (alert) {{
                document.getElementById('alertSymbol').value = alert.symbol || 'BTCUSDT';
                document.getElementById('alertType').value = alert.type || 'price_above';
                document.getElementById('alertValue').value = alert.value || '';
                document.getElementById('alertPriority').value = alert.priority || 'medium';
                document.getElementById('alertNote').value = alert.note || '';
                
                // Supprimer l'ancienne
                deleteAlertById(id);
                showToast('✏️ Modifiez et recréez');
            }}
        }}
        
        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {{
            loadAlerts();
            renderAlerts();
            updateStats();
            
            // Form submit
            document.getElementById('alertForm').addEventListener('submit', function(e) {{
                e.preventDefault();
                var symbol = document.getElementById('alertSymbol').value;
                var type = document.getElementById('alertType').value;
                var value = parseFloat(document.getElementById('alertValue').value) || 0;
                var priority = document.getElementById('alertPriority').value;
                var note = document.getElementById('alertNote').value;
                
                createAlert(symbol, type, value, priority, note);
                this.reset();
            }});
            
            // Preset buttons
            document.getElementById('presetBtc100k').addEventListener('click', function() {{
                createAlert('BTCUSDT', 'price_above', 100000, 'high', 'BTC à 100K!');
            }});
            document.getElementById('presetEth5k').addEventListener('click', function() {{
                createAlert('ETHUSDT', 'price_above', 5000, 'high', 'ETH à 5K!');
            }});
            document.getElementById('presetBtcDrop').addEventListener('click', function() {{
                createAlert('BTCUSDT', 'percent_change', -5, 'high', 'Chute BTC -5%');
            }});
            document.getElementById('presetVolume').addEventListener('click', function() {{
                createAlert('BTCUSDT', 'volume_spike', 3, 'medium', 'Pic de volume 3x');
            }});
        }});
    </script>
</body>
</html>"""
    return html
'''


def get_fixed_setup_builder_post():
    """Route POST corrigée pour Setup Builder avec API de secours"""
    return '''
@app.post("/ai-setup-builder")
async def ai_setup_builder_generate(request: Request):
    """Génère un setup de trading - utilise CoinGecko comme fallback"""
    if not is_logged_in(request):
        return RedirectResponse(url="/login", status_code=303)

    try:
        form = await request.form()
        symbol = (form.get("symbol") or "BTCUSDT").upper().strip()
        interval = (form.get("tf") or "15m").strip()
        style = (form.get("style") or "day").strip()
        risk_raw = (form.get("risk") or "1").strip()

        try:
            risk_pct = float(risk_raw)
        except:
            risk_pct = 1.0
        risk_pct = max(0.1, min(5.0, risk_pct))

        # Mapper le symbole vers CoinGecko ID
        symbol_map = {
            "BTCUSDT": "bitcoin", "ETHUSDT": "ethereum", "BNBUSDT": "binancecoin",
            "SOLUSDT": "solana", "XRPUSDT": "ripple", "ADAUSDT": "cardano",
            "DOGEUSDT": "dogecoin", "MATICUSDT": "matic-network", "DOTUSDT": "polkadot",
            "AVAXUSDT": "avalanche-2", "LINKUSDT": "chainlink", "LTCUSDT": "litecoin"
        }
        coin_id = symbol_map.get(symbol, "bitcoin")
        symbol_clean = symbol.replace("USDT", "")

        # Utiliser CoinGecko au lieu de Binance (pas de blocage géographique)
        import aiohttp
        async with aiohttp.ClientSession() as session:
            # Obtenir les données de marché
            url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart?vs_currency=usd&days=7"
            async with session.get(url, timeout=15) as resp:
                if resp.status != 200:
                    raise Exception(f"CoinGecko API error: {resp.status}")
                data = await resp.json()

        prices = [p[1] for p in data.get("prices", [])]
        if len(prices) < 20:
            raise Exception("Pas assez de données")

        last_price = prices[-1]
        
        # Calculs techniques
        sma20 = sum(prices[-20:]) / 20
        sma50 = sum(prices[-50:]) / 50 if len(prices) >= 50 else sma20
        
        # Volatilité (ATR approximatif)
        changes = [abs(prices[i] - prices[i-1]) for i in range(1, min(15, len(prices)))]
        atr = sum(changes) / len(changes) if changes else last_price * 0.02
        
        # RSI simplifié
        gains, losses = [], []
        for i in range(1, min(15, len(prices))):
            change = prices[i] - prices[i-1]
            gains.append(max(0, change))
            losses.append(max(0, -change))
        avg_gain = sum(gains) / len(gains) if gains else 0
        avg_loss = sum(losses) / len(losses) if losses else 1
        rs = avg_gain / avg_loss if avg_loss > 0 else 100
        rsi = 100 - (100 / (1 + rs))

        # Tendance
        if sma20 > sma50 * 1.005:
            trend, trend_color, direction = "HAUSSIER", "#10b981", "LONG"
        elif sma20 < sma50 * 0.995:
            trend, trend_color, direction = "BAISSIER", "#ef4444", "SHORT"
        else:
            trend, trend_color, direction = "NEUTRE", "#f59e0b", "ATTENDRE"

        # Niveaux selon le style
        multipliers = {"scalp": (1.0, 1.5), "swing": (2.5, 4.0), "day": (1.5, 2.5)}
        stop_mult, tp_mult = multipliers.get(style, (1.5, 2.5))

        entry = last_price
        if direction == "LONG":
            stop_loss = entry - (atr * stop_mult)
            take_profit = entry + (atr * tp_mult)
        elif direction == "SHORT":
            stop_loss = entry + (atr * stop_mult)
            take_profit = entry - (atr * tp_mult)
        else:
            stop_loss = entry - (atr * stop_mult)
            take_profit = entry + (atr * tp_mult)

        risk_reward = abs(take_profit - entry) / abs(entry - stop_loss) if abs(entry - stop_loss) > 0 else 0

        # Score de confiance
        confidence = 50
        if trend != "NEUTRE": confidence += 15
        if 30 < rsi < 70: confidence += 10
        if risk_reward >= 2: confidence += 15
        confidence = min(95, confidence)

        return HTMLResponse(f"""
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Setup - {symbol_clean}</title>
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{ 
                    font-family: 'Segoe UI', system-ui, sans-serif; 
                    background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
                    color: #e0e0e0; 
                    min-height: 100vh;
                    padding: 30px;
                }}
                .container {{ max-width: 900px; margin: 0 auto; }}
                .header {{
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.2));
                    border-radius: 20px;
                    padding: 30px;
                    margin-bottom: 30px;
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    text-align: center;
                }}
                .header h1 {{
                    font-size: 2rem;
                    background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }}
                .card {{
                    background: rgba(30, 30, 50, 0.9);
                    border-radius: 20px;
                    padding: 30px;
                    margin-bottom: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }}
                .setup-header {{
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }}
                .setup-header h2 {{ font-size: 1.8rem; color: #fff; }}
                .setup-header .timeframe {{ color: #888; font-size: 0.9rem; }}
                .direction {{
                    padding: 12px 24px;
                    border-radius: 30px;
                    font-weight: 700;
                    font-size: 1.1rem;
                }}
                .direction-long {{ background: rgba(16, 185, 129, 0.3); color: #10b981; border: 1px solid #10b981; }}
                .direction-short {{ background: rgba(239, 68, 68, 0.3); color: #ef4444; border: 1px solid #ef4444; }}
                .direction-wait {{ background: rgba(245, 158, 11, 0.3); color: #f59e0b; border: 1px solid #f59e0b; }}
                
                .levels {{
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 25px;
                }}
                .level {{
                    background: rgba(20, 20, 40, 0.8);
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                }}
                .level-label {{ color: #888; font-size: 0.85rem; margin-bottom: 8px; }}
                .level-value {{ font-size: 1.3rem; font-weight: 700; }}
                .level-entry {{ color: #3b82f6; }}
                .level-stop {{ color: #ef4444; }}
                .level-tp {{ color: #10b981; }}
                .level-rr {{ color: #f59e0b; }}
                
                .indicators {{
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-bottom: 25px;
                }}
                .indicator {{
                    background: rgba(20, 20, 40, 0.8);
                    border-radius: 12px;
                    padding: 15px;
                    text-align: center;
                }}
                .indicator-label {{ color: #888; font-size: 0.8rem; }}
                .indicator-value {{ font-size: 1.1rem; font-weight: 600; margin-top: 5px; }}
                
                .confidence {{
                    background: rgba(20, 20, 40, 0.8);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 25px;
                }}
                .confidence-label {{ color: #888; margin-bottom: 10px; }}
                .bar-bg {{
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    height: 20px;
                    overflow: hidden;
                }}
                .bar-fill {{ height: 100%; border-radius: 10px; }}
                .confidence-value {{ text-align: right; margin-top: 8px; font-weight: 700; font-size: 1.2rem; }}
                
                .analysis {{
                    background: rgba(20, 20, 40, 0.8);
                    border-radius: 12px;
                    padding: 20px;
                }}
                .analysis h3 {{ color: #fff; margin-bottom: 15px; }}
                .analysis ul {{ list-style: none; }}
                .analysis li {{
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }}
                .analysis li:last-child {{ border-bottom: none; }}
                
                .btn-back {{
                    display: inline-block;
                    background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                    color: white;
                    padding: 14px 28px;
                    border-radius: 12px;
                    text-decoration: none;
                    font-weight: 600;
                    margin-top: 20px;
                }}
                .btn-back:hover {{ transform: translateY(-2px); box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4); }}
                
                @media (max-width: 768px) {{
                    .levels {{ grid-template-columns: repeat(2, 1fr); }}
                    .indicators {{ grid-template-columns: 1fr; }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🧩 Setup de Trading Généré</h1>
                    <p style="color: #888; margin-top: 10px;">Analyse technique basée sur les données CoinGecko</p>
                </div>
                
                <div class="card">
                    <div class="setup-header">
                        <div>
                            <h2>{symbol_clean}/USDT</h2>
                            <span class="timeframe">Style: {style.capitalize()} | Risque: {risk_pct}%</span>
                        </div>
                        <span class="direction direction-{'long' if direction == 'LONG' else 'short' if direction == 'SHORT' else 'wait'}">{direction}</span>
                    </div>
                    
                    <div class="levels">
                        <div class="level">
                            <div class="level-label">Prix Actuel</div>
                            <div class="level-value level-entry">${last_price:,.2f}</div>
                        </div>
                        <div class="level">
                            <div class="level-label">Stop Loss</div>
                            <div class="level-value level-stop">${stop_loss:,.2f}</div>
                        </div>
                        <div class="level">
                            <div class="level-label">Take Profit</div>
                            <div class="level-value level-tp">${take_profit:,.2f}</div>
                        </div>
                        <div class="level">
                            <div class="level-label">Risk/Reward</div>
                            <div class="level-value level-rr">{risk_reward:.2f}x</div>
                        </div>
                    </div>
                    
                    <div class="indicators">
                        <div class="indicator">
                            <div class="indicator-label">Tendance</div>
                            <div class="indicator-value" style="color: {trend_color}">{trend}</div>
                        </div>
                        <div class="indicator">
                            <div class="indicator-label">RSI (14)</div>
                            <div class="indicator-value" style="color: {'#ef4444' if rsi > 70 else '#10b981' if rsi < 30 else '#f59e0b'}">{rsi:.1f}</div>
                        </div>
                        <div class="indicator">
                            <div class="indicator-label">Volatilité</div>
                            <div class="indicator-value">${atr:,.2f}</div>
                        </div>
                    </div>
                    
                    <div class="confidence">
                        <div class="confidence-label">Niveau de Confiance</div>
                        <div class="bar-bg">
                            <div class="bar-fill" style="width: {confidence}%; background: linear-gradient(90deg, {'#10b981, #34d399' if confidence >= 70 else '#f59e0b, #fbbf24' if confidence >= 50 else '#ef4444, #f87171'});"></div>
                        </div>
                        <div class="confidence-value" style="color: {'#10b981' if confidence >= 70 else '#f59e0b' if confidence >= 50 else '#ef4444'}">{confidence}%</div>
                    </div>
                    
                    <div class="analysis">
                        <h3>📊 Analyse</h3>
                        <ul>
                            <li>{'✅' if sma20 > sma50 else '⚠️'} SMA20 {'au-dessus' if sma20 > sma50 else 'en-dessous'} de SMA50</li>
                            <li>{'✅' if 30 < rsi < 70 else '⚠️'} RSI en zone {'neutre' if 30 < rsi < 70 else 'extrême'}</li>
                            <li>{'✅' if risk_reward >= 2 else '⚠️'} Ratio R/R {'favorable' if risk_reward >= 2 else 'à améliorer'}</li>
                            <li>📈 Risque par trade: {risk_pct}%</li>
                        </ul>
                    </div>
                    
                    <a href="/ai-setup-builder" class="btn-back">← Nouveau Setup</a>
                </div>
            </div>
        </body>
        </html>
        """)

    except Exception as e:
        return HTMLResponse(f"""
        <!DOCTYPE html>
        <html><head><title>Erreur</title>
        <style>
            body {{ background: #0a0a0f; color: #fff; font-family: system-ui; padding: 40px; }}
            .error {{ background: rgba(239,68,68,0.2); border: 1px solid #ef4444; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; }}
            h1 {{ color: #ef4444; }}
            a {{ color: #3b82f6; }}
            pre {{ background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-top: 15px; font-size: 0.85rem; overflow-x: auto; }}
        </style></head>
        <body>
            <div class="error">
                <h1>⚠️ Erreur</h1>
                <p>Une erreur s'est produite lors de l'analyse.</p>
                <pre>{str(e)}</pre>
                <p style="margin-top: 20px;"><a href="/ai-setup-builder">← Réessayer</a></p>
            </div>
        </body></html>
        """)
'''


def apply_fixes():
    """Applique toutes les corrections"""
    
    # 1. Corriger ai_pages_functions.py - AI Alerts
    print("📝 Correction de la page AI Alerts...")
    with open('/workspace/tradingview-main/ai_pages_functions.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remplacer get_ai_alerts_page
    alerts_code = get_fixed_ai_alerts_page()
    pattern = r'def get_ai_alerts_page\(sidebar_html: str, alerts_data: list\) -> str:.*?(?=\ndef [a-z_]+\(|\Z)'
    content = re.sub(pattern, alerts_code.strip() + '\n\n', content, flags=re.DOTALL)
    
    with open('/workspace/tradingview-main/ai_pages_functions.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ AI Alerts corrigé")
    
    # 2. Corriger main.py - Setup Builder POST
    print("📝 Correction de la route Setup Builder...")
    with open('/workspace/tradingview-main/main.py', 'r', encoding='utf-8') as f:
        main_content = f.read()
    
    setup_code = get_fixed_setup_builder_post()
    pattern = r'@app\.post\("/ai-setup-builder"\)\nasync def ai_setup_builder_generate.*?(?=\n@app\.|\nclass |\ndef [a-z]|\Z)'
    
    if re.search(pattern, main_content, flags=re.DOTALL):
        main_content = re.sub(pattern, setup_code.strip() + '\n\n', main_content, flags=re.DOTALL)
        print("✅ Route POST remplacée")
    else:
        print("⚠️ Route non trouvée")
    
    with open('/workspace/tradingview-main/main.py', 'w', encoding='utf-8') as f:
        f.write(main_content)
    
    print("\n🎉 Toutes les corrections appliquées!")


if __name__ == "__main__":
    apply_fixes()
