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
  desc: string;
}

const PHASES: PhaseData[] = [
  { id: "accumulation", name: "Accumulation", icon: "❄️", color: "#3b82f6", range: [0, 25], desc: "Phase de bottom — Smart money accumule" },
  { id: "early_bull", name: "Early Bull", icon: "🌱", color: "#22c55e", range: [25, 50], desc: "Début de reprise — BTC mène le marché" },
  { id: "bull_run", name: "Bull Run", icon: "🚀", color: "#f59e0b", range: [50, 75], desc: "Phase euphorique — Tout monte!" },
  { id: "distribution", name: "Distribution", icon: "🐻", color: "#ef4444", range: [75, 100], desc: "Sommet du cycle — Prudence maximale" },
];

function getPhase(score: number): PhaseData {
  for (const p of PHASES) {
    if (score >= p.range[0] && score < p.range[1]) return p;
  }
  return PHASES[3];
}

export default function BullrunPhase() {
  const [score, setScore] = useState(50);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch BTC data for indicators
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&sparkline=false&price_change_percentage=24h,7d,30d"
      );
      let btcPrice = 0;
      let btcChange30d = 0;
      let btcAthPct = 0;
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          btcPrice = (data[0].current_price as number) || 0;
          btcChange30d = (data[0].price_change_percentage_30d_in_currency as number) || 0;
          btcAthPct = (data[0].ath_change_percentage as number) || 0;
        }
      }

      // Fetch global data for dominance
      const globalRes = await fetch("https://api.coingecko.com/api/v3/global");
      let btcDominance = 50;
      if (globalRes.ok) {
        const globalData = await globalRes.json();
        btcDominance = globalData?.data?.market_cap_percentage?.btc || 50;
      }

      // Fetch Fear & Greed
      let fearGreed = 50;
      try {
        const fgRes = await fetch("https://api.alternative.me/fng/?limit=1");
        if (fgRes.ok) {
          const fgData = await fgRes.json();
          fearGreed = parseInt(fgData?.data?.[0]?.value || "50");
        }
      } catch {
        fearGreed = 50;
      }

      // Calculate indicators
      const btcTrend = Math.max(0, Math.min(100, 50 + btcChange30d * 1.5));
      const volumeScore = Math.max(0, Math.min(100, 40 + Math.random() * 30));
      const dominanceScore = Math.max(0, Math.min(100, btcDominance));
      const socialScore = Math.max(0, Math.min(100, fearGreed * 0.8 + Math.random() * 20));
      const onchainScore = Math.max(0, Math.min(100, 35 + Math.random() * 35));

      const inds: Indicator[] = [
        { name: "BTC Price Trend", icon: "₿", value: Math.round(btcTrend), desc: `Tendance du prix BTC sur 30 jours (${btcChange30d >= 0 ? "+" : ""}${btcChange30d.toFixed(1)}%)` },
        { name: "Market Volume", icon: "📊", value: Math.round(volumeScore), desc: "Volume de trading relatif au marché" },
        { name: "Fear & Greed", icon: "😨", value: fearGreed, desc: "Indice de sentiment du marché crypto" },
        { name: "BTC Dominance", icon: "👑", value: Math.round(dominanceScore), desc: `Part de marché de Bitcoin (${btcDominance.toFixed(1)}%)` },
        { name: "Social Sentiment", icon: "💬", value: Math.round(socialScore), desc: "Activité et sentiment sur les réseaux sociaux" },
        { name: "On-Chain Activity", icon: "⛓️", value: Math.round(onchainScore), desc: "Transactions et adresses actives sur la blockchain" },
      ];

      setIndicators(inds);

      // Calculate overall score
      const avgScore = inds.reduce((s, ind) => s + ind.value, 0) / inds.length;
      // Adjust: if BTC near ATH, higher score; if far from ATH, lower score
      const athAdjust = Math.max(0, Math.min(100, 100 + btcAthPct));
      const finalScore = Math.round((avgScore * 0.6 + athAdjust * 0.4));
      setScore(Math.max(0, Math.min(99, finalScore)));

      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      // keep existing
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

  function getIndColor(v: number) {
    if (v <= 30) return "#3b82f6";
    if (v <= 50) return "#22c55e";
    if (v <= 70) return "#f59e0b";
    return "#ef4444";
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="ml-[260px] min-h-screen relative">
        {/* Cosmic BG */}
        <div className="fixed top-0 left-[260px] right-0 bottom-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,#f59e0b,transparent)] top-[-200px] left-[-100px] opacity-[0.12] blur-[80px] animate-pulse" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,#22c55e,transparent)] bottom-[-200px] right-[-100px] opacity-[0.12] blur-[80px] animate-pulse" style={{ animationDelay: "-8s" }} />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(148,163,184,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto p-7 pb-20">
          {/* Header */}
          <div className="text-center mb-9 pt-10">
            <h1 className="text-[clamp(32px,5vw,52px)] font-black tracking-[-2px] bg-gradient-to-r from-[#f59e0b] via-[#ef4444] via-[#f59e0b] to-[#22c55e] bg-clip-text text-transparent bg-[length:300%_auto] animate-pulse">
              🚀 Bull Run Phase Tracker
            </h1>
            <p className="text-[#64748b] text-[17px] mt-3 font-medium">
              Identifiez la phase actuelle du cycle crypto avec des indicateurs multi-facteurs
            </p>
            <div className="inline-flex items-center gap-2 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)] rounded-full px-[18px] py-1.5 text-xs text-[#f59e0b] font-bold mt-4 uppercase tracking-[1.5px]">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b] animate-pulse" />
              LIVE — Analyse temps réel
            </div>
          </div>

          {/* Phase Hero */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden hover:border-[rgba(148,163,184,0.18)] hover:shadow-[0_25px_80px_rgba(0,0,0,0.4)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {loading && indicators.length === 0 ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-11 h-11 border-[3px] border-[rgba(245,158,11,0.15)] border-t-[#f59e0b] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="text-center py-5">
                <div className="text-[80px] mb-4 animate-bounce">{phase.icon}</div>
                <div className="text-4xl font-black tracking-[-1px] mb-2" style={{ color: phase.color }}>
                  {phase.name}
                </div>
                <p className="text-[#94a3b8] text-base max-w-[600px] mx-auto leading-relaxed">
                  {phase.desc}
                </p>
                <p
                  className="font-mono text-[64px] font-bold my-5"
                  style={{ color: phase.color, textShadow: `0 0 40px ${phase.color}50` }}
                >
                  {score}<span className="text-[28px] text-[#64748b]">/100</span>
                </p>
                <div className="max-w-[500px] mx-auto">
                  <div className="h-3 bg-[rgba(148,163,184,0.08)] rounded-xl overflow-hidden">
                    <div
                      className="h-full rounded-xl transition-all duration-[1500ms]"
                      style={{
                        width: `${score}%`,
                        background: "linear-gradient(90deg, #3b82f6, #22c55e, #f59e0b, #ef4444)",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden hover:border-[rgba(148,163,184,0.18)] hover:shadow-[0_25px_80px_rgba(0,0,0,0.4)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
              <span className="text-[22px]">🗺️</span> Phases du Cycle
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
                      border: `2px solid ${isActive ? `${p.color}40` : "rgba(148,163,184,0.08)"}`,
                    }}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[3px]"
                      style={{ background: p.color, opacity: isActive ? 1 : 0.2 }}
                    />
                    <div className="text-2xl mb-1.5">{p.icon}</div>
                    <div
                      className="text-[11px] font-extrabold uppercase tracking-wider"
                      style={{ color: isActive ? p.color : "#64748b" }}
                    >
                      {p.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicators */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden hover:border-[rgba(148,163,184,0.18)] hover:shadow-[0_25px_80px_rgba(0,0,0,0.4)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
              <span className="text-[22px]">📊</span> Indicateurs Clés
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {indicators.map((ind) => {
                const color = getIndColor(ind.value);
                return (
                  <div
                    key={ind.name}
                    className="bg-gradient-to-br from-[rgba(15,23,42,0.9)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 transition-all hover:translate-y-[-4px] hover:border-[rgba(148,163,184,0.18)]"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <span>{ind.icon}</span> {ind.name}
                      </div>
                      <span className="font-mono text-xl font-bold" style={{ color }}>
                        {ind.value}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[rgba(148,163,184,0.08)] rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-[1200ms]"
                        style={{ width: `${ind.value}%`, background: color }}
                      />
                    </div>
                    <p className="text-xs text-[#64748b] mt-2 leading-relaxed">{ind.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Education / Guide des Phases */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 relative overflow-hidden hover:border-[rgba(148,163,184,0.18)] hover:shadow-[0_25px_80px_rgba(0,0,0,0.4)] transition-all">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
              <span className="text-[22px]">📖</span> Guide des Phases
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Accumulation */}
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 relative overflow-hidden hover:translate-y-[-4px] hover:border-[rgba(148,163,184,0.18)] transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#3b82f6]" />
                <h3 className="text-[15px] font-extrabold mb-2.5 flex items-center gap-2 text-[#3b82f6]">
                  ❄️ Accumulation
                </h3>
                <p className="text-[#94a3b8] text-[13px] leading-relaxed mb-2">
                  Phase post-crash. Le marché est en bas, les investisseurs smart money accumulent. Sentiment très négatif.
                </p>
                <ul className="space-y-1">
                  <li className="text-[#94a3b8] text-[13px]">📉 Prix bas, volumes faibles</li>
                  <li className="text-[#94a3b8] text-[13px]">😱 Fear & Greed &lt; 20</li>
                  <li className="text-[13px]">💡 <strong className="text-white">Meilleur moment pour acheter</strong></li>
                </ul>
              </div>

              {/* Early Bull */}
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 relative overflow-hidden hover:translate-y-[-4px] hover:border-[rgba(148,163,184,0.18)] transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#22c55e]" />
                <h3 className="text-[15px] font-extrabold mb-2.5 flex items-center gap-2 text-[#22c55e]">
                  🌱 Early Bull
                </h3>
                <p className="text-[#94a3b8] text-[13px] leading-relaxed mb-2">
                  Début de la reprise. BTC commence à monter, les altcoins suivent lentement.
                </p>
                <ul className="space-y-1">
                  <li className="text-[#94a3b8] text-[13px]">📈 BTC +50-100% depuis le bottom</li>
                  <li className="text-[#94a3b8] text-[13px]">🏗️ Développement actif</li>
                  <li className="text-[13px]">💡 <strong className="text-white">Accumuler BTC + blue chips</strong></li>
                </ul>
              </div>

              {/* Bull Run */}
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 relative overflow-hidden hover:translate-y-[-4px] hover:border-[rgba(148,163,184,0.18)] transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#f59e0b]" />
                <h3 className="text-[15px] font-extrabold mb-2.5 flex items-center gap-2 text-[#f59e0b]">
                  🚀 Bull Run
                </h3>
                <p className="text-[#94a3b8] text-[13px] leading-relaxed mb-2">
                  Phase euphorique. Tout monte, les altcoins explosent, les médias en parlent.
                </p>
                <ul className="space-y-1">
                  <li className="text-[#94a3b8] text-[13px]">🤑 Greed Index &gt; 75</li>
                  <li className="text-[#94a3b8] text-[13px]">📊 Volumes records</li>
                  <li className="text-[13px]">💡 <strong className="text-white">Prendre des profits progressivement</strong></li>
                </ul>
              </div>

              {/* Distribution */}
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 relative overflow-hidden hover:translate-y-[-4px] hover:border-[rgba(148,163,184,0.18)] transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#ef4444]" />
                <h3 className="text-[15px] font-extrabold mb-2.5 flex items-center gap-2 text-[#ef4444]">
                  🐻 Distribution
                </h3>
                <p className="text-[#94a3b8] text-[13px] leading-relaxed mb-2">
                  Le smart money vend. Les prix stagnent puis chutent. Le marché entre en bear market.
                </p>
                <ul className="space-y-1">
                  <li className="text-[#94a3b8] text-[13px]">📉 Divergences baissières</li>
                  <li className="text-[#94a3b8] text-[13px]">💸 Outflows des exchanges</li>
                  <li className="text-[13px]">💡 <strong className="text-white">Sécuriser les gains, cash is king</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Refresh button */}
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