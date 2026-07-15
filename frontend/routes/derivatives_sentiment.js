// Derivatives Sentiment indicator (Terminal Pro — Market Signals widget).
//   GET /api/v1/derivatives/sentiment
//   → { ok, score(-100..100), label, funding:{avg_majors,btc}, options:{pc_btc,pc_eth}, source }
// Score = crowd positioning: positive funding (crowded longs) + low P/C (call-heavy)
// pushes the score up (greed); negative funding + high P/C pulls it down (fear).
import { getFundingRows } from './binance_market.js';
import { getOptionsSummary } from './deribit_options.js';

const MAJORS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
const TTL_MS = 120 * 1000;
let cache = { ts: 0, payload: null };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function labelFor(score) {
  if (score >= 40) return 'Longs surchauffés';
  if (score >= 15) return 'Bullish';
  if (score > -15) return 'Neutre';
  if (score > -40) return 'Bearish';
  return 'Shorts surchauffés';
}

export default function registerDerivativesSentimentRoutes(app) {
  app.get('/api/v1/derivatives/sentiment', async (req, res) => {
    if (cache.payload && Date.now() - cache.ts < TTL_MS) return res.json(cache.payload);

    const [funding, optBtc, optEth] = await Promise.all([
      getFundingRows().catch(() => null),
      getOptionsSummary('BTC').catch(() => null),
      getOptionsSummary('ETH').catch(() => null),
    ]);
    if (!funding && !optBtc) {
      if (cache.payload) return res.json(cache.payload);
      return res.status(502).json({ ok: false, error: 'derivatives sources unavailable' });
    }

    let fundingComponent = 0;
    let avgMajors = null;
    let btcFunding = null;
    if (funding?.rows?.length) {
      const majors = funding.rows.filter((r) => MAJORS.includes(r.symbol));
      if (majors.length) {
        avgMajors = majors.reduce((s, r) => s + r.funding_rate, 0) / majors.length;
        // 0.01% (neutral baseline) → 0 pts ; ±0.05% → ±40 pts (saturated ±50)
        fundingComponent = clamp((avgMajors - 0.0001) * 1e4 * 10, -50, 50);
      }
      btcFunding = funding.rows.find((r) => r.symbol === 'BTCUSDT')?.funding_rate ?? null;
    }

    let pcComponent = 0;
    const pcBtc = optBtc?.pc_oi_ratio ?? null;
    const pcEth = optEth?.pc_oi_ratio ?? null;
    const pcs = [pcBtc, pcEth].filter((v) => typeof v === 'number');
    if (pcs.length) {
      const pcAvg = pcs.reduce((s, v) => s + v, 0) / pcs.length;
      // P/C 1.0 → 0 pts ; 0.5 → +25 (call-heavy, greed) ; 1.5 → -25 (put-heavy, fear)
      pcComponent = clamp((1 - pcAvg) * 50, -50, 50);
    }

    const score = Math.round(clamp(fundingComponent + pcComponent, -100, 100));
    const payload = {
      ok: true,
      score,
      label: labelFor(score),
      funding: {
        avg_majors: avgMajors,
        btc: btcFunding,
        source: funding?.source ?? null,
      },
      options: { pc_btc: pcBtc, pc_eth: pcEth },
      components: { funding: Math.round(fundingComponent), put_call: Math.round(pcComponent) },
      fetched_at: new Date().toISOString(),
    };
    cache = { ts: Date.now(), payload };
    res.json(payload);
  });
}
