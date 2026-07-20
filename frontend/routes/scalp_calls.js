// Scalp Trading Calls — persistence, API endpoints, resolver + scheduler
// Extracted from server.js (Session 47)
import path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fetchPricesForSymbols } from '../lib/market_sources.js';
import { getWeekNumber } from '../lib/signal_primitives.js';

export function registerScalpCallRoutes(app, { dataDir }) {
  const SCALP_CALLS_FILE = path.join(dataDir, 'scalp_calls.json');

  function loadScalpCalls() {
    try {
      if (existsSync(SCALP_CALLS_FILE)) {
        return JSON.parse(readFileSync(SCALP_CALLS_FILE, 'utf-8'));
      }
    } catch (err) {
      console.error('Error loading scalp calls:', err);
    }
    return [];
  }

  function saveScalpCalls(calls) {
    try {
      writeFileSync(SCALP_CALLS_FILE, JSON.stringify(calls, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving scalp calls:', err);
    }
  }

  let scalpCallIdCounter = 0;
  try {
    const existingScalpCalls = loadScalpCalls();
    if (existingScalpCalls.length > 0) {
      scalpCallIdCounter = Math.max(...existingScalpCalls.map(c => c.id || 0));
    }
  } catch (_e) { /* ignore */ }

  // ─── POST /api/v1/scalp-calls — Record a new scalp call ───
  app.post('/api/v1/scalp-calls', (req, res) => {
    const { symbol, side, entry_price, stop_loss, tp1, tp2, tp3, confidence, reason, stoch_k, stoch_d, ema8_m5, ema20_m5, vwap_m5, vwap_h1, h1_trend, rr } = req.body;

    if (!symbol || !side || !entry_price) {
      return res.status(400).json({ created: false, message: 'symbol, side, entry_price requis' });
    }

    const calls = loadScalpCalls();
    const cutoff = Date.now() - 30 * 60 * 1000; // v3: 30min dedup for scalp

    const dup = calls.find(c =>
      c.symbol === symbol &&
      c.side === side &&
      new Date(c.created_at).getTime() >= cutoff
    );

    if (dup) {
      return res.json({ created: false, message: 'Duplicate scalp call', id: dup.id });
    }

    scalpCallIdCounter++;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // v3: 30min expiry for scalp

    const newCall = {
      id: scalpCallIdCounter,
      symbol, side, entry_price, stop_loss, tp1, tp2, tp3, confidence,
      reason: reason || '',
      stoch_k: stoch_k || null,
      stoch_d: stoch_d || null,
      ema8_m5: ema8_m5 || null,
      ema20_m5: ema20_m5 || null,
      vwap_m5: vwap_m5 || null,
      vwap_h1: vwap_h1 || null,
      h1_trend: h1_trend || 'neutral',
      rr: rr || null,
      status: 'active',
      trailing_sl: stop_loss, // Initially same as stop_loss, updated when TP1/TP2 hit
      tp1_hit: false, tp2_hit: false, tp3_hit: false, sl_hit: false,
      best_tp_reached: 0,
      exit_price: null, profit_pct: null,
      created_at: now.toISOString(),
      resolved_at: null,
      expires_at: expiresAt.toISOString(),
    };

    calls.push(newCall);
    saveScalpCalls(calls);
    console.log(`[ScalpCall] Created #${newCall.id}: ${symbol} ${side} @ ${entry_price}`);
    res.json({ created: true, id: newCall.id });
  });

  // ─── GET /api/v1/scalp-calls — List scalp calls ───
  app.get('/api/v1/scalp-calls', (req, res) => {
    const { status: filterStatus, limit = '100', offset = '0' } = req.query;
    let calls = loadScalpCalls();
    if (filterStatus) calls = calls.filter(c => c.status === filterStatus);
    calls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const lim = Math.min(parseInt(limit) || 100, 500);
    const off = parseInt(offset) || 0;
    res.json(calls.slice(off, off + lim));
  });

  // ─── GET /api/v1/scalp-calls/stats — Performance statistics ───
  app.get('/api/v1/scalp-calls/stats', (req, res) => {
    const calls = loadScalpCalls();
    const total = calls.length;
    const activeCalls = calls.filter(c => c.status === 'active').length;
    const resolvedCalls = calls.filter(c => c.status === 'resolved').length;
    const expiredCalls = calls.filter(c => c.status === 'expired').length;

    const closedCalls = calls.filter(c => c.status === 'resolved' || c.status === 'expired');
    const totalClosed = closedCalls.length;

    let wins = 0, tp1Hits = 0, tp2Hits = 0, tp3Hits = 0, slHits = 0;
    let longWins = 0, longTotal = 0, shortWins = 0, shortTotal = 0;
    let totalProfit = 0;
    const profits = [];
    const confBuckets = { low: { wins: 0, total: 0 }, mid: { wins: 0, total: 0 }, high: { wins: 0, total: 0 }, very_high: { wins: 0, total: 0 } };
    const weeklyData = {};

    for (const c of closedCalls) {
      // Win = TP1 was hit (trailing stop protects at breakeven, so even if SL hit after TP1, it's a win/breakeven)
      const isWin = c.tp1_hit;
      if (isWin) wins++;
      if (c.tp1_hit) tp1Hits++;
      if (c.tp2_hit) tp2Hits++;
      if (c.tp3_hit) tp3Hits++;
      if (c.sl_hit) slHits++;

      // Profit calculation: if TP1 hit + SL hit → breakeven (0%), not negative
      let effectiveProfit = c.profit_pct;
      if (c.tp1_hit && c.sl_hit && (effectiveProfit == null || effectiveProfit < 0)) {
        effectiveProfit = 0; // Trailing stop protected at breakeven
      }
      if (effectiveProfit != null) { totalProfit += effectiveProfit; profits.push(effectiveProfit); }

      if (c.side === 'LONG') { longTotal++; if (isWin) longWins++; }
      else { shortTotal++; if (isWin) shortWins++; }

      let bucket;
      if (c.confidence < 50) bucket = 'low';
      else if (c.confidence < 65) bucket = 'mid';
      else if (c.confidence < 80) bucket = 'high';
      else bucket = 'very_high';
      confBuckets[bucket].total++;
      if (isWin) confBuckets[bucket].wins++;

      if (c.created_at) {
        const d = new Date(c.created_at);
        const weekNum = getWeekNumber(d);
        const weekKey = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
        if (!weeklyData[weekKey]) weeklyData[weekKey] = { wins: 0, total: 0 };
        weeklyData[weekKey].total++;
        if (isWin) weeklyData[weekKey].wins++;
      }
    }

    const safeRate = (w, t) => t > 0 ? Math.round(w / t * 1000) / 10 : 0;
    const winRate = safeRate(wins, totalClosed);
    const avgProfit = profits.length > 0 ? Math.round(totalProfit / profits.length * 100) / 100 : 0;

    const weeklySorted = Object.keys(weeklyData).sort().map(wk => ({
      week: wk, wins: weeklyData[wk].wins, total: weeklyData[wk].total,
      win_rate: safeRate(weeklyData[wk].wins, weeklyData[wk].total),
    }));

    res.json({
      total_calls: total, active_calls: activeCalls, resolved_calls: resolvedCalls, expired_calls: expiredCalls,
      win_rate: winRate,
      tp1_rate: safeRate(tp1Hits, totalClosed), tp2_rate: safeRate(tp2Hits, totalClosed),
      tp3_rate: safeRate(tp3Hits, totalClosed), sl_rate: safeRate(slHits, totalClosed),
      avg_profit_pct: avgProfit,
      long_win_rate: safeRate(longWins, longTotal), short_win_rate: safeRate(shortWins, shortTotal),
      long_total: longTotal, short_total: shortTotal,
      confidence_buckets: {
        '<50%': { win_rate: safeRate(confBuckets.low.wins, confBuckets.low.total), total: confBuckets.low.total },
        '50-65%': { win_rate: safeRate(confBuckets.mid.wins, confBuckets.mid.total), total: confBuckets.mid.total },
        '65-80%': { win_rate: safeRate(confBuckets.high.wins, confBuckets.high.total), total: confBuckets.high.total },
        '>80%': { win_rate: safeRate(confBuckets.very_high.wins, confBuckets.very_high.total), total: confBuckets.very_high.total },
      },
      weekly_win_rate: weeklySorted,
    });
  });

  // ─── POST /api/v1/scalp-calls/reset — Reset all scalp calls ───
  app.post('/api/v1/scalp-calls/reset', (req, res) => {
    const { confirm } = req.body || {};
    if (!confirm) {
      return res.status(400).json({ error: 'Missing { "confirm": true } in request body' });
    }
    try {
      saveScalpCalls([]);
      scalpCallIdCounter = 0;
      console.log('[ScalpCall] All scalp calls have been reset');
      res.json({ reset: true, message: 'Toutes les données de performance scalp ont été réinitialisées.' });
    } catch (err) {
      console.error('[ScalpCall] Reset error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── POST /api/v1/scalp-calls/resolve — Check active scalp calls vs Binance ───
  app.post('/api/v1/scalp-calls/resolve', async (req, res) => {
    try {
      const result = await resolveActiveScalpCalls();
      res.json(result);
    } catch (err) {
      console.error('[ScalpCall] Resolve error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  async function resolveActiveScalpCalls() {
    const calls = loadScalpCalls();
    const activeCalls = calls.filter(c => c.status === 'active');
    if (activeCalls.length === 0) return { resolved: 0, expired: 0, checked: 0 };

    const symbols = [...new Set(activeCalls.map(c => c.symbol))];
    const prices = await fetchPricesForSymbols(symbols);

    const now = new Date();
    let resolvedCount = 0, expiredCount = 0;

    for (const call of activeCalls) {
      // Check expiry — if expired and TP1 was hit, count as breakeven win
      if (call.expires_at && new Date(call.expires_at) <= now) {
        call.status = 'expired';
        call.resolved_at = now.toISOString();
        if (call.tp1_hit) {
          // TP1 was hit before expiry → trailing stop protected at breakeven
          call.exit_price = call.entry_price;
          call.profit_pct = 0;
        }
        expiredCount++;
        console.log(`[ScalpCall] Call #${call.id} ${call.symbol} expired (tp1_hit: ${call.tp1_hit})`);
        continue;
      }

      const currentPrice = prices[call.symbol];
      if (currentPrice == null) continue;

      if (call.trailing_sl == null) {
        call.trailing_sl = call.stop_loss;
      }

      if (call.side === 'LONG') {
        if (currentPrice >= call.tp1 && !call.tp1_hit) {
          call.tp1_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 1);
          call.trailing_sl = call.entry_price;
          console.log(`[ScalpCall] Call #${call.id} ${call.symbol} LONG TP1 hit — trailing SL moved to breakeven ${call.entry_price}`);
        } else if (currentPrice >= call.tp1) {
          call.best_tp_reached = Math.max(call.best_tp_reached, 1);
        }

        if (currentPrice >= call.tp2 && !call.tp2_hit) {
          call.tp2_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 2);
          call.trailing_sl = call.tp1;
          console.log(`[ScalpCall] Call #${call.id} ${call.symbol} LONG TP2 hit — trailing SL moved to TP1 ${call.tp1}`);
        } else if (currentPrice >= call.tp2) {
          call.best_tp_reached = Math.max(call.best_tp_reached, 2);
        }

        if (currentPrice >= call.tp3) {
          call.tp3_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 3);
          call.status = 'resolved';
          call.exit_price = currentPrice;
          call.profit_pct = Math.round((currentPrice - call.entry_price) / call.entry_price * 10000) / 100;
          call.resolved_at = now.toISOString();
          resolvedCount++;
          console.log(`[ScalpCall] Call #${call.id} ${call.symbol} LONG TP3 hit — resolved +${call.profit_pct}%`);
          continue;
        }

        const effectiveSL = call.trailing_sl != null ? call.trailing_sl : call.stop_loss;
        if (currentPrice <= effectiveSL) {
          call.sl_hit = true;
          call.status = 'resolved';
          call.exit_price = currentPrice;
          // If TP1 was already hit, exit at breakeven (entry) not at current price
          if (call.tp1_hit) {
            call.profit_pct = 0; // Breakeven — trailing stop protected
            call.exit_price = call.entry_price;
          } else {
            call.profit_pct = Math.round((currentPrice - call.entry_price) / call.entry_price * 10000) / 100;
          }
          call.resolved_at = now.toISOString();
          resolvedCount++;
          console.log(`[ScalpCall] Call #${call.id} ${call.symbol} LONG SL hit (trailing: ${effectiveSL}) — ${call.tp1_hit ? 'breakeven' : call.profit_pct + '%'}`);
          continue;
        }
      } else {
        // SHORT
        if (currentPrice <= call.tp1 && !call.tp1_hit) {
          call.tp1_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 1);
          call.trailing_sl = call.entry_price;
          console.log(`[ScalpCall] Call #${call.id} ${call.symbol} SHORT TP1 hit — trailing SL moved to breakeven ${call.entry_price}`);
        } else if (currentPrice <= call.tp1) {
          call.best_tp_reached = Math.max(call.best_tp_reached, 1);
        }

        if (currentPrice <= call.tp2 && !call.tp2_hit) {
          call.tp2_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 2);
          call.trailing_sl = call.tp1;
          console.log(`[ScalpCall] Call #${call.id} ${call.symbol} SHORT TP2 hit — trailing SL moved to TP1 ${call.tp1}`);
        } else if (currentPrice <= call.tp2) {
          call.best_tp_reached = Math.max(call.best_tp_reached, 2);
        }

        if (currentPrice <= call.tp3) {
          call.tp3_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 3);
          call.status = 'resolved';
          call.exit_price = currentPrice;
          call.profit_pct = Math.round((call.entry_price - currentPrice) / call.entry_price * 10000) / 100;
          call.resolved_at = now.toISOString();
          resolvedCount++;
          console.log(`[ScalpCall] Call #${call.id} ${call.symbol} SHORT TP3 hit — resolved +${call.profit_pct}%`);
          continue;
        }

        const effectiveSL = call.trailing_sl != null ? call.trailing_sl : call.stop_loss;
        if (currentPrice >= effectiveSL) {
          call.sl_hit = true;
          call.status = 'resolved';
          call.exit_price = currentPrice;
          if (call.tp1_hit) {
            call.profit_pct = 0; // Breakeven
            call.exit_price = call.entry_price;
          } else {
            call.profit_pct = Math.round((call.entry_price - currentPrice) / call.entry_price * 10000) / 100;
          }
          call.resolved_at = now.toISOString();
          resolvedCount++;
          console.log(`[ScalpCall] Call #${call.id} ${call.symbol} SHORT SL hit (trailing: ${effectiveSL}) — ${call.tp1_hit ? 'breakeven' : call.profit_pct + '%'}`);
          continue;
        }
      }
    }

    saveScalpCalls(calls);
    return { resolved: resolvedCount, expired: expiredCount, checked: activeCalls.length };
  }

  // ─── Periodic scalp call resolver (every 2 min — fast enough for scalp SL/TP checks) ───
  setInterval(async () => {
    try {
      const result = await resolveActiveScalpCalls();
      if (result.resolved > 0 || result.expired > 0) {
        console.log(`[ScalpCall] Periodic: ${result.resolved} resolved, ${result.expired} expired`);
      }
    } catch (err) {
      console.error('[ScalpCall] Periodic error:', err.message);
    }
  }, 2 * 60 * 1000);

  return {
    loadScalpCalls,
    saveScalpCalls,
    allocateScalpCallId: () => ++scalpCallIdCounter,
    resolveActiveScalpCalls,
  };
}
