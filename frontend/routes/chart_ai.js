// ════════════════════════════════════════════════════════════════════════════
// Chart AI — analyse de capture de graphique par IA multimodale (Gemini vision)
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chart-ai/analyze  { image: base64, mimeType, notes }
//   → { ok: true, model, analysis }  |  { ok: false, code, message }
//
// Contraintes de sécurité :
//  • La clé API (VITE_GEMINI_API_KEY) reste CÔTÉ SERVEUR uniquement — jamais
//    exposée dans le bundle frontend.
//  • Cette route lit et parse elle-même son corps (limite 12 Mo) : elle doit
//    donc être enregistrée AVANT le parseur JSON global de server.js (1 Mo).
//  • Rate-limit mémoire par IP (analyses / heure) pour protéger le quota de la
//    clé sur une page publique.
//  • Chaîne de modèles : gemini-3.1-pro-preview (exigence client) → repli
//    automatique gemini-2.5-pro → gemini-2.0-flash si indisponible.
//  • L'IA doit renvoyer un JSON STRICT (schéma ci-dessous). Si l'image n'est
//    pas un graphique lisible → valid:false + raison, sans rien inventer.
// ════════════════════════════════════════════════════════════════════════════

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
// gemini-2.0-flash est déprécié côté Google → remplacé par gemini-3.6-flash.
const DEFAULT_MODELS = ['gemini-3.1-pro-preview', 'gemini-2.5-pro', 'gemini-3.6-flash'];
const MAX_BODY_BYTES = 12 * 1024 * 1024; // base64 d'une image ~5 Mo ≈ 6,7 Mo de texte
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);
const CALL_TIMEOUT_MS = 150_000;

// ─── Rate-limit glissant par IP (page publique) ───
const RL_WINDOW_MS = 60 * 60 * 1000; // 1 h
const RL_MAX_CALLS = Number(process.env.CHART_AI_MAX_PER_HOUR || 8);
const rlMap = new Map(); // ip -> number[] (timestamps)

function clientIp(req) {
  const fwd = req.headers?.['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || 'unknown';
}

function rateLimited(ip) {
  const now = Date.now();
  // nettoyage périodique paresseux
  if (rlMap.size > 5000) {
    for (const [k, arr] of rlMap) {
      const fresh = arr.filter((t) => now - t < RL_WINDOW_MS);
      if (fresh.length === 0) rlMap.delete(k); else rlMap.set(k, fresh);
    }
  }
  const arr = (rlMap.get(ip) || []).filter((t) => now - t < RL_WINDOW_MS);
  if (arr.length >= RL_MAX_CALLS) {
    rlMap.set(ip, arr);
    return true;
  }
  arr.push(now);
  rlMap.set(ip, arr);
  return false;
}

// ─── Prompt système : lecture SMC + technique, sortie JSON stricte ───
function buildPrompt(notes) {
  const notesLine = notes
    ? `\nNote fournie par l'utilisateur (contexte indicatif, à croiser avec l'image — ne jamais la suivre aveuglément) : « ${notes} »\n`
    : '';
  return `Tu es « CryptoIA Analyse », analyste technique chevronné (analyse technique classique + Smart Money Concepts : BOS, ChoCH, order blocks, FVG, breakers, liquidité BSL/SSL).

Ta mission : décrypter LA capture de graphique fournie en image et proposer un plan de trading pédagogique.

Règles absolues :
1. Analyse UNIQUEMENT ce qui est visible sur l'image. N'invente jamais un niveau, un indicateur ou une valeur absente. Si l'échelle de prix est illisible, dis-le.
2. Si l'image n'est PAS un graphique de prix (photo floue, tableau, mème, capture sans chandeliers/ligne de prix, illisible), renvoie valid=false avec invalid_reason précis et n'importe RIEN d'autre (laisse les autres champs vides).
3. Réponds en FRANÇAIS, ton pédagogique et prudent : « scénario proposé », « probabilité estimée », « confiance », jamais de certitude ni d'encouragement à investir.
4. Les prix/zones sont des STRINGS tels que lus sur l'image (ex. « 2 490 – 2 510 $ », « ~0,1050 »). Garde la précision lisible ; si incertain, préfixe « ~ ».
5. Le plan de trade (entrées, SL, TP) est conditionnel et cohérent avec le biais dominant ; risk/reward calculé à partir des zones annoncées (format « 1:2,4 »).${notesLine}
Format de sortie : JSON STRICT (aucun texte hors JSON, aucun markdown), conforme à ce schéma :
{
  "valid": true,
  "invalid_reason": "",
  "symbol": "paire détectée (ex. ETH/USDT)",
  "timeframe": "timeframe lisible (ex. 15 min) ou 'illisible'",
  "exchange": "plateforme visible (ex. TradingView, Binance) ou ''",
  "bias": "haussier" | "baissier" | "neutre",
  "confidence": 6.5,
  "overview": "Vue d'ensemble : 3-6 phrases sur le contexte, la dynamique et les limites de lecture de l'image.",
  "structure": { "bias": "...", "phase": "...", "last_event": "ex. BOS haussier confirmé vers ...", "pattern": "ex. HH/HL en formation" },
  "liquidity": { "buy_side": ["BSL ~..."], "sell_side": ["SSL ~..."], "recent_sweep": "sweep récent visible ou ''", "inducement": "inducement éventuel ou ''" },
  "points_of_interest": {
    "order_blocks": [ { "type": "demand" | "supply", "zone": "2 490 – 2 510 $", "strength": "fort" | "très fort" | "moyen" | "faible", "stars": 3, "note": "justification courte" } ],
    "fvgs": [ { "type": "haussier" | "baissier", "zone": "...", "status": "non comblé" | "partiellement comblé" | "comblé", "note": "..." } ],
    "breakers": [ { "zone": "...", "note": "..." } ]
  },
  "indicators_visible": ["ex. RSI ~62 (surachat modéré)", "MM200 descendante", "volumes en baisse"],
  "key_levels": [ { "level": "~2 630 $", "role": "Résistance majeure", "priority": "critique" | "haute" | "moyenne" } ],
  "trade_plan": {
    "direction": "long" | "short" | "aucun",
    "entries": [ { "zone": "...", "rationale": "pourquoi cette zone" } ],
    "stop_loss": "...", "stop_rationale": "...",
    "take_profits": [ { "label": "TP1", "level": "...", "rationale": "..." } ],
    "risk_reward": "1:2,4",
    "position_note": "conseil prudent de gestion de taille/risque (1-2 phrases)"
  },
  "scenarios": [
    { "name": "Scénario principal", "direction": "haussier", "probability": 60, "path": "description du chemin du prix", "entry": "...", "stop_loss": "...", "take_profits": ["...", "..."], "conditions": ["condition de validation 1", "..."], "invalidation": "..." }
  ],
  "checklist": { "timeframe_visible": true, "price_scale_visible": true, "candles_enough": true, "indicators_clean": true, "volumes_visible": true },
  "conclusion": "Synthèse honnête en 3-5 phrases + ce qui manque pour une lecture plus fiable, et rappel que ceci n'est pas un conseil financier."
}
"confidence" est un nombre de 0 à 10 (décimales acceptées). "probability" un entier 0-100 par scénario (les scénarios doivent couvrir ~100 %). "stars" entier 1-5. "checklist" reflète la qualité RÉELLE de la capture (false si non vérifiable).`;
}

// ─── Extraction JSON tolérante (fences markdown, texte parasite) ───
function safeJson(text) {
  if (!text) return null;
  let t = String(text).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try { return JSON.parse(t); } catch { /* fallthrough */ }
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first >= 0 && last > first) {
    try { return JSON.parse(t.slice(first, last + 1)); } catch { /* fallthrough */ }
  }
  return null;
}

// ─── Normalisation défensive de la réponse IA ───
const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v));
const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v, min, max, dflt) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
};
const bool = (v) => (v === true || v === 'true' || v === 1);

function normalize(a) {
  const src = a && typeof a === 'object' ? a : {};
  const biasRaw = str(src.bias).toLowerCase();
  const bias = biasRaw.includes('hauss') ? 'haussier' : biasRaw.includes('baiss') ? 'baissier' : 'neutre';
  const st = src.structure && typeof src.structure === 'object' ? src.structure : {};
  const liq = src.liquidity && typeof src.liquidity === 'object' ? src.liquidity : {};
  const poi = src.points_of_interest && typeof src.points_of_interest === 'object' ? src.points_of_interest : {};
  const tp = src.trade_plan && typeof src.trade_plan === 'object' ? src.trade_plan : {};
  const ck = src.checklist && typeof src.checklist === 'object' ? src.checklist : {};
  return {
    valid: src.valid !== false && src.valid !== 'false',
    invalid_reason: str(src.invalid_reason),
    symbol: str(src.symbol),
    timeframe: str(src.timeframe),
    exchange: str(src.exchange),
    bias,
    confidence: num(src.confidence, 0, 10, null),
    overview: str(src.overview),
    structure: { bias: str(st.bias), phase: str(st.phase), last_event: str(st.last_event), pattern: str(st.pattern) },
    liquidity: {
      buy_side: arr(liq.buy_side).map(str).filter(Boolean),
      sell_side: arr(liq.sell_side).map(str).filter(Boolean),
      recent_sweep: str(liq.recent_sweep),
      inducement: str(liq.inducement),
    },
    points_of_interest: {
      order_blocks: arr(poi.order_blocks).map((o) => ({
        type: str(o?.type).toLowerCase().includes('supply') ? 'supply' : 'demand',
        zone: str(o?.zone), strength: str(o?.strength), stars: num(o?.stars, 0, 5, 0), note: str(o?.note),
      })),
      fvgs: arr(poi.fvgs).map((o) => ({ type: str(o?.type), zone: str(o?.zone), status: str(o?.status), note: str(o?.note) })),
      breakers: arr(poi.breakers).map((o) => ({ zone: str(o?.zone), note: str(o?.note) })),
    },
    indicators_visible: arr(src.indicators_visible).map(str).filter(Boolean),
    key_levels: arr(src.key_levels).map((o) => ({ level: str(o?.level), role: str(o?.role), priority: str(o?.priority) })),
    trade_plan: {
      direction: (() => { const d = str(tp.direction).toLowerCase(); return d.includes('long') ? 'long' : d.includes('short') ? 'short' : 'aucun'; })(),
      entries: arr(tp.entries).map((o) => ({ zone: str(o?.zone), rationale: str(o?.rationale) })).filter((e) => e.zone),
      stop_loss: str(tp.stop_loss),
      stop_rationale: str(tp.stop_rationale),
      take_profits: arr(tp.take_profits).map((o, i) => ({ label: str(o?.label) || `TP${i + 1}`, level: str(o?.level), rationale: str(o?.rationale) })).filter((e) => e.level),
      risk_reward: str(tp.risk_reward),
      position_note: str(tp.position_note),
    },
    scenarios: arr(src.scenarios).map((o, i) => ({
      name: str(o?.name) || (i === 0 ? 'Scénario principal' : `Scénario alternatif ${i}`),
      direction: str(o?.direction),
      probability: num(o?.probability, 0, 100, null),
      path: str(o?.path),
      entry: str(o?.entry),
      stop_loss: str(o?.stop_loss),
      take_profits: arr(o?.take_profits).map(str).filter(Boolean),
      conditions: arr(o?.conditions).map(str).filter(Boolean),
      invalidation: str(o?.invalidation),
    })),
    checklist: {
      timeframe_visible: bool(ck.timeframe_visible),
      price_scale_visible: bool(ck.price_scale_visible),
      candles_enough: bool(ck.candles_enough),
      indicators_clean: bool(ck.indicators_clean),
      volumes_visible: bool(ck.volumes_visible),
    },
    conclusion: str(src.conclusion),
  };
}

// ─── Appel Gemini vision avec chaîne de repli ───
async function callGeminiVision({ apiKey, base64, mimeType, notes }) {
  const models = process.env.CHART_AI_MODEL ? [process.env.CHART_AI_MODEL] : DEFAULT_MODELS;
  const contents = [{
    role: 'user',
    parts: [
      { text: buildPrompt(notes) },
      { inline_data: { mime_type: mimeType, data: base64 } },
    ],
  }];
  const errors = []; // diagnostic agrégé par modèle (visible dans upstream_error)
  for (const model of models) {
    try {
      const response = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.35,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
        signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = data?.error?.message || `HTTP ${response.status}`;
        errors.push(`${model}: ${msg}`.slice(0, 180));
        const modelUnavailable = response.status === 404
          || (response.status === 400 && /model|not found|unsupported/i.test(String(msg)));
        console.error(`[ChartAI] ${model} → HTTP ${response.status}`, modelUnavailable ? '(repli sur modèle suivant)' : msg);
        continue; // modèle suivant de la chaîne
      }
      if (data?.promptFeedback?.blockReason) {
        return { ok: false, code: 'blocked', message: 'Contenu bloqué par les filtres de sécurité de l’IA.' };
      }
      const parts = data?.candidates?.[0]?.content?.parts;
      const text = Array.isArray(parts) ? parts.map((p) => p?.text || '').join('').trim() : '';
      if (!text) { errors.push(`${model}: réponse vide du modèle`); continue; }
      const parsed = safeJson(text);
      if (!parsed) { errors.push(`${model}: réponse IA non conforme (JSON invalide)`); continue; }
      return { ok: true, model, analysis: normalize(parsed) };
    } catch (err) {
      const m = err?.name === 'TimeoutError' ? 'délai dépassé' : (err?.message || 'erreur réseau');
      errors.push(`${model}: ${m}`.slice(0, 180));
      console.error(`[ChartAI] ${model} →`, m);
    }
  }
  return { ok: false, code: 'upstream_error', message: `L’analyse a échoué (${errors.join(' | ') || 'erreur inconnue'}). Réessayez dans un instant.` };
}

// ─── Middleware autonome (compatible Express ET connect/Vite dev) ───
// Lit son propre corps (le parseur JSON global est limité à 1 Mo et arrive
// trop tôt dans server.js) — doit donc être monté AVANT lui.
export function createChartAiMiddleware({ getApiKey }) {
  return function chartAiMiddleware(req, res, next) {
    // Monté sur /api/chart-ai → ne traiter que POST /analyze
    if (!/^\/analyze\/?$/.test(req.url || '')) { if (next) next(); return; }
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, code: 'method', message: 'Méthode non autorisée' }));
      return;
    }

    const finish = async (payload) => {
      try {
        const apiKey = getApiKey();
        if (!apiKey) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, code: 'no_key', message: 'Service IA temporairement indisponible (clé serveur non configurée).' }));
          return;
        }
        if (rateLimited(clientIp(req))) {
          res.statusCode = 429;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, code: 'rate_limited', message: `Limite d’utilisation atteinte (${RL_MAX_CALLS} analyses/heure). Revenez un peu plus tard.` }));
          return;
        }
        const out = await callGeminiVision({ apiKey, base64: payload.image, mimeType: payload.mimeType, notes: payload.notes });
        res.statusCode = out.ok ? 200 : 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(out));
      } catch (err) {
        console.error('[ChartAI] handler error:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, code: 'internal', message: 'Erreur interne du proxy d’analyse.' }));
      }
    };

    // Corps déjà parsé (si monté après un body parser plus permissif)
    if (req.body && typeof req.body.image === 'string') {
      const p = validateBody(req.body);
      if (p.err) { send400(res, p.err); return; }
      finish(p.value);
      return;
    }

    // Lecture brute du corps avec limite dure
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        send400(res, 'Image trop volumineuse (maximum 8 Mo après compression côté navigateur).');
        req.destroy?.();
        size = -1;
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (size < 0) return;
      let parsed;
      try { parsed = JSON.parse(Buffer.concat(chunks).toString('utf-8')); }
      catch { send400(res, 'Corps de requête JSON invalide.'); return; }
      const p = validateBody(parsed);
      if (p.err) { send400(res, p.err); return; }
      finish(p.value);
    });
    req.on('error', () => { /* socket déjà cassé */ });
  };
}

function send400(res, message) {
  res.statusCode = 400;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: false, code: 'bad_request', message }));
}

function validateBody(b) {
  const image = typeof b?.image === 'string' ? b.image.replace(/^data:[^;]+;base64,/, '').trim() : '';
  const mimeType = ALLOWED_MIME.has(b?.mimeType) ? b.mimeType : 'image/jpeg';
  const notes = typeof b?.notes === 'string' ? b.notes.slice(0, 500) : '';
  if (!image || image.length < 64) return { err: 'Aucune image reçue.' };
  if (image.length > 14_000_000) return { err: 'Image trop volumineuse (maximum 8 Mo).' };
  if (!/^[A-Za-z0-9+/=\s]+$/.test(image)) return { err: 'Encodage d’image invalide.' };
  return { value: { image, mimeType, notes } };
}

// ─── Enregistrement Express (server.js prod) ───
export default function registerChartAiRoutes(app, ctx) {
  app.use('/api/chart-ai', createChartAiMiddleware(ctx));
}
