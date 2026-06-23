// Onboarding Email Sequence — J+1, J+3, J+7 nurture campaign for new free signups
// When a user signs up (POST /api/users/create), we schedule them into the funnel.
// A scheduler (1x/15min) checks who needs which email and sends via Resend.
//
// Funnel design:
//   J+1: Welcome + 1st free signal demo (build trust)
//   J+3: Advanced use case ("comment gagner +25%") (educate)
//   J+7: Limited -20% offer on Advanced plan (convert)
//
// All sends are tracked in data/onboarding_events.json (one row per send) to:
//   1. Prevent duplicate sends
//   2. Show admin stats (open rate, click rate via Resend webhooks if configured)
//
// Admin endpoints:
//   GET  /api/v1/admin/onboarding/stats          — overview of funnel
//   GET  /api/v1/admin/onboarding/events?limit=100 — recent send events
//   POST /api/v1/admin/onboarding/preview?step=1|3|7 — render an email preview
//   POST /api/v1/admin/onboarding/send-test?step=N&email=X — send one manually

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'onboarding_events.json');

// Sequence definition: days offset → step key
const SEQUENCE = [
  { step: 1, days: 1, key: 'welcome_signal' },
  { step: 2, days: 3, key: 'advanced_use_case' },
  { step: 3, days: 7, key: 'promo_20_off' },
];

function loadEvents() {
  try {
    if (fs.existsSync(EVENTS_FILE)) return JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
  } catch (e) { console.error('[Onboarding] loadEvents error:', e?.message); }
  return { events: [] };
}
function saveEvents(d) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(d, null, 2), 'utf8');
  } catch (e) { console.error('[Onboarding] saveEvents error:', e?.message); }
}

function userEligibleForStep(user, stepDef, allEvents) {
  if (!user.email || !user.created_at) return false;
  if (user.plan && user.plan !== 'free') return false; // already paying, skip the funnel
  const createdMs = Date.parse(user.created_at) || Date.now();
  const ageDays = (Date.now() - createdMs) / (1000 * 3600 * 24);
  if (ageDays < stepDef.days) return false;
  // Check if already sent
  const alreadySent = allEvents.some(e => e.username === user.username && e.step === stepDef.step);
  return !alreadySent;
}

// ─── Email templates (HTML, FR) ─────────────────────────────────────────────
const BRAND_HEADER = (lead) => `<div style="text-align:center;margin-bottom:24px;">
  <div style="display:inline-block;width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#10b981,#06b6d4);line-height:64px;font-size:30px;">📊</div>
  <h1 style="margin:12px 0 0;color:#fff;font-size:24px;font-weight:900;">${lead}</h1>
</div>`;

const BRAND_FOOTER = `<div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;font-size:11px;color:#64748b;">
  CryptoIA — Signaux Crypto IA Made in Canada<br>
  <a href="https://www.cryptoia.ca" style="color:#06b6d4;text-decoration:none;">www.cryptoia.ca</a>
  · <a href="https://www.cryptoia.ca/mon-compte" style="color:#94a3b8;text-decoration:none;">Mon compte</a>
</div>`;

function emailWrap(innerHtml) {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#030712;color:#e2e8f0;padding:32px;margin:0;">
<div style="max-width:560px;margin:0 auto;background:linear-gradient(140deg,#0f172a,#1e1b4b);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:32px;">
${innerHtml}
${BRAND_FOOTER}
</div></body></html>`;
}

function template_J1_welcome(user) {
  const name = user.username.split('@')[0];
  const innerHtml = `${BRAND_HEADER('Bienvenue ' + name + ' ! 🎉')}
<p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 16px;">Tu viens de rejoindre CryptoIA, la plateforme #1 de signaux crypto IA au Canada. 🇨🇦</p>
<p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 20px;">Pour bien démarrer, voici un <strong style="color:#fff;">signal IA gratuit</strong> que je viens d'analyser sur Bitcoin :</p>
<div style="padding:20px;border-radius:12px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.25);margin-bottom:24px;">
  <p style="color:#34d399;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-weight:700;">🟢 Signal IA — Démo gratuite</p>
  <p style="color:#fff;font-size:16px;line-height:1.5;margin:0 0 8px;font-weight:600;">📈 Bitcoin (BTC/USD) — Setup Range Long</p>
  <p style="color:#cbd5e1;font-size:13px;line-height:1.5;margin:0;">Entrée si BTC tient au-dessus de la MA50 (D1) avec volume > moyenne 7j. Stop-loss : -3.2% du prix d'entrée. Target 1 : +5.5%. Target 2 : +9.8%.</p>
</div>
<p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 20px;">Sur l'<strong style="color:#fff;">abonnement Advanced</strong>, tu reçois ces signaux <strong>directement sur Telegram</strong> en temps réel, avec 5-8 setups par jour sur Bitcoin, Ethereum, Solana et 50+ altcoins.</p>
<div style="text-align:center;margin:24px 0;">
  <a href="https://www.cryptoia.ca/abonnements" style="display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#10b981,#06b6d4);color:#fff;font-weight:900;text-decoration:none;text-transform:uppercase;font-size:12px;letter-spacing:1.5px;">🚀 Essai gratuit 7 jours</a>
</div>
<p style="color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;margin:0;">Aucune carte requise pour l'essai. Annulation en 1 clic à tout moment.</p>`;
  return {
    subject: '👋 Bienvenue chez CryptoIA — Voici ton 1er signal IA gratuit',
    html: emailWrap(innerHtml),
  };
}

function template_J3_advanced(user) {
  const name = user.username.split('@')[0];
  const innerHtml = `${BRAND_HEADER('Comment gagner +25% en 30 jours 📈')}
<p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 16px;">Salut ${name},</p>
<p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 20px;">Aujourd'hui je veux te montrer comment <strong style="color:#fff;">3 utilisateurs CryptoIA ont fait +25% en 30 jours</strong> avec une stratégie simple : la combinaison <strong>Signaux IA + DCA pondéré</strong>.</p>
<div style="padding:20px;border-radius:12px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.25);margin-bottom:20px;">
  <p style="color:#cbd5e1;font-size:13px;line-height:1.6;margin:0;"><strong style="color:#fff;">La méthode :</strong></p>
  <ol style="color:#cbd5e1;font-size:13px;line-height:1.7;margin:8px 0 0;padding-left:20px;">
    <li>Tu reçois 5-8 signaux/jour sur Telegram (BTC, ETH, SOL, alts)</li>
    <li>Tu prends UNIQUEMENT les signaux avec score IA &gt; 75%</li>
    <li>Tu alloues 1-2% de ton capital par trade max</li>
    <li>Tu laisses courir les gains, tu coupes les pertes au stop-loss</li>
  </ol>
</div>
<p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 20px;">Résultat moyen sur 30 jours : <strong style="color:#34d399;">+22% à +28%</strong> en backtest sur les 6 derniers mois.</p>
<p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 20px;">Et le mieux ? <strong>Tout est automatisé</strong> — tu reçois les alertes Telegram dès qu'un signal se déclenche. Pas besoin de scruter les graphiques 12h/jour.</p>
<div style="text-align:center;margin:24px 0;">
  <a href="https://www.cryptoia.ca/abonnements" style="display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#10b981,#06b6d4);color:#fff;font-weight:900;text-decoration:none;text-transform:uppercase;font-size:12px;letter-spacing:1.5px;">📲 Activer mes signaux</a>
</div>
<p style="color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;margin:0;">7 jours gratuits — annulation en 1 clic.</p>`;
  return {
    subject: '📈 La méthode pour gagner +25% en 30 jours (étude de cas)',
    html: emailWrap(innerHtml),
  };
}

function template_J7_promo_A(user) {
  // VARIANT A: -20% standard, 72h urgency, code WELCOME20
  const name = user.username.split('@')[0];
  const innerHtml = `${BRAND_HEADER('⏰ Offre limitée -20% pour toi')}
<p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 16px;">Salut ${name},</p>
<p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 20px;">Ça fait 7 jours que tu es chez nous, et je voulais te remercier en t'offrant un <strong style="color:#fff;">-20% exclusif</strong> sur ton premier abonnement Advanced.</p>
<div style="padding:24px;border-radius:16px;background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(251,113,133,0.1));border:1px solid rgba(245,158,11,0.3);margin-bottom:24px;text-align:center;">
  <p style="color:#fbbf24;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;font-weight:700;">🎁 Code promo</p>
  <p style="color:#fff;font-size:32px;font-weight:900;font-family:monospace;letter-spacing:3px;margin:0 0 12px;">WELCOME20</p>
  <p style="color:#fcd34d;font-size:13px;line-height:1.5;margin:0;"><strong>-20% sur ton 1er mois OU 1ère année</strong><br>+ 7 jours d'essai gratuit en cadeau</p>
</div>
<p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 8px;">Ce que tu débloques avec Advanced :</p>
<ul style="color:#cbd5e1;font-size:14px;line-height:1.8;margin:0 0 20px;padding-left:20px;">
  <li>✅ <strong style="color:#fff;">5-8 signaux IA/jour</strong> sur Telegram (entrée, stop-loss, target)</li>
  <li>✅ <strong style="color:#fff;">Scanner 200+ paires</strong> en temps réel</li>
  <li>✅ <strong style="color:#fff;">Alertes Telegram instantanées</strong> 24/7</li>
  <li>✅ <strong style="color:#fff;">Analyses macro & news</strong> filtrées par IA</li>
  <li>✅ <strong style="color:#fff;">Accès au discord premium</strong> (communauté pros)</li>
</ul>
<div style="text-align:center;margin:24px 0;">
  <a href="https://www.cryptoia.ca/abonnements?promo=WELCOME20" style="display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;font-weight:900;text-decoration:none;text-transform:uppercase;font-size:12px;letter-spacing:1.5px;">⚡ Activer mon -20%</a>
</div>
<p style="color:#94a3b8;font-size:11px;line-height:1.6;text-align:center;margin:0;">⏰ Offre valable 72h seulement. Code WELCOME20 à entrer au checkout Stripe.</p>`;
  return {
    subject: '🎁 -20% exclusif sur ton 1er mois CryptoIA (72h seulement)',
    html: emailWrap(innerHtml),
  };
}

function template_J7_promo_B(user) {
  // VARIANT B: -30% aggressive, 24h urgency, code FLASH30
  const name = user.username.split('@')[0];
  const innerHtml = `${BRAND_HEADER('🔥 FLASH SALE — 24h seulement')}
<p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 16px;">Salut ${name},</p>
<p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 20px;">J'ai une <strong style="color:#fff;">offre flash exceptionnelle</strong> pour toi. Tu es l'un de mes utilisateurs gratuits depuis 7 jours, alors je débloque la promo qu'on n'offre <strong>JAMAIS</strong> habituellement :</p>
<div style="padding:24px;border-radius:16px;background:linear-gradient(135deg,rgba(239,68,68,0.15),rgba(220,38,38,0.2));border:2px solid rgba(239,68,68,0.5);margin-bottom:24px;text-align:center;box-shadow:0 0 24px rgba(239,68,68,0.2);">
  <p style="color:#fca5a5;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;font-weight:700;">🔥 Code flash · 24h</p>
  <p style="color:#fff;font-size:38px;font-weight:900;font-family:monospace;letter-spacing:4px;margin:0 0 8px;">FLASH30</p>
  <p style="color:#fef3c7;font-size:14px;line-height:1.5;margin:0;"><strong>-30% sur ton 1er mois OU 1ère année</strong><br>(au lieu du -20% standard)</p>
</div>
<p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 12px;text-align:center;"><strong style="color:#fbbf24;">⚠️ Cette offre expire dans 24h chrono.</strong> Elle ne reviendra pas avant 6 mois minimum.</p>
<ul style="color:#cbd5e1;font-size:14px;line-height:1.8;margin:0 0 20px;padding-left:20px;">
  <li>✅ <strong style="color:#fff;">Signaux IA Telegram</strong> en temps réel (5-8/jour)</li>
  <li>✅ <strong style="color:#fff;">200+ paires scannées</strong> 24/7</li>
  <li>✅ <strong style="color:#fff;">Discord premium</strong> exclusif</li>
  <li>✅ <strong style="color:#fff;">Garantie satisfait ou remboursé 30 jours</strong></li>
</ul>
<div style="text-align:center;margin:24px 0;">
  <a href="https://www.cryptoia.ca/abonnements?promo=FLASH30" style="display:inline-block;padding:16px 40px;border-radius:12px;background:linear-gradient(135deg,#dc2626,#f59e0b);color:#fff;font-weight:900;text-decoration:none;text-transform:uppercase;font-size:13px;letter-spacing:1.5px;box-shadow:0 4px 12px rgba(239,68,68,0.4);">🔥 Débloquer le -30% maintenant</a>
</div>
<p style="color:#94a3b8;font-size:11px;line-height:1.6;text-align:center;margin:0;">⏰ Code FLASH30 valide pendant 24h. Stripe Checkout sécurisé.</p>`;
  return {
    subject: '🔥 FLASH 24h — Code FLASH30 pour -30% (au lieu de -20%)',
    html: emailWrap(innerHtml),
  };
}

// Pick variant deterministically based on username (so previews/sends are stable for the same user)
function pickJ7Variant(username) {
  // Simple deterministic hash: sum of char codes mod 2
  let h = 0;
  for (let i = 0; i < (username || '').length; i++) h = (h + username.charCodeAt(i)) % 1000;
  return h % 2 === 0 ? 'A' : 'B';
}

function template_J7_promo(user) {
  // Dispatcher — chooses A or B and returns the rendered template (we tag the variant separately)
  const variant = pickJ7Variant(user.username || user.email || '');
  const tpl = variant === 'A' ? template_J7_promo_A(user) : template_J7_promo_B(user);
  tpl.variant = variant;
  return tpl;
}

function renderTemplate(step, user) {
  if (step === 1) return template_J1_welcome(user);
  if (step === 2) return template_J3_advanced(user);
  if (step === 3) return template_J7_promo(user);
  return null;
}

// ─── Re-engagement template (used when J+1 wasn't opened after 48h) ─────
function template_J1_reengage(user) {
  const name = (user.username || user.email || '').split('@')[0];
  const innerHtml = `${BRAND_HEADER('Tu as oublié ton bonus ? 👀')}
<p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 16px;">Salut ${name},</p>
<p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 20px;">Tu n'as pas encore consulté mon dernier email — pas de souci, je te remets l'essentiel ici en 30 secondes ⏱️</p>
<div style="padding:20px;border-radius:12px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.3);margin-bottom:24px;">
  <p style="color:#a5b4fc;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;font-weight:700;">⚡ Ton accès gratuit inclut</p>
  <ul style="color:#cbd5e1;font-size:13px;line-height:1.8;margin:0;padding-left:20px;">
    <li><strong style="color:#fff;">1 signal IA Bitcoin gratuit</strong> chaque jour</li>
    <li><strong style="color:#fff;">Heatmap des 100 cryptos</strong> en temps réel</li>
    <li><strong style="color:#fff;">Calculatrice de position</strong> avec gestion du risque</li>
    <li><strong style="color:#fff;">Top 5 narratives</strong> mises à jour à 9h EST</li>
  </ul>
</div>
<p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 20px;">Et si tu veux passer au niveau supérieur, l'<strong style="color:#fff;">essai gratuit 7 jours Advanced</strong> est toujours actif. Aucune carte requise.</p>
<div style="text-align:center;margin:24px 0;">
  <a href="https://www.cryptoia.ca/abonnements" style="display:inline-block;padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:900;text-decoration:none;text-transform:uppercase;font-size:12px;letter-spacing:1.5px;">🚀 Tester gratuitement</a>
</div>
<p style="color:#94a3b8;font-size:11px;line-height:1.6;text-align:center;margin:0;">Si tu ne veux plus recevoir ces emails, <a href="https://www.cryptoia.ca/mon-compte" style="color:#64748b;">désabonne-toi en 1 clic</a>.</p>`;
  return {
    subject: '👀 Tu as oublié ton bonus crypto (rappel)',
    html: emailWrap(innerHtml),
  };
}

// ─── Sender helper ──────────────────────────────────────────────────────────
async function sendOne(user, stepDef, getResendClient) {
  const tpl = renderTemplate(stepDef.step, user);
  if (!tpl) return { ok: false, reason: 'unknown_step' };
  const client = await getResendClient();
  if (!client) return { ok: false, reason: 'no_resend_client' };
  const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
  try {
    // Tag the email so Resend webhooks can attribute opens/clicks back to
    // the onboarding step (consumed in routes/resend_webhook.js).
    const tags = [
      { name: 'category', value: 'onboarding' },
      { name: 'step', value: String(stepDef.step) },
      { name: 'key', value: stepDef.key },
    ];
    if (tpl.variant) tags.push({ name: 'variant', value: tpl.variant });
    const resp = await client.emails.send({
      from: sender,
      to: [user.email],
      subject: tpl.subject,
      html: tpl.html,
      tags,
    });
    const emailId = resp?.data?.id || resp?.id || null;
    return { ok: true, variant: tpl.variant || null, email_id: emailId };
  } catch (e) {
    console.error('[Onboarding] send error:', e?.message);
    return { ok: false, reason: 'send_error', error: e?.message };
  }
}

// ─── Re-engagement sender ───────────────────────────────────────────────────
// Sends a single follow-up email to a user whose J+1 (step 1) message was
// delivered but not opened after REENGAGE_AFTER_HOURS. We tag the email with
// reengagement=1 so future analytics can isolate its performance.
async function sendReengagement(user, originalEvent, getResendClient) {
  const tpl = template_J1_reengage(user);
  const client = await getResendClient();
  if (!client) return { ok: false, reason: 'no_resend_client' };
  const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
  try {
    const tags = [
      { name: 'category', value: 'onboarding' },
      { name: 'step', value: '1' },
      { name: 'key', value: 'welcome_signal_reengage' },
      { name: 'reengagement', value: '1' },
    ];
    const resp = await client.emails.send({
      from: sender,
      to: [user.email],
      subject: tpl.subject,
      html: tpl.html,
      tags,
    });
    const emailId = resp?.data?.id || resp?.id || null;
    // Mark the original event so we don't send again
    originalEvent.reengagement_sent_at = new Date().toISOString();
    originalEvent.reengagement_email_id = emailId;
    return { ok: true, email_id: emailId };
  } catch (e) {
    console.error('[Onboarding] reengage send error:', e?.message);
    originalEvent.reengagement_error = e?.message;
    originalEvent.reengagement_sent_at = new Date().toISOString(); // mark to avoid retry storm
    return { ok: false, reason: 'send_error', error: e?.message };
  }
}

// ─── Scheduler: check every 15 min, send pending emails ─────────────────────
let _scheduler = null;
let _lastTickAt = null;
let _lastTickError = null;
function startScheduler({ loadUsers, getResendClient }) {
  if (_scheduler) clearInterval(_scheduler);
  const TICK_MS = 15 * 60 * 1000;
  const REENGAGE_ENABLED = process.env.ONBOARDING_REENGAGEMENT_ENABLED !== 'false';
  const REENGAGE_AFTER_HOURS = parseInt(process.env.ONBOARDING_REENGAGEMENT_HOURS || '48', 10);
  const REENGAGE_AFTER_MS = REENGAGE_AFTER_HOURS * 60 * 60 * 1000;

  const tick = async () => {
    _lastTickAt = new Date().toISOString();
    _lastTickError = null;
    try {
      const users = loadUsers();
      const usersByEmail = new Map((users || []).map(u => [(u.email || '').toLowerCase(), u]));
      const events = loadEvents();
      let sentCount = 0;
      let reengageCount = 0;
      let reengageErrorCount = 0;

      // 1) Normal funnel sending (J+1 / J+3 / J+7)
      for (const user of users) {
        for (const stepDef of SEQUENCE) {
          if (userEligibleForStep(user, stepDef, events.events)) {
            const result = await sendOne(user, stepDef, getResendClient);
            events.events.push({
              ts: new Date().toISOString(),
              username: user.username,
              email: user.email,
              step: stepDef.step,
              key: stepDef.key,
              ok: result.ok,
              variant: result.variant || null,
              email_id: result.email_id || null,
              opened_at: null,
              clicked_at: null,
              bounced_at: null,
              complained_at: null,
              error: result.error || null,
            });
            if (result.ok) sentCount++;
          }
        }
      }

      // 2) Re-engagement: J+1 emails delivered >48h ago but never opened
      if (REENGAGE_ENABLED) {
        const now = Date.now();
        for (const e of events.events) {
          if (e.step !== 1 || !e.ok) continue;
          if (e.opened_at || e.clicked_at) continue;
          if (e.reengagement_sent_at) continue;
          if (e.bounced_at || e.complained_at) continue;
          const sentTs = new Date(e.ts).getTime();
          if (now - sentTs < REENGAGE_AFTER_MS) continue;
          const user = usersByEmail.get((e.email || '').toLowerCase());
          if (!user) continue;
          const result = await sendReengagement(user, e, getResendClient);
          if (result.ok) reengageCount++;
          else reengageErrorCount++;
        }
      }

      // IMPORTANT: persist also when only errors occurred so that the
      // reengagement_sent_at "lock" we set on failures isn't lost — this
      // prevents the retry storm flagged in the testing agent code review.
      if (sentCount > 0 || reengageCount > 0 || reengageErrorCount > 0) {
        saveEvents(events);
        const parts = [];
        if (sentCount) parts.push(`${sentCount} funnel`);
        if (reengageCount) parts.push(`${reengageCount} reengage`);
        if (reengageErrorCount) parts.push(`${reengageErrorCount} reengage-err`);
        console.log(`[Onboarding] ✉️ Tick: ${parts.join(' + ')}`);
      }
    } catch (e) {
      _lastTickError = e?.message || String(e);
      console.error('[Onboarding] tick error:', _lastTickError);
    }
  };
  // First run after 30s, then every 15min
  setTimeout(tick, 30 * 1000);
  _scheduler = setInterval(tick, TICK_MS);
  console.log(`[Onboarding] ✅ Scheduler started (check every 15min, reengagement ${REENGAGE_ENABLED ? `after ${REENGAGE_AFTER_HOURS}h` : 'DISABLED'})`);
}

// ─── Routes ─────────────────────────────────────────────────────────────────
export default function registerOnboardingRoutes(app, { loadUsers, getResendClient, requireAdmin }) {
  try {
    startScheduler({ loadUsers, getResendClient });
  } catch (e) {
    console.error('[Onboarding] Failed to start scheduler:', e?.message);
  }
  const adminGuard = requireAdmin || ((_req, _res, next) => next());

  app.get('/api/v1/admin/onboarding/stats', adminGuard, (_req, res) => {
    const events = loadEvents().events;
    const users = loadUsers() || [];
    const byStep = { 1: 0, 2: 0, 3: 0 };
    const okByStep = { 1: 0, 2: 0, 3: 0 };
    const failedByStep = { 1: 0, 2: 0, 3: 0 };
    const recipientsByStep = { 1: new Set(), 2: new Set(), 3: new Set() };
    for (const e of events) {
      byStep[e.step] = (byStep[e.step] || 0) + 1;
      if (e.ok) {
        okByStep[e.step] = (okByStep[e.step] || 0) + 1;
        if (e.username) recipientsByStep[e.step].add(e.username);
      } else {
        failedByStep[e.step] = (failedByStep[e.step] || 0) + 1;
      }
    }

    // Conversion: of users who received step N, how many became paid (plan != 'free')
    const usersByUsername = new Map(users.map(u => [u.username, u]));
    const convertedByStep = { 1: 0, 2: 0, 3: 0 };
    for (const step of [1, 2, 3]) {
      for (const username of recipientsByStep[step]) {
        const u = usersByUsername.get(username);
        if (u && u.plan && u.plan !== 'free') convertedByStep[step]++;
      }
    }

    const totalFreeUsers = users.filter(u => u.email && (u.plan || 'free') === 'free').length;
    const totalUsersWithEmail = users.filter(u => u.email).length;
    const totalPaidUsers = users.filter(u => u.plan && u.plan !== 'free').length;
    const totalUsers = users.length;

    // Funnel computation per step: recipients → converted
    const funnel = SEQUENCE.map(s => {
      const recipients = recipientsByStep[s.step].size;
      const converted = convertedByStep[s.step];
      const conversionRate = recipients > 0 ? (converted / recipients) * 100 : 0;
      return {
        step: s.step,
        days: s.days,
        key: s.key,
        sent_total: byStep[s.step] || 0,
        sent_success: okByStep[s.step] || 0,
        sent_failed: failedByStep[s.step] || 0,
        unique_recipients: recipients,
        converted_to_paid: converted,
        conversion_rate_pct: Number(conversionRate.toFixed(2)),
      };
    });

    // A/B test stats for step 3 (J+7 promo): split by variant A vs B
    const j7VariantA = { recipients: new Set(), converted: 0 };
    const j7VariantB = { recipients: new Set(), converted: 0 };
    for (const e of events) {
      if (e.step !== 3 || !e.ok || !e.username) continue;
      if (e.variant === 'A') j7VariantA.recipients.add(e.username);
      else if (e.variant === 'B') j7VariantB.recipients.add(e.username);
    }
    for (const username of j7VariantA.recipients) {
      const u = usersByUsername.get(username);
      if (u && u.plan && u.plan !== 'free') j7VariantA.converted++;
    }
    for (const username of j7VariantB.recipients) {
      const u = usersByUsername.get(username);
      if (u && u.plan && u.plan !== 'free') j7VariantB.converted++;
    }
    const ab_test_j7 = {
      variant_A: {
        label: '-20% / 72h / WELCOME20',
        recipients: j7VariantA.recipients.size,
        converted: j7VariantA.converted,
        conversion_rate_pct: j7VariantA.recipients.size > 0 ? Number(((j7VariantA.converted / j7VariantA.recipients.size) * 100).toFixed(2)) : 0,
      },
      variant_B: {
        label: '-30% / 24h / FLASH30',
        recipients: j7VariantB.recipients.size,
        converted: j7VariantB.converted,
        conversion_rate_pct: j7VariantB.recipients.size > 0 ? Number(((j7VariantB.converted / j7VariantB.recipients.size) * 100).toFixed(2)) : 0,
      },
    };
    ab_test_j7.winner = ab_test_j7.variant_A.conversion_rate_pct > ab_test_j7.variant_B.conversion_rate_pct ? 'A'
      : ab_test_j7.variant_B.conversion_rate_pct > ab_test_j7.variant_A.conversion_rate_pct ? 'B'
      : null;

    res.json({
      ok: true,
      sequence: SEQUENCE,
      totals: {
        total_users: totalUsers,
        total_users_with_email: totalUsersWithEmail,
        total_free_users_with_email: totalFreeUsers,
        total_paid_users: totalPaidUsers,
      },
      funnel,
      ab_test_j7,
      sent_total: events.length,
      last_5_events: events.slice(-5).reverse(),
    });
  });

  // ─── Re-engagement stats (J+1 non-openers got a follow-up) ───────────────
  app.get('/api/v1/admin/onboarding/reengagement', adminGuard, (_req, res) => {
    const events = loadEvents().events;
    const j1Events = events.filter(e => e.step === 1 && e.ok);
    const eligible = j1Events.filter(e => !e.opened_at && !e.clicked_at && !e.bounced_at && !e.complained_at);
    const sent = j1Events.filter(e => e.reengagement_sent_at);
    const errors = j1Events.filter(e => e.reengagement_error);
    res.json({
      ok: true,
      enabled: process.env.ONBOARDING_REENGAGEMENT_ENABLED !== 'false',
      after_hours: parseInt(process.env.ONBOARDING_REENGAGEMENT_HOURS || '48', 10),
      last_tick_at: _lastTickAt,
      last_tick_error: _lastTickError,
      j1_total_sent: j1Events.length,
      j1_pending_non_openers: eligible.length,
      reengagement_sent: sent.length,
      reengagement_errors: errors.length,
      recent: sent.slice(-10).reverse().map(e => ({
        ts: e.ts,
        reengagement_sent_at: e.reengagement_sent_at,
        email: e.email,
        username: e.username,
        original_email_id: e.email_id,
        reengagement_email_id: e.reengagement_email_id,
        error: e.reengagement_error,
      })),
    });
  });

  app.get('/api/v1/admin/onboarding/events', adminGuard, (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const events = loadEvents().events.slice(-limit).reverse();
    res.json({ ok: true, events });
  });

  app.post('/api/v1/admin/onboarding/preview', adminGuard, (req, res) => {
    const step = parseInt(req.query.step || req.body?.step || '1');
    const forcedVariant = (req.query.variant || req.body?.variant || '').toString().toUpperCase();
    const fakeUser = { username: 'demo_user', email: 'demo@example.com', created_at: new Date().toISOString() };
    let tpl;
    if (step === 3 && (forcedVariant === 'A' || forcedVariant === 'B')) {
      tpl = forcedVariant === 'A' ? template_J7_promo_A(fakeUser) : template_J7_promo_B(fakeUser);
      tpl.variant = forcedVariant;
    } else {
      tpl = renderTemplate(step, fakeUser);
    }
    if (!tpl) return res.status(400).json({ ok: false, error: 'invalid step' });
    const variantTag = tpl.variant ? ` · Variant ${tpl.variant}` : '';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html><html><body><div style="padding:8px 16px;background:#fef3c7;font-family:sans-serif;font-size:13px;">📧 <strong>Aperçu Onboarding Step ${step}${variantTag}</strong> — Subject : <em>${tpl.subject}</em></div>${tpl.html}</body></html>`);
  });

  app.post('/api/v1/admin/onboarding/send-test', adminGuard, async (req, res) => {
    const step = parseInt(req.query.step || req.body?.step || '1');
    const email = (req.query.email || req.body?.email || '').toString();
    const forcedVariant = (req.query.variant || req.body?.variant || '').toString().toUpperCase();
    if (!email.includes('@')) return res.status(400).json({ ok: false, error: 'invalid email' });
    const fakeUser = { username: email, email, created_at: new Date().toISOString() };
    const stepDef = SEQUENCE.find(s => s.step === step);
    if (!stepDef) return res.status(400).json({ ok: false, error: 'invalid step' });
    // For test: respect forced variant by patching pickJ7Variant via a temp wrapper
    if (step === 3 && (forcedVariant === 'A' || forcedVariant === 'B')) {
      const client = await getResendClient();
      if (!client) return res.json({ ok: false, reason: 'no_resend_client' });
      const tpl = forcedVariant === 'A' ? template_J7_promo_A(fakeUser) : template_J7_promo_B(fakeUser);
      const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
      try {
        await client.emails.send({ from: sender, to: [email], subject: tpl.subject, html: tpl.html });
        return res.json({ ok: true, variant: forcedVariant });
      } catch (e) {
        return res.json({ ok: false, reason: 'send_error', error: e?.message });
      }
    }
    const result = await sendOne(fakeUser, stepDef, getResendClient);
    res.json(result);
  });

  console.log('[Onboarding] ✅ Routes registered (/api/v1/admin/onboarding/*)');
}
