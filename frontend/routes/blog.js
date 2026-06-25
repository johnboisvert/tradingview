// Blog SEO — extracted from server.js (Session 15 refactor)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { notifyIndexNow } from './indexnow.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optional injection for newsletter notification (set by server.js)
let _newsletterNotifier = null;
export function setBlogNewsletterNotifier(fn) { _newsletterNotifier = fn; }

export default function register(app) {
// ═══════════════════════════════════════════════════════════════════════════════
// BLOG SEO — Auto-generated articles for organic traffic
// ═══════════════════════════════════════════════════════════════════════════════
const BLOG_FILE = path.join(__dirname, '..', 'data', 'blog.json');
const DATA_DIR = path.join(__dirname, '..', 'data');
// Try multiple seed locations (Railway volume on /app/data masks files copied via Dockerfile)
const SEED_CANDIDATES = [
  path.join(__dirname, '..', 'seeds', 'blog_seed.json'),  // production (volume-safe)
  path.join(__dirname, '..', 'data', 'blog_seed.json'),   // legacy / dev
];
function findSeedFile() {
  for (const p of SEED_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}
function loadBlog() {
  try { if (fs.existsSync(BLOG_FILE)) return JSON.parse(fs.readFileSync(BLOG_FILE, 'utf8')); } catch {}
  return { articles: [] };
}
function saveBlog(data) {
  try { fs.mkdirSync(path.dirname(BLOG_FILE), { recursive: true }); fs.writeFileSync(BLOG_FILE, JSON.stringify(data, null, 2)); } catch (e) { console.error('[Blog] save error:', e?.message); }
}

// ─── Auto-seed evergreen articles on startup (upsert: update content but keep views) ───
try {
  const SEED_FILE = findSeedFile();
  if (SEED_FILE) {
    console.log(`[Blog] Loading seed from: ${SEED_FILE}`);
    const seedData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
    const db = loadBlog();
    const existingBySlug = new Map((db.articles || []).map(a => [a.slug, a]));
    let added = 0, updated = 0, removed = 0;
    // Removal: slugs listed here are pruned from the runtime DB (for retiring duplicates/redundant content)
    const removedSlugs = new Set(seedData.removed_slugs || []);
    if (removedSlugs.size > 0) {
      const before = db.articles.length;
      db.articles = (db.articles || []).filter(a => !removedSlugs.has(a.slug));
      removed = before - db.articles.length;
    }
    for (const article of (seedData.articles || [])) {
      if (removedSlugs.has(article.slug)) continue; // safety: never re-add a removed slug
      const existing = existingBySlug.get(article.slug);
      if (!existing) {
        db.articles.push(article);
        added++;
      } else {
        // Upsert: refresh seed-managed fields, preserve runtime metrics
        const before = JSON.stringify({ t: existing.title, c: existing.content, e: existing.excerpt, cover: existing.coverImage, tags: existing.tags });
        existing.title = article.title;
        existing.excerpt = article.excerpt;
        existing.content = article.content;
        existing.tags = article.tags;
        existing.coverImage = article.coverImage;
        existing.language = article.language;
        const after = JSON.stringify({ t: existing.title, c: existing.content, e: existing.excerpt, cover: existing.coverImage, tags: existing.tags });
        if (before !== after) updated++;
      }
    }
    if (added > 0 || updated > 0 || removed > 0) {
      saveBlog(db);
      console.log(`[Blog] Auto-seed: +${added} new, ~${updated} updated, -${removed} removed (total: ${db.articles.length})`);
    } else {
      console.log(`[Blog] Seed up to date — ${db.articles.length} articles`);
    }
  } else {
    console.log('[Blog] No seed file found — skipping auto-seed');
  }
} catch (e) {
  console.warn('[Blog] Auto-seed failed:', e?.message);
}

// Slugify helper
function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

// GET /api/v1/blog/list — List articles (paginated)
app.get('/api/v1/blog/list', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = parseInt(req.query.offset, 10) || 0;
  const db = loadBlog();
  const sorted = [...db.articles].sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  res.json({ ok: true, total: sorted.length, articles: sorted.slice(offset, offset + limit) });
});

// GET /api/v1/blog/article/:slug — Single article
app.get('/api/v1/blog/article/:slug', (req, res) => {
  const db = loadBlog();
  const article = db.articles.find(a => a.slug === req.params.slug);
  if (!article) return res.status(404).json({ ok: false, error: 'not found' });
  // Increment views
  article.views = (article.views || 0) + 1;
  saveBlog(db);
  res.json({ ok: true, article });
});

// POST /api/v1/blog/publish — Manual publish (or called by cron with auth)
app.post('/api/v1/blog/publish', (req, res) => {
  const { adminToken, title, content, excerpt, tags, coverImage, language } = req.body || {};
  if (process.env.BLOG_ADMIN_TOKEN && adminToken !== process.env.BLOG_ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  if (!title || !content) return res.status(400).json({ ok: false, error: 'title and content required' });
  const slug = slugify(title) + '-' + Date.now().toString(36);
  const db = loadBlog();
  const article = {
    slug,
    title,
    excerpt: excerpt || content.slice(0, 200) + '...',
    content,
    tags: tags || ['crypto'],
    coverImage: coverImage || null,
    language: language || 'fr',
    publishedAt: new Date().toISOString(),
    views: 0,
  };
  db.articles.push(article);
  saveBlog(db);
  // Auto-notify Bing/Yandex via IndexNow (non-blocking)
  const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
  notifyIndexNow([
    `${baseUrl}/blog/${slug}`,
    `${baseUrl}/blog/${slug}/amp`,
    `${baseUrl}/blog`,
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap-amp.xml`,
  ]).catch(() => {});
  // Auto-send newsletter to all subscribers (non-blocking)
  if (_newsletterNotifier) {
    _newsletterNotifier(article).catch(e => console.error('[Blog] newsletter notify error:', e?.message));
  }
  res.json({ ok: true, article });
});

// GET /sitemap.xml — Auto-generated comprehensive sitemap (static pages + blog articles + hreflang FR/EN)
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
  const db = loadBlog();
  const today = new Date().toISOString().slice(0, 10);

  // Static pages with SEO metadata (priority + change frequency tuned for crypto/trading content)
  const staticPages = [
    { path: '/',                  priority: '1.0', changefreq: 'daily' },
    { path: '/crypto-ia',         priority: '0.9', changefreq: 'daily' },
    { path: '/screener-technique', priority: '0.9', changefreq: 'daily' },
    { path: '/ai-signals',        priority: '0.9', changefreq: 'daily' },
    { path: '/heatmap',           priority: '0.8', changefreq: 'daily' },
    { path: '/fear-greed',        priority: '0.8', changefreq: 'daily' },
    { path: '/dominance',         priority: '0.8', changefreq: 'daily' },
    { path: '/altcoin-season',    priority: '0.8', changefreq: 'daily' },
    { path: '/bullrun-phase',     priority: '0.8', changefreq: 'daily' },
    { path: '/whale-watcher',     priority: '0.8', changefreq: 'daily' },
    { path: '/on-chain-metrics',  priority: '0.8', changefreq: 'daily' },
    { path: '/ai-sentiment',      priority: '0.8', changefreq: 'daily' },
    { path: '/gem-hunter',        priority: '0.8', changefreq: 'daily' },
    { path: '/alertes-ia',        priority: '0.7', changefreq: 'daily' },
    { path: '/portfolio-tracker', priority: '0.7', changefreq: 'daily' },
    { path: '/ai-assistant',      priority: '0.7', changefreq: 'weekly' },
    { path: '/convertisseur',     priority: '0.7', changefreq: 'weekly' },
    { path: '/calculatrice',      priority: '0.7', changefreq: 'weekly' },
    { path: '/comparateur-frais-exchanges', priority: '0.8', changefreq: 'weekly' },
    { path: '/calendrier',        priority: '0.7', changefreq: 'weekly' },
    { path: '/trading-academy',   priority: '0.7', changefreq: 'weekly' },
    { path: '/blog',              priority: '0.8', changefreq: 'daily' },
    { path: '/lexique',           priority: '0.8', changefreq: 'weekly' },
    { path: '/compare',           priority: '0.8', changefreq: 'weekly' },
    { path: '/crypto',            priority: '0.9', changefreq: 'daily' },
    { path: '/leaderboard',       priority: '0.7', changefreq: 'daily' },
    { path: '/affiliation',       priority: '0.7', changefreq: 'monthly' },
    { path: '/abonnements',       priority: '0.6', changefreq: 'monthly' },
    { path: '/contact',           priority: '0.5', changefreq: 'monthly' },
  ];

  const staticUrls = staticPages.map(p => `  <url>
    <loc>${baseUrl}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');

  const articleUrls = db.articles.map(a => `  <url>
    <loc>${baseUrl}/blog/${a.slug}</loc>
    <lastmod>${(a.publishedAt || new Date().toISOString()).slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

  // ── New dynamic SEO pages (glossary entries, comparisons, per-coin pages) ──
  // Each loaded lazily so a missing file doesn't break the sitemap render.
  const loadSafe = (file) => {
    try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')); } catch { return null; }
  };
  const glossary = loadSafe('glossary.json');
  const compare = loadSafe('comparisons.json');
  const coinDesc = loadSafe('coin_descriptions.json');

  const glossaryUrls = (glossary?.items || []).map(i => `  <url>
    <loc>${baseUrl}/lexique/${i.slug}</loc>
    <lastmod>${(i.generatedAt || today).slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');

  const compareUrls = (compare?.items || []).map(i => `  <url>
    <loc>${baseUrl}/compare/${i.slug}</loc>
    <lastmod>${(i.generatedAt || today).slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

  // Per-coin pages: only include symbols that have a generated description
  // (live-only pages without editorial content add no SEO value)
  const coinUrls = Object.keys(coinDesc?.items || {}).map(sym => `  <url>
    <loc>${baseUrl}/crypto/${sym}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${articleUrls}
${glossaryUrls}
${compareUrls}
${coinUrls}
</urlset>`);
});

// GET /sitemap-amp.xml — AMP-only sitemap (mobile SEO boost — submitted to Google Search Console)
app.get('/sitemap-amp.xml', (req, res) => {
  const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
  const db = loadBlog();
  const ampUrls = (db.articles || []).map(a => {
    const lastmod = (a.updatedAt || a.publishedAt || new Date().toISOString()).split('T')[0];
    return `  <url><loc>${baseUrl}/blog/${a.slug}/amp</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
  }).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ampUrls}
</urlset>`);
});

// GET /rss.xml — RSS 2.0 feed (auto-discovery by aggregators: Feedly, Crypto Panic, etc.)
app.get('/rss.xml', (req, res) => {
  const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
  const db = loadBlog();
  const escape = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const items = (db.articles || [])
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, 30)
    .map(a => `    <item>
      <title>${escape(a.title)}</title>
      <link>${baseUrl}/blog/${a.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${a.slug}</guid>
      <description>${escape(a.excerpt || '')}</description>
      <pubDate>${new Date(a.publishedAt || Date.now()).toUTCString()}</pubDate>
      ${(a.tags || []).map(t => `<category>${escape(t)}</category>`).join('')}
    </item>`).join('\n');
  res.type('application/rss+xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CryptoIA — Analyse Crypto par IA</title>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Signaux IA, analyses on-chain, dashboards crypto en français-canadien. Mises à jour quotidiennes.</description>
    <language>fr-CA</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`);
});

// ─── GET /api/v1/blog/social-kit/:slug — ready-to-post copy for X/LinkedIn/Reddit ───
// Returns text snippets the admin can paste directly (no API integration needed)
app.get('/api/v1/blog/social-kit/:slug', (req, res) => {
  const db = loadBlog();
  const article = db.articles.find(a => a.slug === req.params.slug);
  if (!article) return res.status(404).json({ ok: false, error: 'Article not found' });
  const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
  const url = `${baseUrl}/blog/${article.slug}`;
  const isFr = (article.language || 'fr') === 'fr';

  // Twitter/X thread (8 tweets)
  const tags = (article.tags || []).slice(0, 4).map(t => `#${t.replace(/[^a-zA-Z0-9]/g, '')}`).join(' ');
  const twitter_thread = [
    `🧵 ${article.title}\n\n${(article.excerpt || '').slice(0, 200)}\n\n👇`,
    `1/ ${(article.excerpt || '').slice(0, 260)}`,
    isFr ? `2/ Pour aller plus loin sur ce sujet, voici l'analyse complète :` : `2/ Want the deep dive? Here's the full analysis:`,
    `3/ ${article.tags?.[0] ? `Focus #${article.tags[0]}` : ''} — ${isFr ? 'lecture 5-10 min, actionnable immédiatement.' : '5-10 min read, immediately actionable.'}`,
    isFr ? `4/ Notre IA scanne 200+ paires crypto 24/7 pour détecter les setups que les humains ratent.` : `4/ Our AI scans 200+ crypto pairs 24/7 to catch setups humans miss.`,
    isFr ? `5/ Si tu débutes, on a aussi un guide PDF gratuit "Top 10 indicateurs crypto" — lien dans l'article.` : `5/ If you're starting out, we also offer a free PDF guide "Top 10 crypto indicators" — link in the article.`,
    isFr ? `6/ Article complet ici 👇\n${url}` : `6/ Full article here 👇\n${url}`,
    `7/ ${tags || '#crypto #trading #bitcoin'}`,
  ];

  // Single tweet (most popular format)
  const twitter_single = isFr
    ? `📊 ${article.title}\n\n${(article.excerpt || '').slice(0, 150)}\n\nL'analyse complète 👇\n${url}\n\n${tags}`
    : `📊 ${article.title}\n\n${(article.excerpt || '').slice(0, 150)}\n\nFull breakdown 👇\n${url}\n\n${tags}`;

  // LinkedIn post (longer, professional)
  const linkedin = isFr
    ? `${article.title}\n\n${article.excerpt || ''}\n\nDans cet article, on couvre :\n• Les indicateurs clés à surveiller\n• Une méthodologie actionnable\n• Les pièges à éviter\n\nLa lecture complète : ${url}\n\n${tags}\n\nQuel est ton plus gros challenge actuel sur le trading crypto ?`
    : `${article.title}\n\n${article.excerpt || ''}\n\nIn this article we cover:\n• Key indicators to watch\n• An actionable methodology\n• Common pitfalls\n\nFull read: ${url}\n\n${tags}\n\nWhat's your biggest current challenge in crypto trading?`;

  // Reddit post (raw, useful, no spam)
  const reddit = {
    title: article.title,
    body: isFr
      ? `${article.excerpt || ''}\n\nJ'ai écrit cet article qui couvre [résume en 1 phrase ton angle].\n\nLecture complète (sans paywall) : ${url}\n\nHappy à discuter dans les commentaires si vous avez des questions sur les indicateurs ou la méthodologie.`
      : `${article.excerpt || ''}\n\nI wrote this article covering [summarize your angle in 1 sentence].\n\nFull read (no paywall): ${url}\n\nHappy to discuss in comments if you have questions on the indicators or methodology.`,
  };

  // Plain text caption for Instagram/Threads
  const caption = isFr
    ? `📊 ${article.title}\n\n${(article.excerpt || '').slice(0, 220)}\n\nLien complet en bio ou via Google "CryptoIA ${article.slug.slice(0, 30)}"\n\n${tags}`
    : `📊 ${article.title}\n\n${(article.excerpt || '').slice(0, 220)}\n\nFull link in bio or search "CryptoIA ${article.slug.slice(0, 30)}" on Google\n\n${tags}`;

  res.json({
    ok: true,
    url,
    og_image: `${baseUrl}/og/${article.slug}.svg`,
    twitter_single,
    twitter_thread,
    linkedin,
    reddit,
    instagram_caption: caption,
  });
});

// ─── Dynamic OG image (SVG) per article — used by social platforms ───
function svgEscape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function wrapTitleForSvg(title, maxCharsPerLine = 28, maxLines = 4) {
  const words = String(title).split(/\s+/);
  const lines = [];
  let current = '';
  for (const w of words) {
    if (!current) current = w;
    else if ((current + ' ' + w).length <= maxCharsPerLine) current += ' ' + w;
    else { lines.push(current); current = w; }
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && current && lines[lines.length - 1] !== current) {
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, maxCharsPerLine - 1) + '…';
  }
  return lines;
}

app.get('/og/:slug.svg', (req, res) => {
  const db = loadBlog();
  const article = db.articles.find(a => a.slug === req.params.slug);
  const title = article ? article.title : 'CryptoIA — Analyse Crypto IA';
  const tag = (article?.tags?.[0] || 'crypto-ia').toUpperCase();
  const lines = wrapTitleForSvg(title, 28, 4);
  const lineY = 320 - (lines.length - 1) * 30; // start Y so block is vertically centered around 320
  const tspans = lines.map((line, i) => `<tspan x="80" dy="${i === 0 ? 0 : 76}">${svgEscape(line)}</tspan>`).join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a14"/>
      <stop offset="100%" stop-color="#1a0f2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="0" width="1200" height="8" fill="url(#accent)"/>
  <g transform="translate(80, 100)">
    <rect width="180" height="40" rx="20" fill="rgba(168,85,247,0.15)" stroke="rgba(168,85,247,0.4)" stroke-width="1"/>
    <text x="90" y="26" text-anchor="middle" fill="#c4b5fd" font-family="-apple-system, BlinkMacSystemFont, Inter, Arial, sans-serif" font-size="14" font-weight="800" letter-spacing="2">${svgEscape(tag)}</text>
  </g>
  <text x="80" y="${lineY}" fill="white" font-family="-apple-system, BlinkMacSystemFont, Inter, Arial, sans-serif" font-size="64" font-weight="900" letter-spacing="-1.5">${tspans}</text>
  <g transform="translate(80, 540)">
    <circle cx="20" cy="20" r="20" fill="url(#accent)"/>
    <text x="56" y="18" fill="white" font-family="-apple-system, BlinkMacSystemFont, Inter, Arial, sans-serif" font-size="22" font-weight="900">CryptoIA</text>
    <text x="56" y="40" fill="#9ca3af" font-family="-apple-system, BlinkMacSystemFont, Inter, Arial, sans-serif" font-size="14" font-weight="500">cryptoia.ca · Analyse crypto par IA</text>
  </g>
  <g transform="translate(950, 540)">
    <rect width="170" height="44" rx="22" fill="white"/>
    <text x="85" y="29" text-anchor="middle" fill="#4f46e5" font-family="-apple-system, BlinkMacSystemFont, Inter, Arial, sans-serif" font-size="14" font-weight="900">Essai 7 j gratuit →</text>
  </g>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h CDN cache
  res.send(svg);
});

// ─── SEO: server-side meta injection for /blog/:slug ───
// Crawlers (Google, Twitter, Facebook, LinkedIn) need OG/Twitter/JSON-LD tags in initial HTML
function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

app.get('/blog/:slug', (req, res, next) => {
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (!fs.existsSync(indexPath)) return next(); // dev mode — fall through to SPA fallback
  const db = loadBlog();
  const article = db.articles.find(a => a.slug === req.params.slug);
  if (!article) return next(); // article not found — let SPA show 404

  const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
  const url = `${baseUrl}/blog/${article.slug}`;
  const title = escapeHtml(article.title);
  const desc = escapeHtml(article.excerpt || String(article.content || '').slice(0, 200));
  const image = article.coverImage || `${baseUrl}/og/${article.slug}.svg`;
  const lang = article.language || 'fr';
  const publishedAt = article.publishedAt || new Date().toISOString();
  const tags = Array.isArray(article.tags) ? article.tags : ['crypto'];

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: article.title,
        description: article.excerpt || '',
        image: [image],
        author: { '@type': 'Organization', name: 'CryptoIA' },
        publisher: {
          '@type': 'Organization',
          name: 'CryptoIA',
          logo: { '@type': 'ImageObject', url: `${baseUrl}/logo.png` },
        },
        datePublished: publishedAt,
        dateModified: publishedAt,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        keywords: tags.join(', '),
        inLanguage: lang,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: lang === 'en' ? 'Home' : 'Accueil', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
          { '@type': 'ListItem', position: 3, name: article.title, item: url },
        ],
      },
    ],
  });

  const metaTags = `<title>${title} — CryptoIA</title>
<meta name="description" content="${desc}" />
<meta name="keywords" content="${escapeHtml(tags.join(', '))}" />
<link rel="canonical" href="${url}" />
<link rel="amphtml" href="${url}/amp" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="CryptoIA" />
<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'fr_CA'}" />
<meta property="article:published_time" content="${publishedAt}" />
${tags.map(t => `<meta property="article:tag" content="${escapeHtml(t)}" />`).join('\n')}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<script type="application/ld+json">${jsonLd}</script>`;

  try {
    let html = fs.readFileSync(indexPath, 'utf-8');
    // Strip existing SEO tags from index.html template (avoid duplicates that confuse crawlers)
    html = html.replace(/<title>[^<]*<\/title>/i, '');
    html = html.replace(/<meta[^>]*\s(?:name|property)\s*=\s*"(?:description|keywords|og:[^"]+|twitter:[^"]+|article:[^"]+)"[^>]*>/gi, '');
    html = html.replace(/<link[^>]*\srel\s*=\s*"canonical"[^>]*>/gi, '');
    html = html.replace(/<script[^>]*type\s*=\s*"application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace('</head>', `${metaTags}\n</head>`);
    res.setHeader('Cache-Control', 'public, max-age=600'); // 10min CDN-friendly
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    console.error('[Blog SEO] inject failed:', e?.message);
    next();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ─── Google AMP support: /blog/:slug/amp ─────────────────────────────────
// Serves an AMP-compliant HTML version of the article, optimized for mobile
// SEO ranking and Google Discover / Top Stories carousel inclusion.
// AMP spec: https://amp.dev/documentation/guides-and-tutorials/start/create/
// ═══════════════════════════════════════════════════════════════════════════
function sanitizeForAmp(html) {
  if (!html) return '';
  let out = String(html);
  // AMP forbids inline event handlers and <script> tags
  out = out.replace(/<script[\s\S]*?<\/script>/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');
  // AMP forbids inline styles → strip
  out = out.replace(/\sstyle\s*=\s*"[^"]*"/gi, '');
  out = out.replace(/\sstyle\s*=\s*'[^']*'/gi, '');
  // AMP forbids <iframe>, <object>, <embed>
  out = out.replace(/<(iframe|object|embed)[\s\S]*?<\/\1>/gi, '');
  // AMP requires width/height on images — convert <img> → <amp-img>
  out = out.replace(/<img\s+([^>]*?)\/?>/gi, (_match, attrs) => {
    const srcMatch = attrs.match(/src\s*=\s*["']([^"']+)["']/i);
    const altMatch = attrs.match(/alt\s*=\s*["']([^"']*)["']/i);
    if (!srcMatch) return '';
    const src = srcMatch[1];
    const alt = altMatch ? altMatch[1] : '';
    return `<amp-img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="800" height="450" layout="responsive"></amp-img>`;
  });
  // AMP forbids most link target=_blank without rel=noopener — add rel
  out = out.replace(/<a\s+([^>]*?)target\s*=\s*["']_blank["']([^>]*?)>/gi, (_m, b, a) => {
    const all = `${b}${a}`;
    if (/rel\s*=\s*["'][^"']*noopener/i.test(all)) return `<a ${b}target="_blank"${a}>`;
    return `<a ${b}target="_blank"${a} rel="noopener noreferrer">`;
  });
  return out;
}

app.get('/blog/:slug/amp', (req, res, next) => {
  try {
    const db = loadBlog();
    const article = db.articles.find(a => a.slug === req.params.slug);
    if (!article) return next();

    const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
    const url = `${baseUrl}/blog/${article.slug}`;
    const ampUrl = `${url}/amp`;
    const title = escapeHtml(article.title);
    const desc = escapeHtml(article.excerpt || String(article.content || '').slice(0, 200));
    const image = article.coverImage || `${baseUrl}/og/${article.slug}.svg`;
    const lang = article.language || 'fr';
    const publishedAt = article.publishedAt || new Date().toISOString();
    const ampBody = sanitizeForAmp(article.content || '');

    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.excerpt || '',
      image: [image],
      author: { '@type': 'Organization', name: 'CryptoIA' },
      publisher: {
        '@type': 'Organization',
        name: 'CryptoIA',
        logo: { '@type': 'ImageObject', url: `${baseUrl}/logo.png`, width: 200, height: 60 },
      },
      datePublished: publishedAt,
      dateModified: publishedAt,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    });

    // AMP boilerplate — required exactly as specified by the AMP project
    const html = `<!doctype html>
<html ⚡ lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${title} — CryptoIA</title>
  <link rel="canonical" href="${url}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="description" content="${desc}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:url" content="${ampUrl}">
  <meta property="og:type" content="article">
  <script type="application/ld+json">${jsonLd}</script>
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#fff;color:#111;line-height:1.6;margin:0;padding:0}
    .wrap{max-width:720px;margin:0 auto;padding:24px 16px 48px}
    header{padding:16px 0;border-bottom:1px solid #eee;margin-bottom:24px}
    header a{color:#0f172a;text-decoration:none;font-weight:800;font-size:18px}
    h1{font-size:28px;line-height:1.25;margin:8px 0 12px;color:#0f172a}
    .meta{color:#64748b;font-size:13px;margin-bottom:20px}
    .meta time{font-weight:600}
    .excerpt{font-size:16px;color:#334155;margin-bottom:24px;padding:16px;background:#f1f5f9;border-left:4px solid #10b981;border-radius:4px}
    article h2{font-size:22px;margin:32px 0 12px;color:#0f172a;font-weight:800}
    article h3{font-size:18px;margin:24px 0 8px;color:#1e293b;font-weight:700}
    article p{margin:0 0 16px;font-size:16px}
    article ul,article ol{margin:0 0 16px 24px}
    article li{margin-bottom:8px}
    article strong{color:#0f172a}
    article a{color:#0891b2;text-decoration:underline}
    .cta{margin:40px 0 0;padding:24px;background:linear-gradient(135deg,#10b981,#06b6d4);border-radius:12px;color:#fff;text-align:center}
    .cta a{display:inline-block;margin-top:12px;padding:12px 24px;background:#fff;color:#0f172a;border-radius:8px;font-weight:800;text-decoration:none}
    footer{margin-top:48px;padding-top:24px;border-top:1px solid #eee;color:#64748b;font-size:13px;text-align:center}
    footer a{color:#0891b2;text-decoration:none}
    amp-img{margin:16px 0}
  </style>
  <script async src="https://cdn.ampproject.org/v0.js"></script>
</head>
<body>
  <div class="wrap">
    <header><a href="${baseUrl}">CryptoIA</a></header>
    <h1>${title}</h1>
    <div class="meta">
      <time datetime="${publishedAt}">${new Date(publishedAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
      · CryptoIA
    </div>
    <div class="excerpt">${desc}</div>
    <article>${ampBody}</article>
    <div class="cta">
      <strong>${lang === 'en' ? 'Try CryptoIA free for 7 days' : 'Essaie CryptoIA gratuitement pendant 7 jours'}</strong>
      <br>
      <a href="${baseUrl}/abonnements">${lang === 'en' ? 'Start free trial' : 'Démarrer l&#39;essai gratuit'}</a>
    </div>
    <footer>
      <a href="${url}">${lang === 'en' ? 'View full article' : 'Voir l&#39;article complet'}</a>
      · © CryptoIA
    </footer>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1h CDN cache
    res.send(html);
  } catch (e) {
    console.error('[Blog AMP] error:', e?.message);
    next();
  }
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection (continuing):', reason?.stack || reason?.message || reason);
});

};
