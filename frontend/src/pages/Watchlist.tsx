import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Eye, RefreshCw, TrendingUp, TrendingDown, Plus, X, Search } from "lucide-react";

const WATCH_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

interface WatchCoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  market_cap: number;
  volume: number;
  high24h: number;
  low24h: number;
  image: string;
  sparkline: number[];
}

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={positive ? "#10B981" : "#EF4444"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const DEFAULT_WATCHLIST = ["bitcoin", "ethereum", "solana", "binancecoin", "ripple", "cardano", "dogecoin", "avalanche-2", "polkadot", "chainlink"];

export default function Watchlist() {
  const [allCoins, setAllCoins] = useState<WatchCoin[]>([]);
  const [watchIds, setWatchIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("cryptoia_watchlist");
      return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
    } catch {
      return DEFAULT_WATCHLIST;
    }
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h,7d"
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllCoins(
            data.map((c: Record<string, unknown>) => ({
              id: c.id as string,
              symbol: ((c.symbol as string) || "").toUpperCase(),
              name: c.name as string,
              price: (c.current_price as number) || 0,
              change24h: (c.price_change_percentage_24h as number) || 0,
              change7d: (c.price_change_percentage_7d_in_currency as number) || 0,
              market_cap: (c.market_cap as number) || 0,
              volume: (c.total_volume as number) || 0,
              high24h: (c.high_24h as number) || 0,
              low24h: (c.low_24h as number) || 0,
              image: c.image as string,
              sparkline: ((c.sparkline_in_7d as { price?: number[] })?.price || []).slice(-24),
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

  useEffect(() => {
    localStorage.setItem("cryptoia_watchlist", JSON.stringify(watchIds));
  }, [watchIds]);

  const watchCoins = allCoins.filter((c) => watchIds.includes(c.id));
  const availableCoins = allCoins.filter((c) => !watchIds.includes(c.id) && (!search || c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase())));

  const addCoin = (id: string) => setWatchIds((prev) => [...prev, id]);
  const removeCoin = (id: string) => setWatchIds((prev) => prev.filter((x) => x !== id));

  const totalValue = watchCoins.reduce((s, c) => s + c.market_cap, 0);
  const avgChange = watchCoins.length ? watchCoins.reduce((s, c) => s + c.change24h, 0) / watchCoins.length : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={WATCH_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Eye className="w-7 h-7 text-purple-400" />
                <h1 className="text-2xl font-extrabold">Watchlist</h1>
              </div>
              <p className="text-sm text-gray-400">Suivez vos cryptos favorites • Données en temps réel • Sparklines 7j</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-sm font-bold hover:brightness-110 transition-all">
                <Plus className="w-4 h-4" /> Ajouter
              </button>
              <button onClick={fetchData} disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
              </button>
            </div>
          </div>
        </div>

        {/* Add Panel */}
        {showAdd && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Search className="w-4 h-4 text-gray-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une crypto à ajouter..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none" />
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {availableCoins.slice(0, 30).map((c) => (
                <button key={c.id} onClick={() => addCoin(c.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-semibold transition-all">
                  {c.image && <img src={c.image} alt={c.symbol} className="w-4 h-4 rounded-full" />}
                  {c.symbol}
                  <Plus className="w-3 h-3 text-emerald-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Cryptos Suivies</p>
            <p className="text-2xl font-extrabold">{watchCoins.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Market Cap Total</p>
            <p className="text-2xl font-extrabold text-purple-400">{formatNum(totalValue)}</p>
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
              {watchCoins.filter((c) => c.change24h > 0).length}/{watchCoins.length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Ma Watchlist</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">7j</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">High/Low 24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Volume</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">7j Chart</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {watchCoins.map((c, i) => (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {c.image && <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" />}
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
                    <td className="py-3 px-3 text-right text-xs text-gray-400">
                      <span className="text-emerald-400">${c.high24h >= 1 ? c.high24h.toFixed(2) : c.high24h.toFixed(6)}</span>
                      {" / "}
                      <span className="text-red-400">${c.low24h >= 1 ? c.low24h.toFixed(2) : c.low24h.toFixed(6)}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-gray-300">{formatNum(c.volume)}</td>
                    <td className="py-3 px-3 text-right">
                      <MiniSparkline data={c.sparkline} positive={c.change7d >= 0} />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button onClick={() => removeCoin(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {watchCoins.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-gray-500">
                      Votre watchlist est vide. Cliquez sur "Ajouter" pour suivre des cryptos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}