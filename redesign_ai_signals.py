"""
Page AI Signals - Design révolutionnaire avec signaux en temps réel
"""

def get_ai_signals_page_html(signals_data, sidebar):
    """Génère la page AI Signals avec design révolutionnaire"""
    
    signals = signals_data.get('signals', [])
    
    # Générer les lignes de signaux
    signals_rows = ""
    for i, signal in enumerate(signals[:30]):
        symbol = signal.get('symbol', 'N/A')
        price = signal.get('price', 0)
        signal_type = signal.get('signal', 'WATCH')
        score = signal.get('score', 50)
        change_24h = signal.get('change_24h', 0)
        change_7d = signal.get('change_7d', 0)
        volume = signal.get('volume', 0)
        reasons = signal.get('reasons', [])
        
        # Classes de style selon le signal
        if signal_type == 'BUY':
            signal_class = 'signal-buy'
            signal_icon = '🟢'
        elif signal_type == 'SELL':
            signal_class = 'signal-sell'
            signal_icon = '🔴'
        else:
            signal_class = 'signal-watch'
            signal_icon = '🟡'
        
        # Score class
        if score >= 70:
            score_class = 'score-high'
        elif score >= 50:
            score_class = 'score-medium'
        else:
            score_class = 'score-low'
        
        change_class = 'positive' if change_24h >= 0 else 'negative'
        
        reasons_html = ' '.join([f'<span class="reason-tag">{r}</span>' for r in reasons[:3]])
        
        signals_rows += f"""
        <tr class="signal-row animate-slide-up" style="animation-delay: {i * 0.05}s" data-symbol="{symbol}">
            <td>
                <div class="coin-cell">
                    <div class="coin-avatar">{symbol[:2]}</div>
                    <div class="coin-info">
                        <span class="symbol">{symbol}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="signal-badge {signal_class}">
                    {signal_icon} {signal_type}
                </span>
            </td>
            <td>
                <div class="score-cell {score_class}">
                    <div class="score-value">{score}</div>
                    <div class="score-bar">
                        <div class="score-fill" style="width: {score}%"></div>
                    </div>
                </div>
            </td>
            <td class="price-cell">${price:,.4f}</td>
            <td class="change-cell {change_class}">{change_24h:+.2f}%</td>
            <td class="volume-cell">${volume/1e6:.1f}M</td>
            <td class="reasons-cell">{reasons_html}</td>
        </tr>
        """
    
    # Statistiques
    buy_signals = sum(1 for s in signals if s.get('signal') == 'BUY')
    sell_signals = sum(1 for s in signals if s.get('signal') == 'SELL')
    watch_signals = len(signals) - buy_signals - sell_signals
    avg_score = sum(s.get('score', 0) for s in signals) / len(signals) if signals else 0
    
    content = f"""
    <style>
        .signals-stats {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }}
        
        @media (max-width: 900px) {{
            .signals-stats {{ grid-template-columns: repeat(2, 1fr); }}
        }}
        
        .signal-stat {{
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: 25px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }}
        
        .signal-stat::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
        }}
        
        .signal-stat.buy::before {{ background: var(--success); }}
        .signal-stat.sell::before {{ background: var(--danger); }}
        .signal-stat.watch::before {{ background: var(--warning); }}
        .signal-stat.score::before {{ background: var(--gradient-primary); }}
        
        .signal-stat-value {{
            font-size: 48px;
            font-weight: 900;
            margin-bottom: 10px;
            font-family: 'JetBrains Mono', monospace;
        }}
        
        .signal-stat.buy .signal-stat-value {{ color: var(--success); }}
        .signal-stat.sell .signal-stat-value {{ color: var(--danger); }}
        .signal-stat.watch .signal-stat-value {{ color: var(--warning); }}
        
        .signal-stat-label {{
            font-size: 14px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        
        /* Table Styles */
        .signals-table-container {{
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            overflow: hidden;
        }}
        
        .table-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 25px;
            background: rgba(0, 0, 0, 0.3);
            border-bottom: 1px solid var(--border-color);
        }}
        
        .table-title {{
            font-size: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .filter-controls {{
            display: flex;
            gap: 10px;
        }}
        
        .filter-btn {{
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.3s;
            font-size: 13px;
            font-weight: 600;
        }}
        
        .filter-btn:hover, .filter-btn.active {{
            background: var(--accent-primary);
            border-color: var(--accent-primary);
            color: white;
        }}
        
        .signals-table {{
            width: 100%;
            border-collapse: collapse;
        }}
        
        .signals-table th {{
            padding: 15px 20px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 1px;
            background: rgba(0, 0, 0, 0.2);
            border-bottom: 1px solid var(--border-color);
        }}
        
        .signals-table td {{
            padding: 18px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }}
        
        .signal-row {{
            transition: all 0.3s ease;
            cursor: pointer;
        }}
        
        .signal-row:hover {{
            background: rgba(99, 102, 241, 0.1);
        }}
        
        .coin-cell {{
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        
        .coin-avatar {{
            width: 42px;
            height: 42px;
            border-radius: 12px;
            background: var(--gradient-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 14px;
        }}
        
        .symbol {{
            font-weight: 700;
            font-size: 16px;
        }}
        
        .signal-badge {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 13px;
        }}
        
        .signal-buy {{
            background: rgba(16, 185, 129, 0.15);
            color: var(--success);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }}
        
        .signal-sell {{
            background: rgba(239, 68, 68, 0.15);
            color: var(--danger);
            border: 1px solid rgba(239, 68, 68, 0.3);
        }}
        
        .signal-watch {{
            background: rgba(245, 158, 11, 0.15);
            color: var(--warning);
            border: 1px solid rgba(245, 158, 11, 0.3);
        }}
        
        .score-cell {{
            display: flex;
            flex-direction: column;
            gap: 6px;
        }}
        
        .score-value {{
            font-weight: 800;
            font-size: 18px;
            font-family: 'JetBrains Mono', monospace;
        }}
        
        .score-high .score-value {{ color: var(--success); }}
        .score-medium .score-value {{ color: var(--warning); }}
        .score-low .score-value {{ color: var(--danger); }}
        
        .score-bar {{
            width: 80px;
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 999px;
            overflow: hidden;
        }}
        
        .score-fill {{
            height: 100%;
            border-radius: 999px;
            transition: width 0.5s ease;
        }}
        
        .score-high .score-fill {{ background: var(--success); }}
        .score-medium .score-fill {{ background: var(--warning); }}
        .score-low .score-fill {{ background: var(--danger); }}
        
        .price-cell {{
            font-family: 'JetBrains Mono', monospace;
            font-weight: 600;
        }}
        
        .change-cell {{
            font-weight: 700;
            font-family: 'JetBrains Mono', monospace;
        }}
        
        .change-cell.positive {{ color: var(--success); }}
        .change-cell.negative {{ color: var(--danger); }}
        
        .volume-cell {{
            color: var(--text-secondary);
        }}
        
        .reasons-cell {{
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }}
        
        .reason-tag {{
            padding: 4px 10px;
            background: rgba(99, 102, 241, 0.15);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 999px;
            font-size: 11px;
            color: var(--accent-primary);
        }}
        
        /* Legend */
        .signals-legend {{
            display: flex;
            gap: 30px;
            justify-content: center;
            padding: 20px;
            background: rgba(0, 0, 0, 0.2);
            border-top: 1px solid var(--border-color);
        }}
        
        .legend-item {{
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: var(--text-secondary);
        }}
        
        .legend-dot {{
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }}
        
        .legend-dot.buy {{ background: var(--success); }}
        .legend-dot.sell {{ background: var(--danger); }}
        .legend-dot.watch {{ background: var(--warning); }}
        
        /* How to use */
        .how-to-use {{
            background: var(--gradient-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-xl);
            padding: 40px;
            margin-top: 40px;
        }}
        
        .how-to-use h2 {{
            text-align: center;
            font-size: 24px;
            margin-bottom: 30px;
            color: var(--accent-tertiary);
        }}
        
        .use-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }}
        
        .use-card {{
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: 25px;
        }}
        
        .use-card h3 {{
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            margin-bottom: 12px;
            color: var(--text-primary);
        }}
        
        .use-card p {{
            font-size: 14px;
            color: var(--text-secondary);
            line-height: 1.6;
        }}
    </style>
    
    <!-- Stats -->
    <div class="signals-stats">
        <div class="signal-stat buy">
            <div class="signal-stat-value">{buy_signals}</div>
            <div class="signal-stat-label">🟢 Signaux Achat</div>
        </div>
        <div class="signal-stat sell">
            <div class="signal-stat-value">{sell_signals}</div>
            <div class="signal-stat-label">🔴 Signaux Vente</div>
        </div>
        <div class="signal-stat watch">
            <div class="signal-stat-value">{watch_signals}</div>
            <div class="signal-stat-label">🟡 À Surveiller</div>
        </div>
        <div class="signal-stat score">
            <div class="signal-stat-value">{avg_score:.0f}</div>
            <div class="signal-stat-label">📊 Score Moyen</div>
        </div>
    </div>
    
    <!-- Signals Table -->
    <div class="signals-table-container">
        <div class="table-header">
            <div class="table-title">
                <span>⚡</span>
                <span>Signaux IA en Temps Réel</span>
            </div>
            <div class="filter-controls">
                <button class="filter-btn active" onclick="filterSignals('all')">Tous</button>
                <button class="filter-btn" onclick="filterSignals('BUY')">Achat</button>
                <button class="filter-btn" onclick="filterSignals('SELL')">Vente</button>
                <button class="filter-btn" onclick="filterSignals('WATCH')">Watch</button>
            </div>
        </div>
        
        <div style="overflow-x: auto;">
            <table class="signals-table">
                <thead>
                    <tr>
                        <th>Crypto</th>
                        <th>Signal</th>
                        <th>Score IA</th>
                        <th>Prix</th>
                        <th>24h</th>
                        <th>Volume</th>
                        <th>Raisons</th>
                    </tr>
                </thead>
                <tbody id="signalsBody">
                    {signals_rows}
                </tbody>
            </table>
        </div>
        
        <div class="signals-legend">
            <div class="legend-item">
                <div class="legend-dot buy"></div>
                <span>BUY = Momentum haussier fort</span>
            </div>
            <div class="legend-item">
                <div class="legend-dot sell"></div>
                <span>SELL = Momentum baissier</span>
            </div>
            <div class="legend-item">
                <div class="legend-dot watch"></div>
                <span>WATCH = À surveiller</span>
            </div>
        </div>
    </div>
    
    <!-- How to Use -->
    <div class="how-to-use">
        <h2>💡 Comment utiliser les Signaux IA ?</h2>
        <div class="use-grid">
            <div class="use-card">
                <h3>📊 Score IA</h3>
                <p>Le score de 0 à 100 indique la force du signal. Plus le score est élevé, plus le signal est fiable. Visez les scores > 70 pour les meilleures opportunités.</p>
            </div>
            <div class="use-card">
                <h3>🎯 Types de Signaux</h3>
                <p>BUY = Opportunité d'achat potentielle. SELL = Considérer une prise de profit. WATCH = Surveiller pour une entrée future.</p>
            </div>
            <div class="use-card">
                <h3>⚠️ Gestion du Risque</h3>
                <p>Ne jamais investir plus que ce que vous pouvez perdre. Utilisez toujours des stop-loss et diversifiez vos positions.</p>
            </div>
            <div class="use-card">
                <h3>🔄 Mise à Jour</h3>
                <p>Les signaux sont recalculés toutes les 2 minutes. Rafraîchissez la page pour les dernières données.</p>
            </div>
        </div>
    </div>
    """
    
    extra_scripts = """
    <script>
        // Filter signals
        function filterSignals(type) {
            const rows = document.querySelectorAll('.signal-row');
            const buttons = document.querySelectorAll('.filter-btn');
            
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            rows.forEach(row => {
                const badge = row.querySelector('.signal-badge');
                const signalType = badge.textContent.trim().split(' ')[1];
                
                if (type === 'all' || signalType === type) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
        
        // Auto refresh
        setTimeout(() => window.location.reload(), 120000);
        
        // Row click handler
        document.querySelectorAll('.signal-row').forEach(row => {
            row.addEventListener('click', () => {
                const symbol = row.dataset.symbol;
                // Could open a modal or redirect to detailed view
                console.log('Selected:', symbol);
            });
        });
    </script>
    """
    
    from redesign_ai_pages import REVOLUTIONARY_CSS, get_base_template
    
    return sidebar + get_base_template(
        title="AI Signals",
        icon="⚡",
        subtitle="Signaux de trading générés par IA basés sur le momentum, le volume et l'analyse technique",
        content=content,
        extra_scripts=extra_scripts
    )