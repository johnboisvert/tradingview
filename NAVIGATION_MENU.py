# MENU DE NAVIGATION COMPLET
# À ajouter dans CHAQUE page HTML (sauf pages admin)

NAV_MENU = """
<style>
    .top-nav {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        padding: 15px 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        position: sticky;
        top: 0;
        z-index: 1000;
    }
    .nav-container {
        max-width: 1600px;
        margin: 0 auto;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
    }
    .nav-btn {
        background: rgba(255,255,255,0.1);
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s;
        border: 1px solid rgba(255,255,255,0.1);
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    .nav-btn:hover {
        background: rgba(255,255,255,0.2);
        border-color: rgba(255,255,255,0.3);
        transform: translateY(-2px);
    }
    .nav-btn.premium {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
    }
    .nav-btn.admin {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border: none;
    }
    .nav-btn.account {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: none;
    }
    .nav-btn.logout {
        background: rgba(239,68,68,0.8);
        border: none;
    }
</style>

<nav class="top-nav">
    <div class="nav-container">
        <a href="/dashboard" class="nav-btn">🏠 Accueil</a>
        <a href="/fear-greed" class="nav-btn">😨 Fear&Greed</a>
        <a href="/dominance" class="nav-btn">👑 Dominance</a>
        <a href="/altcoin-season" class="nav-btn">🌟 Altcoin Season</a>
        <a href="/heatmap" class="nav-btn">🔥 Heatmap</a>
        <a href="/strategy" class="nav-btn">📊 Stratégie</a>
        <a href="/spot-trading" class="nav-btn">💎 Spot Trading</a>
        <a href="/calculatrice" class="nav-btn">🧮 Calculatrice</a>
        <a href="/news" class="nav-btn">📰 Nouvelles</a>
        <a href="/trades" class="nav-btn">📈 Trades</a>
        <a href="/risk-management" class="nav-btn">⚠️ Risk Management</a>
        <a href="/watchlist" class="nav-btn">👁️ Watchlist</a>
        <a href="/ai-assistant" class="nav-btn">🤖 AI Assistant</a>
        <a href="/prediction-ia" class="nav-btn">🔮 Prédiction IA</a>
        <a href="/ai-scanner" class="nav-btn">🔍 AI Scanner</a>
        <a href="/market-regime" class="nav-btn">📊 Market Regime</a>
        <a href="/whale-watcher" class="nav-btn">🐋 Whale Watcher</a>
        <a href="/stats-avancees" class="nav-btn">📊 Stats Avancées</a>
        <a href="/simulation" class="nav-btn">🎮 Simulation</a>
        <a href="/success-stories" class="nav-btn">⭐ Success Stories</a>
        <a href="/convertisseur" class="nav-btn">💱 Convertisseur</a>
        <a href="/calendrier" class="nav-btn">📅 Calendrier</a>
        <a href="/bullrun-phase" class="nav-btn">🚀 Bullrun Phase</a>
        <a href="/graphiques" class="nav-btn">📊 Graphiques</a>
        <a href="/telegram-setup" class="nav-btn">📱 Telegram</a>
        
        <a href="/pricing-complete" class="nav-btn premium">💎 Abonnements</a>
        <a href="/admin-dashboard" class="nav-btn admin">🔧 Admin</a>
        <a href="/mon-compte" class="nav-btn account">👤 Mon Compte</a>
        <a href="/logout" class="nav-btn logout">🚪 Déconnexion</a>
    </div>
</nav>
"""
