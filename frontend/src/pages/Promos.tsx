import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getPromos, deletePromo, createPromo, togglePromo, updateUserPlan, type PromoCode } from "@/lib/api";
import * as storeLib from "@/lib/store";
import { toast } from "sonner";
import {
  Tag, Plus, Trash2, X, Percent, Hash, Calendar, Users,
  CheckCircle2, XCircle, ToggleLeft, ToggleRight, UserCheck, Copy, CheckCheck
} from "lucide-react";
import Footer from "@/components/Footer";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded hover:bg-white/10 transition-colors"
      title="Copier"
    >
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
    </button>
  );
}

export default function PromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ code: "", discount: 10, type: "percent", max_uses: 100, expires_at: "" });
  const [applyForm, setApplyForm] = useState({ username: "", plan: "premium", promoCode: "" });
  const [applyResult, setApplyResult] = useState<{ discount: number; originalPrice: number; finalPrice: number } | null>(null);

  const PLAN_PRICES: Record<string, number> = { premium: 29.99, advanced: 69.99, pro: 119.99, elite: 199.99 };

  const loadPromos = () => {
    setLoading(true);
    getPromos()
      .then((data) => setPromos(data.promos || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPromos(); }, []);

  const handleCreate = async () => {
    if (!form.code.trim()) { toast.error("Code requis"); return; }
    if (form.discount <= 0 || form.discount > 100) { toast.error("Réduction entre 1 et 100%"); return; }
    const existing = promos.find(p => p.code.toUpperCase() === form.code.toUpperCase());
    if (existing) { toast.error("Ce code existe déjà"); return; }
    const res = await createPromo({ ...form, expires_at: form.expires_at || undefined });
    if (res.success) {
      toast.success(`Code "${form.code}" créé avec succès`);
      setShowCreate(false);
      setForm({ code: "", discount: 10, type: "percent", max_uses: 100, expires_at: "" });
      loadPromos();
    } else {
      toast.error("Erreur lors de la création");
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Supprimer le code ${code} ?`)) return;
    const res = await deletePromo(code);
    if (res.success) { toast.success("Code supprimé"); loadPromos(); }
    else toast.error("Erreur");
  };

  const handleToggle = async (code: string, currentActive: boolean) => {
    const res = await togglePromo(code);
    if (res.success) {
      toast.success(currentActive ? `Code "${code}" désactivé` : `Code "${code}" activé`);
      loadPromos();
    } else {
      toast.error("Erreur lors du changement de statut");
    }
  };

  // Compute apply preview
  useEffect(() => {
    if (!applyForm.promoCode || !applyForm.plan) { setApplyResult(null); return; }
    const validation = storeLib.validatePromo(applyForm.promoCode);
    if (validation.valid) {
      const original = PLAN_PRICES[applyForm.plan] || 0;
      const discountAmt = validation.type === "percent" ? original * (validation.discount / 100) : validation.discount;
      setApplyResult({ discount: validation.discount, originalPrice: original, finalPrice: Math.max(0, original - discountAmt) });
    } else {
      setApplyResult(null);
    }
  }, [applyForm.promoCode, applyForm.plan]);

  const handleApplyPromo = async () => {
    if (!applyForm.username.trim()) { toast.error("Nom d'utilisateur requis"); return; }
    const validation = storeLib.validatePromo(applyForm.promoCode);
    if (!validation.valid) { toast.error(validation.message); return; }
    const users = storeLib.getUsers();
    const user = users.find(u => u.username === applyForm.username);
    if (!user) { toast.error(`Utilisateur "${applyForm.username}" introuvable`); return; }
    // Apply plan upgrade + use promo
    const planRes = await updateUserPlan(applyForm.username, applyForm.plan);
    if (!planRes.success) { toast.error("Erreur lors de la mise à jour du plan"); return; }
    storeLib.usePromoCode(applyForm.promoCode);
    toast.success(`✅ Plan "${applyForm.plan}" appliqué à "${applyForm.username}" avec ${validation.discount}% de réduction`);
    setShowApply(false);
    setApplyForm({ username: "", plan: "premium", promoCode: "" });
    setApplyResult(null);
    loadPromos();
  };

  const activeCount = promos.filter(p => p.active).length;
  const totalUses = promos.reduce((s, p) => s + p.current_uses, 0);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Codes Promo</h1>
          <p className="text-sm text-gray-400 mt-1">
            {promos.length} codes • {activeCount} actifs • {totalUses} utilisations totales
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowApply(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-bold hover:bg-emerald-500/20 transition-all"
          >
            <UserCheck className="w-4 h-4" />
            Appliquer à un utilisateur
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Nouveau code
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-xl p-4 mb-6 text-xs text-blue-300 leading-relaxed">
        <p className="font-bold mb-1">ℹ️ Comment fonctionnent les codes promo ?</p>
        <ul className="space-y-1 text-gray-400">
          <li>• Les codes créés ici sont stockés et validés automatiquement côté utilisateur lors du paiement</li>
          <li>• Un utilisateur peut saisir son code dans la page <strong className="text-white">/abonnements</strong> → modal de paiement → champ "Code promo"</li>
          <li>• Vous pouvez aussi appliquer manuellement un code à un utilisateur existant via le bouton <strong className="text-white">"Appliquer à un utilisateur"</strong></li>
          <li>• Les codes actifs avec date d'expiration sont automatiquement invalidés après la date</li>
        </ul>
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
          {promos.map((p) => {
            const isExpired = p.expires_at ? new Date(p.expires_at) < new Date() : false;
            const usagePercent = p.max_uses > 0 ? (p.current_uses / p.max_uses) * 100 : 0;
            return (
              <div
                key={p.code}
                className={`bg-[#111827] border rounded-2xl p-5 transition-all hover:shadow-xl hover:shadow-black/20 ${
                  p.active && !isExpired ? "border-white/[0.06] hover:border-indigo-500/20" : "border-red-500/10 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-black text-white tracking-tight font-mono">{p.code}</span>
                      <CopyButton text={p.code} />
                      {p.active && !isExpired ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.active && !isExpired ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {isExpired ? "Expiré" : p.active ? "Actif" : "Inactif"}
                      </span>
                      {isExpired && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400">
                          Expiré le {p.expires_at}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(p.code, p.active)}
                      className={`p-2 rounded-lg transition-all ${
                        p.active
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-white/[0.04] text-gray-500 hover:bg-white/[0.08]"
                      }`}
                      title={p.active ? "Désactiver" : "Activer"}
                    >
                      {p.active
                        ? <ToggleRight className="w-4 h-4" />
                        : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(p.code)}
                      className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
                        usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-amber-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">{Math.round(usagePercent)}% utilisé</p>
                </div>

                <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-500 flex-wrap">
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
            );
          })}
        </div>
      )}

      {/* ── Create Modal ── */}
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
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Code *</label>
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
                    type="number" min={1} max={100} value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Max utilisations</label>
                  <input
                    type="number" min={1} value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Date d'expiration <span className="text-gray-600 normal-case">(optionnel)</span>
                </label>
                <input
                  type="date" value={form.expires_at}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              {/* Preview */}
              {form.code && form.discount > 0 && (
                <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-xl p-3 text-xs">
                  <p className="text-indigo-300 font-bold mb-1">Aperçu du code</p>
                  <div className="space-y-1 text-gray-400">
                    <p>Code : <span className="text-white font-mono font-bold">{form.code}</span></p>
                    <p>Réduction : <span className="text-emerald-400 font-bold">{form.discount}%</span></p>
                    <p>Exemples de prix après réduction :</p>
                    {Object.entries({ Premium: 29.99, Advanced: 69.99, Pro: 119.99 }).map(([name, price]) => (
                      <p key={name} className="ml-2">
                        {name}: <span className="line-through text-gray-600">${price}</span>{" "}
                        → <span className="text-emerald-400 font-bold">${(price * (1 - form.discount / 100)).toFixed(2)}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
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

      {/* ── Apply to User Modal ── */}
      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Appliquer un code promo</h2>
                <p className="text-xs text-gray-500 mt-0.5">Appliquer un plan avec réduction à un utilisateur existant</p>
              </div>
              <button onClick={() => { setShowApply(false); setApplyResult(null); }} className="p-1.5 rounded-lg hover:bg-white/[0.06]">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nom d'utilisateur *</label>
                <input
                  value={applyForm.username}
                  onChange={(e) => setApplyForm({ ...applyForm, username: e.target.value })}
                  placeholder="ex: john_doe"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Plan à attribuer *</label>
                <select
                  value={applyForm.plan}
                  onChange={(e) => setApplyForm({ ...applyForm, plan: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="premium">Premium — $29.99/mois</option>
                  <option value="advanced">Advanced — $69.99/mois</option>
                  <option value="pro">Pro — $119.99/mois</option>
                  <option value="elite">Elite — $199.99/mois</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Code promo à appliquer *</label>
                <select
                  value={applyForm.promoCode}
                  onChange={(e) => setApplyForm({ ...applyForm, promoCode: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="">-- Sélectionner un code --</option>
                  {promos.filter(p => p.active && (!p.expires_at || new Date(p.expires_at) >= new Date()) && p.current_uses < p.max_uses).map(p => (
                    <option key={p.code} value={p.code}>{p.code} — {p.discount}% de réduction ({p.current_uses}/{p.max_uses} utilisations)</option>
                  ))}
                </select>
              </div>

              {/* Price preview */}
              {applyResult && applyForm.promoCode && (
                <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-emerald-300 font-bold text-sm mb-2">💰 Aperçu de la réduction</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Prix original</span>
                      <span className="text-white font-bold">${applyResult.originalPrice.toFixed(2)} CAD/mois</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Réduction ({applyResult.discount}%)</span>
                      <span className="text-red-400 font-bold">-${(applyResult.originalPrice - applyResult.finalPrice).toFixed(2)} CAD</span>
                    </div>
                    <div className="flex justify-between border-t border-white/[0.06] pt-2 mt-2">
                      <span className="text-gray-300 font-bold">Prix final</span>
                      <span className="text-emerald-400 font-extrabold text-sm">${applyResult.finalPrice.toFixed(2)} CAD/mois</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
                ⚠️ Cette action met à jour le plan de l'utilisateur et incrémente le compteur d'utilisation du code promo.
              </div>

              <button
                onClick={handleApplyPromo}
                disabled={!applyForm.username || !applyForm.promoCode}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <UserCheck className="w-4 h-4 inline mr-2" />
                Appliquer le plan avec réduction
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}