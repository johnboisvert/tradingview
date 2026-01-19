# ============================================
# NOUVELLES ROUTES À AJOUTER DANS MAIN.PY
# ============================================
# Copiez ces routes dans votre main.py

# IMPORTANT: D'abord, ajoutez le menu de navigation en haut du fichier
# (voir fichier NAVIGATION_MENU.py)

from datetime import datetime, timedelta
from io import BytesIO
import secrets

# ============================================
# 1. DASHBOARD UTILISATEUR PERSONNEL
# ============================================

@app.get("/mon-compte", response_class=HTMLResponse)
async def mon_compte(request: Request):
    """Dashboard personnel utilisateur"""
    session_token = request.cookies.get("session_token")
    user = get_user_from_token(session_token)
    
    if not user:
        return RedirectResponse("/login", status_code=303)
    
    username = user.get('username', 'User')
    
    conn = get_db_connection()
    c = conn.cursor()
    
    try:
        c.execute("""SELECT plan, subscription_end, payment_method, created_at 
                     FROM users WHERE username = ?""", (username,))
        result = c.fetchone()
        
        if result:
            plan, sub_end, payment_method, created_at = result
            days_left = 0
            if sub_end:
                try:
                    end_date = datetime.fromisoformat(sub_end)
                    days_left = (end_date - datetime.now()).days
                except:
                    pass
            
            is_active = days_left > 0
            status = "✅ Actif" if is_active else "❌ Expiré"
            status_class = "active" if is_active else "expired"
            
            plan_names = {
                'free': '🆓 Gratuit',
                '1_month': '💳 Premium (1 mois)',
                '3_months': '💎 Advanced (3 mois)',
                '6_months': '👑 Pro (6 mois)',
                '1_year': '🚀 Elite (1 an)'
            }
            plan_display = plan_names.get(plan, plan)
        else:
            plan_display = '🆓 Gratuit'
            sub_end = None
            days_left = 0
            payment_method = 'N/A'
            status = '❌ Aucun abonnement'
            status_class = 'expired'
    finally:
        conn.close()
    
    return HTMLResponse(f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mon Compte - Trading Dashboard Pro</title>
        {NAV_MENU}
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{
                font-family: 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding-bottom: 40px;
            }}
            .container {{ max-width: 1000px; margin: 40px auto; padding: 0 20px; }}
            .header {{
                text-align: center;
                color: white;
                margin: 40px 0;
            }}
            .header h1 {{ font-size: 42px; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }}
            .card {{
                background: white;
                border-radius: 20px;
                padding: 40px;
                margin-bottom: 30px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }}
            .card h2 {{ color: #333; margin-bottom: 30px; font-size: 28px; }}
            .info-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }}
            .info-item {{
                padding: 25px;
                background: #f8f9fa;
                border-radius: 15px;
                text-align: center;
            }}
            .info-label {{
                color: #666;
                font-size: 14px;
                margin-bottom: 10px;
                text-transform: uppercase;
                font-weight: 600;
            }}
            .info-value {{
                color: #333;
                font-size: 26px;
                font-weight: bold;
            }}
            .status {{
                display: inline-block;
                padding: 12px 24px;
                border-radius: 25px;
                font-weight: bold;
                font-size: 18px;
            }}
            .status.active {{
                background: #d1fae5;
                color: #065f46;
            }}
            .status.expired {{
                background: #fee2e2;
                color: #991b1b;
            }}
            .btn {{
                display: inline-block;
                padding: 15px 35px;
                border-radius: 12px;
                text-decoration: none;
                font-weight: bold;
                margin: 10px;
                transition: all 0.3s;
                font-size: 16px;
            }}
            .btn-success {{
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
            }}
            .btn-success:hover {{
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(16,185,129,0.3);
            }}
            .btn-primary {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }}
            .btn-primary:hover {{
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(102,126,234,0.3);
            }}
            .actions {{ text-align: center; margin-top: 30px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>👤 Mon Compte</h1>
                <p style="font-size: 20px; opacity: 0.9;">Bienvenue {username}</p>
            </div>
            
            <div class="card">
                <h2>📊 Mon Abonnement</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Plan Actuel</div>
                        <div class="info-value">{plan_display}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Statut</div>
                        <div class="info-value">
                            <span class="status {status_class}">{status}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Jours Restants</div>
                        <div class="info-value">{days_left} jours</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Expire le</div>
                        <div class="info-value">{sub_end[:10] if sub_end else 'N/A'}</div>
                    </div>
                </div>
                
                <div class="actions">
                    <a href="/pricing-complete" class="btn btn-success">
                        💎 Renouveler / Changer de Plan
                    </a>
                    <a href="/dashboard" class="btn btn-primary">
                        🏠 Retour Dashboard
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
    """)


# ============================================
# 2. HISTORIQUE FEAR & GREED 6-12 MOIS
# ============================================

@app.get("/fear-greed-history")
async def fear_greed_history():
    """API: Historique Fear & Greed Index sur 12 mois"""
    try:
        url = "https://api.alternative.me/fng/?limit=365"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if data.get('data'):
            history = []
            for item in data['data']:
                history.append({
                    'date': item.get('timestamp'),
                    'value': int(item.get('value', 0)),
                    'classification': item.get('value_classification')
                })
            
            return {'success': True, 'total': len(history), 'data': history[:365]}
        
        return {'success': False, 'message': 'Pas de données'}
    except Exception as e:
        return {'success': False, 'message': str(e)}


@app.get("/fear-greed-chart", response_class=HTMLResponse)
async def fear_greed_chart():
    """Page graphique Fear & Greed 12 mois"""
    return HTMLResponse(f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fear & Greed - Historique 12 mois</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        {NAV_MENU}
        <style>
            body {{ 
                font-family: 'Segoe UI', sans-serif; 
                background: #0f172a; 
                color: white; 
                margin: 0;
                padding-bottom: 40px;
            }}
            .container {{ 
                max-width: 1400px; 
                margin: 40px auto; 
                background: #1e293b; 
                padding: 40px; 
                border-radius: 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }}
            h1 {{
                text-align: center;
                font-size: 36px;
                margin-bottom: 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }}
            canvas {{ 
                max-height: 500px;
                margin-top: 20px;
            }}
            .loading {{
                text-align: center;
                padding: 60px;
                font-size: 24px;
                color: #94a3b8;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📊 Fear & Greed Index - Historique 12 Mois</h1>
            <div id="loading" class="loading">🔄 Chargement des données...</div>
            <canvas id="fearChart" style="display:none;"></canvas>
        </div>
        
        <script>
            fetch('/fear-greed-history')
                .then(r => r.json())
                .then(data => {{
                    document.getElementById('loading').style.display = 'none';
                    
                    if (!data.success) {{
                        document.getElementById('loading').innerHTML = '❌ ' + data.message;
                        document.getElementById('loading').style.display = 'block';
                        return;
                    }}
                    
                    document.getElementById('fearChart').style.display = 'block';
                    
                    const labels = data.data.map(d => {{
                        const date = new Date(parseInt(d.date) * 1000);
                        return date.toLocaleDateString('fr-FR', {{ month: 'short', year: 'numeric' }});
                    }}).reverse();
                    
                    const values = data.data.map(d => d.value).reverse();
                    
                    const ctx = document.getElementById('fearChart').getContext('2d');
                    new Chart(ctx, {{
                        type: 'line',
                        data: {{
                            labels: labels,
                            datasets: [{{
                                label: 'Fear & Greed Index',
                                data: values,
                                borderColor: '#667eea',
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                fill: true,
                                tension: 0.4,
                                pointRadius: 0,
                                borderWidth: 3
                            }}]
                        }},
                        options: {{
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {{
                                legend: {{ 
                                    labels: {{ 
                                        color: 'white',
                                        font: {{ size: 16 }}
                                    }} 
                                }},
                                tooltip: {{
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    titleFont: {{ size: 14 }},
                                    bodyFont: {{ size: 14 }},
                                    padding: 12
                                }}
                            }},
                            scales: {{
                                y: {{
                                    beginAtZero: true,
                                    max: 100,
                                    ticks: {{ 
                                        color: 'white',
                                        font: {{ size: 14 }}
                                    }},
                                    grid: {{ color: 'rgba(255,255,255,0.1)' }}
                                }},
                                x: {{
                                    ticks: {{ 
                                        color: 'white',
                                        maxTicksLimit: 12,
                                        font: {{ size: 14 }}
                                    }},
                                    grid: {{ color: 'rgba(255,255,255,0.1)' }}
                                }}
                            }}
                        }}
                    }});
                }})
                .catch(err => {{
                    document.getElementById('loading').innerHTML = '❌ Erreur: ' + err.message;
                }});
        </script>
    </body>
    </html>
    """)


# ============================================
# 3. STATS TEMPS RÉEL
# ============================================


# ============================================
# 4. BACKTESTING
# ============================================

@app.post("/api/backtest")
async def backtest_strategy(request: Request):
    """API: Backtest d'une stratégie"""
    data = await request.json()
    
    symbol = data.get('symbol', 'BTCUSDT')
    start_date = data.get('start_date', '2024-01-01')
    end_date = data.get('end_date', '2024-12-31')
    strategy = data.get('strategy', 'ema_cross')
    
    # Simulation (à remplacer par vraie logique)
    import random
    
    total_trades = random.randint(100, 200)
    winning_trades = int(total_trades * random.uniform(0.55, 0.70))
    losing_trades = total_trades - winning_trades
    
    results = {
        'total_trades': total_trades,
        'winning_trades': winning_trades,
        'losing_trades': losing_trades,
        'win_rate': round((winning_trades / total_trades) * 100, 2),
        'profit_loss': round(random.uniform(2000, 5000), 2),
        'max_drawdown': round(random.uniform(-800, -300), 2),
        'sharpe_ratio': round(random.uniform(1.2, 2.5), 2)
    }
    
    return {
        'success': True,
        'symbol': symbol,
        'period': f"{start_date} - {end_date}",
        'strategy': strategy,
        'results': results
    }


@app.get("/backtesting", response_class=HTMLResponse)
async def backtesting_page():
    """Page backtesting"""
    return HTMLResponse(f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Backtesting - Trading Dashboard Pro</title>
        {NAV_MENU}
        <style>
            body {{
                font-family: 'Segoe UI', sans-serif;
                background: #0f172a;
                color: white;
                margin: 0;
                padding-bottom: 40px;
            }}
            .container {{
                max-width: 1200px;
                margin: 40px auto;
                padding: 0 20px;
            }}
            .card {{
                background: #1e293b;
                border-radius: 20px;
                padding: 40px;
                margin-bottom: 30px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            }}
            h1 {{
                text-align: center;
                font-size: 36px;
                margin-bottom: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }}
            .form-group {{
                margin-bottom: 25px;
            }}
            label {{
                display: block;
                margin-bottom: 10px;
                font-weight: 600;
                color: #94a3b8;
            }}
            input, select {{
                width: 100%;
                padding: 15px;
                border-radius: 10px;
                border: 2px solid #334155;
                background: #0f172a;
                color: white;
                font-size: 16px;
            }}
            button {{
                width: 100%;
                padding: 18px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
            }}
            button:hover {{
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(102,126,234,0.4);
            }}
            #results {{
                display: none;
                margin-top: 30px;
            }}
            .result-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }}
            .result-item {{
                background: #0f172a;
                padding: 25px;
                border-radius: 15px;
                text-align: center;
            }}
            .result-label {{
                color: #94a3b8;
                font-size: 14px;
                margin-bottom: 10px;
            }}
            .result-value {{
                font-size: 32px;
                font-weight: bold;
                color: #10b981;
            }}
            .result-value.negative {{
                color: #ef4444;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🧪 Backtesting de Stratégies</h1>
            
            <div class="card">
                <h2>Configuration du Backtest</h2>
                <form id="backtestForm">
                    <div class="form-group">
                        <label>Symbole</label>
                        <input type="text" id="symbol" value="BTCUSDT" required>
                    </div>
                    <div class="form-group">
                        <label>Date Début</label>
                        <input type="date" id="startDate" value="2024-01-01" required>
                    </div>
                    <div class="form-group">
                        <label>Date Fin</label>
                        <input type="date" id="endDate" value="2024-12-31" required>
                    </div>
                    <div class="form-group">
                        <label>Stratégie</label>
                        <select id="strategy">
                            <option value="ema_cross">EMA Crossover</option>
                            <option value="rsi">RSI Strategy</option>
                            <option value="macd">MACD Strategy</option>
                        </select>
                    </div>
                    <button type="submit">🚀 Lancer le Backtest</button>
                </form>
                
                <div id="results">
                    <h2>Résultats</h2>
                    <div class="result-grid" id="resultGrid"></div>
                </div>
            </div>
        </div>
        
        <script>
            document.getElementById('backtestForm').addEventListener('submit', async (e) => {{
                e.preventDefault();
                
                const data = {{
                    symbol: document.getElementById('symbol').value,
                    start_date: document.getElementById('startDate').value,
                    end_date: document.getElementById('endDate').value,
                    strategy: document.getElementById('strategy').value
                }};
                
                try {{
                    const response = await fetch('/api/backtest', {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json' }},
                        body: JSON.stringify(data)
                    }});
                    
                    const result = await response.json();
                    
                    if (result.success) {{
                        const results = result.results;
                        const html = `
                            <div class="result-item">
                                <div class="result-label">Total Trades</div>
                                <div class="result-value">${{results.total_trades}}</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">Trades Gagnants</div>
                                <div class="result-value">${{results.winning_trades}}</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">Win Rate</div>
                                <div class="result-value">${{results.win_rate}}%</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">Profit/Loss</div>
                                <div class="result-value">${{results.profit_loss > 0 ? '+' : ''}}$$${{results.profit_loss.toFixed(2)}}</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">Max Drawdown</div>
                                <div class="result-value negative">$$${{results.max_drawdown.toFixed(2)}}</div>
                            </div>
                            <div class="result-item">
                                <div class="result-label">Sharpe Ratio</div>
                                <div class="result-value">${{results.sharpe_ratio}}</div>
                            </div>
                        `;
                        
                        document.getElementById('resultGrid').innerHTML = html;
                        document.getElementById('results').style.display = 'block';
                    }}
                }} catch (err) {{
                    alert('Erreur: ' + err.message);
                }}
            }});
        </script>
    </body>
    </html>
    """)


# ============================================
# FIN DES NOUVELLES ROUTES
# ============================================
# Copiez tout ce fichier dans votre main.py
