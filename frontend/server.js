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
      priceChange: { enabled: true, threshold: 5, coins: ['bitcoin', 'ethereum', 'solana'] },
      rsiExtreme: { enabled: true, overbought: 70, oversold: 30, coins: ['bitcoin', 'ethereum'] },
      volumeSpike: { enabled: true, multiplier: 3, coins: ['bitcoin', 'ethereum', 'solana'] },
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

// ─── Alert checking logic — uses REAL data from Binance & CoinGecko ───
async function checkAndSendAlerts() {
  const config = loadTelegramAlerts();
  if (!config.enabled) return [];

  const sentAlerts = [];
  const now = new Date();
  const nowStr = now.toLocaleString('fr-CA', { timeZone: 'America/Montreal' });
  const cooldowns = loadCooldowns();

  // Track ALL signals per coin for combined "SIGNAL FORT" detection
  // Signals are collected at NORMAL thresholds (RSI 30/70, price 5%, volume 3x)
  // but single-indicator alerts only fire at EXTREME thresholds
  const coinSignals = {};
  const coinData = {}; // Store fetched data for building combined alerts

  const symbolMap = {
    bitcoin: 'BTCUSDT', ethereum: 'ETHUSDT', solana: 'SOLUSDT',
    cardano: 'ADAUSDT', dogecoin: 'DOGEUSDT', xrp: 'XRPUSDT',
    bnb: 'BNBUSDT', avalanche: 'AVAXUSDT', polkadot: 'DOTUSDT',
  };

  const coinNames = {
    bitcoin: 'Bitcoin (BTC)', ethereum: 'Ethereum (ETH)', solana: 'Solana (SOL)',
    cardano: 'Cardano (ADA)', dogecoin: 'Dogecoin (DOGE)', xrp: 'XRP',
    bnb: 'BNB', avalanche: 'Avalanche (AVAX)', polkadot: 'Polkadot (DOT)',
  };

  // Extreme thresholds for single-indicator alerts
  const EXTREME_RSI_OVERBOUGHT = 80;
  const EXTREME_RSI_OVERSOLD = 20;
  const EXTREME_PRICE_CHANGE = 10; // 10%
  const EXTREME_VOLUME_MULTIPLIER = 5; // 5x

  try {
    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: COLLECT ALL DATA — gather signals at normal thresholds
    // ═══════════════════════════════════════════════════════════════

    // 1A. Price data from CoinGecko
    if (config.alerts.priceChange?.enabled) {
      const coins = config.alerts.priceChange.coins || ['bitcoin', 'ethereum', 'solana'];
      const threshold = config.alerts.priceChange.threshold || 5;
      const ids = coins.join(',');

      try {
        const cgRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
          { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(10000) }
        );

        if (cgRes.ok) {
          const data = await cgRes.json();
          for (const [coinId, info] of Object.entries(data)) {
            const change24h = info.usd_24h_change;
            const price = info.usd;
            const volume24h = info.usd_24h_vol;
            const marketCap = info.usd_market_cap;
            const name = coinNames[coinId] || coinId.toUpperCase();

            // Store data for later use
            if (!coinData[coinId]) coinData[coinId] = { name, price };
            coinData[coinId].change24h = change24h;
            coinData[coinId].volume24h = volume24h;
            coinData[coinId].marketCap = marketCap;
            coinData[coinId].price = price;

            // Register signal at NORMAL threshold for combined detection
            if (Math.abs(change24h) >= threshold) {
              const isBullish = change24h > 0;
              if (!coinSignals[coinId]) coinSignals[coinId] = [];
              coinSignals[coinId].push({
                type: 'price',
                direction: isBullish ? 'bullish' : 'bearish',
                detail: `Prix ${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}% en 24h`,
                isExtreme: Math.abs(change24h) >= EXTREME_PRICE_CHANGE,
                value: change24h,
              });
            }
          }
        }
      } catch (e) {
        console.error('CoinGecko fetch error:', e.message);
      }
    }

    await new Promise(r => setTimeout(r, 1000));

    // 1B. RSI data from Binance (1h)
    if (config.alerts.rsiExtreme?.enabled) {
      const coins = config.alerts.rsiExtreme.coins || ['bitcoin', 'ethereum'];
      const overbought = config.alerts.rsiExtreme.overbought || 70;
      const oversold = config.alerts.rsiExtreme.oversold || 30;

      for (const coinId of coins) {
        const symbol = symbolMap[coinId];
        if (!symbol) continue;
        const name = coinNames[coinId] || coinId.toUpperCase();

        try {
          const kRes = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=30`,
            { signal: AbortSignal.timeout(10000) }
          );
          if (!kRes.ok) continue;

          const klines = await kRes.json();
          const closes = klines.map(k => parseFloat(k[4]));
          const highs = klines.map(k => parseFloat(k[2]));
          const lows = klines.map(k => parseFloat(k[3]));

          if (closes.length >= 15) {
            const gains = [];
            const losses = [];
            for (let i = 1; i < closes.length; i++) {
              const change = closes[i] - closes[i - 1];
              gains.push(change > 0 ? change : 0);
              losses.push(change < 0 ? Math.abs(change) : 0);
            }
            const period = 14;
            if (gains.length >= period) {
              let avgGain = gains.slice(0, period).reduce((s, v) => s + v, 0) / period;
              let avgLoss = losses.slice(0, period).reduce((s, v) => s + v, 0) / period;
              for (let i = period; i < gains.length; i++) {
                avgGain = (avgGain * (period - 1) + gains[i]) / period;
                avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
              }
              const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
              const rsiVal = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
              const currentPrice = closes[closes.length - 1];
              const prevPrice = closes[closes.length - 2];
              const priceChange1h = ((currentPrice - prevPrice) / prevPrice * 100);

              if (!coinData[coinId]) coinData[coinId] = { name, price: currentPrice };
              coinData[coinId].rsi = rsiVal;
              coinData[coinId].priceChange1h = priceChange1h;
              coinData[coinId].high1h = highs[highs.length - 1];
              coinData[coinId].low1h = lows[lows.length - 1];
              if (!coinData[coinId].price) coinData[coinId].price = currentPrice;

              // Register signal at NORMAL threshold
              if (rsiVal >= overbought || rsiVal <= oversold) {
                const isOversold = rsiVal <= oversold;
                const zone = isOversold ? 'SURVENTE' : 'SURACHAT';
                if (!coinSignals[coinId]) coinSignals[coinId] = [];
                coinSignals[coinId].push({
                  type: 'rsi',
                  direction: isOversold ? 'bullish' : 'bearish',
                  detail: `RSI(14) 1h = ${rsiVal.toFixed(1)} (${zone})`,
                  isExtreme: rsiVal <= EXTREME_RSI_OVERSOLD || rsiVal >= EXTREME_RSI_OVERBOUGHT,
                  value: rsiVal,
                });
              }
            }
          }
        } catch (e) {
          console.error(`RSI check error for ${coinId}:`, e.message);
        }
        await new Promise(r => setTimeout(r, 500));
      }
    }

    await new Promise(r => setTimeout(r, 1000));

    // 1C. Volume data from Binance
    if (config.alerts.volumeSpike?.enabled) {
      const coins = config.alerts.volumeSpike.coins || ['bitcoin', 'ethereum', 'solana'];
      const multiplier = config.alerts.volumeSpike.multiplier || 3;

      for (const coinId of coins) {
        const symbol = symbolMap[coinId];
        if (!symbol) continue;
        const name = coinNames[coinId] || coinId.toUpperCase();

        try {
          const kRes = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=25`,
            { signal: AbortSignal.timeout(10000) }
          );
          if (!kRes.ok) continue;

          const klines = await kRes.json();
          const volumes = klines.map(k => parseFloat(k[5]));
          const currentVol = volumes[volumes.length - 1];
          const avgVol = volumes.slice(0, -1).reduce((s, v) => s + v, 0) / (volumes.length - 1);
          const currentPrice = parseFloat(klines[klines.length - 1][4]);
          const currentOpen = parseFloat(klines[klines.length - 1][1]);
          const currentClose = parseFloat(klines[klines.length - 1][4]);
          const currentHigh = parseFloat(klines[klines.length - 1][2]);
          const currentLow = parseFloat(klines[klines.length - 1][3]);
          const isBullishCandle = currentClose >= currentOpen;

          if (!coinData[coinId]) coinData[coinId] = { name, price: currentPrice };
          coinData[coinId].volumeRatio = avgVol > 0 ? currentVol / avgVol : 0;
          coinData[coinId].isBullishCandle = isBullishCandle;
          coinData[coinId].candleOpen = currentOpen;
          coinData[coinId].candleClose = currentClose;
          coinData[coinId].candleHigh = currentHigh;
          coinData[coinId].candleLow = currentLow;

          if (avgVol > 0 && currentVol >= avgVol * multiplier) {
            const ratio = (currentVol / avgVol).toFixed(1);
            const candleType = isBullishCandle ? 'bougie verte' : 'bougie rouge';
            if (!coinSignals[coinId]) coinSignals[coinId] = [];
            coinSignals[coinId].push({
              type: 'volume',
              direction: isBullishCandle ? 'bullish' : 'bearish',
              detail: `Volume ${ratio}x (${candleType})`,
              isExtreme: currentVol >= avgVol * EXTREME_VOLUME_MULTIPLIER,
              value: parseFloat(ratio),
            });
          }
        } catch (e) {
          console.error(`Volume check error for ${coinId}:`, e.message);
        }
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: SEND ALERTS — prioritize combined, then extreme singles
    // ═══════════════════════════════════════════════════════════════

    for (const [coinId, signals] of Object.entries(coinSignals)) {
      const data = coinData[coinId] || {};
      const name = data.name || coinNames[coinId] || coinId.toUpperCase();
      const price = data.price || 0;

      // Count signals by direction
      const bullishSignals = signals.filter(s => s.direction === 'bullish');
      const bearishSignals = signals.filter(s => s.direction === 'bearish');
      const dominant = bullishSignals.length >= bearishSignals.length ? 'bullish' : 'bearish';
      const dominantSignals = dominant === 'bullish' ? bullishSignals : bearishSignals;

      // ── COMBINED ALERT (2+ signals same direction) — preferred ──
      if (dominantSignals.length >= 2) {
        if (!isCooldownActive(cooldowns, coinId, 'signalFort')) {
          const isBullish = dominant === 'bullish';
          const signalEmoji = isBullish ? '🟢🟢🟢' : '🔴🔴🔴';
          const signalType = isBullish ? 'HAUSSIER FORT' : 'BAISSIER FORT';
          const confidence = signals.length >= 3 ? 'Élevée ⭐⭐⭐' : 'Moyenne ⭐⭐';
          const strength = signals.length >= 3 ? '⚡⚡⚡ TRÈS FORT' : '⚡⚡ FORT';

          const signalsList = signals.map((s, i) => {
            const icon = s.direction === 'bullish' ? '🟢' : '🔴';
            return `${i + 1}. ${icon} ${s.detail}`;
          }).join('\n');

          const explanation = isBullish
            ? `${dominantSignals.length} indicateurs sur ${signals.length} convergent vers un signal haussier. Cette convergence multi-indicateurs est bien plus fiable qu'un seul indicateur isolé.`
            : `${dominantSignals.length} indicateurs sur ${signals.length} convergent vers un signal baissier. Cette convergence multi-indicateurs est bien plus fiable qu'un seul indicateur isolé.`;

          const actionSummary = isBullish
            ? '👉 CONVERGENCE HAUSSIÈRE : Opportunité d\'achat potentielle. Définir un stop-loss et un objectif de prix avant d\'entrer.'
            : '👉 CONVERGENCE BAISSIÈRE : Prudence recommandée. Envisager de réduire l\'exposition ou de placer des stop-loss serrés.';

          // Build market data section
          let marketData = '';
          if (data.change24h !== undefined) marketData += `├ Variation 24h : <b>${data.change24h > 0 ? '+' : ''}${data.change24h.toFixed(2)}%</b>\n`;
          if (data.rsi !== undefined) marketData += `├ RSI(14) 1h : <b>${data.rsi.toFixed(1)}</b>\n`;
          if (data.volumeRatio > 0) marketData += `├ Volume : <b>${data.volumeRatio.toFixed(1)}x</b> la moyenne\n`;
          if (data.volume24h) marketData += `├ Volume 24h : <b>$${formatNumber(data.volume24h)}</b>\n`;
          if (data.marketCap) marketData += `├ Market Cap : <b>$${formatNumber(data.marketCap)}</b>\n`;
          marketData += `└ Prix actuel : <b>$${formatPrice(price)}</b>`;

          const text = `🔥🔥🔥 <b>SIGNAL FORT — Convergence Multi-Indicateurs</b> 🔥🔥🔥
━━━━━━━━━━━━━━━━━━━━━

${signalEmoji} <b>Signal ${signalType}</b> — ${strength}
🪙 <b>${name}</b>
🎯 Confiance : <b>${confidence}</b>

📊 <b>Signaux détectés (${signals.length}) :</b>
${signalsList}

📈 <b>Données du marché :</b>
${marketData}

💡 <b>Pourquoi ce signal est fiable :</b>
${explanation}
Un seul indicateur (ex: RSI seul) peut donner de faux signaux. Quand plusieurs indicateurs pointent dans la même direction, la probabilité de succès augmente considérablement.

📋 <b>Résumé actionnable :</b>
${actionSummary}

📡 <i>Sources : CoinGecko + Binance API (données en temps réel)</i>
⏰ ${nowStr} (heure de Montréal)
⚠️ <i>Ceci n'est pas un conseil financier. DYOR.</i>`;

          const result = await sendTelegramMessage(text);
          if (result.ok) {
            setCooldown(cooldowns, coinId, 'signalFort');
            sentAlerts.push({ type: 'signalFort', coin: coinId, convergence: dominantSignals.length, direction: dominant, confidence });
          }
        } else {
          console.log(`[Telegram] Cooldown active for ${coinId}_signalFort — skipping`);
        }
        // Skip individual alerts for this coin since we sent a combined one
        continue;
      }

      // ── SINGLE INDICATOR ALERTS — only at EXTREME thresholds ──
      for (const signal of signals) {
        if (!signal.isExtreme) continue; // Skip non-extreme single signals
        const alertTypeKey = `${signal.type}Extreme`;
        if (isCooldownActive(cooldowns, coinId, alertTypeKey)) {
          console.log(`[Telegram] Cooldown active for ${coinId}_${alertTypeKey} — skipping`);
          continue;
        }

        let text = '';

        if (signal.type === 'price') {
          const isBullish = signal.direction === 'bullish';
          const signalEmoji = isBullish ? '🟢' : '🔴';
          const signalType = isBullish ? 'HAUSSIER (Bullish)' : 'BAISSIER (Bearish)';
          text = `🚨 <b>ALERTE CRYPTO — Variation de Prix EXTRÊME</b>
━━━━━━━━━━━━━━━━━━━━━

${signalEmoji} <b>Signal ${signalType}</b> — ⚡ EXTRÊME
🪙 <b>${name}</b>

📊 <b>Données du marché :</b>
├ Variation 24h : <b>${data.change24h > 0 ? '+' : ''}${data.change24h.toFixed(2)}%</b>
├ Prix actuel : <b>$${formatPrice(price)}</b>
${data.volume24h ? `├ Volume 24h : <b>$${formatNumber(data.volume24h)}</b>\n` : ''}${data.marketCap ? `└ Market Cap : <b>$${formatNumber(data.marketCap)}</b>` : ''}

⚠️ <b>Attention :</b> Signal basé sur un seul indicateur (prix). La fiabilité est plus faible qu'un signal combiné. Attendre une confirmation d'autres indicateurs est recommandé.

📡 <i>Source : CoinGecko API (données en temps réel)</i>
⏰ ${nowStr} (heure de Montréal)
⚠️ <i>Ceci n'est pas un conseil financier. DYOR.</i>`;
        }

        if (signal.type === 'rsi') {
          const isOversold = signal.value <= EXTREME_RSI_OVERSOLD;
          const signalEmoji = isOversold ? '🟢' : '🔴';
          const signalType = isOversold ? 'HAUSSIER (Bullish)' : 'BAISSIER (Bearish)';
          const zone = isOversold ? 'SURVENTE EXTRÊME' : 'SURACHAT EXTRÊME';
          text = `🚨 <b>ALERTE CRYPTO — RSI EXTRÊME (1h)</b>
━━━━━━━━━━━━━━━━━━━━━

${signalEmoji} <b>Signal ${signalType}</b> — ⚡ EXTRÊME
🪙 <b>${name}</b>

📊 <b>Indicateur RSI :</b>
├ RSI(14) : <b>${signal.value.toFixed(1)}</b> — ${zone}
├ Timeframe : <b>1h (horaire)</b>
├ Prix actuel : <b>$${formatPrice(price)}</b>
${data.priceChange1h !== undefined ? `├ Variation 1h : <b>${data.priceChange1h >= 0 ? '+' : ''}${data.priceChange1h.toFixed(2)}%</b>\n` : ''}${data.high1h ? `├ High 1h : <b>$${formatPrice(data.high1h)}</b>\n` : ''}${data.low1h ? `└ Low 1h : <b>$${formatPrice(data.low1h)}</b>` : ''}

📖 <b>Qu'est-ce que le RSI ?</b>
RSI &lt; 20 = Survente extrême (fort potentiel de rebond)
RSI &gt; 80 = Surachat extrême (fort potentiel de correction)

⚠️ <b>Attention :</b> Signal basé sur un seul indicateur (RSI). Un RSI extrême seul ne garantit pas un retournement. Chercher une confirmation avec le volume ou le prix est recommandé.

📡 <i>Source : Binance API (klines 1h en temps réel)</i>
⏰ ${nowStr} (heure de Montréal)
⚠️ <i>Ceci n'est pas un conseil financier. DYOR.</i>`;
        }

        if (signal.type === 'volume') {
          const isBullish = signal.direction === 'bullish';
          const signalEmoji = isBullish ? '🟢' : '🔴';
          const signalType = isBullish ? 'HAUSSIER (Bullish)' : 'BAISSIER (Bearish)';
          const candleType = isBullish ? 'bougie verte (haussière)' : 'bougie rouge (baissière)';
          text = `🚨 <b>ALERTE CRYPTO — Volume EXTRÊME</b>
━━━━━━━━━━━━━━━━━━━━━

${signalEmoji} <b>Signal ${signalType}</b> — ⚡ EXTRÊME
🪙 <b>${name}</b>

📊 <b>Données de volume :</b>
├ Volume actuel : <b>${signal.value}x</b> la moyenne
├ Type de bougie : <b>${candleType}</b>
├ Prix actuel : <b>$${formatPrice(price)}</b>
${data.candleHigh ? `├ High 1h : <b>$${formatPrice(data.candleHigh)}</b>\n` : ''}${data.candleLow ? `└ Low 1h : <b>$${formatPrice(data.candleLow)}</b>` : ''}

⚠️ <b>Attention :</b> Signal basé sur un seul indicateur (volume). Un pic de volume seul ne confirme pas la direction. Vérifier le RSI et la tendance de prix est recommandé.

📡 <i>Source : Binance API (volume 1h en temps réel)</i>
⏰ ${nowStr} (heure de Montréal)
⚠️ <i>Ceci n'est pas un conseil financier. DYOR.</i>`;
        }

        if (text) {
          const result = await sendTelegramMessage(text);
          if (result.ok) {
            setCooldown(cooldowns, coinId, alertTypeKey);
            sentAlerts.push({ type: alertTypeKey, coin: coinId, direction: signal.direction, value: signal.value });
          }
        }
      }
    }

    // Save cooldowns to file
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