import { Lesson } from "./types";

const m9l1: Lesson = {
  id: "m9-l1",
  title: "Position Sizing et Règle du 1-2%",
  icon: "📏",
  duration: "45 min",
  description: "Calculer la taille de vos positions et protéger votre capital.",
  subLessons: [
    {
      title: "La Règle du 1-2%",
      content: [
        "Ne risquez JAMAIS plus de 1-2% de votre capital total par trade. C'est la règle la plus importante en trading — elle garantit votre survie à long terme. Avec un capital de 10 000$, votre perte maximale par trade est de 100-200$. 10 pertes consécutives à 2% = -18% (survivable et récupérable) vs 10 pertes à 10% = -65% (catastrophique).",
        "La formule de position sizing : Taille de position = (Capital × %risque) / Distance du SL en $. Exemple : capital 10 000$, risque 1% = 100$. BTC à 100 000$, SL à 98 000$ (distance = 2 000$). Taille = 100$ / 2 000$ = 0.05 BTC = 5 000$ de position.",
        "Le risque doit être fixe en POURCENTAGE (pas en dollars). Cela signifie que votre risque s'adapte automatiquement à la taille de votre capital. Si votre capital augmente, votre risque en dollars augmente proportionnellement. Si votre capital diminue, votre risque diminue aussi — protection naturelle.",
        "Recommandations par niveau : débutants 0.5% par trade, intermédiaires 1%, avancés 1-2%. Maximum 3-5 positions simultanées (les cryptos sont fortement corrélées). Risque total du portefeuille : maximum 5-10% à tout moment.",
      ],
      keyPoints: [
        "Maximum 1-2% de risque par trade — règle non négociable",
        "Formule : (Capital × %risque) / Distance SL = Taille de position",
        "Risque fixe en % (pas en $) — s'adapte automatiquement",
        "Max 3-5 positions simultanées, risque total max 5-10%",
      ],
      proTips: ["Avant chaque trade, posez-vous la question : 'Si je perds, est-ce que ça change ma journée ?' Si oui, la position est trop grosse"],
      commonMistakes: ["Risquer 5-10% par trade 'parce que c'est sûr' — aucun trade n'est sûr, et 5 pertes à 10% = -41% du capital"],
      example: "Capital 20 000$, risque 1% = 200$. ETH à 3 200$, SL à 3 100$ (distance = 100$). Taille = 200$ / 100$ = 2 ETH (6 400$).",
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/810c3303-6b75-44db-b54f-2cf48568eaef.png",
          alt: "Position Sizing et Règle du 1-2%",
          caption: "Position sizing : ne risquez jamais plus de 1-2% de votre capital par trade pour garantir la survie à long terme"
        }
      ],
    },
    {
      title: "Position Sizing Avancé",
      content: [
        "Le Kelly Criterion calcule la taille optimale de position basée sur votre win rate et votre R:R. Formule simplifiée : Kelly% = Win Rate - (1 - Win Rate) / R:R. Exemple : win rate 55%, R:R 1:2. Kelly = 0.55 - 0.45/2 = 0.325 = 32.5%. En pratique, utilisez 25-50% du Kelly (fractional Kelly) pour réduire la volatilité.",
        "Le position sizing basé sur la volatilité (ATR) ajuste la taille en fonction de la volatilité actuelle. Taille = Risque$ / (ATR × multiplicateur). En période de haute volatilité, la taille diminue automatiquement. En période calme, elle augmente. Cela maintient un risque constant en termes de volatilité.",
        "La pyramide (ajout à une position gagnante) : ajoutez à votre position quand le trade va dans votre direction et confirme votre analyse. Règles : (1) Ajoutez uniquement après que le SL est au breakeven. (2) Chaque ajout est plus petit que le précédent (50%, 25%). (3) Le risque total ne dépasse jamais 3% du capital.",
        "L'anti-martingale : augmentez la taille de position après des gains et diminuez après des pertes. C'est l'inverse de la martingale (doubler après les pertes, qui est catastrophique). L'anti-martingale capitalise sur les séries gagnantes et protège le capital pendant les séries perdantes.",
      ],
      keyPoints: [
        "Kelly Criterion : taille optimale basée sur win rate et R:R",
        "ATR-based sizing : ajuste automatiquement à la volatilité",
        "Pyramide : ajouter à une position gagnante (SL au breakeven d'abord)",
        "Anti-martingale : plus gros après gains, plus petit après pertes",
      ],
      proTips: ["Utilisez le fractional Kelly (25-50% du Kelly) — le Kelly complet est trop agressif et la volatilité des résultats est insupportable"],
      commonMistakes: ["La martingale (doubler après les pertes) — c'est la stratégie la plus destructrice qui existe, elle garantit la ruine à long terme"],
    },
    {
      title: "Corrélation et Risque de Portefeuille",
      content: [
        "Les cryptomonnaies sont fortement corrélées entre elles (corrélation BTC-altcoins souvent > 0.7). Cela signifie que 5 positions long sur 5 cryptos différentes ne sont PAS vraiment diversifiées — si BTC baisse, elles baissent probablement toutes.",
        "Risque de portefeuille réel : si vous avez 3 positions long à 2% de risque chacune sur des cryptos corrélées, votre risque réel est proche de 6% (pas 2% comme vous le pensez). En cas de crash, les 3 positions perdent simultanément.",
        "Diversification réelle en crypto : (1) Diversifiez les directions (long + short). (2) Diversifiez les timeframes (swing + position). (3) Diversifiez les stratégies (tendance + mean reversion). (4) Gardez une réserve en stablecoins (20-30% minimum).",
        "La règle de concentration maximale : aucune position ne devrait représenter plus de 25% de votre portefeuille total. Aucun secteur (DeFi, L1, meme coins) ne devrait dépasser 30%. Cette diversification protège contre les risques spécifiques à un actif ou un secteur.",
      ],
      keyPoints: [
        "Cryptos fortement corrélées — 5 longs ≠ diversification",
        "Risque réel = somme des risques si corrélation élevée",
        "Diversifier : directions, timeframes, stratégies, stablecoins",
        "Max 25% par position, max 30% par secteur",
      ],
      proTips: ["Considérez votre exposition totale au marché crypto comme UNE seule position — c'est plus réaliste que de penser être diversifié"],
      commonMistakes: ["Penser être diversifié avec 10 altcoins — en réalité, c'est une seule position 'crypto' avec un risque concentré"],
    },
  ],
  quiz: [
    { question: "Règle du 1% sur 20 000$ :", options: ["20$", "200$", "2 000$", "1 000$"], correct: 1 },
    { question: "La formule de position sizing :", options: ["Capital / Prix", "(Capital × %risque) / Distance SL", "Capital × levier", "Prix × volume"], correct: 1 },
    { question: "La martingale (doubler après les pertes) est :", options: ["Excellente", "Acceptable", "Catastrophique", "Neutre"], correct: 2 },
    { question: "5 positions long sur 5 cryptos corrélées :", options: ["Très diversifié", "Pas vraiment diversifié", "Sans risque", "Optimal"], correct: 1 },
  ],
};

const m9l2: Lesson = {
  id: "m9-l2",
  title: "Risk/Reward Ratio et Espérance Mathématique",
  icon: "⚖️",
  duration: "50 min",
  description: "Comprendre le R:R, l'espérance mathématique et pourquoi ils sont plus importants que le win rate.",
  subLessons: [
    {
      title: "Le Risk/Reward Ratio",
      content: [
        "Le R:R (Risk/Reward Ratio) compare le risque potentiel au gain potentiel d'un trade. R:R de 1:2 signifie risquer 1$ pour potentiellement gagner 2$. R:R de 1:3 = risquer 1$ pour 3$. Le R:R est calculé AVANT d'entrer en position : R:R = Distance TP / Distance SL.",
        "Le R:R est PLUS IMPORTANT que le win rate. Avec un R:R de 1:2, vous n'avez besoin que de 34% de win rate pour être profitable. Avec un R:R de 1:3, seulement 26% de win rate suffit. Cela signifie que vous pouvez perdre 2 trades sur 3 et être quand même profitable.",
        "Comparaison concrète : Trader A avec 60% de win rate et R:R 1:0.8 → sur 100 trades à 100$ de risque : gains = 60 × 80$ = 4 800$, pertes = 40 × 100$ = 4 000$, profit net = 800$. Trader B avec 35% de win rate et R:R 1:3 → gains = 35 × 300$ = 10 500$, pertes = 65 × 100$ = 6 500$, profit net = 4 000$. B gagne 5x plus avec un win rate 2x plus bas.",
        "Règle : minimum R:R de 1:1.5, idéal 1:2 ou 1:3. Si le R:R n'est pas suffisant, NE PRENEZ PAS le trade — même si le setup semble parfait. Un bon setup avec un mauvais R:R est un mauvais trade. Calculez TOUJOURS le R:R avant d'entrer.",
      ],
      keyPoints: [
        "R:R = Distance TP / Distance SL, calculé AVANT l'entrée",
        "R:R 1:2 = seulement 34% de win rate nécessaire",
        "R:R plus important que le win rate pour la rentabilité",
        "Minimum 1:1.5, idéal 1:2-1:3 — sinon pas de trade",
      ],
      proTips: ["Calculez le R:R AVANT d'entrer — si < 1:1.5, passez au trade suivant sans hésiter, même si le setup est beau"],
      commonMistakes: ["Entrer sans calculer le R:R — c'est du gambling, pas du trading"],
    },
    {
      title: "L'Espérance Mathématique",
      content: [
        "L'espérance mathématique (EV - Expected Value) est le profit moyen attendu par trade. Formule : EV = (Win Rate × Gain Moyen) - (Loss Rate × Perte Moyenne). Si EV > 0, votre système est profitable à long terme. Si EV < 0, vous perdrez inévitablement sur un nombre suffisant de trades.",
        "Exemple : win rate 45%, gain moyen 200$, perte moyenne 100$. EV = (0.45 × 200$) - (0.55 × 100$) = 90$ - 55$ = +35$ par trade. Sur 100 trades, profit attendu = 3 500$. Même avec un win rate inférieur à 50%, le système est profitable grâce au R:R favorable.",
        "Le profit factor est un autre indicateur clé : Profit Factor = Gains Totaux / Pertes Totales. PF > 1 = profitable, PF > 1.5 = bon, PF > 2 = excellent. Un profit factor de 1.5 signifie que pour chaque dollar perdu, vous gagnez 1.50$.",
        "Testez votre système sur un minimum de 100 trades (paper trading ou backtesting) avant de risquer du capital réel. L'espérance mathématique ne se révèle que sur un grand nombre de trades — 10-20 trades ne sont pas suffisants pour évaluer un système.",
      ],
      keyPoints: [
        "EV = (Win Rate × Gain Moyen) - (Loss Rate × Perte Moyenne)",
        "EV > 0 = système profitable à long terme",
        "Profit Factor > 1.5 = bon système, > 2 = excellent",
        "Minimum 100 trades pour évaluer un système",
      ],
      proTips: ["Calculez l'espérance mathématique de votre système chaque mois — si elle est négative, arrêtez de trader et ajustez votre stratégie"],
      commonMistakes: ["Évaluer un système sur 10-20 trades — c'est statistiquement insignifiant, il faut minimum 100 trades"],
    },
    {
      title: "Optimiser le R:R en Pratique",
      content: [
        "Technique #1 — Entrée précise : utilisez le timeframe inférieur (4h → 1h) pour affiner votre entrée. Un SL plus serré améliore mécaniquement le R:R. Attention : un SL trop serré augmente le risque d'être stoppé par le bruit du marché.",
        "Technique #2 — TP partiels : prenez 33% à 1R (breakeven garanti), 33% à 2R, et laissez 34% courir avec un trailing stop. Le R:R effectif de cette approche est souvent supérieur au R:R initial car la dernière portion peut capturer des mouvements prolongés.",
        "Technique #3 — Sélection des trades : ne prenez que les trades avec un R:R de 1:2 minimum. Cela signifie passer beaucoup de setups qui semblent bons mais dont le R:R est insuffisant. La patience de n'attendre que les meilleurs R:R est extrêmement rentable.",
        "Le R:R optimal dépend de votre win rate : si votre win rate est de 60%, un R:R de 1:1.5 suffit. Si votre win rate est de 40%, vous avez besoin d'un R:R de 1:2.5 minimum. Ajustez votre R:R cible en fonction de vos statistiques réelles, pas de vos espoirs.",
      ],
      keyPoints: [
        "Entrée précise sur TF inférieur = SL plus serré = meilleur R:R",
        "TP partiels 33%/33%/34% optimisent le R:R effectif",
        "Ne prendre que les trades R:R ≥ 1:2 — patience rentable",
        "Ajuster le R:R cible selon votre win rate réel",
      ],
      proTips: ["La sélection des trades basée sur le R:R est le facteur le plus impactant sur votre rentabilité — soyez impitoyablement sélectif"],
      commonMistakes: ["Prendre des trades avec un R:R de 1:0.5 'parce que le setup est parfait' — un mauvais R:R reste un mauvais trade"],
    },
  ],
  quiz: [
    { question: "R:R de 1:3 signifie :", options: ["Risquer 3$ pour 1$", "Risquer 1$ pour 3$", "3 trades gagnants/1 perdant", "3% de risque"], correct: 1 },
    { question: "Avec R:R 1:2, win rate minimum :", options: ["> 50%", "> 34%", "> 25%", "> 66%"], correct: 1 },
    { question: "L'espérance mathématique doit être :", options: ["Négative", "Nulle", "Positive", "Variable"], correct: 2 },
    { question: "Profit Factor > 1.5 signifie :", options: ["Système perdant", "Bon système", "Système neutre", "Trop de risque"], correct: 1 },
  ],
};

const m9l3: Lesson = {
  id: "m9-l3",
  title: "Stop-Loss Avancés",
  icon: "🛑",
  duration: "45 min",
  description: "Trailing Stop, ATR-based, Time Stop et techniques avancées de Stop Loss.",
  subLessons: [
    {
      title: "Types de Stop Loss",
      content: [
        "Le SL fixe est placé à un niveau de prix prédéfini et ne bouge pas. Simple et efficace. Placez-le aux niveaux techniques significatifs : sous un support, sous un HL, sous une zone de demand. Ajoutez une marge de quelques ticks pour éviter les faux déclenchements (stop hunting).",
        "Le SL basé sur l'ATR s'adapte automatiquement à la volatilité. Formule : SL = Prix d'entrée - (ATR × multiplicateur). Multiplicateur typique : 1.5 pour le scalping, 2 pour le day trading, 2.5-3 pour le swing trading. En période volatile, le SL est plus large. En période calme, plus serré.",
        "Le Trailing Stop suit le prix à une distance fixe et ne recule jamais. Quand le prix monte, le trailing stop monte aussi. Quand le prix recule de la distance définie, la position est fermée. Idéal pour capturer les mouvements prolongés tout en protégeant les profits.",
        "Le Time Stop ferme une position après un certain temps si elle n'a pas atteint son objectif. Si un swing trade n'a pas progressé après 5-7 jours, il y a probablement un problème avec l'analyse. Le capital immobilisé dans un trade stagnant pourrait être mieux utilisé ailleurs.",
      ],
      keyPoints: [
        "SL fixe : simple, aux niveaux techniques + marge",
        "SL ATR : s'adapte à la volatilité automatiquement",
        "Trailing Stop : suit le prix, protège les profits en tendance",
        "Time Stop : ferme après X jours sans progression",
      ],
      proTips: ["Combinez le SL ATR pour l'entrée et le trailing stop pour la gestion — c'est la combinaison la plus efficace"],
      commonMistakes: ["Placer le SL à un niveau arbitraire (ex: -5%) sans considérer la structure technique et la volatilité"],
    },
    {
      title: "Stop Hunting et Protection",
      content: [
        "Le stop hunting est une pratique où les gros acteurs (market makers, baleines) poussent temporairement le prix vers des zones de concentration de Stop Loss pour les déclencher, puis le prix revient dans la direction originale. C'est frustrant mais c'est la réalité du marché.",
        "Les zones de stop hunting les plus courantes : juste en dessous des supports évidents, juste au-dessus des résistances évidentes, sous les chiffres ronds (99 900$ au lieu de 100 000$), et sous les creux récents visibles. Les market makers savent où les stops sont concentrés.",
        "Protection contre le stop hunting : (1) Placez votre SL légèrement au-delà du niveau évident (quelques ticks de marge). (2) Utilisez le SL ATR qui est basé sur la volatilité, pas sur les niveaux évidents. (3) Attendez la clôture du chandelier avant de considérer le SL touché (sur les TF élevés).",
        "Acceptez que le stop hunting fait partie du jeu. Votre SL sera parfois touché par un stop hunt avant que le prix ne parte dans votre direction. C'est le coût de la protection. Un SL touché occasionnellement par un stop hunt est infiniment préférable à pas de SL du tout.",
      ],
      keyPoints: [
        "Stop hunting = gros acteurs déclenchent les SL concentrés",
        "Zones courantes : sous supports, au-dessus résistances, chiffres ronds",
        "Protection : marge au-delà du niveau évident, SL ATR",
        "Accepter le stop hunting comme coût de la protection",
      ],
      proTips: ["Placez votre SL quelques ticks au-delà du niveau évident — la majorité des stop hunts ne dépassent pas de beaucoup le niveau"],
      commonMistakes: ["Enlever son SL après un stop hunt — c'est la pire réaction possible, le prochain mouvement pourrait être un vrai retournement"],
    },
    {
      title: "Gestion Dynamique du Stop Loss",
      content: [
        "Étape 1 — Entrée : SL initial au niveau technique (sous le HL, sous la zone de demand, ATR × 2). Étape 2 — Après 1R de profit : déplacez le SL au breakeven (prix d'entrée). Votre trade est maintenant un 'free trade' — vous ne pouvez plus perdre.",
        "Étape 3 — Après 2R de profit : déplacez le SL à 1R de profit (vous verrouillez un gain minimum). Prenez 33% de profits. Étape 4 — Au-delà de 2R : trailing stop à une distance de 1R ou ATR × 2 du prix actuel. Laissez courir les 67% restants.",
        "Cette gestion dynamique transforme un trade moyen en trade très profitable. Même si le trailing stop est touché à 2.5R au lieu d'atteindre le TP à 3R, vous avez sécurisé un excellent profit. La gestion du SL est aussi importante que le point d'entrée.",
        "Erreur fatale : déplacer le SL dans le MAUVAIS sens (plus loin de l'entrée) par espoir. Si le prix va contre vous et approche votre SL, c'est que votre analyse était incorrecte. Acceptez-le et coupez la perte. Déplacer le SL transforme une petite perte contrôlée en catastrophe potentielle.",
      ],
      keyPoints: [
        "Entrée : SL technique → 1R : breakeven → 2R : verrouiller 1R",
        "Au-delà de 2R : trailing stop à 1R ou ATR × 2",
        "Gestion dynamique = aussi importante que l'entrée",
        "JAMAIS déplacer le SL dans le mauvais sens",
      ],
      proTips: ["Le passage au breakeven après 1R est le moment le plus libérateur du trade — vous tradez sans stress car vous ne pouvez plus perdre"],
      commonMistakes: ["Déplacer le SL plus loin par espoir — c'est la cause #1 de pertes catastrophiques chez les traders"],
      exercise: "Sur vos 10 prochains trades (paper ou réel), appliquez la gestion dynamique du SL. Notez à quel R le trailing stop est touché. Comparez avec un SL fixe.",
    },
  ],
  quiz: [
    { question: "Le SL ATR s'adapte à :", options: ["La direction du prix", "La volatilité du marché", "Le volume", "L'heure"], correct: 1 },
    { question: "Après 1R de profit, le SL passe à :", options: ["Plus loin", "Breakeven", "On l'enlève", "On double la position"], correct: 1 },
    { question: "Le stop hunting est :", options: ["Illégal", "Une réalité du marché à accepter", "Impossible en crypto", "Uniquement sur le forex"], correct: 1 },
    { question: "Déplacer le SL dans le mauvais sens :", options: ["Est recommandé", "Est la cause #1 de pertes catastrophiques", "N'a pas d'impact", "Est une bonne stratégie"], correct: 1 },
  ],
};

const m9l4: Lesson = {
  id: "m9-l4",
  title: "Drawdown, Recovery et Gestion de Capital",
  icon: "📉",
  duration: "50 min",
  description: "Comprendre le drawdown, les mathématiques de la recovery et protéger votre capital.",
  subLessons: [
    {
      title: "Comprendre le Drawdown",
      content: [
        "Le drawdown est la baisse maximale de votre capital depuis un sommet. Si votre compte passe de 10 000$ à 8 000$ avant de remonter, votre drawdown est de 20%. Le max drawdown est le plus grand drawdown historique de votre compte — c'est une mesure cruciale de risque.",
        "Les mathématiques de la recovery sont impitoyables : après un drawdown de 10%, il faut un gain de 11% pour revenir à l'équilibre. Après 20%, il faut 25%. Après 30%, il faut 43%. Après 50%, il faut 100%. Après 75%, il faut 300%. Plus le drawdown est profond, plus la recovery est difficile.",
        "Objectif de max drawdown : 10-15% maximum pour un trader conservateur, 15-20% pour un trader modéré, 20-25% pour un trader agressif. Au-delà de 25%, la recovery devient très difficile et le stress psychologique est énorme.",
        "Le drawdown est inévitable — même les meilleurs traders du monde ont des drawdowns de 10-20%. La question n'est pas SI vous aurez un drawdown, mais QUAND et COMBIEN. Votre gestion du risque détermine la profondeur du drawdown, et votre discipline détermine la vitesse de recovery.",
      ],
      keyPoints: [
        "Drawdown = baisse depuis le sommet du capital",
        "Recovery : -10% → +11%, -20% → +25%, -50% → +100%",
        "Max drawdown cible : 10-15% conservateur, 20-25% agressif",
        "Le drawdown est inévitable — la gestion du risque limite sa profondeur",
      ],
      proTips: ["Surveillez votre max drawdown en temps réel — si vous approchez de votre limite, réduisez immédiatement la taille de vos positions"],
      commonMistakes: ["Ignorer le drawdown et continuer à trader normalement — un drawdown non contrôlé peut devenir catastrophique"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/f0265400-965c-410a-a7e7-9a6d9b1d8f84.png",
          alt: "Drawdown et Recovery",
          caption: "Mathématiques du drawdown : -10%→+11%, -20%→+25%, -50%→+100% pour revenir à l'équilibre"
        }
      ],
    },
    {
      title: "Stratégies de Recovery",
      content: [
        "Après un drawdown significatif (>10%), la première réaction doit être de RÉDUIRE la taille des positions, pas de l'augmenter. Réduisez à 50% de votre taille normale jusqu'à ce que vous ayez récupéré au moins la moitié du drawdown. Cela protège contre l'aggravation.",
        "Le revenge trading (augmenter la taille pour 'récupérer plus vite') est la réaction la plus destructrice possible. Après un drawdown, votre jugement est altéré par la frustration et le désespoir. Augmenter la taille dans cet état mental mène presque toujours à un drawdown encore plus profond.",
        "Plan de recovery structuré : (1) Pause de 24-48h (pas de trading). (2) Analyse objective de ce qui a causé le drawdown. (3) Réduction de la taille à 50%. (4) Retour aux setups de haute qualité uniquement (A et B). (5) Augmentation progressive de la taille quand 50% du drawdown est récupéré.",
        "Si le drawdown dépasse 25% de votre capital, considérez sérieusement de prendre une pause prolongée (1-2 semaines). Revenez au paper trading pour recalibrer votre stratégie. Il n'y a aucune honte à prendre du recul — c'est un signe de maturité et d'intelligence.",
      ],
      keyPoints: [
        "Après drawdown > 10% : réduire la taille à 50%",
        "Revenge trading = réaction la plus destructrice",
        "Plan structuré : pause → analyse → taille réduite → qualité",
        "Drawdown > 25% : pause prolongée et paper trading",
      ],
      proTips: ["La meilleure réponse à un drawdown est la RÉDUCTION, pas l'augmentation — c'est contre-intuitif mais mathématiquement optimal"],
      commonMistakes: ["Le revenge trading après un drawdown — c'est la spirale destructrice la plus courante en trading"],
    },
    {
      title: "Protection du Capital à Long Terme",
      content: [
        "Le capital est votre outil de travail — sans capital, pas de trading. La protection du capital est l'objectif #1, avant la rentabilité. Un trader qui survit 5 ans avec un capital intact a appris suffisamment pour devenir profitable. Un trader qui perd son capital en 6 mois n'a aucune chance.",
        "Règles de protection : (1) Risque max 1-2% par trade. (2) Max drawdown 20%. (3) Si drawdown > 15%, réduire la taille de 50%. (4) Si drawdown > 20%, arrêter et analyser. (5) Diversifier entre trading et investissement passif (DCA). (6) Ne jamais emprunter pour trader.",
        "La gestion de capital par paliers : quand votre capital augmente de 25%, augmentez votre risque en dollars proportionnellement. Quand votre capital diminue de 10%, réduisez votre risque. Cette approche accélère les gains en période favorable et freine les pertes en période difficile.",
        "Perspective à long terme : un rendement de 30-50% par an est excellent et durable. Cela signifie doubler votre capital tous les 2-3 ans. Avec la puissance des intérêts composés, 10 000$ à 40% par an = 28 925$ en 3 ans, 75 000$ en 5 ans, 289 000$ en 8 ans. La patience paie exponentiellement.",
      ],
      keyPoints: [
        "Capital = outil de travail, protection = objectif #1",
        "30-50% par an = excellent et durable",
        "Intérêts composés : 10k$ à 40%/an = 289k$ en 8 ans",
        "Réduire la taille en drawdown, augmenter en profit",
      ],
      proTips: ["Pensez en termes d'années, pas de jours — les intérêts composés transforment des rendements modestes en fortunes"],
      commonMistakes: ["Chercher des rendements de 100%+ par mois — c'est insoutenable et mène inévitablement à la perte totale du capital"],
    },
  ],
  quiz: [
    { question: "Après un drawdown de 50%, il faut :", options: ["50% de gain", "75% de gain", "100% de gain", "200% de gain"], correct: 2 },
    { question: "Après un drawdown > 10%, il faut :", options: ["Doubler la taille", "Réduire la taille à 50%", "Continuer normalement", "Arrêter définitivement"], correct: 1 },
    { question: "Le revenge trading est :", options: ["Une bonne stratégie de recovery", "La réaction la plus destructrice", "Recommandé par les pros", "Sans impact"], correct: 1 },
    { question: "Un rendement durable par an :", options: ["500%+", "200-300%", "30-50%", "5-10%"], correct: 2 },
  ],
};

export const module9Lessons: Lesson[] = [m9l1, m9l2, m9l3, m9l4];