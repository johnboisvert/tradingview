import { useEffect, useState, useCallback, Fragment } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import {
  TrendingUp, TrendingDown, RefreshCw, Filter, BarChart3,
  Shield, Target, ChevronDown, ChevronUp, Zap, Trophy,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

/* ─── Types ─── */

interface SRLevel {
  price: number;
  type: "support" | "resistance";
  strength: "major" | "minor";
  source: string;
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
  /* New indicator values */
  ema8_m5: number | null;
  ema20_m5: number | null;
  ema8_h1: number | null;
  ema20_h1: number | null;
  vwap_h1: number | null;
  vwap_m5: number | null;
  stoch_k: number | null;
  stoch_d: number | null;
  h1Bias: "bullish" | "bearish" | "neutral";
  source?: "client" | "server";
}

/* ─── Server-side scalp call type ─── */

interface ServerScalpCall {
  id: number;
  symbol: string;
  side: "LONG" | "SHORT";
  entry_price: number;
  stop_loss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  confidence: number;
  reason: string;
  stoch_rsi_k: number | null;
  stoch_rsi_d: number | null;
  macd_signal: string;
  h1_macd_signal: string;
  h1_trend: string;
  rr: number;
  status: string;
  created_at: string;
  expires_at: string;
}

function serverCallToSetup(call: ServerScalpCall): ScalpSetup {
  const createdAt = new Date(call.created_at);
  const triggerTime = createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const name = call.symbol.replace(/USDT$/, "");
  return {
    id: `server-${call.id}`,
    symbol: call.symbol,
    name,
    image: "",
    side: call.side,
    currentPrice: call.entry_price,
    entry: call.entry_price,
    stopLoss: call.stop_loss,
    tp1: call.tp1,
    tp2: call.tp2,
    tp3: call.tp3,
    rr: call.rr || 1.5,
    change24h: 0,
    volume: 0,
    marketCap: 0,
    confidence: call.confidence,
    reason: call.reason || "",
    triggerTime,
    supports: [],
    resistances: [],
    ema8_m5: null,
    ema20_m5: null,
    ema8_h1: null,
    ema20_h1: null,
    vwap_h1: null,
    vwap_m5: null,
    stoch_k: call.stoch_rsi_k,
    stoch_d: call.stoch_rsi_d,
    h1Bias: (call.h1_trend as "bullish" | "bearish" | "neutral") || "neutral",
    source: "server",
  };
}

async function fetchServerScalpCalls(): Promise<ScalpSetup[]> {
  try {
    const res = await fetch("/api/v1/scalp-calls?status=active&limit=50", { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data: ServerScalpCall[] = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(serverCallToSetup);
  } catch {
    return [];
  }
}

function mergeSetups(clientSetups: ScalpSetup[], serverSetups: ScalpSetup[]): ScalpSetup[] {
  const tagged = clientSetups.map(s => ({ ...s, source: "client" as const }));
  const merged = [...tagged];
  for (const ss of serverSetups) {
    if (!tagged.some(cs => cs.symbol === ss.symbol && cs.side === ss.side)) {
      merged.push(ss);
    }
  }
  return merged.sort((a, b) => b.confidence - a.confidence);
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

/* ─── Binance Klines with Volume ─── */

interface KlineWithVol {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function fetchKlines(symbolUpper: string, interval: string, limit: number): Promise<KlineWithVol[]> {
  const base = symbolUpper.replace(/USDT$/, "");
  const pair = `${base}USDT`;
  try {
    const res = await fetch(`/api/binance/klines?symbol=${pair}&interval=${interval}&limit=${limit}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((k: number[]) => ({
      open: parseFloat(String(k[1])),
      high: parseFloat(String(k[2])),
      low: parseFloat(String(k[3])),
      close: parseFloat(String(k[4])),
      volume: parseFloat(String(k[5])),
    }));
  } catch {
    return [];
  }
}

/* ═══════════════════════════════════════════════════════════════
   INDICATOR CALCULATIONS — "Suivi de Flux" Strategy
   EMA 8 + EMA 20 + VWAP + Stochastique (9, 3, 1)
   ═══════════════════════════════════════════════════════════════ */

/** EMA series — returns array of EMA values (same length as input, first `period-1` are SMA-seeded) */
function calcEMASeries(closes: number[], period: number): number[] {
  if (closes.length < period) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  // Fill first period-1 entries with NaN (not enough data)
  for (let i = 0; i < period - 1; i++) result.push(NaN);
  result.push(ema);
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

/** VWAP from klines with volume */
function calcVWAP(klines: KlineWithVol[]): number | null {
  if (klines.length === 0) return null;
  let cumTPV = 0;
  let cumVol = 0;
  for (const c of klines) {
    const tp = (c.high + c.low + c.close) / 3;
    cumTPV += tp * c.volume;
    cumVol += c.volume;
  }
  return cumVol > 0 ? cumTPV / cumVol : null;
}

/** Stochastic Oscillator (kPeriod, dPeriod, kSmoothing)
 *  Standard: %K = (close - LL) / (HH - LL) * 100, smoothed by kSmoothing=1 (raw), %D = SMA(%K, dPeriod)
 *  Parameters: (9, 3, 1) — period 9, %D smoothing 3, %K smoothing 1 (raw)
 *  Returns arrays of K and D values
 */
function calcStochastic(klines: KlineWithVol[], kPeriod = 9, dPeriod = 3, _kSmooth = 1): { kArr: number[]; dArr: number[] } {
  if (klines.length < kPeriod) return { kArr: [], dArr: [] };

  const rawK: number[] = [];
  for (let i = kPeriod - 1; i < klines.length; i++) {
    const window = klines.slice(i - kPeriod + 1, i + 1);
    const lowestLow = Math.min(...window.map(c => c.low));
    const highestHigh = Math.max(...window.map(c => c.high));
    const close = klines[i].close;
    const k = highestHigh === lowestLow ? 50 : ((close - lowestLow) / (highestHigh - lowestLow)) * 100;
    rawK.push(k);
  }

  // %K smoothing = 1 means raw (no smoothing)
  const kArr = rawK;

  // %D = SMA of %K over dPeriod
  const dArr: number[] = [];
  for (let i = dPeriod - 1; i < kArr.length; i++) {
    const sum = kArr.slice(i - dPeriod + 1, i + 1).reduce((a, b) => a + b, 0);
    dArr.push(sum / dPeriod);
  }

  return { kArr, dArr };
}

/* ─── M5 S/R from pivots ─── */

function calculateM5SR(klines: KlineWithVol[], currentPrice: number): { supports: SRLevel[]; resistances: SRLevel[] } {
  const supports: SRLevel[] = [];
  const resistances: SRLevel[] = [];
  if (klines.length < 10) return { supports, resistances };

  const w = 3;
  const localMins: number[] = [];
  const localMaxs: number[] = [];

  for (let i = w; i < klines.length - w; i++) {
    let isMin = true;
    let isMax = true;
    for (let j = i - w; j <= i + w; j++) {
      if (j === i) continue;
      if (klines[j].low <= klines[i].low) isMin = false;
      if (klines[j].high >= klines[i].high) isMax = false;
    }
    if (isMin) localMins.push(klines[i].low);
    if (isMax) localMaxs.push(klines[i].high);
  }

  const cluster = (levels: number[]): number[] => {
    if (levels.length === 0) return [];
    const sorted = [...levels].sort((a, b) => a - b);
    const clusters: number[][] = [[sorted[0]]];
    for (let i = 1; i < sorted.length; i++) {
      const last = clusters[clusters.length - 1];
      const avg = last.reduce((s, v) => s + v, 0) / last.length;
      if (Math.abs(sorted[i] - avg) / avg < 0.005) last.push(sorted[i]);
      else clusters.push([sorted[i]]);
    }
    return clusters.map(c => c.reduce((s, v) => s + v, 0) / c.length);
  };

  for (const level of cluster(localMins)) {
    if (level < currentPrice * 0.999) {
      supports.push({ price: level, type: "support", strength: Math.abs(level - currentPrice) / currentPrice < 0.01 ? "major" : "minor", source: "M5" });
    }
  }
  for (const level of cluster(localMaxs)) {
    if (level > currentPrice * 1.001) {
      resistances.push({ price: level, type: "resistance", strength: Math.abs(level - currentPrice) / currentPrice < 0.01 ? "major" : "minor", source: "M5" });
    }
  }

  supports.sort((a, b) => b.price - a.price);
  resistances.sort((a, b) => a.price - b.price);
  return { supports: supports.slice(0, 4), resistances: resistances.slice(0, 4) };
}

/* ═══════════════════════════════════════════════════════════════
   GENERATE SCALP SETUPS — "Suivi de Flux" Strategy
   ═══════════════════════════════════════════════════════════════ */

async function generateScalpSetups(coins: any[]): Promise<ScalpSetup[]> {
  const triggerTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const setups: ScalpSetup[] = [];

  const candidates = coins.filter(c => {
    if (!c || !c.current_price || !c.market_cap) return false;
    const vol = c.total_volume || 0;
    const mcap = c.market_cap || 1;
    return vol / mcap > 0.05 && mcap > 50_000_000;
  });

  const sorted = [...candidates].sort((a, b) => {
    const rA = (a.total_volume || 0) / (a.market_cap || 1);
    const rB = (b.total_volume || 0) / (b.market_cap || 1);
    return rB - rA;
  }).slice(0, 30);

  /* Fetch H1 and M5 klines in batches */
  const BATCH = 10;
  const h1Map = new Map<string, KlineWithVol[]>();
  const m5Map = new Map<string, KlineWithVol[]>();

  for (let i = 0; i < sorted.length; i += BATCH) {
    const batch = sorted.slice(i, i + BATCH);
    await Promise.all(batch.flatMap(c => {
      const sym = ((c.symbol || "") as string).toUpperCase();
      return [
        fetchKlines(sym, "1h", 100).then(d => h1Map.set(sym, d)),
        fetchKlines(sym, "5m", 100).then(d => m5Map.set(sym, d)),
      ];
    }));
    if (i + BATCH < sorted.length) await new Promise(r => setTimeout(r, 300));
  }

  for (const c of sorted) {
    const sym = ((c.symbol || "") as string).toUpperCase();
    const price = c.current_price;
    const change24h = c.price_change_percentage_24h || 0;
    const volume = c.total_volume || 0;
    const mcap = c.market_cap || 1;

    const h1K = h1Map.get(sym) || [];
    const m5K = m5Map.get(sym) || [];
    if (h1K.length < 25 || m5K.length < 50) continue;

    const h1Closes = h1K.map(k => k.close);
    const m5Closes = m5K.map(k => k.close);

    /* ─── H1 Indicators ─── */
    const h1Ema8Arr = calcEMASeries(h1Closes, 8);
    const h1Ema20Arr = calcEMASeries(h1Closes, 20);
    const h1Ema8 = h1Ema8Arr[h1Ema8Arr.length - 1];
    const h1Ema20 = h1Ema20Arr[h1Ema20Arr.length - 1];
    const h1Vwap = calcVWAP(h1K);
    const h1Price = h1Closes[h1Closes.length - 1];

    if (isNaN(h1Ema20) || h1Vwap === null) continue;

    /* ─── Step 1: H1 Bias ─── */
    let h1Bias: "bullish" | "bearish" | "neutral" = "neutral";
    if (h1Price > h1Ema20 && h1Price > h1Vwap) h1Bias = "bullish";
    else if (h1Price < h1Ema20 && h1Price < h1Vwap) h1Bias = "bearish";

    if (h1Bias === "neutral") continue; // No signal without clear H1 bias

    /* ─── M5 Indicators ─── */
    const m5Ema8Arr = calcEMASeries(m5Closes, 8);
    const m5Ema20Arr = calcEMASeries(m5Closes, 20);
    const m5Ema8 = m5Ema8Arr[m5Ema8Arr.length - 1];
    const m5Ema20 = m5Ema20Arr[m5Ema20Arr.length - 1];
    const m5Vwap = calcVWAP(m5K);

    if (isNaN(m5Ema8) || isNaN(m5Ema20) || m5Vwap === null) continue;

    /* Stochastic (9, 3, 1) on M5 */
    const stoch = calcStochastic(m5K, 9, 3, 1);
    if (stoch.kArr.length < 3 || stoch.dArr.length < 2) continue;

    const stochK = stoch.kArr[stoch.kArr.length - 1];
    const stochD = stoch.dArr[stoch.dArr.length - 1];
    const stochKPrev = stoch.kArr[stoch.kArr.length - 2];
    const stochDPrev = stoch.dArr[stoch.dArr.length - 2];

    /* ─── Step 2: M5 Signal Detection ─── */
    let side: "LONG" | "SHORT" | null = null;
    let confidence = 0;
    const reasons: string[] = [];

    // Check EMA crossover in last 3 M5 candles
    const recentEma8 = m5Ema8Arr.slice(-4);
    const recentEma20 = m5Ema20Arr.slice(-4);
    let emaCrossUp = false;
    let emaCrossDown = false;
    for (let i = 1; i < recentEma8.length; i++) {
      if (!isNaN(recentEma8[i]) && !isNaN(recentEma20[i]) && !isNaN(recentEma8[i - 1]) && !isNaN(recentEma20[i - 1])) {
        if (recentEma8[i - 1] <= recentEma20[i - 1] && recentEma8[i] > recentEma20[i]) emaCrossUp = true;
        if (recentEma8[i - 1] >= recentEma20[i - 1] && recentEma8[i] < recentEma20[i]) emaCrossDown = true;
      }
    }

    const ema8AboveEma20 = m5Ema8 > m5Ema20;
    const ema8BelowEma20 = m5Ema8 < m5Ema20;

    // Price proximity to EMA (rebond)
    const distToEma8 = Math.abs(price - m5Ema8) / price;
    const distToEma20 = Math.abs(price - m5Ema20) / price;
    const priceNearEma = distToEma8 < 0.003 || distToEma20 < 0.003;
    const priceBetweenEmas = (price >= Math.min(m5Ema8, m5Ema20) && price <= Math.max(m5Ema8, m5Ema20));

    // Stochastic conditions
    const stochOversold = stochK < 20;
    const stochOverbought = stochK > 80;
    const stochCrossUp = stochKPrev <= stochDPrev && stochK > stochD;
    const stochCrossDown = stochKPrev >= stochDPrev && stochK < stochD;
    const stochRising = stochK > stochKPrev;
    const stochFalling = stochK < stochKPrev;

    /* ─── LONG Signal ─── */
    if (h1Bias === "bullish") {
      const cond1 = true; // H1 bias already checked
      const cond2 = ema8AboveEma20 || emaCrossUp;
      const cond3 = priceNearEma || priceBetweenEmas;
      const cond4 = price > m5Vwap;
      const cond5 = stochOversold && (stochCrossUp || stochRising);

      if (cond1 && cond2 && cond3 && cond4 && cond5) {
        side = "LONG";
        confidence = 50;
        reasons.push(`H1: Prix > EMA20 ($${h1Ema20.toFixed(2)}) & VWAP ($${h1Vwap.toFixed(2)}) ✓`);

        // EMA crossover bonus
        if (emaCrossUp) {
          confidence += 10;
          reasons.push("M5: Croisement EMA8 > EMA20 récent ↑");
        } else {
          reasons.push("M5: EMA8 > EMA20 ✓");
        }

        // Rebond EMA
        if (distToEma20 < 0.001) {
          confidence += 8;
          reasons.push(`M5: Rebond parfait EMA20 ($${m5Ema20.toFixed(2)})`);
        } else if (priceNearEma) {
          confidence += 4;
          reasons.push("M5: Prix proche EMA");
        }

        // Stochastic
        if (stochK < 10) {
          confidence += 10;
          reasons.push(`Stoch: Survente extrême (K:${stochK.toFixed(1)})`);
        } else {
          confidence += 5;
          reasons.push(`Stoch: Survente (K:${stochK.toFixed(1)})`);
        }
        if (stochCrossUp) {
          confidence += 8;
          reasons.push(`Stoch: Croisement K↑D (${stochK.toFixed(1)}→${stochD.toFixed(1)})`);
        } else {
          reasons.push(`Stoch: K remonte (${stochKPrev.toFixed(1)}→${stochK.toFixed(1)})`);
        }

        // VWAP M5 alignment
        const vwapDist = (price - m5Vwap) / price;
        if (vwapDist > 0.002) {
          confidence += 4;
          reasons.push("VWAP M5: bien au-dessus ✓");
        } else {
          reasons.push("VWAP M5 ✓");
        }

        // Volume bonus
        const recentVol = m5K.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
        const avgVol = m5K.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
        if (avgVol > 0 && recentVol > avgVol * 1.3) {
          confidence += 5;
          reasons.push("Volume M5 supérieur à la moyenne");
        }

        // H1 EMA spread bonus (strong trend)
        const h1EmaSpread = Math.abs(h1Ema8 - h1Ema20) / h1Ema20;
        if (!isNaN(h1Ema8) && h1EmaSpread > 0.005) {
          confidence += 5;
          reasons.push("H1: Tendance forte (EMA8/20 écartées)");
        }
      }
    }

    /* ─── SHORT Signal ─── */
    if (h1Bias === "bearish" && !side) {
      const cond1 = true;
      const cond2 = ema8BelowEma20 || emaCrossDown;
      const cond3 = priceNearEma || priceBetweenEmas;
      const cond4 = price < m5Vwap;
      const cond5 = stochOverbought && (stochCrossDown || stochFalling);

      if (cond1 && cond2 && cond3 && cond4 && cond5) {
        side = "SHORT";
        confidence = 50;
        reasons.push(`H1: Prix < EMA20 ($${h1Ema20.toFixed(2)}) & VWAP ($${h1Vwap.toFixed(2)}) ✓`);

        if (emaCrossDown) {
          confidence += 10;
          reasons.push("M5: Croisement EMA8 < EMA20 récent ↓");
        } else {
          reasons.push("M5: EMA8 < EMA20 ✓");
        }

        if (distToEma20 < 0.001) {
          confidence += 8;
          reasons.push(`M5: Rejet parfait EMA20 ($${m5Ema20.toFixed(2)})`);
        } else if (priceNearEma) {
          confidence += 4;
          reasons.push("M5: Prix proche EMA");
        }

        if (stochK > 90) {
          confidence += 10;
          reasons.push(`Stoch: Surachat extrême (K:${stochK.toFixed(1)})`);
        } else {
          confidence += 5;
          reasons.push(`Stoch: Surachat (K:${stochK.toFixed(1)})`);
        }
        if (stochCrossDown) {
          confidence += 8;
          reasons.push(`Stoch: Croisement K↓D (${stochK.toFixed(1)}→${stochD.toFixed(1)})`);
        } else {
          reasons.push(`Stoch: K redescend (${stochKPrev.toFixed(1)}→${stochK.toFixed(1)})`);
        }

        const vwapDist = (m5Vwap - price) / price;
        if (vwapDist > 0.002) {
          confidence += 4;
          reasons.push("VWAP M5: bien en-dessous ✓");
        } else {
          reasons.push("VWAP M5 ✓");
        }

        const recentVol = m5K.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
        const avgVol = m5K.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
        if (avgVol > 0 && recentVol > avgVol * 1.3) {
          confidence += 5;
          reasons.push("Volume M5 supérieur à la moyenne");
        }

        const h1EmaSpread = Math.abs(h1Ema8 - h1Ema20) / h1Ema20;
        if (!isNaN(h1Ema8) && h1EmaSpread > 0.005) {
          confidence += 5;
          reasons.push("H1: Tendance forte (EMA8/20 écartées)");
        }
      }
    }

    if (!side) continue;

    /* ─── SL / TP Calculation ─── */
    const m5SR = calculateM5SR(m5K, price);

    // SL: dernier plus bas/haut local M5 (5-10 bougies) OU sous/au-dessus EMA20
    const last10 = m5K.slice(-10);
    let sl: number;
    if (side === "LONG") {
      const lowestLow = Math.min(...last10.map(k => k.low));
      const ema20SL = m5Ema20 * 0.997; // 0.3% sous EMA20
      sl = Math.min(lowestLow, ema20SL);
      // Ensure SL is not too tight
      if (Math.abs(price - sl) / price < 0.002) {
        sl = price * 0.997; // Minimum 0.3%
      }
      // Add margin
      sl = sl * 0.999;
    } else {
      const highestHigh = Math.max(...last10.map(k => k.high));
      const ema20SL = m5Ema20 * 1.003;
      sl = Math.max(highestHigh, ema20SL);
      if (Math.abs(sl - price) / price < 0.002) {
        sl = price * 1.003;
      }
      sl = sl * 1.001;
    }

    const slDist = Math.abs(price - sl);

    // TP based on SL distance (ratio-based)
    let tp1: number, tp2: number, tp3: number;
    if (side === "LONG") {
      tp1 = price + slDist * 1.0;  // 1:1
      tp2 = price + slDist * 1.5;  // 1:1.5
      // TP3 = next resistance or 1:2
      const nextRes = m5SR.resistances[0];
      tp3 = nextRes && nextRes.price > tp2 ? nextRes.price * 0.999 : price + slDist * 2.0;
    } else {
      tp1 = price - slDist * 1.0;
      tp2 = price - slDist * 1.5;
      const nextSup = m5SR.supports[0];
      tp3 = nextSup && nextSup.price < tp2 ? nextSup.price * 1.001 : price - slDist * 2.0;
    }

    // SL too tight penalty
    if (slDist / price < 0.002) confidence -= 10;

    confidence = Math.min(98, Math.max(25, confidence));

    const rr = slDist > 0 ? Math.round((Math.abs(tp2 - price) / slDist) * 10) / 10 : 1.5;

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
      reason: reasons.join(" | "),
      triggerTime,
      supports: m5SR.supports.slice(0, 3),
      resistances: m5SR.resistances.slice(0, 3),
      ema8_m5: m5Ema8,
      ema20_m5: m5Ema20,
      ema8_h1: isNaN(h1Ema8) ? null : h1Ema8,
      ema20_h1: h1Ema20,
      vwap_h1: h1Vwap,
      vwap_m5: m5Vwap,
      stoch_k: stochK,
      stoch_d: stochD,
      h1Bias,
    });
  }

  return setups.sort((a, b) => b.confidence - a.confidence);
}

/* ─── Auto-register scalp calls to backend ─── */

async function registerScalpCallsToBackend(setups: ScalpSetup[]) {
  for (const s of setups) {
    try {
      await fetch("/api/v1/scalp-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: s.symbol,
          side: s.side,
          entry_price: s.entry,
          stop_loss: s.stopLoss,
          tp1: s.tp1,
          tp2: s.tp2,
          tp3: s.tp3,
          confidence: s.confidence,
          reason: s.reason,
          stoch_rsi_k: s.stoch_k,
          stoch_rsi_d: s.stoch_d,
          macd_signal: s.h1Bias === "bullish" ? "bullish" : "bearish",
          h1_trend: s.h1Bias,
          rr: s.rr,
        }),
      });
    } catch {
      // Silent fail
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function ScalpTrading() {
  const [trades, setTrades] = useState<ScalpSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [filter, setFilter] = useState<"all" | "LONG" | "SHORT">("all");
  const [minConfidence, setMinConfidence] = useState(90);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setDataWarning(null);
    try {
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

      // Quick Binance check
      const testK = await fetchKlines("BTC", "1h", 5);
      if (testK.length === 0) {
        setDataWarning("Les données Binance ne sont pas disponibles. Les alertes Telegram côté serveur continuent de fonctionner.");
      }

      const clientSetups = await generateScalpSetups(allCoins);
      const serverSetups = await fetchServerScalpCalls();
      const merged = mergeSetups(clientSetups, serverSetups);
      setTrades(merged);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));

      // Register high-confidence calls (≥90%)
      registerScalpCallsToBackend(clientSetups.filter(s => s.confidence >= 90)).catch(() => {});
    } catch (err) {
      console.error("Scalp fetch error:", err);
      setFetchError("Une erreur est survenue lors de l'analyse. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = trades.filter(t => {
    if (filter !== "all" && t.side !== filter) return false;
    if (t.confidence < minConfidence) return false;
    return true;
  });

  const longCount = trades.filter(t => t.side === "LONG").length;
  const shortCount = trades.filter(t => t.side === "SHORT").length;
  const serverCount = trades.filter(t => t.source === "server").length;
  const highConfCount = trades.filter(t => t.confidence >= 90).length;
  const avgConfidence = trades.length > 0 ? Math.round(trades.reduce((s, t) => s + t.confidence, 0) / trades.length) : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
        <PageHeader
          icon={<Zap className="w-7 h-7" />}
          title="Scalp Trading — Suivi de Flux"
          subtitle="EMA 8/20 + VWAP + Stochastique (9,3,1) — Biais H1, Entrée M5"
          accentColor="amber"
        />

        <div className="px-4 md:px-6 pb-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
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
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">📱 Telegram</p>
              <p className="text-xl font-black text-blue-400">{serverCount}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Haute Conf. ≥90%</p>
              <p className="text-xl font-black text-amber-400">{highConfCount}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Confiance Moy.</p>
              <p className="text-xl font-black text-amber-400">{avgConfidence}%</p>
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
                <option value={70}>≥ 70%</option>
                <option value={80}>≥ 80%</option>
                <option value={90}>≥ 90%</option>
              </select>
            </div>
          </div>

          {/* Strategy Info */}
          <div className="mb-4 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl p-3">
            <p className="text-xs text-amber-300/80 flex items-center gap-2">
              <Zap className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Stratégie "Suivi de Flux" :</strong> Biais H1 (prix vs EMA20 + VWAP) → Entrée M5 (rebond EMA8/20 + prix vs VWAP M5 + Stochastique 9,3,1 en survente/surachat avec croisement).
                SL sous dernier creux / EMA20. TP1 = 1:1, TP2 = 1:1.5, TP3 = résistance/support ou 1:2.
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
            </div>
          )}

          {/* Table */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold">Signaux Scalp — Suivi de Flux</h2>
              <span className="text-xs text-gray-500 ml-2">Cliquez sur une ligne pour les détails</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["#", "Crypto", "Type", "Entry", "SL", "TP1", "TP2", "TP3", "Biais H1", "Stoch (9,3,1)", "EMA M5", "VWAP", "Confiance", "R:R", ""].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && trades.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="text-center py-16">
                        <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Analyse EMA + VWAP + Stochastique en cours...</p>
                        <p className="text-xs text-gray-600 mt-1">Calcul sur H1 + M5 pour 30 cryptos</p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="text-center py-16">
                        <p className="text-sm text-gray-500">Aucun signal détecté avec ces filtres</p>
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
                            {/* Crypto */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2.5">
                                {trade.image ? (
                                  <img src={trade.image} alt={trade.name} className="w-6 h-6 rounded-full" loading="lazy" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-[10px] font-bold text-gray-400">
                                    {trade.name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-sm">{trade.symbol}</p>
                                    {trade.source === "server" && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-[9px] font-bold text-blue-400">
                                        📱 TG
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-500">{trade.name}</p>
                                </div>
                              </div>
                            </td>
                            {/* Type */}
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
                                {trade.side === "LONG" ? "-" : "+"}{Math.abs((trade.stopLoss - trade.entry) / trade.entry * 100).toFixed(2)}%
                              </span>
                            </td>
                            {/* TP1 */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3 text-emerald-300" />
                                <span className="font-mono text-xs text-emerald-300 font-semibold">${formatPrice(trade.tp1)}</span>
                              </div>
                              <span className="text-[9px] text-emerald-300/60">1:1</span>
                            </td>
                            {/* TP2 */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3 text-emerald-400" />
                                <span className="font-mono text-xs text-emerald-400 font-semibold">${formatPrice(trade.tp2)}</span>
                              </div>
                              <span className="text-[9px] text-emerald-400/60">1:1.5</span>
                            </td>
                            {/* TP3 */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3 text-emerald-500" />
                                <span className="font-mono text-xs text-emerald-500 font-semibold">${formatPrice(trade.tp3)}</span>
                              </div>
                              <span className="text-[9px] text-emerald-500/60">1:2</span>
                            </td>
                            {/* H1 Bias */}
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                trade.h1Bias === "bullish"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}>
                                {trade.h1Bias === "bullish" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {trade.h1Bias === "bullish" ? "Bull" : "Bear"}
                              </span>
                            </td>
                            {/* Stochastic */}
                            <td className="px-3 py-3">
                              {trade.stoch_k !== null ? (
                                <div className="flex flex-col">
                                  <span className={`text-xs font-bold ${
                                    trade.stoch_k < 20 ? "text-emerald-400" : trade.stoch_k > 80 ? "text-red-400" : "text-gray-300"
                                  }`}>
                                    K: {trade.stoch_k.toFixed(1)}
                                  </span>
                                  {trade.stoch_d !== null && (
                                    <span className="text-[10px] text-gray-500">D: {trade.stoch_d.toFixed(1)}</span>
                                  )}
                                  <span className={`text-[9px] mt-0.5 ${
                                    trade.stoch_k < 20 ? "text-emerald-400/60" : trade.stoch_k > 80 ? "text-red-400/60" : "text-gray-600"
                                  }`}>
                                    {trade.stoch_k < 20 ? "Survente" : trade.stoch_k > 80 ? "Surachat" : "Neutre"}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-600">—</span>
                              )}
                            </td>
                            {/* EMA M5 */}
                            <td className="px-3 py-3">
                              {trade.ema8_m5 !== null && trade.ema20_m5 !== null ? (
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-cyan-400">EMA8: ${formatPrice(trade.ema8_m5)}</span>
                                  <span className="text-[10px] text-orange-400">EMA20: ${formatPrice(trade.ema20_m5)}</span>
                                  <span className={`text-[9px] mt-0.5 ${
                                    trade.ema8_m5 > trade.ema20_m5 ? "text-emerald-400/60" : "text-red-400/60"
                                  }`}>
                                    {trade.ema8_m5 > trade.ema20_m5 ? "EMA8 > EMA20 ↑" : "EMA8 < EMA20 ↓"}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-600">—</span>
                              )}
                            </td>
                            {/* VWAP */}
                            <td className="px-3 py-3">
                              {trade.vwap_m5 !== null ? (
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-purple-400">M5: ${formatPrice(trade.vwap_m5)}</span>
                                  {trade.vwap_h1 !== null && (
                                    <span className="text-[10px] text-purple-300/60">H1: ${formatPrice(trade.vwap_h1)}</span>
                                  )}
                                  <span className={`text-[9px] mt-0.5 ${
                                    trade.currentPrice > (trade.vwap_m5 || 0) ? "text-emerald-400/60" : "text-red-400/60"
                                  }`}>
                                    {trade.currentPrice > (trade.vwap_m5 || 0) ? "Prix > VWAP" : "Prix < VWAP"}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-600">—</span>
                              )}
                            </td>
                            {/* Confidence */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(100, trade.confidence)}%`,
                                      background: trade.confidence >= 80 ? "#22c55e" : trade.confidence >= 60 ? "#f59e0b" : "#ef4444",
                                    }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${
                                  trade.confidence >= 80 ? "text-emerald-400" : trade.confidence >= 60 ? "text-amber-400" : "text-red-400"
                                }`}>
                                  {trade.confidence}%
                                </span>
                              </div>
                            </td>
                            {/* R:R */}
                            <td className="px-3 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400">
                                {trade.rr}:1
                              </span>
                            </td>
                            {/* Expand */}
                            <td className="px-3 py-3">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                            </td>
                          </tr>

                          {/* Expanded Detail Row */}
                          {isExpanded && (
                            <tr className="border-b border-white/[0.04]">
                              <td colSpan={15} className="px-4 py-4 bg-white/[0.01]">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  {/* Reason */}
                                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">📋 Raison du Signal</p>
                                    <p className="text-xs text-gray-300 leading-relaxed">{trade.reason}</p>
                                  </div>

                                  {/* Supports */}
                                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                                    <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-2">🟢 Supports M5</p>
                                    {trade.supports.length > 0 ? (
                                      <div className="space-y-1.5">
                                        {trade.supports.map((s, i) => (
                                          <div key={i} className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400">S{i + 1}</span>
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
                                    <p className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-2">🔴 Résistances M5</p>
                                    {trade.resistances.length > 0 ? (
                                      <div className="space-y-1.5">
                                        {trade.resistances.map((r, i) => (
                                          <div key={i} className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400">R{i + 1}</span>
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

                                  {/* Indicators Summary */}
                                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                                    <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-2">📊 Indicateurs</p>
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-400">Biais H1</span>
                                        <span className={`text-xs font-bold ${trade.h1Bias === "bullish" ? "text-emerald-400" : "text-red-400"}`}>
                                          {trade.h1Bias === "bullish" ? "🟢 Haussier" : "🔴 Baissier"}
                                        </span>
                                      </div>
                                      {trade.ema8_h1 !== null && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-400">EMA8 H1</span>
                                          <span className="text-xs font-mono text-cyan-400">${formatPrice(trade.ema8_h1)}</span>
                                        </div>
                                      )}
                                      {trade.ema20_h1 !== null && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-400">EMA20 H1</span>
                                          <span className="text-xs font-mono text-orange-400">${formatPrice(trade.ema20_h1)}</span>
                                        </div>
                                      )}
                                      {trade.vwap_h1 !== null && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-400">VWAP H1</span>
                                          <span className="text-xs font-mono text-purple-400">${formatPrice(trade.vwap_h1)}</span>
                                        </div>
                                      )}
                                      <div className="border-t border-white/[0.06] pt-2 mt-2">
                                        {trade.ema8_m5 !== null && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400">EMA8 M5</span>
                                            <span className="text-xs font-mono text-cyan-400">${formatPrice(trade.ema8_m5)}</span>
                                          </div>
                                        )}
                                        {trade.ema20_m5 !== null && (
                                          <div className="flex items-center justify-between mt-1">
                                            <span className="text-xs text-gray-400">EMA20 M5</span>
                                            <span className="text-xs font-mono text-orange-400">${formatPrice(trade.ema20_m5)}</span>
                                          </div>
                                        )}
                                        {trade.vwap_m5 !== null && (
                                          <div className="flex items-center justify-between mt-1">
                                            <span className="text-xs text-gray-400">VWAP M5</span>
                                            <span className="text-xs font-mono text-purple-400">${formatPrice(trade.vwap_m5)}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="border-t border-white/[0.06] pt-2 mt-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-400">Stoch K (9,3,1)</span>
                                          <span className={`text-xs font-bold ${
                                            trade.stoch_k !== null && trade.stoch_k < 20 ? "text-emerald-400" : trade.stoch_k !== null && trade.stoch_k > 80 ? "text-red-400" : "text-gray-300"
                                          }`}>
                                            {trade.stoch_k !== null ? trade.stoch_k.toFixed(1) : "N/A"}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                          <span className="text-xs text-gray-400">Stoch D</span>
                                          <span className="text-xs font-mono text-gray-300">
                                            {trade.stoch_d !== null ? trade.stoch_d.toFixed(1) : "N/A"}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="border-t border-white/[0.06] pt-2 mt-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-400">Volume 24h</span>
                                          <span className="text-xs font-mono text-gray-300">{formatUsd(trade.volume)}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                          <span className="text-xs text-gray-400">Variation 24h</span>
                                          <span className={`text-xs font-bold ${trade.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                            {trade.change24h >= 0 ? "+" : ""}{trade.change24h.toFixed(2)}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
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
                                    <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 font-mono">
                                      TP1: ${formatPrice(trade.tp1)} (1:1)
                                    </span>
                                    <span className="text-gray-600">→</span>
                                    <span className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-400/25 text-emerald-400 font-mono">
                                      TP2: ${formatPrice(trade.tp2)} (1:1.5)
                                    </span>
                                    <span className="text-gray-600">→</span>
                                    <span className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 font-mono font-bold">
                                      TP3: ${formatPrice(trade.tp3)} (1:2)
                                    </span>
                                  </div>
                                </div>

                                {/* Trailing Stop Info */}
                                <div className="mt-3 bg-blue-500/[0.04] border border-blue-500/10 rounded-lg p-3">
                                  <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold mb-1">🔄 Gestion Trailing Stop</p>
                                  <p className="text-xs text-blue-300/70">
                                    TP1 touché → SL remonte au breakeven (entry) | TP2 touché → SL remonte à TP1 | Sortie si Stoch atteint zone opposée
                                  </p>
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
              ⚠️ <strong>Avertissement :</strong> Stratégie "Suivi de Flux" — EMA 8/20 + VWAP + Stochastique (9,3,1).
              Biais directionnel H1, entrée précise M5. SL sous dernier creux/EMA20, TP ratio 1:1 à 1:2.
              Le VWAP est utilisé par les algorithmes institutionnels — trader avec le VWAP = trader avec "l'argent intelligent".
              Ces signaux ne constituent pas des conseils financiers.
            </p>
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}