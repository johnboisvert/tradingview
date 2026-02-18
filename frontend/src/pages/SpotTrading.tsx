import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Gem, RefreshCw, TrendingUp, TrendingDown, ArrowUpDown, Search } from "lucide-react";

const SPOT_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/b3c0b3a0-ae42-46d0-9f3a-9f12780c9e10.png";

interface SpotCoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume: number;
  market_cap: number;
  image: string;
  ath: number;
  athChangePercent: number;
}

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(2)}`;
}

export default function SpotTrading() {
  const [coins, setCoins] = useState<SpotCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"market_cap" | "change24h" | "volume">("market_cap");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h"
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCoins(
            data.map((c: Record<string, unknown>) => ({
              id: c.id as string,
              symbol: ((c.symbol as string) || "").toUpperCase(),
              name: c.name as string,
              price: (c.current_price as number) || 0,
              change24h: (c.price_change_percentage_24h as number) || 0,
              high24h: (c.high_24h as number) || 0,
              low24h: (c.low_24h as number) || 0,
              volume: (c.total_volume as number) || 0,
              market_cap: (c.market_cap as number) || 0,
              image: c.image as string,
              ath: (c.ath as number) || 0,
              athChangePercent: (c.ath_change_percentage as number) || 0,
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

  const filtered = coins
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "change24h") return b.change24h - a.change24h;
      if (sortBy === "volume") return b.volume - a.volume;
      return b.market_cap - a.market_cap;
    });

  const totalVol = coins.reduce((s, c) => s + c.volume, 0);
  const avgChange = coins.length ? coins.reduce((s, c) => s + c.change24h, 0) / coins.length : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={SPOT_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Gem className="w-7 h-7 text-cyan-400" />
                <h1 className="text-2xl font-extrabold">Spot Trading</h1>
              </div>
              <p className="text-sm text-gray-400">Marché spot en temps réel • Top 50 cryptos • Prix, Volume, ATH</p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Paires Disponibles</p>
            <p className="text-2xl font-extrabold">{coins.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Volume Total 24h</p>
            <p className="text-2xl font-extrabold text-cyan-400">{formatNum(totalVol)}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Variation Moyenne</p>
            <p className={`text-2xl font-extrabold ${avgChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
            </p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">En Hausse</p>
            <p className="text-2xl font-extrabold text-emerald-400">
              {coins.filter((c) => c.change24h > 0).length}/{coins.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une crypto..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              {([
                { key: "market_cap" as const, label: "Market Cap" },
                { key: "change24h" as const, label: "24h %" },
                { key: "volume" as const, label: "Volume" },
              ]).map((s) => (
                <button key={s.key} onClick={() => setSortBy(s.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    sortBy === s.key
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]"
                  }`}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Paire</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">High 24h</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Low 24h</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Volume</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Market Cap</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">ATH</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">vs ATH</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-500 font-semibold">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {c.image ? <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" /> : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold">{c.symbol.slice(0, 2)}</div>
                        )}
                        <div>
                          <p className="text-sm font-bold">{c.symbol}/USDT</p>
                          <p className="text-[10px] text-gray-500">{c.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold">
                      ${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}
                    </td>
                    <td className={`py-3 px-4 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {c.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-300">
                      ${c.high24h >= 1 ? c.high24h.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.high24h.toFixed(6)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-300">
                      ${c.low24h >= 1 ? c.low24h.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.low24h.toFixed(6)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-300">{formatNum(c.volume)}</td>
                    <td className="py-3 px-4 text-right text-sm text-gray-300">{formatNum(c.market_cap)}</td>
                    <td className="py-3 px-4 text-right text-sm text-gray-300">
                      ${c.ath >= 1 ? c.ath.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.ath.toFixed(6)}
                    </td>
                    <td className={`py-3 px-4 text-right text-sm font-bold ${c.athChangePercent >= -10 ? "text-emerald-400" : c.athChangePercent >= -50 ? "text-amber-400" : "text-red-400"}`}>
                      {c.athChangePercent.toFixed(1)}%
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