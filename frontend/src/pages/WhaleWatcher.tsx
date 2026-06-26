import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/Sidebar";
import { Fish, RefreshCw, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react";
import Footer from "@/components/Footer";

const WHALE_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/ed81f7f8-96b1-4d85-b286-6e3ee422e749.png";

interface WhaleActivity {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  volMcapRatio: number;
  whaleScore: number;
  signal: "accumulation" | "distribution" | "neutral";
  reason: string;
}

function formatUsd(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function analyzeWhaleActivity(coins: any[], tr: (k: string, v?: any) => string): WhaleActivity[] {
  return coins
    .filter((c: any) => c && c.symbol && c.current_price && c.market_cap > 0)
    .map((c: any) => {
      const volume = c.total_volume || 0;
      const mcap = c.market_cap || 1;
      const change24h = c.price_change_percentage_24h || 0;
      const volMcapRatio = volume / mcap;

      // Whale score: based on volume/mcap ratio and price movement
      // High volume relative to mcap = whale activity
      let whaleScore = 0;
      if (volMcapRatio > 0.5) whaleScore += 40;
      else if (volMcapRatio > 0.3) whaleScore += 30;
      else if (volMcapRatio > 0.15) whaleScore += 20;
      else if (volMcapRatio > 0.08) whaleScore += 10;

      // Large price movements indicate whale activity
      const absChange = Math.abs(change24h);
      if (absChange > 10) whaleScore += 30;
      else if (absChange > 5) whaleScore += 20;
      else if (absChange > 3) whaleScore += 15;
      else if (absChange > 1) whaleScore += 5;

      // High absolute volume
      if (volume > 5e9) whaleScore += 20;
      else if (volume > 1e9) whaleScore += 15;
      else if (volume > 500e6) whaleScore += 10;
      else if (volume > 100e6) whaleScore += 5;

      // Determine signal based on real data patterns
      let signal: WhaleActivity["signal"];
      let reason: string;

      if (change24h > 3 && volMcapRatio > 0.15) {
        signal = "accumulation";
        reason = tr("pages.whaleWatcherExtra.reasonRiseHighVol", { change: change24h.toFixed(1), ratio: (volMcapRatio * 100).toFixed(1) });
      } else if (change24h < -3 && volMcapRatio > 0.15) {
        signal = "distribution";
        reason = tr("pages.whaleWatcherExtra.reasonFallHighVol", { change: change24h.toFixed(1), ratio: (volMcapRatio * 100).toFixed(1) });
      } else if (volMcapRatio > 0.25 && Math.abs(change24h) < 2) {
        signal = "accumulation";
        reason = tr("pages.whaleWatcherExtra.reasonSilent", { ratio: (volMcapRatio * 100).toFixed(1) });
      } else if (change24h < -5) {
        signal = "distribution";
        reason = tr("pages.whaleWatcherExtra.reasonBigFall", { change: change24h.toFixed(1) });
      } else if (change24h > 5) {
        signal = "accumulation";
        reason = tr("pages.whaleWatcherExtra.reasonBigRise", { change: change24h.toFixed(1) });
      } else {
        signal = "neutral";
        reason = tr("pages.whaleWatcherExtra.reasonNormal", { ratio: (volMcapRatio * 100).toFixed(1), change: (change24h > 0 ? "+" : "") + change24h.toFixed(1) });
      }

      whaleScore = Math.min(100, Math.max(0, whaleScore));

      return {
        id: c.id,
        symbol: (c.symbol || "").toUpperCase(),
        name: c.name || "Unknown",
        image: c.image || "",
        price: c.current_price,
        change24h,
        volume24h: volume,
        marketCap: mcap,
        volMcapRatio,
        whaleScore,
        signal,
        reason,
      };
    })
    .sort((a: WhaleActivity, b: WhaleActivity) => b.whaleScore - a.whaleScore);
}

export default function WhaleWatcher() {
  const { t, i18n } = useTranslation();
  const [activities, setActivities] = useState<WhaleActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "accumulation" | "distribution" | "neutral">("ALL");
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const data = await fetchTop200(false);
      if (data.length > 0) {
        setActivities(analyzeWhaleActivity(data, t as (k: string, v?: any) => string));
      }
      setLastUpdate(new Date().toLocaleTimeString(i18n.language === "en" ? "en-US" : "fr-FR"));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [t, i18n.language]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = activities.filter((a) => {
    if (filter !== "ALL" && a.signal !== filter) return false;
    return true;
  });

  const accumulationCount = activities.filter((a) => a.signal === "accumulation").length;
  const distributionCount = activities.filter((a) => a.signal === "distribution").length;
  const totalVolume = activities.reduce((s, a) => s + a.volume24h, 0);
  const avgWhaleScore = activities.length > 0 ? Math.round(activities.reduce((s, a) => s + a.whaleScore, 0) / activities.length) : 0;

  const signalStyle = (s: WhaleActivity["signal"]) => {
    if (s === "accumulation") return { label: `🟢 ${t("pages.whaleWatcherExtra.accumulation")}`, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (s === "distribution") return { label: `🔴 ${t("pages.whaleWatcherExtra.distribution")}`, color: "text-red-400 bg-red-500/10 border-red-500/20" };
    return { label: `⚪ ${t("pages.whaleWatcherExtra.neutral")}`, color: "text-gray-400 bg-white/[0.06] border-white/[0.08]" };
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen">
        {/* ===== HERO premium ===== */}
        <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]">
          <div className="absolute inset-0 bg-[#0A0E1A]" />
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-cyan-500/22 blur-3xl" style={{ animation: "ww-pulse 6s ease-in-out infinite" }} />
          <div className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full bg-blue-500/22 blur-3xl" style={{ animation: "ww-pulse 8s ease-in-out infinite reverse" }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }} />
          <div className="relative z-10 flex items-center justify-between gap-4 px-6 md:px-10 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center" style={{ boxShadow: "0 0 30px rgba(34,211,238,0.3)" }}>
                <Fish className="w-7 h-7 text-cyan-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    {t("pages.whaleWatcher.title")}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> {t("pages.whaleWatcherExtra.badge")}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-400">{t("pages.whaleWatcher.subtitle")}</p>
              </div>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-sm font-semibold transition-all disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{lastUpdate ? t("pages.whaleWatcherExtra.lastUpdate", { time: lastUpdate }) : t("pages.whaleWatcherExtra.refresh")}</span>
            </button>
          </div>
        </div>
        <style>{`
          @keyframes ww-pulse {
            0%, 100% { transform: scale(1) translate(0,0); opacity: 0.3; }
            50% { transform: scale(1.2) translate(20px,-10px); opacity: 0.45; }
          }
        `}</style>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">{t("pages.whaleWatcherExtra.analyzed")}</p>
            <p className="text-2xl font-extrabold">{activities.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">{t("pages.whaleWatcherExtra.totalVolume")}</p>
            <p className="text-2xl font-extrabold">{formatUsd(totalVolume)}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">{t("pages.whaleWatcherExtra.accumulation")}</p>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-emerald-400" />
              <p className="text-2xl font-extrabold text-emerald-400">{accumulationCount}</p>
            </div>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">{t("pages.whaleWatcherExtra.distribution")}</p>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-red-400" />
              <p className="text-2xl font-extrabold text-red-400">{distributionCount}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs font-semibold text-gray-400">{t("pages.whaleWatcherExtra.filters")}</span>
            <div className="flex gap-2">
              {([
                { key: "ALL", label: t("pages.whaleWatcherExtra.all") },
                { key: "accumulation", label: `🟢 ${t("pages.whaleWatcherExtra.accumulation")}` },
                { key: "distribution", label: `🔴 ${t("pages.whaleWatcherExtra.distribution")}` },
                { key: "neutral", label: `⚪ ${t("pages.whaleWatcherExtra.neutral")}` },
              ] as const).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    filter === f.key
                      ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                      : "bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-auto">{t("pages.whaleWatcherExtra.avgScore", { score: avgWhaleScore })}</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">{t("pages.whaleWatcherExtra.colCrypto")}</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">{t("pages.whaleWatcherExtra.colPrice")}</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">{t("pages.whaleWatcherExtra.col24h")}</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">{t("pages.whaleWatcherExtra.colVolume24")}</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">{t("pages.whaleWatcherExtra.colVolMcap")}</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-gray-500 uppercase">{t("pages.whaleWatcherExtra.colWhaleScore")}</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">{t("pages.whaleWatcherExtra.colSignal")}</th>
                </tr>
              </thead>
              <tbody>
                {loading && activities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-400">{t("pages.whaleWatcherExtra.loadingData")}</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-500">{t("pages.whaleWatcherExtra.noActivity")}</td>
                  </tr>
                ) : (
                  filtered.slice(0, 50).map((a, i) => {
                    const ss = signalStyle(a.signal);
                    return (
                      <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-500 font-semibold">{i + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {a.image && <img src={a.image} alt={a.symbol} className="w-7 h-7 rounded-full" loading="lazy" />}
                            <div>
                              <span className="text-sm font-bold text-white">{a.symbol}</span>
                              <span className="text-xs text-gray-500 ml-2">{a.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-bold text-white">
                          ${a.price >= 1 ? a.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : a.price.toFixed(6)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className={`flex items-center justify-end gap-1 text-sm font-bold ${a.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {a.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {a.change24h >= 0 ? "+" : ""}{a.change24h.toFixed(2)}%
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-bold text-gray-300">{formatUsd(a.volume24h)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`text-sm font-bold ${a.volMcapRatio > 0.2 ? "text-amber-400" : a.volMcapRatio > 0.1 ? "text-gray-200" : "text-gray-500"}`}>
                            {(a.volMcapRatio * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-12 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${a.whaleScore}%`,
                                  background: a.whaleScore > 60 ? "#22c55e" : a.whaleScore > 30 ? "#f59e0b" : "#6b7280",
                                }}
                              />
                            </div>
                            <span className={`text-sm font-black ${a.whaleScore > 60 ? "text-emerald-400" : a.whaleScore > 30 ? "text-amber-400" : "text-gray-500"}`}>
                              {a.whaleScore}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${ss.color}`}>
                            {ss.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
          <h3 className="text-sm font-bold mb-3">{t("pages.whaleWatcherExtra.methodology")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <span><b className="text-emerald-400">{t("pages.whaleWatcherExtra.accumulation")}</b> {t("pages.whaleWatcherExtra.accDesc")}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
              <span><b className="text-red-400">{t("pages.whaleWatcherExtra.distribution")}</b> {t("pages.whaleWatcherExtra.distDesc")}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
              <span><b className="text-gray-300">{t("pages.whaleWatcherExtra.neutral")}</b> {t("pages.whaleWatcherExtra.neutralDesc")}</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 mt-3">
            {t("pages.whaleWatcherExtra.footer")}
          </p>
        </div>
        <Footer />
      </main>
    </div>
  );
}