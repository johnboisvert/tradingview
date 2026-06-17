import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/Sidebar";
import { Flame, RefreshCw, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
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
  const { t } = useTranslation();
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
          title={t("pages.heatmap.title")}
          subtitle={t("pages.heatmap.subtitle")}
          accentColor="orange"
          steps={[
            { n: "1", title: t("pages.heatmap.steps.1.title"), desc: t("pages.heatmap.steps.1.desc") },
            { n: "2", title: t("pages.heatmap.steps.2.title"), desc: t("pages.heatmap.steps.2.desc") },
            { n: "3", title: t("pages.heatmap.steps.3.title"), desc: t("pages.heatmap.steps.3.desc") },
          ]}
        />
        {/* Hero */}
        {/* ===== HERO (premium CSS) ===== */}
        <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]">
          <div className="absolute inset-0 bg-[#0A0E1A]" />
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-orange-500/22 blur-3xl" style={{ animation: "hm-pulse 6s ease-in-out infinite" }} />
          <div className="absolute -bottom-24 right-1/4 w-80 h-80 rounded-full bg-red-500/22 blur-3xl" style={{ animation: "hm-pulse 8s ease-in-out infinite reverse" }} />
          <div className="absolute -top-12 right-1/2 w-72 h-72 rounded-full bg-emerald-500/12 blur-3xl" style={{ animation: "hm-pulse 7s ease-in-out infinite" }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }} />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 md:px-10 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-center" style={{ boxShadow: "0 0 30px rgba(249,115,22,0.3)" }}>
                <Flame className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                    {t("pages.heatmap.hero")}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-500/40 bg-orange-500/10 text-orange-300">
                    <Sparkles className="w-2.5 h-2.5" /> {t("pages.heatmap.topLive")}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-400">
                  {t("pages.heatmap.caption")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-xl overflow-hidden border border-white/[0.1]">
                <button
                  onClick={() => setView("heatmap")}
                  className={`px-3 md:px-4 py-2 text-xs font-bold transition-all ${view === "heatmap" ? "bg-orange-500/25 text-orange-300" : "bg-white/[0.04] text-gray-500 hover:text-white"}`}
                  style={view === "heatmap" ? { boxShadow: "inset 0 0 0 1px rgba(249,115,22,0.3)" } : {}}
                >
                  🔥 {t("pages.heatmap.viewHeatmap").replace("🔥 ", "")}
                </button>
                <button
                  onClick={() => setView("table")}
                  className={`px-3 md:px-4 py-2 text-xs font-bold transition-all ${view === "table" ? "bg-orange-500/25 text-orange-300" : "bg-white/[0.04] text-gray-500 hover:text-white"}`}
                  style={view === "table" ? { boxShadow: "inset 0 0 0 1px rgba(249,115,22,0.3)" } : {}}
                >
                  📊 {t("pages.heatmap.viewTable").replace("📊 ", "")}
                </button>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-sm font-semibold transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">{lastUpdate ? t("pages.heatmap.lastUpdate", { time: lastUpdate }) : t("pages.heatmap.refresh")}</span>
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes hm-pulse {
            0%, 100% { transform: scale(1) translate(0,0); opacity: 0.3; }
            50% { transform: scale(1.2) translate(20px,-10px); opacity: 0.45; }
          }
          @keyframes hm-fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .hm-anim { animation: hm-fadeUp 0.6s ease-out both; }
        `}</style>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
          {[
            { label: t("pages.heatmap.kpiCryptos"), value: coins.length, color: "#cbd5e1", glow: "rgba(255,255,255,0.1)" },
            { label: t("pages.heatmap.kpiMarketCap"), value: formatNum(totalMC), color: "#a78bfa", glow: "rgba(167,139,250,0.3)" },
            { label: t("pages.heatmap.kpiAvgChange"), value: `${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`, color: avgChange >= 0 ? "#22c55e" : "#ef4444", glow: avgChange >= 0 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)" },
            { label: t("pages.heatmap.kpiGainers"), value: gainers, color: "#22c55e", glow: "rgba(34,197,94,0.3)" },
            { label: t("pages.heatmap.kpiLosers"), value: losers, color: "#ef4444", glow: "rgba(239,68,68,0.3)" },
            { label: t("pages.heatmap.kpiRatio"), value: losers > 0 ? (gainers / losers).toFixed(2) : "—", color: "#22d3ee", glow: "rgba(34,211,238,0.3)" },
          ].map((k, i) => (
            <div key={i}
              className="hm-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-4 transition-all overflow-hidden"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-3xl opacity-25" style={{ background: k.color }} />
              <div className="relative">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{k.label}</p>
                <p className="text-xl md:text-2xl font-black tracking-tight" style={{ color: k.color, textShadow: `0 0 14px ${k.glow}` }}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Top Gainer / Top Loser highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
          <div className="hm-anim relative bg-gradient-to-br from-emerald-500/[0.06] to-transparent border border-emerald-500/20 rounded-2xl p-4 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-emerald-500/20 blur-3xl" />
            <p className="relative text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">
              🥇 {t("pages.heatmap.topGainer24h")}
            </p>
            {topGainer && (
              <div className="relative flex items-center gap-3">
                {topGainer.image && (
                  <img
                    src={topGainer.image}
                    alt=""
                    className="w-9 h-9 rounded-full ring-1 ring-emerald-500/40"
                  />
                )}
                <div>
                  <div className="text-base font-black">{topGainer.symbol}</div>
                  <div className="text-[10px] text-gray-400">{topGainer.name}</div>
                </div>
                <span className="text-lg font-black text-emerald-400 ml-auto" style={{ textShadow: "0 0 12px rgba(34,197,94,0.4)" }}>
                  +{topGainer.change24h.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <div className="hm-anim relative bg-gradient-to-br from-red-500/[0.06] to-transparent border border-red-500/20 rounded-2xl p-4 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-red-500/20 blur-3xl" />
            <p className="relative text-[10px] text-red-400 font-bold uppercase tracking-wider mb-2">
              🔻 {t("pages.heatmap.topLoser24h")}
            </p>
            {topLoser && (
              <div className="relative flex items-center gap-3">
                {topLoser.image && (
                  <img
                    src={topLoser.image}
                    alt=""
                    className="w-9 h-9 rounded-full ring-1 ring-red-500/40"
                  />
                )}
                <div>
                  <div className="text-base font-black">{topLoser.symbol}</div>
                  <div className="text-[10px] text-gray-400">{topLoser.name}</div>
                </div>
                <span className="text-lg font-black text-red-400 ml-auto" style={{ textShadow: "0 0 12px rgba(239,68,68,0.4)" }}>
                  {topLoser.change24h.toFixed(2)}%
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
            {t("pages.heatmap.avgChange24h")}:{" "}
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