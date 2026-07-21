// Range signal engine (extracted from server.js — Session 45, refactor phase 3).
// Bollinger Bands + RSI + ADX M15 range setups, Telegram alerts, scheduler.
// Range-calls persistence stays in server.js (resolver + API endpoints use it).
import path from 'path';
import fs from 'fs';
import {
  calcEMA, calcRSI, calcBollingerBands, calcADX, fetchBinanceKlines, fetchTop200USDTSymbols,
  formatPrice, roundPrice,
} from './signal_primitives.js';

export function createRangeEngine(deps) {
  const {
    dataDir, loadTelegramAlerts, sendTelegramMessage,
    loadRangeCalls, saveRangeCalls, allocateRangeCallId,
  } = deps;

const RANGE_COOLDOWN_MS = 60 * 60 * 1000; // 60 minutes cooldown for range
const RANGE_COOLDOWNS_FILE = path.join(dataDir, 'range_cooldowns.json');
const inMemoryRangeCooldowns = new Map();

function loadRangeCooldowns() {
  try {
    if (fs.existsSync(RANGE_COOLDOWNS_FILE)) {
      return JSON.parse(fs.readFileSync(RANGE_COOLDOWNS_FILE, 'utf8'));
    }
  } catch (_e) { /* ignore */ }
  return {};
}

function saveRangeCooldowns(cooldowns) {
  try {
    fs.writeFileSync(RANGE_COOLDOWNS_FILE, JSON.stringify(cooldowns, null, 2));
  } catch (err) {
    console.error('[RangeAlert] Error saving cooldowns:', err);
  }
}

function isRangeCooldownActive(cooldowns, symbol, direction) {
  const now = Date.now();
  const memKey = `${symbol}_${direction}`;
  const memTs = inMemoryRangeCooldowns.get(memKey);
  if (memTs && (now - memTs) < RANGE_COOLDOWN_MS) return true;
  const fileEntry = cooldowns[memKey];
  if (fileEntry) {
    const elapsed = now - new Date(fileEntry.timestamp).getTime();
    if (elapsed < RANGE_COOLDOWN_MS && fileEntry.direction === direction) {
      inMemoryRangeCooldowns.set(memKey, new Date(fileEntry.timestamp).getTime());
      return true;
    }
  }
  return false;
}

function setRangeCooldown(cooldowns, symbol, direction) {
  const now = Date.now();
  const memKey = `${symbol}_${direction}`;
  inMemoryRangeCooldowns.set(memKey, now);
  cooldowns[memKey] = { timestamp: new Date(now).toISOString(), direction };
}

// Initialize range cooldowns from file on boot
(function initRangeCooldownsFromFile() {
  const cooldowns = loadRangeCooldowns();
  const now = Date.now();
  for (const [key, entry] of Object.entries(cooldowns)) {
    if (entry && entry.timestamp) {
      const elapsed = now - new Date(entry.timestamp).getTime();
      if (elapsed < RANGE_COOLDOWN_MS) {
        inMemoryRangeCooldowns.set(key, new Date(entry.timestamp).getTime());
      }
    }
  }
  console.log(`[RangeAlert] Loaded ${inMemoryRangeCooldowns.size} active range cooldowns from file`);
})();


// ─── Generate Range Setup for a single symbol ───
// v2 (backtest 30-60j/50 symboles) : entrée sur RÉINTÉGRATION des bandes de Bollinger
// (bougie précédente perce la bande, bougie courante clôture à l'intérieur avec renversement),
// filtre band-walking, rejet contre-tendance H1, SL large (0.5×range BB), scoring recalibré
// sur les facteurs empiriquement prédictifs (H1 aligné, BB large, ADX bas, RSI qui tourne).
async function generateRangeSetup(symbol) {
  // Fetch M15 candles (100 candles = ~25h of data)
  const m15Candles = await fetchBinanceKlines(symbol, '15m', 100);
  if (m15Candles.length < 30) return null;

  // Fetch H1 candles for bias
  const h1Candles = await fetchBinanceKlines(symbol, '1h', 50);
  if (h1Candles.length < 25) return null;

  const m15Closes = m15Candles.map(c => c.close);
  const h1Closes = h1Candles.map(c => c.close);
  const currentPrice = m15Closes[m15Closes.length - 1];

  // ─── ADX on M15 — must be < 25 to confirm range ───
  const adxM15 = calcADX(m15Candles, 14);
  if (adxM15 === null || adxM15 >= 25) {
    return null; // Not in a range — trending market
  }

  // ─── Bollinger Bands on M15 (20, 2) ───
  const bb = calcBollingerBands(m15Closes, 20, 2);
  if (!bb || bb.sma.length < 8) return null;
  const bbLen = bb.sma.length;
  const bbUpper = bb.upper[bbLen - 1];
  const bbMiddle = bb.sma[bbLen - 1];
  const bbLower = bb.lower[bbLen - 1];
  const bbWidth = (bbUpper - bbLower) / bbMiddle;

  // v2: BB width min 2% — en dessous, le TP1 (mi-bande) ne couvre pas les frais
  if (bbWidth < 0.02) return null;

  // ─── RSI(14) on M15 ───
  const rsiArr = calcRSI(m15Closes, 14);
  const rsiM15 = rsiArr[rsiArr.length - 1];
  const rsiPrev = rsiArr[rsiArr.length - 2];

  // ─── H1 EMA 8 & EMA 20 for bias ───
  const h1Ema8 = calcEMA(h1Closes, 8);
  const h1Ema20 = calcEMA(h1Closes, 20);
  const h1Ema8Val = h1Ema8[h1Ema8.length - 1];
  const h1Ema20Val = h1Ema20[h1Ema20.length - 1];

  let h1Trend = 'neutral';
  const h1Spread = Math.abs(h1Ema8Val - h1Ema20Val) / h1Ema20Val;
  if (h1Spread < 0.002) h1Trend = 'neutral';
  else if (h1Ema8Val > h1Ema20Val) h1Trend = 'bullish';
  else h1Trend = 'bearish';

  // ─── v2: détection de RÉINTÉGRATION des bandes ───
  const lastCandle = m15Candles[m15Candles.length - 1];
  const prevCandle = m15Candles[m15Candles.length - 2];
  const bbLowerPrev = bb.lower[bbLen - 2];
  const bbUpperPrev = bb.upper[bbLen - 2];

  const reentryLong = (prevCandle.close < bbLowerPrev || prevCandle.low < bbLowerPrev)
    && lastCandle.close > bbLower && lastCandle.close > lastCandle.open;
  const reentryShort = (prevCandle.close > bbUpperPrev || prevCandle.high > bbUpperPrev)
    && lastCandle.close < bbUpper && lastCandle.close < lastCandle.open;

  // v2: filtre band-walking — si >2 des 6 dernières clôtures sont hors bande, c'est une tendance
  let walksBelow = 0, walksAbove = 0;
  for (let k = 2; k <= 7 && bbLen - k >= 0; k++) {
    const closeK = m15Closes[m15Closes.length - k];
    if (closeK < bb.lower[bbLen - k]) walksBelow++;
    if (closeK > bb.upper[bbLen - k]) walksAbove++;
  }

  let side = null;
  let confidence = 0;
  const reasons = [];

  if (reentryLong && rsiM15 < 40) {
    if (walksBelow > 2) return null; // band-walking baissier
    if (h1Trend === 'bearish') return null; // v2: jamais contre la tendance H1
    side = 'LONG';
    reasons.push(`Réintégration BB inférieure ($${formatPrice(bbLower)}) — rejet confirmé`);
    reasons.push(`RSI M15: ${rsiM15.toFixed(1)}`);
  } else if (reentryShort && rsiM15 > 60) {
    if (walksAbove > 2) return null; // band-walking haussier
    if (h1Trend === 'bullish') return null;
    side = 'SHORT';
    reasons.push(`Réintégration BB supérieure ($${formatPrice(bbUpper)}) — rejet confirmé`);
    reasons.push(`RSI M15: ${rsiM15.toFixed(1)}`);
  }

  if (!side) return null;

  // ─── v2: scoring recalibré (backtest : facteurs réellement prédictifs) ───
  confidence = 58;
  const h1Aligned = (side === 'LONG' && h1Trend === 'bullish') || (side === 'SHORT' && h1Trend === 'bearish');
  if (h1Aligned) { confidence += 12; reasons.push('H1 alignée avec le trade'); }
  if (bbWidth > 0.03) { confidence += 7; reasons.push('BB large — bon potentiel de profit'); }
  if (adxM15 < 15) { confidence += 8; reasons.push(`ADX très bas (${adxM15.toFixed(1)}) — range fort`); }
  else if (adxM15 < 20) { confidence += 4; reasons.push(`ADX bas (${adxM15.toFixed(1)}) — range confirmé`); }
  else { reasons.push(`ADX: ${adxM15.toFixed(1)}`); }
  const rsiTurning = side === 'LONG' ? rsiM15 > rsiPrev : rsiM15 < rsiPrev;
  if (rsiTurning) { confidence += 6; reasons.push('RSI en retournement'); }
  confidence = Math.min(97, confidence);

  // ─── SL / TP Calculation — v2: SL large (0.5×range BB, borné 0.5-1.5%) ───
  let stopLoss, tp1, tp2;
  const bbRange = bbUpper - bbLower;
  const slBuffer = Math.max(currentPrice * 0.005, Math.min(currentPrice * 0.015, bbRange * 0.5));

  if (side === 'LONG') {
    stopLoss = bbLower - slBuffer;
    tp1 = bbMiddle;
    tp2 = bbUpper * 0.998; // Slightly inside upper BB
  } else {
    stopLoss = bbUpper + slBuffer;
    tp1 = bbMiddle;
    tp2 = bbLower * 1.002; // Slightly inside lower BB
  }

  const slDist = Math.abs(currentPrice - stopLoss);
  const tp1Dist = Math.abs(tp1 - currentPrice);
  const rr = slDist > 0 ? Math.round((tp1Dist / slDist) * 10) / 10 : 1;

  // Skip if R:R is too low
  if (rr < 0.8) return null;

  return {
    symbol,
    name: symbol.replace('USDT', ''),
    side,
    entry: currentPrice,
    stopLoss: roundPrice(stopLoss, currentPrice),
    tp1: roundPrice(tp1, currentPrice),
    tp2: roundPrice(tp2, currentPrice),
    rr,
    confidence,
    reason: reasons.join(' | '),
    rsi_m15: rsiM15,
    adx_m15: adxM15,
    bb_upper: bbUpper,
    bb_middle: bbMiddle,
    bb_lower: bbLower,
    bb_width: bbWidth,
    ema8_h1: h1Ema8Val,
    ema20_h1: h1Ema20Val,
    h1_trend: h1Trend,
    currentPrice,
  };
}

// ─── Check and send Range alerts ───
async function checkAndSendRangeAlerts() {
  const config = loadTelegramAlerts();
  if (!config.enabled) return [];

  const sentAlerts = [];
  const now = new Date();
  const nowStr = now.toLocaleString('fr-CA', { timeZone: 'America/Montreal' });
  const cooldowns = loadRangeCooldowns();

  try {
    // Use same dynamic symbol list as scalp
    const symbols = await fetchTop200USDTSymbols();
    console.log(`[RangeAlert] 📡 Analyzing ${symbols.length} symbols for range setups...`);

    const setups = [];
    const BATCH_SIZE = 10;
    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(sym => generateRangeSetup(sym)));
      for (const setup of results) {
        if (setup) setups.push(setup);
      }
      if (i + BATCH_SIZE < symbols.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`[RangeAlert] Generated ${setups.length} range setups`);
    if (setups.length > 0) {
      const confValues = setups.map(s => `${s.symbol}:${s.confidence}%${s.side}`);
      console.log(`[RangeAlert] Setup confidences: ${confValues.join(', ')}`);
    }

    const MIN_CONFIDENCE = 80;
    const qualifiedSetups = setups.filter(s => s.confidence >= MIN_CONFIDENCE);
    console.log(`[RangeAlert] After confidence filter (>=${MIN_CONFIDENCE}%): ${qualifiedSetups.length} setups`);

    qualifiedSetups.sort((a, b) => b.confidence - a.confidence);

    const MAX_ACTIVE_RANGE_CALLS = 10;
    const currentRangeCalls = loadRangeCalls();
    const activeRangeCallCount = currentRangeCalls.filter(c => c.status === 'active').length;
    if (activeRangeCallCount >= MAX_ACTIVE_RANGE_CALLS) {
      console.log(`[RangeAlert] ⛔ Max active range calls reached (${activeRangeCallCount}/${MAX_ACTIVE_RANGE_CALLS})`);
      return sentAlerts;
    }
    const remainingSlots = MAX_ACTIVE_RANGE_CALLS - activeRangeCallCount;

    for (let idx = 0; idx < qualifiedSetups.length && sentAlerts.length < remainingSlots; idx++) {
      const setup = qualifiedSetups[idx];
      try {
        if (isRangeCooldownActive(cooldowns, setup.symbol, setup.side)) {
          continue;
        }

        const dirEmoji = setup.side === 'LONG' ? '🟢 LONG' : '🔴 SHORT';
        const pctTP1 = ((setup.tp1 - setup.entry) / setup.entry * 100);
        const pctTP2 = ((setup.tp2 - setup.entry) / setup.entry * 100);
        const pctSL = ((setup.stopLoss - setup.entry) / setup.entry * 100);

        const h1TrendEmoji = setup.h1_trend === 'bullish' ? '🟢 Haussière' : setup.h1_trend === 'bearish' ? '🔴 Baissière' : '⚪ Neutre';
        const safeReason = (setup.reason || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const text = `🔵🔵🔵 <b>📊 RANGE TRADING — SIGNAL CRYPTO</b> 🔵🔵🔵
🌐 https://CryptoIA.ca
📊 Entry sur le timeframe <b>M15</b> | Biais : <b>H1</b> | Stratégie : <b>Réintégration Bollinger + RSI + ADX</b> | Plan : <b>sortie 50% au TP1, 50% vers TP2 (SL→BE)</b>
━━━━━━━━━━━━━━━━━━━━━

${dirEmoji} — <b>${setup.name}</b> (${setup.symbol})

📐 <b>Indicateurs :</b>
├ BB Supérieure : <b>$${formatPrice(setup.bb_upper)}</b>
├ BB Médiane : <b>$${formatPrice(setup.bb_middle)}</b>
├ BB Inférieure : <b>$${formatPrice(setup.bb_lower)}</b>
├ BB Width : <b>${(setup.bb_width * 100).toFixed(2)}%</b>
├ RSI M15 : <b>${setup.rsi_m15.toFixed(1)}</b>
├ ADX M15 : <b>${setup.adx_m15.toFixed(1)}</b> (Range confirmé < 25)
├ Tendance H1 : ${h1TrendEmoji}
└ EMA H1 : 8=${setup.ema8_h1 ? '$' + formatPrice(setup.ema8_h1) : 'N/A'} / 20=${setup.ema20_h1 ? '$' + formatPrice(setup.ema20_h1) : 'N/A'}

🎯 <b>Plan de Trade :</b>
├ Entry : <b>$${formatPrice(setup.entry)}</b>
├ TP1 (BB Mid) : <b>$${formatPrice(setup.tp1)}</b> (${pctTP1 >= 0 ? '+' : ''}${pctTP1.toFixed(2)}%)
├ TP2 (BB Opp) : <b>$${formatPrice(setup.tp2)}</b> (${pctTP2 >= 0 ? '+' : ''}${pctTP2.toFixed(2)}%)
└ SL : <b>$${formatPrice(setup.stopLoss)}</b> (${pctSL >= 0 ? '+' : ''}${pctSL.toFixed(2)}%)

⚖️ Risk/Reward : <b>1:${setup.rr}</b>
🧠 Confiance : <b>${setup.confidence}%</b>

📋 <b>Raison :</b>
<i>${safeReason}</i>

⏰ Timeframe : M15 — ${nowStr} (Montréal)
⚠️ <i>Range trade — Ceci n'est pas un conseil financier. DYOR.</i>`;

        // v8: register the call FIRST (decoupled from Telegram delivery) so /range always has data
        setRangeCooldown(cooldowns, setup.symbol, setup.side);
        saveRangeCooldowns(cooldowns);

        {
          const newRangeCallId = allocateRangeCallId();
          const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000); // v2: 8h expiry (backtest : la réversion vers la mi-bande prend 4-8h)
          const calls = loadRangeCalls();
          calls.push({
            id: newRangeCallId,
            symbol: setup.symbol, side: setup.side,
            entry_price: setup.entry, stop_loss: setup.stopLoss,
            trailing_sl: setup.stopLoss,
            tp1: setup.tp1, tp2: setup.tp2,
            confidence: setup.confidence, reason: setup.reason,
            rsi_m15: setup.rsi_m15, adx_m15: setup.adx_m15,
            bb_upper: setup.bb_upper, bb_middle: setup.bb_middle, bb_lower: setup.bb_lower,
            bb_width: setup.bb_width,
            ema8_h1: setup.ema8_h1, ema20_h1: setup.ema20_h1,
            h1_trend: setup.h1_trend,
            rr: setup.rr, status: 'active',
            tp1_hit: false, tp2_hit: false, sl_hit: false,
            best_tp_reached: 0, exit_price: null, profit_pct: null,
            created_at: now.toISOString(), resolved_at: null,
            expires_at: expiresAt.toISOString(),
          });
          saveRangeCalls(calls);
        }

        sentAlerts.push({
          type: 'range_signal', symbol: setup.symbol,
          direction: setup.side, rr: setup.rr,
          entry: setup.entry, confidence: setup.confidence,
        });
        console.log(`[RangeAlert] ✅ Registered ${setup.side} range call for ${setup.name} (confidence: ${setup.confidence}%)`);

        const result = await sendTelegramMessage(text);
        if (result.ok) {
          console.log(`[RangeAlert] 📨 Telegram alert sent for ${setup.symbol}`);
          await new Promise(r => setTimeout(r, 2000));
        } else {
          console.error(`[RangeAlert] ⚠️ Telegram send failed for ${setup.symbol} (call still registered)`);
        }
      } catch (sendErr) {
        console.error(`[RangeAlert] ❌ Exception sending ${setup.symbol}:`, sendErr.message || sendErr);
      }
    }
  } catch (err) {
    console.error('[RangeAlert] Check error:', err);
  }

  return sentAlerts;
}

// ─── Periodic range alert checker (every 5 minutes) ───
let rangeAlertInterval = null;

function startRangeAlertChecker() {
  const config = loadTelegramAlerts();
  if (rangeAlertInterval) clearInterval(rangeAlertInterval);
  if (config.enabled) {
    const interval = 5 * 60 * 1000;
    console.log(`[RangeAlert] Range alert checker started — checking every ${interval / 1000}s`);
    rangeAlertInterval = setInterval(async () => {
      console.log('[RangeAlert] Running periodic range alert check...');
      const alerts = await checkAndSendRangeAlerts();
      if (alerts.length > 0) {
        console.log(`[RangeAlert] Sent ${alerts.length} range alerts`);
      }
    }, interval);
    // Run initial check after 60s delay
    setTimeout(() => {
      checkAndSendRangeAlerts().then(alerts => {
        if (alerts.length > 0) console.log(`[RangeAlert] Initial check sent ${alerts.length} range alerts`);
      });
    }, 60000);
  }
}

// Defer range checker startup to AFTER server is listening (see app.listen at EOF)
// startRangeAlertChecker() is now called inside app.listen callback


  function stopRangeAlertChecker() {
    if (rangeAlertInterval) {
      clearInterval(rangeAlertInterval);
      rangeAlertInterval = null;
      console.log('[RangeAlert] Range alert checker stopped');
    }
  }

  function registerRoutes(app) {
    app.post('/api/telegram/range-check', async (req, res) => {
      try {
        const alerts = await checkAndSendRangeAlerts();
        res.json({ success: true, alerts_sent: alerts.length, alerts });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    app.post('/api/telegram/range-toggle', (req, res) => {
      const { enabled } = req.body;
      if (enabled) startRangeAlertChecker();
      else stopRangeAlertChecker();
      res.json({ success: true, range_alerts_enabled: !!enabled });
    });
  }

  return { generateRangeSetup, checkAndSendRangeAlerts, startRangeAlertChecker, stopRangeAlertChecker, registerRoutes };
}
