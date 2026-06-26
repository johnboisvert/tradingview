// OG image generation for the trader profile quiz.
// Renders a 1200x630 PNG card per profile via SVG → sharp (no external API).
// Cached on disk to data/quiz-og/{profileKey}.png so first hit is fast forever after.
//
// Endpoint: GET /api/v1/quiz/og/:profileKey.png
// Used as <meta property="og:image"> on shareable result pages.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OG_DIR = path.join(__dirname, '..', 'data', 'quiz-og');

// Mirror of PROFILES in quiz.js but trimmed for the OG card.
// Keep in sync if profiles change.
const OG_PROFILES = {
  hodler:   { emoji: '💎', name: 'Le HODLer Patient',        tagline: 'Long terme · Sang-froid · Patience',           color: '#3b82f6', accent: '#60a5fa' },
  scalper:  { emoji: '⚡', name: 'Le Scalpeur Adrénaline',   tagline: 'Trades rapides · Réactivité · Précision',       color: '#f97316', accent: '#fb923c' },
  swing:    { emoji: '🎯', name: 'Le Swing Trader',          tagline: 'Stratégie · Patience · Setups premium',         color: '#10b981', accent: '#34d399' },
  longterm: { emoji: '🚀', name: "L'Investisseur Visionnaire", tagline: 'Pépites · Vision · x100 hunter',              color: '#a855f7', accent: '#c084fc' },
};

function escapeXml(s = '') {
  return String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

function buildSvg(profile) {
  const { emoji, name, tagline, color, accent } = profile;
  // 1200x630 — Open Graph optimal.
  // Pure SVG, sharp converts to PNG with rsvg.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0f"/>
      <stop offset="100%" stop-color="#0f0f1a"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.1" r="0.9">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.05" cy="1" r="0.7">
      <stop offset="0%" stop-color="#ec4899" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#ec4899" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accentBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.4"/>
    </filter>
  </defs>

  <!-- background layers -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>

  <!-- decorative grid -->
  <g stroke="rgba(255,255,255,0.04)" stroke-width="1">
    ${Array.from({ length: 12 }).map((_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="630"/>`).join('')}
    ${Array.from({ length: 7 }).map((_, i) => `<line x1="0" y1="${i * 100}" x2="1200" y2="${i * 100}"/>`).join('')}
  </g>

  <!-- brand chip top-left -->
  <g transform="translate(60, 60)">
    <rect width="180" height="40" rx="20" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
    <circle cx="22" cy="20" r="6" fill="${color}"/>
    <text x="40" y="26" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14" font-weight="800" fill="#e5e7eb" letter-spacing="1.5">CRYPTOIA.CA</text>
  </g>

  <!-- accent bar -->
  <rect x="60" y="120" width="120" height="6" rx="3" fill="url(#accentBar)"/>

  <!-- label -->
  <text x="60" y="172" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="20" font-weight="800" fill="${accent}" letter-spacing="4" text-transform="uppercase">TON PROFIL DE TRADER</text>

  <!-- big emoji backdrop -->
  <text x="1000" y="420" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif" font-size="380" text-anchor="middle" opacity="0.18">${emoji}</text>

  <!-- profile name -->
  <text x="60" y="280" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="76" font-weight="900" fill="#ffffff" letter-spacing="-1">${escapeXml(name)}</text>

  <!-- tagline -->
  <text x="60" y="340" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="30" font-weight="600" fill="#9ca3af" font-style="italic">${escapeXml(tagline)}</text>

  <!-- footer pill: CTA -->
  <g transform="translate(60, 510)">
    <rect width="520" height="68" rx="34" fill="${color}" opacity="0.18"/>
    <rect width="520" height="68" rx="34" fill="none" stroke="${color}" stroke-width="2" opacity="0.6"/>
    <text x="40" y="44" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="22" font-weight="800" fill="#ffffff">Quel trader es-tu ?</text>
    <text x="320" y="44" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="20" font-weight="700" fill="${accent}">Fais le test →</text>
  </g>

  <!-- corner emoji big -->
  <text x="950" y="540" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif" font-size="180" text-anchor="middle" filter="url(#soft)">${emoji}</text>
</svg>`;
}

async function renderToPng(profileKey) {
  const profile = OG_PROFILES[profileKey];
  if (!profile) return null;
  const svg = buildSvg(profile);
  return await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

export default function registerQuizOgRoutes(app) {
  app.get('/api/v1/quiz/og/:profileKey.png', async (req, res) => {
    const key = String(req.params.profileKey || '').toLowerCase();
    if (!OG_PROFILES[key]) {
      res.status(404).json({ ok: false, error: 'Unknown profile' });
      return;
    }
    try {
      if (!fs.existsSync(OG_DIR)) fs.mkdirSync(OG_DIR, { recursive: true });
      const file = path.join(OG_DIR, `${key}.png`);
      let buf;
      if (fs.existsSync(file)) {
        buf = fs.readFileSync(file);
      } else {
        buf = await renderToPng(key);
        if (!buf) { res.status(500).json({ ok: false, error: 'Render failed' }); return; }
        try { fs.writeFileSync(file, buf); } catch (e) { console.error('[QuizOG] write error:', e?.message); }
      }
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable'); // 7 days
      res.send(buf);
    } catch (e) {
      console.error('[QuizOG] render error:', e?.message);
      res.status(500).json({ ok: false, error: 'Internal error' });
    }
  });

  // Optional: nuke cache (admin use). Body or query: ?key=adminPwd is not strict here;
  // simply re-render on next request.
  app.post('/api/v1/quiz/og/regenerate', (req, res) => {
    try {
      if (fs.existsSync(OG_DIR)) {
        for (const f of fs.readdirSync(OG_DIR)) {
          try { fs.unlinkSync(path.join(OG_DIR, f)); } catch { /* ignore */ }
        }
      }
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false, error: e?.message });
    }
  });
}
