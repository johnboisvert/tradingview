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
    await sendTelegramPhoto();
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
    await sendTelegramPhoto();
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
// COOLDOWN SYSTEM — 4 hours per crypto, tracks direction to avoid duplicates
// ═══════════════════════════════════════════════════════════════════════════════
const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours in ms

function loadCooldowns() {
  const config = loadTelegramAlerts();
  return config.cooldowns || {};
}

function saveCooldowns(cooldowns) {
  const config = loadTelegramAlerts();
  config.cooldowns = cooldowns;
  saveTelegramAlerts(config);
}

/**
 * Check if a cooldown is active for a coin.
 * Returns true if the same direction signal was sent within the cooldown period.
 */
function isCooldownActive(cooldowns, coinId, direction) {
  const key = `${coinId}_signal`;
  const entry = cooldowns[key];
  if (!entry) return false;
  const elapsed = Date.now() - new Date(entry.timestamp).getTime();
  // If cooldown expired, allow
  if (elapsed >= COOLDOWN_MS) return false;
  // If same direction, block (don't resend same signal)
  if (entry.direction === direction) return true;
  // Different direction = new signal, allow
  return false;
}

function setCooldown(cooldowns, coinId, direction) {
  const key = `${coinId}_signal`;
  cooldowns[key] = {
    timestamp: new Date().toISOString(),
    direction,
  };
}

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
 * (Same algorithm as Trades.tsx alignTPWithSR)
 */
function alignTPWithSR(side, entry, slPercent, supports, resistances) {
  const slDistance = entry * (slPercent / 100);

  let tp1, tp2, tp3, sl;

  if (side === 'LONG') {
    sl = entry - slDistance;
    tp1 = entry + slDistance * 1.5;
    tp2 = entry + slDistance * 2.5;
    tp3 = entry + slDistance * 4;

    const nearestSupport = supports.find(s => s.price < entry * 0.995);
    if (nearestSupport && nearestSupport.price > sl * 0.97 && nearestSupport.price < entry * 0.99) {
      sl = nearestSupport.price * 0.998;
    }

    const resAbove = resistances.filter(r => r.price > entry * 1.005);
    if (resAbove.length >= 1 && resAbove[0].price > tp1 * 0.95 && resAbove[0].price < tp1 * 1.15) {
      tp1 = resAbove[0].price * 0.998;
    }
    if (resAbove.length >= 2 && resAbove[1].price > tp2 * 0.85 && resAbove[1].price < tp2 * 1.2) {
      tp2 = resAbove[1].price * 0.998;
    }
    if (resAbove.length >= 3 && resAbove[2].price > tp3 * 0.8) {
      tp3 = resAbove[2].price * 0.998;
    }
  } else {
    sl = entry + slDistance;
    tp1 = entry - slDistance * 1.5;
    tp2 = entry - slDistance * 2.5;
    tp3 = entry - slDistance * 4;

    const nearestResistance = resistances.find(r => r.price > entry * 1.005);
    if (nearestResistance && nearestResistance.price < sl * 1.03 && nearestResistance.price > entry * 1.01) {
      sl = nearestResistance.price * 1.002;
    }

    const supBelow = supports.filter(s => s.price < entry * 0.995);
    if (supBelow.length >= 1 && supBelow[0].price < tp1 * 1.05 && supBelow[0].price > tp1 * 0.85) {
      tp1 = supBelow[0].price * 1.002;
    }
    if (supBelow.length >= 2 && supBelow[1].price < tp2 * 1.15 && supBelow[1].price > tp2 * 0.8) {
      tp2 = supBelow[1].price * 1.002;
    }
    if (supBelow.length >= 3 && supBelow[2].price < tp3 * 1.2) {
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
 */
function generateRealSetups(coins) {
  const setups = [];
  const triggerTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  for (const c of coins) {
    if (!c || !c.current_price || !c.market_cap) continue;

    const price = c.current_price;
    const change24h = c.price_change_percentage_24h || 0;
    const volume = c.total_volume || 0;
    const mcap = c.market_cap || 1;
    const volMcapRatio = volume / mcap;

    const { supports, resistances } = calculateSRLevels(c);

    const volatility = Math.max(Math.abs(change24h) * 0.5, 1.5);
    const slPercent = volatility * 0.8;

    let side;
    let confidence = 0;
    let reason;

    if (change24h > 2 && volMcapRatio > 0.08) {
      side = 'LONG';
      confidence = 50;
      if (change24h > 5) confidence += 15; else confidence += 8;
      if (volMcapRatio > 0.2) confidence += 15; else if (volMcapRatio > 0.1) confidence += 10;
      if (change24h > 8) confidence += 10;
      reason = `Momentum haussier (+${change24h.toFixed(1)}%) avec volume élevé (${(volMcapRatio * 100).toFixed(1)}% du MCap)`;
    } else if (change24h < -8) {
      side = 'LONG';
      confidence = 45;
      if (change24h < -15) confidence += 15; else if (change24h < -10) confidence += 10;
      if (volMcapRatio > 0.15) confidence += 10;
      reason = `Survente potentielle (${change24h.toFixed(1)}%) — rebond technique possible`;
    } else if (change24h < -3 && volMcapRatio > 0.1) {
      side = 'SHORT';
      confidence = 50;
      if (change24h < -5) confidence += 10; else confidence += 5;
      if (volMcapRatio > 0.2) confidence += 15; else confidence += 8;
      reason = `Tendance baissière (${change24h.toFixed(1)}%) avec volume de distribution (${(volMcapRatio * 100).toFixed(1)}% du MCap)`;
    } else {
      continue;
    }

    const { tp1, tp2, tp3, sl } = alignTPWithSR(side, price, slPercent, supports, resistances);

    const nearestSupport = supports[0];
    const nearestResistance = resistances[0];

    if (side === 'LONG') {
      if (nearestSupport && Math.abs(price - nearestSupport.price) / price < 0.02) {
        confidence += 10;
        reason += ` | Proche du support $${formatPrice(nearestSupport.price)}`;
      }
      if (nearestResistance && Math.abs(tp1 - nearestResistance.price) / tp1 < 0.02) {
        confidence += 5;
      }
    } else {
      if (nearestResistance && Math.abs(price - nearestResistance.price) / price < 0.02) {
        confidence += 10;
        reason += ` | Proche de la résistance $${formatPrice(nearestResistance.price)}`;
      }
      if (nearestSupport && Math.abs(tp1 - nearestSupport.price) / tp1 < 0.02) {
        confidence += 5;
      }
    }

    if (Math.abs(sl - price) / price < 0.005) {
      confidence -= 10;
    }

    if (supports.length >= 2) confidence += 3;
    if (resistances.length >= 2) confidence += 3;

    confidence = Math.min(95, Math.max(25, confidence));

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
    console.log('[Telegram] Fetching CoinGecko market data (top 200 with sparkline)...');
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
    const setups = Array.from(seenCoins.values());
    console.log(`[Telegram] After dedup: ${setups.length} unique coin setups`);

    // Send alerts for each setup (respecting cooldowns)
    for (const setup of setups) {
      // Check cooldown: skip if same direction was sent within 4 hours
      if (isCooldownActive(cooldowns, setup.id, setup.side)) {
        console.log(`[Telegram] ⏳ Cooldown active for ${setup.name} (${setup.side}), skipping`);
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

      const text = `${confEmoji} <b>SIGNAL CRYPTO — PAGE /TRADES</b>
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
⚖️ Risk/Reward : <b>1:${setup.rr}</b>
📈 24h : <b>${setup.change24h >= 0 ? '+' : ''}${setup.change24h.toFixed(2)}%</b>
🧠 Confiance : <b>${setup.confidence}%</b>

📋 <b>Raison :</b>
<i>${setup.reason}</i>

⏰ ${setup.triggerTime} — ${nowStr} (Montréal)
⚠️ <i>Ceci n'est pas un conseil financier. DYOR.</i>`;

      const result = await sendTelegramMessage(text);
      if (result.ok) {
        // Send branding image after the alert message
        await sendTelegramPhoto();

        // Set cooldown IMMEDIATELY after successful send to prevent duplicates
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
        await new Promise(r => setTimeout(r, 1500));
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