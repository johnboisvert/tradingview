import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { BarChart3, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

const STATS_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/b3c0b3a0-ae42-46d0-9f3a-9f12780c9e10.png";

interface StatCoin {
  id: string; symbol: string; name: string; price: number; change24h: number;
  change7d: number; market_cap: number; volume: number; ath: number; athPct: number;
  high24h: number; low24h: number; image: string; volMcRatio: number;
  priceRange: number;
}

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export default function StatsAvancees() {
  const [coins, setCoins] = useState<StatCoin[]>([]);
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
        if (Array.isArray(data)) {
          setCoins(data.map((c: Record<string, unknown>) => {
            const mc = (c.market_cap as number) || 1;
            const vol = (c.total_volume as number) || 0;
            const h = (c.high_24h as number) || 0;
            const l = (c.low_24h as number) || 0;
            return {
              id: c.id as string,
              symbol: ((c.symbol as string) || "").toUpperCase(),
              name: c.name as string,
              price: (c.current_price as number) || 0,
              change24h: (c.price_change_percentage_24h as number) || 0,
              change7d: (c.price_change_percentage_7d_in_currency as number) || 0,
              market_cap: mc, volume: vol,
              ath: (c.ath as number) || 0,
              athPct: (c.ath_change_percentage as number) || 0,
              high24h: h, low24h: l,
              image: c.image as string,
              volMcRatio: mc > 0 ? Math.round((vol / mc) * 10000) / 100 : 0,
              priceRange: l > 0 ? Math.round(((h - l) / l) * 10000) / 100 : 0,
            };
          }));
        }
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 60000); return () => clearInterval(i); }, [fetchData]);

  const totalMC = coins.reduce((s, c) => s + c.market_cap, 0);
  const totalVol = coins.reduce((s, c) => s + c.volume, 0);
  const avgVolMC = coins.length ? coins.reduce((s, c) => s + c.volMcRatio, 0) / coins.length : 0;
  const avgRange = coins.length ? coins.reduce((s, c) => s + c.priceRange, 0) / coins.length : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={STATS_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <BarChart3 className="w-7 h-7 text-cyan-400" />
                <h1 className="text-2xl font-extrabold">Statistiques Avancées</h1>
              </div>
              <p className="text-sm text-gray-400">Métriques avancées • Vol/MC ratio • Range • ATH distance • Top 50</p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Market Cap Total</p>
            <p className="text-2xl font-extrabold">{formatNum(totalMC)}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Volume Total 24h</p>
            <p className="text-2xl font-extrabold text-cyan-400">{formatNum(totalVol)}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Ratio Vol/MC Moyen</p>
            <p className="text-2xl font-extrabold text-amber-400">{avgVolMC.toFixed(2)}%</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Range 24h Moyen</p>
            <p className="text-2xl font-extrabold text-purple-400">{avgRange.toFixed(2)}%</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">📊 Métriques Avancées — Top 50</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">7j</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Market Cap</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Volume</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Vol/MC</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Range 24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">vs ATH</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((c, i) => (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {c.image && <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" />}
                        <div><p className="text-sm font-bold">{c.symbol}</p><p className="text-[10px] text-gray-500">{c.name}</p></div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-bold">${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}</td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {c.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${c.change7d >= 0 ? "text-emerald-400" : "text-red-400"}`}>{c.change7d >= 0 ? "+" : ""}{c.change7d.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-right text-sm text-gray-300">{formatNum(c.market_cap)}</td>
                    <td className="py-3 px-3 text-right text-sm text-gray-300">{formatNum(c.volume)}</td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${c.volMcRatio > 15 ? "text-cyan-400" : c.volMcRatio > 5 ? "text-amber-400" : "text-gray-400"}`}>{c.volMcRatio.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-right text-sm text-purple-400 font-bold">{c.priceRange.toFixed(2)}%</td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${c.athPct > -10 ? "text-emerald-400" : c.athPct > -50 ? "text-amber-400" : "text-red-400"}`}>{c.athPct.toFixed(1)}%</td>
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