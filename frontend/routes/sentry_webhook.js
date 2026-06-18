// Sentry → Telegram webhook bridge
// Receives Sentry issue alerts and forwards them as formatted Telegram messages.
// Auth: shared secret in `?token=` query OR `X-Sentry-Token` header

function formatMessage(payload) {
  // Sentry's "Send a notification via webhook" sends a rich JSON payload.
  // We try to extract the most useful fields, with fallbacks for different schemas.
  const action = payload?.action || 'triggered';
  const data = payload?.data || payload;
  const event = data?.event || data?.issue || {};
  const project = data?.project_slug || data?.project?.slug || payload?.project_slug || 'unknown';

  const title = event?.title || data?.title || payload?.message || 'Sentry Alert';
  const level = (event?.level || data?.level || 'error').toUpperCase();
  const env = event?.environment || data?.environment || 'production';
  const url = event?.url || event?.web_url || data?.url || data?.issue?.url || '';
  const culprit = event?.culprit || event?.location || data?.culprit || '';
  const platform = event?.platform || data?.platform || '';
  const eventCount = event?.count || data?.count || data?.times_seen || '1';

  const emoji = level === 'FATAL' ? '🔥' : level === 'ERROR' ? '🚨' : level === 'WARNING' ? '⚠️' : 'ℹ️';

  let msg = `${emoji} <b>Sentry ${level}</b> — <code>${escapeHtml(project)}</code>\n`;
  msg += `<b>${escapeHtml(title)}</b>\n`;
  if (culprit) msg += `📍 <code>${escapeHtml(culprit)}</code>\n`;
  msg += `🌐 env: <code>${escapeHtml(env)}</code>`;
  if (platform) msg += ` · platform: <code>${escapeHtml(platform)}</code>`;
  msg += `\n👁️ Vu ${eventCount}× · ${escapeHtml(action)}`;
  if (url) msg += `\n\n<a href="${escapeHtml(url)}">▶ Ouvrir dans Sentry</a>`;
  return msg;
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function registerSentryWebhookRoutes(app, { sendTelegram }) {
  const SECRET = process.env.SENTRY_WEBHOOK_SECRET || '';

  app.post('/api/v1/webhooks/sentry', async (req, res) => {
    // Auth check — token in query OR header (HMAC requires raw body, unsupported with global json parser)
    const headerToken = req.headers['x-sentry-token'];
    const queryToken = req.query?.token;
    const tokenOk = SECRET && (headerToken === SECRET || queryToken === SECRET);

    if (SECRET && !tokenOk) {
      console.warn('[SentryWebhook] ❌ Unauthorized request — token mismatch');
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const payload = req.body || {};
    const message = formatMessage(payload);
    try {
      if (sendTelegram) await sendTelegram(message, 'HTML');
      console.log('[SentryWebhook] ✅ Forwarded to Telegram:', message.slice(0, 80));
    } catch (e) {
      console.error('[SentryWebhook] Telegram send failed:', e?.message);
    }

    // Always 200 to Sentry to prevent retries
    res.json({ ok: true });
  });

  // Quick health check
  app.get('/api/v1/webhooks/sentry/health', (req, res) => {
    res.json({
      ok: true,
      configured: !!SECRET,
      auth_required: !!SECRET,
    });
  });

  console.log(`[SentryWebhook] ${SECRET ? '🔐 Secured' : '⚠️  UNSECURED (no SENTRY_WEBHOOK_SECRET)'} — endpoint ready at /api/v1/webhooks/sentry`);
}
