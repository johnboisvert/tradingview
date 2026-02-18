import Sidebar from "@/components/Sidebar";

export default function MonCompte() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">👤 Mon Compte</h1>
        <p className="text-gray-400 mb-8">Gérez votre profil et vos paramètres</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile */}
          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-white font-bold text-xl">Utilisateur</h2>
            <p className="text-gray-400 text-sm mt-1">Membre depuis Fév 2026</p>
            <div className="mt-4 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 font-bold text-sm inline-block">
              Plan Advanced
            </div>
          </div>

          {/* Settings */}
          <div className="lg:col-span-2 bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <h2 className="text-lg font-bold text-white mb-6">⚙️ Paramètres</h2>
            <div className="space-y-5">
              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-2">Nom d'utilisateur</label>
                <input type="text" defaultValue="trader_pro" className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-2">Email</label>
                <input type="email" defaultValue="user@example.com" className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-2">Devise préférée</label>
                <select className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm appearance-none">
                  <option className="bg-gray-900">USD ($)</option>
                  <option className="bg-gray-900">EUR (€)</option>
                  <option className="bg-gray-900">CAD (C$)</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-colors">
                  💾 Sauvegarder
                </button>
                <button className="px-6 py-3 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/30 transition-colors">
                  🚪 Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="mt-8 bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
          <h2 className="text-lg font-bold text-white mb-4">📋 Mon Abonnement</h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Plan actuel", value: "Advanced", icon: "💎" },
              { label: "Prochaine facturation", value: "18 Mars 2026", icon: "📅" },
              { label: "Montant", value: "$69.99/mois", icon: "💰" },
              { label: "Statut", value: "Actif", icon: "✅" },
            ].map((s, i) => (
              <div key={i} className="bg-white/[0.03] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span>{s.icon}</span>
                  <span className="text-gray-400 text-xs">{s.label}</span>
                </div>
                <p className="text-white font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}