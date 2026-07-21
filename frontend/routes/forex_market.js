// Forex, métaux précieux & indice DXY — données marché via Yahoo Finance spark (sans clé API).
//   GET /api/v1/forex/rates → { ok, source, fetched_at, rows: [...] }
// 82 instruments : 7 majeures, 21 croisées, 48 exotiques, 5 métaux, 1 indice.
// Yahoo spark limite ~20 symboles/requête → chunks parallèles + cache 60s + stale fallback.

const INSTRUMENTS = [
  // ── Paires majeures (7) ──
  { y: 'EURUSD=X', pair: 'EUR/USD', name: 'Euro / Dollar US', category: 'major' },
  { y: 'GBPUSD=X', pair: 'GBP/USD', name: 'Livre sterling / Dollar US', category: 'major' },
  { y: 'USDJPY=X', pair: 'USD/JPY', name: 'Dollar US / Yen japonais', category: 'major' },
  { y: 'USDCHF=X', pair: 'USD/CHF', name: 'Dollar US / Franc suisse', category: 'major' },
  { y: 'USDCAD=X', pair: 'USD/CAD', name: 'Dollar US / Dollar canadien', category: 'major' },
  { y: 'AUDUSD=X', pair: 'AUD/USD', name: 'Dollar australien / Dollar US', category: 'major' },
  { y: 'NZDUSD=X', pair: 'NZD/USD', name: 'Dollar néo-zélandais / Dollar US', category: 'major' },
  // ── Paires croisées (21) ──
  { y: 'EURGBP=X', pair: 'EUR/GBP', name: 'Euro / Livre sterling', category: 'cross' },
  { y: 'EURJPY=X', pair: 'EUR/JPY', name: 'Euro / Yen japonais', category: 'cross' },
  { y: 'EURCHF=X', pair: 'EUR/CHF', name: 'Euro / Franc suisse', category: 'cross' },
  { y: 'EURCAD=X', pair: 'EUR/CAD', name: 'Euro / Dollar canadien', category: 'cross' },
  { y: 'EURAUD=X', pair: 'EUR/AUD', name: 'Euro / Dollar australien', category: 'cross' },
  { y: 'EURNZD=X', pair: 'EUR/NZD', name: 'Euro / Dollar néo-zélandais', category: 'cross' },
  { y: 'GBPJPY=X', pair: 'GBP/JPY', name: 'Livre sterling / Yen japonais', category: 'cross' },
  { y: 'GBPCHF=X', pair: 'GBP/CHF', name: 'Livre sterling / Franc suisse', category: 'cross' },
  { y: 'GBPCAD=X', pair: 'GBP/CAD', name: 'Livre sterling / Dollar canadien', category: 'cross' },
  { y: 'GBPAUD=X', pair: 'GBP/AUD', name: 'Livre sterling / Dollar australien', category: 'cross' },
  { y: 'GBPNZD=X', pair: 'GBP/NZD', name: 'Livre sterling / Dollar néo-zélandais', category: 'cross' },
  { y: 'AUDJPY=X', pair: 'AUD/JPY', name: 'Dollar australien / Yen japonais', category: 'cross' },
  { y: 'AUDNZD=X', pair: 'AUD/NZD', name: 'Dollar australien / Dollar néo-zélandais', category: 'cross' },
  { y: 'AUDCAD=X', pair: 'AUD/CAD', name: 'Dollar australien / Dollar canadien', category: 'cross' },
  { y: 'AUDCHF=X', pair: 'AUD/CHF', name: 'Dollar australien / Franc suisse', category: 'cross' },
  { y: 'NZDJPY=X', pair: 'NZD/JPY', name: 'Dollar néo-zélandais / Yen japonais', category: 'cross' },
  { y: 'NZDCAD=X', pair: 'NZD/CAD', name: 'Dollar néo-zélandais / Dollar canadien', category: 'cross' },
  { y: 'NZDCHF=X', pair: 'NZD/CHF', name: 'Dollar néo-zélandais / Franc suisse', category: 'cross' },
  { y: 'CADJPY=X', pair: 'CAD/JPY', name: 'Dollar canadien / Yen japonais', category: 'cross' },
  { y: 'CADCHF=X', pair: 'CAD/CHF', name: 'Dollar canadien / Franc suisse', category: 'cross' },
  { y: 'CHFJPY=X', pair: 'CHF/JPY', name: 'Franc suisse / Yen japonais', category: 'cross' },
  // ── Paires exotiques USD (30) ──
  { y: 'USDSEK=X', pair: 'USD/SEK', name: 'Dollar US / Couronne suédoise', category: 'exotic' },
  { y: 'USDNOK=X', pair: 'USD/NOK', name: 'Dollar US / Couronne norvégienne', category: 'exotic' },
  { y: 'USDDKK=X', pair: 'USD/DKK', name: 'Dollar US / Couronne danoise', category: 'exotic' },
  { y: 'USDPLN=X', pair: 'USD/PLN', name: 'Dollar US / Zloty polonais', category: 'exotic' },
  { y: 'USDHUF=X', pair: 'USD/HUF', name: 'Dollar US / Forint hongrois', category: 'exotic' },
  { y: 'USDCZK=X', pair: 'USD/CZK', name: 'Dollar US / Couronne tchèque', category: 'exotic' },
  { y: 'USDRON=X', pair: 'USD/RON', name: 'Dollar US / Leu roumain', category: 'exotic' },
  { y: 'USDTRY=X', pair: 'USD/TRY', name: 'Dollar US / Livre turque', category: 'exotic' },
  { y: 'USDZAR=X', pair: 'USD/ZAR', name: 'Dollar US / Rand sud-africain', category: 'exotic' },
  { y: 'USDMXN=X', pair: 'USD/MXN', name: 'Dollar US / Peso mexicain', category: 'exotic' },
  { y: 'USDBRL=X', pair: 'USD/BRL', name: 'Dollar US / Réal brésilien', category: 'exotic' },
  { y: 'USDARS=X', pair: 'USD/ARS', name: 'Dollar US / Peso argentin', category: 'exotic' },
  { y: 'USDCLP=X', pair: 'USD/CLP', name: 'Dollar US / Peso chilien', category: 'exotic' },
  { y: 'USDCOP=X', pair: 'USD/COP', name: 'Dollar US / Peso colombien', category: 'exotic' },
  { y: 'USDSGD=X', pair: 'USD/SGD', name: 'Dollar US / Dollar de Singapour', category: 'exotic' },
  { y: 'USDHKD=X', pair: 'USD/HKD', name: 'Dollar US / Dollar de Hong Kong', category: 'exotic' },
  { y: 'USDCNH=X', pair: 'USD/CNH', name: 'Dollar US / Yuan offshore', category: 'exotic' },
  { y: 'USDCNY=X', pair: 'USD/CNY', name: 'Dollar US / Yuan chinois', category: 'exotic' },
  { y: 'USDINR=X', pair: 'USD/INR', name: 'Dollar US / Roupie indienne', category: 'exotic' },
  { y: 'USDKRW=X', pair: 'USD/KRW', name: 'Dollar US / Won sud-coréen', category: 'exotic' },
  { y: 'USDTHB=X', pair: 'USD/THB', name: 'Dollar US / Baht thaïlandais', category: 'exotic' },
  { y: 'USDIDR=X', pair: 'USD/IDR', name: 'Dollar US / Roupie indonésienne', category: 'exotic' },
  { y: 'USDPHP=X', pair: 'USD/PHP', name: 'Dollar US / Peso philippin', category: 'exotic' },
  { y: 'USDMYR=X', pair: 'USD/MYR', name: 'Dollar US / Ringgit malaisien', category: 'exotic' },
  { y: 'USDTWD=X', pair: 'USD/TWD', name: 'Dollar US / Dollar taïwanais', category: 'exotic' },
  { y: 'USDVND=X', pair: 'USD/VND', name: 'Dollar US / Dong vietnamien', category: 'exotic' },
  { y: 'USDILS=X', pair: 'USD/ILS', name: 'Dollar US / Shekel israélien', category: 'exotic' },
  { y: 'USDSAR=X', pair: 'USD/SAR', name: 'Dollar US / Riyal saoudien', category: 'exotic' },
  { y: 'USDAED=X', pair: 'USD/AED', name: 'Dollar US / Dirham émirati', category: 'exotic' },
  { y: 'USDRUB=X', pair: 'USD/RUB', name: 'Dollar US / Rouble russe', category: 'exotic' },
  // ── Paires exotiques EUR (11) ──
  { y: 'EURSEK=X', pair: 'EUR/SEK', name: 'Euro / Couronne suédoise', category: 'exotic' },
  { y: 'EURNOK=X', pair: 'EUR/NOK', name: 'Euro / Couronne norvégienne', category: 'exotic' },
  { y: 'EURDKK=X', pair: 'EUR/DKK', name: 'Euro / Couronne danoise', category: 'exotic' },
  { y: 'EURPLN=X', pair: 'EUR/PLN', name: 'Euro / Zloty polonais', category: 'exotic' },
  { y: 'EURHUF=X', pair: 'EUR/HUF', name: 'Euro / Forint hongrois', category: 'exotic' },
  { y: 'EURCZK=X', pair: 'EUR/CZK', name: 'Euro / Couronne tchèque', category: 'exotic' },
  { y: 'EURTRY=X', pair: 'EUR/TRY', name: 'Euro / Livre turque', category: 'exotic' },
  { y: 'EURZAR=X', pair: 'EUR/ZAR', name: 'Euro / Rand sud-africain', category: 'exotic' },
  { y: 'EURMXN=X', pair: 'EUR/MXN', name: 'Euro / Peso mexicain', category: 'exotic' },
  { y: 'EURSGD=X', pair: 'EUR/SGD', name: 'Euro / Dollar de Singapour', category: 'exotic' },
  { y: 'EURHKD=X', pair: 'EUR/HKD', name: 'Euro / Dollar de Hong Kong', category: 'exotic' },
  // ── Paires exotiques GBP (7) ──
  { y: 'GBPSEK=X', pair: 'GBP/SEK', name: 'Livre sterling / Couronne suédoise', category: 'exotic' },
  { y: 'GBPNOK=X', pair: 'GBP/NOK', name: 'Livre sterling / Couronne norvégienne', category: 'exotic' },
  { y: 'GBPPLN=X', pair: 'GBP/PLN', name: 'Livre sterling / Zloty polonais', category: 'exotic' },
  { y: 'GBPTRY=X', pair: 'GBP/TRY', name: 'Livre sterling / Livre turque', category: 'exotic' },
  { y: 'GBPZAR=X', pair: 'GBP/ZAR', name: 'Livre sterling / Rand sud-africain', category: 'exotic' },
  { y: 'GBPSGD=X', pair: 'GBP/SGD', name: 'Livre sterling / Dollar de Singapour', category: 'exotic' },
  { y: 'GBPMXN=X', pair: 'GBP/MXN', name: 'Livre sterling / Peso mexicain', category: 'exotic' },
  // ── Métaux précieux & industriels (5) ──
  { y: 'GC=F', pair: 'XAU/USD', name: 'Or (Gold)', category: 'metal' },
  { y: 'SI=F', pair: 'XAG/USD', name: 'Argent (Silver)', category: 'metal' },
  { y: 'PL=F', pair: 'XPT/USD', name: 'Platine (Platinum)', category: 'metal' },
  { y: 'PA=F', pair: 'XPD/USD', name: 'Palladium', category: 'metal' },
  { y: 'HG=F', pair: 'COPPER', name: 'Cuivre (Copper)', category: 'metal' },
  // ── Indice (1) ──
  { y: 'DX-Y.NYB', pair: 'DXY', name: 'US Dollar Index', category: 'index' },
];

const CHUNK_SIZE = 20; // limite Yahoo spark
const TTL_MS = 60 * 1000;
let cache = { ts: 0, payload: null };

function downsample(arr, max = 32) {
  if (arr.length <= max) return arr;
  const step = arr.length / max;
  const out = [];
  for (let i = 0; i < max; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}

async function fetchSparkChunk(symbols, host) {
  const url = `https://${host}/v7/finance/spark?symbols=${symbols.map(encodeURIComponent).join(',')}&range=1d&interval=15m`;
  const r = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (CryptoIA/1.0)' },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`spark ${r.status}`);
  const j = await r.json();
  return j.spark?.result || [];
}

async function fetchAllRates() {
  const chunks = [];
  for (let i = 0; i < INSTRUMENTS.length; i += CHUNK_SIZE) {
    chunks.push(INSTRUMENTS.slice(i, i + CHUNK_SIZE).map((x) => x.y));
  }
  const results = await Promise.all(
    chunks.map(async (c) => {
      try {
        return await fetchSparkChunk(c, 'query1.finance.yahoo.com');
      } catch (e) {
        console.error('[Forex] query1 chunk error:', e?.message, '→ retry query2');
        return fetchSparkChunk(c, 'query2.finance.yahoo.com');
      }
    })
  );
  const bySymbol = new Map();
  for (const list of results) {
    for (const it of list) {
      const resp = it.response?.[0];
      if (resp?.meta?.regularMarketPrice !== undefined) bySymbol.set(it.symbol, resp);
    }
  }
  const rows = [];
  for (const inst of INSTRUMENTS) {
    const resp = bySymbol.get(inst.y);
    if (!resp) continue;
    const m = resp.meta;
    const price = m.regularMarketPrice;
    const prev = m.chartPreviousClose ?? m.previousClose ?? null;
    const closes = (resp.indicators?.quote?.[0]?.close || []).filter((v) => Number.isFinite(v));
    rows.push({
      pair: inst.pair,
      name: inst.name,
      category: inst.category,
      price,
      prev_close: prev,
      change_pct: prev ? ((price - prev) / prev) * 100 : 0,
      day_high: m.regularMarketDayHigh ?? null,
      day_low: m.regularMarketDayLow ?? null,
      spark: downsample(closes),
    });
  }
  return rows;
}

export default function registerForexMarketRoutes(app) {
  app.get('/api/v1/forex/rates', async (req, res) => {
    if (cache.payload && Date.now() - cache.ts < TTL_MS) {
      return res.json(cache.payload);
    }
    try {
      const rows = await fetchAllRates();
      if (rows.length === 0) throw new Error('no rows');
      const payload = {
        ok: true,
        source: 'yahoo',
        total: rows.length,
        fetched_at: new Date().toISOString(),
        rows,
      };
      cache = { ts: Date.now(), payload };
      res.json(payload);
    } catch (e) {
      console.error('[Forex] rates error:', e?.message);
      if (cache.payload) return res.json({ ...cache.payload, stale: true });
      res.status(502).json({ ok: false, error: 'forex sources unavailable' });
    }
  });
}
