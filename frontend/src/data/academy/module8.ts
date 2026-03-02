import { Lesson } from "./types";

const m8l1: Lesson = {
  id: "m8-l1",
  title: "Contrats Futures Perpétuels Expliqués",
  icon: "🔥",
  duration: "50 min",
  description: "Comprendre les futures perpétuels : mécanisme, marge, funding et fonctionnement.",
  subLessons: [
    {
      title: "Qu'est-ce qu'un Contrat Futures Perpétuel ?",
      content: [
        "Les futures perpétuels permettent de trader avec effet de levier, d'aller long (parier sur la hausse) ou short (parier sur la baisse), sans date d'expiration. Contrairement aux futures traditionnels qui expirent à une date fixe, les perpétuels n'ont pas d'échéance — vous pouvez garder votre position indéfiniment.",
        "Le volume quotidien des futures perpétuels dépasse souvent celui du marché spot, ce qui en fait le marché le plus liquide en crypto. Les principaux exchanges pour les futures sont Binance, Bybit, OKX et dYdX (décentralisé).",
        "Le prix des futures perpétuels est maintenu proche du prix spot grâce au mécanisme de funding rate. Sans ce mécanisme, le prix des futures pourrait diverger significativement du prix spot, créant des opportunités d'arbitrage.",
        "AVERTISSEMENT CRUCIAL : les futures avec levier sont l'instrument financier le plus dangereux accessible au grand public. 95% des traders qui utilisent un levier supérieur à 10x perdent la totalité de leur capital. Ne tradez les futures qu'après avoir maîtrisé le trading spot pendant au moins 6 mois.",
      ],
      keyPoints: [
        "Long/Short avec levier, sans date d'expiration",
        "Volume quotidien supérieur au spot — très liquide",
        "Funding rate maintient le prix proche du spot",
        "95% des traders >10x perdent tout — MAXIMUM 3-5x",
      ],
      proTips: ["Commencez avec un levier de 2x maximum pendant vos 50 premiers trades futures — apprenez le mécanisme avant d'augmenter"],
      commonMistakes: ["Utiliser un levier de 20x+ dès le début — c'est la façon la plus rapide de perdre tout votre capital"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/3f7db08d-0fec-40a7-be30-db1c3a9d319c.png",
          alt: "Futures Perpétuels",
          caption: "Contrats futures perpétuels : mécanisme de levier, marge isolée vs croisée et funding rate"
        }
      ],
    },
    {
      title: "Marge Isolée vs Marge Croisée",
      content: [
        "La marge isolée (Isolated Margin) limite le risque à la marge allouée à cette position spécifique. Si la position est liquidée, vous perdez UNIQUEMENT la marge de cette position — le reste de votre compte est protégé. C'est le mode OBLIGATOIRE pour tout trader responsable.",
        "La marge croisée (Cross Margin) utilise l'intégralité du solde de votre compte comme marge. Avantage : le prix de liquidation est plus éloigné. Danger MAJEUR : une seule position perdante peut vider TOUT votre compte. Un mouvement de 5-10% contre vous peut liquider des milliers de dollars.",
        "Utilisez TOUJOURS la marge isolée. Sans exception. La marge croisée est un piège qui donne un faux sentiment de sécurité (liquidation plus éloignée) mais expose la totalité de votre capital. Les traders professionnels utilisent la marge isolée pour contrôler précisément leur risque.",
        "Configuration recommandée : marge isolée + SL obligatoire placé BIEN AVANT le prix de liquidation (au minimum 50% de la distance entrée-liquidation). Exemple : entrée à 100 000$, liquidation à 90 000$ (levier 10x). SL à 95 000$ minimum — bien au-dessus de la liquidation.",
      ],
      keyPoints: [
        "Isolated = risque limité à la marge de la position",
        "Cross = tout le compte en jeu — DANGEREUX",
        "TOUJOURS utiliser isolated margin — sans exception",
        "SL à minimum 50% de la distance entrée-liquidation",
      ],
      proTips: ["Vérifiez que votre mode de marge est en 'Isolated' AVANT chaque trade — certains exchanges reviennent au mode Cross par défaut"],
      commonMistakes: ["Utiliser la marge croisée — une seule mauvaise position peut vider tout votre compte en quelques minutes"],
    },
    {
      title: "Le Funding Rate Expliqué",
      content: [
        "Le funding rate est un paiement périodique (toutes les 8h sur la plupart des exchanges) entre les traders long et short. Il maintient le prix des futures proche du prix spot. Funding positif : les longs paient les shorts (plus de longs que de shorts = sentiment haussier). Funding négatif : les shorts paient les longs.",
        "Le funding rate est un indicateur de sentiment du marché. Funding extrêmement positif (>0.1%) = trop de longs, risque de correction (short squeeze inversé). Funding extrêmement négatif (<-0.1%) = trop de shorts, risque de short squeeze. Les extrêmes de funding précèdent souvent des retournements.",
        "Impact sur la rentabilité : si vous êtes long avec un funding de 0.05% toutes les 8h, vous payez 0.15% par jour = 4.5% par mois. Sur un trade de swing de 2 semaines, c'est 2.25% de coût supplémentaire. Intégrez TOUJOURS le funding dans votre calcul de rentabilité.",
        "Stratégie funding : en période de funding extrêmement positif, considérez de prendre des positions short (ou de fermer vos longs). Le marché a tendance à corriger pour rééquilibrer le funding. C'est un avantage statistique sous-exploité par la majorité des traders.",
      ],
      keyPoints: [
        "Paiement toutes les 8h entre longs et shorts",
        "Funding > 0.1% = trop de longs, risque de correction",
        "Funding < -0.1% = trop de shorts, risque de squeeze",
        "Intégrer le coût du funding dans le calcul de rentabilité",
      ],
      proTips: ["Surveillez le funding rate comme un indicateur de sentiment — les extrêmes précèdent souvent des retournements significatifs"],
      commonMistakes: ["Ignorer le coût du funding sur les positions de swing — 0.05% × 3 par jour × 14 jours = 2.1% de coût caché"],
    },
  ],
  quiz: [
    { question: "Quel mode de marge utiliser ?", options: ["Cross margin", "Isolated margin", "Pas de marge", "Les deux alternativement"], correct: 1 },
    { question: "Funding positif signifie :", options: ["Les shorts paient les longs", "Les longs paient les shorts", "Pas de paiement", "L'exchange paie tout le monde"], correct: 1 },
    { question: "Funding > 0.1% indique :", options: ["Trop de shorts", "Trop de longs (risque correction)", "Marché neutre", "Faible liquidité"], correct: 1 },
    { question: "Levier maximum recommandé :", options: ["50x", "20x", "10x", "3-5x"], correct: 3 },
  ],
};

const m8l2: Lesson = {
  id: "m8-l2",
  title: "Long vs Short : Stratégies Directionnelles",
  icon: "↕️",
  duration: "45 min",
  description: "Quand aller long, quand aller short, et comment exécuter chaque direction.",
  subLessons: [
    {
      title: "Positions Long (Achat)",
      content: [
        "Une position long profite quand le prix monte. Vous achetez un contrat à un prix et le vendez plus cher. Avec un levier 5x, un mouvement de 2% génère un profit de 10% sur votre marge. Les longs sont plus intuitifs car la majorité des traders sont habitués à 'acheter bas, vendre haut'.",
        "Quand aller long : tendance haussière confirmée (HH/HL sur le daily), pullback vers un support/EMA avec confirmation, breakout haussier avec volume, funding rate négatif ou neutre (pas de surcharge de longs), indicateurs alignés (RSI > 50, MACD > 0).",
        "Entrée long optimale : pullback vers EMA 21 daily + Fibonacci 38-61% + chandelier de retournement haussier sur le 4h + volume de confirmation. SL sous le dernier HL. TP au précédent HH ou extension Fibonacci. R:R minimum 1:2.",
        "Piège courant : aller long en surachat (RSI > 80) ou quand le funding est extrêmement positif. Ces conditions indiquent que le marché est surchauffé et qu'une correction est probable. Attendez le pullback plutôt que de FOMO au sommet.",
      ],
      keyPoints: [
        "Long = profite de la hausse, plus intuitif",
        "Tendance haussière + pullback + confirmation = entrée idéale",
        "Éviter les longs en surachat ou funding extrêmement positif",
        "R:R minimum 1:2, SL sous le dernier HL",
      ],
      proTips: ["Les meilleurs longs sont pris quand le funding est neutre ou négatif — cela signifie que le marché n'est pas surchargé de longs"],
      commonMistakes: ["Aller long au sommet par FOMO quand le funding est très positif — c'est le moment le plus risqué pour un long"],
    },
    {
      title: "Positions Short (Vente)",
      content: [
        "Une position short profite quand le prix baisse. Vous vendez un contrat à un prix et le rachetez moins cher. Le short est psychologiquement plus difficile car il va contre l'instinct naturel d'acheter. Mais en bear market, les shorts sont essentiels pour rester profitable.",
        "Quand aller short : tendance baissière confirmée (LH/LL sur le daily), pullback vers une résistance/EMA avec rejet, breakdown baissier avec volume, funding rate très positif (trop de longs), indicateurs alignés (RSI < 50, MACD < 0).",
        "Entrée short optimale : pullback vers EMA 21 daily en tendance baissière + Fibonacci 38-61% + chandelier de retournement baissier sur le 4h (shooting star, bearish engulfing) + volume de confirmation. SL au-dessus du dernier LH. TP au précédent LL.",
        "Le short est plus risqué que le long car les pertes sont théoriquement illimitées (le prix peut monter indéfiniment) tandis que les gains sont limités (le prix ne peut pas descendre sous zéro). C'est pourquoi le SL est encore plus critique sur les shorts.",
      ],
      keyPoints: [
        "Short = profite de la baisse, psychologiquement plus difficile",
        "Tendance baissière + pullback vers résistance + confirmation",
        "Funding très positif = opportunité de short (trop de longs)",
        "SL encore plus critique sur les shorts (pertes théoriquement illimitées)",
      ],
      proTips: ["Les meilleurs shorts sont pris quand le funding est extrêmement positif et le RSI en surachat — la correction est statistiquement probable"],
      commonMistakes: ["Shorter en bull market confirmé — 'the trend is your friend', ne shortez que quand la tendance est clairement baissière"],
    },
    {
      title: "Biais Directionnel et Neutralité",
      content: [
        "Le biais directionnel est déterminé par le timeframe supérieur. Weekly haussier = biais long (cherchez uniquement des longs). Weekly baissier = biais short. Weekly neutre/range = pas de biais fort, tradez les deux directions avec prudence ou restez en cash.",
        "Avoir un biais ne signifie pas trader aveuglément dans cette direction. Le biais vous dit QUELLE direction chercher, l'analyse technique vous dit QUAND et OÙ entrer. Un biais long + un bon setup short = ne pas trader (le biais et le setup sont contradictoires).",
        "La neutralité est une position valide et souvent la plus sage. Quand le marché est incertain (range sur le weekly, indicateurs contradictoires), rester en cash est la meilleure décision. Vous ne perdez rien en étant en cash, mais vous pouvez perdre beaucoup en forçant des trades.",
        "Revoyez votre biais chaque dimanche soir lors de votre analyse weekly. Le biais peut changer d'une semaine à l'autre — adaptez-vous. Un trader flexible qui s'adapte aux conditions du marché surperforme un trader rigide qui s'accroche à son opinion.",
      ],
      keyPoints: [
        "Weekly haussier = biais long, baissier = biais short",
        "Le biais dit la direction, l'AT dit le timing",
        "Biais contradictoire avec le setup = ne pas trader",
        "La neutralité (cash) est une position valide et sage",
      ],
      proTips: ["Quand le marché est incertain, la meilleure position est le cash — vous ne perdez rien en attendant la clarté"],
      commonMistakes: ["Forcer des trades quand le marché est incertain — la patience est toujours récompensée"],
    },
  ],
  quiz: [
    { question: "Une position short profite quand :", options: ["Le prix monte", "Le prix baisse", "Le prix stagne", "Le volume augmente"], correct: 1 },
    { question: "Quand shorter :", options: ["En bull market confirmé", "Tendance baissière + pullback vers résistance", "Quand le RSI < 30", "Au support"], correct: 1 },
    { question: "Le biais directionnel est déterminé par :", options: ["Le 1 minute", "Le 15 minutes", "Le weekly", "Les news"], correct: 2 },
    { question: "Quand le marché est incertain :", options: ["Trader avec levier max", "Rester en cash", "Shorter agressivement", "Acheter des altcoins"], correct: 1 },
  ],
};

const m8l3: Lesson = {
  id: "m8-l3",
  title: "Gestion du Levier et Liquidations",
  icon: "⚠️",
  duration: "55 min",
  description: "Comprendre les liquidations, les cascades et survivre au trading à levier.",
  subLessons: [
    {
      title: "Mécanisme de Liquidation",
      content: [
        "La liquidation se produit quand votre perte atteint votre marge — perte TOTALE de la marge allouée. Levier 2x → liquidation à -50%, 5x → -20%, 10x → -10%, 20x → -5%, 50x → -2%, 100x → -1%. Plus le levier est élevé, plus la marge d'erreur est mince.",
        "Le prix de liquidation est calculé par l'exchange en fonction de votre levier, votre marge et le mode de marge (isolated/cross). Vérifiez TOUJOURS votre prix de liquidation AVANT d'entrer en position. Si le prix de liquidation est trop proche de niveaux techniques significatifs, réduisez le levier.",
        "Les frais de liquidation sont importants : l'exchange prélève des frais supplémentaires lors de la liquidation (0.5-1.5% selon l'exchange). Votre perte réelle est donc supérieure à votre marge. De plus, en cas de forte volatilité, le prix de liquidation réel peut être pire que le prix théorique (slippage).",
        "Règle absolue : votre Stop Loss doit être touché BIEN AVANT le prix de liquidation. Minimum 50% de la distance entre votre entrée et votre liquidation. Exemple : entrée 100 000$, liquidation 90 000$ (levier 10x). SL à 95 000$ minimum — à mi-chemin entre l'entrée et la liquidation.",
      ],
      keyPoints: [
        "Liquidation = perte TOTALE de la marge",
        "Levier 5x = liquidation à -20%, 10x = -10%, 20x = -5%",
        "Frais de liquidation supplémentaires (0.5-1.5%)",
        "SL à minimum 50% de la distance entrée-liquidation",
      ],
      proTips: ["Calculez votre prix de liquidation AVANT chaque trade et assurez-vous que votre SL est bien au-dessus (long) ou en dessous (short)"],
      commonMistakes: ["Ne pas vérifier le prix de liquidation — vous pourriez être liquidé par un simple mouvement de volatilité normale"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/c82d17f6-9ca1-4adb-96a0-067a3fdaf689.png",
          alt: "Mécanisme de liquidation",
          caption: "Liquidation par levier : plus le levier est élevé, plus la marge d'erreur est mince (5x=-20%, 10x=-10%, 20x=-5%)"
        }
      ],
    },
    {
      title: "Cascades de Liquidations",
      content: [
        "Les cascades de liquidations créent un effet domino dévastateur. Quand le prix baisse et liquide des positions long, ces liquidations forcées créent une pression vendeuse supplémentaire qui fait baisser le prix davantage, liquidant d'autres positions, et ainsi de suite.",
        "Les crashs flash de 10-20% en quelques minutes sont souvent causés par des cascades de liquidations. Le 19 mai 2021, Bitcoin a chuté de 30% en quelques heures, liquidant plus de 8 milliards de dollars de positions. Ces événements sont imprévisibles et dévastateurs pour les traders à levier élevé.",
        "Les zones de forte concentration de liquidations sont visibles sur des outils comme Coinglass ou Hyblock Capital. Ces zones agissent comme des aimants pour le prix — les market makers et les gros traders poussent souvent le prix vers ces zones pour déclencher les liquidations et profiter de la liquidité.",
        "Protection contre les cascades : (1) Levier maximum 3-5x. (2) Isolated margin toujours. (3) SL bien avant la liquidation. (4) Éviter les positions pendant les annonces macro. (5) Réduire le levier en période de haute volatilité (ATR élevé). (6) Ne pas avoir toutes vos positions dans la même direction.",
      ],
      keyPoints: [
        "Cascade = effet domino de liquidations en chaîne",
        "Crashs flash de 10-20% en minutes = cascades",
        "Outils : Coinglass, Hyblock pour visualiser les liquidations",
        "Protection : levier 3-5x, isolated, SL, diversification directionnelle",
      ],
      proTips: ["Consultez la heatmap de liquidations sur Coinglass avant de trader — évitez d'avoir votre SL dans une zone de forte concentration"],
      commonMistakes: ["Avoir toutes ses positions dans la même direction avec du levier — une cascade dans la direction opposée peut tout liquider"],
    },
    {
      title: "Survie à Long Terme en Futures",
      content: [
        "Règles de survie non négociables : (1) Maximum 3-5x de levier — JAMAIS plus. (2) Isolated margin TOUJOURS. (3) SL OBLIGATOIRE sur chaque position. (4) Risque maximum 1-2% du capital total par trade. (5) Maximum 3 positions simultanées. (6) Pas de trading pendant les annonces macro.",
        "Gestion du capital : ne mettez JAMAIS plus de 20-30% de votre capital total sur un exchange de futures. Le reste doit être en cold storage ou en stablecoins. Si l'exchange est compromis ou si vous faites une erreur catastrophique, vous ne perdez que 20-30% de votre capital total.",
        "Le drawdown en futures est amplifié par le levier. Un drawdown de 10% en spot devient 50% avec un levier 5x. Après un drawdown de 50%, il faut un gain de 100% pour revenir à l'équilibre — c'est mathématiquement très difficile. Protégez votre capital à tout prix.",
        "Statistique finale : les traders qui survivent 2+ ans en futures avec un levier modéré (3-5x) et une gestion du risque stricte sont dans le top 5% des traders. La survie est le premier objectif — la rentabilité vient après. Si vous survivez assez longtemps, vous apprendrez à être profitable.",
      ],
      keyPoints: [
        "Max 3-5x, isolated, SL obligatoire, risque 1-2% par trade",
        "Maximum 20-30% du capital total sur l'exchange futures",
        "Drawdown amplifié par le levier — protéger le capital",
        "Survie = objectif #1, rentabilité = objectif #2",
      ],
      proTips: ["La survie est le premier objectif en futures — si vous survivez 2 ans avec une gestion du risque stricte, vous êtes dans le top 5%"],
      commonMistakes: ["Mettre 100% de son capital sur un exchange de futures — une erreur ou un hack peut tout détruire"],
      exercise: "Simulez 20 trades en paper trading futures avec levier 3x. Calculez votre P&L, max drawdown et profit factor. Êtes-vous profitable avec une gestion stricte ?",
    },
  ],
  quiz: [
    { question: "Levier 20x, quel mouvement liquide ?", options: ["20%", "10%", "5%", "2%"], correct: 2 },
    { question: "Les cascades de liquidations causent :", options: ["Des hausses lentes", "Des crashs flash de 10-20%", "De la stabilité", "Du volume faible"], correct: 1 },
    { question: "Capital maximum sur un exchange futures :", options: ["100%", "50%", "20-30%", "5%"], correct: 2 },
    { question: "L'objectif #1 en futures est :", options: ["Maximiser les profits", "Survivre", "Avoir le plus de trades", "Utiliser le levier max"], correct: 1 },
  ],
};

const m8l4: Lesson = {
  id: "m8-l4",
  title: "Funding Rate et Arbitrage",
  icon: "💹",
  duration: "45 min",
  description: "Exploiter le funding rate et les opportunités d'arbitrage en futures.",
  subLessons: [
    {
      title: "Stratégies Basées sur le Funding",
      content: [
        "Le funding rate comme indicateur contrarian : quand le funding est extrêmement positif (>0.1%), le marché est surchargé de longs — une correction est statistiquement probable. Quand le funding est extrêmement négatif (<-0.1%), trop de shorts — un short squeeze est probable.",
        "Stratégie de mean reversion funding : quand le funding atteint un extrême, prenez une position dans la direction opposée. Funding très positif → short. Funding très négatif → long. Cette stratégie a un avantage statistique car les extrêmes de funding précèdent souvent des retournements.",
        "Le funding cumulé sur plusieurs jours est plus significatif que le funding d'une seule période. Si le funding est positif pendant 7 jours consécutifs avec des valeurs croissantes, la pression de correction s'accumule. Suivez le funding cumulé sur Coinglass.",
        "Attention : le funding peut rester extrême plus longtemps que prévu, surtout en tendance forte. Ne tradez pas le funding seul — combinez-le avec l'analyse technique (niveaux de S/R, divergences RSI) pour des signaux de haute qualité.",
      ],
      keyPoints: [
        "Funding > 0.1% = trop de longs, correction probable",
        "Funding < -0.1% = trop de shorts, squeeze probable",
        "Funding cumulé sur plusieurs jours = plus significatif",
        "Combiner funding + AT pour des signaux de qualité",
      ],
      proTips: ["Le funding cumulé sur 7 jours est un meilleur indicateur que le funding d'une seule période — suivez-le sur Coinglass"],
      commonMistakes: ["Trader le funding seul sans analyse technique — le funding peut rester extrême longtemps en tendance forte"],
    },
    {
      title: "Arbitrage Spot-Futures",
      content: [
        "L'arbitrage spot-futures exploite la différence de prix entre le marché spot et les futures. Quand le prix des futures est significativement supérieur au spot (contango), vous pouvez acheter en spot et shorter en futures pour capturer la différence + le funding.",
        "Stratégie cash-and-carry : achetez 1 BTC en spot à 100 000$. Shortez 1 BTC en futures perpétuels à 100 500$. Vous capturez la différence de 500$ + le funding positif (les longs vous paient). Position neutre au marché — vous ne prenez aucun risque directionnel.",
        "Rendement typique : 10-30% APY en période de funding élevé, 5-10% APY en période normale. C'est un rendement 'sans risque directionnel' mais avec des risques opérationnels : risque d'exchange, risque de liquidation du short si le levier est trop élevé, et risque de variation du funding.",
        "Prérequis : capital suffisant (minimum 5 000-10 000$), compréhension des mécanismes de marge, et surveillance régulière de la position. Utilisez un levier faible (2-3x) sur le short pour éviter la liquidation en cas de hausse soudaine du prix.",
      ],
      keyPoints: [
        "Acheter spot + shorter futures = position neutre au marché",
        "Capture la différence de prix + le funding positif",
        "Rendement 10-30% APY en funding élevé, 5-10% en normal",
        "Risques : exchange, liquidation du short, variation du funding",
      ],
      proTips: ["L'arbitrage spot-futures est l'une des stratégies les plus sûres en crypto — rendement régulier sans risque directionnel"],
      commonMistakes: ["Utiliser un levier trop élevé sur le short — une hausse soudaine peut liquider votre position short et détruire l'arbitrage"],
    },
  ],
  quiz: [
    { question: "L'arbitrage spot-futures est :", options: ["Très risqué", "Neutre au marché (pas de risque directionnel)", "Uniquement pour les longs", "Illégal"], correct: 1 },
    { question: "En cash-and-carry, vous :", options: ["Achetez futures, vendez spot", "Achetez spot, shortez futures", "Achetez les deux", "Vendez les deux"], correct: 1 },
    { question: "Rendement typique de l'arbitrage :", options: ["100%+ APY", "50-80% APY", "10-30% APY", "1-2% APY"], correct: 2 },
    { question: "Funding extrêmement négatif indique :", options: ["Trop de longs", "Trop de shorts (squeeze probable)", "Marché neutre", "Volume faible"], correct: 1 },
  ],
};

const m8l5: Lesson = {
  id: "m8-l5",
  title: "Hedging et Stratégies de Couverture",
  icon: "🛡️",
  duration: "50 min",
  description: "Protéger votre portefeuille spot avec des positions futures de couverture.",
  subLessons: [
    {
      title: "Principes du Hedging",
      content: [
        "Le hedging (couverture) consiste à ouvrir une position futures opposée à votre position spot pour protéger votre portefeuille contre les baisses. Si vous détenez 1 BTC en spot et shortez 1 BTC en futures, votre exposition nette est zéro — vous êtes protégé contre les mouvements de prix.",
        "Pourquoi hedger plutôt que vendre ? (1) Vous gardez vos cryptos (pas d'événement taxable dans certaines juridictions). (2) Vous pouvez retirer le hedge rapidement si le marché repart à la hausse. (3) Vous continuez à recevoir les airdrops et récompenses de staking sur vos positions spot.",
        "Le hedge partiel est souvent plus pratique : hedgez 30-50% de votre portefeuille spot quand vous anticipez une correction. Si la correction se produit, le profit du short compense partiellement la perte du spot. Si le marché monte, vous profitez toujours de la hausse sur la partie non hedgée.",
        "Le coût du hedging : si le funding est positif (ce qui est courant en bull market), votre position short paie du funding aux longs. Ce coût peut être significatif sur la durée. Intégrez ce coût dans votre décision de hedger ou de simplement vendre une partie.",
      ],
      keyPoints: [
        "Short futures = protection du portefeuille spot contre les baisses",
        "Hedge partiel (30-50%) = compromis entre protection et potentiel",
        "Avantages : pas d'événement taxable, garde les cryptos, réversible",
        "Coût : funding rate positif = coût du hedge en bull market",
      ],
      proTips: ["Le hedge partiel de 30-50% est le meilleur compromis — protection significative tout en gardant du potentiel de hausse"],
      commonMistakes: ["Hedger 100% en permanence — cela élimine tout potentiel de gain et le coût du funding s'accumule"],
    },
    {
      title: "Stratégies de Hedging Avancées",
      content: [
        "Hedge dynamique : ajustez la taille du hedge en fonction des conditions du marché. En surachat (RSI > 70, MVRV > 3) → augmentez le hedge à 50-70%. En survente (RSI < 30) → réduisez le hedge à 0-20%. Cette approche active optimise la protection tout en capturant les mouvements haussiers.",
        "Hedge par corrélation : si vous détenez des altcoins, vous pouvez hedger en shortant BTC ou ETH car les altcoins sont fortement corrélés. Un short BTC protège partiellement un portefeuille d'altcoins. Attention : la corrélation n'est pas parfaite, surtout en période de stress.",
        "Hedge de profit : quand un trade spot est en profit significatif (x2, x3), ouvrez un short futures pour verrouiller les gains sans vendre. Vous pouvez ensuite fermer le short si le prix continue de monter, ou fermer le spot si le prix baisse. Flexibilité maximale.",
        "Le hedging est un outil avancé qui nécessite une bonne compréhension des futures, du funding rate et de la gestion de marge. Commencez par des hedges simples (short BTC futures pour protéger du BTC spot) avant d'explorer les stratégies avancées.",
      ],
      keyPoints: [
        "Hedge dynamique : ajuster selon RSI, MVRV et conditions",
        "Hedge par corrélation : short BTC pour protéger les altcoins",
        "Hedge de profit : verrouiller les gains sans vendre",
        "Commencer simple avant les stratégies avancées",
      ],
      proTips: ["Le hedge dynamique basé sur le RSI weekly et le MVRV est la stratégie de protection la plus efficace pour les investisseurs long terme"],
      commonMistakes: ["Hedger sans comprendre le mécanisme de marge et de funding — vous pourriez être liquidé sur le short tout en perdant sur le spot"],
      exercise: "Simulez un hedge partiel de 50% sur votre portefeuille BTC pendant 2 semaines. Comparez le résultat avec un portefeuille non hedgé. Le hedge a-t-il été bénéfique ?",
    },
  ],
  quiz: [
    { question: "Le hedging consiste à :", options: ["Doubler sa position", "Ouvrir une position opposée pour se protéger", "Vendre tout son portefeuille", "Acheter plus en baisse"], correct: 1 },
    { question: "Un hedge partiel recommandé :", options: ["100% du portefeuille", "30-50% du portefeuille", "0% (ne pas hedger)", "200% (levier)"], correct: 1 },
    { question: "Le coût principal du hedging est :", options: ["Les frais de trading", "Le funding rate", "La commission de l'exchange", "L'impôt"], correct: 1 },
    { question: "Le hedge dynamique ajuste selon :", options: ["L'heure de la journée", "Les conditions du marché (RSI, MVRV)", "Le nombre de trades", "La météo"], correct: 1 },
  ],
};

export const module8Lessons: Lesson[] = [m8l1, m8l2, m8l3, m8l4, m8l5];