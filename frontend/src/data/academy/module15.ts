import { Lesson } from "./types";

const m15l1: Lesson = {
  id: "m15-l1",
  title: "Fiscalité Crypto et Cadre Légal",
  icon: "📋",
  duration: "50 min",
  description: "Comprendre les obligations fiscales et le cadre réglementaire des cryptomonnaies.",
  subLessons: [
    {
      title: "Fiscalité Crypto en France",
      content: [
        "En France, les plus-values crypto sont imposées au Prélèvement Forfaitaire Unique (PFU) de 30% (12.8% impôt + 17.2% prélèvements sociaux). Cela s'applique à chaque conversion crypto → fiat (euros). Les échanges crypto → crypto ne sont PAS imposables.",
        "Le fait générateur est la conversion en monnaie fiat ou l'achat de biens/services avec de la crypto. Acheter BTC avec USDT n'est pas imposable. Vendre BTC contre EUR l'est. Les stablecoins sont considérés comme des cryptos, pas du fiat.",
        "Le calcul de la plus-value utilise la méthode du prix moyen pondéré d'acquisition (PMPA). Plus-value = Prix de cession - (PMPA × proportion cédée). C'est plus complexe qu'il n'y paraît avec de multiples achats à différents prix.",
        "Déclaration obligatoire : formulaire 2086 pour les plus-values, formulaire 3916-bis pour déclarer les comptes sur les plateformes étrangères (Binance, Kraken, etc.). L'amende pour non-déclaration est de 750€ par compte non déclaré."
      ],
      keyPoints: [
        "PFU 30% sur les conversions crypto → fiat",
        "Crypto → crypto = non imposable",
        "Méthode du prix moyen pondéré d'acquisition",
        "Déclarer les comptes étrangers (3916-bis) obligatoire"
      ],
      proTips: ["Utilisez des outils comme Waltio ou Koinly pour calculer automatiquement vos plus-values"],
      commonMistakes: ["Ne pas déclarer ses comptes crypto à l'étranger — amende de 750€ par compte"],
      example: "Vous achetez 1 BTC à 30k€, puis 1 BTC à 50k€. PMPA = 40k€. Vous vendez 0.5 BTC à 60k€. Plus-value = 30k€ - (40k€ × 0.25) = 20k€. Impôt = 20k€ × 30% = 6k€."
    },
    {
      title: "Optimisation Fiscale Légale",
      content: [
        "Le DCA de sortie : au lieu de tout vendre d'un coup (grosse plus-value), vendez progressivement sur plusieurs années fiscales pour lisser l'imposition. Chaque année, vous pouvez optimiser le montant de plus-value réalisée.",
        "Les pertes sont déductibles des gains de la même année. Si vous avez 10k€ de gains et 3k€ de pertes, vous n'êtes imposé que sur 7k€. Vendez vos positions perdantes en fin d'année pour réduire votre base imposable (tax-loss harvesting).",
        "Le statut de trader professionnel (BIC) peut être plus avantageux si vous tradez à plein temps avec des revenus importants. Vous pouvez déduire vos frais (matériel, abonnements, formation). Consultez un expert-comptable spécialisé.",
        "Les donations de crypto sont possibles et peuvent être avantageuses fiscalement. Les abattements pour donations familiales s'appliquent. Consultez un avocat fiscaliste pour les stratégies complexes."
      ],
      keyPoints: [
        "DCA de sortie pour lisser l'imposition",
        "Tax-loss harvesting : vendre les pertes pour réduire les gains",
        "Statut professionnel (BIC) si trading à plein temps",
        "Consulter un expert pour les stratégies complexes"
      ],
      proTips: ["En décembre, faites le bilan de vos gains/pertes et vendez les positions perdantes pour optimiser"],
      commonMistakes: ["Ignorer la fiscalité et avoir une mauvaise surprise — provisionnez 30% de vos gains"]
    },
    {
      title: "Réglementation et Évolutions",
      content: [
        "MiCA (Markets in Crypto-Assets) est le cadre réglementaire européen entré en vigueur en 2024. Il impose des règles aux exchanges (PSAN/CASP), aux émetteurs de stablecoins, et aux fournisseurs de services crypto.",
        "Le Travel Rule oblige les exchanges à collecter et transmettre les informations des expéditeurs et destinataires pour les transferts > 1000€. Cela affecte la vie privée mais vise à lutter contre le blanchiment.",
        "La DeFi reste largement non réglementée mais les régulateurs s'y intéressent. Les protocoles véritablement décentralisés sont plus difficiles à réguler. Les interfaces front-end peuvent être bloquées mais les smart contracts restent accessibles.",
        "Tendances : réglementation croissante mais aussi légitimation. Les ETF Bitcoin/Ethereum, l'adoption par les institutions, et les CBDC (monnaies numériques de banques centrales) façonnent le futur du secteur."
      ],
      keyPoints: [
        "MiCA = cadre réglementaire européen (2024)",
        "Travel Rule pour les transferts > 1000€",
        "DeFi encore largement non réglementée",
        "ETF et adoption institutionnelle = légitimation"
      ],
      proTips: ["Restez informé des évolutions réglementaires — elles peuvent impacter significativement les prix et l'accès aux services"],
      commonMistakes: ["Ignorer la réglementation en pensant que la crypto est 'hors la loi' — les sanctions sont réelles"]
    }
  ],
  quiz: [
    { question: "Le taux d'imposition crypto en France (PFU) est de :", options: ["12.8%", "17.2%", "30%", "45%"], correct: 2 },
    { question: "Les échanges crypto → crypto sont :", options: ["Imposables", "Non imposables", "Imposables à 15%", "Interdits"], correct: 1 },
    { question: "Le tax-loss harvesting consiste à :", options: ["Acheter plus en baisse", "Vendre les pertes pour réduire les gains imposables", "Éviter les impôts", "Déclarer ses pertes comme revenus"], correct: 1 },
    { question: "MiCA est :", options: ["Un exchange", "Le cadre réglementaire crypto européen", "Un stablecoin", "Un protocole DeFi"], correct: 1 }
  ]
};

const m15l2: Lesson = {
  id: "m15-l2",
  title: "Construire son Plan de Trading Complet",
  icon: "📝",
  duration: "55 min",
  description: "Créer un plan de trading professionnel et structuré pour réussir sur le long terme.",
  subLessons: [
    {
      title: "Les Composantes d'un Plan de Trading",
      content: [
        "Un plan de trading est votre feuille de route. Sans plan, vous êtes un joueur, pas un trader. Les composantes essentielles : objectifs, capital, gestion du risque, stratégies, règles d'entrée/sortie, et routine.",
        "Objectifs SMART : Spécifiques (10% par mois), Mesurables (journal de trading), Atteignables (pas 100%/mois), Réalistes (basés sur le backtest), Temporels (objectif à 6 mois). Révisez vos objectifs chaque trimestre.",
        "Définissez votre profil : capital disponible (uniquement ce que vous pouvez perdre), temps disponible (30 min/jour = swing, 8h/jour = day trading), tolérance au risque (conservateur 0.5%, modéré 1%, agressif 2%), et expérience.",
        "Vos règles doivent être écrites et non négociables : max X% de risque par trade, max Y trades par jour, pas de trading après Z pertes, pas de trading pendant les annonces macro, pas de trading émotionnel."
      ],
      keyPoints: [
        "Plan écrit = discipline = profits long terme",
        "Objectifs SMART et révisés trimestriellement",
        "Profil : capital, temps, tolérance au risque",
        "Règles non négociables écrites et affichées"
      ],
      proTips: ["Imprimez votre plan et collez-le à côté de votre écran de trading"],
      commonMistakes: ["Avoir un plan 'dans la tête' — s'il n'est pas écrit, il n'existe pas"]
    },
    {
      title: "Stratégies et Setups Définis",
      content: [
        "Définissez 2-3 setups maximum que vous maîtrisez parfaitement. Chaque setup doit avoir : conditions d'entrée précises, placement du SL, objectifs de TP, taille de position, et timeframe.",
        "Setup exemple #1 — Pullback EMA : Tendance weekly haussière → prix revient sur EMA 21 daily → chandelier de rejet (hammer/engulfing) → volume en hausse → entrée. SL sous le dernier swing low. TP1 à 1.5R, TP2 à 2.5R.",
        "Setup exemple #2 — Breakout : Consolidation daily (min 2 semaines) → cassure avec volume 2x la moyenne → retest du niveau cassé → entrée sur le retest. SL sous le niveau cassé. TP1 à la hauteur du range, TP2 extension Fib 161.8%.",
        "Setup exemple #3 — Divergence RSI : RSI daily fait un nouveau low/high contraire au prix → confirmation par chandelier de retournement → entrée. SL au-delà de l'extrême. TP à la résistance/support suivant."
      ],
      keyPoints: [
        "Maximum 2-3 setups maîtrisés",
        "Chaque setup : entrée, SL, TP, taille, TF",
        "Pullback, Breakout, Divergence : 3 setups classiques",
        "Ne tradez QUE vos setups — rien d'autre"
      ],
      proTips: ["Créez une fiche pour chaque setup avec des captures d'écran d'exemples passés"],
      commonMistakes: ["Avoir 10 stratégies différentes et n'en maîtriser aucune — la spécialisation paie"]
    },
    {
      title: "Routine et Amélioration Continue",
      content: [
        "Routine quotidienne : (1) Revue macro 5 min (news, calendrier économique). (2) Analyse top-down 15 min (weekly → daily → 4h). (3) Identification des setups. (4) Placement des ordres. (5) Revue de fin de journée 10 min.",
        "Routine hebdomadaire (dimanche) : Analyse weekly de BTC, ETH et vos watchlist. Revue du journal de trading. Calcul des métriques (win rate, R:R moyen, profit factor). Identification des erreurs récurrentes.",
        "Routine mensuelle : Bilan complet du mois. P&L détaillé. Analyse des meilleures et pires trades. Ajustement du plan si nécessaire. Objectifs pour le mois suivant. Évaluation émotionnelle.",
        "L'amélioration continue est la clé. Les meilleurs traders ne cessent jamais d'apprendre. Lisez, formez-vous, échangez avec d'autres traders, et surtout, analysez vos propres trades. Votre journal est votre meilleur professeur."
      ],
      keyPoints: [
        "Routine quotidienne : 30-45 min structurées",
        "Revue hebdomadaire : métriques et erreurs",
        "Bilan mensuel : P&L et ajustements",
        "Amélioration continue = clé du succès long terme"
      ],
      proTips: ["Le dimanche soir est le meilleur moment pour préparer votre semaine de trading"],
      commonMistakes: ["Ne pas avoir de routine — le trading sans structure est du gambling"],
      exercise: "Rédigez votre plan de trading complet : objectifs, profil, 2 setups détaillés, règles de risque, et routine quotidienne/hebdomadaire. Testez-le en paper trading pendant 1 mois avant de passer en réel."
    }
  ],
  quiz: [
    { question: "Combien de setups devez-vous maîtriser ?", options: ["1 seul", "2-3 maximum", "10+", "Autant que possible"], correct: 1 },
    { question: "Un plan de trading doit être :", options: ["Dans votre tête", "Écrit et non négociable", "Flexible selon l'humeur", "Copié d'un influenceur"], correct: 1 },
    { question: "La revue hebdomadaire se fait idéalement :", options: ["Lundi matin", "Vendredi soir", "Dimanche", "Chaque jour"], correct: 2 },
    { question: "Le meilleur professeur d'un trader est :", options: ["YouTube", "Twitter", "Son journal de trading", "Les signaux payants"], correct: 2 }
  ]
};

export const module15Lessons: Lesson[] = [m15l1, m15l2];
