import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Star, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

const ALT_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

interface AltCoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  market_cap: number;
  volume: number;
  image: string;
  outperformsBTC: boolean;
}

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export default function AltcoinSeason() {
  const [coins, setCoins] = useState<AltCoin[]>([]);
  const [btcChange, setBtcChange] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h,7d"
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const btc = data.find((c: Record<string, unknown>) => (c.symbol as string) === "btc");
          const btcCh = btc ? ((btc.price_change_percentage_24h as number) || 0) : 0;
          setBtcChange(btcCh);

          setCoins(
            data.map((c: Record<string, unknown>) => ({
              id: c.id as string,
              symbol: ((c.symbol as string) || "").toUpperCase(),
              name: c.name as string,
              price: (c.current_price as number) || 0,
              change24h: (c.price_change_percentage_24h as number) || 0,
              change7d: (c.price_change_percentage_7d_in_currency as number) || 0,
              market_cap: (c.market_cap as number) || 0,
              volume: (c.total_volume as number) || 0,
              image: c.image as string,
              outperformsBTC: ((c.price_change_percentage_24h as number) || 0) > btcCh,
            }))
          );
        }
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const alts = coins.filter((c) => c.symbol !== "BTC" && c.symbol !== "USDT" && c.symbol !== "USDC");
  const outperformers = alts.filter((c) => c.outperformsBTC).length;
  const seasonIndex = alts.length ? Math.round((outperformers / alts.length) * 100) : 50;
  const isAltSeason = seasonIndex >= 75;
  const isBTCSeason = seasonIndex <= 25;

  const seasonLabel = isAltSeason ? "🚀 Altcoin Season!" : isBTCSeason ? "₿ Bitcoin Season" : seasonIndex >= 50 ? "📈 Tendance Altcoins" : "📉 Tendance Bitcoin";
  const seasonColor = isAltSeason ? "#22c55e" : isBTCSeason ? "#f7931a" : seasonIndex >= 50 ? "#84cc16" : "#f59e0b";

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={ALT_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Star className="w-7 h-7 text-yellow-400" />
                <h1 className="text-2xl font-extrabold">Altcoin Season Index</h1>
              </div>
              <p className="text-sm text-gray-400">Analyse de la saison des altcoins • Top 50 cryptos vs Bitcoin</p>
            </div>
            <button
              onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* Season Gauge */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-8 mb-6">
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-lg">
              <div className="h-6 bg-gradient-to-r from-amber-500 via-gray-600 to-emerald-500 rounded-full relative overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full shadow-lg transition-all duration-1000"
                  style={{ left: `${seasonIndex}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-amber-400 font-bold">₿ Bitcoin Season</span>
                <span className="text-xs text-gray-500 font-bold">Neutre</span>
                <span className="text-xs text-emerald-400 font-bold">🚀 Altcoin Season</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-5xl font-black" style={{ color: seasonColor }}>{seasonIndex}</p>
              <p className="text-lg font-bold mt-1" style={{ color: seasonColor }}>{seasonLabel}</p>
              <p className="text-sm text-gray-400 mt-2">
                {outperformers}/{alts.length} altcoins surperforment Bitcoin (24h)
              </p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">BTC Performance 24h</p>
            <p className={`text-2xl font-extrabold ${btcChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {btcChange >= 0 ? "+" : ""}{btcChange.toFixed(2)}%
            </p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Altcoins &gt; BTC</p>
            <p className="text-2xl font-extrabold text-emerald-400">{outperformers}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Altcoins &lt; BTC</p>
            <p className="text-2xl font-extrabold text-red-400">{alts.length - outperformers}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Season Index</p>
            <p className="text-2xl font-extrabold" style={{ color: seasonColor }}>{seasonIndex}/100</p>
          </div>
        </div>

        {/* Full Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Top 50 — Performance vs Bitcoin</h2>
            <span className="text-xs text-gray-500">{coins.length} actifs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">7j</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Market Cap</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Volume</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 uppercase">vs BTC</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((c, i) => (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-sm text-gray-500 font-semibold">{i + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {c.image ? (
                          <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-[10px] font-bold">
                            {c.symbol.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-bold">
                      ${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}
                    </td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {c.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${c.change7d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {c.change7d >= 0 ? "+" : ""}{c.change7d.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-gray-300">{formatNum(c.market_cap)}</td>
                    <td className="py-3 px-3 text-right text-sm text-gray-300">{formatNum(c.volume)}</td>
                    <td className="py-3 px-3 text-center">
                      {c.symbol === "BTC" ? (
                        <span className="text-xs font-bold text-gray-500">—</span>
                      ) : c.outperformsBTC ? (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">✓ Surperforme</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400">✗ Sous-performe</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}