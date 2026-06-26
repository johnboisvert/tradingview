// Quiz share tracking — counts how many times each profile is shared on each platform.
// Stored as data/quiz_shares.json with a sliding 7-day window for the leaderboard.
//
// Endpoints:
//   POST /api/v1/quiz/share  { profile, platform }  → idempotent-ish: dedupe by IP+profile+platform within 6h
//   GET  /api/v1/quiz/shares                         → { profiles: [{ key, total, week, platforms:{…} }], updatedAt }
//
// This drives the "Profils les plus partagés cette semaine" leaderboard on /quiz.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { generateLegendCode } from './promo_codes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const SHARES_FILE = path.join(DATA_DIR, 'quiz_shares.json');

const VALID_PROFILES = new Set(['hodler', 'scalper', 'swing', 'longterm']);
const VALID_PLATFORMS = new Set(['twitter', 'facebook', 'linkedin', 'whatsapp', 'telegram', 'copy', 'native']);
const DEDUPE_WINDOW_MS = 6 * 60 * 60 * 1000;          // 6h same IP+profile+platform = 1 share
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const INFLUENCER_THRESHOLD = 5;                       // 5+ shares (any profile/platform) → Influenceur badge
const LEGEND_THRESHOLD = 50;                          // 50+ shares (any profile/platform) → Légende badge

function defaultDb() {
  return {
    events: [],              // [{ ts, profile, platform, ipHash, email? }] — pruned to WEEK_MS
    totals: {                // lifetime counters per profile (never pruned)
      hodler: 0, scalper: 0, swing: 0, longterm: 0,
    },
    platformTotals: {        // lifetime counters per profile.platform
      hodler: {}, scalper: {}, swing: {}, longterm: {},
    },
    influencers: {},         // emailLower → { unlocked_at, total_shares }
    legends: {},             // emailLower → { unlocked_at, total_shares } — 50+ shares
    lifetimeShares: {},      // emailLower → lifetime share count (never pruned, used for Légende)
  };
}

function loadDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(SHARES_FILE)) return defaultDb();
    const raw = fs.readFileSync(SHARES_FILE, 'utf8');
    const db = JSON.parse(raw);
    if (!db.events) db.events = [];
    if (!db.totals) db.totals = defaultDb().totals;
    if (!db.platformTotals) db.platformTotals = defaultDb().platformTotals;
    if (!db.influencers) db.influencers = {};
    if (!db.legends) db.legends = {};
    if (!db.lifetimeShares) db.lifetimeShares = {};
    return db;
  } catch (e) {
    console.error('[QuizShares] load error:', e?.message);
    return defaultDb();
  }
}

function saveDb(db) {
  try { fs.writeFileSync(SHARES_FILE, JSON.stringify(db, null, 2)); }
  catch (e) { console.error('[QuizShares] save error:', e?.message); }
}

// Lightweight Discord/Slack webhook notifier — fire-and-forget.
// Set DISCORD_WEBHOOK_URL or SLACK_WEBHOOK_URL in Railway env to enable.
function notifyChatBadgeUnlock({ kind, email, totalShares, promoCode }) {
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (!discordUrl && !slackUrl) return;
  const anon = email && email.includes('@')
    ? `${email.slice(0, 2)}***@${email.split('@')[1].split('.')[0].slice(0, 1)}***`
    : 'anonyme';
  const isLegend = kind === 'legend';
  const title = isLegend ? '👑 Nouveau badge LÉGENDE débloqué !' : '🏆 Nouveau badge Influenceur débloqué !';
  const desc = isLegend
    ? `**${anon}** vient d'atteindre **${totalShares} partages à vie** et entre dans le cercle des Légendes CryptoIA.${promoCode ? `\n🎁 Récompense envoyée par email : un code promo **50% à vie** unique.` : ''}`
    : `**${anon}** a partagé son profil **${totalShares} fois** et débloque le badge Influenceur.`;
  const color = isLegend ? 0xd946ef : 0xf59e0b;

  if (discordUrl) {
    fetch(discordUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title,
          description: desc,
          color,
          timestamp: new Date().toISOString(),
          footer: { text: 'CryptoIA · Quiz Viral · Notifications' },
        }],
      }),
    }).catch((e) => console.error('[QuizShares][Discord] webhook error:', e?.message));
  }
  if (slackUrl) {
    fetch(slackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `*${title}*\n${desc.replace(/\*\*/g, '*')}` }),
    }).catch((e) => console.error('[QuizShares][Slack] webhook error:', e?.message));
  }
}

// Send Resend email with the Legend promo code (fire-and-forget).
async function emailLegendReward({ email, code, totalShares }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'CryptoIA <notifications@cryptoia.ca>';
  if (!apiKey || !email || !code) return;
  const html = `
<!doctype html>
<html><body style="margin:0;background:#0a0a14;font-family:'Segoe UI',Arial,sans-serif;color:#fff;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:64px;line-height:1;">👑</div>
      <h1 style="margin:12px 0 8px;font-size:28px;font-weight:900;background:linear-gradient(90deg,#d946ef,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Tu es entré·e dans la Légende</h1>
      <p style="color:#c4b5fd;font-size:14px;margin:0;">Badge ultime débloqué après ${totalShares} partages à vie</p>
    </div>
    <div style="background:linear-gradient(135deg,rgba(217,70,239,0.15),rgba(168,85,247,0.08));border:2px solid rgba(217,70,239,0.4);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
      <p style="color:#e9d5ff;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Ta récompense exclusive</p>
      <div style="font-family:'Courier New',monospace;font-size:32px;font-weight:900;color:#f5d0fe;letter-spacing:4px;margin:8px 0;background:rgba(0,0,0,0.4);padding:16px;border-radius:12px;border:1px dashed rgba(217,70,239,0.4);">${code}</div>
      <p style="color:#fff;font-size:18px;font-weight:bold;margin:12px 0 4px;">-50% à vie sur ton abonnement</p>
      <p style="color:#9ca3af;font-size:11px;margin:0;">Usage unique · Non cumulable · Sans date d'expiration</p>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="https://cryptoia.ca/abonnements?promo=${encodeURIComponent(code)}" style="display:inline-block;background:linear-gradient(90deg,#d946ef,#a855f7);color:#fff;font-weight:900;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Activer ma réduction →</a>
    </div>
    <p style="color:#9ca3af;font-size:12px;line-height:1.6;text-align:center;">Merci d'avoir partagé CryptoIA autant de fois 🙏 Tu fais partie des rares Légendes qui ont aidé la communauté à grandir. On ne l'oublie pas.</p>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:24px 0;" />
    <p style="color:#6b7280;font-size:11px;text-align:center;margin:0;">CryptoIA · <a href="https://cryptoia.ca" style="color:#a855f7;">cryptoia.ca</a></p>
  </div>
</body></html>`.trim();
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from,
        to: [email],
        subject: '👑 Bienvenue dans la Légende CryptoIA — ton code -50% à vie',
        html,
      }),
    });
    if (!r.ok) console.error('[QuizShares][Resend] legend email failed:', r.status, await r.text().catch(() => ''));
    else console.log(`[QuizShares][Resend] ✅ Legend reward email sent to ${email}`);
  } catch (e) {
    console.error('[QuizShares][Resend] error:', e?.message);
  }
}

function pruneEvents(db) {
  const cutoff = Date.now() - WEEK_MS;
  db.events = db.events.filter(e => e.ts >= cutoff);
}

function hashIp(req) {
  const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0].trim()) || req.ip || req.socket?.remoteAddress || '';
  return crypto.createHash('sha256').update(ip + '|cryptoia.ca').digest('hex').slice(0, 16);
}

function isDuplicate(db, profile, platform, ipHash) {
  const cutoff = Date.now() - DEDUPE_WINDOW_MS;
  return db.events.some(e => e.ts >= cutoff && e.profile === profile && e.platform === platform && e.ipHash === ipHash);
}

export default function registerQuizSharesRoutes(app) {
  // POST /api/v1/quiz/share — record one share event (deduped per IP/profile/platform/6h)
  app.post('/api/v1/quiz/share', (req, res) => {
    try {
      const profile = String(req.body?.profile || '').toLowerCase();
      const platform = String(req.body?.platform || '').toLowerCase();
      const email = String(req.body?.email || '').toLowerCase().trim() || null;
      if (!VALID_PROFILES.has(profile) || !VALID_PLATFORMS.has(platform)) {
        return res.status(400).json({ ok: false, error: 'Invalid profile or platform' });
      }
      const db = loadDb();
      pruneEvents(db);
      const ipHash = hashIp(req);
      if (isDuplicate(db, profile, platform, ipHash)) {
        const influencer = email && db.influencers?.[email];
        const legend = email && db.legends?.[email];
        return res.json({
          ok: true,
          deduped: true,
          total: db.totals[profile] || 0,
          influencer: !!influencer,
          influencer_just_unlocked: false,
          legend: !!legend,
          legend_just_unlocked: false,
        });
      }
      db.events.push({ ts: Date.now(), profile, platform, ipHash, email });
      db.totals[profile] = (db.totals[profile] || 0) + 1;
      if (!db.platformTotals[profile]) db.platformTotals[profile] = {};
      db.platformTotals[profile][platform] = (db.platformTotals[profile][platform] || 0) + 1;

      // Influencer (5 shares within sliding 7-day window) + Legend (50 lifetime shares).
      let justUnlocked = false;
      let legendJustUnlocked = false;
      let totalForUser = 0;
      let lifetimeForUser = 0;
      if (email) {
        totalForUser = db.events.filter(e => e.email === email).length;
        db.lifetimeShares[email] = (db.lifetimeShares[email] || 0) + 1;
        lifetimeForUser = db.lifetimeShares[email];
        const wasUnlocked = !!db.influencers[email];
        if (!wasUnlocked && totalForUser >= INFLUENCER_THRESHOLD) {
          db.influencers[email] = { unlocked_at: new Date().toISOString(), total_shares: totalForUser };
          justUnlocked = true;
          console.log(`[QuizShares] 🏆 Influencer badge unlocked for ${email} (${totalForUser} shares)`);
          notifyChatBadgeUnlock({ kind: 'influencer', email, totalShares: totalForUser });
        } else if (wasUnlocked) {
          db.influencers[email].total_shares = totalForUser;
        }
        const wasLegend = !!db.legends[email];
        if (!wasLegend && lifetimeForUser >= LEGEND_THRESHOLD) {
          // Generate unique LEGEND-XXXXXX promo code (50% off, lifetime, single use)
          const promoCode = generateLegendCode(email);
          db.legends[email] = {
            unlocked_at: new Date().toISOString(),
            total_shares: lifetimeForUser,
            promo_code: promoCode,
          };
          legendJustUnlocked = true;
          console.log(`[QuizShares] 👑 LEGEND badge unlocked for ${email} (${lifetimeForUser} lifetime shares) · code=${promoCode}`);
          notifyChatBadgeUnlock({ kind: 'legend', email, totalShares: lifetimeForUser, promoCode });
          // Send reward email (fire-and-forget, doesn't block the response)
          emailLegendReward({ email, code: promoCode, totalShares: lifetimeForUser }).catch(() => {});
        } else if (wasLegend) {
          db.legends[email].total_shares = lifetimeForUser;
        }
      } else {
        // Fallback for users sharing without email (the shared-view CTA path):
        // count IP shares for completeness, but no badge persisted (no identity to attach).
        totalForUser = db.events.filter(e => e.ipHash === ipHash).length;
      }

      saveDb(db);
      res.json({
        ok: true,
        deduped: false,
        total: db.totals[profile],
        user_total_shares: totalForUser,
        user_lifetime_shares: lifetimeForUser,
        influencer: email ? !!db.influencers[email] : false,
        influencer_just_unlocked: justUnlocked,
        legend: email ? !!db.legends[email] : false,
        legend_just_unlocked: legendJustUnlocked,
        legend_promo_code: email && db.legends[email]?.promo_code ? db.legends[email].promo_code : null,
      });
    } catch (e) {
      console.error('[QuizShares] share error:', e?.message);
      res.status(500).json({ ok: false, error: 'Internal error' });
    }
  });

  // GET /api/v1/quiz/shares — leaderboard of profiles (last 7d count + lifetime total)
  app.get('/api/v1/quiz/shares', (req, res) => {
    try {
      const db = loadDb();
      pruneEvents(db);
      const profiles = ['hodler', 'scalper', 'swing', 'longterm'].map(k => {
        const week = db.events.filter(e => e.profile === k).length;
        return {
          key: k,
          total: db.totals[k] || 0,
          week,
          platforms: db.platformTotals[k] || {},
        };
      }).sort((a, b) => b.week - a.week);
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json({
        ok: true,
        profiles,
        influencers_count: Object.keys(db.influencers || {}).length,
        legends_count: Object.keys(db.legends || {}).length,
        threshold: INFLUENCER_THRESHOLD,
        legend_threshold: LEGEND_THRESHOLD,
        updatedAt: Date.now(),
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: 'Internal error' });
    }
  });

  // GET /api/v1/quiz/me-shares?email=… — per-user view: total shares + influencer flag.
  // Lets the Quiz UI show a personalized progress bar toward the Influenceur badge.
  app.get('/api/v1/quiz/me-shares', (req, res) => {
    try {
      const email = String(req.query.email || '').toLowerCase().trim();
      if (!email || !email.includes('@')) {
        return res.status(400).json({ ok: false, error: 'Invalid email' });
      }
      const db = loadDb();
      pruneEvents(db);
      const total = db.events.filter(e => e.email === email).length;
      const lifetime = db.lifetimeShares?.[email] || 0;
      const influencer = !!db.influencers?.[email];
      const legend = !!db.legends?.[email];
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        ok: true,
        email_hash: email.slice(0, 2) + '***',
        total_shares: total,
        lifetime_shares: lifetime,
        threshold: INFLUENCER_THRESHOLD,
        legend_threshold: LEGEND_THRESHOLD,
        progress_pct: Math.min(100, Math.round((total / INFLUENCER_THRESHOLD) * 100)),
        legend_progress_pct: Math.min(100, Math.round((lifetime / LEGEND_THRESHOLD) * 100)),
        influencer,
        legend,
        unlocked_at: db.influencers?.[email]?.unlocked_at || null,
        legend_unlocked_at: db.legends?.[email]?.unlocked_at || null,
        legend_promo_code: db.legends?.[email]?.promo_code || null,
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: 'Internal error' });
    }
  });

  // GET /api/v1/quiz/influencers — public Top N influencers leaderboard.
  // Emails are anonymized to "ab***@d***" so we can show real users w/o leaking PII.
  // Used by the homepage social-proof block ("Top 10 ambassadors this week").
  app.get('/api/v1/quiz/influencers', (req, res) => {
    try {
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const db = loadDb();
      const anonymize = (e) => {
        if (!e || !e.includes('@')) return '***';
        const [local, domain] = e.split('@');
        const dParts = domain.split('.');
        return `${local.slice(0, 2)}***@${dParts[0].slice(0, 1)}***.${dParts.slice(1).join('.') || 'com'}`;
      };
      const list = Object.entries(db.influencers || {})
        .map(([email, info]) => ({
          email_anonymized: anonymize(email),
          total_shares: info.total_shares || 0,
          lifetime_shares: db.lifetimeShares?.[email] || 0,
          unlocked_at: info.unlocked_at,
          is_legend: !!db.legends?.[email],
        }))
        .sort((a, b) => b.lifetime_shares - a.lifetime_shares)
        .slice(0, limit);
      res.setHeader('Cache-Control', 'public, max-age=120');
      res.json({
        ok: true,
        influencers: list,
        total_count: Object.keys(db.influencers || {}).length,
        legends_count: Object.keys(db.legends || {}).length,
        threshold: INFLUENCER_THRESHOLD,
        legend_threshold: LEGEND_THRESHOLD,
        updatedAt: Date.now(),
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: 'Internal error' });
    }
  });
}
