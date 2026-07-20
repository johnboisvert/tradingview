// Simple Express server for production that proxies API calls
// This keeps API keys server-side and avoids CORS issues
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import fs from 'fs';
const { readFileSync, writeFileSync, existsSync, mkdirSync } = fs;
import dotenv from 'dotenv';

// Modular routes (extracted Session 15)
import registerPushRoutes from './routes/push.js';
import registerBlogRoutes, { setBlogNewsletterNotifier } from './routes/blog.js';
import registerGamificationRoutes from './routes/gamification.js';
import registerAdminRoutes from './routes/admin.js';
import registerLeadMagnetRoutes from './routes/lead_magnet.js';
import registerEmailSequenceRoutes from './routes/email_sequence.js';
import registerPublicStatsRoutes from './routes/public_stats.js';
import registerSuccessStoriesRoutes from './routes/success_stories.js';
import registerDailyDigestRoutes from './routes/daily_digest.js';
import registerIndexNowRoutes, { notifyIndexNow } from './routes/indexnow.js';
import registerSentryWebhookRoutes from './routes/sentry_webhook.js';
import registerBlogNewsletterRoutes from './routes/blog_newsletter.js';
import registerBlogCronRoutes from './routes/blog_cron.js';
import registerI18nHelperRoutes from './routes/i18n_helper.js';
import registerEmailHealthRoutes from './routes/email_health.js';
import registerGlossaryRoutes from './routes/glossary.js';
import registerCompareRoutes from './routes/compare.js';
import registerCoinRoutes from './routes/coin_pages.js';
import registerDailyBriefRoutes from './routes/daily_brief.js';
import registerPaymentWebhookRoutes from './routes/payment_webhooks.js';
import registerCheckoutRecoveryRoutes from './routes/checkout_recovery.js';
import registerWinBackRoutes from './routes/winback.js';
import registerCoinGeckoProxy from './routes/coingecko_proxy.js';
import registerAdminHealthRoutes from './routes/admin_health.js';
import registerReferralRoutes, { ensureUserReferralCode } from './routes/referral.js';
import registerTwitterBotRoutes from './routes/twitter_bot.js';
import registerOnboardingRoutes from './routes/onboarding_emails.js';
import registerResendWebhookRoutes from './routes/resend_webhook.js';
import registerPromoRoutes from './routes/promo_codes.js';
import registerQuizRoutes from './routes/quiz.js';
import registerQuizOgRoutes from './routes/quiz_og.js';
import registerQuizSharesRoutes from './routes/quiz_shares.js';
import registerChallengeRoutes from './routes/challenge.js';
import registerPlanGrantsRoutes from './routes/plan_grants.js';
import registerTerminalLayoutRoutes from './routes/terminal_layouts.js';
import registerEconomicCalendarRoutes from './routes/economic_calendar.js';
import registerBinanceMarketRoutes from './routes/binance_market.js';
import registerUserRoutes from './routes/users.js';
import registerNewsProxyRoutes from './routes/news_proxy.js';
import registerDeribitOptionsRoutes from './routes/deribit_options.js';
import registerDerivativesSentimentRoutes from './routes/derivatives_sentiment.js';
import registerTelegramConfigRoutes from './routes/telegram_routes.js';
import registerIndicatorAccessRoutes from './routes/indicator_access.js';
import { createScalpEngine } from './lib/scalp_engine.js';
import { createSwingEngine } from './lib/swing_engine.js';
import { createRangeEngine } from './lib/range_engine.js';
import { formatPrice } from './lib/signal_primitives.js';
import { createTelegramHelpers } from './routes/telegram_alerts.js';
import { registerTradeCallRoutes } from './routes/trade_calls.js';
import { registerScalpCallRoutes } from './routes/scalp_calls.js';
import { registerRangeCallRoutes } from './routes/range_calls.js';
import { seed as gamiSeed } from './gamification_seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';

// ─── CoinGecko response cache + proxy (extracted to routes/coingecko_proxy.js) ───
// Registration happens later in this file; cache helpers are available via the module.

// Stripe webhook needs raw body for signature verification — must be before json parser
app.use('/api/v1/payment/stripe_webhook', express.raw({ type: 'application/json' }));
// Resend webhook also needs raw body to verify the Svix HMAC signature
app.use('/api/v1/webhooks/resend', express.raw({ type: '*/*', limit: '1mb' }));

// Parse JSON bodies for all other routes
app.use(express.json({ limit: '1mb' }));

// CORS middleware — allow all origins (needed for Railway deployment)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Auth, stripe-signature');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Request logging for /api/* routes
app.use('/api', (req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Version endpoint — verify which commit is deployed
app.get('/api/version', (req, res) => {
  res.json({
    commit: process.env.RAILWAY_GIT_COMMIT_SHA || null,
    swing_engine: 'v8',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// User Management — JSON file persistence
// ============================================================
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Forward-declared module containers (assigned later in startup, after deps are ready)
let referralModule = null; // assigned by registerReferralRoutes() later in the file

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_USERS = [
  {
    username: "admin",
    passwordHash: hashPwd("admin123"),
    role: "admin",
    plan: "elite",
    subscription_end: "2027-02-17",
    created_at: "2024-01-15",
  },
];

function hashPwd(password) {
  return createHash('sha256').update(password).digest('hex');
}

function loadUsers() {
  try {
    if (existsSync(USERS_FILE)) {
      const raw = readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
  // Initialize with defaults
  saveUsers(DEFAULT_USERS);
  return DEFAULT_USERS;
}

function saveUsers(users) {
  try {
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

// ─── User routes extracted to routes/users.js (Session 42) ───
registerUserRoutes(app, {
  loadUsers, saveUsers, hashPwd,
  ensureUserReferralCode,
  getResendClient, buildWelcomeEmailHtml,
  trackServerEvent, sendChatNotification, recordAffiliationConversion,
});

// ============================================================
// Super Admin Management — extracted to routes/admin.js (Session 16)
// ============================================================
registerAdminRoutes(app, { DATA_DIR, hashPwd });

// ─── Gemini AI Chat proxy ───
app.post('/api/ai-chat', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: req.body.contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', response.status, data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to reach Gemini API' });
  }
});

// ─── Crypto Prediction API proxy ───
// Proxies /api/crypto-predict/* to https://crypto-prediction-api-5763.onrender.com/*
app.all('/api/crypto-predict/{*path}', async (req, res) => {
  const targetPath = req.url.replace('/api/crypto-predict', '');
  const targetUrl = `https://crypto-prediction-api-5763.onrender.com${targetPath}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(60000),
    });

    const data = await upstreamRes.text();
    res.status(upstreamRes.status)
      .set('Content-Type', 'application/json')
      .send(data);
  } catch (err) {
    console.error('Crypto predict proxy error:', err);
    res.status(502).json({ error: 'Proxy failed', message: err?.message });
  }
});

// ─── CoinGecko API proxy (registered from routes/coingecko_proxy.js) ───
registerCoinGeckoProxy(app);

// ─── Binance/Bybit market helpers → lib/market_sources.js ───
// ─── Binance market proxies (klines/depth/funding) → routes/binance_market.js ───
registerBinanceMarketRoutes(app);

// ============================================================
// Calls stores — swing/scalp/range persistence + endpoints + resolvers
// extracted to routes/{trade,scalp,range}_calls.js (Session 47)
// ============================================================
const tradeCallsStore = registerTradeCallRoutes(app, { dataDir: DATA_DIR });
const scalpCallsStore = registerScalpCallRoutes(app, { dataDir: DATA_DIR });
const rangeCallsStore = registerRangeCallRoutes(app, { dataDir: DATA_DIR });

// ============================================================
// Telegram Bot API
// ============================================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8478131465:AAEh7Z0rvIqSNvn1wKdtkMNb-O96h41LCns';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002940633257';

// In-memory alert config (persisted to file)
const TELEGRAM_ALERTS_FILE = path.join(DATA_DIR, 'telegram_alerts.json');

// ─── Telegram helpers extracted to routes/telegram_alerts.js for maintainability
// Same API surface as before — drop-in replacement that keeps all trading logic working
const _telegramHelpers = createTelegramHelpers({
  dataDir: DATA_DIR,
  assetsDir: path.join(__dirname, 'assets'),
});
const loadTelegramAlerts = _telegramHelpers.loadTelegramAlerts;
const saveTelegramAlerts = _telegramHelpers.saveTelegramAlerts;
const sendTelegramMessage = _telegramHelpers.sendTelegramMessage;
const sendTelegramPhoto = _telegramHelpers.sendTelegramPhoto;

// ─── Telegram config routes → routes/telegram_routes.js (Session 43) ───
registerTelegramConfigRoutes(app, {
  sendTelegramMessage,
  loadTelegramAlerts,
  saveTelegramAlerts,
  checkAndSendAlerts: (...a) => swingEngine.checkAndSendAlerts(...a),
  onToggle: (enabled) => {
    if (enabled) {
      startAlertChecker();
      startScalpAlertChecker();
    } else {
      swingEngine.stopAlertChecker();
      scalpEngine.stopScalpAlertChecker();
    }
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// SWING ALERTS — engine extracted to lib/swing_engine.js (Session 45)
// ═══════════════════════════════════════════════════════════════════════════════
const swingEngine = createSwingEngine({
  port: PORT,
  loadTelegramAlerts,
  saveTelegramAlerts,
  sendTelegramMessage,
  loadTradeCalls: tradeCallsStore.loadTradeCalls,
});
const { startAlertChecker } = swingEngine;

// ─── /api/telegram/toggle → routes/telegram_routes.js (Session 43) ───

// Initialize in-memory cooldowns from file on boot (synchronous, fast)
try { swingEngine.initCooldownsFromFile(); } catch (e) { console.error('[Boot] initCooldownsFromFile error:', e?.message); }

// Defer Telegram alert checker to AFTER server is listening (see app.listen at EOF)
// startAlertChecker() is now called inside app.listen callback

// ============================================================
// SCALP TRADING — engine extracted to lib/scalp_engine.js (Session 44)
// ============================================================
const scalpEngine = createScalpEngine({
  dataDir: DATA_DIR,
  loadTelegramAlerts,
  sendTelegramMessage,
  formatPrice,
  loadScalpCalls: scalpCallsStore.loadScalpCalls,
  saveScalpCalls: scalpCallsStore.saveScalpCalls,
  allocateScalpCallId: scalpCallsStore.allocateScalpCallId,
});
const { startScalpAlertChecker } = scalpEngine;
scalpEngine.registerRoutes(app);

// ============================================================
// RANGE TRADING — engine extracted to lib/range_engine.js (Session 45)
// ============================================================
const rangeEngine = createRangeEngine({
  dataDir: DATA_DIR,
  loadTelegramAlerts,
  sendTelegramMessage,
  loadRangeCalls: rangeCallsStore.loadRangeCalls,
  saveRangeCalls: rangeCallsStore.saveRangeCalls,
  allocateRangeCallId: rangeCallsStore.allocateRangeCallId,
});
const { startRangeAlertChecker } = rangeEngine;
rangeEngine.registerRoutes(app);

// ============================================================
// Referral / Parrainage API
// ============================================================
const REFERRALS_FILE = path.join(DATA_DIR, 'referrals.json');

function loadReferrals() {
  try {
    if (existsSync(REFERRALS_FILE)) {
      const raw = readFileSync(REFERRALS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading referrals:', err);
  }
  return [];
}

function saveReferralsFile(referrals) {
  try {
    writeFileSync(REFERRALS_FILE, JSON.stringify(referrals, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving referrals:', err);
  }
}

// ─── GET /api/referral/:username — Get referral stats for a user ───
app.get('/api/referral/:username', (req, res) => {
  const { username } = req.params;
  if (!username) {
    return res.status(400).json({ success: false, message: 'Username requis.' });
  }

  const referrals = loadReferrals();
  const users = loadUsers();
  const userReferrals = referrals.filter(
    (r) => r.referrer.toLowerCase() === username.toLowerCase()
  );

  const referralDetails = userReferrals.map((r) => {
    const user = users.find((u) => u.username.toLowerCase() === r.referred.toLowerCase());
    return {
      username: r.referred,
      plan: user?.plan || 'free',
      created_at: r.created_at,
      is_paid: !!user && user.plan !== 'free',
    };
  });

  const paidCount = referralDetails.filter((r) => r.is_paid).length;

  res.json({
    success: true,
    stats: {
      referral_code: username,
      total_referrals: userReferrals.length,
      paid_referrals: paidCount,
      rewards_earned: paidCount,
      referrals: referralDetails,
    },
  });
});

// ─── POST /api/referral/track — Track a new referral ───
app.post('/api/referral/track', (req, res) => {
  const { referrer, referred } = req.body;
  if (!referrer || !referred) {
    return res.status(400).json({ success: false, message: 'referrer et referred requis.' });
  }

  if (referrer.toLowerCase() === referred.toLowerCase()) {
    return res.status(400).json({ success: false, message: 'Impossible de se parrainer soi-même.' });
  }

  const referrals = loadReferrals();

  // Check for duplicate
  const exists = referrals.find(
    (r) => r.referred.toLowerCase() === referred.toLowerCase()
  );
  if (exists) {
    return res.json({ success: false, message: 'Cet utilisateur a déjà été parrainé.' });
  }

  referrals.push({
    referrer: referrer.toLowerCase(),
    referred: referred.toLowerCase(),
    created_at: new Date().toISOString(),
  });
  saveReferralsFile(referrals);

  console.log(`[Referral] ${referrer} referred ${referred}`);
  res.json({ success: true, message: 'Parrainage enregistré avec succès.' });
});

// ─── GET /api/referral-leaderboard — Get global referral leaderboard (admin) ───
app.get('/api/referral-leaderboard', (req, res) => {
  const referrals = loadReferrals();
  const users = loadUsers();

  const grouped = {};
  for (const ref of referrals) {
    const key = ref.referrer.toLowerCase();
    if (!grouped[key]) grouped[key] = { total: 0, paid: 0, revenue: 0 };
    grouped[key].total += 1;
    const user = users.find((u) => u.username.toLowerCase() === ref.referred.toLowerCase());
    if (user && user.plan !== 'free') {
      grouped[key].paid += 1;
    }
  }

  const leaderboard = Object.entries(grouped)
    .map(([username, data]) => ({ username, referrals: data.total, paid: data.paid, revenue: data.revenue }))
    .sort((a, b) => b.paid - a.paid || b.referrals - a.referrals);

  res.json({
    success: true,
    total_referrals: referrals.length,
    paid_referrals: leaderboard.reduce((s, l) => s + l.paid, 0),
    leaderboard,
  });
});

// ============================================================
// Payment & Pricing API Routes
// ============================================================
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_live_51T4QrBHkGf0ASc9NayAkTOa6wRUwXzGjbPQb6WYSMSBdzh0nqwndc6XzLcml75pxJ3dTFFTBCBoZj5xrNoh7UEpI00dKriHv01';
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';

// Lazy-load stripe instance (async because stripe is ESM)
let stripeInstance = null;
async function getStripeInstance() {
  if (!stripeInstance && STRIPE_SECRET_KEY) {
    const { default: Stripe } = await import('stripe');
    stripeInstance = new Stripe(STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

// Pricing file persistence
const PRICING_FILE = path.join(DATA_DIR, 'pricing.json');

const DEFAULT_MONTHLY = { premium: 19.99, advanced: 34.99, pro: 54.99, elite: 79.99 };
const DEFAULT_ANNUAL_DISCOUNT = 20.0;

function loadPricing() {
  try {
    if (existsSync(PRICING_FILE)) {
      return JSON.parse(readFileSync(PRICING_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading pricing:', err);
  }
  // Return defaults
  const factor = 1 - DEFAULT_ANNUAL_DISCOUNT / 100;
  const annual = {};
  for (const [k, v] of Object.entries(DEFAULT_MONTHLY)) {
    annual[k] = Math.round(v * factor * 100) / 100;
  }
  return {
    monthly: { ...DEFAULT_MONTHLY },
    annual,
    annual_discount: DEFAULT_ANNUAL_DISCOUNT,
  };
}

function savePricing(pricing) {
  try {
    writeFileSync(PRICING_FILE, JSON.stringify(pricing, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving pricing:', err);
  }
}

function getFrontendHost(req) {
  let host = req.headers['app-host'] || '';
  if (host && !host.startsWith('http://') && !host.startsWith('https://')) {
    host = `https://${host}`;
  }
  if (!host) {
    const origin = req.headers['origin'] || '';
    host = origin || `${req.protocol}://${req.headers.host}`;
  }
  return host.replace(/\/+$/, '');
}

const PLAN_LABELS = {
  premium: 'Abonnement Premium — CryptoIA',
  advanced: 'Abonnement Advanced — CryptoIA',
  pro: 'Abonnement Pro — CryptoIA',
  elite: 'Abonnement Elite — CryptoIA',
};

// ─── GET /api/v1/pricing ───
app.get('/api/v1/pricing', (req, res) => {
  const pricing = loadPricing();
  res.json(pricing);
});

// ─── PUT /api/v1/admin/pricing ───
app.put('/api/v1/admin/pricing', (req, res) => {
  const adminAuth = req.headers['x-admin-auth'];
  if (adminAuth !== 'true') {
    return res.status(401).json({ success: false, message: 'Admin authentication required.' });
  }

  const { monthly, annual, annual_discount } = req.body;
  const current = loadPricing();

  if (monthly) {
    for (const plan of ['premium', 'advanced', 'pro', 'elite']) {
      if (monthly[plan] !== undefined) current.monthly[plan] = monthly[plan];
    }
  }
  if (annual) {
    for (const plan of ['premium', 'advanced', 'pro', 'elite']) {
      if (annual[plan] !== undefined) current.annual[plan] = annual[plan];
    }
  }
  if (annual_discount !== undefined) {
    current.annual_discount = annual_discount;
  }

  savePricing(current);
  res.json({ success: true, message: 'Pricing updated successfully' });
});

// ─── GET /api/v1/payment/config ───
app.get('/api/v1/payment/config', (req, res) => {
  let pk = STRIPE_PUBLISHABLE_KEY;
  if (!pk && STRIPE_SECRET_KEY) {
    pk = STRIPE_SECRET_KEY.replace('sk_live_', 'pk_live_').replace('sk_test_', 'pk_test_');
  }
  res.json({ publishable_key: pk || '' });
});

// ─── POST /api/v1/payment/create_payment_session ───
app.post('/api/v1/payment/create_payment_session', async (req, res) => {
  if (!STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe non configuré — ajoutez STRIPE_SECRET_KEY dans Railway' });
  }

  try {
    const stripe = await getStripeInstance();
    const { plan, billing_period = 'monthly', promo_code, ref_code } = req.body;

    if (!plan) {
      return res.status(400).json({ error: 'plan requis' });
    }

    // ─── 🛡️ SÉCURITÉ : Recalcul du prix CÔTÉ SERVEUR (jamais faire confiance au client) ───
    const SERVER_PLAN_PRICES = {
      premium:  { monthly: 49.99, annual: 34.99 },
      vip:      { monthly: 79.99, annual: 56.99 },
      ai:       { monthly: 99.99, annual: 69.99 },
      // Add other plans here if needed
    };
    const PROMO_CODES_BACKEND = {
      BIENVENUE20: 20,
      LAUNCH30: 30,
      BFRIDAY40: 40,
      LASTCHANCE20: 20, // Cart recovery promo (sent via checkout.session.expired email)
    };

    const planPrices = SERVER_PLAN_PRICES[plan] || SERVER_PLAN_PRICES.premium;
    const isAnnual = billing_period === 'annual';
    let basePrice = isAnnual ? planPrices.annual : planPrices.monthly;
    if (isAnnual) basePrice = basePrice * 12;

    let finalAmount = basePrice;
    let appliedDiscount = 0;
    if (promo_code && typeof promo_code === 'string') {
      const code = promo_code.trim().toUpperCase();
      if (PROMO_CODES_BACKEND[code]) {
        appliedDiscount = PROMO_CODES_BACKEND[code];
        finalAmount = basePrice * (1 - appliedDiscount / 100);
        console.log(`[Payment] Promo ${code} validated: -${appliedDiscount}% (${basePrice} → ${finalAmount.toFixed(2)})`);
      } else {
        console.warn(`[Payment] Invalid promo code attempted: ${code}`);
      }
    }

    const host = getFrontendHost(req);
    const amountCents = Math.round(finalAmount * 100);
    const interval = isAnnual ? 'year' : 'month';

    let label = PLAN_LABELS[plan] || `Abonnement ${plan.charAt(0).toUpperCase() + plan.slice(1)} — CryptoIA`;
    if (isAnnual) label += ' (Annuel)';

    // ✨ 7-day free trial — only for "advanced" plan (conversion booster)
    // Stripe will collect payment method but won't charge until day 7
    const TRIAL_PLANS = (process.env.STRIPE_TRIAL_PLANS || 'advanced').split(',').map(s => s.trim().toLowerCase());
    const trialDays = TRIAL_PLANS.includes(String(plan).toLowerCase()) ? 7 : 0;

    // ─── 🎁 Referral coupon: -20% on first invoice if ref_code is valid ───
    // We attach the Stripe coupon via subscription_data.discounts so the user can't
    // game it by also entering a promotion code. The coupon is `duration: once` so
    // it applies only to the FIRST invoice (monthly OR annual, both honored).
    let referralCouponId = null;
    if (ref_code && typeof ref_code === 'string' && ref_code.trim().length >= 4) {
      try {
        const users = loadUsers();
        const refCodeUpper = ref_code.trim().toUpperCase();
        const parrain = users.find(u => (u.referralCode || '').toUpperCase() === refCodeUpper);
        if (parrain) {
          referralCouponId = await referralModule.ensureReferralCoupon();
          console.log(`[Payment] 🎁 Referral coupon ${referralCouponId} -20% applied for parrain=${parrain.username}`);
        } else {
          console.log(`[Payment] ⚠️ ref_code=${ref_code} not found in users — no referral coupon applied`);
        }
      } catch (e) {
        console.error('[Payment] Referral coupon error:', e?.message);
      }
    }

    const subscriptionData = {};
    if (trialDays > 0) subscriptionData.trial_period_days = trialDays;
    // Note: Stripe API requires coupon either via `discounts` (Checkout-level) OR
    // `subscription_data.discounts`. We use Checkout-level so it applies to the first invoice.

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: { name: label },
            unit_amount: amountCents,
            recurring: { interval, interval_count: 1 },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      ...(Object.keys(subscriptionData).length > 0 ? { subscription_data: subscriptionData } : {}),
      ...(referralCouponId ? { discounts: [{ coupon: referralCouponId }] } : {}),
      success_url: `${host}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&billing=${billing_period}`,
      cancel_url: `${host}/abonnements`,
      metadata: {
        plan,
        billing_period,
        promo_code: promo_code || '',
        discount_pct: String(appliedDiscount),
        ref_code: ref_code || '',
        trial_days: String(trialDays),
        referral_coupon_applied: referralCouponId ? '1' : '0',
      },
      // ⚠️ Stripe does not allow `allow_promotion_codes` together with `discounts`
      ...(!referralCouponId ? { allow_promotion_codes: true } : {}),
    });

    if (trialDays > 0) {
      console.log(`[Payment] ✨ Trial activated: ${trialDays} days for plan=${plan}`);
    }

    console.log(`[Payment] Stripe session created: ${session.id} plan=${plan} billing=${billing_period} amount=${finalAmount.toFixed(2)} promo=${promo_code || 'none'} ref=${ref_code || 'none'}`);

    // Track conversion intent (will be confirmed by webhook on payment completion)
    if (ref_code) {
      recordAffiliationConversion({ code: ref_code, type: 'payment_intent', amount: finalAmount });
    }

    res.json({ session_id: session.id, url: session.url, final_amount: finalAmount });
  } catch (err) {
    console.error('[Payment] Stripe create session error:', err);
    const message = err?.raw?.message || err?.message || 'Erreur Stripe';
    res.status(400).json({ error: message });
  }
});

// ─── POST /api/v1/payment/create_indicators_checkout ───
// Suite complète des 9 indicateurs TradingView (mensuel / annuel / à vie)
app.post('/api/v1/payment/create_indicators_checkout', async (req, res) => {
  if (!STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe non configuré' });
  }
  try {
    const stripe = await getStripeInstance();
    const { billing = 'monthly' } = req.body;

    // 🛡️ Prix côté serveur uniquement
    const INDICATORS_PRICES = {
      monthly:  { amount: 49,  mode: 'subscription', interval: 'month', label: 'Suite Indicateurs CryptoIA — 9 indicateurs TradingView (Mensuel)' },
      annual:   { amount: 399, mode: 'subscription', interval: 'year',  label: 'Suite Indicateurs CryptoIA — 9 indicateurs TradingView (Annuel)' },
      lifetime: { amount: 899, mode: 'payment',      interval: null,    label: 'Suite Indicateurs CryptoIA — 9 indicateurs TradingView (Licence à vie)' },
    };
    const cfg = INDICATORS_PRICES[billing];
    if (!cfg) return res.status(400).json({ error: 'billing invalide (monthly, annual, lifetime)' });

    const host = getFrontendHost(req);
    const priceData = {
      currency: 'cad',
      product_data: { name: cfg.label },
      unit_amount: Math.round(cfg.amount * 100),
    };
    if (cfg.mode === 'subscription') priceData.recurring = { interval: cfg.interval, interval_count: 1 };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: priceData, quantity: 1 }],
      mode: cfg.mode,
      success_url: `${host}/magic-strategy?payment=success&billing=${billing}`,
      cancel_url: `${host}/magic-strategy`,
      allow_promotion_codes: true,
      metadata: { product: 'indicators_suite', billing },
    });

    console.log(`[Payment] Indicators checkout created: ${session.id} billing=${billing} amount=${cfg.amount}$ CAD`);
    res.json({ session_id: session.id, url: session.url });
  } catch (err) {
    console.error('[Payment] Indicators checkout error:', err);
    res.status(400).json({ error: err?.raw?.message || err?.message || 'Erreur Stripe' });
  }
});

// ─── POST /api/v1/payment/verify_payment ───
app.post('/api/v1/payment/verify_payment', async (req, res) => {
  if (!STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe non configuré' });
  }

  try {
    const stripe = await getStripeInstance();
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id requis' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const metadata = session.metadata || {};
    const plan = metadata.plan || 'unknown';
    const billingPeriod = metadata.billing_period || 'monthly';

    // Calculate subscription end date
    const now = new Date();
    let endDate;
    if (billingPeriod === 'annual') {
      endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    } else {
      endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    const subscriptionEnd = endDate.toISOString().split('T')[0];

    console.log(`[Payment] Stripe verify: session=${session_id}, status=${session.status}, plan=${plan}, billing=${billingPeriod}`);

    res.json({
      status: session.status,
      payment_status: session.payment_status,
      plan,
      amount_total: session.amount_total || 0,
      currency: session.currency || 'cad',
      billing_period: billingPeriod,
      subscription_end: subscriptionEnd,
    });
  } catch (err) {
    console.error('[Payment] Stripe verify error:', err);
    const message = err?.raw?.message || err?.message || 'Erreur Stripe';
    res.status(400).json({ error: message });
  }
});

// ─── Payment Webhooks (Stripe + NOWPayments) — extracted to routes/payment_webhooks.js ───

// ─── GET /api/v1/nowpayments/status ───
app.get('/api/v1/nowpayments/status', async (req, res) => {
  const apiKey = NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'NOWPayments non configuré' });
  }

  try {
    const response = await fetch('https://api.nowpayments.io/v1/status', {
      headers: { 'x-api-key': apiKey },
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[NOWPayments] Status check error:', err);
    res.status(503).json({ error: `NOWPayments inaccessible: ${err.message}` });
  }
});

// ─── GET /api/config — Legacy config endpoint ───
app.get('/api/config', (req, res) => {
  const pricing = loadPricing();
  res.json({
    pricing,
    stripe_publishable_key: STRIPE_PUBLISHABLE_KEY || '',
    nowpayments_enabled: !!NOWPAYMENTS_API_KEY,
  });
});

// ─── Trade calls (swing) → routes/trade_calls.js (Session 47) ───

// ─── Scalp calls → routes/scalp_calls.js (Session 47) ───


// ─── Range calls → routes/range_calls.js ; range engine créé plus haut (Session 47) ───

// ─── News proxies extracted to routes/news_proxy.js (Session 42) ───
registerNewsProxyRoutes(app);
registerDeribitOptionsRoutes(app);
registerDerivativesSentimentRoutes(app);

// Prevent browser caching of HTML (force fresh loads after deploy)
app.use((req, res, next) => {
  if (req.url.endsWith('.html') || req.url === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// ─── Welcome Email Endpoint (Resend) ──────────────────────────────────────
// POST /api/v1/email/welcome  { email, name? }  → envoie un email de bienvenue
// Requiert RESEND_API_KEY dans l'env. SENDER_EMAIL optionnel (défaut: onboarding@resend.dev).
let resendClient = null;
async function getResendClient() {
  if (resendClient !== null) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY not set — welcome emails disabled');
    resendClient = false;
    return false;
  }
  try {
    const { Resend } = await import('resend');
    resendClient = new Resend(apiKey);
    console.log('[Resend] Client initialized');
    return resendClient;
  } catch (e) {
    console.error('[Resend] Failed to load SDK:', e?.message);
    resendClient = false;
    return false;
  }
}

function buildWelcomeEmailHtml(name) {
  const displayName = (name && String(name).trim()) || 'trader';
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Bienvenue sur CryptoIA</title>
</head>
<body style="margin:0;padding:0;background:#0A0E1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0A0E1A;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:linear-gradient(140deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%);border-radius:24px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="padding:36px 32px 24px;text-align:center;background:linear-gradient(180deg,rgba(99,102,241,0.15) 0%,rgba(99,102,241,0) 100%);">
            <div style="display:inline-block;width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef);text-align:center;line-height:64px;font-size:28px;margin-bottom:16px;box-shadow:0 0 32px rgba(99,102,241,0.5);">⚡</div>
            <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Bienvenue sur CryptoIA 👋</h1>
            <p style="margin:8px 0 0;color:#a5b4fc;font-size:15px;">Bonjour ${displayName}, votre compte est prêt.</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:8px 32px 24px;">
            <p style="margin:0 0 16px;font-size:15px;color:#cbd5e1;line-height:1.65;">
              Vous avez maintenant accès à la plateforme de trading crypto IA la plus complète : Score IA temps réel, signaux automatiques, backtesting visuel, alertes Telegram, et plus de 50 outils pro.
            </p>
            <!-- Promo box -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;">
              <tr><td style="padding:20px;border-radius:16px;border:2px dashed rgba(245,158,11,0.45);background:rgba(245,158,11,0.06);text-align:center;">
                <p style="margin:0;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#fbbf24;">🎁 Cadeau de bienvenue · -20%</p>
                <p style="margin:8px 0;font-size:28px;font-weight:900;letter-spacing:6px;color:#fde047;font-family:'SF Mono',Menlo,monospace;">BIENVENUE20</p>
                <p style="margin:0;font-size:12px;color:#94a3b8;">Sur votre 1<sup>er</sup> abonnement annuel</p>
              </td></tr>
            </table>
            <!-- CTA -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr><td align="center" style="padding:8px 0 16px;">
                <a href="https://www.cryptoia.app/?welcome=1" style="display:inline-block;padding:14px 32px;border-radius:14px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#d946ef 100%);color:#ffffff;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:1.5px;text-decoration:none;box-shadow:0 12px 30px -8px rgba(99,102,241,0.6);">
                  🚀 Accéder à mon dashboard
                </a>
              </td></tr>
            </table>
            <!-- Quick links -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;">
              <tr>
                <td width="33%" align="center" style="padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.025);">
                  <p style="margin:0;font-size:24px;">🧠</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;font-weight:700;">Score IA</p>
                </td>
                <td width="2%"></td>
                <td width="33%" align="center" style="padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.025);">
                  <p style="margin:0;font-size:24px;">📊</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;font-weight:700;">Backtesting</p>
                </td>
                <td width="2%"></td>
                <td width="33%" align="center" style="padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.025);">
                  <p style="margin:0;font-size:24px;">🎯</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;font-weight:700;">Signaux IA</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;color:#64748b;">Une question ? Répondez simplement à cet email — notre équipe est là pour vous.</p>
            <p style="margin:0;font-size:10px;color:#475569;">CryptoIA · La plateforme de trading IA crypto · Vous recevez cet email car vous venez de créer un compte.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

app.post('/api/v1/email/welcome', express.json(), async (req, res) => {
  try {
    const { email, name } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    const client = await getResendClient();
    if (!client) {
      return res.status(503).json({ error: 'Email service not configured', detail: 'RESEND_API_KEY missing' });
    }
    const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
    const result = await client.emails.send({
      from: sender,
      to: [email],
      subject: '👋 Bienvenue sur CryptoIA — Votre code -20% à l\'intérieur',
      html: buildWelcomeEmailHtml(name),
    });
    if (result?.error) {
      console.error('[Resend] Send error:', result.error);
      return res.status(500).json({ error: 'Send failed', detail: result.error?.message || 'Unknown' });
    }
    console.log(`[Resend] Welcome email sent to ${email} (id=${result?.data?.id || 'n/a'})`);
    return res.json({ status: 'success', email_id: result?.data?.id || null });
  } catch (e) {
    console.error('[Resend] Endpoint error:', e?.message);
    return res.status(500).json({ error: 'Internal error', detail: e?.message || 'Unknown' });
  }
});

// ─── Analytics Tracking (events store) ──────────────────────────────────────
const ANALYTICS_FILE = path.join(__dirname, 'data', 'analytics_events.json');

function loadAnalyticsEvents() {
  try {
    if (!fs.existsSync(ANALYTICS_FILE)) return [];
    const raw = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAnalyticsEvents(events) {
  try {
    fs.mkdirSync(path.dirname(ANALYTICS_FILE), { recursive: true });
    // Keep only last 50k events to avoid unbounded growth
    const trimmed = events.length > 50000 ? events.slice(-50000) : events;
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(trimmed));
  } catch (e) {
    console.error('[Analytics] save error:', e?.message);
  }
}

const ALLOWED_EVENTS = new Set([
  'popup_shown', 'popup_copy_code', 'popup_cta_click', 'popup_dismiss',
  'promo_applied', 'promo_invalid',
  'affiliate_generated', 'affiliate_link_copied',
  'onboarding_started', 'onboarding_completed', 'onboarding_skipped', 'onboarding_cta_click',
  'testimonial_cta_click',
  'email_welcome_sent', 'email_welcome_failed',
  'email_welcome_delivered', 'email_welcome_opened', 'email_welcome_clicked',
  'email_welcome_bounced', 'email_welcome_complained',
  'signup_started', 'signup_completed',
  // ─── Conversion funnel (Session 17) ───
  'pricing_page_viewed', 'plan_selected', 'billing_period_changed',
  'checkout_started', 'checkout_failed', 'checkout_method_chosen',
  'payment_completed', 'payment_failed',
  'blog_article_viewed', 'blog_cta_clicked', 'blog_share_clicked', 'leaderboard_viewed',
  'lead_magnet_submitted', 'lead_magnet_delivered',
]);

app.post('/api/v1/analytics/track', express.json(), (req, res) => {
  try {
    const { event, meta } = req.body || {};
    if (!event || typeof event !== 'string') {
      return res.status(400).json({ error: 'event required' });
    }
    if (!ALLOWED_EVENTS.has(event)) {
      return res.status(400).json({ error: 'event not allowed', event });
    }
    const events = loadAnalyticsEvents();
    events.push({
      ts: new Date().toISOString(),
      event,
      meta: (meta && typeof meta === 'object') ? meta : {},
    });
    saveAnalyticsEvents(events);
    return res.json({ status: 'ok' });
  } catch (e) {
    console.error('[Analytics] track error:', e?.message);
    return res.status(500).json({ error: 'internal error' });
  }
});

app.get('/api/v1/analytics/stats', (req, res) => {
  try {
    const range = String(req.query.range || '7d'); // 1d | 7d | 30d | all
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const cutoff = range === '1d' ? now - dayMs
                 : range === '30d' ? now - 30 * dayMs
                 : range === 'all' ? 0
                 : now - 7 * dayMs;

    const all = loadAnalyticsEvents();
    const events = all.filter(e => new Date(e.ts).getTime() >= cutoff);

    // Counts per event type
    const counts = {};
    for (const e of events) counts[e.event] = (counts[e.event] || 0) + 1;

    // Top promo codes used
    const promos = {};
    for (const e of events.filter(e => e.event === 'promo_applied')) {
      const code = e.meta?.code || 'UNKNOWN';
      promos[code] = (promos[code] || 0) + 1;
    }
    const topPromos = Object.entries(promos)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top affiliates generated
    const affiliates = {};
    for (const e of events.filter(e => e.event === 'affiliate_generated')) {
      const code = e.meta?.code || 'UNKNOWN';
      affiliates[code] = (affiliates[code] || 0) + 1;
    }
    const topAffiliates = Object.entries(affiliates)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Events per day (for chart)
    const perDay = {};
    for (const e of events) {
      const day = e.ts.slice(0, 10); // YYYY-MM-DD
      perDay[day] = (perDay[day] || 0) + 1;
    }
    const timeline = Object.entries(perDay)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day));

    // Recent events (last 50)
    const recent = events.slice(-50).reverse();

    // Conversion rates
    const popupShown = counts.popup_shown || 0;
    const popupCta = counts.popup_cta_click || 0;
    const popupConversion = popupShown > 0 ? (popupCta / popupShown * 100) : 0;

    const onboardingStarted = counts.onboarding_started || 0;
    const onboardingCompleted = counts.onboarding_completed || 0;
    const onboardingCompletion = onboardingStarted > 0 ? (onboardingCompleted / onboardingStarted * 100) : 0;

    // ─── Conversion funnel (Session 17) ───
    const pricingViewed = counts.pricing_page_viewed || 0;
    const checkoutStarted = counts.checkout_started || 0;
    const paymentCompleted = counts.payment_completed || 0;
    const paymentFailed = counts.payment_failed || 0;
    const checkoutFailed = counts.checkout_failed || 0;
    const funnelRates = {
      pricing_to_checkout: pricingViewed > 0 ? Number((checkoutStarted / pricingViewed * 100).toFixed(1)) : 0,
      checkout_to_paid: checkoutStarted > 0 ? Number((paymentCompleted / checkoutStarted * 100).toFixed(1)) : 0,
      pricing_to_paid: pricingViewed > 0 ? Number((paymentCompleted / pricingViewed * 100).toFixed(1)) : 0,
    };
    // Revenue estimation (CAD) — from payment_completed events with meta.amount
    const revenue = events
      .filter(e => e.event === 'payment_completed')
      .reduce((sum, e) => sum + (Number(e.meta?.amount) || 0), 0);
    // Plan breakdown
    const planBreakdown = {};
    for (const e of events.filter(e => e.event === 'checkout_started')) {
      const plan = e.meta?.plan || 'unknown';
      planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
    }

    return res.json({
      range,
      total_events: events.length,
      counts,
      top_promos: topPromos,
      top_affiliates: topAffiliates,
      timeline,
      recent,
      conversions: {
        popup: { shown: popupShown, cta: popupCta, rate: Number(popupConversion.toFixed(1)) },
        onboarding: { started: onboardingStarted, completed: onboardingCompleted, rate: Number(onboardingCompletion.toFixed(1)) },
      },
      funnel: {
        pricing_viewed: pricingViewed,
        checkout_started: checkoutStarted,
        checkout_failed: checkoutFailed,
        payment_completed: paymentCompleted,
        payment_failed: paymentFailed,
        rates: funnelRates,
        revenue_cad: Number(revenue.toFixed(2)),
        plan_breakdown: planBreakdown,
      },
    });
  } catch (e) {
    console.error('[Analytics] stats error:', e?.message);
    return res.status(500).json({ error: 'internal error' });
  }
});

// Helper: tracker server-side (used by /api/users/create welcome email)
function trackServerEvent(event, meta) {
  try {
    if (!ALLOWED_EVENTS.has(event)) return;
    const events = loadAnalyticsEvents();
    events.push({ ts: new Date().toISOString(), event, meta: meta || {} });
    saveAnalyticsEvents(events);
  } catch {
    // never block
  }
}

// ─── Discord/Slack instant notifications ─────────────────────────────────────
// Configure DISCORD_WEBHOOK_URL or SLACK_WEBHOOK_URL in Railway to enable.
// Both can be set simultaneously — notification will be sent to both.
async function sendChatNotification({ title, lines, color = 0x6366f1 }) {
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  const body = typeof lines === 'string' ? lines : '';

  // Discord embed
  if (discordUrl) {
    try {
      await fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: title || 'CryptoIA',
            description: body,
            color,
            timestamp: new Date().toISOString(),
            footer: { text: 'CryptoIA · Notifications' },
          }],
        }),
      });
    } catch (e) { console.error('[Discord] webhook error:', e?.message); }
  }

  // Slack simple text
  if (slackUrl) {
    try {
      await fetch(slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `*${title || 'CryptoIA'}*\n${body.replace(/\*\*/g, '*')}`,
        }),
      });
    } catch (e) { console.error('[Slack] webhook error:', e?.message); }
  }
}

// ─── Affiliation Tracking ────────────────────────────────────────────────────
const AFFILIATION_FILE = path.join(__dirname, 'data', 'affiliation_events.json');

function loadAffiliationEvents() {
  try {
    if (!fs.existsSync(AFFILIATION_FILE)) return [];
    const raw = fs.readFileSync(AFFILIATION_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveAffiliationEvents(events) {
  try {
    fs.mkdirSync(path.dirname(AFFILIATION_FILE), { recursive: true });
    const trimmed = events.length > 50000 ? events.slice(-50000) : events;
    fs.writeFileSync(AFFILIATION_FILE, JSON.stringify(trimmed));
  } catch (e) { console.error('[Affiliation] save error:', e?.message); }
}

app.post('/api/v1/affiliation/click', express.json(), (req, res) => {
  try {
    const { code, ts } = req.body || {};
    if (!code || typeof code !== 'string') return res.status(400).json({ error: 'code required' });
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normalized.length < 4 || normalized.length > 20) return res.status(400).json({ error: 'invalid code' });
    const events = loadAffiliationEvents();
    events.push({ type: 'click', code: normalized, ts: ts || new Date().toISOString(), ip: req.ip || 'unknown' });
    saveAffiliationEvents(events);
    return res.json({ status: 'ok' });
  } catch { return res.status(500).json({ error: 'internal error' }); }
});

function recordAffiliationConversion({ code, type, amount, email, fraud }) {
  if (!code) return;
  const events = loadAffiliationEvents();
  const event = { type: type || 'conversion', code: String(code).trim().toUpperCase(), amount: amount || 0, email: email || null, ts: new Date().toISOString() };
  if (fraud) event.fraud = fraud;
  events.push(event);
  saveAffiliationEvents(events);
}

app.get('/api/v1/affiliation/stats', (req, res) => {
  try {
    const code = req.query.code ? String(req.query.code).trim().toUpperCase() : null;
    const all = loadAffiliationEvents();
    const events = code ? all.filter(e => e.code === code) : all;
    const clicks = events.filter(e => e.type === 'click').length;
    const signups = events.filter(e => e.type === 'signup').length;
    const payments = events.filter(e => e.type === 'payment');
    const totalRevenue = payments.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    let topAffiliates = [];
    if (!code) {
      const byCode = {};
      for (const e of all) {
        if (!byCode[e.code]) byCode[e.code] = { code: e.code, clicks: 0, signups: 0, revenue: 0 };
        if (e.type === 'click') byCode[e.code].clicks++;
        if (e.type === 'signup') byCode[e.code].signups++;
        if (e.type === 'payment') byCode[e.code].revenue += Number(e.amount) || 0;
      }
      topAffiliates = Object.values(byCode).map(a => ({ ...a, commission: a.revenue * 0.30 }))
        .sort((a, b) => b.revenue - a.revenue || b.signups - a.signups || b.clicks - a.clicks).slice(0, 20);
    }
    return res.json({
      code, clicks, signups, payments: payments.length,
      conversion_rate: clicks > 0 ? Number((signups / clicks * 100).toFixed(1)) : 0,
      total_revenue: Number(totalRevenue.toFixed(2)),
      commission_owed: Number((totalRevenue * 0.30).toFixed(2)),
      top_affiliates: topAffiliates,
    });
  } catch (e) { return res.status(500).json({ error: 'internal error' }); }
});

// ─── Email Digest Hebdomadaire ───────────────────────────────────────────────
function buildDigestHtml(stats) {
  const fmt = (n) => Number(n || 0).toLocaleString('fr-FR');
  const topPromos = (stats.top_promos || []).slice(0, 3);
  const topAffs = (stats.top_affiliates || []).slice(0, 3);
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#0A0E1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0;"><table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0A0E1A;padding:32px 16px;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;background:linear-gradient(140deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%);border-radius:24px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;"><tr><td style="padding:32px 32px 16px;text-align:center;background:linear-gradient(180deg,rgba(16,185,129,0.15) 0%,rgba(16,185,129,0) 100%);"><div style="display:inline-block;width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#10b981,#06b6d4);text-align:center;line-height:56px;font-size:24px;margin-bottom:12px;box-shadow:0 0 28px rgba(16,185,129,0.5);">📊</div><h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff;">Rapport hebdo CryptoIA</h1><p style="margin:8px 0 0;color:#10b981;font-size:13px;font-weight:600;">7 derniers jours · ${new Date().toLocaleDateString('fr-FR')}</p></td></tr><tr><td style="padding:24px 32px;"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td width="48%" style="padding:16px;border-radius:14px;border:1px solid rgba(245,158,11,0.25);background:rgba(245,158,11,0.06);text-align:center;"><p style="margin:0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#fbbf24;">Popups affichées</p><p style="margin:6px 0 0;font-size:28px;font-weight:900;color:#fde047;">${fmt(stats.counts?.popup_shown)}</p><p style="margin:2px 0 0;font-size:11px;color:#94a3b8;">${stats.conversions?.popup?.rate || 0}% conversion CTA</p></td><td width="4%"></td><td width="48%" style="padding:16px;border-radius:14px;border:1px solid rgba(217,70,239,0.25);background:rgba(217,70,239,0.06);text-align:center;"><p style="margin:0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#e879f9;">Codes promo appliqués</p><p style="margin:6px 0 0;font-size:28px;font-weight:900;color:#f0abfc;">${fmt(stats.counts?.promo_applied)}</p><p style="margin:2px 0 0;font-size:11px;color:#94a3b8;">${stats.counts?.promo_invalid || 0} invalides</p></td></tr><tr><td height="12"></td></tr><tr><td style="padding:16px;border-radius:14px;border:1px solid rgba(16,185,129,0.25);background:rgba(16,185,129,0.06);text-align:center;"><p style="margin:0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#34d399;">Codes affiliés générés</p><p style="margin:6px 0 0;font-size:28px;font-weight:900;color:#6ee7b7;">${fmt(stats.counts?.affiliate_generated)}</p></td><td width="4%"></td><td style="padding:16px;border-radius:14px;border:1px solid rgba(34,211,238,0.25);background:rgba(34,211,238,0.06);text-align:center;"><p style="margin:0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#22d3ee;">Welcome emails</p><p style="margin:6px 0 0;font-size:28px;font-weight:900;color:#67e8f9;">${fmt(stats.counts?.email_welcome_sent)}</p><p style="margin:2px 0 0;font-size:11px;color:#94a3b8;">${stats.counts?.email_welcome_failed || 0} échecs</p></td></tr></table>${topPromos.length > 0 ? `<h2 style="margin:28px 0 12px;font-size:14px;color:#cbd5e1;text-transform:uppercase;letter-spacing:1px;">🏆 Top codes promo</h2>${topPromos.map((p, i) => `<div style="padding:10px 12px;border-radius:8px;background:rgba(255,255,255,0.03);margin-bottom:6px;"><span style="color:#94a3b8;margin-right:8px;">#${i+1}</span><strong style="color:#f0abfc;font-family:monospace;">${p.code}</strong><span style="float:right;color:#ffffff;font-weight:700;">${p.count} utilisations</span></div>`).join('')}` : ''}${topAffs.length > 0 ? `<h2 style="margin:28px 0 12px;font-size:14px;color:#cbd5e1;text-transform:uppercase;letter-spacing:1px;">🤝 Top affiliés</h2>${topAffs.map((a, i) => `<div style="padding:10px 12px;border-radius:8px;background:rgba(255,255,255,0.03);margin-bottom:6px;"><span style="color:#94a3b8;margin-right:8px;">#${i+1}</span><strong style="color:#6ee7b7;font-family:monospace;">${a.code}</strong><span style="float:right;color:#ffffff;font-weight:700;">${a.count} codes générés</span></div>`).join('')}` : ''}<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;"><tr><td align="center"><a href="https://www.cryptoia.ca/admin/analytics" style="display:inline-block;padding:12px 28px;border-radius:12px;background:linear-gradient(135deg,#10b981 0%,#06b6d4 100%);color:#ffffff;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;text-decoration:none;">📊 Voir le dashboard complet</a></td></tr></table></td></tr><tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;"><p style="margin:0;font-size:10px;color:#475569;">CryptoIA · Rapport automatique chaque lundi à 9h.</p></td></tr></table></td></tr></table></body></html>`;
}

async function sendDigestEmail(testMode = false) {
  try {
    const client = await getResendClient();
    if (!client) return { sent: false, error: 'Resend not configured' };
    const now = Date.now();
    const cutoff = now - 7 * 24 * 60 * 60 * 1000;
    const all = loadAnalyticsEvents();
    const events = all.filter(e => new Date(e.ts).getTime() >= cutoff);
    const counts = {};
    for (const e of events) counts[e.event] = (counts[e.event] || 0) + 1;
    const promos = {}; const affiliates = {};
    for (const e of events.filter(e => e.event === 'promo_applied')) { const c = e.meta?.code || 'UNKNOWN'; promos[c] = (promos[c] || 0) + 1; }
    for (const e of events.filter(e => e.event === 'affiliate_generated')) { const c = e.meta?.code || 'UNKNOWN'; affiliates[c] = (affiliates[c] || 0) + 1; }
    const topPromos = Object.entries(promos).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const topAffiliates = Object.entries(affiliates).map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const popupShown = counts.popup_shown || 0; const popupCta = counts.popup_cta_click || 0;
    const conversions = { popup: { rate: popupShown > 0 ? Number((popupCta / popupShown * 100).toFixed(1)) : 0 } };
    const stats = { counts, top_promos: topPromos, top_affiliates: topAffiliates, conversions };
    const html = buildDigestHtml(stats);
    const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
    const recipient = process.env.ADMIN_EMAIL || 'cryptoia2026@gmail.com';
    const result = await client.emails.send({
      from: sender, to: [recipient],
      subject: `📊 ${testMode ? '[TEST] ' : ''}Rapport hebdo CryptoIA — ${new Date().toLocaleDateString('fr-FR')}`,
      html,
    });
    if (result?.error) return { sent: false, error: result.error?.message || 'unknown' };
    console.log(`[Digest] Sent to ${recipient} (id=${result?.data?.id})`);
    return { sent: true, email_id: result?.data?.id, recipient };
  } catch (e) {
    console.error('[Digest] Exception:', e?.message);
    return { sent: false, error: e?.message || 'exception' };
  }
}

app.post('/api/v1/email/digest', async (req, res) => {
  const result = await sendDigestEmail(true);
  if (result.sent) return res.json({ status: 'success', ...result });
  return res.status(500).json({ status: 'error', ...result });
});

function scheduleDigest() {
  const checkInterval = 60 * 60 * 1000;
  const lastSentKey = path.join(__dirname, 'data', '.last_digest');
  setInterval(() => {
    try {
      const now = new Date();
      if (now.getUTCDay() !== 1 || now.getUTCHours() !== 13) return;
      const today = now.toISOString().slice(0, 10);
      let lastSent = '';
      try { lastSent = fs.readFileSync(lastSentKey, 'utf-8').trim(); } catch { /* */ }
      if (lastSent === today) return;
      fs.mkdirSync(path.dirname(lastSentKey), { recursive: true });
      fs.writeFileSync(lastSentKey, today);
      sendDigestEmail(false).catch(e => console.error('[Digest] scheduled error:', e?.message));
    } catch (e) { console.error('[Digest] scheduler error:', e?.message); }
  }, checkInterval);
  console.log('[Digest] Scheduler enabled (Monday 13h UTC = 9h EST)');
}

// ─── Resend Webhook ─────────────────────────────────────────────────────────
// Moved to routes/resend_webhook.js — registered below in the modular section.
// (The old inline handler was replaced for proper Svix signature verification
//  + per-step open/click tracking that enriches onboarding_events.json.)

// ═══════════════════════════════════════════════════════════════════════════════
// MODULAR ROUTES (extracted in Session 15 refactor — see ./routes/)
// MUST be registered BEFORE the SPA catch-all below.
// ═══════════════════════════════════════════════════════════════════════════════
registerPushRoutes(app);
registerBlogRoutes(app);
registerGamificationRoutes(app);
registerLeadMagnetRoutes(app, { resendClientGetter: getResendClient });
registerQuizRoutes(app, { resendClientGetter: getResendClient });
registerQuizOgRoutes(app);
registerQuizSharesRoutes(app);
registerChallengeRoutes(app, { resendClientGetter: getResendClient });
registerPlanGrantsRoutes(app);
registerTerminalLayoutRoutes(app);
registerEconomicCalendarRoutes(app);
registerEmailSequenceRoutes(app, { resendClientGetter: getResendClient });
registerPublicStatsRoutes(app);
registerSuccessStoriesRoutes(app);
registerDailyDigestRoutes(app, { resendClientGetter: getResendClient });
registerIndexNowRoutes(app);
registerSentryWebhookRoutes(app, { sendTelegram: sendTelegramMessage });
// Initialize checkout recovery first — registerPaymentWebhookRoutes depends on its helpers
const checkoutRecovery = registerCheckoutRecoveryRoutes(app, {
  getResendClient,
  sendChatNotification,
});
const winBack = registerWinBackRoutes(app, {
  getResendClient,
  sendChatNotification,
});

registerPaymentWebhookRoutes(app, {
  getStripeInstance,
  sendChatNotification,
  recordAffiliationConversion,
  getResendClient,
  STRIPE_SECRET_KEY,
  checkoutRecovery,
  winBack,
  // Wire referral conversion handler — resolved lazily because referralModule
  // is initialized just below this call. Safe because Stripe webhooks only
  // fire after server startup is complete.
  getReferralHandler: () => referralModule?.handleReferralConversion || null,
});
registerAdminHealthRoutes(app, {
  getStripeInstance,
  getResendClient,
  STRIPE_SECRET_KEY,
  TELEGRAM_BOT_TOKEN,
});

// ─── Referral Program (Mon Parrainage) ──────────────────────────────────────
// Generates a unique referral code per user, applies -20% Stripe coupon to
// filleul on first invoice, credits +1 free month to parrain on confirmed
// payment (with anti-fraud: same email/card fingerprint = rejected).
referralModule = registerReferralRoutes(app, {
  loadUsers,
  saveUsers,
  getStripeInstance,
  recordAffiliationConversion,
  loadAffiliationEvents,
  getResendClient,
  sendChatNotification,
});

// ─── Twitter Bot (Daily Auto-Post) ──────────────────────────────────────────
// Posts 1 tweet/day at 10:00 America/Toronto, alternating blog vs marketing kit.
// Requires TWITTER_API_KEY / TWITTER_API_SECRET / TWITTER_ACCESS_TOKEN / TWITTER_ACCESS_SECRET.
// Without keys, scheduler runs but `postTweet` returns `twitter_keys_missing` (no crash).
{
  const BLOG_FILE_PATH = path.join(__dirname, 'data', 'blog.json');
  const loadBlogForTwitter = () => {
    try {
      if (fs.existsSync(BLOG_FILE_PATH)) return JSON.parse(fs.readFileSync(BLOG_FILE_PATH, 'utf8'));
    } catch (e) { console.error('[Twitter] loadBlog error:', e?.message); }
    return { articles: [] };
  };
  // Admin guard (reuse existing pattern — basic admin header check)
  const requireAdmin = (req, res, next) => {
    const adminAuth = req.headers['x-admin-auth'] || req.query.admin_auth;
    const expected = process.env.ADMIN_API_KEY || 'admin123';
    if (adminAuth === expected) return next();
    return res.status(401).json({ error: 'unauthorized' });
  };
  registerTwitterBotRoutes(app, { loadBlog: loadBlogForTwitter, requireAdmin, getResendClient });

  // ─── Onboarding Email Sequence (J+1 welcome / J+3 case study / J+7 promo) ─
  registerOnboardingRoutes(app, { loadUsers, getResendClient, requireAdmin });

  // ─── Resend Webhook (delivered / opened / clicked / bounced / complained) ─
  registerResendWebhookRoutes(app, { requireAdmin });

  // ─── Promo Codes (centralized backend storage, auto-seeds WELCOME20/FLASH30) ─
  registerPromoRoutes(app, { requireAdmin });
  registerIndicatorAccessRoutes(app, { requireAdmin, dataDir: DATA_DIR, getResendClient });

  // ─── Blog auto-publish cron (1 article/day via GPT-5.4 + IndexNow + newsletter) ─
  registerBlogCronRoutes(app, {
    requireAdmin,
    getNewsletterNotifier: () => blogNewsletter.notifySubscribers,
  });

  // ─── i18n Helper (LLM-powered FR→EN translation tool for migration) ─
  registerI18nHelperRoutes(app, { requireAdmin });

  // ─── Email Health (deliverability reputation report) ─
  registerEmailHealthRoutes(app, { requireAdmin });

  // ─── SEO content pages (Glossary, Comparisons, Per-coin pages) ─
  registerGlossaryRoutes(app, { requireAdmin });
  registerCompareRoutes(app, { requireAdmin });
  registerCoinRoutes(app, { requireAdmin });

  // ─── Daily Crypto Brief (8h EST email digest) ─
  registerDailyBriefRoutes(app, { requireAdmin, loadUsers, getResendClient });
}

// Backfill referral codes for any existing users that don't have one yet
(() => {
  try {
    const us = loadUsers();
    let changed = 0;
    for (const u of us) {
      if (!u.referralCode) {
        ensureUserReferralCode(u, us);
        changed++;
      }
      if (typeof u.freeMonthsCredit !== 'number') {
        u.freeMonthsCredit = 0;
        changed++;
      }
    }
    if (changed > 0) {
      saveUsers(us);
      console.log(`[Referral] Backfilled ${changed} user record(s) with referralCode/freeMonthsCredit`);
    }
  } catch (e) {
    console.error('[Referral] Backfill error:', e?.message);
  }
})();

// Blog newsletter: register routes and wire up auto-notify on publish
const blogNewsletter = registerBlogNewsletterRoutes(app, { getResendClient });
setBlogNewsletterNotifier(blogNewsletter.notifySubscribers);

// ═══════════════════════════════════════════════════════════════════════════════
// Bing Webmaster Tools verification — guarantee meta tag is in dist/index.html
// (runs at startup, idempotent, survives any rebuild that might omit it)
// ═══════════════════════════════════════════════════════════════════════════════
try {
  const distIndexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(distIndexPath)) {
    let html = fs.readFileSync(distIndexPath, 'utf8');
    const BING_TAG = '<meta name="msvalidate.01" content="D3186790C6FC91995640B712EEECD124" />';
    if (!html.includes('msvalidate.01')) {
      html = html.replace('</head>', `    ${BING_TAG}\n  </head>`);
      fs.writeFileSync(distIndexPath, html);
      console.log('[BingVerify] Injected msvalidate.01 meta tag into dist/index.html');
    } else {
      console.log('[BingVerify] msvalidate.01 already present in dist/index.html');
    }
  }
} catch (e) {
  console.error('[BingVerify] Failed to inject meta tag:', e?.message);
}

// Serve static files from dist
// SECURITY: block public access to source maps (.map files)
// Even when Sentry plugin should delete them, we belt-and-braces this.
app.get(/\.map(\.gz)?$/, (req, res) => {
  res.status(404).type('text/plain').send('Not Found');
});

app.use(express.static(path.join(__dirname, 'dist')));

// Serve auto-generated blog cover images from persistent data volume.
// These are PNG covers produced by routes/blog_cron.js (GPT-Image-1) and
// they MUST survive container restarts — that's why they live under data/.
app.use('/blog-covers', express.static(path.join(__dirname, 'data', 'blog-covers'), {
  maxAge: '7d', immutable: true,
}));

// SPA fallback — also with no-cache headers
//
// Quiz viral OG meta injection: when a social-media crawler (Twitter, Facebook,
// LinkedIn, WhatsApp, Telegram, Discord) hits /quiz?profile=<key>, we need to
// serve the dist/index.html with per-profile <meta property="og:image"> set
// to the dynamic PNG endpoint. Crawlers don't execute JS, so React Helmet
// runtime overrides are invisible to them.
const QUIZ_OG_PROFILES = {
  hodler:   { name: 'Le HODLer Patient',          tagline: 'Long terme · Sang-froid · Patience' },
  scalper:  { name: 'Le Scalpeur Adrénaline',     tagline: 'Trades rapides · Réactivité · Précision' },
  swing:    { name: 'Le Swing Trader Stratégique', tagline: 'Stratégie · Patience · Setups premium' },
  longterm: { name: "L'Investisseur Visionnaire", tagline: 'Pépites · Vision · x100 hunter' },
};
function escapeAttr(s = '') {
  return String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
}
app.get('/quiz', (req, res, next) => {
  try {
    const key = String(req.query.profile || '').toLowerCase();
    // Object.hasOwn guard prevents prototype-chain keys (__proto__, constructor, etc.)
    // from bypassing the whitelist and emitting broken meta tags.
    const meta = Object.hasOwn(QUIZ_OG_PROFILES, key) ? QUIZ_OG_PROFILES[key] : null;
    if (!meta) return next();
    const distIndex = path.join(__dirname, 'dist', 'index.html');
    if (!fs.existsSync(distIndex)) return next();
    let html = fs.readFileSync(distIndex, 'utf8');
    const ogUrl = `https://www.cryptoia.ca/quiz?profile=${key}`;
    const ogImage = `https://www.cryptoia.ca/api/v1/quiz/og/${key}.png`;
    const ogTitle = `${meta.name} · Quel trader es-tu ? | CryptoIA`;
    const ogDesc = `${meta.tagline} — Découvre ton profil de trader crypto en 2 min (gratuit).`;
    const replacements = [
      [/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeAttr(ogTitle)}" />`],
      [/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeAttr(ogDesc)}" />`],
      [/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${escapeAttr(ogImage)}" />`],
      [/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${escapeAttr(ogUrl)}" />`],
      [/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeAttr(ogTitle)}" />`],
      [/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeAttr(ogDesc)}" />`],
      [/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${escapeAttr(ogImage)}" />`],
      [/<title>[^<]*<\/title>/i, `<title>${escapeAttr(ogTitle)}</title>`],
      [/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeAttr(ogDesc)}" />`],
    ];
    for (const [re, replacement] of replacements) {
      if (re.test(html)) html = html.replace(re, replacement);
    }
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.type('html').send(html);
  } catch (e) {
    console.error('[QuizOG-SSR] Error injecting meta tags:', e?.message);
    next();
  }
});

// SEO SSR — /magic-strategy (page Indicateurs) : injecte title/description/OG côté serveur
// pour les crawlers (Google, Discord, Twitter) qui n'exécutent pas React Helmet.
app.get('/magic-strategy', (req, res, next) => {
  try {
    const distIndex = path.join(__dirname, 'dist', 'index.html');
    if (!fs.existsSync(distIndex)) return next();
    let html = fs.readFileSync(distIndex, 'utf8');
    const ogUrl = 'https://www.cryptoia.ca/magic-strategy';
    const ogImage = 'https://www.cryptoia.ca/indicators/cryptoiaedge-1.png';
    const ogTitle = '9 Indicateurs TradingView Crypto Exclusifs — Signaux, S/R, Divergences & Cycles | CryptoIA';
    const ogDesc = "Suite de 9 indicateurs TradingView pour la crypto : signaux LONG/SHORT automatiques, supports/résistances IA, divergences, cycles Bitcoin, DCA et gestion du risque. Dès 49$/mois.";
    const replacements = [
      [/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeAttr(ogTitle)}" />`],
      [/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeAttr(ogDesc)}" />`],
      [/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${escapeAttr(ogImage)}" />`],
      [/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${escapeAttr(ogUrl)}" />`],
      [/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeAttr(ogTitle)}" />`],
      [/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeAttr(ogDesc)}" />`],
      [/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${escapeAttr(ogImage)}" />`],
      [/<title>[^<]*<\/title>/i, `<title>${escapeAttr(ogTitle)}</title>`],
      [/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeAttr(ogDesc)}" />`],
      [/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeAttr(ogUrl)}" />`],
    ];
    for (const [re, replacement] of replacements) {
      if (re.test(html)) html = html.replace(re, replacement);
    }
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.type('html').send(html);
  } catch (e) {
    console.error('[IndicatorsSEO-SSR] Error injecting meta tags:', e?.message);
    next();
  }
});

// SEO SSR — /performance (page publique Performance des Signaux)
app.get('/performance', (req, res, next) => {
  try {
    const distIndex = path.join(__dirname, 'dist', 'index.html');
    if (!fs.existsSync(distIndex)) return next();
    let html = fs.readFileSync(distIndex, 'utf8');
    const ogUrl = 'https://www.cryptoia.ca/performance';
    const ogTitle = 'Performance de nos Signaux Crypto — Résultats Réels & Vérifiables | CryptoIA';
    const ogDesc = 'Transparence totale : chaque signal de trading CryptoIA est tracké automatiquement. Winrate réel, taux TP1/TP2/TP3, performance par niveau de confiance IA et historique complet.';
    const replacements = [
      [/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeAttr(ogTitle)}" />`],
      [/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeAttr(ogDesc)}" />`],
      [/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${escapeAttr(ogUrl)}" />`],
      [/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeAttr(ogTitle)}" />`],
      [/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeAttr(ogDesc)}" />`],
      [/<title>[^<]*<\/title>/i, `<title>${escapeAttr(ogTitle)}</title>`],
      [/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeAttr(ogDesc)}" />`],
      [/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeAttr(ogUrl)}" />`],
    ];
    for (const [re, replacement] of replacements) {
      if (re.test(html)) html = html.replace(re, replacement);
    }
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.type('html').send(html);
  } catch (e) {
    console.error('[PerformanceSEO-SSR] Error injecting meta tags:', e?.message);
    next();
  }
});

app.get('{*path}', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// Sentry — error handler must be registered AFTER all routes/middlewares
// instrument.mjs is loaded via --import flag BEFORE this file runs
// ═══════════════════════════════════════════════════════════════════════════════
try {
  const Sentry = await import('@sentry/node');
  Sentry.setupExpressErrorHandler(app);
  console.log('[Sentry] ✅ Express error handler registered');
} catch (e) {
  console.log('[Sentry] ⏭️ @sentry/node not loaded:', e?.message);
}

// Global error handlers — log without crashing
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception (continuing):', err?.stack || err?.message || err);
  try { import('@sentry/node').then(S => S.captureException(err)); } catch {}
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection (continuing):', reason);
  try { import('@sentry/node').then(S => S.captureException(reason)); } catch {}
});
// CRITICAL: bind to 0.0.0.0 explicitly for Railway/Docker (otherwise IPv6-only on some setups)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} (bound to 0.0.0.0)`);

  // Start background alert checkers AFTER server is listening — so healthcheck on / always responds
  // Any errors here won't prevent the server from being healthy
  setImmediate(() => {
    try { gamiSeed(); } catch (e) { console.error('[Boot] gamiSeed error:', e?.message); }
    try { startAlertChecker(); } catch (e) { console.error('[Boot] startAlertChecker error:', e?.message); }
    try { startScalpAlertChecker(); } catch (e) { console.error('[Boot] startScalpAlertChecker error:', e?.message); }
    try { startRangeAlertChecker(); } catch (e) { console.error('[Boot] startRangeAlertChecker error:', e?.message); }
    try { scheduleDigest(); } catch (e) { console.error('[Boot] scheduleDigest error:', e?.message); }
  });
});