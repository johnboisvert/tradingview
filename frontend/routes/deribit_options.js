// Deribit options chain proxy (Terminal Pro OptionsWidget).
//   GET /api/deribit/options?currency=BTC|ETH
//   → { ok, currency, underlying, expiry, expiry_ts, rows:[{strike, call, put}], pc_oi_ratio }
// Nearest expiry, strikes centered around spot. 120s cache per currency.
const CACHE_TTL_MS = 120 * 1000;
const cache = {}; // { BTC: { ts, payload }, ETH: ... }

const MONTHS = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };

// "28AUG26" → timestamp (08:00 UTC Deribit expiry)
function parseExpiry(s) {
  const m = /^(\d{1,2})([A-Z]{3})(\d{2})$/.exec(s);
  if (!m) return null;
  const month = MONTHS[m[2]];
  if (month === undefined) return null;
  return Date.UTC(2000 + Number(m[3]), month, Number(m[1]), 8, 0, 0);
}

export default function registerDeribitOptionsRoutes(app) {
  app.get('/api/deribit/options', async (req, res) => {
    const currency = String(req.query.currency || 'BTC').toUpperCase();
    if (!['BTC', 'ETH'].includes(currency)) {
      return res.status(400).json({ ok: false, error: 'currency must be BTC or ETH' });
    }
    const c = cache[currency];
    if (c && Date.now() - c.ts < CACHE_TTL_MS) return res.json(c.payload);

    try {
      const r = await fetch(`https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=${currency}&kind=option`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'CryptoIA/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      const j = await r.json();
      const list = j?.result;
      if (!Array.isArray(list) || list.length === 0) throw new Error('empty deribit result');

      // Parse instruments: BTC-28AUG26-46000-C
      const parsed = [];
      let callOi = 0, putOi = 0;
      for (const x of list) {
        const parts = String(x.instrument_name || '').split('-');
        if (parts.length !== 4) continue;
        const expiryTs = parseExpiry(parts[1]);
        const strike = Number(parts[2]);
        const type = parts[3];
        if (!expiryTs || !Number.isFinite(strike) || (type !== 'C' && type !== 'P')) continue;
        const oi = Number(x.open_interest) || 0;
        if (type === 'C') callOi += oi; else putOi += oi;
        parsed.push({
          expiry: parts[1], expiryTs, strike, type,
          mark: Number(x.mark_price) || 0,
          iv: Number(x.mark_iv) || 0,
          oi,
          underlying: Number(x.underlying_price) || 0,
        });
      }
      if (parsed.length === 0) throw new Error('no parsable instruments');

      // Nearest future expiry
      const now = Date.now();
      const expiries = [...new Set(parsed.filter(p => p.expiryTs > now).map(p => p.expiryTs))].sort((a, b) => a - b);
      const targetTs = expiries[0];
      const chain = parsed.filter(p => p.expiryTs === targetTs);
      const underlying = chain.find(p => p.underlying > 0)?.underlying || 0;

      // 8 strikes centered around spot
      const strikes = [...new Set(chain.map(p => p.strike))].sort((a, b) => a - b);
      const sorted = [...strikes].sort((a, b) => Math.abs(a - underlying) - Math.abs(b - underlying));
      const selected = new Set(sorted.slice(0, 8));
      const rows = strikes
        .filter(s => selected.has(s))
        .map(strike => {
          const call = chain.find(p => p.strike === strike && p.type === 'C');
          const put = chain.find(p => p.strike === strike && p.type === 'P');
          const mk = (o) => o ? { usd: Math.round(o.mark * underlying * 100) / 100, iv: o.iv, oi: o.oi } : null;
          return { strike, call: mk(call), put: mk(put) };
        });

      const payload = {
        ok: true,
        currency,
        underlying,
        expiry: chain[0].expiry,
        expiry_ts: targetTs,
        rows,
        pc_oi_ratio: callOi > 0 ? Math.round((putOi / callOi) * 100) / 100 : null,
        fetched_at: new Date().toISOString(),
      };
      cache[currency] = { ts: Date.now(), payload };
      res.json(payload);
    } catch (e) {
      console.error('[Deribit] options error:', e?.message);
      if (c?.payload) return res.json(c.payload); // stale
      res.status(502).json({ ok: false, error: e?.message || 'deribit unavailable' });
    }
  });
}
