import Sidebar from "@/components/Sidebar";

const WATCHLIST = [
  { name: "Bitcoin", symbol: "BTC", price: "97,245", change: 2.4, alert: "98,000", mcap: "$1.2T" },
  { name: "Ethereum", symbol: "ETH", price: "3,421", change: -1.2, alert: "3,500", mcap: "$412B" },
  { name: "Solana", symbol: "SOL", price: "198.75", change: 8.5, alert: "210", mcap: "$86B" },
  { name: "Chainlink", symbol: "LINK", price: "19.82", change: 5.6, alert: "22", mcap: "$12B" },
  { name: "Injective", symbol: "INJ", price: "38.45", change: 12.4, alert: "45", mcap: "$3.5B" },
  { name: "Render", symbol: "RENDER", price: "11.23", change: 4.7, alert: "15", mcap: "$5.8B" },
  { name: "Near Protocol", symbol: "NEAR", price: "7.85", change: 7.3, alert: "10", mcap: "$8.2B" },
  { name: "Sui", symbol: "SUI", price: "4.12", change: -1.5, alert: "5", mcap: "$5.1B" },
];

export default function Watchlist() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">👁️ Watchlist</h1>
        <p className="text-gray-400 mb-8">Surveillez vos cryptos favorites et configurez des alertes</p>

        <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-6">
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-white/[0.06]">
                <th className="text-left pb-3">Crypto</th>
                <th className="text-right pb-3">Prix</th>
                <th className="text-right pb-3">24h</th>
                <th className="text-right pb-3">Market Cap</th>
                <th className="text-right pb-3">Alerte</th>
                <th className="text-right pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {WATCHLIST.map((w, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                        {w.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{w.name}</p>
                        <p className="text-gray-500 text-xs">{w.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right text-white font-bold">${w.price}</td>
                  <td className={`text-right font-semibold ${w.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {w.change >= 0 ? "+" : ""}{w.change}%
                  </td>
                  <td className="text-right text-gray-400">{w.mcap}</td>
                  <td className="text-right text-yellow-400 font-semibold">${w.alert}</td>
                  <td className="text-right">
                    <button className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold hover:bg-indigo-500/30 transition-colors">
                      📊 Détails
                    </button>
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