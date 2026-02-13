"""
Page AI News - Design révolutionnaire avec données en temps réel
"""

def get_ai_news_page_html(cryptos, sidebar):
    """Génère la page AI News avec design révolutionnaire"""
    
    # Générer les cartes de news
    news_cards = ""
    for i, crypto in enumerate(cryptos[:50]):
        price = crypto.get('current_price', 0)
        change_24h = crypto.get('price_change_percentage_24h', 0)
        change_7d = crypto.get('price_change_percentage_7d_in_currency', 0) or 0
        name = crypto.get('name', '')
        symbol = crypto.get('symbol', '').upper()
        rank = crypto.get('market_cap_rank', 0)
        mcap = crypto.get('market_cap', 0)
        volume = crypto.get('total_volume', 0)
        high_24h = crypto.get('high_24h', 0)
        low_24h = crypto.get('low_24h', 0)
        image = crypto.get('image', '')
        
        price_str = f"{price:,.6f}" if price < 1 else f"{price:,.2f}"
        change_class = "positive" if change_24h >= 0 else "negative"
        change_7d_class = "positive" if change_7d >= 0 else "negative"
        trend_icon = "📈" if change_24h >= 0 else "📉"
        
        # Calcul du sentiment basé sur les changements
        if change_24h > 5:
            sentiment = "🔥 BULLISH"
            sentiment_class = "badge-success"
        elif change_24h > 0:
            sentiment = "✅ POSITIF"
            sentiment_class = "badge-success"
        elif change_24h > -5:
            sentiment = "⚠️ NEUTRE"
            sentiment_class = "badge-warning"
        else:
            sentiment = "🔻 BEARISH"
            sentiment_class = "badge-danger"
        
        # Calcul de la force du volume
        vol_ratio = (volume / mcap * 100) if mcap > 0 else 0
        vol_strength = min(100, vol_ratio * 10)
        
        news_cards += f"""
        <div class="news-card animate-slide-up" style="animation-delay: {i * 0.03}s">
            <div class="news-card-header">
                <div class="news-rank">#{rank}</div>
                <div class="news-coin">
                    <img src="{image}" alt="{symbol}" class="coin-logo" onerror="this.style.display='none'">
                    <div class="coin-details">
                        <span class="coin-symbol">{symbol}</span>
                        <span class="coin-name">{name}</span>
                    </div>
                </div>
                <span class="trend-icon">{trend_icon}</span>
            </div>
            
            <div class="news-card-body">
                <div class="price-section">
                    <div class="current-price">${price_str}</div>
                    <div class="price-range">
                        <span class="range-label">24h Range:</span>
                        <span class="range-low">${low_24h:,.2f}</span>
                        <span class="range-sep">-</span>
                        <span class="range-high">${high_24h:,.2f}</span>
                    </div>
                </div>
                
                <div class="changes-grid">
                    <div class="change-item">
                        <span class="change-label">24h</span>
                        <span class="change-value {change_class}">{change_24h:+.2f}%</span>
                    </div>
                    <div class="change-item">
                        <span class="change-label">7d</span>
                        <span class="change-value {change_7d_class}">{change_7d:+.2f}%</span>
                    </div>
                </div>
                
                <div class="metrics-section">
                    <div class="metric">
                        <span class="metric-label">Market Cap</span>
                        <span class="metric-value">${mcap/1e9:.2f}B</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Volume 24h</span>
                        <span class="metric-value">${volume/1e6:.1f}M</span>
                    </div>
                </div>
                
                <div class="volume-bar">
                    <div class="volume-label">Force du Volume</div>
                    <div class="progress-bar">
                        <div class="progress-fill {'success' if vol_strength > 50 else 'warning' if vol_strength > 25 else 'danger'}" style="width: {vol_strength}%"></div>
                    </div>
                </div>
                
                <div class="sentiment-badge {sentiment_class}">{sentiment}</div>
            </div>
        </div>
        """
    
    # Calculer les statistiques globales
    total_mcap = sum(c.get('market_cap', 0) for c in cryptos[:50])
    total_volume = sum(c.get('total_volume', 0) for c in cryptos[:50])
    avg_change = sum(c.get('price_change_percentage_24h', 0) for c in cryptos[:50]) / 50
    bullish_count = sum(1 for c in cryptos[:50] if c.get('price_change_percentage_24h', 0) > 0)
    
    content = f"""
    <!-- Stats Overview -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-value">${total_mcap/1e12:.2f}T</div>
            <div class="stat-label">Market Cap Total</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-value">${total_volume/1e9:.1f}B</div>
            <div class="stat-label">Volume 24h</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-value {'positive' if avg_change >= 0 else 'negative'}">{avg_change:+.2f}%</div>
            <div class="stat-label">Variation Moyenne</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-value positive">{bullish_count}/50</div>
            <div class="stat-label">Cryptos en Hausse</div>
        </div>
    </div>
    
    <!-- Market Sentiment -->
    <div class="market-sentiment-bar">
        <div class="sentiment-title">🌡️ Sentiment du Marché</div>
        <div class="sentiment-meter">
            <div class="meter-fill" style="width: {bullish_count * 2}%"></div>
        </div>
        <div class="sentiment-labels">
            <span class="label-fear">😨 Peur</span>
            <span class="label-neutral">😐 Neutre</span>
            <span class="label-greed">🤑 Avidité</span>
        </div>
    </div>
    
    <!-- News Grid -->
    <div class="news-grid">
        {news_cards}
    </div>
    
    <!-- How to Use Section -->
    <div class="how-to-use-section">
        <h2>💡 Comment utiliser AI News ?</h2>
        <div class="tips-grid">
            <div class="tip-card">
                <div class="tip-icon">1️⃣</div>
                <h3>Surveillez les Tendances</h3>
                <p>Identifiez les cryptos avec les plus fortes variations pour détecter les mouvements de marché.</p>
            </div>
            <div class="tip-card">
                <div class="tip-icon">2️⃣</div>
                <h3>Analysez le Volume</h3>
                <p>Un volume élevé confirme la force d'un mouvement. Méfiez-vous des pumps sans volume.</p>
            </div>
            <div class="tip-card">
                <div class="tip-icon">3️⃣</div>
                <h3>Comparez 24h vs 7j</h3>
                <p>Une hausse 24h mais baisse 7j peut indiquer un rebond technique temporaire.</p>
            </div>
            <div class="tip-card">
                <div class="tip-icon">4️⃣</div>
                <h3>Utilisez le Sentiment</h3>
                <p>Le sentiment global aide à comprendre la psychologie du marché.</p>
            </div>
        </div>
    </div>
    """
    
    extra_styles = """
    <style>
        .news-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 25px;
            margin-bottom: 50px;
        }
        
        .news-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
        }
        
        .news-card:hover {
            transform: translateY(-8px) scale(1.02);
            border-color: var(--accent-primary);
            box-shadow: 0 20px 40px rgba(99, 102, 241, 0.2);
        }
        
        .news-card-header {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.3);
            border-bottom: 1px solid var(--border-color);
        }
        
        .news-rank {
            background: var(--gradient-primary);
            padding: 6px 12px;
            border-radius: var(--radius-sm);
            font-weight: 800;
            font-size: 13px;
        }
        
        .news-coin {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
        }
        
        .coin-logo {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid var(--border-color);
        }
        
        .coin-details {
            display: flex;
            flex-direction: column;
        }
        
        .coin-symbol {
            font-weight: 800;
            font-size: 18px;
        }
        
        .coin-name {
            font-size: 12px;
            color: var(--text-secondary);
        }
        
        .trend-icon {
            font-size: 28px;
        }
        
        .news-card-body {
            padding: 20px;
        }
        
        .price-section {
            margin-bottom: 20px;
        }
        
        .current-price {
            font-size: 28px;
            font-weight: 800;
            font-family: 'JetBrains Mono', monospace;
            margin-bottom: 8px;
        }
        
        .price-range {
            font-size: 12px;
            color: var(--text-secondary);
        }
        
        .range-low { color: var(--danger); }
        .range-high { color: var(--success); }
        .range-sep { margin: 0 5px; }
        
        .changes-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .change-item {
            background: rgba(0, 0, 0, 0.2);
            padding: 12px;
            border-radius: var(--radius-md);
            text-align: center;
        }
        
        .change-label {
            display: block;
            font-size: 11px;
            color: var(--text-secondary);
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        
        .change-value {
            font-size: 18px;
            font-weight: 700;
            font-family: 'JetBrains Mono', monospace;
        }
        
        .change-value.positive { color: var(--success); }
        .change-value.negative { color: var(--danger); }
        
        .metrics-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .metric {
            display: flex;
            flex-direction: column;
        }
        
        .metric-label {
            font-size: 11px;
            color: var(--text-secondary);
            text-transform: uppercase;
        }
        
        .metric-value {
            font-size: 14px;
            font-weight: 600;
        }
        
        .volume-bar {
            margin-bottom: 15px;
        }
        
        .volume-label {
            font-size: 11px;
            color: var(--text-secondary);
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        
        .sentiment-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
        }
        
        /* Market Sentiment Bar */
        .market-sentiment-bar {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: 25px;
            margin-bottom: 40px;
            backdrop-filter: blur(10px);
        }
        
        .sentiment-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .sentiment-meter {
            height: 20px;
            background: linear-gradient(90deg, #ef4444, #f59e0b, #10b981);
            border-radius: 999px;
            position: relative;
            overflow: hidden;
        }
        
        .meter-fill {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: rgba(255, 255, 255, 0.3);
            border-right: 3px solid white;
            transition: width 0.5s ease;
        }
        
        .sentiment-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 13px;
        }
        
        .label-fear { color: var(--danger); }
        .label-neutral { color: var(--warning); }
        .label-greed { color: var(--success); }
        
        /* How to Use Section */
        .how-to-use-section {
            background: var(--gradient-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-xl);
            padding: 40px;
            margin-top: 50px;
        }
        
        .how-to-use-section h2 {
            text-align: center;
            font-size: 28px;
            margin-bottom: 30px;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .tips-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .tip-card {
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: 25px;
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .tip-card:hover {
            transform: translateY(-5px);
            border-color: var(--accent-primary);
        }
        
        .tip-icon {
            font-size: 40px;
            margin-bottom: 15px;
        }
        
        .tip-card h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: var(--accent-tertiary);
        }
        
        .tip-card p {
            font-size: 14px;
            color: var(--text-secondary);
            line-height: 1.6;
        }
    </style>
    """
    
    extra_scripts = """
    <script>
        // Auto-refresh toutes les 2 minutes
        setTimeout(function() {
            window.location.reload();
        }, 120000);
        
        // Animation au scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.news-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.5s ease';
            observer.observe(card);
        });
        
        // Mise à jour de l'heure
        function updateTime() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('fr-FR');
            document.querySelector('.live-badge span:last-child').textContent = 'LIVE - ' + timeStr;
        }
        updateTime();
        setInterval(updateTime, 1000);
    </script>
    """
    
    from redesign_ai_pages import REVOLUTIONARY_CSS, get_base_template
    
    return sidebar + get_base_template(
        title="AI News",
        icon="📰",
        subtitle="Actualités crypto en temps réel - Top 50 avec analyse de sentiment et métriques avancées",
        content=extra_styles + content,
        extra_scripts=extra_scripts
    )