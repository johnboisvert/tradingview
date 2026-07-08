// Admin — Plan Access Management.
// Grant, list, revoke Elite/Pro access by email. Grants persist server-side
// and are queryable via /api/v1/plans/grants/lookup (used by /redeem).
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Crown, Trash2, RefreshCw, Plus, Search, ShieldCheck } from "lucide-react";

type Grant = {
  email: string;
  plan: string;
  note: string | null;
  granted_at: string;
  granted_by: string | null;
  expires_at: string | null;
  expired: boolean;
};

const PLANS = ["free", "premium", "advanced", "pro", "elite", "admin"] as const;

const ADMIN_HEADER = "x-admin-auth";
const ADMIN_TOKEN = () => sessionStorage.getItem("cryptoia_admin_password") || "admin123";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-500/20 text-gray-300 border-gray-500/40",
  premium: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  advanced: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  pro: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
  elite: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  admin: "bg-red-500/20 text-red-300 border-red-500/40",
};

export default function AdminAccess() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // form state
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<string>("elite");
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/v1/admin/plans/grants", {
        headers: { [ADMIN_HEADER]: ADMIN_TOKEN() },
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setGrants(j.grants || []);
    } catch (e: unknown) {
      setFlash({ type: "error", msg: `Chargement échoué : ${(e as Error).message}` });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const flashOk = (msg: string) => { setFlash({ type: "success", msg }); setTimeout(() => setFlash(null), 3000); };
  const flashErr = (msg: string) => { setFlash({ type: "error", msg }); setTimeout(() => setFlash(null), 5000); };

  const grant = async () => {
    if (!email.includes("@")) return flashErr("Email invalide");
    setBusy(true);
    try {
      const r = await fetch("/api/v1/admin/plans/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json", [ADMIN_HEADER]: ADMIN_TOKEN() },
        body: JSON.stringify({ email, plan, note: note || undefined, expires_at: expiresAt || undefined }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      flashOk(`✅ Accès ${plan} accordé à ${email}`);
      setEmail(""); setNote(""); setExpiresAt("");
      await load();
    } catch (e: unknown) {
      flashErr(`Échec : ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (email: string) => {
    if (!confirm(`Révoquer l'accès de ${email} ?`)) return;
    try {
      const r = await fetch(`/api/v1/admin/plans/grants/${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: { [ADMIN_HEADER]: ADMIN_TOKEN() },
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      flashOk(`🗑️ ${email} révoqué`);
      await load();
    } catch (e: unknown) {
      flashErr(`Échec : ${(e as Error).message}`);
    }
  };

  const filtered = filter
    ? grants.filter(g => g.email.toLowerCase().includes(filter.toLowerCase()) || g.plan.includes(filter.toLowerCase()))
    : grants;

  const stats = {
    total: grants.length,
    elite: grants.filter(g => g.plan === "elite" && !g.expired).length,
    pro: grants.filter(g => g.plan === "pro" && !g.expired).length,
    expired: grants.filter(g => g.expired).length,
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Crown className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" data-testid="admin-access-title">Gestion des Accès</h1>
              <p className="text-sm text-gray-400">Grant / revoke Elite &amp; Pro par email · VIP, partenaires, promos</p>
            </div>
          </div>
          <button
            onClick={load}
            data-testid="admin-access-refresh"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/[0.05] text-xs text-white/70 font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Rafraîchir
          </button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"><div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Total accès</div><div className="text-2xl font-black text-white mt-1" data-testid="stat-total">{stats.total}</div></div>
          <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4"><div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Elite actifs</div><div className="text-2xl font-black text-amber-300 mt-1" data-testid="stat-elite">{stats.elite}</div></div>
          <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-xl p-4"><div className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Pro actifs</div><div className="text-2xl font-black text-indigo-300 mt-1" data-testid="stat-pro">{stats.pro}</div></div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4"><div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Expirés</div><div className="text-2xl font-black text-gray-400 mt-1" data-testid="stat-expired">{stats.expired}</div></div>
        </div>

        {/* Flash */}
        {flash && (
          <div data-testid="admin-access-flash" className={`px-4 py-2.5 rounded-lg border text-sm ${flash.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
            {flash.msg}
          </div>
        )}

        {/* Grant form */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-amber-400" /> Nouvel accès / Modifier</h2>
          <div className="grid md:grid-cols-4 gap-3 mb-3">
            <input
              data-testid="grant-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@email.com"
              className="md:col-span-2 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
            <select data-testid="grant-plan" value={plan} onChange={(e) => setPlan(e.target.value)} className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/50">
              {PLANS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
            <input
              data-testid="grant-expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/50"
              placeholder="Expiration (optionnel)"
            />
          </div>
          <div className="flex gap-3">
            <input
              data-testid="grant-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note interne (optionnel) — ex: VIP Discord Legend, promo YouTube…"
              className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
            <button
              data-testid="grant-submit"
              onClick={grant}
              disabled={busy || !email}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-sm hover:brightness-110 transition disabled:opacity-40"
            >
              {busy ? "…" : "Accorder"}
            </button>
          </div>
          <p className="text-[10.5px] text-gray-500 mt-2">
            💡 Le user devra ensuite aller sur <code className="text-amber-300">/redeem</code> et entrer cet email pour activer son accès dans son navigateur.
          </p>
        </div>

        {/* Filter + List */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              data-testid="grants-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrer par email ou plan…"
              className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
            <span className="text-xs text-gray-500 tabular-nums">{filtered.length} / {grants.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-gray-500 border-b border-white/5">
                  <th className="py-2 pr-3 text-left">Email</th>
                  <th className="py-2 pr-3 text-left">Plan</th>
                  <th className="py-2 pr-3 text-left">Note</th>
                  <th className="py-2 pr-3 text-left">Accordé le</th>
                  <th className="py-2 pr-3 text-left">Expire</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="py-5 text-center text-gray-500">Chargement…</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={6} className="py-5 text-center text-gray-500">— aucun accès accordé —</td></tr>}
                {filtered.map((g) => (
                  <tr key={g.email} data-testid={`grant-row-${g.email}`} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2 pr-3 text-white/90 font-mono text-xs">{g.email}</td>
                    <td className="py-2 pr-3"><span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded border ${PLAN_COLORS[g.plan] || PLAN_COLORS.free}`}>{g.plan}</span></td>
                    <td className="py-2 pr-3 text-gray-400 text-xs">{g.note || "—"}</td>
                    <td className="py-2 pr-3 text-gray-500 text-xs">{new Date(g.granted_at).toLocaleDateString("fr-CA")}</td>
                    <td className="py-2 pr-3 text-xs">
                      {g.expires_at ? (
                        <span className={g.expired ? "text-red-400 font-bold" : "text-amber-400"}>
                          {new Date(g.expires_at).toLocaleDateString("fr-CA")}{g.expired ? " (expiré)" : ""}
                        </span>
                      ) : <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> À vie</span>}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        data-testid={`revoke-${g.email}`}
                        onClick={() => revoke(g.email)}
                        className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition"
                        aria-label="Révoquer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
