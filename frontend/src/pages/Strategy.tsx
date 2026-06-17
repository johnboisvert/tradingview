import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/Sidebar";
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, Target, Shield, Zap, Clock, AlertTriangle, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const STRAT_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/b3c0b3a0-ae42-46d0-9f3a-9f12780c9e10.png";

interface CoinSignal {
  symbol: string; name: string; price: number; change24h: number;
  rsi: number; signal: "BUY" | "SELL" | "HOLD"; strength: number; image: string;
}

function computeRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  const gains: number[] = []; const losses: number[] = [];
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(Math.max(0, change)); losses.push(Math.max(0, -change));
  }
  let avgGain = gains.reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.reduce((a, b) => a + b, 0) / period;
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0, change)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -change)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

interface StrategyGuide {
  name: string; type: string; risk: string; icon: React.ReactNode;
  timeframes: string[]; indicators: { name: string; usage: string; settings: string }[];
  entryRules: string[]; exitRules: string[]; tips: string[];
  description: string; idealFor: string; expectedReturn: string;
  coins: string;
}

export default function Strategy() {
  const { t } = useTranslation();
  const [signals, setSignals] = useState<CoinSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const allData = await fetchTop200(false);
      if (allData.length > 0) {
        const data = allData as any[];
          const sigs: CoinSignal[] = data.map((c: any) => {
            const sparkline = (c.sparkline_in_7d as { price?: number[] })?.price || [];
            const rsi = sparkline.length > 20 ? computeRSI(sparkline.slice(-50)) : 50;
            const ch = (c.price_change_percentage_24h as number) || 0;
            let signal: "BUY" | "SELL" | "HOLD" = "HOLD"; let strength = 50;
            if (rsi < 30 && ch > -5) { signal = "BUY"; strength = Math.round(80 + (30 - rsi)); }
            else if (rsi < 40 && ch > 0) { signal = "BUY"; strength = Math.round(60 + (40 - rsi)); }
            else if (rsi > 70 && ch < 5) { signal = "SELL"; strength = Math.round(80 + (rsi - 70)); }
            else if (rsi > 60 && ch < 0) { signal = "SELL"; strength = Math.round(60 + (rsi - 60)); }
            else { strength = Math.round(40 + Math.abs(50 - rsi)); }
            return { symbol: ((c.symbol as string) || "").toUpperCase(), name: c.name as string, price: (c.current_price as number) || 0, change24h: ch, rsi: Math.round(rsi * 10) / 10, signal, strength: Math.min(100, strength), image: c.image as string };
          });
          setSignals(sigs);
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 120000); return () => clearInterval(interval); }, [fetchData]);

  const buySignals = signals.filter((s) => s.signal === "BUY");
  const sellSignals = signals.filter((s) => s.signal === "SELL");
  const holdSignals = signals.filter((s) => s.signal === "HOLD");
  const avgRSI = signals.length ? signals.reduce((s, c) => s + c.rsi, 0) / signals.length : 50;

  const strategies: StrategyGuide[] = [
    {
      name: "DCA (Dollar Cost Averaging)", type: "Long Terme", risk: "Faible",
      icon: <Shield className="w-6 h-6 text-emerald-400" />,
      timeframes: ["Hebdomadaire", "Bi-mensuel", "Mensuel"],
      indicators: [
        { name: "Fear & Greed Index", usage: "Acheter plus quand Fear < 25 (Extreme Fear)", settings: "Vérifier quotidiennement" },
        { name: "Moyenne Mobile 200 jours (MA200)", usage: "Acheter plus quand le prix est sous la MA200", settings: "Graphique journalier (1D)" },
        { name: "RSI Mensuel", usage: "Augmenter les achats quand RSI < 40 sur le mensuel", settings: "RSI(14) sur graphique mensuel" },
      ],
      entryRules: [
        "Investir un montant fixe chaque semaine/mois (ex: 100$/semaine)",
        "Augmenter de 50% le montant quand Fear & Greed < 25",
        "Doubler le montant quand le prix est sous la MA200",
        "Ne jamais investir plus que ce que vous pouvez perdre",
      ],
      exitRules: [
        "Prendre 20% de profits quand le portfolio fait x2",
        "Prendre 30% supplémentaires quand le portfolio fait x3",
        "Garder toujours 50% minimum en position long terme",
        "Sortir progressivement quand Fear & Greed > 80 pendant 2+ semaines",
      ],
      tips: [
        "💡 Le DCA est la stratégie #1 recommandée pour les débutants",
        "💡 Automatisez vos achats pour éliminer les émotions",
        "💡 Concentrez-vous sur BTC (60%) et ETH (30%), 10% altcoins",
        "💡 Ne regardez pas les prix quotidiennement — pensez en années",
      ],
      description: "Le DCA consiste à investir un montant fixe à intervalles réguliers, peu importe le prix. Cette stratégie réduit l'impact de la volatilité et élimine le besoin de 'timer' le marché.",
      idealFor: "Débutants, investisseurs passifs, ceux qui n'ont pas le temps de trader activement",
      expectedReturn: "15-50% annuel historiquement sur BTC/ETH (long terme)",
      coins: buySignals.slice(0, 5).map((s) => s.symbol).join(", ") || "BTC, ETH, SOL",
    },
    {
      name: "Scalping", type: "Très Court Terme", risk: "Très Élevé",
      icon: <Zap className="w-6 h-6 text-red-400" />,
      timeframes: ["1 minute (1m)", "5 minutes (5m)", "15 minutes (15m)"],
      indicators: [
        { name: "Bollinger Bands (BB)", usage: "Acheter au toucher de la bande inférieure, vendre à la supérieure", settings: "BB(20, 2) sur graphique 1m-5m" },
        { name: "VWAP (Volume Weighted Average Price)", usage: "Acheter sous le VWAP, vendre au-dessus", settings: "VWAP intraday sur 1m-5m" },
        { name: "RSI rapide", usage: "Entrée quand RSI < 20, sortie quand RSI > 80", settings: "RSI(7) sur graphique 1m-5m" },
        { name: "Order Book / Depth", usage: "Identifier les murs d'achat/vente pour les niveaux clés", settings: "Carnet d'ordres en temps réel" },
      ],
      entryRules: [
        "Trader uniquement les paires à haute liquidité (BTC, ETH, SOL)",
        "Entrée quand le prix touche la bande inférieure de Bollinger + RSI < 20",
        "Confirmer avec le volume (volume > moyenne)",
        "Maximum 1-2% du capital par trade",
      ],
      exitRules: [
        "Take Profit : 0.3% à 1% maximum par trade",
        "Stop Loss : 0.2% à 0.5% — OBLIGATOIRE",
        "Sortir immédiatement si le trade ne va pas dans votre sens en 2-5 minutes",
        "Maximum 10-20 trades par session",
      ],
      tips: [
        "⚠️ Le scalping nécessite une connexion internet ultra-rapide",
        "⚠️ Les frais de trading peuvent manger vos profits — utilisez des exchanges à frais bas",
        "⚠️ Stratégie TRÈS stressante — pas recommandée pour les débutants",
        "💡 Pratiquez d'abord en paper trading pendant 1 mois minimum",
      ],
      description: "Le scalping consiste à réaliser de nombreux petits trades rapides (secondes à minutes) pour capturer de petits mouvements de prix. Nécessite une grande discipline et une exécution rapide.",
      idealFor: "Traders expérimentés avec du temps disponible, bonne gestion du stress",
      expectedReturn: "0.5-3% par jour (mais risque de perte équivalent)",
      coins: "BTC, ETH, SOL, BNB (haute liquidité uniquement)",
    },
    {
      name: "Swing Trading", type: "Moyen Terme", risk: "Moyen",
      icon: <TrendingUp className="w-6 h-6 text-cyan-400" />,
      timeframes: ["4 heures (4H)", "Journalier (1D)", "Hebdomadaire (1W)"],
      indicators: [
        { name: "RSI (Relative Strength Index)", usage: "Acheter quand RSI < 30 (survendu), vendre quand RSI > 70 (suracheté)", settings: "RSI(14) sur graphique 4H ou 1D" },
        { name: "MACD (Moving Average Convergence Divergence)", usage: "Signal d'achat quand la ligne MACD croise au-dessus de la ligne signal", settings: "MACD(12, 26, 9) sur graphique 1D" },
        { name: "Supports & Résistances", usage: "Acheter aux supports, vendre aux résistances", settings: "Identifier sur graphique 1D et 1W" },
        { name: "Fibonacci Retracement", usage: "Entrée aux niveaux 0.382, 0.5, 0.618 en tendance haussière", settings: "Tracer du dernier swing low au swing high" },
      ],
      entryRules: [
        "Attendre un pullback vers un support ou un niveau Fibonacci",
        "Confirmer avec RSI survendu (< 35) + MACD bullish crossover",
        "Le prix doit être au-dessus de la MA50 sur le daily",
        "Risquer maximum 2-3% du capital par trade",
      ],
      exitRules: [
        "Take Profit : ratio Risk/Reward minimum 1:2 (idéal 1:3)",
        "Stop Loss : sous le dernier swing low (-3% à -5%)",
        "Prendre des profits partiels (50%) au premier objectif",
        "Trailing stop à 5% une fois en profit de 10%+",
      ],
      tips: [
        "💡 Le swing trading est idéal pour ceux qui travaillent à temps plein",
        "💡 Analysez les graphiques 1-2 fois par jour, pas plus",
        "💡 Tenez un journal de trading pour améliorer votre stratégie",
        "💡 Ne tradez que dans la direction de la tendance principale",
      ],
      description: "Le swing trading capture les mouvements de prix sur plusieurs jours à semaines. Il combine analyse technique et patience pour profiter des 'swings' du marché.",
      idealFor: "Traders intermédiaires, personnes avec un emploi à temps plein",
      expectedReturn: "5-20% par mois en marché favorable",
      coins: signals.filter((s) => s.rsi < 40 || s.rsi > 60).slice(0, 5).map((s) => s.symbol).join(", ") || "ETH, SOL, AVAX",
    },
    {
      name: "Day Trading", type: "Court Terme", risk: "Élevé",
      icon: <Target className="w-6 h-6 text-amber-400" />,
      timeframes: ["15 minutes (15m)", "1 heure (1H)", "4 heures (4H)"],
      indicators: [
        { name: "EMA 9 & EMA 21", usage: "Achat quand EMA9 croise au-dessus de EMA21, vente inversement", settings: "EMA(9) + EMA(21) sur graphique 15m-1H" },
        { name: "Volume Profile", usage: "Identifier les zones de forte activité (POC, VAH, VAL)", settings: "Volume Profile visible sur graphique 1H" },
        { name: "RSI + Divergences", usage: "Chercher les divergences haussières/baissières pour les retournements", settings: "RSI(14) sur graphique 15m-1H" },
        { name: "Ichimoku Cloud", usage: "Trader au-dessus du nuage (bullish) ou en-dessous (bearish)", settings: "Ichimoku(9, 26, 52) sur graphique 1H" },
      ],
      entryRules: [
        "Trader uniquement pendant les heures de forte volatilité (ouverture US/EU)",
        "Entrée sur croisement EMA9/EMA21 confirmé par le volume",
        "Le prix doit être au-dessus du nuage Ichimoku pour les longs",
        "Maximum 3-5 trades par jour",
      ],
      exitRules: [
        "Fermer TOUTES les positions avant la fin de la journée",
        "Take Profit : 1-3% par trade",
        "Stop Loss : 0.5-1.5% — JAMAIS déplacer un stop loss vers le bas",
        "Si 2 trades perdants consécutifs, arrêter pour la journée",
      ],
      tips: [
        "⚠️ Le day trading nécessite 2-4 heures de disponibilité par jour",
        "💡 Commencez avec un petit capital et augmentez progressivement",
        "💡 Utilisez un compte démo pendant 3 mois avant de trader en réel",
        "💡 La gestion du risque est plus importante que le taux de réussite",
      ],
      description: "Le day trading consiste à ouvrir et fermer des positions dans la même journée. L'objectif est de profiter des mouvements intraday sans s'exposer au risque overnight.",
      idealFor: "Traders avec du temps disponible en journée, bonne discipline",
      expectedReturn: "2-10% par mois (traders disciplinés)",
      coins: signals.filter((s) => s.change24h > 3).slice(0, 5).map((s) => s.symbol).join(", ") || "SOL, DOGE, AVAX",
    },
    {
      name: "Breakout Trading", type: "Court-Moyen Terme", risk: "Élevé",
      icon: <Zap className="w-6 h-6 text-purple-400" />,
      timeframes: ["1 heure (1H)", "4 heures (4H)", "Journalier (1D)"],
      indicators: [
        { name: "Volume", usage: "Le breakout DOIT être accompagné d'un volume 2x+ la moyenne", settings: "Volume moyen 20 périodes" },
        { name: "Bollinger Bands", usage: "Breakout quand le prix sort des bandes avec volume", settings: "BB(20, 2) sur graphique 4H" },
        { name: "ATR (Average True Range)", usage: "Mesurer la volatilité pour placer les stop loss", settings: "ATR(14) pour calculer les distances SL/TP" },
        { name: "Niveaux clés", usage: "Identifier les résistances horizontales et les triangles", settings: "Graphique 1D pour les niveaux majeurs" },
      ],
      entryRules: [
        "Attendre la cassure d'une résistance claire avec volume 2x+",
        "Entrer sur le retest de la résistance cassée (devenue support)",
        "Confirmer avec une bougie de clôture au-dessus du niveau",
        "Risquer maximum 2% du capital par trade",
      ],
      exitRules: [
        "Take Profit : hauteur du range/triangle projeté depuis le breakout",
        "Stop Loss : sous le niveau cassé (-1 ATR)",
        "Si le prix revient sous le niveau cassé, sortir immédiatement (faux breakout)",
        "Trailing stop de 1.5 ATR une fois en profit",
      ],
      tips: [
        "⚠️ 60-70% des breakouts sont des faux breakouts — attendez la confirmation",
        "💡 Les meilleurs breakouts arrivent après une longue consolidation",
        "💡 Le volume est le facteur #1 pour valider un breakout",
        "💡 Combinez avec l'analyse des timeframes supérieurs",
      ],
      description: "Le breakout trading consiste à entrer en position lorsque le prix casse un niveau de résistance ou de support important avec un fort volume.",
      idealFor: "Traders intermédiaires à avancés, patients et disciplinés",
      expectedReturn: "5-15% par trade réussi (mais taux de réussite ~40%)",
      coins: signals.filter((s) => s.change24h > 3).slice(0, 5).map((s) => s.symbol).join(", ") || "SOL, DOGE, AVAX",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
      <PageHeader
          icon={<BarChart3 className="w-6 h-6" />}
          title={t("pages.strategy.title")}
          subtitle={t("pages.strategy.subtitle")}
          accentColor="blue"
          steps={[
            { n: "1", title: "Choisissez une stratégie", desc: "Parcourez les stratégies disponibles (Trend Following, Mean Reversion, Breakout...) et sélectionnez celle qui correspond à votre profil." },
            { n: "2", title: "Vérifiez les conditions", desc: "Chaque stratégie indique les conditions de marché optimales, les indicateurs à surveiller et les niveaux d'entrée/sortie." },
            { n: "3", title: "Gérez votre risque", desc: "Respectez toujours le stop loss recommandé. Ne risquez jamais plus de 1-2% de votre capital par trade." },
          ]}
        />
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={STRAT_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <BarChart3 className="w-7 h-7 text-indigo-400" />
                <h1 className="text-2xl font-extrabold">Stratégies de Trading</h1>
              </div>
              <p className="text-sm text-gray-400">Guides détaillés • Indicateurs • Timeframes • Signaux RSI automatiques</p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Signaux BUY", value: String(buySignals.length), color: "text-emerald-400" },
            { label: "Signaux SELL", value: String(sellSignals.length), color: "text-red-400" },
            { label: "Signaux HOLD", value: String(holdSignals.length), color: "text-gray-400" },
            { label: "RSI Moyen", value: avgRSI.toFixed(1), color: "text-indigo-400" },
            { label: "Cryptos Analysées", value: String(signals.length), color: "text-white" },
          ].map((kpi, i) => (
            <div key={i} className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs text-gray-500 font-semibold mb-1">{kpi.label}</p>
              <p className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Detailed Strategy Guides */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold">🎯 Guides Détaillés des Stratégies</h2>
          </div>
          <p className="text-xs text-gray-500 mb-5">Cliquez sur une stratégie pour voir le guide complet avec indicateurs, timeframes, règles d'entrée/sortie et conseils.</p>

          <div className="space-y-3">
            {strategies.map((s, idx) => {
              const isExpanded = expandedStrategy === idx;
              return (
                <div key={idx} className="border border-white/[0.06] rounded-xl overflow-hidden">
                  <button onClick={() => setExpandedStrategy(isExpanded ? null : idx)}
                    className="w-full text-left p-5 hover:bg-white/[0.02] transition-all flex items-center gap-4">
                    {s.icon}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold">{s.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">{s.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          s.risk === "Faible" ? "bg-emerald-500/20 text-emerald-400" :
                          s.risk === "Moyen" ? "bg-amber-500/20 text-amber-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>Risque: {s.risk}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{s.description.slice(0, 120)}...</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Cryptos: <span className="text-white font-semibold">{s.coins}</span></span>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-5 border-t border-white/[0.04] pt-5">
                      {/* Description */}
                      <div className="bg-indigo-500/[0.05] border border-indigo-500/20 rounded-xl p-4">
                        <p className="text-sm text-gray-300 leading-relaxed">{s.description}</p>
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div><span className="text-[10px] text-gray-500 block">Idéal pour</span><span className="text-xs font-bold">{s.idealFor}</span></div>
                          <div><span className="text-[10px] text-gray-500 block">Rendement attendu</span><span className="text-xs font-bold text-emerald-400">{s.expectedReturn}</span></div>
                          <div><span className="text-[10px] text-gray-500 block">Timeframes</span><span className="text-xs font-bold">{s.timeframes.join(", ")}</span></div>
                        </div>
                      </div>

                      {/* Indicators */}
                      <div>
                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-cyan-400" /> Indicateurs à Utiliser</h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          {s.indicators.map((ind, j) => (
                            <div key={j} className="bg-black/20 rounded-xl p-4 border border-white/[0.04]">
                              <h5 className="font-bold text-sm text-cyan-400 mb-1">{ind.name}</h5>
                              <p className="text-xs text-gray-400 mb-1">{ind.usage}</p>
                              <p className="text-[10px] text-gray-600">⚙️ Réglages: {ind.settings}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Entry & Exit Rules */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> Règles d'Entrée</h4>
                          <ul className="space-y-2">
                            {s.entryRules.map((rule, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-gray-300 bg-emerald-500/[0.03] rounded-lg p-2.5 border border-emerald-500/10">
                                <span className="text-emerald-400 font-bold mt-0.5">✓</span> {rule}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Règles de Sortie</h4>
                          <ul className="space-y-2">
                            {s.exitRules.map((rule, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-gray-300 bg-red-500/[0.03] rounded-lg p-2.5 border border-red-500/10">
                                <span className="text-red-400 font-bold mt-0.5">✗</span> {rule}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Tips */}
                      <div className="bg-amber-500/[0.04] border border-amber-500/15 rounded-xl p-4">
                        <h4 className="text-sm font-bold mb-2 text-amber-400">💡 Conseils Pro</h4>
                        <ul className="space-y-1.5">
                          {s.tips.map((tip, j) => (
                            <li key={j} className="text-xs text-gray-300">{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Signals Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">📊 Signaux — Top 50 Cryptos</h2>
            <span className="text-xs text-gray-500">{signals.length} signaux générés</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["#", "Crypto", "Prix", "24h", "RSI", "Signal", "Force"].map((h) => (
                    <th key={h} className={`py-3 px-3 text-xs font-bold text-gray-500 uppercase ${h === "#" || h === "Crypto" ? "text-left" : h === "Signal" || h === "Force" ? "text-center" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signals.map((s, i) => (
                  <tr key={s.symbol + i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-sm text-gray-500 font-semibold">{i + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {s.image ? <img src={s.image} alt={s.symbol} className="w-7 h-7 rounded-full" /> : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold">{s.symbol.slice(0, 2)}</div>}
                        <div><p className="text-sm font-bold">{s.symbol}</p><p className="text-[10px] text-gray-500">{s.name}</p></div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-bold">${s.price >= 1 ? s.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : s.price.toFixed(6)}</td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${s.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>{s.change24h >= 0 ? "+" : ""}{s.change24h.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-right"><span className={`text-sm font-bold ${s.rsi > 70 ? "text-red-400" : s.rsi < 30 ? "text-emerald-400" : "text-gray-300"}`}>{s.rsi.toFixed(1)}</span></td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${s.signal === "BUY" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : s.signal === "SELL" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-gray-500/20 text-gray-400 border border-gray-500/30"}`}>{s.signal}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="h-2 w-16 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${s.strength}%`, backgroundColor: s.signal === "BUY" ? "#10B981" : s.signal === "SELL" ? "#EF4444" : "#6B7280" }} />
                        </div>
                        <span className="text-xs font-bold text-gray-400">{s.strength}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}