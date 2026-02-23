import { useEffect, useState, useCallback, Fragment } from "react";
import Sidebar from "@/components/Sidebar";
import { TrendingUp, TrendingDown, RefreshCw, Filter, BarChart3, Clock, Shield, Target, ChevronDown, ChevronUp, Link2, Zap, Eye, EyeOff } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const TRADES_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

/* ─── Types ─── */

interface SRLevel {
  price: number;
  type: "support" | "resistance";
  strength: "major" | "minor";
  source: string;
  convergent?: boolean; // true when 4h S/R is within 1.5% of a 7j S/R
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
  tp0: number | null; // Quick Profit — nearest 4h S/R
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
  rsi4h: number | null; // RSI 14 on 4h candles
  hasConvergence: boolean; // at least one convergent S/R
}

/* ─── Formatters ─── */

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

function roundPrice(value: number, reference: number): number {
  if (reference >= 1000) return Math.round(value * 100) / 100;
  if (reference >= 1) return Math.round(value * 100) / 100;
  if (reference >= 0.01) return Math.round(value * 10000) / 10000;
  return Math.round(value * 1000000) / 1000000;
}

/* ─── Binance 4h Klines ─── */

interface BinanceKline {
  open: number;
  high: number;
  low: number;
  close: number;
}

const BINANCE_SYMBOL_MAP: Record<string, string> = {
  // Some CoinGecko symbols differ from Binance tickers
  IOTA: "IOTA",
};

async function fetchBinance4hKlines(symbolUpper: string): Promise<BinanceKline[]> {
  // Strip "USDT" suffix if present to get the base symbol
  const base = symbolUpper.replace(/USDT$/, "");
  const mapped = BINANCE_SYMBOL_MAP[base] || base;
  const pair = `${mapped}USDT`;

  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=4h&limit=50`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((k: any[]) => ({
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
    }));
  } catch {
    return [];
  }
}

/* ─── RSI 14 Calculation ─── */

function calculateRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;

  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum += Math.abs(diff);
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  // Smooth with Wilder's method for remaining data
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 10) / 10;
}

/* ─── 4h S/R from Binance pivots ─── */

function calculate4hSRLevels(klines: BinanceKline[], currentPrice: number): { supports: SRLevel[]; resistances: SRLevel[] } {
  const supports: SRLevel[] = [];
  const resistances: SRLevel[] = [];
  if (klines.length < 5) return { supports, resistances };

  const windowSize = 3;
  const localMins: number[] = [];
  const localMaxs: number[] = [];

  for (let i = windowSize; i < klines.length - windowSize; i++) {
    let isMin = true;
    let isMax = true;
    const low_i = klines[i].low;
    const high_i = klines[i].high;

    for (let j = i - windowSize; j <= i + windowSize; j++) {
      if (j === i) continue;
      if (klines[j].low <= low_i) isMin = false;
      if (klines[j].high >= high_i) isMax = false;
    }
    if (isMin) localMins.push(low_i);
    if (isMax) localMaxs.push(high_i);
  }

  // Cluster nearby levels (within 1%)
  const clusterLevels = (levels: number[]): number[] => {
    if (levels.length === 0) return [];
    const sorted = [...levels].sort((a, b) => a - b);
    const clusters: number[][] = [[sorted[0]]];
    for (let i = 1; i < sorted.length; i++) {
      const lastCluster = clusters[clusters.length - 1];
      const clusterAvg = lastCluster.reduce((s, v) => s + v, 0) / lastCluster.length;
      if (Math.abs(sorted[i] - clusterAvg) / clusterAvg < 0.01) {
        lastCluster.push(sorted[i]);
      } else {
        clusters.push([sorted[i]]);
      }
    }
    return clusters.map(c => c.reduce((s, v) => s + v, 0) / c.length);
  };

  const clusteredMins = clusterLevels(localMins);
  const clusteredMaxs = clusterLevels(localMaxs);

  for (const level of clusteredMins) {
    if (level < currentPrice * 0.998) {
      supports.push({
        price: level,
        type: "support",
        strength: Math.abs(level - currentPrice) / currentPrice < 0.025 ? "major" : "minor",
        source: "Binance 4h",
      });
    }
  }

  for (const level of clusteredMaxs) {
    if (level > currentPrice * 1.002) {
      resistances.push({
        price: level,
        type: "resistance",
        strength: Math.abs(level - currentPrice) / currentPrice < 0.025 ? "major" : "minor",
        source: "Binance 4h",
      });
    }
  }

  supports.sort((a, b) => b.price - a.price);
  resistances.sort((a, b) => a.price - b.price);

  return { supports: supports.slice(0, 4), resistances: resistances.slice(0, 4) };
}

/* ─── 7j S/R from CoinGecko sparkline (existing logic) ─── */

function calculate7jSRLevels(coin: any): { supports: SRLevel[]; resistances: SRLevel[] } {
  const price = coin.current_price;
  const supports: SRLevel[] = [];
  const resistances: SRLevel[] = [];

  if (coin.low_24h && coin.low_24h < price) {
    supports.push({ price: coin.low_24h, type: "support", strength: "major", source: "Low 24h" });
  }
  if (coin.high_24h && coin.high_24h > price) {
    resistances.push({ price: coin.high_24h, type: "resistance", strength: "major", source: "High 24h" });
  }
  if (coin.ath && coin.ath > price * 1.02) {
    resistances.push({ price: coin.ath, type: "resistance", strength: "major", source: "ATH" });
  }

  const sparkline = coin.sparkline_in_7d?.price;
  if (sparkline && sparkline.length > 10) {
    const localMins: number[] = [];
    const localMaxs: number[] = [];
    const windowSize = 6;

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

  supports.sort((a, b) => b.price - a.price);
  resistances.sort((a, b) => a.price - b.price);

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

/* ─── Mark convergent S/R levels ─── */

function markConvergence(
  levels7j: SRLevel[],
  levels4h: SRLevel[],
): { merged: SRLevel[]; convergenceCount: number } {
  let convergenceCount = 0;
  const merged: SRLevel[] = [...levels7j];

  for (const l4h of levels4h) {
    const match7j = levels7j.find(
      l7j => Math.abs(l7j.price - l4h.price) / l4h.price < 0.015
    );
    if (match7j) {
      // Mark the 7j level as convergent
      match7j.convergent = true;
      match7j.strength = "major"; // upgrade strength
      convergenceCount++;
      // Also mark the 4h level
      l4h.convergent = true;
    }
    // Add 4h level if not too close to existing
    const tooClose = merged.some(m => Math.abs(m.price - l4h.price) / l4h.price < 0.005);
    if (!tooClose) {
      merged.push(l4h);
    }
  }

  merged.sort((a, b) => {
    if (a.type === "support" && b.type === "support") return b.price - a.price;
    return a.price - b.price;
  });

  return { merged, convergenceCount };
}

/* ─── Align TP levels with S/R ─── */

function alignTPWithSR(
  side: "LONG" | "SHORT",
  entry: number,
  slPercent: number,
  supports: SRLevel[],
  resistances: SRLevel[],
): { tp1: number; tp2: number; tp3: number; sl: number } {
  const slDistance = entry * (slPercent / 100);
  let tp1: number, tp2: number, tp3: number, sl: number;

  if (side === "LONG") {
    sl = entry - slDistance;
    tp1 = entry + slDistance * 1.5;
    tp2 = entry + slDistance * 2.5;
    tp3 = entry + slDistance * 4;

    const nearestSupport = supports.find(s => s.price < entry * 0.995);
    if (nearestSupport && nearestSupport.price > sl * 0.97 && nearestSupport.price < entry * 0.99) {
      sl = nearestSupport.price * 0.998;
    }

    const resAbove = resistances.filter(r => r.price > entry * 1.005);
    if (resAbove.length >= 1 && resAbove[0].price > tp1 * 0.95 && resAbove[0].price < tp1 * 1.15) {
      tp1 = resAbove[0].price * 0.998;
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

    const nearestResistance = resistances.find(r => r.price > entry * 1.005);
    if (nearestResistance && nearestResistance.price < sl * 1.03 && nearestResistance.price > entry * 1.01) {
      sl = nearestResistance.price * 1.002;
    }

    const supBelow = supports.filter(s => s.price < entry * 0.995);
    if (supBelow.length >= 1 && supBelow[0].price < tp1 * 1.05 && supBelow[0].price > tp1 * 0.85) {
      tp1 = supBelow[0].price * 1.002;
    }
    if (supBelow.length >= 2 && supBelow[1].price < tp2 * 1.15 && supBelow[1].price > tp2 * 0.8) {
      tp2 = supBelow[1].price * 1.002;
    }
    if (supBelow.length >= 3 && supBelow[2].price < tp3 * 1.2) {
      tp3 = supBelow[2].price * 1.002;
    }
  }

  if (side === "LONG") {
    tp2 = Math.max(tp2, tp1 * 1.01);
    tp3 = Math.max(tp3, tp2 * 1.01);
  } else {
    tp2 = Math.min(tp2, tp1 * 0.99);
    tp3 = Math.min(tp3, tp2 * 0.99);
  }

  return { tp1, tp2, tp3, sl };
}

/* ─── Compute TP0 (Quick Profit) from 4h S/R ─── */

function computeTP0(
  side: "LONG" | "SHORT",
  entry: number,
  supports4h: SRLevel[],
  resistances4h: SRLevel[],
): number | null {
  if (side === "LONG") {
    // Nearest 4h resistance above entry
    const nearest = resistances4h.find(r => r.price > entry * 1.003 && r.price < entry * 1.05);
    return nearest ? roundPrice(nearest.price * 0.999, entry) : null;
  } else {
    // Nearest 4h support below entry
    const nearest = supports4h.find(s => s.price < entry * 0.997 && s.price > entry * 0.95);
    return nearest ? roundPrice(nearest.price * 1.001, entry) : null;
  }
}

/* ─── Generate trade setups from real market data ─── */

interface PreSetup {
  coin: any;
  side: "LONG" | "SHORT";
  confidence: number;
  reason: string;
  supports7j: SRLevel[];
  resistances7j: SRLevel[];
}

function detectPreSetups(coins: any[]): PreSetup[] {
  const preSetups: PreSetup[] = [];

  for (const c of coins) {
    if (!c || !c.current_price || !c.market_cap) continue;

    const change24h = c.price_change_percentage_24h || 0;
    const volume = c.total_volume || 0;
    const mcap = c.market_cap || 1;
    const volMcapRatio = volume / mcap;

    const { supports, resistances } = calculate7jSRLevels(c);

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

    // S/R proximity bonus (7j)
    const price = c.current_price;
    const nearestSupport = supports[0];
    const nearestResistance = resistances[0];

    if (side === "LONG") {
      if (nearestSupport && Math.abs(price - nearestSupport.price) / price < 0.02) {
        confidence += 10;
        reason += ` | Proche du support ${formatPrice(nearestSupport.price)}`;
      }
    } else {
      if (nearestResistance && Math.abs(price - nearestResistance.price) / price < 0.02) {
        confidence += 10;
        reason += ` | Proche de la résistance ${formatPrice(nearestResistance.price)}`;
      }
    }

    if (supports.length >= 2) confidence += 3;
    if (resistances.length >= 2) confidence += 3;

    preSetups.push({ coin: c, side, confidence, reason, supports7j: supports, resistances7j: resistances });
  }

  return preSetups;
}

async function enrichWithBinance4h(preSetups: PreSetup[]): Promise<TradeSetup[]> {
  const triggerTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const setups: TradeSetup[] = [];

  // Fetch Binance 4h klines in parallel (max 15 concurrent to avoid rate limits)
  const BATCH_SIZE = 15;
  const binanceResults: Map<string, BinanceKline[]> = new Map();

  for (let i = 0; i < preSetups.length; i += BATCH_SIZE) {
    const batch = preSetups.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (ps) => {
      const sym = ((ps.coin.symbol || "") as string).toUpperCase();
      if (!binanceResults.has(sym)) {
        const klines = await fetchBinance4hKlines(sym);
        binanceResults.set(sym, klines);
      }
    });
    await Promise.all(promises);
  }

  for (const ps of preSetups) {
    const { coin: c, side } = ps;
    let { confidence, reason } = ps;
    const price = c.current_price;
    const sym = ((c.symbol || "") as string).toUpperCase();
    const klines = binanceResults.get(sym) || [];

    // Calculate 4h S/R
    const sr4h = calculate4hSRLevels(klines, price);

    // Calculate RSI 14 on 4h
    const closes = klines.map(k => k.close);
    const rsi4h = calculateRSI(closes);

    // RSI confidence adjustment
    if (rsi4h !== null) {
      if (side === "LONG" && rsi4h < 30) {
        confidence += 10;
        reason += ` | RSI 4h survendu (${rsi4h})`;
      } else if (side === "SHORT" && rsi4h > 70) {
        confidence += 10;
        reason += ` | RSI 4h suracheté (${rsi4h})`;
      } else if (rsi4h >= 40 && rsi4h <= 60) {
        confidence -= 5;
      }
    }

    // Merge 7j + 4h S/R and detect convergence
    const { merged: mergedSupports, convergenceCount: convSup } = markConvergence(
      ps.supports7j.filter(s => s.type === "support"),
      sr4h.supports
    );
    const { merged: mergedResistances, convergenceCount: convRes } = markConvergence(
      ps.resistances7j.filter(r => r.type === "resistance"),
      sr4h.resistances
    );

    const totalConvergence = convSup + convRes;
    const hasConvergence = totalConvergence > 0;

    // Convergence bonus
    if (hasConvergence) {
      confidence += 10;
      reason += ` | 🔗 Convergence S/R (${totalConvergence} niveau${totalConvergence > 1 ? "x" : ""})`;
    }

    // TP alignment with merged S/R
    const volatility = Math.max(Math.abs(c.price_change_percentage_24h || 0) * 0.5, 1.5);
    const slPercent = volatility * 0.8;
    const { tp1, tp2, tp3, sl } = alignTPWithSR(side, price, slPercent, mergedSupports, mergedResistances);

    // TP1 alignment bonus
    if (side === "LONG") {
      const nearestRes = mergedResistances[0];
      if (nearestRes && Math.abs(tp1 - nearestRes.price) / tp1 < 0.02) {
        confidence += 5;
      }
    } else {
      const nearestSup = mergedSupports[0];
      if (nearestSup && Math.abs(tp1 - nearestSup.price) / tp1 < 0.02) {
        confidence += 5;
      }
    }

    // SL too tight penalty
    if (Math.abs(sl - price) / price < 0.005) {
      confidence -= 10;
    }

    // TP0 Quick Profit
    const tp0 = computeTP0(side, price, sr4h.supports, sr4h.resistances);

    confidence = Math.min(95, Math.max(25, confidence));

    const riskDistance = Math.abs(price - sl);
    const rewardDistance = Math.abs(tp2 - price);
    const rr = riskDistance > 0 ? Math.round((rewardDistance / riskDistance) * 10) / 10 : 2;

    setups.push({
      id: c.id,
      symbol: sym + "USDT",
      name: c.name || "Unknown",
      image: c.image || "",
      side,
      currentPrice: price,
      entry: price,
      stopLoss: roundPrice(sl, price),
      tp0,
      tp1: roundPrice(tp1, price),
      tp2: roundPrice(tp2, price),
      tp3: roundPrice(tp3, price),
      rr,
      change24h: c.price_change_percentage_24h || 0,
      volume: c.total_volume || 0,
      marketCap: c.market_cap || 0,
      confidence,
      reason,
      triggerTime,
      supports: mergedSupports.filter(s => s.type === "support").slice(0, 5),
      resistances: mergedResistances.filter(r => r.type === "resistance").slice(0, 5),
      rsi4h,
      hasConvergence,
    });
  }

  return setups.sort((a, b) => b.confidence - a.confidence);
}

/* ─── RSI Badge Color ─── */

function rsiBadge(rsi: number | null): { text: string; color: string; bg: string } {
  if (rsi === null) return { text: "N/A", color: "text-gray-500", bg: "bg-gray-500/10" };
  if (rsi < 30) return { text: `${rsi}`, color: "text-emerald-400", bg: "bg-emerald-500/10" };
  if (rsi > 70) return { text: `${rsi}`, color: "text-red-400", bg: "bg-red-500/10" };
  if (rsi >= 40 && rsi <= 60) return { text: `${rsi}`, color: "text-gray-400", bg: "bg-gray-500/10" };
  return { text: `${rsi}`, color: "text-amber-400", bg: "bg-amber-500/10" };
}

/* ─── Component ─── */

export default function Trades() {
  const [setups, setSetups] = useState<TradeSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [filterSide, setFilterSide] = useState<"all" | "LONG" | "SHORT">("all");
  const [searchSymbol, setSearchSymbol] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showAllConfidence, setShowAllConfidence] = useState(false);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const allData = await fetchTop200(true);
      if (allData.length > 0) {
        const preSetups = detectPreSetups(allData);
        const enriched = await enrichWithBinance4h(preSetups);
        setSetups(enriched);
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
    const interval = setInterval(fetchTrades, 90000);
    return () => clearInterval(interval);
  }, [fetchTrades]);

  // Apply confidence filter
  const confFiltered = showAllConfidence ? setups : setups.filter(t => t.confidence >= 65);

  const filtered = confFiltered.filter((t) => {
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
  const convergenceCount = setups.filter((t) => t.hasConvergence).length;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
        <PageHeader
          icon={<BarChart3 className="w-6 h-6" />}
          title="Suggestions de Trades"
          subtitle="Setups de trading avec chandeliers Binance 4h, RSI, TP0 Quick Profit, convergence S/R et gestion du risque avancée."
          accentColor="blue"
          steps={[
            { n: "1", title: "Analyse S/R Multi-TF", desc: "Supports/résistances calculés sur sparkline 7j (CoinGecko) ET chandeliers 4h (Binance) pour une précision accrue." },
            { n: "2", title: "TP0 Quick Profit", desc: "Objectif rapide (~1-3%) basé sur la résistance/support 4h la plus proche. Atteignable en quelques heures." },
            { n: "3", title: "RSI 4h + Convergence", desc: "RSI 14 sur 4h ajuste la confiance. Les niveaux S/R convergents (4h ≈ 7j) reçoivent un bonus de fiabilité." },
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
              <p className="text-sm text-gray-400 mt-1">Setups multi-timeframe (7j + 4h) avec TP0, RSI et convergence S/R</p>
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
            { icon: "📈", label: "Total Setups", value: String(setups.length), change: "Détectés" },
            { icon: "🟢", label: "LONG", value: String(longCount), change: "Haussiers" },
            { icon: "🔴", label: "SHORT", value: String(shortCount), change: "Baissiers" },
            { icon: "🎯", label: "Confiance Moy.", value: `${avgConfidence}%`, change: "Score moyen" },
            { icon: "⭐", label: "Haute Confiance", value: String(highConfCount), change: "≥ 70%" },
            { icon: "🔗", label: "Convergence", value: String(convergenceCount), change: "S/R 4h ≈ 7j" },
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

          {/* Confidence filter toggle */}
          <button
            onClick={() => setShowAllConfidence(!showAllConfidence)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
              showAllConfidence
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            {showAllConfidence ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {showAllConfidence ? "Tous les setups" : "Confiance ≥ 65%"}
          </button>

          <span className="text-xs text-gray-500 ml-auto">({filtered.length} résultats)</span>
        </div>

        {/* Trades Table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">Setups Détectés</h2>
            <span className="text-xs text-gray-500 ml-2">Cliquez sur une ligne pour voir les détails (S/R, RSI, convergence)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Heure", "Symbole", "Type", "Entry", "SL", "TP0", "TP1", "TP2", "TP3", "R:R", "24h", "Confiance", ""].map((h) => (
                    <th key={h} className={`px-3 py-3 text-left text-[10px] uppercase tracking-wider font-semibold ${h === "TP0" ? "text-amber-400" : "text-gray-500"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={13} className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Chargement des données CoinGecko + Binance 4h...</p>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={13} className="text-center py-12 text-gray-500">
                    {showAllConfidence ? "Aucun setup détecté avec ces filtres" : "Aucun setup avec confiance ≥ 65%. Cliquez \"Tous les setups\" pour voir les autres."}
                  </td></tr>
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
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sm">{trade.symbol}</span>
                                  {trade.hasConvergence && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-0.5">
                                      <Link2 className="w-2.5 h-2.5" />Conv
                                    </span>
                                  )}
                                </div>
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
                          {/* TP0 */}
                          <td className="px-3 py-3">
                            {trade.tp0 !== null ? (
                              <>
                                <div className="flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-amber-400" />
                                  <span className="font-mono text-xs text-amber-400 font-semibold">${formatPrice(trade.tp0)}</span>
                                </div>
                                <span className="text-[9px] text-amber-400/60">
                                  {trade.side === "LONG" ? "+" : "-"}{Math.abs((trade.tp0 - trade.entry) / trade.entry * 100).toFixed(1)}%
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] text-gray-600">—</span>
                            )}
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

                        {/* Expanded Row */}
                        {isExpanded && (
                          <tr className="border-b border-white/[0.03]">
                            <td colSpan={13} className="px-4 py-4 bg-white/[0.01]">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                          <span className="text-xs text-gray-400 flex items-center gap-1">
                                            {s.source}
                                            {s.convergent && <Link2 className="w-3 h-3 text-amber-400" />}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            {s.convergent && (
                                              <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold">
                                                🔗 Conv
                                              </span>
                                            )}
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
                                          <span className="text-xs text-gray-400 flex items-center gap-1">
                                            {r.source}
                                            {r.convergent && <Link2 className="w-3 h-3 text-amber-400" />}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            {r.convergent && (
                                              <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold">
                                                🔗 Conv
                                              </span>
                                            )}
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

                                {/* RSI 4h */}
                                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                                  <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold mb-2">📉 RSI 14 (4h)</p>
                                  {trade.rsi4h !== null ? (
                                    <div>
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-3xl font-black ${rsiBadge(trade.rsi4h).color}`}>{trade.rsi4h}</span>
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${rsiBadge(trade.rsi4h).bg} ${rsiBadge(trade.rsi4h).color}`}>
                                          {trade.rsi4h < 30 ? "Survendu" : trade.rsi4h > 70 ? "Suracheté" : trade.rsi4h <= 60 && trade.rsi4h >= 40 ? "Neutre" : trade.rsi4h < 40 ? "Faible" : "Fort"}
                                        </span>
                                      </div>
                                      {/* RSI visual bar */}
                                      <div className="relative h-2 bg-gradient-to-r from-emerald-500 via-gray-500 to-red-500 rounded-full overflow-hidden">
                                        <div
                                          className="absolute top-0 w-1.5 h-full bg-white rounded-full shadow-lg"
                                          style={{ left: `${Math.min(100, Math.max(0, trade.rsi4h))}%`, transform: "translateX(-50%)" }}
                                        />
                                      </div>
                                      <div className="flex justify-between text-[8px] text-gray-600 mt-1">
                                        <span>0</span><span>30</span><span>50</span><span>70</span><span>100</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500">Données Binance non disponibles pour ce symbole</p>
                                  )}
                                </div>
                              </div>

                              {/* Visual Key Levels Bar */}
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
                                  {trade.tp0 !== null && (
                                    <>
                                      <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-400/20 text-amber-400 font-mono font-semibold flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> TP0: ${formatPrice(trade.tp0)}
                                      </span>
                                      <span className="text-gray-600">→</span>
                                    </>
                                  )}
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
            ⚠️ <strong>Avertissement :</strong> Ces suggestions sont générées automatiquement à partir des données de marché CoinGecko (prix, volumes, sparkline 7j, high/low 24h, ATH)
            et des chandeliers Binance 4h (RSI 14, supports/résistances court terme). Les niveaux S/R sont calculés algorithmiquement sur deux timeframes et les TP sont alignés avec ces niveaux.
            Le TP0 "Quick Profit" vise un objectif atteignable en quelques heures (~1-3%).
            Elles ne constituent pas des conseils financiers. Faites toujours votre propre analyse avant de trader.
          </p>
        </div>
        <Footer />
      </main>
    </div>
  );
}