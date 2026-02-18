import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { LineChart, RefreshCw } from "lucide-react";

const GRAPH_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/b3c0b3a0-ae42-46d0-9f3a-9f12780c9e10.png";

interface ChartCoin {
  id: string; symbol: string; name: string; price: number; change24h: number; image: string;
  sparkline: number[];
}

function SparkChart({ data, width = 500, height = 200, positive }: { data: number[]; width?: number; height?: number; positive: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 20) - 10}`).join(" ");
  const fillPoints = `0,${height} ${points} ${width},${height}`;
  const color = positive ? "#10B981" : "#EF4444";

  return (
    <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`grad-${positive ? "g" : "r"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <line key={pct} x1="0" y1={height - pct * (height - 20) - 10} x2={width} y2={height - pct * (height - 20) - 10} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <polygon points={fillPoints} fill={`url(#grad-${positive ? "g" : "r"})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point */}
      {data.length > 0 && (
        <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * (height - 20) - 10} r="4" fill={color} stroke="white" strokeWidth="1.5" />
      )}
      {/* Price labels */}
      <text x="5" y="15" fill="rgba(255,255,255,0.3)" fontSize="10">${max.toLocaleString("en-US", { maximumFractionDigits: max >= 1 ? 2 : 6 })}</text>
      <text x="5" y={height - 5} fill="rgba(255,255,255,0.3)" fontSize="10">${min.toLocaleString("en-US", { maximumFractionDigits: min >= 1 ? 2 : 6 })}</text>
    </svg>
  );
}

export default function Graphiques() {
  const [coins, setCoins] = useState<ChartCoin[]>([]);
  const [selected, setSelected] = useState("bitcoin");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h"
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
            image: c.image as string,
            sparkline: ((c.sparkline_in_7d as { price?: number[] })?.price) || [],
          })));
        }
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 120000); return () => clearInterval(i); }, [fetchData]);

  const selectedCoin = coins.find((c) => c.id === selected);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={GRAPH_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <LineChart className="w-7 h-7 text-cyan-400" />
                <h1 className="text-2xl font-extrabold">Graphiques Crypto</h1>
              </div>
              <p className="text-sm text-gray-400">Graphiques sparkline 7 jours • Top 50 cryptos</p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* Coin Selector */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {coins.slice(0, 20).map((c) => (
              <button key={c.id} onClick={() => setSelected(c.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selected === c.id
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]"
                }`}>
                {c.image && <img src={c.image} alt={c.symbol} className="w-4 h-4 rounded-full" />}
                {c.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Main Chart */}
        {selectedCoin && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {selectedCoin.image && <img src={selectedCoin.image} alt={selectedCoin.symbol} className="w-8 h-8 rounded-full" />}
                <div>
                  <h2 className="text-xl font-extrabold">{selectedCoin.name} ({selectedCoin.symbol})</h2>
                  <p className="text-sm text-gray-400">Graphique 7 jours</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold">${selectedCoin.price >= 1 ? selectedCoin.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : selectedCoin.price.toFixed(6)}</p>
                <p className={`text-sm font-bold ${selectedCoin.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {selectedCoin.change24h >= 0 ? "+" : ""}{selectedCoin.change24h.toFixed(2)}% (24h)
                </p>
              </div>
            </div>
            <SparkChart data={selectedCoin.sparkline} positive={selectedCoin.change24h >= 0} height={250} />
          </div>
        )}

        {/* All Mini Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coins.slice(0, 30).map((c) => (
            <div key={c.id} onClick={() => setSelected(c.id)}
              className={`bg-[#111827] border rounded-2xl p-4 cursor-pointer transition-all hover:border-white/[0.15] ${
                selected === c.id ? "border-cyan-500/30" : "border-white/[0.06]"
              }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {c.image && <img src={c.image} alt={c.symbol} className="w-6 h-6 rounded-full" />}
                  <div>
                    <p className="text-sm font-bold">{c.symbol}</p>
                    <p className="text-[10px] text-gray-500">{c.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}</p>
                  <p className={`text-xs font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                  </p>
                </div>
              </div>
              <SparkChart data={c.sparkline.slice(-48)} width={300} height={60} positive={c.change24h >= 0} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}