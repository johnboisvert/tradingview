// Email Health — aggregates Resend webhook events into a deliverability
// reputation report. Lets the admin spot reputation issues (rising bounce
// rate, spam complaints) BEFORE Gmail/Outlook silently throttle the domain.
//
// Score calculation (0-100):
//   bounceRate < 2%   → 40 pts        (industry benchmark: <2% is healthy)
//   spamRate   < 0.1% → 30 pts        (Gmail throttles above 0.3%)
//   openRate   > 20%  → 20 pts        (industry avg: 21.5%)
//   delivered  > 95%  → 10 pts        (anything below means inbox issues)
//
// Endpoints:
//   GET /api/v1/admin/email-health        — aggregate metrics + score
//   GET /api/v1/admin/email-health/recent — recent bounces & complaints

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESEND_FILE = path.join(__dirname, '..', 'data', 'resend_events.json');

function loadEvents() {
  try {
    if (fs.existsSync(RESEND_FILE)) {
      return (JSON.parse(fs.readFileSync(RESEND_FILE, 'utf8')).events || []);
    }
  } catch (e) { console.error('[EmailHealth] load error:', e?.message); }
  return [];
}

// Domain extraction from recipient ("user@gmail.com" → "gmail.com")
function domainOf(email) {
  if (!email || typeof email !== 'string') return 'unknown';
  const at = email.lastIndexOf('@');
  return at === -1 ? 'unknown' : email.slice(at + 1).toLowerCase();
}

function withinWindow(ts, days) {
  if (!ts) return false;
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return false;
  return (Date.now() - t) <= days * 24 * 60 * 60 * 1000;
}

function pct(num, den) {
  if (!den) return 0;
  return Number(((num / den) * 100).toFixed(2));
}

function computeHealthScore({ delivered_rate, open_rate, bounce_rate, spam_rate }) {
  let score = 0;
  // Bounce rate (lower = better)
  if (bounce_rate < 1) score += 40;
  else if (bounce_rate < 2) score += 32;
  else if (bounce_rate < 5) score += 20;
  else if (bounce_rate < 10) score += 8;
  // Spam complaint rate (extremely sensitive — Gmail throttles >0.3%)
  if (spam_rate < 0.1) score += 30;
  else if (spam_rate < 0.3) score += 22;
  else if (spam_rate < 1) score += 10;
  // Open rate
  if (open_rate > 25) score += 20;
  else if (open_rate > 20) score += 16;
  else if (open_rate > 15) score += 12;
  else if (open_rate > 10) score += 6;
  // Delivered rate
  if (delivered_rate > 98) score += 10;
  else if (delivered_rate > 95) score += 8;
  else if (delivered_rate > 90) score += 4;
  return Math.max(0, Math.min(100, score));
}

function buildMetrics(events) {
  // Build per-email tracking using email_id to dedupe events of same email
  const byEmailId = new Map();
  for (const e of events) {
    if (!e.email_id) continue;
    let agg = byEmailId.get(e.email_id);
    if (!agg) {
      agg = { recipient: e.recipient, ts: e.ts, opened: false, clicked: false, bounced: false, complained: false, delivered: false };
      byEmailId.set(e.email_id, agg);
    }
    if (new Date(e.ts) > new Date(agg.ts)) agg.ts = e.ts;
    if (e.type === 'email.delivered') agg.delivered = true;
    else if (e.type === 'email.opened') agg.opened = true;
    else if (e.type === 'email.clicked') agg.clicked = true;
    else if (e.type === 'email.bounced') agg.bounced = true;
    else if (e.type === 'email.complained') agg.complained = true;
  }
  const emails = [...byEmailId.values()];
  const total = emails.length;
  const delivered = emails.filter(e => e.delivered).length;
  const opened = emails.filter(e => e.opened).length;
  const clicked = emails.filter(e => e.clicked).length;
  const bounced = emails.filter(e => e.bounced).length;
  const complained = emails.filter(e => e.complained).length;
  const delivered_rate = pct(delivered, total);
  const open_rate = pct(opened, total);
  const click_rate = pct(clicked, total);
  const bounce_rate = pct(bounced, total);
  const spam_rate = pct(complained, total);
  const score = computeHealthScore({ delivered_rate, open_rate, bounce_rate, spam_rate });
  return {
    total, delivered, opened, clicked, bounced, complained,
    delivered_rate, open_rate, click_rate, bounce_rate, spam_rate, score,
  };
}

function buildPerDomain(events) {
  const byDomain = new Map();
  for (const e of events) {
    if (!e.email_id || !e.recipient) continue;
    const d = domainOf(e.recipient);
    let m = byDomain.get(d);
    if (!m) { m = { domain: d, _emails: new Map() }; byDomain.set(d, m); }
    let agg = m._emails.get(e.email_id);
    if (!agg) { agg = { delivered: false, opened: false, clicked: false, bounced: false, complained: false }; m._emails.set(e.email_id, agg); }
    if (e.type === 'email.delivered') agg.delivered = true;
    else if (e.type === 'email.opened') agg.opened = true;
    else if (e.type === 'email.clicked') agg.clicked = true;
    else if (e.type === 'email.bounced') agg.bounced = true;
    else if (e.type === 'email.complained') agg.complained = true;
  }
  return [...byDomain.values()].map(({ domain, _emails }) => {
    const items = [..._emails.values()];
    const total = items.length;
    const delivered = items.filter(i => i.delivered).length;
    const opened = items.filter(i => i.opened).length;
    const bounced = items.filter(i => i.bounced).length;
    const complained = items.filter(i => i.complained).length;
    return {
      domain, total,
      delivered_rate: pct(delivered, total),
      open_rate: pct(opened, total),
      bounce_rate: pct(bounced, total),
      spam_rate: pct(complained, total),
    };
  }).sort((a, b) => b.total - a.total).slice(0, 12);
}

export default function registerEmailHealthRoutes(app, { requireAdmin } = {}) {
  const adminGuard = requireAdmin || ((_req, _res, next) => next());

  app.get('/api/v1/admin/email-health', adminGuard, (req, res) => {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const allEvents = loadEvents();
    const recent = allEvents.filter(e => withinWindow(e.ts, days));
    const overall = buildMetrics(recent);
    const perDomain = buildPerDomain(recent);
    // Health alerts (gmail throttles above certain thresholds)
    const alerts = [];
    if (overall.bounce_rate > 5) alerts.push({ level: 'critical', msg: `Taux de bounce ${overall.bounce_rate}% — au-dessus du seuil critique (>5%). Risque de blacklist.` });
    else if (overall.bounce_rate > 2) alerts.push({ level: 'warning', msg: `Taux de bounce ${overall.bounce_rate}% — au-dessus de la moyenne (>2%). Vérifie la qualité de la liste.` });
    if (overall.spam_rate > 0.3) alerts.push({ level: 'critical', msg: `Taux de spam ${overall.spam_rate}% — Gmail throttle au-dessus de 0.3%.` });
    else if (overall.spam_rate > 0.1) alerts.push({ level: 'warning', msg: `Taux de spam ${overall.spam_rate}% — surveille de près.` });
    if (overall.total > 0 && overall.delivered_rate < 90) alerts.push({ level: 'warning', msg: `Taux de delivrabilité ${overall.delivered_rate}% — vérifie DKIM/SPF/DMARC.` });
    if (overall.total > 50 && overall.open_rate < 10) alerts.push({ level: 'warning', msg: `Taux d'ouverture ${overall.open_rate}% — sous la moyenne industrie (21%).` });
    res.json({
      ok: true,
      window_days: days,
      overall,
      per_domain: perDomain,
      alerts,
      health_label: overall.score >= 80 ? 'Excellent' : overall.score >= 60 ? 'Bon' : overall.score >= 40 ? 'Moyen' : overall.score >= 20 ? 'Faible' : 'Critique',
    });
  });

  app.get('/api/v1/admin/email-health/recent', adminGuard, (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 30, 200);
    const events = loadEvents();
    const incidents = events
      .filter(e => e.type === 'email.bounced' || e.type === 'email.complained')
      .slice(-limit)
      .reverse()
      .map(e => ({ ts: e.ts, type: e.type, recipient: e.recipient, subject: e.subject, category: e.category }));
    res.json({ ok: true, incidents, total_in_log: events.length });
  });

  console.log('[EmailHealth] ✅ Routes registered (/api/v1/admin/email-health/*)');
}
