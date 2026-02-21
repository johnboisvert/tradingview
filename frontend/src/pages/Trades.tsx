import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { TrendingUp, TrendingDown, RefreshCw, Filter, BarChart3 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const TRADES_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

interface TradeSetup {
  id: string;
  symbol: string;
  name: string;
  image: string;
  side: "LONG" | "SHORT";
  currentPrice: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  rr: number;
  change24h: number;
  volume: number;
  marketCap: number;
  confidence: number;
  reason: string;
}

function formatUsd(v: number): string {
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function formatPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(2);
  if (p >= 0.01) return p.toFixed(4);
  return p.toFixed(6);
}

/**
 * Generate trade setups from REAL market data.
 * - LONG if change24h > 2% (momentum) or change24h < -8% (oversold bounce)
 * - SHORT if change24h < -3% (downtrend continuation)
 * - SL/TP based on actual price volatility (using change24h as proxy for ATR)
 * - Confidence based on volume/mcap ratio and trend alignment
 */
function generateRealSetups(coins: any[]): TradeSetup[] {
  const setups: TradeSetup[] = [];

  for (const c of coins) {
    if (!c || !c.current_price || !c.market_cap) continue;

    const price = c.current_price;
    const change24h = c.price_change_percentage_24h || 0;
    const volume = c.total_volume || 0;
    const mcap = c.market_cap || 1;
    const volMcapRatio = volume / mcap;

    // Estimate volatility from 24h change (proxy for ATR)
    const volatility = Math.max(Math.abs(change24h) * 0.5, 1.5); // minimum 1.5%
    const slPercent = volatility * 0.8; // SL at ~80% of daily volatility
    const tpPercent = slPercent * 2; // 1:2 R:R minimum

    let side: "LONG" | "SHORT";
    let confidence = 0;
    let reason: string;

    if (change24h > 2 && volMcapRatio > 0.08) {
      // Momentum LONG
      side = "LONG";
      confidence = 50;
      if (change24h > 5) confidence += 15; else confidence += 8;
      if (volMcapRatio > 0.2) confidence += 15; else if (volMcapRatio > 0.1) confidence += 10;
      if (change24h > 8) confidence += 10;
      reason = `Momentum haussier (+${change24h.toFixed(1)}%) avec volume élevé (${(volMcapRatio * 100).toFixed(1)}% du MCap)`;
    } else if (change24h < -8) {
      // Oversold bounce LONG
      side = "LONG";
      confidence = 45;
      if (change24h < -15) confidence += 15; else if (change24h < -10) confidence += 10;
      if (volMcapRatio > 0.15) confidence += 10;
      reason = `Survente potentielle (${change24h.toFixed(1)}%) — rebond technique possible`;
    } else if (change24h < -3 && volMcapRatio > 0.1) {
      // Downtrend SHORT
      side = "SHORT";
      confidence = 50;
      if (change24h < -5) confidence += 10; else confidence += 5;
      if (volMcapRatio > 0.2) confidence += 15; else confidence += 8;
      reason = `Tendance baissière (${change24h.toFixed(1)}%) avec volume de distribution (${(volMcapRatio * 100).toFixed(1)}% du MCap)`;
    } else {
      // Skip coins without clear setup
      continue;
    }

    confidence = Math.min(95, Math.max(30, confidence));

    const entry = price;
    const stopLoss = side === "LONG"
      ? price * (1 - slPercent / 100)
      : price * (1 + slPercent / 100);
    const takeProfit = side === "LONG"
      ? price * (1 + tpPercent / 100)
      : price * (1 - tpPercent / 100);
    const rr = Math.round((tpPercent / slPercent) * 10) / 10;

    setups.push({
      id: c.id,
      symbol: ((c.symbol || "") as string).toUpperCase() + "USDT",
      name: c.name || "Unknown",
      image: c.image || "",
      side,
      currentPrice: price,
      entry,
      stopLoss: Math.round(stopLoss * 100) / 100,
      takeProfit: Math.round(takeProfit * 100) / 100,
      rr,
      change24h,
      volume,
      marketCap: mcap,
      confidence,
      reason,
    });
  }

  return setups.sort((a, b) => b.confidence - a.confidence);
}

export default function Trades() {
  const [setups, setSetups] = useState<TradeSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [filterSide, setFilterSide] = useState<"all" | "LONG" | "SHORT">("all");
  const [searchSymbol, setSearchSymbol] = useState("");

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const allData = await fetchTop200(false);
      if (allData.length > 0) {
        setSetups(generateRealSetups(allData));
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    }
  }, []);

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 60000);
    return () => clearInterval(interval);
  }, [fetchTrades]);

  const filtered = setups.filter((t) => {
    if (filterSide !== "all" && t.side !== filterSide) return false;
    if (searchSymbol && !t.symbol.toLowerCase().includes(searchSymbol.toLowerCase())) return false;
    return true;
  });

  const longCount = setups.filter((t) => t.side === "LONG").length;
  const shortCount = setups.filter((t) => t.side === "SHORT").length;
  const avgConfidence = setups.length > 0
    ? Math.round(setups.reduce((s, t) => s + t.confidence, 0) / setups.length)
    : 0;
  const highConfCount = setups.filter((t) => t.confidence >= 70).length;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
      <PageHeader
          icon={<BarChart3 className="w-6 h-6" />}
          title="Suggestions de Trades"
          subtitle="Setups de trading générés automatiquement à partir des données de marché en temps réel. Basés sur le momentum, les volumes et la volatilité réelle."
          accentColor="blue"
          steps={[
            { n: "1", title: "Analysez les setups", desc: "Chaque setup est généré à partir des prix et volumes réels CoinGecko. Entry = prix actuel, SL/TP basés sur la volatilité 24h." },
            { n: "2", title: "Évaluez la confiance", desc: "Le score de confiance est calculé à partir du momentum, du ratio volume/market cap et de l'amplitude du mouvement." },
            { n: "3", title: "Gérez votre risque", desc: "Respectez toujours le stop loss et le ratio risque/récompense. Ne tradez que les setups avec une confiance élevée." },
          ]}
        />
        {/* Header */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={TRADES_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/80 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                📊 Suggestions de Trades
              </h1>
              <p className="text-sm text-gray-400 mt-1">Setups basés sur les données de marché réelles — pas des conseils financiers</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">MAJ: {lastUpdate}</span>
              <button onClick={fetchTrades}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Rafraîchir
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[
            { icon: "📈", label: "Total Setups", value: String(setups.length), change: "Détectés" },
            { icon: "🟢", label: "LONG", value: String(longCount), change: "Haussiers" },
            { icon: "🔴", label: "SHORT", value: String(shortCount), change: "Baissiers" },
            { icon: "🎯", label: "Confiance Moy.", value: `${avgConfidence}%`, change: "Score moyen" },
            { icon: "⭐", label: "Haute Confiance", value: String(highConfCount), change: "≥ 70%" },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-blue-500/30 hover:bg-white/[0.05] transition-all">
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-2 font-semibold">{stat.label}</p>
              <p className="text-xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mt-1">{stat.value}</p>
              <p className="text-[10px] text-gray-500 mt-1">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <select value={filterSide} onChange={(e) => setFilterSide(e.target.value as "all" | "LONG" | "SHORT")}
            className="px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white">
            <option value="all">Tous les types</option>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
          <input type="text" value={searchSymbol} onChange={(e) => setSearchSymbol(e.target.value)}
            placeholder="🔍 Rechercher symbole..."
            className="px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 flex-1 min-w-[180px]" />
          <span className="text-xs text-gray-500 ml-auto">({filtered.length} résultats)</span>
        </div>

        {/* Trades Table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">Setups Détectés</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Symbole", "Type", "Prix Actuel", "SL", "TP", "R:R", "24h", "Confiance", "Raison"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Chargement des données de marché...</p>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-500">Aucun setup détecté avec ces filtres</td></tr>
                ) : (
                  filtered.slice(0, 30).map((trade) => (
                    <tr key={trade.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {trade.image && <img src={trade.image} alt={trade.symbol} className="w-6 h-6 rounded-full" loading="lazy" />}
                          <span className="font-bold text-sm">{trade.symbol}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          trade.side === "LONG"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/15 text-red-400 border border-red-500/20"
                        }`}>
                          {trade.side === "LONG" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {trade.side}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">${formatPrice(trade.currentPrice)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-red-400">${formatPrice(trade.stopLoss)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-emerald-400">${formatPrice(trade.takeProfit)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400">
                          {trade.rr}:1
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${trade.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {trade.change24h >= 0 ? "+" : ""}{trade.change24h.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-12 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${trade.confidence}%`,
                              background: trade.confidence > 70 ? "#22c55e" : trade.confidence > 50 ? "#f59e0b" : "#6b7280",
                            }} />
                          </div>
                          <span className="text-xs font-bold text-gray-400">{trade.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400 max-w-[200px] block truncate" title={trade.reason}>{trade.reason}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-amber-500/[0.06] border border-amber-500/15 rounded-2xl p-4">
          <p className="text-xs text-amber-300/80 text-center">
            ⚠️ <strong>Avertissement :</strong> Ces suggestions sont générées automatiquement à partir des données de marché CoinGecko (prix, volumes, variations 24h).
            Elles ne constituent pas des conseils financiers. Le SL est basé sur la volatilité 24h, le TP sur un ratio R:R de 2:1.
            Faites toujours votre propre analyse avant de trader.
          </p>
        </div>
        <Footer />
      </main>
    </div>
  );
}