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
app.all('/api/crypto-predict/*', async (req, res) => {
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

// ─── CoinGecko API proxy ───
// Proxies /api/coingecko/* to https://api.coingecko.com/api/v3/*
app.get('/api/coingecko/*', async (req, res) => {
  const targetPath = req.url.replace('/api/coingecko', '');
  const targetUrl = `https://api.coingecko.com/api/v3${targetPath}`;

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
    console.error('CoinGecko proxy error:', err);
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

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});