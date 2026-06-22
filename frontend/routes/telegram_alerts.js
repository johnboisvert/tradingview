// Telegram Alerts Helpers — Extracted from server.js for maintainability
//
// SCOPE: This module ONLY contains the low-level Telegram helpers
// (sendMessage, sendPhoto, alert config persistence). The trading logic
// that USES these helpers (setInterval scanners, scalp/range alerts, etc.)
// remains in server.js to minimize risk of breaking the live signal pipeline.
//
// USAGE in server.js:
//   import { createTelegramHelpers } from './routes/telegram_alerts.js';
//   const { sendTelegramMessage, sendTelegramPhoto, loadTelegramAlerts, saveTelegramAlerts, TELEGRAM_BOT_TOKEN } =
//     createTelegramHelpers({ dataDir: DATA_DIR, assetsDir: path.join(__dirname, 'assets') });

import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

export function createTelegramHelpers({ dataDir, assetsDir }) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8478131465:AAEh7Z0rvIqSNvn1wKdtkMNb-O96h41LCns';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002940633257';
  const TELEGRAM_ALERTS_FILE = path.join(dataDir, 'telegram_alerts.json');

  function loadTelegramAlerts() {
    try {
      if (existsSync(TELEGRAM_ALERTS_FILE)) {
        return JSON.parse(readFileSync(TELEGRAM_ALERTS_FILE, 'utf-8'));
      }
    } catch (err) {
      console.error('[Telegram] Error loading alerts config:', err?.message);
    }
    return {
      enabled: true,
      checkIntervalMs: 900000, // 15 minutes
      alerts: {
        priceChange: { enabled: true, threshold: 5, coins: [] },
        rsiExtreme: { enabled: true, overbought: 70, oversold: 30, coins: [] },
        volumeSpike: { enabled: true, multiplier: 3, coins: [] },
      },
      lastCheck: null,
      lastAlerts: [],
    };
  }

  function saveTelegramAlerts(config) {
    try {
      writeFileSync(TELEGRAM_ALERTS_FILE, JSON.stringify(config, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Telegram] Error saving alerts config:', err?.message);
    }
  }

  async function sendTelegramMessage(text, parseMode = 'HTML') {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('[Telegram] send error:', err?.message || err);
      return { ok: false, description: err?.message || 'Telegram request failed' };
    }
  }

  async function sendTelegramPhoto(caption = '') {
    const photoPath = path.join(assetsDir, 'ia.png');
    try {
      if (!existsSync(photoPath)) {
        console.error('[Telegram] Photo file not found:', photoPath);
        return { ok: false, description: 'Photo file not found' };
      }
      const photoBuffer = readFileSync(photoPath);
      const formData = new globalThis.FormData();
      formData.append('chat_id', TELEGRAM_CHAT_ID);
      formData.append('photo', new Blob([photoBuffer], { type: 'image/png' }), 'ia.png');
      if (caption) {
        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');
      }
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.ok) {
        console.error('[Telegram] Photo send error:', data.description);
      }
      return data;
    } catch (err) {
      console.error('[Telegram] Photo send error:', err?.message || err);
      return { ok: false, description: err?.message };
    }
  }

  return {
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID,
    TELEGRAM_ALERTS_FILE,
    loadTelegramAlerts,
    saveTelegramAlerts,
    sendTelegramMessage,
    sendTelegramPhoto,
  };
}
