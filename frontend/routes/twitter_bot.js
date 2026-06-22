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
// If Twitter API is configured AND succeeds → post directly
// If Twitter API fails OR not configured → fall back to email "1-click publish"
async function postTweet({ source, dryRun = false, loadBlog, getResendClient, forceEmail = false }) {
  const history = loadHistory();
  const client = getTwitterClient();

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

  // ─── PATH 1: Try Twitter API direct posting ─────────────────────────────
  let apiError = null;
  if (client && !forceEmail) {
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
        method: 'api',
      });
      saveHistory(history);
      console.log(`[Twitter] ✅ Tweet posted via API: ${tweetUrl || tweetId}`);
      return { ok: true, tweetId, tweetUrl, text: tweet, meta, method: 'api' };
    } catch (e) {
      const msg = e?.data?.detail || e?.data?.title || e?.message || String(e);
      apiError = {
        message: msg,
        code: e?.code || null,
        status: e?.data?.status || null,
        type: e?.data?.type || null,
        detail: e?.data?.detail || null,
        errors: e?.data?.errors || null,
        full: typeof e?.data === 'object' ? JSON.stringify(e.data).slice(0, 500) : null,
      };
      console.warn('[Twitter] API failed, falling back to email "1-click publish":', JSON.stringify(apiError));
      // Fall through to email path
    }
  }

  // ─── PATH 2: Send email with "1-click publish" intent URL (always free) ─
  if (getResendClient) {
    try {
      const ok = await sendOneClickPublishEmail({ tweet, meta, getResendClient });
      history.posts.push({
        ts: new Date().toISOString(),
        kind: meta.kind,
        slug: meta.slug || null,
        topic: meta.topic || null,
        variation: meta.variation || null,
        text: tweet,
        tweetId: null,
        tweetUrl: null,
        method: 'email_intent',
        email_sent: ok,
      });
      saveHistory(history);
      console.log(`[Twitter] 📧 Email "1-click publish" envoyé (mode gratuit)`);
      return { ok: true, method: 'email_intent', text: tweet, meta, email_sent: ok, api_error: apiError };
    } catch (e) {
      console.error('[Twitter] email fallback error:', e?.message);
      return { ok: false, reason: 'email_failed', error: e?.message, text: tweet };
    }
  }

  return { ok: false, reason: 'no_method_available', text: tweet };
}

// ─── Email "1-click publish" — sends tweet preview + Twitter Web Intent URL ──
async function sendOneClickPublishEmail({ tweet, meta, getResendClient }) {
  try {
    const client = await getResendClient();
    if (!client) return false;
    const recipient = process.env.ADMIN_EMAIL || process.env.ALERT_EMAIL || null;
    if (!recipient) {
      console.warn('[Twitter] sendOneClickPublishEmail: no ADMIN_EMAIL / ALERT_EMAIL set');
      return false;
    }
    const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
    const sourceLabel = meta.kind === 'blog' ? `Article blog : ${meta.title || meta.slug}` : `Kit marketing : ${meta.topic || ''}`;
    const escaped = tweet.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#030712;color:#e2e8f0;padding:32px;margin:0;">
<div style="max-width:560px;margin:0 auto;background:linear-gradient(140deg,#0f172a,#1e1b4b);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:32px;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#06b6d4,#3b82f6);line-height:64px;font-size:32px;">🐦</div>
    <h1 style="margin:12px 0 0;color:#fff;font-size:22px;">Ton tweet du jour est prêt</h1>
    <p style="color:#94a3b8;margin-top:8px;font-size:13px;">${sourceLabel}</p>
  </div>
  <div style="padding:20px;border-radius:12px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.25);margin-bottom:24px;">
    <p style="color:#cbd5e1;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;font-weight:700;">Aperçu</p>
    <p style="color:#fff;font-size:15px;line-height:1.5;margin:0;">${escaped}</p>
  </div>
  <div style="text-align:center;margin:24px 0;">
    <a href="${intentUrl}" style="display:inline-block;padding:16px 40px;border-radius:12px;background:linear-gradient(135deg,#06b6d4,#3b82f6);color:#fff;font-weight:900;text-decoration:none;text-transform:uppercase;font-size:13px;letter-spacing:1.5px;">📤 Publier sur X en 1 clic</a>
  </div>
  <p style="color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;margin:24px 0 0;">Le bouton ouvre X (Twitter) avec le tweet déjà rédigé.<br>Tu n'as qu'à cliquer <strong style="color:#cbd5e1;">"Post"</strong> pour publier.</p>
  <div style="margin-top:24px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
    <a href="https://www.cryptoia.ca/admin/twitter" style="color:#06b6d4;text-decoration:none;font-size:12px;">⚙️ Gérer le bot</a>
  </div>
</div>
</body></html>`;
    await client.emails.send({
      from: sender,
      to: [recipient],
      subject: `🐦 Ton tweet du jour CryptoIA — 1 clic pour publier`,
      html,
    });
    return true;
  } catch (e) {
    console.error('[Twitter] sendOneClickPublishEmail error:', e?.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── 🧲 AUTO-PIN BEST TWEET ──────────────────────────────────────────────────
// Daily routine (06:00 UTC = ~1h after the post window):
//   1. Pull public_metrics for the last 14 days of API-posted tweets
//   2. Compute engagement score: likes + 2*RT + 0.5*replies + 0.1*impressions/100
//   3. Find best tweet → pin it to @CryptoIA_ca profile
//   4. Unpins the previous one automatically
// Cached current pin in data/twitter_history.json under .currentPin
// ═══════════════════════════════════════════════════════════════════════════
const ENGAGEMENT_WINDOW_DAYS = 14;
const PIN_REFRESH_HOUR_UTC = 14; // 06:00 EST = 11:00 UTC; we use 14:00 UTC = 09:00 EST (just before post window)

function computeEngagementScore(metrics) {
  if (!metrics) return 0;
  const likes = Number(metrics.like_count || 0);
  const rts = Number(metrics.retweet_count || 0);
  const replies = Number(metrics.reply_count || 0);
  const impressions = Number(metrics.impression_count || 0);
  return likes + 2 * rts + 0.5 * replies + 0.01 * impressions;
}

async function fetchTweetsMetrics(tweetIds) {
  const client = getTwitterClient();
  if (!client || tweetIds.length === 0) return {};
  const out = {};
  // Twitter v2 supports up to 100 IDs per call
  const chunks = [];
  for (let i = 0; i < tweetIds.length; i += 100) chunks.push(tweetIds.slice(i, i + 100));
  for (const chunk of chunks) {
    try {
      const res = await client.v2.tweets(chunk, { 'tweet.fields': ['public_metrics', 'created_at'] });
      for (const t of res?.data || []) {
        out[t.id] = { metrics: t.public_metrics, created_at: t.created_at };
      }
    } catch (e) {
      console.error('[Twitter] fetchTweetsMetrics chunk error:', e?.data?.detail || e?.message);
    }
  }
  return out;
}

async function getAuthenticatedUserId() {
  const client = getTwitterClient();
  if (!client) return null;
  try {
    const me = await client.v2.me();
    return me?.data?.id || null;
  } catch (e) {
    console.error('[Twitter] getAuthenticatedUserId error:', e?.data?.detail || e?.message);
    return null;
  }
}

async function pinTweet(tweetId) {
  const client = getTwitterClient();
  if (!client || !tweetId) return { ok: false, reason: 'no_client_or_id' };
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, reason: 'no_user_id' };
  try {
    // POST /2/users/:id/pinned_tweets is the v2 endpoint
    // twitter-api-v2 exposes it as: await client.v2.post('users/:id/pinned_tweets', { tweet_id })
    await client.v2.post(`users/${userId}/pinned_tweets`, { tweet_id: tweetId });
    return { ok: true, userId, tweetId };
  } catch (e) {
    const detail = e?.data?.detail || e?.message || String(e);
    console.error('[Twitter] pinTweet error:', detail);
    return { ok: false, reason: 'api_error', error: detail };
  }
}

async function unpinTweet(tweetId) {
  const client = getTwitterClient();
  if (!client || !tweetId) return { ok: false, reason: 'no_client_or_id' };
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, reason: 'no_user_id' };
  try {
    await client.v2.delete(`users/${userId}/pinned_tweets/${tweetId}`);
    return { ok: true };
  } catch (e) {
    console.error('[Twitter] unpinTweet error:', e?.data?.detail || e?.message);
    return { ok: false, error: e?.data?.detail || e?.message };
  }
}

// Public: find best tweet from last N days, pin it, return summary
async function refreshAutoPin() {
  const history = loadHistory();
  const cutoff = Date.now() - ENGAGEMENT_WINDOW_DAYS * 24 * 3600 * 1000;
  const candidates = (history.posts || []).filter(p => {
    if (!p.tweetId || p.method !== 'api') return false;
    const ts = Date.parse(p.ts);
    return !isNaN(ts) && ts >= cutoff;
  });
  if (candidates.length === 0) {
    return { ok: false, reason: 'no_eligible_tweets', candidates: 0 };
  }

  const metricsMap = await fetchTweetsMetrics(candidates.map(c => c.tweetId));
  const scored = candidates.map(c => {
    const m = metricsMap[c.tweetId];
    return {
      ...c,
      metrics: m?.metrics || null,
      engagement_score: computeEngagementScore(m?.metrics),
    };
  }).sort((a, b) => b.engagement_score - a.engagement_score);

  const best = scored[0];
  if (!best || best.engagement_score < 0) {
    return { ok: false, reason: 'no_score', candidates: scored.length };
  }

  // If the best is already pinned, no-op
  if (history.currentPin?.tweetId === best.tweetId) {
    return {
      ok: true,
      changed: false,
      pinned: best,
      candidates: scored.slice(0, 5),
    };
  }

  // Pin the new best
  const pinResult = await pinTweet(best.tweetId);
  if (!pinResult.ok) {
    return { ok: false, reason: 'pin_failed', error: pinResult.error, candidates: scored.slice(0, 5) };
  }

  // Update history
  history.currentPin = {
    tweetId: best.tweetId,
    tweetUrl: best.tweetUrl,
    text: best.text,
    pinnedAt: new Date().toISOString(),
    metrics: best.metrics,
    engagement_score: best.engagement_score,
  };
  saveHistory(history);
  console.log(`[Twitter] 🧲 Auto-pinned tweet ${best.tweetId} (score=${best.engagement_score.toFixed(2)})`);

  return {
    ok: true,
    changed: true,
    pinned: history.currentPin,
    candidates: scored.slice(0, 5),
  };
}

// ─── Pin scheduler (once per day at 14:00 UTC = 09:00 EST) ──────────────────
let _pinScheduler = null;
function schedulePinRefresh() {
  if (_pinScheduler) clearInterval(_pinScheduler);
  let lastRunDay = null;
  _pinScheduler = setInterval(async () => {
    try {
      if (_paused) return;
      const now = new Date();
      if (now.getUTCHours() !== PIN_REFRESH_HOUR_UTC) return;
      const today = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
      if (lastRunDay === today) return;
      lastRunDay = today;
      console.log('[Twitter] 🧲 Daily auto-pin refresh triggered');
      const result = await refreshAutoPin();
      console.log('[Twitter] Auto-pin result:', result.ok ? `changed=${result.changed} score=${result.pinned?.engagement_score}` : `FAILED: ${result.reason}`);
    } catch (e) {
      console.error('[Twitter] pinScheduler error:', e?.message);
    }
  }, 60 * 1000);
  console.log(`[Twitter] ✅ Auto-pin scheduler started — runs daily at ~${PIN_REFRESH_HOUR_UTC}:00 UTC`);
}

// ─── Scheduler: check once per minute, fire if it's the post hour today ────
function scheduleDaily({ loadBlog, getResendClient }) {
  if (_scheduler) clearInterval(_scheduler);
  let lastPostDay = null;
  _scheduler = setInterval(async () => {
    try {
      if (_paused) return;
      const now = new Date();
      const utcHour = now.getUTCHours();
      const localHour = (utcHour + TIMEZONE_OFFSET_HOURS + 24) % 24;
      const today = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
      if (localHour !== POST_HOUR_LOCAL) return;
      if (lastPostDay === today) return;
      lastPostDay = today;
      const source = decideSource(now);
      console.log(`[Twitter] ⏰ Daily auto-post triggered (source=${source})`);
      const result = await postTweet({ source, loadBlog, getResendClient });
      console.log(`[Twitter] Daily post result:`, result.ok ? `OK via ${result.method} -> ${result.tweetUrl || 'email sent'}` : `FAILED: ${result.reason}`);
    } catch (e) {
      console.error('[Twitter] scheduler tick error:', e?.message);
    }
  }, 60 * 1000);
  console.log(`[Twitter] ✅ Daily scheduler started — posts at ~${POST_HOUR_LOCAL}:00 America/Toronto (API → email fallback)`);
}

// ─── Routes registration ────────────────────────────────────────────────────
export default function registerTwitterBotRoutes(app, { loadBlog, requireAdmin, getResendClient }) {
  scheduleDaily({ loadBlog, getResendClient });
  schedulePinRefresh();

  const adminGuard = requireAdmin || ((_req, _res, next) => next());

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
      mode: client ? 'api' : 'email_intent',
      admin_email: process.env.ADMIN_EMAIL || process.env.ALERT_EMAIL || null,
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

  app.get('/api/v1/admin/twitter/history', adminGuard, (_req, res) => {
    const history = loadHistory();
    res.json({ ok: true, posts: history.posts.slice().reverse() });
  });

  app.post('/api/v1/admin/twitter/post-now', adminGuard, async (req, res) => {
    const source = (req.query.source || req.body?.source || '').toString();
    const dryRun = req.query.dry === '1' || req.body?.dry === true;
    const forceEmail = req.query.force_email === '1' || req.body?.force_email === true;
    const resolvedSource = source === 'blog' || source === 'kit' ? source : decideSource(new Date());
    const result = await postTweet({ source: resolvedSource, dryRun, loadBlog, getResendClient, forceEmail });
    res.json(result);
  });

  app.post('/api/v1/admin/twitter/pause', adminGuard, (req, res) => {
    _paused = !_paused;
    const history = loadHistory();
    history.pausedAt = _paused ? new Date().toISOString() : null;
    saveHistory(history);
    res.json({ ok: true, paused: _paused });
  });

  // ─── 🧲 GET /api/v1/admin/twitter/pin-status — current pin + top candidates
  app.get('/api/v1/admin/twitter/pin-status', adminGuard, async (req, res) => {
    try {
      const history = loadHistory();
      // Pull fresh metrics for the last 14 days of API tweets
      const cutoff = Date.now() - ENGAGEMENT_WINDOW_DAYS * 24 * 3600 * 1000;
      const candidates = (history.posts || []).filter(p => p.tweetId && p.method === 'api' && Date.parse(p.ts) >= cutoff);
      if (candidates.length === 0) {
        return res.json({ ok: true, currentPin: history.currentPin || null, candidates: [], window_days: ENGAGEMENT_WINDOW_DAYS });
      }
      const metricsMap = await fetchTweetsMetrics(candidates.map(c => c.tweetId));
      const scored = candidates.map(c => {
        const m = metricsMap[c.tweetId];
        return {
          tweetId: c.tweetId,
          tweetUrl: c.tweetUrl,
          text: c.text,
          ts: c.ts,
          kind: c.kind,
          metrics: m?.metrics || null,
          engagement_score: computeEngagementScore(m?.metrics),
        };
      }).sort((a, b) => b.engagement_score - a.engagement_score);
      res.json({
        ok: true,
        currentPin: history.currentPin || null,
        candidates: scored.slice(0, 10),
        window_days: ENGAGEMENT_WINDOW_DAYS,
      });
    } catch (e) {
      console.error('[Twitter] pin-status error:', e?.message);
      res.status(500).json({ ok: false, error: e?.message });
    }
  });

  // ─── 🧲 POST /api/v1/admin/twitter/refresh-pin — manually trigger auto-pin
  app.post('/api/v1/admin/twitter/refresh-pin', adminGuard, async (_req, res) => {
    const result = await refreshAutoPin();
    res.json(result);
  });

  console.log(`[Twitter] ✅ Routes registered (/api/v1/admin/twitter/*)`);
}
