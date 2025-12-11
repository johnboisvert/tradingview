"""
🛡️ RUG & SCAM SHIELD - Module séparé
Analyse de sécurité des contracts ERC20/BEP20
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
import httpx
from typing import Dict

# Router FastAPI
router = APIRouter()

# ============================================================================
# CODE RUG & SCAM SHIELD
# ============================================================================

class RugScamShield:
    def __init__(self):
        self.api_url = "https://api.honeypot.is/v2/IsHoneypot"
    
    async def analyze_contract(self, contract_address: str, chain: str = "eth") -> Dict:
        """Analyser un contract pour détecter les scams"""
        
        if not contract_address or len(contract_address) != 42 or not contract_address.startswith("0x"):
            return {
                "error": "Adresse de contract invalide (doit être 0x... 42 caractères)"
            }
        
        try:
            # Appeler l'API Honeypot.is (gratuite, illimitée)
            async with httpx.AsyncClient(timeout=15.0) as client:
                params = {
                    "address": contract_address,
                    "chainID": self._get_chain_id(chain)
                }
                
                response = await client.get(self.api_url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    return self._analyze_results(data, contract_address)
                else:
                    return {
                        "error": f"Erreur API: {response.status_code}",
                        "contract": contract_address
                    }
                    
        except Exception as e:
            return {
                "error": f"Erreur d'analyse: {str(e)}",
                "contract": contract_address
            }
    
    def _get_chain_id(self, chain: str) -> str:
        """Convertir le nom de chain en ID"""
        chains = {
            "eth": "1",
            "bsc": "56",
            "polygon": "137",
            "arbitrum": "42161",
            "optimism": "10",
            "avalanche": "43114",
            "fantom": "250",
            "base": "8453"
        }
        return chains.get(chain.lower(), "1")
    
    def _analyze_results(self, data: Dict, address: str) -> Dict:
        """Analyser les résultats de l'API"""
        
        # Extraire les infos importantes
        is_honeypot = data.get("honeypotResult", {}).get("isHoneypot", False)
        
        simulation_result = data.get("simulationResult", {})
        buy_tax = simulation_result.get("buyTax", 0)
        sell_tax = simulation_result.get("sellTax", 0)
        transfer_tax = simulation_result.get("transferTax", 0)
        
        contract_code = data.get("contractCode", {})
        is_open_source = contract_code.get("openSource", False)
        is_proxy = contract_code.get("isProxy", False)
        
        holder_analysis = data.get("holderAnalysis", {})
        holders_count = holder_analysis.get("holders", 0)
        
        # Calculer le risk score (0-100, 100 = très risqué)
        risk_score = 0
        risks = []
        
        # Check 1: Honeypot
        if is_honeypot:
            risk_score += 50
            risks.append("🚨 HONEYPOT DÉTECTÉ - Impossible de vendre !")
        
        # Check 2: High Taxes
        if sell_tax > 10:
            risk_score += 20
            risks.append(f"⚠️ Taxe de vente élevée: {sell_tax}%")
        elif sell_tax > 5:
            risk_score += 10
            risks.append(f"⚠️ Taxe de vente: {sell_tax}%")
        
        if buy_tax > 10:
            risk_score += 15
            risks.append(f"⚠️ Taxe d'achat élevée: {buy_tax}%")
        
        # Check 3: Not Open Source
        if not is_open_source:
            risk_score += 15
            risks.append("⚠️ Code non vérifié sur Etherscan")
        
        # Check 4: Proxy Contract (peut être modifié)
        if is_proxy:
            risk_score += 10
            risks.append("⚠️ Contract proxy (peut être modifié)")
        
        # Check 5: Peu de holders
        if holders_count > 0 and holders_count < 100:
            risk_score += 10
            risks.append(f"⚠️ Peu de holders: {holders_count}")
        
        # Déterminer le niveau de risque
        if risk_score >= 70:
            risk_level = "EXTRÊME"
            risk_emoji = "🔴"
            risk_color = "#ff0000"
        elif risk_score >= 40:
            risk_level = "ÉLEVÉ"
            risk_emoji = "🟠"
            risk_color = "#ff6600"
        elif risk_score >= 20:
            risk_level = "MOYEN"
            risk_emoji = "🟡"
            risk_color = "#ffcc00"
        else:
            risk_level = "FAIBLE"
            risk_emoji = "🟢"
            risk_color = "#00cc00"
        
        # Si aucun risque détecté
        if not risks:
            risks.append("✅ Aucun risque majeur détecté")
        
        return {
            "contract": address,
            "is_honeypot": is_honeypot,
            "is_open_source": is_open_source,
            "is_proxy": is_proxy,
            "buy_tax": buy_tax,
            "sell_tax": sell_tax,
            "transfer_tax": transfer_tax,
            "holders_count": holders_count,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_emoji": risk_emoji,
            "risk_color": risk_color,
            "risks": risks,
            "recommendation": self._get_recommendation(risk_score, is_honeypot)
        }
    
    def _get_recommendation(self, risk_score: int, is_honeypot: bool) -> str:
        """Obtenir une recommandation"""
        if is_honeypot:
            return "🚨 N'INVESTIS PAS ! C'est un honeypot avéré !"
        elif risk_score >= 70:
            return "🔴 TRÈS RISQUÉ - Évite ce token !"
        elif risk_score >= 40:
            return "🟠 RISQUE ÉLEVÉ - Investis seulement si tu sais ce que tu fais"
        elif risk_score >= 20:
            return "🟡 RISQUE MOYEN - Fais tes propres recherches"
        else:
            return "🟢 RISQUE FAIBLE - Semble relativement sûr"

# Instance globale
shield = RugScamShield()

# ============================================================================
# ROUTES RUG & SCAM SHIELD
# ============================================================================

@router.get("/rug-scam-shield", response_class=HTMLResponse)
async def rug_shield_page(request: Request):
    """Page Rug & Scam Shield"""
    
    html = '''
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🛡️ Rug & Scam Shield</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', system-ui, sans-serif;
                background: linear-gradient(135deg, #fc466b 0%, #3f5efb 100%);
                color: white;
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1000px;
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
            
            .header p {
                font-size: 1.2em;
                opacity: 0.9;
            }
            
            .input-section {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                margin: 30px 0;
            }
            
            .input-label {
                font-size: 1.3em;
                margin-bottom: 15px;
                display: block;
            }
            
            .input-group {
                display: flex;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .contract-input {
                flex: 1;
                padding: 15px;
                font-size: 1.1em;
                border: none;
                border-radius: 10px;
                background: rgba(255,255,255,0.9);
                color: #333;
            }
            
            .chain-select {
                padding: 15px;
                font-size: 1.1em;
                border: none;
                border-radius: 10px;
                background: rgba(255,255,255,0.9);
                color: #333;
                min-width: 150px;
            }
            
            .analyze-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 15px 40px;
                font-size: 1.2em;
                border-radius: 50px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                transition: transform 0.2s;
                width: 100%;
            }
            
            .analyze-btn:hover {
                transform: translateY(-2px);
            }
            
            .results {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                margin: 30px 0;
                display: none;
            }
            
            .risk-badge {
                font-size: 3em;
                text-align: center;
                margin: 20px 0;
            }
            
            .risk-level {
                font-size: 2em;
                text-align: center;
                font-weight: bold;
                margin: 10px 0;
            }
            
            .risk-score {
                font-size: 1.5em;
                text-align: center;
                margin: 10px 0;
            }
            
            .recommendation {
                background: rgba(255,255,255,0.2);
                padding: 20px;
                border-radius: 15px;
                margin: 20px 0;
                font-size: 1.2em;
                text-align: center;
                font-weight: bold;
            }
            
            .checks-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin: 30px 0;
            }
            
            .check-item {
                background: rgba(255,255,255,0.1);
                padding: 15px;
                border-radius: 10px;
                text-align: center;
            }
            
            .check-label {
                font-size: 0.9em;
                opacity: 0.8;
                margin-bottom: 5px;
            }
            
            .check-value {
                font-size: 1.5em;
                font-weight: bold;
            }
            
            .risks-list {
                margin: 30px 0;
            }
            
            .risk-item {
                background: rgba(255,255,255,0.1);
                padding: 15px;
                margin: 10px 0;
                border-radius: 10px;
                font-size: 1.1em;
            }
            
            .loading {
                text-align: center;
                font-size: 1.5em;
                padding: 20px;
            }
            
            .error {
                background: rgba(255,0,0,0.2);
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                font-size: 1.2em;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛡️ Rug & Scam Shield</h1>
                <p>Analyse de sécurité des smart contracts</p>
            </div>
            
            <div class="input-section">
                <label class="input-label">Adresse du Contract</label>
                <div class="input-group">
                    <input 
                        type="text" 
                        id="contractAddress" 
                        class="contract-input" 
                        placeholder="0x..."
                    >
                    <select id="chainSelect" class="chain-select">
                        <option value="eth">Ethereum</option>
                        <option value="bsc">BSC</option>
                        <option value="polygon">Polygon</option>
                        <option value="arbitrum">Arbitrum</option>
                        <option value="base">Base</option>
                    </select>
                </div>
                <button class="analyze-btn" onclick="analyzeContract()">
                    🔍 Analyser
                </button>
            </div>
            
            <div id="results" class="results">
                <!-- Results will be displayed here -->
            </div>
        </div>
        
        <script>
            async function analyzeContract() {
                const address = document.getElementById('contractAddress').value.trim();
                const chain = document.getElementById('chainSelect').value;
                const resultsDiv = document.getElementById('results');
                
                if (!address) {
                    alert('Entre une adresse de contract !');
                    return;
                }
                
                // Show loading
                resultsDiv.style.display = 'block';
                resultsDiv.innerHTML = '<div class="loading">🔄 Analyse en cours...</div>';
                
                try {
                    const response = await fetch(`/api/rug-shield/analyze?contract=${address}&chain=${chain}`);
                    const data = await response.json();
                    
                    if (data.error) {
                        resultsDiv.innerHTML = `<div class="error">❌ ${data.error}</div>`;
                    } else {
                        displayResults(data);
                    }
                } catch (error) {
                    resultsDiv.innerHTML = `<div class="error">❌ Erreur: ${error.message}</div>`;
                }
            }
            
            function displayResults(data) {
                const html = `
                    <div class="risk-badge" style="color: ${data.risk_color}">
                        ${data.risk_emoji}
                    </div>
                    <div class="risk-level" style="color: ${data.risk_color}">
                        RISQUE ${data.risk_level}
                    </div>
                    <div class="risk-score">
                        Score de risque: ${data.risk_score}/100
                    </div>
                    
                    <div class="recommendation">
                        ${data.recommendation}
                    </div>
                    
                    <div class="checks-grid">
                        <div class="check-item">
                            <div class="check-label">Honeypot</div>
                            <div class="check-value">${data.is_honeypot ? '🚨 OUI' : '✅ NON'}</div>
                        </div>
                        <div class="check-item">
                            <div class="check-label">Code vérifié</div>
                            <div class="check-value">${data.is_open_source ? '✅ OUI' : '⚠️ NON'}</div>
                        </div>
                        <div class="check-item">
                            <div class="check-label">Contract Proxy</div>
                            <div class="check-value">${data.is_proxy ? '⚠️ OUI' : '✅ NON'}</div>
                        </div>
                        <div class="check-item">
                            <div class="check-label">Taxe d'achat</div>
                            <div class="check-value">${data.buy_tax}%</div>
                        </div>
                        <div class="check-item">
                            <div class="check-label">Taxe de vente</div>
                            <div class="check-value">${data.sell_tax}%</div>
                        </div>
                        <div class="check-item">
                            <div class="check-label">Holders</div>
                            <div class="check-value">${data.holders_count || 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div class="risks-list">
                        <h3 style="margin-bottom: 15px;">Risques détectés:</h3>
                        ${data.risks.map(risk => `<div class="risk-item">${risk}</div>`).join('')}
                    </div>
                `;
                
                document.getElementById('results').innerHTML = html;
            }
        </script>
    </body>
    </html>
    '''
    
    return html

@router.get("/api/rug-shield/analyze")
async def analyze_contract_api(contract: str, chain: str = "eth"):
    """API pour analyser un contract"""
    try:
        result = await shield.analyze_contract(contract, chain)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )
