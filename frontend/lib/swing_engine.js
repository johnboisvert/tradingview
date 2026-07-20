// Swing signal engine (extracted from server.js — Session 45, refactor phase 3).
// CoinGecko-based swing setups (S/R levels, 4H RSI/EMA confirmation, Daily filter),
// Telegram alerts with 12h in-memory+file cooldowns, 5-min scheduler.
import {
  calcEMA, calcRSI, fetchBinanceKlines, formatNumber, formatPrice, roundPrice,
} from './signal_primitives.js';

export function createSwingEngine(deps) {
  const { port, loadTelegramAlerts, saveTelegramAlerts, sendTelegramMessage, loadTradeCalls } = deps;

// ═══════════════════════════════════════════════════════════════════════════════
// COOLDOWN SYSTEM — In-memory primary + file backup, 12h per crypto+direction (v6)
// ═══════════════════════════════════════════════════════════════════════════════
const COOLDOWN_MS = 12 * 60 * 60 * 1000; // v6: 12 hours in ms (swing trade cooldown)

// PRIMARY: In-memory cooldown Map — survives as long as the process runs
// key: `${coinId}_${direction}` → timestamp (ms)
const inMemoryCooldowns = new Map();

// NO daily alert limit — only per-crypto cooldown applies

// Load file-based cooldowns into in-memory Map on startup
function initCooldownsFromFile() {
  try {
    const config = loadTelegramAlerts();
    const fileCooldowns = config.cooldowns || {};
    let loaded = 0;
    let expired = 0;
    const now = Date.now();
    for (const [key, entry] of Object.entries(fileCooldowns)) {
      const elapsed = now - new Date(entry.timestamp).getTime();
      if (elapsed < COOLDOWN_MS) {
        // Parse key: old format is `${coinId}_signal`, extract coinId
        const coinId = key.replace(/_signal$/, '');
        const memKey = `${coinId}_${entry.direction}`;
        inMemoryCooldowns.set(memKey, new Date(entry.timestamp).getTime());
        loaded++;
      } else {
        expired++;
      }
    }
    console.log(`[Telegram] 🔄 Loaded ${loaded} active cooldowns from file (${expired} expired, discarded)`);
  } catch (err) {
    console.error('[Telegram] Error loading cooldowns from file:', err);
  }
}

function loadCooldowns() {
  // Return a plain object for backward compatibility with file persistence
  const config = loadTelegramAlerts();
  return config.cooldowns || {};
}

function saveCooldowns(cooldowns) {
  try {
    const config = loadTelegramAlerts();
    config.cooldowns = cooldowns;
    saveTelegramAlerts(config);
  } catch (err) {
    console.error('[Telegram] Error saving cooldowns to file (non-critical):', err);
  }
}

/**
 * Check if a cooldown is active for a coin+direction.
 * Checks IN-MEMORY first (reliable), then file as fallback.
 * Returns true if the same direction signal was sent within the cooldown period.
 */
function isCooldownActive(cooldowns, coinId, direction) {
  const now = Date.now();
  const memKey = `${coinId}_${direction}`;

  // 1. Check in-memory (primary, always reliable)
  const memTimestamp = inMemoryCooldowns.get(memKey);
  if (memTimestamp && (now - memTimestamp) < COOLDOWN_MS) {
    const remainingMin = Math.round((COOLDOWN_MS - (now - memTimestamp)) / 60000);
    console.log(`[Telegram] 🛑 In-memory cooldown active for ${coinId} (${direction}), ${remainingMin}min remaining`);
    return true;
  }

  // 2. Fallback: check file-based cooldowns (for persistence across restarts)
  const fileKey = `${coinId}_signal`;
  const entry = cooldowns[fileKey];
  if (entry) {
    const elapsed = now - new Date(entry.timestamp).getTime();
    if (elapsed < COOLDOWN_MS && entry.direction === direction) {
      const remainingMin = Math.round((COOLDOWN_MS - elapsed) / 60000);
      console.log(`[Telegram] 🛑 File cooldown active for ${coinId} (${direction}), ${remainingMin}min remaining`);
      // Sync to in-memory for future checks
      inMemoryCooldowns.set(memKey, new Date(entry.timestamp).getTime());
      return true;
    }
  }

  return false;
}

/**
 * Set cooldown in BOTH in-memory Map AND file persistence.
 */
function setCooldown(cooldowns, coinId, direction) {
  const now = Date.now();
  const memKey = `${coinId}_${direction}`;

  // 1. Set in-memory (instant, always works)
  inMemoryCooldowns.set(memKey, now);

  // 2. Set in file object (for persistence)
  const fileKey = `${coinId}_signal`;
  cooldowns[fileKey] = {
    timestamp: new Date(now).toISOString(),
    direction,
  };

  // Log active cooldowns count
  let activeCooldowns = 0;
  for (const [, ts] of inMemoryCooldowns) {
    if ((now - ts) < COOLDOWN_MS) activeCooldowns++;
  }
  console.log(`[Telegram] 🔒 Cooldown set for ${coinId} (${direction}) — ${activeCooldowns} active cooldowns total`);
}

// Clean up expired in-memory cooldowns periodically (every 30 min)
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, ts] of inMemoryCooldowns) {
    if ((now - ts) >= COOLDOWN_MS) {
      inMemoryCooldowns.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[Telegram] 🧹 Cleaned ${cleaned} expired cooldowns from memory (${inMemoryCooldowns.size} remaining)`);
  }
}, 30 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════════════════════
// COINGECKO-BASED SIGNAL GENERATION (mirrors /trades page logic exactly)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate Support & Resistance levels from sparkline data and 24h high/low.
 * (Same algorithm as Trades.tsx calculateSRLevels)
 */
function calculateSRLevels(coin) {
  const price = coin.current_price;
  const supports = [];
  const resistances = [];

  // 1. Use high_24h and low_24h as immediate S/R
  if (coin.low_24h && coin.low_24h < price) {
    supports.push({ price: coin.low_24h, type: 'support', strength: 'major', source: 'Low 24h' });
  }
  if (coin.high_24h && coin.high_24h > price) {
    resistances.push({ price: coin.high_24h, type: 'resistance', strength: 'major', source: 'High 24h' });
  }

  // 2. ATH as major resistance
  if (coin.ath && coin.ath > price * 1.02) {
    resistances.push({ price: coin.ath, type: 'resistance', strength: 'major', source: 'ATH' });
  }

  // 3. Extract local min/max from sparkline (7-day hourly data)
  const sparkline = coin.sparkline_in_7d?.price;
  if (sparkline && sparkline.length > 10) {
    const localMins = [];
    const localMaxs = [];
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

    // Cluster nearby levels (within 1.5% of each other)
    const clusterLevels = (levels) => {
      if (levels.length === 0) return [];
      const sorted = [...levels].sort((a, b) => a - b);
      const clusters = [[sorted[0]]];
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
          type: 'support',
          strength: Math.abs(level - price) / price < 0.03 ? 'major' : 'minor',
          source: 'Sparkline 7j',
        });
      }
    }

    for (const level of clusteredMaxs) {
      if (level > price * 1.01) {
        resistances.push({
          price: level,
          type: 'resistance',
          strength: Math.abs(level - price) / price < 0.03 ? 'major' : 'minor',
          source: 'Sparkline 7j',
        });
      }
    }
  }

  // Sort: supports descending (nearest first), resistances ascending (nearest first)
  supports.sort((a, b) => b.price - a.price);
  resistances.sort((a, b) => a.price - b.price);

  // Deduplicate very close levels (within 0.5%)
  const dedup = (levels) => {
    const result = [];
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

/**
 * Align TP levels with S/R for higher probability.
 * v6: Wider SL (6-12%) + adjusted TP ratios for swing trading
 */
function alignTPWithSR(side, entry, slPercent, supports, resistances) {
  // v6: Enforce minimum 6% SL for swing trades
  const effectiveSlPercent = Math.max(slPercent, 6.0);
  const slDistance = entry * (effectiveSlPercent / 100);

  let tp1, tp2, tp3, sl;

  if (side === 'LONG') {
    sl = entry - slDistance;
    // Enforce minimum 6% SL distance
    if (Math.abs(entry - sl) / entry < 0.06) sl = entry * 0.94;
    // v6: Adjusted TP ratios for wider SL
    tp1 = entry + slDistance * 1.2;   // 1.2:1 — slightly above 1:1 to account for fees
    tp2 = entry + slDistance * 2.5;   // 2.5:1 — moderate target
    tp3 = entry + slDistance * 4.0;   // 4:1 — extended target

    const nearestSupport = supports.find(s => s.price < entry * 0.995);
    if (nearestSupport && nearestSupport.price > sl * 0.95 && nearestSupport.price < entry * 0.96) {
      sl = nearestSupport.price * 0.997;
      if (Math.abs(entry - sl) / entry < 0.06) sl = entry * 0.94;
    }

    const resAbove = resistances.filter(r => r.price > entry * 1.005);
    // v7: only snap TP to S/R if it keeps a decent reward (April bug: TP1 snapped to +0.5% resistances)
    if (resAbove.length >= 1 && resAbove[0].price >= entry + slDistance * 0.8 && resAbove[0].price < tp1 * 1.20) {
      tp1 = resAbove[0].price * 0.998;
    }
    if (resAbove.length >= 2 && resAbove[1].price >= entry + slDistance * 1.8 && resAbove[1].price < tp2 * 1.25) {
      tp2 = resAbove[1].price * 0.998;
    }
    // v8: cap supérieur — bug avril/juillet : TP3 snappé sur l'ATH (18-45x l'entrée)
    if (resAbove.length >= 3 && resAbove[2].price >= entry + slDistance * 3.0 && resAbove[2].price < tp3 * 1.3) {
      tp3 = resAbove[2].price * 0.998;
    }
  } else {
    sl = entry + slDistance;
    if (Math.abs(sl - entry) / entry < 0.06) sl = entry * 1.06;
    tp1 = entry - slDistance * 1.2;
    tp2 = entry - slDistance * 2.5;
    tp3 = entry - slDistance * 4.0;

    const nearestResistance = resistances.find(r => r.price > entry * 1.005);
    if (nearestResistance && nearestResistance.price < sl * 1.05 && nearestResistance.price > entry * 1.04) {
      sl = nearestResistance.price * 1.003;
      if (Math.abs(sl - entry) / entry < 0.06) sl = entry * 1.06;
    }

    const supBelow = supports.filter(s => s.price < entry * 0.995);
    // v7: only snap TP to S/R if it keeps a decent reward
    if (supBelow.length >= 1 && supBelow[0].price <= entry - slDistance * 0.8 && supBelow[0].price > tp1 * 0.80) {
      tp1 = supBelow[0].price * 1.002;
    }
    if (supBelow.length >= 2 && supBelow[1].price <= entry - slDistance * 1.8 && supBelow[1].price > tp2 * 0.80) {
      tp2 = supBelow[1].price * 1.002;
    }
    // v8: cap inférieur symétrique
    if (supBelow.length >= 3 && supBelow[2].price <= entry - slDistance * 3.0 && supBelow[2].price > tp3 * 0.7) {
      tp3 = supBelow[2].price * 1.002;
    }
  }

  // Ensure TPs are in correct order
  if (side === 'LONG') {
    tp2 = Math.max(tp2, tp1 * 1.01);
    tp3 = Math.max(tp3, tp2 * 1.01);
  } else {
    tp2 = Math.min(tp2, tp1 * 0.99);
    tp3 = Math.min(tp3, tp2 * 0.99);
  }

  return { tp1, tp2, tp3, sl };
}

/**
 * Generate trade setups from CoinGecko market data.
 * v6: Now async — fetches Binance 4H klines for RSI + EMA confirmation.
 * Returns raw setups without Daily filter — Daily filter applied async in checkAndSendAlerts.
 */
async function generateRealSetups(coins) {
  const setups = [];
  const triggerTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Montreal' });

  // Phase 1: CoinGecko-based pre-filter (fast)
  const candidates = [];
  for (const c of coins) {
    if (!c || !c.current_price || !c.market_cap) continue;

    const price = c.current_price;
    const change24h = c.price_change_percentage_24h || 0;
    const volume = c.total_volume || 0;
    const mcap = c.market_cap || 1;
    const volMcapRatio = volume / mcap;

    // v4: Skip low volume coins
    if (volMcapRatio < 0.05) continue;

    let side;
    let confidence = 0;
    let reason;

    // v5: Balanced LONG/SHORT entry conditions
    // LONG — Momentum continuation (v7: tightened 2.5-10% window, no pump-chasing bonus)
    if (change24h > 2.5 && change24h < 10 && volMcapRatio > 0.10) {
      side = 'LONG';
      confidence = 45;
      if (change24h > 6) confidence += 10; else if (change24h > 4) confidence += 8; else confidence += 5;
      if (volMcapRatio > 0.25) confidence += 12; else if (volMcapRatio > 0.15) confidence += 8; else confidence += 4;
      // v7: penalize extended moves (data: momentum >=6% → 41% SL rate, pump-chasing kills winrate)
      if (change24h > 8) confidence -= 8;
      reason = `Momentum haussier (+${change24h.toFixed(1)}%) avec volume élevé (${(volMcapRatio * 100).toFixed(1)}% du MCap)`;
    }
    // LONG — Oversold bounce: deep drop with volume (reversal play)
    else if (change24h < -10 && change24h > -25 && volMcapRatio > 0.12) {
      side = 'LONG';
      confidence = 40;
      if (change24h < -18) confidence += 12; else if (change24h < -14) confidence += 10; else confidence += 6;
      if (volMcapRatio > 0.20) confidence += 8; else confidence += 4;
      reason = `Survente potentielle (${change24h.toFixed(1)}%) — rebond technique possible`;
    }
    // v8 (backtest 180j, 120 symboles) : les branches SHORT étaient perdantes
    // (bear_short EV -0.9%, ob_short EV -9.7%) — moteur swing LONG uniquement.
    else {
      continue;
    }

    candidates.push({ coin: c, side, confidence, reason, price, change24h, volume, mcap, volMcapRatio });
  }

  console.log(`[Telegram] Phase 1: ${candidates.length} CoinGecko candidates passed pre-filter`);

  // ─── v7: BTC regime filter — alts follow BTC; April data: LONGs in BTC downtrend = 41% SL ───
  let btcRegime = 'neutral';
  try {
    const btc4h = await fetchBinanceKlines('BTCUSDT', '4h', 60);
    if (btc4h.length >= 30) {
      const closes = btc4h.map(k => k.close);
      const ema8 = calcEMA(closes, 8);
      const ema20 = calcEMA(closes, 20);
      const e8 = ema8[ema8.length - 1];
      const e20 = ema20[ema20.length - 1];
      const last = closes[closes.length - 1];
      if (e8 > e20 && last > e20) btcRegime = 'bullish';
      else if (e8 < e20 && last < e20) btcRegime = 'bearish';
      console.log(`[Telegram] v7 BTC regime (4H EMA8/EMA20): ${btcRegime}`);
    }
  } catch (e) {
    console.log(`[Telegram] BTC regime check failed (neutral fallback): ${e.message}`);
  }

  // Phase 2: Binance 4H technical confirmation (RSI + EMA + Volume)
  const SWING_BATCH_SIZE = 5;
  for (let i = 0; i < candidates.length; i += SWING_BATCH_SIZE) {
    const batch = candidates.slice(i, i + SWING_BATCH_SIZE);
    const results = await Promise.all(batch.map(async (cand) => {
      const { coin: c, side, reason: baseReason, price, change24h, volume, mcap, volMcapRatio } = cand;
      let { confidence } = cand;
      let reason = baseReason;
      const symbol = ((c.symbol || '').toUpperCase()) + 'USDT';
      let rsi4hValue = null; // v7: captured for server-side tracking

      // ─── Fetch Binance 4H klines for RSI + EMA confirmation ───
      try {
        const h4Candles = await fetchBinanceKlines(symbol, '4h', 50);
        if (h4Candles.length >= 20) {
          const h4Closes = h4Candles.map(k => k.close);

          // RSI(14) on 4H
          const rsiArr = calcRSI(h4Closes, 14);
          const rsi4h = rsiArr[rsiArr.length - 1];
          rsi4hValue = rsi4h;

          // v6: HARD REJECT if RSI conflicts with direction
          if (side === 'LONG' && rsi4h > 65) {
            console.log(`[Telegram] ❌ ${symbol} LONG rejected: RSI(4H)=${rsi4h.toFixed(1)} > 65 (overbought)`);
            return null;
          }
          if (side === 'SHORT' && rsi4h < 35) {
            console.log(`[Telegram] ❌ ${symbol} SHORT rejected: RSI(4H)=${rsi4h.toFixed(1)} < 35 (oversold)`);
            return null;
          }

          // EMA8/EMA20 on 4H — require trend alignment
          const h4Ema8 = calcEMA(h4Closes, 8);
          const h4Ema20 = calcEMA(h4Closes, 20);
          const h4Ema8Val = h4Ema8[h4Ema8.length - 1];
          const h4Ema20Val = h4Ema20[h4Ema20.length - 1];

          if (side === 'LONG' && h4Ema8Val < h4Ema20Val) {
            console.log(`[Telegram] ❌ ${symbol} LONG rejected: 4H EMA8 (${h4Ema8Val.toFixed(4)}) < EMA20 (${h4Ema20Val.toFixed(4)}) — bearish trend`);
            return null;
          }
          if (side === 'SHORT' && h4Ema8Val > h4Ema20Val) {
            console.log(`[Telegram] ❌ ${symbol} SHORT rejected: 4H EMA8 (${h4Ema8Val.toFixed(4)}) > EMA20 (${h4Ema20Val.toFixed(4)}) — bullish trend`);
            return null;
          }

          // Volume confirmation: recent 4H volume above average
          const recentVols = h4Candles.slice(-3).map(k => k.volume);
          const avgVol = h4Candles.slice(-20).reduce((s, k) => s + k.volume, 0) / 20;
          const recentAvgVol = recentVols.reduce((s, v) => s + v, 0) / recentVols.length;

          if (avgVol > 0 && recentAvgVol > avgVol * 1.2) {
            confidence += 8;
            reason += ` | Volume 4H confirmé (${(recentAvgVol / avgVol).toFixed(1)}x moyenne)`;
          } else if (avgVol > 0 && recentAvgVol > avgVol * 0.8) {
            confidence += 3;
            reason += ` | Volume 4H normal`;
          } else {
            confidence -= 5;
            reason += ` | ⚠️ Volume 4H faible`;
          }

          // RSI bonus/penalty
          if (side === 'LONG') {
            if (rsi4h < 40) { confidence += 8; reason += ` | RSI(4H): ${rsi4h.toFixed(0)} — zone de survente`; }
            else if (rsi4h < 50) { confidence += 4; reason += ` | RSI(4H): ${rsi4h.toFixed(0)} — neutre-bas`; }
            else { reason += ` | RSI(4H): ${rsi4h.toFixed(0)}`; }
          } else {
            if (rsi4h > 60) { confidence += 8; reason += ` | RSI(4H): ${rsi4h.toFixed(0)} — zone de surachat`; }
            else if (rsi4h > 50) { confidence += 4; reason += ` | RSI(4H): ${rsi4h.toFixed(0)} — neutre-haut`; }
            else { reason += ` | RSI(4H): ${rsi4h.toFixed(0)}`; }
          }

          // EMA alignment bonus
          const emaSpread = Math.abs(h4Ema8Val - h4Ema20Val) / h4Ema20Val;
          if (emaSpread > 0.01) { confidence += 5; reason += ` | 4H EMA fortement alignées`; }
          else if (emaSpread > 0.003) { confidence += 2; reason += ` | 4H EMA alignées`; }

        } else {
          // Not enough 4H data — penalize
          confidence -= 10;
          reason += ` | ⚠️ Données 4H insuffisantes`;
        }
      } catch (err) {
        console.warn(`[Telegram] 4H fetch error for ${symbol}:`, err.message);
        confidence -= 10;
        reason += ` | ⚠️ Erreur données 4H`;
      }

      const { supports, resistances } = calculateSRLevels(c);

      // v6: Wider SL for swing (6-12%)
      const rawVolatility = Math.abs(change24h);
      const slPercent = Math.max(6.0, Math.min(rawVolatility * 0.9, 12.0));

      const { tp1, tp2, tp3, sl } = alignTPWithSR(side, price, slPercent, supports, resistances);

      const nearestSupport = supports[0];
      const nearestResistance = resistances[0];
      let hasConvergence = false; // v8: détection conservée pour stats, mais SANS bonus de confiance
      // (backtest 180j : conv-only EV -1.27%/trade — "proche du support" = souvent un support qui casse)

      if (side === 'LONG') {
        if (nearestSupport && Math.abs(price - nearestSupport.price) / price < 0.025) {
          hasConvergence = true;
          reason += ` | Proche du support $${formatPrice(nearestSupport.price)}`;
        }
        if (nearestResistance && Math.abs(tp1 - nearestResistance.price) / tp1 < 0.02) {
          confidence += 5;
        }
      } else {
        if (nearestResistance && Math.abs(price - nearestResistance.price) / price < 0.025) {
          hasConvergence = true;
          reason += ` | Proche de la résistance $${formatPrice(nearestResistance.price)}`;
        }
        if (nearestSupport && Math.abs(tp1 - nearestSupport.price) / tp1 < 0.02) {
          confidence += 5;
        }
      }

      if (Math.abs(sl - price) / price < 0.05) {
        confidence -= 10;
      }

      if (supports.length >= 2) confidence += 2;
      if (resistances.length >= 2) confidence += 2;

      // v7: BTC regime adjustment — don't fight Bitcoin
      if (btcRegime === 'bearish' && side === 'LONG') {
        confidence -= 12;
        reason += ' | ⚠️ BTC 4H baissier';
      } else if (btcRegime === 'bullish' && side === 'SHORT') {
        confidence -= 12;
        reason += ' | ⚠️ BTC 4H haussier';
      } else if (btcRegime !== 'neutral') {
        confidence += 4; // aligned with BTC
      }

      // v8: recalibration — cap unique 92 (le bonus convergence gonflait artificiellement 93-97 qui sous-performaient)
      confidence = Math.min(92, Math.max(30, confidence));

      const riskDistance = Math.abs(price - sl);
      const rewardDistance = Math.abs(tp2 - price);
      const rr = riskDistance > 0 ? Math.round((rewardDistance / riskDistance) * 10) / 10 : 2;

      return {
        id: c.id,
        symbol,
        name: c.name || 'Unknown',
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
        reason,
        triggerTime,
        hasConvergence,
        rsi4h: typeof rsi4hValue === 'number' ? Math.round(rsi4hValue * 10) / 10 : null,
        supports: supports.slice(0, 3),
        resistances: resistances.slice(0, 3),
      };
    }));

    for (const setup of results) {
      if (setup) setups.push(setup);
    }

    // Delay between batches to respect Binance rate limits
    if (i + SWING_BATCH_SIZE < candidates.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`[Telegram] Phase 2: ${setups.length} setups passed Binance 4H confirmation`);
  return setups.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Apply Daily (1D) EMA8/EMA20 trend filter to a swing setup.
 * Fetches Daily candles from Binance, calculates trend, adjusts confidence.
 * Returns the setup with d1_trend, ema8_d1, ema20_d1 fields added, or null if blocked.
 */
async function applyDailyFilterToSwingSetup(setup) {
  try {
    const d1Candles = await fetchBinanceKlines(setup.symbol, '1d', 50);

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

    // v6: Daily trend HARD BLOCK — reject trades against daily trend
    if (setup.side === 'LONG' && d1Trend === 'bearish') {
      console.log(`[Telegram] ❌ ${setup.symbol} LONG BLOCKED: Daily trend is bearish — hard reject`);
      return null;
    }
    if (setup.side === 'SHORT' && d1Trend === 'bullish') {
      console.log(`[Telegram] ❌ ${setup.symbol} SHORT BLOCKED: Daily trend is bullish — hard reject`);
      return null;
    }

    // Apply Daily trend bonus for alignment
    let d1Penalty = 0;
    let d1Reason = '';
    if (setup.side === 'LONG' && d1Trend === 'bullish') {
      d1Penalty = -8;
      d1Reason = `✅ Daily Bullish — bonus alignement +8%`;
    } else if (setup.side === 'SHORT' && d1Trend === 'bearish') {
      d1Penalty = -8;
      d1Reason = `✅ Daily Bearish — bonus alignement +8%`;
    }

    let newConfidence = setup.confidence - d1Penalty;
    newConfidence = Math.min(98, Math.max(30, newConfidence));

    // Add Daily info to reason
    let newReason = setup.reason;
    if (d1Reason) {
      newReason += ` | ${d1Reason}`;
    }

    return {
      ...setup,
      confidence: newConfidence,
      reason: newReason,
      d1_trend: d1Trend,
      ema8_d1: d1Ema8Val,
      ema20_d1: d1Ema20Val,
    };
  } catch (err) {
    console.error(`[Telegram] Daily filter error for ${setup.symbol}:`, err.message);
    // On error, return setup unchanged (no filter applied)
    return { ...setup, d1_trend: 'unknown', ema8_d1: null, ema20_d1: null };
  }
}

/**
 * Fetch top 200 coins from CoinGecko via our own proxy (with sparkline for S/R).
 */
async function fetchCoinGeckoMarkets() {
  const allCoins = [];
  // Fetch 2 pages of 100 (top 200)
  for (let page = 1; page <= 2; page++) {
    const url = `http://localhost:${port}/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page}&sparkline=true&price_change_percentage=24h`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          allCoins.push(...data);
        }
      } else {
        console.error(`[Telegram] CoinGecko page ${page} returned ${res.status}`);
      }
    } catch (err) {
      console.error(`[Telegram] CoinGecko fetch error page ${page}:`, err.message);
    }
    // Small delay between pages to avoid rate limit
    if (page < 2) await new Promise(r => setTimeout(r, 1500));
  }
  return allCoins;
}

// ─── Alert checking logic — CoinGecko-based, same as /trades page ───
async function checkAndSendAlerts() {
  const config = loadTelegramAlerts();
  if (!config.enabled) return [];

  const sentAlerts = [];
  const now = new Date();
  const nowStr = now.toLocaleString('fr-CA', { timeZone: 'America/Montreal' });
  const cooldowns = loadCooldowns();

  try {
    console.log(`[Telegram] 📡 Fetching CoinGecko market data...`);
    const coins = await fetchCoinGeckoMarkets();
    console.log(`[Telegram] Received ${coins.length} coins from CoinGecko`);

    if (coins.length === 0) {
      console.error('[Telegram] No coins received from CoinGecko, skipping alert check');
      return [];
    }

    // v6: Max 10 active trade calls limit
    const MAX_ACTIVE_TRADE_CALLS = 10;
    const currentTradeCalls = loadTradeCalls();
    const activeTradeCallCount = currentTradeCalls.filter(c => c.status === 'active').length;
    if (activeTradeCallCount >= MAX_ACTIVE_TRADE_CALLS) {
      console.log(`[Telegram] ⛔ Max active trade calls reached (${activeTradeCallCount}/${MAX_ACTIVE_TRADE_CALLS}) — skipping new signals`);
      return [];
    }
    const remainingTradeSlots = MAX_ACTIVE_TRADE_CALLS - activeTradeCallCount;
    console.log(`[Telegram] Active trade calls: ${activeTradeCallCount}/${MAX_ACTIVE_TRADE_CALLS} — ${remainingTradeSlots} slots available`);

    // Generate setups using same logic as /trades page (now async with Binance 4H confirmation)
    const allSetups = await generateRealSetups(coins);
    console.log(`[Telegram] Generated ${allSetups.length} trade setups`);

    // Deduplicate: keep only the highest-confidence setup per coin
    const seenCoins = new Map();
    for (const setup of allSetups) {
      const existing = seenCoins.get(setup.id);
      if (!existing || setup.confidence > existing.confidence) {
        seenCoins.set(setup.id, setup);
      }
    }
    const dedupedSetups = Array.from(seenCoins.values());
    console.log(`[Telegram] After dedup: ${dedupedSetups.length} unique coin setups`);

    // Apply Daily (1D) EMA8/EMA20 trend filter to each setup
    console.log(`[Telegram] 📊 Applying Daily trend filter to ${dedupedSetups.length} setups...`);
    const setups = [];
    const D1_BATCH_SIZE = 5;
    for (let i = 0; i < dedupedSetups.length; i += D1_BATCH_SIZE) {
      const batch = dedupedSetups.slice(i, i + D1_BATCH_SIZE);
      const filtered = await Promise.all(batch.map(s => applyDailyFilterToSwingSetup(s)));
      for (const s of filtered) {
        if (s) setups.push(s);
      }
      if (i + D1_BATCH_SIZE < dedupedSetups.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // Debug: log confidences after Daily filter
    if (setups.length > 0) {
      const confValues = setups.slice(0, 15).map(s => `${s.symbol}:${s.confidence}%${s.side}(D1:${s.d1_trend || '?'})`);
      console.log(`[Telegram] After Daily filter confidences: ${confValues.join(", ")}`);
    }

    // v6: Raised MIN_CONFIDENCE to 70 (post-Daily-filter + Binance 4H confirmation)
    const MIN_CONFIDENCE = 80;
    const qualifiedSetups = setups.filter(s => s.confidence >= MIN_CONFIDENCE);
    console.log(`[Telegram] After confidence filter (>=${MIN_CONFIDENCE}%): ${qualifiedSetups.length} setups`);

    // Send alerts for each qualified setup (respecting per-crypto cooldowns + slot limit)
    let sentCount = 0;
    for (const setup of qualifiedSetups) {
      // v6: Respect remaining trade call slots
      if (sentCount >= remainingTradeSlots) {
        console.log(`[Telegram] ⛔ Trade call slots exhausted (${sentCount}/${remainingTradeSlots}), stopping`);
        break;
      }

      // v6: 12-hour swing cooldown per symbol+side (using existing cooldown system with 12h TTL)
      if (isCooldownActive(cooldowns, setup.id, setup.side)) {
        continue;
      }

      // Build Telegram message matching /trades card format
      const dirEmoji = setup.side === 'LONG' ? '🟢 LONG' : '🔴 SHORT';
      const confEmoji = setup.confidence >= 80 ? '🔥' : setup.confidence >= 50 ? '⚡' : '📊';

      // TP/SL percentages
      const pctTP1 = ((setup.tp1 - setup.entry) / setup.entry * 100);
      const pctTP2 = ((setup.tp2 - setup.entry) / setup.entry * 100);
      const pctTP3 = ((setup.tp3 - setup.entry) / setup.entry * 100);
      const pctSL = ((setup.stopLoss - setup.entry) / setup.entry * 100);

      // Build S/R section
      let srSection = '';
      if (setup.resistances.length > 0) {
        for (let i = setup.resistances.length - 1; i >= 0; i--) {
          const r = setup.resistances[i];
          srSection += `├ R${i + 1} (${r.source}) : <b>$${formatPrice(r.price)}</b> ${r.strength === 'major' ? '🔴' : '⚪'}\n`;
        }
      }
      srSection += `├ ── Entry : <b>$${formatPrice(setup.entry)}</b> ──\n`;
      if (setup.supports.length > 0) {
        for (let i = 0; i < setup.supports.length; i++) {
          const s = setup.supports[i];
          const prefix = i === setup.supports.length - 1 ? '└' : '├';
          srSection += `${prefix} S${i + 1} (${s.source}) : <b>$${formatPrice(s.price)}</b> ${s.strength === 'major' ? '🟢' : '⚪'}\n`;
        }
      } else {
        srSection += `└ (aucun support identifié)\n`;
      }

      // Daily trend display
      const d1TrendEmoji = setup.d1_trend === 'bullish' ? '🟢 Haussière' : setup.d1_trend === 'bearish' ? '🔴 Baissière' : '⚪ Neutre';
      const d1Info = setup.ema8_d1 != null ? ` (EMA8: $${formatPrice(setup.ema8_d1)}, EMA20: $${formatPrice(setup.ema20_d1)})` : '';

      const text = `🔵🔵🔵 <b>🔄 SWING TRADING — SIGNAL CRYPTO</b> 🔵🔵🔵
🌐 https://CryptoIA.ca
📊 Entry sur le timeframe <b>H1</b> | Analyse : <b>CoinGecko 24h</b> + <b>S/R 7j</b> + <b>Confirmation H1</b>
━━━━━━━━━━━━━━━━━━━━━

${dirEmoji} — <b>${setup.name}</b> (${setup.symbol})

🎯 <b>Plan de Trade :</b>
├ Entry : <b>$${formatPrice(setup.entry)}</b>
├ TP1 : <b>$${formatPrice(setup.tp1)}</b> (${pctTP1 >= 0 ? '+' : ''}${pctTP1.toFixed(2)}%)
├ TP2 : <b>$${formatPrice(setup.tp2)}</b> (${pctTP2 >= 0 ? '+' : ''}${pctTP2.toFixed(2)}%)
├ TP3 : <b>$${formatPrice(setup.tp3)}</b> (${pctTP3 >= 0 ? '+' : ''}${pctTP3.toFixed(2)}%)
└ SL : <b>$${formatPrice(setup.stopLoss)}</b> (${pctSL >= 0 ? '+' : ''}${pctSL.toFixed(2)}%)

💰 <b>Gestion :</b> sortir <b>40% au TP1</b>, <b>30% au TP2</b>, laisser courir 30% → TP3 (SL au breakeven après TP1)

📐 <b>Supports &amp; Résistances :</b>
${srSection}
📊 Tendance Daily : ${d1TrendEmoji}${d1Info}

⚖️ Risk/Reward : <b>1:${setup.rr}</b>
📈 24h : <b>${setup.change24h >= 0 ? '+' : ''}${setup.change24h.toFixed(2)}%</b>
🧠 Confiance : <b>${setup.confidence}%</b>

📋 <b>Raison :</b>
<i>${(setup.reason || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</i>

⏰ ${setup.triggerTime} — ${nowStr} (Montréal)
⚠️ <i>Ceci n'est pas un conseil financier. DYOR.</i>`;

      const result = await sendTelegramMessage(text);
      if (result.ok) {
        // v7: record the signal server-side for public performance tracking
        try {
          await fetch(`http://127.0.0.1:${port}/api/v1/trade-calls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol: setup.symbol,
              side: setup.side,
              entry_price: setup.entry,
              stop_loss: setup.stopLoss,
              tp1: setup.tp1,
              tp2: setup.tp2,
              tp3: setup.tp3,
              confidence: setup.confidence,
              reason: setup.reason,
              rsi4h: setup.rsi4h,
              has_convergence: !!setup.hasConvergence,
              rr: setup.rr,
              engine: 'v8',
            }),
          });
          console.log(`[Telegram] 📊 Trade call recorded for ${setup.symbol} ${setup.side}`);
        } catch (e) {
          console.error(`[Telegram] Trade call record failed: ${e.message}`);
        }

        // Send branding image after the alert message
        // Photo removed per user request

        // Set cooldown IMMEDIATELY in memory + file to prevent duplicates
        setCooldown(cooldowns, setup.id, setup.side);
        saveCooldowns(cooldowns);

        sentAlerts.push({
          type: 'coingecko_signal',
          coin: setup.id,
          direction: setup.side,
          rr: setup.rr,
          entry: setup.entry,
          tp1: setup.tp1,
          tp2: setup.tp2,
          tp3: setup.tp3,
          sl: setup.stopLoss,
          confidence: setup.confidence,
        });
        sentCount++;
        console.log(`[Telegram] ✅ Sent ${setup.side} signal for ${setup.name} (confidence: ${setup.confidence}%, slot ${sentCount}/${remainingTradeSlots})`);

        // Small delay between messages to avoid Telegram rate limit
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // Update last check
    config.lastCheck = now.toISOString();
    config.lastAlerts = sentAlerts;
    saveTelegramAlerts(config);

  } catch (err) {
    console.error('Alert check error:', err);
  }

  return sentAlerts;
}

// ─── Periodic alert checker (every 5 minutes) ───
let alertInterval = null;

function startAlertChecker() {
  const config = loadTelegramAlerts();
  if (alertInterval) clearInterval(alertInterval);
  if (config.enabled) {
    const interval = config.checkIntervalMs || 300000;
    console.log(`[Telegram] Alert checker started — checking every ${interval / 1000}s`);
    alertInterval = setInterval(async () => {
      console.log('[Telegram] Running periodic alert check...');
      const alerts = await checkAndSendAlerts();
      if (alerts.length > 0) {
        console.log(`[Telegram] Sent ${alerts.length} alerts`);
      }
    }, interval);
    // Also run immediately on start
    checkAndSendAlerts().then(alerts => {
      if (alerts.length > 0) console.log(`[Telegram] Initial check sent ${alerts.length} alerts`);
    });
  }
}


  function stopAlertChecker() {
    if (alertInterval) {
      clearInterval(alertInterval);
      alertInterval = null;
      console.log('[Telegram] Alert checker stopped');
    }
  }

  return { initCooldownsFromFile, checkAndSendAlerts, startAlertChecker, stopAlertChecker, generateRealSetups };
}
