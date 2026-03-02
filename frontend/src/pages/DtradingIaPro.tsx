import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { fetchTop200, type CoinMarketData, formatPrice, fetchWithCorsProxy } from "@/lib/cryptoApi";
import {
  Crosshair, RefreshCw, Search, ChevronDown, ChevronUp, ArrowUpDown,
  TrendingUp, TrendingDown, Minus, AlertTriangle, Filter, X, CheckCircle, BarChart3,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type Signal = "ACHAT FORT" | "ACHAT" | "NEUTRE" | "VENTE" | "VENTE FORTE" | "EN ATTENTE";
type Light = "green" | "orange" | "red";
type Timeframe = "1m" | "5m" | "15m" | "1h";
type SortKey = "rank" | "score" | "price" | "change24h" | "volume" | "rsi" | "signal";

interface IndicatorSet {
  ema9: number;
  ema20: number;
  ema200: number;
  macdLine: number;
  macdSignal: number;
  macdHist: number;
  rsi: number;
  vwapAbove: boolean;
  vwapValue: number;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  bbSqueeze: boolean;
  atr: number;
  light: Light;
  lastClose: number;
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
  if (data.length === 0) return [];
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

function calcBollingerBands(data: number[], period = 20, mult = 2) {
  if (data.length < period) {
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    return { upper: avg, middle: avg, lower: avg, squeeze: false };
  }
  const slice = data.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  const bandwidth = (2 * mult * std) / mean;
  return { upper: mean + mult * std, middle: mean, lower: mean - mult * std, squeeze: bandwidth < 0.04 };
}

function calcATR(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (highs.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));
    trs.push(tr);
  }
  if (trs.length < period) return trs.reduce((a, b) => a + b, 0) / trs.length;
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
}

// Intraday VWAP: only use recent candles (approx current day)
function calcVWAP(highs: number[], lows: number[], closes: number[], volumes: number[], intradayCount?: number) {
  const count = intradayCount || closes.length;
  const start = Math.max(0, closes.length - count);
  let vwapNum = 0, vwapDen = 0;
  for (let i = start; i < closes.length; i++) {
    const typical = (highs[i] + lows[i] + closes[i]) / 3;
    const vol = volumes[i] || 1;
    vwapNum += typical * vol;
    vwapDen += vol;
  }
  const vwapValue = vwapDen > 0 ? vwapNum / vwapDen : closes[closes.length - 1];
  const lastClose = closes[closes.length - 1];
  return { vwapValue, vwapAbove: lastClose > vwapValue };
}

// Strict traffic light for day trading
function computeLight(ind: Omit<IndicatorSet, "light">): Light {
  let bullPoints = 0, bearPoints = 0;
  const total = 10; // 3+2+2+3

  // EMA alignment (weight 3)
  if (ind.ema9 > ind.ema20 && ind.lastClose > ind.ema200) bullPoints += 3;
  else if (ind.ema9 < ind.ema20 && ind.lastClose < ind.ema200) bearPoints += 3;
  else if (ind.ema9 > ind.ema20) bullPoints += 1;
  else bearPoints += 1;

  // MACD histogram (weight 2)
  if (ind.macdHist > 0 && ind.macdLine > ind.macdSignal) bullPoints += 2;
  else if (ind.macdHist < 0 && ind.macdLine < ind.macdSignal) bearPoints += 2;

  // RSI (weight 2)
  if (ind.rsi > 50 && ind.rsi < 70) bullPoints += 2;
  else if (ind.rsi < 50 && ind.rsi > 30) bearPoints += 2;
  else if (ind.rsi >= 70) bearPoints += 1;
  else if (ind.rsi <= 30) bullPoints += 1;

  // VWAP (weight 3 — king of 5min)
  if (ind.vwapAbove) bullPoints += 3;
  else bearPoints += 3;

  const ratio = bullPoints / total;
  if (ratio >= 0.7) return "green";
  if (ratio <= 0.3) return "red";
  return "orange";
}

function computeIndicatorsFromPrices(
  closes: number[], highs: number[], lows: number[], volumes: number[],
  intradayCandles?: number
): IndicatorSet {
  const last = closes.length - 1;
  const lastClose = closes[last];
  const ema9Arr = calcEMA(closes, 9);
  const ema20Arr = calcEMA(closes, 20);
  const ema200Arr = calcEMA(closes, Math.min(200, closes.length));
  const ema9 = ema9Arr[last];
  const ema20 = ema20Arr[last];
  const ema200 = ema200Arr[last];
  const macd = calcMACD(closes);
  const rsi = calcRSI(closes, 9);
  const { vwapValue, vwapAbove } = calcVWAP(highs, lows, closes, volumes, intradayCandles);
  const bb = calcBollingerBands(closes);
  const atr = calcATR(highs, lows, closes);

  const partial = {
    ema9, ema20, ema200,
    macdLine: macd.line, macdSignal: macd.signal, macdHist: macd.hist,
    rsi, vwapAbove, vwapValue,
    bbUpper: bb.upper, bbMiddle: bb.middle, bbLower: bb.lower, bbSqueeze: bb.squeeze,
    atr, lastClose,
  };
  return { ...partial, light: computeLight(partial) };
}

// Compute from CoinGecko sparkline (7d, ~168 hourly points) — fallback only
// IMPORTANT: Only 1h data is real. For 1m/5m/15m we COPY 1h (will be replaced by Binance)
function computeFromSparkline(coin: CoinMarketData): Record<Timeframe, IndicatorSet> {
  const prices = coin.sparkline_in_7d?.price || [];

  if (prices.length < 50) {
    // Not enough data — return placeholder with "orange" lights (unknown state)
    const price = coin.current_price;
    const ind: IndicatorSet = {
      ema9: 0, ema20: 0, ema200: 0,
      macdLine: 0, macdSignal: 0, macdHist: 0,
      rsi: 50, vwapAbove: false, vwapValue: price,
      bbUpper: price, bbMiddle: price, bbLower: price, bbSqueeze: false,
      atr: price * 0.015, light: "orange", lastClose: price,
    };
    return { "1m": { ...ind }, "5m": { ...ind }, "15m": { ...ind }, "1h": { ...ind } };
  }

  // Calculate REAL indicators from hourly data (1h timeframe only)
  const highs = prices.map((p, i) => Math.max(p, prices[Math.max(0, i - 1)]));
  const lows = prices.map((p, i) => Math.min(p, prices[Math.max(0, i - 1)]));
  const volumes = prices.map(() => coin.total_volume / 168);
  const ind1h = computeIndicatorsFromPrices(prices, highs, lows, volumes, 24);

  // For shorter timeframes, COPY 1h data (don't pretend it's 5m data)
  // These will be replaced by real Binance data when loaded
  return { "1m": { ...ind1h }, "5m": { ...ind1h }, "15m": { ...ind1h }, "1h": ind1h };
}

function computeScore(indicators: Record<Timeframe, IndicatorSet>, coin: CoinMarketData): number {
  // STEP 1: Count traffic lights (the PRIMARY driver)
  const tfs: Timeframe[] = ["5m", "15m", "1h"];
  const lights = tfs.map(tf => indicators[tf].light);
  const greenCount = lights.filter(l => l === "green").length;
  const orangeCount = lights.filter(l => l === "orange").length;
  const redCount = lights.filter(l => l === "red").length;

  // HARD CAPS based on traffic lights:
  // - Any red light → score CANNOT exceed 40 (NEUTRE max)
  // - 2+ orange lights → score CANNOT exceed 55 (NEUTRE)
  // - Need at least 2 green for ACHAT (>60)
  // - Need all 3 green for ACHAT FORT (>75)
  let maxScore = 100;
  if (redCount >= 2) maxScore = 25; // max VENTE
  else if (redCount === 1) maxScore = 40; // max NEUTRE
  else if (orangeCount >= 2) maxScore = 55; // max NEUTRE
  else if (orangeCount === 1 && greenCount === 2) maxScore = 65; // max ACHAT
  else if (greenCount === 3) maxScore = 100; // can reach ACHAT FORT

  // STEP 2: Calculate raw score from indicators
  let raw = 0;

  // Traffic lights base (max 30)
  raw += greenCount * 10 + orangeCount * 3;

  // VWAP (max 20)
  const vwapAll = tfs.every(tf => indicators[tf].vwapAbove);
  const vwap5m = indicators["5m"].vwapAbove;
  if (vwapAll) raw += 20;
  else if (vwap5m && indicators["1h"].vwapAbove) raw += 12;
  else if (vwap5m) raw += 5;

  // RSI (max 15)
  const rsi = indicators["5m"].rsi;
  if (rsi < 30) raw += 15;
  else if (rsi >= 40 && rsi <= 60) raw += 10;
  else if (rsi < 40) raw += 8;
  else if (rsi > 60 && rsi <= 70) raw += 5;
  // rsi > 70 = 0

  // MACD (max 15)
  const { macdHist, macdLine, macdSignal } = indicators["5m"];
  if (macdHist > 0 && macdLine > macdSignal) raw += 15;
  else if (macdHist > 0) raw += 8;
  else if (macdHist < 0 && macdLine >= macdSignal) raw += 3;
  // full bearish = 0

  // EMA 200 (max 15)
  const price = coin.current_price;
  if (price > indicators["5m"].ema200 && price > indicators["1h"].ema200) raw += 15;
  else if (price > indicators["1h"].ema200) raw += 7;

  // BB + Volume (max 5)
  const bb = indicators["5m"];
  const bbRange = bb.bbUpper - bb.bbLower;
  if (bbRange > 0) {
    const bbPos = (price - bb.bbLower) / bbRange;
    if (bbPos >= 0.3 && bbPos <= 0.7) raw += 3;
    else if (bbPos < 0.2) raw += 2;
  }
  if (coin.total_volume / (coin.market_cap || 1) > 0.1) raw += 2;

  // STEP 3: Apply hard cap from traffic lights
  return Math.max(0, Math.min(maxScore, Math.round(raw)));
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
    case "EN ATTENTE": return "text-gray-500";
  }
}

function getSignalBg(signal: Signal): string {
  switch (signal) {
    case "ACHAT FORT": return "bg-emerald-500/20 border-emerald-500/30";
    case "ACHAT": return "bg-green-500/15 border-green-500/25";
    case "NEUTRE": return "bg-gray-500/15 border-gray-500/25";
    case "VENTE": return "bg-orange-500/15 border-orange-500/25";
    case "VENTE FORTE": return "bg-red-500/20 border-red-500/30";
    case "EN ATTENTE": return "bg-gray-800/30 border-gray-600/20";
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

function fmtNum(val: number, price: number): string {
  const abs = Math.abs(val);
  if (price > 1000) return abs.toFixed(2);
  if (price > 1) return abs.toFixed(4);
  if (abs >= 0.0001) return abs.toFixed(6);
  return abs.toExponential(2);
}

function fmtPrice(val: number): string {
  if (val >= 1000) return val.toFixed(2);
  if (val >= 1) return val.toFixed(4);
  if (val >= 0.01) return val.toFixed(6);
  return val.toFixed(8);
}

// ── Binance Klines fetch ─────────────────────────────────────────────────────
async function fetchBinanceKlines(symbol: string, interval: string, limit = 250): Promise<{
  closes: number[]; highs: number[]; lows: number[]; volumes: number[];
  openTimes: number[];
} | null> {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}USDT&interval=${interval}&limit=${limit}`;
    const res = await fetchWithCorsProxy(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return {
      closes: data.map((k: number[]) => parseFloat(String(k[4]))),
      highs: data.map((k: number[]) => parseFloat(String(k[2]))),
      lows: data.map((k: number[]) => parseFloat(String(k[3]))),
      volumes: data.map((k: number[]) => parseFloat(String(k[5]))),
      openTimes: data.map((k: number[]) => Number(k[0])),
    };
  } catch {
    return null;
  }
}

// Calculate intraday candle count (candles since midnight UTC)
function getIntradayCount(openTimes: number[], intervalMinutes: number): number {
  const now = new Date();
  const midnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
  let count = 0;
  for (let i = openTimes.length - 1; i >= 0; i--) {
    if (openTimes[i] >= midnightUTC) count++;
    else break;
  }
  // Minimum candles for VWAP to be meaningful
  return Math.max(count, Math.floor(60 / intervalMinutes));
}

const TF_MINUTES: Record<string, number> = { "1m": 1, "5m": 5, "15m": 15, "1h": 60 };

async function loadBinanceForCrypto(analysis: CryptoAnalysis): Promise<CryptoAnalysis> {
  const symbol = analysis.coin.symbol.toUpperCase();
  const tfMap: [Timeframe, string][] = [["1m", "1m"], ["5m", "5m"], ["15m", "15m"], ["1h", "1h"]];
  const updated: CryptoAnalysis = {
    ...analysis,
    indicators: { ...analysis.indicators },
    detailLoaded: true,
    isRealData: true,
  };

  for (const [tf, interval] of tfMap) {
    const klines = await fetchBinanceKlines(symbol, interval, 250);
    if (klines && klines.closes.length > 30) {
      const intradayCount = getIntradayCount(klines.openTimes, TF_MINUTES[interval]);
      updated.indicators[tf] = computeIndicatorsFromPrices(
        klines.closes, klines.highs, klines.lows, klines.volumes, intradayCount
      );
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
  const price = coin.current_price;

  // Multi-TF validation: strict rule
  const is5mGreen = indicators["5m"].light === "green";
  const is15mGreen = indicators["15m"].light === "green";
  const is1hGreen = indicators["1h"].light === "green";
  const aboveEma200_1h = price > indicators["1h"].ema200;
  const isFullyValidated = is5mGreen && is15mGreen && is1hGreen && aboveEma200_1h;

  return (
    <tr>
      <td colSpan={11} className="p-0">
        <div className="bg-white/[0.03] border-t border-b border-white/[0.08] p-5">
          {/* Data source badge */}
          <div className="flex items-center gap-2 mb-4">
            {isRealData ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5" /> Données Binance temps réel (250 bougies/TF)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <BarChart3 className="w-3.5 h-3.5" /> Données estimées — Cliquez pour charger Binance
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
                          <span className="text-gray-400">EMA 9</span>
                          <span className="text-gray-200 font-bold">${fmtPrice(ind.ema9)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">EMA 20</span>
                          <span className="text-gray-200 font-bold">${fmtPrice(ind.ema20)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">EMA 200</span>
                          <span className={`font-bold ${ind.lastClose > ind.ema200 ? "text-emerald-300" : "text-red-300"}`}>
                            ${fmtPrice(ind.ema200)} {ind.lastClose > ind.ema200 ? "▲" : "▼"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Alignement</span>
                          <span className={`font-bold ${ind.ema9 > ind.ema20 && ind.lastClose > ind.ema200 ? "text-emerald-300" : ind.ema9 < ind.ema20 ? "text-red-300" : "text-amber-300"}`}>
                            {ind.ema9 > ind.ema20 && ind.lastClose > ind.ema200 ? "▲ Haussier" : ind.ema9 < ind.ema20 && ind.lastClose < ind.ema200 ? "▼ Baissier" : "— Mixte"}
                          </span>
                        </div>
                        <div className="border-t border-white/[0.06] my-1" />
                        <div className="flex justify-between">
                          <span className="text-gray-400">MACD Ligne</span>
                          <span className={`font-bold ${ind.macdLine > ind.macdSignal ? "text-emerald-300" : "text-red-300"}`}>
                            {ind.macdLine > 0 ? "+" : ""}{fmtNum(ind.macdLine, price)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">MACD Signal</span>
                          <span className="text-gray-200 font-bold">
                            {ind.macdSignal > 0 ? "+" : ""}{fmtNum(ind.macdSignal, price)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">MACD Hist</span>
                          <span className={`font-bold ${ind.macdHist > 0 ? "text-emerald-300" : "text-red-300"}`}>
                            {ind.macdHist > 0 ? "▲ +" : "▼ "}{fmtNum(ind.macdHist, price)}
                          </span>
                        </div>
                        <div className="border-t border-white/[0.06] my-1" />
                        <div className="flex justify-between">
                          <span className="text-gray-400">RSI (9)</span>
                          <span className={`font-bold ${ind.rsi < 30 ? "text-emerald-300" : ind.rsi > 70 ? "text-red-300" : "text-gray-200"}`}>
                            {ind.rsi.toFixed(1)} {ind.rsi < 30 ? "Survente" : ind.rsi > 70 ? "Surachat" : ""}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">VWAP</span>
                          <span className={`font-bold ${ind.vwapAbove ? "text-emerald-300" : "text-red-300"}`}>
                            ${fmtPrice(ind.vwapValue)} {ind.vwapAbove ? "▲" : "▼"}
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
                          <span className="text-gray-200 font-bold">${fmtPrice(ind.atr)}</span>
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
                  <div className="text-3xl font-black text-white mt-1">{signal === "EN ATTENTE" ? "—" : `${score}/100`}</div>
                  {signal === "EN ATTENTE" && (
                    <p className="text-xs text-gray-500 mt-1">Chargement des données Binance...</p>
                  )}
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Prix actuel</span>
                    <span className="text-white font-bold">${formatPrice(coin.current_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">EMA 200 (1h)</span>
                    <span className={`font-bold ${price > indicators["1h"].ema200 ? "text-emerald-300" : "text-red-300"}`}>
                      ${fmtPrice(indicators["1h"].ema200)} {price > indicators["1h"].ema200 ? "✓" : "✗"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">VWAP (5m)</span>
                    <span className={`font-bold ${indicators["5m"].vwapAbove ? "text-emerald-300" : "text-red-300"}`}>
                      ${fmtPrice(indicators["5m"].vwapValue)} {indicators["5m"].vwapAbove ? "✓" : "✗"}
                    </span>
                  </div>
                  <div className="border-t border-white/[0.08] pt-3" />
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

                {/* Strict multi-TF validation */}
                <div className="mt-4 pt-4 border-t border-white/[0.08]">
                  <p className="text-xs text-gray-400 mb-2 font-bold">Validation Stricte Multi-TF :</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={is5mGreen ? "text-emerald-300" : "text-red-300"}>{is5mGreen ? "✓" : "✗"}</span>
                      <div className={`w-3 h-3 rounded-full ${getLightColor(indicators["5m"].light)}`} />
                      <span className="text-gray-300">5m Entrée</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={is15mGreen ? "text-emerald-300" : "text-red-300"}>{is15mGreen ? "✓" : "✗"}</span>
                      <div className={`w-3 h-3 rounded-full ${getLightColor(indicators["15m"].light)}`} />
                      <span className="text-gray-300">15m Confirmation</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={is1hGreen ? "text-emerald-300" : "text-red-300"}>{is1hGreen ? "✓" : "✗"}</span>
                      <div className={`w-3 h-3 rounded-full ${getLightColor(indicators["1h"].light)}`} />
                      <span className="text-gray-300">1h Direction</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={aboveEma200_1h ? "text-emerald-300" : "text-red-300"}>{aboveEma200_1h ? "✓" : "✗"}</span>
                      <span className="text-gray-300">Prix &gt; EMA 200 (1h)</span>
                    </div>
                  </div>
                  <div className={`mt-3 text-center py-2 rounded-lg font-black text-sm ${isFullyValidated ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20" : "bg-amber-500/10 text-amber-300 border border-amber-500/15"}`}>
                    {isFullyValidated ? "✓ SIGNAL VALIDÉ — ENTRÉE AUTORISÉE" : "⚠ NON VALIDÉ — ATTENDRE CONFIRMATION"}
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
  const [binanceProgress, setBinanceProgress] = useState({ loaded: 0, total: 0, active: false });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [signalFilter, setSignalFilter] = useState<Signal | "ALL" | "EN ATTENTE">("ALL");
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const binanceLoadedRef = useRef(false);
  const abortRef = useRef(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTop200(true);
      const results: CryptoAnalysis[] = data.map(coin => {
        const indicators = computeFromSparkline(coin);
        // Non-Binance data → force "EN ATTENTE" signal, no score
        const atr5m = indicators["5m"].atr || coin.current_price * 0.015;
        const stopLoss = coin.current_price - atr5m * 1.5;
        const takeProfit = coin.current_price + atr5m * 2;
        const risk = coin.current_price - stopLoss;
        const reward = takeProfit - coin.current_price;
        const riskReward = risk > 0 ? reward / risk : 0;
        return { coin, indicators, score: 0, signal: "EN ATTENTE" as Signal, stopLoss, takeProfit, riskReward, detailLoaded: false, isRealData: false };
      });
      setAnalyses(results);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Progressive Binance loading for ALL cryptos
  const loadAllBinance = useCallback(async (currentAnalyses: CryptoAnalysis[]) => {
    if (binanceLoadedRef.current || currentAnalyses.length === 0) return;
    binanceLoadedRef.current = true;
    abortRef.current = false;

    const total = currentAnalyses.length;
    setBinanceProgress({ loaded: 0, total, active: true });

    const BATCH_SIZE = 5;
    const BATCH_DELAY = 600;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      if (abortRef.current) break;
      const batch = currentAnalyses.slice(i, i + BATCH_SIZE);
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

      setBinanceProgress(p => ({ ...p, loaded: Math.min(i + BATCH_SIZE, total) }));

      if (i + BATCH_SIZE < total) {
        await new Promise(r => setTimeout(r, BATCH_DELAY));
      }
    }
    setBinanceProgress(p => ({ ...p, active: false }));
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      abortRef.current = true;
      binanceLoadedRef.current = false;
      loadData();
    }, 120_000); // refresh every 2 min
    return () => { clearInterval(interval); abortRef.current = true; };
  }, [loadData]);

  useEffect(() => {
    if (!loading && analyses.length > 0 && !binanceLoadedRef.current) {
      loadAllBinance(analyses);
    }
  }, [loading, analyses.length, loadAllBinance]);

  const handleExpand = useCallback(async (coinId: string) => {
    if (expandedId === coinId) { setExpandedId(null); return; }
    setExpandedId(coinId);
    const analysis = analyses.find(a => a.coin.id === coinId);
    if (!analysis || analysis.detailLoaded) return;
    setLoadingDetail(coinId);
    const updated = await loadBinanceForCrypto(analysis);
    setAnalyses(prev => prev.map(a => a.coin.id === coinId ? updated : a));
    setLoadingDetail(null);
  }, [expandedId, analyses]);

  const filtered = useMemo(() => {
    let list = analyses;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.coin.name.toLowerCase().includes(q) || a.coin.symbol.toLowerCase().includes(q));
    }
    if (signalFilter !== "ALL") list = list.filter(a => a.signal === signalFilter);
    if (minScore > 0) list = list.filter(a => a.score >= minScore);
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

  const realAnalyses = analyses.filter(a => a.isRealData);
  const buyCount = realAnalyses.filter(a => a.signal === "ACHAT FORT" || a.signal === "ACHAT").length;
  const sellCount = realAnalyses.filter(a => a.signal === "VENTE FORTE" || a.signal === "VENTE").length;
  const neutralCount = realAnalyses.filter(a => a.signal === "NEUTRE").length;
  const waitingCount = analyses.filter(a => a.signal === "EN ATTENTE").length;
  const avgScore = realAnalyses.length > 0 ? Math.round(realAnalyses.reduce((s, a) => s + a.score, 0) / realAnalyses.length) : 0;
  const realDataCount = realAnalyses.length;

  // Market sentiment based on BTC data
  const btcData = analyses.find(a => a.coin.symbol === "btc");
  const btcChange24h = btcData?.coin.price_change_percentage_24h ?? 0;
  const marketSentiment = useMemo(() => {
    // Use average 24h change of top 10 as market proxy
    const top10 = analyses.slice(0, 10);
    if (top10.length === 0) return { label: "CHARGEMENT", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/20", icon: "⏳" };
    const avgChange = top10.reduce((s, a) => s + (a.coin.price_change_percentage_24h || 0), 0) / top10.length;
    const redLights = top10.reduce((s, a) => s + (["5m", "15m", "1h"] as Timeframe[]).filter(tf => a.indicators[tf].light === "red").length, 0);
    const greenLights = top10.reduce((s, a) => s + (["5m", "15m", "1h"] as Timeframe[]).filter(tf => a.indicators[tf].light === "green").length, 0);

    if (avgChange < -5 || redLights > greenLights * 2) return { label: "PEUR EXTRÊME", color: "text-red-300", bg: "bg-red-500/10 border-red-500/20", icon: "🔴" };
    if (avgChange < -2 || redLights > greenLights) return { label: "PEUR", color: "text-orange-300", bg: "bg-orange-500/10 border-orange-500/20", icon: "🟠" };
    if (avgChange > 5 && greenLights > redLights * 2) return { label: "EUPHORIE", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/20", icon: "🟢" };
    if (avgChange > 2 && greenLights > redLights) return { label: "OPTIMISME", color: "text-green-300", bg: "bg-green-500/10 border-green-500/20", icon: "🟡" };
    return { label: "NEUTRE", color: "text-gray-300", bg: "bg-gray-500/10 border-gray-500/20", icon: "⚪" };
  }, [analyses]);

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
                    Day Trading 5min • EMA 9/20/200 • VWAP Intraday • RSI 9 • MACD 12/26/9 • ATR
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  Mis à jour : {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => { abortRef.current = true; binanceLoadedRef.current = false; loadData(); }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-gray-200 hover:text-white transition-all text-sm font-semibold disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Rafraîchir
              </button>
            </div>
          </div>

          {/* Binance progress bar */}
          {binanceProgress.active && (
            <div className="mb-4 bg-white/[0.03] border border-indigo-500/20 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Chargement des données Binance temps réel...
                </span>
                <span className="text-xs font-bold text-gray-400">
                  {binanceProgress.loaded}/{binanceProgress.total}
                </span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${binanceProgress.total > 0 ? (binanceProgress.loaded / binanceProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Market Sentiment Banner */}
          {analyses.length > 0 && (
            <div className={`mb-4 px-4 py-3 rounded-xl border flex flex-wrap items-center gap-3 ${marketSentiment.bg}`}>
              <span className="text-lg">{marketSentiment.icon}</span>
              <span className={`text-sm font-black ${marketSentiment.color}`}>
                Sentiment Marché : {marketSentiment.label}
              </span>
              {btcData && (
                <span className="text-xs text-gray-400">
                  | BTC : {btcChange24h > 0 ? "+" : ""}{btcChange24h.toFixed(1)}% (24h)
                  | ${formatPrice(btcData.coin.current_price)}
                </span>
              )}
              {marketSentiment.label === "PEUR EXTRÊME" || marketSentiment.label === "PEUR" ? (
                <span className="text-xs text-amber-300 ml-auto font-bold">⚠ Prudence recommandée pour le day trading</span>
              ) : null}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 mb-6">
            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-xs text-gray-400 font-bold mb-1">Cryptos</p>
              <p className="text-2xl font-black text-white">{analyses.length}</p>
            </div>
            <div className="bg-emerald-500/[0.08] rounded-xl p-4 border border-emerald-500/15">
              <p className="text-xs text-emerald-300 font-bold mb-1">Achat</p>
              <p className="text-2xl font-black text-emerald-300">{buyCount}</p>
            </div>
            <div className="bg-red-500/[0.08] rounded-xl p-4 border border-red-500/15">
              <p className="text-xs text-red-300 font-bold mb-1">Vente</p>
              <p className="text-2xl font-black text-red-300">{sellCount}</p>
            </div>
            <div className="bg-gray-500/[0.08] rounded-xl p-4 border border-gray-500/15">
              <p className="text-xs text-gray-300 font-bold mb-1">Neutres</p>
              <p className="text-2xl font-black text-gray-200">{neutralCount}</p>
            </div>
            <div className="bg-gray-800/[0.5] rounded-xl p-4 border border-gray-600/15">
              <p className="text-xs text-gray-500 font-bold mb-1">En Attente</p>
              <p className="text-2xl font-black text-gray-500">{waitingCount}</p>
            </div>
            <div className="bg-indigo-500/[0.08] rounded-xl p-4 border border-indigo-500/15">
              <p className="text-xs text-indigo-300 font-bold mb-1">Score Moy.</p>
              <p className={`text-2xl font-black ${getScoreColor(avgScore)}`}>{realDataCount > 0 ? `${avgScore}/100` : "—"}</p>
            </div>
            <div className="bg-cyan-500/[0.08] rounded-xl p-4 border border-cyan-500/15">
              <p className="text-xs text-cyan-300 font-bold mb-1">Binance</p>
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
                placeholder="Rechercher une crypto..."
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
              {(signalFilter !== "ALL" || minScore > 0) && <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />}
            </button>
          </div>

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
                  <option value="EN ATTENTE">En Attente</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold block mb-1.5">Score min : {minScore}</label>
                <input type="range" min={0} max={90} step={5} value={minScore} onChange={e => setMinScore(Number(e.target.value))} className="w-40 accent-indigo-500" />
              </div>
              <button onClick={() => { setSignalFilter("ALL"); setMinScore(0); }} className="text-sm text-gray-400 hover:text-white transition-colors underline">
                Réinitialiser
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-5 mb-4 px-1">
            <span className="text-xs text-gray-500 font-bold">Légende :</span>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-400" /><span className="text-xs text-gray-400">Haussier</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-400" /><span className="text-xs text-gray-400">Neutre</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><span className="text-xs text-gray-400">Baissier</span></div>
            <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /><span className="text-xs text-gray-400">Binance réel</span></div>
            <div className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-amber-400" /><span className="text-xs text-gray-400">Estimé</span></div>
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
                    <SortHeader label="Score" sKey="score" />
                    <SortHeader label="Signal" sKey="signal" />
                    <SortHeader label="RSI" sKey="rsi" />
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">MACD</th>
                    <th className="px-3 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">EMA200</th>
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
                      const aboveEma200 = coin.current_price > indicators["1h"].ema200;

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
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                  ) : (
                                    <BarChart3 className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
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
                              {signal === "EN ATTENTE" ? (
                                <span className="text-lg font-black text-gray-600">—</span>
                              ) : (
                                <span className={`text-lg font-black ${getScoreColor(score)}`}>{score}</span>
                              )}
                            </td>
                            <td className="px-3 py-3.5">
                              <div className="flex flex-col items-start gap-1">
                                <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${getSignalBg(signal)} ${getSignalColor(signal)}`}>
                                  {signal}
                                </span>
                                {signal === "EN ATTENTE" && (
                                  <span className="text-[9px] text-gray-500 flex items-center gap-0.5">
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                    Binance...
                                  </span>
                                )}
                                {(signal === "ACHAT FORT" || signal === "ACHAT") && (
                                  indicators["5m"].light !== "green" || indicators["15m"].light !== "green" || indicators["1h"].light !== "green"
                                ) && (
                                  <span className="text-[9px] text-amber-400 flex items-center gap-0.5">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    {indicators["5m"].light === "red" ? "5m rouge" : indicators["15m"].light === "red" ? "15m rouge" : indicators["1h"].light === "red" ? "1h rouge" : indicators["5m"].light === "orange" ? "5m orange" : indicators["15m"].light === "orange" ? "15m orange" : "1h orange"}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-sm font-bold ${rsi5m < 30 ? "text-emerald-300" : rsi5m > 70 ? "text-red-300" : "text-gray-200"}`}>
                                {rsi5m.toFixed(0)}
                              </span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-sm font-bold ${macdH > 0 ? "text-emerald-300" : "text-red-300"}`}>
                                {macdH > 0 ? "▲" : "▼"} {fmtNum(macdH, coin.current_price)}
                              </span>
                            </td>
                            <td className="px-3 py-3.5">
                              <span className={`text-sm font-bold ${aboveEma200 ? "text-emerald-300" : "text-red-300"}`}>
                                {aboveEma200 ? "▲" : "▼"}
                              </span>
                            </td>
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
                <strong>Avertissement :</strong> Indicateurs calculés : EMA 9/20/200, VWAP intraday, RSI 9, MACD (12,26,9), Bollinger (20,2), ATR.
                Les feux tricolores sont pondérés : VWAP (30%), EMA (30%), MACD (20%), RSI (20%).
                Règle d&apos;entrée : feu vert sur 5m + 15m + 1h ET prix &gt; EMA 200 (1h).
                Les données Binance (250 bougies/TF) sont chargées progressivement.
                Ceci ne constitue pas un conseil financier.
              </span>
            </p>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}