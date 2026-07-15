// Tests for lib/signal_primitives.js and routes/telegram_routes.js (Session 43 refactor)
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {
  calcEMA, calcRSI, calcStochRSI, calcMACD, calcATR_M5,
  calcBollingerBands, calcADX, SCALP_SYMBOLS_FALLBACK,
} from '../lib/signal_primitives.js';
import registerTelegramConfigRoutes from '../routes/telegram_routes.js';

test('calcEMA: constant series stays constant', () => {
  const ema = calcEMA([10, 10, 10, 10, 10], 3);
  assert.equal(ema.length, 5);
  for (const v of ema) assert.ok(Math.abs(v - 10) < 1e-9);
});

test('calcEMA: rising series trends up and lags price', () => {
  const ema = calcEMA([1, 2, 3, 4, 5, 6, 7, 8], 4);
  assert.ok(ema[7] > ema[3]);
  assert.ok(ema[7] < 8); // EMA lags the last price on a rising series
});

test('calcRSI: uptrend gives RSI > 50, downtrend < 50', () => {
  const up = Array.from({ length: 30 }, (_, i) => 100 + i);
  const down = Array.from({ length: 30 }, (_, i) => 100 - i);
  const rsiUp = calcRSI(up, 14);
  const rsiDown = calcRSI(down, 14);
  assert.ok(rsiUp[rsiUp.length - 1] > 90);
  assert.ok(rsiDown[rsiDown.length - 1] < 10);
});

test('calcRSI: short series returns neutral 50s', () => {
  const rsi = calcRSI([1, 2, 3], 14);
  assert.deepEqual(rsi, [50, 50, 50]);
});

test('calcStochRSI: returns k and d arrays of same length, bounded 0-100', () => {
  const closes = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 3) * 10);
  const { k, d } = calcStochRSI(closes);
  assert.equal(k.length, closes.length);
  assert.equal(d.length, closes.length);
  for (const v of [...k, ...d]) assert.ok(v >= 0 && v <= 100);
});

test('calcMACD: structure and histogram = macd - signal', () => {
  const closes = Array.from({ length: 60 }, (_, i) => 100 + i * 0.5);
  const { macd, signal, histogram } = calcMACD(closes);
  assert.equal(macd.length, closes.length);
  const i = closes.length - 1;
  assert.ok(Math.abs(histogram[i] - (macd[i] - signal[i])) < 1e-9);
});

test('calcATR_M5: null on short input, positive on volatile klines', () => {
  assert.equal(calcATR_M5([{ high: 1, low: 0, close: 0.5 }], 14), null);
  const klines = Array.from({ length: 30 }, (_, i) => ({
    high: 105 + (i % 3), low: 95 - (i % 2), close: 100 + (i % 5),
  }));
  const atr = calcATR_M5(klines, 14);
  assert.ok(atr > 0);
});

test('calcBollingerBands: upper > sma > lower', () => {
  const closes = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i) * 5);
  const bb = calcBollingerBands(closes, 20, 2);
  assert.ok(bb);
  const last = bb.sma.length - 1;
  assert.ok(bb.upper[last] > bb.sma[last]);
  assert.ok(bb.lower[last] < bb.sma[last]);
});

test('calcADX: null on short input, 0-100 on trending series', () => {
  assert.equal(calcADX([], 14), null);
  const klines = Array.from({ length: 80 }, (_, i) => ({
    high: 100 + i + 1, low: 100 + i - 1, close: 100 + i,
  }));
  const adx = calcADX(klines, 14);
  assert.ok(adx !== null && adx >= 0 && adx <= 100);
});

test('SCALP_SYMBOLS_FALLBACK: 50 valid USDT symbols', () => {
  assert.equal(SCALP_SYMBOLS_FALLBACK.length, 50);
  for (const s of SCALP_SYMBOLS_FALLBACK) assert.ok(s.endsWith('USDT'));
});

// ─── Telegram config routes (mocked deps) ───
function makeApp(overrides = {}) {
  const state = { config: { enabled: false }, sent: [], toggled: [] };
  const app = express();
  app.use(express.json());
  registerTelegramConfigRoutes(app, {
    sendTelegramMessage: async (text) => { state.sent.push(text); return { ok: true }; },
    loadTelegramAlerts: () => ({ ...state.config }),
    saveTelegramAlerts: (c) => { state.config = { ...c }; },
    checkAndSendAlerts: async () => [{ symbol: 'BTCUSDT' }],
    onToggle: (enabled) => state.toggled.push(enabled),
    ...overrides,
  });
  return { app, state };
}

function listen(app) {
  return new Promise((resolve) => {
    const srv = app.listen(0, () => resolve(srv));
  });
}

test('telegram routes: GET/POST config round-trip', async () => {
  const { app, state } = makeApp();
  const srv = await listen(app);
  const base = `http://localhost:${srv.address().port}`;
  let r = await fetch(`${base}/api/telegram/config`);
  let j = await r.json();
  assert.equal(j.success, true);
  assert.equal(j.config.enabled, false);

  r = await fetch(`${base}/api/telegram/config`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: { enabled: true, min_change: 5 } }),
  });
  j = await r.json();
  assert.equal(j.success, true);
  assert.equal(state.config.min_change, 5);
  srv.close();
});

test('telegram routes: /toggle persists and calls onToggle', async () => {
  const { app, state } = makeApp();
  const srv = await listen(app);
  const base = `http://localhost:${srv.address().port}`;
  const r = await fetch(`${base}/api/telegram/toggle`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: true }),
  });
  const j = await r.json();
  assert.equal(j.enabled, true);
  assert.deepEqual(state.toggled, [true]);
  assert.equal(state.config.enabled, true);
  srv.close();
});

test('telegram routes: /send requires text and sends', async () => {
  const { app, state } = makeApp();
  const srv = await listen(app);
  const base = `http://localhost:${srv.address().port}`;
  let r = await fetch(`${base}/api/telegram/send`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
  });
  assert.equal(r.status, 400);
  r = await fetch(`${base}/api/telegram/send`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'hello' }),
  });
  const j = await r.json();
  assert.equal(j.success, true);
  assert.deepEqual(state.sent, ['hello']);
  srv.close();
});

test('telegram routes: /check-now returns alert count', async () => {
  const { app } = makeApp();
  const srv = await listen(app);
  const base = `http://localhost:${srv.address().port}`;
  const r = await fetch(`${base}/api/telegram/check-now`, { method: 'POST' });
  const j = await r.json();
  assert.equal(j.success, true);
  assert.equal(j.alertsSent, 1);
  srv.close();
});
