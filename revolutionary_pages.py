"""
Pages AI avec design révolutionnaire
Ce fichier contient les fonctions pour générer les pages HTML avec le nouveau design
"""

def get_revolutionary_css():
    """Retourne le CSS révolutionnaire"""
    return """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
:root {
    --bg-primary: #030712;
    --bg-secondary: #0a0f1a;
    --bg-card: rgba(15, 23, 42, 0.6);
    --border-color: rgba(99, 102, 241, 0.2);
    --border-glow: rgba(99, 102, 241, 0.5);
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --accent-primary: #6366f1;
    --accent-secondary: #8b5cf6;
    --accent-tertiary: #06b6d4;
    --success: #10b981;
    --danger: #ef4444;
    --warning: #f59e0b;
    --gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg-primary); color: var(--text-primary); min-height: 100vh; }
.bg-animated { position: fixed; inset: 0; z-index: -1; background: radial-gradient(ellipse 80% 50% at 20% -20%, rgba(99, 102, 241, 0.15), transparent), radial-gradient(ellipse 60% 40% at 80% 0%, rgba(139, 92, 246, 0.12), transparent), var(--bg-primary); }
.bg-grid { position: fixed; inset: 0; z-index: -1; background-image: linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px); background-size: 50px 50px; }
.orb { position: fixed; border-radius: 50%; filter: blur(80px); opacity: 0.4; animation: float 15s ease-in-out infinite; pointer-events: none; }
.orb-1 { width: 400px; height: 400px; background: var(--accent-primary); top: -100px; left: -100px; }
.orb-2 { width: 300px; height: 300px; background: var(--accent-secondary); top: 50%; right: -100px; }
.orb-3 { width: 250px; height: 250px; background: var(--accent-tertiary); bottom: -50px; left: 30%; }
@keyframes float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, -20px); } }
.rev-container { max-width: 1600px; margin: 0 auto; padding: 30px; position: relative; z-index: 1; }
.hero-header { text-align: center; padding: 50px 40px; margin-bottom: 40px; background: linear-gradient(145deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05)); border: 1px solid var(--border-color); border-radius: var(--radius-xl); position: relative; backdrop-filter: blur(20px); }
.hero-header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--gradient-primary); border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
.hero-icon { font-size: 70px; margin-bottom: 20px; display: block; }
.hero-title { font-size: 48px; font-weight: 900; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 15px; }
.hero-subtitle { font-size: 18px; color: var(--text-secondary); max-width: 700px; margin: 0 auto; line-height: 1.6; }
.live-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 600; color: var(--success); margin-top: 20px; }
.live-dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.3; } }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 40px; }
.stat-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 25px; transition: all 0.3s ease; backdrop-filter: blur(10px); }
.stat-card:hover { transform: translateY(-5px); border-color: var(--border-glow); box-shadow: 0 0 40px rgba(99, 102, 241, 0.15); }
.stat-icon { font-size: 32px; margin-bottom: 15px; }
.stat-value { font-size: 32px; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
.stat-value.positive { color: var(--success); }
.stat-value.negative { color: var(--danger); }
.stat-label { font-size: 13px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
.rev-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; backdrop-filter: blur(10px); }
.card-header { padding: 20px 25px; border-bottom: 1px solid var(--border-color); background: rgba(0, 0, 0, 0.2); }
.card-title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 15px 20px; text-align: left; font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; background: rgba(0, 0, 0, 0.3); }
.data-table td { padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.data-table tr:hover td { background: rgba(99, 102, 241, 0.05); }
.badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge-success { background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); }
.badge-danger { background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); }
.badge-warning { background: rgba(245, 158, 11, 0.15); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.3); }
.btn-primary { background: var(--gradient-primary); color: white; padding: 12px 24px; border: none; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; transition: all 0.3s; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4); }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
::-webkit-scrollbar-thumb { background: var(--accent-primary); border-radius: 4px; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.animate-slide-up { animation: slideUp 0.5s ease forwards; }
.progress-bar { height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
.progress-fill.success { background: linear-gradient(90deg, #10b981, #059669); }
.progress-fill.danger { background: linear-gradient(90deg, #ef4444, #dc2626); }
.progress-fill.warning { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
@media (max-width: 768px) {
    .hero-title { font-size: 32px; }
    .hero-subtitle { font-size: 14px; }
    .stats-grid { grid-template-columns: 1fr; }
    .rev-container { padding: 15px; }
}
"""

def get_background_html():
    """Retourne le HTML pour le fond animé"""
    return '<div class="bg-animated"></div><div class="bg-grid"></div><div class="orb orb-1"></div><div class="orb orb-2"></div><div class="orb orb-3"></div>'

def get_header_html(icon, title, subtitle):
    """Retourne le HTML pour l'en-tête hero"""
    return f'''<div class="hero-header">
        <div class="hero-icon">{icon}</div>
        <h1 class="hero-title">{title}</h1>
        <p class="hero-subtitle">{subtitle}</p>
        <div class="live-badge">
            <span class="live-dot"></span>
            <span>DONNÉES EN TEMPS RÉEL</span>
        </div>
    </div>'''

print("✅ Module revolutionary_pages.py créé!")
