// Daily Social Kit Digest — emails admin a ready-to-post kit every morning
// User can copy-paste from email → Twitter/LinkedIn in <60 sec
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_FILE = path.join(__dirname, '..', 'data', 'blog.json');
const SUPER_ADMIN_FILE = path.join(__dirname, '..', 'data', 'super_admin.json');
const STATE_FILE = path.join(__dirname, '..', 'data', 'daily_digest_state.json');

function loadJson(p, fallback) {
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
  return fallback;
}
function saveJson(p, data) {
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
  } catch (e) { console.error('[DailyDigest] save error:', e?.message); }
}

function buildDigestHtml({ article, kit, baseUrl }) {
  const isFr = (article.language || 'fr') === 'fr';
  const title = isFr ? '📅 Ton post du jour est prêt' : '📅 Your daily post is ready';
  const subtitle = isFr
    ? `Article du jour : <strong>${article.title}</strong>`
    : `Today's article: <strong>${article.title}</strong>`;
  const intro = isFr
    ? "Voici tes 2 posts prêts-à-coller pour aujourd'hui. Total temps : moins d'1 minute."
    : "Here are your 2 ready-to-paste posts for today. Total time: under 1 minute.";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e7eb;">
<div style="max-width:640px;margin:0 auto;background:#0f0f1a;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
  <div style="background:linear-gradient(135deg,#7c3aed 0%,#ec4899 50%,#f59e0b 100%);padding:24px 28px;">
    <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:99px;padding:4px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:800;color:white;margin-bottom:10px;">${isFr ? 'Digest quotidien' : 'Daily Digest'}</div>
    <h1 style="margin:0;font-size:22px;line-height:1.3;color:white;font-weight:900;">${title}</h1>
    <p style="margin:8px 0 0 0;font-size:13px;color:rgba(255,255,255,0.9);">${subtitle}</p>
  </div>
  <div style="padding:24px 28px;">
    <p style="font-size:14px;line-height:1.6;color:#d1d5db;margin:0 0 20px 0;">${intro}</p>

    <!-- Twitter -->
    <div style="background:#0a0a14;border-radius:12px;border:1px solid #1f2937;padding:18px;margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="background:#1d9bf0;color:white;font-size:10px;font-weight:900;padding:3px 8px;border-radius:99px;letter-spacing:1px;">X / TWITTER</span>
        <span style="font-size:11px;color:#6b7280;">Copie ↓ Colle sur twitter.com/compose/tweet</span>
      </div>
      <pre style="margin:0;padding:14px;background:#020207;border-radius:8px;border:1px solid #1f2937;font-size:13px;line-height:1.6;color:#e5e7eb;white-space:pre-wrap;font-family:'SF Mono',Consolas,monospace;overflow-wrap:break-word;">${kit.twitter_single}</pre>
    </div>

    <!-- LinkedIn -->
    <div style="background:#0a0a14;border-radius:12px;border:1px solid #1f2937;padding:18px;margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="background:#0a66c2;color:white;font-size:10px;font-weight:900;padding:3px 8px;border-radius:99px;letter-spacing:1px;">LINKEDIN</span>
        <span style="font-size:11px;color:#6b7280;">Copie ↓ Colle sur linkedin.com</span>
      </div>
      <pre style="margin:0;padding:14px;background:#020207;border-radius:8px;border:1px solid #1f2937;font-size:13px;line-height:1.6;color:#e5e7eb;white-space:pre-wrap;font-family:'SF Mono',Consolas,monospace;overflow-wrap:break-word;">${kit.linkedin}</pre>
    </div>

    <!-- Article link -->
    <div style="text-align:center;padding:18px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:12px;">
      <p style="margin:0 0 12px 0;font-size:14px;color:white;">📖 ${isFr ? 'Voir l\'article complet' : 'View the full article'}</p>
      <a href="${article.url}" style="display:inline-block;background:white;color:#4f46e5;padding:10px 24px;border-radius:99px;text-decoration:none;font-weight:900;font-size:13px;">${article.url.replace(/^https?:\/\//, '').slice(0, 50)}</a>
    </div>

    <p style="margin:24px 0 0 0;font-size:11px;color:#6b7280;text-align:center;line-height:1.5;">
      ${isFr ? 'Tu reçois ce digest car tu es admin CryptoIA. Tu peux désactiver ces emails dans /admin/settings.' : 'You receive this digest as a CryptoIA admin. Disable in /admin/settings.'}<br>
      <a href="${baseUrl}/admin/social-kits" style="color:#a78bfa;">${isFr ? 'Voir tous les kits dans l\'admin' : 'See all kits in admin'}</a>
    </p>
  </div>
</div></body></html>`;
}

export default function register(app, { resendClientGetter }) {
  const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
  const INTERVAL_MS = 30 * 60 * 1000; // tick every 30 min
  const STARTUP_DELAY_MS = 90 * 1000; // wait 90s after boot
  // Send between 9am and 10am UTC (= 4-5am EST / 5-6am EDT) — adjust DAILY_DIGEST_HOUR_UTC env var
  const TARGET_HOUR_UTC = Number(process.env.DAILY_DIGEST_HOUR_UTC || 14); // default 14h UTC = 9am EST winter / 10am EDT summer

  async function tick() {
    try {
      const now = new Date();
      // Only fire once per day, between TARGET_HOUR and TARGET_HOUR+1 UTC
      if (now.getUTCHours() !== TARGET_HOUR_UTC) return;
      const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const state = loadJson(STATE_FILE, { last_sent_date: null, last_article_index: -1 });
      if (state.last_sent_date === today) return; // already sent today

      const admin = loadJson(SUPER_ADMIN_FILE, null);
      if (!admin?.email) {
        console.log('[DailyDigest] No admin configured, skipping');
        return;
      }
      const blog = loadJson(BLOG_FILE, { articles: [] });
      const articles = blog.articles || [];
      if (articles.length === 0) return;

      // Rotate through articles
      const nextIndex = ((state.last_article_index ?? -1) + 1) % articles.length;
      const article = articles[nextIndex];
      const articleWithUrl = { ...article, url: `${baseUrl}/blog/${article.slug}` };

      // Build kit inline (same logic as /api/v1/blog/social-kit/:slug but local)
      const isFr = (article.language || 'fr') === 'fr';
      const tags = (article.tags || []).slice(0, 4).map(t => `#${t.replace(/[^a-zA-Z0-9]/g, '')}`).join(' ');
      const twitter_single = isFr
        ? `📊 ${article.title}\n\n${(article.excerpt || '').slice(0, 150)}\n\nL'analyse complète 👇\n${articleWithUrl.url}\n\n${tags}`
        : `📊 ${article.title}\n\n${(article.excerpt || '').slice(0, 150)}\n\nFull breakdown 👇\n${articleWithUrl.url}\n\n${tags}`;
      const linkedin = isFr
        ? `${article.title}\n\n${article.excerpt || ''}\n\nDans cet article, on couvre :\n• Les indicateurs clés à surveiller\n• Une méthodologie actionnable\n• Les pièges à éviter\n\nLa lecture complète : ${articleWithUrl.url}\n\n${tags}\n\nQuel est ton plus gros challenge actuel sur le trading crypto ?`
        : `${article.title}\n\n${article.excerpt || ''}\n\nIn this article we cover:\n• Key indicators to watch\n• An actionable methodology\n• Common pitfalls\n\nFull read: ${articleWithUrl.url}\n\n${tags}\n\nWhat's your biggest current challenge in crypto trading?`;

      const html = buildDigestHtml({ article: articleWithUrl, kit: { twitter_single, linkedin }, baseUrl });

      const resendClient = typeof resendClientGetter === 'function' ? await resendClientGetter() : null;
      if (!resendClient) {
        console.warn('[DailyDigest] Resend unavailable — skipping');
        return;
      }
      const from = process.env.RESEND_FROM_EMAIL || 'CryptoIA <noreply@cryptoia.ca>';
      const subject = isFr ? `📅 Ton post du jour — ${article.title}` : `📅 Your post of the day — ${article.title}`;
      try {
        await resendClient.emails.send({ from, to: admin.email, subject, html });
        state.last_sent_date = today;
        state.last_article_index = nextIndex;
        saveJson(STATE_FILE, state);
        console.log(`[DailyDigest] Sent digest #${nextIndex + 1}/${articles.length} (${article.slug}) to ${admin.email}`);
      } catch (e) {
        console.error('[DailyDigest] Send error:', e?.message);
      }
    } catch (e) {
      console.error('[DailyDigest] tick error:', e?.message);
    }
  }

  setTimeout(() => { tick(); setInterval(tick, INTERVAL_MS); }, STARTUP_DELAY_MS);
  console.log(`[DailyDigest] Scheduler initialized — fires daily around ${TARGET_HOUR_UTC}:00 UTC`);

  // Admin: force-send a digest now (manual trigger)
  app.post('/api/v1/admin/daily-digest/send-now', async (req, res) => {
    const admin = loadJson(SUPER_ADMIN_FILE, null);
    if (!admin?.email) return res.status(400).json({ ok: false, error: 'Admin not configured' });
    const blog = loadJson(BLOG_FILE, { articles: [] });
    if ((blog.articles || []).length === 0) return res.status(400).json({ ok: false, error: 'No articles' });
    const state = loadJson(STATE_FILE, { last_article_index: -1 });
    const nextIndex = ((state.last_article_index ?? -1) + 1) % blog.articles.length;
    const article = blog.articles[nextIndex];
    const articleWithUrl = { ...article, url: `${baseUrl}/blog/${article.slug}` };
    const isFr = (article.language || 'fr') === 'fr';
    const tags = (article.tags || []).slice(0, 4).map(t => `#${t.replace(/[^a-zA-Z0-9]/g, '')}`).join(' ');
    const twitter_single = isFr
      ? `📊 ${article.title}\n\n${(article.excerpt || '').slice(0, 150)}\n\nL'analyse complète 👇\n${articleWithUrl.url}\n\n${tags}`
      : `📊 ${article.title}\n\n${(article.excerpt || '').slice(0, 150)}\n\nFull breakdown 👇\n${articleWithUrl.url}\n\n${tags}`;
    const linkedin = isFr
      ? `${article.title}\n\n${article.excerpt || ''}\n\nLecture complète : ${articleWithUrl.url}\n\n${tags}`
      : `${article.title}\n\n${article.excerpt || ''}\n\nFull read: ${articleWithUrl.url}\n\n${tags}`;
    const html = buildDigestHtml({ article: articleWithUrl, kit: { twitter_single, linkedin }, baseUrl });
    const resendClient = typeof resendClientGetter === 'function' ? await resendClientGetter() : null;
    if (!resendClient) return res.status(503).json({ ok: false, error: 'Resend unavailable' });
    const from = process.env.RESEND_FROM_EMAIL || 'CryptoIA <noreply@cryptoia.ca>';
    const subject = isFr ? `📅 [TEST] Ton post du jour — ${article.title}` : `📅 [TEST] Your post of the day — ${article.title}`;
    try {
      await resendClient.emails.send({ from, to: admin.email, subject, html });
      res.json({ ok: true, sent_to: admin.email, article: article.slug });
    } catch (e) {
      res.status(500).json({ ok: false, error: e?.message });
    }
  });
}
