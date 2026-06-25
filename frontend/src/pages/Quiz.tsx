import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import TrialBanner from "@/components/TrialBanner";
import { Sparkles, ArrowRight, CheckCircle2, RotateCcw, Trophy } from "lucide-react";

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

export default function Quiz() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<QuizQ[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

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

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <SEOHead
        title="Quel trader es-tu ? · Quiz Crypto gratuit"
        description="10 questions pour découvrir ton profil de trader crypto : HODLer, Scalpeur, Swing ou Investisseur visionnaire. Recommandations personnalisées + 7 jours gratuits."
        path="/quiz"
      />
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
          {/* Hero */}
          {phase === "intro" && (
            <div className="text-center" data-testid="quiz-intro">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                QUIZ GRATUIT · 2 MINUTES
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Quel trader es-tu&nbsp;?
              </h1>
              <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto mb-2">
                10 questions pour décoder ton ADN de trader crypto.
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
                {questions.length === 0 ? "Chargement..." : "Commencer le quiz"}
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
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Question {current + 1} / {questions.length}</span>
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
                className="rounded-3xl p-8 md:p-10 text-center mb-8"
                style={{ background: `linear-gradient(135deg, ${profile.color}33, #ec489933)`, border: `1px solid ${profile.color}55` }}
              >
                <div className="text-6xl md:text-7xl mb-3">{profile.emoji}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2" style={{ color: profile.color }}>
                  Ton profil de trader
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-2">{profile.name}</h1>
                <p className="text-base md:text-lg text-gray-300 italic">{profile.tagline}</p>
              </div>

              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
                <p className="text-gray-300 leading-relaxed">{profile.desc}</p>
              </div>

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
