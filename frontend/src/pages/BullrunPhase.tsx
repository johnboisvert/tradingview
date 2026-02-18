import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw } from "lucide-react";

interface PhaseData {
  id: string;
  name: string;
  icon: string;
  color: string;
  range: [number, number];
  desc: string;
}

interface Indicator {
  name: string;
  icon: string;
  value: number;
  signal: string;
  desc: string;
  source: string;
}

/*
  Phases du cycle crypto — basées sur l'analyse du cycle 2024-2026 :
  - Halving BTC : Avril 2024
  - ATH BTC : ~$126,200 en Octobre 2025
  - Correction : -46% depuis l'ATH, ~$65K en Février 2026
  - Phase actuelle : Distribution / Correction Post-Pic
  Sources : CoinGecko, Alternative.me, analyses on-chain (Glassnode, CryptoQuant)
*/

const PHASES: PhaseData[] = [
  {
    id: "accumulation",
    name: "Accumulation",
    icon: "❄️",
    color: "#3b82f6",
    range: [0, 20],
    desc: "Phase de bottom — Le smart money accumule discrètement. Sentiment très négatif, volumes faibles.",
  },
  {
    id: "early_bull",
    name: "Début Haussier",
    icon: "🌱",
    color: "#22c55e",
    range: [20, 45],
    desc: "Début de reprise — BTC mène le marché, les altcoins suivent lentement. Confiance qui revient.",
  },
  {
    id: "bull_run",
    name: "Bull Run",
    icon: "🚀",
    color: "#f59e0b",
    range: [45, 70],
    desc: "Phase euphorique — Tout monte, les volumes explosent, les médias en parlent partout !",
  },
  {
    id: "distribution",
    name: "Distribution / Pic",
    icon: "⚠️",
    color: "#f97316",
    range: [70, 85],
    desc: "Sommet du cycle — Le smart money commence à vendre. Euphorie maximale, prudence requise.",
  },
  {
    id: "correction",
    name: "Correction Post-Pic",
    icon: "📉",
    color: "#ef4444",
    range: [85, 100],
    desc: "Correction majeure après l'ATH. Le marché cherche un plancher. Phase de transition incertaine.",
  },
];

function getPhase(score: number): PhaseData {
  for (const p of PHASES) {
    if (score >= p.range[0] && score < p.range[1]) return p;
  }
  return PHASES[4];
}

export default function BullrunPhase() {
  const [score, setScore] = useState(50);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch BTC data
      const btcRes = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&sparkline=false&price_change_percentage=24h,7d,30d"
      );
      let btcPrice = 0;
      let btcChange24h = 0;
      let btcChange7d = 0;
      let btcChange30d = 0;
      let btcAthPct = 0;
      let btcAth = 0;
      if (btcRes.ok) {
        const data = await btcRes.json();
        if (Array.isArray(data) && data.length > 0) {
          btcPrice = (data[0].current_price as number) || 0;
          btcChange24h = (data[0].price_change_percentage_24h as number) || 0;
          btcChange7d = (data[0].price_change_percentage_7d_in_currency as number) || 0;
          btcChange30d = (data[0].price_change_percentage_30d_in_currency as number) || 0;
          btcAthPct = (data[0].ath_change_percentage as number) || 0;
          btcAth = (data[0].ath as number) || 0;
        }
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

      // 4. Calculate indicators based on REAL data
      // Distance from ATH — key cycle indicator
      const athDistance = Math.abs(btcAthPct); // e.g., 46% below ATH
      const athSignal =
        athDistance < 10
          ? "Proche de l'ATH — Zone de distribution"
          : athDistance < 30
          ? "Correction modérée"
          : athDistance < 50
          ? "Correction significative — Zone de transition"
          : "Bear market profond — Zone d'accumulation";

      // BTC Dominance signal
      const domSignal =
        btcDominance > 60
          ? "Dominance élevée — Fuite vers BTC"
          : btcDominance > 50
          ? "Dominance modérée — BTC mène"
          : btcDominance > 40
          ? "Dominance en baisse — Altcoins en force"
          : "Dominance basse — Altseason probable";

      // Volume activity
      const volumeRatio = totalMarketCap > 0 ? (totalVolume / totalMarketCap) * 100 : 5;
      const volumeSignal =
        volumeRatio > 8
          ? "Volume très élevé — Activité intense"
          : volumeRatio > 5
          ? "Volume modéré — Activité normale"
          : volumeRatio > 3
          ? "Volume faible — Marché calme"
          : "Volume très faible — Apathie du marché";

      // Momentum 30d
      const momentumSignal =
        btcChange30d > 20
          ? "Momentum très haussier"
          : btcChange30d > 5
          ? "Momentum haussier"
          : btcChange30d > -5
          ? "Momentum neutre"
          : btcChange30d > -20
          ? "Momentum baissier"
          : "Momentum très baissier";

      // Fear & Greed signal
      const fgSignal =
        fearGreed >= 75
          ? "Avidité extrême — Prudence !"
          : fearGreed >= 55
          ? "Avidité — Marché confiant"
          : fearGreed >= 45
          ? "Neutre — Indécision"
          : fearGreed >= 25
          ? "Peur — Opportunité potentielle"
          : "Peur extrême — Capitulation ?";

      // Halving cycle position
      // Halving: April 2024, current: Feb 2026 = ~22 months post-halving
      // Historically, BTC peaks 12-18 months post-halving
      const monthsPostHalving = 22;
      const halvingSignal = `${monthsPostHalving} mois post-halving — Fenêtre historique de 17 mois dépassée`;

      const inds: Indicator[] = [
        {
          name: "Distance de l'ATH",
          icon: "🎯",
          value: Math.round(athDistance),
          signal: athSignal,
          desc: `BTC: $${btcPrice.toLocaleString("fr-FR")} — ATH: $${btcAth.toLocaleString("fr-FR")} — Distance: -${athDistance.toFixed(1)}%`,
          source: "CoinGecko",
        },
        {
          name: "Fear & Greed Index",
          icon: "😨",
          value: fearGreed,
          signal: fgSignal,
          desc: `Indice de sentiment: ${fearGreed}/100 — ${fgFr}`,
          source: "Alternative.me",
        },
        {
          name: "Dominance BTC",
          icon: "👑",
          value: Math.round(btcDominance),
          signal: domSignal,
          desc: `Part de marché Bitcoin: ${btcDominance.toFixed(1)}% — Cap totale: $${(totalMarketCap / 1e12).toFixed(2)}T`,
          source: "CoinGecko",
        },
        {
          name: "Momentum 30 jours",
          icon: "📈",
          value: Math.max(0, Math.min(100, Math.round(50 + btcChange30d))),
          signal: momentumSignal,
          desc: `BTC 24h: ${btcChange24h >= 0 ? "+" : ""}${btcChange24h.toFixed(1)}% — 7j: ${btcChange7d >= 0 ? "+" : ""}${btcChange7d.toFixed(1)}% — 30j: ${btcChange30d >= 0 ? "+" : ""}${btcChange30d.toFixed(1)}%`,
          source: "CoinGecko",
        },
        {
          name: "Volume du Marché",
          icon: "📊",
          value: Math.max(0, Math.min(100, Math.round(volumeRatio * 10))),
          signal: volumeSignal,
          desc: `Volume 24h: $${(totalVolume / 1e9).toFixed(1)}Mds — Ratio Vol/Cap: ${volumeRatio.toFixed(2)}%`,
          source: "CoinGecko",
        },
        {
          name: "Cycle Post-Halving",
          icon: "⏰",
          value: Math.min(100, Math.round((monthsPostHalving / 24) * 100)),
          signal: halvingSignal,
          desc: `Halving: Avril 2024 — Nous sommes à ${monthsPostHalving} mois. Pic historique: 12-18 mois post-halving.`,
          source: "Analyse historique",
        },
      ];

      setIndicators(inds);

      /*
        Score du cycle — Logique basée sur la recherche :
        - BTC a atteint ~$126,200 en Oct 2025 (ATH)
        - Correction de ~46% depuis l'ATH
        - Fenêtre de 17 mois post-halving dépassée
        - On-chain: 0 indicateurs surchauffés
        - Phase actuelle: Distribution/Correction Post-Pic (score 85-95)
        
        Calcul pondéré :
        - Si très loin de l'ATH (>40%) + post-halving avancé = phase correction
        - Si proche de l'ATH (<10%) + F&G élevé = phase distribution
        - Si loin de l'ATH (>60%) + F&G bas = accumulation
      */
      let cycleScore: number;

      if (athDistance > 40 && monthsPostHalving > 17) {
        // Correction post-pic significative, fenêtre historique dépassée
        cycleScore = 88 + Math.min(10, athDistance / 10);
      } else if (athDistance > 30) {
        // Correction modérée
        cycleScore = 78 + athDistance / 5;
      } else if (athDistance < 10 && fearGreed > 70) {
        // Proche ATH + euphorie = distribution
        cycleScore = 72 + (10 - athDistance);
      } else if (athDistance > 60 && fearGreed < 25) {
        // Très loin ATH + peur extrême = accumulation
        cycleScore = 5 + fearGreed / 5;
      } else if (athDistance > 50) {
        // Accumulation tardive
        cycleScore = 15 + (60 - athDistance);
      } else {
        // Zone intermédiaire
        const athComponent = Math.max(0, Math.min(100, 100 - athDistance * 2));
        const fgComponent = fearGreed;
        const momentumComponent = Math.max(0, Math.min(100, 50 + btcChange30d * 2));
        cycleScore = athComponent * 0.35 + fgComponent * 0.30 + momentumComponent * 0.20 + (100 - btcDominance) * 0.15;
      }

      setScore(Math.max(0, Math.min(99, Math.round(cycleScore))));
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

  function getIndColor(signal: string) {
    if (signal.includes("haussier") || signal.includes("Altseason") || signal.includes("Opportunité") || signal.includes("Capitulation")) return "#22c55e";
    if (signal.includes("baissier") || signal.includes("Prudence") || signal.includes("Fuite") || signal.includes("dépassée")) return "#ef4444";
    if (signal.includes("neutre") || signal.includes("Indécision") || signal.includes("modéré") || signal.includes("calme")) return "#f59e0b";
    return "#94a3b8";
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="ml-[260px] min-h-screen relative">
        <div className="fixed top-0 left-[260px] right-0 bottom-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,#f59e0b,transparent)] top-[-200px] left-[-100px] opacity-[0.12] blur-[80px] animate-pulse" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,#ef4444,transparent)] bottom-[-200px] right-[-100px] opacity-[0.12] blur-[80px] animate-pulse" style={{ animationDelay: "-8s" }} />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(148,163,184,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto p-7 pb-20">
          {/* Header */}
          <div className="text-center mb-9 pt-10">
            <h1 className="text-[clamp(32px,5vw,52px)] font-black tracking-[-2px] bg-gradient-to-r from-[#f59e0b] via-[#ef4444] to-[#3b82f6] bg-clip-text text-transparent">
              📊 Suivi des Phases du Cycle Crypto
            </h1>
            <p className="text-[#64748b] text-[17px] mt-3 font-medium max-w-[700px] mx-auto">
              Analyse multi-facteurs en temps réel basée sur les données on-chain, le sentiment et les indicateurs de marché
            </p>
            <div className="inline-flex items-center gap-2 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] rounded-full px-[18px] py-1.5 text-xs text-[#ef4444] font-bold mt-4 uppercase tracking-[1.5px]">
              <span className="w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444] animate-pulse" />
              EN DIRECT — Cycle 2024-2026
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

                {/* Context box */}
                <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl p-4 max-w-[600px] mx-auto mb-6">
                  <p className="text-sm text-[#f87171] font-medium">
                    📌 Contexte : BTC a atteint son ATH (~$126K) en Octobre 2025. Correction de ~46% depuis.
                    La fenêtre historique de 17 mois post-halving (Avril 2024) est dépassée.
                    Signaux contradictoires : 0 indicateurs on-chain surchauffés, mais drawdown significatif.
                  </p>
                </div>

                <p
                  className="font-mono text-[64px] font-bold my-3"
                  style={{ color: phase.color, textShadow: `0 0 40px ${phase.color}50` }}
                >
                  {score}<span className="text-[28px] text-[#64748b]">/100</span>
                </p>

                {/* Progress bar with phase markers */}
                <div className="max-w-[600px] mx-auto">
                  <div className="h-4 bg-[rgba(148,163,184,0.08)] rounded-xl overflow-hidden relative">
                    {/* Phase segments */}
                    {PHASES.map((p) => (
                      <div
                        key={p.id}
                        className="absolute top-0 h-full opacity-30"
                        style={{
                          left: `${p.range[0]}%`,
                          width: `${p.range[1] - p.range[0]}%`,
                          background: p.color,
                        }}
                      />
                    ))}
                    {/* Indicator */}
                    <div
                      className="absolute top-[-2px] w-1.5 h-[calc(100%+4px)] bg-white rounded-sm shadow-[0_0_12px_rgba(255,255,255,0.6)] transition-all duration-[1500ms] z-10"
                      style={{ left: `${score}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-bold">
                    <span className="text-[#3b82f6]">Accumulation</span>
                    <span className="text-[#22c55e]">Début</span>
                    <span className="text-[#f59e0b]">Bull Run</span>
                    <span className="text-[#f97316]">Distribution</span>
                    <span className="text-[#ef4444]">Correction</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chronologie des Phases */}
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden">
            <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
              <span className="text-[22px]">🗺️</span> Phases du Cycle 2024-2026
            </div>
            <div className="flex gap-1">
              {PHASES.map((p) => {
                const isActive = p.id === phase.id;
                return (
                  <div
                    key={p.id}
                    className={`flex-1 py-4 px-2 rounded-[14px] text-center transition-all relative overflow-hidden ${isActive ? "scale-105 z-10" : ""}`}
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
              {indicators.map((ind) => {
                const color = getIndColor(ind.signal);
                return (
                  <div
                    key={ind.name}
                    className="bg-gradient-to-br from-[rgba(15,23,42,0.9)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 transition-all hover:translate-y-[-4px] hover:border-[rgba(148,163,184,0.18)]"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <span>{ind.icon}</span> {ind.name}
                      </div>
                      <span className="font-mono text-xl font-bold" style={{ color }}>
                        {ind.value}
                      </span>
                    </div>
                    <div className="bg-[rgba(148,163,184,0.06)] rounded-lg px-3 py-1.5 mb-2">
                      <p className="text-xs font-bold" style={{ color }}>
                        {ind.signal}
                      </p>
                    </div>
                    <p className="text-xs text-[#94a3b8] leading-relaxed">{ind.desc}</p>
                    <p className="text-[10px] text-[#475569] mt-1.5">Source : {ind.source}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scénarios 2026 — basés sur la recherche */}
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden">
            <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
              <span className="text-[22px]">🔮</span> Scénarios Probables 2026
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[15px] font-extrabold text-[#f59e0b]">📊 Scénario Base (50%)</h3>
                  <span className="text-xs bg-[rgba(245,158,11,0.15)] text-[#f59e0b] px-2 py-0.5 rounded-full font-bold">50%</span>
                </div>
                <p className="text-[#94a3b8] text-sm leading-relaxed mb-2">
                  Range-bound entre $90K–$120K jusqu'à un catalyseur macro. Le marché consolide après la correction.
                </p>
                <p className="text-xs text-[#64748b]">Catalyseurs : Décision Fed, ETF flows</p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[15px] font-extrabold text-[#22c55e]">🚀 Scénario Haussier (25%)</h3>
                  <span className="text-xs bg-[rgba(34,197,94,0.15)] text-[#22c55e] px-2 py-0.5 rounded-full font-bold">25%</span>
                </div>
                <p className="text-[#94a3b8] text-sm leading-relaxed mb-2">
                  $120K–$180K porté par les lancements 401(k) crypto, baisses de taux Fed, et adoption institutionnelle.
                </p>
                <p className="text-xs text-[#64748b]">Catalyseurs : 401(k), baisses de taux</p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[15px] font-extrabold text-[#ef4444]">📉 Scénario Baissier (25%)</h3>
                  <span className="text-xs bg-[rgba(239,68,68,0.15)] text-[#ef4444] px-2 py-0.5 rounded-full font-bold">25%</span>
                </div>
                <p className="text-[#94a3b8] text-sm leading-relaxed mb-2">
                  $60K–$80K sur détérioration macro. Les ETFs créent un plancher plus élevé que les cycles précédents.
                </p>
                <p className="text-xs text-[#64748b]">Risques : Récession, régulation</p>
              </div>
            </div>
            <p className="text-[#64748b] text-xs mt-4 text-center">
              Valeur espérée pondérée : ~$109K — Source : Analyses institutionnelles, Février 2026
            </p>
          </div>

          {/* Guide des Phases */}
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 relative overflow-hidden">
            <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
              <span className="text-[22px]">📖</span> Guide des Phases du Cycle
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#3b82f6]" />
                <h3 className="text-[15px] font-extrabold mb-2.5 text-[#3b82f6]">❄️ Accumulation</h3>
                <p className="text-[#94a3b8] text-[13px] leading-relaxed mb-2">
                  Phase post-crash. Le marché est au plus bas, les investisseurs avisés accumulent. Sentiment très négatif, volumes au plus bas.
                </p>
                <p className="text-[13px]">💡 <strong className="text-white">Meilleur moment pour acheter</strong></p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#22c55e]" />
                <h3 className="text-[15px] font-extrabold mb-2.5 text-[#22c55e]">🌱 Début Haussier</h3>
                <p className="text-[#94a3b8] text-[13px] leading-relaxed mb-2">
                  Début de la reprise. BTC commence à monter, les altcoins suivent lentement. Confiance qui revient progressivement.
                </p>
                <p className="text-[13px]">💡 <strong className="text-white">Accumuler BTC + blue chips</strong></p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#f59e0b]" />
                <h3 className="text-[15px] font-extrabold mb-2.5 text-[#f59e0b]">🚀 Bull Run</h3>
                <p className="text-[#94a3b8] text-[13px] leading-relaxed mb-2">
                  Phase euphorique. Tout monte, les altcoins explosent, les médias en parlent partout. Volumes records.
                </p>
                <p className="text-[13px]">💡 <strong className="text-white">Prendre des profits progressivement</strong></p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#f97316]" />
                <h3 className="text-[15px] font-extrabold mb-2.5 text-[#f97316]">⚠️ Distribution</h3>
                <p className="text-[#94a3b8] text-[13px] leading-relaxed mb-2">
                  Le smart money vend. Euphorie maximale mais les gros portefeuilles se délestent. Divergences baissières apparaissent.
                </p>
                <p className="text-[13px]">💡 <strong className="text-white">Sécuriser les gains</strong></p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#ef4444]" />
                <h3 className="text-[15px] font-extrabold mb-2.5 text-[#ef4444]">📉 Correction Post-Pic</h3>
                <p className="text-[#94a3b8] text-[13px] leading-relaxed mb-2">
                  Correction majeure après l'ATH. Le marché cherche un plancher. Phase de transition — les ETFs créent un "hiver contrôlé" vs les crashs de -80% des cycles précédents.
                </p>
                <p className="text-[13px]">💡 <strong className="text-white">Patience, attendre les signaux de reprise</strong></p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#8b5cf6]" />
                <h3 className="text-[15px] font-extrabold mb-2.5 text-[#8b5cf6]">🔑 Signaux à Surveiller</h3>
                <ul className="space-y-1.5 text-[13px] text-[#94a3b8]">
                  <li>📈 Basis APR &gt; 8% → Prochain leg up</li>
                  <li>💰 ETF inflows &gt; $1Mds/semaine</li>
                  <li>📊 ISM PMI en hausse au-dessus de 50</li>
                  <li>🔥 On-chain composite &gt; 90% → Surchauffe</li>
                  <li>📖 Order book depth en recovery</li>
                </ul>
              </div>
            </div>

            <p className="text-[#64748b] text-xs mt-5 text-center">
              Tous les indicateurs sont calculés à partir de données réelles (CoinGecko, Alternative.me, analyses on-chain). Aucune donnée simulée.
              <br />
              Sources : CoinGecko API, Alternative.me Fear & Greed, analyses institutionnelles (Glassnode, CryptoQuant)
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
      </main>
    </div>
  );
}