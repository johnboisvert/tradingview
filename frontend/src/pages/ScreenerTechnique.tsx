import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import {
  Search, SlidersHorizontal, TrendingUp, TrendingDown, Zap,
  RefreshCw, ChevronUp, ChevronDown, Target, Activity,
  BarChart3, AlertTriangle, CheckCircle, XCircle, Filter,
  Star, Download, ExternalLink, ChevronRight
} from "lucide-react";
import Footer from "@/components/Footer";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface CoinScreener {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  ath: number;
  ath_change_percentage: number;
  sparkline_in_7d?: { price: number[] };
  // Computed indicators
  rsi?: number;
  macd?: { value: number; signal: number; histogram: number; crossover: "bullish" | "bearish" | "none" };
  ema?: { ema9: number; ema21: number; ema50: number; goldenCross: boolean; deathCross: boolean; aboveEMA: boolean };
  bollinger?: { upper: number; middle: number; lower: number; position: "above" | "below" | "inside"; squeeze: boolean };
  multiTF?: { h24: "bullish" | "bearish" | "neutral"; d3: "bullish" | "bearish" | "neutral"; d7: "bullish" | "bearish" | "neutral" };
  trend?: "bullish" | "bearish" | "neutral";
  signal?: "BUY" | "SELL" | "NEUTRAL";
  score?: number;
  volumeRatio?: number;
  volatility?: number;
  distFromATH?: number;
  supports?: { price: number; strength: string }[];
  resistances?: { price: number; strength: string }[];
}

type CategoryKey = "all" | "defi" | "layer1" | "layer2" | "gaming" | "ai" | "meme";

interface Filters {
  rsiMin: number;
  rsiMax: number;
  change24hMin: number;
  change24hMax: number;
  volumeRatioMin: number;
  trend: "all" | "bullish" | "bearish" | "neutral";
  signal: "all" | "BUY" | "SELL" | "NEUTRAL";
  minMarketCap: number;
  scoreMin: number;
  category: CategoryKey;
  favoritesOnly: boolean;
}

const DEFAULT_FILTERS: Filters = {
  rsiMin: 0, rsiMax: 100,
  change24hMin: -100, change24hMax: 100,
  volumeRatioMin: 0,
  trend: "all", signal: "all",
  minMarketCap: 0, scoreMin: 0,
  category: "all",
  favoritesOnly: false,
};

// ═══════════════════════════════════════════════════════════════
// CATEGORY MAPPINGS
// ═══════════════════════════════════════════════════════════════

const CATEGORY_MAP: Record<string, CategoryKey> = {
  // DeFi
  uniswap: "defi", aave: "defi", "compound-governance-token": "defi", "maker": "defi",
  "curve-dao-token": "defi", "lido-dao": "defi", "pancakeswap-token": "defi", "sushi": "defi",
  "1inch": "defi", "yearn-finance": "defi", "synthetix-network-token": "defi", "convex-finance": "defi",
  "rocket-pool": "defi", "frax-share": "defi", "dydx": "defi", "jupiter-exchange-solana": "defi",
  "raydium": "defi", "orca": "defi", "pendle": "defi", "ethena": "defi",
  // Layer 1
  bitcoin: "layer1", ethereum: "layer1", solana: "layer1", cardano: "layer1",
  avalanche: "layer1", polkadot: "layer1", "near": "layer1", "cosmos": "layer1",
  "algorand": "layer1", "tezos": "layer1", "aptos": "layer1", "sui": "layer1",
  "sei-network": "layer1", "toncoin": "layer1", "internet-computer": "layer1",
  "hedera-hashgraph": "layer1", "kaspa": "layer1", "celestia": "layer1",
  // Layer 2
  "matic-network": "layer2", "arbitrum": "layer2", "optimism": "layer2",
  "starknet": "layer2", "immutable-x": "layer2", "mantle": "layer2",
  "metis-token": "layer2", "zksync": "layer2", "base": "layer2", "blast": "layer2",
  // Gaming
  "axie-infinity": "gaming", "the-sandbox": "gaming", "decentraland": "gaming",
  "gala": "gaming", "illuvium": "gaming", "enjincoin": "gaming",
  "ronin": "gaming", "beam-2": "gaming",
  "pixels": "gaming", "portal-2": "gaming", "xai": "gaming",
  // AI
  "render-token": "ai", "fetch-ai": "ai", "singularitynet": "ai",
  "ocean-protocol": "ai", "arkham": "ai", "bittensor": "ai",
  "worldcoin-wld": "ai", "artificial-superintelligence-alliance": "ai",
  "akash-network": "ai", "nosana": "ai", "golem": "ai",
  // Meme
  "dogecoin": "meme", "shiba-inu": "meme", "pepe": "meme",
  "floki": "meme", "bonk": "meme", "dogwifcoin": "meme",
  "brett": "meme", "book-of-meme": "meme", "memecoin-2": "meme",
  "cat-in-a-dogs-world": "meme", "popcat": "meme", "mog-coin": "meme",
};

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  all: "🌐 Toutes",
  defi: "🏦 DeFi",
  layer1: "⛓️ Layer 1",
  layer2: "🔗 Layer 2",
  gaming: "🎮 Gaming",
  ai: "🤖 AI",
  meme: "🐸 Meme",
};

// ═══════════════════════════════════════════════════════════════
// TECHNICAL INDICATOR CALCULATIONS
// ═══════════════════════════════════════════════════════════════

function computeEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [];
  // SMA for first value
  let sum = 0;
  for (let i = 0; i < period; i++) sum += prices[i];
  ema.push(sum / period);
  for (let i = period; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[ema.length - 1] * (1 - k));
  }
  return ema;
}

function computeRSI(prices: number[]): number {
  if (!prices || prices.length < 15) return 50;
  const changes = prices.slice(-15).map((p, i, arr) => i === 0 ? 0 : p - arr[i - 1]).slice(1);
  const gains = changes.filter(c => c > 0);
  const losses = changes.filter(c => c < 0).map(Math.abs);
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0.001;
  const rs = avgGain / avgLoss;
  return Math.round(100 - 100 / (1 + rs));
}

function computeMACD(prices: number[]): { value: number; signal: number; histogram: number; crossover: "bullish" | "bearish" | "none" } {
  if (!prices || prices.length < 35) return { value: 0, signal: 0, histogram: 0, crossover: "none" };
  const ema12 = computeEMA(prices, 12);
  const ema26 = computeEMA(prices, 26);
  // Align arrays
  const offset = ema12.length - ema26.length;
  const macdLine: number[] = [];
  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i]);
  }
  if (macdLine.length < 9) return { value: 0, signal: 0, histogram: 0, crossover: "none" };
  const signalLine = computeEMA(macdLine, 9);
  const macdVal = macdLine[macdLine.length - 1];
  const sigVal = signalLine[signalLine.length - 1];
  const histogram = macdVal - sigVal;

  // Check for crossover in last 3 bars
  let crossover: "bullish" | "bearish" | "none" = "none";
  if (macdLine.length >= 3 && signalLine.length >= 3) {
    const prevMacd = macdLine[macdLine.length - 3];
    const prevSig = signalLine[signalLine.length - 3];
    if (prevMacd < prevSig && macdVal > sigVal) crossover = "bullish";
    else if (prevMacd > prevSig && macdVal < sigVal) crossover = "bearish";
  }

  return { value: macdVal, signal: sigVal, histogram, crossover };
}

function computeEMAIndicators(prices: number[], currentPrice: number): { ema9: number; ema21: number; ema50: number; goldenCross: boolean; deathCross: boolean; aboveEMA: boolean } {
  const defaultResult = { ema9: currentPrice, ema21: currentPrice, ema50: currentPrice, goldenCross: false, deathCross: false, aboveEMA: true };
  if (!prices || prices.length < 55) return defaultResult;

  const ema9Arr = computeEMA(prices, 9);
  const ema21Arr = computeEMA(prices, 21);
  const ema50Arr = computeEMA(prices, 50);

  if (ema9Arr.length < 3 || ema21Arr.length < 3 || ema50Arr.length < 1) return defaultResult;

  const ema9 = ema9Arr[ema9Arr.length - 1];
  const ema21 = ema21Arr[ema21Arr.length - 1];
  const ema50 = ema50Arr[ema50Arr.length - 1];

  // Golden Cross: EMA9 crosses above EMA21 recently
  const offset9_21 = ema9Arr.length - ema21Arr.length;
  const prevEma9 = ema9Arr[ema9Arr.length - 5] ?? ema9;
  const prevEma21 = ema21Arr[ema21Arr.length - 5] ?? ema21;
  const goldenCross = prevEma9 < prevEma21 && ema9 > ema21;
  const deathCross = prevEma9 > prevEma21 && ema9 < ema21;
  const aboveEMA = currentPrice > ema9 && currentPrice > ema21;

  return { ema9, ema21, ema50, goldenCross, deathCross, aboveEMA };
}

function computeBollinger(prices: number[]): { upper: number; middle: number; lower: number; position: "above" | "below" | "inside"; squeeze: boolean } {
  const defaultResult = { upper: 0, middle: 0, lower: 0, position: "inside" as const, squeeze: false };
  if (!prices || prices.length < 20) return defaultResult;

  const period = 20;
  const slice = prices.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  const upper = sma + 2 * stdDev;
  const lower = sma - 2 * stdDev;
  const currentPrice = prices[prices.length - 1];

  const bandWidth = (upper - lower) / sma;
  const squeeze = bandWidth < 0.04; // < 4% bandwidth = squeeze

  let position: "above" | "below" | "inside" = "inside";
  if (currentPrice > upper) position = "above";
  else if (currentPrice < lower) position = "below";

  return { upper, middle: sma, lower, position, squeeze };
}

function computeMultiTF(prices: number[]): { h24: "bullish" | "bearish" | "neutral"; d3: "bullish" | "bearish" | "neutral"; d7: "bullish" | "bearish" | "neutral" } {
  const def: "bullish" | "bearish" | "neutral" = "neutral";
  if (!prices || prices.length < 24) return { h24: def, d3: def, d7: def };

  const getTrend = (slice: number[]): "bullish" | "bearish" | "neutral" => {
    if (slice.length < 3) return "neutral";
    const first = slice[0];
    const last = slice[slice.length - 1];
    const change = ((last - first) / first) * 100;
    if (change > 1) return "bullish";
    if (change < -1) return "bearish";
    return "neutral";
  };

  const h24 = getTrend(prices.slice(-24));
  const d3 = getTrend(prices.slice(-72));
  const d7 = getTrend(prices);

  return { h24, d3, d7 };
}

function computeSR(prices: number[], currentPrice: number, high24h: number, low24h: number, ath: number): { supports: { price: number; strength: string }[]; resistances: { price: number; strength: string }[] } {
  const supports: { price: number; strength: string }[] = [];
  const resistances: { price: number; strength: string }[] = [];

  if (low24h && low24h < currentPrice) supports.push({ price: low24h, strength: "major" });
  if (high24h && high24h > currentPrice) resistances.push({ price: high24h, strength: "major" });
  if (ath && ath > currentPrice * 1.02) resistances.push({ price: ath, strength: "major" });

  if (prices && prices.length > 20) {
    const windowSize = 6;
    for (let i = windowSize; i < prices.length - windowSize; i++) {
      let isMin = true, isMax = true;
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j === i) continue;
        if (prices[j] <= prices[i]) isMin = false;
        if (prices[j] >= prices[i]) isMax = false;
      }
      if (isMin && prices[i] < currentPrice * 0.99) {
        supports.push({ price: prices[i], strength: Math.abs(prices[i] - currentPrice) / currentPrice < 0.03 ? "major" : "minor" });
      }
      if (isMax && prices[i] > currentPrice * 1.01) {
        resistances.push({ price: prices[i], strength: Math.abs(prices[i] - currentPrice) / currentPrice < 0.03 ? "major" : "minor" });
      }
    }
  }

  supports.sort((a, b) => b.price - a.price);
  resistances.sort((a, b) => a.price - b.price);

  // Dedup within 1%
  const dedup = (arr: { price: number; strength: string }[]) => {
    const result: { price: number; strength: string }[] = [];
    for (const item of arr) {
      if (!result.some(r => Math.abs(r.price - item.price) / item.price < 0.01)) result.push(item);
    }
    return result;
  };

  return { supports: dedup(supports).slice(0, 3), resistances: dedup(resistances).slice(0, 3) };
}

// Enhanced scoring with MACD, EMA, Bollinger
function computeSignalEnhanced(
  rsi: number, change24h: number, volumeRatio: number, change7d: number,
  macd: CoinScreener["macd"], ema: CoinScreener["ema"], bollinger: CoinScreener["bollinger"]
): { signal: "BUY" | "SELL" | "NEUTRAL"; score: number; trend: "bullish" | "bearish" | "neutral" } {
  let score = 50;

  // RSI contribution (max ±20)
  if (rsi < 30) score += 20;
  else if (rsi < 40) score += 10;
  else if (rsi > 70) score -= 20;
  else if (rsi > 60) score -= 10;

  // 24h change (max ±10)
  if (change24h > 3) score += 10;
  else if (change24h > 0) score += 5;
  else if (change24h < -3) score -= 10;
  else if (change24h < 0) score -= 5;

  // Volume ratio (max +15)
  if (volumeRatio > 2) score += 15;
  else if (volumeRatio > 1.5) score += 8;

  // 7d change (max ±10)
  if (change7d > 10) score += 10;
  else if (change7d > 0) score += 5;
  else if (change7d < -10) score -= 10;
  else if (change7d < 0) score -= 5;

  // MACD contribution (max ±12)
  if (macd) {
    if (macd.histogram > 0) score += 6;
    else if (macd.histogram < 0) score -= 6;
    if (macd.crossover === "bullish") score += 6;
    else if (macd.crossover === "bearish") score -= 6;
  }

  // EMA contribution (max ±10)
  if (ema) {
    if (ema.goldenCross) score += 10;
    else if (ema.deathCross) score -= 10;
    else if (ema.aboveEMA) score += 5;
    else score -= 5;
  }

  // Bollinger contribution (max ±8)
  if (bollinger) {
    if (bollinger.position === "below") score += 8; // oversold
    else if (bollinger.position === "above") score -= 8; // overbought
    if (bollinger.squeeze) score += 3; // potential breakout
  }

  score = Math.max(0, Math.min(100, score));
  const signal: "BUY" | "SELL" | "NEUTRAL" = score >= 65 ? "BUY" : score <= 35 ? "SELL" : "NEUTRAL";
  const trend: "bullish" | "bearish" | "neutral" = change24h > 1 && change7d > 0 ? "bullish" : change24h < -1 && change7d < 0 ? "bearish" : "neutral";
  return { signal, score, trend };
}

// ═══════════════════════════════════════════════════════════════
// FORMATTING HELPERS
// ═══════════════════════════════════════════════════════════════

function formatPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(6)}`;
}

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function RSIBar({ value }: { value: number }) {
  const color = value < 30 ? "#10B981" : value > 70 ? "#EF4444" : value < 45 ? "#6EE7B7" : value > 55 ? "#FCA5A5" : "#94A3B8";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 65 ? "#10B981" : score <= 35 ? "#EF4444" : "#94A3B8";
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg width="40" height="40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[10px] font-extrabold" style={{ color }}>{score}</span>
    </div>
  );
}

function MACDCell({ macd }: { macd: CoinScreener["macd"] }) {
  if (!macd) return <span className="text-xs text-gray-600">—</span>;
  const isBullish = macd.histogram > 0;
  const isCrossover = macd.crossover !== "none";
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs font-bold ${isBullish ? "text-emerald-400" : "text-red-400"}`}>
        {isBullish ? "🟢" : "🔴"}
      </span>
      {isCrossover && (
        <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${macd.crossover === "bullish" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
          ⚡X
        </span>
      )}
    </div>
  );
}

function EMACell({ ema }: { ema: CoinScreener["ema"] }) {
  if (!ema) return <span className="text-xs text-gray-600">—</span>;
  if (ema.goldenCross) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">✨ Golden</span>;
  if (ema.deathCross) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">💀 Death</span>;
  return <span className={`text-xs font-bold ${ema.aboveEMA ? "text-emerald-400" : "text-red-400"}`}>{ema.aboveEMA ? "▲" : "▼"}</span>;
}

function MultiTFDots({ multiTF }: { multiTF: CoinScreener["multiTF"] }) {
  if (!multiTF) return <span className="text-xs text-gray-600">—</span>;
  const dotColor = (t: string) => t === "bullish" ? "bg-emerald-400" : t === "bearish" ? "bg-red-400" : "bg-gray-500";
  const labels = ["24h", "3j", "7j"];
  const vals = [multiTF.h24, multiTF.d3, multiTF.d7];
  const bullCount = vals.filter(v => v === "bullish").length;
  return (
    <div className="flex items-center gap-1" title={`24h: ${multiTF.h24}, 3j: ${multiTF.d3}, 7j: ${multiTF.d7}`}>
      {vals.map((v, i) => (
        <div key={labels[i]} className={`w-2.5 h-2.5 rounded-full ${dotColor(v)}`} title={`${labels[i]}: ${v}`} />
      ))}
      <span className="text-[9px] text-gray-500 ml-0.5">{bullCount}/3</span>
    </div>
  );
}

function BollingerCell({ bollinger }: { bollinger: CoinScreener["bollinger"] }) {
  if (!bollinger) return <span className="text-xs text-gray-600">—</span>;
  if (bollinger.squeeze) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">🔥 Squeeze</span>;
  if (bollinger.position === "above") return <span className="text-[10px] font-bold text-red-400">↑ Sur-acheté</span>;
  if (bollinger.position === "below") return <span className="text-[10px] font-bold text-emerald-400">↓ Sur-vendu</span>;
  return <span className="text-[10px] text-gray-500">— Normal</span>;
}

function MiniSparkline({ prices, width = 80, height = 28 }: { prices: number[]; width?: number; height?: number }) {
  if (!prices || prices.length < 5) return <div className="w-20 h-7 bg-white/[0.02] rounded" />;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const step = width / (prices.length - 1);
  const points = prices.map((p, i) => `${i * step},${height - ((p - min) / range) * (height - 4) - 2}`).join(" ");
  const isUp = prices[prices.length - 1] >= prices[0];
  const color = isUp ? "#10B981" : "#EF4444";
  return (
    <svg width={width} height={height} className="block">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPANDED DETAIL PANEL
// ═══════════════════════════════════════════════════════════════

function ExpandedDetail({ coin }: { coin: CoinScreener }) {
  const prices = coin.sparkline_in_7d?.price || [];

  return (
    <tr>
      <td colSpan={13} className="p-0">
        <div className="bg-[#0a0f1a] border-t border-b border-cyan-500/20 px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Sparkline Chart */}
            <div className="md:col-span-1 bg-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Graphique 7 jours</h4>
              <MiniSparkline prices={prices} width={200} height={80} />
              <div className="flex justify-between mt-2 text-[10px] text-gray-600">
                <span>7j ago</span>
                <span>Maintenant</span>
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="md:col-span-1 bg-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Indicateurs Techniques</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">RSI (14)</span>
                  <RSIBar value={coin.rsi ?? 50} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">MACD</span>
                  <div className="flex items-center gap-2">
                    <MACDCell macd={coin.macd} />
                    <span className="text-[10px] text-gray-600">H: {coin.macd?.histogram?.toFixed(4) ?? "—"}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">EMA 9/21/50</span>
                  <EMACell ema={coin.ema} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Bollinger</span>
                  <BollingerCell bollinger={coin.bollinger} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Multi-TF</span>
                  <MultiTFDots multiTF={coin.multiTF} />
                </div>
              </div>
            </div>

            {/* Support & Resistance */}
            <div className="md:col-span-1 bg-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Supports & Résistances</h4>
              <div className="space-y-1.5">
                {(coin.resistances || []).map((r, i) => (
                  <div key={`r-${i}`} className="flex justify-between items-center">
                    <span className="text-[10px] text-red-400 font-bold">R{i + 1} {r.strength === "major" ? "🔴" : "⚪"}</span>
                    <span className="text-xs font-bold text-red-300">{formatPrice(r.price)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-1 border-y border-white/[0.06]">
                  <span className="text-[10px] text-cyan-400 font-bold">Prix actuel</span>
                  <span className="text-xs font-bold text-cyan-300">{formatPrice(coin.current_price)}</span>
                </div>
                {(coin.supports || []).map((s, i) => (
                  <div key={`s-${i}`} className="flex justify-between items-center">
                    <span className="text-[10px] text-emerald-400 font-bold">S{i + 1} {s.strength === "major" ? "🟢" : "⚪"}</span>
                    <span className="text-xs font-bold text-emerald-300">{formatPrice(s.price)}</span>
                  </div>
                ))}
                {(!coin.supports || coin.supports.length === 0) && (!coin.resistances || coin.resistances.length === 0) && (
                  <span className="text-[10px] text-gray-600">Données insuffisantes</span>
                )}
              </div>
            </div>

            {/* Market Data */}
            <div className="md:col-span-1 bg-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Données Marché</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-500">Market Cap</span>
                  <span className="text-xs font-bold">{formatNum(coin.market_cap)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-500">Volume 24h</span>
                  <span className="text-xs font-bold">{formatNum(coin.total_volume)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-500">High 24h</span>
                  <span className="text-xs font-bold text-emerald-400">{formatPrice(coin.high_24h)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-500">Low 24h</span>
                  <span className="text-xs font-bold text-red-400">{formatPrice(coin.low_24h)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-500">ATH</span>
                  <span className="text-xs font-bold">{formatPrice(coin.ath)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-500">Dist. ATH</span>
                  <span className="text-xs font-bold text-red-400">{coin.distFromATH?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-500">Volatilité</span>
                  <span className="text-xs font-bold">{coin.volatility?.toFixed(1)}%</span>
                </div>
              </div>
              <a href={`/graphiques?coin=${coin.id}`} className="flex items-center gap-1 mt-3 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors">
                <ExternalLink className="w-3 h-3" /> Voir le graphique complet
              </a>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════════
// CSV EXPORT
// ═══════════════════════════════════════════════════════════════

function exportCSV(coins: CoinScreener[]) {
  const headers = ["Nom", "Symbole", "Prix", "24h%", "7j%", "RSI", "MACD", "EMA", "Bollinger", "Score", "Signal", "Tendance", "Volume", "Market Cap"];
  const rows = coins.map(c => [
    c.name, c.symbol.toUpperCase(), c.current_price,
    c.price_change_percentage_24h?.toFixed(2),
    c.price_change_percentage_7d_in_currency?.toFixed(2) ?? "",
    c.rsi ?? "",
    c.macd ? (c.macd.histogram > 0 ? "Haussier" : "Baissier") : "",
    c.ema ? (c.ema.goldenCross ? "Golden Cross" : c.ema.deathCross ? "Death Cross" : c.ema.aboveEMA ? "Au-dessus" : "En-dessous") : "",
    c.bollinger ? (c.bollinger.squeeze ? "Squeeze" : c.bollinger.position) : "",
    c.score ?? "",
    c.signal ?? "",
    c.trend ?? "",
    c.total_volume,
    c.market_cap,
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `screener_technique_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════
// FAVORITES (localStorage)
// ═══════════════════════════════════════════════════════════════

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem("screener_favorites");
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function saveFavorites(favs: Set<string>) {
  localStorage.setItem("screener_favorites", JSON.stringify([...favs]));
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ScreenerTechnique() {
  const [coins, setCoins] = useState<CoinScreener[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof CoinScreener>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const PER_PAGE = 25;

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavorites(next);
      return next;
    });
  }, []);

  const fetchCoins = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch 10 pages of 50 = 500 coins with 1h, 7d, 30d changes
      const pageNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const results = await Promise.all(pageNumbers.map(p =>
        fetch(`/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=${p}&sparkline=true&price_change_percentage=1h,7d,30d`, { signal: AbortSignal.timeout(20000) })
          .then(r => r.ok ? r.json() : [])
          .catch(() => [])
      ));
      const raw: CoinScreener[] = results.flat();
      if (raw.length === 0) throw new Error("No data");

      const processed = raw.map(c => {
        const prices = c.sparkline_in_7d?.price || [];
        const rsi = computeRSI(prices);
        const macd = computeMACD(prices);
        const ema = computeEMAIndicators(prices, c.current_price);
        const bollinger = computeBollinger(prices);
        const multiTF = computeMultiTF(prices);
        const { supports, resistances } = computeSR(prices, c.current_price, c.high_24h, c.low_24h, c.ath);

        const avgVol = c.market_cap > 0 ? c.total_volume / c.market_cap * 100 : 1;
        const volumeRatio = avgVol > 0 ? (c.total_volume / c.market_cap) / (avgVol / 100) : 1;
        const change7d = c.price_change_percentage_7d_in_currency || 0;
        const { signal, score, trend } = computeSignalEnhanced(rsi, c.price_change_percentage_24h, volumeRatio, change7d, macd, ema, bollinger);
        const volatility = c.high_24h > 0 ? ((c.high_24h - c.low_24h) / c.low_24h) * 100 : 0;
        const distFromATH = c.ath_change_percentage || 0;

        return {
          ...c, rsi, macd, ema, bollinger, multiTF,
          signal, score, trend,
          volumeRatio: Math.round(volumeRatio * 10) / 10,
          volatility: Math.round(volatility * 10) / 10,
          distFromATH: Math.round(distFromATH * 10) / 10,
          supports, resistances,
        };
      });

      setCoins(processed);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoins(); const i = setInterval(fetchCoins, 120000); return () => clearInterval(i); }, [fetchCoins]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.rsiMin !== 0 || filters.rsiMax !== 100) count++;
    if (filters.change24hMin !== -100 || filters.change24hMax !== 100) count++;
    if (filters.volumeRatioMin !== 0) count++;
    if (filters.trend !== "all") count++;
    if (filters.signal !== "all") count++;
    if (filters.minMarketCap !== 0) count++;
    if (filters.scoreMin !== 0) count++;
    if (filters.category !== "all") count++;
    if (filters.favoritesOnly) count++;
    return count;
  }, [filters]);

  const filtered = useMemo(() => coins.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    if ((c.rsi ?? 50) < filters.rsiMin || (c.rsi ?? 50) > filters.rsiMax) return false;
    if (c.price_change_percentage_24h < filters.change24hMin || c.price_change_percentage_24h > filters.change24hMax) return false;
    if ((c.volumeRatio ?? 1) < filters.volumeRatioMin) return false;
    if (filters.trend !== "all" && c.trend !== filters.trend) return false;
    if (filters.signal !== "all" && c.signal !== filters.signal) return false;
    if (c.market_cap < filters.minMarketCap * 1e6) return false;
    if ((c.score ?? 50) < filters.scoreMin) return false;
    if (filters.category !== "all") {
      const cat = CATEGORY_MAP[c.id];
      if (cat !== filters.category) return false;
    }
    if (filters.favoritesOnly && !favorites.has(c.id)) return false;
    return true;
  }), [coins, search, filters, favorites]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const va = (a[sortBy] as number) ?? 0;
    const vb = (b[sortBy] as number) ?? 0;
    return sortDir === "desc" ? vb - va : va - vb;
  }), [filtered, sortBy, sortDir]);

  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(sorted.length / PER_PAGE);

  const toggleSort = (key: keyof CoinScreener) => {
    if (sortBy === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: keyof CoinScreener }) => sortBy === col
    ? (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)
    : <ChevronDown className="w-3 h-3 opacity-20" />;

  const buyCount = coins.filter(c => c.signal === "BUY").length;
  const sellCount = coins.filter(c => c.signal === "SELL").length;

  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#070B14]">
        <PageHeader
          icon={<Target className="w-6 h-6" />}
          title="Screener Technique Pro"
          subtitle="Filtrez et triez 500 cryptos avec 7 indicateurs techniques : RSI, MACD, EMA, Bollinger Bands, multi-timeframe, supports/résistances. Cliquez sur une ligne pour l'analyse détaillée."
          accentColor="cyan"
          steps={[
            { n: "1", title: "Appliquez vos filtres", desc: "RSI survendu, MACD haussier, Golden Cross, Bollinger Squeeze — combinez les indicateurs pour trouver les meilleurs setups." },
            { n: "2", title: "Triez les résultats", desc: "Cliquez sur les en-têtes de colonnes pour trier par score IA, variation, MACD, EMA ou volume." },
            { n: "3", title: "Analysez en détail", desc: "Cliquez sur une ligne pour voir tous les indicateurs, les supports/résistances et le graphique 7 jours." },
          ]}
        />

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Screener Technique Pro
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {coins.length} cryptos analysées • 7 indicateurs • Mise à jour auto
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">{buyCount} BUY</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-bold text-red-400">{sellCount} SELL</span>
            </div>
            <button onClick={() => exportCSV(sorted)} title="Exporter CSV"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-sm font-semibold transition-all">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">CSV</span>
            </button>
            <button onClick={fetchCoins} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Charger"}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map(cat => (
            <button key={cat} onClick={() => { setFilters(f => ({ ...f, category: cat })); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.category === cat ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : "bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]"}`}>
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
          <button onClick={() => { setFilters(f => ({ ...f, favoritesOnly: !f.favoritesOnly })); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${filters.favoritesOnly ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300" : "bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300"}`}>
            <Star className={`w-3 h-3 ${filters.favoritesOnly ? "fill-yellow-400" : ""}`} />
            Favoris ({favorites.size})
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl mb-5 overflow-hidden">
          <button onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-all">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold">Filtres Techniques</span>
              <span className="text-xs text-gray-600">({filtered.length} résultats)</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">{activeFilterCount} actif{activeFilterCount > 1 ? "s" : ""}</span>
              )}
            </div>
            {showFilters ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          {showFilters && (
            <div className="px-5 pb-5 border-t border-white/[0.04]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">RSI Min — Max</label>
                  <div className="flex gap-2">
                    <input type="number" min={0} max={100} value={filters.rsiMin} onChange={e => setFilters(f => ({ ...f, rsiMin: +e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40" />
                    <input type="number" min={0} max={100} value={filters.rsiMax} onChange={e => setFilters(f => ({ ...f, rsiMax: +e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Variation 24h (%)</label>
                  <div className="flex gap-2">
                    <input type="number" value={filters.change24hMin} onChange={e => setFilters(f => ({ ...f, change24hMin: +e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40" />
                    <input type="number" value={filters.change24hMax} onChange={e => setFilters(f => ({ ...f, change24hMax: +e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Ratio Volume Min</label>
                  <input type="number" step={0.1} min={0} value={filters.volumeRatioMin} onChange={e => setFilters(f => ({ ...f, volumeRatioMin: +e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Score IA Min</label>
                  <input type="number" min={0} max={100} value={filters.scoreMin} onChange={e => setFilters(f => ({ ...f, scoreMin: +e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Tendance</label>
                  <select value={filters.trend} onChange={e => setFilters(f => ({ ...f, trend: e.target.value as Filters["trend"] }))}
                    className="w-full bg-[#0d1117] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40">
                    <option value="all">Toutes</option>
                    <option value="bullish">🟢 Haussière</option>
                    <option value="bearish">🔴 Baissière</option>
                    <option value="neutral">⚪ Neutre</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Signal</label>
                  <select value={filters.signal} onChange={e => setFilters(f => ({ ...f, signal: e.target.value as Filters["signal"] }))}
                    className="w-full bg-[#0d1117] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40">
                    <option value="all">Tous</option>
                    <option value="BUY">✅ BUY</option>
                    <option value="SELL">❌ SELL</option>
                    <option value="NEUTRAL">➖ NEUTRAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Market Cap Min ($M)</label>
                  <input type="number" min={0} value={filters.minMarketCap} onChange={e => setFilters(f => ({ ...f, minMarketCap: +e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40" />
                </div>
                <div className="flex items-end">
                  <button onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="w-full py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-gray-400 transition-all border border-white/[0.06]">
                    Réinitialiser
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex gap-2 mt-4 flex-wrap">
                <span className="text-xs text-gray-600 font-bold self-center">Presets:</span>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, rsiMax: 35, signal: "BUY", trend: "bullish" })}
                  className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all">
                  🎯 Survendu + Haussier
                </button>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, rsiMin: 65, signal: "SELL", trend: "bearish" })}
                  className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">
                  🔻 Suracheté + Baissier
                </button>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, volumeRatioMin: 2, change24hMin: 3 })}
                  className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all">
                  🚀 Volume Explosif
                </button>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, scoreMin: 70 })}
                  className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-all">
                  🏆 Score IA 70+
                </button>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, scoreMin: 60 })}
                  className="px-3 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold hover:bg-yellow-500/20 transition-all">
                  ✨ Golden Cross
                </button>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, scoreMin: 55 })}
                  className="px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold hover:bg-orange-500/20 transition-all">
                  🔥 Bollinger Squeeze
                </button>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, scoreMin: 60 })}
                  className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition-all">
                  ⚡ MACD Crossover
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input placeholder="Rechercher une crypto..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[#0d1117] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/30" />
        </div>

        {/* Table */}
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl overflow-hidden">
          {loading && coins.length === 0 ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
              <span className="text-gray-500 text-sm">Chargement de 500 cryptos...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="py-3 px-2 w-8"></th>
                    {[
                      { key: "name", label: "Actif" },
                      { key: "current_price", label: "Prix" },
                      { key: "price_change_percentage_24h", label: "24h" },
                      { key: "price_change_percentage_7d_in_currency", label: "7j" },
                      { key: "rsi", label: "RSI" },
                      { key: "macd", label: "MACD" },
                      { key: "ema", label: "EMA" },
                      { key: "bollinger", label: "Bollinger" },
                      { key: "multiTF", label: "Multi-TF" },
                      { key: "signal", label: "Signal" },
                      { key: "score", label: "Score IA" },
                    ].map(col => (
                      <th key={col.key} onClick={() => toggleSort(col.key as keyof CoinScreener)}
                        className="text-left py-3 px-2 text-[10px] font-bold text-gray-500 uppercase cursor-pointer hover:text-gray-300 transition-colors select-none">
                        <div className="flex items-center gap-1">
                          {col.label}
                          <SortIcon col={col.key as keyof CoinScreener} />
                        </div>
                      </th>
                    ))}
                    <th className="py-3 px-2 text-[10px] font-bold text-gray-500 uppercase">Sparkline</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c, i) => (
                    <>
                      <tr key={c.id}
                        onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                        className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer ${expandedId === c.id ? "bg-white/[0.03]" : ""}`}>
                        {/* Favorite star */}
                        <td className="py-3 px-2" onClick={e => { e.stopPropagation(); toggleFavorite(c.id); }}>
                          <Star className={`w-3.5 h-3.5 cursor-pointer transition-colors ${favorites.has(c.id) ? "text-yellow-400 fill-yellow-400" : "text-gray-700 hover:text-gray-500"}`} />
                        </td>
                        {/* Asset */}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-600 w-5">{(page - 1) * PER_PAGE + i + 1}</span>
                            {c.image ? <img src={c.image} alt={c.symbol} className="w-6 h-6 rounded-full" /> : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[9px] font-bold">
                                {c.symbol.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-bold leading-tight">{c.name}</p>
                              <p className="text-[9px] text-gray-600 uppercase">{c.symbol}</p>
                            </div>
                            <ChevronRight className={`w-3 h-3 text-gray-600 transition-transform ${expandedId === c.id ? "rotate-90" : ""}`} />
                          </div>
                        </td>
                        {/* Price */}
                        <td className="py-3 px-2 text-xs font-bold">{formatPrice(c.current_price)}</td>
                        {/* 24h */}
                        <td className={`py-3 px-2 text-xs font-bold ${c.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {c.price_change_percentage_24h >= 0 ? "+" : ""}{c.price_change_percentage_24h?.toFixed(1)}%
                        </td>
                        {/* 7d */}
                        <td className={`py-3 px-2 text-xs font-bold ${(c.price_change_percentage_7d_in_currency ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {(c.price_change_percentage_7d_in_currency ?? 0) >= 0 ? "+" : ""}{(c.price_change_percentage_7d_in_currency ?? 0).toFixed(1)}%
                        </td>
                        {/* RSI */}
                        <td className="py-3 px-2"><RSIBar value={c.rsi ?? 50} /></td>
                        {/* MACD */}
                        <td className="py-3 px-2"><MACDCell macd={c.macd} /></td>
                        {/* EMA */}
                        <td className="py-3 px-2"><EMACell ema={c.ema} /></td>
                        {/* Bollinger */}
                        <td className="py-3 px-2"><BollingerCell bollinger={c.bollinger} /></td>
                        {/* Multi-TF */}
                        <td className="py-3 px-2"><MultiTFDots multiTF={c.multiTF} /></td>
                        {/* Signal */}
                        <td className="py-3 px-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${c.signal === "BUY" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : c.signal === "SELL" ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"}`}>
                            {c.signal}
                          </span>
                        </td>
                        {/* Score */}
                        <td className="py-3 px-2"><ScoreRing score={c.score ?? 50} /></td>
                        {/* Sparkline */}
                        <td className="py-3 px-2">
                          <MiniSparkline prices={c.sparkline_in_7d?.price || []} />
                        </td>
                      </tr>
                      {expandedId === c.id && <ExpandedDetail coin={c} />}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
              <span className="text-xs text-gray-600">{filtered.length} résultats • Page {page}/{totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-gray-400 disabled:opacity-30 transition-all">
                  ← Préc
                </button>
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${page === pageNum ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-white/[0.04] hover:bg-white/[0.08] text-gray-400"}`}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-gray-400 disabled:opacity-30 transition-all">
                  Suiv →
                </button>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}