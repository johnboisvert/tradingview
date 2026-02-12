"""
Contenu détaillé des leçons de l'Academy Trading
"""
from youtube_videos import get_video_url

LESSON_CONTENT = {
    # Module 1: Introduction au Trading Crypto
    (1, 1): {
        "title": "Qu'est-ce que le trading crypto ?",
        "video_url": "",
        "content": """
            <h3>🎯 Introduction au Trading de Cryptomonnaies</h3>
            <p>Le trading de cryptomonnaies consiste à acheter et vendre des actifs numériques dans le but de réaliser des profits. Contrairement à l'investissement traditionnel où l'on conserve ses actifs sur le long terme, le trading implique des transactions plus fréquentes pour profiter des fluctuations de prix.</p>
            
            <h3>📊 Les Marchés Crypto</h3>
            <p>Les marchés crypto fonctionnent 24h/24, 7j/7, contrairement aux marchés boursiers traditionnels. Cette disponibilité permanente offre plus d'opportunités mais demande aussi une gestion rigoureuse de votre temps et de vos émotions.</p>
            
            <h3>💡 Types de Trading</h3>
            <ul>
                <li><strong>Day Trading</strong> : Positions ouvertes et fermées dans la même journée</li>
                <li><strong>Swing Trading</strong> : Positions maintenues plusieurs jours à semaines</li>
                <li><strong>Scalping</strong> : Trades très courts (minutes) pour de petits gains</li>
                <li><strong>Position Trading</strong> : Positions sur plusieurs mois</li>
            </ul>
            
            <h3>⚠️ Risques à Connaître</h3>
            <p>Le trading crypto comporte des risques significatifs. La volatilité peut être extrême, avec des variations de 10-20% en une seule journée. Ne tradez jamais avec de l'argent que vous ne pouvez pas vous permettre de perdre.</p>
        """,
        "key_points": [
            "Le trading crypto permet de profiter des fluctuations de prix",
            "Les marchés sont ouverts 24/7, offrant plus d'opportunités",
            "Différents styles de trading existent selon votre disponibilité",
            "La gestion du risque est primordiale pour survivre sur le long terme"
        ],
        "quiz": [
            {
                "question": "Quelle est la principale différence entre le trading et l'investissement ?",
                "options": ["Le montant investi", "La fréquence des transactions", "Le type d'actifs", "L'heure des transactions"],
                "correct": 1
            },
            {
                "question": "Les marchés crypto sont ouverts :",
                "options": ["Du lundi au vendredi", "24h/24, 5j/7", "24h/24, 7j/7", "Uniquement le week-end"],
                "correct": 2
            }
        ]
    },
    (1, 2): {
        "title": "Les différents types de cryptomonnaies",
        "video_url": "",
        "content": """
            <h3>🪙 Bitcoin (BTC) - La Première Crypto</h3>
            <p>Créé en 2009 par Satoshi Nakamoto, Bitcoin est la première et la plus connue des cryptomonnaies. Il représente environ 40-50% de la capitalisation totale du marché crypto.</p>
            
            <h3>💎 Ethereum (ETH) - La Plateforme des Smart Contracts</h3>
            <p>Ethereum va au-delà d'une simple monnaie. C'est une plateforme permettant de créer des applications décentralisées (dApps) et des smart contracts.</p>
            
            <h3>🏷️ Catégories de Cryptomonnaies</h3>
            <ul>
                <li><strong>Layer 1</strong> : Blockchains principales (BTC, ETH, SOL, AVAX)</li>
                <li><strong>Layer 2</strong> : Solutions de scaling (Polygon, Arbitrum)</li>
                <li><strong>DeFi</strong> : Finance décentralisée (AAVE, UNI)</li>
                <li><strong>Stablecoins</strong> : Cryptos indexées (USDT, USDC)</li>
            </ul>
        """,
        "key_points": [
            "Bitcoin est la première crypto et reste la référence",
            "Ethereum permet les smart contracts et les dApps",
            "Les cryptos se classent en plusieurs catégories",
            "La capitalisation aide à évaluer la taille d'un projet"
        ],
        "quiz": []
    },
    (1, 3): {
        "title": "Comment fonctionne un exchange",
        "video_url": "",
        "content": """
            <h3>🏦 Qu'est-ce qu'un Exchange ?</h3>
            <p>Un exchange est une plateforme qui permet d'acheter, vendre et échanger des cryptomonnaies.</p>
            
            <h3>📊 Types d'Exchanges</h3>
            <ul>
                <li><strong>CEX</strong> : Binance, Coinbase, Kraken - Gérés par une entreprise</li>
                <li><strong>DEX</strong> : Uniswap, SushiSwap - Sans intermédiaire</li>
            </ul>
            
            <h3>💰 Le Carnet d'Ordres</h3>
            <p>Le carnet d'ordres affiche tous les ordres d'achat (bids) et de vente (asks) en attente.</p>
        """,
        "key_points": [
            "Un exchange permet d'acheter et vendre des cryptos",
            "CEX sont centralisés, DEX sont décentralisés",
            "Le carnet d'ordres montre l'offre et la demande"
        ],
        "quiz": []
    },
    (1, 4): {
        "title": "Vocabulaire essentiel du trader",
        "video_url": "",
        "content": """
            <h3>📖 Vocabulaire Trading Essentiel</h3>
            <ul>
                <li><strong>Bull/Bear</strong> : Marché haussier/baissier</li>
                <li><strong>Long/Short</strong> : Position acheteuse/vendeuse</li>
                <li><strong>ATH/ATL</strong> : All-Time High/Low (plus haut/bas historique)</li>
                <li><strong>HODL</strong> : Hold On for Dear Life (conserver)</li>
                <li><strong>FOMO</strong> : Fear Of Missing Out (peur de rater)</li>
                <li><strong>FUD</strong> : Fear, Uncertainty, Doubt</li>
                <li><strong>Whale</strong> : Gros investisseur</li>
                <li><strong>Pump/Dump</strong> : Hausse/Baisse rapide</li>
            </ul>
        """,
        "key_points": [
            "Bull = haussier, Bear = baissier",
            "Long = achat, Short = vente",
            "FOMO et FUD sont des émotions à contrôler"
        ],
        "quiz": []
    },
    (1, 5): {
        "title": "Créer son compte sur un exchange",
        "video_url": "",
        "content": """
            <h3>📝 Étapes pour créer un compte</h3>
            <ol>
                <li>Choisir un exchange réputé (Binance, Coinbase, Kraken)</li>
                <li>S'inscrire avec email et mot de passe fort</li>
                <li>Vérifier son identité (KYC)</li>
                <li>Activer la double authentification (2FA)</li>
                <li>Effectuer un premier dépôt</li>
            </ol>
        """,
        "key_points": [
            "Choisir un exchange régulé et réputé",
            "La vérification KYC est obligatoire",
            "Toujours activer le 2FA"
        ],
        "quiz": []
    },
    (1, 6): {
        "title": "Sécuriser son compte (2FA)",
        "video_url": "",
        "content": """
            <h3>🔐 La Double Authentification (2FA)</h3>
            <p>Le 2FA ajoute une couche de sécurité en demandant un code temporaire en plus du mot de passe.</p>
            
            <h3>📱 Types de 2FA</h3>
            <ul>
                <li><strong>Google Authenticator</strong> : Application recommandée</li>
                <li><strong>SMS</strong> : Moins sécurisé (SIM swap)</li>
                <li><strong>Clé physique</strong> : YubiKey (le plus sécurisé)</li>
            </ul>
        """,
        "key_points": [
            "2FA = Double authentification obligatoire",
            "Préférer Google Authenticator au SMS",
            "Sauvegarder les codes de récupération"
        ],
        "quiz": []
    },
    (1, 7): {
        "title": "Effectuer son premier dépôt",
        "video_url": "",
        "content": """
            <h3>💳 Méthodes de dépôt</h3>
            <ul>
                <li><strong>Carte bancaire</strong> : Rapide mais frais élevés</li>
                <li><strong>Virement SEPA</strong> : Moins cher, 1-3 jours</li>
                <li><strong>Crypto</strong> : Transfert depuis un autre wallet</li>
            </ul>
        """,
        "key_points": [
            "Le virement SEPA est le moins cher",
            "Vérifier les frais avant de déposer",
            "Commencer avec un petit montant"
        ],
        "quiz": []
    },
    (1, 8): {
        "title": "Quiz Module 1",
        "video_url": "",
        "is_quiz": True,
        "content": "<h3>🎯 Quiz - Introduction au Trading Crypto</h3>",
        "key_points": [],
        "quiz": [
            {
                "question": "Qu'est-ce qu'un exchange ?",
                "options": ["Un portefeuille", "Une plateforme d'échange", "Une cryptomonnaie", "Un indicateur"],
                "correct": 1
            },
            {
                "question": "Que signifie HODL ?",
                "options": ["Vendre rapidement", "Conserver ses cryptos", "Acheter en masse", "Analyser le marché"],
                "correct": 1
            }
        ]
    },
    
    # Module 2: Lecture des Graphiques
    (2, 1): {
        "title": "Introduction aux graphiques",
        "video_url": "",
        "content": """
            <h3>📈 Les Graphiques en Trading</h3>
            <p>Les graphiques sont l'outil principal du trader pour analyser les prix et prendre des décisions.</p>
            
            <h3>📊 Types de Graphiques</h3>
            <ul>
                <li><strong>Ligne</strong> : Simple, montre la tendance générale</li>
                <li><strong>Barres</strong> : OHLC (Open, High, Low, Close)</li>
                <li><strong>Chandeliers</strong> : Le plus utilisé en trading</li>
            </ul>
        """,
        "key_points": [
            "Les graphiques sont essentiels pour l'analyse technique",
            "Les chandeliers japonais sont les plus populaires",
            "Chaque type de graphique a ses avantages"
        ],
        "quiz": []
    },
    (2, 2): {
        "title": "Les chandeliers japonais",
        "video_url": "",
        "content": """
            <h3>🕯️ Les Chandeliers Japonais</h3>
            <p>Les chandeliers japonais sont originaires du Japon, utilisés depuis le 18e siècle pour trader le riz.</p>
            
            <h3>📊 Anatomie d'un Chandelier</h3>
            <ul>
                <li><strong>Corps</strong> : Différence entre ouverture et clôture</li>
                <li><strong>Mèches</strong> : Plus haut et plus bas de la période</li>
                <li><strong>Couleur</strong> : Vert (haussier) ou Rouge (baissier)</li>
            </ul>
            
            <h3>🎯 Patterns Importants</h3>
            <ul>
                <li><strong>Doji</strong> : Indécision du marché</li>
                <li><strong>Marteau</strong> : Potentiel retournement haussier</li>
                <li><strong>Étoile filante</strong> : Potentiel retournement baissier</li>
                <li><strong>Englobante</strong> : Signal fort de retournement</li>
            </ul>
        """,
        "key_points": [
            "Les chandeliers montrent 4 prix: Open, High, Low, Close",
            "La couleur indique si le prix a monté ou baissé",
            "Les patterns de chandeliers donnent des signaux de trading"
        ],
        "quiz": []
    },
    (2, 3): {
        "title": "Anatomie d'une bougie",
        "video_url": "",
        "content": """
            <h3>🕯️ Structure d'une Bougie</h3>
            <ul>
                <li><strong>Open (O)</strong> : Prix d'ouverture</li>
                <li><strong>High (H)</strong> : Plus haut de la période</li>
                <li><strong>Low (L)</strong> : Plus bas de la période</li>
                <li><strong>Close (C)</strong> : Prix de clôture</li>
            </ul>
            
            <h3>📏 Interprétation des Mèches</h3>
            <p>Une longue mèche haute indique une pression vendeuse. Une longue mèche basse indique une pression acheteuse.</p>
        """,
        "key_points": [
            "OHLC = Open, High, Low, Close",
            "Les mèches montrent la pression acheteur/vendeur",
            "Le corps montre la direction du mouvement"
        ],
        "quiz": []
    },
    (2, 4): {
        "title": "Les timeframes expliqués",
        "video_url": "",
        "content": """
            <h3>⏰ Les Timeframes (Unités de Temps)</h3>
            <ul>
                <li><strong>1m, 5m, 15m</strong> : Scalping</li>
                <li><strong>1h, 4h</strong> : Day trading</li>
                <li><strong>Daily, Weekly</strong> : Swing trading</li>
                <li><strong>Monthly</strong> : Position trading</li>
            </ul>
        """,
        "key_points": [
            "Chaque bougie représente une période de temps",
            "Les timeframes courts = plus de bruit",
            "Analyser plusieurs timeframes pour confirmation"
        ],
        "quiz": []
    },
    (2, 5): {
        "title": "Identifier une tendance",
        "video_url": "",
        "content": """
            <h3>📈 Types de Tendances</h3>
            <ul>
                <li><strong>Tendance haussière</strong> : Higher highs, higher lows</li>
                <li><strong>Tendance baissière</strong> : Lower highs, lower lows</li>
                <li><strong>Range/Consolidation</strong> : Prix stable entre deux niveaux</li>
            </ul>
        """,
        "key_points": [
            "Trader dans le sens de la tendance",
            "Higher highs + higher lows = tendance haussière",
            "Lower highs + lower lows = tendance baissière"
        ],
        "quiz": []
    },
    
    # Module 3: Gestion du Capital
    (3, 1): {
        "title": "Pourquoi la gestion du capital est cruciale",
        "video_url": "",
        "content": """
            <h3>💰 Money Management</h3>
            <p>La gestion du capital est la clé de la survie en trading. Sans elle, même les meilleurs traders échouent.</p>
            
            <h3>📊 La Règle des 1-2%</h3>
            <p>Ne risquez jamais plus de 1-2% de votre capital sur un seul trade.</p>
            
            <h3>🎯 Calcul de la Taille de Position</h3>
            <p>Taille = (Capital × Risque%) / (Prix d'entrée - Stop Loss)</p>
        """,
        "key_points": [
            "Ne jamais risquer plus de 1-2% par trade",
            "La gestion du risque est plus importante que les gains",
            "Calculez toujours votre taille de position"
        ],
        "quiz": []
    },
    (3, 2): {
        "title": "Calculer sa taille de position",
        "video_url": "",
        "content": """
            <h3>🧮 Formule de Calcul</h3>
            <p><strong>Taille = (Capital × Risque%) / Distance au Stop Loss</strong></p>
            
            <h3>📊 Exemple</h3>
            <p>Capital: 10,000€, Risque: 1%, Stop: 50 pips</p>
            <p>Taille = (10,000 × 0.01) / 50 = 2 lots</p>
        """,
        "key_points": [
            "Toujours calculer avant d'entrer en position",
            "Adapter la taille au risque, pas l'inverse",
            "Utiliser un calculateur de position"
        ],
        "quiz": []
    },
    
    # Module 8: Indicateurs Techniques
    (8, 1): {
        "title": "Introduction aux indicateurs",
        "video_url": "",
        "content": """
            <h3>📊 Les Indicateurs Techniques</h3>
            <p>Les indicateurs sont des outils mathématiques qui aident à analyser les prix.</p>
            
            <h3>🔧 Types d'Indicateurs</h3>
            <ul>
                <li><strong>Tendance</strong> : Moyennes mobiles, MACD</li>
                <li><strong>Momentum</strong> : RSI, Stochastique</li>
                <li><strong>Volatilité</strong> : Bandes de Bollinger, ATR</li>
                <li><strong>Volume</strong> : OBV, Volume Profile</li>
            </ul>
        """,
        "key_points": [
            "Les indicateurs aident à confirmer les signaux",
            "Ne pas utiliser trop d'indicateurs",
            "Combinez différents types pour une meilleure analyse"
        ],
        "quiz": []
    },
    (8, 2): {
        "title": "RSI (Relative Strength Index)",
        "video_url": "",
        "content": """
            <h3>📈 Le RSI Expliqué</h3>
            <p>Le RSI mesure la force relative des mouvements haussiers vs baissiers sur une période donnée (généralement 14).</p>
            
            <h3>📊 Interprétation</h3>
            <ul>
                <li><strong>Au-dessus de 70</strong> : Zone de surachat</li>
                <li><strong>En-dessous de 30</strong> : Zone de survente</li>
                <li><strong>Autour de 50</strong> : Zone neutre</li>
            </ul>
            
            <h3>🎯 Divergences RSI</h3>
            <p>Une divergence entre le prix et le RSI peut signaler un retournement imminent.</p>
        """,
        "key_points": [
            "RSI oscille entre 0 et 100",
            "70+ = surachat, 30- = survente",
            "Les divergences sont des signaux puissants"
        ],
        "quiz": []
    },
    (8, 3): {
        "title": "Divergences RSI",
        "video_url": "",
        "content": """
            <h3>📊 Les Divergences</h3>
            <ul>
                <li><strong>Divergence haussière</strong> : Prix fait des plus bas, RSI fait des plus hauts</li>
                <li><strong>Divergence baissière</strong> : Prix fait des plus hauts, RSI fait des plus bas</li>
            </ul>
        """,
        "key_points": [
            "Les divergences annoncent des retournements",
            "Chercher confirmation avec d'autres indicateurs",
            "Plus efficace sur les timeframes élevés"
        ],
        "quiz": []
    },
    (8, 4): {
        "title": "MACD (Moving Average Convergence Divergence)",
        "video_url": "",
        "content": """
            <h3>📊 Le MACD Expliqué</h3>
            <p>Le MACD est un indicateur de tendance qui montre la relation entre deux moyennes mobiles.</p>
            
            <h3>🔧 Composants</h3>
            <ul>
                <li><strong>Ligne MACD</strong> : EMA 12 - EMA 26</li>
                <li><strong>Ligne Signal</strong> : EMA 9 de la ligne MACD</li>
                <li><strong>Histogramme</strong> : Différence entre MACD et Signal</li>
            </ul>
            
            <h3>🎯 Signaux de Trading</h3>
            <ul>
                <li><strong>Croisement haussier</strong> : MACD croise au-dessus du signal</li>
                <li><strong>Croisement baissier</strong> : MACD croise en-dessous du signal</li>
            </ul>
        """,
        "key_points": [
            "MACD combine tendance et momentum",
            "Les croisements donnent des signaux d'achat/vente",
            "L'histogramme montre la force de la tendance"
        ],
        "quiz": []
    },
    (8, 6): {
        "title": "Bandes de Bollinger",
        "video_url": "",
        "content": """
            <h3>📊 Les Bandes de Bollinger</h3>
            <p>Indicateur de volatilité composé de 3 lignes basées sur une moyenne mobile et l'écart-type.</p>
            
            <h3>🔧 Composants</h3>
            <ul>
                <li><strong>Bande médiane</strong> : SMA 20</li>
                <li><strong>Bande supérieure</strong> : SMA + 2 écarts-types</li>
                <li><strong>Bande inférieure</strong> : SMA - 2 écarts-types</li>
            </ul>
        """,
        "key_points": [
            "Les bandes s'élargissent avec la volatilité",
            "Le prix reste 95% du temps dans les bandes",
            "Squeeze = consolidation avant mouvement"
        ],
        "quiz": []
    },
    (8, 7): {
        "title": "Moyennes Mobiles",
        "video_url": "",
        "content": """
            <h3>📊 Les Moyennes Mobiles</h3>
            <ul>
                <li><strong>SMA</strong> : Simple Moving Average</li>
                <li><strong>EMA</strong> : Exponential Moving Average (plus réactive)</li>
            </ul>
            
            <h3>🎯 Périodes Populaires</h3>
            <ul>
                <li><strong>MA 20</strong> : Court terme</li>
                <li><strong>MA 50</strong> : Moyen terme</li>
                <li><strong>MA 200</strong> : Long terme</li>
            </ul>
        """,
        "key_points": [
            "EMA réagit plus vite que SMA",
            "Golden Cross = MA 50 croise MA 200 vers le haut",
            "Death Cross = MA 50 croise MA 200 vers le bas"
        ],
        "quiz": []
    }
}

def get_lesson_content(module_id: int, lesson_id: int) -> dict:
    """Récupère le contenu d'une leçon avec vidéo YouTube."""
    key = (module_id, lesson_id)
    
    # Get base content
    if key in LESSON_CONTENT:
        lesson = LESSON_CONTENT[key].copy()
    else:
        lesson = {
            "title": f"Leçon {lesson_id}",
            "video_url": "",
            "content": """
                <h3>📚 Contenu en cours de développement</h3>
                <p>Cette leçon est en cours de préparation par notre équipe pédagogique.</p>
                <p>En attendant, n'hésitez pas à revoir les leçons précédentes.</p>
            """,
            "key_points": ["Contenu en cours de développement"],
            "quiz": []
        }
    
    # Override video_url with YouTube video if available
    youtube_url = get_video_url(module_id, lesson_id)
    if youtube_url:
        lesson["video_url"] = youtube_url
    
    return lesson