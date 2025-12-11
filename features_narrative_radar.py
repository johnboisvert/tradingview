"""
🎯 NARRATIVE RADAR - Module séparé
Détecte les tendances et narratives crypto en temps réel
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
import httpx
from collections import defaultdict
from typing import List, Dict

# Router FastAPI
router = APIRouter()

# ============================================================================
# CODE NARRATIVE RADAR
# ============================================================================

class NarrativeRadar:
    def __init__(self):
        self.narratives = {
            "AI": {
                "keywords": ["ai", "artificial intelligence", "machine learning", "neural"],
                "coins": ["FET", "AGIX", "OCEAN", "NMR"],
                "description": "Intelligence Artificielle & Machine Learning"
            },
            "DeFi": {
                "keywords": ["defi", "lending", "yield", "liquidity", "amm"],
                "coins": ["AAVE", "UNI", "COMP", "CRV"],
                "description": "Finance Décentralisée"
            },
            "RWA": {
                "keywords": ["rwa", "real world asset", "tokenization", "bonds"],
                "coins": ["ONDO", "POLYX", "RIO"],
                "description": "Real World Assets"
            },
            "Gaming": {
                "keywords": ["gaming", "metaverse", "nft", "play to earn"],
                "coins": ["IMX", "GALA", "SAND", "AXS"],
                "description": "Gaming & Metaverse"
            },
            "L2": {
                "keywords": ["layer 2", "l2", "rollup", "scaling"],
                "coins": ["ARB", "OP", "MATIC", "STRK"],
                "description": "Layer 2 Solutions"
            },
            "Memes": {
                "keywords": ["meme", "doge", "shiba", "pepe"],
                "coins": ["DOGE", "SHIB", "PEPE", "WIF"],
                "description": "Memecoins"
            },
            "Infrastructure": {
                "keywords": ["oracle", "bridge", "middleware", "data"],
                "coins": ["LINK", "API3", "BAND"],
                "description": "Infrastructure & Oracles"
            },
            "Privacy": {
                "keywords": ["privacy", "anonymous", "mixer", "confidential"],
                "coins": ["XMR", "ZEC", "SCRT"],
                "description": "Privacy & Confidentialité"
            }
        }
        
        self.momentum_scores = {}
        self.trending_coins = defaultdict(int)
    
    async def scan_news(self) -> Dict:
        """Scanner les news crypto via CryptoPanic API"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # API CryptoPanic (gratuite, 100 req/jour)
                url = "https://cryptopanic.com/api/v1/posts/"
                params = {
                    "auth_token": "free",  # Token gratuit
                    "public": "true",
                    "kind": "news"
                }
                
                response = await client.get(url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    return await self._analyze_news(data.get("results", []))
                else:
                    return self._get_mock_data()
                    
        except Exception as e:
            print(f"Erreur scan news: {e}")
            return self._get_mock_data()
    
    async def _analyze_news(self, news: List[Dict]) -> Dict:
        """Analyser les news et calculer les scores"""
        narrative_mentions = defaultdict(int)
        narrative_changes = defaultdict(float)
        coin_mentions = defaultdict(int)
        
        for article in news:
            title = article.get("title", "").lower()
            
            # Compter les mentions par narrative
            for narrative, data in self.narratives.items():
                for keyword in data["keywords"]:
                    if keyword in title:
                        narrative_mentions[narrative] += 1
                
                # Compter les coins mentionnés
                for coin in data["coins"]:
                    if coin.lower() in title:
                        coin_mentions[coin] += 1
        
        # Calculer le momentum (changement vs 24h précédentes)
        for narrative in self.narratives:
            current = narrative_mentions[narrative]
            previous = self.momentum_scores.get(narrative, 0)
            
            if previous > 0:
                change = ((current - previous) / previous) * 100
            else:
                change = 0
            
            narrative_changes[narrative] = round(change, 1)
            self.momentum_scores[narrative] = current
        
        # Top trending coins
        trending = sorted(coin_mentions.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "mentions": dict(narrative_mentions),
            "changes": dict(narrative_changes),
            "trending": trending,
            "total_news": len(news)
        }
    
    def _get_mock_data(self) -> Dict:
        """Données de démo si API échoue"""
        return {
            "mentions": {k: 0 for k in self.narratives},
            "changes": {k: 0.0 for k in self.narratives},
            "trending": [],
            "total_news": 0
        }
    
    def get_status(self, mentions: int) -> tuple:
        """Retourner le statut et l'emoji"""
        if mentions == 0:
            return "😴 QUIET", "quiet"
        elif mentions < 5:
            return "🟢 EMERGING", "emerging"
        elif mentions < 15:
            return "🔥 HOT", "hot"
        else:
            return "🚀 TRENDING", "trending"

# Instance globale
radar = NarrativeRadar()

# ============================================================================
# ROUTES NARRATIVE RADAR
# ============================================================================

@router.get("/narrative-radar", response_class=HTMLResponse)
async def narrative_radar_page(request: Request):
    """Page Narrative Radar"""
    
    html = f'''
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🎯 Narrative Radar - Crypto Trends</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: 'Segoe UI', system-ui, sans-serif;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                color: white;
                min-height: 100vh;
                padding: 20px;
            }}
            
            .container {{
                max-width: 1400px;
                margin: 0 auto;
            }}
            
            .header {{
                text-align: center;
                margin-bottom: 40px;
            }}
            
            .header h1 {{
                font-size: 3em;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }}
            
            .header p {{
                font-size: 1.2em;
                opacity: 0.9;
            }}
            
            .scan-btn {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 15px 40px;
                font-size: 1.2em;
                border-radius: 50px;
                cursor: pointer;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                transition: transform 0.2s;
            }}
            
            .scan-btn:hover {{
                transform: translateY(-2px);
            }}
            
            .narratives-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }}
            
            .narrative-card {{
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 20px;
                border: 1px solid rgba(255,255,255,0.2);
                transition: transform 0.3s;
            }}
            
            .narrative-card:hover {{
                transform: translateY(-5px);
            }}
            
            .narrative-header {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }}
            
            .narrative-title {{
                font-size: 1.5em;
                font-weight: bold;
            }}
            
            .status {{
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 0.9em;
                font-weight: bold;
            }}
            
            .status.quiet {{
                background: rgba(108, 117, 125, 0.3);
            }}
            
            .status.emerging {{
                background: rgba(40, 167, 69, 0.3);
            }}
            
            .status.hot {{
                background: rgba(255, 193, 7, 0.3);
            }}
            
            .status.trending {{
                background: rgba(220, 53, 69, 0.3);
            }}
            
            .mentions {{
                font-size: 2em;
                font-weight: bold;
                margin: 10px 0;
            }}
            
            .change {{
                font-size: 1.2em;
                margin: 5px 0;
            }}
            
            .change.positive {{
                color: #4caf50;
            }}
            
            .change.negative {{
                color: #f44336;
            }}
            
            .coins {{
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid rgba(255,255,255,0.2);
            }}
            
            .coin-tag {{
                display: inline-block;
                background: rgba(255,255,255,0.2);
                padding: 5px 10px;
                border-radius: 10px;
                margin: 5px;
                font-size: 0.9em;
            }}
            
            .loading {{
                text-align: center;
                padding: 40px;
                font-size: 1.5em;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 Narrative Radar</h1>
                <p>Dashboard temps réel des narratives crypto</p>
                <button class="scan-btn" onclick="scanNow()">🔍 Scanner Maintenant</button>
            </div>
            
            <div id="narratives" class="narratives-grid">
                <div class="loading">Cliquez sur "Scanner" pour démarrer...</div>
            </div>
        </div>
        
        <script>
            async function scanNow() {{
                document.getElementById('narratives').innerHTML = '<div class="loading">🔄 Scan en cours...</div>';
                
                try {{
                    const response = await fetch('/api/narrative-radar/scan');
                    const data = await response.json();
                    displayNarratives(data);
                }} catch (error) {{
                    console.error('Erreur:', error);
                    document.getElementById('narratives').innerHTML = '<div class="loading">❌ Erreur lors du scan</div>';
                }}
            }}
            
            function displayNarratives(data) {{
                const narratives = {repr(radar.narratives)};
                const container = document.getElementById('narratives');
                
                let html = '';
                
                for (const [name, info] of Object.entries(narratives)) {{
                    const mentions = data.mentions[name] || 0;
                    const change = data.changes[name] || 0;
                    const status = getStatus(mentions);
                    
                    html += `
                        <div class="narrative-card">
                            <div class="narrative-header">
                                <div class="narrative-title">${{name}}</div>
                                <div class="status ${{status.class}}">${{status.emoji}} ${{status.text}}</div>
                            </div>
                            <div class="mentions">Mentions: ${{mentions}}</div>
                            <div class="change ${{change >= 0 ? 'positive' : 'negative'}}">
                                Avg Change 24h: ${{change >= 0 ? '+' : ''}}${{change}}%
                            </div>
                            <div class="coins">
                                ${{info.coins.map(coin => `<span class="coin-tag">${{coin}}</span>`).join('')}}
                            </div>
                        </div>
                    `;
                }}
                
                container.innerHTML = html;
            }}
            
            function getStatus(mentions) {{
                if (mentions === 0) return {{emoji: '😴', text: 'QUIET', class: 'quiet'}};
                if (mentions < 5) return {{emoji: '🟢', text: 'EMERGING', class: 'emerging'}};
                if (mentions < 15) return {{emoji: '🔥', text: 'HOT', class: 'hot'}};
                return {{emoji: '🚀', text: 'TRENDING', class: 'trending'}};
            }}
        </script>
    </body>
    </html>
    '''
    
    return html

@router.get("/api/narrative-radar/scan")
async def scan_narratives():
    """API pour scanner les narratives"""
    try:
        results = await radar.scan_news()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
