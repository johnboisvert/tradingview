import Sidebar from "@/components/Sidebar";

const NEWS = [
  { title: "Bitcoin franchit les $97,000 - Nouveau ATH en vue?", source: "CoinDesk", time: "Il y a 2h", category: "Bitcoin", sentiment: "bullish" },
  { title: "Ethereum 2.0: Les stakers atteignent un record historique", source: "The Block", time: "Il y a 3h", category: "Ethereum", sentiment: "bullish" },
  { title: "La SEC approuve un nouvel ETF crypto spot", source: "Bloomberg", time: "Il y a 5h", category: "Régulation", sentiment: "bullish" },
  { title: "Solana DeFi TVL dépasse les $15 milliards", source: "DeFi Llama", time: "Il y a 6h", category: "DeFi", sentiment: "bullish" },
  { title: "Avertissement: Nouvelle vague de scams sur Telegram", source: "CryptoSlate", time: "Il y a 8h", category: "Sécurité", sentiment: "bearish" },
  { title: "Analyse: Le marché entre en phase d'accumulation", source: "Glassnode", time: "Il y a 10h", category: "Analyse", sentiment: "neutral" },
  { title: "Binance lance de nouvelles paires de trading", source: "Binance Blog", time: "Il y a 12h", category: "Exchange", sentiment: "neutral" },
  { title: "MicroStrategy achète 5000 BTC supplémentaires", source: "Reuters", time: "Il y a 14h", category: "Institutionnel", sentiment: "bullish" },
];

function getSentimentBadge(s: string) {
  if (s === "bullish") return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">🟢 Haussier</span>;
  if (s === "bearish") return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400">🔴 Baissier</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400">⚪ Neutre</span>;
}

export default function News() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">📰 Nouvelles Crypto</h1>
        <p className="text-gray-400 mb-8">Les dernières actualités du marché crypto</p>

        <div className="space-y-4">
          {NEWS.map((n, i) => (
            <div key={i} className="bg-[#111827] rounded-2xl border border-white/[0.06] p-6 hover:bg-white/[0.02] transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2">{n.title}</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-indigo-400 font-semibold">{n.source}</span>
                    <span className="text-gray-500">{n.time}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-white/[0.05] text-gray-300 text-xs font-semibold">{n.category}</span>
                  </div>
                </div>
                {getSentimentBadge(n.sentiment)}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}