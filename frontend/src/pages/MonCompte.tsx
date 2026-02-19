import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { getUserPlan, setUserPlan, getPlanDisplayInfo, PLAN_HIERARCHY, type PlanType } from "@/lib/subscription";
import { User, Shield, Bell, Key, LogOut, Calendar, CreditCard, Settings, Eye, EyeOff, Save, CheckCircle, Crown } from "lucide-react";

export default function MonCompte() {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "subscription">("profile");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanType>(getUserPlan());

  useEffect(() => {
    setCurrentPlan(getUserPlan());
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePlanChange = (plan: PlanType) => {
    setUserPlan(plan);
    setCurrentPlan(plan);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      // Force sidebar re-render by reloading
      window.location.reload();
    }, 500);
  };

  const planInfo = getPlanDisplayInfo(currentPlan);

  const tabs = [
    { id: "profile" as const, label: "Profil", icon: User },
    { id: "subscription" as const, label: "Abonnement", icon: Crown },
    { id: "security" as const, label: "Sécurité", icon: Shield },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Mon Compte</h1>
              <p className="text-sm text-gray-400">Gérez votre profil, abonnement et préférences</p>
            </div>
          </div>
        </div>

        {/* Account Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Calendar, label: "Membre depuis", value: "Jan 2026", color: "text-blue-400" },
            { icon: CreditCard, label: "Plan actuel", value: planInfo.label, color: planInfo.color },
            { icon: Shield, label: "Statut", value: "Actif", color: "text-emerald-400" },
            { icon: Bell, label: "Alertes actives", value: "3", color: "text-amber-400" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <Icon className={`w-5 h-5 ${item.color} mb-2`} />
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{item.label}</p>
                <p className={`text-lg font-bold ${item.color} mt-1`}>{item.value}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-emerald-500/15 to-green-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.05]"
                }`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          {activeTab === "profile" && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold flex items-center gap-2"><User className="w-5 h-5 text-emerald-400" /> Informations du Profil</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nom complet</label>
                  <input type="text" defaultValue="Utilisateur CryptoIA" className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                  <input type="email" defaultValue="user@cryptoia.com" className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Téléphone</label>
                  <input type="tel" defaultValue="+1 (514) 000-0000" className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Fuseau horaire</label>
                  <select className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50">
                    <option value="est">EST (UTC-5)</option>
                    <option value="pst">PST (UTC-8)</option>
                    <option value="cet">CET (UTC+1)</option>
                  </select>
                </div>
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm hover:brightness-110 transition-all">
                {saved ? <><CheckCircle className="w-4 h-4" /> Enregistré !</> : <><Save className="w-4 h-4" /> Enregistrer</>}
              </button>
            </div>
          )}

          {activeTab === "subscription" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2"><Crown className="w-5 h-5 text-amber-400" /> Gestion de l'Abonnement</h2>

              {/* Current Plan */}
              <div className={`bg-gradient-to-r ${planInfo.gradient} rounded-2xl p-6 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/60" />
                <div className="relative z-10">
                  <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Plan actuel</p>
                  <h3 className="text-2xl font-extrabold mb-2">{planInfo.label}</h3>
                  <p className="text-sm text-gray-300">
                    {currentPlan === "free"
                      ? "Accès limité aux fonctionnalités de base."
                      : `Vous avez accès à toutes les fonctionnalités du plan ${planInfo.label}.`}
                  </p>
                </div>
              </div>

              {/* Plan Selector */}
              <div>
                <h3 className="text-sm font-bold text-gray-300 mb-3">Changer de plan (démo)</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Sélectionnez un plan pour simuler l'accès aux différentes fonctionnalités.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {PLAN_HIERARCHY.map((plan) => {
                    const info = getPlanDisplayInfo(plan);
                    const isCurrentPlan = plan === currentPlan;
                    return (
                      <button
                        key={plan}
                        onClick={() => handlePlanChange(plan)}
                        className={`relative p-4 rounded-xl border transition-all text-center ${
                          isCurrentPlan
                            ? `bg-gradient-to-r ${info.gradient} border-transparent text-white shadow-lg`
                            : "bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.05] hover:border-white/[0.12]"
                        }`}
                      >
                        {isCurrentPlan && (
                          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          </div>
                        )}
                        <Crown className={`w-6 h-6 mx-auto mb-2 ${isCurrentPlan ? "text-white" : info.color}`} />
                        <p className={`text-sm font-bold ${isCurrentPlan ? "text-white" : info.color}`}>{info.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {saved && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Plan mis à jour ! La page va se rafraîchir...</span>
                </div>
              )}
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-400" /> Sécurité</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mot de passe actuel</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nouveau mot de passe</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Confirmer le mot de passe</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm hover:brightness-110 transition-all">
                {saved ? <><CheckCircle className="w-4 h-4" /> Enregistré !</> : <><Save className="w-4 h-4" /> Mettre à jour</>}
              </button>

              {/* 2FA */}
              <div className="mt-6 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">Authentification à deux facteurs (2FA)</h3>
                    <p className="text-xs text-gray-500 mt-1">Ajoutez une couche de sécurité supplémentaire</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-white/[0.06] text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all">
                    Activer
                  </button>
                </div>
              </div>

              {/* API Keys */}
              <div className="mt-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2"><Key className="w-4 h-4 text-amber-400" /> Clé API</h3>
                    <p className="text-xs text-gray-500 mt-1">Votre clé pour accéder à l'API CryptoIA</p>
                  </div>
                  <button onClick={() => setShowApiKey(!showApiKey)} className="text-gray-500 hover:text-white transition-colors">
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="px-4 py-3 bg-black/30 rounded-lg font-mono text-xs text-gray-400">
                  {showApiKey ? "cia_sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" : "cia_sk_live_••••••••••••••••••••••••••••"}
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-emerald-400" /> Préférences de Notifications</h2>
              {[
                { label: "Alertes de prix", desc: "Recevez des notifications quand un prix atteint votre cible", enabled: true },
                { label: "Signaux IA", desc: "Notifications pour les nouveaux signaux de trading", enabled: true },
                { label: "Nouvelles importantes", desc: "Alertes pour les actualités crypto majeures", enabled: false },
                { label: "Rapport hebdomadaire", desc: "Résumé de vos performances chaque semaine", enabled: true },
                { label: "Mises à jour produit", desc: "Nouvelles fonctionnalités et améliorations", enabled: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  <div>
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                    <div className="w-10 h-5 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white" />
                  </label>
                </div>
              ))}
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-sm hover:brightness-110 transition-all">
                {saved ? <><CheckCircle className="w-4 h-4" /> Enregistré !</> : <><Save className="w-4 h-4" /> Enregistrer</>}
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="mt-6 bg-red-500/[0.03] border border-red-500/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-red-400 mb-2">Zone Dangereuse</h3>
          <p className="text-xs text-gray-500 mb-4">Ces actions sont irréversibles.</p>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all">
              <LogOut className="w-3.5 h-3.5" /> Déconnexion
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all">
              <Settings className="w-3.5 h-3.5" /> Supprimer le compte
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}