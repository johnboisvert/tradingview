// Scalp signal engine (extracted from server.js — Session 44, refactor phase 2).
// EMA + VWAP + Stochastic M5 setups, Telegram alerts, auto-registered scalp calls.
// Shared state (telegram config, scalp calls persistence, call id counter) is injected.
import path from 'path';
import fs from 'fs';
import {
  SCALP_SYMBOLS_FALLBACK, fetchTop200USDTSymbols,
  calcEMA, calcATR_M5, calcRSI, calcStochRSI, calcMACD,
  fetchBinanceKlines,
} from './signal_primitives.js';

export function createScalpEngine(deps) {
  const {
    dataDir, loadTelegramAlerts, sendTelegramMessage, formatPrice,
    loadScalpCalls, saveScalpCalls, allocateScalpCallId,
  } = deps;


const SCALP_COOLDOWN_MS = 45 * 60 * 1000; // v3: 45 minutes cooldown for scalp (was 30min)
const SCALP_COOLDOWNS_FILE = path.join(dataDir, 'scalp_cooldowns.json');
const inMemoryScalpCooldowns = new Map();


// Synchronous reference for non-async contexts (initialized on first fetch)
let SCALP_SYMBOLS = [...SCALP_SYMBOLS_FALLBACK];
// Pre-fetch on boot
fetchTop200USDTSymbols().then(syms => { SCALP_SYMBOLS = syms; }).catch(() => {});

function loadScalpCooldowns() {
  try {
    if (fs.existsSync(SCALP_COOLDOWNS_FILE)) {
      return JSON.parse(fs.readFileSync(SCALP_COOLDOWNS_FILE, 'utf8'));
    }
  } catch (_e) { /* ignore */ }
  return {};
}

function saveScalpCooldowns(cooldowns) {
  try {
    fs.writeFileSync(SCALP_COOLDOWNS_FILE, JSON.stringify(cooldowns, null, 2));
  } catch (err) {
    console.error('[ScalpAlert] Error saving cooldowns:', err);
  }
}

function isScalpCooldownActive(cooldowns, symbol, direction) {
  const now = Date.now();
  const memKey = `${symbol}_${direction}`;
  const memTs = inMemoryScalpCooldowns.get(memKey);
  if (memTs && (now - memTs) < SCALP_COOLDOWN_MS) return true;
  const fileEntry = cooldowns[memKey];
  if (fileEntry) {
    const elapsed = now - new Date(fileEntry.timestamp).getTime();
    if (elapsed < SCALP_COOLDOWN_MS && fileEntry.direction === direction) {
      inMemoryScalpCooldowns.set(memKey, new Date(fileEntry.timestamp).getTime());
      return true;
    }
  }
  return false;
}

function setScalpCooldown(cooldowns, symbol, direction) {
  const now = Date.now();
  const memKey = `${symbol}_${direction}`;
  inMemoryScalpCooldowns.set(memKey, now);
  cooldowns[memKey] = { timestamp: new Date(now).toISOString(), direction };
}

// Initialize scalp cooldowns from file on boot
(function initScalpCooldownsFromFile() {
  const cooldowns = loadScalpCooldowns();
  const now = Date.now();
  for (const [key, entry] of Object.entries(cooldowns)) {
    if (entry && entry.timestamp) {
      const elapsed = now - new Date(entry.timestamp).getTime();
      if (elapsed < SCALP_COOLDOWN_MS) {
        inMemoryScalpCooldowns.set(key, new Date(entry.timestamp).getTime());
      }
    }
  }
  console.log(`[ScalpAlert] Loaded ${inMemoryScalpCooldowns.size} active scalp cooldowns from file`);
})();

// ─── Indicators (calcEMA/RSI/StochRSI/MACD/ATR) + fetchBinanceKlines → lib/signal_primitives.js ───

// ─── Generate Scalp Setup for a single symbol ───
async function generateScalpSetup(symbol) {
  // ═══ "Précision" v3 Strategy: EMA 8/20 + VWAP + Stochastique (9,3,1) + RSI M5 ═══

  // Fetch M5 candles (100 candles = ~8h of data)
  const m5Candles = await fetchBinanceKlines(symbol, '5m', 100);
  if (m5Candles.length < 50) return null;

  // Fetch H1 candles for bias
  const h1Candles = await fetchBinanceKlines(symbol, '1h', 50);
  if (h1Candles.length < 25) return null;

  // Fetch 4H candles for higher timeframe trend filter
  const h4Candles = await fetchBinanceKlines(symbol, '4h', 50);

  // Fetch Daily candles for macro trend filter
  const d1Candles = await fetchBinanceKlines(symbol, '1d', 50);

  const m5Closes = m5Candles.map(c => c.close);
  const h1Closes = h1Candles.map(c => c.close);
  const currentPrice = m5Closes[m5Closes.length - 1];

  // ─── H1 EMA 8 & EMA 20 ───
  const h1Ema8 = calcEMA(h1Closes, 8);
  const h1Ema20 = calcEMA(h1Closes, 20);
  const h1Ema8Val = h1Ema8[h1Ema8.length - 1];
  const h1Ema20Val = h1Ema20[h1Ema20.length - 1];
  const h1Price = h1Closes[h1Closes.length - 1];

  // ─── H1 VWAP ───
  let h1CumTPV = 0, h1CumVol = 0;
  for (const c of h1Candles) {
    const tp = (c.high + c.low + c.close) / 3;
    h1CumTPV += tp * c.volume;
    h1CumVol += c.volume;
  }
  const h1Vwap = h1CumVol > 0 ? h1CumTPV / h1CumVol : null;
  if (h1Vwap === null) return null;

  // ─── 4H EMA 8 & EMA 20 (Higher Timeframe Trend Filter) ───
  let h4Trend = 'neutral';
  let h4Ema8Val = null;
  let h4Ema20Val = null;
  if (h4Candles.length >= 25) {
    const h4Closes = h4Candles.map(c => c.close);
    const h4Ema8 = calcEMA(h4Closes, 8);
    const h4Ema20 = calcEMA(h4Closes, 20);
    h4Ema8Val = h4Ema8[h4Ema8.length - 1];
    h4Ema20Val = h4Ema20[h4Ema20.length - 1];
    const h4Spread = Math.abs(h4Ema8Val - h4Ema20Val) / h4Ema20Val;
    // If EMAs are within 0.1%, consider neutral
    if (h4Spread < 0.001) {
      h4Trend = 'neutral';
    } else if (h4Ema8Val > h4Ema20Val) {
      h4Trend = 'bullish';
    } else {
      h4Trend = 'bearish';
    }
  }

  // ─── Daily EMA 8 & EMA 20 (Macro Trend Filter) ───
  let d1Trend = 'neutral';
  let d1Ema8Val = null;
  let d1Ema20Val = null;
  if (d1Candles.length >= 25) {
    const d1Closes = d1Candles.map(c => c.close);
    const d1Ema8 = calcEMA(d1Closes, 8);
    const d1Ema20 = calcEMA(d1Closes, 20);
    d1Ema8Val = d1Ema8[d1Ema8.length - 1];
    d1Ema20Val = d1Ema20[d1Ema20.length - 1];
    const d1Spread = Math.abs(d1Ema8Val - d1Ema20Val) / d1Ema20Val;
    if (d1Spread < 0.001) {
      d1Trend = 'neutral';
    } else if (d1Ema8Val > d1Ema20Val) {
      d1Trend = 'bullish';
    } else {
      d1Trend = 'bearish';
    }
  }

  // ─── Step 1: H1 Bias ───
  let h1Trend = 'neutral';
  if (h1Price > h1Ema20Val && h1Price > h1Vwap) h1Trend = 'bullish';
  else if (h1Price < h1Ema20Val && h1Price < h1Vwap) h1Trend = 'bearish';

  if (h1Trend === 'neutral') {
    console.log(`[ScalpAlert] ⏭️ ${symbol} rejected: H1 bias neutral (price=${h1Price.toFixed(2)}, EMA20=${h1Ema20Val.toFixed(2)}, VWAP=${h1Vwap.toFixed(2)})`);
    return null;
  }

  // ─── Step 1b: 4H Trend Filter — Penalize (don't reject) conflicting 4H trend ───
  // v5: No longer hard-reject on 4H conflict — apply penalty instead to allow counter-trend scalps
  let h4ConflictPenalty = 0;
  if (h1Trend === 'bullish' && h4Trend === 'bearish') {
    h4ConflictPenalty = 10;
    console.log(`[ScalpAlert] ⚠️ ${symbol}: 4H Bearish conflicts with H1 Bullish — penalty -10`);
  } else if (h1Trend === 'bearish' && h4Trend === 'bullish') {
    h4ConflictPenalty = 10;
    console.log(`[ScalpAlert] ⚠️ ${symbol}: 4H Bullish conflicts with H1 Bearish — penalty -10`);
  }

  // 4H neutral: allow signal but will reduce confidence by 5 later
  const h4NeutralPenalty = (h4Trend === 'neutral') ? 5 : 0;

  // ─── M5 EMA 8 & EMA 20 ───
  const m5Ema8 = calcEMA(m5Closes, 8);
  const m5Ema20 = calcEMA(m5Closes, 20);
  const m5Ema8Val = m5Ema8[m5Ema8.length - 1];
  const m5Ema20Val = m5Ema20[m5Ema20.length - 1];

  // ─── M5 VWAP ───
  let m5CumTPV = 0, m5CumVol = 0;
  for (const c of m5Candles) {
    const tp = (c.high + c.low + c.close) / 3;
    m5CumTPV += tp * c.volume;
    m5CumVol += c.volume;
  }
  const m5Vwap = m5CumVol > 0 ? m5CumTPV / m5CumVol : null;
  if (m5Vwap === null) return null;

  // ─── M5 Stochastic (9, 3, 1) ───
  // %K = (close - LL9) / (HH9 - LL9) * 100, %D = SMA(%K, 3)
  const stochKArr = [];
  for (let i = 8; i < m5Candles.length; i++) {
    const window = m5Candles.slice(i - 8, i + 1);
    const ll = Math.min(...window.map(c => c.low));
    const hh = Math.max(...window.map(c => c.high));
    const close = m5Candles[i].close;
    stochKArr.push(hh === ll ? 50 : ((close - ll) / (hh - ll)) * 100);
  }
  if (stochKArr.length < 4) return null;

  const stochDArr = [];
  for (let i = 2; i < stochKArr.length; i++) {
    stochDArr.push((stochKArr[i] + stochKArr[i - 1] + stochKArr[i - 2]) / 3);
  }
  if (stochDArr.length < 2) return null;

  const kVal = stochKArr[stochKArr.length - 1];
  const dVal = stochDArr[stochDArr.length - 1];
  const kPrev = stochKArr[stochKArr.length - 2];
  const dPrev = stochDArr[stochDArr.length - 2];

  // ─── M5 EMA crossover check (last 3 candles) ───
  let emaCrossUp = false, emaCrossDown = false;
  for (let i = Math.max(0, m5Ema8.length - 3); i < m5Ema8.length; i++) {
    if (i > 0 && m5Ema8[i - 1] <= m5Ema20[i - 1] && m5Ema8[i] > m5Ema20[i]) emaCrossUp = true;
    if (i > 0 && m5Ema8[i - 1] >= m5Ema20[i - 1] && m5Ema8[i] < m5Ema20[i]) emaCrossDown = true;
  }

  const ema8AboveEma20 = m5Ema8Val > m5Ema20Val;
  const ema8BelowEma20 = m5Ema8Val < m5Ema20Val;

  // Price proximity to EMA (rebond)
  const distToEma8 = Math.abs(currentPrice - m5Ema8Val) / currentPrice;
  const distToEma20 = Math.abs(currentPrice - m5Ema20Val) / currentPrice;
  const priceNearEma = distToEma8 < 0.003 || distToEma20 < 0.003;
  const priceBetweenEmas = (currentPrice >= Math.min(m5Ema8Val, m5Ema20Val) && currentPrice <= Math.max(m5Ema8Val, m5Ema20Val));

  // Stochastic conditions — v3: ultra-tight thresholds for precision
  const stochOversold = kVal < 20;        // v3: Tightened from 25 to 20
  const stochDeepOversold = kVal < 10;    // v3: Tightened from 15 to 10
  const stochOverbought = kVal > 80;      // v3: Tightened from 75 to 80
  const stochDeepOverbought = kVal > 90;  // v3: Tightened from 85 to 90
  const stochCrossUp = kPrev <= dPrev && kVal > dVal;
  const stochCrossDown = kPrev >= dPrev && kVal < dVal;
  const stochRising = kVal > kPrev;
  const stochFalling = kVal < kPrev;

  // Extended price proximity — relaxed from 0.003 to 0.006
  const priceNearEmaWide = distToEma8 < 0.006 || distToEma20 < 0.006;

  // ─── RSI(14) on M5 closes — v3: confirmation filter ───
  let rsiM5 = null;
  if (m5Closes.length >= 15) {
    let gainSum = 0, lossSum = 0;
    for (let i = 1; i <= 14; i++) {
      const diff = m5Closes[i] - m5Closes[i - 1];
      if (diff >= 0) gainSum += diff; else lossSum += Math.abs(diff);
    }
    let avgGain = gainSum / 14, avgLoss = lossSum / 14;
    for (let i = 15; i < m5Closes.length; i++) {
      const diff = m5Closes[i] - m5Closes[i - 1];
      if (diff >= 0) { avgGain = (avgGain * 13 + diff) / 14; avgLoss = (avgLoss * 13) / 14; }
      else { avgGain = (avgGain * 13) / 14; avgLoss = (avgLoss * 13 + Math.abs(diff)) / 14; }
    }
    rsiM5 = avgLoss === 0 ? 100 : Math.round((100 - 100 / (1 + avgGain / avgLoss)) * 10) / 10;
  }

  // ─── Candle Pattern Detection — v3: pin bars & engulfing ───
  function detectRejectionCandle(candles, direction) {
    const last3 = candles.slice(-3);
    for (const c of last3) {
      const body = Math.abs(c.close - c.open);
      const lowerWick = Math.min(c.open, c.close) - c.low;
      const upperWick = c.high - Math.max(c.open, c.close);
      // Pin bar detection
      if (direction === 'LONG' && lowerWick > body * 2 && body > 0) return true;
      if (direction === 'SHORT' && upperWick > body * 2 && body > 0) return true;
    }
    // Engulfing pattern (last 2 candles)
    if (last3.length >= 2) {
      const prev = last3[last3.length - 2];
      const curr = last3[last3.length - 1];
      const prevBody = Math.abs(prev.close - prev.open);
      const currBody = Math.abs(curr.close - curr.open);
      if (direction === 'LONG' && curr.close > curr.open && prev.close < prev.open && currBody > prevBody * 1.2) return true;
      if (direction === 'SHORT' && curr.close < curr.open && prev.close > prev.open && currBody > prevBody * 1.2) return true;
    }
    return false;
  }

  // ─── M5 Momentum Filter — v3: at least 2 of last 3 candles must close in signal direction ───
  function checkM5Momentum(candles, direction) {
    const last3 = candles.slice(-3);
    let count = 0;
    for (const c of last3) {
      if (direction === 'LONG' && c.close > c.open) count++;
      if (direction === 'SHORT' && c.close < c.open) count++;
    }
    return count >= 2;
  }

  // ─── Signal Detection ───
  let side = null;
  let confidence = 0;
  const reasons = [];

  // ─── LONG Signal — Type A: Pullback Entry (v3: strict filters) ───
  if (h1Trend === 'bullish') {
    const cond2 = ema8AboveEma20 || emaCrossUp;
    const cond3 = priceNearEma || priceBetweenEmas || priceNearEmaWide;
    const cond4 = currentPrice > m5Vwap;
    const cond5 = stochOversold && (stochCrossUp || stochRising);
    const cond6 = rsiM5 !== null ? rsiM5 < 40 : true; // v3: RSI M5 must be < 40 for LONG
    const cond7 = checkM5Momentum(m5Candles, 'LONG'); // v3: 2/3 candles bullish

    if (cond2 && cond3 && cond4 && cond5 && cond6 && cond7) {
      side = 'LONG';
      confidence = 50;
      reasons.push(`H1: Prix > EMA20 ($${h1Ema20Val.toFixed(2)}) & VWAP ($${h1Vwap.toFixed(2)}) ✓`);

      if (emaCrossUp) { confidence += 10; reasons.push('M5: Croisement EMA8 > EMA20 récent ↑'); }
      else { reasons.push('M5: EMA8 > EMA20 ✓'); }

      if (distToEma20 < 0.001) { confidence += 8; reasons.push(`M5: Rebond parfait EMA20`); }
      else if (priceNearEma) { confidence += 4; reasons.push('M5: Prix proche EMA'); }
      else if (priceNearEmaWide) { confidence += 2; reasons.push('M5: Prix zone EMA'); }

      if (stochDeepOversold) { confidence += 10; reasons.push(`Stoch: Survente extrême (K:${kVal.toFixed(1)})`); }
      else if (kVal < 20) { confidence += 7; reasons.push(`Stoch: Survente (K:${kVal.toFixed(1)})`); }
      else { confidence += 4; reasons.push(`Stoch: Zone basse (K:${kVal.toFixed(1)})`); }

      if (stochCrossUp) { confidence += 8; reasons.push(`Stoch: Croisement K↑D`); }

      if (rsiM5 !== null) { reasons.push(`RSI M5: ${rsiM5} (zone favorable LONG)`); if (rsiM5 < 30) confidence += 5; }

      const vwapDist = (currentPrice - m5Vwap) / currentPrice;
      if (vwapDist > 0.002) { confidence += 4; reasons.push('VWAP M5: bien au-dessus ✓'); }

      // v3: Stronger volume filter — 2.0x base, 3.0x bonus
      const recentVol = m5Candles.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
      const avgVol = m5Candles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
      if (avgVol > 0 && recentVol > avgVol * 3.0) { confidence += 8; reasons.push('Volume M5 spike fort (>3x)'); }
      else if (avgVol > 0 && recentVol > avgVol * 2.0) { confidence += 5; reasons.push('Volume M5 supérieur (>2x)'); }

      // v3: Candle pattern bonus
      if (detectRejectionCandle(m5Candles, 'LONG')) { confidence += 10; reasons.push('📌 Pattern de rejet haussier détecté'); }

      // H1 EMA spread bonus
      const h1Spread = Math.abs(h1Ema8Val - h1Ema20Val) / h1Ema20Val;
      if (h1Spread > 0.005) { confidence += 5; reasons.push('H1: Tendance forte (EMA8/20 écartées)'); }
    }

    // ─── LONG Signal — Type B: Momentum Continuation (v3: with RSI + momentum) ───
    if (!side && h1Trend === 'bullish') {
      const strongH1 = h1Ema8Val > h1Ema20Val && h1Price > h1Ema8Val;
      const emaCrossRecent = emaCrossUp;
      const stochMidRising = kVal > 40 && kVal < 75 && stochCrossUp;
      const aboveVwap = currentPrice > m5Vwap;
      const rsiOk = rsiM5 !== null ? rsiM5 < 40 : true; // v3: RSI filter
      const momentumOk = checkM5Momentum(m5Candles, 'LONG'); // v3: momentum filter

      if (strongH1 && emaCrossRecent && stochMidRising && aboveVwap && rsiOk && momentumOk) {
        side = 'LONG';
        confidence = 45;
        reasons.push(`H1: Tendance forte haussière (EMA8 > EMA20, prix > EMA8) ✓`);
        reasons.push('M5: Croisement EMA8 > EMA20 récent ↑');
        reasons.push(`Stoch: Croisement K↑D en zone médiane (K:${kVal.toFixed(1)})`);
        if (rsiM5 !== null) reasons.push(`RSI M5: ${rsiM5}`);

        const vwapDist = (currentPrice - m5Vwap) / currentPrice;
        if (vwapDist > 0.003) { confidence += 5; reasons.push('VWAP M5: bien au-dessus ✓'); }

        // v3: Stronger volume filter
        const recentVol = m5Candles.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
        const avgVol = m5Candles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
        if (avgVol > 0 && recentVol > avgVol * 3.0) { confidence += 8; reasons.push('Volume M5 spike fort (>3x)'); }
        else if (avgVol > 0 && recentVol > avgVol * 2.0) { confidence += 5; reasons.push('Volume M5 supérieur (>2x)'); }

        // v3: Candle pattern bonus
        if (detectRejectionCandle(m5Candles, 'LONG')) { confidence += 10; reasons.push('📌 Pattern de rejet haussier détecté'); }

        const h1Spread = Math.abs(h1Ema8Val - h1Ema20Val) / h1Ema20Val;
        if (h1Spread > 0.008) { confidence += 8; reasons.push('H1: Tendance très forte (EMA8/20 très écartées)'); }
        else if (h1Spread > 0.004) { confidence += 4; reasons.push('H1: Tendance forte'); }
      }
    }

    // v3: Type C (LONG counter-trend) REMOVED — counter-trend signals eliminated for precision
  }

  // ─── SHORT Signal — Type A: Pullback Entry (v3: strict filters) ───
  if (h1Trend === 'bearish' && !side) {
    const cond2 = ema8BelowEma20 || emaCrossDown;
    const cond3 = priceNearEma || priceBetweenEmas || priceNearEmaWide;
    const cond4 = currentPrice < m5Vwap;
    const cond5 = stochOverbought && (stochCrossDown || stochFalling);
    const cond6 = rsiM5 !== null ? rsiM5 > 60 : true; // v3: RSI M5 must be > 60 for SHORT
    const cond7 = checkM5Momentum(m5Candles, 'SHORT'); // v3: 2/3 candles bearish

    if (cond2 && cond3 && cond4 && cond5 && cond6 && cond7) {
      side = 'SHORT';
      confidence = 50;
      reasons.push(`H1: Prix < EMA20 ($${h1Ema20Val.toFixed(2)}) & VWAP ($${h1Vwap.toFixed(2)}) ✓`);

      if (emaCrossDown) { confidence += 10; reasons.push('M5: Croisement EMA8 < EMA20 récent ↓'); }
      else { reasons.push('M5: EMA8 < EMA20 ✓'); }

      if (distToEma20 < 0.001) { confidence += 8; reasons.push(`M5: Rejet parfait EMA20`); }
      else if (priceNearEma) { confidence += 4; reasons.push('M5: Prix proche EMA'); }
      else if (priceNearEmaWide) { confidence += 2; reasons.push('M5: Prix zone EMA'); }

      if (stochDeepOverbought) { confidence += 10; reasons.push(`Stoch: Surachat extrême (K:${kVal.toFixed(1)})`); }
      else if (kVal > 80) { confidence += 7; reasons.push(`Stoch: Surachat (K:${kVal.toFixed(1)})`); }
      else { confidence += 4; reasons.push(`Stoch: Zone haute (K:${kVal.toFixed(1)})`); }

      if (stochCrossDown) { confidence += 8; reasons.push(`Stoch: Croisement K↓D`); }

      if (rsiM5 !== null) { reasons.push(`RSI M5: ${rsiM5} (zone favorable SHORT)`); if (rsiM5 > 70) confidence += 5; }

      const vwapDist = (m5Vwap - currentPrice) / currentPrice;
      if (vwapDist > 0.002) { confidence += 4; reasons.push('VWAP M5: bien en-dessous ✓'); }

      // v3: Stronger volume filter — 2.0x base, 3.0x bonus
      const recentVol = m5Candles.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
      const avgVol = m5Candles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
      if (avgVol > 0 && recentVol > avgVol * 3.0) { confidence += 8; reasons.push('Volume M5 spike fort (>3x)'); }
      else if (avgVol > 0 && recentVol > avgVol * 2.0) { confidence += 5; reasons.push('Volume M5 supérieur (>2x)'); }

      // v3: Candle pattern bonus
      if (detectRejectionCandle(m5Candles, 'SHORT')) { confidence += 10; reasons.push('📌 Pattern de rejet baissier détecté'); }

      const h1Spread = Math.abs(h1Ema8Val - h1Ema20Val) / h1Ema20Val;
      if (h1Spread > 0.005) { confidence += 5; reasons.push('H1: Tendance forte (EMA8/20 écartées)'); }
    }

    // ─── SHORT Signal — Type B: Momentum Continuation (v3: with RSI + momentum) ───
    if (!side && h1Trend === 'bearish') {
      const strongH1 = h1Ema8Val < h1Ema20Val && h1Price < h1Ema8Val;
      const emaCrossRecent = emaCrossDown;
      const stochMidFalling = kVal > 25 && kVal < 60 && stochCrossDown;
      const belowVwap = currentPrice < m5Vwap;
      const rsiOk = rsiM5 !== null ? rsiM5 > 60 : true; // v3: RSI filter
      const momentumOk = checkM5Momentum(m5Candles, 'SHORT'); // v3: momentum filter

      if (strongH1 && emaCrossRecent && stochMidFalling && belowVwap && rsiOk && momentumOk) {
        side = 'SHORT';
        confidence = 45;
        reasons.push(`H1: Tendance forte baissière (EMA8 < EMA20, prix < EMA8) ✓`);
        reasons.push('M5: Croisement EMA8 < EMA20 récent ↓');
        reasons.push(`Stoch: Croisement K↓D en zone médiane (K:${kVal.toFixed(1)})`);
        if (rsiM5 !== null) reasons.push(`RSI M5: ${rsiM5}`);

        const vwapDist = (m5Vwap - currentPrice) / currentPrice;
        if (vwapDist > 0.003) { confidence += 5; reasons.push('VWAP M5: bien en-dessous ✓'); }

        // v3: Stronger volume filter
        const recentVol = m5Candles.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
        const avgVol = m5Candles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
        if (avgVol > 0 && recentVol > avgVol * 3.0) { confidence += 8; reasons.push('Volume M5 spike fort (>3x)'); }
        else if (avgVol > 0 && recentVol > avgVol * 2.0) { confidence += 5; reasons.push('Volume M5 supérieur (>2x)'); }

        // v3: Candle pattern bonus
        if (detectRejectionCandle(m5Candles, 'SHORT')) { confidence += 10; reasons.push('📌 Pattern de rejet baissier détecté'); }

        const h1Spread = Math.abs(h1Ema8Val - h1Ema20Val) / h1Ema20Val;
        if (h1Spread > 0.008) { confidence += 8; reasons.push('H1: Tendance très forte (EMA8/20 très écartées)'); }
        else if (h1Spread > 0.004) { confidence += 4; reasons.push('H1: Tendance forte'); }
      }
    }

    // v3: Type C (SHORT counter-trend) REMOVED — counter-trend signals eliminated for precision
  }

  // v3: Type D (LONG & SHORT counter-trend) REMOVED — all counter-trend signals eliminated for precision

  if (!side) {
    console.log(`[ScalpAlert] ⏭️ ${symbol} rejected: no Précision v3 signal (H1=${h1Trend}, 4H=${h4Trend}, EMA8>${m5Ema8Val.toFixed(2)}, EMA20>${m5Ema20Val.toFixed(2)}, StochK=${kVal.toFixed(1)}, VWAP=${m5Vwap.toFixed(2)})`);
    return null;
  }

  // ─── "Move Already Advanced" Filter ───
  // Check last 12 M5 candles (~60 min). If price has already moved >2% in the signal
  // direction, the move is likely already advanced and entry is late → penalize confidence.
  const lookbackCandles = Math.min(12, m5Candles.length);
  const priceAgo = m5Candles[m5Candles.length - lookbackCandles].close;
  const movePercent = ((currentPrice - priceAgo) / priceAgo) * 100;
  const ADVANCED_MOVE_THRESHOLD = 1.5; // v3: reduced from 2.0% to 1.5%

  if (side === 'LONG' && movePercent > ADVANCED_MOVE_THRESHOLD) {
    confidence -= 25; // v3: increased penalty from -20 to -25
    reasons.push(`⚠️ Mouvement déjà avancé (+${movePercent.toFixed(1)}% en 60min) — pénalité -25%`);
    console.log(`[ScalpAlert] ⚠️ ${symbol} LONG: move already advanced +${movePercent.toFixed(1)}% in ~60min, confidence -25`);
  } else if (side === 'SHORT' && movePercent < -ADVANCED_MOVE_THRESHOLD) {
    confidence -= 25;
    reasons.push(`⚠️ Mouvement déjà avancé (${movePercent.toFixed(1)}% en 60min) — pénalité -25%`);
    console.log(`[ScalpAlert] ⚠️ ${symbol} SHORT: move already advanced ${movePercent.toFixed(1)}% in ~60min, confidence -25`);
  }

  // Apply 4H conflict penalty (v5: penalty instead of rejection)
  confidence -= h4ConflictPenalty;
  if (h4ConflictPenalty > 0) {
    reasons.push(`⚠️ 4H conflit tendance — pénalité -${h4ConflictPenalty}%`);
  }

  // Apply 4H neutral penalty
  confidence -= h4NeutralPenalty;

  // Daily trend penalty — penalize confidence when Daily conflicts (don't reject)
  let d1Penalty = 0;
  if (side === 'LONG' && d1Trend === 'bearish') {
    d1Penalty = 12;
    reasons.push(`⚠️ Daily Bearish — pénalité confiance -${d1Penalty}%`);
  } else if (side === 'SHORT' && d1Trend === 'bullish') {
    d1Penalty = 12;
    reasons.push(`⚠️ Daily Bullish — pénalité confiance -${d1Penalty}%`);
  } else if (side === 'LONG' && d1Trend === 'bullish') {
    d1Penalty = -5;
    reasons.push(`✅ Daily Bullish — bonus alignement +5%`);
  } else if (side === 'SHORT' && d1Trend === 'bearish') {
    d1Penalty = -5;
    reasons.push(`✅ Daily Bearish — bonus alignement +5%`);
  }
  confidence -= d1Penalty;

  // v3: Minimum confidence floor raised to 60 (from 55)
  confidence = Math.min(98, Math.max(60, confidence));

  // ─── SL / TP Calculation — v3: Tighter ATR-based SL + realistic TP ratios ───
  let entry = currentPrice;
  let stopLoss, tp1, tp2, tp3;

  // v3: Tight ATR-based SL (1.5x ATR M5, min 0.5%, max 2%) — precision scalp
  let slDist;
  const atrM5 = calcATR_M5(m5Candles);

  // Volatility filter: skip signal if ATR_M5/price > 3% (too volatile for scalp)
  if (atrM5 && atrM5 > 0 && (atrM5 / entry) > 0.03) {
    return null; // Market too volatile for scalp
  }

  if (atrM5 && atrM5 > 0) {
    slDist = atrM5 * 1.5; // v3: reduced from 3.0x to 1.5x for tight scalp SL
    const minSl = entry * 0.005; // v3: min 0.5% (was 2.5%)
    const maxSl = entry * 0.02;  // v3: max 2% (was 6%)
    slDist = Math.max(minSl, Math.min(slDist, maxSl));
  } else {
    // Fallback
    const last10 = m5Candles.slice(-10);
    if (side === 'LONG') {
      const lowestLow = Math.min(...last10.map(c => c.low));
      slDist = Math.max(entry - lowestLow, entry * 0.005);
    } else {
      const highestHigh = Math.max(...last10.map(c => c.high));
      slDist = Math.max(highestHigh - entry, entry * 0.005);
    }
    slDist = Math.max(entry * 0.005, Math.min(slDist, entry * 0.02));
  }

  if (side === 'LONG') {
    stopLoss = entry - slDist;
    if (Math.abs(entry - stopLoss) / entry < 0.005) stopLoss = entry * 0.995;
  } else {
    stopLoss = entry + slDist;
    if (Math.abs(stopLoss - entry) / entry < 0.005) stopLoss = entry * 1.005;
  }

  slDist = Math.abs(entry - stopLoss);

  // v3: Realistic TP ratios — 0.8:1, 1.5:1, 2.5:1 for higher winrate
  if (side === 'LONG') {
    tp1 = entry + slDist * 0.8;  // 0.8:1 — quick profit, high probability
    tp2 = entry + slDist * 1.5;  // 1.5:1
    tp3 = entry + slDist * 2.5;  // 2.5:1
  } else {
    tp1 = entry - slDist * 0.8;
    tp2 = entry - slDist * 1.5;
    tp3 = entry - slDist * 2.5;
  }

  // SL too tight penalty (0.3% threshold for scalp)
  if (slDist / entry < 0.003) confidence -= 10;
  confidence = Math.min(98, Math.max(60, confidence));

  const rr = slDist > 0 ? Math.round((Math.abs(tp2 - entry) / slDist) * 10) / 10 : 1.5;

  return {
    symbol,
    name: symbol.replace('USDT', ''),
    side,
    entry,
    stopLoss,
    tp1, tp2, tp3,
    rr,
    confidence,
    reason: reasons.join(' | '),
    stoch_k: kVal,
    stoch_d: dVal,
    ema8_m5: m5Ema8Val,
    ema20_m5: m5Ema20Val,
    ema8_h1: h1Ema8Val,
    ema20_h1: h1Ema20Val,
    vwap_m5: m5Vwap,
    vwap_h1: h1Vwap,
    h1_trend: h1Trend,
    h4_trend: h4Trend,
    ema8_h4: h4Ema8Val,
    ema20_h4: h4Ema20Val,
    d1_trend: d1Trend,
    ema8_d1: d1Ema8Val,
    ema20_d1: d1Ema20Val,
    currentPrice,
  };
}

// ─── Check and send Scalp alerts ───
async function checkAndSendScalpAlerts() {
  const config = loadTelegramAlerts();
  if (!config.enabled) return [];

  const sentAlerts = [];
  const now = new Date();
  const nowStr = now.toLocaleString('fr-CA', { timeZone: 'America/Montreal' });
  const cooldowns = loadScalpCooldowns();

  try {
    // Dynamically fetch top 200 symbols (cached 1h)
    const symbols = await fetchTop200USDTSymbols();
    SCALP_SYMBOLS = symbols; // Update global reference
    console.log(`[ScalpAlert] 📡 Analyzing ${symbols.length} symbols for scalp setups...`);

    const setups = [];
    // Process symbols in batches of 10 to balance speed vs rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(sym => generateScalpSetup(sym)));
      for (const setup of results) {
        if (setup) setups.push(setup);
      }
      // Delay between batches to respect Binance rate limits
      if (i + BATCH_SIZE < symbols.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`[ScalpAlert] Generated ${setups.length} scalp setups`);
    // Debug: log all setup confidences
    if (setups.length > 0) {
      const confValues = setups.map(s => `${s.symbol}:${s.confidence}%${s.side}`);
      console.log(`[ScalpAlert] Setup confidences: ${confValues.join(", ")}`);
    }

    // v3: Only send signals with confidence >= 85% (raised from 75%)
    const MIN_CONFIDENCE = 85;
    const qualifiedSetups = setups.filter(s => s.confidence >= MIN_CONFIDENCE);
    console.log(`[ScalpAlert] After confidence filter (>=${MIN_CONFIDENCE}%): ${qualifiedSetups.length} setups`);

    // Sort by confidence descending
    qualifiedSetups.sort((a, b) => b.confidence - a.confidence);

    // v3: Max 8 active scalp calls (reduced from 15)
    const MAX_ACTIVE_SCALP_CALLS = 8;
    const currentScalpCalls = loadScalpCalls();
    const activeScalpCallCount = currentScalpCalls.filter(c => c.status === 'active').length;
    if (activeScalpCallCount >= MAX_ACTIVE_SCALP_CALLS) {
      console.log(`[ScalpAlert] ⛔ Max active scalp calls reached (${activeScalpCallCount}/${MAX_ACTIVE_SCALP_CALLS}) — skipping new signals`);
      return sentAlerts;
    }
    const remainingSlots = MAX_ACTIVE_SCALP_CALLS - activeScalpCallCount;
    console.log(`[ScalpAlert] Active scalp calls: ${activeScalpCallCount}/${MAX_ACTIVE_SCALP_CALLS} — ${remainingSlots} slots available`);

    console.log(`[ScalpAlert] Starting to send ${Math.min(qualifiedSetups.length, remainingSlots)} scalp alerts to Telegram...`);

    for (let idx = 0; idx < qualifiedSetups.length && sentAlerts.length < remainingSlots; idx++) {
      const setup = qualifiedSetups[idx];
      try {
        if (isScalpCooldownActive(cooldowns, setup.symbol, setup.side)) {
          console.log(`[ScalpAlert] 🛑 Cooldown active for ${setup.symbol} ${setup.side}, skipping`);
          continue;
        }

        console.log(`[ScalpAlert] 📤 Sending ${idx + 1}/${qualifiedSetups.length}: ${setup.symbol} ${setup.side} (${setup.confidence}%)...`);

        // ─── Pre-send trend coherence validation (v3: strict — reject mismatches) ───
        if ((setup.side === 'LONG' && setup.h1_trend !== 'bullish') || (setup.side === 'SHORT' && setup.h1_trend !== 'bearish')) {
          console.log(`[ScalpAlert] 🚫 REJECTED ${setup.symbol}: side=${setup.side} but h1_trend=${setup.h1_trend} — trend mismatch`);
          continue;
        }

        const dirEmoji = setup.side === 'LONG' ? '🟢 LONG' : '🔴 SHORT';

        const pctTP1 = ((setup.tp1 - setup.entry) / setup.entry * 100);
        const pctTP2 = ((setup.tp2 - setup.entry) / setup.entry * 100);
        const pctTP3 = ((setup.tp3 - setup.entry) / setup.entry * 100);
        const pctSL = ((setup.stopLoss - setup.entry) / setup.entry * 100);

        const trendEmoji = setup.h1_trend === 'bullish' ? '🟢 Haussière' : setup.h1_trend === 'bearish' ? '🔴 Baissière' : '⚪ Neutre';
        const h4TrendEmoji = setup.h4_trend === 'bullish' ? '🟢 Haussière' : setup.h4_trend === 'bearish' ? '🔴 Baissière' : '⚪ Neutre';
        const d1TrendEmoji = setup.d1_trend === 'bullish' ? '🟢 Haussière' : setup.d1_trend === 'bearish' ? '🔴 Baissière' : '⚪ Neutre';

        // Escape HTML entities in reason text to prevent Telegram parse errors
        const safeReason = (setup.reason || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const text = `🔴🔴🔴 <b>⚡ SCALP TRADING — SIGNAL CRYPTO</b> 🔴🔴🔴
🌐 https://CryptoIA.ca
📊 Entry sur le timeframe <b>M5</b> | Biais directionnel : <b>H1</b> + <b>4H</b>
━━━━━━━━━━━━━━━━━━━━━

${dirEmoji} — <b>${setup.name}</b> (${setup.symbol})

📐 <b>Indicateurs :</b>
├ EMA 8 M5 : <b>$${formatPrice(setup.ema8_m5)}</b>
├ EMA 20 M5 : <b>$${formatPrice(setup.ema20_m5)}</b>
├ VWAP M5 : <b>$${formatPrice(setup.vwap_m5)}</b>
├ Stoch K : <b>${setup.stoch_k.toFixed(1)}</b>
├ Stoch D : <b>${setup.stoch_d.toFixed(1)}</b>
├ EMA 20 H1 : <b>$${formatPrice(setup.ema20_h1)}</b>
├ VWAP H1 : <b>$${formatPrice(setup.vwap_h1)}</b>
├ Tendance H1 : ${trendEmoji}
├ Tendance 4H : ${h4TrendEmoji}${setup.ema8_h4 != null ? ` (EMA8: $${formatPrice(setup.ema8_h4)}, EMA20: $${formatPrice(setup.ema20_h4)})` : ''}
└ Tendance Daily : ${d1TrendEmoji}${setup.ema8_d1 != null ? ` (EMA8: $${formatPrice(setup.ema8_d1)}, EMA20: $${formatPrice(setup.ema20_d1)})` : ''}

🎯 <b>Plan de Trade :</b>
├ Entry : <b>$${formatPrice(setup.entry)}</b>
├ TP1 : <b>$${formatPrice(setup.tp1)}</b> (${pctTP1 >= 0 ? '+' : ''}${pctTP1.toFixed(2)}%)
├ TP2 : <b>$${formatPrice(setup.tp2)}</b> (${pctTP2 >= 0 ? '+' : ''}${pctTP2.toFixed(2)}%)
├ TP3 : <b>$${formatPrice(setup.tp3)}</b> (${pctTP3 >= 0 ? '+' : ''}${pctTP3.toFixed(2)}%)
└ SL : <b>$${formatPrice(setup.stopLoss)}</b> (${pctSL >= 0 ? '+' : ''}${pctSL.toFixed(2)}%)

⚖️ Risk/Reward : <b>1:${setup.rr}</b>
🧠 Confiance : <b>${setup.confidence}%</b>

📋 <b>Raison :</b>
<i>${safeReason}</i>

⏰ Timeframe : M5 — ${nowStr} (Montréal)
⚠️ <i>Scalp trade — Ceci n'est pas un conseil financier. DYOR.</i>`;

        const result = await sendTelegramMessage(text);
        console.log(`[ScalpAlert] Telegram response for ${setup.symbol}: ok=${result.ok}, desc=${result.description || 'none'}`);

        if (result.ok) {
          setScalpCooldown(cooldowns, setup.symbol, setup.side);
          saveScalpCooldowns(cooldowns);

          // Auto-register as scalp call
          try {
            const calls = loadScalpCalls();
            const newScalpCallId = allocateScalpCallId();
            const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // v3: 30 minutes expiry (was 45min)
            calls.push({
              id: newScalpCallId,
              symbol: setup.symbol, side: setup.side,
              entry_price: setup.entry, stop_loss: setup.stopLoss,
              trailing_sl: setup.stopLoss, // Initially same as stop_loss
              tp1: setup.tp1, tp2: setup.tp2, tp3: setup.tp3,
              confidence: setup.confidence, reason: setup.reason,
              stoch_k: setup.stoch_k, stoch_d: setup.stoch_d,
              ema8_m5: setup.ema8_m5, ema20_m5: setup.ema20_m5,
              vwap_m5: setup.vwap_m5, vwap_h1: setup.vwap_h1,
              h1_trend: setup.h1_trend,
              rr: setup.rr, status: 'active',
              tp1_hit: false, tp2_hit: false, tp3_hit: false, sl_hit: false,
              best_tp_reached: 0, exit_price: null, profit_pct: null,
              created_at: now.toISOString(), resolved_at: null,
              expires_at: expiresAt.toISOString(),
            });
            saveScalpCalls(calls);
            console.log(`[ScalpAlert] Auto-registered scalp call #${newScalpCallId}`);
          } catch (regErr) {
            console.error('[ScalpAlert] Failed to auto-register scalp call:', regErr);
          }

          sentAlerts.push({
            type: 'scalp_signal',
            symbol: setup.symbol,
            direction: setup.side,
            rr: setup.rr,
            entry: setup.entry,
            confidence: setup.confidence,
          });
          console.log(`[ScalpAlert] ✅ Sent ${setup.side} scalp signal for ${setup.name} (confidence: ${setup.confidence}%)`);

          await new Promise(r => setTimeout(r, 2000));
        } else {
          console.error(`[ScalpAlert] ❌ Failed to send ${setup.symbol}: ${result.description || JSON.stringify(result)}`);
        }
      } catch (sendErr) {
        console.error(`[ScalpAlert] ❌ Exception sending ${setup.symbol}:`, sendErr.message || sendErr);
      }
    }

    console.log(`[ScalpAlert] Finished sending loop. Total sent: ${sentAlerts.length}`);
  } catch (err) {
    console.error('[ScalpAlert] Check error:', err);
  }

  return sentAlerts;
}

// ─── Periodic scalp alert checker (every 3 minutes) ───
let scalpAlertInterval = null;

function startScalpAlertChecker() {
  const config = loadTelegramAlerts();
  if (scalpAlertInterval) clearInterval(scalpAlertInterval);
  if (config.enabled) {
    const interval = 3 * 60 * 1000; // 3 minutes for scalp
    console.log(`[ScalpAlert] Scalp alert checker started — checking every ${interval / 1000}s`);
    scalpAlertInterval = setInterval(async () => {
      console.log('[ScalpAlert] Running periodic scalp alert check...');
      const alerts = await checkAndSendScalpAlerts();
      if (alerts.length > 0) {
        console.log(`[ScalpAlert] Sent ${alerts.length} scalp alerts`);
      }
    }, interval);
    // Run initial check after 30s delay (let swing alerts go first)
    setTimeout(() => {
      checkAndSendScalpAlerts().then(alerts => {
        if (alerts.length > 0) console.log(`[ScalpAlert] Initial check sent ${alerts.length} scalp alerts`);
      });
    }, 30000);
  }
}

// Defer scalp checker startup to AFTER server is listening (see app.listen at EOF)
// startScalpAlertChecker() is now called inside app.listen callback


  function stopScalpAlertChecker() {
    if (scalpAlertInterval) {
      clearInterval(scalpAlertInterval);
      scalpAlertInterval = null;
      console.log('[ScalpAlert] Scalp alert checker stopped');
    }
  }

  function registerRoutes(app) {
    // ─── POST /api/telegram/scalp-toggle — Enable/disable scalp alerts specifically ───
    app.post('/api/telegram/scalp-toggle', (req, res) => {
      const { enabled } = req.body;
      if (enabled) startScalpAlertChecker();
      else stopScalpAlertChecker();
      res.json({ success: true, scalp_alerts_enabled: !!enabled });
    });

    // ─── POST /api/telegram/scalp-check — Force a manual scalp alert check ───
    app.post('/api/telegram/scalp-check', async (req, res) => {
      try {
        const alerts = await checkAndSendScalpAlerts();
        res.json({ success: true, alerts_sent: alerts.length, alerts });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });
  }

  return { generateScalpSetup, checkAndSendScalpAlerts, startScalpAlertChecker, stopScalpAlertChecker, registerRoutes };
}
