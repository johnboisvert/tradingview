import { useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, BookOpen, Award, TrendingUp, Shield, Brain, Zap, BarChart3, Globe, Layers, Target, Flame } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SubLesson {
  title: string;
  content: string[];
  keyPoints: string[];
  example?: string;
}

interface Lesson {
  id: string;
  title: string;
  icon: string;
  duration: string;
  description: string;
  subLessons: SubLesson[];
  quiz: { question: string; options: string[]; correct: number }[];
}

interface Module {
  id: string;
  title: string;
  icon: React.ReactNode;
  level: "Débutant" | "Intermédiaire" | "Avancé" | "Expert";
  color: string;
  description: string;
  lessons: Lesson[];
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Débutant": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  "Intermédiaire": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  "Avancé": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  "Expert": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
};

// ─── MODULES DATA ────────────────────────────────────────────────────────────
const MODULES: Module[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 1: FONDAMENTAUX
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "m1",
    title: "Fondamentaux du Trading Crypto",
    icon: <BookOpen className="w-5 h-5" />,
    level: "Débutant",
    color: "from-emerald-500 to-green-600",
    description: "Maîtrisez les bases essentielles du trading de cryptomonnaies. De la blockchain aux premiers ordres.",
    lessons: [
      {
        id: "m1-l1",
        title: "Introduction à la Blockchain & Crypto",
        icon: "🔗",
        duration: "30 min",
        description: "Comprendre la technologie blockchain et les cryptomonnaies.",
        subLessons: [
          {
            title: "Qu'est-ce que la Blockchain ?",
            content: [
              "La blockchain est un registre distribué, décentralisé et immuable qui enregistre les transactions de manière transparente. Chaque bloc contient un hash cryptographique du bloc précédent, un horodatage et les données de transaction.",
              "Contrairement aux systèmes centralisés (banques), la blockchain fonctionne sur un réseau peer-to-peer où chaque nœud possède une copie complète du registre. Cela élimine le besoin d'un intermédiaire de confiance.",
              "Les mécanismes de consensus (Proof of Work, Proof of Stake) garantissent que tous les nœuds s'accordent sur l'état du registre. Bitcoin utilise le PoW (minage), tandis qu'Ethereum est passé au PoS (staking) en septembre 2022.",
            ],
            keyPoints: ["Registre distribué et immuable", "Décentralisation = pas d'intermédiaire", "Consensus : PoW vs PoS", "Chaque bloc est lié au précédent par cryptographie"],
          },
          {
            title: "Bitcoin : La première cryptomonnaie",
            content: [
              "Bitcoin (BTC) a été créé en 2009 par Satoshi Nakamoto (pseudonyme). Le whitepaper 'Bitcoin: A Peer-to-Peer Electronic Cash System' décrit un système de paiement électronique sans tiers de confiance.",
              "L'offre totale de Bitcoin est limitée à 21 millions d'unités. Cette rareté programmée est assurée par le halving, qui réduit de moitié la récompense des mineurs tous les ~210 000 blocs (environ 4 ans). Le dernier halving a eu lieu en avril 2024.",
              "Bitcoin est souvent comparé à l'or numérique en raison de sa rareté et de sa résistance à la censure. Il représente environ 50-60% de la capitalisation totale du marché crypto.",
            ],
            keyPoints: ["Créé en 2009 par Satoshi Nakamoto", "Offre limitée à 21 millions BTC", "Halving tous les ~4 ans", "Store of value — or numérique"],
          },
          {
            title: "Ethereum et les Smart Contracts",
            content: [
              "Ethereum, lancé en 2015 par Vitalik Buterin, est une plateforme de smart contracts — des programmes auto-exécutants stockés sur la blockchain. Cela a ouvert la voie aux applications décentralisées (dApps).",
              "L'EVM (Ethereum Virtual Machine) permet d'exécuter du code Turing-complet sur la blockchain. Les développeurs utilisent Solidity pour écrire des smart contracts qui alimentent la DeFi, les NFTs, et les DAOs.",
              "Le passage au Proof of Stake (The Merge, septembre 2022) a réduit la consommation énergétique d'Ethereum de ~99.95%. Les validateurs stakent 32 ETH pour sécuriser le réseau.",
            ],
            keyPoints: ["Smart contracts = programmes auto-exécutants", "EVM et langage Solidity", "The Merge : passage au PoS", "Base de la DeFi, NFTs, DAOs"],
          },
          {
            title: "Altcoins, Tokens et Écosystèmes",
            content: [
              "Les altcoins sont toutes les cryptomonnaies autres que Bitcoin. On distingue les Layer 1 (Solana, Avalanche, Cardano), les Layer 2 (Arbitrum, Optimism, Base), et les tokens utilitaires.",
              "Les tokens ERC-20 sont des tokens fongibles sur Ethereum. Les ERC-721 sont des NFTs (non-fongibles). Chaque blockchain a ses propres standards : SPL (Solana), BEP-20 (BSC).",
              "Les stablecoins (USDT, USDC, DAI) sont indexés sur le dollar et servent de refuge et de moyen d'échange dans l'écosystème crypto. USDT domine avec plus de 100 milliards de capitalisation.",
            ],
            keyPoints: ["Layer 1 vs Layer 2", "Tokens ERC-20, ERC-721, SPL", "Stablecoins : USDT, USDC, DAI", "Chaque blockchain a son écosystème"],
          },
        ],
        quiz: [
          { question: "Quel mécanisme de consensus utilise Bitcoin ?", options: ["Proof of Stake", "Proof of Work", "Delegated PoS", "Proof of Authority"], correct: 1 },
          { question: "Combien de Bitcoin seront créés au maximum ?", options: ["100 millions", "21 millions", "18 millions", "Illimité"], correct: 1 },
          { question: "Qu'est-ce qu'un smart contract ?", options: ["Un contrat papier numérisé", "Un programme auto-exécutant sur la blockchain", "Un accord entre mineurs", "Un type de wallet"], correct: 1 },
        ],
      },
      {
        id: "m1-l2",
        title: "Les Exchanges et Types d'Ordres",
        icon: "🏦",
        duration: "35 min",
        description: "Choisir un exchange et maîtriser tous les types d'ordres.",
        subLessons: [
          {
            title: "Exchanges Centralisés (CEX) vs Décentralisés (DEX)",
            content: [
              "Les CEX (Binance, Coinbase, Kraken, Bybit) sont des plateformes centralisées qui gardent la custody de vos fonds. Ils offrent une liquidité élevée, une interface simple et des outils avancés (futures, margin).",
              "Les DEX (Uniswap, Jupiter, dYdX) fonctionnent via smart contracts — vous gardez le contrôle de vos clés privées. Les AMM (Automated Market Makers) remplacent le carnet d'ordres traditionnel par des pools de liquidité.",
              "Critères de choix : frais de trading (maker/taker), liquidité, sécurité (2FA, cold storage), paires disponibles, juridiction, et support client. Binance domine en volume, Coinbase en conformité réglementaire.",
            ],
            keyPoints: ["CEX : liquidité élevée, custody centralisée", "DEX : self-custody, smart contracts", "AMM vs Order Book", "Comparer frais, sécurité, liquidité"],
          },
          {
            title: "Ordre Market (au marché)",
            content: [
              "L'ordre market s'exécute immédiatement au meilleur prix disponible. C'est le type d'ordre le plus simple et le plus rapide. Vous payez des frais 'taker' (généralement 0.1% sur Binance).",
              "Avantage : exécution garantie et instantanée. Inconvénient : slippage possible sur les marchés peu liquides — le prix d'exécution peut différer du prix affiché.",
              "Utilisez les ordres market quand la vitesse d'exécution est plus importante que le prix exact. Idéal pour les positions urgentes ou les marchés très liquides (BTC/USDT).",
            ],
            keyPoints: ["Exécution immédiate au meilleur prix", "Frais taker (plus élevés)", "Risque de slippage", "Idéal pour exécution rapide"],
            example: "Vous voulez acheter BTC immédiatement à 95 000$. Ordre Market Buy → exécuté à ~95 000$ (± slippage).",
          },
          {
            title: "Ordre Limit (à cours limité)",
            content: [
              "L'ordre limit vous permet de spécifier le prix exact auquel vous souhaitez acheter ou vendre. Il ne s'exécute que si le marché atteint votre prix. Vous payez des frais 'maker' (souvent 0.02-0.06%).",
              "Buy Limit : placé EN DESSOUS du prix actuel. Vous attendez que le prix baisse pour acheter. Sell Limit : placé AU-DESSUS du prix actuel. Vous attendez que le prix monte pour vendre.",
              "Les ordres limit sont essentiels pour le trading discipliné. Ils vous permettent de planifier vos entrées et sorties à l'avance sans surveiller les graphiques en permanence.",
            ],
            keyPoints: ["Exécution au prix spécifié ou mieux", "Frais maker (moins élevés)", "Buy Limit < prix actuel", "Sell Limit > prix actuel"],
            example: "BTC est à 95 000$. Vous placez un Buy Limit à 90 000$. Si BTC descend à 90 000$, votre ordre s'exécute automatiquement.",
          },
          {
            title: "Stop Loss, Take Profit et Ordres Avancés",
            content: [
              "Le Stop Loss (SL) est un ordre qui se déclenche quand le prix atteint un niveau défini, limitant vos pertes. C'est l'outil de gestion du risque le plus important. TOUJOURS utiliser un stop loss.",
              "Le Take Profit (TP) est l'inverse : il ferme automatiquement votre position quand le prix atteint votre objectif de profit. Combiné au SL, il forme un plan de trade complet.",
              "Ordres avancés : OCO (One Cancels Other) combine un limit et un stop — le premier exécuté annule l'autre. Trailing Stop suit le prix à une distance fixe, protégeant les profits en tendance.",
              "Stop Limit vs Stop Market : le Stop Limit place un ordre limit une fois le trigger atteint (risque de non-exécution), le Stop Market s'exécute au marché (exécution garantie mais slippage possible).",
            ],
            keyPoints: ["Stop Loss : TOUJOURS l'utiliser", "Take Profit : sécuriser les gains", "OCO : limit + stop combinés", "Trailing Stop : suit la tendance"],
            example: "Achat BTC à 95 000$. SL à 92 000$ (-3.2%). TP à 102 000$ (+7.4%). Ratio Risk/Reward = 1:2.3.",
          },
        ],
        quiz: [
          { question: "Quelle est la différence principale entre un CEX et un DEX ?", options: ["Les frais", "La custody des fonds", "La vitesse", "Le nombre de paires"], correct: 1 },
          { question: "Un Buy Limit est placé :", options: ["Au-dessus du prix actuel", "En dessous du prix actuel", "Au prix actuel", "N'importe où"], correct: 1 },
          { question: "Pourquoi utiliser un Stop Loss ?", options: ["Pour augmenter les profits", "Pour limiter les pertes", "Pour payer moins de frais", "Pour acheter plus bas"], correct: 1 },
        ],
      },
      {
        id: "m1-l3",
        title: "Lire un Graphique de Prix",
        icon: "📊",
        duration: "40 min",
        description: "Maîtrisez la lecture des chandeliers japonais et des graphiques.",
        subLessons: [
          {
            title: "Les Chandeliers Japonais (Candlesticks)",
            content: [
              "Chaque chandelier représente 4 informations : le prix d'ouverture (Open), le plus haut (High), le plus bas (Low) et la clôture (Close) — OHLC. Le corps du chandelier montre la différence entre l'ouverture et la clôture.",
              "Chandelier vert/haussier : la clôture est supérieure à l'ouverture (les acheteurs dominent). Chandelier rouge/baissier : la clôture est inférieure à l'ouverture (les vendeurs dominent).",
              "Les mèches (wicks/shadows) montrent les extrêmes de prix atteints pendant la période. Une longue mèche inférieure indique un rejet des prix bas (pression acheteuse). Une longue mèche supérieure indique un rejet des prix hauts.",
            ],
            keyPoints: ["OHLC : Open, High, Low, Close", "Vert = haussier, Rouge = baissier", "Corps = force du mouvement", "Mèches = rejets de prix"],
          },
          {
            title: "Patterns de Chandeliers Essentiels",
            content: [
              "Doji : ouverture ≈ clôture, indécision du marché. Peut signaler un retournement si trouvé après une tendance. Variantes : Doji étoile, Doji libellule, Doji pierre tombale.",
              "Marteau (Hammer) : petit corps en haut, longue mèche inférieure. Signal haussier en bas de tendance baissière. L'inverse (Hanging Man) est baissier en haut de tendance.",
              "Engulfing : un chandelier englobe complètement le précédent. Bullish Engulfing (vert englobe rouge) = signal d'achat. Bearish Engulfing (rouge englobe vert) = signal de vente.",
              "Morning Star / Evening Star : pattern à 3 chandeliers. Morning Star (baissier → doji → haussier) = retournement haussier. Evening Star = retournement baissier.",
            ],
            keyPoints: ["Doji = indécision, potentiel retournement", "Hammer = signal haussier en bas de tendance", "Engulfing = signal fort de retournement", "Toujours confirmer avec le volume"],
          },
          {
            title: "Timeframes et leur Importance",
            content: [
              "Les timeframes (périodes) déterminent la durée de chaque chandelier. 1m, 5m, 15m pour le scalping. 1h, 4h pour le day/swing trading. 1D, 1W pour le position trading et l'investissement.",
              "Règle d'or : analysez toujours du timeframe supérieur vers l'inférieur (top-down analysis). La tendance sur le weekly/daily donne le biais directionnel. Le 4h/1h donne les zones d'entrée.",
              "Plus le timeframe est élevé, plus le signal est fiable. Un support sur le weekly est beaucoup plus significatif qu'un support sur le 5 minutes. Les faux signaux sont plus fréquents sur les petits timeframes.",
            ],
            keyPoints: ["Scalping : 1m-15m", "Swing : 1h-4h", "Position : 1D-1W", "Top-down analysis : du grand vers le petit"],
          },
          {
            title: "Volume : Le Carburant du Marché",
            content: [
              "Le volume mesure le nombre d'unités échangées sur une période. Un mouvement de prix accompagné d'un volume élevé est plus significatif et fiable qu'un mouvement à faible volume.",
              "Volume croissant + prix croissant = tendance haussière saine. Volume décroissant + prix croissant = divergence baissière (la tendance s'essouffle). Volume spike = événement important.",
              "L'OBV (On-Balance Volume) cumule le volume en fonction de la direction du prix. Si l'OBV monte alors que le prix stagne, c'est un signal d'accumulation (les gros acheteurs entrent discrètement).",
            ],
            keyPoints: ["Volume confirme la force d'un mouvement", "Divergence volume/prix = alerte", "OBV pour détecter l'accumulation", "Volume spike = événement majeur"],
          },
        ],
        quiz: [
          { question: "Que signifie un chandelier avec une longue mèche inférieure ?", options: ["Les vendeurs dominent", "Rejet des prix bas (pression acheteuse)", "Le marché est indécis", "Le volume est faible"], correct: 1 },
          { question: "Pour le swing trading, quels timeframes sont recommandés ?", options: ["1m et 5m", "1h et 4h", "1W et 1M", "Tick chart"], correct: 1 },
          { question: "Un Bullish Engulfing est :", options: ["Un chandelier rouge qui englobe un vert", "Un chandelier vert qui englobe un rouge", "Deux dojis consécutifs", "Un gap haussier"], correct: 1 },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 2: ANALYSE TECHNIQUE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "m2",
    title: "Analyse Technique Complète",
    icon: <BarChart3 className="w-5 h-5" />,
    level: "Intermédiaire",
    color: "from-amber-500 to-orange-600",
    description: "Maîtrisez les indicateurs techniques, les supports/résistances et les patterns chartistes.",
    lessons: [
      {
        id: "m2-l1",
        title: "Supports, Résistances et Lignes de Tendance",
        icon: "📏",
        duration: "35 min",
        description: "Les fondations de l'analyse technique : identifier les niveaux clés.",
        subLessons: [
          {
            title: "Supports et Résistances",
            content: [
              "Un support est un niveau de prix où la demande (acheteurs) est suffisamment forte pour empêcher le prix de baisser davantage. C'est un 'plancher' psychologique et technique.",
              "Une résistance est un niveau où l'offre (vendeurs) est suffisamment forte pour empêcher le prix de monter. C'est un 'plafond'. Plus un niveau est testé, plus il est significatif.",
              "Quand un support est cassé, il devient souvent une résistance (et vice versa). Ce phénomène s'appelle le 'flip' ou 'polarity change'. C'est un concept fondamental en analyse technique.",
              "Les niveaux ronds (10 000$, 50 000$, 100 000$) agissent souvent comme supports/résistances psychologiques en raison du comportement humain (ordres placés à des chiffres ronds).",
            ],
            keyPoints: ["Support = plancher (demande)", "Résistance = plafond (offre)", "Flip : support cassé → résistance", "Niveaux psychologiques (chiffres ronds)"],
          },
          {
            title: "Lignes de Tendance et Canaux",
            content: [
              "Une ligne de tendance haussière relie au moins 2 creux (higher lows) ascendants. Elle agit comme un support dynamique. Plus elle a de points de contact, plus elle est fiable.",
              "Une ligne de tendance baissière relie au moins 2 sommets (lower highs) descendants. Elle agit comme une résistance dynamique. La cassure d'une ligne de tendance est un signal important.",
              "Un canal est formé par deux lignes de tendance parallèles. Canal ascendant = tendance haussière. Canal descendant = tendance baissière. Canal horizontal = range/consolidation.",
            ],
            keyPoints: ["Tendance haussière : higher highs + higher lows", "Tendance baissière : lower highs + lower lows", "3+ points de contact = ligne fiable", "Cassure de canal = signal fort"],
          },
          {
            title: "Fibonacci Retracement",
            content: [
              "Les niveaux de Fibonacci (23.6%, 38.2%, 50%, 61.8%, 78.6%) sont utilisés pour identifier les zones de retracement potentielles dans une tendance. Le 61.8% est le 'golden ratio'.",
              "En tendance haussière, tracez Fibonacci du bas vers le haut. Les niveaux 38.2% et 61.8% sont les zones de rebond les plus probables. En tendance baissière, tracez du haut vers le bas.",
              "Les extensions de Fibonacci (127.2%, 161.8%, 261.8%) servent à projeter les objectifs de prix. Après un retracement au 61.8%, le prix vise souvent l'extension 161.8%.",
            ],
            keyPoints: ["Niveaux clés : 38.2%, 50%, 61.8%", "Golden ratio = 61.8%", "Tracer du swing low au swing high", "Extensions pour les objectifs de prix"],
            example: "BTC monte de 80 000$ à 100 000$. Retracement 61.8% = 87 640$. Si rebond, objectif extension 161.8% = 112 360$.",
          },
        ],
        quiz: [
          { question: "Quand un support est cassé, il devient souvent :", options: ["Un nouveau support plus fort", "Une résistance", "Invisible", "Un gap"], correct: 1 },
          { question: "Le 'golden ratio' de Fibonacci est :", options: ["23.6%", "50%", "61.8%", "78.6%"], correct: 2 },
        ],
      },
      {
        id: "m2-l2",
        title: "Indicateurs Techniques Essentiels",
        icon: "📈",
        duration: "45 min",
        description: "RSI, MACD, Bollinger Bands, EMA — les outils indispensables.",
        subLessons: [
          {
            title: "RSI (Relative Strength Index)",
            content: [
              "Le RSI mesure la vitesse et l'amplitude des mouvements de prix sur une échelle de 0 à 100. Paramètre standard : 14 périodes. C'est un oscillateur de momentum.",
              "RSI > 70 = zone de surachat (overbought) — le prix pourrait corriger. RSI < 30 = zone de survente (oversold) — le prix pourrait rebondir. Attention : en tendance forte, le RSI peut rester en zone extrême longtemps.",
              "Les divergences RSI sont des signaux puissants. Divergence baissière : le prix fait un nouveau sommet mais le RSI fait un sommet plus bas → affaiblissement de la tendance. Divergence haussière : l'inverse.",
              "Le RSI peut aussi servir de support/résistance. En tendance haussière, le RSI rebondit souvent sur 40-50. En tendance baissière, il bute souvent sur 50-60.",
            ],
            keyPoints: ["Échelle 0-100, période 14", "> 70 surachat, < 30 survente", "Divergences = signaux puissants", "RSI comme S/R dynamique"],
          },
          {
            title: "MACD (Moving Average Convergence Divergence)",
            content: [
              "Le MACD est composé de 3 éléments : la ligne MACD (EMA 12 - EMA 26), la ligne Signal (EMA 9 du MACD), et l'histogramme (MACD - Signal).",
              "Signal d'achat : la ligne MACD croise la ligne Signal par le haut (bullish crossover). Signal de vente : croisement par le bas (bearish crossover). Plus le croisement est loin de la ligne zéro, plus il est significatif.",
              "L'histogramme montre la force du momentum. Histogramme croissant = momentum haussier qui s'accélère. Histogramme décroissant = momentum qui s'essouffle.",
              "Divergence MACD : si le prix fait un nouveau sommet mais le MACD fait un sommet plus bas, c'est une divergence baissière cachée — signal de retournement potentiel.",
            ],
            keyPoints: ["MACD = EMA 12 - EMA 26", "Signal = EMA 9 du MACD", "Croisement = signal d'achat/vente", "Histogramme = force du momentum"],
          },
          {
            title: "Bollinger Bands",
            content: [
              "Les Bollinger Bands sont composées de 3 lignes : une moyenne mobile simple (SMA 20) au centre, et deux bandes à ±2 écarts-types. Elles mesurent la volatilité du marché.",
              "Squeeze (bandes resserrées) = faible volatilité → un mouvement explosif se prépare. Expansion (bandes écartées) = forte volatilité → le mouvement est en cours.",
              "Le prix tend à revenir vers la bande médiane (mean reversion). Un contact avec la bande supérieure n'est PAS automatiquement un signal de vente — en tendance forte, le prix peut 'marcher' le long de la bande.",
              "La largeur des bandes (Bandwidth) et le %B (position du prix par rapport aux bandes) sont des indicateurs dérivés utiles pour quantifier la volatilité et les extrêmes.",
            ],
            keyPoints: ["SMA 20 ± 2 écarts-types", "Squeeze = explosion imminente", "Mean reversion vers la bande médiane", "Walking the band en tendance forte"],
          },
          {
            title: "Moyennes Mobiles (EMA & SMA)",
            content: [
              "La SMA (Simple Moving Average) calcule la moyenne arithmétique des N derniers prix de clôture. La EMA (Exponential Moving Average) donne plus de poids aux prix récents, donc réagit plus vite.",
              "EMA 20 : tendance court terme. EMA 50 : tendance moyen terme. EMA 200 : tendance long terme. Le prix au-dessus de l'EMA 200 = marché haussier. En dessous = marché baissier.",
              "Golden Cross : EMA 50 croise EMA 200 par le haut → signal haussier majeur. Death Cross : EMA 50 croise EMA 200 par le bas → signal baissier majeur. Ces signaux sont lents mais fiables.",
              "Les EMA servent de supports/résistances dynamiques. En tendance haussière, le prix rebondit souvent sur l'EMA 21 ou EMA 50. Utilisez-les pour placer vos entrées et stop loss.",
            ],
            keyPoints: ["EMA réagit plus vite que SMA", "EMA 200 = tendance majeure", "Golden Cross / Death Cross", "EMA comme support/résistance dynamique"],
          },
        ],
        quiz: [
          { question: "Un RSI > 70 indique :", options: ["Zone de survente", "Zone de surachat", "Tendance neutre", "Volume élevé"], correct: 1 },
          { question: "Que signifie un 'Squeeze' des Bollinger Bands ?", options: ["Le prix va baisser", "Forte volatilité en cours", "Faible volatilité, mouvement explosif imminent", "Le volume baisse"], correct: 2 },
          { question: "Le Golden Cross est :", options: ["EMA 200 croise EMA 50 par le haut", "EMA 50 croise EMA 200 par le haut", "RSI croise 50", "MACD croise 0"], correct: 1 },
        ],
      },
      {
        id: "m2-l3",
        title: "Patterns Chartistes",
        icon: "🔍",
        duration: "40 min",
        description: "Identifiez les figures chartistes pour anticiper les mouvements.",
        subLessons: [
          {
            title: "Patterns de Retournement",
            content: [
              "Double Top : deux sommets au même niveau suivis d'une cassure du support (neckline). Objectif = distance entre le sommet et le neckline, projetée vers le bas. Signal baissier fort.",
              "Double Bottom : deux creux au même niveau suivis d'une cassure de la résistance (neckline). C'est l'inverse du Double Top. Signal haussier. Forme en 'W'.",
              "Head & Shoulders (Épaule-Tête-Épaule) : trois sommets dont le central est le plus haut. La cassure du neckline confirme le retournement baissier. L'inverse (Inverse H&S) est haussier.",
              "Le volume doit confirmer le pattern : volume décroissant pendant la formation, puis spike de volume lors de la cassure du neckline.",
            ],
            keyPoints: ["Double Top/Bottom : retournement classique", "H&S : pattern le plus fiable", "Neckline = niveau de confirmation", "Volume confirme la cassure"],
          },
          {
            title: "Patterns de Continuation",
            content: [
              "Triangles : Ascendant (résistance horizontale + supports ascendants) = haussier. Descendant (support horizontal + résistances descendantes) = baissier. Symétrique = neutre, cassure dans le sens de la tendance.",
              "Flags (Drapeaux) : petite consolidation en forme de canal incliné contre la tendance. Bull Flag : tendance haussière → consolidation baissière → continuation haussière. Bear Flag : l'inverse.",
              "Pennants : similaires aux flags mais en forme de petit triangle. Wedges (Coins) : Rising Wedge = baissier (même en tendance haussière). Falling Wedge = haussier.",
              "Objectif de prix : mesurez la hauteur du mouvement précédent (le 'mât') et projetez-la à partir du point de cassure.",
            ],
            keyPoints: ["Triangle ascendant = haussier", "Flag = continuation de tendance", "Rising Wedge = baissier", "Objectif = hauteur du mât"],
          },
        ],
        quiz: [
          { question: "Un Head & Shoulders est un pattern de :", options: ["Continuation", "Retournement", "Consolidation", "Gap"], correct: 1 },
          { question: "Un Rising Wedge est généralement :", options: ["Haussier", "Baissier", "Neutre", "Dépend du volume"], correct: 1 },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 3: GESTION DU RISQUE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "m3",
    title: "Gestion du Risque & Money Management",
    icon: <Shield className="w-5 h-5" />,
    level: "Intermédiaire",
    color: "from-blue-500 to-indigo-600",
    description: "Le pilier le plus important du trading. Protégez votre capital pour survivre et prospérer.",
    lessons: [
      {
        id: "m3-l1",
        title: "Position Sizing & Risk Management",
        icon: "🛡️",
        duration: "35 min",
        description: "Calculez la taille de vos positions et gérez votre risque.",
        subLessons: [
          {
            title: "La Règle du 1-2%",
            content: [
              "Ne risquez JAMAIS plus de 1-2% de votre capital total sur un seul trade. C'est la règle d'or du money management. Avec un capital de 10 000$, vous ne devez pas perdre plus de 100-200$ par trade.",
              "Cette règle vous protège contre les séries de pertes (drawdown). Même avec 10 pertes consécutives à 2%, vous ne perdez que ~18% de votre capital. Sans cette règle, 3-4 mauvais trades peuvent vous ruiner.",
              "Formule : Taille de position = (Capital × % risque) / (Prix d'entrée - Stop Loss). Exemple : Capital 10 000$, risque 1% (100$), entrée BTC 95 000$, SL 93 000$ (2 000$ de distance). Position = 100$ / 2 000$ = 0.05 BTC.",
            ],
            keyPoints: ["Maximum 1-2% de risque par trade", "Protège contre les séries de pertes", "Formule : (Capital × %risque) / distance SL", "La survie est plus importante que le profit"],
          },
          {
            title: "Risk/Reward Ratio (R:R)",
            content: [
              "Le ratio Risk/Reward compare le risque potentiel au gain potentiel d'un trade. Un R:R de 1:2 signifie que vous risquez 1$ pour potentiellement gagner 2$.",
              "Avec un R:R de 1:2, vous n'avez besoin que de 34% de trades gagnants pour être rentable. Avec 1:3, seulement 26%. C'est pourquoi le R:R est plus important que le taux de réussite.",
              "Règle : n'entrez JAMAIS dans un trade avec un R:R inférieur à 1:1.5. Idéalement, visez 1:2 ou 1:3. Placez votre SL sur un niveau technique (sous un support) et votre TP sur un niveau technique (résistance).",
            ],
            keyPoints: ["R:R minimum 1:1.5, idéal 1:2 ou 1:3", "Plus important que le taux de réussite", "SL et TP sur des niveaux techniques", "Un bon R:R compense les pertes"],
            example: "Entrée BTC 95 000$, SL 93 000$ (risque 2 000$), TP 101 000$ (gain 6 000$). R:R = 1:3. Excellent trade.",
          },
          {
            title: "Drawdown et Gestion du Capital",
            content: [
              "Le drawdown est la perte maximale depuis un pic de capital. Un drawdown de 50% nécessite un gain de 100% pour revenir au point de départ. C'est pourquoi limiter les pertes est crucial.",
              "Règle de drawdown maximum : si votre capital baisse de 10-15%, réduisez la taille de vos positions de moitié. À -20%, arrêtez de trader et analysez vos erreurs.",
              "Diversification : ne mettez pas tout votre capital sur un seul trade ou un seul actif. Répartissez entre 3-5 positions maximum. Corrélation : BTC et les altcoins sont souvent corrélés, ce n'est pas de la vraie diversification.",
            ],
            keyPoints: ["-50% nécessite +100% pour récupérer", "Réduire les positions après -10%", "Maximum 3-5 positions simultanées", "Attention à la corrélation crypto"],
          },
        ],
        quiz: [
          { question: "Avec la règle du 1%, combien risquez-vous sur un capital de 20 000$ ?", options: ["20$", "200$", "2 000$", "1 000$"], correct: 1 },
          { question: "Un R:R de 1:3 signifie :", options: ["Risquer 3$ pour gagner 1$", "Risquer 1$ pour gagner 3$", "3 trades gagnants pour 1 perdant", "Risquer 1% pour 3% de gain"], correct: 1 },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 4: PSYCHOLOGIE DU TRADING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "m4",
    title: "Psychologie du Trading",
    icon: <Brain className="w-5 h-5" />,
    level: "Avancé",
    color: "from-purple-500 to-pink-600",
    description: "80% du trading est mental. Maîtrisez vos émotions pour devenir un trader consistant.",
    lessons: [
      {
        id: "m4-l1",
        title: "Les Émotions du Trader",
        icon: "🧠",
        duration: "30 min",
        description: "Comprendre et maîtriser FOMO, FUD, revenge trading et overtrading.",
        subLessons: [
          {
            title: "FOMO (Fear Of Missing Out)",
            content: [
              "Le FOMO est la peur de rater une opportunité. Il pousse les traders à acheter après une forte hausse, souvent au pire moment. C'est l'émotion la plus destructrice en crypto.",
              "Signes de FOMO : vous achetez parce que 'tout le monde en parle', vous entrez sans plan de trade, vous augmentez votre position après une hausse, vous ressentez de l'urgence.",
              "Solution : ayez TOUJOURS un plan de trade AVANT d'entrer. Si vous avez raté un mouvement, attendez un pullback. Il y aura toujours une prochaine opportunité. Le marché sera là demain.",
            ],
            keyPoints: ["FOMO = acheter au sommet", "Toujours avoir un plan AVANT", "Attendre le pullback", "Le marché offre toujours de nouvelles opportunités"],
          },
          {
            title: "Revenge Trading et Overtrading",
            content: [
              "Le revenge trading est le fait de prendre des trades impulsifs après une perte pour 'se refaire'. C'est un cercle vicieux : perte → frustration → trade impulsif → plus grande perte.",
              "L'overtrading est le fait de trader trop fréquemment, souvent par ennui ou addiction à l'adrénaline. Chaque trade a des frais, et la qualité diminue quand la quantité augmente.",
              "Solutions : après 2-3 pertes consécutives, ARRÊTEZ de trader pour la journée. Fixez un nombre maximum de trades par jour (3-5). Tenez un journal de trading pour identifier vos patterns émotionnels.",
            ],
            keyPoints: ["Revenge trading = spirale de pertes", "Maximum 3-5 trades par jour", "Pause obligatoire après 2-3 pertes", "Journal de trading = miroir émotionnel"],
          },
          {
            title: "Discipline et Routine du Trader",
            content: [
              "Les traders rentables ont une routine stricte : analyse pré-marché (30 min), identification des setups, exécution du plan, revue post-marché. Pas d'improvisation.",
              "Le journal de trading est votre outil le plus précieux. Notez chaque trade : entrée, sortie, raison, émotion, résultat. Analysez vos stats mensuellement pour identifier vos forces et faiblesses.",
              "Règles personnelles : définissez VOS règles et respectez-les sans exception. Exemples : 'Je ne trade pas les lundis', 'Je ne trade pas pendant les annonces FED', 'Maximum 2% de risque par trade'.",
              "La patience est une compétence. Les meilleurs traders attendent le setup parfait. Pas de trade = pas de perte. Parfois, ne rien faire est la meilleure décision.",
            ],
            keyPoints: ["Routine quotidienne structurée", "Journal de trading obligatoire", "Règles personnelles non négociables", "La patience est rentable"],
          },
        ],
        quiz: [
          { question: "Le FOMO pousse généralement à :", options: ["Vendre trop tôt", "Acheter au sommet", "Attendre patiemment", "Analyser davantage"], correct: 1 },
          { question: "Après 3 pertes consécutives, vous devriez :", options: ["Doubler la taille de position", "Arrêter de trader pour la journée", "Changer de stratégie immédiatement", "Trader sur un timeframe plus petit"], correct: 1 },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 5: STRATÉGIES DE TRADING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "m5",
    title: "Stratégies de Trading Avancées",
    icon: <Target className="w-5 h-5" />,
    level: "Avancé",
    color: "from-red-500 to-rose-600",
    description: "Scalping, Swing Trading, Position Trading — trouvez votre style et maîtrisez-le.",
    lessons: [
      {
        id: "m5-l1",
        title: "Scalping & Day Trading",
        icon: "⚡",
        duration: "40 min",
        description: "Stratégies de trading à court terme pour profiter des micro-mouvements.",
        subLessons: [
          {
            title: "Le Scalping",
            content: [
              "Le scalping consiste à prendre de nombreux petits profits sur des mouvements de prix minimes (0.1-0.5%). Les trades durent de quelques secondes à quelques minutes. Timeframes : 1m, 5m.",
              "Prérequis : connexion internet rapide, exchange avec frais bas (maker < 0.02%), forte liquidité (BTC, ETH), discipline extrême. Le scalping n'est PAS pour les débutants.",
              "Stratégie : identifiez les zones de support/résistance sur le 5m, attendez un rejet (mèche + volume), entrez avec un SL serré (0.2-0.3%), TP rapide (0.3-0.5%). 50-100 trades par jour.",
            ],
            keyPoints: ["Profits de 0.1-0.5% par trade", "Timeframes 1m-5m", "Frais bas obligatoires", "Discipline et vitesse essentielles"],
          },
          {
            title: "Day Trading",
            content: [
              "Le day trading consiste à ouvrir et fermer toutes les positions dans la même journée. Pas de position overnight. Timeframes : 15m, 1h. Objectif : 1-5% par trade.",
              "Stratégie de breakout : identifiez une consolidation (range) sur le 1h, attendez la cassure avec volume, entrez dans le sens de la cassure, SL sous le range, TP = hauteur du range.",
              "Stratégie de pullback : en tendance haussière (prix > EMA 20 > EMA 50), attendez un pullback vers l'EMA 20, entrez sur le rebond avec confirmation (chandelier haussier + volume), SL sous l'EMA 50.",
            ],
            keyPoints: ["Toutes positions fermées en fin de journée", "Breakout et pullback strategies", "1-5% objectif par trade", "Pas de position overnight"],
          },
        ],
        quiz: [
          { question: "Le scalping utilise principalement quels timeframes ?", options: ["1D et 1W", "4h et 1D", "1m et 5m", "1h et 4h"], correct: 2 },
        ],
      },
      {
        id: "m5-l2",
        title: "Swing Trading & Position Trading",
        icon: "🌊",
        duration: "45 min",
        description: "Stratégies moyen et long terme pour capturer les grandes tendances.",
        subLessons: [
          {
            title: "Le Swing Trading",
            content: [
              "Le swing trading capture les 'swings' (oscillations) du marché sur plusieurs jours à semaines. Timeframes d'analyse : 4h et 1D. C'est le style le plus adapté pour les traders non full-time.",
              "Stratégie : identifiez la tendance sur le weekly/daily. Attendez un retracement vers un niveau clé (Fibonacci 50-61.8%, EMA 50, support). Entrez sur confirmation. TP sur la prochaine résistance.",
              "Avantages : moins de stress que le scalping, frais réduits (peu de trades), compatible avec un emploi. Inconvénients : exposition overnight (gaps), patience requise.",
            ],
            keyPoints: ["Durée : jours à semaines", "Analyse 4h et Daily", "Retracement + confirmation", "Idéal pour traders non full-time"],
          },
          {
            title: "Le Position Trading",
            content: [
              "Le position trading capture les grandes tendances sur des semaines à des mois. Timeframes : 1D, 1W. C'est le style le plus proche de l'investissement, mais avec une gestion active.",
              "Stratégie : identifiez les tendances majeures (Golden Cross, cassure de résistance majeure). Entrez sur les pullbacks vers l'EMA 50 ou EMA 200 sur le daily. SL large (10-15%), TP ambitieux (30-100%+).",
              "Le DCA (Dollar Cost Averaging) est une variante : achetez régulièrement un montant fixe, indépendamment du prix. Réduit l'impact de la volatilité. Idéal pour BTC et ETH en accumulation long terme.",
            ],
            keyPoints: ["Durée : semaines à mois", "Grandes tendances, SL large", "DCA pour accumulation", "Patience = profits importants"],
          },
          {
            title: "Choisir Son Style de Trading",
            content: [
              "Votre style doit correspondre à votre personnalité, votre disponibilité et votre tolérance au risque. Un scalper impatient ne réussira pas en position trading, et vice versa.",
              "Disponibilité : Scalping = full-time devant l'écran. Day Trading = 4-6h/jour. Swing = 30min-1h/jour. Position = 15min/jour. Choisissez en fonction de votre emploi du temps.",
              "Capital : le scalping nécessite un capital important (frais) et un levier. Le swing et position trading fonctionnent avec des capitaux plus modestes. Commencez par le swing trading.",
              "Testez chaque style en paper trading (simulation) pendant au moins 1 mois avant de risquer de l'argent réel. Analysez vos résultats et choisissez le style où vous êtes le plus rentable ET confortable.",
            ],
            keyPoints: ["Style = personnalité + disponibilité", "Commencer par le swing trading", "Paper trading 1 mois minimum", "Un seul style à la fois"],
          },
        ],
        quiz: [
          { question: "Le swing trading est idéal pour :", options: ["Les traders full-time", "Les traders avec un emploi", "Les robots de trading", "Les débutants absolus"], correct: 1 },
          { question: "Le DCA consiste à :", options: ["Acheter tout d'un coup", "Vendre progressivement", "Acheter régulièrement un montant fixe", "Utiliser un effet de levier"], correct: 2 },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 6: DeFi & ON-CHAIN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "m6",
    title: "DeFi, On-Chain & Analyse Fondamentale",
    icon: <Globe className="w-5 h-5" />,
    level: "Avancé",
    color: "from-cyan-500 to-teal-600",
    description: "Analyse on-chain, DeFi, tokenomics — les données que les graphiques ne montrent pas.",
    lessons: [
      {
        id: "m6-l1",
        title: "Analyse On-Chain",
        icon: "⛓️",
        duration: "40 min",
        description: "Utilisez les données blockchain pour anticiper les mouvements.",
        subLessons: [
          {
            title: "Métriques On-Chain Essentielles",
            content: [
              "MVRV (Market Value to Realized Value) : compare la capitalisation de marché à la valeur réalisée (prix moyen d'achat de tous les BTC). MVRV > 3.5 = marché en euphorie. MVRV < 1 = marché en capitulation.",
              "NUPL (Net Unrealized Profit/Loss) : mesure le profit/perte non réalisé de l'ensemble du réseau. NUPL > 0.75 = euphorie (vendre). NUPL < 0 = capitulation (acheter).",
              "Exchange Flows : les entrées massives de BTC sur les exchanges signalent une pression vendeuse. Les sorties massives signalent de l'accumulation (les holders retirent vers des cold wallets).",
              "Active Addresses : le nombre d'adresses actives reflète l'adoption et l'activité du réseau. Une hausse des adresses actives pendant une baisse de prix = accumulation smart money.",
            ],
            keyPoints: ["MVRV > 3.5 = euphorie, < 1 = capitulation", "Exchange inflows = pression vendeuse", "Exchange outflows = accumulation", "Active addresses = santé du réseau"],
          },
          {
            title: "Whale Watching & Smart Money",
            content: [
              "Les whales (baleines) sont des adresses détenant de grandes quantités de crypto. Leurs mouvements peuvent influencer significativement le marché. Suivez-les via Whale Alert, Arkham Intelligence.",
              "Accumulation silencieuse : quand les whales achètent pendant une baisse de prix, c'est un signal haussier fort. Elles ont accès à des informations et analyses que le retail n'a pas.",
              "Attention aux faux signaux : un transfert whale vers un exchange ne signifie pas forcément une vente. Cela peut être un transfert interne, du staking, ou de la gestion de collatéral.",
            ],
            keyPoints: ["Whales = indicateur avancé", "Accumulation whale en baisse = haussier", "Vérifier le contexte des transferts", "Arkham Intelligence, Whale Alert"],
          },
        ],
        quiz: [
          { question: "Un MVRV > 3.5 indique :", options: ["Marché en capitulation", "Marché en euphorie", "Marché neutre", "Faible volume"], correct: 1 },
          { question: "Des sorties massives de BTC des exchanges signalent :", options: ["Pression vendeuse", "Accumulation", "Panique", "Liquidations"], correct: 1 },
        ],
      },
      {
        id: "m6-l2",
        title: "DeFi & Tokenomics",
        icon: "🏦",
        duration: "35 min",
        description: "Comprendre la DeFi, le yield farming et analyser les tokenomics.",
        subLessons: [
          {
            title: "Introduction à la DeFi",
            content: [
              "La DeFi (Finance Décentralisée) reproduit les services financiers traditionnels (prêts, échanges, assurances) via des smart contracts, sans intermédiaire. TVL (Total Value Locked) mesure la valeur totale déposée dans les protocoles DeFi.",
              "Principaux protocoles : Aave (prêts/emprunts), Uniswap (DEX), Lido (liquid staking), MakerDAO (stablecoin DAI), Curve (échange de stablecoins). Chaque protocole a ses risques spécifiques.",
              "Yield Farming : fournir de la liquidité à un protocole en échange de récompenses (APY). Attention aux risques : impermanent loss, smart contract risk, rug pulls. Un APY > 100% est souvent un red flag.",
            ],
            keyPoints: ["DeFi = finance sans intermédiaire", "TVL = indicateur de confiance", "Yield farming : récompenses vs risques", "APY > 100% = méfiance"],
          },
          {
            title: "Analyse des Tokenomics",
            content: [
              "Les tokenomics définissent l'économie d'un token : offre totale, offre en circulation, distribution, mécanismes d'inflation/déflation, utilité. C'est fondamental pour évaluer un projet.",
              "Vesting schedule : les tokens alloués aux fondateurs et investisseurs sont souvent verrouillés et libérés progressivement. Un unlock massif peut créer une pression vendeuse importante.",
              "Mécanismes déflationnaires : burn (destruction de tokens), buyback. Ethereum brûle une partie des frais de gas (EIP-1559). Mécanismes inflationnaires : récompenses de staking, émission de nouveaux tokens.",
              "Red flags tokenomics : >50% des tokens aux insiders, pas de vesting, utilité floue, offre illimitée sans mécanisme de burn, concentration excessive chez quelques wallets.",
            ],
            keyPoints: ["Offre totale vs circulation", "Vesting = calendrier de déblocage", "Burn = déflationnaire = positif", "Red flags : >50% insiders, pas de vesting"],
          },
        ],
        quiz: [
          { question: "Le TVL mesure :", options: ["Le volume de trading", "La valeur totale déposée dans un protocole DeFi", "Le nombre d'utilisateurs", "La capitalisation de marché"], correct: 1 },
          { question: "Un vesting schedule sert à :", options: ["Augmenter le prix", "Libérer progressivement les tokens des insiders", "Brûler des tokens", "Distribuer des airdrops"], correct: 1 },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 7: TRADING AVANCÉ & ALGORITHMIQUE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "m7",
    title: "Trading Avancé & Algorithmique",
    icon: <Zap className="w-5 h-5" />,
    level: "Expert",
    color: "from-violet-500 to-purple-700",
    description: "Futures, options, bots de trading, et stratégies quantitatives.",
    lessons: [
      {
        id: "m7-l1",
        title: "Futures & Leverage Trading",
        icon: "🔥",
        duration: "45 min",
        description: "Trading à effet de levier, liquidations, funding rate.",
        subLessons: [
          {
            title: "Les Contrats Futures Perpétuels",
            content: [
              "Les futures perpétuels (perps) permettent de trader avec un effet de levier sans date d'expiration. Vous pouvez aller Long (parier sur la hausse) ou Short (parier sur la baisse).",
              "L'effet de levier multiplie vos gains ET vos pertes. Un levier 10x signifie qu'un mouvement de 1% = 10% sur votre position. Un mouvement de 10% contre vous = liquidation totale.",
              "Le funding rate est un mécanisme qui maintient le prix du contrat proche du prix spot. Funding positif = les longs paient les shorts (marché haussier). Funding négatif = les shorts paient les longs.",
              "RÈGLE D'OR : ne dépassez JAMAIS un levier de 3-5x. Les traders professionnels utilisent rarement plus de 5x. Le levier 100x est un casino, pas du trading.",
            ],
            keyPoints: ["Long = haussier, Short = baissier", "Levier multiplie gains ET pertes", "Maximum 3-5x recommandé", "Funding rate = indicateur de sentiment"],
          },
          {
            title: "Liquidations et Gestion du Levier",
            content: [
              "La liquidation se produit quand vos pertes atteignent votre marge (collatéral). Avec un levier 10x, une baisse de 10% vous liquide. Avec 20x, seulement 5% suffisent.",
              "Mode Cross vs Isolated : en Cross margin, tout votre solde sert de collatéral (risque de tout perdre). En Isolated margin, seule la marge allouée est à risque. TOUJOURS utiliser Isolated.",
              "Calcul du prix de liquidation : Prix de liquidation = Prix d'entrée × (1 - 1/Levier) pour un Long. Exemple : entrée 95 000$ avec levier 10x → liquidation à 85 500$.",
              "Stratégie : utilisez un levier faible (2-3x), placez un SL BIEN AVANT le prix de liquidation, et ne risquez jamais plus de 1-2% de votre capital total par trade futures.",
            ],
            keyPoints: ["Isolated margin TOUJOURS", "SL bien avant la liquidation", "Levier 2-3x maximum", "1-2% risque par trade futures"],
          },
        ],
        quiz: [
          { question: "Avec un levier 20x, quel mouvement vous liquide ?", options: ["20%", "10%", "5%", "2%"], correct: 2 },
          { question: "Le mode Isolated margin :", options: ["Utilise tout votre solde comme collatéral", "Limite le risque à la marge allouée", "Augmente le levier automatiquement", "Est réservé aux pros"], correct: 1 },
        ],
      },
      {
        id: "m7-l2",
        title: "Trading Algorithmique & Bots",
        icon: "🤖",
        duration: "40 min",
        description: "Automatisez vos stratégies avec des bots de trading.",
        subLessons: [
          {
            title: "Introduction aux Bots de Trading",
            content: [
              "Un bot de trading exécute automatiquement des stratégies prédéfinies 24/7. Avantages : pas d'émotions, exécution rapide, trading non-stop. Inconvénients : bugs, conditions de marché imprévues.",
              "Types de bots : Grid Bot (achète/vend dans un range), DCA Bot (achats réguliers), Signal Bot (suit des signaux techniques), Arbitrage Bot (exploite les différences de prix entre exchanges).",
              "Plateformes populaires : 3Commas, Pionex (bots gratuits), Cryptohopper, Bitsgap. Pour les développeurs : API des exchanges (Binance, Bybit) avec Python (ccxt library).",
            ],
            keyPoints: ["Bots = trading 24/7 sans émotions", "Grid, DCA, Signal, Arbitrage", "Backtesting obligatoire avant live", "Surveiller régulièrement les performances"],
          },
          {
            title: "Backtesting et Optimisation",
            content: [
              "Le backtesting consiste à tester une stratégie sur des données historiques pour évaluer sa performance passée. C'est une étape OBLIGATOIRE avant de risquer de l'argent réel.",
              "Métriques clés : Win Rate (% de trades gagnants), Profit Factor (gains totaux / pertes totales), Max Drawdown (perte maximale), Sharpe Ratio (rendement ajusté au risque).",
              "Attention à l'overfitting : une stratégie optimisée à l'extrême sur les données passées ne fonctionnera pas en live. Utilisez des données out-of-sample pour valider. Simples > complexes.",
              "Paper trading : après le backtesting, testez en conditions réelles avec de l'argent virtuel pendant au moins 1-3 mois. Si les résultats sont cohérents avec le backtest, passez en live avec un petit capital.",
            ],
            keyPoints: ["Backtesting AVANT le live trading", "Win Rate, Profit Factor, Max Drawdown", "Attention à l'overfitting", "Paper trading 1-3 mois minimum"],
          },
        ],
        quiz: [
          { question: "L'overfitting en backtesting signifie :", options: ["La stratégie est trop simple", "La stratégie est sur-optimisée pour les données passées", "Le bot trade trop souvent", "Les frais sont trop élevés"], correct: 1 },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 8: MACRO & CYCLES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "m8",
    title: "Macro-Économie & Cycles Crypto",
    icon: <Flame className="w-5 h-5" />,
    level: "Expert",
    color: "from-orange-500 to-red-600",
    description: "Comprenez les cycles du marché crypto, l'impact de la macro-économie et le halving.",
    lessons: [
      {
        id: "m8-l1",
        title: "Les Cycles du Marché Crypto",
        icon: "🔄",
        duration: "35 min",
        description: "Halving, bull/bear markets, et phases du cycle.",
        subLessons: [
          {
            title: "Le Cycle du Bitcoin Halving",
            content: [
              "Le halving Bitcoin réduit de moitié la récompense des mineurs tous les ~210 000 blocs (~4 ans). Halvings passés : 2012, 2016, 2020, 2024. Prochain estimé : ~2028.",
              "Historiquement, le prix de Bitcoin atteint un nouveau ATH (All-Time High) 12-18 mois après chaque halving. 2012 → ATH 2013. 2016 → ATH 2017. 2020 → ATH 2021. 2024 → ATH 2025?",
              "Le cycle complet dure ~4 ans : Accumulation (bear market bottom) → Markup (hausse progressive) → Distribution (euphorie, ATH) → Markdown (crash, bear market). Chaque phase a des caractéristiques distinctes.",
            ],
            keyPoints: ["Halving tous les ~4 ans", "ATH 12-18 mois après le halving", "4 phases : Accumulation → Markup → Distribution → Markdown", "L'histoire ne se répète pas mais rime"],
          },
          {
            title: "Impact de la Macro-Économie",
            content: [
              "Les taux d'intérêt de la FED impactent directement le marché crypto. Taux bas → liquidité abondante → hausse des actifs risqués (crypto). Taux hauts → liquidité réduite → baisse.",
              "L'inflation (CPI) influence les décisions de la FED. Inflation élevée → hausse des taux → baissier pour crypto. Inflation en baisse → baisse des taux → haussier pour crypto.",
              "Le DXY (Dollar Index) est inversement corrélé au Bitcoin. DXY en hausse = dollar fort = crypto baisse. DXY en baisse = dollar faible = crypto hausse.",
              "Événements géopolitiques, régulations (ETF Bitcoin, MiCA), et adoption institutionnelle (BlackRock, Fidelity) sont des catalyseurs majeurs pour les mouvements de prix.",
            ],
            keyPoints: ["Taux FED bas = haussier crypto", "CPI/inflation influence les taux", "DXY inversement corrélé au BTC", "ETF et adoption institutionnelle = catalyseurs"],
          },
          {
            title: "Sentiment du Marché et Indicateurs de Cycle",
            content: [
              "Fear & Greed Index : 0-25 = Extreme Fear (opportunité d'achat). 75-100 = Extreme Greed (prudence). 'Be fearful when others are greedy, and greedy when others are fearful' — Warren Buffett.",
              "Bitcoin Dominance : quand BTC.D augmente, le capital se concentre sur Bitcoin (risk-off). Quand BTC.D baisse, le capital se déplace vers les altcoins (altseason). Surveillez les niveaux 50% et 60%.",
              "Altcoin Season Index : mesure la performance des altcoins vs Bitcoin sur 90 jours. > 75% = Altseason. < 25% = Bitcoin Season. Les altseasons se produisent généralement en fin de bull market.",
              "Stablecoin Dominance : quand la part des stablecoins augmente, les traders sont en cash (bearish). Quand elle diminue, le capital entre dans le marché (bullish).",
            ],
            keyPoints: ["Fear & Greed : acheter dans la peur", "BTC Dominance : rotation BTC ↔ alts", "Altseason en fin de bull market", "Stablecoin dominance = cash vs invested"],
          },
        ],
        quiz: [
          { question: "Combien de temps après un halving Bitcoin atteint-il historiquement un ATH ?", options: ["1-3 mois", "6-12 mois", "12-18 mois", "24-36 mois"], correct: 2 },
          { question: "Un DXY en baisse est généralement :", options: ["Baissier pour crypto", "Haussier pour crypto", "Sans impact", "Baissier pour l'or"], correct: 1 },
        ],
      },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function TradingAcademy() {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [expandedModule, setExpandedModule] = useState<string | null>("m1");
  const [selectedLesson, setSelectedLesson] = useState<{ moduleId: string; lesson: Lesson } | null>(null);
  const [expandedSubLesson, setExpandedSubLesson] = useState<number>(0);
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [levelFilter, setLevelFilter] = useState("ALL");

  const totalLessons = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
  const progress = Math.round((completedLessons.size / totalLessons) * 100);

  const filteredModules = useMemo(() => {
    if (levelFilter === "ALL") return MODULES;
    return MODULES.filter((m) => m.level === levelFilter);
  }, [levelFilter]);

  const toggleComplete = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  const handleQuizAnswer = (qIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const submitQuiz = () => setQuizSubmitted(true);

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const openLesson = (moduleId: string, lesson: Lesson) => {
    setSelectedLesson({ moduleId, lesson });
    setExpandedSubLesson(0);
    setQuizMode(false);
    resetQuiz();
  };

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-7">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1300px] mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-6">
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-amber-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              🎓 Trading Academy
            </h1>
            <p className="text-gray-500 mt-3 text-lg">La formation trading crypto la plus complète — Du débutant à l&apos;expert</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="bg-blue-500/10 border border-blue-500/25 rounded-full px-4 py-1 text-xs text-blue-400 font-bold">
                {MODULES.length} Modules
              </span>
              <span className="bg-purple-500/10 border border-purple-500/25 rounded-full px-4 py-1 text-xs text-purple-400 font-bold">
                {totalLessons} Leçons
              </span>
              <span className="bg-amber-500/10 border border-amber-500/25 rounded-full px-4 py-1 text-xs text-amber-400 font-bold">
                {MODULES.reduce((sum, m) => sum + m.lessons.reduce((s, l) => s + l.subLessons.length, 0), 0)} Chapitres
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Votre Progression</h2>
              </div>
              <span className="text-sm font-bold text-blue-400">{completedLessons.size}/{totalLessons} leçons complétées</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-amber-400 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{progress}% complété</span>
              <span className="text-xs text-gray-500">
                {progress === 100 ? "🏆 Félicitations ! Formation terminée !" :
                 progress > 75 ? "🔥 Presque fini ! Continuez !" :
                 progress > 50 ? "💪 Plus de la moitié ! Bravo !" :
                 progress > 25 ? "📈 Bon début ! Continuez !" :
                 "🚀 C'est parti !"}
              </span>
            </div>
          </div>

          {/* Level Filters */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {["ALL", "Débutant", "Intermédiaire", "Avancé", "Expert"].map((l) => (
              <button key={l} onClick={() => setLevelFilter(l)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  levelFilter === l
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/5"
                }`}>
                {l === "ALL" ? `Tous les niveaux (${MODULES.length})` : `${l} (${MODULES.filter((m) => m.level === l).length})`}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Module List */}
            <div className="lg:col-span-1 space-y-3">
              {filteredModules.map((module) => {
                const isExpanded = expandedModule === module.id;
                const moduleCompleted = module.lessons.every((l) => completedLessons.has(l.id));
                const moduleLessonsCompleted = module.lessons.filter((l) => completedLessons.has(l.id)).length;

                return (
                  <div key={module.id} className="bg-slate-900/70 border border-white/5 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-all text-left"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        {moduleCompleted ? <CheckCircle2 className="w-5 h-5 text-white" /> : module.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white truncate">{module.title}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${LEVEL_STYLES[module.level].bg} ${LEVEL_STYLES[module.level].text}`}>
                            {module.level}
                          </span>
                          <span className="text-[10px] text-gray-500">{module.lessons.length} leçons</span>
                          <span className="text-[10px] text-gray-600">{moduleLessonsCompleted}/{module.lessons.length}</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-1.5">
                        <p className="text-[11px] text-gray-500 mb-2 px-1">{module.description}</p>
                        {module.lessons.map((lesson) => {
                          const isCompleted = completedLessons.has(lesson.id);
                          const isSelected = selectedLesson?.lesson.id === lesson.id;
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => openLesson(module.id, lesson)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                                isSelected ? "bg-blue-500/10 border border-blue-500/30" : "bg-white/[0.02] hover:bg-white/[0.04] border border-transparent"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-white truncate">{lesson.icon} {lesson.title}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Clock className="w-3 h-3 text-gray-600" />
                                  <span className="text-[10px] text-gray-500">{lesson.duration}</span>
                                  <span className="text-[10px] text-gray-600">• {lesson.subLessons.length} chapitres</span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right: Lesson Content */}
            <div className="lg:col-span-2">
              {!selectedLesson ? (
                <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-10 text-center">
                  <Layers className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-white mb-2">Sélectionnez une leçon</h2>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Choisissez un module dans le menu de gauche, puis cliquez sur une leçon pour commencer votre apprentissage.
                    Commencez par le Module 1 si vous êtes débutant.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lesson Header */}
                  <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          {selectedLesson.lesson.icon} {selectedLesson.lesson.title}
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">{selectedLesson.lesson.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedLesson.lesson.duration}</span>
                          <span className="text-xs text-gray-500">{selectedLesson.lesson.subLessons.length} chapitres</span>
                          <span className="text-xs text-gray-500">{selectedLesson.lesson.quiz.length} questions quiz</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleComplete(selectedLesson.lesson.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                          completedLessons.has(selectedLesson.lesson.id)
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"
                        }`}
                      >
                        {completedLessons.has(selectedLesson.lesson.id) ? "✅ Terminé" : "Marquer terminé"}
                      </button>
                    </div>

                    {/* Tab: Content / Quiz */}
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => { setQuizMode(false); resetQuiz(); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!quizMode ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/[0.03] text-gray-500 border border-white/[0.06]"}`}>
                        📖 Contenu
                      </button>
                      <button onClick={() => setQuizMode(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${quizMode ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-white/[0.03] text-gray-500 border border-white/[0.06]"}`}>
                        🧪 Quiz ({selectedLesson.lesson.quiz.length} questions)
                      </button>
                    </div>
                  </div>

                  {/* Content Mode */}
                  {!quizMode && (
                    <div className="space-y-3">
                      {/* Sub-lesson navigation */}
                      <div className="flex flex-wrap gap-2">
                        {selectedLesson.lesson.subLessons.map((sub, i) => (
                          <button key={i} onClick={() => setExpandedSubLesson(i)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                              expandedSubLesson === i
                                ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                : "bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:text-white"
                            }`}>
                            {i + 1}. {sub.title}
                          </button>
                        ))}
                      </div>

                      {/* Sub-lesson content */}
                      {selectedLesson.lesson.subLessons.map((sub, i) => (
                        expandedSubLesson === i && (
                          <div key={i} className="bg-slate-900/70 border border-white/5 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                              {sub.title}
                            </h3>

                            {/* Content paragraphs */}
                            <div className="space-y-4 mb-6">
                              {sub.content.map((paragraph, pi) => (
                                <p key={pi} className="text-sm text-gray-300 leading-relaxed">{paragraph}</p>
                              ))}
                            </div>

                            {/* Example */}
                            {sub.example && (
                              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 mb-4">
                                <h4 className="text-xs font-bold text-amber-400 mb-2">💡 Exemple pratique</h4>
                                <p className="text-sm text-gray-300">{sub.example}</p>
                              </div>
                            )}

                            {/* Key Points */}
                            <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-xl p-4">
                              <h4 className="text-xs font-bold text-blue-400 mb-3">📌 Points clés à retenir</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {sub.keyPoints.map((point, ki) => (
                                  <div key={ki} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs text-gray-300">{point}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-between mt-6">
                              <button
                                onClick={() => setExpandedSubLesson(Math.max(0, i - 1))}
                                disabled={i === 0}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                ← Précédent
                              </button>
                              {i < selectedLesson.lesson.subLessons.length - 1 ? (
                                <button
                                  onClick={() => setExpandedSubLesson(i + 1)}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"
                                >
                                  Suivant →
                                </button>
                              ) : (
                                <button
                                  onClick={() => setQuizMode(true)}
                                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                                >
                                  🧪 Passer le Quiz →
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}

                  {/* Quiz Mode */}
                  {quizMode && (
                    <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        🧪 Quiz — {selectedLesson.lesson.title}
                      </h3>

                      <div className="space-y-6">
                        {selectedLesson.lesson.quiz.map((q, qi) => {
                          const answered = quizAnswers[qi] !== undefined;
                          const isCorrect = quizSubmitted && quizAnswers[qi] === q.correct;
                          const isWrong = quizSubmitted && answered && quizAnswers[qi] !== q.correct;

                          return (
                            <div key={qi} className={`p-5 rounded-xl border ${
                              isCorrect ? "bg-emerald-500/[0.06] border-emerald-500/30" :
                              isWrong ? "bg-red-500/[0.06] border-red-500/30" :
                              "bg-white/[0.02] border-white/[0.06]"
                            }`}>
                              <p className="text-sm font-bold text-white mb-3">
                                <span className="text-gray-500 mr-2">Q{qi + 1}.</span>
                                {q.question}
                              </p>
                              <div className="space-y-2">
                                {q.options.map((opt, oi) => {
                                  const isSelected = quizAnswers[qi] === oi;
                                  const showCorrect = quizSubmitted && oi === q.correct;
                                  const showWrong = quizSubmitted && isSelected && oi !== q.correct;

                                  return (
                                    <button
                                      key={oi}
                                      onClick={() => handleQuizAnswer(qi, oi)}
                                      disabled={quizSubmitted}
                                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${
                                        showCorrect ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold" :
                                        showWrong ? "bg-red-500/10 text-red-400 border-red-500/30" :
                                        isSelected ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                                        "bg-white/[0.02] text-gray-400 border-white/[0.04] hover:bg-white/[0.04] hover:text-white"
                                      }`}
                                    >
                                      <span className="font-mono mr-2 text-xs">{String.fromCharCode(65 + oi)}.</span>
                                      {opt}
                                      {showCorrect && " ✅"}
                                      {showWrong && " ❌"}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Quiz Actions */}
                      <div className="flex items-center justify-between mt-6">
                        {!quizSubmitted ? (
                          <button
                            onClick={submitQuiz}
                            disabled={Object.keys(quizAnswers).length < selectedLesson.lesson.quiz.length}
                            className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Valider mes réponses
                          </button>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="text-sm font-bold">
                              Score : {selectedLesson.lesson.quiz.filter((q, i) => quizAnswers[i] === q.correct).length}/{selectedLesson.lesson.quiz.length}
                              {selectedLesson.lesson.quiz.every((q, i) => quizAnswers[i] === q.correct) && " 🏆 Parfait !"}
                            </div>
                            <button onClick={resetQuiz} className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.05] text-gray-400 hover:text-white transition-all">
                              🔄 Recommencer
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => { toggleComplete(selectedLesson.lesson.id); }}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                        >
                          ✅ Marquer comme terminé
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}