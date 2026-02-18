import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Award, Star, TrendingUp, Quote, ChevronLeft, ChevronRight, Users, Target, Zap } from "lucide-react";

const STORIES = [
  {
    name: "Marc D.",
    role: "Day Trader",
    location: "Paris, France",
    avatar: "🧑‍💼",
    profit: "+47,500$",
    period: "6 mois",
    rating: 5,
    quote: "L'IA de CryptoIA a complètement transformé mon trading. Les signaux sont précis et le Whale Watcher m'a permis d'anticiper plusieurs mouvements majeurs. Mon win rate est passé de 45% à 72%.",
    strategy: "Swing Trading + Signaux IA",
    highlight: "Win rate +27%",
  },
  {
    name: "Sophie L.",
    role: "Investisseuse Long Terme",
    location: "Montréal, Canada",
    avatar: "👩‍💻",
    profit: "+125,000$",
    period: "1 an",
    rating: 5,
    quote: "Le Fear & Greed Index combiné aux prédictions IA m'a aidée à identifier les meilleurs moments d'achat pendant le bear market. J'ai accumulé BTC et ETH aux plus bas et les résultats parlent d'eux-mêmes.",
    strategy: "DCA + Fear & Greed",
    highlight: "Portfolio x3",
  },
  {
    name: "Thomas R.",
    role: "Scalper Pro",
    location: "Bruxelles, Belgique",
    avatar: "👨‍🔬",
    profit: "+23,800$",
    period: "3 mois",
    rating: 4,
    quote: "Le Gem Hunter m'a fait découvrir des pépites avant qu'elles n'explosent. J'ai attrapé SOL à 20$, PEPE au début du pump, et plusieurs altcoins avec des x5-x10. L'outil est incroyable pour le timing.",
    strategy: "Gem Hunting + Analyse Technique",
    highlight: "3 trades x10",
  },
  {
    name: "Amira K.",
    role: "Portfolio Manager",
    location: "Genève, Suisse",
    avatar: "👩‍🏫",
    profit: "+89,200$",
    period: "8 mois",
    rating: 5,
    quote: "En tant que gestionnaire de portfolio, j'ai besoin d'outils fiables. CryptoIA offre les meilleures analyses on-chain et le Risk Management m'aide à protéger le capital de mes clients. Indispensable.",
    strategy: "Risk Management + On-Chain",
    highlight: "Max drawdown -8%",
  },
  {
    name: "Lucas P.",
    role: "Trader Débutant",
    location: "Lyon, France",
    avatar: "🧑‍🎓",
    profit: "+8,500$",
    period: "4 mois",
    rating: 5,
    quote: "J'ai commencé le trading il y a 4 mois sans aucune expérience. L'AI Assistant m'a tout appris : les bases, les stratégies, la gestion du risque. Aujourd'hui je suis profitable et confiant.",
    strategy: "AI Assistant + Formation",
    highlight: "De 0 à profitable",
  },
  {
    name: "Karim B.",
    role: "Whale Tracker",
    location: "Dubaï, EAU",
    avatar: "🧔",
    profit: "+210,000$",
    period: "1 an",
    rating: 5,
    quote: "Le Whale Watcher est mon outil #1. Suivre les mouvements des baleines m'a donné un avantage considérable. Quand les baleines accumulent, j'achète. Quand elles vendent, je sors. Simple et efficace.",
    strategy: "Whale Watching + Momentum",
    highlight: "ROI +420%",
  },
];

const STATS = [
  { icon: Users, value: "12,500+", label: "Traders Actifs" },
  { icon: TrendingUp, value: "68%", label: "Win Rate Moyen" },
  { icon: Target, value: "$2.4M+", label: "Profits Générés" },
  { icon: Zap, value: "4.8/5", label: "Note Moyenne" },
];

export default function SuccessStories() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Award className="w-8 h-8 text-amber-400" />
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Success Stories
            </h1>
          </div>
          <p className="text-gray-400 max-w-xl mx-auto">
            Découvrez comment nos traders utilisent CryptoIA pour générer des profits consistants
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center hover:border-amber-500/20 transition-all">
                <Icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Featured Story */}
        <div className="bg-gradient-to-r from-amber-500/[0.06] to-orange-500/[0.06] border border-amber-500/20 rounded-2xl p-8 mb-8 relative">
          <Quote className="w-10 h-10 text-amber-500/30 absolute top-6 right-6" />
          <div className="flex items-start gap-6">
            <span className="text-5xl">{STORIES[activeIndex].avatar}</span>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold">{STORIES[activeIndex].name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-bold border border-amber-500/20">
                  {STORIES[activeIndex].role}
                </span>
                <span className="text-xs text-gray-500">{STORIES[activeIndex].location}</span>
              </div>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < STORIES[activeIndex].rating ? "text-amber-400 fill-amber-400" : "text-gray-600"}`} />
                ))}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-4 italic">"{STORIES[activeIndex].quote}"</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                  💰 {STORIES[activeIndex].profit} en {STORIES[activeIndex].period}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400">
                  📊 {STORIES[activeIndex].strategy}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400">
                  🎯 {STORIES[activeIndex].highlight}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setActiveIndex((prev) => (prev - 1 + STORIES.length) % STORIES.length)}
              className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
              {STORIES.map((_, i) => (
                <button key={i} onClick={() => setActiveIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? "bg-amber-400 w-6" : "bg-white/[0.15]"}`} />
              ))}
            </div>
            <button onClick={() => setActiveIndex((prev) => (prev + 1) % STORIES.length)}
              className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* All Stories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STORIES.map((story, i) => (
            <div key={i}
              onClick={() => setActiveIndex(i)}
              className={`bg-white/[0.03] border rounded-xl p-5 cursor-pointer transition-all hover:bg-white/[0.05] ${
                i === activeIndex ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-white/[0.06]"
              }`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{story.avatar}</span>
                <div>
                  <h4 className="font-bold text-sm">{story.name}</h4>
                  <p className="text-[10px] text-gray-500">{story.role} — {story.location}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={`w-3 h-3 ${j < story.rating ? "text-amber-400 fill-amber-400" : "text-gray-600"}`} />
                ))}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 mb-3">"{story.quote}"</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-emerald-400">{story.profit}</span>
                <span className="text-[10px] text-gray-500">{story.period}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-[10px] text-gray-600 leading-relaxed">
            ⚠️ Les performances passées ne garantissent pas les résultats futurs. Le trading de crypto-monnaies comporte des risques significatifs.
            Ces témoignages représentent des expériences individuelles et ne constituent pas des conseils financiers.
            Investissez uniquement ce que vous pouvez vous permettre de perdre.
          </p>
        </div>
      </main>
    </div>
  );
}