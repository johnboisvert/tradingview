import { Lesson } from "./types";

const m7l1: Lesson = {
  id: "m7-l1",
  title: "Fondamentaux du Swing Trading",
  icon: "🔄",
  duration: "45 min",
  description: "Les bases du swing trading : capturer les mouvements sur plusieurs jours à semaines.",
  subLessons: [
    {
      title: "Qu'est-ce que le Swing Trading ?",
      content: [
        "Le swing trading capture les 'swings' (oscillations) du marché sur plusieurs jours à semaines. Les timeframes principaux sont le 4h et le daily. C'est compatible avec un emploi à temps plein car il ne nécessite que 30-60 minutes d'analyse par jour. Typiquement 5-15 trades par mois.",
        "Avantages majeurs : beaucoup moins de stress que le day trading ou le scalping, frais de trading minimaux (peu de trades), compatible avec une vie professionnelle et personnelle, capture les mouvements significatifs de 5-20%+. C'est le style de trading optimal pour la majorité des traders.",
        "Win rate typique : 40-50%, R:R de 1:2 à 1:3. La patience est la clé absolue — 80% du temps est passé à attendre le bon setup, 20% à trader. Les meilleurs swing traders sont des maîtres de la patience et de la discipline.",
        "Le swing trading est recommandé pour 80% des traders, qu'ils soient débutants ou expérimentés. Commencez par le swing trading avant d'explorer le day trading ou le scalping. Si vous ne pouvez pas être profitable en swing, vous ne le serez pas dans les styles plus rapides.",
      ],
      keyPoints: [
        "4h et daily, 5-15 trades/mois, 30-60 min/jour",
        "Compatible avec un emploi à temps plein",
        "R:R 1:2-1:3, win rate 40-50% = profitable",
        "80% attente, 20% trading — la patience est la clé",
      ],
      proTips: ["Le dimanche soir, analysez le weekly et identifiez 3-5 setups potentiels pour la semaine — c'est votre routine la plus importante"],
      commonMistakes: ["Trader trop souvent par impatience — la patience est la qualité la plus rentable en swing trading"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/810c3303-6b75-44db-b54f-2cf48568eaef.png",
          alt: "Swing Trading Overview",
          caption: "Le swing trading : capturer les oscillations du marché sur le daily et 4h avec patience et discipline"
        }
      ],
    },
    {
      title: "Avantages vs Autres Styles",
      content: [
        "Vs Day Trading : beaucoup moins de stress et de temps requis, moins de frais de trading, meilleur pour la santé mentale et physique, pas besoin de 2 écrans ni de connexion ultra-rapide. Vs Position Trading : plus d'opportunités de trading, feedback plus rapide sur vos décisions.",
        "Le swing trading est le meilleur compromis entre rendement potentiel et qualité de vie. Les meilleurs swing traders génèrent 30-100%+ par an avec seulement 1-2 heures de travail par jour. C'est un rendement que beaucoup de day traders n'atteignent pas malgré 8-10 heures quotidiennes.",
        "Le swing trading développe les compétences fondamentales de l'analyse technique (S/R, tendances, patterns, indicateurs) qui sont transférables à tous les autres styles. C'est la meilleure école de trading car le rythme plus lent permet une analyse réfléchie plutôt que des décisions impulsives.",
        "Si vous ne savez pas quel style de trading choisir, commencez par le swing trading. C'est le style le plus accessible, le plus forgiving (tolérant aux erreurs mineures), et le plus durable sur le long terme. La majorité des traders qui réussissent sur le long terme sont des swing traders.",
      ],
      keyPoints: [
        "Meilleur compromis rendement/qualité de vie",
        "30-100%+ par an possible avec 1-2h/jour",
        "Développe les compétences fondamentales transférables",
        "Recommandé pour 80% des traders — le style le plus durable",
      ],
      proTips: ["Si vous ne savez pas quel style choisir, commencez par le swing trading — c'est le plus accessible et le plus durable"],
      commonMistakes: ["Passer au day trading ou scalping avant de maîtriser le swing — vous brûlerez votre capital plus vite"],
    },
  ],
  quiz: [
    { question: "Timeframes principaux du swing trading :", options: ["1m-5m", "15m-1h", "4h-1D", "1W-1M"], correct: 2 },
    { question: "Le swing trading est compatible avec :", options: ["Uniquement le trading full-time", "Un emploi à temps plein", "Le scalping simultané", "Le HFT"], correct: 1 },
    { question: "Temps d'attente en swing trading :", options: ["10%", "50%", "80%", "100%"], correct: 2 },
    { question: "Le swing trading est recommandé pour :", options: ["10% des traders", "30% des traders", "50% des traders", "80% des traders"], correct: 3 },
  ],
};

const m7l2: Lesson = {
  id: "m7-l2",
  title: "Identifier les Swings avec l'AT",
  icon: "📈",
  duration: "50 min",
  description: "Utiliser l'analyse technique pour identifier les points de swing optimaux.",
  subLessons: [
    {
      title: "Structure de Swing",
      content: [
        "Un swing haussier se compose d'un Higher Low (HL) suivi d'un Higher High (HH). Le HL est votre point d'entrée potentiel — c'est le creux du pullback. Le HH est votre objectif de prix. En tendance haussière, chaque HL est une opportunité d'achat.",
        "Identifiez les swings sur le daily : marquez chaque HH, HL, LH (Lower High) et LL (Lower Low). La séquence de ces points vous montre clairement la tendance. Tradez UNIQUEMENT dans la direction de la séquence — HH/HL = long, LH/LL = short ou pas de trade.",
        "Le pivot de swing est le point exact où le prix change de direction. Les pivots qui se forment aux niveaux de confluence (S/R horizontal + retracement Fibonacci + EMA) sont les plus fiables et offrent le meilleur rapport risque/récompense.",
        "Utilisez le weekly pour identifier la direction de la tendance majeure, le daily pour repérer les swings et les niveaux clés, et le 4h pour affiner le timing de votre entrée. Cette approche multi-timeframe est la clé du swing trading profitable.",
      ],
      keyPoints: [
        "Swing haussier : HL → HH, le HL est le point d'entrée",
        "Marquer HH, HL, LH, LL sur le daily pour voir la tendance",
        "Trader uniquement dans la direction de la séquence",
        "Pivots aux confluences (S/R + Fib + EMA) = les plus fiables",
      ],
      proTips: ["Utilisez le weekly pour la direction, le daily pour les swings, le 4h pour le timing — cette hiérarchie est non négociable"],
      commonMistakes: ["Trader contre la séquence de swings — si la structure montre LH/LL, ne cherchez pas à acheter"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/3f7db08d-0fec-40a7-be30-db1c3a9d319c.png",
          alt: "Structure de Swing HH/HL",
          caption: "Structure de swing : Higher Highs (HH) et Higher Lows (HL) en tendance haussière avec points d'entrée"
        }
      ],
    },
    {
      title: "Zones d'Entrée Optimales",
      content: [
        "Zone d'entrée #1 — Pullback EMA : tendance haussière confirmée → pullback vers l'EMA 21 daily + retracement Fibonacci 38.2-50% + chandelier de retournement (hammer, engulfing). C'est le setup le plus fiable et reproductible en swing trading.",
        "Zone d'entrée #2 — Retest de breakout : cassure d'une structure (résistance, triangle, range) avec volume → le prix revient tester le niveau cassé → chandelier de retournement au retest → entrée. Le retest confirme que le niveau cassé tient comme nouveau support.",
        "Zone d'entrée #3 — Zone de demand fraîche : rebond sur une zone de demand jamais retestée, alignée avec la tendance du weekly. Zone d'entrée #4 — Golden Pocket : retracement Fibonacci 61.8-65% avec divergence RSI haussière — c'est la zone de rebond statistiquement la plus probable.",
        "Classez vos setups par qualité : A (3+ confluences, aligné avec le weekly), B (2 confluences, aligné avec le daily), C (1 confluence). Ne tradez que les setups A et B. Les setups C ne valent pas le risque — la patience d'attendre un setup A est toujours récompensée.",
      ],
      keyPoints: [
        "Pullback EMA 21 + Fib 38-50% = setup #1 le plus fiable",
        "Retest de breakout avec chandelier de retournement",
        "Golden Pocket (Fib 61.8-65%) + divergence RSI = très fort",
        "Setups A (3+ confluences) uniquement — pas de compromis",
      ],
      proTips: ["Ne tradez que les setups de qualité A avec 3+ confluences — un seul bon trade par semaine suffit pour être très profitable"],
      commonMistakes: ["Prendre des setups de qualité C par impatience — ils ont un taux de réussite trop faible pour justifier le risque"],
    },
    {
      title: "Gestion des Trades en Swing",
      content: [
        "Entrée : ordre Limit au niveau identifié, avec SL et TP pré-définis. SL : sous le dernier HL (en tendance haussière) ou sous la zone de demand, avec une marge de quelques pourcentages pour le bruit. TP : prochain HH ou extension Fibonacci.",
        "Gestion active : déplacez le SL au breakeven (prix d'entrée) quand le trade atteint 1R de profit. Prenez 33% de profits à TP1, 33% à TP2, laissez 34% courir avec un trailing stop. Cette approche sécurise des gains tout en capturant les mouvements prolongés.",
        "Patience pendant le trade : un swing trade peut prendre 3-14 jours pour atteindre son objectif. Ne vérifiez pas le prix toutes les 5 minutes — cela génère du stress inutile et vous pousse à sortir prématurément. Vérifiez 2-3 fois par jour maximum.",
        "Quand couper un trade avant le TP : si la structure du marché change (CHoCH sur le daily), si un événement macro majeur inattendu se produit, ou si le prix stagne pendant 5+ jours sans progression. Un trade qui ne progresse pas consomme du capital et de l'énergie mentale.",
      ],
      keyPoints: [
        "SL sous le dernier HL ou la zone de demand",
        "Breakeven après 1R, TP partiels 33%/33%/34%",
        "Vérifier le prix 2-3 fois/jour maximum — pas plus",
        "Couper si CHoCH, événement macro, ou stagnation 5+ jours",
      ],
      proTips: ["Déplacez le SL au breakeven après 1R — cela transforme le trade en 'free trade' sans risque"],
      commonMistakes: ["Vérifier le prix toutes les 5 minutes en swing trading — cela génère du stress et des sorties prématurées"],
    },
  ],
  quiz: [
    { question: "Le point d'entrée en swing haussier est :", options: ["Le Higher High", "Le Higher Low", "Le Lower Low", "Le Lower High"], correct: 1 },
    { question: "Un setup de qualité A nécessite :", options: ["1 confluence", "2 confluences", "3+ confluences", "Pas de confluence"], correct: 2 },
    { question: "Quand déplacer le SL au breakeven :", options: ["Immédiatement après l'entrée", "Après 1R de profit", "Jamais", "Après 1 semaine"], correct: 1 },
    { question: "Fréquence de vérification du prix en swing :", options: ["Toutes les 5 minutes", "Toutes les heures", "2-3 fois par jour", "1 fois par semaine"], correct: 2 },
  ],
};

const m7l3: Lesson = {
  id: "m7-l3",
  title: "Stratégies de Swing Trading",
  icon: "🎯",
  duration: "55 min",
  description: "Pullback, Breakout, Mean Reversion — les stratégies de swing les plus efficaces.",
  subLessons: [
    {
      title: "Stratégie Pullback en Tendance",
      content: [
        "La stratégie de pullback est le pain quotidien du swing trader. Processus : (1) Identifiez la tendance sur le weekly (EMA 21 > EMA 50 > EMA 200 = haussier). (2) Attendez un pullback sur le daily vers l'EMA 21 ou le Fibonacci 38.2-61.8%. (3) Cherchez une confirmation sur le 4h (chandelier de retournement + volume).",
        "Entrée : ordre Limit au niveau de confluence ou entrée sur confirmation du chandelier de retournement. SL : sous le creux du pullback (avec marge ATR). TP1 : précédent sommet. TP2 : extension Fibonacci 161.8%. R:R minimum 1:2.",
        "Les meilleurs pullbacks se produisent après un mouvement impulsif fort (grand chandelier vert avec volume élevé) suivi d'un retracement progressif avec volume décroissant. Le volume décroissant pendant le pullback confirme que c'est une correction temporaire, pas un retournement.",
        "Filtres de qualité : (1) Tendance weekly claire et haussière. (2) Pullback vers un niveau de confluence (EMA + Fib + S/R). (3) Volume décroissant pendant le pullback. (4) RSI qui revient en zone 40-50 (pas en survente extrême). (5) Pas d'événement macro imminent.",
      ],
      keyPoints: [
        "Weekly pour la direction, daily pour le pullback, 4h pour le timing",
        "Pullback vers EMA 21 ou Fib 38-61% avec volume décroissant",
        "Chandelier de retournement + volume = confirmation d'entrée",
        "R:R minimum 1:2, TP au précédent sommet ou Fib extension",
      ],
      proTips: ["Le pullback avec volume décroissant vers l'EMA 21 daily est le setup le plus fiable en swing trading — maîtrisez-le parfaitement"],
      commonMistakes: ["Entrer dans le pullback trop tôt sans attendre la confirmation — le pullback peut continuer et devenir un retournement"],
      images: [
        {
          src: "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-22/8c2c8456-0127-475f-a792-f56e8d372e66.png",
          alt: "Pullback en Swing Trading",
          caption: "Stratégie pullback : entrée sur retracement vers EMA 21 avec confluence Fibonacci et volume décroissant"
        }
      ],
    },
    {
      title: "Stratégie Breakout de Structure",
      content: [
        "Le breakout de structure se produit quand le prix casse un niveau significatif (résistance majeure, ligne de tendance, triangle) avec volume et conviction. C'est un signal que l'équilibre entre acheteurs et vendeurs a changé de manière significative.",
        "Processus : (1) Identifiez la consolidation ou le range sur le daily. (2) Attendez la cassure avec un volume 2x+ supérieur à la moyenne. (3) Attendez le retest du niveau cassé (le prix revient tester l'ancienne résistance devenue support). (4) Entrez sur le retest avec confirmation.",
        "Le retest est la clé de la stratégie breakout en swing trading. Il confirme que le niveau cassé tient, offre un meilleur prix d'entrée que la cassure elle-même, et permet un SL plus serré (juste sous le niveau retesté). Environ 60-70% des breakouts valides sont suivis d'un retest.",
        "Objectif de prix : la hauteur du range/triangle/pattern projetée depuis le point de cassure, ou l'extension Fibonacci 161.8%. SL : sous le niveau retesté. Durée typique du trade : 1-4 semaines selon la taille du pattern cassé.",
      ],
      keyPoints: [
        "Cassure avec volume 2x+ = signal de changement d'équilibre",
        "Retest du niveau cassé = meilleur point d'entrée (60-70% des cas)",
        "SL sous le niveau retesté, TP = hauteur du pattern projetée",
        "Durée typique : 1-4 semaines",
      ],
      proTips: ["Attendez TOUJOURS le retest en swing trading — l'entrée au retest offre un meilleur prix et un R:R supérieur"],
      commonMistakes: ["Entrer au moment de la cassure par FOMO — le retest offre une entrée plus sûre et plus rentable"],
    },
    {
      title: "Stratégie Mean Reversion",
      content: [
        "La mean reversion exploite la tendance du prix à revenir vers sa moyenne après un mouvement extrême. Quand le prix s'éloigne significativement de l'EMA 50 ou de la SMA 200, il a tendance à y revenir. C'est un phénomène statistiquement prouvé sur tous les marchés.",
        "Signal d'entrée : prix éloigné de 2+ écarts-types de la moyenne (au-delà des Bollinger Bands), RSI en zone extrême (<25 ou >75), volume de capitulation (spike de volume avec chandelier de rejet). Entrée : chandelier de retournement après le mouvement extrême.",
        "Cette stratégie fonctionne mieux en range et en conditions de marché normales. En tendance très forte (bull run ou crash), le prix peut rester éloigné de la moyenne pendant longtemps — la mean reversion peut être dangereuse dans ces conditions.",
        "Gestion du risque : SL au-delà de l'extrême récent (au cas où le mouvement continue). TP : retour vers la moyenne (EMA 50 ou SMA 200). R:R typique 1:2 à 1:3. Taille de position réduite (0.5-1% de risque) car ces trades sont contre-tendance.",
      ],
      keyPoints: [
        "Le prix revient vers sa moyenne après un mouvement extrême",
        "Signal : prix > 2 écarts-types + RSI extrême + volume de capitulation",
        "Fonctionne mieux en range, dangereux en tendance forte",
        "Taille réduite car contre-tendance — risque 0.5-1%",
      ],
      proTips: ["La mean reversion est plus fiable sur le daily et le weekly — les petits timeframes sont trop bruités pour cette stratégie"],
      commonMistakes: ["Appliquer la mean reversion en tendance forte — le prix peut rester 'extrême' beaucoup plus longtemps que votre capital ne peut supporter"],
      exercise: "Identifiez 5 opportunités de swing trading (pullback, breakout ou mean reversion) sur BTC et ETH cette semaine. Notez l'entrée théorique, le SL, le TP et le R:R. Suivez les résultats sans trader réellement.",
    },
  ],
  quiz: [
    { question: "Le setup le plus fiable en swing trading :", options: ["Breakout sans retest", "Pullback vers EMA 21 avec confluence", "Mean reversion en tendance forte", "Trade aléatoire"], correct: 1 },
    { question: "Pourcentage de breakouts suivis d'un retest :", options: ["10-20%", "30-40%", "60-70%", "90-100%"], correct: 2 },
    { question: "La mean reversion est dangereuse en :", options: ["Range", "Conditions normales", "Tendance très forte", "Faible volatilité"], correct: 2 },
    { question: "R:R minimum en swing trading :", options: ["1:0.5", "1:1", "1:2", "1:5"], correct: 2 },
  ],
};

const m7l4: Lesson = {
  id: "m7-l4",
  title: "Swing Trading Multi-Timeframe",
  icon: "⏱️",
  duration: "45 min",
  description: "L'analyse multi-timeframe appliquée au swing trading pour maximiser les résultats.",
  subLessons: [
    {
      title: "La Méthode des 3 Timeframes",
      content: [
        "Timeframe de tendance (Weekly) : identifie la direction majeure du marché. Si le weekly est haussier (HH/HL, prix > EMA 200), vous ne cherchez que des positions longues. Si le weekly est baissier, vous ne cherchez que des shorts ou vous restez en cash.",
        "Timeframe de signal (Daily) : identifie les setups de trading. C'est ici que vous repérez les pullbacks, breakouts, patterns de chandeliers et divergences. Le daily est votre timeframe principal de décision — tous vos niveaux clés sont tracés ici.",
        "Timeframe d'entrée (4h) : affine le timing de votre entrée pour un meilleur prix et un SL plus serré. Quand le daily montre un setup, descendez sur le 4h pour trouver le chandelier de retournement exact et placer votre ordre avec précision.",
        "Cette hiérarchie est non négociable : Weekly → Daily → 4h. Ne remontez JAMAIS la hiérarchie (ne laissez pas le 4h contredire le weekly). Si les 3 timeframes sont alignés dans la même direction, la probabilité de succès est maximale.",
      ],
      keyPoints: [
        "Weekly = direction, Daily = signal, 4h = timing d'entrée",
        "Ne trader que dans la direction du weekly",
        "Daily = timeframe principal de décision",
        "3 TF alignés = probabilité de succès maximale",
      ],
      proTips: ["Si les 3 timeframes ne sont pas alignés, ne tradez pas — attendez l'alignement, c'est la patience la plus rentable"],
      commonMistakes: ["Laisser le 4h contredire le weekly — le timeframe supérieur a TOUJOURS la priorité"],
    },
    {
      title: "Confluence Multi-Timeframe",
      content: [
        "La confluence multi-timeframe se produit quand un niveau technique est visible et significatif sur plusieurs timeframes simultanément. Un support visible sur le weekly ET le daily ET le 4h est infiniment plus fort qu'un support visible uniquement sur le 4h.",
        "Exemple de confluence parfaite : support weekly à 90 000$ + EMA 50 daily à 90 200$ + Fibonacci 61.8% du dernier swing à 89 800$ + zone de demand 4h à 89 500-90 500$. Cette zone de 89 500-90 500$ est un mur de support multi-timeframe — la probabilité de rebond est très élevée.",
        "Les divergences multi-timeframe sont particulièrement puissantes : divergence RSI haussière sur le daily + divergence RSI haussière sur le 4h au même niveau = signal de retournement de très haute probabilité. C'est un signal rare mais extrêmement fiable.",
        "Créez une checklist de confluence pour chaque trade : (1) Direction weekly ✓ (2) Setup daily ✓ (3) Timing 4h ✓ (4) Volume de confirmation ✓ (5) Indicateur de confirmation (RSI, MACD) ✓. Minimum 4/5 pour prendre le trade.",
      ],
      keyPoints: [
        "Niveau visible sur 3 TF = beaucoup plus fort que sur 1 TF",
        "Divergences multi-TF = signal rare mais très fiable",
        "Checklist de confluence : minimum 4/5 critères validés",
        "Plus de confluences = plus de probabilité de succès",
      ],
      proTips: ["Créez une checklist de confluence et ne prenez un trade que si 4/5 critères sont validés — cela élimine les trades de mauvaise qualité"],
      commonMistakes: ["Prendre un trade basé sur un seul timeframe sans vérifier les autres — vous manquez le contexte essentiel"],
    },
    {
      title: "Routine Hebdomadaire du Swing Trader",
      content: [
        "Dimanche soir (1h) — Analyse hebdomadaire : (1) Revue du weekly BTC, ETH et 3-5 altcoins de votre watchlist. (2) Identification de la tendance et de la phase du cycle. (3) Marquage des niveaux clés weekly. (4) Identification de 3-5 setups potentiels pour la semaine.",
        "Chaque soir en semaine (15-20 min) — Revue quotidienne : (1) Vérification des positions ouvertes. (2) Mise à jour des niveaux clés sur le daily. (3) Vérification si un setup identifié dimanche se développe. (4) Placement ou ajustement des ordres Limit pour le lendemain.",
        "Vendredi soir (30 min) — Revue de la semaine : (1) Analyse de tous les trades de la semaine. (2) Calcul des métriques (win rate, R:R, P&L). (3) Identification des erreurs et des leçons. (4) Mise à jour du journal de trading. (5) Préparation mentale pour la semaine suivante.",
        "Cette routine totalise environ 3-4 heures par semaine — c'est tout ce qu'il faut pour un swing trading profitable. Comparez avec les 40-60 heures par semaine du day trading. Le swing trading est le style le plus efficient en termes de temps investi par rapport au rendement potentiel.",
      ],
      keyPoints: [
        "Dimanche soir : analyse weekly complète (1h)",
        "Chaque soir : revue quotidienne rapide (15-20 min)",
        "Vendredi : revue hebdomadaire et journal (30 min)",
        "Total : 3-4 heures par semaine = très efficient",
      ],
      proTips: ["La routine du dimanche soir est la plus importante de la semaine — ne la sautez jamais, c'est votre avantage compétitif"],
      commonMistakes: ["Vérifier les graphiques 20 fois par jour en swing trading — cela génère du stress inutile et des décisions impulsives"],
      exercise: "Suivez cette routine pendant 4 semaines. Documentez chaque session d'analyse et chaque trade. Comparez vos résultats avec et sans routine structurée.",
    },
  ],
  quiz: [
    { question: "Le timeframe de tendance en swing trading :", options: ["1h", "4h", "Daily", "Weekly"], correct: 3 },
    { question: "Temps total par semaine pour le swing trading :", options: ["1h", "3-4h", "20h", "40h"], correct: 1 },
    { question: "La routine la plus importante est :", options: ["Lundi matin", "Mercredi midi", "Dimanche soir", "Vendredi après-midi"], correct: 2 },
    { question: "Minimum de critères de confluence pour trader :", options: ["1/5", "2/5", "4/5", "5/5"], correct: 2 },
  ],
};

export const module7Lessons: Lesson[] = [m7l1, m7l2, m7l3, m7l4];