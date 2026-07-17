import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import {
  BarChart3,
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
    id: "volume-confirmed",
    name: "Volume Confirmed",
    tagline: "Signaux confirmés par le volume",
    icon: BarChart3,
    accent: ACCENTS.emerald,
    description: [],
    features: [],
    screenshots: [],
    ready: false,
  },
  {
    id: "waverider",
    name: "WaveRider Divergence Oscillator",
    tagline: "Oscillateur de divergences",
    icon: Waves,
    accent: ACCENTS.sky,
    description: [],
    features: [],
    screenshots: [],
    ready: false,
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
    name: "Vector Confluence Pro™",
    tagline: "Confluence de vecteurs multi-signaux",
    icon: Compass,
    accent: ACCENTS.violet,
    description: [],
    features: [],
    screenshots: [],
    ready: false,
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
    tagline: "L'avantage IA sur le marché crypto",
    icon: Brain,
    accent: ACCENTS.lime,
    description: [],
    features: [],
    screenshots: [],
    ready: false,
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
