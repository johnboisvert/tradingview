import Sidebar from "@/components/Sidebar";

const PHASES = [
  { name: "Accumulation", status: "completed", desc: "Phase d'achat silencieux par les smart money", period: "2024 Q1-Q3", pct: 100 },
  { name: "Markup Early", status: "completed", desc: "Début de la tendance haussière, breakout des résistances", period: "2024 Q4 - 2025 Q2", pct: 100 },
  { name: "Markup Mid", status: "current", desc: "Accélération haussière, FOMO institutionnel", period: "2025 Q3 - 2026 Q1", pct: 65 },
  { name: "Markup Late", status: "upcoming", desc: "Euphorie maximale, altseason explosive", period: "2026 Q2-Q3", pct: 0 },
  { name: "Distribution", status: "upcoming", desc: "Smart money vend, retail achète", period: "2026 Q4", pct: 0 },
];

export default function BullrunPhase() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">🚀 Bullrun Phase Tracker</h1>
        <p className="text-gray-400 mb-8">Suivez la progression du cycle haussier crypto</p>

        {/* Current Phase */}
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30 p-8 mb-8">
          <div className="flex items-center gap-4">
            <span className="text-5xl">🚀</span>
            <div>
              <p className="text-indigo-400 text-sm font-semibold">Phase actuelle</p>
              <h2 className="text-3xl font-black text-white">Markup Mid-Cycle</h2>
              <p className="text-gray-300 mt-1">Nous sommes dans la phase d'accélération du bull run. Le momentum est fort.</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-5xl font-black text-indigo-400">65%</p>
              <p className="text-gray-400 text-sm">du cycle complété</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {PHASES.map((p, i) => (
            <div key={i} className={`bg-[#111827] rounded-2xl border p-6 ${p.status === "current" ? "border-indigo-500/50" : "border-white/[0.06]"}`}>
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                  p.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                  p.status === "current" ? "bg-indigo-500/20 text-indigo-400" :
                  "bg-gray-500/20 text-gray-500"
                }`}>
                  {p.status === "completed" ? "✅" : p.status === "current" ? "🔄" : "⏳"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-bold text-lg">{p.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      p.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                      p.status === "current" ? "bg-indigo-500/20 text-indigo-400" :
                      "bg-gray-500/20 text-gray-500"
                    }`}>
                      {p.status === "completed" ? "Terminé" : p.status === "current" ? "En cours" : "À venir"}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{p.desc}</p>
                  <p className="text-gray-500 text-xs mt-1">{p.period}</p>
                </div>
                <div className="w-32">
                  <div className="w-full h-2 bg-gray-800 rounded-full">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${p.pct}%`,
                      background: p.status === "completed" ? "#22c55e" : p.status === "current" ? "#6366f1" : "#374151"
                    }} />
                  </div>
                  <p className="text-gray-500 text-xs text-right mt-1">{p.pct}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}