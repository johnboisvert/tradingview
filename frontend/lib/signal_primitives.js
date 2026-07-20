// Shared signal-engine primitives (extracted from server.js — Session 43).
// Used by swing alerts, scalp engine, range engine and call resolvers.
import { BYBIT_FALLBACK_SYMBOLS, fetchBybitKlines } from './market_sources.js';

// ─── Top liquid USDT symbols (dynamic, 1h cache, static fallback) ───
export const SCALP_SYMBOLS_FALLBACK = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT',
  'LINKUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'NEARUSDT',
  'APTUSDT', 'ARBUSDT', 'OPUSDT', 'SUIUSDT', 'PEPEUSDT',
  'TRXUSDT', 'SHIBUSDT', 'FTMUSDT', 'FILUSDT', 'ALGOUSDT',
  'VETUSDT', 'ICPUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT',
  'AAVEUSDT', 'GRTUSDT', 'INJUSDT', 'TIAUSDT', 'SEIUSDT',
  'WLDUSDT', 'JUPUSDT', 'STXUSDT', 'RENDERUSDT', 'FETUSDT',
  'ONDOUSDT', 'ENAUSDT', 'WIFUSDT', 'BONKUSDT', 'FLOKIUSDT',
  'RUNEUSDT', 'PENDLEUSDT', 'JASMYUSDT', 'CFXUSDT', 'EGLDUSDT',
];

let _cachedScalpSymbols = null;
let _cachedScalpSymbolsTs = 0;
const SCALP_SYMBOLS_CACHE_MS = 60 * 60 * 1000; // 1 hour

export async function fetchTop200USDTSymbols() {
  const now = Date.now();
  if (_cachedScalpSymbols && (now - _cachedScalpSymbolsTs) < SCALP_SYMBOLS_CACHE_MS) {
    return _cachedScalpSymbols;
  }
  try {
    const resp = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr');
    if (!resp.ok) throw new Error(`Binance API error: ${resp.status}`);
    const tickers = await resp.json();
    // Filter USDT pairs, exclude stablecoins and leveraged tokens
    const excluded = ['USDCUSDT', 'BUSDUSDT', 'TUSDUSDT', 'DAIUSDT', 'FDUSDUSDT', 'EURUSDT', 'GBPUSDT', 'AUDUSDT', 'USDPUSDT'];
    const usdtPairs = tickers
      .filter(t =>
        t.symbol.endsWith('USDT') &&
        !excluded.includes(t.symbol) &&
        !t.symbol.includes('UP') &&
        !t.symbol.includes('DOWN') &&
        !t.symbol.includes('BEAR') &&
        !t.symbol.includes('BULL') &&
        parseFloat(t.quoteVolume) > 0
      )
      .filter(t => parseFloat(t.quoteVolume) > 50000000) // v3: min $50M quote volume for liquidity
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 50) // v3: Top 50 only (was 200) — focus on most liquid pairs
      .map(t => t.symbol);

    if (usdtPairs.length >= 50) {
      _cachedScalpSymbols = usdtPairs;
      _cachedScalpSymbolsTs = now;
      console.log(`[ScalpAlert] Fetched top ${usdtPairs.length} USDT symbols from Binance by volume`);
      return usdtPairs;
    }
    throw new Error(`Only ${usdtPairs.length} symbols found, using fallback`);
  } catch (err) {
    console.warn(`[ScalpAlert] Failed to fetch dynamic symbols: ${err.message}. Using fallback list.`);
    return SCALP_SYMBOLS_FALLBACK;
  }
}

// ─── Technical Indicator Calculations ───

export function calcEMA(data, period) {
  const k = 2 / (period + 1);
  const ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

/** ATR calculation for M5 klines (scalp v2) */
export function calcATR_M5(klines, period = 14) {
  if (!klines || klines.length < period + 1) return null;
  const trs = [];
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

export function calcRSI(closes, period = 14) {
  const rsi = new Array(closes.length).fill(50);
  if (closes.length < period + 1) return rsi;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

export function calcStochRSI(closes, rsiPeriod = 14, stochPeriod = 14, kSmooth = 3, dSmooth = 3) {
  const rsi = calcRSI(closes, rsiPeriod);
  const stochRaw = new Array(rsi.length).fill(50);
  for (let i = stochPeriod - 1; i < rsi.length; i++) {
    const slice = rsi.slice(i - stochPeriod + 1, i + 1);
    const min = Math.min(...slice);
    const max = Math.max(...slice);
    stochRaw[i] = max === min ? 50 : ((rsi[i] - min) / (max - min)) * 100;
  }
  // SMA smoothing for K
  const kLine = new Array(stochRaw.length).fill(50);
  for (let i = kSmooth - 1; i < stochRaw.length; i++) {
    let sum = 0;
    for (let j = 0; j < kSmooth; j++) sum += stochRaw[i - j];
    kLine[i] = sum / kSmooth;
  }
  // SMA smoothing for D
  const dLine = new Array(kLine.length).fill(50);
  for (let i = dSmooth - 1; i < kLine.length; i++) {
    let sum = 0;
    for (let j = 0; j < dSmooth; j++) sum += kLine[i - j];
    dLine[i] = sum / dSmooth;
  }
  return { k: kLine, d: dLine };
}

export function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = calcEMA(macdLine, signal);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);
  return { macd: macdLine, signal: signalLine, histogram };
}

// ─── Bollinger Bands calculation ───
export function calcBollingerBands(closes, period = 20, stdDev = 2) {
  if (closes.length < period) return null;
  const sma = [];
  const upper = [];
  const lower = [];
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    sma.push(mean);
    upper.push(mean + stdDev * sd);
    lower.push(mean - stdDev * sd);
  }
  return { sma, upper, lower };
}

// ─── ADX calculation ───
export function calcADX(klines, period = 14) {
  if (!klines || klines.length < period * 2 + 1) return null;
  const plusDM = [];
  const minusDM = [];
  const tr = [];
  for (let i = 1; i < klines.length; i++) {
    const highDiff = klines[i].high - klines[i - 1].high;
    const lowDiff = klines[i - 1].low - klines[i].low;
    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
    tr.push(Math.max(
      klines[i].high - klines[i].low,
      Math.abs(klines[i].high - klines[i - 1].close),
      Math.abs(klines[i].low - klines[i - 1].close)
    ));
  }
  // Smoothed TR, +DM, -DM
  let smoothTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);
  const dx = [];
  for (let i = period; i < tr.length; i++) {
    if (i > period) {
      smoothTR = smoothTR - smoothTR / period + tr[i];
      smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDM[i];
      smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDM[i];
    }
    const plusDI = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : 0;
    const minusDI = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : 0;
    const diSum = plusDI + minusDI;
    dx.push(diSum > 0 ? Math.abs(plusDI - minusDI) / diSum * 100 : 0);
  }
  if (dx.length < period) return null;
  let adx = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < dx.length; i++) {
    adx = (adx * (period - 1) + dx[i]) / period;
  }
  return adx;
}

// ─── Fetch Binance klines for a symbol (with Bybit fallback) ───
export async function fetchBinanceKlines(symbol, interval, limit = 100) {
  // If known Bybit symbol, go directly to Bybit
  if (BYBIT_FALLBACK_SYMBOLS.has(symbol)) {
    try {
      const bybitList = await fetchBybitKlines(symbol, interval, String(limit));
      if (bybitList) {
        const reversed = [...bybitList].reverse();
        return reversed.map(k => ({
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
          time: parseInt(k[0]),
        }));
      }
    } catch (err) {
      console.error(`[ScalpAlert] Bybit klines error for ${symbol} ${interval}:`, err.message);
    }
    return [];
  }

  try {
    const resp = await fetch(
      `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!resp.ok) {
      // Try Bybit fallback
      try {
        const bybitList = await fetchBybitKlines(symbol, interval, String(limit));
        if (bybitList) {
          BYBIT_FALLBACK_SYMBOLS.add(symbol);
          console.log(`[ScalpAlert] ${symbol} found on Bybit (fallback)`);
          const reversed = [...bybitList].reverse();
          return reversed.map(k => ({
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
            time: parseInt(k[0]),
          }));
        }
      } catch (_e) { /* ignore */ }
      return [];
    }
    const data = await resp.json();
    return data.map(k => ({
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      time: k[0],
    }));
  } catch (err) {
    console.error(`[ScalpAlert] Binance klines error for ${symbol} ${interval}:`, err.message);
    return [];
  }
}

// ─── Formatting helpers (shared by swing/scalp/range engines) ───
// ─── Helper: format large numbers for display ───
export function formatNumber(num) {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

// ─── Helper: format price with appropriate decimals ───
export function formatPrice(price) {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

export function roundPrice(value, reference) {
  if (reference >= 1000) return Math.round(value * 100) / 100;
  if (reference >= 1) return Math.round(value * 10000) / 10000;
  if (reference >= 0.01) return Math.round(value * 1000000) / 1000000;
  // v7: micro-prices (PEPE, SHIB…) — fixed decimals destroyed SL/TP levels (6% became 3.2%)
  return Number(value.toPrecision(5));
}
