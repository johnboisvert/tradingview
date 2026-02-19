import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw, TrendingUp, TrendingDown, ExternalLink, Info } from "lucide-react";
import { fetchAltcoinSeasonData, formatPrice, type CoinMarketData } from "@/lib/cryptoApi";

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

function GaugeChart({ score }: { score: number }) {
  const rotation = (score / 100) * 180 - 90; // -90 to 90 degrees
  return (
    <div className="relative w-64 h-36 mx-auto">
      <svg viewBox="0 0 200 110" className="w-full h-full">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f7931a" />
            <stop offset="25%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.8"
        />
        <text x="15" y="108" fill="#f7931a" fontSize="8" fontWeight="bold">0</text>
        <text x="55" y="30" fill="#f59e0b" fontSize="7" fontWeight="bold">25</text>
        <text x="93" y="18" fill="#eab308" fontSize="7" fontWeight="bold">50</text>
        <text x="133" y="30" fill="#84cc16" fontSize="7" fontWeight="bold">75</text>
        <text x="176" y="108" fill="#22c55e" fontSize="8" fontWeight="bold">100</text>
        <line
          x1="100"
          y1="100"
          x2={100 + 65 * Math.cos((rotation * Math.PI) / 180)}
          y2={100 + 65 * Math.sin((rotation * Math.PI) / 180)}
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="5" fill="white" />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <span className="text-4xl font-black text-white">{score}</span>
        <span className="text-lg text-gray-400">/100</span>
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
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="ml-[260px] min-h-screen relative">
        <div className="relative z-10 max-w-[1440px] mx-auto p-7 pb-20">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-4">
            <div>
              <h1 className="text-[clamp(28px,4vw,42px)] font-black tracking-[-1px] bg-gradient-to-r from-[#22c55e] via-[#f7931a] to-[#22c55e] bg-clip-text text-transparent">
                🔄 Altcoin Season Index
              </h1>
              <p className="text-[#64748b] text-sm mt-1">
                Données officielles blockchaincenter.net • Performance 90 jours des top 50 altcoins vs Bitcoin
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://www.blockchaincenter.net/en/altcoin-season-index/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-[#818cf8] transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                BlockchainCenter
              </a>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {lastUpdate ? `MAJ ${lastUpdate}` : "Charger"}
              </button>
            </div>
          </div>

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
          <div className={`bg-gradient-to-br ${season.bg} border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6`}>
            <div className="text-center mb-6">
              <p className="text-sm text-gray-400 mb-2 font-semibold">It is not Altcoin Season!</p>
              <GaugeChart score={data?.altseason_score || 0} />
              <div className="mt-4">
                <span className="text-3xl mr-2">{season.emoji}</span>
                <span className={`text-2xl font-black ${season.color}`}>{season.label}</span>
              </div>
              <p className="text-[#94a3b8] text-sm mt-2">
                Si 75% des top 50 altcoins surperforment Bitcoin sur <span className="font-bold text-white">90 jours</span>, c&apos;est l&apos;Altcoin Season
              </p>
            </div>

            {/* Score Tabs - matching blockchaincenter.net */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mb-6">
              <div className="bg-black/30 rounded-2xl p-4 text-center border border-cyan-500/20">
                <p className="text-[10px] text-cyan-400 uppercase font-bold mb-1">🔄 Altcoin Season (90j)</p>
                <p className={`text-3xl font-black ${getSeasonLabel(data?.altseason_score || 0).color}`}>
                  {data?.altseason_score || 0}
                </p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 text-center border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">📅 Month (30j)</p>
                <p className={`text-3xl font-black ${getSeasonLabel(data?.month_score || 0).color}`}>
                  {data?.month_score || 0}
                </p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 text-center border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">📆 Year (365j)</p>
                <p className={`text-3xl font-black ${getSeasonLabel(data?.year_score || 0).color}`}>
                  {data?.year_score || 0}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-black/20 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">BTC 30j</p>
                <p className={`text-lg font-black ${btc30d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {btc30d >= 0 ? "+" : ""}{btc30d.toFixed(1)}%
                </p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Score Officiel</p>
                <p className={`text-lg font-black ${season.color}`}>{data?.altseason_score || 0}/100</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Battent BTC (30j)</p>
                <p className="text-lg font-black text-white">{outperformCount}/{data?.altcoins.length || 50}</p>
              </div>
            </div>
          </div>

          {/* Official Stats Table from blockchaincenter.net */}
          {data?.stats && (
            <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-6 mb-6">
              <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                📈 Statistiques Historiques
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
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-6">
            <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
              📊 Top 50 Altcoins vs Bitcoin
              <span className="text-xs text-gray-500 font-normal">(données marché CoinGecko)</span>
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
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mt-6">
            <h3 className="text-lg font-extrabold mb-6 flex items-center gap-2">
              📖 Comment ça marche ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h4 className="text-[15px] font-extrabold mb-3 text-[#f7931a]">🟠 Bitcoin Season (0-25)</h4>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  Moins de 25% des top 50 altcoins surperforment BTC sur 90 jours. Les investisseurs se réfugient dans Bitcoin.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h4 className="text-[15px] font-extrabold mb-3 text-[#eab308]">⚖️ Zone Neutre (25-75)</h4>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  Pas de tendance claire. Le marché est partagé entre BTC et altcoins. Le score actuel de <span className="text-white font-bold">53</span> indique une légère tendance altcoins.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h4 className="text-[15px] font-extrabold mb-3 text-[#22c55e]">🟢 Altcoin Season (75-100)</h4>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  75%+ des top 50 altcoins surperforment BTC sur 90 jours. C&apos;est l&apos;Altseason !
                </p>
              </div>
            </div>
            <div className="mt-6 bg-black/20 rounded-2xl p-4 border border-white/5">
              <p className="text-[#94a3b8] text-xs leading-relaxed">
                <span className="text-white font-bold">Méthodologie :</span> L&apos;Altcoin Season Index mesure la performance des 50 plus grandes cryptomonnaies (hors stablecoins et tokens wrapped comme WBTC, stETH, etc.) par rapport à Bitcoin sur une période de 90 jours. Si 75% ou plus de ces altcoins surperforment Bitcoin, nous sommes en &quot;Altcoin Season&quot;. Si 75% ou plus sous-performent, c&apos;est la &quot;Bitcoin Season&quot;.
              </p>
            </div>
            <p className="text-[#64748b] text-xs mt-5 text-center">
              Score officiel : <a href="https://www.blockchaincenter.net/en/altcoin-season-index/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">blockchaincenter.net</a> • Données de marché : CoinGecko • Période : 90 jours
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}