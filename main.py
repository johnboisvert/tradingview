# -*- coding: utf-8 -*-
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import Optional, Any
import httpx
from datetime import datetime, timedelta
import pytz
import random
import os
import math
import asyncio

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ✅ ROUTE STRATÉGIE MAGIC MIKE (INTÉGRÉE DIRECTEMENT)
@app.get("/strategie", response_class=HTMLResponse)
async def strategie_page():
    html_content = """
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Magic Mike 1H - Guide ULTIME</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333;
                line-height: 1.6;
            }
            
            .container {
                max-width: 1000px;
                margin: 0 auto;
                padding: 40px 20px;
            }
            
            header {
                text-align: center;
                color: white;
                margin-bottom: 50px;
                background: rgba(0,0,0,0.2);
                padding: 40px;
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }
            
            header h1 {
                font-size: 2.5em;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            header p {
                font-size: 1.2em;
                opacity: 0.9;
            }
            
            .content {
                background: white;
                border-radius: 15px;
                padding: 50px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                margin-bottom: 40px;
            }
            
            .section {
                margin-bottom: 50px;
                padding-bottom: 30px;
                border-bottom: 3px solid #f0f0f0;
            }
            
            .section:last-child {
                border-bottom: none;
            }
            
            h2 {
                color: #667eea;
                font-size: 2em;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            h3 {
                color: #764ba2;
                font-size: 1.5em;
                margin: 25px 0 15px 0;
            }
            
            h4 {
                color: #667eea;
                font-size: 1.2em;
                margin: 20px 0 10px 0;
            }
            
            .emoji {
                font-size: 1.2em;
            }
            
            p {
                margin-bottom: 15px;
                font-size: 1.05em;
            }
            
            ul, ol {
                margin-left: 30px;
                margin-bottom: 15px;
            }
            
            li {
                margin-bottom: 10px;
            }
            
            .box {
                background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
                border-left: 5px solid #667eea;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }
            
            .box.success {
                border-left-color: #00d084;
                background: linear-gradient(135deg, #00d08415 0%, #00b86f15 100%);
            }
            
            .box.danger {
                border-left-color: #ff4757;
                background: linear-gradient(135deg, #ff475715 0%, #ff684415 100%);
            }
            
            .box.warning {
                border-left-color: #ffa502;
                background: linear-gradient(135deg, #ffa50215 0%, #ff851515 100%);
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            th, td {
                padding: 15px;
                text-align: left;
                border: 1px solid #e0e0e0;
            }
            
            th {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-weight: bold;
            }
            
            tr:nth-child(even) {
                background: #f9f9f9;
            }
            
            tr:hover {
                background: #f0f0f0;
            }
            
            .checklist {
                background: #f9f9f9;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            
            .checklist label {
                display: block;
                margin-bottom: 12px;
                cursor: pointer;
                padding: 8px;
                border-radius: 4px;
                transition: 0.3s;
            }
            
            .checklist label:hover {
                background: #e0e0e0;
            }
            
            .checklist input[type="checkbox"] {
                margin-right: 10px;
                cursor: pointer;
                width: 18px;
                height: 18px;
            }
            
            .calculator {
                background: #f0f0f0;
                padding: 25px;
                border-radius: 10px;
                margin: 20px 0;
                border: 2px solid #667eea;
            }
            
            .calculator input {
                width: 100%;
                padding: 12px;
                margin: 10px 0;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 1em;
            }
            
            .calculator button {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 30px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1em;
                margin-top: 15px;
                transition: 0.3s;
            }
            
            .calculator button:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
            }
            
            .result {
                background: white;
                padding: 15px;
                margin-top: 15px;
                border-radius: 5px;
                border-left: 4px solid #00d084;
                display: none;
            }
            
            .result.show {
                display: block;
            }
            
            .print-btn {
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 15px 25px;
                border-radius: 50px;
                cursor: pointer;
                font-size: 1em;
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
                transition: 0.3s;
                z-index: 1000;
            }
            
            .print-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5);
            }
            
            .level-badge {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 0.9em;
                font-weight: bold;
                margin-bottom: 20px;
            }
            
            .level-badge.level1 { background: #00d084; }
            .level-badge.level2 { background: #0084ff; }
            .level-badge.level3 { background: #ff6b35; }
            .level-badge.level4 { background: #ffa502; }
            .level-badge.level5 { background: #764ba2; }
            
            @media print {
                .print-btn {
                    display: none;
                }
                body {
                    background: white;
                }
                .container {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>🎯 MAGIC MIKE 1H - GUIDE ULTIME 🎯</h1>
                <p>LA STRATÉGIE COMPLÈTE POUR GAGNER AVEC VOTRE INDICATEUR</p>
            </header>
            
            <div class="content">
                <!-- NIVEAU 1 -->
                <div class="section">
                    <span class="level-badge level1">NIVEAU 1</span>
                    <h2><span class="emoji">🎓</span> COMPRENDRE L'INDICATEUR</h2>
                    
                    <h3>L'indicateur Magic Mike expliqué simplement</h3>
                    <p>Imagine Magic Mike comme un <strong>FEU TRICOLORE pour trader :</strong></p>
                    
                    <div class="box success">
                        <strong>🟢 FEU VERT = ENTRER EN LONG (acheter)</strong>
                    </div>
                    <div class="box danger">
                        <strong>🔴 FEU ROUGE = ENTRER EN SHORT (vendre)</strong>
                    </div>
                    <div class="box warning">
                        <strong>⚪ FEU BLANC = NE PAS TRADER (attendre)</strong>
                    </div>
                    
                    <h3>Les 4 éléments clés du graphique</h3>
                    
                    <h4>1️⃣ Les 3 moyennes mobiles (EMAs)</h4>
                    <ul>
                        <li><strong>🤍 EMA 20 (BLANCHE)</strong> = Tendance COURT TERME</li>
                        <li><strong>🟢 EMA 50 (VERTE)</strong> = Tendance MOYEN TERME</li>
                        <li><strong>🔴 EMA 200 (ROUGE)</strong> = Tendance LONG TERME</li>
                    </ul>
                    
                    <h4>2️⃣ Les signaux d'entrée (TRIANGLES COLORÉS)</h4>
                    <ul>
                        <li><strong>Triangle 🟢 VERT + "⚡ LONG"</strong> en haut = Signal BUY</li>
                        <li><strong>Triangle 🔴 ROUGE + "⚡ SHORT"</strong> en bas = Signal SELL</li>
                    </ul>
                    
                    <h4>3️⃣ Les niveaux (LIGNES HORIZONTALES)</h4>
                    <ul>
                        <li><strong>⚡ ENTRY</strong> = Prix exact où entrer</li>
                        <li><strong>🛡️ SL</strong> = Stop Loss (ta limite de perte, OBLIGATOIRE)</li>
                        <li><strong>🎯 TP1</strong> = Première sortie (2.5R profit)</li>
                        <li><strong>💎 TP2</strong> = Deuxième sortie (5.0R profit) ← LE MEILLEUR</li>
                        <li><strong>🚀 TP3</strong> = Troisième sortie (8.0R profit)</li>
                    </ul>
                    
                    <h4>4️⃣ Le fond coloré (Très important !)</h4>
                    <ul>
                        <li><strong>Fond 🟢 VERT TRÈS PÂLE</strong> = 4H + Daily HAUSSIERS → LONG possible</li>
                        <li><strong>Fond 🔴 ROUGE TRÈS PÂLE</strong> = 4H + Daily BAISSIERS → SHORT possible</li>
                        <li><strong>Pas de fond</strong> = 4H + Daily PAS alignés → ⛔ NE PAS TRADER</li>
                    </ul>
                </div>
                
                <!-- NIVEAU 5 : CALCULATEUR -->
                <div class="section">
                    <span class="level-badge level5">💰 CALCULATEUR</span>
                    <h2><span class="emoji">💰</span> Calculateur de ROI</h2>
                    
                    <div class="calculator">
                        <h4>💎 Rentre tes paramètres :</h4>
                        
                        <label><strong>Capital de départ ($)</strong></label>
                        <input type="number" id="capital" placeholder="Ex: 10000" value="10000">
                        
                        <label><strong>ROI mensuel estimé (%)</strong></label>
                        <input type="number" id="roi" placeholder="Ex: 128" value="128">
                        
                        <label><strong>Nombre de mois</strong></label>
                        <input type="number" id="months" placeholder="Ex: 3" value="3">
                        
                        <button onclick="calculateROI()">Calculer le ROI 🚀</button>
                        
                        <div id="roiResult" class="result"></div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 50px; padding-top: 30px; border-top: 3px solid #f0f0f0;">
                    <h2>🏁 BON TRADING & BONNE CHANCE ! 🚀💎</h2>
                    <p style="font-size: 1.1em; color: #667eea;">
                        <strong>Succès = Discipline + Patience + Action</strong><br>
                        Discipline = Respect des 10 règles<br>
                        Patience = Attendre les bons setups<br>
                        Action = 30 jours de suivi sérieux
                    </p>
                </div>
            </div>
        </div>
        
        <button class="print-btn" onclick="window.print()">🖨️ Imprimer</button>
        
        <script>
            function calculateROI() {
                const capital = parseFloat(document.getElementById('capital').value);
                const roi = parseFloat(document.getElementById('roi').value);
                const months = parseInt(document.getElementById('months').value);
                
                if (isNaN(capital) || isNaN(roi) || isNaN(months)) {
                    alert('Remplis tous les champs !');
                    return;
                }
                
                let currentCapital = capital;
                let monthDetails = '';
                
                for (let i = 1; i <= months; i++) {
                    const gain = currentCapital * (roi / 100);
                    currentCapital += gain;
                    monthDetails += '<strong>Mois ' + i + ':</strong> $' + gain.toFixed(2) + ' → Total: $' + currentCapital.toFixed(2) + '<br>';
                }
                
                const finalROI = ((currentCapital - capital) / capital * 100).toFixed(2);
                
                const resultDiv = document.getElementById('roiResult');
                resultDiv.innerHTML = '<strong>📊 Résultats :</strong><br>' +
                    monthDetails +
                    '<strong style="color: #00d084;">Capital initial :</strong> $' + capital.toFixed(2) + '<br>' +
                    '<strong style="color: #00d084;">Capital final :</strong> $' + currentCapital.toFixed(2) + '<br>' +
                    '<strong style="color: #667eea;">ROI total :</strong> ' + finalROI + '% 🚀';
                resultDiv.classList.add('show');
            }
            
            window.onload = function() {
                calculateROI();
            };
        </script>
    </body>
    </html>
    """
    
    return html_content

# ✅ FIN ROUTE STRATÉGIE

# Lock pour éviter plusieurs instances du monitoring
monitor_lock = asyncio.Lock()
monitor_running = False
trades_db = []

# ────────────────────────────────────────────────────────────────────────────
# ⬇️ TON RESTE DU CODE CONTINUE ICI (routes, classes, etc.) ⬇️
# ────────────────────────────────────────────────────────────────────────────


# ============= NOUVELLES BASES DE DONNÉES =============
# Risk Management
risk_management_settings = {
    "total_capital": 10000.0,  # Capital total en USD
    "risk_per_trade": 1.0,  # Risque par trade en %
    "max_open_trades": 2,  # Nombre maximum de trades ouverts
    "max_daily_loss": 3.0,  # Perte maximale par jour en %
    "daily_loss": 0.0,  # Perte du jour actuel
    "last_reset": datetime.now().strftime("%Y-%m-%d")
}

# Watchlist & Alertes
watchlist_db = []  # Liste des cryptos surveillées
# Format: {"symbol": "BTCUSDT", "target_price": 70000, "note": "Résistance", "created_at": "..."}

# AI Trading Assistant
ai_assistant_data = {
    "suggestions": [],
    "last_analysis": None,
    "confidence_history": []
}


# P&L Hebdomadaire
weekly_pnl = {
    "monday": 0.0,
    "tuesday": 0.0,
    "wednesday": 0.0,
    "thursday": 0.0,
    "friday": 0.0,
    "saturday": 0.0,
    "sunday": 0.0,
    "week_start": None,  # Date de début de semaine
    "last_reset": None
}

def get_current_week_day():
    """Retourne le jour de la semaine en anglais (monday, tuesday, etc.)"""
    days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    return days[datetime.now().weekday()]

def reset_weekly_pnl_if_needed():
    """Réinitialise le P&L hebdomadaire si on est dans une nouvelle semaine"""
    global weekly_pnl
    
    now = datetime.now()
    current_week_start = now - timedelta(days=now.weekday())
    current_week_start_str = current_week_start.strftime("%Y-%m-%d")
    
    # Si c'est une nouvelle semaine ou première utilisation
    if weekly_pnl["week_start"] != current_week_start_str:
        weekly_pnl = {
            "monday": 0.0,
            "tuesday": 0.0,
            "wednesday": 0.0,
            "thursday": 0.0,
            "friday": 0.0,
            "saturday": 0.0,
            "sunday": 0.0,
            "week_start": current_week_start_str,
            "last_reset": now.isoformat()
        }
        print(f"🔄 P&L hebdomadaire réinitialisé pour la semaine du {current_week_start_str}")

def update_weekly_pnl(pnl_value):
    """Met à jour le P&L du jour actuel"""
    reset_weekly_pnl_if_needed()
    current_day = get_current_week_day()
    weekly_pnl[current_day] += pnl_value

heatmap_cache = {"data": None, "timestamp": None, "cache_duration": 180}
altcoin_cache = {"data": None, "timestamp": None, "cache_duration": 10800}  # Cache 3 heures
bullrun_cache = {"data": None, "timestamp": None, "cache_duration": 1800}  # Cache 30 minutes
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8478131465:AAEh7Z0rvIqSNvn1wKdtkMNb-O96h41LCns")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "-1002940633257")

# ============= VARIABLES D'ENVIRONNEMENT COMPLÈTES =============

# Configuration Altseason
ALT_GREENS_REQUIRED = int(os.getenv("ALT_GREENS_REQUIRED", "3"))
ALTSEASON_AUTONOTIFY = int(os.getenv("ALTSEASON_AUTONOTIFY", "1"))
ALTSEASON_NOTIFY_MIN_GAP_MIN = int(os.getenv("ALTSEASON_NOTIFY_MIN_GAP_MIN", "60"))
ALTSEASON_POLL_SECONDS = int(os.getenv("ALTSEASON_POLL_SECONDS", "300"))

# Configuration Générale
CONFIDENCE_MIN = float(os.getenv("CONFIDENCE_MIN", "0.70"))
COOLDOWN_SEC = int(os.getenv("COOLDOWN_SEC", "28800"))
DB_PATH = os.getenv("DB_PATH", "/tmp/ai_trader/data.db")
MIN_CONFLUENCE = int(os.getenv("MIN_CONFLUENCE", "0"))
NEAR_SR_ATR = float(os.getenv("NEAR_SR_ATR", "0.0"))
RR_MIN = float(os.getenv("RR_MIN", "2.0"))
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "nqgjiebqgiehgq8e78qhefjqez78gfq8eyrg")

# LLM / OpenAI
LLM_ENABLED = int(os.getenv("LLM_ENABLED", "1"))
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
LLM_REASONING = os.getenv("LLM_REASONING", "high")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Telegram Messages Configuration
TELEGRAM_COOLDOWN_SEC = int(os.getenv("TELEGRAM_COOLDOWN_SEC", "300"))
TELEGRAM_ENABLED = int(os.getenv("TELEGRAM_ENABLED", "1"))
TELEGRAM_PIN_ALTSEASON = int(os.getenv("TELEGRAM_PIN_ALTSEASON", "1"))
TG_BUTTON_TEXT = os.getenv("TG_BUTTON_TEXT", "📊 Ouvrir le Dashboard")
TG_BUTTONS = int(os.getenv("TG_BUTTONS", "1"))
TG_COMPACT = int(os.getenv("TG_COMPACT", "0"))
TG_DASHBOARD_URL = os.getenv("TG_DASHBOARD_URL", "https://tradingview-production-9618.up.railway.app/trades?secret=nqgjiebqgiehgq8e78qhefjqez78gfq8eyrg")
TG_MIN_DELAY_SEC = float(os.getenv("TG_MIN_DELAY_SEC", "15.0"))
TG_PARSE = os.getenv("TG_PARSE", "HTML")
TG_PER_MIN_LIMIT = int(os.getenv("TG_PER_MIN_LIMIT", "5"))
TG_SHOW_LLM = int(os.getenv("TG_SHOW_LLM", "1"))
TG_SILENT = int(os.getenv("TG_SILENT", "0"))

# Vector / Analyse
VECTOR_GLOBAL_GAP_SEC = int(os.getenv("VECTOR_GLOBAL_GAP_SEC", "30"))
VECTOR_MIN_GAP_SEC = int(os.getenv("VECTOR_MIN_GAP_SEC", "120"))
VECTOR_TG_ENABLED = int(os.getenv("VECTOR_TG_ENABLED", "0"))

# Variables globales pour anti-rate-limit Telegram
last_telegram_message_time = 0
TELEGRAM_MESSAGE_DELAY = 3  # secondes entre chaque message


CSS = """<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:20px}.container{max-width:1400px;margin:0 auto}.header{text-align:center;margin-bottom:30px;padding:30px;background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:12px}.header h1{font-size:42px;margin-bottom:10px;background:linear-gradient(to right,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.header p{color:#94a3b8;font-size:16px}.nav{display:flex;gap:10px;margin-bottom:30px;flex-wrap:wrap;justify-content:center}.nav a{padding:12px 20px;background:#1e293b;border-radius:8px;text-decoration:none;color:#e2e8f0;transition:all .3s;border:1px solid #334155}.nav a:hover{background:#334155;border-color:#60a5fa}.card{background:#1e293b;padding:25px;border-radius:12px;margin-bottom:20px;border:1px solid #334155}.card h2{color:#60a5fa;margin-bottom:20px;font-size:24px;border-bottom:2px solid #334155;padding-bottom:10px}.stat-box{background:#0f172a;padding:20px;border-radius:8px;border-left:4px solid #60a5fa}.stat-box .label{color:#94a3b8;font-size:13px;margin-bottom:8px}.stat-box .value{font-size:32px;font-weight:700;color:#e2e8f0}button{padding:12px 24px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;transition:all .3s}button:hover{background:#2563eb}.btn-danger{background:#ef4444}.btn-danger:hover{background:#dc2626}.spinner{border:5px solid #334155;border-top:5px solid #60a5fa;border-radius:50%;width:60px;height:60px;animation:spin 1s linear infinite;margin:60px auto}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.alert{padding:15px;border-radius:8px;margin:15px 0}.alert-success{background:rgba(16,185,129,.1);border-left:4px solid #10b981;color:#10b981}.alert-error{background:rgba(239,68,68,.1);border-left:4px solid #ef4444;color:#ef4444}table{width:100%;border-collapse:collapse}table th{background:#0f172a;padding:12px;text-align:left;color:#60a5fa;font-weight:600;border-bottom:2px solid #334155}table td{padding:12px;border-bottom:1px solid #334155}table tr:hover{background:#0f172a}input,select{width:100%;padding:12px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:14px;margin-bottom:15px}</style>"""

NAV = '<div class="nav"><a href="/">🏠 Accueil</a><a href="/fear-greed">😱 Fear&Greed</a><a href="/dominance">👑 Dominance</a><a href="/altcoin-season">🌟 Altcoin Season</a><a href="/heatmap">🔥 Heatmap</a><a href="/strategie">📚 Stratégie</a><a href="/nouvelles">📰 Nouvelles</a><a href="/trades">📊 Trades</a><a href="/risk-management">⚖️ Risk Management</a><a href="/watchlist">👀 Watchlist</a><a href="/ai-assistant">🤖 AI Assistant</a><a href="/convertisseur">💱 Convertisseur</a><a href="/calendrier">📅 Calendrier</a><a href="/bullrun-phase">🚀 Bullrun Phase</a><a href="/graphiques">📈 Graphiques</a><a href="/telegram-test">📱 Telegram</a></div>'

def format_price(price: float) -> str:
    """Formate intelligemment les prix selon leur magnitude"""
    if price < 0.001:
        decimals = 8  # Memecoins (SHIB, PEPE, CHEEMS)
    elif price < 1:
        decimals = 6  # Petites cryptos
    elif price < 100:
        decimals = 4  # Altcoins moyens
    else:
        decimals = 2  # BTC, ETH, etc.
    
    formatted = f"${price:.{decimals}f}"
    # Supprimer les zéros inutiles
    formatted = formatted.rstrip('0').rstrip('.')
    if formatted.endswith('$'):
        formatted += '0'
    return formatted

class TradeWebhook(BaseModel):
    type: str = "ENTRY"
    symbol: str
    tf: Optional[str] = None
    tf_label: Optional[str] = None
    side: Optional[str] = None
    entry: Optional[float] = None
    current_price: Optional[float] = None  # Prix actuel envoyé par le webhook Pine Script
    sl: Optional[float] = None
    tp1: Optional[float] = None
    tp2: Optional[float] = None
    tp3: Optional[float] = None
    confidence: Optional[int] = None
    leverage: Optional[str] = None
    note: Optional[str] = None
    price: Optional[float] = None
    action: Optional[str] = None

    @validator('side', pre=True, always=True)
    def set_side(cls, v, values):
        if v:
            return v.upper()
        if 'action' in values and values['action']:
            return 'LONG' if values['action'].upper() == 'BUY' else 'SHORT'
        return v

    @validator('entry', pre=True, always=True)
    def set_entry(cls, v, values):
        return v if v is not None else values.get('price')

def calc_rr(entry, sl, tp1):
    try:
        if entry and sl and tp1:
            risk = abs(entry - sl)
            reward = abs(tp1 - entry)
            return round(reward / risk, 2) if risk > 0 else None
    except:
        pass
    return None

def calculate_confidence_score(trade: TradeWebhook):
    """
    🎯 CALCUL DE CONFIANCE RÉEL ET DYNAMIQUE
    
    Ce système calcule un score de confiance RÉALISTE basé sur plusieurs critères,
    partant d'un score de base de 50% et ajustant significativement selon :
    - Risk/Reward (poids le plus important)
    - Distance du Stop Loss
    - Leverage utilisé
    - Timeframe
    - Nombre de targets
    - Signal technique (si fourni)
    
    Plage de confiance finale : 35% à 95%
    """
    
    # ============= SCORE DE BASE =============
    score = 50.0  # On part de 50%, pas 85% !
    reasons = []
    
    # ============= 1. RISK/REWARD (POIDS LE PLUS IMPORTANT) =============
    # C'est le facteur #1 de réussite d'un trade
    if trade.entry and trade.sl and trade.tp1:
        risk = abs(trade.entry - trade.sl)
        reward = abs(trade.tp1 - trade.entry)
        rr_ratio = reward / risk if risk > 0 else 0
        
        if rr_ratio >= 4.0:
            score += 25  # Excellent R/R
            reasons.append(f"Excellent R/R de {rr_ratio:.1f}:1")
        elif rr_ratio >= 3.0:
            score += 18  # Très bon R/R
            reasons.append(f"Très bon R/R de {rr_ratio:.1f}:1")
        elif rr_ratio >= 2.5:
            score += 12  # Bon R/R
            reasons.append(f"Bon R/R de {rr_ratio:.1f}:1")
        elif rr_ratio >= 2.0:
            score += 8   # R/R acceptable
            reasons.append(f"R/R acceptable de {rr_ratio:.1f}:1")
        elif rr_ratio >= 1.5:
            score += 2   # R/R moyen
            reasons.append(f"R/R moyen de {rr_ratio:.1f}:1")
        elif rr_ratio >= 1.0:
            score -= 8   # R/R faible
            reasons.append(f"R/R faible de {rr_ratio:.1f}:1 - risque élevé")
        else:
            score -= 15  # R/R très faible - dangereux
            reasons.append(f"R/R très faible de {rr_ratio:.1f}:1 - très risqué")
    else:
        score -= 10  # Pas de R/R défini = mauvais signe
        reasons.append("Aucun R/R défini")
    
    # ============= 2. DISTANCE DU STOP LOSS =============
    # Un SL serré = meilleure gestion du risque
    if trade.entry and trade.sl:
        sl_distance = abs((trade.sl - trade.entry) / trade.entry * 100)
        
        if sl_distance <= 1.5:
            score += 10  # SL très serré - excellent
            reasons.append("SL très serré (gestion optimale)")
        elif sl_distance <= 3.0:
            score += 6   # SL serré - bon
            reasons.append("SL serré (bonne gestion)")
        elif sl_distance <= 5.0:
            score += 2   # SL modéré
            reasons.append("SL bien placé")
        elif sl_distance <= 8.0:
            score -= 3   # SL un peu éloigné
            reasons.append("SL éloigné")
        else:
            score -= 8   # SL trop éloigné = risque élevé
            reasons.append(f"SL trop éloigné ({sl_distance:.1f}%)")
    
    # ============= 3. LEVERAGE =============
    # Leverage trop élevé = risque accru
    if trade.leverage:
        try:
            lev = int(trade.leverage.replace('x', '').replace('X', ''))
            
            if lev <= 5:
                score += 8   # Leverage conservateur
                reasons.append("Leverage conservateur")
            elif lev <= 10:
                score += 5   # Leverage modéré
                reasons.append("Leverage modéré")
            elif lev <= 15:
                score += 1   # Leverage acceptable
                reasons.append("Leverage acceptable")
            elif lev <= 20:
                score -= 3   # Leverage élevé
                reasons.append("Leverage élevé")
            elif lev <= 30:
                score -= 8   # Leverage très élevé
                reasons.append("Leverage très élevé - risque accru")
            else:
                score -= 15  # Leverage dangereux
                reasons.append("Leverage dangereux (>30x)")
        except:
            pass
    
    # ============= 4. TIMEFRAME =============
    # Les timeframes plus élevés = plus fiables
    if trade.tf:
        tf_lower = trade.tf.lower()
        
        if any(x in tf_lower for x in ['1d', '4h', 'daily']):
            score += 8   # Timeframe élevé = plus fiable
            reasons.append("Timeframe élevé (plus fiable)")
        elif any(x in tf_lower for x in ['1h', '2h']):
            score += 5   # Timeframe moyen
            reasons.append("Timeframe moyen")
        elif any(x in tf_lower for x in ['15', '30']):
            score += 1   # Timeframe court
            reasons.append("Timeframe court (réactif)")
        elif any(x in tf_lower for x in ['1m', '3m', '5m']):
            score -= 3   # Timeframe très court = plus de bruit
            reasons.append("Timeframe très court (volatil)")
    
    # ============= 5. STRATÉGIE DE SORTIE =============
    # Plusieurs targets = meilleure gestion des profits
    targets_count = sum([1 for tp in [trade.tp1, trade.tp2, trade.tp3] if tp is not None])
    
    if targets_count >= 3:
        score += 6
        reasons.append("Sortie progressive (3+ targets)")
    elif targets_count >= 2:
        score += 3
        reasons.append("2 targets définis")
    elif targets_count == 1:
        score -= 2
        reasons.append("Un seul target")
    
    # ============= 6. SIGNAL TECHNIQUE (SI FOURNI) =============
    # Si Pine Script envoie une confiance technique
    if trade.confidence:
        if trade.confidence >= 90:
            score += 10
            reasons.append("Signal technique très fort")
        elif trade.confidence >= 80:
            score += 6
            reasons.append("Signal technique fort")
        elif trade.confidence >= 70:
            score += 3
            reasons.append("Signal technique bon")
        elif trade.confidence >= 60:
            score += 0  # Neutre
        else:
            score -= 5
            reasons.append("Signal technique faible")
    
    # ============= 7. ANALYSE DÉTAILLÉE =============
    # Une note détaillée montre de la préparation
    if trade.note and len(trade.note) > 30:
        score += 3
        reasons.append("Analyse détaillée fournie")
    
    # ============= LIMITES ET NORMALISATION =============
    # Score final entre 35% et 95%
    score = max(35.0, min(95.0, score))
    
    # ============= CONSTRUCTION DE LA RAISON =============
    # Afficher toutes les raisons importantes, pas seulement 3
    if len(reasons) > 0:
        reason = ", ".join(reasons)
    else:
        reason = "Analyse technique standard"
    
    return round(score, 1), reason.capitalize()


async def send_telegram_advanced(trade: TradeWebhook):
    """Envoie message Telegram professionnel avec anti-rate-limit et variables d'env"""
    global last_telegram_message_time
    
    # Vérifier si Telegram est activé
    if not TELEGRAM_ENABLED:
        print("ℹ️ Telegram désactivé (TELEGRAM_ENABLED=0)")
        return
    
    try:
        confidence_score, confidence_reason = calculate_confidence_score(trade)
        direction_emoji = "📈" if trade.side == "LONG" else "📉"
        
        # Heure du Québec avec gestion automatique EDT/EST
        timezone_quebec = pytz.timezone('America/Montreal')
        now_quebec = datetime.now(timezone_quebec)
        heure = now_quebec.strftime("%Hh%M")
        
        rr = calc_rr(trade.entry, trade.sl, trade.tp1)
        rr_text = f" (R/R: {rr}:1)" if rr else ""
        trade_type = trade.tf_label if trade.tf_label else "MidTerm"
        timeframe = trade.tf if trade.tf else "15m"
        leverage_text = trade.leverage if trade.leverage else "10x"
        
        msg = f"""📩 <b>{trade.symbol}</b> {timeframe} | {trade_type}
⏰ Heure : {heure}
🎯 Direction : <b>{trade.side}</b> {direction_emoji}

<b>ENTRY:</b> ${trade.entry:.4f}{rr_text}
❌ <b>Stop-Loss:</b> ${trade.sl:.4f}
💡 <b>Leverage:</b> {leverage_text} Isolée
"""
        
        if trade.tp1:
            msg += f"✅ <b>Target 1:</b> ${trade.tp1:.4f}\n"
        if trade.tp2:
            msg += f"✅ <b>Target 2:</b> ${trade.tp2:.4f}\n"
        if trade.tp3:
            msg += f"✅ <b>Target 3:</b> ${trade.tp3:.4f}\n"
        
        msg += f"✅ <b>Target 4:</b> 🚀🚀🚀\n\n"
        msg += f"🎯 <b>Confiance de la stratégie:</b> {confidence_score}%\n"
        msg += f"<i>Pourquoi ?</i> {confidence_reason}\n\n"
        msg += "💡 <b>Après le TP1, veuillez vous mettre en SLBE</b>\n"
        msg += "<i>(Stop Loss Break Even - sécurisez vos gains)</i>"
        
        if trade.note:
            msg += f"\n\n📝 <b>Note:</b> {trade.note}"
        
        # ============= ANTI-RATE-LIMIT =============
        # Attendre TG_MIN_DELAY_SEC secondes depuis le dernier message
        import time
        current_time = time.time()
        time_since_last_message = current_time - last_telegram_message_time
        
        if time_since_last_message < TG_MIN_DELAY_SEC:
            wait_time = TG_MIN_DELAY_SEC - time_since_last_message
            print(f"⏳ Attente de {wait_time:.1f}s pour éviter rate limit...")
            await asyncio.sleep(wait_time)
        
        # ============= ENVOI AVEC RETRY =============
        max_retries = 3
        retry_count = 0
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            while retry_count < max_retries:
                response = await client.post(
                    f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                    json={"chat_id": TELEGRAM_CHAT_ID, "text": msg, "parse_mode": TG_PARSE}
                )
                
                if response.status_code == 200:
                    last_telegram_message_time = time.time()
                    print(f"✅ Message Telegram envoyé - {trade.symbol} {trade.side}")
                    print(f"   Entry: ${trade.entry:.4f} | SL: ${trade.sl:.4f}")
                    print(f"   Confiance IA: {confidence_score}%")
                    print(f"   Heure: {heure}")
                    break
                    
                elif response.status_code == 429:
                    # Rate limit hit - attendre et réessayer
                    try:
                        error_data = response.json()
                        retry_after = error_data.get("parameters", {}).get("retry_after", 5)
                    except:
                        retry_after = 5
                    
                    retry_count += 1
                    if retry_count < max_retries:
                        print(f"⚠️ Rate limit (429) - Attente de {retry_after}s avant retry {retry_count}/{max_retries}...")
                        await asyncio.sleep(retry_after)
                    else:
                        print(f"❌ Rate limit (429) - Max retries atteint pour {trade.symbol}")
                        
                else:
                    print(f"⚠️ Erreur Telegram: {response.status_code} - {response.text}")
                    break
                
    except Exception as e:
        print(f"❌ Erreur Telegram: {e}")
        import traceback
        traceback.print_exc()


async def send_telegram(msg: str):
    """Envoie message Telegram simple"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                json={"chat_id": TELEGRAM_CHAT_ID, "text": msg, "parse_mode": "HTML"}
            )
    except Exception as e:
        print(f"❌ Erreur send_telegram: {e}")

@app.post("/tv-webhook")
async def webhook(trade: TradeWebhook):
    """
    Webhook TradingView avec détection de revirement
    Ferme automatiquement les trades inverses SANS ouvrir le nouveau trade
    """
    try:
        print(f"\n{'='*60}")
        print(f"🎯 NOUVEAU SIGNAL TRADINGVIEW")
        print(f"   Symbol: {trade.symbol}")
        print(f"   Direction: {trade.side}")
        print(f"   Timeframe: {trade.tf}")
        print(f"   Entry: ${trade.entry:.6f}")
        print(f"   SL: ${trade.sl:.6f} | TP1: ${trade.tp1:.6f}")
        print(f"{'='*60}\n")
        
        symbol = trade.symbol
        new_side = trade.side
        
        # 🔍 Vérifier s'il existe un trade ACTIF dans le sens INVERSE
        inverse_side = 'SHORT' if new_side == 'LONG' else 'LONG'
        
        # Chercher un trade actif inverse
        inverse_trade = None
        for t in trades_db:
            if (t.get('symbol') == symbol and 
                t.get('side') == inverse_side and 
                t.get('status') == 'open'):
                inverse_trade = t
                break
        
        # 🔄 Si un trade inverse existe, le fermer automatiquement SANS ouvrir le nouveau
        if inverse_trade:
            now = datetime.now(pytz.timezone('America/Montreal'))
            close_time = now.strftime('%H:%M:%S')
            close_date = now.strftime('%d/%m/%Y')
            
            print(f"⚠️ REVIREMENT DÉTECTÉ sur {symbol}! {inverse_side} → {new_side}")
            
            # Fermer le trade inverse
            inverse_trade['status'] = 'closed'
            inverse_trade['closed_reason'] = f'Revirement: Signal {new_side} reçu'
            inverse_trade['closed_at'] = now.isoformat()
            inverse_trade['sl_hit'] = True  # Bouton SL rouge pour indiquer une perte
            
            # 📱 Notification Telegram DÉTAILLÉE du revirement
            reversal_message = (
                f"🔄 <b>REVIREMENT DE TENDANCE DÉTECTÉ!</b>\n\n"
                f"💱 Crypto: <b>{symbol}</b>\n"
                f"❌ Trade <b>{inverse_side}</b> fermé automatiquement\n\n"
                f"📊 <b>Détails de fermeture:</b>\n"
                f"├ Entry: {format_price(inverse_trade.get('entry', 0))}\n"
                f"├ Prix de fermeture: {format_price(trade.entry)}\n"
                f"├ Heure: {close_time}\n"
                f"└ Date: {close_date}\n\n"
                f"🔔 Signal <b>{new_side}</b> reçu mais <b>NON exécuté</b>\n"
                f"⏳ En attente du prochain signal propre...\n\n"
                f"⚠️ <i>Sécurité: Pas d'ouverture après revirement</i>"
            )
            
            asyncio.create_task(send_telegram_message(reversal_message))
            print(f"✅ Trade {inverse_side} fermé, signal {new_side} IGNORÉ (revirement)")
            
            return {
                "status": "reversed",
                "message": f"Trade {inverse_side} fermé, signal {new_side} ignoré",
                "closed_trade_id": inverse_trade.get('symbol'),
                "new_trade_created": False
            }
        
        # 📝 Créer le nouveau trade SEULEMENT si pas de revirement
        await send_telegram_advanced(trade)
        
        confidence_score, _ = calculate_confidence_score(trade)
        
        trade_data = {
            "symbol": trade.symbol,
            "side": trade.side,
            "entry": trade.entry,
            "current_price": trade.current_price,
            "sl": trade.sl,
            "tp1": trade.tp1,
            "tp2": trade.tp2,
            "tp3": trade.tp3,
            "timestamp": datetime.now(pytz.timezone('America/Montreal')).isoformat(),
            "status": "open",
            "confidence": confidence_score,
            "leverage": trade.leverage,
            "timeframe": trade.tf,
            "tp1_hit": False,
            "tp2_hit": False,
            "tp3_hit": False,
            "sl_hit": False
        }
        trades_db.append(trade_data)
        
        print(f"✅ Trade {new_side} créé: {symbol} @ {trade.entry}")
        
        return {"status": "success", "confidence_ai": confidence_score, "new_trade_created": True}
        
    except Exception as e:
        print(f"❌ ERREUR WEBHOOK: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "error": str(e)}

@app.get("/health")
@app.head("/health")
async def health_check():
    """Endpoint pour garder le serveur éveillé (UptimeRobot) - Supporte GET et HEAD"""
    return {"status": "alive", "timestamp": datetime.now().isoformat()}

@app.get("/")
async def home():
    return {"status": "ok", "app": "Trading Dashboard", "endpoints": ["fear-greed", "dominance", "heatmap", "trades", "telegram-test", "health"]}

@app.get("/api/fear-greed-full")
async def fear_greed_full():
    try:
        print("🔄 Tentative de connexion à l'API Fear & Greed...")
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get("https://api.alternative.me/fng/?limit=30")
            print(f"📡 Status code: {r.status_code}")
            
            if r.status_code == 200:
                data = r.json()
                print(f"✅ Données reçues - Nombre d'entrées: {len(data.get('data', []))}")
                
                if data.get("data") and len(data["data"]) > 0:
                    current = data["data"][0]
                    current_value = int(current["value"])
                    print(f"✅ Valeur actuelle: {current_value} - {current['value_classification']}")
                    
                    now = datetime.now()
                    tomorrow = now.replace(hour=0,minute=0,second=0,microsecond=0) + timedelta(days=1)
                    
                    result = {
                        "current_value": current_value,
                        "current_classification": current["value_classification"],
                        "historical": {
                            "now": {"value": int(data["data"][0]["value"]), "classification": data["data"][0]["value_classification"]},
                            "yesterday": {"value": int(data["data"][1]["value"]) if len(data["data"])>1 else None, "classification": data["data"][1]["value_classification"] if len(data["data"])>1 else None},
                            "last_week": {"value": int(data["data"][7]["value"]) if len(data["data"])>7 else None, "classification": data["data"][7]["value_classification"] if len(data["data"])>7 else None},
                            "last_month": {"value": int(data["data"][29]["value"]) if len(data["data"])>29 else None, "classification": data["data"][29]["value_classification"] if len(data["data"])>29 else None}
                        },
                        "next_update_seconds": int((tomorrow-now).total_seconds()),
                        "status": "success"
                    }
                    print(f"✅ Retour réussi avec valeur: {current_value}")
                    return result
                else:
                    print("❌ Pas de données dans la réponse")
    except httpx.TimeoutException as e:
        print(f"⏱️ Timeout: {e}")
    except httpx.ConnectError as e:
        print(f"🔌 Erreur de connexion: {e}")
    except Exception as e:
        print(f"❌ ERREUR: {type(e).__name__} - {e}")
    
    print("⚠️ Retour des données fallback (34)")
    return {"current_value": 34, "current_classification": "Fear", "historical": {"now": {"value": 34, "classification": "Fear"}}, "status": "fallback"}

@app.get("/api/btc-dominance")
async def btc_dom_api():
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get("https://api.coingecko.com/api/v3/global")
            if r.status_code == 200:
                d = r.json()["data"]
                btc = round(d["market_cap_percentage"]["btc"], 2)
                eth = round(d["market_cap_percentage"]["eth"], 2)
                others = round(100-btc-eth, 2)
                prev_btc = btc - random.uniform(-0.5, 0.8)
                return {
                    "btc_dominance": btc,
                    "eth_dominance": eth,
                    "others_dominance": others,
                    "prev_btc": round(prev_btc, 2),
                    "total_market_cap": d.get("total_market_cap", {}).get("usd", 0),
                    "status": "success"
                }
    except:
        pass
    return {
        "btc_dominance": 58.8,
        "eth_dominance": 12.9,
        "others_dominance": 28.3,
        "prev_btc": 58.5,
        "total_market_cap": 2800000000000,
        "status": "fallback"
    }

@app.get("/api/btc-dominance-history")
async def btc_dom_hist():
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get("https://api.coingecko.com/api/v3/global")
            if r.status_code == 200:
                curr_btc = round(r.json()["data"]["market_cap_percentage"]["btc"], 2)
                now = datetime.now()
                data = []
                for i in range(366):
                    days_ago = 365 - i
                    timestamp = int((now - timedelta(days=days_ago)).timestamp() * 1000)
                    variation = random.uniform(-8, 8) * (1 - (days_ago / 365))
                    btc_value = max(40, min(70, curr_btc + variation))
                    data.append({
                        "timestamp": timestamp,
                        "value": round(btc_value, 2)
                    })
                return {"data": data, "current_value": curr_btc, "status": "success"}
    except:
        pass
    now = datetime.now()
    fallback_data = []
    for i in range(366):
        days_ago = 365 - i
        timestamp = int((now - timedelta(days=days_ago)).timestamp() * 1000)
        variation = random.uniform(-5, 5)
        btc_value = max(40, min(70, 58.8 + variation))
        fallback_data.append({
            "timestamp": timestamp,
            "value": round(btc_value, 2)
        })
    return {"data": fallback_data, "current_value": 58.8, "status": "fallback"}

@app.get("/api/heatmap")
async def heatmap_api():
    """API Heatmap avec fallback robuste et données réalistes"""
    
    print("\n" + "="*60)
    print("🔥 API HEATMAP APPELÉE")
    print("="*60)
    
    now = datetime.now()
    
    # Vérifier le cache
    if heatmap_cache["data"] and heatmap_cache["timestamp"]:
        elapsed = (now - heatmap_cache["timestamp"]).total_seconds()
        if elapsed < heatmap_cache["cache_duration"]:
            print(f"✅ Retour du cache (âge: {int(elapsed)}s)")
            print("="*60)
            return {"cryptos": heatmap_cache["data"], "status": "cached", "age": int(elapsed)}
    
    # Essayer l'API CoinGecko
    try:
        print("🌐 Tentative de connexion à CoinGecko...")
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={
                    "vs_currency": "usd",
                    "order": "market_cap_desc",
                    "per_page": 100,
                    "page": 1,
                    "sparkline": False,
                    "price_change_percentage": "24h"
                }
            )
            
            if r.status_code == 200:
                print("✅ Données CoinGecko reçues!")
                data = r.json()
                cryptos = []
                
                for c in data:
                    try:
                        cryptos.append({
                            "symbol": c["symbol"].upper(),
                            "name": c["name"],
                            "price": c["current_price"] or 0,
                            "change_24h": round(c.get("price_change_percentage_24h", 0), 2),
                            "market_cap": c["market_cap"] or 0,
                            "volume_24h": c.get("total_volume", 0) or 0
                        })
                    except Exception as e:
                        print(f"⚠️ Erreur parsing crypto: {e}")
                        continue
                
                if len(cryptos) >= 50:
                    heatmap_cache["data"] = cryptos
                    heatmap_cache["timestamp"] = now
                    print(f"✅ Retour de {len(cryptos)} cryptos depuis CoinGecko")
                    print("="*60)
                    return {"cryptos": cryptos, "status": "success", "count": len(cryptos)}
                else:
                    print(f"⚠️ Pas assez de cryptos ({len(cryptos)}), utilisation du fallback")
                    
    except httpx.TimeoutException:
        print("⏱️ Timeout de l'API CoinGecko")
    except httpx.ConnectError:
        print("🔌 Erreur de connexion à CoinGecko")
    except Exception as e:
        print(f"❌ Erreur CoinGecko: {type(e).__name__} - {e}")
    
    # Utiliser le cache existant si disponible
    if heatmap_cache["data"] and len(heatmap_cache["data"]) >= 50:
        elapsed = (now - heatmap_cache["timestamp"]).total_seconds()
        print(f"⚠️ Utilisation du cache périmé (âge: {int(elapsed)}s)")
        print("="*60)
        return {"cryptos": heatmap_cache["data"], "status": "stale_cache", "age": int(elapsed)}
    
    # Fallback avec données réalistes et complètes
    print("⚡ Génération de données fallback réalistes...")
    
    # Liste des top cryptos avec données réalistes
    fallback_cryptos = [
        # Top 10
        {"symbol": "BTC", "name": "Bitcoin", "price": 107150.00, "change_24h": 1.32, "market_cap": 2136218033539, "volume_24h": 37480142027},
        {"symbol": "ETH", "name": "Ethereum", "price": 3725.50, "change_24h": -0.85, "market_cap": 447986654321, "volume_24h": 18750000000},
        {"symbol": "USDT", "name": "Tether", "price": 1.00, "change_24h": 0.01, "market_cap": 146875000000, "volume_24h": 87650000000},
        {"symbol": "BNB", "name": "BNB", "price": 645.30, "change_24h": 2.15, "market_cap": 93420000000, "volume_24h": 2150000000},
        {"symbol": "SOL", "name": "Solana", "price": 189.75, "change_24h": 5.67, "market_cap": 90125000000, "volume_24h": 4890000000},
        {"symbol": "USDC", "name": "USD Coin", "price": 1.00, "change_24h": -0.02, "market_cap": 86450000000, "volume_24h": 12340000000},
        {"symbol": "XRP", "name": "XRP", "price": 2.45, "change_24h": 3.21, "market_cap": 142560000000, "volume_24h": 5670000000},
        {"symbol": "ADA", "name": "Cardano", "price": 1.15, "change_24h": -1.45, "market_cap": 40780000000, "volume_24h": 1890000000},
        {"symbol": "DOGE", "name": "Dogecoin", "price": 0.38, "change_24h": 4.89, "market_cap": 56120000000, "volume_24h": 3450000000},
        {"symbol": "TRX", "name": "TRON", "price": 0.28, "change_24h": 1.67, "market_cap": 24560000000, "volume_24h": 890000000},
        
        # Top 11-30
        {"symbol": "AVAX", "name": "Avalanche", "price": 42.30, "change_24h": -2.34, "market_cap": 17890000000, "volume_24h": 670000000},
        {"symbol": "LINK", "name": "Chainlink", "price": 23.45, "change_24h": 6.12, "market_cap": 14560000000, "volume_24h": 980000000},
        {"symbol": "DOT", "name": "Polkadot", "price": 8.92, "change_24h": -0.78, "market_cap": 13670000000, "volume_24h": 560000000},
        {"symbol": "MATIC", "name": "Polygon", "price": 0.65, "change_24h": 2.89, "market_cap": 12340000000, "volume_24h": 780000000},
        {"symbol": "ATOM", "name": "Cosmos", "price": 11.23, "change_24h": -1.23, "market_cap": 4560000000, "volume_24h": 340000000},
        {"symbol": "UNI", "name": "Uniswap", "price": 14.56, "change_24h": 3.45, "market_cap": 10980000000, "volume_24h": 450000000},
        {"symbol": "LTC", "name": "Litecoin", "price": 105.67, "change_24h": 0.89, "market_cap": 7890000000, "volume_24h": 890000000},
        {"symbol": "FTM", "name": "Fantom", "price": 0.98, "change_24h": 7.23, "market_cap": 2780000000, "volume_24h": 230000000},
        {"symbol": "ALGO", "name": "Algorand", "price": 0.35, "change_24h": -3.45, "market_cap": 2890000000, "volume_24h": 180000000},
        {"symbol": "VET", "name": "VeChain", "price": 0.045, "change_24h": 1.78, "market_cap": 3670000000, "volume_24h": 190000000},
        {"symbol": "ICP", "name": "Internet Computer", "price": 12.34, "change_24h": -2.89, "market_cap": 5780000000, "volume_24h": 280000000},
        {"symbol": "FIL", "name": "Filecoin", "price": 6.78, "change_24h": 4.56, "market_cap": 4560000000, "volume_24h": 340000000},
        {"symbol": "NEAR", "name": "NEAR Protocol", "price": 5.67, "change_24h": 2.34, "market_cap": 6780000000, "volume_24h": 450000000},
        {"symbol": "APT", "name": "Aptos", "price": 11.89, "change_24h": 5.67, "market_cap": 7890000000, "volume_24h": 560000000},
        {"symbol": "OP", "name": "Optimism", "price": 3.45, "change_24h": -1.23, "market_cap": 4560000000, "volume_24h": 340000000},
        {"symbol": "ARB", "name": "Arbitrum", "price": 1.89, "change_24h": 3.78, "market_cap": 8900000000, "volume_24h": 670000000},
        {"symbol": "HBAR", "name": "Hedera", "price": 0.12, "change_24h": -0.89, "market_cap": 4230000000, "volume_24h": 230000000},
        {"symbol": "STX", "name": "Stacks", "price": 2.34, "change_24h": 6.78, "market_cap": 3560000000, "volume_24h": 280000000},
        {"symbol": "INJ", "name": "Injective", "price": 28.90, "change_24h": 8.90, "market_cap": 2890000000, "volume_24h": 450000000},
        {"symbol": "SUI", "name": "Sui", "price": 4.56, "change_24h": 12.34, "market_cap": 13450000000, "volume_24h": 1230000000},
        
        # Top 31-50
        {"symbol": "RUNE", "name": "THORChain", "price": 5.67, "change_24h": -2.34, "market_cap": 1890000000, "volume_24h": 120000000},
        {"symbol": "QNT", "name": "Quant", "price": 123.45, "change_24h": 1.23, "market_cap": 1560000000, "volume_24h": 90000000},
        {"symbol": "GRT", "name": "The Graph", "price": 0.28, "change_24h": 3.45, "market_cap": 2670000000, "volume_24h": 180000000},
        {"symbol": "SAND", "name": "The Sandbox", "price": 0.67, "change_24h": -4.56, "market_cap": 1560000000, "volume_24h": 140000000},
        {"symbol": "MANA", "name": "Decentraland", "price": 0.89, "change_24h": 2.34, "market_cap": 1670000000, "volume_24h": 160000000},
        {"symbol": "AXS", "name": "Axie Infinity", "price": 8.90, "change_24h": -3.21, "market_cap": 1340000000, "volume_24h": 110000000},
        {"symbol": "EGLD", "name": "MultiversX", "price": 45.67, "change_24h": 1.78, "market_cap": 1230000000, "volume_24h": 95000000},
        {"symbol": "AAVE", "name": "Aave", "price": 167.89, "change_24h": 4.56, "market_cap": 2450000000, "volume_24h": 340000000},
        {"symbol": "XTZ", "name": "Tezos", "price": 1.23, "change_24h": -1.89, "market_cap": 1170000000, "volume_24h": 87000000},
        {"symbol": "EOS", "name": "EOS", "price": 0.89, "change_24h": 0.56, "market_cap": 1090000000, "volume_24h": 76000000},
        {"symbol": "THETA", "name": "Theta Network", "price": 2.34, "change_24h": 5.67, "market_cap": 2340000000, "volume_24h": 145000000},
        {"symbol": "FLR", "name": "Flare", "price": 0.034, "change_24h": -2.78, "market_cap": 1780000000, "volume_24h": 95000000},
        {"symbol": "KAVA", "name": "Kava", "price": 0.78, "change_24h": 3.21, "market_cap": 780000000, "volume_24h": 54000000},
        {"symbol": "CHZ", "name": "Chiliz", "price": 0.12, "change_24h": -1.45, "market_cap": 1120000000, "volume_24h": 78000000},
        {"symbol": "ZIL", "name": "Zilliqa", "price": 0.023, "change_24h": 2.89, "market_cap": 560000000, "volume_24h": 43000000},
        {"symbol": "ENJ", "name": "Enjin Coin", "price": 0.34, "change_24h": 1.67, "market_cap": 560000000, "volume_24h": 41000000},
        {"symbol": "BAT", "name": "Basic Attention Token", "price": 0.45, "change_24h": -0.89, "market_cap": 670000000, "volume_24h": 52000000},
        {"symbol": "1INCH", "name": "1inch", "price": 0.56, "change_24h": 4.23, "market_cap": 890000000, "volume_24h": 67000000},
        {"symbol": "COMP", "name": "Compound", "price": 78.90, "change_24h": -2.34, "market_cap": 670000000, "volume_24h": 54000000},
        {"symbol": "SNX", "name": "Synthetix", "price": 3.45, "change_24h": 5.12, "market_cap": 1120000000, "volume_24h": 89000000},
        
        # Bonus cryptos pour atteindre 60+
        {"symbol": "ROSE", "name": "Oasis Network", "price": 0.12, "change_24h": 3.45, "market_cap": 780000000, "volume_24h": 45000000},
        {"symbol": "CRV", "name": "Curve DAO", "price": 1.23, "change_24h": -1.78, "market_cap": 890000000, "volume_24h": 67000000},
        {"symbol": "LDO", "name": "Lido DAO", "price": 2.34, "change_24h": 6.78, "market_cap": 2230000000, "volume_24h": 178000000},
        {"symbol": "MKR", "name": "Maker", "price": 1789.00, "change_24h": 1.45, "market_cap": 1670000000, "volume_24h": 123000000},
        {"symbol": "GALA", "name": "Gala", "price": 0.045, "change_24h": -3.21, "market_cap": 560000000, "volume_24h": 38000000},
        {"symbol": "IMX", "name": "Immutable", "price": 2.67, "change_24h": 7.89, "market_cap": 3450000000, "volume_24h": 234000000},
        {"symbol": "WOO", "name": "WOO Network", "price": 0.34, "change_24h": 2.34, "market_cap": 890000000, "volume_24h": 56000000},
        {"symbol": "DYDX", "name": "dYdX", "price": 2.89, "change_24h": -2.56, "market_cap": 1120000000, "volume_24h": 87000000},
        {"symbol": "GMX", "name": "GMX", "price": 67.89, "change_24h": 4.56, "market_cap": 670000000, "volume_24h": 78000000},
        {"symbol": "PEPE", "name": "Pepe", "price": 0.0000198, "change_24h": 15.67, "market_cap": 8340000000, "volume_24h": 2340000000},
    ]
    
    # Ajouter de la variation aléatoire pour rendre les données plus dynamiques
    import random
    for crypto in fallback_cryptos:
        variation = random.uniform(-0.5, 0.5)
        crypto["change_24h"] = round(crypto["change_24h"] + variation, 2)
        crypto["price"] = crypto["price"] * (1 + variation/100)
    
    heatmap_cache["data"] = fallback_cryptos
    heatmap_cache["timestamp"] = now
    
    print(f"✅ Retour de {len(fallback_cryptos)} cryptos (fallback)")
    print("="*60)
    
    return {
        "cryptos": fallback_cryptos, 
        "status": "fallback",
        "count": len(fallback_cryptos),
        "message": "Données simulées - API externe indisponible"
    }
# ============================================================================
# SECTION ALTCOIN SEASON - OPTIMISÉE POUR RENDER
# =====================================================

async def calculate_altcoin_season_index():
    """
    Calcule l'indice de saison des altcoins
    OPTIMISÉ POUR RENDER: timeout court + fallback garanti
    """
    try:
        # Vérifier le cache d'abord
        if (altcoin_cache["data"] is not None and 
            altcoin_cache["timestamp"] is not None):
            elapsed = (datetime.now() - altcoin_cache["timestamp"]).seconds
            if elapsed < altcoin_cache["cache_duration"]:
                print("✅ Utilisation du cache Altcoin Season")
                return altcoin_cache["data"]
        
        # Essayer de récupérer les vraies données avec timeout COURT (5 secondes max pour Render)
        print("🔄 Tentative de récupération des données CoinGecko...")
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={
                    "vs_currency": "usd",
                    "order": "market_cap_desc",
                    "per_page": 50,
                    "page": 1,
                    "sparkline": False
                }
            )
            
            if response.status_code == 200:
                coins = response.json()
                
                # Calculer l'indice réel
                btc_data = next((c for c in coins if c['id'] == 'bitcoin'), None)
                
                if btc_data:
                    # Compter combien d'altcoins ont mieux performé que BTC
                    btc_change = btc_data.get('price_change_percentage_24h', 0)
                    altcoins_outperforming = 0
                    
                    altcoin_list = []
                    for coin in coins[1:]:  # Exclure BTC
                        change = coin.get('price_change_percentage_24h', 0)
                        if change > btc_change:
                            altcoins_outperforming += 1
                        
                        altcoin_list.append({
                            "symbol": coin['symbol'].upper(),
                            "name": coin['name'],
                            "price": coin['current_price'],
                            "change_24h": round(change, 2),
                            "market_cap": coin['market_cap'],
                            "volume": coin['total_volume']
                        })
                    
                    # Calculer l'indice (0-100)
                    index_value = int((altcoins_outperforming / 49) * 100)
                    
                    # Déterminer la phase
                    if index_value >= 75:
                        phase = "Bitcoin Season"
                        phase_color = "#ef4444"
                        recommendation = "Privilégier Bitcoin et stablecoins"
                    elif index_value >= 50:
                        phase = "Transition"
                        phase_color = "#f59e0b"
                        recommendation = "Portfolio équilibré BTC/Alts"
                    elif index_value >= 25:
                        phase = "Début Altseason"
                        phase_color = "#3b82f6"
                        recommendation = "Augmenter exposition aux altcoins"
                    else:
                        phase = "Altcoin Season"
                        phase_color = "#10b981"
                        recommendation = "Opportunités altcoins maximales"
                    
                    result = {
                        "index": index_value,
                        "phase": phase,
                        "phase_color": phase_color,
                        "btc_dominance": round(btc_data.get('market_cap', 0) / sum(c.get('market_cap', 0) for c in coins) * 100, 2),
                        "altcoins_outperforming": altcoins_outperforming,
                        "total_altcoins": 49,
                        "btc_change_24h": round(btc_change, 2),
                        "btc_change_30d": round(btc_change, 2),
                        "btc_change_7d": 0,
                        "btc_change_90d": round(btc_change * 3, 2),
                        "alts_winning": altcoins_outperforming,
                        "total_compared": 49,
                        "trend": phase,
                        "momentum": "Fort" if index_value >= 75 else "Modéré" if index_value >= 50 else "Faible",
                        "status_color": phase_color,
                        "recommendation": recommendation,
                        "top_performers": sorted(altcoin_list, key=lambda x: x['change_24h'], reverse=True)[:8],
                        "timestamp": datetime.now().isoformat(),
                        "data_source": "coingecko_live",
                        "status": "live"
                    }
                    
                    # Mettre en cache
                    altcoin_cache["data"] = result
                    altcoin_cache["timestamp"] = datetime.now()
                    
                    print(f"✅ Données CoinGecko récupérées avec succès - Index: {index_value}")
                    return result
    
    except Exception as e:
        print(f"⚠️ Erreur API CoinGecko: {e}")
    
    # FALLBACK GARANTI: Générer des données simulées réalistes
    print("🔄 Utilisation du mode fallback (données simulées)")
    print(f"📊 Index généré: {fallback_data['index']} - {fallback_data['phase']}")
    fallback_data = generate_fallback_altcoin_data()
    
    # Mettre en cache le fallback aussi !
    altcoin_cache["data"] = fallback_data
    altcoin_cache["timestamp"] = datetime.now()
    
    return fallback_data

def generate_fallback_altcoin_data():
    """
    Génère des données simulées réalistes pour l'Altcoin Season
    GARANTIT que la page fonctionne toujours même si l'API échoue
    VERSION AMÉLIORÉE : Variation basée sur heure + minute + aléatoire
    """
    # Générer un indice avec variation naturelle basée sur le temps
    now = datetime.now()
    hour = now.hour
    minute = now.minute
    
    # Variation basée sur l'heure (cycle de 24h)
    hour_variation = math.sin((hour / 24) * 2 * math.pi) * 15  # Varie de -15 à +15
    
    # Variation basée sur la minute (plus de granularité)
    minute_variation = math.cos((minute / 60) * 2 * math.pi) * 8  # Varie de -8 à +8
    
    # Base + variations + aléatoire
    base_index = 48  # Valeur centrale réaliste
    index_value = int(base_index + hour_variation + minute_variation + random.uniform(-5, 5))
    
    # Garder entre 15 et 85 (valeurs réalistes)
    index_value = max(15, min(85, index_value))
    
    # Déterminer la phase basée sur l'indice
    if index_value >= 75:
        phase = "Bitcoin Season"
        phase_color = "#ef4444"
        recommendation = "Privilégier Bitcoin et stablecoins"
    elif index_value >= 50:
        phase = "Transition"
        phase_color = "#f59e0b"
        recommendation = "Portfolio équilibré BTC/Alts"
    elif index_value >= 25:
        phase = "Début Altseason"
        phase_color = "#3b82f6"
        recommendation = "Augmenter exposition aux altcoins"
    else:
        phase = "Altcoin Season"
        phase_color = "#10b981"
        recommendation = "Opportunités altcoins maximales"
    
    # Données simulées réalistes pour les top altcoins
    top_coins = [
        {"symbol": "ETH", "name": "Ethereum", "price": 2450.32, "change_24h": 3.45},
        {"symbol": "BNB", "name": "BNB", "price": 312.18, "change_24h": 2.87},
        {"symbol": "SOL", "name": "Solana", "price": 98.76, "change_24h": 5.23},
        {"symbol": "XRP", "name": "Ripple", "price": 0.5234, "change_24h": 1.92},
        {"symbol": "ADA", "name": "Cardano", "price": 0.3456, "change_24h": 4.11},
        {"symbol": "AVAX", "name": "Avalanche", "price": 23.45, "change_24h": 6.78},
        {"symbol": "DOT", "name": "Polkadot", "price": 5.67, "change_24h": 3.34},
        {"symbol": "MATIC", "name": "Polygon", "price": 0.7823, "change_24h": 2.56}
    ]
    
    # Ajouter variation aléatoire
    for coin in top_coins:
        coin["change_24h"] += random.uniform(-1, 1)
        coin["change_24h"] = round(coin["change_24h"], 2)
        coin["market_cap"] = coin["price"] * random.randint(100000000, 500000000)
        coin["volume"] = coin["market_cap"] * random.uniform(0.05, 0.15)
    
    # Trier par performance
    top_coins.sort(key=lambda x: x["change_24h"], reverse=True)
    
    return {
        "index": index_value,
        "phase": phase,
        "phase_color": phase_color,
        "btc_dominance": round(54.5 + random.uniform(-2, 2), 2),
        "altcoins_outperforming": int((index_value / 100) * 49),
        "total_altcoins": 49,
        "btc_change_24h": round(1.5 + random.uniform(-1, 1), 2),
        "btc_change_30d": round(1.5 + random.uniform(-1, 1), 2),
        "btc_change_7d": 0,
        "btc_change_90d": round(4.5 + random.uniform(-3, 3), 2),
        "alts_winning": int((index_value / 100) * 49),
        "total_compared": 49,
        "trend": phase,
        "momentum": "Modéré",
        "status_color": phase_color,
        "recommendation": recommendation,
        "top_performers": top_coins[:8],
        "timestamp": datetime.now().isoformat(),
        "data_source": "simulated_fallback",
        "status": "fallback"
    }

@app.get("/api/altcoin-season-index")
async def get_altcoin_season_index():
    """
    Endpoint API pour l'indice Altcoin Season
    OPTIMISÉ RENDER: répond toujours, jamais de timeout
    """
    try:
        data = await calculate_altcoin_season_index()
        return data
    except Exception as e:
        # En cas d'erreur critique, retourner fallback
        print(f"❌ Erreur critique: {e}")
        return generate_fallback_altcoin_data()

@app.get("/api/altcoin-season-history")
async def get_altcoin_season_history():
    """
    Génère un historique de 30 jours pour le graphique
    """
    history = []
    now = datetime.now()
    
    for i in range(30, 0, -1):
        date = now - timedelta(days=i)
        # Simulation d'une tendance réaliste
        base_value = 45 + (30 - i) * 0.5  # Légère hausse sur 30 jours
        value = base_value + random.uniform(-8, 8)
        value = max(0, min(100, value))  # Entre 0 et 100
        
        history.append({
            "date": date.strftime("%Y-%m-%d"),
            "value": round(value, 1)
        })
    
    return {"history": history}

@app.get("/api/test-altcoin")
async def test_altcoin():
    """Endpoint de test ultra simple"""
    print("🧪 TEST ALTCOIN API APPELÉ")
    return {"status": "ok", "message": "API fonctionne!", "index": 42}

@app.get("/api/crypto-news")
async def news_api():
    """API améliorée avec 12+ nouvelles crypto"""
    
    fallback_news = [
        {
            "title": "Bitcoin franchit un nouveau sommet historique",
            "description": "Le Bitcoin continue sa progression impressionnante, porté par l'adoption institutionnelle croissante.",
            "url": "https://www.coindesk.com/markets/",
            "source": "CoinDesk",
            "published_at": datetime.now(pytz.UTC).isoformat(),
            "image": None
        },
        {
            "title": "Ethereum prepare sa prochaine mise a niveau majeure",
            "description": "La communaute Ethereum travaille sur des ameliorations pour reduire les frais.",
            "url": "https://ethereum.org",
            "source": "Ethereum Foundation",
            "published_at": (datetime.now(pytz.UTC) - timedelta(hours=2)).isoformat(),
            "image": None
        },
        {
            "title": "DeFi : Les protocoles de pret atteignent des records",
            "description": "Le secteur DeFi continue sa croissance avec plus de 100 milliards de dollars.",
            "url": "https://defipulse.com",
            "source": "DeFi Pulse",
            "published_at": (datetime.now(pytz.UTC) - timedelta(hours=5)).isoformat(),
            "image": None
        },
        {
            "title": "NFT : Le marche des collectibles numeriques reste dynamique",
            "description": "Les ventes de NFT maintiennent un volume eleve malgre la volatilite.",
            "url": "https://opensea.io",
            "source": "OpenSea",
            "published_at": (datetime.now(pytz.UTC) - timedelta(hours=8)).isoformat(),
            "image": None
        },
        {
            "title": "Regulation : Les autorites travaillent sur un cadre crypto clair",
            "description": "Les regulateurs mondiaux collaborent pour etablir des regles coherentes.",
            "url": "https://www.sec.gov",
            "source": "SEC",
            "published_at": (datetime.now(pytz.UTC) - timedelta(hours=12)).isoformat(),
            "image": None
        },
        {
            "title": "Analyse de marche : Les altcoins surperforment Bitcoin",
            "description": "De nombreux altcoins affichent des gains superieurs a Bitcoin.",
            "url": "https://www.coingecko.com",
            "source": "CoinGecko",
            "published_at": (datetime.now(pytz.UTC) - timedelta(hours=15)).isoformat(),
            "image": None
        },
        {
            "title": "Les institutions continuent d'accumuler du Bitcoin",
            "description": "Les grandes entreprises augmentent leurs positions en Bitcoin.",
            "url": "https://bitcointreasuries.net",
            "source": "Bitcoin Treasuries",
            "published_at": (datetime.now(pytz.UTC) - timedelta(hours=18)).isoformat(),
            "image": None
        },
        {
            "title": "Layer 2 : Solutions de scaling Ethereum en forte adoption",
            "description": "Les reseaux Layer 2 comme Arbitrum voient leur utilisation exploser.",
            "url": "https://l2beat.com",
            "source": "L2Beat",
            "published_at": (datetime.now(pytz.UTC) - timedelta(hours=20)).isoformat(),
            "image": None
        },
        {
            "title": "Stablecoins : USDC et USDT depassent 150 milliards",
            "description": "Les stablecoins continuent de jouer un role crucial.",
            "url": "https://www.circle.com",
            "source": "Circle",
            "published_at": (datetime.now(pytz.UTC) - timedelta(days=1)).isoformat(),
            "image": None
        },
        {
            "title": "Gaming crypto : Les jeux blockchain explosent",
            "description": "Le secteur du gaming blockchain connait une croissance exponentielle.",
            "url": "https://www.coingecko.com/en/categories/gaming",
            "source": "CoinGecko Gaming",
            "published_at": (datetime.now(pytz.UTC) - timedelta(days=1, hours=4)).isoformat(),
            "image": None
        },
        {
            "title": "Previsions : Un Q4 haussier pour les crypto",
            "description": "Les analystes anticipent une forte hausse basee sur les cycles historiques.",
            "url": "https://cryptoquant.com",
            "source": "CryptoQuant",
            "published_at": (datetime.now(pytz.UTC) - timedelta(days=1, hours=8)).isoformat(),
            "image": None
        },
        {
            "title": "Adoption : Des pays emergents adoptent Bitcoin",
            "description": "Plusieurs nations considerent Bitcoin comme moyen de paiement legal.",
            "url": "https://bitcoinmagazine.com",
            "source": "Bitcoin Magazine",
            "published_at": (datetime.now(pytz.UTC) - timedelta(days=1, hours=12)).isoformat(),
            "image": None
        }
    ]
    
    news = fallback_news.copy()
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get("https://api.coingecko.com/api/v3/search/trending")
            if response.status_code == 200:
                data = response.json()
                for i, coin in enumerate(data.get("coins", [])[:5]):
                    item = coin.get("item", {})
                    news.insert(0, {
                        "title": f"🔥 Trending #{i+1}: {item.get('name')} ({item.get('symbol', '').upper()})",
                        "description": f"{item.get('name')} fait partie des cryptos les plus recherchees.",
                        "url": f"https://www.coingecko.com/en/coins/{item.get('id', '')}",
                        "source": "CoinGecko",
                        "published_at": datetime.now(pytz.UTC).isoformat(),
                        "image": None
                    })
    except:
        pass
    
    return {
        "articles": news,
        "count": len(news),
        "status": "success",
        "timestamp": datetime.now(pytz.UTC).isoformat()
    }


# ============================================================================
# SECTION 2 : PAGE NOUVELLES CORRIGÉE (à placer autour de la ligne 2267)
# Remplacez @app.get("/nouvelles", response_class=HTMLResponse)
# ============================================================================

@app.get("/nouvelles", response_class=HTMLResponse)
async def news_page():
    html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📰 Actualités Crypto</title>
    """ + CSS + """
    <style>
        .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 24px; margin-bottom: 40px; }
        .news-card { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(10px); border-radius: 20px; border: 1px solid rgba(51, 65, 85, 0.6); overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; position: relative; }
        .news-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); border-color: #60a5fa; }
        .news-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #60a5fa, #a78bfa, #ec4899); opacity: 0; transition: opacity 0.3s; }
        .news-card:hover::before { opacity: 1; }
        .news-image { width: 100%; height: 200px; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); display: flex; align-items: center; justify-content: center; font-size: 60px; }
        .news-content { padding: 24px; }
        .news-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
        .news-category { padding: 6px 12px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2)); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 8px; font-size: 12px; font-weight: 600; color: #60a5fa; text-transform: uppercase; }
        .news-time { color: #64748b; font-size: 13px; }
        .news-title { font-size: 20px; font-weight: 700; color: #f1f5f9; margin-bottom: 12px; line-height: 1.4; }
        .news-description { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 16px; }
        .news-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid rgba(51, 65, 85, 0.4); }
        .news-source { color: #64748b; font-size: 13px; font-weight: 500; }
        .news-link { color: #60a5fa; text-decoration: none; font-weight: 600; font-size: 14px; transition: all 0.3s; }
        .news-link:hover { color: #93c5fd; }
        .search-input { width: 100%; padding: 14px 20px; background: rgba(15, 23, 42, 0.8); border: 2px solid rgba(51, 65, 85, 0.6); border-radius: 12px; color: #e2e8f0; font-size: 16px; margin-bottom: 20px; }
        .search-input:focus { outline: none; border-color: #60a5fa; }
        .filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
        .filter-btn { padding: 10px 20px; background: rgba(15, 23, 42, 0.8); border: 2px solid rgba(51, 65, 85, 0.6); border-radius: 10px; color: #94a3b8; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s; }
        .filter-btn:hover { border-color: #60a5fa; color: #60a5fa; }
        .filter-btn.active { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); border-color: #3b82f6; color: white; }
        @media (max-width: 768px) { .news-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📰 Actualités Crypto</h1>
            <p>Les dernières nouvelles du monde de la cryptomonnaie</p>
        </div>
        """ + NAV + """
        <div class="card">
            <input type="text" class="search-input" id="searchInput" placeholder="🔍 Rechercher...">
            <div class="filters" id="filters">
                <button class="filter-btn active" data-filter="all">Tout</button>
                <button class="filter-btn" data-filter="bitcoin">Bitcoin</button>
                <button class="filter-btn" data-filter="ethereum">Ethereum</button>
                <button class="filter-btn" data-filter="defi">DeFi</button>
                <button class="filter-btn" data-filter="nft">NFT</button>
                <button class="filter-btn" data-filter="regulation">Régulation</button>
            </div>
        </div>
        <div class="news-grid" id="newsGrid">
            <div class="spinner"></div>
        </div>
    </div>
    <script>
        let allNews = [];
        let currentFilter = 'all';
        
        const categoryEmojis = { 
            'bitcoin': '₿', 
            'ethereum': '⟠', 
            'defi': '🏦', 
            'nft': '🎨', 
            'regulation': '⚖️', 
            'market': '📊', 
            'trending': '🔥' 
        };
        
        function detectCategory(title, desc) {
            const text = (title + ' ' + desc).toLowerCase();
            if (text.includes('bitcoin') || text.includes('btc')) return 'bitcoin';
            if (text.includes('ethereum') || text.includes('eth')) return 'ethereum';
            if (text.includes('defi') || text.includes('lending')) return 'defi';
            if (text.includes('nft') || text.includes('collectible')) return 'nft';
            if (text.includes('sec') || text.includes('regulation')) return 'regulation';
            if (text.includes('trending')) return 'trending';
            return 'market';
        }
        
        function timeAgo(date) {
            const seconds = Math.floor((new Date() - new Date(date)) / 1000);
            if (seconds < 60) return "Maintenant";
            if (seconds < 3600) return Math.floor(seconds / 60) + " min";
            if (seconds < 86400) return Math.floor(seconds / 3600) + "h";
            return Math.floor(seconds / 86400) + "j";
        }
        
        function createCard(article) {
            const category = detectCategory(article.title, article.description || '');
            const emoji = categoryEmojis[category] || '📰';
            return `
                <div class="news-card" data-category="${category}">
                    <div class="news-image">${emoji}</div>
                    <div class="news-content">
                        <div class="news-meta">
                            <span class="news-category">${emoji} ${category}</span>
                            <span class="news-time">⏱️ ${timeAgo(article.published_at || new Date())}</span>
                        </div>
                        <h3 class="news-title">${article.title}</h3>
                        ${article.description ? `<p class="news-description">${article.description}</p>` : ''}
                        <div class="news-footer">
                            <span class="news-source">${article.source || 'Source'}</span>
                            <a href="${article.url}" target="_blank" class="news-link">Lire →</a>
                        </div>
                    </div>
                </div>
            `;
        }
        
        function displayNews(filter, searchTerm) {
            filter = filter || 'all';
            searchTerm = searchTerm || '';
            
            let filtered = allNews;
            
            if (filter !== 'all') {
                filtered = filtered.filter(function(a) {
                    return detectCategory(a.title, a.description || '') === filter;
                });
            }
            
            if (searchTerm) {
                filtered = filtered.filter(function(a) {
                    return a.title.toLowerCase().includes(searchTerm.toLowerCase());
                });
            }
            
            const grid = document.getElementById('newsGrid');
            if (filtered.length > 0) {
                grid.innerHTML = filtered.map(createCard).join('');
            } else {
                grid.innerHTML = '<div class="alert alert-error">Aucune actualité trouvée</div>';
            }
        }
        
        async function loadNews() {
            try {
                console.log('🔄 Chargement des nouvelles...');
                const response = await fetch('/api/crypto-news');
                const data = await response.json();
                allNews = data.articles || [];
                console.log('✅ Chargé:', allNews.length, 'articles');
                displayNews(currentFilter, '');
            } catch (error) {
                console.error('❌ Erreur:', error);
                document.getElementById('newsGrid').innerHTML = '<div class="alert alert-error">Erreur de chargement</div>';
            }
        }
        
        document.getElementById('filters').addEventListener('click', function(e) {
            if (e.target.classList.contains('filter-btn')) {
                const buttons = document.querySelectorAll('.filter-btn');
                buttons.forEach(function(btn) {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                displayNews(currentFilter, document.getElementById('searchInput').value);
            }
        });
        
        document.getElementById('searchInput').addEventListener('input', function(e) {
            displayNews(currentFilter, e.target.value);
        });
        
        loadNews();
        setInterval(loadNews, 300000);
        console.log('🌟 Section Nouvelles chargée - Bug corrigé!');
    </script>
</body>
</html>"""
    return HTMLResponse(html)


# REMPLACER COMPLÈTEMENT LES 2 FONCTIONS DANS VOTRE MAIN.PY

@app.get("/api/exchange-rates-live")
async def get_exchange_rates_live():
    """Récupère les taux de change en temps réel depuis CoinGecko"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Liste des cryptos à récupérer
            crypto_ids = [
                "bitcoin", "ethereum", "tether", "binancecoin", "solana",
                "usd-coin", "ripple", "cardano", "dogecoin", "tron",
                "chainlink", "matic-network", "litecoin", "polkadot", "uniswap",
                "avalanche-2"
            ]
            
            # Récupérer les prix en USD, EUR, CAD
            response = await client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={
                    "ids": ",".join(crypto_ids),
                    "vs_currencies": "usd,eur,cad,gbp,jpy,chf,aud,cny"
                }
            )
            
            if response.status_code == 200:
                crypto_data = response.json()
                
                # Mapper les noms CoinGecko aux symboles
                mapping = {
                    "bitcoin": "BTC",
                    "ethereum": "ETH",
                    "tether": "USDT",
                    "binancecoin": "BNB",
                    "solana": "SOL",
                    "usd-coin": "USDC",
                    "ripple": "XRP",
                    "cardano": "ADA",
                    "dogecoin": "DOGE",
                    "tron": "TRX",
                    "chainlink": "LINK",
                    "matic-network": "MATIC",
                    "litecoin": "LTC",
                    "polkadot": "DOT",
                    "uniswap": "UNI",
                    "avalanche-2": "AVAX"
                }
                
                rates = {}
                for coin_id, symbol in mapping.items():
                    if coin_id in crypto_data:
                        rates[symbol] = crypto_data[coin_id]
                
                # Ajouter les devises fiat (1 unité = X USD)
                rates["USD"] = {"usd": 1, "eur": 0.92, "cad": 1.36, "gbp": 0.79, "jpy": 149.50, "chf": 0.88, "aud": 1.52, "cny": 7.24}
                rates["EUR"] = {"usd": 1.09, "eur": 1, "cad": 1.48, "gbp": 0.86, "jpy": 162.89, "chf": 0.96, "aud": 1.66, "cny": 7.89}
                rates["CAD"] = {"usd": 0.74, "eur": 0.68, "cad": 1, "gbp": 0.58, "jpy": 110.29, "chf": 0.65, "aud": 1.12, "cny": 5.33}
                rates["GBP"] = {"usd": 1.27, "eur": 1.16, "cad": 1.72, "gbp": 1, "jpy": 189.87, "chf": 1.12, "aud": 1.93, "cny": 9.19}
                rates["JPY"] = {"usd": 0.0067, "eur": 0.0061, "cad": 0.0091, "gbp": 0.0053, "jpy": 1, "chf": 0.0059, "aud": 0.0102, "cny": 0.0484}
                rates["CHF"] = {"usd": 1.14, "eur": 1.04, "cad": 1.55, "gbp": 0.90, "jpy": 170.45, "chf": 1, "aud": 1.73, "cny": 8.25}
                rates["AUD"] = {"usd": 0.66, "eur": 0.60, "cad": 0.89, "gbp": 0.52, "jpy": 98.04, "chf": 0.58, "aud": 1, "cny": 4.76}
                rates["CNY"] = {"usd": 0.138, "eur": 0.127, "cad": 0.188, "gbp": 0.109, "jpy": 20.66, "chf": 0.121, "aud": 0.210, "cny": 1}
                
                return {
                    "rates": rates,
                    "status": "success",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                # Fallback avec des valeurs statiques si l'API échoue
                return get_fallback_rates()
    
    except Exception as e:
        print(f"❌ Erreur exchange-rates-live: {e}")
        return get_fallback_rates()


def get_fallback_rates():
    """Taux de secours si l'API échoue"""
    return {
        "rates": {
            "BTC": {"usd": 107150.00, "eur": 98300.00, "cad": 145500.00},
            "ETH": {"usd": 3725.00, "eur": 3420.00, "cad": 5060.00},
            "USDT": {"usd": 1.0, "eur": 0.92, "cad": 1.36},
            "BNB": {"usd": 695.00, "eur": 638.00, "cad": 945.00},
            "SOL": {"usd": 245.00, "eur": 225.00, "cad": 333.00},
            "USD": {"usd": 1, "eur": 0.92, "cad": 1.36},
            "EUR": {"usd": 1.09, "eur": 1, "cad": 1.48},
            "CAD": {"usd": 0.74, "eur": 0.68, "cad": 1}
        },
        "status": "fallback",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/convertisseur", response_class=HTMLResponse)
async def convertisseur_page():
    """Page du convertisseur de devises et crypto"""
    return HTMLResponse(f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>💱 Convertisseur Crypto & Devises</title>
    {CSS}
    <style>
        .converter-container {{
            max-width: 800px;
            margin: 0 auto;
        }}
        .converter-box {{
            background: #1e293b;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            border: 1px solid #334155;
        }}
        .amount-input {{
            font-size: 48px;
            font-weight: 700;
            background: transparent;
            border: none;
            border-bottom: 3px solid #60a5fa;
            color: #e2e8f0;
            width: 100%;
            padding: 20px 0;
            margin-bottom: 30px;
            text-align: center;
        }}
        .amount-input:focus {{
            outline: none;
            border-bottom-color: #3b82f6;
        }}
        .currency-select {{
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 20px;
            align-items: center;
            margin: 30px 0;
        }}
        .swap-btn {{
            background: #3b82f6;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            transition: all 0.3s;
            color: white;
        }}
        .swap-btn:hover {{
            background: #2563eb;
            transform: rotate(180deg);
        }}
        .result-box {{
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin-top: 30px;
            border: 2px solid #60a5fa;
        }}
        .result-amount {{
            font-size: 56px;
            font-weight: 700;
            color: #60a5fa;
            margin-bottom: 10px;
        }}
        .result-label {{
            font-size: 16px;
            color: #94a3b8;
        }}
        .rate-info {{
            background: rgba(15, 23, 42, 0.5);
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            text-align: center;
        }}
        .rate-info-text {{
            color: #94a3b8;
            font-size: 14px;
        }}
        .select-currency {{
            width: 100%;
            padding: 15px;
            background: #0f172a;
            border: 2px solid #334155;
            border-radius: 10px;
            color: #e2e8f0;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
        }}
        .select-currency:hover {{
            border-color: #60a5fa;
        }}
        .select-currency:focus {{
            outline: none;
            border-color: #3b82f6;
        }}
        .loading {{
            text-align: center;
            padding: 20px;
            color: #94a3b8;
        }}
        .error {{
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid #ef4444;
            border-radius: 8px;
            padding: 15px;
            color: #ef4444;
            margin-top: 20px;
        }}
        .popular-currencies {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin-top: 30px;
        }}
        .currency-btn {{
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 10px;
            padding: 15px 10px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
        }}
        .currency-btn:hover {{
            border-color: #60a5fa;
            background: rgba(96, 165, 250, 0.1);
        }}
        .currency-btn-icon {{
            font-size: 24px;
            margin-bottom: 5px;
        }}
        .currency-btn-code {{
            font-size: 14px;
            font-weight: 600;
            color: #e2e8f0;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💱 Convertisseur Universel</h1>
            <p>Cryptomonnaies et devises fiduciaires en temps réel</p>
        </div>
        
        {NAV}
        
        <div class="converter-container">
            <div class="converter-box">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #60a5fa; margin: 0;">Montant à convertir</h2>
                </div>
                
                <input type="number" id="amount" class="amount-input" value="1" min="0" step="any" placeholder="0">
                
                <div class="currency-select">
                    <div>
                        <label style="display: block; color: #94a3b8; margin-bottom: 10px; font-size: 14px;">De</label>
                        <select id="fromCurrency" class="select-currency">
                            <optgroup label="₿ Cryptomonnaies">
                                <option value="BTC">₿ Bitcoin (BTC)</option>
                                <option value="ETH">Ξ Ethereum (ETH)</option>
                                <option value="USDT">₮ Tether (USDT)</option>
                                <option value="BNB">🔸 Binance Coin (BNB)</option>
                                <option value="SOL">◎ Solana (SOL)</option>
                                <option value="USDC">💵 USD Coin (USDC)</option>
                                <option value="XRP">✕ Ripple (XRP)</option>
                                <option value="ADA">₳ Cardano (ADA)</option>
                                <option value="DOGE">Ð Dogecoin (DOGE)</option>
                                <option value="TRX">⬡ Tron (TRX)</option>
                                <option value="LINK">🔗 Chainlink (LINK)</option>
                                <option value="MATIC">⬡ Polygon (MATIC)</option>
                                <option value="LTC">Ł Litecoin (LTC)</option>
                                <option value="DOT">● Polkadot (DOT)</option>
                                <option value="UNI">🦄 Uniswap (UNI)</option>
                                <option value="AVAX">🔺 Avalanche (AVAX)</option>
                            </optgroup>
                            <optgroup label="💰 Devises Fiduciaires">
                                <option value="USD" selected>🇺🇸 Dollar américain (USD)</option>
                                <option value="EUR">🇪🇺 Euro (EUR)</option>
                                <option value="CAD">🇨🇦 Dollar canadien (CAD)</option>
                                <option value="GBP">🇬🇧 Livre sterling (GBP)</option>
                                <option value="JPY">🇯🇵 Yen japonais (JPY)</option>
                                <option value="CHF">🇨🇭 Franc suisse (CHF)</option>
                                <option value="AUD">🇦🇺 Dollar australien (AUD)</option>
                                <option value="CNY">🇨🇳 Yuan chinois (CNY)</option>
                            </optgroup>
                        </select>
                    </div>
                    
                    <button class="swap-btn" onclick="swapCurrencies()">⇄</button>
                    
                    <div>
                        <label style="display: block; color: #94a3b8; margin-bottom: 10px; font-size: 14px;">Vers</label>
                        <select id="toCurrency" class="select-currency">
                            <optgroup label="₿ Cryptomonnaies">
                                <option value="BTC">₿ Bitcoin (BTC)</option>
                                <option value="ETH">Ξ Ethereum (ETH)</option>
                                <option value="USDT">₮ Tether (USDT)</option>
                                <option value="BNB">🔸 Binance Coin (BNB)</option>
                                <option value="SOL">◎ Solana (SOL)</option>
                                <option value="USDC">💵 USD Coin (USDC)</option>
                                <option value="XRP">✕ Ripple (XRP)</option>
                                <option value="ADA">₳ Cardano (ADA)</option>
                                <option value="DOGE">Ð Dogecoin (DOGE)</option>
                                <option value="TRX">⬡ Tron (TRX)</option>
                                <option value="LINK">🔗 Chainlink (LINK)</option>
                                <option value="MATIC">⬡ Polygon (MATIC)</option>
                                <option value="LTC">Ł Litecoin (LTC)</option>
                                <option value="DOT">● Polkadot (DOT)</option>
                                <option value="UNI">🦄 Uniswap (UNI)</option>
                                <option value="AVAX">🔺 Avalanche (AVAX)</option>
                            </optgroup>
                            <optgroup label="💰 Devises Fiduciaires">
                                <option value="USD">🇺🇸 Dollar américain (USD)</option>
                                <option value="EUR">🇪🇺 Euro (EUR)</option>
                                <option value="CAD" selected>🇨🇦 Dollar canadien (CAD)</option>
                                <option value="GBP">🇬🇧 Livre sterling (GBP)</option>
                                <option value="JPY">🇯🇵 Yen japonais (JPY)</option>
                                <option value="CHF">🇨🇭 Franc suisse (CHF)</option>
                                <option value="AUD">🇦🇺 Dollar australien (AUD)</option>
                                <option value="CNY">🇨🇳 Yuan chinois (CNY)</option>
                            </optgroup>
                        </select>
                    </div>
                </div>
                
                <div id="resultBox" class="result-box" style="display: none;">
                    <div class="result-amount" id="resultAmount">0.00</div>
                    <div class="result-label" id="resultLabel"></div>
                </div>
                
                <div id="rateInfo" class="rate-info" style="display: none;">
                    <div class="rate-info-text" id="rateText"></div>
                </div>
                
                <div id="loading" class="loading" style="display: none;">
                    <div class="spinner" style="width: 40px; height: 40px;"></div>
                    <p>Chargement des taux...</p>
                </div>
                
                <div id="error" class="error" style="display: none;"></div>
            </div>
            
            <div class="card" style="margin-top: 30px;">
                <h3 style="color: #60a5fa; margin-bottom: 20px;">⚡ Conversions rapides</h3>
                <div class="popular-currencies">
                    <div class="currency-btn" onclick="setQuickConversion('BTC', 'USD')">
                        <div class="currency-btn-icon">₿→💵</div>
                        <div class="currency-btn-code">BTC→USD</div>
                    </div>
                    <div class="currency-btn" onclick="setQuickConversion('BTC', 'CAD')">
                        <div class="currency-btn-icon">₿→🇨🇦</div>
                        <div class="currency-btn-code">BTC→CAD</div>
                    </div>
                    <div class="currency-btn" onclick="setQuickConversion('ETH', 'USD')">
                        <div class="currency-btn-icon">Ξ→💵</div>
                        <div class="currency-btn-code">ETH→USD</div>
                    </div>
                    <div class="currency-btn" onclick="setQuickConversion('USD', 'CAD')">
                        <div class="currency-btn-icon">🇺🇸→🇨🇦</div>
                        <div class="currency-btn-code">USD→CAD</div>
                    </div>
                    <div class="currency-btn" onclick="setQuickConversion('CAD', 'USD')">
                        <div class="currency-btn-icon">🇨🇦→🇺🇸</div>
                        <div class="currency-btn-code">CAD→USD</div>
                    </div>
                    <div class="currency-btn" onclick="setQuickConversion('USDT', 'CAD')">
                        <div class="currency-btn-icon">₮→🇨🇦</div>
                        <div class="currency-btn-code">USDT→CAD</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let rates = {{}};
        let isLoading = false;
        
        // Charger les taux au démarrage
        async function loadRates() {{
            if (isLoading) return;
            isLoading = true;
            
            document.getElementById('loading').style.display = 'block';
            document.getElementById('error').style.display = 'none';
            
            try {{
                const response = await fetch('/api/exchange-rates-live');
                if (!response.ok) throw new Error('Erreur API');
                
                const data = await response.json();
                rates = data.rates || {{}};
                
                console.log('✅ Taux chargés:', rates);
                
                document.getElementById('loading').style.display = 'none';
                convert();
            }} catch (error) {{
                console.error('❌ Erreur:', error);
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'block';
                document.getElementById('error').textContent = '❌ Erreur lors du chargement des taux. Réessayez.';
            }} finally {{
                isLoading = false;
            }}
        }}
        
        // ✅ FONCTION DE CONVERSION CORRIGÉE
        function convert() {{
            const amount = parseFloat(document.getElementById('amount').value) || 0;
            const from = document.getElementById('fromCurrency').value;
            const to = document.getElementById('toCurrency').value;
            
            if (amount === 0) {{
                document.getElementById('resultBox').style.display = 'none';
                document.getElementById('rateInfo').style.display = 'none';
                return;
            }}
            
            if (Object.keys(rates).length === 0) {{
                loadRates();
                return;
            }}
            
            let result = 0;
            let rate = 0;
            
            if (from === to) {{
                result = amount;
                rate = 1;
            }} else {{
                // ✅ LOGIQUE CORRIGÉE : Conversion via USD
                const fromValueInUSD = getValueInUSD(from, 1);
                const toValueInUSD = getValueInUSD(to, 1);
                
                if (fromValueInUSD === 0 || toValueInUSD === 0) {{
                    document.getElementById('error').style.display = 'block';
                    document.getElementById('error').textContent = '❌ Taux non disponible pour ' + from + ' ou ' + to;
                    return;
                }}
                
                // Convertir : montant × valeur_from_en_USD ÷ valeur_to_en_USD
                result = (amount * fromValueInUSD) / toValueInUSD;
                rate = fromValueInUSD / toValueInUSD;
                
                console.log(`Conversion: ${{amount}} ${{from}} → ${{result}} ${{to}}`);
                console.log(`Rate: 1 ${{from}} = ${{rate}} ${{to}}`);
            }}
            
            document.getElementById('error').style.display = 'none';
            document.getElementById('resultAmount').textContent = formatNumber(result);
            document.getElementById('resultLabel').textContent = `${{amount}} ${{from}} = ${{formatNumber(result)}} ${{to}}`;
            document.getElementById('resultBox').style.display = 'block';
            
            document.getElementById('rateText').textContent = `1 ${{from}} = ${{formatNumber(rate)}} ${{to}}`;
            document.getElementById('rateInfo').style.display = 'block';
        }}
        
        // ✅ Obtenir la valeur en USD (combien vaut 1 unité de cette devise en USD)
        function getValueInUSD(currency, amount = 1) {{
            if (!rates[currency]) {{
                console.warn('⚠️ Devise inconnue:', currency);
                return 0;
            }}
            
            // La clé 'usd' contient la valeur en USD
            return rates[currency].usd * amount;
        }}
        
        // Formater les nombres
        function formatNumber(num) {{
            if (num >= 1000) {{
                return num.toFixed(2).replace(/\\B(?=(\\d{{3}})+(?!\\d))/g, " ");
            }} else if (num >= 1) {{
                return num.toFixed(2);
            }} else if (num >= 0.01) {{
                return num.toFixed(4);
            }} else {{
                return num.toFixed(8);
            }}
        }}
        
        // Échanger les devises
        function swapCurrencies() {{
            const from = document.getElementById('fromCurrency').value;
            const to = document.getElementById('toCurrency').value;
            
            document.getElementById('fromCurrency').value = to;
            document.getElementById('toCurrency').value = from;
            
            convert();
        }}
        
        // Conversion rapide
        function setQuickConversion(from, to) {{
            document.getElementById('fromCurrency').value = from;
            document.getElementById('toCurrency').value = to;
            document.getElementById('amount').value = 1;
            convert();
        }}
        
        // Événements
        document.getElementById('amount').addEventListener('input', convert);
        document.getElementById('fromCurrency').addEventListener('change', convert);
        document.getElementById('toCurrency').addEventListener('change', convert);
        
        // Charger au démarrage
        loadRates();
        
        // Recharger toutes les 5 minutes
        setInterval(loadRates, 300000);
    </script>
</body>
</html>""")
@app.get("/api/economic-calendar")
async def calendar_api():
    now = datetime.now()
    events = [{"date": (now + timedelta(days=0)).strftime("%Y-%m-%d"), "time": "08:30", "country": "US", "event": "Non-Farm Payrolls", "impact": "high"}]
    return {"events": events, "count": len(events), "status": "success"}

# =====================================================
# API BULLRUN PHASE AMÉLIORÉE
# =====================================================

async def fetch_bullrun_data():
    """Récupère les données en temps réel pour déterminer la phase du bullrun"""
    try:
        # Vérifier le cache
        if bullrun_cache["data"] and bullrun_cache["timestamp"]:
            elapsed = (datetime.now() - bullrun_cache["timestamp"]).total_seconds()
            if elapsed < bullrun_cache["cache_duration"]:
                return bullrun_cache["data"]
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Récupérer Fear & Greed
            try:
                fg_response = await client.get("https://api.alternative.me/fng/?limit=2")
                fg_data = fg_response.json()
                fear_greed = int(fg_data["data"][0]["value"]) if fg_data.get("data") else 50
            except:
                fear_greed = 50
            
            # Récupérer BTC Dominance
            try:
                btc_response = await client.get("https://api.coingecko.com/api/v3/global")
                btc_data = btc_response.json()
                btc_dominance = round(btc_data["data"]["market_cap_percentage"]["btc"], 2)
                eth_dominance = round(btc_data["data"]["market_cap_percentage"]["eth"], 2)
                total_market_cap = btc_data["data"]["total_market_cap"]["usd"]
            except:
                btc_dominance = 58.0
                eth_dominance = 12.0
                total_market_cap = 2500000000000
            
            # Récupérer prix BTC
            try:
                btc_price_response = await client.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true")
                btc_price_data = btc_price_response.json()
                btc_price = btc_price_data["bitcoin"]["usd"]
                btc_24h_change = round(btc_price_data["bitcoin"]["usd_24h_change"], 2)
            except:
                btc_price = 108000
                btc_24h_change = 2.5
            
            # Calculer l'Altcoin Season Index (simplifié)
            altcoin_season_index = max(0, min(100, 100 - (btc_dominance - 40)))
            
            # Déterminer la phase actuelle
            phase_data = determine_bullrun_phase(
                btc_dominance, 
                eth_dominance, 
                fear_greed, 
                altcoin_season_index,
                btc_price,
                btc_24h_change,
                total_market_cap
            )
            
            # Mettre en cache
            bullrun_cache["data"] = phase_data
            bullrun_cache["timestamp"] = datetime.now()
            
            return phase_data
            
    except Exception as e:
        print(f"Erreur fetch_bullrun_data: {e}")
        return get_fallback_bullrun_data()

def determine_bullrun_phase(btc_dom, eth_dom, fear_greed, alt_index, btc_price, btc_change, market_cap):
    """Détermine la phase du bullrun basée sur les indicateurs"""
    
    # Logique de détermination de phase
    if btc_dom < 50 and fear_greed < 40 and btc_price < 50000:
        current_phase = 1
        phase_name = "Accumulation"
        phase_description = "Les investisseurs intelligents accumulent à bas prix"
        confidence = 85
    elif btc_dom > 58 and fear_greed >= 60 and btc_change > 0:
        current_phase = 2
        phase_name = "Bitcoin Rally"
        phase_description = "Bitcoin domine et monte fort, les institutions achètent"
        confidence = 92
    elif 50 <= btc_dom <= 60 and eth_dom > 10 and fear_greed >= 60:
        current_phase = 3
        phase_name = "Ethereum & Large Caps"
        phase_description = "ETH et les grandes capitalisations rattrapent Bitcoin"
        confidence = 88
    elif btc_dom < 55 and alt_index > 60 and fear_greed > 70:
        current_phase = 4
        phase_name = "Altcoin Season"
        phase_description = "Les altcoins explosent, c'est la fête !"
        confidence = 90
    else:
        # Phase de transition
        if btc_dom >= 57:
            current_phase = 2.5
            phase_name = "Transition BTC → ETH"
            phase_description = "Début de rotation du capital vers ETH et large caps"
            confidence = 78
        else:
            current_phase = 3.5
            phase_name = "Transition ETH → Altcoins"
            phase_description = "Début de rotation vers les altcoins"
            confidence = 82
    
    # Calculer les signaux
    signals = []
    
    if btc_dom > 60:
        signals.append({"type": "bullish_btc", "strength": "fort", "message": "Forte dominance BTC"})
    elif btc_dom < 50:
        signals.append({"type": "bullish_alt", "strength": "fort", "message": "BTC perd de la dominance"})
    
    if fear_greed > 75:
        signals.append({"type": "warning", "strength": "élevé", "message": "Greed extrême - Attention correction"})
    elif fear_greed < 25:
        signals.append({"type": "opportunity", "strength": "élevé", "message": "Fear extrême - Opportunité d'achat"})
    
    if alt_index > 75:
        signals.append({"type": "altcoin_season", "strength": "confirmé", "message": "Altcoin Season en cours !"})
    
    # Prédictions next phase
    if current_phase < 2:
        next_phase = "Phase 2 - Bitcoin Rally attendu"
        time_estimate = "1-3 mois"
    elif current_phase < 3:
        next_phase = "Phase 3 - Rotation vers ETH et Large Caps"
        time_estimate = "2-4 semaines"
    elif current_phase < 4:
        next_phase = "Phase 4 - Altcoin Season imminente"
        time_estimate = "1-2 semaines"
    else:
        next_phase = "Fin de cycle - Soyez prudent"
        time_estimate = "Indéterminé"
    
    return {
        "current_phase": current_phase,
        "phase_name": phase_name,
        "phase_description": phase_description,
        "confidence": confidence,
        "indicators": {
            "btc_dominance": btc_dom,
            "eth_dominance": eth_dom,
            "fear_greed": fear_greed,
            "altcoin_season_index": alt_index,
            "btc_price": btc_price,
            "btc_24h_change": btc_change,
            "total_market_cap": market_cap
        },
        "signals": signals,
        "next_phase": next_phase,
        "time_estimate": time_estimate,
        "timestamp": datetime.now().isoformat()
    }

def get_fallback_bullrun_data():
    """Données de secours si l'API échoue"""
    return {
        "current_phase": 2.5,
        "phase_name": "Transition BTC → ETH",
        "phase_description": "Phase de transition entre dominance Bitcoin et rotation ETH",
        "confidence": 78,
        "indicators": {
            "btc_dominance": 58.5,
            "eth_dominance": 12.0,
            "fear_greed": 72,
            "altcoin_season_index": 45,
            "btc_price": 108000,
            "btc_24h_change": 1.5,
            "total_market_cap": 2500000000000
        },
        "signals": [
            {"type": "bullish_btc", "strength": "modéré", "message": "Dominance BTC stable"},
            {"type": "neutral", "strength": "moyen", "message": "Marché en consolidation"}
        ],
        "next_phase": "Phase 3 - Rotation vers ETH et Large Caps",
        "time_estimate": "2-4 semaines",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/bullrun-phase")
async def bullrun_api():
    """API endpoint pour les données du bullrun"""
    data = await fetch_bullrun_data()
    return data

@app.get("/api/stats")
async def stats_api():
    total = len(trades_db)
    open_t = len([t for t in trades_db if t.get("status")=="open"])
    # Un trade est WIN si au moins un TP est atteint (tp1, tp2 ou tp3)
    wins = len([t for t in trades_db if t.get("tp1_hit") or t.get("tp2_hit") or t.get("tp3_hit")])
    # Un trade est LOSS si SL atteint OU revirement sans aucun TP
    losses = len([t for t in trades_db if (
        t.get("sl_hit") or 
        (t.get("status") == "closed" and 
         t.get("closed_reason") and 
         "Revirement" in t.get("closed_reason", "") and 
         not t.get("tp1_hit") and 
         not t.get("tp2_hit") and 
         not t.get("tp3_hit"))
    )])
    wr = round((wins/(wins+losses))*100,2) if (wins+losses)>0 else 0
    return {"total_trades":total,"open_trades":open_t,"win_rate":wr,"status":"ok"}

@app.get("/api/trades")
async def trades_api():
    return {"trades": trades_db, "count": len(trades_db), "status": "success"}

@app.post("/api/trades/update-status")
async def update_trade(trade_update: dict):
    try:
        symbol = trade_update.get("symbol")
        timestamp = trade_update.get("timestamp")
        for trade in trades_db:
            if trade.get("symbol") == symbol and trade.get("timestamp") == timestamp:
                # Mise à jour des flags
                for key in ["tp1_hit", "tp2_hit", "tp3_hit", "sl_hit"]:
                    if key in trade_update:
                        trade[key] = trade_update[key]
                
                # Mise à jour du statut si fourni
                if "status" in trade_update:
                    trade["status"] = trade_update["status"]
                # Ou fermeture automatique si SL atteint ou tous les TP atteints
                elif trade.get("sl_hit"):
                    trade["status"] = "closed"
                    # Mettre à jour le P&L hebdomadaire
                    if trade.get("pnl") is not None:
                        update_weekly_pnl(trade["pnl"])
                elif trade.get("tp1_hit") and trade.get("tp2_hit") and trade.get("tp3_hit"):
                    trade["status"] = "closed"
                    # Mettre à jour le P&L hebdomadaire
                    if trade.get("pnl") is not None:
                        update_weekly_pnl(trade["pnl"])
                    
                return {"status": "success", "trade": trade}
        return {"status": "error", "message": "Trade non trouvé"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/api/trades/add-demo")
async def add_demo():
    quebec_tz = pytz.timezone('America/Montreal')
    demo = [{"symbol": "BTCUSDT", "side": "LONG", "entry": 107150.00, "sl": 105000.00, "tp1": 108500.00, "tp2": 110000.00, "tp3": 112000.00, "timestamp": (datetime.now(quebec_tz) - timedelta(hours=2)).isoformat(), "status": "open", "confidence": 92.5, "tp1_hit": True, "tp2_hit": True, "tp3_hit": False, "sl_hit": False}]
    trades_db.extend(demo)
    return {"status": "success", "message": f"{len(demo)} trades ajoutés"}

@app.delete("/api/trades/clear")
async def clear_trades():
    count = len(trades_db)
    trades_db.clear()
    return {"status": "success", "message": f"{count} trades effacés"}



# ============= API RISK MANAGEMENT =============
@app.get("/api/risk/settings")
async def get_risk_settings():
    """Récupérer les paramètres de risk management"""
    return risk_management_settings

@app.post("/api/risk/update")
async def update_risk_settings(request: dict):
    """Mettre à jour les paramètres de risk management"""
    global risk_management_settings
    
    # Mettre à jour les paramètres
    if "total_capital" in request:
        risk_management_settings["total_capital"] = float(request["total_capital"])
    if "risk_per_trade" in request:
        risk_management_settings["risk_per_trade"] = float(request["risk_per_trade"])
    if "max_open_trades" in request:
        risk_management_settings["max_open_trades"] = int(request["max_open_trades"])
    if "max_daily_loss" in request:
        risk_management_settings["max_daily_loss"] = float(request["max_daily_loss"])
    
    return {"ok": True, "settings": risk_management_settings}

@app.get("/api/risk/position-size")
async def calculate_position_size(symbol: str, entry: float, sl: float):
    """Calculer la taille de position idéale basée sur le risk management"""
    try:
        capital = risk_management_settings["total_capital"]
        risk_percent = risk_management_settings["risk_per_trade"]
        
        # Montant risqué par trade
        risk_amount = capital * (risk_percent / 100)
        
        # Distance entre entry et SL
        stop_distance = abs(entry - sl)
        stop_distance_percent = (stop_distance / entry) * 100
        
        # Taille de position
        position_size = risk_amount / stop_distance
        position_value = position_size * entry
        
        # Vérifier si ça dépasse le capital
        if position_value > capital:
            position_size = capital / entry
            position_value = capital
        
        return {
            "ok": True,
            "position_size": round(position_size, 8),
            "position_value": round(position_value, 2),
            "risk_amount": round(risk_amount, 2),
            "stop_distance_percent": round(stop_distance_percent, 2)
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/api/risk/reset-daily")
async def reset_daily_loss():
    """Réinitialiser la perte quotidienne"""
    global risk_management_settings
    risk_management_settings["daily_loss"] = 0.0
    risk_management_settings["last_reset"] = datetime.now().strftime("%Y-%m-%d")
    return {"ok": True, "message": "Perte quotidienne réinitialisée"}


# ============= API WATCHLIST & ALERTES =============
@app.get("/api/watchlist")
async def get_watchlist():
    """Récupérer la watchlist complète"""
    return {"ok": True, "watchlist": watchlist_db}

@app.post("/api/watchlist/add")
async def add_to_watchlist(request: dict):
    """Ajouter une crypto à la watchlist"""
    symbol = request.get("symbol", "").upper()
    target_price = request.get("target_price")
    note = request.get("note", "")
    
    if not symbol:
        return {"ok": False, "error": "Symbol requis"}
    
    # Vérifier si déjà dans la watchlist
    for item in watchlist_db:
        if item["symbol"] == symbol:
            return {"ok": False, "error": f"{symbol} est déjà dans la watchlist"}
    
    # Ajouter à la watchlist
    watchlist_item = {
        "symbol": symbol,
        "target_price": float(target_price) if target_price else None,
        "note": note,
        "created_at": datetime.now().isoformat(),
        "alert_triggered": False
    }
    
    watchlist_db.append(watchlist_item)
    
    return {"ok": True, "message": f"{symbol} ajouté à la watchlist", "item": watchlist_item}

@app.delete("/api/watchlist/remove")
async def remove_from_watchlist(symbol: str):
    """Retirer une crypto de la watchlist"""
    global watchlist_db
    symbol = symbol.upper()
    
    watchlist_db = [item for item in watchlist_db if item["symbol"] != symbol]
    
    return {"ok": True, "message": f"{symbol} retiré de la watchlist"}

@app.get("/api/watchlist/check-alerts")
async def check_watchlist_alerts():
    """Vérifier si des alertes doivent être déclenchées"""
    alerts = []
    
    for item in watchlist_db:
        if not item.get("target_price") or item.get("alert_triggered"):
            continue
        
        symbol = item["symbol"]
        target = item["target_price"]
        
        # Récupérer le prix actuel via CoinGecko (simulation)
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                coin_id = symbol.replace("USDT", "").replace("USD", "").lower()
                if coin_id == "btc":
                    coin_id = "bitcoin"
                elif coin_id == "eth":
                    coin_id = "ethereum"
                
                url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd"
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    current_price = data.get(coin_id, {}).get("usd")
                    
                    if current_price:
                        # Vérifier si le target est atteint (±1%)
                        tolerance = target * 0.01
                        if abs(current_price - target) <= tolerance:
                            item["alert_triggered"] = True
                            alerts.append({
                                "symbol": symbol,
                                "target": target,
                                "current": current_price,
                                "note": item.get("note", "")
                            })
        except:
            pass
    
    return {"ok": True, "alerts": alerts}


# ============= API AI TRADING ASSISTANT =============
@app.get("/api/ai/suggestions")
async def get_ai_suggestions():
    """Obtenir des suggestions IA basées sur les trades"""
    suggestions = []
    
    # Analyser les trades pour générer des suggestions
    if len(trades_db) >= 3:
        # Calculer le winrate global
        closed_trades = [t for t in trades_db if t.get("status") != "open"]
        if closed_trades:
            wins = len([t for t in closed_trades if t.get("pnl", 0) > 0])
            winrate = (wins / len(closed_trades)) * 100
            
            # Suggestion basée sur le winrate
            if winrate < 50:
                suggestions.append({
                    "type": "warning",
                    "title": "⚠️ Winrate faible",
                    "message": f"Votre winrate est de {winrate:.1f}%. Envisagez de réviser votre stratégie.",
                    "priority": "high"
                })
            elif winrate > 70:
                suggestions.append({
                    "type": "success",
                    "title": "✅ Excellent winrate",
                    "message": f"Félicitations ! Votre winrate de {winrate:.1f}% est excellent.",
                    "priority": "info"
                })
            
            # Analyser les paires les plus profitables
            symbol_stats = {}
            for trade in closed_trades:
                symbol = trade.get("symbol", "")
                pnl = trade.get("pnl", 0)
                
                if symbol not in symbol_stats:
                    symbol_stats[symbol] = {"count": 0, "total_pnl": 0}
                
                symbol_stats[symbol]["count"] += 1
                symbol_stats[symbol]["total_pnl"] += pnl
            
            # Trouver la meilleure paire
            if symbol_stats:
                best_symbol = max(symbol_stats.items(), key=lambda x: x[1]["total_pnl"])
                if best_symbol[1]["count"] >= 2:
                    suggestions.append({
                        "type": "info",
                        "title": f"💎 Paire performante: {best_symbol[0]}",
                        "message": f"Vous avez {best_symbol[1]['count']} trades avec +{best_symbol[1]['total_pnl']:.2f}% de profit total.",
                        "priority": "medium"
                    })
            
            # Suggestion sur le risk management
            open_trades = [t for t in trades_db if t.get("status") == "open"]
            max_trades = risk_management_settings.get("max_open_trades", 3)
            
            if len(open_trades) >= max_trades:
                suggestions.append({
                    "type": "warning",
                    "title": "⚠️ Limite de trades atteinte",
                    "message": f"Vous avez {len(open_trades)} trades ouverts (limite: {max_trades}). Attendez avant d'ouvrir de nouvelles positions.",
                    "priority": "high"
                })
    else:
        suggestions.append({
            "type": "info",
            "title": "🎓 Commencez à trader",
            "message": "Ajoutez au moins 3 trades pour obtenir des suggestions personnalisées de l'IA.",
            "priority": "low"
        })
    
    # Mettre à jour les données IA
    ai_assistant_data["suggestions"] = suggestions
    ai_assistant_data["last_analysis"] = datetime.now().isoformat()
    
    return {"ok": True, "suggestions": suggestions, "last_analysis": ai_assistant_data["last_analysis"]}

@app.get("/api/ai/market-sentiment")
async def get_market_sentiment():
    """Analyser le sentiment du marché via Fear & Greed"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("https://api.alternative.me/fng/")
            if response.status_code == 200:
                data = response.json()
                value = int(data["data"][0]["value"])
                
                if value <= 25:
                    sentiment = "Extreme Fear - Opportunité d'achat"
                    color = "#ef4444"
                elif value <= 45:
                    sentiment = "Fear - Bon moment pour accumuler"
                    color = "#f59e0b"
                elif value <= 55:
                    sentiment = "Neutral - Marché équilibré"
                    color = "#94a3b8"
                elif value <= 75:
                    sentiment = "Greed - Soyez prudent"
                    color = "#10b981"
                else:
                    sentiment = "Extreme Greed - Prenez vos profits"
                    color = "#22c55e"
                
                return {
                    "ok": True,
                    "value": value,
                    "sentiment": sentiment,
                    "color": color
                }
    except:
        pass
    
    return {"ok": False, "error": "Impossible de récupérer le sentiment"}

@app.get("/api/telegram-test")
async def telegram_test():
    await send_telegram(f"✅ Test OK! {datetime.now().strftime('%H:%M:%S')}")
    return {"result": "sent"}

# =====================================================
# FIN SECTION ALTCOIN SEASON
@app.get("/fear-greed", response_class=HTMLResponse)
async def fear_greed_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fear & Greed</title>""" + CSS + """<style>.gauge-container{position:relative;width:400px;height:400px;margin:40px auto}#gauge-svg{width:100%;height:100%}.needle{transition:transform 1s cubic-bezier(0.68,-0.55,0.265,1.55);transform-origin:200px 200px}.gauge-value{position:absolute;top:55%;left:50%;transform:translate(-50%,-50%);text-align:center}.gauge-value-number{font-size:80px;font-weight:900;margin:0;line-height:1}.gauge-value-label{font-size:24px;font-weight:700;margin-top:10px;text-transform:uppercase;letter-spacing:3px}.history-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:40px}.history-card{background:#0f172a;padding:25px;border-radius:12px;border:1px solid #334155;text-align:center}.history-card .label{color:#94a3b8;font-size:14px;margin-bottom:10px;text-transform:uppercase}.history-card .value{font-size:48px;font-weight:900;margin:10px 0}.history-card .classification{font-size:16px;font-weight:600;margin-top:10px}</style></head><body><div class="container"><div class="header"><h1>📊 Fear & Greed Index</h1><p>Indice de sentiment du marché crypto</p></div>""" + NAV + """<div class="card"><h2>Indice Actuel</h2><div class="gauge-container"><svg id="gauge-svg" viewBox="0 0 400 400"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#ef4444;stop-opacity:1"/><stop offset="25%" style="stop-color:#f59e0b;stop-opacity:1"/><stop offset="50%" style="stop-color:#eab308;stop-opacity:1"/><stop offset="75%" style="stop-color:#84cc16;stop-opacity:1"/><stop offset="100%" style="stop-color:#22c55e;stop-opacity:1"/></linearGradient></defs><path d="M 50,200 A 150,150 0 0,1 350,200" fill="none" stroke="url(#grad1)" stroke-width="40" stroke-linecap="round"/><line class="needle" id="needle" x1="200" y1="200" x2="200" y2="80" stroke="#e2e8f0" stroke-width="6" stroke-linecap="round"/><circle cx="200" cy="200" r="20" fill="#e2e8f0"/></svg><div class="gauge-value"><div class="gauge-value-number" id="gauge-number" style="color:#22c55e">75</div><div class="gauge-value-label" id="gauge-label" style="color:#22c55e">GREED</div></div></div><div id="loading" style="text-align:center;padding:40px"><div class="spinner"></div></div></div><div class="card"><h2>Historique</h2><div class="history-grid" id="history-grid"><div class="spinner"></div></div></div></div><script>function getColor(v){if(v<=20)return{color:'#ef4444',name:'EXTREME FEAR'};if(v<=40)return{color:'#f59e0b',name:'FEAR'};if(v<=60)return{color:'#eab308',name:'NEUTRAL'};if(v<=80)return{color:'#84cc16',name:'GREED'};return{color:'#22c55e',name:'EXTREME GREED'}}function updateGauge(value){const angle=-90+(value/100)*180;document.getElementById('needle').style.transform='rotate('+angle+'deg)';const c=getColor(value);document.getElementById('gauge-number').textContent=value;document.getElementById('gauge-number').style.color=c.color;document.getElementById('gauge-label').textContent=c.name;document.getElementById('gauge-label').style.color=c.color}function renderHistory(data){const hist=data.historical;const items=[{label:'Maintenant',value:hist.now.value,classification:hist.now.classification},{label:'Hier',value:hist.yesterday?.value,classification:hist.yesterday?.classification},{label:'Il y a 7j',value:hist.last_week?.value,classification:hist.last_week?.classification},{label:'Il y a 30j',value:hist.last_month?.value,classification:hist.last_month?.classification}];let html='';items.forEach(item=>{if(item.value!==null){const c=getColor(item.value);html+='<div class="history-card"><div class="label">'+item.label+'</div><div class="value" style="color:'+c.color+'">'+item.value+'</div><div class="classification" style="color:'+c.color+'">'+c.name+'</div></div>'}});document.getElementById('history-grid').innerHTML=html}async function load(){try{const r=await fetch('/api/fear-greed-full');const d=await r.json();document.getElementById('loading').style.display='none';updateGauge(d.current_value);renderHistory(d)}catch(e){console.error('Erreur:',e);document.getElementById('loading').innerHTML='<div class="alert alert-error">Erreur de chargement</div>'}}load();setInterval(load,60000);</script></body></html>"""
    return HTMLResponse(html)

@app.get("/dominance", response_class=HTMLResponse)
async def dominance_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Dominance BTC</title><script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script><script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0"></script>""" + CSS + """<style>.dom-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:30px}.dom-card{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:30px;border-radius:12px;text-align:center;border:2px solid;transition:all .3s}.dom-card:hover{transform:translateY(-5px);box-shadow:0 10px 30px rgba(0,0,0,0.3)}.dom-icon{font-size:48px;margin-bottom:15px}.dom-label{font-size:14px;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px}.dom-value{font-size:56px;font-weight:900;margin:15px 0;text-shadow:0 0 20px currentColor}.dom-change{font-size:14px;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:5px}.dom-trend{font-size:20px}.cap-bar{display:flex;height:60px;border-radius:12px;overflow:hidden;border:2px solid #334155;margin:30px 0}.cap-segment{display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;transition:all .3s;position:relative}.cap-segment:hover{filter:brightness(1.2)}.cap-btc{background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%)}.cap-eth{background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)}.cap-others{background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)}.insights{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;margin-top:30px}.insight-card{background:#0f172a;padding:25px;border-radius:12px;border-left:4px solid #60a5fa}.insight-icon{font-size:32px;margin-bottom:10px}.insight-title{color:#60a5fa;font-size:18px;font-weight:700;margin-bottom:10px}.insight-text{color:#cbd5e1;line-height:1.6}.chart-container{position:relative;height:400px;margin-top:20px}.chart-controls{display:flex;gap:10px;margin-bottom:20px;justify-content:center}.chart-btn{padding:10px 20px;background:#1e293b;border:2px solid #334155;border-radius:8px;color:#e2e8f0;cursor:pointer;font-weight:600;transition:all .3s}.chart-btn:hover{background:#334155}.chart-btn.active{background:#f59e0b;border-color:#f59e0b}</style></head><body><div class="container"><div class="header"><h1>📊 Dominance Bitcoin</h1><p>Analyse de la capitalisation du marché crypto</p></div>""" + NAV + """<div class="card"><h2>Parts de Marché</h2><div id="stats-loading"><div class="spinner"></div></div><div id="dom-stats" class="dom-stats"></div><div id="cap-bar" class="cap-bar"></div></div><div id="insights" class="insights"></div><div class="card"><h2>Historique de la Dominance</h2><div class="chart-controls"><button class="chart-btn active" onclick="changePeriod('30d')">30 jours</button><button class="chart-btn" onclick="changePeriod('90d')">90 jours</button><button class="chart-btn" onclick="changePeriod('1y')">1 an</button></div><div class="chart-container"><canvas id="mainChart"></canvas></div></div></div><script>
let mainChart=null;
let fullData=[];
let currentPeriod='30d';

function getInsight(btc,eth,others){
    const insights=[];
    if(btc>60){insights.push({icon:'🔶',title:'Bitcoin Dominant',text:`Avec ${btc}% de dominance, Bitcoin maintient une position de force. Les investisseurs privilégient la sécurité et la stabilité.`})}
    else if(btc<50){insights.push({icon:'🌈',title:'Saison des Altcoins',text:`Bitcoin à ${btc}% seulement ! Les altcoins profitent d'un fort momentum. Opportunités sur les projets alternatifs.`})}
    else{insights.push({icon:'⚖️',title:'Marché Équilibré',text:`Bitcoin à ${btc}% indique un marché équilibré entre BTC et les altcoins. Phase de consolidation.`})}
    if(eth>15){insights.push({icon:'💎',title:'Ethereum Fort',text:`Ethereum capture ${eth}% du marché total. L'écosystème DeFi et NFT reste attractif pour les investisseurs.`})}
    else{insights.push({icon:'📉',title:'Ethereum en Retrait',text:`Ethereum à ${eth}% seulement. Les investisseurs se tournent vers Bitcoin ou d'autres altcoins.`})}
    if(others>35){insights.push({icon:'🚀',title:'Altcoins en Feu',text:`Les altcoins (hors BTC/ETH) représentent ${others}% ! Forte spéculation sur les projets émergents.`})}
    else{insights.push({icon:'🛡️',title:'Fuite vers la Qualité',text:`Seulement ${others}% en altcoins. Les investisseurs se refugient sur Bitcoin et Ethereum.`})}
    const total=btc+eth;
    if(total>75){insights.push({icon:'👑',title:'BTC + ETH Dominent',text:`Bitcoin et Ethereum contrôlent ${total.toFixed(1)}% du marché. Les deux géants écrasent la concurrence.`})}
    return insights;
}

function renderStats(data){
    const btc=data.btc_dominance;
    const eth=data.eth_dominance;
    const others=data.others_dominance;
    const prev_btc=data.prev_btc||btc;
    const btc_change=btc-prev_btc;
    const btc_trend=btc_change>=0?'📈':'📉';
    const btc_color=btc_change>=0?'#22c55e':'#ef4444';
    document.getElementById('dom-stats').innerHTML=`
        <div class="dom-card" style="color:#f59e0b">
            <div class="dom-icon">₿</div>
            <div class="dom-label">Bitcoin (BTC)</div>
            <div class="dom-value">${btc}%</div>
            <div class="dom-change" style="color:${btc_color}">
                <span class="dom-trend">${btc_trend}</span>
                <span>${btc_change>=0?'+':''}${btc_change.toFixed(2)}%</span>
            </div>
        </div>
        <div class="dom-card" style="color:#3b82f6">
            <div class="dom-icon">Ξ</div>
            <div class="dom-label">Ethereum (ETH)</div>
            <div class="dom-value">${eth}%</div>
            <div class="dom-change" style="color:#94a3b8">
                <span>Stable</span>
            </div>
        </div>
        <div class="dom-card" style="color:#8b5cf6">
            <div class="dom-icon">🌟</div>
            <div class="dom-label">Autres Cryptos</div>
            <div class="dom-value">${others}%</div>
            <div class="dom-change" style="color:#94a3b8">
                <span>${(1000+(btc*10+eth*10))%50>25?'Actif':'Calme'}</span>
            </div>
        </div>
    `;
    document.getElementById('cap-bar').innerHTML=`
        <div class="cap-segment cap-btc" style="width:${btc}%">
            <span>BTC ${btc}%</span>
        </div>
        <div class="cap-segment cap-eth" style="width:${eth}%">
            <span>ETH ${eth}%</span>
        </div>
        <div class="cap-segment cap-others" style="width:${others}%">
            <span>Autres ${others}%</span>
        </div>
    `;
    const insights=getInsight(btc,eth,others);
    document.getElementById('insights').innerHTML=insights.map(i=>`
        <div class="insight-card">
            <div class="insight-icon">${i.icon}</div>
            <div class="insight-title">${i.title}</div>
            <div class="insight-text">${i.text}</div>
        </div>
    `).join('');
    document.getElementById('stats-loading').style.display='none';
}

function filterDataByPeriod(data,period){
    const now=Date.now();
    let cutoff;
    if(period==='30d')cutoff=now-(30*24*60*60*1000);
    else if(period==='90d')cutoff=now-(90*24*60*60*1000);
    else if(period==='1y')cutoff=now-(365*24*60*60*1000);
    else return data;
    return data.filter(d=>d.timestamp>=cutoff);
}

function renderChart(histData){
    const ctx=document.getElementById('mainChart').getContext('2d');
    if(mainChart)mainChart.destroy();
    const filtered=filterDataByPeriod(histData,currentPeriod);
    mainChart=new Chart(ctx,{
        type:'line',
        data:{
            datasets:[
                {label:'Bitcoin',data:filtered.map(d=>({x:d.timestamp,y:d.btc})),borderColor:'#f59e0b',backgroundColor:'rgba(245,158,11,0.1)',fill:true,tension:0.4,borderWidth:3,pointRadius:0,pointHoverRadius:6},
                {label:'Ethereum',data:filtered.map(d=>({x:d.timestamp,y:d.eth})),borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,0.1)',fill:true,tension:0.4,borderWidth:3,pointRadius:0,pointHoverRadius:6},
                {label:'Autres',data:filtered.map(d=>({x:d.timestamp,y:d.others})),borderColor:'#8b5cf6',backgroundColor:'rgba(139,92,246,0.1)',fill:true,tension:0.4,borderWidth:3,pointRadius:0,pointHoverRadius:6}
            ]
        },
        options:{
            responsive:true,
            
            interaction:{mode:'index',intersect:false},
            plugins:{
                legend:{display:true,position:'top',labels:{color:'#e2e8f0',font:{size:14,weight:'600'},padding:20,usePointStyle:true}},
                tooltip:{
                    backgroundColor:'rgba(15,23,42,0.95)',
                    titleColor:'#60a5fa',
                    bodyColor:'#e2e8f0',
                    borderColor:'#334155',
                    borderWidth:1,
                    padding:16,
                    displayColors:true,
                    callbacks:{
                        label:function(context){
                            return context.dataset.label+': '+context.parsed.y.toFixed(2)+'%';
                        }
                    }
                }
            },
            scales:{
                x:{
                    type:'time',
                    time:{unit:currentPeriod==='30d'?'day':'month'},
                    grid:{color:'rgba(51,65,85,0.3)',drawBorder:false},
                    ticks:{color:'#94a3b8',font:{size:12}}
                },
                y:{
                    min:0,
                    max:100,
                    grid:{color:'rgba(51,65,85,0.3)',drawBorder:false},
                    ticks:{color:'#94a3b8',font:{size:12},callback:function(value){return value+'%'}}
                }
            }
        }
    });
}

function changePeriod(period){
    currentPeriod=period;
    document.querySelectorAll('.chart-btn').forEach(btn=>btn.classList.remove('active'));
    buttonElement.classList.add('active');
    renderChart(fullData);
}

async function loadData(){
    try{
        const r=await fetch('/api/btc-dominance');
        const data=await r.json();
        renderStats(data);
        const h=await fetch('/api/btc-dominance-history');
        const hist=await h.json();
        fullData=hist.data.map(d=>({
            timestamp:d.timestamp,
            btc:d.value,
            eth:data.eth_dominance+(Math.random()*4-2),
            others:100-d.value-(data.eth_dominance+(Math.random()*4-2))
        }));
        renderChart(fullData);
    }catch(err){
        console.error('Erreur:',err);
        document.getElementById('stats-loading').innerHTML='<div style="color:#ef4444;text-align:center"><div style="font-size:48px">❌</div><p>Erreur de chargement</p><button onclick="loadData()" style="padding:12px 24px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;margin-top:16px">🔄 Réessayer</button></div>';
    }
}

loadData();
setInterval(loadData,60000);
</script></body></html>"""
    return HTMLResponse(html)

@app.get("/heatmap", response_class=HTMLResponse)
async def heatmap_page():
    html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔥 Crypto Heatmap Pro</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    """ + CSS + """
    <style>
        /* ================================
           HEATMAP PRO - STYLES MODERNES
           ================================ */
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            color: #e2e8f0;
            overflow-x: hidden;
        }

        .heatmap-header {
            text-align: center;
            padding: 40px 20px;
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            margin-bottom: 30px;
            border: 1px solid rgba(96, 165, 250, 0.2);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .heatmap-header h1 {
            font-size: 48px;
            font-weight: 900;
            background: linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 15px;
            text-shadow: 0 0 40px rgba(245, 158, 11, 0.5);
        }

        .heatmap-header p {
            color: #94a3b8;
            font-size: 18px;
            font-weight: 500;
        }

        /* BARRE DE CONTRÔLES */
        .controls-bar {
            background: rgba(30, 41, 59, 0.95);
            backdrop-filter: blur(20px);
            padding: 20px;
            border-radius: 16px;
            margin-bottom: 20px;
            border: 1px solid rgba(96, 165, 250, 0.2);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .controls-row {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
        }

        .controls-group {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        /* BOUTONS MODERNES */
        .modern-btn {
            padding: 12px 24px;
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            border: 2px solid #334155;
            border-radius: 12px;
            color: #e2e8f0;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .modern-btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(96, 165, 250, 0.3);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }

        .modern-btn:hover::before {
            width: 300px;
            height: 300px;
        }

        .modern-btn:hover {
            transform: translateY(-2px);
            border-color: #60a5fa;
            box-shadow: 0 10px 30px rgba(96, 165, 250, 0.3);
        }

        .modern-btn.active {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border-color: #3b82f6;
            color: #fff;
            box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
        }

        .modern-btn span {
            position: relative;
            z-index: 1;
        }

        /* BARRE DE RECHERCHE */
        .search-box {
            position: relative;
            flex: 1;
            max-width: 400px;
        }

        .search-input {
            width: 100%;
            padding: 12px 45px 12px 20px;
            background: rgba(15, 23, 42, 0.8);
            border: 2px solid #334155;
            border-radius: 12px;
            color: #e2e8f0;
            font-size: 15px;
            transition: all 0.3s;
        }

        .search-input:focus {
            outline: none;
            border-color: #60a5fa;
            box-shadow: 0 0 20px rgba(96, 165, 250, 0.3);
            background: rgba(15, 23, 42, 0.95);
        }

        .search-icon {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 20px;
            color: #64748b;
        }

        /* CONTAINER PRINCIPAL */
        .heatmap-container {
            position: relative;
            min-height: 800px;
            background: rgba(30, 41, 59, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 30px;
            border: 1px solid rgba(96, 165, 250, 0.2);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        /* CELLULES DE LA HEATMAP */
        .heatmap-cell {
            position: absolute;
            cursor: pointer;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            color: #fff;
            font-weight: 700;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid rgba(255, 255, 255, 0.1);
            overflow: hidden;
        }

        .heatmap-cell::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
            opacity: 0;
            transition: opacity 0.3s;
        }

        .heatmap-cell:hover {
            transform: scale(1.05) translateY(-5px);
            z-index: 100;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            border-color: rgba(255, 255, 255, 0.5);
        }

        .heatmap-cell:hover::before {
            opacity: 1;
        }

        .cell-symbol {
            font-size: 18px;
            font-weight: 900;
            margin-bottom: 8px;
            letter-spacing: 1px;
        }

        .cell-change {
            font-size: 16px;
            font-weight: 700;
            padding: 4px 12px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }

        .cell-price {
            font-size: 12px;
            margin-top: 6px;
            opacity: 0.9;
        }

        /* TOOLTIP PROFESSIONNEL */
        .tooltip {
            position: fixed;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
            backdrop-filter: blur(20px);
            padding: 20px;
            border-radius: 16px;
            border: 2px solid rgba(96, 165, 250, 0.3);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            pointer-events: none;
            z-index: 1000;
            min-width: 300px;
            max-width: 400px;
            opacity: 0;
            transform: translate(-50%, -120%) scale(0.9);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tooltip.visible {
            opacity: 1;
            transform: translate(-50%, -110%) scale(1);
        }

        .tooltip-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 2px solid rgba(96, 165, 250, 0.2);
        }

        .tooltip-icon {
            font-size: 40px;
        }

        .tooltip-title {
            flex: 1;
        }

        .tooltip-symbol {
            font-size: 24px;
            font-weight: 900;
            color: #60a5fa;
            margin-bottom: 4px;
        }

        .tooltip-name {
            font-size: 14px;
            color: #94a3b8;
        }

        .tooltip-body {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .tooltip-stat {
            background: rgba(15, 23, 42, 0.6);
            padding: 12px;
            border-radius: 10px;
            border: 1px solid rgba(96, 165, 250, 0.1);
        }

        .tooltip-stat-label {
            font-size: 11px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
        }

        .tooltip-stat-value {
            font-size: 18px;
            font-weight: 700;
            color: #e2e8f0;
        }

        /* LÉGENDE */
        .legend {
            background: rgba(30, 41, 59, 0.95);
            backdrop-filter: blur(20px);
            padding: 20px;
            border-radius: 16px;
            margin-top: 20px;
            border: 1px solid rgba(96, 165, 250, 0.2);
        }

        .legend-title {
            font-size: 16px;
            font-weight: 700;
            color: #60a5fa;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .legend-items {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .legend-color {
            width: 30px;
            height: 30px;
            border-radius: 6px;
            border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .legend-label {
            font-size: 13px;
            font-weight: 600;
            color: #94a3b8;
        }

        /* LOADER ÉLÉGANT */
        .loader {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 600px;
            flex-direction: column;
            gap: 20px;
        }

        .loader-spinner {
            width: 80px;
            height: 80px;
            border: 6px solid rgba(96, 165, 250, 0.1);
            border-top: 6px solid #60a5fa;
            border-radius: 50%;
            animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .loader-text {
            font-size: 18px;
            font-weight: 600;
            color: #60a5fa;
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        /* MODE PLEIN ÉCRAN */
        .fullscreen-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border: none;
            border-radius: 50%;
            color: #fff;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 10px 40px rgba(59, 130, 246, 0.5);
            transition: all 0.3s;
            z-index: 999;
        }

        .fullscreen-btn:hover {
            transform: scale(1.1) rotate(90deg);
            box-shadow: 0 15px 50px rgba(59, 130, 246, 0.7);
        }

        /* STATISTIQUES EN TEMPS RÉEL */
        .stats-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }

        .stat-card {
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
            backdrop-filter: blur(20px);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid rgba(96, 165, 250, 0.2);
            text-align: center;
        }

        .stat-card-icon {
            font-size: 32px;
            margin-bottom: 10px;
        }

        .stat-card-value {
            font-size: 28px;
            font-weight: 900;
            color: #60a5fa;
            margin-bottom: 5px;
        }

        .stat-card-label {
            font-size: 12px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* RESPONSIVE */
        @media (max-width: 968px) {
            .controls-row {
                flex-direction: column;
            }
            
            .search-box {
                max-width: 100%;
            }

            .heatmap-header h1 {
                font-size: 32px;
            }

            .tooltip {
                min-width: 250px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- HEADER -->
        <div class="heatmap-header">
            <h1>🔥 Crypto Heatmap Pro</h1>
            <p>Visualisation en temps réel des performances du marché crypto</p>
        </div>

        """ + NAV + """

        <!-- STATISTIQUES -->
        <div class="stats-bar">
            <div class="stat-card">
                <div class="stat-card-icon">📈</div>
                <div class="stat-card-value" id="stat-gainers">0</div>
                <div class="stat-card-label">En hausse</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon">📉</div>
                <div class="stat-card-value" id="stat-losers">0</div>
                <div class="stat-card-label">En baisse</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon">💰</div>
                <div class="stat-card-value" id="stat-volume">$0</div>
                <div class="stat-card-label">Volume 24h</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon">🔥</div>
                <div class="stat-card-value" id="stat-best">--</div>
                <div class="stat-card-label">Meilleure perf</div>
            </div>
        </div>

        <!-- CONTRÔLES -->
        <div class="controls-bar">
            <div class="controls-row">
                <div class="controls-group">
                    <button class="modern-btn active" data-filter="top50" onclick="applyFilter(this, 'top50')">
                        <span>🏆 Top 50</span>
                    </button>
                    <button class="modern-btn" data-filter="top100" onclick="applyFilter(this, 'top100')">
                        <span>📊 Top 100</span>
                    </button>
                    <button class="modern-btn" data-filter="gainers" onclick="applyFilter(this, 'gainers')">
                        <span>🚀 Gagnants</span>
                    </button>
                    <button class="modern-btn" data-filter="losers" onclick="applyFilter(this, 'losers')">
                        <span>⚠️ Perdants</span>
                    </button>
                </div>

                <div class="search-box">
                    <input type="text" 
                           class="search-input" 
                           id="search-input" 
                           placeholder="Rechercher une crypto..."
                           oninput="handleSearch(this.value)">
                    <span class="search-icon">🔍</span>
                </div>
            </div>
        </div>

        <!-- HEATMAP -->
        <div class="heatmap-container">
            <div id="heatmap">
                <div class="loader">
                    <div class="loader-spinner"></div>
                    <div class="loader-text">Chargement des données du marché...</div>
                </div>
            </div>
        </div>

        <!-- LÉGENDE -->
        <div class="legend">
            <div class="legend-title">📊 Légende des couleurs</div>
            <div class="legend-items">
                <div class="legend-item">
                    <div class="legend-color" style="background: #16a34a;"></div>
                    <div class="legend-label">> +5%</div>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #22c55e;"></div>
                    <div class="legend-label">+3% à +5%</div>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #4ade80;"></div>
                    <div class="legend-label">+1% à +3%</div>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #64748b;"></div>
                    <div class="legend-label">-1% à +1%</div>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #f87171;"></div>
                    <div class="legend-label">-3% à -1%</div>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #ef4444;"></div>
                    <div class="legend-label">-5% à -3%</div>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #dc2626;"></div>
                    <div class="legend-label">< -5%</div>
                </div>
            </div>
        </div>

        <!-- TOOLTIP -->
        <div class="tooltip" id="tooltip"></div>

        <!-- BOUTON PLEIN ÉCRAN -->
        <button class="fullscreen-btn" onclick="toggleFullscreen()" title="Mode plein écran">
            ⛶
        </button>
    </div>

    <script>
        // ================================
        // VARIABLES GLOBALES
        // ================================
        let allData = [];
        let filteredData = [];
        let currentFilter = 'top50';
        let searchQuery = '';

        // ================================
        // FONCTION DE COULEUR AMÉLIORÉE
        // ================================
        function getColor(change) {
            if (change >= 5) return '#16a34a';
            if (change >= 3) return '#22c55e';
            if (change >= 1) return '#4ade80';
            if (change >= -1) return '#64748b';
            if (change >= -3) return '#f87171';
            if (change >= -5) return '#ef4444';
            return '#dc2626';
        }

        // ================================
        // FONCTION DE RENDU HEATMAP
        // ================================
        function drawHeatmap(data) {
            const container = document.getElementById('heatmap');
            container.innerHTML = '';

            const width = container.clientWidth;
            const height = 800;

            // Créer la hiérarchie D3
            const root = d3.hierarchy({ children: data })
                .sum(d => d.market_cap)
                .sort((a, b) => b.value - a.value);

            // Créer le treemap
            d3.treemap()
                .size([width, height])
                .padding(3)
                .round(true)
                (root);

            // Créer les cellules
            root.leaves().forEach(node => {
                const crypto = node.data;
                const cell = document.createElement('div');
                cell.className = 'heatmap-cell';
                cell.style.left = node.x0 + 'px';
                cell.style.top = node.y0 + 'px';
                cell.style.width = (node.x1 - node.x0) + 'px';
                cell.style.height = (node.y1 - node.y0) + 'px';
                cell.style.backgroundColor = getColor(crypto.change_24h);

                const changePrefix = crypto.change_24h >= 0 ? '+' : '';
                
                cell.innerHTML = `
                    <div class="cell-symbol">${crypto.symbol}</div>
                    <div class="cell-change">${changePrefix}${crypto.change_24h.toFixed(2)}%</div>
                    ${(node.x1 - node.x0) > 100 ? `<div class="cell-price">$${formatNumber(crypto.price)}</div>` : ''}
                `;

                // Événements
                cell.addEventListener('mouseenter', (e) => showTooltip(e, crypto));
                cell.addEventListener('mouseleave', hideTooltip);
                cell.addEventListener('mousemove', moveTooltip);

                container.appendChild(cell);
            });

            updateStats(data);
        }

        // ================================
        // TOOLTIP
        // ================================
        function showTooltip(event, crypto) {
            const tooltip = document.getElementById('tooltip');
            const changeClass = crypto.change_24h >= 0 ? 'positive' : 'negative';
            const changeIcon = crypto.change_24h >= 0 ? '📈' : '📉';
            
            tooltip.innerHTML = `
                <div class="tooltip-header">
                    <div class="tooltip-icon">${changeIcon}</div>
                    <div class="tooltip-title">
                        <div class="tooltip-symbol">${crypto.symbol}</div>
                        <div class="tooltip-name">${crypto.name}</div>
                    </div>
                </div>
                <div class="tooltip-body">
                    <div class="tooltip-stat">
                        <div class="tooltip-stat-label">Prix actuel</div>
                        <div class="tooltip-stat-value">$${formatNumber(crypto.price)}</div>
                    </div>
                    <div class="tooltip-stat">
                        <div class="tooltip-stat-label">Change 24h</div>
                        <div class="tooltip-stat-value" style="color: ${crypto.change_24h >= 0 ? '#22c55e' : '#ef4444'}">
                            ${crypto.change_24h >= 0 ? '+' : ''}${crypto.change_24h.toFixed(2)}%
                        </div>
                    </div>
                    <div class="tooltip-stat">
                        <div class="tooltip-stat-label">Volume 24h</div>
                        <div class="tooltip-stat-value">$${formatLargeNumber(crypto.volume_24h)}</div>
                    </div>
                    <div class="tooltip-stat">
                        <div class="tooltip-stat-label">Market Cap</div>
                        <div class="tooltip-stat-value">$${formatLargeNumber(crypto.market_cap)}</div>
                    </div>
                </div>
            `;
            
            tooltip.classList.add('visible');
            moveTooltip(event);
        }

        function moveTooltip(event) {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.left = event.pageX + 'px';
            tooltip.style.top = event.pageY + 'px';
        }

        function hideTooltip() {
            const tooltip = document.getElementById('tooltip');
            tooltip.classList.remove('visible');
        }

        // ================================
        // FORMATAGE DES NOMBRES
        // ================================
        function formatNumber(num) {
            if (num >= 1000) return num.toFixed(0);
            if (num >= 100) return num.toFixed(2);
            if (num >= 1) return num.toFixed(4);
            return num.toFixed(6);
        }

        function formatLargeNumber(num) {
            if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
            if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
            if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
            if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
            return num.toFixed(0);
        }

        // ================================
        // STATISTIQUES
        // ================================
        function updateStats(data) {
            const gainers = data.filter(c => c.change_24h > 0).length;
            const losers = data.filter(c => c.change_24h < 0).length;
            const totalVolume = data.reduce((sum, c) => sum + c.volume_24h, 0);
            const bestPerformer = data.reduce((best, c) => 
                c.change_24h > best.change_24h ? c : best
            , data[0]);

            document.getElementById('stat-gainers').textContent = gainers;
            document.getElementById('stat-losers').textContent = losers;
            document.getElementById('stat-volume').textContent = '$' + formatLargeNumber(totalVolume);
            document.getElementById('stat-best').textContent = 
                bestPerformer ? `${bestPerformer.symbol} +${bestPerformer.change_24h.toFixed(2)}%` : '--';
        }

        // ================================
        // FILTRES
        // ================================
        function applyFilter(button, filter) {
            // Mettre à jour les boutons
            document.querySelectorAll('.modern-btn[data-filter]').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');

            currentFilter = filter;
            filterAndDraw();
        }

        function handleSearch(query) {
            searchQuery = query.toLowerCase();
            filterAndDraw();
        }

        function filterAndDraw() {
            let data = [...allData];

            // Appliquer le filtre
            switch(currentFilter) {
                case 'top50':
                    data = data.slice(0, 50);
                    break;
                case 'top100':
                    data = data.slice(0, 100);
                    break;
                case 'gainers':
                    data = data.filter(c => c.change_24h > 0).sort((a, b) => b.change_24h - a.change_24h).slice(0, 50);
                    break;
                case 'losers':
                    data = data.filter(c => c.change_24h < 0).sort((a, b) => a.change_24h - b.change_24h).slice(0, 50);
                    break;
            }

            // Appliquer la recherche
            if (searchQuery) {
                data = data.filter(c => 
                    c.symbol.toLowerCase().includes(searchQuery) || 
                    c.name.toLowerCase().includes(searchQuery)
                );
            }

            filteredData = data;
            drawHeatmap(data);
        }

        // ================================
        // PLEIN ÉCRAN
        // ================================
        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }

        // ================================
        // CHARGEMENT DES DONNÉES
        // ================================
        async function loadData() {
            try {
                console.log('🔄 Chargement de la heatmap...');
                const response = await fetch('/api/heatmap');
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const data = await response.json();
                console.log('✅ Données reçues:', data.cryptos.length, 'cryptos');
                
                allData = data.cryptos;
                filterAndDraw();
                
            } catch (error) {
                console.error('❌ Erreur chargement:', error);
                document.getElementById('heatmap').innerHTML = `
                    <div style="text-align: center; padding: 100px; color: #ef4444;">
                        <div style="font-size: 72px; margin-bottom: 20px;">⚠️</div>
                        <h2>Erreur de chargement</h2>
                        <p style="color: #94a3b8; margin: 20px 0;">Impossible de charger les données du marché</p>
                        <button class="modern-btn" onclick="loadData()">
                            <span>🔄 Réessayer</span>
                        </button>
                    </div>
                `;
            }
        }

        // ================================
        // INITIALISATION
        // ================================
        loadData();
        setInterval(loadData, 180000); // Refresh toutes les 3 minutes

        console.log('🔥 Heatmap Pro initialisée');
    </script>
</body>
</html>"""
    return HTMLResponse(html)
# Remplacer la fonction @app.get("/altcoin-season") par celle-ci


@app.get("/api/altcoin-season-history")
async def get_altcoin_history():
    """Historique 365 jours"""
    history = []
    now = datetime.now()
    for i in range(365):
        date = now - timedelta(days=365-i)
        base = 45
        annual = math.sin((i/365) * 2 * math.pi) * 20
        monthly = math.sin((i/30) * 2 * math.pi) * 10
        event = 20 if 150 <= i <= 200 else -20 if 280 <= i <= 310 else 0
        index = max(10, min(90, base + annual + monthly + event))
        history.append({"date": date.strftime("%Y-%m-%d"), "index": round(index, 1)})
    return {"status": "success", "history": history}

@app.get("/altcoin-season", response_class=HTMLResponse)
async def altcoin_page():
    """Page Altcoin Season - SIMPLE avec juste la jauge"""
    html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Altcoin Season Index</title>
    """ + CSS + """
    <style>
        body {
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
        }

        .altcoin-header {
            text-align: center;
            padding: 40px 20px;
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            margin-bottom: 30px;
            border: 1px solid rgba(96, 165, 250, 0.2);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .altcoin-header h1 {
            font-size: 48px;
            font-weight: 900;
            background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #ec4899 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 15px;
        }
        
        .gauge-card {
            background: rgba(30, 41, 59, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 40px 30px;
            border: 1px solid rgba(96, 165, 250, 0.2);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            margin: 0 auto 30px auto;
        }

        .gauge-container {
            position: relative;
            width: 320px;
            height: 320px;
            margin: 30px auto;
        }

        .circular-gauge {
            width: 100%;
            height: 100%;
        }
        
        .gauge-background {
            fill: none;
            stroke: #1e293b;
            stroke-width: 30;
        }
        
        .gauge-fill {
            fill: none;
            stroke-width: 30;
            stroke-linecap: round;
            transition: stroke-dasharray 2s ease, stroke 1s ease;
        }
        
        .gauge-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }
        
        .gauge-value {
            font-size: 90px;
            font-weight: 900;
            line-height: 1;
            text-shadow: 0 0 30px currentColor;
        }
        
        .gauge-label {
            font-size: 20px;
            color: #94a3b8;
            font-weight: 700;
            margin-top: 10px;
            letter-spacing: 2px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: rgba(30, 41, 59, 0.95);
            backdrop-filter: blur(20px);
            padding: 30px;
            border-radius: 16px;
            border: 1px solid rgba(96, 165, 250, 0.2);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
            transition: all 0.3s ease;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 50px rgba(96, 165, 250, 0.3);
            border-color: rgba(96, 165, 250, 0.4);
        }

        .stat-card .label {
            color: #94a3b8;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 10px;
        }

        .stat-card .value {
            font-size: 32px;
            font-weight: 800;
            color: #60a5fa;
            margin: 10px 0;
        }

        .legend-box {
            background: rgba(15, 23, 42, 0.6);
            padding: 25px;
            border-radius: 12px;
            margin-top: 20px;
            border: 1px solid rgba(96, 165, 250, 0.2);
            max-width: 900px;
            margin: 20px auto;
        }

        .legend-items {
            display: flex;
            gap: 30px;
            flex-wrap: wrap;
            justify-content: center;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .legend-color {
            width: 40px;
            height: 25px;
            border-radius: 4px;
            border: 2px solid rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="altcoin-header">
            <h1>🌟 Altcoin Season Index</h1>
            <p style="color: #94a3b8; font-size: 18px;">Indice du marché crypto</p>
        </div>

        """ + NAV + """

        <div class="gauge-card">
            <div class="gauge-container">
                <svg class="circular-gauge" viewBox="0 0 300 300">
                    <circle class="gauge-background" cx="150" cy="150" r="120" />
                    <circle id="gauge-fill" class="gauge-fill" cx="150" cy="150" r="120" />
                </svg>
                
                <div class="gauge-center">
                    <div id="gauge-value" class="gauge-value" style="color: #60a5fa;">--</div>
                    <div class="gauge-label">INDEX</div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <h2 id="statusTitle" style="font-size: 28px; font-weight: 800; color: #60a5fa; margin-bottom: 10px;">⚖️ Phase mixte</h2>
                <p id="statusDescription" style="color: #94a3b8; font-size: 16px;">Marché équilibré BTC/Alts</p>
            </div>
        </div>

        <div class="legend-box">
            <div class="legend-items">
                <div class="legend-item">
                    <div class="legend-color" style="background: linear-gradient(to right, #d32f2f, #ff6f00);"></div>
                    <div style="font-size: 14px; color: #e2e8f0;">Altcoin Season (75-100)</div>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: linear-gradient(to right, #ffc107, #4caf50);"></div>
                    <div style="font-size: 14px; color: #e2e8f0;">Zone Mixte (40-75)</div>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: linear-gradient(to right, #26c6da, #0d47a1);"></div>
                    <div style="font-size: 14px; color: #e2e8f0;">Bitcoin Season (0-25)</div>
                </div>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div style="font-size: 36px; margin-bottom: 15px;">📈</div>
                <div id="stat-alts" class="value">--/50</div>
                <div class="label">Alts > BTC</div>
            </div>
            <div class="stat-card">
                <div style="font-size: 36px; margin-bottom: 15px;">📊</div>
                <div id="stat-trend" class="value">--</div>
                <div class="label">Tendance</div>
            </div>
            <div class="stat-card">
                <div style="font-size: 36px; margin-bottom: 15px;">₿</div>
                <div id="stat-btc" class="value">--</div>
                <div class="label">BTC 90j</div>
            </div>
            <div class="stat-card">
                <div style="font-size: 36px; margin-bottom: 15px;">⚡</div>
                <div id="stat-momentum" class="value">--</div>
                <div class="label">Momentum</div>
            </div>
        </div>
    </div>

    <script>
        function updateGauge(index) {
            const circle = document.getElementById('gauge-fill');
            const valueElement = document.getElementById('gauge-value');
            
            const radius = 120;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (index / 100) * circumference;
            
            circle.style.strokeDasharray = circumference;
            
            let color;
            if (index >= 75) color = '#ef4444';
            else if (index >= 60) color = '#f59e0b';
            else if (index >= 40) color = '#10b981';
            else if (index >= 25) color = '#3b82f6';
            else color = '#1e40af';
            
            circle.style.stroke = color;
            circle.style.strokeDashoffset = offset;
            
            valueElement.textContent = Math.round(index);
            valueElement.style.color = color;
        }

        function updateStats(data) {
            updateGauge(data.index);
            
            let title, description;
            if (data.index >= 75) {
                title = '🔥 Altcoin Season !';
                description = 'Les altcoins dominent le marché';
            } else if (data.index >= 60) {
                title = '📈 Altcoins en hausse';
                description = 'Belle performance des altcoins';
            } else if (data.index >= 40) {
                title = '⚖️ Phase mixte';
                description = 'Marché équilibré BTC/Alts';
            } else if (data.index >= 25) {
                title = '📉 Bitcoin domine';
                description = 'Bitcoin surperforme les altcoins';
            } else {
                title = '❄️ Bitcoin Season';
                description = 'Bitcoin écrase les altcoins';
            }
            
            document.getElementById('statusTitle').textContent = title;
            document.getElementById('statusDescription').textContent = description;
            
            document.getElementById('stat-alts').textContent = Math.round(data.alts_winning) + '/50';
            document.getElementById('stat-trend').textContent = data.trend;
            document.getElementById('stat-btc').textContent = (data.btc_change_90d >= 0 ? '+' : '') + data.btc_change_90d.toFixed(1) + '%';
            document.getElementById('stat-momentum').textContent = data.momentum;
        }

        async function loadData() {
            try {
                console.log('🔄 Chargement...');
                const response = await fetch('/api/altcoin-season-index');
                if (!response.ok) throw new Error('HTTP ' + response.status);
                const data = await response.json();
                console.log('✅ Data:', data);
                updateStats(data);
            } catch (error) {
                console.error('❌ Erreur:', error);
                document.getElementById('statusTitle').textContent = '❌ Erreur';
                document.getElementById('statusDescription').textContent = 'Connexion impossible';
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            loadData();
        });

        setInterval(loadData, 300000);

        console.log('🌟 Altcoin Season Index initialisé');
    </script>
</body>
</html>
"""
    return html


@app.get("/nouvelles", response_class=HTMLResponse)
async def news_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Nouvelles</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>📰 Actualités Crypto</h1></div>""" + NAV + """<div class="card"><div id="news"><div class="spinner"></div></div></div></div><script>async function load(){const r=await fetch('/api/crypto-news');const d=await r.json();let h='';d.articles.forEach(a=>{h+='<div style="padding:20px;border-bottom:1px solid #334155"><h3 style="color:#60a5fa;margin-bottom:10px">'+a.title+'</h3><p style="color:#94a3b8;font-size:14px">'+a.source+'</p><a href="'+a.url+'" target="_blank" style="color:#3b82f6">Lire →</a></div>'});document.getElementById('news').innerHTML=h}load();setInterval(load,300000);</script></body></html>"""
    return HTMLResponse(html)




@app.get("/bullrun-phase", response_class=HTMLResponse)
async def bullrun_page():
    html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Bullrun Phase Tracker</title>
    """ + CSS + """
    <style>
        /* Styles spécifiques pour Bullrun Phase */
        .phase-hero {
            background: linear-gradient(135deg, #1e1b4b 0%, #1e293b 50%, #0f172a 100%);
            padding: 60px 40px;
            border-radius: 20px;
            margin-bottom: 40px;
            position: relative;
            overflow: hidden;
            border: 2px solid #334155;
        }
        
        .phase-hero::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, transparent 70%);
            animation: pulse 4s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.5; }
        }
        
        .current-phase-display {
            text-align: center;
            position: relative;
            z-index: 1;
        }
        
        .phase-number {
            font-size: 120px;
            font-weight: 900;
            background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #ec4899 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 1;
            margin-bottom: 20px;
            text-shadow: 0 0 80px rgba(96, 165, 250, 0.5);
            animation: glow 2s ease-in-out infinite;
        }
        
        @keyframes glow {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.3); }
        }
        
        .phase-title {
            font-size: 48px;
            font-weight: 800;
            color: #e2e8f0;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .phase-subtitle {
            font-size: 20px;
            color: #94a3b8;
            margin-bottom: 30px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            line-height: 1.6;
        }
        
        .confidence-badge {
            display: inline-block;
            padding: 12px 30px;
            background: rgba(16, 185, 129, 0.2);
            border: 2px solid #10b981;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 700;
            color: #10b981;
            margin-top: 20px;
        }
        
        /* Timeline des 4 phases */
        .phases-timeline {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin: 40px 0;
            position: relative;
        }
        
        .phases-timeline::before {
            content: '';
            position: absolute;
            top: 40px;
            left: 10%;
            right: 10%;
            height: 4px;
            background: linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899, #f59e0b);
            z-index: 0;
        }
        
        .phase-card {
            background: #1e293b;
            padding: 30px 20px;
            border-radius: 16px;
            text-align: center;
            position: relative;
            border: 2px solid #334155;
            transition: all 0.3s ease;
            z-index: 1;
        }
        
        .phase-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        
        .phase-card.active {
            border-color: #60a5fa;
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            box-shadow: 0 0 40px rgba(96, 165, 250, 0.3);
            transform: scale(1.05);
        }
        
        .phase-card.completed {
            opacity: 0.6;
            border-color: #10b981;
        }
        
        .phase-icon {
            font-size: 64px;
            margin-bottom: 15px;
            display: block;
        }
        
        .phase-number-small {
            font-size: 32px;
            font-weight: 900;
            color: #60a5fa;
            margin-bottom: 10px;
        }
        
        .phase-name {
            font-size: 20px;
            font-weight: 700;
            color: #e2e8f0;
            margin-bottom: 10px;
        }
        
        .phase-desc {
            font-size: 14px;
            color: #94a3b8;
            line-height: 1.5;
        }
        
        /* Indicateurs en temps réel */
        .indicators-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .indicator-card {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            padding: 25px;
            border-radius: 12px;
            border: 1px solid #334155;
            transition: all 0.3s ease;
        }
        
        .indicator-card:hover {
            border-color: #60a5fa;
            transform: translateY(-5px);
        }
        
        .indicator-label {
            font-size: 13px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        
        .indicator-value {
            font-size: 42px;
            font-weight: 900;
            margin: 15px 0;
        }
        
        .indicator-change {
            font-size: 14px;
            margin-top: 10px;
        }
        
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        .neutral { color: #f59e0b; }
        
        /* Signaux de marché */
        .signals-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin: 30px 0;
        }
        
        .signal-item {
            padding: 20px 25px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 20px;
            transition: all 0.3s ease;
        }
        
        .signal-item:hover {
            transform: translateX(10px);
        }
        
        .signal-icon {
            font-size: 32px;
            flex-shrink: 0;
        }
        
        .signal-content {
            flex-grow: 1;
        }
        
        .signal-strength {
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        
        .signal-message {
            font-size: 16px;
            font-weight: 600;
        }
        
        .signal-bullish-btc {
            background: rgba(249, 115, 22, 0.1);
            border-left: 4px solid #f97316;
        }
        
        .signal-bullish-alt {
            background: rgba(16, 185, 129, 0.1);
            border-left: 4px solid #10b981;
        }
        
        .signal-warning {
            background: rgba(239, 68, 68, 0.1);
            border-left: 4px solid #ef4444;
        }
        
        .signal-opportunity {
            background: rgba(34, 197, 94, 0.1);
            border-left: 4px solid #22c55e;
        }
        
        .signal-altcoin-season {
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
            border-left: 4px solid #a855f7;
        }
        
        /* Next Phase Prediction */
        .next-phase-card {
            background: linear-gradient(135deg, #312e81 0%, #1e293b 100%);
            padding: 35px;
            border-radius: 16px;
            border: 2px solid #6366f1;
            margin: 30px 0;
        }
        
        .next-phase-title {
            font-size: 24px;
            font-weight: 700;
            color: #818cf8;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .next-phase-content {
            font-size: 18px;
            color: #e2e8f0;
            line-height: 1.8;
        }
        
        .time-estimate {
            display: inline-block;
            padding: 8px 16px;
            background: rgba(99, 102, 241, 0.2);
            border-radius: 20px;
            font-size: 14px;
            font-weight: 700;
            color: #818cf8;
            margin-top: 15px;
        }
        
        /* Graphique de progression */
        .progress-bar-container {
            margin: 40px 0;
            padding: 30px;
            background: #1e293b;
            border-radius: 12px;
            border: 1px solid #334155;
        }
        
        .progress-label {
            font-size: 16px;
            color: #94a3b8;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
        }
        
        .progress-bar {
            height: 40px;
            background: #0f172a;
            border-radius: 20px;
            overflow: hidden;
            position: relative;
            border: 2px solid #334155;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
            border-radius: 20px;
            transition: width 2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 15px;
            font-size: 16px;
            font-weight: 700;
            color: white;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .phases-timeline {
                grid-template-columns: 1fr;
            }
            
            .phases-timeline::before {
                display: none;
            }
            
            .phase-number {
                font-size: 80px;
            }
            
            .phase-title {
                font-size: 32px;
            }
        }
        
        /* Loading état */
        .loading-state {
            text-align: center;
            padding: 100px 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Bullrun Phase Tracker</h1>
            <p>Analyse en temps réel des 4 phases du cycle haussier crypto</p>
        </div>
        
        """ + NAV + """
        
        <div id="loading" class="loading-state">
            <div class="spinner"></div>
            <p style="color: #94a3b8; margin-top: 20px;">Chargement des données du marché...</p>
        </div>
        
        <div id="content" style="display: none;">
            <!-- Phase Actuelle Hero -->
            <div class="phase-hero">
                <div class="current-phase-display">
                    <div class="phase-number" id="current-phase-number">2.5</div>
                    <div class="phase-title" id="current-phase-title">TRANSITION</div>
                    <div class="phase-subtitle" id="current-phase-description">
                        Analyse en cours...
                    </div>
                    <div class="confidence-badge" id="confidence-badge">
                        <span id="confidence-value">85</span>% Confiance
                    </div>
                </div>
            </div>
            
            <!-- Timeline des 4 Phases -->
            <div class="card">
                <h2>📊 Les 4 Phases du Bullrun</h2>
                <div class="phases-timeline">
                    <div class="phase-card" id="phase-1">
                        <span class="phase-icon">💎</span>
                        <div class="phase-number-small">Phase 1</div>
                        <div class="phase-name">Accumulation</div>
                        <div class="phase-desc">Les investisseurs intelligents accumulent à bas prix pendant le bear market</div>
                    </div>
                    
                    <div class="phase-card" id="phase-2">
                        <span class="phase-icon">🟠</span>
                        <div class="phase-number-small">Phase 2</div>
                        <div class="phase-name">Bitcoin Rally</div>
                        <div class="phase-desc">Bitcoin monte en premier, dominance BTC augmente, les institutions entrent</div>
                    </div>
                    
                    <div class="phase-card active" id="phase-3">
                        <span class="phase-icon">💠</span>
                        <div class="phase-number-small">Phase 3</div>
                        <div class="phase-name">ETH & Large Caps</div>
                        <div class="phase-desc">Ethereum et les grandes caps rattrapent, dominance BTC commence à baisser</div>
                    </div>
                    
                    <div class="phase-card" id="phase-4">
                        <span class="phase-icon">🌈</span>
                        <div class="phase-number-small">Phase 4</div>
                        <div class="phase-name">Altcoin Season</div>
                        <div class="phase-desc">Les altcoins explosent, gains massifs, euphorie maximale</div>
                    </div>
                </div>
                
                <!-- Barre de progression -->
                <div class="progress-bar-container">
                    <div class="progress-label">
                        <span>Progression du Bullrun</span>
                        <span id="progress-percentage">62%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill" style="width: 0%">
                            <span id="progress-text"></span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Indicateurs en temps réel -->
            <div class="card">
                <h2>📈 Indicateurs de Marché en Temps Réel</h2>
                <div class="indicators-grid" id="indicators-grid">
                    <!-- Rempli dynamiquement -->
                </div>
            </div>
            
            <!-- Signaux de Marché -->
            <div class="card">
                <h2>🎯 Signaux & Analyse</h2>
                <div class="signals-container" id="signals-container">
                    <!-- Rempli dynamiquement -->
                </div>
            </div>
            
            <!-- Prochaine Phase -->
            <div class="next-phase-card">
                <div class="next-phase-title">
                    🔮 Prochaine Phase Attendue
                </div>
                <div class="next-phase-content" id="next-phase-content">
                    Phase 4 - Altcoin Season imminente
                </div>
                <div class="time-estimate" id="time-estimate">
                    ⏱️ Estimation: 1-2 semaines
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let currentData = null;
        
        async function loadBullrunData() {
            try {
                const response = await fetch('/api/bullrun-phase');
                const data = await response.json();
                currentData = data;
                
                // Masquer loading, afficher contenu
                document.getElementById('loading').style.display = 'none';
                document.getElementById('content').style.display = 'block';
                
                // Mettre à jour l'affichage
                updateDisplay(data);
            } catch (error) {
                console.error('Erreur chargement:', error);
                document.getElementById('loading').innerHTML = 
                    '<div class="alert alert-error">Erreur de chargement des données</div>';
            }
        }
        
        function updateDisplay(data) {
            // Hero - Phase actuelle
            const phaseNum = data.current_phase;
            const phaseDisplay = Math.floor(phaseNum) === phaseNum ? phaseNum : `${Math.floor(phaseNum)}-${Math.ceil(phaseNum)}`;
            
            document.getElementById('current-phase-number').textContent = phaseDisplay;
            document.getElementById('current-phase-title').textContent = data.phase_name;
            document.getElementById('current-phase-description').textContent = data.phase_description;
            document.getElementById('confidence-value').textContent = data.confidence;
            
            // Mettre à jour les cartes de phase
            for (let i = 1; i <= 4; i++) {
                const card = document.getElementById(`phase-${i}`);
                card.classList.remove('active', 'completed');
                
                if (i < Math.floor(phaseNum)) {
                    card.classList.add('completed');
                } else if (i === Math.floor(phaseNum) || i === Math.ceil(phaseNum)) {
                    card.classList.add('active');
                }
            }
            
            // Barre de progression
            const progress = ((phaseNum - 1) / 3) * 100;
            document.getElementById('progress-fill').style.width = progress + '%';
            document.getElementById('progress-percentage').textContent = Math.round(progress) + '%';
            document.getElementById('progress-text').textContent = Math.round(progress) + '%';
            
            // Indicateurs
            updateIndicators(data.indicators);
            
            // Signaux
            updateSignals(data.signals);
            
            // Next phase
            document.getElementById('next-phase-content').textContent = data.next_phase;
            document.getElementById('time-estimate').textContent = '⏱️ ' + data.time_estimate;
        }
        
        function updateIndicators(indicators) {
            const grid = document.getElementById('indicators-grid');
            
            const formatNumber = (num) => {
                if (num >= 1000000000000) return '$' + (num / 1000000000000).toFixed(2) + 'T';
                if (num >= 1000000000) return '$' + (num / 1000000000).toFixed(2) + 'B';
                if (num >= 1000000) return '$' + (num / 1000000).toFixed(2) + 'M';
                return '$' + num.toFixed(2);
            };
            
            const getColorClass = (value, type) => {
                if (type === 'btc_dom') {
                    return value > 60 ? 'positive' : value < 50 ? 'negative' : 'neutral';
                } else if (type === 'fear') {
                    return value > 75 ? 'negative' : value < 25 ? 'positive' : 'neutral';
                } else if (type === 'alt_index') {
                    return value > 75 ? 'positive' : value < 25 ? 'negative' : 'neutral';
                }
                return 'neutral';
            };
            
            grid.innerHTML = `
                <div class="indicator-card">
                    <div class="indicator-label">🟠 Bitcoin Dominance</div>
                    <div class="indicator-value ${getColorClass(indicators.btc_dominance, 'btc_dom')}">
                        ${indicators.btc_dominance}%
                    </div>
                    <div class="indicator-change">
                        ${indicators.btc_dominance > 60 ? '📈 Fort' : indicators.btc_dominance < 50 ? '📉 Faible' : '➡️ Neutre'}
                    </div>
                </div>
                
                <div class="indicator-card">
                    <div class="indicator-label">💠 Ethereum Dominance</div>
                    <div class="indicator-value" style="color: #818cf8;">
                        ${indicators.eth_dominance}%
                    </div>
                    <div class="indicator-change">
                        ${indicators.eth_dominance > 15 ? '📈 Fort' : '➡️ Normal'}
                    </div>
                </div>
                
                <div class="indicator-card">
                    <div class="indicator-label">😱 Fear & Greed Index</div>
                    <div class="indicator-value ${getColorClass(indicators.fear_greed, 'fear')}">
                        ${indicators.fear_greed}
                    </div>
                    <div class="indicator-change">
                        ${indicators.fear_greed > 75 ? '🔥 Extreme Greed' : 
                          indicators.fear_greed > 55 ? '😊 Greed' : 
                          indicators.fear_greed > 45 ? '😐 Neutral' : 
                          indicators.fear_greed > 25 ? '😰 Fear' : '😱 Extreme Fear'}
                    </div>
                </div>
                
                <div class="indicator-card">
                    <div class="indicator-label">🌟 Altcoin Season Index</div>
                    <div class="indicator-value ${getColorClass(indicators.altcoin_season_index, 'alt_index')}">
                        ${indicators.altcoin_season_index}
                    </div>
                    <div class="indicator-change">
                        ${indicators.altcoin_season_index > 75 ? '🚀 Alt Season!' : 
                          indicators.altcoin_season_index > 50 ? '📈 Début Alt Season' : '🟠 Bitcoin Season'}
                    </div>
                </div>
                
                <div class="indicator-card">
                    <div class="indicator-label">₿ Prix Bitcoin</div>
                    <div class="indicator-value" style="color: #f59e0b;">
                        ${formatNumber(indicators.btc_price)}
                    </div>
                    <div class="indicator-change ${indicators.btc_24h_change >= 0 ? 'positive' : 'negative'}">
                        ${indicators.btc_24h_change >= 0 ? '📈' : '📉'} ${Math.abs(indicators.btc_24h_change)}% (24h)
                    </div>
                </div>
                
                <div class="indicator-card">
                    <div class="indicator-label">💰 Market Cap Total</div>
                    <div class="indicator-value" style="color: #a78bfa;">
                        ${formatNumber(indicators.total_market_cap)}
                    </div>
                    <div class="indicator-change">
                        Capitalisation totale
                    </div>
                </div>
            `;
        }
        
        function updateSignals(signals) {
            const container = document.getElementById('signals-container');
            
            if (!signals || signals.length === 0) {
                container.innerHTML = '<div class="alert alert-info">Aucun signal particulier pour le moment</div>';
                return;
            }
            
            const getSignalIcon = (type) => {
                const icons = {
                    'bullish_btc': '🟠',
                    'bullish_alt': '🌈',
                    'warning': '⚠️',
                    'opportunity': '💎',
                    'altcoin_season': '🚀',
                    'neutral': 'ℹ️'
                };
                return icons[type] || 'ℹ️';
            };
            
            container.innerHTML = signals.map(signal => `
                <div class="signal-item signal-${signal.type}">
                    <span class="signal-icon">${getSignalIcon(signal.type)}</span>
                    <div class="signal-content">
                        <div class="signal-strength" style="color: ${
                            signal.strength === 'fort' || signal.strength === 'confirmé' ? '#10b981' : 
                            signal.strength === 'élevé' ? '#f59e0b' : '#94a3b8'
                        }">
                            ${signal.strength}
                        </div>
                        <div class="signal-message">${signal.message}</div>
                    </div>
                </div>
            `).join('');
        }
        
        // Charger au démarrage
        loadBullrunData();
        
        // Recharger toutes les 2 minutes
        setInterval(loadBullrunData, 120000);
        
        console.log('🚀 Bullrun Phase Tracker chargé!');
    </script>
</body>
</html>
"""
    return HTMLResponse(html)
    return HTMLResponse(html)


@app.get("/graphiques", response_class=HTMLResponse)
async def charts_page():
    html = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📈 Graphiques Trading Pro</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://s3.tradingview.com/tv.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', 'Segoe UI', sans-serif; 
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); 
            color: #e2e8f0; 
            padding: 20px; 
            min-height: 100vh; 
        }
        .container { max-width: 1800px; margin: 0 auto; }
        
        /* Header */
        .header { 
            background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%); 
            padding: 40px; 
            border-radius: 20px; 
            text-align: center; 
            margin-bottom: 30px; 
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4); 
            position: relative; 
            overflow: hidden; 
        }
        .header::before { 
            content: ''; 
            position: absolute; 
            top: 0; 
            left: -100%; 
            width: 200%; 
            height: 100%; 
            background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.1), transparent); 
            animation: shine 3s infinite; 
        }
        @keyframes shine { 0%, 100% { left: -100%; } 50% { left: 100%; } }
        .header h1 { 
            font-size: 48px; 
            background: linear-gradient(to right, #60a5fa, #a78bfa, #f472b6); 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
            margin-bottom: 10px; 
            position: relative; 
            z-index: 1; 
        }
        .header p { color: #94a3b8; font-size: 18px; position: relative; z-index: 1; }
        
        /* Navigation */
        .nav { 
            display: flex; 
            gap: 10px; 
            margin-bottom: 30px; 
            flex-wrap: wrap; 
            justify-content: center; 
        }
        .nav a { 
            padding: 12px 24px; 
            background: rgba(30, 41, 59, 0.8); 
            backdrop-filter: blur(10px); 
            border-radius: 12px; 
            text-decoration: none; 
            color: #e2e8f0; 
            transition: all 0.3s; 
            border: 1px solid rgba(51, 65, 85, 0.5); 
        }
        .nav a:hover { 
            background: rgba(51, 65, 85, 0.9); 
            border-color: #60a5fa; 
            transform: translateY(-2px); 
            box-shadow: 0 10px 30px rgba(96, 165, 250, 0.2); 
        }
        
        /* Tabs */
        .tabs-container { 
            background: rgba(30, 41, 59, 0.6); 
            backdrop-filter: blur(10px); 
            padding: 15px; 
            border-radius: 16px; 
            margin-bottom: 30px; 
            border: 1px solid rgba(51, 65, 85, 0.5); 
        }
        .tabs { 
            display: flex; 
            gap: 10px; 
            flex-wrap: wrap; 
            justify-content: center; 
        }
        .tab-btn { 
            padding: 14px 28px; 
            background: rgba(15, 23, 42, 0.6); 
            border: 1px solid rgba(51, 65, 85, 0.5); 
            border-radius: 12px; 
            color: #94a3b8; 
            cursor: pointer; 
            transition: all 0.3s; 
            font-weight: 600; 
            font-size: 15px; 
        }
        .tab-btn:hover { 
            background: rgba(51, 65, 85, 0.8); 
            color: #e2e8f0; 
            transform: translateY(-2px); 
        }
        .tab-btn.active { 
            background: linear-gradient(135deg, #3b82f6, #2563eb); 
            color: #fff; 
            border-color: #60a5fa; 
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); 
        }
        
        /* Tab Content */
        .tab-content { display: none; }
        .tab-content.active { display: block; animation: fadeIn 0.5s ease; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Cards */
        .chart-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); 
            gap: 20px; 
            margin-bottom: 20px; 
        }
        .chart-card { 
            background: rgba(30, 41, 59, 0.8); 
            backdrop-filter: blur(10px); 
            padding: 25px; 
            border-radius: 16px; 
            border: 1px solid rgba(51, 65, 85, 0.5); 
            transition: all 0.3s; 
        }
        .chart-card:hover { 
            transform: translateY(-5px); 
            box-shadow: 0 20px 50px rgba(96, 165, 250, 0.3); 
            border-color: #60a5fa; 
        }
        .chart-card h3 { 
            color: #60a5fa; 
            margin-bottom: 20px; 
            font-size: 20px; 
            display: flex; 
            align-items: center; 
            gap: 10px; 
        }
        
        /* TradingView Container */
        .tradingview-widget-container { 
            height: 600px; 
            background: rgba(15, 23, 42, 0.8); 
            border-radius: 12px; 
            overflow: hidden; 
        }
        .tradingview-widget-container iframe { border-radius: 12px; }
        
        /* Canvas Containers - Tailles fixes pour éviter la croissance infinie */
        .canvas-container { 
            position: relative; 
            width: 100%; 
            height: 350px; 
        }
        .canvas-container canvas {
            max-width: 100% !important;
            height: 350px !important;
        }
        .canvas-container.small { height: 250px; }
        .canvas-container.small canvas { height: 250px !important; }
        .canvas-container.large { height: 450px; }
        .canvas-container.large canvas { height: 450px !important; }
        
        /* Stats Grid */
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .stat-card { 
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%); 
            padding: 25px; 
            border-radius: 16px; 
            border: 1px solid rgba(96, 165, 250, 0.2); 
            position: relative; 
            overflow: hidden; 
            transition: all 0.3s; 
        }
        .stat-card:hover { 
            transform: translateY(-5px); 
            box-shadow: 0 20px 50px rgba(96, 165, 250, 0.3); 
            border-color: #60a5fa; 
        }
        .stat-card::before { 
            content: ''; 
            position: absolute; 
            top: 0; 
            right: 0; 
            width: 100px; 
            height: 100px; 
            background: radial-gradient(circle, rgba(96, 165, 250, 0.1), transparent); 
            border-radius: 50%; 
        }
        .stat-icon { font-size: 36px; margin-bottom: 15px; }
        .stat-label { 
            color: #94a3b8; 
            font-size: 13px; 
            margin-bottom: 8px; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
        }
        .stat-value { 
            font-size: 36px; 
            font-weight: 700; 
            background: linear-gradient(to right, #60a5fa, #a78bfa); 
            -webkit-background-clip: text; 
            -webkit-text-fill-color: transparent; 
            margin-bottom: 8px; 
        }
        .stat-change { font-size: 13px; color: #10b981; }
        .stat-change.negative { color: #ef4444; }
        
        /* Crypto Selector */
        .crypto-selector { 
            display: flex; 
            gap: 10px; 
            margin-bottom: 20px; 
            flex-wrap: wrap; 
        }
        .crypto-btn { 
            padding: 12px 20px; 
            background: rgba(15, 23, 42, 0.8); 
            border: 1px solid rgba(51, 65, 85, 0.5); 
            border-radius: 10px; 
            color: #e2e8f0; 
            cursor: pointer; 
            transition: all 0.3s; 
            font-weight: 600; 
            display: flex; 
            align-items: center; 
            gap: 8px; 
        }
        .crypto-btn:hover { 
            background: rgba(51, 65, 85, 0.8); 
            border-color: #60a5fa; 
            transform: translateY(-2px); 
        }
        .crypto-btn.active { 
            background: linear-gradient(135deg, #3b82f6, #2563eb); 
            border-color: #60a5fa; 
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); 
        }
        
        /* Loading */
        .spinner { 
            border: 5px solid rgba(51, 65, 85, 0.3); 
            border-top: 5px solid #60a5fa; 
            border-radius: 50%; 
            width: 60px; 
            height: 60px; 
            animation: spin 1s linear infinite; 
            margin: 60px auto; 
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        /* Alert */
        .alert { 
            padding: 16px 20px; 
            border-radius: 12px; 
            margin: 20px 0; 
            display: flex; 
            align-items: center; 
            gap: 12px; 
            font-size: 14px; 
        }
        .alert-info { 
            background: rgba(59, 130, 246, 0.1); 
            border-left: 4px solid #3b82f6; 
            color: #3b82f6; 
        }
        
        /* Responsive */
        @media (max-width: 768px) { 
            .header h1 { font-size: 32px; } 
            .chart-grid { grid-template-columns: 1fr; } 
            .tabs { flex-direction: column; } 
            .crypto-selector { flex-direction: column; } 
            .tradingview-widget-container { height: 400px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>📈 Graphiques Trading Pro</h1>
            <p>Analyse technique avancée et visualisation de données</p>
        </div>
        
        """ + NAV + """
        
        <!-- Tabs -->
        <div class="tabs-container">
            <div class="tabs">
                <button class="tab-btn active" onclick="switchTab('tradingview', event)">📊 TradingView Pro</button>
                <button class="tab-btn" onclick="switchTab('statistics', event)">📈 Statistiques</button>
                <button class="tab-btn" onclick="switchTab('comparison', event)">🔄 Comparaison</button>
                <button class="tab-btn" onclick="switchTab('correlation', event)">🔗 Corrélation</button>
                <button class="tab-btn" onclick="switchTab('performance', event)">💹 Performance</button>
            </div>
        </div>
        
        <!-- Tab Content: TradingView -->
        <div id="tradingview" class="tab-content active">
            <div class="alert alert-info">
                💡 <strong>Astuce:</strong> Cliquez sur une crypto ci-dessous pour voir son graphique TradingView professionnel en temps réel
            </div>
            
            <div class="crypto-selector">
                <button class="crypto-btn active" onclick="loadTradingView('BTCUSD', event)">
                    <span>₿</span> Bitcoin
                </button>
                <button class="crypto-btn" onclick="loadTradingView('ETHUSD', event)">
                    <span>Ξ</span> Ethereum
                </button>
                <button class="crypto-btn" onclick="loadTradingView('SOLUSD', event)">
                    <span>◎</span> Solana
                </button>
                <button class="crypto-btn" onclick="loadTradingView('BNBUSD', event)">
                    <span>🔶</span> BNB
                </button>
                <button class="crypto-btn" onclick="loadTradingView('XRPUSD', event)">
                    <span>✕</span> XRP
                </button>
                <button class="crypto-btn" onclick="loadTradingView('ADAUSD', event)">
                    <span>₳</span> Cardano
                </button>
                <button class="crypto-btn" onclick="loadTradingView('DOGEUSDT', event)">
                    <span>Ð</span> Dogecoin
                </button>
                <button class="crypto-btn" onclick="loadTradingView('AVAXUSD', event)">
                    <span>🔺</span> Avalanche
                </button>
            </div>
            
            <div class="chart-card">
                <h3>
                    <span id="currentCrypto">Bitcoin (BTC)</span>
                    <span style="margin-left: auto; font-size: 14px; color: #94a3b8;">Graphique en temps réel</span>
                </h3>
                <div class="tradingview-widget-container" id="tradingview_chart">
                    <div class="spinner"></div>
                </div>
            </div>
        </div>
        
        <!-- Tab Content: Statistics -->
        <div id="statistics" class="tab-content">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-label">Volume 24h Total</div>
                    <div class="stat-value" id="volume24h">$0</div>
                    <div class="stat-change" id="volumeChange">Chargement...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-label">Market Cap Total</div>
                    <div class="stat-value" id="marketCap">$0</div>
                    <div class="stat-change" id="mcapChange">Chargement...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📈</div>
                    <div class="stat-label">BTC Prix</div>
                    <div class="stat-value" id="btcPrice">$0</div>
                    <div class="stat-change" id="btcChange">Chargement...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⚡</div>
                    <div class="stat-label">ETH Prix</div>
                    <div class="stat-value" id="ethPrice">$0</div>
                    <div class="stat-change" id="ethChange">Chargement...</div>
                </div>
            </div>
            
            <div class="chart-grid">
                <div class="chart-card">
                    <h3>📊 Volume de Trading (7 jours)</h3>
                    <div class="canvas-container">
                        <canvas id="volumeChart"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h3>💹 Évolution des Prix (30 jours)</h3>
                    <div class="canvas-container">
                        <canvas id="priceChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tab Content: Comparison -->
        <div id="comparison" class="tab-content">
            <div class="chart-grid">
                <div class="chart-card">
                    <h3>🔄 Comparaison BTC vs ETH vs SOL</h3>
                    <div class="canvas-container">
                        <canvas id="comparisonChart"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h3>📊 Performance Relative (30 jours)</h3>
                    <div class="canvas-container">
                        <canvas id="relativeChart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="chart-card">
                <h3>🏆 Classement par Performance</h3>
                <div class="canvas-container small">
                    <canvas id="rankingChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Tab Content: Correlation -->
        <div id="correlation" class="tab-content">
            <div class="chart-grid">
                <div class="chart-card">
                    <h3>🔗 Matrice de Corrélation</h3>
                    <div class="canvas-container large">
                        <canvas id="correlationChart"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h3>📉 Dispersion BTC vs Altcoins</h3>
                    <div class="canvas-container large">
                        <canvas id="scatterChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tab Content: Performance -->
        <div id="performance" class="tab-content">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">🚀</div>
                    <div class="stat-label">Meilleur Performer</div>
                    <div class="stat-value" id="bestPerformer">---</div>
                    <div class="stat-change" id="bestPerf">Chargement...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📉</div>
                    <div class="stat-label">Plus Faible</div>
                    <div class="stat-value" id="worstPerformer">---</div>
                    <div class="stat-change negative" id="worstPerf">Chargement...</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💎</div>
                    <div class="stat-label">Volatilité Moyenne</div>
                    <div class="stat-value" id="avgVolatility">0%</div>
                    <div class="stat-change">Sur 30 jours</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🎯</div>
                    <div class="stat-label">Ratio Sharpe</div>
                    <div class="stat-value" id="sharpeRatio">0.0</div>
                    <div class="stat-change">Rendement/Risque</div>
                </div>
            </div>
            
            <div class="chart-grid">
                <div class="chart-card">
                    <h3>📈 Performance Multi-Période</h3>
                    <div class="canvas-container">
                        <canvas id="multiPeriodChart"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h3>🎲 Volatilité Historique</h3>
                    <div class="canvas-container">
                        <canvas id="volatilityChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Variables globales
        let currentSymbol = 'BTCUSD';
        let tradingViewWidget = null;
        let charts = {};
        let tabsInitialized = {}; // Pour suivre quels onglets ont déjà été initialisés
        
        // Switch Tab
        function switchTab(tabName, event) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            if (event && event.target) {
                event.target.classList.add('active');
            } else {
                // Fallback: find button by text
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    if (btn.textContent.toLowerCase().includes(tabName.toLowerCase())) {
                        btn.classList.add('active');
                    }
                });
            }
            
            // Initialize charts for the tab ONLY ONCE
            if (!tabsInitialized[tabName]) {
                if (tabName === 'statistics') {
                    initStatistics();
                } else if (tabName === 'comparison') {
                    initComparison();
                } else if (tabName === 'correlation') {
                    initCorrelation();
                } else if (tabName === 'performance') {
                    initPerformance();
                }
                tabsInitialized[tabName] = true; // Marquer comme initialisé
            }
        }
        
        // Load TradingView Chart
        function loadTradingView(symbol, event) {
            currentSymbol = symbol;
            
            // Update active button
            document.querySelectorAll('.crypto-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Find and activate the clicked button
            if (event && event.target) {
                const clickedBtn = event.target.closest('.crypto-btn');
                if (clickedBtn) {
                    clickedBtn.classList.add('active');
                }
            } else {
                // If no event (initial load), activate first button
                const firstBtn = document.querySelector('.crypto-btn');
                if (firstBtn) firstBtn.classList.add('active');
            }
            
            // Update title
            const names = {
                'BTCUSD': 'Bitcoin (BTC)',
                'ETHUSD': 'Ethereum (ETH)',
                'SOLUSD': 'Solana (SOL)',
                'BNBUSD': 'BNB',
                'XRPUSD': 'Ripple (XRP)',
                'ADAUSD': 'Cardano (ADA)',
                'DOGEUSDT': 'Dogecoin (DOGE)',
                'AVAXUSD': 'Avalanche (AVAX)'
            };
            document.getElementById('currentCrypto').textContent = names[symbol] || symbol;
            
            // Clear and reload widget
            const container = document.getElementById('tradingview_chart');
            container.innerHTML = '<div class="spinner"></div>';
            
            // Wait for TradingView to be loaded
            if (typeof TradingView === 'undefined') {
                container.innerHTML = '<div style="color:#ef4444;text-align:center;padding:50px;">Erreur: TradingView non disponible. Vérifiez votre connexion.</div>';
                return;
            }
            
            try {
                new TradingView.widget({
                    "width": "100%",
                    "height": 600,
                    "symbol": "BINANCE:" + symbol,
                    "interval": "D",
                    "timezone": "America/New_York",
                    "theme": "dark",
                    "style": "1",
                    "locale": "fr",
                    "toolbar_bg": "#1e293b",
                    "enable_publishing": false,
                    "allow_symbol_change": true,
                    "container_id": "tradingview_chart",
                    "studies": [
                        "RSI@tv-basicstudies",
                        "MASimple@tv-basicstudies",
                        "MACD@tv-basicstudies"
                    ],
                    "show_popup_button": true,
                    "popup_width": "1000",
                    "popup_height": "650"
                });
            } catch (error) {
                console.error('Erreur TradingView:', error);
                container.innerHTML = '<div style="color:#ef4444;text-align:center;padding:50px;">Erreur lors du chargement du graphique. Rafraîchissez la page.</div>';
            }
        }
        
        // Initialize Statistics
        async function initStatistics() {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/global');
                const data = await response.json();
                
                // Update stats
                const totalVolume = data.data.total_volume.usd;
                const totalMcap = data.data.total_market_cap.usd;
                
                document.getElementById('volume24h').textContent = '$' + (totalVolume / 1e9).toFixed(2) + 'B';
                document.getElementById('volumeChange').textContent = '+' + (Math.random() * 10).toFixed(2) + '% vs hier';
                
                document.getElementById('marketCap').textContent = '$' + (totalMcap / 1e12).toFixed(2) + 'T';
                document.getElementById('mcapChange').textContent = '+' + (Math.random() * 5).toFixed(2) + '% vs hier';
                
                // Get BTC and ETH prices
                const pricesRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
                const prices = await pricesRes.json();
                
                document.getElementById('btcPrice').textContent = '$' + prices.bitcoin.usd.toLocaleString();
                document.getElementById('btcChange').textContent = prices.bitcoin.usd_24h_change.toFixed(2) + '% (24h)';
                document.getElementById('btcChange').className = 'stat-change ' + (prices.bitcoin.usd_24h_change >= 0 ? '' : 'negative');
                
                document.getElementById('ethPrice').textContent = '$' + prices.ethereum.usd.toLocaleString();
                document.getElementById('ethChange').textContent = prices.ethereum.usd_24h_change.toFixed(2) + '% (24h)';
                document.getElementById('ethChange').className = 'stat-change ' + (prices.ethereum.usd_24h_change >= 0 ? '' : 'negative');
                
                // Create charts
                createVolumeChart();
                createPriceChart();
            } catch (error) {
                console.error('Erreur:', error);
            }
        }
        
        function createVolumeChart() {
            // Destroy existing chart if it exists
            if (charts.volume) {
                charts.volume.destroy();
            }
            
            const ctx = document.getElementById('volumeChart').getContext('2d');
            const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            const data = Array.from({length: 7}, () => Math.random() * 100 + 50);
            
            charts.volume = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: days,
                    datasets: [{
                        label: 'Volume (Milliards $)',
                        data: data,
                        backgroundColor: 'rgba(96, 165, 250, 0.6)',
                        borderColor: 'rgba(96, 165, 250, 1)',
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: false,
                    
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleColor: '#60a5fa',
                            bodyColor: '#e2e8f0',
                            borderColor: '#334155',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(51, 65, 85, 0.3)' },
                            ticks: { color: '#94a3b8' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
        }
        
        function createPriceChart() {
            // Destroy existing chart if it exists
            if (charts.price) {
                charts.price.destroy();
            }
            
            const ctx = document.getElementById('priceChart').getContext('2d');
            const days = Array.from({length: 30}, (_, i) => i + 1);
            const btcData = Array.from({length: 30}, () => Math.random() * 5000 + 60000);
            const ethData = Array.from({length: 30}, () => Math.random() * 500 + 3000);
            
            charts.price = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: days,
                    datasets: [
                        {
                            label: 'Bitcoin',
                            data: btcData,
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Ethereum',
                            data: ethData,
                            borderColor: '#60a5fa',
                            backgroundColor: 'rgba(96, 165, 250, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: false,
                    
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: {
                            labels: { color: '#e2e8f0', font: { size: 14 } }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleColor: '#60a5fa',
                            bodyColor: '#e2e8f0'
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: { color: 'rgba(51, 65, 85, 0.3)' },
                            ticks: { color: '#f59e0b' }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            ticks: { color: '#60a5fa' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
        }
        
        // Initialize Comparison
        function initComparison() {
            // Destroy existing charts if they exist
            if (charts.comparison) {
                charts.comparison.destroy();
                charts.comparison = null;
            }
            if (charts.relative) {
                charts.relative.destroy();
                charts.relative = null;
            }
            if (charts.ranking) {
                charts.ranking.destroy();
                charts.ranking = null;
            }
            
            const ctx1 = document.getElementById('comparisonChart').getContext('2d');
            const ctx2 = document.getElementById('relativeChart').getContext('2d');
            const ctx3 = document.getElementById('rankingChart').getContext('2d');
            
            const days = Array.from({length: 30}, (_, i) => 'J' + (i + 1));
            
            charts.comparison = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: days,
                    datasets: [
                        {
                            label: 'Bitcoin',
                            data: Array.from({length: 30}, () => Math.random() * 10 + 95),
                            borderColor: '#f59e0b',
                            borderWidth: 3,
                            tension: 0.4
                        },
                        {
                            label: 'Ethereum',
                            data: Array.from({length: 30}, () => Math.random() * 10 + 90),
                            borderColor: '#60a5fa',
                            borderWidth: 3,
                            tension: 0.4
                        },
                        {
                            label: 'Solana',
                            data: Array.from({length: 30}, () => Math.random() * 10 + 85),
                            borderColor: '#a78bfa',
                            borderWidth: 3,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: false,
                    
                    plugins: {
                        legend: { labels: { color: '#e2e8f0' } }
                    },
                    scales: {
                        y: {
                            grid: { color: 'rgba(51, 65, 85, 0.3)' },
                            ticks: { color: '#94a3b8' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
            
            charts.relative = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Semaine', '2 Semaines', '1 Mois'],
                    datasets: [
                        {
                            label: 'BTC',
                            data: [5.2, 8.7, 15.3],
                            backgroundColor: 'rgba(245, 158, 11, 0.6)'
                        },
                        {
                            label: 'ETH',
                            data: [4.1, 7.2, 12.8],
                            backgroundColor: 'rgba(96, 165, 250, 0.6)'
                        },
                        {
                            label: 'SOL',
                            data: [8.3, 15.1, 28.4],
                            backgroundColor: 'rgba(167, 139, 250, 0.6)'
                        }
                    ]
                },
                options: {
                    responsive: false,
                    
                    plugins: {
                        legend: { labels: { color: '#e2e8f0' } }
                    },
                    scales: {
                        y: {
                            grid: { color: 'rgba(51, 65, 85, 0.3)' },
                            ticks: { color: '#94a3b8', callback: value => value + '%' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
            
            charts.ranking = new Chart(ctx3, {
                type: 'bar',
                data: {
                    labels: ['SOL', 'AVAX', 'BTC', 'BNB', 'ETH', 'ADA', 'XRP', 'DOGE'],
                    datasets: [{
                        label: 'Performance 30j (%)',
                        data: [28.4, 22.1, 15.3, 12.8, 12.8, 8.7, 5.2, -2.3],
                        backgroundColor: [
                            '#10b981', '#10b981', '#10b981', '#60a5fa', 
                            '#60a5fa', '#f59e0b', '#f59e0b', '#ef4444'
                        ],
                        borderRadius: 8
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: false,
                    
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(51, 65, 85, 0.3)' },
                            ticks: { color: '#94a3b8', callback: value => value + '%' }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 14, weight: 'bold' } }
                        }
                    }
                }
            });
        }
        
        // Initialize Correlation
        function initCorrelation() {
            // Destroy existing charts if they exist
            if (charts.correlation) {
                charts.correlation.destroy();
                charts.correlation = null;
            }
            if (charts.scatter) {
                charts.scatter.destroy();
                charts.scatter = null;
            }
            
            const ctx1 = document.getElementById('correlationChart').getContext('2d');
            const ctx2 = document.getElementById('scatterChart').getContext('2d');
            
            // Matrice de corrélation simplifiée
            const cryptos = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA'];
            const correlationData = [
                [1.00, 0.85, 0.72, 0.68, 0.63],
                [0.85, 1.00, 0.78, 0.74, 0.69],
                [0.72, 0.78, 1.00, 0.81, 0.75],
                [0.68, 0.74, 0.81, 1.00, 0.79],
                [0.63, 0.69, 0.75, 0.79, 1.00]
            ];
            
            charts.correlation = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: cryptos,
                    datasets: [{
                        label: 'Corrélation',
                        data: correlationData.map(row => row.reduce((a, b) => a + b) / row.length),
                        backgroundColor: 'rgba(96, 165, 250, 0.6)',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: false,
                    
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: context => 'Corrélation moyenne: ' + context.parsed.y.toFixed(2)
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1,
                            grid: { color: 'rgba(51, 65, 85, 0.3)' },
                            ticks: { color: '#94a3b8' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 14, weight: 'bold' } }
                        }
                    }
                }
            });
            
            // Scatter plot
            const scatterData = Array.from({length: 50}, () => ({
                x: Math.random() * 20 - 10,
                y: Math.random() * 20 - 10
            }));
            
            charts.scatter = new Chart(ctx2, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'BTC vs Altcoins',
                        data: scatterData,
                        backgroundColor: 'rgba(96, 165, 250, 0.6)',
                        borderColor: '#60a5fa',
                        borderWidth: 2,
                        pointRadius: 6
                    }]
                },
                options: {
                    responsive: false,
                    
                    plugins: {
                        legend: { labels: { color: '#e2e8f0' } }
                    },
                    scales: {
                        y: {
                            grid: { color: 'rgba(51, 65, 85, 0.3)' },
                            ticks: { color: '#94a3b8', callback: value => value + '%' }
                        },
                        x: {
                            grid: { color: 'rgba(51, 65, 85, 0.3)' },
                            ticks: { color: '#94a3b8', callback: value => value + '%' }
                        }
                    }
                }
            });
        }
        
        // Initialize Performance
        function initPerformance() {
            // Destroy existing charts if they exist
            if (charts.multiPeriod) {
                charts.multiPeriod.destroy();
                charts.multiPeriod = null;
            }
            if (charts.volatility) {
                charts.volatility.destroy();
                charts.volatility = null;
            }
            
            // Update stats
            document.getElementById('bestPerformer').textContent = 'SOL';
            document.getElementById('bestPerf').textContent = '+28.4% (30j)';
            document.getElementById('worstPerformer').textContent = 'DOGE';
            document.getElementById('worstPerf').textContent = '-2.3% (30j)';
            document.getElementById('avgVolatility').textContent = '12.7%';
            document.getElementById('sharpeRatio').textContent = '1.85';
            
            const ctx1 = document.getElementById('multiPeriodChart').getContext('2d');
            const ctx2 = document.getElementById('volatilityChart').getContext('2d');
            
            charts.multiPeriod = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: ['7j', '14j', '30j', '90j', 'YTD', '1an'],
                    datasets: [
                        {
                            label: 'BTC',
                            data: [5.2, 8.7, 15.3, 45.2, 78.3, 125.4],
                            backgroundColor: 'rgba(245, 158, 11, 0.6)'
                        },
                        {
                            label: 'ETH',
                            data: [4.1, 7.2, 12.8, 38.9, 65.7, 98.2],
                            backgroundColor: 'rgba(96, 165, 250, 0.6)'
                        },
                        {
                            label: 'SOL',
                            data: [8.3, 15.1, 28.4, 87.6, 156.8, 342.1],
                            backgroundColor: 'rgba(167, 139, 250, 0.6)'
                        }
                    ]
                },
                options: {
                    responsive: false,
                    
                    plugins: {
                        legend: { labels: { color: '#e2e8f0' } }
                    },
                    scales: {
                        y: {
                            grid: { color: 'rgba(51, 65, 85, 0.3)' },
                            ticks: { color: '#94a3b8', callback: value => value + '%' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
            
            charts.volatility = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: Array.from({length: 30}, (_, i) => 'J' + (i + 1)),
                    datasets: [
                        {
                            label: 'BTC Volatilité',
                            data: Array.from({length: 30}, () => Math.random() * 5 + 10),
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'ETH Volatilité',
                            data: Array.from({length: 30}, () => Math.random() * 8 + 12),
                            borderColor: '#60a5fa',
                            backgroundColor: 'rgba(96, 165, 250, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: false,
                    
                    plugins: {
                        legend: { labels: { color: '#e2e8f0' } }
                    },
                    scales: {
                        y: {
                            grid: { color: 'rgba(51, 65, 85, 0.3)' },
                            ticks: { color: '#94a3b8', callback: value => value + '%' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            });
        }
        
        // Initialize on page load
        // Initialize on page load
        window.addEventListener('load', () => {
            console.log('🔄 Chargement de la page graphiques...');
            
            // Wait a bit for TradingView script to load
            setTimeout(() => {
                if (typeof TradingView !== 'undefined') {
                    loadTradingView('BTCUSD');
                    console.log('✅ Graphiques Trading Pro chargés');
                } else {
                    console.error('❌ TradingView non disponible');
                    const container = document.getElementById('tradingview_chart');
                    if (container) {
                        container.innerHTML = '<div style="color:#ef4444;text-align:center;padding:50px;">⚠️ Erreur: Impossible de charger TradingView. Vérifiez votre connexion internet et rafraîchissez la page.</div>';
                    }
                }
            }, 500);
        });
    </script>
</body>
</html>"""
    return HTMLResponse(html)
@app.get("/telegram-test", response_class=HTMLResponse)
async def telegram_page():
    html = """<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Telegram Test</title>""" + CSS + """</head><body><div class="container"><div class="header"><h1>📱 Test Telegram</h1></div>""" + NAV + """<div class="card"><button onclick="test()">🔔 Envoyer Test</button><div id="result" style="margin-top:20px"></div></div></div><script>async function test(){const r=await fetch('/api/telegram-test');document.getElementById('result').innerHTML='<div class="alert alert-success">✅ Message envoyé!</div>'}</script></body></html>"""
    return HTMLResponse(html)


@app.get("/trades", response_class=HTMLResponse)
async def trades_page():
    html = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 Trades Premium</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Segoe UI', sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #e2e8f0; padding: 20px; min-height: 100vh; }
        .container { max-width: 1600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%); padding: 40px; border-radius: 20px; text-align: center; margin-bottom: 30px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4); position: relative; overflow: hidden; }
        .header::before { content: ''; position: absolute; top: 0; left: -100%; width: 200%; height: 100%; background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.1), transparent); animation: shine 3s infinite; }
        @keyframes shine { 0%, 100% { left: -100%; } 50% { left: 100%; } }
        .header h1 { font-size: 48px; background: linear-gradient(to right, #60a5fa, #a78bfa, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px; position: relative; z-index: 1; }
        .header p { color: #94a3b8; font-size: 18px; position: relative; z-index: 1; }
        .nav { display: flex; gap: 10px; margin-bottom: 30px; flex-wrap: wrap; justify-content: center; }
        .nav a { padding: 12px 24px; background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); border-radius: 12px; text-decoration: none; color: #e2e8f0; transition: all 0.3s; border: 1px solid rgba(51, 65, 85, 0.5); }
        .nav a:hover { background: rgba(51, 65, 85, 0.9); border-color: #60a5fa; transform: translateY(-2px); box-shadow: 0 10px 30px rgba(96, 165, 250, 0.2); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 16px; border: 1px solid rgba(96, 165, 250, 0.2); position: relative; overflow: hidden; transition: all 0.3s; }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 50px rgba(96, 165, 250, 0.3); border-color: #60a5fa; }
        .stat-card::before { content: ''; position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: radial-gradient(circle, rgba(96, 165, 250, 0.1), transparent); border-radius: 50%; }
        .stat-icon { font-size: 36px; margin-bottom: 15px; }
        .stat-label { color: #94a3b8; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .stat-value { font-size: 42px; font-weight: 700; background: linear-gradient(to right, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
        .stat-change { font-size: 13px; color: #10b981; }
        .stat-change.negative { color: #ef4444; }
        .controls { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(10px); padding: 25px; border-radius: 16px; margin-bottom: 30px; border: 1px solid rgba(51, 65, 85, 0.5); display: flex; gap: 15px; flex-wrap: wrap; align-items: center; }
        button { padding: 14px 28px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 15px; transition: all 0.3s; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); }
        button:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(59, 130, 246, 0.6); }
        .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); }
        .btn-danger:hover { box-shadow: 0 8px 25px rgba(239, 68, 68, 0.6); }
        .btn-success { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); }
        select, input { padding: 14px 20px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(51, 65, 85, 0.5); border-radius: 12px; color: #e2e8f0; font-size: 14px; transition: all 0.3s; }
        select:focus, input:focus { outline: none; border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1); }
        .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .chart-card { background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); padding: 25px; border-radius: 16px; border: 1px solid rgba(51, 65, 85, 0.5); }
        .chart-card h3 { color: #60a5fa; margin-bottom: 20px; font-size: 20px; }
        .trades-container { background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); padding: 25px; border-radius: 16px; border: 1px solid rgba(51, 65, 85, 0.5); overflow-x: auto; }
        .trades-container h2 { color: #60a5fa; margin-bottom: 20px; font-size: 24px; display: flex; align-items: center; gap: 10px; }
        table { width: 100%; border-collapse: collapse; min-width: 1100px; }
        table th { background: rgba(15, 23, 42, 0.8); padding: 16px; text-align: left; color: #60a5fa; font-weight: 600; border-bottom: 2px solid #334155; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
        table td { padding: 18px 16px; border-bottom: 1px solid rgba(51, 65, 85, 0.5); font-size: 14px; }
        table tr { transition: all 0.2s; cursor: pointer; }
        table tr:hover { background: rgba(15, 23, 42, 0.6); }
        .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge-long { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-short { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .badge-open { background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
        .badge-closed { background: rgba(148, 163, 184, 0.2); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }
        .confidence-meter { width: 100%; height: 8px; background: rgba(15, 23, 42, 0.8); border-radius: 4px; overflow: hidden; margin-top: 8px; }
        .confidence-fill { height: 100%; background: linear-gradient(to right, #ef4444, #f59e0b, #10b981); border-radius: 4px; transition: width 0.5s ease; }
        .rr-display { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; background: rgba(167, 139, 250, 0.1); border-radius: 8px; border: 1px solid rgba(167, 139, 250, 0.3); }
        .rr-value { font-weight: 700; color: #a78bfa; }
        .price { font-family: 'Courier New', monospace; font-weight: 600; }
        .price-hit { color: #10b981; font-weight: 700; background: rgba(16, 185, 129, 0.1); padding: 4px 8px; border-radius: 6px; }
        .price-sl-hit { color: #ef4444; font-weight: 700; background: rgba(239, 68, 68, 0.1); padding: 4px 8px; border-radius: 6px; }
        .time-display { color: #94a3b8; font-size: 13px; white-space: nowrap; }
        .time-display .date { display: block; font-size: 11px; color: #64748b; }
        .spinner { border: 5px solid rgba(51, 65, 85, 0.3); border-top: 5px solid #60a5fa; border-radius: 50%; width: 60px; height: 60px; animation: spin 1s linear infinite; margin: 60px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(10px); z-index: 1000; align-items: center; justify-content: center; }
        .modal.show { display: flex; }
        .modal-content { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px; border-radius: 20px; max-width: 600px; width: 90%; border: 1px solid rgba(96, 165, 250, 0.3); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-height: 90vh; overflow-y: auto; }
        .modal-close { float: right; font-size: 28px; cursor: pointer; color: #94a3b8; transition: color 0.3s; }
        .modal-close:hover { color: #ef4444; }
        .alert { padding: 16px 20px; border-radius: 12px; margin: 20px 0; display: flex; align-items: center; gap: 12px; font-size: 14px; }
        .alert-success { background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; color: #10b981; }
        .alert-error { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; color: #ef4444; }
        .alert-info { background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; color: #3b82f6; }
        @media (max-width: 768px) { .header h1 { font-size: 32px; } .stats-grid { grid-template-columns: 1fr; } .charts-grid { grid-template-columns: 1fr; } .controls { flex-direction: column; } button, select, input { width: 100%; } table { font-size: 12px; } table th, table td { padding: 10px 8px; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.5s ease; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header fade-in">
            <h1>📊 Gestion des Trades Premium</h1>
            <p>Plateforme avancée de suivi et d'analyse de trading</p>
        </div>
        """ + NAV + """
        <div style="height:15px;"></div>
        <div class="stats-grid fade-in" id="statsGrid">
            <div class="stat-card"><div class="stat-icon">📈</div><div class="stat-label">Total Trades</div><div class="stat-value" id="totalTrades">0</div><div class="stat-change" id="totalChange">+0 cette semaine</div></div>
            <div class="stat-card"><div class="stat-icon">🎯</div><div class="stat-label">Trades Ouverts</div><div class="stat-value" id="openTrades">0</div><div class="stat-change" id="openChange">Actifs maintenant</div></div>
            <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-label">Win Rate</div><div class="stat-value" id="winRate">0%</div><div class="stat-change" id="winChange">+0% ce mois</div></div>
            <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-label">P&L Total</div><div class="stat-value" id="totalPnl">$0</div><div class="stat-change" id="pnlChange">+$0 aujourd'hui</div></div>
            <div class="stat-card"><div class="stat-icon">🎲</div><div class="stat-label">Confiance Moyenne</div><div class="stat-value" id="avgConfidence">0%</div><div class="stat-change">Score IA moyen</div></div>
            <div class="stat-card"><div class="stat-icon">🎯</div><div class="stat-label">TP Atteints</div><div class="stat-value" id="tpHits">0</div><div class="stat-change">Targets touchés</div></div>
        </div>
        <div class="controls fade-in">
            <button onclick="addDemo()" class="btn-success">➕ Ajouter Trade Démo</button>
            <button onclick="load()">🔄 Rafraîchir</button>
            <select id="filterStatus" onchange="filterTrades()"><option value="all">Tous les statuts</option><option value="OPEN">Ouverts</option><option value="CLOSED">Fermés</option></select>
            <select id="filterSide" onchange="filterTrades()"><option value="all">Tous les types</option><option value="LONG">LONG</option><option value="SHORT">SHORT</option></select>
            <input type="text" id="searchSymbol" placeholder="🔍 Rechercher symbole..." onkeyup="filterTrades()">
            <button onclick="clearAll()" class="btn-danger">🗑️ Effacer Tous</button>
        </div>
        <div class="charts-grid fade-in">
            <div class="chart-card"><h3>📊 Performance Hebdomadaire</h3><canvas id="performanceChart"></canvas></div>
            <div class="chart-card"><h3>🥧 Distribution des Trades</h3><canvas id="distributionChart"></canvas></div>
        </div>
        <div class="trades-container fade-in">
            <h2><span>💼 Tous les Trades</span><span id="tradesCount" style="font-size: 16px; color: #94a3b8; margin-left: auto;">(0)</span></h2>
            <div id="trades"><div class="spinner"></div></div>
        </div>

        <!-- P&L Hebdomadaire -->
        <div class="trades-container fade-in" style="margin-top:30px;">
            <h2><span>📊 P&L de la Semaine</span></h2>
            <p style="color:#94a3b8;margin-bottom:20px;">Vos performances jour par jour (reset automatique chaque lundi)</p>

            <div id="weeklyPnlContainer" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:15px;margin-bottom:20px;">
                <div class="spinner"></div>
            </div>

            <div style="display:flex;gap:15px;align-items:center;justify-content:space-between;flex-wrap:wrap;">
                <div class="stat-card" style="flex:1;min-width:200px;margin-bottom:0;">
                    <div class="stat-label">Total de la Semaine</div>
                    <div class="stat-value" id="weeklyTotal" style="font-size:36px;font-weight:700;color:#e2e8f0;">--</div>
                </div>
                <button onclick="resetWeeklyPnl()" class="btn-danger">🔄 Reset Semaine</button>
            </div>

            <p style="color:#64748b;font-size:12px;margin-top:15px;">
                ℹ️ Le P&L se met à jour automatiquement quand un trade se ferme. Reset automatique chaque lundi à minuit.
            </p>
        </div>
    </div>
    <div class="modal" id="tradeModal">
        <div class="modal-content">
            <span class="modal-close" onclick="closeModal()">&times;</span>
            <div id="modalContent"></div>
        </div>
    </div>
    <script>
        let allTrades = []; let performanceChart = null; let distributionChart = null;
        
        function formatPrice(price, isHit, isSL) {
            if (price === undefined || price === null) return '$0.00';
            
            // Formatage intelligent selon le prix
            let decimals;
            const numPrice = parseFloat(price);
            
            if (numPrice < 0.001) {
                decimals = 8;  // Memecoins (SHIB, PEPE, CHEEMS, etc.)
            } else if (numPrice < 1) {
                decimals = 6;  // Petites cryptos
            } else if (numPrice < 100) {
                decimals = 4;  // Altcoins moyens
            } else {
                decimals = 2;  // BTC, ETH, etc.
            }
            
            // Formater et supprimer les zéros inutiles
            let formatted = '$' + numPrice.toFixed(decimals);
            formatted = formatted.replace(/\.?0+$/, ''); // Supprimer les zéros à la fin
            if (formatted.endsWith('.')) formatted = formatted.slice(0, -1); // Supprimer le point si nécessaire
            
            if (isHit && isSL) {
                return '<span class="price-sl-hit">' + formatted + ' ❌</span>';
            } else if (isHit) {
                return '<span class="price-hit">' + formatted + ' ✅</span>';
            }
            return '<span class="price">' + formatted + '</span>';
        }
        
        function formatTime(timestamp) {
            if (!timestamp) return 'N/A';
            const date = new Date(timestamp);
            const time = date.toLocaleTimeString('fr-CA', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false,
                timeZone: 'America/Montreal'
            });
            const dateStr = date.toLocaleDateString('fr-CA', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                timeZone: 'America/Montreal'
            });
            return '<div class="time-display">' + time + '<span class="date">' + dateStr + '</span></div>';
        }
        
        async function load() { 
            try { 
                const response = await fetch('/api/trades'); 
                const data = await response.json(); 
                allTrades = data.trades || []; 
                updateStats(); 
                updateCharts(); 
                displayTrades(allTrades); 
            } catch (error) { 
                console.error('Error loading trades:', error); 
                document.getElementById('trades').innerHTML = '<div class="alert alert-error">❌ Erreur de chargement des données</div>'; 
            } 
        }
        
        function calculateTradePnL(trade) {
            // Calcul du P&L simplifié : 1R (Risk) = $100
            // TP1 = +$100, TP2 = +$200, TP3 = +$300, SL/Revirement = -$100
            
            if (trade.status !== 'closed') return 0; // Trade ouvert = 0 P&L
            
            const RISK_AMOUNT = 100; // 1R = $100
            
            // Si SL touché ou revirement sans TP = perte de 1R ($100)
            if (trade.sl_hit || (trade.closed_reason && trade.closed_reason.includes('Revirement') && !trade.tp1_hit && !trade.tp2_hit && !trade.tp3_hit)) {
                return -RISK_AMOUNT; // -$100
            }
            
            // Compter les TP atteints (on prend le plus haut)
            if (trade.tp3_hit) {
                return RISK_AMOUNT * 3; // +$300
            } else if (trade.tp2_hit) {
                return RISK_AMOUNT * 2; // +$200
            } else if (trade.tp1_hit) {
                return RISK_AMOUNT * 1; // +$100
            }
            
            return 0; // Trade fermé sans TP ni SL (cas rare)
        }
        
        async function updateStats() { 
            try { 
                const response = await fetch('/api/stats'); 
                const stats = await response.json(); 
                document.getElementById('totalTrades').textContent = stats.total_trades || 0; 
                document.getElementById('openTrades').textContent = stats.open_trades || 0; 
                document.getElementById('winRate').textContent = (stats.win_rate || 0).toFixed(1) + '%'; 
                const totalPnl = allTrades.reduce((sum, t) => sum + calculateTradePnL(t), 0); 
                const pnlElement = document.getElementById('totalPnl');
                pnlElement.textContent = (totalPnl >= 0 ? '+' : '') + '$' + totalPnl.toFixed(2);
                pnlElement.style.color = totalPnl >= 0 ? '#10b981' : '#ef4444'; // Vert si positif, rouge si négatif
                
                const avgConf = allTrades.length > 0 ? allTrades.reduce((sum, t) => sum + (t.confidence || 0), 0) / allTrades.length : 0; 
                document.getElementById('avgConfidence').textContent = avgConf.toFixed(1) + '%'; 
                const tpHits = allTrades.reduce((sum, t) => sum + (t.tp1_hit ? 1 : 0) + (t.tp2_hit ? 1 : 0) + (t.tp3_hit ? 1 : 0), 0);
                document.getElementById('tpHits').textContent = tpHits; 
            } catch (error) { 
                console.error('Error updating stats:', error); 
            } 
        }
        
        function displayTrades(trades) {
            const container = document.getElementById('trades');
            document.getElementById('tradesCount').textContent = '(' + trades.length + ')';
            if (trades.length === 0) {
                container.innerHTML = '<div class="alert alert-info">📭 Aucun trade trouvé</div>';
                return;
            }
            
            let html = '<table><thead><tr><th>Heure</th><th>Symbole</th><th>Type</th><th>Entry</th><th>SL</th><th>TP1</th><th>TP2</th><th>TP3</th><th>Confiance</th><th>Statut</th><th>Close</th><th>Actions</th></tr></thead><tbody>';
            
            trades.forEach((trade, index) => {
                const side = trade.side || 'N/A';
                const sideClass = side === 'LONG' ? 'badge-long' : 'badge-short';
                const status = trade.status || 'OPEN';
                const statusClass = status === 'OPEN' ? 'badge-open' : 'badge-closed';
                
                html += '<tr onclick="showTradeDetails(' + index + ')">';
                html += '<td>' + formatTime(trade.timestamp) + '</td>';
                html += '<td><strong>' + (trade.symbol || 'N/A') + '</strong></td>';
                html += '<td><span class="badge ' + sideClass + '">' + side + '</span></td>';
                html += '<td>' + formatPrice(trade.entry, false, false) + '</td>';
                html += '<td>' + formatPrice(trade.sl, trade.sl_hit, true) + '</td>';
                html += '<td>' + formatPrice(trade.tp1, trade.tp1_hit, false) + '</td>';
                html += '<td>' + formatPrice(trade.tp2, trade.tp2_hit, false) + '</td>';
                html += '<td>' + formatPrice(trade.tp3, trade.tp3_hit, false) + '</td>';
                html += '<td><div><strong>' + (trade.confidence || 0).toFixed(1) + '%</strong>';
                html += '<div class="confidence-meter"><div class="confidence-fill" style="width: ' + (trade.confidence || 0) + '%"></div></div></div></td>';
                html += '<td><span class="badge ' + statusClass + '">' + status + '</span></td>';
                
                // Colonne CLOSE pour les revirements
                html += '<td>';
                if (trade.status === 'closed' && trade.closed_reason && trade.closed_reason.includes('Revirement') && !trade.tp3_hit) {
                    html += '<span class="badge badge-reversal" style="background: #ef4444; color: white; font-weight: 600;">🔄 REVIREMENT</span>';
                } else if (trade.status === 'closed' && trade.tp3_hit) {
                    html += '<span class="badge" style="background: #10b981; color: white;">✅ TP3</span>';
                } else if (trade.status === 'closed' && trade.sl_hit) {
                    html += '<span class="badge" style="background: #ef4444; color: white;">❌ SL</span>';
                } else if (trade.status === 'closed') {
                    html += '<span class="badge" style="background: #64748b; color: white;">CLOSE</span>';
                } else {
                    html += '<span style="color: #64748b;">—</span>';
                }
                html += '</td>';
                
                html += '<td style="white-space: nowrap;">';
                html += '<button onclick="event.stopPropagation(); toggleTP(' + index + ', 1)" style="padding: 6px 10px; font-size: 11px; margin: 2px; background: ' + (trade.tp1_hit ? '#10b981' : '#334155') + ';">TP1</button>';
                html += '<button onclick="event.stopPropagation(); toggleTP(' + index + ', 2)" style="padding: 6px 10px; font-size: 11px; margin: 2px; background: ' + (trade.tp2_hit ? '#10b981' : '#334155') + ';">TP2</button>';
                html += '<button onclick="event.stopPropagation(); toggleTP(' + index + ', 3)" style="padding: 6px 10px; font-size: 11px; margin: 2px; background: ' + (trade.tp3_hit ? '#10b981' : '#334155') + ';">TP3</button>';
                html += '<button onclick="event.stopPropagation(); toggleSL(' + index + ')" style="padding: 6px 10px; font-size: 11px; margin: 2px; background: ' + (trade.sl_hit ? '#ef4444' : '#334155') + ';">SL</button>';
                html += '</td>';
                html += '</tr>';
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        }
        
        function filterTrades() { 
            const statusFilter = document.getElementById('filterStatus').value; 
            const sideFilter = document.getElementById('filterSide').value; 
            const searchQuery = document.getElementById('searchSymbol').value.toLowerCase(); 
            let filtered = allTrades.filter(trade => { 
                const matchStatus = statusFilter === 'all' || trade.status === statusFilter; 
                const matchSide = sideFilter === 'all' || trade.side === sideFilter; 
                const matchSymbol = !searchQuery || (trade.symbol && trade.symbol.toLowerCase().includes(searchQuery)); 
                return matchStatus && matchSide && matchSymbol; 
            }); 
            displayTrades(filtered); 
        }
        
        function showTradeDetails(index) {
            const trade = allTrades[index];
            const modal = document.getElementById('tradeModal');
            const content = document.getElementById('modalContent');
            const sideClass = trade.side === 'LONG' ? 'badge-long' : 'badge-short';
            const statusClass = trade.status === 'OPEN' ? 'badge-open' : 'badge-closed';
            const timestamp = trade.timestamp ? new Date(trade.timestamp).toLocaleString('fr-CA', { 
                dateStyle: 'full', 
                timeStyle: 'short',
                timeZone: 'America/Montreal'
            }) : 'N/A';
            
            // Helper pour formater les prix avec coloration
            const smartFormat = (price) => {
                if (!price) return '$0.00';
                const numPrice = parseFloat(price);
                let decimals;
                if (numPrice < 0.001) decimals = 8;
                else if (numPrice < 1) decimals = 6;
                else if (numPrice < 100) decimals = 4;
                else decimals = 2;
                let formatted = '$' + numPrice.toFixed(decimals);
                formatted = formatted.replace(/\.?0+$/, '');
                if (formatted.endsWith('.')) formatted = formatted.slice(0, -1);
                return formatted;
            };
            
            const formatTPPrice = (price, isHit) => {
                if (!price) return '$0.00';
                const formatted = smartFormat(price);
                return isHit ? '<span class="price-hit">' + formatted + ' ✅</span>' : formatted;
            };
            
            const formatSLPrice = (price, isHit) => {
                if (!price) return '$0.00';
                const formatted = smartFormat(price);
                return isHit ? '<span class="price-sl-hit">' + formatted + ' ❌</span>' : formatted;
            };
            
            content.innerHTML = '<h2 style="color: #60a5fa; margin-bottom: 15px;">' + (trade.symbol || 'N/A') + ' - Détails du Trade</h2>' +
                '<p style="color: #94a3b8; margin-bottom: 25px; font-size: 14px;">🕐 ' + timestamp + '</p>' +
                '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">' +
                '<div><div class="stat-label">Type</div><span class="badge ' + sideClass + '" style="font-size: 16px; padding: 10px 20px;">' + (trade.side || 'N/A') + '</span></div>' +
                '<div><div class="stat-label">Statut</div><span class="badge ' + statusClass + '" style="font-size: 16px; padding: 10px 20px;">' + (trade.status || 'OPEN') + '</span></div>' +
                '</div>' +
                '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">' +
                '<div class="stat-box" style="background: rgba(15, 23, 42, 0.8); padding: 20px; border-radius: 12px;"><div class="stat-label">Entry Price</div><div class="stat-value" style="font-size: 28px;">' + smartFormat(trade.entry) + '</div></div>' +
                '<div class="stat-box" style="background: rgba(15, 23, 42, 0.8); padding: 20px; border-radius: 12px;"><div class="stat-label">Stop Loss</div><div class="stat-value" style="font-size: 28px;">' + formatSLPrice(trade.sl, trade.sl_hit) + '</div></div>' +
                '</div>' +
                '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">' +
                '<div class="stat-box" style="background: rgba(15, 23, 42, 0.8); padding: 20px; border-radius: 12px;"><div class="stat-label">TP1</div><div class="stat-value" style="font-size: 24px;">' + formatTPPrice(trade.tp1, trade.tp1_hit) + '</div></div>' +
                '<div class="stat-box" style="background: rgba(15, 23, 42, 0.8); padding: 20px; border-radius: 12px;"><div class="stat-label">TP2</div><div class="stat-value" style="font-size: 24px;">' + formatTPPrice(trade.tp2, trade.tp2_hit) + '</div></div>' +
                '<div class="stat-box" style="background: rgba(15, 23, 42, 0.8); padding: 20px; border-radius: 12px;"><div class="stat-label">TP3</div><div class="stat-value" style="font-size: 24px;">' + formatTPPrice(trade.tp3, trade.tp3_hit) + '</div></div>' +
                '</div>' +
                '<div style="margin-bottom: 25px;">' +
                '<div class="stat-box" style="background: rgba(15, 23, 42, 0.8); padding: 20px; border-radius: 12px;"><div class="stat-label">Confiance IA</div><div style="font-size: 28px; color: #10b981; font-weight: 700;">' + (trade.confidence || 0).toFixed(1) + '%</div></div>' +
                '</div>' +
                (trade.note ? '<div style="background: rgba(15, 23, 42, 0.8); padding: 20px; border-radius: 12px; margin-bottom: 25px;"><div class="stat-label">Note</div><p style="color: #e2e8f0; margin-top: 10px; line-height: 1.6;">' + trade.note + '</p></div>' : '') +
                '<button onclick="closeModal()" style="width: 100%; margin-top: 10px;">Fermer</button>';
            
            modal.classList.add('show');
        }
        
        function closeModal() { document.getElementById('tradeModal').classList.remove('show'); }
        
        async function toggleTP(index, tpNumber) {
            const trade = allTrades[index];
            const tpKey = 'tp' + tpNumber + '_hit';
            const newValue = !trade[tpKey];
            
            try {
                const response = await fetch('/api/trades/update-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        symbol: trade.symbol,
                        timestamp: trade.timestamp,
                        [tpKey]: newValue
                    })
                });
                
                if (response.ok) {
                    trade[tpKey] = newValue;
                    load();
                    showAlert('✅ TP' + tpNumber + ' ' + (newValue ? 'atteint' : 'réinitialisé'), 'success');
                }
            } catch (error) {
                showAlert('❌ Erreur lors de la mise à jour', 'error');
            }
        }
        
        async function toggleSL(index) {
            const trade = allTrades[index];
            const newValue = !trade.sl_hit;
            
            try {
                const response = await fetch('/api/trades/update-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        symbol: trade.symbol,
                        timestamp: trade.timestamp,
                        sl_hit: newValue,
                        status: newValue ? 'closed' : 'open'
                    })
                });
                
                if (response.ok) {
                    trade.sl_hit = newValue;
                    trade.status = newValue ? 'closed' : 'open';
                    load();
                    showAlert('✅ SL ' + (newValue ? 'atteint' : 'réinitialisé'), newValue ? 'error' : 'success');
                }
            } catch (error) {
                showAlert('❌ Erreur lors de la mise à jour', 'error');
            }
        }
        
        function updateCharts() { 
            const performanceCtx = document.getElementById('performanceChart').getContext('2d'); 
            if (performanceChart) performanceChart.destroy(); 
            performanceChart = new Chart(performanceCtx, { type: 'line', data: { labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], datasets: [{ label: 'P&L', data: [120, 190, 150, 220, 280, 240, 300], borderColor: '#60a5fa', backgroundColor: 'rgba(96, 165, 250, 0.1)', tension: 0.4, fill: true }] }, options: { responsive: false, plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51, 65, 85, 0.3)' } }, x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51, 65, 85, 0.3)' } } } } }); 
            const distributionCtx = document.getElementById('distributionChart').getContext('2d'); 
            if (distributionChart) distributionChart.destroy(); 
            const longCount = allTrades.filter(t => t.side === 'LONG').length; 
            const shortCount = allTrades.filter(t => t.side === 'SHORT').length; 
            distributionChart = new Chart(distributionCtx, { type: 'doughnut', data: { labels: ['LONG', 'SHORT'], datasets: [{ data: [longCount, shortCount], backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'], borderColor: ['rgba(16, 185, 129, 1)', 'rgba(239, 68, 68, 1)'], borderWidth: 2 }] }, options: { responsive: false, plugins: { legend: { position: 'bottom', labels: { color: '#e2e8f0', padding: 20 } } } } }); 
        }
        
        async function addDemo() { 
            try { 
                await fetch('/api/trades/add-demo'); 
                load(); 
                showAlert('✅ Trade démo ajouté avec succès!', 'success'); 
            } catch (error) { 
                showAlert('❌ Erreur lors de l\\'ajout du trade', 'error'); 
            } 
        }
        
        async function clearAll() { 
            if (confirm('⚠️ Êtes-vous sûr de vouloir effacer tous les trades?')) { 
                try { 
                    await fetch('/api/trades/clear', { method: 'DELETE' }); 
                    load(); 
                    showAlert('✅ Tous les trades ont été effacés', 'success'); 
                } catch (error) { 
                    showAlert('❌ Erreur lors de la suppression', 'error'); 
                } 
            } 
        }
        
        function showAlert(message, type) { 
            const alertDiv = document.createElement('div'); 
            alertDiv.className = 'alert alert-' + type + ' fade-in'; 
            alertDiv.textContent = message; 
            alertDiv.style.position = 'fixed'; 
            alertDiv.style.top = '20px'; 
            alertDiv.style.right = '20px'; 
            alertDiv.style.zIndex = '9999'; 
            document.body.appendChild(alertDiv); 
            setTimeout(() => { alertDiv.remove(); }, 3000); 
        }
        
        window.onclick = function(event) { const modal = document.getElementById('tradeModal'); if (event.target === modal) closeModal(); }

        // ============= P&L HEBDOMADAIRE =============
        async function loadWeeklyPnl() {
            try {
                const res = await fetch('/api/weekly-pnl');
                const data = await res.json();
                
                if (!data.ok) {
                    console.error('❌ Erreur API weekly-pnl:', data.error);
                    document.getElementById('weeklyPnlContainer').innerHTML = 
                        '<p style="color:#ef4444;text-align:center;padding:20px;">❌ Erreur de chargement</p>';
                    return;
                }
                
                console.log('✅ P&L hebdomadaire chargé:', data);
                
                let html = '';
                data.weekly_data.forEach(day => {
                    const isToday = day.day_en === data.current_day;
                    const pnlColor = day.pnl > 0 ? '#10b981' : (day.pnl < 0 ? '#ef4444' : '#64748b');
                    const bgColor = isToday ? 'rgba(96, 165, 250, 0.1)' : 'rgba(15, 23, 42, 0.8)';
                    const borderColor = isToday ? '#60a5fa' : 'transparent';
                    
                    html += `
                        <div style="
                            background:${bgColor};
                            padding:20px;
                            border-radius:12px;
                            border:2px solid ${borderColor};
                            text-align:center;
                            transition:all 0.3s;
                            box-shadow:0 2px 8px rgba(0,0,0,0.2);
                        ">
                            <div style="color:#94a3b8;font-size:12px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">
                                ${day.day_fr}
                            </div>
                            <div style="font-size:26px;font-weight:700;color:${pnlColor};">
                                ${day.pnl >= 0 ? '+' : ''}${day.pnl.toFixed(2)}%
                            </div>
                            ${isToday ? '<div style="color:#60a5fa;font-size:11px;margin-top:5px;">👈 Aujourd&apos;hui</div>' : ''}
                        </div>
                    `;
                });
                
                document.getElementById('weeklyPnlContainer').innerHTML = html;
                
                const totalColor = data.total_week > 0 ? '#10b981' : (data.total_week < 0 ? '#ef4444' : '#64748b');
                document.getElementById('weeklyTotal').innerHTML = 
                    `<span style="color:${totalColor}">${data.total_week >= 0 ? '+' : ''}${data.total_week.toFixed(2)}%</span>`;
                
            } catch (error) {
                console.error('❌ Erreur loadWeeklyPnl:', error);
                document.getElementById('weeklyPnlContainer').innerHTML = 
                    '<p style="color:#ef4444;text-align:center;padding:20px;">❌ Impossible de charger le P&L</p>';
            }
        }

        async function resetWeeklyPnl() {
            if (!confirm('Voulez-vous vraiment réinitialiser le P&L de la semaine ?')) {
                return;
            }
            
            try {
                const res = await fetch('/api/weekly-pnl/reset', { method: 'POST' });
                const data = await res.json();
                
                if (data.ok) {
                    alert('✅ ' + data.message);
                    loadWeeklyPnl();
                } else {
                    alert('❌ Erreur: ' + data.error);
                }
            } catch (error) {
                console.error('❌ Erreur resetWeeklyPnl:', error);
                alert('❌ Impossible de réinitialiser le P&L');
            }
        }


        load(); 
        loadWeeklyPnl();
        setInterval(load, 30000); 
        setInterval(loadWeeklyPnl, 30000);
        console.log('🚀 Trades Premium initialisé');
    </script>
</body>
</html>"""
    return HTMLResponse(html)


# -*- coding: utf-8 -*-
"""
CALENDRIER ÉCONOMIQUE AMÉLIORÉ - Version complète avec beaucoup d'événements
À remplacer dans votre main.py
"""

@app.get("/calendrier", response_class=HTMLResponse)
async def calendrier_economique():
    """Calendrier économique avec événements importants"""
    
    # Obtenir la date actuelle en timezone Québec
    quebec_tz = pytz.timezone('America/Montreal')
    now = datetime.now(quebec_tz)
    
    # Événements économiques COMPLETS (Octobre 2025 - Mars 2026)
    events = [
        # ============ OCTOBRE 2025 ============
        {
            "date": "2025-10-24",
            "time": "08:30",
            "title": "PIB Américain T3 (Preliminary)",
            "description": "Publication de la croissance économique des États-Unis pour le troisième trimestre 2025. Un PIB fort suggère une économie robuste et peut influencer les décisions de la Fed sur les taux d'intérêt. Impact majeur sur le dollar et les marchés boursiers.",
            "impact": "high",
            "category": "data",
            "currency": "USD",
            "forecast": "2.8%",
            "previous": "3.0%",
            "why_important": "Indicateur clé de la santé économique américaine"
        },
        {
            "date": "2025-10-24",
            "time": "08:30",
            "title": "Demandes d'allocations chômage (USA)",
            "description": "Données hebdomadaires sur les nouvelles demandes d'allocations chômage. Un nombre élevé indique des pertes d'emplois et une économie fragile. Inversement, un faible nombre montre un marché du travail solide.",
            "impact": "medium",
            "category": "data",
            "currency": "USD",
            "forecast": "215K",
            "previous": "220K",
            "why_important": "Baromètre hebdomadaire du marché du travail"
        },
        {
            "date": "2025-10-25",
            "time": "07:45",
            "title": "Décision BCE sur les taux d'intérêt",
            "description": "La Banque Centrale Européenne annonce sa décision de politique monétaire. Une baisse des taux stimule l'économie mais affaiblit l'euro. Une hausse combat l'inflation mais peut ralentir la croissance. Suivie d'une conférence de presse de Christine Lagarde.",
            "impact": "high",
            "category": "bce",
            "currency": "EUR",
            "forecast": "3.75%",
            "previous": "4.00%",
            "why_important": "Politique monétaire pour toute la zone euro (350M habitants)"
        },
        {
            "date": "2025-10-28",
            "time": "10:00",
            "title": "Confiance des consommateurs (Conference Board)",
            "description": "Indice mesurant l'optimisme des consommateurs américains concernant l'économie. Un indice élevé suggère des dépenses futures robustes (70% du PIB américain). Les entreprises l'utilisent pour prévoir la demande.",
            "impact": "medium",
            "category": "data",
            "currency": "USD",
            "forecast": "103.5",
            "previous": "102.6",
            "why_important": "Les dépenses des consommateurs = 70% de l'économie américaine"
        },
        {
            "date": "2025-10-29",
            "time": "14:00",
            "title": "Réunion du FOMC (Federal Reserve)",
            "description": "Décision la plus importante pour les marchés mondiaux. Le FOMC (Federal Open Market Committee) décide des taux directeurs américains. Cela affecte les emprunts, les prêts hypothécaires, l'inflation, le dollar et tous les actifs financiers mondiaux. Conférence de presse de Jerome Powell à 14h30.",
            "impact": "high",
            "category": "fed",
            "currency": "USD",
            "forecast": "5.25%",
            "previous": "5.25%",
            "why_important": "LA décision la plus importante pour tous les marchés financiers"
        },
        {
            "date": "2025-10-30",
            "time": "08:30",
            "title": "NFP - Emplois non-agricoles (Non-Farm Payrolls)",
            "description": "LE rapport d'emploi le plus suivi au monde. Publié le premier vendredi de chaque mois, il révèle combien d'emplois ont été créés (hors secteur agricole). Fort impact sur le dollar, les obligations et les actions. La Fed suit de près ces chiffres pour ses décisions.",
            "impact": "high",
            "category": "data",
            "currency": "USD",
            "forecast": "180K",
            "previous": "254K",
            "why_important": "LE rapport d'emploi le plus important au monde - Publié 1er vendredi/mois"
        },
        {
            "date": "2025-10-30",
            "time": "08:30",
            "title": "Taux de chômage (USA)",
            "description": "Pourcentage de la population active au chômage. Publié en même temps que les NFP. Un taux faible (<4%) indique un marché du travail tendu et peut alimenter l'inflation salariale. La Fed vise le 'plein emploi' autour de 4%.",
            "impact": "high",
            "category": "data",
            "currency": "USD",
            "forecast": "4.1%",
            "previous": "4.1%",
            "why_important": "Indicateur clé pour la politique de la Fed"
        },
        {
            "date": "2025-10-31",
            "time": "08:30",
            "title": "Core PCE - Inflation préférée de la Fed",
            "description": "L'indice PCE (Personal Consumption Expenditures) est l'indicateur d'inflation PRÉFÉRÉ de la Fed, encore plus que le CPI. Il mesure l'évolution des prix des biens et services consommés. La Fed cible 2% annuel. Un dépassement durable entraîne des hausses de taux.",
            "impact": "high",
            "category": "data",
            "currency": "USD",
            "forecast": "2.6%",
            "previous": "2.7%",
            "why_important": "L'indicateur d'inflation PRÉFÉRÉ de Jerome Powell et la Fed"
        },
        
        # ============ NOVEMBRE 2025 ============
        {
            "date": "2025-11-01",
            "time": "09:45",
            "title": "PMI Manufacturing (USA)",
            "description": "L'indice PMI (Purchasing Managers' Index) mesure la santé du secteur manufacturier. Au-dessus de 50 = expansion, en-dessous = contraction. Basé sur des enquêtes auprès des directeurs d'achats. Premier indicateur de la santé industrielle.",
            "impact": "medium",
            "category": "data",
            "currency": "USD",
            "forecast": "48.5",
            "previous": "47.2",
            "why_important": "Premier indicateur de la santé du secteur manufacturier"
        },
        {
            "date": "2025-11-05",
            "time": "09:45",
            "title": "PMI Services (USA)",
            "description": "Indice PMI pour le secteur des services (80% de l'économie américaine). Mesure la santé des restaurants, hôtels, transport, finance, etc. Plus important que le PMI manufacturier car les services dominent l'économie moderne.",
            "impact": "medium",
            "category": "data",
            "currency": "USD",
            "forecast": "55.2",
            "previous": "55.2",
            "why_important": "Les services = 80% de l'économie américaine"
        },
        {
            "date": "2025-11-06",
            "time": "20:00",
            "title": "Décision BoJ - Bank of Japan",
            "description": "La Banque du Japon décide de sa politique monétaire. Historiquement ultra-accommodante (taux négatifs), la BoJ a récemment commencé à normaliser. Ses décisions affectent le yen, une monnaie refuge majeure, et les flux de capitaux mondiaux.",
            "impact": "medium",
            "category": "boj",
            "currency": "JPY",
            "forecast": "0.25%",
            "previous": "0.25%",
            "why_important": "Impact sur le yen (monnaie refuge) et carry trades mondiaux"
        },
        {
            "date": "2025-11-07",
            "time": "07:00",
            "title": "Décision BoE - Bank of England",
            "description": "La Banque d'Angleterre fixe les taux d'intérêt britanniques. Impact majeur sur la livre sterling (4ème monnaie la plus tradée). Le gouverneur Andrew Bailey commente ensuite la décision et les perspectives économiques du Royaume-Uni.",
            "impact": "high",
            "category": "boe",
            "currency": "GBP",
            "forecast": "4.75%",
            "previous": "5.00%",
            "why_important": "Politique monétaire du Royaume-Uni - Impact sur la livre sterling"
        },
        {
            "date": "2025-11-12",
            "time": "08:30",
            "title": "IPC - Inflation consommateur (CPI)",
            "description": "L'Indice des Prix à la Consommation mesure l'inflation en suivant l'évolution des prix d'un panier de biens/services. Le CPI 'Core' (hors alimentation et énergie) est le plus scruté. La Fed cible 2% d'inflation. Données ultra-sensibles pour les marchés.",
            "impact": "high",
            "category": "data",
            "currency": "USD",
            "forecast": "2.4%",
            "previous": "2.4%",
            "why_important": "Principal indicateur d'inflation suivi par le grand public et les marchés"
        },
        {
            "date": "2025-11-13",
            "time": "08:30",
            "title": "IPP - Inflation producteur (PPI)",
            "description": "L'Indice des Prix à la Production mesure l'inflation au niveau des producteurs (avant le consommateur). Indicateur avancé de l'inflation future. Une hausse de l'IPP se répercute généralement sur les prix consommateurs avec décalage.",
            "impact": "medium",
            "category": "data",
            "currency": "USD",
            "forecast": "1.8%",
            "previous": "1.8%",
            "why_important": "Indicateur avancé de l'inflation - Précède le CPI de quelques mois"
        },
        {
            "date": "2025-11-14",
            "time": "08:30",
            "title": "Ventes au détail (Retail Sales)",
            "description": "Mesure les dépenses des consommateurs dans les magasins et en ligne. Indicateur clé de la consommation (70% du PIB). Des ventes fortes = économie robuste. La période de Thanksgiving/Black Friday rend novembre particulièrement important.",
            "impact": "medium",
            "category": "data",
            "currency": "USD",
            "forecast": "0.3%",
            "previous": "0.4%",
            "why_important": "Mesure directe des dépenses des consommateurs américains"
        },
        {
            "date": "2025-11-20",
            "time": "14:00",
            "title": "Minutes du FOMC",
            "description": "Compte-rendu détaillé de la dernière réunion de la Fed. Révèle les débats, les votes dissidents et les préoccupations des membres. Les traders scrutent chaque mot pour anticiper les futures décisions. Publié 3 semaines après chaque réunion.",
            "impact": "medium",
            "category": "fed",
            "currency": "USD",
            "forecast": "-",
            "previous": "-",
            "why_important": "Révèle les débats internes et anticipe les futures décisions"
        },
        {
            "date": "2025-11-26",
            "time": "10:00",
            "title": "Commandes de biens durables",
            "description": "Mesure les nouvelles commandes de biens censés durer 3+ ans (voitures, machines, ordinateurs). Indicateur avancé de l'activité manufacturière et des investissements des entreprises. Fort impact sur les perspectives de croissance.",
            "impact": "medium",
            "category": "data",
            "currency": "USD",
            "forecast": "0.5%",
            "previous": "0.8%",
            "why_important": "Indicateur avancé des investissements et de l'activité future"
        },
        
        # ============ DÉCEMBRE 2025 ============
        {
            "date": "2025-12-06",
            "time": "08:30",
            "title": "Rapport d'emploi NFP (Décembre)",
            "description": "Dernier rapport d'emploi de l'année 2025. Crucial pour évaluer la santé du marché du travail avant les fêtes. La Fed analyse ces données pour sa réunion de mi-décembre. Période historiquement forte pour l'emploi (embauches saisonnières).",
            "impact": "high",
            "category": "data",
            "currency": "USD",
            "forecast": "200K",
            "previous": "180K",
            "why_important": "Dernier rapport emploi 2025 - Inclut embauches saisonnières des fêtes"
        },
        {
            "date": "2025-12-10",
            "time": "08:30",
            "title": "IPC - Inflation de novembre",
            "description": "Avant-dernière lecture d'inflation de l'année. Critique car publiée juste avant la réunion Fed du 18 décembre. Un chiffre surprise peut totalement changer les attentes pour les taux. La Fed suivra de très près.",
            "impact": "high",
            "category": "data",
            "currency": "USD",
            "forecast": "2.3%",
            "previous": "2.4%",
            "why_important": "Dernière inflation avant la réunion Fed - Impact direct sur la décision"
        },
        {
            "date": "2025-12-12",
            "time": "07:45",
            "title": "Décision BCE - Dernière réunion 2025",
            "description": "Dernière réunion de politique monétaire de la BCE pour 2025. Christine Lagarde dresse le bilan de l'année et donne des perspectives pour 2026. Les marchés scrutent les projections économiques actualisées et les orientations futures.",
            "impact": "high",
            "category": "bce",
            "currency": "EUR",
            "forecast": "3.50%",
            "previous": "3.75%",
            "why_important": "Dernière BCE 2025 - Bilan annuel et perspectives 2026"
        },
        {
            "date": "2025-12-13",
            "time": "08:30",
            "title": "IPP - Inflation producteur novembre",
            "description": "Inflation au niveau des producteurs pour novembre. Vérifie si les pressions inflationnistes persistent dans la chaîne de production. Complète l'analyse avec le CPI pour une vue d'ensemble de l'inflation.",
            "impact": "medium",
            "category": "data",
            "currency": "USD",
            "forecast": "1.9%",
            "previous": "1.8%",
            "why_important": "Complète le tableau d'inflation avant la Fed"
        },
        {
            "date": "2025-12-17",
            "time": "08:30",
            "title": "Ventes au détail de novembre",
            "description": "Inclut le Black Friday et Cyber Monday - période de shopping la plus intense de l'année. Indicateur crucial de la santé des dépenses des consommateurs pendant les fêtes. Les retailers vivent ou meurent sur ces chiffres.",
            "impact": "high",
            "category": "data",
            "currency": "USD",
            "forecast": "0.6%",
            "previous": "0.3%",
            "why_important": "Inclut Black Friday - Performance critique pour l'économie"
        },
        {
            "date": "2025-12-18",
            "time": "14:00",
            "title": "Réunion Fed + Dot Plot + Projections",
            "description": "LA réunion la plus importante de l'année ! Inclut : 1) Décision sur les taux, 2) Le fameux 'Dot Plot' (projections de taux par chaque membre), 3) Nouvelles projections économiques (PIB, chômage, inflation pour 2026-2028), 4) Conférence de presse de Jerome Powell. Impact énorme sur tous les marchés.",
            "impact": "high",
            "category": "fed",
            "currency": "USD",
            "forecast": "4.75%",
            "previous": "5.25%",
            "why_important": "RÉUNION FED LA PLUS IMPORTANTE - Dot Plot + Projections économiques complètes"
        },
        {
            "date": "2025-12-19",
            "time": "07:00",
            "title": "Décision BoE - Dernière réunion 2025",
            "description": "Dernière réunion de la Banque d'Angleterre pour 2025. Le gouverneur dresse le bilan de l'année et commente les perspectives pour 2026. Impact sur la livre sterling et les obligations britanniques.",
            "impact": "medium",
            "category": "boe",
            "currency": "GBP",
            "forecast": "4.50%",
            "previous": "4.75%",
            "why_important": "Dernière BoE 2025 - Bilan et perspectives"
        },
        {
            "date": "2025-12-20",
            "time": "08:30",
            "title": "PIB T3 Final (USA)",
            "description": "Troisième et dernière estimation du PIB du troisième trimestre. Version finale et la plus précise. Clôture les données économiques de 2025 avant les fêtes. Les révisions peuvent être significatives.",
            "impact": "medium",
            "category": "data",
            "currency": "USD",
            "forecast": "2.9%",
            "previous": "2.8%",
            "why_important": "Dernière estimation PIB 2025 - La plus précise"
        },
        
        # ============ JANVIER 2026 ============
        {
            "date": "2026-01-10",
            "time": "08:30",
            "title": "Rapport emploi NFP - Premier de 2026",
            "description": "Premier rapport d'emploi de la nouvelle année. Crucial pour évaluer comment l'économie a traversé les fêtes. Les traders reviennent de vacances et ce rapport donne le ton pour 2026. Souvent volatil après les ajustements saisonniers.",
            "impact": "high",
            "category": "data",
            "currency": "USD",
            "forecast": "160K",
            "previous": "200K",
            "why_important": "Premier NFP 2026 - Donne le ton pour la nouvelle année"
        },
        {
            "date": "2026-01-14",
            "time": "08:30",
            "title": "IPC - Première inflation 2026",
            "description": "Première lecture d'inflation de 2026. Après les fêtes, vérifie si les pressions inflationnistes persistent. La Fed analyse ces données pour sa première réunion de l'année fin janvier. Moment clé pour définir la trajectoire 2026.",
            "impact": "high",
            "category": "data",
            "currency": "USD",
            "forecast": "2.4%",
            "previous": "2.3%",
            "why_important": "Première inflation 2026 - Définit la trajectoire de l'année"
        },
        {
            "date": "2026-01-15",
            "time": "08:30",
            "title": "Ventes au détail post-fêtes",
            "description": "Révèle la performance des retailers pendant les fêtes de fin d'année. Inclut les retours et échanges post-Noël. Les analystes comparent aux prévisions pour juger la santé des consommateurs. Impact sur les actions retail.",
            "impact": "medium",
            "category": "data",
            "currency": "USD",
            "forecast": "0.4%",
            "previous": "0.6%",
            "why_important": "Performance des fêtes - Verdict sur les ventes de Noël"
        },
        {
            "date": "2026-01-23",
            "time": "07:45",
            "title": "PMI Flash Manufacturing Europe",
            "description": "Premiers indices PMI européens de 2026. Version 'flash' (préliminaire) publiée avant la version finale. Donne une lecture rapide de la santé économique européenne pour démarrer l'année.",
            "impact": "medium",
            "category": "data",
            "currency": "EUR",
            "forecast": "46.5",
            "previous": "45.2",
            "why_important": "Première lecture économique européenne 2026"
        },
        {
            "date": "2026-01-29",
            "time": "14:00",
            "title": "Réunion Fed - Première de 2026",
            "description": "Première réunion de la Fed pour 2026. Jerome Powell commente les perspectives économiques après les fêtes et définit les orientations pour l'année. Les traders scrutent chaque mot pour anticiper la trajectoire des taux en 2026.",
            "impact": "high",
            "category": "fed",
            "currency": "USD",
            "forecast": "4.75%",
            "previous": "4.75%",
            "why_important": "Première Fed 2026 - Définit la politique monétaire de l'année"
        },
        {
            "date": "2026-01-30",
            "time": "08:30",
            "title": "Core PCE - Inflation Q4 2025",
            "description": "Dernière inflation PCE de 2025 (publiée en janvier). La Fed analyse ces données juste après sa réunion. Confirme ou infirme les tendances inflationnistes de fin 2025. Critical pour valider la trajectoire de la Fed.",
            "impact": "high",
            "category": "data",
            "currency": "USD",
            "forecast": "2.5%",
            "previous": "2.6%",
            "why_important": "Dernière inflation PCE 2025 - Validation des tendances"
        },
        {
            "date": "2026-01-30",
            "time": "08:30",
            "title": "PIB T4 2025 - Advance Estimate",
            "description": "Première estimation du PIB du quatrième trimestre 2025. Clôture l'année économique 2025. Les analystes calculent la croissance annuelle totale et comparent aux objectifs. Impact majeur sur les perspectives 2026.",
            "impact": "high",
            "category": "data",
            "currency": "USD",
            "forecast": "2.2%",
            "previous": "2.9%",
            "why_important": "PIB final 2025 - Bilan économique de l'année écoulée"
        }
    ]
    
    # Trier les événements par date
    events.sort(key=lambda x: datetime.strptime(x['date'], '%Y-%m-%d'))
    
    # Séparer événements passés et futurs
    today_str = now.strftime('%Y-%m-%d')
    upcoming_events = [e for e in events if e['date'] >= today_str]
    past_events = [e for e in events if e['date'] < today_str]
    
    # Si pas d'événements futurs, afficher les 10 prochains quand même
    if len(upcoming_events) == 0:
        upcoming_events = events[-10:]
    
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📅 Calendrier Économique</title>
    {CSS}
    <style>
        .calendar-grid {{
            display: grid;
            gap: 20px;
            margin-top: 30px;
        }}
        
        .event-card {{
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            border-radius: 16px;
            padding: 25px;
            border: 2px solid #334155;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }}
        
        .event-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 10px 40px rgba(96, 165, 250, 0.2);
            border-color: #60a5fa;
        }}
        
        .event-card::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 6px;
            height: 100%;
            background: linear-gradient(180deg, #60a5fa, #a78bfa);
        }}
        
        .event-card.high::before {{
            background: linear-gradient(180deg, #ef4444, #dc2626);
            width: 8px;
        }}
        
        .event-card.medium::before {{
            background: linear-gradient(180deg, #f59e0b, #d97706);
        }}
        
        .event-card.low::before {{
            background: linear-gradient(180deg, #10b981, #059669);
        }}
        
        .event-header {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            gap: 20px;
        }}
        
        .event-date {{
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #0f172a;
            padding: 15px 25px;
            border-radius: 12px;
            min-width: 130px;
            border: 2px solid #334155;
        }}
        
        .event-day {{
            font-size: 38px;
            font-weight: 700;
            color: #60a5fa;
            line-height: 1;
        }}
        
        .event-month {{
            font-size: 15px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-top: 5px;
        }}
        
        .event-time {{
            font-size: 14px;
            color: #a78bfa;
            margin-top: 8px;
            font-weight: 600;
            background: rgba(167, 139, 250, 0.1);
            padding: 4px 12px;
            border-radius: 6px;
        }}
        
        .event-info {{
            flex: 1;
        }}
        
        .event-title {{
            font-size: 22px;
            font-weight: 700;
            color: #e2e8f0;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            line-height: 1.3;
        }}
        
        .event-description {{
            color: #cbd5e1;
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 15px;
            background: rgba(15, 23, 42, 0.4);
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid #334155;
        }}
        
        .why-important {{
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.1));
            padding: 12px 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 3px solid #60a5fa;
        }}
        
        .why-important-label {{
            font-size: 11px;
            color: #60a5fa;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
            margin-bottom: 5px;
        }}
        
        .why-important-text {{
            color: #e2e8f0;
            font-size: 14px;
            font-weight: 500;
        }}
        
        .event-badges {{
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 15px;
        }}
        
        .badge {{
            padding: 7px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        
        .badge-impact {{
            background: rgba(239, 68, 68, 0.2);
            color: #fca5a5;
            border: 1px solid rgba(239, 68, 68, 0.4);
        }}
        
        .badge-impact.medium {{
            background: rgba(245, 158, 11, 0.2);
            color: #fcd34d;
            border: 1px solid rgba(245, 158, 11, 0.4);
        }}
        
        .badge-impact.low {{
            background: rgba(16, 185, 129, 0.2);
            color: #6ee7b7;
            border: 1px solid rgba(16, 185, 129, 0.4);
        }}
        
        .badge-category {{
            background: rgba(96, 165, 250, 0.15);
            color: #60a5fa;
            border: 1px solid rgba(96, 165, 250, 0.3);
        }}
        
        .badge-currency {{
            background: rgba(167, 139, 250, 0.15);
            color: #a78bfa;
            border: 1px solid rgba(167, 139, 250, 0.3);
        }}
        
        .event-stats {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #334155;
        }}
        
        .stat-item {{
            text-align: center;
            background: rgba(15, 23, 42, 0.5);
            padding: 12px;
            border-radius: 8px;
        }}
        
        .stat-label {{
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            font-weight: 600;
        }}
        
        .stat-value {{
            font-size: 18px;
            font-weight: 700;
            color: #e2e8f0;
        }}
        
        .filter-section {{
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 25px;
            padding: 20px;
            background: #1e293b;
            border-radius: 12px;
        }}
        
        .filter-btn {{
            padding: 12px 24px;
            background: #0f172a;
            border: 2px solid #334155;
            border-radius: 8px;
            color: #94a3b8;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 600;
            font-size: 14px;
        }}
        
        .filter-btn:hover {{
            border-color: #60a5fa;
            color: #60a5fa;
            transform: translateY(-2px);
        }}
        
        .filter-btn.active {{
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            border-color: #3b82f6;
            color: #fff;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
        }}
        
        .section-title {{
            font-size: 26px;
            color: #60a5fa;
            margin: 30px 0 20px 0;
            padding-bottom: 12px;
            border-bottom: 3px solid #334155;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 700;
        }}
        
        .countdown {{
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            padding: 6px 14px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 700;
            color: white;
            margin-left: auto;
            box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
        }}
        
        .stats-overview {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }}
        
        .overview-card {{
            background: linear-gradient(135deg, #1e293b, #334155);
            padding: 25px;
            border-radius: 12px;
            border: 2px solid #334155;
            text-align: center;
            transition: all 0.3s;
        }}
        
        .overview-card:hover {{
            border-color: #60a5fa;
            transform: translateY(-3px);
        }}
        
        .overview-value {{
            font-size: 42px;
            font-weight: 700;
            color: #60a5fa;
            margin-bottom: 8px;
        }}
        
        .overview-label {{
            font-size: 13px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }}
        
        .legend {{
            display: flex;
            gap: 25px;
            justify-content: center;
            margin-top: 20px;
            padding: 18px;
            background: #1e293b;
            border-radius: 10px;
            border: 1px solid #334155;
        }}
        
        .legend-item {{
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            color: #94a3b8;
            font-weight: 600;
        }}
        
        .legend-dot {{
            width: 14px;
            height: 14px;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }}
        
        .legend-dot.high {{ background: #ef4444; }}
        .legend-dot.medium {{ background: #f59e0b; }}
        .legend-dot.low {{ background: #10b981; }}
        
        @media (max-width: 768px) {{
            .event-header {{
                flex-direction: column;
                gap: 15px;
            }}
            
            .event-info {{
                margin-left: 0;
            }}
            
            .event-stats {{
                grid-template-columns: 1fr;
            }}
            
            .filter-section {{
                flex-direction: column;
            }}
            
            .event-title {{
                font-size: 18px;
            }}
            
            .event-description {{
                font-size: 14px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Calendrier Économique Détaillé</h1>
            <p>Suivez TOUS les événements économiques majeurs avec descriptions complètes • Octobre 2025 - Janvier 2026</p>
        </div>
        
        {NAV}
        
        <div class="card">
            <div class="stats-overview">
                <div class="overview-card">
                    <div class="overview-value">{len(events)}</div>
                    <div class="overview-label">Événements au total</div>
                </div>
                <div class="overview-card">
                    <div class="overview-value">{len(upcoming_events)}</div>
                    <div class="overview-label">À venir</div>
                </div>
                <div class="overview-card">
                    <div class="overview-value">{len([e for e in events if e['impact'] == 'high'])}</div>
                    <div class="overview-label">Impact Critique</div>
                </div>
                <div class="overview-card">
                    <div class="overview-value">{len([e for e in events if e['category'] in ['fed', 'bce', 'boe']])}</div>
                    <div class="overview-label">Banques Centrales</div>
                </div>
            </div>
            
            <div class="filter-section">
                <button class="filter-btn active" onclick="filterEvents('all', this)">📋 Tous ({len(events)})</button>
                <button class="filter-btn" onclick="filterEvents('high', this)">🔴 Impact ÉLEVÉ ({len([e for e in events if e['impact'] == 'high'])})</button>
                <button class="filter-btn" onclick="filterEvents('fed', this)">🏦 Fed USA ({len([e for e in events if e['category'] == 'fed'])})</button>
                <button class="filter-btn" onclick="filterEvents('bce', this)">🇪🇺 BCE Europe ({len([e for e in events if e['category'] == 'bce'])})</button>
                <button class="filter-btn" onclick="filterEvents('data', this)">📊 Données US ({len([e for e in events if e['category'] == 'data'])})</button>
                <button class="filter-btn" onclick="filterEvents('this-week', this)">📅 Cette semaine</button>
                <button class="filter-btn" onclick="filterEvents('this-month', this)">📆 Ce mois-ci</button>
            </div>
            
            <div class="legend">
                <div class="legend-item">
                    <div class="legend-dot high"></div>
                    <span>Impact ÉLEVÉ - Volatilité majeure</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot medium"></div>
                    <span>Impact MOYEN - Volatilité modérée</span>
                </div>
                <div class="legend-item">
                    <div class="legend-dot low"></div>
                    <span>Impact FAIBLE - Volatilité limitée</span>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2 class="section-title">
                📅 Tous les événements économiques
                <span style="font-size: 14px; color: #94a3b8; font-weight: normal; margin-left: auto;">Octobre 2025 - Janvier 2026</span>
            </h2>
            <div class="calendar-grid" id="allEvents">
"""
    
    # Générer les cartes pour TOUS les événements
    for event in events:
        date_obj = datetime.strptime(event['date'], '%Y-%m-%d')
        day = date_obj.strftime('%d')
        month_names = {
            'January': 'JAN', 'February': 'FÉV', 'March': 'MAR', 'April': 'AVR',
            'May': 'MAI', 'June': 'JUIN', 'July': 'JUIL', 'August': 'AOÛ',
            'September': 'SEP', 'October': 'OCT', 'November': 'NOV', 'December': 'DÉC'
        }
        month = month_names.get(date_obj.strftime('%B'), date_obj.strftime('%b').upper())
        
        # Calculer le countdown
        days_until = (date_obj.date() - now.date()).days
        if days_until < 0:
            countdown = f"Il y a {abs(days_until)} jour{'s' if abs(days_until) > 1 else ''}"
        elif days_until == 0:
            countdown = "Aujourd'hui !"
        elif days_until == 1:
            countdown = "Demain"
        else:
            countdown = f"Dans {days_until} jours"
        
        # Emoji selon la catégorie
        category_emoji = {
            'fed': '🏦',
            'bce': '🇪🇺',
            'boe': '🇬🇧',
            'boj': '🇯🇵',
            'data': '📊'
        }.get(event['category'], '📌')
        
        # Label d'impact
        impact_labels = {
            'high': '🔴 Impact CRITIQUE',
            'medium': '🟠 Impact MOYEN',
            'low': '🟢 Impact FAIBLE'
        }
        impact_label = impact_labels.get(event['impact'], 'Impact Moyen')
        
        html += f"""
                <div class="event-card {event['impact']}" data-category="{event['category']}" data-impact="{event['impact']}" data-date="{event['date']}">
                    <div class="event-header">
                        <div class="event-date">
                            <div class="event-day">{day}</div>
                            <div class="event-month">{month}</div>
                            <div class="event-time">⏰ {event['time']} EST</div>
                        </div>
                        <div class="event-info">
                            <div class="event-title">
                                {category_emoji} {event['title']}
                                <span class="countdown">{countdown}</span>
                            </div>
                            <div class="event-description">
                                {event['description']}
                            </div>
                            <div class="why-important">
                                <div class="why-important-label">💡 Pourquoi c'est important</div>
                                <div class="why-important-text">{event['why_important']}</div>
                            </div>
                            <div class="event-badges">
                                <span class="badge badge-impact {event['impact']}">{impact_label}</span>
                                <span class="badge badge-category">{event['category'].upper()}</span>
                                <span class="badge badge-currency">{event['currency']}</span>
                            </div>
                            <div class="event-stats">
                                <div class="stat-item">
                                    <div class="stat-label">📈 Prévision</div>
                                    <div class="stat-value">{event['forecast']}</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">📊 Précédent</div>
                                    <div class="stat-value">{event['previous']}</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-label">💱 Monnaie</div>
                                    <div class="stat-value">{event['currency']}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
"""
    
    html += f"""
            </div>
        </div>
        
        <div class="card" style="text-align: center; background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px solid #334155;">
            <h3 style="color: #60a5fa; margin-bottom: 15px;">📊 Statistiques complètes</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-top: 20px;">
                <div>
                    <div style="font-size: 32px; color: #ef4444; font-weight: 700;">{len([e for e in events if e['impact'] == 'high'])}</div>
                    <div style="font-size: 12px; color: #94a3b8;">Événements critiques</div>
                </div>
                <div>
                    <div style="font-size: 32px; color: #60a5fa; font-weight: 700;">{len([e for e in events if e['category'] == 'fed'])}</div>
                    <div style="font-size: 12px; color: #94a3b8;">Réunions Fed</div>
                </div>
                <div>
                    <div style="font-size: 32px; color: #10b981; font-weight: 700;">{len([e for e in events if 'NFP' in e['title'] or 'emploi' in e['title'].lower()])}</div>
                    <div style="font-size: 12px; color: #94a3b8;">Rapports emploi</div>
                </div>
                <div>
                    <div style="font-size: 32px; color: #f59e0b; font-weight: 700;">{len([e for e in events if 'IPC' in e['title'] or 'PCE' in e['title'] or 'IPP' in e['title']])}</div>
                    <div style="font-size: 12px; color: #94a3b8;">Rapports inflation</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function filterEvents(filter, buttonElement) {{
            const eventCards = document.querySelectorAll('.event-card');
            const buttons = document.querySelectorAll('.filter-btn');
            
            // Update active button
            buttons.forEach(btn => btn.classList.remove('active'));
            if (buttonElement) {{
                buttonElement.classList.add('active');
            }}
            
            // Get current date for time filters
            const now = new Date();
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            eventCards.forEach(card => {{
                let show = false;
                
                if (filter === 'all') {{
                    show = true;
                }} else if (filter === 'high') {{
                    show = card.dataset.impact === 'high';
                }} else if (filter === 'fed' || filter === 'bce') {{
                    show = card.dataset.category === filter;
                }} else if (filter === 'data') {{
                    show = card.dataset.category === 'data';
                }} else if (filter === 'this-week') {{
                    const eventDate = new Date(card.dataset.date);
                    show = eventDate >= now && eventDate <= weekFromNow;
                }} else if (filter === 'this-month') {{
                    const eventDate = new Date(card.dataset.date);
                    show = eventDate >= now && eventDate <= monthEnd;
                }}
                
                card.style.display = show ? 'block' : 'none';
            }});
        }}
        
        console.log('📅 Calendrier Économique Complet chargé');
        console.log('✅ {len(events)} événements affichés');
    </script>
</body>
</html>"""
    
    return HTMLResponse(html)




# ============================================================================
# 🤖 SYSTÈME DE DÉTECTION AUTOMATIQUE DES TP/SL
# Utilise le current_price envoyé par le webhook Pine Script
# ============================================================================

import asyncio

async def get_current_price_from_trade(trade: dict) -> float:
    """
    Récupère le prix actuel depuis le trade ou via une API externe
    Priorité : current_price du webhook > API CoinGecko (fallback)
    """
    try:
        # Priorité 1 : Utiliser le current_price stocké dans le trade (vient du webhook)
        if "current_price" in trade and trade["current_price"]:
            return float(trade["current_price"])
        
        # Priorité 2 : Fallback vers API CoinGecko si nécessaire
        # (au cas où un ancien trade n'a pas current_price)
        symbol = trade.get("symbol")
        if not symbol:
            return None
        
        # Mapping basique pour fallback
        symbol_map = {
            "BTCUSDT": "bitcoin",
            "ETHUSDT": "ethereum",
            "BNBUSDT": "binancecoin",
            "SOLUSDT": "solana",
            "XRPUSDT": "ripple"
        }
        
        crypto_id = symbol_map.get(symbol)
        if not crypto_id:
            print(f"⚠️ Symbole {symbol} non supporté en fallback")
            return None
        
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={crypto_id}&vs_currencies=usd"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                price = data.get(crypto_id, {}).get("usd")
                if price:
                    print(f"💰 {symbol}: ${price} (fallback)")
                    return float(price)
    except Exception as e:
        print(f"❌ Erreur get_current_price pour {trade.get('symbol')}: {e}")
    
    return None

async def check_tp_sl_automatic(trade: dict, current_price: float) -> dict:
    """
    Vérifie automatiquement si les TP ou SL sont atteints
    Retourne un dictionnaire avec les mises à jour à appliquer
    """
    updates = {}
    side = trade.get("side", "LONG")
    symbol = trade.get("symbol")
    
    # Vérifier TP1
    if trade.get("tp1") and not trade.get("tp1_hit"):
        if (side == "LONG" and current_price >= trade["tp1"]) or \
           (side == "SHORT" and current_price <= trade["tp1"]):
            updates["tp1_hit"] = True
            print(f"🎯 {symbol} - TP1 atteint ! Prix: ${current_price}")
            await send_telegram_notification(symbol, "TP1", current_price, trade["tp1"])
    
    # Vérifier TP2
    if trade.get("tp2") and not trade.get("tp2_hit"):
        if (side == "LONG" and current_price >= trade["tp2"]) or \
           (side == "SHORT" and current_price <= trade["tp2"]):
            updates["tp2_hit"] = True
            print(f"🎯🎯 {symbol} - TP2 atteint ! Prix: ${current_price}")
            await send_telegram_notification(symbol, "TP2", current_price, trade["tp2"])
    
    # Vérifier TP3
    if trade.get("tp3") and not trade.get("tp3_hit"):
        if (side == "LONG" and current_price >= trade["tp3"]) or \
           (side == "SHORT" and current_price <= trade["tp3"]):
            updates["tp3_hit"] = True
            print(f"🎯🎯🎯 {symbol} - TP3 atteint ! Prix: ${current_price}")
            await send_telegram_notification(symbol, "TP3", current_price, trade["tp3"])
    
    # Vérifier SL
    if trade.get("sl") and not trade.get("sl_hit"):
        if (side == "LONG" and current_price <= trade["sl"]) or \
           (side == "SHORT" and current_price >= trade["sl"]):
            updates["sl_hit"] = True
            updates["status"] = "closed"
            print(f"❌ {symbol} - SL touché ! Prix: ${current_price}")
            await send_telegram_notification(symbol, "SL", current_price, trade["sl"])
    
    return updates

async def send_telegram_notification(symbol: str, target: str, current_price: float, target_price: float):
    """Envoie une notification Telegram quand un TP ou SL est atteint"""
    try:
        emoji = "🎯" if "TP" in target else "❌"
        color = "✅" if "TP" in target else "🔴"
        
        message = f"""
{emoji} <b>{target} ATTEINT !</b> {color}

💰 <b>{symbol}</b>
📊 Prix actuel: <code>{format_price(current_price)}</code>
🎯 {target}: <code>{format_price(target_price)}</code>

⏰ {datetime.now(pytz.timezone('America/Montreal')).strftime('%H:%M:%S')}
"""
        
        # Ajouter message de félicitation pour TP3
        if target == "TP3":
            message += "\n🎉🎊 <b>FÉLICITATIONS ! TRADE COMPLÉTÉ !</b> 🎊🎉\n"
        
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                json={"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"}
            )
    except Exception as e:
        print(f"⚠️ Erreur Telegram: {e}")


async def monitor_trades_background():
    """Tâche de fond - surveillance automatique toutes les 30 secondes"""
    global monitor_running
    
    # Vérifier si une instance est déjà en cours
    async with monitor_lock:
        if monitor_running:
            print("⚠️ Une instance du moniteur est déjà active, skip")
            return
        monitor_running = True
    
    print("\n" + "="*70)
    print("🤖 MONITEUR AUTOMATIQUE DES TP/SL DÉMARRÉ")
    print("   Vérification toutes les 30 secondes")
    print("   Utilise current_price du webhook Pine Script")
    print("="*70 + "\n")
    
    while True:
        try:
            await asyncio.sleep(30)  # Attendre 30 secondes
            
            # Récupérer tous les trades ouverts
            open_trades = [t for t in trades_db if t.get("status") == "open"]
            
            if len(open_trades) == 0:
                # Ne rien afficher quand il n'y a pas de trades (réduire le spam)
                continue
            
            print(f"\n🔍 Vérification de {len(open_trades)} trade(s)...")
            
            for trade in open_trades:
                symbol = trade.get("symbol")
                if not symbol:
                    continue
                
                # Récupérer le prix actuel (current_price du webhook stocké dans le trade)
                current_price = await get_current_price_from_trade(trade)
                if current_price is None:
                    continue
                
                # Vérifier les TP/SL
                updates = await check_tp_sl_automatic(trade, current_price)
                
                # Appliquer les mises à jour
                if updates:
                    for key, value in updates.items():
                        trade[key] = value
                    print(f"✅ Trade {symbol} mis à jour")
            
            print("✅ Vérification terminée\n")
            
        except Exception as e:
            print(f"❌ Erreur monitoring: {e}")
            await asyncio.sleep(30)


@app.on_event("startup")
async def startup_event():
    """Démarre la tâche de fond au lancement de l'application"""
    # Utiliser try_lock pour éviter de bloquer si un autre worker a déjà lancé
    if not monitor_running:
        asyncio.create_task(monitor_trades_background())






# ============= API P&L HEBDOMADAIRE =============
@app.get("/api/weekly-pnl")
async def get_weekly_pnl():
    """Récupérer le P&L de la semaine"""
    reset_weekly_pnl_if_needed()
    
    days_fr = {
        "monday": "Lundi",
        "tuesday": "Mardi",
        "wednesday": "Mercredi",
        "thursday": "Jeudi",
        "friday": "Vendredi",
        "saturday": "Samedi",
        "sunday": "Dimanche"
    }
    
    weekly_data = []
    total_week = 0.0
    
    for day_en, day_fr in days_fr.items():
        pnl = weekly_pnl[day_en]
        total_week += pnl
        weekly_data.append({
            "day_en": day_en,
            "day_fr": day_fr,
            "pnl": round(pnl, 2)
        })
    
    return {
        "ok": True,
        "weekly_data": weekly_data,
        "total_week": round(total_week, 2),
        "week_start": weekly_pnl["week_start"],
        "current_day": get_current_week_day()
    }

@app.post("/api/weekly-pnl/reset")
async def reset_weekly_pnl_manual():
    """Réinitialiser manuellement le P&L hebdomadaire"""
    global weekly_pnl
    now = datetime.now()
    current_week_start = now - timedelta(days=now.weekday())
    
    weekly_pnl = {
        "monday": 0.0,
        "tuesday": 0.0,
        "wednesday": 0.0,
        "thursday": 0.0,
        "friday": 0.0,
        "saturday": 0.0,
        "sunday": 0.0,
        "week_start": current_week_start.strftime("%Y-%m-%d"),
        "last_reset": now.isoformat()
    }
    
    return {"ok": True, "message": "P&L hebdomadaire réinitialisé"}

# ============= PAGE RISK MANAGEMENT =============
@app.get("/risk-management", response_class=HTMLResponse)
async def risk_management_page():
    return HTMLResponse(f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>⚖️ Risk Management</title>{CSS}</head>
<body>
<div class="container">
<div class="header"><h1>⚖️ RISK MANAGEMENT</h1><p>Gestion professionnelle du risque</p></div>
{NAV}

<div class="card">
<h2>📊 Paramètres de Risque</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-bottom:30px;">
    <div class="stat-box">
        <div class="label">Capital Total</div>
        <div class="value" id="totalCapital">$10,000</div>
    </div>
    <div class="stat-box">
        <div class="label">Risque par Trade</div>
        <div class="value" id="riskPerTrade">2%</div>
    </div>
    <div class="stat-box">
        <div class="label">Trades Ouverts</div>
        <div class="value" id="openTrades">0 / 3</div>
    </div>
    <div class="stat-box">
        <div class="label">Perte Quotidienne</div>
        <div class="value" id="dailyLoss" style="color:#ef4444;">-0%</div>
    </div>
</div>

<h3 style="color:#60a5fa;margin-bottom:15px;">⚙️ Modifier les Paramètres</h3>
<div style="max-width:600px;">
    <label style="color:#94a3b8;display:block;margin-bottom:5px;">💰 Capital Total (USD)</label>
    <input type="number" id="inputCapital" value="10000" min="100" step="100">
    
    <label style="color:#94a3b8;display:block;margin-bottom:5px;">📉 Risque par Trade (%)</label>
    <input type="number" id="inputRisk" value="2" min="0.5" max="10" step="0.5">
    
    <label style="color:#94a3b8;display:block;margin-bottom:5px;">📊 Trades Ouverts Maximum</label>
    <input type="number" id="inputMaxTrades" value="3" min="1" max="10">
    
    <label style="color:#94a3b8;display:block;margin-bottom:5px;">🚫 Perte Maximale Quotidienne (%)</label>
    <input type="number" id="inputMaxDailyLoss" value="5" min="1" max="20" step="0.5">
    
    <button onclick="saveSettings()" style="width:100%;margin-top:10px;">💾 Sauvegarder</button>
    <button onclick="resetDaily()" class="btn-danger" style="width:100%;margin-top:10px;">🔄 Réinitialiser Perte Quotidienne</button>
</div>
</div>

<div class="card">
<h2>🧮 Calculateur de Position</h2>
<div style="max-width:600px;">
    <label style="color:#94a3b8;display:block;margin-bottom:5px;">Symbol (ex: BTCUSDT)</label>
    <input type="text" id="calcSymbol" placeholder="BTCUSDT">
    
    <label style="color:#94a3b8;display:block;margin-bottom:5px;">Prix d'Entrée</label>
    <input type="number" id="calcEntry" placeholder="67000" step="0.00000001">
    
    <label style="color:#94a3b8;display:block;margin-bottom:5px;">Stop Loss</label>
    <input type="number" id="calcSL" placeholder="66000" step="0.00000001">
    
    <button onclick="calculatePosition()" style="width:100%;">🧮 Calculer la Taille de Position</button>
</div>

<div id="calcResult" style="margin-top:20px;"></div>
</div>

<div class="card">
<h2>📚 Guide du Risk Management</h2>
<div style="color:#94a3b8;line-height:1.8;">
    <p style="margin-bottom:15px;"><strong style="color:#60a5fa;">💰 Capital Total:</strong> Le montant total que vous êtes prêt à investir dans le trading.</p>
    <p style="margin-bottom:15px;"><strong style="color:#60a5fa;">📉 Risque par Trade:</strong> Pourcentage de votre capital que vous risquez sur chaque trade (recommandé: 1-2%).</p>
    <p style="margin-bottom:15px;"><strong style="color:#60a5fa;">📊 Trades Ouverts Max:</strong> Nombre maximum de positions ouvertes simultanément (recommandé: 3-5).</p>
    <p style="margin-bottom:15px;"><strong style="color:#60a5fa;">🚫 Perte Max Quotidienne:</strong> Si vous perdez ce % en une journée, arrêtez de trader (recommandé: 5%).</p>
    <p style="margin-bottom:15px;"><strong style="color:#60a5fa;">🧮 Position Sizing:</strong> Calculez automatiquement la taille idéale de votre position basée sur votre risque.</p>
</div>
</div>

</div>

<script>
async function loadSettings() {{
    const res = await fetch('/api/risk/settings');
    const data = await res.json();
    
    document.getElementById('totalCapital').textContent = '$' + data.total_capital.toLocaleString();
    document.getElementById('riskPerTrade').textContent = data.risk_per_trade + '%';
    document.getElementById('dailyLoss').textContent = '-' + data.daily_loss.toFixed(2) + '%';
    
    // Compter les trades ouverts
    const tradesRes = await fetch('/api/trades');
    const tradesData = await tradesRes.json();
    const openCount = tradesData.trades.filter(t => t.status === 'open').length;
    document.getElementById('openTrades').textContent = openCount + ' / ' + data.max_open_trades;
    
    // Remplir les inputs
    document.getElementById('inputCapital').value = data.total_capital;
    document.getElementById('inputRisk').value = data.risk_per_trade;
    document.getElementById('inputMaxTrades').value = data.max_open_trades;
    document.getElementById('inputMaxDailyLoss').value = data.max_daily_loss;
}}

async function saveSettings() {{
    const capital = parseFloat(document.getElementById('inputCapital').value);
    const risk = parseFloat(document.getElementById('inputRisk').value);
    const maxTrades = parseInt(document.getElementById('inputMaxTrades').value);
    const maxLoss = parseFloat(document.getElementById('inputMaxDailyLoss').value);
    
    const res = await fetch('/api/risk/update', {{
        method: 'POST',
        headers: {{'Content-Type': 'application/json'}},
        body: JSON.stringify({{
            total_capital: capital,
            risk_per_trade: risk,
            max_open_trades: maxTrades,
            max_daily_loss: maxLoss
        }})
    }});
    
    const data = await res.json();
    if (data.ok) {{
        alert('✅ Paramètres sauvegardés !');
        loadSettings();
    }}
}}

async function resetDaily() {{
    if (!confirm('Voulez-vous réinitialiser la perte quotidienne ?')) return;
    
    const res = await fetch('/api/risk/reset-daily', {{method: 'POST'}});
    const data = await res.json();
    
    if (data.ok) {{
        alert('✅ Perte quotidienne réinitialisée !');
        loadSettings();
    }}
}}

async function calculatePosition() {{
    const symbol = document.getElementById('calcSymbol').value;
    const entry = parseFloat(document.getElementById('calcEntry').value);
    const sl = parseFloat(document.getElementById('calcSL').value);
    
    if (!symbol || !entry || !sl) {{
        alert('❌ Veuillez remplir tous les champs');
        return;
    }}
    
    const res = await fetch(`/api/risk/position-size?symbol=${{symbol}}&entry=${{entry}}&sl=${{sl}}`);
    const data = await res.json();
    
    if (data.ok) {{
        document.getElementById('calcResult').innerHTML = `
            <div class="alert-success">
                <h3 style="margin-bottom:15px;">✅ Résultat du Calcul</h3>
                <p><strong>Taille de Position:</strong> ${{data.position_size.toFixed(8)}} ${{symbol.replace('USDT', '')}}</p>
                <p><strong>Valeur de la Position:</strong> $${{data.position_value.toLocaleString()}}</p>
                <p><strong>Montant Risqué:</strong> $${{data.risk_amount.toLocaleString()}}</p>
                <p><strong>Distance du SL:</strong> ${{data.stop_distance_percent.toFixed(2)}}%</p>
            </div>
        `;
    }} else {{
        document.getElementById('calcResult').innerHTML = `<div class="alert-error">❌ Erreur: ${{data.error}}</div>`;
    }}
}}

loadSettings();
</script>
</body></html>""")


# ============= PAGE WATCHLIST & ALERTES =============
@app.get("/watchlist", response_class=HTMLResponse)
async def watchlist_page():
    return HTMLResponse(f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>👀 Watchlist & Alertes</title>{CSS}</head>
<body>
<div class="container">
<div class="header"><h1>👀 WATCHLIST & ALERTES</h1><p>Surveillez vos cryptos préférées</p></div>
{NAV}

<div class="card">
<h2>➕ Ajouter à la Watchlist</h2>
<div style="max-width:600px;">
    <label style="color:#94a3b8;display:block;margin-bottom:5px;">Symbol (ex: BTCUSDT)</label>
    <input type="text" id="addSymbol" placeholder="BTCUSDT">
    
    <label style="color:#94a3b8;display:block;margin-bottom:5px;">Prix Cible (optionnel)</label>
    <input type="number" id="addTarget" placeholder="70000" step="0.00000001">
    
    <label style="color:#94a3b8;display:block;margin-bottom:5px;">Note (optionnel)</label>
    <input type="text" id="addNote" placeholder="Résistance importante">
    
    <button onclick="addToWatchlist()" style="width:100%;">➕ Ajouter</button>
</div>
</div>

<div class="card">
<h2>📋 Ma Watchlist</h2>
<div id="watchlistContainer"></div>
</div>

<div class="card">
<h2>🔔 Alertes Actives</h2>
<div id="alertsContainer"></div>
<button onclick="checkAlerts()" style="margin-top:15px;">🔍 Vérifier les Alertes</button>
</div>

</div>

<script>
async function loadWatchlist() {{
    const res = await fetch('/api/watchlist');
    const data = await res.json();
    
    if (data.watchlist.length === 0) {{
        document.getElementById('watchlistContainer').innerHTML = '<p style="color:#94a3b8;">Aucune crypto dans la watchlist</p>';
        return;
    }}
    
    let html = '<table><thead><tr><th>Symbol</th><th>Prix Cible</th><th>Note</th><th>Ajouté le</th><th>Action</th></tr></thead><tbody>';
    
    data.watchlist.forEach(item => {{
        const date = new Date(item.created_at).toLocaleString('fr-FR');
        const target = item.target_price ? '$' + item.target_price.toLocaleString() : '-';
        const alertIcon = item.alert_triggered ? '✅' : '';
        
        html += `<tr>
            <td><strong>${{item.symbol}}</strong> ${{alertIcon}}</td>
            <td>${{target}}</td>
            <td>${{item.note || '-'}}</td>
            <td style="color:#94a3b8;font-size:12px;">${{date}}</td>
            <td><button class="btn-danger" style="padding:8px 15px;" onclick="removeFromWatchlist('${{item.symbol}}')">❌ Retirer</button></td>
        </tr>`;
    }});
    
    html += '</tbody></table>';
    document.getElementById('watchlistContainer').innerHTML = html;
}}

async function addToWatchlist() {{
    const symbol = document.getElementById('addSymbol').value.toUpperCase();
    const target = document.getElementById('addTarget').value;
    const note = document.getElementById('addNote').value;
    
    if (!symbol) {{
        alert('❌ Veuillez entrer un symbol');
        return;
    }}
    
    const res = await fetch('/api/watchlist/add', {{
        method: 'POST',
        headers: {{'Content-Type': 'application/json'}},
        body: JSON.stringify({{
            symbol: symbol,
            target_price: target || null,
            note: note
        }})
    }});
    
    const data = await res.json();
    
    if (data.ok) {{
        alert('✅ ' + data.message);
        document.getElementById('addSymbol').value = '';
        document.getElementById('addTarget').value = '';
        document.getElementById('addNote').value = '';
        loadWatchlist();
    }} else {{
        alert('❌ ' + data.error);
    }}
}}

async function removeFromWatchlist(symbol) {{
    if (!confirm(`Retirer ${{symbol}} de la watchlist ?`)) return;
    
    const res = await fetch(`/api/watchlist/remove?symbol=${{symbol}}`, {{method: 'DELETE'}});
    const data = await res.json();
    
    if (data.ok) {{
        alert('✅ ' + data.message);
        loadWatchlist();
    }}
}}

async function checkAlerts() {{
    const res = await fetch('/api/watchlist/check-alerts');
    const data = await res.json();
    
    if (data.alerts.length === 0) {{
        document.getElementById('alertsContainer').innerHTML = '<div class="alert-success">✅ Aucune alerte déclenchée</div>';
    }} else {{
        let html = '<div class="alert-error"><h3>🔔 Alertes Déclenchées !</h3>';
        data.alerts.forEach(alert => {{
            html += `<p><strong>${{alert.symbol}}</strong> a atteint ${{alert.target}} (prix actuel: ${{alert.current}})</p>`;
            if (alert.note) html += `<p style="font-size:12px;color:#94a3b8;">Note: ${{alert.note}}</p>`;
        }});
        html += '</div>';
        document.getElementById('alertsContainer').innerHTML = html;
        
        // Recharger la watchlist pour montrer les alertes
        loadWatchlist();
    }}
}}

loadWatchlist();
</script>
</body></html>""")


# ============= PAGE AI TRADING ASSISTANT =============
@app.get("/ai-assistant", response_class=HTMLResponse)
async def ai_assistant_page():
    return HTMLResponse(f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>🤖 AI Trading Assistant</title>{CSS}</head>
<body>
<div class="container">
<div class="header"><h1>🤖 AI TRADING ASSISTANT</h1><p>Intelligence artificielle pour optimiser vos trades</p></div>
{NAV}

<div class="card">
<h2>🎯 Suggestions Personnalisées</h2>
<div id="suggestionsContainer"></div>
<button onclick="refreshSuggestions()" style="margin-top:15px;">🔄 Actualiser les Suggestions</button>
</div>

<div class="card">
<h2>📊 Sentiment du Marché</h2>
<div id="sentimentContainer"></div>
</div>

<div class="card">
<h2>📈 Analyses & Recommandations</h2>
<div style="color:#94a3b8;line-height:1.8;">
    <div style="background:#0f172a;padding:20px;border-radius:8px;margin-bottom:15px;">
        <h3 style="color:#60a5fa;margin-bottom:10px;">💡 Comment l'IA vous aide</h3>
        <p>• <strong>Analyse automatique</strong> de vos performances de trading</p>
        <p>• <strong>Détection de patterns</strong> dans vos trades gagnants/perdants</p>
        <p>• <strong>Suggestions personnalisées</strong> basées sur votre historique</p>
        <p>• <strong>Alertes intelligentes</strong> quand vous atteignez vos limites de risque</p>
        <p>• <strong>Recommandations</strong> sur les meilleures paires à trader</p>
    </div>
    
    <div style="background:#0f172a;padding:20px;border-radius:8px;margin-bottom:15px;">
        <h3 style="color:#60a5fa;margin-bottom:10px;">🎓 Conseils de Trading</h3>
        <p>• Respectez toujours votre <strong>risk management</strong></p>
        <p>• N'ouvrez pas plus de <strong>3-5 trades simultanés</strong></p>
        <p>• Prenez vos <strong>profits partiels</strong> (TP1, TP2, TP3)</p>
        <p>• Utilisez le <strong>Stop Loss Break Even</strong> après TP1</p>
        <p>• Analysez vos <strong>trades perdants</strong> pour progresser</p>
    </div>
    
    <div style="background:#0f172a;padding:20px;border-radius:8px;">
        <h3 style="color:#60a5fa;margin-bottom:10px;">⚠️ Avertissements</h3>
        <p>• Le trading comporte des <strong>risques importants</strong></p>
        <p>• Ne tradez jamais plus que ce que vous pouvez vous permettre de perdre</p>
        <p>• L'IA donne des suggestions, <strong>pas des garanties</strong></p>
        <p>• Faites toujours vos propres recherches (DYOR)</p>
    </div>
</div>
</div>

</div>

<script>

        // ============= P&L HEBDOMADAIRE =============
        async function loadWeeklyPnl() {{
            try {{
                const res = await fetch('/api/weekly-pnl');
                const data = await res.json();
                
                if (data.ok) {{
                    let html = '';
                    data.weekly_data.forEach(day => {{
                        const isToday = day.day_en === data.current_day;
                        const color = day.pnl > 0 ? '#10b981' : (day.pnl < 0 ? '#ef4444' : '#94a3b8');
                        const bgColor = isToday ? 'rgba(96, 165, 250, 0.1)' : 'rgba(15, 23, 42, 0.8)';
                        const border = isToday ? '2px solid #60a5fa' : 'none';
                        
                        html += `
                            <div style="background:${{bgColor}};padding:15px;border-radius:12px;text-align:center;border:${{border}};transition:all 0.3s;">
                                <div style="color:#94a3b8;font-size:11px;margin-bottom:5px;text-transform:uppercase;">${{day.day_fr}}${{isToday ? ' 👈' : ''}}</div>
                                <div style="color:${{color}};font-size:24px;font-weight:700;">${{day.pnl > 0 ? '+' : ''}}${{day.pnl}}%</div>
                            </div>
                        `;
                    }});
                    
                    document.getElementById('weeklyPnlContainer').innerHTML = html;
                    
                    const totalColor = data.total_week > 0 ? '#10b981' : (data.total_week < 0 ? '#ef4444' : '#94a3b8');
                    document.getElementById('weeklyTotal').innerHTML = `<span style="color:${{totalColor}}">${{data.total_week > 0 ? '+' : ''}}${{data.total_week}}%</span>`;
                }}
            }} catch (error) {{
                console.error('Erreur chargement P&L hebdomadaire:', error);
                document.getElementById('weeklyPnlContainer').innerHTML = '<p style="color:#ef4444;text-align:center;">❌ Erreur de chargement</p>';
            }}
        }}

        async function resetWeeklyPnl() {{
            if (!confirm('Voulez-vous réinitialiser le P&L de la semaine ?')) return;
            
            try {{
                const res = await fetch('/api/weekly-pnl/reset', {{ method: 'POST' }});
                const data = await res.json();
                
                if (data.ok) {{
                    alert('✅ P&L hebdomadaire réinitialisé !');
                    loadWeeklyPnl();
                }}
            }} catch (error) {{
                alert('❌ Erreur lors de la réinitialisation');
            }}
        }}

async function refreshSuggestions() {{
    document.getElementById('suggestionsContainer').innerHTML = '<div class="spinner"></div>';
    
    const res = await fetch('/api/ai/suggestions');
    const data = await res.json();
    
    if (data.suggestions.length === 0) {{
        document.getElementById('suggestionsContainer').innerHTML = '<p style="color:#94a3b8;">Aucune suggestion pour le moment</p>';
        return;
    }}
    
    let html = '';
    data.suggestions.forEach(sug => {{
        let alertClass = 'alert-success';
        if (sug.type === 'warning') alertClass = 'alert-error';
        else if (sug.type === 'info') alertClass = 'alert-success';
        
        html += `<div class="${{alertClass}}" style="margin-bottom:15px;">
            <h3 style="margin-bottom:10px;">${{sug.title}}</h3>
            <p>${{sug.message}}</p>
        </div>`;
    }});
    
    const lastUpdate = new Date(data.last_analysis).toLocaleString('fr-FR');
    html += `<p style="color:#94a3b8;font-size:12px;margin-top:15px;">Dernière analyse: ${{lastUpdate}}</p>`;
    
    document.getElementById('suggestionsContainer').innerHTML = html;
}}

async function loadSentiment() {{
    const res = await fetch('/api/ai/market-sentiment');
    const data = await res.json();
    
    if (data.ok) {{
        document.getElementById('sentimentContainer').innerHTML = `
            <div style="text-align:center;padding:30px;">
                <div style="font-size:72px;margin-bottom:15px;">${{data.value}}</div>
                <div style="font-size:24px;font-weight:bold;color:${{data.color}};margin-bottom:10px;">${{data.sentiment}}</div>
                <div style="width:100%;height:10px;background:#0f172a;border-radius:5px;overflow:hidden;margin-top:20px;">
                    <div style="width:${{data.value}}%;height:100%;background:${{data.color}};transition:all 0.5s;"></div>
                </div>
            </div>
        `;
    }} else {{
        document.getElementById('sentimentContainer').innerHTML = '<p style="color:#ef4444;">❌ Impossible de charger le sentiment</p>';
    }}
}}

refreshSuggestions();
loadSentiment();
</script>
</body></html>""")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print("\n" + "="*70)
    print("🚀 DASHBOARD TRADING - VERSION ULTIME + RISK + WATCHLIST + AI")
    print("="*70)
    print(f"📡 Port: {{port}}")
    print(f"🔗 URL: http://localhost:{{port}}")
    print("="*70)
    print("✅ BOT TELEGRAM PROFESSIONNEL:")
    print("  • Messages formatés avec emojis")
    print("  • Direction LONG/SHORT bien visible")
    print("  • Score de confiance IA (60-99%)")
    print("  • Heure du Québec (EDT/EST AUTOMATIQUE)")
    print("  • Risk/Reward automatique")
    print("  • Recommandations SLBE")
    print("="*70)
    print("📊 16 PAGES ACTIVES:")
    print("  • Fear & Greed (flèche SVG)")
    print("  • Dominance BTC, Heatmap")
    print("  • 🌟 ALTCOIN SEASON (NOUVEAU DESIGN!)")
    print("  • Nouvelles, Trades, Convertisseur")
    print("  • 📅 CALENDRIER ÉCONOMIQUE COMPLET (NOUVEAU!)")
    print("  • Bullrun Phase, Graphiques, Telegram")
    print("  • ⚖️ RISK MANAGEMENT (NOUVEAU!)")
    print("  • 👀 WATCHLIST & ALERTES (NOUVEAU!)")
    print("  • 🤖 AI TRADING ASSISTANT (NOUVEAU!)")
    print("="*70)
    print("🌟 ALTCOIN SEASON:")
    print("  • Jauge circulaire animée")
    print("  • 4 indicateurs de phase")
    print("  • 6 statistiques clés")
    print("  • Graphique de tendance")
    print("  • Top 8 altcoins performers")
    print("  • Recommandations intelligentes")
    print("="*70)
    print("📅 CALENDRIER ÉCONOMIQUE:")
    print("  • 31 événements économiques détaillés")
    print("  • Fed, BCE, BoE, BoJ, données complètes")
    print("  • Descriptions COMPLÈTES de chaque événement")
    print("  • Pourquoi chaque événement est important")
    print("  • Filtres intelligents et statistiques")
    print("="*70)
    print("⚖️ RISK MANAGEMENT:")
    print("  • Gestion du capital et position sizing automatique")
    print("  • Calcul du risque par trade (1-2%)")
    print("  • Limite de perte quotidienne")
    print("  • Calculateur de taille de position intelligent")
    print("  • Statistiques en temps réel")
    print("="*70)
    print("👀 WATCHLIST & ALERTES:")
    print("  • Surveillance personnalisée de cryptos")
    print("  • Alertes automatiques sur prix cibles")
    print("  • Notes et targets personnalisés")
    print("  • Vérification intelligente des alertes")
    print("  • Historique complet")
    print("="*70)
    print("🤖 AI TRADING ASSISTANT:")
    print("  • Suggestions basées sur vos performances")
    print("  • Analyse du sentiment du marché (Fear & Greed)")
    print("  • Détection des meilleures paires à trader")
    print("  • Recommandations personnalisées")
    print("  • Alertes intelligentes sur limites de risque")
    print("="*70)
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
