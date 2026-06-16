import { useEffect, useState } from "react";
import { X, Gift, Sparkles, Copy, Check } from "lucide-react";

const STORAGE_KEY = "cryptoia_exit_intent_shown";
const PROMO_CODE = "BIENVENUE20";
const DISCOUNT_PCT = 20;

/**
 * Exit Intent Popup
 * - Détecte quand la souris quitte le haut du viewport (intention de fermer l'onglet)
 * - Sur mobile : déclenche après 60s d'inactivité OU scroll-up rapide en haut
 * - Stocke dans localStorage pour ne s'afficher qu'une fois par utilisateur
 * - Offre un code promo pour réduire l'abandon de panier
 */
export default function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Already shown? Skip.
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;

    let triggered = false;
    const trigger = () => {
      if (triggered) return;
      triggered = true;
      localStorage.setItem(STORAGE_KEY, "1");
      setOpen(true);
    };

    // Desktop: mouse leaves the top of the viewport
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && e.relatedTarget === null) trigger();
    };

    // Mobile fallback: scroll-up rapide quand l'utilisateur est en haut OU 45s d'inactivité
    let lastY = window.scrollY;
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      const y = window.scrollY;
      if (y < 100 && lastY - y > 50) trigger(); // scroll rapide vers le haut près du top
      lastY = y;
    };

    const resetInactivity = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(trigger, 45000); // 45s d'inactivité = potentielle perte d'engagement
    };

    // Délai initial pour ne pas déranger l'utilisateur dès l'arrivée
    const initDelay = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
      window.addEventListener("scroll", handleScroll, { passive: true });
      ["mousemove", "keydown", "touchstart", "click"].forEach((ev) =>
        window.addEventListener(ev, resetInactivity, { passive: true })
      );
      resetInactivity();
    }, 8000); // attend 8s avant d'activer les listeners

    return () => {
      clearTimeout(initDelay);
      if (inactivityTimer) clearTimeout(inactivityTimer);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
      ["mousemove", "keydown", "touchstart", "click"].forEach((ev) =>
        window.removeEventListener(ev, resetInactivity)
      );
    };
  }, []);

  const close = () => setOpen(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — fallback impossible sur certains navigateurs
    }
  };

  const goToPricing = () => {
    setOpen(false);
    // Redirection vers la page d'abonnements
    window.location.href = "/abonnements";
  };

  if (!open) return null;

  return (
    <div
      data-testid="exit-intent-popup-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={close}
      style={{ animation: "exit-fadeIn 0.3s ease-out" }}
    >
      <div
        data-testid="exit-intent-popup"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.12] shadow-[0_24px_80px_-12px_rgba(99,102,241,0.5)]"
        style={{
          background: "linear-gradient(140deg, #0f172a 0%, #1e1b4b 45%, #0f172a 100%)",
          animation: "exit-pop 0.45s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        {/* Glow blobs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-500/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Close button */}
        <button
          data-testid="exit-intent-close-btn"
          onClick={close}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/[0.1] transition-all"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="relative z-10 p-7 md:p-9 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 border border-amber-400/30 bg-amber-400/10" style={{ boxShadow: "0 0 36px rgba(251,191,36,0.35)" }}>
            <Gift className="w-10 h-10 text-amber-300" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 border border-amber-400/40 bg-amber-400/10">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
              Offre exclusive — disparaît dans quelques secondes
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
            Attendez ! Voici{" "}
            <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 bg-clip-text text-transparent">
              -{DISCOUNT_PCT}%
            </span>{" "}
            sur votre 1<sup>er</sup> mois
          </h2>

          {/* Description */}
          <p className="text-sm text-gray-300 mb-6 leading-relaxed">
            Débloquez tous nos outils IA premium :{" "}
            <strong className="text-white">signaux temps réel</strong>,{" "}
            <strong className="text-white">backtesting</strong>,{" "}
            <strong className="text-white">Score Confiance IA</strong> et plus encore.
          </p>

          {/* Code box */}
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              Votre code promo
            </p>
            <button
              data-testid="exit-intent-copy-code"
              onClick={copyCode}
              className="group w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border-2 border-dashed border-amber-400/50 bg-amber-400/[0.06] hover:bg-amber-400/[0.12] transition-all"
            >
              <span className="text-2xl md:text-3xl font-black tracking-[0.2em] text-amber-300 font-mono">
                {PROMO_CODE}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-xs font-semibold text-white group-hover:bg-white/[0.12] transition-all">
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copier
                  </>
                )}
              </span>
            </button>
          </div>

          {/* CTA */}
          <button
            data-testid="exit-intent-cta-btn"
            onClick={goToPricing}
            className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider text-white transition-all hover:brightness-110 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
              boxShadow: "0 12px 30px -8px rgba(245,158,11,0.6), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            🚀 J'en profite maintenant
          </button>

          {/* Trust line */}
          <p className="mt-4 text-[10px] text-gray-500 leading-relaxed">
            Code valable sur tous les plans annuels • Annulable à tout moment • Activation immédiate
          </p>
        </div>

        <style>{`
          @keyframes exit-fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes exit-pop {
            from { opacity: 0; transform: scale(0.85) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
