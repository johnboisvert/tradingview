import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import {
  Trophy, TrendingUp, TrendingDown, Target, Shield, BarChart3,
  ArrowLeft, RefreshCw, Clock, Filter, Trash2,
} from "lucide-react";

/* ─── Types ─── */

interface RangeCallRecord {
  id: number;
  symbol: string;
  side: "LONG" | "SHORT";
  entry_price: number;
  stop_loss: number;
  trailing_sl?: number | null;
  tp1: number;
  tp2: number;
  confidence: number;
  reason: string;
  rsi_m15: number | null;
  adx_m15: number | null;
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
  h1_trend: string;
  rr: number | null;
  status: string;
  tp1_hit: boolean;
  tp2_hit: boolean;
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

function getApiBase(): string {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3001";
  }
  return "";
}

/* ─── Stat Card ─── */

function StatCard({ icon, label, value, sub, color = "blue" }: { icon: React.ReactNode; label: string; value: string; sub?: string; color?: string }) {
  const gradients: Record<string, string> = {
    blue: "from-blue-400 to-indigo-400",
    green: "from-emerald-400 to-green-400",
    red: "from-red-400 to-rose-400",
    amber: "from-amber-400 to-orange-400",
    purple: "from-purple-400 to-violet-400",
  };
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 hover:bg-white/[0.05] transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradients[color] || gradients.blue} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

/* ─── Main Component ─── */

export default function RangePerformance() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [calls, setCalls] = useState<RangeCallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "resolved" | "expired">("all");

  const base = getApiBase();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, callsRes] = await Promise.all([
        fetch(`${base}/api/v1/range-calls/stats`),
        fetch(`${base}/api/v1/range-calls?limit=200`),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (callsRes.ok) setCalls(await callsRes.json());
    } catch (err) {
      console.error("[RangePerformance] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReset = async () => {
    if (!confirm("Réinitialiser toutes les données de performance range ?")) return;
    try {
      await fetch(`${base}/api/v1/range-calls/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      fetchData();
    } catch (err) {
      console.error("[RangePerformance] Reset error:", err);
    }
  };

  const handleResolve = async () => {
    try {
      await fetch(`${base}/api/v1/range-calls/resolve`, { method: "POST" });
      fetchData();
    } catch (err) {
      console.error("[RangePerformance] Resolve error:", err);
    }
  };

  const filteredCalls = calls.filter(c => filterStatus === "all" || c.status === filterStatus);

  return (
    <div className="flex min-h-screen bg-[#0A0E1A]">
      <Sidebar />
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/range" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-blue-400" />
                  Performance Range Trading
                </h1>
                <p className="text-sm text-gray-400">Suivi des signaux range — Bollinger Bands + RSI + ADX</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleResolve} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 hover:bg-blue-500/20 transition-all">
                <RefreshCw className="w-3 h-3" /> Résoudre
              </button>
              <button onClick={handleReset} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 hover:bg-red-500/20 transition-all">
                <Trash2 className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          )}

          {!loading && stats && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <StatCard icon={<BarChart3 className="w-4 h-4 text-white" />} label="Total Calls" value={String(stats.total_calls)} color="blue" />
                <StatCard icon={<Trophy className="w-4 h-4 text-white" />} label="Win Rate" value={`${stats.win_rate}%`} color="green" />
                <StatCard icon={<Target className="w-4 h-4 text-white" />} label="TP1 Rate" value={`${stats.tp1_rate}%`} color="purple" />
                <StatCard icon={<Target className="w-4 h-4 text-white" />} label="TP2 Rate" value={`${stats.tp2_rate}%`} color="blue" />
                <StatCard icon={<Shield className="w-4 h-4 text-white" />} label="SL Rate" value={`${stats.sl_rate}%`} color="red" />
                <StatCard icon={<TrendingUp className="w-4 h-4 text-white" />} label="Avg Profit" value={`${stats.avg_profit_pct}%`} color="amber" />
              </div>

              {/* Long vs Short */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">LONG Win Rate</div>
                  <div className="text-xl font-bold text-emerald-400">{stats.long_win_rate}%</div>
                  <div className="text-xs text-gray-500">{stats.long_total} trades</div>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">SHORT Win Rate</div>
                  <div className="text-xl font-bold text-red-400">{stats.short_win_rate}%</div>
                  <div className="text-xs text-gray-500">{stats.short_total} trades</div>
                </div>
              </div>

              {/* Weekly Win Rate */}
              {stats.weekly_win_rate.length > 0 && (
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">📅 Win Rate Hebdomadaire</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {stats.weekly_win_rate.slice(-12).map(w => (
                      <div key={w.week} className="bg-white/[0.03] rounded-lg p-2 text-center">
                        <div className="text-[10px] text-gray-500">{w.week}</div>
                        <div className={`text-sm font-bold ${w.win_rate >= 50 ? "text-emerald-400" : "text-red-400"}`}>{w.win_rate}%</div>
                        <div className="text-[9px] text-gray-500">{w.wins}/{w.total}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {(["all", "active", "resolved", "expired"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === f
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                {f === "all" ? "Tous" : f === "active" ? "Actifs" : f === "resolved" ? "Résolus" : "Expirés"}
              </button>
            ))}
          </div>

          {/* Call History */}
          <div className="space-y-2">
            {filteredCalls.map(call => {
              const isLong = call.side === "LONG";
              const isWin = call.tp1_hit;
              const statusColor = call.status === "active" ? "text-blue-400" : isWin ? "text-emerald-400" : "text-red-400";
              const statusBg = call.status === "active" ? "bg-blue-500/10 border-blue-500/20" : isWin ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20";

              return (
                <div key={call.id} className={`border rounded-xl p-3 ${statusBg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isLong ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {call.side}
                      </span>
                      <span className="font-semibold text-white text-sm">{call.symbol.replace("USDT", "")}</span>
                      <span className="text-xs text-gray-500">#{call.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {call.tp1_hit && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">TP1 ✓</span>}
                      {call.tp2_hit && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">TP2 ✓</span>}
                      {call.sl_hit && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">SL ✗</span>}
                      <span className={`text-xs font-semibold ${statusColor}`}>
                        {call.status === "active" ? "⏳ Actif" : call.status === "resolved" ? (isWin ? "✅ Gagné" : "❌ Perdu") : "⏰ Expiré"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>Entry: <span className="text-white">${formatPrice(call.entry_price)}</span></span>
                    <span>TP1: <span className="text-emerald-400">${formatPrice(call.tp1)}</span></span>
                    <span>TP2: <span className="text-blue-400">${formatPrice(call.tp2)}</span></span>
                    <span>SL: <span className="text-red-400">${formatPrice(call.stop_loss)}</span></span>
                    {call.profit_pct != null && (
                      <span className={call.profit_pct >= 0 ? "text-emerald-400" : "text-red-400"}>
                        P/L: {call.profit_pct >= 0 ? "+" : ""}{call.profit_pct}%
                      </span>
                    )}
                    <span className="ml-auto text-gray-500">{formatDate(call.created_at)}</span>
                  </div>
                </div>
              );
            })}

            {filteredCalls.length === 0 && !loading && (
              <div className="text-center py-10 text-gray-500">
                Aucun trade range enregistré.
              </div>
            )}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}