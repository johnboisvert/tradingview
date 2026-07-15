// Binance market data proxies (extracted from server.js).
//   GET /api/binance/klines  — candlesticks (Binance mirror + Bybit fallback)
//   GET /api/binance/depth   — order book depth (Terminal Pro OrderBookWidget)
//   GET /api/binance/funding — perp funding rates (Terminal Pro FundingWidget)
// All routed server-side to avoid browser geo/CORS restrictions.
import {
  INVALID_BINANCE_SYMBOLS,
  BYBIT_FALLBACK_SYMBOLS,
  STABLECOIN_BASES,
  bybitKlinesToBinanceFormat,
  fetchBybitKlines,
} from '../lib/market_sources.js';

let fundingCache = { ts: 0, payload: null };
const FUNDING_TTL_MS = 60 * 1000;

export default function registerBinanceMarketRoutes(app) {
  app.get('/api/binance/klines', async (req, res) => {
    const { symbol, interval, limit } = req.query;

    // Validate symbol format
    if (!symbol || typeof symbol !== 'string' || symbol.length < 5 || !symbol.endsWith('USDT')) {
      return res.status(400).json({ error: 'Invalid symbol format', symbol });
    }

    // Extract base and check if it's a stablecoin (e.g., USDTUSDT is invalid)
    const base = symbol.replace(/USDT$/, '');
    if (!base || base.length < 2 || STABLECOIN_BASES.has(base)) {
      return res.status(400).json({ error: 'Invalid or stablecoin symbol', symbol });
    }

    const effectiveInterval = interval || '1h';
    const effectiveLimit = limit || '168';

    // If we know this symbol needs Bybit, go directly to Bybit
    if (BYBIT_FALLBACK_SYMBOLS.has(symbol)) {
      try {
        const bybitList = await fetchBybitKlines(symbol, effectiveInterval, effectiveLimit);
        if (bybitList) {
          const binanceFormat = bybitKlinesToBinanceFormat(bybitList);
          return res.status(200).set('Content-Type', 'application/json').json(binanceFormat);
        }
      } catch (err) {
        console.error(`[Bybit] Klines fallback error for ${symbol}:`, err.message);
      }
      return res.status(400).json({ error: 'Symbol not available on Binance or Bybit', symbol });
    }

    // Check cached invalid symbols (not on Binance AND not on Bybit)
    if (INVALID_BINANCE_SYMBOLS.has(symbol)) {
      return res.status(400).json({ error: 'Known invalid symbol', symbol });
    }

    const targetUrl = `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${effectiveInterval}&limit=${effectiveLimit}`;

    try {
      const upstreamRes = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'User-Agent': 'CryptoIA/1.0' },
        signal: AbortSignal.timeout(15000),
      });

      // If Binance returns 400 (invalid symbol), try Bybit as fallback
      if (upstreamRes.status === 400 || upstreamRes.status === 451) {
        console.log(`[Binance] ${symbol} returned ${upstreamRes.status}, trying Bybit fallback...`);
        try {
          const bybitList = await fetchBybitKlines(symbol, effectiveInterval, effectiveLimit);
          if (bybitList) {
            BYBIT_FALLBACK_SYMBOLS.add(symbol); // Cache for future requests
            console.log(`[Bybit] ✅ ${symbol} found on Bybit (${bybitList.length} klines)`);
            const binanceFormat = bybitKlinesToBinanceFormat(bybitList);
            return res.status(200).set('Content-Type', 'application/json').json(binanceFormat);
          }
        } catch (bybitErr) {
          console.error(`[Bybit] Fallback error for ${symbol}:`, bybitErr.message);
        }
        // Neither Binance nor Bybit has this symbol
        INVALID_BINANCE_SYMBOLS.add(symbol);
        return res.status(400).json({ error: 'Symbol not available on Binance or Bybit', symbol });
      }

      const data = await upstreamRes.text();
      res.status(upstreamRes.status)
        .set('Content-Type', 'application/json')
        .send(data);
    } catch (err) {
      console.error('Binance proxy error:', err);
      // On network error, also try Bybit
      try {
        const bybitList = await fetchBybitKlines(symbol, effectiveInterval, effectiveLimit);
        if (bybitList) {
          const binanceFormat = bybitKlinesToBinanceFormat(bybitList);
          return res.status(200).set('Content-Type', 'application/json').json(binanceFormat);
        }
      } catch (_e) { /* ignore */ }
      res.status(502).json({ error: 'Binance proxy failed', message: err?.message });
    }
  });

  // -----------------------------------------------------------------
  // Binance Order Book Depth proxy (used by Terminal Pro OrderBookWidget)
  // GET /api/binance/depth?symbol=BTCUSDT&limit=20
  // -----------------------------------------------------------------
  app.get('/api/binance/depth', async (req, res) => {
    const { symbol, limit } = req.query;
    if (!symbol || typeof symbol !== 'string' || symbol.length < 5 || !symbol.endsWith('USDT')) {
      return res.status(400).json({ error: 'Invalid symbol format', symbol });
    }
    const base = symbol.replace(/USDT$/, '');
    if (!base || base.length < 2 || STABLECOIN_BASES.has(base)) {
      return res.status(400).json({ error: 'Invalid or stablecoin symbol', symbol });
    }
    const effLimit = Math.max(5, Math.min(100, parseInt(String(limit || '20'), 10) || 20));

    if (INVALID_BINANCE_SYMBOLS.has(symbol)) {
      return res.status(400).json({ error: 'Known invalid symbol', symbol });
    }

    const targetUrl = `https://data-api.binance.vision/api/v3/depth?symbol=${symbol}&limit=${effLimit}`;
    try {
      const upstreamRes = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'User-Agent': 'CryptoIA/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (upstreamRes.status === 400 || upstreamRes.status === 451) {
        INVALID_BINANCE_SYMBOLS.add(symbol);
        return res.status(400).json({ error: 'Symbol not available on Binance', symbol });
      }
      const data = await upstreamRes.text();
      res.status(upstreamRes.status)
        .set('Content-Type', 'application/json')
        .set('Cache-Control', 'no-store')
        .send(data);
    } catch (err) {
      console.error('Binance depth proxy error:', err?.message || err);
      res.status(502).json({ error: 'Binance depth proxy failed', message: err?.message });
    }
  });

  // -----------------------------------------------------------------
  // Perp funding rates (Terminal Pro FundingWidget + derivatives sentiment)
  // GET /api/binance/funding → { ok, source, rows:[{symbol, funding_rate, mark_price, next_funding_time}] }
  // -----------------------------------------------------------------
  app.get('/api/binance/funding', async (req, res) => {
    const payload = await getFundingRows();
    if (payload) return res.json(payload);
    res.status(502).json({ ok: false, error: 'funding sources unavailable' });
  });
}

// Shared getter (used by the route above and by derivatives sentiment).
// Binance futures first; Bybit linear then Gate.io fallbacks; 60s cache + stale.
export async function getFundingRows() {
  if (fundingCache.payload && Date.now() - fundingCache.ts < FUNDING_TTL_MS) {
    return fundingCache.payload;
  }
  // 1) Binance futures premiumIndex
  try {
    const r = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex', {
      headers: { 'Accept': 'application/json', 'User-Agent': 'CryptoIA/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const arr = await r.json();
      const rows = (Array.isArray(arr) ? arr : [])
        .filter((x) => typeof x?.symbol === 'string' && x.symbol.endsWith('USDT') && x.lastFundingRate !== undefined)
        .map((x) => ({
          symbol: x.symbol,
          funding_rate: parseFloat(x.lastFundingRate),
          mark_price: parseFloat(x.markPrice),
          next_funding_time: Number(x.nextFundingTime) || null,
        }))
        .filter((x) => Number.isFinite(x.funding_rate));
      if (rows.length > 0) {
        const payload = { ok: true, source: 'binance', rows, fetched_at: new Date().toISOString() };
        fundingCache = { ts: Date.now(), payload };
        return payload;
      }
    }
  } catch (e) {
    console.error('[Funding] Binance futures error:', e?.message);
  }
  // 2) Bybit linear fallback
  try {
    const r = await fetch('https://api.bybit.com/v5/market/tickers?category=linear', {
      headers: { 'Accept': 'application/json', 'User-Agent': 'CryptoIA/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json();
    if (j.retCode === 0 && Array.isArray(j.result?.list)) {
      const rows = j.result.list
        .filter((x) => typeof x?.symbol === 'string' && x.symbol.endsWith('USDT') && x.fundingRate !== '')
        .map((x) => ({
          symbol: x.symbol,
          funding_rate: parseFloat(x.fundingRate),
          mark_price: parseFloat(x.markPrice),
          next_funding_time: Number(x.nextFundingTime) || null,
        }))
        .filter((x) => Number.isFinite(x.funding_rate));
      if (rows.length > 0) {
        const payload = { ok: true, source: 'bybit', rows, fetched_at: new Date().toISOString() };
        fundingCache = { ts: Date.now(), payload };
        return payload;
      }
    }
  } catch (e) {
    console.error('[Funding] Bybit fallback error:', e?.message);
  }
  // 3) Gate.io fallback (no geo restrictions)
  try {
    const r = await fetch('https://api.gateio.ws/api/v4/futures/usdt/contracts', {
      headers: { 'Accept': 'application/json', 'User-Agent': 'CryptoIA/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const arr = await r.json();
      const rows = (Array.isArray(arr) ? arr : [])
        .filter((x) => typeof x?.name === 'string' && x.name.endsWith('_USDT') && x.funding_rate !== undefined && !x.in_delisting)
        .map((x) => ({
          symbol: x.name.replace('_', ''),
          funding_rate: parseFloat(x.funding_rate),
          mark_price: parseFloat(x.mark_price),
          next_funding_time: x.funding_next_apply ? Number(x.funding_next_apply) * 1000 : null,
        }))
        .filter((x) => Number.isFinite(x.funding_rate));
      if (rows.length > 0) {
        const payload = { ok: true, source: 'gateio', rows, fetched_at: new Date().toISOString() };
        fundingCache = { ts: Date.now(), payload };
        return payload;
      }
    }
  } catch (e) {
    console.error('[Funding] Gate.io fallback error:', e?.message);
  }
  return fundingCache.payload || null; // stale or null
}
