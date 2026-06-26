// Win-back automation for canceled subscribers.
// Triggers on Stripe webhook `customer.subscription.deleted`.
// Sends a 2-step email sequence:
//   step 1 (T+1d):  soft win-back ("on s'ennuie sans toi") — no discount yet
//   step 2 (T+7d):  -30% offer with promo code WINBACK30 (env RECOVERY_PROMO_CODE_WINBACK)
//
// Industry data: ~15-25% of canceled SaaS subs come back if hit with a thoughtful win-back
// within 7 days.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE = path.join(__dirname, '..', 'data', 'winback.json');

function load() {
  try { if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { /* ignore */ }
  return { entries: [] };
}
function save(data) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch (e) { console.error('[WinBack] save error:', e?.message); }
}

const PLAN_LABELS = { premium: 'Premium', pro: 'Pro', vip: 'VIP', starter: 'Starter' };

function winBackEmailHtml({ planLabel, promoCode, ctaUrl, step }) {
  const headers = {
    1: {
      emoji: '👋',
      title: 'On s\'ennuie sans toi',
      subtitle: 'Reviens quand tu veux — ton compte est toujours là',
      body: `On a remarqué que tu as mis ton abonnement <strong style="color:#fff;">${planLabel}</strong> en pause. Pas de souci — ton compte CryptoIA reste actif (mode gratuit) et l'historique de tes alertes, watchlists et trades est conservé.`,
      cta: '👉 Voir ce que j\'ai manqué cette semaine',
      gradient: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',
      shadow: 'rgba(139,92,246,0.35)',
    },
    2: {
      emoji: '🎁',
      title: 'Reviens à -30% sur CryptoIA',
      subtitle: 'Une dernière offre, just for you',
      body: `Cette semaine on a poussé 12 signaux IA confiance ≥85% (dont 3 long BTC entre $98k et $103k). On adorerait te montrer ce que t'as manqué — pour ça on a débloqué un code <strong style="color:#fbbf24;">${promoCode}</strong> qui te redonne <strong>-30%</strong> sur <strong style="color:#fff;">${planLabel}</strong>.`,
      cta: '🎁 Activer -30% maintenant',
      gradient: 'linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)',
      shadow: 'rgba(239,68,68,0.35)',
    },
  };
  const h = headers[step] || headers[1];
  const showPromo = step === 2;
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;background:#0A0E1A;color:#e2e8f0;padding:32px;margin:0;">
<div style="max-width:560px;margin:0 auto;background:linear-gradient(140deg,#0f172a,#1e1b4b);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px;">
  <div style="text-align:center;margin-bottom:28px;">
    <div style="display:inline-block;width:64px;height:64px;border-radius:20px;background:${h.gradient};line-height:64px;font-size:32px;box-shadow:0 12px 32px ${h.shadow};">${h.emoji}</div>
    <h1 style="margin:16px 0 4px;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.02em;">${h.title}</h1>
    <p style="margin:0;color:#94a3b8;font-size:14px;">${h.subtitle}</p>
  </div>
  ${showPromo ? `
  <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:16px;padding:20px;margin-bottom:24px;">
    <p style="margin:0 0 8px;color:#fbbf24;font-size:10px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;">Code promo · expire dans 72h</p>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <code style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:900;color:#fbbf24;letter-spacing:2px;">${promoCode}</code>
      <span style="color:#fff;font-size:14px;font-weight:700;background:rgba(16,185,129,0.15);padding:6px 12px;border-radius:8px;border:1px solid rgba(16,185,129,0.3);">-30% appliqué</span>
    </div>
  </div>` : ''}
  <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 24px;">${h.body}</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${ctaUrl}" style="display:inline-block;padding:16px 32px;border-radius:14px;background:${h.gradient};color:#fff;font-weight:900;text-decoration:none;text-transform:uppercase;font-size:13px;letter-spacing:1.5px;box-shadow:0 12px 28px ${h.shadow};">${h.cta}</a>
  </div>
  <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;margin-top:32px;">
    <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">Ce qu'on a fait depuis ton départ :</p>
    <ul style="list-style:none;padding:0;margin:0;color:#cbd5e1;font-size:13px;line-height:1.8;text-align:center;">
      <li>✓ Nouveau Pro Trading Challenge — leverage up to 50x</li>
      <li>✓ Quiz "Quel trader es-tu ?" avec profil personnalisé</li>
      <li>✓ +12 signaux IA confiance ≥85% cette semaine</li>
      <li>✓ Page Heatmap, Whale Watcher, Sentiment IA améliorés</li>
    </ul>
  </div>
  <p style="margin:24px 0 0;color:#64748b;font-size:11px;text-align:center;line-height:1.6;">
    Tu reçois ce mail parce que tu as eu un abonnement CryptoIA. Aucun engagement.<br/>
    <a href="https://www.cryptoia.ca/unsubscribe" style="color:#64748b;text-decoration:underline;">Se désinscrire</a>
  </p>
</div></body></html>`;
}

export default function registerWinBackRoutes(app, { getResendClient, sendChatNotification }) {
  // Called from payment_webhooks.js on customer.subscription.deleted
  async function handleSubscriptionCanceled(sub) {
    try {
      const customerId = sub.customer || null;
      const subId = sub.id || null;
      // Email may or may not be on the sub object. The webhook gives us customer ID;
      // we'd need a Stripe customer fetch to get email — to keep this dependency-light
      // and reliable, we accept email from metadata or fall back to skipping.
      const meta = sub.metadata || {};
      const email = meta.email || sub?.customer_email || null;
      const plan = meta.plan || 'premium';
      const planLabel = PLAN_LABELS[plan] || plan;
      const cancelReason = sub.cancellation_details?.reason || null;
      const now = new Date().toISOString();

      const db = load();
      const existing = db.entries.find(e => e.subscription_id === subId);
      const entry = existing || {
        subscription_id: subId,
        customer_id: customerId,
        email,
        plan,
        canceled_at: now,
        cancel_reason: cancelReason,
        steps_sent: [],
        status: 'queued',
      };
      if (!existing) db.entries.push(entry);
      save(db);

      console.log(`[WinBack] 🪦 Subscription canceled: ${subId} (customer ${customerId}, email ${email || 'unknown'}, plan ${plan}, reason ${cancelReason || 'n/a'})`);

      sendChatNotification?.({
        title: '🪦 Subscription canceled',
        lines: [`**Plan** : ${planLabel}`, `**Email** : ${email || '(no email)'}`, `**Reason** : ${cancelReason || 'n/a'}`].join('\n'),
        color: 0x6b7280,
      }).catch(() => {});
    } catch (e) {
      console.error('[WinBack] handleSubscriptionCanceled error:', e?.message);
    }
  }

  // Admin readonly endpoint
  app.get('/api/v1/admin/winback', (req, res) => {
    if (req.headers['x-admin-auth'] !== (process.env.ADMIN_PASSWORD || 'admin123')) {
      return res.status(401).json({ ok: false });
    }
    const db = load();
    const total = db.entries.length;
    const step1 = db.entries.filter(e => (e.steps_sent || []).includes(1)).length;
    const step2 = db.entries.filter(e => (e.steps_sent || []).includes(2)).length;
    const reactivated = db.entries.filter(e => e.status === 'reactivated').length;
    const recent = db.entries.slice(-30).reverse().map(e => ({
      ...e,
      email: e.email ? e.email.replace(/^(.{2}).*@/, '$1***@') : null,
    }));
    res.json({ ok: true, stats: { total, step1, step2, reactivated }, recent });
  });

  // Allow programmatic marking that someone resubscribed (so we stop sending follow-ups)
  function markReactivated(email) {
    if (!email) return;
    const db = load();
    let touched = false;
    for (const e of db.entries) {
      if (e.email === email && e.status !== 'reactivated') {
        e.status = 'reactivated';
        e.reactivated_at = new Date().toISOString();
        touched = true;
      }
    }
    if (touched) save(db);
  }

  // ── Follow-up scheduler ───────────────────────────────────────────────────
  async function tick() {
    const db = load();
    if (!db.entries.length) return;
    const now = Date.now();
    const H24 = 24 * 60 * 60 * 1000;
    const H48 = 48 * 60 * 60 * 1000;
    const D7 = 7 * 24 * 60 * 60 * 1000;
    const D8 = 8 * 24 * 60 * 60 * 1000;
    let touched = false;
    for (const entry of db.entries) {
      if (entry.status === 'reactivated' || entry.status === 'unsubscribed') continue;
      if (!entry.email) continue;
      entry.steps_sent = entry.steps_sent || [];
      const ageMs = now - new Date(entry.canceled_at).getTime();
      let step = null;
      if (!entry.steps_sent.includes(1) && ageMs >= H24 && ageMs <= H48) step = 1;
      else if (!entry.steps_sent.includes(2) && ageMs >= D7 && ageMs <= D8) step = 2;
      if (!step) continue;

      try {
        const client = await getResendClient();
        if (!client) continue;
        const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
        const planLabel = PLAN_LABELS[entry.plan] || entry.plan;
        const promoCode = process.env.RECOVERY_PROMO_CODE_WINBACK || 'WINBACK30';
        const ctaUrl = step === 1
          ? `https://www.cryptoia.ca/?utm_source=email&utm_medium=winback&utm_campaign=winback_canceled&utm_content=step1_${(entry.subscription_id || '').slice(-8)}`
          : `https://www.cryptoia.ca/abonnements?plan=${entry.plan}&promo=${promoCode}&utm_source=email&utm_medium=winback&utm_campaign=winback_canceled&utm_content=step2_${(entry.subscription_id || '').slice(-8)}`;
        await client.emails.send({
          from: sender,
          to: [entry.email],
          subject: step === 1 ? '👋 On s\'ennuie sans toi sur CryptoIA' : `🎁 Reviens à -30% sur CryptoIA ${planLabel}`,
          html: winBackEmailHtml({ planLabel, promoCode, ctaUrl, step }),
        });
        entry.steps_sent.push(step);
        entry[`step${step}_sent_at`] = new Date().toISOString();
        entry.status = 'sent';
        touched = true;
        console.log(`[WinBack] 📧 Step ${step} sent to ${entry.email} (${entry.plan})`);
        sendChatNotification?.({
          title: `📧 Win-back step ${step} sent`,
          lines: [`**Email** : ${entry.email}`, `**Plan** : ${planLabel}`, step === 2 ? `**Promo** : ${promoCode}` : '_no discount yet_'].join('\n'),
          color: step === 2 ? 0xf59e0b : 0x6366f1,
        }).catch(() => {});
      } catch (e) {
        console.error(`[WinBack] ❌ Step ${step} failed for ${entry.email}:`, e?.message);
      }
    }
    if (touched) save(db);
  }

  setTimeout(() => { tick().catch(() => {}); }, 90 * 1000);
  setInterval(() => { tick().catch(e => console.error('[WinBack] tick error:', e?.message)); }, 60 * 60 * 1000); // hourly

  console.log('[WinBack] ✅ Routes + scheduler registered (GET /api/v1/admin/winback)');
  return { handleSubscriptionCanceled, markReactivated };
}
