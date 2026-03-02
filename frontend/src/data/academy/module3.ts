import { Lesson } from "./types";

const m3l1: Lesson = {
  id: "m3-l1",
  title: "RSI, Stochastique et Momentum",
  icon: "📈",
  duration: "50 min",
  description: "Oscillateurs de momentum : RSI, Stochastique, divergences et signaux avancés.",
  subLessons: [
    {
      title: "RSI en Profondeur",
      content: [
        "Le RSI (Relative Strength Index) mesure la vitesse et l'amplitude des mouvements de prix sur une échelle de 0 à 100, avec une période standard de 14. RSI > 70 = zone de surachat (le prix a monté trop vite), RSI < 30 = zone de survente (le prix a baissé trop vite). Mais attention : en tendance forte, le RSI peut rester en zone extrême pendant longtemps.",
        "Les divergences RSI sont les signaux les plus puissants de cet indicateur. Divergence baissière : le prix fait un Higher High mais le RSI fait un Lower High → le momentum s'essouffle, retournement probable. Divergence haussière : le prix fait un Lower Low mais le RSI fait un Higher Low → la pression vendeuse diminue, rebond probable.",
        "Le RSI fonctionne aussi comme un support/résistance dynamique. En tendance haussière (bull market), le RSI rebondit généralement sur la zone 40-50 et ne descend pas sous 30. En tendance baissière (bear market), le RSI bute sur la zone 50-60 et ne monte pas au-dessus de 70. Ce comportement aide à confirmer la tendance de fond.",
        "Les divergences cachées signalent la continuation de tendance. En tendance haussière : prix fait un Higher Low mais RSI fait un Lower Low = continuation haussière. En tendance baissière : prix fait un Lower High mais RSI fait un Higher High = continuation baissière. Paramètres : RSI 7 pour le scalping, RSI 14 (standard), RSI 21 pour le swing trading.",
      ],
      keyPoints: [
        "> 70 = surachat, < 30 = survente (mais peut rester en zone extrême)",
        "Divergences classiques = signaux de retournement les plus puissants",
        "RSI comme S/R dynamique : 40-50 en bull, 50-60 en bear",
        "Divergences cachées = signaux de continuation",
      ],
      proTips: ["En bull market confirmé, achetez quand le RSI daily revient à 40-45 — c'est historiquement l'un des meilleurs points d'entrée"],
      commonMistakes: ["Vendre uniquement parce que le RSI > 70 en bull market — en tendance forte, le RSI peut rester en surachat pendant des semaines"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/006a12eb-ba19-4b48-8f77-3f99c43ce024.png",
          alt: "Indicateur RSI (Relative Strength Index)",
          caption: "RSI : zone de surachat (>70, rouge), zone de survente (<30, vert). L'oscillateur mesure la vitesse et l'amplitude des mouvements de prix.",
        },
      ],
    },
    {
      title: "Stochastique et StochRSI",
      content: [
        "L'oscillateur Stochastique compare le prix de clôture actuel à la fourchette de prix sur une période donnée. Il se compose de deux lignes : %K (ligne rapide) et %D (ligne lente, moyenne mobile de %K). Zone > 80 = surachat, zone < 20 = survente. Le croisement de %K au-dessus de %D en zone de survente = signal d'achat.",
        "Le Stochastique est excellent en range (marché latéral) car il identifie bien les extrêmes de prix. En tendance forte, il génère de nombreux faux signaux car il reste collé en zone extrême. Solution : n'utilisez que les signaux dans la direction de la tendance du timeframe supérieur.",
        "Le StochRSI applique la formule stochastique au RSI plutôt qu'au prix. Résultat : un indicateur beaucoup plus sensible qui génère plus de signaux mais aussi plus de faux signaux. Idéal pour le day trading et le scalping où la réactivité est essentielle.",
        "Stratégie multi-timeframe : identifiez la direction sur le timeframe supérieur (daily), puis utilisez le Stochastique sur le timeframe inférieur (4h ou 1h) pour le timing. Stochastique weekly en survente + daily qui croise à la hausse = signal d'achat très fort.",
      ],
      keyPoints: [
        "%K > 80 = surachat, %K < 20 = survente",
        "Croisement %K/%D = signal d'achat ou de vente",
        "Excellent en range, moins fiable en tendance forte",
        "Multi-timeframe pour les meilleurs résultats",
      ],
      proTips: ["En tendance haussière confirmée, n'utilisez que les signaux d'achat du Stochastique en zone de survente — ignorez les signaux de vente en surachat"],
      commonMistakes: ["Utiliser le Stochastique seul en tendance forte — il restera en zone extrême et générera des faux signaux de retournement"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/006a12eb-ba19-4b48-8f77-3f99c43ce024.png",
          alt: "Oscillateur Stochastique",
          caption: "Stochastique : croisements %K/%D en zones de surachat (>80) et survente (<20) avec signaux d'achat/vente"
        }
      ],
    },
    {
      title: "Momentum et Rate of Change",
      content: [
        "Le momentum mesure la vitesse de changement du prix. Un momentum croissant signifie que la tendance accélère — signe de santé. Un momentum décroissant signifie que la tendance ralentit — signe d'essoufflement. Le prix peut continuer à monter même si le momentum diminue, mais c'est un avertissement.",
        "Le ROC (Rate of Change) = ((Prix actuel - Prix il y a N périodes) / Prix il y a N périodes) × 100. Il exprime le changement en pourcentage. Un passage de positif à négatif signale un retournement baissier. Un passage de négatif à positif signale un retournement haussier.",
        "Le Williams %R est un oscillateur rapide sur une échelle de 0 à -100. Valeurs > -20 = surachat, valeurs < -80 = survente. Plus rapide et plus sensible que le Stochastique, il est utile pour le timing précis des entrées en scalping et day trading.",
        "Le momentum divergent du prix est un signal précoce de retournement. Confirmez toujours les breakouts avec le momentum : un breakout accompagné d'un momentum croissant est fiable, un breakout avec un momentum décroissant est suspect et pourrait être un faux breakout.",
      ],
      keyPoints: [
        "Momentum croissant = tendance saine et accélérante",
        "Momentum décroissant = tendance qui s'essouffle",
        "ROC positif → négatif = signal de retournement baissier",
        "Confirmer les breakouts avec le momentum",
      ],
      proTips: ["Un prix qui monte avec un momentum décroissant est un signal d'alerte précoce — préparez votre plan de sortie"],
      commonMistakes: ["Ignorer le momentum — un prix sans momentum derrière lui est un piège potentiel"],
    },
  ],
  quiz: [
    { question: "RSI > 70 indique :", options: ["Survente", "Surachat", "Neutre", "Volume élevé"], correct: 1 },
    { question: "Une divergence baissière RSI :", options: ["Prix HH + RSI HH", "Prix HH + RSI LH", "Prix LL + RSI HL", "Prix LL + RSI LL"], correct: 1 },
    { question: "Le Stochastique est le plus fiable en :", options: ["Tendance forte", "Range (marché latéral)", "Crash", "Toutes conditions"], correct: 1 },
    { question: "Un momentum décroissant signifie :", options: ["Tendance accélère", "Tendance s'essouffle", "Volume augmente", "Prix stable"], correct: 1 },
  ],
};

const m3l2: Lesson = {
  id: "m3-l2",
  title: "MACD, Signal Lines et Histogramme",
  icon: "📉",
  duration: "45 min",
  description: "MACD en profondeur : croisements, divergences, histogramme et paramètres optimaux.",
  subLessons: [
    {
      title: "Anatomie du MACD",
      content: [
        "Le MACD (Moving Average Convergence Divergence) est composé de trois éléments : la ligne MACD (EMA 12 - EMA 26), la ligne Signal (EMA 9 de la ligne MACD), et l'Histogramme (MACD - Signal). Le croisement de la ligne MACD au-dessus de la ligne Signal = signal d'achat. Le croisement en dessous = signal de vente.",
        "L'histogramme visualise la différence entre les lignes MACD et Signal. Des barres qui grandissent = le momentum accélère dans cette direction. Des barres qui rétrécissent = le momentum s'essouffle. L'histogramme change de signe AVANT le croisement des lignes, offrant un signal précoce.",
        "Le MACD est un indicateur retardé (lagging indicator) — il confirme ce qui s'est déjà passé plutôt que de prédire l'avenir. Utilisez-le pour CONFIRMER vos analyses, pas comme signal unique. Il fonctionne mieux en tendance qu'en range où il génère de nombreux faux croisements.",
        "La ligne zéro du MACD est un niveau important : MACD au-dessus de zéro = EMA 12 > EMA 26 = tendance haussière confirmée. MACD en dessous de zéro = tendance baissière. Le croisement de la ligne zéro est un signal de changement de tendance plus lent mais plus fiable que les croisements MACD/Signal.",
      ],
      keyPoints: [
        "MACD = EMA 12 - EMA 26, Signal = EMA 9 du MACD",
        "Croisement MACD/Signal = signal d'achat ou de vente",
        "Histogramme qui rétrécit = momentum qui s'essouffle",
        "Indicateur retardé — pour confirmer, pas pour prédire",
      ],
      proTips: ["L'histogramme qui commence à rétrécir est un signal précoce de retournement — il précède le croisement des lignes de plusieurs périodes"],
      commonMistakes: ["Utiliser le MACD comme signal unique de trading — c'est un outil de confirmation qui doit être combiné avec l'analyse de prix et d'autres indicateurs"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/05ae90aa-ddac-4dca-adf1-9bfbb3730033.png",
          alt: "Indicateur MACD avec Signal et Histogramme",
          caption: "MACD : ligne MACD (bleu), ligne Signal (orange), Histogramme (vert/rouge). Le croisement haussier se produit quand la ligne MACD croise au-dessus du Signal.",
        },
      ],
    },
    {
      title: "Divergences MACD",
      content: [
        "Les divergences MACD fonctionnent comme celles du RSI mais sont souvent plus visibles. Divergence haussière : le prix fait un Lower Low mais le MACD fait un Higher Low → la pression vendeuse diminue, retournement haussier probable. Divergence baissière : le prix fait un Higher High mais le MACD fait un Lower High.",
        "Le croisement de la ligne zéro est un signal de tendance plus fiable : MACD qui passe au-dessus de zéro = EMA 12 croise EMA 26 par le haut = tendance haussière confirmée. C'est un signal plus lent mais avec moins de faux signaux que les croisements MACD/Signal.",
        "La combinaison MACD + RSI en divergence au même moment + niveau de S/R = signal de très haute probabilité. Quand les deux indicateurs divergent simultanément du prix à un niveau technique clé, la probabilité de retournement est significativement plus élevée.",
        "Les divergences MACD sur le weekly sont des signaux majeurs qui ne se produisent que quelques fois par an. Elles précèdent souvent des mouvements de plusieurs semaines à mois. Ne les ignorez jamais — elles valent la peine d'attendre.",
      ],
      keyPoints: [
        "Divergence haussière : prix LL + MACD HL = retournement probable",
        "Divergence baissière : prix HH + MACD LH = retournement probable",
        "Croisement ligne zéro = confirmation de changement de tendance",
        "MACD + RSI divergence + S/R = signal très haute probabilité",
      ],
      proTips: ["Les divergences MACD sur le weekly sont rares mais extrêmement puissantes — elles signalent des retournements majeurs de tendance"],
      commonMistakes: ["Entrer immédiatement sur une divergence sans attendre la confirmation du prix — la divergence est un avertissement, pas un signal d'entrée immédiat"],
    },
    {
      title: "Paramètres et Variantes du MACD",
      content: [
        "Les paramètres standard (12, 26, 9) fonctionnent bien pour la plupart des situations. Pour le day trading, des paramètres plus rapides (8, 17, 9) offrent plus de réactivité mais aussi plus de faux signaux. Pour le position trading, des paramètres plus lents (19, 39, 9) filtrent le bruit mais sont plus retardés.",
        "La divergence de l'histogramme MACD est une technique avancée : quand l'histogramme diverge du prix (prix fait un nouveau sommet mais l'histogramme ne dépasse pas son précédent pic), c'est un signal précoce de retournement — encore plus précoce que la divergence des lignes MACD.",
        "Le PPO (Percentage Price Oscillator) est une variante du MACD exprimée en pourcentage plutôt qu'en valeur absolue. Avantage : il permet de comparer le momentum entre différents actifs (BTC vs ETH par exemple) car les valeurs sont normalisées. Même interprétation que le MACD.",
        "Conseil important : ne changez pas les paramètres trop souvent. Choisissez un set de paramètres adapté à votre style de trading et restez cohérent. L'optimisation excessive (overfitting) sur les données passées ne garantit pas les résultats futurs — c'est un piège classique.",
      ],
      keyPoints: [
        "Standard (12,26,9), rapide (8,17,9) pour day trading, lent (19,39,9) pour position",
        "Divergence de l'histogramme = signal encore plus précoce",
        "PPO = MACD en pourcentage, comparable entre actifs",
        "Rester cohérent avec ses paramètres — pas d'optimisation excessive",
      ],
      proTips: ["Commencez avec les paramètres standard (12,26,9) et ne les changez que si vous avez une raison spécifique et testée"],
      commonMistakes: ["Optimiser les paramètres sur les données passées (overfitting) — ce qui a marché hier ne marchera pas forcément demain"],
    },
  ],
  quiz: [
    { question: "Le MACD est composé de :", options: ["1 ligne", "2 lignes + histogramme", "3 moyennes mobiles", "RSI + Stochastique"], correct: 1 },
    { question: "Un histogramme MACD qui rétrécit indique :", options: ["Momentum croissant", "Momentum qui s'essouffle", "Volume élevé", "Rien de significatif"], correct: 1 },
    { question: "MACD au-dessus de la ligne zéro signifie :", options: ["Tendance baissière confirmée", "Tendance haussière confirmée", "Range", "Surachat"], correct: 1 },
    { question: "Les paramètres MACD rapides (8,17,9) sont pour :", options: ["Position trading", "Day trading", "Investissement long terme", "Analyse fondamentale"], correct: 1 },
  ],
};

const m3l3: Lesson = {
  id: "m3-l3",
  title: "Bollinger Bands, Keltner Channels, ATR",
  icon: "📊",
  duration: "50 min",
  description: "Indicateurs de volatilité : Bollinger, Keltner, ATR et le Squeeze.",
  subLessons: [
    {
      title: "Bollinger Bands en Détail",
      content: [
        "Les Bollinger Bands sont composées de 3 lignes : la bande médiane (SMA 20), la bande supérieure (SMA 20 + 2 écarts-types) et la bande inférieure (SMA 20 - 2 écarts-types). Statistiquement, 95% du prix reste entre les bandes. Quand le prix sort d'une bande, c'est un événement significatif.",
        "Le Bollinger Squeeze se produit quand les bandes se resserrent significativement — la volatilité est au plus bas. C'est le calme avant la tempête : une explosion de volatilité est imminente. La direction de la cassure détermine le trade. Le Squeeze sur le daily est l'un des signaux les plus fiables en analyse technique.",
        "La mean reversion (retour à la moyenne) : le prix tend à revenir vers la SMA 20 (bande médiane) après avoir touché une bande extrême. En range, achetez quand le prix touche la bande inférieure et vendez à la bande supérieure. En tendance forte, le prix peut 'surfer' sur une bande pendant longtemps.",
        "Le %B mesure la position du prix entre les bandes (0 = bande inférieure, 1 = bande supérieure, >1 = au-dessus). Le Bandwidth mesure l'écart entre les bandes en pourcentage — c'est un indicateur de volatilité. Un Bandwidth au plus bas historique = Squeeze imminent.",
      ],
      keyPoints: [
        "SMA 20 ± 2 écarts-types, 95% du prix entre les bandes",
        "Squeeze (bandes resserrées) = explosion de volatilité imminente",
        "Mean reversion vers la SMA 20 en conditions normales",
        "%B et Bandwidth pour des signaux quantitatifs précis",
      ],
      proTips: ["Le Bollinger Squeeze sur le daily est l'un des signaux les plus fiables — quand les bandes sont au plus serré, préparez-vous pour un mouvement majeur"],
      commonMistakes: ["Shorter quand le prix touche la bande supérieure en tendance haussière — en tendance forte, le prix surfe sur la bande et continue de monter"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/636bf6a2-975c-44a1-ad1d-2be293095afb.png",
          alt: "Bollinger Bands et Moyennes Mobiles",
          caption: "Bollinger Bands (bandes violettes autour de la SMA 20) et Moyennes Mobiles (EMA 50 jaune, EMA 200 cyan). Le squeeze et l'expansion des bandes indiquent les changements de volatilité.",
        },
      ],
    },
    {
      title: "Keltner Channels et TTM Squeeze",
      content: [
        "Les Keltner Channels utilisent l'EMA 20 comme ligne centrale et l'ATR (Average True Range) × 1.5 pour les bandes. Contrairement aux Bollinger Bands qui utilisent l'écart-type, les Keltner sont plus lisses et moins réactifs aux pics de volatilité soudains.",
        "Le TTM Squeeze (créé par John Carter) combine Bollinger et Keltner pour identifier les compressions de volatilité. Quand les Bollinger Bands sont INSIDE les Keltner Channels = squeeze actif (volatilité comprimée). Quand les Bollinger sortent des Keltner = le squeeze est terminé, le mouvement commence.",
        "Stratégie TTM Squeeze : (1) Identifiez le squeeze (Bollinger inside Keltner). (2) Attendez la fin du squeeze (Bollinger sortent). (3) Entrez dans la direction du momentum (histogramme du squeeze). (4) SL de l'autre côté du range de compression. Le TTM Squeeze sur le 4h et le daily donne les meilleurs résultats.",
        "Le prix qui sort des Keltner Channels (pas seulement des Bollinger) indique une tendance TRÈS forte. C'est un signal plus rare mais plus significatif. En combinant les deux indicateurs, vous obtenez une image complète de la volatilité et de la force de la tendance.",
      ],
      keyPoints: [
        "Keltner = EMA 20 ± 1.5 × ATR, plus lisse que Bollinger",
        "TTM Squeeze = Bollinger INSIDE Keltner = compression active",
        "Fin du squeeze = début du mouvement directionnel",
        "Prix hors Keltner = tendance très forte et significative",
      ],
      proTips: ["Le TTM Squeeze sur le 4h et le daily offre les meilleurs résultats — évitez les petits timeframes qui génèrent trop de faux signaux"],
      commonMistakes: ["Entrer pendant le squeeze au lieu d'attendre sa fin — le squeeze peut durer longtemps avant l'explosion"],
    },
    {
      title: "ATR : Average True Range",
      content: [
        "L'ATR mesure la volatilité moyenne sur une période donnée (standard : 14). Il ne donne PAS de direction — uniquement l'amplitude des mouvements. Un ATR élevé = forte volatilité (grands mouvements). Un ATR faible = faible volatilité (petits mouvements). Essentiel pour le placement des Stop Loss et le position sizing.",
        "Stop Loss basé sur l'ATR : placez votre SL à une distance de ATR × 1.5 à 2 du prix d'entrée. Cette méthode adapte automatiquement votre SL à la volatilité actuelle du marché. En période de forte volatilité, le SL est plus large (évite d'être stoppé par le bruit). En période calme, le SL est plus serré.",
        "Position sizing avec l'ATR : Taille de position = Risque maximum en $ / (ATR × multiplicateur × prix). Cette formule garantit que chaque trade risque le même montant en dollars, quelle que soit la volatilité de l'actif. C'est la méthode utilisée par les traders professionnels.",
        "L'ATR% (ATR / Prix × 100) permet de comparer la volatilité entre différents actifs. BTC avec un ATR% de 3% est plus volatile qu'ETH avec un ATR% de 2.5%. Utilisez l'ATR% pour ajuster votre allocation et votre levier en fonction de la volatilité relative de chaque actif.",
      ],
      keyPoints: [
        "ATR = mesure de volatilité, pas de direction",
        "SL basé sur ATR : prix d'entrée ± (ATR × 1.5-2)",
        "Position sizing : risque$ / (ATR × multiplicateur × prix)",
        "ATR% pour comparer la volatilité entre actifs",
      ],
      proTips: ["Utilisez l'ATR pour TOUS vos Stop Loss — c'est la méthode professionnelle qui s'adapte automatiquement aux conditions du marché"],
      commonMistakes: ["Placer un SL fixe en pourcentage (ex: toujours -3%) sans tenir compte de la volatilité actuelle — en période volatile, vous serez stoppé par le bruit"],
      exercise: "Calculez l'ATR 14 de BTC sur le daily. Placez un SL théorique à 2× ATR sous le prix actuel. Comparez avec un SL fixe à 3%. Lequel est le plus adapté aux conditions actuelles ?",
    },
  ],
  quiz: [
    { question: "Le Bollinger Squeeze signifie :", options: ["Le prix va baisser", "Forte volatilité actuelle", "Faible volatilité, explosion imminente", "Volume en baisse"], correct: 2 },
    { question: "L'ATR mesure :", options: ["La direction du prix", "La volatilité", "Le volume", "Le momentum"], correct: 1 },
    { question: "Le TTM Squeeze combine :", options: ["RSI et MACD", "Bollinger Bands et Keltner Channels", "EMA et SMA", "Volume et prix"], correct: 1 },
    { question: "Un SL basé sur l'ATR s'adapte à :", options: ["La direction du prix", "La volatilité du marché", "Le volume", "L'heure de la journée"], correct: 1 },
  ],
};

const m3l4: Lesson = {
  id: "m3-l4",
  title: "Moyennes Mobiles : SMA, EMA, WMA",
  icon: "〰️",
  duration: "45 min",
  description: "Moyennes mobiles, Golden/Death Cross et stratégies de croisement.",
  subLessons: [
    {
      title: "Types de Moyennes Mobiles",
      content: [
        "La SMA (Simple Moving Average) calcule la moyenne arithmétique des prix sur N périodes, donnant un poids égal à chaque prix. Avantage : stable et lisse, bon pour identifier les tendances long terme. Inconvénient : réagit lentement aux changements de prix récents car les anciens prix ont le même poids.",
        "L'EMA (Exponential Moving Average) donne un poids exponentiellement plus élevé aux prix récents, la rendant plus réactive aux mouvements actuels. L'EMA 200 réagit plus vite que la SMA 200 aux changements de tendance. C'est la moyenne mobile la plus utilisée par les traders professionnels pour sa réactivité.",
        "La WMA (Weighted Moving Average) attribue un poids linéairement décroissant : le prix le plus récent a le poids le plus élevé, le plus ancien le poids le plus faible. Elle se situe entre la SMA (trop lente) et l'EMA (parfois trop réactive). Moins utilisée mais utile dans certaines stratégies spécifiques.",
        "Périodes clés : 9/10 (court terme, scalping), 21 (swing trading — le 'sweet spot'), 50 (moyen terme), 100 (intermédiaire), 200 (tendance majeure, la plus importante). Utilisez l'EMA pour le trading actif (plus réactive) et la SMA pour l'analyse de tendance long terme (plus stable). Maximum 3 moyennes mobiles sur un graphique.",
      ],
      keyPoints: [
        "SMA = poids égal, stable mais lente",
        "EMA = poids récent plus élevé, plus réactive",
        "WMA = poids linéaire, entre SMA et EMA",
        "EMA pour le trading actif, SMA pour le long terme",
      ],
      proTips: ["L'EMA 21 est le 'sweet spot' pour le swing trading — le prix la respecte remarquablement bien sur le daily"],
      commonMistakes: ["Utiliser trop de moyennes mobiles (5+) sur le même graphique — 3 suffisent (21, 50, 200) pour éviter la surcharge visuelle"],
    },
    {
      title: "Golden Cross, Death Cross et Croisements",
      content: [
        "Le Golden Cross se produit quand l'EMA/SMA 50 croise l'EMA/SMA 200 par le haut. C'est un signal haussier majeur qui indique un changement de tendance de long terme. Sur le daily, c'est l'un des signaux les plus fiables — historiquement suivi de rallyes significatifs sur BTC.",
        "Le Death Cross est l'inverse : l'EMA/SMA 50 croise l'EMA/SMA 200 par le bas. Signal baissier majeur. Sur le daily BTC, les Death Cross ont précédé des baisses de 20-50%. C'est un signal lent mais puissant — quand il se produit, la tendance baissière est souvent déjà bien engagée.",
        "Croisements rapides pour le timing : EMA 9 croise EMA 21 = signal court terme. EMA 21 croise EMA 50 = signal moyen terme. Plus les périodes sont longues, plus le signal est fiable mais retardé. Les croisements fonctionnent mieux en tendance qu'en range (beaucoup de faux signaux en range).",
        "Stratégie des 3 EMA : EMA 21 (court terme), EMA 50 (moyen terme), EMA 200 (long terme). Quand les 3 sont alignées dans l'ordre (21 > 50 > 200 = haussier), la tendance est forte et claire. Quand elles sont emmêlées et se croisent fréquemment = range, pas de tendance claire — évitez de trader.",
      ],
      keyPoints: [
        "Golden Cross (50 croise 200 par le haut) = signal haussier majeur",
        "Death Cross (50 croise 200 par le bas) = signal baissier majeur",
        "3 EMA alignées (21 > 50 > 200) = tendance forte",
        "EMA emmêlées = range, éviter de trader les croisements",
      ],
      proTips: ["Le Golden Cross sur le weekly est un signal extrêmement rare et puissant — il ne se produit que quelques fois par décennie sur BTC"],
      commonMistakes: ["Trader les croisements en range — les faux signaux sont très fréquents quand le marché est latéral"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/636bf6a2-975c-44a1-ad1d-2be293095afb.png",
          alt: "Golden Cross et Death Cross",
          caption: "Golden Cross (EMA 50 croise EMA 200 par le haut) et Death Cross : signaux majeurs de changement de tendance"
        }
      ],
    },
    {
      title: "EMA comme Support/Résistance Dynamique",
      content: [
        "Les moyennes mobiles agissent comme des supports et résistances dynamiques qui évoluent avec le prix. En tendance haussière, le prix rebondit régulièrement sur les EMA. EMA 21 = pullback court terme (tendance forte). EMA 50 = pullback moyen terme. EMA 200 = support majeur (si cassé, la tendance est probablement terminée).",
        "Stratégie de pullback EMA : (1) Confirmez la tendance (prix au-dessus des 3 EMA, alignées). (2) Attendez un pullback vers l'EMA 21 ou 50. (3) Cherchez un chandelier de retournement (hammer, engulfing) au contact de l'EMA. (4) Entrez avec SL sous l'EMA. (5) TP au précédent sommet ou extension Fibonacci.",
        "L'EMA 200 daily est LA ligne de démarcation entre bull et bear market. Prix au-dessus de l'EMA 200 = bull market. Prix en dessous = bear market. C'est le niveau le plus surveillé par les traders institutionnels. Un retest de l'EMA 200 après un Golden Cross est souvent un excellent point d'achat.",
        "Les 'EMA ribbons' (rubans de moyennes mobiles) utilisent plusieurs EMA rapprochées (8, 13, 21, 34, 55). Quand elles sont étalées et ordonnées = tendance forte et claire. Quand elles convergent et s'emmêlent = consolidation. L'expansion du ruban après une compression = début de nouvelle tendance.",
      ],
      keyPoints: [
        "EMA 21 = pullback court terme, EMA 50 = moyen terme, EMA 200 = majeur",
        "Pullback vers EMA + chandelier de retournement = entrée",
        "EMA 200 daily = ligne de démarcation bull/bear market",
        "EMA ribbon : étalé = tendance forte, emmêlé = consolidation",
      ],
      proTips: ["Le retest de l'EMA 200 daily après un Golden Cross est historiquement l'un des meilleurs points d'achat à long terme"],
      commonMistakes: ["Acheter un pullback vers l'EMA sans attendre le chandelier de confirmation — l'EMA peut être cassée et le pullback peut devenir un retournement"],
    },
  ],
  quiz: [
    { question: "Le Golden Cross est :", options: ["EMA 200 croise EMA 50 par le haut", "EMA 50 croise EMA 200 par le haut", "RSI croise 50", "MACD croise 0"], correct: 1 },
    { question: "L'EMA 200 daily sépare :", options: ["Surachat et survente", "Bull market et bear market", "Scalping et swing", "Volume haut et bas"], correct: 1 },
    { question: "Quelle EMA est la plus réactive ?", options: ["EMA 200", "EMA 50", "EMA 21", "SMA 200"], correct: 2 },
    { question: "3 EMA emmêlées signifient :", options: ["Tendance forte", "Range / pas de tendance claire", "Signal d'achat", "Volume élevé"], correct: 1 },
  ],
};

const m3l5: Lesson = {
  id: "m3-l5",
  title: "Volume Profile, OBV, VWAP, CMF",
  icon: "📶",
  duration: "55 min",
  description: "Indicateurs de volume avancés pour comprendre l'activité institutionnelle.",
  subLessons: [
    {
      title: "Volume Profile et POC",
      content: [
        "Le Volume Profile affiche le volume échangé à chaque niveau de prix sous forme d'histogramme horizontal. Contrairement au volume classique (vertical, par période), il montre OÙ le volume s'est concentré. Le POC (Point of Control) est le prix avec le plus de volume échangé — c'est le niveau le plus important du profil.",
        "Les HVN (High Volume Nodes) sont des zones de forte activité de trading — elles agissent comme des supports et résistances forts car beaucoup de traders ont des positions à ces niveaux. Les LVN (Low Volume Nodes) sont des zones de faible activité — le prix les traverse rapidement car peu de traders y ont des intérêts.",
        "La Value Area (VA) contient 70% du volume total échangé. Le prix tend à revenir dans la Value Area quand il s'en éloigne (mean reversion). Un breakout hors de la Value Area avec volume = mouvement significatif et directionnel.",
        "Application pratique : utilisez le Volume Profile sur le daily et le weekly pour identifier les niveaux de prix les plus significatifs. Le POC est souvent un aimant pour le prix — il y revient fréquemment. Les LVN entre deux HVN créent des 'zones de transition rapide' que le prix traverse sans s'arrêter.",
      ],
      keyPoints: [
        "POC = prix avec le plus de volume = S/R le plus fort",
        "HVN = S/R forts, LVN = prix traverse rapidement",
        "Value Area = 70% du volume, le prix y revient souvent",
        "Breakout hors Value Area = mouvement significatif",
      ],
      proTips: ["Le POC est le niveau le plus important du Volume Profile — marquez-le toujours sur votre graphique, c'est l'outil préféré des traders institutionnels"],
      commonMistakes: ["Ignorer le Volume Profile — c'est l'un des outils les plus puissants pour comprendre où se trouvent les positions institutionnelles"],
    },
    {
      title: "OBV et VWAP",
      content: [
        "L'OBV (On-Balance Volume) est un indicateur cumulatif : il ajoute le volume les jours haussiers et soustrait le volume les jours baissiers. Si l'OBV monte alors que le prix stagne = accumulation (le smart money achète discrètement). Si l'OBV baisse alors que le prix monte = distribution (le smart money vend).",
        "Le VWAP (Volume Weighted Average Price) est le prix moyen pondéré par le volume de la journée. C'est LE niveau utilisé par les traders institutionnels pour évaluer la qualité de leurs exécutions. Prix > VWAP = haussier intraday (les acheteurs dominent). Prix < VWAP = baissier intraday.",
        "Le VWAP sert de support/résistance dynamique intraday extrêmement respecté. Les institutions achètent sous le VWAP (considéré comme un 'bon prix') et vendent au-dessus. Le VWAP se réinitialise chaque jour — il est donc principalement utile pour le day trading et le scalping.",
        "Les bandes VWAP (VWAP ± écarts-types) fonctionnent comme les Bollinger Bands mais basées sur le volume. Le prix qui touche la bande VWAP +2σ est en surachat intraday. Le prix qui touche -2σ est en survente intraday. Excellent pour le mean reversion trading intraday.",
      ],
      keyPoints: [
        "OBV divergent du prix = accumulation ou distribution",
        "VWAP = prix moyen pondéré par volume, référence institutionnelle",
        "Prix > VWAP = haussier intraday, < VWAP = baissier",
        "VWAP se réinitialise chaque jour — outil intraday",
      ],
      proTips: ["Combinez l'OBV avec les niveaux de S/R pour détecter l'accumulation du smart money — OBV en hausse + prix au support = signal d'achat puissant"],
      commonMistakes: ["Utiliser le VWAP sur des timeframes supérieurs au daily — il se réinitialise chaque jour et n'a pas de sens sur le weekly"],
    },
    {
      title: "CMF et Money Flow Index",
      content: [
        "Le CMF (Chaikin Money Flow) mesure la pression d'achat vs la pression de vente sur une période donnée (standard : 20). CMF > 0 = pression acheteuse dominante (l'argent entre). CMF < 0 = pression vendeuse dominante (l'argent sort). Plus la valeur est éloignée de zéro, plus la pression est forte.",
        "Le CMF divergent du prix est un signal puissant. Prix qui monte + CMF qui baisse = distribution en cours (le smart money vend pendant que le prix monte encore). Prix qui baisse + CMF qui monte = accumulation en cours (le smart money achète pendant que le prix baisse encore).",
        "Le MFI (Money Flow Index) est souvent appelé le 'RSI du volume' car il combine le prix ET le volume dans son calcul. Échelle 0-100. MFI > 80 = surachat, MFI < 20 = survente. Il est souvent plus fiable que le RSI classique car il intègre l'information du volume.",
        "Stratégie combinée : utilisez le CMF pour la direction du flux d'argent, le MFI pour les zones de surachat/survente, et l'OBV pour confirmer l'accumulation ou la distribution. Quand les trois indicateurs de volume s'alignent avec l'analyse de prix, la probabilité de succès est significativement plus élevée.",
      ],
      keyPoints: [
        "CMF > 0 = pression acheteuse, CMF < 0 = pression vendeuse",
        "CMF divergent du prix = accumulation ou distribution",
        "MFI = RSI du volume, intègre prix + volume",
        "MFI > 80 = surachat, MFI < 20 = survente",
      ],
      proTips: ["Le MFI est souvent plus fiable que le RSI classique car il intègre le volume — considérez-le comme un upgrade du RSI"],
      commonMistakes: ["Ignorer complètement les indicateurs de volume — le volume est l'information la plus importante après le prix lui-même"],
      exercise: "Ajoutez le Volume Profile et l'OBV à votre graphique BTC daily. Identifiez les zones d'accumulation et de distribution des 3 derniers mois. Comparez avec les mouvements de prix qui ont suivi.",
    },
  ],
  quiz: [
    { question: "Le POC (Point of Control) est :", options: ["Le prix le plus haut", "Le prix avec le plus de volume échangé", "Le prix le plus bas", "Le prix d'ouverture"], correct: 1 },
    { question: "OBV qui monte + prix qui stagne =", options: ["Distribution", "Accumulation", "Neutre", "Crash imminent"], correct: 1 },
    { question: "Le VWAP sert principalement de :", options: ["Indicateur de tendance long terme", "S/R dynamique intraday", "Mesure de volatilité", "Oscillateur de momentum"], correct: 1 },
    { question: "Le MFI est appelé :", options: ["Le MACD du volume", "Le RSI du volume", "Le Stochastique du volume", "Le Bollinger du volume"], correct: 1 },
  ],
};

export const module3Lessons: Lesson[] = [m3l1, m3l2, m3l3, m3l4, m3l5];