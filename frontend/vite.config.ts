import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Vite plugin that proxies /api/ai-chat to Gemini API (keeps key server-side)
function geminiProxyPlugin(): Plugin {
  return {
    name: 'gemini-proxy',
    configureServer(server) {
      // Gemini AI Chat proxy
      server.middlewares.use('/api/ai-chat', async (req, res) => {
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
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    geminiProxyPlugin(),
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