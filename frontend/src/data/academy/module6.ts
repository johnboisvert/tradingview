import { Lesson } from "./types";

const m6l1: Lesson = {
  id: "m6-l1",
  title: "Principes du Scalping Crypto",
  icon: "⚡",
  duration: "40 min",
  description: "Les fondamentaux du scalping : vitesse, précision et discipline extrême.",
  subLessons: [
    {
      title: "Qu'est-ce que le Scalping ?",
      content: [
        "Le scalping capture des micro-mouvements de 0.1-0.5% par trade, avec 10 à 50+ trades par jour. Les timeframes utilisés sont le 1m, 3m et 5m. C'est le style de trading le plus rapide et le plus intense — chaque seconde compte.",
        "Prérequis absolus : connexion Internet ultra-rapide et stable, frais maker inférieurs à 0.02% (négociez avec votre exchange), forte liquidité (tradez uniquement BTC et ETH), discipline extrême, et capacité à prendre des décisions en quelques secondes. Le scalping n'est PAS pour les débutants.",
        "Le scalping est un jeu de probabilités et de volume. Chaque trade individuel a un petit profit, mais la somme de dizaines de trades crée un rendement significatif. Les frais sont votre ennemi #1 : 50 trades × 0.04% de frais = 2% de frais par jour, ce qui peut facilement effacer vos gains.",
        "Le scalping exige un capital minimum de 10 000$ pour que les micro-profits soient significatifs après les frais. Avec un capital plus petit, les frais proportionnels rendent le scalping non viable. C'est une activité professionnelle à temps plein, pas un hobby.",
      ],
      keyPoints: [
        "0.1-0.5% par trade, 10-50+ trades par jour sur 1m-5m",
        "Frais maker < 0.02% obligatoire pour être rentable",
        "BTC et ETH uniquement pour la liquidité nécessaire",
        "Capital minimum 10 000$ — PAS pour les débutants",
      ],
      proTips: ["Négociez vos frais avec l'exchange en montrant votre volume de trading — chaque 0.01% économisé compte énormément en scalping"],
      commonMistakes: ["Scalper des altcoins à faible liquidité — le slippage et les spreads larges mangent tous les profits"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/f0265400-965c-410a-a7e7-9a6d9b1d8f84.png",
          alt: "Scalping Setup",
          caption: "Configuration optimale du scalper : graphiques 1m-5m avec VWAP, order book et time & sales"
        }
      ],
    },
    {
      title: "Mindset du Scalpeur",
      content: [
        "Le scalping exige une discipline militaire. Pas d'hésitation, pas d'émotion, pas de 'je vais attendre un peu pour voir'. Si le setup est là et correspond à vos critères, exécutez immédiatement. Si le Stop Loss est touché, coupez instantanément sans discussion.",
        "Acceptez que 40-50% de vos trades seront perdants. C'est parfaitement normal et attendu. Le profit vient du ratio risque/récompense et de la discipline d'exécution, pas du win rate. Un scalpeur profitable peut avoir un win rate de seulement 45% avec un R:R de 1:1.5.",
        "La fatigue mentale est l'ennemi silencieux du scalpeur. Maximum 2-3 heures de scalping actif par session. Prenez des pauses obligatoires de 5 minutes toutes les 30 minutes. Arrêtez immédiatement après 3 pertes consécutives — votre jugement est compromis.",
        "Traitez le scalping comme un travail mécanique et répétitif, pas comme une activité excitante. L'excitation est l'ennemi de la discipline. Les meilleurs scalpeurs sont ennuyeux et méthodiques — ils exécutent le même processus encore et encore sans émotion.",
      ],
      keyPoints: [
        "Discipline militaire — pas d'hésitation, pas d'émotion",
        "40-50% de trades perdants = normal et attendu",
        "Maximum 2-3 heures de scalping actif par session",
        "Arrêter après 3 pertes consécutives — non négociable",
      ],
      proTips: ["Traitez le scalping comme un travail mécanique — l'excitation et les émotions sont vos pires ennemis"],
      commonMistakes: ["Laisser courir une perte en espérant un retournement — en scalping, coupez immédiatement au SL sans exception"],
    },
    {
      title: "Gestion du Risque en Scalping",
      content: [
        "Risque par trade : 0.25-0.5% du capital maximum. Plus petit que le day trading car le nombre de trades est beaucoup plus élevé. Calcul : 50 trades × 0.5% = 25% de risque cumulé si tous perdants — c'est pourquoi le risque individuel doit être minimal.",
        "Stop Loss serré : 0.1-0.3% du prix d'entrée. Take Profit rapide : 0.2-0.5%. R:R minimum 1:1.5. Le SL doit être placé AVANT l'entrée, pas après. Utilisez des ordres bracket (entrée + SL + TP simultanés) pour une exécution automatique et sans émotion.",
        "Perte maximale journalière : 2-3% du capital total. Si cette limite est atteinte, arrêtez de trader pour la journée entière. Pas de négociation, pas d'exception. Cette règle vous protège contre les journées catastrophiques qui peuvent détruire des semaines de profits.",
        "Le position sizing en scalping est crucial : Taille = Risque en $ / Distance du SL. Exemple : capital 10 000$, risque 0.25% = 25$. SL à 0.15% du prix. BTC à 100 000$, SL à 99 850$. Taille = 25$ / 150$ = 0.167 BTC = 16 700$ de position. Avec levier 2x, marge nécessaire = 8 350$.",
      ],
      keyPoints: [
        "Risque 0.25-0.5% par trade maximum",
        "SL serré 0.1-0.3%, TP rapide 0.2-0.5%, R:R ≥ 1:1.5",
        "Perte max journalière : 2-3% du capital = arrêt total",
        "Ordres bracket : entrée + SL + TP simultanés obligatoires",
      ],
      proTips: ["Programmez votre perte max journalière dans votre plateforme si possible — cela élimine la tentation de continuer après les limites"],
      commonMistakes: ["Augmenter la taille de position après des pertes pour 'récupérer' — c'est une spirale destructrice qui mène à la ruine"],
    },
  ],
  quiz: [
    { question: "Profit typique par trade en scalping :", options: ["5-10%", "1-3%", "0.1-0.5%", "0.01%"], correct: 2 },
    { question: "Frais maker maximum pour le scalping :", options: ["0.1%", "0.05%", "0.02%", "0.5%"], correct: 2 },
    { question: "Perte max journalière recommandée :", options: ["10%", "5%", "2-3%", "0.5%"], correct: 2 },
    { question: "Après 3 pertes consécutives en scalping :", options: ["Doubler la taille", "Continuer normalement", "Arrêter la session", "Changer de stratégie"], correct: 2 },
  ],
};

const m6l2: Lesson = {
  id: "m6-l2",
  title: "Stratégies de Scalping",
  icon: "📊",
  duration: "50 min",
  description: "Order Flow, Tape Reading, micro-niveaux et stratégies de scalping avancées.",
  subLessons: [
    {
      title: "Scalping sur les Micro-Niveaux",
      content: [
        "Identifiez les micro-supports et résistances sur le 1m-5m : niveaux où le prix a rebondi 2-3 fois dans les dernières heures. Ces niveaux sont éphémères (durée de vie de quelques heures) mais tradables avec précision.",
        "Entrée : chandelier de rejet (mèche longue) au micro-niveau + spike de volume. SL : juste au-delà du niveau (quelques ticks). TP : prochain micro-niveau. L'exécution doit être rapide — le setup dure quelques secondes à quelques minutes.",
        "Combinez avec le VWAP : achetez sous le VWAP au micro-support, vendez au-dessus du VWAP à la micro-résistance. Le VWAP est le niveau le plus respecté en intraday par les institutions — le prix y revient constamment comme un aimant.",
        "Les micro-niveaux les plus fiables sont ceux qui coïncident avec des chiffres ronds (ex: 100 000$, 99 500$), le VWAP, ou les EMA 9/21 sur le 5m. Plus il y a de confluence au micro-niveau, plus la réaction sera forte et tradable.",
      ],
      keyPoints: [
        "Micro-S/R sur le 1m-5m = niveaux éphémères mais tradables",
        "Rejet (mèche) + volume spike au micro-niveau = entrée",
        "VWAP = niveau le plus respecté en intraday",
        "Confluence micro-niveau + VWAP + EMA = haute probabilité",
      ],
      proTips: ["Le VWAP est votre meilleur ami en scalping — le prix y revient constamment et les institutions l'utilisent comme référence"],
      commonMistakes: ["Scalper contre la tendance du 15m — tradez TOUJOURS dans la direction du timeframe supérieur"],
    },
    {
      title: "Order Flow et Tape Reading",
      content: [
        "L'order flow analyse les ordres en temps réel dans le carnet d'ordres (order book). Les 'absorptions' se produisent quand de gros ordres absorbent la pression vendeuse ou acheteuse sans que le prix ne bouge — cela signale des niveaux institutionnels défendus activement.",
        "Le tape reading observe le flux des transactions exécutées en temps réel (time & sales). Des séries de gros achats (>10 BTC par transaction) signalent une pression acheteuse institutionnelle significative. L'inverse pour les ventes. Ce flux d'information est en avance sur le prix.",
        "Les 'iceberg orders' sont des ordres cachés qui se rechargent automatiquement après chaque exécution partielle. Si vous voyez un niveau qui absorbe constamment la pression sans que le mur visible ne diminue, c'est probablement un iceberg — signal très fort de niveau institutionnel.",
        "L'order flow donne un avantage significatif mais nécessite beaucoup de pratique et d'expérience pour être interprété correctement. Commencez par observer le carnet d'ordres pendant plusieurs semaines sans trader, puis intégrez progressivement ces informations dans votre analyse.",
      ],
      keyPoints: [
        "Absorptions = niveaux institutionnels défendus activement",
        "Séries de gros achats/ventes = pression directionnelle institutionnelle",
        "Iceberg orders = ordres cachés qui se rechargent automatiquement",
        "Order flow = information en temps réel, en avance sur le prix",
      ],
      proTips: ["L'order flow donne un avantage significatif mais nécessite des mois de pratique — observez avant de trader"],
      commonMistakes: ["Se fier uniquement aux murs visibles dans le carnet d'ordres — les icebergs sont invisibles et souvent plus importants"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/8c2c8456-0127-475f-a792-f56e8d372e66.png",
          alt: "Order Flow et Tape Reading",
          caption: "Analyse de l'order flow : absorptions, iceberg orders et pression directionnelle institutionnelle"
        }
      ],
    },
    {
      title: "Scalping de Breakout Intraday",
      content: [
        "Identifiez les consolidations serrées sur le 1m-3m (range de 0.1-0.3% de largeur). Attendez la cassure accompagnée d'un spike de volume significatif. Entrée immédiate dans la direction de la cassure — la vitesse d'exécution est critique.",
        "SL : milieu de la consolidation (pas l'autre côté — trop large pour du scalping). TP : 1 à 2 fois la hauteur de la consolidation projetée depuis le point de cassure. Durée typique du trade : 30 secondes à 5 minutes. Si le trade ne fonctionne pas en 2-3 minutes, sortez.",
        "Filtres de qualité : (1) Direction alignée avec la tendance du 15m. (2) Volume spike à la cassure (2x+ la moyenne). (3) Pas de résistance majeure immédiate dans la direction de la cassure. (4) Pas d'annonce macro dans les 15 prochaines minutes.",
        "Les meilleures consolidations à scalper durent 5-15 minutes avec un volume décroissant pendant la compression, puis une explosion de volume à la cassure. Plus la compression est longue et serrée, plus le mouvement de cassure sera puissant.",
      ],
      keyPoints: [
        "Consolidation serrée (0.1-0.3%) sur 1m-3m",
        "Cassure + volume spike = entrée immédiate",
        "SL au milieu de la consolidation, TP = 1-2x la hauteur",
        "Si pas de résultat en 2-3 minutes = sortir du trade",
      ],
      proTips: ["Les meilleures consolidations à scalper durent 5-15 minutes avec un volume décroissant suivi d'une explosion — c'est le setup le plus fiable"],
      commonMistakes: ["Rester dans un trade de scalping trop longtemps — si ça ne marche pas rapidement, sortez et cherchez le prochain setup"],
    },
  ],
  quiz: [
    { question: "Le VWAP est :", options: ["Un indicateur de tendance long terme", "Le niveau le plus respecté en intraday", "Un oscillateur de momentum", "Un indicateur de volume cumulé"], correct: 1 },
    { question: "Un iceberg order est :", options: ["Un très gros ordre visible", "Un ordre caché qui se recharge automatiquement", "Un ordre annulé", "Un ordre market"], correct: 1 },
    { question: "Durée typique d'un trade de scalping :", options: ["1 heure", "30 sec à 5 min", "1 jour", "1 semaine"], correct: 1 },
    { question: "Si un trade de scalping ne fonctionne pas en 2-3 min :", options: ["Attendre plus longtemps", "Doubler la position", "Sortir du trade", "Déplacer le SL"], correct: 2 },
  ],
};

const m6l3: Lesson = {
  id: "m6-l3",
  title: "Scalping Futures vs Spot",
  icon: "⚔️",
  duration: "45 min",
  description: "Différences entre le scalping en spot et en futures, avantages et risques.",
  subLessons: [
    {
      title: "Scalping Spot",
      content: [
        "Avantages du scalping spot : pas de risque de liquidation (votre perte maximale est le montant investi), pas de funding rate à payer, mécanisme plus simple à comprendre et exécuter. Inconvénients : vous ne pouvez que long (acheter), les profits sont limités par le capital disponible sans levier.",
        "Le scalping spot est fortement recommandé pour les débutants en scalping. Le risque maximum est le montant investi — pas de stress de liquidation, pas de marge à surveiller. Cela vous permet de vous concentrer sur l'apprentissage de l'exécution et de la discipline.",
        "Stratégie spot : achetez aux micro-supports identifiés avec confirmation de volume, vendez aux micro-résistances. Utilisez 100% de votre allocation scalping (pas de levier). Concentrez-vous sur BTC et ETH pour la liquidité maximale et les spreads les plus serrés.",
        "Transition recommandée : passez au moins 3 mois en scalping spot profitable avant de considérer les futures. Si vous n'êtes pas profitable en spot (sans levier), vous ne le serez certainement pas en futures (avec levier) — le levier amplifie les erreurs autant que les gains.",
      ],
      keyPoints: [
        "Pas de liquidation, pas de funding rate — plus simple et sûr",
        "Ne peut que long (acheter) — limitation principale",
        "Recommandé pour débuter le scalping et apprendre",
        "Risque max = montant investi, pas de stress de marge",
      ],
      proTips: ["Commencez par le scalping spot pendant 3 mois avant de passer aux futures — c'est l'investissement en temps le plus rentable"],
      commonMistakes: ["Passer directement aux futures sans expérience en scalping spot — le levier amplifie les erreurs des débutants"],
    },
    {
      title: "Scalping Futures",
      content: [
        "Avantages des futures : possibilité d'aller long ET short (profiter des baisses), levier disponible (2-5x max en scalping), efficacité du capital supérieure. Inconvénients : risque de liquidation, funding rate qui affecte la rentabilité, complexité accrue.",
        "RÈGLES STRICTES en scalping futures : (1) Levier maximum 3-5x, jamais plus. (2) Isolated margin TOUJOURS (protège le reste du compte). (3) SL OBLIGATOIRE placé avant l'entrée. (4) Risque 0.25% du capital total par trade. (5) Uniquement BTC/ETH pour la liquidité.",
        "Le funding rate affecte la rentabilité en scalping. Si le funding est très positif (>0.05%) et vous êtes long, vous payez toutes les 8 heures. Intégrez le funding dans votre calcul de rentabilité. Astuce : scalpez dans la direction opposée au funding extrême pour un avantage statistique (mean reversion).",
        "La liquidation en scalping est rare si vous respectez les règles (levier 3-5x + SL serré), mais elle est catastrophique si elle se produit. Votre SL doit être touché BIEN AVANT le prix de liquidation — laissez au minimum 50% de marge entre votre SL et votre prix de liquidation.",
      ],
      keyPoints: [
        "Long ET short possible — plus de flexibilité",
        "Levier max 3-5x en scalping, isolated margin obligatoire",
        "SL obligatoire BIEN AVANT le prix de liquidation",
        "Intégrer le funding rate dans le calcul de rentabilité",
      ],
      proTips: ["Scalpez dans la direction opposée au funding extrême — c'est un avantage statistique de mean reversion sous-exploité"],
      commonMistakes: ["Levier 10x+ en scalping — la liquidation est quasi-garantie sur le long terme avec des SL aussi serrés"],
    },
    {
      title: "Choisir entre Spot et Futures",
      content: [
        "Choisissez le spot si : vous débutez en scalping, votre capital est inférieur à 10 000$, vous préférez la simplicité, vous ne voulez pas le stress de la liquidation. Choisissez les futures si : vous êtes expérimenté (3+ mois profitable en spot), capital supérieur à 10 000$, vous voulez shorter, discipline confirmée.",
        "En pratique, beaucoup de scalpeurs professionnels utilisent les futures avec un levier modéré (2-3x) pour la flexibilité du short et l'efficacité du capital. Le levier modéré permet de garder une grande partie du capital en sécurité hors de l'exchange.",
        "Transition recommandée en 4 étapes : (1) 3 mois de scalping spot profitable. (2) 3 mois de scalping futures en paper trading (simulation). (3) Futures réel avec levier 2x et taille de position réduite. (4) Augmenter progressivement le levier jusqu'à 3-5x maximum si profitable.",
        "Indicateur de progression : si votre profit factor est > 1.5 et votre max drawdown < 5% sur 100+ trades en spot, vous êtes prêt pour la transition vers les futures. Si ces métriques ne sont pas atteintes, continuez en spot — le levier n'améliorera pas une stratégie non profitable.",
      ],
      keyPoints: [
        "Spot = simple et sûr pour débuter le scalping",
        "Futures = flexibilité (short) mais risque accru (liquidation)",
        "Transition progressive : spot → paper futures → futures réel 2x → 3-5x",
        "Profit factor > 1.5 et drawdown < 5% = prêt pour les futures",
      ],
      proTips: ["Ne passez aux futures que quand vous êtes profitable en spot pendant 3 mois — c'est la seule transition responsable"],
      commonMistakes: ["Sauter directement aux futures avec levier élevé sans expérience — recette garantie pour la catastrophe financière"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/c82d17f6-9ca1-4adb-96a0-067a3fdaf689.png",
          alt: "Spot vs Futures Scalping",
          caption: "Comparaison Spot vs Futures : avantages, risques et progression recommandée"
        }
      ],
    },
  ],
  quiz: [
    { question: "Le scalping spot ne permet que :", options: ["Long et short", "Long uniquement", "Short uniquement", "Ni l'un ni l'autre"], correct: 1 },
    { question: "Levier max recommandé en scalping futures :", options: ["10x", "20x", "3-5x", "50x"], correct: 2 },
    { question: "Transition recommandée vers les futures :", options: ["Directement futures 10x", "Spot → paper futures → futures réel", "Futures d'abord puis spot", "Pas de transition nécessaire"], correct: 1 },
    { question: "Profit factor minimum pour passer aux futures :", options: ["0.5", "1.0", "1.5", "3.0"], correct: 2 },
  ],
};

const m6l4: Lesson = {
  id: "m6-l4",
  title: "Gestion du Risque en Scalping",
  icon: "🛡️",
  duration: "40 min",
  description: "Gestion du risque spécifique au scalping : taille, SL, perte max et discipline.",
  subLessons: [
    {
      title: "Position Sizing Avancé",
      content: [
        "En scalping, la taille de position est plus grande en pourcentage du capital car le SL est très serré. Mais le RISQUE par trade reste petit (0.25-0.5%). La formule : Taille de position = Risque en $ / Distance du SL en $.",
        "Exemple détaillé : Capital 10 000$, risque 0.25% = 25$. SL à 0.15% du prix d'entrée. BTC à 100 000$, SL à 99 850$ (distance = 150$). Taille = 25$ / 150$ = 0.167 BTC = 16 700$ de position. Avec levier 2x, marge nécessaire = 8 350$.",
        "Ajustez la taille selon la volatilité en temps réel : ATR élevé → réduisez la taille (mouvements plus grands, SL plus large). ATR faible → augmentez la taille (mouvements plus petits, SL plus serré). L'objectif est que chaque trade risque exactement le même montant en dollars.",
        "Utilisez un calculateur de position sizing (spreadsheet ou outil en ligne) pour calculer automatiquement la taille avant chaque trade. Ne calculez JAMAIS la taille de position à la volée ou au feeling — c'est une source majeure d'incohérence dans les résultats.",
      ],
      keyPoints: [
        "Risque fixe 0.25-0.5% par trade, taille variable",
        "Taille = Risque$ / Distance SL en $",
        "Ajuster selon la volatilité (ATR) en temps réel",
        "Même risque en $ pour chaque trade = cohérence",
      ],
      proTips: ["Calculez votre taille de position AVANT chaque trade avec un outil — jamais à la volée ou au feeling"],
      commonMistakes: ["Taille de position au feeling — cela garantit des résultats incohérents et une gestion du risque défaillante"],
    },
    {
      title: "Règles de Discipline Strictes",
      content: [
        "Règle 1 : SL placé AVANT l'entrée, jamais déplacé dans le mauvais sens. Règle 2 : Perte max journalière 2% du capital = arrêt immédiat et total. Règle 3 : 3 pertes consécutives = pause obligatoire de 30 minutes minimum.",
        "Règle 4 : Pas de scalping pendant les annonces macro-économiques. Règle 5 : Pas de scalping quand vous êtes fatigué, stressé, en colère ou émotionnel. Règle 6 : Respectez votre plan de trading — pas d'improvisation, pas de trades 'spontanés'.",
        "Règle 7 : Revue quotidienne obligatoire de tous les trades de la journée (15-30 min). Règle 8 : Objectif de profit journalier raisonnable (0.5-1% du capital). Quand l'objectif est atteint, vous POUVEZ arrêter (pas obligatoire mais fortement recommandé).",
        "Imprimez ces règles et collez-les à côté de votre écran de trading. Relisez-les chaque matin avant de commencer. La discipline est le facteur #1 de succès en scalping — plus important que la stratégie, l'analyse ou le capital.",
      ],
      keyPoints: [
        "SL avant l'entrée, jamais déplacé dans le mauvais sens",
        "Perte max 2%/jour = arrêt total, 3 pertes = pause 30 min",
        "Pas de scalping fatigué, stressé ou pendant les annonces",
        "Revue quotidienne obligatoire de tous les trades",
      ],
      proTips: ["Imprimez vos règles et collez-les à côté de votre écran — la discipline commence par des rappels visuels constants"],
      commonMistakes: ["Ignorer ses propres règles 'juste cette fois' — chaque exception crée un précédent qui érode la discipline"],
    },
    {
      title: "Suivi de Performance",
      content: [
        "Métriques essentielles à suivre quotidiennement et hebdomadairement : nombre de trades, win rate (%), R:R moyen, profit factor (gains totaux / pertes totales), max drawdown, Sharpe ratio. Ces chiffres sont votre tableau de bord de performance.",
        "Un scalpeur profitable typique : win rate 50-60%, R:R moyen 1:1.2 à 1:1.5, profit factor > 1.5, max drawdown < 5% du capital. Si vos métriques sont en dessous de ces seuils après 100+ trades, votre stratégie a un problème fondamental qui doit être identifié et corrigé.",
        "Analysez vos trades par heure de la journée, par type de setup, et par actif pour identifier précisément vos forces et faiblesses. Vous découvrirez peut-être que vous êtes profitable uniquement entre 14h et 17h UTC, ou uniquement sur les pullbacks — concentrez-vous sur vos forces.",
        "Utilisez un spreadsheet détaillé ou un outil spécialisé comme Tradervue, Edgewonk ou TradesViz pour le suivi automatique. L'analyse de données est ce qui sépare les scalpeurs amateurs des professionnels — les pros prennent des décisions basées sur les données, pas sur les impressions.",
      ],
      keyPoints: [
        "Cibles : win rate 50-60%, R:R 1:1.2-1.5, profit factor > 1.5",
        "Max drawdown < 5% du capital total",
        "Suivi quotidien et hebdomadaire des métriques clés",
        "Analyser par heure, par setup, par actif pour optimiser",
      ],
      proTips: ["Si votre profit factor est < 1.2 après 100 trades, votre stratégie a un problème fondamental — arrêtez et analysez avant de continuer"],
      commonMistakes: ["Ne pas suivre ses métriques de performance — impossible de s'améliorer sans données objectives"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/810c3303-6b75-44db-b54f-2cf48568eaef.png",
          alt: "Métriques de performance scalping",
          caption: "Tableau de bord de performance : win rate, profit factor, R:R moyen et drawdown maximum"
        }
      ],
      exercise: "Faites 50 trades de scalping en paper trading sur 2 semaines. Documentez chaque trade. Calculez votre win rate, R:R moyen et profit factor. Êtes-vous profitable ?",
    },
  ],
  quiz: [
    { question: "Risque par trade en scalping :", options: ["2-3%", "1%", "0.25-0.5%", "5%"], correct: 2 },
    { question: "Perte max journalière en scalping :", options: ["10%", "5%", "2%", "0.5%"], correct: 2 },
    { question: "Profit factor minimum pour être profitable :", options: ["0.5", "1.0", "1.5", "2.0"], correct: 2 },
    { question: "Win rate typique d'un scalpeur profitable :", options: ["90%+", "75-80%", "50-60%", "30-40%"], correct: 2 },
  ],
};

export const module6Lessons: Lesson[] = [m6l1, m6l2, m6l3, m6l4];