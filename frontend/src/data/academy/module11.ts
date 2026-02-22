import { Lesson } from "./types";

const m11l1: Lesson = {
  id: "m11-l1",
  title: "DeFi Expliquée : AMM, Lending, Borrowing",
  icon: "🌐",
  duration: "50 min",
  description: "Comprendre les mécanismes fondamentaux de la finance décentralisée.",
  subLessons: [
    {
      title: "Qu'est-ce que la DeFi ?",
      content: [
        "La Finance Décentralisée (DeFi) est un écosystème de services financiers construits sur des blockchains publiques, principalement Ethereum. Contrairement à la finance traditionnelle (TradFi), la DeFi élimine les intermédiaires comme les banques, courtiers et assureurs en les remplaçant par des smart contracts auto-exécutants.",
        "La DeFi permet à quiconque possédant un wallet crypto d'accéder à des services financiers : prêts, emprunts, échanges, assurances, et produits dérivés. Pas de KYC, pas de restrictions géographiques, pas d'horaires d'ouverture — la DeFi fonctionne 24/7/365.",
        "La Total Value Locked (TVL) mesure le capital déposé dans les protocoles DeFi. Elle a dépassé 200 milliards de dollars au pic. Les principaux réseaux DeFi sont Ethereum, Arbitrum, Optimism, Base, Solana, et Avalanche.",
        "Les composants clés de la DeFi incluent : les DEX (échanges décentralisés), les protocoles de lending/borrowing, les stablecoins algorithmiques, les agrégateurs de rendement, les protocoles d'assurance décentralisée, et les bridges cross-chain."
      ],
      keyPoints: [
        "DeFi = services financiers sans intermédiaires via smart contracts",
        "Accessible à tous, 24/7, sans KYC",
        "TVL = indicateur clé de l'adoption DeFi",
        "Ethereum domine mais les L2 et alt-L1 gagnent du terrain"
      ],
      proTips: ["Commencez toujours par les protocoles les plus établis (TVL élevée, audités) avant d'explorer les nouveaux"],
      commonMistakes: ["Interagir avec des protocoles non audités attirés par des APY astronomiques"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/1e5733bc-855f-46b8-9432-a99a53ba0e71.png",
          alt: "DeFi Finance Décentralisée",
          caption: "La DeFi : services financiers décentralisés via smart contracts — lending, borrowing, AMM et yield farming"
        }
      ]
    },
    {
      title: "Les AMM (Automated Market Makers)",
      content: [
        "Les AMM sont le cœur des DEX. Contrairement aux carnets d'ordres traditionnels (CEX), les AMM utilisent des pools de liquidité et une formule mathématique pour déterminer les prix. La formule la plus courante est x * y = k (constant product), utilisée par Uniswap.",
        "Dans un pool AMM, deux tokens sont déposés en proportion égale (50/50 en valeur). Quand un trader achète le token A, il ajoute du token B au pool et retire du token A. Le prix s'ajuste automatiquement selon la formule.",
        "Le slippage est la différence entre le prix attendu et le prix d'exécution. Plus le pool est grand (liquidité profonde), moins le slippage est important. Pour les gros ordres, utilisez des agrégateurs comme 1inch ou Jupiter qui splitent l'ordre sur plusieurs pools.",
        "Les AMM concentrés (Uniswap V3, V4) permettent aux fournisseurs de liquidité de concentrer leur capital dans une fourchette de prix spécifique, améliorant l'efficacité du capital de 4000x par rapport aux AMM classiques."
      ],
      keyPoints: [
        "AMM = pools de liquidité + formule mathématique (x*y=k)",
        "Pas de carnet d'ordres, prix déterminé algorithmiquement",
        "Slippage dépend de la profondeur de liquidité",
        "AMM concentrés (V3) = efficacité du capital supérieure"
      ],
      proTips: ["Utilisez des agrégateurs (1inch, Jupiter) pour obtenir le meilleur prix sur les gros swaps"],
      commonMistakes: ["Swapper de gros montants sur des pools à faible liquidité — le slippage peut être énorme"],
      example: "Pool ETH/USDC avec 10M$ de liquidité. Swap de 100$ → slippage ~0.01%. Swap de 100 000$ → slippage ~1%. Swap de 1M$ → slippage ~10%."
    },
    {
      title: "Lending et Borrowing Décentralisés",
      content: [
        "Les protocoles de lending (Aave, Compound) permettent de prêter vos cryptos pour gagner des intérêts, ou d'emprunter en déposant un collatéral. Tout est géré par des smart contracts — pas de banquier, pas d'approbation manuelle.",
        "Le lending fonctionne avec un système de sur-collatéralisation. Pour emprunter 1000$ en USDC, vous devez déposer environ 1500$ en ETH (ratio de collatéral de 150%). Si la valeur de votre collatéral baisse sous le seuil de liquidation, votre position est automatiquement liquidée.",
        "Les taux d'intérêt sont dynamiques, basés sur l'utilisation du pool. Plus un pool est emprunté (utilisation élevée), plus les taux montent — incitant les prêteurs à déposer et les emprunteurs à rembourser.",
        "Les flash loans sont une innovation unique à la DeFi : emprunter n'importe quel montant sans collatéral, à condition de rembourser dans la même transaction. Utilisés pour l'arbitrage, la liquidation, et le refinancement."
      ],
      keyPoints: [
        "Lending = prêter pour gagner des intérêts",
        "Borrowing = emprunter avec sur-collatéralisation (150%+)",
        "Liquidation automatique si collatéral insuffisant",
        "Flash loans = emprunts sans collatéral dans une seule transaction"
      ],
      proTips: ["Maintenez un health factor > 2.0 sur Aave pour éviter les liquidations en cas de crash"],
      commonMistakes: ["Emprunter au maximum de sa capacité — une baisse de 10% du collatéral = liquidation"],
      exercise: "Allez sur Aave (testnet) et simulez un dépôt de 1 ETH, puis un emprunt de USDC. Observez le health factor et calculez à quel prix ETH vous seriez liquidé."
    },
    {
      title: "Stablecoins et Bridges",
      content: [
        "Les stablecoins sont essentiels en DeFi. USDT et USDC sont centralisés (backed par des réserves). DAI est décentralisé (backed par du collatéral crypto sur MakerDAO). Les stablecoins algorithmiques (comme feu UST/Luna) tentent de maintenir le peg par des mécanismes de marché — très risqués.",
        "Les bridges permettent de transférer des tokens entre blockchains. Les bridges officiels (Arbitrum Bridge, Optimism Bridge) sont les plus sûrs mais lents. Les bridges tiers (Stargate, Across) sont plus rapides mais ajoutent un risque de smart contract.",
        "La sécurité en DeFi est primordiale. Vérifiez toujours : les audits du protocole (Certik, Trail of Bits, OpenZeppelin), la TVL et l'historique, les permissions des smart contracts (revoke.cash), et n'approuvez jamais des montants illimités.",
        "Les agrégateurs de rendement (Yearn Finance, Beefy) automatisent les stratégies DeFi complexes : ils déposent, récoltent et réinvestissent automatiquement pour maximiser les rendements composés."
      ],
      keyPoints: [
        "USDT/USDC = centralisés, DAI = décentralisé",
        "Bridges : officiels (sûrs, lents) vs tiers (rapides, risqués)",
        "Toujours vérifier les audits et révoquer les approbations inutiles",
        "Agrégateurs de rendement automatisent les stratégies complexes"
      ],
      proTips: ["Utilisez revoke.cash régulièrement pour révoquer les approbations de smart contracts inutilisés"],
      commonMistakes: ["Approuver des montants illimités sur des protocoles inconnus — risque de drain total du wallet"]
    }
  ],
  quiz: [
    { question: "Quelle formule utilise un AMM classique ?", options: ["x + y = k", "x * y = k", "x / y = k", "x ^ y = k"], correct: 1 },
    { question: "Quel est le ratio de collatéral typique en lending DeFi ?", options: ["100%", "120%", "150%+", "50%"], correct: 2 },
    { question: "Qu'est-ce qu'un flash loan ?", options: ["Un prêt à taux fixe", "Un prêt remboursé dans la même transaction", "Un prêt à long terme", "Un prêt entre amis"], correct: 1 },
    { question: "Quel outil permet de révoquer les approbations de smart contracts ?", options: ["Etherscan", "revoke.cash", "CoinGecko", "TradingView"], correct: 1 }
  ]
};

const m11l2: Lesson = {
  id: "m11-l2",
  title: "Yield Farming et Liquidity Mining",
  icon: "🌾",
  duration: "45 min",
  description: "Maximiser les rendements en fournissant de la liquidité aux protocoles DeFi.",
  subLessons: [
    {
      title: "Principes du Yield Farming",
      content: [
        "Le Yield Farming consiste à déployer vos cryptos dans différents protocoles DeFi pour maximiser les rendements. C'est l'équivalent crypto de faire travailler votre argent, mais avec des rendements potentiellement bien supérieurs à la finance traditionnelle.",
        "Les sources de rendement incluent : les frais de trading (LP fees), les récompenses en tokens natifs (liquidity mining), les intérêts de lending, et le staking. Un yield farmer combine souvent plusieurs sources pour maximiser l'APY.",
        "L'APY (Annual Percentage Yield) inclut les intérêts composés, contrairement à l'APR (Annual Percentage Rate). Un APR de 100% avec composition quotidienne donne un APY de ~171%. La fréquence de composition est cruciale.",
        "Les stratégies de base : (1) Fournir de la liquidité sur un DEX et gagner les frais. (2) Déposer sur un protocole de lending. (3) Staker des tokens de gouvernance. (4) Utiliser des agrégateurs qui auto-composent."
      ],
      keyPoints: [
        "Yield Farming = déployer du capital pour maximiser les rendements",
        "Sources : LP fees, liquidity mining, lending, staking",
        "APY ≠ APR — la composition fait une énorme différence",
        "Agrégateurs auto-composent pour optimiser les rendements"
      ],
      proTips: ["Calculez toujours le rendement NET après frais de gas, impermanent loss et dépréciation du token de récompense"],
      commonMistakes: ["Se focaliser uniquement sur l'APY sans considérer les risques — un APY de 10000% signifie souvent que le token de récompense va s'effondrer"]
    },
    {
      title: "Stratégies de Yield Farming",
      content: [
        "Stratégie conservative : Fournir de la liquidité sur des paires stablecoin (USDC/USDT, USDC/DAI) sur des protocoles établis. APY 5-15%, risque faible, pas d'impermanent loss significatif.",
        "Stratégie modérée : LP sur des paires majeures (ETH/USDC, BTC/ETH) sur Uniswap V3 avec des ranges serrés. APY 20-50%, risque modéré d'impermanent loss, nécessite un rééquilibrage régulier.",
        "Stratégie agressive : Farming de nouveaux tokens sur des protocoles récents, leverage farming sur des protocoles comme Alpaca Finance. APY 100%+, mais risque élevé de rug pull, d'impermanent loss sévère, et de dépréciation du token.",
        "Le leverage farming multiplie vos rendements ET vos risques. Emprunter pour farmer peut amplifier les gains mais aussi les pertes. Une chute de 20% du token peut liquider votre position entière."
      ],
      keyPoints: [
        "Conservative : stablecoin pairs, 5-15% APY, risque faible",
        "Modérée : paires majeures, 20-50% APY, IL modéré",
        "Agressive : nouveaux tokens, 100%+ APY, risque élevé",
        "Leverage farming = rendements amplifiés mais risque de liquidation"
      ],
      proTips: ["Commencez par des stratégies conservatives et augmentez progressivement la complexité"],
      commonMistakes: ["Mettre tout son capital dans une seule farm agressive"]
    },
    {
      title: "Liquidity Mining et Incentives",
      content: [
        "Le Liquidity Mining est un mécanisme où les protocoles distribuent leurs tokens natifs aux fournisseurs de liquidité pour attirer du capital. C'est ainsi que de nombreux protocoles DeFi ont bootstrappé leur liquidité initiale.",
        "Le cycle typique : lancement du token → APY très élevé (1000%+) → afflux de capital → APY diminue → les mercenaires du capital partent → TVL baisse. Les protocoles durables sont ceux qui génèrent des revenus réels au-delà des incentives.",
        "Les ve-tokenomics (vote-escrowed) tentent de résoudre ce problème. En lockant vos tokens plus longtemps, vous obtenez plus de pouvoir de vote et de récompenses. Curve (veCRV) a popularisé ce modèle, créant les 'Curve Wars'.",
        "Évaluez un programme de liquidity mining : durée des incentives, émission totale, vesting des récompenses, utilité du token au-delà du farming, revenus réels du protocole vs émissions."
      ],
      keyPoints: [
        "Liquidity Mining = distribution de tokens pour attirer la liquidité",
        "APY élevé au début puis diminue — capital mercenaire",
        "ve-tokenomics pour inciter le lock long terme",
        "Revenus réels > émissions de tokens = protocole durable"
      ],
      proTips: ["Vendez régulièrement les tokens de récompense si vous n'êtes pas convaincu par le projet à long terme"],
      commonMistakes: ["Accumuler des tokens de farming sans les vendre — ils perdent souvent 90%+ de valeur"]
    }
  ],
  quiz: [
    { question: "Quelle est la différence entre APY et APR ?", options: ["Aucune", "APY inclut les intérêts composés", "APR est toujours plus élevé", "APY est pour le staking uniquement"], correct: 1 },
    { question: "Une stratégie de yield farming conservative utilise :", options: ["Des meme coins", "Des paires stablecoin", "Du leverage 10x", "Des tokens non audités"], correct: 1 },
    { question: "Que signifie ve-tokenomics ?", options: ["Very efficient tokenomics", "Vote-escrowed tokenomics", "Verified tokenomics", "Virtual economy tokenomics"], correct: 1 },
    { question: "Un APY de 10000% indique généralement :", options: ["Un excellent investissement", "Un protocole très sûr", "Une forte émission de tokens qui va se déprécier", "Un rendement garanti"], correct: 2 }
  ]
};

const m11l3: Lesson = {
  id: "m11-l3",
  title: "Impermanent Loss et Risques DeFi",
  icon: "⚠️",
  duration: "45 min",
  description: "Comprendre et gérer les risques spécifiques à la finance décentralisée.",
  subLessons: [
    {
      title: "L'Impermanent Loss en Détail",
      content: [
        "L'Impermanent Loss (IL) est la perte subie par un fournisseur de liquidité par rapport à simplement détenir les tokens. Elle se produit quand le ratio de prix entre les deux tokens d'un pool change par rapport au moment du dépôt.",
        "Formule simplifiée : si le prix d'un token double, l'IL est d'environ 5.7%. Si le prix triple, l'IL est d'environ 13.4%. Si le prix fait x5, l'IL est d'environ 25.5%. L'IL est 'impermanente' car elle disparaît si les prix reviennent au ratio initial.",
        "L'IL est symétrique : que le token monte ou baisse par rapport à l'autre, vous subissez une perte. Plus la divergence de prix est grande, plus l'IL est importante. Les paires de tokens corrélés (ETH/stETH) ont très peu d'IL.",
        "Sur Uniswap V3 avec des ranges concentrés, l'IL est amplifiée car votre liquidité est concentrée. Un range de ±10% peut subir une IL 10x supérieure à un pool V2 classique si le prix sort du range."
      ],
      keyPoints: [
        "IL = perte vs simplement détenir les tokens",
        "Prix x2 → IL ~5.7%, Prix x3 → IL ~13.4%",
        "Impermanente si les prix reviennent au ratio initial",
        "Ranges concentrés (V3) amplifient l'IL"
      ],
      proTips: ["Utilisez des calculateurs d'IL (dailydefi.org/tools/impermanent-loss-calculator) avant de fournir de la liquidité"],
      commonMistakes: ["Ignorer l'IL et ne regarder que l'APY — les frais gagnés doivent compenser l'IL"],
      example: "Vous déposez 1 ETH + 3000 USDC (ETH = 3000$). ETH monte à 4000$. Sans LP : 1 ETH (4000$) + 3000 USDC = 7000$. Avec LP : ~6 928$ (IL = ~1%). ETH monte à 6000$ : sans LP = 9000$, avec LP = ~8 485$ (IL = ~5.7%)."
    },
    {
      title: "Risques de Smart Contracts",
      content: [
        "Les smart contracts sont du code, et le code peut avoir des bugs. Les hacks DeFi ont causé des milliards de dollars de pertes. Les vecteurs d'attaque incluent : reentrancy attacks, flash loan attacks, oracle manipulation, et logic bugs.",
        "Les audits de sécurité (Trail of Bits, OpenZeppelin, Certik) réduisent mais n'éliminent pas les risques. Même des protocoles audités ont été hackés. Les bug bounties (Immunefi) incitent les white hats à trouver les vulnérabilités.",
        "Les risques d'oracle : les protocoles DeFi dépendent d'oracles (Chainlink, Pyth) pour les prix. Si l'oracle est manipulé, les liquidations et les swaps peuvent être exploités. Chainlink est le standard de l'industrie.",
        "Mesures de protection : (1) N'investissez que ce que vous pouvez perdre. (2) Diversifiez entre protocoles. (3) Vérifiez les audits. (4) Utilisez des protocoles avec un track record. (5) Surveillez les alertes de sécurité (DeFi Llama, Rekt News)."
      ],
      keyPoints: [
        "Les smart contracts peuvent avoir des bugs exploitables",
        "Audits réduisent mais n'éliminent pas les risques",
        "Oracles (Chainlink) = point critique de sécurité",
        "Diversifier entre protocoles pour limiter l'exposition"
      ],
      proTips: ["Suivez @DeFiLlama et @RektHQ sur Twitter pour les alertes de sécurité en temps réel"],
      commonMistakes: ["Penser qu'un protocole est 100% sûr parce qu'il est audité"]
    },
    {
      title: "Rug Pulls et Arnaques DeFi",
      content: [
        "Un rug pull se produit quand les développeurs d'un protocole retirent toute la liquidité ou exploitent une backdoor dans le code, volant les fonds des utilisateurs. C'est l'arnaque la plus courante en DeFi.",
        "Red flags d'un rug pull : équipe anonyme sans track record, code non vérifié sur Etherscan, pas d'audit, liquidité non lockée, fonctions admin dangereuses (mint illimité, pause, blacklist), APY irréaliste (10000%+).",
        "Les honeypots sont des tokens que vous pouvez acheter mais pas vendre. Le smart contract bloque les ventes sauf pour le créateur. Vérifiez toujours sur honeypot.is ou tokensniffer.com avant d'acheter un nouveau token.",
        "Protection : (1) Vérifiez le code sur Etherscan (vérifié et renoncé). (2) Vérifiez la liquidité lockée (Team Finance, Unicrypt). (3) Recherchez l'équipe. (4) Commencez avec un petit montant. (5) Si c'est trop beau pour être vrai, c'est probablement une arnaque."
      ],
      keyPoints: [
        "Rug pull = développeurs volent la liquidité",
        "Red flags : anonyme, non audité, APY irréaliste, liquidité non lockée",
        "Honeypots : tokens qu'on peut acheter mais pas vendre",
        "Toujours vérifier sur tokensniffer.com et honeypot.is"
      ],
      proTips: ["Règle d'or : si un inconnu vous DM pour un 'investissement', c'est TOUJOURS une arnaque"],
      commonMistakes: ["Investir dans un token uniquement parce qu'il monte — les rug pulls montent aussi avant de crasher à zéro"]
    }
  ],
  quiz: [
    { question: "Si le prix d'un token double dans un pool, l'IL est d'environ :", options: ["0%", "5.7%", "25%", "50%"], correct: 1 },
    { question: "Quel est le principal risque des smart contracts ?", options: ["Ils sont trop lents", "Ils peuvent avoir des bugs exploitables", "Ils coûtent trop cher", "Ils sont centralisés"], correct: 1 },
    { question: "Qu'est-ce qu'un honeypot ?", options: ["Un wallet sécurisé", "Un token qu'on peut acheter mais pas vendre", "Un type de staking", "Un bridge cross-chain"], correct: 1 },
    { question: "Comment vérifier si la liquidité est lockée ?", options: ["Demander au développeur", "Vérifier sur Team Finance/Unicrypt", "Regarder le prix", "Impossible à vérifier"], correct: 1 }
  ]
};

const m11l4: Lesson = {
  id: "m11-l4",
  title: "Protocoles DeFi Majeurs",
  icon: "🏗️",
  duration: "50 min",
  description: "Maîtriser Uniswap, Aave, Curve, Lido et les protocoles incontournables.",
  subLessons: [
    {
      title: "Uniswap : Le Roi des DEX",
      content: [
        "Uniswap est le DEX le plus utilisé avec plus de 1.5 trillion de dollars de volume cumulé. Lancé en 2018 par Hayden Adams, il a révolutionné les échanges décentralisés avec le modèle AMM.",
        "Uniswap V3 a introduit la liquidité concentrée, permettant aux LP de choisir une fourchette de prix. Cela améliore l'efficacité du capital mais nécessite une gestion active. V4 apporte les 'hooks' pour personnaliser les pools.",
        "Le token UNI est un token de gouvernance qui donne un droit de vote sur les propositions du protocole. Le 'fee switch' permettrait de redistribuer une partie des frais aux holders de UNI — un catalyseur potentiel majeur.",
        "Pour utiliser Uniswap : connectez votre wallet (MetaMask, Rainbow), sélectionnez les tokens, vérifiez le slippage (0.5% pour les majeurs, 1-5% pour les petits tokens), et confirmez la transaction."
      ],
      keyPoints: [
        "Uniswap = DEX #1, modèle AMM révolutionnaire",
        "V3 : liquidité concentrée, efficacité du capital améliorée",
        "UNI = gouvernance, fee switch = catalyseur potentiel",
        "Toujours vérifier le slippage avant de swapper"
      ],
      proTips: ["Utilisez Uniswap sur les L2 (Arbitrum, Base) pour des frais 10-50x moins élevés"],
      commonMistakes: ["Swapper sur Ethereum mainnet pour de petits montants — les frais de gas peuvent dépasser le montant échangé"]
    },
    {
      title: "Aave : Le Protocole de Lending #1",
      content: [
        "Aave est le protocole de lending/borrowing décentralisé le plus utilisé avec plus de 20 milliards de TVL. Il permet de prêter et emprunter une large gamme de cryptos sur plusieurs chaînes.",
        "Le Health Factor est l'indicateur clé sur Aave. HF > 1 = safe, HF < 1 = liquidation. Maintenez un HF > 2.0 pour une marge de sécurité confortable. Aave V3 a introduit l'e-mode pour des ratios de collatéral optimisés sur les actifs corrélés.",
        "Les taux variables fluctuent selon l'utilisation du pool. Les taux stables (disponibles sur certains actifs) offrent une prévisibilité. Le GHO est le stablecoin natif d'Aave, backed par les collatéraux du protocole.",
        "Stratégies avancées sur Aave : (1) Déposer ETH, emprunter USDC, acheter plus d'ETH = levier long. (2) Déposer stablecoins pour un rendement safe. (3) Utiliser l'e-mode pour maximiser l'emprunt sur les actifs corrélés."
      ],
      keyPoints: [
        "Aave = lending #1, 20B+ TVL",
        "Health Factor > 2.0 recommandé",
        "E-mode pour les actifs corrélés (ETH/stETH)",
        "GHO = stablecoin natif d'Aave"
      ],
      proTips: ["Configurez des alertes de Health Factor avec DeFi Saver pour éviter les liquidations"],
      commonMistakes: ["Emprunter au maximum sans marge — un flash crash de 15% peut vous liquider"]
    },
    {
      title: "Curve, Lido et Autres Protocoles Clés",
      content: [
        "Curve Finance est optimisé pour les swaps de stablecoins et d'actifs similaires (stETH/ETH). Son algorithme StableSwap offre un slippage minimal sur ces paires. Le modèle veCRV a créé les 'Curve Wars' où les protocoles se battent pour diriger les émissions.",
        "Lido est le protocole de liquid staking #1 pour Ethereum. Déposez ETH, recevez stETH qui génère ~3-4% APY tout en restant liquide. stETH peut être utilisé comme collatéral sur Aave, créant un rendement composé.",
        "Pendle Finance tokenise les rendements futurs, permettant de trader le yield. Vous pouvez acheter du yield à prix réduit ou vendre votre yield futur pour un paiement immédiat. Innovant pour les stratégies de taux fixe.",
        "Eigenlayer introduit le restaking : réutiliser votre ETH staké pour sécuriser d'autres protocoles et gagner des rendements supplémentaires. Points et airdrops potentiels en font un protocole très suivi."
      ],
      keyPoints: [
        "Curve = optimisé pour stablecoins, veCRV = gouvernance",
        "Lido = liquid staking ETH, stETH utilisable en DeFi",
        "Pendle = tokenisation du yield, stratégies de taux fixe",
        "Eigenlayer = restaking pour rendements additionnels"
      ],
      proTips: ["Le combo Lido (stETH) + Aave (collatéral) + farming est une stratégie populaire et relativement safe"],
      commonMistakes: ["Ignorer le risque de dépeg du stETH — en juin 2022, stETH a temporairement perdu son peg"]
    }
  ],
  quiz: [
    { question: "Quelle innovation a apporté Uniswap V3 ?", options: ["Flash loans", "Liquidité concentrée", "Stablecoins", "Bridges"], correct: 1 },
    { question: "Quel Health Factor maintenir sur Aave ?", options: ["< 1", "> 1.1", "> 2.0", "> 10"], correct: 2 },
    { question: "Curve Finance est optimisé pour :", options: ["Les meme coins", "Les NFTs", "Les swaps de stablecoins", "Le leverage trading"], correct: 2 },
    { question: "Que permet Lido ?", options: ["Le trading de futures", "Le liquid staking d'ETH", "La création de NFTs", "Le lending de BTC"], correct: 1 }
  ]
};

export const module11Lessons: Lesson[] = [m11l1, m11l2, m11l3, m11l4];
