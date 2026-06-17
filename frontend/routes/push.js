// PWA Push Notifications — extracted from server.js (Session 15 refactor)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import webpush from 'web-push';

export default function register(app) {
// ═══════════════════════════════════════════════════════════════════════════════
// PWA PUSH NOTIFICATIONS — Web Push API (VAPID)
// ═══════════════════════════════════════════════════════════════════════════════
const PUSH_SUBS_FILE = path.join(__dirname, '..', 'data', 'push_subscriptions.json');
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@cryptoia.ca';
let pushEnabled = false;
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
    pushEnabled = true;
    console.log('[Push] VAPID configured ✅ — push notifications enabled');
  } catch (e) {
    console.error('[Push] VAPID config error:', e?.message);
  }
} else {
  console.log('[Push] VAPID keys missing (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY) — push notifications disabled');
}
function loadSubs() {
  try { if (fs.existsSync(PUSH_SUBS_FILE)) return JSON.parse(fs.readFileSync(PUSH_SUBS_FILE, 'utf8')); } catch {}
  return { subscriptions: [] };
}
function saveSubs(data) {
  try { fs.mkdirSync(path.dirname(PUSH_SUBS_FILE), { recursive: true }); fs.writeFileSync(PUSH_SUBS_FILE, JSON.stringify(data, null, 2)); } catch (e) { console.error('[Push] save error:', e?.message); }
}

// GET /api/v1/push/vapid-public — Returns public VAPID key (for frontend subscribe)
app.get('/api/v1/push/vapid-public', (req, res) => {
  res.json({ ok: true, publicKey: VAPID_PUBLIC, enabled: pushEnabled });
});

// POST /api/v1/push/subscribe — Save subscription
app.post('/api/v1/push/subscribe', (req, res) => {
  const { subscription, userKey, topics } = req.body || {};
  if (!subscription?.endpoint) return res.status(400).json({ ok: false, error: 'invalid subscription' });
  const db = loadSubs();
  const existing = db.subscriptions.findIndex(s => s.subscription.endpoint === subscription.endpoint);
  const entry = { subscription, userKey: userKey || null, topics: topics || ['alerts', 'signals'], createdAt: new Date().toISOString() };
  if (existing >= 0) db.subscriptions[existing] = entry;
  else db.subscriptions.push(entry);
  saveSubs(db);
  res.json({ ok: true, total: db.subscriptions.length });
});

// POST /api/v1/push/unsubscribe — Remove subscription
app.post('/api/v1/push/unsubscribe', (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ ok: false, error: 'endpoint required' });
  const db = loadSubs();
  const before = db.subscriptions.length;
  db.subscriptions = db.subscriptions.filter(s => s.subscription.endpoint !== endpoint);
  saveSubs(db);
  res.json({ ok: true, removed: before - db.subscriptions.length });
});

// POST /api/v1/push/send — Send to all (admin-only — protect with token in production)
app.post('/api/v1/push/send', async (req, res) => {
  if (!pushEnabled) return res.status(503).json({ ok: false, error: 'push not configured' });
  const { title, body, url, topic, adminToken } = req.body || {};
  if (process.env.PUSH_ADMIN_TOKEN && adminToken !== process.env.PUSH_ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  if (!title || !body) return res.status(400).json({ ok: false, error: 'title and body required' });
  const db = loadSubs();
  const payload = JSON.stringify({ title, body, url: url || '/', icon: '/assets/logo1.png', badge: '/assets/logo1.png' });
  let sent = 0, failed = 0;
  const expired = [];
  for (const s of db.subscriptions) {
    if (topic && !s.topics.includes(topic)) continue;
    try { await webpush.sendNotification(s.subscription, payload); sent++; }
    catch (e) {
      failed++;
      if (e.statusCode === 410 || e.statusCode === 404) expired.push(s.subscription.endpoint);
    }
  }
  // Clean up expired subs
  if (expired.length) {
    db.subscriptions = db.subscriptions.filter(s => !expired.includes(s.subscription.endpoint));
    saveSubs(db);
  }
  res.json({ ok: true, sent, failed, expired: expired.length, total: db.subscriptions.length });
});

// GET /api/v1/push/stats — Admin stats
app.get('/api/v1/push/stats', (req, res) => {
  const db = loadSubs();
  res.json({ ok: true, total: db.subscriptions.length, enabled: pushEnabled, publicKey: VAPID_PUBLIC.slice(0, 12) + '...' });
});

};
