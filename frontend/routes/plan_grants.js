// Admin-managed plan grants — email → plan mapping.
// Lets the admin manually grant Elite/Pro access to specific users (VIP,
// support cases, partners, giveaways). Grants persist to plan_grants.json
// on the Railway volume.
//
// Endpoints (all admin-gated by x-admin-auth === process.env.ADMIN_PASSWORD)
//   GET    /api/v1/admin/plans/grants                — list all grants
//   POST   /api/v1/admin/plans/grants                — { email, plan, note?, expires_at? }
//   DELETE /api/v1/admin/plans/grants/:email         — revoke grant
//
// Public
//   GET    /api/v1/plans/grants/lookup?email=x       — { plan | null }
//   Used by client to auto-upgrade a user who redeems the same email as an
//   admin-configured grant.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const GRANTS_FILE = path.join(DATA_DIR, 'plan_grants.json');
const VALID_PLANS = new Set(['free', 'premium', 'advanced', 'pro', 'elite', 'admin']);

function loadDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(GRANTS_FILE)) return { grants: {} };
    const raw = fs.readFileSync(GRANTS_FILE, 'utf8');
    const db = JSON.parse(raw);
    if (!db.grants || typeof db.grants !== 'object') db.grants = {};
    return db;
  } catch { return { grants: {} }; }
}

function saveDb(db) {
  try { fs.writeFileSync(GRANTS_FILE, JSON.stringify(db, null, 2)); }
  catch (e) { console.error('[PlanGrants] save error:', e?.message); }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD || 'admin123';
  return req.headers['x-admin-auth'] === expected;
}

function isExpired(g) {
  return g && g.expires_at && Date.parse(g.expires_at) < Date.now();
}

export default function registerPlanGrantsRoutes(app) {
  // Public lookup — user redeems by entering their email
  app.get('/api/v1/plans/grants/lookup', (req, res) => {
    const email = normalizeEmail(req.query.email);
    if (!email) return res.status(400).json({ ok: false, error: 'email required' });
    const db = loadDb();
    const g = db.grants[email];
    if (!g || isExpired(g)) return res.json({ ok: true, plan: null });
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      plan: g.plan,
      note: g.note || null,
      granted_at: g.granted_at,
      expires_at: g.expires_at || null,
    });
  });

  // Admin — list all grants
  app.get('/api/v1/admin/plans/grants', (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ ok: false, error: 'admin auth required' });
    const db = loadDb();
    const list = Object.entries(db.grants).map(([email, g]) => ({
      email,
      plan: g.plan,
      note: g.note || null,
      granted_at: g.granted_at,
      granted_by: g.granted_by || null,
      expires_at: g.expires_at || null,
      expired: isExpired(g),
    })).sort((a, b) => (b.granted_at || '').localeCompare(a.granted_at || ''));
    res.json({ ok: true, grants: list, total: list.length });
  });

  // Admin — create or update grant
  app.post('/api/v1/admin/plans/grants', (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ ok: false, error: 'admin auth required' });
    const { email, plan, note, expires_at } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return res.status(400).json({ ok: false, error: 'valid email required' });
    }
    if (!VALID_PLANS.has(plan)) {
      return res.status(400).json({ ok: false, error: `invalid plan (allowed: ${[...VALID_PLANS].join(', ')})` });
    }
    const db = loadDb();
    const existing = db.grants[normalizedEmail];
    db.grants[normalizedEmail] = {
      plan,
      note: note || null,
      granted_at: existing?.granted_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      granted_by: 'admin',
      expires_at: expires_at || null,
    };
    saveDb(db);
    console.log(`[PlanGrants] ${existing ? '🔄 Updated' : '✅ Granted'} ${plan} to ${normalizedEmail}${expires_at ? ` (expires ${expires_at})` : ''}`);
    res.json({ ok: true, email: normalizedEmail, grant: db.grants[normalizedEmail] });
  });

  // Admin — revoke grant
  app.delete('/api/v1/admin/plans/grants/:email', (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ ok: false, error: 'admin auth required' });
    const email = normalizeEmail(req.params.email);
    const db = loadDb();
    if (!db.grants[email]) return res.status(404).json({ ok: false, error: 'grant not found' });
    delete db.grants[email];
    saveDb(db);
    console.log(`[PlanGrants] 🗑️  Revoked grant for ${email}`);
    res.json({ ok: true });
  });

  console.log('[PlanGrants] Routes registered (/api/v1/admin/plans/grants, /api/v1/plans/grants/lookup)');
}
