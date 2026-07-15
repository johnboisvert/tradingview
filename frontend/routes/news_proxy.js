// Crypto news proxies (extracted from server.js — Session 42).
//   GET /api/news        — CryptoPanic free feed
//   GET /api/news-crypto — CryptoCompare latest news
export default function registerNewsProxyRoutes(app) {
  // ─── CryptoPanic News API proxy ───
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

  // ─── CryptoCompare News API proxy ───
  app.get('/api/news-crypto', async (req, res) => {
    const targetUrl = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest`;

    try {
      const upstreamRes = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });

      const data = await upstreamRes.text();
      res.status(upstreamRes.status)
        .set('Content-Type', 'application/json')
        .send(data);
    } catch (err) {
      console.error('CryptoCompare news proxy error:', err);
      res.status(502).json({ error: 'News proxy failed', message: err?.message });
    }
  });
}
