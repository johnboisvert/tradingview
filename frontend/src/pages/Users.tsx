import { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getUsers, addUser, updateUserPlan, deleteUser, resetPassword, type User } from "@/lib/api";
import { toast } from "sonner";
import {
  Search,
  UserPlus,
  Trash2,
  KeyRound,
  Save,
  X,
  ChevronDown,
  Shield,
  Crown,
  Star,
  Gem,
  Rocket,
  User as UserIcon,
} from "lucide-react";
import Footer from "@/components/Footer";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  premium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  advanced: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  pro: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  elite: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: UserIcon,
  premium: Gem,
  advanced: Rocket,
  pro: Star,
  elite: Crown,
};

const PLANS = ["free", "premium", "advanced", "pro", "elite"];

function PlanBadge({ plan }: { plan: string }) {
  const Icon = PLAN_ICONS[plan] || UserIcon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${PLAN_COLORS[plan] || PLAN_COLORS.free}`}>
      <Icon className="w-3 h-3" />
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isAdmin ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-white/[0.04] text-gray-500 border border-white/[0.06]"}`}>
      {isAdmin && <Shield className="w-2.5 h-2.5" />}
      {role}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Record<string, string>>({});

  // Add user form
  const [newEmail, setNewEmail] = useState("");
  const [newPlan, setNewPlan] = useState("free");
  const [newPassword, setNewPassword] = useState("");

  const loadUsers = () => {
    setLoading(true);
    getUsers()
      .then((data) => setUsers(data.users || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !search || u.username.toLowerCase().includes(search.toLowerCase());
      const matchPlan = filterPlan === "all" || u.plan === filterPlan;
      return matchSearch && matchPlan;
    });
  }, [users, search, filterPlan]);

  const handleAddUser = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Email invalide");
      return;
    }
    const res = await addUser({ username: newEmail, password: newPassword || undefined, role: "user", plan: newPlan });
    if (res.success) {
      toast.success(`Utilisateur créé${res.temp_password ? ` — MDP: ${res.temp_password}` : ""}`);
      setShowAddModal(false);
      setNewEmail("");
      setNewPassword("");
      setNewPlan("free");
      loadUsers();
    } else {
      toast.error(res.message || "Erreur");
    }
  };

  const handleSavePlan = async (username: string) => {
    const plan = editingPlan[username];
    if (!plan) return;
    const res = await updateUserPlan(username, plan);
    if (res.success) {
      toast.success(`Plan mis à jour pour ${username}`);
      setEditingPlan((prev) => { const n = { ...prev }; delete n[username]; return n; });
      loadUsers();
    } else {
      toast.error(res.message || "Erreur");
    }
  };

  const handleDelete = async (username: string) => {
    if (!confirm(`Supprimer ${username} ?`)) return;
    const res = await deleteUser(username);
    if (res.success) {
      toast.success("Utilisateur supprimé");
      loadUsers();
    } else {
      toast.error(res.message || "Erreur");
    }
  };

  const handleResetPwd = async (username: string) => {
    const newPwd = prompt(`Nouveau mot de passe pour ${username} :\n(Vide = auto-généré)`);
    if (newPwd === null) return;
    const res = await resetPassword(username, newPwd || undefined);
    if (res.success) {
      toast.success(`MDP réinitialisé${res.temp_password ? ` — Nouveau: ${res.temp_password}` : ""}`);
    } else {
      toast.error(res.message || "Erreur");
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-sm text-gray-400 mt-1">{users.length} utilisateurs enregistrés</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher par email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111827] border border-white/[0.08] text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="appearance-none px-4 pr-10 py-2.5 rounded-xl bg-[#111827] border border-white/[0.08] text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
          >
            <option value="all">Tous les plans</option>
            {PLANS.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Email / Username</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Rôle</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Plan</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Expiration</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Créé</th>
                <th className="text-right text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 text-sm">Aucun utilisateur trouvé.</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.username} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-white">{u.username}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {editingPlan[u.username] !== undefined ? (
                          <>
                            <select
                              value={editingPlan[u.username]}
                              onChange={(e) => setEditingPlan((prev) => ({ ...prev, [u.username]: e.target.value }))}
                              className="appearance-none px-2 py-1 rounded-lg bg-[#0A0E1A] border border-white/[0.1] text-white text-xs font-medium focus:outline-none"
                            >
                              {PLANS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                            <button onClick={() => handleSavePlan(u.username)} className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingPlan((prev) => { const n = { ...prev }; delete n[u.username]; return n; })} className="p-1 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setEditingPlan((prev) => ({ ...prev, [u.username]: u.plan }))} className="hover:opacity-80 transition-opacity">
                            <PlanBadge plan={u.plan} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">{u.subscription_end || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{u.created_at || "—"}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleResetPwd(u.username)}
                          className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-amber-500/10 hover:text-amber-400 transition-all"
                          title="Reset mot de passe"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.username)}
                          disabled={u.username === "admin"}
                          className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Ajouter un utilisateur</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="client@email.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  {PLANS.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mot de passe (optionnel)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Vide = auto-généré"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <button
                onClick={handleAddUser}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Créer l'utilisateur
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}