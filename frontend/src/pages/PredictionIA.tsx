import Sidebar from "@/components/Sidebar";

const PREDICTIONS = [
  { coin: "BTC", current: 97245, predicted: 105000, confidence: 78, direction: "up", timeframe: "7 jours" },
  { coin: "ETH", current: 3421, predicted: 3800, confidence: 72, direction: "up", timeframe: "7 jours" },
  { coin: "SOL", current: 198, predicted: 225, confidence: 82, direction: "up", timeframe: "7 jours" },
  { coin: "BNB", current: 612, predicted: 580, confidence: 65, direction: "down", timeframe: "7 jours" },
  { coin: "XRP", current: 2.45, predicted: 2.80, confidence: 68, direction: "up", timeframe: "7 jours" },
  { coin: "ADA", current: 0.89, predicted: 1.05, confidence: 71, direction: "up", timeframe: "7 jours" },
];

export default function PredictionIA() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">🔮 Prédiction IA</h1>
        <p className="text-gray-400 mb-8">Prédictions de prix basées sur l'intelligence artificielle</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PREDICTIONS.map((p, i) => {
            const changePct = ((p.predicted - p.current) / p.current * 100).toFixed(1);
            const isUp = p.direction === "up";
            return (
              <div key={i} className="bg-[#111827] rounded-2xl border border-white/[0.06] p-6 hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isUp ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {p.coin}
                    </div>
                    <div>
                      <p className="text-white font-bold">{p.coin}/USDT</p>
                      <p className="text-gray-500 text-xs">{p.timeframe}</p>
                    </div>
                  </div>
                  <span className={`text-2xl ${isUp ? "" : "rotate-180 inline-block"}`}>{isUp ? "📈" : "📉"}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-500 text-xs">Prix actuel</p>
                    <p className="text-white font-bold">${p.current.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Prédiction</p>
                    <p className={`font-bold ${isUp ? "text-emerald-400" : "text-red-400"}`}>${p.predicted.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-bold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                    {isUp ? "+" : ""}{changePct}%
                  </span>
                  <span className="text-gray-400 text-sm">Confiance: {p.confidence}%</span>
                </div>

                <div className="w-full h-2 bg-gray-800 rounded-full">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${p.confidence}%`,
                    background: p.confidence >= 75 ? "#22c55e" : p.confidence >= 60 ? "#eab308" : "#ef4444"
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 p-6">
          <p className="text-indigo-400 font-semibold mb-2">⚠️ Avertissement</p>
          <p className="text-gray-300 text-sm">
            Les prédictions IA sont basées sur des modèles statistiques et ne constituent pas des conseils financiers.
            Le marché crypto est volatile et les performances passées ne garantissent pas les résultats futurs.
          </p>
        </div>
      </main>
    </div>
  );
}