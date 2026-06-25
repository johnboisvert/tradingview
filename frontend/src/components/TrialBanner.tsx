// Small conversion banner shown on now-public SEO pages
// CTA: "Essai gratuit 7 jours" → /abonnements?utm_source=...
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

interface Props {
  source: string;
  className?: string;
}

export default function TrialBanner({ source, className = "" }: Props) {
  return (
    <div
      data-testid={`trial-banner-${source}`}
      className={`relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-purple-500/10 p-5 md:p-6 ${className}`}
    >
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-0.5">
              Essai gratuit 7 jours
            </div>
            <div className="text-white font-extrabold text-base md:text-lg leading-tight">
              Débloque tous les signaux IA, alertes et stratégies
            </div>
            <div className="text-gray-400 text-xs md:text-sm mt-0.5">
              Aucun engagement · Annulable en 1 clic · Sans CB requise pour l'essai
            </div>
          </div>
        </div>
        <Link
          to={`/abonnements?utm_source=${encodeURIComponent(source)}&utm_medium=banner&utm_campaign=free-trial`}
          data-testid={`trial-banner-cta-${source}`}
          className="ml-auto inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-extrabold hover:from-emerald-400 hover:to-cyan-400 transition-all shrink-0 shadow-lg shadow-emerald-500/20"
        >
          Démarrer l'essai
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
