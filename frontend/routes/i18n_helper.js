// AI Translation Helper — admin endpoint that uses GPT-5.4 (Emergent LLM Key)
// to bulk-translate French → English (or any language pair). Used to accelerate
// the i18n migration of the remaining ~33 pages without rewriting them by hand.
//
// ── Endpoints (admin-guarded) ────────────────────────────────────────────
//   POST /api/v1/admin/i18n/translate
//     body: { strings: [{ key: "successStories.title", fr: "Témoignages" }, ...],
//             target_lang: "en" }
//     resp: { ok, translations: [{ key, fr, translated }] }
//
//   POST /api/v1/admin/i18n/extract-from-text
//     body: { text: "any French paragraph...", target_lang: "en" }
//     resp: { ok, translated }

import fs from 'fs';
const EMERGENT_BASE = 'https://integrations.emergentagent.com/llm';
const MODEL = process.env.I18N_MODEL || 'gpt-5.4';

async function callLLM(messages, { json = false } = {}) {
  const key = process.env.EMERGENT_LLM_KEY;
  if (!key) throw new Error('EMERGENT_LLM_KEY missing');
  const body = {
    model: MODEL,
    messages,
    max_completion_tokens: 4000,
  };
  if (json) body.response_format = { type: 'json_object' };
  const resp = await fetch(`${EMERGENT_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`LLM ${resp.status}: ${errText.slice(0, 300)}`);
  }
  const data = await resp.json();
  return { content: data?.choices?.[0]?.message?.content || '', usage: data?.usage };
}

export default function registerI18nHelperRoutes(app, { requireAdmin } = {}) {
  const adminGuard = requireAdmin || ((_req, _res, next) => next());

  // Bulk translate dictionary entries (preserves keys, only translates values)
  app.post('/api/v1/admin/i18n/translate', adminGuard, async (req, res) => {
    const { strings, target_lang = 'en', source_lang = 'fr' } = req.body || {};
    if (!Array.isArray(strings) || strings.length === 0) {
      return res.status(400).json({ ok: false, error: 'strings array required' });
    }
    if (strings.length > 80) {
      return res.status(400).json({ ok: false, error: 'max 80 strings per call' });
    }
    if (!process.env.EMERGENT_LLM_KEY) {
      return res.status(503).json({ ok: false, error: 'EMERGENT_LLM_KEY missing' });
    }
    const langName = { en: 'English', es: 'Spanish', de: 'German', it: 'Italian', pt: 'Portuguese' }[target_lang] || target_lang;
    const sourceLangName = { fr: 'French', en: 'English' }[source_lang] || source_lang;
    const system = `You are a professional translator specializing in fintech / crypto trading UIs.
Translate ${sourceLangName} strings to ${langName}. Preserve i18n placeholders like {{name}} and HTML tags exactly.
Keep brand names (CryptoIA, Bitcoin, Ethereum) untranslated. Keep button/CTA strings concise and natural.
Respond ONLY with a JSON object: {"translations":[{"key":"...","translated":"..."}, ...]} matching the input order.`;
    const user = `Translate the following ${sourceLangName} strings to ${langName}:\n\n${strings.map(s => `[${s.key}] ${s.fr || s.source || ''}`).join('\n')}`;
    try {
      const { content, usage } = await callLLM(
        [{ role: 'system', content: system }, { role: 'user', content: user }],
        { json: true },
      );
      let parsed;
      try { parsed = JSON.parse(content); }
      catch {
        const m = content.match(/\{[\s\S]*\}/);
        if (!m) throw new Error('LLM returned non-JSON: ' + content.slice(0, 200));
        parsed = JSON.parse(m[0]);
      }
      const out = (parsed.translations || []).map(t => ({
        key: t.key,
        fr: strings.find(s => s.key === t.key)?.fr || strings.find(s => s.key === t.key)?.source || '',
        translated: t.translated,
      }));
      res.json({ ok: true, target_lang, translations: out, usage });
    } catch (e) {
      console.error('[I18nHelper] translate error:', e?.message);
      res.status(500).json({ ok: false, error: e?.message });
    }
  });

  // Extract hardcoded JSX text strings from a .tsx file (read-only) and suggest i18n keys
  app.post('/api/v1/admin/i18n/scan-page', adminGuard, async (req, res) => {
    const { filePath, namespace } = req.body || {};
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ ok: false, error: 'filePath required (relative to /app)' });
    }
    // Strict whitelist: only allow scanning files inside the React src/ tree
    if (!filePath.startsWith('frontend/src/') || !filePath.endsWith('.tsx')) {
      return res.status(403).json({ ok: false, error: 'filePath must be frontend/src/*.tsx' });
    }
    if (filePath.includes('..')) return res.status(403).json({ ok: false, error: 'invalid path' });
    const fullPath = `/app/work/tv_repo/${filePath}`;
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ ok: false, error: 'file not found' });
    }
    if (!process.env.EMERGENT_LLM_KEY) {
      return res.status(503).json({ ok: false, error: 'EMERGENT_LLM_KEY missing' });
    }
    const code = fs.readFileSync(fullPath, 'utf8').slice(0, 20000); // safety cap
    const ns = (namespace || filePath.split('/').pop().replace('.tsx', '')).toLowerCase().replace(/[^a-z0-9]/g, '');
    const system = `You are an i18n migration assistant for React + react-i18next.
Given a .tsx file, extract every USER-FACING French string (JSX text, placeholders, button labels, alt text)
and propose stable i18n keys under the namespace "${ns}".
Skip: imports, comments, props that are not user-visible (className, data-testid, type), variable names.
Respond ONLY with JSON: {"strings":[{"key":"${ns}.someKey","fr":"...","en":"..."}, ...]}
Limit to maximum 60 strings. Use camelCase keys. Make keys descriptive (e.g., "${ns}.heroTitle" not "${ns}.key1").`;
    try {
      const { content, usage } = await callLLM(
        [{ role: 'system', content: system }, { role: 'user', content: 'Here is the file:\n\n```tsx\n' + code + '\n```' }],
        { json: true },
      );
      let parsed;
      try { parsed = JSON.parse(content); }
      catch {
        const m = content.match(/\{[\s\S]*\}/);
        if (!m) throw new Error('LLM returned non-JSON');
        parsed = JSON.parse(m[0]);
      }
      res.json({ ok: true, namespace: ns, strings: parsed.strings || [], usage });
    } catch (e) {
      console.error('[I18nHelper] scan-page error:', e?.message);
      res.status(500).json({ ok: false, error: e?.message });
    }
  });

  console.log('[I18nHelper] ✅ Routes registered (/api/v1/admin/i18n/*)');
}
