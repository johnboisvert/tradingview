"""
🤖 AI CRYPTO COACH - Module séparé
Analyse ton profil de trader et détecte tes patterns
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
from typing import List, Dict
from collections import defaultdict

# Router FastAPI
router = APIRouter()

# ============================================================================
# CODE AI CRYPTO COACH
# ============================================================================

class AICryptoCoach:
    def __init__(self):
        self.min_trades = 5  # Minimum de trades pour analyse
    
    def analyze_trader_profile(self, trades: List[Dict]) -> Dict:
        """Analyser le profil du trader"""
        
        if len(trades) < self.min_trades:
            return {
                "error": f"Pas assez de trades pour l'analyse (minimum: {self.min_trades})",
                "trades_count": len(trades)
            }
        
        # Calculs de base
        total_trades = len(trades)
        winning_trades = sum(1 for t in trades if t.get('profit', 0) > 0)
        losing_trades = sum(1 for t in trades if t.get('profit', 0) < 0)
        
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
        
        # Profit/Loss total
        total_profit = sum(t.get('profit', 0) for t in trades if t.get('profit', 0) > 0)
        total_loss = sum(abs(t.get('profit', 0)) for t in trades if t.get('profit', 0) < 0)
        
        # Risk/Reward Ratio
        avg_win = total_profit / winning_trades if winning_trades > 0 else 0
        avg_loss = total_loss / losing_trades if losing_trades > 0 else 0
        rr_ratio = avg_win / avg_loss if avg_loss > 0 else 0
        
        # Détection des patterns
        patterns = self._detect_patterns(trades)
        
        # Profil du trader
        profile = self._determine_profile(win_rate, rr_ratio, patterns)
        
        # Score global
        score = self._calculate_score(win_rate, rr_ratio, patterns)
        
        return {
            "total_trades": total_trades,
            "winning_trades": winning_trades,
            "losing_trades": losing_trades,
            "win_rate": round(win_rate, 1),
            "avg_win": round(avg_win, 2),
            "avg_loss": round(avg_loss, 2),
            "rr_ratio": round(rr_ratio, 2),
            "total_pnl": round(total_profit - total_loss, 2),
            "patterns": patterns,
            "profile": profile,
            "score": score,
            "recommendations": self._get_recommendations(profile, patterns)
        }
    
    def _detect_patterns(self, trades: List[Dict]) -> Dict[str, bool]:
        """Détecter les patterns de trading"""
        patterns = {}
        
        # Pattern 1: FOMO (achats près des tops)
        high_buy_entries = sum(1 for t in trades if t.get('entry_position', 0) > 0.8)
        patterns['fomo'] = high_buy_entries > len(trades) * 0.3
        
        # Pattern 2: Paper Hands (ventes prématurées)
        early_exits = sum(1 for t in trades if 0 < t.get('profit', 0) < t.get('target', 0) * 0.5)
        patterns['paper_hands'] = early_exits > len(trades) * 0.3
        
        # Pattern 3: No Stop Loss
        no_sl = sum(1 for t in trades if t.get('stop_loss') is None)
        patterns['no_stop_loss'] = no_sl > len(trades) * 0.5
        
        # Pattern 4: Overtrading
        patterns['overtrading'] = len(trades) > 50  # Plus de 50 trades
        
        # Pattern 5: Revenge Trading (trades après loss)
        revenge_trades = 0
        for i in range(1, len(trades)):
            if trades[i-1].get('profit', 0) < 0 and trades[i].get('size', 0) > trades[i-1].get('size', 0) * 1.5:
                revenge_trades += 1
        patterns['revenge_trading'] = revenge_trades > len(trades) * 0.2
        
        return patterns
    
    def _determine_profile(self, win_rate: float, rr_ratio: float, patterns: Dict) -> Dict:
        """Déterminer le profil du trader"""
        
        # Profiles possibles
        if win_rate >= 60 and rr_ratio >= 2.0:
            return {
                "type": "Expert",
                "emoji": "🏆",
                "description": "Trader discipliné avec excellent win rate et R:R"
            }
        elif win_rate >= 50 and rr_ratio >= 1.5:
            return {
                "type": "Intermédiaire",
                "emoji": "📈",
                "description": "Bon trader, continue comme ça !"
            }
        elif patterns.get('fomo') or patterns.get('revenge_trading'):
            return {
                "type": "Émotionnel",
                "emoji": "😰",
                "description": "Tu trades trop avec tes émotions"
            }
        elif patterns.get('paper_hands'):
            return {
                "type": "Impatient",
                "emoji": "⏰",
                "description": "Tu sors trop tôt de tes positions"
            }
        else:
            return {
                "type": "Débutant",
                "emoji": "🌱",
                "description": "En apprentissage, continue !"
            }
    
    def _calculate_score(self, win_rate: float, rr_ratio: float, patterns: Dict) -> int:
        """Calculer le score global /100"""
        score = 0
        
        # Win rate (40 points max)
        score += min(win_rate * 0.67, 40)
        
        # R:R Ratio (30 points max)
        score += min(rr_ratio * 15, 30)
        
        # Patterns négatifs (-5 points chacun)
        negative_patterns = sum(1 for v in patterns.values() if v)
        score -= negative_patterns * 5
        
        return max(0, min(100, int(score)))
    
    def _get_recommendations(self, profile: Dict, patterns: Dict) -> List[str]:
        """Générer des recommandations personnalisées"""
        recs = []
        
        if patterns.get('fomo'):
            recs.append("❌ Évite d'acheter sur les pics - attends un pullback")
        
        if patterns.get('paper_hands'):
            recs.append("💎 Tiens tes positions jusqu'au target - sois patient")
        
        if patterns.get('no_stop_loss'):
            recs.append("🛑 TOUJOURS mettre un stop loss - protège ton capital")
        
        if patterns.get('overtrading'):
            recs.append("⏸️ Réduis le nombre de trades - qualité > quantité")
        
        if patterns.get('revenge_trading'):
            recs.append("😌 Ne trade jamais après une perte - prends une pause")
        
        if not recs:
            recs.append("✅ Continue comme ça, ton trading est solide !")
        
        return recs

# Instance globale
coach = AICryptoCoach()

# ============================================================================
# ROUTES AI CRYPTO COACH
# ============================================================================

@router.get("/ai-crypto-coach", response_class=HTMLResponse)
async def ai_coach_page(request: Request):
    """Page AI Crypto Coach"""
    
    # Note: Ici tu devras connecter à ta vraie DB de trades
    # Pour l'instant, on affiche juste le message "pas assez de trades"
    
    html = '''
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🤖 AI Crypto Coach</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', system-ui, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .header {
                text-align: center;
                margin-bottom: 40px;
            }
            
            .header h1 {
                font-size: 3em;
                margin-bottom: 10px;
            }
            
            .warning-box {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 30px;
                text-align: center;
                border: 2px solid rgba(255,193,7,0.5);
            }
            
            .warning-box h2 {
                font-size: 2em;
                margin-bottom: 20px;
            }
            
            .warning-box p {
                font-size: 1.2em;
                line-height: 1.6;
            }
            
            .profile-card {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 30px;
                margin: 20px 0;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            
            .stat-box {
                background: rgba(255,255,255,0.1);
                padding: 20px;
                border-radius: 10px;
                text-align: center;
            }
            
            .stat-value {
                font-size: 2em;
                font-weight: bold;
                margin: 10px 0;
            }
            
            .recommendations {
                margin-top: 30px;
            }
            
            .rec-item {
                background: rgba(255,255,255,0.1);
                padding: 15px;
                margin: 10px 0;
                border-radius: 10px;
                font-size: 1.1em;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 AI Crypto Coach</h1>
                <p>Analyse de ton profil de trader</p>
            </div>
            
            <div class="warning-box">
                <h2>⚠️ Pas assez de trades pour l'analyse</h2>
                <p>Il te faut minimum <strong>5 trades</strong> dans ton historique pour que je puisse analyser ton profil.</p>
                <p style="margin-top: 20px;">Va faire quelques trades et reviens me voir ! 📊</p>
            </div>
            
            <div class="profile-card" style="display: none;" id="profile">
                <!-- Profile sera affiché ici quand il y aura assez de trades -->
            </div>
        </div>
    </body>
    </html>
    '''
    
    return html

@router.get("/api/ai-coach/analyze")
async def analyze_profile(request: Request):
    """API pour analyser le profil trader"""
    try:
        # TODO: Récupérer les trades de la DB
        # Pour l'instant, retourne juste l'erreur
        trades = []  # Remplacer par vraie query DB
        
        analysis = coach.analyze_trader_profile(trades)
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
