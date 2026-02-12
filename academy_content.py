"""
Contenu détaillé des leçons de l'Academy Trading
22 Modules complets avec vidéos YouTube en français
"""
from youtube_videos import get_video_url

LESSON_CONTENT = {
    # ============================================
    # MODULE 1: Qu'est-ce que le trading crypto ?
    # Vidéo: https://youtu.be/TbKgV8mZvOE
    # ============================================
    (1, 1): {
        "title": "Introduction au Trading Crypto",
        "video_url": "",
        "content": """
            <h3>🎯 Qu'est-ce que le Trading de Cryptomonnaies ?</h3>
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
        "quiz": []
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
                <li><strong>Layer 2</strong> : Solutions de scaling (Polygon, Arbitrum, Optimism)</li>
                <li><strong>DeFi</strong> : Finance décentralisée (AAVE, UNI, COMP)</li>
                <li><strong>Stablecoins</strong> : Cryptos indexées au dollar (USDT, USDC, DAI)</li>
                <li><strong>Memecoins</strong> : Cryptos communautaires (DOGE, SHIB, PEPE)</li>
            </ul>
        """,
        "key_points": [
            "Bitcoin est la première crypto et reste la référence du marché",
            "Ethereum permet les smart contracts et les applications décentralisées",
            "Les cryptos se classent en plusieurs catégories selon leur utilité",
            "La capitalisation aide à évaluer la taille et la maturité d'un projet"
        ],
        "quiz": []
    },
    (1, 3): {
        "title": "Comment fonctionne un exchange",
        "video_url": "",
        "content": """
            <h3>🏦 Qu'est-ce qu'un Exchange ?</h3>
            <p>Un exchange (ou plateforme d'échange) est un service qui permet d'acheter, vendre et échanger des cryptomonnaies contre d'autres cryptos ou des devises traditionnelles (EUR, USD).</p>
            
            <h3>📊 Types d'Exchanges</h3>
            <ul>
                <li><strong>CEX (Centralized Exchange)</strong> : Binance, Coinbase, Kraken - Gérés par une entreprise, plus faciles à utiliser</li>
                <li><strong>DEX (Decentralized Exchange)</strong> : Uniswap, SushiSwap, PancakeSwap - Sans intermédiaire, vous gardez vos clés</li>
            </ul>
            
            <h3>💰 Le Carnet d'Ordres (Order Book)</h3>
            <p>Le carnet d'ordres affiche tous les ordres d'achat (bids) et de vente (asks) en attente. Il permet de voir la liquidité disponible à chaque niveau de prix.</p>
            
            <h3>📈 Spread et Liquidité</h3>
            <p>Le spread est la différence entre le meilleur prix d'achat et le meilleur prix de vente. Plus la liquidité est élevée, plus le spread est faible.</p>
        """,
        "key_points": [
            "Un exchange permet d'acheter et vendre des cryptos",
            "CEX sont centralisés et faciles, DEX sont décentralisés et autonomes",
            "Le carnet d'ordres montre l'offre et la demande en temps réel",
            "La liquidité affecte le spread et la facilité d'exécution"
        ],
        "quiz": []
    },
    (1, 4): {
        "title": "Vocabulaire essentiel du trader",
        "video_url": "",
        "content": """
            <h3>📖 Vocabulaire Trading Essentiel</h3>
            <ul>
                <li><strong>Bull Market</strong> : Marché haussier, tendance à la hausse</li>
                <li><strong>Bear Market</strong> : Marché baissier, tendance à la baisse</li>
                <li><strong>Long</strong> : Position acheteuse, on parie sur la hausse</li>
                <li><strong>Short</strong> : Position vendeuse, on parie sur la baisse</li>
                <li><strong>ATH (All-Time High)</strong> : Plus haut historique</li>
                <li><strong>ATL (All-Time Low)</strong> : Plus bas historique</li>
                <li><strong>HODL</strong> : Hold On for Dear Life - Conserver ses cryptos</li>
                <li><strong>FOMO</strong> : Fear Of Missing Out - Peur de rater une opportunité</li>
                <li><strong>FUD</strong> : Fear, Uncertainty, Doubt - Peur, incertitude, doute</li>
                <li><strong>Whale</strong> : Gros investisseur avec beaucoup de capital</li>
                <li><strong>Pump</strong> : Hausse rapide et forte du prix</li>
                <li><strong>Dump</strong> : Baisse rapide et forte du prix</li>
                <li><strong>Dip</strong> : Baisse temporaire du prix</li>
                <li><strong>Moon</strong> : Hausse extrême ("to the moon")</li>
            </ul>
        """,
        "key_points": [
            "Bull = haussier, Bear = baissier",
            "Long = achat (pari sur la hausse), Short = vente (pari sur la baisse)",
            "FOMO et FUD sont des émotions dangereuses à contrôler",
            "Les whales peuvent influencer fortement les prix"
        ],
        "quiz": []
    },
    (1, 5): {
        "title": "Créer son compte sur un exchange",
        "video_url": "",
        "content": """
            <h3>📝 Étapes pour créer un compte</h3>
            <ol>
                <li><strong>Choisir un exchange réputé</strong> : Binance, Coinbase, Kraken, Bybit</li>
                <li><strong>S'inscrire</strong> : Email et mot de passe fort (12+ caractères, majuscules, chiffres, symboles)</li>
                <li><strong>Vérifier son identité (KYC)</strong> : Passeport ou carte d'identité + selfie</li>
                <li><strong>Activer la double authentification (2FA)</strong> : Google Authenticator recommandé</li>
                <li><strong>Sécuriser son compte</strong> : Anti-phishing code, whitelist de retrait</li>
            </ol>
            
            <h3>🔒 Conseils de Sécurité</h3>
            <ul>
                <li>Utilisez un email dédié uniquement au trading</li>
                <li>Ne partagez jamais vos identifiants</li>
                <li>Méfiez-vous des emails de phishing</li>
                <li>Vérifiez toujours l'URL du site</li>
            </ul>
        """,
        "key_points": [
            "Choisir un exchange régulé et réputé",
            "La vérification KYC est obligatoire sur les CEX",
            "Toujours activer le 2FA pour sécuriser son compte",
            "Utiliser un email dédié et un mot de passe unique"
        ],
        "quiz": []
    },
    (1, 6): {
        "title": "Sécuriser son compte (2FA)",
        "video_url": "",
        "content": """
            <h3>🔐 La Double Authentification (2FA)</h3>
            <p>Le 2FA (Two-Factor Authentication) ajoute une couche de sécurité en demandant un code temporaire en plus du mot de passe. Même si quelqu'un vole votre mot de passe, il ne pourra pas accéder à votre compte sans le code 2FA.</p>
            
            <h3>📱 Types de 2FA</h3>
            <ul>
                <li><strong>Google Authenticator / Authy</strong> : Application recommandée, codes qui changent toutes les 30 secondes</li>
                <li><strong>SMS</strong> : Moins sécurisé (risque de SIM swap)</li>
                <li><strong>Clé physique (YubiKey)</strong> : Le plus sécurisé, mais plus contraignant</li>
                <li><strong>Email</strong> : Acceptable mais moins pratique</li>
            </ul>
            
            <h3>⚠️ Important : Sauvegarder les codes de récupération</h3>
            <p>Lors de l'activation du 2FA, vous recevez des codes de récupération. Notez-les sur papier et gardez-les en lieu sûr. Si vous perdez votre téléphone, ces codes seront votre seul moyen de récupérer l'accès.</p>
        """,
        "key_points": [
            "2FA = Double authentification, indispensable pour la sécurité",
            "Préférer Google Authenticator ou Authy au SMS",
            "Sauvegarder les codes de récupération sur papier",
            "Ne jamais partager ses codes 2FA"
        ],
        "quiz": []
    },
    (1, 7): {
        "title": "Effectuer son premier dépôt",
        "video_url": "",
        "content": """
            <h3>💳 Méthodes de dépôt</h3>
            <ul>
                <li><strong>Carte bancaire (Visa/Mastercard)</strong> : Rapide (instantané) mais frais élevés (1.5-3%)</li>
                <li><strong>Virement SEPA</strong> : Moins cher (souvent gratuit), délai 1-3 jours ouvrés</li>
                <li><strong>Virement instantané</strong> : Rapide et peu cher si disponible</li>
                <li><strong>Crypto</strong> : Transfert depuis un autre wallet ou exchange</li>
                <li><strong>P2P (Peer-to-Peer)</strong> : Achat direct à d'autres utilisateurs</li>
            </ul>
            
            <h3>💡 Conseils pour le premier dépôt</h3>
            <ul>
                <li>Commencez avec un petit montant pour tester</li>
                <li>Vérifiez les frais avant de déposer</li>
                <li>Le virement SEPA est généralement le moins cher</li>
                <li>Ne déposez jamais plus que ce que vous pouvez perdre</li>
            </ul>
        """,
        "key_points": [
            "Le virement SEPA est le moins cher mais plus lent",
            "La carte bancaire est rapide mais avec des frais",
            "Toujours vérifier les frais avant de déposer",
            "Commencer avec un petit montant pour tester"
        ],
        "quiz": []
    },
    (1, 8): {
        "title": "Quiz Module 1",
        "video_url": "",
        "is_quiz": True,
        "content": "<h3>🎯 Quiz - Introduction au Trading Crypto</h3><p>Testez vos connaissances sur les bases du trading crypto.</p>",
        "key_points": [],
        "quiz": [
            {
                "question": "Qu'est-ce qu'un exchange ?",
                "options": ["Un portefeuille crypto", "Une plateforme d'échange de cryptomonnaies", "Une cryptomonnaie", "Un indicateur technique"],
                "correct": 1
            },
            {
                "question": "Que signifie HODL ?",
                "options": ["Vendre rapidement", "Conserver ses cryptos sur le long terme", "Acheter en masse", "Analyser le marché"],
                "correct": 1
            },
            {
                "question": "Quel type de 2FA est le plus recommandé ?",
                "options": ["SMS", "Email", "Google Authenticator", "Aucun"],
                "correct": 2
            },
            {
                "question": "Les marchés crypto sont ouverts :",
                "options": ["Du lundi au vendredi", "24h/24, 5j/7", "24h/24, 7j/7", "Uniquement le week-end"],
                "correct": 2
            }
        ]
    },
    
    # ============================================
    # MODULE 2: Introduction aux graphiques
    # Vidéo: https://youtu.be/zAjemUdp2bc
    # ============================================
    (2, 1): {
        "title": "Introduction aux graphiques de trading",
        "video_url": "",
        "content": """
            <h3>📊 Pourquoi les graphiques sont essentiels</h3>
            <p>Les graphiques sont l'outil principal du trader. Ils permettent de visualiser l'évolution du prix dans le temps et d'identifier des opportunités de trading.</p>
            
            <h3>📈 Types de graphiques</h3>
            <ul>
                <li><strong>Graphique en ligne</strong> : Simple, montre uniquement le prix de clôture</li>
                <li><strong>Graphique en barres (OHLC)</strong> : Montre Open, High, Low, Close</li>
                <li><strong>Graphique en chandeliers japonais</strong> : Le plus utilisé, visuellement riche</li>
                <li><strong>Graphique Heikin-Ashi</strong> : Chandeliers lissés pour voir la tendance</li>
            </ul>
            
            <h3>🎯 Informations clés d'un graphique</h3>
            <ul>
                <li><strong>Axe X</strong> : Le temps (de gauche à droite)</li>
                <li><strong>Axe Y</strong> : Le prix (de bas en haut)</li>
                <li><strong>Volume</strong> : Souvent affiché en bas du graphique</li>
            </ul>
        """,
        "key_points": [
            "Les graphiques visualisent l'évolution du prix dans le temps",
            "Les chandeliers japonais sont les plus utilisés",
            "L'axe X représente le temps, l'axe Y le prix",
            "Le volume montre l'activité du marché"
        ],
        "quiz": []
    },
    (2, 2): {
        "title": "Les chandeliers japonais",
        "video_url": "",
        "content": """
            <h3>🕯️ Anatomie d'un chandelier</h3>
            <p>Chaque chandelier représente une période de temps (1 minute, 1 heure, 1 jour, etc.) et contient 4 informations :</p>
            <ul>
                <li><strong>Open (Ouverture)</strong> : Prix au début de la période</li>
                <li><strong>High (Plus haut)</strong> : Prix maximum atteint</li>
                <li><strong>Low (Plus bas)</strong> : Prix minimum atteint</li>
                <li><strong>Close (Clôture)</strong> : Prix à la fin de la période</li>
            </ul>
            
            <h3>🟢🔴 Couleurs des chandeliers</h3>
            <ul>
                <li><strong>Chandelier vert/blanc (haussier)</strong> : Close > Open (le prix a monté)</li>
                <li><strong>Chandelier rouge/noir (baissier)</strong> : Close < Open (le prix a baissé)</li>
            </ul>
            
            <h3>📏 Corps et mèches</h3>
            <ul>
                <li><strong>Corps</strong> : Rectangle entre Open et Close</li>
                <li><strong>Mèche haute</strong> : Ligne au-dessus du corps jusqu'au High</li>
                <li><strong>Mèche basse</strong> : Ligne en-dessous du corps jusqu'au Low</li>
            </ul>
        """,
        "key_points": [
            "Un chandelier contient 4 prix : Open, High, Low, Close",
            "Vert = haussier (prix monte), Rouge = baissier (prix baisse)",
            "Le corps montre la différence entre ouverture et clôture",
            "Les mèches montrent les extrêmes de la période"
        ],
        "quiz": []
    },
    (2, 3): {
        "title": "Les timeframes (unités de temps)",
        "video_url": "",
        "content": """
            <h3>⏰ Qu'est-ce qu'un timeframe ?</h3>
            <p>Le timeframe est l'unité de temps représentée par chaque chandelier. Choisir le bon timeframe est crucial pour votre style de trading.</p>
            
            <h3>📊 Timeframes courants</h3>
            <ul>
                <li><strong>1m, 5m, 15m</strong> : Scalping, très court terme</li>
                <li><strong>1H, 4H</strong> : Day trading, intraday</li>
                <li><strong>1D (Daily)</strong> : Swing trading, moyen terme</li>
                <li><strong>1W (Weekly)</strong> : Position trading, long terme</li>
                <li><strong>1M (Monthly)</strong> : Investissement, très long terme</li>
            </ul>
            
            <h3>💡 Analyse multi-timeframe</h3>
            <p>Les traders expérimentés analysent plusieurs timeframes :</p>
            <ul>
                <li><strong>Grand timeframe</strong> : Pour identifier la tendance principale</li>
                <li><strong>Timeframe intermédiaire</strong> : Pour affiner l'analyse</li>
                <li><strong>Petit timeframe</strong> : Pour les entrées précises</li>
            </ul>
        """,
        "key_points": [
            "Le timeframe détermine la durée de chaque chandelier",
            "Scalping = petits timeframes, Swing = grands timeframes",
            "L'analyse multi-timeframe améliore la précision",
            "Commencez par les timeframes plus grands (4H, 1D)"
        ],
        "quiz": []
    },
    (2, 4): {
        "title": "Identifier une tendance",
        "video_url": "",
        "content": """
            <h3>📈 Les trois types de tendances</h3>
            <ul>
                <li><strong>Tendance haussière (Uptrend)</strong> : Sommets et creux de plus en plus hauts</li>
                <li><strong>Tendance baissière (Downtrend)</strong> : Sommets et creux de plus en plus bas</li>
                <li><strong>Range/Consolidation</strong> : Prix oscillant entre deux niveaux</li>
            </ul>
            
            <h3>🔍 Comment identifier une tendance</h3>
            <ul>
                <li><strong>Visuellement</strong> : Regardez la direction générale du prix</li>
                <li><strong>Higher Highs / Higher Lows</strong> : Tendance haussière</li>
                <li><strong>Lower Highs / Lower Lows</strong> : Tendance baissière</li>
                <li><strong>Moyennes mobiles</strong> : Prix au-dessus = haussier, en-dessous = baissier</li>
            </ul>
            
            <h3>💡 La règle d'or</h3>
            <p><strong>"The trend is your friend"</strong> - Tradez toujours dans le sens de la tendance principale pour maximiser vos chances de succès.</p>
        """,
        "key_points": [
            "3 types de tendances : haussière, baissière, range",
            "Higher Highs + Higher Lows = tendance haussière",
            "Lower Highs + Lower Lows = tendance baissière",
            "Tradez dans le sens de la tendance (trend following)"
        ],
        "quiz": []
    },
    (2, 5): {
        "title": "Lignes de tendance",
        "video_url": "",
        "content": """
            <h3>📏 Qu'est-ce qu'une ligne de tendance ?</h3>
            <p>Une ligne de tendance est une ligne droite qui connecte plusieurs points de prix pour visualiser la direction du marché.</p>
            
            <h3>📈 Tracer une ligne de tendance haussière</h3>
            <ul>
                <li>Connectez au moins 2-3 creux (points bas) consécutifs</li>
                <li>La ligne doit monter de gauche à droite</li>
                <li>Plus il y a de points de contact, plus la ligne est valide</li>
            </ul>
            
            <h3>📉 Tracer une ligne de tendance baissière</h3>
            <ul>
                <li>Connectez au moins 2-3 sommets (points hauts) consécutifs</li>
                <li>La ligne doit descendre de gauche à droite</li>
                <li>La cassure de cette ligne peut signaler un retournement</li>
            </ul>
            
            <h3>⚠️ Cassure de ligne de tendance</h3>
            <p>Quand le prix casse une ligne de tendance avec du volume, cela peut indiquer un changement de tendance.</p>
        """,
        "key_points": [
            "Une ligne de tendance connecte plusieurs points de prix",
            "Minimum 2-3 points de contact pour valider une ligne",
            "La cassure d'une ligne peut signaler un retournement",
            "Plus la ligne est testée, plus elle est significative"
        ],
        "quiz": []
    },
    (2, 6): {
        "title": "Patterns de chandeliers de base",
        "video_url": "",
        "content": """
            <h3>🕯️ Patterns de retournement haussier</h3>
            <ul>
                <li><strong>Marteau (Hammer)</strong> : Petit corps en haut, longue mèche basse - Signal d'achat après une baisse</li>
                <li><strong>Doji</strong> : Corps très petit, mèches égales - Indécision, possible retournement</li>
                <li><strong>Engulfing haussier</strong> : Grande bougie verte qui englobe la rouge précédente</li>
            </ul>
            
            <h3>🕯️ Patterns de retournement baissier</h3>
            <ul>
                <li><strong>Étoile filante (Shooting Star)</strong> : Petit corps en bas, longue mèche haute - Signal de vente après une hausse</li>
                <li><strong>Pendu (Hanging Man)</strong> : Comme le marteau mais après une hausse</li>
                <li><strong>Engulfing baissier</strong> : Grande bougie rouge qui englobe la verte précédente</li>
            </ul>
        """,
        "key_points": [
            "Le marteau signale un possible retournement haussier",
            "L'étoile filante signale un possible retournement baissier",
            "Le doji indique l'indécision du marché",
            "L'engulfing est un signal fort de retournement"
        ],
        "quiz": []
    },
    (2, 7): {
        "title": "Introduction au volume",
        "video_url": "",
        "content": """
            <h3>📊 Qu'est-ce que le volume ?</h3>
            <p>Le volume représente le nombre d'unités échangées pendant une période donnée. C'est un indicateur crucial qui confirme ou infirme les mouvements de prix.</p>
            
            <h3>💡 Interprétation du volume</h3>
            <ul>
                <li><strong>Volume élevé + hausse</strong> : Mouvement fort, tendance confirmée</li>
                <li><strong>Volume faible + hausse</strong> : Mouvement faible, méfiance</li>
                <li><strong>Volume élevé + baisse</strong> : Pression vendeuse forte</li>
                <li><strong>Volume en augmentation</strong> : Intérêt croissant pour l'actif</li>
            </ul>
            
            <h3>🔍 Volume et breakouts</h3>
            <p>Un breakout (cassure) accompagné d'un fort volume a plus de chances de réussir qu'un breakout avec un faible volume.</p>
        """,
        "key_points": [
            "Le volume mesure l'activité du marché",
            "Un mouvement avec du volume est plus fiable",
            "Le volume confirme ou infirme les mouvements de prix",
            "Les breakouts doivent être accompagnés de volume"
        ],
        "quiz": []
    },
    (2, 8): {
        "title": "Utiliser TradingView",
        "video_url": "",
        "content": """
            <h3>📈 TradingView - L'outil incontournable</h3>
            <p>TradingView est la plateforme de graphiques la plus populaire pour l'analyse technique. Elle offre des outils puissants et une interface intuitive.</p>
            
            <h3>🔧 Fonctionnalités essentielles</h3>
            <ul>
                <li><strong>Graphiques interactifs</strong> : Zoom, défilement, multi-timeframes</li>
                <li><strong>Outils de dessin</strong> : Lignes de tendance, Fibonacci, rectangles</li>
                <li><strong>Indicateurs</strong> : RSI, MACD, Bollinger, et des centaines d'autres</li>
                <li><strong>Alertes</strong> : Notifications quand le prix atteint un niveau</li>
                <li><strong>Screeners</strong> : Filtrer les actifs selon des critères</li>
            </ul>
            
            <h3>💡 Astuces TradingView</h3>
            <ul>
                <li>Utilisez les raccourcis clavier pour gagner du temps</li>
                <li>Sauvegardez vos layouts et templates</li>
                <li>Suivez des traders expérimentés pour apprendre</li>
            </ul>
        """,
        "key_points": [
            "TradingView est l'outil de référence pour l'analyse technique",
            "Maîtrisez les outils de dessin et les indicateurs",
            "Les alertes vous permettent de ne pas rater d'opportunités",
            "Sauvegardez vos configurations pour gagner du temps"
        ],
        "quiz": []
    },
    (2, 9): {
        "title": "Exercices pratiques",
        "video_url": "",
        "content": """
            <h3>🎯 Exercice 1 : Identifier la tendance</h3>
            <p>Ouvrez TradingView sur BTC/USDT en daily. Identifiez si nous sommes en tendance haussière, baissière ou en range.</p>
            
            <h3>🎯 Exercice 2 : Tracer des lignes de tendance</h3>
            <p>Sur le même graphique, tracez les lignes de tendance principales en connectant les sommets ou les creux.</p>
            
            <h3>🎯 Exercice 3 : Repérer des patterns</h3>
            <p>Cherchez des patterns de chandeliers (marteau, doji, engulfing) sur les dernières semaines.</p>
            
            <h3>🎯 Exercice 4 : Analyser le volume</h3>
            <p>Observez le volume lors des mouvements importants. Le volume confirme-t-il les mouvements ?</p>
        """,
        "key_points": [
            "La pratique est essentielle pour progresser",
            "Commencez par analyser les grands timeframes",
            "Notez vos observations dans un journal de trading",
            "Comparez vos analyses avec celles d'autres traders"
        ],
        "quiz": []
    },
    (2, 10): {
        "title": "Quiz Module 2",
        "video_url": "",
        "is_quiz": True,
        "content": "<h3>🎯 Quiz - Lecture des Graphiques</h3><p>Testez vos connaissances sur les graphiques et l'analyse technique de base.</p>",
        "key_points": [],
        "quiz": [
            {
                "question": "Que représente un chandelier vert ?",
                "options": ["Le prix a baissé", "Le prix a monté", "Le prix n'a pas bougé", "Le volume est élevé"],
                "correct": 1
            },
            {
                "question": "Qu'est-ce qu'un timeframe ?",
                "options": ["Un indicateur technique", "L'unité de temps d'un chandelier", "Un type de graphique", "Une stratégie de trading"],
                "correct": 1
            },
            {
                "question": "Comment identifier une tendance haussière ?",
                "options": ["Lower Highs et Lower Lows", "Higher Highs et Higher Lows", "Prix stable", "Volume en baisse"],
                "correct": 1
            },
            {
                "question": "Que signifie un marteau (hammer) ?",
                "options": ["Signal de vente", "Signal d'achat potentiel", "Tendance neutre", "Forte volatilité"],
                "correct": 1
            }
        ]
    },
    
    # ============================================
    # MODULE 3: Gestion du Capital
    # Vidéo: https://youtu.be/berx5Yna0Lw
    # ============================================
    (3, 1): {
        "title": "Pourquoi la gestion du capital est cruciale",
        "video_url": "",
        "content": """
            <h3>💰 L'importance du Money Management</h3>
            <p>La gestion du capital (money management) est LA compétence la plus importante en trading. Même avec une stratégie gagnante, une mauvaise gestion du risque peut vous ruiner.</p>
            
            <h3>📊 Statistiques révélatrices</h3>
            <ul>
                <li>90% des traders perdent de l'argent</li>
                <li>La principale raison : mauvaise gestion du risque</li>
                <li>Un bon money management peut transformer une stratégie moyenne en stratégie profitable</li>
            </ul>
            
            <h3>🎯 Objectifs du Money Management</h3>
            <ul>
                <li><strong>Préserver le capital</strong> : Survivre aux pertes inévitables</li>
                <li><strong>Maximiser les gains</strong> : Profiter des trades gagnants</li>
                <li><strong>Contrôler les émotions</strong> : Réduire le stress et la peur</li>
                <li><strong>Assurer la longévité</strong> : Rester dans le jeu sur le long terme</li>
            </ul>
        """,
        "key_points": [
            "Le money management est plus important que la stratégie",
            "90% des traders perdent à cause d'une mauvaise gestion du risque",
            "L'objectif principal est de préserver le capital",
            "Un bon money management réduit le stress émotionnel"
        ],
        "quiz": []
    },
    (3, 2): {
        "title": "La règle des 1-2%",
        "video_url": "",
        "content": """
            <h3>📏 La règle d'or : Ne jamais risquer plus de 1-2% par trade</h3>
            <p>Cette règle simple mais puissante stipule que vous ne devez jamais risquer plus de 1 à 2% de votre capital total sur un seul trade.</p>
            
            <h3>📊 Exemple concret</h3>
            <ul>
                <li><strong>Capital</strong> : 10 000€</li>
                <li><strong>Risque max par trade (2%)</strong> : 200€</li>
                <li>Si vous perdez, vous perdez maximum 200€</li>
                <li>Il faudrait 50 trades perdants consécutifs pour perdre tout votre capital</li>
            </ul>
            
            <h3>💡 Pourquoi 1-2% ?</h3>
            <ul>
                <li>Permet de survivre aux séries de pertes (drawdowns)</li>
                <li>Réduit l'impact émotionnel des pertes</li>
                <li>Laisse le temps d'apprendre et de s'améliorer</li>
                <li>Les traders professionnels utilisent souvent 0.5-1%</li>
            </ul>
        """,
        "key_points": [
            "Ne jamais risquer plus de 1-2% du capital par trade",
            "Cette règle protège contre les séries de pertes",
            "Les professionnels risquent souvent moins de 1%",
            "Le risque se calcule par rapport au capital total"
        ],
        "quiz": []
    },
    (3, 3): {
        "title": "Calculer sa taille de position",
        "video_url": "",
        "content": """
            <h3>🧮 Formule de calcul de position</h3>
            <p><strong>Taille de position = (Capital × Risque%) / Distance au Stop Loss</strong></p>
            
            <h3>📊 Exemple détaillé</h3>
            <ul>
                <li><strong>Capital</strong> : 10 000€</li>
                <li><strong>Risque</strong> : 2% = 200€</li>
                <li><strong>Prix d'entrée BTC</strong> : 50 000€</li>
                <li><strong>Stop Loss</strong> : 48 000€ (4% en dessous)</li>
                <li><strong>Distance au SL</strong> : 2 000€ par BTC</li>
                <li><strong>Taille de position</strong> : 200€ / 2 000€ = 0.1 BTC</li>
            </ul>
            
            <h3>💡 Points importants</h3>
            <ul>
                <li>Toujours calculer AVANT d'entrer en position</li>
                <li>Le stop loss détermine la taille de position, pas l'inverse</li>
                <li>Utilisez un calculateur de position pour plus de précision</li>
            </ul>
        """,
        "key_points": [
            "Taille = (Capital × Risque%) / Distance au Stop Loss",
            "Calculez toujours avant d'entrer en position",
            "Le stop loss détermine la taille, pas l'inverse",
            "Utilisez des outils de calcul pour être précis"
        ],
        "quiz": []
    },
    (3, 4): {
        "title": "Stop Loss et Take Profit",
        "video_url": "",
        "content": """
            <h3>🛑 Le Stop Loss (SL)</h3>
            <p>Le stop loss est un ordre automatique qui ferme votre position si le prix atteint un certain niveau de perte. C'est votre filet de sécurité.</p>
            
            <h3>🎯 Le Take Profit (TP)</h3>
            <p>Le take profit est un ordre qui ferme automatiquement votre position quand elle atteint un certain niveau de gain.</p>
            
            <h3>📊 Où placer son Stop Loss ?</h3>
            <ul>
                <li>Sous un support pour un achat (long)</li>
                <li>Au-dessus d'une résistance pour une vente (short)</li>
                <li>En dessous/au-dessus d'un niveau technique significatif</li>
                <li>Jamais trop serré (éviter le bruit du marché)</li>
            </ul>
            
            <h3>⚠️ Règles importantes</h3>
            <ul>
                <li>TOUJOURS utiliser un stop loss</li>
                <li>Ne jamais déplacer son SL dans le sens de la perte</li>
                <li>Placer le SL avant d'entrer en position</li>
            </ul>
        """,
        "key_points": [
            "Le stop loss limite vos pertes automatiquement",
            "Le take profit sécurise vos gains",
            "Placez le SL sur des niveaux techniques",
            "Ne déplacez JAMAIS le SL dans le sens de la perte"
        ],
        "quiz": []
    },
    (3, 5): {
        "title": "Le ratio Risk/Reward",
        "video_url": "",
        "content": """
            <h3>📊 Qu'est-ce que le Risk/Reward (R:R) ?</h3>
            <p>Le ratio Risk/Reward compare le risque potentiel au gain potentiel d'un trade. C'est un outil essentiel pour évaluer la qualité d'une opportunité.</p>
            
            <h3>🧮 Calcul du R:R</h3>
            <p><strong>R:R = Gain potentiel / Risque potentiel</strong></p>
            <ul>
                <li><strong>Entrée</strong> : 100€</li>
                <li><strong>Stop Loss</strong> : 95€ (risque = 5€)</li>
                <li><strong>Take Profit</strong> : 115€ (gain = 15€)</li>
                <li><strong>R:R</strong> : 15/5 = 3:1 (ou 1:3)</li>
            </ul>
            
            <h3>💡 R:R minimum recommandé</h3>
            <ul>
                <li><strong>Minimum 1:2</strong> : Gain potentiel = 2× le risque</li>
                <li><strong>Idéal 1:3</strong> : Gain potentiel = 3× le risque</li>
                <li>Avec un R:R de 1:2, vous pouvez être profitable avec seulement 40% de trades gagnants</li>
            </ul>
        """,
        "key_points": [
            "R:R = Gain potentiel / Risque potentiel",
            "Visez minimum un R:R de 1:2",
            "Un bon R:R permet d'être profitable même avec moins de 50% de réussite",
            "Évaluez le R:R avant chaque trade"
        ],
        "quiz": []
    },
    (3, 6): {
        "title": "Quiz Module 3",
        "video_url": "",
        "is_quiz": True,
        "content": "<h3>🎯 Quiz - Gestion du Capital</h3><p>Testez vos connaissances sur le money management.</p>",
        "key_points": [],
        "quiz": [
            {
                "question": "Quel pourcentage maximum devez-vous risquer par trade ?",
                "options": ["5-10%", "1-2%", "10-20%", "50%"],
                "correct": 1
            },
            {
                "question": "Qu'est-ce qu'un stop loss ?",
                "options": ["Un ordre d'achat", "Un ordre qui limite les pertes", "Un indicateur technique", "Un type de graphique"],
                "correct": 1
            },
            {
                "question": "Un R:R de 1:3 signifie :",
                "options": ["Risque 3× plus grand que le gain", "Gain 3× plus grand que le risque", "Risque égal au gain", "Aucun risque"],
                "correct": 1
            },
            {
                "question": "Pourquoi le money management est-il crucial ?",
                "options": ["Pour gagner plus", "Pour survivre aux pertes", "Pour impressionner", "Ce n'est pas important"],
                "correct": 1
            }
        ]
    },
    
    # ============================================
    # MODULE 4: Types d'Ordres
    # Vidéo: https://youtu.be/ruPNWEuwrcg
    # ============================================
    (4, 1): {
        "title": "Ordre au marché (Market Order)",
        "video_url": "",
        "content": """
            <h3>🚀 Qu'est-ce qu'un ordre au marché ?</h3>
            <p>Un ordre au marché s'exécute immédiatement au meilleur prix disponible. C'est le type d'ordre le plus simple et le plus rapide.</p>
            
            <h3>✅ Avantages</h3>
            <ul>
                <li>Exécution garantie et instantanée</li>
                <li>Simple à utiliser</li>
                <li>Idéal pour entrer/sortir rapidement</li>
            </ul>
            
            <h3>❌ Inconvénients</h3>
            <ul>
                <li>Pas de contrôle sur le prix d'exécution</li>
                <li>Slippage possible (prix différent de celui affiché)</li>
                <li>Frais de taker (généralement plus élevés)</li>
            </ul>
            
            <h3>💡 Quand l'utiliser ?</h3>
            <p>Utilisez un ordre au marché quand la rapidité est plus importante que le prix exact, par exemple lors d'un breakout ou pour couper une perte rapidement.</p>
        """,
        "key_points": [
            "L'ordre au marché s'exécute immédiatement",
            "Pas de contrôle sur le prix exact",
            "Risque de slippage sur les marchés volatils",
            "Idéal pour les situations urgentes"
        ],
        "quiz": []
    },
    (4, 2): {
        "title": "Ordre limite (Limit Order)",
        "video_url": "",
        "content": """
            <h3>📊 Qu'est-ce qu'un ordre limite ?</h3>
            <p>Un ordre limite vous permet de spécifier le prix exact auquel vous voulez acheter ou vendre. L'ordre ne s'exécute que si le marché atteint votre prix.</p>
            
            <h3>📈 Ordre limite d'achat</h3>
            <ul>
                <li>Placé EN DESSOUS du prix actuel</li>
                <li>S'exécute quand le prix descend à votre niveau</li>
                <li>Exemple : Prix actuel 100€, ordre limite à 95€</li>
            </ul>
            
            <h3>📉 Ordre limite de vente</h3>
            <ul>
                <li>Placé AU DESSUS du prix actuel</li>
                <li>S'exécute quand le prix monte à votre niveau</li>
                <li>Exemple : Prix actuel 100€, ordre limite à 105€</li>
            </ul>
            
            <h3>✅ Avantages</h3>
            <ul>
                <li>Contrôle total sur le prix</li>
                <li>Frais de maker (généralement moins chers)</li>
                <li>Pas de slippage</li>
            </ul>
        """,
        "key_points": [
            "L'ordre limite spécifie un prix exact",
            "Achat limite = en dessous du prix actuel",
            "Vente limite = au dessus du prix actuel",
            "Pas de garantie d'exécution si le prix n'est pas atteint"
        ],
        "quiz": []
    },
    (4, 3): {
        "title": "Ordre Stop (Stop Order)",
        "video_url": "",
        "content": """
            <h3>🛑 Qu'est-ce qu'un ordre stop ?</h3>
            <p>Un ordre stop devient un ordre au marché quand le prix atteint un niveau spécifié. Il est utilisé pour limiter les pertes ou entrer sur un breakout.</p>
            
            <h3>📉 Stop Loss (pour limiter les pertes)</h3>
            <ul>
                <li><strong>Stop Loss d'achat</strong> : Placé en dessous du prix d'entrée pour un long</li>
                <li><strong>Stop Loss de vente</strong> : Placé au dessus du prix d'entrée pour un short</li>
            </ul>
            
            <h3>📈 Stop d'entrée (pour les breakouts)</h3>
            <ul>
                <li><strong>Buy Stop</strong> : Achat quand le prix MONTE au-dessus d'un niveau</li>
                <li><strong>Sell Stop</strong> : Vente quand le prix DESCEND en-dessous d'un niveau</li>
            </ul>
            
            <h3>⚠️ Attention au slippage</h3>
            <p>Les ordres stop peuvent subir du slippage car ils deviennent des ordres au marché une fois déclenchés.</p>
        """,
        "key_points": [
            "L'ordre stop se déclenche à un prix spécifié",
            "Utilisé pour les stop loss et les entrées sur breakout",
            "Devient un ordre au marché une fois déclenché",
            "Risque de slippage sur les marchés volatils"
        ],
        "quiz": []
    },
    (4, 4): {
        "title": "Ordre Stop-Limit",
        "video_url": "",
        "content": """
            <h3>🔄 Qu'est-ce qu'un ordre Stop-Limit ?</h3>
            <p>L'ordre stop-limit combine un ordre stop et un ordre limite. Quand le prix stop est atteint, un ordre limite est placé au lieu d'un ordre au marché.</p>
            
            <h3>📊 Deux prix à définir</h3>
            <ul>
                <li><strong>Prix Stop</strong> : Le prix qui déclenche l'ordre</li>
                <li><strong>Prix Limite</strong> : Le prix maximum/minimum d'exécution</li>
            </ul>
            
            <h3>📈 Exemple</h3>
            <ul>
                <li>Prix actuel : 100€</li>
                <li>Stop : 95€ (déclencheur)</li>
                <li>Limite : 94€ (prix minimum de vente)</li>
                <li>Si le prix descend à 95€, un ordre de vente limite à 94€ est placé</li>
            </ul>
            
            <h3>⚠️ Risque</h3>
            <p>Si le prix passe directement de 95€ à 93€ (gap), l'ordre limite à 94€ ne sera pas exécuté et vous resterez en position.</p>
        """,
        "key_points": [
            "Combine stop et limite pour plus de contrôle",
            "Deux prix à définir : stop et limite",
            "Évite le slippage mais risque de non-exécution",
            "Utile sur les marchés avec des gaps"
        ],
        "quiz": []
    },
    (4, 5): {
        "title": "Trailing Stop",
        "video_url": "",
        "content": """
            <h3>📈 Qu'est-ce qu'un Trailing Stop ?</h3>
            <p>Le trailing stop est un stop loss dynamique qui suit le prix quand il évolue en votre faveur, mais reste fixe quand le prix va contre vous.</p>
            
            <h3>🔧 Comment ça fonctionne</h3>
            <ul>
                <li>Vous définissez une distance (en % ou en valeur absolue)</li>
                <li>Le stop suit le prix à cette distance</li>
                <li>Si le prix monte, le stop monte aussi</li>
                <li>Si le prix baisse, le stop reste en place</li>
            </ul>
            
            <h3>📊 Exemple</h3>
            <ul>
                <li>Achat à 100€, trailing stop à 5%</li>
                <li>Stop initial : 95€</li>
                <li>Prix monte à 110€ → Stop monte à 104.5€</li>
                <li>Prix redescend à 104.5€ → Position fermée avec +4.5%</li>
            </ul>
            
            <h3>💡 Avantages</h3>
            <ul>
                <li>Protège les gains automatiquement</li>
                <li>Laisse courir les profits</li>
                <li>Pas besoin de surveiller constamment</li>
            </ul>
        """,
        "key_points": [
            "Le trailing stop suit le prix en votre faveur",
            "Protège les gains tout en laissant courir les profits",
            "Se définit en % ou en valeur absolue",
            "Idéal pour les tendances fortes"
        ],
        "quiz": []
    },
    (4, 6): {
        "title": "OCO (One Cancels Other)",
        "video_url": "",
        "content": """
            <h3>🔄 Qu'est-ce qu'un ordre OCO ?</h3>
            <p>OCO (One Cancels Other) permet de placer deux ordres simultanément. Quand l'un est exécuté, l'autre est automatiquement annulé.</p>
            
            <h3>📊 Utilisation typique</h3>
            <ul>
                <li>Placer un Take Profit ET un Stop Loss en même temps</li>
                <li>Si le TP est atteint, le SL est annulé</li>
                <li>Si le SL est atteint, le TP est annulé</li>
            </ul>
            
            <h3>💡 Avantages</h3>
            <ul>
                <li>Gestion automatique de la position</li>
                <li>Pas besoin de surveiller le marché 24/7</li>
                <li>Évite les erreurs humaines</li>
                <li>Discipline de trading automatisée</li>
            </ul>
        """,
        "key_points": [
            "OCO = deux ordres liés, un annule l'autre",
            "Idéal pour placer TP et SL simultanément",
            "Automatise la gestion de position",
            "Réduit le besoin de surveillance constante"
        ],
        "quiz": []
    },
    (4, 7): {
        "title": "Quiz Module 4",
        "video_url": "",
        "is_quiz": True,
        "content": "<h3>🎯 Quiz - Types d'Ordres</h3><p>Testez vos connaissances sur les différents types d'ordres.</p>",
        "key_points": [],
        "quiz": [
            {
                "question": "Un ordre au marché :",
                "options": ["S'exécute à un prix spécifique", "S'exécute immédiatement au meilleur prix", "Ne s'exécute jamais", "Est gratuit"],
                "correct": 1
            },
            {
                "question": "Un ordre limite d'achat est placé :",
                "options": ["Au-dessus du prix actuel", "En dessous du prix actuel", "Au prix actuel", "N'importe où"],
                "correct": 1
            },
            {
                "question": "Qu'est-ce qu'un trailing stop ?",
                "options": ["Un stop fixe", "Un stop qui suit le prix", "Un ordre d'achat", "Un indicateur"],
                "correct": 1
            },
            {
                "question": "OCO signifie :",
                "options": ["Order Creates Order", "One Cancels Other", "Only Crypto Orders", "Open Close Order"],
                "correct": 1
            }
        ]
    },
    
    # ============================================
    # MODULE 5: Sécurité & Wallets
    # Vidéo: https://youtu.be/_V0GMPq-MLQ
    # ============================================
    (5, 1): {
        "title": "Types de wallets crypto",
        "video_url": "",
        "content": """
            <h3>👛 Qu'est-ce qu'un wallet crypto ?</h3>
            <p>Un wallet (portefeuille) crypto est un outil qui stocke vos clés privées et vous permet d'envoyer/recevoir des cryptomonnaies.</p>
            
            <h3>🔥 Hot Wallets (connectés à Internet)</h3>
            <ul>
                <li><strong>Wallets d'exchange</strong> : Binance, Coinbase (pratique mais risqué)</li>
                <li><strong>Wallets mobiles</strong> : Trust Wallet, MetaMask Mobile</li>
                <li><strong>Wallets desktop</strong> : Exodus, Electrum</li>
                <li><strong>Extensions navigateur</strong> : MetaMask, Phantom</li>
            </ul>
            
            <h3>❄️ Cold Wallets (hors ligne)</h3>
            <ul>
                <li><strong>Hardware wallets</strong> : Ledger, Trezor (le plus sécurisé)</li>
                <li><strong>Paper wallets</strong> : Clés imprimées sur papier</li>
            </ul>
            
            <h3>💡 Règle d'or</h3>
            <p>"Not your keys, not your coins" - Si vous ne contrôlez pas vos clés privées, vous ne possédez pas vraiment vos cryptos.</p>
        """,
        "key_points": [
            "Hot wallet = connecté, pratique mais moins sécurisé",
            "Cold wallet = hors ligne, plus sécurisé",
            "Hardware wallet = meilleure sécurité pour gros montants",
            "Not your keys, not your coins"
        ],
        "quiz": []
    },
    (5, 2): {
        "title": "Seed phrase et clés privées",
        "video_url": "",
        "content": """
            <h3>🔑 La Seed Phrase (phrase de récupération)</h3>
            <p>La seed phrase est une série de 12 ou 24 mots qui permet de récupérer l'accès à votre wallet. C'est la clé maître de vos cryptos.</p>
            
            <h3>⚠️ RÈGLES ABSOLUES</h3>
            <ul>
                <li><strong>JAMAIS</strong> partager votre seed phrase avec quiconque</li>
                <li><strong>JAMAIS</strong> la stocker en ligne (email, cloud, photo)</li>
                <li><strong>JAMAIS</strong> la saisir sur un site web</li>
                <li><strong>TOUJOURS</strong> la noter sur papier et la garder en lieu sûr</li>
            </ul>
            
            <h3>🔐 Clé privée vs Clé publique</h3>
            <ul>
                <li><strong>Clé publique</strong> : Votre adresse, partageable pour recevoir des fonds</li>
                <li><strong>Clé privée</strong> : Permet de signer les transactions, JAMAIS à partager</li>
            </ul>
            
            <h3>💡 Stockage sécurisé</h3>
            <ul>
                <li>Écrivez sur papier ou gravez sur métal</li>
                <li>Faites plusieurs copies dans des lieux différents</li>
                <li>Utilisez un coffre-fort ou un lieu sécurisé</li>
            </ul>
        """,
        "key_points": [
            "La seed phrase = accès total à vos cryptos",
            "JAMAIS partager ou stocker en ligne",
            "Écrire sur papier et garder en lieu sûr",
            "Faire plusieurs copies dans des lieux différents"
        ],
        "quiz": []
    },
    (5, 3): {
        "title": "Sécurité sur les exchanges",
        "video_url": "",
        "content": """
            <h3>🔒 Sécuriser son compte exchange</h3>
            <ul>
                <li><strong>2FA obligatoire</strong> : Google Authenticator ou clé physique</li>
                <li><strong>Email dédié</strong> : Un email uniquement pour le trading</li>
                <li><strong>Mot de passe fort</strong> : 16+ caractères, unique</li>
                <li><strong>Anti-phishing code</strong> : Code personnel dans les emails officiels</li>
                <li><strong>Whitelist de retrait</strong> : Limiter les adresses de retrait autorisées</li>
            </ul>
            
            <h3>⚠️ Arnaques courantes</h3>
            <ul>
                <li><strong>Phishing</strong> : Faux sites qui imitent les exchanges</li>
                <li><strong>Faux support</strong> : Personnes se faisant passer pour le support</li>
                <li><strong>Giveaways</strong> : "Envoyez 1 BTC, recevez 2 BTC" = ARNAQUE</li>
                <li><strong>Pump & Dump</strong> : Groupes qui manipulent les prix</li>
            </ul>
            
            <h3>💡 Bonnes pratiques</h3>
            <ul>
                <li>Vérifiez toujours l'URL avant de vous connecter</li>
                <li>Ne cliquez jamais sur des liens dans les emails</li>
                <li>Le support ne vous demandera JAMAIS votre mot de passe</li>
            </ul>
        """,
        "key_points": [
            "Activez toutes les options de sécurité disponibles",
            "Méfiez-vous du phishing et des faux sites",
            "Le support ne demande jamais vos identifiants",
            "Si c'est trop beau pour être vrai, c'est une arnaque"
        ],
        "quiz": []
    },
    (5, 4): {
        "title": "Bonnes pratiques de sécurité",
        "video_url": "",
        "content": """
            <h3>🛡️ Checklist de sécurité</h3>
            <ul>
                <li>✅ 2FA activé sur tous les comptes</li>
                <li>✅ Seed phrase notée sur papier, jamais en ligne</li>
                <li>✅ Hardware wallet pour les gros montants</li>
                <li>✅ Mots de passe uniques pour chaque service</li>
                <li>✅ Gestionnaire de mots de passe (Bitwarden, 1Password)</li>
                <li>✅ VPN pour les connexions publiques</li>
                <li>✅ Antivirus et système à jour</li>
            </ul>
            
            <h3>📊 Répartition recommandée</h3>
            <ul>
                <li><strong>Trading actif</strong> : 10-20% sur l'exchange</li>
                <li><strong>Holding moyen terme</strong> : Hot wallet sécurisé</li>
                <li><strong>Holding long terme</strong> : Hardware wallet (Ledger/Trezor)</li>
            </ul>
            
            <h3>🚨 En cas de compromission</h3>
            <ol>
                <li>Transférez immédiatement vos fonds vers un nouveau wallet</li>
                <li>Changez tous vos mots de passe</li>
                <li>Contactez le support de l'exchange</li>
                <li>Vérifiez vos autres comptes</li>
            </ol>
        """,
        "key_points": [
            "Diversifiez le stockage de vos cryptos",
            "Hardware wallet pour les gros montants",
            "Utilisez un gestionnaire de mots de passe",
            "Agissez vite en cas de compromission"
        ],
        "quiz": []
    },
    (5, 5): {
        "title": "Quiz Module 5",
        "video_url": "",
        "is_quiz": True,
        "content": "<h3>🎯 Quiz - Sécurité & Wallets</h3><p>Testez vos connaissances sur la sécurité crypto.</p>",
        "key_points": [],
        "quiz": [
            {
                "question": "Qu'est-ce qu'un cold wallet ?",
                "options": ["Un wallet connecté à Internet", "Un wallet hors ligne", "Un wallet gratuit", "Un wallet d'exchange"],
                "correct": 1
            },
            {
                "question": "Que devez-vous faire avec votre seed phrase ?",
                "options": ["La partager avec le support", "La stocker sur Google Drive", "La noter sur papier et la garder en sécurité", "La mémoriser et la jeter"],
                "correct": 2
            },
            {
                "question": "Quel type de 2FA est le plus sécurisé ?",
                "options": ["SMS", "Email", "Google Authenticator ou clé physique", "Aucun"],
                "correct": 2
            },
            {
                "question": "'Not your keys, not your coins' signifie :",
                "options": ["Les clés sont importantes", "Sans contrôle des clés, vous ne possédez pas vraiment vos cryptos", "Les coins sont des clés", "Rien de particulier"],
                "correct": 1
            }
        ]
    },
    
    # ============================================
    # MODULE 6: Psychologie du Trader
    # Vidéo: https://youtu.be/L3ZvYq-5IfM
    # ============================================
    (6, 1): {
        "title": "Les émotions en trading",
        "video_url": "",
        "content": """
            <h3>🧠 Le trading est un jeu mental</h3>
            <p>80% du succès en trading vient de la psychologie, 20% de la stratégie. Maîtriser ses émotions est la clé de la réussite.</p>
            
            <h3>😰 Les émotions destructrices</h3>
            <ul>
                <li><strong>FOMO (Fear Of Missing Out)</strong> : Acheter par peur de rater une hausse</li>
                <li><strong>Peur</strong> : Vendre trop tôt ou ne pas entrer en position</li>
                <li><strong>Avidité</strong> : Ne pas prendre ses profits, vouloir toujours plus</li>
                <li><strong>Espoir</strong> : Garder une position perdante en espérant un retournement</li>
                <li><strong>Revenge trading</strong> : Trader pour récupérer une perte</li>
            </ul>
            
            <h3>💡 Impact des émotions</h3>
            <ul>
                <li>Décisions impulsives et irrationnelles</li>
                <li>Non-respect du plan de trading</li>
                <li>Overtrading (trop de trades)</li>
                <li>Pertes amplifiées</li>
            </ul>
        """,
        "key_points": [
            "80% du succès vient de la psychologie",
            "FOMO, peur et avidité sont les ennemis du trader",
            "Les émotions mènent à des décisions irrationnelles",
            "Le revenge trading amplifie les pertes"
        ],
        "quiz": []
    },
    (6, 2): {
        "title": "Discipline et plan de trading",
        "video_url": "",
        "content": """
            <h3>📋 L'importance d'un plan de trading</h3>
            <p>Un plan de trading est un ensemble de règles que vous suivez pour chaque trade. Il élimine les décisions émotionnelles.</p>
            
            <h3>📝 Éléments d'un plan de trading</h3>
            <ul>
                <li><strong>Critères d'entrée</strong> : Quand entrer en position ?</li>
                <li><strong>Critères de sortie</strong> : Quand sortir (TP et SL) ?</li>
                <li><strong>Gestion du risque</strong> : Combien risquer par trade ?</li>
                <li><strong>Timeframes</strong> : Quels graphiques analyser ?</li>
                <li><strong>Actifs</strong> : Quelles cryptos trader ?</li>
                <li><strong>Horaires</strong> : Quand trader ?</li>
            </ul>
            
            <h3>💪 Développer la discipline</h3>
            <ul>
                <li>Suivez votre plan sans exception</li>
                <li>Acceptez que certains trades seront perdants</li>
                <li>Ne modifiez pas votre plan en cours de trade</li>
                <li>Revoyez et améliorez votre plan régulièrement</li>
            </ul>
        """,
        "key_points": [
            "Un plan de trading élimine les décisions émotionnelles",
            "Définissez vos règles AVANT de trader",
            "Suivez votre plan sans exception",
            "La discipline est plus importante que l'intelligence"
        ],
        "quiz": []
    },
    (6, 3): {
        "title": "Journal de trading",
        "video_url": "",
        "content": """
            <h3>📓 Pourquoi tenir un journal de trading ?</h3>
            <p>Le journal de trading est l'outil le plus puissant pour progresser. Il permet d'analyser vos trades et d'identifier vos erreurs.</p>
            
            <h3>📝 Que noter dans son journal ?</h3>
            <ul>
                <li><strong>Date et heure</strong> du trade</li>
                <li><strong>Actif</strong> tradé (BTC, ETH, etc.)</li>
                <li><strong>Direction</strong> : Long ou Short</li>
                <li><strong>Prix d'entrée</strong> et de sortie</li>
                <li><strong>Taille de position</strong></li>
                <li><strong>Stop Loss</strong> et Take Profit</li>
                <li><strong>Raison de l'entrée</strong> (setup technique)</li>
                <li><strong>Résultat</strong> : Gain ou perte</li>
                <li><strong>Émotions</strong> ressenties</li>
                <li><strong>Screenshot</strong> du graphique</li>
                <li><strong>Leçons apprises</strong></li>
            </ul>
            
            <h3>📊 Analyser son journal</h3>
            <ul>
                <li>Identifiez vos setups les plus rentables</li>
                <li>Repérez vos erreurs récurrentes</li>
                <li>Calculez votre taux de réussite</li>
                <li>Mesurez votre R:R moyen</li>
            </ul>
        """,
        "key_points": [
            "Le journal est l'outil #1 pour progresser",
            "Notez tous les détails de chaque trade",
            "Incluez vos émotions et vos erreurs",
            "Analysez régulièrement pour vous améliorer"
        ],
        "quiz": []
    },
    (6, 4): {
        "title": "Gérer les pertes",
        "video_url": "",
        "content": """
            <h3>📉 Les pertes font partie du jeu</h3>
            <p>Même les meilleurs traders ont des trades perdants. L'objectif n'est pas d'avoir 100% de trades gagnants, mais d'être profitable sur l'ensemble.</p>
            
            <h3>🧘 Accepter les pertes</h3>
            <ul>
                <li>Une perte n'est pas un échec, c'est un coût du business</li>
                <li>Chaque perte est une leçon si vous l'analysez</li>
                <li>Le stop loss est votre ami, pas votre ennemi</li>
                <li>Concentrez-vous sur le processus, pas sur le résultat</li>
            </ul>
            
            <h3>⚠️ Erreurs à éviter après une perte</h3>
            <ul>
                <li><strong>Revenge trading</strong> : Trader pour "se refaire"</li>
                <li><strong>Augmenter la taille</strong> : Pour récupérer plus vite</li>
                <li><strong>Abandonner le plan</strong> : Changer de stratégie impulsivement</li>
                <li><strong>Overtrading</strong> : Multiplier les trades</li>
            </ul>
            
            <h3>💡 Après une perte</h3>
            <ol>
                <li>Faites une pause (au moins quelques heures)</li>
                <li>Analysez le trade dans votre journal</li>
                <li>Identifiez si c'était une erreur ou juste le marché</li>
                <li>Revenez avec un esprit clair</li>
            </ol>
        """,
        "key_points": [
            "Les pertes sont normales et inévitables",
            "Ne faites jamais de revenge trading",
            "Faites une pause après une perte",
            "Analysez chaque perte pour apprendre"
        ],
        "quiz": []
    },
    (6, 5): {
        "title": "Routine du trader",
        "video_url": "",
        "content": """
            <h3>🌅 Routine matinale</h3>
            <ul>
                <li>Vérifier les news et événements du jour</li>
                <li>Analyser les graphiques des actifs suivis</li>
                <li>Identifier les niveaux clés et les setups potentiels</li>
                <li>Définir le plan de la journée</li>
                <li>Vérifier le calendrier économique</li>
            </ul>
            
            <h3>📊 Pendant la session</h3>
            <ul>
                <li>Suivre le plan établi</li>
                <li>Noter les trades dans le journal</li>
                <li>Gérer les positions ouvertes</li>
                <li>Rester calme et discipliné</li>
            </ul>
            
            <h3>🌙 Routine de fin de journée</h3>
            <ul>
                <li>Revoir les trades de la journée</li>
                <li>Compléter le journal de trading</li>
                <li>Analyser les erreurs et les succès</li>
                <li>Préparer le lendemain</li>
                <li>Se déconnecter et se reposer</li>
            </ul>
            
            <h3>💪 Hygiène de vie</h3>
            <ul>
                <li>Sommeil suffisant (7-8h)</li>
                <li>Exercice physique régulier</li>
                <li>Alimentation équilibrée</li>
                <li>Pauses régulières</li>
            </ul>
        """,
        "key_points": [
            "Une routine structure votre journée de trading",
            "Préparez-vous avant d'ouvrir les graphiques",
            "Analysez vos trades en fin de journée",
            "L'hygiène de vie impacte vos performances"
        ],
        "quiz": []
    },
    (6, 6): {
        "title": "Quiz Module 6",
        "video_url": "",
        "is_quiz": True,
        "content": "<h3>🎯 Quiz - Psychologie du Trader</h3><p>Testez vos connaissances sur la psychologie du trading.</p>",
        "key_points": [],
        "quiz": [
            {
                "question": "Que signifie FOMO ?",
                "options": ["Fear Of Making Orders", "Fear Of Missing Out", "First Order Market Order", "Final Order Management"],
                "correct": 1
            },
            {
                "question": "Qu'est-ce que le revenge trading ?",
                "options": ["Trader pour se venger du marché", "Trader pour récupérer une perte", "Un type d'ordre", "Une stratégie rentable"],
                "correct": 1
            },
            {
                "question": "Pourquoi tenir un journal de trading ?",
                "options": ["Pour impressionner", "Pour analyser ses trades et progresser", "Ce n'est pas utile", "Pour les impôts"],
                "correct": 1
            },
            {
                "question": "Que faire après une perte ?",
                "options": ["Trader immédiatement pour récupérer", "Doubler la taille de position", "Faire une pause et analyser", "Abandonner le trading"],
                "correct": 2
            }
        ]
    },
    
    # ============================================
    # MODULE 7: Supports & Résistances
    # Vidéo: https://youtu.be/CnRVH8AxQgw
    # ============================================
    (7, 1): {
        "title": "Qu'est-ce qu'un support ?",
        "video_url": "",
        "content": """
            <h3>📊 Définition du Support</h3>
            <p>Un support est un niveau de prix où la demande est suffisamment forte pour empêcher le prix de baisser davantage. C'est un "plancher" où les acheteurs entrent en force.</p>
            
            <h3>🔍 Comment identifier un support ?</h3>
            <ul>
                <li>Zone où le prix a rebondi plusieurs fois</li>
                <li>Plus le support est testé, plus il est fort</li>
                <li>Les supports deviennent des résistances une fois cassés</li>
            </ul>
            
            <h3>💡 Psychologie derrière les supports</h3>
            <p>Les traders voient ces niveaux comme des opportunités d'achat. Quand le prix approche d'un support, les acheteurs entrent en masse, créant une pression acheteuse.</p>
        """,
        "key_points": [
            "Un support est un niveau où les acheteurs dominent",
            "Plus un support est testé, plus il est significatif",
            "Un support cassé devient souvent une résistance",
            "Les supports sont des zones d'achat potentielles"
        ],
        "quiz": []
    },
    (7, 2): {
        "title": "Qu'est-ce qu'une résistance ?",
        "video_url": "",
        "content": """
            <h3>📊 Définition de la Résistance</h3>
            <p>Une résistance est un niveau de prix où l'offre est suffisamment forte pour empêcher le prix de monter davantage. C'est un "plafond" où les vendeurs prennent le contrôle.</p>
            
            <h3>🔍 Comment identifier une résistance ?</h3>
            <ul>
                <li>Zone où le prix a été rejeté plusieurs fois</li>
                <li>Plus la résistance est testée, plus elle est forte</li>
                <li>Les résistances deviennent des supports une fois cassées</li>
            </ul>
            
            <h3>💡 Psychologie derrière les résistances</h3>
            <p>Les traders voient ces niveaux comme des opportunités de vente ou de prise de profits. Quand le prix approche d'une résistance, les vendeurs entrent en masse.</p>
        """,
        "key_points": [
            "Une résistance est un niveau où les vendeurs dominent",
            "Plus une résistance est testée, plus elle est significative",
            "Une résistance cassée devient souvent un support",
            "Les résistances sont des zones de vente potentielles"
        ],
        "quiz": []
    },
    (7, 3): {
        "title": "Tracer les supports et résistances",
        "video_url": "",
        "content": """
            <h3>📏 Méthode pour tracer les S/R</h3>
            <ol>
                <li>Commencez par les grands timeframes (Daily, Weekly)</li>
                <li>Identifiez les zones où le prix a réagi plusieurs fois</li>
                <li>Tracez des lignes horizontales sur ces zones</li>
                <li>Utilisez des zones plutôt que des lignes précises</li>
            </ol>
            
            <h3>💡 Conseils pratiques</h3>
            <ul>
                <li><strong>Zones vs Lignes</strong> : Les S/R sont des zones, pas des prix exacts</li>
                <li><strong>Confluence</strong> : Les S/R qui correspondent à d'autres indicateurs sont plus forts</li>
                <li><strong>Nombres ronds</strong> : 10000$, 50000$ sont souvent des S/R psychologiques</li>
            </ul>
            
            <h3>⚠️ Erreurs à éviter</h3>
            <ul>
                <li>Tracer trop de niveaux (gardez les plus importants)</li>
                <li>Être trop précis (utilisez des zones)</li>
                <li>Ignorer le contexte (tendance générale)</li>
            </ul>
        """,
        "key_points": [
            "Commencez par les grands timeframes",
            "Utilisez des zones plutôt que des lignes précises",
            "Les nombres ronds sont souvent des niveaux psychologiques",
            "Ne tracez pas trop de niveaux"
        ],
        "quiz": []
    },
    (7, 4): {
        "title": "Breakout et faux breakout",
        "video_url": "",
        "content": """
            <h3>🚀 Qu'est-ce qu'un breakout ?</h3>
            <p>Un breakout est la cassure d'un niveau de support ou de résistance. C'est souvent le début d'un mouvement significatif.</p>
            
            <h3>✅ Signes d'un vrai breakout</h3>
            <ul>
                <li>Fort volume accompagnant la cassure</li>
                <li>Clôture de bougie au-delà du niveau</li>
                <li>Retest du niveau cassé qui tient</li>
                <li>Continuation du mouvement</li>
            </ul>
            
            <h3>❌ Faux breakout (Fakeout)</h3>
            <ul>
                <li>Cassure avec faible volume</li>
                <li>Retour rapide dans la zone précédente</li>
                <li>Mèche qui dépasse mais corps qui reste</li>
            </ul>
            
            <h3>💡 Comment trader les breakouts</h3>
            <ul>
                <li>Attendez la confirmation (clôture + volume)</li>
                <li>Entrez sur le retest du niveau cassé</li>
                <li>Placez le stop loss de l'autre côté du niveau</li>
            </ul>
        """,
        "key_points": [
            "Un breakout est la cassure d'un S/R",
            "Le volume confirme la validité du breakout",
            "Les faux breakouts sont fréquents",
            "Attendez le retest pour plus de sécurité"
        ],
        "quiz": []
    },
    (7, 5): {
        "title": "Flip de support/résistance",
        "video_url": "",
        "content": """
            <h3>🔄 Le concept de flip</h3>
            <p>Quand un support est cassé, il devient souvent une résistance. Inversement, une résistance cassée devient souvent un support. C'est le "flip".</p>
            
            <h3>📊 Pourquoi ça fonctionne ?</h3>
            <ul>
                <li>Les traders qui ont acheté au support sont maintenant en perte</li>
                <li>Ils attendent un retour au niveau pour vendre (breakeven)</li>
                <li>Cette pression vendeuse transforme le support en résistance</li>
            </ul>
            
            <h3>💡 Comment trader le flip</h3>
            <ol>
                <li>Identifiez un support/résistance qui vient d'être cassé</li>
                <li>Attendez que le prix revienne tester ce niveau</li>
                <li>Entrez dans le sens de la cassure si le niveau tient</li>
                <li>Stop loss de l'autre côté du niveau</li>
            </ol>
        """,
        "key_points": [
            "Un support cassé devient résistance et vice versa",
            "Le flip est basé sur la psychologie des traders",
            "Trader le retest du niveau flippé est une stratégie efficace",
            "Attendez la confirmation avant d'entrer"
        ],
        "quiz": []
    },
    (7, 6): {
        "title": "Zones de liquidité",
        "video_url": "",
        "content": """
            <h3>💧 Qu'est-ce que la liquidité ?</h3>
            <p>La liquidité représente les ordres en attente sur le marché. Les zones de liquidité sont des endroits où beaucoup d'ordres sont concentrés.</p>
            
            <h3>📍 Où se trouve la liquidité ?</h3>
            <ul>
                <li><strong>Au-dessus des résistances</strong> : Stop loss des shorts</li>
                <li><strong>En dessous des supports</strong> : Stop loss des longs</li>
                <li><strong>Aux sommets/creux évidents</strong> : Beaucoup de stops</li>
            </ul>
            
            <h3>🎯 Chasse aux stops (Stop Hunt)</h3>
            <p>Les gros acteurs (whales, institutions) peuvent pousser le prix vers ces zones pour déclencher les stops et obtenir de la liquidité.</p>
            
            <h3>💡 Comment se protéger</h3>
            <ul>
                <li>Ne placez pas vos stops aux niveaux évidents</li>
                <li>Donnez de l'espace à vos stops</li>
                <li>Utilisez des zones plutôt que des niveaux précis</li>
            </ul>
        """,
        "key_points": [
            "La liquidité = ordres en attente sur le marché",
            "Les stops sont souvent placés aux mêmes endroits",
            "Les whales chassent les stops pour obtenir de la liquidité",
            "Évitez les niveaux de stop trop évidents"
        ],
        "quiz": []
    },
    (7, 7): {
        "title": "Stratégies avec S/R",
        "video_url": "",
        "content": """
            <h3>📈 Stratégie 1 : Rebond sur support</h3>
            <ol>
                <li>Identifiez un support fort (testé plusieurs fois)</li>
                <li>Attendez que le prix approche du support</li>
                <li>Cherchez une confirmation (pattern de retournement)</li>
                <li>Entrez long avec stop sous le support</li>
                <li>Take profit à la prochaine résistance</li>
            </ol>
            
            <h3>📉 Stratégie 2 : Rejet sur résistance</h3>
            <ol>
                <li>Identifiez une résistance forte</li>
                <li>Attendez que le prix approche de la résistance</li>
                <li>Cherchez une confirmation (pattern de retournement)</li>
                <li>Entrez short avec stop au-dessus de la résistance</li>
                <li>Take profit au prochain support</li>
            </ol>
            
            <h3>🚀 Stratégie 3 : Breakout trading</h3>
            <ol>
                <li>Identifiez un niveau clé</li>
                <li>Attendez la cassure avec volume</li>
                <li>Entrez sur le retest du niveau cassé</li>
                <li>Stop de l'autre côté du niveau</li>
            </ol>
        """,
        "key_points": [
            "Achetez sur les supports, vendez sur les résistances",
            "Attendez toujours une confirmation",
            "Le breakout trading nécessite du volume",
            "Utilisez les S/R pour placer vos stops et TP"
        ],
        "quiz": []
    },
    (7, 8): {
        "title": "Quiz Module 7",
        "video_url": "",
        "is_quiz": True,
        "content": "<h3>🎯 Quiz - Supports & Résistances</h3><p>Testez vos connaissances sur les supports et résistances.</p>",
        "key_points": [],
        "quiz": [
            {
                "question": "Qu'est-ce qu'un support ?",
                "options": ["Un niveau où les vendeurs dominent", "Un niveau où les acheteurs dominent", "Un indicateur technique", "Un type d'ordre"],
                "correct": 1
            },
            {
                "question": "Que se passe-t-il quand un support est cassé ?",
                "options": ["Il disparaît", "Il devient une résistance", "Il devient plus fort", "Rien"],
                "correct": 1
            },
            {
                "question": "Comment confirmer un breakout ?",
                "options": ["Par le prix seul", "Par le volume", "Par la couleur de la bougie", "Par l'heure"],
                "correct": 1
            },
            {
                "question": "Qu'est-ce qu'un faux breakout ?",
                "options": ["Un breakout avec beaucoup de volume", "Une cassure qui ne tient pas", "Un breakout la nuit", "Un breakout sur Bitcoin"],
                "correct": 1
            }
        ]
    },
    
    # ============================================
    # MODULE 8: Indicateurs Techniques
    # Vidéo: https://youtu.be/e8R5xIGY77U
    # ============================================
    (8, 1): {
        "title": "Introduction aux indicateurs",
        "video_url": "",
        "content": """
            <h3>📊 Qu'est-ce qu'un indicateur technique ?</h3>
            <p>Un indicateur technique est un calcul mathématique basé sur le prix et/ou le volume. Il aide à analyser le marché et à prendre des décisions.</p>
            
            <h3>📈 Types d'indicateurs</h3>
            <ul>
                <li><strong>Indicateurs de tendance</strong> : Moyennes mobiles, MACD</li>
                <li><strong>Indicateurs de momentum</strong> : RSI, Stochastique</li>
                <li><strong>Indicateurs de volatilité</strong> : Bandes de Bollinger, ATR</li>
                <li><strong>Indicateurs de volume</strong> : OBV, Volume Profile</li>
            </ul>
            
            <h3>⚠️ Attention aux indicateurs</h3>
            <ul>
                <li>Les indicateurs sont en retard sur le prix (lagging)</li>
                <li>Trop d'indicateurs = confusion (paralysie d'analyse)</li>
                <li>Utilisez 2-3 indicateurs maximum</li>
                <li>Les indicateurs ne prédisent pas, ils confirment</li>
            </ul>
        """,
        "key_points": [
            "Les indicateurs sont des outils d'aide à la décision",
            "Il existe différents types pour différents usages",
            "N'utilisez pas trop d'indicateurs",
            "Les indicateurs confirment, ils ne prédisent pas"
        ],
        "quiz": []
    },
    (8, 2): {
        "title": "RSI (Relative Strength Index)",
        "video_url": "",
        "content": """
            <h3>📊 Qu'est-ce que le RSI ?</h3>
            <p>Le RSI mesure la vitesse et l'amplitude des mouvements de prix. Il oscille entre 0 et 100.</p>
            
            <h3>🔢 Interprétation du RSI</h3>
            <ul>
                <li><strong>RSI > 70</strong> : Zone de surachat (overbought) - Signal de vente potentiel</li>
                <li><strong>RSI < 30</strong> : Zone de survente (oversold) - Signal d'achat potentiel</li>
                <li><strong>RSI = 50</strong> : Zone neutre</li>
            </ul>
            
            <h3>💡 Utilisation avancée</h3>
            <ul>
                <li><strong>Divergences</strong> : Quand le prix et le RSI vont dans des directions opposées</li>
                <li><strong>Support/Résistance sur RSI</strong> : Le RSI peut avoir ses propres niveaux</li>
                <li><strong>Tendance</strong> : RSI > 50 = tendance haussière, RSI < 50 = tendance baissière</li>
            </ul>
            
            <h3>⚠️ Attention</h3>
            <p>En tendance forte, le RSI peut rester en zone extrême longtemps. Ne vendez pas uniquement parce que le RSI est suracheté.</p>
        """,
        "key_points": [
            "RSI > 70 = surachat, RSI < 30 = survente",
            "Les divergences sont des signaux puissants",
            "Le RSI peut rester en zone extrême en tendance forte",
            "Utilisez le RSI avec d'autres confirmations"
        ],
        "quiz": []
    },
    (8, 3): {
        "title": "Divergences RSI",
        "video_url": "",
        "content": """
            <h3>🔄 Qu'est-ce qu'une divergence ?</h3>
            <p>Une divergence se produit quand le prix et l'indicateur vont dans des directions opposées. C'est un signal de retournement potentiel.</p>
            
            <h3>📈 Divergence haussière (bullish)</h3>
            <ul>
                <li>Le prix fait des creux de plus en plus bas</li>
                <li>Le RSI fait des creux de plus en plus hauts</li>
                <li>Signal : La baisse perd de la force, retournement haussier possible</li>
            </ul>
            
            <h3>📉 Divergence baissière (bearish)</h3>
            <ul>
                <li>Le prix fait des sommets de plus en plus hauts</li>
                <li>Le RSI fait des sommets de plus en plus bas</li>
                <li>Signal : La hausse perd de la force, retournement baissier possible</li>
            </ul>
            
            <h3>💡 Comment trader les divergences</h3>
            <ul>
                <li>Attendez une confirmation (cassure de structure)</li>
                <li>Les divergences sur grands timeframes sont plus fiables</li>
                <li>Combinez avec les supports/résistances</li>
            </ul>
        """,
        "key_points": [
            "Divergence = prix et RSI vont dans des directions opposées",
            "Divergence haussière = signal d'achat potentiel",
            "Divergence baissière = signal de vente potentiel",
            "Toujours attendre une confirmation"
        ],
        "quiz": []
    },
    (8, 4): {
        "title": "MACD",
        "video_url": "",
        "content": """
            <h3>📊 Qu'est-ce que le MACD ?</h3>
            <p>Le MACD (Moving Average Convergence Divergence) est un indicateur de tendance et de momentum très populaire.</p>
            
            <h3>🔧 Composants du MACD</h3>
            <ul>
                <li><strong>Ligne MACD</strong> : EMA 12 - EMA 26</li>
                <li><strong>Ligne Signal</strong> : EMA 9 de la ligne MACD</li>
                <li><strong>Histogramme</strong> : Différence entre MACD et Signal</li>
            </ul>
            
            <h3>🎯 Signaux de trading</h3>
            <ul>
                <li><strong>Croisement haussier</strong> : MACD croise au-dessus du signal = Achat</li>
                <li><strong>Croisement baissier</strong> : MACD croise en-dessous du signal = Vente</li>
                <li><strong>Croisement de la ligne zéro</strong> : Changement de tendance</li>
                <li><strong>Divergences</strong> : Comme avec le RSI</li>
            </ul>
            
            <h3>💡 Conseils</h3>
            <ul>
                <li>Les croisements au-dessus/en-dessous de zéro sont plus significatifs</li>
                <li>L'histogramme montre la force de la tendance</li>
                <li>Combinez avec les supports/résistances</li>
            </ul>
        """,
        "key_points": [
            "MACD = indicateur de tendance et momentum",
            "Croisement haussier = signal d'achat",
            "Croisement baissier = signal de vente",
            "L'histogramme montre la force du mouvement"
        ],
        "quiz": []
    },
    (8, 5): {
        "title": "Moyennes Mobiles",
        "video_url": "",
        "content": """
            <h3>📊 Types de moyennes mobiles</h3>
            <ul>
                <li><strong>SMA (Simple Moving Average)</strong> : Moyenne simple des X dernières périodes</li>
                <li><strong>EMA (Exponential Moving Average)</strong> : Donne plus de poids aux prix récents</li>
            </ul>
            
            <h3>📏 Périodes populaires</h3>
            <ul>
                <li><strong>MA 20</strong> : Court terme, tendance immédiate</li>
                <li><strong>MA 50</strong> : Moyen terme</li>
                <li><strong>MA 100</strong> : Moyen-long terme</li>
                <li><strong>MA 200</strong> : Long terme, tendance majeure</li>
            </ul>
            
            <h3>🎯 Signaux de trading</h3>
            <ul>
                <li><strong>Prix > MA</strong> : Tendance haussière</li>
                <li><strong>Prix < MA</strong> : Tendance baissière</li>
                <li><strong>Golden Cross</strong> : MA 50 croise MA 200 vers le haut = Bullish</li>
                <li><strong>Death Cross</strong> : MA 50 croise MA 200 vers le bas = Bearish</li>
            </ul>
        """,
        "key_points": [
            "SMA = moyenne simple, EMA = moyenne exponentielle",
            "MA 200 est la référence pour la tendance long terme",
            "Golden Cross = signal haussier majeur",
            "Death Cross = signal baissier majeur"
        ],
        "quiz": []
    },
    (8, 6): {
        "title": "Bandes de Bollinger",
        "video_url": "",
        "content": """
            <h3>📊 Qu'est-ce que les Bandes de Bollinger ?</h3>
            <p>Les Bandes de Bollinger mesurent la volatilité du marché. Elles s'élargissent quand la volatilité augmente et se resserrent quand elle diminue.</p>
            
            <h3>🔧 Composants</h3>
            <ul>
                <li><strong>Bande médiane</strong> : SMA 20</li>
                <li><strong>Bande supérieure</strong> : SMA + 2 écarts-types</li>
                <li><strong>Bande inférieure</strong> : SMA - 2 écarts-types</li>
            </ul>
            
            <h3>🎯 Interprétation</h3>
            <ul>
                <li><strong>Squeeze</strong> : Bandes resserrées = consolidation, breakout imminent</li>
                <li><strong>Prix touche la bande supérieure</strong> : Possible surachat</li>
                <li><strong>Prix touche la bande inférieure</strong> : Possible survente</li>
                <li><strong>Walking the bands</strong> : En tendance forte, le prix peut longer une bande</li>
            </ul>
        """,
        "key_points": [
            "Les bandes mesurent la volatilité",
            "Squeeze = consolidation avant mouvement",
            "Le prix reste 95% du temps dans les bandes",
            "En tendance forte, le prix peut longer une bande"
        ],
        "quiz": []
    },
    (8, 7): {
        "title": "Stochastique",
        "video_url": "",
        "content": """
            <h3>📊 Qu'est-ce que le Stochastique ?</h3>
            <p>Le Stochastique compare le prix de clôture à la fourchette de prix sur une période donnée. Il oscille entre 0 et 100.</p>
            
            <h3>🔢 Interprétation</h3>
            <ul>
                <li><strong>Stoch > 80</strong> : Zone de surachat</li>
                <li><strong>Stoch < 20</strong> : Zone de survente</li>
                <li><strong>Croisement %K et %D</strong> : Signaux d'achat/vente</li>
            </ul>
            
            <h3>🎯 Signaux de trading</h3>
            <ul>
                <li><strong>Achat</strong> : Stoch < 20 + croisement haussier</li>
                <li><strong>Vente</strong> : Stoch > 80 + croisement baissier</li>
                <li><strong>Divergences</strong> : Comme avec le RSI</li>
            </ul>
        """,
        "key_points": [
            "Stochastique mesure le momentum",
            "> 80 = surachat, < 20 = survente",
            "Les croisements donnent des signaux",
            "Efficace en range, moins en tendance forte"
        ],
        "quiz": []
    },
    (8, 8): {
        "title": "ATR (Average True Range)",
        "video_url": "",
        "content": """
            <h3>📊 Qu'est-ce que l'ATR ?</h3>
            <p>L'ATR mesure la volatilité moyenne sur une période donnée. Il ne donne pas de direction, seulement l'amplitude des mouvements.</p>
            
            <h3>🔧 Utilisation de l'ATR</h3>
            <ul>
                <li><strong>Placement du Stop Loss</strong> : SL = Entrée - (ATR × multiplicateur)</li>
                <li><strong>Taille de position</strong> : Ajuster selon la volatilité</li>
                <li><strong>Filtrer les marchés</strong> : Éviter les marchés trop volatils ou trop calmes</li>
            </ul>
            
            <h3>📊 Exemple de Stop Loss avec ATR</h3>
            <ul>
                <li>ATR(14) = 500$</li>
                <li>Multiplicateur = 2</li>
                <li>Stop Loss = Prix d'entrée - (500 × 2) = Prix - 1000$</li>
            </ul>
        """,
        "key_points": [
            "ATR mesure la volatilité, pas la direction",
            "Utile pour placer les stop loss",
            "Permet d'ajuster la taille de position",
            "ATR élevé = marché volatile"
        ],
        "quiz": []
    },
    (8, 9): {
        "title": "Volume Profile",
        "video_url": "",
        "content": """
            <h3>📊 Qu'est-ce que le Volume Profile ?</h3>
            <p>Le Volume Profile affiche le volume échangé à chaque niveau de prix, pas dans le temps. Il révèle où se concentre l'activité.</p>
            
            <h3>🔑 Concepts clés</h3>
            <ul>
                <li><strong>POC (Point of Control)</strong> : Niveau avec le plus de volume</li>
                <li><strong>Value Area</strong> : Zone contenant 70% du volume</li>
                <li><strong>HVN (High Volume Node)</strong> : Zone de fort volume = support/résistance</li>
                <li><strong>LVN (Low Volume Node)</strong> : Zone de faible volume = le prix traverse vite</li>
            </ul>
            
            <h3>💡 Utilisation</h3>
            <ul>
                <li>Le POC agit comme un aimant pour le prix</li>
                <li>Les HVN sont des zones de support/résistance</li>
                <li>Les LVN sont des zones de faible intérêt</li>
            </ul>
        """,
        "key_points": [
            "Volume Profile montre le volume par niveau de prix",
            "POC = niveau le plus tradé",
            "HVN = zones de support/résistance",
            "LVN = zones que le prix traverse rapidement"
        ],
        "quiz": []
    },
    (8, 10): {
        "title": "Combiner les indicateurs",
        "video_url": "",
        "content": """
            <h3>🔗 Pourquoi combiner les indicateurs ?</h3>
            <p>Un seul indicateur peut donner de faux signaux. Combiner plusieurs indicateurs augmente la fiabilité des signaux.</p>
            
            <h3>📊 Combinaisons efficaces</h3>
            <ul>
                <li><strong>Tendance + Momentum</strong> : MA + RSI</li>
                <li><strong>Tendance + Volatilité</strong> : MA + Bollinger</li>
                <li><strong>Momentum + Volume</strong> : RSI + OBV</li>
            </ul>
            
            <h3>💡 Règles de combinaison</h3>
            <ul>
                <li>Maximum 2-3 indicateurs</li>
                <li>Choisissez des indicateurs de types différents</li>
                <li>Évitez les indicateurs redondants (RSI + Stoch = similaires)</li>
                <li>La confluence augmente la probabilité de succès</li>
            </ul>
            
            <h3>🎯 Exemple de setup</h3>
            <ol>
                <li>MA 200 pour la tendance générale</li>
                <li>RSI pour le timing d'entrée</li>
                <li>Volume pour confirmer le mouvement</li>
            </ol>
        """,
        "key_points": [
            "Combiner des indicateurs de types différents",
            "Maximum 2-3 indicateurs pour éviter la confusion",
            "La confluence augmente la fiabilité",
            "Évitez les indicateurs redondants"
        ],
        "quiz": []
    },
    (8, 11): {
        "title": "Exercices pratiques",
        "video_url": "",
        "content": """
            <h3>🎯 Exercice 1 : RSI</h3>
            <p>Ouvrez BTC/USDT en 4H. Ajoutez le RSI(14). Identifiez les zones de surachat et survente des dernières semaines.</p>
            
            <h3>🎯 Exercice 2 : Divergences</h3>
            <p>Sur le même graphique, cherchez des divergences entre le prix et le RSI. Le prix a-t-il réagi après ?</p>
            
            <h3>🎯 Exercice 3 : Moyennes mobiles</h3>
            <p>Ajoutez MA 50 et MA 200. Y a-t-il eu un Golden Cross ou Death Cross récemment ?</p>
            
            <h3>🎯 Exercice 4 : Bollinger</h3>
            <p>Ajoutez les Bandes de Bollinger. Identifiez les squeezes et les breakouts qui ont suivi.</p>
            
            <h3>🎯 Exercice 5 : Combinaison</h3>
            <p>Créez un setup avec MA 200 + RSI + Volume. Identifiez un signal d'achat ou de vente potentiel.</p>
        """,
        "key_points": [
            "La pratique est essentielle pour maîtriser les indicateurs",
            "Testez chaque indicateur individuellement d'abord",
            "Puis combinez-les progressivement",
            "Notez vos observations dans votre journal"
        ],
        "quiz": []
    },
    (8, 12): {
        "title": "Quiz Module 8",
        "video_url": "",
        "is_quiz": True,
        "content": "<h3>🎯 Quiz - Indicateurs Techniques</h3><p>Testez vos connaissances sur les indicateurs techniques.</p>",
        "key_points": [],
        "quiz": [
            {
                "question": "Que signifie un RSI > 70 ?",
                "options": ["Survente", "Surachat", "Tendance neutre", "Volume élevé"],
                "correct": 1
            },
            {
                "question": "Qu'est-ce qu'un Golden Cross ?",
                "options": ["RSI > 70", "MA 50 croise MA 200 vers le haut", "Prix au plus haut", "Volume record"],
                "correct": 1
            },
            {
                "question": "Les Bandes de Bollinger mesurent :",
                "options": ["La tendance", "Le momentum", "La volatilité", "Le volume"],
                "correct": 2
            },
            {
                "question": "Combien d'indicateurs maximum recommande-t-on ?",
                "options": ["1", "2-3", "5-10", "Autant que possible"],
                "correct": 1
            }
        ]
    },
}

# Ajouter le contenu générique pour les modules 9-22
def generate_generic_content(module_id, lesson_id, module_info):
    """Génère du contenu générique pour les modules non encore détaillés."""
    return {
        "title": f"{module_info['name']} - Leçon {lesson_id}",
        "video_url": "",
        "content": f"""
            <h3>📚 {module_info['name']}</h3>
            <p>{module_info['description']}</p>
            
            <h3>🎯 Objectifs de cette leçon</h3>
            <ul>
                <li>Comprendre les concepts fondamentaux</li>
                <li>Apprendre les techniques pratiques</li>
                <li>Développer vos compétences de trading</li>
            </ul>
            
            <h3>💡 Points clés</h3>
            <p>Regardez la vidéo ci-dessus pour un apprentissage complet de ce sujet.</p>
        """,
        "key_points": [
            f"Maîtriser les bases de {module_info['name'].lower()}",
            "Appliquer les concepts en situation réelle",
            "Pratiquer régulièrement pour progresser"
        ],
        "quiz": []
    }

# Informations sur les modules 9-22
MODULE_INFO = {
    9: {"name": "Patterns Chartistes", "description": "Apprenez à reconnaître et trader les figures chartistes classiques comme les triangles, têtes-épaules, et doubles tops/bottoms.", "lessons": 10},
    10: {"name": "Chandeliers Avancés", "description": "Maîtrisez les patterns de chandeliers japonais avancés pour améliorer vos entrées et sorties.", "lessons": 8},
    11: {"name": "Fibonacci & Retracements", "description": "Utilisez les niveaux de Fibonacci pour identifier les zones de support, résistance et les objectifs de prix.", "lessons": 8},
    12: {"name": "Analyse des Volumes", "description": "Comprenez l'importance du volume dans l'analyse technique et apprenez à l'interpréter.", "lessons": 9},
    13: {"name": "Scalping & Day Trading", "description": "Stratégies de trading à court terme pour profiter des petits mouvements de prix.", "lessons": 8},
    14: {"name": "Swing Trading", "description": "Techniques pour capturer les mouvements de prix sur plusieurs jours à semaines.", "lessons": 9},
    15: {"name": "Trading de Breakout", "description": "Apprenez à identifier et trader les cassures de niveaux clés.", "lessons": 8},
    16: {"name": "Risk Management Pro", "description": "Techniques avancées de gestion du risque pour protéger votre capital.", "lessons": 8},
    17: {"name": "Trading Mobile & Alertes", "description": "Optimisez votre trading avec les applications mobiles et les systèmes d'alertes.", "lessons": 9},
    18: {"name": "Trading avec l'IA", "description": "Découvrez comment l'intelligence artificielle peut améliorer votre trading.", "lessons": 8},
    19: {"name": "Analyse On-Chain", "description": "Analysez les données de la blockchain pour prendre de meilleures décisions.", "lessons": 8},
    20: {"name": "DeFi & Yield Farming", "description": "Explorez les opportunités de la finance décentralisée et du yield farming.", "lessons": 9},
    21: {"name": "Détection de Gems", "description": "Apprenez à identifier les projets crypto prometteurs avant qu'ils n'explosent.", "lessons": 7},
    22: {"name": "Masterclass Trading Pro", "description": "Synthèse de toutes les connaissances pour devenir un trader professionnel.", "lessons": 9},
}

# Générer le contenu pour les modules 9-22
for module_id, info in MODULE_INFO.items():
    for lesson_id in range(1, info["lessons"] + 1):
        key = (module_id, lesson_id)
        if key not in LESSON_CONTENT:
            if lesson_id == info["lessons"]:
                # Dernière leçon = Quiz
                LESSON_CONTENT[key] = {
                    "title": f"Quiz Module {module_id}",
                    "video_url": "",
                    "is_quiz": True,
                    "content": f"<h3>🎯 Quiz - {info['name']}</h3><p>Testez vos connaissances sur {info['name'].lower()}.</p>",
                    "key_points": [],
                    "quiz": [
                        {
                            "question": f"Question sur {info['name']}",
                            "options": ["Option A", "Option B", "Option C", "Option D"],
                            "correct": 0
                        }
                    ]
                }
            else:
                LESSON_CONTENT[key] = generate_generic_content(module_id, lesson_id, info)


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
                <p>En attendant, regardez la vidéo ci-dessus et n'hésitez pas à revoir les leçons précédentes.</p>
            """,
            "key_points": ["Contenu en cours de développement"],
            "quiz": []
        }
    
    # Override video_url with YouTube video if available
    youtube_url = get_video_url(module_id, lesson_id)
    if youtube_url:
        lesson["video_url"] = youtube_url
    
    return lesson