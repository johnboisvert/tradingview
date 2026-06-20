// Referral Program — "Mon Parrainage"
// Each user gets a unique referral code. When a filleul signs up + pays via that code:
//   - Filleul gets -20% on their FIRST payment (monthly OR annual) via a Stripe coupon
//   - Parrain gets +1 month free credit (added to freeMonthsCredit on their user record)
// Anti-fraud: same card fingerprint OR same email as parrain → NO credit awarded
//
// All external deps are passed via dependency injection from server.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REFERRAL_COUPON_ID = 'CRYPTOIA_REFERRAL_20';
const REFERRAL_COUPON_PERCENT_OFF = 20;
const FREE_MONTHS_PER_FILLEUL = 1;

// In-memory cache so we don't hit Stripe for every checkout
let _couponEnsuredAt = 0;
const COUPON_CACHE_TTL_MS = 60 * 60 * 1000; // 1h

// ─── Code generation ─────────────────────────────────────────────────────────
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion

function generateReferralCode(username) {
  // Take first 4 chars of username (alnum, uppercased) + 4 random chars from alphabet
  const prefix = String(username || 'USER')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X');
  let suffix = '';
  const bytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    suffix += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${prefix}-${suffix}`;
}

// ─── Stripe coupon helper ────────────────────────────────────────────────────
async function ensureReferralCoupon(getStripeInstance) {
  const now = Date.now();
  if (now - _couponEnsuredAt < COUPON_CACHE_TTL_MS) return REFERRAL_COUPON_ID;
  try {
    const stripe = await getStripeInstance();
    if (!stripe) return null;
    try {
      await stripe.coupons.retrieve(REFERRAL_COUPON_ID);
      _couponEnsuredAt = now;
      console.log(`[Referral] Stripe coupon ${REFERRAL_COUPON_ID} OK`);
      return REFERRAL_COUPON_ID;
    } catch (err) {
      if (err?.code === 'resource_missing') {
        await stripe.coupons.create({
          id: REFERRAL_COUPON_ID,
          percent_off: REFERRAL_COUPON_PERCENT_OFF,
          duration: 'once', // ⭐ ONLY first invoice (one-time discount)
          name: 'CryptoIA Parrainage -20%',
          metadata: { source: 'referral_program' },
        });
        _couponEnsuredAt = now;
        console.log(`[Referral] ✅ Stripe coupon ${REFERRAL_COUPON_ID} created (-${REFERRAL_COUPON_PERCENT_OFF}% once)`);
        return REFERRAL_COUPON_ID;
      }
      throw err;
    }
  } catch (e) {
    console.error('[Referral] ensureReferralCoupon error:', e?.message);
    return null;
  }
}

// ─── User helpers (operate on the shared users.json) ─────────────────────────
export function ensureUserReferralCode(user, allUsers) {
  if (user.referralCode) return user.referralCode;
  let code;
  let attempts = 0;
  do {
    code = generateReferralCode(user.username);
    attempts++;
  } while (allUsers.some(u => u.referralCode === code) && attempts < 20);
  user.referralCode = code;
  return code;
}

function findUserByReferralCode(users, code) {
  if (!code) return null;
  const upper = String(code).trim().toUpperCase();
  return users.find(u => (u.referralCode || '').toUpperCase() === upper) || null;
}

function emailsMatch(a, b) {
  if (!a || !b) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

// ─── Routes registration ─────────────────────────────────────────────────────
export default function registerReferralRoutes(app, {
  loadUsers,
  saveUsers,
  getStripeInstance,
  recordAffiliationConversion,
  loadAffiliationEvents,
  getResendClient,
  sendChatNotification,
}) {
  // ─── GET /api/v1/referral/me?username=X — Get my referral profile ──────
  app.get('/api/v1/referral/me', (req, res) => {
    try {
      const username = String(req.query.username || '').trim();
      if (!username) return res.status(400).json({ error: 'username required' });
      const users = loadUsers();
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (!user) return res.status(404).json({ error: 'user not found' });
      const codeAssigned = !user.referralCode;
      ensureUserReferralCode(user, users);
      if (codeAssigned) saveUsers(users);

      const code = user.referralCode;
      const events = loadAffiliationEvents().filter(e => e.code === code);
      const clicks = events.filter(e => e.type === 'click').length;
      const signups = events.filter(e => e.type === 'signup').length;
      const conversions = events.filter(e => e.type === 'payment');
      const validConversions = conversions.filter(e => !e.fraud);
      const freeMonthsCredit = user.freeMonthsCredit || 0;

      return res.json({
        ok: true,
        referralCode: code,
        link: `https://www.cryptoia.ca/?ref=${code}`,
        stats: {
          clicks,
          signups,
          conversions: conversions.length,
          valid_conversions: validConversions.length,
          rejected_fraud: conversions.length - validConversions.length,
          total_revenue_generated: Number(conversions.reduce((s, e) => s + (Number(e.amount) || 0), 0).toFixed(2)),
        },
        rewards: {
          free_months_credit: freeMonthsCredit,
          free_months_per_filleul: FREE_MONTHS_PER_FILLEUL,
          filleul_discount_percent: REFERRAL_COUPON_PERCENT_OFF,
        },
        filleul_share_text: `J'utilise CryptoIA pour mes signaux crypto IA. Inscris-toi avec mon code et reçois -${REFERRAL_COUPON_PERCENT_OFF}% sur ton 1er mois: https://www.cryptoia.ca/?ref=${code}`,
      });
    } catch (e) {
      console.error('[Referral /me] error:', e?.message);
      return res.status(500).json({ error: 'internal error' });
    }
  });

  // ─── GET /api/v1/referral/leaderboard — Top 10 parrains du mois courant ──
  app.get('/api/v1/referral/leaderboard', (req, res) => {
    try {
      const events = loadAffiliationEvents();
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEvents = events.filter(e => (e.ts || '') >= monthStart && !e.fraud);

      const byCode = {};
      for (const e of monthEvents) {
        if (!byCode[e.code]) byCode[e.code] = { code: e.code, clicks: 0, signups: 0, conversions: 0, revenue: 0 };
        if (e.type === 'click') byCode[e.code].clicks++;
        if (e.type === 'signup') byCode[e.code].signups++;
        if (e.type === 'payment') {
          byCode[e.code].conversions++;
          byCode[e.code].revenue += Number(e.amount) || 0;
        }
      }

      const users = loadUsers();
      const codeToUsername = new Map(
        users.filter(u => u.referralCode).map(u => [u.referralCode, u.username])
      );

      // Anonymize: only show 1st letter + initial of last name OR truncated username
      function anonymize(username) {
        if (!username) return 'Anonyme';
        const clean = String(username).split('@')[0].replace(/[^A-Za-z0-9]/g, '');
        if (clean.length <= 2) return clean.toUpperCase();
        return clean.charAt(0).toUpperCase() + clean.slice(1, 3).toLowerCase() + '***';
      }

      const top = Object.values(byCode)
        .map(s => ({
          code: s.code,
          alias: anonymize(codeToUsername.get(s.code) || s.code),
          conversions: s.conversions,
          signups: s.signups,
          clicks: s.clicks,
          revenue: Number(s.revenue.toFixed(2)),
          free_months_earned: s.conversions * FREE_MONTHS_PER_FILLEUL,
        }))
        .sort((a, b) => b.conversions - a.conversions || b.revenue - a.revenue || b.signups - a.signups)
        .slice(0, 10);

      return res.json({
        ok: true,
        period: monthStart.slice(0, 7),
        top,
        total_active_parrains: Object.keys(byCode).length,
      });
    } catch (e) {
      console.error('[Referral /leaderboard] error:', e?.message);
      return res.status(500).json({ error: 'internal error' });
    }
  });

  // ─── GET /api/v1/referral/coupon-id — Returns coupon ID if a ref_code is valid ──
  // Used by the payment endpoint to apply Stripe discount on filleul checkout
  app.get('/api/v1/referral/coupon-id', async (req, res) => {
    try {
      const refCode = String(req.query.ref_code || '').trim().toUpperCase();
      if (!refCode || refCode.length < 4) return res.json({ ok: false, coupon_id: null });
      const users = loadUsers();
      const parrain = findUserByReferralCode(users, refCode);
      if (!parrain) return res.json({ ok: false, coupon_id: null, reason: 'invalid_code' });
      const couponId = await ensureReferralCoupon(getStripeInstance);
      return res.json({ ok: true, coupon_id: couponId, percent_off: REFERRAL_COUPON_PERCENT_OFF });
    } catch (e) {
      console.error('[Referral /coupon-id] error:', e?.message);
      return res.status(500).json({ ok: false, coupon_id: null });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Conversion handler: called by Stripe webhook on checkout.session.completed
  // Returns { credited, fraud, reason } so the webhook can log / notify
  // ═══════════════════════════════════════════════════════════════════════════
  async function handleReferralConversion({ refCode, filleulEmail, amount, sessionId, stripeCustomerId }) {
    if (!refCode || amount <= 0) return { credited: false, reason: 'no_ref_or_amount' };

    const users = loadUsers();
    const parrain = findUserByReferralCode(users, refCode);
    if (!parrain) {
      console.log(`[Referral] No parrain found for code=${refCode}`);
      return { credited: false, reason: 'invalid_code' };
    }

    // ─── Anti-fraud check 1: same email as parrain → REJECT ─────────────────
    if (emailsMatch(filleulEmail, parrain.username) || emailsMatch(filleulEmail, parrain.email)) {
      console.log(`[Referral] ⚠️ FRAUD: same email as parrain (${filleulEmail}) — credit DENIED`);
      recordAffiliationConversion({ code: refCode, type: 'payment', amount, email: filleulEmail, fraud: 'same_email' });
      return { credited: false, fraud: true, reason: 'same_email' };
    }

    // ─── Anti-fraud check 2: same card fingerprint as parrain ───────────────
    let filleulFingerprint = null;
    try {
      const stripe = await getStripeInstance();
      if (stripe && sessionId) {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['payment_intent.payment_method', 'subscription.default_payment_method'],
        });
        const pm =
          session?.payment_intent?.payment_method ||
          session?.subscription?.default_payment_method ||
          null;
        filleulFingerprint = pm?.card?.fingerprint || null;
        if (filleulFingerprint && parrain.cardFingerprint && filleulFingerprint === parrain.cardFingerprint) {
          console.log(`[Referral] ⚠️ FRAUD: same card fingerprint as parrain — credit DENIED`);
          recordAffiliationConversion({ code: refCode, type: 'payment', amount, email: filleulEmail, fraud: 'same_card' });
          return { credited: false, fraud: true, reason: 'same_card' };
        }
      }
    } catch (e) {
      console.error('[Referral] Stripe fingerprint check error:', e?.message);
      // Don't block on Stripe API errors — proceed cautiously
    }

    // ─── All clear: credit +1 month to parrain ──────────────────────────────
    parrain.freeMonthsCredit = (parrain.freeMonthsCredit || 0) + FREE_MONTHS_PER_FILLEUL;
    // Extend subscription_end by 1 month (if active subscription)
    if (parrain.subscription_end) {
      try {
        const end = new Date(parrain.subscription_end);
        end.setMonth(end.getMonth() + FREE_MONTHS_PER_FILLEUL);
        parrain.subscription_end = end.toISOString().split('T')[0];
      } catch (_) { /* ignore date parse error */ }
    }
    saveUsers(users);

    // Also store the filleul's fingerprint on their account if they have one
    if (filleulFingerprint && filleulEmail) {
      const filleulUser = users.find(u => emailsMatch(u.username, filleulEmail) || emailsMatch(u.email, filleulEmail));
      if (filleulUser && !filleulUser.cardFingerprint) {
        filleulUser.cardFingerprint = filleulFingerprint;
        saveUsers(users);
      }
    }

    recordAffiliationConversion({ code: refCode, type: 'payment', amount, email: filleulEmail });
    console.log(`[Referral] ✅ Parrain ${parrain.username} credited +${FREE_MONTHS_PER_FILLEUL} month (total: ${parrain.freeMonthsCredit})`);

    // Notify parrain by email (fire & forget)
    (async () => {
      try {
        const client = await getResendClient();
        if (!client) return;
        const recipient = parrain.email || (parrain.username.includes('@') ? parrain.username : null);
        if (!recipient) return;
        const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
        const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;background:#0A0E1A;color:#e2e8f0;padding:32px;"><div style="max-width:520px;margin:0 auto;background:linear-gradient(140deg,#0f172a,#1e1b4b);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:32px;"><div style="text-align:center;margin-bottom:24px;"><div style="display:inline-block;width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#10b981,#06b6d4);line-height:64px;font-size:28px;">🎁</div><h1 style="margin:12px 0 0;color:#fff;font-size:24px;">+1 mois gratuit !</h1><p style="color:#94a3b8;margin-top:8px;">Quelqu'un vient de s'abonner avec ton code de parrainage <strong style="color:#34d399;font-family:monospace;">${parrain.referralCode}</strong></p></div><div style="padding:20px;border-radius:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);text-align:center;margin-bottom:24px;"><p style="color:#94a3b8;font-size:12px;margin:0;">Crédit total accumulé</p><p style="color:#34d399;font-size:36px;font-weight:900;margin:8px 0;">${parrain.freeMonthsCredit} mois gratuit${parrain.freeMonthsCredit > 1 ? 's' : ''}</p><p style="color:#cbd5e1;font-size:13px;margin:0;">Continue à partager ton lien — chaque filleul converti = +1 mois !</p></div><div style="text-align:center;"><a href="https://www.cryptoia.ca/parrainage" style="display:inline-block;padding:12px 28px;border-radius:12px;background:linear-gradient(135deg,#10b981,#06b6d4);color:#fff;font-weight:900;text-decoration:none;text-transform:uppercase;font-size:12px;letter-spacing:1.5px;">📊 Voir mon parrainage</a></div></div></body></html>`;
        await client.emails.send({
          from: sender,
          to: [recipient],
          subject: `🎁 +1 mois gratuit CryptoIA grâce à ton parrainage !`,
          html,
        });
        console.log(`[Referral] Email parrain envoyé à ${recipient}`);
      } catch (e) {
        console.error('[Referral] email parrain error:', e?.message);
      }
    })();

    // Chat notification (Discord/Slack)
    sendChatNotification?.({
      title: `🎁 Nouvelle conversion parrainage !`,
      lines: `**Parrain** : ${parrain.username}\n**Code** : ${parrain.referralCode}\n**Filleul** : ${filleulEmail}\n**Montant** : $${amount.toFixed(2)} CAD\n**Crédit parrain** : +${FREE_MONTHS_PER_FILLEUL} mois (total: ${parrain.freeMonthsCredit})`,
      color: 0x10b981,
    }).catch(() => {});

    return { credited: true, parrain: parrain.username, total_free_months: parrain.freeMonthsCredit };
  }

  console.log('[Referral] ✅ Routes registered (/api/v1/referral/me, /leaderboard, /coupon-id)');

  return {
    handleReferralConversion,
    ensureReferralCoupon: () => ensureReferralCoupon(getStripeInstance),
    REFERRAL_COUPON_ID,
    REFERRAL_COUPON_PERCENT_OFF,
  };
}
