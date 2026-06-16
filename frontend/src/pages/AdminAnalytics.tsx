import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  BarChart3, MousePointerClick, Tag, Users, Mail, TrendingUp,
  CheckCircle, XCircle, Clock, Activity, RefreshCw, Award, Gift,
} from "lucide-react";

interface StatsResponse {
  range: string;
  total_events: number;
  counts: Record<string, number>;
  top_promos: { code: string; count: number }[];
  top_affiliates: { code: string; count: number }[];
  timeline: { day: string; count: number }[];
  recent: { ts: string; event: string; meta: Record<string, unknown> }[];
  conversions: {
    popup: { shown: number; cta: number; rate: number };
    onboarding: { started: number; completed: number; rate: number };
  };
}

const RANGES = [
  { key: "1d", label: "24h" },
  { key: "7d", label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "all", label: "Tout" },
] as const;

const EVENT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  popup_shown: { label: "Popup affichée", color: "text-amber-300", icon: "👁️" },
  popup_copy_code: { label: "Code copié", color: "text-cyan-300", icon: "📋" },
  popup_cta_click: { label: "Popup CTA cliqué", color: "text-emerald-300", icon: "🚀" },
  popup_dismiss: { label: "Popup fermée", color: "text-gray-400", icon: "❌" },
  promo_applied: { label: "Code promo appliqué", color: "text-amber-300", icon: "🎟️" },
  promo_invalid: { label: "Code promo invalide", color: "text-red-300", icon: "⚠️" },
  affiliate_generated: { label: "Code affilié généré", color: "text-emerald-300", icon: "🤝" },
  affiliate_link_copied: { label: "Lien affilié copié", color: "text-cyan-300", icon: "🔗" },
  onboarding_started: { label: "Onboarding démarré", color: "text-violet-300", icon: "🎯" },
  onboarding_completed: { label: "Onboarding terminé", color: "text-emerald-300", icon: "✅" },
  onboarding_skipped: { label: "Onboarding skippé", color: "text-gray-400", icon: "⏭️" },
  onboarding_cta_click: { label: "Onboarding CTA cliqué", color: "text-fuchsia-300", icon: "💎" },
  testimonial_cta_click: { label: "Témoignage CTA cliqué", color: "text-pink-300", icon: "⭐" },
  email_welcome_sent: { label: "Email welcome envoyé", color: "text-blue-300", icon: "📧" },
  email_welcome_failed: { label: "Email welcome échoué", color: "text-red-300", icon: "📮" },
  signup_started: { label: "Inscription démarrée", color: "text-cyan-300", icon: "📝" },
  signup_completed: { label: "Inscription terminée", color: "text-emerald-300", icon: "🎉" },
};

function KpiCard({ icon: Icon, label, value, sub, accent, glow }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  accent: string; glow: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.025] hover:border-white/[0.18] hover:bg-white/[0.04] transition-all hover:-translate-y-1 p-5 overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity"
        style={{ background: glow }} />
      <div className={`relative inline-flex w-11 h-11 rounded-xl bg-gradient-to-br ${accent} text-white items-center justify-center mb-3`}
        style={{ boxShadow: `0 8px 20px -6px ${glow}` }}>
        <Icon className="w-5 h-5" />
      </div>
      <div className={`relative text-2xl md:text-3xl font-black bg-gradient-to-r ${accent} bg-clip-text text-transparent`}>
        {value}
      </div>
      <p className="relative text-xs text-gray-400 mt-1 leading-tight">{label}</p>
      {sub && <p className="relative text-[10px] text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [range, setRange] = useState<typeof RANGES[number]["key"]>("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/analytics/stats?range=${range}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const counts = stats?.counts || {};
  const popupConv = stats?.conversions?.popup;
  const onbConv = stats?.conversions?.onboarding;

  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="relative rounded-3xl border border-white/[0.08] bg-[#0A0E1A]/80 backdrop-blur-xl mb-6 p-5 md:p-7 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/22 blur-3xl pointer-events-none"
            style={{ animation: "an-pulse 8s ease-in-out infinite" }} />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/22 blur-3xl pointer-events-none"
            style={{ animation: "an-pulse 10s ease-in-out infinite reverse" }} />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center text-white"
                style={{ boxShadow: "0 0 28px rgba(16,185,129,0.5)" }}>
                <BarChart3 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
                  Analytics Dashboard
                </h1>
                <p className="text-xs md:text-sm text-gray-400">Tracking événements · Conversions · Engagement</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                {RANGES.map((r) => (
                  <button
                    key={r.key}
                    data-testid={`analytics-range-${r.key}`}
                    onClick={() => setRange(r.key)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                      range === r.key
                        ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <button
                onClick={load}
                data-testid="analytics-refresh"
                className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all"
                aria-label="Rafraîchir"
              >
                <RefreshCw className={`w-4 h-4 text-gray-300 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div data-testid="analytics-error" className="mb-6 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300">
            Erreur de chargement : {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KpiCard
            icon={MousePointerClick}
            label="Popups Exit-Intent"
            value={counts.popup_shown || 0}
            sub={popupConv ? `${popupConv.rate}% conversion CTA` : undefined}
            accent="from-amber-400 to-orange-500"
            glow="rgba(245,158,11,0.4)"
          />
          <KpiCard
            icon={Tag}
            label="Codes promo appliqués"
            value={counts.promo_applied || 0}
            sub={counts.promo_invalid ? `${counts.promo_invalid} invalides` : "Tous valides"}
            accent="from-fuchsia-400 to-purple-500"
            glow="rgba(217,70,239,0.4)"
          />
          <KpiCard
            icon={Users}
            label="Codes affiliés générés"
            value={counts.affiliate_generated || 0}
            sub={counts.affiliate_link_copied ? `${counts.affiliate_link_copied} liens copiés` : undefined}
            accent="from-emerald-400 to-teal-500"
            glow="rgba(16,185,129,0.4)"
          />
          <KpiCard
            icon={Mail}
            label="Welcome emails"
            value={counts.email_welcome_sent || 0}
            sub={counts.email_welcome_failed ? `${counts.email_welcome_failed} échecs` : "100% succès"}
            accent="from-cyan-400 to-blue-500"
            glow="rgba(34,211,238,0.4)"
          />
        </div>

        {/* Conversion funnels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Popup conversion */}
          <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
            <h3 className="relative text-base font-black text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" /> Funnel Exit-Intent Popup
            </h3>
            <FunnelBar label="Affichée" value={popupConv?.shown || 0} pct={100} color="from-amber-400 to-orange-500" />
            <FunnelBar
              label="Code copié"
              value={counts.popup_copy_code || 0}
              pct={popupConv?.shown ? Math.round(((counts.popup_copy_code || 0) / popupConv.shown) * 100) : 0}
              color="from-cyan-400 to-blue-500"
            />
            <FunnelBar
              label="CTA cliqué (→ /abonnements)"
              value={popupConv?.cta || 0}
              pct={popupConv?.rate || 0}
              color="from-emerald-400 to-teal-500"
            />
          </div>

          {/* Onboarding conversion */}
          <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 overflow-hidden">
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
            <h3 className="relative text-base font-black text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-violet-400" /> Funnel Onboarding
            </h3>
            <FunnelBar label="Démarré" value={onbConv?.started || 0} pct={100} color="from-violet-400 to-fuchsia-500" />
            <FunnelBar
              label="Terminé (5/5 étapes)"
              value={onbConv?.completed || 0}
              pct={onbConv?.rate || 0}
              color="from-emerald-400 to-teal-500"
            />
            <FunnelBar
              label="Skippé (avant la fin)"
              value={counts.onboarding_skipped || 0}
              pct={onbConv?.started ? Math.round(((counts.onboarding_skipped || 0) / onbConv.started) * 100) : 0}
              color="from-gray-500 to-gray-600"
            />
          </div>
        </div>

        {/* Top promo codes + Top affiliates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <Leaderboard
            title="Top codes promo"
            icon={<Gift className="w-4 h-4 text-fuchsia-400" />}
            items={stats?.top_promos || []}
            emptyMsg="Aucun code promo utilisé sur cette période"
            color="from-fuchsia-400 to-purple-500"
            glow="rgba(217,70,239,0.4)"
          />
          <Leaderboard
            title="Top affiliés (codes générés)"
            icon={<Award className="w-4 h-4 text-emerald-400" />}
            items={stats?.top_affiliates || []}
            emptyMsg="Aucun affilié pour l'instant"
            color="from-emerald-400 to-teal-500"
            glow="rgba(16,185,129,0.4)"
          />
        </div>

        {/* Recent events stream */}
        <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 md:p-6 overflow-hidden">
          <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Événements récents
            <span className="text-[10px] font-bold text-gray-500 ml-2">
              {stats?.total_events || 0} événements total
            </span>
          </h3>
          <div className="max-h-[500px] overflow-y-auto pr-2 space-y-1.5">
            {!stats?.recent.length ? (
              <p className="text-center text-sm text-gray-500 py-12">Aucun événement enregistré</p>
            ) : (
              stats.recent.map((e, i) => {
                const meta = EVENT_LABELS[e.event] || { label: e.event, color: "text-gray-300", icon: "•" };
                const ts = new Date(e.ts);
                const time = ts.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                const date = ts.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
                return (
                  <div
                    key={i}
                    data-testid={`event-row-${i}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="text-base flex-shrink-0">{meta.icon}</span>
                    <span className={`text-xs font-bold ${meta.color} flex-shrink-0 w-44 truncate`} title={meta.label}>{meta.label}</span>
                    <span className="text-[10px] text-gray-500 flex-1 truncate font-mono">
                      {Object.keys(e.meta).length > 0 ? JSON.stringify(e.meta) : "—"}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-2.5 h-2.5" /> {date} · {time}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <style>{`
          @keyframes an-pulse {
            0%, 100% { transform: scale(1) translate(0,0); opacity: 0.55; }
            50% { transform: scale(1.18) translate(18px,-12px); opacity: 0.85; }
          }
        `}</style>
      </div>
    </AdminLayout>
  );
}

function FunnelBar({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-gray-300 font-semibold">{label}</span>
        <span className="text-white font-bold font-mono">
          {value} <span className="text-gray-500 font-normal">· {pct}%</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function Leaderboard({ title, icon, items, emptyMsg, color, glow }: {
  title: string;
  icon: React.ReactNode;
  items: { code: string; count: number }[];
  emptyMsg: string;
  color: string;
  glow: string;
}) {
  const max = items.length > 0 ? Math.max(...items.map((i) => i.count)) : 1;
  return (
    <div className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 overflow-hidden">
      <div className="absolute -top-24 right-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-30"
        style={{ background: glow }} />
      <h3 className="relative text-base font-black text-white mb-4 flex items-center gap-2">{icon} {title}</h3>
      <div className="relative space-y-2">
        {items.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">{emptyMsg}</p>
        ) : (
          items.map((it, i) => {
            const pct = (it.count / max) * 100;
            return (
              <div key={it.code} className="flex items-center gap-3 hover:bg-white/[0.03] rounded-lg px-2 py-1.5 transition-colors">
                <span className="w-6 text-[10px] font-black text-gray-500 font-mono text-right">#{i + 1}</span>
                <span className="w-28 text-xs font-bold text-white font-mono truncate" title={it.code}>{it.code}</span>
                <div className="flex-1 relative h-6 rounded-lg bg-white/[0.04] overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r ${color} transition-all duration-700`}
                    style={{ width: `${pct}%`, boxShadow: `0 0 8px ${glow}` }}
                  />
                </div>
                <span className="text-xs font-black font-mono text-white w-10 text-right">{it.count}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
