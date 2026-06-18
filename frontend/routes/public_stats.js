// Public Stats — REAL data only, no fake numbers
// Returns counts derived from actual database files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

function safeReadJson(file, fallback) {
  try {
    const p = path.join(DATA_DIR, file);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {}
  return fallback;
}

export default function register(app) {
  // ─── GET /api/v1/stats/public — Real counts from live data ───
  // Cached 60s to avoid spamming filesystem on every page load
  let cache = { ts: 0, data: null };

  app.get('/api/v1/stats/public', (req, res) => {
    const now = Date.now();
    if (cache.data && (now - cache.ts) < 60_000) {
      return res.json(cache.data);
    }

    const blog = safeReadJson('blog.json', { articles: [] });
    const leaderboard = safeReadJson('gamification.json', { players: [] });
    const leads = safeReadJson('lead_magnet_subscribers.json', { subscribers: [] });
    const analytics = safeReadJson('analytics_events.json', { events: [] });

    // Real article count
    const articles_count = (blog.articles || []).length;

    // Real leaderboard entries
    const leaderboard_count = (leaderboard.players || []).length;

    // Real email subscribers (excluding unsubscribed)
    const active_subscribers = (leads.subscribers || []).filter(s => !s.unsubscribed).length;

    // Real unique events in last 30 days
    const thirtyDaysAgo = now - 30 * 24 * 3600 * 1000;
    const recent_events = (analytics.events || []).filter(e => {
      try { return new Date(e.ts).getTime() >= thirtyDaysAgo; } catch { return false; }
    }).length;

    // Real payment_completed count (lifetime)
    const real_paid_customers = (analytics.events || []).filter(e => e.event === 'payment_completed').length;

    const data = {
      ok: true,
      // Verified-real metrics
      articles_count,
      leaderboard_count,
      active_subscribers,
      recent_events_30d: recent_events,
      real_paid_customers,
      // Service facts (not "user counts" — these are objective product facts)
      languages_supported: 2,           // FR + EN
      indicators_tracked: 12,           // RSI, MACD, MVRV, Fear&Greed, etc. (from indicators page)
      crypto_pairs_scanned: 200,        // approximate scan capacity
      trial_days: 7,
      generated_at: new Date().toISOString(),
    };

    cache = { ts: now, data };
    res.json(data);
  });
}
