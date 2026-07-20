// Test E2E du moteur swing v7 (sans envoi Telegram)
import { createSwingEngine } from '../lib/swing_engine.js';

const engine = createSwingEngine({
  port: 0,
  loadTelegramAlerts: () => ({ enabled: false, cooldowns: {} }),
  saveTelegramAlerts: () => {},
  sendTelegramMessage: async () => ({ ok: false }),
  loadTradeCalls: () => [],
});

const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&page=1');
const coins = await res.json();
console.log(`CoinGecko: ${coins.length} coins`);

const setups = await engine.generateRealSetups(coins);
console.log(`\n=== ${setups.length} setups générés (v7) ===`);
for (const s of setups.sort((a, b) => b.confidence - a.confidence).slice(0, 10)) {
  const slPct = (Math.abs(s.entry - s.stopLoss) / s.entry * 100).toFixed(1);
  const tp1Pct = (Math.abs(s.tp1 - s.entry) / s.entry * 100).toFixed(1);
  console.log(`${s.symbol} ${s.side} conf=${s.confidence}% conv=${s.hasConvergence} rsi4h=${s.rsi4h} SL=${slPct}% TP1=${tp1Pct}% RR=${s.rr} | ${s.reason.slice(0, 90)}`);
}
const above80 = setups.filter(s => s.confidence >= 80);
const conv = setups.filter(s => s.hasConvergence);
console.log(`\n>=80%: ${above80.length} | avec convergence: ${conv.length} | conf>=93 sans convergence: ${setups.filter(s => s.confidence >= 93 && !s.hasConvergence).length} (doit être 0)`);
