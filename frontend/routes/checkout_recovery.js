// Stripe Checkout Recovery — abandoned cart email automation
// Triggers on Stripe webhook `checkout.session.expired` (sent ~24h after creation if not completed).
// Sends ONE recovery email with code promo LASTCHANCE20 (-20%).
//
// Why this matters: industry stats show 60-80% of Stripe checkouts are abandoned.
// A recovery email recovers 10-30% of those lost sales.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE = path.join(__dirname, '..', 'data', 'checkout_recovery.json');

function load() {
  try { if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
  return { recoveries: [] };
}
function save(data) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch (e) { console.error('[CheckoutRecovery] save error:', e?.message); }
}

const PLAN_LABELS = {
  premium: 'Premium',
  pro: 'Pro',
  vip: 'VIP',
  starter: 'Starter',
};

function recoveryEmailHtml({ planLabel, amount, promoCode, recoveryUrl }) {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;background:#0A0E1A;color:#e2e8f0;padding:32px;margin:0;">
<div style="max-width:560px;margin:0 auto;background:linear-gradient(140deg,#0f172a,#1e1b4b);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px;">
  <div style="text-align:center;margin-bottom:28px;">
    <div style="display:inline-block;width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#f59e0b,#ef4444);line-height:64px;font-size:32px;box-shadow:0 12px 32px rgba(245,158,11,0.3);">🎁</div>
    <h1 style="margin:16px 0 4px;color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.02em;">Votre abonnement vous attend</h1>
    <p style="margin:0;color:#94a3b8;font-size:14px;">Profitez de -20% sur votre prochain paiement</p>
  </div>

  <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:16px;padding:20px;margin-bottom:24px;">
    <p style="margin:0 0 8px;color:#fbbf24;font-size:10px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;">Code promo exclusif</p>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <code style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:900;color:#fbbf24;letter-spacing:2px;">${promoCode}</code>
      <span style="color:#fff;font-size:14px;font-weight:700;background:rgba(16,185,129,0.15);padding:6px 12px;border-radius:8px;border:1px solid rgba(16,185,129,0.3);">-20% appliqué</span>
    </div>
  </div>

  <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 12px;">Vous avez récemment commencé un abonnement <strong style="color:#fff;">${planLabel}</strong> mais ne l'avez pas finalisé.</p>
  <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 24px;">Pour vous remercier de votre intérêt, voici <strong style="color:#fbbf24;">20 % de réduction</strong> sur votre prochaine tentative — valable 48 heures.</p>

  <div style="text-align:center;margin:32px 0;">
    <a href="${recoveryUrl}" style="display:inline-block;padding:16px 32px;border-radius:14px;background:linear-gradient(135deg,#f59e0b 0%,#ef4444 100%);color:#fff;font-weight:900;text-decoration:none;text-transform:uppercase;font-size:13px;letter-spacing:1.5px;box-shadow:0 12px 28px rgba(239,68,68,0.35);">Réactiver mon abonnement</a>
  </div>

  <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;margin-top:32px;">
    <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">Pourquoi CryptoIA ?</p>
    <ul style="list-style:none;padding:0;margin:0;color:#cbd5e1;font-size:13px;line-height:1.8;text-align:center;">
      <li>✓ Signaux IA scalp & range (confiance ≥85%)</li>
      <li>✓ 50+ outils crypto pro</li>
      <li>✓ Alertes Telegram en temps réel</li>
      <li>✓ Annulation en 1 clic à tout moment</li>
    </ul>
  </div>

  <p style="margin:24px 0 0;color:#64748b;font-size:11px;text-align:center;line-height:1.6;">
    Code valable 48 h. Une seule utilisation par compte. CryptoIA — Analyse Crypto IA.<br/>
    <a href="https://www.cryptoia.ca/unsubscribe" style="color:#64748b;text-decoration:underline;">Se désinscrire</a>
  </p>
</div></body></html>`;
}

export default function registerCheckoutRecoveryRoutes(app, { getResendClient, sendChatNotification }) {
  // Called from payment_webhooks.js when Stripe sends checkout.session.expired
  async function handleExpiredCheckout(session) {
    const email = session.customer_details?.email || session.customer_email || null;
    const metadata = session.metadata || {};
    const plan = metadata.plan || 'premium';
    const planLabel = PLAN_LABELS[plan] || plan;
    const amount = (session.amount_total || 0) / 100;
    const sessionId = session.id;

    if (!email) {
      console.log(`[CheckoutRecovery] ⚠️ Stripe event received but no email (test webhook?) — recording without sending. Session: ${sessionId}`);
      const db = load();
      if (!db.recoveries.some(r => r.session_id === sessionId)) {
        db.recoveries.push({
          session_id: sessionId, email: null, plan, amount,
          expired_at: new Date().toISOString(),
          email_sent_at: null,
          status: 'no_email',
          note: 'Stripe webhook received but no customer email (likely test event)',
        });
        save(db);
      }
      return;
    }

    const db = load();
    // Idempotency: don't double-send if we've already processed this session
    if (db.recoveries.some(r => r.session_id === sessionId)) {
      console.log(`[CheckoutRecovery] ⏭️ Already sent for session ${sessionId}`);
      return;
    }

    const promoCode = process.env.RECOVERY_PROMO_CODE || 'LASTCHANCE20';
    const recoveryUrl = `https://www.cryptoia.ca/abonnements?plan=${plan}&promo=${promoCode}&utm_source=email&utm_medium=recovery&utm_campaign=abandoned_checkout&utm_content=${sessionId.slice(-8)}`;

    // Send email via Resend
    try {
      const client = await getResendClient();
      if (!client) {
        console.warn('[CheckoutRecovery] ⚠️ Resend not configured — recording but not sending');
        db.recoveries.push({
          session_id: sessionId, email, plan, amount,
          expired_at: new Date().toISOString(),
          email_sent_at: null, status: 'pending_resend',
        });
        save(db);
        return;
      }

      const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
      await client.emails.send({
        from: sender,
        to: [email],
        subject: `🎁 -20% sur votre abonnement CryptoIA ${planLabel} (offre limitée)`,
        html: recoveryEmailHtml({ planLabel, amount, promoCode, recoveryUrl }),
      });
      db.recoveries.push({
        session_id: sessionId, email, plan, amount,
        expired_at: new Date().toISOString(),
        email_sent_at: new Date().toISOString(),
        promo_code: promoCode,
        status: 'sent',
      });
      save(db);
      console.log(`[CheckoutRecovery] ✅ Recovery email sent to ${email} (${plan} - $${amount})`);

      // Discord/Slack notification (optional)
      sendChatNotification?.({
        title: `📧 Recovery email envoyé`,
        lines: [
          `**Email** : ${email}`,
          `**Plan** : ${planLabel} ($${amount})`,
          `**Code promo** : ${promoCode} (-20%)`,
        ].join('\n'),
        color: 0xf59e0b,
      }).catch(() => {});
    } catch (e) {
      console.error('[CheckoutRecovery] ❌ Send failed:', e?.message);
      db.recoveries.push({
        session_id: sessionId, email, plan, amount,
        expired_at: new Date().toISOString(),
        email_sent_at: null,
        status: 'error',
        error: e?.message?.slice(0, 200),
      });
      save(db);
    }
  }

  // Mark a checkout as completed (called from payment_webhooks on checkout.session.completed)
  function markCompleted(sessionId, usedPromo = null) {
    const db = load();
    const entry = db.recoveries.find(r => r.session_id === sessionId);
    if (entry) {
      entry.recovered_at = new Date().toISOString();
      entry.recovered_with_promo = usedPromo;
      entry.status = 'recovered';
      save(db);
      console.log(`[CheckoutRecovery] 🎉 Recovery successful for ${entry.email} (promo: ${usedPromo || 'none'})`);
    }
  }

  // ─── GET /api/v1/admin/checkout-recovery — stats for admin dashboard ───
  app.get('/api/v1/admin/checkout-recovery', (req, res) => {
    const db = load();
    const stats = {
      total: db.recoveries.length,
      sent: db.recoveries.filter(r => r.status === 'sent' || r.status === 'recovered').length,
      recovered: db.recoveries.filter(r => r.status === 'recovered').length,
      pending: db.recoveries.filter(r => r.status === 'pending_resend').length,
      errors: db.recoveries.filter(r => r.status === 'error').length,
      total_amount_at_risk: db.recoveries.filter(r => r.status === 'sent').reduce((s, r) => s + (r.amount || 0), 0),
      total_amount_recovered: db.recoveries.filter(r => r.status === 'recovered').reduce((s, r) => s + (r.amount || 0), 0),
      recovery_rate_pct: db.recoveries.filter(r => r.status === 'sent' || r.status === 'recovered').length
        ? Math.round(100 * db.recoveries.filter(r => r.status === 'recovered').length / db.recoveries.filter(r => r.status === 'sent' || r.status === 'recovered').length)
        : 0,
    };
    const recent = db.recoveries.slice(-30).reverse().map(r => ({
      ...r,
      email: r.email ? r.email.replace(/^(.{2}).*@/, '$1***@') : null, // mask email for privacy
    }));
    res.json({ ok: true, stats, recent });
  });

  console.log('[CheckoutRecovery] ✅ Routes registered (GET /api/v1/admin/checkout-recovery)');

  return { handleExpiredCheckout, markCompleted };
}
