import Sidebar from "@/components/Sidebar";

const STEPS = [
  { step: 1, title: "Créer un Bot Telegram", desc: "Ouvrez @BotFather sur Telegram et créez un nouveau bot avec /newbot", icon: "🤖" },
  { step: 2, title: "Obtenir le Token", desc: "Copiez le token API fourni par BotFather", icon: "🔑" },
  { step: 3, title: "Configurer les Alertes", desc: "Entrez votre token et Chat ID dans les paramètres", icon: "⚙️" },
  { step: 4, title: "Tester la Connexion", desc: "Envoyez un message test pour vérifier la configuration", icon: "✅" },
];

const ALERTS = [
  { name: "Signaux AI", desc: "Recevez les signaux de trading IA en temps réel", enabled: true },
  { name: "Alertes de Prix", desc: "Notifications quand un prix cible est atteint", enabled: true },
  { name: "Whale Alerts", desc: "Mouvements de baleines détectés", enabled: false },
  { name: "News Importantes", desc: "Actualités crypto majeures", enabled: true },
  { name: "Fear & Greed", desc: "Changements significatifs du sentiment", enabled: false },
];

export default function TelegramSetup() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">📱 Configuration Telegram</h1>
        <p className="text-gray-400 mb-8">Recevez vos alertes de trading directement sur Telegram</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Setup Steps */}
          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <h2 className="text-lg font-bold text-white mb-6">🔧 Configuration</h2>
            <div className="space-y-4">
              {STEPS.map((s) => (
                <div key={s.step} className="flex items-start gap-4 p-4 bg-white/[0.03] rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl flex-shrink-0">
                    {s.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">Étape {s.step}: {s.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-1">Bot Token</label>
                <input type="text" placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-semibold block mb-1">Chat ID</label>
                <input type="text" placeholder="123456789" className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm" />
              </div>
              <button className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-colors">
                💾 Sauvegarder la Configuration
              </button>
            </div>
          </div>

          {/* Alert Settings */}
          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <h2 className="text-lg font-bold text-white mb-6">🔔 Types d'Alertes</h2>
            <div className="space-y-4">
              {ALERTS.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl">
                  <div>
                    <h3 className="text-white font-semibold text-sm">{a.name}</h3>
                    <p className="text-gray-400 text-xs mt-0.5">{a.desc}</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${a.enabled ? "bg-indigo-500" : "bg-gray-700"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${a.enabled ? "left-6" : "left-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}