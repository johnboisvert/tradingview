import { Lesson } from "./types";

const m13l1: Lesson = {
  id: "m13-l1",
  title: "Trading Algorithmique et Bots",
  icon: "🤖",
  duration: "55 min",
  description: "Automatiser vos stratégies de trading avec des bots et des algorithmes.",
  subLessons: [
    {
      title: "Introduction au Trading Algorithmique",
      content: [
        "Le trading algorithmique utilise des programmes informatiques pour exécuter des ordres selon des règles prédéfinies. Les avantages : exécution 24/7 sans émotions, vitesse d'exécution supérieure, backtesting possible, et discipline parfaite.",
        "Les types de bots : Grid bots (achètent/vendent à intervalles réguliers dans un range), DCA bots (achats automatiques périodiques), Signal bots (exécutent sur des signaux techniques), et Arbitrage bots (exploitent les différences de prix entre exchanges).",
        "Les plateformes de bots populaires : 3Commas, Pionex (bots gratuits intégrés), Bitsgap, et HaasOnline. Pour les développeurs : CCXT (librairie Python), Freqtrade (open-source), et les APIs des exchanges.",
        "Le trading algo ne garantit PAS les profits. Un bot mal configuré peut perdre plus vite qu'un humain. Le backtesting est essentiel mais le passé ne prédit pas le futur. Commencez TOUJOURS en paper trading."
      ],
      keyPoints: [
        "Bots = exécution 24/7 sans émotions",
        "Grid, DCA, Signal, Arbitrage : 4 types principaux",
        "3Commas, Pionex, Freqtrade : plateformes populaires",
        "Backtesting obligatoire + paper trading avant le réel"
      ],
      proTips: ["Commencez par un simple DCA bot sur Pionex (gratuit) avant d'investir dans des solutions complexes"],
      commonMistakes: ["Lancer un bot en production sans backtesting ni paper trading — recette pour perdre de l'argent"]
    },
    {
      title: "Grid Trading en Détail",
      content: [
        "Le Grid Trading place des ordres d'achat et de vente à intervalles réguliers dans un range de prix défini. Quand le prix oscille, le bot achète bas et vend haut automatiquement, capturant les profits à chaque oscillation.",
        "Configuration : définissez le range (support-résistance), le nombre de grilles (plus = plus de trades, moins de profit par trade), et le montant par grille. Idéal pour les marchés en range/consolidation.",
        "Grid arithmétique : intervalles égaux en valeur absolue. Grid géométrique : intervalles égaux en pourcentage. Le géométrique est meilleur pour les grands ranges car il s'adapte proportionnellement.",
        "Risques du grid : si le prix sort du range par le bas, vous accumulez des pertes. Si le prix sort par le haut, vous manquez le mouvement. Le grid trading perd de l'argent en tendance forte — il est fait pour les ranges."
      ],
      keyPoints: [
        "Grid = acheter bas, vendre haut dans un range automatiquement",
        "Idéal pour les marchés en consolidation/range",
        "Arithmétique vs Géométrique selon la taille du range",
        "Perd de l'argent en tendance forte — uniquement pour les ranges"
      ],
      proTips: ["Utilisez le grid sur des paires stables (BTC/USDT) avec un range basé sur les S/R weekly"],
      commonMistakes: ["Lancer un grid bot juste avant un breakout majeur — le prix sort du range et vous accumulez des pertes"],
      example: "BTC range 90k$-100k$, 10 grilles. Le bot place des achats à 90k, 91k, 92k... et des ventes à 91k, 92k, 93k... Profit ~1% par oscillation complète."
    },
    {
      title: "Backtesting et Optimisation",
      content: [
        "Le backtesting simule votre stratégie sur des données historiques pour évaluer sa performance. Métriques clés : profit total, max drawdown, Sharpe ratio, win rate, nombre de trades, et profit factor.",
        "L'overfitting est le piège #1 du backtesting. Si vous optimisez trop vos paramètres sur les données passées, la stratégie ne fonctionnera pas en réel. Utilisez des données out-of-sample pour valider.",
        "Walk-forward analysis : optimisez sur une période, testez sur la suivante, répétez. C'est la méthode la plus robuste pour valider une stratégie. Si elle performe sur toutes les périodes, elle est probablement viable.",
        "Les frais, le slippage et la latence doivent être inclus dans le backtest. Un backtest sans frais est trompeur. Ajoutez 0.1% de frais par trade et 0.05% de slippage pour être réaliste."
      ],
      keyPoints: [
        "Backtesting = simuler sur données historiques",
        "Overfitting = optimiser trop = échec en réel",
        "Walk-forward analysis = méthode la plus robuste",
        "Inclure frais + slippage dans le backtest"
      ],
      proTips: ["Si votre backtest montre des résultats 'trop beaux', c'est probablement de l'overfitting"],
      commonMistakes: ["Backtester sans frais ni slippage — les résultats réels seront bien pires"],
      exercise: "Utilisez TradingView Pine Script pour backtester une stratégie simple : achat quand RSI < 30, vente quand RSI > 70, sur BTC daily. Notez le win rate et le profit factor."
    }
  ],
  quiz: [
    { question: "Le grid trading est idéal pour :", options: ["Les tendances fortes", "Les marchés en range", "Les crashs", "Les altseasons"], correct: 1 },
    { question: "Qu'est-ce que l'overfitting ?", options: ["Un bot trop rapide", "Optimiser trop sur les données passées", "Un type de grid", "Un indicateur technique"], correct: 1 },
    { question: "Que doit inclure un backtest réaliste ?", options: ["Uniquement le prix", "Frais et slippage", "Seulement les gains", "Les émotions"], correct: 1 },
    { question: "Quelle méthode valide le mieux une stratégie ?", options: ["Backtesting simple", "Walk-forward analysis", "Paper trading uniquement", "Intuition"], correct: 1 }
  ]
};

const m13l2: Lesson = {
  id: "m13-l2",
  title: "Arbitrage et Market Making",
  icon: "⚖️",
  duration: "45 min",
  description: "Stratégies avancées d'arbitrage et de market making en crypto.",
  subLessons: [
    {
      title: "Types d'Arbitrage Crypto",
      content: [
        "L'arbitrage spatial exploite les différences de prix entre exchanges. BTC à 95 000$ sur Binance et 95 200$ sur Coinbase → achat sur Binance, vente sur Coinbase = 200$ de profit. Nécessite du capital sur les deux exchanges.",
        "L'arbitrage triangulaire exploite les inefficiences entre 3 paires sur le même exchange. BTC/USDT → ETH/BTC → ETH/USDT. Si le cycle donne plus de USDT qu'au départ, il y a un profit d'arbitrage.",
        "L'arbitrage DeFi exploite les différences de prix entre DEX ou entre CEX et DEX. Les flash loans permettent de faire de l'arbitrage sans capital initial. Les MEV bots (Maximal Extractable Value) automatisent ces opportunités sur Ethereum.",
        "La réalité : l'arbitrage crypto est extrêmement compétitif. Les bots professionnels ont des latences de millisecondes. Les opportunités sont rares et les marges minuscules. Les frais de gas et de trading mangent souvent les profits."
      ],
      keyPoints: [
        "Arbitrage spatial : entre exchanges",
        "Arbitrage triangulaire : entre 3 paires",
        "Arbitrage DeFi : entre DEX, flash loans",
        "Très compétitif — les bots pro dominent"
      ],
      proTips: ["L'arbitrage est plus viable sur les altcoins à faible liquidité où les bots pro sont moins présents"],
      commonMistakes: ["Penser que l'arbitrage est de l'argent gratuit — les frais, le slippage et la concurrence réduisent drastiquement les profits"]
    },
    {
      title: "Market Making et Liquidité",
      content: [
        "Le market making consiste à placer simultanément des ordres d'achat et de vente pour profiter du spread (différence bid-ask). Le market maker fournit de la liquidité et gagne le spread à chaque transaction.",
        "Sur les CEX, les market makers professionnels utilisent des algorithmes sophistiqués pour ajuster leurs ordres en temps réel. Ils gèrent le risque d'inventaire (accumulation non désirée d'un côté) et le risque de marché.",
        "En DeFi, le market making se fait via les pools de liquidité (LP). Fournir de la liquidité sur Uniswap V3 avec des ranges serrés est une forme de market making. Les rendements dépendent du volume de trading et de l'IL.",
        "Le market making n'est PAS pour les débutants. Il nécessite un capital important, une infrastructure technique, et une compréhension approfondie de la microstructure des marchés."
      ],
      keyPoints: [
        "Market making = profiter du spread bid-ask",
        "Fournit de la liquidité au marché",
        "Risques : inventaire, marché, IL en DeFi",
        "Réservé aux professionnels avec infrastructure"
      ],
      proTips: ["Si vous voulez faire du market making passif, fournissez de la liquidité sur Uniswap V3 sur des paires majeures"],
      commonMistakes: ["Essayer de faire du market making actif sans infrastructure — vous serez toujours en retard sur les bots pro"]
    }
  ],
  quiz: [
    { question: "L'arbitrage spatial exploite :", options: ["Les différences de temps", "Les différences de prix entre exchanges", "Les tendances", "Les divergences RSI"], correct: 1 },
    { question: "Le market making profite du :", options: ["Mouvement de prix", "Spread bid-ask", "Volume", "Funding rate"], correct: 1 },
    { question: "Les flash loans permettent :", options: ["D'emprunter sans collatéral dans une transaction", "De trader sans frais", "D'éviter les liquidations", "De miner des tokens"], correct: 0 },
    { question: "L'arbitrage crypto est :", options: ["Facile et rentable", "Très compétitif avec des marges minuscules", "Illégal", "Réservé aux exchanges"], correct: 1 }
  ]
};

export const module13Lessons: Lesson[] = [m13l1, m13l2];
