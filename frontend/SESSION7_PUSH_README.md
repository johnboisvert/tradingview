# 🔔 PWA Push Notifications — Activation Guide

Tout le code est en place dans le repo. Pour activer réellement les push (~30 min) :

## 📋 Étape 1 — Générer vos clés VAPID (5 min)

Sur votre PC local (ou via un terminal Railway shell) :
```bash
npx web-push generate-vapid-keys
```

Vous obtiendrez 2 clés :
```
Public Key:  BFx9...XYZ   ← courte, à exposer côté frontend
Private Key: aZc1...PQR   ← longue, secret backend
```

## 📋 Étape 2 — Variables Railway

Ajoutez dans Railway → Variables :
```env
VAPID_PUBLIC_KEY=BFx9...XYZ
VAPID_PRIVATE_KEY=aZc1...PQR
VAPID_SUBJECT=mailto:cryptoia2026@gmail.com
```

Et côté frontend `.env.production` (ou Railway → Variables avec préfixe `VITE_`) :
```env
VITE_VAPID_PUBLIC_KEY=BFx9...XYZ
```

## 📋 Étape 3 — Installer `web-push` côté backend

Dans `Dockerfile`, ajoutez `web-push` à la ligne du package.json production :
```dockerfile
RUN echo '{"type":"module","dependencies":{"express":"^5.2.1","dotenv":"^16.4.0","stripe":"^17.0.0","resend":"^4.4.1","web-push":"^3.6.7"}}' > package.json && npm install --omit=dev
```

## 📋 Étape 4 — Endpoints backend (snippet à ajouter dans server.js)

```javascript
// ─── PWA Push Notifications ─────────────────────────────────────────────────
const PUSH_SUBS_FILE = path.join(__dirname, 'data', 'push_subscriptions.json');

function loadPushSubs() {
  try {
    if (!fs.existsSync(PUSH_SUBS_FILE)) return [];
    return JSON.parse(fs.readFileSync(PUSH_SUBS_FILE, 'utf-8'));
  } catch { return []; }
}
function savePushSubs(subs) {
  try {
    fs.mkdirSync(path.dirname(PUSH_SUBS_FILE), { recursive: true });
    fs.writeFileSync(PUSH_SUBS_FILE, JSON.stringify(subs));
  } catch (e) { console.error('[Push] save error:', e?.message); }
}

let webpushClient = null;
async function getWebPush() {
  if (webpushClient !== null) return webpushClient;
  const pubKey = process.env.VAPID_PUBLIC_KEY;
  const privKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
  if (!pubKey || !privKey) { webpushClient = false; return false; }
  try {
    const wp = (await import('web-push')).default;
    wp.setVapidDetails(subject, pubKey, privKey);
    webpushClient = wp;
    return wp;
  } catch (e) {
    console.error('[Push] SDK load error:', e?.message);
    webpushClient = false;
    return false;
  }
}

app.post('/api/v1/push/subscribe', express.json(), (req, res) => {
  try {
    const sub = req.body;
    if (!sub?.endpoint) return res.status(400).json({ error: 'invalid subscription' });
    const subs = loadPushSubs();
    if (!subs.find(s => s.endpoint === sub.endpoint)) {
      subs.push({ ...sub, subscribed_at: new Date().toISOString() });
      savePushSubs(subs);
    }
    return res.json({ status: 'ok', total: subs.length });
  } catch (e) { return res.status(500).json({ error: 'internal error' }); }
});

app.post('/api/v1/push/unsubscribe', express.json(), (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ error: 'endpoint required' });
    const subs = loadPushSubs().filter(s => s.endpoint !== endpoint);
    savePushSubs(subs);
    return res.json({ status: 'ok' });
  } catch (e) { return res.status(500).json({ error: 'internal error' }); }
});

app.post('/api/v1/push/broadcast', express.json(), async (req, res) => {
  // ⚠️ ADD ADMIN AUTH CHECK HERE (e.g., check Bearer token)
  try {
    const { title, body, url } = req.body || {};
    if (!title || !body) return res.status(400).json({ error: 'title and body required' });
    const wp = await getWebPush();
    if (!wp) return res.status(503).json({ error: 'VAPID keys not configured' });
    const subs = loadPushSubs();
    let sent = 0, failed = 0;
    const payload = JSON.stringify({ title, body, url: url || '/', icon: '/icons/icon-256.png' });
    await Promise.all(subs.map(async (s) => {
      try {
        await wp.sendNotification(s, payload);
        sent++;
      } catch (e) {
        failed++;
        // Remove expired subscriptions (410 Gone)
        if (e?.statusCode === 410) {
          savePushSubs(loadPushSubs().filter(x => x.endpoint !== s.endpoint));
        }
      }
    }));
    return res.json({ status: 'ok', sent, failed, total: subs.length });
  } catch (e) {
    return res.status(500).json({ error: 'internal error', detail: e?.message });
  }
});
```

## 📋 Étape 5 — Service Worker push handler

Ajoutez à `frontend/public/sw.js` (à la fin) :

```javascript
// ─── Push Notifications ───
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'CryptoIA', {
        body: data.body || '',
        icon: data.icon || '/icons/icon-256.png',
        badge: '/icons/icon-256.png',
        data: { url: data.url || '/' },
        vibrate: [100, 50, 100],
      })
    );
  } catch (e) {
    console.error('[SW] push error:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
```

## 📋 Étape 6 — UI d'opt-in (frontend)

Importez et appelez depuis n'importe quel composant :
```typescript
import { askPushPermission, subscribeUserToPush } from "@/lib/push";

// Sur clic d'un bouton "Activer les notifications" :
const enablePush = async () => {
  const granted = await askPushPermission();
  if (granted) {
    const ok = await subscribeUserToPush();
    if (ok) toast.success("Notifications activées !");
  }
};
```

## 📋 Étape 7 — Tester un broadcast

Depuis l'admin (avec auth ajoutée) :
```bash
curl -X POST https://www.cryptoia.ca/api/v1/push/broadcast \
  -H "Content-Type: application/json" \
  -d '{"title":"🚨 Signal IA","body":"BTC: Setup haussier détecté","url":"/ai-signals"}'
```

---

⚠️ **Sécurité** : ajoutez une authentification admin sur `/api/v1/push/broadcast` avant de mettre en prod (sinon n'importe qui pourrait spam vos users).
