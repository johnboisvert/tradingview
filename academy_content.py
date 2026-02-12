"""
Contenu détaillé des leçons de l'Academy Trading
22 Modules complets avec vidéos YouTube en français
LEÇONS ENRICHIES + TESTS DE 10-15 QUESTIONS PAR MODULE
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
            
            <h3>📊 Les Marchés Crypto - Un Écosystème Unique</h3>
            <p>Les marchés crypto fonctionnent 24h/24, 7j/7, contrairement aux marchés boursiers traditionnels qui ferment le soir et le week-end. Cette disponibilité permanente offre plus d'opportunités mais demande aussi une gestion rigoureuse de votre temps et de vos émotions.</p>
            
            <p><strong>Caractéristiques des marchés crypto :</strong></p>
            <ul>
                <li><strong>Volatilité élevée</strong> : Les prix peuvent varier de 10-20% en une seule journée, voire plus pour les altcoins</li>
                <li><strong>Accessibilité mondiale</strong> : N'importe qui peut trader depuis n'importe où dans le monde</li>
                <li><strong>Décentralisation</strong> : Pas d'autorité centrale qui contrôle le marché</li>
                <li><strong>Liquidité variable</strong> : Bitcoin et Ethereum sont très liquides, les petites cryptos moins</li>
                <li><strong>Innovation constante</strong> : Nouveaux projets, technologies et opportunités chaque jour</li>
            </ul>
            
            <h3>💡 Les Différents Styles de Trading</h3>
            <p>Chaque trader doit choisir un style adapté à sa personnalité, son emploi du temps et sa tolérance au risque :</p>
            <ul>
                <li><strong>Day Trading</strong> : Positions ouvertes et fermées dans la même journée. Nécessite plusieurs heures devant les écrans. Stress élevé mais pas de risque overnight.</li>
                <li><strong>Swing Trading</strong> : Positions maintenues plusieurs jours à semaines. Idéal pour ceux qui travaillent. Analyse sur timeframes 4H et Daily.</li>
                <li><strong>Scalping</strong> : Trades très courts (secondes à minutes) pour de petits gains répétés. Très stressant, nécessite une excellente exécution.</li>
                <li><strong>Position Trading</strong> : Positions sur plusieurs mois, proche de l'investissement. Moins stressant, basé sur l'analyse fondamentale.</li>
                <li><strong>Arbitrage</strong> : Exploiter les différences de prix entre exchanges. Nécessite du capital et des outils automatisés.</li>
            </ul>
            
            <h3>📈 Pourquoi Trader les Cryptomonnaies ?</h3>
            <ul>
                <li><strong>Potentiel de gains élevé</strong> : La volatilité crée des opportunités de profit importantes</li>
                <li><strong>Marché en croissance</strong> : L'adoption des cryptos augmente chaque année</li>
                <li><strong>Barrière d'entrée faible</strong> : Vous pouvez commencer avec quelques dizaines d'euros</li>
                <li><strong>Indépendance financière</strong> : Possibilité de générer des revenus depuis chez soi</li>
                <li><strong>Apprentissage continu</strong> : Un domaine passionnant qui évolue constamment</li>
            </ul>
            
            <h3>⚠️ Risques à Connaître Absolument</h3>
            <p>Le trading crypto comporte des risques significatifs qu'il faut comprendre avant de commencer :</p>
            <ul>
                <li><strong>Perte de capital</strong> : Vous pouvez perdre tout l'argent investi</li>
                <li><strong>Volatilité extrême</strong> : Des variations de 50-80% sont possibles sur certains actifs</li>
                <li><strong>Arnaques et hacks</strong> : Le secteur attire les escrocs</li>
                <li><strong>Régulation incertaine</strong> : Les lois peuvent changer et impacter le marché</li>
                <li><strong>Addiction</strong> : Le trading peut devenir compulsif</li>
                <li><strong>Stress émotionnel</strong> : Les pertes peuvent affecter votre santé mentale</li>
            </ul>
            
            <div class="warning-box" style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <strong>⚠️ RÈGLE D'OR :</strong> Ne tradez JAMAIS avec de l'argent que vous ne pouvez pas vous permettre de perdre. Commencez petit, apprenez, puis augmentez progressivement.
            </div>
        """,
        "key_points": [
            "Le trading crypto permet de profiter des fluctuations de prix 24h/24, 7j/7",
            "Différents styles existent : Day Trading, Swing Trading, Scalping, Position Trading",
            "La volatilité offre des opportunités mais aussi des risques importants",
            "La gestion du risque est primordiale pour survivre sur le long terme",
            "Ne jamais investir plus que ce qu'on peut se permettre de perdre"
        ],
        "quiz": []
    },
    (1, 2): {
        "title": "Les différents types de cryptomonnaies",
        "video_url": "",
        "content": """
            <h3>🪙 Bitcoin (BTC) - La Première et la Plus Grande</h3>
            <p>Créé en 2009 par le mystérieux Satoshi Nakamoto, Bitcoin est la première cryptomonnaie décentralisée. Il représente environ 40-50% de la capitalisation totale du marché crypto, ce qu'on appelle la "dominance Bitcoin".</p>
            
            <p><strong>Caractéristiques du Bitcoin :</strong></p>
            <ul>
                <li><strong>Offre limitée</strong> : Maximum 21 millions de BTC seront jamais créés</li>
                <li><strong>Halving</strong> : Tous les 4 ans, la récompense des mineurs est divisée par 2</li>
                <li><strong>Réserve de valeur</strong> : Souvent comparé à l'or numérique</li>
                <li><strong>Sécurité maximale</strong> : Le réseau le plus sécurisé au monde</li>
                <li><strong>Adoption institutionnelle</strong> : De plus en plus d'entreprises l'adoptent</li>
            </ul>
            
            <h3>💎 Ethereum (ETH) - La Plateforme des Smart Contracts</h3>
            <p>Lancé en 2015 par Vitalik Buterin, Ethereum va bien au-delà d'une simple monnaie. C'est une plateforme permettant de créer des applications décentralisées (dApps) et des smart contracts (contrats intelligents).</p>
            
            <p><strong>L'écosystème Ethereum comprend :</strong></p>
            <ul>
                <li><strong>DeFi (Finance Décentralisée)</strong> : Prêts, emprunts, échanges sans intermédiaire</li>
                <li><strong>NFTs</strong> : Tokens non-fongibles pour l'art, les jeux, etc.</li>
                <li><strong>DAOs</strong> : Organisations autonomes décentralisées</li>
                <li><strong>Layer 2</strong> : Solutions de scaling comme Arbitrum, Optimism</li>
            </ul>
            
            <h3>🏷️ Catégories de Cryptomonnaies</h3>
            
            <h4>1. Layer 1 - Les Blockchains Principales</h4>
            <ul>
                <li><strong>Bitcoin (BTC)</strong> : Réserve de valeur, paiements</li>
                <li><strong>Ethereum (ETH)</strong> : Smart contracts, DeFi, NFTs</li>
                <li><strong>Solana (SOL)</strong> : Haute performance, faibles frais</li>
                <li><strong>Avalanche (AVAX)</strong> : Rapidité, compatibilité EVM</li>
                <li><strong>Cardano (ADA)</strong> : Approche académique, proof-of-stake</li>
                <li><strong>Polkadot (DOT)</strong> : Interopérabilité entre blockchains</li>
            </ul>
            
            <h4>2. Layer 2 - Solutions de Scaling</h4>
            <ul>
                <li><strong>Polygon (MATIC)</strong> : Scaling Ethereum, faibles frais</li>
                <li><strong>Arbitrum (ARB)</strong> : Optimistic rollup pour Ethereum</li>
                <li><strong>Optimism (OP)</strong> : Autre solution de scaling Ethereum</li>
                <li><strong>Lightning Network</strong> : Scaling Bitcoin pour les paiements</li>
            </ul>
            
            <h4>3. DeFi - Finance Décentralisée</h4>
            <ul>
                <li><strong>Uniswap (UNI)</strong> : Exchange décentralisé leader</li>
                <li><strong>Aave (AAVE)</strong> : Protocole de prêt/emprunt</li>
                <li><strong>Compound (COMP)</strong> : Autre protocole de lending</li>
                <li><strong>Curve (CRV)</strong> : Échange de stablecoins</li>
                <li><strong>MakerDAO (MKR)</strong> : Création du stablecoin DAI</li>
            </ul>
            
            <h4>4. Stablecoins - Cryptos Stables</h4>
            <ul>
                <li><strong>USDT (Tether)</strong> : Le plus utilisé, indexé au dollar</li>
                <li><strong>USDC (Circle)</strong> : Plus régulé, audité régulièrement</li>
                <li><strong>DAI</strong> : Stablecoin décentralisé</li>
                <li><strong>BUSD</strong> : Stablecoin de Binance</li>
            </ul>
            
            <h4>5. Memecoins - Cryptos Communautaires</h4>
            <ul>
                <li><strong>Dogecoin (DOGE)</strong> : Le premier memecoin, soutenu par Elon Musk</li>
                <li><strong>Shiba Inu (SHIB)</strong> : "Dogecoin killer"</li>
                <li><strong>Pepe (PEPE)</strong> : Memecoin basé sur le mème Pepe</li>
            </ul>
            <p><em>⚠️ Les memecoins sont très risqués et spéculatifs !</em></p>
            
            <h4>6. Autres Catégories</h4>
            <ul>
                <li><strong>Gaming/Metaverse</strong> : AXS, SAND, MANA, IMX</li>
                <li><strong>Infrastructure</strong> : LINK (oracles), GRT (indexation)</li>
                <li><strong>Privacy coins</strong> : XMR, ZEC (transactions privées)</li>
                <li><strong>Exchange tokens</strong> : BNB, FTT, CRO</li>
            </ul>
            
            <h3>📊 Comprendre la Capitalisation</h3>
            <p><strong>Market Cap = Prix × Offre en circulation</strong></p>
            <ul>
                <li><strong>Large Cap (>10B$)</strong> : BTC, ETH, BNB - Plus stables, moins de potentiel de x10</li>
                <li><strong>Mid Cap (1-10B$)</strong> : SOL, ADA, AVAX - Bon équilibre risque/récompense</li>
                <li><strong>Small Cap (100M-1B$)</strong> : Plus risqués mais potentiel de gains élevé</li>
                <li><strong>Micro Cap (<100M$)</strong> : Très risqués, possibilité de x100 ou de perdre tout</li>
            </ul>
        """,
        "key_points": [
            "Bitcoin est la première crypto et représente ~50% du marché",
            "Ethereum permet les smart contracts et héberge la DeFi et les NFTs",
            "Les cryptos se classent en catégories : L1, L2, DeFi, Stablecoins, Memecoins",
            "La capitalisation aide à évaluer le risque et le potentiel d'un projet",
            "Les stablecoins sont indexés au dollar et servent de refuge"
        ],
        "quiz": []
    },
    (1, 3): {
        "title": "Comment fonctionne un exchange",
        "video_url": "",
        "content": """
            <h3>🏦 Qu'est-ce qu'un Exchange ?</h3>
            <p>Un exchange (ou plateforme d'échange) est un service qui permet d'acheter, vendre et échanger des cryptomonnaies contre d'autres cryptos ou des devises traditionnelles (EUR, USD). C'est la porte d'entrée principale vers le monde des cryptos.</p>
            
            <h3>📊 Types d'Exchanges</h3>
            
            <h4>CEX (Centralized Exchange) - Exchanges Centralisés</h4>
            <p>Gérés par une entreprise qui agit comme intermédiaire entre acheteurs et vendeurs.</p>
            <ul>
                <li><strong>Binance</strong> : Le plus grand exchange au monde, large choix de cryptos</li>
                <li><strong>Coinbase</strong> : Très régulé, idéal pour débutants, coté en bourse</li>
                <li><strong>Kraken</strong> : Sécurisé, bonne réputation, basé aux USA</li>
                <li><strong>Bybit</strong> : Populaire pour les futures et le leverage</li>
                <li><strong>OKX</strong> : Large gamme de produits, interface avancée</li>
                <li><strong>KuCoin</strong> : Beaucoup d'altcoins, pas de KYC obligatoire</li>
            </ul>
            
            <p><strong>Avantages des CEX :</strong></p>
            <ul>
                <li>Interface facile à utiliser</li>
                <li>Haute liquidité</li>
                <li>Support client disponible</li>
                <li>Conversion fiat (EUR/USD) facile</li>
                <li>Outils de trading avancés</li>
            </ul>
            
            <p><strong>Inconvénients des CEX :</strong></p>
            <ul>
                <li>Vous ne contrôlez pas vos clés ("Not your keys, not your coins")</li>
                <li>Risque de hack ou de faillite (ex: FTX)</li>
                <li>KYC obligatoire (vérification d'identité)</li>
                <li>Peuvent bloquer vos fonds</li>
            </ul>
            
            <h4>DEX (Decentralized Exchange) - Exchanges Décentralisés</h4>
            <p>Fonctionnent sans intermédiaire grâce aux smart contracts.</p>
            <ul>
                <li><strong>Uniswap</strong> : Leader sur Ethereum</li>
                <li><strong>PancakeSwap</strong> : Leader sur BNB Chain</li>
                <li><strong>SushiSwap</strong> : Multi-chain</li>
                <li><strong>dYdX</strong> : Trading de perpétuels décentralisé</li>
                <li><strong>Curve</strong> : Spécialisé stablecoins</li>
            </ul>
            
            <p><strong>Avantages des DEX :</strong></p>
            <ul>
                <li>Vous gardez le contrôle de vos cryptos</li>
                <li>Pas de KYC</li>
                <li>Accès à des tokens non listés sur CEX</li>
                <li>Transparence totale (code open source)</li>
            </ul>
            
            <p><strong>Inconvénients des DEX :</strong></p>
            <ul>
                <li>Plus complexe à utiliser</li>
                <li>Frais de gas (sur Ethereum)</li>
                <li>Liquidité parfois faible</li>
                <li>Risque de smart contract</li>
                <li>Pas de support client</li>
            </ul>
            
            <h3>💰 Le Carnet d'Ordres (Order Book)</h3>
            <p>Le carnet d'ordres est le cœur d'un exchange. Il affiche tous les ordres d'achat (bids) et de vente (asks) en attente.</p>
            
            <ul>
                <li><strong>Bids (Offres d'achat)</strong> : Ordres d'achat en attente, affichés en vert</li>
                <li><strong>Asks (Offres de vente)</strong> : Ordres de vente en attente, affichés en rouge</li>
                <li><strong>Spread</strong> : Différence entre le meilleur bid et le meilleur ask</li>
                <li><strong>Depth (Profondeur)</strong> : Volume total à chaque niveau de prix</li>
            </ul>
            
            <h3>📈 Spread et Liquidité</h3>
            <p>Le spread est un indicateur clé de la liquidité d'un marché :</p>
            <ul>
                <li><strong>Spread faible</strong> = Haute liquidité = Facile d'acheter/vendre au prix souhaité</li>
                <li><strong>Spread élevé</strong> = Faible liquidité = Risque de slippage</li>
            </ul>
            
            <p><strong>Exemple :</strong></p>
            <ul>
                <li>BTC/USDT sur Binance : Spread de 0.01% (très liquide)</li>
                <li>Petit altcoin : Spread de 2-5% (peu liquide, attention !)</li>
            </ul>
            
            <h3>💸 Les Frais de Trading</h3>
            <ul>
                <li><strong>Frais Maker</strong> : Quand vous ajoutez de la liquidité (ordre limite)</li>
                <li><strong>Frais Taker</strong> : Quand vous prenez de la liquidité (ordre marché)</li>
                <li><strong>Frais de retrait</strong> : Pour envoyer vos cryptos vers un wallet externe</li>
                <li><strong>Frais de dépôt</strong> : Généralement gratuits en crypto, payants en fiat</li>
            </ul>
            
            <p><em>Astuce : Les frais maker sont généralement moins élevés que les frais taker. Utilisez des ordres limites quand possible !</em></p>
        """,
        "key_points": [
            "Un exchange permet d'acheter et vendre des cryptos",
            "CEX sont centralisés et faciles, DEX sont décentralisés et vous gardez vos clés",
            "Le carnet d'ordres montre l'offre et la demande en temps réel",
            "La liquidité affecte le spread et la facilité d'exécution",
            "Comparez les frais entre exchanges avant de choisir"
        ],
        "quiz": []
    },
    (1, 4): {
        "title": "Vocabulaire essentiel du trader",
        "video_url": "",
        "content": """
            <h3>📖 Vocabulaire Trading Essentiel</h3>
            <p>Maîtriser le vocabulaire est indispensable pour comprendre les analyses, les discussions et les news du monde crypto.</p>
            
            <h4>🐂 Termes de Marché</h4>
            <ul>
                <li><strong>Bull Market</strong> : Marché haussier, tendance générale à la hausse. Les "bulls" sont optimistes.</li>
                <li><strong>Bear Market</strong> : Marché baissier, tendance générale à la baisse. Les "bears" sont pessimistes.</li>
                <li><strong>Bullish</strong> : Sentiment positif, on s'attend à une hausse</li>
                <li><strong>Bearish</strong> : Sentiment négatif, on s'attend à une baisse</li>
                <li><strong>Sideways/Range</strong> : Marché sans direction claire, prix qui oscille</li>
            </ul>
            
            <h4>📊 Termes de Position</h4>
            <ul>
                <li><strong>Long</strong> : Position acheteuse, on parie sur la hausse. "Je suis long BTC" = j'ai acheté du BTC</li>
                <li><strong>Short</strong> : Position vendeuse, on parie sur la baisse. Permet de gagner quand le prix descend</li>
                <li><strong>Leverage/Effet de levier</strong> : Multiplier sa position avec de l'argent emprunté (ex: x10)</li>
                <li><strong>Margin</strong> : Capital utilisé comme garantie pour le leverage</li>
                <li><strong>Liquidation</strong> : Fermeture forcée d'une position à effet de levier</li>
            </ul>
            
            <h4>💰 Termes de Prix</h4>
            <ul>
                <li><strong>ATH (All-Time High)</strong> : Plus haut historique du prix</li>
                <li><strong>ATL (All-Time Low)</strong> : Plus bas historique du prix</li>
                <li><strong>Dip</strong> : Baisse temporaire du prix, souvent vue comme opportunité d'achat</li>
                <li><strong>Correction</strong> : Baisse de 10-20% après une hausse</li>
                <li><strong>Crash</strong> : Baisse brutale et importante (>20%)</li>
                <li><strong>Pump</strong> : Hausse rapide et forte du prix</li>
                <li><strong>Dump</strong> : Baisse rapide et forte du prix</li>
                <li><strong>Moon</strong> : Hausse extrême ("to the moon" = vers la lune)</li>
            </ul>
            
            <h4>🧠 Termes Psychologiques</h4>
            <ul>
                <li><strong>HODL</strong> : "Hold On for Dear Life" - Conserver ses cryptos malgré la volatilité</li>
                <li><strong>FOMO</strong> : "Fear Of Missing Out" - Peur de rater une opportunité, pousse à acheter impulsivement</li>
                <li><strong>FUD</strong> : "Fear, Uncertainty, Doubt" - Nouvelles négatives qui créent la panique</li>
                <li><strong>Diamond Hands 💎🙌</strong> : Quelqu'un qui garde ses positions malgré les baisses</li>
                <li><strong>Paper Hands 📄🙌</strong> : Quelqu'un qui vend à la moindre baisse</li>
                <li><strong>Bag Holder</strong> : Quelqu'un qui garde une crypto en perte</li>
            </ul>
            
            <h4>🐋 Termes d'Acteurs</h4>
            <ul>
                <li><strong>Whale (Baleine)</strong> : Gros investisseur avec beaucoup de capital, peut influencer le marché</li>
                <li><strong>Retail</strong> : Petits investisseurs individuels</li>
                <li><strong>Institutions</strong> : Grandes entreprises, fonds d'investissement</li>
                <li><strong>Market Maker</strong> : Entité qui fournit de la liquidité au marché</li>
            </ul>
            
            <h4>📈 Termes Techniques</h4>
            <ul>
                <li><strong>Support</strong> : Niveau de prix où les acheteurs entrent en force</li>
                <li><strong>Résistance</strong> : Niveau de prix où les vendeurs entrent en force</li>
                <li><strong>Breakout</strong> : Cassure d'un niveau de support ou résistance</li>
                <li><strong>Breakdown</strong> : Cassure d'un support vers le bas</li>
                <li><strong>Consolidation</strong> : Période où le prix évolue dans une fourchette étroite</li>
                <li><strong>Retracement</strong> : Mouvement contraire temporaire dans une tendance</li>
            </ul>
            
            <h4>💼 Termes de Trading</h4>
            <ul>
                <li><strong>Entry</strong> : Point d'entrée dans une position</li>
                <li><strong>Exit</strong> : Point de sortie d'une position</li>
                <li><strong>Stop Loss (SL)</strong> : Ordre pour limiter les pertes</li>
                <li><strong>Take Profit (TP)</strong> : Ordre pour sécuriser les gains</li>
                <li><strong>Risk/Reward (R:R)</strong> : Ratio entre le risque et le gain potentiel</li>
                <li><strong>PnL</strong> : Profit and Loss - Gains et pertes</li>
                <li><strong>ROI</strong> : Return On Investment - Retour sur investissement</li>
            </ul>
            
            <h4>🔧 Termes Techniques Blockchain</h4>
            <ul>
                <li><strong>Gas</strong> : Frais de transaction sur Ethereum</li>
                <li><strong>Slippage</strong> : Différence entre le prix attendu et le prix d'exécution</li>
                <li><strong>Airdrop</strong> : Distribution gratuite de tokens</li>
                <li><strong>Staking</strong> : Bloquer ses cryptos pour sécuriser le réseau et gagner des récompenses</li>
                <li><strong>Yield</strong> : Rendement généré par un investissement</li>
            </ul>
        """,
        "key_points": [
            "Bull = haussier, Bear = baissier",
            "Long = achat (pari sur la hausse), Short = vente (pari sur la baisse)",
            "FOMO et FUD sont des émotions dangereuses à contrôler",
            "Les whales peuvent influencer fortement les prix",
            "Maîtriser le vocabulaire est essentiel pour progresser"
        ],
        "quiz": []
    },
    (1, 5): {
        "title": "Créer son compte sur un exchange",
        "video_url": "",
        "content": """
            <h3>📝 Guide Complet : Créer son Compte Exchange</h3>
            <p>Suivez ces étapes pour créer votre compte de manière sécurisée sur un exchange centralisé.</p>
            
            <h3>🔍 Étape 1 : Choisir son Exchange</h3>
            <p>Critères de sélection :</p>
            <ul>
                <li><strong>Réputation</strong> : Recherchez les avis et l'historique de l'exchange</li>
                <li><strong>Sécurité</strong> : Vérifiez les mesures de sécurité (2FA, cold storage, assurance)</li>
                <li><strong>Frais</strong> : Comparez les frais de trading et de retrait</li>
                <li><strong>Cryptos disponibles</strong> : Assurez-vous que les cryptos souhaitées sont listées</li>
                <li><strong>Interface</strong> : Choisissez une plateforme adaptée à votre niveau</li>
                <li><strong>Support</strong> : Vérifiez la qualité du service client</li>
                <li><strong>Régulation</strong> : Préférez les exchanges régulés dans votre pays</li>
            </ul>
            
            <p><strong>Recommandations par profil :</strong></p>
            <ul>
                <li><strong>Débutant</strong> : Coinbase, Binance (interface simple)</li>
                <li><strong>Intermédiaire</strong> : Binance, Kraken, OKX</li>
                <li><strong>Avancé</strong> : Bybit, dYdX, FTX (futures, options)</li>
                <li><strong>Français</strong> : Binance, Coinbase, Kraken (enregistrés AMF)</li>
            </ul>
            
            <h3>📧 Étape 2 : Inscription</h3>
            <ol>
                <li>Allez sur le site OFFICIEL de l'exchange (vérifiez l'URL !)</li>
                <li>Cliquez sur "S'inscrire" ou "Register"</li>
                <li>Entrez votre adresse email</li>
                <li>Créez un mot de passe FORT</li>
                <li>Acceptez les conditions d'utilisation</li>
                <li>Confirmez votre email via le lien reçu</li>
            </ol>
            
            <h3>🔐 Étape 3 : Créer un Mot de Passe Fort</h3>
            <p>Votre mot de passe doit être :</p>
            <ul>
                <li>Au minimum 12 caractères (16+ recommandé)</li>
                <li>Mélange de majuscules et minuscules</li>
                <li>Contenir des chiffres</li>
                <li>Contenir des symboles (!@#$%^&*)</li>
                <li>UNIQUE (jamais utilisé ailleurs)</li>
                <li>Pas de mots du dictionnaire</li>
                <li>Pas d'informations personnelles</li>
            </ul>
            
            <p><strong>Exemple de bon mot de passe :</strong> Tr@d1ng_Crypt0_2024!Secure</p>
            <p><strong>Exemple de mauvais mot de passe :</strong> bitcoin123, MonNom2024</p>
            
            <h3>🪪 Étape 4 : Vérification d'Identité (KYC)</h3>
            <p>Le KYC (Know Your Customer) est obligatoire sur les CEX pour :</p>
            <ul>
                <li>Déposer/retirer des euros</li>
                <li>Augmenter les limites de trading</li>
                <li>Accéder à toutes les fonctionnalités</li>
            </ul>
            
            <p><strong>Documents nécessaires :</strong></p>
            <ul>
                <li>Pièce d'identité (passeport ou carte d'identité)</li>
                <li>Selfie avec la pièce d'identité</li>
                <li>Parfois : justificatif de domicile</li>
            </ul>
            
            <p><strong>Conseils pour le KYC :</strong></p>
            <ul>
                <li>Utilisez un document valide et lisible</li>
                <li>Prenez la photo dans un endroit bien éclairé</li>
                <li>Assurez-vous que toutes les informations sont visibles</li>
                <li>Le processus prend généralement 24-48h</li>
            </ul>
            
            <h3>🔒 Étape 5 : Sécuriser son Compte</h3>
            <p>IMMÉDIATEMENT après l'inscription :</p>
            <ol>
                <li><strong>Activer le 2FA</strong> : Google Authenticator ou Authy (PAS SMS !)</li>
                <li><strong>Configurer l'anti-phishing</strong> : Code personnel dans les emails officiels</li>
                <li><strong>Activer la whitelist de retrait</strong> : Limiter les adresses autorisées</li>
                <li><strong>Vérifier les appareils connectés</strong> : Supprimer les sessions inconnues</li>
                <li><strong>Activer les notifications</strong> : Être alerté de toute activité</li>
            </ol>
            
            <h3>⚠️ Pièges à Éviter</h3>
            <ul>
                <li><strong>Faux sites</strong> : Vérifiez TOUJOURS l'URL (https://www.binance.com, pas binance-login.com)</li>
                <li><strong>Emails de phishing</strong> : Ne cliquez jamais sur les liens dans les emails</li>
                <li><strong>Faux support</strong> : Le support ne vous contactera JAMAIS en premier</li>
                <li><strong>Applications non officielles</strong> : Téléchargez uniquement depuis les stores officiels</li>
            </ul>
        """,
        "key_points": [
            "Choisir un exchange régulé et réputé",
            "Créer un mot de passe fort et unique (12+ caractères)",
            "La vérification KYC est obligatoire sur les CEX",
            "Activer IMMÉDIATEMENT le 2FA après inscription",
            "Toujours vérifier l'URL avant de se connecter"
        ],
        "quiz": []
    },
    (1, 6): {
        "title": "Sécuriser son compte (2FA)",
        "video_url": "",
        "content": """
            <h3>🔐 La Double Authentification (2FA) - Votre Bouclier de Sécurité</h3>
            <p>Le 2FA (Two-Factor Authentication) est la mesure de sécurité la plus importante pour protéger votre compte. Elle ajoute une couche de protection en demandant un code temporaire en plus de votre mot de passe.</p>
            
            <h3>🛡️ Pourquoi le 2FA est Indispensable ?</h3>
            <p>Même si quelqu'un vole votre mot de passe, il ne pourra pas accéder à votre compte sans le code 2FA. C'est votre dernière ligne de défense contre :</p>
            <ul>
                <li>Le vol de mot de passe (phishing, keylogger, fuite de données)</li>
                <li>Les attaques par force brute</li>
                <li>L'accès non autorisé à votre compte</li>
            </ul>
            
            <h3>📱 Types de 2FA (du plus au moins sécurisé)</h3>
            
            <h4>1. Clé Physique (Hardware Key) - ⭐⭐⭐⭐⭐</h4>
            <ul>
                <li><strong>YubiKey, Titan Security Key</strong></li>
                <li>Le plus sécurisé car impossible à pirater à distance</li>
                <li>Nécessite la clé physique pour se connecter</li>
                <li>Coût : 30-70€</li>
                <li>Inconvénient : Doit être transportée</li>
            </ul>
            
            <h4>2. Application Authenticator - ⭐⭐⭐⭐</h4>
            <ul>
                <li><strong>Google Authenticator, Authy, Microsoft Authenticator</strong></li>
                <li>Génère des codes qui changent toutes les 30 secondes</li>
                <li>Fonctionne hors ligne</li>
                <li>Gratuit</li>
                <li>RECOMMANDÉ pour la plupart des utilisateurs</li>
            </ul>
            
            <h4>3. SMS - ⭐⭐</h4>
            <ul>
                <li>Code envoyé par SMS</li>
                <li>DÉCONSEILLÉ car vulnérable au SIM swap</li>
                <li>Les hackers peuvent transférer votre numéro</li>
                <li>Mieux que rien, mais évitez si possible</li>
            </ul>
            
            <h4>4. Email - ⭐⭐</h4>
            <ul>
                <li>Code envoyé par email</li>
                <li>Moins pratique et moins sécurisé</li>
                <li>Si votre email est compromis, votre 2FA l'est aussi</li>
            </ul>
            
            <h3>📲 Guide : Configurer Google Authenticator</h3>
            <ol>
                <li><strong>Téléchargez l'application</strong> : Google Authenticator sur iOS ou Android</li>
                <li><strong>Sur l'exchange</strong> : Allez dans Sécurité > 2FA > Google Authenticator</li>
                <li><strong>Scannez le QR code</strong> : Avec l'application</li>
                <li><strong>SAUVEGARDEZ LA CLÉ SECRÈTE</strong> : Le code affiché sous le QR code</li>
                <li><strong>Entrez le code</strong> : Pour confirmer l'activation</li>
                <li><strong>Sauvegardez les codes de récupération</strong></li>
            </ol>
            
            <h3>⚠️ CRUCIAL : Sauvegarder les Codes de Récupération</h3>
            <p>Lors de l'activation du 2FA, vous recevez des codes de récupération. Ces codes sont VITAUX :</p>
            <ul>
                <li><strong>Notez-les sur PAPIER</strong> (pas sur ordinateur !)</li>
                <li><strong>Gardez-les en lieu sûr</strong> (coffre, lieu secret)</li>
                <li><strong>Faites plusieurs copies</strong> dans des endroits différents</li>
                <li><strong>Ne les photographiez pas</strong></li>
                <li><strong>Ne les stockez pas en ligne</strong></li>
            </ul>
            
            <p><strong>Si vous perdez votre téléphone ET vos codes de récupération, vous perdrez l'accès à votre compte !</strong></p>
            
            <h3>💡 Authy vs Google Authenticator</h3>
            <table style="width:100%; border-collapse: collapse; margin: 15px 0;">
                <tr style="background: #f0f0f0;">
                    <th style="padding: 10px; border: 1px solid #ddd;">Critère</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Google Auth</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Authy</th>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">Sauvegarde cloud</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">❌ Non</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">✅ Oui (chiffrée)</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">Multi-appareils</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">❌ Non</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">✅ Oui</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">Récupération facile</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">❌ Difficile</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">✅ Facile</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">Sécurité maximale</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">✅ Oui</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">⚠️ Légèrement moins</td>
                </tr>
            </table>
            
            <p><strong>Recommandation :</strong> Authy pour les débutants (plus facile à récupérer), Google Authenticator pour les paranoïaques de la sécurité.</p>
            
            <h3>🚨 Que Faire si Vous Perdez Votre 2FA ?</h3>
            <ol>
                <li>Utilisez vos codes de récupération</li>
                <li>Si vous n'en avez pas, contactez le support de l'exchange</li>
                <li>Préparez-vous à un processus de vérification long (selfie, vidéo, documents)</li>
                <li>Cela peut prendre plusieurs jours à semaines</li>
            </ol>
        """,
        "key_points": [
            "2FA = Double authentification, INDISPENSABLE pour la sécurité",
            "Préférer Google Authenticator ou Authy au SMS",
            "TOUJOURS sauvegarder les codes de récupération sur papier",
            "Ne jamais partager ses codes 2FA avec quiconque",
            "Authy permet la sauvegarde cloud, Google Auth est plus sécurisé"
        ],
        "quiz": []
    },
    (1, 7): {
        "title": "Effectuer son premier dépôt",
        "video_url": "",
        "content": """
            <h3>💳 Guide Complet : Premier Dépôt sur un Exchange</h3>
            <p>Maintenant que votre compte est créé et sécurisé, il est temps de déposer des fonds pour commencer à trader.</p>
            
            <h3>💰 Méthodes de Dépôt Disponibles</h3>
            
            <h4>1. Virement SEPA (Recommandé pour l'Europe)</h4>
            <ul>
                <li><strong>Frais</strong> : Souvent gratuits ou très faibles (0-1€)</li>
                <li><strong>Délai</strong> : 1-3 jours ouvrés (parfois instantané)</li>
                <li><strong>Minimum</strong> : Variable selon l'exchange (souvent 10-50€)</li>
                <li><strong>Maximum</strong> : Élevé (souvent 100k€+)</li>
            </ul>
            <p><strong>Avantages :</strong> Moins cher, idéal pour les gros montants</p>
            <p><strong>Inconvénients :</strong> Plus lent, nécessite un compte bancaire</p>
            
            <h4>2. Virement Instantané SEPA</h4>
            <ul>
                <li><strong>Frais</strong> : 0-2€</li>
                <li><strong>Délai</strong> : Quelques minutes</li>
                <li><strong>Disponibilité</strong> : Pas toutes les banques</li>
            </ul>
            <p><strong>Avantages :</strong> Rapide et peu cher</p>
            <p><strong>Inconvénients :</strong> Pas disponible partout</p>
            
            <h4>3. Carte Bancaire (Visa/Mastercard)</h4>
            <ul>
                <li><strong>Frais</strong> : 1.5-3.5% (élevés !)</li>
                <li><strong>Délai</strong> : Instantané</li>
                <li><strong>Minimum</strong> : Souvent 15-20€</li>
                <li><strong>Maximum</strong> : Limité (souvent 5-20k€/jour)</li>
            </ul>
            <p><strong>Avantages :</strong> Instantané, pratique</p>
            <p><strong>Inconvénients :</strong> Frais élevés, certaines banques bloquent</p>
            
            <h4>4. Dépôt en Cryptomonnaie</h4>
            <ul>
                <li><strong>Frais</strong> : Frais de réseau uniquement</li>
                <li><strong>Délai</strong> : 10 min à 1h selon la crypto</li>
                <li><strong>Minimum</strong> : Variable</li>
            </ul>
            <p><strong>Avantages :</strong> Rapide, pas de frais exchange</p>
            <p><strong>Inconvénients :</strong> Nécessite déjà des cryptos</p>
            
            <h4>5. P2P (Peer-to-Peer)</h4>
            <ul>
                <li><strong>Frais</strong> : 0% sur la plateforme, mais prix parfois moins avantageux</li>
                <li><strong>Délai</strong> : Variable (dépend du vendeur)</li>
                <li><strong>Méthodes</strong> : Virement, PayPal, Revolut, etc.</li>
            </ul>
            <p><strong>Avantages :</strong> Flexible, nombreuses méthodes de paiement</p>
            <p><strong>Inconvénients :</strong> Risque d'arnaque, prix parfois moins bons</p>
            
            <h3>📋 Étapes pour un Virement SEPA (Exemple Binance)</h3>
            <ol>
                <li>Connectez-vous à votre compte</li>
                <li>Allez dans "Portefeuille" > "Dépôt"</li>
                <li>Sélectionnez "EUR" comme devise</li>
                <li>Choisissez "Virement bancaire (SEPA)"</li>
                <li>Copiez les informations bancaires de Binance :
                    <ul>
                        <li>IBAN du bénéficiaire</li>
                        <li>Nom du bénéficiaire</li>
                        <li>Référence (TRÈS IMPORTANT !)</li>
                    </ul>
                </li>
                <li>Effectuez le virement depuis votre banque</li>
                <li>Attendez 1-3 jours ouvrés</li>
            </ol>
            
            <h3>⚠️ ATTENTION : La Référence du Virement</h3>
            <p style="background: #ffebee; padding: 15px; border-radius: 8px;">
                <strong>CRUCIAL :</strong> Incluez TOUJOURS la référence fournie par l'exchange dans votre virement ! Sans cette référence, votre dépôt peut être perdu ou retardé de plusieurs semaines.
            </p>
            
            <h3>💡 Conseils pour le Premier Dépôt</h3>
            <ul>
                <li><strong>Commencez petit</strong> : Faites un premier dépôt test de 50-100€</li>
                <li><strong>Vérifiez les frais</strong> : Calculez le coût total avant de déposer</li>
                <li><strong>Choisissez la bonne méthode</strong> : SEPA pour les gros montants, carte pour l'urgence</li>
                <li><strong>Gardez une trace</strong> : Conservez les preuves de virement</li>
                <li><strong>Soyez patient</strong> : Les premiers virements peuvent prendre plus de temps</li>
            </ul>
            
            <h3>🏦 Problèmes Courants avec les Banques</h3>
            <p>Certaines banques françaises bloquent les virements vers les exchanges crypto :</p>
            <ul>
                <li><strong>Solutions :</strong>
                    <ul>
                        <li>Contactez votre banque pour débloquer</li>
                        <li>Utilisez une néobanque (Revolut, N26, Boursorama)</li>
                        <li>Passez par le P2P</li>
                    </ul>
                </li>
            </ul>
            
            <h3>📊 Tableau Comparatif des Méthodes</h3>
            <table style="width:100%; border-collapse: collapse; margin: 15px 0;">
                <tr style="background: #f0f0f0;">
                    <th style="padding: 10px; border: 1px solid #ddd;">Méthode</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Frais</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Délai</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Recommandé pour</th>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">SEPA</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">0-1€</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">1-3 jours</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Gros montants</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">Carte</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">1.5-3.5%</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Instantané</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Urgence, petits montants</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">Crypto</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Réseau</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">10-60 min</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Transfert entre exchanges</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">P2P</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">0%</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Variable</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Flexibilité</td>
                </tr>
            </table>
        """,
        "key_points": [
            "Le virement SEPA est le moins cher mais plus lent (1-3 jours)",
            "La carte bancaire est rapide mais avec des frais élevés (1.5-3.5%)",
            "TOUJOURS inclure la référence dans le virement",
            "Commencer avec un petit montant pour tester",
            "Certaines banques bloquent les virements vers les exchanges"
        ],
        "quiz": []
    },
    (1, 8): {
        "title": "Quiz Module 1 - Test Complet",
        "video_url": "",
        "is_quiz": True,
        "content": """
            <h3>🎯 Quiz Final - Introduction au Trading Crypto</h3>
            <p>Ce quiz de 15 questions teste vos connaissances sur les bases du trading crypto. Vous devez obtenir au moins 70% pour valider ce module.</p>
            <p><strong>Temps estimé :</strong> 10-15 minutes</p>
        """,
        "key_points": [],
        "quiz": [
            {
                "question": "Les marchés crypto sont ouverts :",
                "options": ["Du lundi au vendredi, 9h-17h", "24h/24, 5j/7", "24h/24, 7j/7", "Uniquement le week-end"],
                "correct": 2
            },
            {
                "question": "Qu'est-ce qu'un exchange ?",
                "options": ["Un portefeuille crypto", "Une plateforme d'échange de cryptomonnaies", "Une cryptomonnaie", "Un indicateur technique"],
                "correct": 1
            },
            {
                "question": "Que signifie HODL ?",
                "options": ["Vendre rapidement ses cryptos", "Conserver ses cryptos sur le long terme", "Acheter en masse", "Analyser le marché"],
                "correct": 1
            },
            {
                "question": "Quel type de 2FA est le plus recommandé ?",
                "options": ["SMS", "Email", "Google Authenticator / Authy", "Pas de 2FA"],
                "correct": 2
            },
            {
                "question": "Qu'est-ce qu'un Bull Market ?",
                "options": ["Un marché baissier", "Un marché haussier", "Un marché stable", "Un marché fermé"],
                "correct": 1
            },
            {
                "question": "Que signifie FOMO ?",
                "options": ["Fear Of Making Orders", "Fear Of Missing Out", "First Order Market Order", "Final Order Management"],
                "correct": 1
            },
            {
                "question": "Quelle est la méthode de dépôt la moins chère ?",
                "options": ["Carte bancaire", "Virement SEPA", "PayPal", "Western Union"],
                "correct": 1
            },
            {
                "question": "Qu'est-ce qu'une position 'Long' ?",
                "options": ["Un pari sur la baisse", "Un pari sur la hausse", "Une position neutre", "Une position fermée"],
                "correct": 1
            },
            {
                "question": "Qu'est-ce qu'un CEX ?",
                "options": ["Un exchange décentralisé", "Un exchange centralisé", "Une cryptomonnaie", "Un type de wallet"],
                "correct": 1
            },
            {
                "question": "Que représente ATH ?",
                "options": ["All-Time High (plus haut historique)", "All-Time Hold", "Average Trading Hour", "Automated Trading Hub"],
                "correct": 0
            },
            {
                "question": "Pourquoi sauvegarder les codes de récupération 2FA ?",
                "options": ["Pour les partager avec le support", "Pour récupérer l'accès si vous perdez votre téléphone", "Ce n'est pas nécessaire", "Pour les stocker en ligne"],
                "correct": 1
            },
            {
                "question": "Qu'est-ce qu'une 'Whale' en crypto ?",
                "options": ["Un petit investisseur", "Un gros investisseur qui peut influencer le marché", "Un type de cryptomonnaie", "Un exchange"],
                "correct": 1
            },
            {
                "question": "Quel pourcentage de traders perdent de l'argent selon les statistiques ?",
                "options": ["10%", "50%", "70%", "90%"],
                "correct": 3
            },
            {
                "question": "Qu'est-ce que le KYC ?",
                "options": ["Know Your Crypto", "Know Your Customer (vérification d'identité)", "Keep Your Coins", "Key Your Code"],
                "correct": 1
            },
            {
                "question": "Quelle est la règle d'or du trading ?",
                "options": ["Investir tout son argent", "Ne jamais investir plus que ce qu'on peut perdre", "Toujours utiliser le leverage maximum", "Ne jamais utiliser de stop loss"],
                "correct": 1
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
            <h3>📊 Pourquoi les Graphiques sont Essentiels</h3>
            <p>Les graphiques sont l'outil principal du trader. Ils permettent de visualiser l'évolution du prix dans le temps et d'identifier des opportunités de trading. Sans maîtriser la lecture des graphiques, il est impossible de trader efficacement.</p>
            
            <h3>🎯 Ce que les Graphiques Révèlent</h3>
            <ul>
                <li><strong>L'historique des prix</strong> : Comment le prix a évolué dans le passé</li>
                <li><strong>Les tendances</strong> : La direction générale du marché</li>
                <li><strong>Les niveaux clés</strong> : Supports, résistances, zones d'intérêt</li>
                <li><strong>Le sentiment du marché</strong> : Peur, euphorie, indécision</li>
                <li><strong>Les patterns</strong> : Figures qui se répètent et peuvent prédire les mouvements</li>
                <li><strong>Le volume</strong> : L'intensité de l'activité du marché</li>
            </ul>
            
            <h3>📈 Types de Graphiques</h3>
            
            <h4>1. Graphique en Ligne (Line Chart)</h4>
            <ul>
                <li>Le plus simple : une ligne qui connecte les prix de clôture</li>
                <li><strong>Avantages</strong> : Facile à lire, montre la tendance générale</li>
                <li><strong>Inconvénients</strong> : Perd beaucoup d'informations (open, high, low)</li>
                <li><strong>Utilisation</strong> : Vue d'ensemble rapide, présentation simplifiée</li>
            </ul>
            
            <h4>2. Graphique en Barres (OHLC Bar Chart)</h4>
            <ul>
                <li>Chaque barre montre : Open, High, Low, Close</li>
                <li>Trait horizontal gauche = Open, trait horizontal droit = Close</li>
                <li><strong>Avantages</strong> : Plus d'informations que le line chart</li>
                <li><strong>Inconvénients</strong> : Moins visuel que les chandeliers</li>
                <li><strong>Utilisation</strong> : Populaire aux USA, moins en crypto</li>
            </ul>
            
            <h4>3. Graphique en Chandeliers Japonais (Candlestick Chart)</h4>
            <ul>
                <li>Le plus utilisé en trading crypto et forex</li>
                <li>Chaque chandelier = une période (1min, 1h, 1 jour, etc.)</li>
                <li>Corps coloré + mèches haute et basse</li>
                <li><strong>Avantages</strong> : Très visuel, patterns reconnaissables, informations complètes</li>
                <li><strong>Inconvénients</strong> : Nécessite un apprentissage</li>
                <li><strong>Utilisation</strong> : Standard pour l'analyse technique</li>
            </ul>
            
            <h4>4. Graphique Heikin-Ashi</h4>
            <ul>
                <li>Chandeliers modifiés qui lissent les mouvements</li>
                <li>Formule spéciale qui utilise les moyennes</li>
                <li><strong>Avantages</strong> : Tendance plus claire, moins de bruit</li>
                <li><strong>Inconvénients</strong> : Ne montre pas les vrais prix</li>
                <li><strong>Utilisation</strong> : Identifier les tendances, éviter les faux signaux</li>
            </ul>
            
            <h3>🎯 Anatomie d'un Graphique</h3>
            <ul>
                <li><strong>Axe X (horizontal)</strong> : Le temps, de gauche (passé) à droite (présent)</li>
                <li><strong>Axe Y (vertical)</strong> : Le prix, de bas (prix bas) en haut (prix haut)</li>
                <li><strong>Zone de prix</strong> : L'espace principal où s'affichent les chandeliers</li>
                <li><strong>Zone de volume</strong> : Généralement en bas, montre l'activité</li>
                <li><strong>Indicateurs</strong> : Peuvent être superposés ou dans des zones séparées</li>
            </ul>
            
            <h3>⚙️ Paramètres Importants</h3>
            <ul>
                <li><strong>Paire de trading</strong> : BTC/USDT, ETH/BTC, etc.</li>
                <li><strong>Timeframe</strong> : 1m, 5m, 15m, 1H, 4H, 1D, 1W, 1M</li>
                <li><strong>Type de graphique</strong> : Chandeliers, ligne, barres</li>
                <li><strong>Échelle</strong> : Linéaire ou logarithmique</li>
            </ul>
            
            <h3>📐 Échelle Linéaire vs Logarithmique</h3>
            <ul>
                <li><strong>Linéaire</strong> : Chaque unité de prix a la même hauteur. Bon pour le court terme.</li>
                <li><strong>Logarithmique</strong> : Montre les variations en pourcentage. Essentiel pour le long terme et les actifs volatils comme Bitcoin.</li>
            </ul>
            <p><em>Astuce : Utilisez l'échelle logarithmique pour analyser Bitcoin sur plusieurs années !</em></p>
        """,
        "key_points": [
            "Les graphiques visualisent l'évolution du prix dans le temps",
            "Les chandeliers japonais sont les plus utilisés en trading",
            "L'axe X représente le temps, l'axe Y le prix",
            "Le volume montre l'activité et la force des mouvements",
            "L'échelle logarithmique est essentielle pour le long terme"
        ],
        "quiz": []
    },
    (2, 2): {
        "title": "Les chandeliers japonais",
        "video_url": "",
        "content": """
            <h3>🕯️ Histoire des Chandeliers Japonais</h3>
            <p>Les chandeliers japonais ont été inventés au 18ème siècle par Munehisa Homma, un trader de riz japonais. Cette méthode a été introduite en Occident dans les années 1990 par Steve Nison et est devenue le standard mondial de l'analyse technique.</p>
            
            <h3>📊 Anatomie Complète d'un Chandelier</h3>
            <p>Chaque chandelier représente une période de temps (1 minute, 1 heure, 1 jour, etc.) et contient 4 informations essentielles :</p>
            
            <ul>
                <li><strong>Open (Ouverture)</strong> : Le premier prix de la période</li>
                <li><strong>High (Plus haut)</strong> : Le prix maximum atteint pendant la période</li>
                <li><strong>Low (Plus bas)</strong> : Le prix minimum atteint pendant la période</li>
                <li><strong>Close (Clôture)</strong> : Le dernier prix de la période</li>
            </ul>
            
            <h3>🟢🔴 Couleurs et Signification</h3>
            
            <h4>Chandelier Haussier (Vert/Blanc)</h4>
            <ul>
                <li><strong>Condition</strong> : Close > Open (le prix a monté)</li>
                <li><strong>Corps</strong> : De l'Open (bas) au Close (haut)</li>
                <li><strong>Signification</strong> : Les acheteurs ont dominé cette période</li>
            </ul>
            
            <h4>Chandelier Baissier (Rouge/Noir)</h4>
            <ul>
                <li><strong>Condition</strong> : Close < Open (le prix a baissé)</li>
                <li><strong>Corps</strong> : De l'Open (haut) au Close (bas)</li>
                <li><strong>Signification</strong> : Les vendeurs ont dominé cette période</li>
            </ul>
            
            <h3>📏 Corps et Mèches - Ce qu'ils Révèlent</h3>
            
            <h4>Le Corps</h4>
            <ul>
                <li><strong>Grand corps</strong> : Fort mouvement, conviction des traders</li>
                <li><strong>Petit corps</strong> : Faible mouvement, indécision</li>
                <li><strong>Corps plein</strong> : Pression acheteuse ou vendeuse claire</li>
            </ul>
            
            <h4>Les Mèches (Shadows/Wicks)</h4>
            <ul>
                <li><strong>Mèche haute</strong> : Le prix est monté mais a été rejeté (pression vendeuse)</li>
                <li><strong>Mèche basse</strong> : Le prix est descendu mais a été rejeté (pression acheteuse)</li>
                <li><strong>Longue mèche</strong> : Fort rejet, niveau important</li>
                <li><strong>Pas de mèche</strong> : Mouvement unidirectionnel fort</li>
            </ul>
            
            <h3>🔍 Lecture Approfondie des Chandeliers</h3>
            
            <h4>Chandelier avec Long Corps Vert + Pas de Mèches</h4>
            <p>= Marubozu haussier = Les acheteurs ont totalement dominé, très bullish</p>
            
            <h4>Chandelier avec Petit Corps + Longues Mèches</h4>
            <p>= Indécision = Le marché hésite, possible retournement</p>
            
            <h4>Chandelier avec Longue Mèche Basse + Petit Corps en Haut</h4>
            <p>= Marteau = Les vendeurs ont essayé mais les acheteurs ont repris le contrôle</p>
            
            <h4>Chandelier avec Longue Mèche Haute + Petit Corps en Bas</h4>
            <p>= Étoile filante = Les acheteurs ont essayé mais les vendeurs ont repris le contrôle</p>
            
            <h3>⚡ Importance du Contexte</h3>
            <p>Un chandelier seul ne suffit pas ! Il faut toujours considérer :</p>
            <ul>
                <li><strong>La tendance</strong> : Un marteau en bas d'une tendance baissière est plus significatif</li>
                <li><strong>Le volume</strong> : Un chandelier avec fort volume est plus fiable</li>
                <li><strong>Les niveaux</strong> : Un chandelier sur un support/résistance est plus important</li>
                <li><strong>Les chandeliers précédents</strong> : Le contexte des bougies avant</li>
            </ul>
            
            <h3>💡 Exercice Pratique</h3>
            <p>Ouvrez TradingView sur BTC/USDT en Daily et observez :</p>
            <ol>
                <li>Les chandeliers avec de grands corps (mouvements forts)</li>
                <li>Les chandeliers avec de longues mèches (rejets)</li>
                <li>Les chandeliers près des sommets et des creux</li>
            </ol>
        """,
        "key_points": [
            "Un chandelier contient 4 prix : Open, High, Low, Close",
            "Vert = haussier (prix monte), Rouge = baissier (prix baisse)",
            "Le corps montre la différence entre ouverture et clôture",
            "Les mèches montrent les rejets et les extrêmes de la période",
            "Toujours analyser les chandeliers dans leur contexte"
        ],
        "quiz": []
    },
    (2, 3): {
        "title": "Les timeframes (unités de temps)",
        "video_url": "",
        "content": """
            <h3>⏰ Qu'est-ce qu'un Timeframe ?</h3>
            <p>Le timeframe (ou unité de temps) est la période représentée par chaque chandelier sur votre graphique. Choisir le bon timeframe est crucial car il détermine votre perspective sur le marché et doit correspondre à votre style de trading.</p>
            
            <h3>📊 Les Timeframes Disponibles</h3>
            
            <h4>Timeframes Courts (Scalping/Day Trading)</h4>
            <ul>
                <li><strong>1 minute (1m)</strong> : Chaque bougie = 1 minute. Très nerveux, beaucoup de bruit.</li>
                <li><strong>5 minutes (5m)</strong> : Populaire pour le scalping. Mouvements rapides.</li>
                <li><strong>15 minutes (15m)</strong> : Bon compromis pour le day trading intraday.</li>
                <li><strong>30 minutes (30m)</strong> : Moins de bruit que les TF plus courts.</li>
            </ul>
            
            <h4>Timeframes Moyens (Day Trading/Swing Trading)</h4>
            <ul>
                <li><strong>1 heure (1H)</strong> : Standard pour le day trading. Bon équilibre signal/bruit.</li>
                <li><strong>4 heures (4H)</strong> : Très populaire. Idéal pour le swing trading court terme.</li>
            </ul>
            
            <h4>Timeframes Longs (Swing Trading/Position Trading)</h4>
            <ul>
                <li><strong>1 jour (1D/Daily)</strong> : Une bougie par jour. Référence pour la tendance.</li>
                <li><strong>1 semaine (1W/Weekly)</strong> : Vue macro. Tendances de fond.</li>
                <li><strong>1 mois (1M/Monthly)</strong> : Très long terme. Investissement.</li>
            </ul>
            
            <h3>🎯 Quel Timeframe pour Quel Style ?</h3>
            
            <table style="width:100%; border-collapse: collapse; margin: 15px 0;">
                <tr style="background: #f0f0f0;">
                    <th style="padding: 10px; border: 1px solid #ddd;">Style</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">TF Principal</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">TF Secondaire</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Durée Position</th>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">Scalping</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">1m, 5m</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">15m, 1H</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Secondes à minutes</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">Day Trading</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">15m, 1H</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">4H, Daily</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Minutes à heures</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">Swing Trading</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">4H, Daily</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Weekly</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Jours à semaines</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">Position Trading</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Daily, Weekly</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Monthly</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">Semaines à mois</td>
                </tr>
            </table>
            
            <h3>🔄 L'Analyse Multi-Timeframe (MTF)</h3>
            <p>Les traders professionnels analysent TOUJOURS plusieurs timeframes pour avoir une vue complète :</p>
            
            <h4>La Règle des 3 Timeframes</h4>
            <ol>
                <li><strong>Grand Timeframe (Tendance)</strong> : Identifie la direction principale
                    <ul><li>Ex: Si vous tradez en 1H, regardez le Daily</li></ul>
                </li>
                <li><strong>Timeframe Intermédiaire (Setup)</strong> : Trouve les zones d'intérêt
                    <ul><li>Ex: Le 4H pour affiner l'analyse</li></ul>
                </li>
                <li><strong>Petit Timeframe (Entrée)</strong> : Timing précis pour entrer
                    <ul><li>Ex: Le 15m ou 1H pour l'entrée exacte</li></ul>
                </li>
            </ol>
            
            <h4>Exemple Concret</h4>
            <ul>
                <li><strong>Weekly</strong> : BTC en tendance haussière globale</li>
                <li><strong>Daily</strong> : Prix proche d'un support important</li>
                <li><strong>4H</strong> : Formation d'un pattern de retournement</li>
                <li><strong>1H</strong> : Entrée sur confirmation du pattern</li>
            </ul>
            
            <h3>⚠️ Erreurs Courantes</h3>
            <ul>
                <li><strong>Trader contre la tendance du grand TF</strong> : Si le Daily est baissier, évitez les longs sur le 15m</li>
                <li><strong>Changer de TF en cours de trade</strong> : Restez cohérent avec votre plan</li>
                <li><strong>Utiliser des TF trop courts</strong> : Plus de bruit, plus de faux signaux</li>
                <li><strong>Ignorer les grands TF</strong> : Vous ratez la vue d'ensemble</li>
            </ul>
            
            <h3>💡 Recommandation pour Débutants</h3>
            <p>Commencez par les timeframes plus grands (4H et Daily) :</p>
            <ul>
                <li>Moins de bruit et de faux signaux</li>
                <li>Plus de temps pour analyser et décider</li>
                <li>Moins stressant</li>
                <li>Frais de trading réduits (moins de trades)</li>
            </ul>
        """,
        "key_points": [
            "Le timeframe détermine la durée de chaque chandelier",
            "Scalping = petits timeframes (1m-15m), Swing = grands timeframes (4H-Daily)",
            "L'analyse multi-timeframe améliore la précision des trades",
            "Commencez par les timeframes plus grands (4H, Daily) pour moins de bruit",
            "Tradez toujours dans le sens de la tendance du grand timeframe"
        ],
        "quiz": []
    },
    # ... Continuer avec les autres leçons du module 2 ...
    
    (2, 10): {
        "title": "Quiz Module 2 - Test Complet",
        "video_url": "",
        "is_quiz": True,
        "content": """
            <h3>🎯 Quiz Final - Lecture des Graphiques</h3>
            <p>Ce quiz de 12 questions teste vos connaissances sur les graphiques et l'analyse technique de base. Vous devez obtenir au moins 70% pour valider ce module.</p>
        """,
        "key_points": [],
        "quiz": [
            {
                "question": "Que représente un chandelier vert ?",
                "options": ["Le prix a baissé", "Le prix a monté (Close > Open)", "Le prix n'a pas bougé", "Le volume est élevé"],
                "correct": 1
            },
            {
                "question": "Qu'est-ce qu'un timeframe ?",
                "options": ["Un indicateur technique", "L'unité de temps représentée par chaque chandelier", "Un type de graphique", "Une stratégie de trading"],
                "correct": 1
            },
            {
                "question": "Comment identifier une tendance haussière ?",
                "options": ["Lower Highs et Lower Lows", "Higher Highs et Higher Lows", "Prix stable", "Volume en baisse"],
                "correct": 1
            },
            {
                "question": "Que signifie un marteau (hammer) ?",
                "options": ["Signal de vente fort", "Signal d'achat potentiel après une baisse", "Tendance neutre", "Forte volatilité"],
                "correct": 1
            },
            {
                "question": "Quelles sont les 4 informations d'un chandelier ?",
                "options": ["Volume, Prix, Temps, Tendance", "Open, High, Low, Close", "Support, Résistance, Trend, Range", "Buy, Sell, Hold, Wait"],
                "correct": 1
            },
            {
                "question": "Quel timeframe est recommandé pour les débutants ?",
                "options": ["1 minute", "5 minutes", "4H et Daily", "1 seconde"],
                "correct": 2
            },
            {
                "question": "Que représente une longue mèche haute sur un chandelier ?",
                "options": ["Fort achat", "Rejet des prix hauts (pression vendeuse)", "Volume élevé", "Tendance haussière confirmée"],
                "correct": 1
            },
            {
                "question": "Qu'est-ce que l'analyse multi-timeframe ?",
                "options": ["Trader sur plusieurs exchanges", "Analyser plusieurs timeframes pour une vue complète", "Utiliser plusieurs indicateurs", "Trader plusieurs cryptos"],
                "correct": 1
            },
            {
                "question": "Un chandelier Doji indique :",
                "options": ["Forte tendance haussière", "Forte tendance baissière", "Indécision du marché", "Volume record"],
                "correct": 2
            },
            {
                "question": "Quelle échelle utiliser pour analyser Bitcoin sur plusieurs années ?",
                "options": ["Linéaire", "Logarithmique", "Exponentielle", "Quadratique"],
                "correct": 1
            },
            {
                "question": "Le volume confirme un mouvement quand il est :",
                "options": ["Faible", "Élevé", "Stable", "Négatif"],
                "correct": 1
            },
            {
                "question": "Que signifie 'The trend is your friend' ?",
                "options": ["Les amis donnent de bons conseils", "Tradez dans le sens de la tendance principale", "La tendance est toujours haussière", "Ignorez la tendance"],
                "correct": 1
            }
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
            <p>La gestion du capital (money management) est LA compétence la plus importante en trading. C'est ce qui sépare les traders qui survivent de ceux qui perdent tout leur capital. Même avec la meilleure stratégie du monde, une mauvaise gestion du risque vous ruinera.</p>
            
            <h3>📊 Statistiques Révélatrices</h3>
            <ul>
                <li><strong>90% des traders perdent de l'argent</strong> - C'est un fait documenté</li>
                <li><strong>La principale raison</strong> : Mauvaise gestion du risque, pas les mauvaises analyses</li>
                <li><strong>Les 10% qui gagnent</strong> : Ont tous une gestion du risque stricte</li>
                <li>Un bon money management peut transformer une stratégie à 40% de réussite en stratégie profitable</li>
            </ul>
            
            <h3>🎯 Les 4 Objectifs du Money Management</h3>
            
            <h4>1. Préserver le Capital</h4>
            <p>Votre capital est votre outil de travail. Sans capital, pas de trading. L'objectif #1 est de survivre aux inévitables séries de pertes.</p>
            
            <h4>2. Maximiser les Gains</h4>
            <p>Laisser courir les profits tout en coupant rapidement les pertes. Le ratio Risk/Reward est clé.</p>
            
            <h4>3. Contrôler les Émotions</h4>
            <p>Quand vous risquez un montant raisonnable, vous tradez avec un esprit clair. Risquer trop crée du stress et des décisions irrationnelles.</p>
            
            <h4>4. Assurer la Longévité</h4>
            <p>Le trading est un marathon, pas un sprint. Vous devez pouvoir trader pendant des années pour devenir profitable.</p>
            
            <h3>📉 L'Effet Dévastateur des Pertes</h3>
            <p>Les mathématiques des pertes sont cruelles :</p>
            
            <table style="width:100%; border-collapse: collapse; margin: 15px 0;">
                <tr style="background: #f0f0f0;">
                    <th style="padding: 10px; border: 1px solid #ddd;">Perte</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">Gain nécessaire pour récupérer</th>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">-10%</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">+11%</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">-20%</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">+25%</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">-30%</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">+43%</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">-50%</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">+100%</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">-90%</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">+900%</td>
                </tr>
            </table>
            
            <p><strong>Conclusion</strong> : Il est beaucoup plus facile de perdre que de récupérer. Protégez votre capital !</p>
            
            <h3>🔥 Exemples de Mauvaise Gestion</h3>
            <ul>
                <li><strong>All-in sur un trade</strong> : Un seul mauvais trade = tout perdu</li>
                <li><strong>Pas de stop loss</strong> : "Ça va remonter" → Liquidation</li>
                <li><strong>Doubler après une perte</strong> : Martingale = ruine garantie</li>
                <li><strong>Leverage excessif</strong> : x100 = liquidation rapide</li>
                <li><strong>Trader avec l'argent du loyer</strong> : Stress = mauvaises décisions</li>
            </ul>
            
            <h3>✅ Principes d'une Bonne Gestion</h3>
            <ul>
                <li>Ne jamais risquer plus de 1-2% par trade</li>
                <li>Toujours utiliser un stop loss</li>
                <li>Avoir un plan avant d'entrer</li>
                <li>Respecter son plan quoi qu'il arrive</li>
                <li>Accepter les pertes comme partie du jeu</li>
            </ul>
        """,
        "key_points": [
            "Le money management est plus important que la stratégie de trading",
            "90% des traders perdent à cause d'une mauvaise gestion du risque",
            "L'objectif principal est de préserver le capital pour survivre",
            "Les pertes sont asymétriques : -50% nécessite +100% pour récupérer",
            "Un bon money management réduit le stress et améliore les décisions"
        ],
        "quiz": []
    },
    
    # Continuer avec les autres leçons...
    (3, 8): {
        "title": "Quiz Module 3 - Test Complet",
        "video_url": "",
        "is_quiz": True,
        "content": """
            <h3>🎯 Quiz Final - Gestion du Capital</h3>
            <p>Ce quiz de 12 questions teste vos connaissances sur le money management. Vous devez obtenir au moins 70% pour valider ce module.</p>
        """,
        "key_points": [],
        "quiz": [
            {
                "question": "Quel pourcentage maximum devez-vous risquer par trade ?",
                "options": ["5-10%", "1-2%", "10-20%", "50%"],
                "correct": 1
            },
            {
                "question": "Qu'est-ce qu'un stop loss ?",
                "options": ["Un ordre d'achat automatique", "Un ordre qui limite les pertes automatiquement", "Un indicateur technique", "Un type de graphique"],
                "correct": 1
            },
            {
                "question": "Un R:R de 1:3 signifie :",
                "options": ["Risque 3× plus grand que le gain", "Gain potentiel 3× plus grand que le risque", "Risque égal au gain", "Aucun risque"],
                "correct": 1
            },
            {
                "question": "Pourquoi le money management est-il crucial ?",
                "options": ["Pour gagner plus rapidement", "Pour survivre aux séries de pertes", "Pour impressionner les autres", "Ce n'est pas vraiment important"],
                "correct": 1
            },
            {
                "question": "Si vous perdez 50% de votre capital, combien devez-vous gagner pour récupérer ?",
                "options": ["50%", "75%", "100%", "150%"],
                "correct": 2
            },
            {
                "question": "Qu'est-ce que le position sizing ?",
                "options": ["La taille de votre écran", "Le calcul de la taille de position selon le risque", "Le nombre de trades par jour", "La durée d'un trade"],
                "correct": 1
            },
            {
                "question": "Où placer un stop loss pour un achat (long) ?",
                "options": ["Au-dessus du prix d'entrée", "En dessous d'un support", "Au prix d'entrée exact", "Pas besoin de stop loss"],
                "correct": 1
            },
            {
                "question": "Que faire si votre stop loss est touché ?",
                "options": ["Racheter immédiatement", "Accepter la perte et passer au trade suivant", "Déplacer le stop loss", "Doubler la position"],
                "correct": 1
            },
            {
                "question": "Quel R:R minimum est recommandé ?",
                "options": ["1:0.5", "1:1", "1:2 ou plus", "Pas important"],
                "correct": 2
            },
            {
                "question": "Qu'est-ce qu'un trailing stop ?",
                "options": ["Un stop fixe", "Un stop qui suit le prix en votre faveur", "Un stop mental", "Un stop sur plusieurs jours"],
                "correct": 1
            },
            {
                "question": "Avec un risque de 2% et un capital de 10 000€, combien pouvez-vous perdre par trade ?",
                "options": ["100€", "200€", "500€", "1000€"],
                "correct": 1
            },
            {
                "question": "Pourquoi ne jamais déplacer son stop loss dans le sens de la perte ?",
                "options": ["C'est interdit par les exchanges", "Cela augmente le risque et peut mener à des pertes catastrophiques", "Ce n'est pas grave de le faire", "Pour payer moins de frais"],
                "correct": 1
            }
        ]
    },
}

# Informations sur les modules avec nombre de leçons
MODULE_INFO = {
    1: {"name": "Introduction au Trading Crypto", "description": "Découvrez les bases du trading de cryptomonnaies.", "lessons": 8},
    2: {"name": "Lecture des Graphiques", "description": "Apprenez à lire et interpréter les graphiques de trading.", "lessons": 10},
    3: {"name": "Gestion du Capital", "description": "Maîtrisez le money management pour protéger votre capital.", "lessons": 8},
    4: {"name": "Types d'Ordres", "description": "Comprenez tous les types d'ordres disponibles.", "lessons": 7},
    5: {"name": "Sécurité & Wallets", "description": "Protégez vos cryptomonnaies efficacement.", "lessons": 6},
    6: {"name": "Psychologie du Trader", "description": "Maîtrisez vos émotions pour trader sereinement.", "lessons": 7},
    7: {"name": "Supports & Résistances", "description": "Identifiez les niveaux clés du marché.", "lessons": 9},
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

# Générer le contenu générique pour les modules non encore détaillés
def generate_detailed_content(module_id, lesson_id, module_info):
    """Génère du contenu détaillé pour les leçons."""
    return {
        "title": f"{module_info['name']} - Leçon {lesson_id}",
        "video_url": "",
        "content": f"""
            <h3>📚 {module_info['name']} - Leçon {lesson_id}</h3>
            <p>{module_info['description']}</p>
            
            <h3>🎯 Objectifs de cette leçon</h3>
            <p>Dans cette leçon, vous allez apprendre les concepts fondamentaux liés à ce sujet. Prenez le temps de bien comprendre chaque notion avant de passer à la suite.</p>
            
            <h3>📖 Contenu Principal</h3>
            <p>Cette leçon fait partie du module <strong>{module_info['name']}</strong>. Elle vous permettra de développer vos compétences de trading de manière progressive.</p>
            
            <ul>
                <li>Comprendre les concepts fondamentaux</li>
                <li>Apprendre les techniques pratiques</li>
                <li>Développer vos compétences de trading</li>
                <li>Appliquer les connaissances en situation réelle</li>
            </ul>
            
            <h3>💡 Points Clés à Retenir</h3>
            <p>Regardez la vidéo ci-dessus pour un apprentissage complet de ce sujet. N'hésitez pas à prendre des notes et à revoir les passages importants.</p>
            
            <h3>📝 Exercice Pratique</h3>
            <p>Après avoir visionné la vidéo, essayez d'appliquer les concepts appris sur un graphique réel. La pratique est essentielle pour progresser !</p>
        """,
        "key_points": [
            f"Maîtriser les bases de {module_info['name'].lower()}",
            "Appliquer les concepts en situation réelle",
            "Pratiquer régulièrement pour progresser",
            "Revoir les leçons précédentes si nécessaire"
        ],
        "quiz": []
    }

# Générer les quiz complets de 10-15 questions pour chaque module
def generate_module_quiz(module_id, module_info):
    """Génère un quiz complet de 10-15 questions pour un module."""
    
    # Quiz personnalisés par module
    module_quizzes = {
        4: [  # Types d'Ordres
            {"question": "Un ordre au marché s'exécute :", "options": ["À un prix spécifique", "Immédiatement au meilleur prix disponible", "Uniquement le lendemain", "Jamais"], "correct": 1},
            {"question": "Un ordre limite d'achat est placé :", "options": ["Au-dessus du prix actuel", "En dessous du prix actuel", "Au prix actuel exact", "N'importe où"], "correct": 1},
            {"question": "Qu'est-ce qu'un trailing stop ?", "options": ["Un stop fixe", "Un stop qui suit le prix en votre faveur", "Un ordre d'achat", "Un indicateur technique"], "correct": 1},
            {"question": "OCO signifie :", "options": ["Order Creates Order", "One Cancels Other", "Only Crypto Orders", "Open Close Order"], "correct": 1},
            {"question": "Quel ordre utiliser pour entrer rapidement sur un breakout ?", "options": ["Ordre limite", "Ordre au marché ou Buy Stop", "Trailing stop", "OCO"], "correct": 1},
            {"question": "Les frais 'maker' s'appliquent quand :", "options": ["Vous prenez de la liquidité", "Vous ajoutez de la liquidité (ordre limite)", "Vous retirez des fonds", "Vous déposez des fonds"], "correct": 1},
            {"question": "Un ordre stop-limit combine :", "options": ["Deux ordres au marché", "Un ordre stop et un ordre limite", "Deux ordres limite", "Un ordre et un indicateur"], "correct": 1},
            {"question": "Que se passe-t-il si le prix gap au-delà de votre stop-limit ?", "options": ["L'ordre s'exécute quand même", "L'ordre peut ne pas s'exécuter", "L'ordre est annulé automatiquement", "Vous recevez un remboursement"], "correct": 1},
            {"question": "Quel ordre protège vos gains tout en laissant courir les profits ?", "options": ["Stop loss fixe", "Trailing stop", "Ordre limite", "Ordre au marché"], "correct": 1},
            {"question": "Un Buy Stop est placé :", "options": ["En dessous du prix actuel", "Au-dessus du prix actuel", "Au prix actuel", "N'importe où"], "correct": 1},
            {"question": "Quel est l'avantage principal d'un ordre limite ?", "options": ["Exécution garantie", "Contrôle du prix d'exécution", "Pas de frais", "Plus rapide"], "correct": 1},
            {"question": "Le slippage est plus probable avec :", "options": ["Un ordre limite", "Un ordre au marché", "Un trailing stop", "Un ordre OCO"], "correct": 1},
        ],
        5: [  # Sécurité & Wallets
            {"question": "Qu'est-ce qu'un cold wallet ?", "options": ["Un wallet connecté à Internet", "Un wallet hors ligne", "Un wallet gratuit", "Un wallet d'exchange"], "correct": 1},
            {"question": "Que devez-vous faire avec votre seed phrase ?", "options": ["La partager avec le support", "La stocker sur Google Drive", "La noter sur papier et la garder en sécurité", "La mémoriser uniquement"], "correct": 2},
            {"question": "Quel type de 2FA est le plus sécurisé ?", "options": ["SMS", "Email", "Google Authenticator ou clé physique", "Aucun 2FA"], "correct": 2},
            {"question": "'Not your keys, not your coins' signifie :", "options": ["Les clés sont importantes", "Sans contrôle des clés privées, vous ne possédez pas vraiment vos cryptos", "Les coins sont des clés", "Il faut acheter des clés"], "correct": 1},
            {"question": "Quel wallet est recommandé pour les gros montants ?", "options": ["Wallet d'exchange", "Hot wallet mobile", "Hardware wallet (Ledger/Trezor)", "Paper wallet"], "correct": 2},
            {"question": "Qu'est-ce qu'une attaque SIM swap ?", "options": ["Changer de téléphone", "Un hacker transfère votre numéro pour intercepter les SMS", "Échanger des cartes SIM", "Une mise à jour de la SIM"], "correct": 1},
            {"question": "Que faire si vous recevez un email demandant votre seed phrase ?", "options": ["Répondre immédiatement", "Ignorer et supprimer - c'est une arnaque", "Vérifier en appelant le support", "Envoyer la seed phrase"], "correct": 1},
            {"question": "Combien de mots contient généralement une seed phrase ?", "options": ["6 mots", "12 ou 24 mots", "50 mots", "100 mots"], "correct": 1},
            {"question": "Où stocker votre seed phrase ?", "options": ["Dans un fichier sur votre ordinateur", "Sur Google Drive", "Sur papier dans un lieu sécurisé", "Dans un email à vous-même"], "correct": 2},
            {"question": "Qu'est-ce que le phishing ?", "options": ["Une technique de pêche", "Une arnaque qui imite des sites légitimes pour voler vos informations", "Un type de trading", "Une cryptomonnaie"], "correct": 1},
            {"question": "Quel pourcentage de vos cryptos garder sur un exchange ?", "options": ["100%", "Seulement ce dont vous avez besoin pour trader (10-20%)", "50%", "0%"], "correct": 1},
            {"question": "Que vérifier avant de vous connecter à un exchange ?", "options": ["La couleur du site", "L'URL exacte (https://)", "Le nombre d'utilisateurs", "La météo"], "correct": 1},
        ],
        6: [  # Psychologie du Trader
            {"question": "Que signifie FOMO ?", "options": ["Fear Of Making Orders", "Fear Of Missing Out", "First Order Market Order", "Final Order Management"], "correct": 1},
            {"question": "Qu'est-ce que le revenge trading ?", "options": ["Trader pour se venger du marché", "Trader impulsivement pour récupérer une perte", "Un type d'ordre", "Une stratégie rentable"], "correct": 1},
            {"question": "Pourquoi tenir un journal de trading ?", "options": ["Pour impressionner les autres", "Pour analyser ses trades et progresser", "Ce n'est pas utile", "Pour les impôts uniquement"], "correct": 1},
            {"question": "Que faire après une série de pertes ?", "options": ["Trader immédiatement pour récupérer", "Doubler la taille de position", "Faire une pause et analyser", "Abandonner le trading"], "correct": 2},
            {"question": "Quel pourcentage du succès en trading vient de la psychologie ?", "options": ["10%", "30%", "50%", "80%"], "correct": 3},
            {"question": "Qu'est-ce que l'overtrading ?", "options": ["Trader trop peu", "Trader trop souvent, souvent par ennui ou émotion", "Trader uniquement les cryptos", "Trader avec profit"], "correct": 1},
            {"question": "Comment gérer le stress en trading ?", "options": ["Ignorer le stress", "Risquer moins, avoir un plan, faire des pauses", "Trader plus pour s'habituer", "Boire du café"], "correct": 1},
            {"question": "Qu'est-ce qu'un plan de trading ?", "options": ["Une liste de cryptos à acheter", "Un ensemble de règles définies AVANT de trader", "Un indicateur technique", "Un type de graphique"], "correct": 1},
            {"question": "Pourquoi les émotions sont-elles dangereuses en trading ?", "options": ["Elles ne sont pas dangereuses", "Elles mènent à des décisions irrationnelles", "Elles améliorent les performances", "Elles n'ont aucun impact"], "correct": 1},
            {"question": "Que noter dans un journal de trading ?", "options": ["Uniquement les gains", "Tous les détails : entrée, sortie, raison, émotions, résultat", "Rien de particulier", "Uniquement les pertes"], "correct": 1},
            {"question": "Qu'est-ce que la discipline en trading ?", "options": ["Trader beaucoup", "Suivre son plan sans exception", "Changer de stratégie souvent", "Ignorer les stop loss"], "correct": 1},
            {"question": "Comment éviter le FOMO ?", "options": ["Acheter à chaque hausse", "Avoir un plan et s'y tenir, accepter de rater des opportunités", "Suivre tous les influenceurs", "Trader 24h/24"], "correct": 1},
        ],
        7: [  # Supports & Résistances
            {"question": "Qu'est-ce qu'un support ?", "options": ["Un niveau où les vendeurs dominent", "Un niveau où les acheteurs dominent et empêchent le prix de baisser", "Un indicateur technique", "Un type d'ordre"], "correct": 1},
            {"question": "Que se passe-t-il quand un support est cassé ?", "options": ["Il disparaît", "Il devient souvent une résistance", "Il devient plus fort", "Rien de particulier"], "correct": 1},
            {"question": "Comment confirmer un breakout ?", "options": ["Par le prix seul", "Par le volume élevé et la clôture au-delà du niveau", "Par la couleur de la bougie", "Par l'heure de la journée"], "correct": 1},
            {"question": "Qu'est-ce qu'un faux breakout (fakeout) ?", "options": ["Un breakout avec beaucoup de volume", "Une cassure qui ne tient pas et revient dans la zone", "Un breakout la nuit", "Un breakout sur Bitcoin uniquement"], "correct": 1},
            {"question": "Les niveaux psychologiques sont souvent :", "options": ["Des nombres aléatoires", "Des nombres ronds (10000$, 50000$)", "Des nombres premiers", "Des nombres négatifs"], "correct": 1},
            {"question": "Comment tracer un support ?", "options": ["En connectant les sommets", "En connectant les creux où le prix a rebondi", "Au hasard", "Uniquement sur le Daily"], "correct": 1},
            {"question": "Qu'est-ce que le flip de S/R ?", "options": ["Un indicateur", "Quand un support cassé devient résistance (et vice versa)", "Un type d'ordre", "Une stratégie de scalping"], "correct": 1},
            {"question": "Où placer son stop loss pour un achat sur support ?", "options": ["Au-dessus du support", "En dessous du support", "Au niveau exact du support", "Pas de stop loss nécessaire"], "correct": 1},
            {"question": "Plus un niveau est testé, plus il est :", "options": ["Faible", "Significatif et susceptible de tenir", "Ignoré", "Dangereux"], "correct": 1},
            {"question": "Qu'est-ce qu'une zone de liquidité ?", "options": ["Une zone sans ordres", "Une zone où beaucoup de stop loss sont concentrés", "Une zone de faible volume", "Une zone interdite"], "correct": 1},
            {"question": "Comment trader un rebond sur support ?", "options": ["Vendre immédiatement", "Attendre une confirmation puis acheter avec stop sous le support", "Ignorer le support", "Shorter le support"], "correct": 1},
            {"question": "Les S/R sont plus fiables sur :", "options": ["Les petits timeframes", "Les grands timeframes (Daily, Weekly)", "Tous les timeframes également", "Aucun timeframe"], "correct": 1},
        ],
        8: [  # Indicateurs Techniques
            {"question": "Que signifie un RSI > 70 ?", "options": ["Survente", "Surachat (possible signal de vente)", "Tendance neutre", "Volume élevé"], "correct": 1},
            {"question": "Qu'est-ce qu'un Golden Cross ?", "options": ["RSI > 70", "MA 50 croise MA 200 vers le haut (signal haussier)", "Prix au plus haut historique", "Volume record"], "correct": 1},
            {"question": "Les Bandes de Bollinger mesurent :", "options": ["La tendance", "Le momentum", "La volatilité", "Le volume"], "correct": 2},
            {"question": "Combien d'indicateurs maximum recommande-t-on ?", "options": ["1 seul", "2-3 maximum", "5-10", "Autant que possible"], "correct": 1},
            {"question": "Qu'est-ce qu'une divergence RSI ?", "options": ["RSI = 50", "Le prix et le RSI vont dans des directions opposées", "RSI très élevé", "RSI très bas"], "correct": 1},
            {"question": "Le MACD est composé de :", "options": ["Une seule ligne", "Ligne MACD, ligne Signal, et histogramme", "Trois moyennes mobiles", "Bandes de Bollinger"], "correct": 1},
            {"question": "Qu'est-ce qu'un Death Cross ?", "options": ["Un pattern de chandelier", "MA 50 croise MA 200 vers le bas (signal baissier)", "RSI < 30", "Volume nul"], "correct": 1},
            {"question": "L'ATR mesure :", "options": ["La tendance", "La volatilité moyenne", "Le volume", "Le sentiment"], "correct": 1},
            {"question": "Un squeeze des Bandes de Bollinger indique :", "options": ["Forte volatilité", "Consolidation avant un mouvement potentiel", "Tendance haussière", "Tendance baissière"], "correct": 1},
            {"question": "Le RSI oscille entre :", "options": ["0 et 50", "0 et 100", "-100 et +100", "Pas de limite"], "correct": 1},
            {"question": "Pourquoi combiner plusieurs indicateurs ?", "options": ["Pour compliquer l'analyse", "Pour augmenter la fiabilité des signaux par confluence", "Ce n'est pas recommandé", "Pour impressionner"], "correct": 1},
            {"question": "Le Volume Profile montre :", "options": ["Le volume dans le temps", "Le volume échangé à chaque niveau de prix", "La tendance", "Le RSI"], "correct": 1},
        ],
    }
    
    # Retourner le quiz personnalisé ou un quiz générique
    if module_id in module_quizzes:
        return module_quizzes[module_id]
    else:
        # Quiz générique pour les modules sans quiz personnalisé
        return [
            {"question": f"Question 1 sur {module_info['name']}", "options": ["Option A", "Option B (correcte)", "Option C", "Option D"], "correct": 1},
            {"question": f"Question 2 sur {module_info['name']}", "options": ["Option A", "Option B", "Option C (correcte)", "Option D"], "correct": 2},
            {"question": f"Question 3 sur {module_info['name']}", "options": ["Option A (correcte)", "Option B", "Option C", "Option D"], "correct": 0},
            {"question": f"Question 4 sur {module_info['name']}", "options": ["Option A", "Option B (correcte)", "Option C", "Option D"], "correct": 1},
            {"question": f"Question 5 sur {module_info['name']}", "options": ["Option A", "Option B", "Option C", "Option D (correcte)"], "correct": 3},
            {"question": f"Question 6 sur {module_info['name']}", "options": ["Option A", "Option B (correcte)", "Option C", "Option D"], "correct": 1},
            {"question": f"Question 7 sur {module_info['name']}", "options": ["Option A (correcte)", "Option B", "Option C", "Option D"], "correct": 0},
            {"question": f"Question 8 sur {module_info['name']}", "options": ["Option A", "Option B", "Option C (correcte)", "Option D"], "correct": 2},
            {"question": f"Question 9 sur {module_info['name']}", "options": ["Option A", "Option B (correcte)", "Option C", "Option D"], "correct": 1},
            {"question": f"Question 10 sur {module_info['name']}", "options": ["Option A", "Option B", "Option C", "Option D (correcte)"], "correct": 3},
        ]

# Générer le contenu pour tous les modules
for module_id, info in MODULE_INFO.items():
    for lesson_id in range(1, info["lessons"] + 1):
        key = (module_id, lesson_id)
        if key not in LESSON_CONTENT:
            if lesson_id == info["lessons"]:
                # Dernière leçon = Quiz complet de 10-15 questions
                LESSON_CONTENT[key] = {
                    "title": f"Quiz Module {module_id} - Test Complet",
                    "video_url": "",
                    "is_quiz": True,
                    "content": f"""
                        <h3>🎯 Quiz Final - {info['name']}</h3>
                        <p>Ce quiz de 10-12 questions teste vos connaissances sur {info['name'].lower()}.</p>
                        <p><strong>Objectif :</strong> Obtenir au moins 70% de bonnes réponses pour valider ce module.</p>
                        <p><strong>Temps estimé :</strong> 10-15 minutes</p>
                    """,
                    "key_points": [],
                    "quiz": generate_module_quiz(module_id, info)
                }
            else:
                LESSON_CONTENT[key] = generate_detailed_content(module_id, lesson_id, info)


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