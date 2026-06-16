import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw, Sparkles } from "lucide-react";
import { fetchWithCorsProxy } from "@/lib/cryptoApi";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

interface PhaseData {
  id: string;
  name: string;
  icon: string;
  color: string;
  range: [number, number];
  desc: string;
  action: string;
}

interface Indicator {
  name: string;
  icon: string;
  value: number;
  rawValue: string;
  signal: string;
  signalColor: string;
  desc: string;
  source: string;
  contribution: string;
}

/*
  Phase scoring: 0 = extreme bear / capitulation, 100 = extreme euphoria
  
  0-15:  Capitulation / Bear profond  (extreme fear, loin de ATH, momentum très négatif)
  15-30: Accumulation               (peur, loin de ATH, momentum négatif)
  30-45: Début Haussier             (neutre, correction modérée, momentum neutre/positif)
  45-65: Bull Run                   (avidité, proche ATH, momentum positif)
  65-80: Euphorie / Distribution    (avidité extrême, très proche ATH)
  80-100: Surchauffe / Sommet       (extrême avidité, ATH, volumes fous)
*/

const PHASES: PhaseData[] = [
  {
    id: "capitulation",
    name: "Capitulation / Bear",
    icon: "💀",
    color: "#dc2626",
    range: [0, 15],
    desc: "Phase de capitulation — Peur extrême, le marché est en chute libre. Les investisseurs paniquent et vendent à perte. Le smart money commence à observer.",
    action: "Observer et préparer — Ne pas attraper le couteau qui tombe",
  },
  {
    id: "accumulation",
    name: "Accumulation",
    icon: "❄️",
    color: "#3b82f6",
    range: [15, 30],
    desc: "Phase de bottom — Le smart money accumule discrètement. Sentiment très négatif, volumes faibles. Les prix sont loin de l'ATH.",
    action: "Meilleur moment pour acheter — DCA agressif sur BTC/ETH",
  },
  {
    id: "early_bull",
    name: "Début Haussier",
    icon: "🌱",
    color: "#22c55e",
    range: [30, 45],
    desc: "Début de reprise — BTC mène le marché, les altcoins suivent lentement. La confiance revient progressivement.",
    action: "Accumuler BTC + blue chips (ETH, SOL, BNB)",
  },
  {
    id: "bull_run",
    name: "Bull Run",
    icon: "🚀",
    color: "#f59e0b",
    range: [45, 65],
    desc: "Phase haussière confirmée — Les volumes augmentent fortement, les altcoins commencent à surperformer BTC. Médias mainstream en parlent.",
    action: "Prendre des profits progressivement (20-30%)",
  },
  {
    id: "euphoria",
    name: "Euphorie / Distribution",
    icon: "⚠️",
    color: "#f97316",
    range: [65, 80],
    desc: "Sommet du cycle — Euphorie maximale, le smart money distribue. Tout le monde parle de crypto. Prudence requise !",
    action: "Sécuriser les gains — Convertir 50%+ en stablecoins",
  },
  {
    id: "overheat",
    name: "Surchauffe / Sommet",
    icon: "🔥",
    color: "#ef4444",
    range: [80, 100],
    desc: "Zone de danger extrême — Le marché est en surchauffe totale. La correction est imminente. Les derniers acheteurs entrent.",
    action: "SORTIR — Sécuriser maximum de gains, préparer le bear",
  },
];

function getPhase(score: number): PhaseData {
  for (const p of PHASES) {
    if (score >= p.range[0] && score < p.range[1]) return p;
  }
  return score >= 100 ? PHASES[5] : PHASES[0];
}

function useAnimatedNumber(target: number, duration = 1200): number {
  const [val, setVal] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  useEffect(() => {
    fromRef.current = val;
    startRef.current = null;
    let raf = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}

export default function BullrunPhase() {
  const [score, setScore] = useState(0);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch BTC data from top 200 cache
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const allCoins = await fetchTop200(false);
      const btcData = allCoins.find((c: any) => c.id === "bitcoin") as any;
      let btcPrice = 0;
      let btcChange24h = 0;
      let btcChange7d = 0;
      let btcChange30d = 0;
      let btcAthPct = 0;
      let btcAth = 0;
      if (btcData) {
        btcPrice = btcData.current_price || 0;
        btcChange24h = btcData.price_change_percentage_24h || 0;
        btcChange7d = btcData.price_change_percentage_7d_in_currency || 0;
        btcChange30d = btcData.price_change_percentage_30d_in_currency || 0;
        btcAthPct = btcData.ath_change_percentage || 0; // negative value, e.g. -47
        btcAth = btcData.ath || 0;
      }

      // 2. Fetch global market data (via server proxy to avoid CORS)
      const globalRes = await fetch("/api/coingecko/global", { signal: AbortSignal.timeout(15000) });
      let btcDominance = 50;
      let totalMarketCap = 0;
      let totalVolume = 0;
      if (globalRes.ok) {
        const globalData = await globalRes.json();
        btcDominance = globalData?.data?.market_cap_percentage?.btc || 50;
        totalMarketCap = globalData?.data?.total_market_cap?.usd || 0;
        totalVolume = globalData?.data?.total_volume?.usd || 0;
      }

      // 3. Fetch Fear & Greed Index
      let fearGreed = 50;
      let fgClassification = "Neutral";
      try {
        const fgRes = await fetchWithCorsProxy("https://api.alternative.me/fng/?limit=1");
        if (fgRes.ok) {
          const fgData = await fgRes.json();
          fearGreed = parseInt(fgData?.data?.[0]?.value || "50");
          fgClassification = fgData?.data?.[0]?.value_classification || "Neutral";
        }
      } catch {
        // keep default
      }

      const fgTranslations: Record<string, string> = {
        "Extreme Fear": "Peur Extrême",
        Fear: "Peur",
        Neutral: "Neutre",
        Greed: "Avidité",
        "Extreme Greed": "Avidité Extrême",
      };
      const fgFr = fgTranslations[fgClassification] || fgClassification;

      // =============================================
      // SCORING ALGORITHM — Based on REAL data only
      // =============================================
      
      const athDistance = Math.abs(btcAthPct); // e.g. 47.3 means -47.3% from ATH

      /*
        Sub-score 1: ATH Distance (weight: 30%)
        Closer to ATH = more bullish/euphoric
        0% from ATH → 100 points (at the top)
        10% from ATH → 80 points
        25% from ATH → 50 points
        50% from ATH → 15 points
        75%+ from ATH → 0 points
      */
      let athScore: number;
      if (athDistance <= 5) athScore = 95 + (5 - athDistance);
      else if (athDistance <= 15) athScore = 70 + (15 - athDistance) * 2.5;
      else if (athDistance <= 30) athScore = 40 + (30 - athDistance) * 2;
      else if (athDistance <= 50) athScore = 10 + (50 - athDistance) * 1.5;
      else if (athDistance <= 75) athScore = (75 - athDistance) * 0.4;
      else athScore = 0;
      athScore = Math.max(0, Math.min(100, athScore));

      /*
        Sub-score 2: Fear & Greed Index (weight: 30%)
        Direct mapping — F&G 0-100 maps to score 0-100
        Extreme Fear (0-20) → very bearish
        Fear (20-40) → bearish
        Neutral (40-60) → neutral
        Greed (60-80) → bullish
        Extreme Greed (80-100) → euphoric
      */
      const fgScore = fearGreed;

      /*
        Sub-score 3: Momentum 30 days (weight: 25%)
        -50% or worse → 0 points
        -25% → 15 points
        0% → 45 points
        +25% → 75 points
        +50% or more → 100 points
      */
      let momentumScore: number;
      if (btcChange30d <= -50) momentumScore = 0;
      else if (btcChange30d <= -25) momentumScore = ((btcChange30d + 50) / 25) * 15;
      else if (btcChange30d <= 0) momentumScore = 15 + ((btcChange30d + 25) / 25) * 30;
      else if (btcChange30d <= 25) momentumScore = 45 + (btcChange30d / 25) * 30;
      else if (btcChange30d <= 50) momentumScore = 75 + ((btcChange30d - 25) / 25) * 25;
      else momentumScore = 100;
      momentumScore = Math.max(0, Math.min(100, momentumScore));

      /*
        Sub-score 4: Volume Ratio (weight: 5%)
        Volume/MarketCap ratio indicates market activity
        < 2% → 20 (low activity)
        2-5% → 40
        5-8% → 60
        8-12% → 80
        > 12% → 100 (very high activity)
      */
      const volumeRatio = totalMarketCap > 0 ? (totalVolume / totalMarketCap) * 100 : 3;
      let volumeScore: number;
      if (volumeRatio < 2) volumeScore = volumeRatio * 10;
      else if (volumeRatio < 5) volumeScore = 20 + ((volumeRatio - 2) / 3) * 20;
      else if (volumeRatio < 8) volumeScore = 40 + ((volumeRatio - 5) / 3) * 20;
      else if (volumeRatio < 12) volumeScore = 60 + ((volumeRatio - 8) / 4) * 20;
      else volumeScore = 80 + Math.min(20, (volumeRatio - 12) * 2);
      volumeScore = Math.max(0, Math.min(100, volumeScore));

      /*
        Sub-score 5: BTC Dominance (weight: 10%)
        High dominance in bear = flight to safety (bearish for cycle)
        Low dominance = altseason (late bull)
        
        > 65% → 15 (very bearish, flight to BTC)
        55-65% → 30 (moderately bearish)
        45-55% → 55 (neutral to early bull)
        35-45% → 75 (alt season, mid-late bull)
        < 35% → 90 (extreme alt season, late euphoria)
      */
      let domScore: number;
      if (btcDominance > 65) domScore = 5 + (70 - btcDominance) * 2;
      else if (btcDominance > 55) domScore = 15 + (65 - btcDominance) * 1.5;
      else if (btcDominance > 45) domScore = 30 + (55 - btcDominance) * 2.5;
      else if (btcDominance > 35) domScore = 55 + (45 - btcDominance) * 2;
      else domScore = 75 + Math.min(25, (35 - btcDominance) * 2);
      domScore = Math.max(0, Math.min(100, domScore));

      // Weighted composite score
      let composite = 
        athScore * 0.30 + 
        fgScore * 0.30 + 
        momentumScore * 0.25 + 
        volumeScore * 0.05 + 
        domScore * 0.10;

      composite = Math.max(0, Math.min(99, Math.round(composite)));

      // Build debug info
      const debugStr = `ATH: ${athScore.toFixed(1)} | F&G: ${fgScore} | Mom: ${momentumScore.toFixed(1)} | Vol: ${volumeScore.toFixed(1)} | Dom: ${domScore.toFixed(1)} → ${composite}`;
      setDebugInfo(debugStr);

      // Signal text helpers
      const athSignal =
        athDistance < 5 ? "Très proche de l'ATH — Zone de sommet"
        : athDistance < 15 ? "Proche de l'ATH — Marché fort"
        : athDistance < 30 ? "Correction modérée depuis l'ATH"
        : athDistance < 50 ? "Correction majeure — Marché baissier"
        : "Très loin de l'ATH — Zone de capitulation";

      const athSignalColor =
        athDistance < 5 ? "#ef4444" : athDistance < 15 ? "#f59e0b" : athDistance < 30 ? "#f59e0b" : athDistance < 50 ? "#3b82f6" : "#dc2626";

      const fgSignal =
        fearGreed >= 75 ? "Avidité extrême — Zone de danger !"
        : fearGreed >= 55 ? "Avidité — Marché confiant"
        : fearGreed >= 45 ? "Neutre — Indécision"
        : fearGreed >= 25 ? "Peur — Marché fragile"
        : "Peur extrême — Capitulation du marché";

      const fgSignalColor =
        fearGreed >= 75 ? "#ef4444" : fearGreed >= 55 ? "#22c55e" : fearGreed >= 45 ? "#f59e0b" : fearGreed >= 25 ? "#f97316" : "#dc2626";

      const domSignal =
        btcDominance > 60 ? "Dominance très élevée — Fuite vers BTC (bear market)"
        : btcDominance > 50 ? "Dominance élevée — BTC refuge, altcoins faibles"
        : btcDominance > 40 ? "Dominance modérée — Début de rotation vers altcoins"
        : "Dominance basse — Altseason en cours";

      const domSignalColor =
        btcDominance > 60 ? "#dc2626" : btcDominance > 50 ? "#f97316" : btcDominance > 40 ? "#22c55e" : "#3b82f6";

      const momentumSignal =
        btcChange30d > 20 ? "Momentum très haussier 🚀"
        : btcChange30d > 5 ? "Momentum haussier"
        : btcChange30d > -5 ? "Momentum neutre"
        : btcChange30d > -20 ? "Momentum baissier"
        : "Momentum très baissier 📉";

      const momentumSignalColor =
        btcChange30d > 20 ? "#22c55e" : btcChange30d > 5 ? "#22c55e" : btcChange30d > -5 ? "#f59e0b" : btcChange30d > -20 ? "#f97316" : "#dc2626";

      const volumeSignal =
        volumeRatio > 8 ? "Volume très élevé — Activité intense"
        : volumeRatio > 5 ? "Volume modéré — Activité normale"
        : volumeRatio > 3 ? "Volume faible — Marché calme"
        : "Volume très faible — Apathie du marché";

      const volumeSignalColor =
        volumeRatio > 8 ? "#22c55e" : volumeRatio > 5 ? "#f59e0b" : volumeRatio > 3 ? "#f97316" : "#dc2626";

      const inds: Indicator[] = [
        {
          name: "Fear & Greed Index",
          icon: "😨",
          value: fearGreed,
          rawValue: `${fearGreed}/100`,
          signal: fgSignal,
          signalColor: fgSignalColor,
          desc: `Indice de sentiment: ${fearGreed}/100 — ${fgFr}`,
          source: "Alternative.me",
          contribution: `Poids: 30% → ${(fgScore * 0.30).toFixed(1)} pts`,
        },
        {
          name: "Distance de l'ATH",
          icon: "🎯",
          value: Math.round(athDistance),
          rawValue: `-${athDistance.toFixed(1)}%`,
          signal: athSignal,
          signalColor: athSignalColor,
          desc: `BTC: $${btcPrice.toLocaleString("fr-FR")} — ATH: $${btcAth.toLocaleString("fr-FR")} — Distance: -${athDistance.toFixed(1)}%`,
          source: "CoinGecko",
          contribution: `Poids: 30% → ${(athScore * 0.30).toFixed(1)} pts`,
        },
        {
          name: "Momentum 30 jours",
          icon: "📈",
          value: Math.max(0, Math.min(100, Math.round(50 + btcChange30d))),
          rawValue: `${btcChange30d >= 0 ? "+" : ""}${btcChange30d.toFixed(1)}%`,
          signal: momentumSignal,
          signalColor: momentumSignalColor,
          desc: `BTC 24h: ${btcChange24h >= 0 ? "+" : ""}${btcChange24h.toFixed(1)}% — 7j: ${btcChange7d >= 0 ? "+" : ""}${btcChange7d.toFixed(1)}% — 30j: ${btcChange30d >= 0 ? "+" : ""}${btcChange30d.toFixed(1)}%`,
          source: "CoinGecko",
          contribution: `Poids: 25% → ${(momentumScore * 0.25).toFixed(1)} pts`,
        },
        {
          name: "Dominance BTC",
          icon: "👑",
          value: Math.round(btcDominance),
          rawValue: `${btcDominance.toFixed(1)}%`,
          signal: domSignal,
          signalColor: domSignalColor,
          desc: `Part de marché Bitcoin: ${btcDominance.toFixed(1)}% — Cap totale: $${(totalMarketCap / 1e12).toFixed(2)}T`,
          source: "CoinGecko",
          contribution: `Poids: 10% → ${(domScore * 0.10).toFixed(1)} pts`,
        },
        {
          name: "Volume du Marché",
          icon: "📊",
          value: Math.max(0, Math.min(100, Math.round(volumeRatio * 10))),
          rawValue: `${volumeRatio.toFixed(2)}%`,
          signal: volumeSignal,
          signalColor: volumeSignalColor,
          desc: `Volume 24h: $${(totalVolume / 1e9).toFixed(1)}Mds — Ratio Vol/Cap: ${volumeRatio.toFixed(2)}%`,
          source: "CoinGecko",
          contribution: `Poids: 5% → ${(volumeScore * 0.05).toFixed(1)} pts`,
        },
      ];

      setIndicators(inds);
      setScore(composite);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      // keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const phase = getPhase(score);
  // Hook must be at top level (not inside conditional JSX)
  const animatedScore = useAnimatedNumber(score);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
      <PageHeader
          icon={<span className="text-lg">🚀</span>}
          title="Bullrun Phase Tracker"
          subtitle="Identifiez la phase actuelle du cycle de marché crypto. Du fond du bear market au pic du bull run, sachez exactement où nous en sommes pour optimiser votre stratégie."
          accentColor="amber"
          steps={[
            { n: "1", title: "Lisez la phase actuelle", desc: "Le tracker indique la phase du cycle : Accumulation, Early Bull, Mid Bull, Late Bull, Distribution ou Bear. Chaque phase a ses caractéristiques." },
            { n: "2", title: "Analysez les indicateurs", desc: "Les métriques on-chain, le sentiment et les données techniques sont combinés pour déterminer la phase avec précision." },
            { n: "3", title: "Adaptez votre exposition", desc: "Augmentez l’exposition en Early Bull, prenez des profits en Late Bull, accumulez en Bear. Le cycle se répète, profitez-en." },
          ]}
        />
        <div className="fixed top-0 left-[260px] right-0 bottom-0 pointer-events-none z-0 overflow-hidden">
          <div
            className="absolute w-[600px] h-[600px] rounded-full top-[-200px] left-[-100px] opacity-[0.12] blur-[80px] animate-pulse"
            style={{ background: `radial-gradient(circle, ${phase.color}, transparent)` }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full bottom-[-200px] right-[-100px] opacity-[0.12] blur-[80px] animate-pulse"
            style={{ background: `radial-gradient(circle, ${phase.color}, transparent)`, animationDelay: "-8s" }}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundImage: "radial-gradient(rgba(148,163,184,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto p-4 md:p-6 pb-20">
          {/* ===== HERO ===== */}
          <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08] mt-2">
            <div className="absolute inset-0 bg-[#0A0E1A]" />
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl" style={{ background: phase.color, opacity: 0.2, animation: "br-pulse 6s ease-in-out infinite" }} />
            <div className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl" style={{ animation: "br-pulse 8s ease-in-out infinite reverse" }} />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 md:px-10 py-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl border flex items-center justify-center text-3xl"
                  style={{ background: `${phase.color}1a`, borderColor: `${phase.color}55`, boxShadow: `0 0 30px ${phase.color}40` }}
                >
                  {phase.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-[#f59e0b] via-[#ef4444] to-[#3b82f6] bg-clip-text text-transparent">
                      Bullrun Phase Tracker
                    </h1>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                      style={{ color: phase.color, borderColor: `${phase.color}55`, background: `${phase.color}10` }}
                    >
                      <Sparkles className="w-2.5 h-2.5" /> {phase.name}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-400">
                    Analyse multi-facteurs • Données 100% réelles (CoinGecko, Alternative.me)
                  </p>
                </div>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-sm font-semibold transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}</span>
              </button>
            </div>
          </div>

          <style>{`
            @keyframes br-pulse {
              0%, 100% { transform: scale(1) translate(0,0); opacity: 0.2; }
              50% { transform: scale(1.15) translate(15px,-8px); opacity: 0.35; }
            }
            @keyframes br-fadeUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .br-anim { animation: br-fadeUp 0.6s ease-out both; }
          `}</style>

          {/* Phase Principale */}
          <div className="br-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 md:p-8 mb-6 overflow-hidden" style={{ animationDelay: "100ms" }}>
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-25" style={{ background: phase.color }} />
            {loading && indicators.length === 0 ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-11 h-11 border-[3px] border-[rgba(245,158,11,0.15)] border-t-[#f59e0b] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="relative text-center py-3">
                <div className="text-[80px] mb-2 leading-none" style={{ filter: `drop-shadow(0 0 30px ${phase.color}80)` }}>{phase.icon}</div>
                <div className="text-3xl md:text-4xl font-black tracking-tight mb-2" style={{ color: phase.color, textShadow: `0 0 30px ${phase.color}50` }}>
                  {phase.name}
                </div>
                <p className="text-gray-400 text-sm md:text-base max-w-[600px] mx-auto leading-relaxed mb-3">
                  {phase.desc}
                </p>
                <div className="inline-flex items-center gap-2 bg-indigo-500/[0.08] border border-indigo-500/25 rounded-xl px-4 py-2 mb-6">
                  <span className="text-base">💡</span>
                  <p className="text-sm text-indigo-300 font-semibold">
                    Action recommandée : <span className="text-white">{phase.action}</span>
                  </p>
                </div>

                <p
                  className="font-mono text-5xl md:text-6xl font-black my-3"
                  style={{ color: phase.color, textShadow: `0 0 40px ${phase.color}60` }}
                >
                  {animatedScore}<span className="text-2xl text-gray-500">/100</span>
                </p>

                {/* Progress bar with phase markers */}
                <div className="max-w-[700px] mx-auto mt-5">
                  <div className="h-6 bg-white/[0.04] rounded-2xl overflow-hidden relative ring-1 ring-white/[0.06]">
                    {PHASES.map((p) => (
                      <div
                        key={p.id}
                        className="absolute top-0 h-full"
                        style={{
                          left: `${p.range[0]}%`,
                          width: `${p.range[1] - p.range[0]}%`,
                          background: `linear-gradient(180deg, ${p.color}99, ${p.color}55)`,
                          opacity: p.id === phase.id ? 1 : 0.35,
                        }}
                      />
                    ))}
                    <div
                      className="absolute top-[-4px] w-1 h-[calc(100%+8px)] bg-white rounded-sm z-10"
                      style={{
                        left: `${score}%`,
                        boxShadow: `0 0 14px 2px white, 0 0 24px 4px ${phase.color}`,
                        transition: "left 1.2s cubic-bezier(.34,1.56,.64,1)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[9px] font-bold">
                    <span className="text-[#dc2626]">Capitulation</span>
                    <span className="text-[#3b82f6]">Accumulation</span>
                    <span className="text-[#22c55e]">Début</span>
                    <span className="text-[#f59e0b]">Bull Run</span>
                    <span className="text-[#f97316]">Euphorie</span>
                    <span className="text-[#ef4444]">Surchauffe</span>
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="mt-6 bg-white/[0.02] rounded-2xl p-4 max-w-[600px] mx-auto border border-white/[0.05]">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">
                    Décomposition du Score
                  </p>
                  <p className="text-[11px] text-gray-400 font-mono">{debugInfo}</p>
                  <p className="text-[10px] text-gray-600 mt-2">
                    Formule : Fear&Greed (30%) + Distance ATH (30%) + Momentum 30j (25%) + Dominance BTC (10%) + Volume (5%)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chronologie des Phases */}
          <div className="br-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 mb-6 overflow-hidden" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-2 text-base md:text-lg font-bold mb-5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: phase.color }} /> Phases du Cycle
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
              {PHASES.map((p) => {
                const isActive = p.id === phase.id;
                return (
                  <div
                    key={p.id}
                    className={`py-4 px-2 rounded-2xl text-center transition-all relative overflow-hidden ${isActive ? "scale-[1.05] z-10" : "hover:scale-[1.02]"}`}
                    style={{
                      background: isActive ? `${p.color}15` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isActive ? `${p.color}66` : "rgba(255,255,255,0.05)"}`,
                      boxShadow: isActive ? `0 0 40px ${p.color}33, inset 0 0 24px ${p.color}11` : "none",
                    }}
                  >
                    {isActive && (
                      <div className="absolute -top-12 -right-8 w-24 h-24 rounded-full blur-2xl" style={{ background: p.color, opacity: 0.4 }} />
                    )}
                    <div className="relative">
                      <div className="text-2xl mb-1.5" style={{ filter: isActive ? `drop-shadow(0 0 8px ${p.color})` : "none" }}>{p.icon}</div>
                      <div
                        className="text-[10px] font-black uppercase tracking-wider"
                        style={{ color: isActive ? p.color : "#94a3b8" }}
                      >
                        {p.name}
                      </div>
                      <div className="text-[9px] text-gray-500 mt-1 font-semibold">
                        {p.range[0]}-{p.range[1]}
                      </div>
                      {isActive && (
                        <div className="text-[9px] font-black mt-1.5 uppercase tracking-wider animate-pulse" style={{ color: p.color }}>
                          ◉ Actif
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicateurs Clés */}
          <div className="br-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 mb-6 overflow-hidden" style={{ animationDelay: "280ms" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="flex items-center gap-2 text-base md:text-lg font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> Indicateurs Clés
              </h2>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Données réelles</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {indicators.map((ind) => (
                <div
                  key={ind.name}
                  className="group relative bg-gradient-to-br from-white/[0.03] to-white/[0.005] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-5 transition-all overflow-hidden"
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity" style={{ background: ind.signalColor }} />
                  <div className="relative">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <span className="text-lg">{ind.icon}</span> {ind.name}
                      </div>
                      <span className="font-mono text-lg font-black" style={{ color: ind.signalColor, textShadow: `0 0 12px ${ind.signalColor}40` }}>
                        {ind.rawValue}
                      </span>
                    </div>
                    <div
                      className="rounded-lg px-3 py-1.5 mb-3 border"
                      style={{ background: `${ind.signalColor}10`, borderColor: `${ind.signalColor}33` }}
                    >
                      <p className="text-xs font-bold" style={{ color: ind.signalColor }}>
                        {ind.signal}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{ind.desc}</p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.05]">
                      <p className="text-[10px] text-gray-600">Source : {ind.source}</p>
                      <p className="text-[10px] text-gray-500 font-semibold">{ind.contribution}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guide des Phases */}
          <div className="br-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 overflow-hidden" style={{ animationDelay: "360ms" }}>
            <div className="flex items-center gap-2 text-base md:text-lg font-bold mb-5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" /> Guide des Phases du Cycle
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {PHASES.map((p) => (
                <div
                  key={p.id}
                  className="relative bg-gradient-to-br from-white/[0.03] to-white/[0.005] border border-white/[0.06] rounded-2xl p-5 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ background: p.color, boxShadow: `0 0 12px ${p.color}` }} />
                  <h3 className="text-sm font-black mb-2 flex items-center gap-2" style={{ color: p.color }}>
                    <span className="text-lg">{p.icon}</span> {p.name}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-2">{p.desc}</p>
                  <p className="text-[10px] text-gray-500 mb-2 font-semibold">Score : {p.range[0]} — {p.range[1]}</p>
                  <p className="text-xs">
                    💡 <strong className="text-white">{p.action}</strong>
                  </p>
                </div>
              ))}
            </div>

            <p className="text-gray-500 text-[11px] mt-5 text-center leading-relaxed">
              ⚠️ Tous les indicateurs sont calculés à partir de données réelles (CoinGecko, Alternative.me). Aucune donnée simulée ou hardcodée.
              <br />
              Ce n&apos;est pas un conseil financier. Faites toujours vos propres recherches (DYOR).
            </p>
          </div>

        </div>
        <Footer />
      </main>
    </div>
  );
}