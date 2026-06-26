import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import TrialBanner from "@/components/TrialBanner";
import { Sparkles, ArrowRight, CheckCircle2, RotateCcw, Trophy, Twitter, Linkedin, Facebook, MessageCircle, Link2, Check, Share2 } from "lucide-react";

interface QuizQ {
  id: number;
  q: string;
  options: { label: string }[];
}

interface ToolReco {
  name: string;
  path: string;
  why: string;
}

interface Profile {
  key: string;
  emoji: string;
  name: string;
  tagline: string;
  desc: string;
  strengths: string[];
  weaknesses: string[];
  tools: ToolReco[];
  color: string;
}

type Phase = "intro" | "questions" | "email-gate" | "result";

// Static profile metadata (mirrors backend OG_PROFILES) — used when landing on a
// shared link like /quiz?profile=hodler so we can render the result page without
// requiring the user to retake the quiz first.
const STATIC_PROFILES: Record<string, { emoji: string; name: string; tagline: string; color: string }> = {
  hodler:   { emoji: '💎', name: 'Le HODLer Patient',          tagline: 'Tu joues sur le long terme avec sang-froid',          color: '#3b82f6' },
  scalper:  { emoji: '⚡', name: 'Le Scalpeur Adrénaline',     tagline: 'Tu fais des trades rapides, plusieurs fois par jour', color: '#f97316' },
  swing:    { emoji: '🎯', name: 'Le Swing Trader Stratégique', tagline: 'Tu joues sur des mouvements de quelques jours',     color: '#10b981' },
  longterm: { emoji: '🚀', name: "L'Investisseur Visionnaire", tagline: 'Tu cherches les pépites de demain',                  color: '#a855f7' },
};

export default function Quiz() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<QuizQ[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sharedView, setSharedView] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch questions on mount
  useEffect(() => {
    fetch("/api/v1/quiz/questions")
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && Array.isArray(j.questions)) {
          setQuestions(j.questions);
          setAnswers(new Array(j.questions.length).fill(-1));
        }
      })
      .catch(() => {});
  }, []);

  // Deep-link viewer: /quiz?profile=hodler shows a teaser of the shared profile
  // so social link previews and curious visitors can land directly on the result.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pkey = params.get("profile");
    if (pkey && STATIC_PROFILES[pkey]) {
      const meta = STATIC_PROFILES[pkey];
      setProfile({
        key: pkey,
        emoji: meta.emoji,
        name: meta.name,
        tagline: meta.tagline,
        desc: "Découvre ce profil de trader et trouve le tien — il ne te reste plus que 10 questions !",
        strengths: [],
        weaknesses: [],
        tools: [],
        color: meta.color,
      });
      setSharedView(true);
      setPhase("result");
    }
  }, []);

  function selectAnswer(idx: number) {
    const next = [...answers];
    next[current] = idx;
    setAnswers(next);
    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent(current + 1);
      } else {
        setPhase("email-gate");
      }
    }, 220);
  }

  async function submit() {
    setError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Email invalide");
      return;
    }
    if (answers.some((a) => a < 0)) {
      setError("Quiz incomplet");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/v1/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), answers, source: "quiz_page", lang: "fr" }),
      });
      const j = await r.json();
      if (!j?.ok) {
        setError(j?.error || "Erreur lors de l'envoi");
        setSubmitting(false);
        return;
      }
      setProfile(j.profile);
      setPhase("result");
    } catch {
      setError("Erreur réseau, réessaye.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setAnswers(new Array(questions.length).fill(-1));
    setCurrent(0);
    setEmail("");
    setProfile(null);
    setError(null);
    setPhase("intro");
  }

  const progress = questions.length > 0 ? Math.round(((current + (phase === "email-gate" || phase === "result" ? 1 : 0)) / (questions.length + 1)) * 100) : 0;

  // Build the dynamic SEO + share assets for the result page.
  const isResultView = phase === "result" && profile;
  const shareUrl = isResultView
    ? `https://www.cryptoia.ca/quiz?profile=${profile!.key}&utm_source=share&utm_medium=social&utm_campaign=trader_quiz`
    : "https://www.cryptoia.ca/quiz";
  const ogImage = isResultView
    ? `https://www.cryptoia.ca/api/v1/quiz/og/${profile!.key}.png`
    : undefined;
  const shareTitle = isResultView
    ? `${profile!.emoji} Je suis ${profile!.name} sur CryptoIA ! Et toi, quel trader es-tu ?`
    : t("quiz.seoTitle");
  const shareDesc = isResultView
    ? `${profile!.tagline} — Découvre ton profil de trader crypto en 2 minutes (gratuit).`
    : t("quiz.seoDescription");

  // ── Viral share tracking ──────────────────────────────────────────────────
  // Records share events to the backend and powers the leaderboard.
  type ShareEntry = { key: string; total: number; week: number; platforms: Record<string, number> };
  const [shareLeaderboard, setShareLeaderboard] = useState<ShareEntry[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/quiz/shares")
      .then(r => r.json())
      .then(j => { if (alive && j?.ok) setShareLeaderboard(j.profiles || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [phase]);

  async function trackShare(platform: string) {
    if (!isResultView) return;
    try {
      const r = await fetch("/api/v1/quiz/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: profile!.key, platform }),
      });
      const j = await r.json();
      if (j?.ok) {
        // refresh leaderboard with the new count
        fetch("/api/v1/quiz/shares")
          .then(r => r.json())
          .then(j2 => { if (j2?.ok) setShareLeaderboard(j2.profiles || []); })
          .catch(() => {});
      }
    } catch { /* ignore */ }
  }

  function share(platform: string) {
    trackShare(platform);
    const text = isResultView
      ? `${profile!.emoji} Selon CryptoIA, je suis : ${profile!.name} ! ${profile!.tagline}\n\nFais le test (2 min) :`
      : "Quel trader crypto es-tu ? Fais le test (2 min) :";
    const encUrl = encodeURIComponent(shareUrl);
    const encText = encodeURIComponent(text);
    let href = "";
    if (platform === "twitter") href = `https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}`;
    else if (platform === "facebook") href = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;
    else if (platform === "linkedin") href = `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`;
    else if (platform === "whatsapp") href = `https://wa.me/?text=${encText}%20${encUrl}`;
    else if (platform === "telegram") href = `https://t.me/share/url?url=${encUrl}&text=${encText}`;
    if (href) window.open(href, "_blank", "noopener,noreferrer,width=600,height=600");
  }

  async function copyShareLink() {
    trackShare("copy");
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <SEOHead
        title={shareTitle}
        description={shareDesc}
        path={isResultView ? `/quiz?profile=${profile!.key}` : "/quiz"}
        image={ogImage}
      />
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
          {/* Hero */}
          {phase === "intro" && (
            <div className="text-center" data-testid="quiz-intro">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                {t("quiz.introSubtitle")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                {t("quiz.introTitle")}
              </h1>
              <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto mb-2">
                {t("quiz.introHook")}
              </p>
              <p className="text-sm text-gray-500 max-w-2xl mx-auto mb-10">
                À la fin : ton profil, tes forces, tes faiblesses et les outils qui marchent pour TOI.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-10">
                {[
                  { emoji: "💎", label: "HODLer" },
                  { emoji: "⚡", label: "Scalpeur" },
                  { emoji: "🎯", label: "Swing" },
                  { emoji: "🚀", label: "Visionnaire" },
                ].map((p) => (
                  <div key={p.label} className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 text-center">
                    <div className="text-3xl mb-1">{p.emoji}</div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{p.label}</div>
                  </div>
                ))}
              </div>

              <button
                data-testid="quiz-start-button"
                onClick={() => setPhase("questions")}
                disabled={questions.length === 0}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-base hover:from-purple-400 hover:to-pink-400 transition-all shadow-xl shadow-purple-500/20 disabled:opacity-50"
              >
                {questions.length === 0 ? t("common.loading") : t("quiz.startButton")}
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-xs text-gray-500 mt-4">100% gratuit · Email demandé à la fin pour recevoir ton profil détaillé</p>
            </div>
          )}

          {/* Questions */}
          {phase === "questions" && questions[current] && (
            <div data-testid="quiz-questions">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t("quiz.questionCounter", { current: current + 1, total: questions.length })}</span>
                  <span className="text-xs text-purple-300 font-bold">{progress}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold mb-8 leading-tight">{questions[current].q}</h2>

              <div className="space-y-3">
                {questions[current].options.map((opt, i) => (
                  <button
                    key={i}
                    data-testid={`quiz-answer-${current}-${i}`}
                    onClick={() => selectAnswer(i)}
                    className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                      answers[current] === i
                        ? "bg-purple-500/15 border-purple-500/50 text-white"
                        : "bg-[#111827] border-white/[0.06] hover:border-purple-500/30 hover:bg-purple-500/5 text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        answers[current] === i ? "border-purple-400 bg-purple-500" : "border-white/20"
                      }`}>
                        {answers[current] === i && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className="text-sm md:text-base font-semibold">{opt.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              {current > 0 && (
                <button
                  onClick={() => setCurrent(current - 1)}
                  className="mt-6 text-xs text-gray-500 hover:text-gray-300"
                  data-testid="quiz-prev"
                >
                  ← Question précédente
                </button>
              )}
            </div>
          )}

          {/* Email gate */}
          {phase === "email-gate" && (
            <div data-testid="quiz-email-gate" className="max-w-md mx-auto text-center">
              <div className="text-5xl mb-4">🎁</div>
              <h2 className="text-3xl md:text-4xl font-black mb-3">Ton profil est prêt !</h2>
              <p className="text-gray-400 mb-8">Entre ton email pour découvrir ton profil de trader + recevoir tes recommandations personnalisées.</p>

              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
                <input
                  data-testid="quiz-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  className="w-full px-4 py-3.5 rounded-xl bg-black/30 border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 mb-3"
                  autoFocus
                />
                {error && <div className="text-red-400 text-xs mb-3 text-left" data-testid="quiz-email-error">{error}</div>}
                <button
                  data-testid="quiz-submit-button"
                  onClick={submit}
                  disabled={submitting || !email}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-sm hover:from-purple-400 hover:to-pink-400 transition-all disabled:opacity-50"
                >
                  {submitting ? "Calcul en cours..." : "Voir mon profil"}
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </button>
                <p className="text-[10px] text-gray-500 mt-3">Pas de spam. Désinscription en 1 clic.</p>
              </div>
            </div>
          )}

          {/* Result */}
          {phase === "result" && profile && (
            <div data-testid="quiz-result">
              <div
                className="rounded-3xl p-8 md:p-10 text-center mb-6"
                style={{ background: `linear-gradient(135deg, ${profile.color}33, #ec489933)`, border: `1px solid ${profile.color}55` }}
              >
                <div className="text-6xl md:text-7xl mb-3">{profile.emoji}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: profile.color }}>
                  {sharedView ? t("quiz.sharedProfileLabel") : t("quiz.resultProfileLabel")}
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-2">{profile.name}</h1>
                <p className="text-base md:text-lg text-gray-300 italic">{profile.tagline}</p>
              </div>

              {/* Viral share bar — visible only when the user just finished the quiz */}
              {!sharedView && (
                <div
                  data-testid="quiz-share-bar"
                  className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 mb-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Share2 className="w-4 h-4" style={{ color: profile.color }} />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">{t("quiz.sharePanelTitle")}</h3>
                    <span className="text-[10px] text-gray-500 font-bold ml-auto">{t("quiz.sharePanelBadgeHint")}</span>
                  </div>

                  {/* Viral leaderboard: most-shared profiles this week */}
                  {shareLeaderboard.length > 0 && shareLeaderboard[0].week > 0 && (
                    <div
                      data-testid="quiz-share-leaderboard"
                      className="mb-4 rounded-xl bg-white/[0.03] border border-white/[0.05] p-3"
                    >
                      <div className="flex items-center gap-2 mb-2.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold text-amber-400">{t("quiz.leaderboardLabel")}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {shareLeaderboard.map((s, idx) => {
                          const meta = STATIC_PROFILES[s.key];
                          if (!meta) return null;
                          const isMe = s.key === profile.key;
                          return (
                            <div
                              key={s.key}
                              className={`relative rounded-lg p-2 text-center border transition-colors ${isMe ? "bg-white/[0.06] border-white/30" : "bg-white/[0.02] border-white/[0.05]"}`}
                              style={isMe ? { borderColor: profile.color } : undefined}
                            >
                              {idx === 0 && s.week > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-black bg-amber-400 text-black rounded-full px-1.5 py-0.5">#1</span>
                              )}
                              <div className="text-xl leading-none mb-1">{meta.emoji}</div>
                              <div className="text-[9px] font-bold text-gray-300 truncate" title={meta.name}>{meta.name.split(" ").slice(1).join(" ") || meta.name}</div>
                              <div className="mt-1 text-[11px] font-black tabular-nums" style={{ color: isMe ? profile.color : "#e5e7eb" }}>{s.week}</div>
                              <div className="text-[8px] text-gray-500 uppercase tracking-wider">{t("quiz.leaderboardSharesUnit")}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* OG card preview — shows the exact image that will appear on socials */}
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mb-4 rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/[0.18] transition-colors"
                    data-testid="quiz-share-og-preview"
                  >
                    <img
                      src={ogImage}
                      alt={t("quiz.shareCardAlt", { profile: profile.name })}
                      className="w-full h-auto block"
                      loading="lazy"
                    />
                  </a>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => share("twitter")}
                      data-testid="quiz-share-twitter"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.05] border border-white/10 text-xs font-bold text-gray-100 hover:bg-white/[0.12] hover:border-white/20 transition"
                    >
                      <Twitter className="w-3.5 h-3.5" /> X
                    </button>
                    <button
                      onClick={() => share("facebook")}
                      data-testid="quiz-share-facebook"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.05] border border-white/10 text-xs font-bold text-gray-100 hover:bg-white/[0.12] hover:border-white/20 transition"
                    >
                      <Facebook className="w-3.5 h-3.5" /> Facebook
                    </button>
                    <button
                      onClick={() => share("linkedin")}
                      data-testid="quiz-share-linkedin"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.05] border border-white/10 text-xs font-bold text-gray-100 hover:bg-white/[0.12] hover:border-white/20 transition"
                    >
                      <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                    </button>
                    <button
                      onClick={() => share("whatsapp")}
                      data-testid="quiz-share-whatsapp"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                    <button
                      onClick={() => share("telegram")}
                      data-testid="quiz-share-telegram"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Telegram
                    </button>
                    <button
                      onClick={copyShareLink}
                      data-testid="quiz-share-copy"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.05] border border-white/10 text-xs font-bold text-gray-100 hover:bg-white/[0.12] hover:border-white/20 transition"
                    >
                      {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> {t("quiz.shareLinkCopied")}</> : <><Link2 className="w-3.5 h-3.5" /> {t("quiz.shareLinkButton")}</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Shared-view CTA: a curious friend lands on /quiz?profile=… — push them to take the quiz */}
              {sharedView && (
                <div
                  data-testid="quiz-shared-cta"
                  className="bg-gradient-to-br from-purple-500/15 to-pink-500/15 border border-purple-500/30 rounded-2xl p-6 mb-6 text-center"
                >
                  <p className="text-sm text-gray-300 mb-4">{t("quiz.sharedCtaHint")}</p>
                  <button
                    onClick={() => { setSharedView(false); setProfile(null); setPhase("intro"); window.history.replaceState({}, "", "/quiz"); }}
                    data-testid="quiz-shared-start"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-sm hover:from-purple-400 hover:to-pink-400 transition-all"
                  >
                    {t("quiz.sharedCtaButton")} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {!sharedView && (
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
                <p className="text-gray-300 leading-relaxed">{profile.desc}</p>
              </div>
              )}

              {!sharedView && (
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#111827] border border-emerald-500/20 rounded-2xl p-5">
                  <h3 className="text-emerald-400 font-extrabold text-sm mb-3 uppercase tracking-wider">💪 Tes forces</h3>
                  <ul className="space-y-2">
                    {profile.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#111827] border border-amber-500/20 rounded-2xl p-5">
                  <h3 className="text-amber-400 font-extrabold text-sm mb-3 uppercase tracking-wider">⚠️ Attention à</h3>
                  <ul className="space-y-2">
                    {profile.weaknesses.map((s, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2 before:content-['•'] before:text-amber-400 before:font-bold">
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              )}

              {!sharedView && (
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
                <h3 className="font-extrabold text-base mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: profile.color }} />
                  Outils faits pour toi
                </h3>
                <div className="space-y-3">
                  {profile.tools.map((t, i) => (
                    <Link
                      key={i}
                      to={t.path}
                      data-testid={`quiz-tool-${i}`}
                      className="block p-4 rounded-xl bg-black/20 hover:bg-black/40 border border-white/[0.04] hover:border-white/[0.12] transition-all"
                      style={{ borderLeft: `3px solid ${profile.color}` }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-white text-sm">{t.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{t.why}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500 shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              )}

              <TrialBanner source="quiz-result" className="mb-6" />

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={reset}
                  data-testid="quiz-reset"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-sm font-bold transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Refaire le quiz
                </button>
                <Link
                  to="/challenge"
                  data-testid="quiz-to-challenge"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-bold hover:bg-amber-500/30 transition"
                >
                  <Trophy className="w-4 h-4" />
                  Trading Challenge
                </Link>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}
