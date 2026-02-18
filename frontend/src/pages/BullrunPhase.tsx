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
  source: string;
}

const PHASES: PhaseData[] = [
  { id: "accumulation", name: "Accumulation", icon: "❄️", color: "#3b82f6", range: [0, 25], desc: "Phase de bottom — Le smart money accumule discrètement" },
  { id: "early_bull", name: "Début Haussier", icon: "🌱", color: "#22c55e", range: [25, 50], desc: "Début de reprise — BTC mène le marché, les altcoins suivent" },
  { id: "bull_run", name: "Bull Run", icon: "🚀", color: "#f59e0b", range: [50, 75], desc: "Phase euphorique — Tout monte, les volumes explosent !" },
  { id: "distribution", name: "Distribution", icon: "🐻", color: "#ef4444", range: [75, 100], desc: "Sommet du cycle — Le smart money vend, prudence maximale" },
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
      // 1. Fetch BTC data
      const btcRes = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&sparkline=false&price_change_percentage=24h,7d,30d"
      );
      let btcPrice = 0;
      let btcChange24h = 0;
      let btcChange7d = 0;
      let btcChange30d = 0;
      let btcAthPct = 0;
      if (btcRes.ok) {
        const data = await btcRes.json();
        if (Array.isArray(data) && data.length > 0) {
          btcPrice = (data[0].current_price as number) || 0;
          btcChange24h = (data[0].price_change_percentage_24h as number) || 0;
          btcChange7d = (data[0].price_change_percentage_7d_in_currency as number) || 0;
          btcChange30d = (data[0].price_change_percentage_30d_in_currency as number) || 0;
          btcAthPct = (data[0].ath_change_percentage as number) || 0;
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
      let fgClassification = "Neutre";
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

      // Translate Fear & Greed classification
      const fgTranslations: Record<string, string> = {
        "Extreme Fear": "Peur Extrême",
        "Fear": "Peur",
        "Neutral": "Neutre",
        "Greed": "Avidité",
        "Extreme Greed": "Avidité Extrême",
      };
      const fgFr = fgTranslations[fgClassification] || fgClassification;

      // 4. Calculate real indicators (NO random values)
      // BTC Price Trend: based on 30d change, normalized 0-100
      const btcTrendScore = Math.max(0, Math.min(100, Math.round(50 + btcChange30d * 1.5)));

      // Volume ratio: volume/marketcap ratio as activity indicator
      const volumeRatio = totalMarketCap > 0 ? (totalVolume / totalMarketCap) * 100 : 5;
      const volumeScore = Math.max(0, Math.min(100, Math.round(volumeRatio * 10)));

      // BTC Dominance score: lower dominance = more bullish for alts = higher cycle score
      const dominanceScore = Math.max(0, Math.min(100, Math.round(100 - btcDominance)));

      // ATH proximity: how close BTC is to ATH (0 = at ATH, -100 = very far)
      const athScore = Math.max(0, Math.min(100, Math.round(100 + btcAthPct)));

      // Momentum: based on short-term vs long-term trend
      const momentumScore = Math.max(0, Math.min(100, Math.round(50 + btcChange24h * 2 + btcChange7d * 0.5)));

      const inds: Indicator[] = [
        {
          name: "Tendance Prix BTC",
          icon: "₿",
          value: btcTrendScore,
          desc: `BTC: $${btcPrice.toLocaleString("fr-FR")} — Variation 30j: ${btcChange30d >= 0 ? "+" : ""}${btcChange30d.toFixed(1)}%`,
          source: "CoinGecko",
        },
        {
          name: "Volume du Marché",
          icon: "📊",
          value: volumeScore,
          desc: `Volume 24h: $${(totalVolume / 1e9).toFixed(1)}Mds — Ratio Vol/Cap: ${volumeRatio.toFixed(2)}%`,
          source: "CoinGecko",
        },
        {
          name: "Fear & Greed Index",
          icon: "😨",
          value: fearGreed,
          desc: `Indice de sentiment: ${fearGreed}/100 — ${fgFr}`,
          source: "Alternative.me",
        },
        {
          name: "Dominance BTC",
          icon: "👑",
          value: Math.round(btcDominance),
          desc: `Part de marché Bitcoin: ${btcDominance.toFixed(1)}% — Cap totale: $${(totalMarketCap / 1e12).toFixed(2)}T`,
          source: "CoinGecko",
        },
        {
          name: "Proximité ATH",
          icon: "🎯",
          value: athScore,
          desc: `BTC est à ${Math.abs(btcAthPct).toFixed(1)}% de son ATH — ${athScore > 80 ? "Très proche" : athScore > 50 ? "En approche" : "Encore loin"}`,
          source: "CoinGecko",
        },
        {
          name: "Momentum Court Terme",
          icon: "⚡",
          value: momentumScore,
          desc: `24h: ${btcChange24h >= 0 ? "+" : ""}${btcChange24h.toFixed(1)}% — 7j: ${btcChange7d >= 0 ? "+" : ""}${btcChange7d.toFixed(1)}%`,
          source: "CoinGecko",
        },
      ];

      setIndicators(inds);

      // Calculate overall cycle score (weighted average, no random)
      const weights = [0.25, 0.10, 0.20, 0.15, 0.20, 0.10];
      const values = [btcTrendScore, volumeScore, fearGreed, dominanceScore, athScore, momentumScore];
      const weightedScore = values.reduce((sum, val, i) => sum + val * weights[i], 0);
      setScore(Math.max(0, Math.min(99, Math.round(weightedScore))));

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

  function getIndColor(v: number) {
    if (v <= 25) return "#3b82f6";
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
          {/* En-tête */}
          <div className="text-center mb-9 pt-10">
            <h1 className="text-[clamp(32px,5vw,52px)] font-black tracking-[-2px] bg-gradient-to-r from-[#f59e0b] via-[#ef4444] via-[#f59e0b] to-[#22c55e] bg-clip-text text-transparent bg-[length:300%_auto] animate-pulse">
              🚀 Suivi des Phases du Bull Run
            </h1>
            <p className="text-[#64748b] text-[17px] mt-3 font-medium">
              Identifiez la phase actuelle du cycle crypto avec des indicateurs multi-facteurs en temps réel
            </p>
            <div className="inline-flex items-center gap-2 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)] rounded-full px-[18px] py-1.5 text-xs text-[#f59e0b] font-bold mt-4 uppercase tracking-[1.5px]">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b] animate-pulse" />
              EN DIRECT — Analyse temps réel
            </div>
          </div>

          {/* Phase Principale */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden">
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

          {/* Chronologie des Phases */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden">
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
                    <div className="text-[10px] text-[#475569] mt-1">
                      {p.range[0]}-{p.range[1]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicateurs Clés */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden">
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
                    <p className="text-xs text-[#94a3b8] mt-2 leading-relaxed">{ind.desc}</p>
                    <p className="text-[10px] text-[#475569] mt-1">Source : {ind.source}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guide des Phases */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 relative overflow-hidden">
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
                  Phase post-crash. Le marché est au plus bas, les investisseurs avisés accumulent discrètement. Sentiment très négatif.
                </p>
                <ul className="space-y-1">
                  <li className="text-[#94a3b8] text-[13px]">📉 Prix bas, volumes faibles</li>
                  <li className="text-[#94a3b8] text-[13px]">😱 Fear & Greed &lt; 20</li>
                  <li className="text-[13px]">💡 <strong className="text-white">Meilleur moment pour acheter</strong></li>
                </ul>
              </div>

              {/* Début Haussier */}
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6 relative overflow-hidden hover:translate-y-[-4px] hover:border-[rgba(148,163,184,0.18)] transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#22c55e]" />
                <h3 className="text-[15px] font-extrabold mb-2.5 flex items-center gap-2 text-[#22c55e]">
                  🌱 Début Haussier
                </h3>
                <p className="text-[#94a3b8] text-[13px] leading-relaxed mb-2">
                  Début de la reprise. BTC commence à monter, les altcoins suivent lentement. Le développement reprend.
                </p>
                <ul className="space-y-1">
                  <li className="text-[#94a3b8] text-[13px]">📈 BTC +50-100% depuis le creux</li>
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
                  Phase euphorique. Tout monte, les altcoins explosent, les médias en parlent partout.
                </p>
                <ul className="space-y-1">
                  <li className="text-[#94a3b8] text-[13px]">🤑 Indice Greed &gt; 75</li>
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
                  Le smart money vend. Les prix stagnent puis chutent. Le marché entre en phase baissière.
                </p>
                <ul className="space-y-1">
                  <li className="text-[#94a3b8] text-[13px]">📉 Divergences baissières</li>
                  <li className="text-[#94a3b8] text-[13px]">💸 Sorties de capitaux des exchanges</li>
                  <li className="text-[13px]">💡 <strong className="text-white">Sécuriser les gains, le cash est roi</strong></li>
                </ul>
              </div>
            </div>

            <p className="text-[#64748b] text-xs mt-5 text-center">
              Tous les indicateurs sont calculés à partir de données réelles (CoinGecko, Alternative.me). Aucune donnée simulée ou aléatoire.
            </p>
          </div>

          {/* Bouton Rafraîchir */}
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