import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getPlanPrices, savePlanPrices, getPlanAccess, savePlanAccess, type PlanPrices } from "@/lib/api";
import { toast } from "sonner";
import { DollarSign, Save, CheckSquare, Square, CheckCheck, XSquare, Gem, Rocket, Star, Crown } from "lucide-react";

const PLANS = [
  { key: "free", label: "Gratuit", icon: "🆓", color: "from-gray-500 to-gray-600" },
  { key: "premium", label: "Premium", icon: "💎", color: "from-blue-500 to-blue-600" },
  { key: "advanced", label: "Advanced", icon: "🚀", color: "from-purple-500 to-purple-600" },
  { key: "pro", label: "Pro", icon: "⭐", color: "from-amber-500 to-amber-600" },
  { key: "elite", label: "Elite", icon: "👑", color: "from-emerald-500 to-emerald-600" },
];

const PLAN_PRICE_ICONS: Record<string, React.ElementType> = {
  premium: Gem,
  advanced: Rocket,
  pro: Star,
  elite: Crown,
};

// Common routes that can be toggled per plan
const ALL_ROUTES = [
  "dashboard", "ai-market-regime", "ai-signals", "ai-whale-tracker", "ai-news-analyzer",
  "fear-greed", "heatmap", "altcoin-season", "dominance", "crypto-pepites",
  "defi-yield", "onchain", "portfolio", "convertisseur", "calendrier",
  "market-simulation", "strategie", "academy", "downloads", "support",
  "bullrun", "nouvelles", "technical-analyzer", "ai-coach", "ai-swarm",
  "narrative-radar", "scam-shield", "altseason-copilot", "setup-builder", "token-scanner",
];

export default function PricingPage() {
  const [prices, setPrices] = useState<PlanPrices>({ premium: 0, advanced: 0, pro: 0, elite: 0 });
  const [savingPrices, setSavingPrices] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [allowedRoutes, setAllowedRoutes] = useState<Set<string>>(new Set());
  const [savingAccess, setSavingAccess] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(false);

  useEffect(() => {
    getPlanPrices().then(setPrices);
  }, []);

  useEffect(() => {
    setLoadingAccess(true);
    getPlanAccess(selectedPlan)
      .then((data) => {
        const routes = (data.allowed || []).map((r: string) => r.replace(/^\//, "").trim()).filter(Boolean);
        setAllowedRoutes(new Set(routes));
      })
      .finally(() => setLoadingAccess(false));
  }, [selectedPlan]);

  const handleSavePrices = async () => {
    setSavingPrices(true);
    try {
      await savePlanPrices(prices);
      toast.success("Prix enregistrés avec succès");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
    setSavingPrices(false);
  };

  const toggleRoute = (route: string) => {
    setAllowedRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(route)) next.delete(route);
      else next.add(route);
      return next;
    });
  };

  const handleSaveAccess = async () => {
    setSavingAccess(true);
    try {
      await savePlanAccess(selectedPlan, Array.from(allowedRoutes));
      toast.success(`Accès enregistrés pour le plan ${selectedPlan}`);
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
    setSavingAccess(false);
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Prix & Forfaits</h1>
      <p className="text-sm text-gray-400 mb-6">Gérez les prix des abonnements et les accès par forfait.</p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pricing Card */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Gestion des Prix</h2>
              <p className="text-xs text-gray-400">Modifiez les prix (CAD) puis sauvegardez</p>
            </div>
          </div>

          <div className="space-y-4">
            {(["premium", "advanced", "pro", "elite"] as const).map((plan) => {
              const Icon = PLAN_PRICE_ICONS[plan];
              const planInfo = PLANS.find((p) => p.key === plan)!;
              return (
                <div key={plan} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${planInfo.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-bold text-gray-200">{planInfo.label}</label>
                    <p className="text-[10px] text-gray-500">
                      {plan === "premium" ? "1 mois" : plan === "advanced" ? "3 mois" : plan === "pro" ? "6 mois" : "1 an"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={prices[plan]}
                      onChange={(e) => setPrices((prev) => ({ ...prev, [plan]: parseFloat(e.target.value) || 0 }))}
                      className="w-28 px-3 py-2 rounded-lg bg-[#0A0E1A] border border-white/[0.08] text-white text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                    <span className="text-xs font-bold text-gray-500">CAD</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSavePrices}
            disabled={savingPrices}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingPrices ? "Sauvegarde..." : "Sauvegarder les prix"}
          </button>
        </div>

        {/* Access Management Card */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-1">Gestion des Accès par Forfait</h2>
          <p className="text-xs text-gray-400 mb-4">Sélectionnez un plan, cochez les pages accessibles, puis enregistrez.</p>

          {/* Plan Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PLANS.map((plan) => (
              <button
                key={plan.key}
                onClick={() => setSelectedPlan(plan.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedPlan === plan.key
                    ? `bg-gradient-to-r ${plan.color} text-white shadow-lg`
                    : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] border border-white/[0.06]"
                }`}
              >
                {plan.icon} {plan.label}
              </button>
            ))}
          </div>

          {/* Routes List */}
          <div className="max-h-[340px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {loadingAccess ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              ALL_ROUTES.map((route) => {
                const checked = allowedRoutes.has(route);
                return (
                  <button
                    key={route}
                    onClick={() => toggleRoute(route)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                      checked ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-white/[0.01] border border-transparent hover:bg-white/[0.03]"
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    )}
                    <span className={`text-sm font-medium ${checked ? "text-white" : "text-gray-400"}`}>
                      /{route}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setAllowedRoutes(new Set(ALL_ROUTES))}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Tout sélectionner
            </button>
            <button
              onClick={() => setAllowedRoutes(new Set())}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              <XSquare className="w-3.5 h-3.5" /> Tout désélectionner
            </button>
          </div>
          <button
            onClick={handleSaveAccess}
            disabled={savingAccess}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingAccess ? "Sauvegarde..." : "Enregistrer les accès"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}