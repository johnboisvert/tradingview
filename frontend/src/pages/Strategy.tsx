import Sidebar from "@/components/Sidebar";

const STRATEGIES = [
  { name: "DCA Bitcoin", type: "Long Terme", risk: "Faible", roi: "+127%", status: "active", desc: "Achat régulier de BTC chaque semaine" },
  { name: "Swing Trading ETH", type: "Moyen Terme", risk: "Moyen", roi: "+85%", status: "active", desc: "Trading sur les supports/résistances ETH" },
  { name: "Scalping SOL", type: "Court Terme", risk: "Élevé", roi: "+42%", status: "paused", desc: "Scalping sur les mouvements rapides de SOL" },
  { name: "Grid Bot BNB", type: "Automatisé", risk: "Moyen", roi: "+31%", status: "active", desc: "Bot de grid trading sur BNB/USDT" },
  { name: "Breakout AVAX", type: "Court Terme", risk: "Élevé", roi: "+68%", status: "active", desc: "Entrée sur cassure de résistance AVAX" },
];

export default function Strategy() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">📊 Stratégies de Trading</h1>
        <p className="text-gray-400 mb-8">Gérez et suivez vos stratégies de trading crypto</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Stratégies actives", value: "4", icon: "📊" },
            { label: "ROI moyen", value: "+70.6%", icon: "📈" },
            { label: "Win Rate", value: "72%", icon: "🎯" },
            { label: "Profit total", value: "$12,450", icon: "💰" },
          ].map((s, i) => (
            <div key={i} className="bg-[#111827] rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-gray-400 text-sm">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Strategies List */}
        <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
          <h2 className="text-lg font-bold text-white mb-6">Mes Stratégies</h2>
          <div className="space-y-4">
            {STRATEGIES.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-5 bg-white/[0.03] rounded-xl hover:bg-white/[0.05] transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-bold">{s.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {s.status === "active" ? "Actif" : "En pause"}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{s.desc}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Type</p>
                    <p className="text-white font-semibold">{s.type}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">Risque</p>
                    <p className={`font-semibold ${s.risk === "Faible" ? "text-emerald-400" : s.risk === "Moyen" ? "text-yellow-400" : "text-red-400"}`}>{s.risk}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs">ROI</p>
                    <p className="text-emerald-400 font-bold">{s.roi}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}