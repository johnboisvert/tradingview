import { Lesson } from "./types";

const m4l1: Lesson = {
  id: "m4-l1",
  title: "Stratégies d'Achat Spot",
  icon: "💰",
  duration: "45 min",
  description: "DCA, Lump Sum, Value Averaging — les meilleures stratégies d'achat spot.",
  subLessons: [
    {
      title: "DCA (Dollar Cost Averaging)",
      content: [
        "Le DCA consiste à investir un montant fixe à intervalles réguliers (hebdomadaire, mensuel), quel que soit le prix du marché. Cette stratégie élimine le stress du timing et la paralysie de l'analyse. Vous achetez automatiquement plus d'unités quand le prix est bas et moins quand il est haut.",
        "Historiquement, le DCA sur BTC et ETH sur une période de 4+ ans a surperformé 95% des traders actifs. La raison est simple : la majorité des traders perdent de l'argent à cause des émotions et du mauvais timing, tandis que le DCA est mécanique et discipliné.",
        "Le DCA intelligent améliore la stratégie de base : investissez PLUS quand le marché est en survente (RSI monthly < 30, MVRV < 1) et MOINS quand il est en surachat (RSI monthly > 70, MVRV > 3). Par exemple : montant normal × 2 en survente, montant normal × 0.5 en surachat. Cela améliore significativement le prix moyen d'achat.",
        "Avantages du DCA : discipline automatique, pas d'émotion, frais minimaux, simple à mettre en place. Inconvénient : sous-optimal si le marché monte en ligne droite (rare en pratique). Le DCA est la stratégie #1 recommandée pour les débutants ET pour beaucoup de professionnels qui ne veulent pas trader activement.",
      ],
      keyPoints: [
        "Montant fixe à intervalles réguliers, quel que soit le prix",
        "DCA intelligent : plus en survente, moins en surachat",
        "Bat 95% des traders actifs sur 4+ ans historiquement",
        "Stratégie #1 pour débutants et investisseurs passifs",
      ],
      proTips: ["N'arrêtez JAMAIS le DCA en bear market — c'est paradoxalement le meilleur moment pour accumuler car les prix sont au plus bas"],
      commonMistakes: ["Arrêter le DCA par peur en bear market — c'est exactement le moment où vous devriez investir le plus"],
    },
    {
      title: "Lump Sum vs DCA",
      content: [
        "Le Lump Sum consiste à investir tout son capital d'un coup. Statistiquement, le lump sum bat le DCA environ 66% du temps car les marchés montent plus souvent qu'ils ne baissent. Si vous avez une somme disponible et un horizon long terme, le lump sum est mathématiquement optimal.",
        "Cependant, le DCA est psychologiquement beaucoup plus facile à supporter. Il protège contre le risque de timing catastrophique (investir tout au sommet absolu). Le DCA réduit considérablement le regret et le stress émotionnel, ce qui est crucial pour maintenir sa stratégie sur le long terme.",
        "Le compromis optimal pour la plupart des investisseurs : investissez 50% en lump sum immédiatement, puis DCA les 50% restants sur 3 à 6 mois. Vous captez la tendance haussière statistiquement probable tout en réduisant le risque de timing. C'est le meilleur des deux mondes.",
        "Le facteur le plus important n'est pas QUAND vous investissez mais COMBIEN DE TEMPS vous restez investi. Le temps dans le marché bat le timing du marché dans la grande majorité des cas. Le meilleur moment pour investir était hier, le deuxième meilleur moment est aujourd'hui.",
      ],
      keyPoints: [
        "Lump sum bat DCA 66% du temps statistiquement",
        "DCA = psychologiquement plus facile et moins stressant",
        "Compromis optimal : 50% lump sum + 50% DCA sur 3-6 mois",
        "Le temps dans le marché > le timing du marché",
      ],
      proTips: ["Si vous hésitez entre lump sum et DCA, le compromis 50/50 est la meilleure solution — il combine les avantages des deux approches"],
      commonMistakes: ["Attendre le 'moment parfait' pour investir — il n'existe pas et vous risquez de ne jamais investir"],
    },
    {
      title: "Value Averaging",
      content: [
        "Le Value Averaging (VA) fixe un objectif de croissance mensuel du portefeuille plutôt qu'un montant d'investissement fixe. Si le marché baisse, vous investissez plus pour atteindre l'objectif. Si le marché monte fortement, vous investissez moins (ou même vendez un peu).",
        "Exemple concret : objectif de croissance +500$/mois. Mois 1 : portefeuille = 0$, investir 500$ (objectif : 500$). Mois 2 : portefeuille vaut 450$ (baisse), investir 550$ pour atteindre l'objectif de 1 000$. Mois 3 : portefeuille vaut 1 200$ (hausse), investir seulement 300$ pour atteindre 1 500$.",
        "Le VA surperforme le DCA en moyenne car il force mécaniquement à acheter plus quand les prix sont bas et moins quand ils sont hauts. C'est une forme automatisée de 'buy low, sell high'. Des études académiques montrent un avantage de 0.5-1.5% annuel par rapport au DCA classique.",
        "Inconvénients du VA : plus complexe à exécuter que le DCA, nécessite un suivi régulier et un tableur de calcul, et surtout nécessite d'avoir des liquidités supplémentaires disponibles pour les mois de forte baisse où l'investissement requis est plus élevé que la normale.",
      ],
      keyPoints: [
        "Objectif de croissance fixe du portefeuille chaque mois",
        "Investir plus en baisse, moins en hausse — automatiquement",
        "Surperforme le DCA de 0.5-1.5% annuel en moyenne",
        "Plus complexe mais plus rentable que le DCA classique",
      ],
      proTips: ["Automatisez le Value Averaging avec un spreadsheet Google Sheets — calculez automatiquement le montant à investir chaque mois"],
      commonMistakes: ["Ne pas avoir assez de liquidités de réserve pour les mois de forte baisse — prévoyez 2-3x le montant normal en réserve"],
      exercise: "Simulez 12 mois de DCA (500$/mois fixe) vs Value Averaging (objectif +500$/mois) sur les données historiques de BTC. Comparez le prix moyen d'achat et le rendement final.",
    },
  ],
  quiz: [
    { question: "Le DCA consiste à :", options: ["Tout investir d'un coup", "Montant fixe à intervalles réguliers", "Acheter uniquement en baisse", "Vendre à chaque hausse"], correct: 1 },
    { question: "Le Lump Sum bat le DCA :", options: ["Toujours", "Jamais", "66% du temps", "50% du temps"], correct: 2 },
    { question: "Le Value Averaging :", options: ["Investit un montant fixe chaque mois", "Fixe un objectif de croissance du portefeuille", "N'investit qu'en hausse", "Ne vend jamais"], correct: 1 },
    { question: "Le compromis optimal est :", options: ["100% lump sum", "100% DCA", "50% lump sum + 50% DCA", "Attendre le creux"], correct: 2 },
  ],
};

const m4l2: Lesson = {
  id: "m4-l2",
  title: "Gestion de Portefeuille Spot",
  icon: "📋",
  duration: "50 min",
  description: "Allocation, rééquilibrage, diversification et suivi de portefeuille crypto.",
  subLessons: [
    {
      title: "Allocation de Portefeuille",
      content: [
        "L'allocation conservatrice convient aux investisseurs prudents et aux débutants : BTC 60%, ETH 25%, Altcoins sélectionnés 10%, Stablecoins 5%. Cette allocation minimise le risque tout en capturant la croissance du marché crypto via les deux actifs les plus établis.",
        "L'allocation modérée pour les investisseurs intermédiaires : BTC 40%, ETH 25%, Layer 1/Layer 2 15%, DeFi tokens 10%, Spéculatif 5%, Stablecoins 5%. Plus de diversification et de potentiel de rendement, mais aussi plus de volatilité et de risque.",
        "L'allocation agressive pour les traders expérimentés : BTC 30%, ETH 20%, L1/L2 20%, DeFi 15%, Meme/Small caps 10%, Stablecoins 5%. Potentiel de rendement maximum mais risque très élevé — les altcoins peuvent perdre 80-95% en bear market.",
        "Règle d'or absolue : n'investissez JAMAIS plus que ce que vous pouvez vous permettre de perdre entièrement. Les altcoins perdent 80-95% en bear market et beaucoup ne reviennent jamais. BTC et ETH sont les seuls actifs 'relativement sûrs' à long terme dans l'écosystème crypto.",
      ],
      keyPoints: [
        "Conservateur : BTC 60%, ETH 25%, Alts 10%, Stables 5%",
        "Modéré : BTC 40%, ETH 25%, diversifié dans les secteurs",
        "Agressif : plus d'altcoins = plus de potentiel mais plus de risque",
        "Ne JAMAIS investir plus que ce qu'on peut perdre entièrement",
      ],
      proTips: ["Adaptez votre allocation au cycle du marché : plus de BTC en bear market (sécurité), plus d'altcoins en bull market (rendement)"],
      commonMistakes: ["Mettre 100% dans un seul altcoin — la diversification est essentielle pour survivre aux cycles crypto"],
    },
    {
      title: "Rééquilibrage du Portefeuille",
      content: [
        "Le rééquilibrage consiste à ramener le portefeuille à l'allocation cible périodiquement. Si BTC monte et passe de 40% à 55% du portefeuille, vendez une partie du BTC et achetez des altcoins pour revenir à 40%. Ce processus force mécaniquement à vendre haut et acheter bas.",
        "Deux méthodes de rééquilibrage : (1) Périodique — rééquilibrez à date fixe (mensuel ou trimestriel). (2) Par seuil — rééquilibrez quand un actif dévie de plus de 5% de son allocation cible. La méthode par seuil est généralement plus efficace car elle réagit aux mouvements significatifs.",
        "Le rééquilibrage améliore le rendement ajusté au risque (Sharpe ratio) et réduit la volatilité globale du portefeuille. C'est une discipline qui élimine les émotions de la gestion de portefeuille. Des études montrent un avantage de 1-3% annuel par rapport à un portefeuille non rééquilibré.",
        "En fin de cycle (late bull market), rééquilibrez en prenant des profits sur les gagnants vers les stablecoins plutôt que vers d'autres cryptos. Cela augmente progressivement votre position en stablecoins et vous protège contre le crash inévitable.",
      ],
      keyPoints: [
        "Ramener le portefeuille à l'allocation cible régulièrement",
        "Mensuel/trimestriel ou basé sur un seuil de déviation de 5%",
        "Force mécaniquement à vendre haut et acheter bas",
        "Améliore le rendement ajusté au risque de 1-3% annuel",
      ],
      proTips: ["En fin de cycle bull, rééquilibrez vers les stablecoins plutôt que vers d'autres cryptos — protégez vos gains avant le crash"],
      commonMistakes: ["Ne jamais rééquilibrer — le portefeuille devient déséquilibré et concentré sur les gagnants, augmentant le risque de perte massive"],
    },
    {
      title: "Suivi de Performance et Outils",
      content: [
        "Utilisez un tracker de portefeuille pour suivre vos positions : CoinGecko Portfolio (gratuit, simple), Zapper et DeBank pour les positions DeFi, CoinStats ou Delta pour un suivi complet multi-exchange. Suivez la performance GLOBALE du portefeuille, pas actif par actif.",
        "Métriques clés à suivre : rendement total (%), rendement vs BTC (votre alpha), max drawdown (perte maximale depuis un sommet), Sharpe ratio (rendement ajusté au risque). Si vous sous-performez BTC sur une période d'un an, il est temps de simplifier votre portefeuille.",
        "Revue mensuelle structurée : (1) Performance du mois vs objectifs. (2) Allocation actuelle vs allocation cible. (3) Rééquilibrage nécessaire ? (4) Nouvelles opportunités identifiées. (5) Risques à surveiller. (6) Leçons apprises. Documentez tout dans un journal d'investissement.",
        "La règle des 80/20 en crypto : 80% de vos rendements viendront probablement de 20% de vos positions (généralement BTC et ETH). Les 80% restants de vos positions (altcoins) contribueront à 20% des rendements mais à 80% du stress et du temps de gestion.",
      ],
      keyPoints: [
        "Trackers : CoinGecko Portfolio, Zapper, DeBank pour la DeFi",
        "Métriques clés : rendement total, alpha vs BTC, drawdown, Sharpe",
        "Si sous-performance vs BTC sur 1 an → simplifier le portefeuille",
        "Revue mensuelle documentée dans un journal",
      ],
      proTips: ["Si vous sous-performez BTC sur un an, mettez 80% en BTC/ETH et simplifiez — la complexité n'est pas toujours synonyme de meilleur rendement"],
      commonMistakes: ["Suivre chaque actif minute par minute — regardez la performance globale hebdomadaire ou mensuelle pour votre santé mentale"],
    },
  ],
  quiz: [
    { question: "Allocation conservatrice BTC recommandée :", options: ["20%", "40%", "60%", "80%"], correct: 2 },
    { question: "Le rééquilibrage force à :", options: ["Acheter haut, vendre bas", "Vendre haut, acheter bas", "Garder la même allocation", "Augmenter le risque"], correct: 1 },
    { question: "Si vous sous-performez BTC sur 1 an :", options: ["Ajouter plus d'altcoins", "Simplifier le portefeuille", "Utiliser du levier", "Changer de stratégie chaque semaine"], correct: 1 },
    { question: "La règle des 80/20 en crypto :", options: ["80% altcoins, 20% BTC", "80% rendement vient de 20% des positions", "80% du temps en cash", "80% de win rate"], correct: 1 },
  ],
};

const m4l3: Lesson = {
  id: "m4-l3",
  title: "Points d'Entrée et de Sortie en Spot",
  icon: "🎯",
  duration: "55 min",
  description: "Identifier les meilleurs moments pour acheter et vendre en spot.",
  subLessons: [
    {
      title: "Identifier les Points d'Entrée",
      content: [
        "Le pullback vers un support ou une EMA en tendance haussière offre le meilleur rapport risque/récompense. Attendez un chandelier de retournement (hammer, bullish engulfing) au contact du support avec un volume supérieur à la moyenne. C'est le setup le plus fiable et le plus reproductible.",
        "Le breakout de consolidation avec volume est un autre excellent point d'entrée. Quand le prix sort d'un range ou d'un triangle avec un volume 2x+ supérieur à la moyenne, c'est un signal de mouvement directionnel. Le retest du niveau cassé est l'entrée idéale — plus sûre que l'entrée à la cassure.",
        "La confluence multiple maximise la probabilité de succès : S/R + Fibonacci 61.8% + EMA 50 + divergence RSI haussière = signal de très haute qualité. Plus il y a de facteurs techniques qui convergent au même niveau, plus la réaction du prix sera forte et fiable.",
        "Méthode d'entrée progressive : au lieu d'entrer avec 100% de la position d'un coup, divisez en 3 entrées. 33% au premier signal, 33% si le prix confirme (chandelier de retournement), 34% si le prix commence à monter. Cette approche réduit le risque de mauvais timing.",
      ],
      keyPoints: [
        "Pullback vers support/EMA = meilleur rapport risque/récompense",
        "Breakout + volume 2x+ = signal fiable de mouvement directionnel",
        "Retest du niveau cassé = entrée idéale et la plus sûre",
        "Confluence multiple = probabilité de succès maximale",
      ],
      proTips: ["Attendez TOUJOURS une confirmation (chandelier de retournement + volume) avant d'entrer — la patience est la qualité la plus rentable"],
      commonMistakes: ["Acheter sur l'impulsion (FOMO) au lieu d'attendre le pullback — vous payez un prix plus élevé avec un risque plus grand"],
    },
    {
      title: "Stratégies de Sortie",
      content: [
        "Les Take Profit partiels sont la meilleure approche : vendez 33% à TP1 (objectif conservateur, ex: résistance la plus proche), 33% à TP2 (objectif principal, ex: extension Fibonacci 161.8%), et laissez 34% courir avec un trailing stop. Cette méthode sécurise des profits tout en capturant les mouvements prolongés.",
        "Le trailing stop suit le prix à une distance fixe (ATR × 2 ou pourcentage fixe comme 5-8%). Il protège les profits en tendance : quand le prix monte, le stop monte aussi. Quand le prix recule de la distance définie, la position est fermée automatiquement. Idéal pour les 'runners' (la dernière portion de la position).",
        "Signaux de sortie à surveiller : divergence baissière RSI/MACD au niveau d'une résistance majeure, volume décroissant sur la hausse (la conviction diminue), changement de structure du marché (premier CHoCH), indicateurs on-chain en zone de distribution (MVRV > 3).",
        "La sortie est plus importante que l'entrée — planifiez-la AVANT d'entrer en position. Écrivez vos niveaux de TP et les conditions de sortie dans votre journal de trading. Une fois en position, les émotions (avidité, peur) prennent le dessus et altèrent votre jugement.",
      ],
      keyPoints: [
        "TP partiels : 33% à TP1, 33% à TP2, 34% en trailing stop",
        "Trailing stop pour protéger les profits en tendance",
        "Divergence RSI/MACD + résistance = signal de sortie fort",
        "Planifier la sortie AVANT l'entrée — non négociable",
      ],
      proTips: ["La sortie est plus importante que l'entrée — un bon point de sortie transforme un trade moyen en trade profitable"],
      commonMistakes: ["Ne pas avoir de plan de sortie défini — l'avidité vous fera garder trop longtemps et rendre vos profits"],
    },
    {
      title: "Gestion des Positions Perdantes",
      content: [
        "Règle absolue : respectez votre Stop Loss. Ne déplacez JAMAIS votre SL dans le mauvais sens (plus loin de l'entrée). Si le SL est touché, acceptez la perte et passez au trade suivant. Déplacer le SL par espoir transforme une petite perte contrôlée en catastrophe potentielle.",
        "L'averaging down (renforcer en baisse) est acceptable UNIQUEMENT en spot sur des actifs fondamentalement solides (BTC, ETH) avec un plan prédéfini et des niveaux d'achat définis à l'avance. JAMAIS en futures avec levier. JAMAIS sur des altcoins spéculatifs qui peuvent aller à zéro.",
        "Après une perte : (1) Notez le trade dans votre journal avec tous les détails. (2) Analysez objectivement ce qui n'a pas fonctionné. (3) Ne tradez PAS immédiatement (évitez le revenge trading). (4) Attendez le prochain setup de qualité qui correspond à vos critères. La patience après une perte est cruciale.",
        "Le revenge trading (trader immédiatement après une perte pour 'récupérer') est la cause #1 de pertes catastrophiques. Après une perte, votre jugement est altéré par la frustration. Imposez-vous une pause minimale de quelques heures, idéalement 24h, avant de reprendre le trading.",
      ],
      keyPoints: [
        "Respectez le SL — JAMAIS le déplacer dans le mauvais sens",
        "Averaging down : uniquement BTC/ETH en spot avec plan prédéfini",
        "Pas de revenge trading — pause obligatoire après une perte",
        "Journal + analyse + patience = progression",
      ],
      proTips: ["Après une perte significative, attendez au moins 24h avant de reprendre un trade — votre clarté mentale sera bien meilleure"],
      commonMistakes: ["Déplacer le SL plus loin par espoir — c'est la méthode la plus sûre pour transformer une petite perte en catastrophe"],
    },
  ],
  quiz: [
    { question: "Meilleur point d'entrée en tendance haussière :", options: ["Au sommet absolu", "Pullback vers support/EMA", "Pendant un crash", "Au hasard"], correct: 1 },
    { question: "TP partiels recommandés :", options: ["100% à TP1", "33%/33%/34%", "50%/50%", "Pas de TP défini"], correct: 1 },
    { question: "L'averaging down est acceptable :", options: ["Toujours sur tout", "Jamais", "Uniquement BTC/ETH en spot avec plan", "Sur tous les altcoins"], correct: 2 },
    { question: "Après une perte, il faut :", options: ["Trader immédiatement pour récupérer", "Doubler la taille de position", "Prendre une pause et analyser", "Changer de stratégie"], correct: 2 },
  ],
};

const m4l4: Lesson = {
  id: "m4-l4",
  title: "Stratégies de Prise de Profits et Accumulation",
  icon: "💎",
  duration: "45 min",
  description: "Quand et comment prendre des profits, et stratégies d'accumulation en bear market.",
  subLessons: [
    {
      title: "Stratégies de Prise de Profits",
      content: [
        "Méthode par paliers de prix : vendez 20% de votre position à chaque doublement du prix. À x2 = vendez 20%, à x3 = vendez 20%, à x5 = vendez 20%, à x10 = vendez 20%, gardez 20% comme 'moon bag'. Vous ne vendrez jamais au sommet exact, et c'est parfaitement OK — l'objectif est de sécuriser des gains réels.",
        "Méthode basée sur les indicateurs : vendez progressivement quand MVRV > 3 (historiquement zone de sommet), RSI weekly > 80 (surachat extrême), Altcoin Season Index > 90 (euphorie altcoins), funding rates perpétuellement élevés (>0.1%). Ces indicateurs ont historiquement signalé les sommets de cycle avec une bonne fiabilité.",
        "Méthode basée sur le temps : vendez progressivement 12-18 mois après le halving, qui correspond historiquement à la zone de sommet du cycle. Commencez à prendre des profits tôt (12 mois) plutôt que tard — il vaut mieux vendre un peu trop tôt que trop tard.",
        "Règle psychologique importante : prenez des profits quand vous êtes euphorique et que tout semble aller parfaitement. L'euphorie collective est souvent le signal que le sommet est proche. 'Be fearful when others are greedy, and greedy when others are fearful' — Warren Buffett.",
      ],
      keyPoints: [
        "Vendez par paliers — jamais tout d'un coup",
        "Indicateurs de sommet : MVRV > 3, RSI weekly > 80, funding élevé",
        "12-18 mois après halving = zone de sommet historique",
        "Garder un 'moon bag' de 10-20% pour le cas où",
      ],
      proTips: ["Prenez des profits quand vous êtes euphorique et que tout le monde est positif — c'est contre-intuitif mais historiquement très rentable"],
      commonMistakes: ["Attendre le sommet exact pour vendre — c'est impossible à timer, prenez des profits progressivement sur la montée"],
    },
    {
      title: "Accumulation en Bear Market",
      content: [
        "Le bear market est paradoxalement le MEILLEUR moment pour accumuler des cryptos. Les prix sont 70-90% sous l'ATH (All-Time High). Les indicateurs on-chain comme MVRV < 1 (le marché est valorisé sous sa valeur réalisée) et NUPL < 0 (les holders sont en perte nette) confirment la zone d'accumulation.",
        "Stratégie d'accumulation : DCA agressif en bear market. Augmentez significativement vos achats quand MVRV < 1 et RSI monthly < 30. C'est profondément contre-intuitif car tout le monde a peur et les médias annoncent la 'mort du crypto', mais c'est historiquement le moment le plus rentable pour investir.",
        "En bear market, accumulez UNIQUEMENT BTC et ETH. Les altcoins perdent 80-95% de leur valeur et beaucoup ne reviennent JAMAIS. Attendez le début confirmé du bull market (Golden Cross sur le weekly, MVRV qui repasse au-dessus de 1) pour commencer à diversifier prudemment dans les altcoins de qualité.",
        "La patience en bear market est récompensée exponentiellement. Ceux qui ont accumulé BTC en 2018-2019 (bear market) ont vu des rendements de 10-20x dans le cycle suivant. La difficulté n'est pas technique mais psychologique — acheter quand tout le monde vend demande un courage et une conviction exceptionnels.",
      ],
      keyPoints: [
        "Bear market = meilleur moment pour accumuler (prix -70-90%)",
        "MVRV < 1, NUPL < 0 = zone d'accumulation confirmée",
        "DCA agressif en bear market sur BTC et ETH uniquement",
        "Altcoins seulement après le début confirmé du bull market",
      ],
      proTips: ["Quand tout le monde dit que 'crypto est mort' et que les médias sont unanimement négatifs, c'est historiquement le signal d'achat le plus fort"],
      commonMistakes: ["Arrêter d'investir en bear market par peur — c'est le pire moment pour arrêter et le meilleur pour accumuler"],
    },
    {
      title: "Cycle Complet : Accumulation → Distribution",
      content: [
        "Phase 1 — Bear/Accumulation : DCA agressif sur BTC et ETH. Allocation : 80% BTC/ETH, 20% stablecoins en réserve. Durée typique : 12-18 mois. Indicateurs : MVRV < 1, sentiment extrêmement négatif, capitulation des mineurs.",
        "Phase 2 — Early Bull : continuer le DCA mais commencer à diversifier prudemment dans les altcoins de qualité (L1, L2, DeFi blue chips). Allocation : 60% BTC/ETH, 25% altcoins sélectionnés, 15% stablecoins. Indicateurs : Golden Cross weekly, MVRV 1-2, sentiment qui s'améliore.",
        "Phase 3 — Mid/Late Bull : réduire le DCA, commencer à prendre des profits partiels sur les altcoins qui ont fait x3-x5. Rééquilibrer vers BTC et stablecoins. Phase 4 — Euphorie/Distribution : prendre des profits agressivement, convertir progressivement en stablecoins. Objectif : 50-80% en stablecoins.",
        "Phase 5 — Crash/Markdown : maintenir 50-80% en stablecoins, garder une petite position BTC (10-20%). Attendre que les indicateurs signalent le prochain bear market bottom pour recommencer le cycle. Ce cycle se répète approximativement tous les 4 ans, aligné avec le halving de Bitcoin.",
      ],
      keyPoints: [
        "Bear : DCA agressif BTC/ETH (80% crypto, 20% stables)",
        "Early Bull : diversifier prudemment dans les altcoins",
        "Mid/Late Bull : profits partiels, rééquilibrer vers BTC/stables",
        "Euphorie : profits agressifs → 50-80% en stablecoins",
      ],
      proTips: ["Documentez votre plan de cycle complet AVANT le bull market — les émotions vous feront dévier de votre plan si vous ne l'avez pas écrit noir sur blanc"],
      commonMistakes: ["Ne pas avoir de plan de sortie défini — l'euphorie du bull market vous fera garder vos positions trop longtemps et rendre la majorité de vos gains"],
      exercise: "Créez votre plan de cycle complet : allocation par phase, critères de transition entre phases, objectifs de profits à chaque étape, et règles de discipline.",
    },
  ],
  quiz: [
    { question: "Le meilleur moment pour accumuler :", options: ["Au sommet du bull market", "En bear market", "Pendant l'euphorie", "Après un crash de 10%"], correct: 1 },
    { question: "MVRV < 1 indique :", options: ["Euphorie du marché", "Zone d'accumulation", "Surachat", "Volume élevé"], correct: 1 },
    { question: "En late bull market, il faut :", options: ["Acheter agressivement des altcoins", "Prendre des profits → stablecoins", "Utiliser du levier maximum", "Acheter des meme coins"], correct: 1 },
    { question: "Le cycle crypto se répète environ tous les :", options: ["6 mois", "1 an", "4 ans", "10 ans"], correct: 2 },
  ],
};

export const module4Lessons: Lesson[] = [m4l1, m4l2, m4l3, m4l4];