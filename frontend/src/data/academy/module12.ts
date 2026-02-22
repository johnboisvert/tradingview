import { Lesson } from "./types";

const m12l1: Lesson = {
  id: "m12-l1",
  title: "Analyse On-Chain Avancée",
  icon: "⛓️",
  duration: "55 min",
  description: "Utiliser les données blockchain pour anticiper les mouvements du marché.",
  subLessons: [
    {
      title: "MVRV, NUPL et Indicateurs de Cycle",
      content: [
        "Le MVRV (Market Value to Realized Value) compare la capitalisation boursière à la valeur réalisée (prix moyen d'achat de tous les BTC). MVRV > 3.5 = euphorie, zone de distribution. MVRV < 1 = capitulation, zone d'accumulation historique.",
        "Le NUPL (Net Unrealized Profit/Loss) mesure le profit ou la perte non réalisé de l'ensemble du réseau. NUPL > 0.75 = euphorie extrême (vendre). NUPL < 0 = capitulation (acheter). C'est l'un des indicateurs de cycle les plus fiables.",
        "Le Puell Multiple compare les revenus quotidiens des mineurs à leur moyenne sur 365 jours. Puell > 4 = mineurs très rentables, risque de vente massive. Puell < 0.5 = mineurs en difficulté, capitulation proche du bottom.",
        "Le Stock-to-Flow modélise la rareté de Bitcoin en comparant le stock existant au flux de production. Après chaque halving, le S2F double, historiquement suivi d'une hausse majeure. Controversé mais utile comme référence."
      ],
      keyPoints: [
        "MVRV > 3.5 = euphorie, < 1 = capitulation",
        "NUPL > 0.75 = sommet, < 0 = creux",
        "Puell Multiple pour le comportement des mineurs",
        "Combiner plusieurs indicateurs pour confirmer le cycle"
      ],
      proTips: ["Utilisez Glassnode ou CryptoQuant pour accéder aux données on-chain en temps réel"],
      commonMistakes: ["Se fier à un seul indicateur on-chain — utilisez-en au moins 3 en confluence"],
      example: "En novembre 2021 (ATH BTC ~69k$) : MVRV = 3.1, NUPL = 0.72, Puell = 2.8. Tous signalaient une zone de distribution. En novembre 2022 (bottom ~15.5k$) : MVRV = 0.8, NUPL = -0.15. Zone d'accumulation confirmée.",
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/3f7db08d-0fec-40a7-be30-db1c3a9d319c.png",
          alt: "Analyse On-Chain",
          caption: "Indicateurs on-chain : MVRV, NUPL, Exchange Flows — des données blockchain pour anticiper les mouvements du marché"
        }
      ]
    },
    {
      title: "Exchange Flows et Whale Tracking",
      content: [
        "Les Exchange Inflows (dépôts sur les exchanges) indiquent une intention de vente. Les Exchange Outflows (retraits) indiquent une accumulation long terme. Une baisse continue des réserves d'exchange est structurellement haussière.",
        "Le Whale Tracking suit les mouvements des gros portefeuilles (>1000 BTC). Quand les whales accumulent pendant que le prix baisse, c'est un signal d'accumulation smart money. Quand elles envoient sur les exchanges, attention à la pression vendeuse.",
        "Les données de Spent Output Profit Ratio (SOPR) montrent si les coins déplacés sont en profit ou en perte. SOPR > 1 = profit, < 1 = perte. Un SOPR qui passe sous 1 en bull market = opportunité d'achat (holders en perte vendent par panique).",
        "Les Coin Days Destroyed (CDD) mesurent l'activité des vieux coins. Un pic de CDD signifie que des coins dormants depuis longtemps bougent — souvent un signal de distribution par les early adopters."
      ],
      keyPoints: [
        "Exchange Inflows = pression vendeuse, Outflows = accumulation",
        "Whale tracking : suivre les >1000 BTC",
        "SOPR < 1 en bull = opportunité d'achat",
        "CDD élevé = vieux coins bougent (distribution potentielle)"
      ],
      proTips: ["Configurez des alertes Whale Alert sur Telegram pour les mouvements > 1000 BTC"],
      commonMistakes: ["Paniquer à chaque mouvement de whale — certains sont des transferts internes entre wallets"]
    },
    {
      title: "Analyse des Stablecoins et Liquidité",
      content: [
        "La Supply de stablecoins est un indicateur de liquidité. Une augmentation de la supply USDT/USDC = nouveau capital entrant dans le marché crypto = haussier. Une diminution = capital sortant = baissier.",
        "Le Stablecoin Supply Ratio (SSR) compare la capitalisation BTC à la supply totale de stablecoins. SSR bas = beaucoup de 'poudre sèche' prête à acheter = haussier. SSR élevé = peu de capital en attente.",
        "Les flux de stablecoins vers les exchanges indiquent une intention d'achat. Des flux massifs de USDT vers Binance précèdent souvent des rallyes. Inversement, des stablecoins quittant les exchanges = moins de pression acheteuse.",
        "Le Tether Premium/Discount sur les marchés OTC asiatiques est un indicateur de demande régionale. Un premium indique une forte demande d'achat en Asie, souvent corrélé avec des rallyes."
      ],
      keyPoints: [
        "Supply stablecoins en hausse = nouveau capital = haussier",
        "SSR bas = beaucoup de poudre sèche",
        "Stablecoins vers exchanges = intention d'achat",
        "Tether Premium OTC = demande asiatique"
      ],
      proTips: ["Surveillez la supply de USDT sur Tron — c'est le réseau le plus utilisé pour les transferts OTC"],
      commonMistakes: ["Ignorer les métriques de stablecoins — elles sont parmi les meilleurs indicateurs de liquidité"]
    },
    {
      title: "Outils et Plateformes On-Chain",
      content: [
        "Glassnode est la référence pour l'analyse on-chain Bitcoin et Ethereum. Offre des centaines de métriques, des dashboards personnalisables et des alertes. Version gratuite limitée, pro à partir de 39$/mois.",
        "CryptoQuant offre des données on-chain avec un focus sur les exchange flows, les données de mineurs et les indicateurs de cycle. Interface intuitive et alertes communautaires. Bon rapport qualité/prix.",
        "Dune Analytics permet de créer des requêtes SQL personnalisées sur les données blockchain. Gratuit et open-source. Idéal pour analyser des protocoles DeFi spécifiques, des NFTs, ou créer vos propres dashboards.",
        "Autres outils essentiels : Nansen (whale tracking et smart money), Arkham Intelligence (identification des wallets), DefiLlama (TVL et données DeFi), Token Terminal (revenus des protocoles)."
      ],
      keyPoints: [
        "Glassnode = référence on-chain (BTC/ETH)",
        "CryptoQuant = exchange flows et mineurs",
        "Dune Analytics = requêtes personnalisées gratuites",
        "Nansen/Arkham = whale tracking avancé"
      ],
      proTips: ["Commencez par les dashboards gratuits de CryptoQuant et Dune avant d'investir dans un abonnement Glassnode"],
      exercise: "Créez un dashboard sur Dune Analytics qui suit les exchange inflows/outflows de BTC sur les 30 derniers jours. Comparez avec l'évolution du prix."
    }
  ],
  quiz: [
    { question: "MVRV < 1 indique :", options: ["Euphorie", "Capitulation / zone d'achat", "Neutre", "Forte volatilité"], correct: 1 },
    { question: "Des Exchange Outflows massifs signalent :", options: ["Pression vendeuse", "Accumulation long terme", "Liquidations", "Panique"], correct: 1 },
    { question: "Le SSR bas signifie :", options: ["Peu de liquidité", "Beaucoup de poudre sèche prête à acheter", "Marché baissier", "Stablecoins en danger"], correct: 1 },
    { question: "Quel outil permet des requêtes SQL sur la blockchain ?", options: ["Glassnode", "CryptoQuant", "Dune Analytics", "TradingView"], correct: 2 }
  ]
};

const m12l2: Lesson = {
  id: "m12-l2",
  title: "Tokenomics Avancée",
  icon: "🔬",
  duration: "50 min",
  description: "Évaluer la viabilité économique d'un projet crypto en profondeur.",
  subLessons: [
    {
      title: "Supply Dynamics et Inflation",
      content: [
        "La supply dynamics est cruciale pour évaluer un token. Circulating Supply (en circulation), Total Supply (créée), Max Supply (maximum possible). Le ratio Circulating/Max indique la dilution future potentielle.",
        "L'inflation est le taux d'émission de nouveaux tokens. Bitcoin : ~1.7%/an (décroissant). Ethereum post-Merge : ~0% à déflationniste. Solana : ~5.5%/an. Une inflation élevée sans utilité = pression vendeuse constante.",
        "Les mécanismes de burn détruisent des tokens, réduisant la supply. Ethereum brûle une partie des frais de gas (EIP-1559). BNB fait des burns trimestriels. Un burn rate > émission = token déflationniste = structurellement haussier.",
        "Le FDV (Fully Diluted Valuation) = prix × max supply. Si le market cap est 100M$ mais le FDV est 10B$, il y a 100x de dilution potentielle. Méfiez-vous des tokens avec FDV >> market cap."
      ],
      keyPoints: [
        "Circulating vs Total vs Max Supply",
        "Inflation élevée sans utilité = pression vendeuse",
        "Burn rate > émission = déflationniste = haussier",
        "FDV >> Market Cap = dilution massive à venir"
      ],
      proTips: ["Vérifiez le ratio FDV/Market Cap — s'il est > 10x, la dilution sera significative"],
      commonMistakes: ["Ignorer le FDV et ne regarder que le market cap — vous sous-estimez la dilution future"]
    },
    {
      title: "Vesting, Unlocks et Distribution",
      content: [
        "Le vesting schedule définit quand les tokens alloués aux fondateurs, investisseurs et équipe sont débloqués. Un bon vesting : cliff de 1 an minimum, vesting linéaire sur 3-4 ans. Mauvais : pas de cliff, unlock massif à court terme.",
        "Les token unlocks créent une pression vendeuse prévisible. Un unlock de 10% de la supply en un mois peut faire chuter le prix de 20-30%. Consultez token.unlocks.app pour les calendriers d'unlock.",
        "La distribution initiale révèle les incentives. Idéal : >50% communauté, <20% équipe, <20% investisseurs. Red flag : >40% équipe/investisseurs, vesting court, pas de lock communautaire.",
        "Les airdrops distribuent des tokens gratuits aux early adopters. Stratégie d'airdrop farming : utilisez les protocoles early, fournissez de la liquidité, participez à la gouvernance. Mais attention aux taxes et à la dilution post-airdrop."
      ],
      keyPoints: [
        "Bon vesting : cliff 1 an + vesting 3-4 ans",
        "Token unlocks = pression vendeuse prévisible",
        "Distribution idéale : >50% communauté",
        "Airdrops : opportunité mais attention à la dilution"
      ],
      proTips: ["Vendez avant les gros unlocks et rachetez après la pression vendeuse — pattern récurrent"],
      commonMistakes: ["Acheter juste avant un gros token unlock — la pression vendeuse est quasi-garantie"],
      example: "Token X : 1B total supply, 100M en circulation (10%). Unlock de 200M dans 3 mois pour les investisseurs seed. La supply va tripler → pression vendeuse massive probable."
    },
    {
      title: "Modèles de Revenus et Valuation",
      content: [
        "Les protocoles DeFi génèrent des revenus réels : frais de trading (Uniswap), intérêts (Aave), frais de liquidation (MakerDAO). Token Terminal permet de comparer les revenus des protocoles.",
        "Le ratio Price/Revenue (P/R) compare la valorisation aux revenus. Un P/R de 10 signifie que le marché valorise le protocole à 10x ses revenus annuels. Comparez avec les pairs du même secteur.",
        "Le Price/Fees (P/F) est similaire mais utilise les frais totaux générés. Un protocole avec des frais élevés et un P/F bas est potentiellement sous-évalué. Attention : les frais ne sont pas toujours redistribués aux holders.",
        "L'analyse fondamentale crypto combine : tokenomics (supply, distribution, utilité), métriques financières (revenus, TVL, users), avantage compétitif (moat), équipe et écosystème, et narrative/timing de marché."
      ],
      keyPoints: [
        "Revenus réels > émissions de tokens",
        "P/R et P/F pour comparer les valorisations",
        "Token Terminal = Bloomberg de la crypto",
        "Analyse fondamentale = tokenomics + financier + qualitatif"
      ],
      proTips: ["Investissez dans les protocoles qui génèrent des revenus réels et les redistribuent aux holders"],
      commonMistakes: ["Investir dans un token sans utilité ni revenus uniquement sur la hype"],
      exercise: "Comparez 3 protocoles DeFi sur Token Terminal : Uniswap, Aave, Lido. Analysez leurs revenus, P/R, TVL et croissance. Lequel offre le meilleur rapport qualité/prix ?"
    }
  ],
  quiz: [
    { question: "Un token avec FDV 50x le market cap indique :", options: ["Un bon investissement", "Une dilution massive à venir", "Un token déflationniste", "Un faible risque"], correct: 1 },
    { question: "Quel est un bon cliff pour le vesting de l'équipe ?", options: ["Pas de cliff", "1 mois", "1 an minimum", "5 ans"], correct: 2 },
    { question: "Le ratio P/R compare :", options: ["Prix et risque", "Valorisation et revenus", "Profit et rendement", "Performance et résistance"], correct: 1 },
    { question: "Où vérifier les calendriers de token unlock ?", options: ["CoinGecko", "token.unlocks.app", "Etherscan", "Twitter"], correct: 1 }
  ]
};

export const module12Lessons: Lesson[] = [m12l1, m12l2];
