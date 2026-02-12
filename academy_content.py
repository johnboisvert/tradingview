"""
Contenu détaillé des leçons de l'Academy Trading
"""

LESSON_CONTENT = {
    # Module 1: Introduction au Trading Crypto
    (1, 1): {
        "title": "Qu'est-ce que le trading crypto ?",
        "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
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
            <p>Ethereum va au-delà d'une simple monnaie. C'est une plateforme permettant de créer des applications décentralisées (dApps) et des smart contracts. C'est la deuxième plus grande crypto par capitalisation.</p>
            
            <h3>🏷️ Catégories de Cryptomonnaies</h3>
            <ul>
                <li><strong>Layer 1</strong> : Blockchains principales (BTC, ETH, SOL, AVAX)</li>
                <li><strong>Layer 2</strong> : Solutions de scaling (Polygon, Arbitrum, Optimism)</li>
                <li><strong>DeFi</strong> : Finance décentralisée (AAVE, UNI, COMP)</li>
                <li><strong>Stablecoins</strong> : Cryptos indexées sur le dollar (USDT, USDC, DAI)</li>
                <li><strong>Meme coins</strong> : Cryptos communautaires (DOGE, SHIB, PEPE)</li>
                <li><strong>NFT/Gaming</strong> : Tokens liés aux NFTs et jeux (AXS, SAND, MANA)</li>
            </ul>
            
            <h3>📈 Capitalisation et Dominance</h3>
            <p>La capitalisation boursière (market cap) = Prix × Nombre de tokens en circulation. La dominance Bitcoin mesure le pourcentage de BTC par rapport au marché total.</p>
        """,
        "key_points": [
            "Bitcoin est la première crypto et reste la référence du marché",
            "Ethereum permet les smart contracts et les dApps",
            "Les cryptos se classent en plusieurs catégories selon leur utilité",
            "La capitalisation boursière aide à évaluer la taille d'un projet"
        ],
        "quiz": []
    },
    (1, 3): {
        "title": "Comment fonctionne un exchange",
        "video_url": "",
        "content": """
            <h3>🏦 Qu'est-ce qu'un Exchange ?</h3>
            <p>Un exchange (ou plateforme d'échange) est un service qui permet d'acheter, vendre et échanger des cryptomonnaies. C'est l'équivalent d'une bourse pour les actifs numériques.</p>
            
            <h3>📊 Types d'Exchanges</h3>
            <ul>
                <li><strong>CEX (Centralized Exchange)</strong> : Binance, Coinbase, Kraken - Gérés par une entreprise</li>
                <li><strong>DEX (Decentralized Exchange)</strong> : Uniswap, SushiSwap - Sans intermédiaire</li>
            </ul>
            
            <h3>💰 Le Carnet d'Ordres (Order Book)</h3>
            <p>Le carnet d'ordres affiche tous les ordres d'achat (bids) et de vente (asks) en attente. Le spread est la différence entre le meilleur prix d'achat et le meilleur prix de vente.</p>
            
            <h3>📈 Paires de Trading</h3>
            <p>Les cryptos se tradent par paires : BTC/USDT signifie que vous achetez du Bitcoin avec des USDT. La première crypto est la "base", la seconde est la "quote".</p>
            
            <h3>💸 Frais de Trading</h3>
            <ul>
                <li><strong>Maker fees</strong> : Frais pour les ordres qui ajoutent de la liquidité</li>
                <li><strong>Taker fees</strong> : Frais pour les ordres qui retirent de la liquidité</li>
                <li>Les frais varient généralement de 0.1% à 0.5% par transaction</li>
            </ul>
        """,
        "key_points": [
            "Les CEX sont plus simples mais centralisés, les DEX sont décentralisés",
            "Le carnet d'ordres montre l'offre et la demande en temps réel",
            "Les paires de trading définissent quelles cryptos vous échangez",
            "Comprenez les frais maker/taker pour optimiser vos coûts"
        ],
        "quiz": []
    },
    (1, 4): {
        "title": "Vocabulaire essentiel du trader",
        "video_url": "",
        "content": """
            <h3>📚 Termes de Base</h3>
            <ul>
                <li><strong>Bull/Bullish</strong> : Marché haussier, optimiste</li>
                <li><strong>Bear/Bearish</strong> : Marché baissier, pessimiste</li>
                <li><strong>ATH (All-Time High)</strong> : Plus haut historique</li>
                <li><strong>ATL (All-Time Low)</strong> : Plus bas historique</li>
                <li><strong>HODL</strong> : Hold On for Dear Life - Garder ses cryptos</li>
                <li><strong>FOMO</strong> : Fear Of Missing Out - Peur de rater une opportunité</li>
                <li><strong>FUD</strong> : Fear, Uncertainty, Doubt - Informations négatives</li>
            </ul>
            
            <h3>📊 Termes Techniques</h3>
            <ul>
                <li><strong>Support</strong> : Niveau de prix où les acheteurs interviennent</li>
                <li><strong>Résistance</strong> : Niveau de prix où les vendeurs interviennent</li>
                <li><strong>Breakout</strong> : Cassure d'un niveau clé</li>
                <li><strong>Pullback</strong> : Retour temporaire après un mouvement</li>
                <li><strong>Consolidation</strong> : Période de stabilisation des prix</li>
            </ul>
            
            <h3>💰 Termes de Trading</h3>
            <ul>
                <li><strong>Long</strong> : Position acheteuse (on parie sur la hausse)</li>
                <li><strong>Short</strong> : Position vendeuse (on parie sur la baisse)</li>
                <li><strong>Leverage</strong> : Effet de levier pour amplifier les gains/pertes</li>
                <li><strong>Liquidation</strong> : Fermeture forcée d'une position à effet de levier</li>
                <li><strong>PnL</strong> : Profit and Loss - Gains et pertes</li>
            </ul>
        """,
        "key_points": [
            "Bull = haussier, Bear = baissier",
            "FOMO et FUD sont des émotions à maîtriser",
            "Support et résistance sont des niveaux clés du graphique",
            "Long = achat, Short = vente à découvert"
        ],
        "quiz": []
    },
    (1, 5): {
        "title": "Créer son compte sur un exchange",
        "video_url": "",
        "content": """
            <h3>🚀 Étapes de Création de Compte</h3>
            <ol>
                <li><strong>Choisir un exchange</strong> : Binance, Coinbase, Kraken selon votre pays</li>
                <li><strong>S'inscrire</strong> : Email + mot de passe fort</li>
                <li><strong>Vérification KYC</strong> : Pièce d'identité + selfie</li>
                <li><strong>Activer la 2FA</strong> : Double authentification obligatoire</li>
            </ol>
            
            <h3>📋 Documents Requis (KYC)</h3>
            <ul>
                <li>Pièce d'identité valide (passeport, carte d'identité)</li>
                <li>Justificatif de domicile récent (moins de 3 mois)</li>
                <li>Selfie avec la pièce d'identité</li>
            </ul>
            
            <h3>🔐 Bonnes Pratiques</h3>
            <ul>
                <li>Utilisez un email dédié au trading</li>
                <li>Créez un mot de passe unique et complexe</li>
                <li>Activez TOUTES les options de sécurité disponibles</li>
                <li>Notez vos codes de récupération en lieu sûr</li>
            </ul>
            
            <h3>⚠️ Exchanges Recommandés par Région</h3>
            <ul>
                <li><strong>Europe</strong> : Binance, Kraken, Bitstamp</li>
                <li><strong>USA</strong> : Coinbase, Kraken, Gemini</li>
                <li><strong>Asie</strong> : Binance, OKX, Bybit</li>
            </ul>
        """,
        "key_points": [
            "Choisissez un exchange régulé dans votre pays",
            "Le KYC est obligatoire pour les montants importants",
            "La 2FA est indispensable pour sécuriser votre compte",
            "Utilisez un email et mot de passe dédiés"
        ],
        "quiz": []
    },
    (1, 6): {
        "title": "Sécuriser son compte (2FA)",
        "video_url": "",
        "content": """
            <h3>🔐 Qu'est-ce que la 2FA ?</h3>
            <p>La 2FA (Two-Factor Authentication) ajoute une couche de sécurité supplémentaire. En plus de votre mot de passe, vous devez fournir un code temporaire généré par une application.</p>
            
            <h3>📱 Applications 2FA Recommandées</h3>
            <ul>
                <li><strong>Google Authenticator</strong> : Simple et efficace</li>
                <li><strong>Authy</strong> : Backup cloud, multi-appareils</li>
                <li><strong>Microsoft Authenticator</strong> : Intégration Microsoft</li>
            </ul>
            
            <h3>⚙️ Configuration de la 2FA</h3>
            <ol>
                <li>Téléchargez une application 2FA</li>
                <li>Dans les paramètres de sécurité de l'exchange, activez la 2FA</li>
                <li>Scannez le QR code avec l'application</li>
                <li>Entrez le code à 6 chiffres pour confirmer</li>
                <li><strong>IMPORTANT</strong> : Sauvegardez le code de récupération !</li>
            </ol>
            
            <h3>🛡️ Autres Mesures de Sécurité</h3>
            <ul>
                <li><strong>Anti-phishing code</strong> : Code personnel dans les emails de l'exchange</li>
                <li><strong>Whitelist d'adresses</strong> : Limiter les retraits à des adresses approuvées</li>
                <li><strong>Notifications</strong> : Alertes pour chaque connexion/transaction</li>
            </ul>
        """,
        "key_points": [
            "La 2FA est obligatoire pour protéger vos fonds",
            "Utilisez une app comme Google Authenticator ou Authy",
            "Sauvegardez TOUJOURS vos codes de récupération",
            "Activez toutes les options de sécurité disponibles"
        ],
        "quiz": []
    },
    (1, 7): {
        "title": "Effectuer son premier dépôt",
        "video_url": "",
        "content": """
            <h3>💳 Méthodes de Dépôt</h3>
            <ul>
                <li><strong>Virement bancaire (SEPA)</strong> : Gratuit ou faibles frais, 1-3 jours</li>
                <li><strong>Carte bancaire</strong> : Instantané mais frais plus élevés (1-3%)</li>
                <li><strong>Dépôt crypto</strong> : Transférer des cryptos depuis un autre wallet</li>
                <li><strong>P2P</strong> : Achat direct entre particuliers</li>
            </ul>
            
            <h3>📝 Étapes pour un Virement SEPA</h3>
            <ol>
                <li>Allez dans "Dépôt" > "Fiat" > "EUR"</li>
                <li>Copiez les coordonnées bancaires de l'exchange</li>
                <li>Effectuez un virement depuis votre banque</li>
                <li>Ajoutez la référence unique dans le motif du virement</li>
                <li>Attendez 1-3 jours ouvrés</li>
            </ol>
            
            <h3>⚠️ Points d'Attention</h3>
            <ul>
                <li>Le compte bancaire doit être à votre nom</li>
                <li>N'oubliez pas la référence unique !</li>
                <li>Premier dépôt : commencez petit pour tester</li>
                <li>Vérifiez les limites de dépôt de votre compte</li>
            </ul>
            
            <h3>💡 Conseil Pro</h3>
            <p>Pour les débutants, commencez avec un petit montant (50-100€) pour vous familiariser avec la plateforme avant d'investir davantage.</p>
        """,
        "key_points": [
            "Le virement SEPA est la méthode la moins chère",
            "La carte bancaire est instantanée mais plus coûteuse",
            "Toujours inclure la référence unique dans le virement",
            "Commencez avec un petit montant pour tester"
        ],
        "quiz": []
    },
    (1, 8): {
        "title": "Quiz : Les bases du trading",
        "video_url": "",
        "content": """
            <h3>🎯 Quiz Final du Module 1</h3>
            <p>Testez vos connaissances sur les bases du trading crypto !</p>
        """,
        "key_points": [
            "Révisez les concepts clés avant de passer le quiz",
            "Un score de 80% est requis pour valider le module",
            "Vous pouvez repasser le quiz autant de fois que nécessaire"
        ],
        "quiz": [
            {
                "question": "Quelle est la différence entre un CEX et un DEX ?",
                "options": [
                    "Le CEX est gratuit, le DEX est payant",
                    "Le CEX est centralisé, le DEX est décentralisé",
                    "Le CEX est pour les pros, le DEX pour les débutants",
                    "Il n'y a pas de différence"
                ],
                "correct": 1
            },
            {
                "question": "Que signifie FOMO ?",
                "options": [
                    "First Order Market Open",
                    "Fear Of Missing Out",
                    "Fast Online Money Operation",
                    "Future Options Market Order"
                ],
                "correct": 1
            },
            {
                "question": "Qu'est-ce qu'un stablecoin ?",
                "options": [
                    "Une crypto très volatile",
                    "Une crypto indexée sur une monnaie fiat",
                    "Une crypto pour les débutants",
                    "Une crypto minée facilement"
                ],
                "correct": 1
            },
            {
                "question": "Pourquoi la 2FA est-elle importante ?",
                "options": [
                    "Pour trader plus vite",
                    "Pour payer moins de frais",
                    "Pour sécuriser son compte",
                    "Pour augmenter ses gains"
                ],
                "correct": 2
            },
            {
                "question": "Quelle méthode de dépôt a généralement les frais les plus bas ?",
                "options": [
                    "Carte bancaire",
                    "Virement SEPA",
                    "PayPal",
                    "Crypto"
                ],
                "correct": 1
            }
        ],
        "is_quiz": True
    },
    
    # Module 2: Lecture des Graphiques
    (2, 1): {
        "title": "Introduction aux graphiques",
        "video_url": "",
        "content": """
            <h3>📊 Les Types de Graphiques</h3>
            <ul>
                <li><strong>Graphique en ligne</strong> : Simple, montre uniquement le prix de clôture</li>
                <li><strong>Graphique en barres</strong> : Affiche OHLC (Open, High, Low, Close)</li>
                <li><strong>Graphique en chandeliers</strong> : Le plus utilisé, visuel et informatif</li>
            </ul>
            
            <h3>🕯️ Anatomie d'un Chandelier</h3>
            <p>Chaque chandelier représente une période de temps et contient 4 informations :</p>
            <ul>
                <li><strong>Open (Ouverture)</strong> : Prix au début de la période</li>
                <li><strong>High (Plus haut)</strong> : Prix maximum atteint</li>
                <li><strong>Low (Plus bas)</strong> : Prix minimum atteint</li>
                <li><strong>Close (Clôture)</strong> : Prix à la fin de la période</li>
            </ul>
            
            <h3>🟢🔴 Couleurs des Chandeliers</h3>
            <ul>
                <li><strong>Vert/Blanc</strong> : Bougie haussière (Close > Open)</li>
                <li><strong>Rouge/Noir</strong> : Bougie baissière (Close < Open)</li>
            </ul>
            
            <h3>📏 Les Axes du Graphique</h3>
            <ul>
                <li><strong>Axe X (horizontal)</strong> : Le temps</li>
                <li><strong>Axe Y (vertical)</strong> : Le prix</li>
            </ul>
        """,
        "key_points": [
            "Le graphique en chandeliers est le plus utilisé en trading",
            "Chaque bougie contient 4 informations : Open, High, Low, Close",
            "Vert = haussier, Rouge = baissier",
            "L'axe X représente le temps, l'axe Y le prix"
        ],
        "quiz": []
    },
    (2, 2): {
        "title": "Les chandeliers japonais",
        "video_url": "",
        "content": """
            <h3>🏯 Histoire des Chandeliers Japonais</h3>
            <p>Les chandeliers japonais ont été inventés au 18ème siècle par Munehisa Homma, un trader de riz japonais. Cette méthode a été popularisée en Occident par Steve Nison dans les années 1990.</p>
            
            <h3>🕯️ Structure d'un Chandelier</h3>
            <ul>
                <li><strong>Corps (Body)</strong> : Rectangle entre Open et Close</li>
                <li><strong>Mèche haute (Upper Shadow)</strong> : Ligne au-dessus du corps jusqu'au High</li>
                <li><strong>Mèche basse (Lower Shadow)</strong> : Ligne en-dessous du corps jusqu'au Low</li>
            </ul>
            
            <h3>📊 Interprétation de Base</h3>
            <ul>
                <li><strong>Grand corps</strong> : Forte pression acheteuse ou vendeuse</li>
                <li><strong>Petit corps</strong> : Indécision du marché</li>
                <li><strong>Longue mèche haute</strong> : Rejet des prix hauts (pression vendeuse)</li>
                <li><strong>Longue mèche basse</strong> : Rejet des prix bas (pression acheteuse)</li>
            </ul>
            
            <h3>💡 Avantages des Chandeliers</h3>
            <ul>
                <li>Visualisation rapide de la psychologie du marché</li>
                <li>Identification des retournements potentiels</li>
                <li>Patterns reconnaissables et fiables</li>
            </ul>
        """,
        "key_points": [
            "Les chandeliers japonais datent du 18ème siècle",
            "Le corps montre la différence entre Open et Close",
            "Les mèches montrent les extrêmes de la période",
            "La taille du corps et des mèches donne des indications sur le marché"
        ],
        "quiz": []
    },
    (2, 3): {
        "title": "Anatomie d'une bougie",
        "video_url": "",
        "content": """
            <h3>🔍 Analyse Détaillée d'une Bougie</h3>
            
            <h4>Corps de la Bougie</h4>
            <ul>
                <li><strong>Marubozu</strong> : Corps plein sans mèches - forte conviction</li>
                <li><strong>Spinning Top</strong> : Petit corps avec mèches égales - indécision</li>
                <li><strong>Doji</strong> : Open = Close - équilibre parfait</li>
            </ul>
            
            <h4>Les Mèches (Shadows)</h4>
            <ul>
                <li><strong>Mèche supérieure longue</strong> : Les vendeurs ont repoussé le prix</li>
                <li><strong>Mèche inférieure longue</strong> : Les acheteurs ont défendu le prix</li>
                <li><strong>Pas de mèche</strong> : Contrôle total d'un camp</li>
            </ul>
            
            <h3>📐 Ratios Importants</h3>
            <ul>
                <li><strong>Ratio corps/mèche</strong> : Plus le corps est grand vs les mèches, plus le mouvement est fort</li>
                <li><strong>Position du corps</strong> : Haut = force acheteuse, Bas = force vendeuse</li>
            </ul>
            
            <h3>🎯 Bougies Significatives</h3>
            <ul>
                <li><strong>Hammer</strong> : Petite corps en haut, longue mèche basse - retournement haussier</li>
                <li><strong>Shooting Star</strong> : Petit corps en bas, longue mèche haute - retournement baissier</li>
                <li><strong>Engulfing</strong> : Une bougie englobe complètement la précédente</li>
            </ul>
        """,
        "key_points": [
            "Le Marubozu indique une forte conviction du marché",
            "Le Doji signale une indécision",
            "Les mèches longues montrent un rejet de prix",
            "Hammer et Shooting Star sont des signaux de retournement"
        ],
        "quiz": []
    },
    (2, 4): {
        "title": "Les timeframes expliqués",
        "video_url": "",
        "content": """
            <h3>⏰ Qu'est-ce qu'un Timeframe ?</h3>
            <p>Le timeframe (unité de temps) détermine la durée représentée par chaque bougie sur le graphique.</p>
            
            <h3>📊 Timeframes Courants</h3>
            <ul>
                <li><strong>1m, 5m, 15m</strong> : Scalping, très court terme</li>
                <li><strong>1h, 4h</strong> : Day trading, intraday</li>
                <li><strong>1D (Daily)</strong> : Swing trading, moyen terme</li>
                <li><strong>1W (Weekly)</strong> : Position trading, long terme</li>
                <li><strong>1M (Monthly)</strong> : Investissement, très long terme</li>
            </ul>
            
            <h3>🎯 Choisir son Timeframe</h3>
            <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: rgba(6,182,212,0.2);">
                    <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Style</th>
                    <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Timeframe Principal</th>
                    <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Timeframe Secondaire</th>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Scalping</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">1m - 5m</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">15m - 1h</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Day Trading</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">15m - 1h</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">4h - 1D</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Swing Trading</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">4h - 1D</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">1W</td>
                </tr>
            </table>
            
            <h3>💡 Analyse Multi-Timeframe</h3>
            <p>Toujours analyser plusieurs timeframes : le grand pour la tendance, le petit pour l'entrée.</p>
        """,
        "key_points": [
            "Le timeframe définit la durée de chaque bougie",
            "Adaptez le timeframe à votre style de trading",
            "Utilisez l'analyse multi-timeframe pour de meilleures décisions",
            "Le timeframe supérieur donne la tendance générale"
        ],
        "quiz": []
    },
    (2, 5): {
        "title": "Identifier une tendance",
        "video_url": "",
        "content": """
            <h3>📈 Les 3 Types de Tendances</h3>
            <ul>
                <li><strong>Tendance haussière (Uptrend)</strong> : Sommets et creux de plus en plus hauts</li>
                <li><strong>Tendance baissière (Downtrend)</strong> : Sommets et creux de plus en plus bas</li>
                <li><strong>Range (Consolidation)</strong> : Prix oscillant entre deux niveaux</li>
            </ul>
            
            <h3>🔍 Comment Identifier une Tendance</h3>
            <h4>Méthode des Sommets et Creux</h4>
            <ul>
                <li>Uptrend : Higher Highs (HH) + Higher Lows (HL)</li>
                <li>Downtrend : Lower Highs (LH) + Lower Lows (LL)</li>
            </ul>
            
            <h4>Méthode des Moyennes Mobiles</h4>
            <ul>
                <li>Prix au-dessus de la MA = tendance haussière</li>
                <li>Prix en-dessous de la MA = tendance baissière</li>
            </ul>
            
            <h3>⚠️ Règle d'Or</h3>
            <p><strong>"The trend is your friend"</strong> - Tradez toujours dans le sens de la tendance principale !</p>
            
            <h3>🔄 Changement de Tendance</h3>
            <ul>
                <li>Break of Structure (BOS) : Cassure d'un niveau clé</li>
                <li>Change of Character (CHoCH) : Changement de comportement du prix</li>
            </ul>
        """,
        "key_points": [
            "Uptrend = sommets et creux de plus en plus hauts",
            "Downtrend = sommets et creux de plus en plus bas",
            "Tradez dans le sens de la tendance",
            "Un break of structure peut signaler un changement de tendance"
        ],
        "quiz": []
    },
    
    # Module 3: Gestion du Capital
    (3, 1): {
        "title": "Pourquoi la gestion du capital est cruciale",
        "video_url": "",
        "content": """
            <h3>💰 L'Importance du Money Management</h3>
            <p>La gestion du capital est LA compétence la plus importante en trading. Même avec une stratégie gagnante, une mauvaise gestion du risque peut mener à la ruine.</p>
            
            <h3>📊 Statistiques Révélatrices</h3>
            <ul>
                <li>90% des traders perdent de l'argent</li>
                <li>La majorité perdent à cause d'une mauvaise gestion du risque</li>
                <li>Les traders professionnels risquent rarement plus de 1-2% par trade</li>
            </ul>
            
            <h3>🎯 Objectifs du Money Management</h3>
            <ul>
                <li><strong>Survie</strong> : Rester dans le jeu assez longtemps pour apprendre</li>
                <li><strong>Préservation</strong> : Protéger votre capital des pertes importantes</li>
                <li><strong>Croissance</strong> : Faire fructifier votre capital de manière durable</li>
            </ul>
            
            <h3>⚠️ Le Risque de Ruine</h3>
            <p>Si vous perdez 50% de votre capital, vous devez gagner 100% pour revenir à zéro. C'est pourquoi limiter les pertes est crucial.</p>
            
            <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: rgba(239,68,68,0.2);">
                    <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Perte</th>
                    <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Gain nécessaire pour récupérer</th>
                </tr>
                <tr><td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">10%</td><td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">11%</td></tr>
                <tr><td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">25%</td><td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">33%</td></tr>
                <tr><td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">50%</td><td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">100%</td></tr>
                <tr><td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">75%</td><td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">300%</td></tr>
            </table>
        """,
        "key_points": [
            "La gestion du capital est plus importante que la stratégie",
            "90% des traders perdent à cause d'une mauvaise gestion du risque",
            "Une perte de 50% nécessite un gain de 100% pour récupérer",
            "L'objectif principal est la survie et la préservation du capital"
        ],
        "quiz": []
    },
    (3, 2): {
        "title": "Définir son capital de trading",
        "video_url": "",
        "content": """
            <h3>💵 Quel Capital pour Commencer ?</h3>
            <p>Le capital de trading doit être de l'argent que vous pouvez vous permettre de perdre entièrement sans affecter votre vie quotidienne.</p>
            
            <h3>🚫 Règles Fondamentales</h3>
            <ul>
                <li>N'investissez JAMAIS l'argent du loyer ou des factures</li>
                <li>N'empruntez JAMAIS pour trader</li>
                <li>N'utilisez pas votre épargne de sécurité</li>
                <li>Considérez cet argent comme "perdu" dès le départ</li>
            </ul>
            
            <h3>📊 Recommandations par Profil</h3>
            <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: rgba(6,182,212,0.2);">
                    <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Profil</th>
                    <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Capital suggéré</th>
                    <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Objectif</th>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Débutant</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">100€ - 500€</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Apprentissage</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Intermédiaire</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">1000€ - 5000€</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Croissance</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Avancé</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">5000€+</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Revenus</td>
                </tr>
            </table>
            
            <h3>💡 Conseil Pro</h3>
            <p>Commencez petit, même si vous avez les moyens d'investir plus. L'apprentissage avec un petit capital vous coûtera moins cher en erreurs.</p>
        """,
        "key_points": [
            "N'investissez que l'argent que vous pouvez perdre",
            "N'empruntez jamais pour trader",
            "Commencez petit pour apprendre à moindre coût",
            "Augmentez progressivement avec l'expérience"
        ],
        "quiz": []
    },
    (3, 3): {
        "title": "La règle des 1-2%",
        "video_url": "",
        "content": """
            <h3>📏 La Règle d'Or du Risk Management</h3>
            <p>Ne risquez jamais plus de 1-2% de votre capital total sur un seul trade. Cette règle simple peut faire la différence entre survie et ruine.</p>
            
            <h3>🧮 Exemple Pratique</h3>
            <ul>
                <li>Capital : 1000€</li>
                <li>Risque max par trade (2%) : 20€</li>
                <li>Même avec 10 trades perdants consécutifs, vous perdez seulement ~18%</li>
            </ul>
            
            <h3>📊 Impact sur la Survie</h3>
            <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: rgba(6,182,212,0.2);">
                    <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Risque/Trade</th>
                    <th style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">Trades perdants pour -50%</th>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">10%</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">7 trades</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">5%</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">14 trades</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">2%</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">35 trades</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">1%</td>
                    <td style="padding: 10px; border: 1px solid rgba(255,255,255,0.1);">69 trades</td>
                </tr>
            </table>
            
            <h3>⚠️ Quand Ajuster le Risque</h3>
            <ul>
                <li><strong>Réduire à 0.5-1%</strong> : Série de pertes, nouveau marché, faible confiance</li>
                <li><strong>Maintenir à 2%</strong> : Conditions normales, stratégie validée</li>
                <li><strong>Jamais au-dessus de 2%</strong> : Même si vous êtes très confiant !</li>
            </ul>
        """,
        "key_points": [
            "Ne risquez jamais plus de 1-2% par trade",
            "Cette règle vous protège des séries de pertes",
            "Avec 2% de risque, il faut 35 pertes consécutives pour perdre 50%",
            "Réduisez le risque en période difficile"
        ],
        "quiz": []
    },
    
    # Module 4: Types d'Ordres
    (4, 1): {
        "title": "Les ordres Market",
        "video_url": "",
        "content": """
            <h3>⚡ Qu'est-ce qu'un Ordre Market ?</h3>
            <p>Un ordre market (ou ordre au marché) est exécuté immédiatement au meilleur prix disponible. C'est le type d'ordre le plus simple et le plus rapide.</p>
            
            <h3>✅ Avantages</h3>
            <ul>
                <li>Exécution garantie et instantanée</li>
                <li>Simple à utiliser</li>
                <li>Idéal pour entrer/sortir rapidement</li>
            </ul>
            
            <h3>❌ Inconvénients</h3>
            <ul>
                <li><strong>Slippage</strong> : Le prix d'exécution peut différer du prix affiché</li>
                <li>Frais "taker" généralement plus élevés</li>
                <li>Moins de contrôle sur le prix d'entrée</li>
            </ul>
            
            <h3>🎯 Quand Utiliser un Ordre Market</h3>
            <ul>
                <li>Urgence d'entrer ou sortir d'une position</li>
                <li>Marchés très liquides (BTC, ETH)</li>
                <li>Mouvements rapides où le timing est crucial</li>
                <li>Stop-loss mental atteint</li>
            </ul>
            
            <h3>⚠️ Attention au Slippage</h3>
            <p>Sur les marchés peu liquides ou en période de forte volatilité, le slippage peut être significatif. Préférez les ordres limit dans ces cas.</p>
        """,
        "key_points": [
            "L'ordre market s'exécute immédiatement au meilleur prix",
            "Exécution garantie mais prix non garanti",
            "Attention au slippage sur les marchés peu liquides",
            "Utilisez-le quand la vitesse est prioritaire"
        ],
        "quiz": []
    },
    (4, 2): {
        "title": "Les ordres Limit",
        "video_url": "",
        "content": """
            <h3>🎯 Qu'est-ce qu'un Ordre Limit ?</h3>
            <p>Un ordre limit vous permet de spécifier le prix exact auquel vous souhaitez acheter ou vendre. L'ordre ne s'exécute que si le marché atteint votre prix.</p>
            
            <h3>📊 Types d'Ordres Limit</h3>
            <ul>
                <li><strong>Buy Limit</strong> : Acheter à un prix inférieur au prix actuel</li>
                <li><strong>Sell Limit</strong> : Vendre à un prix supérieur au prix actuel</li>
            </ul>
            
            <h3>✅ Avantages</h3>
            <ul>
                <li>Contrôle total sur le prix d'exécution</li>
                <li>Pas de slippage</li>
                <li>Frais "maker" généralement plus bas</li>
                <li>Permet de planifier ses entrées à l'avance</li>
            </ul>
            
            <h3>❌ Inconvénients</h3>
            <ul>
                <li>Exécution non garantie</li>
                <li>Le prix peut ne jamais être atteint</li>
                <li>Peut manquer des opportunités</li>
            </ul>
            
            <h3>💡 Stratégies avec les Ordres Limit</h3>
            <ul>
                <li>Placer des buy limits sur les supports</li>
                <li>Placer des sell limits sur les résistances</li>
                <li>Utiliser pour les take-profits</li>
            </ul>
        """,
        "key_points": [
            "L'ordre limit s'exécute uniquement au prix spécifié ou mieux",
            "Buy limit = acheter plus bas, Sell limit = vendre plus haut",
            "Pas de slippage mais exécution non garantie",
            "Idéal pour planifier ses entrées sur les niveaux clés"
        ],
        "quiz": []
    },
    (4, 3): {
        "title": "Les ordres Stop-Loss",
        "video_url": "",
        "content": """
            <h3>🛡️ Qu'est-ce qu'un Stop-Loss ?</h3>
            <p>Un stop-loss est un ordre qui ferme automatiquement votre position lorsque le prix atteint un niveau de perte prédéfini. C'est votre assurance contre les pertes catastrophiques.</p>
            
            <h3>📊 Types de Stop-Loss</h3>
            <ul>
                <li><strong>Stop Market</strong> : Se transforme en ordre market quand le prix est atteint</li>
                <li><strong>Stop Limit</strong> : Se transforme en ordre limit quand le prix est atteint</li>
            </ul>
            
            <h3>🎯 Où Placer son Stop-Loss ?</h3>
            <ul>
                <li>Sous le dernier support (pour un long)</li>
                <li>Au-dessus de la dernière résistance (pour un short)</li>
                <li>Basé sur l'ATR (Average True Range)</li>
                <li>Selon votre risque maximum par trade (1-2%)</li>
            </ul>
            
            <h3>⚠️ Erreurs Courantes</h3>
            <ul>
                <li>Stop trop serré = sorti trop tôt par le bruit du marché</li>
                <li>Stop trop large = pertes trop importantes</li>
                <li>Déplacer son stop dans le mauvais sens</li>
                <li>Ne pas mettre de stop du tout !</li>
            </ul>
            
            <h3>💡 Règle d'Or</h3>
            <p><strong>Toujours placer un stop-loss AVANT d'entrer en position.</strong> Décidez de votre sortie avant même d'entrer.</p>
        """,
        "key_points": [
            "Le stop-loss protège contre les pertes importantes",
            "Placez-le sous le support (long) ou au-dessus de la résistance (short)",
            "Ne déplacez jamais votre stop dans le sens de la perte",
            "Toujours définir le stop AVANT d'entrer en position"
        ],
        "quiz": []
    },
    
    # Module 7: Supports & Résistances
    (7, 1): {
        "title": "Qu'est-ce qu'un support ?",
        "video_url": "",
        "content": """
            <h3>📉 Définition du Support</h3>
            <p>Un support est un niveau de prix où la demande (acheteurs) est suffisamment forte pour empêcher le prix de baisser davantage. C'est un "plancher" psychologique.</p>
            
            <h3>🔍 Comment Identifier un Support</h3>
            <ul>
                <li>Zone où le prix a rebondi plusieurs fois</li>
                <li>Ancienne résistance devenue support</li>
                <li>Niveaux psychologiques (chiffres ronds)</li>
                <li>Zones de forte accumulation de volume</li>
            </ul>
            
            <h3>💡 Psychologie du Support</h3>
            <p>Les supports fonctionnent car :</p>
            <ul>
                <li>Les acheteurs voient une opportunité à ce prix</li>
                <li>Les vendeurs à découvert prennent leurs profits</li>
                <li>La mémoire collective du marché</li>
            </ul>
            
            <h3>📊 Force d'un Support</h3>
            <p>Un support est plus fort si :</p>
            <ul>
                <li>Il a été testé plusieurs fois sans casser</li>
                <li>Il correspond à un niveau sur un timeframe supérieur</li>
                <li>Il coïncide avec d'autres indicateurs (MA, Fibonacci)</li>
                <li>Le volume augmente à chaque test</li>
            </ul>
        """,
        "key_points": [
            "Un support est un niveau où les acheteurs interviennent",
            "Plus un support est testé, plus il est significatif",
            "Les supports peuvent devenir des résistances une fois cassés",
            "Combinez avec d'autres outils pour confirmer"
        ],
        "quiz": []
    },
    (7, 2): {
        "title": "Qu'est-ce qu'une résistance ?",
        "video_url": "",
        "content": """
            <h3>📈 Définition de la Résistance</h3>
            <p>Une résistance est un niveau de prix où l'offre (vendeurs) est suffisamment forte pour empêcher le prix de monter davantage. C'est un "plafond" psychologique.</p>
            
            <h3>🔍 Comment Identifier une Résistance</h3>
            <ul>
                <li>Zone où le prix a été rejeté plusieurs fois</li>
                <li>Ancien support devenu résistance</li>
                <li>Plus hauts historiques (ATH)</li>
                <li>Niveaux psychologiques</li>
            </ul>
            
            <h3>💡 Psychologie de la Résistance</h3>
            <p>Les résistances fonctionnent car :</p>
            <ul>
                <li>Les détenteurs vendent pour prendre leurs profits</li>
                <li>Les acheteurs hésitent à ces niveaux élevés</li>
                <li>Les traders à découvert entrent en position</li>
            </ul>
            
            <h3>🔄 Flip de Support/Résistance</h3>
            <p>Quand une résistance est cassée, elle devient souvent un support (et vice versa). C'est le principe du "flip".</p>
        """,
        "key_points": [
            "Une résistance est un niveau où les vendeurs interviennent",
            "Les résistances cassées deviennent souvent des supports",
            "L'ATH est la résistance ultime",
            "Le volume confirme la force d'une résistance"
        ],
        "quiz": []
    },
    
    # Module 8: Indicateurs Techniques
    (8, 1): {
        "title": "Introduction aux indicateurs",
        "video_url": "",
        "content": """
            <h3>📊 Qu'est-ce qu'un Indicateur Technique ?</h3>
            <p>Un indicateur technique est un calcul mathématique basé sur le prix, le volume ou l'intérêt ouvert. Il aide à identifier des tendances, des retournements ou des conditions de surachat/survente.</p>
            
            <h3>📈 Catégories d'Indicateurs</h3>
            <ul>
                <li><strong>Indicateurs de tendance</strong> : MA, MACD, ADX</li>
                <li><strong>Oscillateurs</strong> : RSI, Stochastique, CCI</li>
                <li><strong>Indicateurs de volatilité</strong> : Bollinger Bands, ATR</li>
                <li><strong>Indicateurs de volume</strong> : OBV, Volume Profile</li>
            </ul>
            
            <h3>⚠️ Erreurs Courantes</h3>
            <ul>
                <li>Utiliser trop d'indicateurs (paralysie d'analyse)</li>
                <li>Ignorer le contexte du marché</li>
                <li>Suivre aveuglément les signaux</li>
                <li>Ne pas backtester ses stratégies</li>
            </ul>
            
            <h3>💡 Règle des 2-3 Indicateurs</h3>
            <p>Limitez-vous à 2-3 indicateurs complémentaires. Par exemple : 1 indicateur de tendance + 1 oscillateur + le volume.</p>
        """,
        "key_points": [
            "Les indicateurs aident à analyser le marché objectivement",
            "Il existe 4 grandes catégories d'indicateurs",
            "N'utilisez pas plus de 2-3 indicateurs",
            "Les indicateurs sont des outils, pas des certitudes"
        ],
        "quiz": []
    },
    (8, 2): {
        "title": "Le RSI en détail",
        "video_url": "",
        "content": """
            <h3>📊 Qu'est-ce que le RSI ?</h3>
            <p>Le RSI (Relative Strength Index) est un oscillateur qui mesure la vitesse et l'amplitude des mouvements de prix. Il oscille entre 0 et 100.</p>
            
            <h3>🎯 Niveaux Clés</h3>
            <ul>
                <li><strong>Au-dessus de 70</strong> : Zone de surachat (potentiel retournement baissier)</li>
                <li><strong>En-dessous de 30</strong> : Zone de survente (potentiel retournement haussier)</li>
                <li><strong>Niveau 50</strong> : Ligne médiane, indique la tendance</li>
            </ul>
            
            <h3>📈 Utilisations du RSI</h3>
            <ul>
                <li><strong>Surachat/Survente</strong> : Identifier les excès du marché</li>
                <li><strong>Divergences</strong> : Prix vs RSI pour anticiper les retournements</li>
                <li><strong>Support/Résistance</strong> : Le RSI forme aussi des niveaux</li>
                <li><strong>Tendance</strong> : RSI > 50 = haussier, RSI < 50 = baissier</li>
            </ul>
            
            <h3>⚠️ Attention</h3>
            <p>En tendance forte, le RSI peut rester en zone extrême longtemps. Ne vendez pas uniquement parce que le RSI est en surachat !</p>
        """,
        "key_points": [
            "Le RSI oscille entre 0 et 100",
            "Au-dessus de 70 = surachat, en-dessous de 30 = survente",
            "Les divergences RSI sont des signaux puissants",
            "En tendance forte, le RSI peut rester en zone extrême"
        ],
        "quiz": []
    },
}

def get_lesson_content(module_id: int, lesson_id: int) -> dict:
    """Récupère le contenu d'une leçon spécifique."""
    key = (module_id, lesson_id)
    if key in LESSON_CONTENT:
        return LESSON_CONTENT[key]
    
    # Contenu par défaut si non défini
    return {
        "title": f"Leçon {lesson_id}",
        "video_url": "",
        "content": """
            <h3>📚 Contenu en cours de développement</h3>
            <p>Cette leçon est en cours de préparation par notre équipe pédagogique. 
            Le contenu complet sera disponible très prochainement.</p>
            
            <p>En attendant, n'hésitez pas à :</p>
            <ul>
                <li>Revoir les leçons précédentes</li>
                <li>Pratiquer sur un compte démo</li>
                <li>Rejoindre notre communauté Discord</li>
            </ul>
        """,
        "key_points": [
            "Contenu en cours de développement",
            "Revenez bientôt pour le contenu complet",
            "Pratiquez en attendant sur un compte démo"
        ],
        "quiz": []
    }