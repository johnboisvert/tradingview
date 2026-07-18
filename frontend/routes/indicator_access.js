// Indicator Access — suivi des acheteurs de la Suite Indicateurs TradingView
import fs from 'fs';
import path from 'path';

let FILE = null;

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}

function save(list) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
  } catch (e) {
    console.error('[IndicatorAccess] save error:', e?.message);
  }
}

export function recordIndicatorPurchase({ email, billing, amount, sessionId }) {
  if (!FILE) return;
  const list = load();
  if (sessionId && list.some((e) => e.sessionId === sessionId)) return; // idempotent
  list.unshift({
    id: `ia_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email: email || null,
    billing: billing || 'monthly',
    amount: amount || 0,
    sessionId: sessionId || null,
    tvUsername: null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    grantedAt: null,
  });
  save(list);
  console.log(`[IndicatorAccess] 🎯 Purchase recorded: ${email} (${billing}, $${amount})`);
}

export default function registerIndicatorAccessRoutes(app, { requireAdmin, dataDir }) {
  FILE = path.join(dataDir, 'indicator_access.json');

  // ─── GET /api/v1/admin/indicator-access — liste + stats ───
  app.get('/api/v1/admin/indicator-access', requireAdmin, (req, res) => {
    const entries = load();
    const stats = {
      total: entries.length,
      pending: entries.filter((e) => e.status === 'pending').length,
      granted: entries.filter((e) => e.status === 'granted').length,
      revenue: entries.reduce((s, e) => s + (e.amount || 0), 0),
    };
    res.json({ ok: true, stats, entries });
  });

  // ─── PATCH /api/v1/admin/indicator-access/:id — MAJ username / statut ───
  app.patch('/api/v1/admin/indicator-access/:id', requireAdmin, (req, res) => {
    const list = load();
    const entry = list.find((e) => e.id === req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entrée introuvable' });
    const { tvUsername, status } = req.body || {};
    if (typeof tvUsername === 'string') entry.tvUsername = tvUsername.trim() || null;
    if (status === 'pending' || status === 'granted') {
      entry.status = status;
      entry.grantedAt = status === 'granted' ? new Date().toISOString() : null;
    }
    save(list);
    res.json({ ok: true, entry });
  });

  // ─── POST /api/v1/admin/indicator-access — ajout manuel (vente hors Stripe) ───
  app.post('/api/v1/admin/indicator-access', requireAdmin, (req, res) => {
    const { email, billing = 'monthly', amount = 0, tvUsername } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email requis' });
    recordIndicatorPurchase({ email, billing, amount: Number(amount) || 0, sessionId: null });
    if (tvUsername) {
      const list = load();
      if (list[0]) {
        list[0].tvUsername = String(tvUsername).trim();
        save(list);
      }
    }
    res.json({ ok: true });
  });

  console.log('[IndicatorAccess] ✅ Routes registered (GET/PATCH/POST /api/v1/admin/indicator-access)');
}
