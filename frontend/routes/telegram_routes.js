// Telegram config/admin routes (extracted from server.js — Session 43).
// Alert-engine logic (checkers, schedulers) stays in server.js; injected here.
export default function registerTelegramConfigRoutes(app, deps) {
  const { sendTelegramMessage, loadTelegramAlerts, saveTelegramAlerts, checkAndSendAlerts, onToggle } = deps;

  // ─── POST /api/telegram/test — Send test message ───
  app.post('/api/telegram/test', async (req, res) => {
    const now = new Date().toLocaleString('fr-CA', { timeZone: 'America/Montreal' });
    const text = `🚀 <b>CryptoIA — Test de connexion</b>

✅ Votre bot Telegram est correctement connecté !
Vous recevrez désormais vos alertes crypto ici.

⏰ ${now} (heure de Montréal)
⚠️ <i>Ceci n'est pas un conseil financier. Faites vos propres recherches (DYOR).</i>`;

    const result = await sendTelegramMessage(text);
    if (result.ok) {
      res.json({ success: true, message: 'Message test envoyé avec succès !' });
    } else {
      res.json({ success: false, message: result.description || 'Erreur Telegram' });
    }
  });

  // ─── POST /api/telegram/send — Send custom message ───
  app.post('/api/telegram/send', async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Texte requis' });
    }
    const result = await sendTelegramMessage(text);
    if (result.ok) {
      res.json({ success: true, message: 'Message envoyé' });
    } else {
      res.json({ success: false, message: result.description || 'Erreur Telegram' });
    }
  });

  // ─── GET /api/telegram/config — Get alert config ───
  app.get('/api/telegram/config', (req, res) => {
    const config = loadTelegramAlerts();
    res.json({ success: true, config });
  });

  // ─── POST /api/telegram/config — Update alert config ───
  app.post('/api/telegram/config', (req, res) => {
    const { config } = req.body;
    if (!config) {
      return res.status(400).json({ success: false, message: 'Config requise' });
    }
    saveTelegramAlerts(config);
    res.json({ success: true, message: 'Configuration sauvegardée' });
  });

  // ─── POST /api/telegram/check-now — Force check alerts now ───
  app.post('/api/telegram/check-now', async (req, res) => {
    try {
      const alerts = await checkAndSendAlerts();
      res.json({ success: true, alertsSent: alerts.length, alerts });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ─── POST /api/telegram/toggle — Enable/disable alert system ───
  app.post('/api/telegram/toggle', (req, res) => {
    const { enabled } = req.body;
    const config = loadTelegramAlerts();
    config.enabled = !!enabled;
    saveTelegramAlerts(config);
    onToggle(config.enabled);
    res.json({ success: true, enabled: config.enabled });
  });

  console.log('[Telegram] ✅ Config routes registered (/api/telegram/*)');
}
