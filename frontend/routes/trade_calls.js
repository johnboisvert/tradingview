// Trade Calls (swing) — persistence, API endpoints, resolver + scheduler
// Extracted from server.js (Session 47)
import path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fetchPricesForSymbols } from '../lib/market_sources.js';
import { getWeekNumber } from '../lib/signal_primitives.js';

export function registerTradeCallRoutes(app, { dataDir }) {
  const TRADE_CALLS_FILE = path.join(dataDir, 'trade_calls.json');

  function loadTradeCalls() {
    try {
      if (existsSync(TRADE_CALLS_FILE)) {
        return JSON.parse(readFileSync(TRADE_CALLS_FILE, 'utf-8'));
      }
    } catch (err) {
      console.error('Error loading trade calls:', err);
    }
    try {
      writeFileSync(TRADE_CALLS_FILE, '[]', 'utf-8');
      console.log('[TradeCall] Initialized empty trade_calls.json');
    } catch (_e) { /* ignore */ }
    return [];
  }

  function saveTradeCalls(calls) {
    try {
      writeFileSync(TRADE_CALLS_FILE, JSON.stringify(calls, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving trade calls:', err);
    }
  }

  let tradeCallIdCounter = 0;
  try {
    const existingCalls = loadTradeCalls();
    if (existingCalls.length > 0) {
      tradeCallIdCounter = Math.max(...existingCalls.map(c => c.id || 0));
    }
  } catch (_e) { /* ignore */ }

  // One-time boot repair: v7 snapped some TP3 on distant ATH S/R (ex: ENA tp3 +1734%)
  try {
    const calls = loadTradeCalls();
    let repaired = 0;
    for (const c of calls) {
      if (c.status !== 'active' || !c.tp3 || !c.entry_price || !c.stop_loss) continue;
      const slDist = Math.abs(c.entry_price - c.stop_loss);
      if (c.side === 'LONG' && c.tp3 > c.entry_price * 1.6) {
        c.tp3 = c.entry_price + slDist * 4;
        repaired++;
      } else if (c.side === 'SHORT' && c.tp3 < c.entry_price * 0.4) {
        c.tp3 = Math.max(c.entry_price - slDist * 4, 0);
        repaired++;
      }
    }
    if (repaired > 0) {
      saveTradeCalls(calls);
      console.log(`[TradeCall] 🔧 Repaired ${repaired} aberrant v7 TP3 on active calls`);
    }
  } catch (_e) { /* ignore */ }

  // ─── POST /api/v1/trade-calls — Record a new call (with dedup) ───
  app.post('/api/v1/trade-calls', (req, res) => {
    const { symbol, side, entry_price, stop_loss, tp0, tp1, tp2, tp3, confidence, reason, rsi4h, has_convergence, rr, engine } = req.body;

    if (!symbol || !side || !entry_price) {
      return res.status(400).json({ created: false, message: 'symbol, side, entry_price requis' });
    }

    const calls = loadTradeCalls();
    const cutoff = Date.now() - 4 * 60 * 60 * 1000; // 4 hours ago

    const dup = calls.find(c =>
      c.symbol === symbol &&
      c.side === side &&
      new Date(c.created_at).getTime() >= cutoff
    );

    if (dup) {
      return res.json({ created: false, message: 'Duplicate call (same symbol/side within 4h)', id: dup.id });
    }

    tradeCallIdCounter++;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 120 * 60 * 60 * 1000); // v7: 120h (TP1 is now ~7% away, 72h expired 20% of calls)

    const newCall = {
      id: tradeCallIdCounter,
      symbol,
      side,
      entry_price,
      stop_loss,
      tp0: tp0 || null,
      tp1,
      tp2,
      tp3,
      confidence,
      reason: reason || '',
      rsi4h: rsi4h || null,
      has_convergence: !!has_convergence,
      engine: engine || null,
      rr: rr || null,
      status: 'active',
      trailing_sl: stop_loss, // Initially same as stop_loss, updated when TP1/TP2 hit
      tp0_hit: false,
      tp1_hit: false,
      tp2_hit: false,
      tp3_hit: false,
      sl_hit: false,
      best_tp_reached: 0,
      exit_price: null,
      profit_pct: null,
      created_at: now.toISOString(),
      resolved_at: null,
      expires_at: expiresAt.toISOString(),
    };

    calls.push(newCall);
    saveTradeCalls(calls);
    console.log(`[TradeCall] Created call #${newCall.id}: ${symbol} ${side} @ ${entry_price}`);

    res.json({ created: true, id: newCall.id });
  });

  // ─── GET /api/v1/trade-calls — List calls ───
  app.get('/api/v1/trade-calls', (req, res) => {
    const { status: filterStatus, limit = '100', offset = '0' } = req.query;
    let calls = loadTradeCalls();

    if (filterStatus) {
      calls = calls.filter(c => c.status === filterStatus);
    }

    calls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const lim = Math.min(parseInt(limit) || 100, 500);
    const off = parseInt(offset) || 0;
    calls = calls.slice(off, off + lim);

    res.json(calls);
  });

// Profit partiel réalisé quand TP1 touché puis stop breakeven :
// 50% de la position sortie au TP1 (+25% au TP2 si atteint), le reste au breakeven.
function partialRealizedPct(c) {
  const dir = c.side === 'SHORT' ? -1 : 1;
  const pct = (tp) => (tp && c.entry_price ? dir * ((tp - c.entry_price) / c.entry_price) * 100 : 0);
  let realized = 0.5 * pct(c.tp1);
  if (c.tp2_hit) realized += 0.25 * pct(c.tp2);
  return Math.round(realized * 100) / 100;
}

  // ─── GET /api/v1/trade-calls/stats — Performance statistics ───
  // ?engine=v8 → uniquement les signaux du nouveau moteur (v7/v8 ou créés après le déploiement)
  app.get('/api/v1/trade-calls/stats', (req, res) => {
    let calls = loadTradeCalls();
    if (req.query.engine === 'v8') {
      const V8_CUTOFF = '2026-07-20T21:00:00Z';
      calls = calls.filter(c => c.engine === 'v7' || c.engine === 'v8' || (c.created_at && String(c.created_at) >= V8_CUTOFF));
    }
    const total = calls.length;
    const activeCalls = calls.filter(c => c.status === 'active').length;
    const resolvedCalls = calls.filter(c => c.status === 'resolved').length;
    const expiredCalls = calls.filter(c => c.status === 'expired').length;

    const closedCalls = calls.filter(c => c.status === 'resolved' || c.status === 'expired');
    const totalClosed = closedCalls.length;

    let wins = 0, tp0Hits = 0, tp1Hits = 0, tp2Hits = 0, tp3Hits = 0, slHits = 0;
    let longWins = 0, longTotal = 0, shortWins = 0, shortTotal = 0;
    let totalProfit = 0;
    const profits = [];
    const confBuckets = {
      low: { wins: 0, total: 0 },
      mid: { wins: 0, total: 0 },
      high: { wins: 0, total: 0 },
      very_high: { wins: 0, total: 0 },
    };
    const weeklyData = {};

    for (const c of closedCalls) {
      // Win = TP1 was hit (trailing stop protects at breakeven, so even if SL hit after TP1, it's a win/breakeven)
      const isWin = c.tp1_hit;
      if (isWin) wins++;
      if (c.tp0_hit) tp0Hits++;
      if (c.tp1_hit) tp1Hits++;
      if (c.tp2_hit) tp2Hits++;
      if (c.tp3_hit) tp3Hits++;
      if (c.sl_hit) slHits++;

      // Profit calculation: if TP1 hit + SL hit → profit partiel réalisé (pas 0%)
      let effectiveProfit = c.profit_pct;
      if (c.tp1_hit && c.sl_hit && (effectiveProfit == null || effectiveProfit <= 0)) {
        effectiveProfit = partialRealizedPct(c);
      }
      if (effectiveProfit != null) {
        totalProfit += effectiveProfit;
        profits.push(effectiveProfit);
      }

      if (c.side === 'LONG') {
        longTotal++;
        if (isWin) longWins++;
      } else {
        shortTotal++;
        if (isWin) shortWins++;
      }

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

    const winRate = totalClosed > 0 ? Math.round(wins / totalClosed * 1000) / 10 : 0;
    const avgProfit = profits.length > 0 ? Math.round(totalProfit / profits.length * 100) / 100 : 0;

    const weeklySorted = Object.keys(weeklyData).sort().map(wk => ({
      week: wk,
      wins: weeklyData[wk].wins,
      total: weeklyData[wk].total,
      win_rate: weeklyData[wk].total > 0 ? Math.round(weeklyData[wk].wins / weeklyData[wk].total * 1000) / 10 : 0,
    }));

    const safeRate = (w, t) => t > 0 ? Math.round(w / t * 1000) / 10 : 0;

    res.json({
      total_calls: total,
      active_calls: activeCalls,
      resolved_calls: resolvedCalls,
      expired_calls: expiredCalls,
      win_rate: winRate,
      tp0_rate: safeRate(tp0Hits, totalClosed),
      tp1_rate: safeRate(tp1Hits, totalClosed),
      tp2_rate: safeRate(tp2Hits, totalClosed),
      tp3_rate: safeRate(tp3Hits, totalClosed),
      sl_rate: safeRate(slHits, totalClosed),
      avg_profit_pct: avgProfit,
      long_win_rate: safeRate(longWins, longTotal),
      short_win_rate: safeRate(shortWins, shortTotal),
      long_total: longTotal,
      short_total: shortTotal,
      confidence_buckets: {
        '<50%': { win_rate: safeRate(confBuckets.low.wins, confBuckets.low.total), total: confBuckets.low.total },
        '50-65%': { win_rate: safeRate(confBuckets.mid.wins, confBuckets.mid.total), total: confBuckets.mid.total },
        '65-80%': { win_rate: safeRate(confBuckets.high.wins, confBuckets.high.total), total: confBuckets.high.total },
        '>80%': { win_rate: safeRate(confBuckets.very_high.wins, confBuckets.very_high.total), total: confBuckets.very_high.total },
      },
      weekly_win_rate: weeklySorted,
    });
  });

  // ─── POST /api/v1/trade-calls/reset — Reset all trade calls ───
  app.post('/api/v1/trade-calls/reset', (req, res) => {
    const { confirm } = req.body || {};
    if (!confirm) {
      return res.status(400).json({ error: 'Missing { "confirm": true } in request body' });
    }
    try {
      saveTradeCalls([]);
      tradeCallIdCounter = 0;
      console.log('[TradeCall] All trade calls have been reset');
      res.json({ reset: true, message: 'Toutes les données de performance swing ont été réinitialisées.' });
    } catch (err) {
      console.error('[TradeCall] Reset error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── POST /api/v1/trade-calls/resolve — Check active calls vs Binance prices ───
  app.post('/api/v1/trade-calls/resolve', async (req, res) => {
    try {
      const result = await resolveActiveTradeCalls();
      res.json(result);
    } catch (err) {
      console.error('[TradeCall] Resolve error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // v8: PnL réaliste — plan de sortie échelonné 40% TP1 / 30% TP2 / 30% runner (trailing)
  function partialProfitPct(call, runnerExitPrice) {
    const dir = call.side === 'LONG' ? 1 : -1;
    const g = (p) => dir * (p - call.entry_price) / call.entry_price * 100;
    if (!call.tp1_hit) return Math.round(g(runnerExitPrice) * 100) / 100;
    let total = 0.4 * g(call.tp1);
    if (call.tp2_hit) total += 0.3 * g(call.tp2) + 0.3 * g(runnerExitPrice);
    else total += 0.6 * g(runnerExitPrice);
    return Math.round(total * 100) / 100;
  }

  async function resolveActiveTradeCalls() {
    const calls = loadTradeCalls();
    const activeCalls = calls.filter(c => c.status === 'active');

    if (activeCalls.length === 0) {
      return { resolved: 0, expired: 0, checked: 0 };
    }

    const symbols = [...new Set(activeCalls.map(c => c.symbol))];
    const prices = await fetchPricesForSymbols(symbols);

    const now = new Date();
    let resolvedCount = 0;
    let expiredCount = 0;

    for (const call of activeCalls) {
      // Check expiry — if expired and TP1 was hit, count partial profits (v8)
      if (call.expires_at && new Date(call.expires_at) <= now) {
        call.status = 'expired';
        call.resolved_at = now.toISOString();
        if (call.tp1_hit) {
          // v8: 40% sorti au TP1 (+30% TP2 si touché), runner à breakeven
          call.exit_price = call.trailing_sl || call.entry_price;
          call.profit_pct = partialProfitPct(call, call.exit_price);
        }
        expiredCount++;
        console.log(`[TradeCall] Call #${call.id} ${call.symbol} expired (tp1_hit: ${call.tp1_hit})`);
        continue;
      }

      const currentPrice = prices[call.symbol];
      if (currentPrice == null) continue;

      // PnL live persisté pour l'affichage (rafraîchi à chaque check ~5 min)
      call.current_price = currentPrice;
      call.live_pnl_pct = Math.round((call.side === 'LONG' ? 1 : -1) * (currentPrice - call.entry_price) / call.entry_price * 10000) / 100;
      call.last_checked = now.toISOString();

      if (call.trailing_sl == null) {
        call.trailing_sl = call.stop_loss;
      }

      if (call.side === 'LONG') {
        // First check TP hits (before SL check, so trailing SL updates first)
        if (call.tp0 && currentPrice >= call.tp0) call.tp0_hit = true;

        if (currentPrice >= call.tp1 && !call.tp1_hit) {
          call.tp0_hit = true;
          call.tp1_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 1);
          call.trailing_sl = call.entry_price;
          console.log(`[TradeCall] Call #${call.id} ${call.symbol} LONG TP1 hit — trailing SL moved to breakeven ${call.entry_price}`);
        } else if (currentPrice >= call.tp1) {
          call.best_tp_reached = Math.max(call.best_tp_reached, 1);
        }

        if (currentPrice >= call.tp2 && !call.tp2_hit) {
          call.tp2_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 2);
          call.trailing_sl = call.tp1;
          console.log(`[TradeCall] Call #${call.id} ${call.symbol} LONG TP2 hit — trailing SL moved to TP1 ${call.tp1}`);
        } else if (currentPrice >= call.tp2) {
          call.best_tp_reached = Math.max(call.best_tp_reached, 2);
        }

        if (currentPrice >= call.tp3) {
          call.tp3_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 3);
          call.status = 'resolved';
          call.exit_price = currentPrice;
          call.profit_pct = partialProfitPct(call, currentPrice);
          call.resolved_at = now.toISOString();
          resolvedCount++;
          console.log(`[TradeCall] Call #${call.id} ${call.symbol} LONG TP3 hit — resolved +${call.profit_pct}%`);
          continue;
        }

        const effectiveSL = call.trailing_sl != null ? call.trailing_sl : call.stop_loss;
        if (currentPrice <= effectiveSL) {
          call.sl_hit = true;
          call.status = 'resolved';
          call.exit_price = currentPrice;
          // v8: si TP1 déjà touché → profits partiels sécurisés (40% TP1 / 30% TP2), runner sorti au trailing
          if (call.tp1_hit) {
            call.exit_price = effectiveSL;
            call.profit_pct = partialProfitPct(call, effectiveSL);
          } else {
            call.profit_pct = Math.round((currentPrice - call.entry_price) / call.entry_price * 10000) / 100;
          }
          call.resolved_at = now.toISOString();
          resolvedCount++;
          console.log(`[TradeCall] Call #${call.id} ${call.symbol} LONG SL hit (trailing: ${effectiveSL}) — ${call.profit_pct}%`);
          continue;
        }
      } else {
        // SHORT
        if (call.tp0 && currentPrice <= call.tp0) call.tp0_hit = true;

        if (currentPrice <= call.tp1 && !call.tp1_hit) {
          call.tp0_hit = true;
          call.tp1_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 1);
          call.trailing_sl = call.entry_price;
          console.log(`[TradeCall] Call #${call.id} ${call.symbol} SHORT TP1 hit — trailing SL moved to breakeven ${call.entry_price}`);
        } else if (currentPrice <= call.tp1) {
          call.best_tp_reached = Math.max(call.best_tp_reached, 1);
        }

        if (currentPrice <= call.tp2 && !call.tp2_hit) {
          call.tp2_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 2);
          call.trailing_sl = call.tp1;
          console.log(`[TradeCall] Call #${call.id} ${call.symbol} SHORT TP2 hit — trailing SL moved to TP1 ${call.tp1}`);
        } else if (currentPrice <= call.tp2) {
          call.best_tp_reached = Math.max(call.best_tp_reached, 2);
        }

        if (currentPrice <= call.tp3) {
          call.tp3_hit = true;
          call.best_tp_reached = Math.max(call.best_tp_reached, 3);
          call.status = 'resolved';
          call.exit_price = currentPrice;
          call.profit_pct = partialProfitPct(call, currentPrice);
          call.resolved_at = now.toISOString();
          resolvedCount++;
          console.log(`[TradeCall] Call #${call.id} ${call.symbol} SHORT TP3 hit — resolved +${call.profit_pct}%`);
          continue;
        }

        const effectiveSL = call.trailing_sl != null ? call.trailing_sl : call.stop_loss;
        if (currentPrice >= effectiveSL) {
          call.sl_hit = true;
          call.status = 'resolved';
          call.exit_price = currentPrice;
          if (call.tp1_hit) {
            call.exit_price = effectiveSL;
            call.profit_pct = partialProfitPct(call, effectiveSL);
          } else {
            call.profit_pct = Math.round((call.entry_price - currentPrice) / call.entry_price * 10000) / 100;
          }
          call.resolved_at = now.toISOString();
          resolvedCount++;
          console.log(`[TradeCall] Call #${call.id} ${call.symbol} SHORT SL hit (trailing: ${effectiveSL}) — ${call.profit_pct}%`);
          continue;
        }
      }
    }

    saveTradeCalls(calls);
    console.log(`[TradeCall] Resolve check: ${activeCalls.length} checked, ${resolvedCount} resolved, ${expiredCount} expired`);
    return { resolved: resolvedCount, expired: expiredCount, checked: activeCalls.length };
  }

  // ─── Periodic trade call resolver (every 5 minutes — faster for accurate SL/TP tracking) ───
  setInterval(async () => {
    try {
      const result = await resolveActiveTradeCalls();
      if (result.resolved > 0 || result.expired > 0) {
        console.log(`[TradeCall] Periodic resolve: ${result.resolved} resolved, ${result.expired} expired`);
      }
    } catch (err) {
      console.error('[TradeCall] Periodic resolve error:', err.message);
    }
  }, 5 * 60 * 1000);

  return { loadTradeCalls, saveTradeCalls, resolveActiveTradeCalls };
}
