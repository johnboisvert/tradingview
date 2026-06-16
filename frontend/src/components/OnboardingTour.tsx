import { useEffect, useState } from "react";
import { X, ArrowRight, Sparkles, Brain, Target, Gift, CheckCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "cryptoia_onboarding_v1";

/**
 * Onboarding Tour
 * - S'affiche pour les nouveaux utilisateurs (via ?welcome=1 ou localStorage manquant)
 * - 5 étapes guidées avec backdrop sombre
 * - Marque comme complété dans localStorage à la fin
 * - L'utilisateur peut skipper à tout moment
 */
interface Step {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  cta?: string;
}

const STEPS: Step[] = [
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: "Bienvenue dans CryptoIA 👋",
    desc: "Vous avez maintenant accès à la plateforme de trading crypto IA la plus complète du marché. Laissez-nous vous guider en 30 secondes.",
    accent: "from-violet-400 via-fuchsia-400 to-indigo-400",
  },
  {
    icon: <Brain className="w-8 h-8" />,
    title: "Score IA temps réel",
    desc: "Votre Dashboard affiche en haut un Score IA qui analyse le marché en continu : peur/avidité, dominance BTC, momentum global. Une vue d'ensemble en 3 secondes.",
    accent: "from-cyan-400 via-blue-400 to-indigo-400",
  },
  {
    icon: <Target className="w-8 h-8" />,
    title: "Signaux & Backtesting",
    desc: "Dans la barre latérale, vous trouverez : AI Signals (alertes auto), Backtesting (test de stratégies), Patterns IA (détection auto), Score Confiance, et plus encore.",
    accent: "from-emerald-400 via-teal-400 to-cyan-400",
  },
  {
    icon: <Gift className="w-8 h-8" />,
    title: "🎁 Code BIENVENUE20",
    desc: "Profitez de -20% sur votre 1er abonnement annuel avec le code BIENVENUE20. Cliquez sur Abonnements depuis la sidebar pour débloquer toutes les features.",
    accent: "from-amber-300 via-orange-400 to-rose-400",
    cta: "Voir les plans",
  },
  {
    icon: <CheckCircle className="w-8 h-8" />,
    title: "Vous êtes prêt !",
    desc: "Explorez librement la plateforme. Si besoin, le chat support est disponible en bas à droite. Bon trading ! 🚀",
    accent: "from-emerald-300 via-green-400 to-teal-400",
  },
];

export default function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const forceShow = params.get("welcome") === "1";
    const completed = localStorage.getItem(STORAGE_KEY) === "1";
    if (forceShow || !completed) {
      // Delay 1.2s to let the page render fully
      const t = setTimeout(() => {
        setOpen(true);
        trackEvent("onboarding_started");
      }, 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const complete = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
    trackEvent("onboarding_completed", { last_step: step + 1 });
    // Clean up URL param
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("welcome")) {
        url.searchParams.delete("welcome");
        window.history.replaceState({}, "", url.toString());
      }
    }
  };

  const skip = () => {
    trackEvent("onboarding_skipped", { step: step + 1 });
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("welcome")) {
        url.searchParams.delete("welcome");
        window.history.replaceState({}, "", url.toString());
      }
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else complete();
  };

  const goToPricing = () => {
    trackEvent("onboarding_cta_click", { step: step + 1 });
    complete();
    window.location.href = "/abonnements";
  };

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      data-testid="onboarding-backdrop"
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      style={{ animation: "ob-fadeIn 0.3s ease-out" }}
    >
      <div
        data-testid="onboarding-card"
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/[0.12] shadow-[0_24px_80px_-12px_rgba(99,102,241,0.5)]"
        style={{
          background: "linear-gradient(140deg, #0f172a 0%, #1e1b4b 45%, #0f172a 100%)",
          animation: "ob-pop 0.45s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        {/* Blob glows */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-fuchsia-500/25 blur-3xl pointer-events-none" />

        {/* Skip button */}
        <button
          data-testid="onboarding-skip-btn"
          onClick={skip}
          className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/[0.1] text-xs text-gray-300 transition-all"
          aria-label="Passer le tour"
        >
          Passer
        </button>

        <div className="relative z-10 p-7 md:p-9">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-8 bg-gradient-to-r from-violet-400 to-fuchsia-400"
                    : i < step
                    ? "w-4 bg-white/40"
                    : "w-4 bg-white/[0.08]"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div
              className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${current.accent} flex items-center justify-center text-white relative overflow-hidden`}
              style={{ boxShadow: "0 12px 36px -8px rgba(139,92,246,0.55), inset 0 1px 0 rgba(255,255,255,0.3)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
              <div className="relative z-10">{current.icon}</div>
            </div>
          </div>

          {/* Title + desc */}
          <div className="text-center mb-7">
            <h2
              className={`text-2xl md:text-3xl font-black bg-gradient-to-r ${current.accent} bg-clip-text text-transparent mb-3 leading-tight`}
            >
              {current.title}
            </h2>
            <p className="text-sm md:text-[15px] text-gray-300 leading-relaxed max-w-md mx-auto">
              {current.desc}
            </p>
          </div>

          {/* Special: promo code reveal on step 4 */}
          {step === 3 && (
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-dashed border-amber-400/50 bg-amber-400/[0.06]">
                <span className="text-2xl font-black tracking-[0.25em] text-amber-300 font-mono">
                  BIENVENUE20
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {step > 0 && !isLast && (
              <button
                data-testid="onboarding-back-btn"
                onClick={() => setStep(step - 1)}
                className="px-5 py-3 rounded-2xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-sm font-bold text-gray-300 transition-all"
              >
                Précédent
              </button>
            )}
            {current.cta ? (
              <button
                data-testid="onboarding-cta-btn"
                onClick={goToPricing}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm uppercase tracking-wider text-white transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
                  boxShadow: "0 12px 30px -8px rgba(245,158,11,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                {current.cta} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                data-testid="onboarding-next-btn"
                onClick={next}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm uppercase tracking-wider text-white transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{
                  background: isLast
                    ? "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)"
                    : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
                  boxShadow: isLast
                    ? "0 12px 30px -8px rgba(16,185,129,0.55), inset 0 1px 0 rgba(255,255,255,0.2)"
                    : "0 12px 30px -8px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                {isLast ? "Commencer 🚀" : "Suivant"} {!isLast && <ArrowRight className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Bottom hint */}
          <p className="mt-5 text-[10px] text-center text-gray-500">
            Étape {step + 1} sur {STEPS.length} · Vous pouvez relancer ce tour depuis vos paramètres
          </p>
        </div>

        <style>{`
          @keyframes ob-fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes ob-pop {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
