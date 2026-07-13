// Economic calendar — live feed proxy (ForexFactory weekly JSON).
// Real release dates/times for macro events (CPI, NFP, PPI, rate decisions…),
// replacing the frontend's rule-based estimated dates which drift from reality.
//   GET /api/v1/calendar/economic → { ok, events[], window:{from,to}, fetched_at }
// The feed rate-limits aggressively (429) → disk-backed cache (60 min TTL),
// sequential fetches with delay, and stale fallback on any error.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, '..', 'data', 'economic_calendar_cache.json');

const FEEDS = ['thisweek']; // last/next week variants were removed by the provider (404)
const TTL_MS = 60 * 60 * 1000;

let memCache = null; // { ts, payload }
let refreshing = false;

function loadDiskCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const c = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      if (c?.payload?.events) return c;
    }
  } catch { /* ignore */ }
  return null;
}
function saveDiskCache(c) {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(c));
  } catch (e) { console.error('[EconCalendar] cache save error:', e?.message); }
}

async function fetchFeed(name) {
  const r = await fetch(`https://nfs.faireconomy.media/ff_calendar_${name}.json`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' },
  });
  if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
  return r.json();
}

function normalize(raw) {
  const seen = new Set();
  const events = [];
  for (const e of raw) {
    if (!e?.title || !e?.date) continue;
    const iso = String(e.date);
    const key = `${e.title}|${e.country}|${iso}`;
    if (seen.has(key)) continue;
    seen.add(key);
    events.push({
      title: e.title,
      currency: e.country || '',
      date: iso.slice(0, 10),
      time: iso.slice(11, 16),
      impact: e.impact || 'Low',
      forecast: e.forecast || '',
      previous: e.previous || '',
    });
  }
  events.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return events;
}

async function refresh() {
  if (refreshing) return null;
  refreshing = true;
  try {
    const raw = [];
    let okCount = 0;
    for (const name of FEEDS) {
      try {
        const data = await fetchFeed(name);
        if (Array.isArray(data)) { raw.push(...data); okCount++; }
      } catch (e) {
        console.error('[EconCalendar] feed error:', e?.message);
      }
    }
    if (okCount === 0) return null;
    const events = normalize(raw);
    if (events.length === 0) return null;
    const payload = {
      ok: true,
      events,
      window: { from: events[0].date, to: events[events.length - 1].date },
      fetched_at: new Date().toISOString(),
    };
    memCache = { ts: Date.now(), payload };
    saveDiskCache(memCache);
    return payload;
  } finally {
    refreshing = false;
  }
}

export default function registerEconomicCalendarRoutes(app) {
  app.get('/api/v1/calendar/economic', async (req, res) => {
    if (!memCache) memCache = loadDiskCache();
    const fresh = memCache && Date.now() - memCache.ts < TTL_MS;
    if (fresh) return res.json(memCache.payload);
    const payload = await refresh();
    if (payload) return res.json(payload);
    if (memCache?.payload) return res.json(memCache.payload); // stale fallback
    res.status(502).json({ ok: false, error: 'economic calendar feed unavailable' });
  });
}
