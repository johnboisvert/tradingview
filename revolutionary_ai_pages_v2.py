"""
Revolutionary AI Pages V2 - Design Ultra-Professionnel
Pages: /ai-exit, /ai-timeframe, /ai-liquidity, /ai-alerts, /ai-setup-builder, /ai-gem-hunter, /ai-technical-analysis
"""

import math
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

# ============================================================
# 🎨 STYLES CSS RÉVOLUTIONNAIRES V2
# ============================================================

REVOLUTIONARY_CSS_V2 = """
/* === REVOLUTIONARY AI DESIGN V2 === */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
    --bg-primary: #0a0f1a;
    --bg-secondary: #0d1526;
    --bg-card: linear-gradient(135deg, rgba(15, 25, 45, 0.95) 0%, rgba(10, 18, 35, 0.98) 100%);
    --bg-card-hover: linear-gradient(135deg, rgba(20, 35, 60, 0.95) 0%, rgba(15, 25, 50, 0.98) 100%);
    --border-primary: rgba(99, 179, 237, 0.15);
    --border-glow: rgba(99, 179, 237, 0.4);
    --text-primary: #ffffff;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --accent-blue: #3b82f6;
    --accent-cyan: #06b6d4;
    --accent-purple: #8b5cf6;
    --accent-green: #10b981;
    --accent-red: #ef4444;
    --accent-orange: #f59e0b;
    --accent-pink: #ec4899;
    --gradient-primary: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
    --gradient-success: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
    --gradient-danger: linear-gradient(135deg, #ef4444 0%, #f59e0b 100%);
    --gradient-premium: linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%);
    --shadow-glow: 0 0 40px rgba(59, 130, 246, 0.15);
    --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.4), 0 0 60px rgba(59, 130, 246, 0.05);
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
    min-height: 100vh;
    padding-left: 280px !important;
    background-image: 
        radial-gradient(ellipse at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.04) 0%, transparent 70%);
}

/* Scrollbar personnalisée */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); }
::-webkit-scrollbar-thumb { background: linear-gradient(180deg, var(--accent-blue), var(--accent-purple)); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, var(--accent-cyan), var(--accent-blue)); }

/* Container principal */
.rev-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 24px;
}

/* Hero Section */
.rev-hero {
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-xl);
    padding: 40px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-card);
}

.rev-hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--gradient-primary);
}

.rev-hero::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 60%;
    height: 200%;
    background: radial-gradient(ellipse, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
    pointer-events: none;
}

.rev-hero-content {
    position: relative;
    z-index: 1;
}

.rev-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: var(--accent-cyan);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 16px;
}

.rev-hero-badge .pulse {
    width: 8px;
    height: 8px;
    background: var(--accent-green);
    border-radius: 50%;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
}

.rev-hero h1 {
    font-size: 42px;
    font-weight: 800;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 12px;
    letter-spacing: -0.5px;
}

.rev-hero-subtitle {
    font-size: 18px;
    color: var(--text-secondary);
    max-width: 700px;
    line-height: 1.7;
}

.rev-hero-stats {
    display: flex;
    gap: 24px;
    margin-top: 28px;
    flex-wrap: wrap;
}

.rev-stat-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    transition: all 0.3s ease;
}

.rev-stat-pill:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: var(--border-glow);
    transform: translateY(-2px);
}

.rev-stat-pill .icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gradient-primary);
    border-radius: var(--radius-md);
    font-size: 18px;
}

.rev-stat-pill .label {
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.rev-stat-pill .value {
    font-size: 18px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
}

/* Cards Grid */
.rev-grid {
    display: grid;
    gap: 20px;
}

.rev-grid-2 { grid-template-columns: repeat(2, 1fr); }
.rev-grid-3 { grid-template-columns: repeat(3, 1fr); }
.rev-grid-4 { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 1200px) {
    .rev-grid-4 { grid-template-columns: repeat(2, 1fr); }
    .rev-grid-3 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
    body { padding-left: 0 !important; }
    .rev-grid-2, .rev-grid-3, .rev-grid-4 { grid-template-columns: 1fr; }
    .rev-hero { padding: 24px; }
    .rev-hero h1 { font-size: 28px; }
}

/* Card Component */
.rev-card {
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    padding: 24px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.rev-card:hover {
    border-color: var(--border-glow);
    transform: translateY(-4px);
    box-shadow: var(--shadow-glow);
}

.rev-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-primary);
}

.rev-card-title {
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
}

.rev-card-title .icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gradient-primary);
    border-radius: var(--radius-sm);
    font-size: 16px;
}

/* Table Styles */
.rev-table-container {
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-card);
}

.rev-table {
    width: 100%;
    border-collapse: collapse;
}

.rev-table thead {
    background: rgba(59, 130, 246, 0.08);
}

.rev-table th {
    padding: 16px 20px;
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    border-bottom: 1px solid var(--border-primary);
}

.rev-table td {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    vertical-align: middle;
}

.rev-table tbody tr {
    transition: all 0.2s ease;
}

.rev-table tbody tr:hover {
    background: rgba(59, 130, 246, 0.05);
}

.rev-table tbody tr:last-child td {
    border-bottom: none;
}

/* Coin Cell */
.coin-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.coin-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--gradient-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
}

.coin-info .symbol {
    font-weight: 700;
    font-size: 15px;
}

.coin-info .name {
    font-size: 12px;
    color: var(--text-muted);
}

/* Tags & Badges */
.rev-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
}

.rev-tag-success {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: var(--accent-green);
}

.rev-tag-danger {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: var(--accent-red);
}

.rev-tag-warning {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: var(--accent-orange);
}

.rev-tag-info {
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: var(--accent-blue);
}

.rev-tag-premium {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(236, 72, 153, 0.2));
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #fbbf24;
}

/* Score Bar */
.score-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-top: 6px;
}

.score-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
}

.score-bar-fill.high { background: var(--gradient-success); }
.score-bar-fill.medium { background: linear-gradient(90deg, var(--accent-orange), var(--accent-blue)); }
.score-bar-fill.low { background: var(--gradient-danger); }

/* Forms */
.rev-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.rev-form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.rev-form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.rev-form-group label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.rev-input, .rev-select {
    padding: 14px 18px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 15px;
    font-family: 'JetBrains Mono', monospace;
    transition: all 0.3s ease;
}

.rev-input:focus, .rev-select:focus {
    outline: none;
    border-color: var(--accent-blue);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.rev-input::placeholder {
    color: var(--text-muted);
}

.rev-select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 18px;
    padding-right: 44px;
}

.rev-select option {
    background: var(--bg-secondary);
    color: var(--text-primary);
}

/* Buttons */
.rev-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 28px;
    border: none;
    border-radius: var(--radius-md);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
}

.rev-btn-primary {
    background: var(--gradient-primary);
    color: white;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.rev-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(59, 130, 246, 0.4);
}

.rev-btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-primary);
    color: var(--text-primary);
}

.rev-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--border-glow);
}

/* Result Card */
.rev-result {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-top: 20px;
}

.rev-result-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
}

.rev-result-item {
    text-align: center;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: var(--radius-md);
}

.rev-result-item .label {
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
}

.rev-result-item .value {
    font-size: 24px;
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
}

.rev-result-item .value.green { color: var(--accent-green); }
.rev-result-item .value.red { color: var(--accent-red); }
.rev-result-item .value.blue { color: var(--accent-blue); }

/* Info Box */
.rev-info-box {
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: var(--radius-md);
    padding: 20px;
    margin-top: 20px;
}

.rev-info-box h3 {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.rev-info-box ul {
    list-style: none;
    padding: 0;
}

.rev-info-box li {
    padding: 8px 0;
    padding-left: 24px;
    position: relative;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.6;
}

.rev-info-box li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: var(--accent-cyan);
}

/* Animations */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-in {
    animation: fadeInUp 0.5s ease forwards;
}

.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }

/* Live indicator */
.live-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    color: var(--accent-green);
    text-transform: uppercase;
}

.live-indicator .dot {
    width: 6px;
    height: 6px;
    background: var(--accent-green);
    border-radius: 50%;
    animation: pulse 1.5s infinite;
}

/* Trend indicators */
.trend-up { color: var(--accent-green); }
.trend-down { color: var(--accent-red); }
.trend-neutral { color: var(--text-muted); }

/* Monospace values */
.mono {
    font-family: 'JetBrains Mono', monospace;
}

/* Glow effects */
.glow-blue { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
.glow-green { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
.glow-purple { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }

/* Alert types */
.alert-bullish {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1));
    border-left: 4px solid var(--accent-green);
}

.alert-bearish {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.1));
    border-left: 4px solid var(--accent-red);
}

.alert-neutral {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.1));
    border-left: 4px solid var(--accent-blue);
}
"""


def _escape_html(text):
    """Escape HTML characters."""
    if text is None:
        return ""
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def _fmt_usd(val):
    """Format USD value."""
    if val is None:
        return "—"
    try:
        v = float(val)
        if v >= 1_000_000_000:
            return f"${v/1_000_000_000:.2f}B"
        if v >= 1_000_000:
            return f"${v/1_000_000:.2f}M"
        if v >= 1_000:
            return f"${v:,.2f}"
        if v >= 1:
            return f"${v:.4f}"
        return f"${v:.6f}"
    except:
        return "—"


def _fmt_pct(val):
    """Format percentage with color."""
    if val is None:
        return '<span class="trend-neutral">—</span>'
    try:
        v = float(val)
        cls = "trend-up" if v > 0 else "trend-down" if v < 0 else "trend-neutral"
        sign = "+" if v > 0 else ""
        return f'<span class="{cls}">{sign}{v:.2f}%</span>'
    except:
        return '<span class="trend-neutral">—</span>'


def _now_utc_str():
    """Get current UTC time string."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


# ============================================================
# 📊 AI EXIT PAGE - Calculateur TP/SL Professionnel
# ============================================================

def get_ai_exit_page(sidebar_html: str, entry: str = "", stop: str = "", rr: str = "2", direction: str = "long") -> str:
    """Generate AI Exit page with professional TP/SL calculator."""
    
    result_html = ""
    if entry and stop:
        try:
            e = float(entry)
            s = float(stop)
            rr_f = float(rr)
            risk = abs(e - s)
            
            if risk <= 0:
                raise ValueError("Entry et Stop doivent être différents.")
            
            # Calculate multiple TPs
            tp1 = (e + risk * 1) if direction == "long" else (e - risk * 1)
            tp2 = (e + risk * rr_f) if direction == "long" else (e - risk * rr_f)
            tp3 = (e + risk * (rr_f * 1.5)) if direction == "long" else (e - risk * (rr_f * 1.5))
            
            # Calculate risk percentage
            risk_pct = (risk / e) * 100
            
            # Potential profit
            profit_1r = risk
            profit_target = risk * rr_f
            
            result_html = f"""
            <div class="rev-result animate-in">
                <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">🎯</span>
                    Résultats du Calcul
                </h3>
                <div class="rev-result-grid">
                    <div class="rev-result-item">
                        <div class="label">Entry Price</div>
                        <div class="value blue">{e:,.6f}</div>
                    </div>
                    <div class="rev-result-item">
                        <div class="label">Stop Loss</div>
                        <div class="value red">{s:,.6f}</div>
                    </div>
                    <div class="rev-result-item">
                        <div class="label">Risk</div>
                        <div class="value" style="color: var(--accent-orange);">{risk_pct:.2f}%</div>
                    </div>
                    <div class="rev-result-item">
                        <div class="label">Direction</div>
                        <div class="value {'green' if direction == 'long' else 'red'}">{'📈 LONG' if direction == 'long' else '📉 SHORT'}</div>
                    </div>
                </div>
                
                <div style="margin-top: 24px;">
                    <h4 style="margin-bottom: 16px; color: var(--text-secondary);">📊 Take Profit Levels</h4>
                    <div class="rev-grid rev-grid-3">
                        <div class="rev-card" style="border-color: rgba(16, 185, 129, 0.3);">
                            <div style="text-align: center;">
                                <div class="rev-tag rev-tag-success" style="margin-bottom: 12px;">TP1 (1R)</div>
                                <div class="mono" style="font-size: 20px; font-weight: 700; color: var(--accent-green);">{tp1:,.6f}</div>
                                <div style="margin-top: 8px; color: var(--text-muted); font-size: 13px;">Profit: {_fmt_usd(profit_1r)}</div>
                            </div>
                        </div>
                        <div class="rev-card" style="border-color: rgba(6, 182, 212, 0.3);">
                            <div style="text-align: center;">
                                <div class="rev-tag rev-tag-info" style="margin-bottom: 12px;">TP2 ({rr_f}R)</div>
                                <div class="mono" style="font-size: 20px; font-weight: 700; color: var(--accent-cyan);">{tp2:,.6f}</div>
                                <div style="margin-top: 8px; color: var(--text-muted); font-size: 13px;">Profit: {_fmt_usd(profit_target)}</div>
                            </div>
                        </div>
                        <div class="rev-card" style="border-color: rgba(139, 92, 246, 0.3);">
                            <div style="text-align: center;">
                                <div class="rev-tag rev-tag-premium" style="margin-bottom: 12px;">TP3 ({rr_f * 1.5:.1f}R)</div>
                                <div class="mono" style="font-size: 20px; font-weight: 700; color: var(--accent-purple);">{tp3:,.6f}</div>
                                <div style="margin-top: 8px; color: var(--text-muted); font-size: 13px;">Profit: {_fmt_usd(risk * rr_f * 1.5)}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="rev-info-box" style="margin-top: 20px; background: rgba(139, 92, 246, 0.08); border-color: rgba(139, 92, 246, 0.2);">
                    <h3>💡 Stratégie Recommandée</h3>
                    <ul>
                        <li><b>TP1 (1R)</b> : Sécurise 30-50% de ta position pour couvrir le risque</li>
                        <li><b>TP2 ({rr_f}R)</b> : Objectif principal - prends 30-40% ici</li>
                        <li><b>TP3 ({rr_f * 1.5:.1f}R)</b> : Laisse runner le reste avec un trailing stop</li>
                        <li>Déplace ton SL à breakeven après TP1 atteint</li>
                    </ul>
                </div>
            </div>
            """
        except Exception as ex:
            result_html = f"""
            <div class="rev-card" style="margin-top: 20px; border-color: var(--accent-red);">
                <div style="display: flex; align-items: center; gap: 12px; color: var(--accent-red);">
                    <span style="font-size: 24px;">⚠️</span>
                    <div>
                        <div style="font-weight: 700;">Erreur de calcul</div>
                        <div style="color: var(--text-secondary); font-size: 14px;">{_escape_html(str(ex))}</div>
                    </div>
                </div>
            </div>
            """
    
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Exit — Calculateur TP/SL Professionnel | CryptoIA</title>
    <style>{REVOLUTIONARY_CSS_V2}</style>
</head>
<body>
    {sidebar_html}
    <div class="rev-container">
        <div class="rev-hero animate-in">
            <div class="rev-hero-content">
                <div class="rev-hero-badge">
                    <span class="pulse"></span>
                    Outil de Trading Avancé
                </div>
                <h1>🎯 AI Exit Strategy</h1>
                <p class="rev-hero-subtitle">
                    Calculez vos niveaux de Take Profit et Stop Loss optimaux basés sur le ratio Risk/Reward.
                    Maximisez vos gains tout en protégeant votre capital.
                </p>
                <div class="rev-hero-stats">
                    <div class="rev-stat-pill">
                        <div class="icon">📊</div>
                        <div>
                            <div class="label">Méthode</div>
                            <div class="value">R:R Ratio</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">🎯</div>
                        <div>
                            <div class="label">Multi-TP</div>
                            <div class="value">3 Niveaux</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">⚡</div>
                        <div>
                            <div class="label">Calcul</div>
                            <div class="value">Instantané</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="rev-card animate-in delay-1">
            <div class="rev-card-header">
                <div class="rev-card-title">
                    <div class="icon">⚙️</div>
                    Paramètres du Trade
                </div>
                <div class="live-indicator">
                    <span class="dot"></span>
                    Prêt
                </div>
            </div>
            
            <form method="get" class="rev-form">
                <div class="rev-form-row">
                    <div class="rev-form-group">
                        <label>Prix d'Entrée</label>
                        <input type="text" name="entry" value="{_escape_html(entry)}" placeholder="Ex: 45000" class="rev-input">
                    </div>
                    <div class="rev-form-group">
                        <label>Stop Loss</label>
                        <input type="text" name="stop" value="{_escape_html(stop)}" placeholder="Ex: 44000" class="rev-input">
                    </div>
                    <div class="rev-form-group">
                        <label>Ratio R:R</label>
                        <input type="text" name="rr" value="{_escape_html(rr)}" placeholder="Ex: 2" class="rev-input">
                    </div>
                    <div class="rev-form-group">
                        <label>Direction</label>
                        <select name="direction" class="rev-select">
                            <option value="long" {'selected' if direction == 'long' else ''}>📈 Long</option>
                            <option value="short" {'selected' if direction == 'short' else ''}>📉 Short</option>
                        </select>
                    </div>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 8px;">
                    <button type="submit" class="rev-btn rev-btn-primary">
                        <span>🎯</span> Calculer les Niveaux
                    </button>
                    <button type="reset" class="rev-btn rev-btn-secondary">
                        <span>🔄</span> Réinitialiser
                    </button>
                </div>
            </form>
            
            {result_html}
        </div>
        
        <div class="rev-info-box animate-in delay-2">
            <h3>📚 Guide d'Utilisation</h3>
            <ul>
                <li><b>Entry</b> : Le prix auquel tu prévois d'entrer dans le trade</li>
                <li><b>Stop Loss</b> : Le niveau où tu coupes ta perte (en dessous pour Long, au-dessus pour Short)</li>
                <li><b>Ratio R:R</b> : Combien tu veux gagner par rapport à ce que tu risques (2 = 2x le risque)</li>
                <li><b>Conseil Pro</b> : Vise minimum 2R pour être profitable même avec 40% de winrate</li>
            </ul>
        </div>
    </div>
</body>
</html>"""


# ============================================================
# ⏱️ AI TIMEFRAME PAGE - Recommandation de Timeframe
# ============================================================

def get_ai_timeframe_page(sidebar_html: str, btc_price: float = None, btc_change: float = None, 
                          volatility: float = None, regime: str = "Normal") -> str:
    """Generate AI Timeframe page with volatility-based recommendations."""
    
    # Determine recommendations based on volatility
    if regime in ("Volatilité très élevée", "Volatilité élevée"):
        recommendations = [
            ("Scalp", "5m → 15m", "Setups rapides, stops serrés, profits partiels fréquents", "⚡", "rev-tag-danger"),
            ("Day Trade", "15m → 1h", "Attends confirmations, évite l'overtrade", "📊", "rev-tag-warning"),
            ("Swing", "4h", "Réduis la taille, vise les zones clés", "🎯", "rev-tag-info"),
        ]
    else:
        recommendations = [
            ("Scalp", "15m", "Privilégie la précision (VWAP/levels)", "⚡", "rev-tag-info"),
            ("Day Trade", "1h → 4h", "Meilleure lisibilité structurelle", "📊", "rev-tag-success"),
            ("Swing", "4h → 1D", "Signaux plus durables, setups plus propres", "🎯", "rev-tag-success"),
        ]
    
    vol_color = "var(--accent-red)" if volatility and volatility >= 0.70 else "var(--accent-green)" if volatility and volatility <= 0.45 else "var(--accent-orange)"
    
    rec_cards = ""
    for style, tf, desc, icon, tag_class in recommendations:
        rec_cards += f"""
        <div class="rev-card" style="text-align: center;">
            <div style="font-size: 32px; margin-bottom: 12px;">{icon}</div>
            <div class="rev-tag {tag_class}" style="margin-bottom: 12px;">{style}</div>
            <div class="mono" style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">{tf}</div>
            <div style="color: var(--text-secondary); font-size: 13px;">{desc}</div>
        </div>
        """
    
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Timeframe — Recommandation Intelligente | CryptoIA</title>
    <style>{REVOLUTIONARY_CSS_V2}</style>
</head>
<body>
    {sidebar_html}
    <div class="rev-container">
        <div class="rev-hero animate-in">
            <div class="rev-hero-content">
                <div class="rev-hero-badge">
                    <span class="pulse"></span>
                    Analyse en Temps Réel
                </div>
                <h1>⏱️ AI Timeframe Advisor</h1>
                <p class="rev-hero-subtitle">
                    Recommandation intelligente de timeframe basée sur la volatilité actuelle du marché Bitcoin.
                    Adaptez votre stratégie aux conditions du marché.
                </p>
                <div class="rev-hero-stats">
                    <div class="rev-stat-pill">
                        <div class="icon">₿</div>
                        <div>
                            <div class="label">BTC Price</div>
                            <div class="value">{_fmt_usd(btc_price)}</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">📈</div>
                        <div>
                            <div class="label">24h Change</div>
                            <div class="value">{_fmt_pct(btc_change)}</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">📊</div>
                        <div>
                            <div class="label">Volatilité (30j)</div>
                            <div class="value" style="color: {vol_color};">{f'{volatility*100:.1f}%' if volatility else '—'}</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">🎯</div>
                        <div>
                            <div class="label">Régime</div>
                            <div class="value">{regime}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="rev-card animate-in delay-1">
            <div class="rev-card-header">
                <div class="rev-card-title">
                    <div class="icon">🎯</div>
                    Timeframes Recommandés
                </div>
                <div class="live-indicator">
                    <span class="dot"></span>
                    {_now_utc_str()}
                </div>
            </div>
            
            <div class="rev-grid rev-grid-3">
                {rec_cards}
            </div>
        </div>
        
        <div class="rev-grid rev-grid-2 animate-in delay-2">
            <div class="rev-info-box" style="margin-top: 0;">
                <h3>📊 Comment Interpréter</h3>
                <ul>
                    <li><b>Volatilité élevée (≥70%)</b> : Mouvements rapides, timeframes courts préférables</li>
                    <li><b>Volatilité normale (45-70%)</b> : Conditions standard, flexibilité maximale</li>
                    <li><b>Volatilité faible (≤45%)</b> : Mouvements lents, timeframes longs plus fiables</li>
                    <li>La volatilité est calculée sur 30 jours et annualisée</li>
                </ul>
            </div>
            
            <div class="rev-info-box" style="margin-top: 0; background: rgba(139, 92, 246, 0.08); border-color: rgba(139, 92, 246, 0.2);">
                <h3>💡 Conseils Pro</h3>
                <ul>
                    <li>Commence par le TF conseillé, puis descends pour affiner l'entrée</li>
                    <li>Combine avec <b>AI Market Regime</b> pour adapter ta stratégie</li>
                    <li>En haute volatilité : réduis ta taille de position</li>
                    <li>Utilise plusieurs TF pour confirmation (ex: 4h trend + 15m entry)</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>"""


# ============================================================
# 💧 AI LIQUIDITY PAGE - Score de Liquidité
# ============================================================

def get_ai_liquidity_page(sidebar_html: str, coins_data: list) -> str:
    """Generate AI Liquidity page with liquidity scores."""
    
    # Process and sort coins by liquidity score
    items = []
    ratios = []
    
    for c in coins_data:
        vol = c.get("total_volume") or 0
        mcap = c.get("market_cap") or 0
        ratio = (float(vol) / float(mcap)) if mcap > 0 else 0.0
        ratios.append(ratio)
    
    max_ratio = max(ratios) if ratios else 0.0
    
    for i, c in enumerate(coins_data):
        sym = (c.get("symbol") or "").upper()
        name = c.get("name") or sym
        price = c.get("current_price")
        ch24 = c.get("price_change_percentage_24h")
        vol = c.get("total_volume") or 0
        mcap = c.get("market_cap") or 0
        ratio = ratios[i] if i < len(ratios) else 0.0
        
        # Calculate score
        score = 0
        if max_ratio > 0 and ratio > 0:
            score = min(100, int(100 * (math.log10(ratio * 100 + 1) / math.log10(max_ratio * 100 + 1))))
        
        # Determine tier
        if score >= 70:
            tier, tag_class, bar_class = "Élevée", "rev-tag-success", "high"
        elif score >= 40:
            tier, tag_class, bar_class = "Moyenne", "rev-tag-warning", "medium"
        else:
            tier, tag_class, bar_class = "Faible", "rev-tag-danger", "low"
        
        items.append({
            "sym": sym, "name": name, "price": price, "ch24": ch24,
            "mcap": mcap, "vol": vol, "ratio": ratio, "score": score,
            "tier": tier, "tag_class": tag_class, "bar_class": bar_class
        })
    
    # Sort by score descending
    items.sort(key=lambda x: (-x["score"], -x["ratio"]))
    
    # Generate table rows
    table_rows = ""
    for r in items[:50]:
        table_rows += f"""
        <tr>
            <td>
                <div class="coin-cell">
                    <div class="coin-icon">{r['sym'][:2]}</div>
                    <div class="coin-info">
                        <div class="symbol">{r['sym']}</div>
                        <div class="name">{r['name']}</div>
                    </div>
                </div>
            </td>
            <td class="mono">{_fmt_usd(r['price'])}</td>
            <td>{_fmt_pct(r['ch24'])}</td>
            <td class="mono">{_fmt_usd(r['mcap'])}</td>
            <td class="mono">{_fmt_usd(r['vol'])}</td>
            <td class="mono">{r['ratio']*100:.2f}%</td>
            <td>
                <div style="min-width: 120px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span class="{r['tag_class']}" style="font-size: 11px;">{r['tier']}</span>
                        <span class="mono" style="font-weight: 700;">{r['score']}/100</span>
                    </div>
                    <div class="score-bar">
                        <div class="score-bar-fill {r['bar_class']}" style="width: {r['score']}%;"></div>
                    </div>
                </div>
            </td>
        </tr>
        """
    
    # Stats
    high_liq = len([i for i in items if i['score'] >= 70])
    med_liq = len([i for i in items if 40 <= i['score'] < 70])
    low_liq = len([i for i in items if i['score'] < 40])
    
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Liquidity — Score de Liquidité | CryptoIA</title>
    <style>{REVOLUTIONARY_CSS_V2}</style>
</head>
<body>
    {sidebar_html}
    <div class="rev-container">
        <div class="rev-hero animate-in">
            <div class="rev-hero-content">
                <div class="rev-hero-badge">
                    <span class="pulse"></span>
                    Données Temps Réel
                </div>
                <h1>💧 AI Liquidity Scanner</h1>
                <p class="rev-hero-subtitle">
                    Analysez la liquidité relative des top cryptomonnaies. Un score élevé = exécutions plus propres, 
                    moins de slippage, et des mouvements plus prévisibles.
                </p>
                <div class="rev-hero-stats">
                    <div class="rev-stat-pill">
                        <div class="icon">🟢</div>
                        <div>
                            <div class="label">Liquidité Élevée</div>
                            <div class="value" style="color: var(--accent-green);">{high_liq}</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">🟡</div>
                        <div>
                            <div class="label">Liquidité Moyenne</div>
                            <div class="value" style="color: var(--accent-orange);">{med_liq}</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">🔴</div>
                        <div>
                            <div class="label">Liquidité Faible</div>
                            <div class="value" style="color: var(--accent-red);">{low_liq}</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">📊</div>
                        <div>
                            <div class="label">Total Analysé</div>
                            <div class="value">{len(items)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="rev-table-container animate-in delay-1">
            <div style="padding: 20px; border-bottom: 1px solid var(--border-primary); display: flex; justify-content: space-between; align-items: center;">
                <div class="rev-card-title">
                    <div class="icon">📊</div>
                    Top 50 par Market Cap
                </div>
                <div class="live-indicator">
                    <span class="dot"></span>
                    {_now_utc_str()}
                </div>
            </div>
            <table class="rev-table">
                <thead>
                    <tr>
                        <th>Coin</th>
                        <th>Prix</th>
                        <th>24h</th>
                        <th>Market Cap</th>
                        <th>Volume 24h</th>
                        <th>Vol/MCap</th>
                        <th>Score Liquidité</th>
                    </tr>
                </thead>
                <tbody>
                    {table_rows if table_rows else '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">Aucune donnée disponible</td></tr>'}
                </tbody>
            </table>
        </div>
        
        <div class="rev-grid rev-grid-2 animate-in delay-2" style="margin-top: 24px;">
            <div class="rev-info-box" style="margin-top: 0;">
                <h3>📊 Comment Utiliser</h3>
                <ul>
                    <li><b>Score ≥70</b> : Conditions optimales pour le trading actif</li>
                    <li><b>Score 40-69</b> : Acceptable mais attention au slippage</li>
                    <li><b>Score &lt;40</b> : Éviter le scalping, risque de manipulation</li>
                    <li>Le ratio Vol/MCap mesure l'activité relative du marché</li>
                </ul>
            </div>
            
            <div class="rev-info-box" style="margin-top: 0; background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.2);">
                <h3>💡 Pourquoi C'est Important</h3>
                <ul>
                    <li>Haute liquidité = spreads serrés et exécution rapide</li>
                    <li>Faible liquidité = mèches imprévisibles et manipulation</li>
                    <li>Combine avec AI Alerts pour trouver les meilleures opportunités</li>
                    <li>Données CoinGecko mises à jour en temps réel</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>"""


# ============================================================
# 🚨 AI ALERTS PAGE - Alertes de Marché
# ============================================================

def get_ai_alerts_page(sidebar_html: str, alerts_data: list) -> str:
    """Generate AI Alerts page with market alerts."""
    
    # Process alerts
    alerts_html = ""
    bullish_count = 0
    bearish_count = 0
    neutral_count = 0
    
    for alert in alerts_data[:20]:
        symbol = alert.get("symbol", "").upper()
        name = alert.get("name", symbol)
        price = alert.get("price")
        change_1h = alert.get("ch1") or alert.get("change_1h") or 0
        change_24h = alert.get("ch24") or alert.get("change_24h") or 0
        change_7d = alert.get("ch7") or alert.get("change_7d") or 0
        volume = alert.get("volume") or alert.get("v2m") or 0
        confidence = alert.get("confidence", 50)
        alert_type = alert.get("type", "neutral")
        reason = alert.get("reason", "Signal détecté")
        
        # Determine alert class
        if alert_type == "bullish" or (change_24h and change_24h > 5):
            alert_class = "alert-bullish"
            icon = "🟢"
            bullish_count += 1
        elif alert_type == "bearish" or (change_24h and change_24h < -5):
            alert_class = "alert-bearish"
            icon = "🔴"
            bearish_count += 1
        else:
            alert_class = "alert-neutral"
            icon = "🔵"
            neutral_count += 1
        
        alerts_html += f"""
        <div class="rev-card {alert_class}" style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 28px;">{icon}</div>
                    <div>
                        <div style="font-weight: 700; font-size: 18px;">{symbol}</div>
                        <div style="color: var(--text-muted); font-size: 13px;">{name}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div class="mono" style="font-size: 20px; font-weight: 700;">{_fmt_usd(price)}</div>
                    <div style="display: flex; gap: 12px; margin-top: 4px;">
                        <span style="font-size: 12px;">1h: {_fmt_pct(change_1h)}</span>
                        <span style="font-size: 12px;">24h: {_fmt_pct(change_24h)}</span>
                        <span style="font-size: 12px;">7d: {_fmt_pct(change_7d)}</span>
                    </div>
                </div>
            </div>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div style="color: var(--text-secondary); font-size: 14px;">
                        <b>Signal:</b> {_escape_html(reason)}
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="font-size: 12px; color: var(--text-muted);">Confiance:</span>
                        <div style="width: 80px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px;">
                            <div style="width: {confidence}%; height: 100%; background: var(--gradient-primary); border-radius: 3px;"></div>
                        </div>
                        <span class="mono" style="font-size: 12px;">{confidence}%</span>
                    </div>
                </div>
            </div>
        </div>
        """
    
    if not alerts_html:
        alerts_html = """
        <div class="rev-card" style="text-align: center; padding: 60px;">
            <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Aucune alerte active</div>
            <div style="color: var(--text-muted);">Les alertes apparaîtront ici lorsque des mouvements significatifs seront détectés.</div>
        </div>
        """
    
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Alerts — Alertes de Marché | CryptoIA</title>
    <style>{REVOLUTIONARY_CSS_V2}</style>
</head>
<body>
    {sidebar_html}
    <div class="rev-container">
        <div class="rev-hero animate-in">
            <div class="rev-hero-content">
                <div class="rev-hero-badge">
                    <span class="pulse"></span>
                    Alertes en Direct
                </div>
                <h1>🚨 AI Market Alerts</h1>
                <p class="rev-hero-subtitle">
                    Surveillance intelligente du marché crypto. Recevez des alertes en temps réel sur les mouvements 
                    significatifs, les breakouts et les opportunités de trading.
                </p>
                <div class="rev-hero-stats">
                    <div class="rev-stat-pill">
                        <div class="icon" style="background: var(--gradient-success);">🟢</div>
                        <div>
                            <div class="label">Bullish</div>
                            <div class="value" style="color: var(--accent-green);">{bullish_count}</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon" style="background: var(--gradient-danger);">🔴</div>
                        <div>
                            <div class="label">Bearish</div>
                            <div class="value" style="color: var(--accent-red);">{bearish_count}</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">🔵</div>
                        <div>
                            <div class="label">Neutral</div>
                            <div class="value">{neutral_count}</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">⏰</div>
                        <div>
                            <div class="label">Mise à jour</div>
                            <div class="value" style="font-size: 12px;">{_now_utc_str()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 16px;" class="animate-in delay-1">
            {alerts_html}
        </div>
        
        <div class="rev-info-box animate-in delay-2" style="margin-top: 24px;">
            <h3>📊 Types d'Alertes</h3>
            <ul>
                <li><b>🟢 Bullish</b> : Mouvement haussier significatif (+5% ou plus en 24h)</li>
                <li><b>🔴 Bearish</b> : Mouvement baissier significatif (-5% ou plus en 24h)</li>
                <li><b>🔵 Neutral</b> : Signal technique détecté sans direction claire</li>
                <li>Les alertes sont basées sur les données CoinGecko en temps réel</li>
            </ul>
        </div>
    </div>
</body>
</html>"""


# ============================================================
# 🔧 AI SETUP BUILDER PAGE - Constructeur de Setup
# ============================================================

def get_ai_setup_builder_page(sidebar_html: str, symbol: str = "", timeframe: str = "1h", 
                               strategy: str = "", setup_result: dict = None) -> str:
    """Generate AI Setup Builder page."""
    
    result_html = ""
    if setup_result:
        result_html = f"""
        <div class="rev-result animate-in" style="margin-top: 24px;">
            <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">🎯</span>
                Setup Généré
            </h3>
            <div class="rev-result-grid">
                <div class="rev-result-item">
                    <div class="label">Symbole</div>
                    <div class="value blue">{setup_result.get('symbol', symbol)}</div>
                </div>
                <div class="rev-result-item">
                    <div class="label">Direction</div>
                    <div class="value {'green' if setup_result.get('direction') == 'LONG' else 'red'}">{setup_result.get('direction', 'N/A')}</div>
                </div>
                <div class="rev-result-item">
                    <div class="label">Entry Zone</div>
                    <div class="value">{setup_result.get('entry', 'N/A')}</div>
                </div>
                <div class="rev-result-item">
                    <div class="label">Stop Loss</div>
                    <div class="value red">{setup_result.get('stop', 'N/A')}</div>
                </div>
                <div class="rev-result-item">
                    <div class="label">Take Profit</div>
                    <div class="value green">{setup_result.get('tp', 'N/A')}</div>
                </div>
                <div class="rev-result-item">
                    <div class="label">R:R Ratio</div>
                    <div class="value">{setup_result.get('rr', 'N/A')}</div>
                </div>
            </div>
            
            <div class="rev-info-box" style="margin-top: 20px;">
                <h3>📝 Notes du Setup</h3>
                <p style="color: var(--text-secondary); line-height: 1.7;">
                    {setup_result.get('notes', 'Aucune note supplémentaire.')}
                </p>
            </div>
        </div>
        """
    
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Setup Builder — Constructeur de Setup | CryptoIA</title>
    <style>{REVOLUTIONARY_CSS_V2}</style>
</head>
<body>
    {sidebar_html}
    <div class="rev-container">
        <div class="rev-hero animate-in">
            <div class="rev-hero-content">
                <div class="rev-hero-badge">
                    <span class="pulse"></span>
                    Assistant IA
                </div>
                <h1>🔧 AI Setup Builder</h1>
                <p class="rev-hero-subtitle">
                    Construisez des setups de trading professionnels avec l'aide de l'IA. 
                    Définissez vos paramètres et obtenez des recommandations personnalisées.
                </p>
                <div class="rev-hero-stats">
                    <div class="rev-stat-pill">
                        <div class="icon">📊</div>
                        <div>
                            <div class="label">Stratégies</div>
                            <div class="value">5+</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">⏱️</div>
                        <div>
                            <div class="label">Timeframes</div>
                            <div class="value">6</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">🎯</div>
                        <div>
                            <div class="label">Précision</div>
                            <div class="value">IA</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="rev-card animate-in delay-1">
            <div class="rev-card-header">
                <div class="rev-card-title">
                    <div class="icon">⚙️</div>
                    Paramètres du Setup
                </div>
            </div>
            
            <form method="post" action="/ai-setup-builder/generate" class="rev-form">
                <div class="rev-form-row">
                    <div class="rev-form-group">
                        <label>Symbole</label>
                        <input type="text" name="symbol" value="{_escape_html(symbol)}" placeholder="Ex: BTCUSDT" class="rev-input">
                    </div>
                    <div class="rev-form-group">
                        <label>Timeframe</label>
                        <select name="timeframe" class="rev-select">
                            <option value="5m" {'selected' if timeframe == '5m' else ''}>5 minutes</option>
                            <option value="15m" {'selected' if timeframe == '15m' else ''}>15 minutes</option>
                            <option value="1h" {'selected' if timeframe == '1h' else ''}>1 heure</option>
                            <option value="4h" {'selected' if timeframe == '4h' else ''}>4 heures</option>
                            <option value="1d" {'selected' if timeframe == '1d' else ''}>1 jour</option>
                            <option value="1w" {'selected' if timeframe == '1w' else ''}>1 semaine</option>
                        </select>
                    </div>
                    <div class="rev-form-group">
                        <label>Stratégie</label>
                        <select name="strategy" class="rev-select">
                            <option value="breakout" {'selected' if strategy == 'breakout' else ''}>Breakout</option>
                            <option value="pullback" {'selected' if strategy == 'pullback' else ''}>Pullback</option>
                            <option value="reversal" {'selected' if strategy == 'reversal' else ''}>Reversal</option>
                            <option value="trend" {'selected' if strategy == 'trend' else ''}>Trend Following</option>
                            <option value="range" {'selected' if strategy == 'range' else ''}>Range Trading</option>
                        </select>
                    </div>
                </div>
                
                <div class="rev-form-group">
                    <label>Notes additionnelles (optionnel)</label>
                    <textarea name="notes" class="rev-input" style="min-height: 100px; resize: vertical;" placeholder="Décrivez le contexte du marché, vos observations..."></textarea>
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button type="submit" class="rev-btn rev-btn-primary">
                        <span>🚀</span> Générer le Setup
                    </button>
                    <button type="reset" class="rev-btn rev-btn-secondary">
                        <span>🔄</span> Réinitialiser
                    </button>
                </div>
            </form>
            
            {result_html}
        </div>
        
        <div class="rev-grid rev-grid-2 animate-in delay-2" style="margin-top: 24px;">
            <div class="rev-info-box" style="margin-top: 0;">
                <h3>📊 Stratégies Disponibles</h3>
                <ul>
                    <li><b>Breakout</b> : Entrée sur cassure de niveau clé</li>
                    <li><b>Pullback</b> : Entrée sur retracement dans la tendance</li>
                    <li><b>Reversal</b> : Entrée sur retournement de tendance</li>
                    <li><b>Trend Following</b> : Suivi de tendance classique</li>
                    <li><b>Range Trading</b> : Trading dans un range défini</li>
                </ul>
            </div>
            
            <div class="rev-info-box" style="margin-top: 0; background: rgba(139, 92, 246, 0.08); border-color: rgba(139, 92, 246, 0.2);">
                <h3>💡 Conseils</h3>
                <ul>
                    <li>Utilisez le timeframe adapté à votre style de trading</li>
                    <li>Combinez avec AI Technical Analysis pour confirmation</li>
                    <li>Respectez toujours votre gestion du risque</li>
                    <li>Les setups générés sont des suggestions, pas des conseils financiers</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>"""


# ============================================================
# 💎 AI GEM HUNTER PAGE - Découverte de Pépites
# ============================================================

def get_ai_gem_hunter_page(sidebar_html: str, trending_coins: list) -> str:
    """Generate AI Gem Hunter page with trending coins."""
    
    coins_html = ""
    for i, coin in enumerate(trending_coins[:15]):
        item = coin.get("item", {}) if isinstance(coin, dict) else {}
        name = item.get("name", "Unknown")
        symbol = item.get("symbol", "???").upper()
        rank = item.get("market_cap_rank", "N/A")
        score = item.get("score", i)
        thumb = item.get("thumb", "")
        price_btc = item.get("price_btc", 0)
        
        # Determine gem tier based on rank
        if rank and isinstance(rank, int):
            if rank <= 50:
                tier = "🏆 Top 50"
                tier_class = "rev-tag-premium"
            elif rank <= 100:
                tier = "💎 Top 100"
                tier_class = "rev-tag-success"
            elif rank <= 300:
                tier = "🔥 Rising"
                tier_class = "rev-tag-warning"
            else:
                tier = "🌟 Hidden Gem"
                tier_class = "rev-tag-info"
        else:
            tier = "🆕 New"
            tier_class = "rev-tag-info"
        
        coins_html += f"""
        <div class="rev-card" style="transition: all 0.3s ease;">
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="position: relative;">
                    <div class="coin-icon" style="width: 56px; height: 56px; font-size: 18px;">
                        {symbol[:2]}
                    </div>
                    <div style="position: absolute; top: -4px; right: -4px; background: var(--gradient-premium); width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">
                        #{i+1}
                    </div>
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="font-weight: 700; font-size: 18px;">{symbol}</span>
                        <span class="{tier_class}" style="font-size: 10px; padding: 4px 8px;">{tier}</span>
                    </div>
                    <div style="color: var(--text-muted); font-size: 14px;">{name}</div>
                </div>
                <div style="text-align: right;">
                    <div style="color: var(--text-muted); font-size: 12px;">Market Cap Rank</div>
                    <div class="mono" style="font-size: 20px; font-weight: 700;">#{rank if rank else 'N/A'}</div>
                </div>
            </div>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-primary);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="color: var(--text-secondary); font-size: 13px;">
                        <span style="margin-right: 16px;">🔥 Trending Score: <b>{score + 1}</b></span>
                    </div>
                    <a href="https://www.coingecko.com/en/coins/{item.get('id', '')}" target="_blank" class="rev-btn rev-btn-secondary" style="padding: 8px 16px; font-size: 13px;">
                        Voir sur CoinGecko →
                    </a>
                </div>
            </div>
        </div>
        """
    
    if not coins_html:
        coins_html = """
        <div class="rev-card" style="text-align: center; padding: 60px;">
            <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Recherche en cours...</div>
            <div style="color: var(--text-muted);">Les pépites trending apparaîtront ici.</div>
        </div>
        """
    
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Gem Hunter — Découverte de Pépites | CryptoIA</title>
    <style>{REVOLUTIONARY_CSS_V2}</style>
</head>
<body>
    {sidebar_html}
    <div class="rev-container">
        <div class="rev-hero animate-in">
            <div class="rev-hero-content">
                <div class="rev-hero-badge">
                    <span class="pulse"></span>
                    Trending Now
                </div>
                <h1>💎 AI Gem Hunter</h1>
                <p class="rev-hero-subtitle">
                    Découvrez les cryptomonnaies qui font le buzz ! Notre scanner IA identifie les pépites 
                    trending sur CoinGecko en temps réel.
                </p>
                <div class="rev-hero-stats">
                    <div class="rev-stat-pill">
                        <div class="icon">🔥</div>
                        <div>
                            <div class="label">Trending</div>
                            <div class="value">{len(trending_coins)}</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">📊</div>
                        <div>
                            <div class="label">Source</div>
                            <div class="value">CoinGecko</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">⏰</div>
                        <div>
                            <div class="label">Mise à jour</div>
                            <div class="value" style="font-size: 12px;">{_now_utc_str()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="display: grid; gap: 16px;" class="animate-in delay-1">
            {coins_html}
        </div>
        
        <div class="rev-grid rev-grid-2 animate-in delay-2" style="margin-top: 24px;">
            <div class="rev-info-box" style="margin-top: 0;">
                <h3>📊 Classification des Gems</h3>
                <ul>
                    <li><b>🏆 Top 50</b> : Projets établis avec forte capitalisation</li>
                    <li><b>💎 Top 100</b> : Projets solides en croissance</li>
                    <li><b>🔥 Rising</b> : Projets en forte progression</li>
                    <li><b>🌟 Hidden Gem</b> : Petites caps à fort potentiel</li>
                </ul>
            </div>
            
            <div class="rev-info-box" style="margin-top: 0; background: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.2);">
                <h3>⚠️ Avertissement</h3>
                <ul>
                    <li>Les coins trending ne sont PAS des recommandations d'achat</li>
                    <li>DYOR (Do Your Own Research) avant tout investissement</li>
                    <li>Les petites caps sont très volatiles et risquées</li>
                    <li>N'investissez que ce que vous pouvez vous permettre de perdre</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>"""


# ============================================================
# 📈 AI TECHNICAL ANALYSIS PAGE - Analyse Technique
# ============================================================

def get_ai_technical_analysis_page(sidebar_html: str, symbol: str = "BTCUSDT", interval: str = "1h",
                                    analysis_data: dict = None) -> str:
    """Generate AI Technical Analysis page."""
    
    result_html = ""
    if analysis_data:
        close = analysis_data.get("close", 0)
        ema20 = analysis_data.get("ema20", 0)
        ema50 = analysis_data.get("ema50", 0)
        rsi = analysis_data.get("rsi", 50)
        trend = analysis_data.get("trend", "Neutral")
        macd = analysis_data.get("macd", 0)
        signal = analysis_data.get("signal", 0)
        bb_upper = analysis_data.get("bb_upper", 0)
        bb_lower = analysis_data.get("bb_lower", 0)
        
        # Determine overall signal
        signals = []
        if ema20 > ema50:
            signals.append(("EMA Cross", "Bullish", "rev-tag-success"))
        else:
            signals.append(("EMA Cross", "Bearish", "rev-tag-danger"))
        
        if rsi < 30:
            signals.append(("RSI", "Oversold", "rev-tag-success"))
        elif rsi > 70:
            signals.append(("RSI", "Overbought", "rev-tag-danger"))
        else:
            signals.append(("RSI", "Neutral", "rev-tag-info"))
        
        if macd > signal:
            signals.append(("MACD", "Bullish", "rev-tag-success"))
        else:
            signals.append(("MACD", "Bearish", "rev-tag-danger"))
        
        signals_html = ""
        for name, status, tag_class in signals:
            signals_html += f"""
            <div class="rev-card" style="text-align: center; padding: 16px;">
                <div style="color: var(--text-muted); font-size: 12px; margin-bottom: 8px;">{name}</div>
                <span class="{tag_class}">{status}</span>
            </div>
            """
        
        # RSI gauge color
        rsi_color = "var(--accent-green)" if rsi < 30 else "var(--accent-red)" if rsi > 70 else "var(--accent-blue)"
        
        result_html = f"""
        <div class="rev-result animate-in" style="margin-top: 24px;">
            <h3 style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">📊</span>
                Résultats de l'Analyse - {symbol}
            </h3>
            
            <div class="rev-result-grid">
                <div class="rev-result-item">
                    <div class="label">Prix Actuel</div>
                    <div class="value blue">{close:,.6f}</div>
                </div>
                <div class="rev-result-item">
                    <div class="label">Tendance</div>
                    <div class="value {'green' if trend == 'Bullish' else 'red' if trend == 'Bearish' else ''}">{trend}</div>
                </div>
                <div class="rev-result-item">
                    <div class="label">EMA 20</div>
                    <div class="value">{ema20:,.6f}</div>
                </div>
                <div class="rev-result-item">
                    <div class="label">EMA 50</div>
                    <div class="value">{ema50:,.6f}</div>
                </div>
            </div>
            
            <div style="margin-top: 24px;">
                <h4 style="margin-bottom: 16px; color: var(--text-secondary);">📈 RSI (14)</h4>
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: var(--accent-green);">Oversold (30)</span>
                            <span class="mono" style="font-size: 24px; font-weight: 700; color: {rsi_color};">{rsi:.1f}</span>
                            <span style="color: var(--accent-red);">Overbought (70)</span>
                        </div>
                        <div style="height: 12px; background: linear-gradient(90deg, var(--accent-green) 0%, var(--accent-blue) 50%, var(--accent-red) 100%); border-radius: 6px; position: relative;">
                            <div style="position: absolute; left: {rsi}%; top: -4px; width: 20px; height: 20px; background: white; border-radius: 50%; transform: translateX(-50%); box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 24px;">
                <h4 style="margin-bottom: 16px; color: var(--text-secondary);">🎯 Signaux</h4>
                <div class="rev-grid rev-grid-3">
                    {signals_html}
                </div>
            </div>
            
            <div class="rev-info-box" style="margin-top: 20px;">
                <h3>💡 Interprétation</h3>
                <ul>
                    <li><b>EMA Cross</b> : EMA20 {'au-dessus de' if ema20 > ema50 else 'en-dessous de'} EMA50 → Signal {'haussier' if ema20 > ema50 else 'baissier'}</li>
                    <li><b>RSI</b> : {'Zone de survente - potentiel rebond' if rsi < 30 else 'Zone de surachat - potentielle correction' if rsi > 70 else 'Zone neutre'}</li>
                    <li><b>Conseil</b> : Utilisez ces indicateurs comme confirmation, pas comme signaux isolés</li>
                </ul>
            </div>
        </div>
        """
    
    intervals = [
        ("1m", "1 min"), ("5m", "5 min"), ("15m", "15 min"),
        ("1h", "1 heure"), ("4h", "4 heures"), ("1d", "1 jour")
    ]
    
    interval_options = ""
    for val, label in intervals:
        interval_options += f'<option value="{val}" {"selected" if interval == val else ""}>{label}</option>'
    
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Technical Analysis — Analyse Technique | CryptoIA</title>
    <style>{REVOLUTIONARY_CSS_V2}</style>
</head>
<body>
    {sidebar_html}
    <div class="rev-container">
        <div class="rev-hero animate-in">
            <div class="rev-hero-content">
                <div class="rev-hero-badge">
                    <span class="pulse"></span>
                    Analyse en Temps Réel
                </div>
                <h1>📈 AI Technical Analysis</h1>
                <p class="rev-hero-subtitle">
                    Analyse technique avancée avec indicateurs professionnels. EMA, RSI, MACD et plus encore 
                    calculés en temps réel sur les données Binance.
                </p>
                <div class="rev-hero-stats">
                    <div class="rev-stat-pill">
                        <div class="icon">📊</div>
                        <div>
                            <div class="label">Indicateurs</div>
                            <div class="value">5+</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">📡</div>
                        <div>
                            <div class="label">Source</div>
                            <div class="value">Binance</div>
                        </div>
                    </div>
                    <div class="rev-stat-pill">
                        <div class="icon">⚡</div>
                        <div>
                            <div class="label">Calcul</div>
                            <div class="value">200 bougies</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="rev-card animate-in delay-1">
            <div class="rev-card-header">
                <div class="rev-card-title">
                    <div class="icon">⚙️</div>
                    Paramètres d'Analyse
                </div>
                <div class="live-indicator">
                    <span class="dot"></span>
                    {_now_utc_str()}
                </div>
            </div>
            
            <form method="get" class="rev-form">
                <div class="rev-form-row">
                    <div class="rev-form-group">
                        <label>Symbole (Binance)</label>
                        <input type="text" name="symbol" value="{_escape_html(symbol)}" placeholder="Ex: BTCUSDT" class="rev-input">
                    </div>
                    <div class="rev-form-group">
                        <label>Intervalle</label>
                        <select name="interval" class="rev-select">
                            {interval_options}
                        </select>
                    </div>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button type="submit" class="rev-btn rev-btn-primary">
                        <span>📊</span> Analyser
                    </button>
                </div>
            </form>
            
            {result_html}
        </div>
        
        <div class="rev-grid rev-grid-2 animate-in delay-2" style="margin-top: 24px;">
            <div class="rev-info-box" style="margin-top: 0;">
                <h3>📊 Indicateurs Utilisés</h3>
                <ul>
                    <li><b>EMA 20/50</b> : Moyennes mobiles exponentielles pour la tendance</li>
                    <li><b>RSI 14</b> : Relative Strength Index pour le momentum</li>
                    <li><b>MACD</b> : Moving Average Convergence Divergence</li>
                    <li><b>Bandes de Bollinger</b> : Volatilité et niveaux de prix</li>
                </ul>
            </div>
            
            <div class="rev-info-box" style="margin-top: 0; background: rgba(6, 182, 212, 0.08); border-color: rgba(6, 182, 212, 0.2);">
                <h3>💡 Symboles Populaires</h3>
                <ul>
                    <li><b>BTCUSDT</b> : Bitcoin / USDT</li>
                    <li><b>ETHUSDT</b> : Ethereum / USDT</li>
                    <li><b>SOLUSDT</b> : Solana / USDT</li>
                    <li><b>BNBUSDT</b> : Binance Coin / USDT</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>"""
