// IndexNow — notify Bing/Yandex instantly when new content is published
// Spec: https://www.indexnow.org
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_FILE = path.join(__dirname, '..', 'data', 'indexnow_key.txt');

function getOrCreateKey() {
  try {
    if (fs.existsSync(KEY_FILE)) return fs.readFileSync(KEY_FILE, 'utf8').trim();
  } catch {}
  // Generate a 32-char hex key (IndexNow requires 8-128 chars hex/dashes/letters)
  const key = crypto.randomBytes(16).toString('hex');
  try {
    fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true });
    fs.writeFileSync(KEY_FILE, key);
  } catch {}
  return key;
}

const INDEXNOW_KEY = getOrCreateKey();
console.log(`[IndexNow] Key initialized: ${INDEXNOW_KEY.slice(0, 8)}... (${INDEXNOW_KEY.length} chars)`);

export async function notifyIndexNow(urls) {
  const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
  const host = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const urlList = Array.isArray(urls) ? urls : [urls];
  try {
    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${baseUrl}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
    console.log(`[IndexNow] Notified ${urlList.length} URL(s) — status ${res.status}`);
    return res.status >= 200 && res.status < 300;
  } catch (e) {
    console.error('[IndexNow] Error:', e?.message);
    return false;
  }
}

export default function register(app) {
  // Key file MUST be served at root with the key as filename + ".txt"
  app.get(`/${INDEXNOW_KEY}.txt`, (req, res) => {
    res.type('text/plain').send(INDEXNOW_KEY);
  });

  // Admin: manual notification trigger for a specific URL
  app.post('/api/v1/admin/indexnow/notify', async (req, res) => {
    const { urls } = req.body || {};
    if (!urls) return res.status(400).json({ ok: false, error: 'urls (array or string) required' });
    const ok = await notifyIndexNow(urls);
    res.json({ ok, key_preview: INDEXNOW_KEY.slice(0, 8) + '...' });
  });

  // Admin: notify ALL current blog articles + key landing pages (run once after setup)
  app.post('/api/v1/admin/indexnow/notify-all', async (req, res) => {
    const urls = collectAllUrls();
    // IndexNow accepts max 10k URLs per request
    const ok = await notifyIndexNow(urls);
    res.json({ ok, count: urls.length });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // DAILY CRON — auto-notify Bing/Yandex every day at 06:00 UTC
  // Same pattern as daily_digest.js (tick every 30 min, idempotent via state file)
  // ═══════════════════════════════════════════════════════════════════════════════
  const STATE_FILE = path.join(__dirname, '..', 'data', 'indexnow_cron_state.json');
  const INTERVAL_MS = 30 * 60 * 1000; // tick every 30 min
  const STARTUP_DELAY_MS = 120 * 1000; // wait 2 min after boot
  const TARGET_HOUR_UTC = Number(process.env.INDEXNOW_CRON_HOUR_UTC || 6);

  function loadState() {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return { last_sent_date: null, last_count: 0 }; }
  }
  function saveState(s) {
    try { fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true }); fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); } catch {}
  }

  async function tick() {
    try {
      const now = new Date();
      if (now.getUTCHours() !== TARGET_HOUR_UTC) return;
      const today = now.toISOString().slice(0, 10);
      const state = loadState();
      if (state.last_sent_date === today) return;
      const urls = collectAllUrls();
      const ok = await notifyIndexNow(urls);
      if (ok) {
        state.last_sent_date = today;
        state.last_count = urls.length;
        saveState(state);
        console.log(`[IndexNow Cron] ✅ Daily ping sent: ${urls.length} URLs to Bing/Yandex`);
      } else {
        console.warn('[IndexNow Cron] Ping failed, will retry next tick');
      }
    } catch (e) {
      console.error('[IndexNow Cron] tick error:', e?.message);
    }
  }
  setTimeout(() => { tick(); setInterval(tick, INTERVAL_MS); }, STARTUP_DELAY_MS);
  console.log(`[IndexNow Cron] Scheduler initialized — fires daily around ${TARGET_HOUR_UTC}:00 UTC`);
}

// Helper used by both the endpoint and the cron — keeps URL list consistent
function collectAllUrls() {
  const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
  const BLOG_FILE = path.join(__dirname, '..', 'data', 'blog.json');
  let articles = [];
  try {
    if (fs.existsSync(BLOG_FILE)) articles = (JSON.parse(fs.readFileSync(BLOG_FILE, 'utf8')).articles || []);
  } catch {}
  return [
    `${baseUrl}/`,
    `${baseUrl}/abonnements`,
    `${baseUrl}/blog`,
    `${baseUrl}/comparateur-frais-exchanges`,
    `${baseUrl}/ai-signals`,
    ...articles.map(a => `${baseUrl}/blog/${a.slug}`),
  ];
}
