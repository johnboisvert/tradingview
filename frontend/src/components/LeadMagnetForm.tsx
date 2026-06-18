// Lead Magnet Email Capture — pre-conversion email funnel for blog readers
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Download, CheckCircle, Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function LeadMagnetForm({ source = "blog" }: { source?: string }) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage?.startsWith("en") ? "en" : "fr";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("submitting");
    setError("");
    trackEvent("lead_magnet_submitted", { source, lang });
    try {
      const res = await fetch("/api/v1/lead-magnet/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source, lang }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Erreur inscription");
      setStatus("success");
      trackEvent("lead_magnet_delivered", { source, lang });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      setError(msg);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        data-testid="lead-magnet-success"
        className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6 md:p-7 not-prose"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-black text-white mb-1">
              {lang === "en" ? "Check your inbox!" : "Vérifie ta boîte mail !"}
            </h3>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
              {lang === "en"
                ? "We just sent the free guide to your email. If you don't see it, check your spam folder."
                : "Le guide gratuit vient d'être envoyé à ton adresse. Si tu ne le vois pas, regarde dans ton dossier spam."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="lead-magnet-form"
      className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.05] to-yellow-500/[0.08] p-6 md:p-7 not-prose"
    >
      <div className="flex items-center gap-2 mb-3">
        <Download className="w-4 h-4 text-amber-300" />
        <span className="text-[10px] uppercase tracking-widest font-black text-amber-300">
          {lang === "en" ? "Free guide" : "Guide gratuit"}
        </span>
      </div>
      <h3 className="text-lg md:text-xl font-black text-white mb-2 leading-tight">
        {lang === "en"
          ? "📊 Free Guide: Top 10 Crypto Indicators That Work in 2026"
          : "📊 Guide gratuit : Top 10 indicateurs crypto qui fonctionnent en 2026"}
      </h3>
      <p className="text-xs md:text-sm text-gray-300 mb-4 leading-relaxed">
        {lang === "en"
          ? "Get our actionable PDF guide: 10 high-precision indicators, our backtests, and a ready-to-use 30-day plan. Sent instantly to your email."
          : "Reçois notre guide PDF actionnable : 10 indicateurs haute précision, nos backtests, et un plan 30 jours prêt à l'emploi. Envoyé instantanément par email."}
      </p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={lang === "en" ? "your@email.com" : "ton@email.com"}
            data-testid="lead-magnet-email-input"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-400/50 focus:bg-white/[0.08] transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={status === "submitting"}
          data-testid="lead-magnet-submit"
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-black hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {status === "submitting" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {lang === "en" ? "Sending..." : "Envoi..."}</>
          ) : (
            <>{lang === "en" ? "Get the guide" : "Recevoir le guide"} →</>
          )}
        </button>
      </form>
      {error && (
        <p className="text-xs text-red-400 mt-2" data-testid="lead-magnet-error">{error}</p>
      )}
      <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">
        {lang === "en"
          ? "No spam. Unsubscribe anytime. We respect your privacy."
          : "Pas de spam. Désinscription en 1 clic. Nous respectons ta vie privée."}
      </p>
    </div>
  );
}
