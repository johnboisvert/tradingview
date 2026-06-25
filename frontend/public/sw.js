const CACHE_VERSION = 'v5';
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

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Always returns a valid Response — never throws or returns null/undefined. */
function offlineResponse(type = 'asset') {
  if (type === 'json') {
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'Network unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return new Response('Offline — Resource unavailable', {
    status: 503,
    headers: { 'Content-Type': 'text/plain' },
  });
}

/** Safely put a response in cache without throwing (quota, opaque, etc.). */
function safeCachePut(cache, request, response) {
  try {
    cache.put(request, response).catch(() => {});
  } catch {
    // ignore — never block the fetch handler
  }
}

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing CryptoIA Service Worker v5...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache partial failure (non-blocking):', err);
      });
    })
  );
  // One-time forced upgrade: many users got stuck on a v3/v4 service worker
  // that cached stale JS bundles (e.g. without /compare and /crypto routes).
  // Re-enable skipWaiting for v5 ONLY so every existing client switches
  // immediately on next visit; future versions (v6+) will revert to the
  // user-opt-in flow via the UpdateBanner.
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating CryptoIA Service Worker v5...');
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
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return; // invalid URL — let the browser handle it
  }

  // Skip non-GET requests (POST/PUT/DELETE must go to network)
  if (request.method !== 'GET') return;

  // Skip chrome-extension and non-http(s) (wallets, devtools, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Skip cross-origin POST-like preflights or browser-internal requests
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

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
 * GUARANTEES a Response is always returned (never null/undefined).
 */
async function cacheFirst(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response && response.ok && response.status === 200) {
      const cache = await caches.open(cacheName);
      safeCachePut(cache, request, response.clone());
    }
    return response || offlineResponse('asset');
  } catch {
    // network failed AND no cache → try one last time in any cache
    const fallback = await caches.match(request);
    return fallback || offlineResponse('asset');
  }
}

/**
 * Network First: Try network, fall back to cache.
 * GUARANTEES a Response is always returned.
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.ok && response.status === 200) {
      const cache = await caches.open(cacheName);
      safeCachePut(cache, request, response.clone());
    }
    return response || offlineResponse('json');
  } catch {
    const cached = await caches.match(request);
    return cached || offlineResponse('json');
  }
}

/**
 * Network First with HTML fallback for navigation requests.
 * GUARANTEES a Response is always returned.
 */
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      safeCachePut(cache, request, response.clone());
    }
    if (response) return response;
    // fall through to cache lookup below
  } catch {
    // network failed — try cache below
  }

  const cached = await caches.match(request);
  if (cached) return cached;

  const indexCached = await caches.match('/index.html');
  if (indexCached) return indexCached;

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
        <p>Vous êtes actuellement hors ligne. Vérifiez votre connexion et réessayez.</p>
        <button onclick="location.reload()">🔄 Réessayer</button>
      </div>
    </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

/**
 * Stale While Revalidate: Serve from cache immediately, update in background.
 * GUARANTEES a Response is always returned — fixes the "Failed to convert value to 'Response'" bug.
 */
async function staleWhileRevalidate(request, cacheName) {
  let cache;
  try {
    cache = await caches.open(cacheName);
  } catch {
    cache = null;
  }
  const cached = cache ? await cache.match(request) : null;

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok && response.status === 200 && cache) {
        safeCachePut(cache, request, response.clone());
      }
      return response || cached || offlineResponse('asset');
    })
    .catch(() => cached || offlineResponse('asset'));

  // If we have cached, serve it instantly; otherwise wait for network.
  return cached || fetchPromise;
}

// ── Messages from clients ─────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (event.data.type === 'CLEANUP_CACHES') {
    caches.open(API_CACHE).then((cache) => {
      cache.keys().then((keys) => {
        const maxAge = 60 * 60 * 1000; // 1h
        keys.forEach((key) => {
          cache.match(key).then((response) => {
            if (response) {
              const dateHeader = response.headers.get('date');
              if (dateHeader) {
                const age = Date.now() - new Date(dateHeader).getTime();
                if (age > maxAge) cache.delete(key);
              }
            }
          });
        });
      });
    });
  }
});

// ─── Web Push handlers (Session 13) ─────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'CryptoIA', body: 'New notification', url: '/' };
  try { if (event.data) data = { ...data, ...event.data.json() }; }
  catch { if (event.data) data.body = event.data.text(); }
  const options = {
    body: data.body,
    icon: data.icon || '/assets/logo1.png',
    badge: data.badge || '/assets/logo1.png',
    vibrate: [80, 40, 80],
    data: { url: data.url || '/' },
    tag: data.tag || 'cryptoia-push',
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(url) && 'focus' in w) return w.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
