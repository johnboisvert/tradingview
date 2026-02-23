import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

// ── Dev-mode user storage helpers ──
const DEV_DATA_DIR = path.resolve(__dirname, 'data');
const DEV_USERS_FILE = path.join(DEV_DATA_DIR, 'users.json');

function hashPwd(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function devLoadUsers(): any[] {
  try {
    if (existsSync(DEV_USERS_FILE)) {
      return JSON.parse(readFileSync(DEV_USERS_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  const defaults = [
    { username: "admin", passwordHash: hashPwd("admin123"), role: "admin", plan: "elite", subscription_end: "2027-02-17", created_at: "2024-01-15" },
  ];
  devSaveUsers(defaults);
  return defaults;
}

function devSaveUsers(users: any[]): void {
  if (!existsSync(DEV_DATA_DIR)) mkdirSync(DEV_DATA_DIR, { recursive: true });
  writeFileSync(DEV_USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
  });
}

// Vite plugin that proxies /api/* endpoints (keeps keys server-side)
function apiProxyPlugin(): Plugin {
  return {
    name: 'api-proxy',
    configureServer(server) {
      // ── User Management API (dev mode) ──
      server.middlewares.use('/api/users/login', async (req: any, res: any) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return; }
        const body = JSON.parse(await readBody(req));
        const users = devLoadUsers();
        const hash = hashPwd((body.password || '').trim());
        const user = users.find((u: any) => u.username.toLowerCase() === (body.username || '').trim().toLowerCase() && u.passwordHash === hash);
        res.setHeader('Content-Type', 'application/json');
        if (user) {
          const { passwordHash, ...safe } = user;
          res.end(JSON.stringify({ success: true, user: safe }));
        } else {
          res.end(JSON.stringify({ success: false, message: "Nom d'utilisateur ou mot de passe incorrect." }));
        }
      });

      server.middlewares.use('/api/users/create', async (req: any, res: any) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return; }
        const body = JSON.parse(await readBody(req));
        const users = devLoadUsers();
        if (users.find((u: any) => u.username.toLowerCase() === (body.username || '').trim().toLowerCase())) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, message: "Utilisateur déjà existant." }));
          return;
        }
        const tempPwd = body.password || Math.random().toString(36).slice(-8);
        const newUser: any = {
          username: (body.username || '').trim(),
          passwordHash: hashPwd(tempPwd),
          role: body.role || 'user',
          plan: body.plan || 'free',
          created_at: new Date().toISOString().split('T')[0],
        };
        if (newUser.plan !== 'free') {
          const end = new Date(); end.setFullYear(end.getFullYear() + 1);
          newUser.subscription_end = end.toISOString().split('T')[0];
        }
        users.push(newUser);
        devSaveUsers(users);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, temp_password: tempPwd }));
      });

      server.middlewares.use('/api/users/reset-password', async (req: any, res: any) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return; }
        const body = JSON.parse(await readBody(req));
        const users = devLoadUsers();
        const user = users.find((u: any) => u.username.toLowerCase() === (body.username || '').trim().toLowerCase());
        res.setHeader('Content-Type', 'application/json');
        if (!user) { res.end(JSON.stringify({ success: false, message: "Utilisateur introuvable." })); return; }
        const tempPwd = body.newPassword || Math.random().toString(36).slice(-8);
        user.passwordHash = hashPwd(tempPwd);
        devSaveUsers(users);
        res.end(JSON.stringify({ success: true, temp_password: tempPwd }));
      });

      server.middlewares.use('/api/users', async (req: any, res: any, next: any) => {
        // Handle DELETE /api/users/:username and PUT /api/users/:username/plan
        const url = new URL(req.url || '', 'http://localhost');
        const parts = url.pathname.split('/').filter(Boolean); // e.g. ["username", "plan"]

        if (req.method === 'GET' && parts.length === 0) {
          // GET /api/users
          const users = devLoadUsers();
          const safe = users.map(({ passwordHash, ...rest }: any) => rest);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ users: safe }));
          return;
        }

        if (req.method === 'DELETE' && parts.length === 1) {
          const username = decodeURIComponent(parts[0]);
          const users = devLoadUsers();
          const filtered = users.filter((u: any) => u.username.toLowerCase() !== username.toLowerCase());
          res.setHeader('Content-Type', 'application/json');
          if (filtered.length === users.length) {
            res.end(JSON.stringify({ success: false, message: "Utilisateur introuvable." }));
          } else {
            devSaveUsers(filtered);
            res.end(JSON.stringify({ success: true }));
          }
          return;
        }

        if (req.method === 'PUT' && parts.length === 2 && parts[1] === 'plan') {
          const username = decodeURIComponent(parts[0]);
          const body = JSON.parse(await readBody(req));
          const users = devLoadUsers();
          const user = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
          res.setHeader('Content-Type', 'application/json');
          if (!user) { res.end(JSON.stringify({ success: false, message: "Utilisateur introuvable." })); return; }
          user.plan = body.plan;
          if (body.plan !== 'free') {
            const end = new Date(); end.setFullYear(end.getFullYear() + 1);
            user.subscription_end = end.toISOString().split('T')[0];
          } else {
            delete user.subscription_end;
          }
          devSaveUsers(users);
          res.end(JSON.stringify({ success: true, subscription_end: user.subscription_end }));
          return;
        }

        next();
      });

      // Gemini AI Chat proxy
      server.middlewares.use('/api/ai-chat', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || '';
        if (!GEMINI_API_KEY) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'VITE_GEMINI_API_KEY not set in .env' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body);
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: parsed.contents,
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

            const data = await geminiRes.json();
            res.statusCode = geminiRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } catch (err: any) {
            console.error('Gemini proxy error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Proxy failed', message: err?.message }));
          }
        });
      });

      // Crypto Prediction API proxy — proxies /api/crypto-predict/* to the Render backend
      server.middlewares.use('/api/crypto-predict', async (req, res) => {
        const targetPath = req.url || '';
        const targetUrl = `https://crypto-prediction-api-5763.onrender.com${targetPath}`;

        try {
          const upstreamRes = await fetch(targetUrl, {
            method: req.method || 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(60000),
          });

          const data = await upstreamRes.text();
          res.statusCode = upstreamRes.status;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(data);
        } catch (err: any) {
          console.error('Crypto predict proxy error:', err);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Proxy failed', message: err?.message }));
        }
      });

      // CoinGecko API proxy — proxies /api/coingecko/* to CoinGecko
      server.middlewares.use('/api/coingecko', async (req, res) => {
        const targetPath = req.url || '';
        const targetUrl = `https://api.coingecko.com/api/v3${targetPath}`;

        try {
          const upstreamRes = await fetch(targetUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(15000),
          });

          const data = await upstreamRes.text();
          res.statusCode = upstreamRes.status;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(data);
        } catch (err: any) {
          console.error('CoinGecko proxy error:', err);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'CoinGecko proxy failed', message: err?.message }));
        }
      });

      // Binance Klines API proxy — proxies /api/binance/klines to Binance
      server.middlewares.use('/api/binance/klines', async (req, res) => {
        const url = new URL(req.url || '', 'http://localhost');
        const symbol = url.searchParams.get('symbol') || '';
        const interval = url.searchParams.get('interval') || '1h';
        const limit = url.searchParams.get('limit') || '168';
        const targetUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

        try {
          const upstreamRes = await fetch(targetUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'User-Agent': 'CryptoIA/1.0' },
            signal: AbortSignal.timeout(15000),
          });

          const data = await upstreamRes.text();
          res.statusCode = upstreamRes.status;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(data);
        } catch (err: any) {
          console.error('Binance proxy error:', err);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Binance proxy failed', message: err?.message }));
        }
      });

      // ── Referral / Parrainage API (dev mode) ──
      const DEV_REFERRALS_FILE = path.join(DEV_DATA_DIR, 'referrals.json');

      function devLoadReferrals(): any[] {
        try {
          if (existsSync(DEV_REFERRALS_FILE)) {
            return JSON.parse(readFileSync(DEV_REFERRALS_FILE, 'utf-8'));
          }
        } catch { /* ignore */ }
        return [];
      }

      function devSaveReferrals(referrals: any[]): void {
        if (!existsSync(DEV_DATA_DIR)) mkdirSync(DEV_DATA_DIR, { recursive: true });
        writeFileSync(DEV_REFERRALS_FILE, JSON.stringify(referrals, null, 2), 'utf-8');
      }

      // POST /api/referral/track — must be registered BEFORE the parameterized route
      server.middlewares.use('/api/referral/track', async (req: any, res: any) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return; }
        const body = JSON.parse(await readBody(req));
        const { referrer, referred } = body;
        res.setHeader('Content-Type', 'application/json');

        if (!referrer || !referred) {
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, message: 'referrer et referred requis.' }));
          return;
        }
        if (referrer.toLowerCase() === referred.toLowerCase()) {
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, message: 'Impossible de se parrainer soi-même.' }));
          return;
        }

        const referrals = devLoadReferrals();
        const exists = referrals.find((r: any) => r.referred.toLowerCase() === referred.toLowerCase());
        if (exists) {
          res.end(JSON.stringify({ success: false, message: 'Cet utilisateur a déjà été parrainé.' }));
          return;
        }

        referrals.push({
          referrer: referrer.toLowerCase(),
          referred: referred.toLowerCase(),
          created_at: new Date().toISOString(),
        });
        devSaveReferrals(referrals);
        res.end(JSON.stringify({ success: true, message: 'Parrainage enregistré avec succès.' }));
      });

      // GET /api/referral-leaderboard — global referral leaderboard (admin)
      server.middlewares.use('/api/referral-leaderboard', async (_req: any, res: any) => {
        const referrals = devLoadReferrals();
        const users = devLoadUsers();

        const grouped: Record<string, { total: number; paid: number; revenue: number }> = {};
        for (const ref of referrals) {
          const key = ref.referrer.toLowerCase();
          if (!grouped[key]) grouped[key] = { total: 0, paid: 0, revenue: 0 };
          grouped[key].total += 1;
          const user = users.find((u: any) => u.username.toLowerCase() === ref.referred.toLowerCase());
          if (user && user.plan !== 'free') {
            grouped[key].paid += 1;
          }
        }

        const leaderboard = Object.entries(grouped)
          .map(([username, data]) => ({ username, referrals: data.total, paid: data.paid, revenue: data.revenue }))
          .sort((a, b) => b.paid - a.paid || b.referrals - a.referrals);

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          success: true,
          total_referrals: referrals.length,
          paid_referrals: leaderboard.reduce((s, l) => s + l.paid, 0),
          leaderboard,
        }));
      });

      // GET /api/referral/:username — get referral stats for a user
      server.middlewares.use('/api/referral', async (req: any, res: any, next: any) => {
        const url = new URL(req.url || '', 'http://localhost');
        const parts = url.pathname.split('/').filter(Boolean); // e.g. ["someUsername"]

        if (req.method === 'GET' && parts.length === 1) {
          const username = decodeURIComponent(parts[0]);
          const referrals = devLoadReferrals();
          const users = devLoadUsers();
          const userReferrals = referrals.filter(
            (r: any) => r.referrer.toLowerCase() === username.toLowerCase()
          );

          const referralDetails = userReferrals.map((r: any) => {
            const user = users.find((u: any) => u.username.toLowerCase() === r.referred.toLowerCase());
            return {
              username: r.referred,
              plan: user?.plan || 'free',
              created_at: r.created_at,
              is_paid: !!user && user.plan !== 'free',
            };
          });

          const paidCount = referralDetails.filter((r: any) => r.is_paid).length;

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            stats: {
              referral_code: username,
              total_referrals: userReferrals.length,
              paid_referrals: paidCount,
              rewards_earned: paidCount,
              referrals: referralDetails,
            },
          }));
          return;
        }

        next();
      });

      // ── FastAPI Backend proxy — forwards /api/v1/* to the Python backend ──
      server.middlewares.use('/api/v1', async (req: any, res: any) => {
        const targetUrl = `http://127.0.0.1:8000/api/v1${req.url || ''}`;

        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Auth, App-Host');
          res.end();
          return;
        }

        try {
          // Read request body for POST/PUT methods
          let bodyData: string | undefined;
          if (req.method === 'POST' || req.method === 'PUT') {
            bodyData = await readBody(req);
          }

          const headers: Record<string, string> = {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'Accept': 'application/json',
          };
          // Forward relevant headers
          if (req.headers['authorization']) headers['Authorization'] = req.headers['authorization'];
          if (req.headers['x-admin-auth']) headers['X-Admin-Auth'] = req.headers['x-admin-auth'];
          if (req.headers['origin']) headers['App-Host'] = req.headers['origin'];

          const fetchOptions: RequestInit = {
            method: req.method || 'GET',
            headers,
            signal: AbortSignal.timeout(30000),
          };
          if (bodyData && (req.method === 'POST' || req.method === 'PUT')) {
            fetchOptions.body = bodyData;
          }

          const upstreamRes = await fetch(targetUrl, fetchOptions);
          const data = await upstreamRes.text();

          res.statusCode = upstreamRes.status;
          res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(data);
        } catch (err: any) {
          console.error('FastAPI backend proxy error:', err);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'Backend non disponible',
            message: err?.message || 'Impossible de contacter le serveur backend. Vérifiez qu\'il est démarré sur le port 8000.',
          }));
        }
      });

      // CryptoPanic News API proxy — proxies /api/news to CryptoPanic
      server.middlewares.use('/api/news', async (req, res) => {
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
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ error: 'CryptoPanic blocked by Cloudflare', results: null }));
            return;
          }

          res.statusCode = upstreamRes.status;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(data);
        } catch (err: any) {
          console.error('CryptoPanic proxy error:', err);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'News proxy failed', message: err?.message }));
        }
      });

      // CryptoCompare News API proxy — proxies /api/news-crypto to CryptoCompare
      server.middlewares.use('/api/news-crypto', async (req, res) => {
        const targetUrl = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest`;

        try {
          const upstreamRes = await fetch(targetUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(15000),
          });

          const data = await upstreamRes.text();
          res.statusCode = upstreamRes.status;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(data);
        } catch (err: any) {
          console.error('CryptoCompare news proxy error:', err);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'News proxy failed', message: err?.message }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    apiProxyPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.VITE_PORT || '3000'),
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  build: {
    // SECURITY: Never expose source maps in production
    sourcemap: false,
    // Use terser for advanced minification and code protection
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log/warn/info in production (keep console.error)
        drop_console: mode === 'production',
        drop_debugger: true,
        // Remove dead code
        dead_code: true,
        passes: 2,
      },
      mangle: {
        // Mangle variable names for obfuscation
        toplevel: true,
      },
      format: {
        // Remove all comments in production
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
          ],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'utils-vendor': [
            'axios',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'date-fns',
            'lucide-react',
          ],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));