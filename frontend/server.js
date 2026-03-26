// Simple Express server for production that proxies API calls
// This keeps API keys server-side and avoids CORS issues
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import fs from 'fs';
const { readFileSync, writeFileSync, existsSync, mkdirSync } = fs;
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';

// ─── CoinGecko response cache (in-memory, 5min TTL) ───
const cgCache = new Map(); // key → { data, status, timestamp }
const CG_CACHE_TTL = 300_000; // 5 minutes — reduced rate limit hits

// Stripe webhook needs raw body for signature verification — must be before json parser
app.use('/api/v1/payment/stripe_webhook', express.raw({ type: 'application/json' }));

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

// ============================================================
// Super Admin Management — Server-side JSON file persistence
// ============================================================
const SUPER_ADMIN_FILE = path.join(DATA_DIR, 'super_admin.json');
const adminSessions = new Map(); // token → { email, name, role, created_at }
const ADMIN_SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

function loadSuperAdmin() {
  try {
    if (existsSync(SUPER_ADMIN_FILE)) {
      return JSON.parse(readFileSync(SUPER_ADMIN_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading super admin:', err);
  }
  return null;
}

function saveSuperAdmin(admin) {
  try {
    writeFileSync(SUPER_ADMIN_FILE, JSON.stringify(admin, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving super admin:', err);
  }
}

function generateSessionToken() {
  return createHash('sha256').update(Math.random().toString() + Date.now().toString() + Math.random().toString()).digest('hex');
}

// Clean expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of adminSessions) {
    if (now - new Date(session.created_at).getTime() > ADMIN_SESSION_TTL) {
      adminSessions.delete(token);
    }
  }
}, 30 * 60 * 1000); // Every 30 minutes

// ─── GET /api/v1/admin/status — Check if super admin is configured ───
app.get('/api/v1/admin/status', (req, res) => {
  const admin = loadSuperAdmin();
  res.json({ configured: !!admin });
});

// ─── POST /api/v1/admin/setup — Initialize super admin (one-time only) ───
app.post('/api/v1/admin/setup', (req, res) => {
  const existing = loadSuperAdmin();
  if (existing) {
    return res.status(403).json({ success: false, message: 'Super admin déjà configuré.' });
  }

  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ success: false, message: 'Email, nom et mot de passe requis.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Adresse email invalide.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  const admin = {
    email: email.trim().toLowerCase(),
    name: name.trim(),
    passwordHash: hashPwd(password),
    role: 'super_admin',
    created_at: new Date().toISOString(),
  };

  saveSuperAdmin(admin);
  console.log(`[Admin] Super admin created: ${admin.email}`);
  res.json({ success: true, message: 'Super admin créé avec succès.' });
});

// ─── POST /api/v1/admin/login — Authenticate admin ───
app.post('/api/v1/admin/login', (req, res) => {
  const admin = loadSuperAdmin();
  if (!admin) {
    return res.status(403).json({ success: false, message: 'Super admin non configuré.' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
  }

  if (admin.email !== email.trim().toLowerCase() || admin.passwordHash !== hashPwd(password)) {
    return res.json({ success: false, message: 'Email ou mot de passe incorrect.' });
  }

  // Generate session token
  const token = generateSessionToken();
  adminSessions.set(token, {
    email: admin.email,
    name: admin.name,
    role: admin.role,
    created_at: new Date().toISOString(),
  });

  console.log(`[Admin] Login successful: ${admin.email}`);
  res.json({
    success: true,
    token,
    admin: { email: admin.email, name: admin.name, role: admin.role },
  });
});

// ─── POST /api/v1/admin/verify — Verify session token ───
app.post('/api/v1/admin/verify', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.json({ valid: false });
  }

  const session = adminSessions.get(token);
  if (!session) {
    return res.json({ valid: false });
  }

  // Check expiry
  if (Date.now() - new Date(session.created_at).getTime() > ADMIN_SESSION_TTL) {
    adminSessions.delete(token);
    return res.json({ valid: false });
  }

  res.json({ valid: true, admin: { email: session.email, name: session.name, role: session.role } });
});

// ─── POST /api/v1/admin/logout — Invalidate session ───
app.post('/api/v1/admin/logout', (req, res) => {
  const { token } = req.body;
  if (token) {
    adminSessions.delete(token);
  }
  res.json({ success: true });
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

// ─── Binance Klines API proxy (with symbol validation + Bybit fallback) ───
const INVALID_BINANCE_SYMBOLS = new Set([
  'POWERUSDT', 'SIRENUSDT', 'PIPPINUSDT', 'RIVERUSDT', 'APEPEUSDT',
  'XAUTUSDT', 'FFUSDT', 'XPLUSDT', 'BARDUSDT', 'VVVUSDT', 'MONUSDT', 'KITEUSDT',
]); // Pre-populated known-bad symbols + runtime cache
const BYBIT_FALLBACK_SYMBOLS = new Set(); // Cache of symbols that need Bybit
const STABLECOIN_BASES = new Set([
  'USDT', 'USDC', 'BUSD', 'TUSD', 'DAI', 'FDUSD', 'USDP', 'USDD', 'GUSD',
  'FRAX', 'LUSD', 'SUSD', 'EURS', 'EURT', 'USDJ', 'UST', 'AUSD', 'PYUSD',
  'CRVUSD', 'EURC', 'USDE', 'EUR', 'GBP', 'AUD',
]);

// ─── Bybit interval mapping (Binance → Bybit) ───
function binanceToBybitInterval(interval) {
  const map = { '1m': '1', '3m': '3', '5m': '5', '15m': '15', '30m': '30', '1h': '60', '2h': '120', '4h': '240', '6h': '360', '12h': '720', '1d': 'D', '1w': 'W', '1M': 'M' };
  return map[interval] || '60';
}

// ─── Convert Bybit klines to Binance klines format ───
function bybitKlinesToBinanceFormat(bybitList) {
  // Bybit returns: [[timestamp, open, high, low, close, volume, turnover], ...]
  // Bybit returns newest first, so reverse
  const reversed = [...bybitList].reverse();
  return reversed.map(k => [
    parseInt(k[0]),        // 0: Open time (timestamp ms)
    k[1],                  // 1: Open
    k[2],                  // 2: High
    k[3],                  // 3: Low
    k[4],                  // 4: Close
    k[5],                  // 5: Volume
    parseInt(k[0]) + 60000, // 6: Close time (approx)
    k[6] || '0',           // 7: Quote asset volume (turnover)
    '0',                   // 8: Number of trades
    '0',                   // 9: Taker buy base
    '0',                   // 10: Taker buy quote
    '0',                   // 11: Ignore
  ]);
}

// ─── Fetch klines from Bybit as fallback ───
async function fetchBybitKlines(symbol, interval, limit) {
  const bybitInterval = binanceToBybitInterval(interval);
  const url = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${bybitInterval}&limit=${limit}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'User-Agent': 'CryptoIA/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!resp.ok) return null;
  const json = await resp.json();
  if (json.retCode !== 0 || !json.result?.list?.length) return null;
  return json.result.list;
}

// ─── Fetch ticker price from Bybit as fallback ───
async function fetchBybitPrice(symbol) {
  const url = `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!resp.ok) return null;
  const json = await resp.json();
  if (json.retCode !== 0 || !json.result?.list?.length) return null;
  return parseFloat(json.result.list[0].lastPrice);
}

app.get('/api/binance/klines', async (req, res) => {
  const { symbol, interval, limit } = req.query;

  // Validate symbol format
  if (!symbol || typeof symbol !== 'string' || symbol.length < 5 || !symbol.endsWith('USDT')) {
    return res.status(400).json({ error: 'Invalid symbol format', symbol });
  }

  // Extract base and check if it's a stablecoin (e.g., USDTUSDT is invalid)
  const base = symbol.replace(/USDT$/, '');
  if (!base || base.length < 2 || STABLECOIN_BASES.has(base)) {
    return res.status(400).json({ error: 'Invalid or stablecoin symbol', symbol });
  }

  const effectiveInterval = interval || '1h';
  const effectiveLimit = limit || '168';

  // If we know this symbol needs Bybit, go directly to Bybit
  if (BYBIT_FALLBACK_SYMBOLS.has(symbol)) {
    try {
      const bybitList = await fetchBybitKlines(symbol, effectiveInterval, effectiveLimit);
      if (bybitList) {
        const binanceFormat = bybitKlinesToBinanceFormat(bybitList);
        return res.status(200).set('Content-Type', 'application/json').json(binanceFormat);
      }
    } catch (err) {
      console.error(`[Bybit] Klines fallback error for ${symbol}:`, err.message);
    }
    return res.status(400).json({ error: 'Symbol not available on Binance or Bybit', symbol });
  }

  // Check cached invalid symbols (not on Binance AND not on Bybit)
  if (INVALID_BINANCE_SYMBOLS.has(symbol)) {
    return res.status(400).json({ error: 'Known invalid symbol', symbol });
  }

  const targetUrl = `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${effectiveInterval}&limit=${effectiveLimit}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'User-Agent': 'CryptoIA/1.0' },
      signal: AbortSignal.timeout(15000),
    });

    // If Binance returns 400 (invalid symbol), try Bybit as fallback
    if (upstreamRes.status === 400 || upstreamRes.status === 451) {
      console.log(`[Binance] ${symbol} returned ${upstreamRes.status}, trying Bybit fallback...`);
      try {
        const bybitList = await fetchBybitKlines(symbol, effectiveInterval, effectiveLimit);
        if (bybitList) {
          BYBIT_FALLBACK_SYMBOLS.add(symbol); // Cache for future requests
          console.log(`[Bybit] ✅ ${symbol} found on Bybit (${bybitList.length} klines)`);
          const binanceFormat = bybitKlinesToBinanceFormat(bybitList);
          return res.status(200).set('Content-Type', 'application/json').json(binanceFormat);
        }
      } catch (bybitErr) {
        console.error(`[Bybit] Fallback error for ${symbol}:`, bybitErr.message);
      }
      // Neither Binance nor Bybit has this symbol
      INVALID_BINANCE_SYMBOLS.add(symbol);
      return res.status(400).json({ error: 'Symbol not available on Binance or Bybit', symbol });
    }

    const data = await upstreamRes.text();
    res.status(upstreamRes.status)
      .set('Content-Type', 'application/json')
      .send(data);
  } catch (err) {
    console.error('Binance proxy error:', err);
    // On network error, also try Bybit
    try {
      const bybitList = await fetchBybitKlines(symbol, effectiveInterval, effectiveLimit);
      if (bybitList) {
        const binanceFormat = bybitKlinesToBinanceFormat(bybitList);
        return res.status(200).set('Content-Type', 'application/json').json(binanceFormat);
      }
    } catch (_e) { /* ignore */ }
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
    enabled: true,
    checkIntervalMs: 900000, // 15 minutes (was 5min — reduced to avoid duplicate floods)
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
      signal: AbortSignal.timeout(15000), // 15s timeout to prevent hanging
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Telegram send error:', err.message || err);
    return { ok: false, description: err.message || 'Telegram request failed' };
  }
}

// Send photo to Telegram (ia.png branding image)
async function sendTelegramPhoto(caption = '') {
  const photoPath = path.join(__dirname, 'assets', 'ia.png');
  try {
    if (!existsSync(photoPath)) {
      console.error('[Telegram] Photo file not found:', photoPath);
      return { ok: false, description: 'Photo file not found' };
    }

    // Build multipart form data manually using Blob API (Node 18+)
    const photoBuffer = readFileSync(photoPath);
    const formData = new globalThis.FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('photo', new Blob([photoBuffer], { type: 'image/png' }), 'ia.png');
    if (caption) {
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
    }

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('[Telegram] Photo send error:', data.description);
    }
    return data;
  } catch (err) {
    console.error('[Telegram] Photo send error:', err);
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
    // Photo removed per user request
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
    // Photo removed per user request
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

// ═══════════════════════════════════════════════════════════════════════════════
// COOLDOWN SYSTEM — In-memory primary + file backup, 4h per crypto+direction
// ═══════════════════════════════════════════════════════════════════════════════
const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours in ms

// PRIMARY: In-memory cooldown Map — survives as long as the process runs
// key: `${coinId}_${direction}` → timestamp (ms)
const inMemoryCooldowns = new Map();

// NO daily alert limit — only per-crypto cooldown applies

// Load file-based cooldowns into in-memory Map on startup
function initCooldownsFromFile() {
  try {
    const config = loadTelegramAlerts();
    const fileCooldowns = config.cooldowns || {};
    let loaded = 0;
    let expired = 0;
    const now = Date.now();
    for (const [key, entry] of Object.entries(fileCooldowns)) {
      const elapsed = now - new Date(entry.timestamp).getTime();
      if (elapsed < COOLDOWN_MS) {
        // Parse key: old format is `${coinId}_signal`, extract coinId
        const coinId = key.replace(/_signal$/, '');
        const memKey = `${coinId}_${entry.direction}`;
        inMemoryCooldowns.set(memKey, new Date(entry.timestamp).getTime());
        loaded++;
      } else {
        expired++;
      }
    }
    console.log(`[Telegram] 🔄 Loaded ${loaded} active cooldowns from file (${expired} expired, discarded)`);
  } catch (err) {
    console.error('[Telegram] Error loading cooldowns from file:', err);
  }
}

function loadCooldowns() {
  // Return a plain object for backward compatibility with file persistence
  const config = loadTelegramAlerts();
  return config.cooldowns || {};
}

function saveCooldowns(cooldowns) {
  try {
    const config = loadTelegramAlerts();
    config.cooldowns = cooldowns;
    saveTelegramAlerts(config);
  } catch (err) {
    console.error('[Telegram] Error saving cooldowns to file (non-critical):', err);
  }
}

/**
 * Check if a cooldown is active for a coin+direction.
 * Checks IN-MEMORY first (reliable), then file as fallback.
 * Returns true if the same direction signal was sent within the cooldown period.
 */
function isCooldownActive(cooldowns, coinId, direction) {
  const now = Date.now();
  const memKey = `${coinId}_${direction}`;

  // 1. Check in-memory (primary, always reliable)
  const memTimestamp = inMemoryCooldowns.get(memKey);
  if (memTimestamp && (now - memTimestamp) < COOLDOWN_MS) {
    const remainingMin = Math.round((COOLDOWN_MS - (now - memTimestamp)) / 60000);
    console.log(`[Telegram] 🛑 In-memory cooldown active for ${coinId} (${direction}), ${remainingMin}min remaining`);
    return true;
  }

  // 2. Fallback: check file-based cooldowns (for persistence across restarts)
  const fileKey = `${coinId}_signal`;
  const entry = cooldowns[fileKey];
  if (entry) {
    const elapsed = now - new Date(entry.timestamp).getTime();
    if (elapsed < COOLDOWN_MS && entry.direction === direction) {
      const remainingMin = Math.round((COOLDOWN_MS - elapsed) / 60000);
      console.log(`[Telegram] 🛑 File cooldown active for ${coinId} (${direction}), ${remainingMin}min remaining`);
      // Sync to in-memory for future checks
      inMemoryCooldowns.set(memKey, new Date(entry.timestamp).getTime());
      return true;
    }
  }

  return false;
}

/**
 * Set cooldown in BOTH in-memory Map AND file persistence.
 */
function setCooldown(cooldowns, coinId, direction) {
  const now = Date.now();
  const memKey = `${coinId}_${direction}`;

  // 1. Set in-memory (instant, always works)
  inMemoryCooldowns.set(memKey, now);

  // 2. Set in file object (for persistence)
  const fileKey = `${coinId}_signal`;
  cooldowns[fileKey] = {
    timestamp: new Date(now).toISOString(),
    direction,
  };

  // Log active cooldowns count
  let activeCooldowns = 0;
  for (const [, ts] of inMemoryCooldowns) {
    if ((now - ts) < COOLDOWN_MS) activeCooldowns++;
  }
  console.log(`[Telegram] 🔒 Cooldown set for ${coinId} (${direction}) — ${activeCooldowns} active cooldowns total`);
}

// Clean up expired in-memory cooldowns periodically (every 30 min)
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, ts] of inMemoryCooldowns) {
    if ((now - ts) >= COOLDOWN_MS) {
      inMemoryCooldowns.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[Telegram] 🧹 Cleaned ${cleaned} expired cooldowns from memory (${inMemoryCooldowns.size} remaining)`);
  }
}, 30 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════════════════════
// COINGECKO-BASED SIGNAL GENERATION (mirrors /trades page logic exactly)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate Support & Resistance levels from sparkline data and 24h high/low.
 * (Same algorithm as Trades.tsx calculateSRLevels)
 */
function calculateSRLevels(coin) {
  const price = coin.current_price;
  const supports = [];
  const resistances = [];

  // 1. Use high_24h and low_24h as immediate S/R
  if (coin.low_24h && coin.low_24h < price) {
    supports.push({ price: coin.low_24h, type: 'support', strength: 'major', source: 'Low 24h' });
  }
  if (coin.high_24h && coin.high_24h > price) {
    resistances.push({ price: coin.high_24h, type: 'resistance', strength: 'major', source: 'High 24h' });
  }

  // 2. ATH as major resistance
  if (coin.ath && coin.ath > price * 1.02) {
    resistances.push({ price: coin.ath, type: 'resistance', strength: 'major', source: 'ATH' });
  }

  // 3. Extract local min/max from sparkline (7-day hourly data)
  const sparkline = coin.sparkline_in_7d?.price;
  if (sparkline && sparkline.length > 10) {
    const localMins = [];
    const localMaxs = [];
    const windowSize = 6;

    for (let i = windowSize; i < sparkline.length - windowSize; i++) {
      let isMin = true;
      let isMax = true;
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j === i) continue;
        if (sparkline[j] <= sparkline[i]) isMin = false;
        if (sparkline[j] >= sparkline[i]) isMax = false;
      }
      if (isMin) localMins.push(sparkline[i]);
      if (isMax) localMaxs.push(sparkline[i]);
    }

    // Cluster nearby levels (within 1.5% of each other)
    const clusterLevels = (levels) => {
      if (levels.length === 0) return [];
      const sorted = [...levels].sort((a, b) => a - b);
      const clusters = [[sorted[0]]];
      for (let i = 1; i < sorted.length; i++) {
        const lastCluster = clusters[clusters.length - 1];
        const clusterAvg = lastCluster.reduce((s, v) => s + v, 0) / lastCluster.length;
        if (Math.abs(sorted[i] - clusterAvg) / clusterAvg < 0.015) {
          lastCluster.push(sorted[i]);
        } else {
          clusters.push([sorted[i]]);
        }
      }
      return clusters.map(c => c.reduce((s, v) => s + v, 0) / c.length);
    };

    const clusteredMins = clusterLevels(localMins);
    const clusteredMaxs = clusterLevels(localMaxs);

    for (const level of clusteredMins) {
      if (level < price * 0.99) {
        supports.push({
          price: level,
          type: 'support',
          strength: Math.abs(level - price) / price < 0.03 ? 'major' : 'minor',
          source: 'Sparkline 7j',
        });
      }
    }

    for (const level of clusteredMaxs) {
      if (level > price * 1.01) {
        resistances.push({
          price: level,
          type: 'resistance',
          strength: Math.abs(level - price) / price < 0.03 ? 'major' : 'minor',
          source: 'Sparkline 7j',
        });
      }
    }
  }

  // Sort: supports descending (nearest first), resistances ascending (nearest first)
  supports.sort((a, b) => b.price - a.price);
  resistances.sort((a, b) => a.price - b.price);

  // Deduplicate very close levels (within 0.5%)
  const dedup = (levels) => {
    const result = [];
    for (const level of levels) {
      const exists = result.some(r => Math.abs(r.price - level.price) / level.price < 0.005);
      if (!exists) result.push(level);
    }
    return result;
  };

  return {
    supports: dedup(supports).slice(0, 5),
    resistances: dedup(resistances).slice(0, 5),
  };
}

/**
 * Align TP levels with S/R for higher probability.
 * v4: Wider SL (4-8%) + conservative TP ratios for swing trading
 */
function alignTPWithSR(side, entry, slPercent, supports, resistances) {
  // v4: Enforce minimum 4% SL for swing trades
  const effectiveSlPercent = Math.max(slPercent, 4.0);
  const slDistance = entry * (effectiveSlPercent / 100);

  let tp1, tp2, tp3, sl;

  if (side === 'LONG') {
    sl = entry - slDistance;
    // Enforce minimum 4% SL distance
    if (Math.abs(entry - sl) / entry < 0.04) sl = entry * 0.96;
    // v4: Conservative TP ratios
    tp1 = entry + slDistance * 0.8;   // 0.8:1 — quick profit, high probability
    tp2 = entry + slDistance * 1.5;   // 1.5:1 — moderate target
    tp3 = entry + slDistance * 2.5;   // 2.5:1 — extended target

    const nearestSupport = supports.find(s => s.price < entry * 0.995);
    if (nearestSupport && nearestSupport.price > sl * 0.95 && nearestSupport.price < entry * 0.98) {
      sl = nearestSupport.price * 0.997;
      if (Math.abs(entry - sl) / entry < 0.04) sl = entry * 0.96;
    }

    const resAbove = resistances.filter(r => r.price > entry * 1.005);
    if (resAbove.length >= 1 && resAbove[0].price > tp1 * 0.90 && resAbove[0].price < tp1 * 1.20) {
      tp1 = resAbove[0].price * 0.998;
    }
    if (resAbove.length >= 2 && resAbove[1].price > tp2 * 0.85 && resAbove[1].price < tp2 * 1.25) {
      tp2 = resAbove[1].price * 0.998;
    }
    if (resAbove.length >= 3 && resAbove[2].price > tp3 * 0.80) {
      tp3 = resAbove[2].price * 0.998;
    }
  } else {
    sl = entry + slDistance;
    if (Math.abs(sl - entry) / entry < 0.04) sl = entry * 1.04;
    tp1 = entry - slDistance * 0.8;
    tp2 = entry - slDistance * 1.5;
    tp3 = entry - slDistance * 2.5;

    const nearestResistance = resistances.find(r => r.price > entry * 1.005);
    if (nearestResistance && nearestResistance.price < sl * 1.05 && nearestResistance.price > entry * 1.02) {
      sl = nearestResistance.price * 1.003;
      if (Math.abs(sl - entry) / entry < 0.04) sl = entry * 1.04;
    }

    const supBelow = supports.filter(s => s.price < entry * 0.995);
    if (supBelow.length >= 1 && supBelow[0].price < tp1 * 1.10 && supBelow[0].price > tp1 * 0.80) {
      tp1 = supBelow[0].price * 1.002;
    }
    if (supBelow.length >= 2 && supBelow[1].price < tp2 * 1.15 && supBelow[1].price > tp2 * 0.80) {
      tp2 = supBelow[1].price * 1.002;
    }
    if (supBelow.length >= 3 && supBelow[2].price < tp3 * 1.20) {
      tp3 = supBelow[2].price * 1.002;
    }
  }

  // Ensure TPs are in correct order
  if (side === 'LONG') {
    tp2 = Math.max(tp2, tp1 * 1.01);
    tp3 = Math.max(tp3, tp2 * 1.01);
  } else {
    tp2 = Math.min(tp2, tp1 * 0.99);
    tp3 = Math.min(tp3, tp2 * 0.99);
  }

  return { tp1, tp2, tp3, sl };
}

function roundPrice(value, reference) {
  if (reference >= 1000) return Math.round(value * 100) / 100;
  if (reference >= 1) return Math.round(value * 100) / 100;
  if (reference >= 0.01) return Math.round(value * 10000) / 10000;
  return Math.round(value * 1000000) / 1000000;
}

/**
 * Generate trade setups from CoinGecko market data.
 * (Same algorithm as Trades.tsx generateRealSetups)
 * Now returns raw setups without Daily filter — Daily filter applied async in checkAndSendAlerts.
 */
function generateRealSetups(coins) {
  const setups = [];
  const triggerTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Montreal' });

  for (const c of coins) {
    if (!c || !c.current_price || !c.market_cap) continue;

    const price = c.current_price;
    const change24h = c.price_change_percentage_24h || 0;
    const volume = c.total_volume || 0;
    const mcap = c.market_cap || 1;
    const volMcapRatio = volume / mcap;

    // v4: Skip low volume coins
    if (volMcapRatio < 0.05) continue;

    const { supports, resistances } = calculateSRLevels(c);

    // v4: Wider SL for swing (4-8%)
    const rawVolatility = Math.abs(change24h);
    const slPercent = Math.max(4.0, Math.min(rawVolatility * 0.7, 8.0));

    let side;
    let confidence = 0;
    let reason;

    // v4: Tighter entry conditions (same as Trades.tsx)
    if (change24h > 4 && change24h < 12 && volMcapRatio > 0.12) {
      side = 'LONG';
      confidence = 45;
      if (change24h > 6) confidence += 12; else confidence += 5;
      if (volMcapRatio > 0.25) confidence += 12; else if (volMcapRatio > 0.15) confidence += 8;
      if (change24h > 8) confidence += 8;
      reason = `Momentum haussier (+${change24h.toFixed(1)}%) avec volume élevé (${(volMcapRatio * 100).toFixed(1)}% du MCap)`;
    } else if (change24h < -8 && change24h > -18 && volMcapRatio > 0.10) {
      side = 'LONG';
      confidence = 40;
      if (change24h < -14) confidence += 12; else if (change24h < -10) confidence += 8;
      if (volMcapRatio > 0.18) confidence += 8;
      reason = `Survente potentielle (${change24h.toFixed(1)}%) — rebond technique possible`;
    } else if (change24h < -5 && change24h > -20 && volMcapRatio > 0.15) {
      side = 'SHORT';
      confidence = 45;
      if (change24h < -8) confidence += 10; else confidence += 5;
      if (volMcapRatio > 0.25) confidence += 12; else confidence += 6;
      reason = `Tendance baissière (${change24h.toFixed(1)}%) avec volume de distribution (${(volMcapRatio * 100).toFixed(1)}% du MCap)`;
    } else {
      continue;
    }

    const { tp1, tp2, tp3, sl } = alignTPWithSR(side, price, slPercent, supports, resistances);

    const nearestSupport = supports[0];
    const nearestResistance = resistances[0];

    if (side === 'LONG') {
      if (nearestSupport && Math.abs(price - nearestSupport.price) / price < 0.025) {
        confidence += 8;
        reason += ` | Proche du support $${formatPrice(nearestSupport.price)}`;
      }
      if (nearestResistance && Math.abs(tp1 - nearestResistance.price) / tp1 < 0.02) {
        confidence += 5;
      }
    } else {
      if (nearestResistance && Math.abs(price - nearestResistance.price) / price < 0.025) {
        confidence += 8;
        reason += ` | Proche de la résistance $${formatPrice(nearestResistance.price)}`;
      }
      if (nearestSupport && Math.abs(tp1 - nearestSupport.price) / tp1 < 0.02) {
        confidence += 5;
      }
    }

    if (Math.abs(sl - price) / price < 0.035) {
      confidence -= 10;
    }

    if (supports.length >= 2) confidence += 2;
    if (resistances.length >= 2) confidence += 2;

    confidence = Math.min(98, Math.max(25, confidence));

    const riskDistance = Math.abs(price - sl);
    const rewardDistance = Math.abs(tp2 - price);
    const rr = riskDistance > 0 ? Math.round((rewardDistance / riskDistance) * 10) / 10 : 2;

    setups.push({
      id: c.id,
      symbol: ((c.symbol || '').toUpperCase()) + 'USDT',
      name: c.name || 'Unknown',
      side,
      currentPrice: price,
      entry: price,
      stopLoss: roundPrice(sl, price),
      tp1: roundPrice(tp1, price),
      tp2: roundPrice(tp2, price),
      tp3: roundPrice(tp3, price),
      rr,
      change24h,
      volume,
      marketCap: mcap,
      confidence,
      reason,
      triggerTime,
      supports: supports.slice(0, 3),
      resistances: resistances.slice(0, 3),
    });
  }

  return setups.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Apply Daily (1D) EMA8/EMA20 trend filter to a swing setup.
 * Fetches Daily candles from Binance, calculates trend, adjusts confidence.
 * Returns the setup with d1_trend, ema8_d1, ema20_d1 fields added, or null if blocked.
 */
async function applyDailyFilterToSwingSetup(setup) {
  try {
    const d1Candles = await fetchBinanceKlines(setup.symbol, '1d', 50);

    let d1Trend = 'neutral';
    let d1Ema8Val = null;
    let d1Ema20Val = null;

    if (d1Candles.length >= 25) {
      const d1Closes = d1Candles.map(c => c.close);
      const d1Ema8 = calcEMA(d1Closes, 8);
      const d1Ema20 = calcEMA(d1Closes, 20);
      d1Ema8Val = d1Ema8[d1Ema8.length - 1];
      d1Ema20Val = d1Ema20[d1Ema20.length - 1];
      const d1Spread = Math.abs(d1Ema8Val - d1Ema20Val) / d1Ema20Val;
      if (d1Spread < 0.001) {
        d1Trend = 'neutral';
      } else if (d1Ema8Val > d1Ema20Val) {
        d1Trend = 'bullish';
      } else {
        d1Trend = 'bearish';
      }
    }

    // Apply Daily trend penalty/bonus
    let d1Penalty = 0;
    let d1Reason = '';
    if (setup.side === 'LONG' && d1Trend === 'bearish') {
      d1Penalty = 12;
      d1Reason = `⚠️ Daily Bearish — pénalité confiance -${d1Penalty}%`;
    } else if (setup.side === 'SHORT' && d1Trend === 'bullish') {
      d1Penalty = 12;
      d1Reason = `⚠️ Daily Bullish — pénalité confiance -${d1Penalty}%`;
    } else if (setup.side === 'LONG' && d1Trend === 'bullish') {
      d1Penalty = -5;
      d1Reason = `✅ Daily Bullish — bonus alignement +5%`;
    } else if (setup.side === 'SHORT' && d1Trend === 'bearish') {
      d1Penalty = -5;
      d1Reason = `✅ Daily Bearish — bonus alignement +5%`;
    }

    let newConfidence = setup.confidence - d1Penalty;
    newConfidence = Math.min(98, Math.max(25, newConfidence));

    // Add Daily info to reason
    let newReason = setup.reason;
    if (d1Reason) {
      newReason += ` | ${d1Reason}`;
    }

    return {
      ...setup,
      confidence: newConfidence,
      reason: newReason,
      d1_trend: d1Trend,
      ema8_d1: d1Ema8Val,
      ema20_d1: d1Ema20Val,
    };
  } catch (err) {
    console.error(`[Telegram] Daily filter error for ${setup.symbol}:`, err.message);
    // On error, return setup unchanged (no filter applied)
    return { ...setup, d1_trend: 'unknown', ema8_d1: null, ema20_d1: null };
  }
}

/**
 * Fetch top 200 coins from CoinGecko via our own proxy (with sparkline for S/R).
 */
async function fetchCoinGeckoMarkets() {
  const allCoins = [];
  // Fetch 2 pages of 100 (top 200)
  for (let page = 1; page <= 2; page++) {
    const url = `http://localhost:${PORT}/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=${page}&sparkline=true&price_change_percentage=24h`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          allCoins.push(...data);
        }
      } else {
        console.error(`[Telegram] CoinGecko page ${page} returned ${res.status}`);
      }
    } catch (err) {
      console.error(`[Telegram] CoinGecko fetch error page ${page}:`, err.message);
    }
    // Small delay between pages to avoid rate limit
    if (page < 2) await new Promise(r => setTimeout(r, 1500));
  }
  return allCoins;
}

// ─── Alert checking logic — CoinGecko-based, same as /trades page ───
async function checkAndSendAlerts() {
  const config = loadTelegramAlerts();
  if (!config.enabled) return [];

  const sentAlerts = [];
  const now = new Date();
  const nowStr = now.toLocaleString('fr-CA', { timeZone: 'America/Montreal' });
  const cooldowns = loadCooldowns();

  try {
    console.log(`[Telegram] 📡 Fetching CoinGecko market data...`);
    const coins = await fetchCoinGeckoMarkets();
    console.log(`[Telegram] Received ${coins.length} coins from CoinGecko`);

    if (coins.length === 0) {
      console.error('[Telegram] No coins received from CoinGecko, skipping alert check');
      return [];
    }

    // Generate setups using same logic as /trades page
    const allSetups = generateRealSetups(coins);
    console.log(`[Telegram] Generated ${allSetups.length} trade setups`);

    // Deduplicate: keep only the highest-confidence setup per coin
    const seenCoins = new Map();
    for (const setup of allSetups) {
      const existing = seenCoins.get(setup.id);
      if (!existing || setup.confidence > existing.confidence) {
        seenCoins.set(setup.id, setup);
      }
    }
    const dedupedSetups = Array.from(seenCoins.values());
    console.log(`[Telegram] After dedup: ${dedupedSetups.length} unique coin setups`);

    // Apply Daily (1D) EMA8/EMA20 trend filter to each setup
    console.log(`[Telegram] 📊 Applying Daily trend filter to ${dedupedSetups.length} setups...`);
    const setups = [];
    const D1_BATCH_SIZE = 5;
    for (let i = 0; i < dedupedSetups.length; i += D1_BATCH_SIZE) {
      const batch = dedupedSetups.slice(i, i + D1_BATCH_SIZE);
      const filtered = await Promise.all(batch.map(s => applyDailyFilterToSwingSetup(s)));
      for (const s of filtered) {
        if (s) setups.push(s);
      }
      if (i + D1_BATCH_SIZE < dedupedSetups.length) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // Debug: log confidences after Daily filter
    if (setups.length > 0) {
      const confValues = setups.slice(0, 15).map(s => `${s.symbol}:${s.confidence}%${s.side}(D1:${s.d1_trend || '?'})`);
      console.log(`[Telegram] After Daily filter confidences: ${confValues.join(", ")}`);
    }

    // Filter: only send signals with confidence >= 85% (post-Daily-filter)
    const MIN_CONFIDENCE = 85;
    const qualifiedSetups = setups.filter(s => s.confidence >= MIN_CONFIDENCE);
    console.log(`[Telegram] After confidence filter (>=${MIN_CONFIDENCE}%): ${qualifiedSetups.length} setups`);

    // Send alerts for each qualified setup (respecting per-crypto cooldowns)
    for (const setup of qualifiedSetups) {
      // Check cooldown: skip if same direction was sent within 4 hours
      if (isCooldownActive(cooldowns, setup.id, setup.side)) {
        continue;
      }

      // Build Telegram message matching /trades card format
      const dirEmoji = setup.side === 'LONG' ? '🟢 LONG' : '🔴 SHORT';
      const confEmoji = setup.confidence >= 70 ? '🔥' : setup.confidence >= 50 ? '⚡' : '📊';

      // TP/SL percentages
      const pctTP1 = ((setup.tp1 - setup.entry) / setup.entry * 100);
      const pctTP2 = ((setup.tp2 - setup.entry) / setup.entry * 100);
      const pctTP3 = ((setup.tp3 - setup.entry) / setup.entry * 100);
      const pctSL = ((setup.stopLoss - setup.entry) / setup.entry * 100);

      // Build S/R section
      let srSection = '';
      if (setup.resistances.length > 0) {
        for (let i = setup.resistances.length - 1; i >= 0; i--) {
          const r = setup.resistances[i];
          srSection += `├ R${i + 1} (${r.source}) : <b>$${formatPrice(r.price)}</b> ${r.strength === 'major' ? '🔴' : '⚪'}\n`;
        }
      }
      srSection += `├ ── Entry : <b>$${formatPrice(setup.entry)}</b> ──\n`;
      if (setup.supports.length > 0) {
        for (let i = 0; i < setup.supports.length; i++) {
          const s = setup.supports[i];
          const prefix = i === setup.supports.length - 1 ? '└' : '├';
          srSection += `${prefix} S${i + 1} (${s.source}) : <b>$${formatPrice(s.price)}</b> ${s.strength === 'major' ? '🟢' : '⚪'}\n`;
        }
      } else {
        srSection += `└ (aucun support identifié)\n`;
      }

      // Daily trend display
      const d1TrendEmoji = setup.d1_trend === 'bullish' ? '🟢 Haussière' : setup.d1_trend === 'bearish' ? '🔴 Baissière' : '⚪ Neutre';
      const d1Info = setup.ema8_d1 != null ? ` (EMA8: $${formatPrice(setup.ema8_d1)}, EMA20: $${formatPrice(setup.ema20_d1)})` : '';

      const text = `🔵🔵🔵 <b>🔄 SWING TRADING — SIGNAL CRYPTO</b> 🔵🔵🔵
🌐 https://CryptoIA.ca
📊 Entry sur le timeframe <b>H1</b> | Analyse : <b>CoinGecko 24h</b> + <b>S/R 7j</b> + <b>Confirmation H1</b>
━━━━━━━━━━━━━━━━━━━━━

${dirEmoji} — <b>${setup.name}</b> (${setup.symbol})

🎯 <b>Plan de Trade :</b>
├ Entry : <b>$${formatPrice(setup.entry)}</b>
├ TP1 : <b>$${formatPrice(setup.tp1)}</b> (${pctTP1 >= 0 ? '+' : ''}${pctTP1.toFixed(2)}%)
├ TP2 : <b>$${formatPrice(setup.tp2)}</b> (${pctTP2 >= 0 ? '+' : ''}${pctTP2.toFixed(2)}%)
├ TP3 : <b>$${formatPrice(setup.tp3)}</b> (${pctTP3 >= 0 ? '+' : ''}${pctTP3.toFixed(2)}%)
└ SL : <b>$${formatPrice(setup.stopLoss)}</b> (${pctSL >= 0 ? '+' : ''}${pctSL.toFixed(2)}%)

📐 <b>Supports &amp; Résistances :</b>
${srSection}
📊 Tendance Daily : ${d1TrendEmoji}${d1Info}

⚖️ Risk/Reward : <b>1:${setup.rr}</b>
📈 24h : <b>${setup.change24h >= 0 ? '+' : ''}${setup.change24h.toFixed(2)}%</b>
🧠 Confiance : <b>${setup.confidence}%</b>

📋 <b>Raison :</b>
<i>${(setup.reason || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</i>

⏰ ${setup.triggerTime} — ${nowStr} (Montréal)
⚠️ <i>Ceci n'est pas un conseil financier. DYOR.</i>`;

      const result = await sendTelegramMessage(text);
      if (result.ok) {
        // Send branding image after the alert message
        // Photo removed per user request

        // Set cooldown IMMEDIATELY in memory + file to prevent duplicates
        setCooldown(cooldowns, setup.id, setup.side);
        saveCooldowns(cooldowns);

        sentAlerts.push({
          type: 'coingecko_signal',
          coin: setup.id,
          direction: setup.side,
          rr: setup.rr,
          entry: setup.entry,
          tp1: setup.tp1,
          tp2: setup.tp2,
          tp3: setup.tp3,
          sl: setup.stopLoss,
          confidence: setup.confidence,
        });
        console.log(`[Telegram] ✅ Sent ${setup.side} signal for ${setup.name} (confidence: ${setup.confidence}%)`);

        // Small delay between messages to avoid Telegram rate limit
        await new Promise(r => setTimeout(r, 2000));
      }
    }

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
    // Also start scalp alerts if the function exists
    if (typeof startScalpAlertChecker === 'function') startScalpAlertChecker();
  } else {
    if (alertInterval) {
      clearInterval(alertInterval);
      alertInterval = null;
      console.log('[Telegram] Alert checker stopped');
    }
    // Also stop scalp alerts
    if (typeof scalpAlertInterval !== 'undefined' && scalpAlertInterval) {
      clearInterval(scalpAlertInterval);
      scalpAlertInterval = null;
      console.log('[ScalpAlert] Scalp alert checker stopped');
    }
  }
  res.json({ success: true, enabled: config.enabled });
});

// Initialize in-memory cooldowns from file on boot
initCooldownsFromFile();

// Start checker on boot if enabled
startAlertChecker();

// ============================================================
// SCALP TRADING — Telegram Alert System (EMA + VWAP + Stochastic)
// ============================================================

const SCALP_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes cooldown for scalp
const SCALP_COOLDOWNS_FILE = path.join(DATA_DIR, 'scalp_cooldowns.json');
const inMemoryScalpCooldowns = new Map();

// Top symbols for scalp trading (high volume, tight spreads)
// Fallback static list (used if dynamic fetch fails)
const SCALP_SYMBOLS_FALLBACK = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT',
  'LINKUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'NEARUSDT',
  'APTUSDT', 'ARBUSDT', 'OPUSDT', 'SUIUSDT', 'PEPEUSDT',
  'TRXUSDT', 'SHIBUSDT', 'FTMUSDT', 'FILUSDT', 'ALGOUSDT',
  'VETUSDT', 'ICPUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT',
  'AAVEUSDT', 'GRTUSDT', 'INJUSDT', 'TIAUSDT', 'SEIUSDT',
  'WLDUSDT', 'JUPUSDT', 'STXUSDT', 'RENDERUSDT', 'FETUSDT',
  'ONDOUSDT', 'ENAUSDT', 'WIFUSDT', 'BONKUSDT', 'FLOKIUSDT',
  'RUNEUSDT', 'PENDLEUSDT', 'JASMYUSDT', 'CFXUSDT', 'EGLDUSDT',
];

// Dynamic top-200 USDT symbols from Binance (cached for 1 hour)
let _cachedScalpSymbols = null;
let _cachedScalpSymbolsTs = 0;
const SCALP_SYMBOLS_CACHE_MS = 60 * 60 * 1000; // 1 hour

async function fetchTop200USDTSymbols() {
  const now = Date.now();
  if (_cachedScalpSymbols && (now - _cachedScalpSymbolsTs) < SCALP_SYMBOLS_CACHE_MS) {
    return _cachedScalpSymbols;
  }
  try {
    const resp = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr');
    if (!resp.ok) throw new Error(`Binance API error: ${resp.status}`);
    const tickers = await resp.json();
    // Filter USDT pairs, exclude stablecoins and leveraged tokens
    const excluded = ['USDCUSDT', 'BUSDUSDT', 'TUSDUSDT', 'DAIUSDT', 'FDUSDUSDT', 'EURUSDT', 'GBPUSDT', 'AUDUSDT', 'USDPUSDT'];
    const usdtPairs = tickers
      .filter(t =>
        t.symbol.endsWith('USDT') &&
        !excluded.includes(t.symbol) &&
        !t.symbol.includes('UP') &&
        !t.symbol.includes('DOWN') &&
        !t.symbol.includes('BEAR') &&
        !t.symbol.includes('BULL') &&
        parseFloat(t.quoteVolume) > 0
      )
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 200)
      .map(t => t.symbol);

    if (usdtPairs.length >= 50) {
      _cachedScalpSymbols = usdtPairs;
      _cachedScalpSymbolsTs = now;
      console.log(`[ScalpAlert] Fetched top ${usdtPairs.length} USDT symbols from Binance by volume`);
      return usdtPairs;
    }
    throw new Error(`Only ${usdtPairs.length} symbols found, using fallback`);
  } catch (err) {
    console.warn(`[ScalpAlert] Failed to fetch dynamic symbols: ${err.message}. Using fallback list.`);
    return SCALP_SYMBOLS_FALLBACK;
  }
}

// Synchronous reference for non-async contexts (initialized on first fetch)
let SCALP_SYMBOLS = [...SCALP_SYMBOLS_FALLBACK];
// Pre-fetch on boot
fetchTop200USDTSymbols().then(syms => { SCALP_SYMBOLS = syms; }).catch(() => {});

function loadScalpCooldowns() {
  try {
    if (fs.existsSync(SCALP_COOLDOWNS_FILE)) {
      return JSON.parse(fs.readFileSync(SCALP_COOLDOWNS_FILE, 'utf8'));
    }
  } catch (_e) { /* ignore */ }
  return {};
}

function saveScalpCooldowns(cooldowns) {
  try {
    fs.writeFileSync(SCALP_COOLDOWNS_FILE, JSON.stringify(cooldowns, null, 2));
  } catch (err) {
    console.error('[ScalpAlert] Error saving cooldowns:', err);
  }
}

function isScalpCooldownActive(cooldowns, symbol, direction) {
  const now = Date.now();
  const memKey = `${symbol}_${direction}`;
  const memTs = inMemoryScalpCooldowns.get(memKey);
  if (memTs && (now - memTs) < SCALP_COOLDOWN_MS) return true;
  const fileEntry = cooldowns[memKey];
  if (fileEntry) {
    const elapsed = now - new Date(fileEntry.timestamp).getTime();
    if (elapsed < SCALP_COOLDOWN_MS && fileEntry.direction === direction) {
      inMemoryScalpCooldowns.set(memKey, new Date(fileEntry.timestamp).getTime());
      return true;
    }
  }
  return false;
}

function setScalpCooldown(cooldowns, symbol, direction) {
  const now = Date.now();
  const memKey = `${symbol}_${direction}`;
  inMemoryScalpCooldowns.set(memKey, now);
  cooldowns[memKey] = { timestamp: new Date(now).toISOString(), direction };
}

// Initialize scalp cooldowns from file on boot
(function initScalpCooldownsFromFile() {
  const cooldowns = loadScalpCooldowns();
  const now = Date.now();
  for (const [key, entry] of Object.entries(cooldowns)) {
    if (entry && entry.timestamp) {
      const elapsed = now - new Date(entry.timestamp).getTime();
      if (elapsed < SCALP_COOLDOWN_MS) {
        inMemoryScalpCooldowns.set(key, new Date(entry.timestamp).getTime());
      }
    }
  }
  console.log(`[ScalpAlert] Loaded ${inMemoryScalpCooldowns.size} active scalp cooldowns from file`);
})();

// ─── Technical Indicator Calculations ───

function calcEMA(data, period) {
  const k = 2 / (period + 1);
  const ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

/** ATR calculation for M5 klines (scalp v2) */
function calcATR_M5(klines, period = 14) {
  if (!klines || klines.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < klines.length; i++) {
    const tr = Math.max(
      klines[i].high - klines[i].low,
      Math.abs(klines[i].high - klines[i - 1].close),
      Math.abs(klines[i].low - klines[i - 1].close)
    );
    trs.push(tr);
  }
  if (trs.length < period) return null;
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }
  return atr;
}

function calcRSI(closes, period = 14) {
  const rsi = new Array(closes.length).fill(50);
  if (closes.length < period + 1) return rsi;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

function calcStochRSI(closes, rsiPeriod = 14, stochPeriod = 14, kSmooth = 3, dSmooth = 3) {
  const rsi = calcRSI(closes, rsiPeriod);
  const stochRaw = new Array(rsi.length).fill(50);
  for (let i = stochPeriod - 1; i < rsi.length; i++) {
    const slice = rsi.slice(i - stochPeriod + 1, i + 1);
    const min = Math.min(...slice);
    const max = Math.max(...slice);
    stochRaw[i] = max === min ? 50 : ((rsi[i] - min) / (max - min)) * 100;
  }
  // SMA smoothing for K
  const kLine = new Array(stochRaw.length).fill(50);
  for (let i = kSmooth - 1; i < stochRaw.length; i++) {
    let sum = 0;
    for (let j = 0; j < kSmooth; j++) sum += stochRaw[i - j];
    kLine[i] = sum / kSmooth;
  }
  // SMA smoothing for D
  const dLine = new Array(kLine.length).fill(50);
  for (let i = dSmooth - 1; i < kLine.length; i++) {
    let sum = 0;
    for (let j = 0; j < dSmooth; j++) sum += kLine[i - j];
    dLine[i] = sum / dSmooth;
  }
  return { k: kLine, d: dLine };
}

function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = calcEMA(macdLine, signal);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);
  return { macd: macdLine, signal: signalLine, histogram };
}

// ─── Fetch Binance klines for a symbol (with Bybit fallback) ───
async function fetchBinanceKlines(symbol, interval, limit = 100) {
  // If known Bybit symbol, go directly to Bybit
  if (BYBIT_FALLBACK_SYMBOLS.has(symbol)) {
    try {
      const bybitList = await fetchBybitKlines(symbol, interval, String(limit));
      if (bybitList) {
        const reversed = [...bybitList].reverse();
        return reversed.map(k => ({
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
          time: parseInt(k[0]),
        }));
      }
    } catch (err) {
      console.error(`[ScalpAlert] Bybit klines error for ${symbol} ${interval}:`, err.message);
    }
    return [];
  }

  try {
    const resp = await fetch(
      `https://data-api.binance.vision/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!resp.ok) {
      // Try Bybit fallback
      try {
        const bybitList = await fetchBybitKlines(symbol, interval, String(limit));
        if (bybitList) {
          BYBIT_FALLBACK_SYMBOLS.add(symbol);
          console.log(`[ScalpAlert] ${symbol} found on Bybit (fallback)`);
          const reversed = [...bybitList].reverse();
          return reversed.map(k => ({
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
            time: parseInt(k[0]),
          }));
        }
      } catch (_e) { /* ignore */ }
      return [];
    }
    const data = await resp.json();
    return data.map(k => ({
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      time: k[0],
    }));
  } catch (err) {
    console.error(`[ScalpAlert] Binance klines error for ${symbol} ${interval}:`, err.message);
    return [];
  }
}

// ─── Generate Scalp Setup for a single symbol ───
async function generateScalpSetup(symbol) {
  // ═══ "Suivi de Flux" Strategy: EMA 8/20 + VWAP + Stochastique (9,3,1) ═══

  // Fetch M5 candles (100 candles = ~8h of data)
  const m5Candles = await fetchBinanceKlines(symbol, '5m', 100);
  if (m5Candles.length < 50) return null;

  // Fetch H1 candles for bias
  const h1Candles = await fetchBinanceKlines(symbol, '1h', 50);
  if (h1Candles.length < 25) return null;

  // Fetch 4H candles for higher timeframe trend filter
  const h4Candles = await fetchBinanceKlines(symbol, '4h', 50);

  // Fetch Daily candles for macro trend filter
  const d1Candles = await fetchBinanceKlines(symbol, '1d', 50);

  const m5Closes = m5Candles.map(c => c.close);
  const h1Closes = h1Candles.map(c => c.close);
  const currentPrice = m5Closes[m5Closes.length - 1];

  // ─── H1 EMA 8 & EMA 20 ───
  const h1Ema8 = calcEMA(h1Closes, 8);
  const h1Ema20 = calcEMA(h1Closes, 20);
  const h1Ema8Val = h1Ema8[h1Ema8.length - 1];
  const h1Ema20Val = h1Ema20[h1Ema20.length - 1];
  const h1Price = h1Closes[h1Closes.length - 1];

  // ─── H1 VWAP ───
  let h1CumTPV = 0, h1CumVol = 0;
  for (const c of h1Candles) {
    const tp = (c.high + c.low + c.close) / 3;
    h1CumTPV += tp * c.volume;
    h1CumVol += c.volume;
  }
  const h1Vwap = h1CumVol > 0 ? h1CumTPV / h1CumVol : null;
  if (h1Vwap === null) return null;

  // ─── 4H EMA 8 & EMA 20 (Higher Timeframe Trend Filter) ───
  let h4Trend = 'neutral';
  let h4Ema8Val = null;
  let h4Ema20Val = null;
  if (h4Candles.length >= 25) {
    const h4Closes = h4Candles.map(c => c.close);
    const h4Ema8 = calcEMA(h4Closes, 8);
    const h4Ema20 = calcEMA(h4Closes, 20);
    h4Ema8Val = h4Ema8[h4Ema8.length - 1];
    h4Ema20Val = h4Ema20[h4Ema20.length - 1];
    const h4Spread = Math.abs(h4Ema8Val - h4Ema20Val) / h4Ema20Val;
    // If EMAs are within 0.1%, consider neutral
    if (h4Spread < 0.001) {
      h4Trend = 'neutral';
    } else if (h4Ema8Val > h4Ema20Val) {
      h4Trend = 'bullish';
    } else {
      h4Trend = 'bearish';
    }
  }

  // ─── Daily EMA 8 & EMA 20 (Macro Trend Filter) ───
  let d1Trend = 'neutral';
  let d1Ema8Val = null;
  let d1Ema20Val = null;
  if (d1Candles.length >= 25) {
    const d1Closes = d1Candles.map(c => c.close);
    const d1Ema8 = calcEMA(d1Closes, 8);
    const d1Ema20 = calcEMA(d1Closes, 20);
    d1Ema8Val = d1Ema8[d1Ema8.length - 1];
    d1Ema20Val = d1Ema20[d1Ema20.length - 1];
    const d1Spread = Math.abs(d1Ema8Val - d1Ema20Val) / d1Ema20Val;
    if (d1Spread < 0.001) {
      d1Trend = 'neutral';
    } else if (d1Ema8Val > d1Ema20Val) {
      d1Trend = 'bullish';
    } else {
      d1Trend = 'bearish';
    }
  }

  // ─── Step 1: H1 Bias ───
  let h1Trend = 'neutral';
  if (h1Price > h1Ema20Val && h1Price > h1Vwap) h1Trend = 'bullish';
  else if (h1Price < h1Ema20Val && h1Price < h1Vwap) h1Trend = 'bearish';

  if (h1Trend === 'neutral') {
    console.log(`[ScalpAlert] ⏭️ ${symbol} rejected: H1 bias neutral (price=${h1Price.toFixed(2)}, EMA20=${h1Ema20Val.toFixed(2)}, VWAP=${h1Vwap.toFixed(2)})`);
    return null;
  }

  // ─── Step 1b: 4H Trend Filter — Reject signals conflicting with 4H trend ───
  if (h1Trend === 'bullish' && h4Trend === 'bearish') {
    console.log(`[ScalpAlert] ⏭️ ${symbol} rejected: 4H trend Bearish conflicts with LONG signal (4H EMA8=${h4Ema8Val?.toFixed(2)}, EMA20=${h4Ema20Val?.toFixed(2)})`);
    return null;
  }
  if (h1Trend === 'bearish' && h4Trend === 'bullish') {
    console.log(`[ScalpAlert] ⏭️ ${symbol} rejected: 4H trend Bullish conflicts with SHORT signal (4H EMA8=${h4Ema8Val?.toFixed(2)}, EMA20=${h4Ema20Val?.toFixed(2)})`);
    return null;
  }

  // 4H neutral: allow signal but will reduce confidence by 5 later
  const h4NeutralPenalty = (h4Trend === 'neutral') ? 5 : 0;

  // ─── M5 EMA 8 & EMA 20 ───
  const m5Ema8 = calcEMA(m5Closes, 8);
  const m5Ema20 = calcEMA(m5Closes, 20);
  const m5Ema8Val = m5Ema8[m5Ema8.length - 1];
  const m5Ema20Val = m5Ema20[m5Ema20.length - 1];

  // ─── M5 VWAP ───
  let m5CumTPV = 0, m5CumVol = 0;
  for (const c of m5Candles) {
    const tp = (c.high + c.low + c.close) / 3;
    m5CumTPV += tp * c.volume;
    m5CumVol += c.volume;
  }
  const m5Vwap = m5CumVol > 0 ? m5CumTPV / m5CumVol : null;
  if (m5Vwap === null) return null;

  // ─── M5 Stochastic (9, 3, 1) ───
  // %K = (close - LL9) / (HH9 - LL9) * 100, %D = SMA(%K, 3)
  const stochKArr = [];
  for (let i = 8; i < m5Candles.length; i++) {
    const window = m5Candles.slice(i - 8, i + 1);
    const ll = Math.min(...window.map(c => c.low));
    const hh = Math.max(...window.map(c => c.high));
    const close = m5Candles[i].close;
    stochKArr.push(hh === ll ? 50 : ((close - ll) / (hh - ll)) * 100);
  }
  if (stochKArr.length < 4) return null;

  const stochDArr = [];
  for (let i = 2; i < stochKArr.length; i++) {
    stochDArr.push((stochKArr[i] + stochKArr[i - 1] + stochKArr[i - 2]) / 3);
  }
  if (stochDArr.length < 2) return null;

  const kVal = stochKArr[stochKArr.length - 1];
  const dVal = stochDArr[stochDArr.length - 1];
  const kPrev = stochKArr[stochKArr.length - 2];
  const dPrev = stochDArr[stochDArr.length - 2];

  // ─── M5 EMA crossover check (last 3 candles) ───
  let emaCrossUp = false, emaCrossDown = false;
  for (let i = Math.max(0, m5Ema8.length - 3); i < m5Ema8.length; i++) {
    if (i > 0 && m5Ema8[i - 1] <= m5Ema20[i - 1] && m5Ema8[i] > m5Ema20[i]) emaCrossUp = true;
    if (i > 0 && m5Ema8[i - 1] >= m5Ema20[i - 1] && m5Ema8[i] < m5Ema20[i]) emaCrossDown = true;
  }

  const ema8AboveEma20 = m5Ema8Val > m5Ema20Val;
  const ema8BelowEma20 = m5Ema8Val < m5Ema20Val;

  // Price proximity to EMA (rebond)
  const distToEma8 = Math.abs(currentPrice - m5Ema8Val) / currentPrice;
  const distToEma20 = Math.abs(currentPrice - m5Ema20Val) / currentPrice;
  const priceNearEma = distToEma8 < 0.003 || distToEma20 < 0.003;
  const priceBetweenEmas = (currentPrice >= Math.min(m5Ema8Val, m5Ema20Val) && currentPrice <= Math.max(m5Ema8Val, m5Ema20Val));

  // Stochastic conditions — relaxed thresholds for more signals
  const stochOversold = kVal < 25;        // v2: Tightened from 35 to 25
  const stochDeepOversold = kVal < 15;    // v2: Tightened from 20 to 15
  const stochOverbought = kVal > 75;      // v2: Tightened from 65 to 75
  const stochDeepOverbought = kVal > 85;  // v2: Tightened from 80 to 85
  const stochCrossUp = kPrev <= dPrev && kVal > dVal;
  const stochCrossDown = kPrev >= dPrev && kVal < dVal;
  const stochRising = kVal > kPrev;
  const stochFalling = kVal < kPrev;

  // Extended price proximity — relaxed from 0.003 to 0.006
  const priceNearEmaWide = distToEma8 < 0.006 || distToEma20 < 0.006;

  // ─── Signal Detection ───
  let side = null;
  let confidence = 0;
  const reasons = [];

  // ─── LONG Signal — Type A: Pullback Entry (original, relaxed) ───
  if (h1Trend === 'bullish') {
    const cond2 = ema8AboveEma20 || emaCrossUp;
    const cond3 = priceNearEma || priceBetweenEmas || priceNearEmaWide;
    const cond4 = currentPrice > m5Vwap;
    const cond5 = stochOversold && (stochCrossUp || stochRising);

    if (cond2 && cond3 && cond4 && cond5) {
      side = 'LONG';
      confidence = 50;
      reasons.push(`H1: Prix > EMA20 ($${h1Ema20Val.toFixed(2)}) & VWAP ($${h1Vwap.toFixed(2)}) ✓`);

      if (emaCrossUp) { confidence += 10; reasons.push('M5: Croisement EMA8 > EMA20 récent ↑'); }
      else { reasons.push('M5: EMA8 > EMA20 ✓'); }

      if (distToEma20 < 0.001) { confidence += 8; reasons.push(`M5: Rebond parfait EMA20`); }
      else if (priceNearEma) { confidence += 4; reasons.push('M5: Prix proche EMA'); }
      else if (priceNearEmaWide) { confidence += 2; reasons.push('M5: Prix zone EMA'); }

      if (stochDeepOversold) { confidence += 10; reasons.push(`Stoch: Survente extrême (K:${kVal.toFixed(1)})`); }
      else if (kVal < 25) { confidence += 7; reasons.push(`Stoch: Survente (K:${kVal.toFixed(1)})`); }
      else { confidence += 4; reasons.push(`Stoch: Zone basse (K:${kVal.toFixed(1)})`); }

      if (stochCrossUp) { confidence += 8; reasons.push(`Stoch: Croisement K↑D`); }

      const vwapDist = (currentPrice - m5Vwap) / currentPrice;
      if (vwapDist > 0.002) { confidence += 4; reasons.push('VWAP M5: bien au-dessus ✓'); }

      // Volume bonus
      const recentVol = m5Candles.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
      const avgVol = m5Candles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
      if (avgVol > 0 && recentVol > avgVol * 1.3) { confidence += 5; reasons.push('Volume M5 supérieur'); }

      // H1 EMA spread bonus
      const h1Spread = Math.abs(h1Ema8Val - h1Ema20Val) / h1Ema20Val;
      if (h1Spread > 0.005) { confidence += 5; reasons.push('H1: Tendance forte (EMA8/20 écartées)'); }
    }

    // ─── LONG Signal — Type B: Momentum Continuation ───
    // Strong trend + EMA cross + stoch rising from mid-zone (not necessarily oversold)
    if (!side && h1Trend === 'bullish') {
      const strongH1 = h1Ema8Val > h1Ema20Val && h1Price > h1Ema8Val;
      const emaCrossRecent = emaCrossUp;
      const stochMidRising = kVal > 40 && kVal < 75 && stochCrossUp;
      const aboveVwap = currentPrice > m5Vwap;

      if (strongH1 && emaCrossRecent && stochMidRising && aboveVwap) {
        side = 'LONG';
        confidence = 45;
        reasons.push(`H1: Tendance forte haussière (EMA8 > EMA20, prix > EMA8) ✓`);
        reasons.push('M5: Croisement EMA8 > EMA20 récent ↑');
        reasons.push(`Stoch: Croisement K↑D en zone médiane (K:${kVal.toFixed(1)})`);

        const vwapDist = (currentPrice - m5Vwap) / currentPrice;
        if (vwapDist > 0.003) { confidence += 5; reasons.push('VWAP M5: bien au-dessus ✓'); }

        const recentVol = m5Candles.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
        const avgVol = m5Candles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
        if (avgVol > 0 && recentVol > avgVol * 1.5) { confidence += 8; reasons.push('Volume M5 en hausse forte'); }
        else if (avgVol > 0 && recentVol > avgVol * 1.2) { confidence += 4; reasons.push('Volume M5 supérieur'); }

        const h1Spread = Math.abs(h1Ema8Val - h1Ema20Val) / h1Ema20Val;
        if (h1Spread > 0.008) { confidence += 8; reasons.push('H1: Tendance très forte (EMA8/20 très écartées)'); }
        else if (h1Spread > 0.004) { confidence += 4; reasons.push('H1: Tendance forte'); }
      }
    }

    // Types C, D, E, F removed — only Type A and Type B kept for scalp v3
  }

  // ─── SHORT Signal — Type A: Pullback Entry (original, relaxed) ───
  if (h1Trend === 'bearish' && !side) {
    const cond2 = ema8BelowEma20 || emaCrossDown;
    const cond3 = priceNearEma || priceBetweenEmas || priceNearEmaWide;
    const cond4 = currentPrice < m5Vwap;
    const cond5 = stochOverbought && (stochCrossDown || stochFalling);

    if (cond2 && cond3 && cond4 && cond5) {
      side = 'SHORT';
      confidence = 50;
      reasons.push(`H1: Prix < EMA20 ($${h1Ema20Val.toFixed(2)}) & VWAP ($${h1Vwap.toFixed(2)}) ✓`);

      if (emaCrossDown) { confidence += 10; reasons.push('M5: Croisement EMA8 < EMA20 récent ↓'); }
      else { reasons.push('M5: EMA8 < EMA20 ✓'); }

      if (distToEma20 < 0.001) { confidence += 8; reasons.push(`M5: Rejet parfait EMA20`); }
      else if (priceNearEma) { confidence += 4; reasons.push('M5: Prix proche EMA'); }
      else if (priceNearEmaWide) { confidence += 2; reasons.push('M5: Prix zone EMA'); }

      if (stochDeepOverbought) { confidence += 10; reasons.push(`Stoch: Surachat extrême (K:${kVal.toFixed(1)})`); }
      else if (kVal > 75) { confidence += 7; reasons.push(`Stoch: Surachat (K:${kVal.toFixed(1)})`); }
      else { confidence += 4; reasons.push(`Stoch: Zone haute (K:${kVal.toFixed(1)})`); }

      if (stochCrossDown) { confidence += 8; reasons.push(`Stoch: Croisement K↓D`); }

      const vwapDist = (m5Vwap - currentPrice) / currentPrice;
      if (vwapDist > 0.002) { confidence += 4; reasons.push('VWAP M5: bien en-dessous ✓'); }

      const recentVol = m5Candles.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
      const avgVol = m5Candles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
      if (avgVol > 0 && recentVol > avgVol * 1.3) { confidence += 5; reasons.push('Volume M5 supérieur'); }

      const h1Spread = Math.abs(h1Ema8Val - h1Ema20Val) / h1Ema20Val;
      if (h1Spread > 0.005) { confidence += 5; reasons.push('H1: Tendance forte (EMA8/20 écartées)'); }
    }

    // ─── SHORT Signal — Type B: Momentum Continuation ───
    if (!side && h1Trend === 'bearish') {
      const strongH1 = h1Ema8Val < h1Ema20Val && h1Price < h1Ema8Val;
      const emaCrossRecent = emaCrossDown;
      const stochMidFalling = kVal > 25 && kVal < 60 && stochCrossDown;
      const belowVwap = currentPrice < m5Vwap;

      if (strongH1 && emaCrossRecent && stochMidFalling && belowVwap) {
        side = 'SHORT';
        confidence = 45;
        reasons.push(`H1: Tendance forte baissière (EMA8 < EMA20, prix < EMA8) ✓`);
        reasons.push('M5: Croisement EMA8 < EMA20 récent ↓');
        reasons.push(`Stoch: Croisement K↓D en zone médiane (K:${kVal.toFixed(1)})`);

        const vwapDist = (m5Vwap - currentPrice) / currentPrice;
        if (vwapDist > 0.003) { confidence += 5; reasons.push('VWAP M5: bien en-dessous ✓'); }

        const recentVol = m5Candles.slice(-5).reduce((s, c) => s + c.volume, 0) / 5;
        const avgVol = m5Candles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
        if (avgVol > 0 && recentVol > avgVol * 1.5) { confidence += 8; reasons.push('Volume M5 en hausse forte'); }
        else if (avgVol > 0 && recentVol > avgVol * 1.2) { confidence += 4; reasons.push('Volume M5 supérieur'); }

        const h1Spread = Math.abs(h1Ema8Val - h1Ema20Val) / h1Ema20Val;
        if (h1Spread > 0.008) { confidence += 8; reasons.push('H1: Tendance très forte (EMA8/20 très écartées)'); }
        else if (h1Spread > 0.004) { confidence += 4; reasons.push('H1: Tendance forte'); }
      }
    }

    // Types C, D, E, F removed — only Type A and Type B kept for scalp v3
  }

  if (!side) {
    console.log(`[ScalpAlert] ⏭️ ${symbol} rejected: no Suivi de Flux signal (H1=${h1Trend}, 4H=${h4Trend}, EMA8>${m5Ema8Val.toFixed(2)}, EMA20>${m5Ema20Val.toFixed(2)}, StochK=${kVal.toFixed(1)}, VWAP=${m5Vwap.toFixed(2)})`);
    return null;
  }

  // ─── "Move Already Advanced" Filter ───
  // Check last 12 M5 candles (~60 min). If price has already moved >2% in the signal
  // direction, the move is likely already advanced and entry is late → penalize confidence.
  const lookbackCandles = Math.min(12, m5Candles.length);
  const priceAgo = m5Candles[m5Candles.length - lookbackCandles].close;
  const movePercent = ((currentPrice - priceAgo) / priceAgo) * 100;
  const ADVANCED_MOVE_THRESHOLD = 2.0; // 2% threshold

  if (side === 'LONG' && movePercent > ADVANCED_MOVE_THRESHOLD) {
    confidence -= 20;
    reasons.push(`⚠️ Mouvement déjà avancé (+${movePercent.toFixed(1)}% en 60min) — pénalité -20%`);
    console.log(`[ScalpAlert] ⚠️ ${symbol} LONG: move already advanced +${movePercent.toFixed(1)}% in ~60min, confidence -20`);
  } else if (side === 'SHORT' && movePercent < -ADVANCED_MOVE_THRESHOLD) {
    confidence -= 20;
    reasons.push(`⚠️ Mouvement déjà avancé (${movePercent.toFixed(1)}% en 60min) — pénalité -20%`);
    console.log(`[ScalpAlert] ⚠️ ${symbol} SHORT: move already advanced ${movePercent.toFixed(1)}% in ~60min, confidence -20`);
  }

  // Apply 4H neutral penalty
  confidence -= h4NeutralPenalty;

  // Daily trend penalty — penalize confidence when Daily conflicts (don't reject)
  let d1Penalty = 0;
  if (side === 'LONG' && d1Trend === 'bearish') {
    d1Penalty = 12;
    reasons.push(`⚠️ Daily Bearish — pénalité confiance -${d1Penalty}%`);
  } else if (side === 'SHORT' && d1Trend === 'bullish') {
    d1Penalty = 12;
    reasons.push(`⚠️ Daily Bullish — pénalité confiance -${d1Penalty}%`);
  } else if (side === 'LONG' && d1Trend === 'bullish') {
    d1Penalty = -5;
    reasons.push(`✅ Daily Bullish — bonus alignement +5%`);
  } else if (side === 'SHORT' && d1Trend === 'bearish') {
    d1Penalty = -5;
    reasons.push(`✅ Daily Bearish — bonus alignement +5%`);
  }
  confidence -= d1Penalty;

  confidence = Math.min(98, Math.max(25, confidence));

  // ─── SL / TP Calculation — v2: ATR-based SL + conservative TP ───
  let entry = currentPrice;
  let stopLoss, tp1, tp2, tp3;

  // v2: ATR-based SL (1.5x ATR M5, min 1%, max 3%)
  let slDist;
  const atrM5 = calcATR_M5(m5Candles);
  if (atrM5 && atrM5 > 0) {
    slDist = atrM5 * 1.5;
    const minSl = entry * 0.01;
    const maxSl = entry * 0.03;
    slDist = Math.max(minSl, Math.min(slDist, maxSl));
  } else {
    // Fallback
    const last10 = m5Candles.slice(-10);
    if (side === 'LONG') {
      const lowestLow = Math.min(...last10.map(c => c.low));
      slDist = Math.max(entry - lowestLow, entry * 0.01);
    } else {
      const highestHigh = Math.max(...last10.map(c => c.high));
      slDist = Math.max(highestHigh - entry, entry * 0.01);
    }
    slDist = Math.max(entry * 0.01, Math.min(slDist, entry * 0.03));
  }

  if (side === 'LONG') {
    stopLoss = entry - slDist;
    if (Math.abs(entry - stopLoss) / entry < 0.01) stopLoss = entry * 0.99;
  } else {
    stopLoss = entry + slDist;
    if (Math.abs(stopLoss - entry) / entry < 0.01) stopLoss = entry * 1.01;
  }

  slDist = Math.abs(entry - stopLoss);

  // v3: Adjusted TP ratios for scalp
  if (side === 'LONG') {
    tp1 = entry + slDist * 0.5;  // 0.5:1 — quick profit
    tp2 = entry + slDist * 1.0;  // 1:1
    tp3 = entry + slDist * 1.8;  // 1.8:1
  } else {
    tp1 = entry - slDist * 0.5;
    tp2 = entry - slDist * 1.0;
    tp3 = entry - slDist * 1.8;
  }

  // SL too tight penalty (now 0.8% threshold)
  if (slDist / entry < 0.008) confidence -= 10;
  confidence = Math.min(98, Math.max(25, confidence));

  const rr = slDist > 0 ? Math.round((Math.abs(tp2 - entry) / slDist) * 10) / 10 : 1.5;

  return {
    symbol,
    name: symbol.replace('USDT', ''),
    side,
    entry,
    stopLoss,
    tp1, tp2, tp3,
    rr,
    confidence,
    reason: reasons.join(' | '),
    stoch_k: kVal,
    stoch_d: dVal,
    ema8_m5: m5Ema8Val,
    ema20_m5: m5Ema20Val,
    ema8_h1: h1Ema8Val,
    ema20_h1: h1Ema20Val,
    vwap_m5: m5Vwap,
    vwap_h1: h1Vwap,
    h1_trend: h1Trend,
    h4_trend: h4Trend,
    ema8_h4: h4Ema8Val,
    ema20_h4: h4Ema20Val,
    d1_trend: d1Trend,
    ema8_d1: d1Ema8Val,
    ema20_d1: d1Ema20Val,
    currentPrice,
  };
}

// ─── Check and send Scalp alerts ───
async function checkAndSendScalpAlerts() {
  const config = loadTelegramAlerts();
  if (!config.enabled) return [];

  const sentAlerts = [];
  const now = new Date();
  const nowStr = now.toLocaleString('fr-CA', { timeZone: 'America/Montreal' });
  const cooldowns = loadScalpCooldowns();

  try {
    // Dynamically fetch top 200 symbols (cached 1h)
    const symbols = await fetchTop200USDTSymbols();
    SCALP_SYMBOLS = symbols; // Update global reference
    console.log(`[ScalpAlert] 📡 Analyzing ${symbols.length} symbols for scalp setups...`);

    const setups = [];
    // Process symbols in batches of 10 to balance speed vs rate limits
    const BATCH_SIZE = 10;
    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(sym => generateScalpSetup(sym)));
      for (const setup of results) {
        if (setup) setups.push(setup);
      }
      // Delay between batches to respect Binance rate limits
      if (i + BATCH_SIZE < symbols.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`[ScalpAlert] Generated ${setups.length} scalp setups`);
    // Debug: log all setup confidences
    if (setups.length > 0) {
      const confValues = setups.map(s => `${s.symbol}:${s.confidence}%${s.side}`);
      console.log(`[ScalpAlert] Setup confidences: ${confValues.join(", ")}`);
    }

    // Filter: only send signals with confidence >= 88% (high-quality signals only)
    const MIN_CONFIDENCE = 88;
    const qualifiedSetups = setups.filter(s => s.confidence >= MIN_CONFIDENCE);
    console.log(`[ScalpAlert] After confidence filter (>=${MIN_CONFIDENCE}%): ${qualifiedSetups.length} setups`);

    // Sort by confidence descending
    qualifiedSetups.sort((a, b) => b.confidence - a.confidence);

    console.log(`[ScalpAlert] Starting to send ${qualifiedSetups.length} scalp alerts to Telegram...`);

    for (let idx = 0; idx < qualifiedSetups.length; idx++) {
      const setup = qualifiedSetups[idx];
      try {
        if (isScalpCooldownActive(cooldowns, setup.symbol, setup.side)) {
          console.log(`[ScalpAlert] 🛑 Cooldown active for ${setup.symbol} ${setup.side}, skipping`);
          continue;
        }

        console.log(`[ScalpAlert] 📤 Sending ${idx + 1}/${qualifiedSetups.length}: ${setup.symbol} ${setup.side} (${setup.confidence}%)...`);

        // ─── Pre-send trend coherence validation ───
        if ((setup.side === 'LONG' && setup.h1_trend !== 'bullish') || (setup.side === 'SHORT' && setup.h1_trend !== 'bearish')) {
          console.log(`[ScalpAlert] ⚠️ PRE-SEND VALIDATION FAILED for ${setup.symbol}: side=${setup.side} but h1_trend=${setup.h1_trend} — SKIPPING`);
          continue;
        }

        const dirEmoji = setup.side === 'LONG' ? '🟢 LONG' : '🔴 SHORT';

        const pctTP1 = ((setup.tp1 - setup.entry) / setup.entry * 100);
        const pctTP2 = ((setup.tp2 - setup.entry) / setup.entry * 100);
        const pctTP3 = ((setup.tp3 - setup.entry) / setup.entry * 100);
        const pctSL = ((setup.stopLoss - setup.entry) / setup.entry * 100);

        const trendEmoji = setup.h1_trend === 'bullish' ? '🟢 Haussière' : setup.h1_trend === 'bearish' ? '🔴 Baissière' : '⚪ Neutre';
        const h4TrendEmoji = setup.h4_trend === 'bullish' ? '🟢 Haussière' : setup.h4_trend === 'bearish' ? '🔴 Baissière' : '⚪ Neutre';
        const d1TrendEmoji = setup.d1_trend === 'bullish' ? '🟢 Haussière' : setup.d1_trend === 'bearish' ? '🔴 Baissière' : '⚪ Neutre';

        // Escape HTML entities in reason text to prevent Telegram parse errors
        const safeReason = (setup.reason || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const text = `🔴🔴🔴 <b>⚡ SCALP TRADING — SIGNAL CRYPTO</b> 🔴🔴🔴
🌐 https://CryptoIA.ca
📊 Entry sur le timeframe <b>M5</b> | Biais directionnel : <b>H1</b> + <b>4H</b>
━━━━━━━━━━━━━━━━━━━━━

${dirEmoji} — <b>${setup.name}</b> (${setup.symbol})

📐 <b>Indicateurs :</b>
├ EMA 8 M5 : <b>$${formatPrice(setup.ema8_m5)}</b>
├ EMA 20 M5 : <b>$${formatPrice(setup.ema20_m5)}</b>
├ VWAP M5 : <b>$${formatPrice(setup.vwap_m5)}</b>
├ Stoch K : <b>${setup.stoch_k.toFixed(1)}</b>
├ Stoch D : <b>${setup.stoch_d.toFixed(1)}</b>
├ EMA 20 H1 : <b>$${formatPrice(setup.ema20_h1)}</b>
├ VWAP H1 : <b>$${formatPrice(setup.vwap_h1)}</b>
├ Tendance H1 : ${trendEmoji}
├ Tendance 4H : ${h4TrendEmoji}${setup.ema8_h4 != null ? ` (EMA8: $${formatPrice(setup.ema8_h4)}, EMA20: $${formatPrice(setup.ema20_h4)})` : ''}
└ Tendance Daily : ${d1TrendEmoji}${setup.ema8_d1 != null ? ` (EMA8: $${formatPrice(setup.ema8_d1)}, EMA20: $${formatPrice(setup.ema20_d1)})` : ''}

🎯 <b>Plan de Trade :</b>
├ Entry : <b>$${formatPrice(setup.entry)}</b>
├ TP1 : <b>$${formatPrice(setup.tp1)}</b> (${pctTP1 >= 0 ? '+' : ''}${pctTP1.toFixed(2)}%)
├ TP2 : <b>$${formatPrice(setup.tp2)}</b> (${pctTP2 >= 0 ? '+' : ''}${pctTP2.toFixed(2)}%)
├ TP3 : <b>$${formatPrice(setup.tp3)}</b> (${pctTP3 >= 0 ? '+' : ''}${pctTP3.toFixed(2)}%)
└ SL : <b>$${formatPrice(setup.stopLoss)}</b> (${pctSL >= 0 ? '+' : ''}${pctSL.toFixed(2)}%)

⚖️ Risk/Reward : <b>1:${setup.rr}</b>
🧠 Confiance : <b>${setup.confidence}%</b>

📋 <b>Raison :</b>
<i>${safeReason}</i>

⏰ Timeframe : M5 — ${nowStr} (Montréal)
⚠️ <i>Scalp trade — Ceci n'est pas un conseil financier. DYOR.</i>`;

        const result = await sendTelegramMessage(text);
        console.log(`[ScalpAlert] Telegram response for ${setup.symbol}: ok=${result.ok}, desc=${result.description || 'none'}`);

        if (result.ok) {
          setScalpCooldown(cooldowns, setup.symbol, setup.side);
          saveScalpCooldowns(cooldowns);

          // Auto-register as scalp call
          try {
            const calls = loadScalpCalls();
            scalpCallIdCounter++;
            const expiresAt = new Date(now.getTime() + 45 * 60 * 1000); // 45 minutes for scalp v3
            calls.push({
              id: scalpCallIdCounter,
              symbol: setup.symbol, side: setup.side,
              entry_price: setup.entry, stop_loss: setup.stopLoss,
              trailing_sl: setup.stopLoss, // Initially same as stop_loss
              tp1: setup.tp1, tp2: setup.tp2, tp3: setup.tp3,
              confidence: setup.confidence, reason: setup.reason,
              stoch_k: setup.stoch_k, stoch_d: setup.stoch_d,
              ema8_m5: setup.ema8_m5, ema20_m5: setup.ema20_m5,
              vwap_m5: setup.vwap_m5, vwap_h1: setup.vwap_h1,
              h1_trend: setup.h1_trend,
              rr: setup.rr, status: 'active',
              tp1_hit: false, tp2_hit: false, tp3_hit: false, sl_hit: false,
              best_tp_reached: 0, exit_price: null, profit_pct: null,
              created_at: now.toISOString(), resolved_at: null,
              expires_at: expiresAt.toISOString(),
            });
            saveScalpCalls(calls);
            console.log(`[ScalpAlert] Auto-registered scalp call #${scalpCallIdCounter}`);
          } catch (regErr) {
            console.error('[ScalpAlert] Failed to auto-register scalp call:', regErr);
          }

          sentAlerts.push({
            type: 'scalp_signal',
            symbol: setup.symbol,
            direction: setup.side,
            rr: setup.rr,
            entry: setup.entry,
            confidence: setup.confidence,
          });
          console.log(`[ScalpAlert] ✅ Sent ${setup.side} scalp signal for ${setup.name} (confidence: ${setup.confidence}%)`);

          await new Promise(r => setTimeout(r, 2000));
        } else {
          console.error(`[ScalpAlert] ❌ Failed to send ${setup.symbol}: ${result.description || JSON.stringify(result)}`);
        }
      } catch (sendErr) {
        console.error(`[ScalpAlert] ❌ Exception sending ${setup.symbol}:`, sendErr.message || sendErr);
      }
    }

    console.log(`[ScalpAlert] Finished sending loop. Total sent: ${sentAlerts.length}`);
  } catch (err) {
    console.error('[ScalpAlert] Check error:', err);
  }

  return sentAlerts;
}

// ─── Periodic scalp alert checker (every 3 minutes) ───
let scalpAlertInterval = null;

function startScalpAlertChecker() {
  const config = loadTelegramAlerts();
  if (scalpAlertInterval) clearInterval(scalpAlertInterval);
  if (config.enabled) {
    const interval = 3 * 60 * 1000; // 3 minutes for scalp
    console.log(`[ScalpAlert] Scalp alert checker started — checking every ${interval / 1000}s`);
    scalpAlertInterval = setInterval(async () => {
      console.log('[ScalpAlert] Running periodic scalp alert check...');
      const alerts = await checkAndSendScalpAlerts();
      if (alerts.length > 0) {
        console.log(`[ScalpAlert] Sent ${alerts.length} scalp alerts`);
      }
    }, interval);
    // Run initial check after 30s delay (let swing alerts go first)
    setTimeout(() => {
      checkAndSendScalpAlerts().then(alerts => {
        if (alerts.length > 0) console.log(`[ScalpAlert] Initial check sent ${alerts.length} scalp alerts`);
      });
    }, 30000);
  }
}

// Start scalp checker on boot if enabled
startScalpAlertChecker();

// ─── POST /api/telegram/scalp-toggle — Enable/disable scalp alerts specifically ───
app.post('/api/telegram/scalp-toggle', (req, res) => {
  const { enabled } = req.body;
  if (enabled) {
    startScalpAlertChecker();
  } else if (scalpAlertInterval) {
    clearInterval(scalpAlertInterval);
    scalpAlertInterval = null;
    console.log('[ScalpAlert] Scalp alert checker stopped');
  }
  res.json({ success: true, scalp_alerts_enabled: !!enabled });
});

// ─── POST /api/telegram/scalp-check — Force a manual scalp alert check ───
app.post('/api/telegram/scalp-check', async (req, res) => {
  try {
    const alerts = await checkAndSendScalpAlerts();
    res.json({ success: true, alerts_sent: alerts.length, alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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
    const { plan, amount_cad, billing_period = 'monthly', promo_code } = req.body;

    if (!plan || !amount_cad) {
      return res.status(400).json({ error: 'plan et amount_cad requis' });
    }

    const host = getFrontendHost(req);
    const isAnnual = billing_period === 'annual';
    const amountCents = Math.round(amount_cad * 100);
    const interval = isAnnual ? 'year' : 'month';

    let label = PLAN_LABELS[plan] || `Abonnement ${plan.charAt(0).toUpperCase() + plan.slice(1)} — CryptoIA`;
    if (isAnnual) label += ' (Annuel)';

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
      success_url: `${host}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}&billing=${billing_period}`,
      cancel_url: `${host}/abonnements`,
      metadata: { plan, billing_period },
      allow_promotion_codes: true,
    });

    console.log(`[Payment] Stripe session created: ${session.id} for plan=${plan}, billing=${billing_period}`);
    res.json({ session_id: session.id, url: session.url });
  } catch (err) {
    console.error('[Payment] Stripe create session error:', err);
    const message = err?.raw?.message || err?.message || 'Erreur Stripe';
    res.status(400).json({ error: message });
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

// ─── POST /api/v1/payment/stripe_webhook ───
app.post('/api/v1/payment/stripe_webhook', async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const sig = req.headers['stripe-signature'] || '';

  let event;
  try {
    if (webhookSecret && sig && STRIPE_SECRET_KEY) {
      const stripe = await getStripeInstance();
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Dev mode: parse body directly
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (Buffer.isBuffer(event)) event = JSON.parse(event.toString());
    }
  } catch (err) {
    console.error('[Payment] Stripe webhook signature error:', err.message);
    return res.status(401).json({ error: 'Signature invalide' });
  }

  const eventType = event.type || event?.type;
  console.log(`[Payment] Stripe webhook event: ${eventType}`);

  if (eventType === 'checkout.session.completed') {
    const session = event.data?.object || {};
    const metadata = session.metadata || {};
    console.log(`[Payment] ✅ checkout.session.completed: plan=${metadata.plan}, billing=${metadata.billing_period}, email=${session.customer_details?.email}`);
  } else if (eventType === 'invoice.payment_succeeded') {
    const invoice = event.data?.object || {};
    console.log(`[Payment] ✅ invoice.payment_succeeded: subscription=${invoice.subscription}`);
  } else if (eventType === 'customer.subscription.deleted') {
    const sub = event.data?.object || {};
    console.log(`[Payment] ❌ subscription.deleted: customer=${sub.customer}`);
  }

  res.json({ status: 'ok' });
});

// ============================================================
// NOWPayments API Routes
// ============================================================

// ─── POST /api/v1/nowpayments/create_payment ───
app.post('/api/v1/nowpayments/create_payment', async (req, res) => {
  const apiKey = NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'NOWPayments non configuré — ajoutez NOWPAYMENTS_API_KEY dans Railway' });
  }

  try {
    const { plan, amount_cad, user_email } = req.body;
    if (!plan || !amount_cad) {
      return res.status(400).json({ error: 'plan et amount_cad requis' });
    }

    const host = getFrontendHost(req);
    const label = PLAN_LABELS[plan] || `Abonnement ${plan.charAt(0).toUpperCase() + plan.slice(1)} — CryptoIA`;
    const orderId = `cryptoia_${plan}_${Date.now()}`;

    const payload = {
      price_amount: Math.round(amount_cad * 100) / 100,
      price_currency: 'cad',
      order_id: orderId,
      order_description: label,
      ipn_callback_url: `${host}/api/v1/nowpayments/webhook`,
      success_url: `${host}/payment-success?provider=nowpayments&plan=${plan}&order_id=${orderId}`,
      cancel_url: `${host}/abonnements`,
      is_fixed_rate: true,
      is_fee_paid_by_user: false,
    };

    if (user_email) {
      payload.customer_email = user_email;
    }

    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ message: response.statusText }));
      console.error(`[NOWPayments] Error ${response.status}:`, errData);
      return res.status(400).json({ error: errData.message || 'Erreur NOWPayments' });
    }

    const result = await response.json();
    console.log(`[NOWPayments] Invoice created: id=${result.id}, order_id=${orderId}, plan=${plan}`);

    res.json({
      payment_url: result.invoice_url || '',
      payment_id: String(result.id || ''),
    });
  } catch (err) {
    console.error('[NOWPayments] create_payment error:', err);
    res.status(500).json({ error: `Erreur interne: ${err.message}` });
  }
});

// ─── POST /api/v1/nowpayments/webhook ───
app.post('/api/v1/nowpayments/webhook', async (req, res) => {
  const payload = req.body;
  const paymentStatus = payload?.payment_status || '';
  const orderId = payload?.order_id || '';
  const paymentId = String(payload?.payment_id || '');

  console.log(`[NOWPayments] IPN: payment_id=${paymentId}, status=${paymentStatus}, order_id=${orderId}`);

  // Extract plan from order_id (format: cryptoia_{plan}_{timestamp})
  let plan = 'unknown';
  if (orderId.startsWith('cryptoia_')) {
    const parts = orderId.split('_');
    if (parts.length >= 2) plan = parts[1];
  }

  if (paymentStatus === 'finished' || paymentStatus === 'confirmed') {
    console.log(`[NOWPayments] ✅ Payment CONFIRMED: plan=${plan}, order_id=${orderId}`);
  } else if (paymentStatus === 'partially_paid') {
    console.log(`[NOWPayments] ⚠️ Partially paid: plan=${plan}, order_id=${orderId}`);
  } else if (['failed', 'refunded', 'expired'].includes(paymentStatus)) {
    console.log(`[NOWPayments] ❌ Payment ${paymentStatus}: plan=${plan}, order_id=${orderId}`);
  }

  res.json({ status: 'ok', payment_id: paymentId, plan, payment_status: paymentStatus });
});

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

// ============================================================
// Trade Calls — JSON file persistence (mirrors backend for standalone mode)
// ============================================================
const TRADE_CALLS_FILE = path.join(DATA_DIR, 'trade_calls.json');

function loadTradeCalls() {
  try {
    if (existsSync(TRADE_CALLS_FILE)) {
      return JSON.parse(readFileSync(TRADE_CALLS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading trade calls:', err);
  }
  // Initialize file if missing
  try {
    writeFileSync(TRADE_CALLS_FILE, '[]', 'utf-8');
    console.log('[TradeCall] Initialized empty trade_calls.json');
  } catch (_e) { /* ignore */ }
  return [];
}

function saveTradeCalls(calls) {
  try {
    writeFileSync(TRADE_CALLS_FILE, JSON.stringify(calls, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving trade calls:', err);
  }
}

let tradeCallIdCounter = 0;
// Initialize counter from existing data
try {
  const existingCalls = loadTradeCalls();
  if (existingCalls.length > 0) {
    tradeCallIdCounter = Math.max(...existingCalls.map(c => c.id || 0));
  }
} catch (_e) { /* ignore */ }

// ─── POST /api/v1/trade-calls — Record a new call (with dedup) ───
app.post('/api/v1/trade-calls', (req, res) => {
  const { symbol, side, entry_price, stop_loss, tp0, tp1, tp2, tp3, confidence, reason, rsi4h, has_convergence, rr } = req.body;

  if (!symbol || !side || !entry_price) {
    return res.status(400).json({ created: false, message: 'symbol, side, entry_price requis' });
  }

  const calls = loadTradeCalls();
  const cutoff = Date.now() - 4 * 60 * 60 * 1000; // 4 hours ago

  // Dedup: same symbol+side within 4h
  const dup = calls.find(c =>
    c.symbol === symbol &&
    c.side === side &&
    new Date(c.created_at).getTime() >= cutoff
  );

  if (dup) {
    return res.json({ created: false, message: 'Duplicate call (same symbol/side within 4h)', id: dup.id });
  }

  tradeCallIdCounter++;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const newCall = {
    id: tradeCallIdCounter,
    symbol,
    side,
    entry_price,
    stop_loss,
    tp0: tp0 || null,
    tp1,
    tp2,
    tp3,
    confidence,
    reason: reason || '',
    rsi4h: rsi4h || null,
    has_convergence: !!has_convergence,
    rr: rr || null,
    status: 'active',
    trailing_sl: stop_loss, // Initially same as stop_loss, updated when TP1/TP2 hit
    tp0_hit: false,
    tp1_hit: false,
    tp2_hit: false,
    tp3_hit: false,
    sl_hit: false,
    best_tp_reached: 0,
    exit_price: null,
    profit_pct: null,
    created_at: now.toISOString(),
    resolved_at: null,
    expires_at: expiresAt.toISOString(),
  };

  calls.push(newCall);
  saveTradeCalls(calls);
  console.log(`[TradeCall] Created call #${newCall.id}: ${symbol} ${side} @ ${entry_price}`);

  res.json({ created: true, id: newCall.id });
});

// ─── GET /api/v1/trade-calls — List calls ───
app.get('/api/v1/trade-calls', (req, res) => {
  const { status: filterStatus, limit = '100', offset = '0' } = req.query;
  let calls = loadTradeCalls();

  if (filterStatus) {
    calls = calls.filter(c => c.status === filterStatus);
  }

  // Sort by created_at descending
  calls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const lim = Math.min(parseInt(limit) || 100, 500);
  const off = parseInt(offset) || 0;
  calls = calls.slice(off, off + lim);

  res.json(calls);
});

// ─── GET /api/v1/trade-calls/stats — Performance statistics ───
app.get('/api/v1/trade-calls/stats', (req, res) => {
  const calls = loadTradeCalls();
  const total = calls.length;
  const activeCalls = calls.filter(c => c.status === 'active').length;
  const resolvedCalls = calls.filter(c => c.status === 'resolved').length;
  const expiredCalls = calls.filter(c => c.status === 'expired').length;

  const closedCalls = calls.filter(c => c.status === 'resolved' || c.status === 'expired');
  const totalClosed = closedCalls.length;

  let wins = 0, tp0Hits = 0, tp1Hits = 0, tp2Hits = 0, tp3Hits = 0, slHits = 0;
  let longWins = 0, longTotal = 0, shortWins = 0, shortTotal = 0;
  let totalProfit = 0;
  const profits = [];
  const confBuckets = {
    low: { wins: 0, total: 0 },
    mid: { wins: 0, total: 0 },
    high: { wins: 0, total: 0 },
    very_high: { wins: 0, total: 0 },
  };
  const weeklyData = {};

  for (const c of closedCalls) {
    // Win = TP1 was hit (trailing stop protects at breakeven, so even if SL hit after TP1, it's a win/breakeven)
    const isWin = c.tp1_hit;
    if (isWin) wins++;
    if (c.tp0_hit) tp0Hits++;
    if (c.tp1_hit) tp1Hits++;
    if (c.tp2_hit) tp2Hits++;
    if (c.tp3_hit) tp3Hits++;
    if (c.sl_hit) slHits++;

    // Profit calculation: if TP1 hit + SL hit → breakeven (0%), not negative
    let effectiveProfit = c.profit_pct;
    if (c.tp1_hit && c.sl_hit && (effectiveProfit == null || effectiveProfit < 0)) {
      effectiveProfit = 0; // Trailing stop protected at breakeven
    }
    if (effectiveProfit != null) {
      totalProfit += effectiveProfit;
      profits.push(effectiveProfit);
    }

    if (c.side === 'LONG') {
      longTotal++;
      if (isWin) longWins++;
    } else {
      shortTotal++;
      if (isWin) shortWins++;
    }

    // Confidence bucket
    let bucket;
    if (c.confidence < 50) bucket = 'low';
    else if (c.confidence < 65) bucket = 'mid';
    else if (c.confidence < 80) bucket = 'high';
    else bucket = 'very_high';
    confBuckets[bucket].total++;
    if (isWin) confBuckets[bucket].wins++;

    // Weekly
    if (c.created_at) {
      const d = new Date(c.created_at);
      const weekNum = getWeekNumber(d);
      const weekKey = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      if (!weeklyData[weekKey]) weeklyData[weekKey] = { wins: 0, total: 0 };
      weeklyData[weekKey].total++;
      if (isWin) weeklyData[weekKey].wins++;
    }
  }

  const winRate = totalClosed > 0 ? Math.round(wins / totalClosed * 1000) / 10 : 0;
  const avgProfit = profits.length > 0 ? Math.round(totalProfit / profits.length * 100) / 100 : 0;

  const weeklySorted = Object.keys(weeklyData).sort().map(wk => ({
    week: wk,
    wins: weeklyData[wk].wins,
    total: weeklyData[wk].total,
    win_rate: weeklyData[wk].total > 0 ? Math.round(weeklyData[wk].wins / weeklyData[wk].total * 1000) / 10 : 0,
  }));

  const safeRate = (w, t) => t > 0 ? Math.round(w / t * 1000) / 10 : 0;

  res.json({
    total_calls: total,
    active_calls: activeCalls,
    resolved_calls: resolvedCalls,
    expired_calls: expiredCalls,
    win_rate: winRate,
    tp0_rate: safeRate(tp0Hits, totalClosed),
    tp1_rate: safeRate(tp1Hits, totalClosed),
    tp2_rate: safeRate(tp2Hits, totalClosed),
    tp3_rate: safeRate(tp3Hits, totalClosed),
    sl_rate: safeRate(slHits, totalClosed),
    avg_profit_pct: avgProfit,
    long_win_rate: safeRate(longWins, longTotal),
    short_win_rate: safeRate(shortWins, shortTotal),
    long_total: longTotal,
    short_total: shortTotal,
    confidence_buckets: {
      '<50%': { win_rate: safeRate(confBuckets.low.wins, confBuckets.low.total), total: confBuckets.low.total },
      '50-65%': { win_rate: safeRate(confBuckets.mid.wins, confBuckets.mid.total), total: confBuckets.mid.total },
      '65-80%': { win_rate: safeRate(confBuckets.high.wins, confBuckets.high.total), total: confBuckets.high.total },
      '>80%': { win_rate: safeRate(confBuckets.very_high.wins, confBuckets.very_high.total), total: confBuckets.very_high.total },
    },
    weekly_win_rate: weeklySorted,
  });
});

// Helper: get ISO week number
function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

// ─── POST /api/v1/trade-calls/reset — Reset all trade calls ───
app.post('/api/v1/trade-calls/reset', (req, res) => {
  const { confirm } = req.body || {};
  if (!confirm) {
    return res.status(400).json({ error: 'Missing { "confirm": true } in request body' });
  }
  try {
    saveTradeCalls([]);
    tradeCallIdCounter = 0;
    console.log('[TradeCall] All trade calls have been reset');
    res.json({ reset: true, message: 'Toutes les données de performance swing ont été réinitialisées.' });
  } catch (err) {
    console.error('[TradeCall] Reset error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/v1/trade-calls/resolve — Check active calls vs Binance prices ───
app.post('/api/v1/trade-calls/resolve', async (req, res) => {
  try {
    const result = await resolveActiveTradeCalls();
    res.json(result);
  } catch (err) {
    console.error('[TradeCall] Resolve error:', err);
    res.status(500).json({ error: err.message });
  }
});

async function resolveActiveTradeCalls() {
  const calls = loadTradeCalls();
  const activeCalls = calls.filter(c => c.status === 'active');

  if (activeCalls.length === 0) {
    return { resolved: 0, expired: 0, checked: 0 };
  }

  // Unique symbols
  const symbols = [...new Set(activeCalls.map(c => c.symbol))];

  // Fetch prices from Binance (with Bybit fallback)
  const prices = {};
  for (const sym of symbols) {
    try {
      // If known Bybit symbol, go directly to Bybit
      if (BYBIT_FALLBACK_SYMBOLS.has(sym)) {
        const bybitPrice = await fetchBybitPrice(sym);
        if (bybitPrice != null) { prices[sym] = bybitPrice; continue; }
      }
      const resp = await fetch(`https://data-api.binance.vision/api/v3/ticker/price?symbol=${sym}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (resp.ok) {
        const data = await resp.json();
        prices[sym] = parseFloat(data.price);
      } else {
        // Binance failed, try Bybit
        const bybitPrice = await fetchBybitPrice(sym);
        if (bybitPrice != null) {
          prices[sym] = bybitPrice;
          BYBIT_FALLBACK_SYMBOLS.add(sym);
        }
      }
    } catch (err) {
      console.warn(`[TradeCall] Failed to fetch price for ${sym}:`, err.message);
      // Try Bybit on network error
      try {
        const bybitPrice = await fetchBybitPrice(sym);
        if (bybitPrice != null) { prices[sym] = bybitPrice; }
      } catch (_e) { /* skip */ }
    }
  }

  const now = new Date();
  let resolvedCount = 0;
  let expiredCount = 0;

  for (const call of activeCalls) {
    // Check expiry — if expired and TP1 was hit, count as breakeven win
    if (call.expires_at && new Date(call.expires_at) <= now) {
      call.status = 'expired';
      call.resolved_at = now.toISOString();
      if (call.tp1_hit) {
        // TP1 was hit before expiry → trailing stop protected at breakeven
        call.exit_price = call.entry_price;
        call.profit_pct = 0;
      }
      expiredCount++;
      console.log(`[TradeCall] Call #${call.id} ${call.symbol} expired (tp1_hit: ${call.tp1_hit})`);
      continue;
    }

    const currentPrice = prices[call.symbol];
    if (currentPrice == null) continue;

    // Initialize trailing_sl if not set
    if (call.trailing_sl == null) {
      call.trailing_sl = call.stop_loss;
    }

    if (call.side === 'LONG') {
      // First check TP hits (before SL check, so trailing SL updates first)
      if (call.tp0 && currentPrice >= call.tp0) call.tp0_hit = true;

      if (currentPrice >= call.tp1 && !call.tp1_hit) {
        call.tp0_hit = true;
        call.tp1_hit = true;
        call.best_tp_reached = Math.max(call.best_tp_reached, 1);
        // Trailing stop: move SL to breakeven (entry price)
        call.trailing_sl = call.entry_price;
        console.log(`[TradeCall] Call #${call.id} ${call.symbol} LONG TP1 hit — trailing SL moved to breakeven ${call.entry_price}`);
      } else if (currentPrice >= call.tp1) {
        call.best_tp_reached = Math.max(call.best_tp_reached, 1);
      }

      if (currentPrice >= call.tp2 && !call.tp2_hit) {
        call.tp2_hit = true;
        call.best_tp_reached = Math.max(call.best_tp_reached, 2);
        // Trailing stop: move SL to TP1
        call.trailing_sl = call.tp1;
        console.log(`[TradeCall] Call #${call.id} ${call.symbol} LONG TP2 hit — trailing SL moved to TP1 ${call.tp1}`);
      } else if (currentPrice >= call.tp2) {
        call.best_tp_reached = Math.max(call.best_tp_reached, 2);
      }

      if (currentPrice >= call.tp3) {
        call.tp3_hit = true;
        call.best_tp_reached = Math.max(call.best_tp_reached, 3);
        call.status = 'resolved';
        call.exit_price = currentPrice;
        call.profit_pct = Math.round((currentPrice - call.entry_price) / call.entry_price * 10000) / 100;
        call.resolved_at = now.toISOString();
        resolvedCount++;
        console.log(`[TradeCall] Call #${call.id} ${call.symbol} LONG TP3 hit — resolved +${call.profit_pct}%`);
        continue;
      }

      // Check trailing SL (uses trailing_sl instead of original stop_loss)
      const effectiveSL = call.trailing_sl != null ? call.trailing_sl : call.stop_loss;
      if (currentPrice <= effectiveSL) {
        call.sl_hit = true;
        call.status = 'resolved';
        call.exit_price = currentPrice;
        // If TP1 was already hit, exit at breakeven (entry) not at current price
        if (call.tp1_hit) {
          call.profit_pct = 0; // Breakeven — trailing stop protected
          call.exit_price = call.entry_price;
        } else {
          call.profit_pct = Math.round((currentPrice - call.entry_price) / call.entry_price * 10000) / 100;
        }
        call.resolved_at = now.toISOString();
        resolvedCount++;
        console.log(`[TradeCall] Call #${call.id} ${call.symbol} LONG SL hit (trailing: ${effectiveSL}) — ${call.tp1_hit ? 'breakeven' : call.profit_pct + '%'}`);
        continue;
      }
    } else {
      // SHORT
      if (call.tp0 && currentPrice <= call.tp0) call.tp0_hit = true;

      if (currentPrice <= call.tp1 && !call.tp1_hit) {
        call.tp0_hit = true;
        call.tp1_hit = true;
        call.best_tp_reached = Math.max(call.best_tp_reached, 1);
        // Trailing stop: move SL to breakeven (entry price)
        call.trailing_sl = call.entry_price;
        console.log(`[TradeCall] Call #${call.id} ${call.symbol} SHORT TP1 hit — trailing SL moved to breakeven ${call.entry_price}`);
      } else if (currentPrice <= call.tp1) {
        call.best_tp_reached = Math.max(call.best_tp_reached, 1);
      }

      if (currentPrice <= call.tp2 && !call.tp2_hit) {
        call.tp2_hit = true;
        call.best_tp_reached = Math.max(call.best_tp_reached, 2);
        // Trailing stop: move SL to TP1
        call.trailing_sl = call.tp1;
        console.log(`[TradeCall] Call #${call.id} ${call.symbol} SHORT TP2 hit — trailing SL moved to TP1 ${call.tp1}`);
      } else if (currentPrice <= call.tp2) {
        call.best_tp_reached = Math.max(call.best_tp_reached, 2);
      }

      if (currentPrice <= call.tp3) {
        call.tp3_hit = true;
        call.best_tp_reached = Math.max(call.best_tp_reached, 3);
        call.status = 'resolved';
        call.exit_price = currentPrice;
        call.profit_pct = Math.round((call.entry_price - currentPrice) / call.entry_price * 10000) / 100;
        call.resolved_at = now.toISOString();
        resolvedCount++;
        console.log(`[TradeCall] Call #${call.id} ${call.symbol} SHORT TP3 hit — resolved +${call.profit_pct}%`);
        continue;
      }

      // Check trailing SL
      const effectiveSL = call.trailing_sl != null ? call.trailing_sl : call.stop_loss;
      if (currentPrice >= effectiveSL) {
        call.sl_hit = true;
        call.status = 'resolved';
        call.exit_price = currentPrice;
        if (call.tp1_hit) {
          call.profit_pct = 0; // Breakeven
          call.exit_price = call.entry_price;
        } else {
          call.profit_pct = Math.round((call.entry_price - currentPrice) / call.entry_price * 10000) / 100;
        }
        call.resolved_at = now.toISOString();
        resolvedCount++;
        console.log(`[TradeCall] Call #${call.id} ${call.symbol} SHORT SL hit (trailing: ${effectiveSL}) — ${call.tp1_hit ? 'breakeven' : call.profit_pct + '%'}`);
        continue;
      }
    }
  }

  saveTradeCalls(calls);
  console.log(`[TradeCall] Resolve check: ${activeCalls.length} checked, ${resolvedCount} resolved, ${expiredCount} expired`);
  return { resolved: resolvedCount, expired: expiredCount, checked: activeCalls.length };
}

// ─── Periodic trade call resolver (every 5 minutes — faster for accurate SL/TP tracking) ───
setInterval(async () => {
  try {
    const result = await resolveActiveTradeCalls();
    if (result.resolved > 0 || result.expired > 0) {
      console.log(`[TradeCall] Periodic resolve: ${result.resolved} resolved, ${result.expired} expired`);
    }
  } catch (err) {
    console.error('[TradeCall] Periodic resolve error:', err.message);
  }
}, 5 * 60 * 1000); // 5 minutes

// ============================================================
// Scalp Trading Calls — JSON file persistence
// ============================================================
const SCALP_CALLS_FILE = path.join(DATA_DIR, 'scalp_calls.json');

function loadScalpCalls() {
  try {
    if (existsSync(SCALP_CALLS_FILE)) {
      return JSON.parse(readFileSync(SCALP_CALLS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading scalp calls:', err);
  }
  return [];
}

function saveScalpCalls(calls) {
  try {
    writeFileSync(SCALP_CALLS_FILE, JSON.stringify(calls, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving scalp calls:', err);
  }
}

let scalpCallIdCounter = 0;
try {
  const existingScalpCalls = loadScalpCalls();
  if (existingScalpCalls.length > 0) {
    scalpCallIdCounter = Math.max(...existingScalpCalls.map(c => c.id || 0));
  }
} catch (_e) { /* ignore */ }

// ─── POST /api/v1/scalp-calls — Record a new scalp call ───
app.post('/api/v1/scalp-calls', (req, res) => {
  const { symbol, side, entry_price, stop_loss, tp1, tp2, tp3, confidence, reason, stoch_k, stoch_d, ema8_m5, ema20_m5, vwap_m5, vwap_h1, h1_trend, rr } = req.body;

  if (!symbol || !side || !entry_price) {
    return res.status(400).json({ created: false, message: 'symbol, side, entry_price requis' });
  }

  const calls = loadScalpCalls();
  const cutoff = Date.now() - 45 * 60 * 1000; // 45min dedup for scalp v3

  const dup = calls.find(c =>
    c.symbol === symbol &&
    c.side === side &&
    new Date(c.created_at).getTime() >= cutoff
  );

  if (dup) {
    return res.json({ created: false, message: 'Duplicate scalp call', id: dup.id });
  }

  scalpCallIdCounter++;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 45 * 60 * 1000); // 45min expiry for scalp v3

  const newCall = {
    id: scalpCallIdCounter,
    symbol, side, entry_price, stop_loss, tp1, tp2, tp3, confidence,
    reason: reason || '',
    stoch_k: stoch_k || null,
    stoch_d: stoch_d || null,
    ema8_m5: ema8_m5 || null,
    ema20_m5: ema20_m5 || null,
    vwap_m5: vwap_m5 || null,
    vwap_h1: vwap_h1 || null,
    h1_trend: h1_trend || 'neutral',
    rr: rr || null,
    status: 'active',
    trailing_sl: stop_loss, // Initially same as stop_loss, updated when TP1/TP2 hit
    tp1_hit: false, tp2_hit: false, tp3_hit: false, sl_hit: false,
    best_tp_reached: 0,
    exit_price: null, profit_pct: null,
    created_at: now.toISOString(),
    resolved_at: null,
    expires_at: expiresAt.toISOString(),
  };

  calls.push(newCall);
  saveScalpCalls(calls);
  console.log(`[ScalpCall] Created #${newCall.id}: ${symbol} ${side} @ ${entry_price}`);
  res.json({ created: true, id: newCall.id });
});

// ─── GET /api/v1/scalp-calls — List scalp calls ───
app.get('/api/v1/scalp-calls', (req, res) => {
  const { status: filterStatus, limit = '100', offset = '0' } = req.query;
  let calls = loadScalpCalls();
  if (filterStatus) calls = calls.filter(c => c.status === filterStatus);
  calls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const lim = Math.min(parseInt(limit) || 100, 500);
  const off = parseInt(offset) || 0;
  res.json(calls.slice(off, off + lim));
});

// ─── GET /api/v1/scalp-calls/stats — Performance statistics ───
app.get('/api/v1/scalp-calls/stats', (req, res) => {
  const calls = loadScalpCalls();
  const total = calls.length;
  const activeCalls = calls.filter(c => c.status === 'active').length;
  const resolvedCalls = calls.filter(c => c.status === 'resolved').length;
  const expiredCalls = calls.filter(c => c.status === 'expired').length;

  const closedCalls = calls.filter(c => c.status === 'resolved' || c.status === 'expired');
  const totalClosed = closedCalls.length;

  let wins = 0, tp1Hits = 0, tp2Hits = 0, tp3Hits = 0, slHits = 0;
  let longWins = 0, longTotal = 0, shortWins = 0, shortTotal = 0;
  let totalProfit = 0;
  const profits = [];
  const confBuckets = { low: { wins: 0, total: 0 }, mid: { wins: 0, total: 0 }, high: { wins: 0, total: 0 }, very_high: { wins: 0, total: 0 } };
  const weeklyData = {};

  for (const c of closedCalls) {
    // Win = TP1 was hit (trailing stop protects at breakeven, so even if SL hit after TP1, it's a win/breakeven)
    const isWin = c.tp1_hit;
    if (isWin) wins++;
    if (c.tp1_hit) tp1Hits++;
    if (c.tp2_hit) tp2Hits++;
    if (c.tp3_hit) tp3Hits++;
    if (c.sl_hit) slHits++;

    // Profit calculation: if TP1 hit + SL hit → breakeven (0%), not negative
    let effectiveProfit = c.profit_pct;
    if (c.tp1_hit && c.sl_hit && (effectiveProfit == null || effectiveProfit < 0)) {
      effectiveProfit = 0; // Trailing stop protected at breakeven
    }
    if (effectiveProfit != null) { totalProfit += effectiveProfit; profits.push(effectiveProfit); }

    if (c.side === 'LONG') { longTotal++; if (isWin) longWins++; }
    else { shortTotal++; if (isWin) shortWins++; }

    let bucket;
    if (c.confidence < 50) bucket = 'low';
    else if (c.confidence < 65) bucket = 'mid';
    else if (c.confidence < 80) bucket = 'high';
    else bucket = 'very_high';
    confBuckets[bucket].total++;
    if (isWin) confBuckets[bucket].wins++;

    if (c.created_at) {
      const d = new Date(c.created_at);
      const weekNum = getWeekNumber(d);
      const weekKey = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      if (!weeklyData[weekKey]) weeklyData[weekKey] = { wins: 0, total: 0 };
      weeklyData[weekKey].total++;
      if (isWin) weeklyData[weekKey].wins++;
    }
  }

  const safeRate = (w, t) => t > 0 ? Math.round(w / t * 1000) / 10 : 0;
  const winRate = safeRate(wins, totalClosed);
  const avgProfit = profits.length > 0 ? Math.round(totalProfit / profits.length * 100) / 100 : 0;

  const weeklySorted = Object.keys(weeklyData).sort().map(wk => ({
    week: wk, wins: weeklyData[wk].wins, total: weeklyData[wk].total,
    win_rate: safeRate(weeklyData[wk].wins, weeklyData[wk].total),
  }));

  res.json({
    total_calls: total, active_calls: activeCalls, resolved_calls: resolvedCalls, expired_calls: expiredCalls,
    win_rate: winRate,
    tp1_rate: safeRate(tp1Hits, totalClosed), tp2_rate: safeRate(tp2Hits, totalClosed),
    tp3_rate: safeRate(tp3Hits, totalClosed), sl_rate: safeRate(slHits, totalClosed),
    avg_profit_pct: avgProfit,
    long_win_rate: safeRate(longWins, longTotal), short_win_rate: safeRate(shortWins, shortTotal),
    long_total: longTotal, short_total: shortTotal,
    confidence_buckets: {
      '<50%': { win_rate: safeRate(confBuckets.low.wins, confBuckets.low.total), total: confBuckets.low.total },
      '50-65%': { win_rate: safeRate(confBuckets.mid.wins, confBuckets.mid.total), total: confBuckets.mid.total },
      '65-80%': { win_rate: safeRate(confBuckets.high.wins, confBuckets.high.total), total: confBuckets.high.total },
      '>80%': { win_rate: safeRate(confBuckets.very_high.wins, confBuckets.very_high.total), total: confBuckets.very_high.total },
    },
    weekly_win_rate: weeklySorted,
  });
});

// ─── POST /api/v1/scalp-calls/reset — Reset all scalp calls ───
app.post('/api/v1/scalp-calls/reset', (req, res) => {
  const { confirm } = req.body || {};
  if (!confirm) {
    return res.status(400).json({ error: 'Missing { "confirm": true } in request body' });
  }
  try {
    saveScalpCalls([]);
    scalpCallIdCounter = 0;
    console.log('[ScalpCall] All scalp calls have been reset');
    res.json({ reset: true, message: 'Toutes les données de performance scalp ont été réinitialisées.' });
  } catch (err) {
    console.error('[ScalpCall] Reset error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/v1/scalp-calls/resolve — Check active scalp calls vs Binance ───
app.post('/api/v1/scalp-calls/resolve', async (req, res) => {
  try {
    const result = await resolveActiveScalpCalls();
    res.json(result);
  } catch (err) {
    console.error('[ScalpCall] Resolve error:', err);
    res.status(500).json({ error: err.message });
  }
});

async function resolveActiveScalpCalls() {
  const calls = loadScalpCalls();
  const activeCalls = calls.filter(c => c.status === 'active');
  if (activeCalls.length === 0) return { resolved: 0, expired: 0, checked: 0 };

  const symbols = [...new Set(activeCalls.map(c => c.symbol))];
  const prices = {};
  for (const sym of symbols) {
    try {
      // If known Bybit symbol, go directly to Bybit
      if (BYBIT_FALLBACK_SYMBOLS.has(sym)) {
        const bybitPrice = await fetchBybitPrice(sym);
        if (bybitPrice != null) { prices[sym] = bybitPrice; continue; }
      }
      const resp = await fetch(`https://data-api.binance.vision/api/v3/ticker/price?symbol=${sym}`, { signal: AbortSignal.timeout(8000) });
      if (resp.ok) { const data = await resp.json(); prices[sym] = parseFloat(data.price); }
      else {
        // Binance failed, try Bybit
        const bybitPrice = await fetchBybitPrice(sym);
        if (bybitPrice != null) { prices[sym] = bybitPrice; BYBIT_FALLBACK_SYMBOLS.add(sym); }
      }
    } catch (_e) {
      // Try Bybit on network error
      try {
        const bybitPrice = await fetchBybitPrice(sym);
        if (bybitPrice != null) { prices[sym] = bybitPrice; }
      } catch (__e) { /* skip */ }
    }
  }

  const now = new Date();
  let resolvedCount = 0, expiredCount = 0;

  for (const call of activeCalls) {
    // Check expiry — if expired and TP1 was hit, count as breakeven win
    if (call.expires_at && new Date(call.expires_at) <= now) {
      call.status = 'expired';
      call.resolved_at = now.toISOString();
      if (call.tp1_hit) {
        // TP1 was hit before expiry → trailing stop protected at breakeven
        call.exit_price = call.entry_price;
        call.profit_pct = 0;
      }
      expiredCount++;
      console.log(`[ScalpCall] Call #${call.id} ${call.symbol} expired (tp1_hit: ${call.tp1_hit})`);
      continue;
    }

    const currentPrice = prices[call.symbol];
    if (currentPrice == null) continue;

    // Initialize trailing_sl if not set
    if (call.trailing_sl == null) {
      call.trailing_sl = call.stop_loss;
    }

    if (call.side === 'LONG') {
      // First check TP hits (before SL check, so trailing SL updates first)
      if (currentPrice >= call.tp1 && !call.tp1_hit) {
        call.tp1_hit = true;
        call.best_tp_reached = Math.max(call.best_tp_reached, 1);
        // Trailing stop: move SL to breakeven (entry price)
        call.trailing_sl = call.entry_price;
        console.log(`[ScalpCall] Call #${call.id} ${call.symbol} LONG TP1 hit — trailing SL moved to breakeven ${call.entry_price}`);
      } else if (currentPrice >= call.tp1) {
        call.best_tp_reached = Math.max(call.best_tp_reached, 1);
      }

      if (currentPrice >= call.tp2 && !call.tp2_hit) {
        call.tp2_hit = true;
        call.best_tp_reached = Math.max(call.best_tp_reached, 2);
        // Trailing stop: move SL to TP1
        call.trailing_sl = call.tp1;
        console.log(`[ScalpCall] Call #${call.id} ${call.symbol} LONG TP2 hit — trailing SL moved to TP1 ${call.tp1}`);
      } else if (currentPrice >= call.tp2) {
        call.best_tp_reached = Math.max(call.best_tp_reached, 2);
      }

      if (currentPrice >= call.tp3) {
        call.tp3_hit = true;
        call.best_tp_reached = Math.max(call.best_tp_reached, 3);
        call.status = 'resolved';
        call.exit_price = currentPrice;
        call.profit_pct = Math.round((currentPrice - call.entry_price) / call.entry_price * 10000) / 100;
        call.resolved_at = now.toISOString();
        resolvedCount++;
        console.log(`[ScalpCall] Call #${call.id} ${call.symbol} LONG TP3 hit — resolved +${call.profit_pct}%`);
        continue;
      }

      // Check trailing SL (uses trailing_sl instead of original stop_loss)
      const effectiveSL = call.trailing_sl != null ? call.trailing_sl : call.stop_loss;
      if (currentPrice <= effectiveSL) {
        call.sl_hit = true;
        call.status = 'resolved';
        call.exit_price = currentPrice;
        // If TP1 was already hit, exit at breakeven (entry) not at current price
        if (call.tp1_hit) {
          call.profit_pct = 0; // Breakeven — trailing stop protected
          call.exit_price = call.entry_price;
        } else {
          call.profit_pct = Math.round((currentPrice - call.entry_price) / call.entry_price * 10000) / 100;
        }
        call.resolved_at = now.toISOString();
        resolvedCount++;
        console.log(`[ScalpCall] Call #${call.id} ${call.symbol} LONG SL hit (trailing: ${effectiveSL}) — ${call.tp1_hit ? 'breakeven' : call.profit_pct + '%'}`);
        continue;
      }
    } else {
      // SHORT
      if (currentPrice <= call.tp1 && !call.tp1_hit) {
        call.tp1_hit = true;
        call.best_tp_reached = Math.max(call.best_tp_reached, 1);
        // Trailing stop: move SL to breakeven (entry price)
        call.trailing_sl = call.entry_price;
        console.log(`[ScalpCall] Call #${call.id} ${call.symbol} SHORT TP1 hit — trailing SL moved to breakeven ${call.entry_price}`);
      } else if (currentPrice <= call.tp1) {
        call.best_tp_reached = Math.max(call.best_tp_reached, 1);
      }

      if (currentPrice <= call.tp2 && !call.tp2_hit) {
        call.tp2_hit = true;
        call.best_tp_reached = Math.max(call.best_tp_reached, 2);
        // Trailing stop: move SL to TP1
        call.trailing_sl = call.tp1;
        console.log(`[ScalpCall] Call #${call.id} ${call.symbol} SHORT TP2 hit — trailing SL moved to TP1 ${call.tp1}`);
      } else if (currentPrice <= call.tp2) {
        call.best_tp_reached = Math.max(call.best_tp_reached, 2);
      }

      if (currentPrice <= call.tp3) {
        call.tp3_hit = true;
        call.best_tp_reached = Math.max(call.best_tp_reached, 3);
        call.status = 'resolved';
        call.exit_price = currentPrice;
        call.profit_pct = Math.round((call.entry_price - currentPrice) / call.entry_price * 10000) / 100;
        call.resolved_at = now.toISOString();
        resolvedCount++;
        console.log(`[ScalpCall] Call #${call.id} ${call.symbol} SHORT TP3 hit — resolved +${call.profit_pct}%`);
        continue;
      }

      // Check trailing SL
      const effectiveSL = call.trailing_sl != null ? call.trailing_sl : call.stop_loss;
      if (currentPrice >= effectiveSL) {
        call.sl_hit = true;
        call.status = 'resolved';
        call.exit_price = currentPrice;
        if (call.tp1_hit) {
          call.profit_pct = 0; // Breakeven
          call.exit_price = call.entry_price;
        } else {
          call.profit_pct = Math.round((call.entry_price - currentPrice) / call.entry_price * 10000) / 100;
        }
        call.resolved_at = now.toISOString();
        resolvedCount++;
        console.log(`[ScalpCall] Call #${call.id} ${call.symbol} SHORT SL hit (trailing: ${effectiveSL}) — ${call.tp1_hit ? 'breakeven' : call.profit_pct + '%'}`);
        continue;
      }
    }
  }

  saveScalpCalls(calls);
  return { resolved: resolvedCount, expired: expiredCount, checked: activeCalls.length };
}

// ─── Periodic scalp call resolver (every 2 min — fast enough for scalp SL/TP checks) ───
setInterval(async () => {
  try {
    const result = await resolveActiveScalpCalls();
    if (result.resolved > 0 || result.expired > 0) {
      console.log(`[ScalpCall] Periodic: ${result.resolved} resolved, ${result.expired} expired`);
    }
  } catch (err) {
    console.error('[ScalpCall] Periodic error:', err.message);
  }
}, 2 * 60 * 1000);

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