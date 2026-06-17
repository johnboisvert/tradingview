// Blog SEO — extracted from server.js (Session 15 refactor)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function register(app) {
// ═══════════════════════════════════════════════════════════════════════════════
// BLOG SEO — Auto-generated articles for organic traffic
// ═══════════════════════════════════════════════════════════════════════════════
const BLOG_FILE = path.join(__dirname, '..', 'data', 'blog.json');
function loadBlog() {
  try { if (fs.existsSync(BLOG_FILE)) return JSON.parse(fs.readFileSync(BLOG_FILE, 'utf8')); } catch {}
  return { articles: [] };
}
function saveBlog(data) {
  try { fs.mkdirSync(path.dirname(BLOG_FILE), { recursive: true }); fs.writeFileSync(BLOG_FILE, JSON.stringify(data, null, 2)); } catch (e) { console.error('[Blog] save error:', e?.message); }
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
  res.json({ ok: true, article });
});

// GET /sitemap.xml — Auto-generated sitemap including blog articles (SEO boost)
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
  const db = loadBlog();
  const articles = db.articles.map(a => `  <url><loc>${baseUrl}/blog/${a.slug}</loc><lastmod>${(a.publishedAt || new Date().toISOString()).slice(0, 10)}</lastmod><priority>0.7</priority></url>`).join('\n');
  const staticPaths = [
    '/', '/abonnements', '/affiliation', '/leaderboard', '/blog',
    '/heatmap', '/dominance', '/fear-greed', '/altcoin-season',
    '/ai-signals', '/whale-watcher', '/gem-hunter', '/contact',
  ];
  const staticUrls = staticPaths.map(p => `  <url><loc>${baseUrl}${p}</loc><priority>${p === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap-0.9">
${staticUrls}
${articles}
</urlset>`);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection (continuing):', reason?.stack || reason?.message || reason);
});

};
