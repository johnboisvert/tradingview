import Sidebar from "@/components/Sidebar";

export default function StatsAvancees() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">📊 Statistiques Avancées</h1>
        <p className="text-gray-400 mb-8">Métriques on-chain et analyses approfondies</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "MVRV Ratio", value: "2.45", change: "+0.12", icon: "📈" },
            { label: "NUPL", value: "0.58", change: "+0.03", icon: "📊" },
            { label: "Puell Multiple", value: "1.32", change: "-0.08", icon: "⛏️" },
            { label: "Stock-to-Flow", value: "56.2", change: "+2.1", icon: "📉" },
            { label: "Hash Rate", value: "625 EH/s", change: "+15", icon: "🔒" },
            { label: "Active Addresses", value: "1.2M", change: "+45K", icon: "👥" },
            { label: "Exchange Outflow", value: "12,450 BTC", change: "+2,100", icon: "📤" },
            { label: "Funding Rate", value: "0.012%", change: "-0.003", icon: "💹" },
          ].map((s, i) => (
            <div key={i} className="bg-[#111827] rounded-2xl border border-white/[0.06] p-5">
              <div className="flex items-center gap-2 mb-2">
                <span>{s.icon}</span>
                <span className="text-gray-400 text-xs">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-emerald-400 text-xs font-semibold mt-1">{s.change}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <h2 className="text-lg font-bold text-white mb-4">🏦 Distribution des Holders</h2>
            <div className="space-y-3">
              {[
                { label: "Whales (>1000 BTC)", pct: 42, color: "#8b5cf6" },
                { label: "Sharks (100-1000 BTC)", pct: 23, color: "#3b82f6" },
                { label: "Fish (10-100 BTC)", pct: 18, color: "#06b6d4" },
                { label: "Shrimps (<10 BTC)", pct: 17, color: "#22c55e" },
              ].map((h, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: h.color }} />
                  <span className="text-gray-300 text-sm flex-1">{h.label}</span>
                  <span className="text-white font-bold text-sm">{h.pct}%</span>
                  <div className="w-24 h-2 bg-gray-800 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${h.pct}%`, background: h.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8">
            <h2 className="text-lg font-bold text-white mb-4">📊 Flux des Exchanges</h2>
            <div className="space-y-4">
              {[
                { exchange: "Binance", inflow: "2,340 BTC", outflow: "3,120 BTC", net: "-780 BTC" },
                { exchange: "Coinbase", inflow: "1,890 BTC", outflow: "2,450 BTC", net: "-560 BTC" },
                { exchange: "Kraken", inflow: "890 BTC", outflow: "1,200 BTC", net: "-310 BTC" },
                { exchange: "OKX", inflow: "1,560 BTC", outflow: "1,340 BTC", net: "+220 BTC" },
              ].map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl">
                  <span className="text-white font-semibold">{e.exchange}</span>
                  <div className="flex gap-6 text-sm">
                    <span className="text-red-400">↓ {e.inflow}</span>
                    <span className="text-emerald-400">↑ {e.outflow}</span>
                    <span className={`font-bold ${e.net.startsWith("-") ? "text-emerald-400" : "text-red-400"}`}>{e.net}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}