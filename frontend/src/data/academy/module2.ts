import { Lesson } from "./types";

const m2l1: Lesson = {
  id: "m2-l1",
  title: "Supports, Résistances et Lignes de Tendance",
  icon: "📏",
  duration: "45 min",
  description: "Niveaux clés, lignes de tendance, canaux et zones de supply/demand.",
  subLessons: [
    {
      title: "Supports et Résistances",
      content: [
        "Le support est un niveau de prix où la demande est suffisamment forte pour empêcher le prix de baisser davantage — c'est un plancher. La résistance est un niveau où l'offre est suffisamment forte pour empêcher le prix de monter — c'est un plafond. Ces niveaux sont créés par la mémoire collective du marché.",
        "Plus un niveau est testé sans être cassé, plus il est significatif. Un support testé 5 fois est bien plus fort qu'un support testé 2 fois. Les niveaux psychologiques (chiffres ronds comme 50 000$, 100 000$) sont des S/R naturels car les traders placent leurs ordres à ces niveaux.",
        "Quand un support est cassé de manière décisive (avec volume), il devient résistance — c'est le 'flip'. Le prix revient souvent tester le niveau cassé (retest) avant de continuer dans la direction de la cassure. Ce retest est souvent le meilleur point d'entrée.",
        "Les meilleurs S/R combinent plusieurs facteurs : testés 3+ fois, accompagnés de volume élevé, visibles sur les timeframes élevés (weekly, daily), et en confluence avec d'autres outils (Fibonacci, EMA). Les S/R sont des ZONES, pas des lignes exactes — laissez une marge de quelques pourcentages.",
      ],
      keyPoints: [
        "Support = plancher (demande forte), Résistance = plafond (offre forte)",
        "Flip : support cassé → résistance, et vice versa",
        "Confluence (S/R + Fib + EMA) = niveaux les plus forts",
        "S/R sont des ZONES, pas des lignes exactes",
      ],
      proTips: ["Marquez vos S/R sur le weekly et daily en premier — ces niveaux sont les plus respectés par le marché"],
      commonMistakes: ["Tracer trop de lignes sur le graphique — gardez 3-5 niveaux clés maximum pour rester clair"],
    },
    {
      title: "Lignes de Tendance et Canaux",
      content: [
        "Une ligne de tendance haussière relie 2 ou plusieurs creux ascendants (higher lows). Une ligne de tendance baissière relie 2 ou plusieurs sommets descendants (lower highs). Il faut un minimum de 3 touches pour valider une ligne de tendance — 2 touches créent la ligne, la 3ème la confirme.",
        "La pente de la ligne indique la force de la tendance. Une pente trop raide (>45°) est insoutenable et mène généralement à une correction. Une pente modérée (20-45°) est plus durable. La cassure d'une ligne de tendance accompagnée de volume élevé et suivie d'un retest est un signal fiable de changement de tendance.",
        "Les canaux de prix sont formés par deux lignes de tendance parallèles. Le prix oscille entre le support (ligne basse) et la résistance (ligne haute) du canal. Stratégie : achetez au contact de la ligne basse, vendez au contact de la ligne haute. La cassure d'un canal génère souvent un mouvement explosif.",
        "Tracez vos lignes de tendance sur les corps des chandeliers plutôt que sur les mèches pour plus de cohérence. Si vous devez forcer la ligne en ignorant des points, elle n'est probablement pas valide. Les meilleures lignes de tendance sont évidentes et respectées par le prix de manière claire.",
      ],
      keyPoints: [
        "3 touches minimum pour valider une ligne de tendance",
        "Pente modérée (20-45°) = plus durable que raide (>45°)",
        "Cassure + volume + retest = signal fiable",
        "Canaux : acheter en bas, vendre en haut",
      ],
      proTips: ["Tracez sur les corps des chandeliers, pas les mèches — c'est plus cohérent et fiable"],
      commonMistakes: ["Forcer une ligne de tendance en ignorant des points qui ne correspondent pas — si ça ne saute pas aux yeux, ce n'est pas valide"],
    },
    {
      title: "Zones de Supply et Demand",
      content: [
        "Les zones de demand (demande) se forment quand le prix fait un mouvement latéral (base) suivi d'un mouvement impulsif haussier fort. Cette base représente une zone où les acheteurs institutionnels ont accumulé des positions. Quand le prix revient dans cette zone, ces mêmes acheteurs défendent leurs positions.",
        "Les zones de supply (offre) se forment quand le prix fait une base suivie d'un mouvement impulsif baissier. C'est une zone où les vendeurs institutionnels ont distribué leurs positions. Quand le prix remonte dans cette zone, la pression vendeuse reprend.",
        "Les zones 'fraîches' (jamais retestées depuis leur formation) sont les plus puissantes. Chaque retest affaiblit la zone car les ordres en attente sont progressivement absorbés. Une zone retestée 3+ fois est significativement affaiblie et risque de céder.",
        "Combinez les zones S/D avec les S/R classiques et les niveaux de Fibonacci pour créer des confluences. Zone de demand + support weekly + Fibonacci 61.8% = setup de très haute probabilité. Plus il y a de confluences à un même niveau, plus la réaction du prix sera forte.",
      ],
      keyPoints: [
        "Demand = base + impulsion haussière (acheteurs institutionnels)",
        "Supply = base + impulsion baissière (vendeurs institutionnels)",
        "Zones fraîches (jamais retestées) = les plus puissantes",
        "Confluence S/D + S/R + Fibonacci = haute probabilité",
      ],
      proTips: ["Marquez les zones S/D sur le daily et le 4h — ce sont les timeframes les plus pertinents pour le swing trading"],
      commonMistakes: ["Confondre une simple consolidation avec une vraie zone S/D — la zone doit être suivie d'un mouvement impulsif fort pour être valide"],
    },
  ],
  quiz: [
    { question: "Un support cassé devient :", options: ["Un support plus fort", "Une résistance", "Invisible", "Un gap"], correct: 1 },
    { question: "Touches minimum pour valider une ligne de tendance :", options: ["1", "2", "3", "5"], correct: 2 },
    { question: "Une zone de demand fraîche est :", options: ["Testée plusieurs fois", "Jamais retestée depuis sa formation", "Très ancienne", "Visible uniquement sur le 1 minute"], correct: 1 },
    { question: "La meilleure confluence combine :", options: ["Uniquement le prix", "S/R + Fibonacci + EMA", "Le volume seul", "Les news"], correct: 1 },
  ],
};

const m2l2: Lesson = {
  id: "m2-l2",
  title: "Les Chandeliers Japonais en Profondeur",
  icon: "🕯️",
  duration: "60 min",
  description: "Tous les patterns de chandeliers : retournement, continuation et indécision.",
  subLessons: [
    {
      title: "Patterns de Retournement Haussier",
      content: [
        "Le Hammer (Marteau) : petit corps en haut du chandelier, longue mèche inférieure d'au moins 2x la taille du corps, peu ou pas de mèche supérieure. Quand il apparaît en bas d'une tendance baissière, c'est un signal haussier puissant. Confirmation nécessaire : le chandelier suivant doit être vert et clôturer au-dessus du corps du hammer, avec un volume supérieur à la moyenne.",
        "Le Bullish Engulfing (Avalement haussier) : un grand chandelier vert avale complètement le corps du chandelier rouge précédent. Plus le chandelier vert est grand par rapport au rouge, plus le signal est fort. Le volume doit être supérieur à la moyenne. C'est l'un des patterns de retournement les plus fiables, surtout aux niveaux de support.",
        "Le Morning Star (Étoile du matin) : pattern en 3 chandeliers. (1) Grand chandelier rouge confirmant la tendance baissière. (2) Petit corps ou doji montrant l'indécision. (3) Grand chandelier vert qui clôture au-dessus du milieu du 1er chandelier. C'est un retournement très fiable sur le daily et le weekly.",
        "Le Piercing Pattern : (1) Grand chandelier rouge. (2) Chandelier vert qui ouvre sous le low du rouge et clôture au-dessus du milieu du corps rouge. Moins fort que le Bullish Engulfing mais significatif. Les Three White Soldiers : 3 grands chandeliers verts consécutifs avec des clôtures progressivement plus hautes — signal de retournement haussier très fort.",
      ],
      keyPoints: [
        "Hammer : mèche basse ≥ 2x le corps, en bas de tendance",
        "Bullish Engulfing : le vert avale complètement le rouge",
        "Morning Star : 3 chandeliers, retournement très fiable",
        "Toujours confirmer avec volume et niveau de prix",
      ],
      proTips: ["Les patterns de retournement haussier aux niveaux de support weekly sont les plus fiables — c'est là que vous devez concentrer votre attention"],
      commonMistakes: ["Entrer immédiatement sur un hammer sans attendre la confirmation du chandelier suivant — la patience paie"],
    },
    {
      title: "Patterns de Retournement Baissier",
      content: [
        "Le Shooting Star (Étoile filante) : petit corps en bas du chandelier, longue mèche supérieure d'au moins 2x le corps, peu ou pas de mèche inférieure. C'est le miroir du Hammer. En haut d'une tendance haussière, c'est un signal baissier — les acheteurs ont poussé le prix haut mais les vendeurs ont repris le contrôle.",
        "Le Bearish Engulfing (Avalement baissier) : un grand chandelier rouge avale complètement le corps du chandelier vert précédent. Signal puissant aux niveaux de résistance. L'Evening Star (Étoile du soir) est le miroir du Morning Star : (1) Grand vert, (2) Petit corps/doji, (3) Grand rouge qui descend sous le milieu du 1er.",
        "Le Dark Cloud Cover : (1) Grand chandelier vert. (2) Chandelier rouge qui ouvre au-dessus du high du vert et clôture sous le milieu du corps vert. Les Three Black Crows : 3 grands chandeliers rouges consécutifs avec des clôtures progressivement plus basses — signal de retournement baissier très fort.",
        "Le Hanging Man a exactement la même forme que le Hammer (petit corps, longue mèche basse) mais apparaît en HAUT de tendance = signal baissier. Le contexte détermine l'interprétation : même forme, signification opposée selon la position dans la tendance.",
      ],
      keyPoints: [
        "Shooting Star : mèche haute ≥ 2x le corps, en haut de tendance",
        "Bearish Engulfing : le rouge avale complètement le vert",
        "Evening Star : retournement baissier fiable en 3 chandeliers",
        "Hanging Man = même forme que Hammer mais en haut de tendance",
      ],
      proTips: ["Combinez les patterns baissiers avec un RSI en surachat (>70) pour une confluence maximale"],
      commonMistakes: ["Shorter sur un seul shooting star sans confluence — attendez la confirmation et vérifiez le niveau de résistance"],
    },
    {
      title: "Patterns de Continuation et d'Indécision",
      content: [
        "Le Doji signale l'indécision : ouverture ≈ clôture. Le Doji Libellule (longue mèche basse, pas de mèche haute) est haussier. Le Doji Pierre Tombale (longue mèche haute, pas de mèche basse) est baissier. Le Doji Longues Jambes (longues mèches des deux côtés) montre une forte indécision. Un Doji est surtout significatif après un mouvement prolongé.",
        "Le Spinning Top (Toupie) : petit corps avec des mèches des deux côtés. Similaire au Doji mais avec un petit corps visible. Signal d'indécision — ni les acheteurs ni les vendeurs ne dominent. Après une série de chandeliers dans une direction, c'est un avertissement de potentiel retournement.",
        "Les Rising Three Methods (Trois méthodes montantes) : pattern de continuation haussière en 5 chandeliers. (1) Grand vert, (2-4) 3 petits rouges qui restent dans le range du 1er, (5) Grand vert qui clôture au-dessus du 1er. Les Falling Three Methods sont le miroir baissier.",
        "Le Marubozu : chandelier sans aucune mèche = contrôle total d'un camp. Marubozu vert = les acheteurs dominent complètement la période. Marubozu rouge = les vendeurs dominent. C'est un chandelier très décisif, surtout en début de mouvement ou après une consolidation.",
      ],
      keyPoints: [
        "Doji = indécision, significatif après un mouvement prolongé",
        "Rising/Falling Three Methods = continuation de tendance",
        "Marubozu (sans mèche) = contrôle total, mouvement décisif",
        "Le contexte détermine TOUJOURS l'interprétation",
      ],
      proTips: ["Un doji après 5+ chandeliers dans la même direction est un signal d'alerte — préparez-vous à un potentiel retournement"],
      commonMistakes: ["Trader chaque doji comme un retournement — il faut du contexte (tendance prolongée + niveau clé + volume)"],
      exercise: "Identifiez 10 patterns de chandeliers sur le graphique daily de BTC des 3 derniers mois. Notez le contexte (tendance, niveau, volume) et le résultat. Quel pattern a été le plus fiable ?",
    },
  ],
  quiz: [
    { question: "Un Shooting Star apparaît :", options: ["En bas de tendance", "En haut de tendance", "En consolidation", "N'importe quand"], correct: 1 },
    { question: "Le Morning Star est composé de combien de chandeliers ?", options: ["1", "2", "3", "4"], correct: 2 },
    { question: "Un Marubozu vert signifie :", options: ["Indécision totale", "Les vendeurs dominent", "Les acheteurs dominent complètement", "Faible volume"], correct: 2 },
    { question: "Un Hanging Man a la même forme que :", options: ["Un Shooting Star", "Un Hammer", "Un Doji", "Un Engulfing"], correct: 1 },
  ],
};

const m2l3: Lesson = {
  id: "m2-l3",
  title: "Fibonacci : Retracement, Extensions et Plus",
  icon: "🔢",
  duration: "55 min",
  description: "Maîtriser les retracements, extensions, fan et time zones de Fibonacci.",
  subLessons: [
    {
      title: "Fibonacci Retracement",
      content: [
        "Les retracements de Fibonacci sont basés sur la séquence mathématique de Fibonacci (1, 1, 2, 3, 5, 8, 13, 21...) où chaque nombre est la somme des deux précédents. Les ratios dérivés (23.6%, 38.2%, 50%, 61.8%, 78.6%) correspondent à des niveaux où le prix a tendance à rebondir lors d'un pullback.",
        "Pour tracer un retracement, identifiez un swing significatif : du swing low au swing high en tendance haussière, du swing high au swing low en tendance baissière. Les niveaux clés sont : 23.6% (pullback superficiel), 38.2% (tendance forte), 50% (niveau psychologique), 61.8% (golden ratio), 78.6% (pullback profond).",
        "Le 61.8% est le 'golden ratio' — le niveau le plus important de Fibonacci. La 'golden pocket' (zone entre 61.8% et 65%) est statistiquement la zone de rebond la plus probable en tendance saine. Si le prix retrace au-delà de 78.6%, la tendance originale est sérieusement remise en question.",
        "Les niveaux de Fibonacci sont des outils de CONFLUENCE — ils sont les plus puissants quand ils coïncident avec d'autres niveaux techniques (S/R horizontaux, EMA, lignes de tendance). Un niveau Fibonacci seul n'est pas suffisant pour prendre un trade.",
      ],
      keyPoints: [
        "Golden ratio = 61.8%, le niveau le plus important",
        "38.2% = tendance forte, 61.8% = tendance correcte",
        "Au-delà de 78.6%, la tendance est remise en question",
        "Fibonacci = outil de CONFLUENCE, pas un signal isolé",
      ],
      proTips: ["Utilisez Fibonacci sur les timeframes élevés (weekly, daily) pour les niveaux les plus fiables — les petits TF génèrent trop de niveaux"],
      commonMistakes: ["Utiliser Fibonacci comme seul outil de décision — c'est un outil de confluence qui doit être combiné avec d'autres analyses"],
      example: "BTC monte de 80 000$ à 100 000$. Retracement 38.2% = 92 360$, 50% = 90 000$, 61.8% = 87 640$. Si le prix rebondit à 87 640$ (golden pocket), l'objectif est le retour vers 100 000$ puis l'extension 161.8% = 112 360$.",
    },
    {
      title: "Extensions de Fibonacci",
      content: [
        "Les extensions de Fibonacci projettent des objectifs de prix au-delà du mouvement initial. Les niveaux clés sont : 127.2%, 161.8%, 200%, 261.8%, 423.6%. Elles sont tracées en utilisant 3 points : le début du mouvement, la fin du mouvement, et la fin du retracement.",
        "L'extension 161.8% est l'objectif le plus couramment atteint en tendance saine. L'extension 261.8% est atteinte dans les tendances très fortes. Au-delà de 261.8%, le mouvement est exceptionnel et souvent alimenté par l'euphorie.",
        "Stratégie de prise de profits avec les extensions : prenez 33% à l'extension 127.2%, 33% à 161.8%, et laissez 34% courir avec un trailing stop vers 200-261.8%. Cette approche sécurise des profits tout en capturant les mouvements prolongés.",
        "Les extensions confluentes avec des résistances horizontales, des chiffres ronds psychologiques ou des niveaux de Fibonacci d'un timeframe supérieur sont les objectifs les plus fiables. Quand une extension 161.8% coïncide avec une résistance weekly, c'est un niveau de prise de profits prioritaire.",
      ],
      keyPoints: [
        "161.8% = objectif le plus courant en tendance saine",
        "261.8% = tendances très fortes, au-delà = exceptionnel",
        "Profits partiels à chaque niveau d'extension",
        "Confluence extension + S/R = objectif le plus fiable",
      ],
      proTips: ["Placez vos Take Profit aux niveaux d'extension Fibonacci plutôt qu'à des niveaux arbitraires — le marché respecte ces niveaux de manière remarquable"],
      commonMistakes: ["Attendre l'extension 261.8% sans prendre de profits partiels — sécurisez des gains à chaque niveau"],
    },
    {
      title: "Fibonacci Fan et Time Zones",
      content: [
        "Le Fibonacci Fan trace des lignes diagonales aux ratios de Fibonacci depuis un point bas ou haut significatif. Ces lignes servent de supports et résistances dynamiques qui évoluent avec le temps. Utile pour identifier la pente de la tendance et les zones de retournement potentielles.",
        "Les Fibonacci Time Zones placent des lignes verticales aux intervalles de la séquence de Fibonacci (1, 2, 3, 5, 8, 13, 21, 34 périodes) depuis un point de retournement. Elles tentent de prédire QUAND un retournement pourrait se produire, pas à quel prix.",
        "En pratique, les retracements et extensions sont les outils Fibonacci les plus utilisés et les plus fiables. Le Fan et les Time Zones sont des compléments avancés qui ajoutent une dimension supplémentaire à l'analyse mais ne doivent pas être utilisés seuls.",
        "Conseil important : ne surchargez pas vos graphiques avec tous les outils Fibonacci simultanément. Maîtrisez d'abord parfaitement les retracements et extensions avant d'explorer les outils avancés. La simplicité est souvent plus efficace que la complexité.",
      ],
      keyPoints: [
        "Fibonacci Fan = S/R dynamiques diagonales",
        "Time Zones = prédiction temporelle des retournements",
        "Retracements et extensions = outils principaux à maîtriser d'abord",
        "Simplicité > complexité — ne surchargez pas vos graphiques",
      ],
      proTips: ["Maîtrisez parfaitement les retracements et extensions avant de toucher aux outils avancés — 90% de la valeur de Fibonacci est dans ces deux outils"],
      commonMistakes: ["Surcharger le graphique avec tous les outils Fibonacci simultanément — cela crée de la confusion plutôt que de la clarté"],
    },
  ],
  quiz: [
    { question: "Le golden ratio de Fibonacci est :", options: ["23.6%", "50%", "61.8%", "78.6%"], correct: 2 },
    { question: "L'extension 161.8% sert à :", options: ["Identifier un support", "Définir un objectif de prix", "Mesurer le volume", "Tracer une ligne de tendance"], correct: 1 },
    { question: "Au-delà de quel retracement la tendance est remise en question ?", options: ["38.2%", "50%", "61.8%", "78.6%"], correct: 3 },
    { question: "Fibonacci est un outil de :", options: ["Signal isolé", "Confluence avec d'autres analyses", "Prédiction exacte", "Mesure du volume"], correct: 1 },
  ],
};

const m2l4: Lesson = {
  id: "m2-l4",
  title: "Figures Chartistes Complètes",
  icon: "📐",
  duration: "60 min",
  description: "Triangles, drapeaux, tête-épaules, double top/bottom et wedges.",
  subLessons: [
    {
      title: "Les Triangles",
      content: [
        "Le triangle symétrique est formé par des sommets descendants et des creux ascendants qui convergent. Il représente une compression de la volatilité — le marché accumule de l'énergie. La cassure se produit généralement dans la direction de la tendance précédente (60-70% du temps).",
        "Le triangle ascendant a une résistance horizontale et des creux ascendants. C'est un pattern haussier : les acheteurs sont de plus en plus agressifs (creux montants) tandis que les vendeurs défendent un niveau fixe. La cassure par le haut est la plus probable (70%+).",
        "Le triangle descendant a un support horizontal et des sommets descendants. C'est un pattern baissier : les vendeurs sont de plus en plus agressifs tandis que les acheteurs défendent un niveau fixe. La cassure par le bas est la plus probable.",
        "Règles de trading des triangles : (1) Attendez la cassure avec un volume 2x+ la moyenne. (2) L'objectif de prix = la hauteur du triangle projetée depuis le point de cassure. (3) Le retest du triangle cassé est le meilleur point d'entrée. (4) La cassure doit se produire dans les 2/3 du triangle — après, le pattern perd sa force.",
      ],
      keyPoints: [
        "Triangle symétrique = compression, cassure dans la direction de la tendance",
        "Triangle ascendant = haussier (creux montants + résistance fixe)",
        "Triangle descendant = baissier (sommets descendants + support fixe)",
        "Objectif = hauteur du triangle projetée depuis la cassure",
      ],
      proTips: ["La cassure dans les 2/3 du triangle est la plus fiable — après ce point, le pattern s'affaiblit considérablement"],
      commonMistakes: ["Entrer avant la cassure en anticipant la direction — attendez toujours la confirmation avec volume"],
    },
    {
      title: "Tête-Épaules et Tête-Épaules Inversé",
      content: [
        "Le Head & Shoulders (Tête-Épaules) est considéré comme le pattern de retournement le plus fiable en analyse technique. Formation : (1) Épaule gauche (sommet). (2) Tête (sommet plus haut). (3) Épaule droite (sommet plus bas que la tête, idéalement au même niveau que l'épaule gauche). La ligne de cou (neckline) relie les creux entre les épaules.",
        "Signal de vente : cassure de la neckline avec volume élevé. Objectif = distance entre la tête et la neckline, projetée vers le bas depuis le point de cassure. Fiabilité historique : 80%+ quand le pattern est bien formé sur le daily ou weekly.",
        "Le Head & Shoulders Inversé est le miroir : pattern de retournement haussier en bas de tendance. (1) Épaule gauche (creux). (2) Tête (creux plus bas). (3) Épaule droite (creux plus haut). Cassure de la neckline par le haut = signal d'achat puissant.",
        "Le volume devrait diminuer progressivement de l'épaule gauche à l'épaule droite, puis exploser à la cassure de la neckline. Un H&S avec un volume croissant sur l'épaule droite est suspect — il pourrait ne pas se compléter. Les épaules ne sont pas toujours parfaitement symétriques.",
      ],
      keyPoints: [
        "H&S = pattern de retournement le plus fiable (80%+)",
        "Objectif = distance tête-neckline projetée depuis la cassure",
        "Volume décroissant épaule gauche → droite, explosion à la cassure",
        "H&S inversé = retournement haussier en bas de tendance",
      ],
      proTips: ["Le H&S sur le weekly est un signal majeur qui ne doit jamais être ignoré — attendez la cassure ET le retest de la neckline pour l'entrée la plus sûre"],
      commonMistakes: ["Voir des H&S partout — le pattern doit être clair, bien proportionné et formé après une tendance significative"],
    },
    {
      title: "Double Top, Double Bottom et Wedges",
      content: [
        "Le Double Top (forme en M) : le prix atteint un sommet, redescend, remonte au même niveau mais échoue à le dépasser, puis casse le support (creux entre les deux sommets). Signal baissier. Objectif = hauteur du pattern projetée vers le bas. Le volume devrait être plus faible sur le 2ème sommet.",
        "Le Double Bottom (forme en W) : le prix atteint un creux, remonte, redescend au même niveau mais ne le casse pas, puis casse la résistance (sommet entre les deux creux). Signal haussier. Le 2ème creux avec un volume plus faible et un RSI en divergence haussière = signal très fort.",
        "Le Rising Wedge (biseau ascendant) : les deux lignes de tendance convergent vers le haut. C'est un pattern baissier malgré la direction haussière — la pression acheteuse s'essouffle progressivement. Cassure par le bas attendue. Le Falling Wedge (biseau descendant) est l'inverse — pattern haussier.",
        "Les drapeaux (flags) et fanions (pennants) sont des patterns de continuation. Le drapeau est un petit canal incliné contre la tendance après un mouvement impulsif (le 'mât'). Le fanion est un petit triangle. Objectif = longueur du mât projetée depuis la cassure. Durée courte (1-3 semaines).",
      ],
      keyPoints: [
        "Double Top (M) = baissier, Double Bottom (W) = haussier",
        "Rising Wedge = baissier, Falling Wedge = haussier",
        "Drapeaux et fanions = continuation de la tendance",
        "Objectif = hauteur du pattern ou longueur du mât",
      ],
      proTips: ["Un double bottom avec divergence RSI haussière est l'un des meilleurs setups de retournement — cherchez-le activement"],
      commonMistakes: ["Trader un drapeau dans la mauvaise direction — c'est un pattern de CONTINUATION, pas de retournement"],
      exercise: "Sur le graphique daily de BTC, identifiez les figures chartistes des 6 derniers mois. Notez le type, la direction attendue, l'objectif théorique et le résultat réel.",
    },
  ],
  quiz: [
    { question: "Un triangle ascendant est :", options: ["Baissier", "Haussier", "Neutre", "Impossible à déterminer"], correct: 1 },
    { question: "L'objectif d'un Head & Shoulders est :", options: ["La hauteur de l'épaule", "La distance tête-neckline projetée", "Le double du prix", "50% de retracement"], correct: 1 },
    { question: "Un Rising Wedge est :", options: ["Haussier", "Baissier", "Neutre", "De continuation"], correct: 1 },
    { question: "Un drapeau (flag) est un pattern de :", options: ["Retournement", "Continuation", "Indécision", "Accumulation"], correct: 1 },
  ],
};

const m2l5: Lesson = {
  id: "m2-l5",
  title: "Théorie de Dow et Structure du Marché",
  icon: "🏛️",
  duration: "45 min",
  description: "Les fondements de l'analyse technique : tendances, structure et phases du marché.",
  subLessons: [
    {
      title: "Les 6 Principes de la Théorie de Dow",
      content: [
        "Charles Dow, fondateur du Wall Street Journal et créateur du Dow Jones Industrial Average, a établi les principes fondamentaux de l'analyse technique au 19ème siècle. Principe 1 : Le marché intègre tout — toute information connue (fondamentale, politique, psychologique) est déjà reflétée dans le prix.",
        "Principe 2 : Le marché a trois tendances — primaire (mois à années), secondaire (semaines à mois, corrections de la primaire), et mineure (jours à semaines, bruit du marché). Principe 3 : Les tendances primaires ont trois phases — (1) Accumulation (smart money achète, pessimisme maximum), (2) Participation publique (la tendance est reconnue, le grand public entre), (3) Distribution (euphorie, smart money vend au public).",
        "Principe 4 : Les indices doivent se confirmer mutuellement — en crypto, BTC et ETH doivent confirmer la même direction. Si BTC monte mais ETH stagne ou baisse, la hausse est suspecte. Principe 5 : Le volume confirme la tendance — un volume croissant dans la direction de la tendance = tendance saine.",
        "Principe 6 : Une tendance persiste jusqu'à un signal clair de retournement. Ne cherchez pas à anticiper les retournements — suivez la tendance jusqu'à preuve du contraire. 'The trend is your friend until it bends.' Ces principes, vieux de plus de 130 ans, restent la base de toute analyse technique moderne.",
      ],
      keyPoints: [
        "Le marché intègre toute l'information dans le prix",
        "3 tendances : primaire, secondaire, mineure",
        "3 phases : accumulation, participation publique, distribution",
        "La tendance persiste jusqu'à signal clair de retournement",
      ],
      proTips: ["Identifiez dans quelle phase du cycle vous êtes AVANT de prendre des décisions de trading — cela change complètement votre approche"],
      commonMistakes: ["Anticiper les retournements au lieu de suivre la tendance — la majorité des traders perdent en essayant de timer les sommets et les creux"],
    },
    {
      title: "Structure du Marché : HH, HL, LH, LL",
      content: [
        "La structure du marché est définie par la séquence des sommets (Highs) et des creux (Lows). Tendance haussière : Higher Highs (HH) et Higher Lows (HL) — chaque sommet est plus haut que le précédent, chaque creux est plus haut que le précédent. C'est la définition même d'une tendance haussière.",
        "Tendance baissière : Lower Highs (LH) et Lower Lows (LL) — chaque sommet est plus bas que le précédent, chaque creux est plus bas. Range/Consolidation : les sommets et creux sont approximativement au même niveau — le marché est indécis et accumule de l'énergie pour le prochain mouvement directionnel.",
        "Le Break of Structure (BOS) se produit quand le prix casse un sommet précédent en tendance haussière (confirmation de continuation) ou un creux précédent en tendance baissière. Le Change of Character (CHoCH) est le premier signe de retournement potentiel : en tendance haussière, le prix fait un Lower Low pour la première fois.",
        "Application pratique : (1) Identifiez la structure sur le daily et le 4h. (2) Tradez uniquement dans la direction de la structure. (3) Entrez sur les pullbacks vers les Higher Lows en tendance haussière. (4) Un CHoCH est un signal d'alerte, pas nécessairement un signal de retournement confirmé — attendez la confirmation avec un nouveau LH.",
      ],
      keyPoints: [
        "Haussier : HH + HL (sommets et creux ascendants)",
        "Baissier : LH + LL (sommets et creux descendants)",
        "BOS = continuation confirmée de la structure",
        "CHoCH = premier signe de retournement potentiel",
      ],
      proTips: ["Marquez les HH, HL, LH, LL sur votre graphique — cela clarifie instantanément la tendance et élimine l'ambiguïté"],
      commonMistakes: ["Confondre un pullback normal (HL) avec un CHoCH — un pullback ne casse pas le creux précédent"],
    },
    {
      title: "Phases du Marché et Cycle de Wyckoff",
      content: [
        "Richard Wyckoff a identifié 4 phases du marché qui se répètent cycliquement : (1) Accumulation — le prix est en range après une baisse prolongée, le smart money achète discrètement. Volume faible, peu d'intérêt médiatique, sentiment négatif. (2) Markup — la tendance haussière commence, le prix sort du range avec volume croissant.",
        "(3) Distribution — le prix est en range après une hausse prolongée, le smart money vend au public euphorique. Volume élevé mais le prix ne progresse plus significativement. Les médias sont très positifs. (4) Markdown — la tendance baissière commence, le prix casse le range par le bas. Panique, capitulation, volume de vente élevé.",
        "Le 'Spring' de Wyckoff est un faux breakout baissier en phase d'accumulation — le prix casse brièvement le support du range pour piéger les vendeurs et déclencher les stop loss, puis remonte fortement. C'est le signal d'achat ultime. L'UTAD (Upthrust After Distribution) est l'inverse — faux breakout haussier en phase de distribution.",
        "Application en crypto : les cycles de Bitcoin suivent remarquablement le schéma de Wyckoff. L'accumulation se produit en bear market (MVRV < 1), le markup après le halving, la distribution au sommet du cycle (MVRV > 3), le markdown pendant le crash. Comprendre ces phases vous donne un avantage considérable sur le marché.",
      ],
      keyPoints: [
        "4 phases : Accumulation, Markup, Distribution, Markdown",
        "Spring = faux breakout baissier en accumulation = signal d'achat",
        "UTAD = faux breakout haussier en distribution = signal de vente",
        "Les cycles Bitcoin suivent le schéma de Wyckoff",
      ],
      proTips: ["Identifiez la phase actuelle du cycle avant toute décision d'investissement — c'est le facteur le plus important pour votre succès à long terme"],
      commonMistakes: ["Acheter en phase de distribution (euphorie médiatique) au lieu d'accumuler en phase d'accumulation (peur et pessimisme)"],
      exercise: "Étudiez le graphique weekly de BTC depuis 2018. Identifiez les 4 phases de Wyckoff pour chaque cycle complet. Dans quelle phase sommes-nous actuellement ?",
    },
  ],
  quiz: [
    { question: "En tendance haussière, la structure montre :", options: ["LH et LL", "HH et HL", "HH et LL", "LH et HL"], correct: 1 },
    { question: "Le 'Spring' de Wyckoff est :", options: ["Un faux breakout haussier", "Un faux breakout baissier en accumulation", "Un gap de prix", "Un pattern de continuation"], correct: 1 },
    { question: "Un CHoCH (Change of Character) signale :", options: ["Continuation de tendance", "Premier signe de retournement potentiel", "Volume élevé", "Consolidation"], correct: 1 },
    { question: "La phase de distribution se caractérise par :", options: ["Smart money achète discrètement", "Range après hausse, smart money vend au public", "Prix en baisse rapide", "Faible volume et pessimisme"], correct: 1 },
  ],
};

export const module2Lessons: Lesson[] = [m2l1, m2l2, m2l3, m2l4, m2l5];