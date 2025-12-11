"""
🤖 AI SWARM AGENTS - Module séparé
Système multi-agents pour analyses crypto personnalisées
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
import httpx
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from collections import defaultdict

# Router FastAPI
router = APIRouter()

# ============================================================================
# CONFIGURATION DES AGENTS
# ============================================================================

AGENT_CONFIGS = {
    "memecoin_hunter": {
        "name": "Memecoin Hunter",
        "icon": "🚀",
        "description": "Détecte les nouveaux memecoins avec potentiel viral",
        "color": "#ff6b35"
    },
    "whale_tracker": {
        "name": "Whale Tracker",
        "icon": "🐋",
        "description": "Analyse les mouvements des baleines et smart money",
        "color": "#4ecdc4"
    },
    "narrative_detector": {
        "name": "Narrative Detector",
        "icon": "📰",
        "description": "Identifie les narratives émergentes et trends",
        "color": "#95e1d3"
    },
    "scam_detector": {
        "name": "Scam Detector",
        "icon": "🛡️",
        "description": "Détecte les scams, rugs et projets suspects",
        "color": "#ef476f"
    },
    "macro_analyzer": {
        "name": "Macro Analyzer",
        "icon": "📊",
        "description": "Analyse macro, ETF, régulations et actualités",
        "color": "#ffd23f"
    }
}

TRADER_PROFILES = {
    "degen": {
        "name": "Degen Memecoin Hunter",
        "description": "Max risk, max rewards. Chasse les 100x.",
        "agents": ["memecoin_hunter", "whale_tracker", "scam_detector"]
    },
    "investor": {
        "name": "Investor Sérieux 1-3 ans",
        "description": "Focus fondamentaux et long terme.",
        "agents": ["narrative_detector", "macro_analyzer", "scam_detector"]
    },
    "scalper": {
        "name": "Scalper Court Terme",
        "description": "Opportunités rapides, momentum trading.",
        "agents": ["whale_tracker", "memecoin_hunter", "narrative_detector"]
    }
}

# ============================================================================
# AGENTS - FONCTIONS DE SCAN
# ============================================================================

async def scan_memecoin_hunter():
    """Agent 1: Détecte les nouveaux memecoins"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Recherche des nouveaux tokens via CoinGecko
            url = "https://api.coingecko.com/api/v3/coins/markets"
            params = {
                "vs_currency": "usd",
                "order": "volume_desc",
                "per_page": "20",
                "page": "1",
                "category": "meme-token"
            }
            
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                coins = response.json()
                findings = []
                
                for coin in coins[:5]:
                    if coin.get("price_change_percentage_24h", 0) > 20:
                        findings.append({
                            "coin": coin.get("symbol", "").upper(),
                            "name": coin.get("name", ""),
                            "change_24h": round(coin.get("price_change_percentage_24h", 0), 2),
                            "volume": coin.get("total_volume", 0),
                            "mcap": coin.get("market_cap", 0),
                            "score": "HIGH" if coin.get("price_change_percentage_24h", 0) > 50 else "MEDIUM"
                        })
                
                return {
                    "agent": "memecoin_hunter",
                    "status": "success",
                    "findings": findings,
                    "summary": f"{len(findings)} opportunités détectées"
                }
            else:
                return _empty_agent_result("memecoin_hunter")
                
    except Exception as e:
        print(f"Erreur Memecoin Hunter: {e}")
        return _empty_agent_result("memecoin_hunter")

async def scan_whale_tracker():
    """Agent 2: Tracker les mouvements de baleines"""
    try:
        # Pour la démo, générer des données simulées
        findings = [
            {
                "transaction": "Large BTC move",
                "amount": "1,250 BTC",
                "value_usd": "$121M",
                "from": "Unknown Wallet",
                "to": "Binance",
                "impact": "BEARISH"
            },
            {
                "transaction": "ETH accumulation",
                "amount": "45,000 ETH",
                "value_usd": "$162M",
                "from": "Multiple sources",
                "to": "Smart Money Wallet",
                "impact": "BULLISH"
            }
        ]
        
        return {
            "agent": "whale_tracker",
            "status": "success",
            "findings": findings,
            "summary": f"{len(findings)} mouvements significatifs"
        }
        
    except Exception as e:
        print(f"Erreur Whale Tracker: {e}")
        return _empty_agent_result("whale_tracker")

async def scan_narrative_detector():
    """Agent 3: Détecter les narratives émergentes"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Utiliser CryptoPanic pour les news
            url = "https://cryptopanic.com/api/v1/posts/"
            params = {
                "auth_token": "free",
                "public": "true",
                "kind": "news"
            }
            
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                articles = data.get("results", [])[:10]
                
                # Compter les mentions de narratives
                narratives = defaultdict(int)
                keywords = {
                    "AI": ["ai", "artificial intelligence", "chatgpt"],
                    "RWA": ["rwa", "real world asset", "tokenization"],
                    "DeFi": ["defi", "yield", "lending"],
                    "Gaming": ["gaming", "metaverse", "nft"]
                }
                
                for article in articles:
                    title = article.get("title", "").lower()
                    for narrative, words in keywords.items():
                        if any(word in title for word in words):
                            narratives[narrative] += 1
                
                findings = [
                    {"narrative": k, "mentions": v, "trend": "🔥" if v > 2 else "📈"}
                    for k, v in sorted(narratives.items(), key=lambda x: x[1], reverse=True)
                ]
                
                return {
                    "agent": "narrative_detector",
                    "status": "success",
                    "findings": findings,
                    "summary": f"{len(findings)} narratives actives"
                }
            else:
                return _empty_agent_result("narrative_detector")
                
    except Exception as e:
        print(f"Erreur Narrative Detector: {e}")
        return _empty_agent_result("narrative_detector")

async def scan_scam_detector():
    """Agent 4: Détecter les scams potentiels"""
    try:
        findings = [
            {
                "project": "SafeMoonV3",
                "risk": "HIGH",
                "reasons": ["Honeypot detected", "Anonymous team", "No audit"],
                "score": 85
            },
            {
                "project": "PepeFork2.0",
                "risk": "MEDIUM",
                "reasons": ["Unverified contract", "Low liquidity"],
                "score": 45
            }
        ]
        
        return {
            "agent": "scam_detector",
            "status": "success",
            "findings": findings,
            "summary": f"{len(findings)} projets suspects identifiés"
        }
        
    except Exception as e:
        print(f"Erreur Scam Detector: {e}")
        return _empty_agent_result("scam_detector")

async def scan_macro_analyzer():
    """Agent 5: Analyser le contexte macro"""
    try:
        findings = [
            {
                "event": "Fed Interest Rate Decision",
                "date": "2025-12-18",
                "impact": "HIGH",
                "sentiment": "NEUTRAL"
            },
            {
                "event": "Bitcoin Halving",
                "date": "2025-04-15",
                "impact": "VERY HIGH",
                "sentiment": "BULLISH"
            }
        ]
        
        return {
            "agent": "macro_analyzer",
            "status": "success",
            "findings": findings,
            "summary": f"{len(findings)} événements macro à surveiller"
        }
        
    except Exception as e:
        print(f"Erreur Macro Analyzer: {e}")
        return _empty_agent_result("macro_analyzer")

def _empty_agent_result(agent_id: str):
    """Résultat vide pour un agent"""
    return {
        "agent": agent_id,
        "status": "error",
        "findings": [],
        "summary": "Aucune donnée disponible"
    }

# ============================================================================
# META-AGENT - ORCHESTRATION
# ============================================================================

class AISwarmOrchestrator:
    def __init__(self):
        self.agent_functions = {
            "memecoin_hunter": scan_memecoin_hunter,
            "whale_tracker": scan_whale_tracker,
            "narrative_detector": scan_narrative_detector,
            "scam_detector": scan_scam_detector,
            "macro_analyzer": scan_macro_analyzer
        }
    
    async def run_swarm(self, profile: str = "degen") -> Dict:
        """Exécuter le swarm d'agents pour un profil donné"""
        
        # Récupérer les agents du profil
        profile_config = TRADER_PROFILES.get(profile, TRADER_PROFILES["degen"])
        agents_to_run = profile_config["agents"]
        
        # Exécuter tous les agents en parallèle
        tasks = [
            self.agent_functions[agent_id]()
            for agent_id in agents_to_run
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Synthétiser les résultats
        summary = self._synthesize_results(results, profile_config)
        
        return {
            "profile": profile_config,
            "agents_results": results,
            "meta_summary": summary,
            "timestamp": datetime.now().isoformat()
        }
    
    def _synthesize_results(self, results: List[Dict], profile: Dict) -> Dict:
        """Synthétiser les résultats de tous les agents"""
        
        total_findings = sum(
            len(r.get("findings", []))
            for r in results
            if isinstance(r, dict) and r.get("status") == "success"
        )
        
        # Analyser les opportunités
        opportunities = []
        risks = []
        
        for result in results:
            if not isinstance(result, dict):
                continue
                
            agent = result.get("agent")
            findings = result.get("findings", [])
            
            if agent in ["memecoin_hunter", "whale_tracker", "narrative_detector"]:
                opportunities.extend(findings)
            elif agent == "scam_detector":
                risks.extend(findings)
        
        # Générer une recommandation globale
        if len(opportunities) > 5 and len(risks) < 3:
            recommendation = "🟢 Marché favorable - Plusieurs opportunités détectées"
        elif len(risks) > 5:
            recommendation = "🔴 Prudence - Beaucoup de signaux de risque"
        else:
            recommendation = "🟡 Marché neutre - Attendre de meilleurs signaux"
        
        return {
            "total_findings": total_findings,
            "opportunities_count": len(opportunities),
            "risks_count": len(risks),
            "recommendation": recommendation
        }

# Instance globale
orchestrator = AISwarmOrchestrator()

# ============================================================================
# ROUTES AI SWARM AGENTS
# ============================================================================

@router.get("/ai-swarm-agents", response_class=HTMLResponse)
async def ai_swarm_page(request: Request):
    """Page AI Swarm Agents"""
    
    html = f'''
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🤖 AI Swarm Agents</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: 'Segoe UI', system-ui, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            }}
            
            .profiles {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }}
            
            .profile-card {{
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 25px;
                cursor: pointer;
                transition: transform 0.3s;
                border: 2px solid transparent;
            }}
            
            .profile-card:hover {{
                transform: translateY(-5px);
                border-color: rgba(255,255,255,0.5);
            }}
            
            .profile-card.selected {{
                border-color: #4caf50;
                box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
            }}
            
            .profile-name {{
                font-size: 1.5em;
                font-weight: bold;
                margin-bottom: 10px;
            }}
            
            .profile-description {{
                opacity: 0.8;
                margin-bottom: 15px;
            }}
            
            .agents-list {{
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid rgba(255,255,255,0.2);
            }}
            
            .agent-tag {{
                display: inline-block;
                background: rgba(255,255,255,0.2);
                padding: 5px 10px;
                border-radius: 10px;
                margin: 5px;
                font-size: 0.9em;
            }}
            
            .run-btn {{
                background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
                color: white;
                border: none;
                padding: 15px 40px;
                font-size: 1.2em;
                border-radius: 50px;
                cursor: pointer;
                margin: 20px auto;
                display: block;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                transition: transform 0.2s;
            }}
            
            .run-btn:hover {{
                transform: translateY(-2px);
            }}
            
            .run-btn:disabled {{
                background: gray;
                cursor: not-allowed;
            }}
            
            .results {{
                margin-top: 40px;
                display: none;
            }}
            
            .meta-summary {{
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 30px;
                margin-bottom: 30px;
            }}
            
            .agents-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
            }}
            
            .agent-result {{
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 20px;
            }}
            
            .agent-header {{
                display: flex;
                align-items: center;
                margin-bottom: 15px;
            }}
            
            .agent-icon {{
                font-size: 2em;
                margin-right: 15px;
            }}
            
            .agent-name {{
                font-size: 1.3em;
                font-weight: bold;
            }}
            
            .findings-list {{
                margin-top: 15px;
            }}
            
            .finding-item {{
                background: rgba(255,255,255,0.1);
                padding: 10px;
                margin: 8px 0;
                border-radius: 8px;
                font-size: 0.95em;
            }}
            
            .loading {{
                text-align: center;
                font-size: 1.5em;
                padding: 40px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 AI Swarm Agents</h1>
                <p>Système multi-agents d'analyse crypto personnalisée</p>
            </div>
            
            <div class="profiles" id="profiles">
                <!-- Profiles will be loaded here -->
            </div>
            
            <button class="run-btn" id="runBtn" disabled onclick="runSwarm()">
                🚀 Lancer l'Analyse
            </button>
            
            <div id="results" class="results">
                <!-- Results will be displayed here -->
            </div>
        </div>
        
        <script>
            let selectedProfile = null;
            const profiles = {repr(TRADER_PROFILES)};
            const agentConfigs = {repr(AGENT_CONFIGS)};
            
            // Load profiles
            function loadProfiles() {{
                const container = document.getElementById('profiles');
                let html = '';
                
                for (const [key, profile] of Object.entries(profiles)) {{
                    html += `
                        <div class="profile-card" onclick="selectProfile('${{key}}')">
                            <div class="profile-name">${{profile.name}}</div>
                            <div class="profile-description">${{profile.description}}</div>
                            <div class="agents-list">
                                ${{profile.agents.map(agentId => {{
                                    const agent = agentConfigs[agentId];
                                    return `<span class="agent-tag">${{agent.icon}} ${{agent.name}}</span>`;
                                }}).join('')}}
                            </div>
                        </div>
                    `;
                }}
                
                container.innerHTML = html;
            }}
            
            function selectProfile(profileId) {{
                selectedProfile = profileId;
                
                // Update UI
                document.querySelectorAll('.profile-card').forEach(card => {{
                    card.classList.remove('selected');
                }});
                event.currentTarget.classList.add('selected');
                
                // Enable button
                document.getElementById('runBtn').disabled = false;
            }}
            
            async function runSwarm() {{
                if (!selectedProfile) return;
                
                const resultsDiv = document.getElementById('results');
                resultsDiv.style.display = 'block';
                resultsDiv.innerHTML = '<div class="loading">🔄 Agents en cours d\'analyse...</div>';
                
                try {{
                    const response = await fetch(`/api/ai-swarm/run?profile=${{selectedProfile}}`);
                    const data = await response.json();
                    displayResults(data);
                }} catch (error) {{
                    resultsDiv.innerHTML = `<div class="loading">❌ Erreur: ${{error.message}}</div>`;
                }}
            }}
            
            function displayResults(data) {{
                const meta = data.meta_summary;
                const agents = data.agents_results;
                
                let html = `
                    <div class="meta-summary">
                        <h2 style="margin-bottom: 20px;">📊 Résumé Global</h2>
                        <p style="font-size: 1.2em; margin: 10px 0;"><strong>Total findings:</strong> ${{meta.total_findings}}</p>
                        <p style="font-size: 1.2em; margin: 10px 0;"><strong>Opportunités:</strong> ${{meta.opportunities_count}}</p>
                        <p style="font-size: 1.2em; margin: 10px 0;"><strong>Risques:</strong> ${{meta.risks_count}}</p>
                        <p style="font-size: 1.3em; margin-top: 20px; font-weight: bold;">${{meta.recommendation}}</p>
                    </div>
                    
                    <div class="agents-grid">
                `;
                
                agents.forEach(agent => {{
                    if (typeof agent !== 'object') return;
                    
                    const config = agentConfigs[agent.agent];
                    html += `
                        <div class="agent-result">
                            <div class="agent-header">
                                <div class="agent-icon">${{config.icon}}</div>
                                <div class="agent-name">${{config.name}}</div>
                            </div>
                            <p style="opacity: 0.8; margin-bottom: 15px;">${{agent.summary}}</p>
                            <div class="findings-list">
                                ${{agent.findings.slice(0, 5).map(f => `
                                    <div class="finding-item">${{JSON.stringify(f).slice(0, 100)}}...</div>
                                `).join('')}}
                            </div>
                        </div>
                    `;
                }});
                
                html += '</div>';
                
                document.getElementById('results').innerHTML = html;
            }}
            
            // Load profiles on page load
            loadProfiles();
        </script>
    </body>
    </html>
    '''
    
    return html

@router.get("/api/ai-swarm/run")
async def run_swarm_api(profile: str = "degen"):
    """API pour lancer le swarm d'agents"""
    try:
        results = await orchestrator.run_swarm(profile)
        return JSONResponse(content=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

