"""
📈 ALTSEASON COPILOT PRO - Module séparé
Détecte les rotations de capital et les phases du marché crypto
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
import httpx
from datetime import datetime, timedelta
from typing import Dict, List

# Router FastAPI
router = APIRouter()

# ============================================================================
# CODE ALTSEASON COPILOT PRO
# ============================================================================

class AltseasonCopilot:
    def __init__(self):
        self.phases = {
            "accumulation": {
                "name": "Accumulation",
                "description": "BTC flat, alts flat - Temps d'acheter",
                "emoji": "🟢"
            },
            "btc_pump": {
                "name": "BTC Pump",
                "description": "BTC monte, alts baissent - Hold cash ou BTC",
                "emoji": "🔵"
            },
            "consolidation": {
                "name": "Consolidation",
                "description": "BTC consolide, alts commencent - Prépare-toi",
                "emoji": "🟡"
            },
            "alt_season": {
                "name": "Alt Season",
                "description": "BTC flat, ALTS EXPLOSENT - ALL IN ALTS",
                "emoji": "🚀"
            },
            "distribution": {
                "name": "Distribution",
                "description": "Tout baisse - VENDS TOUT",
                "emoji": "🔴"
            }
        }
    
    async def analyze_market(self) -> Dict:
        """Analyser le marché en temps réel"""
        try:
            # Récupérer les données via CoinGecko (gratuit, 50 req/min)
            async with httpx.AsyncClient(timeout=10.0) as client:
                # BTC
                btc_data = await self._get_coin_data(client, "bitcoin")
                
                # ETH
                eth_data = await self._get_coin_data(client, "ethereum")
                
                # Total Altcoins market cap
                alts_data = await self._get_alts_marketcap(client)
                
                # BTC Dominance
                dominance = await self._get_btc_dominance(client)
            
            # Calculer la phase actuelle
            phase = self._determine_phase(btc_data, eth_data, alts_data, dominance)
            
            # Rotation de capital
            rotation = self._analyze_capital_rotation(btc_data, eth_data, alts_data)
            
            return {
                "btc": btc_data,
                "eth": eth_data,
                "alts": alts_data,
                "dominance": dominance,
                "phase": phase,
                "rotation": rotation,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Erreur analyse: {e}")
            return self._get_mock_data()
    
    async def _get_coin_data(self, client: httpx.AsyncClient, coin_id: str) -> Dict:
        """Récupérer les données d'une crypto"""
        try:
            url = f"https://api.coingecko.com/api/v3/coins/{coin_id}"
            params = {
                "localization": "false",
                "tickers": "false",
                "community_data": "false",
                "developer_data": "false"
            }
            
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                market_data = data.get("market_data", {})
                
                return {
                    "symbol": data.get("symbol", "").upper(),
                    "price": market_data.get("current_price", {}).get("usd", 0),
                    "change_24h": market_data.get("price_change_percentage_24h", 0),
                    "change_7d": market_data.get("price_change_percentage_7d", 0),
                    "volume_24h": market_data.get("total_volume", {}).get("usd", 0),
                    "market_cap": market_data.get("market_cap", {}).get("usd", 0)
                }
            else:
                return self._empty_coin_data()
                
        except Exception as e:
            print(f"Erreur {coin_id}: {e}")
            return self._empty_coin_data()
    
    async def _get_alts_marketcap(self, client: httpx.AsyncClient) -> Dict:
        """Calculer la market cap des altcoins"""
        try:
            # Prendre le top 100 sans BTC et ETH
            url = "https://api.coingecko.com/api/v3/coins/markets"
            params = {
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": "100",
                "page": "1"
            }
            
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                coins = response.json()
                
                # Exclure BTC et ETH
                alts = [c for c in coins if c.get("symbol", "").upper() not in ["BTC", "ETH"]]
                
                total_mcap = sum(c.get("market_cap", 0) for c in alts)
                total_volume = sum(c.get("total_volume", 0) for c in alts)
                
                # Moyenne des changements 24h
                changes = [c.get("price_change_percentage_24h", 0) for c in alts if c.get("price_change_percentage_24h") is not None]
                avg_change = sum(changes) / len(changes) if changes else 0
                
                return {
                    "market_cap": total_mcap,
                    "volume_24h": total_volume,
                    "change_24h": avg_change
                }
            else:
                return {"market_cap": 0, "volume_24h": 0, "change_24h": 0}
                
        except Exception as e:
            print(f"Erreur alts: {e}")
            return {"market_cap": 0, "volume_24h": 0, "change_24h": 0}
    
    async def _get_btc_dominance(self, client: httpx.AsyncClient) -> float:
        """Récupérer la dominance BTC"""
        try:
            url = "https://api.coingecko.com/api/v3/global"
            
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                dominance = data.get("data", {}).get("market_cap_percentage", {}).get("btc", 0)
                return round(dominance, 2)
            else:
                return 0
                
        except Exception as e:
            print(f"Erreur dominance: {e}")
            return 0
    
    def _determine_phase(self, btc: Dict, eth: Dict, alts: Dict, dominance: float) -> Dict:
        """Déterminer la phase actuelle du marché"""
        
        btc_change = btc.get("change_24h", 0)
        eth_change = eth.get("change_24h", 0)
        alts_change = alts.get("change_24h", 0)
        
        # Alt Season = BTC flat/baisse + alts explosent + dominance baisse
        if btc_change < 2 and alts_change > 5 and dominance < 50:
            phase = self.phases["alt_season"]
            recommendation = "🚀 ALL IN ALTS ! C'est le moment !"
        
        # BTC Pump = BTC monte fort + alts baissent + dominance monte
        elif btc_change > 5 and alts_change < 0 and dominance > 55:
            phase = self.phases["btc_pump"]
            recommendation = "💰 Hold BTC ou cash, attends la fin du pump BTC"
        
        # Consolidation = BTC flat + alts commencent + dominance stable
        elif -2 < btc_change < 2 and alts_change > 0 and 50 < dominance < 55:
            phase = self.phases["consolidation"]
            recommendation = "⏰ Prépare-toi, l'alt season approche peut-être"
        
        # Distribution = Tout baisse
        elif btc_change < -3 and alts_change < -5:
            phase = self.phases["distribution"]
            recommendation = "🛑 VENDS TOUT et va en stablecoins !"
        
        # Accumulation = Tout flat
        else:
            phase = self.phases["accumulation"]
            recommendation = "🟢 Bon moment pour accumuler en DCA"
        
        return {
            **phase,
            "recommendation": recommendation
        }
    
    def _analyze_capital_rotation(self, btc: Dict, eth: Dict, alts: Dict) -> Dict:
        """Analyser la rotation du capital"""
        
        # Séquence typique: BTC → ETH → Large Cap → Mid Cap → Small Cap
        
        btc_performance = btc.get("change_24h", 0)
        eth_performance = eth.get("change_24h", 0)
        alts_performance = alts.get("change_24h", 0)
        
        if btc_performance > eth_performance > alts_performance:
            current_flow = "BTC → ETH → Alts"
            stage = "Début - Capital dans BTC"
        elif eth_performance > btc_performance and eth_performance > alts_performance:
            current_flow = "ETH → Alts"
            stage = "Milieu - Capital vers ETH"
        elif alts_performance > btc_performance and alts_performance > eth_performance:
            current_flow = "Alts dominants"
            stage = "Alt Season confirmée !"
        else:
            current_flow = "Consolidation"
            stage = "Pas de direction claire"
        
        return {
            "current_flow": current_flow,
            "stage": stage,
            "btc_perf": round(btc_performance, 2),
            "eth_perf": round(eth_performance, 2),
            "alts_perf": round(alts_performance, 2)
        }
    
    def _empty_coin_data(self) -> Dict:
        return {
            "symbol": "N/A",
            "price": 0,
            "change_24h": 0,
            "change_7d": 0,
            "volume_24h": 0,
            "market_cap": 0
        }
    
    def _get_mock_data(self) -> Dict:
        """Données de démo"""
        return {
            "btc": {"symbol": "BTC", "price": 97000, "change_24h": -2.5, "change_7d": 5.2, "volume_24h": 35000000000, "market_cap": 1900000000000},
            "eth": {"symbol": "ETH", "price": 3600, "change_24h": -3.2, "change_7d": 4.1, "volume_24h": 18000000000, "market_cap": 430000000000},
            "alts": {"market_cap": 800000000000, "volume_24h": 45000000000, "change_24h": -5.5},
            "dominance": 56.5,
            "phase": {
                "name": "Consolidation",
                "description": "BTC consolide, alts commencent - Prépare-toi",
                "emoji": "🟡",
                "recommendation": "⏰ Prépare-toi, l'alt season approche peut-être"
            },
            "rotation": {
                "current_flow": "Consolidation",
                "stage": "Pas de direction claire",
                "btc_perf": -2.5,
                "eth_perf": -3.2,
                "alts_perf": -5.5
            },
            "timestamp": datetime.now().isoformat()
        }

# Instance globale
copilot = AltseasonCopilot()

# ============================================================================
# ROUTES ALTSEASON COPILOT PRO
# ============================================================================

@router.get("/altseason-copilot-pro", response_class=HTMLResponse)
async def altseason_page(request: Request):
    """Page Altseason Copilot"""
    
    # Charger les données en temps réel
    data = await copilot.analyze_market()
    
    html = f'''
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>📈 Altseason Copilot Pro</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: 'Segoe UI', system-ui, sans-serif;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
            
            .phase-card {{
                background: rgba(255,255,255,0.15);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                margin: 30px 0;
                border: 2px solid rgba(255,255,255,0.3);
            }}
            
            .phase-emoji {{
                font-size: 5em;
                margin-bottom: 20px;
            }}
            
            .phase-name {{
                font-size: 2.5em;
                font-weight: bold;
                margin-bottom: 15px;
            }}
            
            .phase-description {{
                font-size: 1.3em;
                margin-bottom: 20px;
                opacity: 0.9;
            }}
            
            .recommendation {{
                background: rgba(255,255,255,0.2);
                padding: 20px;
                border-radius: 15px;
                font-size: 1.5em;
                font-weight: bold;
                margin-top: 20px;
            }}
            
            .metrics-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }}
            
            .metric-card {{
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 25px;
                text-align: center;
            }}
            
            .metric-label {{
                font-size: 1.1em;
                opacity: 0.8;
                margin-bottom: 10px;
            }}
            
            .metric-value {{
                font-size: 2.5em;
                font-weight: bold;
                margin: 10px 0;
            }}
            
            .metric-change {{
                font-size: 1.3em;
                font-weight: bold;
            }}
            
            .positive {{
                color: #4caf50;
            }}
            
            .negative {{
                color: #f44336;
            }}
            
            .rotation-flow {{
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 30px;
                margin: 30px 0;
            }}
            
            .flow-title {{
                font-size: 1.5em;
                font-weight: bold;
                margin-bottom: 20px;
                text-align: center;
            }}
            
            .flow-path {{
                font-size: 2em;
                text-align: center;
                margin: 20px 0;
            }}
            
            .flow-stage {{
                font-size: 1.3em;
                text-align: center;
                margin-top: 15px;
                padding: 15px;
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📈 Altseason Copilot Pro</h1>
                <p>Rotation de capital & Phase du marché en temps réel</p>
            </div>
            
            <div class="phase-card">
                <div class="phase-emoji">{data['phase']['emoji']}</div>
                <div class="phase-name">{data['phase']['name']}</div>
                <div class="phase-description">{data['phase']['description']}</div>
                <div class="recommendation">{data['phase']['recommendation']}</div>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">Bitcoin (BTC)</div>
                    <div class="metric-value">${data['btc']['price']:,.0f}</div>
                    <div class="metric-change {'positive' if data['btc']['change_24h'] >= 0 else 'negative'}">
                        {'+' if data['btc']['change_24h'] >= 0 else ''}{data['btc']['change_24h']:.2f}%
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-label">Ethereum (ETH)</div>
                    <div class="metric-value">${data['eth']['price']:,.0f}</div>
                    <div class="metric-change {'positive' if data['eth']['change_24h'] >= 0 else 'negative'}">
                        {'+' if data['eth']['change_24h'] >= 0 else ''}{data['eth']['change_24h']:.2f}%
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-label">Altcoins (Avg)</div>
                    <div class="metric-value">-</div>
                    <div class="metric-change {'positive' if data['alts']['change_24h'] >= 0 else 'negative'}">
                        {'+' if data['alts']['change_24h'] >= 0 else ''}{data['alts']['change_24h']:.2f}%
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-label">BTC Dominance</div>
                    <div class="metric-value">{data['dominance']:.2f}%</div>
                    <div class="metric-change">Market Share</div>
                </div>
            </div>
            
            <div class="rotation-flow">
                <div class="flow-title">🔄 Rotation de Capital</div>
                <div class="flow-path">{data['rotation']['current_flow']}</div>
                <div class="flow-stage">{data['rotation']['stage']}</div>
            </div>
        </div>
        
        <script>
            // Auto-refresh toutes les 60 secondes
            setTimeout(() => location.reload(), 60000);
        </script>
    </body>
    </html>
    '''
    
    return html

@router.get("/api/altseason/analyze")
async def analyze_market_api():
    """API pour analyser le marché"""
    try:
        data = await copilot.analyze_market()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
