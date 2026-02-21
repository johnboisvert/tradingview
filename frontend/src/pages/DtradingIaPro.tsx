import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { fetchTop200, type CoinMarketData, formatPrice, formatVolume, fetchWithCorsProxy } from "@/lib/cryptoApi";
import {
  Crosshair, RefreshCw, Search, ChevronDown, ChevronUp, ArrowUpDown,
  TrendingUp, TrendingDown, Minus, AlertTriangle, Filter, X, CheckCircle, BarChart3,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type Signal = "ACHAT FORT" | "ACHAT" | "NEUTRE" | "VENTE" | "VENTE FORTE";
type Light = "green" | "orange" | "red";
type Timeframe = "1m" | "5m" | "15m" | "1h";
type SortKey = "rank" | "score" | "price" | "change24h" | "volume" | "rsi" | "signal";

interface IndicatorSet {
  ema9: number;
  ema20: number;
  ema50: number;
  macdLine: number;
  macdSignal: number;
  macdHist: number;
  rsi: number;
  vwapAbove: boolean;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  bbSqueeze: boolean;
  atr: number;
  light: Light;
}

interface CryptoAnalysis {
  coin: CoinMarketData;
  indicators: Record<Timeframe, IndicatorSet>;
  score: number;
  signal: Signal;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  detailLoaded: boolean;
  isRealData: boolean;
}

// ── Technical Indicator Calculations ─────────────────────────────────────────
function calcEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

function calcRSI(data: number[], period: number): number {
  if (data.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcMACD(data: number[]): { line: number; signal: number; hist: number } {
  if (data.length < 26) return { line: 0, signal: 0, hist: 0 };
  const ema12 = calcEMA(data, 12);
  const ema26 = calcEMA(data, 26);
  const macdLine: number[] = [];
  for (let i = 0; i < data.length; i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }
  const signalLine = calcEMA(macdLine, 9);
  const last = data.length - 1;
  return {
    line: macdLine[last],
    signal: signalLine[last],
    hist: macdLine[last] - signalLine[last],
  };
}

function calcBollingerBands(data: number[], period = 20, mult = 2): { upper: number; middle: number; lower: number; squeeze: boolean } {
  if (data.length < period) {
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    return { upper: avg, middle: avg, lower: avg, squeeze: false };
  }
  const slice = data.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  const bandwidth = (2 * mult * std) / mean;
  return {
    upper: mean + mult * std,
    middle: mean,
    lower: mean - mult * std,
    squeeze: bandwidth < 0.04,
  };
}

function calcATR(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (highs.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }
  if (trs.length < period) {
    return trs.reduce((a, b) => a + b, 0) / trs.length;
  }
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
}

function computeLight(ind: Omit<IndicatorSet, "light">): Light {
  let bullish = 0, bearish = 0;
  if (ind.ema9 > ind.ema20 && ind.ema20 > ind.ema50) bullish += 2;
  else if (ind.ema9 < ind.ema20 && ind.ema20 < ind.ema50) bearish += 2;
  if (ind.macdHist > 0) bullish++; else if (ind.macdHist < 0) bearish++;
  if (ind.rsi < 30) bullish++; else if (ind.rsi > 70) bearish++;
  else if (ind.rsi > 50) bullish += 0.5; else bearish += 0.5;
  if (ind.vwapAbove) bullish++; else bearish++;

  if (bullish >= 3.5) return "green";
  if (bearish >= 3.5) return "red";
  return "orange";
}

function computeIndicatorsFromPrices(closes: number[], highs: number[], lows: number[], volumes: number[]): IndicatorSet {
  const ema9Arr = calcEMA(closes, 9);
  const ema20Arr = calcEMA(closes, 20);
  const ema50Arr = calcEMA(closes, 50);
  const last = closes.length - 1;
  const ema9 = ema9Arr[last];
  const ema20 = ema20Arr[last];
  const ema50 = ema50Arr[last];
  const macd = calcMACD(closes);
  const rsi = calcRSI(closes, 9);
  let vwapNum = 0, vwapDen = 0;
  for (let i = 0; i < closes.length; i++) {
    const typical = (highs[i] + lows[i] + closes[i]) / 3;
    vwapNum += typical * (volumes[i] || 1);
    vwapDen += volumes[i] || 1;
  }
  const vwap = vwapDen > 0 ? vwapNum / vwapDen : closes[last];
  const vwapAbove = closes[last] > vwap;
  const bb = calcBollingerBands(closes);
  const atr = calcATR(highs, lows, closes);

  const partial = { ema9, ema20, ema50, macdLine: macd.line, macdSignal: macd.signal, macdHist: macd.hist, rsi, vwapAbove, bbUpper: bb.upper, bbMiddle: bb.middle, bbLower: bb.lower, bbSqueeze: bb.squeeze, atr };
  return { ...partial, light: computeLight(partial) };
}

function computeFromSparkline(coin: CoinMarketData): Record<Timeframe, IndicatorSet> {
  const prices = coin.sparkline_in_7d?.price || [];
  if (prices.length < 50) {
    const change = coin.price_change_percentage_24h || 0;
    const vol = coin.total_volume || 0;
    const mcap = coin.market_cap || 1;
    const volRatio = vol / mcap;
    const rsi = change > 5 ? 72 : change > 2 ? 60 : change > 0 ? 55 : change > -2 ? 45 : change > -5 ? 35 : 25;
    const light: Light = change > 3 && volRatio > 0.1 ? "green" : change < -3 ? "red" : "orange";
    const ind: IndicatorSet = {
      ema9: coin.current_price, ema20: coin.current_price, ema50: coin.current_price,
      macdLine: change > 0 ? 0.01 : -0.01, macdSignal: 0, macdHist: change > 0 ? 0.01 : -0.01,
      rsi, vwapAbove: change > 0, bbUpper: coin.current_price * 1.02, bbMiddle: coin.current_price,
      bbLower: coin.current_price * 0.98, bbSqueeze: false, atr: coin.current_price * 0.015, light,
    };
    return { "1m": { ...ind }, "5m": { ...ind }, "15m": { ...ind }, "1h": { ...ind } };
  }

  const highs = prices.map((p, i) => Math.max(p, prices[Math.max(0, i - 1)]));
  const lows = prices.map((p, i) => Math.min(p, prices[Math.max(0, i - 1)]));
  const volumes = prices.map(() => coin.total_volume / 168);
  const ind1h = computeIndicatorsFromPrices(prices, highs, lows, volumes);

  const recent48 = prices.slice(-48);
  const h48 = recent48.map((p, i) => Math.max(p, recent48[Math.max(0, i - 1)]));
  const l48 = recent48.map((p, i) => Math.min(p, recent48[Math.max(0, i - 1)]));
  const v48 = recent48.map(() => coin.total_volume / 168);
  const ind15m = recent48.length >= 20 ? computeIndicatorsFromPrices(recent48, h48, l48, v48) : { ...ind1h };

  const recent24 = prices.slice(-24);
  const h24 = recent24.map((p, i) => Math.max(p, recent24[Math.max(0, i - 1)]));
  const l24 = recent24.map((p, i) => Math.min(p, recent24[Math.max(0, i - 1)]));
  const v24 = recent24.map(() => coin.total_volume / 168);
  const ind5m = recent24.length >= 20 ? computeIndicatorsFromPrices(recent24, h24, l24, v24) : { ...ind15m };

  const recent12 = prices.slice(-12);
  const h12 = recent12.map((p, i) => Math.max(p, recent12[Math.max(0, i - 1)]));
  const l12 = recent12.map((p, i) => Math.min(p, recent12[Math.max(0, i - 1)]));
  const v12 = recent12.map(() => coin.total_volume / 168);
  const ind1m = recent12.length >= 10 ? computeIndicatorsFromPrices(recent12, h12, l12, v12) : { ...ind5m };

  return { "1m": ind1m, "5m": ind5m, "15m": ind15m, "1h": ind1h };
}

function computeScore(indicators: Record<Timeframe, IndicatorSet>, coin: CoinMarketData): number {
  let score = 50;
  const lights = (["5m", "15m", "1h"] as Timeframe[]).map(tf => indicators[tf].light);
  const greenCount = lights.filter(l => l === "green").length;
  const redCount = lights.filter(l => l === "red").length;
  score += (greenCount - redCount) * 10;

  const rsi = indicators["5m"].rsi;
  if (rsi < 30) score += 15;
  else if (rsi < 40) score += 10;
  else if (rsi > 70) score -= 15;
  else if (rsi > 60) score -= 5;

  const macdH = indicators["5m"].macdHist;
  if (macdH > 0) score += Math.min(15, macdH * 1000);
  else score += Math.max(-15, macdH * 1000);

  if (indicators["5m"].vwapAbove && indicators["1h"].vwapAbove) score += 15;
  else if (!indicators["5m"].vwapAbove && !indicators["1h"].vwapAbove) score -= 10;

  const price = coin.current_price;
  const bb = indicators["5m"];
  if (bb.bbSqueeze) score += 5;
  const bbRange = bb.bbUpper - bb.bbLower;
  if (bbRange > 0) {
    const bbPos = (price - bb.bbLower) / bbRange;
    if (bbPos < 0.2) score += 10;
    else if (bbPos > 0.8) score -= 5;
  }

  const volRatio = coin.total_volume / (coin.market_cap || 1);
  if (volRatio > 0.15) score += 10;
  else if (volRatio > 0.08) score += 5;
  else if (volRatio < 0.02) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getSignal(score: number): Signal {
  if (score > 75) return "ACHAT FORT";
  if (score > 60) return "ACHAT";
  if (score > 40) return "NEUTRE";
  if (score > 25) return "VENTE";
  return "VENTE FORTE";
}

function getSignalColor(signal: Signal): string {
  switch (signal) {
    case "ACHAT FORT": return "text-emerald-300";
    case "ACHAT": return "text-green-300";
    case "NEUTRE": return "text-gray-300";
    case "VENTE": return "text-orange-300";
    case "VENTE FORTE": return "text-red-300";
  }
}

function getSignalBg(signal: Signal): string {
  switch (signal) {
    case "ACHAT FORT": return "bg-emerald-500/20 border-emerald-500/30";
    case "ACHAT": return "bg-green-500/15 border-green-500/25";
    case "NEUTRE": return "bg-gray-500/15 border-gray-500/25";
    case "VENTE": return "bg-orange-500/15 border-orange-500/25";
    case "VENTE FORTE": return "bg-red-500/20 border-red-500/30";
  }
}

function getLightColor(light: Light): string {
  switch (light) {
    case "green": return "bg-emerald-400";
    case "orange": return "bg-amber-400";
    case "red": return "bg-red-400";
  }
}

function getLightGlow(light: Light): string {
  switch (light) {
    case "green": return "shadow-emerald-400/50";
    case "orange": return "shadow-amber-400/50";
    case "red": return "shadow-red-400/50";
  }
}

function getScoreColor(score: number): string {
  if (score > 75) return "text-emerald-300";
  if (score > 60) return "text-green-300";
  if (score > 40) return "text-gray-200";
  if (score > 25) return "text-orange-300";
  return "text-red-300";
}

function formatMacdHist(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1) return abs.toFixed(2);
  if (abs >= 0.01) return abs.toFixed(4);
  if (abs >= 0.0001) return abs.toFixed(6);
  return abs.toExponential(1);
}

// ── Binance Klines fetch ─────────────────────────────────────────────────────
async function fetchBinanceKlines(symbol: string, interval: string, limit = 100): Promise<{ closes: number[]; highs: number[]; lows: number[]; volumes: number[] } | null> {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}USDT&interval=${interval}&limit=${limit}`;
    const res = await fetchWithCorsProxy(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return {
      closes: data.map((k: number[]) => parseFloat(String(k[4]))),
      highs: data.map((k: number[]) => parseFloat(String(k[2]))),
      lows: data.map((k: number[]) => parseFloat(String(k[3]))),
      volumes: data.map((k: number[]) => parseFloat(String(k[5]))),
    };
  } catch {
    return null;
  }
}

async function loadBinanceForCrypto(analysis: CryptoAnalysis): Promise<CryptoAnalysis> {
  const symbol = analysis.coin.symbol.toUpperCase();
  const tfMap: Record<Timeframe, string> = { "1m": "1m", "5m": "5m", "15m": "15m", "1h": "1h" };
  const updated = { ...analysis, indicators: { ...analysis.indicators }, detailLoaded: true, isRealData: true };

  for (const [tf, interval] of Object.entries(tfMap) as [Timeframe, string][]) {
    const klines = await fetchBinanceKlines(symbol, interval, 100);
    if (klines && klines.closes.length > 20) {
      updated.indicators[tf] = computeIndicatorsFromPrices(klines.closes, klines.highs, klines.lows, klines.volumes);
    }
  }
  updated.score = computeScore(updated.indicators, updated.coin);
  updated.signal = getSignal(updated.score);
  const atr5m = updated.indicators["5m"].atr || updated.coin.current_price * 0.015;
  updated.stopLoss = updated.coin.current_price - atr5m * 1.5;
  updated.takeProfit = updated.coin.current_price + atr5m * 2;
  const risk = updated.coin.current_price - updated.stopLoss;
  const reward = updated.takeProfit - updated.coin.current_price;
  updated.riskReward = risk > 0 ? reward / risk : 0;
  return updated;
}

// ── TrafficLight Component ───────────────────────────────────────────────────
function TrafficLight({ light, label }: { light: Light; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-4 h-4 rounded-full ${getLightColor(light)} shadow-lg ${getLightGlow(light)}`} />
      <span className="text-[10px] text-gray-400 font-bold">{label}</span>
    </div>
  );
}

// ── Expanded Detail Row ──────────────────────────────────────────────────────
function DetailRow({ analysis }: { analysis: CryptoAnalysis }) {
  const { coin, indicators, score, signal, stopLoss, takeProfit, riskReward, isRealData } = analysis;
  const timeframes: Timeframe[] = ["1m", "5m", "15m", "1h"];

  return (
    <tr>
      <td colSpan={11} className="p-0">
        <div className="bg-white/[0.03] border-t border-b border-white/[0.08] p-5">
          {/* Data source badge */}
          <div className="flex items-center gap-2 mb-4">
            {isRealData ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5" /> Données Binance temps réel
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <BarChart3 className="w-3.5 h-3.5" /> Données estimées (CoinGecko)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Indicators per timeframe */}
            <div className="lg:col-span-2">
              <h4 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Indicateurs par Timeframe</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {timeframes.map(tf => {
                  const ind = indicators[tf];
                  return (
                    <div key={tf} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.08]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-black text-white">{tf.toUpperCase()}</span>
                        <div className={`w-4 h-4 rounded-full ${getLightColor(ind.light)} shadow-lg ${getLightGlow(ind.light)}`} />
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">EMA 9/20/50</span>
                          <span className={`font-bold ${ind.ema9 > ind.ema20 ? "text-emerald-300" : "text-red-300"}`}>
                            {ind.ema9 > ind.ema20 && ind.ema20 > ind.ema50 ? "▲ Aligné" : ind.ema9 < ind.ema20 ? "▼ Inversé" : "— Mixte"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">MACD</span>
                          <span className={`font-bold ${ind.macdHist > 0 ? "text-emerald-300" : "text-red-300"}`}>
                            {ind.macdHist > 0 ? "▲" : "▼"} {formatMacdHist(ind.macdHist)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">RSI</span>
                          <span className={`font-bold ${ind.rsi < 30 ? "text-emerald-300" : ind.rsi > 70 ? "text-red-300" : "text-gray-200"}`}>
                            {ind.rsi.toFixed(1)} {ind.rsi < 30 ? "Survente" : ind.rsi > 70 ? "Surachat" : ""}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">VWAP</span>
                          <span className={`font-bold ${ind.vwapAbove ? "text-emerald-300" : "text-red-300"}`}>
                            {ind.vwapAbove ? "▲ Au-dessus" : "▼ En-dessous"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Bollinger</span>
                          <span className={`font-bold ${ind.bbSqueeze ? "text-amber-300" : "text-gray-300"}`}>
                            {ind.bbSqueeze ? "⚡ Squeeze" : "Normal"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">ATR</span>
                          <span className="text-gray-200 font-bold">${ind.atr < 0.01 ? ind.atr.toFixed(6) : ind.atr.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Entry/Exit signals */}
            <div>
              <h4 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Signal d&apos;Entrée / Sortie</h4>
              <div className={`rounded-xl p-5 border ${getSignalBg(signal)}`}>
                <div className="text-center mb-4">
                  <span className={`text-xl font-black ${getSignalColor(signal)}`}>{signal}</span>
                  <div className="text-3xl font-black text-white mt-1">{score}/100</div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Prix d&apos;entrée</span>
                    <span className="text-white font-bold">${formatPrice(coin.current_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-300">Stop-Loss (ATR×1.5)</span>
                    <span className="text-red-200 font-bold">${formatPrice(stopLoss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-300">Take-Profit (ATR×2)</span>
                    <span className="text-emerald-200 font-bold">${formatPrice(takeProfit)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/[0.08] pt-3">
                    <span className="text-gray-400">Risk/Reward</span>
                    <span className={`font-black text-base ${riskReward >= 1.3 ? "text-emerald-300" : "text-amber-300"}`}>
                      1:{riskReward.toFixed(1)}
                    </span>
                  </div>
                </div>
                {/* Validation rule */}
                <div className="mt-4 pt-4 border-t border-white/[0.08]">
                  <p className="text-xs text-gray-400 mb-2 font-bold">Validation Multi-TF :</p>
                  <div className="flex items-center gap-3">
                    {(["5m", "15m", "1h"] as Timeframe[]).map(tf => (
                      <div key={tf} className="flex items-center gap-1.5">
                        <div className={`w-3.5 h-3.5 rounded-full ${getLightColor(indicators[tf].light)} shadow-md ${getLightGlow(indicators[tf].light)}`} />
                        <span className="text-xs text-gray-300 font-bold">{tf}</span>
                      </div>
                    ))}
                    <span className="text-sm ml-auto font-black">
                      {indicators["5m"].light === "green" && indicators["15m"].light === "green" && indicators["1h"].light === "green"
                        ? <span className="text-emerald-300">✓ VALIDÉ</span>
                        : <span className="text-amber-300">⚠ NON VALIDÉ</span>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────
export default function DtradingIaPro() {
  const [analyses, setAnalyses] = useState<CryptoAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTop20, setLoadingTop20] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [signalFilter, setSignalFilter] = useState<Signal | "ALL">("ALL");
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [top20Loaded, setTop20Loaded] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTop200(true);

      const results: CryptoAnalysis[] = data.map(coin => {
        const indicators = computeFromSparkline(coin);
        const score = computeScore(indicators, coin);
        const signal = getSignal(score);
        const atr5m = indicators["5m"].atr || coin.current_price * 0.015;
        const stopLoss = coin.current_price - atr5m * 1.5;
        const takeProfit = coin.current_price + atr5m * 2;
        const risk = coin.current_price - stopLoss;
        const reward = takeProfit - coin.current_price;
        const riskReward = risk > 0 ? reward / risk : 0;
        return { coin, indicators, score, signal, stopLoss, takeProfit, riskReward, detailLoaded: false, isRealData: false };
      });

      setAnalyses(results);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load Binance data for top 20 after initial load
  const loadTop20Binance = useCallback(async (currentAnalyses: CryptoAnalysis[]) => {
    if (top20Loaded || currentAnalyses.length === 0) return;
    setLoadingTop20(true);
    setTop20Loaded(true);

    const top20 = currentAnalyses.slice(0, 20);
    // Load in batches of 4 to avoid rate limiting
    for (let i = 0; i < top20.length; i += 4) {
      const batch = top20.slice(i, i + 4);
      const promises = batch.map(a => loadBinanceForCrypto(a).catch(() => a));
      const results = await Promise.all(promises);

      setAnalyses(prev => {
        const updated = [...prev];
        for (const result of results) {
          const idx = updated.findIndex(a => a.coin.id === result.coin.id);
          if (idx >= 0) updated[idx] = result;
        }
        return updated;
      });

      // Small delay between batches
      if (i + 4 < top20.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    setLoadingTop20(false);
  }, [top20Loaded]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Trigger top 20 loading after initial data
  useEffect(() => {
    if (!loading && analyses.length > 0 && !top20Loaded) {
      loadTop20Binance(analyses);
    }
  }, [loading, analyses.length, top20Loaded, loadTop20Binance]);

  // Load detailed Binance klines when expanding a row
  const handleExpand = useCallback(async (coinId: string) => {
    if (expandedId === coinId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(coinId);

    const analysis = analyses.find(a => a.coin.id === coinId);
    if (!analysis || analysis.detailLoaded) return;

    setLoadingDetail(coinId);
    const updated = await loadBinanceForCrypto(analysis);
    setAnalyses(prev => prev.map(a => a.coin.id === coinId ? updated : a));
    setLoadingDetail(null);
  }, [expandedId, analyses]);

  // Filtered & sorted
  const filtered = useMemo(() => {
    let list = analyses;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.coin.name.toLowerCase().includes(q) || a.coin.symbol.toLowerCase().includes(q));
    }
    if (signalFilter !== "ALL") {
      list = list.filter(a => a.signal === signalFilter);
    }
    if (minScore > 0) {
      list = list.filter(a => a.score >= minScore);
    }
    list = [...list].sort((a, b) => {
      let va: number, vb: number;
      switch (sortKey) {
        case "rank": va = a.coin.market_cap_rank || 999; vb = b.coin.market_cap_rank || 999; break;
        case "score": va = a.score; vb = b.score; break;
        case "price": va = a.coin.current_price; vb = b.coin.current_price; break;
        case "change24h": va = a.coin.price_change_percentage_24h || 0; vb = b.coin.price_change_percentage_24h || 0; break;
        case "volume": va = a.coin.total_volume; vb = b.coin.total_volume; break;
        case "rsi": va = a.indicators["5m"].rsi; vb = b.indicators["5m"].rsi; break;
        case "signal": va = a.score; vb = b.score; break;
        default: va = 0; vb = 0;
      }
      return sortAsc ? va - vb : vb - va;
    });
    return list;
  }, [analyses, searchQuery, signalFilter, minScore, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortHeader = ({ label, sKey, className = "" }: { label: string; sKey: SortKey; className?: string }) => (
    <th
      className={`px-3 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200 transition-colors select-none ${className}`}
      onClick={() => handleSort(sKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === sKey && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
        {sortKey !== sKey && <ArrowUpDown className="w-3 h-3 opacity-30" />}
      </div>
    </th>
  );

  // Stats
  const buyCount = analyses.filter(a => a.signal === "ACHAT FORT" || a.signal === "ACHAT").length;
  const sellCount = analyses.filter(a => a.signal === "VENTE FORTE" || a.signal === "VENTE").length;
  const neutralCount = analyses.filter(a => a.signal === "NEUTRE").length;
  const avgScore = analyses.length > 0 ? Math.round(analyses.reduce((s, a) => s + a.score, 0) / analyses.length) : 0;
  const realDataCount = analyses.filter(a => a.isRealData).length;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white flex">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] pt-14 md:pt-0">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Crosshair className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Dtrading IA PRO
                  </h1>
                  <p className="text-sm text-gray-400">
                    Analyse multi-timeframe en temps réel • 200 cryptos • Entrée 5m | Confirmation 15m &amp; 1h
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {loadingTop20 && (
                <span className="flex items-center gap-2 text-xs text-indigo-400 font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Chargement Binance top 20...
                </span>
              )}
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  Mis à jour : {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => { setTop20Loaded(false); loadData(); }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-gray-200 hover:text-white transition-all text-sm font-semibold disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Rafraîchir
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-xs text-gray-400 font-bold mb-1">Cryptos Analysées</p>
              <p className="text-2xl font-black text-white">{analyses.length}</p>
            </div>
            <div className="bg-emerald-500/[0.08] rounded-xl p-4 border border-emerald-500/15">
              <p className="text-xs text-emerald-300 font-bold mb-1">Signaux Achat</p>
              <p className="text-2xl font-black text-emerald-300">{buyCount}</p>
            </div>
            <div className="bg-red-500/[0.08] rounded-xl p-4 border border-red-500/15">
              <p className="text-xs text-red-300 font-bold mb-1">Signaux Vente</p>
              <p className="text-2xl font-black text-red-300">{sellCount}</p>
            </div>
            <div className="bg-gray-500/[0.08] rounded-xl p-4 border border-gray-500/15">
              <p className="text-xs text-gray-300 font-bold mb-1">Neutres</p>
              <p className="text-2xl font-black text-gray-200">{neutralCount}</p>
            </div>
            <div className="bg-indigo-500/[0.08] rounded-xl p-4 border border-indigo-500/15">
              <p className="text-xs text-indigo-300 font-bold mb-1">Score Moyen</p>
              <p className={`text-2xl font-black ${getScoreColor(avgScore)}`}>{avgScore}/100</p>
            </div>
            <div className="bg-cyan-500/[0.08] rounded-xl p-4 border border-cyan-500/15">
              <p className="text-xs text-cyan-300 font-bold mb-1">Données Binance</p>
              <p className="text-2xl font-black text-cyan-300">{realDataCount}<span className="text-sm text-gray-500">/{analyses.length}</span></p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher une crypto (nom ou symbole)..."
                className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                showFilters ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300" : "bg-white/[0.05] border-white/[0.10] text-gray-300 hover:text-white"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtres
              {(signalFilter !== "ALL" || minScore > 0) && (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 mb-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-xs text-gray-400 font-bold block mb-1.5">Signal</label>
                <select
                  value={signalFilter}
                  onChange={e => setSignalFilter(e.target.value as Signal | "ALL")}
                  className="bg-white/[0.06] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="ALL">Tous</option>
                  <option value="ACHAT FORT">Achat Fort</option>
                  <option value="ACHAT">Achat</option>
                  <option value="NEUTRE">Neutre</option>
                  <option value="VENTE">Vente</option>
                  <option value="VENTE FORTE">Vente Forte</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold block mb-1.5">Score minimum : {minScore}</label>
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={5}
                  value={minScore}
                  onChange={e => setMinScore(Number(e.target.value))}
                  className="w-40 accent-indigo-500"
                />
              </div>
              <button
                onClick={() => { setSignalFilter("ALL"); setMinScore(0); }}
                className="text-sm text-gray-400 hover:text-white transition-colors underline"
              >
                Réinitialiser
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-5 mb-4 px-1">
            <span className="text-xs text-gray-500 font-bold">Légende :</span>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-xs text-gray-400">Haussier</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-xs text-gray-400">Neutre</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-xs text-gray-400">Baissier</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-gray-400">Binance temps réel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-gray-400">Estimé (cliquez pour charger)</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                    <SortHeader label="#" sKey="rank" className="w-12" />
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Crypto</th>
                    <SortHeader label="Prix" sKey="price" />
                    <SortHeader label="24h" sKey="change24h" />
                    <th className="px-3 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Feux <span className="text-[10px] text-gray-500">(1m|5m|15m|1h)</span>
                    </th>
                    <SortHeader label="Score IA" sKey="score" />
                    <SortHeader label="Signal" sKey="signal" />
                    <SortHeader label="RSI" sKey="rsi" />
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">MACD</th>
                    <SortHeader label="Volume" sKey="volume" />
                    <th className="px-3 py-4 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {loading && analyses.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-20">
                        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                        <p className="text-base text-gray-400">Chargement des 200 cryptos...</p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-20">
                        <p className="text-base text-gray-400">Aucune crypto trouvée</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map(analysis => {
                      const { coin, indicators, score, signal, isRealData } = analysis;
                      const isExpanded = expandedId === coin.id;
                      const change24h = coin.price_change_percentage_24h || 0;
                      const rsi5m = indicators["5m"].rsi;
                      const macdH = indicators["5m"].macdHist;

                      return (
                        <Fragment key={coin.id}>
                          <tr
                            className={`border-b border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-colors ${isExpanded ? "bg-white/[0.04]" : ""}`}
                            onClick={() => handleExpand(coin.id)}
                          >
                            <td className="px-3 py-3.5 text-sm text-gray-400 font-bold">{coin.market_cap_rank}</td>
                            <td className="px-3 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <img src={coin.image} alt={coin.symbol} className="w-7 h-7 rounded-full" loading="lazy" />
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-white">{coin.symbol.toUpperCase()}</span>
                                  <span className="text-xs text-gray-500 hidden sm:inline">{coin.name}</span>
                                  {isRealData ? (
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" title="Données Binance temps réel" />
                                  ) : (
                                    <BarChart3 className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" title="Données estimées" />
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5 text-sm text-white font-bold">${formatPrice(coin.current_price)}</td>
                            <td className="px-3 py-3.5">
                              <div className={`flex items-center gap-1 text-sm font-bold ${change24h > 0 ? "text-emerald-300" : change24h < 0 ? "text-red-300" : "text-gray-300"}`}>
                                {change24h > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : change24h < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                                {change24h.toFixed(1)}%
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <div className="flex items-center justify-center gap-3">
                                <TrafficLight light={indicators["1m"].light} label="1m" />
                                <TrafficLight light={indicators["5m"].light} label="5m" />
                                <TrafficLight light={indicators["15m"].light} label="15m" />
                                <TrafficLight light={indicators["1h"].light} label="1h" />
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-lg font-black ${getScoreColor(score)}`}>{score}</span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${getSignalBg(signal)} ${getSignalColor(signal)}`}>
                                {signal}
                              </span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-sm font-bold ${rsi5m < 30 ? "text-emerald-300" : rsi5m > 70 ? "text-red-300" : "text-gray-200"}`}>
                                {rsi5m.toFixed(0)}
                              </span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-sm font-bold ${macdH > 0 ? "text-emerald-300" : "text-red-300"}`}>
                                {macdH > 0 ? "▲" : "▼"} {formatMacdHist(macdH)}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-xs text-gray-300 font-semibold">{formatVolume(coin.total_volume)}</td>
                            <td className="px-3 py-3.5">
                              {loadingDetail === coin.id ? (
                                <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                              ) : (
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              )}
                            </td>
                          </tr>
                          {isExpanded && <DetailRow analysis={analysis} />}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 px-4 py-3 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl">
            <p className="text-xs text-amber-300/80 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Avertissement :</strong> Les signaux sont générés par des algorithmes basés sur des indicateurs techniques (EMA 9/20/50, MACD 12/26/9, RSI 9, VWAP, Bandes de Bollinger, ATR).
                Ils ne constituent pas des conseils financiers. Le trading de cryptomonnaies comporte des risques importants.
                Les top 20 cryptos sont automatiquement chargées avec les données Binance en temps réel.
                Pour les autres, cliquez sur une ligne pour charger les données réelles.
              </span>
            </p>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}