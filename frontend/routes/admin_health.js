// Admin Health Dashboard — real-time observability cockpit
// GET /api/v1/admin/health — parallel checks of all critical 3rd-party services
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bootstrap timestamp (used to compute uptime)
const BOOT_TIME = Date.now();

// Helper: race a promise against a timeout
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms)),
  ]);
}

async function checkStripe(getStripeInstance, STRIPE_SECRET_KEY) {
  const t0 = Date.now();
  if (!STRIPE_SECRET_KEY) return { ok: false, status: 'not_configured', latency: 0, message: 'STRIPE_SECRET_KEY missing' };
  try {
    const stripe = await getStripeInstance();
    await withTimeout(stripe.balance.retrieve(), 5000, 'Stripe');
    return { ok: true, status: 'healthy', latency: Date.now() - t0, message: 'API reachable' };
  } catch (e) {
    return { ok: false, status: 'down', latency: Date.now() - t0, message: e?.message?.slice(0, 80) || 'unknown' };
  }
}

async function checkResend(getResendClient) {
  const t0 = Date.now();
  try {
    const client = await getResendClient();
    if (!client) return { ok: false, status: 'not_configured', latency: 0, message: 'RESEND_API_KEY missing' };
    // Resend doesn't have a true health endpoint — listing domains is the cheapest authenticated call
    await withTimeout(
      fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY || ''}` },
      }).then((r) => {
        if (!r.ok && r.status !== 200) throw new Error(`HTTP ${r.status}`);
        return r;
      }),
      5000,
      'Resend'
    );
    return { ok: true, status: 'healthy', latency: Date.now() - t0, message: 'API reachable' };
  } catch (e) {
    return { ok: false, status: 'down', latency: Date.now() - t0, message: e?.message?.slice(0, 80) || 'unknown' };
  }
}

async function checkCoinGecko() {
  const t0 = Date.now();
  try {
    const res = await withTimeout(fetch('https://api.coingecko.com/api/v3/ping'), 5000, 'CoinGecko');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true, status: 'healthy', latency: Date.now() - t0, message: 'Pong received' };
  } catch (e) {
    return { ok: false, status: 'down', latency: Date.now() - t0, message: e?.message?.slice(0, 80) || 'unknown' };
  }
}

async function checkTelegram(TELEGRAM_BOT_TOKEN) {
  const t0 = Date.now();
  if (!TELEGRAM_BOT_TOKEN) return { ok: false, status: 'not_configured', latency: 0, message: 'Bot token missing' };
  try {
    const res = await withTimeout(
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`),
      5000,
      'Telegram'
    );
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || 'getMe failed');
    return {
      ok: true,
      status: 'healthy',
      latency: Date.now() - t0,
      message: `@${data.result?.username || 'bot'} online`,
    };
  } catch (e) {
    return { ok: false, status: 'down', latency: Date.now() - t0, message: e?.message?.slice(0, 80) || 'unknown' };
  }
}

function checkSentry() {
  const dsnFront = !!process.env.VITE_SENTRY_DSN;
  const dsnBack = !!process.env.SENTRY_DSN_BACKEND;
  const webhookSecret = !!process.env.SENTRY_WEBHOOK_SECRET;
  const allOk = dsnBack && webhookSecret;
  return {
    ok: allOk,
    status: allOk ? 'healthy' : dsnBack ? 'degraded' : 'not_configured',
    latency: 0,
    message: `Backend DSN: ${dsnBack ? '✓' : '✗'} · Webhook Secret: ${webhookSecret ? '✓' : '✗'} · Frontend DSN: ${dsnFront ? '✓' : '✗ (build-time only)'}`,
  };
}

function checkPushVapid() {
  try {
    const vapidFile = path.join(__dirname, '..', 'data', 'vapid_keys.json');
    const exists = fs.existsSync(vapidFile);
    if (!exists) return { ok: false, status: 'not_configured', latency: 0, message: 'No VAPID keys generated' };
    const data = JSON.parse(fs.readFileSync(vapidFile, 'utf8'));
    const hasKeys = !!(data.publicKey && data.privateKey);
    return {
      ok: hasKeys,
      status: hasKeys ? 'healthy' : 'degraded',
      latency: 0,
      message: hasKeys ? 'VAPID keys persisted' : 'Keys file corrupted',
    };
  } catch (e) {
    return { ok: false, status: 'down', latency: 0, message: e?.message?.slice(0, 80) };
  }
}

function checkIndexNow() {
  try {
    const keyFile = path.join(__dirname, '..', 'data', 'indexnow_key.txt');
    if (!fs.existsSync(keyFile)) return { ok: false, status: 'not_configured', latency: 0, message: 'No key file' };
    const key = fs.readFileSync(keyFile, 'utf8').trim();
    const stateFile = path.join(__dirname, '..', 'data', 'indexnow_cron_state.json');
    let lastSent = 'never';
    if (fs.existsSync(stateFile)) {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      lastSent = state.last_sent_date || 'never';
    }
    return {
      ok: !!key,
      status: 'healthy',
      latency: 0,
      message: `Key: ${key.slice(0, 8)}… · Last cron: ${lastSent}`,
    };
  } catch (e) {
    return { ok: false, status: 'down', latency: 0, message: e?.message?.slice(0, 80) };
  }
}

function checkSystem() {
  const uptimeMs = Date.now() - BOOT_TIME;
  const uptimeSec = Math.floor(uptimeMs / 1000);
  const mem = process.memoryUsage();
  const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
  const rssMB = Math.round(mem.rss / 1024 / 1024);

  // Disk usage of data/ folder
  let dataSizeKB = 0;
  try {
    const dataDir = path.join(__dirname, '..', 'data');
    if (fs.existsSync(dataDir)) {
      const walk = (dir) => {
        let size = 0;
        for (const f of fs.readdirSync(dir)) {
          const p = path.join(dir, f);
          const st = fs.statSync(p);
          size += st.isDirectory() ? walk(p) : st.size;
        }
        return size;
      };
      dataSizeKB = Math.round(walk(dataDir) / 1024);
    }
  } catch { /* noop */ }

  return {
    ok: true,
    status: 'healthy',
    latency: 0,
    uptime_sec: uptimeSec,
    memory: { heap_used_mb: heapUsedMB, heap_total_mb: heapTotalMB, rss_mb: rssMB },
    data_size_kb: dataSizeKB,
    node_version: process.version,
    env: process.env.NODE_ENV || 'production',
    release: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) || 'unknown',
  };
}

export default function registerAdminHealthRoutes(
  app,
  { getStripeInstance, getResendClient, STRIPE_SECRET_KEY, TELEGRAM_BOT_TOKEN }
) {
  app.get('/api/v1/admin/health', async (req, res) => {
    const t0 = Date.now();

    const [stripe, resend, coingecko, telegram] = await Promise.all([
      checkStripe(getStripeInstance, STRIPE_SECRET_KEY),
      checkResend(getResendClient),
      checkCoinGecko(),
      checkTelegram(TELEGRAM_BOT_TOKEN),
    ]);

    const sentry = checkSentry();
    const push = checkPushVapid();
    const indexnow = checkIndexNow();
    const system = checkSystem();

    const services = { stripe, resend, coingecko, telegram, sentry, push, indexnow };
    const allOk = Object.values(services).every((s) => s.ok || s.status === 'not_configured');
    const anyDown = Object.values(services).some((s) => s.status === 'down');

    res.json({
      ok: true,
      overall: anyDown ? 'down' : allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      total_check_ms: Date.now() - t0,
      services,
      system,
    });
  });

  console.log('[AdminHealth] ✅ Dashboard endpoint registered at GET /api/v1/admin/health');
}
