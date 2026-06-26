// Trading Challenge — Paper Trading public mensuel
// $1000 virtuels par mois, leaderboard public, reset auto le 1er du mois,
// notification du gagnant via Resend (1 mois Premium gratuit en récompense).
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHALLENGE_FILE = path.join(__dirname, '..', 'data', 'challenge.json');
const STARTING_BALANCE = 1000; // virtual $

function currentPeriod() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function loadDb() {
  try { if (fs.existsSync(CHALLENGE_FILE)) return JSON.parse(fs.readFileSync(CHALLENGE_FILE, 'utf8')); } catch { /* fallthrough */ }
  return { current_period: currentPeriod(), participants: {}, history: {}, last_winner: null };
}
function saveDb(db) {
  try {
    fs.mkdirSync(path.dirname(CHALLENGE_FILE), { recursive: true });
    fs.writeFileSync(CHALLENGE_FILE, JSON.stringify(db, null, 2));
  } catch (e) { console.error('[Challenge] save error:', e?.message); }
}

function ensureParticipant(db, email, username) {
  const key = email.toLowerCase();
  if (!db.participants[key]) {
    db.participants[key] = {
      email: key,
      username: (username || email.split('@')[0]).slice(0, 24),
      joined_at: new Date().toISOString(),
      balance: STARTING_BALANCE,
      positions: {},
      pending_orders: [],
      trades: [],
      pnl_realized: 0,
      // Gamification
      achievements: [],          // [{ key, unlocked_at }]
      equity_history: [],        // [{ ts, equity }] — 1 snapshot per day max
      win_streak: 0,
      stats: { wins: 0, losses: 0, best_pnl: 0, worst_pnl: 0, largest_trade_value: 0, liquidations: 0 },
    };
  }
  const p = db.participants[key];
  if (p.positions && !Array.isArray(p.pending_orders)) p.pending_orders = [];
  if (!Array.isArray(p.achievements)) p.achievements = [];
  if (!Array.isArray(p.equity_history)) p.equity_history = [];
  if (!p.stats) p.stats = { wins: 0, losses: 0, best_pnl: 0, worst_pnl: 0, largest_trade_value: 0, liquidations: 0 };
  if (typeof p.win_streak !== 'number') p.win_streak = 0;
  // Migrate legacy positions
  for (const k of Object.keys(p.positions || {})) {
    const v = p.positions[k];
    if (v && typeof v === 'object' && !v.side && typeof v.qty === 'number') {
      const newKey = `${k}_long`;
      p.positions[newKey] = {
        id: crypto.randomBytes(6).toString('hex'),
        symbol: k, side: 'long', qty: v.qty, avg_price: v.avg_price,
        opened_at: new Date().toISOString(),
        collateral: v.qty * v.avg_price,
        leverage: 1,
      };
      delete p.positions[k];
    }
  }
  return p;
}

// ─── ACHIEVEMENTS / BADGES ──────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { key: 'first_trade', emoji: '🎯', name: 'Premier Trade', desc: 'Ouvre ta première position' },
  { key: 'first_profit', emoji: '💰', name: 'Premier Profit', desc: 'Ferme une position en gain' },
  { key: 'win_streak_5', emoji: '🔥', name: '5 Wins de Suite', desc: 'Enchaîne 5 trades gagnants' },
  { key: 'win_streak_10', emoji: '⚡', name: 'Hot Streak', desc: '10 trades gagnants d\'affilée' },
  { key: 'big_win', emoji: '💎', name: 'Diamond Hands', desc: 'Gagne plus de $100 sur un trade' },
  { key: 'huge_win', emoji: '🚀', name: 'Moon Trader', desc: 'Gagne plus de $500 sur un trade' },
  { key: 'whale_trader', emoji: '🐋', name: 'Whale Trader', desc: 'Ouvre une position de plus de $5,000' },
  { key: 'leverage_master', emoji: '🎰', name: 'Leverage Master', desc: 'Trade en 25x ou plus' },
  { key: 'leverage_legend', emoji: '🎲', name: 'Maximum Lev', desc: 'Trade en 50x' },
  { key: 'short_seller', emoji: '↘️', name: 'Bear Trader', desc: 'Ouvre ta première position SHORT' },
  { key: 'survivor', emoji: '🛡️', name: 'Survivor', desc: 'Survis à une liquidation (qui se relève)' },
  { key: 'tp_master', emoji: '🎯', name: 'TP Master', desc: 'Atteins un Take Profit (TP)' },
  { key: 'roi_10', emoji: '📈', name: '+10% Trader', desc: 'Atteins +10% ROI sur le mois' },
  { key: 'roi_50', emoji: '🏆', name: '+50% Beast', desc: 'Atteins +50% ROI sur le mois' },
  { key: 'roi_100', emoji: '👑', name: 'Double ou Rien', desc: 'Atteins +100% ROI sur le mois' },
];
const ACHIEVEMENTS_MAP = Object.fromEntries(ACHIEVEMENTS.map(a => [a.key, a]));

function unlockBadge(p, key) {
  if (!ACHIEVEMENTS_MAP[key]) return false;
  if (p.achievements.find(a => a.key === key)) return false;
  p.achievements.push({ key, unlocked_at: new Date().toISOString() });
  return true;
}

// Snapshot equity once per day max
function snapshotEquity(p, equity) {
  if (!Array.isArray(p.equity_history)) p.equity_history = [];
  const today = new Date().toISOString().slice(0, 10);
  const last = p.equity_history[p.equity_history.length - 1];
  if (last && last.ts.slice(0, 10) === today) {
    last.equity = equity; // update intraday
    last.updated_at = new Date().toISOString();
  } else {
    p.equity_history.push({ ts: new Date().toISOString(), equity });
    // Keep max 60 days
    if (p.equity_history.length > 60) p.equity_history = p.equity_history.slice(-60);
  }
}

// Track a closing trade for stats / badges
function processTradeForGamification(p, trade, currentEquity) {
  // Defensive defaults (in case legacy participant not yet migrated)
  if (!Array.isArray(p.achievements)) p.achievements = [];
  if (!p.stats) p.stats = { wins: 0, losses: 0, best_pnl: 0, worst_pnl: 0, largest_trade_value: 0, liquidations: 0 };
  if (typeof p.win_streak !== 'number') p.win_streak = 0;
  // Stats
  if (trade.action === 'close') {
    const pnl = trade.pnl || 0;
    if (pnl > 0) {
      p.stats.wins += 1;
      p.win_streak += 1;
      if (pnl > p.stats.best_pnl) p.stats.best_pnl = pnl;
      unlockBadge(p, 'first_profit');
      if (pnl >= 100) unlockBadge(p, 'big_win');
      if (pnl >= 500) unlockBadge(p, 'huge_win');
    } else if (pnl < 0) {
      p.stats.losses += 1;
      p.win_streak = 0;
      if (pnl < p.stats.worst_pnl) p.stats.worst_pnl = pnl;
    }
    if (p.win_streak >= 5) unlockBadge(p, 'win_streak_5');
    if (p.win_streak >= 10) unlockBadge(p, 'win_streak_10');
    if (trade.trigger === 'take_profit') unlockBadge(p, 'tp_master');
    if (trade.trigger === 'liquidation') p.stats.liquidations += 1;
  }
  if (trade.action === 'open') {
    unlockBadge(p, 'first_trade');
    if (trade.value > p.stats.largest_trade_value) p.stats.largest_trade_value = trade.value;
    if (trade.value >= 5000) unlockBadge(p, 'whale_trader');
    if (trade.side === 'short') unlockBadge(p, 'short_seller');
    if (trade.leverage >= 25) unlockBadge(p, 'leverage_master');
    if (trade.leverage >= 50) unlockBadge(p, 'leverage_legend');
  }
  // ROI badges
  const roi = ((currentEquity - STARTING_BALANCE) / STARTING_BALANCE) * 100;
  if (roi >= 10) unlockBadge(p, 'roi_10');
  if (roi >= 50) unlockBadge(p, 'roi_50');
  if (roi >= 100) unlockBadge(p, 'roi_100');
  // Survivor: had liquidation but equity back > starting
  if (p.stats.liquidations > 0 && currentEquity > STARTING_BALANCE) unlockBadge(p, 'survivor');
}

// Global recent trade feed (last N across all users, anonymized usernames)
// Filters out: orphaned legacy trades whose symbol is no longer in the universe,
// and normalizes numeric fields so the UI never receives NaN/undefined for closes.
function getRecentTrades(db, limit = 30) {
  const all = [];
  const validSymbols = Object.keys(universe || {});
  const universeSet = new Set(validSymbols);
  const hasUniverse = universeSet.size > 0;
  for (const p of Object.values(db.participants || {})) {
    for (const t of (p.trades || []).slice(-15)) {
      if (!t || !t.symbol) continue;
      const sym = String(t.symbol).toUpperCase();
      // Drop trades for coins no longer in the curated universe (scam coins removed, delisted, etc.)
      if (hasUniverse && !universeSet.has(sym)) continue;
      const isClose = t.action === 'close';
      const value = Number.isFinite(t.value) ? t.value : (Number.isFinite(t.qty) && Number.isFinite(t.price) ? t.qty * t.price : 0);
      // For closes, always surface a numeric pnl (default 0) so the UI shows the badge.
      const pnl = isClose ? (Number.isFinite(t.pnl) ? t.pnl : 0) : (Number.isFinite(t.pnl) ? t.pnl : undefined);
      all.push({
        ts: t.ts,
        action: t.action,
        side: t.side,
        symbol: sym,
        qty: Number.isFinite(t.qty) ? t.qty : 0,
        price: Number.isFinite(t.price) ? t.price : 0,
        value,
        pnl,
        trigger: t.trigger,
        leverage: Number.isFinite(t.leverage) ? t.leverage : 1,
        username: p.username,
      });
    }
  }
  return all.sort((a, b) => (b.ts || '').localeCompare(a.ts || '')).slice(0, limit);
}

// Compute unrealized PnL for a single position (leverage-aware)
// PnL is computed on the full notional (qty * price_diff), NOT on the collateral.
function positionPnL(pos, mark) {
  if (!mark || !pos) return 0;
  if (pos.side === 'short') return (pos.avg_price - mark) * pos.qty;
  return (mark - pos.avg_price) * pos.qty;
}
// Liquidation price for a leveraged position.
// Maintenance margin = 0 (full collateral can be lost).
// LONG liq when (entry - liq) * qty = collateral → liq = entry - (collateral/qty)
// SHORT liq when (liq - entry) * qty = collateral → liq = entry + (collateral/qty)
function liquidationPrice(pos) {
  if (!pos || !pos.qty || !pos.collateral) return null;
  const perUnit = pos.collateral / pos.qty;
  return pos.side === 'short' ? pos.avg_price + perUnit : Math.max(0, pos.avg_price - perUnit);
}
// Position value used in equity calc:
// Long:  collateral + PnL  (because asset is leveraged, the unleveraged value = collateral + pnl)
// Short: collateral + PnL  (same logic — collateral is the only "real" risk)
function positionEquityContribution(pos, mark) {
  return (pos.collateral || 0) + positionPnL(pos, mark);
}

// Compute equity (cash + position contributions)
function computeEquity(p, prices) {
  let equity = p.balance;
  for (const pos of Object.values(p.positions || {})) {
    const px = prices[pos.symbol] || pos.avg_price || 0;
    equity += positionEquityContribution(pos, px);
  }
  return equity;
}

// Simple in-memory price cache (15s TTL)
let priceCache = { ts: 0, data: {} };
// Symbol blocklist — stablecoins, wrapped/staked tokens that aren't relevant for trading challenge
const SYMBOL_BLOCKLIST = new Set([
  'USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDD', 'USDE', 'FDUSD', 'PYUSD', 'USDS',
  'WBTC', 'WETH', 'STETH', 'WSTETH', 'WEETH', 'WBETH', 'CBETH', 'RETH', 'METH', 'EZETH', 'RSETH', 'BSC-USD',
]);

// Quality filters to keep the universe clean (no scam coins)
const MIN_MARKET_CAP = 500_000_000; // $500M minimum
const ASCII_NAME = /^[\x20-\x7E]+$/; // only printable ASCII chars in name

function isQualityCoin(c) {
  if (!c || typeof c !== 'object') return false;
  const sym = String(c.symbol || '').toUpperCase();
  if (!sym || SYMBOL_BLOCKLIST.has(sym)) return false;
  if (typeof c.current_price !== 'number' || c.current_price <= 0) return false;
  if (typeof c.market_cap !== 'number' || c.market_cap < MIN_MARKET_CAP) return false;
  // No non-Latin characters in name (filters Chinese/Korean/Arabic scam tokens)
  if (!c.name || !ASCII_NAME.test(c.name)) return false;
  // Filter obvious scam patterns in name
  const lowerName = c.name.toLowerCase();
  if (lowerName.includes('life') && lowerName.includes('binance')) return false;
  if (lowerName.match(/\b(scam|fake|test|copy)\b/)) return false;
  return true;
}

// Dynamic universe (top 100 cryptos by market cap). Built from CoinGecko warm cache.
// { SYMBOL: { id, name, image, price } } — refreshed every getPrices() call.
let universe = {};
let universeRanked = []; // ordered by market cap rank (for /symbols endpoint)

async function getPrices() {
  const now = Date.now();
  if (now - priceCache.ts < 15000 && Object.keys(priceCache.data).length > 0) {
    return priceCache.data;
  }
  const port = process.env.PORT || 8765;
  // Top 100 by market cap. Same URL as Telegram cron → warm cache hit guaranteed.
  const url = `http://localhost:${port}/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const arr = await r.json();
    if (!Array.isArray(arr)) return priceCache.data || {};

    const out = {};
    const newUniverse = {};
    const ranked = [];
    for (const c of arr) {
      if (!isQualityCoin(c)) continue;
      const sym = String(c.symbol).toUpperCase();
      // De-dup: keep first occurrence of a symbol (highest market cap)
      if (newUniverse[sym]) continue;
      out[sym] = c.current_price;
      newUniverse[sym] = {
        id: c.id,
        name: c.name,
        image: c.image || null,
        price: c.current_price,
        change_24h: c.price_change_percentage_24h || 0,
        rank: c.market_cap_rank || 999,
        market_cap: c.market_cap,
      };
      ranked.push(sym);
    }
    if (Object.keys(out).length > 0) {
      priceCache = { ts: now, data: out };
      universe = newUniverse;
      universeRanked = ranked;
    }
    return Object.keys(out).length > 0 ? out : priceCache.data;
  } catch (e) {
    console.error('[Challenge] price fetch error:', e?.message);
    return priceCache.data || {};
  }
}

// ─── Winner email ──────────────────────────────────────────────────────────
function buildWinnerEmailHtml(winner, period, equity) {
  const roi = ((equity - STARTING_BALANCE) / STARTING_BALANCE) * 100;
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e7eb;">
<div style="max-width:640px;margin:0 auto;background:#0f0f1a;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
  <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:40px 28px;text-align:center;">
    <div style="font-size:64px;line-height:1;margin-bottom:8px;">🏆</div>
    <h1 style="margin:0;font-size:26px;color:white;font-weight:900;">Tu as gagné !</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);">Trading Challenge ${period}</p>
  </div>
  <div style="padding:28px;">
    <p style="font-size:15px;line-height:1.6;color:#d1d5db;">Félicitations <b>${winner.username}</b> ! Tu termines #1 du Trading Challenge de ${period} avec un équity de <b style="color:#10b981;">$${equity.toFixed(2)}</b> (${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%).</p>
    <div style="margin-top:24px;padding:24px;background:#0a0a14;border-radius:12px;border-left:4px solid #f59e0b;">
      <h2 style="margin:0 0 12px;font-size:16px;color:#fbbf24;">🎁 Ta récompense</h2>
      <p style="margin:0;font-size:14px;color:#e5e7eb;line-height:1.6;">1 mois <b>CryptoIA Premium gratuit</b>. Réponds à cet email avec ton compte CryptoIA et on l'active sous 24h.</p>
    </div>
    <p style="margin:32px 0 0;font-size:12px;color:#6b7280;text-align:center;">© CryptoIA · <a href="https://www.cryptoia.ca" style="color:#a78bfa;">cryptoia.ca</a></p>
  </div>
</div>
</body></html>`;
}

async function endOfMonthSettlement(resendClientGetter) {
  const db = loadDb();
  const oldPeriod = db.current_period;
  const newPeriod = currentPeriod();
  if (oldPeriod === newPeriod) return; // not a new month yet

  // Snapshot leaderboard
  const symbols = new Set();
  for (const p of Object.values(db.participants)) {
    for (const s of Object.keys(p.positions || {})) symbols.add(s);
  }
  const prices = symbols.size ? await getPrices(Array.from(symbols)) : {};

  const ranked = Object.values(db.participants)
    .map(p => ({ ...p, equity: computeEquity(p, prices) }))
    .sort((a, b) => b.equity - a.equity);

  db.history[oldPeriod] = {
    closed_at: new Date().toISOString(),
    top10: ranked.slice(0, 10).map(p => ({
      username: p.username, email: p.email, equity: p.equity,
      roi_pct: ((p.equity - STARTING_BALANCE) / STARTING_BALANCE) * 100,
    })),
  };

  // Notify winner
  const winner = ranked[0];
  if (winner && winner.equity > STARTING_BALANCE) {
    db.last_winner = { period: oldPeriod, username: winner.username, email: winner.email, equity: winner.equity };
    try {
      const resendClient = typeof resendClientGetter === 'function' ? await resendClientGetter() : null;
      if (resendClient) {
        const from = process.env.RESEND_FROM_EMAIL || 'CryptoIA <noreply@cryptoia.ca>';
        await resendClient.emails.send({
          from, to: winner.email,
          subject: `🏆 Tu as gagné le Trading Challenge ${oldPeriod} !`,
          html: buildWinnerEmailHtml(winner, oldPeriod, winner.equity),
        });
        console.log(`[Challenge] Winner email sent to ${winner.email} for ${oldPeriod}`);
      }
    } catch (e) { console.error('[Challenge] winner email error:', e?.message); }
  }

  // Reset all participants to fresh $1000
  for (const p of Object.values(db.participants)) {
    p.balance = STARTING_BALANCE;
    p.positions = {};
    p.trades = [];
    p.pnl_realized = 0;
  }
  db.current_period = newPeriod;
  saveDb(db);
  console.log(`[Challenge] Period rolled ${oldPeriod} → ${newPeriod}`);
}

// Helper to enrich participant response with computed fields
function enrichParticipant(p, prices) {
  const positions = {};
  for (const [k, pos] of Object.entries(p.positions || {})) {
    const livePrice = prices[pos.symbol];
    const mark = Number.isFinite(livePrice) && livePrice > 0 ? livePrice : (pos.avg_price || 0);
    const rawPnl = positionPnL(pos, mark);
    const pnl = Number.isFinite(rawPnl) ? rawPnl : 0;
    const collateral = Number.isFinite(pos.collateral) ? pos.collateral : 0;
    positions[k] = {
      ...pos,
      mark,
      value: positionEquityContribution(pos, mark),
      pnl,
      pnl_pct: collateral > 0 ? (pnl / collateral) * 100 : 0,
      liquidation_price: liquidationPrice(pos),
      leverage: pos.leverage || 1,
    };
  }
  const equity = computeEquity(p, prices);
  // Normalize per-user trade history: ensure numeric fields, set close pnl to 0 if undefined
  const safeTrades = (p.trades || []).slice(-50).map(t => {
    const isClose = t.action === 'close';
    return {
      ts: t.ts,
      action: t.action,
      side: t.side,
      symbol: String(t.symbol || '').toUpperCase(),
      qty: Number.isFinite(t.qty) ? t.qty : 0,
      price: Number.isFinite(t.price) ? t.price : 0,
      value: Number.isFinite(t.value) ? t.value : (Number.isFinite(t.qty) && Number.isFinite(t.price) ? t.qty * t.price : 0),
      pnl: isClose ? (Number.isFinite(t.pnl) ? t.pnl : 0) : (Number.isFinite(t.pnl) ? t.pnl : undefined),
      trigger: t.trigger,
      leverage: Number.isFinite(t.leverage) ? t.leverage : 1,
    };
  }).reverse();
  return {
    username: p.username,
    balance: p.balance,
    positions,
    equity,
    roi_pct: ((equity - STARTING_BALANCE) / STARTING_BALANCE) * 100,
    trades: safeTrades,
    prices,
    pnl_realized: p.pnl_realized || 0,
    achievements: p.achievements || [],
    equity_history: p.equity_history || [],
    win_streak: p.win_streak || 0,
    stats: p.stats || {},
  };
}

// Watcher: check every 20s for triggered SL/TP and auto-close positions
async function checkStopOrders() {
  const db = loadDb();
  if (!db.participants) return;
  await getPrices();
  const prices = priceCache.data;
  if (Object.keys(prices).length === 0) return;

  let touched = false;
  for (const p of Object.values(db.participants)) {
    if (!p.positions) continue;
    const posKeys = Object.keys(p.positions);
    for (const key of posKeys) {
      const pos = p.positions[key];
      if (!pos) continue;
      const mark = prices[pos.symbol];
      if (!mark) continue;
      let trigger = null;
      // Check liquidation FIRST (irrecoverable)
      const liq = liquidationPrice(pos);
      if (liq !== null) {
        if (pos.side === 'long' && mark <= liq) trigger = 'liquidation';
        else if (pos.side === 'short' && mark >= liq) trigger = 'liquidation';
      }
      if (!trigger && pos.side === 'long') {
        if (pos.sl && mark <= pos.sl) trigger = 'stop_loss';
        else if (pos.tp && mark >= pos.tp) trigger = 'take_profit';
      } else if (!trigger && pos.side === 'short') {
        if (pos.sl && mark >= pos.sl) trigger = 'stop_loss';
        else if (pos.tp && mark <= pos.tp) trigger = 'take_profit';
      }
      if (!trigger) continue;

      const closeQty = pos.qty;
      // For liquidation, close at the liquidation price (collateral wiped exactly)
      const closePx = trigger === 'liquidation' ? liq : mark;
      const realized = pos.side === 'short' ? (pos.avg_price - closePx) * closeQty : (closePx - pos.avg_price) * closeQty;
      p.balance += (pos.collateral || 0) + realized;
      p.pnl_realized = (p.pnl_realized || 0) + realized;
      p.trades.push({ ts: new Date().toISOString(), action: 'close', side: pos.side, symbol: pos.symbol, qty: closeQty, price: closePx, value: closeQty * closePx, pnl: realized, trigger, leverage: pos.leverage || 1 });
      // Gamification on auto-close
      const eq3 = computeEquity(p, prices);
      processTradeForGamification(p, p.trades[p.trades.length - 1], eq3);
      snapshotEquity(p, eq3);
      delete p.positions[key];
      touched = true;
      console.log(`[Challenge] ${trigger.toUpperCase()} triggered for ${p.username} ${pos.side} ${pos.symbol} @ $${closePx.toFixed(4)} PnL=$${realized.toFixed(2)}`);
    }
  }
  if (touched) saveDb(db);
}

export default function register(app, { resendClientGetter }) {
  // Ensure period is current at startup (catches missed cron during downtime)
  endOfMonthSettlement(resendClientGetter).catch(() => {});

  // Warm the price/universe cache shortly after boot (give the CG cache time to populate)
  setTimeout(() => { getPrices().catch(() => {}); }, 15000);
  // Refresh prices every 60s so /symbols and leaderboard always have fresh data
  setInterval(() => { getPrices().catch(() => {}); }, 60 * 1000);
  // SL/TP watcher every 20s
  setTimeout(() => { checkStopOrders().catch(() => {}); }, 25000);
  setInterval(() => { checkStopOrders().catch(e => console.error('[Challenge] watcher error:', e?.message)); }, 20 * 1000);

  // Check every 30 minutes if month changed (matches pattern used in blog_cron/daily_brief)
  setInterval(() => {
    endOfMonthSettlement(resendClientGetter).catch(e => console.error('[Challenge] settlement error:', e?.message));
  }, 30 * 60 * 1000);

  // POST /api/v1/challenge/join — register participant
  app.post('/api/v1/challenge/join', async (req, res) => {
    const { email, username } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Email invalide' });
    }
    const db = loadDb();
    const p = ensureParticipant(db, email, username);
    saveDb(db);
    await getPrices();
    res.json({ ok: true, participant: enrichParticipant(p, priceCache.data) });
  });

  // GET /api/v1/challenge/me?email=...
  app.get('/api/v1/challenge/me', async (req, res) => {
    const email = String(req.query.email || '').toLowerCase();
    if (!email) return res.status(400).json({ ok: false, error: 'Email requis' });
    const db = loadDb();
    const p = db.participants[email];
    if (!p) return res.json({ ok: true, participant: null });
    ensureParticipant(db, email, p.username); // run migration
    saveDb(db);
    await getPrices();
    res.json({ ok: true, participant: enrichParticipant(p, priceCache.data) });
  });

  // POST /api/v1/challenge/trade — open OR close position(s)
  // body: { email, action: 'open'|'close', side: 'long'|'short' (open only),
  //         symbol, qty, position_id? (close only), sl?, tp? (open only) }
  // Legacy compat: { side: 'buy'|'sell' } → action open long / close long
  app.post('/api/v1/challenge/trade', async (req, res) => {
    let { email, action, side, symbol, qty, position_id, sl, tp, leverage } = req.body || {};
    if (!email || !symbol || !qty) return res.status(400).json({ ok: false, error: 'Paramètres manquants' });
    // Legacy compat: buy/sell → open long / close long
    if (!action && side) {
      const sl2 = String(side).toLowerCase();
      if (sl2 === 'buy') { action = 'open'; side = 'long'; }
      else if (sl2 === 'sell') { action = 'close'; side = 'long'; }
    }
    action = String(action || '').toLowerCase();
    side = String(side || 'long').toLowerCase();
    if (!['open', 'close'].includes(action)) return res.status(400).json({ ok: false, error: 'Action invalide (open|close)' });
    if (!['long', 'short'].includes(side)) return res.status(400).json({ ok: false, error: 'Side invalide (long|short)' });

    const sym = String(symbol).toUpperCase();
    const qtyNum = Math.abs(parseFloat(qty));
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) return res.status(400).json({ ok: false, error: 'Quantité invalide' });
    // Leverage: 1x to 50x (default 1x = spot equivalent)
    let lev = parseFloat(leverage);
    if (!Number.isFinite(lev) || lev < 1) lev = 1;
    if (lev > 50) lev = 50;

    const db = loadDb();
    const p = db.participants[email.toLowerCase()];
    if (!p) return res.status(404).json({ ok: false, error: 'Participe d\'abord au challenge' });
    ensureParticipant(db, email, p.username); // run migration if needed

    await getPrices();
    const price = priceCache.data[sym];
    if (!price) return res.status(400).json({ ok: false, error: `Crypto non supportée: ${sym}` });

    const value = qtyNum * price;
    const collateralRequired = value / lev;
    const posKey = `${sym}_${side}`;

    if (action === 'open') {
      // Validate SL/TP coherence
      const slNum = sl !== undefined && sl !== null && sl !== '' ? parseFloat(sl) : null;
      const tpNum = tp !== undefined && tp !== null && tp !== '' ? parseFloat(tp) : null;
      if (slNum !== null) {
        if (side === 'long' && slNum >= price) return res.status(400).json({ ok: false, error: 'SL doit être < prix actuel pour un LONG' });
        if (side === 'short' && slNum <= price) return res.status(400).json({ ok: false, error: 'SL doit être > prix actuel pour un SHORT' });
      }
      if (tpNum !== null) {
        if (side === 'long' && tpNum <= price) return res.status(400).json({ ok: false, error: 'TP doit être > prix actuel pour un LONG' });
        if (side === 'short' && tpNum >= price) return res.status(400).json({ ok: false, error: 'TP doit être < prix actuel pour un SHORT' });
      }

      // Lock collateral from balance (with leverage, collateral < notional)
      if (collateralRequired > p.balance + 0.01) return res.status(400).json({ ok: false, error: `Collateral insuffisant (besoin $${collateralRequired.toFixed(2)}, dispo $${p.balance.toFixed(2)})` });
      p.balance -= collateralRequired;

      const existing = p.positions[posKey];
      if (existing) {
        const newQty = existing.qty + qtyNum;
        existing.avg_price = newQty > 0 ? (existing.qty * existing.avg_price + qtyNum * price) / newQty : price;
        existing.qty = newQty;
        existing.collateral = (existing.collateral || 0) + collateralRequired;
        // Weighted-average leverage update
        const oldNotional = existing.qty * existing.avg_price;
        existing.leverage = oldNotional > 0 ? (existing.leverage || 1) : lev;
        if (slNum !== null) existing.sl = slNum;
        if (tpNum !== null) existing.tp = tpNum;
      } else {
        p.positions[posKey] = {
          id: crypto.randomBytes(6).toString('hex'),
          symbol: sym, side, qty: qtyNum, avg_price: price, opened_at: new Date().toISOString(),
          collateral: collateralRequired,
          leverage: lev,
          ...(slNum !== null ? { sl: slNum } : {}),
          ...(tpNum !== null ? { tp: tpNum } : {}),
        };
      }
      p.trades.push({ ts: new Date().toISOString(), action: 'open', side, symbol: sym, qty: qtyNum, price, value, leverage: lev, collateral: collateralRequired });
      // Gamification
      const eq1 = computeEquity(p, priceCache.data);
      processTradeForGamification(p, p.trades[p.trades.length - 1], eq1);
      snapshotEquity(p, eq1);
    } else {
      // CLOSE
      let pos = position_id ? Object.values(p.positions).find(x => x.id === position_id) : p.positions[posKey];
      if (!pos) return res.status(400).json({ ok: false, error: `Aucune position ${side} ouverte sur ${sym}` });
      const closeQty = Math.min(qtyNum, pos.qty);
      // Realized PnL on full notional (leveraged)
      const realized = pos.side === 'short'
        ? (pos.avg_price - price) * closeQty
        : (price - pos.avg_price) * closeQty;
      // Return locked collateral proportional to closed qty
      const collateralReturn = (pos.collateral || 0) * (closeQty / pos.qty);
      p.balance += collateralReturn + realized;
      p.pnl_realized += realized;
      pos.qty -= closeQty;
      pos.collateral = (pos.collateral || 0) - collateralReturn;
      if (pos.qty < 1e-9) {
        const key = Object.keys(p.positions).find(k => p.positions[k]?.id === pos.id) || posKey;
        delete p.positions[key];
      }
      p.trades.push({ ts: new Date().toISOString(), action: 'close', side: pos.side, symbol: sym, qty: closeQty, price, value: closeQty * price, pnl: realized, leverage: pos.leverage || 1 });
      // Gamification
      const eq2 = computeEquity(p, priceCache.data);
      processTradeForGamification(p, p.trades[p.trades.length - 1], eq2);
      snapshotEquity(p, eq2);
    }

    saveDb(db);

    const allPrices = priceCache.data;
    const equity = computeEquity(p, allPrices);
    res.json({
      ok: true,
      participant: enrichParticipant(p, allPrices),
      executed: { action, side, symbol: sym, qty: qtyNum, price, value },
      _legacy_equity: equity,
    });
  });

  // POST /api/v1/challenge/position/update — set SL/TP on existing position
  // body: { email, position_id, sl?, tp? }  (null to clear)
  app.post('/api/v1/challenge/position/update', async (req, res) => {
    const { email, position_id, sl, tp } = req.body || {};
    if (!email || !position_id) return res.status(400).json({ ok: false, error: 'Paramètres manquants' });
    const db = loadDb();
    const p = db.participants[String(email).toLowerCase()];
    if (!p) return res.status(404).json({ ok: false, error: 'Participant introuvable' });
    const posKey = Object.keys(p.positions).find(k => p.positions[k]?.id === position_id);
    if (!posKey) return res.status(404).json({ ok: false, error: 'Position introuvable' });
    const pos = p.positions[posKey];

    await getPrices();
    const mark = priceCache.data[pos.symbol];

    if (sl === null || sl === '') delete pos.sl;
    else if (sl !== undefined) {
      const v = parseFloat(sl);
      if (!Number.isFinite(v)) return res.status(400).json({ ok: false, error: 'SL invalide' });
      if (mark) {
        if (pos.side === 'long' && v >= mark) return res.status(400).json({ ok: false, error: 'SL doit être < prix actuel pour LONG' });
        if (pos.side === 'short' && v <= mark) return res.status(400).json({ ok: false, error: 'SL doit être > prix actuel pour SHORT' });
      }
      pos.sl = v;
    }
    if (tp === null || tp === '') delete pos.tp;
    else if (tp !== undefined) {
      const v = parseFloat(tp);
      if (!Number.isFinite(v)) return res.status(400).json({ ok: false, error: 'TP invalide' });
      if (mark) {
        if (pos.side === 'long' && v <= mark) return res.status(400).json({ ok: false, error: 'TP doit être > prix actuel pour LONG' });
        if (pos.side === 'short' && v >= mark) return res.status(400).json({ ok: false, error: 'TP doit être < prix actuel pour SHORT' });
      }
      pos.tp = v;
    }
    saveDb(db);
    res.json({ ok: true, position: pos });
  });

  // GET /api/v1/challenge/leaderboard — public top 20
  app.get('/api/v1/challenge/leaderboard', async (req, res) => {
    const db = loadDb();
    const allSymbols = new Set();
    for (const p of Object.values(db.participants)) {
      for (const s of Object.keys(p.positions || {})) allSymbols.add(s);
    }
    const prices = allSymbols.size ? await getPrices(Array.from(allSymbols)) : {};
    const ranked = Object.values(db.participants)
      .map(p => {
        const equity = computeEquity(p, prices);
        return {
          username: p.username,
          equity,
          roi_pct: ((equity - STARTING_BALANCE) / STARTING_BALANCE) * 100,
          trade_count: (p.trades || []).length,
        };
      })
      .sort((a, b) => b.equity - a.equity)
      .slice(0, 20);

    res.json({
      ok: true,
      period: db.current_period,
      starting_balance: STARTING_BALANCE,
      total_participants: Object.keys(db.participants).length,
      leaderboard: ranked,
      last_winner: db.last_winner || null,
      prize: '1 mois CryptoIA Premium gratuit',
    });
  });

  // GET /api/v1/challenge/symbols — dynamic top 100 from CoinGecko market cap
  app.get('/api/v1/challenge/symbols', async (req, res) => {
    // Ensure universe is warm
    await getPrices();
    const list = universeRanked.map(sym => ({
      symbol: sym,
      name: universe[sym]?.name || sym,
      image: universe[sym]?.image || null,
      price: universe[sym]?.price || 0,
      change_24h: universe[sym]?.change_24h || 0,
      rank: universe[sym]?.rank || 999,
      market_cap: universe[sym]?.market_cap || 0,
    }));
    res.json({ ok: true, symbols: list.map(s => s.symbol), coins: list });
  });

  // GET /api/v1/challenge/prices — live prices for all supported symbols
  app.get('/api/v1/challenge/prices', async (req, res) => {
    const prices = await getPrices();
    res.json({ ok: true, prices, count: Object.keys(prices).length, fetched_at: new Date().toISOString() });
  });

  // GET /api/v1/challenge/history — past months top 10
  app.get('/api/v1/challenge/history', (req, res) => {
    const db = loadDb();
    res.json({ ok: true, history: db.history || {} });
  });

  // GET /api/v1/challenge/recent-trades — live global feed (last 30 trades)
  app.get('/api/v1/challenge/recent-trades', async (req, res) => {
    // Ensure universe is warm so we can filter out delisted/scam coin trades
    try { await getPrices(); } catch { /* ignore */ }
    const db = loadDb();
    res.json({ ok: true, trades: getRecentTrades(db, 30) });
  });

  // GET /api/v1/challenge/achievements — all available badges (catalog)
  app.get('/api/v1/challenge/achievements', (req, res) => {
    res.json({ ok: true, achievements: ACHIEVEMENTS });
  });
}
