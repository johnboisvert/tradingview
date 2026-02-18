import Sidebar from "@/components/Sidebar";

const EVENTS = [
  { date: "2026-02-20", title: "Bitcoin Halving Countdown Update", type: "Bitcoin", importance: "high" },
  { date: "2026-02-22", title: "Ethereum Dencun Upgrade Phase 2", type: "Ethereum", importance: "high" },
  { date: "2026-02-25", title: "Réunion Fed - Taux d'intérêt", type: "Macro", importance: "high" },
  { date: "2026-02-28", title: "Expiration Options BTC $8.2B", type: "Options", importance: "medium" },
  { date: "2026-03-01", title: "Solana Breakpoint Conference", type: "Solana", importance: "medium" },
  { date: "2026-03-05", title: "CPI Data Release", type: "Macro", importance: "high" },
  { date: "2026-03-10", title: "Chainlink CCIP v2 Launch", type: "DeFi", importance: "medium" },
  { date: "2026-03-15", title: "Token Unlock: ARB 1.1B tokens", type: "Unlock", importance: "medium" },
];

function getImportanceColor(imp: string) {
  if (imp === "high") return "bg-red-500/20 text-red-400 border-red-500/30";
  if (imp === "medium") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    Bitcoin: "bg-orange-500/20 text-orange-400",
    Ethereum: "bg-blue-500/20 text-blue-400",
    Macro: "bg-purple-500/20 text-purple-400",
    Options: "bg-pink-500/20 text-pink-400",
    Solana: "bg-violet-500/20 text-violet-400",
    DeFi: "bg-cyan-500/20 text-cyan-400",
    Unlock: "bg-amber-500/20 text-amber-400",
  };
  return colors[type] || "bg-gray-500/20 text-gray-400";
}

export default function Calendrier() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">📅 Calendrier Crypto</h1>
        <p className="text-gray-400 mb-8">Événements importants et dates clés du marché</p>

        <div className="space-y-4">
          {EVENTS.map((e, i) => (
            <div key={i} className="bg-[#111827] rounded-2xl border border-white/[0.06] p-6 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-6">
                <div className="text-center flex-shrink-0 w-16">
                  <p className="text-indigo-400 text-xs font-semibold">{new Date(e.date).toLocaleDateString("fr-FR", { month: "short" })}</p>
                  <p className="text-white text-2xl font-black">{new Date(e.date).getDate()}</p>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-1">{e.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${getTypeColor(e.type)}`}>{e.type}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${getImportanceColor(e.importance)}`}>
                      {e.importance === "high" ? "🔴 Important" : "🟡 Moyen"}
                    </span>
                  </div>
                </div>
                <div className="text-gray-500 text-sm">{e.date}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}