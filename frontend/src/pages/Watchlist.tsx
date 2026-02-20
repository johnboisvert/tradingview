import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Eye, RefreshCw, TrendingUp, TrendingDown, Plus, X, Search, Star } from "lucide-react";
import Footer from "@/components/Footer";

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
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#10B981" : "#EF4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const DEFAULT_WATCHLIST = [
  "bitcoin",
  "ethereum",
  "solana",
  "binancecoin",
  "ripple",
  "cardano",
  "dogecoin",
  "avalanche-2",
  "polkadot",
  "chainlink",
];

export default function Watchlist() {
  const [allCoins, setAllCoins] = useState<WatchCoin[]>([]);
  const [watchIds, setWatchIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("cryptoia_watchlist");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [...DEFAULT_WATCHLIST];
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [sortBy, setSortBy] = useState<"rank" | "price" | "change24h" | "change7d" | "volume">("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const data = await fetchTop200(true);
      if (data.length > 0) {
        setAllCoins(
          data.map((c) => ({
            id: c.id,
            symbol: (c.symbol || "").toUpperCase(),
            name: c.name,
            price: c.current_price || 0,
            change24h: c.price_change_percentage_24h || 0,
            change7d: c.price_change_percentage_7d_in_currency || 0,
            market_cap: c.market_cap || 0,
            volume: c.total_volume || 0,
            high24h: (c as any).high_24h || 0,
            low24h: (c as any).low_24h || 0,
            image: c.image,
            sparkline: (c.sparkline_in_7d?.price || []).slice(-24),
          }))
        );
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      /* keep existing */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cryptoia_watchlist", JSON.stringify(watchIds));
  }, [watchIds]);

  const watchCoins = allCoins.filter((c) => watchIds.includes(c.id));

  // Sort watched coins
  const sortedWatchCoins = [...watchCoins].sort((a, b) => {
    let diff = 0;
    switch (sortBy) {
      case "price":
        diff = a.price - b.price;
        break;
      case "change24h":
        diff = a.change24h - b.change24h;
        break;
      case "change7d":
        diff = a.change7d - b.change7d;
        break;
      case "volume":
        diff = a.volume - b.volume;
        break;
      default:
        diff = watchIds.indexOf(a.id) - watchIds.indexOf(b.id);
    }
    return sortDir === "desc" ? -diff : diff;
  });

  const availableCoins = allCoins.filter(
    (c) =>
      !watchIds.includes(c.id) &&
      (!search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase()))
  );

  const addCoin = (id: string) => {
    setWatchIds((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  };

  const removeCoin = (id: string) => {
    setWatchIds((prev) => prev.filter((x) => x !== id));
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const totalValue = watchCoins.reduce((s, c) => s + c.market_cap, 0);
  const avgChange = watchCoins.length
    ? watchCoins.reduce((s, c) => s + c.change24h, 0) / watchCoins.length
    : 0;

  const SortIcon = ({ col }: { col: typeof sortBy }) => (
    <span className="ml-1 text-[10px]">
      {sortBy === col ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px] bg-gradient-to-r from-purple-900/40 to-indigo-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/90 via-[#0A0E1A]/60 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Eye className="w-7 h-7 text-purple-400" />
                <h1 className="text-2xl font-extrabold">Watchlist</h1>
              </div>
              <p className="text-sm text-gray-400">
                Suivez vos cryptos favorites • Données en temps réel • Sparklines 7j
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-sm font-bold hover:brightness-110 transition-all"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
              </button>
            </div>
          </div>
        </div>

        {/* Add Panel */}
        {showAdd && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 mb-6 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une crypto à ajouter... (ex: Solana, DOGE, Avalanche)"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                autoFocus
              />
              <span className="text-xs text-gray-500">{availableCoins.length} disponibles</span>
              <button onClick={() => { setShowAdd(false); setSearch(""); }} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {availableCoins.length === 0 && (
                <p className="text-sm text-gray-500 py-2">
                  {search ? "Aucun résultat trouvé" : "Toutes les cryptos sont déjà dans votre watchlist !"}
                </p>
              )}
              {availableCoins.slice(0, 50).map((c) => (
                <button
                  key={c.id}
                  onClick={() => addCoin(c.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-purple-500/20 border border-white/[0.06] hover:border-purple-500/30 text-xs font-semibold transition-all group"
                >
                  {c.image && (
                    <img src={c.image} alt={c.symbol} className="w-5 h-5 rounded-full" />
                  )}
                  <span>{c.symbol}</span>
                  <span className="text-gray-600 text-[10px]">{c.name}</span>
                  <Plus className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Cryptos Suivies</p>
            <p className="text-2xl font-extrabold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              {watchCoins.length}
            </p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Market Cap Total</p>
            <p className="text-2xl font-extrabold text-purple-400">{formatNum(totalValue)}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Variation Moyenne 24h</p>
            <p
              className={`text-2xl font-extrabold ${avgChange >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {avgChange >= 0 ? "+" : ""}
              {avgChange.toFixed(2)}%
            </p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">En Hausse / Total</p>
            <p className="text-2xl font-extrabold text-emerald-400">
              {watchCoins.filter((c) => c.change24h > 0).length}/{watchCoins.length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" /> Ma Watchlist
            </h2>
            <p className="text-xs text-gray-500">Cliquez sur les en-têtes pour trier</p>
          </div>
          {loading && allCoins.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mr-3" />
              <span className="text-gray-400">Chargement des données...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th
                      className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-white"
                      onClick={() => toggleSort("rank")}
                    >
                      # <SortIcon col="rank" />
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">
                      Crypto
                    </th>
                    <th
                      className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-white"
                      onClick={() => toggleSort("price")}
                    >
                      Prix <SortIcon col="price" />
                    </th>
                    <th
                      className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-white"
                      onClick={() => toggleSort("change24h")}
                    >
                      24h <SortIcon col="change24h" />
                    </th>
                    <th
                      className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-white"
                      onClick={() => toggleSort("change7d")}
                    >
                      7j <SortIcon col="change7d" />
                    </th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">
                      High/Low 24h
                    </th>
                    <th
                      className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-white"
                      onClick={() => toggleSort("volume")}
                    >
                      Volume <SortIcon col="volume" />
                    </th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">
                      7j Chart
                    </th>
                    <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 uppercase">
                      Retirer
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedWatchCoins.map((c, i) => (
                    <tr
                      key={c.id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-3 text-sm text-gray-500">{i + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {c.image && (
                            <img
                              src={c.image}
                              alt={c.symbol}
                              className="w-7 h-7 rounded-full"
                            />
                          )}
                          <div>
                            <p className="text-sm font-bold">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-bold">
                        $
                        {c.price >= 1
                          ? c.price.toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })
                          : c.price.toFixed(6)}
                      </td>
                      <td
                        className={`py-3 px-3 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {c.change24h >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {c.change24h >= 0 ? "+" : ""}
                          {c.change24h.toFixed(2)}%
                        </div>
                      </td>
                      <td
                        className={`py-3 px-3 text-right text-sm font-bold ${c.change7d >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {c.change7d >= 0 ? "+" : ""}
                        {c.change7d.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-gray-400">
                        <span className="text-emerald-400">
                          ${c.high24h >= 1 ? c.high24h.toFixed(2) : c.high24h.toFixed(6)}
                        </span>
                        {" / "}
                        <span className="text-red-400">
                          ${c.low24h >= 1 ? c.low24h.toFixed(2) : c.low24h.toFixed(6)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-gray-300">
                        {formatNum(c.volume)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <MiniSparkline data={c.sparkline} positive={c.change7d >= 0} />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => removeCoin(c.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                          title="Retirer de la watchlist"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedWatchCoins.length === 0 && !loading && (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Star className="w-10 h-10 text-gray-700" />
                          <p className="text-gray-500 font-semibold">
                            Votre watchlist est vide
                          </p>
                          <button
                            onClick={() => setShowAdd(true)}
                            className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 text-sm font-bold hover:bg-purple-500/30 transition-all"
                          >
                            <Plus className="w-4 h-4 inline mr-1" />
                            Ajouter des cryptos
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}