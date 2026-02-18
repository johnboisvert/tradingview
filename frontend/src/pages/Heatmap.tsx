import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Flame, RefreshCw } from "lucide-react";

const HEAT_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

interface HeatCoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  market_cap: number;
  image: string;
}

function getHeatColor(change: number): string {
  if (change >= 10) return "bg-emerald-500";
  if (change >= 5) return "bg-emerald-600";
  if (change >= 2) return "bg-emerald-700";
  if (change >= 0) return "bg-emerald-900/60";
  if (change >= -2) return "bg-red-900/60";
  if (change >= -5) return "bg-red-700";
  if (change >= -10) return "bg-red-600";
  return "bg-red-500";
}

function getSize(mc: number, maxMC: number): string {
  const ratio = mc / maxMC;
  if (ratio > 0.3) return "col-span-3 row-span-2";
  if (ratio > 0.1) return "col-span-2 row-span-2";
  if (ratio > 0.03) return "col-span-2";
  return "";
}

export default function Heatmap() {
  const [coins, setCoins] = useState<HeatCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

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
              market_cap: (c.market_cap as number) || 0,
              image: c.image as string,
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

  const maxMC = coins.length ? coins[0].market_cap : 1;
  const gainers = coins.filter((c) => c.change24h > 0).length;
  const losers = coins.filter((c) => c.change24h < 0).length;
  const avgChange = coins.length ? coins.reduce((s, c) => s + c.change24h, 0) / coins.length : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={HEAT_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Flame className="w-7 h-7 text-orange-400" />
                <h1 className="text-2xl font-extrabold">Heatmap Crypto</h1>
              </div>
              <p className="text-sm text-gray-400">Carte thermique du marché • Top 50 cryptos par capitalisation</p>
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

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Cryptos Analysées</p>
            <p className="text-2xl font-extrabold">{coins.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">En Hausse</p>
            <p className="text-2xl font-extrabold text-emerald-400">{gainers}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">En Baisse</p>
            <p className="text-2xl font-extrabold text-red-400">{losers}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Variation Moyenne</p>
            <p className={`text-2xl font-extrabold ${avgChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[
              { label: "< -10%", cls: "bg-red-500" },
              { label: "-5%", cls: "bg-red-600" },
              { label: "-2%", cls: "bg-red-700" },
              { label: "0%", cls: "bg-gray-700" },
              { label: "+2%", cls: "bg-emerald-700" },
              { label: "+5%", cls: "bg-emerald-600" },
              { label: "> +10%", cls: "bg-emerald-500" },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-5 h-3 rounded ${l.cls}`} />
                <span className="text-xs text-gray-400">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-8 gap-1.5 auto-rows-[60px]">
            {coins.map((c) => (
              <div
                key={c.id}
                className={`${getHeatColor(c.change24h)} ${getSize(c.market_cap, maxMC)} rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer hover:brightness-125 transition-all group relative`}
              >
                <div className="flex items-center gap-1">
                  {c.image && <img src={c.image} alt={c.symbol} className="w-4 h-4 rounded-full" />}
                  <span className="text-xs font-extrabold text-white">{c.symbol}</span>
                </div>
                <span className={`text-[10px] font-bold ${c.change24h >= 0 ? "text-white/90" : "text-white/90"}`}>
                  {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(1)}%
                </span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/95 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none">
                  <p className="font-bold">{c.name} ({c.symbol})</p>
                  <p className="text-gray-400">${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}</p>
                  <p className={c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                  </p>
                  <p className="text-gray-500">MC: ${(c.market_cap / 1e9).toFixed(1)}B</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">📊 Détails — Top 50</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((c, i) => (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {c.image && <img src={c.image} alt={c.symbol} className="w-6 h-6 rounded-full" />}
                        <span className="text-sm font-bold">{c.symbol}</span>
                        <span className="text-xs text-gray-500">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm font-bold">
                      ${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}
                    </td>
                    <td className={`py-2.5 px-3 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm text-gray-300">
                      ${(c.market_cap / 1e9).toFixed(2)}B
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