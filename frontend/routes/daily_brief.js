// Daily Crypto Brief — single email digest sent at BRIEF_HOUR_UTC (default
// 13h UTC = 8h EST). Uses CoinGecko top movers + GPT-5.4 commentary, sent to
// all opted-in users via Resend. Tagged so the Resend webhook tracks engagement.
//
// Admin endpoints:
//   GET  /api/v1/admin/daily-brief/status
//   POST /api/v1/admin/daily-brief/run-now[?dry=1]
//
// Killswitches:
//   DAILY_BRIEF_ENABLED=false
//   DAILY_BRIEF_HOUR_UTC=13      (default = 8h EST / 9h EDT)

import path from 'path';
import { generateJSON, loadJSON, saveJSON, SEO_DATA_DIR } from './_seo_generator.js';

const HISTORY_FILE = path.join(SEO_DATA_DIR, 'daily_brief_history.json');
const COIN_CACHE_FILE = path.join(SEO_DATA_DIR, 'coin_market_cache.json');

// ── CoinGecko top movers (uses shared cache from coin_pages.js when fresh) ─
async function fetchTopMovers() {
  const cached = loadJSON(COIN_CACHE_FILE, null);
  // If cache is <5min old, reuse
  if (cached?.ts && (Date.now() - new Date(cached.ts).getTime() < 5 * 60 * 1000)) {
    return cached.data || [];
  }
  // Fallback live call (top 50 by market cap, 24h change)
  const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h,7d';
  try {
    const resp = await fetch(url, { headers: { accept: 'application/json' } });
    if (!resp.ok) throw new Error(`CoinGecko ${resp.status}`);
    const data = await resp.json();
    saveJSON(COIN_CACHE_FILE, { ts: new Date().toISOString(), data });
    return data;
  } catch (e) {
    console.error('[DailyBrief] CoinGecko error:', e?.message);
    return cached?.data || [];
  }
}

function buildMoversData(market) {
  const top50 = market.slice(0, 50);
  const sorted24h = [...top50].sort((a, b) => (b.price_change_percentage_24h_in_currency || 0) - (a.price_change_percentage_24h_in_currency || 0));
  const winners = sorted24h.slice(0, 5).map(c => ({ symbol: c.symbol.toUpperCase(), name: c.name, price: c.current_price, change: c.price_change_percentage_24h_in_currency }));
  const losers = sorted24h.slice(-5).reverse().map(c => ({ symbol: c.symbol.toUpperCase(), name: c.name, price: c.current_price, change: c.price_change_percentage_24h_in_currency }));
  const btc = market.find(c => c.id === 'bitcoin');
  const eth = market.find(c => c.id === 'ethereum');
  return {
    btc_price: btc?.current_price || null,
    btc_change: btc?.price_change_percentage_24h_in_currency || null,
    eth_price: eth?.current_price || null,
    eth_change: eth?.price_change_percentage_24h_in_currency || null,
    winners, losers,
  };
}

// ── GPT commentary on the day's market ────────────────────────────────────
async function generateCommentary(moversData) {
  const systemPrompt = `Tu es l'analyste crypto matinal de cryptoia.ca (site québécois FR).
Style: concis, lucide, sans hype. Ton: matinal, pédagogique. 1 paragraphe punchy.
Pas de promesses de rendement, pas de "to the moon".
Réponds UNIQUEMENT en JSON:
{
  "headline": "Titre matinal accrocheur (max 60 chars)",
  "commentary": "Analyse en 1 paragraphe markdown (~100 mots) qui contextualise les mouvements et donne 1-2 angles à surveiller aujourd'hui",
  "signal_teaser": "1 phrase intrigante pour donner envie de cliquer sur le signal IA du jour (max 150 chars)"
}`;
  const userPrompt = `Marché ${new Date().toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })} :
BTC: $${moversData.btc_price?.toFixed(0) || '?'} (${moversData.btc_change?.toFixed(2) || '?'}% 24h)
ETH: $${moversData.eth_price?.toFixed(0) || '?'} (${moversData.eth_change?.toFixed(2) || '?'}% 24h)
Top gainers 24h: ${moversData.winners.map(w => `${w.symbol} +${w.change?.toFixed(1)}%`).join(', ')}
Top losers 24h: ${moversData.losers.map(l => `${l.symbol} ${l.change?.toFixed(1)}%`).join(', ')}`;
  return await generateJSON({ systemPrompt, userPrompt, maxTokens: 800 });
}

// ── Email HTML template ───────────────────────────────────────────────────
function buildEmailHtml({ moversData, commentary }) {
  const dayStr = new Date().toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const movers = (arr, color) => arr.map(c => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.05);font-weight:700;color:#fff;">${c.symbol}</td>
      <td style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.05);color:#cbd5e1;text-align:right;">$${c.price?.toFixed(c.price > 1 ? 2 : 4) || '—'}</td>
      <td style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.05);color:${color};text-align:right;font-weight:700;">${c.change >= 0 ? '+' : ''}${c.change?.toFixed(2) || '—'}%</td>
    </tr>`).join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${commentary.headline}</title></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#8b5cf6;font-weight:700;">☀️ Daily Crypto Brief · ${dayStr}</div>
      <h1 style="font-size:24px;font-weight:900;margin:8px 0 0;color:#fff;line-height:1.3;">${commentary.headline}</h1>
    </div>
    <div style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.05));border:1px solid rgba(139,92,246,0.2);border-radius:14px;padding:18px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div><span style="color:#94a3b8;font-size:11px;">BTC</span> <span style="font-weight:900;font-size:18px;">$${moversData.btc_price?.toFixed(0) || '—'}</span></div>
        <div style="color:${(moversData.btc_change || 0) >= 0 ? '#10b981' : '#ef4444'};font-weight:700;">${(moversData.btc_change || 0) >= 0 ? '+' : ''}${moversData.btc_change?.toFixed(2) || '—'}%</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div><span style="color:#94a3b8;font-size:11px;">ETH</span> <span style="font-weight:900;font-size:18px;">$${moversData.eth_price?.toFixed(0) || '—'}</span></div>
        <div style="color:${(moversData.eth_change || 0) >= 0 ? '#10b981' : '#ef4444'};font-weight:700;">${(moversData.eth_change || 0) >= 0 ? '+' : ''}${moversData.eth_change?.toFixed(2) || '—'}%</div>
      </div>
    </div>
    <div style="background:rgba(255,255,255,0.02);border-radius:14px;padding:18px;margin-bottom:20px;">
      <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#a5b4fc;margin:0 0 8px;font-weight:800;">🔍 Analyse du matin</h2>
      <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0;">${commentary.commentary.replace(/\n/g, '<br>')}</p>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
      <div style="flex:1;min-width:260px;background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:14px;">
        <h3 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#10b981;margin:0 0 10px;font-weight:800;">🚀 Top Gainers 24h</h3>
        <table style="width:100%;font-size:12px;border-collapse:collapse;">${movers(moversData.winners, '#10b981')}</table>
      </div>
      <div style="flex:1;min-width:260px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:14px;">
        <h3 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#ef4444;margin:0 0 10px;font-weight:800;">📉 Top Losers 24h</h3>
        <table style="width:100%;font-size:12px;border-collapse:collapse;">${movers(moversData.losers, '#ef4444')}</table>
      </div>
    </div>
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;padding:20px;text-align:center;margin-bottom:20px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.85);font-weight:800;margin-bottom:8px;">⚡ Signal IA du jour</div>
      <p style="color:#fff;font-size:14px;line-height:1.5;margin:0 0 14px;font-weight:600;">${commentary.signal_teaser}</p>
      <a href="https://www.cryptoia.ca/signaux?utm_source=daily_brief&utm_medium=email" style="display:inline-block;padding:12px 28px;border-radius:10px;background:#fff;color:#6366f1;font-weight:900;text-decoration:none;text-transform:uppercase;font-size:11px;letter-spacing:1px;">Voir le signal complet →</a>
    </div>
    <p style="color:#64748b;font-size:11px;text-align:center;margin:0 0 4px;">Tu reçois cet email parce que tu es inscrit sur cryptoia.ca.</p>
    <p style="color:#64748b;font-size:11px;text-align:center;margin:0;"><a href="https://www.cryptoia.ca/mon-compte" style="color:#64748b;">Désabonne-toi en 1 clic</a></p>
  </div>
</body></html>`;
}

function todayKey() { return new Date().toISOString().slice(0, 10); }

function hasRunToday() {
  const hist = loadJSON(HISTORY_FILE, { runs: [] });
  return (hist.runs || []).some(r => r.date === todayKey() && r.ok);
}

function recordRun(entry) {
  const hist = loadJSON(HISTORY_FILE, { runs: [] });
  hist.runs = hist.runs || [];
  hist.runs.push(entry);
  if (hist.runs.length > 365) hist.runs.splice(0, hist.runs.length - 365);
  saveJSON(HISTORY_FILE, hist);
}

async function runBriefCycle({ loadUsers, getResendClient, dryRun = false } = {}) {
  const startTs = new Date().toISOString();
  try {
    const market = await fetchTopMovers();
    if (!market || market.length === 0) throw new Error('CoinGecko returned no data');
    const moversData = buildMoversData(market);
    const commentary = await generateCommentary(moversData);
    const html = buildEmailHtml({ moversData, commentary });
    if (dryRun) {
      return { ok: true, dryRun: true, headline: commentary.headline, html_size: html.length, recipient_count: 0 };
    }
    const client = await getResendClient();
    if (!client) throw new Error('Resend client not available');
    const users = loadUsers() || [];
    // Send to all users who have an email and have not opted out
    const recipients = users.filter(u => u.email && !u.unsubscribed_daily_brief);
    const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
    let sent = 0, failed = 0;
    // Batch to respect Resend rate limits (10/sec free tier)
    for (let i = 0; i < recipients.length; i += 50) {
      const slice = recipients.slice(i, i + 50);
      await Promise.all(slice.map(async (u) => {
        try {
          await client.emails.send({
            from: sender, to: [u.email], subject: `☀️ ${commentary.headline}`, html,
            tags: [
              { name: 'category', value: 'daily_brief' },
              { name: 'date', value: todayKey() },
            ],
          });
          sent++;
        } catch (e) {
          failed++;
          console.error('[DailyBrief] send err for', u.email, ':', e?.message);
        }
      }));
      // Sleep 1.5s between batches to stay below Resend rate limit
      if (i + 50 < recipients.length) await new Promise(r => setTimeout(r, 1500));
    }
    const entry = { date: todayKey(), ts: startTs, ok: true, headline: commentary.headline, sent, failed, recipient_count: recipients.length, tokens: commentary._usage?.total_tokens || null };
    recordRun(entry);
    console.log(`[DailyBrief] ✅ Sent "${commentary.headline}" to ${sent}/${recipients.length} users (${failed} failed)`);
    return { ok: true, headline: commentary.headline, sent, failed, recipient_count: recipients.length };
  } catch (e) {
    const entry = { date: todayKey(), ts: startTs, ok: false, error: e?.message };
    recordRun(entry);
    console.error('[DailyBrief] ❌ Run failed:', e?.message);
    return { ok: false, error: e?.message };
  }
}

// ── Scheduler ────────────────────────────────────────────────────────────
let cronTimer = null;
function startCron({ loadUsers, getResendClient }) {
  if (cronTimer) return;
  const enabled = process.env.DAILY_BRIEF_ENABLED !== 'false';
  if (!enabled) { console.log('[DailyBrief] ⏸️  Disabled'); return; }
  const sendHourUTC = parseInt(process.env.DAILY_BRIEF_HOUR_UTC || '13', 10); // 13h UTC = 8h EST
  const tick = async () => {
    try {
      if (hasRunToday()) return;
      const now = new Date();
      if (now.getUTCHours() !== sendHourUTC) return;
      console.log('[DailyBrief] ⏰ Send window reached — running cycle');
      await runBriefCycle({ loadUsers, getResendClient });
    } catch (e) { console.error('[DailyBrief] tick error:', e?.message); }
  };
  cronTimer = setInterval(tick, 30 * 60 * 1000);
  console.log(`[DailyBrief] ⏰ Scheduler started — will send 1 brief/day at ${sendHourUTC}h UTC`);
}

export default function registerDailyBriefRoutes(app, { requireAdmin, loadUsers, getResendClient } = {}) {
  const adminGuard = requireAdmin || ((_req, _res, next) => next());
  try { startCron({ loadUsers, getResendClient }); }
  catch (e) { console.error('[DailyBrief] startCron failed:', e?.message); }

  app.get('/api/v1/admin/daily-brief/status', adminGuard, (_req, res) => {
    const hist = loadJSON(HISTORY_FILE, { runs: [] });
    res.json({
      ok: true,
      enabled: process.env.DAILY_BRIEF_ENABLED !== 'false',
      send_hour_utc: parseInt(process.env.DAILY_BRIEF_HOUR_UTC || '13', 10),
      has_run_today: hasRunToday(),
      runs_count: (hist.runs || []).length,
      recent_runs: (hist.runs || []).slice(-10).reverse(),
      has_llm_key: !!process.env.EMERGENT_LLM_KEY,
    });
  });

  app.post('/api/v1/admin/daily-brief/run-now', adminGuard, async (req, res) => {
    const dryRun = String(req.query.dry || '').toLowerCase() === '1' || String(req.query.dry || '').toLowerCase() === 'true';
    if (!process.env.EMERGENT_LLM_KEY) return res.status(503).json({ ok: false, error: 'EMERGENT_LLM_KEY missing' });
    const result = await runBriefCycle({ loadUsers, getResendClient, dryRun });
    res.json(result);
  });

  console.log('[DailyBrief] ✅ Routes registered (/api/v1/admin/daily-brief/*)');
}
