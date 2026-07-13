// Terminal Pro — server-side layout sync (multi-device continuity).
// Layouts are keyed by email (same identity model as plan grants / redeem).
//   GET  /api/v1/terminal/layout?email=x  → { ok, layout|null, updated_at|null }
//   POST /api/v1/terminal/layout          → { email, layout } — upsert
// Stored in data/terminal_layouts.json on the Railway persistent volume.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FILE = path.join(__dirname, '..', 'data', 'terminal_layouts.json');

function loadDb() {
  try {
    if (fs.existsSync(FILE)) {
      const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      if (db && typeof db.layouts === 'object') return db;
    }
  } catch { /* fallthrough */ }
  return { layouts: {} };
}
function saveDb(db) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
  } catch (e) { console.error('[TerminalLayouts] save error:', e?.message); }
}
const norm = (e) => String(e || '').trim().toLowerCase();

export default function registerTerminalLayoutRoutes(app) {
  app.get('/api/v1/terminal/layout', (req, res) => {
    const email = norm(req.query.email);
    if (!email || !email.includes('@')) return res.status(400).json({ ok: false, error: 'email required' });
    const db = loadDb();
    const entry = db.layouts[email] || null;
    res.json({ ok: true, layout: entry?.layout ?? null, updated_at: entry?.updated_at ?? null });
  });

  app.post('/api/v1/terminal/layout', (req, res) => {
    const email = norm(req.body?.email);
    const layout = req.body?.layout;
    if (!email || !email.includes('@')) return res.status(400).json({ ok: false, error: 'email required' });
    if (!layout || typeof layout !== 'object' || !Array.isArray(layout.items)) {
      return res.status(400).json({ ok: false, error: 'invalid layout' });
    }
    if (JSON.stringify(layout).length > 20000) return res.status(413).json({ ok: false, error: 'layout too large' });
    const db = loadDb();
    db.layouts[email] = { layout, updated_at: new Date().toISOString() };
    saveDb(db);
    res.json({ ok: true, updated_at: db.layouts[email].updated_at });
  });
}
