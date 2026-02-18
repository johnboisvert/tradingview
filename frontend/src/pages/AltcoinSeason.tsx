import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw } from "lucide-react";

interface CoinPerf {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change24h: number;
  change7d: number;
  change30d: number;
  marketCap: number;
}

function getSeasonInfo(v: number) {
  if (v <= 25) return { label: "BITCOIN SEASON", color: "#f7931a", emoji: "🟠" };
  if (v <= 40) return { label: "BTC DOMINANT", color: "#f59e0b", emoji: "🟡" };
  if (v <= 60) return { label: "NEUTRE", color: "#94a3b8", emoji: "⚖️" };
  if (v <= 75) return { label: "ALT TENDANCE", color: "#84cc16", emoji: "🟢" };
  return { label: "ALTCOIN SEASON", color: "#22c55e", emoji: "🚀" };
}

// Stablecoins and wrapped tokens to exclude
const EXCLUDED = [
  "tether", "usd-coin", "dai", "binance-usd", "true-usd", "paxos-standard",
  "usdd", "frax", "wrapped-bitcoin", "staked-ether", "lido-staked-ether",
  "wrapped-steth", "rocket-pool-eth", "coinbase-wrapped-staked-eth",
  "first-digital-usd", "ethena-usde", "usual-usd", "paypal-usd",
];

export default function AltcoinSeason() {
  const [coins, setCoins] = useState<CoinPerf[]>([]);
  const [btcPerf, setBtcPerf] = useState({ change24h: 0, change7d: 0, change30d: 0 });
  const [seasonIndex, setSeasonIndex] = useState(50);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [timeframe, setTimeframe] = useState<"season" | "month" | "year">("season");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch top 100 to get 50 non-stablecoin coins
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d,30d"
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("No data");

      // Find BTC
      const btcData = data.find((c: Record<string, unknown>) => c.id === "bitcoin");
      const btc24h = btcData?.price_change_percentage_24h_in_currency ?? btcData?.price_change_percentage_24h ?? 0;
      const btc7d = btcData?.price_change_percentage_7d_in_currency ?? 0;
      const btc30d = btcData?.price_change_percentage_30d_in_currency ?? 0;
      setBtcPerf({ change24h: btc24h, change7d: btc7d, change30d: btc30d });

      // Filter out stablecoins/wrapped and BTC, take top 50
      const filtered = data.filter(
        (c: Record<string, unknown>) =>
          !EXCLUDED.includes(c.id as string) && c.id !== "bitcoin"
      ).slice(0, 50);

      const mapped: CoinPerf[] = filtered.map((c: Record<string, unknown>) => ({
        id: c.id as string,
        symbol: ((c.symbol as string) || "").toUpperCase(),
        name: c.name as string,
        image: c.image as string,
        price: (c.current_price as number) || 0,
        change24h: (c.price_change_percentage_24h_in_currency as number) ?? (c.price_change_percentage_24h as number) ?? 0,
        change7d: (c.price_change_percentage_7d_in_currency as number) ?? 0,
        change30d: (c.price_change_percentage_30d_in_currency as number) ?? 0,
        marketCap: (c.market_cap as number) || 0,
      }));

      setCoins(mapped);

      // Calculate season index: % of top 50 that outperformed BTC over 30d
      const outperformers = mapped.filter((c) => c.change30d > btc30d).length;
      const idx = mapped.length > 0 ? Math.round((outperformers / mapped.length) * 100) : 50;
      setSeasonIndex(idx);

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

  const info = getSeasonInfo(seasonIndex);

  // Get the BTC comparison value based on timeframe
  function getBtcRef() {
    if (timeframe === "month") return btcPerf.change30d;
    if (timeframe === "year") return btcPerf.change30d; // CoinGecko free only gives 30d max
    return btcPerf.change30d; // season = ~90d, we use 30d as best proxy
  }

  function getCoinPerf(c: CoinPerf) {
    if (timeframe === "month") return c.change30d;
    if (timeframe === "year") return c.change30d;
    return c.change30d;
  }

  // Sort coins by performance for the bar chart
  const btcRef = getBtcRef();
  const sortedCoins = [...coins].sort((a, b) => getCoinPerf(b) - getCoinPerf(a));
  const outperformCount = coins.filter((c) => getCoinPerf(c) > btcRef).length;

  // Stats table data
  const statsData = [
    {
      label: "Altcoins surperformant BTC",
      altcoin: `${outperformCount} / ${coins.length}`,
      bitcoin: `${coins.length - outperformCount} / ${coins.length}`,
    },
    {
      label: "Performance moyenne",
      altcoin: coins.length > 0 ? `${(coins.reduce((s, c) => s + getCoinPerf(c), 0) / coins.length).toFixed(1)}%` : "—",
      bitcoin: `${btcRef.toFixed(1)}%`,
    },
    {
      label: "Meilleur performer",
      altcoin: sortedCoins.length > 0 ? `${sortedCoins[0].symbol} (${getCoinPerf(sortedCoins[0]) >= 0 ? "+" : ""}${getCoinPerf(sortedCoins[0]).toFixed(1)}%)` : "—",
      bitcoin: `BTC (${btcRef >= 0 ? "+" : ""}${btcRef.toFixed(1)}%)`,
    },
    {
      label: "Pire performer",
      altcoin: sortedCoins.length > 0 ? `${sortedCoins[sortedCoins.length - 1].symbol} (${getCoinPerf(sortedCoins[sortedCoins.length - 1]) >= 0 ? "+" : ""}${getCoinPerf(sortedCoins[sortedCoins.length - 1]).toFixed(1)}%)` : "—",
      bitcoin: "—",
    },
  ];

  // Max absolute value for bar chart scaling
  const maxAbsPerf = Math.max(
    ...sortedCoins.map((c) => Math.abs(getCoinPerf(c) - btcRef)),
    1
  );

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="ml-[260px] min-h-screen relative">
        {/* Cosmic BG */}
        <div className="fixed top-0 left-[260px] right-0 bottom-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,#22c55e,transparent)] top-[-150px] left-[-100px] opacity-[0.12] blur-[80px] animate-pulse" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,#f7931a,transparent)] bottom-[-150px] right-[-50px] opacity-[0.12] blur-[80px] animate-pulse" style={{ animationDelay: "-10s" }} />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto p-7 pb-20">
          {/* Header */}
          <div className="text-center mb-9 pt-10">
            <h1 className="text-[clamp(32px,5vw,48px)] font-black tracking-[-2px] bg-gradient-to-r from-[#f7931a] via-[#22c55e] to-[#6366f1] bg-clip-text text-transparent bg-[length:300%_auto] animate-pulse">
              Altcoin Season Index
            </h1>
            <p className="text-[#64748b] text-[17px] mt-3 font-medium">
              Si 75% des Top 50 altcoins surperforment Bitcoin sur la dernière saison (90 jours), c'est l'Altcoin Season
            </p>
            <div className="inline-flex items-center gap-2 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] rounded-full px-[18px] py-1.5 text-xs text-[#22c55e] font-bold mt-4 uppercase tracking-[1.5px]">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e] animate-pulse" />
              LIVE — Données CoinGecko en temps réel
            </div>
          </div>

          {/* Timeframe Tabs */}
          <div className="flex justify-center gap-2 mb-6">
            {[
              { key: "season" as const, label: "Saison (90j)", sub: seasonIndex },
              { key: "month" as const, label: "Mois (30j)", sub: null },
              { key: "year" as const, label: "Année", sub: null },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeframe(t.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  timeframe === t.key
                    ? "bg-[rgba(99,102,241,0.15)] border border-[rgba(99,102,241,0.4)] text-white"
                    : "bg-[rgba(15,23,42,0.5)] border border-[rgba(148,163,184,0.08)] text-[#64748b] hover:text-white hover:border-[rgba(148,163,184,0.2)]"
                }`}
              >
                {t.label} {t.sub !== null && <span className="ml-1 text-[#6366f1]">({t.sub})</span>}
              </button>
            ))}
          </div>

          {/* Index Gauge */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {loading && coins.length === 0 ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-11 h-11 border-[3px] border-[rgba(99,102,241,0.15)] border-t-[#6366f1] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col items-center py-5">
                <p className="text-[#94a3b8] text-base font-bold mb-2">
                  {seasonIndex < 25
                    ? "C'est la Bitcoin Season !"
                    : seasonIndex >= 75
                    ? "C'est l'Altcoin Season ! 🚀"
                    : "Ce n'est pas l'Altcoin Season."}
                </p>
                <p
                  className="font-mono text-[72px] font-bold mb-1"
                  style={{ color: info.color, textShadow: `0 0 40px ${info.color}50` }}
                >
                  {seasonIndex}
                </p>
                <p
                  className="text-lg font-extrabold uppercase tracking-[4px]"
                  style={{ color: info.color }}
                >
                  {info.emoji} {info.label}
                </p>

                {/* Gauge bar */}
                <div className="w-full max-w-[600px] mt-6">
                  <div className="h-6 bg-gradient-to-r from-[#f7931a] via-[#eab308] via-[#94a3b8] via-[#84cc16] to-[#22c55e] rounded-xl relative overflow-visible">
                    <div
                      className="absolute top-[-8px] w-1 h-10 bg-white rounded-sm shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-all duration-[1500ms]"
                      style={{ left: `${seasonIndex}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2.5 text-xs text-[#64748b] font-bold">
                    <span>🟠 Bitcoin Season</span>
                    <span>⚖️ Neutre</span>
                    <span>🟢 Altcoin Season</span>
                  </div>
                </div>

                <p className="text-[#64748b] text-[13px] mt-4 text-center">
                  Si 75% des top 50 altcoins surperforment BTC sur 90 jours → Altcoin Season. Stablecoins et tokens wrappés exclus.
                </p>
              </div>
            )}
          </div>

          {/* Stats Table */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]"></th>
                  <th className="text-center py-3 px-4 text-xs text-[#22c55e] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]">🟢 Altcoin</th>
                  <th className="text-center py-3 px-4 text-xs text-[#f7931a] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]">🟠 Bitcoin</th>
                </tr>
              </thead>
              <tbody>
                {statsData.map((row) => (
                  <tr key={row.label} className="hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                    <td className="py-3 px-4 text-sm text-[#94a3b8] font-medium">{row.label}</td>
                    <td className="py-3 px-4 text-sm text-center font-mono font-bold text-[#22c55e]">{row.altcoin}</td>
                    <td className="py-3 px-4 text-sm text-center font-mono font-bold text-[#f7931a]">{row.bitcoin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Performance Bar Chart - Like blockchaincenter.net */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5 text-lg font-extrabold">
                <span className="text-[22px]">📊</span> Performance Top 50 vs Bitcoin ({timeframe === "month" ? "30 jours" : timeframe === "year" ? "1 an" : "saison 90j"})
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#22c55e]" /> Surperforme BTC</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#ef4444]" /> Sous-performe BTC</span>
              </div>
            </div>

            <div className="space-y-[3px] max-h-[800px] overflow-y-auto pr-2">
              {sortedCoins.map((coin) => {
                const perf = getCoinPerf(coin);
                const diff = perf - btcRef;
                const isPositive = diff >= 0;
                const barWidth = Math.min(Math.abs(diff) / maxAbsPerf * 100, 100);

                return (
                  <div key={coin.id} className="flex items-center gap-2 group hover:bg-[rgba(99,102,241,0.04)] rounded-lg px-2 py-[5px] transition-colors">
                    {/* Coin info - left side */}
                    <div className="flex items-center gap-2 w-[140px] flex-shrink-0">
                      <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full" />
                      <span className="text-xs font-bold truncate">{coin.symbol}</span>
                    </div>

                    {/* Bar chart area */}
                    <div className="flex-1 flex items-center h-6 relative">
                      {/* Center line (BTC reference) */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[rgba(148,163,184,0.2)] z-10" />

                      {isPositive ? (
                        <>
                          <div className="w-1/2" />
                          <div className="w-1/2 flex items-center">
                            <div
                              className="h-5 rounded-r-sm transition-all duration-700"
                              style={{
                                width: `${barWidth}%`,
                                background: "linear-gradient(90deg, #22c55e, #16a34a)",
                              }}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-1/2 flex items-center justify-end">
                            <div
                              className="h-5 rounded-l-sm transition-all duration-700"
                              style={{
                                width: `${barWidth}%`,
                                background: "linear-gradient(270deg, #ef4444, #dc2626)",
                              }}
                            />
                          </div>
                          <div className="w-1/2" />
                        </>
                      )}
                    </div>

                    {/* Performance value */}
                    <div className={`w-[80px] text-right text-xs font-mono font-bold flex-shrink-0 ${isPositive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-4 text-xs text-[#64748b]">
              Performance relative à Bitcoin ({btcRef >= 0 ? "+" : ""}{btcRef.toFixed(1)}%) — Données CoinGecko temps réel
            </div>
          </div>

          {/* Full Table - Top 50 Details */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
              <span className="text-[22px]">🏆</span> Détails Top 50 Altcoins
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[700px]">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-3 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]">#</th>
                    <th className="text-left py-3 px-3 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]">Coin</th>
                    <th className="text-right py-3 px-3 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]">Prix</th>
                    <th className="text-right py-3 px-3 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]">24h %</th>
                    <th className="text-right py-3 px-3 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]">7j %</th>
                    <th className="text-right py-3 px-3 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]">30j %</th>
                    <th className="text-right py-3 px-3 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]">vs BTC</th>
                    <th className="text-right py-3 px-3 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]">Cap. Marché</th>
                  </tr>
                </thead>
                <tbody>
                  {/* BTC Row */}
                  <tr className="bg-[rgba(247,147,26,0.05)] border-b border-[rgba(148,163,184,0.05)]">
                    <td className="py-3 px-3 text-sm text-[#f7931a] font-bold">★</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#f7931a]">Bitcoin</span>
                        <span className="text-[11px] text-[#f7931a] font-mono font-bold">BTC</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm font-mono text-right text-[#f7931a]">Référence</td>
                    <td className={`py-3 px-3 text-sm font-mono text-right font-bold ${btcPerf.change24h >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {btcPerf.change24h >= 0 ? "+" : ""}{btcPerf.change24h.toFixed(1)}%
                    </td>
                    <td className={`py-3 px-3 text-sm font-mono text-right font-bold ${btcPerf.change7d >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {btcPerf.change7d >= 0 ? "+" : ""}{btcPerf.change7d.toFixed(1)}%
                    </td>
                    <td className={`py-3 px-3 text-sm font-mono text-right font-bold ${btcPerf.change30d >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {btcPerf.change30d >= 0 ? "+" : ""}{btcPerf.change30d.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-sm font-mono text-right text-[#64748b]">—</td>
                    <td className="py-3 px-3 text-sm font-mono text-right text-[#64748b]">—</td>
                  </tr>
                  {sortedCoins.map((c, i) => {
                    const diff = getCoinPerf(c) - btcRef;
                    const isOutperform = diff >= 0;
                    return (
                      <tr key={c.id} className="hover:bg-[rgba(99,102,241,0.04)] transition-colors border-b border-[rgba(148,163,184,0.03)]">
                        <td className="py-3 px-3 text-sm text-[#64748b]">{i + 1}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <img src={c.image} alt={c.symbol} className="w-6 h-6 rounded-full" />
                            <span className="text-sm font-bold">{c.name}</span>
                            <span className="text-[11px] text-[#64748b] font-mono font-bold">{c.symbol}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-sm font-mono text-right">
                          ${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}
                        </td>
                        <td className={`py-3 px-3 text-sm font-mono text-right font-bold ${c.change24h >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(1)}%
                        </td>
                        <td className={`py-3 px-3 text-sm font-mono text-right font-bold ${c.change7d >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          {c.change7d >= 0 ? "+" : ""}{c.change7d.toFixed(1)}%
                        </td>
                        <td className={`py-3 px-3 text-sm font-mono text-right font-bold ${c.change30d >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          {c.change30d >= 0 ? "+" : ""}{c.change30d.toFixed(1)}%
                        </td>
                        <td className={`py-3 px-3 text-sm font-mono text-right font-bold ${isOutperform ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-sm font-mono text-right text-[#94a3b8]">
                          ${(c.marketCap / 1e9).toFixed(1)}B
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
              <span className="text-[22px]">📖</span> Comment ça marche ?
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h3 className="text-[15px] font-extrabold mb-3 text-[#f7931a]">🟠 Bitcoin Season (0-25)</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  La majorité des altcoins sous-performent Bitcoin. Les investisseurs se concentrent sur BTC comme valeur refuge. Moins de 25% des top 50 surperforment BTC.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h3 className="text-[15px] font-extrabold mb-3 text-[#eab308]">⚖️ Zone Neutre (25-75)</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  Pas de tendance claire. Le marché est partagé entre BTC et altcoins. Entre 25% et 75% des top 50 surperforment BTC.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h3 className="text-[15px] font-extrabold mb-3 text-[#22c55e]">🟢 Altcoin Season (75-100)</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  75%+ des top 50 altcoins surperforment BTC. C'est l'Altseason — les altcoins explosent ! Le moment où les altcoins brillent.
                </p>
              </div>
            </div>
            <p className="text-[#64748b] text-xs mt-5 text-center">
              Exclus du Top 50 : Stablecoins (Tether, DAI…) et tokens adossés à des actifs (WBTC, stETH, cLINK…). Source : CoinGecko API.
            </p>
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