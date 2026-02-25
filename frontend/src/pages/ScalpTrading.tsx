import { useEffect, useState, useCallback, Fragment } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import {
  TrendingUp, TrendingDown, RefreshCw, Filter, BarChart3, Clock,
  Shield, Target, ChevronDown, ChevronUp, Link2, Zap, Eye, EyeOff, Trophy,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const SCALP_BG =
  "/images/ScalpTrading.jpg";

/* ─── Types ─── */

interface SRLevel {
  price: number;
  type: "support" | "resistance";
  strength: "major" | "minor";
  source: string;
  convergent?: boolean;
}

interface ScalpSetup {
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
  stochRsiK: number | null;
  stochRsiD: number | null;
  macdSignal: "bullish" | "bearish" | "neutral";
  h1Trend: "bullish" | "bearish" | "neutral";
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

/* ─── Binance Klines Fetcher ─── */

interface BinanceKline {
  open: number;
  high: number;
  low: number;
  close: number;
}

async function fetchBinanceKlines(symbolUpper: string, interval: string, limit: number): Promise<BinanceKline[]> {
  const base = symbolUpper.replace(/USDT$/, "");
  const pair = `${base}USDT`;
  try {
    const res = await fetch(
      `/api/binance/klines?symbol=${pair}&interval=${interval}&limit=${limit}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((k: number[]) => ({
      open: parseFloat(String(k[1])),
      high: parseFloat(String(k[2])),
      low: parseFloat(String(k[3])),
      close: parseFloat(String(k[4])),
    }));
  } catch {
    return [];
  }
}

/* ─── RSI Calculation ─── */

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

/* ─── Stochastic RSI Calculation ─── */

function calculateStochRSI(closes: number[], rsiPeriod = 14, stochPeriod = 14, kSmooth = 3, dSmooth = 3): { k: number | null; d: number | null } {
  if (closes.length < rsiPeriod + stochPeriod + kSmooth + dSmooth) return { k: null, d: null };

  // Step 1: Calculate RSI series
  const rsiValues: number[] = [];
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= rsiPeriod; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum += Math.abs(diff);
  }
  let avgGain = gainSum / rsiPeriod;
  let avgLoss = lossSum / rsiPeriod;
  rsiValues.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));

  for (let i = rsiPeriod + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (rsiPeriod - 1) + diff) / rsiPeriod;
      avgLoss = (avgLoss * (rsiPeriod - 1)) / rsiPeriod;
    } else {
      avgGain = (avgGain * (rsiPeriod - 1)) / rsiPeriod;
      avgLoss = (avgLoss * (rsiPeriod - 1) + Math.abs(diff)) / rsiPeriod;
    }
    rsiValues.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }

  if (rsiValues.length < stochPeriod) return { k: null, d: null };

  // Step 2: Stochastic of RSI
  const stochRaw: number[] = [];
  for (let i = stochPeriod - 1; i < rsiValues.length; i++) {
    const window = rsiValues.slice(i - stochPeriod + 1, i + 1);
    const min = Math.min(...window);
    const max = Math.max(...window);
    stochRaw.push(max === min ? 50 : ((rsiValues[i] - min) / (max - min)) * 100);
  }

  if (stochRaw.length < kSmooth) return { k: null, d: null };

  // Step 3: Smooth %K (SMA of stochRaw)
  const kValues: number[] = [];
  for (let i = kSmooth - 1; i < stochRaw.length; i++) {
    const sum = stochRaw.slice(i - kSmooth + 1, i + 1).reduce((a, b) => a + b, 0);
    kValues.push(sum / kSmooth);
  }

  if (kValues.length < dSmooth) return { k: kValues[kValues.length - 1] ?? null, d: null };

  // Step 4: %D (SMA of %K)
  const dValues: number[] = [];
  for (let i = dSmooth - 1; i < kValues.length; i++) {
    const sum = kValues.slice(i - dSmooth + 1, i + 1).reduce((a, b) => a + b, 0);
    dValues.push(sum / dSmooth);
  }

  return {
    k: Math.round((kValues[kValues.length - 1] ?? 0) * 10) / 10,
    d: Math.round((dValues[dValues.length - 1] ?? 0) * 10) / 10,
  };
}

/* ─── MACD Calculation ─── */

function calculateMACD(closes: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): { macd: number; signal: number; histogram: number; direction: "bullish" | "bearish" | "neutral" } | null {
  if (closes.length < slowPeriod + signalPeriod) return null;

  const ema = (data: number[], period: number): number[] => {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);
    let prev = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(prev);
    for (let i = period; i < data.length; i++) {
      prev = (data[i] - prev) * multiplier + prev;
      result.push(prev);
    }
    return result;
  };

  const emaFast = ema(closes, fastPeriod);
  const emaSlow = ema(closes, slowPeriod);

  // Align arrays — emaSlow starts later
  const offset = slowPeriod - fastPeriod;
  const macdLine: number[] = [];
  for (let i = 0; i < emaSlow.length; i++) {
    macdLine.push(emaFast[i + offset] - emaSlow[i]);
  }

  if (macdLine.length < signalPeriod) return null;

  const signalLine = ema(macdLine, signalPeriod);
  const signalOffset = macdLine.length - signalLine.length;

  const lastMacd = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  const histogram = lastMacd - lastSignal;

  // Check crossover (last 2 values)
  let direction: "bullish" | "bearish" | "neutral" = "neutral";
  if (macdLine.length >= 2 && signalLine.length >= 2) {
    const prevMacd = macdLine[macdLine.length - 2];
    const prevSignal = signalLine[signalLine.length - 2];
    const prevSignalIdx = signalLine.length - 2;
    const prevMacdForSignal = macdLine[prevSignalIdx + signalOffset];

    if (lastMacd > lastSignal && prevMacdForSignal !== undefined && prevMacdForSignal <= prevSignal) {
      direction = "bullish"; // Bullish crossover
    } else if (lastMacd < lastSignal && prevMacdForSignal !== undefined && prevMacdForSignal >= prevSignal) {
      direction = "bearish"; // Bearish crossover
    } else if (histogram > 0) {
      direction = "bullish";
    } else if (histogram < 0) {
      direction = "bearish";
    }
  } else if (histogram > 0) {
    direction = "bullish";
  } else if (histogram < 0) {
    direction = "bearish";
  }

  return {
    macd: Math.round(lastMacd * 1e6) / 1e6,
    signal: Math.round(lastSignal * 1e6) / 1e6,
    histogram: Math.round(histogram * 1e6) / 1e6,
    direction,
  };
}

/* ─── H1 Trend Detection ─── */

function detectH1Trend(klines: BinanceKline[]): "bullish" | "bearish" | "neutral" {
  if (klines.length < 20) return "neutral";
  const closes = klines.map(k => k.close);

  // EMA 20 on H1
  const period = 20;
  const multiplier = 2 / (period + 1);
  let ema20 = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema20 = (closes[i] - ema20) * multiplier + ema20;
  }

  const lastClose = closes[closes.length - 1];
  const rsi = calculateRSI(closes);

  if (lastClose > ema20 * 1.002 && rsi !== null && rsi > 50) return "bullish";
  if (lastClose < ema20 * 0.998 && rsi !== null && rsi < 50) return "bearish";
  return "neutral";
}

/* ─── M5 S/R from Binance pivots ─── */

function calculateM5SRLevels(klines: BinanceKline[], currentPrice: number): { supports: SRLevel[]; resistances: SRLevel[] } {
  const supports: SRLevel[] = [];
  const resistances: SRLevel[] = [];
  if (klines.length < 10) return { supports, resistances };

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

  const clusterLevels = (levels: number[]): number[] => {
    if (levels.length === 0) return [];
    const sorted = [...levels].sort((a, b) => a - b);
    const clusters: number[][] = [[sorted[0]]];
    for (let i = 1; i < sorted.length; i++) {
      const lastCluster = clusters[clusters.length - 1];
      const clusterAvg = lastCluster.reduce((s, v) => s + v, 0) / lastCluster.length;
      if (Math.abs(sorted[i] - clusterAvg) / clusterAvg < 0.005) {
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
    if (level < currentPrice * 0.999) {
      supports.push({
        price: level,
        type: "support",
        strength: Math.abs(level - currentPrice) / currentPrice < 0.01 ? "major" : "minor",
        source: "M5",
      });
    }
  }

  for (const level of clusteredMaxs) {
    if (level > currentPrice * 1.001) {
      resistances.push({
        price: level,
        type: "resistance",
        strength: Math.abs(level - currentPrice) / currentPrice < 0.01 ? "major" : "minor",
        source: "M5",
      });
    }
  }

  supports.sort((a, b) => b.price - a.price);
  resistances.sort((a, b) => a.price - b.price);

  return { supports: supports.slice(0, 4), resistances: resistances.slice(0, 4) };
}

/* ─── Align TP for Scalping (tighter targets) ─── */

function alignScalpTP(
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
    tp1 = entry + slDistance * 1.2;
    tp2 = entry + slDistance * 2.0;
    tp3 = entry + slDistance * 3.0;

    const nearestSupport = supports.find(s => s.price < entry * 0.998);
    if (nearestSupport && nearestSupport.price > sl * 0.97 && nearestSupport.price < entry * 0.995) {
      sl = nearestSupport.price * 0.999;
    }

    const resAbove = resistances.filter(r => r.price > entry * 1.002);
    if (resAbove.length >= 1 && resAbove[0].price > tp1 * 0.95 && resAbove[0].price < tp1 * 1.15) {
      tp1 = resAbove[0].price * 0.999;
    }
    if (resAbove.length >= 2 && resAbove[1].price > tp2 * 0.90 && resAbove[1].price < tp2 * 1.15) {
      tp2 = resAbove[1].price * 0.999;
    }
    if (resAbove.length >= 3 && resAbove[2].price > tp3 * 0.85) {
      tp3 = resAbove[2].price * 0.999;
    }
  } else {
    sl = entry + slDistance;
    tp1 = entry - slDistance * 1.2;
    tp2 = entry - slDistance * 2.0;
    tp3 = entry - slDistance * 3.0;

    const nearestResistance = resistances.find(r => r.price > entry * 1.002);
    if (nearestResistance && nearestResistance.price < sl * 1.03 && nearestResistance.price > entry * 1.005) {
      sl = nearestResistance.price * 1.001;
    }

    const supBelow = supports.filter(s => s.price < entry * 0.998);
    if (supBelow.length >= 1 && supBelow[0].price < tp1 * 1.05 && supBelow[0].price > tp1 * 0.85) {
      tp1 = supBelow[0].price * 1.001;
    }
    if (supBelow.length >= 2 && supBelow[1].price < tp2 * 1.10 && supBelow[1].price > tp2 * 0.85) {
      tp2 = supBelow[1].price * 1.001;
    }
    if (supBelow.length >= 3 && supBelow[2].price < tp3 * 1.15) {
      tp3 = supBelow[2].price * 1.001;
    }
  }

  if (side === "LONG") {
    tp2 = Math.max(tp2, tp1 * 1.005);
    tp3 = Math.max(tp3, tp2 * 1.005);
  } else {
    tp2 = Math.min(tp2, tp1 * 0.995);
    tp3 = Math.min(tp3, tp2 * 0.995);
  }

  return { tp1, tp2, tp3, sl };
}

/* ─── Generate Scalp Setups ─── */

async function generateScalpSetups(coins: any[]): Promise<ScalpSetup[]> {
  const triggerTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const setups: ScalpSetup[] = [];

  // Pre-filter coins with enough volume and movement
  const candidates = coins.filter(c => {
    if (!c || !c.current_price || !c.market_cap) return false;
    const vol = c.total_volume || 0;
    const mcap = c.market_cap || 1;
    return vol / mcap > 0.05 && mcap > 50_000_000; // Min 50M mcap for scalping liquidity
  });

  // Take top 30 by volume/mcap ratio for scalping
  const sorted = [...candidates].sort((a, b) => {
    const ratioA = (a.total_volume || 0) / (a.market_cap || 1);
    const ratioB = (b.total_volume || 0) / (b.market_cap || 1);
    return ratioB - ratioA;
  }).slice(0, 30);

  // Fetch H1 and M5 klines in parallel
  const BATCH_SIZE = 10;
  const h1Data: Map<string, BinanceKline[]> = new Map();
  const m5Data: Map<string, BinanceKline[]> = new Map();

  for (let i = 0; i < sorted.length; i += BATCH_SIZE) {
    const batch = sorted.slice(i, i + BATCH_SIZE);
    const promises = batch.flatMap(c => {
      const sym = ((c.symbol || "") as string).toUpperCase();
      return [
        fetchBinanceKlines(sym, "1h", 100).then(k => h1Data.set(sym, k)),
        fetchBinanceKlines(sym, "5m", 100).then(k => m5Data.set(sym, k)),
      ];
    });
    await Promise.all(promises);
    // Small delay between batches
    if (i + BATCH_SIZE < sorted.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  for (const c of sorted) {
    const sym = ((c.symbol || "") as string).toUpperCase();
    const price = c.current_price;
    const change24h = c.price_change_percentage_24h || 0;
    const volume = c.total_volume || 0;
    const mcap = c.market_cap || 1;
    const volMcapRatio = volume / mcap;

    const h1Klines = h1Data.get(sym) || [];
    const m5Klines = m5Data.get(sym) || [];

    if (h1Klines.length < 30 || m5Klines.length < 50) continue;

    // 1. Determine H1 trend
    const h1Trend = detectH1Trend(h1Klines);
    if (h1Trend === "neutral") continue; // Skip neutral trends for scalping

    // 2. Calculate Stoch RSI on M5
    const m5Closes = m5Klines.map(k => k.close);
    const stochRsi = calculateStochRSI(m5Closes, 14, 14, 3, 3);

    // 3. Calculate MACD on M5
    const macdResult = calculateMACD(m5Closes, 12, 26, 9);
    const macdSignal = macdResult?.direction || "neutral";

    // 4. Entry logic: H1 trend + M5 Stoch RSI + MACD confirmation
    let side: "LONG" | "SHORT" | null = null;
    let confidence = 0;
    let reason = "";

    if (h1Trend === "bullish") {
      // LONG: H1 bullish + M5 Stoch RSI oversold crossing up + MACD bullish
      const stochOversold = stochRsi.k !== null && stochRsi.k < 30;
      const stochCrossingUp = stochRsi.k !== null && stochRsi.d !== null && stochRsi.k > stochRsi.d;
      const macdBullish = macdSignal === "bullish";

      if ((stochOversold || stochCrossingUp) && macdBullish) {
        side = "LONG";
        confidence = 55;
        reason = `Tendance H1 haussière`;

        if (stochOversold) {
          confidence += 15;
          reason += ` | Stoch RSI M5 survendu (K:${stochRsi.k})`;
        } else if (stochCrossingUp) {
          confidence += 10;
          reason += ` | Stoch RSI M5 croisement haussier (K:${stochRsi.k} > D:${stochRsi.d})`;
        }

        if (macdBullish) {
          confidence += 10;
          reason += ` | MACD M5 haussier`;
        }

        if (volMcapRatio > 0.15) { confidence += 8; reason += ` | Volume élevé`; }
        if (change24h > 2) { confidence += 5; }
      }
    } else if (h1Trend === "bearish") {
      // SHORT: H1 bearish + M5 Stoch RSI overbought crossing down + MACD bearish
      const stochOverbought = stochRsi.k !== null && stochRsi.k > 70;
      const stochCrossingDown = stochRsi.k !== null && stochRsi.d !== null && stochRsi.k < stochRsi.d;
      const macdBearish = macdSignal === "bearish";

      if ((stochOverbought || stochCrossingDown) && macdBearish) {
        side = "SHORT";
        confidence = 55;
        reason = `Tendance H1 baissière`;

        if (stochOverbought) {
          confidence += 15;
          reason += ` | Stoch RSI M5 suracheté (K:${stochRsi.k})`;
        } else if (stochCrossingDown) {
          confidence += 10;
          reason += ` | Stoch RSI M5 croisement baissier (K:${stochRsi.k} < D:${stochRsi.d})`;
        }

        if (macdBearish) {
          confidence += 10;
          reason += ` | MACD M5 baissier`;
        }

        if (volMcapRatio > 0.15) { confidence += 8; reason += ` | Volume élevé`; }
        if (change24h < -2) { confidence += 5; }
      }
    }

    if (!side) continue;

    // 5. Calculate M5 S/R levels
    const m5SR = calculateM5SRLevels(m5Klines, price);

    // 6. S/R proximity bonus
    if (side === "LONG") {
      const nearSup = m5SR.supports[0];
      if (nearSup && Math.abs(price - nearSup.price) / price < 0.005) {
        confidence += 8;
        reason += ` | Proche support M5 $${formatPrice(nearSup.price)}`;
      }
    } else {
      const nearRes = m5SR.resistances[0];
      if (nearRes && Math.abs(price - nearRes.price) / price < 0.005) {
        confidence += 8;
        reason += ` | Proche résistance M5 $${formatPrice(nearRes.price)}`;
      }
    }

    // 7. Scalp-tight TP/SL (0.3-0.8% SL for scalping)
    const volatility5m = m5Klines.slice(-20).reduce((acc, k) => acc + (k.high - k.low) / k.close * 100, 0) / 20;
    const slPercent = Math.max(0.3, Math.min(0.8, volatility5m * 1.5));

    const { tp1, tp2, tp3, sl } = alignScalpTP(side, price, slPercent, m5SR.supports, m5SR.resistances);

    // SL too tight penalty
    if (Math.abs(sl - price) / price < 0.002) {
      confidence -= 10;
    }

    confidence = Math.min(95, Math.max(25, confidence));

    const riskDistance = Math.abs(price - sl);
    const rewardDistance = Math.abs(tp2 - price);
    const rr = riskDistance > 0 ? Math.round((rewardDistance / riskDistance) * 10) / 10 : 1.5;

    setups.push({
      id: c.id,
      symbol: sym + "USDT",
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
      supports: m5SR.supports.slice(0, 3),
      resistances: m5SR.resistances.slice(0, 3),
      stochRsiK: stochRsi.k,
      stochRsiD: stochRsi.d,
      macdSignal,
      h1Trend,
    });
  }

  return setups.sort((a, b) => b.confidence - a.confidence);
}

/* ─── Auto-register scalp calls to backend ─── */

async function registerScalpCallsToBackend(setups: ScalpSetup[]) {
  for (const setup of setups) {
    try {
      await fetch("/api/v1/scalp-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: setup.symbol,
          side: setup.side,
          entry_price: setup.entry,
          stop_loss: setup.stopLoss,
          tp1: setup.tp1,
          tp2: setup.tp2,
          tp3: setup.tp3,
          confidence: setup.confidence,
          reason: setup.reason,
          stoch_rsi_k: setup.stochRsiK,
          stoch_rsi_d: setup.stochRsiD,
          macd_signal: setup.macdSignal,
          h1_trend: setup.h1Trend,
          rr: setup.rr,
        }),
      });
    } catch {
      // Silent fail — non-critical
    }
  }
}

/* ─── Component ─── */

export default function ScalpTrading() {
  const [trades, setTrades] = useState<ScalpSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [filter, setFilter] = useState<"all" | "LONG" | "SHORT">("all");
  const [minConfidence, setMinConfidence] = useState(50);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showSR, setShowSR] = useState(true);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setDataWarning(null);
    try {
      // Fetch top 200 coins from CoinGecko via proxy
      const allCoins: any[] = [];
      for (let page = 1; page <= 2; page++) {
        try {
          const res = await fetch(
            `/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page}&sparkline=true&price_change_percentage=24h`,
            { signal: AbortSignal.timeout(15000) }
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) allCoins.push(...data);
          }
        } catch (e) {
          console.warn(`CoinGecko page ${page} fetch failed:`, e);
        }
        if (page < 2) await new Promise(r => setTimeout(r, 500));
      }

      if (allCoins.length === 0) {
        setFetchError("Impossible de récupérer les données de marché. Vérifiez votre connexion et réessayez.");
        setLoading(false);
        return;
      }

      // Quick check if Binance is available
      const binanceTest = await fetchBinanceKlines("BTC", "1h", 5);
      if (binanceTest.length === 0) {
        setDataWarning("Les données Binance ne sont pas disponibles depuis cette localisation. Les signaux de scalping nécessitent les klines M5/H1 de Binance pour fonctionner. Les alertes Telegram côté serveur continuent de fonctionner normalement.");
      }

      const setups = await generateScalpSetups(allCoins);
      setTrades(setups);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));

      // Register calls to backend (non-blocking)
      registerScalpCallsToBackend(setups.filter(s => s.confidence >= 60)).catch(() => {});
    } catch (err) {
      console.error("Scalp fetch error:", err);
      setFetchError("Une erreur est survenue lors de l'analyse. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3 * 60 * 1000); // Refresh every 3 min for scalping
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = trades.filter(t => {
    if (filter !== "all" && t.side !== filter) return false;
    if (t.confidence < minConfidence) return false;
    return true;
  });

  const longCount = trades.filter(t => t.side === "LONG").length;
  const shortCount = trades.filter(t => t.side === "SHORT").length;
  const avgConfidence = trades.length > 0 ? Math.round(trades.reduce((s, t) => s + t.confidence, 0) / trades.length) : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
        <PageHeader
          icon={<Zap className="w-7 h-7" />}
          title="Scalp Trading"
          subtitle="Signaux de scalping basés sur Stoch RSI + MACD (M5) avec confirmation de tendance H1"
          accentColor="amber"
        />

        <div className="px-4 md:px-6 pb-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Signaux</p>
              <p className="text-xl font-black text-white">{trades.length}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Long</p>
              <p className="text-xl font-black text-emerald-400">{longCount}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Short</p>
              <p className="text-xl font-black text-red-400">{shortCount}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Confiance Moy.</p>
              <p className="text-xl font-black text-amber-400">{avgConfidence}%</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Dernière MAJ</p>
              <p className="text-sm font-bold text-gray-300">{lastUpdate || "—"}</p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 text-sm font-semibold text-amber-300 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Analyse M5..." : "Rafraîchir"}
            </button>

            <Link
              to="/scalp/performance"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/20 text-sm font-semibold text-purple-300 transition-all"
            >
              <Trophy className="w-4 h-4" /> Performance
            </Link>

            <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
              {(["all", "LONG", "SHORT"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === f
                      ? f === "LONG" ? "bg-emerald-500/20 text-emerald-400" : f === "SHORT" ? "bg-red-500/20 text-red-400" : "bg-white/[0.1] text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {f === "all" ? "Tous" : f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={minConfidence}
                onChange={e => setMinConfidence(Number(e.target.value))}
                className="px-2 py-1.5 rounded-lg bg-black/30 border border-white/[0.08] text-xs text-white"
              >
                <option value={30}>≥ 30%</option>
                <option value={50}>≥ 50%</option>
                <option value={60}>≥ 60%</option>
                <option value={70}>≥ 70%</option>
                <option value={80}>≥ 80%</option>
              </select>
            </div>

            <button
              onClick={() => setShowSR(!showSR)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-semibold text-gray-400 hover:text-white transition-all"
            >
              {showSR ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              S/R
            </button>
          </div>

          {/* Strategy Info */}
          <div className="mb-4 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl p-3">
            <p className="text-xs text-amber-300/80 flex items-center gap-2">
              <Zap className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Stratégie :</strong> Tendance H1 (EMA20 + RSI) → Entrée M5 (Stoch RSI croisement + MACD confirmation).
                SL serré (0.3-0.8%), TP rapides. Idéal pour des trades de quelques minutes à 1h.
              </span>
            </p>
          </div>

          {/* Error Banner */}
          {fetchError && (
            <div className="mb-4 bg-red-500/[0.08] border border-red-500/20 rounded-xl p-4">
              <p className="text-sm text-red-300 flex items-center gap-2">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span>{fetchError}</span>
              </p>
            </div>
          )}

          {/* Data Warning Banner */}
          {dataWarning && !fetchError && (
            <div className="mb-4 bg-orange-500/[0.08] border border-orange-500/20 rounded-xl p-4">
              <p className="text-sm text-orange-300 flex items-center gap-2">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span>{dataWarning}</span>
              </p>
              <p className="text-xs text-orange-300/60 mt-2 ml-6">
                💡 Les alertes Telegram sont envoyées depuis le serveur backend qui a accès aux données Binance. Consultez votre canal Telegram pour les signaux en temps réel.
              </p>
            </div>
          )}

          {/* Table */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["#", "Crypto", "Type", "Tendance H1", "Stoch RSI", "MACD", "Prix", "Confiance", "R:R", "Volume 24h", ""].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && trades.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-16">
                        <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Analyse des timeframes H1 + M5 en cours...</p>
                        <p className="text-xs text-gray-600 mt-1">Calcul Stoch RSI + MACD sur 30 cryptos</p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-16">
                        <p className="text-sm text-gray-500">Aucun signal de scalping détecté avec ces filtres</p>
                        <p className="text-xs text-gray-600 mt-1">Essayez de réduire le filtre de confiance</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((trade, idx) => {
                      const isExpanded = expandedRow === trade.id;
                      return (
                        <Fragment key={trade.id}>
                          <tr
                            className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                            onClick={() => setExpandedRow(isExpanded ? null : trade.id)}
                          >
                            <td className="px-3 py-3 text-xs text-gray-500 font-mono">{idx + 1}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2.5">
                                {trade.image && (
                                  <img src={trade.image} alt={trade.name} className="w-7 h-7 rounded-full" />
                                )}
                                <div>
                                  <p className="font-bold text-sm">{trade.symbol}</p>
                                  <p className="text-[10px] text-gray-500">{trade.name}</p>
                                </div>
                              </div>
                            </td>
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
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                trade.h1Trend === "bullish"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}>
                                {trade.h1Trend === "bullish" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {trade.h1Trend === "bullish" ? "Haussière" : "Baissière"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {trade.stochRsiK !== null ? (
                                <div className="flex flex-col">
                                  <span className={`text-xs font-bold ${
                                    trade.stochRsiK < 20 ? "text-emerald-400" : trade.stochRsiK > 80 ? "text-red-400" : "text-gray-300"
                                  }`}>
                                    K: {trade.stochRsiK}
                                  </span>
                                  {trade.stochRsiD !== null && (
                                    <span className="text-[10px] text-gray-500">D: {trade.stochRsiD}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-600">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                trade.macdSignal === "bullish"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : trade.macdSignal === "bearish"
                                  ? "bg-red-500/10 text-red-400"
                                  : "bg-gray-500/10 text-gray-400"
                              }`}>
                                {trade.macdSignal === "bullish" ? "↑" : trade.macdSignal === "bearish" ? "↓" : "—"}
                                {trade.macdSignal === "bullish" ? "Bull" : trade.macdSignal === "bearish" ? "Bear" : "Neutre"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div>
                                <p className="font-mono font-bold text-sm text-blue-300">${formatPrice(trade.currentPrice)}</p>
                                <p className={`text-[10px] font-semibold ${trade.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {trade.change24h >= 0 ? "+" : ""}{trade.change24h.toFixed(2)}%
                                </p>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(100, trade.confidence)}%`,
                                      background: trade.confidence >= 70 ? "#22c55e" : trade.confidence >= 50 ? "#f59e0b" : "#ef4444",
                                    }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${
                                  trade.confidence >= 70 ? "text-emerald-400" : trade.confidence >= 50 ? "text-amber-400" : "text-red-400"
                                }`}>
                                  {trade.confidence}%
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span className="text-xs font-bold text-purple-400">1:{trade.rr}</span>
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-400 font-mono">{formatUsd(trade.volume)}</td>
                            <td className="px-3 py-3">
                              <button className="p-1 rounded hover:bg-white/[0.06] transition-colors">
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Detail Row */}
                          {isExpanded && (
                            <tr className="border-b border-white/[0.04]">
                              <td colSpan={11} className="px-4 py-4 bg-white/[0.01]">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  {/* Trade Plan */}
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                      <Target className="w-3.5 h-3.5 text-amber-400" /> Plan de Scalp
                                    </h4>
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-500/[0.06] border border-blue-500/15">
                                        <span className="text-[10px] text-gray-400 font-semibold">ENTRY</span>
                                        <span className="font-mono text-sm font-bold text-blue-300">${formatPrice(trade.entry)}</span>
                                      </div>
                                      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-red-500/[0.06] border border-red-500/15">
                                        <span className="text-[10px] text-gray-400 font-semibold">STOP LOSS</span>
                                        <span className="font-mono text-sm font-bold text-red-400">${formatPrice(trade.stopLoss)}</span>
                                        <span className="text-[10px] text-red-400/70">
                                          ({((trade.stopLoss - trade.entry) / trade.entry * 100).toFixed(2)}%)
                                        </span>
                                      </div>
                                      {[
                                        { label: "TP1", value: trade.tp1, color: "emerald" },
                                        { label: "TP2", value: trade.tp2, color: "emerald" },
                                        { label: "TP3", value: trade.tp3, color: "emerald" },
                                      ].map(tp => (
                                        <div key={tp.label} className={`flex items-center justify-between px-3 py-1.5 rounded-lg bg-${tp.color}-500/[0.06] border border-${tp.color}-500/15`}>
                                          <span className="text-[10px] text-gray-400 font-semibold">{tp.label}</span>
                                          <span className={`font-mono text-sm font-bold text-${tp.color}-400`}>${formatPrice(tp.value)}</span>
                                          <span className={`text-[10px] text-${tp.color}-400/70`}>
                                            ({((tp.value - trade.entry) / trade.entry * 100).toFixed(2)}%)
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* S/R + Reason */}
                                  <div>
                                    {showSR && (trade.supports.length > 0 || trade.resistances.length > 0) && (
                                      <div className="mb-3">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                          <Link2 className="w-3.5 h-3.5 text-purple-400" /> Supports & Résistances M5
                                        </h4>
                                        <div className="space-y-1">
                                          {trade.resistances.slice().reverse().map((r, i) => (
                                            <div key={`r-${i}`} className="flex items-center gap-2 text-[10px]">
                                              <span className={`w-2 h-2 rounded-full ${r.strength === "major" ? "bg-red-400" : "bg-red-400/40"}`} />
                                              <span className="text-gray-500 w-8">R{trade.resistances.length - i}</span>
                                              <span className="font-mono text-red-300">${formatPrice(r.price)}</span>
                                              <span className="text-gray-600">({r.source})</span>
                                            </div>
                                          ))}
                                          <div className="flex items-center gap-2 text-[10px] py-0.5">
                                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                                            <span className="text-gray-500 w-8">Prix</span>
                                            <span className="font-mono text-blue-300 font-bold">${formatPrice(trade.currentPrice)}</span>
                                          </div>
                                          {trade.supports.map((s, i) => (
                                            <div key={`s-${i}`} className="flex items-center gap-2 text-[10px]">
                                              <span className={`w-2 h-2 rounded-full ${s.strength === "major" ? "bg-emerald-400" : "bg-emerald-400/40"}`} />
                                              <span className="text-gray-500 w-8">S{i + 1}</span>
                                              <span className="font-mono text-emerald-300">${formatPrice(s.price)}</span>
                                              <span className="text-gray-600">({s.source})</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div>
                                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Raison du Signal
                                      </h4>
                                      <p className="text-xs text-gray-400 leading-relaxed bg-white/[0.02] rounded-lg p-2.5 border border-white/[0.04]">
                                        {trade.reason}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* TP Targets Row */}
                                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-gray-500 font-semibold">Objectifs :</span>
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
              ⚠️ <strong>Avertissement :</strong> Ces signaux de scalping sont générés automatiquement à partir des données Binance (Stoch RSI 14 + MACD 12/26/9 sur M5, tendance H1 via EMA20+RSI).
              Les niveaux S/R sont calculés sur le timeframe M5. Les TP/SL sont serrés et adaptés au scalping (mouvements rapides).
              Elles ne constituent pas des conseils financiers. Faites toujours votre propre analyse avant de trader.
            </p>
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}