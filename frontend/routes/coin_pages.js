// Per-coin SEO landing pages — live CoinGecko data + cached GPT-5.4 description
//
// Public:
//   GET /api/v1/coin/:symbol      → { ok, market:{...}, description:{...} }
//   GET /api/v1/coins             → top 50 by market cap (whitelist)
//
// Admin:
//   POST /api/v1/admin/coin/generate-description body:{ symbols:[...] }
//   GET  /api/v1/admin/coin/status

import path from 'path';
import { generateJSON, loadJSON, saveJSON, SEO_DATA_DIR } from './_seo_generator.js';

const DESC_FILE = path.join(SEO_DATA_DIR, 'coin_descriptions.json');
const COIN_CACHE_FILE = path.join(SEO_DATA_DIR, 'coin_market_cache.json');
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min — CoinGecko free tier ~10 req/min

// CoinGecko symbol → id mapping for the top 60 coins (extend as needed)
const COIN_MAP = {
  btc: 'bitcoin', eth: 'ethereum', sol: 'solana', bnb: 'binancecoin',
  xrp: 'ripple', ada: 'cardano', avax: 'avalanche-2', doge: 'dogecoin',
  trx: 'tron', dot: 'polkadot', link: 'chainlink', matic: 'matic-network',
  pol: 'polygon-ecosystem-token', shib: 'shiba-inu', ltc: 'litecoin',
  bch: 'bitcoin-cash', uni: 'uniswap', xlm: 'stellar', atom: 'cosmos',
  near: 'near', apt: 'aptos', sui: 'sui', op: 'optimism', arb: 'arbitrum',
  inj: 'injective-protocol', tia: 'celestia', sei: 'sei-network',
  fil: 'filecoin', etc: 'ethereum-classic', hbar: 'hedera-hashgraph',
  vet: 'vechain', algo: 'algorand', stx: 'blockstack', imx: 'immutable-x',
  mkr: 'maker', ldo: 'lido-dao', aave: 'aave', grt: 'the-graph',
  rune: 'thorchain', kas: 'kaspa', mnt: 'mantle', render: 'render-token',
  fet: 'fetch-ai', tao: 'bittensor', ondo: 'ondo-finance', ena: 'ethena',
  jup: 'jupiter-exchange-solana', wif: 'dogwifcoin', pepe: 'pepe',
  bonk: 'bonk', floki: 'floki', usdt: 'tether', usdc: 'usd-coin', dai: 'dai',
  qnt: 'quant-network', xtz: 'tezos', flow: 'flow', sand: 'the-sandbox',
  mana: 'decentraland', cro: 'crypto-com-chain',
};

// ── CoinGecko helper with in-memory cache + persistent disk fallback ──────
let _marketCache = null;
let _marketCacheAt = 0;
let _refreshInflight = null;
async function fetchMarket() {
  const now = Date.now();
  if (_marketCache && (now - _marketCacheAt) < CACHE_TTL_MS) return _marketCache;
  // Also seed from disk on cold start to survive container restarts
  if (!_marketCache) {
    const disk = loadJSON(COIN_CACHE_FILE, null);
    if (disk?.data?.length) {
      _marketCache = disk.data;
      _marketCacheAt = disk.ts ? new Date(disk.ts).getTime() : now;
      // If disk data is recent enough, just return it without hitting CoinGecko
      if ((now - _marketCacheAt) < CACHE_TTL_MS) return _marketCache;
    }
  }
  // Single-flight pattern: avoid 10 simultaneous requests hammering CoinGecko
  if (_refreshInflight) return _refreshInflight;
  _refreshInflight = (async () => {
    const ids = [...new Set(Object.values(COIN_MAP))].join(',');
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h,7d`;
    try {
      const resp = await fetch(url, { headers: { accept: 'application/json' } });
      if (!resp.ok) {
        // 429 rate-limit: keep serving stale cache rather than empty array
        console.warn(`[Coin] CoinGecko ${resp.status} — serving cached data`);
        return _marketCache || [];
      }
      const data = await resp.json();
      _marketCache = data;
      _marketCacheAt = Date.now();
      saveJSON(COIN_CACHE_FILE, { ts: new Date(_marketCacheAt).toISOString(), data });
      return data;
    } catch (e) {
      console.error('[Coin] CoinGecko fetch error:', e?.message);
      return _marketCache || [];
    } finally {
      _refreshInflight = null;
    }
  })();
  return _refreshInflight;
}

async function generateOne(symbol, coinName) {
  const systemPrompt = `Tu écris une fiche éditoriale crypto en français pour cryptoia.ca.
Style : pédagogique mais sophistiqué, sans hype excessive. Cible : investisseurs FR/QC débutants à intermédiaires.
Réponds UNIQUEMENT en JSON valide:
{
  "tagline": "Phrase d'accroche (max 120 chars) qui résume le projet",
  "what_is": "Qu'est-ce que c'est ? — 1 paragraphe markdown (~120 mots)",
  "how_it_works": "Comment ça marche ? — markdown avec bullet points (~150 mots)",
  "use_cases": ["cas d'usage 1", "cas d'usage 2", "cas d'usage 3", "cas d'usage 4"],
  "strengths": ["force 1", "force 2", "force 3"],
  "risks": ["risque 1", "risque 2", "risque 3"],
  "history": "Historique court (~80 mots) — fondateurs, dates clés",
  "faq": [
    {"q": "Est-ce un bon investissement long terme ?", "a": "..."},
    {"q": "Comment acheter ?", "a": "..."},
    {"q": "Où stocker ?", "a": "..."}
  ]
}`;
  const userPrompt = `Génère la fiche pour ${coinName} (symbole: ${symbol.toUpperCase()}). Date du jour: ${new Date().toLocaleDateString('fr-CA')}.`;
  return await generateJSON({ systemPrompt, userPrompt, maxTokens: 2800 });
}

export default function registerCoinRoutes(app, { requireAdmin } = {}) {
  const adminGuard = requireAdmin || ((_req, _res, next) => next());

  app.get('/api/v1/coins', async (_req, res) => {
    const market = await fetchMarket();
    const supported = market
      .filter(c => Object.values(COIN_MAP).includes(c.id))
      .map(c => {
        const symEntry = Object.entries(COIN_MAP).find(([, id]) => id === c.id);
        return {
          symbol: symEntry?.[0] || c.symbol,
          name: c.name,
          image: c.image,
          current_price: c.current_price,
          market_cap: c.market_cap,
          market_cap_rank: c.market_cap_rank,
          change_24h_pct: c.price_change_percentage_24h_in_currency,
          change_7d_pct: c.price_change_percentage_7d_in_currency,
        };
      })
      .sort((a, b) => (a.market_cap_rank || 9999) - (b.market_cap_rank || 9999));
    res.json({ ok: true, count: supported.length, items: supported });
  });

  app.get('/api/v1/coin/:symbol', async (req, res) => {
    const sym = String(req.params.symbol || '').toLowerCase();
    const id = COIN_MAP[sym];
    if (!id) return res.status(404).json({ ok: false, error: 'coin_not_supported', supported_symbols: Object.keys(COIN_MAP) });
    const market = await fetchMarket();
    const m = market.find(c => c.id === id);
    if (!m) return res.status(503).json({ ok: false, error: 'market_data_unavailable' });
    const descDb = loadJSON(DESC_FILE, { items: {} });
    const description = descDb.items?.[sym] || null;
    res.json({
      ok: true,
      symbol: sym,
      market: {
        id: m.id, name: m.name, image: m.image,
        current_price: m.current_price,
        market_cap: m.market_cap,
        market_cap_rank: m.market_cap_rank,
        total_volume: m.total_volume,
        circulating_supply: m.circulating_supply,
        max_supply: m.max_supply,
        ath: m.ath, ath_change_percentage: m.ath_change_percentage, ath_date: m.ath_date,
        change_24h_pct: m.price_change_percentage_24h_in_currency,
        change_7d_pct: m.price_change_percentage_7d_in_currency,
      },
      description,
    });
  });

  app.post('/api/v1/admin/coin/generate-description', adminGuard, async (req, res) => {
    if (!process.env.EMERGENT_LLM_KEY) return res.status(503).json({ ok: false, error: 'EMERGENT_LLM_KEY missing' });
    const symbols = Array.isArray(req.body?.symbols) && req.body.symbols.length > 0
      ? req.body.symbols
      : Object.keys(COIN_MAP);
    const batchSize = Math.min(parseInt(req.body?.batch_size) || 5, 5);
    const db = loadJSON(DESC_FILE, { items: {} });
    const toProcess = symbols.filter(s => COIN_MAP[s.toLowerCase()] && !db.items[s.toLowerCase()]).slice(0, batchSize);
    if (toProcess.length === 0) return res.json({ ok: true, added: 0, message: 'All requested symbols already have a description', total: Object.keys(db.items).length });
    const market = await fetchMarket();
    const added = [];
    for (const sym of toProcess) {
      const symLower = sym.toLowerCase();
      const id = COIN_MAP[symLower];
      const m = market.find(c => c.id === id);
      if (!m) { console.error('[Coin] no market data for', sym); continue; }
      try {
        const gen = await generateOne(symLower, m.name);
        db.items[symLower] = { ...gen, generatedAt: new Date().toISOString() };
        added.push(symLower);
      } catch (e) {
        console.error(`[Coin] gen failed for ${sym}:`, e?.message);
      }
    }
    saveJSON(DESC_FILE, db);
    res.json({ ok: true, added: added.length, total: Object.keys(db.items).length, items: added });
  });

  app.get('/api/v1/admin/coin/status', adminGuard, (_req, res) => {
    const db = loadJSON(DESC_FILE, { items: {} });
    const all = Object.keys(COIN_MAP);
    const generated = Object.keys(db.items || {});
    const remaining = all.filter(s => !generated.includes(s));
    res.json({
      ok: true,
      total_supported: all.length,
      descriptions_generated: generated.length,
      remaining: remaining.length,
      remaining_symbols: remaining.slice(0, 20),
      has_llm_key: !!process.env.EMERGENT_LLM_KEY,
    });
  });

  console.log('[Coin] ✅ Routes registered (/api/v1/coins, /api/v1/coin/:symbol)');
}
