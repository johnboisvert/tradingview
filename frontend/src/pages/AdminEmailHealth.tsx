import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, Mail, MailOpen, MousePointerClick, ShieldAlert, Globe } from "lucide-react";

const ADMIN_AUTH_KEY = "admin_api_key";
function getAdminAuth() { return localStorage.getItem(ADMIN_AUTH_KEY) || "admin123"; }
async function api<T = unknown>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { "x-admin-auth": getAdminAuth() } });
  return res.json();
}

type Overall = { total: number; delivered: number; opened: number; clicked: number; bounced: number; complained: number; delivered_rate: number; open_rate: number; click_rate: number; bounce_rate: number; spam_rate: number; score: number | null };
type PerDomain = { domain: string; total: number; delivered_rate: number; open_rate: number; bounce_rate: number; spam_rate: number };
type Alert = { level: "critical" | "warning"; msg: string };
type Health = { ok: boolean; window_days: number; overall: Overall; per_domain: PerDomain[]; per_domain_truncated?: boolean; alerts: Alert[]; health_label: string };
type Incident = { ts: string; type: string; recipient: string; subject?: string | null; category?: string | null };

export default function AdminEmailHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [healthError, setHealthError] = useState<string>("");
  const [incidentsError, setIncidentsError] = useState<string>("");

  const refresh = async (d: number) => {
    setLoading(true);
    setHealthError("");
    setIncidentsError("");
    // Independent fetches so a failure on one doesn't hide the other
    // (resilience flagged by testing agent iteration_3 code review).
    const hPromise = api<Health>(`/api/v1/admin/email-health?days=${d}`).then(
      (h) => { if (h?.ok) setHealth(h); else setHealthError("Réponse inattendue"); },
      (e) => setHealthError(String(e)),
    );
    const iPromise = api<{ ok: boolean; incidents: Incident[] }>("/api/v1/admin/email-health/recent?limit=30").then(
      (inc) => { if (inc?.ok) setIncidents(inc.incidents || []); else setIncidentsError("Réponse inattendue"); },
      (e) => setIncidentsError(String(e)),
    );
    await Promise.allSettled([hPromise, iPromise]);
    setLoading(false);
  };

  useEffect(() => { refresh(days); }, [days]);

  const scoreColor = (score: number) =>
    score >= 80 ? "from-emerald-500 to-green-500"
    : score >= 60 ? "from-blue-500 to-cyan-500"
    : score >= 40 ? "from-amber-500 to-yellow-500"
    : score >= 20 ? "from-orange-500 to-red-500"
    : "from-red-600 to-rose-600";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2"><Activity className="w-6 h-6 text-cyan-400" /> Email Health</h1>
            <p className="text-sm text-gray-400 mt-1">Réputation deliverability et signaux d&apos;alerte pour anticiper les blocages Gmail/Outlook.</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} data-testid="window-select" className="px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-sm">
              <option value={7}>7 jours</option>
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
              <option value={365}>1 an</option>
            </select>
            <button onClick={() => refresh(days)} disabled={loading} data-testid="refresh-health-btn" className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-sm font-bold flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Actualiser
            </button>
          </div>
        </div>

        {/* Errors */}
        {healthError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300" data-testid="health-error">
            ⚠️ Erreur chargement <code className="px-1 py-0.5 rounded bg-black/40">/email-health</code> : {healthError}
          </div>
        )}
        {incidentsError && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200" data-testid="incidents-error">
            ⚠️ Erreur chargement <code className="px-1 py-0.5 rounded bg-black/40">/email-health/recent</code> : {incidentsError}
          </div>
        )}

        {/* No-data state: surface BOTH when API failed AND when API returned ok:true but no events yet */}
        {!loading && (!health || health.overall.total === 0) && !healthError && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200" data-testid="no-data-warning">
            ⚠️ Pas encore de données. Vérifie que le webhook Resend est bien configuré (Dashboard Resend → Webhooks → <code className="px-1 py-0.5 rounded bg-black/40">/api/v1/webhooks/resend</code>). Les premières métriques apparaîtront dès que tes emails commenceront à être livrés et ouverts.
          </div>
        )}

        {health && health.overall.total > 0 && (
          <>
            {/* Health Score Hero */}
            <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6" data-testid="health-score-card">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">Score Santé Globale</p>
                  <div className="flex items-baseline gap-3">
                    <span className={`text-6xl font-black bg-gradient-to-br ${scoreColor(health.overall.score ?? 0)} bg-clip-text text-transparent`} data-testid="health-score">
                      {health.overall.score ?? "—"}
                    </span>
                    <span className="text-2xl text-gray-500">/ 100</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-2" data-testid="health-label">
                    {health.health_label} · {health.overall.total} emails analysés sur {health.window_days} jours
                  </p>
                </div>
                <div className="flex-1 max-w-md w-full">
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${scoreColor(health.overall.score ?? 0)} rounded-full transition-all`} style={{ width: `${health.overall.score ?? 0}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 mt-2">
                    <span>Critique</span><span>Faible</span><span>Moyen</span><span>Bon</span><span>Excellent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {health.alerts.length > 0 && (
              <div className="space-y-2" data-testid="alerts-list">
                {health.alerts.map((a, i) => (
                  <div key={i} className={`rounded-xl border p-3 flex items-start gap-2 text-sm ${a.level === "critical" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`} data-testid={`alert-${i}`}>
                    {a.level === "critical" ? <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    <span>{a.msg}</span>
                  </div>
                ))}
              </div>
            )}
            {health.alerts.length === 0 && health.overall.total > 0 && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-start gap-2 text-sm text-emerald-200" data-testid="no-alerts">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> Aucune alerte détectée — réputation saine.
              </div>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Kpi icon={<Mail className="w-4 h-4 text-cyan-400" />} label="Envoyés" value={health.overall.total} testId="kpi-total" />
              <Kpi icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} label="Délivrés" value={`${health.overall.delivered_rate}%`} sub={`${health.overall.delivered} / ${health.overall.total}`} testId="kpi-delivered" />
              <Kpi icon={<MailOpen className="w-4 h-4 text-indigo-400" />} label="Ouverts" value={`${health.overall.open_rate}%`} sub={`${health.overall.opened}`} testId="kpi-open" />
              <Kpi icon={<MousePointerClick className="w-4 h-4 text-purple-400" />} label="Cliqués" value={`${health.overall.click_rate}%`} sub={`${health.overall.clicked}`} testId="kpi-click" />
              <Kpi icon={<ShieldAlert className={`w-4 h-4 ${health.overall.bounce_rate > 2 ? "text-red-400" : "text-gray-400"}`} />} label="Bounce + Spam" value={`${(health.overall.bounce_rate + health.overall.spam_rate).toFixed(2)}%`} sub={`${health.overall.bounced} bounces · ${health.overall.complained} spam`} testId="kpi-bounce" />
            </div>

            {/* Per-domain breakdown */}
            {health.per_domain.length > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5" data-testid="per-domain-card">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" /> Réputation par domaine destinataire {health.per_domain_truncated && <span className="text-[10px] font-normal text-amber-300">(top 12)</span>}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/[0.05]">
                        <th className="text-left py-2 font-bold">Domaine</th>
                        <th className="text-right py-2 font-bold">Envoyés</th>
                        <th className="text-right py-2 font-bold">Délivré</th>
                        <th className="text-right py-2 font-bold">Ouvert</th>
                        <th className="text-right py-2 font-bold">Bounce</th>
                        <th className="text-right py-2 font-bold">Spam</th>
                      </tr>
                    </thead>
                    <tbody>
                      {health.per_domain.map((d) => (
                        <tr key={d.domain} className="border-b border-white/[0.03] hover:bg-white/[0.02]" data-testid={`domain-row-${d.domain}`}>
                          <td className="py-2 font-bold text-white">{d.domain}</td>
                          <td className="py-2 text-right text-gray-300">{d.total}</td>
                          <td className="py-2 text-right text-emerald-300">{d.delivered_rate}%</td>
                          <td className="py-2 text-right text-indigo-300">{d.open_rate}%</td>
                          <td className={`py-2 text-right ${d.bounce_rate > 5 ? "text-red-400 font-bold" : d.bounce_rate > 2 ? "text-amber-400" : "text-gray-400"}`}>{d.bounce_rate}%</td>
                          <td className={`py-2 text-right ${d.spam_rate > 0.3 ? "text-red-400 font-bold" : d.spam_rate > 0.1 ? "text-amber-400" : "text-gray-400"}`}>{d.spam_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent incidents */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Incidents récents (bounces + complaints)</h2>
              {incidents.length === 0 ? (
                <p className="text-sm text-gray-500" data-testid="no-incidents">Aucun incident récent — bien joué 🎉</p>
              ) : (
                <div className="space-y-1.5">
                  {incidents.map((i, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded bg-black/20 text-[12px]" data-testid={`incident-${idx}`}>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${i.type === "email.bounced" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"}`}>
                        {i.type === "email.bounced" ? "BOUNCE" : "SPAM"}
                      </span>
                      <span className="text-gray-300 truncate flex-1">{i.recipient}</span>
                      {i.category && <span className="text-[10px] text-gray-500">{i.category}</span>}
                      <span className="text-gray-500 whitespace-nowrap">{new Date(i.ts).toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-500" data-testid="footer-note">
              💡 Score basé sur : bounce rate (40 pts), spam rate (30 pts), open rate (20 pts), delivered rate (10 pts).
              Benchmarks industrie : bounce &lt;2%, spam &lt;0.1%, open &gt;21%, delivered &gt;95%.
            </p>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function Kpi({ icon, label, value, sub, testId }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; testId?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4" data-testid={testId}>
      <div className="mb-2">{icon}</div>
      <p className="text-xl font-black text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
