// Resend Webhook — captures email delivery / open / click / bounce / complaint
// events and enriches onboarding_events.json so the admin dashboard can show
// open & click rates per step.
//
// Setup in Resend:
//   1. Resend Dashboard → Webhooks → Add Endpoint
//      → URL  : https://your-domain.com/api/v1/webhooks/resend
//      → Events: email.delivered, email.opened, email.clicked,
//                email.bounced, email.complained
//   2. (Optional) Set RESEND_WEBHOOK_SECRET in env and Resend will sign payloads
//      via the `svix-signature` header — we verify them below if secret is set.
//
// Per-step open & click rates are exposed at:
//   GET /api/v1/admin/onboarding/email-stats
//
// All raw events are also appended to data/resend_events.json (last 1000) for
// audit / debugging.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const ONBOARDING_FILE = path.join(DATA_DIR, 'onboarding_events.json');
const RESEND_FILE = path.join(DATA_DIR, 'resend_events.json');
const RAW_MAX = 1000;

function loadJSON(file, fallback) {
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* */ }
  return fallback;
}
function saveJSON(file, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) { console.error('[ResendWebhook] save error:', e?.message); }
}

// ─── Signature verification (Svix-compatible, used by Resend) ───────────────
// `rawBody` MUST be a Buffer captured BEFORE JSON parsing — Svix signs the
// exact bytes Resend sent. We attach raw() middleware on the webhook route.
function verifySignature(req, rawBody, secret) {
  if (!secret) return true; // No secret configured → skip verification
  const sigHeader = req.headers['svix-signature'];
  const svixId = req.headers['svix-id'];
  const svixTs = req.headers['svix-timestamp'];
  if (!sigHeader || !svixId || !svixTs || !rawBody) return false;
  try {
    const signedContent = `${svixId}.${svixTs}.${rawBody.toString('utf8')}`;
    const cleanSecret = secret.replace(/^whsec_/, '');
    const secretBytes = Buffer.from(cleanSecret, 'base64');
    const computed = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');
    const expected = `v1,${computed}`;
    return sigHeader.split(' ').some(s => s.trim() === expected);
  } catch (e) {
    console.error('[ResendWebhook] verify error:', e?.message);
    return false;
  }
}

// ─── Onboarding enrichment ──────────────────────────────────────────────────
function enrichOnboardingEvent(emailId, recipient, eventType, ts) {
  const db = loadJSON(ONBOARDING_FILE, { events: [] });
  let target = null;
  // Match by email_id first (precise), then fallback to latest send to recipient
  if (emailId) target = db.events.findLast?.(e => e.email_id === emailId)
    || [...db.events].reverse().find(e => e.email_id === emailId);
  if (!target && recipient) {
    target = [...db.events].reverse().find(e => e.email === recipient && e.ok);
  }
  if (!target) return false;
  if (eventType === 'email.opened' && !target.opened_at) target.opened_at = ts;
  else if (eventType === 'email.clicked' && !target.clicked_at) target.clicked_at = ts;
  else if (eventType === 'email.bounced' && !target.bounced_at) target.bounced_at = ts;
  else if (eventType === 'email.complained' && !target.complained_at) target.complained_at = ts;
  else if (eventType === 'email.delivered' && !target.delivered_at) target.delivered_at = ts;
  saveJSON(ONBOARDING_FILE, db);
  return true;
}

// ─── Routes ─────────────────────────────────────────────────────────────────
export default function registerResendWebhookRoutes(app, { requireAdmin } = {}) {
  const SECRET = process.env.RESEND_WEBHOOK_SECRET || '';
  const adminGuard = requireAdmin || ((_req, _res, next) => next());

  // Replaces the inline /api/v1/webhooks/resend handler in server.js by
  // registering BEFORE it. Express uses the first-matched route, so registering
  // here from the modular section overrides the legacy one.
  // The raw body is captured by `app.use('/api/v1/webhooks/resend', express.raw(...))`
  // declared at the top of server.js (BEFORE express.json) so we can verify the
  // Svix HMAC signature against the exact bytes Resend sent.
  app.post('/api/v1/webhooks/resend', (req, res) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(typeof req.body === 'string' ? req.body : '');
    if (SECRET && !verifySignature(req, rawBody, SECRET)) {
      return res.status(401).json({ error: 'invalid signature' });
    }
    let payload = {};
    try { payload = JSON.parse(rawBody.toString('utf8') || '{}'); }
    catch { return res.status(400).json({ error: 'invalid json' }); }
    try {
      const { type, data, created_at } = payload;
      if (!type) return res.status(400).json({ error: 'type required' });
      const ts = created_at || new Date().toISOString();
      const emailId = data?.email_id || data?.id || null;
      const recipient = Array.isArray(data?.to) ? data.to[0] : data?.to || null;
      const tags = Array.isArray(data?.tags) ? data.tags : [];
      const stepTag = tags.find(t => t?.name === 'step')?.value || null;
      const categoryTag = tags.find(t => t?.name === 'category')?.value || null;

      // Persist raw event for audit (keep last RAW_MAX)
      const raw = loadJSON(RESEND_FILE, { events: [] });
      raw.events.push({
        ts, type, email_id: emailId, recipient,
        category: categoryTag, step: stepTag,
        subject: data?.subject || null,
        url: data?.click?.link || data?.link || null,
      });
      if (raw.events.length > RAW_MAX) raw.events.splice(0, raw.events.length - RAW_MAX);
      saveJSON(RESEND_FILE, raw);

      // Enrich onboarding events when relevant
      if (categoryTag === 'onboarding' || stepTag) {
        enrichOnboardingEvent(emailId, recipient, type, ts);
      }
      return res.json({ status: 'ok' });
    } catch (e) {
      console.error('[ResendWebhook] handler error:', e?.message);
      return res.status(500).json({ error: 'internal error' });
    }
  });

  // ─── Admin: per-step open & click rates ───────────────────────────────────
  app.get('/api/v1/admin/onboarding/email-stats', adminGuard, (_req, res) => {
    const db = loadJSON(ONBOARDING_FILE, { events: [] });
    const perStep = { 1: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 },
                      2: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 },
                      3: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 } };
    for (const e of db.events) {
      if (!e.ok || !perStep[e.step]) continue;
      perStep[e.step].sent++;
      if (e.delivered_at) perStep[e.step].delivered++;
      if (e.opened_at) perStep[e.step].opened++;
      if (e.clicked_at) perStep[e.step].clicked++;
      if (e.bounced_at) perStep[e.step].bounced++;
      if (e.complained_at) perStep[e.step].complained++;
    }
    const pct = (n, d) => d > 0 ? Number(((n / d) * 100).toFixed(1)) : 0;
    const result = Object.entries(perStep).map(([step, s]) => ({
      step: Number(step),
      sent: s.sent,
      delivered: s.delivered,
      delivered_rate_pct: pct(s.delivered, s.sent),
      opened: s.opened,
      open_rate_pct: pct(s.opened, s.sent),
      clicked: s.clicked,
      click_rate_pct: pct(s.clicked, s.sent),
      ctor_pct: pct(s.clicked, s.opened), // Click-To-Open Rate
      bounced: s.bounced,
      complained: s.complained,
    }));
    res.json({ ok: true, per_step: result, secured: !!SECRET });
  });

  // ─── Admin: raw recent events (debug) ─────────────────────────────────────
  app.get('/api/v1/admin/resend/events', adminGuard, (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, RAW_MAX);
    const raw = loadJSON(RESEND_FILE, { events: [] });
    res.json({ ok: true, events: raw.events.slice(-limit).reverse() });
  });

  console.log(`[ResendWebhook] ✅ Registered ${SECRET ? '🔐 (signed)' : '⚠️  (UNSECURED — set RESEND_WEBHOOK_SECRET)'}`);
}
