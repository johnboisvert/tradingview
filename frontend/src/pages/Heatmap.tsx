import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Flame, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

interface HeatCoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  market_cap: number;
  image: string;
  rank: number;
}

function getHeatColor(change: number): string {
  if (change >= 15) return "bg-emerald-400";
  if (change >= 10) return "bg-emerald-500";
  if (change >= 5) return "bg-emerald-600";
  if (change >= 2) return "bg-emerald-700";
  if (change >= 0) return "bg-emerald-900/60";
  if (change >= -2) return "bg-red-900/60";
  if (change >= -5) return "bg-red-700";
  if (change >= -10) return "bg-red-600";
  if (change >= -15) return "bg-red-500";
  return "bg-red-400";
}

function getTextColor(change: number): string {
  if (Math.abs(change) >= 10) return "text-white font-extrabold";
  return "text-white/90";
}

function getSize(rank: number): string {
  if (rank <= 2) return "col-span-3 row-span-2";
  if (rank <= 5) return "col-span-2 row-span-2";
  if (rank <= 15) return "col-span-2";
  return "";
}

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export default function Heatmap() {
  const [coins, setCoins] = useState<HeatCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [view, setView] = useState<"heatmap" | "table">("heatmap");
  const [sortBy, setSortBy] = useState<"rank" | "change" | "mcap">("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const allData = await fetchTop200(false);
      if (allData.length > 0) {
        setCoins(
          allData.map((c, idx) => ({
            id: c.id,
            symbol: c.symbol.toUpperCase(),
            name: c.name,
            price: c.current_price || 0,
            change24h: c.price_change_percentage_24h || 0,
            market_cap: c.market_cap || 0,
            image: c.image,
            rank: idx + 1,
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

  const gainers = coins.filter((c) => c.change24h > 0).length;
  const losers = coins.filter((c) => c.change24h < 0).length;
  const avgChange = coins.length
    ? coins.reduce((s, c) => s + c.change24h, 0) / coins.length
    : 0;
  const totalMC = coins.reduce((s, c) => s + c.market_cap, 0);

  const topGainer = [...coins].sort((a, b) => b.change24h - a.change24h)[0];
  const topLoser = [...coins].sort((a, b) => a.change24h - b.change24h)[0];

  const sortedCoins = [...coins].sort((a, b) => {
    let diff = 0;
    switch (sortBy) {
      case "change":
        diff = a.change24h - b.change24h;
        break;
      case "mcap":
        diff = a.market_cap - b.market_cap;
        break;
      default:
        diff = a.rank - b.rank;
    }
    return sortDir === "desc" ? -diff : diff;
  });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir(col === "change" ? "desc" : "asc");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
      <PageHeader
          icon={<Flame className="w-6 h-6" />}
          title="Heatmap Crypto"
          subtitle="Visualisez d’un coup d’oeil les performances du marché. Les couleurs chaudes (rouge/orange) indiquent des baisses, les couleurs froides (vert) indiquent des hausses."
          accentColor="orange"
          steps={[
            { n: "1", title: "Lisez les couleurs", desc: "Vert intense = forte hausse. Rouge intense = forte baisse. Gris = variation neutre. La taille des blocs reflète la market cap." },
            { n: "2", title: "Basculez entre les vues", desc: "Mode Heatmap pour une vue visuelle rapide, mode Tableau pour les données précises avec tri par colonne." },
            { n: "3", title: "Identifiez les secteurs", desc: "Repérez les groupes de cryptos qui bougent ensemble pour détecter des rotations sectorielles (DeFi, L1, Gaming...)." },
          ]}
        />
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px] bg-gradient-to-r from-orange-900/40 to-red-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/90 via-[#0A0E1A]/60 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Flame className="w-7 h-7 text-orange-400" />
                <h1 className="text-2xl font-extrabold">Heatmap Crypto</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  TOP 200 LIVE
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Carte thermique du marché • Top 200 cryptos en temps réel • MAJ
                auto 60s
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
                <button
                  onClick={() => setView("heatmap")}
                  className={`px-4 py-2 text-xs font-bold transition-all ${view === "heatmap" ? "bg-orange-500/20 text-orange-400" : "bg-white/[0.04] text-gray-500 hover:text-white"}`}
                >
                  Heatmap
                </button>
                <button
                  onClick={() => setView("table")}
                  className={`px-4 py-2 text-xs font-bold transition-all ${view === "table" ? "bg-orange-500/20 text-orange-400" : "bg-white/[0.04] text-gray-500 hover:text-white"}`}
                >
                  Tableau
                </button>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
              </button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-[10px] text-gray-500 font-semibold mb-1">
              Cryptos
            </p>
            <p className="text-xl font-extrabold">{coins.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-[10px] text-gray-500 font-semibold mb-1">
              Market Cap Total
            </p>
            <p className="text-xl font-extrabold text-purple-400">
              {formatNum(totalMC)}
            </p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-[10px] text-gray-500 font-semibold mb-1">
              En Hausse
            </p>
            <p className="text-xl font-extrabold text-emerald-400">{gainers}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-[10px] text-gray-500 font-semibold mb-1">
              En Baisse
            </p>
            <p className="text-xl font-extrabold text-red-400">{losers}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-[10px] text-gray-500 font-semibold mb-1">
              Top Gainer
            </p>
            {topGainer && (
              <div className="flex items-center gap-1.5">
                {topGainer.image && (
                  <img
                    src={topGainer.image}
                    alt=""
                    className="w-4 h-4 rounded-full"
                  />
                )}
                <span className="text-sm font-bold">{topGainer.symbol}</span>
                <span className="text-xs font-bold text-emerald-400">
                  +{topGainer.change24h.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-[10px] text-gray-500 font-semibold mb-1">
              Top Loser
            </p>
            {topLoser && (
              <div className="flex items-center gap-1.5">
                {topLoser.image && (
                  <img
                    src={topLoser.image}
                    alt=""
                    className="w-4 h-4 rounded-full"
                  />
                )}
                <span className="text-sm font-bold">{topLoser.symbol}</span>
                <span className="text-xs font-bold text-red-400">
                  {topLoser.change24h.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[
              { label: "< -15%", cls: "bg-red-400" },
              { label: "-10%", cls: "bg-red-500" },
              { label: "-5%", cls: "bg-red-600" },
              { label: "-2%", cls: "bg-red-700" },
              { label: "0%", cls: "bg-red-900/60" },
              { label: "+2%", cls: "bg-emerald-900/60" },
              { label: "+5%", cls: "bg-emerald-700" },
              { label: "+10%", cls: "bg-emerald-600" },
              { label: "> +15%", cls: "bg-emerald-400" },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-5 h-3 rounded ${l.cls}`} />
                <span className="text-[10px] text-gray-400">{l.label}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-2">
            Variation moyenne 24h:{" "}
            <span
              className={
                avgChange >= 0 ? "text-emerald-400" : "text-red-400"
              }
            >
              {avgChange >= 0 ? "+" : ""}
              {avgChange.toFixed(2)}%
            </span>
          </p>
        </div>

        {loading && coins.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-orange-400 mr-3" />
            <span className="text-gray-400">
              Chargement de 200 cryptos...
            </span>
          </div>
        ) : view === "heatmap" ? (
          /* Heatmap Grid */
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-10 gap-1 auto-rows-[55px]">
              {coins.map((c) => (
                <div
                  key={c.id}
                  className={`${getHeatColor(c.change24h)} ${getSize(c.rank)} rounded-lg p-1.5 flex flex-col items-center justify-center cursor-pointer hover:brightness-125 transition-all group relative`}
                >
                  <div className="flex items-center gap-1">
                    {c.image && (
                      <img
                        src={c.image}
                        alt={c.symbol}
                        className="w-3.5 h-3.5 rounded-full"
                      />
                    )}
                    <span
                      className={`text-[10px] font-extrabold ${getTextColor(c.change24h)}`}
                    >
                      {c.symbol}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold ${getTextColor(c.change24h)}`}
                  >
                    {c.change24h >= 0 ? "+" : ""}
                    {c.change24h.toFixed(1)}%
                  </span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/95 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none border border-white/10">
                    <p className="font-bold">
                      #{c.rank} {c.name} ({c.symbol})
                    </p>
                    <p className="text-gray-400">
                      $
                      {c.price >= 1
                        ? c.price.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })
                        : c.price.toFixed(6)}
                    </p>
                    <p
                      className={
                        c.change24h >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {c.change24h >= 0 ? "+" : ""}
                      {c.change24h.toFixed(2)}%
                    </p>
                    <p className="text-gray-500">
                      MC: {formatNum(c.market_cap)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">
              📊 Détails — Top 200 Cryptos
            </h2>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full min-w-[700px]">
                <thead className="sticky top-0 bg-[#111827] z-10">
                  <tr className="border-b border-white/[0.06]">
                    <th
                      className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-white"
                      onClick={() => toggleSort("rank")}
                    >
                      #{" "}
                      {sortBy === "rank"
                        ? sortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">
                      Crypto
                    </th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">
                      Prix
                    </th>
                    <th
                      className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-white"
                      onClick={() => toggleSort("change")}
                    >
                      24h{" "}
                      {sortBy === "change"
                        ? sortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                    <th
                      className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-white"
                      onClick={() => toggleSort("mcap")}
                    >
                      Market Cap{" "}
                      {sortBy === "mcap"
                        ? sortDir === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCoins.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-2 px-3 text-sm text-gray-500">
                        {c.rank}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          {c.image && (
                            <img
                              src={c.image}
                              alt={c.symbol}
                              className="w-5 h-5 rounded-full"
                            />
                          )}
                          <span className="text-sm font-bold">{c.symbol}</span>
                          <span className="text-xs text-gray-500">
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right text-sm font-bold">
                        $
                        {c.price >= 1
                          ? c.price.toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })
                          : c.price.toFixed(6)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}
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
                      <td className="py-2 px-3 text-right text-sm text-gray-300">
                        {formatNum(c.market_cap)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <Footer />
      </main>
    </div>
  );
}