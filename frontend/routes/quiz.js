// Quiz "Quel trader es-tu ?" — Lead magnet quiz with email gate
// Captures email BEFORE showing result → max conversion. Sends personalized
// profile email via Resend with recommendations + CTA to upgrade.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUIZ_FILE = path.join(__dirname, '..', 'data', 'quiz_submissions.json');

function loadQuiz() {
  try { if (fs.existsSync(QUIZ_FILE)) return JSON.parse(fs.readFileSync(QUIZ_FILE, 'utf8')); } catch { /* fallthrough */ }
  return { submissions: [] };
}
function saveQuiz(data) {
  try {
    fs.mkdirSync(path.dirname(QUIZ_FILE), { recursive: true });
    fs.writeFileSync(QUIZ_FILE, JSON.stringify(data, null, 2));
  } catch (e) { console.error('[Quiz] save error:', e?.message); }
}

// ─── 4 trader profiles ──────────────────────────────────────────────────────
const PROFILES = {
  hodler: {
    key: 'hodler',
    emoji: '💎',
    name: 'Le HODLer Patient',
    tagline: 'Tu joues sur le long terme avec sang-froid',
    desc: "Tu crois en la valeur fondamentale de la crypto. Tu accumules, tu attends, tu n'as pas peur des baisses. Ta force : ta patience. Ton risque : louper des opportunités court-terme.",
    strengths: ['Patience exceptionnelle', 'Vision long terme', 'Résistance aux émotions'],
    weaknesses: ['Manque d\'agilité', 'Pas de profit court-terme', 'Risque de bag-holding'],
    tools: [
      { name: 'Portfolio Tracker', path: '/portfolio-tracker', why: 'Suivre l\'évolution de ton portefeuille DCA' },
      { name: 'Calculatrice DCA', path: '/calculatrice', why: 'Projeter tes gains long terme' },
      { name: 'Bullrun Phase', path: '/bullrun-phase', why: 'Identifier les sommets de cycle pour prendre tes profits' },
    ],
    color: '#3b82f6',
  },
  scalper: {
    key: 'scalper',
    emoji: '⚡',
    name: 'Le Scalpeur Adrénaline',
    tagline: 'Tu fais des trades rapides, plusieurs fois par jour',
    desc: "Tu adores l'action, les graphiques 5min, les setups serrés. Ta force : ta réactivité. Ton risque : le burnout et les commissions qui mangent les gains.",
    strengths: ['Réactivité', 'Discipline technique', 'Profit rapide'],
    weaknesses: ['Stress élevé', 'Coûts de transaction', 'Risque d\'overtrading'],
    tools: [
      { name: 'Scalp Trading IA', path: '/scalp', why: 'Signaux de scalp ultra-précis générés par IA' },
      { name: 'AI Signals', path: '/ai-signals', why: 'Signaux temps-réel multi-timeframes' },
      { name: 'Alertes Telegram', path: '/alertes-ia', why: 'Recevoir les setups instantanément' },
    ],
    color: '#f97316',
  },
  swing: {
    key: 'swing',
    emoji: '🎯',
    name: 'Le Swing Trader Stratégique',
    tagline: 'Tu joues sur des mouvements de quelques jours à quelques semaines',
    desc: "Tu équilibres patience et action. Tu attends les bons setups, tu tiens tes positions. Ta force : la stratégie. Ton risque : rater le timing parfait.",
    strengths: ['Équilibre risque/reward', 'Stratégie réfléchie', 'Stress modéré'],
    weaknesses: ['Patience requise', 'Setups rares', 'Sensible aux news'],
    tools: [
      { name: 'Swing Trading IA', path: '/trades', why: 'Signaux swing avec entry/SL/TP optimaux' },
      { name: 'Backtesting Visuel', path: '/backtesting-visuel', why: 'Tester tes stratégies avant le live' },
      { name: 'Score Confiance IA', path: '/score-confiance-ia', why: 'Filtrer les meilleurs setups' },
    ],
    color: '#10b981',
  },
  longterm: {
    key: 'longterm',
    emoji: '🚀',
    name: 'L\'Investisseur Visionnaire',
    tagline: 'Tu cherches les pépites de demain',
    desc: "Tu fais des recherches fondamentales, tu pari sur des projets early-stage. Ta force : la vision. Ton risque : te tromper de projet et perdre gros.",
    strengths: ['Vision macro', 'Recherche fondamentale', 'Gains potentiels énormes'],
    weaknesses: ['Risque de perte totale', 'Liquidité faible', 'Patience extrême'],
    tools: [
      { name: 'Gem Hunter IA', path: '/gem-hunter', why: 'Détecter les pépites avant qu\'elles explosent' },
      { name: 'Pépites Crypto', path: '/pepites-crypto', why: 'Sélection IA de tokens à fort potentiel' },
      { name: 'Narrative Radar', path: '/narrative-radar', why: 'Anticiper les prochaines narratives qui pumpent' },
    ],
    color: '#a855f7',
  },
};

// ─── 10 questions, each maps to a profile via weight ────────────────────────
export const QUESTIONS = [
  {
    id: 1,
    q: 'Combien de temps comptes-tu garder une crypto en moyenne ?',
    options: [
      { label: 'Quelques minutes à quelques heures', w: { scalper: 3 } },
      { label: 'Quelques jours à quelques semaines', w: { swing: 3 } },
      { label: 'Plusieurs mois', w: { hodler: 2, longterm: 1 } },
      { label: 'Des années', w: { hodler: 3, longterm: 2 } },
    ],
  },
  {
    id: 2,
    q: 'Combien de temps passes-tu à regarder les graphiques par jour ?',
    options: [
      { label: 'Plus de 4 heures', w: { scalper: 3 } },
      { label: '1 à 4 heures', w: { swing: 3, scalper: 1 } },
      { label: '15-60 minutes', w: { swing: 1, longterm: 2 } },
      { label: 'Quelques minutes', w: { hodler: 3 } },
    ],
  },
  {
    id: 3,
    q: 'Si BTC chute de -30% en une semaine, tu...',
    options: [
      { label: 'Tu vends tout en panique', w: {} },
      { label: 'Tu coupes une partie pour limiter les dégâts', w: { swing: 2, scalper: 2 } },
      { label: 'Tu attends, c\'est juste de la volatilité', w: { hodler: 2 } },
      { label: 'Tu en rachètes encore plus !', w: { hodler: 3, longterm: 2 } },
    ],
  },
  {
    id: 4,
    q: 'Ton objectif principal en trading crypto ?',
    options: [
      { label: 'Faire un revenu complémentaire mensuel', w: { scalper: 2, swing: 2 } },
      { label: 'Devenir riche dans 5-10 ans', w: { hodler: 3, longterm: 2 } },
      { label: 'Trouver le prochain Bitcoin (x100)', w: { longterm: 3 } },
      { label: 'Battre le marché à court terme', w: { swing: 2, scalper: 2 } },
    ],
  },
  {
    id: 5,
    q: 'Quel niveau de levier utilises-tu ?',
    options: [
      { label: 'Pas de levier, je joue en spot', w: { hodler: 2, longterm: 2 } },
      { label: 'Levier x2 à x5 max', w: { swing: 3 } },
      { label: 'Levier x10 à x20', w: { scalper: 2, swing: 1 } },
      { label: 'Levier x50+', w: { scalper: 3 } },
    ],
  },
  {
    id: 6,
    q: 'Quel type de projets t\'attire le plus ?',
    options: [
      { label: 'BTC, ETH, top 10 uniquement', w: { hodler: 3 } },
      { label: 'Top 50, blue chips altcoins', w: { hodler: 1, swing: 2 } },
      { label: 'Mid/Low caps prometteurs', w: { longterm: 2, swing: 2 } },
      { label: 'Microcaps, memecoins, presales', w: { longterm: 3, scalper: 1 } },
    ],
  },
  {
    id: 7,
    q: 'Quelle est ta réaction face à une opportunité de trade ?',
    options: [
      { label: 'J\'entre tout de suite, FOMO oblige', w: { scalper: 2 } },
      { label: 'J\'analyse le setup en 5 minutes et j\'entre', w: { scalper: 3, swing: 1 } },
      { label: 'J\'attends la confirmation sur plusieurs heures', w: { swing: 3 } },
      { label: 'Je fais ma due diligence sur plusieurs jours', w: { longterm: 3, hodler: 1 } },
    ],
  },
  {
    id: 8,
    q: 'Ton plus grand ennemi en trading ?',
    options: [
      { label: 'Le manque de patience', w: { scalper: 2 } },
      { label: 'Les émotions (peur/avidité)', w: { swing: 2, scalper: 1 } },
      { label: 'Le manque de temps', w: { hodler: 2 } },
      { label: 'Choisir le mauvais projet', w: { longterm: 3 } },
    ],
  },
  {
    id: 9,
    q: 'Quel outil utilises-tu le plus ?',
    options: [
      { label: 'TradingView (charts techniques)', w: { scalper: 3, swing: 2 } },
      { label: 'CoinGecko / portfolio tracker', w: { hodler: 2 } },
      { label: 'Twitter / Discord / news', w: { longterm: 2, swing: 1 } },
      { label: 'On-chain analytics (Glassnode, etc.)', w: { longterm: 3, hodler: 1 } },
    ],
  },
  {
    id: 10,
    q: 'Combien de trades fais-tu par semaine en moyenne ?',
    options: [
      { label: '20+ trades', w: { scalper: 3 } },
      { label: '5 à 20 trades', w: { swing: 2, scalper: 1 } },
      { label: '1 à 5 trades', w: { swing: 3, longterm: 1 } },
      { label: 'Moins d\'un par semaine', w: { hodler: 3, longterm: 2 } },
    ],
  },
];

function computeProfile(answers) {
  // answers = [optionIndex (0..3) per question, length=10]
  const scores = { hodler: 0, scalper: 0, swing: 0, longterm: 0 };
  for (let i = 0; i < QUESTIONS.length; i++) {
    const optIdx = answers[i];
    if (typeof optIdx !== 'number') continue;
    const opt = QUESTIONS[i].options[optIdx];
    if (!opt) continue;
    for (const k of Object.keys(opt.w || {})) {
      scores[k] = (scores[k] || 0) + opt.w[k];
    }
  }
  // Winner
  let winner = 'hodler';
  let max = -1;
  for (const k of Object.keys(scores)) {
    if (scores[k] > max) { max = scores[k]; winner = k; }
  }
  return { profileKey: winner, scores, profile: PROFILES[winner] };
}

function buildResultEmailHtml(profile, lang = 'fr') {
  const isEn = lang === 'en';
  const subject = isEn
    ? `${profile.emoji} You are: ${profile.name}`
    : `${profile.emoji} Ton profil : ${profile.name}`;
  const intro = isEn
    ? "Here are your personalized recommendations to maximize your profits based on your trader DNA."
    : "Voici tes recommandations personnalisées pour maximiser tes profits selon ton ADN de trader.";
  const strengthsTitle = isEn ? '💪 Your strengths' : '💪 Tes forces';
  const weaknessesTitle = isEn ? '⚠️ Watch out for' : '⚠️ Attention à';
  const toolsTitle = isEn ? '🎯 Tools made for you' : '🎯 Outils faits pour toi';
  const cta = isEn ? 'Try CryptoIA free for 7 days →' : 'Essai gratuit CryptoIA 7 jours →';

  const strHtml = profile.strengths.map(s => `<li style="margin-bottom:6px;color:#d1d5db;">${s}</li>`).join('');
  const weakHtml = profile.weaknesses.map(s => `<li style="margin-bottom:6px;color:#d1d5db;">${s}</li>`).join('');
  const toolsHtml = profile.tools.map(t => `
    <tr><td style="padding:12px;background:#0a0a14;border-radius:10px;border-left:3px solid ${profile.color};margin-bottom:10px;display:block;margin-top:8px;">
      <div style="font-weight:800;color:#fff;font-size:14px;">${t.name}</div>
      <div style="color:#9ca3af;font-size:12px;margin:4px 0 8px;">${t.why}</div>
      <a href="https://www.cryptoia.ca${t.path}" style="display:inline-block;color:${profile.color};font-size:12px;font-weight:700;text-decoration:none;">→ Découvrir</a>
    </td></tr>`).join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e7eb;">
<div style="max-width:640px;margin:0 auto;background:#0f0f1a;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
  <div style="background:linear-gradient(135deg, ${profile.color}, #ec4899);padding:40px 28px;text-align:center;">
    <div style="font-size:64px;line-height:1;margin-bottom:12px;">${profile.emoji}</div>
    <div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.8);font-weight:800;margin-bottom:6px;">${isEn ? 'Your Trader Profile' : 'Ton Profil de Trader'}</div>
    <h1 style="margin:0;font-size:28px;color:white;font-weight:900;">${profile.name}</h1>
    <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-style:italic;">${profile.tagline}</p>
  </div>
  <div style="padding:28px;">
    <p style="font-size:14px;line-height:1.6;color:#d1d5db;margin:0 0 20px 0;">${intro}</p>
    <p style="font-size:14px;line-height:1.65;color:#e5e7eb;margin:0 0 24px 0;">${profile.desc}</p>

    <h2 style="font-size:15px;color:#10b981;margin:24px 0 10px;">${strengthsTitle}</h2>
    <ul style="margin:0;padding-left:18px;font-size:13px;">${strHtml}</ul>

    <h2 style="font-size:15px;color:#f59e0b;margin:24px 0 10px;">${weaknessesTitle}</h2>
    <ul style="margin:0;padding-left:18px;font-size:13px;">${weakHtml}</ul>

    <h2 style="font-size:15px;color:${profile.color};margin:28px 0 6px;">${toolsTitle}</h2>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0 8px;">${toolsHtml}</table>

    <div style="margin-top:32px;padding:24px;background:linear-gradient(135deg, ${profile.color}, #7c3aed);border-radius:12px;text-align:center;">
      <p style="margin:0 0 14px 0;font-size:14px;color:white;line-height:1.5;font-weight:700;">${isEn ? 'Ready to trade like a pro?' : 'Prêt à trader comme un pro ?'}</p>
      <a href="https://www.cryptoia.ca/abonnements?utm_source=quiz&utm_medium=email&utm_campaign=trader-profile" style="display:inline-block;background:white;color:${profile.color};padding:14px 28px;border-radius:99px;text-decoration:none;font-weight:900;font-size:14px;">${cta}</a>
    </div>

    <p style="margin:32px 0 0 0;font-size:11px;color:#6b7280;text-align:center;line-height:1.5;">
      © CryptoIA · <a href="https://www.cryptoia.ca" style="color:#a78bfa;">cryptoia.ca</a>
    </p>
  </div>
</div>
</body></html>`;
}

export default function register(app, { resendClientGetter }) {
  // GET /api/v1/quiz/questions — return all questions (no answers leaked)
  app.get('/api/v1/quiz/questions', (req, res) => {
    res.json({
      ok: true,
      questions: QUESTIONS.map(q => ({
        id: q.id,
        q: q.q,
        options: q.options.map(o => ({ label: o.label })),
      })),
    });
  });

  // POST /api/v1/quiz/submit — email-gated submission, returns profile
  app.post('/api/v1/quiz/submit', async (req, res) => {
    const { email, answers, lang = 'fr', source = 'quiz' } = req.body || {};
    if (!email || typeof email !== 'string') return res.status(400).json({ ok: false, error: 'Email requis' });
    if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) {
      return res.status(400).json({ ok: false, error: 'Réponses incomplètes' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) return res.status(400).json({ ok: false, error: 'Email invalide' });

    const { profileKey, scores, profile } = computeProfile(answers);

    // Persist submission
    const db = loadQuiz();
    db.submissions.push({
      id: crypto.randomBytes(8).toString('hex'),
      email: cleanEmail,
      profileKey,
      scores,
      lang,
      source,
      created_at: new Date().toISOString(),
      ip: (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim(),
    });
    saveQuiz(db);

    // Send email via Resend (non-blocking failure)
    try {
      const resendClient = typeof resendClientGetter === 'function' ? await resendClientGetter() : null;
      if (resendClient) {
        const from = process.env.RESEND_FROM_EMAIL || 'CryptoIA <noreply@cryptoia.ca>';
        const subject = lang === 'en'
          ? `${profile.emoji} You are: ${profile.name}`
          : `${profile.emoji} Ton profil : ${profile.name}`;
        const html = buildResultEmailHtml(profile, lang);
        await resendClient.emails.send({ from, to: cleanEmail, subject, html });
        console.log(`[Quiz] Profile "${profileKey}" sent to ${cleanEmail}`);
      }
    } catch (e) {
      console.error('[Quiz] Send error:', e?.message);
    }

    res.json({ ok: true, profile });
  });

  // GET /api/v1/quiz/stats — admin/public stats
  app.get('/api/v1/quiz/stats', (req, res) => {
    const db = loadQuiz();
    const total = db.submissions.length;
    const byProfile = {};
    for (const s of db.submissions) {
      byProfile[s.profileKey] = (byProfile[s.profileKey] || 0) + 1;
    }
    res.json({ ok: true, total, byProfile });
  });
}
