// Quiz share tracking — counts how many times each profile is shared on each platform.
// Stored as data/quiz_shares.json with a sliding 7-day window for the leaderboard.
//
// Endpoints:
//   POST /api/v1/quiz/share  { profile, platform }  → idempotent-ish: dedupe by IP+profile+platform within 6h
//   GET  /api/v1/quiz/shares                         → { profiles: [{ key, total, week, platforms:{…} }], updatedAt }
//
// This drives the "Profils les plus partagés cette semaine" leaderboard on /quiz.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const SHARES_FILE = path.join(DATA_DIR, 'quiz_shares.json');

const VALID_PROFILES = new Set(['hodler', 'scalper', 'swing', 'longterm']);
const VALID_PLATFORMS = new Set(['twitter', 'facebook', 'linkedin', 'whatsapp', 'telegram', 'copy', 'native']);
const DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000;          // 6h same IP+profile+platform = 1 share
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const INFLUENCER_THRESHOLD = 5;                       // 5+ shares (any profile/platform) → Influenceur badge

function defaultDb() {
  return {
    events: [],              // [{ ts, profile, platform, ipHash, email? }] — pruned to WEEK_MS
    totals: {                // lifetime counters per profile (never pruned)
      hodler: 0, scalper: 0, swing: 0, longterm: 0,
    },
    platformTotals: {        // lifetime counters per profile.platform
      hodler: {}, scalper: {}, swing: {}, longterm: {},
    },
    influencers: {},         // emailLower → { unlocked_at, total_shares }
  };
}

function loadDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(SHARES_FILE)) return defaultDb();
    const raw = fs.readFileSync(SHARES_FILE, 'utf8');
    const db = JSON.parse(raw);
    if (!db.events) db.events = [];
    if (!db.totals) db.totals = defaultDb().totals;
    if (!db.platformTotals) db.platformTotals = defaultDb().platformTotals;
    if (!db.influencers) db.influencers = {};
    return db;
  } catch (e) {
    console.error('[QuizShares] load error:', e?.message);
    return defaultDb();
  }
}

function saveDb(db) {
  try { fs.writeFileSync(SHARES_FILE, JSON.stringify(db, null, 2)); }
  catch (e) { console.error('[QuizShares] save error:', e?.message); }
}

function pruneEvents(db) {
  const cutoff = Date.now() - WEEK_MS;
  db.events = db.events.filter(e => e.ts >= cutoff);
}

function hashIp(req) {
  const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0].trim()) || req.ip || req.socket?.remoteAddress || '';
  return crypto.createHash('sha256').update(ip + '|cryptoia.ca').digest('hex').slice(0, 16);
}

function isDuplicate(db, profile, platform, ipHash) {
  const cutoff = Date.now() - DEDUPE_WINDOW_MS;
  return db.events.some(e => e.ts >= cutoff && e.profile === profile && e.platform === platform && e.ipHash === ipHash);
}

export default function registerQuizSharesRoutes(app) {
  // POST /api/v1/quiz/share — record one share event (deduped per IP/profile/platform/6h)
  app.post('/api/v1/quiz/share', (req, res) => {
    try {
      const profile = String(req.body?.profile || '').toLowerCase();
      const platform = String(req.body?.platform || '').toLowerCase();
      const email = String(req.body?.email || '').toLowerCase().trim() || null;
      if (!VALID_PROFILES.has(profile) || !VALID_PLATFORMS.has(platform)) {
        return res.status(400).json({ ok: false, error: 'Invalid profile or platform' });
      }
      const db = loadDb();
      pruneEvents(db);
      const ipHash = hashIp(req);
      if (isDuplicate(db, profile, platform, ipHash)) {
        const influencer = email && db.influencers?.[email];
        return res.json({
          ok: true,
          deduped: true,
          total: db.totals[profile] || 0,
          influencer: !!influencer,
          influencer_just_unlocked: false,
        });
      }
      db.events.push({ ts: Date.now(), profile, platform, ipHash, email });
      db.totals[profile] = (db.totals[profile] || 0) + 1;
      if (!db.platformTotals[profile]) db.platformTotals[profile] = {};
      db.platformTotals[profile][platform] = (db.platformTotals[profile][platform] || 0) + 1;

      // Influencer badge unlock: count distinct (profile, platform) shares for this email
      // OR ip-hash (covers anonymous sharing). Threshold = 5.
      let justUnlocked = false;
      let totalForUser = 0;
      if (email) {
        totalForUser = db.events.filter(e => e.email === email).length;
        const wasUnlocked = !!db.influencers[email];
        if (!wasUnlocked && totalForUser >= INFLUENCER_THRESHOLD) {
          db.influencers[email] = { unlocked_at: new Date().toISOString(), total_shares: totalForUser };
          justUnlocked = true;
          console.log(`[QuizShares] 🏆 Influencer badge unlocked for ${email} (${totalForUser} shares)`);
        } else if (wasUnlocked) {
          db.influencers[email].total_shares = totalForUser;
        }
      } else {
        // Fallback for users sharing without email (the shared-view CTA path):
        // count IP shares for completeness, but no badge persisted (no identity to attach).
        totalForUser = db.events.filter(e => e.ipHash === ipHash).length;
      }

      saveDb(db);
      res.json({
        ok: true,
        deduped: false,
        total: db.totals[profile],
        user_total_shares: totalForUser,
        influencer: email ? !!db.influencers[email] : false,
        influencer_just_unlocked: justUnlocked,
      });
    } catch (e) {
      console.error('[QuizShares] share error:', e?.message);
      res.status(500).json({ ok: false, error: 'Internal error' });
    }
  });

  // GET /api/v1/quiz/shares — leaderboard of profiles (last 7d count + lifetime total)
  app.get('/api/v1/quiz/shares', (req, res) => {
    try {
      const db = loadDb();
      pruneEvents(db);
      const profiles = ['hodler', 'scalper', 'swing', 'longterm'].map(k => {
        const week = db.events.filter(e => e.profile === k).length;
        return {
          key: k,
          total: db.totals[k] || 0,
          week,
          platforms: db.platformTotals[k] || {},
        };
      }).sort((a, b) => b.week - a.week);
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json({
        ok: true,
        profiles,
        influencers_count: Object.keys(db.influencers || {}).length,
        threshold: INFLUENCER_THRESHOLD,
        updatedAt: Date.now(),
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: 'Internal error' });
    }
  });

  // GET /api/v1/quiz/me-shares?email=… — per-user view: total shares + influencer flag.
  // Lets the Quiz UI show a personalized progress bar toward the Influenceur badge.
  app.get('/api/v1/quiz/me-shares', (req, res) => {
    try {
      const email = String(req.query.email || '').toLowerCase().trim();
      if (!email || !email.includes('@')) {
        return res.status(400).json({ ok: false, error: 'Invalid email' });
      }
      const db = loadDb();
      pruneEvents(db);
      const total = db.events.filter(e => e.email === email).length;
      const influencer = !!db.influencers?.[email];
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        ok: true,
        email_hash: email.slice(0, 2) + '***',
        total_shares: total,
        threshold: INFLUENCER_THRESHOLD,
        progress_pct: Math.min(100, Math.round((total / INFLUENCER_THRESHOLD) * 100)),
        influencer,
        unlocked_at: db.influencers?.[email]?.unlocked_at || null,
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: 'Internal error' });
    }
  });

  // GET /api/v1/quiz/influencers — public Top N influencers leaderboard.
  // Emails are anonymized to "ab***@d***" so we can show real users w/o leaking PII.
  // Used by the homepage social-proof block ("Top 10 ambassadors this week").
  app.get('/api/v1/quiz/influencers', (req, res) => {
    try {
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const db = loadDb();
      const anonymize = (e) => {
        if (!e || !e.includes('@')) return '***';
        const [local, domain] = e.split('@');
        const dParts = domain.split('.');
        return `${local.slice(0, 2)}***@${dParts[0].slice(0, 1)}***.${dParts.slice(1).join('.') || 'com'}`;
      };
      const list = Object.entries(db.influencers || {})
        .map(([email, info]) => ({
          email_anonymized: anonymize(email),
          total_shares: info.total_shares || 0,
          unlocked_at: info.unlocked_at,
        }))
        .sort((a, b) => b.total_shares - a.total_shares)
        .slice(0, limit);
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.json({
        ok: true,
        influencers: list,
        total_count: Object.keys(db.influencers || {}).length,
        threshold: INFLUENCER_THRESHOLD,
        updatedAt: Date.now(),
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: 'Internal error' });
    }
  });
}
