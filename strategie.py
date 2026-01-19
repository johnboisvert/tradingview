# -*- coding: utf-8 -*-
"""
Route FastAPI pour le guide ULTIME Magic Mike 1H
À ajouter dans ton main.py en 3 lignes !
"""

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter()

@router.get("/strategie", response_class=HTMLResponse)
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
            
            .nav-btn {
                background: rgba(255,255,255,0.2);
                color: white;
                border: 2px solid white;
                padding: 10px 20px;
                border-radius: 50px;
                cursor: pointer;
                margin: 10px 5px;
                transition: 0.3s;
            }
            
            .nav-btn:hover {
                background: white;
                color: #667eea;
            }
            
            @media print {
                .print-btn, .nav-btn {
                    display: none;
                }
                body {
                    background: white;
                }
                .container {
                    padding: 20px;
                }
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
                    <p><strong>Parfait =</strong> Ordre croissant haussier (blanc > vert > rouge)</p>
                    
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
                
                <!-- NIVEAU 2 -->
                <div class="section">
                    <span class="level-badge level2">NIVEAU 2</span>
                    <h2><span class="emoji">⚙️</span> PRÉPARER LE TRADE</h2>
                    
                    <h3>Paramètres optimisés pour 1H (TECHNIQUE)</h3>
                    <table>
                        <tr>
                            <th>PARAMÈTRE</th>
                            <th>VALEUR</th>
                            <th>RAISON</th>
                        </tr>
                        <tr>
                            <td>EMA Short</td>
                            <td>20</td>
                            <td>Réactivité</td>
                        </tr>
                        <tr>
                            <td>EMA Medium</td>
                            <td>50</td>
                            <td>Filtre</td>
                        </tr>
                        <tr>
                            <td>EMA Long</td>
                            <td>200</td>
                            <td>Trend long</td>
                        </tr>
                        <tr>
                            <td>ADX Minimum</td>
                            <td>23</td>
                            <td>Tendance</td>
                        </tr>
                        <tr>
                            <td>TP1 Target</td>
                            <td>2.5R</td>
                            <td>Conservateur</td>
                        </tr>
                        <tr>
                            <td>TP2 Target</td>
                            <td>5.0R</td>
                            <td>OPTIMAL 💎</td>
                        </tr>
                        <tr>
                            <td>TP3 Target</td>
                            <td>8.0R</td>
                            <td>Tendances fortes</td>
                        </tr>
                    </table>
                    
                    <h3>Filtres HTF - La clé du 70-80% winrate</h3>
                    <p><strong>⚠️ CONCEPT FONDAMENTAL :</strong> Tu tradés en 1H, MAIS tu vérifies TOUJOURS la 4H + Daily !</p>
                    
                    <div class="box">
                        <h4>Pourquoi ?</h4>
                        <ul>
                            <li>Un signal 1H peut être un faux-signal si 4H + Daily vont contre</li>
                            <li>Les filtres HTF réduisent les faux-signaux</li>
                            <li>Cela augmente ton winrate de 70% à 80% !</li>
                        </ul>
                    </div>
                    
                    <h4>Résumé rapide :</h4>
                    <ul>
                        <li>🟢 Signal 1H + Fond vert = 4H + Daily haussiers = ✅ LONG OK</li>
                        <li>🔴 Signal 1H + Fond rouge = 4H + Daily baissiers = ✅ SHORT OK</li>
                        <li>⚪ Signal 1H + Pas de fond = 4H + Daily pas alignés = ❌ NO TRADE</li>
                    </ul>
                    
                    <h3>Checklist pré-trade complète</h3>
                    <p><strong>Avant CHAQUE trade, passe cette checklist.</strong> Si UN seul critère échoue = NE PAS TRADER.</p>
                    
                    <div class="checklist">
                        <h4>✅ PRÉPARATION ENVIRONNEMENT</h4>
                        <label><input type="checkbox"> Graphique 1H ouvert sur TradingView</label>
                        <label><input type="checkbox"> Indicateur Magic Mike chargé et visible</label>
                        <label><input type="checkbox"> Binance/Kraken/FTX ouvert pour trader</label>
                        <label><input type="checkbox"> Capital préparé (minimum $1000-2000)</label>
                        <label><input type="checkbox"> Journal trading PRÊT (papier ou fichier)</label>
                        <label><input type="checkbox"> Zéro distractions (phone éteint, Discord fermé)</label>
                        <label><input type="checkbox"> Je suis CALME, CONCENTRÉ et pas stressé</label>
                        
                        <h4 style="margin-top: 20px;">✅ VÉRIFICATION INDICATEUR</h4>
                        <label><input type="checkbox"> Signal visible : ✅ LONG ou ✅ SHORT</label>
                        <label><input type="checkbox"> Triangle coloré présent : 🟢 ou 🔴</label>
                        <label><input type="checkbox"> Fond coloré présent : 🟢 VERT ou 🔴 ROUGE (sinon ⛔)</label>
                        <label><input type="checkbox"> EMAs dans le bon ordre (haussier ou baissier)</label>
                        <label><input type="checkbox"> ADX > 23 (tendance confirmée, pas faible)</label>
                        <label><input type="checkbox"> RSI dans la bonne zone (45-75 pour LONG, 25-55 pour SHORT)</label>
                        <label><input type="checkbox"> MACD histogramme correct</label>
                        
                        <h4 style="margin-top: 20px;">✅ VÉRIFICATION FILTRE HTF</h4>
                        <label><input type="checkbox"> Si fond 🟢 : 4H + Daily sont haussiers ?</label>
                        <label><input type="checkbox"> Si fond 🔴 : 4H + Daily sont baissiers ?</label>
                        
                        <h4 style="margin-top: 20px;">✅ VÉRIFICATION CAPITAL & RISQUE</h4>
                        <label><input type="checkbox"> Capital disponible calculé</label>
                        <label><input type="checkbox"> Risk par trade = 1%</label>
                        <label><input type="checkbox"> Taille position calculée correctement</label>
                        <label><input type="checkbox"> Pas plus de 2 trades ouverts actuellement</label>
                    </div>
                </div>
                
                <!-- NIVEAU 3 -->
                <div class="section">
                    <span class="level-badge level3">NIVEAU 3</span>
                    <h2><span class="emoji">⚡</span> EXÉCUTER LE TRADE</h2>
                    
                    <h3>Les 3 scénarios réels</h3>
                    
                    <h4>🟢 SCÉNARIO 1 : LE PRIX MONTE (LONG) ✅</h4>
                    <div class="box success">
                        <strong>1️⃣ TP1 ATTEINT → 40% position fermée</strong><br><br>
                        ✅ 40% vendu à 2.5R<br>
                        💰 Profit sécurisé : +$250 (exemple avec $100 risk)<br><br>
                        🛡️ ACTION IMMÉDIATE : Mettre SL à BREAK EVEN<br>
                        └─ Tu gardes 60% de la position en courant<br><br>
                        <strong>2️⃣ TP2 ATTEINT → 40% supplémentaires fermés</strong><br><br>
                        ✅ 40% vendu à 5.0R (LE MEILLEUR RATIO !)<br>
                        💰 Profit additionnel : +$500 (cumulé +$750)<br><br>
                        🛡️ ACTION IMMÉDIATE : Déplacer SL à TP1<br>
                        └─ Tu as +$750, tu ne peux pas perdre ici !<br><br>
                        <strong>3️⃣ TP3 ATTEINT → 20% derniers fermés</strong><br><br>
                        ✅ 20% vendu à 8.0R<br>
                        💰 Profit final : +$800 (cumulé +$1,550 sur 1 trade !)<br><br>
                        🎉 TRADE COMPLÉTÉ !
                    </div>
                    
                    <h4>🔴 SCÉNARIO 2 : LE PRIX BAISSE (SL HIT) ❌</h4>
                    <div class="box danger">
                        <strong>❌ 100% position fermée au SL</strong><br><br>
                        💔 Perte : -$100 (ton risque défini)<br><br>
                        😔 NORMAL ! C'est juste un trade perdu !<br>
                        → Tu as perdu 1% de ton capital (prévu)<br>
                        → Les autres 99% sont protégés<br>
                        → C'est mathématiquement normal<br><br>
                        <strong>⏱️ PAUSE OBLIGATOIRE :</strong><br>
                        └─ Après 1 SL : Pause 30 min MINIMUM<br>
                        └─ Après 2 SL : Pause 1 heure complète<br>
                        └─ Après 3 SL : STOP 24-48h (mental pas bon)
                    </div>
                    
                    <h4>🟡 SCÉNARIO 3 : LE PRIX STAGNE (RANGE) ⏳</h4>
                    <div class="box warning">
                        <strong>Le prix oscille mais ne progresse pas</strong><br><br>
                        ✅ Attendre 30 min supplémentaire<br>
                        ✅ Si toujours pas de direction → Sort à la main au breakeven<br><br>
                        🟡 Entrée : $100<br>
                        🟡 Exit manuel : $100 (breakeven)<br><br>
                        RÉSULTAT : 0 (pas de profit, pas de perte)<br>
                        Mental : OK (pas frustré)
                    </div>
                    
                    <h3>Sortie progressive 40/40/20</h3>
                    <div class="box">
                        <p><strong>Pourquoi 40/40/20 et pas tout d'un coup ?</strong></p>
                        <ul>
                            <li>40% à TP1 (2.5R) : Sécurises les premiers gains</li>
                            <li>SL à BE : Pas de risque</li>
                            <li>40% à TP2 (5.0R) : Crois en ton trade</li>
                            <li>SL à TP1 : Profit garanti</li>
                            <li>20% à TP3 (8.0R) : Profite de la lune shot</li>
                        </ul>
                        <p><strong>Résultat :</strong> +$1,550 au lieu de +$250 !</p>
                    </div>
                </div>
                
                <!-- NIVEAU 4 -->
                <div class="section">
                    <span class="level-badge level4">NIVEAU 4</span>
                    <h2><span class="emoji">📈</span> ANALYSER & APPRENDRE</h2>
                    
                    <h3>Les 10 RÈGLES D'OR pour NE JAMAIS PERDRE</h3>
                    
                    <div class="box success">
                        <h4>RÈGLE 1️⃣ : STOP LOSS OBLIGATOIRE</h4>
                        <ul>
                            <li><strong>✅ À FAIRE :</strong> Placer SL IMMÉDIATEMENT après ENTRY</li>
                            <li><strong>❌ À NE JAMAIS FAIRE :</strong> Trader sans SL (suicide financier)</li>
                            <li><strong>RAISON :</strong> SL = Votre assurance contre les pertes</li>
                        </ul>
                    </div>
                    
                    <div class="box success">
                        <h4>RÈGLE 2️⃣ : LEVERAGE = 10x UNIQUEMENT</h4>
                        <ul>
                            <li><strong>✅ À FAIRE :</strong> Leverage = 10x, Mode = Isolé</li>
                            <li><strong>❌ À NE JAMAIS FAIRE :</strong> Leverage 20x (trop risqué)</li>
                            <li><strong>RAISON :</strong> 10x = Balance risque/récompense optimal</li>
                        </ul>
                    </div>
                    
                    <div class="box success">
                        <h4>RÈGLE 3️⃣ : TAILLE POSITION = 1% DU CAPITAL</h4>
                        <ul>
                            <li><strong>✅ À FAIRE :</strong> Risk par trade = 1% du capital</li>
                            <li><strong>❌ À NE JAMAIS FAIRE :</strong> Risk 5% (compte peut devenir 0)</li>
                            <li><strong>RAISON :</strong> Protection maximale + accumulation des profits</li>
                        </ul>
                    </div>
                    
                    <div class="box success">
                        <h4>RÈGLE 4️⃣ : ATTENDRE LE SETUP PARFAIT</h4>
                        <ul>
                            <li><strong>✅ À FAIRE :</strong> Vérifier TOUS les critères</li>
                            <li><strong>❌ À NE JAMAIS FAIRE :</strong> Trader un signal "presque bon"</li>
                            <li><strong>RAISON :</strong> 70-80% winrate = Attendre les bonnes conditions</li>
                        </ul>
                    </div>
                    
                    <div class="box success">
                        <h4>RÈGLE 5️⃣ : NE PAS MODIFIER LE STOP LOSS</h4>
                        <ul>
                            <li><strong>✅ À FAIRE :</strong> SL au prix exact du signal (ne jamais bouger)</li>
                            <li><strong>❌ À NE JAMAIS FAIRE :</strong> Déplacer SL plus bas</li>
                            <li><strong>RAISON :</strong> SL est ta limite. Elle ne bouge pas.</li>
                        </ul>
                    </div>
                    
                    <div class="box success">
                        <h4>RÈGLE 6️⃣ : RESPECTER LES SORTIES PROGRESSIVES</h4>
                        <ul>
                            <li><strong>✅ À FAIRE :</strong> TP1=40%, TP2=40%, TP3=20%</li>
                            <li><strong>❌ À NE JAMAIS FAIRE :</strong> Tout vendre à TP1</li>
                            <li><strong>RAISON :</strong> 40/40/20 = +4.6R moyen</li>
                        </ul>
                    </div>
                    
                    <div class="box success">
                        <h4>RÈGLE 7️⃣ : PAUSE APRÈS PERTE</h4>
                        <ul>
                            <li><strong>✅ À FAIRE :</strong> 1 SL = Pause 30 min, 2 SL = 1h, 3 SL = 24-48h</li>
                            <li><strong>❌ À NE JAMAIS FAIRE :</strong> Revenge trading</li>
                            <li><strong>RAISON :</strong> Après perte = Émotions élevées = Mauvaises décisions</li>
                        </ul>
                    </div>
                    
                    <div class="box success">
                        <h4>RÈGLE 8️⃣ : JOURNAL TRADING QUOTIDIEN</h4>
                        <ul>
                            <li><strong>✅ À FAIRE :</strong> Noter CHAQUE trade immédiatement</li>
                            <li><strong>❌ À NE JAMAIS FAIRE :</strong> Trader sans journal</li>
                            <li><strong>RAISON :</strong> Journal = Feedback sur tes erreurs</li>
                        </ul>
                    </div>
                    
                    <div class="box success">
                        <h4>RÈGLE 9️⃣ : IGNORER LES BRUITS (Émotions)</h4>
                        <ul>
                            <li><strong>✅ À FAIRE :</strong> Suivre uniquement Magic Mike signals</li>
                            <li><strong>❌ À NE JAMAIS FAIRE :</strong> FOMO (Fear Of Missing Out)</li>
                            <li><strong>RAISON :</strong> Émotions = Pertes. Discipline = Profits</li>
                        </ul>
                    </div>
                    
                    <div class="box success">
                        <h4>RÈGLE 🔟 : CROIRE AU SYSTÈME</h4>
                        <ul>
                            <li><strong>✅ À FAIRE :</strong> Magic Mike = 70-80% winrate VALIDÉ</li>
                            <li><strong>❌ À NE JAMAIS FAIRE :</strong> Changer après 3 SL</li>
                            <li><strong>RAISON :</strong> Ce système fonctionne. Math dit qu'on gagne !</li>
                        </ul>
                    </div>
                </div>
                
                <!-- NIVEAU 5 -->
                <div class="section">
                    <span class="level-badge level5">NIVEAU 5</span>
                    <h2><span class="emoji">💰</span> PROJETER & CALCULER</h2>
                    
                    <h3>Calcul des gains réalistes</h3>
                    
                    <div class="calculator">
                        <h4>💎 Calculateur de ROI</h4>
                        <p><strong>Rentre tes paramètres :</strong></p>
                        
                        <label><strong>Capital de départ ($)</strong></label>
                        <input type="number" id="capital" placeholder="Ex: 10000" value="10000">
                        
                        <label><strong>ROI mensuel estimé (%)</strong></label>
                        <input type="number" id="roi" placeholder="Ex: 128" value="128">
                        
                        <label><strong>Nombre de mois</strong></label>
                        <input type="number" id="months" placeholder="Ex: 3" value="3">
                        
                        <button onclick="calculateROI()">Calculer le ROI 🚀</button>
                        
                        <div id="roiResult" class="result"></div>
                    </div>
                    
                    <h3>Plan d'action 30 jours</h3>
                    
                    <div class="box">
                        <h4>📋 SEMAINE 1 : BACKTEST (Pas de trading réel)</h4>
                        <ul>
                            <li>Jour 1-2 : Télécharger 1 mois d'historique BTC/USDT 1H</li>
                            <li>Jour 3-5 : Appliquer Magic Mike manuellement sur ETH/USDT et BNB/USDT</li>
                            <li>Jour 6-7 : Analyser les résultats (Winrate ≥ 70% ?)</li>
                        </ul>
                    </div>
                    
                    <div class="box">
                        <h4>📋 SEMAINE 2 : PAPER TRADING (Trading simulé)</h4>
                        <ul>
                            <li>Jour 8-14 : Trader en DÉMO (papier trading)</li>
                            <li>Utiliser Magic Mike sur live chart</li>
                            <li>Vérifier : Winrate ≥ 70% ?</li>
                        </ul>
                    </div>
                    
                    <div class="box">
                        <h4>📋 SEMAINE 3 : MICRO-CAPITAL (Trading réel, petit)</h4>
                        <ul>
                            <li>Jour 15-21 : Déposer $500-1000 sur Binance/Kraken</li>
                            <li>Trader avec 1-2 trades par jour MAX</li>
                            <li>Risk 1% par trade = $5-10 par trade</li>
                        </ul>
                    </div>
                    
                    <div class="box">
                        <h4>📋 SEMAINE 4 : SCALING (Augmentation progressive)</h4>
                        <ul>
                            <li>Jour 22-28 : Si semaine 3 = Profit ✅ → Capital passe à $1000-2000</li>
                            <li>Jour 29-30 : Résumé des 4 semaines</li>
                        </ul>
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
            
            // Calculer au chargement
            window.onload = function() {
                calculateROI();
            };
        </script>
    </body>
    </html>
    """
    
    return html_content
