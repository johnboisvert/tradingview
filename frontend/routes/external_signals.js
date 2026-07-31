// Signaux externes — webhook pour l'agent Claude/MCP TradingView du proprio.
// POST /api/v1/external-signals (clé secrète) → crée un trade call standard (engine: 'scanner-ia')
// qui apparaît sur /performance, /trades et compte dans les stats du site.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SECRET_FILE = path.join(__dirname, '..', 'data', 'external_signal_secret.json');

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

export default function registerExternalSignalRoutes(app, { requireAdmin, createTradeCall } = {}) {
  const adminGuard = requireAdmin || ((_req, _res, next) => next());
  const SECRET = getSecret();

  // Clé webhook (admin uniquement) — à donner à l'agent Claude
  app.get('/api/v1/external-signals/key', adminGuard, (req, res) => {
    res.json({ key: SECRET, usage: `curl -X POST https://www.cryptoia.ca/api/v1/external-signals -H "Content-Type: application/json" -H "x-signal-key: ${SECRET}" -d '{"symbol":"ETHUSDT","side":"LONG","entry":1925.5,"sl":1880,"tp1":1975,"tp2":2020,"tp3":2080,"confidence":85,"note":"Cassure résistance + volume"}'` });
  });

  // Webhook de réception (agent Claude) → trade call standard mêlé aux signaux du moteur swing
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

    // tp2/tp3 : fournis, sinon extrapolés à 2x / 3x la distance du TP1
    const dir = side === 'LONG' ? 1 : -1;
    const tpDist = Math.abs(tp1 - entry);
    const tp2 = isFinite(Number(b.tp2)) ? Number(b.tp2) : entry + dir * tpDist * 2;
    const tp3 = isFinite(Number(b.tp3)) ? Number(b.tp3) : entry + dir * tpDist * 3;
    if (dir * (tp2 - tp1) <= 0 || dir * (tp3 - tp2) <= 0) {
      return res.status(400).json({ error: `${side}: ordre des TP invalide (tp1 → tp2 → tp3)` });
    }

    const confidence = isFinite(Number(b.confidence)) ? Math.min(99, Math.max(50, Math.round(Number(b.confidence)))) : 80;
    const note = b.note ?? b.reason;

    const result = createTradeCall({
      symbol,
      side,
      entry_price: entry,
      stop_loss: sl,
      tp1, tp2, tp3,
      confidence,
      reason: note ? `🤖 Scanner IA — ${String(note).slice(0, 400)}` : '🤖 Scanner IA (agent Claude × TradingView)',
      engine: 'scanner-ia',
    });

    if (result.error) return res.status(400).json({ error: result.error });
    if (!result.created) return res.status(409).json({ ok: false, duplicate: true, message: result.message, id: result.id });
    console.log(`[ExternalSignals] 🤖 Signal Claude accepté: ${symbol} ${side} @ ${entry} → trade call #${result.id}`);
    res.json({ ok: true, id: result.id, message: 'Signal enregistré — visible sur /performance et suivi automatiquement (5 min)' });
  });
}
