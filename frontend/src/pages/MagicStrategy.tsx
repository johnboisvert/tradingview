import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import {
  Waves,
  Shield,
  Coins,
  GitBranch,
  Compass,
  Sparkles,
  Brain,
  CheckCircle2,
  Clock,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────── */

interface IndicatorScreenshot {
  src: string;
  caption: string;
}

interface Indicator {
  id: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  accent: {
    badge: string;
    title: string;
    border: string;
    glow: string;
    check: string;
  };
  description: string[];
  features: string[];
  dashboard?: string[];
  timeframes?: string;
  screenshots: IndicatorScreenshot[];
  ready: boolean;
}

/* ─────────────────────────────────────────────────────────────
 * Accent palettes
 * ──────────────────────────────────────────────────────────── */

const ACCENTS = {
  cyan: {
    badge: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
    title: "from-cyan-300 via-teal-300 to-emerald-300",
    border: "border-cyan-400/20 hover:border-cyan-400/50",
    glow: "bg-cyan-500/20",
    check: "text-cyan-300",
  },
  violet: {
    badge: "border-violet-400/30 bg-violet-500/10 text-violet-200",
    title: "from-violet-300 via-fuchsia-300 to-pink-300",
    border: "border-violet-400/20 hover:border-violet-400/50",
    glow: "bg-violet-500/20",
    check: "text-violet-300",
  },
  emerald: {
    badge: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    title: "from-emerald-300 via-teal-300 to-cyan-300",
    border: "border-emerald-400/20 hover:border-emerald-400/50",
    glow: "bg-emerald-500/20",
    check: "text-emerald-300",
  },
  amber: {
    badge: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    title: "from-amber-300 via-orange-300 to-rose-300",
    border: "border-amber-400/20 hover:border-amber-400/50",
    glow: "bg-amber-500/20",
    check: "text-amber-300",
  },
  sky: {
    badge: "border-sky-400/30 bg-sky-500/10 text-sky-200",
    title: "from-sky-300 via-blue-300 to-indigo-300",
    border: "border-sky-400/20 hover:border-sky-400/50",
    glow: "bg-sky-500/20",
    check: "text-sky-300",
  },
  rose: {
    badge: "border-rose-400/30 bg-rose-500/10 text-rose-200",
    title: "from-rose-300 via-pink-300 to-fuchsia-300",
    border: "border-rose-400/20 hover:border-rose-400/50",
    glow: "bg-rose-500/20",
    check: "text-rose-300",
  },
  lime: {
    badge: "border-lime-400/30 bg-lime-500/10 text-lime-200",
    title: "from-lime-300 via-emerald-300 to-teal-300",
    border: "border-lime-400/20 hover:border-lime-400/50",
    glow: "bg-lime-500/20",
    check: "text-lime-300",
  },
  fuchsia: {
    badge: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200",
    title: "from-fuchsia-300 via-violet-300 to-cyan-300",
    border: "border-fuchsia-400/20 hover:border-fuchsia-400/50",
    glow: "bg-fuchsia-500/20",
    check: "text-fuchsia-300",
  },
} as const;

/* ─────────────────────────────────────────────────────────────
 * Indicators data
 * ──────────────────────────────────────────────────────────── */

const INDICATORS: Indicator[] = [
  {
    id: "riskglow",
    name: "RiskGlow",
    tagline: "Tendance et risque visuels en un coup d'œil",
    icon: Shield,
    accent: ACCENTS.cyan,
    description: [
      "RiskGlow Full Display est un indicateur de tendance et de risque visuel basé sur plusieurs moyennes mobiles lissées. Il utilise notamment des courbes de type HMA, JMA, WMA ainsi que des moyennes rapides et lentes.",
      "Les courbes turquoise représentent une structure haussière, tandis que les courbes rouges représentent une structure baissière.",
      "L'objectif est de montrer rapidement : la direction dominante, le changement de tendance, la distance du prix par rapport à une entrée potentielle, le niveau de risque et la volatilité mesurée par l'ATR.",
      "Les signaux ont été filtrés pour éviter les répétitions inutiles et les erreurs produites par certaines conditions booléennes.",
    ],
    features: [
      "Tendance haussière ou baissière",
      "Rubans de moyennes mobiles (HMA, JMA, WMA)",
      "Signaux d'achat et de vente",
      "Filtre ATR",
      "Prévention des signaux répétés",
      "Tableau de risque intégré",
    ],
    dashboard: [
      "Niveau de risque (Risk Level)",
      "Proximité d'une entrée (Entry Distance)",
      "Percentile de volatilité (ATR %ile)",
      "Valeur de l'ATR",
    ],
    timeframes: "15 min, 1 h et 4 h",
    screenshots: [
      {
        src: "/indicators/riskglow-1.png",
        caption: "ETH/USDT 15m — Rubans turquoise (haussier) / rouge (baissier) avec tableau de risque.",
      },
      {
        src: "/indicators/riskglow-2.png",
        caption: "ZEC/USDT 1h — Changements de tendance et signaux filtrés sur timeframe supérieur.",
      },
    ],
    ready: true,
  },
  {
    id: "waverider",
    name: "WaveRider Divergence Oscillator",
    tagline: "Détectez les changements de momentum avant qu'ils soient visibles sur le prix",
    icon: Waves,
    accent: ACCENTS.sky,
    description: [
      "WaveRider v2.4.2 est un oscillateur avancé conçu pour détecter les divergences entre le prix et le momentum du marché. Son objectif est d'identifier les zones où la force réelle du mouvement commence à changer avant que ce changement soit clairement visible sur le graphique des prix.",
      "L'indicateur combine un moteur WaveTrend, une analyse des pivots confirmés, une comparaison multi-pivots et une adaptation automatique selon le timeframe. Il peut être utilisé sur les cryptomonnaies, les actions, le Forex et les indices.",
      "4 types de divergences : haussière régulière (R vert — la pression vendeuse s'affaiblit, rebond possible), baissière régulière (R rouge — la pression acheteuse s'affaiblit, correction possible), haussière cachée (H bleu — continuation potentielle de la tendance haussière) et baissière cachée (H jaune — continuation potentielle de la tendance baissière).",
      "Moteur multi-pivots : contrairement aux oscillateurs classiques qui comparent uniquement le pivot actuel avec le précédent, WaveRider peut comparer le pivot actuel avec plusieurs pivots précédents (ex. 3/3 · L3). Cette logique retrouve des divergences importantes qui auraient été bloquées par un petit mouvement intermédiaire.",
      "Adaptation automatique aux timeframes : Scalp strict (1-5 min), Intraday strict (15 min), Intraday équilibré (30 min-1 h), Swing équilibré (2 h-4 h) et Macro divergence (Daily/Weekly). Les paramètres de pivots s'ajustent automatiquement pour réduire le bruit.",
      "3 modes de détection : Broad (plus de divergences, plus sensible au bruit), Standard (bon équilibre pour une utilisation générale) et Extreme only (uniquement dans les zones extrêmes de surachat/survente — moins de signaux mais plus sélectifs).",
      "Filtrage de qualité : Minimum Oscillator Difference (écart minimal entre pivots de l'oscillateur), Minimum Price Difference en ATR (adaptation automatique à la volatilité de chaque actif) et Previous Pivots to Compare (profondeur d'analyse).",
      "Signaux BUY et SELL stricts : divergence confirmée + zone de qualité suffisante + confirmation WaveTrend + momentum aligné + sortie de zone extrême confirmée + bougie clôturée + setup non expiré. Un seul signal est autorisé par divergence ; une divergence opposée peut annuler le setup précédent.",
      "Lecture des courbes : ligne rapide au-dessus de la lente = momentum haussier ; en dessous = baissier. Le nuage central représente l'équilibre du momentum autour de la zone neutre.",
      "Utilisation recommandée : WaveRider est un outil de confirmation, non un système autonome. Une divergence est plus intéressante près des supports/résistances, zones de liquidité, bornes de canal, moyennes mobiles importantes, niveaux Fibonacci, changements de structure ou confirmations d'un timeframe supérieur.",
      "Réglages stables recommandés : Automatic Timeframe Profile ON, Profile Strength Balanced, Detection Standard, Previous Pivots 3, Min Oscillator Difference 2.0, Min Price Difference 0.10 ATR, divergences régulières et cachées ON, BUY/SELL Require Confirmed Divergence ON, Require Exit From Extreme Zone ON.",
      "Important : les pivots sont confirmés après plusieurs bougies — ce léger délai évite les pivots non confirmés et réduit le repainting. WaveRider ne prédit pas avec certitude les retournements : une divergence indique une perte ou un changement de momentum, mais le prix peut continuer dans sa direction avant de réagir.",
    ],
    features: [
      "Divergences régulières et cachées (R vert/rouge, H bleu/jaune)",
      "Moteur WaveTrend + pivots confirmés",
      "Comparaison multi-pivots (jusqu'à 3 pivots précédents)",
      "Adaptation automatique au timeframe (scalp → macro)",
      "3 modes : Broad, Standard, Extreme only",
      "Filtres de qualité (oscillateur + ATR)",
      "Signaux BUY / SELL confirmés à la clôture",
      "6 alertes disponibles (Once Per Bar Close recommandé)",
      "Anti-repainting (pivots confirmés)",
      "Crypto, actions, Forex et indices",
    ],
    dashboard: [
      "Timeframe",
      "Profil actif",
      "Taille des pivots",
      "Profondeur de comparaison multi-pivots",
      "Mode de détection utilisé",
    ],
    timeframes: "1 min au Weekly (profils automatiques)",
    screenshots: [
      {
        src: "/indicators/waverider-1.png",
        caption: "BTC/USDT 15m — Divergences cachées (H jaune) et régulières avec signaux confirmés sur l'oscillateur.",
      },
      {
        src: "/indicators/waverider-2.png",
        caption: "BTC/USDT 1h — Divergences R rouges au sommet et H bleues, nuage de momentum et signal GOLD.",
      },
      {
        src: "/indicators/waverider-3.png",
        caption: "SUI/USDT 4h — Profil Swing balance (pivots 3/3 · L3) avec mini-dashboard automatique.",
      },
      {
        src: "/indicators/waverider-4.png",
        caption: "LINK/USDT 15m — Profil Intraday strict (pivots 4/4 · L3) : lignes de divergence tracées sur l'oscillateur.",
      },
    ],
    ready: true,
  },
  {
    id: "goodguys",
    name: "GoodGuys Spot Daily",
    tagline: "Investissement spot long terme avec DCA automatique",
    icon: Coins,
    accent: ACCENTS.amber,
    description: [
      "GoodGuys Spot Daily est un indicateur conçu pour l'investissement spot à long terme, principalement sur le graphique journalier.",
      "Son objectif est d'aider l'investisseur à : acheter sur des replis structurés, accumuler progressivement avec une méthode DCA, suivre son prix moyen, prendre des profits partiels et protéger les gains avec une sortie dynamique.",
      "Les signaux Good Buy et Good Sell proviennent de pivots journaliers confirmés. Les achats peuvent être filtrés par : l'EMA50, l'EMA200, la tendance long terme, le RSI ou un régime haussier uniquement.",
      "Le module DCA permet plusieurs méthodes : DCA temporel, DCA basé sur le prix, DCA hybride ou DCA désactivé.",
      "L'indicateur contient également un tableau multi-timeframe pour les tendances 1D, 3D et 1W.",
    ],
    features: [
      "Good Buy et Good Sell (pivots confirmés)",
      "DCA automatique (temporel, prix, hybride)",
      "Prix moyen et suivi du PnL",
      "TP1, TP2 et TP3",
      "Trailing stop",
      "Protection EMA200",
      "Verrouillage des gains",
      "Tableau MTF (1D, 3D, 1W)",
      "Alertes structurées",
      "Conçu pour le Daily",
    ],
    dashboard: [
      "Capital total contribué",
      "Capital récupéré",
      "Coût de la position",
      "Valeur actuelle de la position",
      "Unités accumulées",
      "Prix moyen",
      "PnL réalisé",
      "PnL latent",
      "Rendement global",
    ],
    timeframes: "graphique journalier (Daily)",
    screenshots: [
      {
        src: "/indicators/goodguys-1.png",
        caption: "ETH/USDT 1D — Signaux Good Buy / Good Sell avec DCA Auto Hybride et tableau de suivi complet.",
      },
      {
        src: "/indicators/goodguys-2.png",
        caption: "BTC/USDT 1D — Pivots confirmés et tableau multi-timeframe 1D / 3D / 1W.",
      },
      {
        src: "/indicators/goodguys-3.png",
        caption: "XRP/USDT 1D — Accumulation DCA avec prix moyen, PnL réalisé et rendement global.",
      },
      {
        src: "/indicators/goodguys-4.png",
        caption: "ESPORTS/USDT 1D — Suivi de position spot : unités accumulées, trailing et verrouillage des gains.",
      },
    ],
    ready: true,
  },
  {
    id: "divergx",
    name: "DivergX One",
    tagline: "Structure de marché, zones Premium/Discount et Fibonacci en intraday",
    icon: GitBranch,
    accent: ACCENTS.rose,
    description: [
      "DivergX One est un indicateur intraday combinant : structure de marché, zones Premium et Discount, niveaux de Fibonacci, sessions de marché, tendances multi-timeframes, signaux vectoriels et signaux de tendance.",
      "Il détecte les principales structures : HH (Higher High), HL (Higher Low), LH (Lower High), LL (Lower Low), BOS (Break of Structure) et CHoCH (Change of Character).",
      "L'indicateur construit une zone Premium dans la partie supérieure du dernier mouvement et une zone Discount dans la partie inférieure.",
      "Il affiche aussi les niveaux de retracement et d'extension, notamment : 0, 0,236, 0,382, 0,5, 0,618, 0,65, 0,786, 1 ainsi que les extensions supérieures et inférieures.",
      "L'affichage a été nettoyé pour réduire les anciennes zones, les anciennes lignes et les signaux répétés.",
    ],
    features: [
      "Structure de marché (HH, HL, LH, LL)",
      "BOS et CHoCH",
      "Premium Zone et Discount Zone",
      "Niveaux Fibonacci (retracements + extensions)",
      "Sessions Asie, Londres et New York",
      "Trend Buy et Trend Sell",
      "Vector Buy et Vector Sell",
      "Tendances MTF",
      "Zones d'offre et de demande",
      "Nettoyage automatique des anciens objets",
    ],
    dashboard: [
      "Session actuelle",
      "Tendance BTC 4 h",
      "Tendance 15 min",
      "Tendance 1 h",
      "Tendance 4 h",
      "Tendance journalière",
    ],
    timeframes: "trading intraday (15 min à 1 h)",
    screenshots: [
      {
        src: "/indicators/divergx-1.png",
        caption: "ESPORTS/USDT 15m — Premium/Discount Zones, niveaux Fibonacci, signaux Trend Buy/Sell et tableau MTF.",
      },
      {
        src: "/indicators/divergx-2.png",
        caption: "TAO/USDT 1h — Structure de marché (LH, LL, BOS), zones d'offre/demande et tendances multi-timeframes.",
      },
    ],
    ready: true,
  },
  {
    id: "vector-confluence",
    name: "Confluence Pro™",
    tagline: "Bâtissez votre propre stratégie avec la confluence modulaire",
    icon: Compass,
    accent: ACCENTS.violet,
    description: [
      "Confluence Pro est un indicateur modulaire de confluence destiné au trading intraday. Il permet d'activer ou désactiver différents modules techniques afin de bâtir une confirmation personnalisée. Faites votre propre stratégie !",
      "Les modules disponibles peuvent inclure : Volume, MACD, RSI, bandes de Bollinger, MA50 et MA200, support et résistance, stochastique, ADX/DMI, Ichimoku, Donchian, PSAR, Price Action, Reversal et Vector.",
      "Les marqueurs de structure indiquent : HH, HL, LH et LL. Les signaux BUY et SELL ont été rendus plus visibles en séparant leur affichage des marqueurs de structure.",
      "Les lignes de support et de résistance ont également été corrigées afin d'éviter les erreurs de distance maximale liées au bar_index.",
    ],
    features: [
      "Système modulaire (14 modules activables)",
      "Confluence multi-indicateurs",
      "Structure de marché (HH, HL, LH, LL)",
      "Signaux BUY et SELL lisibles",
      "Support et résistance",
      "Bandes de Bollinger",
      "Moyennes mobiles (MA50/MA200)",
      "Tableau de modules",
      "Filtres activables",
      "Compatibilité 15 min et 1 h",
    ],
    dashboard: [
      "Modules activés et état haussier/baissier de chacun",
      "Modules actifs et confirmations Bull/Bear",
      "Stratégie en cours (BUY/SELL complet)",
      "Blocage et cooldown global",
      "Signal actuel et clôture confirmée",
      "Tendances multi-timeframes (5m à Daily)",
    ],
    timeframes: "15 min et 1 h",
    screenshots: [
      {
        src: "/indicators/confluencepro-1.png",
        caption: "ETH/USDT 15m — Tableau de modules (MACD + Bollinger actifs), signaux BUY/SELL et panneau de vérification.",
      },
      {
        src: "/indicators/confluencepro-2.png",
        caption: "ETH/USDT 1h — Confluence 3 modules (MACD, Bollinger, POC proxy) avec stratégie SELL complète.",
      },
      {
        src: "/indicators/confluencepro-3.png",
        caption: "BTC/USDT 4h — 5 modules actifs (MACD, Bollinger, ADX/DMI, Donchian, Reversal) confirmés Bear 5/5.",
      },
      {
        src: "/indicators/confluencepro-4.png",
        caption: "VANRY/USDT 4h — Confluence incomplète (4/5 Bull) : le blocage empêche les signaux non alignés.",
      },
    ],
    ready: true,
  },
  {
    id: "magic-cycles",
    name: "Magic JB IA Cycles",
    tagline: "Investissement spot long terme basé sur les cycles Bitcoin",
    icon: Sparkles,
    accent: ACCENTS.fuchsia,
    description: [
      "Magic JB Cycles est un indicateur d'investissement spot à long terme basé sur les cycles historiques du marché des cryptomonnaies. Il est principalement conçu pour les graphiques Weekly et Monthly.",
      "L'indicateur utilise Bitcoin comme référence du cycle global, même lorsqu'il est affiché sur un autre actif. Il analyse notamment : la position dans le cycle post-halving, le régime haussier ou baissier, le Mayer Multiple, le Pi Cycle Top, la capitalisation relative, l'ATH potentiel du cycle, les phases d'accumulation, les risques de sommet, les zones de vente et les périodes de forte accumulation.",
      "Les zones Mayer servent à détecter : une zone d'achat favorable, une zone d'accumulation, une zone d'accumulation forte et une zone de surchauffe pouvant suggérer une prise de profits.",
      "Les événements Whale Buy et Whale Dump représentent des conditions exceptionnelles de volume, de tendance ou de cycle pouvant correspondre à une accumulation importante ou à une distribution agressive.",
      "L'indicateur contient aussi : un tableau de saisonnalité mensuelle, un tableau de DCA, des statistiques de signaux, un module Fear and Greed proxy, des niveaux TP à long terme et une estimation de l'ATH du cycle. L'historique visuel a été limité afin de garder le Weekly et le Monthly lisibles.",
    ],
    features: [
      "Cycles Bitcoin et analyse post-halving",
      "Mayer Multiple et Pi Cycle Top",
      "Good Buy et Good Sell",
      "Whale Buy et Whale Dump",
      "Cycle Bottom et Cycle Top",
      "Zones d'accumulation",
      "DCA Cycle-Aware",
      "Saisonnalité mensuelle",
      "Statistiques de signaux",
      "Fear and Greed proxy",
      "Objectifs long terme (TP)",
      "Tableaux Weekly et Monthly",
      "Nettoyage automatique de l'historique",
    ],
    dashboard: [
      "Nombre de mois depuis le halving",
      "État du Bear Market",
      "Valeur du Mayer Multiple",
      "Niveau Pi Cycle",
      "Situation de la capitalisation",
      "Phase actuelle",
      "Action suggérée",
    ],
    timeframes: "Weekly et Monthly",
    screenshots: [
      {
        src: "/indicators/magiccycles-1.png",
        caption: "BTC/USDT 1M — Cycle post-halving, zones Mayer, Whale Buy/Dump, saisonnalité 8 ans et tableau de cycle.",
      },
      {
        src: "/indicators/magiccycles-2.png",
        caption: "ETH/USDT 1M — Good Buy / Good Sell avec Fear & Greed proxy et statistiques de backtest.",
      },
      {
        src: "/indicators/magiccycles-3.png",
        caption: "XRP/USDT 1W — Zones d'accumulation forte, Cycle Bottom et phases d'action suggérées.",
      },
      {
        src: "/indicators/magiccycles-4.png",
        caption: "SUI/USDT 1W — Mayer Zones, Whale Buy/Dump et estimation de l'ATH du cycle.",
      },
    ],
    ready: true,
  },
  {
    id: "crypto-ia-edge",
    name: "Crypto IA Edge",
    tagline: "L'indicateur le plus complet de la série — gestion de trade intégrée",
    icon: Brain,
    accent: ACCENTS.lime,
    description: [
      "Crypto IA Edge est l'indicateur de trading le plus complet de la série. Il est conçu pour le trading crypto sur plusieurs unités de temps et comprend plusieurs presets : Scalping, Scalping 1M Confirmed, Trend Surf 5M, Day Trading et Swing.",
      "Il génère des signaux BUY et SELL uniquement lorsque plusieurs conditions sont réunies. L'indicateur combine notamment : tendance, momentum, RSI, volume, MACD, moyennes mobiles, bandes dynamiques, PVSRA, confirmations MTF, score de signal, Edge Score directionnel, sentiment, force de tendance, Golden Pocket et filtres de cooldown.",
      "Entrées directionnelles : les LONG et SHORT utilisent des scores séparés. Un LONG exige un régime MTF haussier, un minimum de votes haussiers, davantage de votes haussiers que baissiers, un momentum positif et un score LONG suffisant. Un SHORT applique les conditions inverses. Un alignement baissier ne peut donc plus renforcer un LONG, et inversement.",
      "Gestion du trade : lorsqu'un signal est validé, l'indicateur affiche ENTRY, SL, TP1, TP2, TP3, le rapport risque/rendement, le Golden Pocket et l'état du trade. Le moteur comprend : un seul trade actif, breakeven universel, cooldown après SL, cooldown facultatif après toute clôture, priorité SL/TP dans la même bougie, sortie sur régime opposé confirmé et alertes séparées.",
      "Sortie sur régime opposé stricte : par défaut, elle exige 5 votes MTF sur 6, au moins 3 bougies après l'entrée, 2 bougies opposées consécutives, un momentum opposé, la cassure de la bande dynamique et aucune sortie opposée après TP1. Après TP1, la position est gérée par le SL, le breakeven et les objectifs restants.",
      "Statistiques honnêtes : le tableau distingue trades clôturés, SL, breakeven, sorties opposées, bougies ambiguës et taux d'atteinte TP1/TP2/TP3. Les statistiques sont calculées sur les trades clôturés et non simplement sur toutes les entrées.",
      "La version 2.7.5 possède un dashboard plus gros et plus lisible avec 4 tailles : Tiny, Small, Normal et Large.",
    ],
    features: [
      "Signaux LONG et SHORT (scores directionnels séparés)",
      "MTF confirmé et Edge Score directionnel",
      "5 presets : Scalping, Scalping 1M Confirmed, Trend Surf 5M, Day Trading, Swing",
      "ENTRY, SL, TP1, TP2 et TP3 affichés sur le graphique",
      "Breakeven universel et cooldowns",
      "Sortie opposée stable (5 votes MTF / 6)",
      "Golden Pocket sur pivots confirmés",
      "PVSRA",
      "Alertes détaillées et séparées",
      "Statistiques honnêtes (trades clôturés uniquement)",
      "Dashboard ajustable (Tiny → Large)",
      "Compatible 15 min, 1 h et autres unités de temps",
    ],
    dashboard: [
      "Preset actif, sentiment et Momentum Flow",
      "Force du signal et régime (Bullish / Bearish / Neutral)",
      "Edge Score et cooldown",
      "État du trade : ENTRY, SL, TP1, TP2, TP3, RR",
      "Golden Pocket",
      "Statistiques (TP1/TP2/TP3 %, clôturés, SL/BE/OppExit)",
      "Force des tendances 5M, 15M, 30M, 1H, 4H et 1D",
      "Momentum global",
    ],
    timeframes: "multi-timeframes (1 min au Daily selon le preset)",
    screenshots: [
      {
        src: "/indicators/cryptoiaedge-1.png",
        caption: "ETH/USDT 1h — LONG actif avec ENTRY, SL, TP1-TP3, dashboard MTF complet et statistiques.",
      },
      {
        src: "/indicators/cryptoiaedge-2.png",
        caption: "BTC/USDT 1h — TP1 HIT : gestion automatique du trade avec breakeven et objectifs restants.",
      },
      {
        src: "/indicators/cryptoiaedge-3.png",
        caption: "LINK/USDT 15m — Trade complet TP1→TP3 atteints, Golden Pocket et force des tendances MTF.",
      },
      {
        src: "/indicators/cryptoiaedge-4.png",
        caption: "NEAR/USDT 5m — SHORT en preset Scalping : Edge Score, cooldown et momentum baissier.",
      },
    ],
    ready: true,
  },
];

/* ─────────────────────────────────────────────────────────────
 * Components
 * ──────────────────────────────────────────────────────────── */

function IndicatorNavCard({ ind }: { ind: Indicator }) {
  const Icon = ind.icon;
  return (
    <a
      href={`#${ind.id}`}
      data-testid={`indicator-nav-${ind.id}`}
      className={`group relative overflow-hidden rounded-2xl border bg-[#0d1526] p-5 transition ${ind.accent.border}`}
    >
      <div className={`absolute -top-10 -right-10 h-28 w-28 rounded-full blur-3xl ${ind.accent.glow}`} />
      <div className="relative flex items-start gap-4">
        <div className={`shrink-0 h-11 w-11 rounded-xl grid place-items-center border ${ind.accent.badge}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white leading-snug">{ind.name}</div>
          <div className="mt-1 text-xs text-white/55 leading-relaxed">{ind.tagline}</div>
        </div>
        <ChevronRight className="ml-auto shrink-0 h-4 w-4 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition" />
      </div>
    </a>
  );
}

function ScreenshotCard({ shot, border }: { shot: IndicatorScreenshot; border: string }) {
  return (
    <a
      href={shot.src}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative overflow-hidden rounded-2xl border bg-[#0d1526] transition ${border}`}
    >
      <div className="aspect-[16/9] overflow-hidden bg-[#0a0e17]">
        <img
          src={shot.src}
          alt={shot.caption}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
      </div>
      <div className="absolute top-3 right-3 rounded-md bg-black/60 backdrop-blur-sm px-2 py-1 text-[10px] font-semibold text-white/80 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition">
        Agrandir ↗
      </div>
      <div className="px-4 py-3 border-t border-white/5">
        <div className="text-xs text-white/60 leading-relaxed">{shot.caption}</div>
      </div>
    </a>
  );
}

function IndicatorSection({ ind }: { ind: Indicator }) {
  const Icon = ind.icon;
  return (
    <section
      id={ind.id}
      data-testid={`indicator-section-${ind.id}`}
      className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 scroll-mt-20 border-t border-white/5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className={`shrink-0 h-14 w-14 rounded-2xl grid place-items-center border ${ind.accent.badge}`}>
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            <span className={`bg-gradient-to-r ${ind.accent.title} bg-clip-text text-transparent`}>
              {ind.name}
            </span>
          </h2>
          <p className="mt-1 text-sm sm:text-base text-white/60">{ind.tagline}</p>
        </div>
      </div>

      {!ind.ready ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <Clock className="mx-auto h-6 w-6 text-white/40" />
          <p className="mt-3 text-sm text-white/60">
            Fiche détaillée en préparation — description complète et captures d'écran à venir.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4">
              {ind.description.map((p, i) => (
                <p key={i} className="text-sm sm:text-base leading-relaxed text-slate-300">
                  {p}
                </p>
              ))}
              {ind.timeframes && (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70">
                  <Clock className="h-3.5 w-3.5" />
                  Affichage adapté au {ind.timeframes}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className={`rounded-2xl border bg-[#0d1526] p-5 ${ind.accent.border}`}>
                <div className="text-xs font-bold uppercase tracking-wider text-white/50">
                  Fonctions principales
                </div>
                <ul className="mt-3 space-y-2">
                  {ind.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-white/80">
                      <CheckCircle2 className={`shrink-0 mt-0.5 h-4 w-4 ${ind.accent.check}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {ind.dashboard && (
                <div className="rounded-2xl border border-white/10 bg-[#0d1526] p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-white/50">
                    Tableau de bord
                  </div>
                  <ul className="mt-3 space-y-2">
                    {ind.dashboard.map((d, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-white/80">
                        <LayoutGrid className={`shrink-0 mt-0.5 h-4 w-4 ${ind.accent.check}`} />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {ind.screenshots.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
              {ind.screenshots.map((s, i) => (
                <ScreenshotCard key={i} shot={s} border={ind.accent.border} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Page
 * ──────────────────────────────────────────────────────────── */

export default function MagicStrategy() {
  const [readyCount] = useState(() => INDICATORS.filter((i) => i.ready).length);

  return (
    <div className="flex min-h-screen bg-[#0a0e17] text-white">
      <Sidebar />

      <main className="flex-1 lg:ml-64 flex flex-col">
        <PageHeader />

        {/* ── Hero ───────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.18),_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.12),_transparent_50%)]" />
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:48px_48px]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Suite d'indicateurs Crypto IA
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
                Nos Indicateurs
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-base sm:text-lg text-white/70">
              {INDICATORS.length} indicateurs TradingView exclusifs conçus pour vous donner un avantage
              réel sur le marché : tendance, volume, divergences, cycles et gestion du risque.
            </p>
          </div>
        </section>

        {/* ── Grid nav ──────────────────────────────────── */}
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INDICATORS.map((ind) => (
              <IndicatorNavCard key={ind.id} ind={ind} />
            ))}
          </div>
        </section>

        {/* ── Sections détaillées ───────────────────────── */}
        {INDICATORS.map((ind) => (
          <IndicatorSection key={ind.id} ind={ind} />
        ))}

        <div className="flex-1" />
        <Footer />
      </main>
    </div>
  );
}
