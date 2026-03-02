import { useEffect, useState, useCallback } from "react";
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

function analyzeWhaleActivity(coins: any[]): WhaleActivity[] {
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
        reason = `Hausse de ${change24h.toFixed(1)}% avec volume élevé (${(volMcapRatio * 100).toFixed(1)}% du MCap) — accumulation probable`;
      } else if (change24h < -3 && volMcapRatio > 0.15) {
        signal = "distribution";
        reason = `Baisse de ${change24h.toFixed(1)}% avec volume élevé (${(volMcapRatio * 100).toFixed(1)}% du MCap) — distribution probable`;
      } else if (volMcapRatio > 0.25 && Math.abs(change24h) < 2) {
        signal = "accumulation";
        reason = `Volume très élevé (${(volMcapRatio * 100).toFixed(1)}% du MCap) avec faible variation — accumulation silencieuse`;
      } else if (change24h < -5) {
        signal = "distribution";
        reason = `Forte baisse de ${change24h.toFixed(1)}% — pression vendeuse significative`;
      } else if (change24h > 5) {
        signal = "accumulation";
        reason = `Forte hausse de ${change24h.toFixed(1)}% — achat massif détecté`;
      } else {
        signal = "neutral";
        reason = `Activité normale — Vol/MCap: ${(volMcapRatio * 100).toFixed(1)}%, Variation: ${change24h > 0 ? "+" : ""}${change24h.toFixed(1)}%`;
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
        setActivities(analyzeWhaleActivity(data));
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (s === "accumulation") return { label: "🟢 Accumulation", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (s === "distribution") return { label: "🔴 Distribution", color: "text-red-400 bg-red-500/10 border-red-500/20" };
    return { label: "⚪ Neutre", color: "text-gray-400 bg-white/[0.06] border-white/[0.08]" };
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={WHALE_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Fish className="w-7 h-7 text-cyan-400" />
                <h1 className="text-2xl font-extrabold">AI Whale Watcher</h1>
              </div>
              <p className="text-sm text-gray-400">Détection d&apos;activité whale basée sur les volumes réels CoinGecko</p>
            </div>
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">Cryptos Analysées</p>
            <p className="text-2xl font-extrabold">{activities.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">Volume Total 24h</p>
            <p className="text-2xl font-extrabold">{formatUsd(totalVolume)}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">Accumulation</p>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-emerald-400" />
              <p className="text-2xl font-extrabold text-emerald-400">{accumulationCount}</p>
            </div>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">Distribution</p>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-red-400" />
              <p className="text-2xl font-extrabold text-red-400">{distributionCount}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs font-semibold text-gray-400">Filtres:</span>
            <div className="flex gap-2">
              {([
                { key: "ALL", label: "Tous" },
                { key: "accumulation", label: "🟢 Accumulation" },
                { key: "distribution", label: "🔴 Distribution" },
                { key: "neutral", label: "⚪ Neutre" },
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
            <span className="text-xs text-gray-500 ml-auto">Score whale moyen: {avgWhaleScore}/100</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Volume 24h</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Vol/MCap</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-gray-500 uppercase">Score Whale</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Signal</th>
                </tr>
              </thead>
              <tbody>
                {loading && activities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Chargement des données CoinGecko...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-500">Aucune activité trouvée</td>
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
          <h3 className="text-sm font-bold mb-3">📖 Méthodologie</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <span><b className="text-emerald-400">Accumulation</b> = Volume élevé + hausse de prix ou volume très élevé avec faible variation (achat silencieux)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
              <span><b className="text-red-400">Distribution</b> = Volume élevé + baisse de prix significative (vente massive)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
              <span><b className="text-gray-300">Neutre</b> = Activité normale, pas de signal whale détecté</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 mt-3">
            📊 Données en temps réel via CoinGecko API. Le score whale est calculé à partir du ratio Volume/Market Cap, de la variation 24h et du volume absolu. Aucune donnée simulée.
          </p>
        </div>
        <Footer />
      </main>
    </div>
  );
}