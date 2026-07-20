// E2E isolation test: range engine must register calls even when Telegram send fails
import { createRangeEngine } from '../lib/range_engine.js';

const savedCalls = [];
let idCounter = 0;

const engine = createRangeEngine({
  dataDir: '/tmp/range_e2e_data',
  loadTelegramAlerts: () => ({ enabled: true }),
  saveTelegramAlerts: () => {},
  sendTelegramMessage: async () => ({ ok: false, error: 'mocked failure' }),
  loadRangeCalls: () => [...savedCalls],
  saveRangeCalls: (calls) => { savedCalls.length = 0; savedCalls.push(...calls); },
  allocateRangeCallId: () => ++idCounter,
});

import { mkdirSync } from 'fs';
mkdirSync('/tmp/range_e2e_data', { recursive: true });

const alerts = await engine.checkAndSendRangeAlerts();
console.log('=== RESULT ===');
console.log('alerts returned:', alerts.length);
console.log('calls registered (despite Telegram failure):', savedCalls.length);
if (alerts.length !== savedCalls.length) {
  console.error('❌ MISMATCH: alerts vs registered calls');
  process.exit(1);
}
console.log(savedCalls.map(c => `${c.symbol} ${c.side} conf=${c.confidence}%`).join('\n') || '(0 setup ≥80% sur le marché actuel — pipeline exécuté sans erreur)');
console.log('✅ E2E OK');
process.exit(0);
