import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import {
  Trophy, TrendingUp, TrendingDown, Target, Shield, BarChart3,
  ArrowLeft, RefreshCw, Clock, Zap, Filter, Trash2,
} from "lucide-react";

/* ─── Types ─── */

interface ScalpCallRecord {
  id: number;
  symbol: string;
  side: "LONG" | "SHORT";
  entry_price: number;
  stop_loss: number;
  trailing_sl?: number | null;
  tp1: number;
  tp2: number;
  tp3: number;
  confidence: number;
  reason: string;
  stoch_rsi_k: number | null;
  stoch_rsi_d: number | null;
  macd_signal: string;
  h1_trend: string;
  rr: number | null;
  status: string;
  tp1_hit: boolean;
  tp2_hit: boolean;
  tp3_hit: boolean;
  sl_hit: boolean;
  best_tp_reached: number;
  exit_price: number | null;
  profit_pct: number | null;
  created_at: string;
  resolved_at: string | null;
}

interface Stats {
  total_calls: number;
  active_calls: number;
  resolved_calls: number;
  expired_calls: number;
  win_rate: number;
  tp1_rate: number;
  tp2_rate: number;
  tp3_rate: number;
  sl_rate: number;
  avg_profit_pct: number;
  long_win_rate: number;
  short_win_rate: number;
  long_total: number;
  short_total: number;
  confidence_buckets: Record<string, { win_rate: number; total: number }>;
  weekly_win_rate: { week: string; wins: number; total: number; win_rate: number }[];
}

/* ─── Helpers ─── */

function formatPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(2);
  if (p >= 0.01) return p.toFixed(4);
  return p.toFixed(6);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/* ─── Stat Card ─── */

function StatCard({ icon, label, value, sub, color = "blue" }: { icon: React.ReactNode; label: string; value: string; sub?: string; color?: string }) {
  const gradients: Record<string, string> = {
    blue: "from-blue-400 to-purple-400",
    green: "from-emerald-400 to-green-400",
    red: "from-red-400 to-pink-400",
    amber: "from-amber-400 to-orange-400",
    purple: "from-purple-400 to-indigo-400",
  };
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-amber-500/30 hover:bg-white/[0.05] transition-all">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
      <p className={`text-xl font-black bg-gradient-to-r ${gradients[color] || gradients.blue} bg-clip-text text-transparent mt-1`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Win Rate Bar ─── */

function WinRateBar({ label, rate, color }: { label: string; rate: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-16 text-right">{label}</span>
      <div className="flex-1 h-3 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, rate)}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold text-gray-300 w-14">{rate}%</span>
    </div>
  );
}

/* ─── Component ─── */

export default function ScalpPerformance() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [calls, setCalls] = useState<ScalpCallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSide, setFilterSide] = useState<string>("all");

  const handleReset = async () => {
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir réinitialiser toutes les données de performance scalp ?\n\nCette action est irréversible."
    );
    if (!confirmed) return;
    setResetting(true);
    try {
      const res = await fetch("/api/v1/scalp-calls/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (res.ok) {
        setStats(null);
        setCalls([]);
        await fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Erreur lors de la réinitialisation : " + (err.error || "Erreur inconnue"));
      }
    } catch (e) {
      console.error("Reset error:", e);
      alert("Erreur réseau lors de la réinitialisation.");
    } finally {
      setResetting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, callsRes] = await Promise.all([
        fetch("/api/v1/scalp-calls/stats"),
        fetch("/api/v1/scalp-calls?limit=200"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (callsRes.ok) setCalls(await callsRes.json());
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCalls = calls.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterSide !== "all" && c.side !== filterSide) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
        {/* Header */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              to="/scalp"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-sm text-gray-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Retour au Scalp Trading
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent flex items-center gap-3">
                <Trophy className="w-7 h-7 text-amber-400" />
                Performance Scalp Trading
              </h1>
              <p className="text-sm text-gray-400 mt-1">Statistiques et historique des calls de scalping (Stoch RSI + MACD)</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Rafraîchir
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-sm font-semibold text-red-400 hover:text-red-300 transition-all disabled:opacity-50"
                title="Réinitialiser toutes les données de performance scalp"
              >
                <Trash2 className={`w-4 h-4 ${resetting ? "animate-pulse" : ""}`} /> {resetting ? "Reset..." : "Réinitialiser"}
              </button>
            </div>
          </div>

          {loading && !stats ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-3" />
              <p className="text-sm text-gray-500">Chargement des statistiques...</p>
            </div>
          ) : stats ? (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <StatCard icon={<BarChart3 className="w-6 h-6 text-blue-400" />} label="Total Calls" value={String(stats.total_calls)} sub="Enregistrés" color="blue" />
                <StatCard icon={<Zap className="w-6 h-6 text-amber-400" />} label="Actifs" value={String(stats.active_calls)} sub="En cours" color="amber" />
                <StatCard icon={<Target className="w-6 h-6 text-emerald-400" />} label="Résolus" value={String(stats.resolved_calls)} sub="Terminés" color="green" />
                <StatCard icon={<Trophy className="w-6 h-6 text-amber-400" />} label="Win Rate" value={`${stats.win_rate}%`} sub="TP1+ atteint" color="amber" />
                <StatCard icon={<TrendingUp className="w-6 h-6 text-emerald-400" />} label="Profit Moyen" value={`${stats.avg_profit_pct > 0 ? "+" : ""}${stats.avg_profit_pct}%`} sub="Par trade" color="green" />
                <StatCard icon={<Shield className="w-6 h-6 text-red-400" />} label="SL Rate" value={`${stats.sl_rate}%`} sub="Stop Loss touché" color="red" />
              </div>

              {/* TP Win Rates */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                  <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" /> Taux de Réussite par TP
                  </h3>
                  <div className="space-y-3">
                    <WinRateBar label="TP1" rate={stats.tp1_rate} color="#34d399" />
                    <WinRateBar label="TP2" rate={stats.tp2_rate} color="#22c55e" />
                    <WinRateBar label="TP3" rate={stats.tp3_rate} color="#16a34a" />
                    <WinRateBar label="SL" rate={stats.sl_rate} color="#ef4444" />
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                  <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" /> LONG vs SHORT
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> LONG
                        </span>
                        <span className="text-xs text-gray-400">{stats.long_total} calls</span>
                      </div>
                      <div className="h-4 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700"
                          style={{ width: `${Math.min(100, stats.long_win_rate)}%` }}
                        />
                      </div>
                      <p className="text-right text-xs font-bold text-emerald-400 mt-1">{stats.long_win_rate}%</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" /> SHORT
                        </span>
                        <span className="text-xs text-gray-400">{stats.short_total} calls</span>
                      </div>
                      <div className="h-4 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-500 to-pink-400 transition-all duration-700"
                          style={{ width: `${Math.min(100, stats.short_win_rate)}%` }}
                        />
                      </div>
                      <p className="text-right text-xs font-bold text-red-400 mt-1">{stats.short_win_rate}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confidence Buckets + Weekly */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                  <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                    🧠 Win Rate par Confiance
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(stats.confidence_buckets).map(([label, data]) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-16 text-right">{label}</span>
                        <div className="flex-1 h-3 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-700"
                            style={{ width: `${Math.min(100, data.win_rate)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-300 w-14">{data.win_rate}%</span>
                        <span className="text-[10px] text-gray-500 w-12">({data.total})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                  <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" /> Évolution du Win Rate (Hebdo)
                  </h3>
                  {stats.weekly_win_rate.length > 0 ? (
                    <div className="space-y-2">
                      {stats.weekly_win_rate.slice(-12).map((w) => (
                        <div key={w.week} className="flex items-center gap-3">
                          <span className="text-[10px] text-gray-500 w-20 font-mono">{w.week}</span>
                          <div className="flex-1 h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${Math.min(100, w.win_rate)}%`,
                                background: w.win_rate >= 60 ? "#22c55e" : w.win_rate >= 40 ? "#f59e0b" : "#ef4444",
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 w-10">{w.win_rate}%</span>
                          <span className="text-[9px] text-gray-600 w-8">{w.total}t</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-4">Pas encore de données hebdomadaires</p>
                  )}
                </div>
              </div>

              {/* History Table */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-bold">Historique des Calls Scalp</h2>
                    <span className="text-xs text-gray-500">({filteredCalls.length} résultats)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-2 py-1.5 rounded-lg bg-black/30 border border-white/[0.08] text-xs text-white"
                    >
                      <option value="all">Tous</option>
                      <option value="active">Actifs</option>
                      <option value="resolved">Résolus</option>
                      <option value="expired">Expirés</option>
                    </select>
                    <select
                      value={filterSide}
                      onChange={(e) => setFilterSide(e.target.value)}
                      className="px-2 py-1.5 rounded-lg bg-black/30 border border-white/[0.08] text-xs text-white"
                    >
                      <option value="all">Tous</option>
                      <option value="LONG">LONG</option>
                      <option value="SHORT">SHORT</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {["Date", "Symbole", "Type", "H1", "Stoch RSI", "Entry", "SL", "TP1", "TP2", "TP3", "Conf.", "Statut", "Profit"].map((h) => (
                          <th key={h} className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-semibold text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCalls.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="text-center py-12 text-gray-500">
                            Aucun call de scalping enregistré avec ces filtres
                          </td>
                        </tr>
                      ) : (
                        filteredCalls.slice(0, 50).map((call) => {
                          // Win = TP1 hit (trailing stop protects at breakeven)
                          const isWin = call.tp1_hit;
                          const isBreakeven = call.tp1_hit && call.sl_hit;
                          const statusColors: Record<string, string> = {
                            active: "bg-blue-500/15 text-blue-400 border-blue-500/20",
                            resolved: isWin ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-red-500/15 text-red-400 border-red-500/20",
                            expired: call.tp1_hit ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-gray-500/15 text-gray-400 border-gray-500/20",
                          };

                          let resultText = "—";
                          let resultColor = "text-gray-500";
                          if (call.status === "active") { resultText = "En cours"; resultColor = "text-blue-400"; }
                          else if (isBreakeven) { resultText = "BE (TP1→SL)"; resultColor = "text-amber-400"; }
                          else if (call.tp3_hit) { resultText = "TP3 ✓"; resultColor = "text-emerald-400"; }
                          else if (call.tp2_hit) { resultText = "TP2 ✓"; resultColor = "text-emerald-400"; }
                          else if (call.tp1_hit) { resultText = "TP1 ✓"; resultColor = "text-emerald-400"; }
                          else if (call.sl_hit) { resultText = "SL touché"; resultColor = "text-red-400"; }
                          else if (call.status === "expired") { resultText = "Expiré"; resultColor = "text-gray-500"; }

                          // Effective profit: if TP1 hit + SL hit → breakeven
                          const effectiveProfit = (call.tp1_hit && call.sl_hit && (call.profit_pct == null || call.profit_pct < 0)) ? 0 : call.profit_pct;

                          return (
                            <tr key={call.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                              <td className="px-3 py-3 text-[11px] font-mono text-gray-400">{formatDate(call.created_at)}</td>
                              <td className="px-3 py-3 font-bold text-sm">{call.symbol}</td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  call.side === "LONG"
                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                    : "bg-red-500/15 text-red-400 border border-red-500/20"
                                }`}>
                                  {call.side === "LONG" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {call.side}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-[10px] font-bold text-gray-400">
                                {call.h1_trend === "bullish" ? "🟢" : "🔴"} {call.h1_trend}
                              </td>
                              <td className="px-3 py-3 text-xs font-mono text-gray-400">
                                {call.stoch_rsi_k != null ? `K:${call.stoch_rsi_k}` : "—"}
                              </td>
                              <td className="px-3 py-3 font-mono text-xs text-blue-300">${formatPrice(call.entry_price)}</td>
                              <td className="px-3 py-3">
                                <div className="font-mono text-xs text-red-400">${formatPrice(call.stop_loss)}</div>
                                {call.trailing_sl != null && call.trailing_sl !== call.stop_loss && (
                                  <div className="font-mono text-[9px] text-amber-400 mt-0.5" title="Trailing Stop">
                                    ↳ TS: ${formatPrice(call.trailing_sl)}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-3 font-mono text-xs text-emerald-300">${formatPrice(call.tp1)}</td>
                              <td className="px-3 py-3 font-mono text-xs text-emerald-400">${formatPrice(call.tp2)}</td>
                              <td className="px-3 py-3 font-mono text-xs text-emerald-500">${formatPrice(call.tp3)}</td>
                              <td className="px-3 py-3">
                                <span className="text-xs font-bold text-gray-400">{call.confidence}%</span>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[call.status] || ""}`}>
                                  {call.status === "active" ? "Actif" : call.status === "resolved" ? "Résolu" : "Expiré"}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                {effectiveProfit != null ? (
                                  <span className={`text-xs font-bold ${effectiveProfit > 0 ? "text-emerald-400" : effectiveProfit === 0 ? "text-amber-400" : "text-red-400"}`}>
                                    {effectiveProfit > 0 ? "+" : effectiveProfit === 0 ? "±" : ""}{effectiveProfit}%
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-600">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <p>Erreur lors du chargement des statistiques</p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-6 bg-amber-500/[0.06] border border-amber-500/15 rounded-2xl p-4">
            <p className="text-xs text-amber-300/80 text-center">
              ⚠️ <strong>Avertissement :</strong> Les statistiques de performance sont basées sur les calls de scalping générés automatiquement.
              Les résultats passés ne garantissent pas les résultats futurs. Faites toujours votre propre analyse avant de trader.
            </p>
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}