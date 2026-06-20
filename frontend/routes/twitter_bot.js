// Twitter Bot — Daily auto-post scheduler
// Posts 1 tweet/day at 10:00 America/Toronto time, alternating between:
//   - Blog articles (Mon/Wed/Fri) — generates a fresh "tweet about article" snippet
//   - Marketing kit posts (Tue/Thu/Sat/Sun) — uses pre-written variations from CryptoIA-Kit-Marketing.docx
//
// All posted tweets are tracked in data/twitter_history.json to prevent reposts.
// If TWITTER_API_KEY env vars are missing, the scheduler logs warnings but does not crash the server.
//
// Manual admin endpoints:
//   POST /api/v1/admin/twitter/post-now?source=blog|kit  → trigger a post immediately
//   GET  /api/v1/admin/twitter/status                    → next post, history, queue size
//   GET  /api/v1/admin/twitter/history                   → list of posted tweets
//   POST /api/v1/admin/twitter/pause                     → toggle scheduler on/off

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TwitterApi } from 'twitter-api-v2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'twitter_history.json');
const MARKETING_SEED_CANDIDATES = [
  path.join(__dirname, '..', 'seeds', 'twitter_marketing_seed.json'),  // production (volume-safe)
  path.join(DATA_DIR, 'twitter_marketing_seed.json'),                  // legacy / dev
];
function resolveMarketingSeed() {
  for (const p of MARKETING_SEED_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const TWEET_MAX_LEN = 280;
const POST_HOUR_LOCAL = 10; // 10 AM Toronto time
const TIMEZONE_OFFSET_HOURS = -5; // EST (use -4 in summer if DST)

let _scheduler = null;
let _paused = false;

// ─── History ────────────────────────────────────────────────────────────────
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
      return Array.isArray(raw) ? { posts: raw } : raw;
    }
  } catch (e) { console.error('[Twitter] loadHistory error:', e?.message); }
  return { posts: [], pausedAt: null };
}
function saveHistory(h) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(h, null, 2), 'utf8');
  } catch (e) { console.error('[Twitter] saveHistory error:', e?.message); }
}
function loadMarketingPosts() {
  try {
    const seedPath = resolveMarketingSeed();
    if (!seedPath) return [];
    const data = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    return Array.isArray(data.posts) ? data.posts : [];
  } catch (e) { console.error('[Twitter] loadMarketingPosts error:', e?.message); }
  return [];
}

// ─── Client ─────────────────────────────────────────────────────────────────
function getTwitterClient() {
  const key = process.env.TWITTER_API_KEY;
  const secret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;
  if (!key || !secret || !accessToken || !accessSecret) return null;
  return new TwitterApi({ appKey: key, appSecret: secret, accessToken, accessSecret });
}

// ─── Tweet templates for blog articles ──────────────────────────────────────
const BLOG_INTROS_FR = [
  '📊 Nouveau guide :',
  '🚀 À lire absolument :',
  '💡 Tu veux comprendre',
  '🔥 Article du jour :',
  '🇨🇦 Pour les traders FR :',
  '⚡ Décryptage :',
  '🎯 Notre analyse :',
  '📈 Stratégie 2026 :',
];
const BLOG_OUTROS_FR = [
  '👉',
  '🔗',
  '➡️',
  '📖 Lire :',
];
const BLOG_HASHTAGS_POOL = [
  ['#Bitcoin', '#Crypto'],
  ['#BTC', '#Trading'],
  ['#Ethereum', '#Crypto'],
  ['#CryptoFR', '#Bitcoin'],
  ['#Crypto', '#SignauxIA'],
  ['#Trading', '#Bitcoin'],
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function buildBlogTweet(article) {
  const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
  const url = `${baseUrl}/blog/${article.slug}`;
  const intro = pick(BLOG_INTROS_FR);
  const outro = pick(BLOG_OUTROS_FR);
  const tags = pick(BLOG_HASHTAGS_POOL).join(' ');
  const titleClean = String(article.title || '').replace(/[—–]/g, '-').trim();
  // Excerpt: take first 100 chars
  const excerpt = String(article.excerpt || '').slice(0, 100).trim();
  // Budget: 280 - url(23 t.co) - tags(~25) - spaces/newlines - intro
  // Build candidate, fallback to shorter if too long
  let tweet = `${intro} ${titleClean}\n\n${excerpt}\n\n${outro} ${url}\n\n${tags}`;
  if (tweet.length > TWEET_MAX_LEN) {
    // Shorter form
    tweet = `${intro} ${titleClean}\n\n${outro} ${url}\n\n${tags}`;
  }
  if (tweet.length > TWEET_MAX_LEN) {
    tweet = `${titleClean.slice(0, 100)}…\n\n${url}\n\n${tags}`;
  }
  return tweet.slice(0, TWEET_MAX_LEN);
}

// ─── Selection logic: pick next blog article OR next marketing kit post ─────
function pickNextBlogArticle(blogArticles, history) {
  const postedSlugs = new Set(
    history.posts.filter(p => p.kind === 'blog').map(p => p.slug)
  );
  // Prioritize never-posted articles, sorted by most recent publishedAt
  const candidates = [...blogArticles]
    .filter(a => !postedSlugs.has(a.slug))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  if (candidates.length > 0) return candidates[0];
  // All articles posted at least once — pick the oldest-posted one (round robin)
  if (blogArticles.length === 0) return null;
  const byLastPost = blogArticles.map(a => {
    const last = history.posts.filter(p => p.kind === 'blog' && p.slug === a.slug).slice(-1)[0];
    return { article: a, lastTs: last?.ts || '1970-01-01' };
  });
  byLastPost.sort((a, b) => a.lastTs.localeCompare(b.lastTs));
  return byLastPost[0]?.article || null;
}

function pickNextMarketingPost(history) {
  const posts = loadMarketingPosts();
  if (posts.length === 0) return null;
  const postedTexts = new Set(
    history.posts.filter(p => p.kind === 'kit').map(p => (p.text || '').slice(0, 80))
  );
  // Prefer never-posted
  const fresh = posts.filter(p => !postedTexts.has((p.text || '').slice(0, 80)));
  if (fresh.length > 0) return pick(fresh);
  // All posted — rotate from oldest
  return posts[Math.floor(Math.random() * posts.length)];
}

// ─── Source selection rule: alternate by day-of-week ────────────────────────
// Mon (1), Wed (3), Fri (5) -> blog
// Tue (2), Thu (4), Sat (6), Sun (0) -> marketing kit
function decideSource(date) {
  const dow = date.getDay();
  if ([1, 3, 5].includes(dow)) return 'blog';
  return 'kit';
}

// ─── Truncate marketing kit text to TWEET_MAX_LEN ───────────────────────────
function trimKitTweet(text) {
  if (!text) return null;
  let t = String(text).trim();
  if (t.length <= TWEET_MAX_LEN) return t;
  // Try to cut at last space before limit
  const cut = t.slice(0, TWEET_MAX_LEN - 1);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > TWEET_MAX_LEN - 40) return cut.slice(0, lastSpace) + '…';
  return cut + '…';
}

// ─── Post a tweet (manual or scheduled) ─────────────────────────────────────
async function postTweet({ source, dryRun = false, loadBlog }) {
  const history = loadHistory();
  const client = getTwitterClient();
  if (!client && !dryRun) {
    return { ok: false, reason: 'twitter_keys_missing', text: null };
  }

  let tweet = null;
  let meta = {};

  if (source === 'blog' && loadBlog) {
    const db = loadBlog();
    const article = pickNextBlogArticle(db.articles || [], history);
    if (!article) return { ok: false, reason: 'no_blog_articles', text: null };
    tweet = buildBlogTweet(article);
    meta = { kind: 'blog', slug: article.slug, title: article.title };
  } else {
    const post = pickNextMarketingPost(history);
    if (!post) return { ok: false, reason: 'no_marketing_posts', text: null };
    tweet = trimKitTweet(post.text);
    meta = { kind: 'kit', topic: post.topic, variation: post.variation };
  }

  if (!tweet) return { ok: false, reason: 'no_tweet_generated', text: null };

  // DRY RUN: just return the text without posting
  if (dryRun) {
    return { ok: true, dryRun: true, text: tweet, meta };
  }

  try {
    const result = await client.v2.tweet(tweet);
    const tweetId = result?.data?.id;
    const tweetUrl = tweetId ? `https://twitter.com/i/web/status/${tweetId}` : null;
    history.posts.push({
      ts: new Date().toISOString(),
      kind: meta.kind,
      slug: meta.slug || null,
      topic: meta.topic || null,
      variation: meta.variation || null,
      text: tweet,
      tweetId,
      tweetUrl,
    });
    saveHistory(history);
    console.log(`[Twitter] ✅ Tweet posted: ${tweetUrl || tweetId}`);
    return { ok: true, tweetId, tweetUrl, text: tweet, meta };
  } catch (e) {
    const msg = e?.data?.detail || e?.data?.title || e?.message || String(e);
    console.error('[Twitter] post error:', msg);
    return { ok: false, reason: 'api_error', error: msg, text: tweet };
  }
}

// ─── Scheduler: check once per minute, fire if it's the post hour today ────
function scheduleDaily({ loadBlog }) {
  if (_scheduler) clearInterval(_scheduler);
  let lastPostDay = null;
  _scheduler = setInterval(async () => {
    try {
      if (_paused) return;
      const now = new Date();
      // Compute "Toronto local hour" by applying offset (rough; OK for daily window)
      const utcHour = now.getUTCHours();
      const localHour = (utcHour + TIMEZONE_OFFSET_HOURS + 24) % 24;
      const today = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
      if (localHour !== POST_HOUR_LOCAL) return;
      if (lastPostDay === today) return;
      lastPostDay = today;
      const source = decideSource(now);
      console.log(`[Twitter] ⏰ Daily auto-post triggered (source=${source})`);
      const result = await postTweet({ source, loadBlog });
      console.log(`[Twitter] Daily post result:`, result.ok ? `OK -> ${result.tweetUrl}` : `FAILED: ${result.reason}`);
    } catch (e) {
      console.error('[Twitter] scheduler tick error:', e?.message);
    }
  }, 60 * 1000);
  console.log(`[Twitter] ✅ Daily scheduler started — posts at ~${POST_HOUR_LOCAL}:00 America/Toronto`);
}

// ─── Routes registration ────────────────────────────────────────────────────
export default function registerTwitterBotRoutes(app, { loadBlog, requireAdmin }) {
  // Auto-start the scheduler (no-op if keys missing — twitter_api will reject)
  scheduleDaily({ loadBlog });

  const adminGuard = requireAdmin || ((_req, _res, next) => next());

  // ─── GET /api/v1/admin/twitter/status ─────────────────────────────────────
  app.get('/api/v1/admin/twitter/status', adminGuard, (req, res) => {
    const history = loadHistory();
    const client = getTwitterClient();
    const marketing = loadMarketingPosts();
    const blog = loadBlog ? loadBlog() : { articles: [] };
    const postedBlogSlugs = new Set(history.posts.filter(p => p.kind === 'blog').map(p => p.slug));
    const postedKitTexts = new Set(history.posts.filter(p => p.kind === 'kit').map(p => (p.text || '').slice(0, 80)));

    const now = new Date();
    const tomorrow = new Date(now);
    if ((now.getUTCHours() + TIMEZONE_OFFSET_HOURS + 24) % 24 >= POST_HOUR_LOCAL) {
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    }
    tomorrow.setUTCHours((POST_HOUR_LOCAL - TIMEZONE_OFFSET_HOURS + 24) % 24, 0, 0, 0);

    res.json({
      ok: true,
      configured: !!client,
      paused: _paused,
      next_post_at: tomorrow.toISOString(),
      next_post_source: decideSource(tomorrow),
      total_posted: history.posts.length,
      blog_articles_remaining: (blog.articles || []).length - postedBlogSlugs.size,
      blog_articles_total: (blog.articles || []).length,
      kit_posts_remaining: marketing.length - postedKitTexts.size,
      kit_posts_total: marketing.length,
      last_5_posts: history.posts.slice(-5).reverse(),
    });
  });

  // ─── GET /api/v1/admin/twitter/history ────────────────────────────────────
  app.get('/api/v1/admin/twitter/history', adminGuard, (_req, res) => {
    const history = loadHistory();
    res.json({ ok: true, posts: history.posts.slice().reverse() });
  });

  // ─── POST /api/v1/admin/twitter/post-now ──────────────────────────────────
  app.post('/api/v1/admin/twitter/post-now', adminGuard, async (req, res) => {
    const source = (req.query.source || req.body?.source || '').toString();
    const dryRun = req.query.dry === '1' || req.body?.dry === true;
    const resolvedSource = source === 'blog' || source === 'kit' ? source : decideSource(new Date());
    const result = await postTweet({ source: resolvedSource, dryRun, loadBlog });
    res.json(result);
  });

  // ─── POST /api/v1/admin/twitter/pause ─────────────────────────────────────
  app.post('/api/v1/admin/twitter/pause', adminGuard, (req, res) => {
    _paused = !_paused;
    const history = loadHistory();
    history.pausedAt = _paused ? new Date().toISOString() : null;
    saveHistory(history);
    res.json({ ok: true, paused: _paused });
  });

  console.log(`[Twitter] ✅ Routes registered (/api/v1/admin/twitter/*)`);
}
