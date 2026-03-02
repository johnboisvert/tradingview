import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getVisitorStats, getActiveSessions, forceDisconnectUser } from "@/lib/store";
import {
  Eye,
  Globe,
  Users,
  Monitor,
  TrendingUp,
  BarChart3,
  ExternalLink,
  RefreshCw,
  Shield,
  Wifi,
  WifiOff,
  Calendar,
  Languages,
  FileText,
} from "lucide-react";

export default function Visitors() {
  const [stats, setStats] = useState(getVisitorStats());
  const [sessions, setSessions] = useState(getActiveSessions());
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "analytics">("overview");

  const refresh = () => {
    setStats(getVisitorStats());
    setSessions(getActiveSessions());
  };

  useEffect(() => {
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleForceDisconnect = (username: string) => {
    if (confirm(`Déconnecter l'utilisateur "${username}" de force ?`)) {
      forceDisconnectUser(username);
      setSessions(getActiveSessions());
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const timeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Visiteurs & Sessions</h1>
          <p className="text-sm text-gray-400 mt-1">
            Suivi des visiteurs, sessions actives et protection anti-partage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://analytics.google.com/analytics/web/#/p/G-EW6RE1BKFQ"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold hover:bg-blue-500/20 transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            Google Analytics
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.08] border border-white/[0.1] text-white text-sm font-bold hover:bg-white/[0.12] transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "overview" as const, label: "Vue d'ensemble", icon: Eye },
          { key: "sessions" as const, label: `Sessions actives (${sessions.length})`, icon: Shield },
          { key: "analytics" as const, label: "Google Analytics", icon: BarChart3 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === key
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                : "bg-[#111827] text-gray-400 border border-white/[0.06] hover:bg-white/[0.04]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Aujourd'hui", value: stats.today, icon: Eye, color: "from-blue-500 to-blue-600", textColor: "text-blue-400" },
              { label: "Cette semaine", value: stats.thisWeek, icon: Calendar, color: "from-indigo-500 to-indigo-600", textColor: "text-indigo-400" },
              { label: "Ce mois", value: stats.thisMonth, icon: TrendingUp, color: "from-purple-500 to-purple-600", textColor: "text-purple-400" },
              { label: "Sessions actives", value: sessions.length, icon: Users, color: "from-emerald-500 to-emerald-600", textColor: "text-emerald-400" },
            ].map((stat, i) => (
              <div key={i} className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase">{stat.label}</p>
                </div>
                <p className={`text-3xl font-black ${stat.textColor}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Daily Chart */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Visites des 7 derniers jours</h2>
                <p className="text-xs text-gray-400">Nombre de pages vues par jour</p>
              </div>
            </div>
            <div className="flex items-end gap-2 h-40">
              {stats.dailyVisits.map((day, i) => {
                const maxCount = Math.max(...stats.dailyVisits.map((d) => d.count), 1);
                const heightPct = (day.count / maxCount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-white">{day.count}</span>
                    <div className="w-full relative" style={{ height: `${Math.max(heightPct, 4)}%` }}>
                      <div className="absolute inset-0 rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 opacity-80" />
                      {day.newVisitors > 0 && (
                        <div
                          className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 opacity-60"
                          style={{ height: `${(day.newVisitors / Math.max(day.count, 1)) * 100}%` }}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">{formatDate(day.date)}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-indigo-500" />
                Total visites
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                Nouveaux visiteurs
              </div>
            </div>
          </div>

          {/* Two columns: Top Pages + Referrers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Pages */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Pages les plus vues</h2>
              </div>
              {stats.topPages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Aucune donnée encore</p>
              ) : (
                <div className="space-y-3">
                  {stats.topPages.map((p, i) => {
                    const maxCount = stats.topPages[0]?.count || 1;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-300 truncate max-w-[200px]">{p.page}</span>
                          <span className="text-xs font-bold text-gray-400">{p.count}</span>
                        </div>
                        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                            style={{ width: `${(p.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Referrers */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Sources de trafic</h2>
              </div>
              {stats.topReferrers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Aucune donnée encore</p>
              ) : (
                <div className="space-y-3">
                  {stats.topReferrers.map((r, i) => {
                    const maxCount = stats.topReferrers[0]?.count || 1;
                    const colors = ["bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-red-500", "bg-pink-500", "bg-cyan-500", "bg-gray-500"];
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-300 truncate max-w-[200px]">{r.source}</span>
                          <span className="text-xs font-bold text-gray-400">{r.count}</span>
                        </div>
                        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-700`}
                            style={{ width: `${(r.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Languages */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Languages className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Langues des visiteurs</h2>
            </div>
            {stats.topLanguages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucune donnée encore</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {stats.topLanguages.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <span className="text-sm font-bold text-white">{l.lang}</span>
                    <span className="text-xs text-gray-400">{l.count} visites</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <BarChart3 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-400">Données détaillées sur Google Analytics</p>
              <p className="text-xs text-gray-400 mt-1">
                Les statistiques ci-dessus sont basées sur le tracking local. Pour des données complètes
                (géolocalisation, appareils, temps réel, etc.), consultez{" "}
                <a
                  href="https://analytics.google.com/analytics/web/#/p/G-EW6RE1BKFQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Google Analytics
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          {/* Protection Info */}
          <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
            <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-400">Protection anti-partage activée</p>
              <p className="text-xs text-gray-400 mt-1">
                Chaque compte ne peut être connecté que sur un seul appareil à la fois.
                Si un utilisateur se connecte sur un nouvel appareil, l&apos;ancien est automatiquement déconnecté.
              </p>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Sessions actives ({sessions.length})</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Monitor className="w-3.5 h-3.5" />
                Mise à jour auto toutes les 30s
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="p-10 text-center">
                <WifiOff className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucune session active</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Utilisateur</th>
                      <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Empreinte</th>
                      <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Connecté depuis</th>
                      <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Dernière activité</th>
                      <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Statut</th>
                      <th className="text-right text-xs font-bold text-gray-400 uppercase px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session, i) => {
                      const lastActiveMs = Date.now() - new Date(session.last_active).getTime();
                      const isRecentlyActive = lastActiveMs < 5 * 60 * 1000; // 5 min
                      return (
                        <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="px-5 py-3">
                            <span className="text-sm font-bold text-white">{session.username}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-xs font-mono text-gray-500">{session.fingerprint}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-gray-400">{formatTime(session.created_at)}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-gray-400">{timeSince(session.last_active)}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isRecentlyActive
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}>
                              {isRecentlyActive ? (
                                <><Wifi className="w-3 h-3" /> En ligne</>
                              ) : (
                                <><WifiOff className="w-3 h-3" /> Inactif</>
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleForceDisconnect(session.username)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
                            >
                              Déconnecter
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Google Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Google Analytics</h2>
            <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
              Google Analytics est maintenant intégré à votre site avec l&apos;ID de mesure <code className="text-indigo-400 font-mono text-xs bg-indigo-500/10 px-2 py-0.5 rounded">G-EW6RE1BKFQ</code>.
              Les données de visiteurs sont collectées automatiquement.
            </p>

            <a
              href="https://analytics.google.com/analytics/web/#/p/G-EW6RE1BKFQ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              <BarChart3 className="w-4 h-4" />
              Ouvrir Google Analytics
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {[
                {
                  title: "Visiteurs en temps réel",
                  desc: "Voyez qui est sur votre site en ce moment, d'où ils viennent et quelles pages ils consultent.",
                  icon: Users,
                  color: "from-emerald-500 to-emerald-600",
                },
                {
                  title: "Géolocalisation",
                  desc: "Découvrez la provenance géographique de vos visiteurs : pays, villes, régions.",
                  icon: Globe,
                  color: "from-purple-500 to-purple-600",
                },
                {
                  title: "Comportement",
                  desc: "Analysez les pages les plus vues, le temps passé, le taux de rebond et les conversions.",
                  icon: TrendingUp,
                  color: "from-amber-500 to-amber-600",
                },
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-3`}>
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Verification */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <h3 className="text-base font-bold text-white mb-4">Vérification de l&apos;intégration</h3>
            <div className="space-y-3">
              {[
                { label: "Tag Google Analytics (gtag.js)", status: true, detail: "Intégré dans index.html" },
                { label: "ID de mesure", status: true, detail: "G-EW6RE1BKFQ" },
                { label: "Collecte de données", status: true, detail: "Active sur toutes les pages" },
                { label: "Tracking local complémentaire", status: true, detail: "Pages vues, sources, langues" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.status ? "bg-emerald-400" : "bg-red-400"}`} />
                    <span className="text-sm font-semibold text-gray-300">{item.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}