import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getPromos, deletePromo, createPromo, type PromoCode } from "@/lib/api";
import { toast } from "sonner";
import { Tag, Plus, Trash2, X, Percent, Hash, Calendar, Users, CheckCircle2, XCircle } from "lucide-react";

export default function PromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: "", discount: 10, type: "percent", max_uses: 100 });

  const loadPromos = () => {
    setLoading(true);
    getPromos()
      .then((data) => setPromos(data.promos || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPromos(); }, []);

  const handleCreate = async () => {
    if (!form.code.trim()) { toast.error("Code requis"); return; }
    const res = await createPromo(form);
    if (res.success) {
      toast.success("Code promo créé");
      setShowCreate(false);
      setForm({ code: "", discount: 10, type: "percent", max_uses: 100 });
      loadPromos();
    } else {
      toast.error("Erreur lors de la création");
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Supprimer le code ${code} ?`)) return;
    const res = await deletePromo(code);
    if (res.success) {
      toast.success("Code supprimé");
      loadPromos();
    } else {
      toast.error("Erreur");
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Codes Promo</h1>
          <p className="text-sm text-gray-400 mt-1">{promos.length} codes configurés</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nouveau code
        </button>
      </div>

      {/* Promo Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : promos.length === 0 ? (
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-12 text-center">
          <Tag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Aucun code promo configuré.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {promos.map((p) => (
            <div
              key={p.code}
              className={`bg-[#111827] border rounded-2xl p-5 transition-all hover:shadow-xl hover:shadow-black/20 ${
                p.active ? "border-white/[0.06] hover:border-indigo-500/20" : "border-red-500/10 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-black text-white tracking-tight">{p.code}</span>
                    {p.active ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    p.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {p.active ? "Actif" : "Inactif"}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(p.code)}
                  className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Percent className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Réduction</span>
                  </div>
                  <p className="text-sm font-extrabold text-white">{p.discount}%</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="w-3 h-3 text-purple-400" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Utilisations</span>
                  </div>
                  <p className="text-sm font-extrabold text-white">
                    {p.current_uses}<span className="text-gray-500 font-bold">/{p.max_uses}</span>
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.current_uses / p.max_uses > 0.8 ? "bg-red-500" : p.current_uses / p.max_uses > 0.5 ? "bg-amber-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${Math.min((p.current_uses / p.max_uses) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-500">
                {p.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Créé: {p.created_at}</span>
                  </div>
                )}
                {p.expires_at && (
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    <span>Expire: {p.expires_at}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Nouveau code promo</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-white/[0.06]">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="EX: SAVE20"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm font-bold uppercase placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Réduction (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Max utilisations</label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>
              <button
                onClick={handleCreate}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
              >
                Créer le code promo
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}