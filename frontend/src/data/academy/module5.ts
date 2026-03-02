import { Lesson } from "./types";

const m5l1: Lesson = {
  id: "m5-l1",
  title: "Les Bases du Day Trading Crypto",
  icon: "⚡",
  duration: "45 min",
  description: "Fondamentaux du day trading : mindset, setup, sessions et gestion du temps.",
  subLessons: [
    {
      title: "Qu'est-ce que le Day Trading ?",
      content: [
        "Le day trading consiste à ouvrir et fermer toutes les positions dans la même journée de trading. Aucune position n'est gardée overnight. Les timeframes utilisés sont le 5m, 15m et 1h. L'objectif est de capturer les mouvements intraday de 0.5-3% par trade.",
        "Avantages : pas de risque overnight (gaps, news nocturnes), profits quotidiens potentiels, pas d'exposition aux mouvements de weekend. Inconvénients : stress élevé et constant, nécessite 4-8h de disponibilité par jour, les frais de trading s'accumulent rapidement, fiscalité complexe.",
        "Prérequis absolus : capital minimum de 5 000-10 000$ (en dessous, les frais mangent les profits), connexion Internet fiable avec backup 4G, 2 écrans minimum, plateforme avec exécution rapide et faible latence, connaissance solide de l'analyse technique. Le day trading n'est PAS pour les débutants.",
        "Statistique importante : environ 90% des day traders perdent de l'argent sur le long terme. Les 10% qui réussissent ont généralement 1-2 ans d'expérience en paper trading, une discipline de fer, et un système de trading rigoureusement testé. Ne sous-estimez pas la difficulté.",
      ],
      keyPoints: [
        "Toutes positions fermées dans la même journée",
        "Timeframes : 5m, 15m, 1h — objectif 0.5-3% par trade",
        "Prérequis : capital 5-10k$, 2 écrans, connexion fiable",
        "90% des day traders perdent — PAS pour les débutants",
      ],
      proTips: ["Commencez en paper trading pendant 3 mois minimum avant de risquer du capital réel — c'est un investissement en temps qui vous épargnera des milliers de dollars"],
      commonMistakes: ["Commencer le day trading sans expérience ni capital suffisant — c'est la recette pour perdre rapidement son argent"],
    },
    {
      title: "Setup et Environnement de Trading",
      content: [
        "Matériel recommandé : 2 écrans minimum (un pour le graphique principal, un pour le carnet d'ordres et les positions), connexion Internet fiable avec un backup mobile 4G, ordinateur performant avec suffisamment de RAM. Un environnement calme, sans distraction, est essentiel pour la concentration.",
        "Logiciels essentiels : TradingView pour l'analyse technique (le standard de l'industrie), plateforme d'exchange avec exécution rapide (Binance, Bybit), système d'alertes de prix configuré aux niveaux clés, scanner de volume pour détecter les mouvements anormaux, calendrier économique (forexfactory.com).",
        "Routine pré-marché (30-60 minutes avant de trader) : (1) Vérifier le calendrier économique pour les annonces du jour. (2) Analyser BTC et ETH sur le daily et le 4h pour la direction. (3) Identifier les niveaux clés (S/R, EMA, Fibonacci). (4) Définir 2-3 scénarios possibles. (5) Préparer les ordres aux niveaux identifiés.",
        "Cette préparation représente 80% du succès en day trading. Les meilleurs day traders passent plus de temps à préparer qu'à trader activement. Un trader bien préparé exécute mécaniquement son plan, tandis qu'un trader non préparé improvise et perd.",
      ],
      keyPoints: [
        "2 écrans minimum : graphique principal + ordres/positions",
        "TradingView + exchange rapide + alertes + calendrier économique",
        "Routine pré-marché de 30-60 minutes non négociable",
        "La préparation = 80% du succès en day trading",
      ],
      proTips: ["La préparation représente 80% du succès — un trader bien préparé a déjà gagné avant même d'ouvrir une position"],
      commonMistakes: ["Trader sans préparation en improvisant — c'est du gambling, pas du trading"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/f0265400-965c-410a-a7e7-9a6d9b1d8f84.png",
          alt: "Setup de Day Trading",
          caption: "Configuration multi-écrans optimale pour le day trading : graphiques, order book et news"
        }
      ],
    },
    {
      title: "Sessions de Trading Crypto",
      content: [
        "Contrairement aux marchés traditionnels, le marché crypto est ouvert 24/7. Mais la volatilité et le volume varient considérablement selon les sessions. Session asiatique (1h-9h UTC) : volume modéré, mouvements plus calmes. Session européenne (7h-16h UTC) : volume croissant, début de la journée active.",
        "Session américaine (13h-22h UTC) : volume maximum, mouvements les plus importants. Le chevauchement Europe/US (13h-16h UTC) est la période la plus volatile et potentiellement la plus profitable — c'est là que se concentrent les meilleurs setups de day trading.",
        "Les annonces macro-économiques américaines (CPI, FOMC, NFP) se produisent pendant la session américaine et créent des mouvements majeurs et imprévisibles. Ne tradez PAS avec du levier 15 minutes avant et après ces annonces — les spreads s'élargissent et les mouvements sont erratiques.",
        "Weekends : volume significativement plus faible, spreads plus larges, mouvements parfois erratiques et imprévisibles. Beaucoup de day traders professionnels évitent complètement le weekend. Le lundi matin (session asiatique) peut être volatile après un weekend d'accumulation de news.",
      ],
      keyPoints: [
        "Chevauchement Europe/US (13h-16h UTC) = plus volatile et profitable",
        "Annonces macro US (CPI, FOMC, NFP) = mouvements majeurs",
        "Weekends : volume faible, spreads larges — éviter",
        "Adapter son trading aux sessions pour maximiser les résultats",
      ],
      proTips: ["Concentrez votre trading actif sur le chevauchement Europe/US pour maximiser les opportunités avec le meilleur volume"],
      commonMistakes: ["Trader pendant les heures de faible volume (nuit, weekend) — les spreads sont larges et les faux mouvements fréquents"],
    },
  ],
  quiz: [
    { question: "Le day trading ferme les positions :", options: ["Après une semaine", "Dans la même journée", "Après un mois", "Quand le profit est atteint"], correct: 1 },
    { question: "La session la plus volatile est :", options: ["Session asiatique", "Session européenne seule", "Chevauchement Europe/US", "Weekend"], correct: 2 },
    { question: "Pourcentage de day traders qui perdent :", options: ["10%", "50%", "70%", "90%"], correct: 3 },
    { question: "La routine pré-marché dure :", options: ["5 minutes", "30-60 minutes", "3 heures", "Pas nécessaire"], correct: 1 },
  ],
};

const m5l2: Lesson = {
  id: "m5-l2",
  title: "Stratégies de Day Trading",
  icon: "🎯",
  duration: "55 min",
  description: "Breakout, Pullback, Range Trading — les 3 stratégies essentielles.",
  subLessons: [
    {
      title: "Stratégie Breakout",
      content: [
        "Le breakout trading capture le mouvement explosif quand le prix sort d'un range, triangle ou consolidation. Identifiez la zone de consolidation sur le 15m ou 1h, attendez que le prix casse avec un volume au moins 2x supérieur à la moyenne — c'est la confirmation essentielle.",
        "Entrée : à la cassure immédiate (plus agressif) ou au retest du niveau cassé (plus sûr, meilleur R:R). Stop Loss : de l'autre côté de la consolidation. Take Profit : hauteur de la consolidation projetée depuis le point de cassure, ou extension Fibonacci 161.8%.",
        "Filtres de qualité pour éviter les faux breakouts : (1) La consolidation dure depuis au moins 2 heures. (2) Le volume était décroissant pendant la consolidation puis explose à la cassure. (3) La direction de la cassure est alignée avec la tendance du 4h et du daily. (4) Pas d'annonce macro imminente dans les 30 prochaines minutes.",
        "Les faux breakouts sont fréquents — environ 40-50% des cassures échouent. C'est pourquoi le volume est le filtre le plus important. Un breakout sans volume significatif est suspect et devrait être évité. Le retest après la cassure confirme que le niveau cassé tient et réduit le risque de faux signal.",
      ],
      keyPoints: [
        "Cassure de consolidation avec volume 2x+ la moyenne",
        "Entrée au retest du niveau cassé = plus sûr et meilleur R:R",
        "TP = hauteur de la consolidation projetée ou Fib 161.8%",
        "Aligné avec la tendance du timeframe supérieur",
      ],
      proTips: ["Les breakouts les plus fiables se produisent après une compression de 4h+ avec un volume décroissant suivi d'une explosion de volume"],
      commonMistakes: ["Trader les faux breakouts — attendez toujours la confirmation du volume et idéalement le retest"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/8c2c8456-0127-475f-a792-f56e8d372e66.png",
          alt: "Stratégie Breakout avec volume",
          caption: "Breakout de consolidation : cassure avec spike de volume confirmant le mouvement directionnel"
        }
      ],
    },
    {
      title: "Stratégie Pullback",
      content: [
        "Le pullback trading entre dans la direction de la tendance après un retracement temporaire. La logique : la tendance est votre amie, et les pullbacks offrent des points d'entrée à faible risque dans cette tendance. Tendance haussière sur le 4h → pullback vers l'EMA 21 sur le 15m → chandelier de retournement → entrée.",
        "Niveaux de pullback par ordre de force de tendance : EMA 21 (pullback léger, tendance très forte), EMA 50 (pullback moyen, tendance correcte), Fibonacci 38.2-61.8% (pullback standard). Le pullback idéal touche un niveau de confluence (EMA + Fibonacci + S/R horizontal).",
        "Gestion de la position : SL sous le creux du pullback (avec une marge de quelques ticks). TP1 : précédent sommet. TP2 : extension Fibonacci. R:R minimum 1:2. Si le pullback casse l'EMA 50 ET le Fibonacci 61.8%, la tendance est probablement terminée — ne cherchez pas à entrer.",
        "Le pullback est la stratégie la plus fiable en day trading car elle combine la force de la tendance avec un point d'entrée optimisé. La clé est la patience : attendez que le pullback atteigne un niveau technique significatif et qu'un chandelier de retournement confirme le rebond.",
      ],
      keyPoints: [
        "Entrer dans la direction de la tendance après un retracement",
        "EMA 21 = pullback léger (tendance forte), Fib 38-61% = standard",
        "SL sous le creux du pullback, R:R minimum 1:2",
        "Confluence EMA + Fib + S/R = pullback idéal",
      ],
      proTips: ["Le pullback vers l'EMA 21 en tendance forte est le setup le plus fiable et reproductible en day trading — maîtrisez-le en priorité"],
      commonMistakes: ["Entrer trop tôt dans le pullback sans attendre le chandelier de retournement — le pullback peut continuer et devenir un retournement"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/810c3303-6b75-44db-b54f-2cf48568eaef.png",
          alt: "Stratégie Pullback en tendance",
          caption: "Pullback vers l'EMA/trendline en tendance haussière : point d'entrée optimal avec SL et target"
        }
      ],
    },
    {
      title: "Stratégie Range Trading",
      content: [
        "Le range trading achète au support et vend à la résistance quand le marché est latéral (sans tendance claire). Identifiez un range clair sur le 15m ou 1h avec au moins 2 touches de chaque côté (support et résistance) pour confirmer la validité du range.",
        "Entrée : chandelier de retournement au contact du support (achat) ou de la résistance (vente). SL : juste au-delà du range (quelques ticks sous le support pour un achat, au-dessus de la résistance pour une vente). TP : l'autre côté du range. R:R typique 1:2 à 1:3.",
        "Le range trading fonctionne environ 70% du temps car les marchés sont en range environ 70% du temps. C'est une stratégie sous-estimée par les traders qui cherchent toujours des tendances. Mais quand le range casse, sortez IMMÉDIATEMENT — ne restez pas dans un trade de range après la cassure.",
        "Utilisez le Bollinger Squeeze et le RSI pour optimiser le range trading. RSI < 30 au support = signal d'achat renforcé. RSI > 70 à la résistance = signal de vente renforcé. Bollinger Squeeze = le range va bientôt casser, préparez-vous à changer de stratégie.",
      ],
      keyPoints: [
        "Acheter au support, vendre à la résistance en marché latéral",
        "Range confirmé avec 2+ touches de chaque côté",
        "SL juste au-delà du range, TP à l'autre côté",
        "Sortir immédiatement quand le range casse",
      ],
      proTips: ["Combinez le range trading avec le RSI : achetez quand RSI < 30 au support, vendez quand RSI > 70 à la résistance — cela filtre les faux signaux"],
      commonMistakes: ["Continuer à trader le range après sa cassure — adaptez-vous immédiatement aux nouvelles conditions du marché"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/c82d17f6-9ca1-4adb-96a0-067a3fdaf689.png",
          alt: "Range Trading",
          caption: "Range Trading : acheter au support, vendre à la résistance dans un marché latéral"
        }
      ],
    },
  ],
  quiz: [
    { question: "Un breakout fiable nécessite :", options: ["Volume faible", "Volume 2x+ la moyenne", "Pas de volume particulier", "Volume décroissant"], correct: 1 },
    { question: "Le pullback idéal en tendance forte touche :", options: ["L'EMA 200", "L'EMA 21", "Le support weekly", "Le prix zéro"], correct: 1 },
    { question: "Les marchés sont en range environ :", options: ["10% du temps", "30% du temps", "70% du temps", "100% du temps"], correct: 2 },
    { question: "Après la cassure d'un range, il faut :", options: ["Continuer le range trading", "Sortir immédiatement", "Doubler la position", "Ignorer la cassure"], correct: 1 },
  ],
};

const m5l3: Lesson = {
  id: "m5-l3",
  title: "Gestion du Temps et Sessions",
  icon: "⏰",
  duration: "40 min",
  description: "Optimiser votre temps de trading, gérer la fatigue et maximiser l'efficacité.",
  subLessons: [
    {
      title: "Planification de la Journée",
      content: [
        "Structure optimale d'une journée de day trading : Routine matinale de préparation (30-60 min) : analyse macro, identification des niveaux clés, définition des scénarios. Trading actif (2-4h) : exécution disciplinée des setups préparés. Revue de fin de journée (15-30 min) : journal, analyse des trades, leçons apprises.",
        "Ne tradez pas plus de 4-6 heures par jour. La fatigue mentale dégrade significativement la qualité de prise de décision après cette durée. Les meilleurs day traders sont actifs pendant les heures de haute volatilité et se reposent le reste du temps — qualité > quantité.",
        "Règle des 3 trades perdants : si vous perdez 3 trades consécutifs, arrêtez de trader pour la journée. Le revenge trading (essayer de récupérer ses pertes immédiatement) après des pertes consécutives est la cause #1 de pertes catastrophiques en day trading.",
        "Planifiez vos jours de repos : ne tradez pas tous les jours. 3-4 jours de trading actif par semaine est optimal pour la plupart des traders. Les jours de repos permettent de recharger mentalement et d'analyser vos performances de la semaine avec du recul.",
      ],
      keyPoints: [
        "Routine : préparation (30-60 min) + trading actif (2-4h) + revue (15-30 min)",
        "Maximum 4-6 heures de trading actif par jour",
        "Règle des 3 pertes consécutives = stop pour la journée",
        "3-4 jours de trading par semaine = optimal",
      ],
      proTips: ["Tradez uniquement pendant les 2-3 heures les plus volatiles de la journée — vous capturerez 80% des opportunités en 30% du temps"],
      commonMistakes: ["Trader 12+ heures par jour — la fatigue mentale garantit des erreurs coûteuses"],
    },
    {
      title: "Calendrier Économique et Événements",
      content: [
        "Les annonces macro-économiques créent de la volatilité massive et imprévisible. Les plus importantes : CPI (inflation), FOMC (décisions de taux de la Fed), NFP (emploi), GDP (croissance). Consultez forexfactory.com ou investing.com chaque matin pour les annonces du jour.",
        "Règle stricte : ne tradez PAS avec du levier 15 minutes avant et 15 minutes après une annonce majeure (sauf si c'est votre stratégie spécifique et testée). Les mouvements sont imprévisibles, les spreads s'élargissent considérablement, et le slippage peut être important.",
        "Événements crypto spécifiques à surveiller : listings sur les exchanges majeurs, unlocks de tokens (vesting), mises à jour majeures de protocoles (hard forks, upgrades), annonces réglementaires (SEC, UE), et conférences crypto importantes. Suivez CoinMarketCal pour un calendrier complet.",
        "Stratégie post-annonce : attendez 15-30 minutes après l'annonce pour que la volatilité initiale se calme, puis tradez la direction établie. Les mouvements post-annonce sont souvent plus fiables que la réaction initiale qui est dominée par les algorithmes et les émotions.",
      ],
      keyPoints: [
        "CPI, FOMC, NFP = annonces à volatilité massive",
        "Pas de trading avec levier 15 min avant/après les annonces",
        "Les spreads s'élargissent pendant les annonces majeures",
        "CoinMarketCal pour les événements crypto spécifiques",
      ],
      proTips: ["Marquez les annonces importantes dans votre calendrier chaque dimanche soir lors de votre préparation hebdomadaire"],
      commonMistakes: ["Trader avec du levier pendant les annonces FOMC — c'est extrêmement dangereux et imprévisible"],
    },
    {
      title: "Gestion de la Fatigue et du Stress",
      content: [
        "Le day trading est l'une des activités les plus mentalement épuisantes. Prenez des pauses régulières de 5 minutes toutes les heures. Hydratez-vous correctement. Faites de l'exercice physique régulièrement. Dormez 7-8 heures par nuit — le manque de sommeil est l'ennemi #1 de la performance cognitive.",
        "Signes de fatigue à reconnaître immédiatement : trades impulsifs sans respecter votre plan, Stop Loss déplacés dans le mauvais sens, taille de position augmentée par frustration, irritabilité croissante, difficulté à se concentrer. Si vous remarquez UN de ces signes, arrêtez immédiatement de trader.",
        "L'exercice physique améliore significativement la prise de décision en trading. 30 minutes d'exercice le matin avant de trader améliore la concentration, réduit le stress, et augmente la clarté mentale. Les traders professionnels intègrent l'exercice dans leur routine quotidienne.",
        "Équilibre vie/trading : le day trading ne doit pas consumer votre vie entière. Définissez des horaires fixes de trading et respectez-les strictement. Passez du temps avec votre famille, vos amis, et vos hobbies. Les meilleurs traders ont une vie équilibrée en dehors des marchés — cela améliore paradoxalement leurs performances.",
      ],
      keyPoints: [
        "Pauses de 5 min toutes les heures, exercice physique régulier",
        "Sommeil 7-8h = non négociable pour la performance",
        "Signes de fatigue = arrêter immédiatement de trader",
        "Équilibre vie/trading = meilleure performance à long terme",
      ],
      proTips: ["30 minutes d'exercice physique le matin avant de trader améliore significativement votre concentration et vos décisions"],
      commonMistakes: ["Sacrifier le sommeil pour trader les sessions asiatiques — les décisions fatiguées coûtent bien plus cher que les opportunités manquées"],
    },
  ],
  quiz: [
    { question: "Après 3 pertes consécutives :", options: ["Doubler la taille de position", "Arrêter pour la journée", "Changer immédiatement de stratégie", "Passer à un timeframe plus petit"], correct: 1 },
    { question: "Pendant une annonce FOMC :", options: ["Levier maximum pour profiter de la volatilité", "Pas de trading 15 min avant/après", "Acheter immédiatement", "Shorter systématiquement"], correct: 1 },
    { question: "Maximum d'heures de trading actif par jour :", options: ["2h", "4-6h", "12h", "24h"], correct: 1 },
    { question: "L'exercice physique pour un trader :", options: ["Est une perte de temps", "Améliore la prise de décision", "N'a aucun impact", "Est dangereux"], correct: 1 },
  ],
};

const m5l4: Lesson = {
  id: "m5-l4",
  title: "Outils et Setup du Day Trader",
  icon: "🖥️",
  duration: "45 min",
  description: "Les outils essentiels, indicateurs et configuration optimale pour le day trading.",
  subLessons: [
    {
      title: "Configuration des Graphiques",
      content: [
        "Écran 1 — Graphique principal : timeframe 15m ou 1h avec EMA 21/50, Volume, RSI 14. C'est votre vue principale pour identifier les setups et prendre les décisions. Gardez ce graphique propre et lisible — pas plus de 4-5 indicateurs.",
        "Écran 2 — Graphique secondaire et outils : graphique 5m pour le timing précis des entrées, carnet d'ordres (order book) pour voir la profondeur du marché, positions ouvertes et P&L en temps réel, et le graphique daily/4h en petit pour le contexte de tendance.",
        "Indicateurs recommandés pour le day trading : EMA 9/21/50 (direction et S/R dynamiques), RSI 14 (momentum et divergences), VWAP (niveau institutionnel intraday), Volume (confirmation des mouvements), Bollinger Bands ou Keltner Channels (volatilité). Maximum 4-5 indicateurs total.",
        "Créez 2-3 templates de graphique sur TradingView et basculez rapidement selon les conditions : template 'Tendance' (EMA + RSI + Volume), template 'Range' (Bollinger + RSI + Volume), template 'Scalping' (VWAP + Volume + EMA 9). Cette organisation vous fait gagner un temps précieux.",
      ],
      keyPoints: [
        "2 écrans : graphique principal (15m/1h) + timing/ordres (5m)",
        "Maximum 4-5 indicateurs pour rester lisible",
        "EMA + RSI + VWAP + Volume = combo de base du day trader",
        "Templates TradingView pour basculer rapidement",
      ],
      proTips: ["Sauvegardez vos templates TradingView avec des noms clairs — le gain de temps est énorme quand les conditions changent rapidement"],
      commonMistakes: ["Surcharger les graphiques avec 10+ indicateurs — cela crée de la paralysie d'analyse et ralentit la prise de décision"],
    },
    {
      title: "Alertes et Ordres Conditionnels",
      content: [
        "Configurez des alertes de prix sur TradingView à tous les niveaux clés identifiés pendant votre préparation matinale. Alertes de croisement EMA, RSI entrant en zone extrême (>70 ou <30), volume anormal (2x+ la moyenne). Les alertes vous libèrent de l'obligation de fixer l'écran en permanence.",
        "Quand une alerte se déclenche, analysez rapidement la situation (30 secondes à 1 minute) et décidez si le setup correspond à vos critères. Cette approche réduit considérablement le stress et améliore la qualité des décisions car vous n'êtes pas en mode 'surveillance constante'.",
        "Les ordres conditionnels (bracket orders) vous permettent de préparer vos ordres à l'avance : entrée + SL + TP simultanés. Quand l'entrée est déclenchée, le SL et le TP sont automatiquement placés. Moins d'émotion, meilleure exécution, pas de risque d'oublier le SL.",
        "Automatisez tout ce qui peut l'être : alertes aux niveaux clés, ordres bracket pré-configurés, calcul automatique de la taille de position. Plus vous automatisez les aspects mécaniques, plus vous pouvez vous concentrer sur l'analyse et la prise de décision de qualité.",
      ],
      keyPoints: [
        "Alertes aux niveaux clés = pas besoin de fixer l'écran",
        "Alertes RSI, croisement EMA, volume anormal",
        "Ordres bracket : entrée + SL + TP simultanés et automatiques",
        "Automatiser les aspects mécaniques pour se concentrer sur l'analyse",
      ],
      proTips: ["Préparez tous vos ordres pendant la session de préparation matinale — pas pendant le trading actif quand les émotions sont en jeu"],
      commonMistakes: ["Fixer l'écran 8 heures sans alertes configurées — cela mène à la fatigue, au stress et aux trades impulsifs"],
    },
    {
      title: "Journal de Day Trading",
      content: [
        "Le journal de trading est l'outil d'amélioration #1 de tout trader sérieux. Notez CHAQUE trade sans exception : heure d'entrée/sortie, actif, direction (long/short), prix d'entrée, SL, TP, taille de position, raison de l'entrée, résultat en $, émotion ressentie, capture d'écran du graphique.",
        "Métriques hebdomadaires à calculer : nombre total de trades, win rate (%), R:R moyen, profit factor (gains totaux / pertes totales), max drawdown, meilleure et pire heure de trading, meilleur et pire setup. Ces métriques révèlent vos patterns de performance.",
        "Revue mensuelle approfondie : quel setup a le meilleur win rate ? Quelle heure de la journée est la plus profitable ? Quelles erreurs se répètent ? Quel est votre état émotionnel avant vos pires trades ? Ajustez votre stratégie en conséquence — les données ne mentent pas.",
        "Outils de journal : un simple Google Sheets fonctionne parfaitement. Pour plus d'automatisation, des outils comme Tradervue, Edgewonk ou TradesViz importent automatiquement vos trades et calculent les métriques. L'important n'est pas l'outil mais la discipline de documenter chaque trade.",
      ],
      keyPoints: [
        "Noter CHAQUE trade avec capture d'écran du graphique",
        "Métriques hebdomadaires : win rate, R:R, profit factor, drawdown",
        "Revue mensuelle pour identifier les patterns de performance",
        "Ajuster la stratégie basé sur les données, pas les émotions",
      ],
      proTips: ["Votre journal est votre meilleur professeur — relisez-le chaque semaine et vous progresserez plus vite que 95% des traders"],
      commonMistakes: ["Ne pas tenir de journal — vous répéterez les mêmes erreurs indéfiniment sans jamais les identifier"],
      exercise: "Créez votre template de journal de day trading dans Google Sheets. Tradez en paper trading pendant 2 semaines en documentant chaque trade. Analysez vos métriques à la fin.",
    },
  ],
  quiz: [
    { question: "Nombre maximum d'indicateurs recommandé sur un graphique :", options: ["2", "4-5", "10", "15"], correct: 1 },
    { question: "Les alertes de prix servent à :", options: ["Remplacer l'analyse technique", "Ne pas fixer l'écran en permanence", "Automatiser les trades", "Augmenter les profits garantis"], correct: 1 },
    { question: "Le journal de trading est :", options: ["Optionnel pour les débutants", "Non négociable pour progresser", "Uniquement pour les professionnels", "Inutile si on a un bon système"], correct: 1 },
    { question: "Un ordre bracket combine :", options: ["Deux ordres Market", "Entrée + SL + TP simultanés", "Deux Stop Loss", "Uniquement l'entrée"], correct: 1 },
  ],
};

export const module5Lessons: Lesson[] = [m5l1, m5l2, m5l3, m5l4];