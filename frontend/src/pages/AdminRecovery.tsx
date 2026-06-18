// Admin Checkout Recovery Dashboard — visualize revenue saved from abandoned carts
import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  TrendingUp, DollarSign, Mail, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, RotateCcw, Send, Clock,
} from "lucide-react";

interface RecoveryEntry {
  session_id: string;
  email: string;
  plan: string;
  amount: number;
  expired_at: string;
  email_sent_at: string | null;
  recovered_at?: string;
  recovered_with_promo?: string | null;
  promo_code?: string;
  status: "pending_resend" | "sent" | "recovered" | "error";
  error?: string;
}
interface RecoveryData {
  ok: boolean;
  stats: {
    total: number;
    sent: number;
    recovered: number;
    pending: number;
    errors: number;
    total_amount_at_risk: number;
    total_amount_recovered: number;
    recovery_rate_pct: number;
  };
  recent: RecoveryEntry[];
}

const STATUS_META: Record<string, { label: string; color: string; icon: typeof Mail }> = {
  pending_resend: { label: "Pending", color: "bg-slate-500/15 text-slate-400 border-slate-500/30", icon: Clock },
  sent:           { label: "Sent",    color: "bg-blue-500/15 text-blue-300 border-blue-500/30",     icon: Send },
  recovered:      { label: "Recovered", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  error:          { label: "Error",   color: "bg-red-500/15 text-red-300 border-red-500/30",       icon: AlertCircle },
};

export default function AdminRecovery() {
  const [data, setData] = useState<RecoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch("/api/v1/admin/checkout-recovery");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(() => fetchData(true), 60_000);
    return () => clearInterval(i);
  }, [fetchData]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      </AdminLayout>
    );
  }

  const s = data?.stats;
  const netRecovered = s?.total_amount_recovered || 0;

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-recovery-page">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-red-950/40 p-6 sm:p-8">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-red-500/10 blur-3xl" />
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                <RotateCcw className="w-8 h-8 text-white" />
                <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/40 animate-pulse pointer-events-none" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-300/80 mb-1">Revenue Recovery</p>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Abandoned Carts</h1>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />Auto-refresh 60s</span>
                  <span className="text-slate-500">·</span>
                  <span>Emails sent automatically on Stripe expiration</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchData()}
              disabled={refreshing}
              data-testid="recovery-refresh-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* KPI GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Revenue Recovered"
            value={`$${netRecovered.toFixed(2)}`}
            sub="lifetime"
            icon={DollarSign}
            accent="emerald"
            hero
          />
          <KpiCard
            label="Recovery Rate"
            value={`${s?.recovery_rate_pct || 0}%`}
            sub={`${s?.recovered || 0} of ${s?.sent || 0} sent`}
            icon={TrendingUp}
            accent="cyan"
          />
          <KpiCard
            label="At Risk"
            value={`$${(s?.total_amount_at_risk || 0).toFixed(2)}`}
            sub="awaiting return"
            icon={AlertCircle}
            accent="amber"
          />
          <KpiCard
            label="Emails Sent"
            value={String(s?.sent || 0)}
            sub={`+${s?.recovered || 0} recovered`}
            icon={Mail}
            accent="blue"
          />
        </div>

        {/* RECENT ACTIVITY TABLE */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-sm font-black tracking-tight">Recent Activity</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {data?.recent.length || 0} {(data?.recent.length || 0) === 1 ? "entry" : "entries"}
            </span>
          </div>
          {!data?.recent.length ? (
            <div className="px-6 py-16 text-center">
              <Mail className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-300">No abandoned carts yet</p>
              <p className="text-xs text-slate-500 mt-1">Once Stripe sends checkout.session.expired events, recovery emails will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="recovery-table">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/[0.04]">
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Plan</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r) => {
                    const meta = STATUS_META[r.status] || STATUS_META.pending_resend;
                    const Icon = meta.icon;
                    return (
                      <tr key={r.session_id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-3 font-mono text-xs text-slate-300">{r.email}</td>
                        <td className="px-6 py-3 text-xs">
                          <span className="px-2 py-1 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[10px] font-bold uppercase tracking-wider">
                            {r.plan}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-mono font-bold text-white">${r.amount.toFixed(2)}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${meta.color} text-[10px] font-bold uppercase tracking-wider`}>
                            <Icon className="w-3 h-3" /> {meta.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-[11px] text-slate-400 font-mono">
                          {r.email_sent_at ? new Date(r.email_sent_at).toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" }) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* INFO PANEL */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              <p className="font-black text-amber-200 mb-1 text-sm">Comment ça marche ?</p>
              <p>Quand un client commence un checkout Stripe et l'abandonne, Stripe envoie automatiquement un event <code className="text-amber-300 font-mono">checkout.session.expired</code> après ~24h. CryptoIA capture cet event et envoie immédiatement un email Recovery avec le code promo <code className="text-amber-300 font-mono">LASTCHANCE20</code> (-20%). Si le client revient finaliser, on marque la session comme <span className="text-emerald-300 font-bold">Recovered</span> ✅.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function KpiCard({
  label, value, sub, icon: Icon, accent, hero,
}: {
  label: string; value: string; sub?: string; icon: typeof DollarSign;
  accent: "emerald" | "cyan" | "amber" | "blue"; hero?: boolean;
}) {
  const colors = {
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-300",
    cyan:    "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-300",
    amber:   "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-300",
    blue:    "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-300",
  }[accent];
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colors} p-5 ${hero ? "lg:col-span-1 ring-1 ring-emerald-500/20" : ""}`}>
      <Icon className="w-5 h-5 mb-3 opacity-80" />
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
      <p className={`font-black text-white ${hero ? "text-3xl" : "text-2xl"}`}>{value}</p>
      {sub && <p className="text-[10px] mt-1 opacity-60">{sub}</p>}
    </div>
  );
}
