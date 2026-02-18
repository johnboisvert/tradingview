import Sidebar from "@/components/Sidebar";

const INDICATORS = [
  { name: "Tendance BTC", value: "Haussier", score: 82, color: "#22c55e" },
  { name: "Volatilité", value: "Modérée", score: 55, color: "#eab308" },
  { name: "Volume", value: "En hausse", score: 71, color: "#22c55e" },
  { name: "Momentum", value: "Fort", score: 78, color: "#22c55e" },
  { name: "Corrélation S&P500", value: "Faible", score: 35, color: "#3b82f6" },
  { name: "Liquidité", value: "Bonne", score: 68, color: "#22c55e" },
];

export default function MarketRegime() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">📊 Market Regime</h1>
        <p className="text-gray-400 mb-8">Analyse du régime de marché actuel par l'IA</p>

        {/* Current Regime */}
        <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <span className="text-5xl">🐂</span>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Régime actuel</p>
              <h2 className="text-3xl font-black text-emerald-400 mb-2">BULL MARKET</h2>
              <p className="text-gray-300">Le marché montre des signes clairs de tendance haussière avec un momentum fort et un volume croissant.</p>
            </div>
          </div>
        </div>

        {/* Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {INDICATORS.map((ind, i) => (
            <div key={i} className="bg-[#111827] rounded-2xl border border-white/[0.06] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">{ind.name}</span>
                <span className="text-white font-bold">{ind.score}/100</span>
              </div>
              <p className="text-lg font-bold mb-3" style={{ color: ind.color }}>{ind.value}</p>
              <div className="w-full h-2 bg-gray-800 rounded-full">
                <div className="h-full rounded-full" style={{ width: `${ind.score}%`, background: ind.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recommendation */}
        <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
          <h2 className="text-lg font-bold text-white mb-4">🎯 Recommandations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { action: "Accumuler BTC", risk: "Faible", reason: "Tendance haussière confirmée" },
              { action: "Swing Trade Altcoins", risk: "Moyen", reason: "Altseason en approche" },
              { action: "Éviter le leverage", risk: "Élevé", reason: "Volatilité modérée mais imprévisible" },
            ].map((r, i) => (
              <div key={i} className="bg-white/[0.03] rounded-xl p-5">
                <h3 className="text-white font-bold mb-2">{r.action}</h3>
                <p className="text-gray-400 text-sm mb-2">{r.reason}</p>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${r.risk === "Faible" ? "bg-emerald-500/20 text-emerald-400" : r.risk === "Moyen" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                  Risque: {r.risk}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}