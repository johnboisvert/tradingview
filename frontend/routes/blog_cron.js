// Daily auto-publish blog cron — generates 1 SEO-optimized article per day
// via GPT-5.4 (Emergent Universal Key), pings IndexNow + sends newsletter,
// and lets the existing twitter_bot pick it up for the daily auto-tweet.
//
// ── Architecture ──────────────────────────────────────────────────────────
//   • Topic rotation: data/blog_cron_topics.json (evergreen FR crypto topics).
//     We keep a "used_slugs" set in data/blog_cron_history.json so we never
//     repeat a topic; when all are consumed we round-robin from oldest.
//   • Schedule: every 60 min we check — if "now" is within the publish window
//     (BLOG_AUTOPUBLISH_HOUR_UTC, default 14h UTC = 9am EST) AND no run today,
//     we publish.
//   • Killswitch: BLOG_AUTOPUBLISH_ENABLED=false disables the cron entirely.
//
// ── Endpoints (all admin-guarded) ─────────────────────────────────────────
//   GET  /api/v1/admin/blog-cron/status
//   POST /api/v1/admin/blog-cron/run-now      → forces a publish right now
//   POST /api/v1/admin/blog-cron/run-now?dry=1 → generates + returns preview
//                                                without saving
//   GET  /api/v1/admin/blog-cron/topics       → returns the full topic catalog

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { notifyIndexNow } from './indexnow.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'blog_cron_history.json');
const TOPICS_FILE = path.join(DATA_DIR, 'blog_cron_topics.json');
const BLOG_FILE = path.join(DATA_DIR, 'blog.json');

const EMERGENT_BASE = 'https://integrations.emergentagent.com/llm';
const EMERGENT_MODEL = process.env.BLOG_CRON_MODEL || 'gpt-5.4';
const COVERS_DIR = path.join(DATA_DIR, 'blog-covers');
const COVER_QUALITY = process.env.BLOG_COVER_QUALITY || 'low'; // low/medium/high (cost: ~$0.01/$0.04/$0.17)
const COVERS_ENABLED = process.env.BLOG_COVERS_ENABLED !== 'false';

// ── 60+ evergreen FR crypto topics (used as cron rotation source) ─────────
const DEFAULT_TOPICS = [
  "Comment fonctionne le halving Bitcoin et son impact sur le prix",
  "Les 10 erreurs les plus courantes en trading crypto à éviter en 2026",
  "Comprendre le DCA (Dollar Cost Averaging) en crypto : guide complet",
  "Bitcoin vs Ethereum : quelles différences pour investir en 2026",
  "Comment sécuriser ses cryptos avec un cold wallet pas à pas",
  "Les indicateurs techniques essentiels pour trader la crypto (RSI, MACD, EMA)",
  "Stablecoins : comment fonctionnent USDT, USDC et DAI",
  "Qu'est-ce qu'un airdrop crypto et comment en profiter légalement",
  "Comment lire un graphique en chandeliers japonais (bougies)",
  "Le staking crypto expliqué : générer des revenus passifs en 2026",
  "Comment fonctionne une DEX (Decentralized Exchange) comme Uniswap",
  "Les Layer 2 d'Ethereum (Arbitrum, Optimism, Base) : pourquoi c'est important",
  "Comment détecter une crypto-monnaie scam avant d'investir",
  "Trading spot vs trading futures crypto : différences et risques",
  "Bull market vs Bear market : comment trader chaque cycle",
  "Comment construire un portefeuille crypto diversifié en 2026",
  "Les meilleurs outils gratuits pour analyser les cryptos (TradingView, CoinGecko)",
  "Le Lightning Network : la solution pour des paiements Bitcoin instantanés",
  "DeFi 101 : prêts, emprunts et yield farming pour débutants",
  "Comment fonctionnent les NFT et leur utilité réelle en 2026",
  "Le mining de Bitcoin en 2026 : encore rentable pour un particulier ?",
  "Les ETF Bitcoin spot : impact sur le marché et comment y accéder",
  "Comprendre la dominance Bitcoin et son utilité pour anticiper l'altcoin season",
  "Qu'est-ce qu'un smart contract et pourquoi ça change tout",
  "Comment fonctionne la blockchain Solana et ses avantages",
  "Cardano (ADA) : analyse technique et fondamentaux",
  "Polkadot et l'interopérabilité entre blockchains",
  "Chainlink et les oracles décentralisés : pourquoi c'est crucial",
  "Avalanche (AVAX) : la blockchain des sous-réseaux personnalisés",
  "Comment fonctionne un memecoin (DOGE, SHIB, PEPE) et faut-il y investir",
  "Les pump and dump crypto : comment les reconnaître et s'en protéger",
  "Trading psychologique : comment gérer la peur et l'avidité",
  "Le concept de FOMO en crypto et comment ne pas y céder",
  "Comprendre les ordres limit, market, stop-loss et take-profit",
  "Comment fonctionne un bridge crypto inter-chaîne",
  "Wrapped tokens (WBTC, WETH) : qu'est-ce que c'est et comment les utiliser",
  "Les rollups optimistes vs ZK rollups : la différence expliquée simplement",
  "Comment fonctionne le KYC sur les exchanges crypto (Binance, Kraken)",
  "Fiscalité crypto 2026 : ce qu'il faut déclarer au Québec et en France",
  "Comment éviter d'être liquidé en trading crypto avec effet de levier",
  "Le funding rate sur les futures crypto : comment l'utiliser à son avantage",
  "Open Interest crypto : qu'est-ce que ça signifie et comment l'interpréter",
  "Les whales crypto : comment suivre leurs mouvements on-chain",
  "Glassnode et les métriques on-chain essentielles pour Bitcoin",
  "Comment utiliser CoinGlass pour analyser les liquidations",
  "Les altcoins prometteurs en 2026 : critères de sélection sérieux",
  "Comment fonctionne le rebasement (rebase) des tokens",
  "Liquidity pools : comment ça marche et risques d'impermanent loss",
  "Tokenomics : tout ce qu'il faut analyser avant d'investir dans un projet",
  "Vesting period et unlocks : pourquoi c'est crucial à surveiller",
  "Le marché OTC crypto : pour qui et comment ça fonctionne",
  "Comment fonctionne le market making en crypto",
  "Crypto arbitrage : opportunités et limites en 2026",
  "Comment utiliser ChatGPT pour analyser les cryptos (méthodes avancées)",
  "L'intelligence artificielle au service du trading crypto",
  "RWA (Real World Assets) tokenisés : la prochaine grande tendance",
  "Modular blockchain : le futur du scaling (Celestia, EigenLayer)",
  "Restaking : générer du rendement multiple sur ses ETH",
  "Comment fonctionne MEV (Maximal Extractable Value) sur Ethereum",
  "Account abstraction et son impact sur l'expérience utilisateur",
  "Les social tokens et fan tokens : un marché à part",
  "GameFi en 2026 : où en est le play-to-earn",
  "Le métavers crypto : Decentraland, Sandbox et la réalité du marché",
  "Comment fonctionnent les DAO et leur gouvernance",
  "Bitcoin Ordinals et BRC-20 : la nouvelle vague NFT sur Bitcoin",
  "Privacy coins (Monero, Zcash) : utilité et controverses",
  "Comment lire un whitepaper crypto efficacement",
  "Audit smart contract : pourquoi c'est non-négociable",
  "Rug pull : les 5 signes qui ne trompent pas",
  "Comment fonctionne une ICO, IDO et IEO et leurs différences",
];

function loadJSON(file, fallback) {
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* */ }
  return fallback;
}
function saveJSON(file, data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) { console.error('[BlogCron] save error:', e?.message); }
}

// ── Topic rotation: pick next topic, prioritizing unused ones ────────────
function getNextTopic() {
  const topics = loadJSON(TOPICS_FILE, { topics: DEFAULT_TOPICS }).topics || DEFAULT_TOPICS;
  const hist = loadJSON(HISTORY_FILE, { runs: [], used_topics: [] });
  const usedSet = new Set(hist.used_topics || []);
  const unused = topics.filter(t => !usedSet.has(t));
  // Pick from unused first; once exhausted, recycle from start
  if (unused.length > 0) return unused[Math.floor(Math.random() * unused.length)];
  return topics[Math.floor(Math.random() * topics.length)];
}

function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

// ── Article generation via Emergent LLM Key (OpenAI-compatible proxy) ────
async function generateArticle(topic) {
  const key = process.env.EMERGENT_LLM_KEY;
  if (!key) throw new Error('EMERGENT_LLM_KEY missing');
  const systemPrompt = `Tu es un rédacteur SEO expert en cryptomonnaies pour un site québécois (www.cryptoia.ca).
Tu écris des articles longs, fouillés et engageants pour des lecteurs francophones débutants à intermédiaires.
Ton style : pédagogique, concret, avec des exemples chiffrés et des analogies parlantes.
Tu utilises des sous-titres H2/H3 markdown, des listes à puces, et des paragraphes de 2-4 lignes max.
IMPORTANT: Tu réponds UNIQUEMENT en JSON valide suivant ce schéma exact:
{
  "title": "Titre H1 accrocheur (max 70 caractères, optimisé SEO)",
  "excerpt": "Résumé de l'article en 1-2 phrases (max 200 caractères)",
  "content": "Contenu markdown complet de l'article (1500-2200 mots, avec H2/H3, listes, paragraphes courts)",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}
Aucun autre texte avant ou après le JSON. Pas de \`\`\`json fences.`;

  const userPrompt = `Sujet du jour : "${topic}"

Génère un article complet en JSON. Le contenu doit:
- Commencer par une intro hook qui pose une question ou un fait surprenant
- Contenir au moins 4 sections H2 et 6-8 H3
- Inclure des exemples chiffrés concrets (ex: "si tu investis 100$ par mois...")
- Inclure une section "À retenir" ou "Points clés" en liste à puces
- Conclure par un CTA naturel vers nos abonnements CryptoIA (sans être insistant)
- Faire entre 1500 et 2200 mots

Date du jour : ${new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}.`;

  const resp = await fetch(`${EMERGENT_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: EMERGENT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_completion_tokens: 6000,
      response_format: { type: 'json_object' },
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Emergent LLM ${resp.status}: ${errText.slice(0, 300)}`);
  }
  const data = await resp.json();
  const raw = data?.choices?.[0]?.message?.content || '';
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch (e) {
    // Fallback: try to extract JSON object even if model wrapped it
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('LLM returned non-JSON: ' + raw.slice(0, 300));
    parsed = JSON.parse(match[0]);
  }
  if (!parsed.title || !parsed.content) throw new Error('LLM response missing title or content');
  return {
    title: String(parsed.title).slice(0, 120),
    excerpt: String(parsed.excerpt || '').slice(0, 240),
    content: String(parsed.content),
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : ['crypto', 'analyse'],
    usage: data?.usage || null,
  };
}

// ── Image generation (gpt-image-1 via Emergent proxy) ───────────────────
// Generates a 1024x1024 PNG cover from the article title + topic and saves
// it to data/blog-covers/{slug}.png (served at /blog-covers/{slug}.png).
async function generateCover(slug, title, topic) {
  if (!COVERS_ENABLED) return null;
  const key = process.env.EMERGENT_LLM_KEY;
  if (!key) return null;
  try {
    if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });
    const prompt = `Magazine-style cover illustration for an article titled "${title}".
Topic: ${topic}. Style: modern crypto/fintech editorial, clean composition,
dark background with cyan + violet accents, subtle abstract geometric shapes,
no text, no watermarks, no logos, no human faces. Wide cinematic framing.`;
    const resp = await fetch(`${EMERGENT_BASE}/images/generations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: COVER_QUALITY,
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      console.error('[BlogCron] cover gen HTTP error:', resp.status, txt.slice(0, 200));
      return null;
    }
    const data = await resp.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      // Fallback: if proxy returns url instead of b64
      const url = data?.data?.[0]?.url;
      if (!url) { console.error('[BlogCron] cover: no b64_json/url in response'); return null; }
      const img = await fetch(url);
      const buf = Buffer.from(await img.arrayBuffer());
      const outPath = path.join(COVERS_DIR, `${slug}.png`);
      fs.writeFileSync(outPath, buf);
      return `/blog-covers/${slug}.png`;
    }
    const outPath = path.join(COVERS_DIR, `${slug}.png`);
    fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
    console.log(`[BlogCron] 🎨 Cover saved: /blog-covers/${slug}.png`);
    return `/blog-covers/${slug}.png`;
  } catch (e) {
    console.error('[BlogCron] cover gen error:', e?.message);
    return null;
  }
}

// ── Publish article (writes to blog.json + IndexNow ping + newsletter) ───
// ── Publish article (legacy helper, kept for potential reuse) ───────────
// NOTE: runPublishCycle now inlines publishing to share the slug between
// the cover image and blog.json. This helper is intentionally kept available
// for manual scripts but not called from the cron path.
function publishArticle({ title, excerpt, content, tags }, { getNewsletterNotifier, coverImage = null } = {}) {
  const slug = slugify(title) + '-' + Date.now().toString(36);
  const db = loadJSON(BLOG_FILE, { articles: [] });
  const article = {
    slug, title, excerpt, content,
    tags: tags || ['crypto'],
    coverImage,
    language: 'fr',
    publishedAt: new Date().toISOString(),
    views: 0,
    autoGenerated: true,
  };
  db.articles.push(article);
  saveJSON(BLOG_FILE, db);
  // IndexNow ping (non-blocking)
  const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
  notifyIndexNow([
    `${baseUrl}/blog/${slug}`,
    `${baseUrl}/blog/${slug}/amp`,
    `${baseUrl}/blog`,
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap-amp.xml`,
  ]).catch((e) => console.error('[BlogCron] IndexNow ping error:', e?.message));
  // Newsletter notify (non-blocking)
  const notify = getNewsletterNotifier?.();
  if (notify) notify(article).catch(e => console.error('[BlogCron] newsletter err:', e?.message));
  return article;
}

// ── Helpers ──────────────────────────────────────────────────────────────
function todayKey() { return new Date().toISOString().slice(0, 10); }

function hasRunToday() {
  const hist = loadJSON(HISTORY_FILE, { runs: [] });
  const today = todayKey();
  return (hist.runs || []).some(r => r.date === today && r.ok);
}

function recordRun(entry) {
  const hist = loadJSON(HISTORY_FILE, { runs: [], used_topics: [] });
  hist.runs = hist.runs || [];
  hist.used_topics = hist.used_topics || [];
  hist.runs.push(entry);
  if (hist.runs.length > 365) hist.runs.splice(0, hist.runs.length - 365);
  if (entry.ok && entry.topic && !hist.used_topics.includes(entry.topic)) {
    hist.used_topics.push(entry.topic);
  }
  saveJSON(HISTORY_FILE, hist);
}

// ── Main publish run (used by both cron + admin manual trigger) ──────────
async function runPublishCycle({ getNewsletterNotifier, dryRun = false, forcedTopic = null } = {}) {
  const topic = forcedTopic || getNextTopic();
  const startTs = new Date().toISOString();
  try {
    console.log(`[BlogCron] 🤖 Generating article for topic: "${topic}"`);
    const gen = await generateArticle(topic);
    if (dryRun) {
      return { ok: true, dryRun: true, topic, preview: { title: gen.title, excerpt: gen.excerpt, content_chars: gen.content.length, tags: gen.tags }, usage: gen.usage };
    }
    // Reserve a slug so we can generate the cover before saving the article
    const slug = slugify(gen.title) + '-' + Date.now().toString(36);
    const coverImage = await generateCover(slug, gen.title, topic);
    // Re-use the reserved slug by inlining a publish (avoid double-slug race)
    const db = loadJSON(BLOG_FILE, { articles: [] });
    const article = {
      slug, title: gen.title, excerpt: gen.excerpt, content: gen.content,
      tags: gen.tags || ['crypto'], coverImage, language: 'fr',
      publishedAt: new Date().toISOString(), views: 0, autoGenerated: true,
    };
    db.articles.push(article);
    saveJSON(BLOG_FILE, db);
    const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
    notifyIndexNow([
      `${baseUrl}/blog/${slug}`, `${baseUrl}/blog/${slug}/amp`,
      `${baseUrl}/blog`, `${baseUrl}/sitemap.xml`, `${baseUrl}/sitemap-amp.xml`,
    ]).catch((e) => console.error('[BlogCron] IndexNow ping error:', e?.message));
    const notify = getNewsletterNotifier?.();
    if (notify) notify(article).catch(e => console.error('[BlogCron] newsletter err:', e?.message));
    const entry = { date: todayKey(), ts: startTs, ok: true, topic, slug, title: article.title, has_cover: !!coverImage, tokens: gen.usage?.total_tokens || null };
    recordRun(entry);
    console.log(`[BlogCron] ✅ Published "${article.title}" (${slug})${coverImage ? ' 🎨' : ''}`);
    return { ok: true, article, usage: gen.usage };
  } catch (e) {
    const entry = { date: todayKey(), ts: startTs, ok: false, topic, error: e?.message };
    recordRun(entry);
    console.error('[BlogCron] ❌ Publish failed:', e?.message);
    return { ok: false, error: e?.message, topic };
  }
}

// ── Scheduler ────────────────────────────────────────────────────────────
let cronTimer = null;
function startCron({ getNewsletterNotifier }) {
  if (cronTimer) return; // already started
  const enabled = process.env.BLOG_AUTOPUBLISH_ENABLED !== 'false';
  if (!enabled) {
    console.log('[BlogCron] ⏸️  Disabled (BLOG_AUTOPUBLISH_ENABLED=false)');
    return;
  }
  const publishHourUTC = parseInt(process.env.BLOG_AUTOPUBLISH_HOUR_UTC || '14', 10); // default 14h UTC = 9am EST / 10am EDT
  const tick = async () => {
    try {
      if (hasRunToday()) return; // ensure 1 article/day max
      const now = new Date();
      if (now.getUTCHours() !== publishHourUTC) return; // wait for the publish hour
      console.log('[BlogCron] ⏰ Publish window reached — running cycle');
      await runPublishCycle({ getNewsletterNotifier });
    } catch (e) {
      console.error('[BlogCron] tick error:', e?.message);
    }
  };
  // Check every 30 minutes — drift-safe vs exact-minute schedules
  cronTimer = setInterval(tick, 30 * 60 * 1000);
  console.log(`[BlogCron] ⏰ Scheduler started — will publish 1 article/day at ${publishHourUTC}h UTC`);
}

// ── Routes ───────────────────────────────────────────────────────────────
export default function registerBlogCronRoutes(app, { requireAdmin, getNewsletterNotifier } = {}) {
  const adminGuard = requireAdmin || ((_req, _res, next) => next());

  startCron({ getNewsletterNotifier });

  app.get('/api/v1/admin/blog-cron/status', adminGuard, (_req, res) => {
    const hist = loadJSON(HISTORY_FILE, { runs: [], used_topics: [] });
    const topics = loadJSON(TOPICS_FILE, { topics: DEFAULT_TOPICS }).topics || DEFAULT_TOPICS;
    const recent = (hist.runs || []).slice(-20).reverse();
    res.json({
      ok: true,
      enabled: process.env.BLOG_AUTOPUBLISH_ENABLED !== 'false',
      model: EMERGENT_MODEL,
      publish_hour_utc: parseInt(process.env.BLOG_AUTOPUBLISH_HOUR_UTC || '14', 10),
      has_run_today: hasRunToday(),
      topics_total: topics.length,
      topics_used: (hist.used_topics || []).length,
      runs_count: (hist.runs || []).length,
      recent_runs: recent,
      has_llm_key: !!process.env.EMERGENT_LLM_KEY,
    });
  });

  app.get('/api/v1/admin/blog-cron/topics', adminGuard, (_req, res) => {
    const topics = loadJSON(TOPICS_FILE, { topics: DEFAULT_TOPICS }).topics || DEFAULT_TOPICS;
    const hist = loadJSON(HISTORY_FILE, { used_topics: [] });
    const usedSet = new Set(hist.used_topics || []);
    res.json({
      ok: true,
      topics: topics.map(t => ({ topic: t, used: usedSet.has(t) })),
      total: topics.length,
      remaining: topics.filter(t => !usedSet.has(t)).length,
    });
  });

  app.post('/api/v1/admin/blog-cron/run-now', adminGuard, async (req, res) => {
    const dryRun = String(req.query.dry || '').toLowerCase() === '1' || String(req.query.dry || '').toLowerCase() === 'true';
    const forcedTopic = req.body?.topic || null;
    if (!process.env.EMERGENT_LLM_KEY) {
      return res.status(503).json({ ok: false, error: 'EMERGENT_LLM_KEY missing (check Railway env vars)' });
    }
    const result = await runPublishCycle({ getNewsletterNotifier, dryRun, forcedTopic });
    res.json(result);
  });

  console.log('[BlogCron] ✅ Routes registered (/api/v1/admin/blog-cron/*)');
}

// Export for cross-module reuse (e.g., manual scripts)
export { runPublishCycle, generateArticle, getNextTopic, generateCover, publishArticle };
