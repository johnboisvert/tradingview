// Glossaire crypto — pages SEO long-tail générées par GPT-5.4
//
// Public endpoints (SEO-friendly, no auth):
//   GET /api/v1/glossary           → { ok, count, items:[{slug,title}] }
//   GET /api/v1/glossary/:slug     → { ok, item:{slug,title,short,content,related,faq[]} }
//
// Admin (auth):
//   POST /api/v1/admin/glossary/generate  body:{ terms:[...] }
//       Generates entries for the given list of terms (max 8 at a time to stay
//       under timeout) and appends them to data/glossary.json.
//   GET  /api/v1/admin/glossary/status

import path from 'path';
import { generateJSON, loadJSON, saveJSON, slugify, SEO_DATA_DIR } from './_seo_generator.js';

const FILE = path.join(SEO_DATA_DIR, 'glossary.json');

// ── Seed catalog of essential crypto terms (~80 core terms) ────────────────
const DEFAULT_TERMS = [
  'Bitcoin', 'Ethereum', 'Blockchain', 'Smart Contract', 'DeFi', 'NFT',
  'Wallet', 'Cold Wallet', 'Hot Wallet', 'Seed Phrase', 'Private Key', 'Public Key',
  'Hash', 'Mining', 'Proof of Work', 'Proof of Stake', 'Staking', 'Validator',
  'Gas Fee', 'Layer 1', 'Layer 2', 'Rollup', 'Optimistic Rollup', 'ZK Rollup',
  'Sidechain', 'Bridge', 'Wrapped Token', 'Stablecoin', 'USDT', 'USDC', 'DAI',
  'DEX', 'CEX', 'AMM', 'Liquidity Pool', 'Yield Farming', 'Impermanent Loss',
  'Slippage', 'Order Book', 'Market Order', 'Limit Order', 'Stop Loss', 'Take Profit',
  'Long', 'Short', 'Leverage', 'Liquidation', 'Funding Rate', 'Open Interest',
  'Halving', 'Bull Market', 'Bear Market', 'FOMO', 'FUD', 'HODL', 'DCA',
  'Whale', 'Pump and Dump', 'Rug Pull', 'Honeypot', 'Audit', 'KYC', 'AML',
  'ICO', 'IDO', 'IEO', 'Airdrop', 'Vesting', 'Tokenomics', 'Market Cap',
  'Circulating Supply', 'Total Supply', 'Burn', 'Mint', 'DAO', 'Governance Token',
  'Memecoin', 'Altcoin', 'Shitcoin', 'Whitepaper', 'Roadmap', 'TVL', 'APY', 'APR',
  'Halving Bitcoin', 'Lightning Network', 'Ordinals', 'BRC-20', 'Cross-Chain',
];

async function generateOne(term) {
  const systemPrompt = `Tu écris une fiche glossaire crypto en français pour un site québécois (cryptoia.ca).
Style : pédagogique, clair, des analogies parlantes. Pas de jargon non-expliqué.
Réponds UNIQUEMENT en JSON valide selon ce schéma exact:
{
  "title": "Nom du terme (ex: 'DCA (Dollar Cost Averaging)')",
  "short": "Définition en 1 phrase (max 160 caractères) — utilisée comme meta description",
  "content": "Définition complète en markdown (300-500 mots) avec H2 sections: Origine/Pourquoi, Comment ça marche, Exemple chiffré concret, Pièges à éviter",
  "related": ["terme connexe 1", "terme connexe 2", "terme connexe 3"],
  "faq": [
    {"q": "Question fréquente 1", "a": "Réponse de 1-2 phrases"},
    {"q": "Question fréquente 2", "a": "Réponse de 1-2 phrases"}
  ]
}`;
  const userPrompt = `Génère la fiche glossaire pour le terme: "${term}"`;
  return await generateJSON({ systemPrompt, userPrompt, maxTokens: 2200 });
}

// ── Routes ─────────────────────────────────────────────────────────────────
export default function registerGlossaryRoutes(app, { requireAdmin } = {}) {
  const adminGuard = requireAdmin || ((_req, _res, next) => next());

  // Public: list all entries
  app.get('/api/v1/glossary', (_req, res) => {
    const db = loadJSON(FILE, { items: [] });
    const items = (db.items || []).map(i => ({ slug: i.slug, title: i.title, short: i.short })).sort((a, b) => a.title.localeCompare(b.title, 'fr'));
    res.json({ ok: true, count: items.length, items });
  });

  // Public: single entry
  app.get('/api/v1/glossary/:slug', (req, res) => {
    const db = loadJSON(FILE, { items: [] });
    const item = (db.items || []).find(i => i.slug === req.params.slug);
    if (!item) return res.status(404).json({ ok: false, error: 'not_found' });
    res.json({ ok: true, item });
  });

  // Admin: generate one batch (max 8 per call to keep response under 60s)
  app.post('/api/v1/admin/glossary/generate', adminGuard, async (req, res) => {
    if (!process.env.EMERGENT_LLM_KEY) return res.status(503).json({ ok: false, error: 'EMERGENT_LLM_KEY missing' });
    const terms = Array.isArray(req.body?.terms) && req.body.terms.length > 0
      ? req.body.terms
      : DEFAULT_TERMS;
    const batchSize = Math.min(parseInt(req.body?.batch_size) || 8, 8);
    const db = loadJSON(FILE, { items: [] });
    const existing = new Set(db.items.map(i => i.slug));
    const toProcess = terms.filter(t => !existing.has(slugify(t))).slice(0, batchSize);
    if (toProcess.length === 0) {
      return res.json({ ok: true, added: 0, message: 'All requested terms already exist', total: db.items.length });
    }
    const added = [];
    for (const term of toProcess) {
      try {
        const gen = await generateOne(term);
        const slug = slugify(gen.title || term);
        if (existing.has(slug)) continue;
        const item = {
          slug, title: gen.title || term,
          short: gen.short || '',
          content: gen.content || '',
          related: Array.isArray(gen.related) ? gen.related.slice(0, 6) : [],
          faq: Array.isArray(gen.faq) ? gen.faq.slice(0, 6) : [],
          generatedAt: new Date().toISOString(),
        };
        db.items.push(item);
        existing.add(slug);
        added.push({ slug, title: item.title });
      } catch (e) {
        console.error(`[Glossary] gen failed for "${term}":`, e?.message);
      }
    }
    saveJSON(FILE, db);
    res.json({ ok: true, added: added.length, total: db.items.length, items: added });
  });

  // Admin: status / progress
  app.get('/api/v1/admin/glossary/status', adminGuard, (_req, res) => {
    const db = loadJSON(FILE, { items: [] });
    const existing = new Set(db.items.map(i => i.slug));
    const remaining = DEFAULT_TERMS.filter(t => !existing.has(slugify(t)));
    res.json({
      ok: true,
      total: db.items.length,
      default_pool: DEFAULT_TERMS.length,
      remaining_default: remaining.length,
      remaining_terms: remaining.slice(0, 20),
      has_llm_key: !!process.env.EMERGENT_LLM_KEY,
    });
  });

  console.log('[Glossary] ✅ Routes registered (/api/v1/glossary/* + /api/v1/admin/glossary/*)');
}
