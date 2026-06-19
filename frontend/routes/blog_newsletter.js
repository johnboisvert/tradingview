// Blog Newsletter — auto-send email to all subscribers when a new article is published
// Reuses the lead_magnet_subscribers.json database (no separate newsletter list to maintain)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEAD_FILE = path.join(__dirname, '..', 'data', 'lead_magnet_subscribers.json');
const STATE_FILE = path.join(__dirname, '..', 'data', 'blog_newsletter_state.json');

function loadSubscribers() {
  try { if (fs.existsSync(LEAD_FILE)) return JSON.parse(fs.readFileSync(LEAD_FILE, 'utf8')); } catch {}
  return { subscribers: [] };
}
function loadState() {
  try { if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}
  return { sent: {} }; // slug → { sent_at, recipients_count }
}
function saveState(s) {
  try { fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true }); fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }
  catch (e) { console.error('[BlogNewsletter] save error:', e?.message); }
}

function newsletterHtml({ title, excerpt, coverImage, slug, tags = [] }) {
  const baseUrl = process.env.PUBLIC_URL || 'https://www.cryptoia.ca';
  const articleUrl = `${baseUrl}/blog/${slug}?utm_source=newsletter&utm_medium=email&utm_campaign=new_article`;
  const cover = coverImage || `${baseUrl}/og-image.jpg`;
  const tagsHtml = tags.slice(0, 4).map(t => `<span style="display:inline-block;padding:3px 9px;border-radius:6px;background:rgba(99,102,241,0.15);color:#a5b4fc;font-size:10px;font-weight:700;margin-right:6px;text-transform:uppercase;letter-spacing:0.5px;">${t}</span>`).join('');

  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;background:#0A0E1A;color:#e2e8f0;padding:24px;margin:0;">
<div style="max-width:600px;margin:0 auto;background:linear-gradient(140deg,#0f172a,#1e1b4b);border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">
  ${cover ? `<img src="${cover}" alt="${title}" style="width:100%;height:240px;object-fit:cover;display:block;border-radius:24px 24px 0 0;" />` : ''}

  <div style="padding:36px 32px 28px;">
    <p style="margin:0 0 10px;color:#a5b4fc;font-size:11px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;">📬 Nouvelle chronique CryptoIA</p>
    ${tagsHtml ? `<div style="margin-bottom:14px;">${tagsHtml}</div>` : ''}
    <h1 style="margin:0 0 14px;color:#fff;font-size:24px;font-weight:900;line-height:1.25;letter-spacing:-0.02em;">${title}</h1>
    <p style="margin:0 0 24px;color:#cbd5e1;font-size:15px;line-height:1.6;">${excerpt || ''}</p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${articleUrl}" style="display:inline-block;padding:14px 28px;border-radius:12px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#fff;font-weight:900;text-decoration:none;text-transform:uppercase;font-size:13px;letter-spacing:1.5px;box-shadow:0 8px 24px rgba(99,102,241,0.35);">📖 Lire l'article complet</a>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;margin-top:24px;text-align:center;">
      <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;line-height:1.6;">Vous recevez cet email car vous êtes inscrit à la liste CryptoIA.</p>
      <p style="margin:0;color:#64748b;font-size:11px;line-height:1.6;">
        <a href="${baseUrl}" style="color:#6366f1;text-decoration:none;">CryptoIA</a>
        ·
        <a href="${baseUrl}/blog" style="color:#94a3b8;text-decoration:underline;">Voir tout le blog</a>
        ·
        <a href="${baseUrl}/unsubscribe?token={{UNSUB_TOKEN}}" style="color:#94a3b8;text-decoration:underline;">Se désinscrire</a>
      </p>
    </div>
  </div>
</div></body></html>`;
}

export default function registerBlogNewsletterRoutes(app, { getResendClient }) {
  // Internal helper — called from routes/blog.js when an article is published
  async function notifySubscribers(article) {
    if (!article || !article.slug) return { ok: false, error: 'invalid_article' };

    const state = loadState();
    if (state.sent[article.slug]) {
      console.log(`[BlogNewsletter] ⏭️ Already notified for ${article.slug}`);
      return { ok: true, skipped: true };
    }

    const client = await getResendClient();
    if (!client) {
      console.warn('[BlogNewsletter] ⚠️ Resend not configured — skipping newsletter send');
      return { ok: false, error: 'resend_not_configured' };
    }

    const db = loadSubscribers();
    const recipients = db.subscribers.filter(s => s.email && !s.unsubscribed);
    if (!recipients.length) {
      console.log('[BlogNewsletter] ⏭️ No subscribers');
      state.sent[article.slug] = { sent_at: new Date().toISOString(), recipients_count: 0 };
      saveState(state);
      return { ok: true, recipients_count: 0 };
    }

    const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
    const html = newsletterHtml({
      title: article.title,
      excerpt: article.excerpt,
      coverImage: article.coverImage,
      slug: article.slug,
      tags: article.tags || [],
    });

    let sent = 0;
    let failed = 0;
    for (const sub of recipients) {
      try {
        const personalizedHtml = html.replace('{{UNSUB_TOKEN}}', sub.unsub_token || '');
        await client.emails.send({
          from: sender,
          to: [sub.email],
          subject: `📬 ${article.title}`,
          html: personalizedHtml,
        });
        sent++;
        // Light throttle to stay under Resend rate limits (10 emails/sec free tier)
        await new Promise(r => setTimeout(r, 120));
      } catch (e) {
        failed++;
        console.error(`[BlogNewsletter] Failed for ${sub.email}:`, e?.message?.slice(0, 100));
      }
    }

    state.sent[article.slug] = {
      sent_at: new Date().toISOString(),
      recipients_count: sent,
      failed_count: failed,
      title: article.title,
    };
    saveState(state);

    console.log(`[BlogNewsletter] ✅ Article "${article.title}" → ${sent} sent, ${failed} failed (${recipients.length} total subscribers)`);
    return { ok: true, sent, failed, total: recipients.length };
  }

  // POST /api/v1/admin/blog/notify-subscribers — manual trigger for a specific article
  app.post('/api/v1/admin/blog/notify-subscribers', async (req, res) => {
    const { slug, force } = req.body || {};
    if (!slug) return res.status(400).json({ ok: false, error: 'slug required' });

    // Load the article from blog.json
    try {
      const blogFile = path.join(__dirname, '..', 'data', 'blog.json');
      const blog = JSON.parse(fs.readFileSync(blogFile, 'utf8'));
      const article = (blog.articles || []).find(a => a.slug === slug);
      if (!article) return res.status(404).json({ ok: false, error: 'article_not_found' });

      // If force, clear the cached state for this slug
      if (force) {
        const state = loadState();
        delete state.sent[slug];
        saveState(state);
      }

      const result = await notifySubscribers(article);
      res.json(result);
    } catch (e) {
      res.status(500).json({ ok: false, error: e?.message });
    }
  });

  // GET /api/v1/admin/blog/newsletter-stats — admin overview
  app.get('/api/v1/admin/blog/newsletter-stats', (req, res) => {
    const state = loadState();
    const db = loadSubscribers();
    res.json({
      ok: true,
      total_subscribers: db.subscribers.length,
      active_subscribers: db.subscribers.filter(s => !s.unsubscribed).length,
      articles_notified: Object.keys(state.sent).length,
      history: Object.entries(state.sent).map(([slug, data]) => ({ slug, ...data })).reverse(),
    });
  });

  console.log('[BlogNewsletter] ✅ Routes registered (notify-subscribers, newsletter-stats)');
  return { notifySubscribers };
}
