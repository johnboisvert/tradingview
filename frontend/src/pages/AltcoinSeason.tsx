import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw, TrendingUp, TrendingDown, ExternalLink, Info, Sparkles } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchAltcoinSeasonData, formatPrice, type CoinMarketData } from "@/lib/cryptoApi";
import Footer from "@/components/Footer";

interface StatsData {
  days_since_last_altcoin_season: number;
  days_since_last_bitcoin_season: number;
  avg_days_between_altcoin_seasons: number;
  avg_days_between_bitcoin_seasons: number;
  longest_streak_without_altcoin_season: number;
  longest_streak_without_bitcoin_season: number;
  avg_length_altcoin_season: number;
  avg_length_bitcoin_season: number;
  longest_altcoin_season: number;
  longest_bitcoin_season: number;
  total_days_altcoin_season: number;
  total_days_bitcoin_season: number;
}

interface AltcoinData {
  altcoins: Array<CoinMarketData & { market_cap_rank: number; price_change_90d: number }>;
  btc_90d_change: number;
  btc_30d_change: number;
  altseason_score: number;
  month_score: number;
  year_score: number;
  source: string;
  stats: StatsData;
}

function getSeasonLabel(score: number): { label: string; color: string; emoji: string; bg: string } {
  if (score >= 75) return { label: "Altcoin Season", color: "text-emerald-400", emoji: "🟢", bg: "from-emerald-500/20 to-emerald-900/10" };
  if (score >= 50) return { label: "Zone Neutre (tendance Altcoins)", color: "text-yellow-400", emoji: "⚖️", bg: "from-yellow-500/20 to-yellow-900/10" };
  if (score >= 25) return { label: "Zone Neutre (tendance Bitcoin)", color: "text-orange-400", emoji: "⚖️", bg: "from-orange-500/20 to-orange-900/10" };
  return { label: "Bitcoin Season", color: "text-[#f7931a]", emoji: "🟠", bg: "from-[#f7931a]/20 to-orange-900/10" };
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

function getScoreColor(s: number): string {
  if (s >= 75) return "#22c55e";
  if (s >= 50) return "#eab308";
  if (s >= 25) return "#f59e0b";
  return "#f7931a";
}

function GaugeChart({ score }: { score: number }) {
  const animated = useAnimatedNumber(score);
  const angle = Math.PI - (animated / 100) * Math.PI;
  const cx = 150;
  const cy = 140;
  const r = 110;
  const needleX = cx + (r - 20) * Math.cos(angle);
  const needleY = cy - (r - 20) * Math.sin(angle);
  const color = getScoreColor(animated);

  return (
    <div className="relative w-full max-w-[360px] aspect-[3/2] mx-auto">
      <svg viewBox="0 0 300 180" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="alsGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f7931a" />
            <stop offset="25%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <filter id="alsGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="alsCenterGlow">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r="100" fill="url(#alsCenterGlow)" className="transition-all duration-1000" />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="22"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="url(#alsGaugeGrad)"
          strokeWidth="22"
          strokeLinecap="round"
          opacity="0.92"
          filter="url(#alsGlow)"
        />
        {Array.from({ length: 11 }).map((_, i) => {
          const v = i * 10;
          const a = Math.PI - (v / 100) * Math.PI;
          const r1 = r + 14;
          const r2 = r + 22;
          const major = v % 25 === 0;
          return (
            <line
              key={v}
              x1={cx + r1 * Math.cos(a)}
              y1={cy - r1 * Math.sin(a)}
              x2={cx + r2 * Math.cos(a)}
              y2={cy - r2 * Math.sin(a)}
              stroke={major ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"}
              strokeWidth={major ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
        {[
          { v: 0, c: "#f7931a" },
          { v: 25, c: "#f59e0b" },
          { v: 50, c: "#eab308" },
          { v: 75, c: "#84cc16" },
          { v: 100, c: "#22c55e" },
        ].map(({ v, c }) => {
          const a = Math.PI - (v / 100) * Math.PI;
          const rl = r + 36;
          return (
            <text
              key={v}
              x={cx + rl * Math.cos(a)}
              y={cy - rl * Math.sin(a)}
              fill={c}
              fontSize="11"
              fontWeight="700"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {v}
            </text>
          );
        })}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#alsGlow)"
          style={{ transition: "all 1s cubic-bezier(.34,1.56,.64,1)" }}
        />
        <circle cx={cx} cy={cy} r="10" fill="white" />
        <circle cx={cx} cy={cy} r="5" fill={color} />
      </svg>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-6xl font-black tracking-tight" style={{ color, textShadow: `0 0 30px ${color}66` }}>
            {animated}
          </span>
          <span className="text-xl font-bold text-gray-500">/100</span>
        </div>
      </div>
    </div>
  );
}

export default function AltcoinSeason() {
  const [data, setData] = useState<AltcoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchAltcoinSeasonData();
      setData(result);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch (err) {
      setError("Impossible de charger les données. Réessayez dans quelques instants.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 300000); // 5 min
    return () => clearInterval(i);
  }, [fetchData]);

  const season = data ? getSeasonLabel(data.altseason_score) : getSeasonLabel(50);
  const btc30d = data?.btc_30d_change || 0;
  const outperformCount = data
    ? data.altcoins.filter((c) => (c.price_change_percentage_30d_in_currency || 0) > btc30d).length
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 min-h-screen relative bg-[#0a0a0f]">
        <PageHeader
          icon={<TrendingUp className="w-6 h-6" />}
          title="Altcoin Season Index"
          subtitle="Détectez les phases d'Altseason : quand les altcoins surperforment Bitcoin, des opportunités explosives émergent. Suivez le score en temps réel pour adapter votre stratégie."
          accentColor="green"
          steps={[
            { n: "1", title: "Lisez le score global", desc: "Score > 75 = Altseason (les altcoins dominent). Score < 25 = Bitcoin Season. Entre les deux = marché mixte." },
            { n: "2", title: "Analysez les performances", desc: "Le tableau montre quelles cryptos surperforment BTC sur 90 jours. Plus il y en a, plus l'altseason est forte." },
            { n: "3", title: "Agissez au bon moment", desc: "Entrez en altcoins quand le score monte vers 75+. Réduisez l'exposition quand il redescend sous 50." },
          ]}
        />
        <div className="relative z-10 max-w-[1440px] mx-auto p-4 md:p-7 pb-20">
          {/* ===== HERO (pure CSS, no external image) ===== */}
          <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]">
            <div className="absolute inset-0 bg-[#0A0E1A]" />
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl" style={{ animation: "als-pulse 6s ease-in-out infinite" }} />
            <div className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full bg-[#f7931a]/20 blur-3xl" style={{ animation: "als-pulse 8s ease-in-out infinite reverse" }} />
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
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center" style={{ boxShadow: "0 0 30px rgba(34,197,94,0.25)" }}>
                  <TrendingUp className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-emerald-400 via-yellow-400 to-[#f7931a] bg-clip-text text-transparent">
                      Altcoin Season Index
                    </h1>
                    {data && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                        style={{ color: season.color.replace("text-", "").includes("#") ? season.color : "#22c55e", borderColor: "rgba(34,197,94,0.4)", background: "rgba(34,197,94,0.08)" }}
                      >
                        <Sparkles className="w-2.5 h-2.5" /> {season.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-gray-400">
                    Données blockchaincenter.net • Performance 90j Top 50 vs Bitcoin
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <a
                  href="https://www.blockchaincenter.net/en/altcoin-season-index/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-indigo-400 font-semibold transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  BlockchainCenter
                </a>
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-sm font-semibold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{lastUpdate ? `MAJ ${lastUpdate}` : "Charger"}</span>
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes als-pulse {
              0%, 100% { transform: scale(1) translate(0,0); opacity: 0.25; }
              50% { transform: scale(1.15) translate(15px,-8px); opacity: 0.4; }
            }
            @keyframes als-fadeUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .als-anim { animation: als-fadeUp 0.6s ease-out both; }
          `}</style>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Data Source Badge */}
          {data?.source && (
            <div className="mb-4 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs text-indigo-400 font-semibold">
                Source : {data.source}
              </span>
            </div>
          )}

          {/* Main Gauge */}
          <div className="als-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 md:p-8 mb-6 overflow-hidden" style={{ animationDelay: "100ms" }}>
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-25" style={{ background: getScoreColor(data?.altseason_score || 50) }} />
            <div className="relative text-center mb-6">
              <p className="text-sm text-gray-400 mb-2 font-semibold uppercase tracking-wider">
                {data && data.altseason_score >= 75
                  ? "🚀 It is Altcoin Season!"
                  : data && data.altseason_score < 25
                    ? "₿ It is Bitcoin Season!"
                    : "It is not Altcoin Season"}
              </p>
              <GaugeChart score={data?.altseason_score || 0} />
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-3xl">{season.emoji}</span>
                <span className={`text-2xl font-black ${season.color}`}>{season.label}</span>
              </div>
              <p className="text-gray-400 text-xs md:text-sm mt-3 max-w-md mx-auto leading-relaxed">
                Si 75% des top 50 altcoins surperforment Bitcoin sur <span className="font-bold text-white">90 jours</span>, c&apos;est l&apos;Altcoin Season
              </p>
            </div>

            {/* Score Tabs - 90j / 30j / 365j */}
            <div className="relative grid grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto mb-5">
              {[
                { label: "🔄 Altseason (90j)", score: data?.altseason_score || 0, primary: true },
                { label: "📅 Month (30j)", score: data?.month_score || 0, primary: false },
                { label: "📆 Year (365j)", score: data?.year_score || 0, primary: false },
              ].map((s, i) => {
                const sc = getScoreColor(s.score);
                return (
                  <div
                    key={i}
                    className="relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] rounded-2xl p-4 text-center border overflow-hidden"
                    style={{ borderColor: s.primary ? `${sc}55` : "rgba(255,255,255,0.06)" }}
                  >
                    {s.primary && (
                      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30" style={{ background: sc }} />
                    )}
                    <p className="relative text-[10px] uppercase font-bold mb-1.5" style={{ color: s.primary ? sc : "#94a3b8" }}>
                      {s.label}
                    </p>
                    <p
                      className="relative text-3xl font-black tracking-tight"
                      style={{ color: sc, textShadow: `0 0 16px ${sc}40` }}
                    >
                      {s.score}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Stats row */}
            <div className="relative grid grid-cols-3 gap-3 max-w-2xl mx-auto">
              <div className="bg-white/[0.02] rounded-2xl p-3 text-center border border-white/[0.05]">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">BTC 30j</p>
                <p className={`text-base md:text-lg font-black ${btc30d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {btc30d >= 0 ? "+" : ""}{btc30d.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white/[0.02] rounded-2xl p-3 text-center border border-white/[0.05]">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Score Officiel</p>
                <p className={`text-base md:text-lg font-black ${season.color}`}>{data?.altseason_score || 0}<span className="text-gray-500 text-xs">/100</span></p>
              </div>
              <div className="bg-white/[0.02] rounded-2xl p-3 text-center border border-white/[0.05]">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Battent BTC</p>
                <p className="text-base md:text-lg font-black text-white">{outperformCount}<span className="text-gray-500 text-xs">/{data?.altcoins.length || 50}</span></p>
              </div>
            </div>
          </div>

          {/* Official Stats Table from blockchaincenter.net */}
          {data?.stats && (
            <div className="als-anim bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 mb-6" style={{ animationDelay: "200ms" }}>
              <h3 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Statistiques Historiques
                <span className="text-xs text-indigo-400 font-normal">(blockchaincenter.net)</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-[11px] text-gray-500 uppercase tracking-wider py-3 px-4"></th>
                      <th className="text-center text-[11px] text-emerald-400 uppercase tracking-wider py-3 px-4 font-bold">Altcoin</th>
                      <th className="text-center text-[11px] text-[#f7931a] uppercase tracking-wider py-3 px-4 font-bold">Bitcoin</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-sm text-gray-300">Jours depuis la dernière Season</td>
                      <td className="py-3 px-4 text-center text-sm font-bold text-white">{data.stats.days_since_last_altcoin_season}</td>
                      <td className="py-3 px-4 text-center text-sm font-bold text-white">{data.stats.days_since_last_bitcoin_season}</td>
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-sm text-gray-300">Moyenne de jours entre les Seasons</td>
                      <td className="py-3 px-4 text-center text-sm font-bold text-white">{data.stats.avg_days_between_altcoin_seasons}</td>
                      <td className="py-3 px-4 text-center text-sm font-bold text-white">{data.stats.avg_days_between_bitcoin_seasons}</td>
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-sm text-gray-300">Plus longue période sans Season</td>
                      <td className="py-3 px-4 text-center text-sm font-bold text-white">{data.stats.longest_streak_without_altcoin_season}</td>
                      <td className="py-3 px-4 text-center text-sm font-bold text-white">{data.stats.longest_streak_without_bitcoin_season}</td>
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-sm text-gray-300">Durée moyenne d&apos;une Season (jours)</td>
                      <td className="py-3 px-4 text-center text-sm font-bold text-white">{data.stats.avg_length_altcoin_season}</td>
                      <td className="py-3 px-4 text-center text-sm font-bold text-white">{data.stats.avg_length_bitcoin_season}</td>
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-sm text-gray-300">Plus longue Season (jours)</td>
                      <td className="py-3 px-4 text-center text-sm font-bold text-white">{data.stats.longest_altcoin_season}</td>
                      <td className="py-3 px-4 text-center text-sm font-bold text-white">{data.stats.longest_bitcoin_season}</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-sm text-gray-300">Total jours de Season</td>
                      <td className="py-3 px-4 text-center text-sm font-bold text-emerald-400">{data.stats.total_days_altcoin_season}</td>
                      <td className="py-3 px-4 text-center text-sm font-bold text-[#f7931a]">{data.stats.total_days_bitcoin_season}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Altcoins Table */}
          <div className="als-anim bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6" style={{ animationDelay: "300ms" }}>
            <h3 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f7931a] animate-pulse" />
              Top 50 Altcoins vs Bitcoin
              <span className="text-xs text-gray-500 font-normal">(CoinGecko)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    {["#", "Token", "Prix", "24h", "30j", "vs BTC", "Statut"].map((h) => (
                      <th key={h} className="text-left text-[10px] text-gray-500 uppercase tracking-wider py-3 px-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.altcoins || []).map((coin, i) => {
                    const change30d = coin.price_change_percentage_30d_in_currency || 0;
                    const outperforms = change30d > btc30d;
                    return (
                      <tr key={coin.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 text-xs text-gray-500">{i + 1}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {coin.image && (
                              <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full" />
                            )}
                            <span className="font-bold text-xs text-white">{coin.symbol.toUpperCase()}</span>
                            <span className="text-[10px] text-gray-500 truncate max-w-[80px]">{coin.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-white">
                          ${formatPrice(coin.current_price)}
                        </td>
                        <td className={`py-3 px-3 font-mono text-xs font-bold ${(coin.price_change_percentage_24h || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {(coin.price_change_percentage_24h || 0) >= 0 ? "+" : ""}
                          {(coin.price_change_percentage_24h || 0).toFixed(2)}%
                        </td>
                        <td className={`py-3 px-3 font-mono text-xs font-bold ${change30d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {change30d >= 0 ? "+" : ""}{change30d.toFixed(1)}%
                        </td>
                        <td className={`py-3 px-3 font-mono text-xs font-bold ${(change30d - btc30d) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {(change30d - btc30d) >= 0 ? "+" : ""}{(change30d - btc30d).toFixed(1)}%
                        </td>
                        <td className="py-3 px-3">
                          {outperforms ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                              <TrendingUp className="w-3 h-3" /> Bat BTC
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold">
                              <TrendingDown className="w-3 h-3" /> Sous BTC
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Explanation */}
          <div className="als-anim bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 md:p-8 mt-6" style={{ animationDelay: "400ms" }}>
            <h3 className="text-base md:text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Comment ça marche ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative bg-gradient-to-br from-[#f7931a]/[0.06] to-transparent border border-[#f7931a]/20 rounded-2xl p-5 overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#f7931a]/20 blur-3xl" />
                <h4 className="relative text-sm font-black mb-3 text-[#f7931a]">🟠 Bitcoin Season (0-25)</h4>
                <p className="relative text-[#94a3b8] text-sm leading-relaxed">
                  Moins de 25% des top 50 altcoins surperforment BTC sur 90 jours. Les investisseurs se réfugient dans Bitcoin.
                </p>
              </div>
              <div className="relative bg-gradient-to-br from-yellow-500/[0.06] to-transparent border border-yellow-500/20 rounded-2xl p-5 overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-yellow-500/20 blur-3xl" />
                <h4 className="relative text-sm font-black mb-3 text-yellow-400">⚖️ Zone Neutre (25-75)</h4>
                <p className="relative text-[#94a3b8] text-sm leading-relaxed">
                  Pas de tendance claire. Le marché est partagé entre BTC et altcoins.{data?.altseason_score !== undefined && (
                    <> Score actuel <span className="text-white font-bold">{data.altseason_score}</span> : {data.altseason_score >= 50 ? "tendance altcoins" : "tendance Bitcoin"}.</>
                  )}
                </p>
              </div>
              <div className="relative bg-gradient-to-br from-emerald-500/[0.06] to-transparent border border-emerald-500/20 rounded-2xl p-5 overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/20 blur-3xl" />
                <h4 className="relative text-sm font-black mb-3 text-emerald-400">🟢 Altcoin Season (75-100)</h4>
                <p className="relative text-[#94a3b8] text-sm leading-relaxed">
                  75%+ des top 50 altcoins surperforment BTC sur 90 jours. C&apos;est l&apos;Altseason !
                </p>
              </div>
            </div>
            <div className="mt-6 bg-white/[0.02] rounded-2xl p-4 border border-white/[0.05]">
              <p className="text-[#94a3b8] text-xs leading-relaxed">
                <span className="text-white font-bold">Méthodologie :</span> L&apos;Altcoin Season Index mesure la performance des 50 plus grandes cryptomonnaies (hors stablecoins et tokens wrapped comme WBTC, stETH, etc.) par rapport à Bitcoin sur une période de 90 jours. Si 75% ou plus de ces altcoins surperforment Bitcoin, nous sommes en &quot;Altcoin Season&quot;. Si 75% ou plus sous-performent, c&apos;est la &quot;Bitcoin Season&quot;.
              </p>
            </div>
            <p className="text-[#64748b] text-xs mt-5 text-center">
              Score officiel : <a href="https://www.blockchaincenter.net/en/altcoin-season-index/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">blockchaincenter.net</a> • Données de marché : CoinGecko • Période : 90 jours
            </p>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}