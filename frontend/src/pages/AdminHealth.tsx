// Admin Health Dashboard — real-time observability cockpit
import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Zap, Mail, CreditCard, Send, Shield, Bell, Search,
  Cpu, HardDrive, Clock, GitCommit, Loader2,
} from "lucide-react";

type SvcStatus = "healthy" | "degraded" | "down" | "not_configured";
interface ServiceCheck {
  ok: boolean;
  status: SvcStatus;
  latency: number;
  message: string;
}
interface HealthData {
  ok: boolean;
  overall: "healthy" | "degraded" | "down";
  timestamp: string;
  total_check_ms: number;
  services: {
    stripe: ServiceCheck; resend: ServiceCheck; coingecko: ServiceCheck;
    telegram: ServiceCheck; sentry: ServiceCheck; push: ServiceCheck;
    indexnow: ServiceCheck;
  };
  system: {
    uptime_sec: number;
    memory: { heap_used_mb: number; heap_total_mb: number; rss_mb: number };
    data_size_kb: number;
    node_version: string;
    env: string;
    release: string;
  };
}

const SERVICE_META: Record<string, { icon: typeof Activity; label: string; color: string }> = {
  stripe:    { icon: CreditCard, label: "Stripe",       color: "from-violet-500 to-purple-600" },
  resend:    { icon: Mail,       label: "Resend",       color: "from-blue-500 to-cyan-600" },
  coingecko: { icon: Search,     label: "CoinGecko",    color: "from-amber-500 to-orange-600" },
  telegram:  { icon: Send,       label: "Telegram",     color: "from-sky-500 to-blue-600" },
  sentry:    { icon: Shield,     label: "Sentry",       color: "from-rose-500 to-red-600" },
  push:      { icon: Bell,       label: "Web Push",     color: "from-emerald-500 to-teal-600" },
  indexnow:  { icon: Zap,        label: "IndexNow SEO", color: "from-yellow-500 to-amber-600" },
};

function StatusPill({ status }: { status: SvcStatus }) {
  const map = {
    healthy:        { color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", label: "Healthy",        dot: "bg-emerald-400" },
    degraded:       { color: "bg-amber-500/15 text-amber-300 border-amber-500/30",       label: "Degraded",       dot: "bg-amber-400" },
    down:           { color: "bg-red-500/15 text-red-300 border-red-500/30",             label: "Down",           dot: "bg-red-400" },
    not_configured: { color: "bg-slate-500/15 text-slate-400 border-slate-500/30",       label: "Not Configured", dot: "bg-slate-500" },
  }[status];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${map.color} text-[10px] font-bold uppercase tracking-wider`}>
      <span className={`w-1.5 h-1.5 rounded-full ${map.dot} ${status === "healthy" ? "animate-pulse" : ""}`} />
      {map.label}
    </div>
  );
}

function ServiceCard({ keyName, check }: { keyName: string; check: ServiceCheck }) {
  const meta = SERVICE_META[keyName];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <div
      data-testid={`health-svc-${keyName}`}
      className="group relative overflow-hidden bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.14] transition-all"
    >
      <div className={`absolute -inset-x-12 -top-12 h-32 bg-gradient-to-r ${meta.color} opacity-[0.08] blur-3xl group-hover:opacity-[0.18] transition-opacity`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-lg shadow-black/40`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <StatusPill status={check.status} />
        </div>
        <h3 className="text-base font-black text-white mb-1">{meta.label}</h3>
        <p className="text-[11px] text-slate-400 mb-3 leading-relaxed line-clamp-2 min-h-[28px]">{check.message}</p>
        {check.latency > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <Clock className="w-3 h-3 text-slate-500" />
            <span className={check.latency < 200 ? "text-emerald-400" : check.latency < 1000 ? "text-amber-400" : "text-red-400"}>
              {check.latency}ms
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatUptime(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  return `${Math.floor(sec / 86400)}d ${Math.floor((sec % 86400) / 3600)}h`;
}

export default function AdminHealth() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchHealth = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch("/api/v1/admin/health");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: HealthData = await res.json();
      setData(json);
      setLastFetch(new Date());
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(true), 60_000); // auto-refresh every 60s
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      </AdminLayout>
    );
  }

  const overallColor = data?.overall === "healthy" ? "emerald" : data?.overall === "degraded" ? "amber" : "red";
  const overallIcon = data?.overall === "healthy" ? CheckCircle2 : data?.overall === "degraded" ? AlertTriangle : XCircle;
  const OverallIcon = overallIcon;

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-health-page">
        {/* HERO Overall Status */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-slate-900/80 via-indigo-950/60 to-slate-900/80 p-8">
          <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full bg-${overallColor}-500/10 blur-3xl`} />
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <div className={`relative w-16 h-16 rounded-2xl bg-${overallColor}-500/20 border-2 border-${overallColor}-500/40 flex items-center justify-center`}>
                <OverallIcon className={`w-8 h-8 text-${overallColor}-300`} />
                {data?.overall === "healthy" && (
                  <div className={`absolute inset-0 rounded-2xl border-2 border-${overallColor}-400/60 animate-ping`} />
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">System Status</p>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                  {data?.overall === "healthy" ? "All Systems Operational" : data?.overall === "degraded" ? "Partial Degradation" : "Outage Detected"}
                </h1>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full bg-${overallColor}-400 animate-pulse`} />
                    Live · refreshes every 60s
                  </span>
                  {lastFetch && (
                    <span className="text-slate-500">
                      Last check: {lastFetch.toLocaleTimeString("fr-CA")}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchHealth()}
              disabled={refreshing}
              data-testid="health-refresh-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh Now"}
            </button>
          </div>
          {error && (
            <div className="relative mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* SERVICES GRID */}
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1">
            Third-Party Services ({data ? Object.keys(data.services).length : 0})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data && Object.entries(data.services).map(([key, check]) => (
              <ServiceCard key={key} keyName={key} check={check} />
            ))}
          </div>
        </div>

        {/* SYSTEM METRICS */}
        {data && (
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1">
              Runtime Metrics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <MetricCard icon={Clock} label="Uptime" value={formatUptime(data.system.uptime_sec)} accent="emerald" />
              <MetricCard icon={Cpu} label="Heap Memory" value={`${data.system.memory.heap_used_mb} / ${data.system.memory.heap_total_mb} MB`} accent="violet" />
              <MetricCard icon={Activity} label="RSS Memory" value={`${data.system.memory.rss_mb} MB`} accent="cyan" />
              <MetricCard icon={HardDrive} label="Data Volume" value={data.system.data_size_kb > 1024 ? `${(data.system.data_size_kb / 1024).toFixed(1)} MB` : `${data.system.data_size_kb} KB`} accent="amber" />
              <MetricCard icon={GitCommit} label="Release" value={data.system.release} mono accent="rose" />
            </div>
            <div className="mt-3 flex items-center gap-3 px-1 text-[10px] text-slate-500 font-mono">
              <span>Node {data.system.node_version}</span>
              <span>·</span>
              <span>env: {data.system.env}</span>
              <span>·</span>
              <span>Check duration: {data.total_check_ms}ms</span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function MetricCard({
  icon: Icon, label, value, mono, accent,
}: {
  icon: typeof Activity; label: string; value: string; mono?: boolean;
  accent: "emerald" | "violet" | "cyan" | "amber" | "rose";
}) {
  const colors = {
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-300",
    violet: "from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-300",
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-300",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-300",
    rose: "from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-300",
  }[accent];
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${colors} p-4`}>
      <Icon className="w-4 h-4 mb-2 opacity-70" />
      <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mb-1">{label}</p>
      <p className={`text-base font-black text-white ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
