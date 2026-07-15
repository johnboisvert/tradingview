// Crypto news proxies (extracted from server.js — Session 42, RSS fallback Session 43).
//   GET /api/news        — CryptoPanic free feed (legacy, no frontend consumer)
//   GET /api/news-crypto — CryptoCompare, with RSS fallback (Cointelegraph + Decrypt)
// Response is dual-format: { Data:[...cryptocompare-like...], articles:[{title,link,source,published_at}] }
// so both News.tsx (Data) and NewsFlashWidget (articles) always work.

const RSS_FEEDS = [
  { url: 'https://cointelegraph.com/rss', source: 'Cointelegraph' },
  { url: 'https://decrypt.co/feed', source: 'Decrypt' },
];
const NEWS_TTL_MS = 5 * 60 * 1000;
let newsCache = { ts: 0, payload: null };

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
}

function parseRss(xml, source) {
  const items = [];
  const blocks = String(xml).split('<item>').slice(1);
  for (const b of blocks.slice(0, 20)) {
    const pick = (tag) => {
      const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(b);
      let v = m ? m[1].trim() : '';
      return v.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
    };
    const title = decodeEntities(pick('title'));
    const link = pick('link');
    const pub = pick('pubDate');
    if (!title || !link.startsWith('http')) continue;
    let published_at = null;
    try { published_at = pub ? new Date(pub).toISOString() : null; } catch { /* skip */ }
    items.push({ title, link, source, published_at });
  }
  return items;
}

function toDualFormat(articles, sourceLabel) {
  return {
    Type: 100,
    Message: `News list (${sourceLabel})`,
    source: sourceLabel,
    Data: articles.map((it, i) => ({
      id: `${sourceLabel}-${i}`,
      title: it.title,
      url: it.link,
      source_info: { name: it.source },
      published_on: it.published_at ? Math.floor(new Date(it.published_at).getTime() / 1000) : Math.floor(Date.now() / 1000),
      categories: '',
    })),
    articles,
  };
}

async function fetchRssFallback() {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (f) => {
      const r = await fetch(f.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CryptoIA/1.0)', 'Accept': 'application/rss+xml, application/xml, text/xml' },
        signal: AbortSignal.timeout(12000),
      });
      if (!r.ok) throw new Error(`${f.source}: HTTP ${r.status}`);
      return parseRss(await r.text(), f.source);
    })
  );
  const all = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  if (all.length === 0) return null;
  all.sort((a, b) => String(b.published_at || '').localeCompare(String(a.published_at || '')));
  return toDualFormat(all.slice(0, 40), 'rss');
}

export default function registerNewsProxyRoutes(app) {
  // ─── CryptoPanic News API proxy (legacy) ───
  app.get('/api/news', async (req, res) => {
    const targetUrl = `https://cryptopanic.com/api/free/v1/posts/?auth_token=free&public=true&kind=news`;

    try {
      const upstreamRes = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(15000),
      });

      const data = await upstreamRes.text();
      const contentType = upstreamRes.headers.get('content-type') || '';

      // If response is HTML (Cloudflare challenge) or non-JSON, return proper error
      if (!contentType.includes('application/json') || data.trim().startsWith('<!') || data.trim().startsWith('<html')) {
        return res.status(503).json({ error: 'CryptoPanic blocked by Cloudflare', results: null });
      }

      res.status(upstreamRes.status)
        .set('Content-Type', 'application/json')
        .send(data);
    } catch (err) {
      console.error('CryptoPanic proxy error:', err);
      res.status(502).json({ error: 'News proxy failed', message: err?.message });
    }
  });

  // ─── Crypto news: CryptoCompare → RSS fallback ───
  app.get('/api/news-crypto', async (req, res) => {
    if (newsCache.payload && Date.now() - newsCache.ts < NEWS_TTL_MS) {
      return res.json(newsCache.payload);
    }

    // 1) CryptoCompare (historical primary — currently returns 401 without API key)
    try {
      const r = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(12000),
      });
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j?.Data) && j.Data.length > 0) {
          // Enrich with `articles` so the Terminal NewsFlashWidget works too
          j.articles = j.Data.slice(0, 40).map((x) => ({
            title: x.title || '',
            link: x.url || '#',
            source: x.source_info?.name || 'Crypto News',
            published_at: x.published_on ? new Date(x.published_on * 1000).toISOString() : null,
          }));
          j.source = 'cryptocompare';
          newsCache = { ts: Date.now(), payload: j };
          return res.json(j);
        }
      }
    } catch (e) {
      console.error('[News] CryptoCompare error:', e?.message);
    }

    // 2) RSS fallback (Cointelegraph + Decrypt)
    try {
      const payload = await fetchRssFallback();
      if (payload) {
        newsCache = { ts: Date.now(), payload };
        return res.json(payload);
      }
    } catch (e) {
      console.error('[News] RSS fallback error:', e?.message);
    }

    if (newsCache.payload) return res.json(newsCache.payload); // stale
    res.status(502).json({ error: 'All news sources unavailable', Data: [], articles: [] });
  });
}
