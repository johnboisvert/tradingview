import { useEffect, useState, useCallback, Fragment } from "react";
import Sidebar from "@/components/Sidebar";
import { TrendingUp, TrendingDown, RefreshCw, Filter, BarChart3, Clock, Shield, Target, ChevronDown, ChevronUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const TRADES_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

interface SRLevel {
  price: number;
  type: "support" | "resistance";
  strength: "major" | "minor";
  source: string;
}

interface TradeSetup {
  id: string;
  symbol: string;
  name: string;
  image: string;
  side: "LONG" | "SHORT";
  currentPrice: number;
  entry: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  rr: number;
  change24h: number;
  volume: number;
  marketCap: number;
  confidence: number;
  reason: string;
  triggerTime: string;
  supports: SRLevel[];
  resistances: SRLevel[];
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
 * Calculate Support & Resistance levels from sparkline data and 24h high/low.
 */
function calculateSRLevels(coin: any): { supports: SRLevel[]; resistances: SRLevel[] } {
  const price = coin.current_price;
  const supports: SRLevel[] = [];
  const resistances: SRLevel[] = [];

  // 1. Use high_24h and low_24h as immediate S/R
  if (coin.low_24h && coin.low_24h < price) {
    supports.push({ price: coin.low_24h, type: "support", strength: "major", source: "Low 24h" });
  }
  if (coin.high_24h && coin.high_24h > price) {
    resistances.push({ price: coin.high_24h, type: "resistance", strength: "major", source: "High 24h" });
  }

  // 2. ATH as major resistance
  if (coin.ath && coin.ath > price * 1.02) {
    resistances.push({ price: coin.ath, type: "resistance", strength: "major", source: "ATH" });
  }

  // 3. Extract local min/max from sparkline (7-day hourly data)
  const sparkline = coin.sparkline_in_7d?.price;
  if (sparkline && sparkline.length > 10) {
    const localMins: number[] = [];
    const localMaxs: number[] = [];
    const windowSize = 6; // ~6 hours window for local extremes

    for (let i = windowSize; i < sparkline.length - windowSize; i++) {
      let isMin = true;
      let isMax = true;
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j === i) continue;
        if (sparkline[j] <= sparkline[i]) isMin = false;
        if (sparkline[j] >= sparkline[i]) isMax = false;
      }
      if (isMin) localMins.push(sparkline[i]);
      if (isMax) localMaxs.push(sparkline[i]);
    }

    // Cluster nearby levels (within 1.5% of each other)
    const clusterLevels = (levels: number[]): number[] => {
      if (levels.length === 0) return [];
      const sorted = [...levels].sort((a, b) => a - b);
      const clusters: number[][] = [[sorted[0]]];
      for (let i = 1; i < sorted.length; i++) {
        const lastCluster = clusters[clusters.length - 1];
        const clusterAvg = lastCluster.reduce((s, v) => s + v, 0) / lastCluster.length;
        if (Math.abs(sorted[i] - clusterAvg) / clusterAvg < 0.015) {
          lastCluster.push(sorted[i]);
        } else {
          clusters.push([sorted[i]]);
        }
      }
      return clusters.map(c => c.reduce((s, v) => s + v, 0) / c.length);
    };

    const clusteredMins = clusterLevels(localMins);
    const clusteredMaxs = clusterLevels(localMaxs);

    // Add sparkline supports (below current price)
    for (const level of clusteredMins) {
      if (level < price * 0.99) {
        supports.push({
          price: level,
          type: "support",
          strength: Math.abs(level - price) / price < 0.03 ? "major" : "minor",
          source: "Sparkline 7j",
        });
      }
    }

    // Add sparkline resistances (above current price)
    for (const level of clusteredMaxs) {
      if (level > price * 1.01) {
        resistances.push({
          price: level,
          type: "resistance",
          strength: Math.abs(level - price) / price < 0.03 ? "major" : "minor",
          source: "Sparkline 7j",
        });
      }
    }
  }

  // Sort: supports descending (nearest first), resistances ascending (nearest first)
  supports.sort((a, b) => b.price - a.price);
  resistances.sort((a, b) => a.price - b.price);

  // Deduplicate very close levels (within 0.5%)
  const dedup = (levels: SRLevel[]): SRLevel[] => {
    const result: SRLevel[] = [];
    for (const level of levels) {
      const exists = result.some(r => Math.abs(r.price - level.price) / level.price < 0.005);
      if (!exists) result.push(level);
    }
    return result;
  };

  return {
    supports: dedup(supports).slice(0, 5),
    resistances: dedup(resistances).slice(0, 5),
  };
}

/**
 * Align TP levels with S/R for higher probability.
 * For LONG: TPs align with resistance levels.
 * For SHORT: TPs align with support levels.
 */
function alignTPWithSR(
  side: "LONG" | "SHORT",
  entry: number,
  slPercent: number,
  supports: SRLevel[],
  resistances: SRLevel[],
): { tp1: number; tp2: number; tp3: number; sl: number } {
  const slDistance = entry * (slPercent / 100);

  // Default TPs based on R:R ratios
  let tp1: number, tp2: number, tp3: number, sl: number;

  if (side === "LONG") {
    sl = entry - slDistance;
    tp1 = entry + slDistance * 1.5; // 1.5:1 R:R
    tp2 = entry + slDistance * 2.5; // 2.5:1 R:R
    tp3 = entry + slDistance * 4;   // 4:1 R:R

    // Align SL with nearest support below entry
    const nearestSupport = supports.find(s => s.price < entry * 0.995);
    if (nearestSupport && nearestSupport.price > sl * 0.97 && nearestSupport.price < entry * 0.99) {
      sl = nearestSupport.price * 0.998; // Just below support
    }

    // Align TPs with resistance levels
    const resAbove = resistances.filter(r => r.price > entry * 1.005);
    if (resAbove.length >= 1 && resAbove[0].price > tp1 * 0.95 && resAbove[0].price < tp1 * 1.15) {
      tp1 = resAbove[0].price * 0.998; // Just below resistance
    }
    if (resAbove.length >= 2 && resAbove[1].price > tp2 * 0.85 && resAbove[1].price < tp2 * 1.2) {
      tp2 = resAbove[1].price * 0.998;
    }
    if (resAbove.length >= 3 && resAbove[2].price > tp3 * 0.8) {
      tp3 = resAbove[2].price * 0.998;
    }
  } else {
    sl = entry + slDistance;
    tp1 = entry - slDistance * 1.5;
    tp2 = entry - slDistance * 2.5;
    tp3 = entry - slDistance * 4;

    // Align SL with nearest resistance above entry
    const nearestResistance = resistances.find(r => r.price > entry * 1.005);
    if (nearestResistance && nearestResistance.price < sl * 1.03 && nearestResistance.price > entry * 1.01) {
      sl = nearestResistance.price * 1.002; // Just above resistance
    }

    // Align TPs with support levels
    const supBelow = supports.filter(s => s.price < entry * 0.995);
    if (supBelow.length >= 1 && supBelow[0].price < tp1 * 1.05 && supBelow[0].price > tp1 * 0.85) {
      tp1 = supBelow[0].price * 1.002; // Just above support
    }
    if (supBelow.length >= 2 && supBelow[1].price < tp2 * 1.15 && supBelow[1].price > tp2 * 0.8) {
      tp2 = supBelow[1].price * 1.002;
    }
    if (supBelow.length >= 3 && supBelow[2].price < tp3 * 1.2) {
      tp3 = supBelow[2].price * 1.002;
    }
  }

  // Ensure TPs are in correct order
  if (side === "LONG") {
    tp2 = Math.max(tp2, tp1 * 1.01);
    tp3 = Math.max(tp3, tp2 * 1.01);
  } else {
    tp2 = Math.min(tp2, tp1 * 0.99);
    tp3 = Math.min(tp3, tp2 * 0.99);
  }

  return { tp1, tp2, tp3, sl };
}

/**
 * Generate trade setups from REAL market data with S/R integration.
 */
function generateRealSetups(coins: any[]): TradeSetup[] {
  const setups: TradeSetup[] = [];
  const triggerTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  for (const c of coins) {
    if (!c || !c.current_price || !c.market_cap) continue;

    const price = c.current_price;
    const change24h = c.price_change_percentage_24h || 0;
    const volume = c.total_volume || 0;
    const mcap = c.market_cap || 1;
    const volMcapRatio = volume / mcap;

    // Calculate S/R levels
    const { supports, resistances } = calculateSRLevels(c);

    // Estimate volatility from 24h change (proxy for ATR)
    const volatility = Math.max(Math.abs(change24h) * 0.5, 1.5);
    const slPercent = volatility * 0.8;

    let side: "LONG" | "SHORT";
    let confidence = 0;
    let reason: string;

    if (change24h > 2 && volMcapRatio > 0.08) {
      side = "LONG";
      confidence = 50;
      if (change24h > 5) confidence += 15; else confidence += 8;
      if (volMcapRatio > 0.2) confidence += 15; else if (volMcapRatio > 0.1) confidence += 10;
      if (change24h > 8) confidence += 10;
      reason = `Momentum haussier (+${change24h.toFixed(1)}%) avec volume élevé (${(volMcapRatio * 100).toFixed(1)}% du MCap)`;
    } else if (change24h < -8) {
      side = "LONG";
      confidence = 45;
      if (change24h < -15) confidence += 15; else if (change24h < -10) confidence += 10;
      if (volMcapRatio > 0.15) confidence += 10;
      reason = `Survente potentielle (${change24h.toFixed(1)}%) — rebond technique possible`;
    } else if (change24h < -3 && volMcapRatio > 0.1) {
      side = "SHORT";
      confidence = 50;
      if (change24h < -5) confidence += 10; else confidence += 5;
      if (volMcapRatio > 0.2) confidence += 15; else confidence += 8;
      reason = `Tendance baissière (${change24h.toFixed(1)}%) avec volume de distribution (${(volMcapRatio * 100).toFixed(1)}% du MCap)`;
    } else {
      continue;
    }

    // Align TP/SL with S/R levels
    const { tp1, tp2, tp3, sl } = alignTPWithSR(side, price, slPercent, supports, resistances);

    // Enhanced confidence: factor in S/R proximity
    const nearestSupport = supports[0];
    const nearestResistance = resistances[0];

    if (side === "LONG") {
      // Higher confidence if entry is near support
      if (nearestSupport && Math.abs(price - nearestSupport.price) / price < 0.02) {
        confidence += 10;
        reason += ` | Proche du support ${formatPrice(nearestSupport.price)}`;
      }
      // Higher confidence if TP1 aligns with resistance
      if (nearestResistance && Math.abs(tp1 - nearestResistance.price) / tp1 < 0.02) {
        confidence += 5;
      }
    } else {
      // Higher confidence if entry is near resistance
      if (nearestResistance && Math.abs(price - nearestResistance.price) / price < 0.02) {
        confidence += 10;
        reason += ` | Proche de la résistance ${formatPrice(nearestResistance.price)}`;
      }
      if (nearestSupport && Math.abs(tp1 - nearestSupport.price) / tp1 < 0.02) {
        confidence += 5;
      }
    }

    // Lower confidence if SL is too tight (< 0.5% from entry)
    if (Math.abs(sl - price) / price < 0.005) {
      confidence -= 10;
    }

    // S/R count bonus
    if (supports.length >= 2) confidence += 3;
    if (resistances.length >= 2) confidence += 3;

    confidence = Math.min(95, Math.max(25, confidence));

    const riskDistance = Math.abs(price - sl);
    const rewardDistance = Math.abs(tp2 - price);
    const rr = riskDistance > 0 ? Math.round((rewardDistance / riskDistance) * 10) / 10 : 2;

    setups.push({
      id: c.id,
      symbol: ((c.symbol || "") as string).toUpperCase() + "USDT",
      name: c.name || "Unknown",
      image: c.image || "",
      side,
      currentPrice: price,
      entry: price,
      stopLoss: roundPrice(sl, price),
      tp1: roundPrice(tp1, price),
      tp2: roundPrice(tp2, price),
      tp3: roundPrice(tp3, price),
      rr,
      change24h,
      volume,
      marketCap: mcap,
      confidence,
      reason,
      triggerTime,
      supports: supports.slice(0, 3),
      resistances: resistances.slice(0, 3),
    });
  }

  return setups.sort((a, b) => b.confidence - a.confidence);
}

function roundPrice(value: number, reference: number): number {
  if (reference >= 1000) return Math.round(value * 100) / 100;
  if (reference >= 1) return Math.round(value * 100) / 100;
  if (reference >= 0.01) return Math.round(value * 10000) / 10000;
  return Math.round(value * 1000000) / 1000000;
}

export default function Trades() {
  const [setups, setSetups] = useState<TradeSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [filterSide, setFilterSide] = useState<"all" | "LONG" | "SHORT">("all");
  const [searchSymbol, setSearchSymbol] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const allData = await fetchTop200(true); // with sparkline for S/R calculation
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
    const interval = setInterval(fetchTrades, 90000); // 90s with sparkline
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
          subtitle="Setups de trading générés automatiquement avec supports/résistances, 3 niveaux de TP et gestion du risque avancée."
          accentColor="blue"
          steps={[
            { n: "1", title: "Analyse S/R", desc: "Les supports et résistances sont calculés à partir des données sparkline 7j, high/low 24h et ATH." },
            { n: "2", title: "TP1 / TP2 / TP3", desc: "3 niveaux de Take Profit alignés avec les résistances (LONG) ou supports (SHORT) pour maximiser la probabilité." },
            { n: "3", title: "Confiance améliorée", desc: "Le score intègre la proximité aux S/R, le momentum, le volume et la qualité du setup." },
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
              <p className="text-sm text-gray-400 mt-1">Setups avec S/R, TP1/TP2/TP3 et gestion du risque — pas des conseils financiers</p>
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
            <span className="text-xs text-gray-500 ml-2">Cliquez sur une ligne pour voir les S/R</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Heure", "Symbole", "Type", "Entry", "SL", "TP1", "TP2", "TP3", "R:R", "24h", "Confiance", ""].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={12} className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Chargement des données de marché avec sparkline...</p>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={12} className="text-center py-12 text-gray-500">Aucun setup détecté avec ces filtres</td></tr>
                ) : (
                  filtered.slice(0, 30).map((trade) => {
                    const isExpanded = expandedRow === trade.id;
                    return (
                      <Fragment key={trade.id}>
                        <tr
                          className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
                          onClick={() => setExpandedRow(isExpanded ? null : trade.id)}
                        >
                          {/* Trigger Time */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span className="text-[11px] font-mono text-gray-400">{trade.triggerTime}</span>
                            </div>
                          </td>
                          {/* Symbol */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {trade.image && <img src={trade.image} alt={trade.symbol} className="w-6 h-6 rounded-full" loading="lazy" />}
                              <div>
                                <span className="font-bold text-sm block">{trade.symbol}</span>
                                <span className="text-[10px] text-gray-500">{trade.name}</span>
                              </div>
                            </div>
                          </td>
                          {/* Side */}
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              trade.side === "LONG"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/15 text-red-400 border border-red-500/20"
                            }`}>
                              {trade.side === "LONG" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {trade.side}
                            </span>
                          </td>
                          {/* Entry */}
                          <td className="px-3 py-3">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1 inline-block">
                              <span className="font-mono text-sm font-bold text-blue-300">${formatPrice(trade.entry)}</span>
                            </div>
                          </td>
                          {/* SL */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-red-400" />
                              <span className="font-mono text-xs text-red-400 font-semibold">${formatPrice(trade.stopLoss)}</span>
                            </div>
                            <span className="text-[9px] text-red-400/60">
                              {trade.side === "LONG" ? "-" : "+"}{Math.abs((trade.stopLoss - trade.entry) / trade.entry * 100).toFixed(1)}%
                            </span>
                          </td>
                          {/* TP1 */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-emerald-300" />
                              <span className="font-mono text-xs text-emerald-300 font-semibold">${formatPrice(trade.tp1)}</span>
                            </div>
                            <span className="text-[9px] text-emerald-300/60">
                              {trade.side === "LONG" ? "+" : "-"}{Math.abs((trade.tp1 - trade.entry) / trade.entry * 100).toFixed(1)}%
                            </span>
                          </td>
                          {/* TP2 */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-emerald-400" />
                              <span className="font-mono text-xs text-emerald-400 font-semibold">${formatPrice(trade.tp2)}</span>
                            </div>
                            <span className="text-[9px] text-emerald-400/60">
                              {trade.side === "LONG" ? "+" : "-"}{Math.abs((trade.tp2 - trade.entry) / trade.entry * 100).toFixed(1)}%
                            </span>
                          </td>
                          {/* TP3 */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-emerald-500" />
                              <span className="font-mono text-xs text-emerald-500 font-semibold">${formatPrice(trade.tp3)}</span>
                            </div>
                            <span className="text-[9px] text-emerald-500/60">
                              {trade.side === "LONG" ? "+" : "-"}{Math.abs((trade.tp3 - trade.entry) / trade.entry * 100).toFixed(1)}%
                            </span>
                          </td>
                          {/* R:R */}
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400">
                              {trade.rr}:1
                            </span>
                          </td>
                          {/* 24h */}
                          <td className="px-3 py-3">
                            <span className={`text-sm font-bold ${trade.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {trade.change24h >= 0 ? "+" : ""}{trade.change24h.toFixed(2)}%
                            </span>
                          </td>
                          {/* Confidence */}
                          <td className="px-3 py-3">
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
                          {/* Expand */}
                          <td className="px-3 py-3">
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                          </td>
                        </tr>

                        {/* Expanded Row: S/R details + reason */}
                        {isExpanded && (
                          <tr className="border-b border-white/[0.03]">
                            <td colSpan={12} className="px-4 py-4 bg-white/[0.01]">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Reason */}
                                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">📋 Raison du Signal</p>
                                  <p className="text-xs text-gray-300 leading-relaxed">{trade.reason}</p>
                                </div>

                                {/* Supports */}
                                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                                  <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-2">🟢 Supports</p>
                                  {trade.supports.length > 0 ? (
                                    <div className="space-y-1.5">
                                      {trade.supports.map((s, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                          <span className="text-xs text-gray-400">{s.source}</span>
                                          <div className="flex items-center gap-2">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${s.strength === "major" ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-500/15 text-gray-400"}`}>
                                              {s.strength === "major" ? "Fort" : "Mineur"}
                                            </span>
                                            <span className="font-mono text-xs text-emerald-300 font-semibold">${formatPrice(s.price)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500">Aucun support détecté</p>
                                  )}
                                </div>

                                {/* Resistances */}
                                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                                  <p className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-2">🔴 Résistances</p>
                                  {trade.resistances.length > 0 ? (
                                    <div className="space-y-1.5">
                                      {trade.resistances.map((r, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                          <span className="text-xs text-gray-400">{r.source}</span>
                                          <div className="flex items-center gap-2">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${r.strength === "major" ? "bg-red-500/15 text-red-400" : "bg-gray-500/15 text-gray-400"}`}>
                                              {r.strength === "major" ? "Fort" : "Mineur"}
                                            </span>
                                            <span className="font-mono text-xs text-red-300 font-semibold">${formatPrice(r.price)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500">Aucune résistance détectée</p>
                                  )}
                                </div>
                              </div>

                              {/* Visual S/R Bar */}
                              <div className="mt-3 bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">📊 Niveaux Clés</p>
                                <div className="flex items-center gap-2 flex-wrap text-[10px]">
                                  <span className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono">
                                    SL: ${formatPrice(trade.stopLoss)}
                                  </span>
                                  <span className="text-gray-600">→</span>
                                  <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono font-bold">
                                    Entry: ${formatPrice(trade.entry)}
                                  </span>
                                  <span className="text-gray-600">→</span>
                                  <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 font-mono">
                                    TP1: ${formatPrice(trade.tp1)}
                                  </span>
                                  <span className="text-gray-600">→</span>
                                  <span className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-400/25 text-emerald-400 font-mono">
                                    TP2: ${formatPrice(trade.tp2)}
                                  </span>
                                  <span className="text-gray-600">→</span>
                                  <span className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 font-mono font-bold">
                                    TP3: ${formatPrice(trade.tp3)}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-amber-500/[0.06] border border-amber-500/15 rounded-2xl p-4">
          <p className="text-xs text-amber-300/80 text-center">
            ⚠️ <strong>Avertissement :</strong> Ces suggestions sont générées automatiquement à partir des données de marché CoinGecko (prix, volumes, sparkline 7j, high/low 24h, ATH).
            Les S/R sont calculés algorithmiquement et les TP sont alignés avec ces niveaux pour maximiser la probabilité.
            Elles ne constituent pas des conseils financiers. Faites toujours votre propre analyse avant de trader.
          </p>
        </div>
        <Footer />
      </main>
    </div>
  );
}