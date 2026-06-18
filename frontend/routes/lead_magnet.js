// Lead Magnet — captures emails from blog visitors + sends free guide via Resend
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
  } catch (e) { console.error('[LeadMagnet] save error:', e?.message); }
}

function buildGuideEmailHtml(lang) {
  const isEn = lang === 'en';
  const title = isEn
    ? 'Your Free Guide: Top 10 Crypto Indicators That Work in 2026'
    : 'Ton guide gratuit : Top 10 indicateurs crypto qui fonctionnent en 2026';
  const intro = isEn
    ? "Hi! 👋 Thanks for downloading our free guide. Here's the complete content (no PDF download needed — everything below)."
    : "Salut ! 👋 Merci d'avoir téléchargé notre guide gratuit. Voici le contenu complet (pas besoin de télécharger un PDF — tout est ci-dessous).";
  const indicators = isEn ? [
    { n: 1, name: 'RSI Divergence (D1)', desc: 'When price makes higher highs but RSI makes lower highs = bearish reversal incoming.' },
    { n: 2, name: 'MA 50/200 Crossover (Golden/Death Cross)', desc: 'Golden cross = strong bull signal. Death cross = bear market confirmed.' },
    { n: 3, name: 'Bitcoin Dominance Trend', desc: 'Above 55% = altcoins risky. Below 45% = altseason in progress.' },
    { n: 4, name: 'Fear & Greed Index', desc: 'Below 25 = oversold (buy zone). Above 75 = euphoria (take profits).' },
    { n: 5, name: 'Exchange Netflow (On-Chain)', desc: 'Strong outflows = HODLing = bullish. Strong inflows = selling pressure = bearish.' },
    { n: 6, name: 'Funding Rates (Perpetuals)', desc: 'Extreme positive funding = overleveraged longs → flush incoming. Negative = capitulation.' },
    { n: 7, name: 'Volume Profile (VPVR)', desc: 'Identify high-volume nodes = strong support/resistance levels.' },
    { n: 8, name: 'MVRV Z-Score', desc: 'Above 7 = cycle top warning. Below 0 = generational buy zone.' },
    { n: 9, name: 'Hash Ribbon (Bitcoin)', desc: 'Miner capitulation followed by recovery = historically a perfect BTC bottom signal.' },
    { n: 10, name: 'AI Signal Convergence (Bonus)', desc: 'When 3+ AI indicators align in the same direction → 72% historical precision on 7-day moves.' },
  ] : [
    { n: 1, name: 'Divergence RSI (D1)', desc: 'Quand le prix fait des plus hauts plus hauts mais le RSI des plus hauts plus bas = retournement baissier imminent.' },
    { n: 2, name: 'Croisement MA 50/200 (Golden/Death Cross)', desc: 'Golden cross = signal haussier fort. Death cross = bear market confirmé.' },
    { n: 3, name: 'Tendance Dominance Bitcoin', desc: 'Au-dessus de 55% = altcoins risqués. Sous 45% = altseason en cours.' },
    { n: 4, name: 'Fear & Greed Index', desc: 'Sous 25 = sursurvendu (zone d\'achat). Au-dessus de 75 = euphorie (prise de profits).' },
    { n: 5, name: 'Exchange Netflow (On-Chain)', desc: 'Forts outflows = HODLing = haussier. Forts inflows = pression vendeuse = baissier.' },
    { n: 6, name: 'Funding Rates (Perpétuels)', desc: 'Funding très positif = longs surleveragés → flush à venir. Négatif = capitulation.' },
    { n: 7, name: 'Volume Profile (VPVR)', desc: 'Identifie les nœuds de volume = niveaux de support/résistance forts.' },
    { n: 8, name: 'MVRV Z-Score', desc: 'Au-dessus de 7 = avertissement top de cycle. Sous 0 = zone d\'achat générationnelle.' },
    { n: 9, name: 'Hash Ribbon (Bitcoin)', desc: 'Capitulation des mineurs suivie d\'une reprise = signal historique de bottom BTC parfait.' },
    { n: 10, name: 'Convergence Signaux IA (Bonus)', desc: 'Quand 3+ indicateurs IA s\'alignent dans la même direction → 72% de précision historique sur 7 jours.' },
  ];

  const planTitle = isEn ? '🎯 Your 30-day action plan' : '🎯 Ton plan d\'action 30 jours';
  const plan = isEn ? [
    'Day 1-7: Learn each indicator on TradingView with BTC chart',
    'Day 8-14: Backtest 3 strategies combining 2-3 indicators',
    'Day 15-21: Paper trade with virtual money on the best strategy',
    'Day 22-30: Live trade with small position size (1-2% capital/trade)',
  ] : [
    'Jour 1-7 : Apprends chaque indicateur sur TradingView avec le chart BTC',
    'Jour 8-14 : Backtest 3 stratégies en combinant 2-3 indicateurs',
    'Jour 15-21 : Paper trade avec de l\'argent virtuel sur la meilleure stratégie',
    'Jour 22-30 : Live trade avec une petite taille (1-2% du capital/trade)',
  ];
  const cta = isEn ? 'Get all signals automatically with CryptoIA — 7-day free trial' : 'Reçois tous ces signaux automatiquement avec CryptoIA — Essai 7 jours gratuit';
  const ctaBtn = isEn ? 'Start free trial →' : 'Démarrer l\'essai gratuit →';

  const indicatorsHtml = indicators.map(i => `
    <tr>
      <td style="vertical-align:top;padding:14px 12px 14px 0;width:42px;">
        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#ef4444);color:white;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:14px;">${i.n}</div>
      </td>
      <td style="vertical-align:top;padding:14px 0;border-bottom:1px solid #1f2937;">
        <div style="font-size:15px;font-weight:700;color:#f3f4f6;margin-bottom:4px;">${i.name}</div>
        <div style="font-size:13px;color:#9ca3af;line-height:1.55;">${i.desc}</div>
      </td>
    </tr>`).join('');

  const planHtml = plan.map(p => `<li style="margin-bottom:8px;color:#d1d5db;font-size:14px;line-height:1.55;">${p}</li>`).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e7eb;">
<div style="max-width:640px;margin:0 auto;background:#0f0f1a;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
  <div style="background:linear-gradient(135deg,#4f46e5 0%,#a855f7 50%,#ec4899 100%);padding:32px 28px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:99px;padding:6px 14px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-weight:800;color:white;margin-bottom:12px;">${isEn ? 'CryptoIA · Free Guide' : 'CryptoIA · Guide gratuit'}</div>
    <h1 style="margin:0;font-size:24px;line-height:1.3;color:white;font-weight:900;">${title}</h1>
  </div>
  <div style="padding:28px;">
    <p style="font-size:14px;line-height:1.6;color:#d1d5db;margin:0 0 24px 0;">${intro}</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${indicatorsHtml}</table>
    <div style="margin-top:32px;padding:20px;background:#0a0a14;border-radius:12px;border-left:3px solid #f59e0b;">
      <h3 style="margin:0 0 12px 0;font-size:16px;color:#fbbf24;font-weight:800;">${planTitle}</h3>
      <ol style="margin:0;padding-left:20px;">${planHtml}</ol>
    </div>
    <div style="margin-top:32px;padding:24px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:12px;text-align:center;">
      <p style="margin:0 0 16px 0;font-size:14px;color:white;line-height:1.5;">${cta}</p>
      <a href="https://www.cryptoia.ca/abonnements" style="display:inline-block;background:white;color:#4f46e5;padding:12px 24px;border-radius:99px;text-decoration:none;font-weight:900;font-size:14px;">${ctaBtn}</a>
    </div>
    <p style="margin:32px 0 0 0;font-size:11px;color:#6b7280;text-align:center;line-height:1.5;">
      ${isEn ? 'You received this email because you requested our free guide. Unsubscribe by replying STOP.' : 'Tu reçois cet email car tu as demandé notre guide gratuit. Désinscription en répondant STOP.'}<br>
      © CryptoIA · <a href="https://www.cryptoia.ca" style="color:#a78bfa;">cryptoia.ca</a>
    </p>
  </div>
</div>
</body></html>`;
}

export default function register(app, { resendClientGetter }) {
  // POST /api/v1/lead-magnet/subscribe — capture email + send guide
  app.post('/api/v1/lead-magnet/subscribe', async (req, res) => {
    const { email, source = 'blog', lang = 'fr' } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ ok: false, error: 'Email requis' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ ok: false, error: 'Email invalide' });
    }

    // Persist subscriber (deduplicate by email)
    const db = loadLeads();
    const existing = db.subscribers.find(s => s.email === cleanEmail);
    if (existing) {
      existing.last_request_at = new Date().toISOString();
      existing.requests = (existing.requests || 1) + 1;
      // If previously unsubscribed and they re-subscribe, re-activate the sequence
      if (existing.unsubscribed) {
        existing.unsubscribed = false;
        existing.sequence_step = 0;
        existing.subscribed_at = new Date().toISOString();
      }
      if (!existing.unsub_token) existing.unsub_token = crypto.randomBytes(16).toString('hex');
    } else {
      db.subscribers.push({
        email: cleanEmail,
        source,
        lang,
        subscribed_at: new Date().toISOString(),
        last_request_at: new Date().toISOString(),
        requests: 1,
        sequence_step: 0, // step 0 = guide just sent
        unsub_token: crypto.randomBytes(16).toString('hex'),
        unsubscribed: false,
      });
    }
    saveLeads(db);

    // Send the guide via Resend (lazy resolved at request time)
    try {
      const resendClient = typeof resendClientGetter === 'function' ? await resendClientGetter() : null;
      if (resendClient) {
        const from = process.env.RESEND_FROM_EMAIL || 'CryptoIA <noreply@cryptoia.ca>';
        const subject = lang === 'en'
          ? '📊 Your Free Guide: Top 10 Crypto Indicators (2026)'
          : '📊 Ton guide gratuit : Top 10 indicateurs crypto (2026)';
        const html = buildGuideEmailHtml(lang);
        await resendClient.emails.send({ from, to: cleanEmail, subject, html });
        console.log(`[LeadMagnet] Guide sent to ${cleanEmail} (source=${source}, lang=${lang})`);
      } else {
        console.warn(`[LeadMagnet] Resend client unavailable — email NOT sent to ${cleanEmail}`);
      }
    } catch (e) {
      console.error('[LeadMagnet] Send error:', e?.message);
      // Don't fail the request — email is captured even if send fails
    }

    res.json({ ok: true, message: 'Guide envoyé. Vérifie ta boîte mail.' });
  });

  // GET /api/v1/lead-magnet/count — admin/public stat
  app.get('/api/v1/lead-magnet/count', (req, res) => {
    const db = loadLeads();
    res.json({ ok: true, count: db.subscribers.length });
  });
}
