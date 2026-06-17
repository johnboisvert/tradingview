// Gamification — extracted from server.js (Session 15 refactor)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function register(app) {
// ═══════════════════════════════════════════════════════════════════════════════
// GAMIFICATION SYSTEM — XP, levels, badges, public leaderboard
// ═══════════════════════════════════════════════════════════════════════════════
const GAMI_FILE = path.join(__dirname, '..', 'data', 'gamification.json');
function loadGami() {
  try {
    if (fs.existsSync(GAMI_FILE)) {
      return JSON.parse(fs.readFileSync(GAMI_FILE, 'utf8'));
    }
  } catch (e) { console.error('[Gami] load error:', e?.message); }
  return { users: {} };
}
function saveGami(data) {
  try {
    fs.mkdirSync(path.dirname(GAMI_FILE), { recursive: true });
    fs.writeFileSync(GAMI_FILE, JSON.stringify(data, null, 2));
  } catch (e) { console.error('[Gami] save error:', e?.message); }
}
function levelFromXP(xp) {
  // Level 1: 0-99 XP, Level 2: 100-299, Level 3: 300-599, ...
  // formula: requires n*100 XP cumulative to reach level n+1
  let lvl = 1, need = 100, total = 0;
  while (total + need <= xp) { total += need; lvl++; need = lvl * 100; }
  return { level: lvl, currentLevelXp: xp - total, nextLevelXp: need };
}
const BADGE_CATALOG = [
  { id: 'first_signal',  name: 'Premier Signal',     name_en: 'First Signal',     emoji: '🎯', rarity: 'common',    xp: 50,   desc_fr: 'Reçu ton 1er signal IA',                desc_en: 'Got your 1st AI signal' },
  { id: 'streak_7',      name: '7 Jours d\'affilée', name_en: '7-Day Streak',     emoji: '🔥', rarity: 'rare',      xp: 200,  desc_fr: 'Connecté 7 jours d\'affilée',           desc_en: 'Logged in 7 days in a row' },
  { id: 'streak_30',     name: '30 Jours Légende',   name_en: '30-Day Legend',    emoji: '🏆', rarity: 'legendary', xp: 1000, desc_fr: 'Connecté 30 jours d\'affilée',          desc_en: 'Logged in 30 days in a row' },
  { id: 'first_trade',   name: 'Premier Trade',      name_en: 'First Trade',      emoji: '📈', rarity: 'common',    xp: 75,   desc_fr: 'Enregistré ton 1er trade dans le journal', desc_en: 'Logged your 1st trade in the journal' },
  { id: 'profit_x2',     name: '2x Profit',          name_en: '2x Profit',        emoji: '💰', rarity: 'epic',      xp: 500,  desc_fr: 'Doublé un portfolio simulé',            desc_en: 'Doubled a simulated portfolio' },
  { id: 'profit_x10',    name: '10x Whale',          name_en: '10x Whale',        emoji: '🐋', rarity: 'legendary', xp: 2000, desc_fr: '10x sur un portfolio simulé',           desc_en: '10x on a simulated portfolio' },
  { id: 'first_alert',   name: 'Première Alerte',    name_en: 'First Alert',      emoji: '🔔', rarity: 'common',    xp: 50,   desc_fr: 'Créé ta 1ère alerte IA',                desc_en: 'Created your 1st AI alert' },
  { id: 'master_alerts', name: 'Maître des Alertes', name_en: 'Alert Master',     emoji: '⚡', rarity: 'epic',      xp: 300,  desc_fr: 'Créé 10 alertes IA',                    desc_en: 'Created 10 AI alerts' },
  { id: 'first_backtest',name: 'Stratège',           name_en: 'Strategist',       emoji: '🧠', rarity: 'common',    xp: 75,   desc_fr: 'Lancé ton 1er backtest',                desc_en: 'Ran your 1st backtest' },
  { id: 'backtest_pro',  name: 'Backtest Pro',       name_en: 'Backtest Pro',     emoji: '🎓', rarity: 'rare',      xp: 250,  desc_fr: 'Lancé 25 backtests',                    desc_en: 'Ran 25 backtests' },
  { id: 'first_referral',name: 'Ambassadeur',        name_en: 'Ambassador',       emoji: '🎁', rarity: 'rare',      xp: 300,  desc_fr: '1er filleul converti',                  desc_en: '1st referral converted' },
  { id: 'referral_5',    name: 'Influenceur',        name_en: 'Influencer',       emoji: '🌟', rarity: 'epic',      xp: 800,  desc_fr: '5 filleuls convertis',                  desc_en: '5 referrals converted' },
  { id: 'referral_20',   name: 'Top Affiliate',      name_en: 'Top Affiliate',    emoji: '👑', rarity: 'legendary', xp: 2500, desc_fr: '20 filleuls convertis',                 desc_en: '20 referrals converted' },
  { id: 'whale_watcher', name: 'Whale Watcher',      name_en: 'Whale Watcher',    emoji: '🔱', rarity: 'rare',      xp: 200,  desc_fr: 'Consulté Whale Watcher 10 fois',        desc_en: 'Visited Whale Watcher 10 times' },
  { id: 'gem_hunter',    name: 'Chasseur de Gems',   name_en: 'Gem Hunter',       emoji: '💎', rarity: 'rare',      xp: 200,  desc_fr: 'Utilisé Gem Hunter 10 fois',            desc_en: 'Used Gem Hunter 10 times' },
  { id: 'social_share',  name: 'Réseauteur',         name_en: 'Networker',        emoji: '📣', rarity: 'common',    xp: 50,   desc_fr: 'Partagé sur les réseaux sociaux',       desc_en: 'Shared on social media' },
  { id: 'cmd_k_master',  name: 'Power User',         name_en: 'Power User',       emoji: '⌨️', rarity: 'rare',      xp: 150,  desc_fr: 'Utilisé ⌘K 50 fois',                    desc_en: 'Used ⌘K 50 times' },
  { id: 'magic_owner',   name: 'Magic JB',           name_en: 'Magic JB',         emoji: '✨', rarity: 'legendary', xp: 1500, desc_fr: 'Accès à l\'indicateur Magic JB IA',     desc_en: 'Access to the Magic JB AI indicator' },
  { id: 'feedback',      name: 'Beta-tester',        name_en: 'Beta tester',      emoji: '🐛', rarity: 'rare',      xp: 250,  desc_fr: 'Envoyé du feedback à l\'équipe',        desc_en: 'Sent feedback to the team' },
  { id: 'profile_full',  name: 'Profil Complet',     name_en: 'Complete Profile', emoji: '✅', rarity: 'common',    xp: 100,  desc_fr: 'Profil rempli à 100%',                  desc_en: 'Profile 100% complete' },
];

// GET /api/v1/gamification/catalog — Public badge catalog
app.get('/api/v1/gamification/catalog', (req, res) => {
  res.json({ ok: true, badges: BADGE_CATALOG });
});

// GET /api/v1/gamification/stats/:userKey — User XP, level, badges
app.get('/api/v1/gamification/stats/:userKey', (req, res) => {
  const key = String(req.params.userKey || '').trim().toLowerCase();
  if (!key) return res.status(400).json({ ok: false, error: 'userKey required' });
  const db = loadGami();
  const user = db.users[key] || { xp: 0, badges: [], displayName: key.split('@')[0], createdAt: new Date().toISOString() };
  const lvl = levelFromXP(user.xp);
  res.json({ ok: true, user: { ...user, ...lvl } });
});

// POST /api/v1/gamification/unlock — Unlock a badge for user
app.post('/api/v1/gamification/unlock', (req, res) => {
  const { userKey, badgeId, displayName } = req.body || {};
  const key = String(userKey || '').trim().toLowerCase();
  if (!key || !badgeId) return res.status(400).json({ ok: false, error: 'userKey and badgeId required' });
  const badge = BADGE_CATALOG.find(b => b.id === badgeId);
  if (!badge) return res.status(404).json({ ok: false, error: 'badge not found' });
  const db = loadGami();
  if (!db.users[key]) db.users[key] = { xp: 0, badges: [], displayName: displayName || key.split('@')[0], createdAt: new Date().toISOString() };
  if (db.users[key].badges.find(b => b.id === badgeId)) {
    return res.json({ ok: true, alreadyUnlocked: true, badge });
  }
  db.users[key].badges.push({ id: badgeId, unlockedAt: new Date().toISOString() });
  db.users[key].xp += badge.xp;
  if (displayName) db.users[key].displayName = displayName;
  saveGami(db);
  const lvl = levelFromXP(db.users[key].xp);
  res.json({ ok: true, badge, newXp: db.users[key].xp, ...lvl });
});

// POST /api/v1/gamification/xp — Add XP for an action
app.post('/api/v1/gamification/xp', (req, res) => {
  const { userKey, action, xp, displayName } = req.body || {};
  const key = String(userKey || '').trim().toLowerCase();
  const xpAmount = parseInt(xp, 10) || 0;
  if (!key || xpAmount <= 0) return res.status(400).json({ ok: false, error: 'userKey and positive xp required' });
  const db = loadGami();
  if (!db.users[key]) db.users[key] = { xp: 0, badges: [], displayName: displayName || key.split('@')[0], createdAt: new Date().toISOString() };
  db.users[key].xp += xpAmount;
  if (displayName) db.users[key].displayName = displayName;
  db.users[key].lastActivity = new Date().toISOString();
  saveGami(db);
  const lvl = levelFromXP(db.users[key].xp);
  res.json({ ok: true, action: action || 'unknown', newXp: db.users[key].xp, ...lvl });
});

// GET /api/v1/gamification/leaderboard — Public leaderboard (top 100 by XP)
app.get('/api/v1/gamification/leaderboard', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  const db = loadGami();
  const list = Object.entries(db.users).map(([key, u]) => {
    const lvl = levelFromXP(u.xp);
    return {
      anonKey: key.length > 4 ? key.slice(0, 2) + '***' + key.slice(-2) : '****',
      displayName: u.displayName || 'Anonymous',
      xp: u.xp,
      level: lvl.level,
      badges: u.badges?.length || 0,
      lastActivity: u.lastActivity || u.createdAt,
    };
  }).sort((a, b) => b.xp - a.xp).slice(0, limit);
  res.json({ ok: true, total: Object.keys(db.users).length, leaderboard: list });
});

};
