// Range Trading Calls — persistence, API endpoints, resolver + scheduler
// Extracted from server.js (Session 47)
import path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fetchPricesForSymbols } from '../lib/market_sources.js';
import { getWeekNumber } from '../lib/signal_primitives.js';

export function registerRangeCallRoutes(app, { dataDir }) {
  const RANGE_CALLS_FILE = path.join(dataDir, 'range_calls.json');

  function loadRangeCalls() {
    try {
      if (existsSync(RANGE_CALLS_FILE)) {
        return JSON.parse(readFileSync(RANGE_CALLS_FILE, 'utf-8'));
      }
    } catch (err) {
      console.error('Error loading range calls:', err);
    }
    return [];
  }

  function saveRangeCalls(calls) {
    try {
      writeFileSync(RANGE_CALLS_FILE, JSON.stringify(calls, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving range calls:', err);
    }
  }

  let rangeCallIdCounter = 0;
  try {
    const existingRangeCalls = loadRangeCalls();
    if (existingRangeCalls.length > 0) {
      rangeCallIdCounter = Math.max(...existingRangeCalls.map(c => c.id || 0));
    }
  } catch (_e) { /* ignore */ }

  // ─── Range call resolver ───
  async function resolveActiveRangeCalls() {
    const calls = loadRangeCalls();
    const activeCalls = calls.filter(c => c.status === 'active');
    if (activeCalls.length === 0) return { resolved: 0, expired: 0, checked: 0 };

    const symbols = [...new Set(activeCalls.map(c => c.symbol))];
    const prices = await fetchPricesForSymbols(symbols);

    const now = new Date();
    let resolvedCount = 0, expiredCount = 0;

    for (const call of activeCalls) {
      if (call.expires_at && new Date(call.expires_at) <= now) {
        call.status = 'expired';
        call.resolved_at = now.toISOString();
        if (call.tp1_hit) { call.exit_price = call.entry_price; call.profit_pct = 0; }
        expiredCount++;
        continue;
      }

      const currentPrice = prices[call.symbol];
      if (currentPrice == null) continue;

      if (call.trailing_sl == null) call.trailing_sl = call.stop_loss;

      if (call.side === 'LONG') {
        if (currentPrice >= call.tp1 && !call.tp1_hit) {
          call.tp1_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 1);
          call.trailing_sl = call.entry_price; // Move SL to breakeven
        }
        if (currentPrice >= call.tp2) {
          call.tp2_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 2);
          call.status = 'resolved';
          call.exit_price = currentPrice;
          call.profit_pct = Math.round((currentPrice - call.entry_price) / call.entry_price * 10000) / 100;
          call.resolved_at = now.toISOString();
          resolvedCount++;
          continue;
        }
        const effectiveSL = call.trailing_sl != null ? call.trailing_sl : call.stop_loss;
        if (currentPrice <= effectiveSL) {
          call.sl_hit = true;
          call.status = 'resolved';
          call.exit_price = currentPrice;
          if (call.tp1_hit) { call.profit_pct = 0; call.exit_price = call.entry_price; }
          else { call.profit_pct = Math.round((currentPrice - call.entry_price) / call.entry_price * 10000) / 100; }
          call.resolved_at = now.toISOString();
          resolvedCount++;
          continue;
        }
      } else {
        if (currentPrice <= call.tp1 && !call.tp1_hit) {
          call.tp1_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 1);
          call.trailing_sl = call.entry_price;
        }
        if (currentPrice <= call.tp2) {
          call.tp2_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 2);
          call.status = 'resolved';
          call.exit_price = currentPrice;
          call.profit_pct = Math.round((call.entry_price - currentPrice) / call.entry_price * 10000) / 100;
          call.resolved_at = now.toISOString();
          resolvedCount++;
          continue;
        }
        const effectiveSL = call.trailing_sl != null ? call.trailing_sl : call.stop_loss;
        if (currentPrice >= effectiveSL) {
          call.sl_hit = true;
          call.status = 'resolved';
          call.exit_price = currentPrice;
          if (call.tp1_hit) { call.profit_pct = 0; call.exit_price = call.entry_price; }
          else { call.profit_pct = Math.round((call.entry_price - currentPrice) / call.entry_price * 10000) / 100; }
          call.resolved_at = now.toISOString();
          resolvedCount++;
          continue;
        }
      }
    }

    saveRangeCalls(calls);
    return { resolved: resolvedCount, expired: expiredCount, checked: activeCalls.length };
  }

  // Periodic range call resolver (every 3 min)
  setInterval(async () => {
    try {
      const result = await resolveActiveRangeCalls();
      if (result.resolved > 0 || result.expired > 0) {
        console.log(`[RangeCall] Periodic: ${result.resolved} resolved, ${result.expired} expired`);
      }
    } catch (err) {
      console.error('[RangeCall] Periodic error:', err.message);
    }
  }, 3 * 60 * 1000);

  // ─── Range Trading API endpoints ───

  app.get('/api/v1/range-calls', (req, res) => {
    const { status: filterStatus, limit = '100', offset = '0' } = req.query;
    let calls = loadRangeCalls();
    if (filterStatus) calls = calls.filter(c => c.status === filterStatus);
    calls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const lim = Math.min(parseInt(limit) || 100, 500);
    const off = parseInt(offset) || 0;
    res.json(calls.slice(off, off + lim));
  });

  app.get('/api/v1/range-calls/stats', (req, res) => {
    const calls = loadRangeCalls();
    const total = calls.length;
    const activeCalls = calls.filter(c => c.status === 'active').length;
    const resolvedCalls = calls.filter(c => c.status === 'resolved').length;
    const expiredCalls = calls.filter(c => c.status === 'expired').length;
    const closedCalls = calls.filter(c => c.status === 'resolved' || c.status === 'expired');
    const totalClosed = closedCalls.length;

    let wins = 0, tp1Hits = 0, tp2Hits = 0, slHits = 0;
    let longWins = 0, longTotal = 0, shortWins = 0, shortTotal = 0;
    let totalProfit = 0;
    const profits = [];
    const confBuckets = { low: { wins: 0, total: 0 }, mid: { wins: 0, total: 0 }, high: { wins: 0, total: 0 }, very_high: { wins: 0, total: 0 } };
    const weeklyData = {};

    for (const c of closedCalls) {
      const isWin = c.tp1_hit;
      if (isWin) wins++;
      if (c.tp1_hit) tp1Hits++;
      if (c.tp2_hit) tp2Hits++;
      if (c.sl_hit) slHits++;

      let effectiveProfit = c.profit_pct;
      if (c.tp1_hit && c.sl_hit && (effectiveProfit == null || effectiveProfit < 0)) effectiveProfit = 0;
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
      win_rate: winRate, tp1_rate: safeRate(tp1Hits, totalClosed), tp2_rate: safeRate(tp2Hits, totalClosed),
      sl_rate: safeRate(slHits, totalClosed), avg_profit_pct: avgProfit,
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

  app.post('/api/v1/range-calls/reset', (req, res) => {
    const { confirm } = req.body || {};
    if (!confirm) return res.status(400).json({ error: 'Missing { "confirm": true }' });
    saveRangeCalls([]);
    rangeCallIdCounter = 0;
    console.log('[RangeCall] All range calls have been reset');
    res.json({ reset: true, message: 'Toutes les données de performance range ont été réinitialisées.' });
  });

  app.post('/api/v1/range-calls/resolve', async (req, res) => {
    try {
      const result = await resolveActiveRangeCalls();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return {
    loadRangeCalls,
    saveRangeCalls,
    allocateRangeCallId: () => ++rangeCallIdCounter,
    resolveActiveRangeCalls,
  };
}
