import Sidebar from "@/components/Sidebar";

export default function RiskManagement() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">⚠️ Risk Management</h1>
        <p className="text-gray-400 mb-8">Gérez vos risques et protégez votre capital</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Risk Score */}
          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8 text-center">
            <h2 className="text-lg font-bold text-white mb-4">Score de Risque</h2>
            <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r="85" fill="none" stroke="#1f2937" strokeWidth="12" />
                <circle cx="100" cy="100" r="85" fill="none" stroke="#22c55e" strokeWidth="12"
                  strokeDasharray={`${(35 / 100) * 534} 534`} strokeLinecap="round" transform="rotate(-90 100 100)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-emerald-400">35</span>
                <span className="text-sm text-emerald-400 font-bold">Faible</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4">Votre exposition au risque est bien gérée</p>
          </div>

          {/* Rules */}
          <div className="lg:col-span-2 bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <h2 className="text-lg font-bold text-white mb-6">📋 Règles de Gestion</h2>
            <div className="space-y-4">
              {[
                { rule: "Risque max par trade", value: "2%", status: "ok", desc: "Ne jamais risquer plus de 2% du capital par position" },
                { rule: "Stop Loss obligatoire", value: "Actif", status: "ok", desc: "Chaque trade doit avoir un stop loss défini" },
                { rule: "Exposition max", value: "30%", status: "warning", desc: "Ne pas dépasser 30% du portfolio en positions ouvertes" },
                { rule: "Corrélation max", value: "3 trades", status: "ok", desc: "Maximum 3 trades corrélés simultanément" },
                { rule: "Drawdown max", value: "15%", status: "ok", desc: "Arrêter de trader si le drawdown dépasse 15%" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${r.status === "ok" ? "bg-emerald-400" : "bg-yellow-400"}`} />
                      <h3 className="text-white font-semibold">{r.rule}</h3>
                    </div>
                    <p className="text-gray-400 text-sm mt-1 ml-4">{r.desc}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${r.status === "ok" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div className="mt-8 bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
          <h2 className="text-lg font-bold text-white mb-6">💼 Allocation du Portfolio</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { asset: "BTC", pct: 45, color: "#f7931a" },
              { asset: "ETH", pct: 25, color: "#627eea" },
              { asset: "Altcoins", pct: 20, color: "#9945ff" },
              { asset: "Stablecoins", pct: 10, color: "#22c55e" },
            ].map((a, i) => (
              <div key={i} className="bg-white/[0.03] rounded-xl p-5 text-center">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold" style={{ background: a.color }}>
                  {a.pct}%
                </div>
                <p className="text-white font-bold">{a.asset}</p>
                <div className="w-full h-2 bg-gray-800 rounded-full mt-3">
                  <div className="h-full rounded-full" style={{ width: `${a.pct}%`, background: a.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}