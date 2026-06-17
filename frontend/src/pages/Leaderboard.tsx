import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { Trophy, Crown, Medal, Award, TrendingUp, RefreshCw, Sparkles, Users } from "lucide-react";
import { fetchLeaderboard, fetchStats, type LeaderboardRow, type UserStats } from "@/lib/gamification";

export default function Leaderboard() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage?.startsWith("en") ? "en" : "fr";
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [me, setMe] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [lb, st] = await Promise.all([fetchLeaderboard(100), fetchStats()]);
    setRows(lb);
    setMe(st);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const myRank = useMemo(() => {
    if (!me) return null;
    const myXp = me.xp;
    const better = rows.filter((r) => r.xp > myXp).length;
    return better + 1;
  }, [rows, me]);

  const heroSteps = [
    { n: "1", title: lang === "en" ? "Earn XP" : "Gagne de l'XP", desc: lang === "en" ? "Use the platform daily, set alerts, run backtests, refer friends." : "Utilise la plateforme tous les jours, crée des alertes, fais des backtests, parraine." },
    { n: "2", title: lang === "en" ? "Unlock badges" : "Débloque des badges", desc: lang === "en" ? "20+ badges from common to legendary — automatic detection." : "20+ badges du commun au légendaire — détection automatique." },
    { n: "3", title: lang === "en" ? "Climb the ranks" : "Grimpe au classement", desc: lang === "en" ? "Top 3 displayed as podium with crown / medals. Top 100 listed." : "Top 3 affiché en podium couronne / médailles. Top 100 listé." },
  ];

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] p-4 md:p-7 pt-[72px] md:pt-7 max-w-7xl mx-auto">
        <PageHeader
          icon={<Trophy className="w-6 h-6" />}
          title={lang === "en" ? "Leaderboard" : "Classement"}
          subtitle={lang === "en" ? "Public ranking of CryptoIA top users by XP. Refreshed live." : "Classement public des meilleurs utilisateurs CryptoIA par XP. Mis à jour en direct."}
          accentColor="amber"
          steps={heroSteps}
        />

        {/* Personal banner */}
        {me && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30 flex items-center justify-between gap-4 flex-wrap" data-testid="leaderboard-my-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-black text-white">
                {(me.displayName || "?").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{me.displayName}</div>
                <div className="text-xs text-gray-400">
                  {lang === "en" ? "Level" : "Niveau"} <span className="text-indigo-300 font-bold">{me.level}</span> · {me.badges?.length || 0} {lang === "en" ? "badges" : "badges"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">XP</div>
                <div className="text-lg font-black text-indigo-300 font-mono">{me.xp.toLocaleString()}</div>
              </div>
              {myRank && (
                <div className="text-right">
                  <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">{lang === "en" ? "Rank" : "Rang"}</div>
                  <div className="text-lg font-black text-amber-300 font-mono">#{myRank}</div>
                </div>
              )}
              <button onClick={load} disabled={loading} className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all disabled:opacity-50" data-testid="leaderboard-refresh-btn">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && rows.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">{lang === "en" ? "No participants yet. Be the first!" : "Aucun participant pour l'instant. Sois le premier !"}</p>
          </div>
        )}

        {/* Podium top 3 */}
        {podium.length > 0 && (
          <div className="mb-8 grid grid-cols-3 gap-3 md:gap-6 items-end" data-testid="leaderboard-podium">
            {/* Order: 2nd, 1st, 3rd for visual podium */}
            {[1, 0, 2].map((idx) => {
              const r = podium[idx];
              if (!r) return <div key={idx} />;
              const place = idx + 1;
              const isFirst = place === 1;
              const heights = { 1: "h-44 md:h-56", 2: "h-36 md:h-44", 3: "h-32 md:h-40" } as const;
              const colors = { 1: "from-amber-400 to-orange-500", 2: "from-slate-300 to-slate-500", 3: "from-orange-600 to-amber-700" } as const;
              const Icon = place === 1 ? Crown : place === 2 ? Medal : Award;
              return (
                <div key={r.anonKey + idx} className="flex flex-col items-center" data-testid={`leaderboard-podium-${place}`}>
                  {isFirst && <Sparkles className="w-5 h-5 text-amber-300 animate-pulse mb-1" />}
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${colors[place as 1|2|3]} flex items-center justify-center text-base md:text-lg font-black text-white mb-2 shadow-lg`}
                       style={{ boxShadow: `0 12px 30px -8px ${place === 1 ? "rgba(245,158,11,0.5)" : place === 2 ? "rgba(148,163,184,0.4)" : "rgba(234,88,12,0.4)"}` }}>
                    {(r.displayName || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-xs md:text-sm font-black text-white text-center truncate max-w-[100%] px-1">{r.displayName}</div>
                  <div className="text-[10px] md:text-xs text-gray-400">Lvl {r.level} · {r.badges} 🏆</div>
                  <div className={`mt-2 w-full ${heights[place as 1|2|3]} rounded-t-2xl bg-gradient-to-t ${colors[place as 1|2|3]} flex flex-col items-center justify-end p-2 md:p-3`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white/90 mb-1" />
                    <div className="text-white font-mono text-sm md:text-base font-black">{r.xp.toLocaleString()} XP</div>
                    <div className="text-white/70 text-[10px] md:text-xs">#{place}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rest list */}
        {rest.length > 0 && (
          <div className="rounded-3xl bg-white/[0.02] border border-white/[0.06] overflow-hidden" data-testid="leaderboard-rest-list">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="text-left py-3 px-4 font-bold w-10">#</th>
                  <th className="text-left py-3 px-4 font-bold">{lang === "en" ? "User" : "Utilisateur"}</th>
                  <th className="text-right py-3 px-4 font-bold">{lang === "en" ? "Level" : "Niveau"}</th>
                  <th className="text-right py-3 px-4 font-bold hidden sm:table-cell">🏆</th>
                  <th className="text-right py-3 px-4 font-bold">XP</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((r, i) => (
                  <tr key={r.anonKey + i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors" data-testid={`leaderboard-row-${i+4}`}>
                    <td className="py-3 px-4 font-mono text-gray-500 font-bold">{i + 4}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/[0.08] flex items-center justify-center text-[10px] font-black text-white">
                          {(r.displayName || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-white font-semibold truncate">{r.displayName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-bold">Lvl {r.level}</span>
                    </td>
                    <td className="py-3 px-4 text-right hidden sm:table-cell text-amber-300 text-xs font-mono">{r.badges}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-300 font-bold">{r.xp.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
}
