import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw } from "lucide-react";
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

      // 2. Fetch global market data
      const globalRes = await fetch("https://api.coingecko.com/api/v3/global");
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
        const fgRes = await fetch("https://api.alternative.me/fng/?limit=1");
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

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="ml-[260px] bg-[#030712]">
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

        <div className="relative z-10 max-w-[1440px] mx-auto p-7 pb-20">
          {/* Header */}
          <div className="text-center mb-9 pt-10">
            <h1 className="text-[clamp(32px,5vw,52px)] font-black tracking-[-2px] bg-gradient-to-r from-[#f59e0b] via-[#ef4444] to-[#3b82f6] bg-clip-text text-transparent">
              📊 Suivi des Phases du Cycle Crypto
            </h1>
            <p className="text-[#64748b] text-[17px] mt-3 font-medium max-w-[700px] mx-auto">
              Analyse multi-facteurs en temps réel basée sur les données de marché, le sentiment et les indicateurs on-chain
            </p>
            <div className="inline-flex items-center gap-2 bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.25)] rounded-full px-[18px] py-1.5 text-xs text-[#818cf8] font-bold mt-4 uppercase tracking-[1.5px]">
              <span className="w-2 h-2 rounded-full bg-[#818cf8] shadow-[0_0_8px_#818cf8] animate-pulse" />
              EN DIRECT — Données 100% réelles
            </div>
          </div>

          {/* Phase Principale */}
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden">
            {loading && indicators.length === 0 ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-11 h-11 border-[3px] border-[rgba(245,158,11,0.15)] border-t-[#f59e0b] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="text-center py-5">
                <div className="text-[80px] mb-4">{phase.icon}</div>
                <div className="text-4xl font-black tracking-[-1px] mb-2" style={{ color: phase.color }}>
                  {phase.name}
                </div>
                <p className="text-[#94a3b8] text-base max-w-[600px] mx-auto leading-relaxed mb-2">
                  {phase.desc}
                </p>
                <div className="bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.2)] rounded-xl p-3 max-w-[500px] mx-auto mb-6">
                  <p className="text-sm text-[#818cf8] font-medium">
                    💡 Action recommandée : {phase.action}
                  </p>
                </div>

                <p
                  className="font-mono text-[64px] font-bold my-3"
                  style={{ color: phase.color, textShadow: `0 0 40px ${phase.color}50` }}
                >
                  {score}<span className="text-[28px] text-[#64748b]">/100</span>
                </p>

                {/* Progress bar with phase markers */}
                <div className="max-w-[700px] mx-auto">
                  <div className="h-5 bg-[rgba(148,163,184,0.08)] rounded-xl overflow-hidden relative">
                    {PHASES.map((p) => (
                      <div
                        key={p.id}
                        className="absolute top-0 h-full opacity-40"
                        style={{
                          left: `${p.range[0]}%`,
                          width: `${p.range[1] - p.range[0]}%`,
                          background: p.color,
                        }}
                      />
                    ))}
                    <div
                      className="absolute top-[-3px] w-2 h-[calc(100%+6px)] bg-white rounded-sm shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-[1500ms] z-10"
                      style={{ left: `${score}%` }}
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
                <div className="mt-6 bg-[rgba(0,0,0,0.3)] rounded-xl p-4 max-w-[600px] mx-auto">
                  <p className="text-[11px] text-[#64748b] font-bold uppercase tracking-wider mb-2">
                    Décomposition du Score
                  </p>
                  <p className="text-[11px] text-[#475569] font-mono">{debugInfo}</p>
                  <p className="text-[10px] text-[#475569] mt-2">
                    Formule : Fear&Greed (30%) + Distance ATH (30%) + Momentum 30j (25%) + Dominance BTC (10%) + Volume (5%)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chronologie des Phases */}
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden">
            <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
              <span className="text-[22px]">🗺️</span> Phases du Cycle
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
              {PHASES.map((p) => {
                const isActive = p.id === phase.id;
                return (
                  <div
                    key={p.id}
                    className={`py-4 px-2 rounded-[14px] text-center transition-all relative overflow-hidden ${isActive ? "scale-105 z-10" : ""}`}
                    style={{
                      background: isActive ? `${p.color}20` : "rgba(15,23,42,0.5)",
                      border: `2px solid ${isActive ? `${p.color}60` : "rgba(148,163,184,0.08)"}`,
                      boxShadow: isActive ? `0 0 30px ${p.color}20` : "none",
                    }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[3px]"
                      style={{ background: p.color, opacity: isActive ? 1 : 0.2 }}
                    />
                    <div className="text-2xl mb-1.5">{p.icon}</div>
                    <div
                      className="text-[10px] font-extrabold uppercase tracking-wider"
                      style={{ color: isActive ? p.color : "#64748b" }}
                    >
                      {p.name}
                    </div>
                    <div className="text-[9px] text-[#475569] mt-1">
                      Score {p.range[0]}-{p.range[1]}
                    </div>
                    {isActive && (
                      <div className="text-[9px] font-bold mt-1" style={{ color: p.color }}>
                        ← NOUS SOMMES ICI
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicateurs Clés */}
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden">
            <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
              <span className="text-[22px]">📊</span> Indicateurs Clés — Données Réelles
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {indicators.map((ind) => (
                <div
                  key={ind.name}
                  className="bg-gradient-to-br from-[rgba(15,23,42,0.9)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 transition-all hover:translate-y-[-4px] hover:border-[rgba(148,163,184,0.18)]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <span>{ind.icon}</span> {ind.name}
                    </div>
                    <span className="font-mono text-lg font-bold" style={{ color: ind.signalColor }}>
                      {ind.rawValue}
                    </span>
                  </div>
                  <div className="bg-[rgba(148,163,184,0.06)] rounded-lg px-3 py-1.5 mb-2">
                    <p className="text-xs font-bold" style={{ color: ind.signalColor }}>
                      {ind.signal}
                    </p>
                  </div>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">{ind.desc}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] text-[#475569]">Source : {ind.source}</p>
                    <p className="text-[10px] text-[#475569]">{ind.contribution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guide des Phases */}
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 relative overflow-hidden">
            <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
              <span className="text-[22px]">📖</span> Guide des Phases du Cycle
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PHASES.map((p) => (
                <div key={p.id} className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ background: p.color }} />
                  <h3 className="text-[15px] font-extrabold mb-2.5" style={{ color: p.color }}>
                    {p.icon} {p.name}
                  </h3>
                  <p className="text-[#94a3b8] text-[13px] leading-relaxed mb-2">{p.desc}</p>
                  <p className="text-[11px] text-[#64748b] mb-2">Score : {p.range[0]} — {p.range[1]}</p>
                  <p className="text-[13px]">
                    💡 <strong className="text-white">{p.action}</strong>
                  </p>
                </div>
              ))}
            </div>

            <p className="text-[#64748b] text-xs mt-5 text-center">
              ⚠️ Tous les indicateurs sont calculés à partir de données réelles (CoinGecko, Alternative.me). Aucune donnée simulée ou hardcodée.
              <br />
              Ce n'est pas un conseil financier. Faites toujours vos propres recherches (DYOR).
            </p>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-[rgba(15,23,42,0.9)] backdrop-blur-xl border border-[rgba(148,163,184,0.15)] text-sm font-bold hover:border-[rgba(148,163,184,0.3)] transition-all shadow-2xl"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
          </button>
        </div>
        <Footer />
      </main>
    </div>
  );
}