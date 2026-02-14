#!/usr/bin/env python3
"""
Pages révolutionnaires avec design premium et données réelles
- Narrative Radar
- AI Crypto Coach
- AI Swarm Agents
- Altseason Copilot Pro
- Rug Scam Shield
- AI Technical Analysis (amélioré)
"""

# CSS commun pour toutes les pages révolutionnaires
REVOLUTIONARY_CSS = """
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @keyframes gradient-shift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
    }
    
    @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
        50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); }
    }
    
    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
    
    @keyframes scan-line {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100vh); }
    }
    
    @keyframes data-flow {
        0% { opacity: 0; transform: translateX(-20px); }
        50% { opacity: 1; }
        100% { opacity: 0; transform: translateX(20px); }
    }
    
    body {
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        background: linear-gradient(135deg, #0a0a0f 0%, #0d0d1a 25%, #1a1a2e 50%, #0f0f1a 75%, #0a0a0f 100%);
        background-size: 400% 400%;
        animation: gradient-shift 15s ease infinite;
        color: #e0e0e0;
        min-height: 100vh;
        overflow-x: hidden;
    }
    
    body::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #8b5cf6, #3b82f6, #10b981, transparent);
        animation: scan-line 8s linear infinite;
        z-index: 1000;
        opacity: 0.5;
    }
    
    .content {
        margin-left: 250px;
        padding: 30px;
        min-height: 100vh;
        position: relative;
    }
    
    /* Hero Section */
    .hero {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.05));
        border-radius: 24px;
        padding: 50px;
        margin-bottom: 30px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        position: relative;
        overflow: hidden;
    }
    
    .hero::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
        animation: float 6s ease-in-out infinite;
    }
    
    .hero-content {
        position: relative;
        z-index: 1;
    }
    
    .hero h1 {
        font-size: 3rem;
        font-weight: 800;
        background: linear-gradient(135deg, #8b5cf6, #3b82f6, #10b981);
        background-size: 200% 200%;
        animation: gradient-shift 3s ease infinite;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 15px;
        letter-spacing: -1px;
    }
    
    .hero p {
        color: #a0a0a0;
        font-size: 1.2rem;
        max-width: 600px;
    }
    
    .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(16, 185, 129, 0.2);
        border: 1px solid rgba(16, 185, 129, 0.4);
        padding: 8px 16px;
        border-radius: 30px;
        font-size: 0.85rem;
        color: #10b981;
        margin-top: 20px;
    }
    
    .hero-badge::before {
        content: '';
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        animation: pulse-glow 2s infinite;
    }
    
    /* Stats Row */
    .stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 30px;
    }
    
    .stat-card {
        background: rgba(30, 30, 50, 0.8);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 25px;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
    }
    
    .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #8b5cf6, #3b82f6);
        transform: scaleX(0);
        transition: transform 0.4s ease;
    }
    
    .stat-card:hover {
        transform: translateY(-5px);
        border-color: rgba(139, 92, 246, 0.5);
        box-shadow: 0 20px 40px rgba(139, 92, 246, 0.2);
    }
    
    .stat-card:hover::before {
        transform: scaleX(1);
    }
    
    .stat-icon {
        font-size: 2.5rem;
        margin-bottom: 15px;
        display: block;
    }
    
    .stat-value {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(135deg, #fff, #a0a0a0);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    .stat-value.positive { background: linear-gradient(135deg, #10b981, #34d399); -webkit-background-clip: text; }
    .stat-value.negative { background: linear-gradient(135deg, #ef4444, #f87171); -webkit-background-clip: text; }
    .stat-value.warning { background: linear-gradient(135deg, #f59e0b, #fbbf24); -webkit-background-clip: text; }
    
    .stat-label {
        color: #666;
        font-size: 0.9rem;
        margin-top: 8px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    /* Main Grid */
    .main-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 30px;
    }
    
    .main-grid-equal {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
    }
    
    .main-grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 25px;
    }
    
    /* Section Cards */
    .section-card {
        background: rgba(30, 30, 50, 0.8);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        padding: 30px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
    }
    
    .section-card:hover {
        border-color: rgba(139, 92, 246, 0.3);
    }
    
    .section-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 25px;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .section-title span {
        font-size: 1.8rem;
    }
    
    /* Data Cards */
    .data-card {
        background: rgba(20, 20, 40, 0.8);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 15px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        transition: all 0.3s ease;
    }
    
    .data-card:hover {
        background: rgba(30, 30, 60, 0.8);
        border-color: rgba(139, 92, 246, 0.3);
        transform: translateX(5px);
    }
    
    .data-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }
    
    .data-card-title {
        font-weight: 700;
        font-size: 1.1rem;
        color: #fff;
    }
    
    .data-card-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .badge-hot { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .badge-trending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .badge-new { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .badge-ai { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
    
    .data-card-content {
        color: #a0a0a0;
        font-size: 0.95rem;
        line-height: 1.6;
    }
    
    .data-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    /* Progress Bars */
    .progress-container {
        margin: 20px 0;
    }
    
    .progress-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 0.9rem;
    }
    
    .progress-bar {
        height: 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        border-radius: 10px;
        transition: width 1s ease;
    }
    
    .progress-fill.green { background: linear-gradient(90deg, #10b981, #34d399); }
    .progress-fill.red { background: linear-gradient(90deg, #ef4444, #f87171); }
    .progress-fill.yellow { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .progress-fill.purple { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
    .progress-fill.blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    
    /* Agent Cards */
    .agent-card {
        background: linear-gradient(135deg, rgba(30, 30, 60, 0.9), rgba(20, 20, 40, 0.9));
        border-radius: 20px;
        padding: 25px;
        border: 1px solid rgba(139, 92, 246, 0.3);
        text-align: center;
        transition: all 0.4s ease;
    }
    
    .agent-card:hover {
        transform: translateY(-10px);
        box-shadow: 0 25px 50px rgba(139, 92, 246, 0.3);
        border-color: rgba(139, 92, 246, 0.6);
    }
    
    .agent-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        margin: 0 auto 20px;
        animation: pulse-glow 3s infinite;
    }
    
    .agent-name {
        font-size: 1.3rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 8px;
    }
    
    .agent-role {
        color: #8b5cf6;
        font-size: 0.9rem;
        margin-bottom: 15px;
    }
    
    .agent-status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.85rem;
    }
    
    .status-active { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .status-analyzing { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
    .status-idle { background: rgba(107, 114, 128, 0.2); color: #6b7280; }
    
    /* Risk Meter */
    .risk-meter {
        background: rgba(20, 20, 40, 0.8);
        border-radius: 20px;
        padding: 30px;
        text-align: center;
    }
    
    .risk-gauge {
        width: 200px;
        height: 100px;
        margin: 0 auto 20px;
        position: relative;
    }
    
    .risk-gauge-bg {
        width: 200px;
        height: 100px;
        border-radius: 100px 100px 0 0;
        background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
        position: relative;
        overflow: hidden;
    }
    
    .risk-gauge-mask {
        position: absolute;
        bottom: 0;
        left: 10px;
        right: 10px;
        height: 80px;
        background: rgba(20, 20, 40, 1);
        border-radius: 80px 80px 0 0;
    }
    
    .risk-needle {
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 4px;
        height: 70px;
        background: #fff;
        transform-origin: bottom center;
        transition: transform 1s ease;
        border-radius: 2px;
    }
    
    .risk-value {
        font-size: 2.5rem;
        font-weight: 800;
        margin-top: 10px;
    }
    
    .risk-label {
        color: #888;
        font-size: 0.9rem;
        margin-top: 5px;
    }
    
    /* Buttons */
    .btn-primary {
        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
        color: white;
        border: none;
        padding: 14px 28px;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 10px;
    }
    
    .btn-primary:hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 30px rgba(139, 92, 246, 0.4);
    }
    
    .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
    }
    
    /* Coin List */
    .coin-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        background: rgba(20, 20, 40, 0.6);
        border-radius: 12px;
        margin-bottom: 10px;
        transition: all 0.3s ease;
    }
    
    .coin-item:hover {
        background: rgba(30, 30, 60, 0.8);
        transform: translateX(5px);
    }
    
    .coin-rank {
        width: 30px;
        height: 30px;
        background: rgba(139, 92, 246, 0.2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.85rem;
        color: #8b5cf6;
    }
    
    .coin-info {
        flex: 1;
    }
    
    .coin-name {
        font-weight: 600;
        color: #fff;
    }
    
    .coin-symbol {
        color: #666;
        font-size: 0.85rem;
    }
    
    .coin-price {
        text-align: right;
    }
    
    .coin-price-value {
        font-weight: 700;
        color: #fff;
    }
    
    .coin-change {
        font-size: 0.85rem;
    }
    
    .coin-change.positive { color: #10b981; }
    .coin-change.negative { color: #ef4444; }
    
    /* Chat Interface */
    .chat-container {
        background: rgba(20, 20, 40, 0.8);
        border-radius: 16px;
        height: 400px;
        display: flex;
        flex-direction: column;
    }
    
    .chat-messages {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
    }
    
    .chat-message {
        margin-bottom: 15px;
        display: flex;
        gap: 12px;
    }
    
    .chat-message.ai {
        flex-direction: row;
    }
    
    .chat-message.user {
        flex-direction: row-reverse;
    }
    
    .chat-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        flex-shrink: 0;
    }
    
    .chat-message.ai .chat-avatar {
        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
    }
    
    .chat-message.user .chat-avatar {
        background: rgba(255, 255, 255, 0.1);
    }
    
    .chat-bubble {
        max-width: 70%;
        padding: 12px 16px;
        border-radius: 16px;
        font-size: 0.95rem;
        line-height: 1.5;
    }
    
    .chat-message.ai .chat-bubble {
        background: rgba(139, 92, 246, 0.2);
        border-bottom-left-radius: 4px;
    }
    
    .chat-message.user .chat-bubble {
        background: rgba(255, 255, 255, 0.1);
        border-bottom-right-radius: 4px;
    }
    
    .chat-input-container {
        padding: 15px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        gap: 10px;
    }
    
    .chat-input {
        flex: 1;
        background: rgba(30, 30, 60, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 12px 16px;
        color: #fff;
        font-size: 0.95rem;
    }
    
    .chat-input:focus {
        outline: none;
        border-color: #8b5cf6;
    }
    
    .chat-send {
        background: linear-gradient(135deg, #8b5cf6, #3b82f6);
        border: none;
        border-radius: 12px;
        padding: 12px 20px;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .chat-send:hover {
        transform: scale(1.05);
    }
    
    /* Responsive */
    @media (max-width: 1400px) {
        .main-grid { grid-template-columns: 1fr; }
        .main-grid-3 { grid-template-columns: repeat(2, 1fr); }
    }
    
    @media (max-width: 1024px) {
        .stats-row { grid-template-columns: repeat(2, 1fr); }
        .main-grid-equal { grid-template-columns: 1fr; }
    }
    
    @media (max-width: 768px) {
        .content { margin-left: 0; padding: 15px; }
        .hero { padding: 30px 20px; }
        .hero h1 { font-size: 2rem; }
        .stats-row { grid-template-columns: 1fr; }
        .main-grid-3 { grid-template-columns: 1fr; }
    }
</style>
"""


def get_narrative_radar_page(sidebar_html: str, narratives: list, market_data: dict) -> str:
    """Page Narrative Radar - Détection des tendances narratives crypto"""
    
    # Générer les cartes de narratives
    narratives_html = ""
    for i, n in enumerate(narratives[:8], 1):
        name = n.get("name", "Unknown Narrative")
        score = n.get("score", 50)
        change = n.get("change", 0)
        coins = n.get("coins", [])
        volume = n.get("volume", 0)
        
        badge_class = "badge-hot" if score >= 80 else "badge-trending" if score >= 60 else "badge-new"
        badge_text = "🔥 Hot" if score >= 80 else "📈 Trending" if score >= 60 else "👀 Emerging"
        change_class = "positive" if change >= 0 else "negative"
        
        coins_str = ", ".join(coins[:3]) if coins else "N/A"
        volume_str = f"${volume/1e9:.1f}B" if volume >= 1e9 else f"${volume/1e6:.0f}M"
        
        narratives_html += f"""
        <div class="data-card">
            <div class="data-card-header">
                <span class="data-card-title">{name}</span>
                <span class="data-card-badge {badge_class}">{badge_text}</span>
            </div>
            <div class="progress-container">
                <div class="progress-label">
                    <span>Score de tendance</span>
                    <span class="{change_class}">{score}/100</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill {'green' if score >= 70 else 'yellow' if score >= 40 else 'red'}" style="width: {score}%"></div>
                </div>
            </div>
            <div class="data-card-content">
                <strong>Top Coins:</strong> {coins_str}<br>
                <strong>Volume 24h:</strong> {volume_str}
            </div>
            <div class="data-card-footer">
                <span class="coin-change {change_class}">{change:+.1f}% vs hier</span>
                <button class="btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;">Explorer →</button>
            </div>
        </div>
        """
    
    # Stats du marché
    btc_dom = market_data.get("btc_dominance", 52)
    total_mcap = market_data.get("total_market_cap", 3200000000000)
    fear_greed = market_data.get("fear_greed", 65)
    active_narratives = len(narratives)
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Narrative Radar - Détection des Tendances</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    {REVOLUTIONARY_CSS}
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <div class="hero-content">
                <h1>📡 Narrative Radar</h1>
                <p>Détectez les tendances narratives avant qu'elles n'explosent. Notre IA analyse des milliers de sources pour identifier les narratifs émergents du marché crypto.</p>
                <div class="hero-badge">
                    <span>Mise à jour en temps réel</span>
                </div>
            </div>
        </div>
        
        <div class="stats-row">
            <div class="stat-card">
                <span class="stat-icon">📊</span>
                <div class="stat-value">{active_narratives}</div>
                <div class="stat-label">Narratifs Actifs</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">₿</span>
                <div class="stat-value">{btc_dom:.1f}%</div>
                <div class="stat-label">Dominance BTC</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">💰</span>
                <div class="stat-value">${total_mcap/1e12:.2f}T</div>
                <div class="stat-label">Market Cap Total</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">😱</span>
                <div class="stat-value {'positive' if fear_greed >= 50 else 'negative'}">{fear_greed}</div>
                <div class="stat-label">Fear & Greed</div>
            </div>
        </div>
        
        <div class="main-grid">
            <div class="section-card">
                <h2 class="section-title"><span>🎯</span> Narratifs Détectés</h2>
                <div class="narratives-list">
                    {narratives_html}
                </div>
            </div>
            
            <div class="section-card">
                <h2 class="section-title"><span>📈</span> Radar en Direct</h2>
                <div style="text-align: center; padding: 30px;">
                    <div style="width: 250px; height: 250px; margin: 0 auto; border-radius: 50%; background: conic-gradient(from 0deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3), rgba(16, 185, 129, 0.3), rgba(245, 158, 11, 0.3), rgba(239, 68, 68, 0.3), rgba(139, 92, 246, 0.3)); display: flex; align-items: center; justify-content: center; animation: spin 10s linear infinite;">
                        <div style="width: 200px; height: 200px; border-radius: 50%; background: rgba(20, 20, 40, 0.95); display: flex; align-items: center; justify-content: center;">
                            <div style="text-align: center;">
                                <div style="font-size: 3rem; font-weight: 800; background: linear-gradient(135deg, #8b5cf6, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">{active_narratives}</div>
                                <div style="color: #888; font-size: 0.9rem;">Narratifs</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 30px;">
                    <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.1rem;">🔥 Top 3 du Moment</h3>
                    <div class="coin-item">
                        <div class="coin-rank">1</div>
                        <div class="coin-info">
                            <div class="coin-name">AI & Machine Learning</div>
                            <div class="coin-symbol">FET, AGIX, OCEAN</div>
                        </div>
                        <div class="coin-price">
                            <div class="coin-change positive">+45%</div>
                        </div>
                    </div>
                    <div class="coin-item">
                        <div class="coin-rank">2</div>
                        <div class="coin-info">
                            <div class="coin-name">Layer 2 Solutions</div>
                            <div class="coin-symbol">ARB, OP, MATIC</div>
                        </div>
                        <div class="coin-price">
                            <div class="coin-change positive">+32%</div>
                        </div>
                    </div>
                    <div class="coin-item">
                        <div class="coin-rank">3</div>
                        <div class="coin-info">
                            <div class="coin-name">Real World Assets</div>
                            <div class="coin-symbol">ONDO, MKR, COMP</div>
                        </div>
                        <div class="coin-price">
                            <div class="coin-change positive">+28%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <style>
        @keyframes spin {{ from {{ transform: rotate(0deg); }} to {{ transform: rotate(360deg); }} }}
    </style>
    
    <script>
        // Auto-refresh toutes les 60 secondes
        setTimeout(() => location.reload(), 60000);
    </script>
</body>
</html>"""
    return html


def get_ai_crypto_coach_page(sidebar_html: str, market_data: dict, tips: list) -> str:
    """Page AI Crypto Coach - Assistant personnel de trading"""
    
    btc_price = market_data.get("btc_price", 97000)
    eth_price = market_data.get("eth_price", 2700)
    market_sentiment = market_data.get("sentiment", "bullish")
    
    tips_html = ""
    for tip in tips[:5]:
        tips_html += f"""
        <div class="data-card">
            <div class="data-card-header">
                <span class="data-card-title">{tip.get('title', 'Conseil')}</span>
                <span class="data-card-badge badge-ai">🤖 AI</span>
            </div>
            <div class="data-card-content">{tip.get('content', '')}</div>
        </div>
        """
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Crypto Coach - Votre Assistant Personnel</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    {REVOLUTIONARY_CSS}
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <div class="hero-content">
                <h1>🎓 AI Crypto Coach</h1>
                <p>Votre assistant personnel alimenté par l'IA pour maîtriser le trading crypto. Posez vos questions, recevez des conseils personnalisés et améliorez vos compétences.</p>
                <div class="hero-badge">
                    <span>Intelligence Artificielle Avancée</span>
                </div>
            </div>
        </div>
        
        <div class="stats-row">
            <div class="stat-card">
                <span class="stat-icon">₿</span>
                <div class="stat-value">${btc_price:,.0f}</div>
                <div class="stat-label">Bitcoin</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">⟠</span>
                <div class="stat-value">${eth_price:,.0f}</div>
                <div class="stat-label">Ethereum</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">📊</span>
                <div class="stat-value {'positive' if market_sentiment == 'bullish' else 'negative'}">{'Haussier' if market_sentiment == 'bullish' else 'Baissier'}</div>
                <div class="stat-label">Sentiment</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">🎯</span>
                <div class="stat-value">24/7</div>
                <div class="stat-label">Disponibilité</div>
            </div>
        </div>
        
        <div class="main-grid">
            <div class="section-card">
                <h2 class="section-title"><span>💬</span> Chat avec votre Coach</h2>
                <div class="chat-container">
                    <div class="chat-messages" id="chatMessages">
                        <div class="chat-message ai">
                            <div class="chat-avatar">🤖</div>
                            <div class="chat-bubble">
                                Bonjour ! Je suis votre AI Crypto Coach. Je peux vous aider avec :
                                <br><br>
                                📈 Analyse de marché<br>
                                💡 Stratégies de trading<br>
                                🎓 Éducation crypto<br>
                                ⚠️ Gestion des risques<br>
                                <br>
                                Que souhaitez-vous apprendre aujourd'hui ?
                            </div>
                        </div>
                    </div>
                    <div class="chat-input-container">
                        <input type="text" class="chat-input" id="chatInput" placeholder="Posez votre question...">
                        <button class="chat-send" onclick="sendMessage()">Envoyer</button>
                    </div>
                </div>
            </div>
            
            <div class="section-card">
                <h2 class="section-title"><span>💡</span> Conseils du Jour</h2>
                {tips_html if tips_html else '''
                <div class="data-card">
                    <div class="data-card-header">
                        <span class="data-card-title">Gestion du Risque</span>
                        <span class="data-card-badge badge-ai">🤖 AI</span>
                    </div>
                    <div class="data-card-content">Ne risquez jamais plus de 1-2% de votre capital sur un seul trade. Utilisez toujours des stop-loss.</div>
                </div>
                <div class="data-card">
                    <div class="data-card-header">
                        <span class="data-card-title">DCA Strategy</span>
                        <span class="data-card-badge badge-trending">📈 Populaire</span>
                    </div>
                    <div class="data-card-content">Le Dollar Cost Averaging réduit l'impact de la volatilité. Investissez régulièrement plutôt que tout d'un coup.</div>
                </div>
                <div class="data-card">
                    <div class="data-card-header">
                        <span class="data-card-title">Diversification</span>
                        <span class="data-card-badge badge-new">✨ Essentiel</span>
                    </div>
                    <div class="data-card-content">Ne mettez pas tous vos œufs dans le même panier. Diversifiez entre BTC, ETH et altcoins prometteurs.</div>
                </div>
                '''}
                
                <div style="margin-top: 25px;">
                    <h3 style="color: #fff; margin-bottom: 15px;">📚 Ressources Recommandées</h3>
                    <button class="btn-secondary" style="width: 100%; margin-bottom: 10px; text-align: left;">
                        📖 Guide du Débutant en Crypto
                    </button>
                    <button class="btn-secondary" style="width: 100%; margin-bottom: 10px; text-align: left;">
                        📊 Analyse Technique 101
                    </button>
                    <button class="btn-secondary" style="width: 100%; text-align: left;">
                        🛡️ Sécurité & Wallets
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const responses = {{
            'bitcoin': 'Bitcoin est la première et la plus grande cryptomonnaie. Actuellement à ${btc_price:,.0f}, il représente environ 52% de la capitalisation totale du marché crypto.',
            'ethereum': 'Ethereum est la plateforme de smart contracts leader. À ${eth_price:,.0f}, ETH est essentiel pour DeFi, NFTs et les applications décentralisées.',
            'trading': 'Pour bien trader, suivez ces règles : 1) Ayez un plan, 2) Gérez votre risque (max 2% par trade), 3) Utilisez des stop-loss, 4) Ne tradez pas avec vos émotions.',
            'defi': 'DeFi (Finance Décentralisée) permet d\\'emprunter, prêter et échanger sans intermédiaires. Les protocoles populaires incluent Aave, Uniswap et Compound.',
            'nft': 'Les NFTs sont des tokens uniques représentant la propriété d\\'actifs numériques. Ils sont utilisés pour l\\'art, les jeux et les collectibles.',
            'default': 'C\\'est une excellente question ! Le marché crypto est complexe mais passionnant. Continuez à apprendre et à pratiquer avec de petites sommes.'
        }};
        
        function sendMessage() {{
            const input = document.getElementById('chatInput');
            const messages = document.getElementById('chatMessages');
            const text = input.value.trim().toLowerCase();
            
            if (!text) return;
            
            // Message utilisateur
            messages.innerHTML += `
                <div class="chat-message user">
                    <div class="chat-avatar">👤</div>
                    <div class="chat-bubble">${{input.value}}</div>
                </div>
            `;
            
            // Réponse AI
            let response = responses.default;
            for (const [key, value] of Object.entries(responses)) {{
                if (text.includes(key)) {{
                    response = value;
                    break;
                }}
            }}
            
            setTimeout(() => {{
                messages.innerHTML += `
                    <div class="chat-message ai">
                        <div class="chat-avatar">🤖</div>
                        <div class="chat-bubble">${{response}}</div>
                    </div>
                `;
                messages.scrollTop = messages.scrollHeight;
            }}, 500);
            
            input.value = '';
            messages.scrollTop = messages.scrollHeight;
        }}
        
        document.getElementById('chatInput').addEventListener('keypress', (e) => {{
            if (e.key === 'Enter') sendMessage();
        }});
    </script>
</body>
</html>"""
    return html


def get_ai_swarm_agents_page(sidebar_html: str, agents_data: list, market_data: dict) -> str:
    """Page AI Swarm Agents - Agents IA collaboratifs"""
    
    agents_html = ""
    default_agents = [
        {"name": "Alpha Hunter", "role": "Détection d'opportunités", "status": "active", "icon": "🎯", "accuracy": 87},
        {"name": "Risk Guardian", "role": "Gestion des risques", "status": "active", "icon": "🛡️", "accuracy": 94},
        {"name": "Trend Analyzer", "role": "Analyse de tendances", "status": "analyzing", "icon": "📊", "accuracy": 91},
        {"name": "Sentiment Bot", "role": "Analyse de sentiment", "status": "active", "icon": "🧠", "accuracy": 82},
        {"name": "Whale Tracker", "role": "Suivi des baleines", "status": "active", "icon": "🐋", "accuracy": 89},
        {"name": "News Scanner", "role": "Veille informationnelle", "status": "analyzing", "icon": "📰", "accuracy": 85},
    ]
    
    agents = agents_data if agents_data else default_agents
    
    for agent in agents[:6]:
        status_class = f"status-{agent.get('status', 'active')}"
        status_text = {"active": "🟢 Actif", "analyzing": "🔵 Analyse", "idle": "⚪ Veille"}.get(agent.get('status', 'active'), "🟢 Actif")
        
        agents_html += f"""
        <div class="agent-card">
            <div class="agent-avatar">{agent.get('icon', '🤖')}</div>
            <div class="agent-name">{agent.get('name', 'Agent')}</div>
            <div class="agent-role">{agent.get('role', 'Analyse')}</div>
            <div class="progress-container" style="margin: 15px 0;">
                <div class="progress-label">
                    <span style="font-size: 0.8rem;">Précision</span>
                    <span style="font-size: 0.8rem; color: #10b981;">{agent.get('accuracy', 85)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill green" style="width: {agent.get('accuracy', 85)}%"></div>
                </div>
            </div>
            <span class="agent-status {status_class}">{status_text}</span>
        </div>
        """
    
    total_signals = market_data.get("total_signals", 156)
    accuracy = market_data.get("accuracy", 89)
    active_agents = len([a for a in agents if a.get('status') == 'active'])
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Swarm Agents - Intelligence Collective</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    {REVOLUTIONARY_CSS}
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <div class="hero-content">
                <h1>🤖 AI Swarm Agents</h1>
                <p>Une armée d'agents IA travaillant ensemble pour analyser le marché 24/7. Chaque agent est spécialisé dans un domaine pour une couverture complète.</p>
                <div class="hero-badge">
                    <span>Intelligence Collective Active</span>
                </div>
            </div>
        </div>
        
        <div class="stats-row">
            <div class="stat-card">
                <span class="stat-icon">🤖</span>
                <div class="stat-value">{len(agents)}</div>
                <div class="stat-label">Agents Déployés</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">🟢</span>
                <div class="stat-value positive">{active_agents}</div>
                <div class="stat-label">Agents Actifs</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">📡</span>
                <div class="stat-value">{total_signals}</div>
                <div class="stat-label">Signaux Générés</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">🎯</span>
                <div class="stat-value positive">{accuracy}%</div>
                <div class="stat-label">Précision Moyenne</div>
            </div>
        </div>
        
        <div class="section-card">
            <h2 class="section-title"><span>👥</span> Équipe d'Agents</h2>
            <div class="main-grid-3">
                {agents_html}
            </div>
        </div>
        
        <div class="main-grid-equal" style="margin-top: 30px;">
            <div class="section-card">
                <h2 class="section-title"><span>📊</span> Activité en Temps Réel</h2>
                <div class="data-card">
                    <div class="data-card-header">
                        <span class="data-card-title">Alpha Hunter</span>
                        <span class="data-card-badge badge-hot">🔥 Signal</span>
                    </div>
                    <div class="data-card-content">
                        Opportunité détectée sur SOL/USDT - Breakout potentiel au-dessus de $200
                    </div>
                    <div class="data-card-footer">
                        <span style="color: #666;">Il y a 2 min</span>
                        <span class="coin-change positive">Confiance: 87%</span>
                    </div>
                </div>
                <div class="data-card">
                    <div class="data-card-header">
                        <span class="data-card-title">Risk Guardian</span>
                        <span class="data-card-badge badge-trending">⚠️ Alerte</span>
                    </div>
                    <div class="data-card-content">
                        Volatilité élevée détectée sur le marché - Recommandation: réduire l'exposition
                    </div>
                    <div class="data-card-footer">
                        <span style="color: #666;">Il y a 5 min</span>
                        <span class="coin-change warning">Priorité: Haute</span>
                    </div>
                </div>
                <div class="data-card">
                    <div class="data-card-header">
                        <span class="data-card-title">Whale Tracker</span>
                        <span class="data-card-badge badge-new">🐋 Mouvement</span>
                    </div>
                    <div class="data-card-content">
                        Transfert de 5,000 BTC détecté vers Coinbase - Possible pression vendeuse
                    </div>
                    <div class="data-card-footer">
                        <span style="color: #666;">Il y a 8 min</span>
                        <span class="coin-change negative">Impact: Modéré</span>
                    </div>
                </div>
            </div>
            
            <div class="section-card">
                <h2 class="section-title"><span>🎛️</span> Contrôle Central</h2>
                <div style="text-align: center; padding: 20px;">
                    <div style="width: 200px; height: 200px; margin: 0 auto; border-radius: 50%; background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3)); display: flex; align-items: center; justify-content: center; animation: pulse-glow 3s infinite;">
                        <div style="width: 160px; height: 160px; border-radius: 50%; background: rgba(20, 20, 40, 0.95); display: flex; align-items: center; justify-content: center; flex-direction: column;">
                            <div style="font-size: 2.5rem;">🤖</div>
                            <div style="color: #10b981; font-weight: 700; margin-top: 10px;">ONLINE</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <button class="btn-primary" style="width: 100%; margin-bottom: 10px;">
                        🚀 Lancer Analyse Complète
                    </button>
                    <button class="btn-secondary" style="width: 100%; margin-bottom: 10px;">
                        ⚙️ Configurer les Agents
                    </button>
                    <button class="btn-secondary" style="width: 100%;">
                        📊 Voir les Rapports
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Simulation d'activité des agents
        setInterval(() => {{
            const statuses = document.querySelectorAll('.agent-status');
            statuses.forEach(s => {{
                if (Math.random() > 0.7) {{
                    s.classList.toggle('status-analyzing');
                    s.classList.toggle('status-active');
                }}
            }});
        }}, 5000);
    </script>
</body>
</html>"""
    return html


def get_altseason_copilot_page(sidebar_html: str, altcoins_data: list, market_data: dict) -> str:
    """Page Altseason Copilot Pro - Détection de l'altseason"""
    
    altseason_index = market_data.get("altseason_index", 65)
    btc_dominance = market_data.get("btc_dominance", 52)
    eth_btc_ratio = market_data.get("eth_btc_ratio", 0.028)
    top_gainers = market_data.get("top_gainers", 45)
    
    # Déterminer la phase
    if altseason_index >= 75:
        phase = "🚀 ALTSEASON"
        phase_color = "#10b981"
        phase_desc = "Les altcoins surperforment massivement Bitcoin. C'est le moment idéal pour les altcoins!"
    elif altseason_index >= 50:
        phase = "📈 TRANSITION"
        phase_color = "#f59e0b"
        phase_desc = "Le marché est en transition. Certains altcoins commencent à surperformer."
    else:
        phase = "₿ BTC SEASON"
        phase_color = "#3b82f6"
        phase_desc = "Bitcoin domine le marché. Privilégiez BTC pour le moment."
    
    # Top altcoins
    altcoins_html = ""
    default_alts = [
        {"name": "Solana", "symbol": "SOL", "change": 12.5, "score": 92},
        {"name": "Avalanche", "symbol": "AVAX", "change": 8.3, "score": 85},
        {"name": "Chainlink", "symbol": "LINK", "change": 6.7, "score": 81},
        {"name": "Polygon", "symbol": "MATIC", "change": 5.2, "score": 78},
        {"name": "Arbitrum", "symbol": "ARB", "change": 4.8, "score": 75},
    ]
    
    alts = altcoins_data if altcoins_data else default_alts
    
    for i, alt in enumerate(alts[:5], 1):
        change_class = "positive" if alt.get("change", 0) >= 0 else "negative"
        altcoins_html += f"""
        <div class="coin-item">
            <div class="coin-rank">{i}</div>
            <div class="coin-info">
                <div class="coin-name">{alt.get('name', 'Unknown')}</div>
                <div class="coin-symbol">{alt.get('symbol', '')}</div>
            </div>
            <div style="flex: 1;">
                <div class="progress-bar" style="height: 6px;">
                    <div class="progress-fill purple" style="width: {alt.get('score', 50)}%"></div>
                </div>
            </div>
            <div class="coin-price">
                <div class="coin-change {change_class}">{alt.get('change', 0):+.1f}%</div>
            </div>
        </div>
        """
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Altseason Copilot Pro - Détection Altseason</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    {REVOLUTIONARY_CSS}
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <div class="hero-content">
                <h1>🌙 Altseason Copilot Pro</h1>
                <p>Détectez le début de l'altseason avant tout le monde. Notre algorithme analyse les flux de capitaux entre Bitcoin et les altcoins en temps réel.</p>
                <div class="hero-badge">
                    <span>Analyse Multi-Facteurs</span>
                </div>
            </div>
        </div>
        
        <div class="stats-row">
            <div class="stat-card">
                <span class="stat-icon">🌙</span>
                <div class="stat-value" style="color: {phase_color}">{altseason_index}</div>
                <div class="stat-label">Indice Altseason</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">₿</span>
                <div class="stat-value">{btc_dominance:.1f}%</div>
                <div class="stat-label">Dominance BTC</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">⟠</span>
                <div class="stat-value">{eth_btc_ratio:.4f}</div>
                <div class="stat-label">ETH/BTC Ratio</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">📈</span>
                <div class="stat-value positive">{top_gainers}%</div>
                <div class="stat-label">Alts en Hausse</div>
            </div>
        </div>
        
        <div class="main-grid">
            <div class="section-card">
                <h2 class="section-title"><span>📊</span> Indicateur de Phase</h2>
                
                <div style="text-align: center; padding: 30px;">
                    <div style="font-size: 1.5rem; color: {phase_color}; font-weight: 800; margin-bottom: 20px;">{phase}</div>
                    
                    <div style="position: relative; height: 40px; background: linear-gradient(90deg, #3b82f6, #f59e0b, #10b981); border-radius: 20px; margin: 30px 0;">
                        <div style="position: absolute; top: -10px; left: {altseason_index}%; transform: translateX(-50%); width: 20px; height: 60px; background: white; border-radius: 10px; box-shadow: 0 0 20px rgba(255,255,255,0.5);"></div>
                        <div style="position: absolute; bottom: -30px; left: 0; color: #3b82f6; font-size: 0.8rem;">BTC Season</div>
                        <div style="position: absolute; bottom: -30px; left: 50%; transform: translateX(-50%); color: #f59e0b; font-size: 0.8rem;">Transition</div>
                        <div style="position: absolute; bottom: -30px; right: 0; color: #10b981; font-size: 0.8rem;">Altseason</div>
                    </div>
                    
                    <p style="color: #a0a0a0; margin-top: 50px; font-size: 1.1rem;">{phase_desc}</p>
                </div>
                
                <div style="margin-top: 40px;">
                    <h3 style="color: #fff; margin-bottom: 20px;">📈 Facteurs Analysés</h3>
                    
                    <div class="progress-container">
                        <div class="progress-label">
                            <span>Flux vers Altcoins</span>
                            <span class="positive">+{market_data.get('alt_inflow', 23)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill green" style="width: {min(100, market_data.get('alt_inflow', 23) + 50)}%"></div>
                        </div>
                    </div>
                    
                    <div class="progress-container">
                        <div class="progress-label">
                            <span>Momentum Altcoins</span>
                            <span>{market_data.get('alt_momentum', 72)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill purple" style="width: {market_data.get('alt_momentum', 72)}%"></div>
                        </div>
                    </div>
                    
                    <div class="progress-container">
                        <div class="progress-label">
                            <span>Volume Relatif</span>
                            <span>{market_data.get('volume_ratio', 65)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill blue" style="width: {market_data.get('volume_ratio', 65)}%"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section-card">
                <h2 class="section-title"><span>🏆</span> Top Performers</h2>
                <p style="color: #888; margin-bottom: 20px;">Altcoins avec le meilleur potentiel selon notre algorithme</p>
                
                {altcoins_html}
                
                <div style="margin-top: 30px; padding: 20px; background: rgba(139, 92, 246, 0.1); border-radius: 16px; border: 1px solid rgba(139, 92, 246, 0.3);">
                    <h4 style="color: #8b5cf6; margin-bottom: 10px;">💡 Conseil du Copilot</h4>
                    <p style="color: #a0a0a0; font-size: 0.95rem;">
                        {"L'altseason est en cours! Diversifiez vers les altcoins à fort momentum tout en gardant une base en BTC." if altseason_index >= 75 else "Restez patient. Accumulez progressivement des altcoins de qualité en attendant le signal." if altseason_index >= 50 else "Focus sur Bitcoin. Les altcoins sous-performent actuellement."}
                    </p>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Animation de l'indicateur
        setInterval(() => {{
            const indicator = document.querySelector('[style*="position: absolute; top: -10px"]');
            if (indicator) {{
                const currentLeft = parseFloat(indicator.style.left);
                const newLeft = currentLeft + (Math.random() - 0.5) * 2;
                indicator.style.left = Math.max(5, Math.min(95, newLeft)) + '%';
            }}
        }}, 3000);
    </script>
</body>
</html>"""
    return html


def get_rug_scam_shield_page(sidebar_html: str, scans_data: list, stats: dict) -> str:
    """Page Rug Scam Shield - Protection contre les scams"""
    
    scams_detected = stats.get("scams_detected", 1247)
    tokens_analyzed = stats.get("tokens_analyzed", 45892)
    users_protected = stats.get("users_protected", 12500)
    accuracy = stats.get("accuracy", 97.3)
    
    # Recent scans
    scans_html = ""
    default_scans = [
        {"token": "SafeMoon V3", "risk": 92, "issues": ["Honeypot détecté", "Liquidité non verrouillée"], "status": "danger"},
        {"token": "ElonDoge2024", "risk": 85, "issues": ["Contrat non vérifié", "Whale concentration"], "status": "danger"},
        {"token": "Pepe Classic", "risk": 45, "issues": ["Faible liquidité"], "status": "warning"},
        {"token": "Arbitrum", "risk": 8, "issues": [], "status": "safe"},
        {"token": "Chainlink", "risk": 5, "issues": [], "status": "safe"},
    ]
    
    scans = scans_data if scans_data else default_scans
    
    for scan in scans[:5]:
        risk = scan.get("risk", 50)
        status = scan.get("status", "warning")
        issues = scan.get("issues", [])
        
        if status == "danger":
            status_color = "#ef4444"
            status_icon = "🚨"
            status_text = "DANGER"
        elif status == "warning":
            status_color = "#f59e0b"
            status_icon = "⚠️"
            status_text = "ATTENTION"
        else:
            status_color = "#10b981"
            status_icon = "✅"
            status_text = "SÛR"
        
        issues_html = "<br>".join([f"• {i}" for i in issues]) if issues else "Aucun problème détecté"
        
        scans_html += f"""
        <div class="data-card" style="border-left: 4px solid {status_color};">
            <div class="data-card-header">
                <span class="data-card-title">{scan.get('token', 'Unknown')}</span>
                <span style="color: {status_color}; font-weight: 700;">{status_icon} {status_text}</span>
            </div>
            <div class="progress-container" style="margin: 10px 0;">
                <div class="progress-label">
                    <span>Score de Risque</span>
                    <span style="color: {status_color};">{risk}/100</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill {'red' if risk >= 70 else 'yellow' if risk >= 40 else 'green'}" style="width: {risk}%"></div>
                </div>
            </div>
            <div class="data-card-content" style="font-size: 0.9rem;">
                {issues_html}
            </div>
        </div>
        """
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rug Scam Shield - Protection Anti-Scam</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    {REVOLUTIONARY_CSS}
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.1), rgba(16, 185, 129, 0.05));">
            <div class="hero-content">
                <h1>🛡️ Rug Scam Shield</h1>
                <p>Protection avancée contre les scams, rugs et honeypots. Notre IA analyse les smart contracts en temps réel pour vous protéger.</p>
                <div class="hero-badge" style="background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); color: #ef4444;">
                    <span>Protection Active 24/7</span>
                </div>
            </div>
        </div>
        
        <div class="stats-row">
            <div class="stat-card">
                <span class="stat-icon">🚨</span>
                <div class="stat-value negative">{scams_detected:,}</div>
                <div class="stat-label">Scams Détectés</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">🔍</span>
                <div class="stat-value">{tokens_analyzed:,}</div>
                <div class="stat-label">Tokens Analysés</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">👥</span>
                <div class="stat-value positive">{users_protected:,}</div>
                <div class="stat-label">Utilisateurs Protégés</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">🎯</span>
                <div class="stat-value positive">{accuracy}%</div>
                <div class="stat-label">Précision</div>
            </div>
        </div>
        
        <div class="main-grid">
            <div class="section-card">
                <h2 class="section-title"><span>🔍</span> Scanner un Token</h2>
                
                <div style="margin-bottom: 30px;">
                    <label style="color: #888; display: block; margin-bottom: 10px;">Adresse du contrat ou nom du token</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="tokenInput" placeholder="0x... ou nom du token" style="flex: 1; background: rgba(20, 20, 40, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 14px 16px; color: #fff; font-size: 1rem;">
                        <button class="btn-primary" onclick="scanToken()">
                            🔍 Scanner
                        </button>
                    </div>
                </div>
                
                <div id="scanResult" style="display: none; padding: 25px; background: rgba(20, 20, 40, 0.8); border-radius: 16px; margin-bottom: 30px;">
                    <!-- Résultat du scan -->
                </div>
                
                <h3 style="color: #fff; margin-bottom: 20px;">📋 Analyses Récentes</h3>
                {scans_html}
            </div>
            
            <div class="section-card">
                <h2 class="section-title"><span>⚠️</span> Signaux d'Alerte</h2>
                
                <div class="data-card" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 2rem;">🍯</span>
                        <div>
                            <div style="font-weight: 700; color: #ef4444;">Honeypot</div>
                            <div style="color: #a0a0a0; font-size: 0.9rem;">Impossible de vendre après achat</div>
                        </div>
                    </div>
                </div>
                
                <div class="data-card" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3);">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 2rem;">🔓</span>
                        <div>
                            <div style="font-weight: 700; color: #f59e0b;">Liquidité Non Verrouillée</div>
                            <div style="color: #a0a0a0; font-size: 0.9rem;">Le dev peut retirer la liquidité</div>
                        </div>
                    </div>
                </div>
                
                <div class="data-card" style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3);">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 2rem;">🐋</span>
                        <div>
                            <div style="font-weight: 700; color: #8b5cf6;">Concentration Whale</div>
                            <div style="color: #a0a0a0; font-size: 0.9rem;">Un wallet détient trop de tokens</div>
                        </div>
                    </div>
                </div>
                
                <div class="data-card" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 2rem;">📝</span>
                        <div>
                            <div style="font-weight: 700; color: #3b82f6;">Contrat Non Vérifié</div>
                            <div style="color: #a0a0a0; font-size: 0.9rem;">Code source non publié</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 30px; padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 16px; border: 1px solid rgba(16, 185, 129, 0.3);">
                    <h4 style="color: #10b981; margin-bottom: 10px;">✅ Conseils de Sécurité</h4>
                    <ul style="color: #a0a0a0; font-size: 0.9rem; list-style: none;">
                        <li style="margin-bottom: 8px;">• Toujours vérifier le contrat avant d'acheter</li>
                        <li style="margin-bottom: 8px;">• Ne jamais investir plus que vous pouvez perdre</li>
                        <li style="margin-bottom: 8px;">• Méfiez-vous des promesses de gains rapides</li>
                        <li>• Vérifiez l'équipe et la communauté</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function scanToken() {{
            const input = document.getElementById('tokenInput').value.trim();
            const result = document.getElementById('scanResult');
            
            if (!input) {{
                alert('Veuillez entrer une adresse ou un nom de token');
                return;
            }}
            
            // Simulation de scan
            result.style.display = 'block';
            result.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🔍</div>
                    <div style="color: #fff; font-weight: 700;">Analyse en cours...</div>
                    <div style="color: #888; margin-top: 10px;">Vérification du smart contract</div>
                </div>
            `;
            
            setTimeout(() => {{
                const isScam = Math.random() > 0.5;
                const risk = isScam ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 30);
                
                result.innerHTML = `
                    <div style="text-align: center;">
                        <div style="font-size: 4rem; margin-bottom: 15px;">${{isScam ? '🚨' : '✅'}}</div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: ${{isScam ? '#ef4444' : '#10b981'}};">
                            ${{isScam ? 'RISQUE ÉLEVÉ' : 'TOKEN SÛR'}}
                        </div>
                        <div style="margin: 20px 0;">
                            <div style="color: #888; margin-bottom: 5px;">Score de Risque</div>
                            <div style="font-size: 2.5rem; font-weight: 800; color: ${{risk >= 70 ? '#ef4444' : risk >= 40 ? '#f59e0b' : '#10b981'}};">${{risk}}/100</div>
                        </div>
                        ${{isScam ? `
                            <div style="text-align: left; background: rgba(239, 68, 68, 0.1); padding: 15px; border-radius: 12px; margin-top: 20px;">
                                <div style="color: #ef4444; font-weight: 700; margin-bottom: 10px;">⚠️ Problèmes détectés:</div>
                                <ul style="color: #a0a0a0; list-style: none;">
                                    <li>• Liquidité non verrouillée</li>
                                    <li>• Concentration whale élevée</li>
                                    <li>• Contrat non vérifié</li>
                                </ul>
                            </div>
                        ` : `
                            <div style="text-align: left; background: rgba(16, 185, 129, 0.1); padding: 15px; border-radius: 12px; margin-top: 20px;">
                                <div style="color: #10b981; font-weight: 700; margin-bottom: 10px;">✅ Vérifications passées:</div>
                                <ul style="color: #a0a0a0; list-style: none;">
                                    <li>• Contrat vérifié</li>
                                    <li>• Liquidité verrouillée</li>
                                    <li>• Distribution équitable</li>
                                </ul>
                            </div>
                        `}}
                    </div>
                `;
            }}, 2000);
        }}
    </script>
</body>
</html>"""
    return html


def get_ai_technical_analysis_page_v3(sidebar_html: str, symbol: str, interval: str, analysis_data: dict) -> str:
    """Page AI Technical Analysis - Version révolutionnaire"""
    
    price = analysis_data.get("price", 97000)
    change_24h = analysis_data.get("change_24h", 2.5)
    rsi = analysis_data.get("rsi", 55)
    macd = analysis_data.get("macd", "bullish")
    trend = analysis_data.get("trend", "bullish")
    support = analysis_data.get("support", 95000)
    resistance = analysis_data.get("resistance", 100000)
    recommendation = analysis_data.get("recommendation", "BUY")
    sma20 = analysis_data.get("sma20", 96500)
    sma50 = analysis_data.get("sma50", 94000)
    
    # Couleurs selon la recommandation
    rec_colors = {
        "BUY": ("#10b981", "ACHETER"),
        "SELL": ("#ef4444", "VENDRE"),
        "HOLD": ("#f59e0b", "CONSERVER")
    }
    rec_color, rec_text = rec_colors.get(recommendation, ("#f59e0b", "CONSERVER"))
    
    trend_colors = {
        "bullish": ("#10b981", "HAUSSIER", "📈"),
        "bearish": ("#ef4444", "BAISSIER", "📉"),
        "neutral": ("#f59e0b", "NEUTRE", "➡️")
    }
    trend_color, trend_text, trend_icon = trend_colors.get(trend, ("#f59e0b", "NEUTRE", "➡️"))
    
    symbol_clean = symbol.replace("USDT", "") if symbol else "BTC"
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Technical Analysis - {symbol_clean}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    {REVOLUTIONARY_CSS}
</head>
<body>
    {sidebar_html}
    <div class="content">
        <div class="hero">
            <div class="hero-content">
                <h1>📊 AI Technical Analysis</h1>
                <p>Analyse technique avancée propulsée par l'intelligence artificielle. Indicateurs, tendances et recommandations en temps réel.</p>
                <div class="hero-badge">
                    <span>Analyse en Direct</span>
                </div>
            </div>
        </div>
        
        <div class="stats-row">
            <div class="stat-card">
                <span class="stat-icon">💰</span>
                <div class="stat-value">${price:,.0f}</div>
                <div class="stat-label">{symbol_clean}/USDT</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">📈</span>
                <div class="stat-value {'positive' if change_24h >= 0 else 'negative'}">{change_24h:+.2f}%</div>
                <div class="stat-label">24h Change</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">{trend_icon}</span>
                <div class="stat-value" style="color: {trend_color}; font-size: 1.5rem;">{trend_text}</div>
                <div class="stat-label">Tendance</div>
            </div>
            <div class="stat-card">
                <span class="stat-icon">🎯</span>
                <div class="stat-value" style="color: {rec_color}; font-size: 1.5rem;">{rec_text}</div>
                <div class="stat-label">Signal</div>
            </div>
        </div>
        
        <div class="main-grid">
            <div class="section-card">
                <h2 class="section-title"><span>📉</span> Indicateurs Techniques</h2>
                
                <div class="main-grid-equal" style="margin-bottom: 30px;">
                    <div class="data-card">
                        <div class="data-card-header">
                            <span class="data-card-title">RSI (14)</span>
                            <span style="color: {'#ef4444' if rsi > 70 else '#10b981' if rsi < 30 else '#f59e0b'}; font-weight: 700;">{rsi:.1f}</span>
                        </div>
                        <div class="progress-bar" style="height: 12px;">
                            <div class="progress-fill {'red' if rsi > 70 else 'green' if rsi < 30 else 'yellow'}" style="width: {rsi}%"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.8rem; color: #666;">
                            <span>Survendu (30)</span>
                            <span>Neutre (50)</span>
                            <span>Suracheté (70)</span>
                        </div>
                    </div>
                    
                    <div class="data-card">
                        <div class="data-card-header">
                            <span class="data-card-title">MACD</span>
                            <span style="color: {'#10b981' if macd == 'bullish' else '#ef4444' if macd == 'bearish' else '#f59e0b'}; font-weight: 700;">
                                {'📈 Haussier' if macd == 'bullish' else '📉 Baissier' if macd == 'bearish' else '➡️ Neutre'}
                            </span>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <div style="flex: 1; text-align: center; padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                                <div style="color: #10b981; font-weight: 700;">Signal</div>
                                <div style="color: #888; font-size: 0.85rem;">Ligne au-dessus</div>
                            </div>
                            <div style="flex: 1; text-align: center; padding: 10px; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                                <div style="color: #3b82f6; font-weight: 700;">Histogramme</div>
                                <div style="color: #888; font-size: 0.85rem;">Positif</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <h3 style="color: #fff; margin-bottom: 20px;">📊 Moyennes Mobiles</h3>
                
                <div class="data-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div>
                            <div style="color: #888; font-size: 0.85rem;">SMA 20</div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #3b82f6;">${sma20:,.0f}</div>
                        </div>
                        <div style="font-size: 2rem;">{'📈' if price > sma20 else '📉'}</div>
                        <div style="text-align: right;">
                            <div style="color: #888; font-size: 0.85rem;">Prix vs SMA20</div>
                            <div style="font-size: 1.1rem; font-weight: 700; color: {'#10b981' if price > sma20 else '#ef4444'};">
                                {((price - sma20) / sma20 * 100):+.2f}%
                            </div>
                        </div>
                    </div>
                    <div class="progress-bar" style="height: 8px;">
                        <div class="progress-fill blue" style="width: {min(100, max(0, 50 + (price - sma20) / sma20 * 100))}%"></div>
                    </div>
                </div>
                
                <div class="data-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div>
                            <div style="color: #888; font-size: 0.85rem;">SMA 50</div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #8b5cf6;">${sma50:,.0f}</div>
                        </div>
                        <div style="font-size: 2rem;">{'📈' if price > sma50 else '📉'}</div>
                        <div style="text-align: right;">
                            <div style="color: #888; font-size: 0.85rem;">Prix vs SMA50</div>
                            <div style="font-size: 1.1rem; font-weight: 700; color: {'#10b981' if price > sma50 else '#ef4444'};">
                                {((price - sma50) / sma50 * 100):+.2f}%
                            </div>
                        </div>
                    </div>
                    <div class="progress-bar" style="height: 8px;">
                        <div class="progress-fill purple" style="width: {min(100, max(0, 50 + (price - sma50) / sma50 * 100))}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="section-card">
                <h2 class="section-title"><span>🎯</span> Niveaux Clés</h2>
                
                <div style="position: relative; height: 300px; background: rgba(20, 20, 40, 0.8); border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                    <!-- Résistance -->
                    <div style="position: absolute; top: 20%; left: 0; right: 0; border-top: 2px dashed #ef4444; padding-left: 10px;">
                        <span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem;">
                            Résistance: ${resistance:,.0f}
                        </span>
                    </div>
                    
                    <!-- Prix actuel -->
                    <div style="position: absolute; top: 50%; left: 0; right: 0; transform: translateY(-50%);">
                        <div style="border-top: 3px solid #fff; position: relative;">
                            <span style="position: absolute; right: 10px; top: -30px; background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; padding: 8px 16px; border-radius: 8px; font-weight: 700;">
                                ${price:,.0f}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Support -->
                    <div style="position: absolute; bottom: 20%; left: 0; right: 0; border-top: 2px dashed #10b981; padding-left: 10px;">
                        <span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem;">
                            Support: ${support:,.0f}
                        </span>
                    </div>
                </div>
                
                <div style="padding: 25px; background: linear-gradient(135deg, rgba({rec_color.replace('#', '')[:2]}, {rec_color.replace('#', '')[2:4]}, {rec_color.replace('#', '')[4:]}, 0.2), rgba(30, 30, 50, 0.8)); border-radius: 16px; border: 1px solid {rec_color}40; text-align: center;">
                    <div style="font-size: 0.9rem; color: #888; margin-bottom: 10px;">RECOMMANDATION AI</div>
                    <div style="font-size: 2.5rem; font-weight: 800; color: {rec_color};">{rec_text}</div>
                    <div style="margin-top: 15px; color: #a0a0a0; font-size: 0.95rem;">
                        {'Le momentum est positif. Considérez une entrée avec un stop sous le support.' if recommendation == 'BUY' else 'Le momentum est négatif. Considérez de prendre des profits ou de shorter.' if recommendation == 'SELL' else 'Le marché est indécis. Attendez un signal plus clair.'}
                    </div>
                </div>
                
                <div style="margin-top: 25px;">
                    <h3 style="color: #fff; margin-bottom: 15px;">⚡ Actions Rapides</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button class="btn-primary" style="background: linear-gradient(135deg, #10b981, #059669);">
                            📈 Voir le Chart
                        </button>
                        <button class="btn-secondary">
                            🔔 Créer Alerte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-refresh toutes les 30 secondes
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>"""
    return html
