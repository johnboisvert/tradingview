import Sidebar from "@/components/Sidebar";

const TRADES = [
  { pair: "BTC/USDT", type: "Long", entry: 94500, exit: 97200, pnl: "+2.86%", pnlUsd: "+$285.71", date: "2026-02-17", status: "closed" },
  { pair: "ETH/USDT", type: "Long", entry: 3280, exit: 3420, pnl: "+4.27%", pnlUsd: "+$427.00", date: "2026-02-16", status: "closed" },
  { pair: "SOL/USDT", type: "Short", entry: 205, exit: 198, pnl: "+3.41%", pnlUsd: "+$341.00", date: "2026-02-15", status: "closed" },
  { pair: "BNB/USDT", type: "Long", entry: 598, exit: null, pnl: "+2.34%", pnlUsd: "+$234.00", date: "2026-02-18", status: "open" },
  { pair: "AVAX/USDT", type: "Long", entry: 42.5, exit: 39.8, pnl: "-6.35%", pnlUsd: "-$635.00", date: "2026-02-14", status: "closed" },
  { pair: "LINK/USDT", type: "Long", entry: 18.2, exit: 19.8, pnl: "+8.79%", pnlUsd: "+$879.00", date: "2026-02-13", status: "closed" },
];

export default function Trades() {
  const winRate = (TRADES.filter(t => t.pnl.startsWith("+")).length / TRADES.length * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">📈 Journal de Trades</h1>
        <p className="text-gray-400 mb-8">Historique et suivi de vos trades</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Trades", value: TRADES.length.toString(), icon: "📊" },
            { label: "Win Rate", value: `${winRate}%`, icon: "🎯" },
            { label: "P&L Total", value: "+$1,531.71", icon: "💰" },
            { label: "Trades Ouverts", value: TRADES.filter(t => t.status === "open").length.toString(), icon: "🔄" },
          ].map((s, i) => (
            <div key={i} className="bg-[#111827] rounded-2xl border border-white/[0.06] p-5">
              <div className="flex items-center gap-2 mb-1">
                <span>{s.icon}</span>
                <span className="text-gray-400 text-xs">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Trades Table */}
        <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-6">
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-white/[0.06]">
                <th className="text-left pb-3">Paire</th>
                <th className="text-left pb-3">Type</th>
                <th className="text-right pb-3">Entrée</th>
                <th className="text-right pb-3">Sortie</th>
                <th className="text-right pb-3">P&L</th>
                <th className="text-right pb-3">Date</th>
                <th className="text-right pb-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {TRADES.map((t, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-4 text-white font-bold">{t.pair}</td>
                  <td className={`font-semibold ${t.type === "Long" ? "text-emerald-400" : "text-red-400"}`}>{t.type}</td>
                  <td className="text-right text-gray-300">${t.entry.toLocaleString()}</td>
                  <td className="text-right text-gray-300">{t.exit ? `$${t.exit.toLocaleString()}` : "—"}</td>
                  <td className={`text-right font-bold ${t.pnl.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>{t.pnl}</td>
                  <td className="text-right text-gray-500 text-sm">{t.date}</td>
                  <td className="text-right">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${t.status === "open" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {t.status === "open" ? "Ouvert" : "Fermé"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}