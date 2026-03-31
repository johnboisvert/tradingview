import { useEffect, useState, useCallback, Fragment } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { TrendingUp, TrendingDown, RefreshCw, Filter, BarChart3, Clock, Shield, Target, ChevronDown, ChevronUp, Link2, Zap, Trophy, Info, BookOpen } from "lucide-react";
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
  convergent?: boolean;
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
  tp0: number | null;
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
  rsi1h: number | null;
  hasConvergence: boolean;
  ema8_1h: number | null;
  ema21_1h: number | null;
  ema50_1h: number | null;
  macdHistogram: number | null;
  macdBullishCross: boolean;
  volumeSpikeRatio: number | null;
}

/* ─── Signal Tracking Types ─── */

interface TrackedSignal {
  symbol: string;
  side: "LONG" | "SHORT";
  entry: number;
  tp0: number | null;
  tp1: number;
  tp2: number;
  tp3: number;
  sl: number;
  score: number;
  timestamp: number;
  tp0Hit?: boolean;
  tp1Hit?: boolean;
  tp2Hit?: boolean;
  tp3Hit?: boolean;
  slHit?: boolean;
  resolved?: boolean;
}

interface PerformanceStats {
  total: number;
  tp0Hits: number;
  tp1Hits: number;
  tp2Hits: number;
  tp3Hits: number;
  slHits: number;
  pending: number;
}

const SIGNAL_STORAGE_KEY = "dtrading_tracked_signals";

function loadTrackedSignals(): TrackedSignal[] {
  try {
    const raw = localStorage.getItem(SIGNAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTrackedSignals(signals: TrackedSignal[]) {
  try {
    const trimmed = signals.slice(-200);
    localStorage.setItem(SIGNAL_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silent fail
  }
}

function storeNewSignals(setups: TradeSetup[]) {
  const existing = loadTrackedSignals();
  const existingKeys = new Set(existing.map(s => `${s.symbol}-${s.side}-${s.entry}`));
  const newSignals: TrackedSignal[] = [];

  for (const s of setups) {
    const key = `${s.symbol}-${s.side}-${s.entry}`;
    if (!existingKeys.has(key)) {
      newSignals.push({
        symbol: s.symbol,
        side: s.side,
        entry: s.entry,
        tp0: s.tp0,
        tp1: s.tp1,
        tp2: s.tp2,
        tp3: s.tp3,
        sl: s.stopLoss,
        score: s.confidence,
        timestamp: Date.now(),
      });
    }
  }

  if (newSignals.length > 0) {
    saveTrackedSignals([...existing, ...newSignals]);
  }
}

function updateSignalsWithPrices(currentPrices: Map<string, number>) {
  const signals = loadTrackedSignals();
  let changed = false;

  for (const sig of signals) {
    if (sig.resolved) continue;
    const price = currentPrices.get(sig.symbol);
    if (price == null) continue;

    if (sig.side === "LONG") {
      // Check TPs FIRST (order matters: if TP1 already hit, SL hit later is still a partial win)
      if (sig.tp0 != null && price >= sig.tp0 && !sig.tp0Hit) { sig.tp0Hit = true; changed = true; }
      if (price >= sig.tp1 && !sig.tp1Hit) { sig.tp1Hit = true; changed = true; }
      if (price >= sig.tp2 && !sig.tp2Hit) { sig.tp2Hit = true; changed = true; }
      if (price >= sig.tp3 && !sig.tp3Hit) { sig.tp3Hit = true; sig.resolved = true; changed = true; }
      // SL only resolves if NO TP1+ was hit (partial win protection)
      if (price <= sig.sl && !sig.slHit) {
        sig.slHit = true;
        if (!sig.tp1Hit) { sig.resolved = true; } // Only full loss if TP1 never hit
        changed = true;
      }
    } else {
      if (sig.tp0 != null && price <= sig.tp0 && !sig.tp0Hit) { sig.tp0Hit = true; changed = true; }
      if (price <= sig.tp1 && !sig.tp1Hit) { sig.tp1Hit = true; changed = true; }
      if (price <= sig.tp2 && !sig.tp2Hit) { sig.tp2Hit = true; changed = true; }
      if (price <= sig.tp3 && !sig.tp3Hit) { sig.tp3Hit = true; sig.resolved = true; changed = true; }
      if (price >= sig.sl && !sig.slHit) {
        sig.slHit = true;
        if (!sig.tp1Hit) { sig.resolved = true; }
        changed = true;
      }
    }

    // Auto-expire signals older than 72h (swing trades need more time)
    if (Date.now() - sig.timestamp > 72 * 60 * 60 * 1000 && !sig.resolved) {
      sig.resolved = true;
      changed = true;
    }
  }

  if (changed) saveTrackedSignals(signals);
  return signals;
}

function computePerformanceStats(signals: TrackedSignal[]): PerformanceStats {
  const resolved = signals.filter(s => s.resolved || s.tp0Hit || s.tp1Hit || s.tp2Hit || s.tp3Hit || s.slHit);
  const total = resolved.length;
  if (total === 0) return { total: signals.length, tp0Hits: 0, tp1Hits: 0, tp2Hits: 0, tp3Hits: 0, slHits: 0, pending: signals.length };

  return {
    total: signals.length,
    tp0Hits: resolved.filter(s => s.tp0Hit).length,
    tp1Hits: resolved.filter(s => s.tp1Hit).length,
    tp2Hits: resolved.filter(s => s.tp2Hit).length,
    tp3Hits: resolved.filter(s => s.tp3Hit).length,
    slHits: resolved.filter(s => s.slHit).length,
    pending: signals.filter(s => !s.resolved).length,
  };
}

/* ─── Winrate Estimates (v4 — ATR-based SL + conservative TP) ─── */

function getWinrateEstimate(score: number, tp: "tp0" | "tp1" | "tp2" | "tp3"): number {
  if (score >= 90) {
    if (tp === "tp0") return 85;
    if (tp === "tp1") return 75;
    if (tp === "tp2") return 55;
    return 35;
  }
  if (score >= 80) {
    if (tp === "tp0") return 78;
    if (tp === "tp1") return 68;
    if (tp === "tp2") return 48;
    return 28;
  }
  if (score >= 70) {
    if (tp === "tp0") return 70;
    if (tp === "tp1") return 58;
    if (tp === "tp2") return 38;
    return 22;
  }
  if (tp === "tp0") return 60;
  if (tp === "tp1") return 48;
  if (tp === "tp2") return 28;
  return 15;
}

function WinrateBadge({ score, tp }: { score: number; tp: "tp0" | "tp1" | "tp2" | "tp3" }) {
  const wr = getWinrateEstimate(score, tp);
  const color = wr >= 60 ? "text-emerald-400 bg-emerald-500/10" : wr >= 40 ? "text-amber-400 bg-amber-500/10" : "text-gray-400 bg-gray-500/10";
  return (
    <span className={`text-[8px] px-1 py-0.5 rounded font-semibold ${color}`}>
      WR ~{wr}%
    </span>
  );
}

/* ─── Formatters ─── */

function formatPrice(p: number): string {
  if (p == null || isNaN(p)) return "0.00";
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

/* ─── Binance 1h Klines ─── */

interface BinanceKline {
  open: number;
  high: number;
  low: number;
  close: number;
}

const BINANCE_SYMBOL_MAP: Record<string, string> = {
  IOTA: "IOTA",
};

/* ─── EMA Calculation ─── */

function calcEMA(closes: number[], period: number): number[] {
  if (closes.length < period) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < period - 1; i++) result.push(NaN);
  result.push(ema);
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

/* ─── MACD Calculation ─── */

interface MACDResult {
  macdLine: number;
  signalLine: number;
  histogram: number;
  bullishCross: boolean;
  bearishCross: boolean;
}

function calculateMACD(closes: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): MACDResult | null {
  if (closes.length < slowPeriod + signalPeriod) return null;

  const emaFast = calcEMA(closes, fastPeriod);
  const emaSlow = calcEMA(closes, slowPeriod);

  if (emaFast.length === 0 || emaSlow.length === 0) return null;

  // Calculate MACD line = EMA fast - EMA slow
  const macdValues: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < slowPeriod - 1 || isNaN(emaFast[i]) || isNaN(emaSlow[i])) {
      macdValues.push(NaN);
    } else {
      macdValues.push(emaFast[i] - emaSlow[i]);
    }
  }

  // Calculate signal line = EMA of MACD line
  const validMacd = macdValues.filter(v => !isNaN(v));
  if (validMacd.length < signalPeriod) return null;

  const signalEma = calcEMA(validMacd, signalPeriod);
  if (signalEma.length === 0) return null;

  const currentMacd = validMacd[validMacd.length - 1];
  const prevMacd = validMacd[validMacd.length - 2];
  const currentSignal = signalEma[signalEma.length - 1];
  const prevSignal = signalEma.length >= 2 ? signalEma[signalEma.length - 2] : currentSignal;

  const histogram = currentMacd - currentSignal;
  const bullishCross = prevMacd <= prevSignal && currentMacd > currentSignal;
  const bearishCross = prevMacd >= prevSignal && currentMacd < currentSignal;

  return {
    macdLine: currentMacd,
    signalLine: currentSignal,
    histogram,
    bullishCross,
    bearishCross,
  };
}

/* ─── Volume Spike Detection ─── */

function detectVolumeSpike(volumes: number[], lookback = 20): { isSpike: boolean; ratio: number } {
  if (volumes.length < lookback + 1) return { isSpike: false, ratio: 1 };
  const recentVols = volumes.slice(-lookback, -1);
  const avgVol = recentVols.reduce((a, b) => a + b, 0) / recentVols.length;
  const currentVol = volumes[volumes.length - 1];
  const ratio = avgVol > 0 ? currentVol / avgVol : 1;
  return { isSpike: ratio > 1.5, ratio };
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

/* ─── 1h S/R from Binance pivots ─── */

function calculate1hSRLevels(klines: BinanceKline[], currentPrice: number): { supports: SRLevel[]; resistances: SRLevel[] } {
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
        source: "Binance 1h",
      });
    }
  }

  for (const level of clusteredMaxs) {
    if (level > currentPrice * 1.002) {
      resistances.push({
        price: level,
        type: "resistance",
        strength: Math.abs(level - currentPrice) / currentPrice < 0.025 ? "major" : "minor",
        source: "Binance 1h",
      });
    }
  }

  supports.sort((a, b) => b.price - a.price);
  resistances.sort((a, b) => a.price - b.price);

  return { supports: supports.slice(0, 4), resistances: resistances.slice(0, 4) };
}

/* ─── 7j S/R from CoinGecko sparkline ─── */

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
  levels1h: SRLevel[],
): { merged: SRLevel[]; convergenceCount: number } {
  let convergenceCount = 0;
  const merged: SRLevel[] = [...levels7j];

  for (const l1h of levels1h) {
    const match7j = levels7j.find(
      l7j => Math.abs(l7j.price - l1h.price) / l1h.price < 0.015
    );
    if (match7j) {
      match7j.convergent = true;
      match7j.strength = "major";
      convergenceCount++;
      l1h.convergent = true;
    }
    const tooClose = merged.some(m => Math.abs(m.price - l1h.price) / l1h.price < 0.005);
    if (!tooClose) {
      merged.push(l1h);
    }
  }

  merged.sort((a, b) => {
    if (a.type === "support" && b.type === "support") return b.price - a.price;
    return a.price - b.price;
  });

  return { merged, convergenceCount };
}

/* ─── ATR Calculation from 1h klines ─── */

function calculateATR(klines: BinanceKline[], period = 14): number | null {
  if (klines.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < klines.length; i++) {
    const tr = Math.max(
      klines[i].high - klines[i].low,
      Math.abs(klines[i].high - klines[i - 1].close),
      Math.abs(klines[i].low - klines[i - 1].close)
    );
    trs.push(tr);
  }
  if (trs.length < period) return null;
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
}

/* ─── Align TP levels with S/R — v4: ATR-based SL + conservative TP for swing ─── */

function alignTPWithSR(
  side: "LONG" | "SHORT",
  entry: number,
  slPercent: number,
  supports: SRLevel[],
  resistances: SRLevel[],
  atr1h?: number | null,
): { tp1: number; tp2: number; tp3: number; sl: number } {
  // v4: Use ATR-based SL if available (2x ATR for swing), otherwise use % with wider minimum
  let slDistance: number;
  if (atr1h && atr1h > 0) {
    // 2.5x ATR(14) on 1h = good swing SL distance
    slDistance = atr1h * 2.5;
    // Enforce minimum 4% and maximum 8% for swing
    const minSl = entry * 0.04;
    const maxSl = entry * 0.08;
    slDistance = Math.max(minSl, Math.min(slDistance, maxSl));
  } else {
    // Fallback: wider SL range for swing (4-8%)
    const effectiveSlPercent = Math.max(slPercent, 4.0);
    slDistance = entry * (effectiveSlPercent / 100);
  }

  let tp1: number, tp2: number, tp3: number, sl: number;

  if (side === "LONG") {
    sl = entry - slDistance;
    // Enforce minimum 4% SL distance for swing
    if (Math.abs(entry - sl) / entry < 0.04) sl = entry * 0.96;
    // v4: Conservative TP ratios — TP1 close (0.8:1) for high winrate
    tp1 = entry + slDistance * 0.8;   // 0.8:1 — quick profit, high probability
    tp2 = entry + slDistance * 1.5;   // 1.5:1 — moderate target
    tp3 = entry + slDistance * 2.5;   // 2.5:1 — extended target

    // Snap SL to nearest support if close
    const nearestSupport = supports.find(s => s.price < entry * 0.995);
    if (nearestSupport && nearestSupport.price > sl * 0.95 && nearestSupport.price < entry * 0.98) {
      sl = nearestSupport.price * 0.997;
      if (Math.abs(entry - sl) / entry < 0.04) sl = entry * 0.96;
    }

    // Snap TPs to nearest resistance levels
    const resAbove = resistances.filter(r => r.price > entry * 1.005);
    if (resAbove.length >= 1 && resAbove[0].price > tp1 * 0.90 && resAbove[0].price < tp1 * 1.20) {
      tp1 = resAbove[0].price * 0.998;
    }
    if (resAbove.length >= 2 && resAbove[1].price > tp2 * 0.85 && resAbove[1].price < tp2 * 1.25) {
      tp2 = resAbove[1].price * 0.998;
    }
    if (resAbove.length >= 3 && resAbove[2].price > tp3 * 0.80) {
      tp3 = resAbove[2].price * 0.998;
    }
  } else {
    sl = entry + slDistance;
    if (Math.abs(sl - entry) / entry < 0.04) sl = entry * 1.04;
    tp1 = entry - slDistance * 0.8;
    tp2 = entry - slDistance * 1.5;
    tp3 = entry - slDistance * 2.5;

    const nearestResistance = resistances.find(r => r.price > entry * 1.005);
    if (nearestResistance && nearestResistance.price < sl * 1.05 && nearestResistance.price > entry * 1.02) {
      sl = nearestResistance.price * 1.003;
      if (Math.abs(sl - entry) / entry < 0.04) sl = entry * 1.04;
    }

    const supBelow = supports.filter(s => s.price < entry * 0.995);
    if (supBelow.length >= 1 && supBelow[0].price < tp1 * 1.10 && supBelow[0].price > tp1 * 0.80) {
      tp1 = supBelow[0].price * 1.002;
    }
    if (supBelow.length >= 2 && supBelow[1].price < tp2 * 1.15 && supBelow[1].price > tp2 * 0.80) {
      tp2 = supBelow[1].price * 1.002;
    }
    if (supBelow.length >= 3 && supBelow[2].price < tp3 * 1.20) {
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

/* ─── Compute TP0 (Quick Profit) from 1h S/R ─── */

function computeTP0(
  side: "LONG" | "SHORT",
  entry: number,
  supports1h: SRLevel[],
  resistances1h: SRLevel[],
): number | null {
  if (side === "LONG") {
    const nearest = resistances1h.find(r => r.price > entry * 1.003 && r.price < entry * 1.05);
    return nearest ? roundPrice(nearest.price * 0.999, entry) : null;
  } else {
    const nearest = supports1h.find(s => s.price < entry * 0.997 && s.price > entry * 0.95);
    return nearest ? roundPrice(nearest.price * 1.001, entry) : null;
  }
}

/* ─── Bollinger Bands (period 20, stdDev 2) ─── */

function calculateBollingerBands(closes: number[], period = 20, stdDevMultiplier = 2): { upper: number; middle: number; lower: number } | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, v) => a + (v - mean) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);
  return {
    upper: mean + stdDevMultiplier * stdDev,
    middle: mean,
    lower: mean - stdDevMultiplier * stdDev,
  };
}

/* ─── VWAP ─── */

function calculateVWAP(klines: BinanceKline[], volumes: number[]): number | null {
  if (klines.length === 0 || klines.length !== volumes.length) return null;
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  for (let i = 0; i < klines.length; i++) {
    const typicalPrice = (klines[i].high + klines[i].low + klines[i].close) / 3;
    cumulativeTPV += typicalPrice * volumes[i];
    cumulativeVolume += volumes[i];
  }
  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : null;
}

/* ─── Volume Profile — Point of Control (POC) ─── */

function calculatePOC(klines: BinanceKline[], volumes: number[], bins = 30): number | null {
  if (klines.length === 0 || klines.length !== volumes.length) return null;
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  for (const k of klines) {
    if (k.low < minPrice) minPrice = k.low;
    if (k.high > maxPrice) maxPrice = k.high;
  }
  if (maxPrice <= minPrice) return null;
  const binSize = (maxPrice - minPrice) / bins;
  const volumeProfile = new Array(bins).fill(0);
  for (let i = 0; i < klines.length; i++) {
    const midPrice = (klines[i].high + klines[i].low) / 2;
    const binIdx = Math.min(bins - 1, Math.floor((midPrice - minPrice) / binSize));
    volumeProfile[binIdx] += volumes[i];
  }
  let maxVol = 0;
  let pocBin = 0;
  for (let i = 0; i < bins; i++) {
    if (volumeProfile[i] > maxVol) {
      maxVol = volumeProfile[i];
      pocBin = i;
    }
  }
  return minPrice + (pocBin + 0.5) * binSize;
}

/* ─── Fetch Binance 1h Klines with Volume ─── */

interface BinanceKlineWithVolume extends BinanceKline {
  volume: number;
}

async function fetchBinance1hKlinesWithVolume(symbolUpper: string): Promise<BinanceKlineWithVolume[]> {
  const base = symbolUpper.replace(/USDT$/, "");
  const mapped = BINANCE_SYMBOL_MAP[base] || base;
  const pair = `${mapped}USDT`;
  try {
    const res = await fetch(
      `/api/binance/klines?symbol=${pair}&interval=1h&limit=168`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((k: any[]) => ({
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } catch {
    return [];
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

    // Skip very low volume coins — unreliable signals
    if (volMcapRatio < 0.05) continue;

    const { supports, resistances } = calculate7jSRLevels(c);

    let side: "LONG" | "SHORT";
    let confidence = 0;
    let reason: string;

    // v4: Tighter entry conditions — require stronger momentum + volume
    if (change24h > 4 && change24h < 12 && volMcapRatio > 0.12) {
      side = "LONG";
      confidence = 45;
      if (change24h > 6) confidence += 12; else confidence += 5;
      if (volMcapRatio > 0.25) confidence += 12; else if (volMcapRatio > 0.15) confidence += 8;
      if (change24h > 8) confidence += 8;
      reason = `Momentum haussier (+${change24h.toFixed(1)}%) avec volume élevé (${(volMcapRatio * 100).toFixed(1)}% du MCap)`;
    } else if (change24h < -8 && change24h > -18 && volMcapRatio > 0.10) {
      // Oversold bounce — require deeper drop and more volume
      side = "LONG";
      confidence = 40;
      if (change24h < -14) confidence += 12; else if (change24h < -10) confidence += 8;
      if (volMcapRatio > 0.18) confidence += 8;
      reason = `Survente potentielle (${change24h.toFixed(1)}%) — rebond technique possible`;
    } else if (change24h < -5 && change24h > -20 && volMcapRatio > 0.15) {
      // SHORT — require stronger bearish signal + higher volume
      side = "SHORT";
      confidence = 45;
      if (change24h < -8) confidence += 10; else confidence += 5;
      if (volMcapRatio > 0.25) confidence += 12; else confidence += 6;
      reason = `Tendance baissière (${change24h.toFixed(1)}%) avec volume de distribution (${(volMcapRatio * 100).toFixed(1)}% du MCap)`;
    } else {
      continue;
    }

    const price = c.current_price;
    const nearestSupport = supports[0];
    const nearestResistance = resistances[0];

    if (side === "LONG") {
      if (nearestSupport && Math.abs(price - nearestSupport.price) / price < 0.025) {
        confidence += 8;
        reason += ` | Proche du support ${formatPrice(nearestSupport.price)}`;
      }
    } else {
      if (nearestResistance && Math.abs(price - nearestResistance.price) / price < 0.025) {
        confidence += 8;
        reason += ` | Proche de la résistance ${formatPrice(nearestResistance.price)}`;
      }
    }

    if (supports.length >= 2) confidence += 2;
    if (resistances.length >= 2) confidence += 2;

    preSetups.push({ coin: c, side, confidence, reason, supports7j: supports, resistances7j: resistances });
  }

  return preSetups;
}

async function enrichWithBinance1h(preSetups: PreSetup[]): Promise<TradeSetup[]> {
  const triggerTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const setups: TradeSetup[] = [];

  const BATCH_SIZE = 15;
  const binanceResults: Map<string, BinanceKlineWithVolume[]> = new Map();

  for (let i = 0; i < preSetups.length; i += BATCH_SIZE) {
    const batch = preSetups.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (ps) => {
      const sym = ((ps.coin.symbol || "") as string).toUpperCase();
      if (!binanceResults.has(sym)) {
        const klines = await fetchBinance1hKlinesWithVolume(sym);
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
    const klinesWithVol = binanceResults.get(sym) || [];
    const klines: BinanceKline[] = klinesWithVol;

    // Calculate 1h S/R
    const sr1h = calculate1hSRLevels(klines, price);

    // Calculate RSI 14 on 1h
    const closes = klines.map(k => k.close);
    const rsi1h = calculateRSI(closes);

    // ── EMA Trend Filter — STRICT: require full alignment ──
    const ema8Arr = calcEMA(closes, 8);
    const ema21Arr = calcEMA(closes, 21);
    const ema50Arr = calcEMA(closes, 50);
    const lastEma8 = ema8Arr.length > 0 ? ema8Arr[ema8Arr.length - 1] : NaN;
    const lastEma21 = ema21Arr.length > 0 ? ema21Arr[ema21Arr.length - 1] : NaN;
    const lastEma50 = ema50Arr.length > 0 ? ema50Arr[ema50Arr.length - 1] : NaN;

    if (!isNaN(lastEma8) && !isNaN(lastEma21) && !isNaN(lastEma50)) {
      if (side === "LONG") {
        // Require FULL alignment: price > EMA8 > EMA21 > EMA50
        if (price < lastEma8 || lastEma8 < lastEma21 || lastEma21 < lastEma50) {
          continue;
        }
        confidence += 10;
        reason += ` | EMA 1h: alignement parfait (prix > 8 > 21 > 50)`;
      } else {
        // Require FULL alignment: price < EMA8 < EMA21 < EMA50
        if (price > lastEma8 || lastEma8 > lastEma21 || lastEma21 > lastEma50) {
          continue;
        }
        confidence += 10;
        reason += ` | EMA 1h: alignement parfait (prix < 8 < 21 < 50)`;
      }
    } else if (!isNaN(lastEma8) && !isNaN(lastEma21)) {
      // Fallback: at least EMA8/21 alignment
      if (side === "LONG" && (price < lastEma21 || lastEma8 < lastEma21)) {
        continue;
      }
      if (side === "SHORT" && (price > lastEma21 || lastEma8 > lastEma21)) {
        continue;
      }
      reason += ` | EMA 1h: tendance ${side === "LONG" ? "haussière" : "baissière"} (8 ${side === "LONG" ? ">" : "<"} 21)`;
    }

    // ── MACD Confirmation Filter ──
    const macd = calculateMACD(closes);
    if (macd !== null) {
      if (side === "LONG" && macd.histogram < 0) {
        continue; // MACD bearish — skip LONG
      }
      if (side === "SHORT" && macd.histogram > 0) {
        continue; // MACD bullish — skip SHORT
      }
      // Bonus for fresh crossover
      if (side === "LONG" && macd.bullishCross) {
        confidence += 12;
        reason += ` | MACD 1h: croisement haussier frais`;
      } else if (side === "SHORT" && macd.bearishCross) {
        confidence += 12;
        reason += ` | MACD 1h: croisement baissier frais`;
      } else if (side === "LONG" && macd.histogram > 0) {
        confidence += 5;
        reason += ` | MACD 1h: momentum haussier`;
      } else if (side === "SHORT" && macd.histogram < 0) {
        confidence += 5;
        reason += ` | MACD 1h: momentum baissier`;
      }
    }

    // ── Volume Spike Filter ──
    const volSpike = detectVolumeSpike(klinesWithVol.map(k => k.volume));
    if (volSpike.isSpike) {
      confidence += 8;
      reason += ` | Volume spike 1h (${volSpike.ratio.toFixed(1)}x moyenne)`;
    } else if (volSpike.ratio < 0.7) {
      confidence -= 5; // Low volume = less reliable signal
    }

    // ── Strict RSI Filter ──
    if (rsi1h !== null) {
      if (side === "LONG" && rsi1h > 70) {
        continue;
      }
      if (side === "SHORT" && rsi1h < 30) {
        continue;
      }

      if (side === "LONG" && rsi1h >= 40 && rsi1h <= 55) {
        confidence += 8;
        reason += ` | RSI 1h en zone favorable LONG (${rsi1h})`;
      } else if (side === "SHORT" && rsi1h >= 45 && rsi1h <= 60) {
        confidence += 8;
        reason += ` | RSI 1h en zone favorable SHORT (${rsi1h})`;
      } else if (side === "LONG" && rsi1h < 35) {
        confidence += 12;
        reason += ` | RSI 1h survendu (${rsi1h}) — rebond probable`;
      } else if (side === "SHORT" && rsi1h > 65) {
        confidence += 12;
        reason += ` | RSI 1h suracheté (${rsi1h}) — correction probable`;
      }
    }

    // ── Bollinger Bands on 1h closes ──
    const bb = calculateBollingerBands(closes, 20, 2);
    if (bb) {
      const distToLower = Math.abs(price - bb.lower) / price;
      const distToUpper = Math.abs(price - bb.upper) / price;
      if (side === "LONG" && distToLower < 0.01) {
        confidence += 10;
        reason += ` | BB 1h: prix proche bande basse ($${formatPrice(bb.lower)})`;
      } else if (side === "SHORT" && distToUpper < 0.01) {
        confidence += 10;
        reason += ` | BB 1h: prix proche bande haute ($${formatPrice(bb.upper)})`;
      }
    }

    // ── VWAP on 1h ──
    const volumes = klinesWithVol.map(k => k.volume);
    const vwap = calculateVWAP(klines, volumes);
    if (vwap !== null) {
      if (side === "LONG" && price < vwap) {
        confidence += 8;
        reason += ` | VWAP 1h: prix sous fair value ($${formatPrice(vwap)})`;
      } else if (side === "SHORT" && price > vwap) {
        confidence += 8;
        reason += ` | VWAP 1h: prix au-dessus fair value ($${formatPrice(vwap)})`;
      }
    }

    // ── Volume Profile POC on 1h ──
    const poc = calculatePOC(klines, volumes, 30);
    if (poc !== null) {
      const distToPOC = Math.abs(price - poc) / price;
      if (distToPOC < 0.015) {
        confidence += 5;
        reason += ` | POC 1h: zone haute liquidité ($${formatPrice(poc)})`;
      }
    }

    // Merge 7j + 1h S/R and detect convergence
    const { merged: mergedSupports, convergenceCount: convSup } = markConvergence(
      ps.supports7j.filter(s => s.type === "support"),
      sr1h.supports
    );
    const { merged: mergedResistances, convergenceCount: convRes } = markConvergence(
      ps.resistances7j.filter(r => r.type === "resistance"),
      sr1h.resistances
    );

    const totalConvergence = convSup + convRes;
    const hasConvergence = totalConvergence > 0;

    if (hasConvergence) {
      confidence += 10;
      reason += ` | 🔗 Convergence S/R (${totalConvergence} niveau${totalConvergence > 1 ? "x" : ""})`;
    }

    // ── v4: ATR-based SL (wider for swing), min 4%, max 8% ──
    const atr1h = calculateATR(klines);
    const rawVolatility = Math.abs(c.price_change_percentage_24h || 0);
    const slPercent = Math.max(4.0, Math.min(rawVolatility * 0.7, 8.0));
    const { tp1, tp2, tp3, sl } = alignTPWithSR(side, price, slPercent, mergedSupports, mergedResistances, atr1h);

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

    if (Math.abs(sl - price) / price < 0.035) {
      confidence -= 10;
    }

    const tp0 = computeTP0(side, price, sr1h.supports, sr1h.resistances);

    confidence = Math.min(98, Math.max(25, confidence));

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
      rsi1h,
      hasConvergence,
      ema8_1h: isNaN(lastEma8) ? null : lastEma8,
      ema21_1h: isNaN(lastEma21) ? null : lastEma21,
      ema50_1h: isNaN(lastEma50) ? null : lastEma50,
      macdHistogram: macd?.histogram ?? null,
      macdBullishCross: macd?.bullishCross ?? false,
      volumeSpikeRatio: volSpike.isSpike ? volSpike.ratio : null,
    });
  }

  return setups.sort((a, b) => b.confidence - a.confidence);
}

/* ─── Auto-register calls to backend ─── */

async function registerCallsToBackend(setups: TradeSetup[]) {
  const qualifiedSetups = setups.filter(s => s.confidence >= 50);
  for (const setup of qualifiedSetups) {
    try {
      await fetch("/api/v1/trade-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: setup.symbol,
          side: setup.side,
          entry_price: setup.entry,
          stop_loss: setup.stopLoss,
          tp0: setup.tp0,
          tp1: setup.tp1,
          tp2: setup.tp2,
          tp3: setup.tp3,
          confidence: setup.confidence,
          reason: setup.reason,
          rsi1h: setup.rsi1h,
          has_convergence: setup.hasConvergence,
          rr: setup.rr,
        }),
      });
    } catch {
      // Silently ignore
    }
  }
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
  const [minConfidence, setMinConfidence] = useState(70);
  const [perfStats, setPerfStats] = useState<PerformanceStats>({ total: 0, tp0Hits: 0, tp1Hits: 0, tp2Hits: 0, tp3Hits: 0, slHits: 0, pending: 0 });
  const [resetConfirm, setResetConfirm] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  const handleResetTracking = useCallback(() => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }
    localStorage.removeItem(SIGNAL_STORAGE_KEY);
    localStorage.removeItem("dtrading_algo_version");
    setPerfStats({ total: 0, tp0Hits: 0, tp1Hits: 0, tp2Hits: 0, tp3Hits: 0, slHits: 0, pending: 0 });
    setResetConfirm(false);
  }, [resetConfirm]);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const allData = await fetchTop200(true);
      if (allData.length > 0) {
        const preSetups = detectPreSetups(allData);
        const enriched = await enrichWithBinance1h(preSetups);
        setSetups(enriched);

        storeNewSignals(enriched);

        const priceMap = new Map<string, number>();
        for (const s of enriched) {
          priceMap.set(s.symbol, s.currentPrice);
        }
        const updatedSignals = updateSignalsWithPrices(priceMap);
        setPerfStats(computePerformanceStats(updatedSignals));

        registerCallsToBackend(enriched).catch(() => {});
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    }
  }, []);

  useEffect(() => {
    // Clear old tracking data from previous algorithm version
    const ALGO_VERSION_KEY = "dtrading_algo_version";
    const CURRENT_VERSION = "v4_atr_swing";
    if (localStorage.getItem(ALGO_VERSION_KEY) !== CURRENT_VERSION) {
      localStorage.removeItem(SIGNAL_STORAGE_KEY);
      localStorage.setItem(ALGO_VERSION_KEY, CURRENT_VERSION);
    }

    const signals = loadTrackedSignals();
    setPerfStats(computePerformanceStats(signals));

    fetchTrades();
    const interval = setInterval(fetchTrades, 90000);
    return () => clearInterval(interval);
  }, [fetchTrades]);

  const confFiltered = setups.filter(t => t.confidence >= minConfidence);

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

  const resolvedTotal = perfStats.tp0Hits + perfStats.tp1Hits + perfStats.tp2Hits + perfStats.tp3Hits + perfStats.slHits;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
        <PageHeader
          icon={<BarChart3 className="w-6 h-6" />}
          title="Suggestions de Swing Trading v6"
          subtitle="RSI/EMA 4H + Filtre Daily + ATR SL (6-12%) — TP1: 1.2:1 • TP2: 2.5:1 • TP3: 4:1 — Envoi Telegram auto ≥ 80%"
          accentColor="blue"
          steps={[
            { n: "1", title: "Pré-filtre CoinGecko", desc: "Top 200 cryptos analysées. Momentum (+4/+12%), survente (-8/-18%), ou distribution (-5/-20%) avec volume suffisant." },
            { n: "2", title: "Confirmation Binance 4H", desc: "RSI(4H) + EMA 8/20(4H) + Volume spike. Rejet strict si indicateurs en conflit avec la direction." },
            { n: "3", title: "Filtre Daily + Risk", desc: "Blocage dur contre-tendance Daily. SL: 6-12% (ATR). TP1: 1.2:1 • TP2: 2.5:1 • TP3: 4:1. Cooldown 12h." },
          ]}
        />

        {/* Methodology Explanation Section — Collapsible */}
        <div className="mb-6">
          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-indigo-500/[0.06] via-blue-500/[0.06] to-cyan-500/[0.06] border border-indigo-500/15 hover:border-indigo-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-indigo-300">Comment sont générés nos signaux de Swing Trading ?</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Processus en 3 phases • Filtres techniques multi-timeframes • Gestion du risque automatisée</p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center transition-transform duration-300 ${showMethodology ? "rotate-180" : ""}`}>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </button>

          {showMethodology && (
            <div className="mt-3 rounded-2xl bg-[#0D1225] border border-indigo-500/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Phase 1 */}
              <div className="p-5 border-b border-white/[0.04]">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-xs font-black text-blue-400">1</span>
                  <h4 className="text-sm font-bold text-blue-300">Pré-filtrage CoinGecko — Sélection des candidats</h4>
                </div>
                <div className="ml-10 space-y-2 text-xs text-gray-400 leading-relaxed">
                  <p>
                    L'algorithme analyse les <span className="text-white font-semibold">Top 200 cryptos par capitalisation</span> via l'API CoinGecko toutes les 90 secondes.
                    Seules les cryptos présentant un <span className="text-blue-300 font-semibold">momentum significatif</span> et un <span className="text-blue-300 font-semibold">volume suffisant</span> passent cette première étape :
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">🟢 LONG — Momentum</p>
                      <p className="text-[11px] text-gray-400">Variation 24h entre <span className="text-white font-mono">+4%</span> et <span className="text-white font-mono">+12%</span> avec ratio Volume/MCap &gt; 12%</p>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">🟢 LONG — Rebond</p>
                      <p className="text-[11px] text-gray-400">Survente entre <span className="text-white font-mono">-8%</span> et <span className="text-white font-mono">-18%</span> avec ratio Volume/MCap &gt; 10%</p>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                      <p className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-1">🔴 SHORT — Distribution</p>
                      <p className="text-[11px] text-gray-400">Baisse entre <span className="text-white font-mono">-5%</span> et <span className="text-white font-mono">-20%</span> avec ratio Volume/MCap &gt; 15%</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Les niveaux de Support/Résistance sont calculés à partir du sparkline 7 jours (pivots locaux clusterisés) + High/Low 24h + ATH.
                  </p>
                </div>
              </div>

              {/* Phase 2 */}
              <div className="p-5 border-b border-white/[0.04]">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-xs font-black text-purple-400">2</span>
                  <h4 className="text-sm font-bold text-purple-300">Confirmation Binance 4H — Filtres techniques stricts</h4>
                </div>
                <div className="ml-10 space-y-2 text-xs text-gray-400 leading-relaxed">
                  <p>
                    Chaque candidat est ensuite validé via les <span className="text-white font-semibold">klines 4H de Binance</span>.
                    Un signal doit passer <span className="text-purple-300 font-semibold">tous les filtres</span> suivants pour être retenu (un seul échec = rejet) :
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                      <p className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold mb-1">📈 RSI (4H)</p>
                      <p className="text-[11px] text-gray-400">
                        LONG rejeté si RSI &gt; 65 (suracheté) • SHORT rejeté si RSI &lt; 35 (survendu).
                        Zone favorable LONG : 35-55 • Zone favorable SHORT : 45-65.
                      </p>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                      <p className="text-[10px] uppercase tracking-wider text-orange-400 font-semibold mb-1">📊 EMA 8/20 (4H)</p>
                      <p className="text-[11px] text-gray-400">
                        LONG : prix doit être au-dessus de EMA8 ET EMA8 &gt; EMA20.
                        SHORT : prix sous EMA8 ET EMA8 &lt; EMA20. Rejet si conflit.
                      </p>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                      <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-1">⚡ Volume (4H)</p>
                      <p className="text-[11px] text-gray-400">
                        Volume spike (&gt;1.5x moyenne) = bonus de confiance +8%.
                        Volume faible (&lt;0.7x) = pénalité -5%. Confirme la conviction du mouvement.
                      </p>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                      <p className="text-[10px] uppercase tracking-wider text-pink-400 font-semibold mb-1">🔗 Convergence S/R</p>
                      <p className="text-[11px] text-gray-400">
                        Les niveaux S/R du sparkline 7j sont croisés avec les pivots 1H Binance.
                        Convergence détectée = +10% confiance. Renforce la fiabilité des niveaux.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 3 */}
              <div className="p-5 border-b border-white/[0.04]">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-xs font-black text-amber-400">3</span>
                  <h4 className="text-sm font-bold text-amber-300">Filtre Daily — Blocage des contre-tendances</h4>
                </div>
                <div className="ml-10 space-y-2 text-xs text-gray-400 leading-relaxed">
                  <p>
                    Dernière barrière avant l'envoi sur Telegram : le <span className="text-white font-semibold">filtre de tendance Daily</span> (serveur uniquement).
                    C'est un <span className="text-red-400 font-semibold">blocage dur</span> — aucun signal ne peut passer s'il va contre la tendance journalière :
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div className="bg-red-500/[0.04] rounded-lg p-3 border border-red-500/10">
                      <p className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-1">🚫 BLOQUÉ</p>
                      <p className="text-[11px] text-gray-400">
                        LONG bloqué si tendance Daily baissière • SHORT bloqué si tendance Daily haussière.
                        Aucune exception — protège contre les faux signaux.
                      </p>
                    </div>
                    <div className="bg-emerald-500/[0.04] rounded-lg p-3 border border-emerald-500/10">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">✅ ALIGNÉ</p>
                      <p className="text-[11px] text-gray-400">
                        Signal aligné avec la tendance Daily = bonus de confiance +8%.
                        Seuls les trades dans le sens du marché sont envoyés.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Management */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-xs font-black text-emerald-400">⚙</span>
                  <h4 className="text-sm font-bold text-emerald-300">Gestion du Risque & Envoi Telegram</h4>
                </div>
                <div className="ml-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                      <p className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-1">🛡️ Stop-Loss (ATR)</p>
                      <p className="text-[11px] text-gray-400">
                        SL basé sur la volatilité réelle : <span className="text-white font-mono">6% — 12%</span> du prix d'entrée.
                        Calculé via ATR 1h × 2.5, avec minimum 6% et maximum 12% pour les swing trades.
                      </p>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">🎯 Take-Profit</p>
                      <p className="text-[11px] text-gray-400">
                        <span className="text-amber-400 font-mono">TP1: 1.2:1</span> (profit rapide) •
                        <span className="text-emerald-300 font-mono"> TP2: 2.5:1</span> (modéré) •
                        <span className="text-emerald-400 font-mono"> TP3: 4:1</span> (étendu).
                        Alignés sur les niveaux S/R quand possible.
                      </p>
                    </div>
                    <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
                      <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold mb-1">📡 Envoi Telegram</p>
                      <p className="text-[11px] text-gray-400">
                        Confiance minimum : <span className="text-white font-mono">≥ 80%</span> pour être envoyé.
                        Cooldown : <span className="text-white font-mono">12h</span> par crypto+direction.
                        Maximum : <span className="text-white font-mono">10 trades actifs</span> simultanément.
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
                    💡 <strong className="text-gray-400">Note :</strong> Cette page affiche tous les setups détectés (y compris ceux sous 80% de confiance).
                    Seuls les signaux avec un score ≥ 80% et validés par le filtre Daily sont automatiquement envoyés sur Telegram.
                    Le cooldown de 12h empêche le renvoi du même signal. Les signaux expirent après 72h.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={TRADES_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/80 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                📊 Swing Trading v6 — Filtres Pro
              </h1>
              <p className="text-sm text-gray-400 mt-1">RSI/EMA 4H + Daily filter + ATR SL (6-12%) + TP 1.2:1 / 2.5:1 / 4:1</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">MAJ: {lastUpdate}</span>
              <Link
                to="/trades/performance"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/20 text-sm font-semibold text-amber-400 transition-all"
              >
                <Trophy className="w-4 h-4" /> Performance
              </Link>
              <button onClick={fetchTrades}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Rafraîchir
              </button>
            </div>
          </div>
        </div>

        {/* Timeframe Info Section */}
        <div className="mb-6 bg-blue-500/[0.06] border border-blue-500/15 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 font-semibold">📊 Filtres</span>
                <span className="text-gray-400">RSI(4H) + EMA 8/20(4H) + Volume 4H + Filtre Daily (blocage dur)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold">🛡️ Risk</span>
                <span className="text-gray-400">SL: 6-12% (ATR) • Cooldown 12h • Max 10 trades actifs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold">🎯 TP</span>
                <span className="text-gray-400">TP1: 1.2:1 • TP2: 2.5:1 • TP3: 4:1 • Envoi Telegram auto ≥ 80% • Expiration 72h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Tracking Section */}
        {perfStats.total > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/[0.04] to-orange-500/[0.04] border border-amber-500/15 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-amber-400">Suivi des Signaux v6 (localStorage)</h3>
              <span className="text-[10px] text-gray-500 ml-2">{perfStats.total} signaux suivis • {perfStats.pending} en cours</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleResetTracking(); }}
                className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  resetConfirm
                    ? "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                    : "bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <RefreshCw className="w-3 h-3" />
                {resetConfirm ? "Confirmer la réinitialisation ?" : "Réinitialiser"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total</p>
                <p className="text-lg font-black text-white">{perfStats.total}</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] text-center">
                <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">TP0 Hit</p>
                <p className="text-lg font-black text-amber-400">{perfStats.tp0Hits}</p>
                <p className="text-[9px] text-gray-500">{resolvedTotal > 0 ? `${Math.round(perfStats.tp0Hits / resolvedTotal * 100)}%` : "—"}</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] text-center">
                <p className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">TP1 Hit</p>
                <p className="text-lg font-black text-emerald-300">{perfStats.tp1Hits}</p>
                <p className="text-[9px] text-gray-500">{resolvedTotal > 0 ? `${Math.round(perfStats.tp1Hits / resolvedTotal * 100)}%` : "—"}</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] text-center">
                <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">TP2 Hit</p>
                <p className="text-lg font-black text-emerald-400">{perfStats.tp2Hits}</p>
                <p className="text-[9px] text-gray-500">{resolvedTotal > 0 ? `${Math.round(perfStats.tp2Hits / resolvedTotal * 100)}%` : "—"}</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] text-center">
                <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold">TP3 Hit</p>
                <p className="text-lg font-black text-emerald-500">{perfStats.tp3Hits}</p>
                <p className="text-[9px] text-gray-500">{resolvedTotal > 0 ? `${Math.round(perfStats.tp3Hits / resolvedTotal * 100)}%` : "—"}</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] text-center">
                <p className="text-[10px] uppercase tracking-wider text-red-400 font-semibold">SL Hit</p>
                <p className="text-lg font-black text-red-400">{perfStats.slHits}</p>
                <p className="text-[9px] text-gray-500">{resolvedTotal > 0 ? `${Math.round(perfStats.slHits / resolvedTotal * 100)}%` : "—"}</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] text-center">
                <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold">En Cours</p>
                <p className="text-lg font-black text-blue-400">{perfStats.pending}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[
            { icon: "📈", label: "Total Setups", value: String(setups.length), change: "Détectés" },
            { icon: "🟢", label: "LONG", value: String(longCount), change: "Haussiers" },
            { icon: "🔴", label: "SHORT", value: String(shortCount), change: "Baissiers" },
            { icon: "🎯", label: "Score Tech. Moy.", value: `${avgConfidence}%`, change: "Score moyen" },
            { icon: "⭐", label: "Haut Score", value: String(highConfCount), change: "≥ 70%" },
            { icon: "🔗", label: "Convergence", value: String(convergenceCount), change: "S/R 1h ≈ 7j" },
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

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={minConfidence}
              onChange={e => setMinConfidence(Number(e.target.value))}
              className="px-2 py-1.5 rounded-lg bg-black/30 border border-white/[0.08] text-xs text-white"
            >
              <option value={30}>≥ 30%</option>
              <option value={50}>≥ 50%</option>
              <option value={70}>≥ 70%</option>
              <option value={75}>≥ 75%</option>
              <option value={80}>≥ 80%</option>
              <option value={85}>≥ 85%</option>
              <option value={88}>≥ 88%</option>
              <option value={90}>≥ 90%</option>
              <option value={95}>≥ 95%</option>
            </select>
          </div>

          <span className="text-xs text-gray-500 ml-auto">({filtered.length} résultats)</span>
        </div>

        {/* Trades Table */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">Setups Détectés v6</h2>
            <span className="text-xs text-gray-500 ml-2">RSI/EMA 4H + Daily filter + ATR SL • Cliquez pour les détails</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Heure", "Symbole", "Type", "Entry", "SL", "TP0", "TP1", "TP2", "TP3", "R:R", "24h", "Score Tech.", ""].map((h) => (
                    <th key={h} className={`px-3 py-3 text-left text-[10px] uppercase tracking-wider font-semibold ${h === "TP0" ? "text-amber-400" : "text-gray-500"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={13} className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Analyse EMA + MACD + RSI + Volume en cours...</p>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={13} className="text-center py-12 text-gray-500">
                    {`Aucun setup avec score technique ≥ ${minConfidence}%. Essayez de baisser le filtre de confiance.`}
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
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span className="text-[11px] font-mono text-gray-400">{trade.triggerTime}</span>
                            </div>
                          </td>
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
                                  {trade.macdBullishCross && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-semibold">
                                      🔥 MACD
                                    </span>
                                  )}
                                  {trade.volumeSpikeRatio !== null && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20 font-semibold">
                                      ⚡ Vol
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-500">{trade.name}</span>
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
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1 inline-block">
                              <span className="font-mono text-sm font-bold text-blue-300">${formatPrice(trade.entry)}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-red-400" />
                              <span className="font-mono text-xs text-red-400 font-semibold">${formatPrice(trade.stopLoss)}</span>
                            </div>
                            <span className="text-[9px] text-red-400/60">
                              {trade.side === "LONG" ? "-" : "+"}{trade.entry ? Math.abs((trade.stopLoss - trade.entry) / trade.entry * 100).toFixed(1) : "0.0"}%
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {trade.tp0 !== null ? (
                              <div>
                                <div className="flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-amber-400" />
                                  <span className="font-mono text-xs text-amber-400 font-semibold">${formatPrice(trade.tp0)}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[9px] text-amber-400/60">
                                    {trade.side === "LONG" ? "+" : "-"}{trade.entry ? Math.abs((trade.tp0 - trade.entry) / trade.entry * 100).toFixed(1) : "0.0"}%
                                  </span>
                                  <WinrateBadge score={trade.confidence} tp="tp0" />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-emerald-300" />
                              <span className="font-mono text-xs text-emerald-300 font-semibold">${formatPrice(trade.tp1)}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] text-emerald-300/60">
                                {trade.side === "LONG" ? "+" : "-"}{trade.entry ? Math.abs((trade.tp1 - trade.entry) / trade.entry * 100).toFixed(1) : "0.0"}%
                              </span>
                              <WinrateBadge score={trade.confidence} tp="tp1" />
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-emerald-400" />
                              <span className="font-mono text-xs text-emerald-400 font-semibold">${formatPrice(trade.tp2)}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] text-emerald-400/60">
                                {trade.side === "LONG" ? "+" : "-"}{trade.entry ? Math.abs((trade.tp2 - trade.entry) / trade.entry * 100).toFixed(1) : "0.0"}%
                              </span>
                              <WinrateBadge score={trade.confidence} tp="tp2" />
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-emerald-500" />
                              <span className="font-mono text-xs text-emerald-500 font-semibold">${formatPrice(trade.tp3)}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] text-emerald-500/60">
                                {trade.side === "LONG" ? "+" : "-"}{trade.entry ? Math.abs((trade.tp3 - trade.entry) / trade.entry * 100).toFixed(1) : "0.0"}%
                              </span>
                              <WinrateBadge score={trade.confidence} tp="tp3" />
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400">
                              {trade.rr}:1
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`text-sm font-bold ${trade.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {trade.change24h >= 0 ? "+" : ""}{(trade.change24h ?? 0).toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-12 bg-white/[0.06] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{
                                  width: `${trade.confidence}%`,
                                  background: trade.confidence >= 90 ? "#22c55e" : trade.confidence >= 70 ? "#f59e0b" : "#6b7280",
                                }} />
                              </div>
                              <span className="text-xs font-bold text-gray-400">{trade.confidence}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="border-b border-white/[0.03]">
                            <td colSpan={13} className="px-4 py-4 bg-white/[0.01]">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">📋 Raison du Signal</p>
                                  <p className="text-xs text-gray-300 leading-relaxed">{trade.reason}</p>
                                </div>

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

                                {/* RSI + EMA + MACD + Volume Section */}
                                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                                  <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold mb-2">📉 Indicateurs 1h</p>
                                  {trade.rsi1h !== null ? (
                                    <div>
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-2xl font-black ${rsiBadge(trade.rsi1h).color}`}>{trade.rsi1h}</span>
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${rsiBadge(trade.rsi1h).bg} ${rsiBadge(trade.rsi1h).color}`}>
                                          RSI {trade.rsi1h < 30 ? "Survendu" : trade.rsi1h > 70 ? "Suracheté" : trade.rsi1h <= 60 && trade.rsi1h >= 40 ? "Neutre" : trade.rsi1h < 40 ? "Faible" : "Fort"}
                                        </span>
                                      </div>
                                      <div className="relative h-2 bg-gradient-to-r from-emerald-500 via-gray-500 to-red-500 rounded-full overflow-hidden">
                                        <div
                                          className="absolute top-0 w-1.5 h-full bg-white rounded-full shadow-lg"
                                          style={{ left: `${Math.min(100, Math.max(0, trade.rsi1h))}%`, transform: "translateX(-50%)" }}
                                        />
                                      </div>
                                      <div className="flex justify-between text-[8px] text-gray-600 mt-1">
                                        <span>0</span><span>30</span><span>50</span><span>70</span><span>100</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500">RSI non disponible</p>
                                  )}

                                  {/* EMA Info */}
                                  <div className="mt-3 border-t border-white/[0.06] pt-2">
                                    <p className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold mb-1">📈 EMA 1h</p>
                                    <div className="space-y-1">
                                      {trade.ema8_1h !== null && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] text-gray-400">EMA 8</span>
                                          <span className="text-[10px] font-mono text-cyan-400">${formatPrice(trade.ema8_1h)}</span>
                                        </div>
                                      )}
                                      {trade.ema21_1h !== null && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] text-gray-400">EMA 21</span>
                                          <span className="text-[10px] font-mono text-orange-400">${formatPrice(trade.ema21_1h)}</span>
                                        </div>
                                      )}
                                      {trade.ema50_1h !== null && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] text-gray-400">EMA 50</span>
                                          <span className="text-[10px] font-mono text-purple-400">${formatPrice(trade.ema50_1h)}</span>
                                        </div>
                                      )}
                                      {trade.ema8_1h !== null && trade.ema21_1h !== null && (
                                        <div className="flex items-center justify-between mt-1">
                                          <span className="text-[10px] text-gray-400">Alignement</span>
                                          <span className={`text-[10px] font-bold ${trade.ema8_1h > trade.ema21_1h ? "text-emerald-400" : "text-red-400"}`}>
                                            {trade.ema8_1h > trade.ema21_1h ? "✅ Parfait ↑" : "✅ Parfait ↓"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* MACD Info */}
                                  <div className="mt-2 border-t border-white/[0.06] pt-2">
                                    <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-1">📊 MACD</p>
                                    {trade.macdHistogram !== null ? (
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] text-gray-400">Histogramme</span>
                                          <span className={`text-[10px] font-mono font-bold ${trade.macdHistogram > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                            {trade.macdHistogram > 0 ? "▲" : "▼"} {trade.macdHistogram.toFixed(4)}
                                            {trade.macdBullishCross && " 🔥"}
                                          </span>
                                        </div>
                                        {trade.macdBullishCross && (
                                          <p className="text-[9px] text-emerald-400/80">Croisement haussier frais détecté</p>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-gray-500">Non disponible</p>
                                    )}
                                  </div>

                                  {/* Volume Spike Info */}
                                  {trade.volumeSpikeRatio !== null && (
                                    <div className="mt-2 border-t border-white/[0.06] pt-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-gray-400">Volume Spike</span>
                                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                                          ⚡ {trade.volumeSpikeRatio.toFixed(1)}x moyenne
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Winrate Estimates Detail */}
                              <div className="mt-3 bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">📈 Estimation Winrate v4 (Score Tech. {trade.confidence}%)</p>
                                <div className="flex items-center gap-3 flex-wrap text-[10px]">
                                  {trade.tp0 !== null && (
                                    <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-400/20 text-amber-400 font-mono">
                                      TP0: WR ~{getWinrateEstimate(trade.confidence, "tp0")}%
                                    </span>
                                  )}
                                  <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 font-mono">
                                    TP1 (0.8:1): WR ~{getWinrateEstimate(trade.confidence, "tp1")}%
                                  </span>
                                  <span className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-400/25 text-emerald-400 font-mono">
                                    TP2 (1.5:1): WR ~{getWinrateEstimate(trade.confidence, "tp2")}%
                                  </span>
                                  <span className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 font-mono">
                                    TP3 (2.5:1): WR ~{getWinrateEstimate(trade.confidence, "tp3")}%
                                  </span>
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
                                    TP1: ${formatPrice(trade.tp1)} (0.8:1)
                                  </span>
                                  <span className="text-gray-600">→</span>
                                  <span className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-400/25 text-emerald-400 font-mono">
                                    TP2: ${formatPrice(trade.tp2)} (1.5:1)
                                  </span>
                                  <span className="text-gray-600">→</span>
                                  <span className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 font-mono font-bold">
                                    TP3: ${formatPrice(trade.tp3)} (2.5:1)
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
            ⚠️ <strong>Avertissement :</strong> Algorithme v6 — Filtres RSI/EMA sur 4H (Binance) + blocage dur contre-tendance Daily + SL ATR 6-12%.
            TP1: 1.2:1 • TP2: 2.5:1 • TP3: 4:1. Cooldown 12h par crypto. Max 10 trades actifs. Envoi Telegram auto ≥ 80%.
            Ces suggestions ne constituent pas des conseils financiers. Faites toujours votre propre analyse avant de trader.
          </p>
        </div>
        <Footer />
      </main>
    </div>
  );
}