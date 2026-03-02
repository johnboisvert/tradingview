import { BookOpen, Shield, Brain, Zap, BarChart3, Globe, Target, Flame } from "lucide-react";

export interface SubLesson {
  title: string;
  content: string[];
  keyPoints: string[];
  proTips?: string[];
  commonMistakes?: string[];
  example?: string;
  exercise?: string;
}

export interface Lesson {
  id: string;
  title: string;
  icon: string;
  duration: string;
  description: string;
  subLessons: SubLesson[];
  quiz: { question: string; options: string[]; correct: number }[];
}

export interface Module {
  id: string;
  title: string;
  icon: React.ReactNode;
  level: "Débutant" | "Intermédiaire" | "Avancé" | "Expert";
  color: string;
  description: string;
  lessons: Lesson[];
}

export const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Débutant": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  "Intermédiaire": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  "Avancé": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  "Expert": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
};

const m1l1: Lesson = {
  id: "m1-l1", title: "Blockchain, Bitcoin & Cryptomonnaies", icon: "🔗", duration: "45 min",
  description: "Comprendre la technologie blockchain, Bitcoin, Ethereum et l'écosystème crypto.",
  subLessons: [
    {
      title: "Qu'est-ce que la Blockchain ?",
      content: [
        "La blockchain est un registre distribué, décentralisé et immuable qui enregistre les transactions de manière transparente et sécurisée. Imaginez un grand livre comptable dont chaque page (bloc) est liée à la précédente par un sceau cryptographique impossible à falsifier.",
        "Chaque bloc contient un hash cryptographique du bloc précédent, un horodatage, et les données de transaction. Si vous modifiez un seul caractère, le hash change complètement, invalidant tous les blocs suivants.",
        "La blockchain fonctionne sur un réseau peer-to-peer (P2P). Pour modifier une transaction, il faudrait pirater plus de 50% des nœuds — pratiquement impossible sur Bitcoin (15 000+ nœuds).",
        "Le Proof of Work (PoW) utilisé par Bitcoin demande aux mineurs de résoudre des puzzles mathématiques. Le Proof of Stake (PoS) utilisé par Ethereum sélectionne les validateurs selon leur mise en jeu. Le PoS consomme 99.95% moins d'énergie.",
      ],
      keyPoints: ["Registre distribué, décentralisé et immuable", "Hash cryptographique lie chaque bloc", "PoW (Bitcoin) vs PoS (Ethereum)", "Blockchain publique vs privée"],
      proTips: ["Utilisez Etherscan ou Blockchain.com pour vérifier les transactions en temps réel"],
      commonMistakes: ["Confondre blockchain et Bitcoin — Bitcoin est UNE application de la blockchain"],
    },
    {
      title: "Bitcoin : L'Or Numérique",
      content: [
        "Bitcoin (BTC) a été créé en 2009 par Satoshi Nakamoto. L'offre est limitée à 21 millions d'unités — rareté programmée. Environ 19.6M sont minés, 3-4M perdus à jamais.",
        "Le halving divise la récompense des mineurs par deux tous les ~4 ans. 2012: 50→25 BTC, 2016: 25→12.5, 2020: 12.5→6.25, 2024: 6.25→3.125. Le dernier BTC sera miné vers 2140.",
        "Bitcoin est comparé à l'or : rareté, résistance à la censure, portabilité, divisibilité (1 BTC = 100M satoshis). Il représente 50-60% de la capitalisation crypto totale.",
        "Le Lightning Network permet des transactions quasi-instantanées. Les ETF Bitcoin spot approuvés en janvier 2024 ont marqué l'entrée de Wall Street dans le marché.",
      ],
      keyPoints: ["Offre limitée à 21 millions BTC", "Halving tous les ~4 ans", "Store of value — l'or numérique", "ETF Bitcoin spot approuvés en 2024"],
      proTips: ["Le halving est historiquement suivi d'un bull market 12-18 mois après"],
      commonMistakes: ["Penser qu'il est 'trop tard' — vous pouvez acheter des fractions (satoshis)"],
      example: "DCA de 100$ à chaque halving aurait été extrêmement rentable historiquement.",
    },
    {
      title: "Ethereum et les Smart Contracts",
      content: [
        "Ethereum, lancé en 2015 par Vitalik Buterin, est une plateforme de calcul décentralisée. Sa principale innovation : les smart contracts, des programmes auto-exécutants sur la blockchain.",
        "Un smart contract s'exécute automatiquement quand des conditions sont remplies. L'EVM (Ethereum Virtual Machine) est l'environnement d'exécution. Les développeurs utilisent Solidity. Chaque opération coûte du 'gas' en ETH.",
        "Les smart contracts ont créé la DeFi (finance décentralisée), les NFTs (actifs numériques uniques), et les DAOs (organisations décentralisées).",
        "The Merge (sept. 2022) : passage PoW → PoS, -99.95% énergie. Les Layer 2 (Arbitrum, Optimism, Base) offrent des frais 10-100x moins élevés.",
      ],
      keyPoints: ["Smart contracts = programmes auto-exécutants", "DeFi, NFTs, DAOs sur Ethereum", "The Merge : PoW → PoS", "Layer 2 pour la scalabilité"],
      proTips: ["Utilisez les Layer 2 pour des frais réduits"],
      commonMistakes: ["Envoyer des tokens sur le mauvais réseau — vérifiez TOUJOURS"],
    },
    {
      title: "Altcoins, Tokens et Stablecoins",
      content: [
        "Les altcoins sont toutes les cryptos autres que Bitcoin. Les Layer 1 (Solana, Avalanche, Cardano) sont des blockchains indépendantes avec différents compromis entre décentralisation, sécurité et scalabilité.",
        "Les tokens sont créés sur une blockchain existante : ERC-20 (fongibles), ERC-721 (NFTs), ERC-1155 (multi-tokens).",
        "Les stablecoins sont indexés sur le dollar : USDT (~110B$), USDC (~30B$, plus transparent), DAI (décentralisé). Essentiels pour le trading et la DeFi.",
        "Les meme coins (DOGE, SHIB, PEPE) sont très spéculatifs. Les utility tokens (LINK, FIL) ont une utilité réelle. Les governance tokens (UNI, AAVE) donnent un droit de vote.",
      ],
      keyPoints: ["Layer 1 : blockchains indépendantes", "Stablecoins : USDT, USDC, DAI", "Meme coins = spéculatifs", "Vérifier market cap ET FDV"],
      proTips: ["Diversifiez : BTC 50-60%, ETH 20-30%, altcoins 10-20%"],
      commonMistakes: ["La majorité des altcoins perdent 90%+ en bear market"],
    },
  ],
  quiz: [
    { question: "Quel mécanisme de consensus utilise Bitcoin ?", options: ["Proof of Stake", "Proof of Work", "Delegated PoS", "Proof of Authority"], correct: 1 },
    { question: "Combien de Bitcoin seront créés au maximum ?", options: ["100 millions", "21 millions", "18 millions", "Illimité"], correct: 1 },
    { question: "Qu'est-ce qu'un smart contract ?", options: ["Un contrat papier numérisé", "Un programme auto-exécutant sur la blockchain", "Un accord entre mineurs", "Un type de wallet"], correct: 1 },
    { question: "Quel est le stablecoin le plus utilisé ?", options: ["USDC", "DAI", "USDT", "BUSD"], correct: 2 },
  ],
};

const m1l2: Lesson = {
  id: "m1-l2", title: "Les Exchanges et Types d'Ordres", icon: "🏦", duration: "50 min",
  description: "Choisir un exchange, maîtriser les ordres Market, Limit, Stop Loss, Take Profit et OCO.",
  subLessons: [
    {
      title: "CEX vs DEX : Choisir sa Plateforme",
      content: [
        "Les CEX (Binance, Coinbase, Kraken) offrent une interface intuitive, une liquidité élevée et des outils avancés. Mais 'Not your keys, not your coins' — FTX (2022) a montré le risque de custody centralisée.",
        "Les DEX (Uniswap, Jupiter, PancakeSwap) fonctionnent via smart contracts. Vous gardez le contrôle total de vos fonds. Les AMM remplacent le carnet d'ordres par des pools de liquidité.",
        "Critères de choix : frais (maker 0.02-0.1%), liquidité, sécurité (2FA, cold storage), paires disponibles, juridiction. Ne laissez JAMAIS plus que nécessaire sur un CEX.",
      ],
      keyPoints: ["CEX : liquidité élevée mais custody centralisée", "DEX : self-custody via smart contracts", "Ne jamais laisser plus que nécessaire sur un CEX"],
      proTips: ["Utilisez un hardware wallet (Ledger, Trezor) pour le long terme", "Activez TOUJOURS le 2FA"],
      commonMistakes: ["Laisser tout son capital sur un seul exchange"],
    },
    {
      title: "Ordres Market, Limit et Avancés",
      content: [
        "L'ordre Market s'exécute immédiatement au meilleur prix disponible. Avantage : exécution garantie. Inconvénient : slippage possible, frais taker plus élevés.",
        "L'ordre Limit spécifie le prix exact. Buy Limit < prix actuel, Sell Limit > prix actuel. Frais maker 50-80% moins chers. C'est l'ordre préféré des traders expérimentés.",
        "Le Stop Loss ferme automatiquement votre position pour limiter les pertes. RÈGLE ABSOLUE : ne JAMAIS trader sans SL. Le Take Profit sécurise les gains automatiquement.",
        "L'OCO (One Cancels Other) combine un limit et un stop — le premier exécuté annule l'autre. Le Trailing Stop suit le prix et protège les profits en tendance.",
      ],
      keyPoints: ["Market : exécution immédiate, risque de slippage", "Limit : prix spécifié, frais réduits", "Stop Loss : TOUJOURS l'utiliser", "OCO et Trailing Stop pour la gestion avancée"],
      proTips: ["Utilisez TOUJOURS des ordres limit sauf en urgence absolue"],
      commonMistakes: ["Ne pas mettre de stop loss — première cause de pertes catastrophiques"],
      example: "Achat BTC à 95 000$. SL à 92 500$. TP1 à 99 000$ (50%), TP2 à 103 000$ (30%), Trailing 3% (20%).",
    },
  ],
  quiz: [
    { question: "Différence principale CEX vs DEX ?", options: ["Les frais", "La custody des fonds", "La vitesse", "Le nombre de paires"], correct: 1 },
    { question: "Un Buy Limit est placé :", options: ["Au-dessus du prix", "En dessous du prix", "Au prix actuel", "N'importe où"], correct: 1 },
    { question: "Pourquoi utiliser un Stop Loss ?", options: ["Augmenter les profits", "Limiter les pertes", "Payer moins de frais", "Acheter plus bas"], correct: 1 },
  ],
};

const m1l3: Lesson = {
  id: "m1-l3", title: "Lire un Graphique de Prix", icon: "📊", duration: "55 min",
  description: "Chandeliers japonais, patterns, timeframes, volume — la base de l'analyse technique.",
  subLessons: [
    {
      title: "Les Chandeliers Japonais",
      content: [
        "Les chandeliers fournissent 4 informations : Open, High, Low, Close (OHLC). Corps vert = haussier (clôture > ouverture). Corps rouge = baissier.",
        "Les mèches montrent les extrêmes. Longue mèche inférieure = rejet des prix bas (pression acheteuse). Longue mèche supérieure = rejet des prix hauts.",
        "Grand corps = mouvement fort. Petit corps + longues mèches = indécision. Toujours analyser dans le contexte (tendance + volume + niveau de prix).",
      ],
      keyPoints: ["OHLC : 4 infos par chandelier", "Corps vert = haussier, rouge = baissier", "Longue mèche = rejet de prix", "Contexte est roi"],
      proTips: ["Concentrez-vous sur les chandeliers aux niveaux clés (S/R)"],
      commonMistakes: ["Trader sur un seul chandelier sans contexte"],
    },
    {
      title: "Patterns de Chandeliers Essentiels",
      content: [
        "Doji : ouverture ≈ clôture, indécision. Après une tendance forte, potentiel retournement. Variantes : libellule (haussier), pierre tombale (baissier).",
        "Hammer : petit corps en haut, longue mèche inférieure. En bas de tendance baissière = signal haussier. Engulfing : le 2ème chandelier avale le 1er = signal de retournement fort.",
        "Morning Star (3 chandeliers, retournement haussier) et Evening Star (retournement baissier) sont parmi les plus fiables. TOUJOURS confirmer avec volume + niveau + indicateurs.",
      ],
      keyPoints: ["Doji = indécision", "Hammer = signal haussier en bas de tendance", "Engulfing = retournement fort", "Confirmer avec volume et indicateurs"],
      proTips: ["Les patterns sur le daily sont 3-5x plus fiables que sur les petits TF"],
      commonMistakes: ["Voir des patterns partout — ne tradez que les patterns clairs"],
    },
    {
      title: "Timeframes et Volume",
      content: [
        "Scalping : 1m-5m. Day Trading : 15m-1h. Swing : 4h-1D. Position : 1D-1W. Analysez TOUJOURS du TF supérieur vers l'inférieur (top-down).",
        "Ne tradez JAMAIS contre la tendance du timeframe supérieur. Plus le TF est élevé, plus le signal est fiable. Les faux signaux sont fréquents sur les petits TF.",
        "Le volume confirme les mouvements. Volume élevé = mouvement fiable. Volume faible = suspect. L'OBV qui monte alors que le prix stagne = accumulation (smart money achète).",
      ],
      keyPoints: ["Top-down : weekly → daily → 4h → 1h", "Ne pas trader contre la tendance du TF supérieur", "Volume élevé = mouvement fiable", "OBV pour détecter l'accumulation/distribution"],
      proTips: ["Ajoutez le volume à TOUS vos graphiques"],
      commonMistakes: ["Ignorer le volume — vous manquez 50% de l'information"],
    },
  ],
  quiz: [
    { question: "Longue mèche inférieure signifie :", options: ["Vendeurs dominent", "Rejet des prix bas", "Indécision", "Volume faible"], correct: 1 },
    { question: "Pour le swing trading :", options: ["1m et 5m", "4h et 1D", "1W et 1M", "Tick chart"], correct: 1 },
    { question: "Un Bullish Engulfing est :", options: ["Rouge englobe vert", "Vert englobe rouge", "Deux dojis", "Un gap"], correct: 1 },
  ],
};

const m2l1: Lesson = {
  id: "m2-l1", title: "Supports, Résistances et Fibonacci", icon: "📏", duration: "45 min",
  description: "Niveaux clés, lignes de tendance et retracements de Fibonacci.",
  subLessons: [
    {
      title: "Supports et Résistances",
      content: [
        "Support = plancher (demande forte). Résistance = plafond (offre forte). Plus un niveau est testé sans être cassé, plus il est significatif.",
        "Quand un support est cassé, il devient résistance (flip). Le prix revient souvent tester le niveau cassé (retest). Les niveaux psychologiques (chiffres ronds) sont des S/R naturels.",
        "Les meilleurs S/R : testés 3+ fois, volume élevé, timeframes élevés, confluence (S/R + Fib + EMA). Les S/R sont des ZONES, pas des lignes exactes.",
      ],
      keyPoints: ["Support = plancher, Résistance = plafond", "Flip : support cassé → résistance", "Confluence = niveaux les plus forts", "S/R sont des ZONES"],
      proTips: ["Marquez vos S/R sur le weekly et daily en premier"],
      commonMistakes: ["Tracer trop de lignes — gardez 3-5 niveaux max"],
    },
    {
      title: "Fibonacci Retracement",
      content: [
        "Niveaux clés : 23.6%, 38.2%, 50%, 61.8% (golden ratio), 78.6%. Tracez du swing low au swing high en tendance haussière.",
        "38.2% = tendance forte, 61.8% = tendance correcte. Au-delà de 78.6%, la tendance est remise en question. La 'golden pocket' (61.8%-65%) est la zone de rebond la plus probable.",
        "Les extensions (161.8%, 261.8%) servent d'objectifs de prix. La confluence Fibonacci + S/R + EMA = setup de haute qualité.",
      ],
      keyPoints: ["Golden ratio = 61.8%", "38.2% = tendance forte", "Extensions pour les objectifs", "Confluence = haute probabilité"],
      proTips: ["Utilisez Fibonacci sur les timeframes élevés pour les niveaux les plus fiables"],
      commonMistakes: ["Utiliser Fibonacci comme seul outil — c'est un outil de CONFLUENCE"],
      example: "BTC de 80k$ à 100k$. Retracement 61.8% = 87 640$. Si rebond, objectif extension 161.8% = 112 360$.",
    },
  ],
  quiz: [
    { question: "Support cassé devient :", options: ["Support plus fort", "Résistance", "Invisible", "Gap"], correct: 1 },
    { question: "Golden ratio de Fibonacci :", options: ["23.6%", "50%", "61.8%", "78.6%"], correct: 2 },
  ],
};

const m2l2: Lesson = {
  id: "m2-l2", title: "Indicateurs Techniques Essentiels", icon: "📈", duration: "60 min",
  description: "RSI, MACD, Bollinger Bands, EMA/SMA — les outils indispensables.",
  subLessons: [
    {
      title: "RSI (Relative Strength Index)",
      content: [
        "Le RSI mesure le momentum sur une échelle 0-100 (période 14). RSI > 70 = surachat, < 30 = survente. En tendance forte, le RSI peut rester en zone extrême longtemps.",
        "Les divergences sont les signaux les plus puissants. Divergence baissière : prix fait un nouveau sommet mais RSI fait un sommet plus bas → retournement. Divergence haussière : inverse.",
        "Le RSI sert aussi de S/R dynamique. En bull, il rebondit sur 40-50. En bear, il bute sur 50-60. RSI 7 pour le scalping, RSI 21 pour le swing.",
      ],
      keyPoints: ["> 70 surachat, < 30 survente", "Divergences = signaux les plus puissants", "RSI comme S/R dynamique"],
      proTips: ["En bull market, achetez quand le RSI daily revient à 40-45"],
      commonMistakes: ["Vendre uniquement parce que RSI > 70 en bull market"],
    },
    {
      title: "MACD et Bollinger Bands",
      content: [
        "MACD = EMA 12 - EMA 26, Signal = EMA 9 du MACD. Croisement MACD/Signal = signal d'achat/vente. L'histogramme montre la force du momentum.",
        "Bollinger Bands : SMA 20 ± 2 écarts-types. Squeeze (bandes resserrées) = faible volatilité → explosion imminente. Le prix tend à revenir vers la bande médiane (mean reversion).",
        "Le MACD est retardé — utilisez-le pour CONFIRMER. Le Bollinger Squeeze sur le daily est un signal très fiable.",
      ],
      keyPoints: ["MACD : croisement = signal", "Bollinger Squeeze = explosion imminente", "Mean reversion vers la SMA 20"],
      proTips: ["Le Bollinger Squeeze sur le daily est un signal très fiable"],
      commonMistakes: ["Shorter quand le prix touche la bande supérieure en tendance haussière"],
    },
    {
      title: "Moyennes Mobiles et Golden Cross",
      content: [
        "EMA réagit plus vite que SMA. EMA 200 = tendance majeure (au-dessus = bull, en dessous = bear). EMA 21 = sweet spot pour le swing trading.",
        "Golden Cross : EMA 50 croise EMA 200 par le haut → signal haussier majeur. Death Cross : inverse → signal baissier. Lents mais très fiables sur le daily.",
        "Les EMA servent de S/R dynamiques. En tendance haussière, le prix rebondit sur l'EMA 21 (court terme) ou l'EMA 50 (pullback plus profond).",
      ],
      keyPoints: ["EMA 200 = tendance majeure", "Golden Cross = signal haussier", "EMA comme S/R dynamique"],
      proTips: ["L'EMA 21 daily est le sweet spot pour le swing trading"],
      commonMistakes: ["Utiliser trop de moyennes mobiles — 3 suffisent (21, 50, 200)"],
    },
  ],
  quiz: [
    { question: "RSI > 70 indique :", options: ["Survente", "Surachat", "Neutre", "Volume élevé"], correct: 1 },
    { question: "Bollinger Squeeze signifie :", options: ["Prix va baisser", "Forte volatilité", "Faible volatilité, explosion imminente", "Volume baisse"], correct: 2 },
    { question: "Golden Cross :", options: ["EMA 200 croise EMA 50", "EMA 50 croise EMA 200 par le haut", "RSI croise 50", "MACD croise 0"], correct: 1 },
  ],
};

const m3l1: Lesson = {
  id: "m3-l1", title: "Position Sizing & Risk/Reward", icon: "🛡️", duration: "45 min",
  description: "Calculez la taille de vos positions et optimisez votre ratio risque/récompense.",
  subLessons: [
    {
      title: "La Règle du 1-2%",
      content: [
        "Ne risquez JAMAIS plus de 1-2% de votre capital par trade. Avec 10 000$, max 100-200$ de perte par trade. 10 pertes à 2% = -18% (survivable) vs 10 pertes à 10% = -65% (catastrophique).",
        "Formule : Taille = (Capital × %risque) / Distance SL. Exemple : 10 000$ × 1% / 2 000$ de distance = 4 750$ de position.",
        "Le risque doit être fixe en % (pas en $) — s'adapte automatiquement. Débutants : commencez à 0.5%. Maximum 3-5 positions simultanées (corrélation crypto).",
      ],
      keyPoints: ["Maximum 1-2% par trade", "Formule : (Capital × %risque) / distance SL", "Risque fixe en %", "Max 3-5 positions simultanées"],
      proTips: ["Avant chaque trade : 'Si je perds, ça change ma journée ?' Si oui, position trop grosse"],
      commonMistakes: ["Risquer 5-10% 'parce que c'est sûr' — aucun trade n'est sûr"],
      example: "Capital 20k$, risque 1% = 200$. ETH à 3 200$, SL 3 100$ → Position = 200$/100$ = 2 ETH (6 400$).",
    },
    {
      title: "Risk/Reward Ratio",
      content: [
        "R:R de 1:2 = risquer 1$ pour gagner 2$. Avec 1:2, seulement 34% de win rate nécessaire. Le R:R est PLUS IMPORTANT que le win rate.",
        "Minimum 1:1.5, idéal 1:2 ou 1:3. Si le R:R n'est pas bon, NE PRENEZ PAS le trade. TP partiels : 33% à 1R, 33% à 2R, 33% trailing.",
        "Trader A : 60% win rate, R:R 1:0.8 → profit 800$/100 trades. Trader B : 35% win rate, R:R 1:3 → profit 4 000$/100 trades. B gagne 5x plus.",
      ],
      keyPoints: ["R:R minimum 1:1.5, idéal 1:2-1:3", "Plus important que le win rate", "TP partiels pour optimiser", "Si R:R insuffisant, pas de trade"],
      proTips: ["Calculez le R:R AVANT d'entrer — si < 1:1.5, passez"],
      commonMistakes: ["Entrer sans calculer le R:R — c'est du gambling"],
    },
  ],
  quiz: [
    { question: "Règle du 1% sur 20 000$ :", options: ["20$", "200$", "2 000$", "1 000$"], correct: 1 },
    { question: "R:R de 1:3 signifie :", options: ["Risquer 3$ pour 1$", "Risquer 1$ pour 3$", "3 trades gagnants/1 perdant", "3% de risque"], correct: 1 },
    { question: "Avec R:R 1:2, win rate minimum :", options: ["> 50%", "> 34%", "> 25%", "> 66%"], correct: 1 },
  ],
};

const m4l1: Lesson = {
  id: "m4-l1", title: "Émotions, Discipline et Journal", icon: "🧠", duration: "40 min",
  description: "Comprendre et maîtriser les émotions destructrices du trader.",
  subLessons: [
    {
      title: "FOMO, FUD et Biais Cognitifs",
      content: [
        "FOMO (Fear Of Missing Out) pousse à acheter au sommet. FUD (Fear, Uncertainty, Doubt) pousse à vendre au creux. Les deux sont destructeurs.",
        "Biais de confirmation : ne voir que ce qui confirme votre position. Aversion à la perte : la douleur d'une perte est 2.5x plus forte que le plaisir d'un gain. Surconfiance après des gains → grosse perte.",
        "Solutions : plan de trade AVANT d'entrer, SL/TP automatisés, taille de position fixe (1-2%), règle des 24h après une forte émotion.",
      ],
      keyPoints: ["FOMO = acheter au sommet", "FUD = vendre au creux", "Aversion à la perte 2.5x", "Plan + automatisation = solution"],
      proTips: ["Si vous ne pouvez pas expliquer votre raison d'entrée en 1 phrase, ne tradez pas"],
      commonMistakes: ["Trader sous l'influence des émotions — fermez votre plateforme"],
    },
    {
      title: "Le Journal de Trading",
      content: [
        "Le journal est l'outil d'amélioration #1. Notez chaque trade : date, actif, direction, entrée, SL, TP, taille, raison, résultat, émotion.",
        "Analysez chaque semaine et mois. Calculez : win rate, R:R moyen, profit factor, max drawdown. Identifiez vos forces et faiblesses.",
        "Le journal émotionnel est aussi important : notez votre état avant/pendant/après. Vos pires trades sont souvent pris dans un état émotionnel négatif.",
      ],
      keyPoints: ["Journal = outil #1", "Noter chaque trade + émotion", "Revue hebdomadaire + mensuelle", "Les pires trades = états émotionnels négatifs"],
      proTips: ["Prenez une capture d'écran de chaque trade"],
      exercise: "Créez votre journal aujourd'hui : Date, Actif, Long/Short, Entrée, SL, TP, Raison, Résultat, Émotion, Leçon.",
    },
    {
      title: "Discipline et Routine",
      content: [
        "Routine quotidienne : (1) Analyse macro 10 min. (2) Analyse technique 20 min. (3) Plan de la journée. (4) Exécution. (5) Revue 10 min.",
        "Règles : ne tradez que vos setups, respectez SL/TP, ne dépassez pas votre risque, après 3 pertes = stop pour la journée, pas de trading émotionnel.",
        "Le revenge trading (récupérer après une perte) est l'ennemi #1. La patience est rentable : 80% attente, 20% trading.",
      ],
      keyPoints: ["Discipline > intelligence", "Après 3 pertes = STOP", "Revenge trading = cercle vicieux", "80% attente, 20% trading"],
      proTips: ["Imprimez vos règles et collez-les à côté de votre écran"],
      commonMistakes: ["Trader par ennui — si pas de setup, pas de trade"],
    },
  ],
  quiz: [
    { question: "Le FOMO pousse à :", options: ["Vendre trop tôt", "Acheter au sommet", "Attendre", "Analyser"], correct: 1 },
    { question: "Après 3 pertes consécutives :", options: ["Doubler la taille", "Arrêter pour la journée", "Changer de stratégie", "TF plus petit"], correct: 1 },
    { question: "Le journal sert à :", options: ["Calculer les impôts", "Identifier vos patterns", "Impressionner", "Suivre le prix BTC"], correct: 1 },
  ],
};

const m5l1: Lesson = {
  id: "m5-l1", title: "Scalping, Day & Swing Trading", icon: "⚡", duration: "50 min",
  description: "Les 3 styles de trading les plus populaires en détail.",
  subLessons: [
    {
      title: "Le Scalping",
      content: [
        "Profits de 0.1-0.5% par trade, 10-50 trades/jour. Timeframes 1m-5m. Nécessite : connexion rapide, frais très bas (maker < 0.02%), forte liquidité, discipline extrême. PAS pour les débutants.",
        "Stratégies : order flow (absorption des murs) et micro-niveaux (S/R sur le 5m avec rejet + volume spike). SL serré 0.2-0.3%, TP rapide 0.3-0.5%.",
        "Le plus stressant. Les frais s'accumulent : 50 trades × 0.04% = 2%/jour. Beaucoup de scalpers perdent à cause des frais et du stress.",
      ],
      keyPoints: ["0.1-0.5% par trade, 10-50 trades/jour", "Frais bas obligatoires", "PAS pour les débutants", "Les frais s'accumulent rapidement"],
      commonMistakes: ["Scalper des altcoins à faible liquidité — le slippage mange les profits"],
    },
    {
      title: "Le Swing Trading : Le Style Optimal",
      content: [
        "Capture les swings sur plusieurs jours à semaines. Timeframes 4h et 1D. Compatible avec un emploi (30-60 min/jour). 5-15 trades/mois, win rate 40-50%, R:R 1:2-1:3.",
        "Stratégie #1 — Pullback : tendance weekly haussière → pullback daily vers EMA 21/Fib 38-61% → confirmation 4h (chandelier retournement + volume) → entrée.",
        "Stratégie #2 — Breakout : consolidation daily → cassure avec volume 2x+ → retest du niveau cassé → entrée. Gestion : TP partiels 33%/33%/33%, SL au breakeven après 1R.",
      ],
      keyPoints: ["Compatible avec un emploi", "Pullback et Breakout : 2 stratégies", "5-15 trades/mois", "La patience est la clé"],
      proTips: ["Le dimanche soir, analysez le weekly et identifiez 3-5 setups pour la semaine"],
      exercise: "Chaque dimanche pendant 4 semaines, analysez BTC et ETH. Identifiez les zones de pullback. Notez les résultats.",
    },
    {
      title: "Position Trading et DCA",
      content: [
        "Position trading : semaines à mois, basé sur les tendances majeures et cycles. Le DCA (Dollar Cost Averaging) : montant fixe à intervalles réguliers, élimine le stress du timing.",
        "DCA intelligent : investissez plus en survente (RSI < 30, MVRV < 1), moins en surachat. Améliore significativement le prix d'achat moyen.",
        "Avantages : très peu de temps (1-2h/semaine), frais minimaux, capture les mouvements majeurs (100-500%+). Le DCA sur BTC/ETH sur 4+ ans a battu 95% des traders actifs.",
      ],
      keyPoints: ["DCA : montant fixe, intervalles réguliers", "DCA intelligent : plus en survente, moins en surachat", "1-2h/semaine suffit", "Historiquement très rentable sur 4+ ans"],
      proTips: ["N'arrêtez JAMAIS le DCA en bear market — c'est le meilleur moment"],
      commonMistakes: ["Arrêter le DCA par peur en bear market"],
    },
  ],
  quiz: [
    { question: "Le scalping utilise :", options: ["1D et 1W", "4h et 1D", "1m et 5m", "1h et 4h"], correct: 2 },
    { question: "Le swing trading est idéal pour :", options: ["Full-time uniquement", "Traders avec un emploi", "Robots", "Débutants absolus"], correct: 1 },
    { question: "Le DCA consiste à :", options: ["Tout investir d'un coup", "Montant fixe à intervalles réguliers", "Acheter uniquement en baisse", "Vendre à chaque hausse"], correct: 1 },
  ],
};

const m6l1: Lesson = {
  id: "m6-l1", title: "On-Chain, DeFi & Tokenomics", icon: "⛓️", duration: "45 min",
  description: "Données blockchain, finance décentralisée et évaluation de projets.",
  subLessons: [
    {
      title: "Métriques On-Chain",
      content: [
        "L'on-chain analyse QUI achète, QUI vend, et COMBIEN — pas juste le prix. MVRV > 3.5 = euphorie (vendre), < 1 = capitulation (acheter). NUPL > 0.75 = sommet, < 0 = creux historique.",
        "Exchange inflows = pression vendeuse. Exchange outflows = accumulation long terme. La baisse continue des réserves d'exchange = signal haussier structurel.",
        "Active Addresses reflètent l'activité du réseau. Whale watching : suivez les gros portefeuilles (>1000 BTC) sur Whale Alert, Glassnode, CryptoQuant.",
      ],
      keyPoints: ["MVRV et NUPL : indicateurs de cycle", "Exchange flows : accumulation vs distribution", "Whale watching pour anticiper les mouvements"],
      proTips: ["Les métriques on-chain sont plus utiles pour le position trading"],
    },
    {
      title: "DeFi : Finance Décentralisée",
      content: [
        "La DeFi reproduit les services financiers via smart contracts : DEX (Uniswap), lending (Aave), yield farming. TVL > 100 milliards$.",
        "Le Yield Farming : fournir de la liquidité en échange de récompenses (10-100%+ APY). Risques : impermanent loss, smart contract risk, rug pulls.",
        "L'Impermanent Loss : si le prix d'un token change significativement dans une paire de liquidité, vous subissez une perte par rapport à simplement détenir. Règle : n'investissez que ce que vous pouvez perdre.",
      ],
      keyPoints: ["DEX, Lending, Yield Farming : 3 piliers", "Yield Farming : rendements élevés mais risques", "Impermanent Loss : risque principal du LP"],
      proTips: ["Commencez par les protocoles établis (Aave, Uniswap) avant les nouveaux"],
      commonMistakes: ["Chasser les APY de 1000% — souvent des rug pulls"],
    },
    {
      title: "Tokenomics : Évaluer un Projet",
      content: [
        "Tokenomics = économie du token : offre, distribution, utilité, mécanismes d'incitation. Circulating Supply vs Total Supply — si 10% en circulation et 90% à débloquer, attention à la pression vendeuse.",
        "Le vesting schedule définit quand les tokens des fondateurs/investisseurs sont débloqués. Un cliff de 1 an + vesting de 3 ans est standard. Méfiez-vous des unlocks massifs imminents.",
        "Red flags : >50% pour l'équipe, pas de vesting, pas d'utilité claire, inflation élevée sans burn, FDV 10x+ le market cap.",
      ],
      keyPoints: ["Circulating vs Total Supply", "Vesting schedule crucial", "Utilité : governance, staking, frais", "Red flags à surveiller"],
      proTips: ["Vérifiez le vesting sur token.unlocks.app avant d'investir"],
      exercise: "Choisissez 3 projets. Trouvez : Total Supply, Circulating Supply, vesting, utilité, mécanismes de burn. Lequel a la meilleure tokenomics ?",
    },
  ],
  quiz: [
    { question: "MVRV > 3.5 indique :", options: ["Capitulation", "Euphorie", "Neutre", "Faible volume"], correct: 1 },
    { question: "Sorties massives de BTC des exchanges :", options: ["Pression vendeuse", "Accumulation long terme", "Panique", "Liquidations"], correct: 1 },
    { question: "L'Impermanent Loss affecte :", options: ["Holders de BTC", "Fournisseurs de liquidité", "Stakers", "Mineurs"], correct: 1 },
  ],
};

const m7l1: Lesson = {
  id: "m7-l1", title: "Futures Perpétuels & Leverage", icon: "🔥", duration: "50 min",
  description: "Comprendre et survivre au trading à effet de levier.",
  subLessons: [
    {
      title: "Les Contrats Futures Perpétuels",
      content: [
        "Les futures perpétuels permettent de trader avec levier, d'aller long (hausse) ou short (baisse), sans date d'expiration. Volume quotidien supérieur au spot.",
        "Levier 10x : 1% de mouvement = 10% sur votre capital. 10% contre vous = liquidation totale. Le funding rate (toutes les 8h) maintient le prix proche du spot.",
        "Funding extrêmement positif (>0.1%) = trop de longs → risque de correction. Funding négatif = trop de shorts → risque de short squeeze. MAXIMUM 3-5x de levier — 95% des traders >10x perdent tout.",
      ],
      keyPoints: ["Long/Short avec levier, sans expiration", "Levier 10x : 1% = 10%", "Funding rate : indicateur de sentiment", "MAXIMUM 3-5x — JAMAIS plus"],
      proTips: ["Commencez avec 2x maximum pendant vos 50 premiers trades futures"],
      commonMistakes: ["Levier 20x+ = façon la plus rapide de tout perdre"],
    },
    {
      title: "Liquidations et Gestion du Levier",
      content: [
        "Liquidation = perte TOTALE de la marge. Levier 10x → liquidation à -10%, 20x → -5%, 100x → -1%. Utilisez TOUJOURS isolated margin (protège le reste du compte).",
        "Les cascades de liquidations créent un effet domino : les liquidations forcées font baisser le prix, liquidant d'autres positions. Crashs flash de 10-20% en minutes.",
        "Survie : (1) Max 3-5x. (2) Isolated margin. (3) SL OBLIGATOIRE bien avant la liquidation. (4) Risque 1-2% par trade. (5) Uniquement BTC/ETH. (6) Éviter les annonces macro.",
      ],
      keyPoints: ["Liquidation = perte TOTALE", "Isolated margin TOUJOURS", "SL bien avant le prix de liquidation", "Cascade de liquidations = effet domino"],
      proTips: ["SL à minimum 50% de la distance entrée-liquidation"],
      commonMistakes: ["Cross margin — une position peut vider tout votre compte", "Pas de SL en futures — suicidaire avec du levier"],
      example: "Long BTC 95k$, levier 5x, isolated. Liquidation ≈ 76k$. SL à 92k$ (-3.2%, perte = 316$). SL bien au-dessus de la liquidation.",
    },
  ],
  quiz: [
    { question: "Levier 20x, quel mouvement liquide ?", options: ["20%", "10%", "5%", "2%"], correct: 2 },
    { question: "Funding très positif signale :", options: ["Trop de shorts", "Trop de longs (risque correction)", "Neutre", "Faible liquidité"], correct: 1 },
    { question: "En futures, utilisez :", options: ["Cross margin", "Isolated margin", "Pas de marge", "Levier max"], correct: 1 },
  ],
};

const m8l1: Lesson = {
  id: "m8-l1", title: "Cycles du Marché & Macro-Économie", icon: "🔄", duration: "45 min",
  description: "Halving, taux d'intérêt, inflation, DXY et cycles de sentiment.",
  subLessons: [
    {
      title: "Le Cycle du Bitcoin Halving",
      content: [
        "Halving tous les ~4 ans : 2012 (50→25), 2016 (25→12.5), 2020 (12.5→6.25), 2024 (6.25→3.125). ATH historiquement 12-18 mois après.",
        "4 phases : (1) Accumulation (bear bottom, smart money achète). (2) Markup (hausse progressive). (3) Distribution (euphorie, ATH, smart money vend). (4) Markdown (crash, capitulation).",
        "Rendements décroissants (1000x, 20x, 3.5x). Les ETF changent la dynamique. Stratégie : accumuler en bear (MVRV < 1), prendre des profits en euphorie (MVRV > 3).",
      ],
      keyPoints: ["ATH 12-18 mois après halving", "4 phases du cycle", "Rendements décroissants", "Accumuler en bear, distribuer en bull"],
      proTips: ["Quand votre chauffeur Uber parle de Bitcoin = signal de distribution"],
    },
    {
      title: "Impact de la Macro-Économie",
      content: [
        "Taux FED bas → liquidité → hausse crypto. Taux élevés → baisse crypto. L'inflation (CPI) influence les décisions de la FED. Le marché réagit aux SURPRISES.",
        "DXY (Dollar Index) inversement corrélé au BTC. DXY hausse = crypto baisse. NFP (emploi) : emploi fort = baissier, emploi faible = haussier.",
        "ETF Bitcoin spot (jan. 2024) = catalyseur majeur. Corrélation croissante BTC-Nasdaq depuis 2020. Ne tradez JAMAIS avec levier pendant les annonces FED/CPI/NFP.",
      ],
      keyPoints: ["Taux FED = facteur macro #1", "DXY inversement corrélé au BTC", "ETF = catalyseur institutionnel", "Pas de levier pendant les annonces"],
      proTips: ["Consultez forexfactory.com chaque semaine pour les annonces"],
      commonMistakes: ["Ignorer la macro — en 2022, les taux FED ont causé -75% sur BTC"],
    },
    {
      title: "Altseason et Rotation des Capitaux",
      content: [
        "L'Altseason : les altcoins surperforment BTC, généralement en phase finale du bull market. Altcoin Season Index > 75 = confirmée (blockchaincenter.net).",
        "Rotation : BTC monte → ETH suit → Large caps → Mid caps → Small caps/meme coins → CRASH. BTC.D en baisse = altseason, en hausse = Bitcoin season.",
        "Stratégie : accumuler des altcoins AVANT l'altseason (BTC.D élevé), prendre des profits PENDANT, convertir en stablecoins AVANT la fin. Les altcoins perdent 80-95% en bear market.",
      ],
      keyPoints: ["Altseason = phase finale du bull", "Rotation BTC → ETH → Altcoins → Crash", "BTC.D en baisse = altseason", "Altcoins perdent 80-95% en bear"],
      proTips: ["Quand les meme coins font des x100 = signal de sortie, pas d'entrée"],
      commonMistakes: ["Acheter des altcoins PENDANT l'altseason au lieu de AVANT"],
      exercise: "Surveillez BTC.D et l'Altcoin Season Index pendant 4 semaines. Notez la corrélation avec les mouvements des altcoins.",
    },
  ],
  quiz: [
    { question: "ATH après halving historiquement :", options: ["1-3 mois", "6-12 mois", "12-18 mois", "24-36 mois"], correct: 2 },
    { question: "DXY en baisse :", options: ["Baissier crypto", "Haussier crypto", "Sans impact", "Baissier or"], correct: 1 },
    { question: "L'Altseason se produit :", options: ["Début du bull", "Bear market", "Phase finale du bull", "Pendant le halving"], correct: 2 },
    { question: "Pendant une annonce FED :", options: ["Levier 20x", "Éviter le levier", "Acheter immédiatement", "Shorter"], correct: 1 },
  ],
};

export const MODULES: Module[] = [
  {
    id: "m1", title: "Fondamentaux du Trading Crypto", icon: <BookOpen className="w-5 h-5" />,
    level: "Débutant", color: "from-emerald-500 to-green-600",
    description: "Maîtrisez les bases : blockchain, exchanges, ordres, chandeliers, volumes.",
    lessons: [m1l1, m1l2, m1l3],
  },
  {
    id: "m2", title: "Analyse Technique Complète", icon: <BarChart3 className="w-5 h-5" />,
    level: "Intermédiaire", color: "from-amber-500 to-orange-600",
    description: "Indicateurs techniques (RSI, MACD, Bollinger, EMA), supports/résistances, Fibonacci.",
    lessons: [m2l1, m2l2],
  },
  {
    id: "m3", title: "Gestion du Risque & Money Management", icon: <Shield className="w-5 h-5" />,
    level: "Intermédiaire", color: "from-blue-500 to-indigo-600",
    description: "Le pilier le plus important : position sizing, R:R, drawdown, diversification.",
    lessons: [m3l1],
  },
  {
    id: "m4", title: "Psychologie du Trading", icon: <Brain className="w-5 h-5" />,
    level: "Avancé", color: "from-purple-500 to-pink-600",
    description: "80% du trading est mental. FOMO, discipline, journal — maîtrisez votre esprit.",
    lessons: [m4l1],
  },
  {
    id: "m5", title: "Stratégies de Trading", icon: <Target className="w-5 h-5" />,
    level: "Avancé", color: "from-red-500 to-rose-600",
    description: "Scalping, Day Trading, Swing Trading, Position Trading — trouvez votre style.",
    lessons: [m5l1],
  },
  {
    id: "m6", title: "DeFi, On-Chain & Tokenomics", icon: <Globe className="w-5 h-5" />,
    level: "Avancé", color: "from-cyan-500 to-teal-600",
    description: "Analyse on-chain, DeFi, yield farming et évaluation de projets crypto.",
    lessons: [m6l1],
  },
  {
    id: "m7", title: "Futures, Leverage & Trading Algo", icon: <Zap className="w-5 h-5" />,
    level: "Expert", color: "from-violet-500 to-purple-700",
    description: "Trading à effet de levier, liquidations, funding rate et gestion avancée.",
    lessons: [m7l1],
  },
  {
    id: "m8", title: "Macro-Économie & Cycles Crypto", icon: <Flame className="w-5 h-5" />,
    level: "Expert", color: "from-orange-500 to-red-600",
    description: "Cycles du halving, impact FED/BCE, DXY, sentiment, altseason.",
    lessons: [m8l1],
  },
];