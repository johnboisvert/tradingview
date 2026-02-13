"""
Page AI Whale Watcher - Design révolutionnaire pour suivre les baleines
"""

def get_ai_whale_page_html(whale_events, prices, sidebar, status_notes=None):
    """Génère la page AI Whale Watcher avec design révolutionnaire"""
    
    btc_price = prices.get('BTC') or 0
    eth_price = prices.get('ETH') or 0
    
    # Générer les lignes de transactions
    whale_rows = ""
    total_btc_volume = 0
    total_eth_volume = 0
    
    for i, event in enumerate(whale_events[:50]):
        asset = event.get('asset', 'BTC')
        amount = event.get('amount', 0)
        time_str = event.get('time', '--:--')
        from_addr = event.get('from_addr', '—')[:12] + '...' if len(event.get('from_addr', '')) > 12 else event.get('from_addr', '—')
        to_addr = event.get('to_addr', '—')[:12] + '...' if len(event.get('to_addr', '')) > 12 else event.get('to_addr', '—')
        tx_hash = event.get('tx_hash', '')
        explorer = event.get('explorer', '#')
        
        # Calcul de la valeur USD
        price = btc_price if asset == 'BTC' else eth_price
        usd_value = amount * price if price else 0
        
        if asset == 'BTC':
            total_btc_volume += amount
        else:
            total_eth_volume += amount
        
        # Classification de la taille
        if usd_value >= 10000000:
            size_class = 'mega-whale'
            size_label = '🐋 MEGA'
        elif usd_value >= 1000000:
            size_class = 'whale'
            size_label = '🐳 WHALE'
        elif usd_value >= 100000:
            size_class = 'dolphin'
            size_label = '🐬 DOLPHIN'
        else:
            size_class = 'fish'
            size_label = '🐟 FISH'
        
        asset_icon = '₿' if asset == 'BTC' else 'Ξ'
        asset_color = '#f7931a' if asset == 'BTC' else '#627eea'
        
        whale_rows += f"""
        <tr class="whale-row {size_class} animate-slide-up" style="animation-delay: {i * 0.03}s">
            <td>
                <div class="time-cell">
                    <span class="time-value">{time_str}</span>
                    <span class="time-label">UTC</span>
                </div>
            </td>
            <td>
                <div class="asset-cell" style="--asset-color: {asset_color}">
                    <span class="asset-icon">{asset_icon}</span>
                    <span class="asset-name">{asset}</span>
                </div>
            </td>
            <td>
                <div class="amount-cell">
                    <span class="amount-value">{amount:,.4f}</span>
                    <span class="amount-usd">${usd_value:,.0f}</span>
                </div>
            </td>
            <td>
                <span class="size-badge {size_class}">{size_label}</span>
            </td>
            <td>
                <div class="address-cell">
                    <span class="address from">{from_addr}</span>
                    <span class="arrow">→</span>
                    <span class="address to">{to_addr}</span>
                </div>
            </td>
            <td>
                <a href="{explorer}" target="_blank" class="explorer-link">
                    🔗 Explorer
                </a>
            </td>
        </tr>
        """
    
    # Stats
    btc_usd_total = total_btc_volume * btc_price if btc_price else 0
    eth_usd_total = total_eth_volume * eth_price if eth_price else 0
    total_usd = btc_usd_total + eth_usd_total
    
    mega_whales = sum(1 for e in whale_events if (e.get('amount', 0) * (btc_price if e.get('asset') == 'BTC' else eth_price)) >= 10000000)
    whales = sum(1 for e in whale_events if 1000000 <= (e.get('amount', 0) * (btc_price if e.get('asset') == 'BTC' else eth_price)) < 10000000)
    
    content = f"""
    <style>
        .whale-stats {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }}
        
        @media (max-width: 1000px) {{
            .whale-stats {{ grid-template-columns: repeat(2, 1fr); }}
        }}
        
        .whale-stat {{
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: 25px;
            position: relative;
            overflow: hidden;
        }}
        
        .whale-stat::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
        }}
        
        .whale-stat.btc::before {{ background: #f7931a; }}
        .whale-stat.eth::before {{ background: #627eea; }}
        .whale-stat.total::before {{ background: var(--gradient-primary); }}
        .whale-stat.count::before {{ background: var(--success); }}
        
        .whale-stat-icon {{
            font-size: 40px;
            margin-bottom: 15px;
        }}
        
        .whale-stat-value {{
            font-size: 32px;
            font-weight: 900;
            font-family: 'JetBrains Mono', monospace;
            margin-bottom: 5px;
        }}
        
        .whale-stat.btc .whale-stat-value {{ color: #f7931a; }}
        .whale-stat.eth .whale-stat-value {{ color: #627eea; }}
        
        .whale-stat-label {{
            font-size: 13px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        
        /* Price Ticker */
        .price-ticker {{
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
        }}
        
        .ticker-item {{
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px 25px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: var(--radius-md);
            flex: 1;
        }}
        
        .ticker-icon {{
            font-size: 32px;
        }}
        
        .ticker-info {{
            display: flex;
            flex-direction: column;
        }}
        
        .ticker-name {{
            font-size: 14px;
            color: var(--text-secondary);
        }}
        
        .ticker-price {{
            font-size: 24px;
            font-weight: 800;
            font-family: 'JetBrains Mono', monospace;
        }}
        
        /* Table */
        .whale-table-container {{
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
        
        .asset-filters {{
            display: flex;
            gap: 10px;
        }}
        
        .asset-filter {{
            padding: 8px 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 600;
        }}
        
        .asset-filter:hover, .asset-filter.active {{
            border-color: var(--accent-primary);
            color: var(--text-primary);
        }}
        
        .asset-filter.btc.active {{ background: rgba(247, 147, 26, 0.2); border-color: #f7931a; }}
        .asset-filter.eth.active {{ background: rgba(98, 126, 234, 0.2); border-color: #627eea; }}
        
        .whale-table {{
            width: 100%;
            border-collapse: collapse;
        }}
        
        .whale-table th {{
            padding: 15px 20px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 1px;
            background: rgba(0, 0, 0, 0.2);
        }}
        
        .whale-table td {{
            padding: 18px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }}
        
        .whale-row {{
            transition: all 0.3s ease;
        }}
        
        .whale-row:hover {{
            background: rgba(99, 102, 241, 0.1);
        }}
        
        .whale-row.mega-whale {{
            background: rgba(239, 68, 68, 0.05);
        }}
        
        .whale-row.mega-whale:hover {{
            background: rgba(239, 68, 68, 0.1);
        }}
        
        .time-cell {{
            display: flex;
            flex-direction: column;
        }}
        
        .time-value {{
            font-weight: 700;
            font-family: 'JetBrains Mono', monospace;
        }}
        
        .time-label {{
            font-size: 11px;
            color: var(--text-muted);
        }}
        
        .asset-cell {{
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .asset-icon {{
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--asset-color);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 18px;
        }}
        
        .asset-name {{
            font-weight: 700;
        }}
        
        .amount-cell {{
            display: flex;
            flex-direction: column;
        }}
        
        .amount-value {{
            font-weight: 700;
            font-family: 'JetBrains Mono', monospace;
        }}
        
        .amount-usd {{
            font-size: 12px;
            color: var(--success);
        }}
        
        .size-badge {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 12px;
        }}
        
        .size-badge.mega-whale {{
            background: rgba(239, 68, 68, 0.15);
            color: var(--danger);
            border: 1px solid rgba(239, 68, 68, 0.3);
            animation: pulse 2s infinite;
        }}
        
        .size-badge.whale {{
            background: rgba(139, 92, 246, 0.15);
            color: var(--accent-secondary);
            border: 1px solid rgba(139, 92, 246, 0.3);
        }}
        
        .size-badge.dolphin {{
            background: rgba(6, 182, 212, 0.15);
            color: var(--accent-tertiary);
            border: 1px solid rgba(6, 182, 212, 0.3);
        }}
        
        .size-badge.fish {{
            background: rgba(255, 255, 255, 0.05);
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
        }}
        
        .address-cell {{
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
        }}
        
        .address {{
            padding: 4px 8px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: var(--radius-sm);
        }}
        
        .arrow {{
            color: var(--text-muted);
        }}
        
        .explorer-link {{
            color: var(--accent-primary);
            text-decoration: none;
            font-size: 13px;
            transition: color 0.3s;
        }}
        
        .explorer-link:hover {{
            color: var(--accent-tertiary);
        }}
        
        /* Legend */
        .whale-legend {{
            display: flex;
            gap: 25px;
            justify-content: center;
            padding: 20px;
            background: rgba(0, 0, 0, 0.2);
            border-top: 1px solid var(--border-color);
            flex-wrap: wrap;
        }}
        
        .legend-item {{
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: var(--text-secondary);
        }}
        
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
        
        .tips-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }}
        
        .tip-card {{
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: 25px;
        }}
        
        .tip-card h3 {{
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            margin-bottom: 12px;
        }}
        
        .tip-card p {{
            font-size: 14px;
            color: var(--text-secondary);
            line-height: 1.6;
        }}
    </style>
    
    <!-- Price Ticker -->
    <div class="price-ticker">
        <div class="ticker-item">
            <span class="ticker-icon">₿</span>
            <div class="ticker-info">
                <span class="ticker-name">Bitcoin</span>
                <span class="ticker-price" style="color: #f7931a">${btc_price:,.2f}</span>
            </div>
        </div>
        <div class="ticker-item">
            <span class="ticker-icon">Ξ</span>
            <div class="ticker-info">
                <span class="ticker-name">Ethereum</span>
                <span class="ticker-price" style="color: #627eea">${eth_price:,.2f}</span>
            </div>
        </div>
    </div>
    
    <!-- Stats -->
    <div class="whale-stats">
        <div class="whale-stat btc">
            <div class="whale-stat-icon">₿</div>
            <div class="whale-stat-value">{total_btc_volume:,.2f}</div>
            <div class="whale-stat-label">Volume BTC</div>
        </div>
        <div class="whale-stat eth">
            <div class="whale-stat-icon">Ξ</div>
            <div class="whale-stat-value">{total_eth_volume:,.2f}</div>
            <div class="whale-stat-label">Volume ETH</div>
        </div>
        <div class="whale-stat total">
            <div class="whale-stat-icon">💰</div>
            <div class="whale-stat-value">${total_usd/1e6:.1f}M</div>
            <div class="whale-stat-label">Valeur Totale USD</div>
        </div>
        <div class="whale-stat count">
            <div class="whale-stat-icon">🐋</div>
            <div class="whale-stat-value">{mega_whales + whales}</div>
            <div class="whale-stat-label">Mega Whales + Whales</div>
        </div>
    </div>
    
    <!-- Whale Table -->
    <div class="whale-table-container">
        <div class="table-header">
            <div class="table-title">
                <span>🐋</span>
                <span>Transactions Baleines en Direct</span>
            </div>
            <div class="asset-filters">
                <button class="asset-filter active" onclick="filterAsset('all')">Tous</button>
                <button class="asset-filter btc" onclick="filterAsset('BTC')">₿ BTC</button>
                <button class="asset-filter eth" onclick="filterAsset('ETH')">Ξ ETH</button>
            </div>
        </div>
        
        <div style="overflow-x: auto; max-height: 600px;">
            <table class="whale-table">
                <thead>
                    <tr>
                        <th>Heure</th>
                        <th>Asset</th>
                        <th>Montant</th>
                        <th>Taille</th>
                        <th>Adresses</th>
                        <th>TX</th>
                    </tr>
                </thead>
                <tbody id="whaleBody">
                    {whale_rows}
                </tbody>
            </table>
        </div>
        
        <div class="whale-legend">
            <div class="legend-item">
                <span class="size-badge mega-whale">🐋 MEGA</span>
                <span>> $10M</span>
            </div>
            <div class="legend-item">
                <span class="size-badge whale">🐳 WHALE</span>
                <span>$1M - $10M</span>
            </div>
            <div class="legend-item">
                <span class="size-badge dolphin">🐬 DOLPHIN</span>
                <span>$100K - $1M</span>
            </div>
            <div class="legend-item">
                <span class="size-badge fish">🐟 FISH</span>
                <span>< $100K</span>
            </div>
        </div>
    </div>
    
    <!-- How to Use -->
    <div class="how-to-use">
        <h2>💡 Comment utiliser le Whale Watcher ?</h2>
        <div class="tips-grid">
            <div class="tip-card">
                <h3>🐋 Suivre les Mega Whales</h3>
                <p>Les transactions > $10M peuvent signaler des mouvements institutionnels importants. Surveillez la direction (vers exchange = vente potentielle).</p>
            </div>
            <div class="tip-card">
                <h3>📊 Analyser les Patterns</h3>
                <p>Plusieurs grosses transactions dans la même direction peuvent indiquer une tendance. Accumulation = bullish, Distribution = bearish.</p>
            </div>
            <div class="tip-card">
                <h3>⏰ Timing</h3>
                <p>Les mouvements de baleines précèdent souvent les mouvements de prix. Utilisez ces données comme indicateur avancé.</p>
            </div>
            <div class="tip-card">
                <h3>⚠️ Attention</h3>
                <p>Tous les mouvements ne sont pas des signaux de trading. Certains sont des transferts internes ou du cold storage.</p>
            </div>
        </div>
    </div>
    """
    
    extra_scripts = """
    <script>
        // Filter by asset
        function filterAsset(asset) {
            const rows = document.querySelectorAll('.whale-row');
            const buttons = document.querySelectorAll('.asset-filter');
            
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            rows.forEach(row => {
                const assetCell = row.querySelector('.asset-name');
                const rowAsset = assetCell ? assetCell.textContent.trim() : '';
                
                if (asset === 'all' || rowAsset === asset) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
        
        // Auto refresh every 30 seconds
        setTimeout(() => window.location.reload(), 30000);
        
        // Highlight new transactions
        const rows = document.querySelectorAll('.whale-row');
        rows.forEach((row, i) => {
            if (i < 3) {
                row.style.borderLeft = '3px solid var(--success)';
            }
        });
    </script>
    """
    
    from redesign_ai_pages import REVOLUTIONARY_CSS, get_base_template
    
    return sidebar + get_base_template(
        title="AI Whale Watcher",
        icon="🐋",
        subtitle="Surveillance en temps réel des transactions de baleines BTC et ETH depuis le mempool",
        content=content,
        extra_scripts=extra_scripts
    )