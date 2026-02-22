import { Lesson } from "./types";

const m10l1: Lesson = {
  id: "m10-l1",
  title: "Les Émotions du Trader",
  icon: "🧠",
  duration: "45 min",
  description: "Peur, avidité, FOMO, espoir — comprendre et maîtriser vos émotions.",
  subLessons: [
    {
      title: "Les 4 Émotions Destructrices",
      content: [
        "La PEUR se manifeste de deux façons : la peur de perdre (vous n'osez pas entrer en position même quand le setup est parfait) et la peur de manquer un gain (vous sortez trop tôt d'un trade gagnant). La peur est l'émotion la plus paralysante — elle vous empêche d'exécuter votre plan.",
        "L'AVIDITÉ vous pousse à prendre des risques excessifs, à ne pas prendre de profits, à augmenter la taille de position après des gains, et à chercher le 'trade parfait' qui va tout changer. L'avidité est l'émotion la plus dangereuse car elle se déguise en confiance et en ambition.",
        "Le FOMO (Fear Of Missing Out) vous pousse à entrer dans un trade en retard, après que le mouvement a déjà eu lieu. Vous voyez BTC monter de 10% et vous achetez au sommet par peur de 'manquer le train'. Le FOMO est responsable de la majorité des achats au sommet.",
        "L'ESPOIR vous fait garder une position perdante en espérant un retournement miraculeux. Vous déplacez votre SL, vous ajoutez à une position perdante, vous rationalisez pourquoi le prix 'devrait' remonter. L'espoir en trading est un poison — il transforme les petites pertes en catastrophes.",
      ],
      keyPoints: [
        "Peur = paralysie ou sortie prématurée",
        "Avidité = risques excessifs déguisés en confiance",
        "FOMO = acheter au sommet après le mouvement",
        "Espoir = garder les perdants trop longtemps",
      ],
      proTips: ["Identifiez QUELLE émotion vous ressentez avant chaque décision de trading — la simple reconnaissance de l'émotion réduit son pouvoir de 50%"],
      commonMistakes: ["Penser que les émotions ne vous affectent pas — TOUS les traders sont affectés, la différence est dans la gestion"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/810c3303-6b75-44db-b54f-2cf48568eaef.png",
          alt: "Les émotions du trader",
          caption: "Les 4 émotions destructrices : Peur, Avidité, FOMO et Espoir — les reconnaître est la première étape pour les maîtriser"
        }
      ],
    },
    {
      title: "Le Cycle Émotionnel du Marché",
      content: [
        "Le cycle émotionnel du marché suit un pattern prévisible : Incrédulité → Espoir → Optimisme → Excitation → Euphorie (sommet) → Anxiété → Déni → Peur → Panique → Capitulation (creux) → Dépression → Incrédulité... et le cycle recommence.",
        "Les meilleurs moments pour acheter sont pendant la Peur, la Panique et la Capitulation — quand tout le monde vend et que les médias annoncent la fin du crypto. Les meilleurs moments pour vendre sont pendant l'Excitation et l'Euphorie — quand tout le monde achète et que les médias sont unanimement positifs.",
        "Le sentiment du marché peut être mesuré : Fear & Greed Index (0-100), ratio Long/Short, funding rate, volume des recherches Google, sentiment sur les réseaux sociaux. Quand le Fear & Greed Index est en 'Extreme Fear' (<20), c'est historiquement un excellent moment pour acheter.",
        "Être contrarian (aller contre le sentiment dominant) est extrêmement difficile psychologiquement mais historiquement très rentable. Acheter quand tout le monde a peur et vendre quand tout le monde est euphorique demande une discipline et une conviction exceptionnelles.",
      ],
      keyPoints: [
        "Cycle : Euphorie (sommet) → Capitulation (creux) → cycle recommence",
        "Acheter pendant la Peur/Capitulation, vendre pendant l'Euphorie",
        "Fear & Greed Index < 20 = historiquement bon moment d'achat",
        "Être contrarian = difficile mais historiquement très rentable",
      ],
      proTips: ["Quand vous ressentez l'euphorie et que tout semble parfait, c'est probablement le moment de prendre des profits — pas d'en acheter plus"],
      commonMistakes: ["Suivre le sentiment de la foule — acheter dans l'euphorie et vendre dans la panique est la recette pour perdre"],
    },
    {
      title: "Biais Cognitifs du Trader",
      content: [
        "Le biais de confirmation : vous cherchez uniquement les informations qui confirment votre position et ignorez celles qui la contredisent. Si vous êtes long BTC, vous ne lisez que les analyses haussières. Solution : cherchez activement les arguments CONTRE votre position avant de trader.",
        "L'aversion à la perte : la douleur d'une perte est psychologiquement 2x plus intense que le plaisir d'un gain équivalent. C'est pourquoi vous gardez les perdants trop longtemps (pour éviter la douleur de réaliser la perte) et coupez les gagnants trop tôt (pour sécuriser le plaisir du gain).",
        "Le biais de récence : vous donnez plus de poids aux événements récents. Après 3 trades gagnants, vous vous sentez invincible et augmentez le risque. Après 3 pertes, vous doutez de tout et réduisez trop. Solution : basez vos décisions sur les statistiques de 100+ trades, pas sur les 3 derniers.",
        "L'effet Dunning-Kruger : les débutants surestiment leurs compétences (confiance excessive après quelques gains) tandis que les traders expérimentés reconnaissent la complexité du marché. Le pic de confiance des débutants coïncide souvent avec leurs plus grosses pertes.",
      ],
      keyPoints: [
        "Biais de confirmation : chercher uniquement ce qui confirme notre position",
        "Aversion à la perte : douleur 2x plus intense que le plaisir du gain",
        "Biais de récence : trop de poids aux événements récents",
        "Dunning-Kruger : débutants surestiment, experts reconnaissent la complexité",
      ],
      proTips: ["Avant chaque trade, listez 3 raisons pour lesquelles le trade pourrait ÉCHOUER — cela combat le biais de confirmation"],
      commonMistakes: ["Penser être immunisé contre les biais cognitifs — personne ne l'est, la reconnaissance est la première étape"],
    },
  ],
  quiz: [
    { question: "Le FOMO pousse à :", options: ["Vendre trop tôt", "Acheter au sommet après le mouvement", "Ne pas trader", "Analyser plus"], correct: 1 },
    { question: "Le meilleur moment pour acheter :", options: ["Pendant l'euphorie", "Pendant la peur/capitulation", "Pendant l'optimisme", "Quand les médias sont positifs"], correct: 1 },
    { question: "L'aversion à la perte cause :", options: ["Couper les perdants trop tôt", "Garder les perdants trop longtemps", "Prendre trop de risque", "Trader plus souvent"], correct: 1 },
    { question: "Le biais de confirmation :", options: ["Chercher les infos qui contredisent", "Chercher les infos qui confirment notre position", "Ignorer toute information", "Analyser objectivement"], correct: 1 },
  ],
};

const m10l2: Lesson = {
  id: "m10-l2",
  title: "Discipline et Plan de Trading",
  icon: "📋",
  duration: "50 min",
  description: "Créer et respecter un plan de trading, développer la discipline de fer.",
  subLessons: [
    {
      title: "Créer un Plan de Trading",
      content: [
        "Un plan de trading est un document écrit qui définit TOUTES vos règles de trading AVANT de trader. Il élimine l'improvisation et les décisions émotionnelles. Sans plan, vous êtes un gambler. Avec un plan, vous êtes un trader professionnel.",
        "Éléments essentiels du plan : (1) Style de trading (swing, day, scalping). (2) Marchés tradés (BTC, ETH, altcoins spécifiques). (3) Timeframes utilisés (weekly, daily, 4h). (4) Setups tradés (pullback, breakout, mean reversion — avec critères précis). (5) Règles d'entrée (confluences requises, confirmation).",
        "(6) Règles de sortie (SL, TP partiels, trailing stop). (7) Gestion du risque (% par trade, max drawdown, max positions). (8) Horaires de trading. (9) Règles de discipline (max pertes/jour, pause après pertes). (10) Routine quotidienne et hebdomadaire.",
        "Le plan doit être SPÉCIFIQUE et MESURABLE. Pas 'je vais acheter quand ça semble bien' mais 'j'achète quand le prix touche l'EMA 21 daily + Fibonacci 38-61% + chandelier de retournement haussier sur le 4h + volume > moyenne'. Plus le plan est précis, moins il y a de place pour l'émotion.",
      ],
      keyPoints: [
        "Plan écrit AVANT de trader — élimine l'improvisation",
        "10 éléments essentiels : style, marchés, TF, setups, entrée, sortie...",
        "SPÉCIFIQUE et MESURABLE — pas de critères vagues",
        "Sans plan = gambler, avec plan = trader professionnel",
      ],
      proTips: ["Écrivez votre plan de trading et relisez-le chaque matin avant de commencer — c'est le rituel le plus important du trader"],
      commonMistakes: ["Trader sans plan écrit — c'est du gambling déguisé en trading"],
    },
    {
      title: "Développer la Discipline",
      content: [
        "La discipline est le facteur #1 de succès en trading — plus important que la stratégie, l'analyse ou le capital. Un trader discipliné avec une stratégie moyenne surperformera toujours un trader indiscipliné avec une stratégie excellente.",
        "Techniques pour développer la discipline : (1) Checklist pré-trade (vérifier chaque critère avant d'entrer). (2) Journal de trading quotidien (documenter chaque trade et chaque émotion). (3) Règles affichées à côté de l'écran. (4) Accountability partner (un ami trader qui vérifie votre discipline).",
        "La discipline se construit progressivement, comme un muscle. Commencez par respecter UNE règle parfaitement (ex: toujours mettre un SL) pendant 30 jours. Puis ajoutez une deuxième règle. Puis une troisième. En 3 mois, vous aurez construit une discipline solide.",
        "Quand vous violez une règle de votre plan, notez-le dans votre journal avec l'émotion qui a causé la violation. Après 30 jours, analysez les patterns : quelle émotion cause le plus de violations ? À quelle heure ? Après quel type de trade ? Ces données vous permettent de cibler vos faiblesses.",
      ],
      keyPoints: [
        "Discipline = facteur #1 de succès, plus que la stratégie",
        "Checklist pré-trade + journal + règles affichées",
        "Construire progressivement : 1 règle à la fois pendant 30 jours",
        "Analyser les violations pour identifier les patterns émotionnels",
      ],
      proTips: ["La discipline est un muscle — commencez petit (1 règle) et construisez progressivement sur 3 mois"],
      commonMistakes: ["Essayer d'être parfaitement discipliné dès le jour 1 — c'est irréaliste et mène à la frustration"],
    },
    {
      title: "Le Journal de Trading",
      content: [
        "Le journal de trading est l'outil d'amélioration #1 de tout trader sérieux. Pour chaque trade, notez : date/heure, actif, direction, prix d'entrée/SL/TP, taille de position, raison de l'entrée (quel setup), résultat en $ et en R, émotion ressentie, capture d'écran du graphique.",
        "Revue hebdomadaire (30 min) : nombre de trades, win rate, R:R moyen, profit factor, meilleur et pire trade, erreurs répétées, leçons apprises. Revue mensuelle (1h) : tendances de performance, setups les plus/moins rentables, heures les plus/moins rentables, progression de la discipline.",
        "Les questions les plus révélatrices à se poser : Quel setup a le meilleur win rate ? Quel setup a le meilleur R:R ? À quelle heure suis-je le plus profitable ? Quelle émotion précède mes pires trades ? Combien de fois ai-je violé mon plan ce mois-ci ?",
        "Le journal transforme l'expérience en apprentissage structuré. Sans journal, vous répétez les mêmes erreurs indéfiniment. Avec un journal, chaque erreur devient une leçon documentée qui améliore votre trading futur. Les meilleurs traders du monde tiennent tous un journal détaillé.",
      ],
      keyPoints: [
        "Documenter CHAQUE trade avec capture d'écran",
        "Revue hebdomadaire (30 min) + mensuelle (1h)",
        "Identifier les patterns de performance et d'émotion",
        "Sans journal = répéter les erreurs, avec journal = progresser",
      ],
      proTips: ["Relisez votre journal du mois précédent le 1er de chaque mois — les patterns de vos erreurs deviendront évidents"],
      commonMistakes: ["Ne pas tenir de journal — c'est comme aller à l'école sans jamais prendre de notes"],
      exercise: "Créez votre plan de trading complet (10 éléments) et votre template de journal. Suivez-les pendant 30 jours. Analysez vos résultats à la fin du mois.",
    },
  ],
  quiz: [
    { question: "Le facteur #1 de succès en trading :", options: ["La stratégie", "Le capital", "La discipline", "La chance"], correct: 2 },
    { question: "Un plan de trading doit être :", options: ["Vague et flexible", "Spécifique et mesurable", "Changé chaque jour", "Gardé en tête uniquement"], correct: 1 },
    { question: "Le journal de trading sert à :", options: ["Impressionner les autres", "Transformer l'expérience en apprentissage", "Perdre du temps", "Calculer les impôts uniquement"], correct: 1 },
    { question: "La discipline se construit :", options: ["En un jour", "Progressivement sur 3 mois", "Jamais", "Uniquement avec un coach"], correct: 1 },
  ],
};

const m10l3: Lesson = {
  id: "m10-l3",
  title: "Mindset du Trader Profitable",
  icon: "💪",
  duration: "45 min",
  description: "Développer le mindset gagnant : patience, acceptation et pensée probabiliste.",
  subLessons: [
    {
      title: "Pensée Probabiliste",
      content: [
        "Le trading est un jeu de probabilités, pas de certitudes. Aucun trade n'est garanti — même le meilleur setup a une probabilité d'échec. Votre objectif n'est pas d'avoir raison sur chaque trade, mais d'avoir un avantage statistique (edge) qui se manifeste sur un grand nombre de trades.",
        "Analogie du casino : le casino ne gagne pas chaque main de blackjack, mais il a un avantage statistique de 1-2% qui, sur des milliers de mains, génère des profits garantis. Vous êtes le casino — votre edge est votre stratégie testée avec une espérance mathématique positive.",
        "Détachez-vous du résultat de chaque trade individuel. Un trade perdant avec un bon processus est un BON trade. Un trade gagnant avec un mauvais processus (pas de SL, taille trop grande, FOMO) est un MAUVAIS trade. Jugez votre performance sur le processus, pas sur le résultat.",
        "La loi des grands nombres : votre edge ne se manifeste que sur 50-100+ trades. Les résultats de 5-10 trades sont dominés par la variance (chance/malchance). Ne changez pas de stratégie après 5 pertes consécutives si votre backtest montre que la stratégie est profitable sur 100+ trades.",
      ],
      keyPoints: [
        "Trading = probabilités, pas certitudes",
        "Vous êtes le casino — votre edge se manifeste sur 100+ trades",
        "Bon processus + perte = bon trade, mauvais processus + gain = mauvais trade",
        "Ne pas changer de stratégie après 5-10 trades — variance normale",
      ],
      proTips: ["Jugez votre performance sur le PROCESSUS (avez-vous suivi votre plan ?) pas sur le RÉSULTAT (avez-vous gagné ?)"],
      commonMistakes: ["Changer de stratégie après chaque série de pertes — vous ne donnez jamais à votre edge le temps de se manifester"],
    },
    {
      title: "Patience et Acceptation",
      content: [
        "La patience est la qualité la plus rentable en trading. Les meilleurs traders passent 80% de leur temps à ATTENDRE le bon setup et 20% à trader. La majorité des pertes viennent de trades pris par impatience ou ennui — des trades qui ne correspondent pas aux critères du plan.",
        "L'acceptation des pertes est fondamentale. Les pertes font partie intégrante du trading — elles sont le coût de faire des affaires. Un chirurgien ne peut pas sauver tous ses patients, un avocat ne peut pas gagner tous ses procès, et un trader ne peut pas gagner tous ses trades.",
        "Acceptez que vous ne pouvez pas contrôler le marché — vous ne pouvez contrôler que votre processus. Vous contrôlez votre analyse, votre entrée, votre SL, votre taille de position et votre discipline. Le résultat du trade est hors de votre contrôle. Concentrez-vous sur ce que vous pouvez contrôler.",
        "Le détachement émotionnel ne signifie pas l'absence d'émotion — c'est la capacité à ressentir l'émotion sans qu'elle influence vos décisions. Vous pouvez ressentir la peur et quand même exécuter votre plan. Vous pouvez ressentir l'avidité et quand même prendre vos profits.",
      ],
      keyPoints: [
        "80% attente, 20% trading — la patience est la plus rentable",
        "Les pertes = coût normal de faire des affaires",
        "Contrôler le processus, pas le résultat",
        "Détachement = ressentir l'émotion sans qu'elle influence les décisions",
      ],
      proTips: ["Quand vous ressentez l'envie urgente de trader, c'est probablement le pire moment pour le faire — attendez que l'envie passe"],
      commonMistakes: ["Trader par ennui ou impatience — les trades forcés sont les plus coûteux"],
    },
    {
      title: "Routine et Hygiène de Vie",
      content: [
        "Le trading est un sport mental de haut niveau. Votre performance cognitive dépend directement de votre hygiène de vie. Sommeil : 7-8h minimum — le manque de sommeil dégrade la prise de décision de 30-40%. Exercice : 30 min/jour minimum — améliore la concentration et réduit le stress.",
        "Alimentation : évitez les pics de glycémie (sucre, fast food) qui causent des crashes d'énergie. Hydratation : 2L d'eau/jour minimum. Caféine : modérée (1-2 cafés max), pas après 14h pour ne pas affecter le sommeil. Alcool : jamais avant ou pendant le trading.",
        "Méditation et mindfulness : 10-15 minutes de méditation le matin améliorent significativement la clarté mentale, la gestion du stress et la prise de décision. Des études montrent que les traders qui méditent régulièrement ont un meilleur contrôle émotionnel et des résultats supérieurs.",
        "Équilibre vie/trading : le trading ne doit pas être votre seule source de satisfaction et d'identité. Maintenez des relations sociales, des hobbies, et des activités physiques. Les traders les plus durables et les plus performants ont une vie équilibrée en dehors des marchés.",
      ],
      keyPoints: [
        "Sommeil 7-8h = non négociable pour la performance cognitive",
        "Exercice 30 min/jour = concentration et réduction du stress",
        "Méditation 10-15 min = meilleur contrôle émotionnel",
        "Équilibre vie/trading = performance durable à long terme",
      ],
      proTips: ["La méditation de 10 minutes le matin est l'investissement le plus rentable pour votre trading — essayez pendant 30 jours"],
      commonMistakes: ["Sacrifier le sommeil et l'exercice pour trader plus — les décisions fatiguées coûtent bien plus que les opportunités manquées"],
      exercise: "Pendant 30 jours : dormez 7-8h, faites 30 min d'exercice, méditez 10 min le matin, et tenez votre journal. Comparez vos résultats de trading avec le mois précédent.",
    },
  ],
  quiz: [
    { question: "Un trade perdant avec un bon processus est :", options: ["Un mauvais trade", "Un bon trade", "De la malchance pure", "Une erreur"], correct: 1 },
    { question: "Le manque de sommeil dégrade les décisions de :", options: ["5%", "10-15%", "30-40%", "0%"], correct: 2 },
    { question: "La patience représente combien du temps de trading :", options: ["20%", "50%", "80%", "0%"], correct: 2 },
    { question: "La méditation pour un trader :", options: ["Est une perte de temps", "Améliore le contrôle émotionnel", "N'a aucun impact", "Est dangereuse"], correct: 1 },
  ],
};

const m10l4: Lesson = {
  id: "m10-l4",
  title: "Erreurs Fatales et Comment les Éviter",
  icon: "☠️",
  duration: "40 min",
  description: "Les 10 erreurs les plus destructrices en trading et comment les éviter.",
  subLessons: [
    {
      title: "Les 5 Erreurs Techniques Fatales",
      content: [
        "Erreur #1 — Pas de Stop Loss : c'est la cause #1 de pertes catastrophiques. Un seul trade sans SL peut détruire des mois de profits. CHAQUE trade doit avoir un SL placé AVANT l'entrée. Pas d'exception, pas de négociation, pas de 'juste cette fois'.",
        "Erreur #2 — Levier excessif : utiliser un levier de 20x+ est un suicide financier à long terme. Même les meilleurs traders du monde ne survivent pas avec un levier excessif. Maximum 3-5x, et uniquement après avoir prouvé votre rentabilité en spot.",
        "Erreur #3 — Overtrading : trader trop souvent, trop de positions, trop de taille. L'overtrading est souvent causé par l'ennui, le FOMO ou le revenge trading. Solution : limitez-vous à 2-3 trades par jour (day trading) ou 5-10 par mois (swing trading).",
        "Erreur #4 — Pas de plan de trading : trader sans plan écrit est du gambling. Erreur #5 — Ignorer le risk management : risquer 5-10% par trade, pas de diversification, pas de limite de perte journalière. Ces erreurs techniques sont 100% évitables avec de la discipline.",
      ],
      keyPoints: [
        "#1 Pas de SL = cause #1 de pertes catastrophiques",
        "#2 Levier excessif (>10x) = suicide financier",
        "#3 Overtrading = trop de trades, trop de taille",
        "#4-5 Pas de plan + pas de risk management = gambling",
      ],
      proTips: ["Si vous ne faites qu'UNE chose : mettez un SL sur CHAQUE trade — cette seule habitude vous sauvera des pertes catastrophiques"],
      commonMistakes: ["Penser que 'ça n'arrive qu'aux autres' — ces erreurs touchent 90% des traders à un moment ou un autre"],
    },
    {
      title: "Les 5 Erreurs Psychologiques Fatales",
      content: [
        "Erreur #6 — Revenge trading : trader immédiatement après une perte pour 'récupérer'. Le jugement est altéré par la frustration, les positions sont trop grosses, les setups sont de mauvaise qualité. Solution : pause obligatoire de 30 min à 24h après une perte significative.",
        "Erreur #7 — FOMO : acheter après un mouvement de 10-20% par peur de manquer le train. Vous achetez au sommet, le prix corrige, et vous vendez en perte. Solution : si vous avez manqué le mouvement, attendez le pullback. Il y aura TOUJOURS une prochaine opportunité.",
        "Erreur #8 — Changer de stratégie constamment : après 3 pertes, vous changez de stratégie. La nouvelle stratégie perd aussi, vous changez encore. Vous ne donnez jamais à une stratégie le temps de prouver sa valeur. Solution : testez sur 100+ trades avant de juger.",
        "Erreur #9 — Écouter les 'gourous' et les signaux : suivre aveuglément les conseils de traders sur Twitter, Telegram ou YouTube. Personne ne se soucie de votre argent autant que vous. Développez VOTRE propre système. Erreur #10 — Ne pas tenir de journal : impossible de progresser sans données objectives.",
      ],
      keyPoints: [
        "#6 Revenge trading = spirale destructrice",
        "#7 FOMO = acheter au sommet systématiquement",
        "#8 Changer de stratégie trop souvent = jamais profitable",
        "#9-10 Suivre les gourous + pas de journal = stagnation",
      ],
      proTips: ["Imprimez ces 10 erreurs et relisez-les chaque lundi matin — la conscience des pièges est la meilleure protection"],
      commonMistakes: ["Penser avoir dépassé ces erreurs après quelques mois — elles reviennent sous pression, restez vigilant"],
    },
    {
      title: "Construire des Habitudes Gagnantes",
      content: [
        "Habitude #1 — Routine matinale : 30 min d'analyse avant de trader. Habitude #2 — Checklist pré-trade : vérifier chaque critère avant d'entrer. Habitude #3 — SL systématique : placé AVANT l'entrée, jamais déplacé dans le mauvais sens.",
        "Habitude #4 — Journal quotidien : documenter chaque trade et chaque émotion. Habitude #5 — Revue hebdomadaire : analyser les métriques et identifier les patterns. Habitude #6 — Pause après les pertes : 30 min minimum après 3 pertes consécutives.",
        "Habitude #7 — Éducation continue : lire, apprendre, backtester chaque semaine. Le marché évolue et votre compréhension doit évoluer avec lui. Habitude #8 — Équilibre de vie : exercice, sommeil, relations sociales — un trader équilibré est un trader performant.",
        "La transformation prend du temps : comptez 6-12 mois pour développer ces habitudes solidement. Les premiers mois seront difficiles car vous combattez vos instincts naturels. Mais chaque jour de discipline renforce le muscle et rend le suivant plus facile. La persévérance est la clé ultime.",
      ],
      keyPoints: [
        "8 habitudes gagnantes : routine, checklist, SL, journal, revue, pause, éducation, équilibre",
        "Transformation en 6-12 mois de pratique disciplinée",
        "Chaque jour de discipline renforce le muscle",
        "La persévérance est la clé ultime du succès",
      ],
      proTips: ["Commencez par 1-2 habitudes et ajoutez-en une nouvelle chaque mois — en 8 mois, vous aurez transformé votre trading"],
      commonMistakes: ["Essayer d'adopter les 8 habitudes simultanément — c'est irréaliste et mène à l'abandon"],
      exercise: "Choisissez les 3 habitudes les plus importantes pour VOUS personnellement. Pratiquez-les pendant 30 jours sans exception. Notez votre progression chaque semaine.",
    },
  ],
  quiz: [
    { question: "L'erreur #1 en trading est :", options: ["Mauvaise analyse", "Pas de Stop Loss", "Mauvais timing", "Mauvais actif"], correct: 1 },
    { question: "Le revenge trading se produit :", options: ["Avant de trader", "Après une série de gains", "Après une perte, pour récupérer", "Le weekend"], correct: 2 },
    { question: "Combien de temps pour développer les habitudes :", options: ["1 semaine", "1 mois", "6-12 mois", "Jamais"], correct: 2 },
    { question: "La meilleure protection contre les erreurs :", options: ["La chance", "La conscience des pièges + discipline", "Un bon broker", "Plus de capital"], correct: 1 },
  ],
};

export const module10Lessons: Lesson[] = [m10l1, m10l2, m10l3, m10l4];