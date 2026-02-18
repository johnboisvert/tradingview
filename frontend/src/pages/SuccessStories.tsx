import Sidebar from "@/components/Sidebar";

const STORIES = [
  { name: "Marc D.", roi: "+342%", period: "6 mois", strategy: "DCA + Swing", avatar: "🧑‍💼", testimonial: "Grâce aux signaux IA de CryptoIA, j'ai pu identifier les meilleurs points d'entrée sur SOL et ETH. Mon portfolio a explosé!" },
  { name: "Julie L.", roi: "+185%", period: "4 mois", strategy: "Scalping AI", avatar: "👩‍💻", testimonial: "L'assistant IA m'a aidée à comprendre les patterns de marché. Je suis passée de débutante à trader rentable." },
  { name: "Alex R.", roi: "+520%", period: "8 mois", strategy: "Gem Hunter", avatar: "🧑‍🚀", testimonial: "Le Gem Hunter m'a permis de trouver des altcoins avant leur pump. INJ, RENDER, FET... tous identifiés en avance!" },
  { name: "Sophie M.", roi: "+98%", period: "3 mois", strategy: "Risk Management", avatar: "👩‍🔬", testimonial: "Ce qui m'a le plus aidé, c'est le module de Risk Management. J'ai appris à protéger mon capital tout en maximisant mes gains." },
];

export default function SuccessStories() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">⭐ Success Stories</h1>
        <p className="text-gray-400 mb-8">Découvrez les réussites de notre communauté</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STORIES.map((s, i) => (
            <div key={i} className="bg-[#111827] rounded-2xl border border-white/[0.06] p-8 hover:border-indigo-500/30 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center text-3xl">{s.avatar}</div>
                <div>
                  <h3 className="text-white font-bold text-lg">{s.name}</h3>
                  <p className="text-gray-400 text-sm">{s.strategy} • {s.period}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-emerald-400 text-2xl font-black">{s.roi}</p>
                  <p className="text-gray-500 text-xs">ROI</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed italic">"{s.testimonial}"</p>
              <div className="flex mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-yellow-400">⭐</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}