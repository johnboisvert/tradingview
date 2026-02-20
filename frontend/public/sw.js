const CACHE_VERSION = 'v2';
const STATIC_CACHE = `cryptoia-static-${CACHE_VERSION}`;
const API_CACHE = `cryptoia-api-${CACHE_VERSION}`;
const RUNTIME_CACHE = `cryptoia-runtime-${CACHE_VERSION}`;

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/Icons.jpg',
  '/icons/icon-256.png',
  '/icons/icon-512.png',
];

// Patterns for assets that should use cache-first strategy
const CACHE_FIRST_PATTERNS = [
  /\.(?:js|css|woff2?|ttf|eot|otf)$/,
  /\/assets\//,
  /\/icons\//,
  /\/images\//,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
];

// Patterns for API calls that should use network-first strategy
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /api\.coingecko\.com/,
  /api\.allorigins\.win/,
  /generativelanguage\.googleapis\.com/,
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing CryptoIA Service Worker v2...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache partial failure (non-blocking):', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating CryptoIA Service Worker v2...');
  const currentCaches = [STATIC_CACHE, API_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and non-http(s)
  if (!url.protocol.startsWith('http')) return;

  // API calls → Network First with cache fallback
  if (NETWORK_FIRST_PATTERNS.some((p) => p.test(request.url))) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Static assets (JS, CSS, images, fonts) → Cache First with network fallback
  if (
    CACHE_FIRST_PATTERNS.some((p) => p.test(request.url)) ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // HTML navigation → Network First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Default → Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// ── Strategies ────────────────────────────────────────────────────────────────

/**
 * Cache First: Serve from cache, fall back to network.
 * Best for static assets that rarely change.
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — Asset indisponible', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Network First: Try network, fall back to cache.
 * Best for API calls and dynamic content.
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'Données en cache indisponibles.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Network First with HTML fallback for navigation requests.
 * Returns cached index.html when offline for SPA routing.
 */
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache the HTML for offline use
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Try to serve cached version of the page
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fall back to cached index.html (SPA routing)
    const indexCached = await caches.match('/index.html');
    if (indexCached) return indexCached;

    // Ultimate fallback
    return new Response(
      `<!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>CryptoIA — Hors ligne</title>
      <style>
        body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#030712;color:#fff;font-family:Inter,system-ui,sans-serif}
        .offline{text-align:center;padding:2rem}
        h1{font-size:2rem;margin-bottom:1rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        p{color:#9ca3af;margin-bottom:1.5rem}
        button{padding:0.75rem 2rem;border-radius:0.75rem;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:700;cursor:pointer;font-size:0.875rem}
        button:hover{opacity:0.9}
      </style></head>
      <body>
        <div class="offline">
          <h1>🔌 CryptoIA — Hors ligne</h1>
          <p>Vous êtes actuellement hors ligne. Vérifiez votre connexion internet et réessayez.</p>
          <button onclick="location.reload()">🔄 Réessayer</button>
        </div>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/**
 * Stale While Revalidate: Serve from cache immediately, update in background.
 * Best for content that can be slightly stale.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// ── Push Notifications (future) ───────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Periodic cache cleanup ────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHES') {
    caches.open(API_CACHE).then((cache) => {
      cache.keys().then((keys) => {
        // Remove API cache entries older than 1 hour
        const maxAge = 60 * 60 * 1000;
        keys.forEach((key) => {
          cache.match(key).then((response) => {
            if (response) {
              const dateHeader = response.headers.get('date');
              if (dateHeader) {
                const age = Date.now() - new Date(dateHeader).getTime();
                if (age > maxAge) {
                  cache.delete(key);
                }
              }
            }
          });
        });
      });
    });
  }
});