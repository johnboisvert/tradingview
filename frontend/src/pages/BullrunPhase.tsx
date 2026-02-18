import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Rocket, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

const BULL_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

interface BullCoin {
  id: string; symbol: string; name: string; price: number; change24h: number;
  change7d: number; market_cap: number; ath: number; athPct: number; image: string;
}

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function getPhase(avgAthPct: number): { label: string; color: string; emoji: string; desc: string } {
  if (avgAthPct > -10) return { label: "Euphorie", color: "#22c55e", emoji: "🚀", desc: "Marché proche des ATH — Phase d'euphorie maximale" };
  if (avgAthPct > -30) return { label: "Expansion", color: "#84cc16", emoji: "📈", desc: "Forte croissance — Le bullrun est en cours" };
  if (avgAthPct > -50) return { label: "Reprise", color: "#eab308", emoji: "🔄", desc: "Le marché se remet — Signes de reprise" };
  if (avgAthPct > -70) return { label: "Accumulation", color: "#f97316", emoji: "💎", desc: "Phase d'accumulation — Les smart money achètent" };
  return { label: "Capitulation", color: "#ef4444", emoji: "😱", desc: "Marché en forte baisse — Phase de capitulation" };
}

export default function BullrunPhase() {
  const [coins, setCoins] = useState<BullCoin[]>([]);
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
          setCoins(data.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            symbol: ((c.symbol as string) || "").toUpperCase(),
            name: c.name as string,
            price: (c.current_price as number) || 0,
            change24h: (c.price_change_percentage_24h as number) || 0,
            change7d: (c.price_change_percentage_7d_in_currency as number) || 0,
            market_cap: (c.market_cap as number) || 0,
            ath: (c.ath as number) || 0,
            athPct: (c.ath_change_percentage as number) || 0,
            image: c.image as string,
          })));
        }
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch { /* keep existing */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 60000); return () => clearInterval(i); }, [fetchData]);

  const avgAthPct = coins.length ? coins.slice(0, 20).reduce((s, c) => s + c.athPct, 0) / 20 : -50;
  const phase = getPhase(avgAthPct);
  const nearATH = coins.filter((c) => c.athPct > -10).length;
  const bullIndex = Math.round(Math.max(0, Math.min(100, 100 + avgAthPct)));

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={BULL_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Rocket className="w-7 h-7 text-orange-400" />
                <h1 className="text-2xl font-extrabold">Bullrun Phase Tracker</h1>
              </div>
              <p className="text-sm text-gray-400">Analyse du cycle de marché • Distance aux ATH • Top 50 cryptos</p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* Phase Indicator */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-8 mb-6 text-center">
          <span className="text-6xl">{phase.emoji}</span>
          <h2 className="text-3xl font-black mt-3" style={{ color: phase.color }}>{phase.label}</h2>
          <p className="text-gray-400 mt-2">{phase.desc}</p>
          <div className="mt-6 max-w-lg mx-auto">
            <div className="h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 rounded-full relative">
              <div className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-lg transition-all duration-1000"
                style={{ left: `${bullIndex}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Capitulation</span><span>Accumulation</span><span>Reprise</span><span>Expansion</span><span>Euphorie</span>
            </div>
          </div>
          <p className="text-4xl font-black mt-4" style={{ color: phase.color }}>{bullIndex}/100</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Distance Moy. ATH</p>
            <p className="text-2xl font-extrabold text-amber-400">{avgAthPct.toFixed(1)}%</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Proches de l'ATH</p>
            <p className="text-2xl font-extrabold text-emerald-400">{nearATH}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Bull Index</p>
            <p className="text-2xl font-extrabold" style={{ color: phase.color }}>{bullIndex}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Cryptos Analysées</p>
            <p className="text-2xl font-extrabold">{coins.length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">📊 Top 50 — Distance aux ATH</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">ATH</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">vs ATH</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">7j</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Market Cap</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 uppercase">Phase</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((c, i) => {
                  const p = getPhase(c.athPct);
                  return (
                    <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 text-sm text-gray-500">{i + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {c.image && <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" />}
                          <div><p className="text-sm font-bold">{c.name}</p><p className="text-xs text-gray-500">{c.symbol}</p></div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-bold">${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}</td>
                      <td className="py-3 px-3 text-right text-sm text-gray-400">${c.ath >= 1 ? c.ath.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.ath.toFixed(6)}</td>
                      <td className={`py-3 px-3 text-right text-sm font-bold ${c.athPct > -10 ? "text-emerald-400" : c.athPct > -50 ? "text-amber-400" : "text-red-400"}`}>{c.athPct.toFixed(1)}%</td>
                      <td className={`py-3 px-3 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        <div className="flex items-center justify-end gap-1">
                          {c.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                        </div>
                      </td>
                      <td className={`py-3 px-3 text-right text-sm font-bold ${c.change7d >= 0 ? "text-emerald-400" : "text-red-400"}`}>{c.change7d >= 0 ? "+" : ""}{c.change7d.toFixed(2)}%</td>
                      <td className="py-3 px-3 text-right text-sm text-gray-300">{formatNum(c.market_cap)}</td>
                      <td className="py-3 px-3 text-center"><span className="text-sm">{p.emoji} <span style={{ color: p.color }} className="font-bold text-xs">{p.label}</span></span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}