// Backtest du moteur range (BB + RSI + ADX M15) sur données historiques Binance
// Réplique generateRangeSetup + résolution identique au resolver prod (TP1→BE, TP2=win, expiry 2h)
// Usage: node tests/backtest_range.mjs [--days=30] [--symbols=50] [--grid]
import fs from 'fs';
import path from 'path';
import { calcEMA, calcRSI, calcBollingerBands, calcADX } from '../lib/signal_primitives.js';

const BASE = 'https://data-api.binance.vision/api/v3';
const CACHE_DIR = '/tmp/btcache';
fs.mkdirSync(CACHE_DIR, { recursive: true });

const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));
const DAYS = parseInt(args.days || '30', 10);
const N_SYMBOLS = parseInt(args.symbols || '50', 10);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchJson(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (res.ok) return await res.json();
    } catch {}
    await sleep(500 * (i + 1));
  }
  return null;
}

async function fetchKlinesM15(symbol, days) {
  const cacheFile = path.join(CACHE_DIR, `${symbol}_15m_${days}.json`);
  if (fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  const totalMs = days * 86400_000;
  const now = Date.now();
  let out = [];
  let from = now - totalMs;
  while (from < now) {
    const data = await fetchJson(`${BASE}/klines?symbol=${symbol}&interval=15m&startTime=${from}&limit=1000`);
    if (!data || !data.length) break;
    out.push(...data);
    from = data[data.length - 1][0] + 900_000;
    if (data.length < 1000) break;
    await sleep(60);
  }
  const klines = out.map(k => ({ t: k[0], open: +k[1], high: +k[2], low: +k[3], close: +k[4], volume: +k[5] }));
  fs.writeFileSync(cacheFile, JSON.stringify(klines));
  return klines;
}

async function loadUniverse() {
  const tickers = await fetchJson(`${BASE}/ticker/24hr`);
  const bad = /(UP|DOWN|BULL|BEAR)USDT$|^(USDC|FDUSD|TUSD|DAI|EUR|BUSD|USDP|WBTC|WBETH|USD1|XUSD)/;
  return tickers
    .filter(t => t.symbol.endsWith('USDT') && !bad.test(t.symbol) && +t.quoteVolume > 5_000_000)
    .sort((a, b) => +b.quoteVolume - +a.quoteVolume)
    .slice(0, N_SYMBOLS)
    .map(t => t.symbol);
}

// M15 → H1 aggregate (last `count` full hours ending at index endIdx exclusive)
function h1Window(m15, endIdx, count) {
  const need = count * 4;
  const start = endIdx - need;
  if (start < 0) return [];
  const out = [];
  for (let i = start; i + 4 <= endIdx; i += 4) {
    out.push(m15[i + 3].close);
  }
  return out;
}

// ─── Réplique paramétrée de generateRangeSetup ───
function generateSignalAt(symbol, m15, idx, P) {
  const win = m15.slice(idx - 100 + 1, idx + 1);
  if (win.length < 100) return null;
  const closes = win.map(c => c.close);
  const currentPrice = closes[closes.length - 1];

  const adxM15 = calcADX(win, 14);
  if (adxM15 === null || adxM15 >= P.adxMax) return null;

  const bb = calcBollingerBands(closes, 20, 2);
  if (!bb || bb.sma.length === 0) return null;
  const bbUpper = bb.upper[bb.upper.length - 1];
  const bbMiddle = bb.sma[bb.sma.length - 1];
  const bbLower = bb.lower[bb.lower.length - 1];
  const bbWidth = (bbUpper - bbLower) / bbMiddle;
  if (bbWidth < P.minBBWidth) return null;

  const rsiArr = calcRSI(closes, 14);
  const rsiM15 = rsiArr[rsiArr.length - 1];

  const h1Closes = h1Window(m15, idx + 1, 50);
  if (h1Closes.length < 25) return null;
  const h1Ema8 = calcEMA(h1Closes, 8);
  const h1Ema20 = calcEMA(h1Closes, 20);
  const h1Ema8Val = h1Ema8[h1Ema8.length - 1];
  const h1Ema20Val = h1Ema20[h1Ema20.length - 1];
  let h1Trend = 'neutral';
  const h1Spread = Math.abs(h1Ema8Val - h1Ema20Val) / h1Ema20Val;
  if (h1Spread < 0.002) h1Trend = 'neutral';
  else if (h1Ema8Val > h1Ema20Val) h1Trend = 'bullish';
  else h1Trend = 'bearish';

  const distToLower = (currentPrice - bbLower) / (bbUpper - bbLower);
  const distToUpper = (bbUpper - currentPrice) / (bbUpper - bbLower);

  let side = null;
  let confidence = 0;
  const factors = {};

  const lastCandle = win[win.length - 1];
  const prevCandle = win[win.length - 2];
  const prevCloses = closes.slice(0, -1);
  const bbPrev = calcBollingerBands(prevCloses, 20, 2);
  const bbLowerPrev = bbPrev.lower[bbPrev.lower.length - 1];
  const bbUpperPrev = bbPrev.upper[bbPrev.upper.length - 1];
  const rsiPrev = rsiArr[rsiArr.length - 2];
  // band-walk: nb de closes hors bande sur les 6 dernières bougies
  let walksBelow = 0, walksAbove = 0;
  for (let k = 2; k <= 7; k++) {
    const c = win[win.length - k];
    const bbK = calcBollingerBands(closes.slice(0, closes.length - k + 1), 20, 2);
    if (c.close < bbK.lower[bbK.lower.length - 1]) walksBelow++;
    if (c.close > bbK.upper[bbK.upper.length - 1]) walksAbove++;
  }

  const body = Math.abs(lastCandle.close - lastCandle.open);
  const recentVol = win.slice(-3).reduce((s, c) => s + c.volume, 0) / 3;
  const avgVol = win.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
  const volSpike = avgVol > 0 && recentVol > avgVol * 1.5;

  const reentryLong = P.mode === 'reentry'
    ? (prevCandle.close < bbLowerPrev || prevCandle.low < bbLowerPrev) && lastCandle.close > bbLower && lastCandle.close > lastCandle.open
    : distToLower < P.touchZone;
  const reentryShort = P.mode === 'reentry'
    ? (prevCandle.close > bbUpperPrev || prevCandle.high > bbUpperPrev) && lastCandle.close < bbUpper && lastCandle.close < lastCandle.open
    : distToUpper < P.touchZone;

  if (reentryLong && rsiM15 < P.rsiLong) {
    side = 'LONG';
    confidence = P.base;
    if (P.mode === 'reentry' && rsiM15 > rsiPrev) { confidence += P.rsiTurn; factors.rsiTurn = true; }
    if (P.maxBandWalk != null && walksBelow > P.maxBandWalk) return null;
    if (rsiM15 < 25) { confidence += P.rsiExtreme; factors.rsiExtreme = true; }
    else if (rsiM15 < 30) { confidence += P.rsiStrong; factors.rsiStrong = true; }
    if (distToLower < 0.05) { confidence += P.touchTight; factors.touchTight = true; }
    else if (distToLower < 0.10) { confidence += P.touchNear; }
    if (adxM15 < 15) { confidence += P.adxVeryLow; factors.adxVeryLow = true; }
    else if (adxM15 < 20) { confidence += P.adxLow; factors.adxLow = true; }
    if (h1Trend === 'bullish') { confidence += P.h1Align; factors.h1Align = true; }
    else if (h1Trend === 'bearish') { confidence += P.h1Contra; factors.h1Contra = true; }
    if (volSpike) { confidence += P.volSpike; factors.volSpike = true; }
    const lowerWick = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;
    if (lowerWick > body * 2 && body > 0) { confidence += P.pinBar; factors.pinBar = true; }
  } else if (reentryShort && rsiM15 > P.rsiShort) {
    side = 'SHORT';
    confidence = P.base;
    if (P.mode === 'reentry' && rsiM15 < rsiPrev) { confidence += P.rsiTurn; factors.rsiTurn = true; }
    if (P.maxBandWalk != null && walksAbove > P.maxBandWalk) return null;
    if (rsiM15 > 75) { confidence += P.rsiExtreme; factors.rsiExtreme = true; }
    else if (rsiM15 > 70) { confidence += P.rsiStrong; factors.rsiStrong = true; }
    if (distToUpper < 0.05) { confidence += P.touchTight; factors.touchTight = true; }
    else if (distToUpper < 0.10) { confidence += P.touchNear; }
    if (adxM15 < 15) { confidence += P.adxVeryLow; factors.adxVeryLow = true; }
    else if (adxM15 < 20) { confidence += P.adxLow; factors.adxLow = true; }
    if (h1Trend === 'bearish') { confidence += P.h1Align; factors.h1Align = true; }
    else if (h1Trend === 'bullish') { confidence += P.h1Contra; factors.h1Contra = true; }
    if (volSpike) { confidence += P.volSpike; factors.volSpike = true; }
    const upperWick = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
    if (upperWick > body * 2 && body > 0) { confidence += P.pinBar; factors.pinBar = true; }
  }

  if (!side) return null;
  if (P.blockContra && factors.h1Contra) return null;

  if (bbWidth > 0.03) { confidence += P.bbWide; factors.bbWide = true; }
  else if (bbWidth > 0.015) { confidence += P.bbMid; }

  confidence = Math.min(98, Math.max(30, confidence));

  let stopLoss, tp1, tp2;
  const bbRange = bbUpper - bbLower;
  if (side === 'LONG') {
    const slBuffer = Math.max(currentPrice * 0.005, Math.min(currentPrice * 0.015, bbRange * P.slBufferPct));
    stopLoss = bbLower - slBuffer;
    tp1 = bbMiddle;
    tp2 = bbUpper * 0.998;
  } else {
    const slBuffer = Math.max(currentPrice * 0.005, Math.min(currentPrice * 0.015, bbRange * P.slBufferPct));
    stopLoss = bbUpper + slBuffer;
    tp1 = bbMiddle;
    tp2 = bbLower * 1.002;
  }

  const slDist = Math.abs(currentPrice - stopLoss);
  const tp1Dist = Math.abs(tp1 - currentPrice);
  const rr = slDist > 0 ? Math.round((tp1Dist / slDist) * 10) / 10 : 1;
  if (rr < P.minRR) return null;

  if (rr >= 1.2) factors.goodRR = true;
  if (P.scoring === 'v2') {
    confidence = 55;
    if (factors.h1Align) confidence += 12;
    if (factors.bbWide) confidence += 8;
    if (factors.adxVeryLow) confidence += 8;
    if (factors.rsiTurn) confidence += 6;
    if (factors.goodRR) confidence += 10;
    confidence = Math.min(97, confidence);
  } else if (P.scoring === 'v3') {
    confidence = 58;
    if (factors.h1Align) confidence += 12;
    if (factors.bbWide) confidence += 7;
    if (factors.adxVeryLow) confidence += 8;
    else if (factors.adxLow) confidence += 4;
    if (factors.rsiTurn) confidence += 6;
    confidence = Math.min(97, confidence);
  }

  return { symbol, side, entry: currentPrice, stopLoss, tp1, tp2, rr, confidence, factors, bbWidth, adxM15, rsiM15, h1Trend, t: m15[idx].t };
}

// ─── Simulation fidèle au resolver prod (checks toutes les 3 min ≈ intrabar high/low, SL prioritaire) ───
// partial=true : sortie 50% au TP1, SL→BE, 50% restant vers TP2 (payoff v2)
function simulateTrade(sig, m15, idx, expiryBars, partial) {
  let tp1Hit = false;
  let trailingSL = sig.stopLoss;
  const dir = sig.side === 'LONG' ? 1 : -1;
  const pnl = p => dir * (p - sig.entry) / sig.entry * 100;
  const tp1Gain = pnl(sig.tp1);

  for (let i = idx + 1; i <= idx + expiryBars && i < m15.length; i++) {
    const bar = m15[i];
    const hitSL = sig.side === 'LONG' ? bar.low <= trailingSL : bar.high >= trailingSL;
    const hitTP1 = sig.side === 'LONG' ? bar.high >= sig.tp1 : bar.low <= sig.tp1;
    const hitTP2 = sig.side === 'LONG' ? bar.high >= sig.tp2 : bar.low <= sig.tp2;

    // conservative: SL checked first within the bar
    if (hitSL && !tp1Hit) return { outcome: 'sl', tp1Hit: false, profit: pnl(trailingSL) };
    if (hitSL && tp1Hit) return { outcome: 'be', tp1Hit: true, profit: partial ? 0.5 * tp1Gain : 0 };
    if (hitTP1 && !tp1Hit) { tp1Hit = true; trailingSL = sig.entry; }
    if (hitTP2) return { outcome: 'tp2', tp1Hit: true, profit: partial ? 0.5 * tp1Gain + 0.5 * pnl(sig.tp2) : pnl(sig.tp2) };
  }
  const lastIdx = Math.min(idx + expiryBars, m15.length - 1);
  if (tp1Hit) return { outcome: 'expiry_be', tp1Hit: true, profit: partial ? 0.5 * tp1Gain + 0.5 * pnl(m15[lastIdx].close) : 0 };
  return { outcome: 'expiry', tp1Hit: false, profit: pnl(m15[lastIdx].close) };
}

const FEES = 0.1; // % round-trip taker

function runBacktest(dataset, P, label, verbose = true) {
  const trades = [];
  for (const { symbol, klines } of dataset) {
    const cooldownUntil = { LONG: 0, SHORT: 0 };
    for (let idx = 220; idx < klines.length - 1; idx++) {
      const sig = generateSignalAt(symbol, klines, idx, P);
      if (!sig) continue;
      if (klines[idx].t < cooldownUntil[sig.side]) continue;
      cooldownUntil[sig.side] = klines[idx].t + 60 * 60 * 1000;
      const res = simulateTrade(sig, klines, idx, P.expiryBars || 8, !!P.partial);
      trades.push({ ...sig, ...res });
    }
  }

  const report = (subset, name) => {
    const n = subset.length;
    if (n === 0) return { name, n: 0 };
    const wins = subset.filter(t => t.tp1Hit).length;
    const ev = subset.reduce((s, t) => s + t.profit, 0) / n;
    const evNet = ev - FEES;
    const oc = {};
    for (const t of subset) oc[t.outcome] = (oc[t.outcome] || 0) + 1;
    const ocStr = Object.entries(oc).map(([k, v]) => `${k}:${v}`).join(' ');
    return { name, n, wr: (wins / n * 100).toFixed(1), ev: ev.toFixed(3), evNet: evNet.toFixed(3), perDay: (n / DAYS).toFixed(1), outcomes: ocStr };
  };

  const buckets = [
    ['ALL', trades],
    ['conf>=80', trades.filter(t => t.confidence >= 80)],
    ['conf 70-79', trades.filter(t => t.confidence >= 70 && t.confidence < 80)],
    ['conf 60-69', trades.filter(t => t.confidence >= 60 && t.confidence < 70)],
    ['conf <60', trades.filter(t => t.confidence < 60)],
  ];
  if (verbose) {
    console.log(`\n═══ ${label} ═══`);
    console.table(buckets.map(([name, s]) => report(s, name)));

    // factor analysis on all trades
    const facs = ['rsiExtreme', 'rsiStrong', 'touchTight', 'adxVeryLow', 'adxLow', 'h1Align', 'h1Contra', 'volSpike', 'pinBar', 'bbWide', 'rsiTurn', 'goodRR'];
    console.log('— Analyse par facteur (winrate | EV brut | n) —');
    console.table(facs.map(f => {
      const withF = trades.filter(t => t.factors[f]);
      const without = trades.filter(t => !t.factors[f]);
      const r = s => s.length ? `${(s.filter(t => t.tp1Hit).length / s.length * 100).toFixed(0)}% | ${(s.reduce((a, t) => a + t.profit, 0) / s.length).toFixed(2)}% | ${s.length}` : '—';
      return { factor: f, avec: r(withF), sans: r(without) };
    }));
    console.log('— Par side —');
    console.table(['LONG', 'SHORT'].map(s => report(trades.filter(t => t.side === s), s)));
    console.log('— Par RR —');
    console.table([['rr<1.2', t => t.rr < 1.2], ['rr>=1.2', t => t.rr >= 1.2]].map(([n, f]) => report(trades.filter(f), n)));
  }
  return { trades, top: report(buckets[1][1], 'conf>=80'), all: report(trades, 'ALL') };
}

const BASELINE = {
  mode: 'touch', adxMax: 25, minBBWidth: 0.008, touchZone: 0.15, rsiLong: 35, rsiShort: 65,
  base: 50, rsiExtreme: 10, rsiStrong: 6, touchTight: 10, touchNear: 5,
  adxVeryLow: 8, adxLow: 4, h1Align: 5, h1Contra: -8, volSpike: 5, pinBar: 8,
  bbWide: 5, bbMid: 2, slBufferPct: 0.15, minRR: 0.8, blockContra: false,
  rsiTurn: 0, maxBandWalk: null, expiryBars: 8,
};

async function main() {
  console.log(`Backtest range: ${DAYS} jours, ${N_SYMBOLS} symboles...`);
  const symbols = await loadUniverse();
  const dataset = [];
  for (const s of symbols) {
    const klines = await fetchKlinesM15(s, DAYS);
    if (klines.length > 500) dataset.push({ symbol: s, klines });
  }
  console.log(`Dataset: ${dataset.length} symboles chargés`);

  if (args.best) {
    const BEST = { ...BASELINE, mode: 'reentry', rsiLong: 40, rsiShort: 60, rsiTurn: 8,
      expiryBars: 32, maxBandWalk: 2, partial: true, blockContra: true, slBufferPct: 0.5, minBBWidth: 0.02, scoring: (args.scoring || 'v2') };
    runBacktest(dataset, BEST, 'BEST (reentry SL0.5 rsi40/60 bb0.02 16h... voir params)');
  } else {
    runBacktest(dataset, BASELINE, 'BASELINE (moteur actuel)');
  }

  if (args.grid) {
    // variantes candidates
    const RE = { ...BASELINE, mode: 'reentry', rsiLong: 45, rsiShort: 55, rsiTurn: 8 };
    const RP = { ...RE, expiryBars: 16, maxBandWalk: 2, partial: true };
    const variants = {
      'P6: base (reentry 8h contra)': { ...RP, expiryBars: 32, blockContra: true },
      'S1: P6 + SL large (buf 0.3)': { ...RP, expiryBars: 32, blockContra: true, slBufferPct: 0.3 },
      'S2: P6 + SL tres large (0.5)': { ...RP, expiryBars: 32, blockContra: true, slBufferPct: 0.5 },
      'S3: S2 + bbWidth 0.02': { ...RP, expiryBars: 32, blockContra: true, slBufferPct: 0.5, minBBWidth: 0.02 },
      'S4: S1 + bbWidth 0.02': { ...RP, expiryBars: 32, blockContra: true, slBufferPct: 0.3, minBBWidth: 0.02 },
      'S5: S4 + ADX<20': { ...RP, expiryBars: 32, blockContra: true, slBufferPct: 0.3, minBBWidth: 0.02, adxMax: 20 },
      'S6: S4 + bandWalk<=1': { ...RP, expiryBars: 32, blockContra: true, slBufferPct: 0.3, minBBWidth: 0.02, maxBandWalk: 1 },
      'S7: S4 + rsi 40/60': { ...RP, expiryBars: 32, blockContra: true, slBufferPct: 0.3, minBBWidth: 0.02, rsiLong: 40, rsiShort: 60 },
      'S8: S4 expiry 16h': { ...RP, expiryBars: 64, blockContra: true, slBufferPct: 0.3, minBBWidth: 0.02 },
    };    const rows = [];
    for (const [name, P] of Object.entries(variants)) {
      const { top, all } = runBacktest(dataset, P, name, false);
      rows.push({ variant: name, all_n: all.n, all_wr: all.wr, all_evNet: all.evNet, top_n: top.n || 0, top_wr: top.wr, top_evNet: top.evNet, top_perDay: top.perDay });
    }
    console.log('\n═══ GRILLE DE VARIANTES ═══');
    console.table(rows);
  }
}

main();
