"""
Contenu détaillé des leçons de l'Academy Trading
22 Modules complets avec vidéos YouTube en français
"""
from youtube_videos import get_video_url

# Import du contenu étendu pour les modules 4-8
try:
    from academy_content_extended import get_extended_content
except ImportError:
    get_extended_content = lambda m, l: None

LESSON_CONTENT = {
    # ============================================
    # MODULE 1: Introduction au Trading Crypto
    # ============================================
    (1, 1): {
        "title": "Introduction au Trading Crypto",
        "video_url": "",
        "content": """
            <h3>🎯 Qu'est-ce que le Trading de Cryptomonnaies ?</h3>
            <p>Le trading de cryptomonnaies consiste à acheter et vendre des actifs numériques dans le but de réaliser des profits. Contrairement à l'investissement traditionnel où l'on conserve ses actifs sur le long terme, le trading implique des transactions plus fréquentes pour profiter des fluctuations de prix.</p>
            
            <h3>📊 Les Marchés Crypto - Un Écosystème Unique</h3>
            <p>Les marchés crypto fonctionnent <strong>24h/24, 7j/7</strong>, contrairement aux marchés boursiers traditionnels. Cette disponibilité permanente offre plus d'opportunités mais demande aussi une gestion rigoureuse.</p>
            
            <h4>Caractéristiques des marchés crypto :</h4>
            <ul>
                <li><strong>Volatilité élevée</strong> : Les prix peuvent varier de 10-20% en une seule journée</li>
                <li><strong>Accessibilité mondiale</strong> : N'importe qui peut trader depuis n'importe où</li>
                <li><strong>Décentralisation</strong> : Pas d'autorité centrale qui contrôle le marché</li>
                <li><strong>Liquidité variable</strong> : Bitcoin et Ethereum sont très liquides, les petites cryptos moins</li>
            </ul>
            
            <h3>💡 Les Différents Styles de Trading</h3>
            <ul>
                <li><strong>Day Trading</strong> : Positions ouvertes et fermées dans la même journée</li>
                <li><strong>Swing Trading</strong> : Positions maintenues plusieurs jours à semaines</li>
                <li><strong>Scalping</strong> : Trades très courts pour de petits gains répétés</li>
                <li><strong>Position Trading</strong> : Positions sur plusieurs mois</li>
            </ul>
            
            <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #1a1a2e; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <strong>⚠️ RÈGLE D'OR :</strong> Ne tradez JAMAIS avec de l'argent que vous ne pouvez pas vous permettre de perdre. 90% des traders perdent de l'argent.
            </div>
        """,
        "key_points": [
            "Le trading crypto permet de profiter des fluctuations de prix 24h/24, 7j/7",
            "Différents styles existent : Day Trading, Swing Trading, Scalping",
            "La volatilité offre des opportunités mais aussi des risques importants",
            "Ne jamais investir plus que ce qu'on peut se permettre de perdre"
        ],
        "quiz": []
    },
    (1, 2): {
        "title": "Les différents types de cryptomonnaies",
        "video_url": "",
        "content": """
            <h3>🪙 Bitcoin (BTC) - La Première Cryptomonnaie</h3>
            <p>Créé en 2009 par Satoshi Nakamoto, Bitcoin est la première cryptomonnaie décentralisée. Il représente environ 40-50% de la capitalisation totale du marché crypto.</p>
            
            <h3>💎 Ethereum (ETH) - La Plateforme des Smart Contracts</h3>
            <p>Lancé en 2015 par Vitalik Buterin, Ethereum permet de créer des applications décentralisées (dApps) et des smart contracts.</p>
            
            <h3>🏷️ Catégories de Cryptomonnaies</h3>
            
            <h4>1. Layer 1 - Les Blockchains Principales</h4>
            <ul>
                <li><strong>Bitcoin (BTC)</strong> : Réserve de valeur, "or numérique"</li>
                <li><strong>Ethereum (ETH)</strong> : Smart contracts, DeFi, NFTs</li>
                <li><strong>Solana (SOL)</strong> : Haute performance, faibles frais</li>
                <li><strong>Cardano (ADA)</strong> : Approche académique et scientifique</li>
            </ul>
            
            <h4>2. Stablecoins - Cryptos Stables</h4>
            <ul>
                <li><strong>USDT (Tether)</strong> : Le plus utilisé, indexé au dollar</li>
                <li><strong>USDC (Circle)</strong> : Plus régulé et transparent</li>
                <li><strong>DAI</strong> : Stablecoin décentralisé</li>
            </ul>
            
            <h4>3. Tokens DeFi</h4>
            <ul>
                <li><strong>Uniswap (UNI)</strong> : Exchange décentralisé leader</li>
                <li><strong>Aave (AAVE)</strong> : Protocole de prêt</li>
                <li><strong>Chainlink (LINK)</strong> : Oracles décentralisés</li>
            </ul>
            
            <h4>4. Memecoins</h4>
            <ul>
                <li><strong>Dogecoin (DOGE)</strong> : Le premier memecoin</li>
                <li><strong>Shiba Inu (SHIB)</strong> : "Tueur de Dogecoin"</li>
            </ul>
        """,
        "key_points": [
            "Bitcoin est la première crypto et représente ~50% du marché",
            "Ethereum permet les smart contracts et héberge la DeFi",
            "Les cryptos se classent en catégories : L1, L2, DeFi, Stablecoins, Memecoins",
            "Les stablecoins sont indexés au dollar et servent de refuge"
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
            
            <h4>CEX (Centralized Exchange) - Exchanges Centralisés</h4>
            <ul>
                <li><strong>Binance</strong> : Le plus grand exchange au monde par volume</li>
                <li><strong>Coinbase</strong> : Très régulé, idéal pour débutants américains</li>
                <li><strong>Kraken</strong> : Sécurisé, bonne réputation en Europe</li>
                <li><strong>OKX</strong> : Grande variété de produits</li>
            </ul>
            
            <h4>DEX (Decentralized Exchange) - Exchanges Décentralisés</h4>
            <ul>
                <li><strong>Uniswap</strong> : Leader sur Ethereum</li>
                <li><strong>PancakeSwap</strong> : Leader sur BNB Chain</li>
                <li><strong>dYdX</strong> : Trading de dérivés décentralisé</li>
            </ul>
            
            <h3>💰 Le Carnet d'Ordres (Order Book)</h3>
            <ul>
                <li><strong>Bids (Offres d'achat)</strong> : Ordres d'achat en attente</li>
                <li><strong>Asks (Offres de vente)</strong> : Ordres de vente en attente</li>
                <li><strong>Spread</strong> : Différence entre le meilleur bid et le meilleur ask</li>
            </ul>
            
            <h3>💸 Les Frais</h3>
            <ul>
                <li><strong>Frais Maker</strong> : Quand vous ajoutez de la liquidité (ordre limit)</li>
                <li><strong>Frais Taker</strong> : Quand vous prenez de la liquidité (ordre market)</li>
                <li>Généralement entre 0.1% et 0.5% par trade</li>
            </ul>
        """,
        "key_points": [
            "Un exchange permet d'acheter et vendre des cryptos",
            "CEX sont centralisés et faciles, DEX sont décentralisés et anonymes",
            "Le carnet d'ordres montre l'offre et la demande en temps réel",
            "Comparez les frais entre exchanges avant de choisir"
        ],
        "quiz": []
    },
    (1, 4): {
        "title": "Vocabulaire essentiel du trader",
        "video_url": "",
        "content": """
            <h3>📖 Vocabulaire Trading Essentiel</h3>
            
            <h4>🐂 Termes de Marché</h4>
            <ul>
                <li><strong>Bull Market</strong> : Marché haussier, tendance à la hausse prolongée</li>
                <li><strong>Bear Market</strong> : Marché baissier, tendance à la baisse prolongée</li>
                <li><strong>Bullish</strong> : Sentiment positif, anticipation de hausse</li>
                <li><strong>Bearish</strong> : Sentiment négatif, anticipation de baisse</li>
                <li><strong>Sideways/Range</strong> : Marché sans direction claire</li>
            </ul>
            
            <h4>📊 Termes de Position</h4>
            <ul>
                <li><strong>Long</strong> : Position acheteuse (pari sur la hausse)</li>
                <li><strong>Short</strong> : Position vendeuse (pari sur la baisse)</li>
                <li><strong>Leverage/Levier</strong> : Multiplicateur de position (ex: x10)</li>
                <li><strong>Liquidation</strong> : Fermeture forcée d'une position à effet de levier</li>
                <li><strong>Margin</strong> : Capital utilisé comme garantie</li>
            </ul>
            
            <h4>💰 Termes de Prix</h4>
            <ul>
                <li><strong>ATH (All-Time High)</strong> : Plus haut historique</li>
                <li><strong>ATL (All-Time Low)</strong> : Plus bas historique</li>
                <li><strong>Dip</strong> : Baisse temporaire du prix</li>
                <li><strong>Pump</strong> : Hausse rapide et forte</li>
                <li><strong>Dump</strong> : Baisse rapide et forte</li>
            </ul>
            
            <h4>🧠 Termes Psychologiques</h4>
            <ul>
                <li><strong>HODL</strong> : Hold On for Dear Life - Conserver malgré les baisses</li>
                <li><strong>FOMO</strong> : Fear Of Missing Out - Peur de rater une opportunité</li>
                <li><strong>FUD</strong> : Fear, Uncertainty, Doubt - Peur, incertitude, doute</li>
                <li><strong>Diamond Hands</strong> : Tenir ses positions sans vendre</li>
                <li><strong>Paper Hands</strong> : Vendre à la moindre baisse</li>
            </ul>
        """,
        "key_points": [
            "Bull = haussier, Bear = baissier",
            "Long = achat (pari hausse), Short = vente (pari baisse)",
            "FOMO et FUD sont des émotions à contrôler",
            "Maîtriser le vocabulaire est essentiel pour comprendre le marché"
        ],
        "quiz": []
    },
    (1, 5): {
        "title": "Créer son compte sur un exchange",
        "video_url": "",
        "content": """
            <h3>📝 Guide : Créer son Compte Exchange</h3>
            
            <h3>🔍 Étape 1 : Choisir son Exchange</h3>
            <p>Critères de sélection :</p>
            <ul>
                <li>Réputation et sécurité</li>
                <li>Frais de trading</li>
                <li>Paires disponibles</li>
                <li>Interface utilisateur</li>
                <li>Support client</li>
            </ul>
            
            <h4>Recommandations par niveau :</h4>
            <ul>
                <li><strong>Débutant</strong> : Coinbase, Binance</li>
                <li><strong>Intermédiaire</strong> : Kraken, OKX</li>
                <li><strong>Avancé</strong> : Bybit, dYdX</li>
            </ul>
            
            <h3>📧 Étape 2 : Inscription</h3>
            <ol>
                <li>Allez sur le site OFFICIEL de l'exchange</li>
                <li>Cliquez sur "S'inscrire" ou "Register"</li>
                <li>Entrez votre adresse email</li>
                <li>Créez un mot de passe FORT et UNIQUE</li>
                <li>Confirmez votre email</li>
            </ol>
            
            <h3>🔐 Étape 3 : Mot de Passe Fort</h3>
            <ul>
                <li>Minimum 12 caractères</li>
                <li>Majuscules ET minuscules</li>
                <li>Chiffres ET symboles</li>
                <li>UNIQUE pour chaque site</li>
                <li>Utilisez un gestionnaire de mots de passe</li>
            </ul>
            
            <h3>🪪 Étape 4 : Vérification KYC</h3>
            <p>Know Your Customer - Vérification d'identité obligatoire</p>
            <ul>
                <li>Pièce d'identité (passeport, carte d'identité)</li>
                <li>Selfie avec le document</li>
                <li>Justificatif de domicile (parfois)</li>
            </ul>
        """,
        "key_points": [
            "Choisir un exchange régulé et réputé",
            "Créer un mot de passe fort et unique",
            "La vérification KYC est obligatoire sur les CEX",
            "Toujours vérifier l'URL avant de se connecter"
        ],
        "quiz": []
    },
    (1, 6): {
        "title": "Sécuriser son compte (2FA)",
        "video_url": "",
        "content": """
            <h3>🔐 La Double Authentification (2FA)</h3>
            <p>Le 2FA est la mesure de sécurité la plus importante pour protéger votre compte. Elle ajoute une deuxième couche de vérification en plus du mot de passe.</p>
            
            <h3>📱 Types de 2FA (du plus au moins sécurisé)</h3>
            <ul>
                <li><strong>🥇 Clé Physique (YubiKey)</strong> : Le plus sécurisé, impossible à pirater à distance</li>
                <li><strong>🥈 Application Authenticator</strong> : Google Authenticator, Authy - Très recommandé</li>
                <li><strong>🥉 SMS</strong> : Déconseillé car vulnérable au SIM swap</li>
                <li><strong>❌ Email</strong> : Le moins sécurisé</li>
            </ul>
            
            <h3>📲 Configurer Google Authenticator</h3>
            <ol>
                <li>Téléchargez Google Authenticator sur votre téléphone</li>
                <li>Dans les paramètres de sécurité de l'exchange, activez le 2FA</li>
                <li>Scannez le QR code avec l'application</li>
                <li><strong>SAUVEGARDEZ LA CLÉ SECRÈTE</strong> (très important !)</li>
                <li>Entrez le code à 6 chiffres pour confirmer</li>
            </ol>
            
            <h3>⚠️ CRUCIAL : Codes de Récupération</h3>
            <div style="background: #ffebee; padding: 15px; border-radius: 8px; border-left: 4px solid #f44336;">
                <strong>IMPORTANT :</strong>
                <ul>
                    <li>Notez les codes de récupération sur PAPIER</li>
                    <li>Gardez-les dans un endroit sûr (coffre-fort)</li>
                    <li>Ne les photographiez PAS</li>
                    <li>Ne les stockez PAS sur votre ordinateur</li>
                </ul>
            </div>
        """,
        "key_points": [
            "2FA = Double authentification, INDISPENSABLE",
            "Préférer Google Authenticator au SMS",
            "TOUJOURS sauvegarder les codes de récupération sur papier",
            "Ne jamais partager ses codes 2FA avec personne"
        ],
        "quiz": []
    },
    (1, 7): {
        "title": "Effectuer son premier dépôt",
        "video_url": "",
        "content": """
            <h3>💳 Méthodes de Dépôt</h3>
            
            <h4>1. Virement Bancaire (SEPA)</h4>
            <ul>
                <li><strong>Frais</strong> : 0-1€ généralement</li>
                <li><strong>Délai</strong> : 1-3 jours ouvrés</li>
                <li><strong>Avantage</strong> : Idéal pour les gros montants</li>
            </ul>
            
            <h4>2. Carte Bancaire</h4>
            <ul>
                <li><strong>Frais</strong> : 1.5-3.5% selon l'exchange</li>
                <li><strong>Délai</strong> : Instantané</li>
                <li><strong>Avantage</strong> : Rapide et pratique</li>
            </ul>
            
            <h4>3. Dépôt Crypto</h4>
            <ul>
                <li><strong>Frais</strong> : Frais de réseau uniquement</li>
                <li><strong>Délai</strong> : 10-60 minutes selon le réseau</li>
                <li><strong>Avantage</strong> : Pas de frais de l'exchange</li>
            </ul>
            
            <h3>⚠️ ATTENTION : La Référence de Virement</h3>
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
                <strong>CRUCIAL :</strong> Incluez TOUJOURS la référence fournie par l'exchange dans votre virement bancaire. Sans cette référence, votre dépôt peut être perdu ou retardé de plusieurs semaines.
            </div>
            
            <h3>💡 Conseils pour le Premier Dépôt</h3>
            <ul>
                <li>Commencez avec un petit montant pour tester</li>
                <li>Vérifiez les frais avant de déposer</li>
                <li>Gardez une trace de toutes vos transactions</li>
            </ul>
        """,
        "key_points": [
            "Le virement SEPA est le moins cher pour les gros montants",
            "La carte bancaire est rapide mais avec des frais plus élevés",
            "TOUJOURS inclure la référence dans le virement bancaire",
            "Commencer avec un petit montant pour tester le processus"
        ],
        "quiz": []
    },
    (1, 8): {
        "title": "Quiz Module 1 - Test Complet",
        "video_url": "",
        "is_quiz": True,
        "content": """
            <h3>🎯 Quiz Final - Introduction au Trading Crypto</h3>
            <p>Ce quiz teste vos connaissances sur les bases du trading crypto. Vous devez obtenir au moins 70% pour valider ce module.</p>
            <p><strong>Temps estimé :</strong> 10-15 minutes</p>
        """,
        "key_points": [],
        "quiz": [
            {"question": "Les marchés crypto sont ouverts :", "options": ["Du lundi au vendredi, 9h-17h", "24h/24, 5j/7", "24h/24, 7j/7", "Uniquement le week-end"], "correct": 2},
            {"question": "Qu'est-ce qu'un exchange ?", "options": ["Un portefeuille crypto", "Une plateforme d'échange de cryptomonnaies", "Une cryptomonnaie", "Un indicateur technique"], "correct": 1},
            {"question": "Que signifie HODL ?", "options": ["Vendre rapidement ses cryptos", "Conserver ses cryptos sur le long terme", "Acheter en masse", "Analyser le marché"], "correct": 1},
            {"question": "Quel type de 2FA est le plus recommandé ?", "options": ["SMS", "Email", "Google Authenticator / Authy", "Pas de 2FA"], "correct": 2},
            {"question": "Qu'est-ce qu'un Bull Market ?", "options": ["Un marché baissier", "Un marché haussier", "Un marché stable", "Un marché fermé"], "correct": 1},
            {"question": "Que signifie FOMO ?", "options": ["Fear Of Making Orders", "Fear Of Missing Out", "First Order Market Order", "Final Order Management"], "correct": 1},
            {"question": "Quelle est la méthode de dépôt la moins chère ?", "options": ["Carte bancaire", "Virement SEPA", "PayPal", "Western Union"], "correct": 1},
            {"question": "Qu'est-ce qu'une position 'Long' ?", "options": ["Un pari sur la baisse", "Un pari sur la hausse", "Une position neutre", "Une position fermée"], "correct": 1},
            {"question": "Qu'est-ce qu'un CEX ?", "options": ["Un exchange décentralisé", "Un exchange centralisé", "Une cryptomonnaie", "Un type de wallet"], "correct": 1},
            {"question": "Que représente ATH ?", "options": ["All-Time High (plus haut historique)", "All-Time Hold", "Average Trading Hour", "Automated Trading Hub"], "correct": 0},
            {"question": "Pourquoi sauvegarder les codes de récupération 2FA ?", "options": ["Pour les partager avec le support", "Pour récupérer l'accès si vous perdez votre téléphone", "Ce n'est pas nécessaire", "Pour les stocker en ligne"], "correct": 1},
            {"question": "Qu'est-ce qu'une 'Whale' en crypto ?", "options": ["Un petit investisseur", "Un gros investisseur qui peut influencer le marché", "Un type de cryptomonnaie", "Un exchange"], "correct": 1}
        ]
    },
    
    # ============================================
    # MODULE 2: Lecture des Graphiques
    # ============================================
    (2, 1): {
        "title": "Introduction aux graphiques de trading",
        "video_url": "",
        "content": """
            <h3>📊 Pourquoi les Graphiques sont Essentiels</h3>
            <p>Les graphiques sont l'outil principal du trader. Ils permettent de visualiser l'évolution du prix dans le temps et d'identifier des opportunités de trading.</p>
            
            <h3>📈 Types de Graphiques</h3>
            <ul>
                <li><strong>Graphique en Ligne</strong> : Simple, montre la tendance générale</li>
                <li><strong>Graphique en Barres (OHLC)</strong> : Montre Open, High, Low, Close</li>
                <li><strong>Chandeliers Japonais</strong> : Le plus utilisé, très visuel</li>
                <li><strong>Heikin-Ashi</strong> : Chandeliers lissés pour tendances</li>
            </ul>
            
            <h3>🎯 Anatomie d'un Graphique</h3>
            <ul>
                <li><strong>Axe X (horizontal)</strong> : Le temps</li>
                <li><strong>Axe Y (vertical)</strong> : Le prix</li>
                <li><strong>Volume</strong> : En bas, montre l'activité</li>
            </ul>
            
            <h3>📐 Échelle Linéaire vs Logarithmique</h3>
            <ul>
                <li><strong>Linéaire</strong> : Chaque unité a la même hauteur</li>
                <li><strong>Logarithmique</strong> : Montre les variations en %, essentiel pour le long terme</li>
            </ul>
        """,
        "key_points": [
            "Les graphiques visualisent l'évolution du prix dans le temps",
            "Les chandeliers japonais sont les plus utilisés en trading",
            "L'axe X représente le temps, l'axe Y le prix",
            "L'échelle logarithmique est essentielle pour le long terme"
        ],
        "quiz": []
    },
    (2, 2): {
        "title": "Les chandeliers japonais",
        "video_url": "",
        "content": """
            <h3>🕯️ Anatomie d'un Chandelier</h3>
            <p>Chaque chandelier représente une période de temps et contient 4 informations :</p>
            <ul>
                <li><strong>Open (Ouverture)</strong> : Le premier prix de la période</li>
                <li><strong>High (Plus haut)</strong> : Le prix maximum atteint</li>
                <li><strong>Low (Plus bas)</strong> : Le prix minimum atteint</li>
                <li><strong>Close (Clôture)</strong> : Le dernier prix de la période</li>
            </ul>
            
            <h3>🟢🔴 Couleurs et Signification</h3>
            <ul>
                <li><strong>Vert/Blanc (Haussier)</strong> : Close > Open (le prix a monté)</li>
                <li><strong>Rouge/Noir (Baissier)</strong> : Close < Open (le prix a baissé)</li>
            </ul>
            
            <h3>📏 Corps et Mèches</h3>
            <ul>
                <li><strong>Grand corps</strong> : Fort mouvement, conviction des traders</li>
                <li><strong>Petit corps</strong> : Faible mouvement, indécision</li>
                <li><strong>Longue mèche haute</strong> : Rejet des prix hauts (pression vendeuse)</li>
                <li><strong>Longue mèche basse</strong> : Rejet des prix bas (pression acheteuse)</li>
            </ul>
        """,
        "key_points": [
            "Un chandelier contient 4 prix : Open, High, Low, Close",
            "Vert = haussier (prix monte), Rouge = baissier (prix baisse)",
            "Le corps montre la différence entre ouverture et clôture",
            "Les mèches montrent les rejets et les extrêmes"
        ],
        "quiz": []
    },
    (2, 3): {
        "title": "Les timeframes (unités de temps)",
        "video_url": "",
        "content": """
            <h3>⏰ Qu'est-ce qu'un Timeframe ?</h3>
            <p>Le timeframe est la période représentée par chaque chandelier sur votre graphique.</p>
            
            <h3>📊 Timeframes Disponibles</h3>
            <ul>
                <li><strong>1m, 5m, 15m</strong> : Scalping, Day Trading</li>
                <li><strong>1H, 4H</strong> : Day Trading, Swing Trading</li>
                <li><strong>1D, 1W, 1M</strong> : Swing Trading, Position Trading</li>
            </ul>
            
            <h3>🔄 L'Analyse Multi-Timeframe</h3>
            <ol>
                <li><strong>Grand Timeframe</strong> : Identifie la tendance principale</li>
                <li><strong>Timeframe Intermédiaire</strong> : Trouve les zones d'intérêt</li>
                <li><strong>Petit Timeframe</strong> : Timing précis pour entrer</li>
            </ol>
            
            <h3>💡 Recommandation Débutants</h3>
            <p>Commencez par les timeframes plus grands (4H et Daily) : moins de bruit, plus de temps pour analyser.</p>
        """,
        "key_points": [
            "Le timeframe détermine la durée de chaque chandelier",
            "Scalping = petits TF (1m-15m), Swing = grands TF (4H-Daily)",
            "L'analyse multi-timeframe améliore la précision",
            "Commencez par les grands timeframes pour moins de bruit"
        ],
        "quiz": []
    },
    (2, 4): {
        "title": "Identifier une tendance",
        "video_url": "",
        "content": """
            <h3>📈 Les 3 Types de Tendances</h3>
            <ul>
                <li><strong>Tendance Haussière</strong> : Higher Highs + Higher Lows (sommets et creux ascendants)</li>
                <li><strong>Tendance Baissière</strong> : Lower Highs + Lower Lows (sommets et creux descendants)</li>
                <li><strong>Range/Consolidation</strong> : Prix oscillant entre support et résistance</li>
            </ul>
            
            <h3>🎯 Comment Identifier une Tendance</h3>
            <ol>
                <li>Regardez les sommets et les creux successifs</li>
                <li>Tracez une ligne de tendance</li>
                <li>Utilisez les moyennes mobiles comme confirmation</li>
            </ol>
            
            <h3>💡 Règle d'Or</h3>
            <p style="font-size: 1.2em; color: #06b6d4;"><strong>"The trend is your friend"</strong> - Tradez dans le sens de la tendance !</p>
        """,
        "key_points": [
            "Haussière = Higher Highs + Higher Lows",
            "Baissière = Lower Highs + Lower Lows",
            "Tradez dans le sens de la tendance",
            "The trend is your friend"
        ],
        "quiz": []
    },
    (2, 5): {
        "title": "Introduction à TradingView",
        "video_url": "",
        "content": """
            <h3>📊 Qu'est-ce que TradingView ?</h3>
            <p>TradingView est la plateforme d'analyse technique la plus populaire au monde, utilisée par des millions de traders.</p>
            
            <h3>🛠️ Fonctionnalités Principales</h3>
            <ul>
                <li>Graphiques avancés et personnalisables</li>
                <li>Plus de 100 indicateurs techniques</li>
                <li>Outils de dessin (lignes, Fibonacci, etc.)</li>
                <li>Alertes de prix personnalisées</li>
                <li>Communauté active de traders</li>
            </ul>
            
            <h3>🎯 Premiers Pas</h3>
            <ol>
                <li>Créez un compte gratuit sur tradingview.com</li>
                <li>Recherchez une paire (ex: BTCUSDT)</li>
                <li>Explorez les outils de dessin</li>
                <li>Ajoutez vos premiers indicateurs</li>
            </ol>
        """,
        "key_points": [
            "TradingView est la plateforme d'analyse #1",
            "Offre des graphiques et indicateurs avancés",
            "Version gratuite suffisante pour débuter",
            "Communauté active de traders"
        ],
        "quiz": []
    },
    (2, 6): {
        "title": "Configurer son workspace",
        "video_url": "",
        "content": """
            <h3>⚙️ Configuration Optimale de TradingView</h3>
            
            <h4>Paramètres de Base</h4>
            <ul>
                <li>Thème sombre (moins fatiguant pour les yeux)</li>
                <li>Chandeliers japonais comme type de graphique</li>
                <li>Volume affiché en bas</li>
            </ul>
            
            <h4>Indicateurs Recommandés pour Débuter</h4>
            <ul>
                <li>Moyennes mobiles (20, 50, 200)</li>
                <li>RSI (Relative Strength Index)</li>
                <li>Volume</li>
            </ul>
            
            <h4>Layout Multi-Écrans</h4>
            <ul>
                <li>Écran 1 : Grand timeframe (Daily/Weekly)</li>
                <li>Écran 2 : Timeframe de trading (4H/1H)</li>
                <li>Écran 3 : Petit timeframe pour entrées (15m)</li>
            </ul>
        """,
        "key_points": [
            "Utilisez un thème sombre pour le confort",
            "Configurez les indicateurs essentiels",
            "Sauvegardez vos layouts personnalisés",
            "Multi-écrans pour analyse multi-timeframe"
        ],
        "quiz": []
    },
    (2, 7): {
        "title": "Patterns de chandeliers de base",
        "video_url": "",
        "content": """
            <h3>🕯️ Patterns de Retournement</h3>
            
            <h4>Marteau (Hammer)</h4>
            <ul>
                <li>Longue mèche basse, petit corps en haut</li>
                <li>Signal haussier après une baisse</li>
            </ul>
            
            <h4>Étoile Filante (Shooting Star)</h4>
            <ul>
                <li>Longue mèche haute, petit corps en bas</li>
                <li>Signal baissier après une hausse</li>
            </ul>
            
            <h4>Doji</h4>
            <ul>
                <li>Corps très petit ou inexistant</li>
                <li>Signal d'indécision, possible retournement</li>
            </ul>
            
            <h4>Engulfing (Avalement)</h4>
            <ul>
                <li>Une bougie englobe complètement la précédente</li>
                <li>Signal de retournement fort</li>
            </ul>
        """,
        "key_points": [
            "Marteau = signal haussier après baisse",
            "Étoile filante = signal baissier après hausse",
            "Doji = indécision du marché",
            "Engulfing = retournement fort"
        ],
        "quiz": []
    },
    (2, 8): {
        "title": "Exercice pratique : Analyse de BTC",
        "video_url": "",
        "content": """
            <h3>📝 Exercice : Analyser Bitcoin</h3>
            
            <h4>Étape 1 : Ouvrir TradingView</h4>
            <p>Recherchez BTC/USDT sur Binance</p>
            
            <h4>Étape 2 : Identifier la Tendance</h4>
            <ul>
                <li>Regardez le graphique Daily</li>
                <li>Identifiez les Higher Highs/Lows ou Lower Highs/Lows</li>
                <li>Déterminez si la tendance est haussière ou baissière</li>
            </ul>
            
            <h4>Étape 3 : Trouver les Niveaux Clés</h4>
            <ul>
                <li>Identifiez les supports (zones de rebond)</li>
                <li>Identifiez les résistances (zones de rejet)</li>
            </ul>
            
            <h4>Étape 4 : Analyser les Chandeliers</h4>
            <ul>
                <li>Cherchez des patterns de retournement</li>
                <li>Notez vos observations dans votre journal</li>
            </ul>
        """,
        "key_points": [
            "Pratiquez sur des graphiques réels",
            "Commencez par le Daily pour la vue d'ensemble",
            "Identifiez tendance et niveaux clés",
            "Notez vos analyses dans un journal"
        ],
        "quiz": []
    },
    (2, 9): {
        "title": "Exercice pratique : Analyse de ETH",
        "video_url": "",
        "content": """
            <h3>📝 Exercice : Analyser Ethereum</h3>
            
            <h4>Objectif</h4>
            <p>Appliquer les mêmes techniques d'analyse sur ETH/USDT</p>
            
            <h4>Points à Analyser</h4>
            <ul>
                <li>Tendance sur le Daily</li>
                <li>Corrélation avec Bitcoin</li>
                <li>Niveaux de support/résistance propres à ETH</li>
                <li>Patterns de chandeliers récents</li>
            </ul>
            
            <h4>Comparaison BTC vs ETH</h4>
            <ul>
                <li>ETH suit souvent BTC mais peut avoir ses propres mouvements</li>
                <li>Analysez le ratio ETH/BTC pour voir la force relative</li>
            </ul>
        """,
        "key_points": [
            "ETH est la 2ème plus grande crypto",
            "Souvent corrélé à Bitcoin mais pas toujours",
            "Analysez le ratio ETH/BTC",
            "Pratiquez régulièrement l'analyse"
        ],
        "quiz": []
    },
    (2, 10): {
        "title": "Quiz Module 2 - Test Complet",
        "video_url": "",
        "is_quiz": True,
        "content": """
            <h3>🎯 Quiz Final - Lecture des Graphiques</h3>
            <p>Ce quiz teste vos connaissances sur les graphiques et l'analyse technique de base.</p>
        """,
        "key_points": [],
        "quiz": [
            {"question": "Que représente un chandelier vert ?", "options": ["Le prix a baissé", "Le prix a monté (Close > Open)", "Le prix n'a pas bougé", "Le volume est élevé"], "correct": 1},
            {"question": "Qu'est-ce qu'un timeframe ?", "options": ["Un indicateur technique", "L'unité de temps représentée par chaque chandelier", "Un type de graphique", "Une stratégie de trading"], "correct": 1},
            {"question": "Comment identifier une tendance haussière ?", "options": ["Lower Highs et Lower Lows", "Higher Highs et Higher Lows", "Prix stable", "Volume en baisse"], "correct": 1},
            {"question": "Que signifie un marteau (hammer) ?", "options": ["Signal de vente fort", "Signal d'achat potentiel après une baisse", "Tendance neutre", "Forte volatilité"], "correct": 1},
            {"question": "Quelles sont les 4 informations d'un chandelier ?", "options": ["Volume, Prix, Temps, Tendance", "Open, High, Low, Close", "Support, Résistance, Trend, Range", "Buy, Sell, Hold, Wait"], "correct": 1},
            {"question": "Quel timeframe est recommandé pour les débutants ?", "options": ["1 minute", "5 minutes", "4H et Daily", "1 seconde"], "correct": 2},
            {"question": "Que représente une longue mèche haute ?", "options": ["Fort achat", "Rejet des prix hauts (pression vendeuse)", "Volume élevé", "Tendance haussière confirmée"], "correct": 1},
            {"question": "Qu'est-ce que l'analyse multi-timeframe ?", "options": ["Trader sur plusieurs exchanges", "Analyser plusieurs timeframes pour une vue complète", "Utiliser plusieurs indicateurs", "Trader plusieurs cryptos"], "correct": 1},
            {"question": "Un chandelier Doji indique :", "options": ["Forte tendance haussière", "Forte tendance baissière", "Indécision du marché", "Volume record"], "correct": 2},
            {"question": "Quelle échelle utiliser pour Bitcoin long terme ?", "options": ["Linéaire", "Logarithmique", "Exponentielle", "Quadratique"], "correct": 1},
            {"question": "Le volume confirme un mouvement quand il est :", "options": ["Faible", "Élevé", "Stable", "Négatif"], "correct": 1},
            {"question": "Que signifie 'The trend is your friend' ?", "options": ["Les amis donnent de bons conseils", "Tradez dans le sens de la tendance principale", "La tendance est toujours haussière", "Ignorez la tendance"], "correct": 1}
        ]
    },
    
    # ============================================
    # MODULE 3: Gestion du Capital
    # ============================================
    (3, 1): {
        "title": "Pourquoi la gestion du capital est cruciale",
        "video_url": "",
        "content": """
            <h3>💰 L'Importance Vitale du Money Management</h3>
            <p>La gestion du capital (money management) est LA compétence la plus importante en trading. C'est ce qui sépare les traders qui survivent de ceux qui perdent tout.</p>
            
            <h3>📊 Statistiques Révélatrices</h3>
            <ul>
                <li><strong>90% des traders perdent de l'argent</strong></li>
                <li>La principale raison : Mauvaise gestion du risque</li>
                <li>Les 10% qui gagnent ont tous une gestion du risque stricte</li>
            </ul>
            
            <h3>📉 L'Effet Dévastateur des Pertes</h3>
            <table style="width:100%; border-collapse: collapse; margin: 15px 0;">
                <tr style="background: #1a2234;"><th style="padding: 10px; border: 1px solid #333;">Perte</th><th style="padding: 10px; border: 1px solid #333;">Gain pour récupérer</th></tr>
                <tr><td style="padding: 10px; border: 1px solid #333;">-10%</td><td style="padding: 10px; border: 1px solid #333;">+11%</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #333;">-20%</td><td style="padding: 10px; border: 1px solid #333;">+25%</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #333;">-50%</td><td style="padding: 10px; border: 1px solid #333;">+100%</td></tr>
                <tr><td style="padding: 10px; border: 1px solid #333;">-90%</td><td style="padding: 10px; border: 1px solid #333;">+900%</td></tr>
            </table>
            <p><strong>Conclusion</strong> : Il est beaucoup plus facile de perdre que de récupérer !</p>
        """,
        "key_points": [
            "Le money management est plus important que la stratégie",
            "90% des traders perdent à cause d'une mauvaise gestion du risque",
            "Les pertes sont asymétriques : -50% nécessite +100% pour récupérer",
            "Protégez votre capital avant tout"
        ],
        "quiz": []
    },
    (3, 2): {
        "title": "Définir son capital de trading",
        "video_url": "",
        "content": """
            <h3>💵 Quel Capital pour Trader ?</h3>
            
            <h4>Règles Fondamentales</h4>
            <ul>
                <li>Uniquement de l'argent que vous pouvez perdre à 100%</li>
                <li>Pas l'argent du loyer, des factures ou de l'épargne de sécurité</li>
                <li>Jamais d'emprunt pour trader</li>
            </ul>
            
            <h4>Capital Recommandé par Niveau</h4>
            <ul>
                <li><strong>Débutant</strong> : 100-500€ pour apprendre sans stress</li>
                <li><strong>Intermédiaire</strong> : 1000-5000€</li>
                <li><strong>Avancé</strong> : 10000€+</li>
            </ul>
            
            <h4>Allocation Recommandée</h4>
            <ul>
                <li>70-80% : Investissement long terme (HODL)</li>
                <li>20-30% : Trading actif</li>
            </ul>
        """,
        "key_points": [
            "Tradez uniquement ce que vous pouvez perdre",
            "Commencez petit pour apprendre sans stress",
            "Séparez investissement long terme et trading actif",
            "N'empruntez jamais pour trader"
        ],
        "quiz": []
    },
    (3, 3): {
        "title": "La règle des 1-2%",
        "video_url": "",
        "content": """
            <h3>📏 La Règle d'Or du Risk Management</h3>
            <p style="font-size: 1.3em; color: #06b6d4;"><strong>Ne jamais risquer plus de 1-2% de son capital par trade</strong></p>
            
            <h3>📊 Exemple Pratique</h3>
            <ul>
                <li>Capital : 10 000€</li>
                <li>Risque max par trade (1%) : 100€</li>
                <li>Risque max par trade (2%) : 200€</li>
            </ul>
            
            <h4>Avec la règle des 1%</h4>
            <ul>
                <li>10 pertes consécutives = -10% du capital</li>
                <li>Vous pouvez continuer à trader</li>
                <li>Vous avez le temps de vous améliorer</li>
            </ul>
            
            <h4>Sans la règle (risque de 10%)</h4>
            <ul>
                <li>3 pertes consécutives = -30% du capital</li>
                <li>Difficile de récupérer psychologiquement</li>
                <li>Risque de revenge trading</li>
            </ul>
        """,
        "key_points": [
            "Maximum 1-2% de risque par trade",
            "Permet de survivre aux séries de pertes",
            "Protège votre capital et votre psychologie",
            "Règle non négociable pour les pros"
        ],
        "quiz": []
    },
    (3, 4): {
        "title": "Calculer la taille de position",
        "video_url": "",
        "content": """
            <h3>🧮 Formule de Position Sizing</h3>
            <p><strong>Taille de Position = (Capital × Risque%) / Distance au Stop Loss</strong></p>
            
            <h3>📊 Exemple Concret</h3>
            <ul>
                <li>Capital : 10 000€</li>
                <li>Risque accepté : 1% = 100€</li>
                <li>Prix d'entrée BTC : 50 000$</li>
                <li>Stop Loss : 49 000$ (soit 2% de distance)</li>
                <li>Taille de position : 100€ / 2% = 5000€</li>
            </ul>
            
            <h3>🛠️ Outils de Calcul</h3>
            <ul>
                <li>Calculateurs en ligne</li>
                <li>Feuilles Excel personnalisées</li>
                <li>Applications mobiles de trading</li>
            </ul>
        """,
        "key_points": [
            "Calculez toujours avant d'entrer en position",
            "Taille = Risque en € / Distance au Stop Loss en %",
            "Utilisez des calculateurs pour être précis",
            "Ne dépassez jamais le risque défini"
        ],
        "quiz": []
    },
    (3, 5): {
        "title": "Le Stop Loss - Votre bouclier",
        "video_url": "",
        "content": """
            <h3>🛡️ Qu'est-ce qu'un Stop Loss ?</h3>
            <p>Un ordre qui ferme automatiquement votre position à un prix défini pour limiter les pertes.</p>
            
            <h3>📍 Où Placer son Stop Loss ?</h3>
            <ul>
                <li>Sous un support technique (pour un long)</li>
                <li>Au-dessus d'une résistance (pour un short)</li>
                <li>Avec une marge de sécurité pour le "bruit" du marché</li>
            </ul>
            
            <h3>⚠️ Erreurs à Éviter</h3>
            <ul>
                <li><strong>Stop trop serré</strong> : Sorti trop tôt par le bruit</li>
                <li><strong>Stop trop large</strong> : Perte trop importante</li>
                <li><strong>Pas de stop</strong> : Catastrophe potentielle</li>
                <li><strong>Déplacer le stop vers plus de perte</strong> : INTERDIT</li>
            </ul>
        """,
        "key_points": [
            "Le stop loss est OBLIGATOIRE sur chaque trade",
            "Placez-le sous un support technique",
            "Ne le déplacez jamais vers plus de perte",
            "Acceptez les pertes comme partie du jeu"
        ],
        "quiz": []
    },
    (3, 6): {
        "title": "Quiz Module 3 - Test Complet",
        "video_url": "",
        "is_quiz": True,
        "content": """
            <h3>🎯 Quiz Final - Gestion du Capital</h3>
            <p>Ce quiz teste vos connaissances sur le money management.</p>
        """,
        "key_points": [],
        "quiz": [
            {"question": "Quel pourcentage maximum devez-vous risquer par trade ?", "options": ["5-10%", "1-2%", "10-20%", "50%"], "correct": 1},
            {"question": "Qu'est-ce qu'un stop loss ?", "options": ["Un ordre d'achat automatique", "Un ordre qui limite les pertes automatiquement", "Un indicateur technique", "Un type de graphique"], "correct": 1},
            {"question": "Un R:R de 1:3 signifie :", "options": ["Risque 3× plus grand que le gain", "Gain potentiel 3× plus grand que le risque", "Risque égal au gain", "Aucun risque"], "correct": 1},
            {"question": "Pourquoi le money management est-il crucial ?", "options": ["Pour gagner plus rapidement", "Pour survivre aux séries de pertes", "Pour impressionner les autres", "Ce n'est pas vraiment important"], "correct": 1},
            {"question": "Si vous perdez 50% de votre capital, combien devez-vous gagner pour récupérer ?", "options": ["50%", "75%", "100%", "150%"], "correct": 2},
            {"question": "Qu'est-ce que le position sizing ?", "options": ["La taille de votre écran", "Le calcul de la taille de position selon le risque", "Le nombre de trades par jour", "La durée d'un trade"], "correct": 1},
            {"question": "Où placer un stop loss pour un achat (long) ?", "options": ["Au-dessus du prix d'entrée", "En dessous d'un support", "Au prix d'entrée exact", "Pas besoin de stop loss"], "correct": 1},
            {"question": "Que faire si votre stop loss est touché ?", "options": ["Racheter immédiatement", "Accepter la perte et passer au trade suivant", "Déplacer le stop loss", "Doubler la position"], "correct": 1},
            {"question": "Quel R:R minimum est recommandé ?", "options": ["1:0.5", "1:1", "1:2 ou plus", "Pas important"], "correct": 2},
            {"question": "Qu'est-ce qu'un trailing stop ?", "options": ["Un stop fixe", "Un stop qui suit le prix en votre faveur", "Un stop mental", "Un stop sur plusieurs jours"], "correct": 1},
            {"question": "Avec un risque de 2% et un capital de 10 000€, combien pouvez-vous perdre par trade ?", "options": ["100€", "200€", "500€", "1000€"], "correct": 1},
            {"question": "Pourquoi ne jamais déplacer son stop loss dans le sens de la perte ?", "options": ["C'est interdit par les exchanges", "Cela augmente le risque et peut mener à des pertes catastrophiques", "Ce n'est pas grave de le faire", "Pour payer moins de frais"], "correct": 1}
        ]
    },
}

# Informations sur les modules
MODULE_INFO = {
    1: {"name": "Introduction au Trading Crypto", "description": "Découvrez les bases du trading de cryptomonnaies.", "lessons": 8},
    2: {"name": "Lecture des Graphiques", "description": "Apprenez à lire et interpréter les graphiques de trading.", "lessons": 10},
    3: {"name": "Gestion du Capital", "description": "Maîtrisez le money management pour protéger votre capital.", "lessons": 6},
    4: {"name": "Types d'Ordres", "description": "Comprenez tous les types d'ordres disponibles.", "lessons": 7},
    5: {"name": "Sécurité & Wallets", "description": "Protégez vos cryptomonnaies efficacement.", "lessons": 5},
    6: {"name": "Psychologie du Trader", "description": "Maîtrisez vos émotions pour trader sereinement.", "lessons": 6},
    7: {"name": "Supports & Résistances", "description": "Identifiez les niveaux clés du marché.", "lessons": 8},
    8: {"name": "Indicateurs Techniques", "description": "Utilisez les indicateurs pour améliorer vos analyses.", "lessons": 12},
    9: {"name": "Patterns Chartistes", "description": "Reconnaissez les figures chartistes classiques.", "lessons": 10},
    10: {"name": "Chandeliers Avancés", "description": "Maîtrisez les patterns de chandeliers japonais.", "lessons": 9},
    11: {"name": "Fibonacci & Retracements", "description": "Utilisez Fibonacci pour vos analyses.", "lessons": 8},
    12: {"name": "Analyse des Volumes", "description": "Comprenez l'importance du volume.", "lessons": 9},
    13: {"name": "Scalping & Day Trading", "description": "Stratégies de trading court terme.", "lessons": 9},
    14: {"name": "Swing Trading", "description": "Capturez les mouvements sur plusieurs jours.", "lessons": 9},
    15: {"name": "Trading de Breakout", "description": "Tradez les cassures de niveaux.", "lessons": 8},
    16: {"name": "Risk Management Pro", "description": "Techniques avancées de gestion du risque.", "lessons": 9},
    17: {"name": "Trading Mobile & Alertes", "description": "Optimisez votre trading mobile.", "lessons": 8},
    18: {"name": "Trading avec l'IA", "description": "L'intelligence artificielle au service du trading.", "lessons": 8},
    19: {"name": "Analyse On-Chain", "description": "Analysez les données de la blockchain.", "lessons": 9},
    20: {"name": "DeFi & Yield Farming", "description": "Explorez la finance décentralisée.", "lessons": 9},
    21: {"name": "Détection de Gems", "description": "Identifiez les projets prometteurs.", "lessons": 8},
    22: {"name": "Masterclass Trading Pro", "description": "Synthèse pour devenir trader professionnel.", "lessons": 10},
}


def get_lesson_content(module_id: int, lesson_id: int) -> dict:
    """Récupère le contenu d'une leçon avec vidéo YouTube."""
    key = (module_id, lesson_id)
    
    # Essayer d'abord le contenu étendu (modules 4-8)
    extended = get_extended_content(module_id, lesson_id)
    if extended:
        lesson = extended.copy()
    # Puis le contenu de base (modules 1-3)
    elif key in LESSON_CONTENT:
        lesson = LESSON_CONTENT[key].copy()
    else:
        # Générer un contenu par défaut pour les modules non encore détaillés
        module_info = MODULE_INFO.get(module_id, {"name": f"Module {module_id}", "description": "", "lessons": 8})
        lesson = generate_default_lesson(module_id, lesson_id, module_info)
    
    # Override video_url avec la vidéo YouTube si disponible
    youtube_url = get_video_url(module_id, lesson_id)
    if youtube_url:
        lesson["video_url"] = youtube_url
    
    return lesson


def generate_default_lesson(module_id: int, lesson_id: int, module_info: dict) -> dict:
    """Génère un contenu par défaut pour les leçons non encore détaillées."""
    total_lessons = module_info.get("lessons", 8)
    
    # Vérifier si c'est la leçon quiz (dernière leçon)
    if lesson_id == total_lessons:
        return generate_quiz_lesson(module_id, module_info)
    
    # Contenu spécifique par module pour les leçons intermédiaires
    module_lessons = get_module_lesson_titles(module_id)
    lesson_title = module_lessons.get(lesson_id, f"Leçon {lesson_id}")
    
    return {
        "title": lesson_title,
        "video_url": "",
        "content": f"""
            <h3>📚 {module_info['name']} - {lesson_title}</h3>
            <p>{module_info['description']}</p>
            
            <h3>🎯 Objectifs de cette leçon</h3>
            <p>Dans cette leçon, vous allez apprendre les concepts fondamentaux liés à ce sujet.</p>
            
            <h3>📖 Contenu Principal</h3>
            <p>Cette leçon fait partie du module <strong>{module_info['name']}</strong>.</p>
            
            <ul>
                <li>Comprendre les concepts fondamentaux</li>
                <li>Apprendre les techniques pratiques</li>
                <li>Développer vos compétences de trading</li>
                <li>Appliquer les connaissances en situation réelle</li>
            </ul>
            
            <h3>💡 Points Clés à Retenir</h3>
            <p>Regardez la vidéo ci-dessus pour un apprentissage complet et détaillé.</p>
            
            <h3>📝 Exercice Pratique</h3>
            <p>Après avoir visionné la vidéo, essayez d'appliquer les concepts appris sur un graphique réel dans TradingView.</p>
        """,
        "key_points": [
            f"Maîtriser les bases de {module_info['name'].lower()}",
            "Appliquer les concepts en situation réelle",
            "Pratiquer régulièrement pour progresser",
            "Revoir les leçons précédentes si nécessaire"
        ],
        "quiz": []
    }


def get_module_lesson_titles(module_id: int) -> dict:
    """Retourne les titres des leçons pour chaque module."""
    titles = {
        9: {  # Patterns Chartistes
            1: "Introduction aux patterns",
            2: "Les triangles",
            3: "Tête et épaules",
            4: "Double top & bottom",
            5: "Les drapeaux et fanions",
            6: "Les wedges (coins)",
            7: "Cup and handle",
            8: "Exercice pratique",
            9: "Exercice avancé",
        },
        10: {  # Chandeliers Avancés
            1: "Patterns de continuation",
            2: "Three white soldiers",
            3: "Three black crows",
            4: "Morning star & Evening star",
            5: "Harami patterns",
            6: "Tweezer tops & bottoms",
            7: "Exercice pratique",
            8: "Exercice avancé",
        },
        11: {  # Fibonacci
            1: "Introduction à Fibonacci",
            2: "Les niveaux de retracement",
            3: "Extensions de Fibonacci",
            4: "Fibonacci et tendances",
            5: "Combiner Fibonacci avec S/R",
            6: "Exercice pratique",
            7: "Exercice avancé",
        },
        12: {  # Analyse des Volumes
            1: "Importance du volume",
            2: "Volume et tendances",
            3: "Volume Profile",
            4: "OBV (On-Balance Volume)",
            5: "VWAP",
            6: "Volume et breakouts",
            7: "Exercice pratique",
            8: "Exercice avancé",
        },
        13: {  # Scalping & Day Trading
            1: "Introduction au scalping",
            2: "Setup de scalping",
            3: "Gestion du risque en scalping",
            4: "Day trading basics",
            5: "Stratégies de day trading",
            6: "Timing et sessions",
            7: "Exercice pratique",
            8: "Exercice avancé",
        },
        14: {  # Swing Trading
            1: "Introduction au swing trading",
            2: "Identifier les swings",
            3: "Entrées et sorties",
            4: "Gestion de position",
            5: "Multi-timeframe pour swing",
            6: "Stratégies swing populaires",
            7: "Exercice pratique",
            8: "Exercice avancé",
        },
        15: {  # Trading de Breakout
            1: "Qu'est-ce qu'un breakout",
            2: "Identifier les zones de breakout",
            3: "Confirmer un breakout",
            4: "Éviter les fakeouts",
            5: "Stratégies de breakout",
            6: "Exercice pratique",
            7: "Exercice avancé",
        },
        16: {  # Risk Management Pro
            1: "Risk management avancé",
            2: "Corrélations et diversification",
            3: "Drawdown management",
            4: "Scaling in/out",
            5: "Hedging strategies",
            6: "Portfolio management",
            7: "Exercice pratique",
            8: "Exercice avancé",
        },
        17: {  # Trading Mobile
            1: "Setup mobile optimal",
            2: "Applications recommandées",
            3: "Configurer les alertes",
            4: "Trading on-the-go",
            5: "Sécurité mobile",
            6: "Exercice pratique",
            7: "Exercice avancé",
        },
        18: {  # Trading avec l'IA
            1: "Introduction à l'IA en trading",
            2: "Outils IA disponibles",
            3: "Bots de trading",
            4: "Analyse sentiment IA",
            5: "Limites de l'IA",
            6: "Exercice pratique",
            7: "Exercice avancé",
        },
        19: {  # Analyse On-Chain
            1: "Introduction on-chain",
            2: "Métriques clés",
            3: "Whale watching",
            4: "Exchange flows",
            5: "MVRV et SOPR",
            6: "Outils on-chain",
            7: "Exercice pratique",
            8: "Exercice avancé",
        },
        20: {  # DeFi & Yield Farming
            1: "Introduction à la DeFi",
            2: "Protocoles majeurs",
            3: "Yield farming basics",
            4: "Risques DeFi",
            5: "Impermanent loss",
            6: "Stratégies DeFi",
            7: "Exercice pratique",
            8: "Exercice avancé",
        },
        21: {  # Détection de Gems
            1: "Qu'est-ce qu'une gem",
            2: "Recherche fondamentale",
            3: "Tokenomics",
            4: "Analyse de l'équipe",
            5: "Red flags à éviter",
            6: "Exercice pratique",
            7: "Exercice avancé",
        },
        22: {  # Masterclass
            1: "Synthèse des modules",
            2: "Créer son système",
            3: "Backtesting",
            4: "Journal de trading pro",
            5: "Mindset du pro",
            6: "Plan de carrière",
            7: "Ressources continues",
            8: "Exercice final",
            9: "Certification",
        },
    }
    return titles.get(module_id, {})


def generate_quiz_lesson(module_id: int, module_info: dict) -> dict:
    """Génère le quiz final pour un module."""
    
    # Quiz personnalisés par module
    quizzes = {
        4: [  # Types d'Ordres
            {"question": "Un ordre market s'exécute :", "options": ["À un prix spécifique", "Immédiatement au meilleur prix", "Le lendemain", "Jamais"], "correct": 1},
            {"question": "Un ordre limit d'achat est placé :", "options": ["Au-dessus du prix actuel", "En dessous du prix actuel", "Au prix exact", "N'importe où"], "correct": 1},
            {"question": "Qu'est-ce qu'un trailing stop ?", "options": ["Stop fixe", "Stop qui suit le prix", "Ordre d'achat", "Indicateur"], "correct": 1},
            {"question": "OCO signifie :", "options": ["Order Creates Order", "One Cancels Other", "Only Crypto Orders", "Open Close Order"], "correct": 1},
            {"question": "Quel ordre pour un breakout rapide ?", "options": ["Ordre limite", "Ordre market ou Buy Stop", "Trailing stop", "OCO"], "correct": 1},
            {"question": "Les frais 'maker' s'appliquent quand :", "options": ["Vous prenez de la liquidité", "Vous ajoutez de la liquidité", "Vous retirez des fonds", "Vous déposez"], "correct": 1},
            {"question": "Un stop-limit combine :", "options": ["Deux ordres market", "Un stop et un limit", "Deux ordres limit", "Un ordre et un indicateur"], "correct": 1},
            {"question": "Le slippage est plus probable avec :", "options": ["Ordre limite", "Ordre market", "Trailing stop", "OCO"], "correct": 1},
            {"question": "Un Buy Stop est placé :", "options": ["Sous le prix actuel", "Au-dessus du prix actuel", "Au prix actuel", "N'importe où"], "correct": 1},
            {"question": "Avantage principal d'un ordre limit ?", "options": ["Exécution garantie", "Contrôle du prix", "Pas de frais", "Plus rapide"], "correct": 1},
        ],
        5: [  # Sécurité & Wallets
            {"question": "Qu'est-ce qu'un cold wallet ?", "options": ["Wallet connecté", "Wallet hors ligne", "Wallet gratuit", "Wallet d'exchange"], "correct": 1},
            {"question": "Que faire avec votre seed phrase ?", "options": ["La partager", "La stocker sur Google Drive", "La noter sur papier en lieu sûr", "La mémoriser uniquement"], "correct": 2},
            {"question": "Quel 2FA est le plus sécurisé ?", "options": ["SMS", "Email", "Google Authenticator ou clé physique", "Aucun"], "correct": 2},
            {"question": "'Not your keys, not your coins' signifie :", "options": ["Les clés sont importantes", "Sans clés privées, pas de vraie propriété", "Les coins sont des clés", "Il faut acheter des clés"], "correct": 1},
            {"question": "Quel wallet pour les gros montants ?", "options": ["Wallet d'exchange", "Hot wallet mobile", "Hardware wallet", "Paper wallet"], "correct": 2},
            {"question": "Qu'est-ce qu'une attaque SIM swap ?", "options": ["Changer de téléphone", "Hacker transfère votre numéro", "Échanger des cartes SIM", "Mise à jour SIM"], "correct": 1},
            {"question": "Email demandant votre seed phrase ?", "options": ["Répondre", "Ignorer - c'est une arnaque", "Appeler le support", "Envoyer la seed"], "correct": 1},
            {"question": "Combien de mots dans une seed phrase ?", "options": ["6", "12 ou 24", "50", "100"], "correct": 1},
            {"question": "Où stocker la seed phrase ?", "options": ["Fichier sur ordinateur", "Google Drive", "Papier en lieu sécurisé", "Email à soi-même"], "correct": 2},
            {"question": "Qu'est-ce que le phishing ?", "options": ["Technique de pêche", "Arnaque imitant des sites légitimes", "Type de trading", "Cryptomonnaie"], "correct": 1},
        ],
        6: [  # Psychologie du Trader
            {"question": "Que signifie FOMO ?", "options": ["Fear Of Making Orders", "Fear Of Missing Out", "First Order Market Order", "Final Order"], "correct": 1},
            {"question": "Qu'est-ce que le revenge trading ?", "options": ["Trader pour se venger", "Trader impulsivement après une perte", "Type d'ordre", "Stratégie rentable"], "correct": 1},
            {"question": "Pourquoi tenir un journal ?", "options": ["Impressionner", "Analyser et progresser", "Ce n'est pas utile", "Pour les impôts"], "correct": 1},
            {"question": "Que faire après des pertes ?", "options": ["Trader immédiatement", "Doubler la position", "Faire une pause et analyser", "Abandonner"], "correct": 2},
            {"question": "% du succès venant de la psychologie ?", "options": ["10%", "30%", "50%", "80%"], "correct": 3},
            {"question": "Qu'est-ce que l'overtrading ?", "options": ["Trader trop peu", "Trader trop souvent par émotion", "Trader uniquement les cryptos", "Trader avec profit"], "correct": 1},
            {"question": "Comment gérer le stress ?", "options": ["Ignorer", "Risquer moins, avoir un plan, pauses", "Trader plus", "Boire du café"], "correct": 1},
            {"question": "Qu'est-ce qu'un plan de trading ?", "options": ["Liste de cryptos", "Règles définies AVANT de trader", "Indicateur", "Type de graphique"], "correct": 1},
            {"question": "Qu'est-ce que la discipline ?", "options": ["Trader beaucoup", "Suivre son plan sans exception", "Changer de stratégie", "Ignorer les stop loss"], "correct": 1},
            {"question": "Comment éviter le FOMO ?", "options": ["Acheter à chaque hausse", "Avoir un plan et s'y tenir", "Suivre les influenceurs", "Trader 24h/24"], "correct": 1},
        ],
        7: [  # Supports & Résistances
            {"question": "Qu'est-ce qu'un support ?", "options": ["Niveau où vendeurs dominent", "Niveau où acheteurs dominent", "Indicateur technique", "Type d'ordre"], "correct": 1},
            {"question": "Quand un support est cassé, il devient :", "options": ["Plus fort", "Une résistance", "Inexistant", "Un indicateur"], "correct": 1},
            {"question": "Comment confirmer un breakout ?", "options": ["Par le prix seul", "Par le volume élevé et clôture au-delà", "Par la couleur", "Par l'heure"], "correct": 1},
            {"question": "Qu'est-ce qu'un fakeout ?", "options": ["Breakout avec volume", "Cassure qui ne tient pas", "Breakout la nuit", "Breakout sur Bitcoin"], "correct": 1},
            {"question": "Les niveaux psychologiques sont :", "options": ["Nombres aléatoires", "Nombres ronds (10000$, 50000$)", "Nombres premiers", "Nombres négatifs"], "correct": 1},
            {"question": "Comment tracer un support ?", "options": ["En connectant les sommets", "En connectant les creux de rebond", "Au hasard", "Uniquement sur Daily"], "correct": 1},
            {"question": "Qu'est-ce que le flip S/R ?", "options": ["Un indicateur", "Support cassé devient résistance", "Type d'ordre", "Stratégie de scalping"], "correct": 1},
            {"question": "Où placer le stop pour un achat sur support ?", "options": ["Au-dessus du support", "Sous le support", "Au niveau exact", "Pas de stop"], "correct": 1},
            {"question": "Plus un niveau est testé, plus il est :", "options": ["Faible", "Significatif", "Ignoré", "Dangereux"], "correct": 1},
            {"question": "Les S/R sont plus fiables sur :", "options": ["Petits timeframes", "Grands timeframes (Daily, Weekly)", "Tous également", "Aucun"], "correct": 1},
        ],
        8: [  # Indicateurs Techniques
            {"question": "RSI > 70 signifie :", "options": ["Survente", "Surachat", "Tendance neutre", "Volume élevé"], "correct": 1},
            {"question": "Qu'est-ce qu'un Golden Cross ?", "options": ["RSI > 70", "MA 50 croise MA 200 vers le haut", "Prix au plus haut", "Volume record"], "correct": 1},
            {"question": "Les Bollinger Bands mesurent :", "options": ["La tendance", "Le momentum", "La volatilité", "Le volume"], "correct": 2},
            {"question": "Combien d'indicateurs maximum ?", "options": ["1 seul", "2-3 maximum", "5-10", "Autant que possible"], "correct": 1},
            {"question": "Qu'est-ce qu'une divergence RSI ?", "options": ["RSI = 50", "Prix et RSI en sens opposés", "RSI très élevé", "RSI très bas"], "correct": 1},
            {"question": "Le MACD est composé de :", "options": ["Une seule ligne", "Ligne MACD, Signal, Histogramme", "Trois moyennes mobiles", "Bandes de Bollinger"], "correct": 1},
            {"question": "Qu'est-ce qu'un Death Cross ?", "options": ["Pattern de chandelier", "MA 50 croise MA 200 vers le bas", "RSI < 30", "Volume nul"], "correct": 1},
            {"question": "Un squeeze des Bollinger indique :", "options": ["Forte volatilité", "Consolidation, mouvement à venir", "Tendance haussière", "Tendance baissière"], "correct": 1},
            {"question": "Le RSI oscille entre :", "options": ["0 et 50", "0 et 100", "-100 et +100", "Pas de limite"], "correct": 1},
            {"question": "Pourquoi combiner plusieurs indicateurs ?", "options": ["Compliquer l'analyse", "Augmenter la fiabilité par confluence", "Ce n'est pas recommandé", "Pour impressionner"], "correct": 1},
        ],
    }
    
    # Récupérer le quiz pour ce module ou générer un quiz générique
    quiz_questions = quizzes.get(module_id, generate_generic_quiz(module_info['name']))
    
    return {
        "title": f"Quiz Module {module_id} - Test Complet",
        "video_url": "",
        "is_quiz": True,
        "content": f"""
            <h3>🎯 Quiz Final - {module_info['name']}</h3>
            <p>Ce quiz teste vos connaissances sur {module_info['name'].lower()}.</p>
            <p><strong>Objectif :</strong> Obtenir au moins 70% de bonnes réponses pour valider ce module.</p>
            <p><strong>Temps estimé :</strong> 10-15 minutes</p>
        """,
        "key_points": [],
        "quiz": quiz_questions
    }


def generate_generic_quiz(module_name: str) -> list:
    """Génère un quiz générique pour les modules sans quiz personnalisé."""
    return [
        {"question": f"Quel est l'objectif principal de {module_name.lower()} ?", "options": ["Perdre de l'argent", "Améliorer ses performances de trading", "Ignorer le marché", "Trader sans stratégie"], "correct": 1},
        {"question": "Pourquoi est-il important de pratiquer ?", "options": ["Ce n'est pas important", "Pour développer ses compétences", "Pour impressionner", "Pour perdre du temps"], "correct": 1},
        {"question": "Que devez-vous faire après chaque leçon ?", "options": ["Oublier", "Pratiquer sur des graphiques réels", "Ignorer", "Passer au module suivant sans pratiquer"], "correct": 1},
        {"question": "Comment progresser en trading ?", "options": ["En ne faisant rien", "Par la pratique régulière et l'analyse", "En copiant les autres", "En tradant au hasard"], "correct": 1},
        {"question": "Quel outil utiliser pour l'analyse ?", "options": ["Aucun", "TradingView ou plateforme similaire", "Calculatrice", "Dés"], "correct": 1},
        {"question": "Pourquoi tenir un journal de trading ?", "options": ["Pour impressionner", "Pour analyser ses erreurs et progresser", "Ce n'est pas utile", "Pour les impôts uniquement"], "correct": 1},
        {"question": "Quelle est la clé du succès en trading ?", "options": ["La chance", "Discipline et gestion du risque", "Trader beaucoup", "Suivre les influenceurs"], "correct": 1},
        {"question": "Que faire en cas de doute ?", "options": ["Trader quand même", "Ne pas trader et analyser davantage", "Doubler la position", "Ignorer le doute"], "correct": 1},
        {"question": "Comment gérer les pertes ?", "options": ["Les ignorer", "Les accepter et apprendre", "Revenge trading", "Abandonner"], "correct": 1},
        {"question": "Quel est le meilleur moment pour trader ?", "options": ["Toujours", "Quand vous avez un setup clair", "La nuit", "Le week-end"], "correct": 1},
    ]