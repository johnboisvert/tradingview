// Section Performance sur la page d'accueil — preuve sociale en direct
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Trophy, Activity, Target, ArrowRight } from "lucide-react";

interface Stats {
  total_calls: number;
  tp2_rate: number;
  resolved_calls?: number;
  expired_calls?: number;
  confidence_buckets?: Record<string, { win_rate: number; total: number }>;
}

export default function HomePerformance() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [scalpTotal, setScalpTotal] = useState(0);
  const [rangeTotal, setRangeTotal] = useState(0);

  useEffect(() => {
    fetch("/api/v1/trade-calls/stats?engine=v8")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
    fetch("/api/v1/scalp-calls/stats")
      .then((r) => r.json())
      .then((j) => setScalpTotal(j?.total_calls || 0))
      .catch(() => {});
    fetch("/api/v1/range-calls/stats")
      .then((r) => r.json())
      .then((j) => setRangeTotal(j?.total_calls || 0))
      .catch(() => {});
  }, []);

  const totalSignals = (stats?.total_calls || 0) + scalpTotal + rangeTotal;
  const noClosedYet = !!stats && ((stats.resolved_calls || 0) + (stats.expired_calls || 0)) === 0;

  const hc = stats?.confidence_buckets?.[">80%"];

  return (
    <section data-testid="home-performance-section" className="relative overflow-hidden bg-[#111827] border border-white/[0.06] rounded-2xl p-5 md:p-8">
      <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200">
            <ShieldCheck className="h-3 w-3" />
            Transparence totale
            <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-black text-cyan-300 normal-case tracking-normal">Moteurs v8</span>
            <span className="relative flex h-1.5 w-1.5 ml-1">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-400" />
            </span>
          </div>
          <h2 className="mt-3 text-2xl md:text-3xl font-black tracking-tight text-white">
            Nos signaux,{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
              résultats réels
            </span>
          </h2>
          <p className="mt-2 text-sm text-gray-400 max-w-xl">
            Chaque signal est tracké automatiquement par nos serveurs — winrate, TP atteints et pertes
            incluses. Aucune retouche possible.
          </p>
          {noClosedYet && (
            <p className="mt-2 text-xs text-cyan-300/70" data-testid="home-perf-v8-note">
              Compteurs remis à zéro le 20 juillet 2026 (nouveaux moteurs v8) — premiers trades en cours de suivi.
            </p>
          )}
          <Link
            to="/performance"
            data-testid="home-performance-cta"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 text-sm font-bold text-[#0a0e17] transition-transform duration-300 hover:-translate-y-0.5"
          >
            Voir toutes les stats en direct
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 lg:w-[420px]">
          {[
            { label: "Signaux trackés", value: stats ? `${totalSignals}` : "…", icon: Activity, accent: "text-cyan-300" },
            { label: "Winrate haute conf.", value: hc ? `${hc.win_rate}%` : "…", icon: Trophy, accent: "text-emerald-300" },
            { label: "TP2 atteint", value: stats ? `${stats.tp2_rate}%` : "…", icon: Target, accent: "text-teal-300" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
              <s.icon className={`mx-auto h-4 w-4 ${s.accent}`} />
              <div className="mt-2 text-xl md:text-2xl font-black text-white">{s.value}</div>
              <div className="mt-1 text-[10px] font-mono uppercase tracking-wider text-gray-500 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
