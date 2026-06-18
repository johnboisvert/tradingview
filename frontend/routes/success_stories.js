// Success Stories — user-submitted, admin-verified (no fake data)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE = path.join(__dirname, '..', 'data', 'success_stories.json');

function load() {
  try { if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
  return { stories: [], submissions: [] };
}
function save(data) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch (e) { console.error('[SuccessStories] save error:', e?.message); }
}

export default function register(app) {
  // ─── GET /api/v1/success-stories — public, returns only PUBLISHED stories ───
  app.get('/api/v1/success-stories', (req, res) => {
    const db = load();
    const stories = (db.stories || []).filter(s => s.published);
    res.json({ ok: true, stories });
  });

  // ─── POST /api/v1/success-stories/submit — user submits a story for review ───
  app.post('/api/v1/success-stories/submit', (req, res) => {
    const { name, email, role, quote } = req.body || {};
    if (!name || !email || !quote) {
      return res.status(400).json({ ok: false, error: 'name, email and quote are required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ ok: false, error: 'Invalid email' });
    }
    if (String(quote).trim().length < 20) {
      return res.status(400).json({ ok: false, error: 'Quote too short (min 20 chars)' });
    }
    const db = load();
    db.submissions = db.submissions || [];
    db.submissions.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: String(name).trim().slice(0, 80),
      email: String(email).trim().toLowerCase(),
      role: String(role || '').trim().slice(0, 80),
      quote: String(quote).trim().slice(0, 1000),
      submitted_at: new Date().toISOString(),
      status: 'pending', // pending → approved → published
    });
    save(db);
    res.json({ ok: true, message: 'Submission received, pending review' });
  });

  // ─── GET /api/v1/success-stories/admin/pending — admin: list pending submissions ───
  app.get('/api/v1/success-stories/admin/pending', (req, res) => {
    const db = load();
    res.json({ ok: true, submissions: (db.submissions || []).filter(s => s.status === 'pending') });
  });

  // ─── POST /api/v1/success-stories/admin/publish — admin: approve and publish ───
  app.post('/api/v1/success-stories/admin/publish', (req, res) => {
    const { id, rating } = req.body || {};
    if (!id) return res.status(400).json({ ok: false, error: 'id required' });
    const db = load();
    const sub = (db.submissions || []).find(s => s.id === id);
    if (!sub) return res.status(404).json({ ok: false, error: 'Submission not found' });
    sub.status = 'approved';
    db.stories = db.stories || [];
    db.stories.push({
      name: sub.name,
      role: sub.role,
      quote: sub.quote,
      rating: Number(rating) || 5,
      published: true,
      published_at: new Date().toISOString(),
    });
    save(db);
    res.json({ ok: true });
  });
}
