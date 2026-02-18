import Sidebar from "@/components/Sidebar";
import { Trophy, Star, TrendingUp, Users } from "lucide-react";

const SS_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/4b6e1138-5e13-42c7-9e5d-95ba3808c41a.png";

interface Story {
  name: string; avatar: string; role: string; profit: string; duration: string;
  strategy: string; quote: string; rating: number; coins: string[];
}

const STORIES: Story[] = [
  { name: "Thomas M.", avatar: "🧑‍💻", role: "Développeur", profit: "+340%", duration: "18 mois", strategy: "DCA + Analyse Technique", quote: "CryptoIA m'a permis d'identifier les meilleurs points d'entrée grâce aux signaux RSI. Mon portfolio a explosé !", rating: 5, coins: ["BTC", "ETH", "SOL"] },
  { name: "Marie L.", avatar: "👩‍🔬", role: "Analyste Financière", profit: "+215%", duration: "12 mois", strategy: "Swing Trading", quote: "Les prédictions IA et le Fear & Greed Index m'ont aidée à timer le marché. Résultats impressionnants.", rating: 5, coins: ["ETH", "LINK", "AAVE"] },
  { name: "Pierre D.", avatar: "👨‍💼", role: "Entrepreneur", profit: "+180%", duration: "24 mois", strategy: "DCA Hebdomadaire", quote: "J'ai commencé avec le DCA sur BTC et ETH. La simplicité de la plateforme m'a convaincu de rester.", rating: 5, coins: ["BTC", "ETH"] },
  { name: "Sophie R.", avatar: "👩‍🎓", role: "Étudiante", profit: "+420%", duration: "10 mois", strategy: "Gem Hunter + Altcoins", quote: "Le Gem Hunter m'a fait découvrir des pépites avant tout le monde. SOL à $20, AVAX à $10... Incroyable !", rating: 5, coins: ["SOL", "AVAX", "ARB"] },
  { name: "Lucas B.", avatar: "🧑‍🏫", role: "Professeur", profit: "+95%", duration: "6 mois", strategy: "Gestion des Risques", quote: "Grâce à l'outil de gestion des risques, j'ai appris à dimensionner mes positions correctement. Plus de pertes catastrophiques.", rating: 4, coins: ["BTC", "ETH", "DOT"] },
  { name: "Emma V.", avatar: "👩‍⚕️", role: "Médecin", profit: "+275%", duration: "15 mois", strategy: "Analyse Technique + IA", quote: "L'assistant IA répond à toutes mes questions. Les graphiques et l'analyse technique sont d'une qualité professionnelle.", rating: 5, coins: ["BTC", "SOL", "LINK"] },
  { name: "Antoine G.", avatar: "🧑‍🔧", role: "Ingénieur", profit: "+160%", duration: "8 mois", strategy: "Breakout Trading", quote: "Les alertes de breakout et les signaux de la page Stratégies m'ont permis de capturer des mouvements majeurs.", rating: 4, coins: ["ETH", "SOL", "DOGE"] },
  { name: "Julie F.", avatar: "👩‍💻", role: "Designer UX", profit: "+310%", duration: "20 mois", strategy: "Portfolio Diversifié", quote: "La watchlist et le simulateur m'ont aidée à construire un portfolio équilibré. Les résultats parlent d'eux-mêmes.", rating: 5, coins: ["BTC", "ETH", "SOL", "ADA"] },
];

export default function SuccessStories() {
  const avgProfit = STORIES.reduce((s, st) => s + parseInt(st.profit.replace(/[^0-9-]/g, "")), 0) / STORIES.length;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={SS_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Trophy className="w-7 h-7 text-amber-400" />
                <h1 className="text-2xl font-extrabold">Success Stories</h1>
              </div>
              <p className="text-sm text-gray-400">Témoignages de nos utilisateurs • Résultats vérifiés</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Témoignages</p>
            <p className="text-2xl font-extrabold">{STORIES.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Profit Moyen</p>
            <p className="text-2xl font-extrabold text-emerald-400">+{avgProfit.toFixed(0)}%</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Note Moyenne</p>
            <p className="text-2xl font-extrabold text-amber-400">{(STORIES.reduce((s, st) => s + st.rating, 0) / STORIES.length).toFixed(1)} ⭐</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Utilisateurs Actifs</p>
            <p className="text-2xl font-extrabold text-blue-400">12,500+</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STORIES.map((s, i) => (
            <div key={i} className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.1] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{s.avatar}</span>
                <div>
                  <h3 className="font-bold">{s.name}</h3>
                  <p className="text-xs text-gray-500">{s.role}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xl font-extrabold text-emerald-400">{s.profit}</p>
                  <p className="text-xs text-gray-500">{s.duration}</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 italic mb-4">"{s.quote}"</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-semibold">Stratégie:</span>
                  <span className="text-xs font-bold text-indigo-400">{s.strategy}</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`w-3.5 h-3.5 ${j < s.rating ? "text-amber-400 fill-amber-400" : "text-gray-700"}`} />
                  ))}
                </div>
              </div>
              <div className="flex gap-1.5 mt-3">
                {s.coins.map((c, j) => (
                  <span key={j} className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.06] text-gray-300">{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}