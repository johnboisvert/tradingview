// Signaux externes — webhook pour l'agent Claude/MCP TradingView du proprio.
// POST /api/v1/external-signals (clé secrète) | GET list/stats | résolution auto TP/SL (5 min).
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { fetchPricesForSymbols } from '../lib/market_sources.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const SIGNALS_FILE = path.join(DATA_DIR, 'external_signals.json');
const SECRET_FILE = path.join(DATA_DIR, 'external_signal_secret.json');
const EXPIRY_HOURS = 168; // 7 jours

function loadSignals() {
  try { return JSON.parse(fs.readFileSync(SIGNALS_FILE, 'utf8')); } catch { return []; }
}
function saveSignals(list) {
  fs.writeFileSync(SIGNALS_FILE, JSON.stringify(list, null, 2));
}
function getSecret() {
  try {
    const j = JSON.parse(fs.readFileSync(SECRET_FILE, 'utf8'));
    if (j.key) return j.key;
  } catch { /* first boot */ }
  const key = crypto.randomBytes(24).toString('hex');
  fs.writeFileSync(SECRET_FILE, JSON.stringify({ key, created_at: new Date().toISOString() }, null, 2));
  console.log('[ExternalSignals] Nouvelle clé webhook générée (voir /api/v1/external-signals/key en admin)');
  return key;
}

function normalizeSymbol(raw) {
  let s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!s) return null;
  if (!s.endsWith('USDT') && !s.endsWith('USD')) s += 'USDT';
  return s;
}

function pnlPct(sig, price) {
  const dir = sig.side === 'SHORT' ? -1 : 1;
  return Math.round(dir * ((price - sig.entry_price) / sig.entry_price) * 10000) / 100;
}

// Modèle de sorties partielles : 50% TP1, 25% TP2, 25% TP3 (runner)
function realizedProfit(sig, exitPrice) {
  const g = (p) => pnlPct(sig, p);
  if (sig.tp3_hit) return Math.round((0.5 * g(sig.tp1) + 0.25 * g(sig.tp2 || sig.tp1) + 0.25 * g(sig.tp3)) * 100) / 100;
  let total = 0;
  if (sig.tp1_hit) {
    total += 0.5 * g(sig.tp1);
    if (sig.tp2_hit) total += 0.25 * g(sig.tp2) + 0.25 * g(exitPrice);
    else total += 0.5 * g(exitPrice);
  } else {
    total = g(exitPrice);
  }
  return Math.round(total * 100) / 100;
}

export default function registerExternalSignalRoutes(app, { requireAdmin } = {}) {
  const adminGuard = requireAdmin || ((_req, _res, next) => next());
  const SECRET = getSecret();

  // Clé webhook (admin uniquement) — à donner à l'agent Claude
  app.get('/api/v1/external-signals/key', adminGuard, (req, res) => {
    res.json({ key: SECRET, usage: `curl -X POST https://www.cryptoia.ca/api/v1/external-signals -H "Content-Type: application/json" -H "x-signal-key: ${SECRET}" -d '{"symbol":"ETHUSDT","side":"LONG","entry":1925.5,"sl":1880,"tp1":1975,"tp2":2020,"tp3":2080,"timeframe":"4H","note":"Cassure résistance + volume"}'` });
  });

  // Webhook de réception (agent Claude)
  app.post('/api/v1/external-signals', (req, res) => {
    if (req.headers['x-signal-key'] !== SECRET) return res.status(401).json({ error: 'invalid key' });
    const b = req.body || {};
    const symbol = normalizeSymbol(b.symbol);
    const side = String(b.side || '').toUpperCase();
    const entry = Number(b.entry ?? b.entry_price);
    const sl = Number(b.sl ?? b.stop_loss);
    const tp1 = Number(b.tp1);
    if (!symbol || !['LONG', 'SHORT'].includes(side) || !isFinite(entry) || !isFinite(sl) || !isFinite(tp1)) {
      return res.status(400).json({ error: 'champs requis: symbol, side (LONG/SHORT), entry, sl, tp1' });
    }
    if (side === 'LONG' && !(sl < entry && tp1 > entry)) return res.status(400).json({ error: 'LONG: sl < entry < tp1 requis' });
    if (side === 'SHORT' && !(sl > entry && tp1 < entry)) return res.status(400).json({ error: 'SHORT: tp1 < entry < sl requis' });

    const signals = loadSignals();
    if (signals.some(s => s.status === 'active' && s.symbol === symbol)) {
      return res.status(409).json({ error: `signal actif déjà présent pour ${symbol}` });
    }
    const sig = {
      id: signals.length ? Math.max(...signals.map(s => s.id)) + 1 : 1,
      symbol,
      side,
      entry_price: entry,
      stop_loss: sl,
      tp1,
      tp2: isFinite(Number(b.tp2)) ? Number(b.tp2) : null,
      tp3: isFinite(Number(b.tp3)) ? Number(b.tp3) : null,
      timeframe: b.timeframe ? String(b.timeframe).slice(0, 12) : null,
      note: b.note ? String(b.note).slice(0, 500) : null,
      source: 'claude-scanner',
      status: 'active',
      tp1_hit: false, tp2_hit: false, tp3_hit: false, sl_hit: false,
      breakeven: false,
      current_price: entry,
      live_pnl_pct: 0,
      exit_price: null,
      profit_pct: null,
      created_at: new Date().toISOString(),
      resolved_at: null,
    };
    signals.unshift(sig);
    saveSignals(signals);
    console.log(`[ExternalSignals] 🤖 Nouveau signal reçu: ${symbol} ${side} @ ${entry}`);
    res.json({ ok: true, signal: sig });
  });

  app.get('/api/v1/external-signals', (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    res.json(loadSignals().slice(0, limit));
  });

  app.get('/api/v1/external-signals/stats', (req, res) => {
    const signals = loadSignals();
    const closed = signals.filter(s => s.status !== 'active');
    const wins = closed.filter(s => s.tp1_hit);
    const profits = closed.map(s => s.profit_pct).filter(p => typeof p === 'number');
    const best = closed.filter(s => typeof s.profit_pct === 'number').sort((a, b) => b.profit_pct - a.profit_pct)[0] || null;
    res.json({
      total_pnl_pct: Math.round(profits.reduce((a, b) => a + b, 0) * 100) / 100,
      best_trade: best ? { symbol: best.symbol, profit_pct: best.profit_pct } : null,
      total_calls: signals.length,
      active_calls: signals.filter(s => s.status === 'active').length,
      resolved_calls: closed.filter(s => s.status === 'resolved').length,
      expired_calls: closed.filter(s => s.status === 'expired').length,
      win_rate: closed.length ? Math.round((wins.length / closed.length) * 1000) / 10 : 0,
      tp2_rate: closed.length ? Math.round((closed.filter(s => s.tp2_hit).length / closed.length) * 1000) / 10 : 0,
      avg_profit_pct: profits.length ? Math.round((profits.reduce((a, b) => a + b, 0) / profits.length) * 100) / 100 : 0,
    });
  });

  // ─── Résolution automatique (5 min) ───
  async function resolveExternalSignals() {
    const signals = loadSignals();
    const active = signals.filter(s => s.status === 'active');
    if (active.length === 0) return;
    const prices = await fetchPricesForSymbols([...new Set(active.map(s => s.symbol))]);
    const now = new Date();
    let changed = false;
    for (const sig of active) {
      const price = prices[sig.symbol];
      if (price == null) continue;
      sig.current_price = price;
      sig.live_pnl_pct = pnlPct(sig, price);
      changed = true;
      const isLong = sig.side === 'LONG';
      const hitTP = (tp) => tp != null && (isLong ? price >= tp : price <= tp);
      const effSL = sig.breakeven ? sig.entry_price : sig.stop_loss;
      const hitSL = isLong ? price <= effSL : price >= effSL;

      if (hitTP(sig.tp1) && !sig.tp1_hit) { sig.tp1_hit = true; sig.breakeven = true; console.log(`[ExternalSignals] ✅ ${sig.symbol} TP1 — stop au breakeven`); }
      if (hitTP(sig.tp2) && !sig.tp2_hit) sig.tp2_hit = true;
      if (hitTP(sig.tp3) && !sig.tp3_hit) sig.tp3_hit = true;

      const finalTP = sig.tp3 ?? sig.tp2 ?? sig.tp1;
      if (hitTP(finalTP)) {
        sig.tp1_hit = true;
        if (sig.tp2 != null) sig.tp2_hit = true;
        if (sig.tp3 != null) sig.tp3_hit = true;
        sig.status = 'resolved';
      } else if (hitSL) {
        sig.sl_hit = !sig.breakeven;
        sig.status = 'resolved';
      } else if ((now - new Date(sig.created_at)) / 3600000 > EXPIRY_HOURS) {
        sig.status = 'expired';
      }
      if (sig.status !== 'active') {
        sig.exit_price = price;
        sig.resolved_at = now.toISOString();
        sig.profit_pct = realizedProfit(sig, sig.tp3_hit ? (sig.tp3 ?? price) : price);
        console.log(`[ExternalSignals] 🏁 ${sig.symbol} ${sig.status} — PnL ${sig.profit_pct}%`);
      }
    }
    if (changed) saveSignals(signals);
  }
  setInterval(() => { resolveExternalSignals().catch(e => console.error('[ExternalSignals] resolver:', e.message)); }, 5 * 60 * 1000);
}
