// Backtest du moteur swing v7 sur données historiques Binance (data-api.binance.vision)
// Usage: node tests/backtest_swing.mjs [--days=120] [--symbols=90] [--grid]
import fs from 'fs';
import path from 'path';
import { calcEMA, calcRSI } from '../lib/signal_primitives.js';

const BASE = 'https://data-api.binance.vision/api/v3';
const CACHE_DIR = '/tmp/btcache';
fs.mkdirSync(CACHE_DIR, { recursive: true });

const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));
const DAYS = parseInt(args.days || '120', 10);
const N_SYMBOLS = parseInt(args.symbols || '90', 10);

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

async function fetchKlines1h(symbol, days) {
  const cacheFile = path.join(CACHE_DIR, `${symbol}_1h_${days}.json`);
  if (fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  const total = days * 24;
  const now = Date.now();
  const start = now - total * 3600_000;
  let out = [];
  let from = start;
  while (from < now) {
    const data = await fetchJson(`${BASE}/klines?symbol=${symbol}&interval=1h&startTime=${from}&limit=1000`);
    if (!data || !data.length) break;
    out.push(...data);
    from = data[data.length - 1][0] + 3600_000;
    if (data.length < 1000) break;
    await sleep(80);
  }
  const klines = out.map(k => ({ t: k[0], open: +k[1], high: +k[2], low: +k[3], close: +k[4], qvol: +k[7] }));
  fs.writeFileSync(cacheFile, JSON.stringify(klines));
  return klines;
}

function aggregate(klines1h, hours) {
  const out = [];
  for (let i = 0; i + hours <= klines1h.length; i += hours) {
    const chunk = klines1h.slice(i, i + hours);
    out.push({
      t: chunk[0].t,
      open: chunk[0].open,
      high: Math.max(...chunk.map(c => c.high)),
      low: Math.min(...chunk.map(c => c.low)),
      close: chunk[chunk.length - 1].close,
      qvol: chunk.reduce((s, c) => s + c.qvol, 0),
    });
  }
  return out;
}

// aggregates aligned so the LAST candle ends at index `endIdx` (exclusive) of 1h series
function aggWindow(klines1h, endIdx, hours, count) {
  const need = hours * count;
  const startIdx = endIdx - need;
  if (startIdx < 0) return [];
  return aggregate(klines1h.slice(startIdx, endIdx), hours);
}

// ─── Réplique de calculateSRLevels (swing_engine v7) ───
function calculateSRLevels(coin) {
  const price = coin.current_price;
  const supports = [], resistances = [];
  if (coin.low_24h && coin.low_24h < price) supports.push({ price: coin.low_24h });
  if (coin.high_24h && coin.high_24h > price) resistances.push({ price: coin.high_24h });
  if (coin.ath && coin.ath > price * 1.02) resistances.push({ price: coin.ath });
  const sparkline = coin.sparkline;
  if (sparkline && sparkline.length > 10) {
    const localMins = [], localMaxs = [];
    const w = 6;
    for (let i = w; i < sparkline.length - w; i++) {
      let isMin = true, isMax = true;
      for (let j = i - w; j <= i + w; j++) {
        if (j === i) continue;
        if (sparkline[j] <= sparkline[i]) isMin = false;
        if (sparkline[j] >= sparkline[i]) isMax = false;
      }
      if (isMin) localMins.push(sparkline[i]);
      if (isMax) localMaxs.push(sparkline[i]);
    }
    const cluster = (levels) => {
      if (!levels.length) return [];
      const sorted = [...levels].sort((a, b) => a - b);
      const clusters = [[sorted[0]]];
      for (let i = 1; i < sorted.length; i++) {
        const lc = clusters[clusters.length - 1];
        const avg = lc.reduce((s, v) => s + v, 0) / lc.length;
        if (Math.abs(sorted[i] - avg) / avg < 0.015) lc.push(sorted[i]);
        else clusters.push([sorted[i]]);
      }
      return clusters.map(c => c.reduce((s, v) => s + v, 0) / c.length);
    };
    for (const l of cluster(localMins)) if (l < price * 0.99) supports.push({ price: l });
    for (const l of cluster(localMaxs)) if (l > price * 1.01) resistances.push({ price: l });
  }
  supports.sort((a, b) => b.price - a.price);
  resistances.sort((a, b) => a.price - b.price);
  const dedup = (levels) => {
    const r = [];
    for (const l of levels) if (!r.some(x => Math.abs(x.price - l.price) / l.price < 0.005)) r.push(l);
    return r;
  };
  return { supports: dedup(supports).slice(0, 5), resistances: dedup(resistances).slice(0, 5) };
}

// ─── Réplique paramétrable de alignTPWithSR ───
function alignTPWithSR(side, entry, slPercent, supports, resistances, P) {
  const eff = Math.max(slPercent, P.SL_MIN);
  const slD = entry * (eff / 100);
  let tp1, tp2, tp3, sl;
  if (side === 'LONG') {
    sl = entry - slD;
    tp1 = entry + slD * P.TP1_MULT;
    tp2 = entry + slD * P.TP2_MULT;
    tp3 = entry + slD * P.TP3_MULT;
    const nearSup = supports.find(s => s.price < entry * 0.995);
    if (nearSup && nearSup.price > sl * 0.95 && nearSup.price < entry * 0.96) {
      sl = nearSup.price * 0.997;
      if ((entry - sl) / entry < P.SL_MIN / 100) sl = entry * (1 - P.SL_MIN / 100);
    }
    const resAbove = resistances.filter(r => r.price > entry * 1.005);
    if (P.SR_SNAP) {
      const b1 = P.SNAP_BOUND ? entry + slD * 1.8 : tp1 * 1.20;
      const b2 = P.SNAP_BOUND ? entry + slD * 3.2 : tp2 * 1.25;
      if (resAbove.length >= 1 && resAbove[0].price >= entry + slD * 0.8 && resAbove[0].price < b1) tp1 = resAbove[0].price * 0.998;
      if (resAbove.length >= 2 && resAbove[1].price >= entry + slD * 1.8 && resAbove[1].price < b2) tp2 = resAbove[1].price * 0.998;
      if (resAbove.length >= 3 && resAbove[2].price >= entry + slD * 3.0 && resAbove[2].price < tp3 * 1.3) tp3 = resAbove[2].price * 0.998;
    }
  } else {
    sl = entry + slD;
    tp1 = entry - slD * P.TP1_MULT;
    tp2 = entry - slD * P.TP2_MULT;
    tp3 = entry - slD * P.TP3_MULT;
    const nearRes = resistances.find(r => r.price > entry * 1.005);
    if (nearRes && nearRes.price < sl * 1.05 && nearRes.price > entry * 1.04) {
      sl = nearRes.price * 1.003;
      if ((sl - entry) / entry < P.SL_MIN / 100) sl = entry * (1 + P.SL_MIN / 100);
    }
    const supBelow = supports.filter(s => s.price < entry * 0.995);
    if (P.SR_SNAP) {
      if (supBelow.length >= 1 && supBelow[0].price <= entry - slD * 0.8 && supBelow[0].price > tp1 * 0.80) tp1 = supBelow[0].price * 1.002;
      if (supBelow.length >= 2 && supBelow[1].price <= entry - slD * 1.8 && supBelow[1].price > tp2 * 0.80) tp2 = supBelow[1].price * 1.002;
      if (supBelow.length >= 3 && supBelow[2].price <= entry - slD * 3.0 && supBelow[2].price > tp3 * 0.7) tp3 = supBelow[2].price * 1.002;
    }
  }
  if (side === 'LONG') { tp2 = Math.max(tp2, tp1 * 1.01); tp3 = Math.max(tp3, tp2 * 1.01); }
  else { tp2 = Math.min(tp2, tp1 * 0.99); tp3 = Math.min(tp3, tp2 * 0.99); }
  return { tp1, tp2, tp3, sl };
}

// ─── Génération de signal à l'instant t (index 1h) — réplique v7 ───
function generateSignalAt(sym, klines1h, idx, btcRegime, P) {
  if (idx < 24 * 10) return null;
  const price = klines1h[idx - 1].close;
  const prev24 = klines1h[idx - 25].close;
  const change24h = (price - prev24) / prev24 * 100;
  const vol24h = klines1h.slice(idx - 24, idx).reduce((s, k) => s + k.qvol, 0);
  const mcap = sym.mcapNow * (price / sym.priceNow);
  const volMcapRatio = vol24h / mcap;
  if (volMcapRatio < 0.05) return null;

  let side, confidence, branch;
  if (P.B_MOMO_LONG && change24h > 2.5 && change24h < 10 && volMcapRatio > 0.10) {
    side = 'LONG'; branch = 'momo_long'; confidence = 45;
    if (change24h > 6) confidence += 10; else if (change24h > 4) confidence += 8; else confidence += 5;
    if (volMcapRatio > 0.25) confidence += 12; else if (volMcapRatio > 0.15) confidence += 8; else confidence += 4;
    if (change24h > 8) confidence -= 8;
  } else if (P.B_OVERSOLD_LONG && change24h < -10 && change24h > -25 && volMcapRatio > 0.12) {
    side = 'LONG'; branch = 'oversold_long'; confidence = 40;
    if (change24h < -18) confidence += 12; else if (change24h < -14) confidence += 10; else confidence += 6;
    if (volMcapRatio > 0.20) confidence += 8; else confidence += 4;
  } else if (P.B_BEAR_SHORT && change24h < -3 && change24h > -15 && volMcapRatio > 0.10) {
    side = 'SHORT'; branch = 'bear_short'; confidence = 45;
    if (change24h < -8) confidence += 12; else if (change24h < -5) confidence += 8; else confidence += 5;
    if (volMcapRatio > 0.25) confidence += 12; else if (volMcapRatio > 0.15) confidence += 8; else confidence += 4;
  } else if (P.B_OB_SHORT && change24h > 15 && change24h < 40 && volMcapRatio > 0.12) {
    side = 'SHORT'; branch = 'ob_short'; confidence = 40;
    if (change24h > 25) confidence += 12; else if (change24h > 20) confidence += 10; else confidence += 6;
    if (volMcapRatio > 0.20) confidence += 8; else confidence += 4;
  } else return null;

  // Phase 2 : 4H (50 bougies)
  const h4 = aggWindow(klines1h, idx, 4, 50);
  if (h4.length < 20) return null;
  const h4Closes = h4.map(k => k.close);
  const rsiArr = calcRSI(h4Closes, 14);
  const rsi4h = rsiArr[rsiArr.length - 1];
  if (side === 'LONG' && rsi4h > 65) return null;
  if (side === 'SHORT' && rsi4h < 35) return null;
  const e8 = calcEMA(h4Closes, 8), e20 = calcEMA(h4Closes, 20);
  const e8v = e8[e8.length - 1], e20v = e20[e20.length - 1];
  if (side === 'LONG' && e8v < e20v) return null;
  if (side === 'SHORT' && e8v > e20v) return null;

  const recentVols = h4.slice(-3).map(k => k.qvol);
  const avgVol = h4.slice(-20).reduce((s, k) => s + k.qvol, 0) / 20;
  const recentAvg = recentVols.reduce((s, v) => s + v, 0) / recentVols.length;
  if (avgVol > 0 && recentAvg > avgVol * 1.2) confidence += 8;
  else if (avgVol > 0 && recentAvg > avgVol * 0.8) confidence += 3;
  else confidence -= 5;

  if (side === 'LONG') {
    if (rsi4h < 40) confidence += 8; else if (rsi4h < 50) confidence += 4;
  } else {
    if (rsi4h > 60) confidence += 8; else if (rsi4h > 50) confidence += 4;
  }
  const spread = Math.abs(e8v - e20v) / e20v;
  if (spread > 0.01) confidence += 5; else if (spread > 0.003) confidence += 2;

  // S/R
  const last24 = klines1h.slice(idx - 24, idx);
  const coin = {
    current_price: price,
    high_24h: Math.max(...last24.map(k => k.high)),
    low_24h: Math.min(...last24.map(k => k.low)),
    ath: Math.max(...klines1h.slice(0, idx).map(k => k.high)),
    sparkline: klines1h.slice(Math.max(0, idx - 168), idx).map(k => k.close),
  };
  const { supports, resistances } = calculateSRLevels(coin);
  const rawVol = Math.abs(change24h);
  const slPercent = Math.max(P.SL_MIN, Math.min(rawVol * 0.9, P.SL_MAX));
  const { tp1, tp2, tp3, sl } = alignTPWithSR(side, price, slPercent, supports, resistances, P);

  // Headroom : marge (%) jusqu'à l'obstacle S/R le plus proche dans le sens du trade
  let headroom = null;
  if (side === 'LONG') {
    const rA = resistances.find(r => r.price > price * 1.005);
    if (rA) headroom = (rA.price - price) / price * 100;
  } else {
    const sB = supports.find(s => s.price < price * 0.995);
    if (sB) headroom = (price - sB.price) / price * 100;
  }
  if (P.HEADROOM && headroom != null && headroom < P.HEADROOM) return null;
  if (P.HEADROOM_PEN && headroom != null && headroom < P.HEADROOM_PEN) confidence -= 10;

  let hasConvergence = false;
  const nearSup = supports[0], nearRes = resistances[0];
  if (side === 'LONG') {
    if (nearSup && Math.abs(price - nearSup.price) / price < 0.025) { confidence += 10; hasConvergence = true; }
    if (nearRes && Math.abs(tp1 - nearRes.price) / tp1 < 0.02) confidence += 5;
  } else {
    if (nearRes && Math.abs(price - nearRes.price) / price < 0.025) { confidence += 10; hasConvergence = true; }
    if (nearSup && Math.abs(tp1 - nearSup.price) / tp1 < 0.02) confidence += 5;
  }
  if (Math.abs(sl - price) / price < 0.05) confidence -= 10;
  if (supports.length >= 2) confidence += 2;
  if (resistances.length >= 2) confidence += 2;

  if (P.BTC_HARD) {
    if (btcRegime === 'bearish' && side === 'LONG') return null;
    if (btcRegime === 'bullish' && side === 'SHORT') return null;
  }
  if (P.BTC_REGIME) {
    if (btcRegime === 'bearish' && side === 'LONG') confidence -= 12;
    else if (btcRegime === 'bullish' && side === 'SHORT') confidence -= 12;
    else if (btcRegime !== 'neutral') confidence += 4;
  }
  if (P.NO_CONV_BONUS && hasConvergence) confidence -= 10;
  const cap = (hasConvergence && !P.NO_CONV_BONUS) ? 97 : 92;
  confidence = Math.min(cap, Math.max(30, confidence));

  // Daily filter (hard block + bonus alignement)
  const d1 = aggWindow(klines1h, idx, 24, 50);
  if (d1.length >= 25) {
    const d1c = d1.map(k => k.close);
    const d8 = calcEMA(d1c, 8), d20 = calcEMA(d1c, 20);
    const d8v = d8[d8.length - 1], d20v = d20[d20.length - 1];
    const dSpread = Math.abs(d8v - d20v) / d20v;
    let d1Trend = 'neutral';
    if (dSpread >= 0.001) d1Trend = d8v > d20v ? 'bullish' : 'bearish';
    if (side === 'LONG' && d1Trend === 'bearish') return null;
    if (side === 'SHORT' && d1Trend === 'bullish') return null;
    if ((side === 'LONG' && d1Trend === 'bullish') || (side === 'SHORT' && d1Trend === 'bearish')) {
      confidence = Math.min(98, confidence + 8);
    }
  }

  if (confidence < P.CONF_MIN) return null;
  if (P.CONV_ONLY && !hasConvergence) return null;

  return { side, branch, entry: price, sl, tp1, tp2, tp3, confidence, hasConvergence, headroom, rsi4h, btcRegime, t: klines1h[idx - 1].t };
}

// ─── Simulation d'un trade sur bougies 1h (tracking identique server.js) ───
function simulateTrade(sig, klines1h, startIdx, P) {
  const { side, entry, tp1, tp2, tp3 } = sig;
  let trailingSL = sig.sl;
  let tp1Hit = false, tp2Hit = false, tp3Hit = false;
  const maxBars = P.EXPIRY_H;
  const dir = side === 'LONG' ? 1 : -1;
  const pnl = p => dir * (p - entry) / entry * 100;

  for (let i = startIdx; i < Math.min(startIdx + maxBars, klines1h.length); i++) {
    const k = klines1h[i];
    const hitSL = side === 'LONG' ? k.low <= trailingSL : k.high >= trailingSL;
    const hiT1 = side === 'LONG' ? k.high >= tp1 : k.low <= tp1;
    const hiT2 = side === 'LONG' ? k.high >= tp2 : k.low <= tp2;
    const hiT3 = side === 'LONG' ? k.high >= tp3 : k.low <= tp3;

    // conservateur : SL prioritaire si SL et TP dans la même bougie
    if (hitSL) {
      return { outcome: tp1Hit ? 'be' : 'sl', tp1Hit, tp2Hit, tp3Hit, exit: trailingSL, pnlFull: pnl(trailingSL), bars: i - startIdx };
    }
    if (hiT1 && !tp1Hit) { tp1Hit = true; trailingSL = side === 'LONG' ? Math.max(trailingSL, entry) : Math.min(trailingSL, entry); }
    if (hiT2 && !tp2Hit && tp1Hit) { tp2Hit = true; trailingSL = side === 'LONG' ? Math.max(trailingSL, tp1) : Math.min(trailingSL, tp1); }
    if (hiT3 && tp2Hit) { tp3Hit = true; return { outcome: 'tp3', tp1Hit: true, tp2Hit: true, tp3Hit: true, exit: tp3, pnlFull: pnl(tp3), bars: i - startIdx }; }
  }
  const lastIdx = Math.min(startIdx + maxBars, klines1h.length) - 1;
  const close = klines1h[lastIdx].close;
  return { outcome: 'expired', tp1Hit, tp2Hit, tp3Hit, exit: close, pnlFull: pnl(close), bars: lastIdx - startIdx };
}

// PnL réaliste : sorties partielles 40% TP1 / 30% TP2 / 30% TP3 (reste suit le trailing)
function partialPnl(sig, res) {
  const { side, entry, tp1, tp2 } = sig;
  const dir = side === 'LONG' ? 1 : -1;
  const g = p => dir * (p - entry) / entry * 100;
  if (!res.tp1Hit) return res.pnlFull; // SL direct ou expiré sans TP
  let total = 0.4 * g(tp1);
  if (res.tp2Hit) {
    total += 0.3 * g(tp2);
    total += 0.3 * g(res.exit); // runner : TP3 ou trailing (>= TP1)
  } else {
    total += 0.6 * g(res.exit); // reste sorti à BE/trailing ou expiry
  }
  return total;
}

const FEES = 0.2; // aller-retour taker ~0.1% x2

async function loadUniverse() {
  const tickers = await fetchJson(`${BASE}/ticker/24hr`);
  const bad = /(UP|DOWN|BULL|BEAR)USDT$|^(USDC|FDUSD|TUSD|DAI|BUSD|EUR|USDP|WBTC|WBETH|PAXG)/;
  const usdt = tickers.filter(t => t.symbol.endsWith('USDT') && !bad.test(t.symbol))
    .sort((a, b) => +b.quoteVolume - +a.quoteVolume).slice(0, N_SYMBOLS + 20);
  // mcap via CoinGecko (proxy prod)
  let cg = [];
  for (let page = 1; page <= 2; page++) {
    const d = await fetchJson(`https://www.cryptoia.ca/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false`);
    if (Array.isArray(d)) cg.push(...d);
    await sleep(800);
  }
  const mcapMap = new Map();
  for (const c of cg) {
    const s = (c.symbol || '').toUpperCase() + 'USDT';
    if (!mcapMap.has(s) && c.market_cap) mcapMap.set(s, { mcap: c.market_cap, price: c.current_price });
  }
  const universe = [];
  for (const t of usdt) {
    const m = mcapMap.get(t.symbol);
    if (m) universe.push({ symbol: t.symbol, mcapNow: m.mcap, priceNow: m.price });
    if (universe.length >= N_SYMBOLS) break;
  }
  return universe;
}

function runBacktest(dataset, P, label) {
  const { symbols, btcRegimes, nBars } = dataset;
  const trades = [];
  const cooldowns = new Map(); // symbol+side -> lastIdx
  let active = []; // { endIdx }

  for (let idx = 24 * 10 + 200; idx < nBars - 1; idx += 4) {
    active = active.filter(a => a.endIdx > idx);
    const regime = btcRegimes[idx] || 'neutral';
    const cands = [];
    for (const sym of symbols) {
      if (idx >= sym.klines.length) continue;
      const key = sym.symbol;
      const sig = generateSignalAt(sym, sym.klines, idx, regime, P);
      if (!sig) continue;
      const cdKey = key + sig.side;
      if (cooldowns.has(cdKey) && idx - cooldowns.get(cdKey) < 12) continue;
      cands.push({ sym, sig });
    }
    cands.sort((a, b) => b.sig.confidence - a.sig.confidence);
    for (const { sym, sig } of cands) {
      if (active.length >= 10) break;
      const res = simulateTrade(sig, sym.klines, idx, P);
      const pnlAoN = res.outcome === 'be' ? 0 : res.pnlFull;
      trades.push({
        symbol: sym.symbol, ...sig, ...res,
        pnlAoN: pnlAoN - FEES,
        pnlPartial: partialPnl(sig, res) - FEES,
      });
      cooldowns.set(sym.symbol + sig.side, idx);
      active.push({ endIdx: idx + res.bars });
    }
  }

  const n = trades.length;
  if (!n) { console.log(`\n═══ ${label}: 0 trades ═══`); return { n: 0, ev: 0 }; }
  const wins = trades.filter(t => t.pnlPartial > 0).length;
  const tp1w = trades.filter(t => t.tp1Hit).length;
  const evP = trades.reduce((s, t) => s + t.pnlPartial, 0) / n;
  const evA = trades.reduce((s, t) => s + t.pnlAoN, 0) / n;
  const totP = trades.reduce((s, t) => s + t.pnlPartial, 0);
  console.log(`\n═══ ${label} ═══`);
  console.log(`Trades: ${n} (${(n / (dataset.days / 30)).toFixed(0)}/mois) | TP1 touché: ${(tp1w / n * 100).toFixed(1)}% | WR(partial>0): ${(wins / n * 100).toFixed(1)}%`);
  console.log(`EV partial: ${evP.toFixed(2)}%/trade | EV all-or-nothing: ${evA.toFixed(2)}% | PnL total partial: ${totP.toFixed(1)}%`);
  const by = (keyFn) => {
    const g = new Map();
    for (const t of trades) {
      const k = keyFn(t);
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(t);
    }
    for (const [k, ts] of [...g.entries()].sort()) {
      const ev = ts.reduce((s, t) => s + t.pnlPartial, 0) / ts.length;
      const tp1r = ts.filter(t => t.tp1Hit).length / ts.length * 100;
      console.log(`   ${k}: n=${ts.length} | TP1 ${tp1r.toFixed(0)}% | EV ${ev.toFixed(2)}%`);
    }
  };
  console.log(' Par branche:'); by(t => t.branch);
  console.log(' Par mois:'); by(t => new Date(t.t).toISOString().slice(0, 7));
  console.log(' Par side:'); by(t => t.side);
  console.log(' Par convergence:'); by(t => t.hasConvergence ? 'conv' : 'no-conv');
  console.log(' Par confiance:'); by(t => t.confidence >= 93 ? '93+' : t.confidence >= 88 ? '88-92' : '80-87');
  console.log(' Par régime BTC:'); by(t => t.btcRegime);
  console.log(' Par headroom:'); by(t => t.headroom == null ? 'n/a (aucun obstacle)' : t.headroom < 2 ? '<2%' : t.headroom < 4 ? '2-4%' : t.headroom < 6 ? '4-6%' : '>6%');
  console.log(' Par outcome:'); by(t => t.outcome);
  return { n, ev: evP, wr: wins / n * 100, trades };
}

const V7 = {
  SL_MIN: 6, SL_MAX: 12, TP1_MULT: 1.2, TP2_MULT: 2.5, TP3_MULT: 4.0,
  SR_SNAP: true, CONF_MIN: 80, CONV_ONLY: false, BTC_REGIME: true,
  B_MOMO_LONG: true, B_OVERSOLD_LONG: true, B_BEAR_SHORT: true, B_OB_SHORT: true,
  EXPIRY_H: 120,
};

async function main() {
  console.log(`Chargement univers (${N_SYMBOLS} symboles, ${DAYS} jours)...`);
  const universe = await loadUniverse();
  console.log(`Univers: ${universe.length} symboles avec mcap.`);
  const symbols = [];
  for (let i = 0; i < universe.length; i++) {
    const u = universe[i];
    const klines = await fetchKlines1h(u.symbol, DAYS);
    if (klines.length > 24 * 30) symbols.push({ ...u, klines });
    if ((i + 1) % 20 === 0) console.log(` ${i + 1}/${universe.length} chargés`);
  }
  const btc = symbols.find(s => s.symbol === 'BTCUSDT') || { klines: await fetchKlines1h('BTCUSDT', DAYS) };
  const nBars = Math.max(...symbols.map(s => s.klines.length));

  // Régime BTC précalculé par index 1h
  const btcRegimes = new Array(nBars).fill('neutral');
  for (let idx = 240; idx < btc.klines.length; idx += 4) {
    const h4 = aggWindow(btc.klines, idx, 4, 60);
    if (h4.length >= 30) {
      const closes = h4.map(k => k.close);
      const e8 = calcEMA(closes, 8), e20 = calcEMA(closes, 20);
      const e8v = e8[e8.length - 1], e20v = e20[e20.length - 1];
      const last = closes[closes.length - 1];
      let r = 'neutral';
      if (e8v > e20v && last > e20v) r = 'bullish';
      else if (e8v < e20v && last < e20v) r = 'bearish';
      for (let j = idx; j < Math.min(idx + 4, nBars); j++) btcRegimes[j] = r;
    }
  }

  const dataset = { symbols, btcRegimes, nBars, days: DAYS };

  if (args.headroom) {
    const V8 = { ...V7, B_BEAR_SHORT: false, B_OB_SHORT: false, NO_CONV_BONUS: true };
    runBacktest(dataset, V8, 'BASELINE v8 prod (LONG only, sans bonus conv)');
    const hVariants = [
      ['v8 + headroom >=2%', { ...V8, HEADROOM: 2 }],
      ['v8 + headroom >=3%', { ...V8, HEADROOM: 3 }],
      ['v8 + headroom >=4%', { ...V8, HEADROOM: 4 }],
      ['v8 + headroom >=5%', { ...V8, HEADROOM: 5 }],
      ['v8 + headroom >=6%', { ...V8, HEADROOM: 6 }],
      ['v8 + headroom >=7%', { ...V8, HEADROOM: 7 }],
      ['v8 + pénalité -10 si <3%', { ...V8, HEADROOM_PEN: 3 }],
      ['v8 + pénalité -10 si <4%', { ...V8, HEADROOM_PEN: 4 }],
    ];
    for (const [label, P] of hVariants) runBacktest(dataset, P, label);
    return;
  }

  runBacktest(dataset, V7, 'BASELINE v7 (règles actuelles prod)');

  if (args.grid) {
    const variants = [
      ['SL 4% serré', { ...V7, SL_MIN: 4, SL_MAX: 8 }],
      ['SL 3% serré', { ...V7, SL_MIN: 3, SL_MAX: 6 }],
      ['TP1 1.5R', { ...V7, TP1_MULT: 1.5 }],
      ['SL4 + TP1 1.5R', { ...V7, SL_MIN: 4, SL_MAX: 8, TP1_MULT: 1.5 }],
      ['conv-only', { ...V7, CONV_ONLY: true }],
      ['conf 88+', { ...V7, CONF_MIN: 88 }],
      ['sans oversold_long', { ...V7, B_OVERSOLD_LONG: false }],
      ['sans shorts', { ...V7, B_BEAR_SHORT: false, B_OB_SHORT: false }],
      ['longs momo only', { ...V7, B_OVERSOLD_LONG: false, B_BEAR_SHORT: false, B_OB_SHORT: false }],
      ['sans snap S/R', { ...V7, SR_SNAP: false }],
      ['expiry 72h', { ...V7, EXPIRY_H: 72 }],
      ['BTC hard block', { ...V7, BTC_HARD: true }],
      ['sans bonus conv', { ...V7, NO_CONV_BONUS: true }],
      ['COMBO A: sans shorts + TP1 1.5R', { ...V7, B_BEAR_SHORT: false, B_OB_SHORT: false, TP1_MULT: 1.5 }],
      ['COMBO B: A + BTC hard', { ...V7, B_BEAR_SHORT: false, B_OB_SHORT: false, TP1_MULT: 1.5, BTC_HARD: true }],
      ['COMBO C: A + expiry 72h', { ...V7, B_BEAR_SHORT: false, B_OB_SHORT: false, TP1_MULT: 1.5, EXPIRY_H: 72 }],
      ['COMBO D: momo only + TP1 1.5R + BTC hard', { ...V7, B_OVERSOLD_LONG: false, B_BEAR_SHORT: false, B_OB_SHORT: false, TP1_MULT: 1.5, BTC_HARD: true }],
      ['COMBO E: B + sans bonus conv', { ...V7, B_BEAR_SHORT: false, B_OB_SHORT: false, TP1_MULT: 1.5, BTC_HARD: true, NO_CONV_BONUS: true }],
      ['F1: momo only + sans bonus conv', { ...V7, B_OVERSOLD_LONG: false, B_BEAR_SHORT: false, B_OB_SHORT: false, NO_CONV_BONUS: true }],
      ['F2: sans shorts + sans bonus conv', { ...V7, B_BEAR_SHORT: false, B_OB_SHORT: false, NO_CONV_BONUS: true }],
      ['F3: F1 + expiry 72h', { ...V7, B_OVERSOLD_LONG: false, B_BEAR_SHORT: false, B_OB_SHORT: false, NO_CONV_BONUS: true, EXPIRY_H: 72 }],
      ['F4: F2 + BTC hard', { ...V7, B_BEAR_SHORT: false, B_OB_SHORT: false, NO_CONV_BONUS: true, BTC_HARD: true }],
      ['F5: sans oversold + sans bonus conv', { ...V7, B_OVERSOLD_LONG: false, NO_CONV_BONUS: true }],
      ['G1: F2 + snap borné (dist)', { ...V7, B_BEAR_SHORT: false, B_OB_SHORT: false, NO_CONV_BONUS: true, SNAP_BOUND: true }],
    ];
    for (const [label, P] of variants) runBacktest(dataset, P, label);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
