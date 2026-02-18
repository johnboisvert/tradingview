import Sidebar from "@/components/Sidebar";

const COINS = [
  { name: "Bitcoin", symbol: "BTC", dominance: 52.4, change: 0.3, color: "#f7931a" },
  { name: "Ethereum", symbol: "ETH", dominance: 17.2, change: -0.5, color: "#627eea" },
  { name: "BNB", symbol: "BNB", dominance: 3.8, change: 0.1, color: "#f3ba2f" },
  { name: "Solana", symbol: "SOL", dominance: 3.2, change: 0.8, color: "#9945ff" },
  { name: "XRP", symbol: "XRP", dominance: 2.9, change: -0.2, color: "#00aae4" },
  { name: "Cardano", symbol: "ADA", dominance: 1.4, change: 0.1, color: "#0033ad" },
  { name: "Avalanche", symbol: "AVAX", dominance: 1.1, change: -0.3, color: "#e84142" },
  { name: "Autres", symbol: "ALT", dominance: 18.0, change: -0.3, color: "#6b7280" },
];

export default function Dominance() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">👑 Dominance du Marché</h1>
        <p className="text-gray-400 mb-8">Répartition de la capitalisation du marché crypto</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pie Chart Visual */}
          <div className="lg:col-span-1 bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <h2 className="text-lg font-bold text-white mb-6">Répartition</h2>
            <div className="space-y-3">
              {COINS.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-gray-300 text-sm flex-1">{c.symbol}</span>
                  <span className="text-white font-bold text-sm">{c.dominance}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Table */}
          <div className="lg:col-span-2 bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <h2 className="text-lg font-bold text-white mb-6">Détails de la Dominance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b border-white/[0.06]">
                    <th className="text-left pb-3 font-semibold">Crypto</th>
                    <th className="text-right pb-3 font-semibold">Dominance</th>
                    <th className="text-right pb-3 font-semibold">24h</th>
                    <th className="text-right pb-3 font-semibold">Barre</th>
                  </tr>
                </thead>
                <tbody>
                  {COINS.map((c, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: c.color }}>
                            {c.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{c.name}</p>
                            <p className="text-gray-500 text-xs">{c.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right text-white font-bold">{c.dominance}%</td>
                      <td className={`text-right font-semibold ${c.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {c.change >= 0 ? "+" : ""}{c.change}%
                      </td>
                      <td className="text-right w-40">
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${c.dominance * 1.9}%`, background: c.color }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}