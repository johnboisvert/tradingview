import Sidebar from "@/components/Sidebar";
import { Calendar, ExternalLink, Clock } from "lucide-react";

const CAL_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

interface CryptoEvent {
  date: string; title: string; category: string; impact: "high" | "medium" | "low";
  description: string; coins: string[];
}

const EVENTS: CryptoEvent[] = [
  { date: "2026-02-18", title: "Mise à jour Ethereum Pectra", category: "Upgrade", impact: "high", description: "Déploiement de la mise à jour Pectra sur le mainnet Ethereum", coins: ["ETH"] },
  { date: "2026-02-19", title: "Rapport CPI US", category: "Macro", impact: "high", description: "Publication de l'indice des prix à la consommation américain", coins: ["BTC", "ETH"] },
  { date: "2026-02-20", title: "Solana Breakpoint Conference", category: "Événement", impact: "medium", description: "Conférence annuelle de l'écosystème Solana", coins: ["SOL"] },
  { date: "2026-02-21", title: "Expiration Options BTC", category: "Trading", impact: "high", description: "Expiration massive d'options Bitcoin sur Deribit", coins: ["BTC"] },
  { date: "2026-02-22", title: "Airdrop Arbitrum Season 2", category: "Airdrop", impact: "medium", description: "Distribution de tokens ARB aux utilisateurs actifs", coins: ["ARB"] },
  { date: "2026-02-24", title: "Réunion FOMC", category: "Macro", impact: "high", description: "Décision de la Fed sur les taux d'intérêt", coins: ["BTC", "ETH"] },
  { date: "2026-02-25", title: "Chainlink CCIP v2 Launch", category: "Upgrade", impact: "medium", description: "Lancement de CCIP v2 pour l'interopérabilité cross-chain", coins: ["LINK"] },
  { date: "2026-02-26", title: "Polkadot Parachain Auctions", category: "Événement", impact: "medium", description: "Nouvelles enchères de parachains sur Polkadot", coins: ["DOT"] },
  { date: "2026-02-27", title: "Rapport PIB US Q4", category: "Macro", impact: "high", description: "Publication du PIB américain du 4ème trimestre", coins: ["BTC"] },
  { date: "2026-02-28", title: "Uniswap V4 Mainnet", category: "Upgrade", impact: "high", description: "Déploiement de Uniswap V4 avec les hooks sur mainnet", coins: ["UNI", "ETH"] },
  { date: "2026-03-01", title: "Cardano Voltaire Governance", category: "Upgrade", impact: "medium", description: "Activation de la gouvernance décentralisée Voltaire", coins: ["ADA"] },
  { date: "2026-03-03", title: "Bitcoin ETF Rebalancing", category: "Trading", impact: "high", description: "Rééquilibrage trimestriel des ETF Bitcoin spot", coins: ["BTC"] },
  { date: "2026-03-05", title: "Avalanche Subnet Launch", category: "Upgrade", impact: "medium", description: "Lancement de nouveaux subnets gaming sur Avalanche", coins: ["AVAX"] },
  { date: "2026-03-07", title: "Rapport Emploi US (NFP)", category: "Macro", impact: "high", description: "Publication des chiffres de l'emploi non-agricole", coins: ["BTC", "ETH"] },
  { date: "2026-03-10", title: "Cosmos IBC 2.0", category: "Upgrade", impact: "medium", description: "Mise à jour majeure du protocole IBC", coins: ["ATOM"] },
  { date: "2026-03-12", title: "Near Protocol Nightshade 2.0", category: "Upgrade", impact: "medium", description: "Sharding amélioré pour Near Protocol", coins: ["NEAR"] },
  { date: "2026-03-15", title: "Expiration Options ETH", category: "Trading", impact: "high", description: "Expiration trimestrielle des options Ethereum", coins: ["ETH"] },
  { date: "2026-03-18", title: "Réunion FOMC", category: "Macro", impact: "high", description: "Prochaine décision de la Fed sur les taux", coins: ["BTC", "ETH"] },
  { date: "2026-03-20", title: "Optimism Superchain Update", category: "Upgrade", impact: "medium", description: "Mise à jour Superchain pour l'écosystème Optimism", coins: ["OP"] },
  { date: "2026-03-25", title: "Binance Launchpool New Project", category: "Événement", impact: "medium", description: "Nouveau projet sur Binance Launchpool", coins: ["BNB"] },
];

const CATEGORIES: Record<string, { color: string; emoji: string }> = {
  "Upgrade": { color: "#8b5cf6", emoji: "🔧" },
  "Macro": { color: "#ef4444", emoji: "🏦" },
  "Événement": { color: "#3b82f6", emoji: "🎪" },
  "Trading": { color: "#f59e0b", emoji: "📊" },
  "Airdrop": { color: "#22c55e", emoji: "🎁" },
};

const IMPACT_STYLES = {
  high: { label: "Élevé", color: "#ef4444", bg: "bg-red-500/20" },
  medium: { label: "Moyen", color: "#f59e0b", bg: "bg-amber-500/20" },
  low: { label: "Faible", color: "#6b7280", bg: "bg-gray-500/20" },
};

export default function Calendrier() {
  const today = new Date().toISOString().split("T")[0];
  const upcoming = EVENTS.filter((e) => e.date >= today);
  const past = EVENTS.filter((e) => e.date < today);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={CAL_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Calendar className="w-7 h-7 text-blue-400" />
                <h1 className="text-2xl font-extrabold">Calendrier Crypto</h1>
              </div>
              <p className="text-sm text-gray-400">Événements importants • Upgrades • Macro-économie • Airdrops</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Événements à Venir</p>
            <p className="text-2xl font-extrabold text-blue-400">{upcoming.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Impact Élevé</p>
            <p className="text-2xl font-extrabold text-red-400">{upcoming.filter((e) => e.impact === "high").length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Upgrades</p>
            <p className="text-2xl font-extrabold text-purple-400">{upcoming.filter((e) => e.category === "Upgrade").length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Macro</p>
            <p className="text-2xl font-extrabold text-amber-400">{upcoming.filter((e) => e.category === "Macro").length}</p>
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">📅 Événements à Venir</h2>
          <div className="space-y-3">
            {upcoming.map((e, i) => {
              const cat = CATEGORIES[e.category] || { color: "#6b7280", emoji: "📌" };
              const imp = IMPACT_STYLES[e.impact];
              const isToday = e.date === today;
              return (
                <div key={i} className={`p-4 rounded-xl border transition-all hover:border-white/[0.1] ${isToday ? "bg-indigo-500/10 border-indigo-500/20" : "bg-black/20 border-white/[0.04]"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-lg">{cat.emoji}</span>
                        <h3 className="font-bold text-sm">{e.title}</h3>
                        {isToday && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">AUJOURD'HUI</span>}
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{e.description}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {new Date(e.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: cat.color + "20", color: cat.color }}>{e.category}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${imp.bg}`} style={{ color: imp.color }}>Impact: {imp.label}</span>
                        {e.coins.map((c, j) => (
                          <span key={j} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/[0.06] text-gray-300">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Past */}
        {past.length > 0 && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-500">📋 Événements Passés</h2>
            <div className="space-y-2 opacity-60">
              {past.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span>{CATEGORIES[e.category]?.emoji || "📌"}</span>
                    <span className="text-sm font-semibold">{e.title}</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(e.date).toLocaleDateString("fr-FR")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}