import Sidebar from "@/components/Sidebar";

const ALTCOINS = [
  { name: "Solana", symbol: "SOL", perf7d: 18.5, perf30d: 45.2, score: 92 },
  { name: "Avalanche", symbol: "AVAX", perf7d: 15.2, perf30d: 38.7, score: 87 },
  { name: "Chainlink", symbol: "LINK", perf7d: 12.8, perf30d: 32.1, score: 82 },
  { name: "Polygon", symbol: "MATIC", perf7d: 10.5, perf30d: 28.9, score: 78 },
  { name: "Cardano", symbol: "ADA", perf7d: 8.3, perf30d: 22.4, score: 71 },
  { name: "Polkadot", symbol: "DOT", perf7d: 7.1, perf30d: 19.8, score: 65 },
  { name: "Near Protocol", symbol: "NEAR", perf7d: 14.2, perf30d: 41.3, score: 89 },
  { name: "Injective", symbol: "INJ", perf7d: 11.7, perf30d: 35.6, score: 84 },
];

export default function AltcoinSeason() {
  const seasonIndex = 73;
  const isSeason = seasonIndex >= 75;

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">🌟 Altcoin Season Index</h1>
        <p className="text-gray-400 mb-8">Détectez les cycles de surperformance des altcoins vs Bitcoin</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Index Gauge */}
          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8 text-center">
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r="85" fill="none" stroke="#1f2937" strokeWidth="12" />
                <circle cx="100" cy="100" r="85" fill="none" stroke={isSeason ? "#22c55e" : "#eab308"} strokeWidth="12"
                  strokeDasharray={`${(seasonIndex / 100) * 534} 534`} strokeLinecap="round"
                  transform="rotate(-90 100 100)" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white">{seasonIndex}</span>
                <span className={`text-sm font-bold mt-1 ${isSeason ? "text-emerald-400" : "text-yellow-400"}`}>
                  {isSeason ? "Altcoin Season!" : "Presque Altseason"}
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              {seasonIndex >= 75 ? "75%+ des top 50 altcoins surperforment BTC" : `${seasonIndex}% des altcoins surperforment BTC sur 90 jours`}
            </p>
          </div>

          {/* Top Performers */}
          <div className="lg:col-span-2 bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <h2 className="text-lg font-bold text-white mb-4">🏆 Top Altcoins Performers</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b border-white/[0.06]">
                    <th className="text-left pb-3">Altcoin</th>
                    <th className="text-right pb-3">7j</th>
                    <th className="text-right pb-3">30j</th>
                    <th className="text-right pb-3">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {ALTCOINS.map((c, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-sm">{c.name}</span>
                          <span className="text-gray-500 text-xs">{c.symbol}</span>
                        </div>
                      </td>
                      <td className="text-right text-emerald-400 font-semibold text-sm">+{c.perf7d}%</td>
                      <td className="text-right text-emerald-400 font-semibold text-sm">+{c.perf30d}%</td>
                      <td className="text-right">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${c.score >= 85 ? "bg-emerald-500/20 text-emerald-400" : c.score >= 70 ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400"}`}>
                          {c.score}
                        </span>
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