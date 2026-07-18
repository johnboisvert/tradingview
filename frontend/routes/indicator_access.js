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

export default function registerIndicatorAccessRoutes(app, { requireAdmin, dataDir, getResendClient }) {
  FILE = path.join(dataDir, 'indicator_access.json');

  async function sendAccessGrantedEmail(entry) {
    if (!entry.email || entry.welcomeEmailSentAt) return;
    try {
      const client = await getResendClient();
      if (!client) return;
      const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
      const adminEmail = process.env.ADMIN_EMAIL || 'cryptoia2026@gmail.com';
      const indicators = ['Magic JB IA', 'RiskGlow', 'WaveRider Divergence Oscillator', 'GoodGuys Spot Daily', 'DivergX One', 'Confluence Pro™', 'Magic JB IA Cycles', 'Magic JB S/R AI', 'Crypto IA Edge']
        .map((n) => `<tr><td style="padding:5px 0;color:#e2e8f0;font-size:14px;">✅ ${n}</td></tr>`).join('');
      const steps = [
        ['1', 'Connectez-vous à votre compte TradingView' + (entry.tvUsername ? ` (<strong style="color:#34d399;">${entry.tvUsername}</strong>)` : '')],
        ['2', 'Ouvrez un graphique, puis cliquez sur <strong>« Indicateurs »</strong> en haut'],
        ['3', "Allez dans l'onglet <strong>« Scripts sur invitation seulement »</strong>"],
        ['4', 'Ajoutez chacun de vos 9 indicateurs au graphique'],
        ['5', 'Configurez vos alertes (réglage recommandé : <strong>Once Per Bar Close</strong>)'],
      ].map(([n, t]) => `<tr><td style="width:32px;vertical-align:top;padding:8px 0;"><div style="width:24px;height:24px;border-radius:50%;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);color:#34d399;font-size:12px;font-weight:700;text-align:center;line-height:24px;">${n}</div></td><td style="padding:8px 0;color:#cbd5e1;font-size:14px;line-height:1.5;">${t}</td></tr>`).join('');
      const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;background:#0A0E1A;color:#e2e8f0;padding:32px;"><div style="max-width:560px;margin:0 auto;background:linear-gradient(140deg,#0f172a,#0d1f1a);border:1px solid rgba(16,185,129,0.25);border-radius:20px;padding:36px;"><div style="text-align:center;margin-bottom:24px;"><div style="display:inline-block;width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#10b981,#06b6d4);line-height:56px;font-size:26px;">🚀</div><h1 style="margin:14px 0 0;color:#fff;font-size:22px;">Votre accès est activé !</h1><p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Vos 9 indicateurs TradingView vous attendent</p></div><p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Comment les installer</p><table style="width:100%;border-spacing:0;margin-bottom:24px;">${steps}</table><p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Vos indicateurs</p><table style="width:100%;border-spacing:0;margin-bottom:24px;">${indicators}</table><div style="text-align:center;margin-bottom:24px;"><a href="https://www.cryptoia.ca/magic-strategy" style="display:inline-block;padding:14px 28px;border-radius:999px;background:linear-gradient(135deg,#10b981,#06b6d4);color:#06251c;font-weight:900;text-decoration:none;font-size:14px;">Voir les guides détaillés →</a></div><p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">💡 Chaque indicateur possède une fiche complète (fonctionnement, réglages recommandés, exemples) sur notre page Indicateurs.</p><hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;"><p style="margin:0;color:#475569;font-size:11px;text-align:center;">CryptoIA — cryptoia.ca · Besoin d'aide ? Répondez simplement à cet email.</p></div></body></html>`;
      await client.emails.send({
        from: sender,
        to: [entry.email],
        replyTo: adminEmail,
        subject: '🚀 Votre accès TradingView est activé — installez vos 9 indicateurs !',
        html,
      });
      entry.welcomeEmailSentAt = new Date().toISOString();
      console.log(`[IndicatorAccess] 🚀 Access-granted email sent to ${entry.email}`);
    } catch (e) {
      console.error('[IndicatorAccess] welcome email error:', e?.message);
    }
  }

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
  app.patch('/api/v1/admin/indicator-access/:id', requireAdmin, async (req, res) => {
    const list = load();
    const entry = list.find((e) => e.id === req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entrée introuvable' });
    const { tvUsername, status } = req.body || {};
    if (typeof tvUsername === 'string') entry.tvUsername = tvUsername.trim() || null;
    if (status === 'pending' || status === 'granted') {
      const wasGranted = entry.status === 'granted';
      entry.status = status;
      entry.grantedAt = status === 'granted' ? new Date().toISOString() : null;
      if (status === 'granted' && !wasGranted) {
        await sendAccessGrantedEmail(entry);
      }
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
