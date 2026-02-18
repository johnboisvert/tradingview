import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { User, Shield, Bell, Key, LogOut, Mail, Calendar, CreditCard, Settings, Eye, EyeOff, Save, CheckCircle } from "lucide-react";

export default function MonCompte() {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "api">("profile");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: "profile" as const, label: "Profil", icon: User },
    { id: "security" as const, label: "Sécurité", icon: Shield },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "api" as const, label: "Clés API", icon: Key },
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
              <p className="text-sm text-gray-400">Gérez votre profil, sécurité et préférences</p>
            </div>
          </div>
        </div>

        {/* Account Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Calendar, label: "Membre depuis", value: "Jan 2026", color: "text-blue-400" },
            { icon: CreditCard, label: "Plan actuel", value: "Gratuit", color: "text-gray-400" },
            { icon: Shield, label: "Statut", value: "Vérifié", color: "text-emerald-400" },
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
                {[
                  { label: "Nom d'utilisateur", placeholder: "trader_pro", type: "text" },
                  { label: "Email", placeholder: "email@example.com", type: "email" },
                  { label: "Prénom", placeholder: "Jean", type: "text" },
                  { label: "Nom", placeholder: "Dupont", type: "text" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-xs text-gray-500 font-semibold mb-1 block">{field.label}</label>
                    <input type={field.type} placeholder={field.placeholder}
                      className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Bio</label>
                <textarea placeholder="Décrivez votre expérience en trading..."
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 h-24 resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Fuseau horaire</label>
                <select className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white">
                  <option>Europe/Paris (UTC+1)</option>
                  <option>America/Montreal (UTC-5)</option>
                  <option>America/New_York (UTC-5)</option>
                  <option>Asia/Tokyo (UTC+9)</option>
                </select>
              </div>
              <button onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 font-bold text-sm hover:brightness-110 transition-all">
                {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? "Sauvegardé !" : "Sauvegarder"}
              </button>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-blue-400" /> Sécurité</h2>
              <div className="space-y-4">
                <div className="bg-black/20 rounded-xl p-5 border border-white/[0.04]">
                  <h3 className="font-bold text-sm mb-3">Changer le mot de passe</h3>
                  <div className="space-y-3">
                    <input type="password" placeholder="Mot de passe actuel"
                      className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                    <input type="password" placeholder="Nouveau mot de passe"
                      className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                    <input type="password" placeholder="Confirmer le nouveau mot de passe"
                      className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <button className="mt-3 px-5 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/20 text-blue-400 font-bold text-sm hover:bg-blue-500/25 transition-all">
                    Mettre à jour
                  </button>
                </div>
                <div className="bg-black/20 rounded-xl p-5 border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm">Authentification 2FA</h3>
                      <p className="text-xs text-gray-500 mt-1">Ajoutez une couche de sécurité supplémentaire</p>
                    </div>
                    <button className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-bold text-xs hover:bg-emerald-500/25 transition-all">
                      Activer
                    </button>
                  </div>
                </div>
                <div className="bg-black/20 rounded-xl p-5 border border-white/[0.04]">
                  <h3 className="font-bold text-sm mb-2">Sessions actives</h3>
                  <div className="space-y-2">
                    {["Chrome — Paris, France (actuelle)", "Safari — Montréal, Canada"].map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{s}</span>
                        {i > 0 && <button className="text-red-400 font-bold hover:text-red-300">Déconnecter</button>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold flex items-center gap-2"><Bell className="w-5 h-5 text-amber-400" /> Préférences de Notification</h2>
              {[
                { label: "Alertes de prix", desc: "Notification quand un prix cible est atteint", on: true },
                { label: "Signaux de trading", desc: "Nouveaux signaux IA détectés", on: true },
                { label: "Résumé quotidien", desc: "Récapitulatif journalier par email", on: false },
                { label: "Mises à jour produit", desc: "Nouvelles fonctionnalités et améliorations", on: true },
                { label: "Newsletter", desc: "Analyses hebdomadaires du marché", on: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-black/20 rounded-xl p-4 border border-white/[0.04]">
                  <div>
                    <h3 className="font-bold text-sm">{item.label}</h3>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${item.on ? "bg-amber-500" : "bg-white/[0.1]"}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.on ? "left-7" : "left-1"}`} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold flex items-center gap-2"><Key className="w-5 h-5 text-purple-400" /> Clés API</h2>
              <div className="bg-black/20 rounded-xl p-5 border border-white/[0.04]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">Clé API CryptoIA</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type={showApiKey ? "text" : "password"} readOnly value="cia_sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
                    className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white font-mono" />
                  <button onClick={() => setShowApiKey(!showApiKey)}
                    className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] transition-all">
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 mt-2">⚠️ Ne partagez jamais votre clé API. Régénérez-la si compromise.</p>
              </div>
              <div className="bg-black/20 rounded-xl p-5 border border-white/[0.04]">
                <h3 className="font-bold text-sm mb-3">Connexions Externes</h3>
                <div className="space-y-3">
                  {[
                    { name: "Binance", status: "Non connecté", color: "text-gray-500" },
                    { name: "TradingView", status: "Non connecté", color: "text-gray-500" },
                    { name: "Telegram Bot", status: "Non connecté", color: "text-gray-500" },
                  ].map((conn, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold">{conn.name}</span>
                        <span className={`ml-2 text-xs ${conn.color}`}>{conn.status}</span>
                      </div>
                      <button className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs font-bold hover:bg-white/[0.1] transition-all">
                        Connecter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="mt-6 bg-red-500/[0.04] border border-red-500/15 rounded-2xl p-6">
          <h3 className="font-bold text-sm text-red-400 mb-2">Zone Dangereuse</h3>
          <p className="text-xs text-gray-500 mb-3">Ces actions sont irréversibles. Procédez avec prudence.</p>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center gap-2">
              <LogOut className="w-3 h-3" /> Déconnexion
            </button>
            <button className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">
              Supprimer le compte
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}