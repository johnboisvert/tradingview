import { useEffect, useState, useCallback, useRef, Fragment } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import {
  TrendingUp, TrendingDown, RefreshCw, Filter,
  Shield, Target, ChevronDown, ChevronUp, Zap, Trophy, Trash2,
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
  h4Bias: "bullish" | "bearish" | "neutral";
  ema8_h4: number | null;
  ema20_h4: number | null;
  source?: "client" | "server";
}

/* ─── Winrate Estimates for Scalp ─── */

function getScalpWinrateForTP(confidence: number, tpLevel: number): number {
  if (confidence >= 90) {
    if (tpLevel === 1) return 68;
    if (tpLevel === 2) return 50;
    return 33;
  }
  if (confidence >= 80) {
    if (tpLevel === 1) return 58;
    if (tpLevel === 2) return 40;
    return 25;
  }
  if (confidence >= 70) {
    if (tpLevel === 1) return 50;
    if (tpLevel === 2) return 32;
    return 20;
  }
  if (tpLevel === 1) return 42;
  if (tpLevel === 2) return 25;
  return 15;
}

function ScalpWinrateBadge({ confidence, tp }: { confidence: number; tp: number }) {
  const wr = getScalpWinrateForTP(confidence, tp);
  const color = wr >= 55 ? "text-emerald-400 bg-emerald-500/10" : wr >= 35 ? "text-amber-400 bg-amber-500/10" : "text-gray-400 bg-gray-500/10";
  return (
    <span className={`text-[8px] px-1 py-0.5 rounded font-semibold ${color} ml-1`}>
      WR ~{wr}%
    </span>
  );
}

/* ─── Signal Tracking System ─── */

interface ScalpTrackedSignal {
  symbol: string;
  side: "LONG" | "SHORT";
  entry: number;
  tp1: number;
  tp2: number;
  tp3: number;
  sl: number;
  confidence: number;
  id: string;
  timestamp: number;
  tp1Hit?: boolean;
  tp2Hit?: boolean;
  tp3Hit?: boolean;
  slHit?: boolean;
  resolved?: boolean;
}

interface ScalpPerfStats {
  total: number;
  tp1Hits: number;
  tp2Hits: number;
  tp3Hits: number;
  slHits: number;
  pending: number;
}

const SCALP_SIGNAL_KEY = "scalp_tracked_signals";

function loadScalpSignals(): ScalpTrackedSignal[] {
  try {
    const raw = localStorage.getItem(SCALP_SIGNAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveScalpSignals(signals: ScalpTrackedSignal[]) {
  try {
    const trimmed = signals.slice(-300);
    localStorage.setItem(SCALP_SIGNAL_KEY, JSON.stringify(trimmed));
  } catch {
    // Silent fail
  }
}

function storeNewScalpSignals(setups: ScalpSetup[]) {
  const existing = loadScalpSignals();
  const existingKeys = new Set(existing.map(s => `${s.symbol}-${s.side}-${s.entry}`));
  const newSignals: ScalpTrackedSignal[] = [];

  for (const s of setups) {
    const key = `${s.symbol}-${s.side}-${s.entry}`;
    if (!existingKeys.has(key)) {
      newSignals.push({
        symbol: s.symbol,
        side: s.side,
        entry: s.entry,
        tp1: s.tp1,
        tp2: s.tp2,
        tp3: s.tp3,
        sl: s.stopLoss,
        confidence: s.confidence,
        id: s.id,
        timestamp: Date.now(),
      });
    }
  }

  if (newSignals.length > 0) {
    saveScalpSignals([...existing, ...newSignals]);
  }
}

function updateScalpSignalsWithPrices(currentPrices: Map<string, number>): ScalpTrackedSignal[] {
  const signals = loadScalpSignals();
  let changed = false;

  for (const sig of signals) {
    if (sig.resolved) continue;
    const price = currentPrices.get(sig.symbol);
    if (price == null) continue;

    if (sig.side === "LONG") {
      if (price <= sig.sl && !sig.slHit) { sig.slHit = true; sig.resolved = true; changed = true; }
      if (price >= sig.tp1 && !sig.tp1Hit) { sig.tp1Hit = true; changed = true; }
      if (price >= sig.tp2 && !sig.tp2Hit) { sig.tp2Hit = true; changed = true; }
      if (price >= sig.tp3 && !sig.tp3Hit) { sig.tp3Hit = true; sig.resolved = true; changed = true; }
    } else {
      if (price >= sig.sl && !sig.slHit) { sig.slHit = true; sig.resolved = true; changed = true; }
      if (price <= sig.tp1 && !sig.tp1Hit) { sig.tp1Hit = true; changed = true; }
      if (price <= sig.tp2 && !sig.tp2Hit) { sig.tp2Hit = true; changed = true; }
      if (price <= sig.tp3 && !sig.tp3Hit) { sig.tp3Hit = true; sig.resolved = true; changed = true; }
    }

    // Auto-expire after 2 hours (scalp timeframe)
    if (Date.now() - sig.timestamp > 2 * 60 * 60 * 1000 && !sig.resolved) {
      sig.resolved = true;
      changed = true;
    }
  }

  if (changed) saveScalpSignals(signals);
  return signals;
}

function computeScalpPerfStats(signals: ScalpTrackedSignal[]): ScalpPerfStats {
  return {
    total: signals.length,
    tp1Hits: signals.filter(s => s.tp1Hit).length,
    tp2Hits: signals.filter(s => s.tp2Hit).length,
    tp3Hits: signals.filter(s => s.tp3Hit).length,
    slHits: signals.filter(s => s.slHit).length,
    pending: signals.filter(s => !s.resolved).length,
  };
}

function clearScalpSignals() {
  localStorage.removeItem(SCALP_SIGNAL_KEY);
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
  stoch_k: number | null;
  stoch_d: number | null;
  stoch_rsi_k?: number | null;
  stoch_rsi_d?: number | null;
  ema8_m5: number | null;
  ema20_m5: number | null;
  vwap_m5: number | null;
  vwap_h1: number | null;
  macd_signal: string;
  h1_macd_signal: string;
  h1_trend: string;
  h4_trend?: string;
  ema8_h4?: number | null;
  ema20_h4?: number | null;
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
    ema8_m5: call.ema8_m5 ?? null,
    ema20_m5: call.ema20_m5 ?? null,
    ema8_h1: null,
    ema20_h1: null,
    vwap_h1: call.vwap_h1 ?? null,
    vwap_m5: call.vwap_m5 ?? null,
    stoch_k: call.stoch_k ?? call.stoch_rsi_k ?? null,
    stoch_d: call.stoch_d ?? call.stoch_rsi_d ?? null,
    h1Bias: (call.h1_trend as "bullish" | "bearish" | "neutral") || "neutral",
    h4Bias: (call.h4_trend as "bullish" | "bearish" | "neutral") || "neutral",
    ema8_h4: call.ema8_h4 ?? null,
    ema20_h4: call.ema20_h4 ?? null,
    source: "server",
  };
}

async function fetchServerScalpCalls(signal?: AbortSignal): Promise<ScalpSetup[]> {
  try {
    const res = await fetch("/api/v1/scalp-calls?status=active&limit=50", { signal: signal ?? AbortSignal.timeout(8000) });
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
  if (v == null || isNaN(v)) return "$0.00";
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

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

/* ─── Fallback symbols when CoinGecko is unavailable ─── */

const FALLBACK_SYMBOLS = [
  { symbol: "BTCUSDT", id: "bitcoin", name: "Bitcoin" },
  { symbol: "ETHUSDT", id: "ethereum", name: "Ethereum" },
  { symbol: "SOLUSDT", id: "solana", name: "Solana" },
  { symbol: "BNBUSDT", id: "binancecoin", name: "BNB" },
  { symbol: "XRPUSDT", id: "ripple", name: "XRP" },
  { symbol: "ADAUSDT", id: "cardano", name: "Cardano" },
  { symbol: "DOGEUSDT", id: "dogecoin", name: "Dogecoin" },
  { symbol: "AVAXUSDT", id: "avalanche-2", name: "Avalanche" },
  { symbol: "DOTUSDT", id: "polkadot", name: "Polkadot" },
  { symbol: "LINKUSDT", id: "chainlink", name: "Chainlink" },
  { symbol: "MATICUSDT", id: "matic-network", name: "Polygon" },
  { symbol: "UNIUSDT", id: "uniswap", name: "Uniswap" },
  { symbol: "ATOMUSDT", id: "cosmos", name: "Cosmos" },
  { symbol: "NEARUSDT", id: "near", name: "NEAR" },
  { symbol: "APTUSDT", id: "aptos", name: "Aptos" },
  { symbol: "ARBUSDT", id: "arbitrum", name: "Arbitrum" },
  { symbol: "OPUSDT", id: "optimism", name: "Optimism" },
  { symbol: "INJUSDT", id: "injective-protocol", name: "Injective" },
  { symbol: "SUIUSDT", id: "sui", name: "Sui" },
  { symbol: "SEIUSDT", id: "sei-network", name: "Sei" },
  { symbol: "TIAUSDT", id: "celestia", name: "Celestia" },
  { symbol: "JUPUSDT", id: "jupiter-exchange-solana", name: "Jupiter" },
  { symbol: "WIFUSDT", id: "dogwifcoin", name: "dogwifhat" },
  { symbol: "PEPEUSDT", id: "pepe", name: "Pepe" },
  { symbol: "BONKUSDT", id: "bonk", name: "Bonk" },
  { symbol: "RENDERUSDT", id: "render-token", name: "Render" },
  { symbol: "FETUSDT", id: "fetch-ai", name: "Fetch.ai" },
  { symbol: "TAOUSDT", id: "bittensor", name: "Bittensor" },
  { symbol: "ONDOUSDT", id: "ondo-finance", name: "Ondo" },
  { symbol: "FTMUSDT", id: "fantom", name: "Fantom" },
];

function buildFallbackCoins(): any[] {
  return FALLBACK_SYMBOLS.map(fb => ({
    id: fb.id,
    symbol: fb.symbol.replace(/USDT$/, "").toLowerCase(),
    name: fb.name,
    current_price: 0,
    market_cap: 100_000_000,
    total_volume: 10_000_000,
    price_change_percentage_24h: 0,
    image: "",
  }));
}

/* ─── Binance Klines with Volume ─── */

interface KlineWithVol {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/* ─── CoinGecko symbol → Binance symbol mapping ─── */
// Stablecoins and tokens that don't have valid USDT pairs on Binance
const EXCLUDED_COINGECKO_SYMBOLS = new Set([
  "usdt", "usdc", "busd", "tusd", "dai", "fdusd", "usdp", "usdd", "gusd",
  "frax", "lusd", "susd", "eurs", "eurt", "usdj", "tribe", "ust", "ausd",
  "pyusd", "crvusd", "eurc", "usde",
]);

// CoinGecko symbol → Binance base symbol overrides
// (CoinGecko uses different ticker symbols than Binance for some coins)
const COINGECKO_TO_BINANCE: Record<string, string> = {
  "xaut": "", // Tether Gold — not on Binance as XAUTUSDT
  "ff": "",   // not a valid Binance pair
  "xpl": "",  // not a valid Binance pair
  "bard": "", // not a valid Binance pair
  "vvv": "",  // not a valid Binance pair
  "mon": "",  // not a valid Binance pair
  "kite": "", // not a valid Binance pair
  "power": "", // not on Binance
  "siren": "", // not on Binance
  "pippin": "", // not on Binance
  "river": "", // not on Binance
  "apepe": "", // not on Binance
  "m": "",     // not on Binance (single letter, invalid)
};

/** Convert CoinGecko symbol to Binance USDT pair. Returns empty string if invalid. */
function cgSymbolToBinancePair(cgSymbol: string): string {
  const lower = cgSymbol.toLowerCase();
  // Exclude stablecoins
  if (EXCLUDED_COINGECKO_SYMBOLS.has(lower)) return "";
  // Check override map
  if (lower in COINGECKO_TO_BINANCE) return COINGECKO_TO_BINANCE[lower] || "";
  // Default: uppercase + USDT
  const base = cgSymbol.toUpperCase();
  if (!base || base.length < 2) return "";
  return `${base}USDT`;
}

// Cache of known-bad Binance symbols to avoid repeated 400 errors
const _badBinanceSymbols = new Set<string>();

async function fetchKlines(symbolUpper: string, interval: string, limit: number, signal?: AbortSignal): Promise<KlineWithVol[]> {
  const base = symbolUpper.replace(/USDT$/, "");
  const pair = `${base}USDT`;
  // Skip if we already know this symbol is invalid
  if (!base || base.length < 2 || _badBinanceSymbols.has(pair)) return [];
  try {
    const res = await fetch(`/api/binance/klines?symbol=${pair}&interval=${interval}&limit=${limit}`, { signal: signal ?? AbortSignal.timeout(5000) });
    if (!res.ok) {
      // Mark as bad so we don't retry
      if (res.status === 400) _badBinanceSymbols.add(pair);
      return [];
    }
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

async function generateScalpSetups(coins: any[], signal?: AbortSignal): Promise<ScalpSetup[]> {
  const triggerTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const setups: ScalpSetup[] = [];

  const candidates = coins.filter(c => {
    if (!c || !c.current_price || !c.market_cap) return false;
    const vol = c.total_volume || 0;
    const mcap = c.market_cap || 1;
    return vol / mcap > 0.03 && mcap > 30_000_000;
  });

  const sorted = [...candidates].sort((a, b) => {
    const rA = (a.total_volume || 0) / (a.market_cap || 1);
    const rB = (b.total_volume || 0) / (b.market_cap || 1);
    return rB - rA;
  }).slice(0, 120);

  /* Fetch H1, 4H and M5 klines in batches — only for coins with valid Binance pairs */
  const BATCH = 10;
  const h1Map = new Map<string, KlineWithVol[]>();
  const h4Map = new Map<string, KlineWithVol[]>();
  const m5Map = new Map<string, KlineWithVol[]>();

  // Pre-filter: only keep coins with valid Binance pairs
  const validSorted = sorted.filter(c => {
    const cgSym = (c.symbol || "") as string;
    return cgSymbolToBinancePair(cgSym) !== "";
  });

  for (let i = 0; i < validSorted.length; i += BATCH) {
    const batch = validSorted.slice(i, i + BATCH);
    await Promise.all(batch.flatMap(c => {
      const sym = ((c.symbol || "") as string).toUpperCase();
      return [
        fetchKlines(sym, "1h", 100, signal).then(d => h1Map.set(sym, d)),
        fetchKlines(sym, "4h", 50, signal).then(d => h4Map.set(sym, d)),
        fetchKlines(sym, "5m", 100, signal).then(d => m5Map.set(sym, d)),
      ];
    }));
    if (i + BATCH < validSorted.length) await new Promise(r => setTimeout(r, 300));
  }

  for (const c of validSorted) {
    try {
    const sym = ((c.symbol || "") as string).toUpperCase();
    let price = c.current_price;
    const change24h = c.price_change_percentage_24h || 0;
    const volume = c.total_volume || 0;
    const mcap = c.market_cap || 1;

    const h1K = h1Map.get(sym) || [];
    const m5K = m5Map.get(sym) || [];
    if (h1K.length < 25 || m5K.length < 50) continue;

    // If price is 0 (fallback mode), get it from the latest M5 candle
    if (!price || price <= 0) {
      price = m5K[m5K.length - 1]?.close || 0;
      if (price <= 0) continue;
    }

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

    /* ─── 4H Indicators (Higher Timeframe Trend Filter) ─── */
    const h4K = h4Map.get(sym) || [];
    let h4Bias: "bullish" | "bearish" | "neutral" = "neutral";
    let h4Ema8Val: number | null = null;
    let h4Ema20Val: number | null = null;
    if (h4K.length >= 25) {
      const h4Closes = h4K.map(k => k.close);
      const h4Ema8Arr = calcEMASeries(h4Closes, 8);
      const h4Ema20Arr = calcEMASeries(h4Closes, 20);
      h4Ema8Val = h4Ema8Arr[h4Ema8Arr.length - 1];
      h4Ema20Val = h4Ema20Arr[h4Ema20Arr.length - 1];
      if (!isNaN(h4Ema8Val) && !isNaN(h4Ema20Val)) {
        const h4Spread = Math.abs(h4Ema8Val - h4Ema20Val) / h4Ema20Val;
        if (h4Spread < 0.001) {
          h4Bias = "neutral";
        } else if (h4Ema8Val > h4Ema20Val) {
          h4Bias = "bullish";
        } else {
          h4Bias = "bearish";
        }
      }
    }

    // Reject signals conflicting with 4H trend
    if (h1Bias === "bullish" && h4Bias === "bearish") continue;
    if (h1Bias === "bearish" && h4Bias === "bullish") continue;

    // 4H neutral penalty applied later
    const h4NeutralPenalty = h4Bias === "neutral" ? 5 : 0;

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

    // Stochastic conditions — relaxed thresholds matching server
    const stochOversold = stochK < 35;        // Relaxed from 20 to 35
    const stochDeepOversold = stochK < 20;    // Original strict threshold
    const stochOverbought = stochK > 65;      // Relaxed from 80 to 65
    const stochDeepOverbought = stochK > 80;  // Original strict threshold
    const stochCrossUp = stochKPrev <= stochDPrev && stochK > stochD;
    const stochCrossDown = stochKPrev >= stochDPrev && stochK < stochD;
    const stochRising = stochK > stochKPrev;
    const stochFalling = stochK < stochKPrev;

    // Extended price proximity — relaxed from 0.003 to 0.006
    const priceNearEmaWide = distToEma8 < 0.006 || distToEma20 < 0.006;

    /* ─── LONG Signal — Type A: Pullback Entry (relaxed) ─── */
    if (h1Bias === "bullish") {
      const cond2 = ema8AboveEma20 || emaCrossUp;
      const cond3 = priceNearEma || priceBetweenEmas || priceNearEmaWide;
      const cond4 = price > m5Vwap;
      const cond5 = stochOversold && (stochCrossUp || stochRising);

      if (cond2 && cond3 && cond4 && cond5) {
        side = "LONG";
        confidence = 50;
        reasons.push(`H1: Prix > EMA20 ($${h1Ema20.toFixed(2)}) & VWAP ($${h1Vwap.toFixed(2)}) ✓`);

        if (emaCrossUp) { confidence += 10; reasons.push("M5: Croisement EMA8 > EMA20 récent ↑"); }
        else { reasons.push("M5: EMA8 > EMA20 ✓"); }

        if (distToEma20 < 0.001) { confidence += 8; reasons.push("M5: Rebond parfait EMA20"); }
        else if (priceNearEma) { confidence += 4; reasons.push("M5: Prix proche EMA"); }
        else if (priceNearEmaWide) { confidence += 2; reasons.push("M5: Prix zone EMA"); }

        if (stochDeepOversold) { confidence += 10; reasons.push(`Stoch: Survente extrême (K:${stochK.toFixed(1)})`); }
        else if (stochK < 25) { confidence += 7; reasons.push(`Stoch: Survente (K:${stochK.toFixed(1)})`); }
        else { confidence += 4; reasons.push(`Stoch: Zone basse (K:${stochK.toFixed(1)})`); }

        if (stochCrossUp) { confidence += 8; reasons.push("Stoch: Croisement K↑D"); }

        const vwapDist = (price - m5Vwap) / price;
        if (vwapDist > 0.002) { confidence += 4; reasons.push("VWAP M5: bien au-dessus ✓"); }

        const recentVol = m5K.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
        const avgVol = m5K.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
        if (avgVol > 0 && recentVol > avgVol * 1.3) { confidence += 5; reasons.push("Volume M5 supérieur"); }

        const h1Spread = Math.abs(h1Ema8 - h1Ema20) / h1Ema20;
        if (!isNaN(h1Ema8) && h1Spread > 0.005) { confidence += 5; reasons.push("H1: Tendance forte (EMA8/20 écartées)"); }
      }

      /* ─── LONG Signal — Type B: Momentum Continuation ─── */
      if (!side && h1Bias === "bullish") {
        const strongH1 = !isNaN(h1Ema8) && h1Ema8 > h1Ema20 && h1Closes[h1Closes.length - 1] > h1Ema8;
        const emaCrossRecent = emaCrossUp;
        const stochMidRising = stochK > 40 && stochK < 75 && stochCrossUp;
        const aboveVwap = price > m5Vwap;

        if (strongH1 && emaCrossRecent && stochMidRising && aboveVwap) {
          side = "LONG";
          confidence = 45;
          reasons.push("H1: Tendance forte haussière (EMA8 > EMA20, prix > EMA8) ✓");
          reasons.push("M5: Croisement EMA8 > EMA20 récent ↑");
          reasons.push(`Stoch: Croisement K↑D en zone médiane (K:${stochK.toFixed(1)})`);

          const vwapDist = (price - m5Vwap) / price;
          if (vwapDist > 0.003) { confidence += 5; reasons.push("VWAP M5: bien au-dessus ✓"); }

          const recentVol = m5K.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
          const avgVol = m5K.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
          if (avgVol > 0 && recentVol > avgVol * 1.5) { confidence += 8; reasons.push("Volume M5 en hausse forte"); }
          else if (avgVol > 0 && recentVol > avgVol * 1.2) { confidence += 4; reasons.push("Volume M5 supérieur"); }

          const h1Spread = Math.abs(h1Ema8 - h1Ema20) / h1Ema20;
          if (h1Spread > 0.008) { confidence += 8; reasons.push("H1: Tendance très forte (EMA8/20 très écartées)"); }
          else if (h1Spread > 0.004) { confidence += 4; reasons.push("H1: Tendance forte"); }
        }
      }

      /* ─── LONG Signal — Type C: VWAP Bounce ─── */
      if (!side && h1Bias === "bullish") {
        const vwapProximity = Math.abs(price - m5Vwap) / price < 0.003;
        const priceAboveVwap = price >= m5Vwap;
        const stochTurningUp = stochCrossUp || (stochRising && stochK < 50);
        const emaAligned = ema8AboveEma20;

        if (vwapProximity && priceAboveVwap && stochTurningUp && emaAligned) {
          side = "LONG";
          confidence = 48;
          reasons.push("H1: Biais haussier ✓");
          reasons.push(`M5: Rebond VWAP ($${m5Vwap.toFixed(2)}) ✓`);
          reasons.push(`Stoch: ${stochCrossUp ? "Croisement K↑D" : "K en hausse"} (K:${stochK.toFixed(1)})`);
          reasons.push("M5: EMA8 > EMA20 ✓");

          const recentVol = m5K.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
          const avgVol = m5K.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
          if (avgVol > 0 && recentVol > avgVol * 1.3) { confidence += 6; reasons.push("Volume M5 supérieur"); }

          const h1Spread = Math.abs(h1Ema8 - h1Ema20) / h1Ema20;
          if (!isNaN(h1Ema8) && h1Spread > 0.005) { confidence += 5; reasons.push("H1: Tendance forte"); }
        }
      }

      /* ─── LONG Signal — Type D: Strong Trend Micro-Pullback ─── */
      if (!side && h1Bias === "bullish") {
        const h1Strong = !isNaN(h1Ema8) && h1Ema8 > h1Ema20;
        const h1Spread = !isNaN(h1Ema8) ? Math.abs(h1Ema8 - h1Ema20) / h1Ema20 : 0;
        const emaAligned = ema8AboveEma20;
        const aboveVwap = price > m5Vwap;

        const stochMicroPullback = (stochK >= 50 && stochK <= 90 && stochKPrev > stochK + 2) ||
                                    (stochK >= 60 && stochCrossUp) ||
                                    (stochKPrev >= 95 && stochK < 95 && stochK > 70);

        const priceNearEma8 = distToEma8 < 0.005;

        if (h1Strong && h1Spread > 0.003 && emaAligned && aboveVwap && stochMicroPullback && priceNearEma8) {
          side = "LONG";
          confidence = 55;
          reasons.push(`H1: Tendance forte haussière (spread EMA: ${(h1Spread * 100).toFixed(2)}%) ✓`);
          reasons.push("M5: EMA8 > EMA20 ✓");
          reasons.push(`M5: Prix proche EMA8 (dist: ${(distToEma8 * 100).toFixed(3)}%)`);
          reasons.push(`Stoch: Micro-pullback (K:${stochK.toFixed(1)}, prev:${stochKPrev.toFixed(1)})`);
          reasons.push(`VWAP: Prix au-dessus ($${m5Vwap.toFixed(2)}) ✓`);

          if (h1Spread > 0.008) { confidence += 8; reasons.push("H1: Tendance très forte"); }
          else if (h1Spread > 0.005) { confidence += 4; }

          if (stochCrossUp) { confidence += 6; reasons.push("Stoch: Croisement K↑D"); }

          const recentVol = m5K.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
          const avgVol = m5K.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
          if (avgVol > 0 && recentVol > avgVol * 1.5) { confidence += 8; reasons.push("Volume M5 en hausse forte"); }
          else if (avgVol > 0 && recentVol > avgVol * 1.2) { confidence += 4; reasons.push("Volume M5 supérieur"); }

          const last3 = m5K.slice(-3);
          if (last3.length === 3 && last3[1].low > last3[0].low && last3[2].low > last3[1].low) {
            confidence += 5; reasons.push("M5: Higher lows (structure haussière)");
          }
        }
      }

      /* ─── LONG Signal — Type E: EMA Alignment + Volume Surge ─── */
      if (!side && h1Bias === "bullish") {
        const emaAligned = ema8AboveEma20;
        const aboveVwap = price > m5Vwap;
        const h1Spread = !isNaN(h1Ema8) ? Math.abs(h1Ema8 - h1Ema20) / h1Ema20 : 0;

        const recentVol = m5K.slice(-3).reduce((s, c) => s + c.volume, 0) / 3;
        const avgVol = m5K.slice(-30).reduce((s, c) => s + c.volume, 0) / 30;
        const volumeSurge = avgVol > 0 && recentVol > avgVol * 2.0;

        const priceAboveBothEmas = price > m5Ema8 && price > m5Ema20;

        if (emaAligned && aboveVwap && volumeSurge && priceAboveBothEmas && h1Spread > 0.004) {
          side = "LONG";
          confidence = 58;
          reasons.push(`H1: Tendance haussière forte (spread: ${(h1Spread * 100).toFixed(2)}%) ✓`);
          reasons.push("M5: EMA8 > EMA20, prix au-dessus des deux ✓");
          reasons.push(`Volume: Surge x${(recentVol / avgVol).toFixed(1)} ✓`);
          reasons.push(`VWAP: Au-dessus ($${m5Vwap.toFixed(2)}) ✓`);
          reasons.push(`Stoch: K=${stochK.toFixed(1)}`);

          if (h1Spread > 0.008) { confidence += 8; }
          if (recentVol > avgVol * 3) { confidence += 6; reasons.push("Volume: Surge extrême"); }
          if (stochK >= 99) { confidence -= 5; }
        }
      }
    }

    /* ─── SHORT Signal — Type A: Pullback Entry (relaxed) ─── */
    if (h1Bias === "bearish" && !side) {
      const cond2 = ema8BelowEma20 || emaCrossDown;
      const cond3 = priceNearEma || priceBetweenEmas || priceNearEmaWide;
      const cond4 = price < m5Vwap;
      const cond5 = stochOverbought && (stochCrossDown || stochFalling);

      if (cond2 && cond3 && cond4 && cond5) {
        side = "SHORT";
        confidence = 50;
        reasons.push(`H1: Prix < EMA20 ($${h1Ema20.toFixed(2)}) & VWAP ($${h1Vwap.toFixed(2)}) ✓`);

        if (emaCrossDown) { confidence += 10; reasons.push("M5: Croisement EMA8 < EMA20 récent ↓"); }
        else { reasons.push("M5: EMA8 < EMA20 ✓"); }

        if (distToEma20 < 0.001) { confidence += 8; reasons.push("M5: Rejet parfait EMA20"); }
        else if (priceNearEma) { confidence += 4; reasons.push("M5: Prix proche EMA"); }
        else if (priceNearEmaWide) { confidence += 2; reasons.push("M5: Prix zone EMA"); }

        if (stochDeepOverbought) { confidence += 10; reasons.push(`Stoch: Surachat extrême (K:${stochK.toFixed(1)})`); }
        else if (stochK > 75) { confidence += 7; reasons.push(`Stoch: Surachat (K:${stochK.toFixed(1)})`); }
        else { confidence += 4; reasons.push(`Stoch: Zone haute (K:${stochK.toFixed(1)})`); }

        if (stochCrossDown) { confidence += 8; reasons.push("Stoch: Croisement K↓D"); }

        const vwapDist = (m5Vwap - price) / price;
        if (vwapDist > 0.002) { confidence += 4; reasons.push("VWAP M5: bien en-dessous ✓"); }

        const recentVol = m5K.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
        const avgVol = m5K.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
        if (avgVol > 0 && recentVol > avgVol * 1.3) { confidence += 5; reasons.push("Volume M5 supérieur"); }

        const h1Spread = Math.abs(h1Ema8 - h1Ema20) / h1Ema20;
        if (!isNaN(h1Ema8) && h1Spread > 0.005) { confidence += 5; reasons.push("H1: Tendance forte (EMA8/20 écartées)"); }
      }

      /* ─── SHORT Signal — Type B: Momentum Continuation ─── */
      if (!side && h1Bias === "bearish") {
        const strongH1 = !isNaN(h1Ema8) && h1Ema8 < h1Ema20 && h1Closes[h1Closes.length - 1] < h1Ema8;
        const emaCrossRecent = emaCrossDown;
        const stochMidFalling = stochK > 25 && stochK < 60 && stochCrossDown;
        const belowVwap = price < m5Vwap;

        if (strongH1 && emaCrossRecent && stochMidFalling && belowVwap) {
          side = "SHORT";
          confidence = 45;
          reasons.push("H1: Tendance forte baissière (EMA8 < EMA20, prix < EMA8) ✓");
          reasons.push("M5: Croisement EMA8 < EMA20 récent ↓");
          reasons.push(`Stoch: Croisement K↓D en zone médiane (K:${stochK.toFixed(1)})`);

          const vwapDist = (m5Vwap - price) / price;
          if (vwapDist > 0.003) { confidence += 5; reasons.push("VWAP M5: bien en-dessous ✓"); }

          const recentVol = m5K.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
          const avgVol = m5K.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
          if (avgVol > 0 && recentVol > avgVol * 1.5) { confidence += 8; reasons.push("Volume M5 en hausse forte"); }
          else if (avgVol > 0 && recentVol > avgVol * 1.2) { confidence += 4; reasons.push("Volume M5 supérieur"); }

          const h1Spread = Math.abs(h1Ema8 - h1Ema20) / h1Ema20;
          if (h1Spread > 0.008) { confidence += 8; reasons.push("H1: Tendance très forte (EMA8/20 très écartées)"); }
          else if (h1Spread > 0.004) { confidence += 4; reasons.push("H1: Tendance forte"); }
        }
      }

      /* ─── SHORT Signal — Type C: VWAP Rejection ─── */
      if (!side && h1Bias === "bearish") {
        const vwapProximity = Math.abs(price - m5Vwap) / price < 0.003;
        const priceBelowVwap = price <= m5Vwap;
        const stochTurningDown = stochCrossDown || (stochFalling && stochK > 50);
        const emaAligned = ema8BelowEma20;

        if (vwapProximity && priceBelowVwap && stochTurningDown && emaAligned) {
          side = "SHORT";
          confidence = 48;
          reasons.push("H1: Biais baissier ✓");
          reasons.push(`M5: Rejet VWAP ($${m5Vwap.toFixed(2)}) ✓`);
          reasons.push(`Stoch: ${stochCrossDown ? "Croisement K↓D" : "K en baisse"} (K:${stochK.toFixed(1)})`);
          reasons.push("M5: EMA8 < EMA20 ✓");

          const recentVol = m5K.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
          const avgVol = m5K.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
          if (avgVol > 0 && recentVol > avgVol * 1.3) { confidence += 6; reasons.push("Volume M5 supérieur"); }

          const h1Spread = Math.abs(h1Ema8 - h1Ema20) / h1Ema20;
          if (!isNaN(h1Ema8) && h1Spread > 0.005) { confidence += 5; reasons.push("H1: Tendance forte"); }
        }
      }

      /* ─── SHORT Signal — Type D: Strong Trend Micro-Bounce ─── */
      if (!side && h1Bias === "bearish") {
        const h1Strong = !isNaN(h1Ema8) && h1Ema8 < h1Ema20;
        const h1Spread = !isNaN(h1Ema8) ? Math.abs(h1Ema8 - h1Ema20) / h1Ema20 : 0;
        const emaAligned = ema8BelowEma20;
        const belowVwap = price < m5Vwap;

        const stochMicroBounce = (stochK <= 50 && stochK >= 10 && stochKPrev < stochK - 2) ||
                                  (stochK <= 40 && stochCrossDown) ||
                                  (stochKPrev <= 5 && stochK > 5 && stochK < 30);

        const priceNearEma8 = distToEma8 < 0.005;

        if (h1Strong && h1Spread > 0.003 && emaAligned && belowVwap && stochMicroBounce && priceNearEma8) {
          side = "SHORT";
          confidence = 55;
          reasons.push(`H1: Tendance forte baissière (spread EMA: ${(h1Spread * 100).toFixed(2)}%) ✓`);
          reasons.push("M5: EMA8 < EMA20 ✓");
          reasons.push(`M5: Prix proche EMA8 (dist: ${(distToEma8 * 100).toFixed(3)}%)`);
          reasons.push(`Stoch: Micro-rebond (K:${stochK.toFixed(1)}, prev:${stochKPrev.toFixed(1)})`);
          reasons.push(`VWAP: Prix en-dessous ($${m5Vwap.toFixed(2)}) ✓`);

          if (h1Spread > 0.008) { confidence += 8; }
          else if (h1Spread > 0.005) { confidence += 4; }

          if (stochCrossDown) { confidence += 6; reasons.push("Stoch: Croisement K↓D"); }

          const recentVol = m5K.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
          const avgVol = m5K.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
          if (avgVol > 0 && recentVol > avgVol * 1.5) { confidence += 8; }
          else if (avgVol > 0 && recentVol > avgVol * 1.2) { confidence += 4; }

          const last3 = m5K.slice(-3);
          if (last3.length === 3 && last3[1].high < last3[0].high && last3[2].high < last3[1].high) {
            confidence += 5; reasons.push("M5: Lower highs (structure baissière)");
          }
        }
      }

      /* ─── SHORT Signal — Type E: EMA Alignment + Volume Surge ─── */
      if (!side && h1Bias === "bearish") {
        const emaAligned = ema8BelowEma20;
        const belowVwap = price < m5Vwap;
        const h1Spread = !isNaN(h1Ema8) ? Math.abs(h1Ema8 - h1Ema20) / h1Ema20 : 0;

        const recentVol = m5K.slice(-3).reduce((s, c) => s + c.volume, 0) / 3;
        const avgVol = m5K.slice(-30).reduce((s, c) => s + c.volume, 0) / 30;
        const volumeSurge = avgVol > 0 && recentVol > avgVol * 2.0;

        const priceBelowBothEmas = price < m5Ema8 && price < m5Ema20;

        if (emaAligned && belowVwap && volumeSurge && priceBelowBothEmas && h1Spread > 0.004) {
          side = "SHORT";
          confidence = 58;
          reasons.push(`H1: Tendance baissière forte (spread: ${(h1Spread * 100).toFixed(2)}%) ✓`);
          reasons.push("M5: EMA8 < EMA20, prix en-dessous des deux ✓");
          reasons.push(`Volume: Surge x${(recentVol / avgVol).toFixed(1)} ✓`);
          reasons.push(`VWAP: En-dessous ($${m5Vwap.toFixed(2)}) ✓`);
          reasons.push(`Stoch: K=${stochK.toFixed(1)}`);

          if (h1Spread > 0.008) { confidence += 8; }
          if (recentVol > avgVol * 3) { confidence += 6; }
          if (stochK <= 1) { confidence -= 5; }
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
      const ema20SL = m5Ema20 * 0.995; // 0.5% sous EMA20
      sl = Math.min(lowestLow, ema20SL);
      // Ensure SL is not too tight — minimum 0.5%
      if (Math.abs(price - sl) / price < 0.005) {
        sl = price * 0.995; // Minimum 0.5%
      }
      // Add margin buffer
      sl = sl * 0.999;
    } else {
      const highestHigh = Math.max(...last10.map(k => k.high));
      const ema20SL = m5Ema20 * 1.005;
      sl = Math.max(highestHigh, ema20SL);
      if (Math.abs(sl - price) / price < 0.005) {
        sl = price * 1.005;
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
    if (slDist / price < 0.003) confidence -= 10;

    // Apply 4H neutral penalty
    confidence -= h4NeutralPenalty;

    confidence = Math.min(98, Math.max(25, confidence));

    const rr = slDist > 0 ? Math.round((Math.abs(tp2 - price) / slDist) * 10) / 10 : 1.5;

    const binancePair = cgSymbolToBinancePair((c.symbol || "") as string);
    setups.push({
      id: c.id,
      symbol: binancePair || (sym + "USDT"),
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
      h4Bias,
      ema8_h4: h4Ema8Val,
      ema20_h4: h4Ema20Val,
    });
    } catch (coinErr) {
      console.warn(`Scalp setup error for ${c?.symbol || "unknown"}:`, coinErr);
      continue;
    }
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
          stoch_k: s.stoch_k,
          stoch_d: s.stoch_d,
          ema8_m5: s.ema8_m5,
          ema20_m5: s.ema20_m5,
          vwap_m5: s.vwap_m5,
          vwap_h1: s.vwap_h1,
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
  const [minConfidence, setMinConfidence] = useState(88);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [dataWarning, setDataWarning] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [perfStats, setPerfStats] = useState<ScalpPerfStats>({ total: 0, tp1Hits: 0, tp2Hits: 0, tp3Hits: 0, slHits: 0, pending: 0 });

  // Refs for safe async cleanup
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  /* Catch stray unhandled promise rejections so they don't bubble to ErrorBoundary */
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      e.preventDefault();
      console.warn("Unhandled rejection caught in ScalpTrading:", e.reason);
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  const fetchData = useCallback(async () => {
    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    if (!mountedRef.current) return;
    setLoading(true);
    setFetchError(null);
    setDataWarning(null);
    try {
      let allCoins: any[] = [];
      let usedFallback = false;

      // Attempt CoinGecko fetch with retry on 429
      for (let page = 1; page <= 2; page++) {
        if (signal.aborted) return;
        let fetched = false;
        for (let attempt = 0; attempt < 2 && !fetched; attempt++) {
          try {
            const res = await fetch(
              `/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page}&sparkline=true&price_change_percentage=24h`,
              { signal }
            );
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) { allCoins.push(...data); fetched = true; }
            } else if (res.status === 429 && attempt === 0) {
              console.warn(`CoinGecko page ${page} rate limited (429), retrying in 2s...`);
              await new Promise(r => setTimeout(r, 2000));
            } else {
              console.warn(`CoinGecko page ${page} returned ${res.status}`);
              break;
            }
          } catch (e: any) {
            if (e?.name === "AbortError" || signal.aborted) return;
            console.warn(`CoinGecko page ${page} attempt ${attempt + 1} failed:`, e);
            if (attempt === 0) {
              await new Promise(r => setTimeout(r, 2000));
            }
          }
        }
        if (page < 2 && allCoins.length > 0) await new Promise(r => setTimeout(r, 500));
      }

      if (signal.aborted || !mountedRef.current) return;

      // If CoinGecko failed entirely, use fallback symbols
      if (allCoins.length === 0) {
        console.warn("CoinGecko unavailable — using fallback symbol list for Binance-only analysis");
        allCoins = buildFallbackCoins();
        usedFallback = true;
      }

      // Quick Binance check
      const testK = await fetchKlines("BTC", "1h", 5, signal);
      if (signal.aborted || !mountedRef.current) return;

      if (testK.length === 0) {
        if (usedFallback) {
          if (mountedRef.current) {
            setFetchError("Impossible de récupérer les données de marché. Vérifiez votre connexion et réessayez.");
            setLoading(false);
          }
          return;
        }
        if (mountedRef.current) {
          setDataWarning("Les données Binance ne sont pas disponibles. Les alertes Telegram côté serveur continuent de fonctionner.");
        }
      }

      const clientSetups = await generateScalpSetups(allCoins, signal);
      if (signal.aborted || !mountedRef.current) return;

      const serverSetups = await fetchServerScalpCalls(signal);
      if (signal.aborted || !mountedRef.current) return;

      const merged = mergeSetups(clientSetups, serverSetups);

      if (mountedRef.current) {
        setTrades(merged);
        setLastUpdate(new Date().toLocaleTimeString("fr-FR"));

        // Signal tracking
        storeNewScalpSignals(merged);
        const priceMap = new Map<string, number>();
        for (const s of merged) {
          priceMap.set(s.symbol, s.currentPrice);
        }
        const updatedSignals = updateScalpSignalsWithPrices(priceMap);
        setPerfStats(computeScalpPerfStats(updatedSignals));

        if (usedFallback && merged.length > 0) {
          setDataWarning("⚠️ Données CoinGecko indisponibles — Analyse basée sur les données Binance uniquement");
        } else if (usedFallback && merged.length === 0) {
          setFetchError("Aucun signal n'a pu être généré. Les données de marché sont temporairement indisponibles.");
        }
      }

      // Register high-confidence calls (≥88%) — decoupled from main flow
      setTimeout(() => {
        registerScalpCallsToBackend(clientSetups.filter(s => s.confidence >= 88)).catch(() => {});
      }, 100);
    } catch (err: any) {
      if (err?.name === "AbortError" || signal.aborted) return;
      console.error("Scalp fetch error:", err);
      if (mountedRef.current) {
        setFetchError("Une erreur est survenue lors de l'analyse. Veuillez réessayer.");
        setTrades([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Load existing signals on mount
    const signals = loadScalpSignals();
    setPerfStats(computeScalpPerfStats(signals));

    fetchData();
    const interval = setInterval(fetchData, 3 * 60 * 1000);
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      clearInterval(interval);
    };
  }, [fetchData]);

  const handleClearTracking = () => {
    clearScalpSignals();
    setPerfStats({ total: 0, tp1Hits: 0, tp2Hits: 0, tp3Hits: 0, slHits: 0, pending: 0 });
  };

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

  const resolvedTotal = perfStats.tp1Hits + perfStats.tp2Hits + perfStats.tp3Hits + perfStats.slHits;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
        <PageHeader
          icon={<Zap className="w-7 h-7" />}
          title="Scalp Trading — Suivi de Flux"
          subtitle="EMA 8/20 + VWAP + Stochastique (9,3,1) — Filtre 4H, Biais H1, Entrée M5"
          accentColor="amber"
        />

        <div className="px-4 md:px-6 pb-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Signaux</p>
              <p className="text-xl font-black text-white">{filtered.length}</p>
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

          {/* Performance Tracking Section */}
          {perfStats.total > 0 && (
            <div className="mb-6 bg-gradient-to-r from-purple-500/[0.04] to-amber-500/[0.04] border border-purple-500/15 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-purple-400">Suivi des Signaux Scalp (localStorage)</h3>
                <span className="text-[10px] text-gray-500 ml-2">{perfStats.total} signaux • {perfStats.pending} en cours • expire après 2h</span>
                <button
                  onClick={handleClearTracking}
                  className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[10px] font-semibold text-red-400 transition-all"
                >
                  <Trash2 className="w-3 h-3" /> Réinitialiser
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total</p>
                  <p className="text-lg font-black text-white">{perfStats.total}</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] text-center">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-300 font-semibold">TP1 Hit (1:1)</p>
                  <p className="text-lg font-black text-emerald-300">{perfStats.tp1Hits}</p>
                  <p className="text-[9px] text-gray-500">{resolvedTotal > 0 ? `${Math.round(perfStats.tp1Hits / resolvedTotal * 100)}%` : "—"}</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] text-center">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">TP2 Hit (1:1.5)</p>
                  <p className="text-lg font-black text-emerald-400">{perfStats.tp2Hits}</p>
                  <p className="text-[9px] text-gray-500">{resolvedTotal > 0 ? `${Math.round(perfStats.tp2Hits / resolvedTotal * 100)}%` : "—"}</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] text-center">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold">TP3 Hit (1:2)</p>
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
                <option value={88}>≥ 88%</option>
                <option value={90}>≥ 90%</option>
                <option value={95}>≥ 95%</option>
              </select>
            </div>

            <span className="text-xs text-gray-500 ml-auto">MAJ: {lastUpdate}</span>
          </div>

          {/* Strategy Info */}
          <div className="mb-4 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl p-3">
            <p className="text-xs text-amber-300/80 flex items-center gap-2">
              <Zap className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Stratégie "Suivi de Flux" :</strong> Filtre 4H (EMA8/20 — rejet si tendance contraire) → Biais H1 (prix vs EMA20 + VWAP) → Entrée M5 (rebond EMA8/20 + prix vs VWAP M5 + Stochastique 9,3,1 en survente/surachat avec croisement).
                SL sous dernier creux / EMA20 (min 0.5%). TP1 = 1:1, TP2 = 1:1.5, TP3 = résistance/support ou 1:2.
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
                    {["#", "Crypto", "Type", "Entry", "SL", "TP1", "TP2", "TP3", "Biais H1", "Biais 4H", "Stoch (9,3,1)", "EMA M5", "VWAP", "Confiance", "R:R", ""].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && trades.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="text-center py-16">
                        <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Analyse EMA + VWAP + Stochastique en cours...</p>
                        <p className="text-xs text-gray-600 mt-1">Calcul sur 4H + H1 + M5 pour 30 cryptos</p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="text-center py-16">
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
                                {trade.side === "LONG" ? "-" : "+"}{trade.entry ? Math.abs((trade.stopLoss - trade.entry) / trade.entry * 100).toFixed(2) : "0.00"}%
                              </span>
                            </td>
                            {/* TP1 */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3 text-emerald-300" />
                                <span className="font-mono text-xs text-emerald-300 font-semibold">${formatPrice(trade.tp1)}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-[9px] text-emerald-300/60">1:1</span>
                                <ScalpWinrateBadge confidence={trade.confidence} tp={1} />
                              </div>
                            </td>
                            {/* TP2 */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3 text-emerald-400" />
                                <span className="font-mono text-xs text-emerald-400 font-semibold">${formatPrice(trade.tp2)}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-[9px] text-emerald-400/60">1:1.5</span>
                                <ScalpWinrateBadge confidence={trade.confidence} tp={2} />
                              </div>
                            </td>
                            {/* TP3 */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3 text-emerald-500" />
                                <span className="font-mono text-xs text-emerald-500 font-semibold">${formatPrice(trade.tp3)}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-[9px] text-emerald-500/60">1:2</span>
                                <ScalpWinrateBadge confidence={trade.confidence} tp={3} />
                              </div>
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
                            {/* 4H Bias */}
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                trade.h4Bias === "bullish"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : trade.h4Bias === "bearish"
                                  ? "bg-red-500/10 text-red-400"
                                  : "bg-gray-500/10 text-gray-400"
                              }`}>
                                {trade.h4Bias === "bullish" ? <TrendingUp className="w-3 h-3" /> : trade.h4Bias === "bearish" ? <TrendingDown className="w-3 h-3" /> : null}
                                {trade.h4Bias === "bullish" ? "Bull" : trade.h4Bias === "bearish" ? "Bear" : "Neutre"}
                              </span>
                            </td>
                            {/* Stochastic */}
                            <td className="px-3 py-3">
                              {trade.stoch_k != null && !isNaN(trade.stoch_k) ? (
                                <div className="flex flex-col">
                                  <span className={`text-xs font-bold ${
                                    trade.stoch_k < 20 ? "text-emerald-400" : trade.stoch_k > 80 ? "text-red-400" : "text-gray-300"
                                  }`}>
                                    K: {trade.stoch_k.toFixed(1)}
                                  </span>
                                  {trade.stoch_d != null && !isNaN(trade.stoch_d) && (
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
                              <td colSpan={16} className="px-4 py-4 bg-white/[0.01]">
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
                                        <span className="text-xs text-gray-400">Biais 4H</span>
                                        <span className={`text-xs font-bold ${trade.h4Bias === "bullish" ? "text-emerald-400" : trade.h4Bias === "bearish" ? "text-red-400" : "text-gray-400"}`}>
                                          {trade.h4Bias === "bullish" ? "🟢 Haussier" : trade.h4Bias === "bearish" ? "🔴 Baissier" : "⚪ Neutre"}
                                        </span>
                                      </div>
                                      {trade.ema8_h4 !== null && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-400">EMA8 4H</span>
                                          <span className="text-xs font-mono text-cyan-400">${formatPrice(trade.ema8_h4)}</span>
                                        </div>
                                      )}
                                      {trade.ema20_h4 !== null && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-400">EMA20 4H</span>
                                          <span className="text-xs font-mono text-orange-400">${formatPrice(trade.ema20_h4)}</span>
                                        </div>
                                      )}
                                      <div className="border-t border-white/[0.06] pt-2 mt-2" />
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
                                            trade.stoch_k != null && !isNaN(trade.stoch_k) && trade.stoch_k < 20 ? "text-emerald-400" : trade.stoch_k != null && !isNaN(trade.stoch_k) && trade.stoch_k > 80 ? "text-red-400" : "text-gray-300"
                                          }`}>
                                            {trade.stoch_k != null && !isNaN(trade.stoch_k) ? trade.stoch_k.toFixed(1) : "N/A"}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                          <span className="text-xs text-gray-400">Stoch D</span>
                                          <span className="text-xs font-mono text-gray-300">
                                            {trade.stoch_d != null && !isNaN(trade.stoch_d) ? trade.stoch_d.toFixed(1) : "N/A"}
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
                                          <span className={`text-xs font-bold ${(trade.change24h ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                            {(trade.change24h ?? 0) >= 0 ? "+" : ""}{(trade.change24h != null && !isNaN(trade.change24h)) ? trade.change24h.toFixed(2) : "0.00"}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Winrate Estimates Detail */}
                                <div className="mt-3 bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">📈 Estimation Winrate (Confiance {trade.confidence}%)</p>
                                  <div className="flex items-center gap-3 flex-wrap text-[10px]">
                                    <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 font-mono">
                                      TP1 (1:1): WR ~{getScalpWinrateForTP(trade.confidence, 1)}%
                                    </span>
                                    <span className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-400/25 text-emerald-400 font-mono">
                                      TP2 (1:1.5): WR ~{getScalpWinrateForTP(trade.confidence, 2)}%
                                    </span>
                                    <span className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 font-mono">
                                      TP3 (1:2): WR ~{getScalpWinrateForTP(trade.confidence, 3)}%
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
                                    <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 font-mono">
                                      TP1: ${formatPrice(trade.tp1)} (1:1) <ScalpWinrateBadge confidence={trade.confidence} tp={1} />
                                    </span>
                                    <span className="text-gray-600">→</span>
                                    <span className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-400/25 text-emerald-400 font-mono">
                                      TP2: ${formatPrice(trade.tp2)} (1:1.5) <ScalpWinrateBadge confidence={trade.confidence} tp={2} />
                                    </span>
                                    <span className="text-gray-600">→</span>
                                    <span className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 font-mono font-bold">
                                      TP3: ${formatPrice(trade.tp3)} (1:2) <ScalpWinrateBadge confidence={trade.confidence} tp={3} />
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
              Filtre 4H (rejet si tendance contraire), biais directionnel H1, entrée précise M5. SL sous dernier creux/EMA20 (min 0.5%), TP ratio 1:1 à 1:2.
              Le VWAP est utilisé par les algorithmes institutionnels — trader avec le VWAP = trader avec "l'argent intelligent".
              Les winrates estimés sont basés sur des moyennes historiques indicatives.
              Ces signaux ne constituent pas des conseils financiers.
            </p>
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}