// CoinGecko API reverse proxy.
//
// Why: CoinGecko's free tier is rate-limited to ~30 req/min per IP. By routing
// all client+server CoinGecko traffic through a single server-side proxy with
// in-memory + disk-persistent caching, we serve 99%+ of requests from cache and
// stay well under the rate limit. The cache also survives Railway redeploys.
//
// Strategy:
//   - Fresh window: 5 min (configurable). Hits cache immediately.
//   - Stale-on-error: if upstream fails AND we have ANY cached response, serve it
//     with header `X-CG-Cache: stale` so the UI keeps working during outages.
//   - Retry/backoff: 3 attempts with exponential delay + jitter on 429 / 5xx.
//   - Disk persistence: debounced 5 s, JSON file at /app/data/cg_cache.json.
//
// Exposes:
//   default export `registerCoinGeckoProxy(app)` — wires the Express handler.
//   named export `cgCache` — Map instance, for read-only inspection elsewhere.

import fs from 'fs';

const cgCache = new Map(); // key → { data, status, timestamp }
const CG_CACHE_TTL = 300_000; // 5 minutes — fresh window
const CG_CACHE_FILE = '/app/data/cg_cache.json';
let cgCacheSaveTimer = null;

// Load persisted cache on boot (survives Railway redeploys)
try {
  if (fs.existsSync(CG_CACHE_FILE)) {
    const raw = JSON.parse(fs.readFileSync(CG_CACHE_FILE, 'utf-8'));
    if (raw && typeof raw === 'object') {
      for (const [k, v] of Object.entries(raw)) cgCache.set(k, v);
      console.log(`[CG-Cache] Loaded ${cgCache.size} entries from disk`);
    }
  }
} catch (e) {
  console.warn('[CG-Cache] Failed to load cache from disk:', e?.message);
}

function persistCgCacheDebounced() {
  if (cgCacheSaveTimer) return;
  cgCacheSaveTimer = setTimeout(() => {
    cgCacheSaveTimer = null;
    try {
      const obj = Object.fromEntries(cgCache.entries());
      fs.mkdirSync('/app/data', { recursive: true });
      fs.writeFileSync(CG_CACHE_FILE, JSON.stringify(obj), 'utf-8');
    } catch (e) {
      console.warn('[CG-Cache] Disk persist failed:', e?.message);
    }
  }, 5000); // debounce 5s
}

export { cgCache, persistCgCacheDebounced, CG_CACHE_TTL };

export default function registerCoinGeckoProxy(app) {
  app.get('/api/coingecko/{*path}', async (req, res) => {
    const targetPath = req.url.replace('/api/coingecko', '');
    const cacheKey = targetPath;
    const now = Date.now();

    // Return cached response if still fresh
    const cached = cgCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CG_CACHE_TTL) {
      return res.status(cached.status).set('Content-Type', 'application/json').send(cached.data);
    }

    const targetUrl = `https://api.coingecko.com/api/v3${targetPath}`;

    // Retry up to 3 times with exponential backoff on 429/5xx
    let lastErr = null;
    let lastStatus = 0;
    let lastData = null;
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        if (attempt > 0) {
          const delay = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 200); // 500ms, 1000ms (+jitter)
          await new Promise(r => setTimeout(r, delay));
        }

        const upstreamRes = await fetch(targetUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(15000),
        });

        lastStatus = upstreamRes.status;
        lastData = await upstreamRes.text();

        if (upstreamRes.status === 200) {
          cgCache.set(cacheKey, { data: lastData, status: 200, timestamp: now });
          persistCgCacheDebounced();
          return res.status(200).set('Content-Type', 'application/json').send(lastData);
        }

        // 429 or 5xx → retry; 4xx (non-429) → stop
        if (upstreamRes.status !== 429 && upstreamRes.status < 500) {
          break;
        }
      } catch (err) {
        lastErr = err;
        console.warn(`[CG-Proxy] Attempt ${attempt + 1}/${maxAttempts} failed for ${targetPath}: ${err?.message}`);
      }
    }

    // All retries exhausted — serve stale cache (any age) if available
    if (cached) {
      console.log(`[CG-Proxy] Serving STALE cache for ${targetPath} (age=${Math.round((now - cached.timestamp) / 1000)}s, last upstream status=${lastStatus})`);
      return res.status(200)
        .set('Content-Type', 'application/json')
        .set('X-CG-Cache', 'stale')
        .send(cached.data);
    }

    // No cache at all — return last upstream error
    if (lastData !== null) {
      return res.status(lastStatus || 502)
        .set('Content-Type', 'application/json')
        .send(lastData);
    }
    res.status(502).json({ error: 'CoinGecko proxy failed', message: lastErr?.message || 'upstream unreachable' });
  });

  console.log('[CG-Proxy] ✅ /api/coingecko/* registered (5min fresh / stale-on-error)');
}
