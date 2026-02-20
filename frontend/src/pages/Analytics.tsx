import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  getRetention,
  getConversionFunnel,
  getRevenueIntelligence,
  type RetentionData,
  type ConversionFunnel,
  type RevenueIntelligence,
} from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertTriangle,
  AlertCircle,
  Clock,
  DollarSign,
  Globe,
  Trophy,
  RefreshCw,
  ArrowDown,
} from "lucide-react";
import Footer from "@/components/Footer";

const ANALYTICS_IMG = "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-17/d46e7b8e-f499-4be8-89df-34475265fd9a.png";

export default function AnalyticsPage() {
  const [retention, setRetention] = useState<RetentionData | null>(null);
  const [funnel, setFunnel] = useState<ConversionFunnel | null>(null);
  const [revenue, setRevenue] = useState<RevenueIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"funnel" | "retention" | "revenue">("funnel");

  const loadAll = () => {
    setLoading(true);
    Promise.all([getRetention(), getConversionFunnel(), getRevenueIntelligence()])
      .then(([ret, fun, rev]) => {
        setRetention(ret);
        setFunnel(fun);
        setRevenue(rev);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
        <img src={ANALYTICS_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/80 to-transparent" />
        <div className="relative z-10 h-full flex items-center justify-between px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">Analytics Suite</h1>
            <p className="text-sm text-gray-400">Revenue Intelligence • Retention • Conversion Funnel</p>
          </div>
          <button
            onClick={loadAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.08] border border-white/[0.1] text-white text-sm font-bold hover:bg-white/[0.12] transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "funnel" as const, label: "Conversion Funnel", icon: TrendingUp },
          { key: "retention" as const, label: "Retention", icon: Users },
          { key: "revenue" as const, label: "Revenue Intelligence", icon: DollarSign },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeSection === key
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                : "bg-[#111827] text-gray-400 border border-white/[0.06] hover:bg-white/[0.04]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Conversion Funnel */}
      {activeSection === "funnel" && funnel && (
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Conversion Funnel</h2>
              <p className="text-xs text-gray-400">Parcours utilisateur de la visite à la fidélisation</p>
            </div>
          </div>

          <div className="space-y-3">
            {funnel.steps.map((step, i) => {
              const maxCount = funnel.steps[0].count;
              const widthPct = (step.count / maxCount) * 100;
              const colors = [
                "from-blue-500 to-blue-600",
                "from-indigo-500 to-indigo-600",
                "from-purple-500 to-purple-600",
                "from-amber-500 to-amber-600",
                "from-emerald-500 to-emerald-600",
              ];
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-gray-200">{step.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-white">{step.count.toLocaleString()}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        i === 0 ? "bg-blue-500/10 text-blue-400" : "bg-white/[0.04] text-gray-400"
                      }`}>
                        {step.rate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-8 bg-white/[0.03] rounded-xl overflow-hidden">
                    <div
                      className={`h-full rounded-xl bg-gradient-to-r ${colors[i % colors.length]} flex items-center justify-end pr-3 transition-all duration-700`}
                      style={{ width: `${widthPct}%`, minWidth: "40px" }}
                    >
                      {i > 0 && (
                        <div className="flex items-center gap-0.5 text-white/80">
                          <ArrowDown className="w-3 h-3" />
                          <span className="text-[10px] font-bold">
                            {((1 - step.count / funnel.steps[i - 1].count) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Retention Dashboard */}
      {activeSection === "retention" && retention && (
        <div className="space-y-4">
          {/* Zone Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Zone Rouge", count: retention.red_zone.length, desc: "< 7 jours", color: "from-red-500 to-red-600", icon: AlertTriangle, textColor: "text-red-400" },
              { label: "Zone Orange", count: retention.orange_zone.length, desc: "7-30 jours", color: "from-amber-500 to-amber-600", icon: AlertCircle, textColor: "text-amber-400" },
              { label: "Zone Jaune", count: retention.yellow_zone.length, desc: "30-60 jours", color: "from-yellow-500 to-yellow-600", icon: Clock, textColor: "text-yellow-400" },
            ].map((zone, i) => (
              <div key={i} className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${zone.color} flex items-center justify-center`}>
                    <zone.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">{zone.label}</p>
                    <p className="text-xs text-gray-500">{zone.desc}</p>
                  </div>
                </div>
                <p className={`text-3xl font-black ${zone.textColor}`}>{zone.count}</p>
              </div>
            ))}
          </div>

          {/* Users at risk table */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.06]">
              <h2 className="text-base font-bold text-white">Utilisateurs à risque</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Utilisateur</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Plan</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Jours restants</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Expiration</th>
                    <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Zone</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...retention.red_zone.map((u) => ({ ...u, zone: "Rouge", zoneColor: "bg-red-500/10 text-red-400" })),
                    ...retention.orange_zone.map((u) => ({ ...u, zone: "Orange", zoneColor: "bg-amber-500/10 text-amber-400" })),
                    ...retention.yellow_zone.map((u) => ({ ...u, zone: "Jaune", zoneColor: "bg-yellow-500/10 text-yellow-400" })),
                  ].map((u, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-sm font-bold text-white">{u.username}</td>
                      <td className="px-5 py-3 text-sm text-gray-400">{u.plan}</td>
                      <td className="px-5 py-3 text-sm font-bold text-white">{(u as Record<string, unknown>).days_until_expiry as number}</td>
                      <td className="px-5 py-3 text-sm text-gray-400">{(u as Record<string, unknown>).expiry_date as string}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.zoneColor}`}>{u.zone}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Intelligence */}
      {activeSection === "revenue" && revenue && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Total Referrals</p>
              <p className="text-3xl font-black text-white">{revenue.stats.total_referrals}</p>
            </div>
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Paid Referrals</p>
              <p className="text-3xl font-black text-emerald-400">{revenue.stats.paid_referrals}</p>
            </div>
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Revenue Généré</p>
              <p className="text-3xl font-black text-amber-400">{revenue.stats.revenue_generated}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Leaderboard */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/[0.06] flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Leaderboard</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">#</th>
                      <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Utilisateur</th>
                      <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Refs</th>
                      <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Paid</th>
                      <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.leaderboard.map((r, i) => (
                      <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="px-5 py-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                            i === 0 ? "bg-amber-500/20 text-amber-400" : i === 1 ? "bg-gray-400/20 text-gray-300" : i === 2 ? "bg-amber-700/20 text-amber-600" : "bg-white/[0.04] text-gray-500"
                          }`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm font-bold text-white">{r.username}</td>
                        <td className="px-5 py-3 text-sm text-gray-400">{r.referrals}</td>
                        <td className="px-5 py-3 text-sm text-emerald-400 font-bold">{r.paid}</td>
                        <td className="px-5 py-3 text-sm text-amber-400 font-bold">${r.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Traffic Sources */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <Globe className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Sources de Trafic</h2>
              </div>
              <div className="space-y-3">
                {revenue.sources.map((s, i) => {
                  const maxCount = Math.max(...revenue.sources.map((x) => x.count));
                  const colors = ["bg-blue-500", "bg-indigo-500", "bg-red-500", "bg-emerald-500", "bg-gray-500"];
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-300">{s.name}</span>
                        <span className="text-xs font-bold text-gray-400">{s.count.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-700`}
                          style={{ width: `${(s.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase">Résumé</span>
                </div>
                <p className="text-sm text-gray-300">
                  <span className="font-bold text-white">{revenue.sources.reduce((s, x) => s + x.count, 0).toLocaleString()}</span> visites totales depuis{" "}
                  <span className="font-bold text-white">{revenue.sources.length}</span> sources.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}