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
      positions: {}, // { BTC: { qty, avg_price } }
      trades: [],    // array of { ts, side, symbol, qty, price, value }
      pnl_realized: 0,
    };
  }
  return db.participants[key];
}

// Compute equity (cash + open positions valued at current price)
function computeEquity(p, prices) {
  let equity = p.balance;
  for (const [sym, pos] of Object.entries(p.positions || {})) {
    const px = prices[sym] || pos.avg_price || 0;
    equity += (pos.qty || 0) * px;
  }
  return equity;
}

// Simple in-memory price cache (5s TTL) so leaderboard doesn't spam CoinGecko
let priceCache = { ts: 0, data: {} };
async function getPrices(symbols) {
  const now = Date.now();
  if (now - priceCache.ts < 5000 && Object.keys(priceCache.data).length > 0) {
    return priceCache.data;
  }
  // Map common symbols to CoinGecko IDs
  const idMap = {
    BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin', XRP: 'ripple',
    ADA: 'cardano', AVAX: 'avalanche-2', DOGE: 'dogecoin', MATIC: 'matic-network',
    DOT: 'polkadot', LINK: 'chainlink', LTC: 'litecoin', ATOM: 'cosmos',
    SHIB: 'shiba-inu', TRX: 'tron', UNI: 'uniswap', NEAR: 'near', APT: 'aptos',
    ARB: 'arbitrum', OP: 'optimism', PEPE: 'pepe', SUI: 'sui', INJ: 'injective-protocol',
  };
  const ids = symbols.map(s => idMap[s.toUpperCase()]).filter(Boolean);
  if (ids.length === 0) return priceCache.data;
  try {
    // Use local CoinGecko proxy. /coins/markets endpoint is regularly cached
    // by the existing Telegram cron, so it has warm data even during rate limits.
    const port = process.env.PORT || 8765;
    const r = await fetch(`http://localhost:${port}/api/coingecko/coins/markets?vs_currency=usd&ids=${ids.join(',')}`);
    const arr = await r.json();
    const out = {};
    if (Array.isArray(arr)) {
      // Map CoinGecko id → symbol upper using idMap reverse
      const reverse = {};
      for (const [sym, cgId] of Object.entries(idMap)) reverse[cgId] = sym;
      for (const c of arr) {
        const sym = reverse[c?.id];
        if (sym && typeof c?.current_price === 'number') out[sym] = c.current_price;
      }
    }
    priceCache = { ts: now, data: out };
    return out;
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

export default function register(app, { resendClientGetter }) {
  // Ensure period is current at startup (catches missed cron during downtime)
  endOfMonthSettlement(resendClientGetter).catch(() => {});

  // Check every 30 minutes if month changed (matches pattern used in blog_cron/daily_brief)
  setInterval(() => {
    endOfMonthSettlement(resendClientGetter).catch(e => console.error('[Challenge] settlement error:', e?.message));
  }, 30 * 60 * 1000);

  // POST /api/v1/challenge/join — register participant
  app.post('/api/v1/challenge/join', (req, res) => {
    const { email, username } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Email invalide' });
    }
    const db = loadDb();
    const p = ensureParticipant(db, email, username);
    saveDb(db);
    res.json({ ok: true, participant: { username: p.username, balance: p.balance, positions: p.positions, trades: p.trades.slice(-20) } });
  });

  // GET /api/v1/challenge/me?email=...
  app.get('/api/v1/challenge/me', async (req, res) => {
    const email = String(req.query.email || '').toLowerCase();
    if (!email) return res.status(400).json({ ok: false, error: 'Email requis' });
    const db = loadDb();
    const p = db.participants[email];
    if (!p) return res.json({ ok: true, participant: null });
    const symbols = Object.keys(p.positions || {});
    const prices = symbols.length ? await getPrices(symbols) : {};
    const equity = computeEquity(p, prices);
    res.json({
      ok: true,
      participant: {
        username: p.username,
        balance: p.balance,
        positions: p.positions,
        equity,
        roi_pct: ((equity - STARTING_BALANCE) / STARTING_BALANCE) * 100,
        trades: p.trades.slice(-50).reverse(),
        prices,
      },
    });
  });

  // POST /api/v1/challenge/trade — execute a paper trade
  // body: { email, side: 'buy'|'sell', symbol, qty }
  app.post('/api/v1/challenge/trade', async (req, res) => {
    const { email, side, symbol, qty } = req.body || {};
    if (!email || !side || !symbol || !qty) return res.status(400).json({ ok: false, error: 'Paramètres manquants' });
    const sideNorm = String(side).toLowerCase();
    if (!['buy', 'sell'].includes(sideNorm)) return res.status(400).json({ ok: false, error: 'Side invalide' });
    const sym = String(symbol).toUpperCase();
    const qtyNum = Math.abs(parseFloat(qty));
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) return res.status(400).json({ ok: false, error: 'Quantité invalide' });

    const db = loadDb();
    const p = db.participants[email.toLowerCase()];
    if (!p) return res.status(404).json({ ok: false, error: 'Participe d\'abord au challenge' });

    const prices = await getPrices([sym]);
    const price = prices[sym];
    if (!price) return res.status(400).json({ ok: false, error: `Crypto non supportée: ${sym}` });

    const value = qtyNum * price;

    if (sideNorm === 'buy') {
      if (value > p.balance) return res.status(400).json({ ok: false, error: 'Solde insuffisant' });
      p.balance -= value;
      const pos = p.positions[sym] || { qty: 0, avg_price: 0 };
      const newQty = pos.qty + qtyNum;
      pos.avg_price = newQty > 0 ? (pos.qty * pos.avg_price + qtyNum * price) / newQty : price;
      pos.qty = newQty;
      p.positions[sym] = pos;
    } else {
      const pos = p.positions[sym];
      if (!pos || pos.qty < qtyNum) return res.status(400).json({ ok: false, error: 'Position insuffisante' });
      const realized = (price - pos.avg_price) * qtyNum;
      p.balance += value;
      p.pnl_realized += realized;
      pos.qty -= qtyNum;
      if (pos.qty < 1e-9) delete p.positions[sym];
    }
    p.trades.push({ ts: new Date().toISOString(), side: sideNorm, symbol: sym, qty: qtyNum, price, value });
    saveDb(db);

    const symbols = Object.keys(p.positions);
    const allPrices = symbols.length ? await getPrices(symbols) : prices;
    const equity = computeEquity(p, allPrices);
    res.json({
      ok: true,
      participant: {
        username: p.username, balance: p.balance, positions: p.positions, equity,
        roi_pct: ((equity - STARTING_BALANCE) / STARTING_BALANCE) * 100,
        trades: p.trades.slice(-50).reverse(),
      },
      executed: { side: sideNorm, symbol: sym, qty: qtyNum, price, value },
    });
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

  // GET /api/v1/challenge/symbols — list of supported coins (frontend dropdown)
  app.get('/api/v1/challenge/symbols', (req, res) => {
    res.json({
      ok: true,
      symbols: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOGE', 'MATIC', 'DOT', 'LINK', 'LTC', 'ATOM', 'SHIB', 'TRX', 'UNI', 'NEAR', 'APT', 'ARB', 'OP', 'PEPE', 'SUI', 'INJ'],
    });
  });

  // GET /api/v1/challenge/history — past months top 10
  app.get('/api/v1/challenge/history', (req, res) => {
    const db = loadDb();
    res.json({ ok: true, history: db.history || {} });
  });
}
