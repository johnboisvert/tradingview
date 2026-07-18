// Admin — Accès Indicateurs : suivi des acheteurs de la Suite Indicateurs TradingView
import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  KeyRound, RefreshCw, CheckCircle2, Clock, Loader2, DollarSign, Users, Plus,
} from "lucide-react";

const ADMIN_AUTH_KEY = "admin_api_key";
function getAdminAuth() {
  return localStorage.getItem(ADMIN_AUTH_KEY) || "admin123";
}

interface AccessEntry {
  id: string;
  email: string | null;
  billing: string;
  amount: number;
  tvUsername: string | null;
  status: "pending" | "granted";
  createdAt: string;
  grantedAt: string | null;
}
interface AccessData {
  ok: boolean;
  stats: { total: number; pending: number; granted: number; revenue: number };
  entries: AccessEntry[];
}

const BILLING_LABEL: Record<string, string> = {
  monthly: "Mensuel",
  annual: "Annuel",
  lifetime: "À vie",
};

async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method || "GET",
    headers: { "x-admin-auth": getAdminAuth(), "Content-Type": "application/json" },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

export default function AdminIndicatorAccess() {
  const [data, setData] = useState<AccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [newEmail, setNewEmail] = useState("");
  const [newBilling, setNewBilling] = useState("monthly");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const json = await api<AccessData>("/api/v1/admin/indicator-access");
      setData(json);
      const map: Record<string, string> = {};
      (json.entries || []).forEach((e) => { map[e.id] = e.tvUsername || ""; });
      setUsernames(map);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function updateEntry(id: string, patch: { tvUsername?: string; status?: string }) {
    setSaving(id);
    await api(`/api/v1/admin/indicator-access/${id}`, { method: "PATCH", body: patch });
    await fetchData();
    setSaving(null);
  }

  async function addManual() {
    if (!newEmail.trim()) return;
    setSaving("new");
    await api("/api/v1/admin/indicator-access", {
      method: "POST",
      body: { email: newEmail.trim(), billing: newBilling },
    });
    setNewEmail("");
    await fetchData();
    setSaving(null);
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto" data-testid="admin-indicator-access-page">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl grid place-items-center bg-emerald-500/15 border border-emerald-400/30">
              <KeyRound className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Accès Indicateurs</h1>
              <p className="text-xs text-gray-400">Acheteurs de la Suite Indicateurs — donnez l'accès TradingView invite-only</p>
            </div>
          </div>
          <button
            data-testid="indicator-access-refresh"
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Ventes totales", value: data?.stats.total ?? "—", icon: Users, color: "text-cyan-300" },
            { label: "En attente", value: data?.stats.pending ?? "—", icon: Clock, color: "text-amber-300" },
            { label: "Accès donnés", value: data?.stats.granted ?? "—", icon: CheckCircle2, color: "text-emerald-300" },
            { label: "Revenu", value: data ? `$${data.stats.revenue.toFixed(0)}` : "—", icon: DollarSign, color: "text-lime-300" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-[#0d1526] p-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                {s.label}
              </div>
              <div className="mt-2 text-2xl font-black text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Ajout manuel */}
        <div className="rounded-xl border border-white/10 bg-[#0d1526] p-4 mb-6 flex flex-wrap items-center gap-3">
          <Plus className="h-4 w-4 text-gray-400" />
          <input
            data-testid="indicator-access-new-email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email du client (vente manuelle)"
            className="flex-1 min-w-[220px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-400/50"
          />
          <select
            data-testid="indicator-access-new-billing"
            value={newBilling}
            onChange={(e) => setNewBilling(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0a0e17] px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="monthly">Mensuel</option>
            <option value="annual">Annuel</option>
            <option value="lifetime">À vie</option>
          </select>
          <button
            data-testid="indicator-access-add-btn"
            onClick={addManual}
            disabled={saving === "new" || !newEmail.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#0a0e17] hover:bg-emerald-400 transition-colors disabled:opacity-50"
          >
            {saving === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Ajouter
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/10 bg-[#0d1526] overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : !data?.entries.length ? (
            <div className="p-10 text-center text-sm text-gray-400" data-testid="indicator-access-empty">
              Aucune vente pour l'instant. Les achats de la suite apparaîtront ici automatiquement.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Formule</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Username TradingView</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((e) => (
                    <tr key={e.id} data-testid={`indicator-access-row-${e.id}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleDateString("fr-CA")}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{e.email || "—"}</td>
                      <td className="px-4 py-3 text-gray-300">{BILLING_LABEL[e.billing] || e.billing}</td>
                      <td className="px-4 py-3 text-emerald-300 font-bold">${e.amount.toFixed(0)}</td>
                      <td className="px-4 py-3">
                        <input
                          data-testid={`indicator-access-username-${e.id}`}
                          value={usernames[e.id] ?? ""}
                          onChange={(ev) => setUsernames((m) => ({ ...m, [e.id]: ev.target.value }))}
                          onBlur={() => {
                            if ((usernames[e.id] || "") !== (e.tvUsername || "")) {
                              updateEntry(e.id, { tvUsername: usernames[e.id] || "" });
                            }
                          }}
                          placeholder="@username"
                          className="w-40 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-400/50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {e.status === "granted" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Accès donné
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300">
                            <Clock className="h-3 w-3" /> En attente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          data-testid={`indicator-access-toggle-${e.id}`}
                          onClick={() => updateEntry(e.id, { status: e.status === "granted" ? "pending" : "granted" })}
                          disabled={saving === e.id}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                            e.status === "granted"
                              ? "border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                              : "bg-emerald-500 text-[#0a0e17] hover:bg-emerald-400"
                          }`}
                        >
                          {saving === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                          {e.status === "granted" ? "Remettre en attente" : "Marquer accès donné"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
