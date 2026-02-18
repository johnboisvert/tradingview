import Sidebar from "@/components/Sidebar";

const PLANS = [
  { name: "Free", price: "0", period: "/mois", features: ["Dashboard de base", "Fear & Greed Index", "Heatmap", "Actualités crypto"], color: "gray", popular: false },
  { name: "Premium", price: "29.99", period: "/mois", features: ["Tout Free +", "AI Scanner", "Watchlist avancée", "Alertes Telegram", "Calculatrice avancée"], color: "blue", popular: false },
  { name: "Advanced", price: "69.99", period: "/mois", features: ["Tout Premium +", "Whale Watcher", "Prédiction IA", "Stats avancées", "Risk Management", "Journal de trades"], color: "purple", popular: true },
  { name: "Pro", price: "119.99", period: "/mois", features: ["Tout Advanced +", "AI Assistant illimité", "Signaux en temps réel", "Market Regime", "Simulation avancée", "Support prioritaire"], color: "amber", popular: false },
];

function getColorClasses(color: string) {
  const map: Record<string, { bg: string; text: string; btn: string }> = {
    gray: { bg: "bg-gray-500/10", text: "text-gray-400", btn: "bg-gray-600 hover:bg-gray-500" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", btn: "bg-blue-600 hover:bg-blue-500" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", btn: "bg-purple-600 hover:bg-purple-500" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", btn: "bg-amber-600 hover:bg-amber-500" },
  };
  return map[color] || map.gray;
}

export default function Abonnements() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">💎 Abonnements</h1>
        <p className="text-gray-400 mb-8">Choisissez le plan qui correspond à vos besoins</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((p, i) => {
            const c = getColorClasses(p.color);
            return (
              <div key={i} className={`relative bg-[#111827] rounded-2xl border ${p.popular ? "border-purple-500/50" : "border-white/[0.06]"} p-6 flex flex-col`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-bold">
                    Populaire
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center mb-4`}>
                  <span className={`font-bold text-sm ${c.text}`}>{p.name.slice(0, 2)}</span>
                </div>
                <h3 className="text-white font-bold text-lg">{p.name}</h3>
                <div className="flex items-baseline gap-1 mt-2 mb-4">
                  <span className="text-3xl font-black text-white">${p.price}</span>
                  <span className="text-gray-500 text-sm">{p.period}</span>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-emerald-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-colors ${c.btn}`}>
                  {p.price === "0" ? "Commencer" : "S'abonner"}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}