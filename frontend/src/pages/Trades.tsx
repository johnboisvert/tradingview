import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { TrendingUp, TrendingDown, RefreshCw, Plus, Trash2, Filter, BarChart3 } from "lucide-react";

const TRADES_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

interface Trade {
  id: string;
  symbol: string;
  side: "LONG" | "SHORT";
  entry: number;
  current: number;
  stopLoss: number;
  takeProfit: number;
  quantity: number;
  status: "OPEN" | "CLOSED";
  pnl: number;
  pnlPercent: number;
  confidence: number;
  openDate: string;
  closeDate?: string;
  rr: number;
}

interface CryptoPrice {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

function formatUsd(v: number): string {
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function generateDemoTrades(prices: CryptoPrice[]): Trade[] {
  const trades: Trade[] = [];
  const symbols = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "LINK", "DOT", "MATIC"];
  const now = Date.now();

  for (let i = 0; i < 15; i++) {
    const sym = symbols[i % symbols.length];
    const priceData = prices.find((p) => p.symbol === sym.toLowerCase());
    const currentPrice = priceData?.current_price || 100;
    const side: "LONG" | "SHORT" = Math.random() > 0.4 ? "LONG" : "SHORT";
    const isOpen = i < 5;
    const entryOffset = (Math.random() - 0.5) * currentPrice * 0.1;
    const entry = currentPrice + entryOffset;
    const slDistance = entry * (0.02 + Math.random() * 0.03);
    const tpDistance = slDistance * (1.5 + Math.random() * 2);
    const stopLoss = side === "LONG" ? entry - slDistance : entry + slDistance;
    const takeProfit = side === "LONG" ? entry + tpDistance : entry - tpDistance;
    const quantity = Math.round((500 + Math.random() * 2000) / entry * 100) / 100;
    const pnl = (currentPrice - entry) * quantity * (side === "LONG" ? 1 : -1);
    const pnlPercent = ((currentPrice - entry) / entry) * 100 * (side === "LONG" ? 1 : -1);
    const rr = Math.round((tpDistance / slDistance) * 10) / 10;
    const confidence = Math.round(55 + Math.random() * 40);
    const daysAgo = Math.floor(Math.random() * 14);
    const openDate = new Date(now - daysAgo * 86400000).toISOString().split("T")[0];

    trades.push({
      id: `trade-${i}`,
      symbol: sym + "USDT",
      side,
      entry: Math.round(entry * 100) / 100,
      current: currentPrice,
      stopLoss: Math.round(stopLoss * 100) / 100,
      takeProfit: Math.round(takeProfit * 100) / 100,
      quantity,
      status: isOpen ? "OPEN" : "CLOSED",
      pnl: Math.round(pnl * 100) / 100,
      pnlPercent: Math.round(pnlPercent * 100) / 100,
      confidence,
      openDate,
      closeDate: isOpen ? undefined : new Date(now - (daysAgo - 2) * 86400000).toISOString().split("T")[0],
      rr,
    });
  }

  return trades;
}

export default function Trades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "OPEN" | "CLOSED">("all");
  const [filterSide, setFilterSide] = useState<"all" | "LONG" | "SHORT">("all");
  const [searchSymbol, setSearchSymbol] = useState("");

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const allData = await fetchTop200(false);
      if (allData.length > 0) {
        const prices: CryptoPrice[] = allData.slice(0, 20) as any;
        setTrades(generateDemoTrades(prices));
      } else {
        setTrades(generateDemoTrades([]));
      }
    } catch (e) {
      console.error("Fetch error:", e);
      setTrades(generateDemoTrades([]));
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

  const filtered = trades.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterSide !== "all" && t.side !== filterSide) return false;
    if (searchSymbol && !t.symbol.toLowerCase().includes(searchSymbol.toLowerCase())) return false;
    return true;
  });

  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const openCount = trades.filter((t) => t.status === "OPEN").length;
  const winRate = trades.length > 0
    ? Math.round((trades.filter((t) => t.pnl > 0).length / trades.length) * 100)
    : 0;
  const avgConfidence = trades.length > 0
    ? Math.round(trades.reduce((s, t) => s + t.confidence, 0) / trades.length)
    : 0;
  const tpHits = trades.filter((t) => t.status === "CLOSED" && t.pnl > 0).length;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Header */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={TRADES_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/80 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                📊 Gestion des Trades Premium
              </h1>
              <p className="text-sm text-gray-400 mt-1">Plateforme avancée de suivi et d'analyse de trading</p>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[
            { icon: "📈", label: "Total Trades", value: String(trades.length), change: `+${openCount} ouverts` },
            { icon: "🎯", label: "Trades Ouverts", value: String(openCount), change: "Actifs maintenant" },
            { icon: "✅", label: "Win Rate", value: `${winRate}%`, change: winRate > 50 ? "Positif" : "À améliorer" },
            { icon: "💰", label: "P&L Total", value: formatUsd(totalPnl), change: totalPnl >= 0 ? "En profit" : "En perte" },
            { icon: "🎲", label: "Confiance Moy.", value: `${avgConfidence}%`, change: "Score IA moyen" },
            { icon: "🎯", label: "TP Atteints", value: String(tpHits), change: "Targets touchés" },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-blue-500/30 hover:bg-white/[0.05] transition-all group cursor-pointer">
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
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "all" | "OPEN" | "CLOSED")}
            className="px-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white">
            <option value="all">Tous les statuts</option>
            <option value="OPEN">Ouverts</option>
            <option value="CLOSED">Fermés</option>
          </select>
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
            <h2 className="text-lg font-bold">Tous les Trades</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Symbole", "Type", "Entrée", "Actuel", "SL", "TP", "R:R", "P&L", "Confiance", "Statut", "Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Chargement...</p>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-12 text-gray-500">Aucun trade trouvé</td></tr>
                ) : (
                  filtered.map((trade) => (
                    <tr key={trade.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-bold text-sm">{trade.symbol}</span>
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
                      <td className="px-4 py-3 font-mono text-sm">${trade.entry.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-sm">${trade.current.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-xs text-red-400">${trade.stopLoss.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono text-xs text-emerald-400">${trade.takeProfit.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400">
                          {trade.rr}:1
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {trade.pnl >= 0 ? "+" : ""}{formatUsd(trade.pnl)}
                        </span>
                        <span className={`block text-[10px] ${trade.pnlPercent >= 0 ? "text-emerald-500/70" : "text-red-500/70"}`}>
                          {trade.pnlPercent >= 0 ? "+" : ""}{trade.pnlPercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-12 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${trade.confidence}%`,
                              background: `linear-gradient(90deg, #ef4444, #f59e0b, #10b981)`,
                            }} />
                          </div>
                          <span className="text-xs font-bold text-gray-400">{trade.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          trade.status === "OPEN"
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                            : "bg-gray-500/15 text-gray-400 border border-gray-500/20"
                        }`}>
                          {trade.status === "OPEN" ? "🟢 OUVERT" : "⚪ FERMÉ"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400">{trade.openDate}</span>
                        {trade.closeDate && <span className="block text-[10px] text-gray-600">{trade.closeDate}</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* How to use */}
        <div className="mt-8 bg-gradient-to-r from-blue-500/[0.06] to-purple-500/[0.06] border border-blue-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-blue-400 mb-4">💡 Comment utiliser cette page ?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: "1", title: "Suivez vos trades", desc: "Visualisez tous vos trades ouverts et fermés avec les prix d'entrée, stop loss et take profit en temps réel." },
              { n: "2", title: "Analysez la performance", desc: "Win rate, P&L total, confiance IA moyenne — tous les KPIs pour évaluer votre stratégie de trading." },
              { n: "3", title: "Filtrez et recherchez", desc: "Utilisez les filtres par statut (ouvert/fermé), type (LONG/SHORT) et recherche par symbole." },
            ].map((step) => (
              <div key={step.n} className="flex gap-3 items-start bg-black/20 rounded-xl p-4 border border-white/[0.04]">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">{step.n}</span>
                <div>
                  <h3 className="font-bold text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}