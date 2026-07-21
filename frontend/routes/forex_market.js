// Forex, métaux précieux & indice DXY — données marché via Yahoo Finance spark (sans clé API).
//   GET /api/v1/forex/rates → { ok, source, fetched_at, rows: [...] }
// 212 instruments : 7 majeures, 21 croisées, 178 exotiques, 5 métaux, 1 indice.
// Yahoo spark limite ~20 symboles/requête → chunks parallèles + cache 60s + stale fallback.

const CCY = {
  USD: 'Dollar US', EUR: 'Euro', GBP: 'Livre sterling', JPY: 'Yen japonais', CHF: 'Franc suisse',
  CAD: 'Dollar canadien', AUD: 'Dollar australien', NZD: 'Dollar néo-zélandais',
  SEK: 'Couronne suédoise', NOK: 'Couronne norvégienne', DKK: 'Couronne danoise', ISK: 'Couronne islandaise',
  PLN: 'Zloty polonais', HUF: 'Forint hongrois', CZK: 'Couronne tchèque', RON: 'Leu roumain',
  BGN: 'Lev bulgare', RSD: 'Dinar serbe', UAH: 'Hryvnia ukrainienne', MDL: 'Leu moldave', BYN: 'Rouble biélorusse',
  TRY: 'Livre turque', RUB: 'Rouble russe', KZT: 'Tenge kazakh', GEL: 'Lari géorgien',
  AMD: 'Dram arménien', AZN: 'Manat azerbaïdjanais', UZS: 'Sum ouzbek',
  ZAR: 'Rand sud-africain', NGN: 'Naira nigérian', GHS: 'Cedi ghanéen', KES: 'Shilling kényan',
  TZS: 'Shilling tanzanien', UGX: 'Shilling ougandais', ZMW: 'Kwacha zambien', BWP: 'Pula botswanais',
  NAD: 'Dollar namibien', MUR: 'Roupie mauricienne', ETB: 'Birr éthiopien',
  XAF: 'Franc CFA (BEAC)', XOF: 'Franc CFA (BCEAO)', EGP: 'Livre égyptienne', MAD: 'Dirham marocain',
  TND: 'Dinar tunisien', DZD: 'Dinar algérien',
  MXN: 'Peso mexicain', BRL: 'Réal brésilien', ARS: 'Peso argentin', CLP: 'Peso chilien',
  COP: 'Peso colombien', PEN: 'Sol péruvien', UYU: 'Peso uruguayen', BOB: 'Boliviano bolivien',
  PYG: 'Guarani paraguayen', CRC: 'Colón costaricien', GTQ: 'Quetzal guatémaltèque', DOP: 'Peso dominicain',
  JMD: 'Dollar jamaïcain', TTD: 'Dollar trinidadien', HNL: 'Lempira hondurien', NIO: 'Córdoba nicaraguayen',
  SGD: 'Dollar de Singapour', HKD: 'Dollar de Hong Kong', CNH: 'Yuan offshore', CNY: 'Yuan chinois',
  INR: 'Roupie indienne', KRW: 'Won sud-coréen', THB: 'Baht thaïlandais', IDR: 'Roupie indonésienne',
  PHP: 'Peso philippin', MYR: 'Ringgit malaisien', TWD: 'Dollar taïwanais', VND: 'Dong vietnamien',
  PKR: 'Roupie pakistanaise', BDT: 'Taka bangladais', LKR: 'Roupie srilankaise', NPR: 'Roupie népalaise',
  BND: 'Dollar brunéien', FJD: 'Dollar fidjien', XPF: 'Franc pacifique (CFP)',
  ILS: 'Shekel israélien', SAR: 'Riyal saoudien', AED: 'Dirham émirati', KWD: 'Dinar koweïtien',
  QAR: 'Riyal qatari', BHD: 'Dinar bahreïni', OMR: 'Rial omanais', JOD: 'Dinar jordanien', LBP: 'Livre libanaise',
};

const MAJORS = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD'];

const CROSSES = [
  'EURGBP', 'EURJPY', 'EURCHF', 'EURCAD', 'EURAUD', 'EURNZD',
  'GBPJPY', 'GBPCHF', 'GBPCAD', 'GBPAUD', 'GBPNZD',
  'AUDJPY', 'AUDNZD', 'AUDCAD', 'AUDCHF',
  'NZDJPY', 'NZDCAD', 'NZDCHF', 'CADJPY', 'CADCHF', 'CHFJPY',
];

const EXOTICS = [
  // USD vs Europe / Scandinavie
  'USDSEK', 'USDNOK', 'USDDKK', 'USDISK', 'USDPLN', 'USDHUF', 'USDCZK', 'USDRON', 'USDBGN', 'USDRSD',
  'USDTRY', 'USDUAH', 'USDMDL', 'USDBYN', 'USDRUB', 'USDKZT', 'USDGEL', 'USDAMD', 'USDAZN', 'USDUZS',
  // USD vs Afrique / Moyen-Orient
  'USDZAR', 'USDNGN', 'USDGHS', 'USDKES', 'USDTZS', 'USDUGX', 'USDZMW', 'USDBWP', 'USDNAD', 'USDMUR',
  'USDETB', 'USDXAF', 'USDXOF', 'USDEGP', 'USDMAD', 'USDTND', 'USDDZD',
  'USDILS', 'USDSAR', 'USDAED', 'USDKWD', 'USDQAR', 'USDBHD', 'USDOMR', 'USDJOD', 'USDLBP',
  // USD vs Amériques
  'USDMXN', 'USDBRL', 'USDARS', 'USDCLP', 'USDCOP', 'USDPEN', 'USDUYU', 'USDBOB', 'USDPYG', 'USDCRC',
  'USDGTQ', 'USDDOP', 'USDJMD', 'USDTTD', 'USDHNL', 'USDNIO',
  // USD vs Asie / Pacifique
  'USDSGD', 'USDHKD', 'USDCNH', 'USDCNY', 'USDINR', 'USDKRW', 'USDTHB', 'USDIDR', 'USDPHP', 'USDMYR',
  'USDTWD', 'USDVND', 'USDPKR', 'USDBDT', 'USDLKR', 'USDNPR', 'USDBND', 'USDFJD', 'USDXPF',
  // EUR exotiques
  'EURSEK', 'EURNOK', 'EURDKK', 'EURISK', 'EURPLN', 'EURHUF', 'EURCZK', 'EURBGN', 'EURTRY', 'EURRUB',
  'EURZAR', 'EURMXN', 'EURBRL', 'EURSGD', 'EURHKD', 'EURCNY', 'EURINR', 'EURKRW', 'EURTHB', 'EURIDR',
  'EURPHP', 'EURMYR', 'EURTWD', 'EURILS', 'EURAED', 'EURSAR', 'EURKWD', 'EURQAR',
  // GBP exotiques
  'GBPSEK', 'GBPNOK', 'GBPDKK', 'GBPPLN', 'GBPHUF', 'GBPCZK', 'GBPRON', 'GBPTRY', 'GBPRUB', 'GBPZAR',
  'GBPMXN', 'GBPBRL', 'GBPSGD', 'GBPHKD', 'GBPCNY', 'GBPINR', 'GBPKRW', 'GBPTHB', 'GBPILS', 'GBPAED',
  // CHF exotiques
  'CHFSEK', 'CHFNOK', 'CHFDKK', 'CHFPLN', 'CHFHUF', 'CHFZAR', 'CHFTRY', 'CHFSGD',
  // CAD exotiques
  'CADSEK', 'CADNOK', 'CADDKK', 'CADSGD', 'CADHKD', 'CADMXN', 'CADZAR', 'CADTRY',
  // AUD / NZD exotiques
  'AUDSGD', 'AUDHKD', 'AUDZAR', 'AUDSEK', 'AUDNOK', 'AUDMXN', 'NZDSGD', 'NZDHKD', 'NZDZAR', 'NZDSEK',
  // Croisées JPY (cotées en yen)
  'SGDJPY', 'ZARJPY', 'TRYJPY', 'MXNJPY', 'SEKJPY', 'NOKJPY', 'DKKJPY', 'HKDJPY', 'CNHJPY', 'PLNJPY',
  'HUFJPY', 'THBJPY',
  // Scandinaves & régionales
  'NOKSEK', 'DKKSEK', 'DKKNOK', 'SGDHKD', 'SGDCNH', 'SGDMYR', 'HKDCNH', 'TRYZAR', 'PLNHUF', 'CZKPLN', 'ZARMXN',
];

function fxInstrument(code, category) {
  const base = code.slice(0, 3);
  const quote = code.slice(3);
  return {
    y: `${code}=X`,
    pair: `${base}/${quote}`,
    name: `${CCY[base] || base} / ${CCY[quote] || quote}`,
    category,
  };
}

const INSTRUMENTS = [
  ...MAJORS.map((c) => fxInstrument(c, 'major')),
  ...CROSSES.map((c) => fxInstrument(c, 'cross')),
  ...EXOTICS.map((c) => fxInstrument(c, 'exotic')),
  // Métaux précieux & industriels (futures les plus proches)
  { y: 'GC=F', pair: 'XAU/USD', name: 'Or (Gold)', category: 'metal' },
  { y: 'SI=F', pair: 'XAG/USD', name: 'Argent (Silver)', category: 'metal' },
  { y: 'PL=F', pair: 'XPT/USD', name: 'Platine (Platinum)', category: 'metal' },
  { y: 'PA=F', pair: 'XPD/USD', name: 'Palladium', category: 'metal' },
  { y: 'HG=F', pair: 'COPPER', name: 'Cuivre (Copper)', category: 'metal' },
  // Indice
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
        try {
          return await fetchSparkChunk(c, 'query2.finance.yahoo.com');
        } catch (e2) {
          console.error('[Forex] query2 chunk error:', e2?.message);
          return [];
        }
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
