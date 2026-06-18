// Email Drip Sequence — automated onboarding after lead magnet capture
// Sends 5 emails over 7 days to warm leads → convert to /abonnements with BIENVENUE20 (-20%)
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEAD_FILE = path.join(__dirname, '..', 'data', 'lead_magnet_subscribers.json');

function loadLeads() {
  try { if (fs.existsSync(LEAD_FILE)) return JSON.parse(fs.readFileSync(LEAD_FILE, 'utf8')); } catch {}
  return { subscribers: [] };
}
function saveLeads(data) {
  try {
    fs.mkdirSync(path.dirname(LEAD_FILE), { recursive: true });
    fs.writeFileSync(LEAD_FILE, JSON.stringify(data, null, 2));
  } catch (e) { console.error('[EmailSeq] save error:', e?.message); }
}

// Drip schedule: each step fires after X hours from initial signup
const SCHEDULE = [
  // step 0 = guide email, already sent immediately by lead_magnet.js
  { step: 1, delay_hours: 24, key: 'pitfall' },
  { step: 2, delay_hours: 72, key: 'testimonial' },
  { step: 3, delay_hours: 120, key: 'promo' },
  { step: 4, delay_hours: 168, key: 'recap' },
];

function unsubFooter(token, lang, baseUrl) {
  const unsubUrl = `${baseUrl}/api/v1/lead-magnet/unsubscribe?token=${token}`;
  return lang === 'en'
    ? `<p style="margin:32px 0 0 0;font-size:11px;color:#6b7280;text-align:center;line-height:1.5;">
        You received this email because you downloaded our free guide.<br>
        <a href="${unsubUrl}" style="color:#9ca3af;">Unsubscribe</a> · © CryptoIA · <a href="https://www.cryptoia.ca" style="color:#a78bfa;">cryptoia.ca</a>
      </p>`
    : `<p style="margin:32px 0 0 0;font-size:11px;color:#6b7280;text-align:center;line-height:1.5;">
        Tu reçois cet email car tu as téléchargé notre guide gratuit.<br>
        <a href="${unsubUrl}" style="color:#9ca3af;">Se désinscrire</a> · © CryptoIA · <a href="https://www.cryptoia.ca" style="color:#a78bfa;">cryptoia.ca</a>
      </p>`;
}

function htmlShell({ title, badgeLabel, gradient, body, footer }) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e7eb;">
<div style="max-width:640px;margin:0 auto;background:#0f0f1a;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
  <div style="background:${gradient};padding:32px 28px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:99px;padding:6px 14px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-weight:800;color:white;margin-bottom:12px;">${badgeLabel}</div>
    <h1 style="margin:0;font-size:24px;line-height:1.3;color:white;font-weight:900;">${title}</h1>
  </div>
  <div style="padding:28px;">${body}${footer}</div>
</div></body></html>`;
}

function buildEmail(key, lang, token, baseUrl = 'https://www.cryptoia.ca') {
  const isEn = lang === 'en';
  const ctaLink = (url, label, color = '#4f46e5') =>
    `<div style="margin:24px 0;text-align:center;"><a href="${url}" style="display:inline-block;background:white;color:${color};padding:14px 28px;border-radius:99px;text-decoration:none;font-weight:900;font-size:14px;">${label}</a></div>`;
  const footer = unsubFooter(token, lang, baseUrl);

  if (key === 'pitfall') {
    const title = isEn
      ? 'The #1 trap 80% of crypto traders fall into'
      : 'Le piège #1 dans lequel tombent 80% des traders crypto';
    const badge = isEn ? 'Day 1 · Mindset' : 'Jour 1 · Mindset';
    const body = isEn ? `
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 16px 0;">Yesterday, you got our guide on the Top 10 indicators. But knowing them isn't enough.</p>
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 16px 0;">Here's the brutal truth: <strong style="color:white;">80% of retail traders lose money</strong>. Not because their indicators are wrong. Because of <strong style="color:#fbbf24;">emotions</strong>.</p>
      <div style="background:#0a0a14;border-left:3px solid #ef4444;border-radius:10px;padding:18px;margin:20px 0;">
        <p style="margin:0;font-size:14px;color:#fca5a5;font-weight:700;">⚠️ The fatal pattern:</p>
        <ol style="margin:10px 0 0 0;padding-left:20px;color:#d1d5db;font-size:14px;line-height:1.7;">
          <li>BTC dumps 5% → you panic-sell at the bottom</li>
          <li>BTC pumps 10% → you FOMO-buy at the top</li>
          <li>Repeat 3 times → portfolio down 30%</li>
        </ol>
      </div>
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 16px 0;">The solution: <strong style="color:#a78bfa;">remove emotions from the equation</strong>. Use an AI that scans signals 24/7 and tells you exactly when to enter/exit — with zero hesitation.</p>
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 8px 0;">That's exactly what we built CryptoIA for. See it in action:</p>
      ${ctaLink(`${baseUrl}/ai-signals`, 'See live AI signals →')}
      <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">Tomorrow: a real story from one of our users 👀</p>
    ` : `
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 16px 0;">Hier, tu as reçu notre guide sur le Top 10 des indicateurs. Mais les connaître ne suffit pas.</p>
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 16px 0;">La vérité brutale : <strong style="color:white;">80% des traders particuliers perdent de l'argent</strong>. Pas à cause d'indicateurs incorrects. À cause des <strong style="color:#fbbf24;">émotions</strong>.</p>
      <div style="background:#0a0a14;border-left:3px solid #ef4444;border-radius:10px;padding:18px;margin:20px 0;">
        <p style="margin:0;font-size:14px;color:#fca5a5;font-weight:700;">⚠️ Le pattern fatal :</p>
        <ol style="margin:10px 0 0 0;padding-left:20px;color:#d1d5db;font-size:14px;line-height:1.7;">
          <li>BTC chute de 5% → tu paniques-vends au plus bas</li>
          <li>BTC pump de 10% → tu FOMO-achètes au sommet</li>
          <li>Répète 3 fois → portfolio à -30%</li>
        </ol>
      </div>
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 16px 0;">La solution : <strong style="color:#a78bfa;">retirer les émotions de l'équation</strong>. Utilise une IA qui scanne les signaux 24/7 et te dit exactement quand entrer/sortir — sans hésitation.</p>
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 8px 0;">C'est exactement pour ça que CryptoIA existe. Vois-la en action :</p>
      ${ctaLink(`${baseUrl}/ai-signals`, 'Voir les signaux IA en direct →')}
      <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">Demain : l'histoire vraie d'un de nos utilisateurs 👀</p>
    `;
    return {
      subject: isEn ? 'The #1 trap 80% of crypto traders fall into' : 'Le piège #1 dans lequel tombent 80% des traders crypto',
      html: htmlShell({ title, badgeLabel: badge, gradient: 'linear-gradient(135deg,#7f1d1d 0%,#991b1b 50%,#ef4444 100%)', body, footer }),
    };
  }

  if (key === 'testimonial') {
    const title = isEn ? 'The 4 tools most-used by our beta testers' : 'Les 4 outils les plus utilisés par nos beta testeurs';
    const badge = isEn ? 'Day 3 · Features' : 'Jour 3 · Outils';
    const body = isEn ? `
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 16px 0;">We don't publish fake testimonials — instead, here are the 4 tools that our beta testers open every single day. Take a look:</p>
      <div style="background:#0a0a14;border:1px solid rgba(168,85,247,0.3);border-radius:14px;padding:22px;margin:20px 0;">
        <ol style="margin:0;padding-left:22px;color:#d1d5db;font-size:14px;line-height:1.85;">
          <li><strong style="color:#a78bfa;">AI Signals</strong> — live buy/sell on 200+ pairs, with Telegram alerts</li>
          <li><strong style="color:#a78bfa;">Whale Watcher</strong> — track what wallets >100 BTC are doing right now</li>
          <li><strong style="color:#a78bfa;">Fear &amp; Greed</strong> — when to buy (below 25) and take profits (above 75)</li>
          <li><strong style="color:#a78bfa;">Gem Hunter</strong> — find undervalued altcoins before the crowd</li>
        </ol>
      </div>
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 8px 0;">If you've already had positive results with CryptoIA, we'd love to publish your real verified story. <a href="${baseUrl}/success-stories" style="color:#a78bfa;">Share it here.</a></p>
      ${ctaLink(`${baseUrl}/ai-signals`, 'Try AI Signals →')}
    ` : `
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 16px 0;">On ne publie pas de faux témoignages — voici à la place les 4 outils que nos beta testeurs ouvrent chaque jour. Regarde :</p>
      <div style="background:#0a0a14;border:1px solid rgba(168,85,247,0.3);border-radius:14px;padding:22px;margin:20px 0;">
        <ol style="margin:0;padding-left:22px;color:#d1d5db;font-size:14px;line-height:1.85;">
          <li><strong style="color:#a78bfa;">AI Signals</strong> — buy/sell en direct sur 200+ paires, avec alertes Telegram</li>
          <li><strong style="color:#a78bfa;">Whale Watcher</strong> — vois ce que font les wallets &gt;100 BTC en temps réel</li>
          <li><strong style="color:#a78bfa;">Fear &amp; Greed</strong> — quand acheter (sous 25) et prendre profits (au-dessus 75)</li>
          <li><strong style="color:#a78bfa;">Gem Hunter</strong> — trouve les altcoins sous-valorisés avant la foule</li>
        </ol>
      </div>
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 8px 0;">Si CryptoIA t'a déjà donné des résultats positifs, on serait ravis de publier ta vraie histoire vérifiée. <a href="${baseUrl}/success-stories" style="color:#a78bfa;">Partage-la ici.</a></p>
      ${ctaLink(`${baseUrl}/ai-signals`, 'Tester les signaux IA →')}
    `;
    return {
      subject: title,
      html: htmlShell({ title, badgeLabel: badge, gradient: 'linear-gradient(135deg,#065f46 0%,#0d9488 50%,#06b6d4 100%)', body, footer }),
    };
  }

  if (key === 'promo') {
    const title = isEn ? '🎁 Your -20% offer (48h only)' : '🎁 Ton offre -20% (48h seulement)';
    const badge = isEn ? 'Day 5 · Limited Offer' : 'Jour 5 · Offre limitée';
    const body = isEn ? `
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 16px 0;">You've been with us for 5 days. You've seen the indicators. You've read Marc's story. Now it's your turn.</p>
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 16px 0;">We're offering you <strong style="color:#fbbf24;">-20% on your first month</strong> of Premium — but only for the next 48 hours.</p>
      <div style="background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:16px;padding:28px;text-align:center;margin:24px 0;">
        <div style="font-size:14px;color:rgba(255,255,255,0.9);text-transform:uppercase;letter-spacing:2px;font-weight:800;margin-bottom:8px;">Promo code</div>
        <div style="font-size:36px;color:white;font-weight:900;letter-spacing:4px;font-family:'SF Mono',Consolas,monospace;">BIENVENUE20</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:8px;">-20% on first month · Apply at checkout</div>
      </div>
      <p style="font-size:14px;color:#d1d5db;text-align:center;margin:0 0 8px 0;">Premium @ <span style="text-decoration:line-through;color:#9ca3af;">49.99$</span> <span style="color:#34d399;font-weight:900;">39.99$ CAD</span></p>
      ${ctaLink(`${baseUrl}/abonnements?promo=BIENVENUE20`, 'Claim my -20% →', '#7c3aed')}
      <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">⏰ Offer expires in 48 hours. After that, no more discount.</p>
    ` : `
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 16px 0;">Tu es avec nous depuis 5 jours. Tu as vu les indicateurs. Tu as lu l'histoire de Marc. À toi maintenant.</p>
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 16px 0;">On te propose <strong style="color:#fbbf24;">-20% sur ton premier mois</strong> Premium — mais seulement pour les 48 prochaines heures.</p>
      <div style="background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:16px;padding:28px;text-align:center;margin:24px 0;">
        <div style="font-size:14px;color:rgba(255,255,255,0.9);text-transform:uppercase;letter-spacing:2px;font-weight:800;margin-bottom:8px;">Code promo</div>
        <div style="font-size:36px;color:white;font-weight:900;letter-spacing:4px;font-family:'SF Mono',Consolas,monospace;">BIENVENUE20</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:8px;">-20% sur le premier mois · Applique au checkout</div>
      </div>
      <p style="font-size:14px;color:#d1d5db;text-align:center;margin:0 0 8px 0;">Premium @ <span style="text-decoration:line-through;color:#9ca3af;">49.99$</span> <span style="color:#34d399;font-weight:900;">39.99$ CAD</span></p>
      ${ctaLink(`${baseUrl}/abonnements?promo=BIENVENUE20`, 'Obtenir mes -20% →', '#7c3aed')}
      <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">⏰ Offre valable 48 heures. Au-delà, plus de réduction.</p>
    `;
    return {
      subject: title,
      html: htmlShell({ title, badgeLabel: badge, gradient: 'linear-gradient(135deg,#4c1d95 0%,#7c3aed 50%,#ec4899 100%)', body, footer }),
    };
  }

  if (key === 'recap') {
    const title = isEn ? 'Last call — what you\'re missing 👀' : 'Dernière chance — ce que tu rates 👀';
    const badge = isEn ? 'Day 7 · Last Call' : 'Jour 7 · Dernière chance';
    const body = isEn ? `
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 16px 0;">A quick recap of what's waiting for you in CryptoIA Premium:</p>
      <ul style="margin:0 0 20px 0;padding-left:20px;color:#d1d5db;font-size:14px;line-height:2;">
        <li>🎯 <strong style="color:white;">AI signals 24/7</strong> on 200+ pairs (with Telegram alerts)</li>
        <li>📊 <strong style="color:white;">Real-time market dashboard</strong> (heatmap, dominance, fear &amp; greed, on-chain)</li>
        <li>🐋 <strong style="color:white;">Whale Watcher</strong>: see what the big wallets are doing</li>
        <li>💎 <strong style="color:white;">Gem Hunter</strong>: discover undervalued altcoins before everyone else</li>
        <li>📅 <strong style="color:white;">Weekly AI report</strong>: macro analysis + top trades for the week</li>
        <li>🎓 <strong style="color:white;">Trading Academy</strong>: courses, strategies, backtests</li>
      </ul>
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 8px 0;"><strong style="color:#fbbf24;">⏰ BIENVENUE20 still works for a few hours.</strong></p>
      ${ctaLink(`${baseUrl}/abonnements?promo=BIENVENUE20`, 'Start my -20% trial →', '#4f46e5')}
      <p style="font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;margin:16px 0 0 0;">Not the right time? No worries. We'll be here when you're ready.<br>You can <a href="${baseUrl}/api/v1/lead-magnet/unsubscribe?token=${token}" style="color:#9ca3af;">unsubscribe anytime</a>.</p>
    ` : `
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 16px 0;">Un récap rapide de ce qui t'attend dans CryptoIA Premium :</p>
      <ul style="margin:0 0 20px 0;padding-left:20px;color:#d1d5db;font-size:14px;line-height:2;">
        <li>🎯 <strong style="color:white;">Signaux IA 24/7</strong> sur 200+ paires (avec alertes Telegram)</li>
        <li>📊 <strong style="color:white;">Dashboard marché temps réel</strong> (heatmap, dominance, fear &amp; greed, on-chain)</li>
        <li>🐋 <strong style="color:white;">Whale Watcher</strong> : vois ce que font les gros portefeuilles</li>
        <li>💎 <strong style="color:white;">Gem Hunter</strong> : découvre les altcoins sous-valorisés avant tout le monde</li>
        <li>📅 <strong style="color:white;">Rapport IA hebdomadaire</strong> : analyse macro + top trades de la semaine</li>
        <li>🎓 <strong style="color:white;">Trading Academy</strong> : cours, stratégies, backtests</li>
      </ul>
      <p style="font-size:15px;line-height:1.65;color:#d1d5db;margin:0 0 8px 0;"><strong style="color:#fbbf24;">⏰ BIENVENUE20 fonctionne encore quelques heures.</strong></p>
      ${ctaLink(`${baseUrl}/abonnements?promo=BIENVENUE20`, 'Démarrer mon essai -20% →', '#4f46e5')}
      <p style="font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;margin:16px 0 0 0;">Pas le bon moment ? Aucun souci. On sera là quand tu seras prêt.<br>Tu peux <a href="${baseUrl}/api/v1/lead-magnet/unsubscribe?token=${token}" style="color:#9ca3af;">te désinscrire à tout moment</a>.</p>
    `;
    return {
      subject: title,
      html: htmlShell({ title, badgeLabel: badge, gradient: 'linear-gradient(135deg,#1e3a8a 0%,#3730a3 50%,#7c3aed 100%)', body, footer }),
    };
  }
  return null;
}

export default function register(app, { resendClientGetter }) {
  const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
  const INTERVAL_MS = 30 * 60 * 1000; // tick every 30 min
  const STARTUP_DELAY_MS = 60 * 1000; // wait 1 min after boot before first tick

  async function tick() {
    try {
      const db = loadLeads();
      const now = Date.now();
      const due = [];
      for (const sub of db.subscribers) {
        if (sub.unsubscribed) continue;
        const startTs = new Date(sub.subscribed_at).getTime();
        const currentStep = sub.sequence_step || 0;
        for (const sched of SCHEDULE) {
          if (sched.step <= currentStep) continue;
          if (now - startTs >= sched.delay_hours * 3600 * 1000) {
            due.push({ sub, sched });
            break; // process one step per tick per sub
          }
        }
      }
      if (due.length === 0) return;
      const resendClient = typeof resendClientGetter === 'function' ? await resendClientGetter() : null;
      if (!resendClient) {
        console.warn(`[EmailSeq] ${due.length} emails due but Resend unavailable`);
        return;
      }
      const from = process.env.RESEND_FROM_EMAIL || 'CryptoIA <noreply@cryptoia.ca>';
      for (const { sub, sched } of due) {
        if (!sub.unsub_token) sub.unsub_token = crypto.randomBytes(16).toString('hex');
        const built = buildEmail(sched.key, sub.lang || 'fr', sub.unsub_token, baseUrl);
        if (!built) continue;
        try {
          await resendClient.emails.send({ from, to: sub.email, subject: built.subject, html: built.html });
          sub.sequence_step = sched.step;
          sub.last_sequence_sent_at = new Date().toISOString();
          console.log(`[EmailSeq] Sent ${sched.key} (step=${sched.step}) to ${sub.email}`);
        } catch (e) {
          console.error(`[EmailSeq] Send error for ${sub.email}:`, e?.message);
        }
      }
      saveLeads(db);
    } catch (e) {
      console.error('[EmailSeq] tick error:', e?.message);
    }
  }

  setTimeout(() => { tick(); setInterval(tick, INTERVAL_MS); }, STARTUP_DELAY_MS);
  console.log(`[EmailSeq] Drip scheduler initialized — ticking every ${INTERVAL_MS / 60000} min, first run in ${STARTUP_DELAY_MS / 1000}s`);

  // ─── Unsubscribe endpoint (token-based, one-click) ───
  app.get('/api/v1/lead-magnet/unsubscribe', (req, res) => {
    const token = String(req.query.token || '').trim();
    if (!token) return res.status(400).send('<h1>Invalid link</h1>');
    const db = loadLeads();
    const sub = db.subscribers.find(s => s.unsub_token === token);
    if (!sub) return res.status(404).send('<h1>Subscriber not found</h1>');
    sub.unsubscribed = true;
    sub.unsubscribed_at = new Date().toISOString();
    saveLeads(db);
    res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0a0a14;color:white;text-align:center;padding:80px 20px;">
      <h1 style="color:#34d399;">✓ Désinscription confirmée</h1>
      <p>Tu ne recevras plus d'emails de notre part. Merci d'avoir essayé CryptoIA.</p>
      <p><a href="https://www.cryptoia.ca" style="color:#a78bfa;">← Retour au site</a></p>
    </body></html>`);
  });

  // ─── Admin endpoint: get sequence stats ───
  app.get('/api/v1/lead-magnet/sequence-stats', (req, res) => {
    const db = loadLeads();
    const total = db.subscribers.length;
    const stepCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    let unsubscribed = 0;
    for (const s of db.subscribers) {
      if (s.unsubscribed) { unsubscribed++; continue; }
      stepCounts[s.sequence_step || 0] = (stepCounts[s.sequence_step || 0] || 0) + 1;
    }
    res.json({ ok: true, total, unsubscribed, by_step: stepCounts });
  });
}
