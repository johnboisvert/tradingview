import { Lesson } from "./types";

const m1l1: Lesson = {
  id: "m1-l1",
  title: "Blockchain, Bitcoin & Cryptomonnaies",
  icon: "🔗",
  duration: "45 min",
  description: "Comprendre la technologie blockchain, Bitcoin, Ethereum et l'écosystème crypto.",
  subLessons: [
    {
      title: "Qu'est-ce que la Blockchain ?",
      content: [
        "La blockchain est un registre distribué, décentralisé et immuable qui enregistre les transactions de manière transparente et sécurisée. Imaginez un grand livre comptable dont chaque page (bloc) est liée à la précédente par un sceau cryptographique impossible à falsifier. Cette technologie révolutionnaire élimine le besoin d'un tiers de confiance (banque, notaire) pour valider les transactions.",
        "Chaque bloc contient un hash cryptographique du bloc précédent, un horodatage, et les données de transaction. Si vous modifiez un seul caractère dans un bloc, le hash change complètement (effet avalanche), invalidant tous les blocs suivants. C'est ce qui rend la blockchain pratiquement inviolable.",
        "La blockchain fonctionne sur un réseau peer-to-peer (P2P) où chaque nœud possède une copie complète du registre. Pour modifier une transaction, il faudrait pirater simultanément plus de 50% des nœuds du réseau — pratiquement impossible sur Bitcoin qui compte plus de 15 000 nœuds répartis dans le monde entier.",
        "Le mécanisme de consensus détermine comment les nœuds s'accordent sur l'état du registre. Le Proof of Work (PoW) utilisé par Bitcoin demande aux mineurs de résoudre des puzzles mathématiques complexes. Le Proof of Stake (PoS) utilisé par Ethereum depuis The Merge sélectionne les validateurs selon leur mise en jeu (stake). Le PoS consomme 99.95% moins d'énergie que le PoW.",
      ],
      keyPoints: [
        "Registre distribué, décentralisé et immuable",
        "Hash cryptographique lie chaque bloc au précédent",
        "Réseau P2P : chaque nœud a une copie complète",
        "PoW (Bitcoin) vs PoS (Ethereum) : deux mécanismes de consensus",
      ],
      proTips: ["Utilisez Etherscan.io ou Blockchain.com pour explorer les transactions en temps réel — c'est le meilleur moyen de comprendre concrètement comment fonctionne la blockchain"],
      commonMistakes: ["Confondre blockchain et Bitcoin — Bitcoin est UNE application de la technologie blockchain, pas la blockchain elle-même"],
    },
    {
      title: "Bitcoin : L'Or Numérique",
      content: [
        "Bitcoin (BTC) a été créé en 2009 par le mystérieux Satoshi Nakamoto via un whitepaper de 9 pages. L'innovation fondamentale : une monnaie numérique décentralisée sans autorité centrale. L'offre est limitée à 21 millions d'unités — une rareté programmée mathématiquement. Environ 19.6 millions sont déjà minés, et on estime que 3 à 4 millions sont perdus à jamais (clés privées perdues).",
        "Le halving est l'événement le plus important du cycle Bitcoin. Il divise la récompense des mineurs par deux tous les ~210 000 blocs (~4 ans). 2012 : 50→25 BTC, 2016 : 25→12.5, 2020 : 12.5→6.25, 2024 : 6.25→3.125. Cette réduction progressive de l'offre nouvelle crée une pression déflationniste. Le dernier Bitcoin sera miné vers l'année 2140.",
        "Bitcoin est souvent comparé à l'or numérique en raison de ses propriétés : rareté programmée, résistance à la censure, portabilité instantanée, divisibilité extrême (1 BTC = 100 millions de satoshis), et vérifiabilité. Il représente environ 50-60% de la capitalisation totale du marché crypto.",
        "Le Lightning Network, une solution Layer 2, permet des transactions Bitcoin quasi-instantanées et à très faible coût. Les ETF Bitcoin spot, approuvés par la SEC en janvier 2024, ont marqué l'entrée officielle de Wall Street dans le marché crypto, attirant des milliards de dollars d'investissements institutionnels.",
      ],
      keyPoints: [
        "Offre strictement limitée à 21 millions de BTC",
        "Halving tous les ~4 ans réduit l'émission",
        "Store of value — l'or numérique du 21ème siècle",
        "ETF Bitcoin spot approuvés en janvier 2024",
      ],
      proTips: ["Le halving est historiquement suivi d'un bull market majeur 12-18 mois après — c'est le cycle le plus prévisible en crypto"],
      commonMistakes: ["Penser qu'il est 'trop tard' pour acheter du Bitcoin — vous pouvez acheter des fractions (satoshis) et le potentiel de croissance reste significatif"],
      example: "Un investissement DCA de 100$/mois dans Bitcoin depuis 2018 aurait généré un rendement supérieur à la majorité des actifs traditionnels.",
    },
    {
      title: "Ethereum et les Smart Contracts",
      content: [
        "Ethereum, lancé en 2015 par Vitalik Buterin (alors âgé de 21 ans), est bien plus qu'une cryptomonnaie — c'est une plateforme de calcul décentralisée. Sa principale innovation : les smart contracts, des programmes auto-exécutants déployés sur la blockchain qui s'exécutent exactement comme programmés, sans possibilité de censure ou d'interférence.",
        "Un smart contract s'exécute automatiquement quand des conditions prédéfinies sont remplies — comme un distributeur automatique numérique. L'EVM (Ethereum Virtual Machine) est l'environnement d'exécution universel. Les développeurs utilisent principalement Solidity pour programmer. Chaque opération sur Ethereum coûte du 'gas' payé en ETH, ce qui empêche le spam et rémunère les validateurs.",
        "Les smart contracts ont donné naissance à des innovations majeures : la DeFi (finance décentralisée) qui reproduit les services bancaires sans intermédiaire, les NFTs (tokens non-fongibles) qui représentent la propriété d'actifs numériques uniques, et les DAOs (organisations autonomes décentralisées) qui permettent une gouvernance collective transparente.",
        "The Merge (septembre 2022) a marqué le passage d'Ethereum du Proof of Work au Proof of Stake, réduisant sa consommation énergétique de 99.95%. Les solutions Layer 2 comme Arbitrum, Optimism et Base offrent des frais 10 à 100 fois moins élevés tout en héritant de la sécurité d'Ethereum.",
      ],
      keyPoints: [
        "Smart contracts = programmes auto-exécutants sur la blockchain",
        "DeFi, NFTs et DAOs : les 3 piliers de l'écosystème Ethereum",
        "The Merge (2022) : passage au PoS, -99.95% d'énergie",
        "Layer 2 (Arbitrum, Optimism, Base) pour la scalabilité",
      ],
      proTips: ["Utilisez les Layer 2 pour vos transactions quotidiennes — les frais sont 10-100x moins élevés qu'Ethereum mainnet"],
      commonMistakes: ["Envoyer des tokens sur le mauvais réseau (ex: envoyer de l'ETH Arbitrum à une adresse Ethereum mainnet) — vérifiez TOUJOURS le réseau avant d'envoyer"],
    },
    {
      title: "Altcoins, Tokens et Stablecoins",
      content: [
        "Les altcoins sont toutes les cryptomonnaies autres que Bitcoin. Les Layer 1 alternatives (Solana, Avalanche, Cardano, Cosmos, Polkadot) sont des blockchains indépendantes avec leurs propres compromis entre décentralisation, sécurité et scalabilité — le fameux trilemme de la blockchain.",
        "Les tokens sont créés sur une blockchain existante via des standards : ERC-20 sur Ethereum pour les tokens fongibles, ERC-721 pour les NFTs, ERC-1155 pour les tokens multi-types. Contrairement aux coins natifs (BTC, ETH), les tokens n'ont pas leur propre blockchain.",
        "Les stablecoins sont indexés sur le dollar américain et sont essentiels pour le trading et la DeFi. USDT (Tether, ~110 milliards$) est le plus utilisé mais controversé pour son manque de transparence. USDC (Circle, ~30 milliards$) est plus transparent avec des audits réguliers. DAI (MakerDAO) est décentralisé et collatéralisé par des cryptos.",
        "Les meme coins (DOGE, SHIB, PEPE) sont extrêmement spéculatifs avec un potentiel de gains explosifs mais un risque de perte totale. Les utility tokens (LINK pour les oracles, FIL pour le stockage) ont une utilité technique réelle. Les governance tokens (UNI, AAVE) donnent un droit de vote sur les décisions du protocole. Vérifiez toujours le market cap ET le FDV (Fully Diluted Valuation) avant d'investir.",
      ],
      keyPoints: [
        "Layer 1 alternatives : blockchains indépendantes avec différents compromis",
        "Stablecoins : USDT (le plus utilisé), USDC (transparent), DAI (décentralisé)",
        "Meme coins = hautement spéculatifs, max 1-5% du portefeuille",
        "Toujours vérifier market cap ET FDV avant d'investir",
      ],
      proTips: ["Diversifiez intelligemment : BTC 50-60%, ETH 20-30%, altcoins sélectionnés 10-20% — ne mettez jamais tout dans un seul actif"],
      commonMistakes: ["Investir massivement dans les altcoins en bear market — la majorité perdent 80-95% de leur valeur et beaucoup ne reviennent jamais"],
    },
  ],
  quiz: [
    { question: "Quel mécanisme de consensus utilise Bitcoin ?", options: ["Proof of Stake", "Proof of Work", "Delegated PoS", "Proof of Authority"], correct: 1 },
    { question: "Combien de Bitcoin seront créés au maximum ?", options: ["100 millions", "21 millions", "18 millions", "Illimité"], correct: 1 },
    { question: "Qu'est-ce qu'un smart contract ?", options: ["Un contrat papier numérisé", "Un programme auto-exécutant sur la blockchain", "Un accord entre mineurs", "Un type de wallet"], correct: 1 },
    { question: "Quel est le stablecoin le plus utilisé par volume ?", options: ["USDC", "DAI", "USDT", "BUSD"], correct: 2 },
  ],
};

const m1l2: Lesson = {
  id: "m1-l2",
  title: "Les Exchanges et Types d'Ordres",
  icon: "🏦",
  duration: "50 min",
  description: "Choisir un exchange, maîtriser les ordres Market, Limit, Stop Loss, Take Profit et OCO.",
  subLessons: [
    {
      title: "CEX vs DEX : Choisir sa Plateforme",
      content: [
        "Les exchanges centralisés (CEX) comme Binance, Coinbase et Kraken offrent une interface intuitive, une liquidité élevée, des outils de trading avancés et un support client. Ils fonctionnent comme des courtiers traditionnels : vous déposez vos fonds et ils gèrent la custody. Mais rappelez-vous : 'Not your keys, not your coins'.",
        "L'effondrement de FTX en novembre 2022 (32 milliards$ évaporés) a brutalement rappelé les risques de la custody centralisée. Les fonds des clients ont été détournés sans leur consentement. C'est pourquoi il ne faut JAMAIS laisser plus que nécessaire sur un exchange centralisé.",
        "Les exchanges décentralisés (DEX) comme Uniswap, Jupiter et PancakeSwap fonctionnent via des smart contracts sur la blockchain. Vous gardez le contrôle total de vos fonds via votre wallet. Les AMM (Automated Market Makers) remplacent le carnet d'ordres traditionnel par des pools de liquidité algorithmiques.",
        "Critères de choix d'un exchange : frais de trading (maker 0.02-0.1%, taker 0.04-0.1%), liquidité disponible, mesures de sécurité (2FA, cold storage, proof of reserves), paires de trading disponibles, et juridiction réglementaire. Diversifiez vos fonds entre plusieurs plateformes.",
      ],
      keyPoints: [
        "CEX : liquidité élevée et interface intuitive mais custody centralisée",
        "DEX : self-custody totale via smart contracts et wallet personnel",
        "Ne JAMAIS laisser plus que le nécessaire pour le trading actif sur un CEX",
        "Diversifier ses fonds entre plusieurs plateformes",
      ],
      proTips: [
        "Utilisez un hardware wallet (Ledger, Trezor) pour stocker vos cryptos long terme",
        "Activez TOUJOURS le 2FA avec une app (Google Authenticator), jamais par SMS",
      ],
      commonMistakes: ["Laisser 100% de son capital sur un seul exchange — l'histoire de FTX peut se répéter"],
    },
    {
      title: "Ordres Market et Limit",
      content: [
        "L'ordre Market s'exécute immédiatement au meilleur prix disponible dans le carnet d'ordres. Avantage principal : exécution garantie et instantanée. Inconvénients : risque de slippage (écart entre le prix attendu et le prix réel) surtout sur les actifs peu liquides, et frais taker plus élevés.",
        "L'ordre Limit vous permet de spécifier le prix exact auquel vous souhaitez acheter ou vendre. Un Buy Limit est placé en dessous du prix actuel (vous attendez que le prix baisse). Un Sell Limit est placé au-dessus (vous attendez que le prix monte). Les frais maker sont 50-80% moins chers que les frais taker.",
        "L'ordre Limit est l'ordre préféré des traders expérimentés car il offre un meilleur contrôle sur le prix d'exécution et des frais réduits. L'inconvénient : l'exécution n'est pas garantie — si le prix n'atteint jamais votre niveau, l'ordre ne sera pas rempli.",
        "En pratique, utilisez les ordres Market uniquement en situation d'urgence (sortir d'une position qui va contre vous rapidement). Pour toutes les entrées planifiées, utilisez des ordres Limit placés aux niveaux techniques identifiés lors de votre analyse.",
      ],
      keyPoints: [
        "Market : exécution immédiate mais risque de slippage",
        "Limit : prix spécifié, frais maker réduits de 50-80%",
        "Buy Limit < prix actuel, Sell Limit > prix actuel",
        "Limit pour les entrées planifiées, Market pour les urgences",
      ],
      proTips: ["Utilisez TOUJOURS des ordres Limit pour vos entrées — vous économiserez des centaines de dollars en frais sur le long terme"],
      commonMistakes: ["Utiliser des ordres Market par impatience — le slippage et les frais supplémentaires s'accumulent rapidement"],
    },
    {
      title: "Stop Loss, Take Profit et Ordres Avancés",
      content: [
        "Le Stop Loss (SL) ferme automatiquement votre position quand le prix atteint un niveau prédéfini pour limiter les pertes. RÈGLE ABSOLUE : ne JAMAIS trader sans Stop Loss. C'est votre assurance contre les pertes catastrophiques. Placez-le AVANT d'entrer en position.",
        "Le Take Profit (TP) sécurise vos gains automatiquement quand le prix atteint votre objectif. Utilisez des TP partiels : vendez 33% à TP1, 33% à TP2, et laissez 34% courir avec un trailing stop. Cette approche sécurise des profits tout en capturant les mouvements prolongés.",
        "L'OCO (One Cancels Other) combine un ordre Limit et un ordre Stop — le premier exécuté annule automatiquement l'autre. Idéal pour placer simultanément votre TP et votre SL. Le Trailing Stop suit le prix à une distance fixe et protège vos profits en tendance.",
        "Le Stop Limit combine un trigger (stop) et un prix limite. Quand le prix atteint le trigger, un ordre Limit est placé. Avantage : pas de slippage. Risque : si le prix passe trop vite, l'ordre Limit peut ne pas être rempli. Pour les SL critiques, préférez le Stop Market.",
      ],
      keyPoints: [
        "Stop Loss : OBLIGATOIRE sur chaque trade, placé AVANT l'entrée",
        "Take Profit partiels : 33%/33%/34% pour optimiser les gains",
        "OCO : TP + SL combinés, le premier annule l'autre",
        "Trailing Stop : suit le prix et protège les profits en tendance",
      ],
      proTips: ["Placez votre SL et TP AVANT d'entrer en position — une fois en trade, les émotions prennent le dessus"],
      commonMistakes: ["Ne pas mettre de Stop Loss — c'est la première cause de pertes catastrophiques chez les traders débutants"],
      example: "Achat BTC à 95 000$. SL à 92 500$ (-2.6%). TP1 à 99 000$ (50% de la position), TP2 à 103 000$ (30%), Trailing Stop 3% sur les 20% restants.",
    },
  ],
  quiz: [
    { question: "Différence principale entre CEX et DEX ?", options: ["Les frais de trading", "La custody des fonds", "La vitesse d'exécution", "Le nombre de paires"], correct: 1 },
    { question: "Un Buy Limit est placé :", options: ["Au-dessus du prix actuel", "En dessous du prix actuel", "Au prix actuel exactement", "N'importe où"], correct: 1 },
    { question: "Pourquoi utiliser un Stop Loss ?", options: ["Augmenter les profits", "Limiter les pertes automatiquement", "Payer moins de frais", "Acheter plus bas"], correct: 1 },
    { question: "Un ordre OCO combine :", options: ["Deux ordres Market", "Un Limit et un Stop", "Deux Stop Loss", "Un Market et un Limit"], correct: 1 },
  ],
};

const m1l3: Lesson = {
  id: "m1-l3",
  title: "Lire un Graphique de Prix",
  icon: "📊",
  duration: "55 min",
  description: "Chandeliers japonais, patterns essentiels, timeframes et volume.",
  subLessons: [
    {
      title: "Les Chandeliers Japonais",
      content: [
        "Les chandeliers japonais, inventés au 18ème siècle par le trader de riz Munehisa Homma, fournissent 4 informations essentielles par période : Open (ouverture), High (plus haut), Low (plus bas), Close (clôture) — OHLC. Le corps du chandelier représente la différence entre l'ouverture et la clôture.",
        "Un corps vert (ou blanc) indique un chandelier haussier : la clôture est supérieure à l'ouverture — les acheteurs ont dominé la période. Un corps rouge (ou noir) indique un chandelier baissier : la clôture est inférieure à l'ouverture — les vendeurs ont dominé.",
        "Les mèches (ou ombres) montrent les extrêmes atteints pendant la période. Une longue mèche inférieure signale un rejet des prix bas — les acheteurs ont repoussé le prix. Une longue mèche supérieure signale un rejet des prix hauts — les vendeurs ont repoussé le prix.",
        "La taille du corps indique la force du mouvement : grand corps = mouvement décisif et fort. Petit corps avec longues mèches = indécision, le marché hésite. Analysez TOUJOURS les chandeliers dans leur contexte : tendance générale, volume d'échange, et niveau de prix (support/résistance).",
      ],
      keyPoints: [
        "OHLC : 4 informations essentielles par chandelier",
        "Corps vert = haussier (clôture > ouverture), rouge = baissier",
        "Longue mèche = rejet de prix dans cette direction",
        "Le contexte (tendance + volume + niveau) est roi",
      ],
      proTips: ["Concentrez-vous sur les chandeliers qui se forment aux niveaux clés (supports/résistances) — ce sont les plus significatifs"],
      commonMistakes: ["Prendre des décisions basées sur un seul chandelier isolé sans considérer le contexte global"],
    },
    {
      title: "Patterns de Chandeliers Essentiels",
      content: [
        "Le Doji : ouverture ≈ clôture, formant une croix. Il signale l'indécision entre acheteurs et vendeurs. Après une tendance forte, un Doji peut annoncer un retournement. Variantes : Doji libellule (longue mèche basse, haussier), Doji pierre tombale (longue mèche haute, baissier).",
        "Le Hammer (Marteau) : petit corps en haut du chandelier, longue mèche inférieure (au moins 2x le corps), peu ou pas de mèche supérieure. En bas d'une tendance baissière, c'est un signal haussier puissant — les vendeurs ont poussé le prix bas mais les acheteurs ont repris le contrôle.",
        "Le Bullish Engulfing (Avalement haussier) : un grand chandelier vert avale complètement le corps du chandelier rouge précédent. Plus le 2ème chandelier est grand par rapport au 1er, plus le signal est fort. C'est l'un des patterns de retournement les plus fiables.",
        "Le Morning Star (Étoile du matin) : pattern en 3 chandeliers. (1) Grand rouge, (2) petit corps (gap), (3) grand vert qui remonte au-dessus du milieu du 1er. Signal de retournement haussier très fiable. L'Evening Star est son miroir baissier. TOUJOURS confirmer avec le volume et les niveaux clés.",
      ],
      keyPoints: [
        "Doji = indécision, potentiel retournement après une tendance",
        "Hammer = signal haussier en bas de tendance baissière",
        "Engulfing = retournement fort (le 2ème avale le 1er)",
        "Morning/Evening Star = retournement fiable en 3 chandeliers",
      ],
      proTips: ["Les patterns sur le daily sont 3-5x plus fiables que sur les petits timeframes — privilégiez la qualité à la quantité"],
      commonMistakes: ["Voir des patterns partout — ne tradez que les patterns clairs et bien formés aux niveaux significatifs"],
    },
    {
      title: "Timeframes et Analyse Multi-Temporelle",
      content: [
        "Chaque timeframe raconte une histoire différente du marché. Scalping : 1m-5m. Day Trading : 15m-1h. Swing Trading : 4h-1D. Position Trading : 1D-1W. Le choix du timeframe dépend de votre style de trading et du temps que vous pouvez y consacrer.",
        "L'analyse top-down est fondamentale : commencez TOUJOURS par le timeframe supérieur pour identifier la tendance majeure, puis descendez pour affiner votre entrée. Weekly → Daily → 4h → 1h. Ne tradez JAMAIS contre la tendance du timeframe supérieur — c'est une recette pour perdre.",
        "Plus le timeframe est élevé, plus le signal est fiable mais moins il y a d'opportunités. Un support identifié sur le weekly est 10x plus significatif qu'un support sur le 15 minutes. Les faux signaux sont beaucoup plus fréquents sur les petits timeframes.",
        "Règle des 3 timeframes : (1) Timeframe de tendance (ex: daily) pour identifier la direction, (2) Timeframe de signal (ex: 4h) pour repérer le setup, (3) Timeframe d'entrée (ex: 1h) pour le timing précis. Cette approche systématique maximise la probabilité de succès.",
      ],
      keyPoints: [
        "Top-down obligatoire : weekly → daily → 4h → 1h",
        "Ne JAMAIS trader contre la tendance du TF supérieur",
        "Plus le TF est élevé, plus le signal est fiable",
        "Règle des 3 TF : tendance, signal, entrée",
      ],
      proTips: ["Commencez chaque dimanche par analyser le weekly pour avoir la vue d'ensemble de la semaine à venir"],
      commonMistakes: ["Trader uniquement sur un seul timeframe — vous manquez le contexte essentiel de la tendance de fond"],
    },
    {
      title: "Le Volume : L'Indicateur le Plus Sous-Estimé",
      content: [
        "Le volume est le nombre d'unités échangées pendant une période donnée. C'est l'indicateur le plus sous-estimé par les débutants. Le prix montre OÙ le marché va, le volume montre AVEC QUELLE CONVICTION. Un mouvement sans volume est comme un feu sans oxygène — il s'éteindra.",
        "Volume élevé + mouvement de prix = mouvement fiable et durable. Volume faible + mouvement de prix = mouvement suspect, potentiel faux breakout. Les breakouts accompagnés d'un volume 2-3x supérieur à la moyenne sont les plus fiables.",
        "L'OBV (On-Balance Volume) cumule le volume : +volume les jours haussiers, -volume les jours baissiers. Si l'OBV monte alors que le prix stagne = accumulation (le smart money achète discrètement). Si l'OBV baisse alors que le prix monte = distribution (le smart money vend).",
        "Les pics de volume aux extrêmes de prix signalent souvent des retournements : volume record en bas = capitulation (les derniers vendeurs abandonnent), volume record en haut = euphorie (les derniers acheteurs entrent). Le volume diminue généralement dans les consolidations et explose lors des breakouts.",
      ],
      keyPoints: [
        "Volume élevé = mouvement fiable, volume faible = suspect",
        "Breakout + volume 2-3x la moyenne = signal très fiable",
        "OBV divergent du prix = accumulation ou distribution",
        "Pics de volume aux extrêmes = potentiel retournement",
      ],
      proTips: ["Ajoutez le volume à TOUS vos graphiques sans exception — c'est non négociable pour une analyse complète"],
      commonMistakes: ["Ignorer le volume et trader des breakouts sans confirmation — vous manquez 50% de l'information disponible"],
      exercise: "Pendant une semaine, notez le volume à chaque mouvement significatif de BTC. Comparez les mouvements à fort volume vs faible volume. Lequel tient mieux dans le temps ?",
    },
  ],
  quiz: [
    { question: "Une longue mèche inférieure signifie :", options: ["Les vendeurs dominent", "Rejet des prix bas (pression acheteuse)", "Indécision totale", "Volume faible"], correct: 1 },
    { question: "Pour le swing trading, quels timeframes ?", options: ["1m et 5m", "4h et 1D", "1W et 1M", "Tick chart"], correct: 1 },
    { question: "Un Bullish Engulfing est :", options: ["Un chandelier rouge qui englobe un vert", "Un chandelier vert qui englobe un rouge", "Deux dojis consécutifs", "Un gap haussier"], correct: 1 },
    { question: "Un breakout fiable est accompagné de :", options: ["Volume faible", "Volume 2-3x supérieur à la moyenne", "Pas de volume particulier", "Volume décroissant"], correct: 1 },
  ],
};

const m1l4: Lesson = {
  id: "m1-l4",
  title: "Wallets, Sécurité et Custody",
  icon: "🔐",
  duration: "40 min",
  description: "Protéger vos cryptomonnaies : wallets, seed phrases, 2FA et bonnes pratiques.",
  subLessons: [
    {
      title: "Types de Wallets",
      content: [
        "Un wallet crypto ne stocke pas vos cryptomonnaies — il stocke vos clés privées qui prouvent votre propriété sur la blockchain. La clé privée est comme le mot de passe ultime de votre coffre-fort numérique. Quiconque possède votre clé privée contrôle vos fonds.",
        "Les hot wallets (connectés à Internet) incluent les wallets mobiles (Trust Wallet, Phantom), les extensions navigateur (MetaMask, Rabby) et les wallets web. Ils sont pratiques pour l'usage quotidien et le trading actif, mais plus vulnérables aux attaques en ligne.",
        "Les cold wallets (Ledger Nano, Trezor) stockent vos clés privées sur un appareil physique déconnecté d'Internet. Même si votre ordinateur est compromis par un malware, vos fonds restent en sécurité. C'est indispensable pour tout montant que vous ne pouvez pas vous permettre de perdre.",
        "Chaque blockchain a ses wallets compatibles : MetaMask pour Ethereum et les chaînes EVM, Phantom pour Solana, Keplr pour Cosmos. Certains wallets multi-chaînes (Trust Wallet, Exodus) supportent plusieurs blockchains mais avec parfois moins de fonctionnalités spécifiques à chaque chaîne.",
      ],
      keyPoints: [
        "Le wallet stocke vos clés privées, pas vos cryptos",
        "Hot wallet = connecté, pratique mais plus vulnérable",
        "Cold wallet = hors ligne, sécurité maximale",
        "Chaque blockchain a ses wallets compatibles",
      ],
      proTips: ["Utilisez un Ledger ou Trezor pour tout montant supérieur à 1 000$ — c'est un investissement de 70-150$ qui peut sauver des milliers"],
      commonMistakes: ["Utiliser un seul wallet pour tout — séparez vos wallets : un pour le trading actif, un pour la DeFi, un pour le stockage long terme"],
    },
    {
      title: "Seed Phrase : Votre Clé Maîtresse",
      content: [
        "La seed phrase (phrase de récupération) est une séquence de 12 ou 24 mots générée lors de la création du wallet. Elle est la clé maîtresse de TOUS vos fonds. Avec cette phrase, n'importe qui peut recréer votre wallet et accéder à vos cryptos depuis n'importe quel appareil dans le monde.",
        "Règles ABSOLUES : (1) Notez-la sur papier ou gravez-la sur métal, JAMAIS numériquement. (2) Ne la photographiez JAMAIS. (3) Ne la stockez JAMAIS dans le cloud, un email, un fichier texte ou une note sur votre téléphone. (4) Ne la partagez avec PERSONNE — aucun support client légitime ne vous la demandera jamais.",
        "Stockage recommandé : gravez votre seed phrase sur une plaque métallique (Cryptosteel, Billfodl) résistante au feu et à l'eau. Stockez-la dans un coffre-fort ou un lieu sûr connu de vous seul. Pour une sécurité maximale, considérez de diviser la phrase en 2-3 parties stockées dans des lieux différents.",
        "Si vous perdez votre seed phrase ET votre appareil, vos fonds sont perdus à JAMAIS. Il n'existe aucun 'service client', aucun 'mot de passe oublié', aucun recours possible. On estime que 20% de tous les Bitcoin en circulation (soit ~3.7 millions de BTC) sont perdus à jamais à cause de clés privées perdues.",
      ],
      keyPoints: [
        "Seed phrase = clé maîtresse de TOUS vos fonds",
        "JAMAIS numériquement — papier ou métal uniquement",
        "JAMAIS la partager — aucun support légitime ne la demandera",
        "Perdue = fonds perdus à jamais, sans aucun recours",
      ],
      proTips: ["Investissez dans une plaque métallique (Cryptosteel, Billfodl) — le papier peut brûler ou se mouiller, le métal survit"],
      commonMistakes: ["Stocker la seed phrase dans un fichier sur le cloud ou prendre une photo avec son téléphone — c'est la méthode #1 de vol de cryptos"],
    },
    {
      title: "Sécurité Avancée et Bonnes Pratiques",
      content: [
        "Le 2FA (Two-Factor Authentication) ajoute une couche de sécurité essentielle. Utilisez Google Authenticator ou Authy — JAMAIS le SMS qui est vulnérable au SIM swapping. Le SIM swap est une attaque où le pirate convainc votre opérateur téléphonique de transférer votre numéro sur sa carte SIM.",
        "Le phishing est la menace #1 en crypto : faux sites web identiques aux vrais, faux emails d'exchanges, faux comptes de support sur Telegram et Discord. Vérifiez TOUJOURS l'URL dans la barre d'adresse. Bookmarkez tous vos sites crypto importants. Ne cliquez JAMAIS sur des liens dans les emails ou messages directs.",
        "Utilisez un email dédié uniquement au crypto, différent de votre email personnel et professionnel. Activez le 2FA sur cet email aussi. Utilisez un gestionnaire de mots de passe (Bitwarden, 1Password) avec des mots de passe uniques et complexes pour chaque plateforme.",
        "Bonnes pratiques avancées : (1) Utilisez un VPN pour masquer votre IP. (2) Ne parlez JAMAIS publiquement de vos holdings crypto. (3) Méfiez-vous des 'airdrops gratuits' — 99% sont des scams. (4) Vérifiez et révoquez régulièrement les approbations de smart contracts sur revoke.cash. (5) Mettez à jour le firmware de votre hardware wallet.",
      ],
      keyPoints: [
        "2FA avec une app (pas SMS) — protection contre le SIM swap",
        "Phishing = menace #1 — vérifiez TOUJOURS l'URL",
        "Email dédié crypto + mots de passe uniques partout",
        "Ne JAMAIS parler publiquement de ses holdings",
      ],
      proTips: ["Bookmarkez tous vos exchanges et protocoles DeFi — ne passez JAMAIS par une recherche Google pour y accéder"],
      commonMistakes: ["Utiliser le même mot de passe partout et cliquer sur des liens 'airdrop' dans les DMs Telegram/Discord"],
      exercise: "Audit de sécurité complet : (1) Activez le 2FA sur tous vos comptes crypto. (2) Vérifiez vos approbations sur revoke.cash. (3) Créez un email dédié crypto. (4) Bookmarkez tous vos sites crypto.",
    },
  ],
  quiz: [
    { question: "Quel type de wallet est le plus sécurisé ?", options: ["Hot wallet mobile", "Extension navigateur", "Cold wallet (hardware)", "Wallet web"], correct: 2 },
    { question: "Où stocker sa seed phrase ?", options: ["Dans un email sécurisé", "Sur le cloud chiffré", "Sur papier ou métal dans un lieu sûr", "Dans une photo sur le téléphone"], correct: 2 },
    { question: "Quel type de 2FA est le plus sécurisé ?", options: ["SMS", "Email", "Google Authenticator / Authy", "Pas de 2FA"], correct: 2 },
    { question: "La menace #1 en crypto est :", options: ["Les hackers de blockchain", "Le phishing", "Les bugs de smart contracts", "Les régulations gouvernementales"], correct: 1 },
  ],
};

const m1l5: Lesson = {
  id: "m1-l5",
  title: "Les Différents Types de Cryptomonnaies",
  icon: "🪙",
  duration: "45 min",
  description: "Layer 1, Layer 2, DeFi tokens, Meme coins, Stablecoins — comprendre l'écosystème.",
  subLessons: [
    {
      title: "Layer 1 : Les Blockchains Fondamentales",
      content: [
        "Les Layer 1 sont des blockchains indépendantes avec leur propre mécanisme de consensus, leur propre sécurité et leur propre token natif. Bitcoin (BTC) est le premier et le plus décentralisé — optimisé pour être une réserve de valeur immuable. Ethereum (ETH) est la plateforme de smart contracts dominante avec le plus grand écosystème de développeurs.",
        "Solana (SOL) privilégie la performance avec des milliers de TPS et des frais quasi-nuls, mais des pannes récurrentes soulèvent des questions sur la fiabilité et la décentralisation. Avalanche (AVAX) propose des sous-réseaux personnalisables pour les entreprises. Cardano (ADA) adopte une approche académique avec des publications peer-reviewed.",
        "Le trilemme de la blockchain stipule qu'il est impossible d'optimiser simultanément la décentralisation, la sécurité et la scalabilité. Bitcoin et Ethereum privilégient la décentralisation et la sécurité. Solana privilégie la scalabilité au détriment partiel de la décentralisation. Chaque L1 fait des compromis différents.",
        "Cosmos (ATOM) et Polkadot (DOT) sont des écosystèmes de blockchains interconnectées. Cosmos via l'IBC (Inter-Blockchain Communication) permet à des chaînes souveraines de communiquer. Polkadot utilise des parachains qui partagent la sécurité de la relay chain centrale.",
      ],
      keyPoints: [
        "Bitcoin = réserve de valeur, Ethereum = smart contracts dominants",
        "Solana = performance, Avalanche = sous-réseaux, Cardano = académique",
        "Trilemme : décentralisation vs sécurité vs scalabilité",
        "Cosmos et Polkadot = interopérabilité entre blockchains",
      ],
      proTips: ["Investissez dans les L1 avec le plus grand écosystème de développeurs — c'est le meilleur indicateur de succès à long terme"],
      commonMistakes: ["Investir dans un L1 uniquement à cause du nombre de TPS annoncé — la décentralisation et la sécurité comptent davantage"],
    },
    {
      title: "Layer 2 : Solutions de Scalabilité",
      content: [
        "Les Layer 2 sont des solutions construites au-dessus d'un Layer 1 pour améliorer sa scalabilité tout en héritant de sa sécurité. Elles traitent les transactions hors chaîne principale et soumettent les résultats au L1, réduisant les frais de 10 à 100 fois.",
        "Les Optimistic Rollups (Arbitrum, Optimism, Base) regroupent des centaines de transactions en un seul lot soumis au L1. Ils supposent que les transactions sont valides par défaut et utilisent un système de 'fraud proofs' pour contester les transactions frauduleuses (délai de 7 jours pour les retraits vers le L1).",
        "Les ZK-Rollups (zkSync, StarkNet, Scroll) utilisent des preuves cryptographiques à connaissance zéro pour prouver mathématiquement la validité des transactions. Plus rapides pour les retraits (pas de délai de contestation) mais plus complexes techniquement et plus coûteux en calcul.",
        "Base (développé par Coinbase) est devenu l'un des L2 les plus populaires grâce à son intégration avec Coinbase et son écosystème DeFi dynamique. Les L2 sont essentiels pour l'adoption massive — sans eux, les frais Ethereum seraient prohibitifs pour la plupart des utilisateurs.",
      ],
      keyPoints: [
        "L2 = scalabilité + sécurité héritée du L1",
        "Optimistic Rollups : fraud proofs, délai 7 jours pour les retraits",
        "ZK-Rollups : preuves cryptographiques, pas de délai",
        "Base, Arbitrum, Optimism = L2 les plus populaires",
      ],
      proTips: ["Utilisez les L2 pour toutes vos transactions DeFi quotidiennes — les frais sont 10-100x moins élevés qu'Ethereum mainnet"],
      commonMistakes: ["Confondre L1 et L2 — un L2 dépend de son L1 pour la sécurité finale"],
    },
    {
      title: "DeFi Tokens, Stablecoins et Meme Coins",
      content: [
        "Les tokens DeFi donnent accès à la gouvernance et parfois aux revenus des protocoles de finance décentralisée. UNI (Uniswap) permet de voter sur les paramètres du plus grand DEX. AAVE permet de gouverner le protocole de prêt leader. CRV (Curve) combine gouvernance et boost de rendement via le verrouillage (veCRV).",
        "Les stablecoins sont indexés sur le dollar et sont le pilier du trading crypto. USDT (Tether, ~110B$) est le plus utilisé mais controversé pour son manque de transparence. USDC (Circle, ~30B$) est plus transparent avec des audits réguliers. DAI (MakerDAO) est décentralisé et collatéralisé par des cryptos. L'effondrement de UST/LUNA en 2022 (40B$ évaporés) a montré les risques des stablecoins algorithmiques.",
        "Les meme coins (DOGE, SHIB, PEPE, WIF, BONK) sont des tokens à forte composante communautaire et spéculative. Potentiel de gains explosifs (x10-x1000) mais risque de perte totale. La majorité des meme coins perdent 95-99% de leur valeur après le hype initial.",
        "Stratégie meme coins : (1) Allocation maximale 1-5% du portefeuille total. (2) Entrer tôt avant le hype mainstream. (3) Prendre des profits agressivement (50% à x2, 25% à x5, laisser courir le reste). (4) Vérifier la liquidité et la distribution des holders. (5) Si le fondateur détient >20% des tokens, c'est un red flag majeur.",
      ],
      keyPoints: [
        "DeFi tokens = gouvernance + revenus des protocoles",
        "USDT le plus utilisé, USDC le plus transparent, DAI décentralisé",
        "Meme coins = spéculatifs, max 1-5% du portefeuille",
        "Prendre des profits agressivement sur les meme coins",
      ],
      proTips: ["Gardez toujours une réserve en stablecoins (10-20% du portefeuille) pour acheter les dips et saisir les opportunités"],
      commonMistakes: ["Mettre une part significative du portefeuille dans les meme coins — la majorité perdent 95%+ de leur valeur"],
      exercise: "Classez 15 cryptos du top 50 par catégorie (L1, L2, DeFi, Stablecoin, Meme, Utility). Comparez leur market cap, FDV et utilité réelle.",
    },
  ],
  quiz: [
    { question: "Le trilemme de la blockchain concerne :", options: ["Prix, volume et liquidité", "Décentralisation, sécurité et scalabilité", "Frais, vitesse et adoption", "Mining, staking et farming"], correct: 1 },
    { question: "Un ZK-Rollup utilise :", options: ["Des fraud proofs avec délai 7 jours", "Des preuves cryptographiques à connaissance zéro", "Le Proof of Work", "Des sidechains indépendantes"], correct: 1 },
    { question: "Quel stablecoin est décentralisé ?", options: ["USDT", "USDC", "DAI", "BUSD"], correct: 2 },
    { question: "Allocation maximale recommandée pour les meme coins :", options: ["50% du portefeuille", "25% du portefeuille", "1-5% du portefeuille", "0% — ne jamais en acheter"], correct: 2 },
  ],
};

export const module1Lessons: Lesson[] = [m1l1, m1l2, m1l3, m1l4, m1l5];