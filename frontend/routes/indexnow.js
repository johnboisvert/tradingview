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
    const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
    const BLOG_FILE = path.join(__dirname, '..', 'data', 'blog.json');
    let articles = [];
    try {
      if (fs.existsSync(BLOG_FILE)) articles = (JSON.parse(fs.readFileSync(BLOG_FILE, 'utf8')).articles || []);
    } catch {}
    const urls = [
      `${baseUrl}/`,
      `${baseUrl}/abonnements`,
      `${baseUrl}/blog`,
      `${baseUrl}/comparateur-frais-exchanges`,
      `${baseUrl}/ai-signals`,
      ...articles.map(a => `${baseUrl}/blog/${a.slug}`),
    ];
    // IndexNow accepts max 10k URLs per request
    const ok = await notifyIndexNow(urls);
    res.json({ ok, count: urls.length });
  });
}
