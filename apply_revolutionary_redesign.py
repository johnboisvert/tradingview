#!/usr/bin/env python3
"""
Script pour appliquer le redesign révolutionnaire aux pages AI
"""

import re
import os
import shutil
from datetime import datetime

# Backup du fichier original
def backup_main():
    src = 'main.py'
    dst = f'main_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.py'
    shutil.copy(src, dst)
    print(f"✅ Backup créé: {dst}")
    return dst

# CSS révolutionnaire global
REVOLUTIONARY_CSS = '''
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
    --bg-primary: #030712;
    --bg-secondary: #0a0f1a;
    --bg-card: rgba(15, 23, 42, 0.6);
    --bg-card-hover: rgba(30, 41, 59, 0.8);
    --border-color: rgba(99, 102, 241, 0.2);
    --border-glow: rgba(99, 102, 241, 0.5);
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --accent-primary: #6366f1;
    --accent-secondary: #8b5cf6;
    --accent-tertiary: #06b6d4;
    --success: #10b981;
    --success-glow: rgba(16, 185, 129, 0.3);
    --danger: #ef4444;
    --danger-glow: rgba(239, 68, 68, 0.3);
    --warning: #f59e0b;
    --warning-glow: rgba(245, 158, 11, 0.3);
    --gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
    --gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
    --gradient-danger: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    --gradient-card: linear-gradient(145deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
    --shadow-glow: 0 0 60px rgba(99, 102, 241, 0.15);
    --shadow-card: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    overflow-x: hidden;
}

/* Animated Background */
.bg-animated {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: -1;
    background: 
        radial-gradient(ellipse 80% 50% at 20% -20%, rgba(99, 102, 241, 0.15), transparent),
        radial-gradient(ellipse 60% 40% at 80% 0%, rgba(139, 92, 246, 0.12), transparent),
        radial-gradient(ellipse 50% 30% at 50% 100%, rgba(6, 182, 212, 0.1), transparent),
        var(--bg-primary);
}

.bg-grid {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: -1;
    background-image: 
        linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
    0% { transform: translate(0, 0); }
    100% { transform: translate(50px, 50px); }
}

/* Floating Orbs */
.orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;
    animation: float 15s ease-in-out infinite;
    pointer-events: none;
}

.orb-1 { width: 400px; height: 400px; background: var(--accent-primary); top: -100px; left: -100px; }
.orb-2 { width: 300px; height: 300px; background: var(--accent-secondary); top: 50%; right: -100px; animation-delay: -5s; }
.orb-3 { width: 250px; height: 250px; background: var(--accent-tertiary); bottom: -50px; left: 30%; animation-delay: -10s; }

@keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(30px, -30px) scale(1.05); }
    50% { transform: translate(-20px, 20px) scale(0.95); }
    75% { transform: translate(20px, 30px) scale(1.02); }
}

/* Container */
.rev-container {
    max-width: 1600px;
    margin: 0 auto;
    padding: 30px;
    position: relative;
    z-index: 1;
}

/* Hero Header */
.hero-header {
    text-align: center;
    padding: 50px 40px;
    margin-bottom: 40px;
    background: var(--gradient-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-xl);
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(20px);
}

.hero-header::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--gradient-primary);
}

.hero-icon { font-size: 70px; margin-bottom: 20px; display: inline-block; animation: bounce 2s ease-in-out infinite; }

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.hero-title {
    font-size: 48px;
    font-weight: 900;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 15px;
}

.hero-subtitle {
    font-size: 18px;
    color: var(--text-secondary);
    max-width: 700px;
    margin: 0 auto;
    line-height: 1.6;
}

/* Live Badge */
.live-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    color: var(--success);
    margin-top: 20px;
}

.live-dot {
    width: 8px; height: 8px;
    background: var(--success);
    border-radius: 50%;
    animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

.stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 25px;
    position: relative;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
}

.stat-card:hover {
    transform: translateY(-5px);
    border-color: var(--border-glow);
    box-shadow: var(--shadow-glow);
}

.stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 4px; height: 100%;
    background: var(--gradient-primary);
    opacity: 0;
    transition: opacity 0.3s;
}

.stat-card:hover::before { opacity: 1; }

.stat-icon { font-size: 32px; margin-bottom: 15px; }

.stat-value {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 5px;
    font-family: 'JetBrains Mono', monospace;
}

.stat-value.positive { color: var(--success); }
.stat-value.negative { color: var(--danger); }
.stat-value.neutral { color: var(--warning); }

.stat-label {
    font-size: 13px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* Cards */
.rev-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    overflow: hidden;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.rev-card:hover { border-color: var(--border-glow); }

.card-header {
    padding: 20px 25px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.2);
}

.card-title {
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
}

.card-body { padding: 25px; }

/* Data Table */
.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th {
    padding: 15px 20px;
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
    background: rgba(0, 0, 0, 0.3);
    position: sticky;
    top: 0;
    z-index: 10;
}

.data-table td {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 14px;
    transition: background 0.2s;
}

.data-table tr:hover td { background: rgba(99, 102, 241, 0.05); }

/* Badges */
.badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
}

.badge-success {
    background: var(--success-glow);
    color: var(--success);
    border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge-danger {
    background: var(--danger-glow);
    color: var(--danger);
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.badge-warning {
    background: var(--warning-glow);
    color: var(--warning);
    border: 1px solid rgba(245, 158, 11, 0.3);
}

/* Buttons */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-primary {
    background: var(--gradient-primary);
    color: white;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

/* Form Elements */
.form-input, .form-select {
    width: 100%;
    padding: 14px 18px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 15px;
    transition: all 0.3s;
}

.form-input:focus, .form-select:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Progress Bar */
.progress-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 999px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.5s ease;
}

.progress-fill.success { background: var(--gradient-success); }
.progress-fill.danger { background: var(--gradient-danger); }
.progress-fill.warning { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

/* Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
::-webkit-scrollbar-thumb { background: var(--accent-primary); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent-secondary); }

/* Animations */
@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.animate-slide-up { animation: slideUp 0.5s ease forwards; }
.animate-fade-in { animation: fadeIn 0.5s ease forwards; }

/* Responsive */
@media (max-width: 1200px) {
    .rev-container { padding: 20px; }
    .hero-title { font-size: 36px; }
}

@media (max-width: 768px) {
    .hero-title { font-size: 28px; }
    .hero-subtitle { font-size: 14px; }
    .stats-grid { grid-template-columns: 1fr; }
}
'''

def get_background_html():
    return '''
    <div class="bg-animated"></div>
    <div class="bg-grid"></div>
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
    '''

def get_hero_header(icon, title, subtitle):
    return f'''
    <div class="hero-header">
        <div class="hero-icon">{icon}</div>
        <h1 class="hero-title">{title}</h1>
        <p class="hero-subtitle">{subtitle}</p>
        <div class="live-badge">
            <span class="live-dot"></span>
            <span>DONNÉES EN TEMPS RÉEL</span>
        </div>
    </div>
    '''

if __name__ == "__main__":
    print("🎨 Application du redesign révolutionnaire...")
    backup_main()
    
    with open('main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Ajouter le CSS global si pas déjà présent
    if 'REVOLUTIONARY_CSS' not in content:
        # Trouver un bon endroit pour insérer (après les imports)
        insert_pos = content.find('# --- Routes ---')
        if insert_pos == -1:
            insert_pos = content.find('@app.')
        
        css_var = f'''
# CSS Révolutionnaire Global
REVOLUTIONARY_CSS = """{REVOLUTIONARY_CSS}"""

def get_revolutionary_background():
    return """{get_background_html()}"""

def get_revolutionary_header(icon, title, subtitle):
    return f\'\'\'
    <div class="hero-header">
        <div class="hero-icon">{{icon}}</div>
        <h1 class="hero-title">{{title}}</h1>
        <p class="hero-subtitle">{{subtitle}}</p>
        <div class="live-badge">
            <span class="live-dot"></span>
            <span>DONNÉES EN TEMPS RÉEL</span>
        </div>
    </div>
    \'\'\'

'''
        content = content[:insert_pos] + css_var + content[insert_pos:]
        
        with open('main.py', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ CSS révolutionnaire ajouté!")
    else:
        print("ℹ️ CSS révolutionnaire déjà présent")
    
    print("🎉 Redesign prêt! Les pages utiliseront maintenant le nouveau design.")