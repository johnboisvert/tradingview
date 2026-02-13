"""
Pages Redesign Part 2 - CryptoIA
- /spot-trading (Révolutionnaire avec conseils investissement)
- /contact (Design moderne)
"""

# ============================================================================
# PAGE SPOT TRADING - Guide Complet Investissement Crypto
# ============================================================================
def get_spot_trading_page_html(SIDEBAR, CSS):
    return SIDEBAR + """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💹 Guide Spot Trading & Investissement - CryptoIA</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0"></script>
    """ + CSS + """
    <style>
        :root {
            --primary: #10b981;
            --primary-dark: #059669;
            --secondary: #6366f1;
            --accent: #f59e0b;
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
        
        .bg-grid {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background-image: 
                linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
        }
        
        .main-container {
            margin-left: 280px;
            padding: 30px;
            min-height: 100vh;
        }
        
        @media (max-width: 1024px) {
            .main-container { margin-left: 0; padding: 20px; }
        }
        
        /* Hero Section */
        .hero {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(245, 158, 11, 0.05) 100%);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 24px;
            padding: 60px 40px;
            margin-bottom: 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: -100px;
            right: -100px;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(-20px, 20px); }
        }
        
        .hero h1 {
            font-size: 3.5rem;
            font-weight: 900;
            background: linear-gradient(135deg, #10b981, #6366f1, #f59e0b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
            position: relative;
        }
        
        .hero p {
            font-size: 1.25rem;
            color: var(--muted);
            max-width: 700px;
            margin: 0 auto;
            position: relative;
        }
        
        /* Navigation Tabs */
        .nav-tabs {
            display: flex;
            gap: 15px;
            margin-bottom: 40px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .nav-tab {
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
        
        .nav-tab:hover {
            border-color: var(--primary);
            transform: translateY(-3px);
        }
        
        .nav-tab.active {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-color: transparent;
            color: white;
        }
        
        /* Content Sections */
        .content-section {
            display: none;
            animation: fadeIn 0.5s ease;
        }
        
        .content-section.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Stats Bar */
        .stats-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 25px;
            text-align: center;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-8px);
            border-color: var(--primary);
            box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15);
        }
        
        .stat-card:hover::before { opacity: 1; }
        
        .stat-icon { font-size: 2.5rem; margin-bottom: 15px; }
        .stat-value { font-size: 2rem; font-weight: 800; color: var(--text); margin-bottom: 5px; }
        .stat-value.up { color: var(--primary); }
        .stat-value.down { color: var(--danger); }
        .stat-label { font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
        
        /* What is Spot Section */
        .intro-section {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 40px;
            margin-bottom: 40px;
        }
        
        .intro-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: center;
        }
        
        @media (max-width: 900px) {
            .intro-grid { grid-template-columns: 1fr; }
        }
        
        .intro-content h2 {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .intro-content p {
            color: var(--muted);
            font-size: 1.1rem;
            margin-bottom: 20px;
            line-height: 1.8;
        }
        
        .intro-features {
            display: grid;
            gap: 15px;
        }
        
        .intro-feature {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px 20px;
            background: var(--dark);
            border-radius: 12px;
            transition: all 0.3s;
        }
        
        .intro-feature:hover {
            transform: translateX(10px);
            background: rgba(16, 185, 129, 0.1);
        }
        
        .intro-feature-icon {
            width: 45px;
            height: 45px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
        }
        
        .intro-feature-icon.green { background: rgba(16, 185, 129, 0.15); }
        .intro-feature-icon.blue { background: rgba(99, 102, 241, 0.15); }
        .intro-feature-icon.orange { background: rgba(245, 158, 11, 0.15); }
        
        .intro-feature h4 { font-size: 15px; margin-bottom: 3px; }
        .intro-feature p { color: var(--muted); font-size: 13px; margin: 0; }
        
        .comparison-table {
            background: var(--dark);
            border-radius: 16px;
            overflow: hidden;
        }
        
        .comparison-header {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            padding: 15px 20px;
            font-weight: 700;
            font-size: 14px;
        }
        
        .comparison-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            padding: 15px 20px;
            border-bottom: 1px solid var(--border);
            font-size: 14px;
            transition: background 0.3s;
        }
        
        .comparison-row:hover { background: rgba(16, 185, 129, 0.05); }
        .comparison-row:last-child { border-bottom: none; }
        
        .check { color: var(--primary); font-weight: bold; }
        .cross { color: var(--danger); font-weight: bold; }
        
        /* Investment Guide Section */
        .guide-section {
            margin-bottom: 40px;
        }
        
        .section-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .section-header h2 {
            font-size: 1.75rem;
            font-weight: 800;
        }
        
        .guide-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
        }
        
        .guide-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 30px;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        
        .guide-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 5px;
            height: 100%;
        }
        
        .guide-card.step1::before { background: linear-gradient(180deg, #10b981, #059669); }
        .guide-card.step2::before { background: linear-gradient(180deg, #6366f1, #4f46e5); }
        .guide-card.step3::before { background: linear-gradient(180deg, #f59e0b, #d97706); }
        .guide-card.step4::before { background: linear-gradient(180deg, #ec4899, #db2777); }
        .guide-card.step5::before { background: linear-gradient(180deg, #8b5cf6, #7c3aed); }
        .guide-card.step6::before { background: linear-gradient(180deg, #14b8a6, #0d9488); }
        
        .guide-card:hover {
            transform: translateY(-8px);
            border-color: var(--primary);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .guide-step {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            font-weight: 800;
            font-size: 18px;
            margin-bottom: 20px;
        }
        
        .guide-card h3 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .guide-card p {
            color: var(--muted);
            font-size: 14px;
            line-height: 1.7;
            margin-bottom: 20px;
        }
        
        .guide-tips {
            background: var(--dark);
            border-radius: 12px;
            padding: 15px;
        }
        
        .guide-tips h5 {
            font-size: 12px;
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        
        .guide-tips ul {
            list-style: none;
        }
        
        .guide-tips li {
            padding: 8px 0;
            font-size: 13px;
            display: flex;
            align-items: flex-start;
            gap: 10px;
            border-bottom: 1px solid rgba(51, 65, 85, 0.5);
        }
        
        .guide-tips li:last-child { border-bottom: none; }
        .guide-tips li::before { content: '→'; color: var(--primary); font-weight: bold; }
        
        /* Criteria Section */
        .criteria-section {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 40px;
            margin-bottom: 40px;
        }
        
        .criteria-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
        }
        
        .criteria-card {
            background: var(--dark);
            border: 2px solid var(--border);
            border-radius: 16px;
            padding: 25px;
            transition: all 0.3s;
        }
        
        .criteria-card:hover {
            border-color: var(--primary);
            transform: translateY(-5px);
        }
        
        .criteria-icon {
            width: 60px;
            height: 60px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            margin-bottom: 20px;
        }
        
        .criteria-icon.mc { background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05)); }
        .criteria-icon.team { background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.05)); }
        .criteria-icon.tech { background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05)); }
        .criteria-icon.comm { background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 0.05)); }
        .criteria-icon.token { background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05)); }
        .criteria-icon.use { background: linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(20, 184, 166, 0.05)); }
        
        .criteria-card h4 {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 12px;
        }
        
        .criteria-card p {
            color: var(--muted);
            font-size: 14px;
            line-height: 1.7;
            margin-bottom: 15px;
        }
        
        .criteria-checklist {
            background: rgba(15, 23, 42, 0.5);
            border-radius: 10px;
            padding: 12px;
        }
        
        .criteria-checklist div {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 0;
            font-size: 13px;
        }
        
        .criteria-checklist div::before {
            content: '✓';
            color: var(--primary);
            font-weight: bold;
        }
        
        /* Portfolio Section */
        .portfolio-section {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%);
            border: 2px solid var(--secondary);
            border-radius: 24px;
            padding: 40px;
            margin-bottom: 40px;
        }
        
        .portfolio-header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .portfolio-header h2 {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 10px;
        }
        
        .portfolio-header p {
            color: var(--muted);
            font-size: 1.1rem;
        }
        
        .portfolio-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
        }
        
        .portfolio-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            transition: all 0.3s;
        }
        
        .portfolio-card:hover {
            transform: translateY(-8px);
            border-color: var(--secondary);
        }
        
        .portfolio-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            margin: 0 auto 20px;
        }
        
        .portfolio-icon.conservative { background: linear-gradient(135deg, #10b981, #059669); }
        .portfolio-icon.balanced { background: linear-gradient(135deg, #6366f1, #4f46e5); }
        .portfolio-icon.aggressive { background: linear-gradient(135deg, #f59e0b, #d97706); }
        
        .portfolio-card h3 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .portfolio-card .risk {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        .portfolio-card .risk.low { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .portfolio-card .risk.medium { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .portfolio-card .risk.high { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        
        .allocation-bar {
            margin-bottom: 20px;
        }
        
        .allocation-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid var(--border);
        }
        
        .allocation-item:last-child { border-bottom: none; }
        
        .allocation-name {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
        }
        
        .allocation-percent {
            font-weight: 700;
            color: var(--primary);
        }
        
        /* Live Market Section */
        .market-section {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 40px;
            margin-bottom: 40px;
        }
        
        .market-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .market-header h2 {
            font-size: 1.5rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .live-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(16, 185, 129, 0.15);
            border-radius: 20px;
            font-size: 13px;
            color: var(--primary);
            font-weight: 600;
        }
        
        .live-dot {
            width: 8px;
            height: 8px;
            background: var(--primary);
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.3); }
        }
        
        .coins-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .coins-table th {
            text-align: left;
            padding: 15px;
            color: var(--muted);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 2px solid var(--border);
        }
        
        .coins-table td {
            padding: 18px 15px;
            border-bottom: 1px solid rgba(51, 65, 85, 0.5);
        }
        
        .coins-table tr {
            transition: all 0.3s;
        }
        
        .coins-table tr:hover {
            background: rgba(16, 185, 129, 0.05);
        }
        
        .coin-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .coin-icon {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: var(--dark);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }
        
        .coin-name { font-weight: 700; font-size: 15px; }
        .coin-symbol { color: var(--muted); font-size: 13px; }
        .price-cell { font-weight: 700; font-size: 1.1rem; }
        
        .change-cell {
            font-weight: 600;
            padding: 8px 14px;
            border-radius: 8px;
            display: inline-block;
            font-size: 14px;
        }
        
        .change-cell.positive { background: rgba(16, 185, 129, 0.15); color: var(--primary); }
        .change-cell.negative { background: rgba(239, 68, 68, 0.15); color: var(--danger); }
        
        .volume-cell { color: var(--muted); font-size: 14px; }
        
        /* Tips Section */
        .tips-section {
            margin-bottom: 40px;
        }
        
        .tips-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
        }
        
        .tip-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 30px;
            transition: all 0.3s;
        }
        
        .tip-card:hover {
            transform: translateY(-8px);
            border-color: var(--accent);
            box-shadow: 0 20px 40px rgba(245, 158, 11, 0.1);
        }
        
        .tip-icon {
            width: 60px;
            height: 60px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            margin-bottom: 20px;
        }
        
        .tip-icon.warning { background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05)); }
        .tip-icon.success { background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05)); }
        .tip-icon.info { background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.05)); }
        .tip-icon.danger { background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05)); }
        
        .tip-card h4 {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 12px;
        }
        
        .tip-card p {
            color: var(--muted);
            font-size: 14px;
            line-height: 1.7;
        }
        
        /* Warning Banner */
        .warning-banner {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 16px;
            padding: 25px;
            display: flex;
            gap: 20px;
            align-items: flex-start;
            margin-bottom: 40px;
        }
        
        .warning-banner-icon {
            font-size: 2.5rem;
            flex-shrink: 0;
        }
        
        .warning-banner h4 {
            color: var(--danger);
            margin-bottom: 8px;
        }
        
        .warning-banner p {
            color: var(--muted);
            font-size: 14px;
            line-height: 1.7;
        }
        
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .intro-grid { grid-template-columns: 1fr; }
            .comparison-header, .comparison-row { grid-template-columns: 1.5fr 1fr 1fr; font-size: 12px; }
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    
    <div class="main-container">
        <div class="hero">
            <h1>💹 Spot Trading & Investissement</h1>
            <p>Votre guide complet pour investir intelligemment en crypto. Apprenez les fondamentaux, les critères de sélection et les stratégies d'investissement long terme.</p>
        </div>
        
        <!-- Navigation Tabs -->
        <div class="nav-tabs">
            <button class="nav-tab active" onclick="showSection('basics')">
                <span>📚</span> C'est quoi le Spot?
            </button>
            <button class="nav-tab" onclick="showSection('guide')">
                <span>🎯</span> Guide d'Investissement
            </button>
            <button class="nav-tab" onclick="showSection('criteria')">
                <span>🔍</span> Critères de Sélection
            </button>
            <button class="nav-tab" onclick="showSection('portfolio')">
                <span>💼</span> Construire son Portfolio
            </button>
            <button class="nav-tab" onclick="showSection('market')">
                <span>📊</span> Marché en Direct
            </button>
        </div>
        
        <!-- Stats Bar -->
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
        
        <!-- ========== BASICS SECTION ========== -->
        <div class="content-section active" id="basics">
            <div class="intro-section">
                <div class="intro-grid">
                    <div class="intro-content">
                        <h2>🎓 Qu'est-ce que le Spot Trading?</h2>
                        <p>Le <strong>Spot Trading</strong> est la forme la plus simple et la plus sûre d'investir en cryptomonnaies. Vous achetez des actifs au prix actuel du marché et vous en devenez le propriétaire réel.</p>
                        <p>Contrairement au trading à effet de levier (Futures), le spot trading ne comporte <strong>aucun risque de liquidation</strong>. Vous ne pouvez jamais perdre plus que votre investissement initial.</p>
                        
                        <div class="intro-features">
                            <div class="intro-feature">
                                <div class="intro-feature-icon green">✅</div>
                                <div>
                                    <h4>Propriété Réelle</h4>
                                    <p>Vous possédez vraiment vos cryptos</p>
                                </div>
                            </div>
                            <div class="intro-feature">
                                <div class="intro-feature-icon blue">🛡️</div>
                                <div>
                                    <h4>Pas de Liquidation</h4>
                                    <p>Impossible de tout perdre en une nuit</p>
                                </div>
                            </div>
                            <div class="intro-feature">
                                <div class="intro-feature-icon orange">💎</div>
                                <div>
                                    <h4>Idéal Long Terme</h4>
                                    <p>Parfait pour la stratégie HODL</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="comparison-table">
                        <div class="comparison-header">
                            <span>Caractéristique</span>
                            <span>Spot</span>
                            <span>Futures</span>
                        </div>
                        <div class="comparison-row">
                            <span>Propriété des actifs</span>
                            <span class="check">✓ Oui</span>
                            <span class="cross">✗ Non</span>
                        </div>
                        <div class="comparison-row">
                            <span>Risque de liquidation</span>
                            <span class="check">✓ Aucun</span>
                            <span class="cross">✗ Élevé</span>
                        </div>
                        <div class="comparison-row">
                            <span>Effet de levier</span>
                            <span>1x (pas de levier)</span>
                            <span>Jusqu'à 125x</span>
                        </div>
                        <div class="comparison-row">
                            <span>Frais de financement</span>
                            <span class="check">✓ Aucun</span>
                            <span class="cross">✗ Oui (8h)</span>
                        </div>
                        <div class="comparison-row">
                            <span>Complexité</span>
                            <span class="check">✓ Simple</span>
                            <span class="cross">✗ Complexe</span>
                        </div>
                        <div class="comparison-row">
                            <span>Idéal pour</span>
                            <span>Débutants/Long terme</span>
                            <span>Traders expérimentés</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="warning-banner">
                <div class="warning-banner-icon">⚠️</div>
                <div>
                    <h4>Avertissement Important</h4>
                    <p>L'investissement en cryptomonnaies comporte des risques. N'investissez que ce que vous pouvez vous permettre de perdre. Les performances passées ne garantissent pas les résultats futurs. Faites toujours vos propres recherches (DYOR) avant d'investir.</p>
                </div>
            </div>
        </div>
        
        <!-- ========== GUIDE SECTION ========== -->
        <div class="content-section" id="guide">
            <div class="guide-section">
                <div class="section-header">
                    <h2>🎯 Guide d'Investissement en 6 Étapes</h2>
                </div>
                
                <div class="guide-grid">
                    <div class="guide-card step1">
                        <div class="guide-step">1</div>
                        <h3>📚 Éduquez-vous d'abord</h3>
                        <p>Avant d'investir un seul euro, comprenez les bases de la blockchain, du Bitcoin et des altcoins. La connaissance est votre meilleure protection.</p>
                        <div class="guide-tips">
                            <h5>Ressources recommandées</h5>
                            <ul>
                                <li>Whitepaper Bitcoin (document fondateur)</li>
                                <li>Cours gratuits sur notre Academy</li>
                                <li>Chaînes YouTube éducatives (pas de "gurus")</li>
                                <li>Livres: "The Bitcoin Standard"</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="guide-card step2">
                        <div class="guide-step">2</div>
                        <h3>💰 Définissez votre budget</h3>
                        <p>Règle d'or: n'investissez que ce que vous pouvez perdre à 100% sans affecter votre vie. Commencez petit et augmentez progressivement.</p>
                        <div class="guide-tips">
                            <h5>Conseils budget</h5>
                            <ul>
                                <li>Maximum 5-10% de votre épargne</li>
                                <li>Jamais d'argent emprunté</li>
                                <li>Gardez 6 mois de dépenses en fiat</li>
                                <li>Investissez régulièrement (DCA)</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="guide-card step3">
                        <div class="guide-step">3</div>
                        <h3>🔐 Sécurisez vos comptes</h3>
                        <p>La sécurité est primordiale en crypto. Un compte mal sécurisé peut être vidé en quelques minutes par des hackers.</p>
                        <div class="guide-tips">
                            <h5>Checklist sécurité</h5>
                            <ul>
                                <li>2FA obligatoire (Google Authenticator)</li>
                                <li>Email dédié aux cryptos</li>
                                <li>Mot de passe unique et complexe</li>
                                <li>Whitelist des adresses de retrait</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="guide-card step4">
                        <div class="guide-step">4</div>
                        <h3>🎯 Choisissez vos cryptos</h3>
                        <p>Commencez par les cryptos établies (BTC, ETH) avant d'explorer les altcoins. La diversification réduit le risque.</p>
                        <div class="guide-tips">
                            <h5>Allocation suggérée débutant</h5>
                            <ul>
                                <li>50-60% Bitcoin (valeur refuge)</li>
                                <li>20-30% Ethereum (smart contracts)</li>
                                <li>10-20% Altcoins top 20</li>
                                <li>0-5% Projets à haut risque</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="guide-card step5">
                        <div class="guide-step">5</div>
                        <h3>📅 Stratégie DCA</h3>
                        <p>Le Dollar Cost Averaging consiste à investir un montant fixe régulièrement, peu importe le prix. Cela lisse votre prix d'achat moyen.</p>
                        <div class="guide-tips">
                            <h5>Exemple DCA</h5>
                            <ul>
                                <li>$100/semaine pendant 1 an = $5,200</li>
                                <li>Achat automatique chaque lundi</li>
                                <li>Pas de stress sur le timing</li>
                                <li>Historiquement très rentable</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="guide-card step6">
                        <div class="guide-step">6</div>
                        <h3>🔒 Stockage sécurisé</h3>
                        <p>Pour le long terme, transférez vos cryptos vers un wallet personnel. "Not your keys, not your coins."</p>
                        <div class="guide-tips">
                            <h5>Options de stockage</h5>
                            <ul>
                                <li>Hardware wallet (Ledger, Trezor)</li>
                                <li>Seed phrase en lieu sûr (pas digital)</li>
                                <li>Plusieurs copies dans différents lieux</li>
                                <li>Jamais de photo de votre seed!</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ========== CRITERIA SECTION ========== -->
        <div class="content-section" id="criteria">
            <div class="criteria-section">
                <div class="section-header">
                    <h2>🔍 6 Critères pour Évaluer une Crypto</h2>
                </div>
                
                <div class="criteria-grid">
                    <div class="criteria-card">
                        <div class="criteria-icon mc">📊</div>
                        <h4>1. Market Cap & Liquidité</h4>
                        <p>La capitalisation boursière indique la taille et la stabilité d'un projet. Plus c'est gros, moins c'est volatile.</p>
                        <div class="criteria-checklist">
                            <div>Large Cap (>$10B): Plus stable</div>
                            <div>Mid Cap ($1-10B): Équilibré</div>
                            <div>Small Cap (<$1B): Plus risqué</div>
                        </div>
                    </div>
                    
                    <div class="criteria-card">
                        <div class="criteria-icon team">👥</div>
                        <h4>2. Équipe & Fondateurs</h4>
                        <p>Une équipe expérimentée et transparente est essentielle. Vérifiez leurs antécédents et leur présence publique.</p>
                        <div class="criteria-checklist">
                            <div>Identités vérifiables (LinkedIn)</div>
                            <div>Expérience dans le domaine</div>
                            <div>Communication régulière</div>
                        </div>
                    </div>
                    
                    <div class="criteria-card">
                        <div class="criteria-icon tech">⚙️</div>
                        <h4>3. Technologie & Innovation</h4>
                        <p>Le projet résout-il un vrai problème? La technologie est-elle unique ou juste une copie?</p>
                        <div class="criteria-checklist">
                            <div>Whitepaper technique solide</div>
                            <div>Code open source (GitHub)</div>
                            <div>Audits de sécurité</div>
                        </div>
                    </div>
                    
                    <div class="criteria-card">
                        <div class="criteria-icon comm">🌍</div>
                        <h4>4. Communauté & Adoption</h4>
                        <p>Une communauté active et engagée est signe de santé. Méfiez-vous des projets avec peu d'activité réelle.</p>
                        <div class="criteria-checklist">
                            <div>Activité Discord/Telegram</div>
                            <div>Développeurs actifs</div>
                            <div>Partenariats concrets</div>
                        </div>
                    </div>
                    
                    <div class="criteria-card">
                        <div class="criteria-icon token">🪙</div>
                        <h4>5. Tokenomics</h4>
                        <p>Comment les tokens sont-ils distribués? Y a-t-il de l'inflation? Les fondateurs ont-ils trop de tokens?</p>
                        <div class="criteria-checklist">
                            <div>Supply max définie</div>
                            <div>Distribution équitable</div>
                            <div>Vesting pour l'équipe</div>
                        </div>
                    </div>
                    
                    <div class="criteria-card">
                        <div class="criteria-icon use">🎯</div>
                        <h4>6. Cas d'Usage Réel</h4>
                        <p>Le token a-t-il une utilité réelle ou est-ce juste de la spéculation? Les vrais projets ont des utilisateurs.</p>
                        <div class="criteria-checklist">
                            <div>Produit fonctionnel</div>
                            <div>Utilisateurs actifs</div>
                            <div>Revenus du protocole</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ========== PORTFOLIO SECTION ========== -->
        <div class="content-section" id="portfolio">
            <div class="portfolio-section">
                <div class="portfolio-header">
                    <h2>💼 Modèles de Portfolios</h2>
                    <p>Choisissez le profil qui correspond à votre tolérance au risque</p>
                </div>
                
                <div class="portfolio-grid">
                    <div class="portfolio-card">
                        <div class="portfolio-icon conservative">🛡️</div>
                        <h3>Conservateur</h3>
                        <span class="risk low">Risque Faible</span>
                        <div class="allocation-bar">
                            <div class="allocation-item">
                                <span class="allocation-name">₿ Bitcoin</span>
                                <span class="allocation-percent">70%</span>
                            </div>
                            <div class="allocation-item">
                                <span class="allocation-name">Ξ Ethereum</span>
                                <span class="allocation-percent">20%</span>
                            </div>
                            <div class="allocation-item">
                                <span class="allocation-name">🪙 Stablecoins</span>
                                <span class="allocation-percent">10%</span>
                            </div>
                        </div>
                        <p style="color: var(--muted); font-size: 13px;">Idéal pour: Débutants, investisseurs prudents, horizon 5+ ans</p>
                    </div>
                    
                    <div class="portfolio-card">
                        <div class="portfolio-icon balanced">⚖️</div>
                        <h3>Équilibré</h3>
                        <span class="risk medium">Risque Modéré</span>
                        <div class="allocation-bar">
                            <div class="allocation-item">
                                <span class="allocation-name">₿ Bitcoin</span>
                                <span class="allocation-percent">50%</span>
                            </div>
                            <div class="allocation-item">
                                <span class="allocation-name">Ξ Ethereum</span>
                                <span class="allocation-percent">25%</span>
                            </div>
                            <div class="allocation-item">
                                <span class="allocation-name">🔷 Top Altcoins</span>
                                <span class="allocation-percent">20%</span>
                            </div>
                            <div class="allocation-item">
                                <span class="allocation-name">🚀 Small Caps</span>
                                <span class="allocation-percent">5%</span>
                            </div>
                        </div>
                        <p style="color: var(--muted); font-size: 13px;">Idéal pour: Investisseurs intermédiaires, horizon 3-5 ans</p>
                    </div>
                    
                    <div class="portfolio-card">
                        <div class="portfolio-icon aggressive">🚀</div>
                        <h3>Agressif</h3>
                        <span class="risk high">Risque Élevé</span>
                        <div class="allocation-bar">
                            <div class="allocation-item">
                                <span class="allocation-name">₿ Bitcoin</span>
                                <span class="allocation-percent">30%</span>
                            </div>
                            <div class="allocation-item">
                                <span class="allocation-name">Ξ Ethereum</span>
                                <span class="allocation-percent">20%</span>
                            </div>
                            <div class="allocation-item">
                                <span class="allocation-name">🔷 Layer 1s</span>
                                <span class="allocation-percent">25%</span>
                            </div>
                            <div class="allocation-item">
                                <span class="allocation-name">🎮 DeFi/Gaming</span>
                                <span class="allocation-percent">15%</span>
                            </div>
                            <div class="allocation-item">
                                <span class="allocation-name">💎 Gems</span>
                                <span class="allocation-percent">10%</span>
                            </div>
                        </div>
                        <p style="color: var(--muted); font-size: 13px;">Idéal pour: Experts, haute tolérance au risque, horizon 1-3 ans</p>
                    </div>
                </div>
            </div>
            
            <div class="tips-section">
                <div class="section-header">
                    <h2>💡 Conseils d'Or pour Investir</h2>
                </div>
                
                <div class="tips-grid">
                    <div class="tip-card">
                        <div class="tip-icon warning">⚠️</div>
                        <h4>Ne FOMO pas</h4>
                        <p>La peur de rater une opportunité (FOMO) est votre pire ennemi. Les meilleures opportunités reviennent toujours. Attendez les corrections pour acheter.</p>
                    </div>
                    
                    <div class="tip-card">
                        <div class="tip-icon success">📈</div>
                        <h4>Pensez en cycles</h4>
                        <p>Le marché crypto fonctionne en cycles de 4 ans (halving Bitcoin). Accumulez pendant les bear markets, prenez des profits pendant les bull runs.</p>
                    </div>
                    
                    <div class="tip-card">
                        <div class="tip-icon info">🎯</div>
                        <h4>Ayez un plan de sortie</h4>
                        <p>Définissez à l'avance vos objectifs de profit. "J'ai x2, je vends 25%". Sans plan, vous ne vendrez jamais et perdrez vos gains.</p>
                    </div>
                    
                    <div class="tip-card">
                        <div class="tip-icon danger">🚫</div>
                        <h4>Évitez les shitcoins</h4>
                        <p>99% des cryptos iront à zéro. Concentrez-vous sur les projets établis. Les "100x" sont souvent des arnaques déguisées.</p>
                    </div>
                    
                    <div class="tip-card">
                        <div class="tip-icon success">💪</div>
                        <h4>Restez patient</h4>
                        <p>Les fortunes en crypto se font sur des années, pas des jours. La patience et la discipline battent toujours le trading frénétique.</p>
                    </div>
                    
                    <div class="tip-card">
                        <div class="tip-icon info">📊</div>
                        <h4>Diversifiez intelligemment</h4>
                        <p>Ne mettez pas tous vos œufs dans le même panier, mais évitez aussi de trop diversifier. 5-10 cryptos maximum pour un suivi efficace.</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ========== MARKET SECTION ========== -->
        <div class="content-section" id="market">
            <div class="market-section">
                <div class="market-header">
                    <h2>📊 Top Cryptomonnaies en Direct</h2>
                    <div class="live-indicator">
                        <div class="live-dot"></div>
                        <span>Données en temps réel</span>
                    </div>
                </div>
                
                <table class="coins-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Crypto</th>
                            <th>Prix</th>
                            <th>24h</th>
                            <th>7j</th>
                            <th>Market Cap</th>
                        </tr>
                    </thead>
                    <tbody id="coinsTableBody">
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 40px;">
                                <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                                <p style="margin-top: 15px; color: var(--muted);">Chargement des données...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <script>
        const coinIcons = {
            'bitcoin': '₿', 'ethereum': 'Ξ', 'tether': '₮', 'binancecoin': '🔸',
            'solana': '◎', 'ripple': '✕', 'cardano': '₳', 'dogecoin': 'Ð',
            'polkadot': '●', 'avalanche-2': '🔺', 'chainlink': '⬡', 'polygon': '🟣'
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
        
        function showSection(sectionId) {
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            
            document.getElementById(sectionId).classList.add('active');
            event.target.closest('.nav-tab').classList.add('active');
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
        
        async function fetchTopCoins() {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=24h,7d');
                const coins = await response.json();
                
                const tbody = document.getElementById('coinsTableBody');
                tbody.innerHTML = coins.map(coin => `
                    <tr>
                        <td style="color: var(--muted); font-weight: 600;">${coin.market_cap_rank}</td>
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
                        <td class="volume-cell">$${formatNumber(coin.market_cap)}</td>
                    </tr>
                `).join('');
            } catch (e) { 
                console.log('Coins error:', e);
                document.getElementById('coinsTableBody').innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--muted);">Erreur de chargement. Réessayez plus tard.</td></tr>';
            }
        }
        
        // Initialize
        fetchGlobalData();
        fetchTopCoins();
        setInterval(fetchGlobalData, 60000);
        setInterval(fetchTopCoins, 60000);
        
        // Add spin animation
        const style = document.createElement('style');
        style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    </script>
</body>
</html>
"""


# ============================================================================
# PAGE CONTACT - Design Moderne et Élégant
# ============================================================================
def get_contact_page_html(SIDEBAR, CSS, pre_name="", pre_email="", message="", sent=False):
    import html as html_module
    pre_name_safe = html_module.escape(pre_name) if pre_name else ""
    pre_email_safe = html_module.escape(pre_email) if pre_email else ""
    
    success_html = ""
    if sent:
        success_html = """
        <div class="success-banner">
            <div class="success-icon">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                    <circle cx="30" cy="30" r="30" fill="url(#grad1)"/>
                    <path d="M20 30L27 37L40 24" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                    <defs>
                        <linearGradient id="grad1" x1="0" y1="0" x2="60" y2="60">
                            <stop offset="0%" stop-color="#10b981"/>
                            <stop offset="100%" stop-color="#059669"/>
                        </linearGradient>
                    </defs>
                </svg>
            </div>
            <div class="success-content">
                <h3>Message envoyé avec succès! 🎉</h3>
                <p>Merci de nous avoir contacté. Notre équipe vous répondra dans les 24 heures.</p>
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
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 30px;
            padding: 60px 40px;
            margin-bottom: 50px;
            text-align: center;
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
            background: conic-gradient(from 0deg, transparent, rgba(99, 102, 241, 0.05), transparent 30%);
            animation: rotate 30s linear infinite;
        }
        
        @keyframes rotate {
            100% { transform: rotate(360deg); }
        }
        
        .hero-content {
            position: relative;
            z-index: 1;
        }
        
        .hero h1 {
            font-size: 3.5rem;
            font-weight: 900;
            background: linear-gradient(135deg, #6366f1, #ec4899, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
        }
        
        .hero p {
            font-size: 1.25rem;
            color: var(--muted);
            max-width: 600px;
            margin: 0 auto;
        }
        
        .success-banner {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
            border: 2px solid rgba(16, 185, 129, 0.4);
            border-radius: 24px;
            padding: 40px;
            margin-bottom: 40px;
            display: flex;
            align-items: center;
            gap: 30px;
            animation: slideIn 0.5s ease;
        }
        
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .success-icon { flex-shrink: 0; }
        .success-content h3 { color: var(--success); font-size: 1.5rem; margin-bottom: 10px; }
        .success-content p { color: var(--muted); font-size: 1.1rem; }
        
        .info-banner {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 16px;
            padding: 20px 25px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .info-icon { font-size: 1.5rem; }
        .info-content { color: var(--text); }
        
        .contact-grid {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 40px;
        }
        
        @media (max-width: 1100px) {
            .contact-grid { grid-template-columns: 1fr; }
        }
        
        .form-section {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 45px;
            position: relative;
            overflow: hidden;
        }
        
        .form-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, var(--primary), var(--secondary));
        }
        
        .form-title {
            font-size: 1.75rem;
            font-weight: 800;
            margin-bottom: 35px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 25px;
        }
        
        @media (max-width: 600px) {
            .form-row { grid-template-columns: 1fr; }
        }
        
        .form-group { margin-bottom: 25px; }
        
        .form-label {
            display: block;
            font-size: 14px;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .form-input {
            width: 100%;
            padding: 18px 22px;
            background: var(--dark);
            border: 2px solid var(--border);
            border-radius: 14px;
            color: var(--text);
            font-size: 16px;
            font-family: inherit;
            transition: all 0.3s;
        }
        
        .form-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 5px rgba(99, 102, 241, 0.15);
        }
        
        .form-input::placeholder { color: var(--muted); }
        
        textarea.form-input {
            min-height: 180px;
            resize: vertical;
        }
        
        .subject-select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 18px center;
            padding-right: 50px;
            cursor: pointer;
        }
        
        .subject-select option {
            background: var(--dark);
            color: var(--text);
            padding: 10px;
        }
        
        .submit-btn {
            width: 100%;
            padding: 20px 35px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            border: none;
            border-radius: 14px;
            color: white;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            position: relative;
            overflow: hidden;
        }
        
        .submit-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        
        .submit-btn:hover::before {
            left: 100%;
        }
        
        .submit-btn:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(99, 102, 241, 0.4);
        }
        
        .info-section {
            display: flex;
            flex-direction: column;
            gap: 25px;
        }
        
        .info-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 30px;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        
        .info-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 5px;
            height: 100%;
            background: linear-gradient(180deg, var(--primary), var(--secondary));
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .info-card:hover {
            transform: translateX(10px);
            border-color: var(--primary);
        }
        
        .info-card:hover::before { opacity: 1; }
        
        .info-card-icon {
            width: 60px;
            height: 60px;
            border-radius: 16px;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            margin-bottom: 20px;
        }
        
        .info-card-title {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .info-card-text {
            color: var(--muted);
            font-size: 15px;
            line-height: 1.7;
        }
        
        .info-card-link {
            color: var(--primary-light);
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .info-card-link:hover { color: var(--secondary); }
        
        .social-links {
            display: flex;
            gap: 15px;
            margin-top: 15px;
        }
        
        .social-link {
            width: 45px;
            height: 45px;
            border-radius: 12px;
            background: var(--dark);
            border: 2px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            transition: all 0.3s;
            cursor: pointer;
        }
        
        .social-link:hover {
            border-color: var(--primary);
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .faq-section {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 45px;
            margin-top: 50px;
        }
        
        .faq-title {
            font-size: 1.75rem;
            font-weight: 800;
            margin-bottom: 35px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .faq-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
        }
        
        .faq-item {
            background: var(--dark);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 25px;
            transition: all 0.3s;
        }
        
        .faq-item:hover {
            border-color: var(--primary);
            transform: translateY(-5px);
        }
        
        .faq-question {
            font-weight: 700;
            color: var(--text);
            margin-bottom: 12px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            font-size: 15px;
        }
        
        .faq-question::before {
            content: '❓';
            flex-shrink: 0;
        }
        
        .faq-answer {
            color: var(--muted);
            font-size: 14px;
            line-height: 1.7;
            padding-left: 32px;
        }
        
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .hero { padding: 40px 25px; }
            .form-section { padding: 30px; }
            .faq-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="bg-pattern"></div>
    
    <div class="main-container">
        <div class="hero">
            <div class="hero-content">
                <h1>📬 Contactez-nous</h1>
                <p>Une question, une suggestion ou besoin d'aide? Notre équipe est là pour vous accompagner dans votre aventure crypto!</p>
            </div>
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
                            <label class="form-label">👤 Votre nom</label>
                            <input type="text" name="name" class="form-input" placeholder="Jean Dupont" value=\"""" + pre_name_safe + """\" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">📧 Votre email</label>
                            <input type="email" name="email" class="form-input" placeholder="jean@exemple.com" value=\"""" + pre_email_safe + """\" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">📋 Sujet</label>
                        <select name="subject" class="form-input subject-select">
                            <option value="">Sélectionnez un sujet...</option>
                            <option value="question">❓ Question générale</option>
                            <option value="bug">🐛 Signaler un bug</option>
                            <option value="suggestion">💡 Suggestion d'amélioration</option>
                            <option value="partnership">🤝 Partenariat</option>
                            <option value="subscription">💳 Abonnement / Paiement</option>
                            <option value="other">📝 Autre</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">💬 Votre message</label>
                        <textarea name="message" class="form-input" placeholder="Décrivez votre question ou problème en détail..." required></textarea>
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
                    <div class="info-card-text">Notre équipe répond généralement sous <strong>24 heures</strong> les jours ouvrables. Pour les urgences, utilisez le chat en direct.</div>
                </div>
                
                <div class="info-card">
                    <div class="info-card-icon">📧</div>
                    <div class="info-card-title">Email direct</div>
                    <div class="info-card-text">
                        <a href="mailto:support@cryptoia.ca" class="info-card-link">
                            support@cryptoia.ca
                            <span>→</span>
                        </a>
                    </div>
                </div>
                
                <div class="info-card">
                    <div class="info-card-icon">💬</div>
                    <div class="info-card-title">Chat en direct</div>
                    <div class="info-card-text">Disponible du lundi au vendredi<br><strong>9h - 18h (EST)</strong></div>
                </div>
                
                <div class="info-card">
                    <div class="info-card-icon">🌐</div>
                    <div class="info-card-title">Suivez-nous</div>
                    <div class="info-card-text">Restez informé des dernières actualités</div>
                    <div class="social-links">
                        <div class="social-link">𝕏</div>
                        <div class="social-link">📱</div>
                        <div class="social-link">💬</div>
                        <div class="social-link">📺</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="faq-section">
            <div class="faq-title">
                <span>❓</span>
                <span>Questions fréquentes</span>
            </div>
            
            <div class="faq-grid">
                <div class="faq-item">
                    <div class="faq-question">Comment réinitialiser mon mot de passe?</div>
                    <div class="faq-answer">Cliquez sur "Mot de passe oublié" sur la page de connexion. Vous recevrez un email avec un lien de réinitialisation valide 24h.</div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">Comment fonctionne l'abonnement?</div>
                    <div class="faq-answer">Nous proposons plusieurs plans (Gratuit, Pro, Premium). Visitez la page /pricing-complete pour voir les détails et avantages de chaque plan.</div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">Les données sont-elles en temps réel?</div>
                    <div class="faq-answer">Oui! Nos données proviennent de CoinGecko et Binance avec un délai minimal de 30 secondes pour les prix et volumes.</div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">Puis-je annuler mon abonnement?</div>
                    <div class="faq-answer">Absolument! Vous pouvez annuler à tout moment depuis votre tableau de bord. L'accès reste actif jusqu'à la fin de la période payée.</div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">Comment sécuriser mon compte?</div>
                    <div class="faq-answer">Activez l'authentification 2FA (Google Authenticator), utilisez un mot de passe unique et ne partagez jamais vos identifiants.</div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">Proposez-vous des formations?</div>
                    <div class="faq-answer">Oui! Notre Academy propose 22 modules complets pour apprendre le trading crypto, de débutant à expert. Accès gratuit pour les membres Pro.</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
"""