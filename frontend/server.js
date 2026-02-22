// Simple Express server for production that proxies API calls
// This keeps API keys server-side and avoids CORS issues
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';

// ─── CoinGecko response cache (in-memory, 60s TTL) ───
const cgCache = new Map(); // key → { data, status, timestamp }
const CG_CACHE_TTL = 60_000; // 60 seconds

// Parse JSON bodies
app.use(express.json({ limit: '1mb' }));

// CORS middleware — allow all origins (needed for Railway deployment)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
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

// ============================================================
// User Management — JSON file persistence
// ============================================================
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

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

// ─── POST /api/users/login ───
app.post('/api/users/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Nom d\'utilisateur et mot de passe requis.' });
  }

  const users = loadUsers();
  const hash = hashPwd(password.trim());
  const user = users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.passwordHash === hash
  );

  if (!user) {
    return res.json({ success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
  }

  // Return user info (without passwordHash)
  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// ─── POST /api/users/create ───
app.post('/api/users/create', (req, res) => {
  const { username, password, role, plan } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, message: 'Nom d\'utilisateur requis.' });
  }

  const users = loadUsers();
  if (users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
    return res.json({ success: false, message: 'Utilisateur déjà existant.' });
  }

  const tempPwd = password || Math.random().toString(36).slice(-8);
  const now = new Date();
  const newUser = {
    username: username.trim(),
    passwordHash: hashPwd(tempPwd),
    role: role || 'user',
    plan: plan || 'free',
    created_at: now.toISOString().split('T')[0],
  };

  if (newUser.plan !== 'free') {
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    newUser.subscription_end = end.toISOString().split('T')[0];
  }

  users.push(newUser);
  saveUsers(users);

  res.json({ success: true, temp_password: tempPwd });
});

// ─── POST /api/users/reset-password ───
app.post('/api/users/reset-password', (req, res) => {
  const { username, newPassword } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, message: 'Nom d\'utilisateur requis.' });
  }

  const users = loadUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user) {
    return res.json({ success: false, message: 'Utilisateur introuvable.' });
  }

  const tempPwd = newPassword || Math.random().toString(36).slice(-8);
  user.passwordHash = hashPwd(tempPwd);
  saveUsers(users);

  res.json({ success: true, temp_password: tempPwd });
});

// ─── GET /api/users ───
app.get('/api/users', (req, res) => {
  const users = loadUsers();
  // Return users without passwordHash
  const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
  res.json({ users: safeUsers });
});

// ─── DELETE /api/users/:username ───
app.delete('/api/users/:username', (req, res) => {
  const { username } = req.params;
  const users = loadUsers();
  const filtered = users.filter((u) => u.username.toLowerCase() !== username.toLowerCase());
  if (filtered.length === users.length) {
    return res.json({ success: false, message: 'Utilisateur introuvable.' });
  }
  saveUsers(filtered);
  res.json({ success: true });
});

// ─── PUT /api/users/:username/plan ───
app.put('/api/users/:username/plan', (req, res) => {
  const { username } = req.params;
  const { plan } = req.body;
  if (!plan) {
    return res.status(400).json({ success: false, message: 'Plan requis.' });
  }

  const users = loadUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.json({ success: false, message: 'Utilisateur introuvable.' });
  }

  user.plan = plan;
  if (plan !== 'free') {
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    user.subscription_end = end.toISOString().split('T')[0];
  } else {
    delete user.subscription_end;
  }

  saveUsers(users);
  res.json({ success: true, subscription_end: user.subscription_end });
});

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

// ─── CoinGecko API proxy (with in-memory cache to avoid 429 rate limits) ───
// Proxies /api/coingecko/* to https://api.coingecko.com/api/v3/*
app.get('/api/coingecko/{*path}', async (req, res) => {
  const targetPath = req.url.replace('/api/coingecko', '');
  const cacheKey = targetPath;
  const now = Date.now();

  // Return cached response if still fresh
  const cached = cgCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CG_CACHE_TTL) {
    return res.status(cached.status).set('Content-Type', 'application/json').send(cached.data);
  }

  const targetUrl = `https://api.coingecko.com/api/v3${targetPath}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    const data = await upstreamRes.text();
    const status = upstreamRes.status;

    // Cache successful responses
    if (status === 200) {
      cgCache.set(cacheKey, { data, status, timestamp: now });
    } else if (status === 429 && cached) {
      // On rate limit, serve stale cache if available
      return res.status(200).set('Content-Type', 'application/json').send(cached.data);
    }

    res.status(status).set('Content-Type', 'application/json').send(data);
  } catch (err) {
    console.error('CoinGecko proxy error:', err);
    // Serve stale cache on network error if available
    if (cached) {
      return res.status(200).set('Content-Type', 'application/json').send(cached.data);
    }
    res.status(502).json({ error: 'CoinGecko proxy failed', message: err?.message });
  }
});

// ─── Binance Klines API proxy ───
app.get('/api/binance/klines', async (req, res) => {
  const { symbol, interval, limit } = req.query;
  const targetUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval || '1h'}&limit=${limit || '168'}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'User-Agent': 'CryptoIA/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    const data = await upstreamRes.text();
    res.status(upstreamRes.status)
      .set('Content-Type', 'application/json')
      .send(data);
  } catch (err) {
    console.error('Binance proxy error:', err);
    res.status(502).json({ error: 'Binance proxy failed', message: err?.message });
  }
});

// ============================================================
// Telegram Bot API
// ============================================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8478131465:AAEh7Z0rvIqSNvn1wKdtkMNb-O96h41LCns';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002940633257';

// In-memory alert config (persisted to file)
const TELEGRAM_ALERTS_FILE = path.join(DATA_DIR, 'telegram_alerts.json');

function loadTelegramAlerts() {
  try {
    if (existsSync(TELEGRAM_ALERTS_FILE)) {
      return JSON.parse(readFileSync(TELEGRAM_ALERTS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading telegram alerts:', err);
  }
  return {
    enabled: false,
    checkIntervalMs: 300000, // 5 minutes
    alerts: {
      priceChange: { enabled: true, threshold: 5, coins: [] },
      rsiExtreme: { enabled: true, overbought: 70, oversold: 30, coins: [] },
      volumeSpike: { enabled: true, multiplier: 3, coins: [] },
    },
    lastCheck: null,
    lastAlerts: [],
  };
}

function saveTelegramAlerts(config) {
  try {
    writeFileSync(TELEGRAM_ALERTS_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving telegram alerts:', err);
  }
}

// Send message to Telegram
async function sendTelegramMessage(text, parseMode = 'HTML') {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Telegram send error:', err);
    return { ok: false, description: err.message };
  }
}

// Send logo photo to Telegram after alert message
async function sendTelegramLogo() {
  const FormData = require('form-data');
  const fs = require('fs');
  const logoPath = path.join(__dirname, 'assets', 'logo-telegram.png');
  try {
    if (!fs.existsSync(logoPath)) {
      console.error('[Telegram] Logo file not found:', logoPath);
      return { ok: false, description: 'Logo file not found' };
    }
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('photo', fs.createReadStream(logoPath));
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('[Telegram] Logo send error:', data.description);
    }
    return data;
  } catch (err) {
    console.error('[Telegram] Logo send error:', err);
    return { ok: false, description: err.message };
  }
}

// ─── POST /api/telegram/test — Send test message ───
app.post('/api/telegram/test', async (req, res) => {
  const now = new Date().toLocaleString('fr-CA', { timeZone: 'America/Montreal' });
  const text = `🚀 <b>CryptoIA — Test de connexion</b>

✅ Votre bot Telegram est correctement connecté !
Vous recevrez désormais vos alertes crypto ici.

⏰ ${now} (heure de Montréal)
⚠️ <i>Ceci n'est pas un conseil financier. Faites vos propres recherches (DYOR).</i>`;

  const result = await sendTelegramMessage(text);
  if (result.ok) {
    await sendTelegramLogo();
    res.json({ success: true, message: 'Message test envoyé avec succès !' });
  } else {
    res.json({ success: false, message: result.description || 'Erreur Telegram' });
  }
});

// ─── POST /api/telegram/send — Send custom message ───
app.post('/api/telegram/send', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, message: 'Texte requis' });
  }
  const result = await sendTelegramMessage(text);
  if (result.ok) {
    await sendTelegramLogo();
    res.json({ success: true, message: 'Message envoyé' });
  } else {
    res.json({ success: false, message: result.description || 'Erreur Telegram' });
  }
});

// ─── GET /api/telegram/config — Get alert config ───
app.get('/api/telegram/config', (req, res) => {
  const config = loadTelegramAlerts();
  res.json({ success: true, config });
});

// ─── POST /api/telegram/config — Update alert config ───
app.post('/api/telegram/config', (req, res) => {
  const { config } = req.body;
  if (!config) {
    return res.status(400).json({ success: false, message: 'Config requise' });
  }
  saveTelegramAlerts(config);
  res.json({ success: true, message: 'Configuration sauvegardée' });
});

// ─── POST /api/telegram/check-now — Force check alerts now ───
app.post('/api/telegram/check-now', async (req, res) => {
  try {
    const alerts = await checkAndSendAlerts();
    res.json({ success: true, alertsSent: alerts.length, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Helper: format large numbers for display ───
function formatNumber(num) {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

// ─── Helper: format price with appropriate decimals ───
function formatPrice(price) {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

// ─── Cooldown system — 1 hour per coin per alert type ───
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour in ms

function loadCooldowns() {
  const config = loadTelegramAlerts();
  return config.cooldowns || {};
}

function saveCooldowns(cooldowns) {
  const config = loadTelegramAlerts();
  config.cooldowns = cooldowns;
  saveTelegramAlerts(config);
}

function isCooldownActive(cooldowns, coinId, alertType) {
  const key = `${coinId}_${alertType}`;
  const lastSent = cooldowns[key];
  if (!lastSent) return false;
  const elapsed = Date.now() - new Date(lastSent).getTime();
  return elapsed < COOLDOWN_MS;
}

function setCooldown(cooldowns, coinId, alertType) {
  const key = `${coinId}_${alertType}`;
  cooldowns[key] = new Date().toISOString();
}

// ═══════════════════════════════════════════════════════════════════════════════
// TECHNICAL INDICATOR HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Compute RSI(14) from an array of close prices. Returns NaN if not enough data. */
function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return NaN;
  const gains = [];
  const losses = [];
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  if (gains.length < period) return NaN;
  let avgGain = gains.slice(0, period).reduce((s, v) => s + v, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/** Compute EMA for an array of values */
function calcEMA(values, period) {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const ema = [values.slice(0, period).reduce((s, v) => s + v, 0) / period];
  for (let i = period; i < values.length; i++) {
    ema.push(values[i] * k + ema[ema.length - 1] * (1 - k));
  }
  return ema;
}

/** Compute SMA for an array of values */
function calcSMA(values, period) {
  if (values.length < period) return [];
  const sma = [];
  for (let i = period - 1; i < values.length; i++) {
    sma.push(values.slice(i - period + 1, i + 1).reduce((s, v) => s + v, 0) / period);
  }
  return sma;
}

/**
 * Compute MACD(12, 26, 9).
 * Returns { macdLine, signalLine, histogram } — each is the latest value.
 */
function calcMACD(closes) {
  if (closes.length < 35) return null; // need at least 26 + 9 data points
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  // Align: ema12 starts at index 12, ema26 starts at index 26 → offset = 14
  const offset = 26 - 12; // 14
  const macdLine = [];
  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i]);
  }
  if (macdLine.length < 9) return null;
  const signalLine = calcEMA(macdLine, 9);
  const macdLatest = macdLine[macdLine.length - 1];
  const signalLatest = signalLine[signalLine.length - 1];
  const histogram = macdLatest - signalLatest;
  // Previous values for crossover detection
  const macdPrev = macdLine.length >= 2 ? macdLine[macdLine.length - 2] : macdLatest;
  const signalPrev = signalLine.length >= 2 ? signalLine[signalLine.length - 2] : signalLatest;
  const bullishCross = macdPrev <= signalPrev && macdLatest > signalLatest;
  const bearishCross = macdPrev >= signalPrev && macdLatest < signalLatest;
  return { macdLine: macdLatest, signalLine: signalLatest, histogram, bullishCross, bearishCross };
}

/**
 * Compute Stochastic(14, 3, 3).
 * Returns { k, d } — the smoothed %K and %D latest values.
 */
function calcStochastic(highs, lows, closes, kPeriod = 14, kSmooth = 3, dSmooth = 3) {
  if (closes.length < kPeriod + kSmooth + dSmooth) return null;
  // Raw %K values
  const rawK = [];
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const highSlice = highs.slice(i - kPeriod + 1, i + 1);
    const lowSlice = lows.slice(i - kPeriod + 1, i + 1);
    const highMax = Math.max(...highSlice);
    const lowMin = Math.min(...lowSlice);
    const range = highMax - lowMin;
    rawK.push(range === 0 ? 50 : ((closes[i] - lowMin) / range) * 100);
  }
  // Smoothed %K = SMA(rawK, kSmooth)
  const smoothedK = calcSMA(rawK, kSmooth);
  // %D = SMA(smoothedK, dSmooth)
  const dLine = calcSMA(smoothedK, dSmooth);
  if (smoothedK.length === 0 || dLine.length === 0) return null;
  return { k: smoothedK[smoothedK.length - 1], d: dLine[dLine.length - 1] };
}

/**
 * Fetch Binance klines for a given symbol and interval.
 * Returns { closes, highs, lows, volumes } arrays.
 */
async function fetchBinanceKlines(symbol, interval, limit) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Binance ${res.status}`);
  const klines = await res.json();
  return {
    closes: klines.map(k => parseFloat(k[4])),
    highs: klines.map(k => parseFloat(k[2])),
    lows: klines.map(k => parseFloat(k[3])),
    opens: klines.map(k => parseFloat(k[1])),
    volumes: klines.map(k => parseFloat(k[5])),
  };
}

/**
 * Analyze one timeframe: compute RSI, MACD, Stochastic.
 * Returns { rsi, macd, stoch, bullish, bearish } where bullish/bearish
 * count how many of the 3 indicators agree on that direction.
 */
function analyzeTimeframe(closes, highs, lows) {
  const rsi = calcRSI(closes);
  const macd = calcMACD(closes);
  const stoch = calcStochastic(highs, lows, closes);

  let bullishCount = 0;
  let bearishCount = 0;

  // RSI scoring
  if (!isNaN(rsi)) {
    if (rsi < 35) bullishCount++;
    if (rsi > 65) bearishCount++;
  }

  // MACD scoring
  if (macd) {
    if (macd.histogram > 0 || macd.bullishCross) bullishCount++;
    if (macd.histogram < 0 || macd.bearishCross) bearishCount++;
  }

  // Stochastic scoring
  if (stoch) {
    if (stoch.k > stoch.d && stoch.k < 30) bullishCount++;
    if (stoch.k < stoch.d && stoch.k > 70) bearishCount++;
  }

  return { rsi, macd, stoch, bullishCount, bearishCount };
}

/**
 * Find swing highs and swing lows from klines (for support/resistance).
 * A swing high: high[i] > high of 3 candles before AND after.
 * A swing low: low[i] < low of 3 candles before AND after.
 */
function findSupportResistance(highs, lows, lookback = 3) {
  const resistances = [];
  const supports = [];

  for (let i = lookback; i < highs.length - lookback; i++) {
    let isSwingHigh = true;
    let isSwingLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (highs[i] <= highs[i - j] || highs[i] <= highs[i + j]) isSwingHigh = false;
      if (lows[i] >= lows[i - j] || lows[i] >= lows[i + j]) isSwingLow = false;
    }
    if (isSwingHigh) resistances.push(highs[i]);
    if (isSwingLow) supports.push(lows[i]);
  }

  // Deduplicate close levels (within 0.3% of each other)
  const dedup = (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const result = [];
    for (const val of sorted) {
      if (result.length === 0 || Math.abs(val - result[result.length - 1]) / result[result.length - 1] > 0.003) {
        result.push(val);
      } else {
        // Average with the existing level
        result[result.length - 1] = (result[result.length - 1] + val) / 2;
      }
    }
    return result;
  };

  return {
    supports: dedup(supports),
    resistances: dedup(resistances),
  };
}

/**
 * Calculate trade plan: entry, TP1-3, SL based on supports/resistances.
 */
function calcTradePlan(currentPrice, supports, resistances, direction) {
  if (direction === 'LONG') {
    // SL = first support below entry
    const supportsBelow = supports.filter(s => s < currentPrice).sort((a, b) => b - a);
    const resistancesAbove = resistances.filter(r => r > currentPrice).sort((a, b) => a - b);
    return {
      entry: currentPrice,
      sl: supportsBelow[0] || currentPrice * 0.97,
      tp1: resistancesAbove[0] || currentPrice * 1.02,
      tp2: resistancesAbove[1] || currentPrice * 1.04,
      tp3: resistancesAbove[2] || currentPrice * 1.06,
    };
  } else {
    // SHORT
    const resistancesAbove = resistances.filter(r => r > currentPrice).sort((a, b) => a - b);
    const supportsBelow = supports.filter(s => s < currentPrice).sort((a, b) => b - a);
    return {
      entry: currentPrice,
      sl: resistancesAbove[0] || currentPrice * 1.03,
      tp1: supportsBelow[0] || currentPrice * 0.98,
      tp2: supportsBelow[1] || currentPrice * 0.96,
      tp3: supportsBelow[2] || currentPrice * 0.94,
    };
  }
}

// ─── Alert checking logic — Multi-TF, Multi-Indicator convergence ───
async function checkAndSendAlerts() {
  const config = loadTelegramAlerts();
  if (!config.enabled) return [];

  const sentAlerts = [];
  const now = new Date();
  const nowStr = now.toLocaleString('fr-CA', { timeZone: 'America/Montreal' });
  const cooldowns = loadCooldowns();

  const symbolMap = {
    bitcoin: 'BTCUSDT', ethereum: 'ETHUSDT', solana: 'SOLUSDT',
    cardano: 'ADAUSDT', dogecoin: 'DOGEUSDT', xrp: 'XRPUSDT',
    bnb: 'BNBUSDT', avalanche: 'AVAXUSDT', polkadot: 'DOTUSDT',
    matic: 'MATICUSDT', chainlink: 'LINKUSDT', uniswap: 'UNIUSDT',
    aave: 'AAVEUSDT', litecoin: 'LTCUSDT', 'bitcoin-cash': 'BCHUSDT',
    cosmos: 'ATOMUSDT', near: 'NEARUSDT', aptos: 'APTUSDT',
    sui: 'SUIUSDT', arbitrum: 'ARBUSDT', optimism: 'OPUSDT',
    filecoin: 'FILUSDT', 'internet-computer': 'ICPUSDT', vechain: 'VETUSDT',
    algorand: 'ALGOUSDT', fantom: 'FTMUSDT', 'the-sandbox': 'SANDUSDT',
    decentraland: 'MANAUSDT', 'axie-infinity': 'AXSUSDT', gala: 'GALAUSDT',
    'immutable-x': 'IMXUSDT', 'render-token': 'RENDERUSDT', injective: 'INJUSDT',
    'fetch-ai': 'FETUSDT', theta: 'THETAUSDT', hedera: 'HBARUSDT',
    'elrond-erd-2': 'EGLDUSDT', flow: 'FLOWUSDT', tezos: 'XTZUSDT',
    eos: 'EOSUSDT', neo: 'NEOUSDT', 'quant-network': 'QNTUSDT',
    maker: 'MKRUSDT', synthetix: 'SNXUSDT', compound: 'COMPUSDT',
    'curve-dao-token': 'CRVUSDT', 'lido-dao': 'LDOUSDT',
    'shiba-inu': 'SHIBUSDT', pepe: 'PEPEUSDT', floki: 'FLOKIUSDT',
    dogwifcoin: 'WIFUSDT', bonk: 'BONKUSDT', jupiter: 'JUPUSDT',
    ethena: 'ENAUSDT', stacks: 'STXUSDT', sei: 'SEIUSDT',
    celestia: 'TIAUSDT', pendle: 'PENDLEUSDT', wormhole: 'WUSDT',
    ondo: 'ONDOUSDT', pyth: 'PYTHUSDT', jito: 'JTOUSDT',
    tron: 'TRXUSDT', toncoin: 'TONUSDT', thorchain: 'RUNEUSDT',
    kaspa: 'KASUSDT', ordi: 'ORDIUSDT', 'ethereum-classic': 'ETCUSDT',
    stellar: 'XLMUSDT', 'worldcoin-wld': 'WLDUSDT', 'dydx-chain': 'DYDXUSDT',
    'the-graph': 'GRTUSDT', 'ocean-protocol': 'OCEANUSDT',
    'en-protocol': 'ENUSDT', 'chromia': 'CHRAUSDT',
  };

  const coinNames = {
    bitcoin: 'Bitcoin (BTC)', ethereum: 'Ethereum (ETH)', solana: 'Solana (SOL)',
    cardano: 'Cardano (ADA)', dogecoin: 'Dogecoin (DOGE)', xrp: 'XRP',
    bnb: 'BNB', avalanche: 'Avalanche (AVAX)', polkadot: 'Polkadot (DOT)',
    matic: 'Polygon (MATIC)', chainlink: 'Chainlink (LINK)', uniswap: 'Uniswap (UNI)',
    aave: 'Aave (AAVE)', litecoin: 'Litecoin (LTC)', 'bitcoin-cash': 'Bitcoin Cash (BCH)',
    cosmos: 'Cosmos (ATOM)', near: 'NEAR Protocol (NEAR)', aptos: 'Aptos (APT)',
    sui: 'Sui (SUI)', arbitrum: 'Arbitrum (ARB)', optimism: 'Optimism (OP)',
    filecoin: 'Filecoin (FIL)', 'internet-computer': 'Internet Computer (ICP)', vechain: 'VeChain (VET)',
    algorand: 'Algorand (ALGO)', fantom: 'Fantom (FTM)', 'the-sandbox': 'The Sandbox (SAND)',
    decentraland: 'Decentraland (MANA)', 'axie-infinity': 'Axie Infinity (AXS)', gala: 'GALA',
    'immutable-x': 'Immutable X (IMX)', 'render-token': 'Render (RENDER)', injective: 'Injective (INJ)',
    'fetch-ai': 'Fetch.ai (FET)', theta: 'Theta (THETA)', hedera: 'Hedera (HBAR)',
    'elrond-erd-2': 'MultiversX (EGLD)', flow: 'Flow (FLOW)', tezos: 'Tezos (XTZ)',
    eos: 'EOS', neo: 'NEO', 'quant-network': 'Quant (QNT)',
    maker: 'Maker (MKR)', synthetix: 'Synthetix (SNX)', compound: 'Compound (COMP)',
    'curve-dao-token': 'Curve (CRV)', 'lido-dao': 'Lido DAO (LDO)',
    'shiba-inu': 'Shiba Inu (SHIB)', pepe: 'Pepe (PEPE)', floki: 'Floki (FLOKI)',
    dogwifcoin: 'dogwifhat (WIF)', bonk: 'Bonk (BONK)', jupiter: 'Jupiter (JUP)',
    ethena: 'Ethena (ENA)', stacks: 'Stacks (STX)', sei: 'Sei (SEI)',
    celestia: 'Celestia (TIA)', pendle: 'Pendle (PENDLE)', wormhole: 'Wormhole (W)',
    ondo: 'Ondo (ONDO)', pyth: 'Pyth (PYTH)', jito: 'Jito (JTO)',
    tron: 'Tron (TRX)', toncoin: 'Toncoin (TON)', thorchain: 'THORChain (RUNE)',
    kaspa: 'Kaspa (KAS)', ordi: 'ORDI', 'ethereum-classic': 'Ethereum Classic (ETC)',
    stellar: 'Stellar (XLM)', 'worldcoin-wld': 'Worldcoin (WLD)', 'dydx-chain': 'dYdX (DYDX)',
    'the-graph': 'The Graph (GRT)', 'ocean-protocol': 'Ocean (OCEAN)',
    'en-protocol': 'Ethena (EN)', 'chromia': 'Chromia (CHR)',
  };

  // Gather all coins from all alert types — use ALL known coins as default when list is empty
  const defaultAllCoins = Object.keys(symbolMap);
  const getCoins = (arr) => (Array.isArray(arr) && arr.length > 0) ? arr : defaultAllCoins;
  const allCoins = new Set();
  if (config.alerts.rsiExtreme?.enabled) getCoins(config.alerts.rsiExtreme.coins).forEach(c => allCoins.add(c));
  if (config.alerts.priceChange?.enabled) getCoins(config.alerts.priceChange.coins).forEach(c => allCoins.add(c));
  if (config.alerts.volumeSpike?.enabled) getCoins(config.alerts.volumeSpike.coins).forEach(c => allCoins.add(c));

  try {
    // ── Process coins in batches of 10 to respect Binance rate limits ──
    const coinArray = [...allCoins];
    const BATCH_SIZE = 10;
    const DELAY_BETWEEN_COINS = 500; // 500ms between each coin in a batch
    const DELAY_BETWEEN_BATCHES = 2000; // 2s between batches

    console.log(`[Telegram] Analyzing ${coinArray.length} coins in ${Math.ceil(coinArray.length / BATCH_SIZE)} batches...`);

    for (let batchStart = 0; batchStart < coinArray.length; batchStart += BATCH_SIZE) {
      const batch = coinArray.slice(batchStart, batchStart + BATCH_SIZE);
      const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1;
      console.log(`[Telegram] Batch ${batchNum}: ${batch.join(', ')}`);

      for (const coinId of batch) {
        const symbol = symbolMap[coinId];
        if (!symbol) continue;
        const name = coinNames[coinId] || coinId.toUpperCase();

        // Check cooldown first
        if (isCooldownActive(cooldowns, coinId, 'multiTF')) {
          continue;
        }

        try {
          // ── Fetch 3 timeframes from Binance (sequential to avoid burst) ──
          const data5m = await fetchBinanceKlines(symbol, '5m', 100);
          await new Promise(r => setTimeout(r, 200));
          const data15m = await fetchBinanceKlines(symbol, '15m', 100);
          await new Promise(r => setTimeout(r, 200));
          const data1h = await fetchBinanceKlines(symbol, '1h', 200);

          // ── Analyze each timeframe ──
          const tf5m = analyzeTimeframe(data5m.closes, data5m.highs, data5m.lows);
          const tf15m = analyzeTimeframe(data15m.closes, data15m.highs, data15m.lows);
          const tf1h = analyzeTimeframe(data1h.closes, data1h.highs, data1h.lows);

          const timeframes = [
            { label: '5m', ...tf5m },
            { label: '15m', ...tf15m },
            { label: '1h', ...tf1h },
          ];

          // ── Convergence check: at least 2 of 3 TFs must agree ──
          const bullishTFs = timeframes.filter(tf => tf.bullishCount >= 2).length;
          const bearishTFs = timeframes.filter(tf => tf.bearishCount >= 2).length;

          let direction = null;
          if (bullishTFs >= 2) direction = 'LONG';
          else if (bearishTFs >= 2) direction = 'SHORT';

          if (!direction) {
            // No convergence — skip this coin
            await new Promise(r => setTimeout(r, DELAY_BETWEEN_COINS));
            continue;
          }

          // ── Calculate support/resistance from 1h (200 candles) ──
          const { supports, resistances } = findSupportResistance(data1h.highs, data1h.lows, 3);
          const currentPrice = data5m.closes[data5m.closes.length - 1];

          // ── Calculate trade plan ──
          const plan = calcTradePlan(currentPrice, supports, resistances, direction);

          // ── Calculate Risk/Reward ratio ──
          const risk = Math.abs(plan.entry - plan.sl);
          const reward = Math.abs(plan.tp2 - plan.entry);
          const rr = risk > 0 ? (reward / risk).toFixed(1) : 'N/A';

          // ── Percentage calculations ──
          const pctTP1 = ((plan.tp1 - plan.entry) / plan.entry * 100);
          const pctTP2 = ((plan.tp2 - plan.entry) / plan.entry * 100);
          const pctTP3 = ((plan.tp3 - plan.entry) / plan.entry * 100);
          const pctSL = ((plan.sl - plan.entry) / plan.entry * 100);

          // ── Build S/R display (up to 3 each, relative to price) ──
          const resistancesAbove = resistances.filter(r => r > currentPrice).sort((a, b) => a - b).slice(0, 3);
          const supportsBelow = supports.filter(s => s < currentPrice).sort((a, b) => b - a).slice(0, 3);

          // Format indicator display for each TF
          const fmtTF = (tf) => {
            const rsiStr = !isNaN(tf.rsi) ? tf.rsi.toFixed(1) : 'N/A';
            const macdStr = tf.macd ? (tf.macd.histogram > 0 ? '▲' : '▼') : 'N/A';
            const stochStr = tf.stoch ? `${tf.stoch.k.toFixed(0)}/${tf.stoch.d.toFixed(0)}` : 'N/A';
            return `RSI(14): ${rsiStr} | MACD: ${macdStr} | Stoch: ${stochStr}`;
          };

          // ── Build S/R section ──
          let srSection = '';
          for (let i = resistancesAbove.length - 1; i >= 0; i--) {
            srSection += `├ R${i + 1} : <b>$${formatPrice(resistancesAbove[i])}</b>\n`;
          }
          srSection += `├ ── Prix actuel : <b>$${formatPrice(currentPrice)}</b> ──\n`;
          for (let i = 0; i < supportsBelow.length; i++) {
            const prefix = i === supportsBelow.length - 1 ? '└' : '├';
            srSection += `${prefix} S${i + 1} : <b>$${formatPrice(supportsBelow[i])}</b>\n`;
          }
          if (!srSection.includes('└')) srSection += `└ (aucun support identifié)\n`;

          const dirEmoji = direction === 'LONG' ? '🟢 LONG' : '🔴 SHORT';
          const signalStrength = (bullishTFs === 3 || bearishTFs === 3) ? '⚡⚡⚡ TRÈS FORT' : '⚡⚡ FORT';

          const text = `🔥 <b>SIGNAL CRYPTO — CONVERGENCE MULTI-INDICATEURS</b>
━━━━━━━━━━━━━━━━━━━━━

${dirEmoji} — ${signalStrength}
🪙 <b>${name}</b>

📊 <b>Analyse Multi-Timeframe :</b>
┌─ <b>1H (Tendance)</b>
│  ${fmtTF(tf1h)}
├─ <b>15M (Confirmation)</b>
│  ${fmtTF(tf15m)}
└─ <b>5M (Entry)</b>
   ${fmtTF(tf5m)}

🎯 <b>Plan de Trade :</b>
├ Entry : <b>$${formatPrice(plan.entry)}</b>
├ TP1 : <b>$${formatPrice(plan.tp1)}</b> (${pctTP1 >= 0 ? '+' : ''}${pctTP1.toFixed(2)}%)
├ TP2 : <b>$${formatPrice(plan.tp2)}</b> (${pctTP2 >= 0 ? '+' : ''}${pctTP2.toFixed(2)}%)
├ TP3 : <b>$${formatPrice(plan.tp3)}</b> (${pctTP3 >= 0 ? '+' : ''}${pctTP3.toFixed(2)}%)
└ SL : <b>$${formatPrice(plan.sl)}</b> (${pctSL >= 0 ? '+' : ''}${pctSL.toFixed(2)}%)

📐 <b>Supports &amp; Résistances :</b>
${srSection}
⚖️ Risk/Reward : <b>1:${rr}</b>

⏰ ${nowStr} (heure de Montréal)
⚠️ <i>Ceci n'est pas un conseil financier. DYOR.</i>`;

          const result = await sendTelegramMessage(text);
          if (result.ok) {
            await sendTelegramLogo();
            setCooldown(cooldowns, coinId, 'multiTF');
            sentAlerts.push({
              type: 'multiTF',
              coin: coinId,
              direction,
              rr,
              entry: plan.entry,
              tp1: plan.tp1,
              sl: plan.sl,
            });
            console.log(`[Telegram] ✅ Sent ${direction} signal for ${name}`);
          }
        } catch (e) {
          console.error(`[Telegram] Error analyzing ${coinId}:`, e.message);
        }

        // Rate limit between coins within a batch
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_COINS));
      }

      // Delay between batches
      if (batchStart + BATCH_SIZE < coinArray.length) {
        console.log(`[Telegram] Batch ${batchNum} done. Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
      }
    }

    // Save cooldowns
    saveCooldowns(cooldowns);

    // Update last check
    config.lastCheck = now.toISOString();
    config.lastAlerts = sentAlerts;
    saveTelegramAlerts(config);

  } catch (err) {
    console.error('Alert check error:', err);
  }

  return sentAlerts;
}

// ─── Periodic alert checker (every 5 minutes) ───
let alertInterval = null;

function startAlertChecker() {
  const config = loadTelegramAlerts();
  if (alertInterval) clearInterval(alertInterval);
  if (config.enabled) {
    const interval = config.checkIntervalMs || 300000;
    console.log(`[Telegram] Alert checker started — checking every ${interval / 1000}s`);
    alertInterval = setInterval(async () => {
      console.log('[Telegram] Running periodic alert check...');
      const alerts = await checkAndSendAlerts();
      if (alerts.length > 0) {
        console.log(`[Telegram] Sent ${alerts.length} alerts`);
      }
    }, interval);
    // Also run immediately on start
    checkAndSendAlerts().then(alerts => {
      if (alerts.length > 0) console.log(`[Telegram] Initial check sent ${alerts.length} alerts`);
    });
  }
}

// ─── POST /api/telegram/toggle — Enable/disable alert system ───
app.post('/api/telegram/toggle', (req, res) => {
  const { enabled } = req.body;
  const config = loadTelegramAlerts();
  config.enabled = !!enabled;
  saveTelegramAlerts(config);
  if (config.enabled) {
    startAlertChecker();
  } else if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
    console.log('[Telegram] Alert checker stopped');
  }
  res.json({ success: true, enabled: config.enabled });
});

// Start checker on boot if enabled
startAlertChecker();

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

// ─── CryptoPanic News API proxy ───
app.get('/api/news', async (req, res) => {
  const targetUrl = `https://cryptopanic.com/api/free/v1/posts/?auth_token=free&public=true&kind=news`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
    });

    const data = await upstreamRes.text();
    const contentType = upstreamRes.headers.get('content-type') || '';

    // If response is HTML (Cloudflare challenge) or non-JSON, return proper error
    if (!contentType.includes('application/json') || data.trim().startsWith('<!') || data.trim().startsWith('<html')) {
      return res.status(503).json({ error: 'CryptoPanic blocked by Cloudflare', results: null });
    }

    res.status(upstreamRes.status)
      .set('Content-Type', 'application/json')
      .send(data);
  } catch (err) {
    console.error('CryptoPanic proxy error:', err);
    res.status(502).json({ error: 'News proxy failed', message: err?.message });
  }
});

// ─── CryptoCompare News API proxy ───
app.get('/api/news-crypto', async (req, res) => {
  const targetUrl = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    const data = await upstreamRes.text();
    res.status(upstreamRes.status)
      .set('Content-Type', 'application/json')
      .send(data);
  } catch (err) {
    console.error('CryptoCompare news proxy error:', err);
    res.status(502).json({ error: 'News proxy failed', message: err?.message });
  }
});

// Prevent browser caching of HTML (force fresh loads after deploy)
app.use((req, res, next) => {
  if (req.url.endsWith('.html') || req.url === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — also with no-cache headers
app.get('{*path}', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});