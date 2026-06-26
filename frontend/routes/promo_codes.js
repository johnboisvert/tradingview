// Promo Codes — centralized backend storage (replaces frontend localStorage)
// Auto-seeds key codes used by the onboarding email funnel (WELCOME20, FLASH30)
// Used by both /admin/promos UI and the Stripe checkout validation pipeline
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'promo_codes.json');

function load() {
  try {
    if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) { console.error('[Promos] load error:', e?.message); }
  return { codes: [] };
}
function save(d) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(d, null, 2), 'utf8');
  } catch (e) { console.error('[Promos] save error:', e?.message); }
}

// Auto-seed codes used by onboarding emails + legacy hardcoded codes
const SEED = [
  { code: 'WELCOME20', discount: 20, type: 'percent', max_uses: 1000, source: 'onboarding_J7_A' },
  { code: 'FLASH30',   discount: 30, type: 'percent', max_uses: 500,  source: 'onboarding_J7_B' },
  { code: 'LAUNCH50',  discount: 50, type: 'percent', max_uses: 100,  source: 'launch' },
  { code: 'WELCOME10', discount: 10, type: 'percent', max_uses: 9999, source: 'general' },
];

function ensureSeed() {
  const db = load();
  const existing = new Set((db.codes || []).map(c => c.code.toUpperCase()));
  let added = 0;
  for (const s of SEED) {
    if (existing.has(s.code.toUpperCase())) continue;
    db.codes.push({
      ...s,
      uses: 0,
      enabled: true,
      created_at: new Date().toISOString(),
      expires_at: null,
    });
    added++;
  }
  if (added > 0) { save(db); console.log(`[Promos] ✅ Seeded ${added} promo code(s): ${SEED.filter(s => !existing.has(s.code.toUpperCase())).map(s => s.code).join(', ')}`); }
  else console.log(`[Promos] ✅ Loaded ${db.codes.length} promo code(s)`);
}

// Public validator — used by checkout backend AND public /api/v1/promo-codes/validate
export function validatePromoCode(code) {
  if (!code) return { valid: false, reason: 'empty' };
  const db = load();
  const c = (db.codes || []).find(x => x.code.toUpperCase() === String(code).trim().toUpperCase());
  if (!c) return { valid: false, reason: 'not_found' };
  if (c.enabled === false) return { valid: false, reason: 'disabled' };
  if (c.expires_at && Date.parse(c.expires_at) < Date.now()) return { valid: false, reason: 'expired' };
  if (c.max_uses && c.uses >= c.max_uses) return { valid: false, reason: 'max_uses_reached' };
  return { valid: true, code: c.code, discount: c.discount, type: c.type || 'percent', uses: c.uses, max_uses: c.max_uses };
}

export function incrementPromoUse(code) {
  if (!code) return;
  const db = load();
  const c = (db.codes || []).find(x => x.code.toUpperCase() === String(code).trim().toUpperCase());
  if (c) { c.uses = (c.uses || 0) + 1; save(db); }
}

// Generate a unique LEGEND-XXXXXX promo code (50% off, 1 use, never expires)
// Called when a user unlocks the Légende badge (50 lifetime quiz shares).
// Idempotent: if the user already has a LEGEND code, returns the same one.
export function generateLegendCode(email) {
  if (!email) return null;
  const db = load();
  const tagSource = `legend:${String(email).toLowerCase()}`;
  // Idempotency: search existing
  const existing = (db.codes || []).find(c => c.source === tagSource);
  if (existing) return existing.code;
  // Generate readable 6-char suffix (uppercase, no 0/O/1/I to avoid confusion)
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  const code = `LEGEND-${suffix}`;
  db.codes.push({
    code,
    discount: 50,
    type: 'percent',
    max_uses: 1,
    uses: 0,
    enabled: true,
    created_at: new Date().toISOString(),
    expires_at: null,
    source: tagSource,
  });
  save(db);
  return code;
}

export default function registerPromoRoutes(app, { requireAdmin }) {
  ensureSeed();
  const adminGuard = requireAdmin || ((_req, _res, next) => next());

  // ─── Admin: list / create / delete / toggle ──────────────────────────────
  app.get('/api/v1/admin/promo-codes', adminGuard, (_req, res) => {
    res.json({ ok: true, codes: load().codes });
  });

  app.post('/api/v1/admin/promo-codes', adminGuard, (req, res) => {
    const { code, discount, type, max_uses, expires_at } = req.body || {};
    if (!code || !String(code).trim()) return res.status(400).json({ ok: false, error: 'code required' });
    if (!discount || discount <= 0 || discount > 100) return res.status(400).json({ ok: false, error: 'discount must be 1-100' });
    const db = load();
    const upper = String(code).trim().toUpperCase();
    if ((db.codes || []).some(c => c.code.toUpperCase() === upper)) return res.status(400).json({ ok: false, error: 'code already exists' });
    const newCode = {
      code: upper,
      discount: Number(discount),
      type: type || 'percent',
      max_uses: max_uses ? Number(max_uses) : null,
      uses: 0,
      enabled: true,
      created_at: new Date().toISOString(),
      expires_at: expires_at || null,
      source: 'admin_manual',
    };
    db.codes.push(newCode);
    save(db);
    res.json({ ok: true, code: newCode });
  });

  app.delete('/api/v1/admin/promo-codes/:code', adminGuard, (req, res) => {
    const db = load();
    const upper = String(req.params.code).toUpperCase();
    const before = db.codes.length;
    db.codes = db.codes.filter(c => c.code.toUpperCase() !== upper);
    save(db);
    res.json({ ok: true, deleted: before - db.codes.length });
  });

  app.patch('/api/v1/admin/promo-codes/:code/toggle', adminGuard, (req, res) => {
    const db = load();
    const c = db.codes.find(x => x.code.toUpperCase() === String(req.params.code).toUpperCase());
    if (!c) return res.status(404).json({ ok: false, error: 'not found' });
    c.enabled = !c.enabled;
    save(db);
    res.json({ ok: true, code: c });
  });

  // ─── Public: validate (used by checkout flow before sending to Stripe) ────
  app.get('/api/v1/promo-codes/validate', (req, res) => {
    const code = (req.query.code || '').toString();
    res.json(validatePromoCode(code));
  });

  console.log('[Promos] ✅ Routes registered (/api/v1/admin/promo-codes/*, /api/v1/promo-codes/validate)');
}
