import { Link } from "react-router-dom";
import {
  Zap,
  Shield,
  Waves,
  Coins,
  GitBranch,
  Compass,
  Sparkles,
  Layers,
  Brain,
  Mountain,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ITEMS: { name: string; tagline: string; icon: LucideIcon; color: string }[] = [
  { name: "Magic JB IA", tagline: "Système complet : entrées, sorties, gestion auto", icon: Zap, color: "text-orange-300 border-orange-400/25 bg-orange-500/10" },
  { name: "RiskGlow", tagline: "Tendance et risque visuels en un coup d'œil", icon: Shield, color: "text-cyan-300 border-cyan-400/25 bg-cyan-500/10" },
  { name: "WaveRider", tagline: "Divergences prix / momentum avancées", icon: Waves, color: "text-sky-300 border-sky-400/25 bg-sky-500/10" },
  { name: "GoodGuys Spot Daily", tagline: "Investissement spot long terme avec DCA", icon: Coins, color: "text-amber-300 border-amber-400/25 bg-amber-500/10" },
  { name: "DivergX One", tagline: "Structure de marché et zones Premium/Discount", icon: GitBranch, color: "text-rose-300 border-rose-400/25 bg-rose-500/10" },
  { name: "Confluence Pro™", tagline: "Confluence modulaire — bâtissez votre stratégie", icon: Compass, color: "text-violet-300 border-violet-400/25 bg-violet-500/10" },
  { name: "Magic JB IA Cycles", tagline: "Cycles Bitcoin, Mayer Multiple, Pi Cycle Top", icon: Sparkles, color: "text-fuchsia-300 border-fuchsia-400/25 bg-fuchsia-500/10" },
  { name: "Magic JB S/R AI", tagline: "Supports / résistances automatiques multi-TF", icon: Layers, color: "text-emerald-300 border-emerald-400/25 bg-emerald-500/10" },
  { name: "Crypto IA Edge", tagline: "Le plus complet — gestion de trade intégrée", icon: Brain, color: "text-lime-300 border-lime-400/25 bg-lime-500/10" },
  { name: "Magic JB Bottom Top AI", tagline: "Cycles, sommets et creux — BTC & Altcoins", icon: Mountain, color: "text-teal-300 border-teal-400/25 bg-teal-500/10" },
];

export default function HomeIndicators() {
  return (
    <section data-testid="home-indicators-section" className="relative overflow-hidden bg-[#111827] border border-white/[0.06] rounded-2xl p-5 md:p-8">
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200">
              <Sparkles className="h-3 w-3" />
              Exclusif TradingView
            </div>
            <h2 className="mt-3 text-2xl md:text-3xl font-black tracking-tight text-white">
              Nos{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent">
                Indicateurs
              </span>
            </h2>
            <p className="mt-2 text-sm text-gray-400 max-w-xl">
              {ITEMS.length} indicateurs exclusifs pour le scalping, le day trading, le swing et
              l'investissement long terme.
            </p>
          </div>
          <Link
            to="/magic-strategy"
            data-testid="home-indicators-cta"
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-2.5 text-sm font-bold text-[#0a0e17] transition-transform duration-300 hover:-translate-y-0.5"
          >
            Découvrir
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ITEMS.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.name}
                to="/magic-strategy"
                data-testid={`home-indicator-${it.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className={`shrink-0 h-9 w-9 rounded-lg grid place-items-center border ${it.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white leading-snug">{it.name}</div>
                  <div className="mt-0.5 text-xs text-gray-500 leading-relaxed line-clamp-2">{it.tagline}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
