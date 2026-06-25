// SEO Content Generator — shared GPT-5.4 helper used by glossary, comparison
// and per-coin pages. All call sites share the same Emergent LLM Key path,
// JSON response format and error handling so we don't duplicate prompt logic
// across three route modules.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const SEO_DATA_DIR = path.join(__dirname, '..', 'data');

const EMERGENT_BASE = 'https://integrations.emergentagent.com/llm';
const MODEL = process.env.SEO_GENERATOR_MODEL || 'gpt-5.4';

export function loadJSON(file, fallback) {
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* */ }
  return fallback;
}
export function saveJSON(file, data) {
  try {
    if (!fs.existsSync(SEO_DATA_DIR)) fs.mkdirSync(SEO_DATA_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) { console.error('[SEOGen] save error:', e?.message); }
}

export function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

// ── Single GPT-5.4 call returning JSON ─────────────────────────────────────
export async function generateJSON({ systemPrompt, userPrompt, maxTokens = 3500 }) {
  const key = process.env.EMERGENT_LLM_KEY;
  if (!key) throw new Error('EMERGENT_LLM_KEY missing');
  const resp = await fetch(`${EMERGENT_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_completion_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`LLM ${resp.status}: ${txt.slice(0, 200)}`);
  }
  const data = await resp.json();
  const raw = data?.choices?.[0]?.message?.content || '';
  try { return { ...JSON.parse(raw), _usage: data?.usage }; }
  catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Non-JSON LLM response: ' + raw.slice(0, 200));
    return { ...JSON.parse(m[0]), _usage: data?.usage };
  }
}
